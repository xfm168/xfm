/**
 * Module 8: Professional Report Export Engine — 核心引擎
 *
 * 职责：数据展示、版式生成、报告导出、品牌应用、国际化
 * 约束：本模块不做任何命理计算，所有数据来自 Module7 MasterReport
 *
 * Pipeline 步骤：
 *   1. 确定模板（resolveTemplate）
 *   2. 确定语言（language）
 *   3. 生成章节（generateSections）
 *   4. 生成图表（generateCharts）
 *   5. 应用品牌（applyBranding）
 *   6. 生成导出（generateExports）
 *   7. 组装输出（ReportEngineOutput）
 */

import { createChain, createTreeNode, DerivationStep, DerivationChain } from './types'
import type {
  ReportEngineOutput,
  ReportExportOptions,
  ReportTemplate,
  TemplateConfig,
  ReportSection,
  ReportSectionType,
  ChartConfig,
  ChartDataPoint,
  ExportResult,
  ExportFormat,
  BrandingConfig,
  ReportLanguage,
} from './reportExportTypes'

import { clamp } from './helpers'

import { TEMPLATE_CONFIGS, getSectionTitle } from './reportExportDatabase'

import type { MasterReport } from './masterReportTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

/** 引擎版本号 */
export const REPORT_EXPORT_VERSION: string = '8.0.0'

/** 缓存版本号 */
export const REPORT_EXPORT_CACHE_VERSION: string = '8.0.0'

// ═══════════════════════════════════════════════════════════
// 缓存
// ═══════════════════════════════════════════════════════════

/** 报告导出缓存，key 格式：v8.0.0:${reportId} */
const reportCache = new Map<string, ReportEngineOutput>()

/** 清空报告导出缓存 */
export function clearReportExportCache(): void {
  reportCache.clear()
}

/** 获取当前缓存条目数量 */
export function getReportExportCacheSize(): number {
  return reportCache.size
}

// ═══════════════════════════════════════════════════════════
// 内部工具函数
// ═══════════════════════════════════════════════════════════

/**
 * 生成 8 位随机 ID（大写字母 + 数字）
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

// ═══════════════════════════════════════════════════════════
// 导出
// ═══════════════════════════════════════════════════════════

/**
 * 生成报告导出（主入口）
 *
 * Pipeline：
 *   1. 确定模板 → resolveTemplate
 *   2. 确定语言 → language
 *   3. 生成章节 → generateSections
 *   4. 生成图表 → generateCharts
 *   5. 应用品牌 → applyBranding
 *   6. 生成导出 → generateExports
 *   7. 组装输出 → ReportEngineOutput
 *
 * @param masterReport - Module 7 生成的 MasterReport 数据
 * @param options - 导出选项（模板、语言、格式、品牌等）
 * @returns 完整的 ReportEngineOutput
 */
export function generateReportExport(
  masterReport: MasterReport,
  options?: ReportExportOptions,
): ReportEngineOutput {
  const startTime = Date.now()
  const reportId = options?.reportId ?? generateId()
  const derivationSteps: DerivationStep[] = []

  // ── 缓存检查 ──
  const cacheKey = `v${REPORT_EXPORT_CACHE_VERSION}:${reportId}`
  const cached = reportCache.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  // ── 步骤 1：确定模板 ──
  const template = resolveTemplate(options)
  const templateStep = createTreeNode({
    id: generateId(),
    name: 'resolve-template',
    input: { templateOption: options?.template ?? 'default' },
    output: { template },
    ruleDescription: '根据用户选项选择报告模板，默认 professional',
    confidence: 1.0,
  })
  derivationSteps.push(templateStep)

  // ── 步骤 2：确定语言 ──
  const language: ReportLanguage = options?.language ?? 'zh-CN'
  const languageStep = createTreeNode({
    id: generateId(),
    name: 'resolve-language',
    input: { languageOption: options?.language ?? 'default' },
    output: { language },
    ruleDescription: '根据用户选项确定报告语言，默认 zh-CN',
    confidence: 1.0,
  })
  derivationSteps.push(languageStep)

  // ── 步骤 3：生成章节 ──
  const templateConfig = TEMPLATE_CONFIGS[template]
  const sections = generateSections(masterReport, template, language)
  const sectionsStep = createTreeNode({
    id: generateId(),
    name: 'generate-sections',
    input: {
      template,
      sectionCount: templateConfig.sections.length,
    },
    output: {
      generatedSections: sections.length,
      sectionTypes: sections.map((s) => s.type),
    },
    ruleDescription: `根据模板 ${template} 的章节配置生成各章节内容，数据来源为 MasterReport`,
    confidence: 0.95,
  })
  derivationSteps.push(sectionsStep)

  // ── 步骤 4：生成图表 ──
  const charts = generateCharts(masterReport, templateConfig)
  const chartsStep = createTreeNode({
    id: generateId(),
    name: 'generate-charts',
    input: { includeCharts: templateConfig.includeCharts },
    output: { chartCount: charts.length, chartTypes: charts.map((c) => c.type) },
    ruleDescription: templateConfig.includeCharts
      ? '根据 MasterReport 数据生成图表配置'
      : '模板未启用图表功能，返回空数组',
    confidence: 0.85,
  })
  derivationSteps.push(chartsStep)

  // ── 步骤 5：应用品牌 ──
  const branding = applyBranding(options?.branding, templateConfig, reportId)
  const brandingStep = createTreeNode({
    id: generateId(),
    name: 'apply-branding',
    input: { hasCustomBranding: options?.branding !== undefined },
    output: { branding },
    ruleDescription: '合并模板默认品牌配置与用户自定义品牌配置',
    confidence: 1.0,
  })
  derivationSteps.push(brandingStep)

  // ── 步骤 6：生成导出 ──
  const formats: ExportFormat[] = normalizeFormats(options?.format)
  const exports = generateExports(sections, formats, language, reportId)
  const exportsStep = createTreeNode({
    id: generateId(),
    name: 'generate-exports',
    input: { formats },
    output: { exportCount: exports.length, exportFormats: exports.map((e) => e.format) },
    ruleDescription: '为每种指定格式生成导出内容',
    confidence: 0.9,
  })
  derivationSteps.push(exportsStep)

  // ── 步骤 7：组装输出 ──
  const computeTimeMs = Date.now() - startTime
  const warnings = masterReport.warnings.length > 0
    ? [...masterReport.warnings]
    : []

  const chain: DerivationChain = createChain(derivationSteps, computeTimeMs, {
    engineVersion: REPORT_EXPORT_VERSION,
    algorithmVersion: 'v1.0-classic',
    warnings,
  })

  const output: ReportEngineOutput = {
    version: REPORT_EXPORT_VERSION,
    template,
    language,
    reportId,
    generatedAt: Date.now(),
    sections,
    charts,
    branding,
    exports,
    warnings,
    computeTimeMs,
    cacheVersion: REPORT_EXPORT_CACHE_VERSION,
    derivation: chain,
  }

  // ── 写入缓存 ──
  reportCache.set(cacheKey, output)

  return output
}

// ═══════════════════════════════════════════════════════════
// 模板解析
// ═══════════════════════════════════════════════════════════

/**
 * 解析报告模板
 * 若 options 未指定模板，则使用默认值 'professional'
 *
 * @param options - 导出选项
 * @returns 选定的 ReportTemplate
 */
function resolveTemplate(options?: ReportExportOptions): ReportTemplate {
  const template = options?.template ?? 'professional'
  return template
}

// ═══════════════════════════════════════════════════════════
// 章节生成
// ═══════════════════════════════════════════════════════════

/**
 * 根据模板配置生成各章节内容
 *
 * 每个章节从 masterReport 中提取对应数据生成展示内容。
 * 对于 masterReport 中无原始数据的章节，生成基本内容框架。
 *
 * @param masterReport - Module 7 输出的 MasterReport
 * @param template - 选定的报告模板
 * @param language - 报告语言
 * @returns 生成的章节列表
 */
function generateSections(
  masterReport: MasterReport,
  template: ReportTemplate,
  language: 'zh-CN' | 'en-US',
): ReportSection[] {
  const templateConfig = TEMPLATE_CONFIGS[template]
  const sections: ReportSection[] = []

  for (const sectionType of templateConfig.sections) {
    const section = buildSection(sectionType, masterReport, language)
    sections.push(section)
  }

  // 为章节分配页码
  sections.forEach((section, index) => {
    section.pageNumber = index + 1
  })

  return sections
}

/**
 * 构建单个章节
 *
 * @param type - 章节类型
 * @param masterReport - MasterReport 数据
 * @param language - 语言
 * @returns ReportSection
 */
function buildSection(
  type: ReportSectionType,
  masterReport: MasterReport,
  language: 'zh-CN' | 'en-US',
): ReportSection {
  const title = getSectionTitle(type, language)

  switch (type) {
    case 'cover':
      return buildCoverSection(masterReport, language)

    case 'pillars-info':
      return buildPillarsInfoSection(masterReport, language)

    case 'scores':
      return buildScoresSection(masterReport, language)

    case 'timeline':
      return buildTimelineSection(masterReport, language)

    case 'risk':
      return buildRiskSection(masterReport, language)

    case 'opportunity':
      return buildOpportunitySection(masterReport, language)

    case 'recommendation':
      return buildRecommendationSection(masterReport, language)

    case 'summary':
      return buildSummarySection(masterReport, language)

    default:
      // 其他章节：生成基本内容框架
      return {
        type,
        title,
        content: language === 'zh-CN'
          ? `本章节「${title}」数据需要从原始四柱数据获取，Module 8 仅展示 Module 7 提供的已整合数据。`
          : `This section "${title}" requires raw pillar data; Module 8 only displays data aggregated by Module 7.`,
      }
  }
}

/**
 * 生成封面章节
 */
function buildCoverSection(
  masterReport: MasterReport,
  language: 'zh-CN' | 'en-US',
): ReportSection {
  const mainTitle = language === 'zh-CN' ? '命理分析报告' : 'Bazi Analysis Report'
  const subtitle = language === 'zh-CN'
    ? `日主：${masterReport.dayMaster}（${masterReport.dayMasterElement}）`
    : `Day Master: ${masterReport.dayMaster} (${masterReport.dayMasterElement})`

  const content = language === 'zh-CN'
    ? `${mainTitle}\n${subtitle}\n报告版本：${REPORT_EXPORT_VERSION}`
    : `${mainTitle}\n${subtitle}\nReport Version: ${REPORT_EXPORT_VERSION}`

  return {
    type: 'cover',
    title: getSectionTitle('cover', language),
    content,
  }
}

/**
 * 生成命盘信息章节
 */
function buildPillarsInfoSection(
  masterReport: MasterReport,
  language: 'zh-CN' | 'en-US',
): ReportSection {
  const content = language === 'zh-CN'
    ? `日主：${masterReport.dayMaster}\n日主五行：${masterReport.dayMasterElement}\n综合评分：${masterReport.fiveDimensionScores.overall}`
    : `Day Master: ${masterReport.dayMaster}\nDay Master Element: ${masterReport.dayMasterElement}\nOverall Score: ${masterReport.fiveDimensionScores.overall}`

  return {
    type: 'pillars-info',
    title: getSectionTitle('pillars-info', language),
    content,
  }
}

/**
 * 生成综合评分章节
 */
function buildScoresSection(
  masterReport: MasterReport,
  language: 'zh-CN' | 'en-US',
): ReportSection {
  const scores = masterReport.fiveDimensionScores

  const dimensionNames: Record<string, Record<'zh-CN' | 'en-US', string>> = {
    career:    { 'zh-CN': '事业', 'en-US': 'Career' },
    wealth:    { 'zh-CN': '财富', 'en-US': 'Wealth' },
    marriage:  { 'zh-CN': '婚姻', 'en-US': 'Marriage' },
    health:    { 'zh-CN': '健康', 'en-US': 'Health' },
    study:     { 'zh-CN': '学业', 'en-US': 'Study' },
  }

  const lines: string[] = []
  const dimensionKeys = ['career', 'wealth', 'marriage', 'health', 'study'] as const

  for (const key of dimensionKeys) {
    const item = scores[key]
    const name = dimensionNames[key][language]
    const line = language === 'zh-CN'
      ? `${name}：${item.score}（${item.level}）`
      : `${name}: ${item.score} (${item.level})`
    lines.push(line)
  }

  lines.push('')
  const overallLine = language === 'zh-CN'
    ? `综合总分：${scores.overall}`
    : `Overall: ${scores.overall}`
  lines.push(overallLine)

  return {
    type: 'scores',
    title: getSectionTitle('scores', language),
    content: lines.join('\n'),
  }
}

/**
 * 生成人生时间轴章节
 */
function buildTimelineSection(
  masterReport: MasterReport,
  language: 'zh-CN' | 'en-US',
): ReportSection {
  const timeline = masterReport.timeline

  if (timeline.length === 0) {
    return {
      type: 'timeline',
      title: getSectionTitle('timeline', language),
      content: language === 'zh-CN' ? '暂无时间轴数据' : 'No timeline data available',
    }
  }

  const lines: string[] = []
  for (const stage of timeline) {
    if (language === 'zh-CN') {
      lines.push(`【${stage.stage}】${stage.ageRange}`)
      lines.push(`  概要：${stage.summary}`)
      lines.push(`  大运影响：${stage.fortuneInfluence}`)
      lines.push(`  喜用影响：${stage.xiYongInfluence}`)
      if (stage.keyEvents.length > 0) {
        lines.push(`  关键事件：${stage.keyEvents.join('、')}`)
      }
      lines.push('')
    } else {
      lines.push(`[${stage.stage}] ${stage.ageRange}`)
      lines.push(`  Summary: ${stage.summary}`)
      lines.push(`  Fortune Influence: ${stage.fortuneInfluence}`)
      lines.push(`  Xi-Yong Influence: ${stage.xiYongInfluence}`)
      if (stage.keyEvents.length > 0) {
        lines.push(`  Key Events: ${stage.keyEvents.join(', ')}`)
      }
      lines.push('')
    }
  }

  return {
    type: 'timeline',
    title: getSectionTitle('timeline', language),
    content: lines.join('\n'),
  }
}

/**
 * 生成风险分析章节
 */
function buildRiskSection(
  masterReport: MasterReport,
  language: 'zh-CN' | 'en-US',
): ReportSection {
  const risks = masterReport.risks

  if (risks.length === 0) {
    return {
      type: 'risk',
      title: getSectionTitle('risk', language),
      content: language === 'zh-CN' ? '暂无风险数据' : 'No risk data available',
    }
  }

  const lines: string[] = []
  for (const risk of risks) {
    if (language === 'zh-CN') {
      lines.push(`【${risk.type}】等级：${risk.level}`)
      lines.push(`  原因：${risk.reason}`)
      lines.push(`  建议：${risk.suggestion}`)
      lines.push(`  回避：${risk.avoidance}`)
      lines.push(`  置信度：${(risk.confidence * 100).toFixed(0)}%`)
      lines.push('')
    } else {
      lines.push(`[${risk.type}] Level: ${risk.level}`)
      lines.push(`  Reason: ${risk.reason}`)
      lines.push(`  Suggestion: ${risk.suggestion}`)
      lines.push(`  Avoidance: ${risk.avoidance}`)
      lines.push(`  Confidence: ${(risk.confidence * 100).toFixed(0)}%`)
      lines.push('')
    }
  }

  return {
    type: 'risk',
    title: getSectionTitle('risk', language),
    content: lines.join('\n'),
  }
}

/**
 * 生成机会分析章节
 */
function buildOpportunitySection(
  masterReport: MasterReport,
  language: 'zh-CN' | 'en-US',
): ReportSection {
  const opportunities = masterReport.opportunities

  if (opportunities.length === 0) {
    return {
      type: 'opportunity',
      title: getSectionTitle('opportunity', language),
      content: language === 'zh-CN' ? '暂无机会数据' : 'No opportunity data available',
    }
  }

  const lines: string[] = []
  for (const opp of opportunities) {
    if (language === 'zh-CN') {
      lines.push(`【${opp.type}】时机：${opp.timing}`)
      lines.push(`  原因：${opp.reason}`)
      lines.push(`  置信度：${(opp.confidence * 100).toFixed(0)}%`)
      lines.push('')
    } else {
      lines.push(`[${opp.type}] Timing: ${opp.timing}`)
      lines.push(`  Reason: ${opp.reason}`)
      lines.push(`  Confidence: ${(opp.confidence * 100).toFixed(0)}%`)
      lines.push('')
    }
  }

  return {
    type: 'opportunity',
    title: getSectionTitle('opportunity', language),
    content: lines.join('\n'),
  }
}

/**
 * 生成调理建议章节
 */
function buildRecommendationSection(
  masterReport: MasterReport,
  language: 'zh-CN' | 'en-US',
): ReportSection {
  const recommendations = masterReport.recommendations

  if (recommendations.length === 0) {
    return {
      type: 'recommendation',
      title: getSectionTitle('recommendation', language),
      content: language === 'zh-CN' ? '暂无建议数据' : 'No recommendation data available',
    }
  }

  const lines: string[] = []
  for (const rec of recommendations) {
    if (language === 'zh-CN') {
      lines.push(`【${rec.category}】`)
      lines.push(`  内容：${rec.content}`)
      lines.push(`  推理：${rec.reasoning}`)
      if (rec.relatedElements.length > 0) {
        lines.push(`  相关五行：${rec.relatedElements.join('、')}`)
      }
      lines.push('')
    } else {
      lines.push(`[${rec.category}]`)
      lines.push(`  Content: ${rec.content}`)
      lines.push(`  Reasoning: ${rec.reasoning}`)
      if (rec.relatedElements.length > 0) {
        lines.push(`  Related Elements: ${rec.relatedElements.join(', ')}`)
      }
      lines.push('')
    }
  }

  return {
    type: 'recommendation',
    title: getSectionTitle('recommendation', language),
    content: lines.join('\n'),
  }
}

/**
 * 生成总结章节
 */
function buildSummarySection(
  masterReport: MasterReport,
  language: 'zh-CN' | 'en-US',
): ReportSection {
  const assessment = masterReport.overallAssessment

  const lines: string[] = []

  if (language === 'zh-CN') {
    lines.push(`命局总评：${assessment.summary}`)
    lines.push(`格局评价：${assessment.patternEvaluation}`)
    lines.push(`人生定位：${assessment.lifePositioning}`)
    lines.push(`发展方向：${assessment.developmentDirection}`)
    if (assessment.strengths.length > 0) {
      lines.push(`优势：${assessment.strengths.join('、')}`)
    }
    if (assessment.weaknesses.length > 0) {
      lines.push(`劣势：${assessment.weaknesses.join('、')}`)
    }
    if (assessment.opportunities.length > 0) {
      lines.push(`机遇：${assessment.opportunities.join('、')}`)
    }
    if (assessment.risks.length > 0) {
      lines.push(`风险：${assessment.risks.join('、')}`)
    }
    lines.push('')
    lines.push(`置信度：${(assessment.confidence * 100).toFixed(0)}%`)
  } else {
    lines.push(`Summary: ${assessment.summary}`)
    lines.push(`Pattern Evaluation: ${assessment.patternEvaluation}`)
    lines.push(`Life Positioning: ${assessment.lifePositioning}`)
    lines.push(`Development Direction: ${assessment.developmentDirection}`)
    if (assessment.strengths.length > 0) {
      lines.push(`Strengths: ${assessment.strengths.join(', ')}`)
    }
    if (assessment.weaknesses.length > 0) {
      lines.push(`Weaknesses: ${assessment.weaknesses.join(', ')}`)
    }
    if (assessment.opportunities.length > 0) {
      lines.push(`Opportunities: ${assessment.opportunities.join(', ')}`)
    }
    if (assessment.risks.length > 0) {
      lines.push(`Risks: ${assessment.risks.join(', ')}`)
    }
    lines.push('')
    lines.push(`Confidence: ${(assessment.confidence * 100).toFixed(0)}%`)
  }

  return {
    type: 'summary',
    title: getSectionTitle('summary', language),
    content: lines.join('\n'),
  }
}

// ═══════════════════════════════════════════════════════════
// 图表生成
// ═══════════════════════════════════════════════════════════

/**
 * 根据模板配置生成图表
 *
 * 若模板 includeCharts 为 false，返回空数组。
 * 否则根据 masterReport 中可获取的数据生成图表配置：
 *   - score-bar：从 fiveDimensionScores 五维评分生成
 *   - risk-heatmap：从 risks 的 confidence 生成
 *   - 其他图表：生成空数据框架（type/title 确定，data 为空数组）
 *
 * @param masterReport - MasterReport 数据
 * @param templateConfig - 模板配置
 * @returns 图表配置列表
 */
function generateCharts(
  masterReport: MasterReport,
  templateConfig: TemplateConfig,
): ChartConfig[] {
  // 模板未启用图表
  if (!templateConfig.includeCharts) {
    return []
  }

  const charts: ChartConfig[] = []

  // ── score-bar：五维评分柱状图 ──
  const scores = masterReport.fiveDimensionScores
  const scoreBarData: ChartDataPoint[] = [
    buildChartDataPoint('Career', scores.career.score, '#4A90D9'),
    buildChartDataPoint('Wealth', scores.wealth.score, '#50C878'),
    buildChartDataPoint('Marriage', scores.marriage.score, '#FF6B8A'),
    buildChartDataPoint('Health', scores.health.score, '#FFB347'),
    buildChartDataPoint('Study', scores.study.score, '#9B59B6'),
  ]

  charts.push({
    type: 'score-bar',
    title: 'Five Dimension Scores',
    data: scoreBarData,
  })

  // ── risk-heatmap：风险置信度热力图 ──
  const riskHeatmapData: ChartDataPoint[] = masterReport.risks.map((risk) =>
    buildChartDataPoint(risk.type, risk.confidence * 100),
  )

  charts.push({
    type: 'risk-heatmap',
    title: 'Risk Confidence Heatmap',
    data: riskHeatmapData,
  })

  // ── five-element-pie：五行占比（无原始数据，使用默认均分） ──
  charts.push({
    type: 'five-element-pie',
    title: 'Five Element Distribution',
    data: [
      buildChartDataPoint('Metal', 20, '#C0C0C0'),
      buildChartDataPoint('Wood', 20, '#228B22'),
      buildChartDataPoint('Water', 20, '#4169E1'),
      buildChartDataPoint('Fire', 20, '#DC143C'),
      buildChartDataPoint('Earth', 20, '#DAA520'),
    ],
  })

  // ── 其他图表：生成空数据框架 ──
  const skeletonCharts: Array<{ type: ChartConfig['type']; title: string }> = [
    { type: 'shishen-bar', title: 'Ten Gods Distribution' },
    { type: 'power-radar', title: 'Power Radar' },
    { type: 'life-trend', title: 'Life Trend' },
    { type: 'dayun-timeline', title: 'Dayun Timeline' },
  ]

  for (const skeleton of skeletonCharts) {
    charts.push({
      type: skeleton.type,
      title: skeleton.title,
      data: [],
    })
  }

  return charts
}

/**
 * 构建图表数据点
 */
function buildChartDataPoint(
  label: string,
  value: number,
  color?: string,
): ChartDataPoint {
  return {
    label,
    value,
    ...(color !== undefined ? { color } : {}),
  }
}

// ═══════════════════════════════════════════════════════════
// 导出生成
// ═══════════════════════════════════════════════════════════

/**
 * 根据指定格式列表生成导出结果
 *
 * 支持格式：
 *   - json：JSON 序列化的报告数据
 *   - html：HTML 字符串（含 sections 标题和内容）
 *   - markdown：Markdown 格式（# 标题 + 内容）
 *   - pdf：JSON 字符串占位（标注需要客户端渲染）
 *   - print：同 html
 *
 * @param sections - 报告章节列表
 * @param formats - 导出格式（单个或数组）
 * @param language - 报告语言
 * @param reportId - 报告编号
 * @returns 导出结果列表
 */
function generateExports(
  sections: ReportSection[],
  formats: ExportFormat | ExportFormat[],
  language: 'zh-CN' | 'en-US',
  reportId: string,
): ExportResult[] {
  const normalizedFormats = normalizeFormats(formats)
  const results: ExportResult[] = []

  for (const format of normalizedFormats) {
    const content = formatExportContent(sections, format, language, reportId)
    results.push({
      format,
      content,
      size: content.length,
      generatedAt: Date.now(),
      reportId,
    })
  }

  return results
}

/**
 * 格式化导出内容
 *
 * @param sections - 报告章节
 * @param format - 导出格式
 * @param language - 语言
 * @param reportId - 报告编号
 * @returns 格式化后的字符串内容
 */
function formatExportContent(
  sections: ReportSection[],
  format: ExportFormat,
  language: 'zh-CN' | 'en-US',
  reportId: string,
): string {
  switch (format) {
    case 'json':
      return JSON.stringify({ sections, reportId })

    case 'html':
      return generateHtmlContent(sections, reportId)

    case 'markdown':
      return generateMarkdownContent(sections)

    case 'pdf':
      return JSON.stringify({
        notice: 'PDF generation requires client-side rendering',
        reportId,
        sections,
      })

    case 'print':
      return generateHtmlContent(sections, reportId)
  }
}

/**
 * 生成 HTML 格式内容
 */
function generateHtmlContent(sections: ReportSection[], reportId: string): string {
  const sectionHtml = sections
    .map((section) => {
      const escapedTitle = escapeHtml(section.title)
      const escapedContent = escapeHtml(section.content)
      return `  <section>\n    <h2>${escapedTitle}</h2>\n    <div>${escapedContent.replace(/\n/g, '<br/>\n    ')}</div>\n  </section>`
    })
    .join('\n')

  return [
    `<!DOCTYPE html>`,
    `<html lang="zh-CN">`,
    `<head>`,
    `  <meta charset="UTF-8" />`,
    `  <title>Report ${reportId}</title>`,
    `</head>`,
    `<body>`,
    sectionHtml,
    `</body>`,
    `</html>`,
  ].join('\n')
}

/**
 * 生成 Markdown 格式内容
 */
function generateMarkdownContent(sections: ReportSection[]): string {
  return sections
    .map((section) => `# ${section.title}\n\n${section.content}`)
    .join('\n\n---\n\n')
}

/**
 * HTML 特殊字符转义
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// ═══════════════════════════════════════════════════════════
// 品牌应用
// ═══════════════════════════════════════════════════════════

/**
 * 应用品牌配置
 *
 * 合并模板默认品牌配置与用户自定义品牌配置。
 * 用户配置优先级高于模板默认值。
 *
 * @param customBranding - 用户自定义品牌配置（可为 undefined）
 * @param templateConfig - 模板配置（含默认品牌）
 * @param reportId - 报告编号
 * @returns 合并后的 BrandingConfig
 */
function applyBranding(
  customBranding: Partial<BrandingConfig> | undefined,
  templateConfig: TemplateConfig,
  reportId: string,
): BrandingConfig {
  const defaultBranding = templateConfig.branding

  return {
    logo: customBranding?.logo ?? defaultBranding.logo,
    watermark: customBranding?.watermark ?? defaultBranding.watermark,
    qrCode: customBranding?.qrCode ?? defaultBranding.qrCode,
    copyright: customBranding?.copyright ?? defaultBranding.copyright,
    version: customBranding?.version ?? defaultBranding.version,
    generatedAt: customBranding?.generatedAt ?? Date.now(),
    reportId: customBranding?.reportId ?? reportId,
  }
}

// ═══════════════════════════════════════════════════════════
// 格式工具
// ═══════════════════════════════════════════════════════════

/**
 * 将 ExportFormat 或 ExportFormat[] 规范化为数组
 *
 * @param format - 单个格式或格式数组
 * @returns 格式数组
 */
function normalizeFormats(format: ExportFormat | ExportFormat[] | undefined): ExportFormat[] {
  if (format === undefined) {
    return ['json', 'html', 'markdown']
  }
  if (Array.isArray(format)) {
    return format
  }
  return [format]
}
