import { DashboardMetrics, DailyMetric, FeatureUsage } from './types'

function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min))
}

function formatDate(date) {
  var m = date.getMonth() + 1
  var d = date.getDate()
  var mm = m < 10 ? '0' + m : '' + m
  var dd = d < 10 ? '0' + d : '' + d
  return '2026-' + mm + '-' + dd
}

var POPULAR_FEATURES: FeatureUsage[] = [
  { name: '八字排盘', count: 8234, percent: 42, trend: 'up' },
  { name: '每日卦运', count: 5491, percent: 28, trend: 'stable' },
  { name: '风水堪测', count: 2940, percent: 15, trend: 'down' },
  { name: '六爻占卜', count: 1960, percent: 10, trend: 'up' },
  { name: '其他', count: 980, percent: 5, trend: 'stable' }
]

function generateDailyMetrics(): DailyMetric[] {
  var result = []
  var today = new Date(2026, 6, 12) // 2026年7月12日
  var baseDau = 1750
  var baseOrders = 38
  var baseErrors = 1.2
  var baseCache = 90

  for (var i = 29; i >= 0; i--) {
    var d = new Date(today)
    d.setDate(d.getDate() - i)

    // 周末DAU略高
    var dayOfWeek = d.getDay()
    var weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 150 : 0
    // 整体上升趋势（最近几天略高）
    var trendBoost = Math.round((30 - i) * 3)

    var dau = baseDau + weekendBoost + trendBoost + randomBetween(-200, 200)
    var wau = 4750 + trendBoost * 2 + randomBetween(-300, 300)
    var mau = 13500 + trendBoost * 3 + randomBetween(-800, 800)
    var orders = baseOrders + trendBoost * 0.3 + randomBetween(-10, 10)
    var revenue = Math.round(orders * (2800 + randomBetween(-500, 500)))
    var errors = Math.max(0.3, baseErrors + randomBetween(-5, 5) / 10)
    var cacheHit = Math.min(98, Math.max(85, baseCache + randomBetween(-3, 3)))

    result.push({
      date: formatDate(d),
      dau: dau,
      wau: wau,
      mau: mau,
      orders: Math.max(5, Math.round(orders)),
      revenue: revenue,
      errors: Math.round(errors * 100) / 100,
      cacheHit: Math.round(cacheHit * 10) / 10
    })
  }

  return result
}

var dailyData = generateDailyMetrics()

function computeMetrics(daily: DailyMetric[]): DashboardMetrics {
  var latest = daily[daily.length - 1]
  var yesterday = daily[daily.length - 2]
  var totalOrders = 0
  var totalRevenue = 0
  var totalErrors = 0
  var totalCacheHit = 0

  for (var i = 0; i < daily.length; i++) {
    totalOrders += daily[i].orders
    totalRevenue += daily[i].revenue
    totalErrors += daily[i].errors
    totalCacheHit += daily[i].cacheHit
  }

  var avgOrderValue = totalOrders > 0
    ? Math.round(totalRevenue / totalOrders)
    : 0

  var paymentRate = latest.dau > 0
    ? Math.round(latest.orders / latest.dau * 10000) / 100
    : 0

  var avgErrors = Math.round(totalErrors / daily.length * 100) / 100
  var avgCache = Math.round(totalCacheHit / daily.length * 10) / 10

  var newUserCount = 0
  for (var j = 0; j < daily.length; j++) {
    newUserCount += randomBetween(30, 80)
  }
  newUserCount = Math.round(newUserCount / daily.length)

  return {
    dau: latest.dau,
    wau: latest.wau,
    mau: latest.mau,
    retentionRate: 38.5,
    newUserCount: newUserCount,
    paymentRate: paymentRate,
    totalOrders: totalOrders,
    totalRevenue: totalRevenue,
    averageOrderValue: avgOrderValue,
    popularFeatures: POPULAR_FEATURES,
    averageAnalysisTime: randomBetween(1200, 1800),
    apiErrorRate: avgErrors,
    cacheHitRate: avgCache,
    serverStatus: 'healthy',
    serverUptime: 99.97
  }
}

export function getDashboardMetrics(): DashboardMetrics {
  return computeMetrics(dailyData)
}

export function getDailyMetrics(): DailyMetric[] {
  return dailyData.slice()
}
