/**
 * V1.2 管理员分析路由
 *
 *   GET /overview     总览指标
 *   GET /daily        每日指标（?days=30）
 *   GET /retention    留存率
 *   GET /conversion   转化率
 *   GET /trends       趋势数据（?days=30）
 *
 * 使用 service_role key 查询 Supabase 真实数据，全部 authRequired。
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authRequired } from '../middleware/auth'
import { requireAdmin } from '../middleware/permission'
import { ApiError } from '../middleware/error'

var app = new Hono()

/** 获取 Supabase Admin 客户端（服务端使用 service_role key） */
async function getSupabaseAdmin() {
  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !supabaseServiceKey) {
    throw ApiError.internal('缺少 Supabase 环境变量配置')
  }
  var { createClient } = await import('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseServiceKey)
}

/** 获取今日 00:00:00 的 ISO 字符串（UTC） */
function getTodayStart(): string {
  var d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString()
}

/** 获取 N 天前的 00:00:00 ISO 字符串（UTC） */
function getDaysAgoStart(days: number): string {
  var d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

/** 7天前 00:00:00 */
function get7dAgoStart(): string {
  return getDaysAgoStart(7)
}

/** 安全获取 count */
function safeCount(result: any): number {
  if (result && result.count !== undefined && result.count !== null) {
    return result.count
  }
  return 0
}

/** 格式化日期为 YYYY-MM-DD（UTC） */
function formatDateStr(isoStr: string): string {
  var d = new Date(isoStr)
  var y = d.getUTCFullYear()
  var m = String(d.getUTCMonth() + 1).padStart(2, '0')
  var day = String(d.getUTCDate()).padStart(2, '0')
  return y + '-' + m + '-' + day
}

// ───────────────────────────────────────────────
//  GET /overview
// ───────────────────────────────────────────────

app.get('/overview', authRequired, requireAdmin(), async function(c) {
  var supabase = await getSupabaseAdmin()
  var todayStart = getTodayStart()
  var sevenDayStart = get7dAgoStart()

  // 并行查询所有指标
  var promises = [
    // 1. totalUsers
    supabase.from('users').select('id', { count: 'exact', head: true }),

    // 2. newUsersToday
    supabase.from('users').select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart),

    // 3. newUsers7d
    supabase.from('users').select('id', { count: 'exact', head: true })
      .gte('created_at', sevenDayStart),

    // 4. totalCharts
    supabase.from('charts').select('id', { count: 'exact', head: true }),

    // 5. chartsToday
    supabase.from('charts').select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart),

    // 6. totalAnalysis
    supabase.from('analysis_history').select('id', { count: 'exact', head: true }),

    // 7. freeTrials (analysis_type='basic')
    supabase.from('analysis_history').select('id', { count: 'exact', head: true })
      .eq('analysis_type', 'basic'),

    // 8. memberPurchases (orders WHERE status='paid' AND product_name LIKE '%会员%' 去重 user_id)
    supabase.from('orders').select('user_id')
      .eq('status', 'paid')
      .ilike('product_name', '%会员%'),

    // 9. totalRevenue
    supabase.from('v11_payments').select('amount_cents')
      .eq('status', 'paid'),

    // 10. revenueToday
    supabase.from('v11_payments').select('amount_cents')
      .eq('status', 'paid')
      .gte('paid_at', todayStart),

    // 11. pdfDownloads
    supabase.from('monitoring_logs').select('id', { count: 'exact', head: true })
      .eq('category', 'pdf_download'),

    // 12. shareCount
    supabase.from('monitoring_logs').select('id', { count: 'exact', head: true })
      .eq('category', 'share'),

    // 13. paidMembers
    supabase.from('user_profiles').select('id', { count: 'exact', head: true })
      .neq('membership_tier', 'free')
  ]

  var results = await Promise.all(promises) as any[]

  // totalUsers
  var totalUsers = safeCount(results[0])
  // newUsersToday
  var newUsersToday = safeCount(results[1])
  // newUsers7d
  var newUsers7d = safeCount(results[2])
  // totalCharts
  var totalCharts = safeCount(results[3])
  // chartsToday
  var chartsToday = safeCount(results[4])
  // totalAnalysis
  var totalAnalysis = safeCount(results[5])
  // freeTrials
  var freeTrials = safeCount(results[6])

  // memberPurchases - 去重 user_id
  var memberOrdersData = results[7].data || []
  var memberUserIds: Record<string, boolean> = {}
  for (var mi = 0; mi < memberOrdersData.length; mi++) {
    if (memberOrdersData[mi].user_id) {
      memberUserIds[memberOrdersData[mi].user_id] = true
    }
  }
  var memberPurchases = Object.keys(memberUserIds).length

  // totalRevenue
  var totalPaymentsData = results[8].data || []
  var totalRevenue = 0
  for (var ri = 0; ri < totalPaymentsData.length; ri++) {
    totalRevenue += (totalPaymentsData[ri].amount_cents || 0)
  }

  // revenueToday
  var todayPaymentsData = results[9].data || []
  var revenueToday = 0
  for (var rti = 0; rti < todayPaymentsData.length; rti++) {
    revenueToday += (todayPaymentsData[rti].amount_cents || 0)
  }

  // pdfDownloads
  var pdfDownloads = safeCount(results[10])
  // shareCount
  var shareCount = safeCount(results[11])
  // paidMembers
  var paidMembers = safeCount(results[12])

  return c.json({
    totalUsers: totalUsers,
    newUsersToday: newUsersToday,
    newUsers7d: newUsers7d,
    totalCharts: totalCharts,
    chartsToday: chartsToday,
    totalAnalysis: totalAnalysis,
    freeTrials: freeTrials,
    memberPurchases: memberPurchases,
    totalRevenue: totalRevenue,
    revenueToday: revenueToday,
    pdfDownloads: pdfDownloads,
    shareCount: shareCount,
    paidMembers: paidMembers
  })
})

// ───────────────────────────────────────────────
//  GET /daily?days=30
// ───────────────────────────────────────────────

app.get('/daily', authRequired, requireAdmin(), async function(c) {
  var daysParam = c.req.query('days') || '30'
  var days = parseInt(daysParam, 10)
  if (isNaN(days) || days < 1) {
    days = 30
  }
  if (days > 90) {
    days = 90
  }

  var supabase = await getSupabaseAdmin()
  var startDate = getDaysAgoStart(days)

  // 并行查询各表在时间范围内的数据
  var promises = [
    // users - 每日新注册
    supabase.from('users').select('id, created_at').gte('created_at', startDate),
    // charts - 每日排盘 + 用于近似 logins
    supabase.from('charts').select('user_id, created_at').gte('created_at', startDate),
    // analysis_history - 每日分析
    supabase.from('analysis_history').select('id, analysis_type, user_id, created_at').gte('created_at', startDate),
    // orders - 每日订单
    supabase.from('orders').select('id, amount_cents, created_at').eq('status', 'paid').gte('created_at', startDate),
    // monitoring_logs - pdf_download
    supabase.from('monitoring_logs').select('id, created_at').eq('category', 'pdf_download').gte('created_at', startDate),
    // monitoring_logs - share
    supabase.from('monitoring_logs').select('id, created_at').eq('category', 'share').gte('created_at', startDate)
  ]

  var results = await Promise.all(promises)

  var usersData = (results[0].data || []) as Array<{ id: string; created_at: string }>
  var chartsData = (results[1].data || []) as Array<{ user_id: string; created_at: string }>
  var analysisData = (results[2].data || []) as Array<{ id: string; analysis_type: string; user_id: string; created_at: string }>
  var ordersData = (results[3].data || []) as Array<{ id: string; amount_cents: number; created_at: string }>
  var pdfData = (results[4].data || []) as Array<{ id: string; created_at: string }>
  var shareData = (results[5].data || []) as Array<{ id: string; created_at: string }>

  // 构建每日指标 map
  var dailyMap: Record<string, {
    newUsers: number
    logins: number
    charts: number
    analysis: number
    freeTrials: number
    orders: number
    revenue: number
    pdfDownloads: number
    shares: number
  }> = {}

  // 初始化每一天
  for (var di = 0; di < days; di++) {
    var d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - (days - 1 - di))
    var key = formatDateStr(d.toISOString())
    dailyMap[key] = {
      newUsers: 0,
      logins: 0,
      charts: 0,
      analysis: 0,
      freeTrials: 0,
      orders: 0,
      revenue: 0,
      pdfDownloads: 0,
      shares: 0
    }
  }

  // 聚合 users
  for (var ui = 0; ui < usersData.length; ui++) {
    var dateKey = formatDateStr(usersData[ui].created_at)
    if (dailyMap[dateKey]) {
      dailyMap[dateKey].newUsers++
    }
  }

  // 聚合 charts + 近似 logins（按 user_id 去重）
  var chartsLoginMap: Record<string, Record<string, boolean>> = {}
  for (var ci = 0; ci < chartsData.length; ci++) {
    var cDateKey = formatDateStr(chartsData[ci].created_at)
    if (dailyMap[cDateKey]) {
      dailyMap[cDateKey].charts++
      if (!chartsLoginMap[cDateKey]) {
        chartsLoginMap[cDateKey] = {}
      }
      if (chartsData[ci].user_id) {
        chartsLoginMap[cDateKey][chartsData[ci].user_id] = true
      }
    }
  }

  // 聚合 analysis
  var analysisLoginMap: Record<string, Record<string, boolean>> = {}
  for (var ai = 0; ai < analysisData.length; ai++) {
    var aDateKey = formatDateStr(analysisData[ai].created_at)
    if (dailyMap[aDateKey]) {
      dailyMap[aDateKey].analysis++
      if (analysisData[ai].analysis_type === 'basic') {
        dailyMap[aDateKey].freeTrials++
      }
      if (!analysisLoginMap[aDateKey]) {
        analysisLoginMap[aDateKey] = {}
      }
      if (analysisData[ai].user_id) {
        analysisLoginMap[aDateKey][analysisData[ai].user_id] = true
      }
    }
  }

  // 计算 logins = charts 和 analysis 中去重 user_id 的并集
  var allDates = Object.keys(dailyMap)
  for (var ld = 0; ld < allDates.length; ld++) {
    var ldKey = allDates[ld]
    var loginUserSet: Record<string, boolean> = {}
    var cUsers = chartsLoginMap[ldKey]
    if (cUsers) {
      var cUserKeys = Object.keys(cUsers)
      for (var cuk = 0; cuk < cUserKeys.length; cuk++) {
        loginUserSet[cUserKeys[cuk]] = true
      }
    }
    var aUsers = analysisLoginMap[ldKey]
    if (aUsers) {
      var aUserKeys = Object.keys(aUsers)
      for (var auk = 0; auk < aUserKeys.length; auk++) {
        loginUserSet[aUserKeys[auk]] = true
      }
    }
    dailyMap[ldKey].logins = Object.keys(loginUserSet).length
  }

  // 聚合 orders
  for (var oi = 0; oi < ordersData.length; oi++) {
    var oDateKey = formatDateStr(ordersData[oi].created_at)
    if (dailyMap[oDateKey]) {
      dailyMap[oDateKey].orders++
      dailyMap[oDateKey].revenue += (ordersData[oi].amount_cents || 0)
    }
  }

  // 聚合 pdf downloads
  for (var pi = 0; pi < pdfData.length; pi++) {
    var pDateKey = formatDateStr(pdfData[pi].created_at)
    if (dailyMap[pDateKey]) {
      dailyMap[pDateKey].pdfDownloads++
    }
  }

  // 聚合 shares
  for (var si = 0; si < shareData.length; si++) {
    var sDateKey = formatDateStr(shareData[si].created_at)
    if (dailyMap[sDateKey]) {
      dailyMap[sDateKey].shares++
    }
  }

  // 转为数组
  var dailyArray = []
  for (var dk = 0; dk < allDates.length; dk++) {
    var dateStr = allDates[dk]
    var metrics = dailyMap[dateStr]
    dailyArray.push({
      date: dateStr,
      newUsers: metrics.newUsers,
      logins: metrics.logins,
      charts: metrics.charts,
      analysis: metrics.analysis,
      freeTrials: metrics.freeTrials,
      orders: metrics.orders,
      revenue: metrics.revenue,
      pdfDownloads: metrics.pdfDownloads,
      shares: metrics.shares
    })
  }

  return c.json(dailyArray)
})

// ───────────────────────────────────────────────
//  GET /retention
// ───────────────────────────────────────────────

app.get('/retention', authRequired, requireAdmin(), async function(c) {
  var supabase = await getSupabaseAdmin()

  // 取最近 60 天的数据来计算留存（需要 30 天前的用户以及后续活跃）
  var startDate = getDaysAgoStart(60)

  // 从 charts 和 analysis_history 获取用户活跃日期
  var chartsPromise = supabase.from('charts').select('user_id, created_at').gte('created_at', startDate)
  var analysisPromise = supabase.from('analysis_history').select('user_id, created_at').gte('created_at', startDate)

  var results = await Promise.all([chartsPromise, analysisPromise])

  var chartsData = (results[0].data || []) as Array<{ user_id: string; created_at: string }>
  var analysisData = (results[1].data || []) as Array<{ user_id: string; created_at: string }>

  // 合并所有活跃记录，按 (date, user_id) 去重
  var activeByDate: Record<string, Record<string, boolean>> = {}

  for (var ci = 0; ci < chartsData.length; ci++) {
    var dateKey = formatDateStr(chartsData[ci].created_at)
    var uid = chartsData[ci].user_id
    if (uid) {
      if (!activeByDate[dateKey]) {
        activeByDate[dateKey] = {}
      }
      activeByDate[dateKey][uid] = true
    }
  }

  for (var ai = 0; ai < analysisData.length; ai++) {
    var aDateKey = formatDateStr(analysisData[ai].created_at)
    var aUid = analysisData[ai].user_id
    if (aUid) {
      if (!activeByDate[aDateKey]) {
        activeByDate[aDateKey] = {}
      }
      activeByDate[aDateKey][aUid] = true
    }
  }

  // 计算留存率
  function calcRetention(gapDays: number): number {
    // 取 (gapDays+1) 天前到 30 天前活跃的用户集合
    // 然后检查他们在 gapDays 天后是否仍然活跃
    var totalRetained = 0
    var totalCohort = 0

    // 采样 30 天的 cohort
    for (var offset = 30; offset >= 1; offset--) {
      var cohortDate = new Date()
      cohortDate.setUTCHours(0, 0, 0, 0)
      cohortDate.setUTCDate(cohortDate.getUTCDate() - (offset + gapDays - 1))
      var cohortKey = formatDateStr(cohortDate.toISOString())

      var checkDate = new Date()
      checkDate.setUTCHours(0, 0, 0, 0)
      checkDate.setUTCDate(checkDate.getUTCDate() - (offset - 1))
      var checkKey = formatDateStr(checkDate.toISOString())

      var cohortUsers = activeByDate[cohortKey]
      var checkUsers = activeByDate[checkKey]

      if (cohortUsers && Object.keys(cohortUsers).length > 0) {
        var cohortCount = Object.keys(cohortUsers).length
        var retainedCount = 0
        if (checkUsers) {
          var cohortUserKeys = Object.keys(cohortUsers)
          for (var k = 0; k < cohortUserKeys.length; k++) {
            if (checkUsers[cohortUserKeys[k]]) {
              retainedCount++
            }
          }
        }
        totalCohort += cohortCount
        totalRetained += retainedCount
      }
    }

    if (totalCohort === 0) {
      return 0
    }
    return Math.round(totalRetained / totalCohort * 10000) / 100
  }

  var day1Retention = calcRetention(1)
  var day7Retention = calcRetention(7)
  var day30Retention = calcRetention(30)

  return c.json({
    day1Retention: day1Retention,
    day7Retention: day7Retention,
    day30Retention: day30Retention
  })
})

// ───────────────────────────────────────────────
//  GET /conversion
// ───────────────────────────────────────────────

app.get('/conversion', authRequired, requireAdmin(), async function(c) {
  var supabase = await getSupabaseAdmin()

  // 并行查询
  var promises = [
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('analysis_history').select('user_id').eq('analysis_type', 'basic'),
    supabase.from('user_profiles').select('id, membership_tier').neq('membership_tier', 'free'),
    supabase.from('charts').select('id', { count: 'exact', head: true }),
    supabase.from('analysis_history').select('id', { count: 'exact', head: true })
  ]

  var results = await Promise.all(promises)

  var totalUsers = safeCount(results[0])

  // freeTrials - 去重 user_id
  var freeTrialData = (results[1].data || []) as Array<{ user_id: string }>
  var freeTrialUsers: Record<string, boolean> = {}
  for (var fi = 0; fi < freeTrialData.length; fi++) {
    if (freeTrialData[fi].user_id) {
      freeTrialUsers[freeTrialData[fi].user_id] = true
    }
  }
  var freeTrialUserCount = Object.keys(freeTrialUsers).length

  // paidMembers
  var paidProfiles = (results[2].data || []) as Array<{ id: string; membership_tier: string }>
  var totalPaidMembers = paidProfiles.length

  // VIP count
  var vipCount = 0
  for (var vi = 0; vi < paidProfiles.length; vi++) {
    if (paidProfiles[vi].membership_tier === 'vip') {
      vipCount++
    }
  }

  // proxy visits = totalCharts + totalAnalysis
  var totalCharts = safeCount(results[3])
  var totalAnalysis = safeCount(results[4])
  var proxyVisits = totalCharts + totalAnalysis

  // 计算转化率
  var registrationRate = proxyVisits > 0
    ? Math.round(totalUsers / proxyVisits * 10000) / 100
    : 0

  var freeTrialRate = totalUsers > 0
    ? Math.round(freeTrialUserCount / totalUsers * 10000) / 100
    : 0

  var memberConversionRate = totalUsers > 0
    ? Math.round(totalPaidMembers / totalUsers * 10000) / 100
    : 0

  var paidToVipRate = totalPaidMembers > 0
    ? Math.round(vipCount / totalPaidMembers * 10000) / 100
    : 0

  return c.json({
    registrationRate: registrationRate,
    freeTrialRate: freeTrialRate,
    memberConversionRate: memberConversionRate,
    paidToVipRate: paidToVipRate
  })
})

// ───────────────────────────────────────────────
//  GET /trends?days=30
// ───────────────────────────────────────────────

app.get('/trends', authRequired, requireAdmin(), async function(c) {
  var daysParam = c.req.query('days') || '30'
  var days = parseInt(daysParam, 10)
  if (isNaN(days) || days < 1) {
    days = 30
  }
  if (days > 90) {
    days = 90
  }

  var supabase = await getSupabaseAdmin()
  var startDate = getDaysAgoStart(days)

  // 并行查询
  var promises = [
    supabase.from('users').select('id, created_at').gte('created_at', startDate),
    supabase.from('orders').select('id, amount_cents, created_at').eq('status', 'paid').gte('created_at', startDate),
    supabase.from('charts').select('id, created_at').gte('created_at', startDate)
  ]

  var results = await Promise.all(promises)

  var usersData = (results[0].data || []) as Array<{ id: string; created_at: string }>
  var ordersData = (results[1].data || []) as Array<{ id: string; amount_cents: number; created_at: string }>
  var chartsData = (results[2].data || []) as Array<{ id: string; created_at: string }>

  // 初始化每日 map
  var dailyMap: Record<string, { users: number; revenue: number; orders: number; charts: number }> = {}

  for (var di = 0; di < days; di++) {
    var d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - (days - 1 - di))
    var key = formatDateStr(d.toISOString())
    dailyMap[key] = { users: 0, revenue: 0, orders: 0, charts: 0 }
  }

  for (var ui = 0; ui < usersData.length; ui++) {
    var dk = formatDateStr(usersData[ui].created_at)
    if (dailyMap[dk]) {
      dailyMap[dk].users++
    }
  }

  for (var oi = 0; oi < ordersData.length; oi++) {
    var odk = formatDateStr(ordersData[oi].created_at)
    if (dailyMap[odk]) {
      dailyMap[odk].orders++
      dailyMap[odk].revenue += (ordersData[oi].amount_cents || 0)
    }
  }

  for (var ci = 0; ci < chartsData.length; ci++) {
    var cdk = formatDateStr(chartsData[ci].created_at)
    if (dailyMap[cdk]) {
      dailyMap[cdk].charts++
    }
  }

  // daily 趋势
  var dailyArray = []
  var dates = Object.keys(dailyMap).sort()
  for (var i = 0; i < dates.length; i++) {
    var dateStr = dates[i]
    var dm = dailyMap[dateStr]
    dailyArray.push({
      date: dateStr,
      users: dm.users,
      revenue: dm.revenue,
      orders: dm.orders,
      charts: dm.charts
    })
  }

  // weekly 趋势
  var weeklyMap: Record<string, { weekStart: string; users: number; revenue: number; orders: number }> = {}
  for (var wi = 0; wi < dailyArray.length; wi++) {
    var dd = new Date(dailyArray[wi].date + 'T00:00:00Z')
    // 找到该周的周一
    var dayOfWeek = dd.getUTCDay()
    var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    var monday = new Date(dd)
    monday.setUTCDate(monday.getUTCDate() + mondayOffset)
    var weekKey = formatDateStr(monday.toISOString())

    if (!weeklyMap[weekKey]) {
      weeklyMap[weekKey] = { weekStart: weekKey, users: 0, revenue: 0, orders: 0 }
    }
    weeklyMap[weekKey].users += dailyArray[wi].users
    weeklyMap[weekKey].revenue += dailyArray[wi].revenue
    weeklyMap[weekKey].orders += dailyArray[wi].orders
  }

  var weeklyArray = []
  var weekKeys = Object.keys(weeklyMap).sort()
  for (var wk = 0; wk < weekKeys.length; wk++) {
    weeklyArray.push(weeklyMap[weekKeys[wk]])
  }

  // monthly 趋势
  var monthlyMap: Record<string, { month: string; users: number; revenue: number; orders: number }> = {}
  for (var mi = 0; mi < dailyArray.length; mi++) {
    var monthKey = dailyArray[mi].date.substring(0, 7) // YYYY-MM

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { month: monthKey, users: 0, revenue: 0, orders: 0 }
    }
    monthlyMap[monthKey].users += dailyArray[mi].users
    monthlyMap[monthKey].revenue += dailyArray[mi].revenue
    monthlyMap[monthKey].orders += dailyArray[mi].orders
  }

  var monthlyArray = []
  var monthKeys = Object.keys(monthlyMap).sort()
  for (var mk = 0; mk < monthKeys.length; mk++) {
    monthlyArray.push(monthlyMap[monthKeys[mk]])
  }

  return c.json({
    daily: dailyArray,
    weekly: weeklyArray,
    monthly: monthlyArray
  })
})

export default app