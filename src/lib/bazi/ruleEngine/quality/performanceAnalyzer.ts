import type { PerformanceReport, RulePerformanceStat } from './types'
import type { RuleDefinition } from '../types'

/**
 * C8-4 Rule Performance（性能分析）
 *
 * 统计：
 * 1. 平均推演耗时
 * 2. 最慢规则
 * 3. 命中次数
 * 4. 引用次数
 */
export class PerformanceAnalyzer {
  /** 规则执行记录：ruleId → 耗时记录数组 */
  private executionRecords = new Map<string, Array<{ durationMs: number; hit: boolean }>>()
  /** Evidence 引用计数 */
  private evidenceRefCounts = new Map<string, number>()

  /** 记录一次规则执行 */
  recordExecution(ruleId: string, durationMs: number, hit: boolean): void {
    if (!this.executionRecords.has(ruleId)) {
      this.executionRecords.set(ruleId, [])
    }
    this.executionRecords.get(ruleId)!.push({ durationMs, hit })
  }

  /** 记录 Evidence 引用 */
  recordEvidenceRef(ruleId: string): void {
    this.evidenceRefCounts.set(ruleId, (this.evidenceRefCounts.get(ruleId) ?? 0) + 1)
  }

  /** 清空记录 */
  reset(): void {
    this.executionRecords.clear()
    this.evidenceRefCounts.clear()
  }

  /**
   * 生成性能报告
   * @param rules 规则列表（用于获取规则名称）
   */
  generateReport(rules: RuleDefinition[]): PerformanceReport {
    const generatedAt = new Date().toISOString()
    const ruleMap = new Map<string, RuleDefinition>()
    for (const r of rules) ruleMap.set(r.id, r)

    const allStats: RulePerformanceStat[] = []

    for (const [ruleId, records] of this.executionRecords) {
      const rule = ruleMap.get(ruleId)
      const durations = records.map(r => r.durationMs)
      const hitCount = records.filter(r => r.hit).length
      const totalExecutions = records.length
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
      const maxDuration = Math.max(...durations)
      const minDuration = Math.min(...durations)

      allStats.push({
        ruleId,
        ruleName: rule?.name ?? ruleId,
        avgDurationMs: Number(avgDuration.toFixed(3)),
        maxDurationMs: Number(maxDuration.toFixed(3)),
        minDurationMs: Number(minDuration.toFixed(3)),
        totalExecutions,
        hitCount,
        hitRate: totalExecutions > 0 ? Number((hitCount / totalExecutions).toFixed(4)) : 0,
        evidenceRefCount: this.evidenceRefCounts.get(ruleId) ?? 0,
      })
    }

    // 排序
    const sortedByAvg = [...allStats].sort((a, b) => b.avgDurationMs - a.avgDurationMs)
    const slowestRules = sortedByAvg.slice(0, 10)
    const fastestRules = [...sortedByAvg].reverse().slice(0, 10)

    const totalExecutions = allStats.reduce((sum, s) => sum + s.totalExecutions, 0)
    const totalAvgDuration = totalExecutions > 0
      ? allStats.reduce((sum, s) => sum + s.avgDurationMs * s.totalExecutions, 0) / totalExecutions
      : 0

    // 性能阈值建议
    const allDurations = allStats.flatMap(s => Array(s.totalExecutions).fill(s.avgDurationMs))
    const p95 = this.percentile(allDurations, 95)
    const thresholdSuggestion = {
      timeoutMs: Math.ceil(p95 * 3), // 3x p95
      totalTimeoutMs: Math.ceil(allStats.length * p95 * 0.5), // 总超时
    }

    return {
      generatedAt,
      totalRules: allStats.length,
      totalExecutions,
      avgDurationMs: Number(totalAvgDuration.toFixed(3)),
      slowestRules,
      fastestRules,
      allStats,
      thresholdSuggestion,
    }
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0
    const sorted = [...arr].sort((a, b) => a - b)
    const idx = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, idx)]
  }
}
