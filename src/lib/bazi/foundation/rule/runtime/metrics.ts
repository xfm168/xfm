// 规则运行时指标 —— 每条规则自动统计 Hit/Miss/Conflict/Latency/Accuracy
// 以后 Rule 可以自动排序、自动淘汰

// ============================================================
// 类型定义
// ============================================================

/** 单条规则运行时指标（原始累计值） */
export interface RuleMetric {
  /** 规则 ID */
  ruleId: string
  /** 命中次数（条件满足） */
  hitCount: number
  /** 未命中次数 */
  missCount: number
  /** 冲突次数 */
  conflictCount: number
  /** 总耗时（毫秒） */
  totalLatencyMs: number
  /** 执行总次数 */
  executionCount: number
  /** 准确率样本数 */
  accuracySamples: number
  /** 准确命中数 */
  accuracyHits: number
  /** 最后执行时间戳 */
  lastExecutedAt?: number
  /** 最后一次执行耗时（毫秒） */
  lastLatencyMs?: number
}

/** 规则指标汇总（派生值） */
export interface RuleMetricsSummary {
  /** 规则 ID */
  ruleId: string
  /** 命中率 = hitCount / executionCount */
  hitRate: number
  /** 未命中率 = missCount / executionCount */
  missRate: number
  /** 冲突率 = conflictCount / executionCount */
  conflictRate: number
  /** 平均耗时（毫秒） */
  avgLatencyMs: number
  /** 准确率 = accuracyHits / accuracySamples */
  accuracy: number
  /** 综合评分 = hitRate * 0.3 + accuracy * 0.5 + (1 - conflictRate) * 0.2 */
  score: number
  /** 建议：keep / review / deprecate */
  recommendation: 'keep' | 'review' | 'deprecate'
}

// ============================================================
// RuleMetricsCollector 类
// ============================================================

/**
 * 规则运行时指标收集器
 *
 * 自动统计每条规则的 Hit/Miss/Conflict/Latency/Accuracy，
 * 用于规则自动排序与自动淘汰。
 */
export class RuleMetricsCollector {
  /** 指标表：ruleId → RuleMetric */
  private metrics = new Map<string, RuleMetric>()

  /** 取得或初始化某规则的指标 */
  private getOrCreate(ruleId: string): RuleMetric {
    let m = this.metrics.get(ruleId)
    if (!m) {
      m = {
        ruleId,
        hitCount: 0,
        missCount: 0,
        conflictCount: 0,
        totalLatencyMs: 0,
        executionCount: 0,
        accuracySamples: 0,
        accuracyHits: 0,
      }
      this.metrics.set(ruleId, m)
    }
    return m
  }

  /** 记录一次执行：累加 hit/miss，更新耗时 */
  recordExecution(ruleId: string, hit: boolean, latencyMs: number): void {
    const m = this.getOrCreate(ruleId)
    m.executionCount += 1
    if (hit) m.hitCount += 1
    else m.missCount += 1
    m.totalLatencyMs += latencyMs
    m.lastLatencyMs = latencyMs
    m.lastExecutedAt = Date.now()
  }

  /** 记录一次冲突 */
  recordConflict(ruleId: string): void {
    const m = this.getOrCreate(ruleId)
    m.conflictCount += 1
  }

  /** 记录一次准确率样本 */
  recordAccuracy(ruleId: string, correct: boolean): void {
    const m = this.getOrCreate(ruleId)
    m.accuracySamples += 1
    if (correct) m.accuracyHits += 1
  }

  /** 获取原始指标 */
  getMetric(ruleId: string): RuleMetric | undefined {
    return this.metrics.get(ruleId)
  }

  /** 获取汇总（派生值） */
  getSummary(ruleId: string): RuleMetricsSummary | undefined {
    const m = this.metrics.get(ruleId)
    if (!m) return undefined
    return this.toSummary(m)
  }

  /** 所有规则的汇总，按 score 降序 */
  getAllSummaries(): RuleMetricsSummary[] {
    const summaries: RuleMetricsSummary[] = []
    for (const m of this.metrics.values()) summaries.push(this.toSummary(m))
    summaries.sort((a, b) => b.score - a.score)
    return summaries
  }

  /** 取得分最高的若干规则 */
  getTopRules(limit?: number): RuleMetricsSummary[] {
    const all = this.getAllSummaries()
    return typeof limit === 'number' ? all.slice(0, Math.max(0, limit)) : all
  }

  /** 取表现不佳的规则（score < threshold，默认 0.3），recommendation = deprecate */
  getUnderperforming(threshold: number = 0.3): RuleMetricsSummary[] {
    return this.getAllSummaries().filter(s => s.score < threshold && s.recommendation === 'deprecate')
  }

  /** 重置：传 ruleId 重置单条，不传重置全部 */
  reset(ruleId?: string): void {
    if (ruleId) this.metrics.delete(ruleId)
    else this.metrics.clear()
  }

  /** 导出全部指标（用于持久化） */
  exportMetrics(): RuleMetric[] {
    return Array.from(this.metrics.values())
  }

  /** 导入指标（覆盖） */
  importMetrics(data: RuleMetric[]): void {
    for (const d of data) {
      this.metrics.set(d.ruleId, { ...d })
    }
  }

  /** 排名：返回 { rank, ruleId, score, recommendation }[] */
  ranking(): { rank: number; ruleId: string; score: number; recommendation: string }[] {
    const all = this.getAllSummaries()
    return all.map((s, idx) => ({
      rank: idx + 1,
      ruleId: s.ruleId,
      score: Number(s.score.toFixed(4)),
      recommendation: s.recommendation,
    }))
  }

  // ---------- 内部辅助 ----------

  /** 由原始指标计算汇总 */
  private toSummary(m: RuleMetric): RuleMetricsSummary {
    const exec = m.executionCount
    const hitRate = exec > 0 ? m.hitCount / exec : 0
    const missRate = exec > 0 ? m.missCount / exec : 0
    const conflictRate = exec > 0 ? m.conflictCount / exec : 0
    const avgLatencyMs = exec > 0 ? m.totalLatencyMs / exec : 0
    const accuracy = m.accuracySamples > 0 ? m.accuracyHits / m.accuracySamples : 0
    // 综合评分 = hitRate * 0.3 + accuracy * 0.5 + (1 - conflictRate) * 0.2
    const score = hitRate * 0.3 + accuracy * 0.5 + (1 - conflictRate) * 0.2
    const recommendation: RuleMetricsSummary['recommendation'] =
      score >= 0.7 ? 'keep' : score >= 0.3 ? 'review' : 'deprecate'
    return {
      ruleId: m.ruleId,
      hitRate: Number(hitRate.toFixed(4)),
      missRate: Number(missRate.toFixed(4)),
      conflictRate: Number(conflictRate.toFixed(4)),
      avgLatencyMs: Number(avgLatencyMs.toFixed(4)),
      accuracy: Number(accuracy.toFixed(4)),
      score: Number(score.toFixed(4)),
      recommendation,
    }
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局规则运行时指标收集器单例 */
export const globalRuleMetrics = new RuleMetricsCollector()
