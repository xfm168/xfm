/**
 * 用户成长体系路由
 *
 * POST /api/growth/checkin         签到
 * GET  /api/growth/status          成长状态
 * GET  /api/growth/badges          徽章列表
 * POST /api/growth/record-chart    记录排盘
 * GET  /api/growth/leaderboard     排行榜
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authRequired } from '../middleware/auth'
import { ApiError } from '../middleware/error'

var app = new Hono()

// ────────────────────────────────────────────────
//  常量定义
// ────────────────────────────────────────────────

/** 徽章定义 */
var ALL_BADGES = [
  { badgeKey: 'CHECKIN_7', badgeName: '\u521d\u5165\u7384\u95e8', badgeDesc: '\u8fde\u7eed\u7b7e\u52307\u5929', badgeIcon: '\u{1F3D4}', requirement: '\u8fde\u7eed\u7b7e\u52307\u5929' },
  { badgeKey: 'CHECKIN_14', badgeName: '\u52e4\u4fee\u7cbe\u8fdb', badgeDesc: '\u8fde\u7eed\u7b7e\u523014\u5929', badgeIcon: '\u{1F52D}', requirement: '\u8fde\u7eed\u7b7e\u523014\u5929' },
  { badgeKey: 'CHECKIN_30', badgeName: '\u6301\u4e4b\u4ee5\u6052', badgeDesc: '\u8fde\u7eed\u7b7e\u523030\u5929', badgeIcon: '\u{1F525}', requirement: '\u8fde\u7eed\u7b7e\u523030\u5929' },
  { badgeKey: 'CHECKIN_60', badgeName: '\u5927\u6210\u5883\u754c', badgeDesc: '\u8fde\u7eed\u7b7e\u523060\u5929', badgeIcon: '\u{1F48E}', requirement: '\u8fde\u7eed\u7b7e\u523060\u5929' },
  { badgeKey: 'CHECKIN_100', badgeName: '\u767b\u5cf0\u9020\u6781', badgeDesc: '\u8fde\u7eed\u7b7e\u5230100\u5929', badgeIcon: '\u{1F451}', requirement: '\u8fde\u7eed\u7b7e\u5230100\u5929' },
  { badgeKey: 'CHART_FIRST', badgeName: '\u6392\u76d8\u65b0\u624b', badgeDesc: '\u9996\u6b21\u6392\u76d8', badgeIcon: '\u{1F4D0}', requirement: '\u5b8c\u62101\u6b21\u6392\u76d8' },
  { badgeKey: 'CHART_10', badgeName: '\u547d\u7406\u5b66\u5f92', badgeDesc: '\u6392\u76d810\u6b21', badgeIcon: '\u{1F4DA}', requirement: '\u5b8c\u621010\u6b21\u6392\u76d8' },
  { badgeKey: 'CHART_50', badgeName: '\u547d\u7406\u5b66\u8005', badgeDesc: '\u6392\u76d850\u6b21', badgeIcon: '\u{1F9E0}', requirement: '\u5b8c\u621050\u6b21\u6392\u76d8' },
  { badgeKey: 'CHART_100', badgeName: '\u547d\u7406\u5927\u5e08', badgeDesc: '\u6392\u76d8100\u6b21', badgeIcon: '\u{1F3AF}', requirement: '\u5b8c\u6210100\u6b21\u6392\u76d8' },
  { badgeKey: 'ANALYSIS_FIRST', badgeName: '\u5206\u6790\u5165\u95e8', badgeDesc: '\u9996\u6b21\u5206\u6790', badgeIcon: '\u{1F50D}', requirement: '\u5b8c\u62101\u6b21\u5206\u6790' },
  { badgeKey: 'ANALYSIS_50', badgeName: '\u5206\u6790\u8fbe\u4eba', badgeDesc: '\u5206\u679050\u6b21', badgeIcon: '\u{1F4CA}', requirement: '\u5b8c\u621050\u6b21\u5206\u6790' },
  { badgeKey: 'MEMBER_FIRST', badgeName: '\u5c0a\u8d35\u4f1a\u5458', badgeDesc: '\u9996\u6b21\u8d2d\u4e70\u4f1a\u5458', badgeIcon: '\u{1F451}', requirement: '\u9996\u6b21\u8d2d\u4e70\u4f1a\u5458' },
  { badgeKey: 'SHARE_FIRST', badgeName: '\u4f20\u64ad\u4f7f\u8005', badgeDesc: '\u9996\u6b21\u5206\u4eab', badgeIcon: '\u{1F4E8}', requirement: '\u9996\u6b21\u5206\u4eab' },
  { badgeKey: 'VIP_MEMBER', badgeName: '\u81f3\u81fbVIP', badgeDesc: '\u6210\u4e3aVIP\u4f1a\u5458', badgeIcon: '\u{1F48E}', requirement: '\u6210\u4e3aVIP\u4f1a\u5458' }
]

/** 等级阈值 */
var LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]

/** 根据成长值计算等级 */
function calculateLevel(points: number): number {
  if (points >= 4500) {
    var extra = points - 4500
    var extraLevels = Math.floor(extra / 1000)
    return Math.min(10 + extraLevels, 20)
  }
  var level = 1
  for (var i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      level = i + 1
    } else {
      break
    }
  }
  return level
}

/** 获取 Supabase Admin 客户端 */
async function getSupabaseAdmin() {
  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !supabaseServiceKey) {
    throw ApiError.internal('\u7f3a\u5c11 Supabase \u73af\u5883\u53d8\u91cf\u914d\u7f6e')
  }
  var { createClient } = await import('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseServiceKey)
}

/** 获取今天的日期字符串 YYYY-MM-DD */
function getTodayStr(): string {
  var d = new Date()
  var yyyy = String(d.getFullYear())
  var mm = String(d.getMonth() + 1).padStart(2, '0')
  var dd = String(d.getDate()).padStart(2, '0')
  return yyyy + '-' + mm + '-' + dd
}

/** 获取昨天的日期字符串 */
function getYesterdayStr(): string {
  var d = new Date()
  d.setDate(d.getDate() - 1)
  var yyyy = String(d.getFullYear())
  var mm = String(d.getMonth() + 1).padStart(2, '0')
  var dd = String(d.getDate()).padStart(2, '0')
  return yyyy + '-' + mm + '-' + dd
}

/** 检查连续签到里程碑是否解锁新徽章 */
function getCheckinBadgeKeys(streak: number): string[] {
  var keys: string[] = []
  if (streak >= 7) keys.push('CHECKIN_7')
  if (streak >= 14) keys.push('CHECKIN_14')
  if (streak >= 30) keys.push('CHECKIN_30')
  if (streak >= 60) keys.push('CHECKIN_60')
  if (streak >= 100) keys.push('CHECKIN_100')
  return keys
}

// ────────────────────────────────────────────────
//  POST /api/growth/checkin
// ────────────────────────────────────────────────
app.post('/checkin', authRequired, async function(c) {
  var user = (c as any).get('user') as { id: string }
  var userId = user.id
  var supabase = await getSupabaseAdmin()
  var today = getTodayStr()
  var yesterday = getYesterdayStr()

  // 1. 确保 user_growth 记录存在
  var { data: growth } = await supabase
    .from('user_growth')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!growth) {
    var { error: insertErr } = await supabase
      .from('user_growth')
      .insert({
        user_id: userId,
        growth_points: 0,
        growth_level: 1,
        checkin_streak: 0,
        charts_streak: 0,
        total_checkins: 0
      })
    if (insertErr) {
      throw ApiError.internal('\u521b\u5efa\u6210\u957f\u8bb0\u5f55\u5931\u8d25: ' + insertErr.message)
    }
    growth = {
      user_id: userId,
      growth_points: 0,
      growth_level: 1,
      checkin_streak: 0,
      last_checkin_date: null,
      charts_streak: 0,
      last_chart_date: null,
      total_checkins: 0,
      updated_at: new Date().toISOString()
    }
  }

  // 2. 检查今天是否已签到
  var { data: existingCheckin } = await supabase
    .from('user_checkins')
    .select('id')
    .eq('user_id', userId)
    .eq('checkin_date', today)
    .maybeSingle()

  if (existingCheckin) {
    return c.json({ success: false, message: '\u4eca\u65e5\u5df2\u7b7e\u5230' })
  }

  // 3. 计算连续天数
  var consecutiveDays = 1
  var lastCheckinDate = growth.last_checkin_date as string | null
  if (lastCheckinDate && lastCheckinDate === yesterday) {
    consecutiveDays = (growth.checkin_streak || 0) + 1
  }

  // 4. 计算奖励积分
  var reward = 10
  if (consecutiveDays >= 30) {
    reward = 110
  } else if (consecutiveDays >= 14) {
    reward = 40
  } else if (consecutiveDays >= 7) {
    reward = 30
  } else {
    reward = 10
  }

  // 5. 插入签到记录
  var { error: checkinErr } = await supabase
    .from('user_checkins')
    .insert({
      user_id: userId,
      checkin_date: today,
      consecutive_days: consecutiveDays,
      reward_points: reward
    })
  if (checkinErr) {
    throw ApiError.internal('\u7b7e\u5230\u5931\u8d25: ' + checkinErr.message)
  }

  // 6. 更新 user_growth
  var newPoints = (growth.growth_points || 0) + reward
  var newLevel = calculateLevel(newPoints)
  var { error: growthErr } = await supabase
    .from('user_growth')
    .update({
      growth_points: newPoints,
      growth_level: newLevel,
      checkin_streak: consecutiveDays,
      last_checkin_date: today,
      total_checkins: (growth.total_checkins || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
  if (growthErr) {
    throw ApiError.internal('\u66f4\u65b0\u6210\u957f\u8bb0\u5f55\u5931\u8d25: ' + growthErr.message)
  }

  // 7. 同时更新 user_profiles.points_balance
  try {
    await supabase.rpc('increment_points', { uid: userId, amt: reward })
  } catch (_rpcErr) {
    // 如果 rpc 不存在，直接 update
    var res = await supabase.from('user_profiles').select('points_balance').eq('id', userId).single()
    if (res.data) {
      await supabase.from('user_profiles').update({
        points_balance: (res.data.points_balance || 0) + reward
      }).eq('id', userId)
    }
  }

  // 8. 检查是否解锁新徽章
  var badgeKeys = getCheckinBadgeKeys(consecutiveDays)
  var newBadges: Array<{ badgeKey: string; badgeName: string; badgeIcon: string }> = []
  for (var i = 0; i < badgeKeys.length; i++) {
    var bk = badgeKeys[i]
    var { data: existingBadge } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_key', bk)
      .maybeSingle()

    if (!existingBadge) {
      var badgeDef = null
      for (var j = 0; j < ALL_BADGES.length; j++) {
        if (ALL_BADGES[j].badgeKey === bk) {
          badgeDef = ALL_BADGES[j]
          break
        }
      }
      if (badgeDef) {
        await supabase.from('user_badges').insert({
          user_id: userId,
          badge_key: bk,
          badge_name: badgeDef.badgeName,
          badge_desc: badgeDef.badgeDesc,
          badge_icon: badgeDef.badgeIcon
        })
        newBadges.push({
          badgeKey: bk,
          badgeName: badgeDef.badgeName,
          badgeIcon: badgeDef.badgeIcon
        })
      }
    }
  }

  return c.json({
    success: true,
    streak: consecutiveDays,
    reward: reward,
    totalPoints: newPoints,
    level: newLevel,
    newBadges: newBadges
  })
})

// ────────────────────────────────────────────────
//  GET /api/growth/status
// ────────────────────────────────────────────────
app.get('/status', authRequired, async function(c) {
  var user = (c as any).get('user') as { id: string }
  var userId = user.id
  var supabase = await getSupabaseAdmin()
  var today = getTodayStr()

  // 获取成长记录
  var { data: growth } = await supabase
    .from('user_growth')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!growth) {
    return c.json({
      checkinStreak: 0,
      lastCheckinDate: null,
      chartsStreak: 0,
      growthPoints: 0,
      growthLevel: 1,
      totalCheckins: 0,
      todayCheckedIn: false,
      badges: []
    })
  }

  // 检查今日是否签到
  var { data: todayCheckin } = await supabase
    .from('user_checkins')
    .select('id')
    .eq('user_id', userId)
    .eq('checkin_date', today)
    .maybeSingle()

  // 获取徽章列表
  var { data: badges } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  return c.json({
    checkinStreak: growth.checkin_streak || 0,
    lastCheckinDate: growth.last_checkin_date || null,
    chartsStreak: growth.charts_streak || 0,
    growthPoints: growth.growth_points || 0,
    growthLevel: growth.growth_level || 1,
    totalCheckins: growth.total_checkins || 0,
    todayCheckedIn: !!todayCheckin,
    badges: badges || []
  })
})

// ────────────────────────────────────────────────
//  GET /api/growth/badges
// ────────────────────────────────────────────────
app.get('/badges', authRequired, async function(c) {
  var user = (c as any).get('user') as { id: string }
  var userId = user.id
  var supabase = await getSupabaseAdmin()

  var { data: earnedBadges } = await supabase
    .from('user_badges')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })

  var earned = (earnedBadges || []).map(function(b) {
    return {
      badgeKey: b.badge_key,
      badgeName: b.badge_name,
      badgeDesc: b.badge_desc,
      badgeIcon: b.badge_icon,
      earnedAt: b.earned_at
    }
  })

  return c.json({
    earned: earned,
    allBadges: ALL_BADGES
  })
})

// ────────────────────────────────────────────────
//  POST /api/growth/record-chart
// ────────────────────────────────────────────────
app.post('/record-chart', authRequired, async function(c) {
  var user = (c as any).get('user') as { id: string }
  var userId = user.id
  var supabase = await getSupabaseAdmin()
  var today = getTodayStr()
  var yesterday = getYesterdayStr()

  // 确保 user_growth 记录存在
  var { data: growth } = await supabase
    .from('user_growth')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!growth) {
    await supabase.from('user_growth').insert({
      user_id: userId,
      growth_points: 0,
      growth_level: 1,
      checkin_streak: 0,
      charts_streak: 0,
      total_checkins: 0
    })
    growth = {
      user_id: userId,
      growth_points: 0,
      growth_level: 1,
      checkin_streak: 0,
      last_checkin_date: null,
      charts_streak: 0,
      last_chart_date: null,
      total_checkins: 0,
      updated_at: new Date().toISOString()
    }
  }

  // 计算连续排盘天数
  var chartsStreak = 1
  var lastChartDate = growth.last_chart_date as string | null
  if (lastChartDate && lastChartDate === yesterday) {
    chartsStreak = (growth.charts_streak || 0) + 1
  }

  // 成长值奖励：排盘+5
  var reward = 5
  var newPoints = (growth.growth_points || 0) + reward
  var newLevel = calculateLevel(newPoints)

  await supabase
    .from('user_growth')
    .update({
      growth_points: newPoints,
      growth_level: newLevel,
      charts_streak: chartsStreak,
      last_chart_date: today,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  // 检查排盘徽章
  var totalCharts = 0
  var { count } = await supabase
    .from('charts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  totalCharts = count || 0

  var chartBadgeKeys: string[] = []
  if (totalCharts >= 1) chartBadgeKeys.push('CHART_FIRST')
  if (totalCharts >= 10) chartBadgeKeys.push('CHART_10')
  if (totalCharts >= 50) chartBadgeKeys.push('CHART_50')
  if (totalCharts >= 100) chartBadgeKeys.push('CHART_100')

  var newBadges: Array<{ badgeKey: string; badgeName: string; badgeIcon: string }> = []
  for (var i = 0; i < chartBadgeKeys.length; i++) {
    var bk = chartBadgeKeys[i]
    var { data: existingBadge } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('badge_key', bk)
      .maybeSingle()

    if (!existingBadge) {
      var badgeDef = null
      for (var j = 0; j < ALL_BADGES.length; j++) {
        if (ALL_BADGES[j].badgeKey === bk) {
          badgeDef = ALL_BADGES[j]
          break
        }
      }
      if (badgeDef) {
        await supabase.from('user_badges').insert({
          user_id: userId,
          badge_key: bk,
          badge_name: badgeDef.badgeName,
          badge_desc: badgeDef.badgeDesc,
          badge_icon: badgeDef.badgeIcon
        })
        newBadges.push({
          badgeKey: bk,
          badgeName: badgeDef.badgeName,
          badgeIcon: badgeDef.badgeIcon
        })
      }
    }
  }

  return c.json({
    success: true,
    chartsStreak: chartsStreak,
    reward: reward,
    totalPoints: newPoints,
    level: newLevel,
    newBadges: newBadges
  })
})

// ────────────────────────────────────────────────
//  GET /api/growth/leaderboard
// ────────────────────────────────────────────────
app.get('/leaderboard', authRequired, async function(c) {
  var supabase = await getSupabaseAdmin()

  var { data: leaders } = await supabase
    .from('user_growth')
    .select('user_id, growth_points, growth_level')
    .order('growth_points', { ascending: false })
    .limit(20)

  var leaderboard: Array<{ userId: string; displayName: string; growthPoints: number; growthLevel: number; rank: number }> = []

  if (leaders) {
    for (var i = 0; i < leaders.length; i++) {
      var row = leaders[i]
      var displayName = '\u533f\u540d\u7528\u6237'

      // 查找用户显示名称
      var { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name')
        .eq('id', row.user_id)
        .maybeSingle()
      if (profile && profile.display_name) {
        displayName = profile.display_name
      }

      leaderboard.push({
        userId: row.user_id,
        displayName: displayName,
        growthPoints: row.growth_points || 0,
        growthLevel: row.growth_level || 1,
        rank: i + 1
      })
    }
  }

  return c.json({ leaderboard: leaderboard })
})

export default app
