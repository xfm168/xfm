/**
 * Case Reliability Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - 各维度评分计算
 *   - 加权总分
 *   - 等级映射
 *   - 改进建议生成
 *   - 批量计算
 *   - 分布统计
 *   - 排序
 *   - 比较
 */

import { describe, test, expect } from 'vitest'
import type { CaseEntryV2, CaseCategoryV2 } from '../caseLibraryTypesV2'
import {
  CASE_RELIABILITY_VERSION,
  calculateCaseReliability,
  getReliabilityLevel,
  batchCalculateReliability,
  filterByReliabilityLevel,
  getReliabilityDistribution,
  getTopReliableCases,
  compareReliability,
  filterByReliability,
} from '../caseReliabilityEngine'
import { RELIABILITY_LEVEL_THRESHOLDS } from '../caseReliabilityTypes'

// ─── 测试辅助：创建最小可用 v2 命例 ───
function makeCaseV2(
  caseId: string,
  category: CaseCategoryV2,
  overrides?: Partial<CaseEntryV2>,
): CaseEntryV2 {
  const base: CaseEntryV2 = {
    caseId,
    category,
    yearGan: '甲',
    yearZhi: '子',
    monthGan: '丙',
    monthZhi: '寅',
    dayGan: '甲',
    dayZhi: '子',
    hourGan: '甲',
    hourZhi: '子',
    gender: 'male',
    expectedResult: { dayMasterElement: '木' },
    qualityScore: 75,
    starRating: 4,
    confidence: 0.85,
    excludeFromLearning: false,
    verifiedBy: [],
    reviewStatus: 'approved',
    source: 'test-source',
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
    reliability: 70,
    reliabilityDimensions: {
      dataCompleteness: 80,
      sourceCredibility: 80,
      expertCount: 2,
      consensusRate: 80,
      citationCount: 2,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  return { ...base, ...overrides }
}

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

describe('Case Reliability Engine', () => {
  describe('1. 版本号', () => {
    test('版本号应为 1.0.0', () => {
      expect(CASE_RELIABILITY_VERSION).toBe('1.0.0')
    })
  })

  // ═══════════════════════════════════════════
  // 2. 各维度评分计算
  // ═══════════════════════════════════════════

  describe('2. 各维度评分计算', () => {
    test('数据完整度维度：直接取 reliabilityDimensions.dataCompleteness', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 60,
          sourceCredibility: 0,
          expertCount: 0,
          consensusRate: 0,
          citationCount: 0,
        },
      })
      const report = calculateCaseReliability(entry)
      const item = report.breakdown.find((b) => b.dimension === '数据完整度')
      expect(item?.score).toBe(60)
      expect(item?.weight).toBe(0.25)
      expect(item?.weightedScore).toBe(15)
    })

    test('来源可信度维度：直接取 reliabilityDimensions.sourceCredibility', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 90,
          expertCount: 0,
          consensusRate: 0,
          citationCount: 0,
        },
      })
      const report = calculateCaseReliability(entry)
      const item = report.breakdown.find((b) => b.dimension === '来源可信度')
      expect(item?.score).toBe(90)
      expect(item?.weight).toBe(0.25)
      expect(item?.weightedScore).toBe(22.5)
    })

    test('专家数量维度：0 个专家时得 0 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 0,
          consensusRate: 0,
          citationCount: 0,
        },
      })
      const report = calculateCaseReliability(entry)
      const item = report.breakdown.find((b) => b.dimension === '专家数量')
      expect(item?.score).toBe(0)
      expect(item?.weightedScore).toBe(0)
    })

    test('专家数量维度：3 个专家时得 60 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 3,
          consensusRate: 0,
          citationCount: 0,
        },
      })
      const report = calculateCaseReliability(entry)
      const item = report.breakdown.find((b) => b.dimension === '专家数量')
      expect(item?.score).toBe(60)
      expect(item?.weightedScore).toBe(9)
    })

    test('专家数量维度：5 个及以上专家时得 100 分（上限）', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 7,
          consensusRate: 0,
          citationCount: 0,
        },
      })
      const report = calculateCaseReliability(entry)
      const item = report.breakdown.find((b) => b.dimension === '专家数量')
      expect(item?.score).toBe(100)
      expect(item?.weightedScore).toBe(15)
    })

    test('一致率维度：直接取 reliabilityDimensions.consensusRate', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 0,
          consensusRate: 75,
          citationCount: 0,
        },
      })
      const report = calculateCaseReliability(entry)
      const item = report.breakdown.find((b) => b.dimension === '一致率')
      expect(item?.score).toBe(75)
      expect(item?.weightedScore).toBe(18.75)
    })

    test('引用次数维度：0 次引用时得 0 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 0,
          consensusRate: 0,
          citationCount: 0,
        },
      })
      const report = calculateCaseReliability(entry)
      const item = report.breakdown.find((b) => b.dimension === '引用次数')
      expect(item?.score).toBe(0)
    })

    test('引用次数维度：5 次引用时得 50 分', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 0,
          consensusRate: 0,
          citationCount: 5,
        },
      })
      const report = calculateCaseReliability(entry)
      const item = report.breakdown.find((b) => b.dimension === '引用次数')
      expect(item?.score).toBe(50)
      expect(item?.weightedScore).toBe(5)
    })

    test('引用次数维度：10 次及以上引用时得 100 分（上限）', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 0,
          consensusRate: 0,
          citationCount: 15,
        },
      })
      const report = calculateCaseReliability(entry)
      const item = report.breakdown.find((b) => b.dimension === '引用次数')
      expect(item?.score).toBe(100)
      expect(item?.weightedScore).toBe(10)
    })
  })

  // ═══════════════════════════════════════════
  // 3. 加权总分
  // ═══════════════════════════════════════════

  describe('3. 加权总分', () => {
    test('满分命例：所有维度最优时总分应为 100', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 100,
          sourceCredibility: 100,
          expertCount: 5,
          consensusRate: 100,
          citationCount: 10,
        },
      })
      const report = calculateCaseReliability(entry)
      expect(report.overallScore).toBe(100)
    })

    test('零分命例：所有维度为 0 时总分应为 0', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 0,
          consensusRate: 0,
          citationCount: 0,
        },
      })
      const report = calculateCaseReliability(entry)
      expect(report.overallScore).toBe(0)
    })

    test('中等命例：总分按加权公式计算正确', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 80,
          sourceCredibility: 80,
          expertCount: 2, // score=40
          consensusRate: 80,
          citationCount: 2, // score=20
        },
      })
      const report = calculateCaseReliability(entry)
      // 80*0.25 + 80*0.25 + 40*0.15 + 80*0.25 + 20*0.10 = 20+20+6+20+2 = 68
      expect(report.overallScore).toBe(68)
    })

    test('总分范围始终在 0-100 之间', () => {
      const entry = makeCaseV2('TEST-001', 'classic')
      const report = calculateCaseReliability(entry)
      expect(report.overallScore).toBeGreaterThanOrEqual(0)
      expect(report.overallScore).toBeLessThanOrEqual(100)
    })
  })

  // ═══════════════════════════════════════════
  // 4. 等级映射
  // ═══════════════════════════════════════════

  describe('4. 等级映射', () => {
    test('score >= 90 映射为 excellent', () => {
      expect(getReliabilityLevel(90)).toBe('excellent')
      expect(getReliabilityLevel(100)).toBe('excellent')
    })

    test('score >= 75 映射为 good', () => {
      expect(getReliabilityLevel(75)).toBe('good')
      expect(getReliabilityLevel(89)).toBe('good')
    })

    test('score >= 60 映射为 fair', () => {
      expect(getReliabilityLevel(60)).toBe('fair')
      expect(getReliabilityLevel(74)).toBe('fair')
    })

    test('score >= 40 映射为 poor', () => {
      expect(getReliabilityLevel(40)).toBe('poor')
      expect(getReliabilityLevel(59)).toBe('poor')
    })

    test('score < 40 映射为 unverified', () => {
      expect(getReliabilityLevel(39)).toBe('unverified')
      expect(getReliabilityLevel(0)).toBe('unverified')
    })

    test('报告中的 level 与 overallScore 一致', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 100,
          sourceCredibility: 100,
          expertCount: 5,
          consensusRate: 100,
          citationCount: 10,
        },
      })
      const report = calculateCaseReliability(entry)
      expect(report.level).toBe(getReliabilityLevel(report.overallScore))
    })
  })

  // ═══════════════════════════════════════════
  // 5. 改进建议生成
  // ═══════════════════════════════════════════

  describe('5. 改进建议生成', () => {
    test('数据完整度低于 80 时生成补充数据建议', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 70,
          sourceCredibility: 100,
          expertCount: 5,
          consensusRate: 100,
          citationCount: 10,
        },
      })
      const report = calculateCaseReliability(entry)
      expect(report.recommendations).toContain('补充缺失的命例数据字段以提升完整度')
    })

    test('来源可信度低于 80 时生成增加来源建议', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 100,
          sourceCredibility: 70,
          expertCount: 5,
          consensusRate: 100,
          citationCount: 10,
        },
      })
      const report = calculateCaseReliability(entry)
      expect(report.recommendations).toContain('增加权威来源或文献引用以提升来源可信度')
    })

    test('专家数量低于 3 时生成增加专家验证建议', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 100,
          sourceCredibility: 100,
          expertCount: 1,
          consensusRate: 100,
          citationCount: 10,
        },
      })
      const report = calculateCaseReliability(entry)
      expect(report.recommendations).toContain('增加专家验证以提升可信度')
    })

    test('一致率低于 80 时生成解决分歧建议', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 100,
          sourceCredibility: 100,
          expertCount: 5,
          consensusRate: 70,
          citationCount: 10,
        },
      })
      const report = calculateCaseReliability(entry)
      expect(report.recommendations).toContain('解决专家分歧以提升一致率')
    })

    test('引用次数低于 5 时生成增加引用建议', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 100,
          sourceCredibility: 100,
          expertCount: 5,
          consensusRate: 100,
          citationCount: 2,
        },
      })
      const report = calculateCaseReliability(entry)
      expect(report.recommendations).toContain('增加学术或文献引用以提升引用次数')
    })

    test('所有维度优秀时无改进建议', () => {
      const entry = makeCaseV2('TEST-001', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 100,
          sourceCredibility: 100,
          expertCount: 5,
          consensusRate: 100,
          citationCount: 10,
        },
      })
      const report = calculateCaseReliability(entry)
      expect(report.recommendations.length).toBe(0)
    })
  })

  // ═══════════════════════════════════════════
  // 6. 批量计算
  // ═══════════════════════════════════════════

  describe('6. 批量计算', () => {
    test('批量计算返回与输入相同数量的报告', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic'),
        makeCaseV2('TEST-002', 'classic'),
        makeCaseV2('TEST-003', 'classic'),
      ]
      const reports = batchCalculateReliability(cases)
      expect(reports.length).toBe(3)
    })

    test('批量计算不修改原命例数组', () => {
      const cases = [makeCaseV2('TEST-001', 'classic')]
      const originalReliability = cases[0].reliability
      batchCalculateReliability(cases)
      expect(cases[0].reliability).toBe(originalReliability)
    })

    test('批量计算的每个报告 caseId 正确对应', () => {
      const cases = [
        makeCaseV2('TEST-A', 'classic'),
        makeCaseV2('TEST-B', 'anonymous'),
      ]
      const reports = batchCalculateReliability(cases)
      expect(reports[0].caseId).toBe('TEST-A')
      expect(reports[1].caseId).toBe('TEST-B')
    })
  })

  // ═══════════════════════════════════════════
  // 7. 筛选
  // ═══════════════════════════════════════════

  describe('7. 筛选', () => {
    test('filterByReliabilityLevel 只返回对应等级的命例', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 100,
            sourceCredibility: 100,
            expertCount: 5,
            consensusRate: 100,
            citationCount: 10,
          },
        }),
        makeCaseV2('TEST-002', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 0,
            sourceCredibility: 0,
            expertCount: 0,
            consensusRate: 0,
            citationCount: 0,
          },
        }),
      ]
      const excellent = filterByReliabilityLevel(cases, 'excellent')
      expect(excellent.length).toBe(1)
      expect(excellent[0].caseId).toBe('TEST-001')
    })

    test('filterByReliability 支持 minScore 和 maxScore', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 100,
            sourceCredibility: 100,
            expertCount: 5,
            consensusRate: 100,
            citationCount: 10,
          },
        }),
        makeCaseV2('TEST-002', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 50,
            sourceCredibility: 50,
            expertCount: 1,
            consensusRate: 50,
            citationCount: 1,
          },
        }),
      ]
      const filtered = filterByReliability(cases, { minScore: 90, maxScore: 100 })
      expect(filtered.length).toBe(1)
      expect(filtered[0].caseId).toBe('TEST-001')
    })

    test('filterByReliability 支持 levels 数组', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 100,
            sourceCredibility: 100,
            expertCount: 5,
            consensusRate: 100,
            citationCount: 10,
          },
        }),
        makeCaseV2('TEST-002', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 0,
            sourceCredibility: 0,
            expertCount: 0,
            consensusRate: 0,
            citationCount: 0,
          },
        }),
      ]
      const filtered = filterByReliability(cases, { levels: ['unverified'] })
      expect(filtered.length).toBe(1)
      expect(filtered[0].caseId).toBe('TEST-002')
    })
  })

  // ═══════════════════════════════════════════
  // 8. 分布统计
  // ═══════════════════════════════════════════

  describe('8. 分布统计', () => {
    test('getReliabilityDistribution 统计各类别数量正确', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 100,
            sourceCredibility: 100,
            expertCount: 5,
            consensusRate: 100,
            citationCount: 10,
          },
        }),
        makeCaseV2('TEST-002', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 80,
            sourceCredibility: 80,
            expertCount: 4,
            consensusRate: 80,
            citationCount: 5,
          },
        }),
        makeCaseV2('TEST-003', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 50,
            sourceCredibility: 50,
            expertCount: 1,
            consensusRate: 50,
            citationCount: 1,
          },
        }),
        makeCaseV2('TEST-004', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 0,
            sourceCredibility: 0,
            expertCount: 0,
            consensusRate: 0,
            citationCount: 0,
          },
        }),
      ]
      const dist = getReliabilityDistribution(cases)
      expect(dist.excellent).toBe(1)
      expect(dist.good).toBe(1)
      expect(dist.fair).toBe(0)
      expect(dist.poor).toBe(1)
      expect(dist.unverified).toBe(1)
    })

    test('空数组分布统计全为 0', () => {
      const dist = getReliabilityDistribution([])
      expect(dist.excellent).toBe(0)
      expect(dist.good).toBe(0)
      expect(dist.fair).toBe(0)
      expect(dist.poor).toBe(0)
      expect(dist.unverified).toBe(0)
    })
  })

  // ═══════════════════════════════════════════
  // 9. 排序
  // ═══════════════════════════════════════════

  describe('9. 排序', () => {
    test('getTopReliableCases 按可信度降序排列', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 60,
            sourceCredibility: 60,
            expertCount: 1,
            consensusRate: 60,
            citationCount: 1,
          },
        }),
        makeCaseV2('TEST-002', 'classic', {
          reliabilityDimensions: {
            dataCompleteness: 100,
            sourceCredibility: 100,
            expertCount: 5,
            consensusRate: 100,
            citationCount: 10,
          },
        }),
      ]
      const top = getTopReliableCases(cases, 2)
      expect(top[0].caseId).toBe('TEST-002')
      expect(top[1].caseId).toBe('TEST-001')
    })

    test('getTopReliableCases 限制返回数量', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic'),
        makeCaseV2('TEST-002', 'classic'),
        makeCaseV2('TEST-003', 'classic'),
      ]
      const top = getTopReliableCases(cases, 2)
      expect(top.length).toBe(2)
    })

    test('getTopReliableCases 不修改原数组顺序', () => {
      const cases = [
        makeCaseV2('TEST-001', 'classic'),
        makeCaseV2('TEST-002', 'classic'),
      ]
      getTopReliableCases(cases, 1)
      expect(cases[0].caseId).toBe('TEST-001')
      expect(cases[1].caseId).toBe('TEST-002')
    })
  })

  // ═══════════════════════════════════════════
  // 10. 比较
  // ═══════════════════════════════════════════

  describe('10. 比较', () => {
    test('compareReliability 返回分数更高的命例', () => {
      const caseA = makeCaseV2('TEST-A', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 100,
          sourceCredibility: 100,
          expertCount: 5,
          consensusRate: 100,
          citationCount: 10,
        },
      })
      const caseB = makeCaseV2('TEST-B', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 0,
          consensusRate: 0,
          citationCount: 0,
        },
      })
      const result = compareReliability(caseA, caseB)
      expect(result.betterCaseId).toBe('TEST-A')
      expect(result.scoreDifference).toBe(100)
      expect(result.levelA).toBe('excellent')
      expect(result.levelB).toBe('unverified')
    })

    test('compareReliability 当 B 更好时返回 B', () => {
      const caseA = makeCaseV2('TEST-A', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 0,
          sourceCredibility: 0,
          expertCount: 0,
          consensusRate: 0,
          citationCount: 0,
        },
      })
      const caseB = makeCaseV2('TEST-B', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 100,
          sourceCredibility: 100,
          expertCount: 5,
          consensusRate: 100,
          citationCount: 10,
        },
      })
      const result = compareReliability(caseA, caseB)
      expect(result.betterCaseId).toBe('TEST-B')
      expect(result.scoreDifference).toBe(100)
    })

    test('compareReliability 当分数相同时返回 A', () => {
      const caseA = makeCaseV2('TEST-A', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 80,
          sourceCredibility: 80,
          expertCount: 2,
          consensusRate: 80,
          citationCount: 2,
        },
      })
      const caseB = makeCaseV2('TEST-B', 'classic', {
        reliabilityDimensions: {
          dataCompleteness: 80,
          sourceCredibility: 80,
          expertCount: 2,
          consensusRate: 80,
          citationCount: 2,
        },
      })
      const result = compareReliability(caseA, caseB)
      expect(result.betterCaseId).toBe('TEST-A')
      expect(result.scoreDifference).toBe(0)
      expect(result.levelA).toBe(result.levelB)
    })
  })

  // ═══════════════════════════════════════════
  // 11. 常量验证
  // ═══════════════════════════════════════════

  describe('11. 常量验证', () => {
    test('RELIABILITY_LEVEL_THRESHOLDS 阈值正确', () => {
      expect(RELIABILITY_LEVEL_THRESHOLDS.excellent).toBe(90)
      expect(RELIABILITY_LEVEL_THRESHOLDS.good).toBe(75)
      expect(RELIABILITY_LEVEL_THRESHOLDS.fair).toBe(60)
      expect(RELIABILITY_LEVEL_THRESHOLDS.poor).toBe(40)
      expect(RELIABILITY_LEVEL_THRESHOLDS.unverified).toBe(0)
    })
  })
})
