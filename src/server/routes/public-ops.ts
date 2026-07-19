/**
 * V1.2 Stage 8 公开运营工具路由
 *
 *   GET /banners/active           获取当前活跃 Banner
 *   GET /announcements/active     获取已发布公告
 *   GET /campaigns/active         获取当前活跃活动
 *   POST /coupons/validate        验证优惠券（authRequired）
 *
 * 挂载前缀：/api
 *
 * 代码风格：var, 单引号, 字符串拼接, 禁止 backtick。
 */

import { Hono } from 'hono'
import { authRequired, requireUser } from '../middleware/auth'
import { ApiError } from '../middleware/error'

var app = new Hono()

// ────────────────────────────────────────────────
//  Supabase Admin 客户端
// ────────────────────────────────────────────────

async function getSupabaseAdmin() {
  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !supabaseServiceKey) {
    throw ApiError.internal('缺少 Supabase 环境变量配置')
  }
  var { createClient } = await import('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseServiceKey)
}

// ────────────────────────────────────────────────
//  GET /banners/active
// ────────────────────────────────────────────────

app.get('/banners/active', async function(c) {
  var supabase = await getSupabaseAdmin()
  var now = new Date().toISOString()

  var { data, error } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .or('start_at.is.null,start_at.lte.' + now)
    .or('end_at.is.null,end_at.gte.' + now)
    .order('sort_order', { ascending: true })

  if (error) {
    throw ApiError.internal('查询活跃 Banner 失败: ' + error.message)
  }
  return c.json(data || [])
})

// ────────────────────────────────────────────────
//  GET /announcements/active
// ────────────────────────────────────────────────

app.get('/announcements/active', async function(c) {
  var supabase = await getSupabaseAdmin()

  var { data, error } = await supabase
    .from('announcements')
    .select('*')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(50)

  if (error) {
    throw ApiError.internal('查询已发布公告失败: ' + error.message)
  }
  return c.json(data || [])
})

// ────────────────────────────────────────────────
//  GET /campaigns/active
// ────────────────────────────────────────────────

app.get('/campaigns/active', async function(c) {
  var supabase = await getSupabaseAdmin()
  var now = new Date().toISOString()

  var { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('is_active', true)
    .or('start_at.is.null,start_at.lte.' + now)
    .or('end_at.is.null,end_at.gte.' + now)
    .order('created_at', { ascending: false })

  if (error) {
    throw ApiError.internal('查询活跃活动失败: ' + error.message)
  }
  return c.json(data || [])
})

// ────────────────────────────────────────────────
//  POST /coupons/validate
//  Body: { code: string, amountCents: number }
// ────────────────────────────────────────────────

app.post('/coupons/validate', authRequired, async function(c) {
  var user = requireUser(c)
  var body = await c.req.json()
  var code = (body.code || '').toUpperCase().trim()
  var amountCents = body.amountCents || 0

  if (!code) {
    throw ApiError.badRequest('请提供优惠券码')
  }

  var supabase = await getSupabaseAdmin()

  // 查找优惠券
  var { data: coupon, error: couponError } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('is_active', true)
    .maybeSingle()

  if (couponError || !coupon) {
    throw ApiError.badRequest('优惠券不存在或已失效')
  }

  // 检查有效期
  var now = new Date()
  if (coupon.valid_start && new Date(coupon.valid_start) > now) {
    throw ApiError.badRequest('优惠券尚未生效')
  }
  if (coupon.valid_end && new Date(coupon.valid_end) < now) {
    throw ApiError.badRequest('优惠券已过期')
  }

  // 检查使用次数
  if (coupon.used_count >= coupon.max_uses) {
    throw ApiError.badRequest('优惠券已被领完')
  }

  // 检查用户是否已使用
  var { data: usage } = await supabase
    .from('coupon_usages')
    .select('id')
    .eq('coupon_id', coupon.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (usage) {
    throw ApiError.badRequest('您已使用过该优惠券')
  }

  // 检查最低消费
  if (amountCents < coupon.min_order_cents) {
    throw ApiError.badRequest(
      '订单金额不足，最低消费 ' + (coupon.min_order_cents / 100).toFixed(2) + ' 元'
    )
  }

  // 计算折扣
  var discountCents = 0
  if (coupon.discount_type === 'percent') {
    discountCents = Math.round(amountCents * coupon.discount_value / 100)
  } else if (coupon.discount_type === 'fixed') {
    discountCents = Math.round(coupon.discount_value * 100)
  }

  if (discountCents > amountCents) {
    discountCents = amountCents
  }

  return c.json({
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      applies_to: coupon.applies_to,
      description: coupon.description
    },
    discountCents: discountCents,
    finalAmountCents: amountCents - discountCents
  })
})

export default app