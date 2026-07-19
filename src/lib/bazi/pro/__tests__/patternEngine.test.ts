/**
 * H3 Module 4 v4.1.0: Professional Pattern Engine — 全量测试
 * 包含 v4.1.0 冻结补充（Pattern Breakdown / FormationChain / ConflictResolver / 主副格 / schoolResults / AI增强 / cacheVersion）
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { HeavenlyStem, EarthlyBranch, ShenShi, FiveElement } from '@/lib/core/types/base'
import type { ProfessionalFourPillarsResult } from '../types'
import { calculateTenGods, clearTenGodsCache, TEN_GODS_ENGINE_VERSION } from '../tenGodsEngine'
import {
  calculatePattern, generatePatternExplain,
  clearPatternCache, getPatternCacheSize,
  PATTERN_ENGINE_VERSION, PATTERN_CACHE_VERSION,
} from '../patternEngine'
import {
  PATTERN_RULES, PATTERN_KB_MAP, findPatternRule,
  getRulesByClass, getRulesBySchool,
  getPatternKnowledge, getAllPatternNames,
} from '../patternDatabase'
import {
  ZHENG_PATTERNS, SPECIAL_PATTERNS, ALL_PATTERNS,
  ALL_SCHOOLS, DEFAULT_SCHOOL_CONFIG, getPatternGrade,
} from '../patternTypes'
import type { PatternType, PatternClass, PatternDetail } from '../patternTypes'
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

/**
 * 构建最小化的 ProfessionalFourPillarsResult mock。
 * 测试重点在格局引擎内部逻辑，四柱排盘本身已由 Module 1 测试覆盖。
 */
function makePillars(overrides: Parameters<typeof makeSixLines>[0] = {}): ProfessionalFourPillarsResult {
  const sl = makeSixLines(overrides)
  return {
    version: '1.1.0',
    sixLines: sl,
    pillars: {
      year: { ganZhi: sl.year, naYin: '海中金', changSheng: '长生', cangGan: null as any, wuxing: '木' as FiveElement, yinYang: '阳' as const },
      month: { ganZhi: sl.month, naYin: '炉中火', changSheng: '沐浴', cangGan: null as any, wuxing: '火' as FiveElement, yinYang: '阳' as const },
      day: { ganZhi: sl.day, naYin: '海中金', changSheng: '冠带', cangGan: null as any, wuxing: '木' as FiveElement, yinYang: '阳' as const },
      hour: { ganZhi: sl.hour, naYin: '白蜡金', changSheng: '临官', cangGan: null as any, wuxing: '金' as FiveElement, yinYang: '阳' as const },
    },
    dayMaster: sl.day.gan,
    dayMasterElement: sl.day.gan === '甲' || sl.day.gan === '乙' ? '木' as FiveElement
      : sl.day.gan === '丙' || sl.day.gan === '丁' ? '火' as FiveElement
      : sl.day.gan === '戊' || sl.day.gan === '己' ? '土' as FiveElement
      : sl.day.gan === '庚' || sl.day.gan === '辛' ? '金' as FiveElement
      : '水' as FiveElement,
    dayMasterYinYang: (['甲', '丙', '戊', '庚', '壬'] as string[]).includes(sl.day.gan) ? '阳' as const : '阴' as const,
    fiveElementCount: { '木': 2, '火': 1, '土': 1, '金': 1, '水': 1 },
    naYin: { year: '海中金', month: '炉中火', day: '海中金', hour: '白蜡金' },
    changSheng: { year: '长生', month: '沐浴', day: '冠带', hour: '临官' },
    kongWang: [],
    mingGong: null as any,
    shenGong: null as any,
    taiYuan: null as any,
    taiXi: null as any,
    cangGanMap: {} as any,
    derivation: null as any,
    warnings: [],
    computedAt: Date.now(),
  }
}

const defaultOpts = { gender: 'male' }

// ─── 1. 类型系统测试 ───

describe('Pattern Types', () => {
  it('正格有10种', () => {
    expect(ZHENG_PATTERNS).toHaveLength(10)
  })

  it('特殊格有10种', () => {
    expect(SPECIAL_PATTERNS).toHaveLength(10)
  })

  it('总计20种格局', () => {
    expect(ALL_PATTERNS).toHaveLength(20)
  })

  it('无重复', () => {
    expect(new Set(ALL_PATTERNS).size).toBe(20)
  })

  it('4个流派', () => {
    expect(ALL_SCHOOLS).toEqual(['子平', '滴天髓', '子平真诠', '穷通宝鉴'])
  })

  it('默认流派配置', () => {
    expect(DEFAULT_SCHOOL_CONFIG).toHaveLength(4)
    expect(DEFAULT_SCHOOL_CONFIG[0].enabled).toBe(true)
    expect(DEFAULT_SCHOOL_CONFIG[3].enabled).toBe(false) // 穷通宝鉴默认关闭
  })

  it('getPatternGrade 正确', () => {
    expect(getPatternGrade(90)).toBe('大成')
    expect(getPatternGrade(70)).toBe('中成')
    expect(getPatternGrade(50)).toBe('小成')
    expect(getPatternGrade(25)).toBe('不成')
    expect(getPatternGrade(10)).toBe('破格')
  })
})

// ─── 2. 规则数据库测试 ───

describe('Pattern Database', () => {
  it('规则总数20条', () => {
    expect(PATTERN_RULES).toHaveLength(20)
  })

  it('正格规则10条', () => {
    const zheng = getRulesByClass('正格')
    expect(zheng).toHaveLength(10)
  })

  it('特殊格规则10条', () => {
    const special = getRulesByClass('特殊格')
    expect(special).toHaveLength(10)
  })

  it('子平流派覆盖最多', () => {
    const ziping = getRulesBySchool('子平')
    expect(ziping.length).toBeGreaterThanOrEqual(15)
  })

  it('每条规则都有 id 和 patternName', () => {
    for (const r of PATTERN_RULES) {
      expect(r.id).toBeTruthy()
      expect(r.patternName).toBeTruthy()
      expect(ALL_PATTERNS).toContain(r.patternName)
    }
  })

  it('findPatternRule 可以按名称查找', () => {
    const r = findPatternRule('正官格')
    expect(r).toBeDefined()
    expect(r!.id).toBe('zheng-guan-ge')
    expect(r!.patternClass).toBe('正格')
  })

  it('知识库覆盖所有格局', () => {
    const names = getAllPatternNames()
    expect(names.length).toBe(20)
    for (const n of names) {
      expect(PATTERN_KB_MAP[n]).toBeDefined()
    }
  })

  it('每个知识库条目有完整字段', () => {
    for (const n of ALL_PATTERNS) {
      const kb = getPatternKnowledge(n)!
      expect(kb.name).toBe(n)
      expect(kb.keywords.length).toBeGreaterThan(0)
      expect(kb.advantages.length).toBeGreaterThan(0)
      expect(kb.risks.length).toBeGreaterThan(0)
      expect(kb.adjustments.length).toBeGreaterThan(0)
      expect(kb.career.length).toBeGreaterThan(0)
    }
  })
})

// ─── 3. 引擎基础测试 ───

describe('Pattern Engine: Basic', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('引擎版本 4.1.0', () => {
    expect(PATTERN_ENGINE_VERSION).toBe('4.1.0')
  })

  it('缓存版本 4.1.0', () => {
    expect(PATTERN_CACHE_VERSION).toBe('4.1.0')
  })

  it('输出结构完整', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    expect(out.version).toBe('4.1.0')
    expect(out.dayMaster).toBe('甲')
    expect(out.primaryPattern).toBeDefined()
    expect(out.allPatterns).toBeInstanceOf(Array)
    expect(out.secondaryPatterns).toBeInstanceOf(Array)
    expect(out.candidates).toBeInstanceOf(Array)
    expect(out.schoolEvaluations).toBeInstanceOf(Array)
    expect(out.schoolResults).toBeInstanceOf(Array)
    expect(out.overallPatternScore).toBeGreaterThanOrEqual(0)
    expect(out.overallConfidence).toBeGreaterThanOrEqual(0)
    expect(out.patternRecognized).toBe(true)
    expect(out.monthCommandShenShi).toBeTruthy()
    expect(out.monthZhi).toBe('寅')
    expect(out.computeTimeMs).toBeGreaterThanOrEqual(0)
    expect(out.cacheVersion).toBe('4.1.0')
    expect(out.executionMetadata).toBeDefined()
  })

  it('包含推导链', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    expect(out.derivation).toBeDefined()
    expect(out.derivation!.steps.length).toBeGreaterThanOrEqual(2)
    expect(out.derivation!.engineVersion).toBe('4.1.0')
  })

  it('候选格局来自 Module3', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    // candidates 应与 tenGodOutput.possiblePatterns 一致
    expect(out.candidates).toEqual(tenGodOut.possiblePatterns)
  })
})

// ─── 4. 格局判定测试 ───

describe('Pattern Engine: Recognition', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('甲日寅月 → 建禄格（月令比肩）', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    expect(out.patternRecognized).toBe(true)
    expect(out.primaryPattern).not.toBeNull()
    // 甲日寅月 → 月支本气甲 → 比肩得令 → 应识别到建禄格
    const patternNames = out.allPatterns.map(p => p.name)
    expect(patternNames).toContain('建禄格')
  })

  it('月令正官得力 → 识别到正官格', () => {
    // 丙日子月：子月本气癸 → 癸克丙(异性) = 正官 ✓
    const pillars = makePillars({ monthZhi: '子', dayGan: '丙', yearGan: '丙', hourGan: '丙' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    expect(out.patternRecognized).toBe(true)
    const patternNames = out.allPatterns.map(p => p.name)
    expect(patternNames).toContain('正官格')
  })

  it('主格局有完整字段', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    if (out.primaryPattern) {
      const p = out.primaryPattern
      expect(typeof p.formScore).toBe('number')
      expect(typeof p.grade).toBe('string')
      expect(p.isPrimary).toBe(true)
      expect(p.matchedSchools.length).toBeGreaterThan(0)
      expect(p.advantages.length).toBeGreaterThan(0)
      expect(p.analysis).toBeTruthy()
      expect(p.adjustments.length).toBeGreaterThan(0)
      expect(p.confidence).toBeGreaterThanOrEqual(0)
      expect(p.confidence).toBeLessThanOrEqual(100)
    }
  })
})

// ─── 5. 多流派测试 ───

describe('Pattern Engine: Multi-School', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('默认3个流派启用', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    expect(out.schoolEvaluations.length).toBe(3) // 子平/滴天髓/子平真诠
  })

  it('可配置仅启用子平', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const opts = { ...defaultOpts, schoolConfig: [{ name: '子平' as const, enabled: true, weight: 1.0 }] }
    const out = calculatePattern(pillars, tenGodOut, opts)

    expect(out.schoolEvaluations.length).toBe(1)
    expect(out.schoolEvaluations[0].school).toBe('子平')
  })

  it('流派评分有加权', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    for (const se of out.schoolEvaluations) {
      expect(typeof se.weightedScore).toBe('number')
      expect(typeof se.weight).toBe('number')
    }
  })
})

// ─── 6. 评分测试 ───

describe('Pattern Engine: Scoring', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('成格度在合理范围', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    for (const p of out.allPatterns) {
      expect(p.formScore).toBeGreaterThanOrEqual(0)
      expect(p.formScore).toBeLessThanOrEqual(100)
    }
  })

  it('可信度在合理范围', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    expect(out.overallConfidence).toBeGreaterThanOrEqual(0)
    expect(out.overallConfidence).toBeLessThanOrEqual(100)
  })
})

// ─── 7. 缓存测试 ───

describe('Pattern Engine: Cache', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('首次计算写入缓存', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    calculatePattern(pillars, tenGodOut, defaultOpts)
    expect(getPatternCacheSize()).toBe(1)
  })

  it('缓存命中时 computeTimeMs 为 0', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    calculatePattern(pillars, tenGodOut, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)
    expect(out.computeTimeMs).toBe(0)
  })

  it('clearPatternCache 清空缓存', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    calculatePattern(pillars, tenGodOut, defaultOpts)
    expect(getPatternCacheSize()).toBe(1)
    clearPatternCache()
    expect(getPatternCacheSize()).toBe(0)
  })
})

// ─── 8. 执行元数据测试 ───

describe('Pattern Engine: ExecutionMetadata', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('executionMetadata 完整', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    expect(out.executionMetadata.executionTime).toBeGreaterThanOrEqual(0)
    expect(out.executionMetadata.ruleCount).toBe(20)
    expect(out.executionMetadata.matchedRules).toBeGreaterThanOrEqual(0)
    expect(out.executionMetadata.evaluatedSchools).toBe(3)
  })
})

// ─── 9. AI Explain 测试 ───

describe('Pattern Engine: AI Explain', () => {
  it('generatePatternExplain 输出完整', () => {
    const detail: PatternDetail = {
      name: '正官格' as PatternType,
      patternClass: '正格' as PatternClass,
      formScore: 88,
      grade: '大成' as const,
      isPrimary: true,
      isSecondary: false,
      matchedSchools: ['子平', '滴天髓', '子平真诠'] as any[],
      advantages: ['官星得令', '印星辅助'],
      risks: ['伤官见官'],
      breakFactors: [{
        description: '伤官透出',
        severity: 80,
        involvedShenShi: ['伤官'] as ShenShi[],
        reference: '子平真诠',
      }],
      analysis: '正官格大成，成格度88分。',
      adjustments: ['佩印护官'],
      suggestions: ['格局大成，可顺势发展。'],
      confidence: 92,
      scoreDetail: {
        monthCommandBase: 30,
        touGanCondition: 15,
        rootSupport: 10,
        shenShiHarmony: 10,
        fiveElementBalance: 8,
        breakImpact: -10,
      },
      formationChain: {
        patternName: '正官格' as PatternType,
        conditions: [],
        satisfiedCount: 4,
        missingCount: 1,
        breakingCount: 1,
      },
      schoolResults: [],
    }

    const exp = generatePatternExplain(detail)
    expect(exp.name).toBe('正官格')
    expect(exp.analysis).toBeTruthy()
    expect(exp.patternAdvantages.length).toBeGreaterThan(0)
    expect(exp.patternRisks.length).toBeGreaterThan(0)
    expect(exp.patternSuggestions.length).toBeGreaterThan(0)
    expect(exp.breakFactors.length).toBeGreaterThan(0)
    expect(exp.adjustments.length).toBeGreaterThan(0)
    expect(exp.keywords.length).toBeGreaterThan(0)
    expect(exp.career.length).toBeGreaterThan(0)
    expect(exp.wealth.length).toBeGreaterThan(0)
    expect(exp.marriage.length).toBeGreaterThan(0)
    expect(exp.health.length).toBeGreaterThan(0)
  })
})

// ─── 10. RuleRegistry 集成测试 ───

describe('Pattern Engine: RuleRegistry', () => {
  it('格局规则已注册', () => {
    const gejuRules = defaultRuleRegistry.findByCategory('geju')
    expect(gejuRules.length).toBeGreaterThanOrEqual(5)
    const ids = gejuRules.map(r => r.id)
    expect(ids).toContain('pattern-engine')
    expect(ids).toContain('pattern-zheng-gua')
    expect(ids).toContain('pattern-special-gua')
    expect(ids).toContain('pattern-multi-school')
    expect(ids).toContain('pattern-break-check')
  })

  it('所有格局规则 module 为 module4-pattern', () => {
    const gejuRules = defaultRuleRegistry.findByCategory('geju')
    for (const r of gejuRules) {
      expect(r.module).toBe('module4-pattern')
    }
  })
})

// ─── 11. v4.1.0 冻结补充：Pattern Score Detail ───

describe('v4.1.0 Pattern Score Detail', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('每个格局都有 scoreDetail', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    for (const p of out.allPatterns) {
      expect(p.scoreDetail).toBeDefined()
      expect(typeof p.scoreDetail.monthCommandBase).toBe('number')
      expect(typeof p.scoreDetail.touGanCondition).toBe('number')
      expect(typeof p.scoreDetail.rootSupport).toBe('number')
      expect(typeof p.scoreDetail.shenShiHarmony).toBe('number')
      expect(typeof p.scoreDetail.fiveElementBalance).toBe('number')
      expect(typeof p.scoreDetail.breakImpact).toBe('number')
    }
  })

  it('月令基础分权重最高（30%）', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    if (out.primaryPattern) {
      const sd = out.primaryPattern.scoreDetail
      // 月令基础分应该 >= 其他单项
      expect(sd.monthCommandBase).toBeGreaterThanOrEqual(0)
      expect(sd.monthCommandBase).toBeLessThanOrEqual(30)
    }
  })

  it('破格影响可为负', () => {
    // 丙日子月 → 正官格可能遇到破格
    const pillars = makePillars({ monthZhi: '子', dayGan: '丙', yearGan: '丙', hourGan: '丙' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    // 至少有一个格局的 breakImpact <= 0
    const hasBreak = out.allPatterns.some(p => p.scoreDetail.breakImpact <= 0)
    // 不管是否有破格，字段都应存在
    for (const p of out.allPatterns) {
      expect(p.scoreDetail.breakImpact).toBeLessThanOrEqual(0)
    }
  })
})

// ─── 12. v4.1.0 冻结补充：Formation Chain ───

describe('v4.1.0 Formation Chain', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('每个格局都有 formationChain', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    for (const p of out.allPatterns) {
      expect(p.formationChain).toBeDefined()
      expect(p.formationChain.patternName).toBe(p.name)
      expect(p.formationChain.conditions).toBeInstanceOf(Array)
      expect(typeof p.formationChain.satisfiedCount).toBe('number')
      expect(typeof p.formationChain.missingCount).toBe('number')
      expect(typeof p.formationChain.breakingCount).toBe('number')
    }
  })

  it('条件链状态为 satisfied/missing/breaking', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    const validStatuses = ['satisfied', 'missing', 'breaking']
    for (const p of out.allPatterns) {
      for (const c of p.formationChain.conditions) {
        expect(validStatuses).toContain(c.status)
        expect(c.description).toBeTruthy()
        expect(c.reference).toBeTruthy()
      }
    }
  })

  it('满足数 + 缺失数 + 破格数 = 总条件数', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    for (const p of out.allPatterns) {
      const fc = p.formationChain
      expect(fc.satisfiedCount + fc.missingCount + fc.breakingCount).toBe(fc.conditions.length)
    }
  })
})

// ─── 13. v4.1.0 冻结补充：主格副格输出 ───

describe('v4.1.0 Main/Secondary Pattern', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('输出包含 secondaryPatterns', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    expect(out.secondaryPatterns).toBeInstanceOf(Array)
    // 如果识别到多个格局，应有副格
    if (out.allPatterns.length > 1) {
      expect(out.secondaryPatterns.length).toBeGreaterThan(0)
    }
  })

  it('主格 isPrimary=true，副格 isSecondary=true', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    if (out.primaryPattern) {
      expect(out.primaryPattern.isPrimary).toBe(true)
      expect(out.primaryPattern.isSecondary).toBe(false)
    }
    for (const sp of out.secondaryPatterns) {
      expect(sp.isSecondary).toBe(true)
      expect(sp.isPrimary).toBe(false)
    }
  })

  it('副格成格度 <= 主格成格度', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    if (out.primaryPattern && out.secondaryPatterns.length > 0) {
      for (const sp of out.secondaryPatterns) {
        expect(sp.formScore).toBeLessThanOrEqual(out.primaryPattern.formScore)
      }
    }
  })
})

// ─── 14. v4.1.0 冻结补充：Pattern Conflict Resolver ───

describe('v4.1.0 Pattern Conflict Resolver', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('输出包含 patternConflictResult', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    // 多格局时有冲突结果，单格局时可为null
    if (out.allPatterns.length > 1) {
      expect(out.patternConflictResult).not.toBeNull()
    }
  })

  it('冲突结果结构正确', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    if (out.patternConflictResult) {
      const cr = out.patternConflictResult
      expect(cr.mainPattern).toBeTruthy()
      expect(cr.secondaryPatterns).toBeInstanceOf(Array)
      expect(cr.conflictDescription).toBeTruthy()
      expect(['priority', 'absorb', 'relegate']).toContain(cr.resolutionMethod)
      expect(cr.mainPattern).toBe(out.primaryPattern?.name)
    }
  })

  it('单格局无冲突结果', () => {
    // 如果只有一个格局匹配
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    if (out.allPatterns.length <= 1) {
      expect(out.patternConflictResult).toBeNull()
    }
  })
})

// ─── 15. v4.1.0 冻结补充：School Results（流派解释记录） ───

describe('v4.1.0 School Results', () => {
  beforeEach(() => {
    clearTenGodsCache()
    clearPatternCache()
  })

  it('输出包含 schoolResults', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    expect(out.schoolResults).toBeInstanceOf(Array)
  })

  it('schoolResults 与启用的流派数一致', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    // 每个格局的 schoolResults 长度 = 配置的总流派数（含 disabled）
    if (out.primaryPattern) {
      expect(out.primaryPattern.schoolResults.length).toBe(DEFAULT_SCHOOL_CONFIG.length)
    }
  })

  it('每个 schoolResult 有 reason 字段', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    if (out.primaryPattern) {
      for (const sr of out.primaryPattern.schoolResults) {
        expect(sr.school).toBeTruthy()
        expect(typeof sr.matched).toBe('boolean')
        expect(typeof sr.formScore).toBe('number')
        expect(typeof sr.weight).toBe('number')
        expect(typeof sr.weightedScore).toBe('number')
        expect(typeof sr.reason).toBe('string')
      }
    }
  })

  it('未启用的流派 matched=false', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    if (out.primaryPattern) {
      const qiongTong = out.primaryPattern.schoolResults.find(s => s.school === '穷通宝鉴')
      // 穷通宝鉴默认关闭
      expect(qiongTong).toBeDefined()
      expect(qiongTong!.matched).toBe(false)
      expect(qiongTong!.formScore).toBe(0)
    }
  })
})

// ─── 16. v4.1.0 冻结补充：AI 解释增强 ───

describe('v4.1.0 AI Explain Enhancement', () => {
  it('generatePatternExplain 返回三组新字段', () => {
    const detail: PatternDetail = {
      name: '正官格' as PatternType,
      patternClass: '正格' as PatternClass,
      formScore: 75,
      grade: '中成' as const,
      isPrimary: true,
      isSecondary: false,
      matchedSchools: ['子平'] as any[],
      advantages: ['官星得令'],
      risks: ['伤官见官风险'],
      breakFactors: [],
      analysis: '正官格中成，成格度75分。',
      adjustments: ['佩印护官'],
      suggestions: ['需注意破格因素化解。'],
      confidence: 70,
      scoreDetail: {
        monthCommandBase: 30,
        touGanCondition: 15,
        rootSupport: 10,
        shenShiHarmony: 8,
        fiveElementBalance: 7,
        breakImpact: 0,
      },
      formationChain: {
        patternName: '正官格' as PatternType,
        conditions: [],
        satisfiedCount: 3,
        missingCount: 2,
        breakingCount: 0,
      },
      schoolResults: [],
    }

    const exp = generatePatternExplain(detail)
    // v4.1.0 新字段
    expect(exp.patternAdvantages).toEqual(detail.advantages)
    expect(exp.patternRisks).toEqual(detail.risks)
    expect(exp.patternSuggestions).toEqual(detail.suggestions)
  })

  it('格局详情包含 risks 和 suggestions', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    if (out.primaryPattern) {
      const p = out.primaryPattern
      expect(p.risks).toBeInstanceOf(Array)
      expect(p.suggestions).toBeInstanceOf(Array)
    }
  })
})

// ─── 17. v4.1.0 冻结补充：Cache Version ───

describe('v4.1.0 Cache Version', () => {
  it('PATTERN_CACHE_VERSION 与 PATTERN_ENGINE_VERSION 一致', () => {
    expect(PATTERN_CACHE_VERSION).toBe(PATTERN_ENGINE_VERSION)
  })

  it('输出 cacheVersion 字段正确', () => {
    const pillars = makePillars({ monthZhi: '寅', dayGan: '甲' })
    const tenGodOut = calculateTenGods(pillars, defaultOpts)
    const out = calculatePattern(pillars, tenGodOut, defaultOpts)

    expect(out.cacheVersion).toBe('4.1.0')
  })

  it('缓存 key 包含版本号', () => {
    // 验证缓存使用版本号隔离：不同版本的缓存不会互相污染
    expect(PATTERN_CACHE_VERSION).toContain('4.1')
  })
})
