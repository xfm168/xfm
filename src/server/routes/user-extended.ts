/**
 * 用户扩展 API
 *
 *   GET /api/user/membership    获取会员状态
 *   GET /api/user/payments     获取支付记录（支持分页、按 status 过滤）
 *   GET /api/user/points       获取积分余额 + 交易明细
 *   GET /api/user/invite       获取邀请码
 *   GET /api/user/stats        获取使用统计
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authRequired, requireUser } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import { getTierLimits } from '../../lib/domain/usageLimit'
import { getCapabilities, getAvailableFeatures } from '../../lib/domain/permission'

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

/**
 * GET /api/user/membership
 *
 * 从 user_profiles 表读取当前用户的会员信息，
 * 根据 tier 返回对应的 plan 详情。
 */
app.get('/membership', authRequired, async function(c) {
  var user = requireUser(c)
  var supabase = await getSupabaseAdmin()

  var { data: profile } = await supabase
    .from('user_profiles')
    .select('membership_tier, membership_expires_at')
    .eq('id', user.id)
    .single()

  var tier = profile ? profile.membership_tier : 'free'
  var expiresAt = profile ? profile.membership_expires_at : null
  var daysRemaining = 0
  if (expiresAt) {
    var diff = new Date(expiresAt).getTime() - Date.now()
    daysRemaining = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  }

  // 根据 tier 获取 plan 信息
  var tierPlans = {
    'free': { tier: 'free', name: '免费用户', features: ['基础排盘', '免费报告'], maxCharts: 3, maxAnalyses: 5, aiCredits: 0 },
    'basic': { tier: 'basic', name: '基础会员', features: ['基础排盘', '基础报告', '历史保存10条', 'AI解读3次'], maxCharts: 10, maxAnalyses: 20, aiCredits: 3 },
    'premium': { tier: 'premium', name: '高级会员', features: ['高级排盘', '深度报告', '历史无限', 'AI解读20次', 'PDF导出'], maxCharts: 999, maxAnalyses: 999, aiCredits: 20 },
    'vip': { tier: 'vip', name: 'VIP会员', features: ['全部功能', '无限AI', '专属客服', '优先体验'], maxCharts: 999, maxAnalyses: 999, aiCredits: 999 }
  }
  var plan = tierPlans[tier] || tierPlans['free']

  return c.json({
    success: true,
    membership: {
      tier: tier,
      expiresAt: expiresAt,
      daysRemaining: daysRemaining,
      plan: plan
    }
  })
})

/**
 * GET /api/user/payments
 *
 * 从 v11_payments 表读取当前用户的支付记录。
 * 支持查询参数：
 *   status = paid | pending | failed   按状态过滤
 *   limit  = 20   每页数量（默认 20，上限 100）
 *   offset = 0    分页偏移（默认 0）
 */
app.get('/payments', authRequired, async function(c) {
  var user = requireUser(c)
  var supabase = await getSupabaseAdmin()

  var status = c.req.query('status') || ''
  var limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)))
  var offset = Math.max(0, parseInt(c.req.query('offset') || '0', 10))

  var query = supabase
    .from('v11_payments')
    .select('*')
    .eq('user_id', user.id)

  if (status) {
    query = query.eq('status', status)
  }

  var { data: payments, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw ApiError.internal('获取支付记录失败: ' + error.message)
  }

  return c.json({
    success: true,
    payments: payments || [],
    limit: limit,
    offset: offset,
  })
})

/**
 * GET /api/user/points
 *
 * 从 user_profiles.points_balance 和 transactions 表读取积分信息。
 */
app.get('/points', authRequired, async function(c) {
  var user = requireUser(c)
  var supabase = await getSupabaseAdmin()

  // 获取余额
  var { data: profile } = await supabase
    .from('user_profiles')
    .select('points_balance')
    .eq('id', user.id)
    .single()

  var balance = profile ? (profile.points_balance || 0) : 0

  // 获取交易明细
  var { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    throw ApiError.internal('获取积分记录失败: ' + error.message)
  }

  return c.json({
    success: true,
    balance: balance,
    transactions: transactions || []
  })
})

/**
 * GET /api/user/stats
 *
 * 获取当前用户的使用统计：总分析次数、总排盘次数、今日/本月使用次数、总支付金额。
 */
app.get('/stats', authRequired, async function(c) {
  var user = requireUser(c)
  var supabase = await getSupabaseAdmin()

  // 总分析次数
  var { count: totalAnalysis } = await supabase
    .from('analysis_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 总排盘次数
  var { count: totalCharts } = await supabase
    .from('charts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 今日使用次数
  var todayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  var { count: todayAnalysis } = await supabase
    .from('analysis_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart)

  // 本月使用次数
  var monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  var { count: monthAnalysis } = await supabase
    .from('analysis_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', monthStart)

  // 总支付金额
  var { data: payments } = await supabase
    .from('v11_payments')
    .select('amount_cents, status')
    .eq('user_id', user.id)
    .eq('status', 'paid')
  var totalSpent = 0
  if (payments) {
    for (var i = 0; i < payments.length; i++) {
      totalSpent += payments[i].amount_cents || 0
    }
  }

  return c.json({
    success: true,
    stats: {
      totalAnalysis: totalAnalysis || 0,
      totalCharts: totalCharts || 0,
      todayAnalysis: todayAnalysis || 0,
      monthAnalysis: monthAnalysis || 0,
      totalSpent: totalSpent,
      totalSpentYuan: (totalSpent / 100).toFixed(2),
    }
  })
})

/**
 * GET /api/user/invite
 *
 * 生成并返回邀请码。检查 invitations 表是否有记录，没有则创建。
 */
app.get('/invite', authRequired, async function(c) {
  var user = requireUser(c)
  var supabase = await getSupabaseAdmin()

  // 查找已有邀请码
  var { data: existing } = await supabase
    .from('invitations')
    .select('code, invitee_id, reward_points, used, created_at')
    .eq('inviter_id', user.id)
    .maybeSingle()

  if (!existing) {
    // 生成新邀请码
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    var code = 'XF'
    for (var i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    await supabase.from('invitations').insert({
      inviter_id: user.id,
      code: code,
      reward_points: 100,
      used: false,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    })

    return c.json({
      success: true,
      inviteCode: code,
      inviteeCount: 0,
      totalReward: 0
    })
  }

  // 统计已成功邀请人数
  var { count } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true })
    .eq('inviter_id', user.id)
    .eq('used', true)

  return c.json({
    success: true,
    inviteCode: existing.code,
    inviteeCount: count || 0,
    totalReward: (count || 0) * (existing.reward_points || 0)
  })
})

/**
 * GET /api/user/full
 *
 * 一次性返回用户完整会员信息：profile、使用次数、limits、capabilities、features。
 * 前端调用此端点即可获取所有会员相关数据，避免多次请求。
 */
app.get('/full', authRequired, async function(c) {
  var user = requireUser(c)
  var supabase = await getSupabaseAdmin()

  // 获取 profile
  var { data: profile } = await supabase.from('user_profiles').select('*').eq('id', user.id).single()
  var tier = profile ? profile.membership_tier : 'free'

  // 获取使用次数（今日）
  var todayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  var { count: todayCharts } = await supabase.from('analysis_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', todayStart)
  var { count: totalHistory } = await supabase.from('analysis_history').select('*', { count: 'exact', head: true }).eq('user_id', user.id)

  // 获取 limits
  var limits = getTierLimits(tier)

  // 获取 membership 信息
  var expiresAt = profile ? profile.membership_expires_at : null
  var daysRemaining = 0
  if (expiresAt) {
    var diff = new Date(expiresAt).getTime() - Date.now()
    daysRemaining = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)))
  }

  return c.json({
    success: true,
    tier: tier,
    limits: limits,
    usage: {
      todayCharts: todayCharts || 0,
      totalHistory: totalHistory || 0,
      remainingToday: Math.max(0, limits.dailyCharts - (todayCharts || 0)),
    },
    membership: {
      tier: tier,
      expiresAt: expiresAt,
      daysRemaining: daysRemaining,
    },
    features: getAvailableFeatures(tier),
    capabilities: getCapabilities(tier),
  })
})

/**
 * POST /api/user/share
 *
 * 记录用户分享行为到 monitoring_logs。
 * 请求体：{ type: 'bazi'|'fortune'|'report', targetId?: string }
 */
app.post('/share', authRequired, async function(c) {
  var user = requireUser(c)
  var body = await c.req.json()
  var shareType = body.type || 'bazi'
  var targetId = body.targetId || ''

  // 记录到 monitoring_logs
  var supabase = await getSupabaseAdmin()
  await supabase.from('monitoring_logs').insert({
    source: 'frontend',
    category: 'share',
    level: 'info',
    name: 'share:' + shareType,
    path: '/report/' + targetId,
    message: '用户分享: ' + shareType + ' (ID: ' + targetId + ')',
    metadata: { user_id: user.id, type: shareType, target_id: targetId },
  })

  return c.json({ success: true })
})

export default app
