/**
 * CoreEngine 统一接口
 * P0-A4：为八字/紫微/奇门/六爻/风水等模块提供统一底层
 */

/** 支持的命理模块类型 */
export type ModuleType = 'bazi' | 'ziwei' | 'qimen' | 'liuyao' | 'meihua' | 'fengshui'

/** CoreEngine 配置 */
export interface CoreEngineConfig {
  /** 当前模块类型 */
  module: ModuleType
  /** 日历 Provider（共享） */
  calendarProvider?: 'qimen-standalone' | 'date-chinese' | string
  /** 地理 Provider（共享） */
  geoProvider?: 'static' | 'online' | string
  /** 是否启用真太阳时 */
  useTrueSolarTime?: boolean
  /** 子时换日策略 */
  ziHourStrategy?: 'same-day' | 'next-day' | 'true-solar'
  /** 是否启用沙箱模式（规则不正式注册） */
  sandboxMode?: boolean
  /** 调试模式 */
  debug?: boolean
}

/** CoreEngine 能力声明 */
export interface CoreEngineCapabilities {
  /** 是否支持排盘 */
  paipan: boolean
  /** 是否支持命理规则 */
  rules: boolean
  /** 是否支持评分 */
  scoring: boolean
  /** 是否支持 AI 解读 */
  aiExplain: boolean
  /** 是否支持流年推演 */
  flowYear: boolean
  /** 是否支持大运推演 */
  dayun: boolean
  /** 模块特定能力 */
  moduleSpecific?: string[]
}

/** CoreEngine 统一入口 */
export interface CoreEngine {
  /** 引擎名称 */
  readonly name: string
  /** 模块类型 */
  readonly module: ModuleType
  /** 版本 */
  readonly version: string
  /** 能力声明 */
  readonly capabilities: CoreEngineCapabilities

  /** 初始化引擎 */
  initialize(config: CoreEngineConfig): void | Promise<void>
  /** 获取配置 */
  getConfig(): CoreEngineConfig
  /** 销毁引擎（释放资源） */
  dispose?(): void

  /** 获取日历能力（共享 CalendarAdapter） */
  getCalendar(): import('../../bazi/calendar').CalendarProvider
  /** 获取地理能力（共享 GeoProvider） */
  getGeo(): import('../../locations/providers').GeoProvider
  /** 获取规则引擎（共享 RuleRegistry） */
  getRules?(): typeof import('../../bazi/ruleEngine')
  /** 获取 Pipeline（模块特定） */
  getPipeline?(): any
}
