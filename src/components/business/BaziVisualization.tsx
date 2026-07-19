/**
 * BaziVisualization - 八字可视化升级组件库
 * 玄风门 V4.2
 *
 * 包含 5 个独立子组件，全部使用内联 SVG，不依赖外部图表库。
 * 使用 React Hooks（useMemo, useCallback）优化渲染性能。
 * 支持传入 className 进行自定义样式。
 */

import React, { useMemo, useCallback, useState } from 'react'
import './BaziVisualization.css'

// ============================================================
// 1. 五行能量环（SVG 圆环图）
// ============================================================

/** 五行颜色配置 */
const FIVE_ELEMENT_COLORS: Record<string, { main: string; light: string; label: string }> = {
  '金': { main: '#C0C0C0', light: '#E8E8E8', label: '金' },
  '木': { main: '#2E8B57', light: '#90EE90', label: '木' },
  '水': { main: '#1E90FF', light: '#87CEEB', label: '水' },
  '火': { main: '#DC143C', light: '#FF6B6B', label: '火' },
  '土': { main: '#DAA520', light: '#FFD700', label: '土' },
}

/** 五行标准顺序 */
const ELEMENT_ORDER = ['木', '火', '土', '金', '水']

interface FiveElementRingProps {
  fiveElementCount: { [key: string]: number }
  dayMasterElement?: string
  className?: string
  size?: number
}

/**
 * 五行能量环
 *
 * SVG 圆环图，展示金木水火土五行分布。
 * 中心显示日主五行，鼠标悬停显示具体数量和百分比。
 */
export function FiveElementRing({
  fiveElementCount,
  dayMasterElement,
  className = '',
  size = 240,
}: FiveElementRingProps): JSX.Element {
  const [hoveredElement, setHoveredElement] = useState<string | null>(null)

  const elements = useMemo(() => {
    const total = Object.values(fiveElementCount).reduce((a, b) => a + b, 0)
    return ELEMENT_ORDER.map(name => ({
      name,
      value: fiveElementCount[name] ?? 0,
      percentage: total > 0 ? ((fiveElementCount[name] ?? 0) / total) * 100 : 0,
      color: FIVE_ELEMENT_COLORS[name]?.main || '#999',
      lightColor: FIVE_ELEMENT_COLORS[name]?.light || '#ccc',
    }))
  }, [fiveElementCount])

  const total = useMemo(
    () => Object.values(fiveElementCount).reduce((a, b) => a + b, 0),
    [fiveElementCount]
  )

  // 计算弧形路径
  const arcs = useMemo(() => {
    const cx = size / 2
    const cy = size / 2
    const outerR = size / 2 - 10
    const innerR = outerR - 30
    const gap = 3 // 间隔角度
    const totalGap = gap * elements.length
    const availableAngle = 360 - totalGap
    let currentAngle = -90 // 从顶部开始

    return elements.map(el => {
      const sweepAngle = total > 0 ? (el.percentage / 100) * availableAngle : availableAngle / 5
      const startAngle = currentAngle + gap / 2
      const endAngle = startAngle + sweepAngle
      currentAngle = endAngle + gap / 2

      const startRad = (startAngle * Math.PI) / 180
      const endRad = (endAngle * Math.PI) / 180

      const x1o = cx + outerR * Math.cos(startRad)
      const y1o = cy + outerR * Math.sin(startRad)
      const x2o = cx + outerR * Math.cos(endRad)
      const y2o = cy + outerR * Math.sin(endRad)
      const x1i = cx + innerR * Math.cos(endRad)
      const y1i = cy + innerR * Math.sin(endRad)
      const x2i = cx + innerR * Math.cos(startRad)
      const y2i = cy + innerR * Math.sin(startRad)

      const largeArc = sweepAngle > 180 ? 1 : 0

      const d = [
        `M ${x1o} ${y1o}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
        `L ${x1i} ${y1i}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i}`,
        'Z',
      ].join(' ')

      // 弧段中点角度（用于放置标签）
      const midAngle = (startAngle + endAngle) / 2
      const midRad = (midAngle * Math.PI) / 180
      const labelR = (outerR + innerR) / 2
      const labelX = cx + labelR * Math.cos(midRad)
      const labelY = cy + labelR * Math.sin(midRad)

      return { ...el, d, labelX, labelY, startAngle, endAngle }
    })
  }, [elements, total, size])

  const handleMouseEnter = useCallback((name: string) => setHoveredElement(name), [])
  const handleMouseLeave = useCallback(() => setHoveredElement(null), [])

  const classes = ['bazi-viz-ring', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <h3 className="bazi-viz-title">五行能量环</h3>
      <p className="bazi-viz-desc">展示命局中金木水火土五行的力量分布，面积按比例显示</p>
      <div className="bazi-viz-ring__container">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="bazi-viz-ring__svg"
          role="img"
          aria-label="五行能量环图"
        >
          {/* 弧形段 */}
          {arcs.map(arc => (
            <g
              key={arc.name}
              onMouseEnter={() => handleMouseEnter(arc.name)}
              onMouseLeave={handleMouseLeave}
              className="bazi-viz-ring__arc-group"
              style={{ cursor: 'pointer' }}
            >
              <path
                d={arc.d}
                fill={arc.color}
                opacity={hoveredElement === null || hoveredElement === arc.name ? 1 : 0.35}
                className="bazi-viz-ring__arc"
              >
                <title>
                  {arc.name}：数量 {arc.value}，占比 {arc.percentage.toFixed(1)}%
                </title>
              </path>
              {arc.percentage > 8 && (
                <text
                  x={arc.labelX}
                  y={arc.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="bazi-viz-ring__arc-label"
                  fontSize={size < 200 ? 10 : 12}
                  fill="#fff"
                >
                  {arc.name}
                </text>
              )}
            </g>
          ))}

          {/* 中心文字 */}
          {dayMasterElement && (
            <>
              <text
                x={size / 2}
                y={size / 2 - 8}
                textAnchor="middle"
                className="bazi-viz-ring__center-element"
                fontSize={size < 200 ? 18 : 22}
                fill={FIVE_ELEMENT_COLORS[dayMasterElement]?.main || '#333'}
              >
                {dayMasterElement}
              </text>
              <text
                x={size / 2}
                y={size / 2 + 14}
                textAnchor="middle"
                className="bazi-viz-ring__center-label"
                fontSize={size < 200 ? 10 : 12}
                fill="#999"
              >
                日主五行
              </text>
            </>
          )}
        </svg>

        {/* 悬停详情浮层 */}
        {hoveredElement && (
          <div className="bazi-viz-ring__tooltip">
            <span className="bazi-viz-ring__tooltip-name">{hoveredElement}</span>
            <span className="bazi-viz-ring__tooltip-value">
              数量：{fiveElementCount[hoveredElement] ?? 0}
            </span>
            <span className="bazi-viz-ring__tooltip-pct">
              占比：{total > 0 ? (((fiveElementCount[hoveredElement] ?? 0) / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        )}
      </div>

      {/* 图例 */}
      <div className="bazi-viz-ring__legend">
        {elements.map(el => (
          <div key={el.name} className="bazi-viz-ring__legend-item">
            <span
              className="bazi-viz-ring__legend-dot"
              style={{ backgroundColor: el.color }}
            />
            <span className="bazi-viz-ring__legend-label">{el.name}</span>
            <span className="bazi-viz-ring__legend-value">{el.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 2. 十神占比图（水平条形图）
// ============================================================

/** 十神颜色映射 */
const SHISHEN_COLORS: Record<string, string> = {
  '比肩': '#7B8FA1',
  '劫财': '#8B3A3A',
  '食神': '#6BCB77',
  '伤官': '#FF8C42',
  '偏财': '#F5C542',
  '正财': '#A0724A',
  '七杀': '#B22222',
  '正官': '#1B3A6B',
  '偏印': '#9370DB',
  '正印': '#4169E1',
}

interface ShenShiDistributionProps {
  shiShenData: Record<string, number>
  className?: string
}

/**
 * 十神占比图
 *
 * 水平条形图，展示 10 种十神力量分布，按数量排序。
 * 不同颜色区分十神类型。
 */
export function ShenShiDistribution({
  shiShenData,
  className = '',
}: ShenShiDistributionProps): JSX.Element {
  const sortedData = useMemo(() => {
    return Object.entries(shiShenData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [shiShenData])

  const maxValue = useMemo(
    () => Math.max(...sortedData.map(d => d.value), 1),
    [sortedData]
  )

  const barWidth = useCallback(
    (value: number) => (value / maxValue) * 100,
    [maxValue]
  )

  const classes = ['bazi-viz-shishen', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <h3 className="bazi-viz-title">十神占比图</h3>
      <p className="bazi-viz-desc">十种十神力量分布，按数值降序排列</p>
      <div className="bazi-viz-shishen__bars">
        {sortedData.map(item => (
          <div key={item.name} className="bazi-viz-shishen__row">
            <span className="bazi-viz-shishen__name">{item.name}</span>
            <div className="bazi-viz-shishen__track">
              <div
                className="bazi-viz-shishen__fill"
                style={{
                  width: `${barWidth(item.value)}%`,
                  backgroundColor: SHISHEN_COLORS[item.name] || '#888',
                }}
              >
                <span className="bazi-viz-shishen__fill-text">{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================
// 3. 大运时间轴（SVG 水平时间线）
// ============================================================

interface DaYunStep {
  startAge: number
  endAge: number
  ganZhi: string
  isXi?: boolean
  score?: number
}

interface DaYunTimelineProps {
  steps: DaYunStep[]
  currentAge?: number
  className?: string
}

/**
 * 大运时间轴
 *
 * SVG 水平时间线，每步大运一个节点。
 * 节点颜色根据喜忌：喜=金色、忌=灰色、中性=白色。
 * 当前大运高亮，悬停显示详情。
 */
export function DaYunTimeline({
  steps,
  currentAge,
  className = '',
}: DaYunTimelineProps): JSX.Element {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const svgWidth = useMemo(() => Math.max(800, steps.length * 120 + 40), [steps.length])
  const svgHeight = 160

  const nodes = useMemo(() => {
    const padding = 40
    const usableWidth = svgWidth - padding * 2
    const spacing = steps.length > 1 ? usableWidth / (steps.length - 1) : usableWidth / 2

    return steps.map((step, i) => {
      const x = steps.length > 1 ? padding + i * spacing : svgWidth / 2
      const isCurrent = currentAge != null && currentAge >= step.startAge && currentAge <= step.endAge
      const color = step.isXi ? '#D4AF37' : step.score != null && step.score < 40 ? '#888' : '#ccc'
      return { ...step, x, isCurrent, color, index: i }
    })
  }, [steps, currentAge, svgWidth])

  const handleMouseEnter = useCallback((i: number) => setHoveredIndex(i), [])
  const handleMouseLeave = useCallback(() => setHoveredIndex(null), [])

  const classes = ['bazi-viz-dayun', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <h3 className="bazi-viz-title">大运时间轴</h3>
      <p className="bazi-viz-desc">展示命主一生大运走势，金色=喜运，灰色=忌运，白色=中性</p>
      <div className="bazi-viz-dayun__container" style={{ overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="bazi-viz-dayun__svg"
          role="img"
          aria-label="大运时间轴"
        >
          {/* 连接线 */}
          {nodes.length > 1 && (
            <line
              x1={nodes[0].x}
              y1={svgHeight / 2 - 20}
              x2={nodes[nodes.length - 1].x}
              y2={svgHeight / 2 - 20}
              className="bazi-viz-dayun__line"
              stroke="#ddd"
              strokeWidth={2}
            />
          )}

          {/* 节点 */}
          {nodes.map((node) => (
            <g
              key={node.index}
              onMouseEnter={() => handleMouseEnter(node.index)}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: 'pointer' }}
            >
              <title>
                {node.ganZhi}（{node.startAge}~{node.endAge}岁）
                {node.score != null ? ` 评分：${node.score}` : ''}
                {node.isXi ? ' 喜运' : node.score != null && node.score < 40 ? ' 忌运' : ' 中性'}
              </title>
              {/* 外圈（当前大运高亮） */}
              {node.isCurrent && (
                <circle
                  cx={node.x}
                  cy={svgHeight / 2 - 20}
                  r={18}
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth={3}
                  className="bazi-viz-dayun__highlight"
                />
              )}
              {/* 节点圆 */}
              <circle
                cx={node.x}
                cy={svgHeight / 2 - 20}
                r={node.isCurrent ? 14 : 10}
                fill={node.color}
                stroke="#fff"
                strokeWidth={2}
                className="bazi-viz-dayun__node"
              />
              {/* 干支文字 */}
              <text
                x={node.x}
                y={svgHeight / 2 - 20}
                textAnchor="middle"
                dominantBaseline="central"
                className="bazi-viz-dayun__node-text"
                fontSize={10}
                fill="#333"
              >
                {node.ganZhi}
              </text>
              {/* 年龄文字 */}
              <text
                x={node.x}
                y={svgHeight / 2 + 16}
                textAnchor="middle"
                className="bazi-viz-dayun__age-text"
                fontSize={10}
                fill="#666"
              >
                {node.startAge}~{node.endAge}岁
              </text>
              {/* 评分文字 */}
              {node.score != null && (
                <text
                  x={node.x}
                  y={svgHeight / 2 + 32}
                  textAnchor="middle"
                  className="bazi-viz-dayun__score-text"
                  fontSize={9}
                  fill={node.isXi ? '#B8860B' : '#999'}
                >
                  {node.score}分
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* 悬停详情 */}
      {hoveredIndex != null && hoveredIndex < nodes.length && (
        <div className="bazi-viz-dayun__tooltip">
          <div className="bazi-viz-dayun__tooltip-header">{nodes[hoveredIndex].ganZhi}</div>
          <div className="bazi-viz-dayun__tooltip-age">
            {nodes[hoveredIndex].startAge}岁 ~ {nodes[hoveredIndex].endAge}岁
          </div>
          {nodes[hoveredIndex].score != null && (
            <div className="bazi-viz-dayun__tooltip-score">
              运势评分：{nodes[hoveredIndex].score}
            </div>
          )}
          <div className="bazi-viz-dayun__tooltip-type">
            {nodes[hoveredIndex].isXi ? '喜运' : nodes[hoveredIndex].score != null && nodes[hoveredIndex].score < 40 ? '忌运' : '中性'}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// 4. 人生运势曲线（SVG 折线图）
// ============================================================

interface LifeFortunePoint {
  age: number
  score: number
  label?: string
}

interface LifeFortuneCurveProps {
  data: LifeFortunePoint[]
  className?: string
}

/**
 * 人生运势曲线
 *
 * SVG 折线图，X轴=年龄，Y轴=运势分数。
 * 使用贝塞尔曲线实现平滑效果，带阴影填充和关键年份标注。
 */
export function LifeFortuneCurve({
  data,
  className = '',
}: LifeFortuneCurveProps): JSX.Element {
  const svgWidth = 700
  const svgHeight = 300
  const padding = { top: 30, right: 30, bottom: 40, left: 50 }

  const { points, curvePath, areaPath, xScale, yScale, yTicks } = useMemo(() => {
    if (data.length === 0) {
      return { points: [], curvePath: '', areaPath: '', xScale: (_: number) => 0, yScale: (_: number) => 0, yTicks: [] }
    }

    const plotW = svgWidth - padding.left - padding.right
    const plotH = svgHeight - padding.top - padding.bottom
    const ages = data.map(d => d.age)
    const scores = data.map(d => d.score)
    const minAge = Math.min(...ages)
    const maxAge = Math.max(...ages)
    const ageRange = maxAge - minAge || 1

    const xS = (age: number) => padding.left + ((age - minAge) / ageRange) * plotW
    const yS = (score: number) => padding.top + plotH - (Math.max(0, Math.min(100, score)) / 100) * plotH

    const pts = data.map(d => ({ x: xS(d.age), y: yS(d.score), ...d }))

    // 贝塞尔平滑路径
    let curve = ''
    if (pts.length >= 2) {
      curve = `M ${pts[0].x} ${pts[0].y}`
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)]
        const p1 = pts[i]
        const p2 = pts[Math.min(i + 1, pts.length - 1)]
        const p3 = pts[Math.min(i + 2, pts.length - 1)]
        const tension = 0.3
        const cp1x = p1.x + (p2.x - p0.x) * tension
        const cp1y = p1.y + (p2.y - p0.y) * tension
        const cp2x = p2.x - (p3.x - p1.x) * tension
        const cp2y = p2.y - (p3.y - p1.y) * tension
        curve += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`
      }
    }

    // 阴影填充区域
    const bottomY = padding.top + plotH
    const area = curve + ` L ${pts[pts.length - 1].x} ${bottomY} L ${pts[0].x} ${bottomY} Z`

    // Y 轴刻度
    const ticks = [0, 25, 50, 75, 100]

    return {
      points: pts,
      curvePath: curve,
      areaPath: area,
      xScale: xS,
      yScale: yS,
      yTicks: ticks,
    }
  }, [data])

  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

  const classes = ['bazi-viz-curve', className].filter(Boolean).join(' ')

  if (data.length === 0) {
    return (
      <div className={classes}>
        <h3 className="bazi-viz-title">人生运势曲线</h3>
        <p className="bazi-viz-desc">暂无运势数据</p>
      </div>
    )
  }

  const plotBottom = padding.top + (svgHeight - padding.top - padding.bottom)

  return (
    <div className={classes}>
      <h3 className="bazi-viz-title">人生运势曲线</h3>
      <p className="bazi-viz-desc">X轴为年龄，Y轴为运势分数（0-100），贝塞尔平滑曲线</p>
      <div className="bazi-viz-curve__container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="bazi-viz-curve__svg"
          role="img"
          aria-label="人生运势曲线图"
        >
          {/* 网格线 */}
          {yTicks.map(tick => (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={yScale(tick)}
                x2={svgWidth - padding.right}
                y2={yScale(tick)}
                stroke="#eee"
                strokeWidth={1}
              />
              <text
                x={padding.left - 8}
                y={yScale(tick)}
                textAnchor="end"
                dominantBaseline="central"
                className="bazi-viz-curve__tick"
                fontSize={10}
                fill="#999"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* 阴影填充 */}
          <path
            d={areaPath}
            fill="url(#bazi-curve-gradient)"
            className="bazi-viz-curve__area"
          />

          {/* 渐变定义 */}
          <defs>
            <linearGradient id="bazi-curve-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* 曲线 */}
          <path
            d={curvePath}
            fill="none"
            stroke="#D4AF37"
            strokeWidth={2.5}
            className="bazi-viz-curve__line"
          />

          {/* 数据点 + 标注 */}
          {points.map((pt, i) => (
            <g
              key={i}
              onMouseEnter={() => setHoveredPoint(i)}
              onMouseLeave={() => setHoveredPoint(null)}
              style={{ cursor: 'pointer' }}
            >
              <title>
                {pt.age}岁：运势{pt.score}分
                {pt.label ? `（${pt.label}）` : ''}
              </title>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredPoint === i ? 6 : 4}
                fill={hoveredPoint === i ? '#B8860B' : '#D4AF37'}
                stroke="#fff"
                strokeWidth={2}
                className="bazi-viz-curve__dot"
              />
              {/* 关键年份标注 */}
              {pt.label && (
                <text
                  x={pt.x}
                  y={pt.y - 14}
                  textAnchor="middle"
                  className="bazi-viz-curve__label"
                  fontSize={10}
                  fill="#8B4513"
                  fontWeight="bold"
                >
                  {pt.label}
                </text>
              )}
              {/* X 轴年龄标签 */}
              <text
                x={pt.x}
                y={plotBottom + 18}
                textAnchor="middle"
                className="bazi-viz-curve__x-label"
                fontSize={10}
                fill="#999"
              >
                {pt.age}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* 悬停详情 */}
      {hoveredPoint != null && hoveredPoint < points.length && (
        <div className="bazi-viz-curve__tooltip">
          <div className="bazi-viz-curve__tooltip-age">{points[hoveredPoint].age}岁</div>
          <div className="bazi-viz-curve__tooltip-score">
            运势：{points[hoveredPoint].score}分
          </div>
          {points[hoveredPoint].label && (
            <div className="bazi-viz-curve__tooltip-label">
              {points[hoveredPoint].label}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================
// 5. 综合评分仪表盘（SVG 仪表盘）
// ============================================================

interface ScoreGaugeProps {
  score: number
  label: string
  className?: string
  size?: number
}

/** 根据分数获取颜色 */
function getGaugeColor(score: number): { color: string; level: string } {
  if (score >= 80) return { color: '#D4AF37', level: '卓越' }
  if (score >= 60) return { color: '#2E8B57', level: '优良' }
  if (score >= 40) return { color: '#DAA520', level: '中等' }
  return { color: '#DC143C', level: '待改善' }
}

/**
 * 综合评分仪表盘
 *
 * SVG 半圆仪表盘，0-100分。
 * 颜色渐变：红(0-40) -> 黄(40-60) -> 绿(60-80) -> 金(80-100)。
 * 中心大字显示分数，底部显示等级文字。
 */
export function ScoreGauge({
  score,
  label,
  className = '',
  size = 200,
}: ScoreGaugeProps): JSX.Element {
  const clampedScore = useMemo(() => Math.max(0, Math.min(100, score)), [score])
  const { color, level } = useMemo(() => getGaugeColor(clampedScore), [clampedScore])

  const cx = size / 2
  const cy = size / 2 + 10
  const radius = (size - 40) / 2
  const strokeWidth = 16

  // 半圆仪表盘弧形
  const arc = useMemo(() => {
    const startAngle = Math.PI // 左侧（180度）
    const endAngle = 0 // 右侧（0度）
    const sweepAngle = (clampedScore / 100) * Math.PI
    const currentEndAngle = startAngle - sweepAngle

    const x1 = cx + radius * Math.cos(startAngle)
    const y1 = cy - radius * Math.sin(startAngle)
    const x2 = cx + radius * Math.cos(currentEndAngle)
    const y2 = cy - radius * Math.sin(currentEndAngle)

    const largeArc = sweepAngle > Math.PI ? 1 : 0

    return {
      bgD: `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${cx + radius * Math.cos(endAngle)} ${cy - radius * Math.sin(endAngle)}`,
      fgD: `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 0 ${x2} ${y2}`,
      x2,
      y2,
    }
  }, [clampedScore, cx, cy, radius])

  const classes = ['bazi-viz-gauge', className].filter(Boolean).join(' ')

  // 刻度标签
  const tickMarks = useMemo(() => {
    const ticks = []
    for (let i = 0; i <= 10; i++) {
      const angle = Math.PI - (i / 10) * Math.PI
      const innerR = radius - strokeWidth / 2 - 6
      const outerR = radius - strokeWidth / 2 - 2
      const x1 = cx + innerR * Math.cos(angle)
      const y1 = cy - innerR * Math.sin(angle)
      const x2 = cx + outerR * Math.cos(angle)
      const y2 = cy - outerR * Math.sin(angle)
      ticks.push({
        x1, y1, x2, y2,
        labelX: cx + (radius + 14) * Math.cos(angle),
        labelY: cy - (radius + 14) * Math.sin(angle),
        value: i * 10,
      })
    }
    return ticks
  }, [cx, cy, radius, strokeWidth])

  return (
    <div className={classes}>
      <h3 className="bazi-viz-title">综合评分仪表盘</h3>
      <p className="bazi-viz-desc">半圆仪表盘，0-100分，颜色随分数变化</p>
      <div className="bazi-viz-gauge__container">
        <svg
          viewBox={`0 0 ${size} ${size / 2 + 40}`}
          className="bazi-viz-gauge__svg"
          role="img"
          aria-label={`${label}评分：${clampedScore}`}
        >
          <defs>
            <linearGradient id="bazi-gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#DC143C" />
              <stop offset="40%" stopColor="#DAA520" />
              <stop offset="60%" stopColor="#DAA520" />
              <stop offset="80%" stopColor="#2E8B57" />
              <stop offset="100%" stopColor="#D4AF37" />
            </linearGradient>
          </defs>

          {/* 背景弧 */}
          <path
            d={arc.bgD}
            fill="none"
            stroke="#e8e8e8"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="bazi-viz-gauge__bg"
          />

          {/* 前景弧 */}
          <path
            d={arc.fgD}
            fill="none"
            stroke="url(#bazi-gauge-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="bazi-viz-gauge__fg"
          />

          {/* 刻度 */}
          {tickMarks.map(tick => (
            <g key={tick.value}>
              <line
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="#ccc"
                strokeWidth={1}
              />
              {tick.value % 20 === 0 && (
                <text
                  x={tick.labelX}
                  y={tick.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={9}
                  fill="#999"
                >
                  {tick.value}
                </text>
              )}
            </g>
          ))}

          {/* 中心分数 */}
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="central"
            className="bazi-viz-gauge__score"
            fontSize={size < 180 ? 28 : 36}
            fontWeight="bold"
            fill={color}
          >
            {clampedScore}
          </text>

          {/* 等级文字 */}
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            className="bazi-viz-gauge__level"
            fontSize={14}
            fill={color}
          >
            {level}
          </text>

          {/* 标签 */}
          <text
            x={cx}
            y={cy + 34}
            textAnchor="middle"
            className="bazi-viz-gauge__label"
            fontSize={12}
            fill="#999"
          >
            {label}
          </text>
        </svg>
      </div>
    </div>
  )
}
