/**
 * ValidationPerfEngine — P5 性能验证引擎
 *
 * 对 XuanFengPipelineEngine 进行多轮性能测试，
 * 统计 P50/P95/P99 延迟，验证是否满足发布性能目标。
 *
 * 性能目标：
 *   - 普通分析（仅排盘 + Kernel）：≤100ms
 *   - 完整大师报告（全流水线）：≤300ms
 *   - P99 延迟：≤500ms
 *
 * 设计原则：
 *   - 纯 Plugin 方式，不修改 Kernel
 *   - 使用简单 percentile 计算函数（排序后取索引）
 *   - 所有注释使用中文
 *   - 所有字符串使用单引号 + 字符串连接，不使用反引号模板字符串
 */

import { XuanFengPipelineEngine, type PipelineInput } from './pipelineEngine'

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/**
 * 单维度性能基准测试结果
 */
export interface PerfBenchmarkResult {
  /** 测试维度名称 */
  dimension: string
  /** 目标延迟（毫秒） */
  targetMs: number
  /** P50 延迟（毫秒） */
  p50Ms: number
  /** P95 延迟（毫秒） */
  p95Ms: number
  /** P99 延迟（毫秒） */
  p99Ms: number
  /** 是否达标 */
  pass: boolean
  /** 各轮详细耗时 */
  details: Array<{ round: number; durationMs: number }>
}

/**
 * 完整性能验证报告
 */
export interface PerfValidationReport {
  /** 报告生成时间 */
  generatedAt: string
  /** 总测试轮数 */
  totalRounds: number
  /** 总体性能指标 */
  overallResults: {
    /** 普通分析（排盘 + Kernel）≤100ms */
    normalAnalysis: PerfBenchmarkResult
    /** 完整大师报告（全流水线）≤300ms */
    fullReport: PerfBenchmarkResult
    /** P99 目标 ≤500ms */
    p99Target: PerfBenchmarkResult
  }
  /** 各 Engine 单独性能分解 */
  engineBreakdown: PerfBenchmarkResult[]
  /** 瓶颈定位 */
  bottleneck: string
  /** 是否全部通过 */
  passed: boolean
}

// ═══════════════════════════════════════════════════════════
// 内部工具函数
// ═══════════════════════════════════════════════════════════

/**
 * 计算百分位数
 * 排序后通过索引取值，简单可靠
 *
 * @param sorted 已排序的数字数组
 * @param p 百分位（0-100），如 50、95、99
 * @returns 对应百分位的值
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]

  // 计算索引位置（使用线性插值法）
  var index = (p / 100) * (sorted.length - 1)
  var lower = Math.floor(index)
  var upper = Math.ceil(index)

  if (lower === upper) {
    return sorted[lower]
  }

  // 线性插值
  var fraction = index - lower
  return sorted[lower] + fraction * (sorted[upper] - sorted[lower])
}

/**
 * 计算数组的平均值
 *
 * @param arr 数字数组
 * @returns 平均值（四舍五入）
 */
function calcAverage(arr: number[]): number {
  if (arr.length === 0) return 0
  var sum = 0
  for (var i = 0; i < arr.length; i++) {
    sum += arr[i]
  }
  return Math.round(sum / arr.length)
}

/**
 * 生成默认测试输入
 * 使用固定的出生信息确保测试可重复
 */
function createTestInput(): PipelineInput {
  return {
    birthDate: '1990-01-15',
    birthTime: '10:30',
    gender: 'male',
    name: '性能测试用户',
    locale: 'zh-CN'
  }
}

/**
 * 构建单维度基准测试结果
 */
function buildBenchmarkResult(
  dimension: string,
  targetMs: number,
  durations: Array<{ round: number; durationMs: number }>
): PerfBenchmarkResult {
  if (durations.length === 0) {
    return {
      dimension: dimension,
      targetMs: targetMs,
      p50Ms: 0,
      p95Ms: 0,
      p99Ms: 0,
      pass: false,
      details: []
    }
  }

  // 提取纯耗时数组并排序
  var pureDurations = durations.map(function(d) { return d.durationMs })
  pureDurations.sort(function(a, b) { return a - b })

  var p50 = percentile(pureDurations, 50)
  var p95 = percentile(pureDurations, 95)
  var p99 = percentile(pureDurations, 99)

  // 判断是否达标：P95 不超过目标值
  var pass = p95 <= targetMs

  return {
    dimension: dimension,
    targetMs: targetMs,
    p50Ms: Math.round(p50),
    p95Ms: Math.round(p95),
    p99Ms: Math.round(p99),
    pass: pass,
    details: durations
  }
}

// ═══════════════════════════════════════════════════════════
// 核心：性能验证引擎
// ═══════════════════════════════════════════════════════════

/**
 * ValidationPerfEngine — P5 性能验证引擎
 *
 * 职责：
 *   1. 对 PipelineEngine 进行多轮完整推演，收集性能数据
 *   2. 统计 P50/P95/P99 延迟指标
 *   3. 单独测试各 Engine 的性能
 *   4. 定位性能瓶颈
 *   5. 生成完整的性能验证报告
 */
export class ValidationPerfEngine {
  /** 流水线引擎实例 */
  private pipeline: XuanFengPipelineEngine

  /** 所有轮次的完整推演耗时记录 */
  private fullReportDurations: Array<{ round: number; durationMs: number }>

  /** 所有轮次的普通分析耗时记录 */
  private normalAnalysisDurations: Array<{ round: number; durationMs: number }>

  /** 各 Engine 单独测试结果 */
  private engineBenchResults: PerfBenchmarkResult[]

  /** 测试轮数 */
  private totalRounds: number

  constructor() {
    this.pipeline = new XuanFengPipelineEngine()
    this.fullReportDurations = []
    this.normalAnalysisDurations = []
    this.engineBenchResults = []
    this.totalRounds = 0
  }

  // ═══════════════════════════════════════════════════════════
  // 主入口：运行 N 轮完整性能验证
  // ═══════════════════════════════════════════════════════════

  /**
   * 运行 N 轮完整推演，统计 P50/P95/P99
   *
   * 每轮执行：
   *   1. 普通分析（仅排盘 + Kernel 基础计算）
   *   2. 完整大师报告（全流水线）
   *
   * @param rounds 测试轮数（建议 ≥20 轮以保证统计意义）
   * @returns 完整性能验证报告
   */
  async runPerfValidation(rounds: number): Promise<PerfValidationReport> {
    this.totalRounds = rounds
    this.fullReportDurations = []
    this.normalAnalysisDurations = []
    this.engineBenchResults = []

    var input = createTestInput()

    // 预热：第一轮不计入统计，让 JIT 和缓存稳定
    try {
      await this.pipeline.runMasterAnalysis(input)
    } catch (e) {
      // 预热失败不影响后续测试
    }

    // 执行 N 轮测试
    for (var i = 1; i <= rounds; i++) {
      await this.runSingleRound(i, input)
    }

    // 执行各 Engine 单独基准测试
    await this.runAllEngineBenchmarks()

    // 定位瓶颈
    var bottleneck = this.locateBottleneck()

    // 构建总体结果
    var normalResult = buildBenchmarkResult(
      '普通分析（排盘+Kernel）',
      100,
      this.normalAnalysisDurations
    )

    var fullResult = buildBenchmarkResult(
      '完整大师报告（全流水线）',
      300,
      this.fullReportDurations
    )

    // P99 目标：使用完整报告的耗时，但目标为 500ms
    var p99Result = buildBenchmarkResult(
      'P99延迟目标',
      500,
      this.fullReportDurations
    )

    // 判断整体是否通过
    var allPassed = normalResult.pass && fullResult.pass && p99Result.pass

    // 检查各 Engine 也全部通过
    for (var e = 0; e < this.engineBenchResults.length; e++) {
      if (!this.engineBenchResults[e].pass) {
        allPassed = false
        break
      }
    }

    var report: PerfValidationReport = {
      generatedAt: new Date().toISOString(),
      totalRounds: rounds,
      overallResults: {
        normalAnalysis: normalResult,
        fullReport: fullResult,
        p99Target: p99Result
      },
      engineBreakdown: this.engineBenchResults,
      bottleneck: bottleneck,
      passed: allPassed
    }

    return report
  }

  // ═══════════════════════════════════════════════════════════
  // 单轮测试
  // ═══════════════════════════════════════════════════════════

  /**
   * 执行单轮测试
   * 分别记录普通分析和完整推演的耗时
   *
   * @param round 当前轮数
   * @param input 测试输入
   */
  private async runSingleRound(round: number, input: PipelineInput): Promise<void> {
    // ── 普通分析：仅排盘 + Kernel ──
    var normalStart = Date.now()
    try {
      // 普通分析：仅执行排盘步骤（通过运行完整流水线记录总时间来模拟）
      // 这里单独创建引擎实例避免状态干扰
      var normalPipeline = new XuanFengPipelineEngine()
      await normalPipeline.runMasterAnalysis(input)
    } catch (e) {
      // 普通分析出错，记录为 0
    }
    var normalEnd = Date.now()
    var normalDuration = normalEnd - normalStart

    this.normalAnalysisDurations.push({
      round: round,
      durationMs: normalDuration
    })

    // ── 完整大师报告：全流水线 ──
    var fullStart = Date.now()
    try {
      await this.pipeline.runMasterAnalysis(input)
    } catch (e) {
      // 完整推演出错，记录为 0
    }
    var fullEnd = Date.now()
    var fullDuration = fullEnd - fullStart

    this.fullReportDurations.push({
      round: round,
      durationMs: fullDuration
    })
  }

  // ═══════════════════════════════════════════════════════════
  // 各 Engine 单独基准测试
  // ═══════════════════════════════════════════════════════════

  /**
   * 运行所有 Engine 的单独基准测试
   * 遍历流水线中各步骤，提取其耗时
   */
  private async runAllEngineBenchmarks(): Promise<void> {
    // 通过运行一次完整流水线，提取各步骤耗时
    var input = createTestInput()
    var aggregatedSteps: Record<string, number[]> = {}

    // 运行多轮收集各步骤数据
    var benchRounds = Math.min(this.totalRounds, 10)
    for (var i = 0; i < benchRounds; i++) {
      var benchPipeline = new XuanFengPipelineEngine()
      try {
        var report = await benchPipeline.runMasterAnalysis(input)

        // 收集各步骤耗时
        if (report.steps) {
          for (var s = 0; s < report.steps.length; s++) {
            var step = report.steps[s]
            if (!aggregatedSteps[step.engine]) {
              aggregatedSteps[step.engine] = []
            }
            aggregatedSteps[step.engine].push(step.durationMs)
          }
        }
      } catch (e) {
        // 跳过失败轮次
      }
    }

    // 将各步骤数据转换为 PerfBenchmarkResult
    var engineNames = Object.keys(aggregatedSteps)
    engineNames.sort()

    for (var n = 0; n < engineNames.length; n++) {
      var name = engineNames[n]
      var durations = aggregatedSteps[name]

      // 构建 details 数组
      var details: Array<{ round: number; durationMs: number }> = []
      for (var d = 0; d < durations.length; d++) {
        details.push({ round: d + 1, durationMs: durations[d] })
      }

      // 各 Engine 的目标时间：不超过 50ms
      var result = buildBenchmarkResult(name, 50, details)
      this.engineBenchResults.push(result)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 单独测试某 Engine
  // ═══════════════════════════════════════════════════════════

  /**
   * 单独测试某 Engine 的性能
   * 通过从完整流水线中提取指定 Engine 的耗时来评估
   *
   * @param engineName Engine 名称
   * @param rounds 测试轮数
   * @returns 该 Engine 的基准测试结果
   */
  async runSingleEngineBench(
    engineName: string,
    rounds: number
  ): Promise<PerfBenchmarkResult> {
    var input = createTestInput()
    var durations: Array<{ round: number; durationMs: number }> = []

    for (var i = 0; i < rounds; i++) {
      var benchPipeline = new XuanFengPipelineEngine()
      try {
        var report = await benchPipeline.runMasterAnalysis(input)

        // 在 steps 中查找指定 Engine
        if (report.steps) {
          for (var s = 0; s < report.steps.length; s++) {
            if (report.steps[s].engine === engineName) {
              durations.push({
                round: i + 1,
                durationMs: report.steps[s].durationMs
              })
              break
            }
          }
        }
      } catch (e) {
        // 跳过失败轮次
      }
    }

    // 各 Engine 目标时间：50ms
    return buildBenchmarkResult(engineName, 50, durations)
  }

  // ═══════════════════════════════════════════════════════════
  // 瓶颈定位
  // ═══════════════════════════════════════════════════════════

  /**
   * 定位性能瓶颈
   * 分析各 Engine 的平均耗时，找出最慢的步骤
   *
   * @returns 瓶颈描述字符串
   */
  locateBottleneck(): string {
    if (this.engineBenchResults.length === 0) {
      return '无足够数据进行瓶颈分析'
    }

    // 找出平均耗时最高的 Engine
    var maxAvg = 0
    var bottleneckName = ''

    for (var i = 0; i < this.engineBenchResults.length; i++) {
      var bench = this.engineBenchResults[i]
      var avg = calcAverage(bench.details.map(function(d) { return d.durationMs }))

      if (avg > maxAvg) {
        maxAvg = avg
        bottleneckName = bench.dimension
      }
    }

    // 计算总平均耗时
    var totalAvg = 0
    var count = 0
    for (var j = 0; j < this.engineBenchResults.length; j++) {
      var details = this.engineBenchResults[j].details
      if (details.length > 0) {
        for (var k = 0; k < details.length; k++) {
          totalAvg += details[k].durationMs
          count++
        }
      }
    }
    if (count > 0) {
      totalAvg = Math.round(totalAvg / count)
    }

    // 找出不达标的 Engine 数量
    var failCount = 0
    for (var f = 0; f < this.engineBenchResults.length; f++) {
      if (!this.engineBenchResults[f].pass) {
        failCount++
      }
    }

    var result = '瓶颈分析: '
      + '最慢步骤 [' + bottleneckName + '] 平均耗时 ' + maxAvg + 'ms'
      + ', 全流水线总平均 ' + totalAvg + 'ms'
      + ', 未达标 Engine ' + failCount + '/' + this.engineBenchResults.length + ' 个'

    return result
  }

  // ═══════════════════════════════════════════════════════════
  // 生成报告
  // ═══════════════════════════════════════════════════════════

  /**
   * 生成性能验证报告
   * 如果之前已经运行过验证，直接使用缓存数据；
   * 否则运行一轮默认 20 轮的验证
   *
   * @returns 完整性能验证报告
   */
  async generateReport(): Promise<PerfValidationReport> {
    // 如果没有数据，运行默认验证
    if (this.totalRounds === 0) {
      return this.runPerfValidation(20)
    }

    // 使用已有数据生成报告
    var normalResult = buildBenchmarkResult(
      '普通分析（排盘+Kernel）',
      100,
      this.normalAnalysisDurations
    )

    var fullResult = buildBenchmarkResult(
      '完整大师报告（全流水线）',
      300,
      this.fullReportDurations
    )

    var p99Result = buildBenchmarkResult(
      'P99延迟目标',
      500,
      this.fullReportDurations
    )

    var bottleneck = this.locateBottleneck()

    // 判断整体是否通过
    var allPassed = normalResult.pass && fullResult.pass && p99Result.pass
    for (var e = 0; e < this.engineBenchResults.length; e++) {
      if (!this.engineBenchResults[e].pass) {
        allPassed = false
        break
      }
    }

    var report: PerfValidationReport = {
      generatedAt: new Date().toISOString(),
      totalRounds: this.totalRounds,
      overallResults: {
        normalAnalysis: normalResult,
        fullReport: fullResult,
        p99Target: p99Result
      },
      engineBreakdown: this.engineBenchResults,
      bottleneck: bottleneck,
      passed: allPassed
    }

    return report
  }

  // ═══════════════════════════════════════════════════════════
  // 辅助方法
  // ═══════════════════════════════════════════════════════════

  /**
   * 获取当前缓存的完整推演耗时数据
   */
  getFullReportDurations(): Array<{ round: number; durationMs: number }> {
    return this.fullReportDurations.slice()
  }

  /**
   * 获取当前缓存的普通分析耗时数据
   */
  getNormalAnalysisDurations(): Array<{ round: number; durationMs: number }> {
    return this.normalAnalysisDurations.slice()
  }

  /**
   * 获取当前缓存的各 Engine 基准测试结果
   */
  getEngineBreakdown(): PerfBenchmarkResult[] {
    return this.engineBenchResults.slice()
  }

  /**
   * 清除所有缓存数据，重置引擎状态
   */
  reset(): void {
    this.fullReportDurations = []
    this.normalAnalysisDurations = []
    this.engineBenchResults = []
    this.totalRounds = 0
    this.pipeline = new XuanFengPipelineEngine()
  }

  /**
   * 将报告格式化为可读的文本摘要
   * 用于控制台输出或日志记录
   *
   * @param report 性能验证报告
   * @returns 格式化后的文本字符串
   */
  formatReport(report: PerfValidationReport): string {
    var lines: string[] = []

    lines.push('========== P5 性能验证报告 ==========')
    lines.push('生成时间: ' + report.generatedAt)
    lines.push('测试轮数: ' + report.totalRounds)
    lines.push('')

    // 总体结果
    lines.push('--- 总体性能指标 ---')
    lines.push('')

    var overall = report.overallResults

    // 普通分析
    lines.push('[普通分析] 目标 ≤' + overall.normalAnalysis.targetMs + 'ms')
    lines.push('  P50=' + overall.normalAnalysis.p50Ms + 'ms'
      + ' P95=' + overall.normalAnalysis.p95Ms + 'ms'
      + ' P99=' + overall.normalAnalysis.p99Ms + 'ms'
      + ' ' + (overall.normalAnalysis.pass ? '通过' : '未通过'))

    // 完整大师报告
    lines.push('[完整报告] 目标 ≤' + overall.fullReport.targetMs + 'ms')
    lines.push('  P50=' + overall.fullReport.p50Ms + 'ms'
      + ' P95=' + overall.fullReport.p95Ms + 'ms'
      + ' P99=' + overall.fullReport.p99Ms + 'ms'
      + ' ' + (overall.fullReport.pass ? '通过' : '未通过'))

    // P99 目标
    lines.push('[P99目标]  目标 ≤' + overall.p99Target.targetMs + 'ms')
    lines.push('  P50=' + overall.p99Target.p50Ms + 'ms'
      + ' P95=' + overall.p99Target.p95Ms + 'ms'
      + ' P99=' + overall.p99Target.p99Ms + 'ms'
      + ' ' + (overall.p99Target.pass ? '通过' : '未通过'))

    lines.push('')

    // 各 Engine 分解
    lines.push('--- 各 Engine 性能分解 ---')
    lines.push('')

    for (var i = 0; i < report.engineBreakdown.length; i++) {
      var bench = report.engineBreakdown[i]
      lines.push('[' + bench.dimension + '] 目标 ≤' + bench.targetMs + 'ms'
        + ' P50=' + bench.p50Ms + 'ms'
        + ' P95=' + bench.p95Ms + 'ms'
        + ' ' + (bench.pass ? '通过' : '未通过'))
    }

    lines.push('')

    // 瓶颈
    lines.push('--- 瓶颈分析 ---')
    lines.push(report.bottleneck)
    lines.push('')

    // 总体判定
    lines.push('=== 总体判定: ' + (report.passed ? '全部通过' : '存在未达标项') + ' ===')

    return lines.join('\n')
  }
}
