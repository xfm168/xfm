/**
 * PerformanceCenter（性能中心）
 *
 * 采集 Foundation 各模块（解析、校验、编译、执行、融合、解释、渲染、API）
 * 的耗时样本，计算统计与分位值，输出 ASCII 风格汇总表。
 *
 * 分位数计算：排序后 index = Math.floor(p * N)。
 */

/** 性能指标类型枚举 */
export type PerformanceMetricType =
  | 'rule_parse'          // 规则 DSL → AST 解析
  | 'rule_validate'       // AST 校验
  | 'rule_compile'        // AST → CompiledRule 编译
  | 'rule_runtime_execute'// Runtime 执行规则
  | 'fusion_decision'     // 融合决策层
  | 'explain_generate'    // 解释生成
  | 'dashboard_render'    // 仪表盘渲染
  | 'api_request'         // API 请求

/** 单个性能样本 */
export interface PerformanceSample {
  /** 指标类型 */
  type: PerformanceMetricType
  /** 标签（如规则 ID、API 路径） */
  label?: string
  /** 耗时毫秒 */
  durationMs: number
  /** 开始时间戳（毫秒） */
  startedAt: number
  /** 附加元数据 */
  metadata?: Record<string, any>
}

/** 单类型性能统计报告 */
export interface PerformanceReport {
  /** 样本数 */
  count: number
  /** 总耗时 ms */
  totalMs: number
  /** 平均耗时 ms */
  avgMs: number
  /** 50 分位（中位数）ms */
  p50Ms: number
  /** 95 分位 ms */
  p95Ms: number
  /** 99 分位 ms */
  p99Ms: number
  /** 最慢的若干样本（默认 10 条） */
  slowest: PerformanceSample[]
}

/**
 * 升序排序后的数字数组的分位数取值
 * index = Math.floor(p * N)
 */
function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0
  const idx = Math.floor(p * sortedAsc.length)
  const clamped = Math.max(0, Math.min(sortedAsc.length - 1, idx))
  return sortedAsc[clamped]
}

const ALL_METRIC_TYPES: PerformanceMetricType[] = [
  'rule_parse',
  'rule_validate',
  'rule_compile',
  'rule_runtime_execute',
  'fusion_decision',
  'explain_generate',
  'dashboard_render',
  'api_request',
]

/**
 * 性能中心类
 */
export class PerformanceCenter {
  /** 全部样本（按插入顺序） */
  private _samples: PerformanceSample[] = []

  /** 按类型分桶（引用与 _samples 同对象） */
  private _byType: Map<PerformanceMetricType, PerformanceSample[]> = new Map()

  constructor() {
    for (const t of ALL_METRIC_TYPES) {
      this._byType.set(t, [])
    }
  }

  /**
   * 开始计时。返回 stop 函数，调用时自动记录样本并返回该样本。
   */
  startTiming(
    type: PerformanceMetricType,
    label?: string,
  ): () => PerformanceSample {
    const startedAt = Date.now()
    return (metadata?: Record<string, any>): PerformanceSample => {
      const durationMs = Date.now() - startedAt
      const sample: PerformanceSample = {
        type,
        label,
        durationMs,
        startedAt,
        metadata,
      }
      this.recordSample(sample)
      return sample
    }
  }

  /**
   * 直接记录一条样本
   */
  recordSample(sample: PerformanceSample): void {
    this._samples.push(sample)
    let bucket = this._byType.get(sample.type)
    if (!bucket) {
      bucket = []
      this._byType.set(sample.type, bucket)
    }
    bucket.push(sample)
  }

  /**
   * 计算某组样本的报告
   */
  private _reportFor(samples: PerformanceSample[]): PerformanceReport {
    if (samples.length === 0) {
      return {
        count: 0,
        totalMs: 0,
        avgMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        p99Ms: 0,
        slowest: [],
      }
    }
    const sortedAsc = samples.map((s) => s.durationMs).sort((a, b) => a - b)
    const totalMs = sortedAsc.reduce((acc, v) => acc + v, 0)
    const slowest = samples
      .slice()
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 10)
    return {
      count: samples.length,
      totalMs,
      avgMs: totalMs / samples.length,
      p50Ms: percentile(sortedAsc, 0.5),
      p95Ms: percentile(sortedAsc, 0.95),
      p99Ms: percentile(sortedAsc, 0.99),
      slowest,
    }
  }

  /**
   * 获取所有指标类型的报告（无样本也返回 0 值，便于 UI 统一渲染）
   */
  getReport(): Record<PerformanceMetricType, PerformanceReport> {
    const result = {} as Record<PerformanceMetricType, PerformanceReport>
    for (const t of ALL_METRIC_TYPES) {
      result[t] = this._reportFor(this._byType.get(t) ?? [])
    }
    return result
  }

  /**
   * 取全库最慢的 N 条样本
   */
  getSlowest(limit = 10): PerformanceSample[] {
    return this._samples
      .slice()
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, limit)
  }

  /**
   * 取指定类型的全部样本（返回副本，不暴露内部数组）
   */
  getByType(type: PerformanceMetricType): PerformanceSample[] {
    return (this._byType.get(type) ?? []).slice()
  }

  /**
   * 清空全部样本
   */
  reset(): void {
    this._samples.length = 0
    for (const t of ALL_METRIC_TYPES) {
      const bucket = this._byType.get(t)
      if (bucket) bucket.length = 0
    }
  }

  /**
   * 生成 ASCII 风格汇总表（供日志打印或 CLI 使用）
   */
  getSummary(): string {
    const report = this.getReport()
    const rows: Array<{
      type: string
      count: number
      total: string
      avg: string
      p50: string
      p95: string
      p99: string
    }> = []
    for (const t of ALL_METRIC_TYPES) {
      const r = report[t]
      if (r.count === 0) continue
      rows.push({
        type: t,
        count: r.count,
        total: r.totalMs.toFixed(1),
        avg: r.avgMs.toFixed(2),
        p50: r.p50Ms.toFixed(2),
        p95: r.p95Ms.toFixed(2),
        p99: r.p99Ms.toFixed(2),
      })
    }

    const cols: Array<{ key: keyof typeof rows[0]; title: string; align: 'L' | 'R' }> = [
      { key: 'type', title: 'Type', align: 'L' },
      { key: 'count', title: 'Count', align: 'R' },
      { key: 'total', title: 'Total(ms)', align: 'R' },
      { key: 'avg', title: 'Avg(ms)', align: 'R' },
      { key: 'p50', title: 'P50(ms)', align: 'R' },
      { key: 'p95', title: 'P95(ms)', align: 'R' },
      { key: 'p99', title: 'P99(ms)', align: 'R' },
    ]
    const colWidths = cols.map((c) => {
      let w = String(c.title).length
      for (const r of rows) {
        const v = String(r[c.key])
        if (v.length > w) w = v.length
      }
      return w
    })

    const pad = (text: string, width: number, align: 'L' | 'R') =>
      align === 'L'
        ? (text + ' '.repeat(width)).slice(0, width)
        : (' '.repeat(width) + text).slice(-width)

    const header = cols.map((c, i) => pad(c.title, colWidths[i], c.align)).join(' | ')
    const sep = colWidths.map((w) => '-'.repeat(w)).join('-+-')
    const body = rows.map((r) =>
      cols.map((c, i) => pad(String(r[c.key]), colWidths[i], c.align)).join(' | '),
    )

    const totalSamples = this._samples.length
    const totalMs = this._samples.reduce((acc, s) => acc + s.durationMs, 0)
    const footer =
      `\n总计: ${totalSamples} 个样本, 累计耗时 ${totalMs.toFixed(1)} ms`

    if (rows.length === 0) {
      return '(PerformanceCenter: 暂无样本)' + footer
    }

    return [header, sep, ...body].join('\n') + footer
  }
}

/** 全局性能中心单例 */
export const globalPerformanceCenter = new PerformanceCenter()
