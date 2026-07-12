import React from 'react'
import useDashboard from '../hooks/useDashboard'
import { DailyMetric, FeatureUsage } from '../lib/dashboard/types'
import './Dashboard.css'

/* ============================================
   工具函数
   ============================================ */

function formatNumber(n) {
  if (n >= 10000) {
    return (n / 10000).toFixed(1) + '万'
  }
  return n.toLocaleString('zh-CN')
}

function formatMoney(cents) {
  if (cents >= 10000) {
    return (cents / 10000).toFixed(2) + '万元'
  }
  return (cents / 100).toFixed(2) + '元'
}

function shortDate(dateStr) {
  return dateStr.slice(5) // MM-DD
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  var d = new Date(dateStr)
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0')
}

/* ============================================
   SVG 折线图组件
   ============================================ */

function LineChart(props) {
  var data = props.data
  var lines = props.lines
  var width = 360
  var height = 180
  var padX = 36
  var padY = 10
  var chartW = width - padX * 2
  var chartH = height - padY * 2

  if (!data || data.length === 0) {
    return null
  }

  // 计算全局最大值
  var globalMax = 0
  for (var li = 0; li < lines.length; li++) {
    for (var di = 0; di < data.length; di++) {
      var v = data[di][lines[li].key]
      if (v > globalMax) {
        globalMax = v
      }
    }
  }
  globalMax = globalMax * 1.1 || 1

  // Y轴刻度
  var yTicks = 4
  var yTickEls = []
  for (var t = 0; t <= yTicks; t++) {
    var ty = padY + chartH - (chartH * t / yTicks)
    var tv = Math.round(globalMax * t / yTicks)
    yTickEls.push(
      React.createElement('text', {
        key: 'yt-' + t,
        x: padX - 4,
        y: ty + 4,
        fill: '#666666',
        fontSize: 10,
        textAnchor: 'end'
      }, formatNumber(tv))
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

  // X轴刻度（每隔5天）
  var xTickEls = []
  for (var xi = 0; xi < data.length; xi += 5) {
    var xx = padX + (xi / (data.length - 1)) * chartW
    xTickEls.push(
      React.createElement('text', {
        key: 'xt-' + xi,
        x: xx,
        y: height - 2,
        fill: '#666666',
        fontSize: 10,
        textAnchor: 'middle'
      }, shortDate(data[xi].date))
    )
  }

  // 线条路径
  var lineEls = []
  for (var li2 = 0; li2 < lines.length; li2++) {
    var line = lines[li2]
    var points = ''
    for (var di2 = 0; di2 < data.length; di2++) {
      var px = padX + (di2 / (data.length - 1)) * chartW
      var py = padY + chartH - (data[di2][line.key] / globalMax) * chartH
      points += px + ',' + py + ' '
    }
    lineEls.push(
      React.createElement('polyline', {
        key: 'line-' + line.key,
        points: points.trim(),
        fill: 'none',
        stroke: line.color,
        strokeWidth: 2,
        strokeLinejoin: 'round'
      })
    )
  }

  return React.createElement('svg', { viewBox: '0 0 ' + width + ' ' + height },
    yTickEls,
    xTickEls,
    lineEls
  )
}

/* ============================================
   SVG 柱状图组件
   ============================================ */

function BarChart(props) {
  var data = props.data
  var dataKey = props.dataKey
  var color = props.color || '#d4a843'
  var width = 360
  var height = 180
  var padX = 36
  var padY = 10
  var chartW = width - padX * 2
  var chartH = height - padY * 2

  if (!data || data.length === 0) {
    return null
  }

  var maxVal = 0
  for (var i = 0; i < data.length; i++) {
    if (data[i][dataKey] > maxVal) {
      maxVal = data[i][dataKey]
    }
  }
  maxVal = maxVal * 1.15 || 1

  // Y轴
  var yTicks = 4
  var yTickEls = []
  for (var t = 0; t <= yTicks; t++) {
    var ty = padY + chartH - (chartH * t / yTicks)
    var tv = Math.round(maxVal * t / yTicks)
    yTickEls.push(
      React.createElement('text', {
        key: 'yt-' + t,
        x: padX - 4,
        y: ty + 4,
        fill: '#666666',
        fontSize: 10,
        textAnchor: 'end'
      }, '' + tv)
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

  // 柱子
  var barWidth = Math.max(2, chartW / data.length - 2)
  var barEls = []
  for (var j = 0; j < data.length; j++) {
    var bx = padX + (j / data.length) * chartW + 1
    var bh = (data[j][dataKey] / maxVal) * chartH
    var by = padY + chartH - bh
    barEls.push(
      React.createElement('rect', {
        key: 'bar-' + j,
        x: bx,
        y: by,
        width: barWidth,
        height: bh,
        fill: color,
        rx: 1,
        opacity: 0.85
      })
    )
  }

  // X轴（每隔5天）
  var xTickEls = []
  for (var xi = 0; xi < data.length; xi += 5) {
    var xx = padX + ((xi + 0.5) / data.length) * chartW
    xTickEls.push(
      React.createElement('text', {
        key: 'xt-' + xi,
        x: xx,
        y: height - 2,
        fill: '#666666',
        fontSize: 10,
        textAnchor: 'middle'
      }, shortDate(data[xi].date))
    )
  }

  return React.createElement('svg', { viewBox: '0 0 ' + width + ' ' + height },
    yTickEls,
    xTickEls,
    barEls
  )
}

/* ============================================
   SVG 面积图组件
   ============================================ */

function AreaChart(props) {
  var data = props.data
  var dataKey = props.dataKey
  var color = props.color || '#d4a843'
  var width = 360
  var height = 180
  var padX = 36
  var padY = 10
  var chartW = width - padX * 2
  var chartH = height - padY * 2

  if (!data || data.length === 0) {
    return null
  }

  var maxVal = 0
  for (var i = 0; i < data.length; i++) {
    if (data[i][dataKey] > maxVal) {
      maxVal = data[i][dataKey]
    }
  }
  maxVal = maxVal * 1.15 || 1

  // Y轴
  var yTicks = 4
  var yTickEls = []
  for (var t = 0; t <= yTicks; t++) {
    var ty = padY + chartH - (chartH * t / yTicks)
    var tv = Math.round(maxVal * t / yTicks)
    yTickEls.push(
      React.createElement('text', {
        key: 'yt-' + t,
        x: padX - 4,
        y: ty + 4,
        fill: '#666666',
        fontSize: 10,
        textAnchor: 'end'
      }, formatMoney(tv))
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

  // 面积路径
  var linePoints = ''
  var areaPoints = ''
  var baseY = padY + chartH

  for (var j = 0; j < data.length; j++) {
    var px = padX + (j / (data.length - 1)) * chartW
    var py = padY + chartH - (data[j][dataKey] / maxVal) * chartH
    var pt = px + ',' + py
    linePoints += pt + ' '
    areaPoints += pt + ' '
  }

  var firstX = padX
  var lastX = padX + chartW
  var closedArea = areaPoints.trim() + ' ' + lastX + ',' + baseY + ' ' + firstX + ',' + baseY

  // X轴
  var xTickEls = []
  for (var xi = 0; xi < data.length; xi += 5) {
    var xx = padX + (xi / (data.length - 1)) * chartW
    xTickEls.push(
      React.createElement('text', {
        key: 'xt-' + xi,
        x: xx,
        y: height - 2,
        fill: '#666666',
        fontSize: 10,
        textAnchor: 'middle'
      }, shortDate(data[xi].date))
    )
  }

  return React.createElement('svg', { viewBox: '0 0 ' + width + ' ' + height },
    yTickEls,
    xTickEls,
    React.createElement('defs', null,
      React.createElement('linearGradient', { id: 'areaGrad-' + dataKey, x1: '0', y1: '0', x2: '0', y2: '1' },
        React.createElement('stop', { offset: '0%', stopColor: color, stopOpacity: 0.4 }),
        React.createElement('stop', { offset: '100%', stopColor: color, stopOpacity: 0.05 })
      )
    ),
    React.createElement('polygon', {
      points: closedArea,
      fill: 'url(#areaGrad-' + dataKey + ')'
    }),
    React.createElement('polyline', {
      points: linePoints.trim(),
      fill: 'none',
      stroke: color,
      strokeWidth: 2,
      strokeLinejoin: 'round'
    })
  )
}

/* ============================================
   仪表盘组件（半圆）
   ============================================ */

function Gauge(props) {
  var value = props.value
  var max = props.max || 100
  var label = props.label
  var unit = props.unit || '%'
  var colorClass = props.colorClass || 'neutral'

  var radius = 45
  var cx = 60
  var cy = 58
  var strokeW = 8
  var circumference = Math.PI * radius // 半圆
  var ratio = Math.min(value / max, 1)
  var filled = circumference * ratio

  var dashArray = filled + ' ' + (circumference - filled)

  return React.createElement('div', { className: 'dash-gauge-card' },
    React.createElement('svg', { className: 'dash-gauge-svg', viewBox: '0 0 120 80' },
      // 背景弧
      React.createElement('path', {
        d: 'M 15 65 A 45 45 0 0 1 105 65',
        fill: 'none',
        stroke: '#2a2a2a',
        strokeWidth: strokeW,
        strokeLinecap: 'round'
      }),
      // 值弧
      React.createElement('path', {
        d: 'M 15 65 A 45 45 0 0 1 105 65',
        fill: 'none',
        stroke: colorClass === 'good' ? '#34d399' : colorClass === 'warning' ? '#fbbf24' : colorClass === 'bad' ? '#f87171' : '#60a5fa',
        strokeWidth: strokeW,
        strokeLinecap: 'round',
        strokeDasharray: dashArray
      })
    ),
    React.createElement('div', { className: 'dash-gauge-label' }, label),
    React.createElement('div', { className: 'dash-gauge-value ' + colorClass },
      typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value,
      React.createElement('span', { className: 'dash-kpi-unit' }, unit)
    )
  )
}

/* ============================================
   系统状态条组件
   ============================================ */

function StatusBar(props) {
  var status = props.status
  var uptime = props.uptime

  var labels = {
    healthy: '服务正常',
    degraded: '性能降级',
    down: '服务中断'
  }

  return React.createElement('div', { className: 'dash-status-bar' },
    React.createElement('div', { className: 'dash-status-dot ' + status }),
    React.createElement('span', { className: 'dash-status-label ' + status }, labels[status] || status),
    React.createElement('span', { className: 'dash-status-detail' }, '运行时间 ' + uptime + '%')
  )
}

/* ============================================
   功能热度排行组件
   ============================================ */

function FeatureRankList(props) {
  var features = props.features

  var trendLabel = {
    up: '上升',
    down: '下降',
    stable: '持平'
  }

  var trendIcon = {
    up: '\u2191',
    down: '\u2193',
    stable: '\u2014'
  }

  var items = features.map(function(f, idx) {
    return React.createElement('div', { key: f.name, className: 'dash-feature-item' },
      React.createElement('div', { className: 'dash-feature-rank' }, '' + (idx + 1)),
      React.createElement('div', { className: 'dash-feature-name' }, f.name),
      React.createElement('div', { className: 'dash-feature-bar-wrap' },
        React.createElement('div', {
          className: 'dash-feature-bar ' + f.trend,
          style: { width: f.percent + '%' }
        })
      ),
      React.createElement('div', { className: 'dash-feature-percent' }, f.percent + '%'),
      React.createElement('div', { className: 'dash-feature-trend ' + f.trend },
        trendIcon[f.trend] + ' ' + trendLabel[f.trend]
      )
    )
  })

  return React.createElement('div', { className: 'dash-feature-list' }, items)
}

/* ============================================
   管理表格组件
   ============================================ */

function AdminTable(props) {
  var columns = props.columns
  var data = props.data
  var emptyText = props.emptyText || '暂无数据'

  var headerRow = React.createElement('tr', { key: 'header' },
    columns.map(function(col, i) {
      return React.createElement('th', { key: 'th-' + i, className: 'dash-table-th' }, col.label)
    })
  )

  var bodyRows = data.map(function(row, ri) {
    return React.createElement('tr', { key: 'row-' + ri, className: 'dash-table-row' },
      columns.map(function(col, ci) {
        var val = row[col.key]
        var cellContent = typeof col.render === 'function' ? col.render(val, row) : String(val || '-')
        return React.createElement('td', { key: 'td-' + ri + '-' + ci, className: 'dash-table-td' }, cellContent)
      })
    )
  })

  return React.createElement('div', { className: 'dash-table-wrap' },
    React.createElement('table', { className: 'dash-table' },
      React.createElement('thead', null, headerRow),
      React.createElement('tbody', null,
        bodyRows.length > 0 ? bodyRows : React.createElement('tr', null,
          React.createElement('td', {
            colSpan: columns.length,
            className: 'dash-table-empty'
          }, emptyText)
        )
      )
    )
  )
}

/* ============================================
   模拟数据
   ============================================ */

var MOCK_USERS = [
  { id: 'u001', name: '张三', tier: 'master', registered: '2025-03-15', status: 'active' },
  { id: 'u002', name: '李四', tier: 'pro', registered: '2025-06-20', status: 'active' },
  { id: 'u003', name: '王五', tier: 'free', registered: '2026-01-10', status: 'active' },
  { id: 'u004', name: '赵六', tier: 'pro', registered: '2025-09-05', status: 'inactive' },
  { id: 'u005', name: '钱七', tier: 'free', registered: '2026-06-28', status: 'active' }
]

var MOCK_ORDERS = [
  { id: 'ord-20260712-001', user: '张三', amount: 9900, product: 'Master会员', status: 'paid', time: '2026-07-12' },
  { id: 'ord-20260711-002', user: '李四', amount: 2900, product: 'Pro会员', status: 'paid', time: '2026-07-11' },
  { id: 'ord-20260710-003', user: '王五', amount: 1900, product: 'Basic会员', status: 'pending', time: '2026-07-10' },
  { id: 'ord-20260709-004', user: '赵六', amount: 2900, product: 'Pro会员', status: 'refunded', time: '2026-07-09' },
  { id: 'ord-20260708-005', user: '钱七', amount: 500, product: 'AI积分', status: 'paid', time: '2026-07-08' }
]

var MOCK_PAYMENTS = [
  { id: 'pay-001', method: '微信支付', amount: 9900, status: 'paid', time: '2026-07-12 12:00' },
  { id: 'pay-002', method: '支付宝', amount: 2900, status: 'paid', time: '2026-07-11 18:30' },
  { id: 'pay-003', method: '微信支付', amount: 1900, status: 'pending', time: '2026-07-10 10:00' },
  { id: 'pay-004', method: 'Stripe', amount: 2900, status: 'refunded', time: '2026-07-09 15:20' }
]

var MOCK_FEEDBACKS = [
  { id: 'fb-001', user: '张三', type: 'bug', title: '八字排盘时间计算错误', status: 'open', time: '2026-07-12' },
  { id: 'fb-002', user: '李四', type: 'feature', title: '希望增加流年分析功能', status: 'processing', time: '2026-07-11' },
  { id: 'fb-003', user: '王五', type: 'accuracy', title: '六爻占卜结果不准确', status: 'resolved', time: '2026-07-08' },
  { id: 'fb-004', user: '赵六', type: 'other', title: '建议优化UI配色', status: 'closed', time: '2026-07-05' }
]

var MOCK_COUPONS = [
  { id: 'cpn-001', code: 'WELCOME20', discount: '20%', min: '无', usage: '50/100', status: 'active' },
  { id: 'cpn-002', code: 'PRO50', discount: '\u00A550', min: '\u00A529', usage: '30/50', status: 'active' },
  { id: 'cpn-003', code: 'SUMMER30', discount: '30%', min: '无', usage: '100/200', status: 'expired' }
]

var MOCK_COMMERCIAL_DAILY = [
  { date: '2026-07-06', revenue: 215600, members: 15, arpu: 1750 },
  { date: '2026-07-07', revenue: 198300, members: 8, arpu: 1620 },
  { date: '2026-07-08', revenue: 245100, members: 22, arpu: 1800 },
  { date: '2026-07-09', revenue: 231400, members: 18, arpu: 1720 },
  { date: '2026-07-10', revenue: 268900, members: 25, arpu: 1850 },
  { date: '2026-07-11', revenue: 252000, members: 20, arpu: 1780 },
  { date: '2026-07-12', revenue: 284700, members: 23, arpu: 1850 }
]

var ADMIN_TABS = [
  { key: 'overview', label: '数据概览' },
  { key: 'commercial', label: '商业KPI' },
  { key: 'users', label: '用户管理' },
  { key: 'orders', label: '订单管理' },
  { key: 'payments', label: '支付管理' },
  { key: 'feedbacks', label: '投诉处理' },
  { key: 'coupons', label: '优惠券管理' },
  { key: 'announcements', label: '公告管理' },
  { key: 'stats', label: '运营统计' }
]

var STATUS_LABELS: Record<string, string> = {
  'active': '正常',
  'inactive': '未激活',
  'paid': '已支付',
  'pending': '待处理',
  'refunded': '已退款',
  'cancelled': '已取消',
  'open': '待处理',
  'processing': '处理中',
  'resolved': '已解决',
  'closed': '已关闭',
  'expired': '已过期'
}

function getStatusClass(status: string): string {
  if (status === 'paid' || status === 'resolved' || status === 'active') return 'dash-status-paid'
  if (status === 'pending' || status === 'processing' || status === 'open') return 'dash-status-pending'
  if (status === 'refunded' || status === 'cancelled' || status === 'expired') return 'dash-status-refunded'
  return ''
}

/* ============================================
   Dashboard 主页面
   ============================================ */

function Dashboard() {
  var result = useDashboard()
  var status = result.status
  var metrics = result.metrics
  var dailyData = result.dailyData
  var error = result.error
  var refreshMetrics = result.refreshMetrics

  var tabHook = React.useState('overview')
  var activeTab = tabHook[0]
  var setActiveTab = tabHook[1]

  if (status === 'idle' || status === 'loading') {
    return React.createElement('div', { className: 'dashboard-page' },
      React.createElement('h1', null, '运营后台'),
      React.createElement('div', { className: 'dash-loading' }, '正在加载数据...')
    )
  }

  if (status === 'error') {
    return React.createElement('div', { className: 'dashboard-page' },
      React.createElement('h1', null, '运营后台'),
      React.createElement('div', { className: 'dash-error' },
        error || '数据加载失败',
        React.createElement('br', null),
        React.createElement('button', {
          className: 'dash-refresh-btn',
          onClick: refreshMetrics
        }, '重试')
      )
    )
  }

  // 线图配置
  var userLines = [
    { key: 'dau', color: '#d4a843', label: 'DAU' },
    { key: 'wau', color: '#60a5fa', label: 'WAU' },
    { key: 'mau', color: '#a78bfa', label: 'MAU' }
  ]

  // 缓存命中率颜色
  var cacheColorClass = metrics.cacheHitRate >= 90 ? 'good' : metrics.cacheHitRate >= 80 ? 'warning' : 'bad'
  // API错误率颜色
  var errorColorClass = metrics.apiErrorRate <= 1 ? 'good' : metrics.apiErrorRate <= 2 ? 'warning' : 'bad'
  // 分析时间颜色
  var timeColorClass = metrics.averageAnalysisTime <= 1500 ? 'good' : metrics.averageAnalysisTime <= 2000 ? 'warning' : 'bad'

  /* ========== 各管理Tab内容 ========== */

  var renderOverview = function() {
    return React.createElement(React.Fragment, null,
      // 标题区
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 } },
        React.createElement('h2', null, '数据概览'),
        React.createElement('button', {
          className: 'dash-refresh-btn',
          onClick: refreshMetrics
        }, '\u21bb 刷新')
      ),
      React.createElement('div', { className: 'dash-subtitle' }, '数据概览 \u00B7 最近30天'),

      // KPI 卡片行
      React.createElement('div', { className: 'dash-kpi-grid' },
        React.createElement('div', { className: 'dash-kpi-card highlight' },
          React.createElement('div', { className: 'dash-kpi-label' }, 'DAU'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(metrics.dau))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, 'WAU'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(metrics.wau))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, 'MAU'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(metrics.mau))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '次日留存率'),
          React.createElement('div', { className: 'dash-kpi-value' }, metrics.retentionRate, React.createElement('span', { className: 'dash-kpi-unit' }, '%'))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '支付转化率'),
          React.createElement('div', { className: 'dash-kpi-value' }, metrics.paymentRate, React.createElement('span', { className: 'dash-kpi-unit' }, '%'))
        ),
        React.createElement('div', { className: 'dash-kpi-card highlight' },
          React.createElement('div', { className: 'dash-kpi-label' }, '总收入（30天）'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatMoney(metrics.totalRevenue))
        )
      ),

      // 系统状态条
      React.createElement(StatusBar, {
        status: metrics.serverStatus,
        uptime: metrics.serverUptime
      }),

      // 趋势图表
      React.createElement('div', { className: 'dash-charts-section' },
        React.createElement('h2', null, '趋势图表'),
        React.createElement('div', { className: 'dash-chart-grid' },
          // 用户趋势 - 折线图
          React.createElement('div', { className: 'dash-chart-card' },
            React.createElement('div', { className: 'dash-chart-title' }, '用户趋势'),
            React.createElement('div', { className: 'dash-chart-container' },
              React.createElement(LineChart, { data: dailyData, lines: userLines })
            ),
            React.createElement('div', { className: 'dash-chart-legend' },
              React.createElement('span', { className: 'dash-legend-item' },
                React.createElement('span', { className: 'dash-legend-color', style: { background: '#d4a843' } }),
                'DAU'
              ),
              React.createElement('span', { className: 'dash-legend-item' },
                React.createElement('span', { className: 'dash-legend-color', style: { background: '#60a5fa' } }),
                'WAU'
              ),
              React.createElement('span', { className: 'dash-legend-item' },
                React.createElement('span', { className: 'dash-legend-color', style: { background: '#a78bfa' } }),
                'MAU'
              )
            )
          ),
          // 订单趋势 - 柱状图
          React.createElement('div', { className: 'dash-chart-card' },
            React.createElement('div', { className: 'dash-chart-title' }, '订单趋势'),
            React.createElement('div', { className: 'dash-chart-container' },
              React.createElement(BarChart, { data: dailyData, dataKey: 'orders', color: '#60a5fa' })
            )
          ),
          // 收入趋势 - 面积图
          React.createElement('div', { className: 'dash-chart-card' },
            React.createElement('div', { className: 'dash-chart-title' }, '收入趋势（分）'),
            React.createElement('div', { className: 'dash-chart-container' },
              React.createElement(AreaChart, { data: dailyData, dataKey: 'revenue', color: '#d4a843' })
            )
          )
        )
      ),

      // 功能热度排行
      React.createElement('div', { className: 'dash-feature-section' },
        React.createElement('h2', null, '功能热度排行'),
        React.createElement(FeatureRankList, { features: metrics.popularFeatures })
      ),

      // 系统指标
      React.createElement('div', { className: 'dash-system-section' },
        React.createElement('h2', null, '系统指标'),
        React.createElement('div', { className: 'dash-system-grid' },
          React.createElement(Gauge, {
            value: metrics.apiErrorRate,
            max: 5,
            label: 'API 错误率',
            colorClass: errorColorClass
          }),
          React.createElement(Gauge, {
            value: metrics.cacheHitRate,
            max: 100,
            label: '缓存命中率',
            colorClass: cacheColorClass
          }),
          React.createElement(Gauge, {
            value: metrics.averageAnalysisTime,
            max: 3000,
            unit: 'ms',
            label: '平均分析时间',
            colorClass: timeColorClass
          }),
          React.createElement(Gauge, {
            value: metrics.serverUptime,
            max: 100,
            label: '服务器运行时间',
            colorClass: 'good'
          })
        )
      )
    )
  }

  var renderUsers = function() {
    return React.createElement('div', null,
      React.createElement('h2', null, '用户管理'),
      React.createElement(AdminTable, {
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: '用户名' },
          { key: 'tier', label: '等级', render: function(v) {
            var tierCls = v === 'master' ? 'dash-status-paid' : v === 'pro' ? 'dash-status-pending' : ''
            return React.createElement('span', { className: 'dash-badge ' + tierCls }, v.toUpperCase())
          }},
          { key: 'registered', label: '注册时间' },
          { key: 'status', label: '状态', render: function(v) {
            return React.createElement('span', { className: 'dash-badge ' + getStatusClass(v) }, STATUS_LABELS[v] || v)
          }},
          { key: 'id', label: '操作', render: function(v) {
            return React.createElement('button', { className: 'dash-action-btn' }, '详情')
          }}
        ],
        data: MOCK_USERS,
        emptyText: '暂无用户数据'
      })
    )
  }

  var renderOrders = function() {
    return React.createElement('div', null,
      React.createElement('h2', null, '订单管理'),
      React.createElement(AdminTable, {
        columns: [
          { key: 'id', label: '订单号' },
          { key: 'user', label: '用户' },
          { key: 'product', label: '商品' },
          { key: 'amount', label: '金额', render: function(v) { return '\u00A5' + (v / 100).toFixed(2) } },
          { key: 'status', label: '状态', render: function(v) {
            return React.createElement('span', { className: 'dash-badge ' + getStatusClass(v) }, STATUS_LABELS[v] || v)
          }},
          { key: 'time', label: '时间' },
          { key: 'id', label: '操作', render: function(v) {
            return React.createElement('button', { className: 'dash-action-btn' }, '查看')
          }}
        ],
        data: MOCK_ORDERS,
        emptyText: '暂无订单数据'
      })
    )
  }

  var renderPayments = function() {
    return React.createElement('div', null,
      React.createElement('h2', null, '支付管理'),
      React.createElement(AdminTable, {
        columns: [
          { key: 'id', label: '支付ID' },
          { key: 'method', label: '支付方式' },
          { key: 'amount', label: '金额', render: function(v) { return '\u00A5' + (v / 100).toFixed(2) } },
          { key: 'status', label: '状态', render: function(v) {
            return React.createElement('span', { className: 'dash-badge ' + getStatusClass(v) }, STATUS_LABELS[v] || v)
          }},
          { key: 'time', label: '时间' }
        ],
        data: MOCK_PAYMENTS,
        emptyText: '暂无支付记录'
      })
    )
  }

  var renderFeedbacks = function() {
    return React.createElement('div', null,
      React.createElement('h2', null, '投诉处理'),
      React.createElement(AdminTable, {
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'user', label: '用户' },
          { key: 'type', label: '类型' },
          { key: 'title', label: '标题' },
          { key: 'status', label: '状态', render: function(v) {
            return React.createElement('span', { className: 'dash-badge ' + getStatusClass(v) }, STATUS_LABELS[v] || v)
          }},
          { key: 'time', label: '时间' },
          { key: 'id', label: '操作', render: function(v) {
            return React.createElement('button', { className: 'dash-action-btn' }, '处理')
          }}
        ],
        data: MOCK_FEEDBACKS,
        emptyText: '暂无反馈记录'
      })
    )
  }

  var renderCoupons = function() {
    return React.createElement('div', null,
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
        React.createElement('h2', null, '优惠券管理'),
        React.createElement('button', { className: 'dash-refresh-btn' }, '+ 创建优惠券')
      ),
      React.createElement(AdminTable, {
        columns: [
          { key: 'id', label: 'ID' },
          { key: 'code', label: '优惠码' },
          { key: 'discount', label: '优惠' },
          { key: 'min', label: '最低消费' },
          { key: 'usage', label: '使用量' },
          { key: 'status', label: '状态', render: function(v) {
            return React.createElement('span', { className: 'dash-badge ' + getStatusClass(v) }, STATUS_LABELS[v] || v)
          }},
          { key: 'id', label: '操作', render: function() {
            return React.createElement('button', { className: 'dash-action-btn' }, '编辑')
          }}
        ],
        data: MOCK_COUPONS,
        emptyText: '暂无优惠券'
      })
    )
  }

  var renderAnnouncements = function() {
    return React.createElement('div', null,
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } },
        React.createElement('h2', null, '公告管理'),
        React.createElement('button', { className: 'dash-refresh-btn' }, '+ 创建公告')
      ),
      React.createElement('div', { className: 'dash-table-wrap' },
        React.createElement('table', { className: 'dash-table' },
          React.createElement('thead', null,
            React.createElement('tr', null,
              React.createElement('th', { className: 'dash-table-th' }, 'ID'),
              React.createElement('th', { className: 'dash-table-th' }, '标题'),
              React.createElement('th', { className: 'dash-table-th' }, '状态'),
              React.createElement('th', { className: 'dash-table-th' }, '创建时间'),
              React.createElement('th', { className: 'dash-table-th' }, '操作')
            )
          ),
          React.createElement('tbody', null,
            React.createElement('tr', { className: 'dash-table-row' },
              React.createElement('td', { className: 'dash-table-td' }, 'ann-001'),
              React.createElement('td', { className: 'dash-table-td' }, '系统升级通知'),
              React.createElement('td', { className: 'dash-table-td' },
                React.createElement('span', { className: 'dash-badge dash-status-paid' }, '已发布')
              ),
              React.createElement('td', { className: 'dash-table-td' }, '2026-07-10'),
              React.createElement('td', { className: 'dash-table-td' },
                React.createElement('button', { className: 'dash-action-btn' }, '编辑')
              )
            )
          )
        )
      )
    )
  }

  var renderStats = function() {
    return React.createElement('div', null,
      React.createElement('h2', null, '运营统计'),
      React.createElement('div', { className: 'dash-chart-grid' },
        React.createElement('div', { className: 'dash-chart-card' },
          React.createElement('div', { className: 'dash-chart-title' }, '用户增长趋势'),
          React.createElement('div', { className: 'dash-chart-container' },
            React.createElement(LineChart, { data: dailyData, lines: userLines })
          )
        ),
        React.createElement('div', { className: 'dash-chart-card' },
          React.createElement('div', { className: 'dash-chart-title' }, '订单趋势'),
          React.createElement('div', { className: 'dash-chart-container' },
            React.createElement(BarChart, { data: dailyData, dataKey: 'orders', color: '#60a5fa' })
          )
        ),
        React.createElement('div', { className: 'dash-chart-card' },
          React.createElement('div', { className: 'dash-chart-title' }, '收入趋势（分）'),
          React.createElement('div', { className: 'dash-chart-container' },
            React.createElement(AreaChart, { data: dailyData, dataKey: 'revenue', color: '#d4a843' })
          )
        )
      ),
      React.createElement('div', { className: 'dash-system-section', style: { marginTop: 24 } },
        React.createElement('h2', null, '核心指标'),
        React.createElement('div', { className: 'dash-system-grid' },
          React.createElement(Gauge, { value: metrics.retentionRate, max: 100, label: '次日留存率', colorClass: cacheColorClass }),
          React.createElement(Gauge, { value: metrics.paymentRate, max: 100, label: '支付转化率', colorClass: errorColorClass }),
          React.createElement(Gauge, { value: metrics.apiErrorRate, max: 5, label: 'API 错误率', colorClass: errorColorClass }),
          React.createElement(Gauge, { value: metrics.cacheHitRate, max: 100, label: '缓存命中率', colorClass: cacheColorClass })
        )
      )
    )
  }

  var renderCommercialKPI = function() {
    return React.createElement('div', null,
      React.createElement('h2', null, '商业 KPI'),
      React.createElement('div', { className: 'dash-kpi-grid' },
        React.createElement('div', { className: 'dash-kpi-card highlight' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日收入'),
          React.createElement('div', { className: 'dash-kpi-value' }, '\u00A52,847.00')
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日订单'),
          React.createElement('div', { className: 'dash-kpi-value' }, '47')
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日退款'),
          React.createElement('div', { className: 'dash-kpi-value' }, '3')
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '活跃用户'),
          React.createElement('div', { className: 'dash-kpi-value' }, '1,234')
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '会员增长'),
          React.createElement('div', { className: 'dash-kpi-value' }, '+23')
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, 'ARPU'),
          React.createElement('div', { className: 'dash-kpi-value' }, '\u00A518.50')
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, 'LTV'),
          React.createElement('div', { className: 'dash-kpi-value' }, '\u00A5156.00')
        ),
        React.createElement('div', { className: 'dash-kpi-card highlight' },
          React.createElement('div', { className: 'dash-kpi-label' }, 'ROI'),
          React.createElement('div', { className: 'dash-kpi-value' }, '3.2x')
        )
      ),
      React.createElement('div', { className: 'dash-chart-grid', style: { marginTop: 24 } },
        React.createElement('div', { className: 'dash-chart-card' },
          React.createElement('div', { className: 'dash-chart-title' }, '7天收入趋势（分）'),
          React.createElement('div', { className: 'dash-chart-container' },
            React.createElement(AreaChart, { data: MOCK_COMMERCIAL_DAILY, dataKey: 'revenue', color: '#d4a843' })
          )
        ),
        React.createElement('div', { className: 'dash-chart-card' },
          React.createElement('div', { className: 'dash-chart-title' }, '会员增长趋势'),
          React.createElement('div', { className: 'dash-chart-container' },
            React.createElement(BarChart, { data: MOCK_COMMERCIAL_DAILY, dataKey: 'members', color: '#34d399' })
          )
        ),
        React.createElement('div', { className: 'dash-chart-card' },
          React.createElement('div', { className: 'dash-chart-title' }, 'ARPU 趋势（分）'),
          React.createElement('div', { className: 'dash-chart-container' },
            React.createElement(LineChart, { data: MOCK_COMMERCIAL_DAILY, lines: [{ key: 'arpu', color: '#60a5fa', label: 'ARPU' }] })
          )
        )
      )
    )
  }

  var renderTabContent = function() {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'commercial': return renderCommercialKPI()
      case 'users': return renderUsers()
      case 'orders': return renderOrders()
      case 'payments': return renderPayments()
      case 'feedbacks': return renderFeedbacks()
      case 'coupons': return renderCoupons()
      case 'announcements': return renderAnnouncements()
      case 'stats': return renderStats()
      default: return renderOverview()
    }
  }

  return React.createElement('div', { className: 'dashboard-page' },
    // 标题
    React.createElement('h1', null, '运营后台'),

    // 管理Tab导航
    React.createElement('div', { className: 'dash-admin-tabs' },
      ADMIN_TABS.map(function(tab) {
        return React.createElement('button', {
          key: tab.key,
          className: 'dash-admin-tab' + (activeTab === tab.key ? ' active' : ''),
          onClick: function() { setActiveTab(tab.key) }
        }, tab.label)
      })
    ),

    // Tab 内容
    renderTabContent()
  )
}

export default Dashboard
