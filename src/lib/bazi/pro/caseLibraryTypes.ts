/**
 * V4.5 Case Library — 命例验证库 类型定义
 *
 * 职责：建立专业命例数据库，确保算法回归一致率
 * 约束：不参与任何命理计算，仅存储和比对结果
 *
 * 三个层级：
 * - CLASSIC: 100 个经典公开命例（古籍记载、名人八字）
 * - ANONYMOUS: 500 个匿名真实命例（结构化输入+预期结果）
 * - REGRESSION: 1000 个自动回归样本（输入+引擎输出快照）
 */

import type { HeavenlyStem, EarthlyBranch, FiveElement } from '@/lib/core/types/base'
import type { DerivationChain } from './types'

// ═══════════════════════════════════════════
// 1. 命例基础
// ═══════════════════════════════════════════

/** 命例类别 */
export type CaseCategory = 'classic' | 'anonymous' | 'regression'

/** 性别 */
export type CaseGender = 'male' | 'female'

/** 四柱输入（最小输入集） */
export interface CasePillarsInput {
  yearGan: HeavenlyStem
  yearZhi: EarthlyBranch
  monthGan: HeavenlyStem
  monthZhi: EarthlyBranch
  dayGan: HeavenlyStem
  dayZhi: EarthlyBranch
  hourGan: HeavenlyStem
  hourZhi: EarthlyBranch
  gender: CaseGender
  birthDate?: string  // ISO date string（可选，用于大运计算）
}

// ═══════════════════════════════════════════
// 2. 预期结果（用于比对）
// ═══════════════════════════════════════════

/** 命例预期结果（子集，用于回归比对） */
export interface CaseExpectedResult {
  dayMasterElement?: FiveElement
  primaryPattern?: string
  strengthLevel?: string
  primaryXiShen?: FiveElement
  primaryYongShen?: FiveElement
  primaryJiShen?: FiveElement
  // 五维评分
  careerScore?: number
  wealthScore?: number
  marriageScore?: number
  healthScore?: number
  studyScore?: number
  overallScore?: number
}

// ═══════════════════════════════════════════
// 3. 验证结果
// ═══════════════════════════════════════════

/** 单字段比对结果 */
export interface FieldComparison {
  field: string
  expected: string | number
  actual: string | number
  match: boolean
}

/** 单个命例验证结果 */
export interface CaseValidationResult {
  caseId: string
  category: CaseCategory
  fieldComparisons: FieldComparison[]
  matchCount: number
  totalFields: number
  consistencyRate: number  // 0~1
  passed: boolean          // consistencyRate >= threshold
}

// ═══════════════════════════════════════════
// 4. 回归报告
// ═══════════════════════════════════════════

/** 回归验证报告 */
export interface RegressionReport {
  version: string
  generatedAt: number
  engineVersions: {
    pillars: string
    shenSha: string
    tenGods: string
    pattern: string
    xiYong: string
    fortune: string
    masterReport: string
    reportExport: string
  }
  // 按类别统计
  classicResults: CaseValidationResult[]
  anonymousResults: CaseValidationResult[]
  regressionResults: CaseValidationResult[]
  // 汇总
  totalCases: number
  totalPassed: number
  overallConsistencyRate: number
  categoryConsistency: {
    classic: number
    anonymous: number
    regression: number
  }
  // 字段级统计
  fieldConsistency: Record<string, number>
  // 失败列表
  failures: CaseValidationResult[]
  warnings: string[]
  computeTimeMs: number
  derivationChain?: DerivationChain
}

/** 回归选项 */
export interface RegressionOptions {
  threshold?: number           // 一致率阈值，默认 0.8
  categories?: CaseCategory[]  // 只验证指定类别
  caseIds?: string[]            // 只验证指定命例
  stopOnFirstFailure?: boolean  // 首次失败即停止
}

// ═══════════════════════════════════════════
// 5. 命例条目
// ═══════════════════════════════════════════

/** 经典命例（含来源和描述） */
export interface ClassicCase extends CasePillarsInput {
  caseId: string
  name: string
  description: string
  source: string            // 古籍名称或出处
  dynasty?: string          // 朝代（如 '明', '清', '现代'）
  expectedResult: CaseExpectedResult
  notes?: string
}

/** 匿名真实命例 */
export interface AnonymousCase extends CasePillarsInput {
  caseId: string
  expectedResult: CaseExpectedResult
  confidence: number        // 预期结果可信度 0~1
  source: string            // 'manual-entry' | 'user-submitted' | 'expert-annotated'
}

/** 回归样本（含引擎输出快照） */
export interface RegressionCase extends CasePillarsInput {
  caseId: string
  expectedResult: CaseExpectedResult
  snapshotVersion: string   // 生成快照时的引擎版本
  snapshotAt: number        // 快照时间戳
}

/** 命例联合类型 */
export type CaseEntry = ClassicCase | AnonymousCase | RegressionCase

// ═══════════════════════════════════════════
// 6. 工具函数
// ═══════════════════════════════════════════

/** 判断是否为经典命例 */
export function isClassicCase(entry: CaseEntry): entry is ClassicCase {
  return (entry as ClassicCase).source !== undefined && 'name' in entry
}

/** 获取命例类别 */
export function getCaseCategory(entry: CaseEntry): CaseCategory {
  if ('snapshotVersion' in entry) return 'regression'
  if ('confidence' in entry) return 'anonymous'
  return 'classic'
}

/** 生成命例 ID */
export function generateCaseId(category: CaseCategory): string {
  const prefix: Record<CaseCategory, string> = {
    classic: 'CLS',
    anonymous: 'ANM',
    regression: 'REG',
  }
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `${prefix[category]}-${rand}`
}
