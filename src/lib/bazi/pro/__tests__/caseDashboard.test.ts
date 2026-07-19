/**
 * Case Dashboard Engine 测试套件
 *
 * 覆盖：
 *   - 版本号与常量
 *   - generateCaseDashboard 结构与 6 大板块
 *   - overallStatus 综合判断（healthy / warning / critical）
 *   - getDashboardSnapshot 精简版
 *   - 边界情况（空库、高冲突、高废弃等）
 */

import { describe, test, expect, beforeEach } from 'vitest'
import type { CaseEntryV2, CaseCategoryV2, ExpertOpinionV2 } from '../caseLibraryTypesV2'

import {
  clearCaseStoreV2,
  resetCaseStoreV2,
  addCaseV2,
} from '../caseDatabaseV2'

import {
  CASE_DASHBOARD_VERSION,
  generateCaseDashboard,
  getDashboardSnapshot,
} from '../caseDashboardEngine'

// ─── 测试辅助：创建最小可用 v2 命例 ───
function makeCaseV2(
  caseId: string,
  category: CaseCategoryV2,
  overrides?: Partial<CaseEntryV2>,
): CaseEntryV2 {
  const now = Date.now()
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
      expertCount: 0,
      consensusRate: 0,
      citationCount: 0,
    },
    createdAt: now,
    updatedAt: now,
  }
  return { ...base, ...overrides }
}

function makeOpinion(overrides?: Partial<ExpertOpinionV2>): ExpertOpinionV2 {
  return {
    opinionId: 'op-1',
    expertId: 'exp-1',
    expertName: 'Test Expert',
    conclusion: 'Conclusion A',
    verdict: 'agree',
    consistencyRate: 1,
    score: 80,
    validatedAt: Date.now(),
    classicalBasis: 'Basis',
    affectedRules: [],
    ...overrides,
  }
}

// ═══════════════════════════════════════════
// Group 1: 版本号与常量
// ═══════════════════════════════════════════

describe('Case Dashboard Engine', () => {
  beforeEach(() => {
    resetCaseStoreV2()
  })

  describe('1. 版本号与常量', () => {
    test('CASE_DASHBOARD_VERSION 应为 1.0.0', () => {
      expect(CASE_DASHBOARD_VERSION).toBe('1.0.0')
    })
  })

  // ═══════════════════════════════════════════
  // Group 2: generateCaseDashboard 结构
  // ═══════════════════════════════════════════

  describe('2. generateCaseDashboard 结构', () => {
    test('返回对象包含所有必要字段', () => {
      const dashboard = generateCaseDashboard()
      expect(dashboard.version).toBe(CASE_DASHBOARD_VERSION)
      expect(dashboard.generatedAt).toBeGreaterThan(0)
      expect(['healthy', 'warning', 'critical']).toContain(dashboard.overallStatus)
      expect(Array.isArray(dashboard.sections)).toBe(true)
      expect(typeof dashboard.totalCases).toBe('number')
      expect(typeof dashboard.recentAdditions).toBe('number')
    })

    test('包含 6 大板块', () => {
      const dashboard = generateCaseDashboard()
      expect(dashboard.sections).toHaveLength(6)
      const titles = dashboard.sections.map((s) => s.title)
      expect(titles).toContain('案例概览')
      expect(titles).toContain('质量评分')
      expect(titles).toContain('专家共识')
      expect(titles).toContain('回归分级')
      expect(titles).toContain('可信度')
      expect(titles).toContain('动态统计')
    })

    test('每个板块包含 metrics 数组', () => {
      const dashboard = generateCaseDashboard()
      for (const section of dashboard.sections) {
        expect(Array.isArray(section.metrics)).toBe(true)
        expect(section.metrics.length).toBeGreaterThan(0)
        for (const metric of section.metrics) {
          expect(typeof metric.label).toBe('string')
          expect(metric.value !== undefined).toBe(true)
          expect(['ok', 'warning', 'critical']).toContain(metric.status)
        }
      }
    })
  })

  // ═══════════════════════════════════════════
  // Group 3: 各板块内容验证
  // ═══════════════════════════════════════════

  describe('3. 各板块内容验证', () => {
    test('案例概览包含各类别计数', () => {
      clearCaseStoreV2()
      addCaseV2(makeCaseV2('T-001', 'classic'))
      addCaseV2(makeCaseV2('T-002', 'anonymous'))
      addCaseV2(makeCaseV2('T-003', 'regression'))

      const dashboard = generateCaseDashboard()
      const overview = dashboard.sections.find((s) => s.title === '案例概览')!
      const totalMetric = overview.metrics.find((m) => m.label === '案例总数')
      expect(totalMetric!.value).toBe(3)
      expect(overview.metrics.find((m) => m.label === '经典命例')!.value).toBe(1)
      expect(overview.metrics.find((m) => m.label === '匿名命例')!.value).toBe(1)
      expect(overview.metrics.find((m) => m.label === '回归样本')!.value).toBe(1)
      expect(overview.metrics.find((m) => m.label === '专家验证')!.value).toBe(0)
    })

    test('质量评分包含平均分和星级分布', () => {
      clearCaseStoreV2()
      // 星级分布基于 qualityScoreEngine 重新计算，需提供足够数据才能得到预期星级
      addCaseV2(makeCaseV2('Q-001', 'classic', {
        qualityScore: 95,
        starRating: 5,
        expectedResult: {
          dayMasterElement: '木',
          primaryPattern: 'test',
          secondaryPattern: 'test',
          strengthLevel: 'strong',
          primaryXiShen: '木',
          careerScore: 1,
          wealthScore: 1,
          marriageScore: 1,
          healthScore: 1,
        },
        source: 'test-source',
        evidence: [
          { type: 'classical_text', content: 'c1', source: 's1', confidence: 0.9 },
          { type: 'classical_text', content: 'c2', source: 's2', confidence: 0.9 },
          { type: 'classical_text', content: 'c3', source: 's3', confidence: 0.9 },
          { type: 'classical_text', content: 'c4', source: 's4', confidence: 0.9 },
        ],
        referenceBooks: ['b1', 'b2'],
        expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion(), makeOpinion()],
      }))
      addCaseV2(makeCaseV2('Q-002', 'anonymous', { qualityScore: 45, starRating: 2 }))

      const dashboard = generateCaseDashboard()
      const quality = dashboard.sections.find((s) => s.title === '质量评分')!
      const avgMetric = quality.metrics.find((m) => m.label === '平均质量评分')
      expect(avgMetric!.value).toBe(70) // (95+45)/2 = 70
      expect(quality.metrics.find((m) => m.label === '5星')!.value).toBe(1)
      expect(quality.metrics.find((m) => m.label === '1星')!.value).toBe(1)
    })

    test('低质量案例和可学习案例计数正确', () => {
      clearCaseStoreV2()
      addCaseV2(makeCaseV2('L-001', 'classic', { qualityScore: 95, excludeFromLearning: false }))
      addCaseV2(makeCaseV2('L-002', 'anonymous', { qualityScore: 30, excludeFromLearning: false }))
      addCaseV2(makeCaseV2('L-003', 'regression', { qualityScore: 80, excludeFromLearning: true }))

      const dashboard = generateCaseDashboard()
      const quality = dashboard.sections.find((s) => s.title === '质量评分')!
      expect(quality.metrics.find((m) => m.label === '低质量案例')!.value).toBe(1)
      expect(quality.metrics.find((m) => m.label === '可学习案例')!.value).toBe(1)
    })

    test('专家共识包含有专家观点数和平均共识分', () => {
      clearCaseStoreV2()
      addCaseV2(makeCaseV2('E-001', 'classic', {
        expertOpinions: [makeOpinion(), makeOpinion()],
      }))
      addCaseV2(makeCaseV2('E-002', 'anonymous', {
        expertOpinions: [],
      }))

      const dashboard = generateCaseDashboard()
      const consensus = dashboard.sections.find((s) => s.title === '专家共识')!
      expect(consensus.metrics.find((m) => m.label === '有专家观点')!.value).toBe(1)
      expect(consensus.metrics.find((m) => m.label === '完全一致')!.value).toBe(1)
      expect(consensus.metrics.find((m) => m.label === '争议')!.value).toBe(1)
    })

    test('回归分级包含 Gold/Silver/Bronze/None', () => {
      clearCaseStoreV2()
      // Gold: qualityScore>=85, starRating>=4, reliability>=80, 3 experts, consensus>=0.85
      addCaseV2(makeCaseV2('G-001', 'classic', {
        qualityScore: 90, starRating: 5, reliability: 85,
        expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()],
        consensusScore: 0.9,
      }))
      // None: everything low
      addCaseV2(makeCaseV2('G-002', 'anonymous', {
        qualityScore: 30, starRating: 1, reliability: 20,
        expertOpinions: [], consensusScore: 0.1,
      }))

      const dashboard = generateCaseDashboard()
      const regression = dashboard.sections.find((s) => s.title === '回归分级')!
      expect(regression.metrics.find((m) => m.label === 'Gold')!.value).toBe(1)
      expect(regression.metrics.find((m) => m.label === 'None')!.value).toBe(1)
      expect(regression.metrics.find((m) => m.label === 'Gold 占比')!.value).toBe('50%')
    })

    test('可信度包含平均可信度和等级分布', () => {
      clearCaseStoreV2()
      addCaseV2(makeCaseV2('R-001', 'classic', {
        reliability: 90,
        reliabilityDimensions: {
          dataCompleteness: 90, sourceCredibility: 90, expertCount: 5, consensusRate: 90, citationCount: 10,
        },
      }))
      addCaseV2(makeCaseV2('R-002', 'anonymous', {
        reliability: 30,
        reliabilityDimensions: {
          dataCompleteness: 30, sourceCredibility: 30, expertCount: 0, consensusRate: 0, citationCount: 0,
        },
      }))

      const dashboard = generateCaseDashboard()
      const reliability = dashboard.sections.find((s) => s.title === '可信度')!
      expect(reliability.metrics.find((m) => m.label === '平均可信度')!.value).toBe(60)
      expect(reliability.metrics.find((m) => m.label === 'Top10 最可信')!.value).toBe(2)
    })

    test('动态统计包含待审核和已废弃数量', () => {
      clearCaseStoreV2()
      addCaseV2(makeCaseV2('D-001', 'classic', { reviewStatus: 'pending' }))
      addCaseV2(makeCaseV2('D-002', 'anonymous', { reviewStatus: 'deprecated' }))
      addCaseV2(makeCaseV2('D-003', 'regression', { reviewStatus: 'approved' }))

      const dashboard = generateCaseDashboard()
      const dynamic = dashboard.sections.find((s) => s.title === '动态统计')!
      expect(dynamic.metrics.find((m) => m.label === '待审核')!.value).toBe(1)
      expect(dynamic.metrics.find((m) => m.label === '已废弃')!.value).toBe(1)
    })
  })

  // ═══════════════════════════════════════════
  // Group 4: overallStatus 判断
  // ═══════════════════════════════════════════

  describe('4. overallStatus 综合判断', () => {
    test('空库时 overallStatus 为 critical', () => {
      clearCaseStoreV2()
      const dashboard = generateCaseDashboard()
      expect(dashboard.overallStatus).toBe('critical')
    })

    test('正常数据时 overallStatus 为 healthy', () => {
      clearCaseStoreV2()
      for (let i = 0; i < 5; i++) {
        addCaseV2(makeCaseV2(`H-${i}`, 'classic', {
          qualityScore: 80, starRating: 4, reliability: 75,
          reviewStatus: 'approved',
        }))
      }
      const dashboard = generateCaseDashboard()
      expect(dashboard.overallStatus).toBe('healthy')
    })

    test('低质量比例过高时 overallStatus 为 warning', () => {
      clearCaseStoreV2()
      // 5 cases, 2 low quality = 40% > 30% warning threshold
      for (let i = 0; i < 3; i++) {
        addCaseV2(makeCaseV2(`W1-${i}`, 'classic', { qualityScore: 80, reviewStatus: 'approved' }))
      }
      for (let i = 0; i < 2; i++) {
        addCaseV2(makeCaseV2(`W1-L${i}`, 'anonymous', { qualityScore: 30, reviewStatus: 'approved' }))
      }
      const dashboard = generateCaseDashboard()
      expect(dashboard.overallStatus).toBe('warning')
    })

    test('低质量比例超过 50% 时 overallStatus 为 critical', () => {
      clearCaseStoreV2()
      // 4 cases, 3 low quality = 75% > 50% critical threshold
      addCaseV2(makeCaseV2('C1', 'classic', { qualityScore: 80, reviewStatus: 'approved' }))
      for (let i = 0; i < 3; i++) {
        addCaseV2(makeCaseV2(`C-L${i}`, 'anonymous', { qualityScore: 30, reviewStatus: 'approved' }))
      }
      const dashboard = generateCaseDashboard()
      expect(dashboard.overallStatus).toBe('critical')
    })

    test('待审核比例过高时 overallStatus 为 warning', () => {
      clearCaseStoreV2()
      // 5 cases, 2 pending = 40% > 30% warning threshold
      for (let i = 0; i < 3; i++) {
        addCaseV2(makeCaseV2(`WP-${i}`, 'classic', { reviewStatus: 'approved' }))
      }
      for (let i = 0; i < 2; i++) {
        addCaseV2(makeCaseV2(`WP-P${i}`, 'anonymous', { reviewStatus: 'pending' }))
      }
      const dashboard = generateCaseDashboard()
      expect(dashboard.overallStatus).toBe('warning')
    })

    test('冲突案例比例过高时 overallStatus 为 warning', () => {
      clearCaseStoreV2()
      // 5 cases, 2 conflicts = 40% > 20% warning threshold
      for (let i = 0; i < 3; i++) {
        addCaseV2(makeCaseV2(`WF-${i}`, 'classic', { reviewStatus: 'approved', conflicts: [] }))
      }
      for (let i = 0; i < 2; i++) {
        addCaseV2(makeCaseV2(`WF-C${i}`, 'anonymous', {
          reviewStatus: 'approved',
          conflicts: [{
            conflictId: `cnf-${i}`,
            conflictType: 'classical',
            topic: 'test',
            description: 'test',
            viewpointA: 'a',
            viewpointB: 'b',
            sourceA: 'sa',
            sourceB: 'sb',
            affectedCaseIds: [],
          }],
        }))
      }
      const dashboard = generateCaseDashboard()
      expect(dashboard.overallStatus).toBe('warning')
    })

    test('已废弃比例过高时 overallStatus 为 critical', () => {
      clearCaseStoreV2()
      // 5 cases, 2 deprecated = 40% > 30% critical threshold
      for (let i = 0; i < 3; i++) {
        addCaseV2(makeCaseV2(`WD-${i}`, 'classic', { reviewStatus: 'approved' }))
      }
      for (let i = 0; i < 2; i++) {
        addCaseV2(makeCaseV2(`WD-D${i}`, 'anonymous', { reviewStatus: 'deprecated' }))
      }
      const dashboard = generateCaseDashboard()
      expect(dashboard.overallStatus).toBe('critical')
    })
  })

  // ═══════════════════════════════════════════
  // Group 5: getDashboardSnapshot
  // ═══════════════════════════════════════════

  describe('5. getDashboardSnapshot', () => {
    test('返回对象包含所有关键字段', () => {
      const snapshot = getDashboardSnapshot()
      expect(snapshot.version).toBe(CASE_DASHBOARD_VERSION)
      expect(snapshot.generatedAt).toBeGreaterThan(0)
      expect(['healthy', 'warning', 'critical']).toContain(snapshot.overallStatus)
      expect(typeof snapshot.totalCases).toBe('number')
      expect(typeof snapshot.avgQualityScore).toBe('number')
      expect(typeof snapshot.avgReliability).toBe('number')
      expect(typeof snapshot.goldRatio).toBe('number')
      expect(typeof snapshot.pendingReviewCount).toBe('number')
      expect(typeof snapshot.lowQualityCount).toBe('number')
    })

    test('snapshot totalCases 与数据库一致', () => {
      clearCaseStoreV2()
      addCaseV2(makeCaseV2('S-001', 'classic'))
      addCaseV2(makeCaseV2('S-002', 'anonymous'))
      const snapshot = getDashboardSnapshot()
      expect(snapshot.totalCases).toBe(2)
    })

    test('snapshot avgQualityScore 计算正确', () => {
      clearCaseStoreV2()
      addCaseV2(makeCaseV2('S-003', 'classic', { qualityScore: 90 }))
      addCaseV2(makeCaseV2('S-004', 'anonymous', { qualityScore: 70 }))
      const snapshot = getDashboardSnapshot()
      expect(snapshot.avgQualityScore).toBe(80)
    })

    test('snapshot goldRatio 计算正确', () => {
      clearCaseStoreV2()
      addCaseV2(makeCaseV2('S-005', 'classic', {
        qualityScore: 90, starRating: 5, reliability: 85,
        expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()],
        consensusScore: 0.9,
      }))
      addCaseV2(makeCaseV2('S-006', 'anonymous', { qualityScore: 50 }))
      const snapshot = getDashboardSnapshot()
      expect(snapshot.goldRatio).toBe(50)
    })

    test('snapshot lowQualityCount 计算正确', () => {
      clearCaseStoreV2()
      addCaseV2(makeCaseV2('S-007', 'classic', { qualityScore: 80 }))
      addCaseV2(makeCaseV2('S-008', 'anonymous', { qualityScore: 40 }))
      addCaseV2(makeCaseV2('S-009', 'regression', { qualityScore: 30 }))
      const snapshot = getDashboardSnapshot()
      expect(snapshot.lowQualityCount).toBe(2)
    })

    test('snapshot pendingReviewCount 计算正确', () => {
      clearCaseStoreV2()
      addCaseV2(makeCaseV2('S-010', 'classic', { reviewStatus: 'pending' }))
      addCaseV2(makeCaseV2('S-011', 'anonymous', { reviewStatus: 'approved' }))
      addCaseV2(makeCaseV2('S-012', 'regression', { reviewStatus: 'pending' }))
      const snapshot = getDashboardSnapshot()
      expect(snapshot.pendingReviewCount).toBe(2)
    })
  })

  // ═══════════════════════════════════════════
  // Group 6: 边界与特殊情况
  // ═══════════════════════════════════════════

  describe('6. 边界与特殊情况', () => {
    test('totalCases 为 0 时 sections 仍正常生成', () => {
      clearCaseStoreV2()
      const dashboard = generateCaseDashboard()
      expect(dashboard.totalCases).toBe(0)
      expect(dashboard.sections).toHaveLength(6)
      const quality = dashboard.sections.find((s) => s.title === '质量评分')!
      expect(quality.metrics.find((m) => m.label === '平均质量评分')!.value).toBe(0)
    })

    test('recentAdditions 只统计最近30天内新增', () => {
      clearCaseStoreV2()
      const now = Date.now()
      addCaseV2(makeCaseV2('REC-001', 'classic', { createdAt: now }))
      addCaseV2(makeCaseV2('REC-002', 'anonymous', { createdAt: now - 31 * 24 * 60 * 60 * 1000 }))
      const dashboard = generateCaseDashboard()
      expect(dashboard.recentAdditions).toBe(1)
    })

    test('种子数据下 dashboard 能正常生成', () => {
      resetCaseStoreV2()
      const dashboard = generateCaseDashboard()
      expect(dashboard.totalCases).toBeGreaterThan(0)
      expect(dashboard.sections).toHaveLength(6)
    })
  })
})
