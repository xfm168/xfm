/**
 * P4.13 PerformanceOptEngine — 性能优化引擎
 *
 * 纯 Plugin 模块，不修改 Kernel。
 * 提供性能目标设定、实时性能记录、达标检查和优化建议生成。
 * 目标：普通命盘 <= 100ms，Explain <= 300ms，API <= 80ms。
 *
 * 古籍依据：
 *   《孙子兵法·九地篇》："兵之情主速，乘人之不及，由不虞之道，
 *    攻其所不戒也。" —— 简称"兵贵神速"。
 *   性能优化如用兵，速度决定胜败。
 *
 * 性能目标：
 *   - 普通命盘分析 <= 100ms
 *   - Explain 解释生成 <= 300ms
 *   - API 响应 <= 80ms
 *   - 并发能力 >= 1000
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 格式化时间为 YYYY-MM-DD HH:mm:ss */
function formatDateTime(d: Date): string {
  var pad = function (n: number): string {
    return n.toString().padStart(2, '0')
  }
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' '
    + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

/** 安全除法，分母为零返回 0 */
function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b
}

/** 保留一位小数 */
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** 保留两位小数 */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** 限制数值在 [min, max] 范围内 */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** 格式化毫秒为可读字符串 */
function formatMs(ms: number): string {
  if (ms < 1) {
    return round2(ms * 1000) + 'us'
  }
  if (ms < 1000) {
    return round2(ms) + 'ms'
  }
  return round2(ms / 1000) + 's'
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 性能优化配置 */
export interface PerformanceOptConfig {
  /** 普通命盘分析目标耗时（毫秒） */
  normalChartTarget: number
  /** Explain 解释生成目标耗时（毫秒） */
  explainTarget: number
  /** API 响应目标耗时（毫秒） */
  apiTarget: number
  /** 并发处理目标数 */
  concurrencyTarget: number
  /** 是否启用缓存优化 */
  cacheEnabled: boolean
  /** 是否启用懒加载优化 */
  lazyLoadEnabled: boolean
}

/** 性能优化结果 */
export interface PerformanceOptResult {
  /** 结果生成时间 */
  generatedAt: string
  /** 性能目标配置 */
  targets: PerformanceOptConfig
  /** 当前实测性能 */
  current: {
    normalChart: number
    explain: number
    api: number
    concurrency: number
  }
  /** 各项是否达标 */
  passing: {
    normalChart: boolean
    explain: boolean
    api: boolean
  }
  /** 优化建议列表 */
  optimizations: string[]
  /** 详细报告文本 */
  report: string
  /** 古籍引用 */
  classicalRef: string
}

/** 单条性能记录 */
interface PerformanceRecord {
  /** 记录类型 */
  type: 'normalChart' | 'explain' | 'api'
  /** 实际耗时（毫秒） */
  duration: number
  /** 记录时间 */
  timestamp: string
}

/** 性能类型名称映射 */
var PERF_TYPE_LABEL: Record<string, string> = {
  normalChart: '普通命盘',
  explain: 'Explain 解释',
  api: 'API 响应'
}

// ═══════════════════════════════════════════════════════════
// PerformanceOptEngine 主类
// ═══════════════════════════════════════════════════════════

export class PerformanceOptEngine {
  /** 内部配置 */
  private _config: PerformanceOptConfig

  /** 性能记录数组 */
  private _records: PerformanceRecord[]

  /** 最近计算的统计值（滑动窗口） */
  private _windowSize: number

  /** 古籍引用 */
  private _classicalRef: string

  constructor() {
    this._config = {
      normalChartTarget: 100,
      explainTarget: 300,
      apiTarget: 80,
      concurrencyTarget: 1000,
      cacheEnabled: true,
      lazyLoadEnabled: true
    }
    this._records = []
    this._windowSize = 100 // 滑动窗口大小
    this._classicalRef = '《孙子兵法·九地篇》："兵之情主速。"（兵贵神速）'
  }

  // ─── 配置管理 ──────────────────────────────────────

  /** 获取当前配置 */
  getConfig(): PerformanceOptConfig {
    // 返回深拷贝
    return structuredClone(this._config)
  }

  /** 部分更新配置 */
  updateTargets(updates: Partial<PerformanceOptConfig>): void {
    if (updates.normalChartTarget !== undefined) {
      if (updates.normalChartTarget <= 0) {
        throw new Error('普通命盘目标耗时必须大于 0')
      }
      this._config.normalChartTarget = updates.normalChartTarget
    }
    if (updates.explainTarget !== undefined) {
      if (updates.explainTarget <= 0) {
        throw new Error('Explain 目标耗时必须大于 0')
      }
      this._config.explainTarget = updates.explainTarget
    }
    if (updates.apiTarget !== undefined) {
      if (updates.apiTarget <= 0) {
        throw new Error('API 目标耗时必须大于 0')
      }
      this._config.apiTarget = updates.apiTarget
    }
    if (updates.concurrencyTarget !== undefined) {
      if (updates.concurrencyTarget <= 0) {
        throw new Error('并发目标必须大于 0')
      }
      this._config.concurrencyTarget = updates.concurrencyTarget
    }
    if (updates.cacheEnabled !== undefined) {
      this._config.cacheEnabled = updates.cacheEnabled
    }
    if (updates.lazyLoadEnabled !== undefined) {
      this._config.lazyLoadEnabled = updates.lazyLoadEnabled
    }
  }

  /** 设置滑动窗口大小 */
  setWindowSize(size: number): void {
    if (size < 1) {
      throw new Error('窗口大小必须大于 0')
    }
    this._windowSize = size
  }

  // ─── 性能记录 ──────────────────────────────────────

  /** 记录一次性能数据 */
  recordPerformance(type: 'normalChart' | 'explain' | 'api', duration: number): void {
    if (duration < 0) {
      throw new Error('耗时不能为负数')
    }
    this._records.push({
      type: type,
      duration: duration,
      timestamp: formatDateTime(new Date())
    })
    // 保留最近 N 条记录
    if (this._records.length > this._windowSize * 3) {
      this._records = this._records.slice(-this._windowSize * 2)
    }
  }

  /** 批量记录性能数据 */
  recordBatch(records: Array<{ type: 'normalChart' | 'explain' | 'api'; duration: number }>): void {
    for (var i = 0; i < records.length; i++) {
      this.recordPerformance(records[i].type, records[i].duration)
    }
  }

  /** 清除所有记录 */
  clearRecords(): void {
    this._records = []
  }

  /** 获取某类型的所有记录 */
  getRecordsByType(type: 'normalChart' | 'explain' | 'api'): PerformanceRecord[] {
    var result: PerformanceRecord[] = []
    for (var i = 0; i < this._records.length; i++) {
      if (this._records[i].type === type) {
        result.push(this._records[i])
      }
    }
    return result
  }

  // ─── 统计计算 ──────────────────────────────────────

  /** 计算某类型的平均值（滑动窗口内） */
  private _getAverage(type: 'normalChart' | 'explain' | 'api'): number {
    var records = this.getRecordsByType(type)
    if (records.length === 0) {
      return 0
    }
    // 只取最近窗口大小条
    var windowed = records.slice(-this._windowSize)
    var sum = 0
    for (var i = 0; i < windowed.length; i++) {
      sum += windowed[i].duration
    }
    return round2(safeDiv(sum, windowed.length))
  }

  /** 计算某类型的 P50（中位数） */
  private _getP50(type: 'normalChart' | 'explain' | 'api'): number {
    var records = this.getRecordsByType(type)
    if (records.length === 0) {
      return 0
    }
    var durations: number[] = []
    for (var i = 0; i < records.length; i++) {
      durations.push(records[i].duration)
    }
    durations.sort(function (a, b) { return a - b })
    var mid = Math.floor(durations.length / 2)
    if (durations.length % 2 === 0) {
      return round2(safeDiv(durations[mid - 1] + durations[mid], 2))
    }
    return durations[mid]
  }

  /** 计算某类型的 P95 */
  private _getP95(type: 'normalChart' | 'explain' | 'api'): number {
    var records = this.getRecordsByType(type)
    if (records.length < 20) {
      return 0 // 数据不足时返回 0
    }
    var durations: number[] = []
    for (var i = 0; i < records.length; i++) {
      durations.push(records[i].duration)
    }
    durations.sort(function (a, b) { return a - b })
    var idx = Math.floor(durations.length * 0.95)
    return durations[idx]
  }

  /** 计算某类型的 P99 */
  private _getP99(type: 'normalChart' | 'explain' | 'api'): number {
    var records = this.getRecordsByType(type)
    if (records.length < 100) {
      return 0 // 数据不足时返回 0
    }
    var durations: number[] = []
    for (var i = 0; i < records.length; i++) {
      durations.push(records[i].duration)
    }
    durations.sort(function (a, b) { return a - b })
    var idx = Math.floor(durations.length * 0.99)
    return durations[idx]
  }

  /** 获取某类型的最大值 */
  private _getMax(type: 'normalChart' | 'explain' | 'api'): number {
    var records = this.getRecordsByType(type)
    if (records.length === 0) {
      return 0
    }
    var max = 0
    for (var i = 0; i < records.length; i++) {
      if (records[i].duration > max) {
        max = records[i].duration
      }
    }
    return max
  }

  /** 获取某类型的记录数 */
  private _getCount(type: 'normalChart' | 'explain' | 'api'): number {
    return this.getRecordsByType(type).length
  }

  /** 获取某类型在目标内的比例（达标率） */
  private _getPassRate(type: 'normalChart' | 'explain' | 'api'): number {
    var records = this.getRecordsByType(type)
    if (records.length === 0) {
      return 0
    }
    var target = this._getTargetForType(type)
    var passCount = 0
    for (var i = 0; i < records.length; i++) {
      if (records[i].duration <= target) {
        passCount++
      }
    }
    return round2(safeDiv(passCount * 100, records.length))
  }

  /** 获取某类型对应的目标值 */
  private _getTargetForType(type: 'normalChart' | 'explain' | 'api'): number {
    if (type === 'normalChart') {
      return this._config.normalChartTarget
    }
    if (type === 'explain') {
      return this._config.explainTarget
    }
    return this._config.apiTarget
  }

  // ─── 达标检查 ──────────────────────────────────────

  /** 检查各项性能是否达标 */
  checkPassing(): PerformanceOptResult['passing'] {
    return {
      normalChart: this._getAverage('normalChart') <= this._config.normalChartTarget,
      explain: this._getAverage('explain') <= this._config.explainTarget,
      api: this._getAverage('api') <= this._config.apiTarget
    }
  }

  /** 检查某类型是否达标 */
  checkTypePassing(type: 'normalChart' | 'explain' | 'api'): boolean {
    return this._getAverage(type) <= this._getTargetForType(type)
  }

  /** 检查所有项是否全部通过 */
  checkAllPassing(): boolean {
    var p = this.checkPassing()
    return p.normalChart && p.explain && p.api
  }

  // ─── 优化建议 ──────────────────────────────────────

  /** 生成优化建议 */
  private _generateOptimizations(): string[] {
    var suggestions: string[] = []
    var passing = this.checkPassing()

    // 普通命盘优化
    if (!passing.normalChart) {
      var avg = this._getAverage('normalChart')
      var overRatio = round2(safeDiv(avg - this._config.normalChartTarget, this._config.normalChartTarget) * 100)
      suggestions.push(
        '普通命盘分析平均 ' + formatMs(avg) + '，超标 ' + overRatio + '%。'
        + '建议：启用缓存（当前' + (this._config.cacheEnabled ? '已启用' : '未启用') + '）、'
        + '启用懒加载（当前' + (this._config.lazyLoadEnabled ? '已启用' : '未启用') + '）、'
        + '减少不必要的五行计算层级。'
      )
    }

    // Explain 优化
    if (!passing.explain) {
      var avgExplain = this._getAverage('explain')
      var overRatioExplain = round2(safeDiv(avgExplain - this._config.explainTarget, this._config.explainTarget) * 100)
      suggestions.push(
        'Explain 生成平均 ' + formatMs(avgExplain) + '，超标 ' + overRatioExplain + '%。'
        + '建议：预编译常用解释模板、启用解释缓存、'
        + '将复杂推理拆分为并行子任务。'
      )
    }

    // API 优化
    if (!passing.api) {
      var avgApi = this._getAverage('api')
      var overRatioApi = round2(safeDiv(avgApi - this._config.apiTarget, this._config.apiTarget) * 100)
      suggestions.push(
        'API 响应平均 ' + formatMs(avgApi) + '，超标 ' + overRatioApi + '%。'
        + '建议：优化中间件链路、启用 HTTP 缓存头、'
        + '考虑预计算热点命盘结果。'
      )
    }

    // P99 检查（尾延迟优化）
    for (var i = 0; i < 3; i++) {
      var types: Array<'normalChart' | 'explain' | 'api'> = ['normalChart', 'explain', 'api']
      var type = types[i]
      var p99 = this._getP99(type)
      var target = this._getTargetForType(type)
      if (p99 > target * 3 && p99 > 0) {
        suggestions.push(
          PERF_TYPE_LABEL[type] + ' P99 为 ' + formatMs(p99)
          + '（目标的 ' + round2(safeDiv(p99, target)) + ' 倍），'
          + '存在严重尾延迟，建议排查 GC 停顿或锁竞争。'
        )
      }
    }

    // 通用建议（全部通过时仍可提供改进方向）
    if (suggestions.length === 0) {
      suggestions.push('当前所有性能指标均达标，建议持续监控。')
      if (this._config.cacheEnabled) {
        suggestions.push('缓存已启用，建议定期检查缓存命中率。')
      }
      if (this._config.lazyLoadEnabled) {
        suggestions.push('懒加载已启用，建议关注首屏加载耗时。')
      }
    }

    return suggestions
  }

  // ─── 报告生成 ──────────────────────────────────────

  /** 获取完整性能报告 */
  getReport(): PerformanceOptResult {
    var passing = this.checkPassing()
    var optimizations = this._generateOptimizations()

    // 当前性能（使用平均值）
    var current = {
      normalChart: this._getAverage('normalChart'),
      explain: this._getAverage('explain'),
      api: this._getAverage('api'),
      concurrency: 0 // 并发数需要外部注入
    }

    // 构建报告文本
    var lines: string[] = []
    lines.push('═══════════════════════════════════════════════')
    lines.push('  性能优化报告')
    lines.push('═══════════════════════════════════════════════')
    lines.push('')
    lines.push('【古籍依据】' + this._classicalRef)
    lines.push('')
    lines.push('报告生成时间：' + formatDateTime(new Date()))
    lines.push('')

    // 目标配置
    lines.push('── 性能目标 ──────────────────────────')
    lines.push('  普通命盘分析：<= ' + this._config.normalChartTarget + 'ms')
    lines.push('  Explain 生成：<= ' + this._config.explainTarget + 'ms')
    lines.push('  API 响应：<= ' + this._config.apiTarget + 'ms')
    lines.push('  并发目标：>= ' + this._config.concurrencyTarget)
    lines.push('  缓存优化：' + (this._config.cacheEnabled ? '开启' : '关闭'))
    lines.push('  懒加载：' + (this._config.lazyLoadEnabled ? '开启' : '关闭'))
    lines.push('')

    // 当前性能
    lines.push('── 当前性能 ──────────────────────────')
    var types: Array<'normalChart' | 'explain' | 'api'> = ['normalChart', 'explain', 'api']
    for (var i = 0; i < types.length; i++) {
      var t = types[i]
      var target = this._getTargetForType(t)
      var avg = this._getAverage(t)
      var p50 = this._getP50(t)
      var p95 = this._getP95(t)
      var p99 = this._getP99(t)
      var maxVal = this._getMax(t)
      var passRate = this._getPassRate(t)
      var isPass = passing[t] ? '达标' : '未达标'

      lines.push('  [' + PERF_TYPE_LABEL[t] + '] ' + isPass)
      lines.push('    目标: ' + formatMs(target))
      lines.push('    平均: ' + formatMs(avg) + ' | P50: ' + formatMs(p50)
        + ' | P95: ' + (p95 > 0 ? formatMs(p95) : 'N/A')
        + ' | P99: ' + (p99 > 0 ? formatMs(p99) : 'N/A'))
      lines.push('    最大: ' + formatMs(maxVal) + ' | 达标率: ' + passRate + '%')
      lines.push('    样本数: ' + this._getCount(t))
      lines.push('')
    }

    // 优化建议
    lines.push('── 优化建议 ──────────────────────────')
    for (var j = 0; j < optimizations.length; j++) {
      lines.push('  ' + (j + 1) + '. ' + optimizations[j])
    }
    lines.push('')

    // 总结
    lines.push('── 总结 ────────────────────────────')
    var allPass = this.checkAllPassing()
    if (allPass) {
      lines.push('  所有性能指标均达标，系统状态良好。')
    } else {
      var failTypes: string[] = []
      if (!passing.normalChart) failTypes.push('普通命盘')
      if (!passing.explain) failTypes.push('Explain')
      if (!passing.api) failTypes.push('API')
      lines.push('  存在 ' + failTypes.length + ' 项未达标：' + failTypes.join('、'))
    }
    lines.push('')
    lines.push('═══════════════════════════════════════════════')

    return {
      generatedAt: formatDateTime(new Date()),
      targets: this.getConfig(),
      current: current,
      passing: passing,
      optimizations: optimizations,
      report: lines.join('\n'),
      classicalRef: this._classicalRef
    }
  }

  /** 获取简短摘要 */
  getSummary(): string {
    var passing = this.checkPassing()
    var count = 0
    if (passing.normalChart) count++
    if (passing.explain) count++
    if (passing.api) count++
    return count + '/3 达标 | '
      + '命盘 ' + formatMs(this._getAverage('normalChart')) + ' / '
      + 'Explain ' + formatMs(this._getAverage('explain')) + ' / '
      + 'API ' + formatMs(this._getAverage('api'))
  }

  // ─── 高级功能 ──────────────────────────────────────

  /** 获取某类型的性能百分位分布 */
  getPercentiles(type: 'normalChart' | 'explain' | 'api'): {
    p50: number
    p90: number
    p95: number
    p99: number
    max: number
    count: number
  } {
    var records = this.getRecordsByType(type)
    if (records.length === 0) {
      return { p50: 0, p90: 0, p95: 0, p99: 0, max: 0, count: 0 }
    }
    var durations: number[] = []
    for (var i = 0; i < records.length; i++) {
      durations.push(records[i].duration)
    }
    durations.sort(function (a, b) { return a - b })
    var len = durations.length
    return {
      p50: durations[Math.floor(len * 0.50)],
      p90: durations[Math.floor(len * 0.90)],
      p95: durations[Math.floor(len * 0.95)],
      p99: durations[Math.floor(len * 0.99)],
      max: durations[len - 1],
      count: len
    }
  }

  /** 获取某类型的达标率 */
  getPassRate(type: 'normalChart' | 'explain' | 'api'): number {
    return this._getPassRate(type)
  }

  /** 检测是否存在性能退化（最近 10% 与之前 90% 对比） */
  detectDegradation(type: 'normalChart' | 'explain' | 'api'): {
    degraded: boolean
    recentAvg: number
    earlierAvg: number
    ratio: number
  } {
    var records = this.getRecordsByType(type)
    if (records.length < 20) {
      return { degraded: false, recentAvg: 0, earlierAvg: 0, ratio: 1 }
    }
    var splitIdx = Math.floor(records.length * 0.9)
    var earlier = records.slice(0, splitIdx)
    var recent = records.slice(splitIdx)

    var earlierSum = 0
    for (var i = 0; i < earlier.length; i++) {
      earlierSum += earlier[i].duration
    }
    var earlierAvg = safeDiv(earlierSum, earlier.length)

    var recentSum = 0
    for (var j = 0; j < recent.length; j++) {
      recentSum += recent[j].duration
    }
    var recentAvg = safeDiv(recentSum, recent.length)

    // 如果近期平均值超过早期 20%，认为存在退化
    var ratio = earlierAvg > 0 ? round2(safeDiv(recentAvg, earlierAvg)) : 1
    return {
      degraded: ratio > 1.2,
      recentAvg: round2(recentAvg),
      earlierAvg: round2(earlierAvg),
      ratio: ratio
    }
  }

  /** 设置并发数（外部注入） */
  setConcurrency(n: number): void {
    if (n < 0) {
      throw new Error('并发数不能为负数')
    }
    // 并发数记录在内部，报告时使用
    this._concurrencyValue = n
  }

  /** 内部并发数值 */
  private _concurrencyValue: number = 0

  /** 获取当前并发数 */
  getConcurrency(): number {
    return this._concurrencyValue
  }

  /** 检查并发是否达标 */
  checkConcurrencyPassing(): boolean {
    return this._concurrencyValue >= this._config.concurrencyTarget
  }
}

// ═══════════════════════════════════════════════════════════
// 导出便捷实例
// ═══════════════════════════════════════════════════════════

/** 全局默认实例 */
export var performanceOptEngine = new PerformanceOptEngine()
