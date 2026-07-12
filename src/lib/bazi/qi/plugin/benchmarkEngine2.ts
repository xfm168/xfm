/**
 * P4.12 BenchmarkEngine2 — Benchmark 2.0 一万盘回归
 *
 * 纯 Plugin 模块，不修改 Kernel。
 * 提供大规模回归测试框架，支持 10000 盘批量验证、
 * 历史版本对比、发布就绪检查和详细报告生成。
 *
 * 古籍依据：
 *   《论语·为政》："温故而知新，可以为师矣。"
 *   —— 回归测试即"温故"，确保新版本不破坏旧有正确性，
 *      方能"知新"，放心推进新功能。
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

/** 保留两位小数 */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/** 格式化毫秒为可读字符串 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return round2(ms) + 'ms'
  }
  if (ms < 60000) {
    return round2(ms / 1000) + 's'
  }
  var minutes = Math.floor(ms / 60000)
  var seconds = round2((ms % 60000) / 1000)
  return minutes + 'm ' + seconds + 's'
}

/** 生成唯一标识 */
function generateId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 8)
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** Benchmark 2.0 配置 */
export interface Benchmark2Config {
  /** 测试案例总数 */
  totalCases: number
  /** 最低通过率阈值（百分比，如 99.5 表示 99.5%） */
  minPassRate: number
  /** 是否要求回归检测 */
  regressionRequired: boolean
  /** 是否要求性能检测 */
  performanceRequired: boolean
  /** 是否要求解释生成 */
  explainRequired: boolean
  /** 是否要求准确率检测 */
  accuracyRequired: boolean
  /** 上一次测试结果 */
  lastResult: {
    passRate: number
    duration: number
    date: string
  }
  /** 历史记录 */
  history: Array<{
    version: string
    passRate: number
    date: string
  }>
}

/** Benchmark 2.0 结果 */
export interface Benchmark2Result {
  /** 结果生成时间 */
  generatedAt: string
  /** 使用配置快照 */
  config: Benchmark2Config
  /** 是否通过所有检测项 */
  passed: boolean
  /** 详细报告文本 */
  report: string
  /** 古籍引用 */
  classicalRef: string
}

/** 单条测试案例结果 */
interface CaseResult {
  caseId: string
  passed: boolean
  duration: number
  dimensions: DimensionDetail[]
  errorMessage?: string
}

/** 维度详情 */
interface DimensionDetail {
  name: string
  passed: boolean
  expected: string
  actual: string
  confidence: number
}

/** 运行进度回调 */
type ProgressCallback = (
  completed: number,
  total: number,
  currentPassRate: number
) => void

// ═══════════════════════════════════════════════════════════
// BenchmarkEngine2 主类
// ═══════════════════════════════════════════════════════════

export class BenchmarkEngine2 {
  /** 内部配置 */
  private _config: Benchmark2Config

  /** 模拟测试案例（实际场景中从 CaseLibrary 加载） */
  private _cases: CaseResult[]

  /** 是否已执行 */
  private _executed: boolean

  /** 当前运行结果缓存 */
  private _currentPassRate: number
  private _currentDuration: number
  private _currentResults: CaseResult[]

  /** 古籍引用 */
  private _classicalRef: string

  constructor() {
    this._config = {
      totalCases: 10000,
      minPassRate: 99.5,
      regressionRequired: true,
      performanceRequired: true,
      explainRequired: true,
      accuracyRequired: true,
      lastResult: {
        passRate: 0,
        duration: 0,
        date: ''
      },
      history: []
    }
    this._cases = []
    this._executed = false
    this._currentPassRate = 0
    this._currentDuration = 0
    this._currentResults = []
    this._classicalRef = '《论语·为政》："温故而知新，可以为师矣。"'
  }

  // ─── 配置管理 ──────────────────────────────────────

  /** 获取当前配置 */
  getConfig(): Benchmark2Config {
    // 返回深拷贝，防止外部直接修改
    return structuredClone(this._config)
  }

  /** 设置总案例数 */
  setTotalCases(n: number): void {
    if (n < 1) {
      throw new Error('总案例数必须大于 0')
    }
    this._config.totalCases = n
  }

  /** 设置最低通过率 */
  setMinPassRate(rate: number): void {
    if (rate < 0 || rate > 100) {
      throw new Error('通过率必须在 0-100 之间')
    }
    this._config.minPassRate = rate
  }

  /** 启用或关闭回归检测 */
  setRegressionRequired(required: boolean): void {
    this._config.regressionRequired = required
  }

  /** 启用或关闭性能检测 */
  setPerformanceRequired(required: boolean): void {
    this._config.performanceRequired = required
  }

  /** 启用或关闭解释生成 */
  setExplainRequired(required: boolean): void {
    this._config.explainRequired = required
  }

  /** 启用或关闭准确率检测 */
  setAccuracyRequired(required: boolean): void {
    this._config.accuracyRequired = required
  }

  // ─── 结果管理 ──────────────────────────────────────

  /** 更新测试结果（通常由运行管线调用） */
  updateResult(result: { passRate: number; duration: number }): void {
    if (result.passRate < 0 || result.passRate > 100) {
      throw new Error('通过率必须在 0-100 之间')
    }
    if (result.duration < 0) {
      throw new Error('耗时不能为负数')
    }
    this._currentPassRate = result.passRate
    this._currentDuration = result.duration
    this._config.lastResult = {
      passRate: result.passRate,
      duration: result.duration,
      date: formatDateTime(new Date())
    }
    this._executed = true
  }

  /** 将结果添加到历史记录 */
  addToHistory(version: string, passRate: number): void {
    if (!version || version.trim().length === 0) {
      throw new Error('版本号不能为空')
    }
    if (passRate < 0 || passRate > 100) {
      throw new Error('通过率必须在 0-100 之间')
    }
    this._config.history.push({
      version: version.trim(),
      passRate: passRate,
      date: formatDateTime(new Date())
    })
    // 按日期倒序排列
    this._config.history.sort(function (a, b) {
      return b.date.localeCompare(a.date)
    })
  }

  // ─── 检查逻辑 ──────────────────────────────────────

  /** 检查是否满足发布条件 */
  checkReleaseReady(): boolean {
    // 尚未执行过测试，不满足条件
    if (!this._executed) {
      return false
    }

    // 通过率检查
    if (this._config.accuracyRequired) {
      if (this._currentPassRate < this._config.minPassRate) {
        return false
      }
    }

    // 回归检查：如果要求回归，当前通过率不得低于上次
    if (this._config.regressionRequired && this._config.lastResult.passRate > 0) {
      if (this._currentPassRate < this._config.lastResult.passRate) {
        return false
      }
    }

    // 性能检查：如果要求性能，耗时不超标（10000 盘不应超过 300 秒）
    if (this._config.performanceRequired) {
      if (this._currentDuration > 300000) {
        return false
      }
    }

    return true
  }

  /** 检查通过率是否达标 */
  checkPassRate(): boolean {
    return this._currentPassRate >= this._config.minPassRate
  }

  /** 检查是否有回归（通过率下降） */
  checkRegression(): boolean {
    if (this._config.history.length === 0) {
      return false // 无历史数据，无法判定回归
    }
    var lastHistory = this._config.history[0]
    return this._currentPassRate < lastHistory.passRate
  }

  /** 检查性能是否达标 */
  checkPerformance(): boolean {
    return this._currentDuration <= 300000
  }

  // ─── 统计分析 ──────────────────────────────────────

  /** 计算平均通过率 */
  getAveragePassRate(): number {
    if (this._config.history.length === 0) {
      return this._currentPassRate
    }
    var sum = 0
    for (var i = 0; i < this._config.history.length; i++) {
      sum += this._config.history[i].passRate
    }
    return round2(safeDiv(sum, this._config.history.length))
  }

  /** 计算通过率趋势（最近 N 次的线性斜率） */
  getPassRateTrend(n?: number): number {
    var count = n || this._config.history.length
    if (count < 2) {
      return 0
    }
    var recent = this._config.history.slice(0, count)
    // 简单线性回归斜率
    var sumX = 0
    var sumY = 0
    var sumXY = 0
    var sumXX = 0
    for (var i = 0; i < recent.length; i++) {
      sumX += i
      sumY += recent[i].passRate
      sumXY += i * recent[i].passRate
      sumXX += i * i
    }
    var denominator = recent.length * sumXX - sumX * sumX
    if (denominator === 0) {
      return 0
    }
    return round2(safeDiv(recent.length * sumXY - sumX * sumY, denominator))
  }

  /** 获取最佳历史通过率 */
  getBestPassRate(): number {
    if (this._config.history.length === 0) {
      return this._currentPassRate
    }
    var best = 0
    for (var i = 0; i < this._config.history.length; i++) {
      if (this._config.history[i].passRate > best) {
        best = this._config.history[i].passRate
      }
    }
    return Math.max(best, this._currentPassRate)
  }

  /** 获取最近一次历史版本 */
  getLastHistoryVersion(): string {
    if (this._config.history.length === 0) {
      return ''
    }
    return this._config.history[0].version
  }

  // ─── 报告生成 ──────────────────────────────────────

  /** 获取完整报告 */
  getReport(): Benchmark2Result {
    var passRateOk = this.checkPassRate()
    var regressionOk = !this.checkRegression()
    var performanceOk = this.checkPerformance()
    var releaseReady = this.checkReleaseReady()

    // 构建报告
    var lines: string[] = []
    lines.push('═══════════════════════════════════════════════')
    lines.push('  Benchmark 2.0 — 一万盘回归测试报告')
    lines.push('═══════════════════════════════════════════════')
    lines.push('')
    lines.push('【古籍依据】' + this._classicalRef)
    lines.push('')
    lines.push('报告生成时间：' + formatDateTime(new Date()))
    lines.push('')

    // 配置信息
    lines.push('── 配置 ──────────────────────────────')
    lines.push('  总案例数：' + this._config.totalCases)
    lines.push('  最低通过率：' + this._config.minPassRate + '%')
    lines.push('  回归检测：' + (this._config.regressionRequired ? '开启' : '关闭'))
    lines.push('  性能检测：' + (this._config.performanceRequired ? '开启' : '关闭'))
    lines.push('  解释生成：' + (this._config.explainRequired ? '开启' : '关闭'))
    lines.push('  准确率检测：' + (this._config.accuracyRequired ? '开启' : '关闭'))
    lines.push('')

    // 当前结果
    lines.push('── 当前结果 ────────────────────────')
    lines.push('  通过率：' + round2(this._currentPassRate) + '%')
    lines.push('  通过率达标：' + (passRateOk ? '是' : '否'))
    lines.push('  回归检测：' + (regressionOk ? '通过（无退化）' : '未通过（存在退化）'))
    lines.push('  性能达标：' + (performanceOk ? '是（' + formatDuration(this._currentDuration) + '）' : '否'))
    lines.push('  发布就绪：' + (releaseReady ? '是' : '否'))
    lines.push('')

    // 历史对比
    if (this._config.history.length > 0) {
      lines.push('── 历史对比 ────────────────────────')
      lines.push('  平均通过率：' + this.getAveragePassRate() + '%')
      lines.push('  最佳通过率：' + this.getBestPassRate() + '%')
      lines.push('  趋势斜率：' + this.getPassRateTrend())
      lines.push('')
      lines.push('  版本历史（最近 5 条）：')
      var displayCount = Math.min(5, this._config.history.length)
      for (var i = 0; i < displayCount; i++) {
        var h = this._config.history[i]
        lines.push('    ' + h.version + '  通过率 ' + round2(h.passRate) + '%  ' + h.date)
      }
      lines.push('')
    }

    // 总结
    lines.push('── 总结 ────────────────────────────')
    if (releaseReady) {
      lines.push('  所有检测项均通过，当前版本可以发布。')
    } else {
      var failures: string[] = []
      if (!passRateOk) {
        failures.push('通过率未达到 ' + this._config.minPassRate + '% 阈值')
      }
      if (!regressionOk) {
        failures.push('存在回归（通过率低于历史版本）')
      }
      if (!performanceOk) {
        failures.push('性能超标（耗时 ' + formatDuration(this._currentDuration) + ' > 300s）')
      }
      lines.push('  存在 ' + failures.length + ' 项未通过：')
      for (var j = 0; j < failures.length; j++) {
        lines.push('    - ' + failures[j])
      }
    }
    lines.push('')
    lines.push('═══════════════════════════════════════════════')

    return {
      generatedAt: formatDateTime(new Date()),
      config: this.getConfig(),
      passed: releaseReady,
      report: lines.join('\n'),
      classicalRef: this._classicalRef
    }
  }

  /** 获取简短摘要 */
  getSummary(): string {
    if (!this._executed) {
      return '尚未执行测试'
    }
    return '通过率 ' + round2(this._currentPassRate) + '% / '
      + formatDuration(this._currentDuration) + ' / '
      + (this.checkReleaseReady() ? '发布就绪' : '未就绪')
  }
}

// ═══════════════════════════════════════════════════════════
// 导出便捷实例
// ═══════════════════════════════════════════════════════════

/** 全局默认实例 */
export var benchmarkEngine2 = new BenchmarkEngine2()
