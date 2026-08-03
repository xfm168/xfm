/**
 * P0-5A Foundation Core — 占卜插件类型与抽象基类
 *
 * 定义 DivinationPlugin 的类型契约与 7 步统一生命周期抽象实现，
 * 并提供 BaZi / ZiWei / QiMen / LiuYao / FengShui 五种占卜插件的存根实现。
 *
 * 七层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

import type { Plugin } from '../../shared'

// ============================================================
// 生命周期与健康状态
// ============================================================

/**
 * 占卜插件生命周期状态
 *
 * 完整状态流转：
 *   uninstalled → installed → initializing → initialized → enabling → enabled
 *                                                                              ↓
 *   destroyed ← destroying ← disabled ← disabling
 */
export type DivinationPluginLifecycleState =
  | 'uninstalled'
  | 'installed'
  | 'initializing'
  | 'initialized'
  | 'enabling'
  | 'enabled'
  | 'disabling'
  | 'disabled'
  | 'destroying'
  | 'destroyed'
  | 'error'

/**
 * 占卜插件健康状态
 *
 * 用于 PluginManager 做健康巡检，衡量插件运行期状态。
 * customMetrics 可用于记录自定义指标（如排盘次数、缓存命中率等）。
 */
export interface DivinationPluginHealth {
  /** 健康等级 */
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown'
  /** 已运行时长（毫秒） */
  uptimeMs: number
  /** 最后一次健康检查的时间戳 */
  lastCheckAt: number
  /** 错误信息列表 */
  errors: string[]
  /** 自定义指标（可选） */
  customMetrics?: Record<string, number>
}

// ============================================================
// 占卜配置
// ============================================================

/**
 * 占卜插件配置
 *
 * 描述占卜类型（八字/紫微/奇门/六爻/风水 或自定义）、
 * 名称、简介、支持的能力特性列表与图标。
 */
export interface DivinationPluginConfig {
  /** 占卜类型 */
  divinationType: 'bazi' | 'ziwei' | 'qimen' | 'liuyao' | 'fengshui' | string
  /** 占卜名称（人类可读） */
  divinationName: string
  /** 占卜简介 */
  divinationDescription: string
  /** 支持的特性列表（如 ['排盘','格局','大运']） */
  supportsFeatures: string[]
  /** 图标（可选，如 emoji 或 URL） */
  icon?: string
}

// ============================================================
// DivinationPluginImpl 抽象基类
// ============================================================

/**
 * 占卜插件抽象基类
 *
 * 实现 Plugin 接口并提供 7 步统一生命周期的默认行为：
 *   install → initialize → enable → disable → destroy
 * 额外提供 health() 健康检查与 state 状态追踪。
 *
 * 子类只需实现抽象字段 id / name / version / divinationConfig 即可。
 */
export abstract class DivinationPluginImpl implements Plugin {
  // ---------- 抽象字段（子类必须实现） ----------

  /** 插件全局唯一 ID */
  abstract readonly id: string

  /** 插件名称（人类可读） */
  abstract readonly name: string

  /** 语义化版本号 */
  abstract readonly version: string

  /** 占卜配置 */
  abstract readonly divinationConfig: DivinationPluginConfig

  // ---------- Plugin 接口要求的字段（默认值，子类可覆盖） ----------

  /** 插件类型，默认为 'divination' */
  type: string = 'divination'

  /** 插件描述，默认取 divinationConfig.divinationDescription */
  get description(): string {
    return this.divinationConfig.divinationDescription
  }

  /** 依赖的其他插件 ID 列表，默认为空 */
  dependencies: string[] = []

  // ---------- 内部状态 ----------

  /** 内部生命周期状态 */
  protected _state: DivinationPluginLifecycleState = 'uninstalled'

  /** 启用时间戳（用于 uptime 计算） */
  protected _startedAt: number = 0

  /** 只读 getter：当前生命周期状态 */
  get state(): DivinationPluginLifecycleState {
    return this._state
  }

  // ============================================================
  // 7 步统一生命周期
  // ============================================================

  /**
   * 安装步骤（默认空实现）
   * 将状态从 uninstalled → installed
   */
  async install(): Promise<void> {
    this._state = 'installed'
  }

  /**
   * 初始化步骤（默认空实现）
   * 将状态从 installed → initializing → initialized
   */
  async initialize(): Promise<void> {
    this._state = 'initializing'
    try {
      this._state = 'initialized'
    } catch {
      this._state = 'error'
      throw undefined as never
    }
  }

  /**
   * 启用步骤（默认空实现）
   * 将状态从 initialized → enabling → enabled，记录启用时间戳
   */
  async enable(): Promise<void> {
    this._state = 'enabling'
    try {
      this._state = 'enabled'
      this._startedAt = Date.now()
    } catch {
      this._state = 'error'
      throw undefined as never
    }
  }

  /**
   * 禁用步骤（默认空实现）
   * 将状态从 enabled → disabling → disabled
   */
  async disable(): Promise<void> {
    this._state = 'disabling'
    try {
      this._state = 'disabled'
    } catch {
      this._state = 'error'
      throw undefined as never
    }
  }

  /**
   * 销毁步骤（默认空实现）
   * 将状态从 disabled → destroying → destroyed，清空启用时间戳
   */
  async destroy(): Promise<void> {
    this._state = 'destroying'
    try {
      this._state = 'destroyed'
      this._startedAt = 0
    } catch {
      this._state = 'error'
      throw undefined as never
    }
  }

  // ============================================================
  // 健康检查
  // ============================================================

  /**
   * 健康检查（默认返回 healthy）
   * 子类可覆盖以实现更精确的健康判断。
   *
   * 版本获取直接使用 this.version（Versioned 接口要求的 readonly 字段）。
   */
  health(): DivinationPluginHealth {
    const now = Date.now()
    const uptimeMs = this._startedAt > 0 ? now - this._startedAt : 0
    return {
      status: this._state === 'enabled' ? 'healthy' : 'unknown',
      uptimeMs,
      lastCheckAt: now,
      errors: [],
      customMetrics: {},
    }
  }

  // ============================================================
  // Plugin 接口兼容别名（Startable / Initializable / Disposable）
  // ============================================================

  /** Initializable.init() — 调用 initialize() */
  async init(): Promise<void> {
    await this.initialize()
  }

  /** Startable.start() — 调用 enable() */
  async start(): Promise<void> {
    await this.enable()
  }

  /** Startable.stop() — 调用 disable() */
  async stop(): Promise<void> {
    await this.disable()
  }

  /** Disposable.dispose() — 调用 destroy() */
  dispose(): void {
    void this.destroy()
  }
}

// ============================================================
// 五种具体占卜插件存根实现
// ============================================================

/**
 * 八字（BaZi）占卜插件存根
 *
 * 子平八字：排盘、格局、旺衰、喜用神、大运、流年
 */
export class BaZiPlugin extends DivinationPluginImpl {
  readonly id = 'bazi'
  readonly name = '八字引擎'
  readonly version = '1.0.0'

  readonly divinationConfig: DivinationPluginConfig = {
    divinationType: 'bazi',
    divinationName: '八字',
    divinationDescription: '子平八字推演，含四柱排盘、格局判定、旺衰分析、喜用神提取、大运流年',
    supportsFeatures: ['排盘', '格局', '旺衰', '喜用神', '大运', '流年'],
    icon: '☯',
  }
}

/**
 * 紫微斗数（ZiWei）占卜插件存根
 *
 * 命盘、格局、大限、流年
 */
export class ZiWeiPlugin extends DivinationPluginImpl {
  readonly id = 'ziwei'
  readonly name = '紫微斗数引擎'
  readonly version = '1.0.0'

  readonly divinationConfig: DivinationPluginConfig = {
    divinationType: 'ziwei',
    divinationName: '紫微斗数',
    divinationDescription: '紫微斗数排盘，含十二宫命盘、格局判定、大限流年推运',
    supportsFeatures: ['命盘', '格局', '大限', '流年'],
    icon: '✦',
  }
}

/**
 * 奇门遁甲（QiMen）占卜插件存根
 */
export class QiMenPlugin extends DivinationPluginImpl {
  readonly id = 'qimen'
  readonly name = '奇门遁甲引擎'
  readonly version = '1.0.0'

  readonly divinationConfig: DivinationPluginConfig = {
    divinationType: 'qimen',
    divinationName: '奇门遁甲',
    divinationDescription: '奇门遁甲排盘与占断',
    supportsFeatures: ['排盘', '格局', '占断'],
    icon: '🛡',
  }
}

/**
 * 六爻（LiuYao）占卜插件存根
 */
export class LiuYaoPlugin extends DivinationPluginImpl {
  readonly id = 'liuyao'
  readonly name = '六爻占卜引擎'
  readonly version = '1.0.0'

  readonly divinationConfig: DivinationPluginConfig = {
    divinationType: 'liuyao',
    divinationName: '六爻',
    divinationDescription: '六爻纳甲占卜，起卦、装卦、断卦',
    supportsFeatures: ['起卦', '装卦', '断卦'],
    icon: '☲',
  }
}

/**
 * 风水（FengShui）占卜插件存根
 */
export class FengShuiPlugin extends DivinationPluginImpl {
  readonly id = 'fengshui'
  readonly name = '风水堪舆引擎'
  readonly version = '1.0.0'

  readonly divinationConfig: DivinationPluginConfig = {
    divinationType: 'fengshui',
    divinationName: '风水堪舆',
    divinationDescription: '玄空飞星、八宅明镜等风水流派分析',
    supportsFeatures: ['飞星排盘', '八宅分析', '方位吉凶'],
    icon: '⛰',
  }
}
