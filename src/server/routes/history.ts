/**
 * 历史记录路由
 *
 *   GET /api/history   查询当前用户的历史记录（命盘 / 分析）
 *
 * 查询参数：
 *   page  = 1     页码（从 1 开始，默认 1）
 *   limit = 20    每页数量（默认 20，上限 100）
 *   type  = chart | analysis   记录类型筛选
 *   sort  = asc | desc   排序方向（默认 desc，按 created_at）
 *
 * 使用 authOptional 中间件，已登录用户从 charts 和 analysis_history 表
 * 分别查询后合并排序分页，未登录用户返回空列表。
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authOptional } from '../middleware/auth'
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

/** 统一的历史条目结构，用于合并 charts 与 analysis_history */
interface HistoryItem {
  id: string
  item_type: 'chart' | 'analysis'
  name: string | null
  chart_id: string | null
  analysis_type: string | null
  result: Record<string, unknown> | null
  status: string | null
  created_at: string
}

/**
 * GET /api/history
 *
 * 查询当前用户的历史记录，支持按 type 筛选 chart 或 analysis，
 * 合并 charts 和 analysis_history 两张表的数据后按 created_at 降序分页返回。
 */
app.get('/', authOptional, async function(c) {
  var user = (c as any).get('user') as { id: string } | null

  if (!user) {
    return c.json({ items: [], total: 0, page: 1, limit: 20 })
  }

  var page = Math.max(1, Number(c.req.query('page')) || 1)
  var limitRaw = Number(c.req.query('limit')) || 20
  var limit = Math.min(100, Math.max(1, limitRaw))
  var type = c.req.query('type') || ''
  var sort = (c.req.query('sort') || 'desc').toLowerCase()
  var ascending = sort === 'asc'

  var supabase = await getSupabaseAdmin()

  var allItems: HistoryItem[] = []

  if (type === 'analysis') {
    var { data: analyses, error: analysisError } = await supabase
      .from('analysis_history')
      .select('id, user_id, chart_id, analysis_type, result, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: ascending })

    if (analysisError) {
      throw ApiError.internal('查询分析历史失败: ' + analysisError.message)
    }

    if (analyses && analyses.length > 0) {
      for (var i = 0; i < analyses.length; i++) {
        var a = analyses[i]
        allItems.push({
          id: a.id,
          item_type: 'analysis',
          name: null,
          chart_id: a.chart_id,
          analysis_type: a.analysis_type,
          result: a.result,
          status: a.status,
          created_at: a.created_at,
        })
      }
    }
  } else if (type === 'chart') {
    var { data: charts, error: chartError } = await supabase
      .from('charts')
      .select('id, user_id, name, birth_date, birth_time, gender, chart_data, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: ascending })

    if (chartError) {
      throw ApiError.internal('查询命盘历史失败: ' + chartError.message)
    }

    if (charts && charts.length > 0) {
      for (var j = 0; j < charts.length; j++) {
        var ch = charts[j]
        allItems.push({
          id: ch.id,
          item_type: 'chart',
          name: ch.name,
          chart_id: ch.id,
          analysis_type: null,
          result: ch.chart_data,
          status: null,
          created_at: ch.created_at,
        })
      }
    }
  } else {
    var chartsResult = await supabase
      .from('charts')
      .select('id, user_id, name, birth_date, birth_time, gender, chart_data, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: ascending })

    if (chartsResult.error) {
      throw ApiError.internal('查询命盘历史失败: ' + chartsResult.error.message)
    }

    var analysisResult = await supabase
      .from('analysis_history')
      .select('id, user_id, chart_id, analysis_type, result, status, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: ascending })

    if (analysisResult.error) {
      throw ApiError.internal('查询分析历史失败: ' + analysisResult.error.message)
    }

    var chartsData = chartsResult.data || []
    var analysesData = analysisResult.data || []

    for (var ci = 0; ci < chartsData.length; ci++) {
      var chart = chartsData[ci]
      allItems.push({
        id: chart.id,
        item_type: 'chart',
        name: chart.name,
        chart_id: chart.id,
        analysis_type: null,
        result: chart.chart_data,
        status: null,
        created_at: chart.created_at,
      })
    }

    for (var ai = 0; ai < analysesData.length; ai++) {
      var analysis = analysesData[ai]
      allItems.push({
        id: analysis.id,
        item_type: 'analysis',
        name: null,
        chart_id: analysis.chart_id,
        analysis_type: analysis.analysis_type,
        result: analysis.result,
        status: analysis.status,
        created_at: analysis.created_at,
      })
    }

    allItems.sort(function(a, b) {
      var diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      return ascending ? -diff : diff
    })
  }

  var total = allItems.length
  var offset = (page - 1) * limit
  var items = allItems.slice(offset, offset + limit)

  var response: {
    items: HistoryItem[]
    total: number
    page: number
    limit: number
    type?: string
    sort?: string
  } = {
    items: items,
    total: total,
    page: page,
    limit: limit,
    sort: sort,
  }

  if (type) {
    response.type = type
  }

  return c.json(response)
})

export default app
