/**
 * Module 8: Professional Report Export Engine — 数据库配置
 *
 * 职责：模板配置、章节标题、国际化、图表定义、导出格式
 * 禁止：参与任何命理计算，所有数据来自 Module7 MasterReport
 */

import type {
  ReportTemplate,
  TemplateConfig,
  ReportSectionType,
  I18nEntry,
  ChartType,
  ExportFormat,
} from './reportExportTypes'

// ═══════════════════════════════════════════
// 1. 模板配置（5 种模板）
// ═══════════════════════════════════════════

/** 全部 15 个章节（按标准报告顺序排列） */
const ALL_SECTIONS: ReportSectionType[] = [
  'cover',
  'pillars-info',
  'four-pillars',
  'shensha',
  'shishen',
  'pattern',
  'xiyong',
  'dayun-liunian',
  'scores',
  'timeline',
  'risk',
  'opportunity',
  'recommendation',
  'summary',
  'appendix',
]

/** 古籍版 7 个章节 */
const CLASSIC_SECTIONS: ReportSectionType[] = [
  'cover',
  'four-pillars',
  'shensha',
  'shishen',
  'pattern',
  'xiyong',
  'dayun-liunian',
  'summary',
]

/** 现代版 8 个章节 */
const MODERN_SECTIONS: ReportSectionType[] = [
  'cover',
  'pillars-info',
  'shishen',
  'scores',
  'timeline',
  'risk',
  'opportunity',
  'recommendation',
  'summary',
]

/** 简洁版 3 个章节 */
const SIMPLE_SECTIONS: ReportSectionType[] = [
  'cover',
  'pillars-info',
  'scores',
  'summary',
]

/**
 * 5 种报告模板配置
 * - professional: 专业版（全部 15 章节 + 图表 + 附录 + 品牌）
 * - classic:     古籍版（7 章，无图表）
 * - modern:      现代版（8 章 + 图表）
 * - simple:      简洁版（3 章，无图表无附录）
 * - vip:         完整版（全部 15 章节 + 图表 + 附录 + 品牌 + 水印 + 二维码）
 */
export const TEMPLATE_CONFIGS: Record<ReportTemplate, TemplateConfig> = {
  professional: {
    id: 'professional',
    name: '专业版',
    description: '完整的命理分析报告，包含全部章节、图表与附录',
    sections: ALL_SECTIONS,
    includeCharts: true,
    includeAppendix: true,
    branding: {
      copyright: '玄风门 V4.4 Enterprise',
      version: 'v8.0.0',
    },
  },
  classic: {
    id: 'classic',
    name: '古籍版',
    description: '传统古籍风格命理报告，侧重四柱与格局分析',
    sections: CLASSIC_SECTIONS,
    includeCharts: false,
    includeAppendix: false,
    branding: {
      copyright: '玄风门古法命理',
      version: 'v8.0.0',
    },
  },
  modern: {
    id: 'modern',
    name: '现代版',
    description: '现代化命理报告，侧重评分与趋势分析，含图表',
    sections: MODERN_SECTIONS,
    includeCharts: true,
    includeAppendix: false,
    branding: {
      copyright: 'XuanFengMen Pro',
      version: 'v8.0.0',
    },
  },
  simple: {
    id: 'simple',
    name: '简洁版',
    description: '精简命理报告，仅含核心评分与概要',
    sections: SIMPLE_SECTIONS,
    includeCharts: false,
    includeAppendix: false,
    branding: {
      copyright: '玄风门',
      version: 'v8.0.0',
    },
  },
  vip: {
    id: 'vip',
    name: '完整版',
    description: 'VIP 尊享完整报告，包含全部内容、水印与二维码',
    sections: ALL_SECTIONS,
    includeCharts: true,
    includeAppendix: true,
    branding: {
      copyright: '玄风门 VIP Edition',
      version: 'v8.0.0',
      watermark: 'VIP',
      qrCode: 'https://xuanfengmen.com',
    },
  },
}

// ═══════════════════════════════════════════
// 2. 中文章节标题
// ═══════════════════════════════════════════

/** 15 个章节的中文标题映射 */
export const SECTION_TITLES_ZH: Record<ReportSectionType, string> = {
  cover: '封面',
  'pillars-info': '命盘信息',
  'four-pillars': '四柱',
  shensha: '神煞',
  shishen: '十神',
  pattern: '格局',
  xiyong: '喜用神',
  'dayun-liunian': '大运流年',
  scores: '综合评分',
  timeline: '人生时间轴',
  risk: '风险分析',
  opportunity: '机会分析',
  recommendation: '调理建议',
  summary: '总结',
  appendix: '附录',
}

// ═══════════════════════════════════════════
// 3. 英文章节标题
// ═══════════════════════════════════════════

/** 15 个章节的英文标题映射 */
export const SECTION_TITLES_EN: Record<ReportSectionType, string> = {
  cover: 'Cover',
  'pillars-info': 'Birth Chart Info',
  'four-pillars': 'Four Pillars',
  shensha: 'Shen Sha',
  shishen: 'Ten Gods',
  pattern: 'Pattern',
  xiyong: 'Xi Yong',
  'dayun-liunian': 'Da Yun & Liu Nian',
  scores: 'Overall Scores',
  timeline: 'Life Timeline',
  risk: 'Risk Analysis',
  opportunity: 'Opportunity Analysis',
  recommendation: 'Recommendations',
  summary: 'Summary',
  appendix: 'Appendix',
}

// ═══════════════════════════════════════════
// 4. 国际化条目
// ═══════════════════════════════════════════

/**
 * 国际化条目列表
 * 覆盖报告标题、日主、出生日期、性别、各维度评分、
 * 格局评价、人生定位、优势劣势、风险机会、时间轴分期、建议、版权等
 */
export const I18N_ENTRIES: I18nEntry[] = [
  { key: 'report_title',   zhCN: '命理分析报告',      enUS: 'BaZi Analysis Report' },
  { key: 'day_master',     zhCN: '日主',              enUS: 'Day Master' },
  { key: 'birth_date',     zhCN: '出生日期',          enUS: 'Birth Date' },
  { key: 'gender',         zhCN: '性别',              enUS: 'Gender' },
  { key: 'overall_score',  zhCN: '综合评分',          enUS: 'Overall Score' },
  { key: 'career_score',   zhCN: '事业评分',          enUS: 'Career Score' },
  { key: 'wealth_score',   zhCN: '财运评分',          enUS: 'Wealth Score' },
  { key: 'marriage_score', zhCN: '婚姻评分',          enUS: 'Marriage Score' },
  { key: 'health_score',   zhCN: '健康评分',          enUS: 'Health Score' },
  { key: 'study_score',    zhCN: '学业评分',          enUS: 'Study Score' },
  { key: 'pattern_evaluation', zhCN: '格局评价',      enUS: 'Pattern Evaluation' },
  { key: 'life_positioning',   zhCN: '人生定位',      enUS: 'Life Positioning' },
  { key: 'strengths',      zhCN: '优势',              enUS: 'Strengths' },
  { key: 'weaknesses',     zhCN: '劣势',              enUS: 'Weaknesses' },
  { key: 'risks',          zhCN: '风险',              enUS: 'Risks' },
  { key: 'opportunities',  zhCN: '机会',              enUS: 'Opportunities' },
  { key: 'timeline_youth', zhCN: '少年期',             enUS: 'Youth' },
  { key: 'timeline_middle', zhCN: '中年期',           enUS: 'Middle Age' },
  { key: 'timeline_elder', zhCN: '老年期',             enUS: 'Elder' },
  { key: 'recommendation', zhCN: '调理建议',          enUS: 'Recommendation' },
  { key: 'copyright',      zhCN: '版权所有',          enUS: 'Copyright' },
  { key: 'generated_at',   zhCN: '生成时间',          enUS: 'Generated At' },
]

// ═══════════════════════════════════════════
// 5. 图表定义
// ═══════════════════════════════════════════

/**
 * 7 种图表定义
 * 包含图表类型、中文标题及默认尺寸
 */
export const CHART_DEFINITIONS: Array<{
  type: ChartType
  title: string
  defaultWidth: number
  defaultHeight: number
}> = [
  { type: 'five-element-pie', title: '五行占比',     defaultWidth: 500, defaultHeight: 350 },
  { type: 'shishen-bar',      title: '十神力量分布', defaultWidth: 600, defaultHeight: 350 },
  { type: 'power-radar',      title: '综合力量雷达', defaultWidth: 500, defaultHeight: 500 },
  { type: 'life-trend',       title: '人生趋势',     defaultWidth: 800, defaultHeight: 350 },
  { type: 'dayun-timeline',   title: '大运时间轴',   defaultWidth: 800, defaultHeight: 200 },
  { type: 'score-bar',        title: '多维评分',     defaultWidth: 600, defaultHeight: 350 },
  { type: 'risk-heatmap',     title: '风险热力图',   defaultWidth: 600, defaultHeight: 300 },
]

// ═══════════════════════════════════════════
// 6. 导出格式列表
// ═══════════════════════════════════════════

/** 支持的导出格式 */
export const EXPORT_FORMATS: ExportFormat[] = [
  'pdf',
  'html',
  'markdown',
  'json',
  'print',
]

// ═══════════════════════════════════════════
// 7. 查询函数
// ═══════════════════════════════════════════

/**
 * 获取指定模板的配置
 * @param template - 报告模板类型
 * @returns 对应的模板配置
 */
export function getTemplateConfig(template: ReportTemplate): TemplateConfig {
  return TEMPLATE_CONFIGS[template]
}

/**
 * 获取指定章节在指定语言下的标题
 * @param type     - 章节类型
 * @param language - 语言（'zh-CN' 或 'en-US'）
 * @returns 章节标题字符串
 */
export function getSectionTitle(
  type: ReportSectionType,
  language: 'zh-CN' | 'en-US',
): string {
  return language === 'zh-CN'
    ? SECTION_TITLES_ZH[type]
    : SECTION_TITLES_EN[type]
}

/**
 * 根据国际化键和语言获取翻译文本
 * @param key      - 国际化键名
 * @param language - 语言（'zh-CN' 或 'en-US'）
 * @returns 对应语言的文本；未找到时返回键名本身
 */
export function getI18nValue(
  key: string,
  language: 'zh-CN' | 'en-US',
): string {
  const entry = I18N_ENTRIES.find((e) => e.key === key)
  if (!entry) {
    return key
  }
  return language === 'zh-CN' ? entry.zhCN : entry.enUS
}

/**
 * 根据图表类型获取图表定义
 * @param type - 图表类型
 * @returns 图表定义对象，未找到时返回 undefined
 */
export function getChartDefinition(
  type: ChartType,
): { type: ChartType; title: string; defaultWidth: number; defaultHeight: number } | undefined {
  return CHART_DEFINITIONS.find((c) => c.type === type)
}

/**
 * 获取全部图表定义
 * @returns 图表定义数组的副本
 */
export function getAllChartDefinitions(): typeof CHART_DEFINITIONS {
  return [...CHART_DEFINITIONS]
}
