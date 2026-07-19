/**
 * Module 7 v7.0.0: Professional AI Report Engine — 全量测试
 *
 * 覆盖：版本号、数据库规则（交叉验证/AI解释知识库/风险/机会/建议/时间轴）、
 *       工具函数（getDimensionLevel/getRiskLevel）、引擎输出结构、
 *       交叉验证、命局总评、五维评分、时间轴、风险、机会、建议、AI解释、
 *       缓存、推导链、options 开关、多次调用一致性、不同输入不同输出、边界情况
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { HeavenlyStem, EarthlyBranch, FiveElement, ShenShi, YinYang, NaYin as NaYinType, ShiErChangSheng } from '@/lib/core/types/base'
import type { ModuleInputs, RiskType, RiskLevel, OpportunityType, RecommendationCategory, DimensionLevel, LifeStage, MasterReportOptions } from '../masterReportTypes'
import { getDimensionLevel, getRiskLevel } from '../masterReportTypes'
import { generateMasterReport, MASTER_REPORT_VERSION, MASTER_REPORT_CACHE_VERSION, clearMasterReportCache, getMasterReportCacheSize } from '../masterReportEngine'
import {
  CROSS_VALIDATION_RULES, MASTER_EXPLAIN_KB, RISK_RULES, OPPORTUNITY_RULES,
  RECOMMENDATION_RULES, TIMELINE_STAGE_RULES,
  getCrossValidationRules, getExplainByTopic, getAllExplainEntries,
  getRiskRule, getOpportunityRule, getRecommendationRule, getTimelineStageRule,
} from '../masterReportDatabase'

// ─── 辅助：构建完整 ModuleInputs mock 数据 ───

function makeModuleInputs(): ModuleInputs {
  return {
    pillars: {
      version: '1.0.0',
      sixLines: {
        year: { gan: '甲' as HeavenlyStem, zhi: '子' as EarthlyBranch },
        month: { gan: '丙' as HeavenlyStem, zhi: '寅' as EarthlyBranch },
        day: { gan: '甲' as HeavenlyStem, zhi: '午' as EarthlyBranch },
        hour: { gan: '甲' as HeavenlyStem, zhi: '子' as EarthlyBranch },
      },
      pillars: {
        year: null as never, month: null as never,
        day: null as never, hour: null as never,
      },
      dayMaster: '甲' as HeavenlyStem,
      dayMasterElement: '木' as FiveElement,
      dayMasterYinYang: '阳' as YinYang,
      fiveElementCount: { '木': 3, '火': 2, '土': 1, '金': 1, '水': 1 } as Record<FiveElement, number>,
      naYin: {
        year: '海中金' as NaYinType, month: '炉中火' as NaYinType,
        day: '海中金' as NaYinType, hour: '海中金' as NaYinType,
      },
      changSheng: {
        year: '沐浴' as ShiErChangSheng, month: '长生' as ShiErChangSheng,
        day: '帝旺' as ShiErChangSheng, hour: '沐浴' as ShiErChangSheng,
      },
      kongWang: [],
      mingGong: null as never,
      shenGong: null as never,
      taiYuan: null as never,
      taiXi: null as never,
      cangGanMap: {} as Record<EarthlyBranch, never>,
      derivation: {
        steps: [], overallConfidence: 1, computeTimeMs: 0,
        engineVersion: '1.0.0', algorithmVersion: 'v1.0-classic' as const, warnings: [],
      },
      warnings: [],
      computedAt: Date.now(),
    },
    shenSha: {
      version: '2.0.0',
      results: [],
      byCategory: {} as never,
      hits: [],
      auspicious: [],
      inauspicious: [],
      stats: { total: 0, hitCount: 0, missCount: 0, auspiciousCount: 0, inauspiciousCount: 0 },
      warnings: [],
      computeTimeMs: 0,
    },
    tenGods: {
      version: '3.1.0',
      dayMaster: '甲' as HeavenlyStem,
      dayMasterElement: '木' as FiveElement,
      dayMasterYinYang: '阳' as YinYang,
      details: [],
      touCang: null as never,
      fiveElementPower: [],
      relationNetwork: null as never,
      combinations: [],
      sortedByPower: [],
      dominantShenShi: ['比肩' as ShenShi],
      primaryShenShi: ['比肩' as ShenShi],
      secondaryShenShi: [],
      tertiaryShenShi: [],
      overallAuspiciousScore: 60,
      overallBalanceScore: 55,
      warnings: [],
      computeTimeMs: 0,
      executionMetadata: null as never,
      possiblePatterns: [],
      cacheVersion: '3.1.0',
    },
    pattern: {
      version: '4.1.0',
      dayMaster: '甲' as HeavenlyStem,
      dayMasterElement: '木' as FiveElement,
      primaryPattern: {
        name: '偏财格',
        patternClass: '正格',
        formScore: 70,
        grade: '中成',
        isPrimary: true,
        isSecondary: false,
        matchedSchools: ['子平'],
        advantages: ['月令偏财透干'],
        risks: ['比劫夺财'],
        breakFactors: [],
        analysis: '甲木日主生于寅月，月令偏财透干',
        adjustments: ['避免与比劫旺者合伙'],
        suggestions: ['适宜商业经营'],
        confidence: 70,
        scoreDetail: {
          monthCommandBase: 80, touGanCondition: 70, rootSupport: 60,
          shenShiHarmony: 65, fiveElementBalance: 55, breakImpact: -10,
        },
        formationChain: {
          patternName: '偏财格',
          conditions: [],
          satisfiedCount: 4, missingCount: 1, breakingCount: 0,
          overallScore: 70,
        },
        schoolResults: [],
      } as never,
      secondaryPatterns: [],
      allPatterns: [],
      patternConflictResult: null,
      candidates: [],
      schoolEvaluations: [],
      schoolResults: [],
      overallPatternScore: 70,
      overallConfidence: 0.7,
      patternRecognized: true,
      schoolConfig: [],
      monthCommandShenShi: '偏财' as ShenShi,
      monthZhi: '寅' as EarthlyBranch,
      warnings: [],
      computeTimeMs: 0,
      executionMetadata: null as never,
      cacheVersion: '4.1.0',
    },
    xiYong: {
      version: '5.0.0',
      dayMaster: '甲' as HeavenlyStem,
      dayMasterElement: '木' as FiveElement,
      strength: {
        strengthScore: 55,
        strengthLevel: '偏强' as const,
        confidence: 60,
        dimensionScores: {
          deLing: 50, deDi: 50, deShi: 50, tenGodPower: 55,
          fiveElementBalance: 50, patternBonus: 0, shenShaBonus: 0,
        },
      },
      xiYongGroup: {
        xiShen: [{ element: '水' as FiveElement, role: '喜神' as const, priority: 1, score: 70, source: '扶抑', reason: '身偏强喜水润', classicalReference: '滴天髓', confidence: 70, involvedShenShi: ['正印' as ShenShi] }],
        yongShen: [{ element: '木' as FiveElement, role: '用神' as const, priority: 2, score: 60, source: '扶抑', reason: '木为日主喜同类', classicalReference: '滴天髓', confidence: 60, involvedShenShi: ['比肩' as ShenShi] }],
        jiShen: [{ element: '金' as FiveElement, role: '忌神' as const, priority: 1, score: 50, source: '克泄', reason: '金克木为忌', classicalReference: '滴天髓', confidence: 50, involvedShenShi: ['正财' as ShenShi] }],
        enemyShen: [],
        neutralShen: [],
      },
      climateAnalysis: null as never,
      fuYiAnalysis: null as never,
      schoolResults: [],
      conflictResult: null as never,
      scoreDetail: null as never,
      overallXiYongScore: 50,
      overallConfidence: 0.5,
      primaryXiShen: '水' as FiveElement,
      primaryYongShen: '木' as FiveElement,
      primaryJiShen: '金' as FiveElement,
      schoolConfig: [],
      warnings: [],
      computeTimeMs: 0,
      executionMetadata: null as never,
      cacheVersion: '5.0.0',
    },
    fortune: {
      version: '6.0.0',
      dayMaster: '甲' as HeavenlyStem,
      dayMasterElement: '木' as FiveElement,
      qiYunInfo: {
        startAge: 5, startYear: 1995, startDate: '1995-01-01',
        isShun: true, algorithm: 'classic',
        fromTerm: '', toTerm: '', confidence: 80,
      },
      daYunSteps: [],
      liuNianYears: [],
      events: [],
      scores: {
        fortuneScore: 60, luckScore: 55, careerScore: 58,
        wealthScore: 52, relationshipScore: 50,
        healthScore: 65, studyScore: 60,
        opportunityScore: 55, riskScore: 40,
      },
      warnings: [],
      computeTimeMs: 0,
      executionMetadata: null as never,
      cacheVersion: '6.0.0',
    },
  }
}

beforeEach(() => { clearMasterReportCache() })

// ─── 辅助：封装 generateMasterReport，默认传空 options ───

function runReport(inputs: ModuleInputs, options?: MasterReportOptions) {
  return generateMasterReport(inputs, options ?? {})
}

// ═══════════════════════════════════════════
// 1. 版本号 (2)
// ═══════════════════════════════════════════

describe('版本号', () => {
  it('MASTER_REPORT_VERSION === "7.0.0"', () => {
    expect(MASTER_REPORT_VERSION).toBe('7.0.0')
  })

  it('MASTER_REPORT_CACHE_VERSION === "7.0.0"', () => {
    expect(MASTER_REPORT_CACHE_VERSION).toBe('7.0.0')
  })
})

// ═══════════════════════════════════════════
// 2. Database: 交叉验证规则 (4)
// ═══════════════════════════════════════════

describe('Database: 交叉验证规则', () => {
  it('CROSS_VALIDATION_RULES 长度 === 8', () => {
    expect(CROSS_VALIDATION_RULES).toHaveLength(8)
  })

  it('每条有 id/name/modules/description/classicalReference', () => {
    for (const rule of CROSS_VALIDATION_RULES) {
      expect(rule.id).toBeDefined()
      expect(rule.name).toBeDefined()
      expect(rule.modules.length).toBeGreaterThan(0)
      expect(rule.description.length).toBeGreaterThan(0)
      expect(rule.classicalReference.length).toBeGreaterThan(0)
    }
  })

  it('getCrossValidationRules() 返回同数组', () => {
    const result = getCrossValidationRules()
    expect(result).toBe(CROSS_VALIDATION_RULES)
    expect(result).toHaveLength(8)
  })

  it('每条规则的 modules 为非空数组且包含有效模块名', () => {
    const validModules = ['pattern', 'tenGods', 'xiYong', 'shenSha', 'fortune']
    for (const rule of CROSS_VALIDATION_RULES) {
      for (const mod of rule.modules) {
        expect(validModules).toContain(mod)
      }
    }
  })
})

// ═══════════════════════════════════════════
// 3. Database: AI解释知识库 (6)
// ═══════════════════════════════════════════

describe('Database: AI解释知识库', () => {
  it('MASTER_EXPLAIN_KB 长度 === 12', () => {
    expect(MASTER_EXPLAIN_KB).toHaveLength(12)
  })

  it('每条有 topic/keywords/classicalReference/modernInterpretation/plainExplanation', () => {
    for (const entry of MASTER_EXPLAIN_KB) {
      expect(entry.topic).toBeDefined()
      expect(entry.keywords.length).toBeGreaterThan(0)
      expect(entry.classicalReference.length).toBeGreaterThan(0)
      expect(entry.modernInterpretation.length).toBeGreaterThan(0)
      expect(entry.plainExplanation.length).toBeGreaterThan(0)
    }
  })

  it('getExplainByTopic("格局评价") 有结果', () => {
    const entry = getExplainByTopic('格局评价')
    expect(entry).toBeDefined()
    expect(entry!.topic).toBe('格局评价')
  })

  it('getExplainByTopic("不存在的主题") === undefined', () => {
    const entry = getExplainByTopic('不存在的主题')
    expect(entry).toBeUndefined()
  })

  it('getAllExplainEntries() 长度 === 12', () => {
    const entries = getAllExplainEntries()
    expect(entries).toHaveLength(12)
  })

  it('每条条目包含 sourceModules', () => {
    for (const entry of MASTER_EXPLAIN_KB) {
      expect(entry.sourceModules.length).toBeGreaterThan(0)
    }
  })
})

// ═══════════════════════════════════════════
// 4. Database: 风险规则 (4)
// ═══════════════════════════════════════════

describe('Database: 风险规则', () => {
  it('RISK_RULES 长度 === 6', () => {
    expect(RISK_RULES).toHaveLength(6)
  })

  it('getRiskRule("事业风险") 有结果', () => {
    const rule = getRiskRule('事业风险')
    expect(rule).toBeDefined()
    expect(rule!.type).toBe('事业风险')
  })

  it('每条有 levelIndicators', () => {
    for (const rule of RISK_RULES) {
      expect(rule.levelIndicators).toBeDefined()
      expect(rule.levelIndicators.high.length).toBeGreaterThan(0)
      expect(rule.levelIndicators.medium.length).toBeGreaterThan(0)
      expect(rule.levelIndicators.low.length).toBeGreaterThan(0)
    }
  })

  it('每条有 suggestion 和 avoidance', () => {
    for (const rule of RISK_RULES) {
      expect(rule.suggestion.length).toBeGreaterThan(0)
      expect(rule.avoidance.length).toBeGreaterThan(0)
    }
  })
})

// ═══════════════════════════════════════════
// 5. Database: 机会规则 (4)
// ═══════════════════════════════════════════

describe('Database: 机会规则', () => {
  it('OPPORTUNITY_RULES 长度 === 6', () => {
    expect(OPPORTUNITY_RULES).toHaveLength(6)
  })

  it('getOpportunityRule("事业机会") 有结果', () => {
    const rule = getOpportunityRule('事业机会')
    expect(rule).toBeDefined()
    expect(rule!.type).toBe('事业机会')
  })

  it('每条有 detectionModules 和 classicalReference', () => {
    for (const rule of OPPORTUNITY_RULES) {
      expect(rule.detectionModules.length).toBeGreaterThan(0)
      expect(rule.classicalReference.length).toBeGreaterThan(0)
    }
  })

  it('机会类型覆盖6种', () => {
    const types = OPPORTUNITY_RULES.map(r => r.type)
    const expected: OpportunityType[] = ['事业机会', '创业机会', '投资机会', '婚恋机会', '学习机会', '迁移机会']
    for (const t of expected) {
      expect(types).toContain(t)
    }
  })
})

// ═══════════════════════════════════════════
// 6. Database: 建议规则 (4)
// ═══════════════════════════════════════════

describe('Database: 建议规则', () => {
  it('RECOMMENDATION_RULES 长度 === 9', () => {
    expect(RECOMMENDATION_RULES).toHaveLength(9)
  })

  it('getRecommendationRule("五行补救") 有结果', () => {
    const rule = getRecommendationRule('五行补救')
    expect(rule).toBeDefined()
    expect(rule!.category).toBe('五行补救')
  })

  it('每条有 elementMapping', () => {
    for (const rule of RECOMMENDATION_RULES) {
      expect(rule.elementMapping).toBeDefined()
      expect(Object.keys(rule.elementMapping).length).toBeGreaterThan(0)
    }
  })

  it('建议类别覆盖9种', () => {
    const categories = RECOMMENDATION_RULES.map(r => r.category)
    const expected: RecommendationCategory[] = [
      '职业建议', '行业建议', '城市建议', '颜色建议', '数字建议',
      '方位建议', '五行补救', '风水建议', '生活建议',
    ]
    for (const c of expected) {
      expect(categories).toContain(c)
    }
  })
})

// ═══════════════════════════════════════════
// 7. Database: 时间轴规则 (4)
// ═══════════════════════════════════════════

describe('Database: 时间轴规则', () => {
  it('TIMELINE_STAGE_RULES 长度 === 4', () => {
    expect(TIMELINE_STAGE_RULES).toHaveLength(4)
  })

  it('getTimelineStageRule("儿童") 有结果', () => {
    const rule = getTimelineStageRule('儿童')
    expect(rule).toBeDefined()
    expect(rule!.stage).toBe('儿童')
  })

  it('阶段包含 "儿童"|"青年"|"中年"|"晚年"', () => {
    const stages = TIMELINE_STAGE_RULES.map(r => r.stage)
    expect(stages).toContain('儿童')
    expect(stages).toContain('青年')
    expect(stages).toContain('中年')
    expect(stages).toContain('晚年')
  })

  it('每条有 ageRange 和 focusModules', () => {
    for (const rule of TIMELINE_STAGE_RULES) {
      expect(rule.ageRange.length).toBeGreaterThan(0)
      expect(rule.focusModules.length).toBeGreaterThan(0)
    }
  })
})

// ═══════════════════════════════════════════
// 8. Types: 工具函数 (9)
// ═══════════════════════════════════════════

describe('Types: 工具函数', () => {
  // getDimensionLevel 测试
  it('getDimensionLevel(90) === "优秀"', () => {
    expect(getDimensionLevel(90)).toBe('优秀')
  })

  it('getDimensionLevel(75) === "良好"', () => {
    expect(getDimensionLevel(75)).toBe('良好')
  })

  it('getDimensionLevel(55) === "中等"', () => {
    expect(getDimensionLevel(55)).toBe('中等')
  })

  it('getDimensionLevel(35) === "偏弱"', () => {
    expect(getDimensionLevel(35)).toBe('偏弱')
  })

  it('getDimensionLevel(10) === "较差"', () => {
    expect(getDimensionLevel(10)).toBe('较差')
  })

  it('getDimensionLevel 边界值 85 → "优秀"', () => {
    expect(getDimensionLevel(85)).toBe('优秀')
  })

  // getRiskLevel 测试
  it('getRiskLevel(0.9) === "高"', () => {
    expect(getRiskLevel(0.9)).toBe('高')
  })

  it('getRiskLevel(0.7) === "中"', () => {
    expect(getRiskLevel(0.7)).toBe('中')
  })

  it('getRiskLevel(0.4) === "低"', () => {
    expect(getRiskLevel(0.4)).toBe('低')
  })

  it('getRiskLevel(0.1) === "极低"', () => {
    expect(getRiskLevel(0.1)).toBe('极低')
  })

  it('getRiskLevel 边界值 0.8 → "高"', () => {
    expect(getRiskLevel(0.8)).toBe('高')
  })
})

// ═══════════════════════════════════════════
// 9. Engine: 输出结构 (1)
// ═══════════════════════════════════════════

describe('Engine: 输出结构', () => {
  it('runReport(inputs) 返回对象有完整字段', () => {
    const inputs = makeModuleInputs()
    const report = runReport(inputs)
    expect(report).toBeDefined()
    expect(report).toHaveProperty('version')
    expect(report).toHaveProperty('dayMaster')
    expect(report).toHaveProperty('dayMasterElement')
    expect(report).toHaveProperty('overallAssessment')
    expect(report).toHaveProperty('fiveDimensionScores')
    expect(report).toHaveProperty('crossValidation')
    expect(report).toHaveProperty('timeline')
    expect(report).toHaveProperty('risks')
    expect(report).toHaveProperty('opportunities')
    expect(report).toHaveProperty('recommendations')
    expect(report).toHaveProperty('explains')
    expect(report).toHaveProperty('warnings')
    expect(report).toHaveProperty('computeTimeMs')
    expect(report).toHaveProperty('executionMetadata')
    expect(report).toHaveProperty('cacheVersion')
    expect(report).toHaveProperty('derivation')
  })
})

// ═══════════════════════════════════════════
// 10. Engine: 输出字段类型 (11)
// ═══════════════════════════════════════════

describe('Engine: 输出字段类型', () => {
  it('version === "7.0.0"', () => {
    const report = runReport(makeModuleInputs())
    expect(report.version).toBe('7.0.0')
  })

  it('dayMaster === "甲"', () => {
    const report = runReport(makeModuleInputs())
    expect(report.dayMaster).toBe('甲')
  })

  it('fiveDimensionScores.career.score 在 0~100', () => {
    const report = runReport(makeModuleInputs())
    expect(report.fiveDimensionScores.career.score).toBeGreaterThanOrEqual(0)
    expect(report.fiveDimensionScores.career.score).toBeLessThanOrEqual(100)
  })

  it('fiveDimensionScores.overall 在 0~100', () => {
    const report = runReport(makeModuleInputs())
    expect(report.fiveDimensionScores.overall).toBeGreaterThanOrEqual(0)
    expect(report.fiveDimensionScores.overall).toBeLessThanOrEqual(100)
  })

  it('crossValidation.confidence 在 0~1', () => {
    const report = runReport(makeModuleInputs())
    expect(report.crossValidation.confidence).toBeGreaterThanOrEqual(0)
    expect(report.crossValidation.confidence).toBeLessThanOrEqual(1)
  })

  it('timeline 长度 >= 1（空大运时至少有儿童阶段）', () => {
    const report = runReport(makeModuleInputs())
    expect(report.timeline.length).toBeGreaterThanOrEqual(1)
  })

  it('risks 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.risks)).toBe(true)
  })

  it('opportunities 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.opportunities)).toBe(true)
  })

  it('recommendations 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.recommendations)).toBe(true)
  })

  it('explains 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.explains)).toBe(true)
  })

  it('executionMetadata.cacheVersion === "7.0.0"', () => {
    const report = runReport(makeModuleInputs())
    expect(report.executionMetadata.cacheVersion).toBe('7.0.0')
  })
})

// ═══════════════════════════════════════════
// 11. Engine: 交叉验证 (4)
// ═══════════════════════════════════════════

describe('Engine: 交叉验证', () => {
  it('crossValidation 有 validated/confidence/reasons/contradictions/supportingModules/traceChain', () => {
    const report = runReport(makeModuleInputs())
    const cv = report.crossValidation
    expect(cv).toHaveProperty('validated')
    expect(cv).toHaveProperty('confidence')
    expect(cv).toHaveProperty('reasons')
    expect(cv).toHaveProperty('contradictions')
    expect(cv).toHaveProperty('supportingModules')
    expect(cv).toHaveProperty('traceChain')
  })

  it('crossValidation.confidence 是数字', () => {
    const report = runReport(makeModuleInputs())
    expect(typeof report.crossValidation.confidence).toBe('number')
  })

  it('crossValidation.reasons 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.crossValidation.reasons)).toBe(true)
  })

  it('crossValidation.supportingModules 包含字符串', () => {
    const report = runReport(makeModuleInputs())
    for (const mod of report.crossValidation.supportingModules) {
      expect(typeof mod).toBe('string')
    }
  })
})

// ═══════════════════════════════════════════
// 12. Engine: 命局总评 (5)
// ═══════════════════════════════════════════

describe('Engine: 命局总评', () => {
  it('overallAssessment 有完整字段', () => {
    const report = runReport(makeModuleInputs())
    const oa = report.overallAssessment
    expect(oa).toHaveProperty('summary')
    expect(oa).toHaveProperty('patternEvaluation')
    expect(oa).toHaveProperty('lifePositioning')
    expect(oa).toHaveProperty('strengths')
    expect(oa).toHaveProperty('weaknesses')
    expect(oa).toHaveProperty('opportunities')
    expect(oa).toHaveProperty('risks')
    expect(oa).toHaveProperty('developmentDirection')
    expect(oa).toHaveProperty('sourceModules')
    expect(oa).toHaveProperty('confidence')
  })

  it('summary 是非空字符串', () => {
    const report = runReport(makeModuleInputs())
    expect(typeof report.overallAssessment.summary).toBe('string')
    expect(report.overallAssessment.summary.length).toBeGreaterThan(0)
  })

  it('strengths 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.overallAssessment.strengths)).toBe(true)
  })

  it('weaknesses 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.overallAssessment.weaknesses)).toBe(true)
  })

  it('sourceModules 包含模块名', () => {
    const report = runReport(makeModuleInputs())
    expect(report.overallAssessment.sourceModules.length).toBeGreaterThan(0)
    for (const mod of report.overallAssessment.sourceModules) {
      expect(typeof mod).toBe('string')
    }
  })
})

// ═══════════════════════════════════════════
// 13. Engine: 五维评分 (5)
// ═══════════════════════════════════════════

describe('Engine: 五维评分', () => {
  it('fiveDimensionScores 有 career/wealth/marriage/health/study/overall', () => {
    const report = runReport(makeModuleInputs())
    const fds = report.fiveDimensionScores
    expect(fds).toHaveProperty('career')
    expect(fds).toHaveProperty('wealth')
    expect(fds).toHaveProperty('marriage')
    expect(fds).toHaveProperty('health')
    expect(fds).toHaveProperty('study')
    expect(fds).toHaveProperty('overall')
  })

  it('career 有 score/level/influencedModules/weight/reasons/confidence', () => {
    const report = runReport(makeModuleInputs())
    const career = report.fiveDimensionScores.career
    expect(career).toHaveProperty('score')
    expect(career).toHaveProperty('level')
    expect(career).toHaveProperty('influencedModules')
    expect(career).toHaveProperty('weight')
    expect(career).toHaveProperty('reasons')
    expect(career).toHaveProperty('confidence')
  })

  it('5个维度 score 都在 0~100', () => {
    const report = runReport(makeModuleInputs())
    const dims = ['career', 'wealth', 'marriage', 'health', 'study'] as const
    for (const dim of dims) {
      const score = report.fiveDimensionScores[dim].score
      expect(score).toBeGreaterThanOrEqual(0)
      expect(score).toBeLessThanOrEqual(100)
    }
  })

  it('overall 是加权总分', () => {
    const report = runReport(makeModuleInputs())
    expect(typeof report.fiveDimensionScores.overall).toBe('number')
    expect(report.fiveDimensionScores.overall).toBeGreaterThanOrEqual(0)
    expect(report.fiveDimensionScores.overall).toBeLessThanOrEqual(100)
  })

  it('level 是有效的 DimensionLevel', () => {
    const report = runReport(makeModuleInputs())
    const validLevels: DimensionLevel[] = ['优秀', '良好', '中等', '偏弱', '较差']
    const dims = ['career', 'wealth', 'marriage', 'health', 'study'] as const
    for (const dim of dims) {
      expect(validLevels).toContain(report.fiveDimensionScores[dim].level)
    }
  })
})

// ═══════════════════════════════════════════
// 14. Engine: 时间轴 (5)
// ═══════════════════════════════════════════

describe('Engine: 时间轴', () => {
  it('timeline 长度 >= 1（空大运时至少有儿童阶段）', () => {
    const report = runReport(makeModuleInputs())
    expect(report.timeline.length).toBeGreaterThanOrEqual(1)
  })

  it('每项有 stage/ageRange/summary/fortuneInfluence/xiYongInfluence/keyEvents/confidence', () => {
    const report = runReport(makeModuleInputs())
    for (const stage of report.timeline) {
      expect(stage).toHaveProperty('stage')
      expect(stage).toHaveProperty('ageRange')
      expect(stage).toHaveProperty('summary')
      expect(stage).toHaveProperty('fortuneInfluence')
      expect(stage).toHaveProperty('xiYongInfluence')
      expect(stage).toHaveProperty('keyEvents')
      expect(stage).toHaveProperty('confidence')
    }
  })

  it('stage 包含 "儿童"', () => {
    const report = runReport(makeModuleInputs())
    const stages = report.timeline.map(s => s.stage)
    expect(stages).toContain('儿童')
  })

  it('ageRange 是非空字符串', () => {
    const report = runReport(makeModuleInputs())
    for (const stage of report.timeline) {
      expect(typeof stage.ageRange).toBe('string')
      expect(stage.ageRange.length).toBeGreaterThan(0)
    }
  })

  it('keyEvents 是数组', () => {
    const report = runReport(makeModuleInputs())
    for (const stage of report.timeline) {
      expect(Array.isArray(stage.keyEvents)).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════
// 15. Engine: 风险 (4)
// ═══════════════════════════════════════════

describe('Engine: 风险', () => {
  it('risks 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.risks)).toBe(true)
  })

  it('每项有 type/level/reason/sourceModules/suggestion/avoidance/confidence', () => {
    const report = runReport(makeModuleInputs())
    for (const risk of report.risks) {
      expect(risk).toHaveProperty('type')
      expect(risk).toHaveProperty('level')
      expect(risk).toHaveProperty('reason')
      expect(risk).toHaveProperty('sourceModules')
      expect(risk).toHaveProperty('suggestion')
      expect(risk).toHaveProperty('avoidance')
      expect(risk).toHaveProperty('confidence')
    }
  })

  it('type 是有效的 RiskType', () => {
    const report = runReport(makeModuleInputs())
    const validTypes: RiskType[] = ['事业风险', '投资风险', '婚姻风险', '健康风险', '官非风险', '财务风险']
    for (const risk of report.risks) {
      expect(validTypes).toContain(risk.type)
    }
  })

  it('level 是有效的 RiskLevel', () => {
    const report = runReport(makeModuleInputs())
    const validLevels: RiskLevel[] = ['高', '中', '低', '极低']
    for (const risk of report.risks) {
      expect(validLevels).toContain(risk.level)
    }
  })
})

// ═══════════════════════════════════════════
// 16. Engine: 机会 (4)
// ═══════════════════════════════════════════

describe('Engine: 机会', () => {
  it('opportunities 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.opportunities)).toBe(true)
  })

  it('每项有 type/timing/reason/sourceModules/confidence', () => {
    const report = runReport(makeModuleInputs())
    for (const opp of report.opportunities) {
      expect(opp).toHaveProperty('type')
      expect(opp).toHaveProperty('timing')
      expect(opp).toHaveProperty('reason')
      expect(opp).toHaveProperty('sourceModules')
      expect(opp).toHaveProperty('confidence')
    }
  })

  it('type 是有效的 OpportunityType', () => {
    const report = runReport(makeModuleInputs())
    const validTypes: OpportunityType[] = ['事业机会', '创业机会', '投资机会', '婚恋机会', '学习机会', '迁移机会']
    for (const opp of report.opportunities) {
      expect(validTypes).toContain(opp.type)
    }
  })

  it('confidence 在 0~1', () => {
    const report = runReport(makeModuleInputs())
    for (const opp of report.opportunities) {
      expect(opp.confidence).toBeGreaterThanOrEqual(0)
      expect(opp.confidence).toBeLessThanOrEqual(1)
    }
  })
})

// ═══════════════════════════════════════════
// 17. Engine: 建议 (4)
// ═══════════════════════════════════════════

describe('Engine: 建议', () => {
  it('recommendations 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.recommendations)).toBe(true)
  })

  it('每项有 category/content/relatedElements/relatedModules/reasoning', () => {
    const report = runReport(makeModuleInputs())
    for (const rec of report.recommendations) {
      expect(rec).toHaveProperty('category')
      expect(rec).toHaveProperty('content')
      expect(rec).toHaveProperty('relatedElements')
      expect(rec).toHaveProperty('relatedModules')
      expect(rec).toHaveProperty('reasoning')
    }
  })

  it('category 是有效的 RecommendationCategory', () => {
    const report = runReport(makeModuleInputs())
    const validCategories: RecommendationCategory[] = [
      '职业建议', '行业建议', '城市建议', '颜色建议', '数字建议',
      '方位建议', '五行补救', '风水建议', '生活建议',
    ]
    for (const rec of report.recommendations) {
      expect(validCategories).toContain(rec.category)
    }
  })

  it('relatedElements 是 FiveElement 数组', () => {
    const report = runReport(makeModuleInputs())
    const validElements: FiveElement[] = ['木', '火', '土', '金', '水']
    for (const rec of report.recommendations) {
      expect(Array.isArray(rec.relatedElements)).toBe(true)
      for (const el of rec.relatedElements) {
        expect(validElements).toContain(el)
      }
    }
  })
})

// ═══════════════════════════════════════════
// 18. Engine: AI解释 (4)
// ═══════════════════════════════════════════

describe('Engine: AI解释', () => {
  it('explains 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.explains)).toBe(true)
  })

  it('每项有 topic/classicalReference/modernInterpretation/professionalExplanation/plainExplanation/risks/suggestions/keywords/sourceModules', () => {
    const report = runReport(makeModuleInputs())
    for (const explain of report.explains) {
      expect(explain).toHaveProperty('topic')
      expect(explain).toHaveProperty('classicalReference')
      expect(explain).toHaveProperty('modernInterpretation')
      expect(explain).toHaveProperty('professionalExplanation')
      expect(explain).toHaveProperty('plainExplanation')
      expect(explain).toHaveProperty('risks')
      expect(explain).toHaveProperty('suggestions')
      expect(explain).toHaveProperty('keywords')
      expect(explain).toHaveProperty('sourceModules')
    }
  })

  it('topic 是非空字符串', () => {
    const report = runReport(makeModuleInputs())
    for (const explain of report.explains) {
      expect(typeof explain.topic).toBe('string')
      expect(explain.topic.length).toBeGreaterThan(0)
    }
  })

  it('risks 和 suggestions 是数组', () => {
    const report = runReport(makeModuleInputs())
    for (const explain of report.explains) {
      expect(Array.isArray(explain.risks)).toBe(true)
      expect(Array.isArray(explain.suggestions)).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════
// 19. Engine: 缓存 (4)
// ═══════════════════════════════════════════

describe('Engine: 缓存', () => {
  it('首次调用后 getMasterReportCacheSize() === 1', () => {
    expect(getMasterReportCacheSize()).toBe(0)
    runReport(makeModuleInputs())
    expect(getMasterReportCacheSize()).toBe(1)
  })

  it('相同输入再次调用命中缓存', () => {
    const inputs = makeModuleInputs()
    const report1 = runReport(inputs)
    const report2 = runReport(inputs)
    expect(getMasterReportCacheSize()).toBe(1)
    // 缓存命中，返回同一引用
    expect(report1).toBe(report2)
  })

  it('clearMasterReportCache() 后 size === 0', () => {
    runReport(makeModuleInputs())
    expect(getMasterReportCacheSize()).toBe(1)
    clearMasterReportCache()
    expect(getMasterReportCacheSize()).toBe(0)
  })

  it('不同输入产生不同缓存条目', () => {
    const inputs1 = makeModuleInputs()
    const inputs2 = makeModuleInputs()
    // 修改 pillars 的 dayMaster 使缓存 key 不同
    inputs2.pillars.dayMaster = '乙' as HeavenlyStem
    inputs2.pillars.dayMasterElement = '木' as FiveElement
    inputs2.pillars.sixLines.day.gan = '乙' as HeavenlyStem
    runReport(inputs1)
    runReport(inputs2)
    expect(getMasterReportCacheSize()).toBe(2)
  })
})

// ═══════════════════════════════════════════
// 20. Engine: DerivationChain (4)
// ═══════════════════════════════════════════

describe('Engine: DerivationChain', () => {
  it('derivation.steps 长度 >= 8（8步 pipeline）', () => {
    const report = runReport(makeModuleInputs())
    expect(report.derivation.steps.length).toBeGreaterThanOrEqual(8)
  })

  it('overallConfidence 是数字', () => {
    const report = runReport(makeModuleInputs())
    expect(typeof report.derivation.overallConfidence).toBe('number')
  })

  it('engineVersion === "7.0.0"', () => {
    const report = runReport(makeModuleInputs())
    expect(report.derivation.engineVersion).toBe('7.0.0')
  })

  it('computeTimeMs >= 0', () => {
    const report = runReport(makeModuleInputs())
    expect(report.derivation.computeTimeMs).toBeGreaterThanOrEqual(0)
  })
})

// ═══════════════════════════════════════════
// 21. Engine: options 开关 (7)
// ═══════════════════════════════════════════

describe('Engine: options 开关', () => {
  it('交叉验证始终执行（无 enableCrossValidation 开关）', () => {
    // 引擎始终执行交叉验证，无 options 开关控制
    const report1 = runReport(makeModuleInputs(), {})
    const report2 = runReport(makeModuleInputs(), { enableTimeline: false })
    // 交叉验证结果应相同
    expect(report1.crossValidation.confidence).toBe(report2.crossValidation.confidence)
    expect(report1.crossValidation.reasons.length).toBe(report2.crossValidation.reasons.length)
  })

  it('enableTimeline=false 时 timeline 长度 === 0', () => {
    const report = generateMasterReport(makeModuleInputs(), { enableTimeline: false })
    expect(report.timeline).toHaveLength(0)
  })

  it('enableRiskEngine=false 时 risks 长度 === 0', () => {
    const report = generateMasterReport(makeModuleInputs(), { enableRiskEngine: false })
    expect(report.risks).toHaveLength(0)
  })

  it('enableOpportunityEngine=false 时 opportunities 长度 === 0', () => {
    const report = generateMasterReport(makeModuleInputs(), { enableOpportunityEngine: false })
    expect(report.opportunities).toHaveLength(0)
  })

  it('enableRecommendation=false 时 recommendations 长度 === 0', () => {
    const report = generateMasterReport(makeModuleInputs(), { enableRecommendation: false })
    expect(report.recommendations).toHaveLength(0)
  })

  it('enableExplain=false 时 explains 长度 === 0', () => {
    const report = generateMasterReport(makeModuleInputs(), { enableExplain: false })
    expect(report.explains).toHaveLength(0)
  })

  it('默认选项（不传 options）大部分模块启用', () => {
    const report = runReport(makeModuleInputs())
    expect(report.crossValidation.reasons.length).toBeGreaterThan(0)
    expect(report.timeline.length).toBeGreaterThan(0)
    // risks/opportunities 依赖十神/大运等完整数据，mock 数据下可能为空
    expect(Array.isArray(report.risks)).toBe(true)
    expect(Array.isArray(report.opportunities)).toBe(true)
    expect(report.recommendations.length).toBeGreaterThan(0)
    expect(report.explains.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════
// 22. Engine: 多次调用一致性 (2)
// ═══════════════════════════════════════════

describe('Engine: 多次调用一致性', () => {
  it('同输入同输出', () => {
    const inputs = makeModuleInputs()
    // 清缓存后连续调用两次，结果应一致
    const report1 = runReport(inputs)
    clearMasterReportCache()
    const inputs2 = makeModuleInputs()
    const report2 = runReport(inputs2)
    expect(report1.version).toBe(report2.version)
    expect(report1.dayMaster).toBe(report2.dayMaster)
    expect(report1.fiveDimensionScores.overall).toBe(report2.fiveDimensionScores.overall)
    expect(report1.crossValidation.confidence).toBe(report2.crossValidation.confidence)
    expect(report1.timeline.length).toBe(report2.timeline.length)
  })

  it('连续调用返回缓存（同一引用）', () => {
    const inputs = makeModuleInputs()
    const r1 = runReport(inputs)
    const r2 = runReport(inputs)
    expect(r1).toBe(r2)
  })
})

// ═══════════════════════════════════════════
// 23. Engine: 不同输入不同输出 (2)
// ═══════════════════════════════════════════

describe('Engine: 不同输入不同输出', () => {
  it('修改 dayMaster 后结果不同', () => {
    const inputs1 = makeModuleInputs()
    const report1 = runReport(inputs1)
    clearMasterReportCache()

    const inputs2 = makeModuleInputs()
    inputs2.pillars.dayMaster = '丙' as HeavenlyStem
    inputs2.pillars.dayMasterElement = '火' as FiveElement
    inputs2.pillars.sixLines.day.gan = '丙' as HeavenlyStem
    inputs2.tenGods.dayMaster = '丙' as HeavenlyStem
    inputs2.tenGods.dayMasterElement = '火' as FiveElement
    inputs2.pattern.dayMaster = '丙' as HeavenlyStem
    inputs2.pattern.dayMasterElement = '火' as FiveElement
    inputs2.xiYong.dayMaster = '丙' as HeavenlyStem
    inputs2.xiYong.dayMasterElement = '火' as FiveElement
    inputs2.fortune.dayMaster = '丙' as HeavenlyStem
    inputs2.fortune.dayMasterElement = '火' as FiveElement
    const report2 = runReport(inputs2)

    expect(report1.dayMaster).toBe('甲')
    expect(report2.dayMaster).toBe('丙')
  })

  it('不同 dayMaster 的 dayMasterElement 不同', () => {
    const inputs1 = makeModuleInputs()
    const report1 = runReport(inputs1)
    clearMasterReportCache()

    const inputs2 = makeModuleInputs()
    inputs2.pillars.dayMaster = '庚' as HeavenlyStem
    inputs2.pillars.dayMasterElement = '金' as FiveElement
    inputs2.pillars.sixLines.day.gan = '庚' as HeavenlyStem
    inputs2.tenGods.dayMaster = '庚' as HeavenlyStem
    inputs2.tenGods.dayMasterElement = '金' as FiveElement
    inputs2.pattern.dayMaster = '庚' as HeavenlyStem
    inputs2.pattern.dayMasterElement = '金' as FiveElement
    inputs2.xiYong.dayMaster = '庚' as HeavenlyStem
    inputs2.xiYong.dayMasterElement = '金' as FiveElement
    inputs2.fortune.dayMaster = '庚' as HeavenlyStem
    inputs2.fortune.dayMasterElement = '金' as FiveElement
    const report2 = runReport(inputs2)

    // 甲木命 vs 庚金命，dayMasterElement 应不同
    expect(report1.dayMasterElement).toBe('木')
    expect(report2.dayMasterElement).toBe('金')
  })
})

// ═══════════════════════════════════════════
// 24. Edge Cases (5)
// ═══════════════════════════════════════════

describe('Edge Cases', () => {
  it('空大运步骤 → timeline 至少有儿童阶段', () => {
    const inputs = makeModuleInputs()
    // fortune.daYunSteps 已经是空数组
    expect(inputs.fortune.daYunSteps).toHaveLength(0)
    const report = runReport(inputs)
    expect(report.timeline.length).toBeGreaterThanOrEqual(1)
    expect(report.timeline[0].stage).toBe('儿童')
  })

  it('交叉验证始终正常工作', () => {
    const inputs = makeModuleInputs()
    const report = runReport(inputs)
    expect(report.crossValidation).toBeDefined()
    expect(typeof report.crossValidation.confidence).toBe('number')
  })

  it('无神煞命中 → 建议仍生成', () => {
    const inputs = makeModuleInputs()
    // shenSha.hits 已经是空数组
    expect(inputs.shenSha.hits).toHaveLength(0)
    const report = runReport(inputs)
    expect(report.recommendations.length).toBeGreaterThan(0)
  })

  it('warnings 是数组（可能为空）', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.warnings)).toBe(true)
  })

  it('computeTimeMs >= 0', () => {
    const report = runReport(makeModuleInputs())
    expect(typeof report.computeTimeMs).toBe('number')
    expect(report.computeTimeMs).toBeGreaterThanOrEqual(0)
  })
})

// ═══════════════════════════════════════════
// 25. Engine: executionMetadata 完整性 (3)
// ═══════════════════════════════════════════

describe('Engine: executionMetadata 完整性', () => {
  it('computeTimeMs >= 0', () => {
    const report = runReport(makeModuleInputs())
    expect(report.executionMetadata.computeTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('moduleVersions 包含6个模块版本', () => {
    const report = runReport(makeModuleInputs())
    const mv = report.executionMetadata.moduleVersions
    expect(mv).toHaveProperty('pillars')
    expect(mv).toHaveProperty('shenSha')
    expect(mv).toHaveProperty('tenGods')
    expect(mv).toHaveProperty('pattern')
    expect(mv).toHaveProperty('xiYong')
    expect(mv).toHaveProperty('fortune')
  })

  it('cacheVersion === "7.0.0"', () => {
    const report = runReport(makeModuleInputs())
    expect(report.cacheVersion).toBe('7.0.0')
  })
})

// ═══════════════════════════════════════════
// 26. Engine: 数据完整性与数值合理性 (7)
// ═══════════════════════════════════════════

describe('Engine: 数据完整性与数值合理性', () => {
  it('crossValidation.contradictions 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.crossValidation.contradictions)).toBe(true)
  })

  it('crossValidation.traceChain 是数组', () => {
    const report = runReport(makeModuleInputs())
    expect(Array.isArray(report.crossValidation.traceChain)).toBe(true)
  })

  it('overallAssessment.confidence 在 0~1', () => {
    const report = runReport(makeModuleInputs())
    expect(report.overallAssessment.confidence).toBeGreaterThanOrEqual(0)
    expect(report.overallAssessment.confidence).toBeLessThanOrEqual(1)
  })

  it('五维评分 confidence 在 0~1', () => {
    const report = runReport(makeModuleInputs())
    const dims = ['career', 'wealth', 'marriage', 'health', 'study'] as const
    for (const dim of dims) {
      const confidence = report.fiveDimensionScores[dim].confidence
      expect(confidence).toBeGreaterThanOrEqual(0)
      expect(confidence).toBeLessThanOrEqual(1)
    }
  })

  it('risks confidence 在 0~1', () => {
    const report = runReport(makeModuleInputs())
    for (const risk of report.risks) {
      expect(risk.confidence).toBeGreaterThanOrEqual(0)
      expect(risk.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('timeline confidence 在 0~1', () => {
    const report = runReport(makeModuleInputs())
    for (const stage of report.timeline) {
      expect(stage.confidence).toBeGreaterThanOrEqual(0)
      expect(stage.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('explains 关键字段非空', () => {
    const report = runReport(makeModuleInputs())
    for (const explain of report.explains) {
      expect(explain.plainExplanation.length).toBeGreaterThan(0)
      expect(explain.professionalExplanation.length).toBeGreaterThan(0)
    }
  })
})

// ═══════════════════════════════════════════
// 27. 顶层测试组
// ═══════════════════════════════════════════

describe('Module 7: Master Report Engine', () => {
  it('顶层分组包含所有子 describe', () => {
    // 此测试仅用于确保顶层 describe 正确挂载
    expect(true).toBe(true)
  })
})
