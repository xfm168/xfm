import authoritativeJson from './authoritativeCases.json'
export * from './authoritative.types'
import type { AuthoritativeCase } from './authoritative.types'

export const AUTHORITATIVE_CASES: AuthoritativeCase[] = authoritativeJson as AuthoritativeCase[]

export function getCaseById(id: string): AuthoritativeCase | undefined {
  return AUTHORITATIVE_CASES.find(c => c.id === id)
}

export function getCasesBySource(src: string): AuthoritativeCase[] {
  return AUTHORITATIVE_CASES.filter(c => c.source === src)
}

export function getCasesByTags(tags: string[]): AuthoritativeCase[] {
  return AUTHORITATIVE_CASES.filter(c => tags.every(t => c.tags?.includes(t)))
}

export function getSourceSummary(): Record<string, number> {
  const s: Record<string, number> = {}
  for (const c of AUTHORITATIVE_CASES) s[c.source] = (s[c.source] || 0) + 1
  return s
}

// ─── C2 古籍标准校验（classicValidator）专用类型 ───
// 注：classic 字段为 C1 升级引入的可选古籍标准数据，此处独立定义类型，
//     不修改 authoritative.types.ts（避免与 C1 并行修改冲突）。
//     C1 完成后，若 AuthoritativeCase 已含 classic 字段，则此处的 ClassicFields
//     可被联合类型兼容；classicValidator 内部以 as 类型断言安全访问。

/** 古籍原文标准字段（C1 升级后填充） */
export interface ClassicFields {
  /** 古籍原四柱（若与 expect.fourPillars 不同，以 classic 为准） */
  originalPillars?: {
    year?: { gan?: string; zhi?: string; ganZhi?: string }
    month?: { gan?: string; zhi?: string; ganZhi?: string }
    day?: { gan?: string; zhi?: string; ganZhi?: string }
    hour?: { gan?: string; zhi?: string; ganZhi?: string }
  }
  /** 古籍原格局名称列表 */
  originalStructure?: string[]
  /** 古籍原喜用神列表（含调候用神） */
  originalUsefulGod?: string[]
  /** 古籍原调候用神列表（若独立于 originalUsefulGod） */
  originalTiaohou?: string[]
  /** 古籍原旺衰判定（身强/身弱/偏强/偏弱/中和/从强/从弱） */
  originalStrength?: string
}

/** 单项校验结果（10 项之一） */
export interface ValidationItemResult {
  /** 校验项名称，如 "1.年柱"、"6.格局" */
  name: string
  /** PASS=一致 / FAIL=不一致 / SKIP=无数据 */
  status: 'PASS' | 'FAIL' | 'SKIP'
  /** 古籍期望值 */
  expected?: any
  /** 程序实际值 */
  actual?: any
  /** 准确度 [0,1]，SKIP 项默认 1（不拖低总分） */
  accuracy: number
  /** 差异摘要（FAIL 必填） */
  difference?: string
  /** 差异原因（FAIL 必填） */
  differenceReason?: string
  /** 备注（如 "待 RuleEngine 完全接入后改为精确比对"） */
  note?: string
}

/** 单案例校验结果 */
export interface CaseValidationResult {
  caseId: string
  source: string
  items: ValidationItemResult[]
  /** 非 SKIP 项 accuracy 平均值 */
  overallAccuracy: number
  /** PASS if overallAccuracy ≥ 0.85 else FAIL */
  status: 'PASS' | 'FAIL'
  validatedAt: string
}

/** 校验报告 */
export interface ValidationReport {
  generatedAt: string
  totalCases: number
  passedCases: number
  failedCases: number
  /** 全案例 overallAccuracy 平均值 */
  overallAccuracy: number
  status: 'PASS' | 'FAIL'
  /** 每项校验的统计（含 1.年柱/1.月柱/1.日柱/1.时柱 子项） */
  perItemBreakdown: Record<string, { checked: number; passed: number; accuracy: number }>
  /** 每来源统计 */
  perSourceBreakdown: Record<string, { cases: number; accuracy: number }>
  failures: CaseValidationResult[]
  sampleTop10: CaseValidationResult[]
  durationMs: number
}
