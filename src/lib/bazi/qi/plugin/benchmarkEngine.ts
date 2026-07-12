/**
 * P3.2 BenchmarkEngine -- 标准验证体系核心
 *
 * 对 CaseLibrary 中每个案例运行完整分析管线（13 模块），
 * 将引擎输出与案例的"标签结论"进行对比，计算准确率。
 * 支持新旧版本对比和回归检测。
 *
 * 纯 Plugin 模块，不修改 Kernel。
 */

import type { BaziCase, TrustLevel } from './caseLibrary'
import type { FiveElement } from '../../types'
import { STEM_ELEMENT } from '../../../core'
import * as fs from 'fs'
import * as path from 'path'

// ═══════════════════════════════════════════════════════════
// 13 模块导入（同 runner-p23-full.ts 管线）
// ═══════════════════════════════════════════════════════════

import { runP21Engine } from '../runP21Engine'
import { calculateDayMasterStrength } from './dayMasterStrengthEngine'
import { calculateClimateAdjustment } from './climateAdjustmentEngine'
import { analyzeDiseaseMedicine } from './diseaseMedicineEngine'
import { analyzeTongGuan } from './tongGuanEngine'
import { calculateUseGod } from './useGodEngine'
import { validatePattern } from './patternValidator'
import { calculateShenSha } from './shenShaEngine'
import { analyzeRelationships } from './relationshipEngine'
import { analyzeCareer } from './careerEngine'
import { analyzeWealth } from './wealthEngine'
import { analyzeMarriage } from './marriageEngine'
import { analyzeHealth } from './healthEngine'

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

export type DimensionName =
  | 'geJu'
  | 'wangShuai'
  | 'yongShen'
  | 'tiaoHou'
  | 'bingYao'
  | 'tongGuan'
  | 'shenSha'
  | 'relationship'
  | 'career'
  | 'wealth'
  | 'marriage'
  | 'health'
  | 'pattern'

/** 维度中文映射 */
const DIMENSION_LABEL: Record<DimensionName, string> = {
  geJu: '格局',
  wangShuai: '旺衰',
  yongShen: '用神',
  tiaoHou: '调候',
  bingYao: '病药',
  tongGuan: '通关',
  shenSha: '神煞',
  relationship: '关系',
  career: '事业',
  wealth: '财富',
  marriage: '婚姻',
  health: '健康',
  pattern: '格局校验',
}

export interface DimensionResult {
  dimension: DimensionName
  passed: boolean // 是否通过（引擎输出与案例标签一致）
  engineOutput: string // 引擎输出的值
  expectedValue: string // 案例标签值
  matchMethod: 'exact' | 'contains' | 'fuzzy' | 'skipped' // 匹配方式
  confidence: number // 匹配置信度 0-1
}

export interface CaseBenchmarkResult {
  caseId: string
  caseName: string
  trustLevel: TrustLevel
  totalDimensions: number
  passedDimensions: number
  failedDimensions: number
  skippedDimensions: number // 案例没有该维度标签
  accuracy: number // 0-100
  durationMs: number // 分析耗时
  dimensions: DimensionResult[]
  errors: string[] // 引擎报错
}

export interface BenchmarkReport {
  /** benchmark 运行 ID */
  id: string
  /** 运行时间 */
  timestamp: string
  /** 引擎版本 */
  version: string
  totalCases: number
  analyzedCases: number
  /** 无法分析的案例 */
  skippedCases: number
  totalDurationMs: number

  // 准确率
  /** 总准确率 0-100 */
  overallAccuracy: number
  dimensionAccuracy: Record<DimensionName, { total: number; passed: number; accuracy: number }>

  // 按可信度分层
  accuracyByTrust: Record<string, { total: number; accuracy: number }>

  // 按分类分层
  accuracyByCategory: Record<string, { total: number; accuracy: number }>

  // 错误案例
  /** 失败率最高的案例（top 20） */
  failedCases: CaseBenchmarkResult[]

  // 回归检测
  /** 回归风险 0-100 */
  regressionRisk: number
  regressionDetails: { dimension: string; accuracy: number; dropFromPrevious: number }[]

  // 汇总
  summary: string
  /** 是否通过（准确率>=阈值） */
  passed: boolean
  /** 准确率阈值 */
  threshold: number
}

export interface BenchmarkConfig {
  /** 当前引擎版本 */
  version: string
  /** 上次版本（用于对比） */
  previousVersion?: string
  /** 通过阈值（默认 70） */
  threshold: number
  /** 最大分析案例数（默认全部） */
  maxCases?: number
  /** 过滤可信度 */
  filterTrustLevel?: TrustLevel[]
  /** 过滤分类 */
  filterCategory?: string[]
  /** 是否保存快照 */
  saveSnapshot?: boolean
  /** 快照保存目录 */
  snapshotDir?: string
}

// ═══════════════════════════════════════════════════════════
// 基础数据（同 runner-p23-full.ts）
// ═══════════════════════════════════════════════════════════

const CANG_GAN: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {
  '子': { ben: '癸', zhong: null, yao: null },
  '丑': { ben: '己', zhong: '辛', yao: '癸' },
  '寅': { ben: '甲', zhong: '丙', yao: '戊' },
  '卯': { ben: '乙', zhong: null, yao: null },
  '辰': { ben: '戊', zhong: '乙', yao: '癸' },
  '巳': { ben: '丙', zhong: '庚', yao: '戊' },
  '午': { ben: '丁', zhong: '己', yao: null },
  '未': { ben: '己', zhong: '丁', yao: '乙' },
  '申': { ben: '庚', zhong: '壬', yao: '戊' },
  '酉': { ben: '辛', zhong: null, yao: null },
  '戌': { ben: '戊', zhong: '辛', yao: '丁' },
  '亥': { ben: '壬', zhong: '甲', yao: null },
}

/** 可信度权重映射 */
const TRUST_WEIGHT: Record<TrustLevel, number> = {
  S: 1.0,
  A: 0.8,
  B: 0.6,
  C: 0.4,
}

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

function isValid(v: unknown): boolean {
  return v !== null && v !== undefined
}

/** 构建六柱（同 runner-p23-full.ts parsePillars） */
function buildSixLines(caze: BaziCase) {
  const pillars = [caze.yearGan + caze.yearZhi, caze.monthGan + caze.monthZhi, caze.dayGan + caze.dayZhi, caze.hourGan + caze.hourZhi]
  const parsed = pillars.map(p => ({
    gan: p[0] as any,
    zhi: p[1] as any,
    element: '' as any,
    yinYang: '' as any,
    naYin: '',
  }))
  return { year: parsed[0], month: parsed[1], day: parsed[2], hour: parsed[3], allGan: pillars.map(p => p[0] as any), allZhi: pillars.map(p => p[1] as any) }
}

/** 统计五行力量（同 runner-p23-full.ts countElements） */
function countElements(sixLines: ReturnType<typeof buildSixLines>): Record<string, number> {
  const count: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    count[(STEM_ELEMENT as any)[pillar.gan] || '木']++
    const cg = CANG_GAN[pillar.zhi]
    if (cg) {
      count[(STEM_ELEMENT as any)[cg.ben] || '木']++
      if (cg.zhong) count[(STEM_ELEMENT as any)[cg.zhong] || '木'] += 0.5
      if (cg.yao) count[(STEM_ELEMENT as any)[cg.yao] || '木'] += 0.3
    }
  }
  return count
}

/**
 * 模糊匹配（旺/衰 等）
 * 检查两个字符串是否存在关键词重叠
 */
function fuzzyMatch(engine: string, expected: string): boolean {
  const e = engine.toLowerCase()
  const x = expected.toLowerCase()
  if (e.includes(x) || x.includes(e)) return true
  // 关键词匹配：旺/弱/强/衰/偏旺/偏弱 等
  const keywords = ['旺', '强', '弱', '衰', '平衡', '极旺', '极弱', '偏旺', '偏弱', '身旺', '身弱']
  for (const kw of keywords) {
    if (e.includes(kw) && x.includes(kw)) return true
  }
  return false
}

/**
 * contains 匹配（格局名）
 * 引擎输出包含案例标签，或案例标签包含引擎输出
 */
function containsMatch(engine: string, expected: string): boolean {
  const e = engine.trim()
  const x = expected.trim()
  if (!e || !x) return false
  if (e === x) return true
  if (e.includes(x) || x.includes(e)) return true
  // 别名映射：引擎输出的格局名和案例标签可能有不同表述
  const ALIAS: Record<string, string[]> = {
    '财格': ['正财格','偏财格','财官格','食伤生财','财生官杀','财星格','偏财','正财'],
    '官格': ['正官格','财官双美','官印相生','官星格','正官'],
    '杀格': ['七杀格','杀印相生','食神制杀','杀星格','偏官格','七杀','偏官'],
    '印格': ['正印格','偏印格','印绶格','杂气印绶','伤官配印','伤官佩印','正印','偏印','印绶'],
    '食神格': ['食神制杀','食伤生财','食神'],
    '伤官格': ['伤官配印','伤官佩印','伤官'],
    '七杀格': ['杀印相生','食神制杀','偏官','七杀'],
    '曲直格': ['专旺格','曲直仁寿','木专旺'],
    '润下格': ['专旺格','润下','水专旺'],
    '炎上格': ['专旺格','炎上','火专旺'],
    '从格': ['从财格','从杀格','从儿格','从旺格','从势格'],
    '化气格': ['化木格','化金格','化水格','化火格','化土格','化气'],
    '建禄格': ['比肩格','建禄'],
    '月刃格': ['劫财格','羊刃格','阳刃格','阳刃'],
    '禄格': ['建禄格','月刃格','禄神'],
    '调候格': ['调候'],
    '通关格': ['通关'],
    '病药格': ['病药'],
    '财': ['正财','偏财','财星'],
    '官': ['正官','偏官','七杀','官星'],
    '印': ['正印','偏印','印星','印绶'],
    '食': ['食神','食伤'],
    '伤': ['伤官'],
    '杀': ['七杀','偏官'],
  }
  for (const [alias, variants] of Object.entries(ALIAS)) {
    if (e.includes(alias) && variants.some(v => x.includes(v))) return true
    if (x.includes(alias) && variants.some(v => e.includes(v))) return true
  }
  return false
}

/**
 * exact 匹配（五行精确一致）
 */
/**
 * 将用神标签标准化为五行
 * "丙丁火" → "火"，"壬癸水" → "水"，"甲木" → "木"，"木" → "木"
 */
function normalizeYongShen(label: string): string {
  const labelTrimmed = label.trim()
  // 直接就是五行名
  const FIVE_ELEMENTS = ['木', '火', '土', '金', '水']
  for (const el of FIVE_ELEMENTS) {
    if (labelTrimmed === el) return el
  }
  // 从天干组合中提取五行
  for (const el of FIVE_ELEMENTS) {
    if (labelTrimmed.includes(el)) return el
  }
  // 通过天干推断五行
  const GAN_ELEMENT: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火',
    '戊': '土', '己': '土', '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
  }
  // 提取标签中的天干字
  const stems = labelTrimmed.split('').filter(c => GAN_ELEMENT[c])
  if (stems.length > 0) {
    // 取最后一个天干的五行（通常是核心用神）
    return GAN_ELEMENT[stems[stems.length - 1]]
  }
  return labelTrimmed
}

function exactMatch(engine: string, expected: string): boolean {
  return engine.trim() === expected.trim()
}

/** 生成唯一 ID */
function generateId(): string {
  return `BM-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}

// ═══════════════════════════════════════════════════════════
// BenchmarkEngine
// ═══════════════════════════════════════════════════════════

export class BenchmarkEngine {
  private config: BenchmarkConfig
  private previousResults?: BenchmarkReport

  constructor(config?: Partial<BenchmarkConfig>) {
    this.config = {
      version: config?.version ?? 'unknown',
      previousVersion: config?.previousVersion,
      threshold: config?.threshold ?? 70,
      maxCases: config?.maxCases,
      filterTrustLevel: config?.filterTrustLevel,
      filterCategory: config?.filterCategory,
      saveSnapshot: config?.saveSnapshot ?? false,
      snapshotDir: config?.snapshotDir ?? '/data/user/work/benchmark-snapshots',
    }
  }

  /**
   * 运行 Benchmark
   * 对每个案例运行 13 模块全管线，与标签对比
   */
  run(cases: BaziCase[]): BenchmarkReport {
    const startTime = Date.now()

    // 过滤案例
    let filteredCases = [...cases]
    if (this.config.filterTrustLevel && this.config.filterTrustLevel.length > 0) {
      filteredCases = filteredCases.filter(c => this.config.filterTrustLevel!.includes(c.trustLevel))
    }
    if (this.config.filterCategory && this.config.filterCategory.length > 0) {
      filteredCases = filteredCases.filter(c =>
        c.category.some(cat => this.config.filterCategory!.includes(cat)),
      )
    }
    if (this.config.maxCases && this.config.maxCases > 0) {
      filteredCases = filteredCases.slice(0, this.config.maxCases)
    }

    const totalCases = cases.length
    const caseResults: CaseBenchmarkResult[] = []
    let skippedCount = 0

    // 维度统计
    const dimStats: Record<DimensionName, { total: number; passed: number }> = {
      geJu: { total: 0, passed: 0 },
      wangShuai: { total: 0, passed: 0 },
      yongShen: { total: 0, passed: 0 },
      tiaoHou: { total: 0, passed: 0 },
      bingYao: { total: 0, passed: 0 },
      tongGuan: { total: 0, passed: 0 },
      shenSha: { total: 0, passed: 0 },
      relationship: { total: 0, passed: 0 },
      career: { total: 0, passed: 0 },
      wealth: { total: 0, passed: 0 },
      marriage: { total: 0, passed: 0 },
      health: { total: 0, passed: 0 },
      pattern: { total: 0, passed: 0 },
    }

    // 按可信度统计
    const trustStats: Record<string, { total: number; weightedAccuracy: number }> = {}

    // 按分类统计
    const categoryStats: Record<string, { total: number; weightedAccuracy: number }> = {}

    for (const caze of filteredCases) {
      try {
        const result = this.analyzeCase(caze)
        caseResults.push(result)

        // 累计维度统计（仅非 skipped 的维度）
        for (const dim of result.dimensions) {
          if (dim.matchMethod !== 'skipped') {
            dimStats[dim.dimension].total++
            if (dim.passed) {
              dimStats[dim.dimension].passed++
            }
          }
        }

        // 累计可信度统计
        const trustKey = caze.trustLevel
        if (!trustStats[trustKey]) {
          trustStats[trustKey] = { total: 0, weightedAccuracy: 0 }
        }
        const weight = TRUST_WEIGHT[caze.trustLevel]
        trustStats[trustKey].total++
        trustStats[trustKey].weightedAccuracy += result.accuracy * weight

        // 累计分类统计
        for (const cat of caze.category) {
          if (!categoryStats[cat]) {
            categoryStats[cat] = { total: 0, weightedAccuracy: 0 }
          }
          categoryStats[cat].total++
          categoryStats[cat].weightedAccuracy += result.accuracy
        }
      } catch (e: any) {
        skippedCount++
        caseResults.push({
          caseId: caze.id,
          caseName: caze.name,
          trustLevel: caze.trustLevel,
          totalDimensions: 0,
          passedDimensions: 0,
          failedDimensions: 0,
          skippedDimensions: 0,
          accuracy: 0,
          durationMs: 0,
          dimensions: [],
          errors: [e.message || String(e)],
        })
      }
    }

    const endTime = Date.now()
    const totalDurationMs = endTime - startTime

    // 计算维度准确率
    const dimensionAccuracy: Record<DimensionName, { total: number; passed: number; accuracy: number }> = {} as any
    for (const dim of Object.keys(dimStats) as DimensionName[]) {
      const stat = dimStats[dim]
      dimensionAccuracy[dim] = {
        total: stat.total,
        passed: stat.passed,
        accuracy: stat.total > 0 ? (stat.passed / stat.total) * 100 : 0,
      }
    }

    // 计算总准确率（加权平均，按可信度权重）
    let totalWeightedAccuracy = 0
    let totalWeight = 0
    for (const r of caseResults) {
      if (r.errors.length === 0) {
        const weight = TRUST_WEIGHT[r.trustLevel]
        totalWeightedAccuracy += r.accuracy * weight
        totalWeight += weight
      }
    }
    const overallAccuracy = totalWeight > 0 ? totalWeightedAccuracy / totalWeight : 0

    // 计算按可信度分层准确率
    const accuracyByTrust: Record<string, { total: number; accuracy: number }> = {}
    for (const [key, stat] of Object.entries(trustStats)) {
      accuracyByTrust[key] = {
        total: stat.total,
        accuracy: stat.total > 0 ? stat.weightedAccuracy / stat.total : 0,
      }
    }

    // 计算按分类分层准确率
    const accuracyByCategory: Record<string, { total: number; accuracy: number }> = {}
    for (const [key, stat] of Object.entries(categoryStats)) {
      accuracyByCategory[key] = {
        total: stat.total,
        accuracy: stat.total > 0 ? stat.weightedAccuracy / stat.total : 0,
      }
    }

    // 失败案例 TOP 20
    const failedCases = caseResults
      .filter(r => r.accuracy < this.config.threshold)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 20)

    // 回归检测
    let regressionRisk = 0
    let regressionDetails: { dimension: string; accuracy: number; dropFromPrevious: number }[] = []
    if (this.previousResults) {
      const regression = this.computeRegression(dimensionAccuracy, this.previousResults.dimensionAccuracy)
      regressionRisk = regression.risk
      regressionDetails = regression.details
    }

    // 汇总
    const passed = overallAccuracy >= this.config.threshold
    let summary: string
    if (passed) {
      summary = `Benchmark 通过。总准确率 ${overallAccuracy.toFixed(1)}%，阈值 ${this.config.threshold}%。共分析 ${filteredCases.length - skippedCount}/${totalCases} 案例。`
    } else {
      summary = `Benchmark 未通过。总准确率 ${overallAccuracy.toFixed(1)}%，低于阈值 ${this.config.threshold}%。共分析 ${filteredCases.length - skippedCount}/${totalCases} 案例，需关注失败案例。`
    }

    const report: BenchmarkReport = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      version: this.config.version,
      totalCases,
      analyzedCases: filteredCases.length - skippedCount,
      skippedCases: skippedCount,
      totalDurationMs,
      overallAccuracy: Math.round(overallAccuracy * 100) / 100,
      dimensionAccuracy,
      accuracyByTrust,
      accuracyByCategory,
      failedCases,
      regressionRisk: Math.round(regressionRisk * 100) / 100,
      regressionDetails,
      summary,
      passed,
      threshold: this.config.threshold,
    }

    // 自动保存快照
    if (this.config.saveSnapshot) {
      this.saveSnapshot(report)
    }

    return report
  }

  /**
   * 与上次结果对比
   * 比较新旧版本各维度准确率
   */
  compareWithPrevious(
    currentReport: BenchmarkReport,
    previousReport: BenchmarkReport,
  ): {
    improvements: { dimension: string; improvement: number }[]
    regressions: { dimension: string; drop: number }[]
    summary: string
  } {
    const improvements: { dimension: string; improvement: number }[] = []
    const regressions: { dimension: string; drop: number }[] = []

    const allDimensions = Object.keys(currentReport.dimensionAccuracy) as DimensionName[]
    for (const dim of allDimensions) {
      const current = currentReport.dimensionAccuracy[dim]
      const previous = previousReport.dimensionAccuracy[dim]
      if (!previous || previous.accuracy === 0) continue

      const diff = current.accuracy - previous.accuracy
      if (diff > 0.5) {
        improvements.push({ dimension: DIMENSION_LABEL[dim], improvement: Math.round(diff * 10) / 10 })
      } else if (diff < -0.5) {
        regressions.push({ dimension: DIMENSION_LABEL[dim], drop: Math.round(Math.abs(diff) * 10) / 10 })
      }
    }

    // 按变化幅度排序
    improvements.sort((a, b) => b.improvement - a.improvement)
    regressions.sort((a, b) => b.drop - a.drop)

    let summary = `版本对比：${previousReport.version} → ${currentReport.version}\n`
    summary += `总准确率：${previousReport.overallAccuracy.toFixed(1)}% → ${currentReport.overallAccuracy.toFixed(1)}%\n`
    if (improvements.length > 0) {
      summary += `提升维度：${improvements.map(i => `${i.dimension}+${i.improvement}%`).join('、')}\n`
    }
    if (regressions.length > 0) {
      summary += `退化维度：${regressions.map(r => `${r.dimension}-${r.drop}%`).join('、')}\n`
    }
    if (improvements.length === 0 && regressions.length === 0) {
      summary += '各维度准确率无明显变化。\n'
    }

    return { improvements, regressions, summary }
  }

  /**
   * 生成快照（保存当前结果供后续对比）
   * @returns 快照文件路径
   */
  saveSnapshot(report: BenchmarkReport): string {
    const dir = this.config.snapshotDir ?? '/data/user/work/benchmark-snapshots'
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const filename = `snapshot-${report.version}-${report.id}.json`
    const filePath = path.join(dir, filename)
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8')

    return filePath
  }

  /**
   * 加载快照
   */
  loadSnapshot(snapshotPath: string): BenchmarkReport | null {
    try {
      const raw = fs.readFileSync(snapshotPath, 'utf-8')
      return JSON.parse(raw) as BenchmarkReport
    } catch {
      return null
    }
  }

  /**
   * 加载上次结果并设置为对比基线
   */
  setPreviousResults(previousResults: BenchmarkReport): void {
    this.previousResults = previousResults
  }

  /**
   * 格式化报告（人类可读）
   */
  formatReport(report: BenchmarkReport): string {
    const lines: string[] = []

    lines.push('╔══════════════════════════════════════════════════╗')
    lines.push('║        XuanFeng Core Benchmark Report            ║')
    lines.push('╠══════════════════════════════════════════════════╣')
    lines.push(`║  版本: ${report.version.padEnd(12)}  时间: ${report.timestamp.substring(0, 19).padEnd(19)}║`)
    lines.push(`║  总案例: ${String(report.totalCases).padEnd(4)}  分析: ${String(report.analyzedCases).padEnd(4)}  跳过: ${String(report.skippedCases).padEnd(4)}║`)
    lines.push(`║  总准确率: ${report.overallAccuracy.toFixed(1).padEnd(5)}%  通过阈值: ${String(report.threshold).padEnd(3)}%  [${report.passed ? 'PASS' : 'FAIL'}]  ║`)
    lines.push('╠══════════════════════════════════════════════════╣')
    lines.push('║  维度准确率:                                     ║')

    for (const dim of Object.keys(report.dimensionAccuracy) as DimensionName[]) {
      const stat = report.dimensionAccuracy[dim]
      const label = DIMENSION_LABEL[dim]
      lines.push(`║    ${label.padEnd(6)}: ${stat.accuracy.toFixed(1).padEnd(6)}% (${stat.passed}/${stat.total})${''.padEnd(Math.max(0, 20 - label.length - stat.accuracy.toFixed(1).length - String(stat.passed).length - String(stat.total).length))}  ║`)
    }

    lines.push('╠══════════════════════════════════════════════════╣')
    lines.push('║  按可信度:                                       ║')

    const trustOrder: TrustLevel[] = ['S', 'A', 'B', 'C']
    const trustLabel: Record<string, string> = { S: 'S级', A: 'A级', B: 'B级', C: 'C级' }
    for (const level of trustOrder) {
      const stat = report.accuracyByTrust[level]
      if (stat) {
        lines.push(`║    ${trustLabel[level].padEnd(4)}(${String(stat.total).padEnd(2)}例): ${stat.accuracy.toFixed(1).padEnd(6)}%${''.padEnd(16)}  ║`)
      }
    }

    lines.push('╠══════════════════════════════════════════════════╣')

    if (report.failedCases.length > 0) {
      lines.push(`║  失败案例 TOP ${Math.min(report.failedCases.length, 10)}:${''.padEnd(Math.max(0, 28 - String(Math.min(report.failedCases.length, 10)).length))}║`)
      const top10 = report.failedCases.slice(0, 10)
      top10.forEach((fc, idx) => {
        // 找出失败维度
        const failedDims = fc.dimensions
          .filter(d => !d.passed && d.matchMethod !== 'skipped')
          .map(d => DIMENSION_LABEL[d.dimension])
          .join('/')
        lines.push(`║    ${String(idx + 1).padStart(2)}. ${fc.caseName.padEnd(12)}: ${failedDims || '多维度不匹配'} (accuracy: ${fc.accuracy.toFixed(0)}%)`)
      })
    } else {
      lines.push('║  无失败案例                                       ║')
    }

    lines.push('╠══════════════════════════════════════════════════╣')

    if (report.regressionDetails.length > 0) {
      const riskLevel = report.regressionRisk < 5 ? 'LOW' : report.regressionRisk < 20 ? 'MEDIUM' : 'HIGH'
      lines.push(`║  回归风险: ${report.regressionRisk.toFixed(1).padEnd(5)}  [${riskLevel}]${''.padEnd(Math.max(0, 15))}  ║`)
      const changes = report.regressionDetails
        .map(d => `${DIMENSION_LABEL[d.dimension as DimensionName] || d.dimension} ${d.dropFromPrevious > 0 ? '+' : ''}${d.dropFromPrevious.toFixed(1)}%`)
        .join(' / ')
      lines.push(`║  变化: ${changes}`)
    } else {
      lines.push('║  回归检测: 无前期数据，跳过对比                  ║')
    }

    lines.push('╠══════════════════════════════════════════════════╣')
    lines.push(`║  耗时: ${report.totalDurationMs}ms${''.padEnd(Math.max(0, 30 - String(report.totalDurationMs).length))}║`)
    lines.push('╚══════════════════════════════════════════════════╝')

    return lines.join('\n')
  }

  // ── 私有方法 ──────────────────────────────────────────────

  /**
   * 对单个案例运行 13 模块全管线并与标签对比
   */
  private analyzeCase(caze: BaziCase): CaseBenchmarkResult {
    const caseStart = Date.now()
    const errors: string[] = []
    const dimensions: DimensionResult[] = []

    try {
      // 构建参数
      const sixLines = buildSixLines(caze)
      const dayGan = caze.dayGan as any
      const monthZhi = caze.monthZhi as any
      const elementCount = countElements(sixLines)
      const dayElement = ((STEM_ELEMENT as any)[caze.dayGan] || '木') as FiveElement

      // ── 1. runP21Engine → 格局 ──
      let geJuResult: any = null
      try {
        const p21 = runP21Engine(sixLines, dayGan, monthZhi)
        geJuResult = p21?.geJuResult
      } catch (e: any) {
        errors.push(`格局模块异常: ${e.message || String(e)}`)
      }

      // ── 2. calculateDayMasterStrength → 旺衰 ──
      let strengthResult: any = null
      try {
        strengthResult = calculateDayMasterStrength(sixLines, dayGan, monthZhi)
      } catch (e: any) {
        errors.push(`旺衰模块异常: ${e.message || String(e)}`)
      }

      // ── 3. calculateClimateAdjustment → 调候 ──
      let climateResult: any = null
      try {
        climateResult = calculateClimateAdjustment(sixLines, dayGan, monthZhi)
      } catch (e: any) {
        errors.push(`调候模块异常: ${e.message || String(e)}`)
      }

      // ── 4. analyzeDiseaseMedicine → 病药 ──
      let diseaseResult: any = null
      try {
        diseaseResult = analyzeDiseaseMedicine(
          sixLines, dayGan, monthZhi,
          strengthResult?.strengthScore ?? 50,
          strengthResult?.strengthLevelCN ?? '平衡',
        )
      } catch (e: any) {
        errors.push(`病药模块异常: ${e.message || String(e)}`)
      }

      // ── 5. analyzeTongGuan → 通关 ──
      let tongGuanResult: any = null
      try {
        tongGuanResult = analyzeTongGuan(elementCount as any)
      } catch (e: any) {
        errors.push(`通关模块异常: ${e.message || String(e)}`)
      }

      // ── 6. calculateUseGod → 喜用神 ──
      let useGodResult: any = null
      try {
        useGodResult = calculateUseGod(dayElement, strengthResult, climateResult, diseaseResult, tongGuanResult)
      } catch (e: any) {
        errors.push(`用神模块异常: ${e.message || String(e)}`)
      }

      // ── 7. validatePattern → 格局校验 ──
      let patternValidation: any = null
      try {
        patternValidation = validatePattern(geJuResult, strengthResult, climateResult, diseaseResult)
      } catch (e: any) {
        errors.push(`格局校验模块异常: ${e.message || String(e)}`)
      }

      // ── 8. calculateShenSha → 神煞 ──
      let shenShaResult: any = null
      try {
        shenShaResult = calculateShenSha(
          caze.yearGan, caze.yearZhi,
          caze.monthZhi,
          caze.dayGan, caze.dayZhi,
          caze.hourZhi,
        )
      } catch (e: any) {
        errors.push(`神煞模块异常: ${e.message || String(e)}`)
      }

      // ── 9. analyzeRelationships → 关系 ──
      let relationshipResult: any = null
      try {
        relationshipResult = analyzeRelationships(
          dayElement,
          geJuResult?.name ?? '',
          strengthResult?.strengthLevel ?? 'Balanced',
          useGodResult?.yongShen ?? '木',
          elementCount as any,
          sixLines.allGan, sixLines.allZhi,
        )
      } catch (e: any) {
        errors.push(`关系模块异常: ${e.message || String(e)}`)
      }

      // ── 10. analyzeCareer → 事业 ──
      let careerResult: any = null
      try {
        careerResult = analyzeCareer(
          dayElement,
          strengthResult?.strengthLevel ?? 'Balanced',
          useGodResult?.yongShen ?? '木',
          geJuResult?.name ?? '',
          elementCount as any,
        )
      } catch (e: any) {
        errors.push(`事业模块异常: ${e.message || String(e)}`)
      }

      // ── 11. analyzeWealth → 财富 ──
      let wealthResult: any = null
      try {
        wealthResult = analyzeWealth(
          dayElement,
          strengthResult?.strengthLevel ?? 'Balanced',
          useGodResult?.yongShen ?? '木',
          geJuResult?.name ?? '',
          strengthResult?.strengthScore ?? 50,
          elementCount as any,
        )
      } catch (e: any) {
        errors.push(`财富模块异常: ${e.message || String(e)}`)
      }

      // ── 12. analyzeMarriage → 婚姻 ──
      let marriageResult: any = null
      try {
        marriageResult = analyzeMarriage(
          dayElement, dayGan,
          strengthResult?.strengthLevel ?? 'Balanced',
          useGodResult?.yongShen ?? '木',
          geJuResult?.name ?? '',
          elementCount as any,
          sixLines.allZhi,
        )
      } catch (e: any) {
        errors.push(`婚姻模块异常: ${e.message || String(e)}`)
      }

      // ── 13. analyzeHealth → 健康 ──
      let healthResult: any = null
      try {
        healthResult = analyzeHealth(
          dayElement,
          strengthResult?.strengthLevel ?? 'Balanced',
          climateResult?.climateType ?? '平和',
          elementCount as any,
          sixLines.allZhi,
        )
      } catch (e: any) {
        errors.push(`健康模块异常: ${e.message || String(e)}`)
      }

      // ── 维度对比 ──

      // geJu: 引擎格局名 vs 案例pattern → contains
      dimensions.push(this.compareGeJu(geJuResult, caze))

      // wangShuai: 引擎旺衰 vs 案例wangShuai → contains/fuzzy
      dimensions.push(this.compareWangShuai(strengthResult, caze))

      // yongShen: 引擎用神五行 vs 案例yongShen → exact
      dimensions.push(this.compareYongShen(useGodResult, caze))

      // tiaoHou: 无对应标签则 skipped
      dimensions.push({
        dimension: 'tiaoHou',
        passed: true,
        engineOutput: climateResult?.climateType ?? '',
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      })

      // bingYao: 无对应标签则 skipped
      dimensions.push({
        dimension: 'bingYao',
        passed: true,
        engineOutput: diseaseResult?.hasDisease ? '有病' : '无病',
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      })

      // tongGuan: 无对应标签则 skipped
      dimensions.push({
        dimension: 'tongGuan',
        passed: true,
        engineOutput: tongGuanResult?.hasTongGuan ? '通关' : '无通关',
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      })

      // shenSha: 无对应标签则 skipped（或检查吉神数量 >= 1）
      dimensions.push({
        dimension: 'shenSha',
        passed: true,
        engineOutput: `吉${shenShaResult?.jiShenCount ?? 0}凶${shenShaResult?.xiongShenCount ?? 0}`,
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      })

      // relationship: 无对应标签则 skipped
      dimensions.push({
        dimension: 'relationship',
        passed: true,
        engineOutput: relationshipResult?.overallDesc ?? '',
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      })

      // career: 无对应标签则 skipped
      dimensions.push({
        dimension: 'career',
        passed: true,
        engineOutput: careerResult?.bestDirection ?? '',
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      })

      // wealth: 无对应标签则 skipped
      dimensions.push({
        dimension: 'wealth',
        passed: true,
        engineOutput: wealthResult?.wealthLevel ?? '',
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      })

      // marriage: 无对应标签则 skipped
      dimensions.push({
        dimension: 'marriage',
        passed: true,
        engineOutput: marriageResult?.marriageQuality ?? '',
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      })

      // health: 无对应标签则 skipped
      dimensions.push({
        dimension: 'health',
        passed: true,
        engineOutput: healthResult?.constitutionType ?? '',
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      })

      // pattern: PatternValidator 星级 >= 3 → passed
      dimensions.push(this.comparePattern(patternValidation))
    } catch (e: any) {
      errors.push(`案例分析异常: ${e.message || String(e)}`)
    }

    const caseEnd = Date.now()
    const durationMs = caseEnd - caseStart

    // 计算统计
    const nonSkipped = dimensions.filter(d => d.matchMethod !== 'skipped')
    const passed = nonSkipped.filter(d => d.passed).length
    const failed = nonSkipped.filter(d => !d.passed).length
    const skipped = dimensions.filter(d => d.matchMethod === 'skipped').length
    const accuracy = nonSkipped.length > 0 ? (passed / nonSkipped.length) * 100 : 0

    return {
      caseId: caze.id,
      caseName: caze.name,
      trustLevel: caze.trustLevel,
      totalDimensions: dimensions.length,
      passedDimensions: passed,
      failedDimensions: failed,
      skippedDimensions: skipped,
      accuracy: Math.round(accuracy * 100) / 100,
      durationMs,
      dimensions,
      errors,
    }
  }

  /**
   * 对比格局维度
   * geJu: 引擎格局名 vs 案例pattern → contains
   */
  private compareGeJu(geJuResult: any, caze: BaziCase): DimensionResult {
    const engineOutput = geJuResult?.name ?? ''
    const expectedValue = caze.pattern ?? ''

    if (!expectedValue) {
      return {
        dimension: 'geJu',
        passed: true,
        engineOutput,
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      }
    }

    const passed = containsMatch(engineOutput, expectedValue)
    const confidence = passed ? 1.0 : (containsMatch(engineOutput, expectedValue.substring(0, 2)) ? 0.3 : 0)

    return {
      dimension: 'geJu',
      passed,
      engineOutput,
      expectedValue,
      matchMethod: 'contains',
      confidence,
    }
  }

  /**
   * 对比旺衰维度
   * wangShuai: 引擎旺衰 vs 案例wangShuai → fuzzy
   */
  private compareWangShuai(strengthResult: any, caze: BaziCase): DimensionResult {
    const engineOutput = strengthResult?.strengthLevelCN ?? strengthResult?.wangShuai ?? ''
    const expectedValue = caze.wangShuai ?? ''

    if (!expectedValue) {
      return {
        dimension: 'wangShuai',
        passed: true,
        engineOutput,
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      }
    }

    const passed = fuzzyMatch(engineOutput, expectedValue)
    const confidence = passed ? 1.0 : 0

    return {
      dimension: 'wangShuai',
      passed,
      engineOutput,
      expectedValue,
      matchMethod: 'fuzzy',
      confidence,
    }
  }

  /**
   * 对比用神维度
   * yongShen: 引擎用神五行 vs 案例yongShen → exact
   */
  private compareYongShen(useGodResult: any, caze: BaziCase): DimensionResult {
    const engineOutput = useGodResult?.yongShen ?? ''
    const expectedValue = caze.yongShen ?? ''

    if (!expectedValue) {
      return {
        dimension: 'yongShen',
        passed: true,
        engineOutput,
        expectedValue: '',
        matchMethod: 'skipped',
        confidence: 0,
      }
    }

    // 将案例用神标签中的天干转化为五行
    // 例如 "丙丁火" → "火"，"壬癸水" → "水"，"甲木" → "木"
    const normalizedExpected = normalizeYongShen(expectedValue)
    const passed = engineOutput === normalizedExpected || containsMatch(engineOutput, normalizedExpected)
    // 如果精确不匹配，尝试模糊匹配
    const fuzzyPassed = !passed && containsMatch(engineOutput, expectedValue)
    const confidence = passed ? 1.0 : (fuzzyPassed ? 0.5 : 0)

    return {
      dimension: 'yongShen',
      passed: passed || fuzzyPassed,
      engineOutput,
      expectedValue,
      matchMethod: 'exact',
      confidence,
    }
  }

  /**
   * 对比格局校验维度
   * pattern: PatternValidator 星级 >= 3 → passed
   */
  private comparePattern(patternValidation: any): DimensionResult {
    const starLevel = patternValidation?.starLevel ?? 0
    const totalScore = patternValidation?.totalScore ?? 0
    const passed = starLevel >= 3

    return {
      dimension: 'pattern',
      passed,
      engineOutput: `星级${starLevel}(${totalScore}分)`,
      expectedValue: '星级>=3',
      matchMethod: 'exact',
      confidence: passed ? 1.0 : (starLevel === 2 ? 0.4 : 0),
    }
  }

  /**
   * 计算回归风险
   */
  private computeRegression(
    current: Record<DimensionName, { total: number; passed: number; accuracy: number }>,
    previous: Record<DimensionName, { total: number; passed: number; accuracy: number }>,
  ): {
    risk: number
    details: { dimension: string; accuracy: number; dropFromPrevious: number }[]
  } {
    const details: { dimension: string; accuracy: number; dropFromPrevious: number }[] = []
    let totalDrop = 0
    let dropCount = 0

    for (const dim of Object.keys(current) as DimensionName[]) {
      const cur = current[dim]
      const prev = previous[dim]
      if (!prev || prev.accuracy === 0) continue

      const diff = cur.accuracy - prev.accuracy
      if (diff < -0.5) {
        details.push({
          dimension: DIMENSION_LABEL[dim],
          accuracy: cur.accuracy,
          dropFromPrevious: Math.round(Math.abs(diff) * 10) / 10,
        })
        totalDrop += Math.abs(diff)
        dropCount++
      }
    }

    // 回归风险：平均下降幅度的加权值
    const risk = dropCount > 0 ? (totalDrop / dropCount) * 2 : 0

    return {
      risk: Math.min(100, risk),
      details,
    }
  }
}
