/**
 * AI Cost Dashboard
 * AI 成本仪表盘：Token 使用、成本趋势、模型对比、缓存统计、降级策略
 */

import React from 'react'
import './AICostDashboard.css'

/* ============================================
   类型定义
   ============================================ */

interface TokenDataPoint {
  date: string
  totalTokens: number
  promptTokens: number
  completionTokens: number
}

interface ModelCostRow {
  model: string
  provider: string
  inputCostPer1M: number
  outputCostPer1M: number
  avgLatency: number
  usageShare: number
}

interface DegradeThreshold {
  name: string
  desc: string
  value: number
  enabled: boolean
  unit: string
}

/* ============================================
   Mock 数据
   ============================================ */

function formatDateLabel(dateStr: string): string {
  return dateStr.slice(5)
}

function generateTokenData(days: number): TokenDataPoint[] {
  var result: TokenDataPoint[] = []
  var today = new Date(2026, 6, 12)
  for (var i = days - 1; i >= 0; i--) {
    var d = new Date(today)
    d.setDate(d.getDate() - i)
    var mm = String(d.getMonth() + 1).padStart(2, '0')
    var dd = String(d.getDate()).padStart(2, '0')
    var dateStr = '2026-' + mm + '-' + dd
    var base = 150000 + (days - i) * 2000
    var prompt = Math.round(base * 0.65)
    var completion = Math.round(base * 0.35)
    result.push({
      date: dateStr,
      totalTokens: prompt + completion,
      promptTokens: prompt,
      completionTokens: completion
    })
  }
  return result
}

var MOCK_TOKEN_7D = generateTokenData(7)
var MOCK_TOKEN_30D = generateTokenData(30)

var MOCK_MODEL_COSTS: ModelCostRow[] = [
  { model: 'gpt-4o', provider: 'OpenAI', inputCostPer1M: 30, outputCostPer1M: 60, avgLatency: 1200, usageShare: 35 },
  { model: 'gpt-4o-mini', provider: 'OpenAI', inputCostPer1M: 1.5, outputCostPer1M: 6, avgLatency: 600, usageShare: 20 },
  { model: 'gemini-2.0-flash', provider: 'Gemini', inputCostPer1M: 0.7, outputCostPer1M: 2.1, avgLatency: 800, usageShare: 30 },
  { model: 'gemini-2.0-pro', provider: 'Gemini', inputCostPer1M: 7, outputCostPer1M: 21, avgLatency: 1500, usageShare: 10 },
  { model: 'deepseek-v3', provider: 'DeepSeek', inputCostPer1M: 2, outputCostPer1M: 8, avgLatency: 2000, usageShare: 5 }
]

var MOCK_DEGRADE_THRESHOLDS: DegradeThreshold[] = [
  { name: '单请求Token上限', desc: '超过则拒绝或截断', value: 32000, enabled: true, unit: '' },
  { name: '日成本上限', desc: '超过则切换至低成本模型', value: 500, enabled: true, unit: '¥' },
  { name: '分钟请求上限', desc: '超过则启用限流', value: 120, enabled: true, unit: '' },
  { name: '错误率阈值', desc: '超过则触发告警并降级', value: 5, enabled: false, unit: '%' },
  { name: 'P95延迟阈值', desc: '超过则切换至更快模型', value: 3000, enabled: true, unit: 'ms' }
]

/* ============================================
   SVG 折线图组件
   ============================================ */

function TokenLineChart(props: { data: TokenDataPoint[] }) {
  var data = props.data
  var width = 600
  var height = 200
  var padX = 50
  var padY = 20
  var chartW = width - padX * 2
  var chartH = height - padY * 2

  if (!data || data.length === 0) {
    return null
  }

  var maxVal = 0
  for (var i = 0; i < data.length; i++) {
    if (data[i].totalTokens > maxVal) maxVal = data[i].totalTokens
  }
  maxVal = Math.round(maxVal * 1.1) || 1

  // Y轴刻度
  var yTicks = 4
  var yTickEls: React.ReactElement[] = []
  for (var t = 0; t <= yTicks; t++) {
    var ty = padY + chartH - (chartH * t / yTicks)
    var tv = Math.round(maxVal * t / yTicks / 1000)
    yTickEls.push(
      React.createElement('text', {
        key: 'yt-' + t,
        x: padX - 6,
        y: ty + 4,
        fill: '#666666',
        fontSize: 10,
        textAnchor: 'end'
      }, tv + 'k')
    )
    yTickEls.push(
      React.createElement('line', {
        key: 'yl-' + t,
        x1: padX,
        y1: ty,
        x2: width - padX,
        y2: ty,
        stroke: '#2a2a2a',
        strokeWidth: 0.5
      })
    )
  }

  // X轴刻度
  var xTickEls: React.ReactElement[] = []
  var step = Math.max(1, Math.floor(data.length / 6))
  for (var xi = 0; xi < data.length; xi += step) {
    var xx = padX + (data.length > 1 ? (xi / (data.length - 1)) * chartW : chartW / 2)
    xTickEls.push(
      React.createElement('text', {
        key: 'xt-' + xi,
        x: xx,
        y: height - 4,
        fill: '#666666',
        fontSize: 10,
        textAnchor: 'middle'
      }, formatDateLabel(data[xi].date))
    )
  }

  // 线条
  function makeLine(key: 'totalTokens' | 'promptTokens' | 'completionTokens', color: string) {
    var points = ''
    for (var di = 0; di < data.length; di++) {
      var px = padX + (data.length > 1 ? (di / (data.length - 1)) * chartW : chartW / 2)
      var py = padY + chartH - (data[di][key] / maxVal) * chartH
      points += px + ',' + py + ' '
    }
    return React.createElement('polyline', {
      key: 'line-' + key,
      points: points.trim(),
      fill: 'none',
      stroke: color,
      strokeWidth: 2,
      strokeLinejoin: 'round'
    })
  }

  return React.createElement('svg', { viewBox: '0 0 ' + width + ' ' + height },
    yTickEls,
    xTickEls,
    makeLine('totalTokens', '#d4a843'),
    makeLine('promptTokens', '#60a5fa'),
    makeLine('completionTokens', '#a78bfa')
  )
}

/* ============================================
   缓存环形图
   ============================================ */

function CacheDonut(props: { hit: number; miss: number }) {
  var total = props.hit + props.miss
  var ratio = total > 0 ? props.hit / total : 0
  var radius = 50
  var circumference = 2 * Math.PI * radius
  var filled = circumference * ratio
  var cx = 60
  var cy = 60

  return React.createElement('svg', { viewBox: '0 0 120 120', width: 120, height: 120 },
    React.createElement('circle', {
      cx: cx, cy: cy, r: radius,
      fill: 'none', stroke: '#2a2a2a', strokeWidth: 12
    }),
    React.createElement('circle', {
      cx: cx, cy: cy, r: radius,
      fill: 'none', stroke: '#34d399', strokeWidth: 12,
      strokeDasharray: filled + ' ' + (circumference - filled),
      strokeLinecap: 'round',
      transform: 'rotate(-90 ' + cx + ' ' + cy + ')'
    }),
    React.createElement('text', {
      x: cx, y: cy - 4,
      textAnchor: 'middle',
      fill: '#e8e8e8',
      fontSize: 18,
      fontWeight: 700
    }, Math.round(ratio * 100) + '%'),
    React.createElement('text', {
      x: cx, y: cy + 14,
      textAnchor: 'middle',
      fill: '#999999',
      fontSize: 10
    }, '命中率')
  )
}

/* ============================================
   主组件
   ============================================ */

function AICostDashboard() {
  var rangeHook = React.useState<'7d' | '30d'>('7d')
  var range = rangeHook[0]
  var setRange = rangeHook[1]

  var thresholdsHook = React.useState<DegradeThreshold[]>(MOCK_DEGRADE_THRESHOLDS)
  var thresholds = thresholdsHook[0]
  var setThresholds = thresholdsHook[1]

  var tokenData = range === '7d' ? MOCK_TOKEN_7D : MOCK_TOKEN_30D

  // 计算 KPI
  var todayTokens = MOCK_TOKEN_7D[MOCK_TOKEN_7D.length - 1].totalTokens
  var yesterdayTokens = MOCK_TOKEN_7D[MOCK_TOKEN_7D.length - 2].totalTokens
  var tokenTrend = todayTokens - yesterdayTokens

  // 成本计算：基于 mock 模型用量
  var todayCost = 0
  for (var mi = 0; mi < MOCK_MODEL_COSTS.length; mi++) {
    var m = MOCK_MODEL_COSTS[mi]
    var shareTokens = todayTokens * (m.usageShare / 100)
    var inputTokens = shareTokens * 0.65
    var outputTokens = shareTokens * 0.35
    var cost = (inputTokens / 1000000) * m.inputCostPer1M + (outputTokens / 1000000) * m.outputCostPer1M
    todayCost += cost
  }
  todayCost = Math.round(todayCost * 100) / 100

  var avgCostPerReport = 0.85
  var cacheHitRate = 87.5

  function updateThreshold(index: number, newValue: number) {
    setThresholds(function(prev) {
      var next = prev.slice()
      next[index] = Object.assign({}, next[index], { value: newValue })
      return next
    })
  }

  function toggleThreshold(index: number) {
    setThresholds(function(prev) {
      var next = prev.slice()
      next[index] = Object.assign({}, next[index], { enabled: !next[index].enabled })
      return next
    })
  }

  var trendText = (tokenTrend >= 0 ? '+' : '') + Math.round(tokenTrend / 1000) + 'k'
  var trendClass = tokenTrend >= 0 ? 'up' : 'down'

  return React.createElement('div', { className: 'ai-cost-page' },
    React.createElement('h1', null, 'AI 成本仪表盘'),
    React.createElement('div', { className: 'ai-cost-subtitle' }, '实时监控 Token 消耗、模型成本与缓存效率'),

    // KPI 卡片
    React.createElement('div', { className: 'ai-cost-kpi-grid' },
      React.createElement('div', { className: 'ai-cost-kpi-card' },
        React.createElement('div', { className: 'ai-cost-kpi-label' }, '今日 Token'),
        React.createElement('div', { className: 'ai-cost-kpi-value' },
          Math.round(todayTokens / 1000),
          React.createElement('span', { className: 'ai-cost-kpi-unit' }, 'k')
        ),
        React.createElement('div', { className: 'ai-cost-kpi-trend ' + trendClass }, trendText + ' 较昨日')
      ),
      React.createElement('div', { className: 'ai-cost-kpi-card highlight' },
        React.createElement('div', { className: 'ai-cost-kpi-label' }, '今日成本'),
        React.createElement('div', { className: 'ai-cost-kpi-value' },
          '\u00A5' + todayCost.toFixed(2)
        )
      ),
      React.createElement('div', { className: 'ai-cost-kpi-card' },
        React.createElement('div', { className: 'ai-cost-kpi-label' }, '平均成本 / 报告'),
        React.createElement('div', { className: 'ai-cost-kpi-value' },
          '\u00A5' + avgCostPerReport.toFixed(2)
        )
      ),
      React.createElement('div', { className: 'ai-cost-kpi-card' },
        React.createElement('div', { className: 'ai-cost-kpi-label' }, '缓存命中率'),
        React.createElement('div', { className: 'ai-cost-kpi-value' },
          cacheHitRate,
          React.createElement('span', { className: 'ai-cost-kpi-unit' }, '%')
        )
      )
    ),

    // 趋势图
    React.createElement('div', { className: 'ai-cost-section' },
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        React.createElement('h2', null, 'Token 使用趋势'),
        React.createElement('div', { style: { display: 'flex', gap: 8 } },
          React.createElement('button', {
            className: 'dash-refresh-btn' + (range === '7d' ? ' active' : ''),
            style: range === '7d' ? { background: '#d4a843', color: '#0d0d0d', borderColor: '#d4a843' } : {},
            onClick: function() { setRange('7d') }
          }, '7天'),
          React.createElement('button', {
            className: 'dash-refresh-btn' + (range === '30d' ? ' active' : ''),
            style: range === '30d' ? { background: '#d4a843', color: '#0d0d0d', borderColor: '#d4a843' } : {},
            onClick: function() { setRange('30d') }
          }, '30天')
        )
      ),
      React.createElement('div', { className: 'ai-cost-chart-grid', style: { marginTop: 16 } },
        React.createElement('div', { className: 'ai-cost-chart-card' },
          React.createElement('div', { className: 'ai-cost-chart-title' }, 'Token 使用量'),
          React.createElement('div', { className: 'ai-cost-chart-container' },
            React.createElement(TokenLineChart, { data: tokenData })
          ),
          React.createElement('div', { className: 'ai-cost-chart-legend' },
            React.createElement('span', { className: 'ai-cost-legend-item' },
              React.createElement('span', { className: 'ai-cost-legend-color', style: { background: '#d4a843' } }),
              '总Token'
            ),
            React.createElement('span', { className: 'ai-cost-legend-item' },
              React.createElement('span', { className: 'ai-cost-legend-color', style: { background: '#60a5fa' } }),
              'Prompt'
            ),
            React.createElement('span', { className: 'ai-cost-legend-item' },
              React.createElement('span', { className: 'ai-cost-legend-color', style: { background: '#a78bfa' } }),
              'Completion'
            )
          )
        )
      )
    ),

    // 模型成本对比
    React.createElement('div', { className: 'ai-cost-section' },
      React.createElement('h2', null, '模型成本对比'),
      React.createElement('div', { className: 'ai-cost-table-wrap' },
        React.createElement('table', { className: 'ai-cost-table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', null, '模型'),
              React.createElement('th', null, '提供商'),
              React.createElement('th', null, 'Input / 1M'),
              React.createElement('th', null, 'Output / 1M'),
              React.createElement('th', null, '平均延迟'),
              React.createElement('th', null, '用量占比')
            )
          ),
          React.createElement('tbody', null,
            MOCK_MODEL_COSTS.map(function(row, ri) {
              return React.createElement('tr', { key: 'mc-' + ri },
                React.createElement('td', null, row.model),
                React.createElement('td', null, row.provider),
                React.createElement('td', null, '$' + row.inputCostPer1M),
                React.createElement('td', null, '$' + row.outputCostPer1M),
                React.createElement('td', null,
                  row.avgLatency <= 1000
                    ? React.createElement('span', { className: 'cell-good' }, row.avgLatency + 'ms')
                    : React.createElement('span', { className: 'cell-warning' }, row.avgLatency + 'ms')
                ),
                React.createElement('td', null, row.usageShare + '%')
              )
            })
          )
        )
      )
    ),

    // 缓存统计
    React.createElement('div', { className: 'ai-cost-section' },
      React.createElement('h2', null, '缓存统计'),
      React.createElement('div', { className: 'ai-cost-cache-grid' },
        React.createElement('div', { className: 'ai-cost-cache-card' },
          React.createElement('div', { className: 'ai-cost-cache-label' }, '缓存命中'),
          React.createElement('div', { className: 'ai-cost-cache-value hit' }, '1,247')
        ),
        React.createElement('div', { className: 'ai-cost-cache-card' },
          React.createElement('div', { className: 'ai-cost-cache-label' }, '缓存未命中'),
          React.createElement('div', { className: 'ai-cost-cache-value miss' }, '178')
        ),
        React.createElement('div', { className: 'ai-cost-cache-card' },
          React.createElement('div', { className: 'ai-cost-cache-label' }, '命中率'),
          React.createElement('div', { className: 'ai-cost-cache-value rate' }, '87.5%'),
          React.createElement('div', { style: { marginTop: 12 } },
            React.createElement(CacheDonut, { hit: 1247, miss: 178 })
          )
        )
      )
    ),

    // 自动降级策略
    React.createElement('div', { className: 'ai-cost-section' },
      React.createElement('h2', null, '自动降级策略'),
      React.createElement('div', { className: 'ai-cost-degrade-card' },
        thresholds.map(function(th, ti) {
          return React.createElement('div', { key: 'th-' + ti, className: 'ai-cost-degrade-row' },
            React.createElement('div', null,
              React.createElement('div', { className: 'ai-cost-degrade-label' }, th.name),
              React.createElement('div', { className: 'ai-cost-degrade-desc' }, th.desc)
            ),
            React.createElement('div', { className: 'ai-cost-degrade-input' },
              React.createElement('input', {
                type: 'number',
                value: th.value,
                disabled: !th.enabled,
                onChange: function(e: React.ChangeEvent<HTMLInputElement>) {
                  updateThreshold(ti, Number(e.target.value))
                }
              }),
              React.createElement('span', { style: { fontSize: 12, color: '#666666' } }, th.unit),
              React.createElement('input', {
                type: 'checkbox',
                className: 'ai-cost-degrade-toggle',
                checked: th.enabled,
                onChange: function() { toggleThreshold(ti) }
              })
            )
          )
        })
      )
    )
  )
}

export default AICostDashboard
