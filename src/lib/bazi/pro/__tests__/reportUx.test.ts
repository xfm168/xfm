/**
 * V5.0 RC Phase 5 Batch 2 Module I: Report UX Engine 测试
 *
 * 覆盖：buildReadingRhythm、assignRiskColors、generateTrendTimeline、generateTrendSeries、
 *       generateWuXingRadar、generateWuXingEnergyBars、generateWuXingCycle、
 *       generateTenGodRelationGraph、buildFullReportUx、常量验证
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  buildReadingRhythm,
  assignRiskColors,
  generateTrendTimeline,
  generateTrendSeries,
  generateWuXingRadar,
  generateWuXingEnergyBars,
  generateWuXingCycle,
  generateTenGodRelationGraph,
  buildFullReportUx,
  REPORT_UX_ENGINE_VERSION,
} from '../reportUxEngine'

import {
  REPORT_UX_VERSION,
  DEFAULT_REPORT_UX_OPTIONS,
  RISK_COLOR_MAP,
} from '../reportUxTypes'

import type {
  ReadingPhase,
  TrendTimelinePoint,
  TenGodRelationGraphNode,
} from '../reportUxTypes'

// ═══════════════════════════════════════════════════════════════
// 测试数据
// ═══════════════════════════════════════════════════════════════

const sampleSections: Array<{ phase: ReadingPhase; title: string; content: string; sourceModule: string; riskLevel: number }> = [
  { phase: 'suggestion', title: '建议', content: '建议内容', sourceModule: 'fortune', riskLevel: 2 },
  { phase: 'conclusion', title: '结论', content: '总评内容', sourceModule: 'master', riskLevel: 0 },
  { phase: 'reason', title: '论理', content: '论理内容', sourceModule: 'pattern', riskLevel: 1 },
  { phase: 'explanation', title: '解释', content: '解释内容', sourceModule: 'xiyong', riskLevel: 3 },
  { phase: 'classic', title: '古籍', content: '古籍引用', sourceModule: 'classics', riskLevel: 1 },
]

const sampleRisks = [
  { id: 'risk-1', level: 0 },
  { id: 'risk-2', level: 1 },
  { id: 'risk-3', level: 2 },
  { id: 'risk-4', level: 3 },
  { id: 'risk-5', level: 4 },
  { id: 'risk-6', level: 5 },
]

const sampleTimeline: TrendTimelinePoint[] = [
  { ageRange: '0-10', career: 30, wealth: 20, love: 10, health: 90 },
  { ageRange: '11-20', career: 40, wealth: 30, love: 20, health: 85 },
  { ageRange: '21-30', career: 70, wealth: 60, love: 80, health: 80 },
  { ageRange: '31-40', career: 85, wealth: 75, love: 70, health: 70 },
  { ageRange: '41-50', career: 90, wealth: 85, love: 60, health: 60 },
]

const sampleWuXingScores = { '木': 30, '火': 50, '土': 40, '金': 20, '水': 60 }

const sampleTenGodNodes: TenGodRelationGraphNode[] = [
  {
    id: 'tg-1',
    label: '正官',
    category: '十神',
    relations: [
      { from: 'tg-1', to: 'tg-2', type: '生', strength: 0.8 },
    ],
  },
  {
    id: 'tg-2',
    label: '偏官',
    category: '十神',
    relations: [
      { from: 'tg-2', to: 'tg-1', type: '克', strength: 0.6 },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('V5.0 RC Phase 5 Batch 2: Report UX Engine', () => {

  // ─── 常量验证 ───────────────────────────────────────────────
  describe('常量', () => {
    test('REPORT_UX_VERSION 应为 1.0.0', () => {
      expect(REPORT_UX_VERSION).toBe('1.0.0')
    })
    test('REPORT_UX_ENGINE_VERSION 应为 1.0.0', () => {
      expect(REPORT_UX_ENGINE_VERSION).toBe('1.0.0')
    })
    test('DEFAULT_REPORT_UX_OPTIONS 所有字段为 true', () => {
      expect(DEFAULT_REPORT_UX_OPTIONS.includeRhythm).toBe(true)
      expect(DEFAULT_REPORT_UX_OPTIONS.includeRiskColors).toBe(true)
      expect(DEFAULT_REPORT_UX_OPTIONS.includeTimeline).toBe(true)
      expect(DEFAULT_REPORT_UX_OPTIONS.includeWuXingRadar).toBe(true)
      expect(DEFAULT_REPORT_UX_OPTIONS.includeWuXingEnergyBars).toBe(true)
      expect(DEFAULT_REPORT_UX_OPTIONS.includeWuXingCycle).toBe(true)
      expect(DEFAULT_REPORT_UX_OPTIONS.includeTenGodGraph).toBe(true)
    })
    test('DEFAULT_REPORT_UX_OPTIONS maxTimelinePoints 为 12', () => {
      expect(DEFAULT_REPORT_UX_OPTIONS.maxTimelinePoints).toBe(12)
    })
    test('RISK_COLOR_MAP 包含 0~5 的映射', () => {
      expect(RISK_COLOR_MAP[0]).toBe('green')
      expect(RISK_COLOR_MAP[1]).toBe('green')
      expect(RISK_COLOR_MAP[2]).toBe('yellow')
      expect(RISK_COLOR_MAP[3]).toBe('orange')
      expect(RISK_COLOR_MAP[4]).toBe('red')
      expect(RISK_COLOR_MAP[5]).toBe('red')
    })
  })

  // ─── buildReadingRhythm ────────────────────────────────────
  describe('buildReadingRhythm', () => {
    test('按 phase 正确排序', () => {
      const result = buildReadingRhythm(sampleSections)
      expect(result).toHaveLength(5)
      expect(result[0].phase).toBe('conclusion')
      expect(result[1].phase).toBe('reason')
      expect(result[2].phase).toBe('classic')
      expect(result[3].phase).toBe('explanation')
      expect(result[4].phase).toBe('suggestion')
    })

    test('riskColor 正确映射', () => {
      const result = buildReadingRhythm(sampleSections)
      // conclusion riskLevel=0 -> green
      expect(result[0].riskColor).toBe('green')
      // explanation riskLevel=3 -> orange
      expect(result[3].riskColor).toBe('orange')
      // suggestion riskLevel=2 -> yellow
      expect(result[4].riskColor).toBe('yellow')
    })

    test('保留所有字段', () => {
      const result = buildReadingRhythm(sampleSections)
      const first = result[0]
      expect(first.title).toBe('结论')
      expect(first.content).toBe('总评内容')
      expect(first.sourceModule).toBe('master')
      expect(typeof first.order).toBe('number')
    })

    test('空输入返回空数组', () => {
      const result = buildReadingRhythm([])
      expect(result).toEqual([])
    })
  })

  // ─── assignRiskColors ─────────────────────────────────────
  describe('assignRiskColors', () => {
    test('各 riskLevel 正确映射', () => {
      const result = assignRiskColors(sampleRisks)
      expect(result['risk-1']).toBe('green')
      expect(result['risk-2']).toBe('green')
      expect(result['risk-3']).toBe('yellow')
      expect(result['risk-4']).toBe('orange')
      expect(result['risk-5']).toBe('red')
      expect(result['risk-6']).toBe('red')
    })

    test('空输入返回空对象', () => {
      const result = assignRiskColors([])
      expect(result).toEqual({})
    })
  })

  // ─── generateTrendTimeline ────────────────────────────────
  describe('generateTrendTimeline', () => {
    test('返回验证后的数据', () => {
      const result = generateTrendTimeline(sampleTimeline)
      expect(result).toHaveLength(5)
    })

    test('截断到 maxTimelinePoints', () => {
      const result = generateTrendTimeline(sampleTimeline, 3)
      expect(result).toHaveLength(3)
    })

    test('过滤不完整数据（空 ageRange）', () => {
      const invalidPoint: TrendTimelinePoint = { ageRange: '', career: 50, wealth: 50, love: 50, health: 50 }
      const result = generateTrendTimeline([...sampleTimeline, invalidPoint])
      expect(result).toHaveLength(5)
    })

    test('过滤超出范围的数据', () => {
      const outOfRange: TrendTimelinePoint = { ageRange: 'invalid', career: 150, wealth: 50, love: 50, health: 50 }
      const result = generateTrendTimeline([outOfRange])
      expect(result).toHaveLength(0)
    })

    test('空输入返回空数组', () => {
      const result = generateTrendTimeline([])
      expect(result).toEqual([])
    })
  })

  // ─── generateTrendSeries ──────────────────────────────────
  describe('generateTrendSeries', () => {
    test('返回 4 条趋势线', () => {
      const result = generateTrendSeries(sampleTimeline)
      expect(result).toHaveLength(4)
    })

    test('每条线有 name/color/symbol/data', () => {
      const result = generateTrendSeries(sampleTimeline)
      for (const series of result) {
        expect(series.name).toBeTruthy()
        expect(series.color).toMatch(/^#[0-9a-f]{6}$/)
        expect(series.symbol).toBeTruthy()
        expect(Array.isArray(series.data)).toBe(true)
        expect(series.data).toHaveLength(5)
      }
    })

    test('career 趋势线名称为 事业运', () => {
      const result = generateTrendSeries(sampleTimeline)
      expect(result[0].name).toBe('事业运')
      expect(result[0].data).toEqual([30, 40, 70, 85, 90])
    })

    test('空输入返回 4 条空线', () => {
      const result = generateTrendSeries([])
      expect(result).toHaveLength(4)
      expect(result[0].data).toEqual([])
    })
  })

  // ─── generateWuXingRadar ─────────────────────────────────
  describe('generateWuXingRadar', () => {
    test('返回 5 个元素', () => {
      const result = generateWuXingRadar(sampleWuXingScores)
      expect(result).toHaveLength(5)
    })

    test('最高分归一化为 100', () => {
      const result = generateWuXingRadar(sampleWuXingScores)
      // 最高分 水=60 应归一化为 100
      const water = result.find((r) => r.element === '水')
      expect(water?.value).toBe(100)
    })

    test('每个元素有颜色', () => {
      const result = generateWuXingRadar(sampleWuXingScores)
      for (const item of result) {
        expect(item.color).toMatch(/^#[0-9a-f]{6}$/)
        expect(item.label).toBeTruthy()
      }
    })

    test('缺失元素补 0', () => {
      const result = generateWuXingRadar({ '木': 50 })
      expect(result).toHaveLength(5)
      const fire = result.find((r) => r.element === '火')
      expect(fire?.value).toBe(0)
    })

    test('空输入所有值归一化为 0', () => {
      const result = generateWuXingRadar({})
      for (const item of result) {
        expect(item.value).toBe(0)
      }
    })
  })

  // ─── generateWuXingEnergyBars ─────────────────────────────
  describe('generateWuXingEnergyBars', () => {
    test('返回 5 个能量条', () => {
      const result = generateWuXingEnergyBars(sampleWuXingScores)
      expect(result).toHaveLength(5)
    })

    test('rawScore 保留原值', () => {
      const result = generateWuXingEnergyBars(sampleWuXingScores)
      const wood = result.find((r) => r.element === '木')
      expect(wood?.rawScore).toBe(30)
    })

    test('normalizedScore 归一化', () => {
      const result = generateWuXingEnergyBars(sampleWuXingScores)
      const water = result.find((r) => r.element === '水')
      expect(water?.normalizedScore).toBe(100)
    })

    test('polarity 判定', () => {
      const result = generateWuXingEnergyBars(sampleWuXingScores)
      for (const bar of result) {
        expect(['productive', 'exhaustive']).toContain(bar.polarity)
      }
    })

    test('高分元素为 productive，低分为 exhaustive', () => {
      const result = generateWuXingEnergyBars(sampleWuXingScores)
      // max=60, half=30; 木=30 >= 30 -> productive, 金=20 < 30 -> exhaustive
      const wood = result.find((r) => r.element === '木')
      const metal = result.find((r) => r.element === '金')
      expect(wood?.polarity).toBe('productive')
      expect(metal?.polarity).toBe('exhaustive')
    })
  })

  // ─── generateWuXingCycle ──────────────────────────────────
  describe('generateWuXingCycle', () => {
    test('返回 5 个节点', () => {
      const result = generateWuXingCycle()
      expect(result).toHaveLength(5)
    })

    test('包含木火土金水', () => {
      const result = generateWuXingCycle()
      const elements = result.map((n) => n.element)
      expect(elements).toEqual(['木', '火', '土', '金', '水'])
    })

    test('木的 targets 包含火和土（生+克）', () => {
      const result = generateWuXingCycle()
      const wood = result.find((n) => n.element === '木')
      expect(wood?.targets).toContain('火')
      expect(wood?.targets).toContain('土')
    })

    test('火的 targets 包含土和金', () => {
      const result = generateWuXingCycle()
      const fire = result.find((n) => n.element === '火')
      expect(fire?.targets).toContain('土')
      expect(fire?.targets).toContain('金')
    })

    test('每个节点有 role 和 targets', () => {
      const result = generateWuXingCycle()
      for (const node of result) {
        expect(['productive', 'weakening']).toContain(node.role)
        expect(node.targets.length).toBeGreaterThanOrEqual(1)
      }
    })
  })

  // ─── generateTenGodRelationGraph ──────────────────────────
  describe('generateTenGodRelationGraph', () => {
    test('验证并标准化节点', () => {
      const result = generateTenGodRelationGraph(sampleTenGodNodes)
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('tg-1')
      expect(result[0].label).toBe('正官')
    })

    test('过滤空 from/to 的关系', () => {
      const nodesWithInvalid: TenGodRelationGraphNode[] = [
        {
          id: 'tg-x',
          label: '测试',
          category: '十神',
          relations: [
            { from: '', to: 'tg-y', type: '生', strength: 0.5 },
            { from: 'tg-x', to: '', type: '克', strength: 0.5 },
          ],
        },
      ]
      const result = generateTenGodRelationGraph(nodesWithInvalid)
      expect(result[0].relations).toHaveLength(0)
    })

    test('strength 超范围被 clamp', () => {
      const nodesWithOverflow: TenGodRelationGraphNode[] = [
        {
          id: 'tg-z',
          label: '溢出',
          category: '十神',
          relations: [
            { from: 'tg-z', to: 'tg-w', type: '合', strength: 1.5 },
          ],
        },
      ]
      const result = generateTenGodRelationGraph(nodesWithOverflow)
      expect(result[0].relations[0].strength).toBe(1)
    })

    test('空输入返回空数组', () => {
      const result = generateTenGodRelationGraph([])
      expect(result).toEqual([])
    })
  })

  // ─── buildFullReportUx ───────────────────────────────────
  describe('buildFullReportUx', () => {
    test('组合测试：所有部分都生成', () => {
      const result = buildFullReportUx({
        rhythmInput: sampleSections,
        risks: sampleRisks,
        timeline: sampleTimeline,
        wuXingScores: sampleWuXingScores,
        tenGodNodes: sampleTenGodNodes,
      })
      expect(result.rhythm.length).toBeGreaterThan(0)
      expect(Object.keys(result.riskColors).length).toBe(6)
      expect(result.timeline.length).toBe(5)
      expect(result.radar.length).toBe(5)
      expect(result.energyBars.length).toBe(5)
      expect(result.cycle.length).toBe(5)
      expect(result.tenGodGraph.length).toBe(2)
    })

    test('options 过滤：关闭 rhythm', () => {
      const result = buildFullReportUx({
        rhythmInput: sampleSections,
        risks: sampleRisks,
        timeline: sampleTimeline,
        wuXingScores: sampleWuXingScores,
        tenGodNodes: sampleTenGodNodes,
      }, { includeRhythm: false })
      expect(result.rhythm).toEqual([])
      expect(result.radar.length).toBe(5)
    })

    test('options 过滤：关闭所有', () => {
      const result = buildFullReportUx({
        rhythmInput: sampleSections,
        risks: sampleRisks,
        timeline: sampleTimeline,
        wuXingScores: sampleWuXingScores,
        tenGodNodes: sampleTenGodNodes,
      }, {
        includeRhythm: false,
        includeRiskColors: false,
        includeTimeline: false,
        includeWuXingRadar: false,
        includeWuXingEnergyBars: false,
        includeWuXingCycle: false,
        includeTenGodGraph: false,
      })
      expect(result.rhythm).toEqual([])
      expect(result.riskColors).toEqual({})
      expect(result.timeline).toEqual([])
      expect(result.radar).toEqual([])
      expect(result.energyBars).toEqual([])
      expect(result.cycle).toEqual([])
      expect(result.tenGodGraph).toEqual([])
    })

    test('maxTimelinePoints 自定义截断', () => {
      const result = buildFullReportUx({
        rhythmInput: sampleSections,
        risks: sampleRisks,
        timeline: sampleTimeline,
        wuXingScores: sampleWuXingScores,
        tenGodNodes: sampleTenGodNodes,
      }, { maxTimelinePoints: 2 })
      expect(result.timeline).toHaveLength(2)
    })
  })
})
