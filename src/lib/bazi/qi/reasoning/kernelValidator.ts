/**
 * KernelValidator — 内核完整性校验器（Freeze+2）
 * 
 * 每次 Engine 结束后自动检查：
 * - 非法状态
 * - 重复 Explain
 * - 重复 Decision
 * - Event 丢失
 * - Context 不一致
 */

import type { ReasoningContext, ReasoningEvent, ExplainRecord, DecisionNode } from './types'

export type ValidationMode = 'normal' | 'strict' | 'debug'

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info'
  code: string
  message: string
  detail?: string
}

export interface KernelValidationResult {
  passed: boolean
  issues: ValidationIssue[]
  timestamp: number
}

export class KernelValidator {
  private mode: ValidationMode = 'normal'

  constructor(mode?: ValidationMode) {
    if (mode) this.mode = mode
  }

  setMode(mode: ValidationMode): void {
    this.mode = mode
  }

  getMode(): ValidationMode {
    return this.mode
  }

  /**
   * 完整校验 Context
   */
  validate(ctx: ReasoningContext, mode?: ValidationMode): KernelValidationResult {
    const effectiveMode = mode ?? this.mode
    const issues: ValidationIssue[] = []
    
    // Normal: only error checks
    this.checkPhaseConsistency(ctx, issues)
    
    // Strict: add duplicate + consistency checks
    if (effectiveMode === 'strict' || effectiveMode === 'debug') {
      this.checkExplainDuplicates(ctx, issues)
      this.checkDecisionDuplicates(ctx, issues)
      this.checkStateTreeConsistency(ctx, issues)
      this.checkNodeConsistency(ctx, issues)
    }
    
    // Debug: add all checks including soft checks
    if (effectiveMode === 'debug') {
      this.checkEventTimeline(ctx, issues)
      this.checkTraceIdConsistency(ctx, issues)
    }
    
    return {
      passed: issues.filter(i => i.severity === 'error').length === 0,
      issues,
      timestamp: Date.now(),
    }
  }
  
  /** 检查阶段一致性：stateTree 最后节点的 phase 应等于 currentPhase */
  private checkPhaseConsistency(ctx: ReasoningContext, issues: ValidationIssue[]): void {
    if (ctx.stateTree.length === 0) {
      issues.push({ severity: 'warning', code: 'EMPTY_STATE_TREE', message: 'stateTree 为空' })
      return
    }
    const lastPhase = ctx.stateTree[ctx.stateTree.length - 1].phase
    if (lastPhase !== ctx.currentPhase) {
      issues.push({
        severity: 'error', code: 'PHASE_MISMATCH',
        message: `stateTree 最后阶段(${lastPhase}) ≠ currentPhase(${ctx.currentPhase})`,
      })
    }
  }
  
  /** 检查重复 Explain（同 phase+step+subject 组合不应重复） */
  private checkExplainDuplicates(ctx: ReasoningContext, issues: ValidationIssue[]): void {
    const seen = new Map<string, number>()
    for (const exp of ctx.explains) {
      const key = `${exp.phase}:${exp.step}:${exp.subject}`
      const count = (seen.get(key) ?? 0) + 1
      seen.set(key, count)
      if (count > 1) {
        issues.push({
          severity: 'warning', code: 'DUPLICATE_EXPLAIN',
          message: `重复 Explain: [${key}] 出现 ${count} 次`,
        })
      }
    }
  }
  
  /** 检查重复 Decision（同 phase+action+subject 不应重复） */
  private checkDecisionDuplicates(ctx: ReasoningContext, issues: ValidationIssue[]): void {
    const seen = new Map<string, number>()
    for (const dec of ctx.decisionTree) {
      const key = `${dec.phase}:${dec.action}:${dec.subject}`
      const count = (seen.get(key) ?? 0) + 1
      seen.set(key, count)
      if (count > 1) {
        issues.push({
          severity: 'warning', code: 'DUPLICATE_DECISION',
          message: `重复 Decision: [${key}] 出现 ${count} 次`,
        })
      }
    }
  }
  
  /** 检查 Event Timeline 完整性：seq 应递增，不应有空缺 */
  private checkEventTimeline(ctx: ReasoningContext, issues: ValidationIssue[]): void {
    if (ctx.eventTimeline.length === 0) return
    
    for (let i = 1; i < ctx.eventTimeline.length; i++) {
      if (ctx.eventTimeline[i].seq <= ctx.eventTimeline[i - 1].seq) {
        issues.push({
          severity: 'error', code: 'EVENT_SEQ_NOT_INCREASING',
          message: `事件序号不递增: seq[${i - 1}]=${ctx.eventTimeline[i - 1].seq} >= seq[${i}]=${ctx.eventTimeline[i].seq}`,
        })
      }
    }
    
    // PhaseAdvanced 事件应在每个 stateTree 阶段变化时存在
    // (soft check)
    if (ctx.stateTree.length > 1 && ctx.eventTimeline.length === 0) {
      issues.push({
        severity: 'info', code: 'NO_EVENTS_FOR_MULTIPHASE',
        message: '多阶段推演但无事件记录',
      })
    }
  }
  
  /** 检查 stateTree 每个节点的 explains 是否是全局 explains 的子集 */
  private checkStateTreeConsistency(ctx: ReasoningContext, issues: ValidationIssue[]): void {
    for (const node of ctx.stateTree) {
      for (const nodeExp of node.explains) {
        const found = ctx.explains.some(e => e.id === nodeExp.id)
        if (!found) {
          issues.push({
            severity: 'error', code: 'ORPHAN_EXPLAIN_IN_STATE_NODE',
            message: `stateTree[${node.phase}] 包含全局不存在的 Explain: ${nodeExp.id}`,
          })
        }
      }
    }
  }
  
  /** 检查 currentNodes 不为空 */
  private checkNodeConsistency(ctx: ReasoningContext, issues: ValidationIssue[]): void {
    if (ctx.currentNodes.length === 0 && ctx.stateTree.length > 0) {
      issues.push({
        severity: 'warning', code: 'EMPTY_CURRENT_NODES',
        message: 'currentNodes 为空但 stateTree 不为空',
      })
    }
  }
  
  /** 检查 TraceID 一致性（仅 Debug 模式） */
  private checkTraceIdConsistency(ctx: ReasoningContext, issues: ValidationIssue[]): void {
    const traceIds = new Set<string>()
    for (const exp of ctx.explains) {
      if (!exp.traceId) {
        issues.push({ severity: 'warning', code: 'MISSING_TRACE_ID', message: `Explain 缺少 traceId: ${exp.id}` })
      } else if (traceIds.has(exp.traceId)) {
        issues.push({ severity: 'warning', code: 'DUPLICATE_TRACE_ID', message: `重复 traceId: ${exp.traceId}` })
      }
      traceIds.add(exp.traceId ?? '')
    }
    for (const dec of ctx.decisionTree) {
      if (!dec.traceId) {
        issues.push({ severity: 'warning', code: 'MISSING_TRACE_ID', message: `Decision 缺少 traceId: ${dec.id}` })
      }
    }
  }
}

/** 全局校验器实例 */
export const kernelValidator = new KernelValidator()
