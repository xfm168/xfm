/**
 * QualityMonitor — P3.14 质量监控引擎
 *
 * 纯 Plugin，不修改 Kernel。
 * 统一采集命盘分析过程的各项质量指标，输出 ECharts 兼容的可视化数据结构，
 * 生成中文质量报告，帮助开发者实时掌握系统健康状态。
 *
 * 核心指标（10项）：
 *   1. 平均耗时（performance）
 *   2. Explain 平均长度（explain）
 *   3. 古籍引用数（classical）
 *   4. 案例命中率（case）
 *   5. 案例平均相似度（case）
 *   6. 一致性评分（consistency）
 *   7. Benchmark 准确率（benchmark）
 *   8. 推理步骤数（explain）
 *   9. 规则匹配数（coverage）
 *  10. 准确率变化（accuracy）
 *
 * 可视化输出：
 *   - 3 个趋势图（耗时 / Benchmark / 综合评分）
 *   - 2 个饼图（指标状态分布 / 问题类别分布）
 *   - 1 个统计表格
 *   - 1 份中文质量报告
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 从数组中随机选取一个元素 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 从数组中随机选取 N 个不重复元素 */
function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr]
  const result: T[] = []
  for (let i = 0; i < Math.min(n, copy.length); i++) {
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

/** 生成唯一ID */
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

/** 格式化时间 */
function formatTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 计算数组平均值（空数组返回 0） */
function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

/** 安全除法，分母为零返回 0 */
function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b
}

/** 保留两位小数 */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** 保留一位小数 */
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 质量指标类别 */
export type QualityCategory =
  | 'performance'     // 性能
  | 'accuracy'        // 准确率
  | 'consistency'     // 一致性
  | 'coverage'        // 覆盖度
  | 'classical'       // 古籍引用
  | 'explain'         // Explain质量
  | 'case'            // 案例匹配
  | 'benchmark'       // Benchmark
  | 'learning'        // 学习系统

/** 趋势方向 */
export type TrendDirection = 'up' | 'down' | 'stable'

/** 单个指标数据点 */
export interface MetricPoint {
  /** 时间标签，如 "2026-07-11 14:30" 或 "#42" */
  label: string
  /** 数值 */
  value: number
}

/** 单个质量指标 */
export interface QualityMetric {
  /** 指标ID */
  id: string
  /** 指标名称 */
  name: string
  /** 类别 */
  category: QualityCategory
  /** 当前值 */
  current: number
  /** 单位 */
  unit: string
  /** 目标值（理想值） */
  target: number
  /** 警戒线 */
  threshold: number
  /** 趋势方向 */
  trend: TrendDirection
  /** 变化率 */
  changeRate: number
  /** 历史数据 */
  history: MetricPoint[]
  /** 状态 */
  status: 'good' | 'warning' | 'critical'
}

/** 分析结果摘要 */
export interface AnalysisSummary {
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical'
  suggestion: string
}

/** 趋势图数据（ECharts 兼容） */
export interface TrendChartData {
  id: string
  title: string
  xLabels: string[]
  series: Array<{
    name: string
    data: number[]
  }>
}

/** 饼图数据（ECharts 兼容） */
export interface PieChartData {
  id: string
  title: string
  data: Array<{
    name: string
    value: number
  }>
}

/** 统计表格 */
export interface StatsTableData {
  headers: string[]
  rows: Array<{
    name: string
    values: (string | number)[]
  }>
}

/** 质量仪表盘完整结果 */
export interface QualityDashboard {
  /** 生成时间 */
  generatedAt: string
  /** 所有指标 */
  metrics: QualityMetric[]
  /** 按类别分组 */
  byCategory: Record<QualityCategory, QualityMetric[]>
  /** 综合评分 0-100 */
  overallScore: number
  /** 分析摘要 */
  analysis: AnalysisSummary[]
  /** 趋势图数据（ECharts兼容） */
  trendCharts: TrendChartData[]
  /** 饼图数据（ECharts兼容） */
  pieCharts: PieChartData[]
  /** 统计表格数据 */
  statsTable: StatsTableData
  /** 报告文本 */
  report: string
}

/** 质量记录（单次分析的记录） */
export interface QualityRecord {
  id: string
  timestamp: string
  /** 命盘标识 */
  chartId?: string
  /** 分析耗时(ms) */
  duration: number
  /** Explain长度(字符数) */
  explainLength: number
  /** 引用古籍数量 */
  classicalRefCount: number
  /** 相似案例命中数 */
  caseHitCount: number
  /** 相似案例最高相似度 */
  caseTopSimilarity: number
  /** 一致性评分 */
  consistencyScore: number
  /** Benchmark准确率 */
  benchmarkAccuracy: number
  /** 推理步骤数 */
  reasoningSteps: number
  /** 规则匹配数 */
  ruleMatchCount: number
  /** 修正推荐数 */
  learningRecommendCount: number
}

/** 质量监控配置 */
export interface QualityMonitorConfig {
  /** 保留最大历史记录数 */
  maxHistory: number
  /** 综合评分权重 */
  weights: {
    performance: number
    accuracy: number
    consistency: number
    coverage: number
    classical: number
  }
}

// ═══════════════════════════════════════════════════════════
// 默认配置
// ═══════════════════════════════════════════════════════════

const DEFAULT_CONFIG: QualityMonitorConfig = {
  maxHistory: 500,
  weights: {
    performance: 0.20,
    accuracy: 0.25,
    consistency: 0.25,
    coverage: 0.15,
    classical: 0.15,
  },
}

// ═══════════════════════════════════════════════════════════
// 指标定义常量
// ═══════════════════════════════════════════════════════════

interface MetricDef {
  id: string
  name: string
  category: QualityCategory
  unit: string
  target: number
  threshold: number
  /** 指标方向：'lower' 表示越低越好，'higher' 表示越高越好 */
  direction: 'lower' | 'higher'
}

const METRIC_DEFS: MetricDef[] = [
  {
    id: 'avg-duration',
    name: '平均耗时',
    category: 'performance',
    unit: 'ms',
    target: 50,
    threshold: 100,
    direction: 'lower',
  },
  {
    id: 'avg-explain-length',
    name: 'Explain平均长度',
    category: 'explain',
    unit: '字',
    target: 500,
    threshold: 200,
    direction: 'higher',
  },
  {
    id: 'avg-classical-ref',
    name: '古籍引用数',
    category: 'classical',
    unit: '条',
    target: 5,
    threshold: 2,
    direction: 'higher',
  },
  {
    id: 'case-hit-rate',
    name: '案例命中率',
    category: 'case',
    unit: '%',
    target: 70,
    threshold: 30,
    direction: 'higher',
  },
  {
    id: 'avg-case-similarity',
    name: '案例平均相似度',
    category: 'case',
    unit: '%',
    target: 60,
    threshold: 30,
    direction: 'higher',
  },
  {
    id: 'avg-consistency',
    name: '一致性评分',
    category: 'consistency',
    unit: '分',
    target: 80,
    threshold: 50,
    direction: 'higher',
  },
  {
    id: 'benchmark-accuracy',
    name: 'Benchmark准确率',
    category: 'benchmark',
    unit: '%',
    target: 50,
    threshold: 30,
    direction: 'higher',
  },
  {
    id: 'avg-reasoning-steps',
    name: '推理步骤数',
    category: 'explain',
    unit: '步',
    target: 30,
    threshold: 10,
    direction: 'higher',
  },
  {
    id: 'avg-rule-match',
    name: '规则匹配数',
    category: 'coverage',
    unit: '条',
    target: 8,
    threshold: 3,
    direction: 'higher',
  },
  {
    id: 'accuracy-change',
    name: '准确率变化',
    category: 'accuracy',
    unit: '%',
    target: 0,
    threshold: -10,
    direction: 'higher',
  },
]

// ═══════════════════════════════════════════════════════════
// 综合评分历史缓存
// ═══════════════════════════════════════════════════════════

interface ScoreSnapshot {
  label: string
  score: number
}

// ═══════════════════════════════════════════════════════════
// QualityMonitor 主类
// ═══════════════════════════════════════════════════════════

export class QualityMonitor {
  private records: QualityRecord[] = []
  private config: QualityMonitorConfig
  private benchmarkHistory: MetricPoint[] = []
  private scoreHistory: ScoreSnapshot[] = []

  constructor(config?: Partial<QualityMonitorConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  // ──────────────────────────────────────────────────
  // 记录
  // ──────────────────────────────────────────────────

  /** 记录一次分析的完整质量数据 */
  record(data: Omit<QualityRecord, 'id' | 'timestamp'>): string {
    const id = uid()
    const rec: QualityRecord = {
      ...data,
      id,
      timestamp: formatTime(new Date()),
    }
    this.records.push(rec)

    // 如果本次包含 Benchmark 准确率，同步写入 benchmarkHistory
    if (data.benchmarkAccuracy > 0) {
      this.benchmarkHistory.push({
        label: rec.timestamp,
        value: data.benchmarkAccuracy,
      })
    }

    // 限制记录数量
    this.trimRecords()
    return id
  }

  /** 批量记录 */
  recordBatch(records: Omit<QualityRecord, 'id' | 'timestamp'>[]): number {
    let count = 0
    for (const data of records) {
      this.record(data)
      count++
    }
    return count
  }

  /** 获取所有记录 */
  getAllRecords(): QualityRecord[] {
    return [...this.records]
  }

  /** 获取最新N条记录 */
  getRecentRecords(n: number): QualityRecord[] {
    return this.records.slice(-n)
  }

  /** 清除所有记录 */
  clearRecords(): void {
    this.records = []
    this.benchmarkHistory = []
    this.scoreHistory = []
  }

  /** 裁剪超出上限的旧记录 */
  private trimRecords(): void {
    if (this.records.length > this.config.maxHistory) {
      const excess = this.records.length - this.config.maxHistory
      this.records.splice(0, excess)
    }
    if (this.benchmarkHistory.length > this.config.maxHistory) {
      const excess = this.benchmarkHistory.length - this.config.maxHistory
      this.benchmarkHistory.splice(0, excess)
    }
    if (this.scoreHistory.length > this.config.maxHistory) {
      const excess = this.scoreHistory.length - this.config.maxHistory
      this.scoreHistory.splice(0, excess)
    }
  }

  // ──────────────────────────────────────────────────
  // Benchmark 追踪
  // ──────────────────────────────────────────────────

  /** 记录Benchmark准确率 */
  recordBenchmark(accuracy: number, label?: string): void {
    this.benchmarkHistory.push({
      label: label ?? formatTime(new Date()),
      value: accuracy,
    })
    this.trimRecords()
  }

  /** 获取Benchmark历史 */
  getBenchmarkHistory(): MetricPoint[] {
    return [...this.benchmarkHistory]
  }

  // ──────────────────────────────────────────────────
  // 统计辅助
  // ──────────────────────────────────────────────────

  /** 获取当前统计 */
  getCurrentStats(): {
    totalAnalyses: number
    avgDuration: number
    avgExplainLength: number
    avgClassicalRefCount: number
    avgCaseHitCount: number
    avgCaseSimilarity: number
    avgConsistencyScore: number
    avgBenchmarkAccuracy: number
    avgReasoningSteps: number
    avgRuleMatchCount: number
  } {
    const n = this.records.length
    if (n === 0) {
      return {
        totalAnalyses: 0,
        avgDuration: 0,
        avgExplainLength: 0,
        avgClassicalRefCount: 0,
        avgCaseHitCount: 0,
        avgCaseSimilarity: 0,
        avgConsistencyScore: 0,
        avgBenchmarkAccuracy: 0,
        avgReasoningSteps: 0,
        avgRuleMatchCount: 0,
      }
    }

    return {
      totalAnalyses: n,
      avgDuration: round2(avg(this.records.map(r => r.duration))),
      avgExplainLength: round2(avg(this.records.map(r => r.explainLength))),
      avgClassicalRefCount: round2(avg(this.records.map(r => r.classicalRefCount))),
      avgCaseHitCount: round2(avg(this.records.map(r => r.caseHitCount))),
      avgCaseSimilarity: round2(avg(this.records.map(r => r.caseTopSimilarity))),
      avgConsistencyScore: round2(avg(this.records.map(r => r.consistencyScore))),
      avgBenchmarkAccuracy: round2(avg(this.records.map(r => r.benchmarkAccuracy))),
      avgReasoningSteps: round2(avg(this.records.map(r => r.reasoningSteps))),
      avgRuleMatchCount: round2(avg(this.records.map(r => r.ruleMatchCount))),
    }
  }

  // ──────────────────────────────────────────────────
  // 仪表盘
  // ──────────────────────────────────────────────────

  /** 生成质量仪表盘 */
  getDashboard(): QualityDashboard {
    const metrics = this.calculateMetrics()
    const overallScore = this.calculateOverallScore(metrics)

    // 缓存综合评分快照
    this.scoreHistory.push({
      label: formatTime(new Date()),
      score: overallScore,
    })
    this.trimRecords()

    const analysis = this.generateAnalysis(metrics)
    const trendCharts = this.generateTrendCharts(metrics)
    const pieCharts = this.generatePieCharts(metrics, analysis)
    const statsTable = this.generateStatsTable(metrics)
    const report = this.generateReport(metrics, overallScore, analysis)

    // 按类别分组
    const byCategory = {} as Record<QualityCategory, QualityMetric[]>
    const allCategories: QualityCategory[] = [
      'performance', 'accuracy', 'consistency', 'coverage',
      'classical', 'explain', 'case', 'benchmark', 'learning',
    ]
    for (const cat of allCategories) {
      byCategory[cat] = metrics.filter(m => m.category === cat)
    }

    return {
      generatedAt: formatTime(new Date()),
      metrics,
      byCategory,
      overallScore,
      analysis,
      trendCharts,
      pieCharts,
      statsTable,
      report,
    }
  }

  // ──────────────────────────────────────────────────
  // 指标计算
  // ──────────────────────────────────────────────────

  /** 计算全部 10 个质量指标 */
  private calculateMetrics(): QualityMetric[] {
    const stats = this.getCurrentStats()
    const n = this.records.length
    const results: QualityMetric[] = []

    for (const def of METRIC_DEFS) {
      let current = 0
      let history: MetricPoint[] = []

      switch (def.id) {
        case 'avg-duration':
          current = stats.avgDuration
          history = this.extractFieldHistory('duration', 20)
          break

        case 'avg-explain-length':
          current = stats.avgExplainLength
          history = this.extractFieldHistory('explainLength', 20)
          break

        case 'avg-classical-ref':
          current = stats.avgClassicalRefCount
          history = this.extractFieldHistory('classicalRefCount', 20)
          break

        case 'case-hit-rate': {
          // 案例命中率 = 平均命中数 / 总分析数 * 100
          current = n > 0 ? round2(safeDiv(stats.avgCaseHitCount, 1) * 100) : 0
          history = this.extractDerivedHistory('caseHitCount', 20, (vals) =>
            round2(avg(vals) * 100)
          )
          break
        }

        case 'avg-case-similarity':
          current = stats.avgCaseSimilarity
          history = this.extractFieldHistory('caseTopSimilarity', 20)
          break

        case 'avg-consistency':
          current = stats.avgConsistencyScore
          history = this.extractFieldHistory('consistencyScore', 20)
          break

        case 'benchmark-accuracy': {
          // 取最近一次 Benchmark 准确率
          const lastBench = this.benchmarkHistory.length > 0
            ? this.benchmarkHistory[this.benchmarkHistory.length - 1].value
            : stats.avgBenchmarkAccuracy
          current = round2(lastBench)
          history = [...this.benchmarkHistory]
          break
        }

        case 'avg-reasoning-steps':
          current = stats.avgReasoningSteps
          history = this.extractFieldHistory('reasoningSteps', 20)
          break

        case 'avg-rule-match':
          current = stats.avgRuleMatchCount
          history = this.extractFieldHistory('ruleMatchCount', 20)
          break

        case 'accuracy-change': {
          // Benchmark 准确率的变化率（百分点）
          if (this.benchmarkHistory.length >= 2) {
            const recent = this.benchmarkHistory.slice(-10)
            const first = recent[0].value
            const last = recent[recent.length - 1].value
            current = round2(last - first)
          } else {
            current = 0
          }
          // 变化率历史：每 10 条 Benchmark 数据算一个窗口变化率
          history = this.calcBenchmarkChangeHistory()
          break
        }
      }

      const trend = this.calcTrend(history.map(h => h.value))
      const changeRate = this.calcChangeRate(history.map(h => h.value))
      const status = this.determineStatus(current, def.target, def.threshold, def.direction)

      results.push({
        id: def.id,
        name: def.name,
        category: def.category,
        current,
        unit: def.unit,
        target: def.target,
        threshold: def.threshold,
        trend,
        changeRate,
        history,
        status,
      })
    }

    return results
  }

  // ──────────────────────────────────────────────────
  // 综合评分
  // ──────────────────────────────────────────────────

  /** 综合评分算法：按类别权重聚合 */
  private calculateOverallScore(metrics: QualityMetric[]): number {
    const w = this.config.weights

    // performance 维度：取 performance 类别指标
    const perfMetrics = metrics.filter(m => m.category === 'performance')
    const perfScore = perfMetrics.length > 0
      ? avg(perfMetrics.map(m => this.metricToScore(m)))
      : 0

    // accuracy 维度
    const accMetrics = metrics.filter(m => m.category === 'accuracy')
    const accScore = accMetrics.length > 0
      ? avg(accMetrics.map(m => this.metricToScore(m)))
      : 0

    // consistency 维度
    const conMetrics = metrics.filter(m => m.category === 'consistency')
    const conScore = conMetrics.length > 0
      ? avg(conMetrics.map(m => this.metricToScore(m)))
      : 0

    // coverage 维度
    const covMetrics = metrics.filter(m => m.category === 'coverage')
    const covScore = covMetrics.length > 0
      ? avg(covMetrics.map(m => this.metricToScore(m)))
      : 0

    // classical 维度
    const clsMetrics = metrics.filter(m => m.category === 'classical')
    const clsScore = clsMetrics.length > 0
      ? avg(clsMetrics.map(m => this.metricToScore(m)))
      : 0

    // 加权求和
    const total = perfScore * w.performance
      + accScore * w.accuracy
      + conScore * w.consistency
      + covScore * w.coverage
      + clsScore * w.classical

    return round1(Math.min(Math.max(total, 0), 100))
  }

  /** 将单个指标映射到 0-100 的维度分数 */
  private metricToScore(m: QualityMetric): number {
    if (m.current === 0 && m.target === 0) return 100
    // 判断方向：lower 类指标（如耗时），目标值以下为满分
    const def = METRIC_DEFS.find(d => d.id === m.id)
    const isLower = def?.direction === 'lower'

    if (isLower) {
      // 越低越好：current <= target 得满分，超过 target 按比例扣分
      if (m.current <= m.target) return 100
      const ratio = m.target / m.current
      return round1(Math.max(ratio * 100, 0))
    } else {
      // 越高越好
      if (m.target === 0) {
        // 准确率变化等特殊情况：current >= 0 即满分，负值按比例扣分
        if (m.current >= 0) return 100
        return round1(Math.max((1 + m.current / Math.abs(m.threshold)) * 100, 0))
      }
      const ratio = safeDiv(m.current, m.target)
      return round1(Math.min(ratio * 100, 100))
    }
  }

  // ──────────────────────────────────────────────────
  // 分析摘要
  // ──────────────────────────────────────────────────

  /** 根据指标状态生成分析摘要 */
  private generateAnalysis(metrics: QualityMetric[]): AnalysisSummary[] {
    const analysis: AnalysisSummary[] = []

    // 按严重程度排序：critical > warning > info
    const criticals = metrics.filter(m => m.status === 'critical')
    const warnings = metrics.filter(m => m.status === 'warning')
    const goods = metrics.filter(m => m.status === 'good')

    // 生成 critical 级别摘要
    for (const m of criticals) {
      analysis.push({
        title: `${m.name}严重偏离目标`,
        description: pick([
          `${m.name}当前值为 ${m.current}${m.unit}，远低于目标 ${m.target}${m.unit}，已突破警戒线 ${m.threshold}${m.unit}，需要立即排查。`,
          `检测到 ${m.name} 指标处于危险区间（${m.current}${m.unit}），目标值为 ${m.target}${m.unit}，存在严重的质量隐患。`,
          `${m.name} 的数值已跌破警戒线（${m.threshold}${m.unit}），当前仅 ${m.current}${m.unit}，属于系统关键缺陷。`,
        ]),
        severity: 'critical',
        suggestion: this.generateSuggestion(m),
      })
    }

    // 生成 warning 级别摘要
    for (const m of warnings) {
      analysis.push({
        title: `${m.name}未达预期`,
        description: pick([
          `${m.name}当前值为 ${m.current}${m.unit}，距离目标 ${m.target}${m.unit} 仍有差距，建议持续关注并优化。`,
          `${m.name} 表现欠佳（${m.current}${m.unit}），虽未跌破警戒线，但与理想目标 ${m.target}${m.unit} 尚有提升空间。`,
          `${m.name} 介于警戒线与目标之间，当前 ${m.current}${m.unit}，需定向调优以达到 ${m.target}${m.unit} 的标准。`,
        ]),
        severity: 'warning',
        suggestion: this.generateSuggestion(m),
      })
    }

    // 从良好指标中随机选取 1-2 个做正面反馈
    if (goods.length > 0) {
      const highlighted = pickN(goods, Math.min(2, goods.length))
      for (const m of highlighted) {
        analysis.push({
          title: `${m.name}表现良好`,
          description: pick([
            `${m.name} 当前值 ${m.current}${m.unit}，已达成目标 ${m.target}${m.unit}，运行状态健康。`,
            `${m.name} 维持在理想范围内（${m.current}${m.unit}），表明该模块运行稳定可靠。`,
          ]),
          severity: 'info',
          suggestion: pick([
            '保持当前策略，定期巡检即可。',
            '建议持续观察长期趋势，确保稳定性。',
          ]),
        })
      }
    }

    return analysis
  }

  /** 根据指标类别生成针对性建议 */
  private generateSuggestion(m: QualityMetric): string {
    const suggestions: Record<string, string[]> = {
      'avg-duration': [
        '建议排查分析管线中耗时较长的模块，考虑引入缓存机制或优化规则匹配算法。',
        '可尝试减少冗余计算步骤，对高频调用的子引擎进行性能剖析与热点优化。',
        '检查是否存在重复执行同一模块的情况，合并同类计算以缩短整体耗时。',
      ],
      'avg-explain-length': [
        '建议丰富 Explain 模板的细节描述，增加古典文献引用段落和具体推断过程。',
        '可在推理层增加中间结论的展开说明，使输出更加翔实且具有说服力。',
        '考虑为不同分析维度定制独立的解释模块，确保每个维度都有充分的文字阐述。',
      ],
      'avg-classical-ref': [
        '建议扩展古籍知识库的引用覆盖面，增加《三命通会》《星平会海》等典籍条目。',
        '可在规则引擎中增加古籍来源标注，自动关联经典原文作为分析依据。',
        '考虑引入更多经典案例中的古文引用，提升命理分析的文化底蕴和专业性。',
      ],
      'case-hit-rate': [
        '建议扩充案例库中高质量命盘的数量，尤其增加特殊格局和稀有配置的样本。',
        '可优化相似度算法的权重配置，提升对核心特征的匹配灵敏度。',
        '检查案例库是否存在数据分布不均的问题，补充弱势类别的案例。',
      ],
      'avg-case-similarity': [
        '建议优化特征提取策略，确保相似度计算能捕捉命盘间的深层结构性关联。',
        '可调整相似度阈值设定，使匹配结果更加精准、减少噪音干扰。',
        '考虑引入多维度相似度加权机制，对不同属性赋予差异化权重。',
      ],
      'avg-consistency': [
        '建议重点排查各引擎之间的矛盾输出，特别是用神和旺衰判断的分歧来源。',
        '可在一致性规则集中增加更多跨模块交叉验证逻辑，从源头消除冲突。',
        '考虑引入多数投票机制，当多个引擎意见不一致时取共识结论。',
      ],
      'benchmark-accuracy': [
        '建议检查用神判断逻辑和格局识别规则，增加经典规则的匹配权重。',
        '可回顾近期的规则修改，排查是否有不当调整导致准确率下降。',
        '建议对比不同版本间的 Benchmark 结果，定位退步明显的分析维度。',
      ],
      'avg-reasoning-steps': [
        '建议扩展推理规则库，增加更多中间推理节点以使分析链条更加完整。',
        '可在推理层引入假设-验证机制，使每一步推断都有据可依、层层递进。',
        '考虑增加反事实推理步骤，通过排除法强化最终结论的可靠性。',
      ],
      'avg-rule-match': [
        '建议丰富规则库覆盖面，补充特殊格局、罕见配置的规则条目。',
        '可对现有规则进行细化拆分，将粗粒度规则拆为多条细粒度规则以提升匹配数量。',
        '检查是否存在规则冲突导致部分规则被错误跳过的情况。',
      ],
      'accuracy-change': [
        '建议密切关注 Benchmark 准确率的走势，排查近期改动是否引入了回归。',
        '可冻结当前规则集进行基线对比，确认退步的具体来源。',
        '考虑引入渐进式规则更新策略，每次仅修改少量规则并立即验证效果。',
      ],
    }

    const pool = suggestions[m.id] ?? [
      '建议全面排查相关模块，逐步定位问题根源并针对性优化。',
      '可结合日志和中间输出进行细致分析，找出影响指标的关键因素。',
    ]
    return pick(pool)
  }

  // ──────────────────────────────────────────────────
  // 趋势图
  // ──────────────────────────────────────────────────

  /** 生成 3 个趋势图 */
  private generateTrendCharts(metrics: QualityMetric[]): TrendChartData[] {
    const charts: TrendChartData[] = []

    // 图表1：耗时趋势（最近 20 条记录）
    const durationMetric = metrics.find(m => m.id === 'avg-duration')
    if (durationMetric) {
      charts.push({
        id: 'trend-duration',
        title: '分析耗时趋势',
        xLabels: durationMetric.history.map(h => h.label),
        series: [{
          name: '耗时',
          data: durationMetric.history.map(h => h.value),
        }],
      })
    }

    // 图表2：Benchmark 准确率趋势
    charts.push({
      id: 'trend-benchmark',
      title: 'Benchmark 准确率趋势',
      xLabels: this.benchmarkHistory.map(h => h.label),
      series: [{
        name: '准确率',
        data: this.benchmarkHistory.map(h => h.value),
      }],
    })

    // 图表3：综合评分趋势
    charts.push({
      id: 'trend-overall-score',
      title: '综合评分趋势',
      xLabels: this.scoreHistory.map(s => s.label),
      series: [{
        name: '综合评分',
        data: this.scoreHistory.map(s => s.score),
      }],
    })

    return charts
  }

  // ──────────────────────────────────────────────────
  // 饼图
  // ──────────────────────────────────────────────────

  /** 生成 2 个饼图 */
  private generatePieCharts(
    metrics: QualityMetric[],
    analysis: AnalysisSummary[],
  ): PieChartData[] {
    const charts: PieChartData[] = []

    // 饼图1：指标状态分布
    const goodCount = metrics.filter(m => m.status === 'good').length
    const warnCount = metrics.filter(m => m.status === 'warning').length
    const critCount = metrics.filter(m => m.status === 'critical').length

    charts.push({
      id: 'pie-status',
      title: '指标状态分布',
      data: [
        { name: '正常', value: goodCount },
        { name: '警告', value: warnCount },
        { name: '严重', value: critCount },
      ].filter(d => d.value > 0),
    })

    // 饼图2：问题类别分布（从 analysis 中统计）
    const categoryMap = new Map<QualityCategory, number>()
    for (const a of analysis) {
      if (a.severity === 'critical' || a.severity === 'warning') {
        // 从标题中匹配类别关键词
        for (const m of metrics) {
          if (a.title.includes(m.name)) {
            categoryMap.set(m.category, (categoryMap.get(m.category) ?? 0) + 1)
            break
          }
        }
      }
    }

    const categoryNames: Record<QualityCategory, string> = {
      performance: '性能',
      accuracy: '准确率',
      consistency: '一致性',
      coverage: '覆盖度',
      classical: '古籍引用',
      explain: '解释质量',
      case: '案例匹配',
      benchmark: '基准测试',
      learning: '学习系统',
    }

    const catData: Array<{ name: string; value: number }> = []
    for (const [cat, count] of categoryMap) {
      catData.push({
        name: categoryNames[cat] ?? cat,
        value: count,
      })
    }

    if (catData.length === 0) {
      catData.push({ name: '无问题', value: 1 })
    }

    charts.push({
      id: 'pie-category',
      title: '问题类别分布',
      data: catData,
    })

    return charts
  }

  // ──────────────────────────────────────────────────
  // 统计表格
  // ──────────────────────────────────────────────────

  /** 生成统计表格 */
  private generateStatsTable(metrics: QualityMetric[]): StatsTableData {
    const trendLabel = (t: TrendDirection): string => {
      switch (t) {
        case 'up': return '上升'
        case 'down': return '下降'
        case 'stable': return '平稳'
      }
    }

    const statusLabel = (s: 'good' | 'warning' | 'critical'): string => {
      switch (s) {
        case 'good': return '正常'
        case 'warning': return '警告'
        case 'critical': return '严重'
      }
    }

    return {
      headers: ['指标名称', '当前值', '目标值', '状态', '趋势', '变化率'],
      rows: metrics.map(m => ({
        name: m.name,
        values: [
          `${m.current}${m.unit}`,
          this.getMetricDirection(m.id) === 'lower'
            ? `<${m.target}${m.unit}`
            : `>${m.target}${m.unit}`,
          statusLabel(m.status),
          trendLabel(m.trend),
          `${m.changeRate >= 0 ? '+' : ''}${m.changeRate}%`,
        ],
      })),
    }
  }

  // ──────────────────────────────────────────────────
  // 报告生成
  // ──────────────────────────────────────────────────

  /** 生成中文质量报告 */
  private generateReport(
    metrics: QualityMetric[],
    score: number,
    analysis: AnalysisSummary[],
  ): string {
    const lines: string[] = []
    const sep = '\u2550'.repeat(35)
    const thinSep = '\u2500'.repeat(35)

    lines.push(`${sep}`)
    lines.push(`  质量监控报告`)
    lines.push(`${sep}`)
    lines.push(`生成时间：${formatTime(new Date())}`)
    lines.push(`命盘总数：${this.records.length}`)
    lines.push(`综合评分：${score}/100`)
    lines.push(thinSep)

    // 评分等级判定
    let gradeDesc = ''
    if (score >= 90) {
      gradeDesc = pick(['系统运行状态优秀，各项指标均达理想水平。', '整体质量表现卓越，建议保持现有策略。'])
    } else if (score >= 70) {
      gradeDesc = pick(['系统整体表现良好，部分指标仍有一定提升空间。', '各项核心指标运行正常，建议关注薄弱环节。'])
    } else if (score >= 50) {
      gradeDesc = pick(['系统质量处于中等水平，多项指标需要改善。', '综合表现尚可但存在明显短板，建议重点排查警告指标。'])
    } else {
      gradeDesc = pick(['系统质量堪忧，多项关键指标未达标，建议立即着手修复。', '综合评分偏低，需要全面审视分析管线的各个环节。'])
    }
    lines.push(gradeDesc)
    lines.push(thinSep)

    // 核心指标部分
    lines.push(`\u25A0 核心指标`)

    for (const m of metrics) {
      const icon = m.status === 'good' ? '\u2713'
        : m.status === 'warning' ? '\u25B2'
        : '\u25A0'

      const statusText = m.status === 'good' ? ''
        : m.status === 'warning' ? ' \u9700\u5173\u6CE8'
        : ' \u4E25\u91CD'

      const targetStr = this.getMetricDirection(m.id) === 'lower'
        ? `\u76EE\u6807<${m.target}${m.unit}`
        : `\u76EE\u6807>${m.target}${m.unit}`

      lines.push(
        `  ${m.name}\uFF1A${m.current}${m.unit}\uFF08${targetStr}\uFF09${icon}${statusText}`
      )
    }

    lines.push(thinSep)

    // 问题分析部分
    const problems = analysis.filter(a => a.severity !== 'info')
    if (problems.length > 0) {
      lines.push(`\u25A0 问题分析`)
      for (const p of problems) {
        const tag = p.severity === 'critical' ? '[CRITICAL]' : '[WARNING]'
        lines.push(`  ${tag} ${p.title}`)
        lines.push(`    ${p.description}`)
        lines.push(`    \u5EFA\u8BAE\uFF1A${p.suggestion}`)
      }
      lines.push(thinSep)
    }

    // 趋势概述
    const scoreTrend = this.calcTrend(this.scoreHistory.map(s => s.score))
    const scoreChange = this.calcChangeRate(this.scoreHistory.map(s => s.score))
    const trendDesc = scoreTrend === 'up'
      ? pick(['呈上升趋势', '持续向好'])
      : scoreTrend === 'down'
        ? pick(['呈下降趋势', '有所退步'])
        : pick(['保持平稳', '变化不大'])

    lines.push(`\u25A0 趋势概述`)
    lines.push(
      `  综合评分${trendDesc}\uFF08${scoreChange >= 0 ? '+' : ''}${scoreChange}%\uFF09`
    )

    // 单独提几个关键趋势
    const keyMetrics = metrics.filter(m =>
      m.category === 'performance' || m.category === 'benchmark' || m.category === 'consistency'
    )
    for (const m of keyMetrics) {
      const mDir = this.getMetricDirection(m.id)
      const dir = m.trend === 'up'
        ? (mDir === 'lower' ? '\u4E0A\u5347\uFF08\u6CE8\u610F\uFF09' : '\u4E0A\u5347')
        : m.trend === 'down'
          ? (mDir === 'lower' ? '\u4E0B\u964D\uFF08\u597D\u8F6C\uFF09' : '\u4E0B\u964D')
          : '\u5E73\u7A33'
      lines.push(
        `  ${m.name}\u8D8B\u52BF${dir}\uFF08${m.changeRate >= 0 ? '+' : ''}${m.changeRate}%\uFF09`
      )
    }

    lines.push(`${sep}`)

    return lines.join('\n')
  }

  // ──────────────────────────────────────────────────
  // 辅助方法
  // ──────────────────────────────────────────────────

  /** 获取指标的方向（lower=越低越好, higher=越高越好） */
  private getMetricDirection(metricId: string): 'lower' | 'higher' {
    const def = METRIC_DEFS.find(d => d.id === metricId)
    return def?.direction ?? 'higher'
  }

  // ──────────────────────────────────────────────────
  // 趋势分析工具
  // ──────────────────────────────────────────────────

  /** 计算趋势方向 */
  private calcTrend(history: number[]): TrendDirection {
    if (history.length < 3) return 'stable'

    // 取最近 1/3 和前 1/3 的平均值进行对比
    const third = Math.max(1, Math.floor(history.length / 3))
    const recent = avg(history.slice(-third))
    const earlier = avg(history.slice(0, third))

    if (recent - earlier > 1) return 'up'
    if (earlier - recent > 1) return 'down'
    return 'stable'
  }

  /** 计算变化率（百分比） */
  private calcChangeRate(history: number[]): number {
    if (history.length < 2) return 0

    const recent = history[history.length - 1]
    const earlier = history[0]

    if (earlier === 0) {
      return recent === 0 ? 0 : 100
    }

    return round2((recent - earlier) / Math.abs(earlier) * 100)
  }

  /** 判断指标状态 */
  private determineStatus(
    current: number,
    target: number,
    threshold: number,
    direction: 'lower' | 'higher' = 'higher',
  ): 'good' | 'warning' | 'critical' {
    if (direction === 'lower') {
      // 越低越好：current <= target 为 good，> threshold 为 critical
      if (current <= target) return 'good'
      if (current > threshold) return 'critical'
      return 'warning'
    } else {
      // 越高越好：current >= target 为 good，< threshold 为 critical
      if (current >= target) return 'good'
      if (current < threshold) return 'critical'
      return 'warning'
    }
  }

  // ──────────────────────────────────────────────────
  // 历史提取辅助
  // ──────────────────────────────────────────────────

  /** 从记录中提取某字段的最近 N 条历史 */
  private extractFieldHistory(
    field: keyof QualityRecord,
    limit: number,
  ): MetricPoint[] {
    const recent = this.records.slice(-limit)
    return recent.map((r, i) => ({
      label: r.timestamp ?? `#${i + 1}`,
      value: typeof r[field] === 'number' ? r[field] as number : 0,
    }))
  }

  /** 从记录中提取滑动窗口聚合后的派生历史 */
  private extractDerivedHistory(
    field: keyof QualityRecord,
    windowSize: number,
    aggregator: (vals: number[]) => number,
  ): MetricPoint[] {
    const values = this.records.map(r =>
      typeof r[field] === 'number' ? r[field] as number : 0
    )
    const result: MetricPoint[] = []
    for (let i = 0; i < values.length; i++) {
      const start = Math.max(0, i - windowSize + 1)
      const window = values.slice(start, i + 1)
      result.push({
        label: this.records[i].timestamp ?? `#${i + 1}`,
        value: round2(aggregator(window)),
      })
    }
    return result.slice(-20)
  }

  /** 计算 Benchmark 准确率的分段变化率历史 */
  private calcBenchmarkChangeHistory(): MetricPoint[] {
    const history: MetricPoint[] = []
    const bh = this.benchmarkHistory
    const window = 10

    if (bh.length < 2) return history

    for (let i = window - 1; i < bh.length; i++) {
      const first = bh[i - window + 1].value
      const last = bh[i].value
      history.push({
        label: bh[i].label,
        value: round2(last - first),
      })
    }

    return history
  }
}
