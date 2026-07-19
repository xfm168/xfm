/**
 * Module 8: Professional Report Export Engine — 类型定义
 *
 * 职责：数据展示、版式生成、报告导出、分享、打印、国际化
 * 禁止：参与任何命理计算，所有数据来自 Module7 MasterReport
 *
 * 这是 Professional Engine 最终模块。
 */

import type { FiveElement } from '@/lib/core/types/base'
import type { MasterReport } from './masterReportTypes'
import type { DerivationChain } from './types'

// ═══════════════════════════════════════════
// 1. 模板
// ═══════════════════════════════════════════

/** 报告模板类型 */
export type ReportTemplate =
  | 'professional'  // 专业版
  | 'classic'       // 古籍版
  | 'modern'        // 现代版
  | 'simple'        // 简洁版
  | 'vip'           // 完整版

/** 模板配置 */
export interface TemplateConfig {
  id: ReportTemplate
  name: string
  description: string
  sections: ReportSectionType[]
  includeCharts: boolean
  includeAppendix: boolean
  branding: BrandingConfig
}

// ═══════════════════════════════════════════
// 2. 章节
// ═══════════════════════════════════════════

/** 报告章节类型 */
export type ReportSectionType =
  | 'cover'             // 封面
  | 'pillars-info'       // 命盘信息
  | 'four-pillars'       // 四柱
  | 'shensha'           // 神煞
  | 'shishen'           // 十神
  | 'pattern'           // 格局
  | 'xiyong'            // 喜用神
  | 'dayun-liunian'     // 大运流年
  | 'scores'            // 综合评分
  | 'timeline'          // 人生时间轴
  | 'risk'              // 风险分析
  | 'opportunity'       // 机会分析
  | 'recommendation'    // 调理建议
  | 'summary'           // 总结
  | 'appendix'          // 附录

/** 报告章节 */
export interface ReportSection {
  type: ReportSectionType
  title: string
  content: string
  chartConfigs?: ChartConfig[]
  pageNumber?: number
}

// ═══════════════════════════════════════════
// 3. 图表
// ═══════════════════════════════════════════

/** 图表类型 */
export type ChartType =
  | 'five-element-pie'       // 五行占比饼图
  | 'shishen-bar'            // 十神比例柱状图
  | 'power-radar'            // 力量雷达图
  | 'life-trend'             // 人生趋势图
  | 'dayun-timeline'         // 大运时间轴
  | 'score-bar'              // 评分柱状图
  | 'risk-heatmap'           // 风险热力图

/** 图表配置 */
export interface ChartConfig {
  type: ChartType
  title: string
  data: ChartDataPoint[]
  width?: number
  height?: number
}

/** 图表数据点 */
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

// ═══════════════════════════════════════════
// 4. 导出
// ═══════════════════════════════════════════

/** 导出格式 */
export type ExportFormat =
  | 'pdf'
  | 'html'
  | 'markdown'
  | 'json'
  | 'print'

/** 导出结果 */
export interface ExportResult {
  format: ExportFormat
  content: string
  size: number          // bytes
  generatedAt: number
  reportId: string
}

// ═══════════════════════════════════════════
// 5. 品牌
// ═══════════════════════════════════════════

/** 品牌配置 */
export interface BrandingConfig {
  logo?: string
  watermark?: string
  qrCode?: string
  copyright: string
  version: string
  generatedAt?: number
  reportId?: string
}

// ═══════════════════════════════════════════
// 6. 国际化
// ═══════════════════════════════════════════

/** 支持的语言 */
export type ReportLanguage = 'zh-CN' | 'en-US'

/** 国际化条目 */
export interface I18nEntry {
  key: string
  zhCN: string
  enUS: string
}

// ═══════════════════════════════════════════
// 7. 最终输出
// ═══════════════════════════════════════════

/** ReportEngine 输出 */
export interface ReportEngineOutput {
  version: string
  template: ReportTemplate
  language: ReportLanguage
  reportId: string
  generatedAt: number
  sections: ReportSection[]
  charts: ChartConfig[]
  branding: BrandingConfig
  exports: ExportResult[]
  warnings: string[]
  computeTimeMs: number
  cacheVersion: string
  derivation: DerivationChain
}

/** 引擎选项 */
export interface ReportExportOptions {
  template?: ReportTemplate
  language?: ReportLanguage
  format?: ExportFormat | ExportFormat[]
  branding?: Partial<BrandingConfig>
  reportId?: string
}

// ═══════════════════════════════════════════
// 8. 工具函数
// ═══════════════════════════════════════════

/** 生成报告编号 */
export function generateReportId(): string {
  const now = new Date()
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0')
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `XFM-${ts}-${rand}`
}

/** 获取模板显示名 */
export function getTemplateDisplayName(template: ReportTemplate): string {
  const names: Record<ReportTemplate, string> = {
    professional: '专业版',
    classic: '古籍版',
    modern: '现代版',
    simple: '简洁版',
    vip: '完整版',
  }
  return names[template]
}

/** 获取格式显示名 */
export function getFormatDisplayName(format: ExportFormat): string {
  const names: Record<ExportFormat, string> = {
    pdf: 'PDF',
    html: 'HTML',
    markdown: 'Markdown',
    json: 'JSON',
    print: '打印版',
  }
  return names[format]
}
