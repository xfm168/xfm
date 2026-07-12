/**
 * 命盘分析路由
 *
 *   POST /api/analyze   基础 / 完整 / AI 分析
 *
 * 请求体：
 *   { chart_id?: string, chart_data?: object, analysis_type: 'basic' | 'full' | 'ai' }
 *
 * 使用 authRequired 中间件强制鉴权，验证 analysis_type 和 chart_id / chart_data，
 * 创建 analysis_history 记录并返回占位结果（等待 Pipeline 接入）。
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authRequired, requireUser } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import type { AnalysisType, AnalysisStatus, AnalysisHistoryInsert } from '../../lib/database/types'

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

/** 合法的分析类型列表 */
var VALID_ANALYSIS_TYPES: string[] = ['basic', 'full', 'ai']

/**
 * POST /api/analyze
 *
 * 接收命盘 ID 或命盘数据，按 analysis_type 执行分析。
 * 当前返回占位结果，等待 Pipeline 接入后替换为真实分析逻辑。
 */
app.post('/', authRequired, async function(c) {
  var user = requireUser(c)

  var body: {
    chart_id?: string
    chart_data?: unknown
    analysis_type?: string
  }

  try {
    body = await c.req.json()
  } catch (e) {
    throw ApiError.badRequest('请求体不是合法的 JSON')
  }

  var analysisType = body.analysis_type || ''

  if (VALID_ANALYSIS_TYPES.indexOf(analysisType) === -1) {
    throw ApiError.validationError('analysis_type 必须为 basic | full | ai', {
      field: 'analysis_type',
    })
  }

  if (!body.chart_id && !body.chart_data) {
    throw ApiError.validationError('chart_id 或 chart_data 至少需提供其一')
  }

  var typedAnalysisType = analysisType as AnalysisType
  var aiModel: string | null = analysisType === 'ai' ? 'gpt-4o' : null
  var aiTokensUsed: number | null = analysisType === 'ai' ? 1500 : null
  var durationMs = Math.floor(Math.random() * 200) + 50

  var insertData: AnalysisHistoryInsert = {
    user_id: user.id,
    chart_id: body.chart_id || null,
    analysis_type: typedAnalysisType,
    result: {
      type: analysisType,
      message: '分析结果占位，等待 Pipeline 接入',
    },
    ai_model: aiModel,
    ai_tokens_used: aiTokensUsed,
    duration_ms: durationMs,
    status: 'completed' as AnalysisStatus,
  }

  var supabase = await getSupabaseAdmin()

  var { data: record, error: insertError } = await supabase
    .from('analysis_history')
    .insert(insertData)
    .select('id, analysis_type, status, result, created_at')
    .single()

  if (insertError || !record) {
    throw ApiError.internal('创建分析记录失败: ' + (insertError ? insertError.message : ''))
  }

  return c.json({
    success: true,
    analysis: record,
  })
})

export default app
