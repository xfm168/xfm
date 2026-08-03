/**
 * P0-5A Foundation Core — 配置中心（Config Center）
 *
 * Foundation 系统的运行时配置中枢。
 *
 * 设计原则：
 *   - 集中托管：所有可配置项（school 权重 / threshold 阈值 / engine 优先级等）统一登记
 *   - 类型约束：每个 entry 显式声明 type，set 时按 type 校验
 *   - 可变性：mutable=false 的项禁止运行时 set（保护基准配置）
 *   - 变更通知：set 成功后通过 onChange 回调 + EventBus 广播 ConfigChanged
 *   - 序列化：toJSON/fromJSON 支持配置导入导出
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

import { globalLogger, ConfigError } from '../../shared'
import { globalEventBus, FoundationEvents } from '../eventbus/eventBus'

// ============================================================
// 类型定义
// ============================================================

/** 配置项类型 */
export type ConfigValueType = 'string' | 'number' | 'boolean' | 'object' | 'array'

/** 配置类别 */
export type ConfigCategory =
  | 'school'      // 流派权重（Ziping / Qiongtong / Modern 等）
  | 'weight'      // 通用权重
  | 'threshold'   // 决策阈值
  | 'runtime'     // 运行时开关
  | 'benchmark'   // 基准配置
  | 'review'      // 审核配置
  | 'engine'      // 引擎优先级
  | 'general'     // 通用

/**
 * 单条配置项
 */
export interface ConfigEntry {
  /** 配置 key（全局唯一，如 'school.ziping.weight'） */
  key: string
  /** 当前值 */
  value: any
  /** 默认值（reset 时恢复） */
  defaultValue: any
  /** 值类型 */
  type: ConfigValueType
  /** 描述 */
  description: string
  /** 是否可运行时修改（false 表示锁定） */
  mutable: boolean
  /** 类别（可选，便于按类别检索） */
  category?: ConfigCategory
}

/** 变更回调签名 */
export type ConfigChangeCallback = (newValue: any, oldValue: any) => void

// ============================================================
// ConfigCenter 类
// ============================================================

/**
 * 配置中心
 *
 * @example
 * import { globalConfig } from '@/lib/bazi/foundation/core'
 *
 * globalConfig.register({
 *   key: 'school.ziping.weight',
 *   value: 0.4,
 *   defaultValue: 0.4,
 *   type: 'number',
 *   description: '子平流派权重',
 *   mutable: true,
 *   category: 'school',
 * })
 *
 * globalConfig.onChange('school.ziping.weight', (nv, ov) => {
 *   console.log(`权重从 ${ov} 变为 ${nv}`)
 * })
 *
 * globalConfig.set('school.ziping.weight', 0.5)   // 触发回调 + ConfigChanged 事件
 * globalConfig.reset('school.ziping.weight')       // 回到 0.4
 */
export class ConfigCenter {
  /** 配置项表（按 key 索引） */
  private entries = new Map<string, ConfigEntry>()
  /** 变更回调表（按 key 索引） */
  private listeners = new Map<string, Set<ConfigChangeCallback>>()
  /** 注册顺序（用于稳定 list 输出） */
  private order: string[] = []

  constructor() {
    this.registerDefaults()
  }

  /**
   * 注册配置项
   * @param entry 配置项
   * @returns 是否注册成功（重复注册返回 false）
   */
  register(entry: ConfigEntry): boolean {
    if (this.entries.has(entry.key)) {
      globalLogger.warn('配置项已存在，跳过重复注册', { key: entry.key })
      return false
    }
    // 类型校验：value 必须符合 type 声明
    if (!this.matchesType(entry.value, entry.type)) {
      throw new ConfigError(
        `配置项 ${entry.key} 的 value 类型不匹配声明类型 ${entry.type}`,
        { code: 'FND-CONFIG-TYPE' },
      )
    }
    this.entries.set(entry.key, { ...entry })
    this.order.push(entry.key)
    return true
  }

  /**
   * 获取配置值
   * @param key 配置 key
   */
  get<T = any>(key: string): T | undefined {
    const entry = this.entries.get(key)
    if (!entry) return undefined
    return entry.value as T
  }

  /**
   * 设置配置值
   * @param key 配置 key
   * @param value 新值
   * @returns 是否设置成功（不可变 / 类型不匹配 / 不存在均返回 false）
   */
  set(key: string, value: any): boolean {
    const entry = this.entries.get(key)
    if (!entry) {
      globalLogger.warn('配置项不存在', { key })
      return false
    }
    if (!entry.mutable) {
      globalLogger.warn('配置项不可变，拒绝 set', { key })
      return false
    }
    if (!this.matchesType(value, entry.type)) {
      globalLogger.warn('配置项类型不匹配，拒绝 set', {
        key,
        expected: entry.type,
        got: typeof value,
      })
      return false
    }

    const oldValue = entry.value
    if (this.deepEqual(oldValue, value)) {
      // 值未变化，不触发事件
      return true
    }

    entry.value = value

    // 触发回调
    const callbacks = this.listeners.get(key)
    if (callbacks) {
      for (const cb of callbacks) {
        try {
          cb(value, oldValue)
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          globalLogger.error('ConfigCenter onChange 回调抛错', { key, error: msg })
        }
      }
    }

    // 通过 EventBus 广播
    globalEventBus.emitSync(FoundationEvents.ConfigChanged, {
      key,
      newValue: value,
      oldValue,
      category: entry.category,
    })

    return true
  }

  /**
   * 重置为默认值
   * @param key 配置 key
   * @returns 是否重置成功
   */
  reset(key: string): boolean {
    const entry = this.entries.get(key)
    if (!entry) return false
    return this.set(key, entry.defaultValue)
  }

  /**
   * 按类别检索配置项
   * @param category 类别
   */
  getCategory(category: ConfigCategory): ConfigEntry[] {
    const result: ConfigEntry[] = []
    for (const key of this.order) {
      const entry = this.entries.get(key)
      if (entry?.category === category) {
        result.push({ ...entry })
      }
    }
    return result
  }

  /**
   * 列出所有配置项
   */
  list(): ConfigEntry[] {
    return this.order.map(key => ({ ...this.entries.get(key)! }))
  }

  /**
   * 注册变更回调
   * @param key 配置 key
   * @param callback 回调
   */
  onChange(key: string, callback: ConfigChangeCallback): void {
    let set = this.listeners.get(key)
    if (!set) {
      set = new Set()
      this.listeners.set(key, set)
    }
    set.add(callback)
  }

  /**
   * 序列化为 JSON 字符串
   */
  toJSON(): string {
    const obj: Record<string, Omit<ConfigEntry, 'key'>> = {}
    for (const key of this.order) {
      const entry = this.entries.get(key)!
      const { key: _omit, ...rest } = entry
      obj[key] = rest
    }
    return JSON.stringify(obj, null, 2)
  }

  /**
   * 从 JSON 字符串反序列化
   * 已存在的 key 走 set 流程（复用校验与事件广播）；
   * 不存在的 key 自动注册（推断类型，默认可变），保证 toJSON/fromJSON 完整 roundtrip。
   * @param json JSON 字符串
   */
  fromJSON(json: string): void {
    let parsed: Record<string, any>
    try {
      parsed = JSON.parse(json)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new ConfigError(`ConfigCenter fromJSON 解析失败: ${msg}`, { code: 'FND-CONFIG-PARSE' })
    }

    for (const [key, val] of Object.entries(parsed)) {
      // 兼容两种 JSON 形态：
      //   1. 完整 ConfigEntry（来自 toJSON）：{ value, defaultValue, type, ... }
      //   2. 简单值：直接是 value
      const isFullEntry = val !== null && typeof val === 'object' && !Array.isArray(val)
        && 'value' in val && 'type' in val
      const value = isFullEntry ? val.value : val

      if (!this.entries.has(key)) {
        // 未注册 → 自动注册（类型从 value 推断，默认可变）
        const inferredType = this.inferType(value)
        const defaultValue = isFullEntry && 'defaultValue' in val ? val.defaultValue : value
        this.register({
          key,
          value,
          defaultValue,
          type: isFullEntry && typeof val.type === 'string' ? val.type : inferredType,
          description: isFullEntry && typeof val.description === 'string' ? val.description : `imported from JSON: ${key}`,
          mutable: isFullEntry && typeof val.mutable === 'boolean' ? val.mutable : true,
          category: isFullEntry && typeof val.category === 'string' ? (val.category as ConfigCategory) : 'general',
        })
        continue
      }
      // 已存在 → 走 set 流程，复用类型/可变性校验与事件广播
      this.set(key, value)
    }
  }

  // ─── 内部实现 ───────────────────────────────────

  /**
   * 类型匹配校验
   */
  private matchesType(value: any, type: ConfigValueType): boolean {
    switch (type) {
      case 'string':  return typeof value === 'string'
      case 'number':  return typeof value === 'number' && !Number.isNaN(value)
      case 'boolean': return typeof value === 'boolean'
      case 'object':  return typeof value === 'object' && value !== null && !Array.isArray(value)
      case 'array':   return Array.isArray(value)
      default: return false
    }
  }

  /**
   * 根据 JS 值推断配置类型（用于 fromJSON 自动注册）
   */
  private inferType(value: any): ConfigValueType {
    if (typeof value === 'string') return 'string'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (Array.isArray(value)) return 'array'
    if (value !== null && typeof value === 'object') return 'object'
    return 'string'
  }

  /**
   * 深度相等比较（基础类型 + 简单对象/数组）
   */
  private deepEqual(a: any, b: any): boolean {
    if (a === b) return true
    if (typeof a !== typeof b) return false
    if (a === null || b === null) return a === b
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false
      return a.every((v, i) => this.deepEqual(v, b[i]))
    }
    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a)
      const keysB = Object.keys(b)
      if (keysA.length !== keysB.length) return false
      return keysA.every(k => this.deepEqual(a[k], b[k]))
    }
    return false
  }

  /**
   * 预注册默认配置
   * 包含：流派权重 / 决策阈值 / 引擎优先级
   */
  private registerDefaults(): void {
    // ─── 流派权重（school） ───────────────────────────
    const schoolEntries: ConfigEntry[] = [
      {
        key: 'school.ziping.weight',
        value: 0.4,
        defaultValue: 0.4,
        type: 'number',
        description: '子平流派权重（子平真诠 / 渊海子平）',
        mutable: true,
        category: 'school',
      },
      {
        key: 'school.qiongtong.weight',
        value: 0.25,
        defaultValue: 0.25,
        type: 'number',
        description: '穷通宝鉴流派权重',
        mutable: true,
        category: 'school',
      },
      {
        key: 'school.modern.weight',
        value: 0.2,
        defaultValue: 0.2,
        type: 'number',
        description: '现代流派权重（新派八字）',
        mutable: true,
        category: 'school',
      },
      {
        key: 'school.dili.weight',
        value: 0.15,
        defaultValue: 0.15,
        type: 'number',
        description: '滴天髓流派权重',
        mutable: true,
        category: 'school',
      },
      {
        key: 'school.sanming.weight',
        value: 0.1,
        defaultValue: 0.1,
        type: 'number',
        description: '三命通会流派权重',
        mutable: true,
        category: 'school',
      },
    ]

    // ─── 决策阈值（threshold） ───────────────────────
    const thresholdEntries: ConfigEntry[] = [
      {
        key: 'threshold.gate.confidence',
        value: 0.6,
        defaultValue: 0.6,
        type: 'number',
        description: 'Rule Gate 通过所需最低置信度',
        mutable: true,
        category: 'threshold',
      },
      {
        key: 'threshold.minEvidenceCount',
        value: 3,
        defaultValue: 3,
        type: 'number',
        description: '决策所需最低证据数量',
        mutable: true,
        category: 'threshold',
      },
      {
        key: 'threshold.benchmark.minAccuracy',
        value: 0.8,
        defaultValue: 0.8,
        type: 'number',
        description: 'Benchmark 一致率下限（低于则报警）',
        mutable: true,
        category: 'threshold',
      },
      {
        key: 'threshold.case.similarity',
        value: 0.7,
        defaultValue: 0.7,
        type: 'number',
        description: '案例匹配相似度阈值',
        mutable: true,
        category: 'threshold',
      },
    ]

    // ─── 引擎优先级（engine） ────────────────────────
    const engineEntries: ConfigEntry[] = [
      {
        key: 'engine.priority.strength',
        value: 100,
        defaultValue: 100,
        type: 'number',
        description: 'StrengthEngine 优先级',
        mutable: true,
        category: 'engine',
      },
      {
        key: 'engine.priority.pattern',
        value: 90,
        defaultValue: 90,
        type: 'number',
        description: 'PatternEngine 优先级',
        mutable: true,
        category: 'engine',
      },
      {
        key: 'engine.priority.balance',
        value: 80,
        defaultValue: 80,
        type: 'number',
        description: 'BalanceEngine 优先级',
        mutable: true,
        category: 'engine',
      },
      {
        key: 'engine.priority.climate',
        value: 70,
        defaultValue: 70,
        type: 'number',
        description: 'ClimateEngine 优先级',
        mutable: true,
        category: 'engine',
      },
      {
        key: 'engine.priority.medicine',
        value: 60,
        defaultValue: 60,
        type: 'number',
        description: 'MedicineEngine 优先级',
        mutable: true,
        category: 'engine',
      },
      {
        key: 'engine.priority.bridge',
        value: 50,
        defaultValue: 50,
        type: 'number',
        description: 'BridgeEngine 优先级',
        mutable: true,
        category: 'engine',
      },
      {
        key: 'engine.priority.season',
        value: 40,
        defaultValue: 40,
        type: 'number',
        description: 'SeasonEngine 优先级',
        mutable: true,
        category: 'engine',
      },
    ]

    // ─── 运行时开关（runtime） ──────────────────────
    const runtimeEntries: ConfigEntry[] = [
      {
        key: 'runtime.explain.enabled',
        value: true,
        defaultValue: true,
        type: 'boolean',
        description: '是否生成 Explain 解释',
        mutable: true,
        category: 'runtime',
      },
      {
        key: 'runtime.conflict.autoResolve',
        value: true,
        defaultValue: true,
        type: 'boolean',
        description: '是否自动解决规则冲突',
        mutable: true,
        category: 'runtime',
      },
      {
        key: 'runtime.cache.enabled',
        value: true,
        defaultValue: true,
        type: 'boolean',
        description: '是否启用决策缓存',
        mutable: true,
        category: 'runtime',
      },
    ]

    const allDefaults = [
      ...schoolEntries,
      ...thresholdEntries,
      ...engineEntries,
      ...runtimeEntries,
    ]

    for (const entry of allDefaults) {
      // 绕过 register 中的"重复注册"日志（构造时注册）
      this.entries.set(entry.key, { ...entry })
      this.order.push(entry.key)
    }
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局配置中心单例 */
export const globalConfig = new ConfigCenter()

// 别名：服务容器统一以 globalConfigCenter 名称注册
export { globalConfig as globalConfigCenter }

export default globalConfig
