/**
 * 专业报告历史路由
 *
 *   GET  /api/pro-reports           查询当前用户的专业报告历史
 *   POST /api/pro-reports           保存专业报告到 Supabase
 *   POST /api/pro-reports/migrate   一次性迁移 localStorage 旧数据到 Supabase
 *   GET  /api/pro-reports/:id       获取单个专业报告详情
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authOptional } from '../middleware/auth'
import { authRequired } from '../middleware/auth'
import type { AuthUser } from '../middleware/auth'
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

/** 历史列表条目 */
interface ProHistoryItem {
  id: string
  chart_id: string | null
  engineVersion: string
  created_at: string
}

/** 迁移请求中的旧数据项 */
interface LegacyItem {
  birth_date: string
  birth_time: string
  gender: string
  chart_data: Record<string, unknown>
  created_at: string
}

/**
 * GET /
 * 查询当前用户的专业报告历史（analysis_type = 'pro'）
 */
app.get('/', authOptional, async function(c) {
  var user = (c as any).get('user') as AuthUser | null

  if (!user) {
    return c.json({ items: [], total: 0, page: 1, limit: 20 })
  }

  var page = Math.max(1, Number(c.req.query('page')) || 1)
  var limitRaw = Number(c.req.query('limit')) || 20
  var limit = Math.min(100, Math.max(1, limitRaw))

  var supabase = await getSupabaseAdmin()

  // 先查总数
  var { count, error: countError } = await supabase
    .from('analysis_history')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('analysis_type', 'pro')

  if (countError) {
    throw ApiError.internal('查询专业报告总数失败: ' + countError.message)
  }

  var total = count || 0

  // 查列表
  var offset = (page - 1) * limit
  var { data, error } = await supabase
    .from('analysis_history')
    .select('id, chart_id, result, created_at')
    .eq('user_id', user.id)
    .eq('analysis_type', 'pro')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw ApiError.internal('查询专业报告历史失败: ' + error.message)
  }

  var items: ProHistoryItem[] = []
  if (data && data.length > 0) {
    for (var i = 0; i < data.length; i++) {
      var row = data[i] as { id: string; chart_id: string | null; result: unknown; created_at: string }
      var result = (row.result || {}) as Record<string, unknown>
      items.push({
        id: row.id,
        chart_id: row.chart_id,
        engineVersion: String(result.engineVersion || ''),
        created_at: row.created_at,
      })
    }
  }

  return c.json({
    items: items,
    total: total,
    page: page,
    limit: limit,
  })
})

/**
 * POST /
 * 保存专业报告到 Supabase
 */
app.post('/', authRequired, async function(c) {
  var user = (c as any).get('user') as AuthUser

  var body: Record<string, unknown> = {}
  try {
    body = await c.req.json()
  } catch (_) {
    throw ApiError.badRequest('请求体不是合法的 JSON')
  }

  var chartId = body.chart_id as string | null | undefined
  var reportData = body.report_data as Record<string, unknown> | undefined

  if (!reportData) {
    throw ApiError.badRequest('缺少 report_data 字段')
  }

  var supabase = await getSupabaseAdmin()
  var finalChartId: string | null = chartId || null

  // 如果 chart_id 为空，先在 charts 表创建命盘记录
  if (!finalChartId) {
    var chart = reportData.chart as Record<string, unknown> | undefined
    var birthDate = chart ? String(chart.birthDate || '') : ''
    var birthTime = chart ? String(chart.birthTime || '') : ''
    var gender = chart ? String(chart.gender || '') : ''

    if (birthDate && birthTime && gender) {
      var genderApi = gender === '\u7537' ? 'male' : 'female'
      var { data: newChart, error: chartError } = await supabase
        .from('charts')
        .insert({
          user_id: user.id,
          birth_date: birthDate,
          birth_time: birthTime,
          gender: genderApi,
          chart_data: {},
        })
        .select('id')
        .single()

      if (!chartError && newChart) {
        finalChartId = (newChart as { id: string }).id
      }
    }
  }

  // 存储精简 result（不存 raw 原始数据，减少存储量）
  var resultToStore: Record<string, unknown> = {
    reportId: reportData.reportId || '',
    engineVersion: reportData.engineVersion || '',
    chart: reportData.chart || null,
    confidence: reportData.confidence || null,
    createdAt: reportData.createdAt || new Date().toISOString(),
  }

  var { data: inserted, error: insertError } = await supabase
    .from('analysis_history')
    .insert({
      user_id: user.id,
      chart_id: finalChartId,
      analysis_type: 'pro',
      result: resultToStore,
      status: 'completed',
    })
    .select('id')
    .single()

  if (insertError) {
    throw ApiError.internal('保存专业报告失败: ' + insertError.message)
  }

  return c.json({
    success: true,
    analysis_id: inserted ? (inserted as { id: string }).id : '',
  })
})

/**
 * POST /migrate
 * 一次性迁移 localStorage 旧数据到 Supabase
 */
app.post('/migrate', authRequired, async function(c) {
  var user = (c as any).get('user') as AuthUser

  var body: Record<string, unknown> = {}
  try {
    body = await c.req.json()
  } catch (_) {
    throw ApiError.badRequest('请求体不是合法的 JSON')
  }

  var items = body.items as LegacyItem[] | undefined
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('缺少 items 字段或 items 为空')
  }

  var supabase = await getSupabaseAdmin()
  var migrated = 0
  var skipped = 0
  var errors: string[] = []

  for (var i = 0; i < items.length; i++) {
    var item = items[i]

    if (!item.birth_date || !item.birth_time || !item.gender) {
      errors.push('\u7B2C ' + String(i + 1) + ' \u9879\u7F3A\u5C11\u5FC5\u8981\u5B57\u6BB5')
      skipped++
      continue
    }

    try {
      // 在 charts 表查找匹配记录
      var { data: existingCharts, error: findError } = await supabase
        .from('charts')
        .select('id')
        .eq('user_id', user.id)
        .eq('birth_date', item.birth_date)
        .eq('birth_time', item.birth_time)
        .eq('gender', item.gender)

      if (findError) {
        errors.push('\u67E5\u627E\u547D\u76D8\u5931\u8D25: ' + findError.message)
        skipped++
        continue
      }

      var chartId: string | null = null

      if (existingCharts && existingCharts.length > 0) {
        chartId = (existingCharts[0] as { id: string }).id
      } else {
        // 插入新命盘记录
        var { data: newChart, error: insertChartError } = await supabase
          .from('charts')
          .insert({
            user_id: user.id,
            birth_date: item.birth_date,
            birth_time: item.birth_time,
            gender: item.gender,
            chart_data: item.chart_data || {},
          })
          .select('id')
          .single()

        if (insertChartError) {
          errors.push('\u521B\u5EFA\u547D\u76D8\u5931\u8D25: ' + insertChartError.message)
          skipped++
          continue
        }

        chartId = newChart ? (newChart as { id: string }).id : null
      }

      // 在 analysis_history 表插入 legacy 记录
      var { error: insertHistoryError } = await supabase
        .from('analysis_history')
        .insert({
          user_id: user.id,
          chart_id: chartId,
          analysis_type: 'legacy',
          result: {
            engineVersion: 'pre-V5.0',
            chart: {
              birthDate: item.birth_date,
              birthTime: item.birth_time,
              gender: item.gender,
            },
            chart_data: item.chart_data || {},
            createdAt: item.created_at || new Date().toISOString(),
          },
          status: 'completed',
        })

      if (insertHistoryError) {
        errors.push('\u4FDD\u5B58\u5386\u53F2\u8BB0\u5F55\u5931\u8D25: ' + insertHistoryError.message)
        skipped++
        continue
      }

      migrated++
    } catch (err) {
      var msg = err instanceof Error ? err.message : '\u672A\u77E5\u9519\u8BEF'
      errors.push('\u7B2C ' + String(i + 1) + ' \u9879\u8FC1\u79FB\u5F02\u5E38: ' + msg)
      skipped++
    }
  }

  return c.json({
    success: true,
    migrated: migrated,
    skipped: skipped,
    errors: errors,
  })
})

/**
 * GET /:id
 * 获取单个专业报告详情
 */
app.get('/:id', authOptional, async function(c) {
  var user = (c as any).get('user') as AuthUser | null

  if (!user) {
    throw ApiError.unauthorized('\u8BF7\u5148\u767B\u5F55')
  }

  var id = c.req.param('id')
  if (!id) {
    throw ApiError.badRequest('\u7F3A\u5C11\u62A5\u544A ID')
  }

  var supabase = await getSupabaseAdmin()

  var { data, error } = await supabase
    .from('analysis_history')
    .select('id, analysis_type, result, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    throw ApiError.notFound('\u62A5\u544A\u4E0D\u5B58\u5728\u6216\u65E0\u6743\u8BBF\u95EE')
  }

  var detailRow = data as { id: string; analysis_type: string; result: unknown; created_at: string }

  if (detailRow.analysis_type !== 'pro' && detailRow.analysis_type !== 'legacy') {
    throw ApiError.notFound('\u8BE5\u8BB0\u5F55\u4E0D\u662F\u4E13\u4E1A\u62A5\u544A')
  }

  return c.json({
    id: detailRow.id,
    analysis_type: detailRow.analysis_type,
    result: detailRow.result,
    created_at: detailRow.created_at,
  })
})

export default app