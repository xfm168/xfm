/**
 * 跨模块冲突分析器 — 测试
 *
 * 覆盖：类型工具函数、核心分析引擎、批量分析、冲突管理
 */

import { describe, test, expect, beforeEach } from 'vitest'

import {
  analyzeCrossModuleConflicts,
  batchAnalyzeConflicts,
  getConflictPriority,
  resolveConflict,
  getUnresolvedConflicts,
  clearResolvedConflicts,
  isConflictResolved,
  clearAnalysisCache,
  CONFLICT_ANALYZER_VERSION,
} from '../conflictAnalyzerEngine'

import {
  getConflictTypeDisplayName,
  getConflictSeverityDisplayName,
  getSeverityWeight,
  generateConflictId,
} from '../conflictAnalyzerTypes'

import type {
  ModuleConflictItem,
  CrossModuleAnalysis,
  ConflictAnalysisReport,
  ConflictType,
  ConflictSeverity,
} from '../conflictAnalyzerTypes'

import type { CaseEntryV2 } from '../caseLibraryTypesV2'

// ═══════════════════════════════════════════════════════════════
// 辅助函数：创建测试用命例
// ═══════════════════════════════════════════════════════════════

function createTestCase(overrides: Partial<CaseEntryV2> = {}): CaseEntryV2 {
  return {
    caseId: 'TEST-001',
    category: 'anonymous',
    yearGan: '甲',
    yearZhi: '子',
    monthGan: '丙',
    monthZhi: '丑',
    dayGan: '戊',
    dayZhi: '寅',
    hourGan: '庚',
    hourZhi: '辰',
    gender: 'male',
    expectedResult: {},
    qualityScore: 80,
    starRating: 4,
    confidence: 0.85,
    excludeFromLearning: false,
    verifiedBy: [],
    reviewStatus: 'approved',
    source: 'test',
    evidence: [],
    referenceBooks: [],
    tags: [],
    keywords: [],
    expertOpinions: [],
    conflicts: [],
    regressionTier: 'none',
    version: 1,
    history: [],
    changeLog: [],
    reliability: 0.8,
    reliabilityDimensions: {
      dataCompleteness: 80,
      sourceCredibility: 70,
      expertCount: 2,
      consensusRate: 75,
      citationCount: 3,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 测试
// ═══════════════════════════════════════════════════════════════

describe('conflictAnalyzerTypes — 类型工具函数', () => {
  test('getConflictTypeDisplayName 返回正确的显示名', () => {
    expect(getConflictTypeDisplayName('rule_conflict')).toBe('规则冲突')
    expect(getConflictTypeDisplayName('pattern_conflict')).toBe('格局冲突')
    expect(getConflictTypeDisplayName('cross_module_conflict')).toBe('跨模块冲突')
    expect(getConflictTypeDisplayName('strength_paradox')).toBe('强弱悖论')
    expect(getConflictTypeDisplayName('fortune_paradox')).toBe('运势悖论')
  })

  test('getConflictSeverityDisplayName 返回正确的显示名', () => {
    expect(getConflictSeverityDisplayName('critical')).toBe('严重')
    expect(getConflictSeverityDisplayName('major')).toBe('重要')
    expect(getConflictSeverityDisplayName('minor')).toBe('轻微')
    expect(getConflictSeverityDisplayName('info')).toBe('信息')
  })

  test('getSeverityWeight 返回正确的权重', () => {
    expect(getSeverityWeight('critical')).toBe(30)
    expect(getSeverityWeight('major')).toBe(20)
    expect(getSeverityWeight('minor')).toBe(10)
    expect(getSeverityWeight('info')).toBe(5)
  })

  test('generateConflictId 生成以 CMA- 为前缀的 ID', () => {
    const id = generateConflictId()
    expect(id).toMatch(/^CMA-[A-Z0-9]{6}$/)
  })

  test('generateConflictId 每次生成唯一 ID', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateConflictId()))
    expect(ids.size).toBe(100)
  })
})

describe('conflictAnalyzerEngine — 版本号', () => {
  test('CONFLICT_ANALYZER_VERSION 应为 1.0.0', () => {
    expect(CONFLICT_ANALYZER_VERSION).toBe('1.0.0')
  })
})

describe('analyzeCrossModuleConflicts — 无冲突的命例', () => {
  beforeEach(() => {
    clearResolvedConflicts()
    clearAnalysisCache()
  })

  test('无 expectedResult 字段时返回零冲突', () => {
    const entry = createTestCase()
    const result = analyzeCrossModuleConflicts(entry)

    expect(result.caseId).toBe('TEST-001')
    expect(result.totalConflicts).toBe(0)
    expect(result.criticalCount).toBe(0)
    expect(result.majorCount).toBe(0)
    expect(result.minorCount).toBe(0)
    expect(result.overallConflictScore).toBe(0)
    expect(result.conflictsFound).toHaveLength(0)
    expect(result.priorityConflicts).toHaveLength(0)
  })

  test('自洽的命例（身弱+水喜神+木日主）无冲突', () => {
    const entry = createTestCase({
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryXiShen: '水',
        primaryPattern: '正官格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    // 水为木之母，是扶身五行，身弱取水为喜用神是正确的
    expect(result.conflictsFound.every((c) => c.type !== 'rule_conflict')).toBe(true)
  })

  test('正常格局有冲合的命例应检测出 fortune_paradox 冲突', () => {
    const entry = createTestCase({
      yearGan: '甲', yearZhi: '子',
      monthGan: '丙', monthZhi: '寅',
      dayGan: '甲', dayZhi: '午',
      hourGan: '戊', hourZhi: '辰',
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身旺',
        primaryXiShen: '金',
        primaryPattern: '正官格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    // 子午冲会产生 fortune_paradox
    const hasClash = result.conflictsFound.some((c) => c.type === 'fortune_paradox')
    expect(hasClash).toBe(true)
    expect(result.totalConflicts).toBeGreaterThan(0)
  })
})

describe('analyzeCrossModuleConflicts — 强弱与格局冲突', () => {
  beforeEach(() => {
    clearResolvedConflicts()
    clearAnalysisCache()
  })

  test('身弱+专旺格应检测出 strength_paradox 冲突', () => {
    const entry = createTestCase({
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryPattern: '专旺格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    const paradox = result.conflictsFound.find((c) => c.type === 'strength_paradox')
    expect(paradox).toBeDefined()
    expect(paradox!.severity).toBe('critical')
    expect(paradox!.description).toContain('专旺格')
  })

  test('身弱+从财格应检测出 strength_paradox 冲突', () => {
    const entry = createTestCase({
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryPattern: '从财格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    const paradox = result.conflictsFound.find((c) => c.type === 'strength_paradox')
    expect(paradox).toBeDefined()
    expect(paradox!.severity).toBe('critical')
  })

  test('身旺+非从旺的从格应检测出 pattern_conflict', () => {
    const entry = createTestCase({
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身旺',
        primaryPattern: '从杀格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    const conflict = result.conflictsFound.find((c) => c.type === 'pattern_conflict')
    expect(conflict).toBeDefined()
    expect(conflict!.severity).toBe('major')
  })
})

describe('analyzeCrossModuleConflicts — 强弱与喜用神冲突', () => {
  beforeEach(() => {
    clearResolvedConflicts()
    clearAnalysisCache()
  })

  test('身弱日主木+金喜用神应检测出 rule_conflict', () => {
    const entry = createTestCase({
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryXiShen: '金',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    const conflict = result.conflictsFound.find((c) => c.type === 'rule_conflict')
    expect(conflict).toBeDefined()
    expect(conflict!.severity).toBe('critical')
    expect(conflict!.description).toContain('金')
    expect(conflict!.description).toContain('泄身')
  })

  test('身旺日主木+木喜用神应检测出 rule_conflict', () => {
    const entry = createTestCase({
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身旺',
        primaryXiShen: '木',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    const conflict = result.conflictsFound.find((c) => c.type === 'rule_conflict')
    expect(conflict).toBeDefined()
    expect(conflict!.severity).toBe('major')
  })
})

describe('analyzeCrossModuleConflicts — 格局与十神一致性', () => {
  beforeEach(() => {
    clearResolvedConflicts()
    clearAnalysisCache()
  })

  test('从财格但十神无财星应检测出 pattern_conflict', () => {
    const entry = createTestCase({
      expectedResult: {
        primaryPattern: '从财格',
        tenGodSummary: '比肩、食神、正印',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    const conflict = result.conflictsFound.find(
      (c) => c.type === 'pattern_conflict' && c.description.includes('财'),
    )
    expect(conflict).toBeDefined()
    expect(conflict!.severity).toBe('major')
  })

  test('从杀格但十神无官杀应检测出 pattern_conflict', () => {
    const entry = createTestCase({
      expectedResult: {
        primaryPattern: '从杀格',
        tenGodSummary: '比肩、食神、正印',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    const conflict = result.conflictsFound.find(
      (c) => c.type === 'pattern_conflict' && c.description.includes('杀'),
    )
    expect(conflict).toBeDefined()
  })

  test('从儿格但十神无食伤应检测出 pattern_conflict', () => {
    const entry = createTestCase({
      expectedResult: {
        primaryPattern: '从儿格',
        tenGodSummary: '比肩、正财、正官',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    const conflict = result.conflictsFound.find(
      (c) => c.type === 'pattern_conflict' && c.description.includes('食伤'),
    )
    expect(conflict).toBeDefined()
  })

  test('从财格且十神有财星不应检测出格局冲突', () => {
    const entry = createTestCase({
      expectedResult: {
        primaryPattern: '从财格',
        tenGodSummary: '比肩、偏财、食神',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    const conflict = result.conflictsFound.find(
      (c) => c.type === 'pattern_conflict' && c.description.includes('财星'),
    )
    expect(conflict).toBeUndefined()
  })
})

describe('analyzeCrossModuleConflicts — 地支冲/合/刑/害检测', () => {
  beforeEach(() => {
    clearResolvedConflicts()
    clearAnalysisCache()
  })

  test('子午冲应检测出 fortune_paradox', () => {
    const entry = createTestCase({
      yearZhi: '子',
      dayZhi: '午',
      expectedResult: {},
    })
    const result = analyzeCrossModuleConflicts(entry)
    const clash = result.conflictsFound.find((c) => c.description.includes('子') && c.description.includes('午') && c.description.includes('冲'))
    expect(clash).toBeDefined()
    expect(clash!.type).toBe('fortune_paradox')
  })

  test('卯酉冲应检测出 fortune_paradox', () => {
    const entry = createTestCase({
      monthZhi: '卯',
      hourZhi: '酉',
      expectedResult: {},
    })
    const result = analyzeCrossModuleConflicts(entry)
    const clash = result.conflictsFound.find((c) => c.description.includes('卯') && c.description.includes('酉') && c.description.includes('冲'))
    expect(clash).toBeDefined()
  })

  test('寅巳申三刑应检测出 fortune_paradox', () => {
    const entry = createTestCase({
      monthZhi: '寅',
      dayZhi: '巳',
      hourZhi: '申',
      expectedResult: {},
    })
    const result = analyzeCrossModuleConflicts(entry)
    const punishment = result.conflictsFound.find((c) => c.description.includes('三刑'))
    expect(punishment).toBeDefined()
  })

  test('无冲害的命例不应有 fortune_paradox 冲突', () => {
    const entry = createTestCase({
      yearGan: '甲', yearZhi: '辰',
      monthGan: '丙', monthZhi: '巳',
      dayGan: '戊', dayZhi: '未',
      hourGan: '庚', hourZhi: '申',
      expectedResult: {},
    })
    const result = analyzeCrossModuleConflicts(entry)
    expect(result.conflictsFound.length).toBe(0)
  })
})

describe('analyzeCrossModuleConflicts — 结构完整性', () => {
  beforeEach(() => {
    clearResolvedConflicts()
    clearAnalysisCache()
  })

  test('每个冲突项包含必需字段', () => {
    const entry = createTestCase({
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryXiShen: '金',
        primaryPattern: '专旺格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)

    for (const conflict of result.conflictsFound) {
      expect(conflict.conflictId).toMatch(/^CMA-/)
      expect(conflict.type).toBeDefined()
      expect(conflict.severity).toBeDefined()
      expect(conflict.description).toBeTruthy()
      expect(conflict.modules.length).toBeGreaterThan(0)
      expect(conflict.reason).toBeTruthy()
      expect(conflict.priority).toBeGreaterThanOrEqual(0)
      expect(conflict.priority).toBeLessThanOrEqual(100)

      // modules 中的每个项
      for (const mod of conflict.modules) {
        expect(mod.module).toBeTruthy()
        expect(mod.conclusion).toBeTruthy()
        expect(mod.confidence).toBeGreaterThanOrEqual(0)
        expect(mod.confidence).toBeLessThanOrEqual(1)
      }
    }
  })

  test('冲突按 priority 降序排列', () => {
    const entry = createTestCase({
      yearZhi: '子',
      dayZhi: '午',
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryXiShen: '金',
        primaryPattern: '专旺格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)

    for (let i = 1; i < result.conflictsFound.length; i++) {
      expect(result.conflictsFound[i - 1].priority).toBeGreaterThanOrEqual(
        result.conflictsFound[i].priority,
      )
    }
  })

  test('overallConflictScore 在 0~100 之间', () => {
    const entry = createTestCase({
      yearZhi: '子',
      dayZhi: '午',
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryXiShen: '金',
        primaryPattern: '专旺格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)
    expect(result.overallConflictScore).toBeGreaterThanOrEqual(0)
    expect(result.overallConflictScore).toBeLessThanOrEqual(100)
  })

  test('priorityConflicts 只包含 severity >= major 的冲突', () => {
    const entry = createTestCase({
      yearZhi: '子',
      dayZhi: '午',
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryXiShen: '金',
        primaryPattern: '专旺格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)

    for (const pc of result.priorityConflicts) {
      const isHighSeverity = pc.severity === 'critical' || pc.severity === 'major'
      const isHighPriority = pc.priority >= 50
      expect(isHighSeverity || isHighPriority).toBe(true)
    }
  })
})

describe('batchAnalyzeConflicts — 批量分析', () => {
  beforeEach(() => {
    clearResolvedConflicts()
    clearAnalysisCache()
  })

  test('批量分析返回完整的 ConflictAnalysisReport', () => {
    const cases = [
      createTestCase({ caseId: 'BATCH-001' }),
      createTestCase({ caseId: 'BATCH-002' }),
    ]
    const report = batchAnalyzeConflicts(cases)

    expect(report.version).toBe(CONFLICT_ANALYZER_VERSION)
    expect(report.totalCases).toBe(2)
    expect(report.generatedAt).toBeGreaterThan(0)
    expect(report.avgConflictScore).toBeGreaterThanOrEqual(0)
    expect(report.totalConflicts).toBeGreaterThanOrEqual(0)
  })

  test('冲突分布包含所有类型', () => {
    const cases = [
      createTestCase({
        caseId: 'BATCH-003',
        expectedResult: {
          dayMasterElement: '木',
          strengthLevel: '身弱',
          primaryXiShen: '金',
          primaryPattern: '专旺格',
        },
      }),
    ]
    const report = batchAnalyzeConflicts(cases)

    expect(report.conflictDistribution).toBeDefined()
    expect(typeof report.conflictDistribution.rule_conflict).toBe('number')
    expect(typeof report.conflictDistribution.pattern_conflict).toBe('number')
    expect(typeof report.conflictDistribution.cross_module_conflict).toBe('number')
    expect(typeof report.conflictDistribution.strength_paradox).toBe('number')
    expect(typeof report.conflictDistribution.fortune_paradox).toBe('number')
  })

  test('空命例列表返回零冲突报告', () => {
    const report = batchAnalyzeConflicts([])
    expect(report.totalCases).toBe(0)
    expect(report.totalConflicts).toBe(0)
    expect(report.avgConflictScore).toBe(0)
  })
})

describe('getConflictPriority — 优先级评分', () => {
  test('critical 冲突基础分 30 + 模块分 + reason分 + 未解决分', () => {
    const conflict: ModuleConflictItem = {
      conflictId: 'TEST',
      type: 'rule_conflict',
      severity: 'critical',
      description: 'test',
      modules: [
        { module: 'A', conclusion: 'x', confidence: 0.9 },
        { module: 'B', conclusion: 'y', confidence: 0.8 },
      ],
      reason: 'test reason',
      priority: 0,
    }
    const priority = getConflictPriority(conflict)
    // 30 (critical) + 10 (2 modules * 5) + 5 (reason) + 10 (unresolved) = 55
    expect(priority).toBe(55)
  })

  test('已解决的冲突优先级较低', () => {
    const conflict: ModuleConflictItem = {
      conflictId: 'TEST',
      type: 'rule_conflict',
      severity: 'major',
      description: 'test',
      modules: [{ module: 'A', conclusion: 'x', confidence: 0.9 }],
      reason: 'test reason',
      priority: 0,
      resolution: '已解决',
    }
    const priority = getConflictPriority(conflict)
    // 20 (major) + 5 (1 module * 5) + 5 (reason) + 0 (resolved) = 30
    expect(priority).toBe(30)
  })

  test('优先级不超过 100', () => {
    const conflict: ModuleConflictItem = {
      conflictId: 'TEST',
      type: 'rule_conflict',
      severity: 'critical',
      description: 'test',
      modules: [
        { module: 'A', conclusion: 'x', confidence: 0.9 },
        { module: 'B', conclusion: 'y', confidence: 0.8 },
        { module: 'C', conclusion: 'z', confidence: 0.7 },
        { module: 'D', conclusion: 'w', confidence: 0.6 },
      ],
      reason: 'very long reason',
      priority: 0,
    }
    const priority = getConflictPriority(conflict)
    expect(priority).toBeLessThanOrEqual(100)
    expect(priority).toBeGreaterThan(0)
  })
})

describe('resolveConflict / getUnresolvedConflicts — 冲突解决管理', () => {
  beforeEach(() => {
    clearResolvedConflicts()
    clearAnalysisCache()
  })

  test('resolveConflict 返回 true 并标记冲突为已解决', () => {
    const entry = createTestCase({
      caseId: 'RESOLVE-001',
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryXiShen: '金',
        primaryPattern: '专旺格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)

    expect(result.conflictsFound.length).toBeGreaterThan(0)
    const conflictId = result.conflictsFound[0].conflictId

    expect(resolveConflict(conflictId, '已审查确认为误判')).toBe(true)
    expect(isConflictResolved(conflictId)).toBe(true)
  })

  test('resolveConflict 空 ID 返回 false', () => {
    expect(resolveConflict('', 'resolution')).toBe(false)
  })

  test('resolveConflict 空方案返回 false', () => {
    expect(resolveConflict('SOME-ID', '')).toBe(false)
  })

  test('getUnresolvedConflicts 只返回未解决的冲突', () => {
    const entry = createTestCase({
      caseId: 'UNRESOLVED-001',
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryXiShen: '金',
        primaryPattern: '专旺格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)

    // 解决第一个冲突
    if (result.conflictsFound.length > 0) {
      resolveConflict(result.conflictsFound[0].conflictId, '已审查')
    }

    const unresolved = getUnresolvedConflicts()
    expect(unresolved.length).toBe(result.conflictsFound.length - 1)

    // 确保已解决的冲突不在列表中
    expect(unresolved.find((c) => c.conflictId === result.conflictsFound[0].conflictId)).toBeUndefined()
  })

  test('clearResolvedConflicts 清除所有已解决状态', () => {
    const entry = createTestCase({
      caseId: 'CLEAR-001',
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryXiShen: '金',
        primaryPattern: '专旺格',
      },
    })
    const result = analyzeCrossModuleConflicts(entry)

    if (result.conflictsFound.length > 0) {
      resolveConflict(result.conflictsFound[0].conflictId, 'test')
    }

    clearResolvedConflicts()

    const unresolved = getUnresolvedConflicts()
    expect(unresolved.length).toBe(result.conflictsFound.length)
  })

  test('clearAnalysisCache 清除缓存后 getUnresolvedConflicts 返回空', () => {
    const entry = createTestCase({
      caseId: 'CACHE-001',
      expectedResult: {
        dayMasterElement: '木',
        strengthLevel: '身弱',
        primaryPattern: '专旺格',
      },
    })
    analyzeCrossModuleConflicts(entry)

    clearAnalysisCache()
    expect(getUnresolvedConflicts()).toHaveLength(0)
  })
})
