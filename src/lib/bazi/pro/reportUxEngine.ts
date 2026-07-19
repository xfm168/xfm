/**
 * V5.0 RC Phase 5 Batch 2 Module I: Report UX Engine
 *
 * 职责：纯数据转换，将结构化数据转换为报告 UX 所需的可视化数据结构
 * 约束：不依赖实际引擎输出，不直接 import 现有引擎运行时函数
 */

import type {
  RiskColor,
  ReadingPhase,
  ReadingRhythmSection,
  TrendTimelinePoint,
  TrendTimelineSeries,
  WuXingRadarData,
  WuXingEnergyBar,
  WuXingCycleNode,
  TenGodRelationGraphNode,
  TenGodRelationEdge,
  ReportUxOutput,
  ReportUxOptions,
} from './reportUxTypes'

import {
  REPORT_UX_VERSION,
  DEFAULT_REPORT_UX_OPTIONS,
  RISK_COLOR_MAP,
} from './reportUxTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

export const REPORT_UX_ENGINE_VERSION = '1.0.0'

// ═══════════════════════════════════════════════════════════
// 常量
// ═══════════════════════════════════════════════════════════

const PHASE_ORDER: Record<ReadingPhase, number> = {
  conclusion: 0,
  reason: 1,
  classic: 2,
  explanation: 3,
  suggestion: 4,
}

const WU_XING_ELEMENTS = ['木', '火', '土', '金', '水']

const WU_XING_COLORS: Record<string, string> = {
  '木': '#22c55e',
  '火': '#ef4444',
  '土': '#eab308',
  '金': '#f59e0b',
  '水': '#3b82f6',
}

const WU_XING_LABELS: Record<string, string> = {
  '木': '木（生机）',
  '火': '火（热情）',
  '土': '土（稳重）',
  '金': '金（果断）',
  '水': '水（智慧）',
}

// 五行相生关系
const PRODUCTIVE_CYCLE: Array<{ from: string; to: string }> = [
  { from: '木', to: '火' },
  { from: '火', to: '土' },
  { from: '土', to: '金' },
  { from: '金', to: '水' },
  { from: '水', to: '木' },
]

// 五行相克关系
const WEAKENING_CYCLE: Array<{ from: string; to: string }> = [
  { from: '木', to: '土' },
  { from: '土', to: '水' },
  { from: '水', to: '火' },
  { from: '火', to: '金' },
  { from: '金', to: '木' },
]

const TREND_SERIES_CONFIG: Array<{ name: string; color: string; symbol: string; key: keyof Omit<TrendTimelinePoint, 'ageRange'> }> = [
  { name: '事业运', color: '#3b82f6', symbol: 'circle', key: 'career' },
  { name: '财运', color: '#eab308', symbol: 'diamond', key: 'wealth' },
  { name: '感情运', color: '#ec4899', symbol: 'heart', key: 'love' },
  { name: '健康运', color: '#22c55e', symbol: 'square', key: 'health' },
]

// ═══════════════════════════════════════════════════════════
// 内部辅助
// ═══════════════════════════════════════════════════════════

function mapRiskLevelToColor(level: number): RiskColor {
  const clamped = Math.max(0, Math.min(5, Math.round(level)))
  return RISK_COLOR_MAP[clamped] ?? 'green'
}

function clampScore(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function normalizeScore(raw: number, maxRaw: number): number {
  if (maxRaw <= 0) return 0
  return clampScore(Math.round((raw / maxRaw) * 100), 0, 100)
}

// ═══════════════════════════════════════════════════════════
// 公开函数
// ═══════════════════════════════════════════════════════════

/**
 * 将扁平段落数据按 phase 排序并附加 riskColor
 */
export function buildReadingRhythm(
  sections: Array<{ phase: ReadingPhase; title: string; content: string; sourceModule: string; riskLevel: number }>,
): ReadingRhythmSection[] {
  return sections
    .map((s, idx) => ({
      phase: s.phase,
      title: s.title,
      content: s.content,
      sourceModule: s.sourceModule,
      riskColor: mapRiskLevelToColor(s.riskLevel),
      order: PHASE_ORDER[s.phase] * 1000 + idx,
    }))
    .sort((a, b) => a.order - b.order)
}

/**
 * 将 riskLevel 数组映射为颜色字典
 */
export function assignRiskColors(
  risks: Array<{ id: string; level: number }>,
): Record<string, RiskColor> {
  const result: Record<string, RiskColor> = {}
  for (const r of risks) {
    result[r.id] = mapRiskLevelToColor(r.level)
  }
  return result
}

/**
 * 验证数据完整性，截断到 maxTimelinePoints
 */
export function generateTrendTimeline(
  points: TrendTimelinePoint[],
  maxPoints: number = 12,
): TrendTimelinePoint[] {
  const validated = points.filter(
    (p) =>
      p.ageRange !== '' &&
      p.career >= 0 && p.career <= 100 &&
      p.wealth >= 0 && p.wealth <= 100 &&
      p.love >= 0 && p.love <= 100 &&
      p.health >= 0 && p.health <= 100,
  )
  return validated.slice(0, maxPoints)
}

/**
 * 返回 4 条趋势线（career/wealth/love/health）
 */
export function generateTrendSeries(
  points: TrendTimelinePoint[],
): TrendTimelineSeries[] {
  return TREND_SERIES_CONFIG.map((cfg) => ({
    name: cfg.name,
    color: cfg.color,
    symbol: cfg.symbol,
    data: points.map((p) => p[cfg.key]),
  }))
}

/**
 * 接受 {木: 30, 火: 50, ...}，归一化到 0~100，赋颜色
 */
export function generateWuXingRadar(
  scores: Record<string, number>,
): WuXingRadarData[] {
  const maxRaw = Math.max(...WU_XING_ELEMENTS.map((e) => scores[e] ?? 0), 1)
  return WU_XING_ELEMENTS.map((element) => {
    const raw = scores[element] ?? 0
    return {
      element,
      value: normalizeScore(raw, maxRaw),
      label: WU_XING_LABELS[element],
      color: WU_XING_COLORS[element],
    }
  })
}

/**
 * rawScore 直接映射，polarity 基于生克关系
 */
export function generateWuXingEnergyBars(
  scores: Record<string, number>,
): WuXingEnergyBar[] {
  const maxRaw = Math.max(...WU_XING_ELEMENTS.map((e) => scores[e] ?? 0), 1)
  return WU_XING_ELEMENTS.map((element) => {
    const rawScore = scores[element] ?? 0
    // 判断该元素的极性：如果对后续元素有相生关系则偏 productive，有相克则偏 exhaustive
    const hasProductive = PRODUCTIVE_CYCLE.some((c) => c.from === element)
    const hasWeakening = WEAKENING_CYCLE.some((c) => c.from === element)
    // 每个元素既有相生也有相克，以分值高低判定极性倾向
    const polarity: 'productive' | 'exhaustive' = rawScore >= maxRaw * 0.5 ? 'productive' : 'exhaustive'
    return {
      element,
      rawScore,
      normalizedScore: normalizeScore(rawScore, maxRaw),
      polarity,
    }
  })
}

/**
 * 返回固定五行循环关系（木生火、火生土... 木克土、土克水...）
 */
export function generateWuXingCycle(): WuXingCycleNode[] {
  const nodes: WuXingCycleNode[] = WU_XING_ELEMENTS.map((element) => ({
    element,
    role: 'productive',
    targets: [] as string[],
  }))

  // 构建相生关系
  for (const rel of PRODUCTIVE_CYCLE) {
    const node = nodes.find((n) => n.element === rel.from)
    if (node) {
      node.role = 'productive'
      node.targets.push(rel.to)
    }
  }

  // 构建相克关系
  for (const rel of WEAKENING_CYCLE) {
    const node = nodes.find((n) => n.element === rel.from)
    if (node) {
      // 同一元素同时有生和克关系，保留 targets
      if (!node.targets.includes(rel.to)) {
        node.targets.push(rel.to)
      }
      // 如果已经有 productive 关系，标注 weakening 也存在
      // 这里简化为如果目标不在 productive 中则添加
    }
  }

  return nodes
}

/**
 * 验证并标准化十神关系图数据
 */
export function generateTenGodRelationGraph(
  nodes: TenGodRelationGraphNode[],
): TenGodRelationGraphNode[] {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    category: node.category,
    relations: node.relations
      .filter((r: TenGodRelationEdge) => r.from !== '' && r.to !== '')
      .map((r: TenGodRelationEdge) => ({
        from: r.from,
        to: r.to,
        type: r.type,
        strength: clampScore(r.strength, 0, 1),
      })),
  }))
}

/**
 * 组合函数
 */
export function buildFullReportUx(
  input: {
    rhythmInput: Array<{ phase: ReadingPhase; title: string; content: string; sourceModule: string; riskLevel: number }>
    risks: Array<{ id: string; level: number }>
    timeline: TrendTimelinePoint[]
    wuXingScores: Record<string, number>
    tenGodNodes: TenGodRelationGraphNode[]
  },
  options?: Partial<ReportUxOptions>,
): ReportUxOutput {
  const opts: ReportUxOptions = { ...DEFAULT_REPORT_UX_OPTIONS, ...options }

  return {
    rhythm: opts.includeRhythm ? buildReadingRhythm(input.rhythmInput) : [],
    riskColors: opts.includeRiskColors ? assignRiskColors(input.risks) : {},
    timeline: opts.includeTimeline ? generateTrendTimeline(input.timeline, opts.maxTimelinePoints) : [],
    radar: opts.includeWuXingRadar ? generateWuXingRadar(input.wuXingScores) : [],
    energyBars: opts.includeWuXingEnergyBars ? generateWuXingEnergyBars(input.wuXingScores) : [],
    cycle: opts.includeWuXingCycle ? generateWuXingCycle() : [],
    tenGodGraph: opts.includeTenGodGraph ? generateTenGodRelationGraph(input.tenGodNodes) : [],
  }
}
