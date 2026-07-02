/**
 * 命盘分析路由（骨架）
 *
 *   POST /api/analyze   —— 基础 / 完整 / AI 分析
 *
 * 请求体：
 *   { chart_id?: string, chart_data?: BaZiChart, analysis_type: 'basic' | 'full' | 'ai' }
 *
 * 说明：
 *   - chart_id 与 chart_data 至少传入其一；
 *   - TODO: 接入规则引擎 runBaZiPipeline / AI 报告生成 generateBaZiAIReport；
 *   - TODO: 将结果写入 analysis_history 表并更新 users.total_analyses。
 */

import { Hono } from 'hono'
import { ApiError } from '../middleware/error'

const app = new Hono()

app.post('/', async (c) => {
  let body: { chart_id?: string; chart_data?: unknown; analysis_type?: string }
  try {
    body = await c.req.json()
  } catch {
    throw ApiError.badRequest('请求体不是合法的 JSON')
  }

  const analysisType = body.analysis_type
  if (analysisType !== 'basic' && analysisType !== 'full' && analysisType !== 'ai') {
    throw ApiError.validationError('analysis_type 必须为 basic | full | ai', {
      field: 'analysis_type',
    })
  }

  if (!body.chart_id && !body.chart_data) {
    throw ApiError.validationError('chart_id 或 chart_data 至少需提供其一')
  }

  // TODO: 调用 runBaZiPipeline({ ... }, { includeAI: analysisType === 'ai' })
  // TODO: 持久化到 analysis_history 表
  return c.json({
    analysis: {
      type: analysisType,
      status: 'todo',
      message: '分析能力尚未接入，请等待规则引擎 / AI 报告对接',
    },
  })
})

export default app
