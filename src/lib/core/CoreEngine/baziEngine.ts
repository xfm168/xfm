import type { CoreEngine, CoreEngineConfig, CoreEngineCapabilities } from './types'
import { getCalendarProvider } from '../../bazi/calendar'
import { getGeoProvider } from '../../locations/providers'
import * as ruleEngine from '../../bazi/ruleEngine'

/**
 * 八字模块 CoreEngine 实现
 * 当前为骨架，后续逐步填充
 */
export class BaZiCoreEngine implements CoreEngine {
  readonly name = 'xuanfengmen-bazi'
  readonly module = 'bazi' as const
  readonly version = '1.0.0'
  readonly capabilities: CoreEngineCapabilities = {
    paipan: true,
    rules: true,
    scoring: true,
    aiExplain: true,
    flowYear: true,
    dayun: true,
    moduleSpecific: ['shishen', 'geju', 'xiyongshen', 'shensha', 'dayun', 'liunian'],
  }

  private config: CoreEngineConfig | null = null

  initialize(config: CoreEngineConfig): void {
    this.config = config
    // 确保 RuleEngine 分类规则已注册
    ruleEngine.registerCategoryRules()
  }

  getConfig(): CoreEngineConfig {
    if (!this.config) {
      throw new Error('[BaZiCoreEngine] 引擎未初始化，请先调用 initialize()')
    }
    return this.config
  }

  getCalendar() {
    return getCalendarProvider()
  }

  getGeo() {
    return getGeoProvider()
  }

  getRules() {
    return ruleEngine
  }
}
