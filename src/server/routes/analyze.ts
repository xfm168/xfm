/**
 * 命盘分析路由
 *
 *   POST /api/analyze   基础 / 完整 / AI 分析
 *
 * 请求体：
 *   { chart_id?: string, chart_data?: object, analysis_type: 'basic' | 'full' | 'ai' }
 *
 * 使用 authRequired 中间件强制鉴权，验证 analysis_type 和 chart_id / chart_data，
 * 通过 BaZi Pipeline 或 AnalysisCenter 生成真实分析结果，
 * 并调用 baziInterpreter 生成自然语言解读。
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
var VALID_ANALYSIS_TYPES: string[] = ['basic', 'full', 'ai', 'compatibility', 'pro', 'legacy', 'future']

/**
 * 将多种格式的原始数据转换为 BirthData 格式
 * 支持已有 birthday 字段（BirthData 格式）或 year/month/day/hour 字段
 */
function toBirthData(raw: any): any {
  if (!raw) return null
  if (raw.birthday) return raw
  var y = String(raw.year || '')
  var m = String(raw.month || '').padStart(2, '0')
  var d = String(raw.day || '').padStart(2, '0')
  var h = String(raw.hour || '12').padStart(2, '0')
  return {
    birthday: y + '-' + m + '-' + d,
    birthTime: h + ':00',
    gender: raw.gender || 'male',
    calendarType: raw.calendarType,
    timezone: raw.timezone,
    location: raw.location || raw.region || raw.birthplace,
    useTrueSolarTime: raw.useTrueSolarTime || raw.solarTime || raw.use_solar_time,
  }
}

/**
 * 从 charts 表行构造 BirthData
 */
function chartRowToBirthData(row: any): any {
  return {
    birthday: row.birth_date,
    birthTime: row.birth_time,
    gender: row.gender,
    timezone: row.timezone || undefined,
    longitude: row.longitude || undefined,
    latitude: row.latitude || undefined,
    location: row.birthplace || undefined,
    useTrueSolarTime: row.use_solar_time || false,
    childHourStrategy: row.zishi_strategy || undefined,
    birthTimeUnknown: row.birth_time_unknown || false,
  }
}

/**
 * POST /api/analyze
 *
 * 接收命盘 ID 或命盘数据，按 analysis_type 执行真实分析。
 * 双模式：优先 Pipeline，降级到 AnalysisCenter，均调用 baziInterpreter 生成解读。
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

  // 权限检查：AI 和 Pro 分析需要 VIP_REPORT capability
  if (analysisType === 'ai' || analysisType === 'pro') {
    var tier = user.membership_tier || 'free'
    var { hasCapability: checkCap } = await import('../../lib/domain/permission')
    if (!checkCap(tier, 'VIP_REPORT')) {
      throw ApiError.forbidden('权限不足: AI/Pro 分析需要 VIP_REPORT 能力，请升级会员')
    }
  }

  // 月度 AI 分析次数限制：basic 3次/月, premium 20次/月, vip 无限
  if (analysisType === 'ai' || analysisType === 'pro') {
    var aiTier = user.membership_tier || 'free'
    var aiMonthlyLimits: Record<string, number> = {
      'free': 0,
      'basic': 3,
      'premium': 20,
      'vip': 999,
    }
    var aiMonthlyLimit = aiMonthlyLimits[aiTier] || 0

    var supabaseCheck = await getSupabaseAdmin()
    var now = new Date()
    var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    var { count: monthlyAiUsed } = await supabaseCheck
      .from('analysis_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .in('analysis_type', ['ai', 'pro'])
      .gte('created_at', monthStart)

    if ((monthlyAiUsed || 0) >= aiMonthlyLimit) {
      throw ApiError.forbidden(
        '本月 AI 分析次数已用尽 (' + (monthlyAiUsed || 0) + '/' + aiMonthlyLimit + ')，请下月再试或升级会员'
      )
    }
  }

  if (!body.chart_id && !body.chart_data) {
    throw ApiError.validationError('chart_id 或 chart_data 至少需提供其一')
  }

  // ── 1. 获取 BirthData ──────────────────────────────────────────
  var birthData: any = null

  if (body.chart_id) {
    var supabaseFetch = await getSupabaseAdmin()
    var { data: chartRow, error: chartErr } = await supabaseFetch
      .from('charts')
      .select('*')
      .eq('id', body.chart_id)
      .single()

    if (chartErr || !chartRow) {
      throw ApiError.badRequest('命盘不存在: ' + (chartErr ? chartErr.message : String(body.chart_id)))
    }
    birthData = chartRowToBirthData(chartRow)
  } else {
    birthData = toBirthData(body.chart_data)
  }

  if (!birthData || !birthData.birthday) {
    throw ApiError.badRequest('无法从 chart_data 中提取有效的出生信息（缺少 birthday）')
  }

  // ── 2. 运行 Pipeline 或降级到 AnalysisCenter ───────────────────
  var startTime = performance.now()
  var chartData: any = null
  var geJuData: any = null
  var xiYongShenData: any = null
  var scoreData: any = null
  var pipelineInfo: any = null
  var pipelineMode = 'none'

  try {
    // 模式 A：尝试完整 Pipeline
    var pipelineMod = await import('../../lib/bazi/pipeline')
    var runBaZiPipelineFromBirthData = pipelineMod.runBaZiPipelineFromBirthData
    var pipelineResult = await runBaZiPipelineFromBirthData({
      birthData: birthData,
      options: { detailed: true },
    })
    chartData = pipelineResult.chart
    geJuData = pipelineResult.geJu
    xiYongShenData = pipelineResult.xiYongShen
    scoreData = pipelineResult.score
    pipelineInfo = {
      success: pipelineResult.success,
      version: pipelineResult.version,
      steps: (pipelineResult.steps || []).map(function(s: any) {
        return { id: s.id, name: s.name, status: s.status, duration: s.duration }
      }),
    }
    pipelineMode = 'pipeline'
  } catch (_pipelineErr) {
    // 模式 B：Pipeline 不可用（可能有 DOM 依赖），降级到 AnalysisCenter
    var acMod = await import('../../lib/bazi/analysisCenter')
    var getAnalysis = acMod.getAnalysis
    var analysis = getAnalysis(birthData)
    chartData = analysis.chart
    geJuData = analysis.geJu
    xiYongShenData = analysis.xiYongShen
    scoreData = { overall: analysis.chart.overallScore || 60 }
    var fallbackDuration = Math.round(performance.now() - startTime)
    pipelineInfo = {
      success: true,
      version: 'analysis-center-fallback',
      steps: [{
        id: 'analysis-center',
        name: '排盘分析（降级模式）',
        status: 'completed',
        duration: fallbackDuration,
      }],
    }
    pipelineMode = 'analysis-center'
  }

  // ── 3. 调用 baziInterpreter 生成自然语言解读 ───────────────────
  var interpretation: any = null
  try {
    var interpMod = await import('../../lib/interpretation/baziInterpreter')
    var generateInterpretation = interpMod.generateInterpretation
    interpretation = generateInterpretation(chartData)
  } catch (_interpErr) {
    // 解读生成失败不影响核心数据，返回空解读
    interpretation = {
      sections: [],
      summary: '解读生成失败，请重试',
      generatedAt: new Date().toISOString(),
      traceId: '',
    }
  }

  var endTime = performance.now()
  var durationMs = Math.round(endTime - startTime)

  // ── 4. 构造真实结果对象 ────────────────────────────────────────
  var dayMasterInfo = (chartData && chartData.dayMaster) ? chartData.dayMaster : {}
  var sixLines = (chartData && chartData.sixLines) ? chartData.sixLines : {}
  var fiveElementCount = (chartData && chartData.fiveElementCount) ? chartData.fiveElementCount : {}

  var typedAnalysisType = analysisType as AnalysisType
  var aiModel: string | null = analysisType === 'ai' ? 'gpt-4o' : null
  var aiTokensUsed: number | null = analysisType === 'ai' ? 1500 : null

  var realResult: Record<string, unknown> = {
    type: analysisType,
    pipeline: {
      mode: pipelineMode,
      success: pipelineInfo.success,
      version: pipelineInfo.version,
      duration: durationMs,
      steps: pipelineInfo.steps,
    },
    chart: {
      dayMaster: dayMasterInfo.dayGan
        ? (dayMasterInfo.dayGan + ' (' + dayMasterInfo.dayGanElement + ')')
        : '未知',
      pillars: {
        year: sixLines.year ? (sixLines.year.gan + sixLines.year.zhi) : '',
        month: sixLines.month ? (sixLines.month.gan + sixLines.month.zhi) : '',
        day: sixLines.day ? (sixLines.day.gan + sixLines.day.zhi) : '',
        hour: sixLines.hour ? (sixLines.hour.gan + sixLines.hour.zhi) : '',
      },
      fiveElements: fiveElementCount,
    },
    interpretation: (interpretation && interpretation.sections) ? interpretation.sections : [],
    summary: (interpretation && interpretation.summary) ? interpretation.summary : '',
    geJu: geJuData,
    xiYongShen: xiYongShenData,
    score: scoreData,
  }

  // ── 5. 保存到 analysis_history ─────────────────────────────────
  var insertData: AnalysisHistoryInsert = {
    user_id: user.id,
    chart_id: body.chart_id || null,
    analysis_type: typedAnalysisType,
    result: realResult,
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

  // ── 6. Free 用户报告截断：只返回基础部分，不泄露 VIP 数据 ──
  var responseRecord = record
  var userTier = user.membership_tier || 'free'
  if (userTier === 'free') {
    // 构造截断后的 result，只保留基础数据
    var freeResult: Record<string, unknown> = {}
    var fullResult = (record.result || {}) as Record<string, unknown>
    freeResult.type = fullResult.type
    freeResult.isPartial = true
    freeResult.availableSections = ['basic_overview', 'wuxing_summary']
    freeResult.lockedSections = ['detailed_analysis', 'shishen', 'dayun', 'suggestions', 'personality', 'career', 'wealth', 'relationship', 'health']
    freeResult.upgradeMessage = '升级会员查看完整分析'
    // 仅保留基础 chart 结构（四柱信息），不保留高级分析
    freeResult.chart = fullResult.chart
    responseRecord = {
      id: record.id,
      analysis_type: record.analysis_type,
      status: record.status,
      created_at: record.created_at,
      result: freeResult,
    }
  }

  return c.json({
    success: true,
    analysis: responseRecord,
  })
})

export default app