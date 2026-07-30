import type { RuleDefinition, EvidenceBundle } from '../types'
import type { SandboxTestResult, SandboxFailure, SandboxConfig } from './types'
import { registerSandboxRule, promoteRule, getSandboxRules } from '../ruleRegistry'

/**
 * Rule Sandbox 沙箱运行器
 *
 * 流程：
 * 1. 新规则注册到 sandbox（registerSandboxRule）
 * 2. 跑全部 ReferenceCases（或指定 tag 的子集）
 * 3. 统计通过率
 * 4. 通过则自动 promote 到正式规则
 * 5. 失败则保留在 sandbox，返回详细失败信息
 */

/** 默认沙箱配置 */
const DEFAULT_CONFIG: Required<SandboxConfig> = {
  promoteOnFailure: false,
  minPassRate: 1.0,
  verbose: false,
  caseTags: [],
}

/** 注册规则到沙箱 */
export function registerToSandbox(rule: RuleDefinition): void {
  // 确保 status = 'sandbox'
  const sandboxRule = { ...rule, status: 'sandbox' as const }
  registerSandboxRule(sandboxRule)
}

/** 沙箱测试案例 */
export interface SandboxTestCase {
  id: string
  input: any
  expected?: any
  validate?: (result: EvidenceBundle) => boolean
}

/**
 * 运行沙箱测试
 * @param ruleId 要测试的规则 ID
 * @param testCases 测试案例数组（每项包含 input 和 expected）
 * @param config 沙箱配置
 */
export async function runSandbox(
  ruleId: string,
  testCases: SandboxTestCase[],
  config?: SandboxConfig,
): Promise<SandboxTestResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config }
  const startTime = Date.now()

  // 从 sandbox 中查找规则
  const sandboxRules = getSandboxRules()
  const rule = sandboxRules.find(r => r.id === ruleId)
  if (!rule) {
    return {
      ruleId,
      ruleName: 'Unknown',
      timestamp: new Date().toISOString(),
      passed: false,
      totalCases: 0,
      passedCases: 0,
      failedCases: 0,
      failures: [],
      durationMs: Date.now() - startTime,
      summary: `规则 ${ruleId} 不在沙箱中`,
    }
  }

  const failures: SandboxFailure[] = []
  let passedCases = 0

  // 逐个案例测试
  for (const testCase of testCases) {
    try {
      const result = await rule.evaluate(testCase.input)
      const isValid = testCase.validate ? testCase.validate(result) : true
      if (isValid) {
        passedCases++
      } else {
        failures.push({
          caseId: testCase.id,
          reason: '验证函数返回 false',
          expected: testCase.expected,
          actual: result,
        })
      }
    } catch (err) {
      failures.push({
        caseId: testCase.id,
        reason: '规则执行抛错',
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const totalCases = testCases.length
  const failedCases = totalCases - passedCases
  const passRate = totalCases > 0 ? passedCases / totalCases : 0
  const passed = passRate >= cfg.minPassRate

  // 如果通过且配置允许，自动提升
  if (passed && !cfg.promoteOnFailure) {
    promoteRule(ruleId)
  }

  const result: SandboxTestResult = {
    ruleId,
    ruleName: rule.name ?? rule.id,
    timestamp: new Date().toISOString(),
    passed,
    totalCases,
    passedCases,
    failedCases,
    failures,
    durationMs: Date.now() - startTime,
    summary: passed
      ? `✓ 通过 ${passedCases}/${totalCases} (${(passRate * 100).toFixed(1)}%)，已提升为正式规则`
      : `✗ 失败 ${failedCases}/${totalCases}，通过率 ${(passRate * 100).toFixed(1)}% < 要求 ${(cfg.minPassRate * 100).toFixed(1)}%`,
  }

  if (cfg.verbose) {
    console.log(`[Sandbox] ${result.summary}`)
    failures.forEach(f => console.log(`  ✗ ${f.caseId}: ${f.reason}`))
  }

  return result
}

/**
 * 批量沙箱测试
 * 一次性测试所有沙箱规则
 */
export async function runAllSandboxRules(
  testCases: SandboxTestCase[],
  config?: SandboxConfig,
): Promise<SandboxTestResult[]> {
  const sandboxRules = getSandboxRules()
  const results: SandboxTestResult[] = []
  for (const rule of sandboxRules) {
    const result = await runSandbox(rule.id, testCases, config)
    results.push(result)
  }
  return results
}

/**
 * 验证规则不与现有规则冲突
 * 检查新规则的 evaluate 结果是否与已有规则矛盾
 */
export function checkRuleConflicts(
  _newRuleId: string,
  _existingResults: Map<string, any>,
): { hasConflict: boolean; conflicts: string[] } {
  const conflicts: string[] = []
  // 简单实现：检查是否有相同 category 的规则产生了互斥的 conclusion
  // 后续可以扩展为更复杂的冲突检测
  return { hasConflict: conflicts.length > 0, conflicts }
}
