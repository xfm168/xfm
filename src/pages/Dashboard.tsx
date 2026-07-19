import React from 'react'
import useAdminDashboard from '../hooks/useAdminDashboard'
import useOpsAdmin from '../hooks/useOpsAdmin'
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
   Tab 常量
   ============================================ */

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

/* ============================================
   Dashboard 主页面
   ============================================ */

function Dashboard() {
  var result = useAdminDashboard()
  var status = result.status
  var overview = result.overview
  var dailyData = result.dailyData
  var retention = result.retention
  var conversion = result.conversion
  var trends = result.trends
  var error = result.error
  var refresh = result.refresh

  var tabHook = React.useState('overview')
  var activeTab = tabHook[0]
  var setActiveTab = tabHook[1]

  var opsResult = useOpsAdmin()
  var opsCoupons = opsResult.coupons
  var opsAnnouncements = opsResult.announcements
  var opsAddCoupon = opsResult.addCoupon
  var opsAddAnnouncement = opsResult.addAnnouncement
  var opsTogglePublish = opsResult.togglePublish

  // 运营工具 - 表单状态
  var showCouponFormHook = React.useState(false)
  var showCouponForm = showCouponFormHook[0]
  var setShowCouponForm = showCouponFormHook[1]

  var couponFormHook = React.useState({ discount_type: 'percent', discount_value: '10', max_uses: '100', min_order_cents: '0', applies_to: 'all', description: '' })
  var couponForm = couponFormHook[0]
  var setCouponForm = couponFormHook[1]

  var showAnnFormHook = React.useState(false)
  var showAnnForm = showAnnFormHook[0]
  var setShowAnnForm = showAnnFormHook[1]

  var annFormHook = React.useState({ title: '', content: '', type: 'notice' })
  var annForm = annFormHook[0]
  var setAnnForm = annFormHook[1]

  var makeInput = function(type: string, value: string, onChange: (v: string) => void, placeholder: string, width?: number) {
    var inputStyle: any = { padding: '6px 10px', borderRadius: 4, border: '1px solid #333', background: '#0d0d1a', color: '#eee', fontSize: 13 }
    if (width) inputStyle.width = width
    return React.createElement('input', {
      type: type,
      value: value,
      onChange: function(e: any) { onChange(e.target.value) },
      placeholder: placeholder,
      style: inputStyle
    })
  }

  var onCouponFieldChange = function(field: string, val: string) {
    setCouponForm(function(prev) {
      var next: any = {}
      for (var k in prev) { next[k] = (prev as any)[k] }
      next[field] = val
      return next
    })
  }

  var onAnnFieldChange = function(field: string, val: string) {
    setAnnForm(function(prev) {
      var next: any = {}
      for (var k in prev) { next[k] = (prev as any)[k] }
      next[field] = val
      return next
    })
  }

  var handleCreateCoupon = function() {
    opsAddCoupon({
      discount_type: couponForm.discount_type,
      discount_value: parseFloat(couponForm.discount_value) || 0,
      max_uses: parseInt(couponForm.max_uses, 10) || 100,
      min_order_cents: parseInt(couponForm.min_order_cents, 10) || 0,
      applies_to: couponForm.applies_to,
      description: couponForm.description || null
    })
    setShowCouponForm(false)
    setCouponForm({ discount_type: 'percent', discount_value: '10', max_uses: '100', min_order_cents: '0', applies_to: 'all', description: '' })
  }

  var handleCreateAnn = function() {
    if (!annForm.title || !annForm.content) return
    opsAddAnnouncement({
      title: annForm.title,
      content: annForm.content,
      type: annForm.type
    })
    setShowAnnForm(false)
    setAnnForm({ title: '', content: '', type: 'notice' })
  }

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
          onClick: refresh
        }, '重试')
      )
    )
  }

  // 近似 DAU from dailyData
  var todayLogins = 0

  if (dailyData.length > 0) {
    todayLogins = dailyData[dailyData.length - 1].logins
  }

  // 今日订单和收入
  var todayOrders = 0
  var todayRevenue = 0
  if (dailyData.length > 0) {
    todayOrders = dailyData[dailyData.length - 1].orders
    todayRevenue = dailyData[dailyData.length - 1].revenue
  }

  // 留存和转化颜色
  var day1Retention = retention ? retention.day1Retention : 0
  var day7Retention = retention ? retention.day7Retention : 0
  var day30Retention = retention ? retention.day30Retention : 0
  var memberConvRate = conversion ? conversion.memberConversionRate : 0
  var freeTrialRate = conversion ? conversion.freeTrialRate : 0

  var retentionColor = day1Retention >= 30 ? 'good' : day1Retention >= 15 ? 'warning' : 'bad'
  var conversionColor = memberConvRate >= 10 ? 'good' : memberConvRate >= 3 ? 'warning' : 'bad'

  /* ========== 各管理Tab内容 ========== */

  var renderOverview = function() {
    // 趋势图线配置 - 使用 dailyData 中的 newUsers, charts, orders
    var overviewLines = [
      { key: 'newUsers', color: '#d4a843', label: '新用户' },
      { key: 'charts', color: '#60a5fa', label: '排盘' }
    ]

    return React.createElement(React.Fragment, null,
      // 标题区
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 } },
        React.createElement('h2', null, '数据概览'),
        React.createElement('button', {
          className: 'dash-refresh-btn',
          onClick: refresh
        }, '\u21bb 刷新')
      ),
      React.createElement('div', { className: 'dash-subtitle' }, '数据概览 \u00B7 最近30天'),

      // KPI 卡片行
      React.createElement('div', { className: 'dash-kpi-grid' },
        React.createElement('div', { className: 'dash-kpi-card highlight' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日排盘'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.chartsToday : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日注册'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.newUsersToday : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '会员总数'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.paidMembers : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card highlight' },
          React.createElement('div', { className: 'dash-kpi-label' }, '总收入'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatMoney(overview ? overview.totalRevenue : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日收入'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatMoney(overview ? overview.revenueToday : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, 'PDF下载'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.pdfDownloads : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '分享次数'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.shareCount : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '总用户'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.totalUsers : 0))
        )
      ),

      // 趋势图表
      React.createElement('div', { className: 'dash-charts-section' },
        React.createElement('h2', null, '趋势图表'),
        React.createElement('div', { className: 'dash-chart-grid' },
          // 用户增长趋势 - 折线图
          React.createElement('div', { className: 'dash-chart-card' },
            React.createElement('div', { className: 'dash-chart-title' }, '用户增长趋势'),
            React.createElement('div', { className: 'dash-chart-container' },
              React.createElement(LineChart, { data: dailyData, lines: overviewLines })
            ),
            React.createElement('div', { className: 'dash-chart-legend' },
              React.createElement('span', { className: 'dash-legend-item' },
                React.createElement('span', { className: 'dash-legend-color', style: { background: '#d4a843' } }),
                '新用户'
              ),
              React.createElement('span', { className: 'dash-legend-item' },
                React.createElement('span', { className: 'dash-legend-color', style: { background: '#60a5fa' } }),
                '排盘'
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

      // 留存和转化指标
      React.createElement('div', { className: 'dash-system-section' },
        React.createElement('h2', null, '核心指标'),
        React.createElement('div', { className: 'dash-system-grid' },
          React.createElement(Gauge, { value: day1Retention, max: 100, label: '次日留存率', colorClass: retentionColor }),
          React.createElement(Gauge, { value: day7Retention, max: 100, label: '7日留存率', colorClass: retentionColor }),
          React.createElement(Gauge, { value: memberConvRate, max: 100, label: '会员转化率', colorClass: conversionColor }),
          React.createElement(Gauge, { value: freeTrialRate, max: 100, label: '免费体验率', colorClass: 'neutral' })
        )
      )
    )
  }

  var renderCommercialKPI = function() {
    // 使用 trends.weekly 和 trends.monthly 绘制图表
    var trendDaily = (trends && trends.daily) ? trends.daily : dailyData
    var trendWeekly = (trends && trends.weekly) ? trends.weekly : []

    // weekly 图表需要 date 字段
    var weeklyChartData = trendWeekly.map(function(w) {
      return { date: w.weekStart, revenue: w.revenue, orders: w.orders, newUsers: w.users, logins: 0, charts: 0, analysis: 0, freeTrials: 0, pdfDownloads: 0, shares: 0 }
    })

    return React.createElement('div', null,
      React.createElement('h2', null, '商业 KPI'),
      React.createElement('div', { className: 'dash-kpi-grid' },
        React.createElement('div', { className: 'dash-kpi-card highlight' },
          React.createElement('div', { className: 'dash-kpi-label' }, '总收入'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatMoney(overview ? overview.totalRevenue : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日收入'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatMoney(overview ? overview.revenueToday : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日订单'),
          React.createElement('div', { className: 'dash-kpi-value' }, '' + todayOrders)
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日活跃'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(todayLogins))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '付费会员'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.paidMembers : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '会员购买人数'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.memberPurchases : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, 'PDF下载'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.pdfDownloads : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '分享次数'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.shareCount : 0))
        )
      ),
      React.createElement('div', { className: 'dash-chart-grid', style: { marginTop: 24 } },
        React.createElement('div', { className: 'dash-chart-card' },
          React.createElement('div', { className: 'dash-chart-title' }, '收入趋势（分）'),
          React.createElement('div', { className: 'dash-chart-container' },
            React.createElement(AreaChart, { data: trendDaily, dataKey: 'revenue', color: '#d4a843' })
          )
        ),
        React.createElement('div', { className: 'dash-chart-card' },
          React.createElement('div', { className: 'dash-chart-title' }, '订单趋势'),
          React.createElement('div', { className: 'dash-chart-container' },
            React.createElement(BarChart, { data: trendDaily, dataKey: 'orders', color: '#34d399' })
          )
        ),
        React.createElement('div', { className: 'dash-chart-card' },
          React.createElement('div', { className: 'dash-chart-title' }, '周收入趋势（分）'),
          React.createElement('div', { className: 'dash-chart-container' },
            React.createElement(AreaChart, { data: weeklyChartData, dataKey: 'revenue', color: '#60a5fa' })
          )
        )
      )
    )
  }

  var renderUsers = function() {
    return React.createElement('div', null,
      React.createElement('h2', null, '用户管理'),
      React.createElement('div', { className: 'dash-kpi-grid', style: { marginBottom: 24 } },
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '总用户数'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.totalUsers : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日新注册'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.newUsersToday : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '7天新注册'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.newUsers7d : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '付费会员'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.paidMembers : 0))
        )
      ),
      React.createElement('div', { className: 'dash-chart-card', style: { padding: '40px 0', textAlign: 'center' } },
        React.createElement('div', { style: { color: '#888', fontSize: 14 } }, '用户列表功能将在 Stage 8 实现')
      )
    )
  }

  var renderOrders = function() {
    return React.createElement('div', null,
      React.createElement('h2', null, '订单管理'),
      React.createElement('div', { className: 'dash-kpi-grid', style: { marginBottom: 24 } },
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日订单'),
          React.createElement('div', { className: 'dash-kpi-value' }, '' + todayOrders)
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日收入'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatMoney(todayRevenue))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '总收入'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatMoney(overview ? overview.totalRevenue : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '会员购买人数'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.memberPurchases : 0))
        )
      ),
      React.createElement('div', { className: 'dash-chart-card', style: { padding: '40px 0', textAlign: 'center' } },
        React.createElement('div', { style: { color: '#888', fontSize: 14 } }, '订单列表功能将在 Stage 8 实现')
      )
    )
  }

  var renderPayments = function() {
    return React.createElement('div', null,
      React.createElement('h2', null, '支付管理'),
      React.createElement('div', { className: 'dash-kpi-grid', style: { marginBottom: 24 } },
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '总收入'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatMoney(overview ? overview.totalRevenue : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '今日收入'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatMoney(overview ? overview.revenueToday : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '免费体验次数'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.freeTrials : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '总排盘次数'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.totalCharts : 0))
        )
      ),
      React.createElement('div', { className: 'dash-chart-card', style: { padding: '40px 0', textAlign: 'center' } },
        React.createElement('div', { style: { color: '#888', fontSize: 14 } }, '支付列表功能将在 Stage 8 实现')
      )
    )
  }

  var renderFeedbacks = function() {
    return React.createElement('div', null,
      React.createElement('h2', null, '投诉处理'),
      React.createElement('div', { className: 'dash-kpi-grid', style: { marginBottom: 24 } },
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '总分析次数'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.totalAnalysis : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, 'PDF下载'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.pdfDownloads : 0))
        ),
        React.createElement('div', { className: 'dash-kpi-card' },
          React.createElement('div', { className: 'dash-kpi-label' }, '分享次数'),
          React.createElement('div', { className: 'dash-kpi-value' }, formatNumber(overview ? overview.shareCount : 0))
        )
      ),
      React.createElement('div', { className: 'dash-chart-card', style: { padding: '40px 0', textAlign: 'center' } },
        React.createElement('div', { style: { color: '#888', fontSize: 14 } }, '反馈列表功能将在 Stage 8 实现')
      )
    )
  }

  var renderCoupons = function() {
    var couponCols = [
      { key: 'code', label: '券码' },
      { key: 'discount_type', label: '折扣类型', render: function(v) {
        return v === 'percent' ? '百分比' : '固定金额'
      }},
      { key: 'discount_value', label: '折扣值', render: function(v, row) {
        return row.discount_type === 'percent' ? v + '%' : '\u00a5' + v
      }},
      { key: 'min_order_cents', label: '最低消费', render: function(v) {
        return '\u00a5' + (v / 100).toFixed(2)
      }},
      { key: 'max_uses', label: '总限额' },
      { key: 'used_count', label: '已使用' },
      { key: 'is_active', label: '状态', render: function(v) {
        return v ? '\u2713 启用' : '\u2717 停用'
      }},
      { key: 'applies_to', label: '适用范围' }
    ]

    var formEl = null
    if (showCouponForm) {
      formEl = React.createElement('div', { className: 'dash-chart-card', style: { padding: 16, marginBottom: 16 } },
        React.createElement('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' } },
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 12, color: '#999', marginBottom: 4 } }, '折扣类型'),
            React.createElement('select', {
              value: couponForm.discount_type,
              onChange: function(e: any) { onCouponFieldChange('discount_type', e.target.value) },
              style: { padding: '6px 10px', borderRadius: 4, border: '1px solid #333', background: '#0d0d1a', color: '#eee', fontSize: 13 }
            },
              React.createElement('option', { value: 'percent' }, '百分比'),
              React.createElement('option', { value: 'fixed' }, '固定金额')
            )
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 12, color: '#999', marginBottom: 4 } }, '折扣值'),
            makeInput('number', couponForm.discount_value, function(v) { onCouponFieldChange('discount_value', v) }, '如 10', 80)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 12, color: '#999', marginBottom: 4 } }, '总限额'),
            makeInput('number', couponForm.max_uses, function(v) { onCouponFieldChange('max_uses', v) }, '100', 80)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 12, color: '#999', marginBottom: 4 } }, '最低消费(分)'),
            makeInput('number', couponForm.min_order_cents, function(v) { onCouponFieldChange('min_order_cents', v) }, '0', 100)
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 12, color: '#999', marginBottom: 4 } }, '适用范围'),
            React.createElement('select', {
              value: couponForm.applies_to,
              onChange: function(e: any) { onCouponFieldChange('applies_to', e.target.value) },
              style: { padding: '6px 10px', borderRadius: 4, border: '1px solid #333', background: '#0d0d1a', color: '#eee', fontSize: 13 }
            },
              React.createElement('option', { value: 'all' }, '全部'),
              React.createElement('option', { value: 'membership' }, '会员'),
              React.createElement('option', { value: 'report' }, '报告'),
              React.createElement('option', { value: 'addon' }, '附加服务')
            )
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 12, color: '#999', marginBottom: 4 } }, '描述'),
            makeInput('text', couponForm.description, function(v) { onCouponFieldChange('description', v) }, '可选描述', 200)
          ),
          React.createElement('button', {
            className: 'dash-refresh-btn',
            onClick: handleCreateCoupon
          }, '\u2713 创建'),
          React.createElement('button', {
            className: 'dash-refresh-btn',
            onClick: function() { setShowCouponForm(false) }
          }, '\u2717 取消')
        )
      )
    }

    return React.createElement('div', null,
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
        React.createElement('h2', null, '优惠券管理'),
        React.createElement('button', {
          className: 'dash-refresh-btn',
          onClick: function() { setShowCouponForm(!showCouponForm) }
        }, showCouponForm ? '收起' : '+ 新建优惠券')
      ),
      formEl,
      React.createElement(AdminTable, { columns: couponCols, data: opsCoupons || [], emptyText: '暂无优惠券' })
    )
  }

  var renderAnnouncements = function() {
    var annCols = [
      { key: 'title', label: '标题' },
      { key: 'type', label: '类型', render: function(v) {
        var typeMap: Record<string, string> = { notice: '通知', maintenance: '维护', promotion: '促销', feature: '新功能', urgent: '紧急' }
        return typeMap[v] || v
      }},
      { key: 'is_published', label: '状态', render: function(v) {
        return v ? '\u2713 已发布' : '\u2717 草稿'
      }},
      { key: 'published_at', label: '发布时间', render: function(v) {
        return v ? v.slice(0, 16).replace('T', ' ') : '-'
      }},
      { key: 'created_at', label: '创建时间', render: function(v) {
        return v ? v.slice(0, 16).replace('T', ' ') : '-'
      }},
      { key: '_action', label: '操作', render: function(_v, row) {
        return React.createElement('button', {
          className: 'dash-refresh-btn',
          onClick: function() { opsTogglePublish(row.id, !row.is_published) },
          style: { fontSize: 12, padding: '3px 10px' }
        }, row.is_published ? '取消发布' : '发布')
      }}
    ]

    var typeLabels: Record<string, string> = { notice: '通知', maintenance: '维护', promotion: '促销', feature: '新功能', urgent: '紧急' }
    var typeOptions = []
    for (var tk in typeLabels) {
      typeOptions.push(React.createElement('option', { key: tk, value: tk }, typeLabels[tk]))
    }

    var formEl = null
    if (showAnnForm) {
      formEl = React.createElement('div', { className: 'dash-chart-card', style: { padding: 16, marginBottom: 16 } },
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 10 } },
          React.createElement('div', { style: { display: 'flex', gap: 12, alignItems: 'flex-end' } },
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 12, color: '#999', marginBottom: 4 } }, '标题'),
              makeInput('text', annForm.title, function(v) { onAnnFieldChange('title', v) }, '公告标题', 300)
            ),
            React.createElement('div', null,
              React.createElement('div', { style: { fontSize: 12, color: '#999', marginBottom: 4 } }, '类型'),
              React.createElement('select', {
                value: annForm.type,
                onChange: function(e: any) { onAnnFieldChange('type', e.target.value) },
                style: { padding: '6px 10px', borderRadius: 4, border: '1px solid #333', background: '#0d0d1a', color: '#eee', fontSize: 13 }
              }, typeOptions)
            )
          ),
          React.createElement('div', null,
            React.createElement('div', { style: { fontSize: 12, color: '#999', marginBottom: 4 } }, '内容'),
            React.createElement('textarea', {
              value: annForm.content,
              onChange: function(e: any) { onAnnFieldChange('content', e.target.value) },
              placeholder: '公告内容',
              style: { width: '100%', minHeight: 80, padding: '8px 10px', borderRadius: 4, border: '1px solid #333', background: '#0d0d1a', color: '#eee', fontSize: 13, resize: 'vertical' }
            })
          ),
          React.createElement('div', { style: { display: 'flex', gap: 10 } },
            React.createElement('button', {
              className: 'dash-refresh-btn',
              onClick: handleCreateAnn
            }, '\u2713 创建'),
            React.createElement('button', {
              className: 'dash-refresh-btn',
              onClick: function() { setShowAnnForm(false) }
            }, '\u2717 取消')
          )
        )
      )
    }

    return React.createElement('div', null,
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 } },
        React.createElement('h2', null, '公告管理'),
        React.createElement('button', {
          className: 'dash-refresh-btn',
          onClick: function() { setShowAnnForm(!showAnnForm) }
        }, showAnnForm ? '收起' : '+ 新建公告')
      ),
      formEl,
      React.createElement(AdminTable, { columns: annCols, data: opsAnnouncements || [], emptyText: '暂无公告' })
    )
  }

  var renderStats = function() {
    // 转化率数据
    var regRate = conversion ? conversion.registrationRate : 0
    var paidToVipRate = conversion ? conversion.paidToVipRate : 0

    var regColor = regRate >= 50 ? 'good' : regRate >= 20 ? 'warning' : 'bad'
    var vipColor = paidToVipRate >= 50 ? 'good' : paidToVipRate >= 20 ? 'warning' : 'bad'

    // 趋势线配置
    var statsLines = [
      { key: 'newUsers', color: '#d4a843', label: '新用户' },
      { key: 'charts', color: '#60a5fa', label: '排盘' },
      { key: 'analysis', color: '#a78bfa', label: '分析' }
    ]

    return React.createElement('div', null,
      React.createElement('h2', null, '运营统计'),
      React.createElement('div', { className: 'dash-chart-grid' },
        React.createElement('div', { className: 'dash-chart-card' },
          React.createElement('div', { className: 'dash-chart-title' }, '每日活跃趋势'),
          React.createElement('div', { className: 'dash-chart-container' },
            React.createElement(LineChart, { data: dailyData, lines: statsLines })
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
        React.createElement('h2', null, '留存指标'),
        React.createElement('div', { className: 'dash-system-grid' },
          React.createElement(Gauge, { value: day1Retention, max: 100, label: '次日留存率', colorClass: retentionColor }),
          React.createElement(Gauge, { value: day7Retention, max: 100, label: '7日留存率', colorClass: retentionColor }),
          React.createElement(Gauge, { value: day30Retention, max: 100, label: '30日留存率', colorClass: retentionColor })
        )
      ),
      React.createElement('div', { className: 'dash-system-section', style: { marginTop: 24 } },
        React.createElement('h2', null, '转化指标'),
        React.createElement('div', { className: 'dash-system-grid' },
          React.createElement(Gauge, { value: regRate, max: 100, label: '注册转化率', colorClass: regColor }),
          React.createElement(Gauge, { value: freeTrialRate, max: 100, label: '免费体验率', colorClass: 'neutral' }),
          React.createElement(Gauge, { value: memberConvRate, max: 100, label: '会员转化率', colorClass: conversionColor }),
          React.createElement(Gauge, { value: paidToVipRate, max: 100, label: 'VIP升级率', colorClass: vipColor })
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