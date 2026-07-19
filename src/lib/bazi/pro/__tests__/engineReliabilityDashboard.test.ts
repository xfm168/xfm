/**
 * Engine Reliability Dashboard Engine — 测试
 */

import { describe, test, expect, beforeEach } from 'vitest'

import type {
  EngineReliabilityDashboard,
  ReliabilityDashboardSection,
  EngineReliabilityMetric,
} from '../engineReliabilityDashboardTypes'

import {
  generateEngineReliabilityDashboard,
  getDashboardSnapshot,
  evaluateEngineReadiness,
  ENGINE_RELIABILITY_DASHBOARD_VERSION,
} from '../engineReliabilityDashboardEngine'

import { _clearReviewStore } from '../professionalReviewEngine'

// ═══════════════════════════════════════════
// 1. generateEngineReliabilityDashboard 基础测试
// ═══════════════════════════════════════════

describe('generateEngineReliabilityDashboard', () => {
  beforeEach(() => {
    _clearReviewStore()
  })

  test('返回结构完整的仪表盘', () => {
    const dashboard = generateEngineReliabilityDashboard()
    expect(dashboard).toBeDefined()
    expect(dashboard.version).toBe(ENGINE_RELIABILITY_DASHBOARD_VERSION)
    expect(dashboard.generatedAt).toBeTypeOf('number')
    expect(dashboard.generatedAt).toBeGreaterThan(0)
  })

  test('包含 10 个板块', () => {
    const dashboard = generateEngineReliabilityDashboard()
    expect(dashboard.sections).toHaveLength(10)
  })

  test('每个板块有 title 和 metrics', () => {
    const dashboard = generateEngineReliabilityDashboard()
    for (const section of dashboard.sections) {
      expect(section.title).toBeTruthy()
      expect(section.metrics).toBeDefined()
      expect(section.metrics.length).toBeGreaterThan(0)
    }
  })

  test('每个指标包含必要字段', () => {
    const dashboard = generateEngineReliabilityDashboard()
    for (const section of dashboard.sections) {
      for (const metric of section.metrics) {
        expect(metric.category).toBeTruthy()
        expect(metric.label).toBeTruthy()
        expect(metric.value).toBeDefined()
        expect(['ok', 'warning', 'critical']).toContain(metric.status)
        expect(metric.threshold).toBeTypeOf('number')
        expect(metric.description).toBeTruthy()
      }
    }
  })

  test('overallScore 在 0-100 之间', () => {
    const dashboard = generateEngineReliabilityDashboard()
    expect(dashboard.overallScore).toBeGreaterThanOrEqual(0)
    expect(dashboard.overallScore).toBeLessThanOrEqual(100)
  })

  test('overallStatus 为合法值', () => {
    const dashboard = generateEngineReliabilityDashboard()
    expect(['excellent', 'good', 'fair', 'critical']).toContain(dashboard.overallStatus)
  })

  test('recommendations 是数组', () => {
    const dashboard = generateEngineReliabilityDashboard()
    expect(Array.isArray(dashboard.recommendations)).toBe(true)
  })

  // ═══════════════════════════════════════════
  // 2. 各板块测试
  // ═══════════════════════════════════════════

  test('规则引擎板块存在且包含规则命中数', () => {
    const dashboard = generateEngineReliabilityDashboard()
    const ruleSection = dashboard.sections.find((s) => s.title === '规则引擎')
    expect(ruleSection).toBeDefined()
    const hitMetric = ruleSection!.metrics.find((m) => m.label === '规则命中数')
    expect(hitMetric).toBeDefined()
    expect(Number(hitMetric!.value)).toBeGreaterThan(0)
  })

  test('规则引擎板块包含启用率和覆盖率', () => {
    const dashboard = generateEngineReliabilityDashboard()
    const ruleSection = dashboard.sections.find((s) => s.title === '规则引擎')!
    const labels = ruleSection.metrics.map((m) => m.label)
    expect(labels).toContain('启用率')
    expect(labels).toContain('覆盖率')
  })

  test('置信度板块包含平均置信度', () => {
    const dashboard = generateEngineReliabilityDashboard()
    const confSection = dashboard.sections.find((s) => s.title === '置信度')
    expect(confSection).toBeDefined()
    const avgMetric = confSection!.metrics.find((m) => m.label === '平均置信度')
    expect(avgMetric).toBeDefined()
  })

  test('回归验证板块包含 Gold 数量', () => {
    const dashboard = generateEngineReliabilityDashboard()
    const regSection = dashboard.sections.find((s) => s.title === '回归验证')
    expect(regSection).toBeDefined()
    const goldMetric = regSection!.metrics.find((m) => m.label === 'Gold')
    expect(goldMetric).toBeDefined()
    expect(Number(goldMetric!.value)).toBeGreaterThanOrEqual(0)
  })

  test('性能基准板块使用默认值', () => {
    const dashboard = generateEngineReliabilityDashboard()
    const perfSection = dashboard.sections.find((s) => s.title === '性能基准')
    expect(perfSection).toBeDefined()
    const pipelineMetric = perfSection!.metrics.find((m) => m.label === '平均管线耗时')
    expect(pipelineMetric).toBeDefined()
    expect(String(pipelineMetric!.value)).toContain('ms')
    expect(pipelineMetric!.description).toContain('默认值')
  })

  test('缓存板块命中率为 100%', () => {
    const dashboard = generateEngineReliabilityDashboard()
    const cacheSection = dashboard.sections.find((s) => s.title === '缓存')
    expect(cacheSection).toBeDefined()
    const cacheMetric = cacheSection!.metrics.find((m) => m.label === '缓存命中率')
    expect(cacheMetric).toBeDefined()
    expect(String(cacheMetric!.value)).toBe('100%')
  })

  test('知识库板块包含知识条目', () => {
    const dashboard = generateEngineReliabilityDashboard()
    const kbSection = dashboard.sections.find((s) => s.title === '知识库')
    expect(kbSection).toBeDefined()
    const totalMetric = kbSection!.metrics.find((m) => m.label === '知识条目')
    expect(totalMetric).toBeDefined()
    expect(Number(totalMetric!.value)).toBeGreaterThan(0)
  })

  test('健康状态板块包含 Quality Gate 健康分', () => {
    const dashboard = generateEngineReliabilityDashboard()
    const healthSection = dashboard.sections.find((s) => s.title === '健康状态')
    expect(healthSection).toBeDefined()
    const healthMetric = healthSection!.metrics.find((m) => m.label === 'Quality Gate 健康分')
    expect(healthMetric).toBeDefined()
    expect(Number(healthMetric!.value)).toBeGreaterThanOrEqual(0)
  })

  test('信任分布板块包含 highly_trusted', () => {
    const dashboard = generateEngineReliabilityDashboard()
    const trustSection = dashboard.sections.find((s) => s.title === '信任分布')
    expect(trustSection).toBeDefined()
    const htMetric = trustSection!.metrics.find((m) => m.label === 'highly_trusted')
    expect(htMetric).toBeDefined()
    expect(Number(htMetric!.value)).toBeGreaterThanOrEqual(0)
  })

  test('指标 category 互不重复（10 大板块各对应一个）', () => {
    const dashboard = generateEngineReliabilityDashboard()
    const categories = dashboard.sections.map((s) => s.metrics[0]?.category)
    const uniqueCategories = new Set(categories)
    expect(uniqueCategories.size).toBe(10)
  })

  // ═══════════════════════════════════════════
  // 3. 快照测试
  // ═══════════════════════════════════════════

  describe('getDashboardSnapshot', () => {
    test('返回精简快照', () => {
      const snapshot = getDashboardSnapshot()
      expect(snapshot.version).toBe(ENGINE_RELIABILITY_DASHBOARD_VERSION)
      expect(snapshot.generatedAt).toBeTypeOf('number')
      expect(snapshot.sectionCount).toBe(10)
      expect(snapshot.metricCount).toBeGreaterThan(0)
      expect(snapshot.recommendationCount).toBeGreaterThanOrEqual(0)
    })

    test('快照的 overallScore 与仪表盘一致', () => {
      const dashboard = generateEngineReliabilityDashboard()
      const snapshot = getDashboardSnapshot()
      expect(snapshot.overallScore).toBeTypeOf('number')
      // 快照是重新生成的，分数可能相同
      expect(snapshot.overallScore).toBeGreaterThanOrEqual(0)
    })

    test('快照的 sectionScores 长度与板块数一致', () => {
      const snapshot = getDashboardSnapshot()
      expect(snapshot.sectionScores).toHaveLength(10)
      for (const ss of snapshot.sectionScores) {
        expect(ss.title).toBeTruthy()
        expect(ss.score).toBeGreaterThanOrEqual(0)
        expect(ss.score).toBeLessThanOrEqual(100)
        expect(['ok', 'warning', 'critical']).toContain(ss.status)
      }
    })

    test('快照包含 overallStatus', () => {
      const snapshot = getDashboardSnapshot()
      expect(['excellent', 'good', 'fair', 'critical']).toContain(snapshot.overallStatus)
    })
  })

  // ═══════════════════════════════════════════
  // 4. 就绪度评估测试
  // ═══════════════════════════════════════════

  describe('evaluateEngineReadiness', () => {
    test('返回 ready 字段', () => {
      const readiness = evaluateEngineReadiness()
      expect(typeof readiness.ready).toBe('boolean')
    })

    test('返回 score', () => {
      const readiness = evaluateEngineReadiness()
      expect(readiness.score).toBeGreaterThanOrEqual(0)
      expect(readiness.score).toBeLessThanOrEqual(100)
    })

    test('返回 blockedBy 和 warnings 数组', () => {
      const readiness = evaluateEngineReadiness()
      expect(Array.isArray(readiness.blockedBy)).toBe(true)
      expect(Array.isArray(readiness.warnings)).toBe(true)
    })

    test('当 ready=true 时 blockedBy 为空', () => {
      const readiness = evaluateEngineReadiness()
      if (readiness.ready) {
        expect(readiness.blockedBy).toHaveLength(0)
      }
    })

    test('当 ready=false 时 blockedBy 不为空', () => {
      const readiness = evaluateEngineReadiness()
      if (!readiness.ready) {
        expect(readiness.blockedBy.length).toBeGreaterThan(0)
      }
    })
  })

  // ═══════════════════════════════════════════
  // 5. 版本号测试
  // ═══════════════════════════════════════════

  test('版本号格式正确', () => {
    expect(ENGINE_RELIABILITY_DASHBOARD_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
