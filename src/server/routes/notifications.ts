/**
 * 通知 API 路由
 *
 *   GET  /api/notifications              分页获取通知列表
 *   GET  /api/notifications/unread-count 获取未读数量
 *   PATCH /api/notifications/:id/read    标记单条已读
 *   PATCH /api/notifications/read-all    标记全部已读
 *   DELETE /api/notifications/:id        删除单条通知
 *
 * 代码风格：var、单引号、字符串拼接，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authRequired, requireUser } from '../middleware/auth'
import { ApiError } from '../middleware/error'

var app = new Hono()

/** 获取 Supabase Admin 客户端 */
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
 * GET /api/notifications
 *
 * 分页查询通知列表，支持只看未读。
 */
app.get('/', authRequired, async function(c) {
  var user = requireUser(c)
  var page = parseInt(c.req.query('page') || '1', 10)
  var pageSize = parseInt(c.req.query('pageSize') || '20', 10)
  var unreadOnly = c.req.query('unread') === 'true'

  if (page < 1) page = 1
  if (pageSize < 1) pageSize = 20
  if (pageSize > 100) pageSize = 100

  var supabase = await getSupabaseAdmin()
  var from = (page - 1) * pageSize
  var to = from + pageSize - 1

  // 构建查询
  var query = supabase
    .from('user_notifications')
    .select('id, type, title, content, is_read, metadata, created_at', { count: 'exact' })
    .eq('user_id', user.id)

  if (unreadOnly) {
    query = query.eq('is_read', false)
  }

  query = query
    .order('created_at', { ascending: false })
    .range(from, to)

  var { data, error, count } = await query

  if (error) {
    throw ApiError.internal('获取通知列表失败: ' + error.message)
  }

  // 获取未读总数
  var { count: unreadCount } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  var items = (data || []).map(function(row: any) {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      isRead: row.is_read,
      metadata: row.metadata || {},
      createdAt: row.created_at,
    }
  })

  return c.json({
    items: items,
    total: count || 0,
    unreadCount: unreadCount || 0,
    page: page,
    pageSize: pageSize,
  })
})

/**
 * GET /api/notifications/unread-count
 *
 * 获取当前用户未读通知数量。
 */
app.get('/unread-count', authRequired, async function(c) {
  var user = requireUser(c)
  var supabase = await getSupabaseAdmin()

  var { count } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return c.json({ count: count || 0 })
})

/**
 * PATCH /api/notifications/:id/read
 *
 * 标记单条通知为已读。
 */
app.patch('/:id/read', authRequired, async function(c) {
  var user = requireUser(c)
  var id = c.req.param('id')

  if (!id) {
    throw ApiError.badRequest('缺少通知 ID')
  }

  var supabase = await getSupabaseAdmin()

  var { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw ApiError.internal('标记已读失败: ' + error.message)
  }

  return c.json({ success: true })
})

/**
 * PATCH /api/notifications/read-all
 *
 * 标记当前用户所有未读通知为已读。
 */
app.patch('/read-all', authRequired, async function(c) {
  var user = requireUser(c)
  var supabase = await getSupabaseAdmin()

  var { count } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  var { error } = await supabase
    .from('user_notifications')
    .update({ is_read: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  if (error) {
    throw ApiError.internal('批量标记已读失败: ' + error.message)
  }

  return c.json({ success: true, count: count || 0 })
})

/**
 * DELETE /api/notifications/:id
 *
 * 删除单条通知。
 */
app.delete('/:id', authRequired, async function(c) {
  var user = requireUser(c)
  var id = c.req.param('id')

  if (!id) {
    throw ApiError.badRequest('缺少通知 ID')
  }

  var supabase = await getSupabaseAdmin()

  var { error } = await supabase
    .from('user_notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    throw ApiError.internal('删除通知失败: ' + error.message)
  }

  return c.json({ success: true })
})

export default app