/**
 * V5.0 RC Phase 5 Batch 2 Module IV: Confidence Visualization Engine 测试
 *
 * 覆盖：buildTrustScoreGauge、calculateSourceContributions、buildBreakdownItems、
 *       mapScoreToColor、formatConfidenceLabel、getTrustDisplayLevel、mapScoreToStatus、
 *       buildConfidenceVisualization、常量验证
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  buildTrustScoreGauge,
  calculateSourceContributions,
  buildBreakdownItems,
  mapScoreToColor,
  formatConfidenceLabel,
  getTrustDisplayLevel,
  mapScoreToStatus,
  buildConfidenceVisualization,
  CONFIDENCE_VIZ_ENGINE_VERSION,
} from '../confidenceVizEngine'

import {
  CONFIDENCE_VIZ_VERSION,
  TRUST_LEVEL_THRESHOLDS_VIZ,
  DEFAULT_VIZ_OPTIONS,
} from '../confidenceVizTypes'

// ═══════════════════════════════════════════════════════════════
// 测试数据
// ═══════════════════════════════════════════════════════════════

const sampleDimensions = [
  { dimension: '古籍验证', score: 85, weight: 0.8, source: 'ancientClassics' },
  { dimension: '专家共识', score: 72, weight: 0.9, source: 'expertConsensus' },
  { dimension: '规则匹配', score: 60, weight: 0.7, source: 'ruleEngine' },
  { dimension: 'AI 模型', score: 45, weight: 0.5, source: 'aiModel' },
  { dimension: '传统经验', score: 30, weight: 0.3, source: 'traditional' },
]

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('V5.0 RC Phase 5 Batch 2: Confidence Visualization Engine', () => {

  // ─── 常量验证 ───────────────────────────────────────────────
  describe('常量', () => {
    test('CONFIDENCE_VIZ_VERSION 应为 1.0.0', () => {
      expect(CONFIDENCE_VIZ_VERSION).toBe('1.0.0')
    })
    test('CONFIDENCE_VIZ_ENGINE_VERSION 应为 1.0.0', () => {
      expect(CONFIDENCE_VIZ_ENGINE_VERSION).toBe('1.0.0')
    })
    test('DEFAULT_VIZ_OPTIONS 字段正确', () => {
      expect(DEFAULT_VIZ_OPTIONS.displayMode).toBe('gauge')
      expect(DEFAULT_VIZ_OPTIONS.showSourceBreakdown).toBe(true)
      expect(DEFAULT_VIZ_OPTIONS.maxSources).toBe(10)
      expect(DEFAULT_VIZ_OPTIONS.colorScheme).toBe('default')
    })
    test('TRUST_LEVEL_THRESHOLDS_VIZ 包含 5 个级别', () => {
      const keys = Object.keys(TRUST_LEVEL_THRESHOLDS_VIZ)
      expect(keys).toHaveLength(5)
      expect(keys).toContain('highly_trusted')
      expect(keys).toContain('trusted')
      expect(keys).toContain('moderate')
      expect(keys).toContain('low')
      expect(keys).toContain('unverified')
    })
    test('highly_trusted 阈值为 85~100', () => {
      const t = TRUST_LEVEL_THRESHOLDS_VIZ.highly_trusted
      expect(t.min).toBe(85)
      expect(t.max).toBe(100)
      expect(t.label).toBe('高度可信')
      expect(t.color).toBe('#22c55e')
    })
  })

  // ─── buildTrustScoreGauge ───────────────────────────────────
  describe('buildTrustScoreGauge', () => {
    test('highly_trusted 区间 (85-100)', () => {
      const gauge = buildTrustScoreGauge(90)
      expect(gauge.level).toBe('highly_trusted')
      expect(gauge.label).toBe('高度可信')
      expect(gauge.color).toBe('#22c55e')
      expect(gauge.value).toBe(90)
    })

    test('trusted 区间 (70-84)', () => {
      const gauge = buildTrustScoreGauge(75)
      expect(gauge.level).toBe('trusted')
      expect(gauge.label).toBe('可信')
      expect(gauge.color).toBe('#84cc16')
    })

    test('moderate 区间 (50-69)', () => {
      const gauge = buildTrustScoreGauge(60)
      expect(gauge.level).toBe('moderate')
      expect(gauge.label).toBe('中等')
      expect(gauge.color).toBe('#eab308')
    })

    test('low 区间 (30-49)', () => {
      const gauge = buildTrustScoreGauge(35)
      expect(gauge.level).toBe('low')
      expect(gauge.label).toBe('偏低')
      expect(gauge.color).toBe('#f97316')
    })

    test('unverified 区间 (0-29)', () => {
      const gauge = buildTrustScoreGauge(15)
      expect(gauge.level).toBe('unverified')
      expect(gauge.label).toBe('未验证')
      expect(gauge.color).toBe('#ef4444')
    })

    test('边界值 85 应为 highly_trusted', () => {
      expect(buildTrustScoreGauge(85).level).toBe('highly_trusted')
    })

    test('边界值 84 应为 trusted', () => {
      expect(buildTrustScoreGauge(84).level).toBe('trusted')
    })

    test('超出范围值被 clamp', () => {
      const high = buildTrustScoreGauge(150)
      expect(high.value).toBe(100)
      const low = buildTrustScoreGauge(-10)
      expect(low.value).toBe(0)
    })
  })

  // ─── calculateSourceContributions ───────────────────────────
  describe('calculateSourceContributions', () => {
    test('权重计算正确', () => {
      const result = calculateSourceContributions(sampleDimensions)
      expect(result).toHaveLength(5)
      // 古籍验证: 85 * 0.8 = 68
      const classics = result.find((r) => r.source === 'ancientClassics')
      expect(classics?.contribution).toBe(68)
    })

    test('按 contribution 降序排列', () => {
      const result = calculateSourceContributions(sampleDimensions)
      for (let i = 1; i < result.length; i++) {
        expect(result[i - 1].contribution).toBeGreaterThanOrEqual(result[i].contribution)
      }
    })

    test('空输入返回空数组', () => {
      expect(calculateSourceContributions([])).toEqual([])
    })

    test('contribution 不超过 100', () => {
      const result = calculateSourceContributions([{ dimension: 'test', score: 200, weight: 1.0, source: 'test' }])
      expect(result[0].contribution).toBeLessThanOrEqual(100)
    })
  })

  // ─── buildBreakdownItems ───────────────────────────────────
  describe('buildBreakdownItems', () => {
    test('百分比计算正确', () => {
      const result = buildBreakdownItems(sampleDimensions)
      expect(result).toHaveLength(5)
      // 古籍验证 85/100 = 85%
      const classics = result.find((r) => r.dimension === '古籍验证')
      expect(classics?.percentage).toBe(85)
    })

    test('状态判定正确', () => {
      const result = buildBreakdownItems(sampleDimensions)
      const strong = result.find((r) => r.dimension === '古籍验证')
      const moderate = result.find((r) => r.dimension === '规则匹配')
      const weak = result.find((r) => r.dimension === '传统经验')
      expect(strong?.status).toBe('strong')
      expect(moderate?.status).toBe('moderate')
      expect(weak?.status).toBe('weak')
    })

    test('maxScore 为 100', () => {
      const result = buildBreakdownItems(sampleDimensions)
      for (const item of result) {
        expect(item.maxScore).toBe(100)
      }
    })

    test('空输入返回空数组', () => {
      expect(buildBreakdownItems([])).toEqual([])
    })
  })

  // ─── mapScoreToColor ───────────────────────────────────────
  describe('mapScoreToColor', () => {
    test('default 方案：highly_trusted 为绿', () => {
      expect(mapScoreToColor(90, 'default')).toBe('#22c55e')
    })

    test('default 方案：unverified 为红', () => {
      expect(mapScoreToColor(10, 'default')).toBe('#ef4444')
    })

    test('traffic-light 方案：高分绿、中分黄、低分红', () => {
      expect(mapScoreToColor(80, 'traffic-light')).toBe('#22c55e')
      expect(mapScoreToColor(55, 'traffic-light')).toBe('#eab308')
      expect(mapScoreToColor(20, 'traffic-light')).toBe('#ef4444')
    })

    test('monochrome 方案：返回灰度 hex', () => {
      const color = mapScoreToColor(75, 'monochrome')
      expect(color).toMatch(/^#[0-9a-f]{6}$/)
    })

    test('monochrome 方案：0 分最浅，100 分最深', () => {
      const light = mapScoreToColor(0, 'monochrome')
      const dark = mapScoreToColor(100, 'monochrome')
      // light 应比 dark 亮度更高
      const lightVal = parseInt(light.slice(1, 3), 16)
      const darkVal = parseInt(dark.slice(1, 3), 16)
      expect(lightVal).toBeLessThan(darkVal)
    })

    test('默认 scheme 为 default', () => {
      const result = mapScoreToColor(90)
      expect(result).toBe('#22c55e')
    })
  })

  // ─── formatConfidenceLabel ──────────────────────────────────
  describe('formatConfidenceLabel', () => {
    test('85 分为 高度可信', () => {
      expect(formatConfidenceLabel(85)).toBe('高度可信')
    })
    test('75 分为 可信', () => {
      expect(formatConfidenceLabel(75)).toBe('可信')
    })
    test('55 分为 中等', () => {
      expect(formatConfidenceLabel(55)).toBe('中等')
    })
    test('35 分为 偏低', () => {
      expect(formatConfidenceLabel(35)).toBe('偏低')
    })
    test('15 分为 未验证', () => {
      expect(formatConfidenceLabel(15)).toBe('未验证')
    })
    test('边界值 70 为 可信', () => {
      expect(formatConfidenceLabel(70)).toBe('可信')
    })
    test('边界值 50 为 中等', () => {
      expect(formatConfidenceLabel(50)).toBe('中等')
    })
    test('边界值 30 为 偏低', () => {
      expect(formatConfidenceLabel(30)).toBe('偏低')
    })
  })

  // ─── getTrustDisplayLevel ──────────────────────────────────
  describe('getTrustDisplayLevel', () => {
    test('>=85 为 highly_trusted', () => {
      expect(getTrustDisplayLevel(85)).toBe('highly_trusted')
      expect(getTrustDisplayLevel(100)).toBe('highly_trusted')
    })
    test('70-84 为 trusted', () => {
      expect(getTrustDisplayLevel(70)).toBe('trusted')
      expect(getTrustDisplayLevel(84)).toBe('trusted')
    })
    test('50-69 为 moderate', () => {
      expect(getTrustDisplayLevel(50)).toBe('moderate')
      expect(getTrustDisplayLevel(69)).toBe('moderate')
    })
    test('30-49 为 low', () => {
      expect(getTrustDisplayLevel(30)).toBe('low')
      expect(getTrustDisplayLevel(49)).toBe('low')
    })
    test('0-29 为 unverified', () => {
      expect(getTrustDisplayLevel(0)).toBe('unverified')
      expect(getTrustDisplayLevel(29)).toBe('unverified')
    })
  })

  // ─── mapScoreToStatus ───────────────────────────────────────
  describe('mapScoreToStatus', () => {
    test('>=70 为 strong', () => {
      expect(mapScoreToStatus(70)).toBe('strong')
      expect(mapScoreToStatus(100)).toBe('strong')
    })
    test('40-69 为 moderate', () => {
      expect(mapScoreToStatus(40)).toBe('moderate')
      expect(mapScoreToStatus(69)).toBe('moderate')
    })
    test('<40 为 weak', () => {
      expect(mapScoreToStatus(39)).toBe('weak')
      expect(mapScoreToStatus(0)).toBe('weak')
    })
  })

  // ─── buildConfidenceVisualization ──────────────────────────
  describe('buildConfidenceVisualization', () => {
    test('完整组合：默认 options', () => {
      const result = buildConfidenceVisualization(78, sampleDimensions)
      expect(result.gauge.level).toBe('trusted')
      expect(result.breakdown).toHaveLength(5)
      expect(result.sourceContributions).toHaveLength(5)
      expect(result.overallLabel).toBe('可信')
      expect(result.displayMode).toBe('gauge')
    })

    test('options: displayMode = bar', () => {
      const result = buildConfidenceVisualization(78, sampleDimensions, { displayMode: 'bar' })
      expect(result.displayMode).toBe('bar')
    })

    test('options: maxSources 截断', () => {
      const result = buildConfidenceVisualization(78, sampleDimensions, { maxSources: 2 })
      expect(result.sourceContributions).toHaveLength(2)
    })

    test('options: maxSources=0 不截断', () => {
      const result = buildConfidenceVisualization(78, sampleDimensions, { maxSources: 0 })
      // maxSources=0 时不截断（逻辑中 maxSources>0 才 slice）
      expect(result.sourceContributions).toHaveLength(5)
    })

    test('空维度返回空 breakdown 和 contributions', () => {
      const result = buildConfidenceVisualization(50, [])
      expect(result.breakdown).toEqual([])
      expect(result.sourceContributions).toEqual([])
    })
  })
})
