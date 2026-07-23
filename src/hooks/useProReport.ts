/**
 * useProReport -- Professional Report API Hook
 *
 * 调用 POST /api/pro/master-report 获取专业命理报告
 * 数据链路：Professional Engine -> API -> 前端展示
 * 不修改任何算法，纯数据传输层
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { useState, useCallback } from 'react'
import type {
  ProReportRequest,
  ProReportData,
  ProDimensionItem,
  ProPatternSummary,
  ProXiYongSummary,
  ProShenShaSummary,
  ProTenGodSummary,
  ProTimelineStage,
  ProRiskItem,
  ProOpportunityItem,
  ProRecommendationItem,
  ProExplainItem,
  ProConfidenceSummary,
  ProTraceSummary,
} from '../types/proReport'
import { supabase as supabaseClient } from '../lib/supabase'

// ─── 常量 ───

var PRO_API_BASE = '/api/pro'
var PRO_REPORT_ENDPOINT = '/master-report'

// ─── Hook 状态类型 ───

interface UseProReportResult {
  data: ProReportData | null
  loading: boolean
  error: string | null
  generateReport: (request: ProReportRequest) => Promise<ProReportData | null>
  reset: () => void
}

// ─── 通用 API Fetch ───

async function proApiFetch(
  path: string,
  options: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  var url = PRO_API_BASE + path
  var headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (supabaseClient) {
    var session = await supabaseClient.auth.getSession()
    var token = session.data.session
      ? session.data.session.access_token
      : ''
    if (token) {
      headers['Authorization'] = 'Bearer ' + token
    }
  }

  var fetchOptions: Record<string, unknown> = {
    method: options.method || 'POST',
    headers: headers,
  }

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  var res = await fetch(url, fetchOptions as RequestInit)
  var json = await res.json()

  if (!res.ok) {
    var errMsg =
      json && json.error && json.error.message
        ? json.error.message
        : '专业报告生成失败'
    throw new Error(errMsg)
  }

  return json as Record<string, unknown>
}

// ─── Transform: API 原始响应 -> ProReportData ───

function transformReportToProData(
  report: Record<string, unknown>,
  modules: Record<string, unknown>,
  meta: { computeTimeMs: number; engineVersions: Record<string, string> },
  request: ProReportRequest,
  reportId: string,
  createdAt: string,
): ProReportData {
  // 从 MasterReport 提取前端友好字段
  var overallAssessment = report.overallAssessment as Record<string, unknown> | undefined
  var fiveDim = report.fiveDimensionScores as Record<string, unknown> | undefined
  var crossValidation = report.crossValidation as Record<string, unknown> | undefined
  var derivation = report.derivation as Record<string, unknown> | undefined

  // 将 modules 合并到 report 以便统一访问
  var r: Record<string, unknown> = {}
  for (var k in report) {
    r[k] = report[k]
  }
  r['_pillars'] = modules.pillars
  r['_shenSha'] = modules.shenSha
  r['_tenGods'] = modules.tenGods
  r['_pattern'] = modules.pattern
  r['_xiYong'] = modules.xiYong
  r['_fortune'] = modules.fortune

  // pillars 用于提取四柱
  var pillarsData = modules.pillars as Record<string, unknown> | undefined

  return {
    reportId: reportId,
    engineVersion: 'V5.0 GA',
    chart: {
      dayMaster: String(report.dayMaster || ''),
      dayMasterElement: String(report.dayMasterElement || ''),
      yearPillar: extractPillar(pillarsData, 'year'),
      monthPillar: extractPillar(pillarsData, 'month'),
      dayPillar: extractPillar(pillarsData, 'day'),
      hourPillar: extractPillar(pillarsData, 'hour'),
      gender: request.gender === 'male' ? '男' : '女',
      birthDate: request.birth_date,
      birthTime: request.birth_time,
    },
    analysis: {
      quickSummary: {
        headline: (overallAssessment && overallAssessment.summary as string) || '',
        lifePositioning: (overallAssessment && overallAssessment.lifePositioning as string) || '',
        strengths: ((overallAssessment && overallAssessment.strengths) || []) as string[],
        risks: ((overallAssessment && overallAssessment.risks) || []) as string[],
        developmentDirection: (overallAssessment && overallAssessment.developmentDirection as string) || '',
      },
      fiveDimensions: extractFiveDimensions(fiveDim),
      patternAnalysis: extractPattern(r),
      xiYongAnalysis: extractXiYong(r),
      shenShaHighlights: extractShenSha(r),
      tenGodHighlights: extractTenGods(r),
      timeline: ((r.timeline) || []) as ProTimelineStage[],
      risks: ((r.risks) || []) as ProRiskItem[],
      opportunities: ((r.opportunities) || []) as ProOpportunityItem[],
      recommendations: ((r.recommendations) || []) as ProRecommendationItem[],
      explains: ((r.explains) || []) as ProExplainItem[],
    },
    confidence: extractConfidence(crossValidation, report),
    trace: extractTrace(derivation, meta),
    raw: {
      masterReport: JSON.stringify(report),
      pillars: JSON.stringify(modules.pillars || null),
      shenSha: JSON.stringify(modules.shenSha || null),
      tenGods: JSON.stringify(modules.tenGods || null),
      pattern: JSON.stringify(modules.pattern || null),
      xiYong: JSON.stringify(modules.xiYong || null),
      fortune: JSON.stringify(modules.fortune || null),
    },
    createdAt: createdAt,
  }
}

// ─── Helper: 提取单柱干支 ───

function extractPillar(
  pillars: Record<string, unknown> | undefined,
  key: string,
): { gan: string; zhi: string } {
  if (!pillars) {
    return { gan: '', zhi: '' }
  }

  // 优先从 sixLines 取
  var sixLines = pillars.sixLines as Record<string, Record<string, string>> | undefined
  if (sixLines && sixLines[key]) {
    return {
      gan: sixLines[key].gan || '',
      zhi: sixLines[key].zhi || '',
    }
  }

  // 兜底
  return { gan: '', zhi: '' }
}

// ─── Helper: 提取五维评分 ───

function extractFiveDimensions(
  fiveDim: Record<string, unknown> | undefined,
): {
  career: ProDimensionItem
  wealth: ProDimensionItem
  marriage: ProDimensionItem
  health: ProDimensionItem
  study: ProDimensionItem
  overall: number
} {
  var emptyItem: ProDimensionItem = { score: 0, level: '未知', weight: 0, reasons: [], confidence: 0 }
  if (!fiveDim) {
    return {
      career: emptyItem,
      wealth: emptyItem,
      marriage: emptyItem,
      health: emptyItem,
      study: emptyItem,
      overall: 0,
    }
  }

  return {
    career: extractDimensionItem(fiveDim.career as Record<string, unknown> | undefined),
    wealth: extractDimensionItem(fiveDim.wealth as Record<string, unknown> | undefined),
    marriage: extractDimensionItem(fiveDim.marriage as Record<string, unknown> | undefined),
    health: extractDimensionItem(fiveDim.health as Record<string, unknown> | undefined),
    study: extractDimensionItem(fiveDim.study as Record<string, unknown> | undefined),
    overall: (fiveDim.overall as number) || 0,
  }
}

function extractDimensionItem(
  item: Record<string, unknown> | undefined,
): ProDimensionItem {
  if (!item) {
    return { score: 0, level: '未知', weight: 0, reasons: [], confidence: 0 }
  }
  return {
    score: (item.score as number) || 0,
    level: String(item.level || '未知'),
    weight: (item.weight as number) || 0,
    reasons: (item.reasons as string[]) || [],
    confidence: (item.confidence as number) || 0,
  }
}

// ─── Helper: 提取格局分析 ───

function extractPattern(r: Record<string, unknown>): ProPatternSummary {
  var pattern = r._pattern as Record<string, unknown> | undefined
  if (!pattern) {
    return { mainPattern: '', subPatterns: [], formationScore: 0, description: '' }
  }
  return {
    mainPattern: String(pattern.mainPattern || pattern.patternName || ''),
    subPatterns: (pattern.subPatterns as string[]) || [],
    formationScore: (pattern.formationScore as number) || 0,
    description: String(pattern.description || ''),
  }
}

// ─── Helper: 提取喜用神分析 ───

function extractXiYong(r: Record<string, unknown>): ProXiYongSummary {
  var xiYong = r._xiYong as Record<string, unknown> | undefined
  if (!xiYong) {
    return {
      dayMasterStrength: '',
      yongShen: '',
      xiShen: '',
      jiShen: '',
      chouShen: '',
      xianShen: '',
      regulationDirection: '',
    }
  }
  return {
    dayMasterStrength: String(xiYong.dayMasterStrength || xiYong.strength || ''),
    yongShen: String(xiYong.yongShen || xiYong.yongShens || ''),
    xiShen: String(xiYong.xiShen || xiYong.xiShens || ''),
    jiShen: String(xiYong.jiShen || xiYong.jiShens || ''),
    chouShen: String(xiYong.chouShen || xiYong.chouShens || ''),
    xianShen: String(xiYong.xianShen || xiYong.xianShens || ''),
    regulationDirection: String(xiYong.regulationDirection || ''),
  }
}

// ─── Helper: 提取神煞高亮 ───

function extractShenSha(r: Record<string, unknown>): ProShenShaSummary {
  var shenSha = r._shenSha as Record<string, unknown> | undefined
  if (!shenSha) {
    return { total: 0, highlights: [] }
  }
  var items = (shenSha.items || shenSha.shenShaList || []) as Array<Record<string, unknown>>
  var highlights: Array<{ name: string; influence: string; category: string }> = []
  for (var i = 0; i < Math.min(items.length, 5); i++) {
    var item = items[i]
    highlights.push({
      name: String(item.name || ''),
      influence: String(item.influence || item.description || ''),
      category: String(item.category || item.type || ''),
    })
  }
  return {
    total: (shenSha.totalCount as number) || items.length,
    highlights: highlights,
  }
}

// ─── Helper: 提取十神高亮 ───

function extractTenGods(r: Record<string, unknown>): ProTenGodSummary {
  var tenGods = r._tenGods as Record<string, unknown> | undefined
  if (!tenGods) {
    return { dominantGods: [], structure: '' }
  }
  return {
    dominantGods: (tenGods.dominantGods as string[]) || [],
    structure: String(tenGods.structure || tenGods.structureDescription || ''),
  }
}

// ─── Helper: 提取置信度 ───

function extractConfidence(
  crossValidation: Record<string, unknown> | undefined,
  report: Record<string, unknown>,
): ProConfidenceSummary {
  if (!crossValidation) {
    return {
      overallConfidence: 0,
      crossValidationPassed: false,
      contradictions: [],
      supportingModules: [],
      warnings: (report.warnings as string[]) || [],
    }
  }
  return {
    overallConfidence: (crossValidation.confidence as number) || 0,
    crossValidationPassed: !!(crossValidation.validated),
    contradictions: (crossValidation.contradictions as string[]) || [],
    supportingModules: (crossValidation.supportingModules as string[]) || [],
    warnings: (report.warnings as string[]) || [],
  }
}

// ─── Helper: 提取执行追踪 ───

function extractTrace(
  derivation: Record<string, unknown> | undefined,
  meta: { computeTimeMs: number; engineVersions: Record<string, string> },
): ProTraceSummary {
  var moduleList: Array<{ module: string; stepCount: number; description: string }> = []
  var totalSteps = 0

  if (derivation) {
    var steps = (derivation.steps as Array<Record<string, unknown>>) || []
    totalSteps = steps.length
    // 按步骤名称前缀分组统计
    var moduleMap: Record<string, number> = {}
    for (var i = 0; i < steps.length; i++) {
      var stepName = String(steps[i].name || 'unknown')
      var prefix = stepName.split('-')[0] || stepName
      moduleMap[prefix] = (moduleMap[prefix] || 0) + 1
    }
    for (var mod in moduleMap) {
      moduleList.push({
        module: mod,
        stepCount: moduleMap[mod],
        description: '',
      })
    }
  }

  // 补充引擎版本信息
  for (var engineName in meta.engineVersions) {
    var found = false
    for (var j = 0; j < moduleList.length; j++) {
      if (moduleList[j].module === engineName) {
        moduleList[j].description = meta.engineVersions[engineName]
        found = true
        break
      }
    }
    if (!found) {
      moduleList.push({
        module: engineName,
        stepCount: 0,
        description: meta.engineVersions[engineName],
      })
    }
  }

  return {
    totalSteps: totalSteps,
    modules: moduleList,
  }
}

// ─── Hook ───

export function useProReport(): UseProReportResult {
  var dataHook = useState<ProReportData | null>(null)
  var data = dataHook[0]
  var setData = dataHook[1]

  var loadingHook = useState<boolean>(false)
  var loading = loadingHook[0]
  var setLoading = loadingHook[1]

  var errorHook = useState<string | null>(null)
  var error = errorHook[0]
  var setError = errorHook[1]

  var generateReport = useCallback(async function(
    request: ProReportRequest,
  ): Promise<ProReportData | null> {
    setLoading(true)
    setError(null)
    try {
      var rawResponse = await proApiFetch(PRO_REPORT_ENDPOINT, {
        method: 'POST',
        body: request,
      })

      // 原始 API 响应结构：{ success, data: { reportId, report, _modules, meta, createdAt } }
      if (!rawResponse.success) {
        var errMsg = '专业报告生成失败'
        if (rawResponse.error) {
          var errObj = rawResponse.error as Record<string, unknown>
          errMsg = String(errObj.message || errMsg)
        }
        setError(errMsg)
        return null
      }

      var responseData = rawResponse.data as Record<string, unknown> | undefined
      if (!responseData) {
        setError('专业报告返回数据为空')
        return null
      }

      var report = responseData.report as Record<string, unknown>
      var modules = (responseData._modules || {}) as Record<string, unknown>
      var meta = responseData.meta as { computeTimeMs: number; engineVersions: Record<string, string> }
      var reportId = String(responseData.reportId || '')
      var createdAt = String(responseData.createdAt || '')

      var proData = transformReportToProData(report, modules, meta, request, reportId, createdAt)
      setData(proData)
      return proData
    } catch (e) {
      var msg = e instanceof Error ? e.message : '专业报告生成失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  var reset = useCallback(function() {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data: data,
    loading: loading,
    error: error,
    generateReport: generateReport,
    reset: reset,
  }
}