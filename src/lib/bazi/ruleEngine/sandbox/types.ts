/** 沙箱测试结果 */
export interface SandboxTestResult {
  /** 被测试的规则 ID */
  ruleId: string
  /** 被测试的规则名称 */
  ruleName: string
  /** 测试时间戳 */
  timestamp: string
  /** 是否通过所有测试 */
  passed: boolean
  /** 测试案例总数 */
  totalCases: number
  /** 通过案例数 */
  passedCases: number
  /** 失败案例数 */
  failedCases: number
  /** 失败案例详情 */
  failures: SandboxFailure[]
  /** 执行耗时（ms） */
  durationMs: number
  /** 规则评估结果摘要 */
  summary: string
}

/** 沙箱测试失败详情 */
export interface SandboxFailure {
  /** 案例ID */
  caseId: string
  /** 失败原因 */
  reason: string
  /** 预期结果 */
  expected?: any
  /** 实际结果 */
  actual?: any
  /** 错误信息（如果 evaluate 抛错） */
  error?: string
}

/** 沙箱配置 */
export interface SandboxConfig {
  /** 是否在失败时仍提升规则（默认 false） */
  promoteOnFailure?: boolean
  /** 最低通过率（0~1，默认 1.0 = 100%） */
  minPassRate?: number
  /** 是否打印详细日志 */
  verbose?: boolean
  /** 测试案例过滤器（只测特定 tag 的案例） */
  caseTags?: string[]
}

/** 沙箱验证流程步骤 */
export type SandboxStage =
  | 'registered'      // 已注册到沙箱
  | 'running'         // 正在运行测试
  | 'completed'       // 测试完成
  | 'passed'          // 通过验证
  | 'failed'          // 验证失败
  | 'promoted'        // 已提升为正式规则
