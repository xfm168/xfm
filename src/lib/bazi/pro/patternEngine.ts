/**
 * H3 Module 4: Professional Pattern Engine — 专业格局引擎
 *
 * 数据流：
 *   ProfessionalFourPillarsResult + TenGodEngineOutput
 *       │
 *       ▼
 *   构建格局判定上下文（PatternRuleContext）
 *       │
 *       ▼
 *   多流派并行判定（子平/滴天髓/子平真诠/穷通宝鉴）
 *       │
 *       ▼
 *   格局评分 + 破格检测 + 加分项
 *       │
 *       ▼
 *   主格局选择 + 候选格局排序
 *       │
 *       ▼
 *   PatternEngineOutput (JSON)
 */

import type {
  HeavenlyStem, EarthlyBranch, FiveElement,
  ShenShi, YinYang, WuXingWangShuai,
} from '@/lib/core/types/base'
import { CANG_GAN } from '@/lib/core/constants/canggan'
import { WANG_SHUAI_TABLE } from '@/lib/core/constants/wuxing'
import type { ProfessionalFourPillarsResult, DerivationStep } from './types'
import { createChain, createTreeNode } from './types'
import type { ProfessionalConfig } from './config'
import { CLASSIC_CONFIG } from './config'
import type { TenGodEngineOutput } from './tenGodsTypes'
import type {
  PatternRule, PatternRuleContext, PatternDetail,
  PatternEngineOutput, PatternEngineOptions,
  PatternType, PatternClass, PatternSchool,
  SchoolConfig, SchoolEvaluation, BreakFactor,
  PatternExecutionMetadata,
  PatternScoreDetail, FormationChain, FormationCondition,
  FormationConditionStatus, PatternConflictResult, SchoolResult,
} from './patternTypes'
import { getPatternGrade, DEFAULT_SCHOOL_CONFIG } from './patternTypes'
import {
  PATTERN_RULES, PATTERN_KB_MAP, getRulesByClass,
  findPatternRule, getPatternKnowledge,
} from './patternDatabase'
import { getShenShi, getStemElement, getBranchElement, calculateFiveElementCount } from './helpers'

export const PATTERN_ENGINE_VERSION = '4.1.0'
export const PATTERN_CACHE_VERSION = '4.1.0'

// ─── 缓存 ───

const patternCache = new Map<string, PatternEngineOutput>()

function buildCacheKey(
  dayMaster: HeavenlyStem,
  monthZhi: EarthlyBranch,
  sixLinesStr: string,
  gender: string,
): string {
  return `pat-v${PATTERN_CACHE_VERSION}-${dayMaster}-${monthZhi}-${sixLinesStr}-${gender}`
}

export function clearPatternCache(): void { patternCache.clear() }
export function getPatternCacheSize(): number { return patternCache.size }

// ─── Step 1: 构建判定上下文 ───

function buildRuleContext(
  pillars: ProfessionalFourPillarsResult,
  tenGodOutput: TenGodEngineOutput,
): PatternRuleContext {
  const { sixLines } = pillars
  const dayGan = sixLines.day.gan
  const dayElement = getStemElement(dayGan)
  const monthZhi = sixLines.month.zhi
  const monthElement = getBranchElement(monthZhi)
  const monthBenGan = CANG_GAN[monthZhi].ben

  // 月令十神
  const monthSS = (getShenShi(dayGan, monthBenGan) || '比肩') as ShenShi

  // 十神力量映射
  const tenGodPower: Record<string, number> = {}
  const tenGodCount: Record<string, number> = {}
  const tenGodDeLing: Record<string, boolean> = {}
  for (const d of tenGodOutput.details) {
    tenGodPower[d.name] = d.power
    tenGodCount[d.name] = d.count
    tenGodDeLing[d.name] = d.deLing
  }

  // 五行力量分布
  const feCount = calculateFiveElementCount(sixLines)
  const total = Object.values(feCount).reduce((a, b) => a + b, 0)
  const fiveElementPower: Record<string, number> = {}
  const fiveElementCount: Record<string, number> = {}
  for (const e of ['木', '火', '土', '金', '水'] as FiveElement[]) {
    fiveElementPower[e] = total > 0 ? Math.round(feCount[e] / total * 100) : 0
    fiveElementCount[e] = feCount[e]
  }

  // 天干地支数组
  const heavenlyStems = [sixLines.year.gan, sixLines.month.gan, sixLines.day.gan, sixLines.hour.gan] as [HeavenlyStem, HeavenlyStem, HeavenlyStem, HeavenlyStem]
  const earthlyBranches = [sixLines.year.zhi, sixLines.month.zhi, sixLines.day.zhi, sixLines.hour.zhi] as [EarthlyBranch, EarthlyBranch, EarthlyBranch, EarthlyBranch]

  // 日主旺衰
  const dayMasterWangShuai: WuXingWangShuai = WANG_SHUAI_TABLE[monthElement]?.[dayElement] ?? '休'

  return {
    monthCommandShenShi: monthSS,
    monthZhi,
    monthBenGan,
    monthElement,
    dayMaster: dayGan,
    dayMasterElement: dayElement,
    dayMasterYinYang: pillars.dayMasterYinYang,
    tenGodPower,
    tenGodCount,
    tenGodDeLing,
    fiveElementPower,
    fiveElementCount,
    heavenlyStems,
    earthlyBranches,
    dayMasterWangShuai,
  }
}

// ─── Step 2: 多流派格局判定 ───

function computeScoreDetail(
  ctx: PatternRuleContext,
  rule: PatternRule,
  breakCount: number,
): PatternScoreDetail {
  // 月令基础（30%）：月令十神是否匹配
  const mcMatch = ctx.monthCommandShenShi === rule.involvedShenShi[0]
  const monthCommandBase = mcMatch ? 30 : 10

  // 透干条件（20%）：主要十神透干
  const mainSS = rule.involvedShenShi[0]
  const touGanPower = mainSS ? Math.min(20, Math.round((ctx.tenGodPower[mainSS] ?? 0) / 5)) : 0

  // 根气支持（15%）：藏干出现
  const cangGanPower = mainSS ? Math.min(15, (ctx.tenGodCount[mainSS] ?? 0) * 8) : 0

  // 十神配合（15%）：加分条件满足度
  let harmonyBoost = 0
  if (rule.boostConditions) {
    for (const bc of rule.boostConditions) {
      if (bc(ctx)) harmonyBoost += 8
    }
  }
  const shenShiHarmony = Math.min(15, harmonyBoost)

  // 五行平衡（10%）：日主五行占比不要太偏
  const dayPct = ctx.fiveElementPower[ctx.dayMasterElement] ?? 20
  const idealPct = 20
  const fiveElementBalance = Math.max(0, 10 - Math.abs(dayPct - idealPct) * 0.5)

  // 破格影响（可为负，权重10%）：每条破格 -10
  const breakImpact = -breakCount * 10

  return { monthCommandBase, touGanCondition: touGanPower, rootSupport: cangGanPower, shenShiHarmony, fiveElementBalance: breakImpact >= -10 ? fiveElementBalance : fiveElementBalance, breakImpact }
}

function buildFormationChain(
  ctx: PatternRuleContext,
  rule: PatternRule,
): FormationChain {
  const conditions: FormationCondition[] = []

  // 月令基础条件
  conditions.push({
    description: `月令${ctx.monthZhi}十神为${ctx.monthCommandShenShi}`,
    status: ctx.monthCommandShenShi === rule.involvedShenShi[0] ? 'satisfied' : 'missing',
    involvedShenShi: [rule.involvedShenShi[0]],
    reference: rule.reference,
  })

  // 透干条件
  const mainSS = rule.involvedShenShi[0]
  conditions.push({
    description: `${mainSS}透干出现`,
    status: (ctx.tenGodCount[mainSS] ?? 0) > 0 ? 'satisfied' : 'missing',
    involvedShenShi: [mainSS],
    reference: rule.reference,
  })

  // 根气条件
  conditions.push({
    description: `${mainSS}有根（藏干支持）`,
    status: (ctx.tenGodCount[mainSS] ?? 0) > 1 ? 'satisfied' : 'missing',
    involvedShenShi: [mainSS],
    reference: rule.reference,
  })

  // 力量条件
  conditions.push({
    description: `${mainSS}力量充足（>30）`,
    status: (ctx.tenGodPower[mainSS] ?? 0) > 30 ? 'satisfied' : 'missing',
    involvedShenShi: [mainSS],
    reference: rule.reference,
  })

  // 加分条件
  if (rule.boostConditions) {
    for (const bc of rule.boostConditions) {
      const satisfied = bc(ctx)
      conditions.push({
        description: `${rule.description}加分条件`,
        status: satisfied ? 'satisfied' : 'missing',
        involvedShenShi: rule.involvedShenShi,
        reference: rule.reference,
      })
    }
  }

  // 破格条件
  if (rule.breakConditions) {
    for (const brc of rule.breakConditions) {
      const breaking = brc(ctx)
      conditions.push({
        description: `${rule.patternName}破格检测`,
        status: breaking ? 'breaking' : 'satisfied',
        involvedShenShi: rule.involvedShenShi,
        reference: rule.reference,
      })
    }
  }

  const satisfiedCount = conditions.filter(c => c.status === 'satisfied').length
  const missingCount = conditions.filter(c => c.status === 'missing').length
  const breakingCount = conditions.filter(c => c.status === 'breaking').length

  return { patternName: rule.patternName, conditions, satisfiedCount, missingCount, breakingCount }
}

function evaluatePatternWithSchools(
  ctx: PatternRuleContext,
  schoolConfig: SchoolConfig[],
): PatternDetail[] {
  const enabledSchools = schoolConfig.filter(s => s.enabled).map(s => s.name)
  if (enabledSchools.length === 0) return []

  const matchedPatterns: Map<string, {
    rule: PatternRule
    schoolScores: Map<string, { score: number; breakFactors: BreakFactor[]; reason: string }>
    totalWeight: number
    weightedScore: number
  }> = new Map()

  for (const rule of PATTERN_RULES) {
    const applicableSchools = enabledSchools.filter(s => rule.school.includes(s))
    if (applicableSchools.length === 0) continue

    if (!rule.check(ctx)) continue

    const schoolScores = new Map<string, { score: number; breakFactors: BreakFactor[]; reason: string }>()

    for (const school of applicableSchools) {
      let score = 60

      if (rule.boostConditions) {
        for (const bc of rule.boostConditions) {
          if (bc(ctx)) score += 10
        }
      }

      const breakFactors: BreakFactor[] = []
      if (rule.breakConditions) {
        for (const brc of rule.breakConditions) {
          if (brc(ctx)) {
            score -= 25
            breakFactors.push({
              description: `${rule.patternName}破格：${rule.description}`,
              severity: 80,
              involvedShenShi: rule.involvedShenShi,
              reference: rule.reference,
            })
          }
        }
      }

      const mainSS = rule.involvedShenShi[0]
      if (mainSS) {
        const power = ctx.tenGodPower[mainSS] ?? 0
        score += Math.min(15, Math.round(power / 10))
      }

      score = Math.min(100, Math.max(0, score))

      // 生成理由
      const reasonParts: string[] = []
      reasonParts.push(`${school}体系：${rule.patternName}${getPatternGrade(score)}，成格度${score}分。`)
      if (ctx.monthCommandShenShi === mainSS) reasonParts.push('月令得令。')
      if (breakFactors.length > 0) reasonParts.push(`存在${breakFactors.length}项破格因素。`)
      if (rule.boostConditions) {
        const boostMet = rule.boostConditions.filter(bc => bc(ctx)).length
        if (boostMet > 0) reasonParts.push(`${boostMet}项加分条件满足。`)
      }

      schoolScores.set(school, { score, breakFactors, reason: reasonParts.join('') })
    }

    let weightedSum = 0
    let totalWeight = 0
    for (const sc of schoolConfig) {
      if (!sc.enabled || !schoolScores.has(sc.name)) continue
      const { score } = schoolScores.get(sc.name)!
      weightedSum += score * sc.weight
      totalWeight += sc.weight
    }

    const weightedScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
    matchedPatterns.set(rule.patternName, {
      rule, schoolScores, totalWeight, weightedScore,
    })
  }

  // 转换为 PatternDetail 数组
  const details: PatternDetail[] = []
  for (const [patternName, data] of matchedPatterns) {
    const kb = PATTERN_KB_MAP[patternName]
    const grade = getPatternGrade(data.weightedScore)
    const matchedSchools = [...data.schoolScores.keys()] as PatternSchool[]

    const allBreakFactors: BreakFactor[] = []
    for (const [, v] of data.schoolScores) {
      allBreakFactors.push(...v.breakFactors)
    }
    const uniqueBreaks = new Map<string, BreakFactor>()
    for (const bf of allBreakFactors) {
      if (!uniqueBreaks.has(bf.description)) {
        uniqueBreaks.set(bf.description, bf)
      }
    }

    const advantages: string[] = []
    if (kb) {
      advantages.push(...kb.advantages)
      if (data.rule.boostConditions) {
        for (const bc of data.rule.boostConditions) {
          if (bc(ctx)) advantages.push(data.rule.description)
        }
      }
    }

    // 风险
    const risks: string[] = []
    if (kb) risks.push(...kb.risks)
    for (const bf of [...uniqueBreaks.values()]) {
      risks.push(bf.description)
    }

    const analysis = kb
      ? `${kb.description}成格度${data.weightedScore}分，${grade}。${matchedSchools.length}个流派支持。`
      : `${patternName}成格度${data.weightedScore}分，${grade}。`

    const adjustments: string[] = []
    if (kb) adjustments.push(...kb.adjustments)
    if (uniqueBreaks.size > 0) {
      adjustments.push('优先解决破格因素以提升格局层次。')
    }

    // 综合建议
    const suggestions: string[] = []
    if (kb) {
      suggestions.push(`格局${grade}，${kb.description}`)
      if (uniqueBreaks.size === 0) {
        suggestions.push('格局清纯，可顺势发展。')
      } else {
        suggestions.push('需注意破格因素的化解。')
      }
    }

    const confSchools = matchedSchools.length
    const confBase = 40
    const confSchoolBonus = Math.min(25, confSchools * 8)
    const confScoreBonus = Math.min(25, Math.round(data.weightedScore / 4))
    const confidence = Math.min(100, confBase + confSchoolBonus + confScoreBonus)

    // 4.1 新增：评分拆分
    const scoreDetail = computeScoreDetail(ctx, data.rule, uniqueBreaks.size)

    // 4.1 新增：成格条件链
    const formationChain = buildFormationChain(ctx, data.rule)

    // 4.1 新增：流派详细结果（含未启用的流派，便于对比）
    const schoolResults: SchoolResult[] = []
    for (const sc of schoolConfig) {
      const ss = sc.enabled ? data.schoolScores.get(sc.name) : undefined
      schoolResults.push({
        school: sc.name,
        matched: ss !== undefined,
        formScore: ss?.score ?? 0,
        weight: sc.weight,
        weightedScore: ss ? Math.round(ss.score * sc.weight) : 0,
        patternName: patternName as PatternType,
        breakFactors: ss?.breakFactors ?? [],
        reason: ss?.reason ?? '',
      })
    }

    details.push({
      name: patternName as PatternType,
      patternClass: data.rule.patternClass,
      formScore: data.weightedScore,
      grade,
      isPrimary: false,
      isSecondary: false,
      matchedSchools,
      advantages,
      risks,
      breakFactors: [...uniqueBreaks.values()],
      analysis,
      adjustments,
      suggestions,
      confidence,
      scoreDetail,
      formationChain,
      schoolResults,
    })
  }

  details.sort((a, b) => b.formScore - a.formScore)

  if (details.length > 0) {
    details[0].isPrimary = true
    // 标记副格局
    for (let i = 1; i < details.length; i++) {
      details[i].isSecondary = true
    }
  }

  return details
}

// ─── Step 3.5: 格局冲突处理（PatternConflictResolver） ───

function resolvePatternConflicts(allPatterns: PatternDetail[]): PatternConflictResult | null {
  if (allPatterns.length <= 1) return null

  const primary = allPatterns.find(p => p.isPrimary)
  if (!primary) return null

  const secondary = allPatterns.filter(p => p.isSecondary)
  const secondaryNames = secondary.map(p => p.name)

  // 检查是否有冲突（如正官 vs 伤官）
  const conflictPairs: [PatternType, PatternType][] = [
    ['正官格', '伤官格'], ['伤官格', '正官格'],
    ['正财格', '建禄格'], ['建禄格', '正财格'],
  ]

  let hasConflict = false
  for (const [a, b] of conflictPairs) {
    if (primary.name === a && secondaryNames.includes(b)) {
      hasConflict = true
      break
    }
  }

  const resolutionMethod: 'priority' | 'absorb' | 'relegate' = hasConflict ? 'relegate' : 'priority'
  const conflictDescription = hasConflict
    ? `${primary.name}与${secondaryNames.join('、')}存在冲突，${primary.name}为主格，其余降为副格。`
    : `${primary.name}为主格，${secondaryNames.length > 0 ? secondaryNames.join('、') + '为副格' : '无副格'}。`

  return {
    mainPattern: primary.name,
    secondaryPatterns: secondaryNames,
    conflictDescription,
    resolutionMethod,
  }
}

// ─── Step 3: 流派评分汇总 ───

function buildSchoolEvaluations(
  patterns: PatternDetail[],
  schoolConfig: SchoolConfig[],
): SchoolEvaluation[] {
  if (patterns.length === 0) return []

  // 取主格局
  const primary = patterns.find(p => p.isPrimary) ?? patterns[0]

  return schoolConfig.filter(s => s.enabled).map(sc => ({
    school: sc.name,
    matched: primary.matchedSchools.includes(sc.name),
    formScore: primary.matchedSchools.includes(sc.name) ? primary.formScore : 0,
    weight: sc.weight,
    weightedScore: primary.matchedSchools.includes(sc.name)
      ? Math.round(primary.formScore * sc.weight)
      : 0,
    breakFactors: primary.breakFactors,
  }))
}

// ─── 主引擎入口 ───

/**
 * 计算格局
 *
 * @param pillars - 四柱排盘结果（Module 1）
 * @param tenGodOutput - 十神分析结果（Module 3）
 * @param options - 引擎选项
 * @returns 格局分析结果
 */
export function calculatePattern(
  pillars: ProfessionalFourPillarsResult,
  tenGodOutput: TenGodEngineOutput,
  options: PatternEngineOptions,
): PatternEngineOutput {
  const engineStart = Date.now()
  const config = options.config ?? CLASSIC_CONFIG
  const schoolConfig = options.schoolConfig ?? DEFAULT_SCHOOL_CONFIG
  const allSteps: DerivationStep[] = []
  const warnings: string[] = []

  // 缓存检查
  const sixLinesStr = `${pillars.sixLines.year.gan}${pillars.sixLines.year.zhi}${pillars.sixLines.month.gan}${pillars.sixLines.month.zhi}${pillars.sixLines.day.gan}${pillars.sixLines.day.zhi}${pillars.sixLines.hour.gan}${pillars.sixLines.hour.zhi}`
  const cacheKey = buildCacheKey(
    pillars.dayMaster, pillars.sixLines.month.zhi, sixLinesStr, options.gender,
  )
  const cached = patternCache.get(cacheKey)
  if (cached) {
    return { ...cached, computeTimeMs: 0 }
  }

  // Step 1: 构建判定上下文
  const ctx = buildRuleContext(pillars, tenGodOutput)

  allSteps.push(createTreeNode({
    id: 'pattern-build-context',
    name: '构建格局判定上下文',
    input: {
      dayMaster: ctx.dayMaster,
      monthCommand: ctx.monthCommandShenShi,
      monthZhi: ctx.monthZhi,
    },
    output: {
      monthCommandShenShi: ctx.monthCommandShenShi,
      dayMasterWangShuai: ctx.dayMasterWangShuai,
      tenGodCount: ctx.tenGodCount,
    },
    confidence: 95,
    ruleDescription: `月令${ctx.monthZhi}，月令十神${ctx.monthCommandShenShi}，日主${ctx.dayMasterWangShuai}`,
  }))

  // Step 2: 多流派判定
  const enabledSchools = schoolConfig.filter(s => s.enabled).map(s => s.name)
  const allPatterns = evaluatePatternWithSchools(ctx, schoolConfig)

  allSteps.push(createTreeNode({
    id: 'pattern-evaluate',
    name: '多流派格局判定',
    input: {
      enabledSchools,
      ruleCount: PATTERN_RULES.length,
    },
    output: {
      matchedCount: allPatterns.length,
      patterns: allPatterns.map(p => ({ name: p.name, score: p.formScore, grade: p.grade })),
    },
    confidence: 85,
    ruleDescription: `启用流派[${enabledSchools.join('/')}]，命中${allPatterns.length}个格局`,
  }))

  // Step 3: 流派评分
  const schoolEvaluations = buildSchoolEvaluations(allPatterns, schoolConfig)

  // Step 4: 主格局选择
  const primaryPattern = allPatterns.find(p => p.isPrimary) ?? null

  // Step 4.5: 副格局
  const secondaryPatterns = allPatterns.filter(p => p.isSecondary)

  // Step 4.7: 格局冲突处理
  const patternConflictResult = resolvePatternConflicts(allPatterns)

  // Step 5: 总体评分
  const overallPatternScore = primaryPattern ? primaryPattern.formScore : 0
  const overallConfidence = primaryPattern ? primaryPattern.confidence : 0

  // Step 6: Module 3 候选格局复用
  const candidates = tenGodOutput.possiblePatterns ?? []

  const computeTimeMs = Date.now() - engineStart

  // UNKNOWN_RULE: 所有规则均未匹配到格局
  if (allPatterns.length === 0 && PATTERN_RULES.length > 0) {
    warnings.push('UNKNOWN_RULE')
  }

  // MULTI_RULE_CONFLICT: 格局冲突
  if (patternConflictResult && patternConflictResult.resolutionMethod === 'relegate') {
    warnings.push('MULTI_RULE_CONFLICT')
  }

  // Step 7: 执行元数据
  const matchedRules = PATTERN_RULES.filter(r => allPatterns.some(p => p.name === r.patternName))
  const executionMetadata: PatternExecutionMetadata = {
    executionTime: computeTimeMs,
    ruleCount: PATTERN_RULES.length,
    matchedRules: matchedRules.length,
    evaluatedSchools: enabledSchools.length,
  }

  // 汇总 schoolResults
  const schoolResults: SchoolResult[] = primaryPattern
    ? primaryPattern.schoolResults
    : []

  const output: PatternEngineOutput = {
    version: PATTERN_ENGINE_VERSION,
    dayMaster: pillars.dayMaster,
    dayMasterElement: pillars.dayMasterElement,
    primaryPattern,
    secondaryPatterns,
    allPatterns,
    patternConflictResult,
    candidates,
    schoolEvaluations,
    schoolResults,
    overallPatternScore,
    overallConfidence,
    patternRecognized: allPatterns.length > 0,
    schoolConfig,
    monthCommandShenShi: ctx.monthCommandShenShi,
    monthZhi: ctx.monthZhi,
    warnings,
    computeTimeMs,
    executionMetadata,
    cacheVersion: PATTERN_CACHE_VERSION,
    derivation: createChain(allSteps, computeTimeMs, {
      engineVersion: PATTERN_ENGINE_VERSION,
      algorithmVersion: config.algorithmVersion,
      warnings,
    }),
  }

  patternCache.set(cacheKey, output)
  return output
}

// ─── AI Explain 接口 ───

/** 生成格局 AI 解释 */
export function generatePatternExplain(detail: PatternDetail): {
  name: string
  analysis: string
  patternAdvantages: string[]
  patternRisks: string[]
  patternSuggestions: string[]
  breakFactors: string[]
  adjustments: string[]
  keywords: string[]
  career: string[]
  wealth: string[]
  marriage: string[]
  health: string[]
} {
  const kb = getPatternKnowledge(detail.name)
  return {
    name: detail.name,
    analysis: detail.analysis,
    patternAdvantages: detail.advantages,
    patternRisks: detail.risks,
    patternSuggestions: detail.suggestions,
    breakFactors: detail.breakFactors.map(bf => bf.description),
    adjustments: detail.adjustments,
    keywords: kb?.keywords ?? [],
    career: kb?.career ?? [],
    wealth: kb?.wealth ?? [],
    marriage: kb?.marriage ?? [],
    health: kb?.health ?? [],
  }
}
