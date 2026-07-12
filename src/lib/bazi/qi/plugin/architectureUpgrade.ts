/**
 * P3.17 ArchitectureUpgrade — 架构升级
 *
 * 玄风门核心架构升级：从单一八字系统升级为多术数共用 XuanFeng Core。
 *
 * 核心原则：
 *   - Kernel 永不修改
 *   - 全部通过 Plugin / Strategy / Rule / Extension / Event / Provider / Adapter 方式扩展
 *   - 未来支持：八字 / 紫微斗数 / 六爻 / 奇门 / 风水 / 姓名学
 *   - 所有术数系统共用 XuanFeng Core
 *
 * 古籍依据：
 *   《易经》："形而上者谓之道，形而下者谓之器。" — 核心为道，术数为器
 *   《道德经》："道生一，一生二，二生三，三生万物。" — 一个核心，衍生万法
 *   《论语》："君子不器。" — 不拘泥于单一术数，触类旁通
 *
 * 架构层次：
 *   ┌─────────────────────────────────────────────┐
 *   │         Application Layer（应用层）            │
 *   │   八字 | 紫微斗数 | 六爻 | 奇门 | 风水 | 姓名学  │
 *   ├─────────────────────────────────────────────┤
 *   │     Extension Layer（扩展层）                   │
 *   │   Plugin | Strategy | Rule | Extension         │
 *   │   Event  | Provider | Adapter                 │
 *   ├─────────────────────────────────────────────┤
 *   │        XuanFeng Core（玄风核心）                │
 *   │   不修改。所有术数系统共用。                       │
 *   └─────────────────────────────────────────────┘
 */

// ═══════════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════════

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

// ═══════════════════════════════════════════════════════════════
// 术数系统类型
// ═══════════════════════════════════════════════════════════════

/** 支持的术数系统 */
export type DivinationSystem =
  | 'bazi'        // 八字
  | 'ziwei'       // 紫微斗数
  | 'liuyao'      // 六爻
  | 'qimen'       // 奇门遁甲
  | 'fengshui'    // 风水
  | 'xingming'    // 姓名学
  | 'custom'      // 自定义扩展

/** 术数系统状态 */
export type SystemStatus = 'active' | 'inactive' | 'loading' | 'error'

/** 术数系统元数据 */
export interface SystemMeta {
  /** 系统标识 */
  id: DivinationSystem
  /** 系统中文名 */
  name: string
  /** 系统描述 */
  description: string
  /** 版本号 */
  version: string
  /** 兼容的 Kernel 版本 */
  kernelVersion: string
  /** 作者 */
  author?: string
  /** 古籍来源 */
  classicalSources: string[]
  /** 状态 */
  status: SystemStatus
}

// ═══════════════════════════════════════════════════════════════
// 1. Plugin 接口 — 插件
// ═══════════════════════════════════════════════════════════════

/** 插件生命周期 */
export type PluginLifecycle = 'init' | 'activate' | 'deactivate' | 'destroy'

/** 插件上下文 */
export interface PluginContext {
  /** 所属术数系统 */
  system: DivinationSystem
  /** Kernel 信息（只读） */
  kernelInfo: { version: string; hash: string }
  /** 事件总线 */
  eventBus: CoreEventBus
  /** 服务容器 */
  services: ServiceProvider
  /** 配置 */
  config: Record<string, unknown>
}

/** 插件接口 — 所有插件必须实现 */
export interface XuanFengPlugin {
  /** 插件唯一ID */
  readonly id: string
  /** 插件名称 */
  readonly name: string
  /** 插件版本 */
  readonly version: string
  /** 所属术数系统 */
  readonly system: DivinationSystem
  /** 插件描述 */
  readonly description?: string
  /** 依赖的其他插件ID */
  readonly dependencies?: string[]

  /** 生命周期：初始化 */
  init?(ctx: PluginContext): void
  /** 生命周期：激活 */
  activate?(ctx: PluginContext): void
  /** 生命周期：停用 */
  deactivate?(ctx: PluginContext): void
  /** 生命周期：销毁 */
  destroy?(ctx: PluginContext): void
}

// ═══════════════════════════════════════════════════════════════
// 2. Strategy 接口 — 策略
// ═══════════════════════════════════════════════════════════════

/** 策略类型 */
export type StrategyType =
  | '扶抑' | '调候' | '病药' | '通关' | '格局' | '旺衰' | '用神'
  | '星曜' | '宫位' | '四化' | '纳甲' | '世应' | '六亲'
  | '奇门' | '风水' | '姓名' | 'custom'

/** 策略分析输入 */
export interface StrategyInput {
  system: DivinationSystem
  data: Record<string, unknown>
  context: Record<string, unknown>
}

/** 策略分析输出 */
export interface StrategyOutput {
  applied: boolean
  result: Record<string, unknown>
  confidence: number
  reasoning: string[]
  references?: string[]
}

/** 策略接口 */
export interface XuanFengStrategy {
  readonly id: string
  readonly name: string
  readonly type: StrategyType
  readonly system: DivinationSystem
  readonly priority: number

  /** 分析 */
  analyze(input: StrategyInput): StrategyOutput
  /** 是否适用 */
  canApply(input: StrategyInput): boolean
}

// ═══════════════════════════════════════════════════════════════
// 3. Rule 接口 — 规则
// ═══════════════════════════════════════════════════════════════

/** 规则优先级层次 */
export type RulePriority = 'classic' | 'combo' | 'expert' | 'ai'

/** 规则条件 */
export interface RuleCondition {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'includes' | 'match'
  value: string | number | string[]
}

/** 规则接口 */
export interface XuanFengRule {
  readonly id: string
  readonly name: string
  readonly system: DivinationSystem
  readonly category: string
  readonly priority: RulePriority
  readonly source: string
  readonly description: string
  readonly conditions: RuleCondition[]
  readonly enabled: boolean

  /** 评估规则是否命中 */
  evaluate(context: Record<string, unknown>): boolean
  /** 获取结论 */
  getConclusion?(): string
}

// ═══════════════════════════════════════════════════════════════
// 4. Extension 接口 — 扩展点
// ═══════════════════════════════════════════════════════════════

/** 扩展点类型 */
export type ExtensionPoint =
  | 'preProcess'      // 预处理
  | 'postProcess'     // 后处理
  | 'enrichExplain'   // 丰富解释
  | 'validateResult'  // 验证结果
  | 'formatOutput'    // 格式化输出
  | 'custom'          // 自定义

/** 扩展点接口 */
export interface XuanFengExtension {
  readonly id: string
  readonly name: string
  readonly system: DivinationSystem
  readonly point: ExtensionPoint
  readonly description?: string
  readonly order: number

  /** 执行扩展逻辑 */
  extend(data: Record<string, unknown>): Record<string, unknown>
}

// ═══════════════════════════════════════════════════════════════
// 5. Event 接口 — 事件
// ═══════════════════════════════════════════════════════════════

/** 核心事件类型 */
export interface CoreEvent {
  type: string
  system: DivinationSystem
  source: string
  data: Record<string, unknown>
  timestamp: string
  propagated: boolean
}

/** 事件处理器 */
export type CoreEventHandler = (event: CoreEvent) => void | boolean

/** 事件总线 — 跨术数系统通信 */
export class CoreEventBus {
  private handlers: Map<string, Set<CoreEventHandler>> = new Map()
  private history: CoreEvent[] = []
  private maxHistory: number = 500

  /** 订阅事件 */
  on(eventType: string, handler: CoreEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set())
    }
    this.handlers.get(eventType)!.add(handler)
  }

  /** 订阅一次 */
  once(eventType: string, handler: CoreEventHandler): void {
    const wrapper: CoreEventHandler = (event) => {
      handler(event)
      this.off(eventType, wrapper)
    }
    this.on(eventType, wrapper)
  }

  /** 取消订阅 */
  off(eventType: string, handler: CoreEventHandler): void {
    this.handlers.get(eventType)?.delete(handler)
  }

  /** 发布事件 */
  emit(event: CoreEvent): void {
    this.history.push(event)
    if (this.history.length > this.maxHistory) {
      this.history.shift()
    }
    const handlers = this.handlers.get(event.type)
    if (handlers) {
      for (const handler of handlers) {
        const result = handler(event)
        if (result === false) {
          event.propagated = false
          break
        }
      }
    }
  }

  /** 获取事件历史 */
  getHistory(): CoreEvent[] {
    return [...this.history]
  }

  /** 清空历史 */
  clearHistory(): void {
    this.history = []
  }

  /** 获取已注册的事件类型 */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys())
  }
}

// ═══════════════════════════════════════════════════════════════
// 6. Provider 接口 — 服务提供者
// ═══════════════════════════════════════════════════════════════

/** 服务标识 */
export type ServiceId = string

/** 服务工厂函数 */
export type ServiceFactory<T = unknown> = (container: ServiceProvider) => T

/** 服务注册项 */
export interface ServiceRegistration<T = unknown> {
  id: ServiceId
  factory: ServiceFactory<T>
  singleton: boolean
  instance?: T
}

/** 服务提供者 — 依赖注入容器 */
export class ServiceProvider {
  private registrations: Map<ServiceId, ServiceRegistration> = new Map()
  private instances: Map<ServiceId, unknown> = new Map()

  /** 注册服务 */
  register<T>(id: ServiceId, factory: ServiceFactory<T>, singleton: boolean = true): void {
    this.registrations.set(id, { id, factory, singleton })
  }

  /** 注册实例（直接提供已创建的对象） */
  registerInstance<T>(id: ServiceId, instance: T): void {
    this.instances.set(id, instance)
  }

  /** 获取服务 */
  resolve<T>(id: ServiceId): T | null {
    // 先检查实例缓存
    if (this.instances.has(id)) {
      return this.instances.get(id) as T
    }

    const reg = this.registrations.get(id)
    if (!reg) return null

    const instance = reg.factory(this)

    if (reg.singleton) {
      this.instances.set(id, instance)
    }

    return instance as T
  }

  /** 检查服务是否已注册 */
  has(id: ServiceId): boolean {
    return this.registrations.has(id) || this.instances.has(id)
  }

  /** 取消注册 */
  unregister(id: ServiceId): boolean {
    this.instances.delete(id)
    return this.registrations.delete(id)
  }

  /** 获取所有已注册的服务ID */
  getRegisteredServices(): ServiceId[] {
    return Array.from(this.registrations.keys())
  }

  /** 清空所有 */
  clear(): void {
    this.registrations.clear()
    this.instances.clear()
  }
}

// ═══════════════════════════════════════════════════════════════
// 7. Adapter 接口 — 适配器
// ═══════════════════════════════════════════════════════════════

/** 适配器接口 — 将不同术数系统的数据格式适配为统一格式 */
export interface XuanFengAdapter {
  readonly id: string
  readonly name: string
  readonly system: DivinationSystem
  readonly description?: string

  /** 将术数系统特有数据转换为统一格式 */
  toUnified(raw: Record<string, unknown>): Record<string, unknown>
  /** 将统一格式转换回术数系统特有格式 */
  fromUnified(unified: Record<string, unknown>): Record<string, unknown>
  /** 验证原始数据格式 */
  validate(raw: Record<string, unknown>): boolean
}

// ═══════════════════════════════════════════════════════════════
// 术数系统注册项
// ═══════════════════════════════════════════════════════════════

/** 术数系统注册项 — 捆绑该系统的全部组件 */
export interface SystemRegistration {
  meta: SystemMeta
  plugins: XuanFengPlugin[]
  strategies: XuanFengStrategy[]
  rules: XuanFengRule[]
  extensions: XuanFengExtension[]
  adapters: XuanFengAdapter[]
  /** 系统级服务注册 */
  services?: Array<{ id: ServiceId; factory: ServiceFactory }>
}

// ═══════════════════════════════════════════════════════════════
// 架构健康报告
// ═══════════════════════════════════════════════════════════════

/** 组件统计 */
export interface ComponentStats {
  plugins: number
  strategies: number
  rules: number
  extensions: number
  adapters: number
  events: number
  services: number
}

/** 系统健康报告 */
export interface ArchitectureReport {
  generatedAt: string
  /** 所有已注册的术数系统 */
  systems: SystemMeta[]
  /** 各系统组件统计 */
  systemStats: Record<string, ComponentStats>
  /** 全局组件统计 */
  totalStats: ComponentStats
  /** Kernel 完整性 */
  kernelIntact: boolean
  /** 是否有冲突 */
  conflicts: string[]
  /** 评分 0-100 */
  overallScore: number
  /** 建议 */
  suggestions: string[]
  /** 报告文本 */
  report: string
  /** 古籍引用 */
  classicalRef: string
}

// ═══════════════════════════════════════════════════════════════
// 内置：八字系统元数据
// ═══════════════════════════════════════════════════════════════

/** 八字系统元数据 */
export const BAZI_SYSTEM_META: SystemMeta = {
  id: 'bazi',
  name: '八字命理',
  description: '以四柱八字为核心的命理推演系统',
  version: '3.0.0',
  kernelVersion: '2.0.0',
  author: '玄风门',
  classicalSources: ['滴天髓', '穷通宝鉴', '子平真诠', '三命通会', '渊海子平'],
  status: 'active',
}

/** 紫微斗数系统元数据 */
export const ZIWEI_SYSTEM_META: SystemMeta = {
  id: 'ziwei',
  name: '紫微斗数',
  description: '以星曜入宫为核心的命理推演系统',
  version: '1.0.0',
  kernelVersion: '2.0.0',
  author: '玄风门',
  classicalSources: ['紫微斗数全书', '太微赋', '骨髓赋', '形性赋'],
  status: 'inactive',
}

/** 六爻系统元数据 */
export const LIUYAO_SYSTEM_META: SystemMeta = {
  id: 'liuyao',
  name: '六爻占卜',
  description: '以纳甲六亲为核心的占卜系统',
  version: '1.0.0',
  kernelVersion: '2.0.0',
  author: '玄风门',
  classicalSources: ['增删卜易', '卜筮正宗', '黄金策', '易隐'],
  status: 'inactive',
}

/** 奇门遁甲系统元数据 */
export const QIMEN_SYSTEM_META: SystemMeta = {
  id: 'qimen',
  name: '奇门遁甲',
  description: '以天地人神四盘为核心的择时系统',
  version: '1.0.0',
  kernelVersion: '2.0.0',
  author: '玄风门',
  classicalSources: ['烟波钓叟歌', '奇门遁甲秘笈', '大六壬金口诀'],
  status: 'inactive',
}

/** 风水系统元数据 */
export const FENGSHUI_SYSTEM_META: SystemMeta = {
  id: 'fengshui',
  name: '风水堪舆',
  description: '以形势理气为核心的环境堪察系统',
  version: '1.0.0',
  kernelVersion: '2.0.0',
  author: '玄风门',
  classicalSources: ['葬经', '撼龙经', '疑龙经', '青囊经', '天玉经'],
  status: 'inactive',
}

/** 姓名学系统元数据 */
export const XINGMING_SYSTEM_META: SystemMeta = {
  id: 'xingming',
  name: '姓名学',
  description: '以五格剖象为核心的姓名分析系统',
  version: '1.0.0',
  kernelVersion: '2.0.0',
  author: '玄风门',
  classicalSources: ['姓名学精要', '五格剖象法', '三才五格'],
  status: 'inactive',
}

/** 全部内置系统元数据 */
export const ALL_SYSTEM_METAS: SystemMeta[] = [
  BAZI_SYSTEM_META,
  ZIWEI_SYSTEM_META,
  LIUYAO_SYSTEM_META,
  QIMEN_SYSTEM_META,
  FENGSHUI_SYSTEM_META,
  XINGMING_SYSTEM_META,
]

// ═══════════════════════════════════════════════════════════════
// 古籍引用池
// ═══════════════════════════════════════════════════════════════

const CLASSICAL_QUOTES: readonly string[] = [
  '《易经》："形而上者谓之道，形而下者谓之器。" — 核心为道，术数为器，万法归一。',
  '《道德经》："道生一，一生二，二生三，三生万物。" — 一个 XuanFeng Core，衍生万般术数。',
  '《论语》："君子不器。" — 不拘泥于单一术数，触类旁通方能大成。',
  '《易经》："天下同归而殊途，一致而百虑。" — 术数虽异，其理相通。',
  '《道德经》："上善若水。" — 优秀的架构如水般包容万物、利而不争。',
  '《荀子》："君子生非异也，善假于物也。" — 善用 Plugin/Strategy/Adapter，以有限御无限。',
  '《易经》："穷则变，变则通，通则久。" — 架构需因时而变，方能持久演进。',
  '《大学》："物有本末，事有终始。" — Kernel 为本，Plugin 为末，本立而道生。',
]

const SUGGESTION_POOL: readonly string[] = [
  '建议为紫微斗数系统注册更多星曜策略，以提升分析覆盖率。',
  '六爻系统尚缺少纳甲适配器，建议优先实现 Adapter 层。',
  '奇门遁甲系统可复用八字系统的时辰计算 Provider，避免重复造轮子。',
  '风水系统的形势分析可通过 Extension 扩展点接入八字的五行引擎。',
  '姓名学系统建议注册独立的五格剖象 Rule，不与八字规则混用。',
  '跨术数系统通信建议统一使用 CoreEventBus，避免直接 import。',
  '建议为每个术数系统编写独立的 RegressionSuite，纳入回归中心管理。',
  'Plugin 依赖关系建议在 init 阶段做拓扑排序，确保加载顺序正确。',
  'Adapter 层应覆盖双向转换测试，确保数据无损。',
  'Strategy 的 priority 建议按术数系统分别管理，避免跨系统冲突。',
]

// ═══════════════════════════════════════════════════════════════
// ArchitectureHub — 架构中心
// ═══════════════════════════════════════════════════════════════

/**
 * 架构中心 — 管理所有术数系统的注册、组件发现和健康监控。
 *
 * 这是 P3.17 的核心类，不修改 Kernel，纯 Plugin 层。
 */
export class ArchitectureHub {
  /** 已注册的术数系统 */
  private systems: Map<DivinationSystem, SystemRegistration> = new Map()
  /** 插件索引 */
  private pluginIndex: Map<string, XuanFengPlugin> = new Map()
  /** 策略索引（按系统分组） */
  private strategyIndex: Map<DivinationSystem, XuanFengStrategy[]> = new Map()
  /** 规则索引（按系统分组） */
  private ruleIndex: Map<DivinationSystem, XuanFengRule[]> = new Map()
  /** 扩展点索引（按系统分组） */
  private extensionIndex: Map<DivinationSystem, XuanFengExtension[]> = new Map()
  /** 适配器索引（按系统分组） */
  private adapterIndex: Map<DivinationSystem, XuanFengAdapter[]> = new Map()
  /** 全局事件总线 */
  readonly eventBus: CoreEventBus
  /** 全局服务容器 */
  readonly services: ServiceProvider
  /** Kernel 完整性标记 */
  private kernelIntact: boolean = true

  constructor() {
    this.eventBus = new CoreEventBus()
    this.services = new ServiceProvider()

    // 注册内置核心服务
    this.registerCoreServices()
  }

  // ─── 系统注册 ────────────────────────────────────

  /** 注册术数系统 */
  registerSystem(reg: SystemRegistration): void {
    const systemId = reg.meta.id

    if (this.systems.has(systemId)) {
      throw new Error(`术数系统 ${systemId} 已注册`)
    }

    this.systems.set(systemId, reg)

    // 索引插件
    for (const plugin of reg.plugins) {
      this.pluginIndex.set(plugin.id, plugin)
    }

    // 索引策略
    if (!this.strategyIndex.has(systemId)) {
      this.strategyIndex.set(systemId, [])
    }
    this.strategyIndex.get(systemId)!.push(...reg.strategies)
    this.strategyIndex.get(systemId)!.sort((a, b) => b.priority - a.priority)

    // 索引规则
    if (!this.ruleIndex.has(systemId)) {
      this.ruleIndex.set(systemId, [])
    }
    this.ruleIndex.get(systemId)!.push(...reg.rules)

    // 索引扩展点
    if (!this.extensionIndex.has(systemId)) {
      this.extensionIndex.set(systemId, [])
    }
    this.extensionIndex.get(systemId)!.push(...reg.extensions)
    this.extensionIndex.get(systemId)!.sort((a, b) => a.order - b.order)

    // 索引适配器
    if (!this.adapterIndex.has(systemId)) {
      this.adapterIndex.set(systemId, [])
    }
    this.adapterIndex.get(systemId)!.push(...reg.adapters)

    // 注册系统级服务
    if (reg.services) {
      for (const svc of reg.services) {
        this.services.register(svc.id, svc.factory)
      }
    }

    // 发布系统注册事件
    this.eventBus.emit({
      type: 'system:registered',
      system: systemId,
      source: 'ArchitectureHub',
      data: { name: reg.meta.name, version: reg.meta.version },
      timestamp: new Date().toISOString(),
      propagated: true,
    })
  }

  /** 注销术数系统 */
  unregisterSystem(systemId: DivinationSystem): boolean {
    const reg = this.systems.get(systemId)
    if (!reg) return false

    // 移除插件索引
    for (const plugin of reg.plugins) {
      this.pluginIndex.delete(plugin.id)
    }

    // 移除各索引
    this.strategyIndex.delete(systemId)
    this.ruleIndex.delete(systemId)
    this.extensionIndex.delete(systemId)
    this.adapterIndex.delete(systemId)

    this.systems.delete(systemId)

    this.eventBus.emit({
      type: 'system:unregistered',
      system: systemId,
      source: 'ArchitectureHub',
      data: {},
      timestamp: new Date().toISOString(),
      propagated: true,
    })

    return true
  }

  /** 获取所有已注册的系统 */
  getRegisteredSystems(): SystemMeta[] {
    return Array.from(this.systems.values()).map((r) => r.meta)
  }

  /** 检查系统是否已注册 */
  hasSystem(systemId: DivinationSystem): boolean {
    return this.systems.has(systemId)
  }

  /** 获取系统元数据 */
  getSystemMeta(systemId: DivinationSystem): SystemMeta | null {
    return this.systems.get(systemId)?.meta ?? null
  }

  /** 激活系统 */
  activateSystem(systemId: DivinationSystem): boolean {
    const reg = this.systems.get(systemId)
    if (!reg) return false
    reg.meta.status = 'active'

    // 激活所有插件
    const ctx: PluginContext = {
      system: systemId,
      kernelInfo: { version: '2.0.0', hash: 'sha256-placeholder' },
      eventBus: this.eventBus,
      services: this.services,
      config: {},
    }
    for (const plugin of reg.plugins) {
      plugin.activate?.(ctx)
    }

    this.eventBus.emit({
      type: 'system:activated',
      system: systemId,
      source: 'ArchitectureHub',
      data: {},
      timestamp: new Date().toISOString(),
      propagated: true,
    })
    return true
  }

  /** 停用系统 */
  deactivateSystem(systemId: DivinationSystem): boolean {
    const reg = this.systems.get(systemId)
    if (!reg) return false
    reg.meta.status = 'inactive'

    const ctx: PluginContext = {
      system: systemId,
      kernelInfo: { version: '2.0.0', hash: 'sha256-placeholder' },
      eventBus: this.eventBus,
      services: this.services,
      config: {},
    }
    for (const plugin of reg.plugins) {
      plugin.deactivate?.(ctx)
    }

    this.eventBus.emit({
      type: 'system:deactivated',
      system: systemId,
      source: 'ArchitectureHub',
      data: {},
      timestamp: new Date().toISOString(),
      propagated: true,
    })
    return true
  }

  // ─── 插件管理 ────────────────────────────────────

  /** 注册单个插件 */
  registerPlugin(plugin: XuanFengPlugin): void {
    if (this.pluginIndex.has(plugin.id)) {
      throw new Error(`插件 ${plugin.id} 已存在`)
    }
    this.pluginIndex.set(plugin.id, plugin)

    // 添加到系统索引
    if (!this.strategyIndex.has(plugin.system)) {
      // 插件不属于策略，但确保系统存在
    }
  }

  /** 获取所有插件 */
  getAllPlugins(): XuanFengPlugin[] {
    return Array.from(this.pluginIndex.values())
  }

  /** 按系统获取插件 */
  getPluginsBySystem(system: DivinationSystem): XuanFengPlugin[] {
    return this.getAllPlugins().filter((p) => p.system === system)
  }

  /** 获取插件 */
  getPlugin(id: string): XuanFengPlugin | null {
    return this.pluginIndex.get(id) ?? null
  }

  // ─── 策略管理 ────────────────────────────────────

  /** 按系统获取策略 */
  getStrategiesBySystem(system: DivinationSystem): XuanFengStrategy[] {
    return [...(this.strategyIndex.get(system) ?? [])]
  }

  /** 按类型获取策略 */
  getStrategiesByType(system: DivinationSystem, type: StrategyType): XuanFengStrategy[] {
    return this.getStrategiesBySystem(system).filter((s) => s.type === type)
  }

  /** 执行策略分析 */
  runStrategies(input: StrategyInput): StrategyOutput[] {
    const strategies = this.getStrategiesBySystem(input.system)
    const results: StrategyOutput[] = []

    for (const strategy of strategies) {
      if (strategy.canApply(input)) {
        const output = strategy.analyze(input)
        if (output.applied) {
          results.push(output)
        }
      }
    }

    return results
  }

  // ─── 规则管理 ────────────────────────────────────

  /** 按系统获取规则 */
  getRulesBySystem(system: DivinationSystem): XuanFengRule[] {
    return [...(this.ruleIndex.get(system) ?? [])]
  }

  /** 按优先级获取规则 */
  getRulesByPriority(system: DivinationSystem, priority: RulePriority): XuanFengRule[] {
    return this.getRulesBySystem(system).filter((r) => r.priority === priority && r.enabled)
  }

  /** 评估规则 */
  evaluateRules(system: DivinationSystem, context: Record<string, unknown>): XuanFengRule[] {
    const rules = this.getRulesBySystem(system).filter((r) => r.enabled)
    return rules.filter((r) => r.evaluate(context))
  }

  // ─── 扩展点管理 ──────────────────────────────────

  /** 按系统获取扩展点 */
  getExtensionsBySystem(system: DivinationSystem): XuanFengExtension[] {
    return [...(this.extensionIndex.get(system) ?? [])]
  }

  /** 按扩展点类型获取 */
  getExtensionsByPoint(system: DivinationSystem, point: ExtensionPoint): XuanFengExtension[] {
    return this.getExtensionsBySystem(system).filter((e) => e.point === point)
  }

  /** 执行扩展点链 */
  runExtensions(system: DivinationSystem, point: ExtensionPoint, data: Record<string, unknown>): Record<string, unknown> {
    const extensions = this.getExtensionsByPoint(system, point)
    let result = { ...data }
    for (const ext of extensions) {
      result = ext.extend(result)
    }
    return result
  }

  // ─── 适配器管理 ──────────────────────────────────

  /** 按系统获取适配器 */
  getAdaptersBySystem(system: DivinationSystem): XuanFengAdapter[] {
    return [...(this.adapterIndex.get(system) ?? [])]
  }

  /** 执行适配器转换 */
  adaptToUnified(system: DivinationSystem, raw: Record<string, unknown>): Record<string, unknown> {
    const adapters = this.getAdaptersBySystem(system)
    let result = { ...raw }
    for (const adapter of adapters) {
      result = adapter.toUnified(result)
    }
    return result
  }

  /** 执行适配器反向转换 */
  adaptFromUnified(system: DivinationSystem, unified: Record<string, unknown>): Record<string, unknown> {
    const adapters = [...this.getAdaptersBySystem(system)].reverse()
    let result = { ...unified }
    for (const adapter of adapters) {
      result = adapter.fromUnified(result)
    }
    return result
  }

  // ─── Kernel 完整性 ──────────────────────────────

  /** 标记 Kernel 完整性 */
  markKernelIntact(intact: boolean): void {
    this.kernelIntact = intact
  }

  /** 检查 Kernel 是否完整 */
  isKernelIntact(): boolean {
    return this.kernelIntact
  }

  // ─── 内部方法 ────────────────────────────────────

  /** 注册核心服务 */
  private registerCoreServices(): void {
    this.services.register('eventBus', () => this.eventBus)
    this.services.register('architectureHub', () => this)
  }

  // ─── 统计与报告 ──────────────────────────────────

  /** 获取系统组件统计 */
  getSystemStats(system: DivinationSystem): ComponentStats {
    return {
      plugins: this.getPluginsBySystem(system).length,
      strategies: this.getStrategiesBySystem(system).length,
      rules: this.getRulesBySystem(system).length,
      extensions: this.getExtensionsBySystem(system).length,
      adapters: this.getAdaptersBySystem(system).length,
      events: this.eventBus.getHistory().filter((e) => e.system === system).length,
      services: this.services.getRegisteredServices().length,
    }
  }

  /** 获取全局组件统计 */
  getTotalStats(): ComponentStats {
    const systems = this.getRegisteredSystems()
    let total: ComponentStats = {
      plugins: 0, strategies: 0, rules: 0, extensions: 0, adapters: 0, events: 0, services: 0,
    }
    for (const meta of systems) {
      const stats = this.getSystemStats(meta.id)
      total.plugins += stats.plugins
      total.strategies += stats.strategies
      total.rules += stats.rules
      total.extensions += stats.extensions
      total.adapters += stats.adapters
      total.events += stats.events
      total.services += stats.services
    }
    return total
  }

  /** 检测冲突 */
  detectConflicts(): string[] {
    const conflicts: string[] = []

    // 检查插件ID重复
    const pluginIds = new Set<string>()
    for (const plugin of this.getAllPlugins()) {
      if (pluginIds.has(plugin.id)) {
        conflicts.push(`插件ID重复: ${plugin.id}`)
      }
      pluginIds.add(plugin.id)
    }

    // 检查策略ID重复
    const strategyIds = new Set<string>()
    for (const [, strategies] of this.strategyIndex) {
      for (const s of strategies) {
        if (strategyIds.has(s.id)) {
          conflicts.push(`策略ID重复: ${s.id}`)
        }
        strategyIds.add(s.id)
      }
    }

    // 检查规则ID重复
    const ruleIds = new Set<string>()
    for (const [, rules] of this.ruleIndex) {
      for (const r of rules) {
        if (ruleIds.has(r.id)) {
          conflicts.push(`规则ID重复: ${r.id}`)
        }
        ruleIds.add(r.id)
      }
    }

    // 检查 Kernel 完整性
    if (!this.kernelIntact) {
      conflicts.push('Kernel 完整性受损')
    }

    return conflicts
  }

  /** 生成架构报告 */
  getReport(): ArchitectureReport {
    const systems = this.getRegisteredSystems()
    const systemStats: Record<string, ComponentStats> = {}
    for (const meta of systems) {
      systemStats[meta.id] = this.getSystemStats(meta.id)
    }
    const totalStats = this.getTotalStats()
    const conflicts = this.detectConflicts()
    const kernelIntact = this.kernelIntact

    // 评分
    const systemCount = systems.length
    const componentCount = totalStats.plugins + totalStats.strategies + totalStats.rules + totalStats.extensions + totalStats.adapters
    const conflictPenalty = conflicts.length * 10
    const kernelPenalty = kernelIntact ? 0 : 30
    const baseScore = Math.min(100, 40 + systemCount * 8 + componentCount * 2)
    const overallScore = Math.max(0, baseScore - conflictPenalty - kernelPenalty)

    // 建议
    const suggestions = this.generateSuggestions(systems, totalStats, conflicts)

    // 古籍引用
    const classicalRef = pick(CLASSICAL_QUOTES)

    // 报告文本
    const report = this.generateReportText(systems, systemStats, totalStats, conflicts, kernelIntact, overallScore, suggestions, classicalRef)

    return {
      generatedAt: new Date().toISOString(),
      systems,
      systemStats,
      totalStats,
      kernelIntact,
      conflicts,
      overallScore,
      suggestions,
      report,
      classicalRef,
    }
  }

  /** 生成建议 */
  private generateSuggestions(
    systems: SystemMeta[],
    totalStats: ComponentStats,
    conflicts: string[],
  ): string[] {
    const suggestions: string[] = []

    if (conflicts.length > 0) {
      suggestions.push(`检测到 ${conflicts.length} 个冲突，建议立即修复：${conflicts.slice(0, 3).join('；')}`)
    }

    if (systems.length < 6) {
      const missing = ['ziwei', 'liuyao', 'qimen', 'fengshui', 'xingming'].filter(
        (s) => !systems.some((sys) => sys.id === s),
      )
      if (missing.length > 0) {
        suggestions.push(`尚有 ${missing.length} 个术数系统未注册，建议按优先级逐步接入。`)
      }
    }

    if (totalStats.adapters === 0) {
      suggestions.push('当前无适配器注册，建议为每个术数系统实现 Adapter 层以确保数据互通。')
    }

    if (totalStats.strategies < 5) {
      suggestions.push('策略数量偏少，建议为各术数系统注册更多分析策略。')
    }

    // 随机补充
    const extras = pickN(SUGGESTION_POOL, 2)
    suggestions.push(...extras)

    return [...new Set(suggestions)].slice(0, 6)
  }

  /** 生成报告文本 */
  private generateReportText(
    systems: SystemMeta[],
    systemStats: Record<string, ComponentStats>,
    totalStats: ComponentStats,
    conflicts: string[],
    kernelIntact: boolean,
    overallScore: number,
    suggestions: string[],
    classicalRef: string,
  ): string {
    const lines: string[] = []

    lines.push('══════════════════════════════════════════════════')
    lines.push('         玄风门 · 架构升级报告')
    lines.push('══════════════════════════════════════════════════')
    lines.push('')

    // ── 一、架构概览 ──
    lines.push('【一、架构概览】')
    lines.push(`  已注册术数系统：${systems.length} 个`)
    lines.push(`  Kernel 完整性：${kernelIntact ? '✓ 完好无损' : '✗ 已被修改（严重警告）'}`)
    lines.push(`  架构评分：${overallScore} / 100`)
    lines.push(`  冲突数量：${conflicts.length}`)
    lines.push('')

    // ── 二、术数系统清单 ──
    lines.push('【二、术数系统清单】')
    for (const meta of systems) {
      const statusIcon = meta.status === 'active' ? '●' : meta.status === 'inactive' ? '○' : '▲'
      lines.push(`  ${statusIcon} ${meta.name}（${meta.id}）v${meta.version}`)
      lines.push(`      古籍来源：${meta.classicalSources.join('、')}`)
      const stats = systemStats[meta.id]
      if (stats) {
        lines.push(`      组件：Plugin ${stats.plugins} | Strategy ${stats.strategies} | Rule ${stats.rules} | Extension ${stats.extensions} | Adapter ${stats.adapters}`)
      }
    }
    lines.push('')

    // ── 三、全局组件统计 ──
    lines.push('【三、全局组件统计】')
    lines.push(`  Plugin（插件）：${totalStats.plugins}`)
    lines.push(`  Strategy（策略）：${totalStats.strategies}`)
    lines.push(`  Rule（规则）：${totalStats.rules}`)
    lines.push(`  Extension（扩展点）：${totalStats.extensions}`)
    lines.push(`  Adapter（适配器）：${totalStats.adapters}`)
    lines.push(`  Event（事件）：${totalStats.events}`)
    lines.push(`  Service（服务）：${totalStats.services}`)
    lines.push('')

    // ── 四、扩展机制 ──
    lines.push('【四、扩展机制】')
    lines.push('  七大扩展方式：')
    lines.push('    1. Plugin     — 插件（生命周期管理）')
    lines.push('    2. Strategy   — 策略（分析逻辑插拔）')
    lines.push('    3. Rule       — 规则（条件判断）')
    lines.push('    4. Extension  — 扩展点（预处理/后处理）')
    lines.push('    5. Event      — 事件（跨系统通信）')
    lines.push('    6. Provider   — 服务提供者（依赖注入）')
    lines.push('    7. Adapter    — 适配器（数据格式转换）')
    lines.push('')

    // ── 五、冲突检测 ──
    lines.push('【五、冲突检测】')
    if (conflicts.length === 0) {
      lines.push('  ✓ 无冲突')
    } else {
      for (const c of conflicts) {
        lines.push(`  ✗ ${c}`)
      }
    }
    lines.push('')

    // ── 六、优化建议 ──
    lines.push('【六、优化建议】')
    if (suggestions.length > 0) {
      suggestions.forEach((s, i) => {
        lines.push(`  ${i + 1}. ${s}`)
      })
    } else {
      lines.push('  当前架构健康，无需特别优化。')
    }
    lines.push('')

    // ── 七、古籍引用 ──
    lines.push('【七、古籍引用】')
    lines.push(`  ${classicalRef}`)
    lines.push('')

    lines.push('══════════════════════════════════════════════════')
    lines.push(`  报告生成时间：${new Date().toISOString()}`)
    lines.push('══════════════════════════════════════════════════')

    return lines.join('\n')
  }

  /** 清空所有（测试用） */
  clear(): void {
    this.systems.clear()
    this.pluginIndex.clear()
    this.strategyIndex.clear()
    this.ruleIndex.clear()
    this.extensionIndex.clear()
    this.adapterIndex.clear()
    this.eventBus.clearHistory()
    this.services.clear()
    this.registerCoreServices()
    this.kernelIntact = true
  }
}

// ═══════════════════════════════════════════════════════════════
// 辅助工厂函数
// ═══════════════════════════════════════════════════════════════

/** 创建简单插件 */
export function createPlugin(
  id: string,
  name: string,
  system: DivinationSystem,
  options?: {
    version?: string
    description?: string
    dependencies?: string[]
    init?: (ctx: PluginContext) => void
    activate?: (ctx: PluginContext) => void
    deactivate?: (ctx: PluginContext) => void
    destroy?: (ctx: PluginContext) => void
  },
): XuanFengPlugin {
  return {
    id,
    name,
    version: options?.version ?? '1.0.0',
    system,
    description: options?.description,
    dependencies: options?.dependencies,
    init: options?.init,
    activate: options?.activate,
    deactivate: options?.deactivate,
    destroy: options?.destroy,
  }
}

/** 创建简单策略 */
export function createStrategy(
  id: string,
  name: string,
  system: DivinationSystem,
  type: StrategyType,
  priority: number,
  analyzeFn: (input: StrategyInput) => StrategyOutput,
  canApplyFn?: (input: StrategyInput) => boolean,
): XuanFengStrategy {
  return {
    id,
    name,
    type,
    system,
    priority,
    analyze: analyzeFn,
    canApply: canApplyFn ?? (() => true),
  }
}

/** 创建简单规则 */
export function createRule(
  id: string,
  name: string,
  system: DivinationSystem,
  category: string,
  priority: RulePriority,
  source: string,
  description: string,
  conditions: RuleCondition[],
  evaluateFn?: (context: Record<string, unknown>) => boolean,
): XuanFengRule {
  return {
    id,
    name,
    system,
    category,
    priority,
    source,
    description,
    conditions,
    enabled: true,
    evaluate: evaluateFn ?? ((ctx) => {
      // 默认实现：检查所有条件
      for (const cond of conditions) {
        const val = ctx[cond.field]
        switch (cond.operator) {
          case 'eq':
            if (val !== cond.value) return false
            break
          case 'neq':
            if (val === cond.value) return false
            break
          case 'gt':
            if (!(typeof val === 'number' && val > (cond.value as number))) return false
            break
          case 'lt':
            if (!(typeof val === 'number' && val < (cond.value as number))) return false
            break
          case 'gte':
            if (!(typeof val === 'number' && val >= (cond.value as number))) return false
            break
          case 'lte':
            if (!(typeof val === 'number' && val <= (cond.value as number))) return false
            break
          case 'includes':
            if (!Array.isArray(cond.value) || !cond.value.includes(val as string)) return false
            break
          case 'match':
            if (typeof val !== 'string' || !new RegExp(cond.value as string).test(val)) return false
            break
        }
      }
      return true
    }),
  }
}

/** 创建简单扩展点 */
export function createExtension(
  id: string,
  name: string,
  system: DivinationSystem,
  point: ExtensionPoint,
  order: number,
  extendFn: (data: Record<string, unknown>) => Record<string, unknown>,
): XuanFengExtension {
  return {
    id,
    name,
    system,
    point,
    order,
    extend: extendFn,
  }
}

/** 创建简单适配器 */
export function createAdapter(
  id: string,
  name: string,
  system: DivinationSystem,
  toUnifiedFn: (raw: Record<string, unknown>) => Record<string, unknown>,
  fromUnifiedFn: (unified: Record<string, unknown>) => Record<string, unknown>,
  validateFn?: (raw: Record<string, unknown>) => boolean,
): XuanFengAdapter {
  return {
    id,
    name,
    system,
    toUnified: toUnifiedFn,
    fromUnified: fromUnifiedFn,
    validate: validateFn ?? (() => true),
  }
}

/** 创建空术数系统注册项 */
export function createSystemRegistration(meta: SystemMeta): SystemRegistration {
  return {
    meta,
    plugins: [],
    strategies: [],
    rules: [],
    extensions: [],
    adapters: [],
  }
}
