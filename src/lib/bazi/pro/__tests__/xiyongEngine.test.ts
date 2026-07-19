/**
 * H3 Module 5 v5.0.0: Professional XiYong Engine — 全量测试
 * 覆盖：类型系统、知识库、调候规则、扶抑规则、引擎版本、输出结构、
 *       强弱判定、喜用神分组、调候分析、扶抑分析、多流派、冲突解析、
 *       评分明细、AI 解释、缓存、规则注册、推导链、完整管道、边界情况
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { HeavenlyStem, EarthlyBranch, ShenShi, FiveElement } from '@/lib/core/types/base'
import type { ProfessionalFourPillarsResult } from '../types'
import { calculateTenGods, clearTenGodsCache } from '../tenGodsEngine'
import { calculatePattern, clearPatternCache } from '../patternEngine'
import { clearXiYongCache, getXiYongCacheSize, XIYONG_ENGINE_VERSION, XIYONG_CACHE_VERSION } from '../xiyongEngine'
import { calculateXiYong, generateXiYongExplain } from '../xiyongEngine'
import { XIYONG_KB, CLIMATE_RULES, FUYI_RULES, getXiYongKnowledge, getClimateRule, getAllClimateRules, getAllFuYiRules } from '../xiyongDatabase'
import { getStrengthLevel, getElementRelation } from '../xiyongTypes'
import { DEFAULT_SCHOOL_CONFIG } from '../patternTypes'
import type { XiYongShenItem, StrengthLevel } from '../xiyongTypes'
import { defaultRuleRegistry } from '../ruleRegistry'

// ─── 辅助 ───

function makeSixLines(overrides: Partial<{
  yearGan: HeavenlyStem, yearZhi: EarthlyBranch,
  monthGan: HeavenlyStem, monthZhi: EarthlyBranch,
  dayGan: HeavenlyStem, dayZhi: EarthlyBranch,
  hourGan: HeavenlyStem, hourZhi: EarthlyBranch,
}> = {}) {
  return {
    year: { gan: overrides.yearGan ?? '甲', zhi: overrides.yearZhi ?? '子' },
    month: { gan: overrides.monthGan ?? '丙', zhi: overrides.monthZhi ?? '寅' },
    day: { gan: overrides.dayGan ?? '甲', zhi: overrides.dayZhi ?? '子' },
    hour: { gan: overrides.hourGan ?? '庚', zhi: overrides.hourZhi ?? '午' },
  }
}

function makePillars(overrides: Parameters<typeof makeSixLines>[0] = {}): ProfessionalFourPillarsResult {
  const sl = makeSixLines(overrides)
  const elementMap: Record<string, FiveElement> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  }
  return {
    version: '1.1.0',
    sixLines: sl,
    pillars: {
      year: { ganZhi: sl.year, naYin: '海中金', changSheng: '长生', cangGan: null as never, wuxing: elementMap[sl.year.gan]!, yinYang: (['甲','丙','戊','庚','壬'] as string[]).includes(sl.year.gan) ? '阳' as const : '阴' as const },
      month: { ganZhi: sl.month, naYin: '炉中火', changSheng: '沐浴', cangGan: null as never, wuxing: elementMap[sl.month.gan]!, yinYang: (['甲','丙','戊','庚','壬'] as string[]).includes(sl.month.gan) ? '阳' as const : '阴' as const },
      day: { ganZhi: sl.day, naYin: '海中金', changSheng: '冠带', cangGan: null as never, wuxing: elementMap[sl.day.gan]!, yinYang: (['甲','丙','戊','庚','壬'] as string[]).includes(sl.day.gan) ? '阳' as const : '阴' as const },
      hour: { ganZhi: sl.hour, naYin: '白蜡金', changSheng: '临官', cangGan: null as never, wuxing: elementMap[sl.hour.gan]!, yinYang: (['甲','丙','戊','庚','壬'] as string[]).includes(sl.hour.gan) ? '阳' as const : '阴' as const },
    },
    dayMaster: sl.day.gan,
    dayMasterElement: elementMap[sl.day.gan]!,
    dayMasterYinYang: (['甲','丙','戊','庚','壬'] as string[]).includes(sl.day.gan) ? '阳' as const : '阴' as const,
    fiveElementCount: { '木': 2, '火': 1, '土': 1, '金': 1, '水': 1 },
    naYin: { year: '海中金', month: '炉中火', day: '海中金', hour: '白蜡金' },
    changSheng: { year: '长生', month: '沐浴', day: '冠带', hour: '临官' },
    kongWang: [],
    mingGong: null as never,
    shenGong: null as never,
    taiYuan: null as never,
    taiXi: null as never,
    cangGanMap: {} as Record<EarthlyBranch, never>,
    derivation: null,
    warnings: [],
    computedAt: Date.now(),
  }
}

const defaultOpts = { gender: 'male' }

/** 完整管道辅助：构建四柱并运行三阶段引擎 */
function fullPipeline(overrides: Parameters<typeof makeSixLines>[0] = {}) {
  const pillars = makePillars(overrides)
  const tenGodOut = calculateTenGods(pillars, defaultOpts)
  const patternOut = calculatePattern(pillars, tenGodOut, defaultOpts)
  const xiyongOut = calculateXiYong(pillars, tenGodOut, patternOut, defaultOpts)
  return { pillars, tenGodOut, patternOut, xiyongOut }
}

beforeEach(() => {
  clearTenGodsCache()
  clearPatternCache()
  clearXiYongCache()
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. Type System (5 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Type System — getStrengthLevel', () => {
  it('80 → 极强', () => {
    expect(getStrengthLevel(80)).toBe('极强')
  })

  it('60 → 偏强', () => {
    expect(getStrengthLevel(60)).toBe('偏强')
  })

  it('40 → 中和', () => {
    expect(getStrengthLevel(40)).toBe('中和')
  })

  it('20 → 偏弱', () => {
    expect(getStrengthLevel(20)).toBe('偏弱')
  })

  it('10 → 极弱', () => {
    expect(getStrengthLevel(10)).toBe('极弱')
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. Element Relation (5 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Element Relation — getElementRelation', () => {
  it('木生火 → 生', () => {
    expect(getElementRelation('木', '火')).toBe('生')
  })

  it('木克土 → 克', () => {
    expect(getElementRelation('木', '土')).toBe('克')
  })

  it('木同木 → 同', () => {
    expect(getElementRelation('木', '木')).toBe('同')
  })

  it('木被金克 → 被克', () => {
    expect(getElementRelation('木', '金')).toBe('被克')
  })

  it('火被木生 → 被生', () => {
    expect(getElementRelation('火', '木')).toBe('被生')
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. Knowledge Base (5 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Knowledge Base — XIYONG_KB', () => {
  it('XIYONG_KB 有 5 个五行条目', () => {
    const keys = Object.keys(XIYONG_KB)
    expect(keys).toHaveLength(5)
    expect(keys).toEqual(expect.arrayContaining(['木', '火', '土', '金', '水']))
  })

  it('每个条目有完整字段', () => {
    const elements: FiveElement[] = ['木', '火', '土', '金', '水']
    for (const e of elements) {
      const entry = XIYONG_KB[e]
      expect(entry).toBeDefined()
      expect(entry!.element).toBe(e)
      expect(entry!.keywords).toBeInstanceOf(Array)
      expect(entry!.classicalBasis).toBeInstanceOf(Array)
      expect(entry!.modernInterpretation).toBeTypeOf('string')
      expect(entry!.career).toBeInstanceOf(Array)
      expect(entry!.wealth).toBeInstanceOf(Array)
      expect(entry!.marriage).toBeInstanceOf(Array)
      expect(entry!.health).toBeInstanceOf(Array)
      expect(entry!.risks).toBeInstanceOf(Array)
      expect(entry!.suggestions).toBeInstanceOf(Array)
      expect(entry!.tags).toBeInstanceOf(Array)
    }
  })

  it('getXiYongKnowledge 正常返回条目', () => {
    const entry = getXiYongKnowledge('木')
    expect(entry).toBeDefined()
    expect(entry!.element).toBe('木')
    expect(entry!.keywords.length).toBeGreaterThan(0)
  })

  it('getXiYongKnowledge 对合法五行都有数据', () => {
    for (const e of ['木', '火', '土', '金', '水'] as FiveElement[]) {
      expect(getXiYongKnowledge(e)).toBeDefined()
    }
  })

  it('每个条目的 classicalBasis 不为空', () => {
    for (const e of ['木', '火', '土', '金', '水'] as FiveElement[]) {
      expect(XIYONG_KB[e].classicalBasis.length).toBeGreaterThan(0)
    }
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. Climate Rules (5 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Climate Rules — CLIMATE_RULES', () => {
  it('CLIMATE_RULES 有 12 条规则', () => {
    expect(CLIMATE_RULES).toHaveLength(12)
  })

  it('getClimateRule 月份映射正确', () => {
    const rule = getClimateRule('子')
    expect(rule).toBeDefined()
    expect(rule!.monthBranch).toBe('子')
  })

  it('亥子丑月 climateType 为寒', () => {
    for (const zhi of ['亥', '子', '丑'] as EarthlyBranch[]) {
      const rule = getClimateRule(zhi)
      expect(rule).toBeDefined()
      expect(rule!.climateType).toBe('寒')
    }
  })

  it('巳午月 climateType 为暖或燥', () => {
    const si = getClimateRule('巳')
    const wu = getClimateRule('午')
    expect(si).toBeDefined()
    expect(wu).toBeDefined()
    expect(['暖', '燥']).toContain(si!.climateType)
    expect(['暖', '燥']).toContain(wu!.climateType)
  })

  it('getAllClimateRules 返回副本', () => {
    const all = getAllClimateRules()
    expect(all).toHaveLength(12)
    // 修改副本不影响原数据
    all.push({} as never)
    expect(CLIMATE_RULES).toHaveLength(12)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5. FuYi Rules (5 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('FuYi Rules — FUYI_RULES', () => {
  it('FUYI_RULES 有 6 条规则', () => {
    expect(FUYI_RULES).toHaveLength(6)
  })

  it('每条规则有完整字段', () => {
    const requiredFields = ['method', 'applicable', 'determineXiShen', 'determineYongShen', 'reference', 'description'] as const
    for (const rule of FUYI_RULES) {
      for (const field of requiredFields) {
        expect(rule).toHaveProperty(field)
      }
      expect(typeof rule.method).toBe('string')
      expect(typeof rule.applicable).toBe('function')
      expect(typeof rule.determineXiShen).toBe('function')
      expect(typeof rule.determineYongShen).toBe('function')
      expect(typeof rule.reference).toBe('string')
      expect(typeof rule.description).toBe('string')
    }
  })

  it('包含扶抑法', () => {
    const methods = FUYI_RULES.map(r => r.method)
    expect(methods).toContain('扶抑法')
  })

  it('包含调候法', () => {
    const methods = FUYI_RULES.map(r => r.method)
    expect(methods).toContain('调候法')
  })

  it('getAllFuYiRules 返回副本', () => {
    const all = getAllFuYiRules()
    expect(all).toHaveLength(6)
    all.push({} as never)
    expect(FUYI_RULES).toHaveLength(6)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 6. Engine Version (3 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Engine Version', () => {
  it('XIYONG_ENGINE_VERSION = "5.0.0"', () => {
    expect(XIYONG_ENGINE_VERSION).toBe('5.0.0')
  })

  it('XIYONG_CACHE_VERSION = "5.0.0"', () => {
    expect(XIYONG_CACHE_VERSION).toBe('5.0.0')
  })

  it('引擎版本和缓存版本一致', () => {
    expect(XIYONG_ENGINE_VERSION).toBe(XIYONG_CACHE_VERSION)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 7. Engine Output Structure (5 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Engine Output Structure', () => {
  let out: ReturnType<typeof calculateXiYong>

  beforeEach(() => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    out = xiyongOut
  })

  it('输出包含所有核心字段', () => {
    expect(out).toHaveProperty('version')
    expect(out).toHaveProperty('dayMaster')
    expect(out).toHaveProperty('dayMasterElement')
    expect(out).toHaveProperty('strength')
    expect(out).toHaveProperty('xiYongGroup')
    expect(out).toHaveProperty('climateAnalysis')
    expect(out).toHaveProperty('fuYiAnalysis')
    expect(out).toHaveProperty('schoolResults')
    expect(out).toHaveProperty('conflictResult')
    expect(out).toHaveProperty('scoreDetail')
    expect(out).toHaveProperty('overallXiYongScore')
    expect(out).toHaveProperty('overallConfidence')
    expect(out).toHaveProperty('primaryXiShen')
    expect(out).toHaveProperty('primaryYongShen')
    expect(out).toHaveProperty('primaryJiShen')
    expect(out).toHaveProperty('schoolConfig')
    expect(out).toHaveProperty('warnings')
    expect(out).toHaveProperty('computeTimeMs')
    expect(out).toHaveProperty('executionMetadata')
    expect(out).toHaveProperty('cacheVersion')
  })

  it('version = "5.0.0"', () => {
    expect(out.version).toBe('5.0.0')
  })

  it('cacheVersion = "5.0.0"', () => {
    expect(out.cacheVersion).toBe('5.0.0')
  })

  it('executionMetadata 完整', () => {
    const meta = out.executionMetadata
    expect(meta).toHaveProperty('executionTime')
    expect(meta).toHaveProperty('ruleCount')
    expect(meta).toHaveProperty('matchedRules')
    expect(meta).toHaveProperty('evaluatedSchools')
    expect(meta).toHaveProperty('fuYiMethods')
    expect(meta).toHaveProperty('climateScore')
    expect(typeof meta.executionTime).toBe('number')
  })

  it('warnings 是数组', () => {
    expect(Array.isArray(out.warnings)).toBe(true)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 8. Strength Determination (5 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Strength Determination', () => {
  let out: ReturnType<typeof calculateXiYong>

  beforeEach(() => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    out = xiyongOut
  })

  it('strength 有 strengthScore/strengthLevel/confidence/dimensionScores', () => {
    expect(out.strength).toHaveProperty('strengthScore')
    expect(out.strength).toHaveProperty('strengthLevel')
    expect(out.strength).toHaveProperty('confidence')
    expect(out.strength).toHaveProperty('dimensionScores')
  })

  it('strengthLevel 是有效值', () => {
    const validLevels: StrengthLevel[] = ['极强', '偏强', '中和', '偏弱', '极弱']
    expect(validLevels).toContain(out.strength.strengthLevel)
  })

  it('strengthScore 在 0-100 范围内', () => {
    expect(out.strength.strengthScore).toBeGreaterThanOrEqual(0)
    expect(out.strength.strengthScore).toBeLessThanOrEqual(100)
  })

  it('dimensionScores 有 7 个字段', () => {
    const ds = out.strength.dimensionScores
    expect(ds).toHaveProperty('deLing')
    expect(ds).toHaveProperty('deDi')
    expect(ds).toHaveProperty('deShi')
    expect(ds).toHaveProperty('tenGodPower')
    expect(ds).toHaveProperty('fiveElementBalance')
    expect(ds).toHaveProperty('patternBonus')
    expect(ds).toHaveProperty('shenShaBonus')
  })

  it('confidence 在 0-100 范围内', () => {
    expect(out.strength.confidence).toBeGreaterThanOrEqual(0)
    expect(out.strength.confidence).toBeLessThanOrEqual(100)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 9. XiYong Group (6 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('XiYong Group', () => {
  let out: ReturnType<typeof calculateXiYong>

  beforeEach(() => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    out = xiyongOut
  })

  it('xiYongGroup 有 xiShen/yongShen/jiShen/enemyShen/neutralShen', () => {
    expect(out.xiYongGroup).toHaveProperty('xiShen')
    expect(out.xiYongGroup).toHaveProperty('yongShen')
    expect(out.xiYongGroup).toHaveProperty('jiShen')
    expect(out.xiYongGroup).toHaveProperty('enemyShen')
    expect(out.xiYongGroup).toHaveProperty('neutralShen')
  })

  it('喜神不为空', () => {
    expect(out.xiYongGroup.xiShen.length).toBeGreaterThan(0)
  })

  it('用神不为空', () => {
    expect(out.xiYongGroup.yongShen.length).toBeGreaterThan(0)
  })

  it('忌神数组存在', () => {
    expect(Array.isArray(out.xiYongGroup.jiShen)).toBe(true)
  })

  it('每个 XiYongShenItem 有完整字段', () => {
    const allItems = [
      ...out.xiYongGroup.xiShen,
      ...out.xiYongGroup.yongShen,
      ...out.xiYongGroup.jiShen,
    ]
    expect(allItems.length).toBeGreaterThan(0)
    for (const item of allItems) {
      expect(item).toHaveProperty('element')
      expect(item).toHaveProperty('role')
      expect(item).toHaveProperty('priority')
      expect(item).toHaveProperty('score')
      expect(item).toHaveProperty('source')
      expect(item).toHaveProperty('reason')
      expect(item).toHaveProperty('classicalReference')
      expect(item).toHaveProperty('confidence')
      expect(item).toHaveProperty('involvedShenShi')
    }
  })

  it('primaryXiShen 和 primaryYongShen 有值', () => {
    expect(out.primaryXiShen).not.toBeNull()
    expect(out.primaryYongShen).not.toBeNull()
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 10. Climate Analysis (5 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Climate Analysis', () => {
  it('climateAnalysis 有 climateType/climateScore/climateNeed/climateSolution', () => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    expect(xiyongOut.climateAnalysis).toHaveProperty('climateType')
    expect(xiyongOut.climateAnalysis).toHaveProperty('climateScore')
    expect(xiyongOut.climateAnalysis).toHaveProperty('climateNeed')
    expect(xiyongOut.climateAnalysis).toHaveProperty('climateSolution')
  })

  it('冬月生人（子月）climateType = "寒"', () => {
    const { xiyongOut } = fullPipeline({ monthZhi: '子', dayGan: '甲' })
    expect(xiyongOut.climateAnalysis.climateType).toBe('寒')
  })

  it('夏月生人（午月）有调候需求', () => {
    const { xiyongOut } = fullPipeline({ monthZhi: '午', dayGan: '丙' })
    // 午月 climateType 应为 燥，climateScore 应大于 0
    expect(xiyongOut.climateAnalysis.climateType).toBe('燥')
    expect(xiyongOut.climateAnalysis.climateScore).toBeGreaterThan(0)
  })

  it('climateScore 在合理范围 0-100', () => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    expect(xiyongOut.climateAnalysis.climateScore).toBeGreaterThanOrEqual(0)
    expect(xiyongOut.climateAnalysis.climateScore).toBeLessThanOrEqual(100)
  })

  it('辰月 climateType = "平"', () => {
    const { xiyongOut } = fullPipeline({ monthZhi: '辰', dayGan: '甲' })
    expect(xiyongOut.climateAnalysis.climateType).toBe('平')
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 11. FuYi Analysis (5 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('FuYi Analysis', () => {
  let out: ReturnType<typeof calculateXiYong>

  beforeEach(() => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    out = xiyongOut
  })

  it('fuYiAnalysis 有 methods/primaryMethod/overallScore', () => {
    expect(out.fuYiAnalysis).toHaveProperty('methods')
    expect(out.fuYiAnalysis).toHaveProperty('primaryMethod')
    expect(out.fuYiAnalysis).toHaveProperty('overallScore')
  })

  it('methods 不为空', () => {
    expect(out.fuYiAnalysis.methods.length).toBeGreaterThan(0)
  })

  it('每个方法有 score/confidence/recommendedElements', () => {
    for (const m of out.fuYiAnalysis.methods) {
      expect(m).toHaveProperty('method')
      expect(m).toHaveProperty('score')
      expect(m).toHaveProperty('confidence')
      expect(m).toHaveProperty('recommendedElements')
      expect(m).toHaveProperty('recommendedYongShen')
      expect(m).toHaveProperty('reason')
      expect(m).toHaveProperty('classicalReference')
    }
  })

  it('至少扶抑法被评估', () => {
    const methodNames = out.fuYiAnalysis.methods.map(m => m.method)
    expect(methodNames).toContain('扶抑法')
  })

  it('primaryMethod 是合法值', () => {
    const validMethods = ['扶抑法', '调候法', '病药法', '通关法', '专旺法', '从格法']
    expect(validMethods).toContain(out.fuYiAnalysis.primaryMethod)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 12. Multi-School (5 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Multi-School', () => {
  let out: ReturnType<typeof calculateXiYong>

  beforeEach(() => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    out = xiyongOut
  })

  it('schoolResults 长度 = 配置流派总数', () => {
    expect(out.schoolResults.length).toBe(DEFAULT_SCHOOL_CONFIG.length)
  })

  it('每个结果有 school/xiShen/yongShen/jiShen/score/weight/reason', () => {
    for (const sr of out.schoolResults) {
      expect(sr).toHaveProperty('school')
      expect(sr).toHaveProperty('xiShen')
      expect(sr).toHaveProperty('yongShen')
      expect(sr).toHaveProperty('jiShen')
      expect(sr).toHaveProperty('score')
      expect(sr).toHaveProperty('weight')
      expect(sr).toHaveProperty('reason')
    }
  })

  it('每个结果有 enabled/weightedScore/reference', () => {
    for (const sr of out.schoolResults) {
      expect(sr).toHaveProperty('enabled')
      expect(sr).toHaveProperty('weightedScore')
      expect(sr).toHaveProperty('reference')
      expect(typeof sr.enabled).toBe('boolean')
    }
  })

  it('穷通宝鉴默认关闭 → enabled = false', () => {
    const qtbj = out.schoolResults.find(sr => sr.school === '穷通宝鉴')
    if (qtbj) {
      expect(qtbj.enabled).toBe(false)
    }
  })

  it('schoolConfig 与 DEFAULT_SCHOOL_CONFIG 一致', () => {
    expect(out.schoolConfig).toEqual(DEFAULT_SCHOOL_CONFIG)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 13. Conflict Resolution (4 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Conflict Resolution', () => {
  let out: ReturnType<typeof calculateXiYong>

  beforeEach(() => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    out = xiyongOut
  })

  it('conflictResult 有 hasConflict/overallConfidence', () => {
    expect(out.conflictResult).toHaveProperty('hasConflict')
    expect(out.conflictResult).toHaveProperty('overallConfidence')
    expect(typeof out.conflictResult.hasConflict).toBe('boolean')
  })

  it('recommendedXiShen 和 recommendedYongShen 有值', () => {
    expect(out.conflictResult.recommendedXiShen.length).toBeGreaterThan(0)
    expect(out.conflictResult.recommendedYongShen.length).toBeGreaterThan(0)
  })

  it('conflictResult 有 resolutionMethod', () => {
    expect(['weighted', 'majority', 'priority']).toContain(out.conflictResult.resolutionMethod)
  })

  it('overallConfidence 在 0-100 范围内', () => {
    expect(out.conflictResult.overallConfidence).toBeGreaterThanOrEqual(0)
    expect(out.conflictResult.overallConfidence).toBeLessThanOrEqual(100)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 14. Score Detail (4 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Score Detail', () => {
  let out: ReturnType<typeof calculateXiYong>

  beforeEach(() => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    out = xiyongOut
  })

  it('scoreDetail 有 7 个维度 + totalScore', () => {
    expect(out.scoreDetail).toHaveProperty('dayMasterStrength')
    expect(out.scoreDetail).toHaveProperty('patternInfluence')
    expect(out.scoreDetail).toHaveProperty('tenGodHarmony')
    expect(out.scoreDetail).toHaveProperty('fiveElementBalance')
    expect(out.scoreDetail).toHaveProperty('climateNeed')
    expect(out.scoreDetail).toHaveProperty('shenShaAssist')
    expect(out.scoreDetail).toHaveProperty('conflictAdjustment')
    expect(out.scoreDetail).toHaveProperty('totalScore')
  })

  it('totalScore 在 0-100 范围内', () => {
    expect(out.scoreDetail.totalScore).toBeGreaterThanOrEqual(0)
    expect(out.scoreDetail.totalScore).toBeLessThanOrEqual(100)
  })

  it('dimensionSources 存在', () => {
    expect(out.scoreDetail).toHaveProperty('dimensionSources')
    expect(typeof out.scoreDetail.dimensionSources).toBe('object')
  })

  it('各维度评分 >= 0', () => {
    expect(out.scoreDetail.dayMasterStrength).toBeGreaterThanOrEqual(0)
    expect(out.scoreDetail.patternInfluence).toBeGreaterThanOrEqual(0)
    expect(out.scoreDetail.tenGodHarmony).toBeGreaterThanOrEqual(0)
    expect(out.scoreDetail.fiveElementBalance).toBeGreaterThanOrEqual(0)
    expect(out.scoreDetail.climateNeed).toBeGreaterThanOrEqual(0)
    expect(out.scoreDetail.shenShaAssist).toBeGreaterThanOrEqual(0)
    expect(out.scoreDetail.conflictAdjustment).toBeGreaterThanOrEqual(0)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 15. AI Explain (4 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('AI Explain — generateXiYongExplain', () => {
  const mockItem: XiYongShenItem = {
    element: '水',
    role: '用神',
    priority: 1,
    score: 85,
    source: '扶抑法',
    reason: '日主身弱，喜水生木',
    classicalReference: '《子平真诠》',
    confidence: 80,
    involvedShenShi: ['正印'],
  }

  it('generateXiYongExplain 接受 XiYongShenItem 并返回结果', () => {
    const result = generateXiYongExplain(mockItem)
    expect(result).toBeDefined()
    expect(result.element).toBe('水')
    expect(result.role).toBe('用神')
  })

  it('输出有完整的结构化字段', () => {
    const result = generateXiYongExplain(mockItem)
    expect(result).toHaveProperty('classicalBasis')
    expect(result).toHaveProperty('modernInterpretation')
    expect(result).toHaveProperty('career')
    expect(result).toHaveProperty('wealth')
    expect(result).toHaveProperty('marriage')
    expect(result).toHaveProperty('health')
    expect(result).toHaveProperty('risks')
    expect(result).toHaveProperty('suggestions')
    expect(result).toHaveProperty('keywords')
    expect(result).toHaveProperty('tags')
    expect(result).toHaveProperty('aiSummary')
  })

  it('各字段类型正确', () => {
    const result = generateXiYongExplain(mockItem)
    expect(Array.isArray(result.classicalBasis)).toBe(true)
    expect(typeof result.modernInterpretation).toBe('string')
    expect(Array.isArray(result.career)).toBe(true)
    expect(Array.isArray(result.wealth)).toBe(true)
    expect(Array.isArray(result.marriage)).toBe(true)
    expect(Array.isArray(result.health)).toBe(true)
    expect(Array.isArray(result.risks)).toBe(true)
    expect(Array.isArray(result.suggestions)).toBe(true)
    expect(Array.isArray(result.keywords)).toBe(true)
    expect(Array.isArray(result.tags)).toBe(true)
    expect(typeof result.aiSummary).toBe('string')
  })

  it('aiSummary 包含有用信息', () => {
    const result = generateXiYongExplain(mockItem)
    expect(result.aiSummary.length).toBeGreaterThan(0)
    expect(result.aiSummary).toContain('水')
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 16. Cache (3 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Cache', () => {
  it('首次写入缓存', () => {
    expect(getXiYongCacheSize()).toBe(0)
    fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    expect(getXiYongCacheSize()).toBe(1)
  })

  it('缓存命中时 computeTimeMs = 0', () => {
    const { xiyongOut: first } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    expect(first.computeTimeMs).toBeGreaterThanOrEqual(0)
    // 第二次调用应命中缓存
    const { xiyongOut: second } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    expect(getXiYongCacheSize()).toBe(1) // 缓存未增长
    expect(second.computeTimeMs).toBeLessThan(1) // 缓存命中极快
  })

  it('clearXiYongCache 清空缓存', () => {
    fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    expect(getXiYongCacheSize()).toBe(1)
    clearXiYongCache()
    expect(getXiYongCacheSize()).toBe(0)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 17. RuleRegistry (3 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('RuleRegistry — xiyong 分类', () => {
  it('xiyong 分类有 >= 11 条规则', () => {
    const xiyongRules = defaultRuleRegistry.findByCategory('xiyong')
    expect(xiyongRules.length).toBeGreaterThanOrEqual(11)
  })

  it('module5-xiyong 模块存在', () => {
    const module5Rules = defaultRuleRegistry.findByModule('module5-xiyong')
    expect(module5Rules.length).toBeGreaterThan(0)
  })

  it('关键规则 ID 存在', () => {
    expect(defaultRuleRegistry.has('xiyong-engine')).toBe(true)
    expect(defaultRuleRegistry.has('xiyong-strength')).toBe(true)
    expect(defaultRuleRegistry.has('xiyong-xishen')).toBe(true)
    expect(defaultRuleRegistry.has('xiyong-yongshen')).toBe(true)
    expect(defaultRuleRegistry.has('xiyong-jishen')).toBe(true)
    expect(defaultRuleRegistry.has('xiyong-climate')).toBe(true)
    expect(defaultRuleRegistry.has('xiyong-fuyi')).toBe(true)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 18. Derivation Chain (2 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Derivation Chain', () => {
  let out: ReturnType<typeof calculateXiYong>

  beforeEach(() => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    out = xiyongOut
  })

  it('输出有 derivation', () => {
    expect(out).toHaveProperty('derivation')
  })

  it('derivation.steps.length >= 2', () => {
    expect(out.derivation).not.toBeUndefined()
    expect(out.derivation!.steps.length).toBeGreaterThanOrEqual(2)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 19. Full Pipeline Integration (3 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Full Pipeline Integration', () => {
  it('甲日寅月完整管道正常运行', () => {
    const { pillars, tenGodOut, patternOut, xiyongOut } = fullPipeline({
      monthZhi: '寅', dayGan: '甲',
    })
    expect(pillars.dayMaster).toBe('甲')
    expect(tenGodOut.dayMaster).toBe('甲')
    expect(patternOut.dayMaster).toBe('甲')
    expect(xiyongOut.dayMaster).toBe('甲')
    expect(xiyongOut.dayMasterElement).toBe('木')
    expect(xiyongOut.version).toBe('5.0.0')
  })

  it('丙日子月完整管道正常运行', () => {
    const { xiyongOut } = fullPipeline({
      monthZhi: '子', dayGan: '丙',
    })
    expect(xiyongOut.dayMaster).toBe('丙')
    expect(xiyongOut.dayMasterElement).toBe('火')
    expect(xiyongOut.climateAnalysis.climateType).toBe('寒')
    expect(xiyongOut.xiYongGroup.xiShen.length).toBeGreaterThan(0)
  })

  it('丙日午月完整管道正常运行', () => {
    const { xiyongOut } = fullPipeline({
      monthZhi: '午', dayGan: '丙',
    })
    expect(xiyongOut.dayMaster).toBe('丙')
    expect(xiyongOut.dayMasterElement).toBe('火')
    expect(xiyongOut.climateAnalysis.climateType).toBe('燥')
    expect(xiyongOut.xiYongGroup.yongShen.length).toBeGreaterThan(0)
  })
})

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 20. Edge Cases (3 tests)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe('Edge Cases', () => {
  it('只有子平流派时 schoolResults 长度为 1', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const patternOut = calculatePattern(pillars, tenGodOut, defaultOpts)
    const onlyZiping = [{ name: '子平' as const, enabled: true, weight: 1.0 }]
    const xiyongOut = calculateXiYong(pillars, tenGodOut, patternOut, {
      gender: 'male',
      schoolConfig: onlyZiping,
    })
    expect(xiyongOut.schoolResults.length).toBe(1)
    expect(xiyongOut.schoolResults[0]!.school).toBe('子平')
  })

  it('overallConfidence 在合理范围 0-100', () => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    expect(xiyongOut.overallConfidence).toBeGreaterThanOrEqual(0)
    expect(xiyongOut.overallConfidence).toBeLessThanOrEqual(100)
  })

  it('overallXiYongScore 在合理范围 0-100', () => {
    const { xiyongOut } = fullPipeline({ monthZhi: '寅', dayGan: '甲' })
    expect(xiyongOut.overallXiYongScore).toBeGreaterThanOrEqual(0)
    expect(xiyongOut.overallXiYongScore).toBeLessThanOrEqual(100)
  })
})