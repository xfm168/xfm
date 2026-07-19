/**
 * 专业报告反馈路由
 *
 *   POST   /                提交报告反馈（匿名可用）
 *   GET    /stats           反馈统计（管理员用）
 *   PATCH  /:id/status      更新反馈状态（运营后台用）
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 * 禁止 import { type X }，使用 import type { X } 单独语句。
 */

import { Hono } from 'hono'
import { authOptional } from '../middleware/auth'
import { authRequired } from '../middleware/auth'
import type { AuthUser } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import {
  FeedbackStatus,
  FEEDBACK_STATUS_VALUES,
  FEEDBACK_STATUS_TRANSITIONS,
  FeedbackType,
  FeedbackSeverity,
  FeedbackSource,
  ratingToSeverity,
} from '../../shared/domain'

var app = new Hono()

// ─── 辅助函数 ───

/** 获取 Supabase Admin 客户端（服务端使用 service_role key） */
async function getSupabaseAdmin() {
  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !supabaseServiceKey) {
    throw ApiError.internal('\u7F3A\u5C11 Supabase \u73AF\u5883\u53D8\u91CF\u914D\u7F6E')
  }
  var { createClient } = await import('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseServiceKey)
}

/** 根据 overall_rating 映射 severity（统一使用 domain 定义） */
function getSeverityFromRating(rating: number): FeedbackSeverity {
  return ratingToSeverity(rating)
}

/** 合法状态流转定义（统一使用 domain 定义，禁止在此处硬编码） */
var VALID_TRANSITIONS = FEEDBACK_STATUS_TRANSITIONS

/** 校验维度评分是否合法（每项 1~5，允许 0 表示未评分） */
function validateDimensionRatings(
  dims: Record<string, number>,
): boolean {
  var keys = ['accuracy', 'personality', 'career', 'wealth', 'marriage', 'health']
  for (var i = 0; i < keys.length; i++) {
    var val = dims[keys[i]]
    if (val !== undefined && val !== 0) {
      if (typeof val !== 'number' || val < 1 || val > 5) {
        return false
      }
    }
  }
  return true
}

// ─── POST / ───

app.post('/', authOptional, async function(c) {
  var user = (c as any).get('user') as AuthUser | null

  var body: Record<string, unknown> = {}
  try {
    body = await c.req.json()
  } catch (_) {
    throw ApiError.badRequest('\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5\u7684 JSON')
  }

  // 参数提取
  var reportId = body.report_id as string | undefined
  var overallRating = body.overall_rating as number | undefined
  var dimensionRatings = body.dimension_ratings as Record<string, number> | undefined
  var mostAccurate = body.most_accurate as string | undefined
  var improvementSuggestions = body.improvement_suggestions as string | undefined
  var wouldContinue = body.would_continue as string | undefined
  var isAnonymous = body.is_anonymous as boolean | undefined
  var engineVersion = body.engine_version as string | undefined
  var tier = body.tier as string | undefined
  var chartId = body.chart_id as string | null | undefined

  // 校验
  if (!reportId) {
    throw ApiError.badRequest('\u7F3A\u5C11 report_id')
  }
  if (typeof overallRating !== 'number' || overallRating < 1 || overallRating > 5) {
    throw ApiError.badRequest('overall_rating \u5FC5\u987B\u4E3A 1~5 \u7684\u6570\u5B57')
  }
  if (dimensionRatings && !validateDimensionRatings(dimensionRatings)) {
    throw ApiError.badRequest('dimension_ratings \u6BCF\u9879\u5FC5\u987B\u4E3A 0~5 \u7684\u6570\u5B57')
  }

  var userId: string | null = null
  if (user) {
    userId = user.id
  }

  // 构建 content JSON 字符串
  var contentObj: Record<string, unknown> = {
    overall_rating: overallRating,
    feedback_status: 'open',
  }
  if (dimensionRatings) {
    contentObj.dimension_ratings = dimensionRatings
  }
  if (mostAccurate) {
    contentObj.most_accurate = mostAccurate
  }
  if (improvementSuggestions) {
    contentObj.improvement_suggestions = improvementSuggestions
  }
  if (wouldContinue) {
    contentObj.would_continue = wouldContinue
  }
  if (isAnonymous !== undefined) {
    contentObj.is_anonymous = isAnonymous
  }
  if (engineVersion) {
    contentObj.engine_version = engineVersion
  }
  if (tier) {
    contentObj.tier = tier
  }

  var contentStr = JSON.stringify(contentObj)

  var supabase = await getSupabaseAdmin()

  var insertRow: Record<string, unknown> = {
    user_id: userId,
    chart_id: chartId || null,
    type: FeedbackType.ACCURACY,
    severity: getSeverityFromRating(overallRating),
    title: '\u4E13\u4E1A\u62A5\u544A\u53CD\u9988 - ' + reportId,
    content: contentStr,
    contact: null,
    status: FeedbackStatus.OPEN,
    source: FeedbackSource.REPORT,
    report_id: reportId,
    engine_version: engineVersion || null,
    user_tier: tier || null,
  }

  var { data: inserted, error: insertError } = await supabase
    .from('feedback')
    .insert(insertRow)
    .select('id, status')
    .single()

  if (insertError) {
    throw ApiError.internal('\u63D0\u4EA4\u53CD\u9988\u5931\u8D25: ' + insertError.message)
  }

  return c.json({
    success: true,
    feedback_id: inserted ? (inserted as { id: string }).id : '',
    feedback_status: inserted ? (inserted as { status: string }).status : 'open',
  })
})

// ─── GET /stats ───

app.get('/stats', authRequired, async function(c) {
  var supabase = await getSupabaseAdmin()

  // 查询所有反馈
  var { data: rows, error } = await supabase
    .from('feedback')
    .select('id, content, status')

  if (error) {
    throw ApiError.internal('\u67E5\u8BE2\u53CD\u9988\u7EDF\u8BA1\u5931\u8D25: ' + error.message)
  }

  var totalFeedbacks = rows ? rows.length : 0
  var totalRating = 0
  var ratingCount = 0
  var dimensionSums: Record<string, number> = {
    accuracy: 0,
    personality: 0,
    career: 0,
    wealth: 0,
    marriage: 0,
    health: 0,
  }
  var dimensionCounts: Record<string, number> = {
    accuracy: 0,
    personality: 0,
    career: 0,
    wealth: 0,
    marriage: 0,
    health: 0,
  }
  var statusCounts: Record<string, number> = {}
  for (var si = 0; si < FEEDBACK_STATUS_VALUES.length; si++) {
    statusCounts[FEEDBACK_STATUS_VALUES[si]] = 0
  }

  for (var i = 0; i < totalFeedbacks; i++) {
    var row = rows![i]

    // 状态统计
    var status = row.status || 'open'
    if (statusCounts[status] !== undefined) {
      statusCounts[status]++
    } else {
      statusCounts['open']++
    }

    // 解析 content
    try {
      var parsed = JSON.parse(row.content) as Record<string, unknown>
      var rating = parsed.overall_rating as number | undefined
      if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
        totalRating += rating
        ratingCount++
      }
      var dims = parsed.dimension_ratings as Record<string, number> | undefined
      if (dims) {
        var dimKeys = Object.keys(dimensionSums)
        for (var j = 0; j < dimKeys.length; j++) {
          var dk = dimKeys[j]
          var dv = dims[dk]
          if (typeof dv === 'number' && dv >= 1 && dv <= 5) {
            dimensionSums[dk] += dv
            dimensionCounts[dk]++
          }
        }
      }
    } catch (_) {
      // 忽略解析失败
    }
  }

  var avgRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 100) / 100 : 0
  var dimensionAvgs: Record<string, number> = {}
  var dimKeyArr = Object.keys(dimensionSums)
  for (var k = 0; k < dimKeyArr.length; k++) {
    var key = dimKeyArr[k]
    dimensionAvgs[key] = dimensionCounts[key] > 0
      ? Math.round((dimensionSums[key] / dimensionCounts[key]) * 100) / 100
      : 0
  }

  return c.json({
    total_feedbacks: totalFeedbacks,
    average_rating: avgRating,
    rating_count: ratingCount,
    dimension_averages: dimensionAvgs,
    status_counts: statusCounts,
  })
})

// ─── PATCH /:id/status ───

app.patch('/:id/status', authRequired, async function(c) {
  var user = (c as any).get('user') as AuthUser | null

  var id = c.req.param('id')
  if (!id) {
    throw ApiError.badRequest('\u7F3A\u5C11\u53CD\u9988 ID')
  }

  var body: Record<string, unknown> = {}
  try {
    body = await c.req.json()
  } catch (_) {
    throw ApiError.badRequest('\u8BF7\u6C42\u4F53\u4E0D\u662F\u5408\u6CD5\u7684 JSON')
  }

  var newStatus = body.status as string | undefined
  var patchAllowedStatuses = FEEDBACK_STATUS_VALUES.filter(function(s) {
    return s !== FeedbackStatus.OPEN && s !== FeedbackStatus.PROCESSING
  })
  if (!newStatus || patchAllowedStatuses.indexOf(newStatus) === -1) {
    throw ApiError.badRequest(
      '\u65E0\u6548\u7684\u72B6\u6001\u503C\uFF0C\u5141\u8BB8: ' + patchAllowedStatuses.join(', ')
    )
  }

  var supabase = await getSupabaseAdmin()

  // 查询当前反馈
  var { data: existing, error: findError } = await supabase
    .from('feedback')
    .select('id, status')
    .eq('id', id)
    .single()

  if (findError || !existing) {
    throw ApiError.notFound('\u53CD\u9988\u4E0D\u5B58\u5728')
  }

  var currentStatus = existing.status || 'open'
  var allowedNext = VALID_TRANSITIONS[currentStatus]
  if (!allowedNext || allowedNext.indexOf(newStatus) === -1) {
    throw ApiError.badRequest(
      '\u72B6\u6001\u6D41\u8F6C\u4E0D\u5408\u6CD5\uFF0C\u65E0\u6CD5\u4ECE ' +
      currentStatus + ' \u8F6C\u4E3A ' + newStatus
    )
  }

  // 更新
  var updateFields: Record<string, unknown> = {
    status: newStatus,
  }

  if (newStatus === 'resolved' || newStatus === 'closed') {
    updateFields.resolved_at = new Date().toISOString()
    updateFields.resolved_by = user!.id
  }

  var { data: updated, error: updateError } = await supabase
    .from('feedback')
    .update(updateFields)
    .eq('id', id)
    .select('id, status, updated_at, resolved_at, resolved_by')
    .single()

  if (updateError) {
    throw ApiError.internal('\u66F4\u65B0\u53CD\u9988\u72B6\u6001\u5931\u8D25: ' + updateError.message)
  }

  return c.json({
    success: true,
    feedback: updated,
  })
})

export default app
