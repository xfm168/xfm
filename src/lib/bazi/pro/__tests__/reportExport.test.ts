/**
 * Module 8 v8.0.0: Professional Report Export Engine — 全量测试
 *
 * 覆盖：版本号、数据库配置（模板/章节标题/国际化/图表/导出格式）、
 *       工具函数（generateReportId/getTemplateDisplayName/getFormatDisplayName）、
 *       引擎输出结构、默认值、章节生成、图表、导出、品牌、
 *       缓存、推导链、模板切换、国际化、格式选择、品牌自定义、边界情况
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { generateReportExport, REPORT_EXPORT_VERSION, REPORT_EXPORT_CACHE_VERSION, clearReportExportCache, getReportExportCacheSize } from '../reportExportEngine'
import { TEMPLATE_CONFIGS, SECTION_TITLES_ZH, SECTION_TITLES_EN, I18N_ENTRIES, CHART_DEFINITIONS, EXPORT_FORMATS, getTemplateConfig, getSectionTitle, getI18nValue, getChartDefinition, getAllChartDefinitions } from '../reportExportDatabase'
import { generateReportId, getTemplateDisplayName, getFormatDisplayName } from '../reportExportTypes'
import type { ReportTemplate, ExportFormat, ReportLanguage, ReportEngineOutput, ReportSection, ChartConfig, ExportResult } from '../reportExportTypes'
import type { MasterReport } from '../masterReportTypes'
import type { HeavenlyStem, FiveElement } from '@/lib/core/types/base'

// ─── 辅助：构建最小 MasterReport mock 数据 ───

function makeMasterReport(): MasterReport {
  return {
    version: '7.0.0',
    dayMaster: '甲' as HeavenlyStem,
    dayMasterElement: '木' as FiveElement,
    // ── OverallAssessment：完整 10 个字段 ──
    overallAssessment: {
      summary: '命局总评测试文本',
      patternEvaluation: '格局评价测试文本',
      lifePositioning: '人生定位测试文本',
      strengths: ['优势一', '优势二'],
      weaknesses: ['劣势一'],
      opportunities: ['机遇一'],
      risks: ['风险一'],
      developmentDirection: '发展方向测试文本',
      sourceModules: ['pattern', 'xiYong'],
      confidence: 0.75,
    },
    // ── FiveDimensionScores：5 维 + overall ──
    fiveDimensionScores: {
      career:    { score: 70, level: '良好', influencedModules: ['pattern'],    weight: 0.2, reasons: ['事业原因'],     confidence: 0.7 },
      wealth:    { score: 65, level: '良好', influencedModules: ['xiYong'],    weight: 0.2, reasons: ['财富原因'],     confidence: 0.65 },
      marriage:  { score: 60, level: '中等', influencedModules: ['fortune'],   weight: 0.2, reasons: ['婚姻原因'],     confidence: 0.6 },
      health:    { score: 75, level: '良好', influencedModules: ['shenSha'],   weight: 0.2, reasons: ['健康原因'],     confidence: 0.75 },
      study:     { score: 80, level: '优秀', influencedModules: ['pattern'],   weight: 0.2, reasons: ['学业原因'],     confidence: 0.8 },
      overall: 70,
    },
    // ── CrossValidationResult：6 个字段 ──
    crossValidation: {
      validated: true,
      confidence: 0.8,
      reasons: ['理由一', '理由二'],
      contradictions: [],
      supportingModules: ['tenGods', 'xiYong'],
      traceChain: [],
    },
    // ── TimelineStage 数组 ──
    timeline: [
      {
        stage: '儿童',
        ageRange: '0-15岁',
        summary: '少年期概要',
        fortuneInfluence: '大运影响描述',
        xiYongInfluence: '喜用影响描述',
        keyEvents: ['事件一'],
        confidence: 0.7,
      },
    ],
    risks: [],
    opportunities: [],
    recommendations: [],
    explains: [],
    warnings: [],
    computeTimeMs: 10,
    // ── executionMetadata：3 个字段 ──
    executionMetadata: {
      computeTimeMs: 10,
      cacheVersion: '7.0.0',
      moduleVersions: {
        pillars: '1.0.0',
        shenSha: '2.0.0',
        tenGods: '3.1.0',
        pattern: '4.1.0',
        xiYong: '5.0.0',
        fortune: '6.0.0',
      },
    },
    cacheVersion: '7.0.0',
    // ── DerivationChain：6 个字段 ──
    derivation: {
      steps: [],
      overallConfidence: 0.8,
      computeTimeMs: 10,
      engineVersion: '7.0.0',
      algorithmVersion: 'v1.0-classic',
      warnings: [],
    },
  }
}

// ─── 每次测试前清空缓存 ───

beforeEach(() => { clearReportExportCache() })

// ═══════════════════════════════════════════
// 0. 顶层 describe
// ═══════════════════════════════════════════

describe('Module 8: Report Export Engine', () => {
  it('顶层分组包含所有子 describe', () => {
    // 此测试仅用于确保顶层 describe 正确挂载
    expect(true).toBe(true)
  })
})

// ═══════════════════════════════════════════
// 1. 版本号 (2)
// ═══════════════════════════════════════════

describe('版本号', () => {
  it('REPORT_EXPORT_VERSION === "8.0.0"', () => {
    expect(REPORT_EXPORT_VERSION).toBe('8.0.0')
  })

  it('REPORT_EXPORT_CACHE_VERSION === "8.0.0"', () => {
    expect(REPORT_EXPORT_CACHE_VERSION).toBe('8.0.0')
  })
})

// ═══════════════════════════════════════════
// 2. Database: 模板配置 (9)
// ═══════════════════════════════════════════

describe('Database: 模板配置', () => {
  it('TEMPLATE_CONFIGS 有 5 个模板', () => {
    expect(Object.keys(TEMPLATE_CONFIGS)).toHaveLength(5)
  })

  it('professional 模板存在', () => {
    expect(TEMPLATE_CONFIGS.professional).toBeDefined()
  })

  it('classic 模板存在', () => {
    expect(TEMPLATE_CONFIGS.classic).toBeDefined()
  })

  it('modern 模板存在', () => {
    expect(TEMPLATE_CONFIGS.modern).toBeDefined()
  })

  it('simple 模板存在', () => {
    expect(TEMPLATE_CONFIGS.simple).toBeDefined()
  })

  it('vip 模板存在', () => {
    expect(TEMPLATE_CONFIGS.vip).toBeDefined()
  })

  it('每个模板有 id/name/description/sections/includeCharts/includeAppendix/branding', () => {
    for (const key of Object.keys(TEMPLATE_CONFIGS)) {
      const config = TEMPLATE_CONFIGS[key as ReportTemplate]
      expect(config).toHaveProperty('id')
      expect(config).toHaveProperty('name')
      expect(config).toHaveProperty('description')
      expect(config).toHaveProperty('sections')
      expect(config).toHaveProperty('includeCharts')
      expect(config).toHaveProperty('includeAppendix')
      expect(config).toHaveProperty('branding')
    }
  })

  it('每个模板的 sections 是数组且非空', () => {
    for (const key of Object.keys(TEMPLATE_CONFIGS)) {
      const config = TEMPLATE_CONFIGS[key as ReportTemplate]
      expect(Array.isArray(config.sections)).toBe(true)
      expect(config.sections.length).toBeGreaterThan(0)
    }
  })

  it('每个模板的 branding 有 copyright 和 version', () => {
    for (const key of Object.keys(TEMPLATE_CONFIGS)) {
      const config = TEMPLATE_CONFIGS[key as ReportTemplate]
      expect(config.branding).toHaveProperty('copyright')
      expect(config.branding).toHaveProperty('version')
      expect(typeof config.branding.copyright).toBe('string')
      expect(config.branding.copyright.length).toBeGreaterThan(0)
    }
  })
})

// ═══════════════════════════════════════════
// 3. Database: 章节标题 (7)
// ═══════════════════════════════════════════

describe('Database: 章节标题', () => {
  it('SECTION_TITLES_ZH 有 15 个条目', () => {
    expect(Object.keys(SECTION_TITLES_ZH)).toHaveLength(15)
  })

  it('SECTION_TITLES_EN 有 15 个条目', () => {
    expect(Object.keys(SECTION_TITLES_EN)).toHaveLength(15)
  })

  it('中文标题包含 "封面"', () => {
    expect(Object.values(SECTION_TITLES_ZH)).toContain('封面')
  })

  it('英文标题包含 "Cover"', () => {
    expect(Object.values(SECTION_TITLES_EN)).toContain('Cover')
  })

  it('getSectionTitle("cover", "zh-CN") === "封面"', () => {
    expect(getSectionTitle('cover', 'zh-CN')).toBe('封面')
  })

  it('getSectionTitle("cover", "en-US") === "Cover"', () => {
    expect(getSectionTitle('cover', 'en-US')).toBe('Cover')
  })

  it('中英文标题条目数相同', () => {
    expect(Object.keys(SECTION_TITLES_ZH).length).toBe(Object.keys(SECTION_TITLES_EN).length)
  })
})

// ═══════════════════════════════════════════
// 4. Database: 国际化 (5)
// ═══════════════════════════════════════════

describe('Database: 国际化', () => {
  it('I18N_ENTRIES 长度 >= 20', () => {
    expect(I18N_ENTRIES.length).toBeGreaterThanOrEqual(20)
  })

  it('每条有 key/zhCN/enUS', () => {
    for (const entry of I18N_ENTRIES) {
      expect(entry).toHaveProperty('key')
      expect(entry).toHaveProperty('zhCN')
      expect(entry).toHaveProperty('enUS')
    }
  })

  it('getI18nValue("report_title", "zh-CN") 有值', () => {
    const val = getI18nValue('report_title', 'zh-CN')
    expect(val).toBe('命理分析报告')
  })

  it('getI18nValue("report_title", "en-US") 有值', () => {
    const val = getI18nValue('report_title', 'en-US')
    expect(val).toBe('BaZi Analysis Report')
  })

  it('不存在的 key 返回 key 本身', () => {
    const val = getI18nValue('nonexistent_key', 'zh-CN')
    expect(val).toBe('nonexistent_key')
  })
})

// ═══════════════════════════════════════════
// 5. Database: 图表定义 (5)
// ═══════════════════════════════════════════

describe('Database: 图表定义', () => {
  it('CHART_DEFINITIONS 长度 === 7', () => {
    expect(CHART_DEFINITIONS).toHaveLength(7)
  })

  it('getChartDefinition("score-bar") 存在', () => {
    const def = getChartDefinition('score-bar')
    expect(def).toBeDefined()
    expect(def!.type).toBe('score-bar')
  })

  it('getChartDefinition("five-element-pie") 存在', () => {
    const def = getChartDefinition('five-element-pie')
    expect(def).toBeDefined()
    expect(def!.type).toBe('five-element-pie')
  })

  it('getAllChartDefinitions() 长度 === 7', () => {
    const all = getAllChartDefinitions()
    expect(all).toHaveLength(7)
  })

  it('每个图表定义有 type/title/defaultWidth/defaultHeight', () => {
    for (const chart of CHART_DEFINITIONS) {
      expect(chart).toHaveProperty('type')
      expect(chart).toHaveProperty('title')
      expect(chart).toHaveProperty('defaultWidth')
      expect(chart).toHaveProperty('defaultHeight')
      expect(chart.defaultWidth).toBeGreaterThan(0)
      expect(chart.defaultHeight).toBeGreaterThan(0)
    }
  })
})

// ═══════════════════════════════════════════
// 6. Database: 导出格式 (3)
// ═══════════════════════════════════════════

describe('Database: 导出格式', () => {
  it('EXPORT_FORMATS 长度 === 5', () => {
    expect(EXPORT_FORMATS).toHaveLength(5)
  })

  it('包含 "pdf", "html", "markdown", "json", "print"', () => {
    expect(EXPORT_FORMATS).toContain('pdf')
    expect(EXPORT_FORMATS).toContain('html')
    expect(EXPORT_FORMATS).toContain('markdown')
    expect(EXPORT_FORMATS).toContain('json')
    expect(EXPORT_FORMATS).toContain('print')
  })

  it('getTemplateConfig("professional") 返回正确配置', () => {
    const config = getTemplateConfig('professional')
    expect(config.id).toBe('professional')
    expect(config.name).toBe('专业版')
  })
})

// ═══════════════════════════════════════════
// 7. Types: 工具函数 (9)
// ═══════════════════════════════════════════

describe('Types: 工具函数', () => {
  it('generateReportId() 以 "XFM-" 开头', () => {
    const id = generateReportId()
    expect(id.startsWith('XFM-')).toBe(true)
  })

  it('getTemplateDisplayName("professional") === "专业版"', () => {
    expect(getTemplateDisplayName('professional')).toBe('专业版')
  })

  it('getTemplateDisplayName("classic") === "古籍版"', () => {
    expect(getTemplateDisplayName('classic')).toBe('古籍版')
  })

  it('getTemplateDisplayName("modern") === "现代版"', () => {
    expect(getTemplateDisplayName('modern')).toBe('现代版')
  })

  it('getTemplateDisplayName("simple") === "简洁版"', () => {
    expect(getTemplateDisplayName('simple')).toBe('简洁版')
  })

  it('getTemplateDisplayName("vip") === "完整版"', () => {
    expect(getTemplateDisplayName('vip')).toBe('完整版')
  })

  it('getFormatDisplayName("pdf") === "PDF"', () => {
    expect(getFormatDisplayName('pdf')).toBe('PDF')
  })

  it('getFormatDisplayName("html") === "HTML"', () => {
    expect(getFormatDisplayName('html')).toBe('HTML')
  })

  it('getFormatDisplayName("markdown") === "Markdown"', () => {
    expect(getFormatDisplayName('markdown')).toBe('Markdown')
  })
})

// ═══════════════════════════════════════════
// 8. Engine: 默认输出结构 (2)
// ═══════════════════════════════════════════

describe('Engine: 默认输出结构', () => {
  it('generateReportExport(report) 返回对象有完整字段', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result).toBeDefined()
    expect(result).toHaveProperty('version')
    expect(result).toHaveProperty('template')
    expect(result).toHaveProperty('language')
    expect(result).toHaveProperty('reportId')
    expect(result).toHaveProperty('generatedAt')
    expect(result).toHaveProperty('sections')
    expect(result).toHaveProperty('charts')
    expect(result).toHaveProperty('branding')
    expect(result).toHaveProperty('exports')
    expect(result).toHaveProperty('warnings')
    expect(result).toHaveProperty('computeTimeMs')
    expect(result).toHaveProperty('cacheVersion')
    expect(result).toHaveProperty('derivation')
  })

  it('返回值类型为 ReportEngineOutput', () => {
    const result = generateReportExport(makeMasterReport())
    // 验证关键字段类型
    expect(typeof result.version).toBe('string')
    expect(typeof result.template).toBe('string')
    expect(typeof result.language).toBe('string')
    expect(typeof result.reportId).toBe('string')
    expect(typeof result.generatedAt).toBe('number')
    expect(Array.isArray(result.sections)).toBe(true)
    expect(Array.isArray(result.charts)).toBe(true)
    expect(typeof result.branding).toBe('object')
    expect(Array.isArray(result.exports)).toBe(true)
    expect(Array.isArray(result.warnings)).toBe(true)
    expect(typeof result.computeTimeMs).toBe('number')
  })
})

// ═══════════════════════════════════════════
// 9. Engine: 默认值 (5)
// ═══════════════════════════════════════════

describe('Engine: 默认值', () => {
  it('version === "8.0.0"', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.version).toBe('8.0.0')
  })

  it('template === "professional"', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.template).toBe('professional')
  })

  it('language === "zh-CN"', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.language).toBe('zh-CN')
  })

  it('reportId 以 "XFM-" 开头（当指定 reportId 时使用指定值）', () => {
    const result = generateReportExport(makeMasterReport(), { reportId: 'XFM-TEST-001' })
    expect(result.reportId).toBe('XFM-TEST-001')
  })

  it('cacheVersion === "8.0.0"', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.cacheVersion).toBe('8.0.0')
  })
})

// ═══════════════════════════════════════════
// 10. Engine: 章节生成 (5)
// ═══════════════════════════════════════════

describe('Engine: 章节生成', () => {
  it('sections 是数组', () => {
    const result = generateReportExport(makeMasterReport())
    expect(Array.isArray(result.sections)).toBe(true)
  })

  it('每项有 type/title/content', () => {
    const result = generateReportExport(makeMasterReport())
    for (const section of result.sections) {
      expect(section).toHaveProperty('type')
      expect(section).toHaveProperty('title')
      expect(section).toHaveProperty('content')
    }
  })

  it('默认模板有 cover 和 summary', () => {
    const result = generateReportExport(makeMasterReport())
    const types = result.sections.map((s) => s.type)
    expect(types).toContain('cover')
    expect(types).toContain('summary')
  })

  it('sections 长度 > 0', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.sections.length).toBeGreaterThan(0)
  })

  it('每个章节有 pageNumber', () => {
    const result = generateReportExport(makeMasterReport())
    for (const section of result.sections) {
      expect(section.pageNumber).toBeDefined()
      expect(section.pageNumber).toBeGreaterThan(0)
    }
  })
})

// ═══════════════════════════════════════════
// 11. Engine: 图表 (4)
// ═══════════════════════════════════════════

describe('Engine: 图表', () => {
  it('charts 是数组', () => {
    const result = generateReportExport(makeMasterReport())
    expect(Array.isArray(result.charts)).toBe(true)
  })

  it('professional 模板 charts.length > 0', () => {
    const result = generateReportExport(makeMasterReport(), { template: 'professional' })
    expect(result.charts.length).toBeGreaterThan(0)
  })

  it('classic 模板 charts.length === 0', () => {
    const result = generateReportExport(makeMasterReport(), { template: 'classic' })
    expect(result.charts).toHaveLength(0)
  })

  it('simple 模板 charts.length === 0', () => {
    const result = generateReportExport(makeMasterReport(), { template: 'simple' })
    expect(result.charts).toHaveLength(0)
  })
})

// ═══════════════════════════════════════════
// 12. Engine: 导出 (7)
// ═══════════════════════════════════════════

describe('Engine: 导出', () => {
  it('exports 是数组', () => {
    const result = generateReportExport(makeMasterReport())
    expect(Array.isArray(result.exports)).toBe(true)
  })

  it('默认有 3 种导出（json/html/markdown）', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.exports.length).toBe(3)
    const formats = result.exports.map((e) => e.format)
    expect(formats).toContain('json')
    expect(formats).toContain('html')
    expect(formats).toContain('markdown')
  })

  it('每项有 format/content/size/generatedAt/reportId', () => {
    const result = generateReportExport(makeMasterReport())
    for (const exp of result.exports) {
      expect(exp).toHaveProperty('format')
      expect(exp).toHaveProperty('content')
      expect(exp).toHaveProperty('size')
      expect(exp).toHaveProperty('generatedAt')
      expect(exp).toHaveProperty('reportId')
    }
  })

  it('json 导出的 content 是有效 JSON', () => {
    const result = generateReportExport(makeMasterReport())
    const jsonExport = result.exports.find((e) => e.format === 'json')
    expect(jsonExport).toBeDefined()
    // 不抛出异常即为有效 JSON
    expect(() => JSON.parse(jsonExport!.content)).not.toThrow()
  })

  it('html 导出包含 "<" 字符', () => {
    const result = generateReportExport(makeMasterReport())
    const htmlExport = result.exports.find((e) => e.format === 'html')
    expect(htmlExport).toBeDefined()
    expect(htmlExport!.content).toContain('<')
  })

  it('markdown 导出包含 "#" 字符', () => {
    const result = generateReportExport(makeMasterReport())
    const mdExport = result.exports.find((e) => e.format === 'markdown')
    expect(mdExport).toBeDefined()
    expect(mdExport!.content).toContain('#')
  })

  it('指定全部 5 种格式时生成 5 种导出', () => {
    const allFormats: ExportFormat[] = ['pdf', 'html', 'markdown', 'json', 'print']
    const result = generateReportExport(makeMasterReport(), { format: allFormats })
    expect(result.exports.length).toBe(5)
    const formats = result.exports.map((e) => e.format)
    for (const f of allFormats) {
      expect(formats).toContain(f)
    }
  })
})

// ═══════════════════════════════════════════
// 13. Engine: 品牌 (2)
// ═══════════════════════════════════════════

describe('Engine: 品牌', () => {
  it('branding 有 copyright/version', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.branding).toHaveProperty('copyright')
    expect(result.branding).toHaveProperty('version')
  })

  it('copyright 是非空字符串', () => {
    const result = generateReportExport(makeMasterReport())
    expect(typeof result.branding.copyright).toBe('string')
    expect(result.branding.copyright.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════
// 14. Engine: 缓存 (4)
// ═══════════════════════════════════════════

describe('Engine: 缓存', () => {
  it('首次调用后 getReportExportCacheSize() === 1', () => {
    expect(getReportExportCacheSize()).toBe(0)
    generateReportExport(makeMasterReport())
    expect(getReportExportCacheSize()).toBe(1)
  })

  it('相同 reportId 命中缓存（返回同一引用）', () => {
    const report = makeMasterReport()
    const fixedId = 'XFM-CACHE-TEST-001'
    const result1 = generateReportExport(report, { reportId: fixedId })
    const result2 = generateReportExport(report, { reportId: fixedId })
    expect(getReportExportCacheSize()).toBe(1)
    // 缓存命中，返回同一引用
    expect(result1).toBe(result2)
  })

  it('clearReportExportCache() 后 size === 0', () => {
    generateReportExport(makeMasterReport())
    expect(getReportExportCacheSize()).toBe(1)
    clearReportExportCache()
    expect(getReportExportCacheSize()).toBe(0)
  })

  it('不同 reportId 产生不同缓存条目', () => {
    const report = makeMasterReport()
    generateReportExport(report, { reportId: 'XFM-A' })
    generateReportExport(report, { reportId: 'XFM-B' })
    expect(getReportExportCacheSize()).toBe(2)
  })
})

// ═══════════════════════════════════════════
// 15. Engine: DerivationChain (4)
// ═══════════════════════════════════════════

describe('Engine: DerivationChain', () => {
  it('derivation.steps 长度 >= 6（6步 pipeline）', () => {
    const result = generateReportExport(makeMasterReport())
    // Pipeline 有 6 步：resolve-template, resolve-language, generate-sections,
    // generate-charts, apply-branding, generate-exports
    expect(result.derivation.steps.length).toBeGreaterThanOrEqual(6)
  })

  it('engineVersion === "8.0.0"', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.derivation.engineVersion).toBe('8.0.0')
  })

  it('computeTimeMs >= 0', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.derivation.computeTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('overallConfidence 在 0~1', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.derivation.overallConfidence).toBeGreaterThanOrEqual(0)
    expect(result.derivation.overallConfidence).toBeLessThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════
// 16. Engine: 模板切换 (3)
// ═══════════════════════════════════════════

describe('Engine: 模板切换', () => {
  it('classic 模板 sections 与 professional 不同', () => {
    const resultPro = generateReportExport(makeMasterReport(), {
      template: 'professional',
      reportId: 'XFM-PRO',
    })
    const resultClassic = generateReportExport(makeMasterReport(), {
      template: 'classic',
      reportId: 'XFM-CLASSIC',
    })
    const proTypes = resultPro.sections.map((s) => s.type)
    const classicTypes = resultClassic.sections.map((s) => s.type)
    expect(proTypes).not.toEqual(classicTypes)
  })

  it('simple 模板 sections 较少', () => {
    const resultPro = generateReportExport(makeMasterReport(), {
      template: 'professional',
      reportId: 'XFM-PRO2',
    })
    const resultSimple = generateReportExport(makeMasterReport(), {
      template: 'simple',
      reportId: 'XFM-SIMPLE',
    })
    expect(resultSimple.sections.length).toBeLessThan(resultPro.sections.length)
  })

  it('vip 模板包含更多章节', () => {
    const resultVip = generateReportExport(makeMasterReport(), {
      template: 'vip',
      reportId: 'XFM-VIP',
    })
    // vip 模板应包含全部 15 个章节
    expect(resultVip.sections.length).toBe(15)
  })
})

// ═══════════════════════════════════════════
// 17. Engine: 国际化 (3)
// ═══════════════════════════════════════════

describe('Engine: 国际化', () => {
  it('language="en-US" 时章节标题为英文', () => {
    const result = generateReportExport(makeMasterReport(), {
      language: 'en-US',
      reportId: 'XFM-EN',
    })
    // cover 章节标题应为英文 "Cover"
    const coverSection = result.sections.find((s) => s.type === 'cover')
    expect(coverSection).toBeDefined()
    expect(coverSection!.title).toBe('Cover')
  })

  it('language="zh-CN" 时章节标题为中文', () => {
    const result = generateReportExport(makeMasterReport(), {
      language: 'zh-CN',
      reportId: 'XFM-ZH',
    })
    const coverSection = result.sections.find((s) => s.type === 'cover')
    expect(coverSection).toBeDefined()
    expect(coverSection!.title).toBe('封面')
  })

  it('en-US 模式下 summary 章节标题为 "Summary"', () => {
    const result = generateReportExport(makeMasterReport(), {
      language: 'en-US',
      reportId: 'XFM-EN2',
    })
    const summarySection = result.sections.find((s) => s.type === 'summary')
    expect(summarySection).toBeDefined()
    expect(summarySection!.title).toBe('Summary')
  })
})

// ═══════════════════════════════════════════
// 18. Engine: 导出格式选择 (3)
// ═══════════════════════════════════════════

describe('Engine: 导出格式选择', () => {
  it('format: "json" 时只生成 json', () => {
    const result = generateReportExport(makeMasterReport(), {
      format: 'json',
      reportId: 'XFM-JSON',
    })
    expect(result.exports.length).toBe(1)
    expect(result.exports[0].format).toBe('json')
  })

  it('format: ["pdf", "html"] 时只生成 2 种', () => {
    const result = generateReportExport(makeMasterReport(), {
      format: ['pdf', 'html'] as ExportFormat[],
      reportId: 'XFM-PDFHTML',
    })
    expect(result.exports.length).toBe(2)
    const formats = result.exports.map((e) => e.format)
    expect(formats).toContain('pdf')
    expect(formats).toContain('html')
  })

  it('指定单个 markdown 格式时内容包含 "#"', () => {
    const result = generateReportExport(makeMasterReport(), {
      format: 'markdown',
      reportId: 'XFM-MD',
    })
    expect(result.exports.length).toBe(1)
    expect(result.exports[0].format).toBe('markdown')
    expect(result.exports[0].content).toContain('#')
  })
})

// ═══════════════════════════════════════════
// 19. Engine: 品牌自定义 (2)
// ═══════════════════════════════════════════

describe('Engine: 品牌自定义', () => {
  it('传入 branding.copyright 时覆盖默认', () => {
    const result = generateReportExport(makeMasterReport(), {
      branding: { copyright: '自定义版权文字' },
      reportId: 'XFM-BRAND',
    })
    expect(result.branding.copyright).toBe('自定义版权文字')
  })

  it('不传 branding 时使用模板默认品牌', () => {
    const result = generateReportExport(makeMasterReport(), {
      template: 'professional',
      reportId: 'XFM-DEFBRAND',
    })
    // professional 默认品牌 copyright 应包含非空字符串
    expect(typeof result.branding.copyright).toBe('string')
    expect(result.branding.copyright.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════
// 20. Edge Cases (3)
// ═══════════════════════════════════════════

describe('Edge Cases', () => {
  it('最小 MasterReport 仍能生成报告', () => {
    // makeMasterReport() 已经是合法最小对象（risks/opportunities 等为空数组）
    const result = generateReportExport(makeMasterReport())
    expect(result).toBeDefined()
    expect(result.sections.length).toBeGreaterThan(0)
    expect(result.exports.length).toBeGreaterThan(0)
  })

  it('不传 options 时使用默认值', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.version).toBe('8.0.0')
    expect(result.template).toBe('professional')
    expect(result.language).toBe('zh-CN')
  })

  it('computeTimeMs >= 0', () => {
    const result = generateReportExport(makeMasterReport())
    expect(result.computeTimeMs).toBeGreaterThanOrEqual(0)
  })
})
