/**
 * Sprint3-5 阶段⑦ + ⑧ 聚合：EngineDashboard（实时运维面板）
 *  + quality 模块统一整合
 */

import type { EngineDashboardReport } from './types'
import type { DecisionResult } from '../engines/fusion/types'

/** 累计调用统计（内存态） */
export interface EngineAccumulatedStats {
  totalDecisions: number
  perEngine: Record<string, {
    runCount: number
    totalEvidence: number
    satisfiedEvidence: number
    classicCount: number
    conflictCount: number
    sumAccuracy: number
    sumConfidence: number
    sumHealth: number
    totalLatencyMs: number
    applicableCount: number
  }>
}

export class EngineDashboard {
  private _acc: EngineAccumulatedStats = {
    totalDecisions: 0,
    perEngine: {},
  }

  /** 每次决策后记录统计（可接入 EvidenceFusionEngine decide 完成后调用） */
  recordDecision(
    result: DecisionResult,
    options?: { perEngineLatency?: Record<string, number> },
  ) {
    const perEngineLatency = options?.perEngineLatency
    this._acc.totalDecisions += 1
    const now = Date.now()
    for (const sr of result.subEngineResults) {
      const stat = this._acc.perEngine[sr.engineName] ??= {
        runCount: 0, totalEvidence: 0, satisfiedEvidence: 0, classicCount: 0,
        conflictCount: 0, sumAccuracy: 0, sumConfidence: 0, sumHealth: 0,
        totalLatencyMs: 0, applicableCount: 0,
      }
      stat.runCount += 1
      const satisfied = sr.evidence.filter(e => e.satisfied).length
      stat.totalEvidence += sr.evidence.length
      stat.satisfiedEvidence += satisfied
      stat.classicCount += sr.classicEvidence.length
      stat.sumConfidence += sr.confidence
      stat.applicableCount += sr.applicable ? 1 : 0
      if (perEngineLatency?.[sr.engineName]) stat.totalLatencyMs += perEngineLatency[sr.engineName]
    }
    // accuracy / conflict（每决策平均）
    for (const sr of result.subEngineResults) {
      const stat = this._acc.perEngine[sr.engineName]
      // 简单 accuracy ≈ 引擎 推荐 primary 等于 result.primary 的比例（此处简化
      const hit = (sr.scores[result.primaryYongShen] ?? 0) > 0.1
        && (sr.scores[result.avoidGod] ?? 0) < -0.1 ? 1 : 0.5
      stat.sumAccuracy += hit
      const h = result.engineHealth?.[sr.engineName]?.overall ?? sr.confidence
      stat.sumHealth += h
    }
    // 冲突按引擎分摊
    for (const c of result.conflictReport.conflicts) {
      const a = this._acc.perEngine[c.engineA]
      const b = this._acc.perEngine[c.engineB]
      if (a) a.conflictCount += 1
      if (b) b.conflictCount += 1
    }
  }

  /** 重置累计统计（调试/测试用） */
  reset() {
    this._acc = {
      totalDecisions: 0,
      perEngine: {},
    }
  }

  /** 生成 Dashboard 报告 */
  generateReport(): EngineDashboardReport {
    const engines: EngineDashboardReport['engines'] = {}
    let sumConfidence = 0
    let sumAccuracy = 0
    let evidenceTotal = 0
    let conflictTotal = 0
    let latencyTotal = 0
    for (const name of Object.keys(this._acc.perEngine)) {
      const s = this._acc.perEngine[name]
      const health = safeDiv(s.sumHealth, s.runCount)
      const accuracy = safeDiv(s.sumAccuracy, s.runCount)
      const confidence = safeDiv(s.sumConfidence, s.runCount)
      const applicableRate = safeDiv(s.applicableCount, s.runCount)
      const avgLatency = safeDiv(s.totalLatencyMs, s.runCount)
      sumConfidence += confidence
      sumAccuracy += accuracy
      evidenceTotal += s.satisfiedEvidence
      conflictTotal += s.conflictCount
      latencyTotal += s.totalLatencyMs
      engines[name] = {
        engineName: name,
        health: Number(health.toFixed(4)),
        totalEvidence: s.totalEvidence,
        satisfiedEvidence: s.satisfiedEvidence,
        classicCount: s.classicCount,
        conflictCount: s.conflictCount,
        accuracy: Number(accuracy.toFixed(4)),
        avgConfidence: Number(confidence.toFixed(4)),
        avgLatencyMs: Number(avgLatency.toFixed(0)),
        applicableRate: Number(applicableRate.toFixed(4)),
      }
    }
    const n = Math.max(1, Object.keys(this._acc.perEngine).length)
    return {
      generatedAt: Date.now(),
      engines,
      summary: {
        totalDecisions: this._acc.totalDecisions,
        avgConfidence: Number((sumConfidence / n).toFixed(4)),
        avgAccuracy: Number((sumAccuracy / n).toFixed(4)),
        avgLatencyMs: Math.round(latencyTotal / Math.max(1, n)),
        totalConflicts: conflictTotal,
        totalEvidence: evidenceTotal,
      },
    }
  }
}

export const globalEngineDashboard = new EngineDashboard()

function safeDiv(a: number, b: number): number {
  return b > 0 ? a / b : 0
}
