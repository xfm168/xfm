/**
 * 通用反馈路由（非专业报告专用）
 *
 *   POST   /              提交通用反馈（需登录）
 *   GET    /mine          当前用户反馈列表（需登录）
 *   GET    /admin/feedbacks       反馈列表（管理员）
 *   PATCH  /admin/feedbacks/:id   更新反馈状态（管理员）
 *   GET    /admin/feedbacks/stats 反馈统计（管理员）
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 * 禁止 import { type X }，使用 import type { X } 单独语句。
 */

import { Hono } from 'hono'
import { authRequired } from '../middleware/auth'
import type { AuthUser } from '../middleware/auth'
import { requireUser } from '../middleware/auth'
import { requireAdmin } from '../middleware/permission'
import { ApiError } from '../middleware/error'
import {
  FeedbackSeverity,
  FeedbackStatus,
  FeedbackSource,
  FEEDBACK_TYPE_VALUES,
  FEEDBACK_STATUS_VALUES,
  FEEDBACK_STATUS_TRANSITIONS,
  ratingToSeverity,
  isValidEnumValue,
} from '../../shared/domain'

var app = new Hono()

// ─── 辅助函数 ───

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

// ─── POST / ───

app.post('/', authRequired, async function(c) {
  var user = (c as any).get('user') as AuthUser | null
  requireUser(c)

  var body: Record<string, unknown> = {}
  try {
    body = await c.req.json()
  } catch (_) {
    throw ApiError.badRequest('请求体不是合法的 JSON')
  }

  // 参数提取
  var type = body.type as string | undefined
  var title = body.title as string | undefined
  var content = body.content as string | undefined
  var contact = body.contact as string | undefined
  var satisfaction = body.satisfaction as number | undefined

  // 校验 type
  if (!type || !isValidEnumValue(type, FEEDBACK_TYPE_VALUES)) {
    throw ApiError.badRequest('type 必须是 ' + FEEDBACK_TYPE_VALUES.join(', ') + ' 之一')
  }

  // 校验 title
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw ApiError.badRequest('title 不能为空')
  }

  // 校验 content
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw ApiError.badRequest('content 不能为空')
  }

  // 校验 satisfaction（可选，1-5）
  var severity = FeedbackSeverity.NORMAL
  var contentObj: Record<string, unknown> = { message: content }

  if (satisfaction !== undefined) {
    if (typeof satisfaction !== 'number' || satisfaction < 1 || satisfaction > 5) {
      throw ApiError.badRequest('satisfaction 必须为 1~5 的数字')
    }
    severity = ratingToSeverity(satisfaction)
    contentObj.satisfaction = satisfaction
  }

  var contentStr = JSON.stringify(contentObj)

  var supabase = await getSupabaseAdmin()

  var insertRow: Record<string, unknown> = {
    user_id: user!.id,
    type: type,
    severity: severity,
    title: title.trim(),
    content: contentStr,
    contact: (contact && typeof contact === 'string') ? contact.trim() : null,
    status: FeedbackStatus.OPEN,
    source: FeedbackSource.GENERAL,
  }

  var { data: inserted, error: insertError } = await supabase
    .from('feedback')
    .insert(insertRow)
    .select('id')
    .single()

  if (insertError) {
    throw ApiError.internal('提交反馈失败: ' + insertError.message)
  }

  return c.json({
    success: true,
    feedbackId: inserted ? (inserted as { id: string }).id : '',
  })
})

// ─── GET /mine ───

app.get('/mine', authRequired, async function(c) {
  var user = (c as any).get('user') as AuthUser | null
  requireUser(c)

  var supabase = await getSupabaseAdmin()

  var { data: rows, error } = await supabase
    .from('feedback')
    .select('id, type, severity, title, content, status, created_at')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    throw ApiError.internal('查询反馈列表失败: ' + error.message)
  }

  // 解析 content 中的 satisfaction
  var items: Record<string, unknown>[] = []
  if (rows) {
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] as Record<string, unknown>
      var sat = null
      try {
        var parsed = JSON.parse(row.content as string) as Record<string, unknown>
        if (typeof parsed.satisfaction === 'number') {
          sat = parsed.satisfaction
        }
      } catch (_) {
        // 忽略解析失败
      }
      items.push({
        id: row.id,
        type: row.type,
        severity: row.severity,
        title: row.title,
        status: row.status,
        satisfaction: sat,
        created_at: row.created_at,
      })
    }
  }

  return c.json({ items: items })
})

// ─── GET /admin/feedbacks — 反馈列表 ───

app.get('/admin/feedbacks', authRequired, requireAdmin(), async function(c) {
  var status = c.req.query('status') || ''
  var type = c.req.query('type') || ''
  var page = parseInt(c.req.query('page') || '1', 10)
  var pageSize = parseInt(c.req.query('pageSize') || '20', 10)

  if (isNaN(page) || page < 1) page = 1
  if (isNaN(pageSize) || pageSize < 1) pageSize = 20
  if (pageSize > 100) pageSize = 100

  var supabase = await getSupabaseAdmin()

  // 构建查询
  var query = supabase
    .from('feedback')
    .select('id, user_id, type, severity, title, status, created_at, contact, content', { count: 'exact' })

  if (status && isValidEnumValue(status, FEEDBACK_STATUS_VALUES)) {
    query = query.eq('status', status)
  }
  if (type && isValidEnumValue(type, FEEDBACK_TYPE_VALUES)) {
    query = query.eq('type', type)
  }

  var from = (page - 1) * pageSize
  var to = from + pageSize - 1

  var { data: rows, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw ApiError.internal('查询反馈列表失败: ' + error.message)
  }

  // 解析 content 中的 satisfaction
  var items: Record<string, unknown>[] = []
  if (rows) {
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i] as Record<string, unknown>
      var sat = null
      try {
        var parsed = JSON.parse(row.content as string) as Record<string, unknown>
        if (typeof parsed.satisfaction === 'number') {
          sat = parsed.satisfaction
        }
      } catch (_) {
        // 忽略解析失败
      }
      items.push({
        id: row.id,
        user_id: row.user_id,
        type: row.type,
        severity: row.severity,
        title: row.title,
        status: row.status,
        created_at: row.created_at,
        contact: row.contact,
        satisfaction: sat,
      })
    }
  }

  return c.json({
    items: items,
    total: count || 0,
    page: page,
    pageSize: pageSize,
  })
})

// ─── PATCH /admin/feedbacks/:id ───

app.patch('/admin/feedbacks/:id', authRequired, requireAdmin(), async function(c) {
  var id = c.req.param('id')
  if (!id) {
    throw ApiError.badRequest('缺少反馈 ID')
  }

  var body: Record<string, unknown> = {}
  try {
    body = await c.req.json()
  } catch (_) {
    throw ApiError.badRequest('请求体不是合法的 JSON')
  }

  var newStatus = body.status as string | undefined
  var resolution = body.resolution as string | undefined

  if (!newStatus || !isValidEnumValue(newStatus, FEEDBACK_STATUS_VALUES)) {
    throw ApiError.badRequest('status 必须是合法状态值: ' + FEEDBACK_STATUS_VALUES.join(', '))
  }

  var supabase = await getSupabaseAdmin()

  // 查询当前反馈
  var { data: existing, error: findError } = await supabase
    .from('feedback')
    .select('id, status')
    .eq('id', id)
    .single()

  if (findError || !existing) {
    throw ApiError.notFound('反馈不存在')
  }

  var currentStatus = existing.status || 'open'
  var allowedNext = FEEDBACK_STATUS_TRANSITIONS[currentStatus]
  if (!allowedNext || allowedNext.indexOf(newStatus) === -1) {
    throw ApiError.badRequest(
      '状态流转不合法，无法从 ' + currentStatus + ' 转为 ' + newStatus
    )
  }

  // 构建更新字段
  var updateFields: Record<string, unknown> = {
    status: newStatus,
  }

  if (resolution && typeof resolution === 'string') {
    updateFields.resolution = resolution.trim()
  }

  if (newStatus === 'resolved' || newStatus === 'closed') {
    updateFields.resolved_at = new Date().toISOString()
    updateFields.resolved_by = user!.id
  }

  var { data: updated, error: updateError } = await supabase
    .from('feedback')
    .update(updateFields)
    .eq('id', id)
    .select('id, type, severity, title, status, resolution, resolved_at, resolved_by, updated_at')
    .single()

  if (updateError) {
    throw ApiError.internal('更新反馈失败: ' + updateError.message)
  }

  return c.json({
    success: true,
    feedback: updated,
  })
})

// ─── GET /admin/feedbacks/stats ───

app.get('/admin/feedbacks/stats', authRequired, requireAdmin(), async function(c) {
  var supabase = await getSupabaseAdmin()

  // 查询所有反馈
  var { data: rows, error } = await supabase
    .from('feedback')
    .select('id, type, status, content')

  if (error) {
    throw ApiError.internal('查询反馈统计失败: ' + error.message)
  }

  var total = rows ? rows.length : 0

  // 按 type 统计
  var byType: Record<string, number> = {}
  var typeValues = FEEDBACK_TYPE_VALUES
  for (var ti = 0; ti < typeValues.length; ti++) {
    byType[typeValues[ti]] = 0
  }

  // 按 status 统计
  var byStatus: Record<string, number> = {}
  var statusValues = FEEDBACK_STATUS_VALUES
  for (var si = 0; si < statusValues.length; si++) {
    byStatus[statusValues[si]] = 0
  }

  // 满意度汇总
  var totalSatisfaction = 0
  var satisfactionCount = 0

  for (var i = 0; i < total; i++) {
    var row = rows![i]

    // type 统计
    var rtype = row.type || 'other'
    if (byType[rtype] !== undefined) {
      byType[rtype]++
    } else {
      byType['other']++
    }

    // status 统计
    var rstatus = row.status || 'open'
    if (byStatus[rstatus] !== undefined) {
      byStatus[rstatus]++
    } else {
      byStatus['open']++
    }

    // 解析 satisfaction
    try {
      var parsed = JSON.parse(row.content) as Record<string, unknown>
      var sat = parsed.satisfaction as number | undefined
      if (typeof sat === 'number' && sat >= 1 && sat <= 5) {
        totalSatisfaction += sat
        satisfactionCount++
      }
    } catch (_) {
      // 忽略解析失败
    }
  }

  var avgSatisfaction = satisfactionCount > 0
    ? Math.round((totalSatisfaction / satisfactionCount) * 100) / 100
    : 0

  return c.json({
    total: total,
    byType: byType,
    byStatus: byStatus,
    avgSatisfaction: avgSatisfaction,
  })
})

export default app
