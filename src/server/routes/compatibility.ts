/**
 * 合婚分析路由（骨架）
 *
 *   POST /api/compatibility   —— 两个命盘的合婚分析
 *
 * 请求体：
 *   { chart1_id: string, chart2_id: string }
 *
 * 说明：
 *   - TODO: 从 charts 表读取两张命盘；
 *   - TODO: 调用合婚算法（五行互补 / 神煞对照 / 日主关系等）；
 *   - TODO: 写入 analysis_history（analysis_type = 'compatibility'）。
 */

import { Hono } from 'hono'
import { ApiError } from '../middleware/error'

const app = new Hono()

app.post('/', async (c) => {
  let body: { chart1_id?: string; chart2_id?: string }
  try {
    body = await c.req.json()
  } catch {
    throw ApiError.badRequest('请求体不是合法的 JSON')
  }

  if (!body.chart1_id || !body.chart2_id) {
    throw ApiError.validationError('chart1_id 与 chart2_id 均为必填', {
      fields: ['chart1_id', 'chart2_id'],
    })
  }

  // TODO: 读取两张命盘并运行合婚算法
  return c.json({
    compatibility: {
      status: 'todo',
      chart1_id: body.chart1_id,
      chart2_id: body.chart2_id,
      message: '合婚分析尚未接入，等待算法实现',
    },
  })
})

export default app
