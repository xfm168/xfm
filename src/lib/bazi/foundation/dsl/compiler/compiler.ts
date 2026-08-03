/**
 * RuleDSL Compiler（Pipeline 第三阶段）
 *
 * 将校验通过的 AST 编译为可执行的 CompiledRule。
 *
 * 职责：
 *   - 生成 evaluate 函数：评估条件组 → 应用五行动作打分 → 返回 trace
 *   - 从 AST 提取元数据（source/priority/category/dependencies/classicEvidence）
 *   - 编译失败时抛出 DSLError
 *
 * Pipeline：DSL → [Parser] → AST → [Validator] → [Compiler] → CompiledRule → [Runtime]
 */

import type {
  RuleASTNode,
  ConditionASTNode,
  ConditionGroupASTNode,
  ClassicRefASTNode,
} from '../ast'
import { DSLError } from '../../shared/errors'

/** 编译器版本 */
const COMPILER_VERSION = '1.0.0'

// ============================================================
// 编译产物类型
// ============================================================

/**
 * 规则执行单次结果
 */
export interface CompiledRuleResult {
  /** 条件是否满足 */
  satisfied: boolean
  /** 五行打分（满足时累加 support、扣减 oppose；不满足时为空） */
  scores: Record<string, number>
  /** 执行轨迹（逐步解释，用于 Explain） */
  trace: Array<{ step: string; text: string; satisfied?: boolean }>
}

/**
 * 编译后的可执行规则
 */
export interface CompiledRule {
  /** 规则 ID */
  ruleId: string
  /** 规则名称 */
  ruleName: string
  /** 版本号 */
  version: string
  /** 源 AST 引用（保留以便追溯） */
  ast: RuleASTNode
  /** 评估函数（运行时核心） */
  evaluate: (input: any) => CompiledRuleResult
  /** 元数据 */
  metadata: {
    source: string[]
    priority: number
    category: string
    dependencies: string[]
    classicEvidence: ClassicRefASTNode[]
  }
  /** 编译时间戳 */
  compiledAt: number
  /** 编译器版本 */
  compilerVersion: string
}

// ============================================================
// 运行时求值辅助函数（闭包内使用）
// ============================================================

/**
 * 按字段路径取值（支持 'count.木' 这样的嵌套路径）
 */
function getFieldValue(input: any, fieldPath: string): any {
  if (!fieldPath) return undefined
  const parts = fieldPath.split('.')
  let val = input
  for (const p of parts) {
    if (val == null) return undefined
    val = val[p]
  }
  return val
}

/**
 * 评估单个条件 AST 节点
 */
function evalCondition(input: any, cond: ConditionASTNode): boolean {
  const actual = getFieldValue(input, cond.field)
  const expected = cond.value

  switch (cond.operator) {
    case '>=': return Number(actual) >= Number(expected)
    case '<=': return Number(actual) <= Number(expected)
    case '>':  return Number(actual) > Number(expected)
    case '<':  return Number(actual) < Number(expected)
    case '==': return actual === expected
    case '!=': return actual !== expected
    case 'in': return Array.isArray(expected) && expected.includes(actual)
    case 'not_in': return Array.isArray(expected) && !expected.includes(actual)
    case 'contains':
      if (Array.isArray(actual)) return actual.includes(expected)
      if (typeof actual === 'string') return actual.includes(String(expected))
      if (typeof actual === 'object' && actual !== null) return expected in actual
      return false
    case 'not_contains':
      if (Array.isArray(actual)) return !actual.includes(expected)
      if (typeof actual === 'string') return !actual.includes(String(expected))
      if (typeof actual === 'object' && actual !== null) return !(expected in actual)
      return true
    default:
      return false
  }
}

/**
 * 递归评估条件组 AST 节点
 */
function evalConditionGroup(input: any, group: ConditionGroupASTNode): boolean {
  const results = group.conditions.map((cond) => {
    if (cond.type === 'ConditionGroup') {
      return evalConditionGroup(input, cond as ConditionGroupASTNode)
    }
    return evalCondition(input, cond as ConditionASTNode)
  })
  return group.logic === 'and' ? results.every((r) => r) : results.some((r) => r)
}

/**
 * 格式化五行打分为可读字符串
 */
function formatScores(scores: Record<string, number>): string {
  const entries = Object.entries(scores)
  if (entries.length === 0) return '（无打分）'
  return entries.map(([w, s]) => `${w}:${s}`).join(', ')
}

// ============================================================
// 编译主函数
// ============================================================

/**
 * 编译 AST 为可执行规则（Pipeline 主入口）
 *
 * 生成的 evaluate 函数会在运行时根据 AST 条件评估命局，
 * 满足时累加 support 五行分数、扣减 oppose 五行分数。
 *
 * @param ast 规则 AST 根节点（应已通过 Validator 校验）
 * @returns 编译后的可执行规则
 * @throws DSLError 编译失败时
 */
export function compile(ast: RuleASTNode): CompiledRule {
  if (!ast) {
    throw new DSLError('AST 为空，无法编译', { module: 'compiler', code: 'FND-DSL-COMPILE-000' })
  }
  if (!ast.id) {
    throw new DSLError('AST 缺少 id，无法编译', { module: 'compiler', code: 'FND-DSL-COMPILE-001' })
  }
  if (!ast.name) {
    throw new DSLError(`规则 (${ast.id}) AST 缺少 name，无法编译`, { module: 'compiler', code: 'FND-DSL-COMPILE-002' })
  }
  if (!ast.conditions) {
    throw new DSLError(`规则 (${ast.id}) AST 缺少 conditions，无法编译`, { module: 'compiler', code: 'FND-DSL-COMPILE-003' })
  }

  // 闭包捕获 AST，生成运行时求值函数
  const evaluate = (input: any): CompiledRuleResult => {
    const trace: CompiledRuleResult['trace'] = []
    const safeInput = input ?? {}

    // 1. 评估条件组
    const satisfied = evalConditionGroup(safeInput, ast.conditions)
    trace.push({
      step: '条件评估',
      text: `逻辑: ${ast.conditions.logic}, 条件数: ${ast.conditions.conditions.length}, 满足: ${satisfied}`,
      satisfied,
    })

    // 2. 满足时应用五行打分
    const scores: Record<string, number> = {}
    if (satisfied) {
      for (const s of ast.support ?? []) {
        scores[s.wuxing] = (scores[s.wuxing] ?? 0) + s.score
      }
      for (const o of ast.oppose ?? []) {
        scores[o.wuxing] = (scores[o.wuxing] ?? 0) - Math.abs(o.score)
      }
      trace.push({
        step: '五行打分',
        text: `support: ${(ast.support ?? []).map((s) => `${s.wuxing}(+${s.score})`).join(', ') || '无'} | oppose: ${(ast.oppose ?? []).map((o) => `${o.wuxing}(-${Math.abs(o.score)})`).join(', ') || '无'} → ${formatScores(scores)}`,
        satisfied: true,
      })
    } else {
      trace.push({ step: '五行打分', text: '条件不满足，不应用打分', satisfied: false })
    }

    // 3. 输出结论
    trace.push({ step: '规则结论', text: ast.result, satisfied })

    return { satisfied, scores, trace }
  }

  return {
    ruleId: ast.id,
    ruleName: ast.name,
    version: ast.version,
    ast,
    evaluate,
    metadata: {
      source: ast.source,
      priority: ast.priority,
      category: ast.category,
      dependencies: ast.dependencies,
      classicEvidence: ast.classicEvidence,
    },
    compiledAt: Date.now(),
    compilerVersion: COMPILER_VERSION,
  }
}

/**
 * RuleDSL 编译器
 *
 * 提供单条与批量编译能力。
 */
export class DSLCompiler {
  /**
   * 编译单个 AST
   *
   * @param ast 规则 AST 根节点
   * @returns 编译后的可执行规则
   */
  compile(ast: RuleASTNode): CompiledRule {
    return compile(ast)
  }

  /**
   * 批量编译 AST
   *
   * @param asts 规则 AST 根节点列表
   * @returns 编译后的可执行规则列表（顺序与输入一致）
   */
  compileBatch(asts: RuleASTNode[]): CompiledRule[] {
    return asts.map((ast) => compile(ast))
  }
}
