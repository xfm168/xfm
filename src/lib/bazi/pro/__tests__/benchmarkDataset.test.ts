/**
 * Benchmark Dataset Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - 数据集创建（top100 / top500 / top1000）
 *   - 排序与边界
 *   - 基准运行（pass / fail / 异常 / 缺失）
 *   - 报告生成
 *   - 官方预设数据集
 */

import { describe, test, expect, beforeEach } from 'vitest'
import type { CaseEntryV2, CaseCategoryV2, ExpertOpinionV2 } from '../caseLibraryTypesV2'
import { addCaseV2, resetCaseStoreV2, clearCaseStoreV2 } from '../caseDatabaseV2'
import type { BenchmarkScale } from '../benchmarkDatasetTypes'
import {
  BENCHMARK_DATASET_VERSION,
  createBenchmarkDataset,
  runBenchmark,
  generateBenchmarkReport,
  getOfficialBenchmarkDatasets,
  getOfficialBenchmarkDatasetsFromPool,
} from '../benchmarkDatasetEngine'

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
      expertCount: 0,
      consensusRate: 0,
      citationCount: 0,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
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
// 1. 版本号
// ═══════════════════════════════════════════

describe('Benchmark Dataset Engine', () => {
  describe('1. 版本号', () => {
    test('版本号应为 1.0.0', () => {
      expect(BENCHMARK_DATASET_VERSION).toBe('1.0.0')
    })
  })

  // ═══════════════════════════════════════════
  // 2. 数据集创建
  // ═══════════════════════════════════════════

  describe('2. 数据集创建', () => {
    test('createBenchmarkDataset top100 选取 Gold + 高 reliability', () => {
      const cases = [
        makeCaseV2('G-001', 'classic', { qualityScore: 95, starRating: 5, reliability: 90, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 }),
        makeCaseV2('G-002', 'classic', { qualityScore: 88, starRating: 4, reliability: 85, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.88 }),
        makeCaseV2('L-001', 'classic', { qualityScore: 40, starRating: 2, reliability: 30, expertOpinions: [], consensusScore: 0.3 }),
      ]
      const ds = createBenchmarkDataset('top100', cases)
      expect(ds.scale).toBe('top100')
      expect(ds.caseIds.length).toBe(2)
      expect(ds.caseIds).toContain('G-001')
      expect(ds.caseIds).toContain('G-002')
      expect(ds.caseIds).not.toContain('L-001')
    })

    test('createBenchmarkDataset top500 选取范围更宽', () => {
      const cases = [
        makeCaseV2('G-003', 'classic', { qualityScore: 95, starRating: 5, reliability: 90, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 }),
        makeCaseV2('S-001', 'classic', { qualityScore: 72, starRating: 3, reliability: 65, expertOpinions: [makeOpinion()], consensusScore: 0.72 }),
        makeCaseV2('R-001', 'classic', { qualityScore: 60, starRating: 3, reliability: 62, expertOpinions: [], consensusScore: 0.6 }),
        makeCaseV2('L-002', 'classic', { qualityScore: 30, starRating: 1, reliability: 20, expertOpinions: [], consensusScore: 0.2 }),
      ]
      const ds = createBenchmarkDataset('top500', cases)
      expect(ds.caseIds.length).toBe(3)
      expect(ds.caseIds).toContain('G-003')
      expect(ds.caseIds).toContain('S-001')
      expect(ds.caseIds).toContain('R-001')
      expect(ds.caseIds).not.toContain('L-002')
    })

    test('createBenchmarkDataset top1000 选取 qualityScore >= 50', () => {
      const cases = [
        makeCaseV2('H-001', 'classic', { qualityScore: 55, starRating: 3, reliability: 50, expertOpinions: [], consensusScore: 0.55 }),
        makeCaseV2('H-002', 'classic', { qualityScore: 50, starRating: 2, reliability: 45, expertOpinions: [], consensusScore: 0.5 }),
        makeCaseV2('L-003', 'classic', { qualityScore: 49, starRating: 2, reliability: 40, expertOpinions: [], consensusScore: 0.4 }),
      ]
      const ds = createBenchmarkDataset('top1000', cases)
      expect(ds.caseIds.length).toBe(2)
      expect(ds.caseIds).toContain('H-001')
      expect(ds.caseIds).toContain('H-002')
      expect(ds.caseIds).not.toContain('L-003')
    })

    test('createBenchmarkDataset 按 qualityScore 降序排列', () => {
      const cases = [
        makeCaseV2('M-001', 'classic', { qualityScore: 70, starRating: 3, reliability: 80, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.7 }),
        makeCaseV2('M-002', 'classic', { qualityScore: 95, starRating: 5, reliability: 90, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.95 }),
        makeCaseV2('M-003', 'classic', { qualityScore: 80, starRating: 4, reliability: 85, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.8 }),
      ]
      const ds = createBenchmarkDataset('top100', cases)
      expect(ds.caseIds[0]).toBe('M-002')
      expect(ds.caseIds[1]).toBe('M-003')
      expect(ds.caseIds[2]).toBe('M-001')
    })

    test('createBenchmarkDataset 空数组返回空 caseIds', () => {
      const ds = createBenchmarkDataset('top100', [])
      expect(ds.caseIds).toEqual([])
      expect(ds.description).toContain('0 cases')
    })

    test('createBenchmarkDataset top100 不超过 100', () => {
      const cases: CaseEntryV2[] = []
      for (let i = 0; i < 150; i++) {
        cases.push(makeCaseV2(`B-${i}`, 'classic', {
          qualityScore: 90 + (i % 10),
          starRating: 5,
          reliability: 90,
          expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()],
          consensusScore: 0.9,
        }))
      }
      const ds = createBenchmarkDataset('top100', cases)
      expect(ds.caseIds.length).toBe(100)
    })
  })

  // ═══════════════════════════════════════════
  // 3. 基准运行
  // ═══════════════════════════════════════════

  describe('3. 基准运行', () => {
    beforeEach(() => {
      resetCaseStoreV2()
    })

    test('runBenchmark 基本通过', () => {
      const c1 = makeCaseV2('BR-001', 'classic', { qualityScore: 90, starRating: 5, reliability: 85, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 })
      addCaseV2(c1)
      const ds = createBenchmarkDataset('top100', [c1])
      const result = runBenchmark(ds, () => ({ passed: true, result: 'ok' }))
      expect(result.passCount).toBe(1)
      expect(result.failCount).toBe(0)
      expect(result.passRate).toBe(1)
      expect(result.details[0].passed).toBe(true)
    })

    test('runBenchmark 统计 pass/fail 正确', () => {
      const c1 = makeCaseV2('BR-002', 'classic', { qualityScore: 90, starRating: 5, reliability: 85, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 })
      const c2 = makeCaseV2('BR-003', 'classic', { qualityScore: 88, starRating: 4, reliability: 82, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.88 })
      addCaseV2(c1)
      addCaseV2(c2)
      const ds = createBenchmarkDataset('top100', [c1, c2])
      let callCount = 0
      const result = runBenchmark(ds, () => {
        callCount++
        return { passed: callCount === 1 }
      })
      expect(result.totalCases).toBe(2)
      expect(result.passCount).toBe(1)
      expect(result.failCount).toBe(1)
      expect(result.passRate).toBe(0.5)
    })

    test('runBenchmark 找不到 case 时标记失败', () => {
      const ds = createBenchmarkDataset('top100', [])
      // 手动注入不存在的 caseId
      ds.caseIds = ['NON-EXISTENT']
      const result = runBenchmark(ds, () => ({ passed: true }))
      expect(result.failCount).toBe(1)
      expect(result.details[0].error).toContain('not found')
    })

    test('runBenchmark engineFn 抛出异常时标记失败', () => {
      const c1 = makeCaseV2('BR-004', 'classic', { qualityScore: 90, starRating: 5, reliability: 85, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 })
      addCaseV2(c1)
      const ds = createBenchmarkDataset('top100', [c1])
      const result = runBenchmark(ds, () => {
        throw new Error('Engine crash')
      })
      expect(result.failCount).toBe(1)
      expect(result.details[0].error).toContain('Engine crash')
    })

    test('runBenchmark 空数据集返回零值', () => {
      const ds = createBenchmarkDataset('top100', [])
      const result = runBenchmark(ds, () => ({ passed: true }))
      expect(result.totalCases).toBe(0)
      expect(result.passCount).toBe(0)
      expect(result.failCount).toBe(0)
      expect(result.passRate).toBe(0)
      expect(result.avgTimeMs).toBe(0)
    })
  })

  // ═══════════════════════════════════════════
  // 4. 报告生成
  // ═══════════════════════════════════════════

  describe('4. 报告生成', () => {
    test('generateBenchmarkReport 基本功能', () => {
      const run1 = {
        datasetScale: 'top100' as BenchmarkScale,
        totalCases: 10,
        passCount: 8,
        failCount: 2,
        passRate: 0.8,
        avgTimeMs: 15,
        details: [],
      }
      const report = generateBenchmarkReport([run1])
      expect(report.version).toBe(BENCHMARK_DATASET_VERSION)
      expect(report.runResults).toHaveLength(1)
      expect(report.summary.totalDatasets).toBe(1)
      expect(report.summary.totalCases).toBe(10)
      expect(report.summary.overallPassCount).toBe(8)
      expect(report.summary.overallFailCount).toBe(2)
      expect(report.generatedAt).toBeGreaterThan(0)
    })

    test('generateBenchmarkReport 空数组', () => {
      const report = generateBenchmarkReport([])
      expect(report.runResults).toEqual([])
      expect(report.summary.totalDatasets).toBe(0)
      expect(report.summary.totalCases).toBe(0)
      expect(report.summary.overallPassRate).toBe(0)
    })

    test('generateBenchmarkReport 多数据集汇总正确', () => {
      const runs = [
        { datasetScale: 'top100' as BenchmarkScale, totalCases: 100, passCount: 90, failCount: 10, passRate: 0.9, avgTimeMs: 10, details: [] },
        { datasetScale: 'top500' as BenchmarkScale, totalCases: 500, passCount: 450, failCount: 50, passRate: 0.9, avgTimeMs: 20, details: [] },
      ]
      const report = generateBenchmarkReport(runs)
      expect(report.summary.totalCases).toBe(600)
      expect(report.summary.overallPassCount).toBe(540)
      expect(report.summary.overallFailCount).toBe(60)
      expect(report.summary.overallPassRate).toBe(0.9)
      expect(report.summary.avgTimeMs).toBe(15)
    })
  })

  // ═══════════════════════════════════════════
  // 5. 官方预设数据集
  // ═══════════════════════════════════════════

  describe('5. 官方预设数据集', () => {
    test('getOfficialBenchmarkDatasets 返回 3 个数据集', () => {
      const dss = getOfficialBenchmarkDatasets()
      expect(dss).toHaveLength(3)
      expect(dss.map((d) => d.scale)).toContain('top100')
      expect(dss.map((d) => d.scale)).toContain('top500')
      expect(dss.map((d) => d.scale)).toContain('top1000')
    })

    test('getOfficialBenchmarkDatasetsFromPool 基于传入 pool 创建', () => {
      const cases = [
        makeCaseV2('OG-001', 'classic', { qualityScore: 95, starRating: 5, reliability: 90, expertOpinions: [makeOpinion(), makeOpinion(), makeOpinion()], consensusScore: 0.9 }),
        makeCaseV2('OG-002', 'classic', { qualityScore: 80, starRating: 4, reliability: 80, expertOpinions: [makeOpinion(), makeOpinion()], consensusScore: 0.8 }),
      ]
      const dss = getOfficialBenchmarkDatasetsFromPool(cases)
      expect(dss).toHaveLength(3)
      const top100 = dss.find((d) => d.scale === 'top100')!
      expect(top100.caseIds.length).toBeGreaterThan(0)
    })
  })
})
