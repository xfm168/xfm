/**
 * RuleDSL Validator（Pipeline 第二阶段）
 *
 * 对解析后的 AST 进行语义正确性校验。
 *
 * 校验规则：
 *   - 规则 ID 非空且匹配 [A-Z][A-Z0-9_-]*
 *   - name 非空
 *   - version 符合 x.y.z 语义化版本
 *   - source 至少一条
 *   - priority 在 0-100
 *   - 条件组至少一个条件
 *   - support/oppose 五行值合法（金木水火土）
 *   - support 与 oppose 不可出现相同五行
 *   - 古籍引用 quotedText 非空
 *   - dependencies 引用合法规则 ID
 *   - tags 非空字符串
 *
 * Pipeline：DSL → [Parser] → AST → [Validator] → [Compiler] → CompiledRule → [Runtime]
 */

import {
  ASTNodeType,
  type RuleASTNode,
  type ConditionGroupASTNode,
  type ASTValidationResult,
  type ASTValidationError,
} from '../ast'

/** 规则 ID 模式：以大写字母开头，后接大写字母/数字/下划线/连字符 */
const RULE_ID_PATTERN = /^[A-Z][A-Z0-9_-]*$/

/** 语义化版本模式：x.y.z（数字） */
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/

/** 合法五行集合 */
const VALID_WUXING = new Set(['金', '木', '水', '火', '土'])

/** 构造一个错误对象（辅助函数） */
function makeError(
  nodeType: ASTNodeType,
  message: string,
  location?: { line: number; column: number },
): ASTValidationError {
  return { nodeType, message, location }
}

/**
 * 递归校验条件组：每个条件须有 field 与 operator
 */
function validateConditionGroup(
  group: ConditionGroupASTNode,
  errors: ASTValidationError[],
): void {
  if (!group) return
  if (group.logic !== 'and' && group.logic !== 'or') {
    errors.push(makeError(ASTNodeType.ConditionGroup, `条件组 logic 必须是 'and' 或 'or'，实际为 "${group.logic}"`, group.location))
  }
  for (const cond of group.conditions ?? []) {
    if (cond.type === ASTNodeType.ConditionGroup) {
      // 嵌套条件组：递归
      validateConditionGroup(cond as ConditionGroupASTNode, errors)
    } else {
      // 单个条件
      const c = cond as { field?: string; operator?: string; location?: { line: number; column: number } }
      if (!c.field) {
        errors.push(makeError(ASTNodeType.Condition, '条件缺少 field', c.location))
      }
      if (!c.operator) {
        errors.push(makeError(ASTNodeType.Condition, `条件 (${c.field ?? '?'}) 缺少 operator`, c.location))
      }
    }
  }
}

/**
 * 校验单个规则 AST 节点
 *
 * @param ast 规则 AST 根节点
 * @returns 校验结果（含错误列表）
 */
export function validate(ast: RuleASTNode): ASTValidationResult {
  const errors: ASTValidationError[] = []
  const loc = ast?.location

  // —— Rule ID ——
  if (!ast || !ast.id) {
    errors.push(makeError(ASTNodeType.Rule, '规则 ID 不能为空', loc))
  } else if (!RULE_ID_PATTERN.test(ast.id)) {
    errors.push(makeError(ASTNodeType.Rule, `规则 ID "${ast.id}" 不符合模式 [A-Z][A-Z0-9_-]*`, loc))
  }

  // —— Name ——
  if (!ast?.name) {
    errors.push(makeError(ASTNodeType.Rule, '规则 name 不能为空', loc))
  }

  // —— Version ——
  if (!ast?.version || !SEMVER_PATTERN.test(ast.version)) {
    errors.push(makeError(ASTNodeType.Rule, `版本号 "${ast?.version}" 不符合 x.y.z 语义化版本`, loc))
  }

  // —— Source ——
  if (!ast?.source || ast.source.length === 0) {
    errors.push(makeError(ASTNodeType.SourceDecl, 'source 至少需要一个来源条目', loc))
  }

  // —— Priority ——
  if (typeof ast?.priority !== 'number' || ast.priority < 0 || ast.priority > 100) {
    errors.push(makeError(ASTNodeType.Rule, `priority "${ast?.priority}" 必须是 0-100 之间的数字`, loc))
  }

  // —— Conditions ——
  if (!ast?.conditions || !ast.conditions.conditions || ast.conditions.conditions.length === 0) {
    errors.push(makeError(ASTNodeType.ConditionGroup, '条件组至少需要一个条件', ast?.conditions?.location))
  } else {
    validateConditionGroup(ast.conditions, errors)
  }

  // —— Support / Oppose 五行 ——
  const supportSet = new Set<string>()
  for (const a of ast?.support ?? []) {
    if (!VALID_WUXING.has(a.wuxing)) {
      errors.push(makeError(ASTNodeType.WuxingAction, `support 五行 "${a.wuxing}" 无效（需为 金/木/水/火/土）`, a.location))
    }
    supportSet.add(a.wuxing)
  }
  const opposeSet = new Set<string>()
  for (const a of ast?.oppose ?? []) {
    if (!VALID_WUXING.has(a.wuxing)) {
      errors.push(makeError(ASTNodeType.WuxingAction, `oppose 五行 "${a.wuxing}" 无效（需为 金/木/水/火/土）`, a.location))
    }
    opposeSet.add(a.wuxing)
  }

  // —— Support 与 Oppose 不可有相同五行 ——
  for (const w of supportSet) {
    if (opposeSet.has(w)) {
      errors.push(makeError(ASTNodeType.WuxingAction, `五行 "${w}" 同时出现在 support 与 oppose 中，存在冲突`, loc))
    }
  }

  // —— 古籍引用 ——
  for (const ce of ast?.classicEvidence ?? []) {
    if (!ce.quotedText) {
      errors.push(makeError(ASTNodeType.ClassicRef, `古籍引用 (${ce.classicName || '?'}) 的 quotedText 不能为空`, ce.location))
    }
    if (!ce.classicName) {
      errors.push(makeError(ASTNodeType.ClassicRef, '古籍引用缺少 classicName', ce.location))
    }
  }

  // —— 依赖规则 ID ——
  for (const dep of ast?.dependencies ?? []) {
    if (!dep || !RULE_ID_PATTERN.test(dep)) {
      errors.push(makeError(ASTNodeType.Rule, `依赖规则 ID "${dep}" 格式不合法（需匹配 [A-Z][A-Z0-9_-]*）`, loc))
    }
  }

  // —— Tags ——
  if (ast?.tags) {
    for (const t of ast.tags) {
      if (typeof t !== 'string' || t === '') {
        errors.push(makeError(ASTNodeType.Metadata, 'tag 不能为空字符串', loc))
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * RuleDSL 校验器
 *
 * 提供单条与批量校验能力。
 */
export class DSLValidator {
  /**
   * 校验单个 AST
   *
   * @param ast 规则 AST 根节点
   * @returns 校验结果
   */
  validate(ast: RuleASTNode): ASTValidationResult {
    return validate(ast)
  }

  /**
   * 批量校验 AST
   *
   * @param asts 规则 AST 根节点列表
   * @returns 校验结果列表（顺序与输入一致）
   */
  validateBatch(asts: RuleASTNode[]): ASTValidationResult[] {
    return asts.map((ast) => validate(ast))
  }
}
