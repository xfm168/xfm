/**
 * 跨模块冲突分析器 — 核心引擎
 *
 * 职责：
 *   - 检测单个命例 expectedResult 中各模块数据的自洽性
 *   - 批量分析并生成统计报告
 *   - 管理冲突的解决状态
 */

import type { CaseEntryV2 } from './caseLibraryTypesV2'
import type {
  ModuleConflictItem,
  CrossModuleAnalysis,
  ConflictAnalysisReport,
  ConflictDistribution,
  ConflictType,
  ConflictSeverity,
} from './conflictAnalyzerTypes'

import {
  generateConflictId,
  getSeverityWeight,
} from './conflictAnalyzerTypes'

// ═══════════════════════════════════════════
// 1. 版本号
// ═══════════════════════════════════════════

export const CONFLICT_ANALYZER_VERSION = '1.0.0'

// ═══════════════════════════════════════════
// 2. 内部存储
// ═══════════════════════════════════════════

/** 已解决的冲突 ID 集合 */
const resolvedConflictIds = new Set<string>()

/** 最近分析的冲突缓存（用于 getUnresolvedConflicts） */
let lastAnalyzedConflicts: ModuleConflictItem[] = []

/** 从格列表（用于检测强弱与格局的一致性） */
const CONGGE_PATTERNS = ['从旺格', '从强格', '从弱格', '从儿格', '从财格', '从杀格', '专旺格', '从势格']

/** 扶身类喜用神（身弱时应该扶身） */
const STRENGTHENING_ELEMENTS_MAP: Record<string, string[]> = {
  '木': ['木', '水'],
  '火': ['火', '木'],
  '土': ['土', '火'],
  '金': ['金', '土'],
  '水': ['水', '金'],
}

/** 泄身类五行（身弱时不宜为喜用神） */
const WEAKENING_ELEMENTS_MAP: Record<string, string[]> = {
  '木': ['金', '土'],
  '火': ['水', '土'],
  '土': ['木', '水'],
  '金': ['火', '木'],
  '水': ['土', '火'],
}

/** 冲关系映射（地支六冲） */
const CLASH_PAIRS: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

/** 刑关系映射（地支三刑） */
const PUNISHMENT_GROUPS: string[][] = [
  ['寅', '巳', '申'], ['丑', '戌', '未'], ['子', '卯'],
  ['辰', '午', '酉', '亥'],
]

/** 害关系映射（地支六害） */
const HARM_PAIRS: [string, string][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'],
  ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
]

// ═══════════════════════════════════════════
// 3. 核心函数
// ═══════════════════════════════════════════

/**
 * 分析单个命例的跨模块冲突
 *
 * 检查 expectedResult 中各模块数据是否自洽：
 * - strengthLevel vs primaryPattern（例如"身弱"不应出现"专旺格"）
 * - strengthLevel vs xiShen（例如"身弱"喜用神应该扶身，不该是"泄身"）
 * - primaryPattern vs 十神组合一致性
 * - fortune 与命局的冲/合/刑/害
 *
 * @param entry - 命例条目
 * @returns 跨模块分析结果
 */
export function analyzeCrossModuleConflicts(entry: CaseEntryV2): CrossModuleAnalysis {
  const conflicts: ModuleConflictItem[] = []

  const er = entry.expectedResult

  // ── 检查 1: strengthLevel vs primaryPattern ──
  checkStrengthPatternConflicts(er, conflicts)

  // ── 检查 2: strengthLevel vs xiShen ──
  checkStrengthXiShenConflicts(er, conflicts)

  // ── 检查 3: primaryPattern vs 十神组合一致性 ──
  checkPatternTenGodsConsistency(er, conflicts)

  // ── 检查 4: fortune 与命局的冲/合/刑/害 ──
  checkFortuneClashes(entry, conflicts)

  // 为每个冲突计算优先级
  for (const c of conflicts) {
    c.priority = getConflictPriority(c)
  }

  // 按优先级排序
  conflicts.sort((a, b) => b.priority - a.priority)

  // 更新缓存
  lastAnalyzedConflicts = [...conflicts]

  // 统计
  const criticalCount = conflicts.filter((c) => c.severity === 'critical').length
  const majorCount = conflicts.filter((c) => c.severity === 'major').length
  const minorCount = conflicts.filter((c) => c.severity === 'minor').length

  // 综合冲突评分
  const overallConflictScore = calculateOverallScore(conflicts)

  // 高优先级冲突（severity >= major 或 priority >= 50）
  const priorityConflicts = conflicts.filter(
    (c) => c.severity === 'critical' || c.severity === 'major' || c.priority >= 50,
  )

  return {
    caseId: entry.caseId,
    conflictsFound: conflicts,
    totalConflicts: conflicts.length,
    criticalCount,
    majorCount,
    minorCount,
    overallConflictScore,
    priorityConflicts,
  }
}

/**
 * 批量分析冲突并生成统计报告
 *
 * @param cases - 命例列表
 * @returns 冲突分析报告
 */
export function batchAnalyzeConflicts(cases: CaseEntryV2[]): ConflictAnalysisReport {
  const allAnalyses = cases.map((c) => analyzeCrossModuleConflicts(c))

  const totalCases = cases.length
  const totalConflicts = allAnalyses.reduce((sum, a) => sum + a.totalConflicts, 0)

  // 冲突分布
  const conflictDistribution: ConflictDistribution = {
    rule_conflict: 0,
    pattern_conflict: 0,
    cross_module_conflict: 0,
    strength_paradox: 0,
    fortune_paradox: 0,
  }

  for (const analysis of allAnalyses) {
    for (const conflict of analysis.conflictsFound) {
      conflictDistribution[conflict.type]++
    }
  }

  // 平均冲突评分
  const avgConflictScore = totalCases > 0
    ? Math.round(
        (allAnalyses.reduce((sum, a) => sum + a.overallConflictScore, 0) / totalCases) * 100,
      ) / 100
    : 0

  return {
    version: CONFLICT_ANALYZER_VERSION,
    totalCases,
    totalConflicts,
    conflictDistribution,
    avgConflictScore,
    generatedAt: Date.now(),
  }
}

/**
 * 计算冲突优先级评分
 *
 * @param conflict - 模块冲突项
 * @returns 优先级评分 0~100
 */
export function getConflictPriority(conflict: ModuleConflictItem): number {
  // 基础分来自严重程度权重
  let score = getSeverityWeight(conflict.type === 'fortune_paradox' ? 'major' : conflict.severity)

  // 涉及模块越多，优先级越高
  score += conflict.modules.length * 5

  // 有 reason 的加 5 分
  if (conflict.reason && conflict.reason.length > 0) {
    score += 5
  }

  // 未解决的冲突优先级更高
  if (!conflict.resolution) {
    score += 10
  }

  // 上限 100
  return Math.min(Math.round(score), 100)
}

/**
 * 标记冲突为已解决
 *
 * @param conflictId - 冲突 ID
 * @param resolution - 解决方案
 * @returns 是否成功解决
 */
export function resolveConflict(conflictId: string, resolution: string): boolean {
  if (!conflictId || !resolution) return false
  resolvedConflictIds.add(conflictId)
  return true
}

/**
 * 获取所有未解决的冲突
 *
 * 基于最近一次 analyzeCrossModuleConflicts 的缓存结果
 *
 * @returns 未解决的冲突列表
 */
export function getUnresolvedConflicts(): ModuleConflictItem[] {
  return lastAnalyzedConflicts.filter((c) => !resolvedConflictIds.has(c.conflictId))
}

/** 清除已解决状态（用于测试） */
export function clearResolvedConflicts(): void {
  resolvedConflictIds.clear()
}

/** 检查冲突是否已解决 */
export function isConflictResolved(conflictId: string): boolean {
  return resolvedConflictIds.has(conflictId)
}

/** 清除分析缓存（用于测试） */
export function clearAnalysisCache(): void {
  lastAnalyzedConflicts = []
}

// ═══════════════════════════════════════════
// 4. 内部辅助函数
// ═══════════════════════════════════════════

/** 检查 strengthLevel vs primaryPattern */
function checkStrengthPatternConflicts(
  er: CaseEntryV2['expectedResult'],
  conflicts: ModuleConflictItem[],
): void {
  if (!er.strengthLevel || !er.primaryPattern) return

  const strength = er.strengthLevel
  const pattern = er.primaryPattern

  // 身弱不应出现从格/专旺格
  if (strength === '身弱' && CONGGE_PATTERNS.some((p) => pattern.includes(p))) {
    conflicts.push({
      conflictId: generateConflictId(),
      type: 'strength_paradox',
      severity: 'critical',
      description: `身弱命局不应出现从格格局"${pattern}"`,
      modules: [
        { module: '强弱分析', conclusion: `strengthLevel=${strength}`, confidence: 0.8 },
        { module: '格局判定', conclusion: `primaryPattern=${pattern}`, confidence: 0.8 },
      ],
      reason: `身弱表示日主衰弱需扶助，而从格/专旺格要求日主无条件服从一方气势，两者逻辑矛盾`,
      priority: 0,
      resolution: undefined,
    })
  }

  // 身旺出现非从旺的从格
  if (strength === '身旺' && CONGGE_PATTERNS.some((p) => pattern.includes(p)) && pattern !== '从旺格') {
    conflicts.push({
      conflictId: generateConflictId(),
      type: 'pattern_conflict',
      severity: 'major',
      description: `身旺命局出现非从旺的从格"${pattern}"`,
      modules: [
        { module: '强弱分析', conclusion: `strengthLevel=${strength}`, confidence: 0.8 },
        { module: '格局判定', conclusion: `primaryPattern=${pattern}`, confidence: 0.7 },
      ],
      reason: `身旺且日主有根时，从格（非从旺）的判定需谨慎，可能存在误判`,
      priority: 0,
      resolution: undefined,
    })
  }
}

/** 检查 strengthLevel vs xiShen */
function checkStrengthXiShenConflicts(
  er: CaseEntryV2['expectedResult'],
  conflicts: ModuleConflictItem[],
): void {
  if (!er.strengthLevel || !er.primaryXiShen || !er.dayMasterElement) return

  const strength = er.strengthLevel
  const xiShen = er.primaryXiShen
  const dayElement = er.dayMasterElement

  // 身弱时喜用神应该扶身
  if (strength === '身弱') {
    const weakening = WEAKENING_ELEMENTS_MAP[dayElement] ?? []
    if (weakening.includes(xiShen)) {
      conflicts.push({
        conflictId: generateConflictId(),
        type: 'rule_conflict',
        severity: 'critical',
        description: `身弱命局喜用神"${xiShen}"为泄身之五行`,
        modules: [
          { module: '强弱分析', conclusion: `strengthLevel=${strength}`, confidence: 0.9 },
          { module: '喜用神', conclusion: `primaryXiShen=${xiShen}`, confidence: 0.85 },
        ],
        reason: `身弱日主（${dayElement}）应取生扶之五行为喜用神，而"${xiShen}"会泄耗日主力量`,
        priority: 0,
        resolution: undefined,
      })
    }
  }

  // 身旺时喜用神应该泄身或克制
  if (strength === '身旺') {
    const strengthening = STRENGTHENING_ELEMENTS_MAP[dayElement] ?? []
    if (strengthening.includes(xiShen)) {
      conflicts.push({
        conflictId: generateConflictId(),
        type: 'rule_conflict',
        severity: 'major',
        description: `身旺命局喜用神"${xiShen}"为扶身之五行`,
        modules: [
          { module: '强弱分析', conclusion: `strengthLevel=${strength}`, confidence: 0.9 },
          { module: '喜用神', conclusion: `primaryXiShen=${xiShen}`, confidence: 0.85 },
        ],
        reason: `身旺日主（${dayElement}）应取克泄耗之五行为喜用神，而"${xiShen}"会继续增强日主力量`,
        priority: 0,
        resolution: undefined,
      })
    }
  }
}

/** 检查 primaryPattern vs 十神组合一致性 */
function checkPatternTenGodsConsistency(
  er: CaseEntryV2['expectedResult'],
  conflicts: ModuleConflictItem[],
): void {
  if (!er.primaryPattern || !er.tenGodSummary) return

  const pattern = er.primaryPattern
  const tenGods = er.tenGodSummary

  // 从财格应有财星突出
  if (pattern === '从财格') {
    if (!tenGods.includes('正财') && !tenGods.includes('偏财')) {
      conflicts.push({
        conflictId: generateConflictId(),
        type: 'pattern_conflict',
        severity: 'major',
        description: '从财格但十神中财星不突出',
        modules: [
          { module: '格局判定', conclusion: `primaryPattern=${pattern}`, confidence: 0.8 },
          { module: '十神分析', conclusion: `tenGodSummary=${tenGods}`, confidence: 0.8 },
        ],
        reason: '从财格要求财星为全局最强力量，十神分析中应体现财星主导地位',
        priority: 0,
        resolution: undefined,
      })
    }
  }

  // 从杀格应有杀星突出
  if (pattern === '从杀格') {
    if (!tenGods.includes('正官') && !tenGods.includes('偏官')) {
      conflicts.push({
        conflictId: generateConflictId(),
        type: 'pattern_conflict',
        severity: 'major',
        description: '从杀格但十神中杀星不突出',
        modules: [
          { module: '格局判定', conclusion: `primaryPattern=${pattern}`, confidence: 0.8 },
          { module: '十神分析', conclusion: `tenGodSummary=${tenGods}`, confidence: 0.8 },
        ],
        reason: '从杀格要求杀星（官杀）为全局最强力量，十神分析中应体现杀星主导地位',
        priority: 0,
        resolution: undefined,
      })
    }
  }

  // 从儿格（食伤格）应有食伤突出
  if (pattern === '从儿格') {
    if (!tenGods.includes('食神') && !tenGods.includes('伤官')) {
      conflicts.push({
        conflictId: generateConflictId(),
        type: 'pattern_conflict',
        severity: 'major',
        description: '从儿格但十神中食伤不突出',
        modules: [
          { module: '格局判定', conclusion: `primaryPattern=${pattern}`, confidence: 0.8 },
          { module: '十神分析', conclusion: `tenGodSummary=${tenGods}`, confidence: 0.8 },
        ],
        reason: '从儿格要求食伤为全局最强力量，十神分析中应体现食伤主导地位',
        priority: 0,
        resolution: undefined,
      })
    }
  }
}

/** 检查 fortune 与命局的冲/合/刑/害 */
function checkFortuneClashes(
  entry: CaseEntryV2,
  conflicts: ModuleConflictItem[],
): void {
  // 收集命局地支
  const natalBranches: string[] = [
    entry.yearZhi, entry.monthZhi, entry.dayZhi, entry.hourZhi,
  ]

  // 检查命局内部的冲
  for (let i = 0; i < natalBranches.length; i++) {
    for (let j = i + 1; j < natalBranches.length; j++) {
      // 检查六冲
      for (const [a, b] of CLASH_PAIRS) {
        if (
          (natalBranches[i] === a && natalBranches[j] === b) ||
          (natalBranches[i] === b && natalBranches[j] === a)
        ) {
          conflicts.push({
            conflictId: generateConflictId(),
            type: 'fortune_paradox',
            severity: 'minor',
            description: `命局内部存在地支六冲：${natalBranches[i]}与${natalBranches[j]}相冲`,
            modules: [
              { module: '命局分析', conclusion: `四柱地支含${natalBranches[i]}和${natalBranches[j]}`, confidence: 0.9 },
              { module: '冲合关系', conclusion: `${a}与${b}六冲`, confidence: 0.95 },
            ],
            reason: `${natalBranches[i]}与${natalBranches[j]}构成六冲，可能影响格局稳定性和运势流畅度`,
            priority: 0,
            resolution: undefined,
          })
        }
      }

      // 检查六害
      for (const [a, b] of HARM_PAIRS) {
        if (
          (natalBranches[i] === a && natalBranches[j] === b) ||
          (natalBranches[i] === b && natalBranches[j] === a)
        ) {
          conflicts.push({
            conflictId: generateConflictId(),
            type: 'fortune_paradox',
            severity: 'info',
            description: `命局内部存在地支六害：${natalBranches[i]}与${natalBranches[j]}相害`,
            modules: [
              { module: '命局分析', conclusion: `四柱地支含${natalBranches[i]}和${natalBranches[j]}`, confidence: 0.9 },
              { module: '冲合关系', conclusion: `${a}与${b}六害`, confidence: 0.9 },
            ],
            reason: `${natalBranches[i]}与${natalBranches[j]}构成六害，可能影响人际关系和感情运势`,
            priority: 0,
            resolution: undefined,
          })
        }
      }
    }
  }

  // 检查三刑
  for (const group of PUNISHMENT_GROUPS) {
    const found = group.filter((g) => natalBranches.includes(g))
    if (found.length >= 3 || (group.length === 2 && found.length >= 2)) {
      conflicts.push({
        conflictId: generateConflictId(),
        type: 'fortune_paradox',
        severity: 'minor',
        description: `命局内部存在地支三刑：${found.join('、')}`,
        modules: [
          { module: '命局分析', conclusion: `四柱地支含${found.join('、')}`, confidence: 0.9 },
          { module: '冲合关系', conclusion: `${group.join('、')}构成三刑`, confidence: 0.9 },
        ],
        reason: `${found.join('、')}构成三刑，可能带来意外波折和是非困扰`,
        priority: 0,
        resolution: undefined,
      })
    }
  }
}

/** 计算综合冲突评分 */
function calculateOverallScore(conflicts: ModuleConflictItem[]): number {
  if (conflicts.length === 0) return 0

  let totalScore = 0
  for (const c of conflicts) {
    totalScore += getSeverityWeight(c.severity)
  }

  // 归一化到 0~100：以 150 分为满分参考
  const normalized = Math.round((totalScore / 150) * 100)
  return Math.min(normalized, 100)
}
