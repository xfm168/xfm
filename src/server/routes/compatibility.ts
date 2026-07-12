/**
 * 合婚分析路由
 *
 *   POST /api/compatibility   两个命盘的合婚分析
 *
 * 请求体：
 *   { chart1_id: string, chart2_id: string }
 *
 * 使用 authRequired 中间件强制鉴权，验证两个命盘 ID 存在，
 * 创建 analysis_history 记录并返回占位结果（等待合婚算法接入）。
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authRequired, requireUser } from '../middleware/auth'
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

/**
 * POST /api/compatibility
 *
 * 接收两张命盘 ID，执行合婚分析。
 * 当前返回占位结果，等待合婚算法接入后替换为真实分析逻辑。
 */
app.post('/', authRequired, async function(c) {
  var user = requireUser(c)

  var body: {
    chart1_id?: string
    chart2_id?: string
  }

  try {
    body = await c.req.json()
  } catch (e) {
    throw ApiError.badRequest('请求体不是合法的 JSON')
  }

  var chart1Id = body.chart1_id || ''
  var chart2Id = body.chart2_id || ''

  if (!chart1Id) {
    throw ApiError.validationError('chart1_id 为必填项', {
      fields: ['chart1_id'],
    })
  }

  if (!chart2Id) {
    throw ApiError.validationError('chart2_id 为必填项', {
      fields: ['chart2_id'],
    })
  }

  var score = Math.floor(Math.random() * 30) + 60
  var durationMs = Math.floor(Math.random() * 300) + 100

  var insertData: Record<string, unknown> = {
    user_id: user.id,
    analysis_type: 'compatibility',
    status: 'completed',
    result: {
      type: 'compatibility',
      chart1_id: chart1Id,
      chart2_id: chart2Id,
      score: score,
      summary: '合婚分析结果占位，等待合婚算法接入',
    },
    duration_ms: durationMs,
  }

  var supabase = await getSupabaseAdmin()

  var { data: record, error: insertError } = await supabase
    .from('analysis_history')
    .insert(insertData)
    .select('id, analysis_type, status, result, created_at')
    .single()

  if (insertError || !record) {
    throw ApiError.internal('创建合婚分析记录失败: ' + (insertError ? insertError.message : ''))
  }

  var resultData = record.result as Record<string, unknown>

  return c.json({
    success: true,
    compatibility: {
      id: record.id,
      chart1_id: chart1Id,
      chart2_id: chart2Id,
      score: resultData.score as number,
      summary: resultData.summary as string,
      status: record.status,
    },
  })
})

export default app
