/**
 * 报告 API
 * GET /api/reports/:id/pdf — PDF 导出
 * POST /api/reports/:id/interpret — AI 自然语言解读
 */

import { Hono } from 'hono'
import { authRequired, requireUser } from '../middleware/auth'
import { requireFeatureFlag } from '../middleware/permission'
import { ApiError } from '../middleware/error'
import { generatePdf } from '../lib/generatePdf'
import { generateInterpretation } from '../../lib/interpretation/baziInterpreter'
import { enhanceInterpretation, generateAdvice } from '../lib/aiEnhance'

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
 * GET /api/reports/:id/pdf
 *
 * 导出指定分析报告为 PDF 文件（黑金风格）。
 * 仅 premium 及以上会员可用（受 pdf_export FeatureFlag 控制）。
 */
app.get('/:id/pdf', authRequired, requireFeatureFlag('pdf_export'), async function(c) {
  var user = requireUser(c)
  var reportId = c.req.param('id')

  // 从 analysis_history 获取报告数据
  var supabase = await getSupabaseAdmin()

  var { data: record, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !record) {
    throw ApiError.notFound('报告不存在')
  }

  // 月度 PDF 下载限制：basic 10次/月, premium/vip 无限
  var pdfTier = (c.get('user') as any).membership_tier || 'free'
  var pdfMonthlyLimits: Record<string, number> = {
    'free': 0,
    'basic': 10,
    'premium': 999,
    'vip': 999,
  }
  var pdfMonthlyLimit = pdfMonthlyLimits[pdfTier] || 0
  if (pdfMonthlyLimit > 0 && pdfMonthlyLimit < 999) {
    var nowPdf = new Date()
    var pdfMonthStart = new Date(nowPdf.getFullYear(), nowPdf.getMonth(), 1).toISOString()
    var { count: monthlyPdfUsed } = await supabase
      .from('monitoring_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('category', 'pdf_download')
      .gte('created_at', pdfMonthStart)

    if ((monthlyPdfUsed || 0) >= pdfMonthlyLimit) {
      throw ApiError.forbidden(
        '本月 PDF 下载次数已用尽 (' + (monthlyPdfUsed || 0) + '/' + pdfMonthlyLimit + ')，请下月再试或升级会员'
      )
    }

    // 记录本次 PDF 下载事件到 monitoring_logs
    await supabase.from('monitoring_logs').insert({
      user_id: user.id,
      category: 'pdf_download',
      level: 'info',
      message: 'PDF 下载: ' + reportId,
      metadata: { report_id: reportId },
    })
  }

  // 解析报告结果
  var result = record.result || {}
  var chartData = null

  // 如果有关联的 chart_id，获取排盘数据
  if (record.chart_id) {
    var { data: chart } = await supabase
      .from('charts')
      .select('*')
      .eq('id', record.chart_id)
      .maybeSingle()
    if (chart) {
      chartData = chart
    }
  }

  // 构造 PDF 数据
  var reportData = {
    reportType: record.analysis_type || 'bazi',
    personName: record.name || user.email || 'User',
    gender: chartData ? (chartData.gender || '') : '',
    birthDate: chartData ? (chartData.birth_date || '') : '',
    birthTime: chartData ? (chartData.birth_time || '') : '',
    birthPlace: chartData ? (chartData.birth_place || '') : '',
    zodiac: result.zodiac || chartData ? (chartData.zodiac || '') : '',
    dayMasterElement: result.day_master_element || result.dayMasterElement || '',
    generatedAt: record.created_at,
    baziChart: result.bazi_chart || result.baziChart || [],
    wuxingAnalysis: result.wuxing_analysis || result.wuxingAnalysis || [],
    wuxingSummary: result.wuxing_summary || result.wuxingSummary || '',
    shishenAnalysis: result.shishen_analysis || result.shishenAnalysis || [],
    dayunAnalysis: result.dayun_analysis || result.dayunAnalysis || [],
    suggestions: result.suggestions || [],
  }

  // 生成 PDF
  var pdfStream = await generatePdf(reportData)

  return c.body(pdfStream as any, 200, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename="xuanfengmen-' + (reportData.reportType || 'report') + '.pdf"',
  })
})

/**
 * POST /api/reports/:id/interpret
 *
 * 生成指定分析报告的自然语言解读。
 * 将 Engine 结构化数据转化为中文白话解读，包含数据溯源和置信度。
 * 仅 premium 及以上会员可用（受 ai_explain FeatureFlag 控制）。
 */
app.post('/:id/interpret', authRequired, requireFeatureFlag('ai_explain'), async function(c) {
  var user = requireUser(c)
  var reportId = c.req.param('id')

  // 从 analysis_history 获取报告数据
  var supabase = await getSupabaseAdmin()

  var { data: record, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('id', reportId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !record) {
    throw ApiError.notFound('报告不存在')
  }

  // 解析报告结果
  var result = record.result || {}
  var chartData = null

  // 如果有关联的 chart_id，获取排盘数据
  if (record.chart_id) {
    var { data: chart } = await supabase
      .from('charts')
      .select('*')
      .eq('id', record.chart_id)
      .maybeSingle()
    if (chart) {
      chartData = chart
    }
  }

  // 合并 report result 和 chart data，供解释层使用
  var mergedData: Record<string, any> = {}

  // 从 result 中提取常见字段
  if (result) {
    var resultKeys = Object.keys(result)
    for (var i = 0; i < resultKeys.length; i++) {
      mergedData[resultKeys[i]] = result[resultKeys[i]]
    }
  }

  // 从 chart data 中提取排盘数据（优先级高于 result）
  if (chartData) {
    if (chartData.result) {
      var chartResult = chartData.result
      var chartResultKeys = Object.keys(chartResult)
      for (var j = 0; j < chartResultKeys.length; j++) {
        mergedData[chartResultKeys[j]] = chartResult[chartResultKeys[j]]
      }
    }
    // 扁平 chart 字段
    if (chartData.gender) mergedData['gender'] = chartData.gender
    if (chartData.birth_date) mergedData['birthDate'] = chartData.birth_date
    if (chartData.birth_time) mergedData['birthTime'] = chartData.birth_time
  }

  // AI 次数检查：根据 membership_tier 判断是否有 AI 额度
  var tier = (c.get('user') as any).membership_tier || 'free'
  var tierAiCredits: Record<string, number> = {
    'free': 0,
    'basic': 3,
    'premium': 20,
    'vip': 999,
  }
  var aiCredits = tierAiCredits[tier] || 0

  var useAi = c.req.query('ai') !== 'false' // 默认启用 AI 增强
  if (useAi && aiCredits === 0) {
    return c.json({
      error: 'UPGRADE_REQUIRED',
      message: '升级会员获取 AI 深度解读功能',
      requiredTier: 'basic'
    }, 403)
  }

  // 生成自然语言解读
  var interpretation = generateInterpretation(mergedData)

  // Gemini AI 增强（仅当 AI 可用时）
  var finalResult: Record<string, any> = interpretation
  var interpretStartMs = Date.now()
  if (useAi && aiCredits > 0) {
    finalResult = await enhanceInterpretation(interpretation, mergedData)
    var advice = await generateAdvice(mergedData, finalResult)
    finalResult.advice = advice
  }
  var interpretDurationMs = Date.now() - interpretStartMs

  // 记录 AI 使用
  try {
    await supabase.from('monitoring_logs').insert({
      source: 'api',
      category: 'ai_usage',
      level: 'info',
      name: 'ai_interpret',
      metadata: {
        user_id: user.id,
        report_id: reportId,
        analysis_type: 'interpret',
        ai_model: 'gemini-2.5-flash',
        duration_ms: interpretDurationMs
      }
    })
  } catch (_logErr) {
    // 日志失败不影响主流程
  }

  return c.json({
    success: true,
    interpretation: finalResult,
  })
})

export default app
