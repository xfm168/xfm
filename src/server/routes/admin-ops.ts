/**
 * V1.2 Stage 8 管理员运营工具路由
 *
 *   GET/POST/PATCH/DELETE  /banners            Banner 管理
 *   GET/POST/PATCH/DELETE  /announcements      公告管理
 *   GET/POST/PATCH/DELETE  /campaigns          活动管理
 *   GET/POST/PATCH/DELETE  /coupons            优惠券管理
 *   GET                    /invitations/stats  邀请码统计
 *
 * 全部 authRequired + 管理员权限检查。
 * 挂载前缀：/api/admin
 *
 * 代码风格：var, 单引号, 字符串拼接, 禁止 backtick。
 */

import { Hono } from 'hono'
import { authRequired, requireUser } from '../middleware/auth'
import { requireAdmin } from '../middleware/permission'
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
//  Banner 管理路由
//  GET    /banners
//  POST   /banners
//  PATCH  /banners/:id
//  DELETE /banners/:id
// ────────────────────────────────────────────────

// GET /banners ?active=true|false
app.get('/banners', authRequired, requireAdmin(), async function(c) {
  var supabase = await getSupabaseAdmin()
  var query = supabase.from('banners').select('*').order('sort_order', { ascending: true })

  var activeParam = c.req.query('active')
  if (activeParam === 'true') {
    query = query.eq('is_active', true)
  } else if (activeParam === 'false') {
    query = query.eq('is_active', false)
  }

  var { data, error } = await query
  if (error) {
    throw ApiError.internal('查询 Banner 失败: ' + error.message)
  }
  return c.json(data || [])
})

// POST /banners
app.post('/banners', authRequired, requireAdmin(), async function(c) {
  var body = await c.req.json()
  var supabase = await getSupabaseAdmin()

  var row: Record<string, any> = {
    title: body.title,
    position: body.position || 'home_top',
    sort_order: body.sort_order || 0,
    is_active: body.is_active !== undefined ? body.is_active : true,
    updated_at: new Date().toISOString()
  }
  if (body.image_url !== undefined) row.image_url = body.image_url
  if (body.link_url !== undefined) row.link_url = body.link_url
  if (body.start_at !== undefined) row.start_at = body.start_at
  if (body.end_at !== undefined) row.end_at = body.end_at

  var { data, error } = await supabase.from('banners').insert(row).select().single()
  if (error) {
    throw ApiError.internal('创建 Banner 失败: ' + error.message)
  }
  return c.json(data, 201)
})

// PATCH /banners/:id
app.patch('/banners/:id', authRequired, requireAdmin(), async function(c) {
  var id = c.req.param('id')
  var body = await c.req.json()
  var supabase = await getSupabaseAdmin()

  var row: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) row.title = body.title
  if (body.image_url !== undefined) row.image_url = body.image_url
  if (body.link_url !== undefined) row.link_url = body.link_url
  if (body.position !== undefined) row.position = body.position
  if (body.sort_order !== undefined) row.sort_order = body.sort_order
  if (body.is_active !== undefined) row.is_active = body.is_active
  if (body.start_at !== undefined) row.start_at = body.start_at
  if (body.end_at !== undefined) row.end_at = body.end_at

  var { data, error } = await supabase.from('banners').update(row).eq('id', id).select().single()
  if (error) {
    throw ApiError.internal('更新 Banner 失败: ' + error.message)
  }
  return c.json(data)
})

// DELETE /banners/:id
app.delete('/banners/:id', authRequired, requireAdmin(), async function(c) {
  var id = c.req.param('id')
  var supabase = await getSupabaseAdmin()

  var { error } = await supabase.from('banners').delete().eq('id', id)
  if (error) {
    throw ApiError.internal('删除 Banner 失败: ' + error.message)
  }
  return c.json({ success: true })
})

// ────────────────────────────────────────────────
//  公告管理路由
//  GET    /announcements
//  POST   /announcements
//  PATCH  /announcements/:id
//  DELETE /announcements/:id
// ────────────────────────────────────────────────

// GET /announcements ?published=true|false
app.get('/announcements', authRequired, requireAdmin(), async function(c) {
  var supabase = await getSupabaseAdmin()
  var query = supabase.from('announcements').select('*').order('created_at', { ascending: false })

  var publishedParam = c.req.query('published')
  if (publishedParam === 'true') {
    query = query.eq('is_published', true)
  } else if (publishedParam === 'false') {
    query = query.eq('is_published', false)
  }

  var { data, error } = await query
  if (error) {
    throw ApiError.internal('查询公告失败: ' + error.message)
  }
  return c.json(data || [])
})

// POST /announcements
app.post('/announcements', authRequired, requireAdmin(), async function(c) {
  var body = await c.req.json()
  var user = requireUser(c)
  var supabase = await getSupabaseAdmin()

  var row: Record<string, any> = {
    title: body.title,
    content: body.content,
    type: body.type || 'notice',
    is_published: false,
    created_by: user.id,
    updated_at: new Date().toISOString()
  }

  var { data, error } = await supabase.from('announcements').insert(row).select().single()
  if (error) {
    throw ApiError.internal('创建公告失败: ' + error.message)
  }
  return c.json(data, 201)
})

// PATCH /announcements/:id
app.patch('/announcements/:id', authRequired, requireAdmin(), async function(c) {
  var id = c.req.param('id')
  var body = await c.req.json()
  var supabase = await getSupabaseAdmin()

  var row: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) row.title = body.title
  if (body.content !== undefined) row.content = body.content
  if (body.type !== undefined) row.type = body.type

  if (body.is_published !== undefined) {
    row.is_published = body.is_published
    if (body.is_published) {
      row.published_at = new Date().toISOString()
    }
  }

  var { data, error } = await supabase.from('announcements').update(row).eq('id', id).select().single()
  if (error) {
    throw ApiError.internal('更新公告失败: ' + error.message)
  }
  return c.json(data)
})

// DELETE /announcements/:id
app.delete('/announcements/:id', authRequired, requireAdmin(), async function(c) {
  var id = c.req.param('id')
  var supabase = await getSupabaseAdmin()

  var { error } = await supabase.from('announcements').delete().eq('id', id)
  if (error) {
    throw ApiError.internal('删除公告失败: ' + error.message)
  }
  return c.json({ success: true })
})

// ────────────────────────────────────────────────
//  活动管理路由
//  GET    /campaigns
//  POST   /campaigns
//  PATCH  /campaigns/:id
//  DELETE /campaigns/:id
// ────────────────────────────────────────────────

// GET /campaigns
app.get('/campaigns', authRequired, requireAdmin(), async function(c) {
  var supabase = await getSupabaseAdmin()

  var { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw ApiError.internal('查询活动失败: ' + error.message)
  }
  return c.json(data || [])
})

// POST /campaigns
app.post('/campaigns', authRequired, requireAdmin(), async function(c) {
  var body = await c.req.json()
  var supabase = await getSupabaseAdmin()

  var row: Record<string, any> = {
    title: body.title,
    type: body.type || 'promotion',
    discount_type: body.discount_type || 'none',
    discount_value: body.discount_value || 0,
    is_active: body.is_active !== undefined ? body.is_active : true,
    updated_at: new Date().toISOString()
  }
  if (body.description !== undefined) row.description = body.description
  if (body.min_tier !== undefined) row.min_tier = body.min_tier
  if (body.start_at !== undefined) row.start_at = body.start_at
  if (body.end_at !== undefined) row.end_at = body.end_at

  var { data, error } = await supabase.from('campaigns').insert(row).select().single()
  if (error) {
    throw ApiError.internal('创建活动失败: ' + error.message)
  }
  return c.json(data, 201)
})

// PATCH /campaigns/:id
app.patch('/campaigns/:id', authRequired, requireAdmin(), async function(c) {
  var id = c.req.param('id')
  var body = await c.req.json()
  var supabase = await getSupabaseAdmin()

  var row: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.title !== undefined) row.title = body.title
  if (body.description !== undefined) row.description = body.description
  if (body.type !== undefined) row.type = body.type
  if (body.discount_type !== undefined) row.discount_type = body.discount_type
  if (body.discount_value !== undefined) row.discount_value = body.discount_value
  if (body.min_tier !== undefined) row.min_tier = body.min_tier
  if (body.is_active !== undefined) row.is_active = body.is_active
  if (body.start_at !== undefined) row.start_at = body.start_at
  if (body.end_at !== undefined) row.end_at = body.end_at

  var { data, error } = await supabase.from('campaigns').update(row).eq('id', id).select().single()
  if (error) {
    throw ApiError.internal('更新活动失败: ' + error.message)
  }
  return c.json(data)
})

// DELETE /campaigns/:id
app.delete('/campaigns/:id', authRequired, requireAdmin(), async function(c) {
  var id = c.req.param('id')
  var supabase = await getSupabaseAdmin()

  var { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) {
    throw ApiError.internal('删除活动失败: ' + error.message)
  }
  return c.json({ success: true })
})

// ────────────────────────────────────────────────
//  优惠券管理路由
//  GET    /coupons
//  POST   /coupons
//  PATCH  /coupons/:id
//  DELETE /coupons/:id
// ────────────────────────────────────────────────

/** 生成随机优惠券码 */
function generateCouponCode(): string {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  var code = ''
  for (var i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// GET /coupons
app.get('/coupons', authRequired, requireAdmin(), async function(c) {
  var supabase = await getSupabaseAdmin()

  var { data, error } = await supabase
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw ApiError.internal('查询优惠券失败: ' + error.message)
  }
  return c.json(data || [])
})

// POST /coupons
app.post('/coupons', authRequired, requireAdmin(), async function(c) {
  var body = await c.req.json()
  var supabase = await getSupabaseAdmin()

  var code = body.code || generateCouponCode()

  var row: Record<string, any> = {
    code: code.toUpperCase(),
    discount_type: body.discount_type,
    discount_value: body.discount_value,
    min_order_cents: body.min_order_cents || 0,
    max_uses: body.max_uses || 100,
    used_count: 0,
    is_active: body.is_active !== undefined ? body.is_active : true,
    applies_to: body.applies_to || 'all',
    updated_at: new Date().toISOString()
  }
  if (body.description !== undefined) row.description = body.description
  if (body.valid_start !== undefined) row.valid_start = body.valid_start
  if (body.valid_end !== undefined) row.valid_end = body.valid_end

  var { data, error } = await supabase.from('coupons').insert(row).select().single()
  if (error) {
    throw ApiError.internal('创建优惠券失败: ' + error.message)
  }
  return c.json(data, 201)
})

// PATCH /coupons/:id
app.patch('/coupons/:id', authRequired, requireAdmin(), async function(c) {
  var id = c.req.param('id')
  var body = await c.req.json()
  var supabase = await getSupabaseAdmin()

  var row: Record<string, any> = { updated_at: new Date().toISOString() }
  if (body.code !== undefined) row.code = body.code.toUpperCase()
  if (body.discount_type !== undefined) row.discount_type = body.discount_type
  if (body.discount_value !== undefined) row.discount_value = body.discount_value
  if (body.min_order_cents !== undefined) row.min_order_cents = body.min_order_cents
  if (body.max_uses !== undefined) row.max_uses = body.max_uses
  if (body.is_active !== undefined) row.is_active = body.is_active
  if (body.applies_to !== undefined) row.applies_to = body.applies_to
  if (body.description !== undefined) row.description = body.description
  if (body.valid_start !== undefined) row.valid_start = body.valid_start
  if (body.valid_end !== undefined) row.valid_end = body.valid_end

  var { data, error } = await supabase.from('coupons').update(row).eq('id', id).select().single()
  if (error) {
    throw ApiError.internal('更新优惠券失败: ' + error.message)
  }
  return c.json(data)
})

// DELETE /coupons/:id
app.delete('/coupons/:id', authRequired, requireAdmin(), async function(c) {
  var id = c.req.param('id')
  var supabase = await getSupabaseAdmin()

  var { error } = await supabase.from('coupons').delete().eq('id', id)
  if (error) {
    throw ApiError.internal('删除优惠券失败: ' + error.message)
  }
  return c.json({ success: true })
})

// ────────────────────────────────────────────────
//  邀请码统计路由
//  GET /invitations/stats
// ────────────────────────────────────────────────

app.get('/invitations/stats', authRequired, requireAdmin(), async function(c) {
  var supabase = await getSupabaseAdmin()

  // 总数
  var { count: totalCount } = await supabase
    .from('invitations')
    .select('id', { count: 'exact', head: true })

  // 已使用
  var { count: usedCount } = await supabase
    .from('invitations')
    .select('id', { count: 'exact', head: true })
    .eq('used', true)

  // 总奖励积分
  var { data: rewardData } = await supabase
    .from('invitations')
    .select('reward_points')

  var totalRewardPoints = 0
  if (rewardData) {
    for (var i = 0; i < rewardData.length; i++) {
      totalRewardPoints += (rewardData[i].reward_points || 0)
    }
  }

  return c.json({
    total: totalCount || 0,
    used: usedCount || 0,
    totalRewardPoints: totalRewardPoints
  })
})

export default app