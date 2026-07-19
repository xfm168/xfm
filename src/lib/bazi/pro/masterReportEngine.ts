/**
 * Module 7: Professional AI Report Engine — 核心引擎
 *
 * 职责：数据整合、交叉验证、命理推理、报告生成
 * 约束：本模块不做任何命理算法计算，只读取 Module 1~6 的输出数据
 *
 * 典籍来源：
 * 《滴天髓》明·京图 / 清·任铁樵注 — 命理总论、五行生克
 * 《三命通会》明·万民英 — 综合论命、格局论
 * 《子平真诠》清·沈孝瞻 — 格局用神详论
 * 《穷通宝鉴》清·无名氏 — 调候论命
 * 《渊海子平》宋·徐升 — 命理大全、十神论、大运流年
 */

import type { FiveElement, ShenShi } from '@/lib/core/types/base'

import type {
  DerivationStep,
  DerivationChain,
} from './types'
import { createChain, createTreeNode } from './types'

import type {
  ModuleInputs,
  MasterReport,
  MasterReportOptions,
  CrossValidationResult,
  OverallAssessment,
  FiveDimensionScores,
  FiveDimensionItem,
  TimelineStage,
  RiskItem,
  OpportunityItem,
  RecommendationItem,
  MasterExplainEntry,
  RiskLevel,
} from './masterReportTypes'
import { getDimensionLevel, getRiskLevel } from './masterReportTypes'

import type {
  CrossValidationRule,
  MasterRiskRule,
  MasterOpportunityRule,
  MasterRecommendationRule,
  MasterExplainKBEntry,
} from './masterReportDatabase'
import {
  CROSS_VALIDATION_RULES,
  RISK_RULES,
  OPPORTUNITY_RULES,
  RECOMMENDATION_RULES,
  MASTER_EXPLAIN_KB,
} from './masterReportDatabase'

import { CLASSIC_CONFIG } from './config'

import { clamp } from './helpers'

// ═══════════════════════════════════════════════════════════
// 0. 版本号
// ═══════════════════════════════════════════════════════════

/** 引擎版本号 */
export const MASTER_REPORT_VERSION = '7.0.0'
/** 缓存版本号 */
export const MASTER_REPORT_CACHE_VERSION = '7.0.0'

// ═══════════════════════════════════════════════════════════
// 1. 缓存管理
// ═══════════════════════════════════════════════════════════

/** MasterReport 缓存 */
const masterReportCache = new Map<string, MasterReport>()

/**
 * 清空 MasterReport 缓存
 */
export function clearMasterReportCache(): void {
  masterReportCache.clear()
}

/**
 * 获取当前缓存条目数量
 * @returns 缓存中的报告数量
 */
export function getMasterReportCacheSize(): number {
  return masterReportCache.size
}

// ═══════════════════════════════════════════════════════════
// 2. 内部工具函数
// ═══════════════════════════════════════════════════════════

/**
 * 判断数组是否为空
 * @param arr - 待检查的数组
 * @returns 数组长度为 0 时返回 true
 */
function isEmptyArray<T>(arr: readonly T[]): boolean {
  return arr.length === 0
}

// ═══════════════════════════════════════════════════════════
// 3. 核心 Pipeline
// ═══════════════════════════════════════════════════════════

/**
 * 生成综合命理报告 — Module 7 主入口
 *
 * Pipeline 步骤：
 * 1. 交叉验证
 * 2. 命局总评
 * 3. 五维评分
 * 4. 时间轴
 * 5. 风险识别
 * 6. 机会识别
 * 7. 建议生成
 * 8. AI 解释
 *
 * @param inputs - Module 1~6 全部引擎输出的聚合输入
 * @param options - 可选配置项
 * @returns 完整的 MasterReport 报告
 */
export function generateMasterReport(
  inputs: ModuleInputs,
  options?: MasterReportOptions,
): MasterReport {
  const startTime = Date.now()
  const usedOptions = options ?? (null as never)
  const _config = usedOptions.config ?? CLASSIC_CONFIG

  // 缓存 key
  const cacheKey = `v7.0.0:${JSON.stringify(inputs.pillars.sixLines)}`
  const cached = masterReportCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const derivationSteps: DerivationStep[] = []
  const allWarnings: string[] = []

  // ── 步骤1：交叉验证 ──
  const cv = performCrossValidation(inputs)

  // 交叉验证存在矛盾时添加 MULTI_RULE_CONFLICT 警告
  if (cv.contradictions.length > 0) {
    allWarnings.push('MULTI_RULE_CONFLICT')
  }

  // 交叉验证置信度过低时添加 LOW_CONFIDENCE 警告
  if (cv.confidence < 0.5) {
    allWarnings.push('LOW_CONFIDENCE')
  }
  derivationSteps.push(createTreeNode({
    id: 'step-1-cross-validation',
    name: '交叉验证',
    input: { modules: ['pattern', 'tenGods', 'xiYong', 'shenSha', 'fortune'] },
    output: {
      validated: cv.validated,
      confidence: cv.confidence,
      reasons: cv.reasons,
      contradictions: cv.contradictions,
    },
    confidence: cv.confidence,
    ruleDescription: '遍历 CROSS_VALIDATION_RULES，交叉验证 Module 1~6 数据一致性',
    source: '三命通会',
    algorithmVersion: 'v1.0-classic',
  }))

  // ── 步骤2：命局总评 ──
  const assessment = generateOverallAssessment(inputs, cv)
  derivationSteps.push(createTreeNode({
    id: 'step-2-overall-assessment',
    name: '命局总评',
    input: {
      dayMaster: inputs.pillars.dayMaster,
      pattern: inputs.pattern.primaryPattern?.name ?? (null as never),
    },
    output: { summary: assessment.summary.slice(0, 100) },
    confidence: assessment.confidence,
    ruleDescription: '综合日主、格局、喜用神生成命局总评',
    source: '滴天髓',
    algorithmVersion: 'v1.0-classic',
  }))

  // ── 步骤3：五维评分 ──
  const fiveDim = calculateFiveDimensionScores(inputs)
  derivationSteps.push(createTreeNode({
    id: 'step-3-five-dimension',
    name: '五维评分',
    input: { fortuneScores: inputs.fortune.scores },
    output: { overall: fiveDim.overall },
    confidence: 0.75,
    ruleDescription: '基于 Module 1~6 数据综合评估事业/财富/婚姻/健康/学业五维度',
    source: '渊海子平',
    algorithmVersion: 'v1.0-classic',
  }))

  // ── 步骤4：时间轴 ──
  const timeline = usedOptions.enableTimeline !== false
    ? generateTimeline(inputs)
    : []
  derivationSteps.push(createTreeNode({
    id: 'step-4-timeline',
    name: '时间轴生成',
    input: {
      qiYunStartAge: inputs.fortune.qiYunInfo.startAge,
      daYunCount: inputs.fortune.daYunSteps.length,
    },
    output: { stageCount: timeline.length },
    confidence: 0.7,
    ruleDescription: '根据大运步骤和起运信息分配到儿童/青年/中年/晚年四个阶段',
    source: '渊海子平',
    algorithmVersion: 'v1.0-classic',
  }))

  // ── 步骤5：风险识别 ──
  const risks = usedOptions.enableRiskEngine !== false
    ? detectRisks(inputs)
    : []
  derivationSteps.push(createTreeNode({
    id: 'step-5-risk-detection',
    name: '风险识别',
    input: { ruleCount: RISK_RULES.length },
    output: { riskCount: risks.length },
    confidence: 0.7,
    ruleDescription: '遍历 RISK_RULES 基于十神/喜用神/大运检测事业/投资/婚姻/健康/官非/财务风险',
    source: '滴天髓',
    algorithmVersion: 'v1.0-classic',
  }))

  // ── 步骤6：机会识别 ──
  const opportunities = usedOptions.enableOpportunityEngine !== false
    ? detectOpportunities(inputs)
    : []
  derivationSteps.push(createTreeNode({
    id: 'step-6-opportunity-detection',
    name: '机会识别',
    input: { ruleCount: OPPORTUNITY_RULES.length },
    output: { opportunityCount: opportunities.length },
    confidence: 0.65,
    ruleDescription: '遍历 OPPORTUNITY_RULES 基于大运流年喜用神到位识别机会窗口',
    source: '三命通会',
    algorithmVersion: 'v1.0-classic',
  }))

  // ── 步骤7：建议生成 ──
  const recommendations = usedOptions.enableRecommendation !== false
    ? generateRecommendations(inputs)
    : []
  derivationSteps.push(createTreeNode({
    id: 'step-7-recommendation',
    name: '建议生成',
    input: { ruleCount: RECOMMENDATION_RULES.length },
    output: { recommendationCount: recommendations.length },
    confidence: 0.65,
    ruleDescription: '遍历 RECOMMENDATION_RULES 基于喜用神五行生成职业/行业/颜色/方位等建议',
    source: '穷通宝鉴',
    algorithmVersion: 'v1.0-classic',
  }))

  // ── 步骤8：AI 解释 ──
  const explains = usedOptions.enableExplain !== false
    ? generateMasterExplains(inputs)
    : []
  derivationSteps.push(createTreeNode({
    id: 'step-8-explains',
    name: 'AI 解释生成',
    input: { kbCount: MASTER_EXPLAIN_KB.length },
    output: { explainCount: explains.length },
    confidence: 0.6,
    ruleDescription: '从 MASTER_EXPLAIN_KB 中匹配当前命局特征生成 AI 解释条目',
    source: '滴天髓',
    algorithmVersion: 'v1.0-classic',
  }))

  const computeTimeMs = Date.now() - startTime
  const derivation = createChain(
    derivationSteps,
    computeTimeMs,
    {
      engineVersion: MASTER_REPORT_VERSION,
      algorithmVersion: 'v1.0-classic',
      warnings: allWarnings,
    },
  )

  const report: MasterReport = {
    version: MASTER_REPORT_VERSION,
    dayMaster: inputs.pillars.dayMaster,
    dayMasterElement: inputs.pillars.dayMasterElement,

    overallAssessment: assessment,
    fiveDimensionScores: fiveDim,
    crossValidation: cv,
    timeline,
    risks,
    opportunities,
    recommendations,
    explains,

    warnings: allWarnings,
    computeTimeMs,
    executionMetadata: {
      computeTimeMs,
      cacheVersion: MASTER_REPORT_CACHE_VERSION,
      moduleVersions: {
        pillars: inputs.pillars.version,
        shenSha: inputs.shenSha.version,
        tenGods: inputs.tenGods.version,
        pattern: inputs.pattern.version,
        xiYong: inputs.xiYong.version,
        fortune: inputs.fortune.version,
      },
    },
    cacheVersion: MASTER_REPORT_CACHE_VERSION,
    derivation,
  }

  // 写入缓存
  masterReportCache.set(cacheKey, report)

  return report
}

// ═══════════════════════════════════════════════════════════
// 4. 交叉验证
// ═══════════════════════════════════════════════════════════

/**
 * 执行交叉验证 — 遍历 CROSS_VALIDATION_RULES 检查各模块数据一致性
 *
 * 验证逻辑：
 * 1. 格局是否有十神支持（pattern.primaryPattern 存在 → tenGods.primaryShenShi 包含对应十神）
 * 2. 格局是否有喜用神支持（pattern.primaryPattern 存在 → xiYong.xiYongGroup 的喜用神五行与格局用神一致）
 * 3. 身强身弱与喜用神一致性（xiYong.strength.level + xiYong.xiYongGroup 应匹配）
 * 4. 大运与喜用神一致性（fortune.daYunSteps 中喜用神到位的比例）
 *
 * @param inputs - Module 1~6 聚合输入
 * @returns 交叉验证结果
 */
function performCrossValidation(inputs: ModuleInputs): CrossValidationResult {
  const reasons: string[] = []
  const contradictions: string[] = []
  const supportingModules: string[] = []
  let passCount = 0
  const traceChain: DerivationStep[] = []

  // 遍历每条交叉验证规则
  for (const rule of CROSS_VALIDATION_RULES) {
    const result = evaluateCrossValidationRule(rule, inputs)
    traceChain.push(createTreeNode({
      id: `cv-${rule.id}`,
      name: rule.name,
      input: { ruleId: rule.id, modules: rule.modules },
      output: { passed: result.passed, reason: result.reason },
      confidence: result.confidence,
      ruleDescription: rule.description,
      source: rule.classicalReference,
    }))

    // 收集支持的模块
    for (const mod of rule.modules) {
      if (!supportingModules.includes(mod)) {
        supportingModules.push(mod)
      }
    }

    if (result.passed) {
      passCount++
      reasons.push(result.reason)
    } else {
      contradictions.push(result.reason)
    }
  }

  // 验证1：格局是否有十神支持
  if (inputs.pattern.primaryPattern) {
    const patternName = inputs.pattern.primaryPattern.name
    const patternShenShi = extractShenShiFromPatternName(patternName)
    const primaryShenShi = inputs.tenGods.primaryShenShi
    if (patternShenShi && primaryShenShi.includes(patternShenShi)) {
      passCount++
      reasons.push(`格局「${patternName}」对应的十神「${patternShenShi}」在命局十神主力中，格局有十神支持`)
    } else if (patternShenShi) {
      contradictions.push(`格局「${patternName}」对应的十神「${patternShenShi}」未在十神主力（${primaryShenShi.join('、')}）中找到`)
    }
  }

  // 验证2：身强身弱与喜用神一致性
  const strengthLevel = inputs.xiYong.strength.strengthLevel
  const xiElements: FiveElement[] = []
  const yongElements: FiveElement[] = []
  const jiElements: FiveElement[] = []
  for (const item of inputs.xiYong.xiYongGroup.xiShen) {
    xiElements.push(item.element)
  }
  for (const item of inputs.xiYong.xiYongGroup.yongShen) {
    yongElements.push(item.element)
  }
  for (const item of inputs.xiYong.xiYongGroup.jiShen) {
    jiElements.push(item.element)
  }
  const allXiYongElements = [...xiElements, ...yongElements]

  // 身强应喜克泄耗（财、官杀、食伤），身弱应喜生扶（印、比劫）
  const keXieHaoElements: FiveElement[] = ['金', '水', '火']
  const shengFuElements: FiveElement[] = ['木', '水']

  if (strengthLevel === '偏强' || strengthLevel === '极强') {
    // 身强：喜用神应偏克泄耗
    const hasKeXie = allXiYongElements.some(e => keXieHaoElements.includes(e))
    if (hasKeXie) {
      passCount++
      reasons.push(`身强（${strengthLevel}），喜用神中包含克泄耗五行，与身强喜克泄一致`)
    } else {
      contradictions.push(`身强（${strengthLevel}），但喜用神中未见明显的克泄耗五行`)
    }
  } else if (strengthLevel === '偏弱' || strengthLevel === '极弱') {
    // 身弱：喜用神应偏生扶
    const hasShengFu = allXiYongElements.some(e => shengFuElements.includes(e))
    if (hasShengFu) {
      passCount++
      reasons.push(`身弱（${strengthLevel}），喜用神中包含生扶五行，与身弱喜生扶一致`)
    } else {
      contradictions.push(`身弱（${strengthLevel}），但喜用神中未见明显的生扶五行`)
    }
  }

  // 验证3：大运与喜用神一致性
  const daYunSteps = inputs.fortune.daYunSteps
  if (!isEmptyArray(daYunSteps)) {
    let xiYongMatchCount = 0
    for (const step of daYunSteps) {
      if (step.xiYongRelations.isXiShen || step.xiYongRelations.isYongShen) {
        xiYongMatchCount++
      }
    }
    const ratio = xiYongMatchCount / daYunSteps.length
    if (ratio >= 0.5) {
      passCount++
      reasons.push(`大运 ${daYunSteps.length} 步中 ${xiYongMatchCount} 步喜用神到位（${Math.round(ratio * 100)}%），大运总体顺势`)
    } else {
      contradictions.push(`大运 ${daYunSteps.length} 步中仅 ${xiYongMatchCount} 步喜用神到位（${Math.round(ratio * 100)}%），大运逆势较多`)
    }
  }

  const totalRules = CROSS_VALIDATION_RULES.length + 3 // +3 为引擎内额外验证
  const confidence = totalRules > 0 ? passCount / totalRules : 0

  return {
    validated: contradictions.length === 0,
    confidence: clamp(confidence, 0, 1),
    reasons,
    contradictions,
    supportingModules,
    traceChain,
  }
}

/**
 * 评估单条交叉验证规则
 * @param rule - 验证规则
 * @param inputs - 模块输入
 * @returns 验证结果（是否通过、原因、置信度）
 */
function evaluateCrossValidationRule(
  rule: CrossValidationRule,
  inputs: ModuleInputs,
): { passed: boolean; reason: string; confidence: number } {
  const modules = rule.modules

  // 根据规则涉及的模块进行模糊检查
  if (modules.includes('pattern') && modules.includes('tenGods')) {
    // 格局与十神一致性
    if (inputs.pattern.primaryPattern) {
      const patternShenShi = extractShenShiFromPatternName(inputs.pattern.primaryPattern.name)
      if (patternShenShi) {
        const hasMatch = inputs.tenGods.details.some(
          d => d.name === patternShenShi && d.power >= 30,
        )
        return {
          passed: hasMatch,
          reason: hasMatch
            ? `格局「${inputs.pattern.primaryPattern.name}」对应十神「${patternShenShi}」力量 >= 30，格局有十神支持`
            : `格局「${inputs.pattern.primaryPattern.name}」对应十神「${patternShenShi}」力量不足`,
          confidence: hasMatch ? 0.8 : 0.5,
        }
      }
    }
    return { passed: true, reason: '无主格局或无法提取十神映射，跳过此规则', confidence: 0.3 }
  }

  if (modules.includes('pattern') && modules.includes('xiYong')) {
    // 格局与喜用神一致性 — 模糊检查喜用神五行是否覆盖格局相关五行
    const patternName = inputs.pattern.primaryPattern?.name
    if (patternName) {
      const xiYongElements = [
        ...inputs.xiYong.xiYongGroup.xiShen.map(s => s.element),
        ...inputs.xiYong.xiYongGroup.yongShen.map(s => s.element),
      ]
      // 简单模糊匹配：格局名中包含的关键字与喜用神有关联
      const patternKeywords = extractPatternKeywords(patternName)
      const hasOverlap = patternKeywords.some(kw =>
        xiYongElements.some(e => kw.includes(e)),
      )
      return {
        passed: hasOverlap,
        reason: hasOverlap
          ? `格局「${patternName}」与喜用神五行存在关联`
          : `格局「${patternName}」与喜用神五行关联不明显`,
        confidence: hasOverlap ? 0.7 : 0.4,
      }
    }
    return { passed: true, reason: '无主格局，跳过此规则', confidence: 0.3 }
  }

  if (modules.includes('tenGods') && modules.includes('xiYong')) {
    // 十神与喜用神一致性 — 检查喜用神对应的十神是否有力量
    const xiShenCategories = ['印星', '比劫']
    const keXieCategories = ['食伤', '财星', '官杀']
    const isStrong = inputs.xiYong.strength.strengthLevel === '偏强' || inputs.xiYong.strength.strengthLevel === '极强'

    if (isStrong) {
      // 身强喜克泄耗，检查食伤/财星/官杀是否有力量
      const hasPower = inputs.tenGods.details.some(
        d => keXieCategories.includes(d.category) && d.power >= 30,
      )
      return {
        passed: hasPower,
        reason: hasPower
          ? '身强命局中克泄耗十神（食伤/财星/官杀）有一定力量，与喜用神方向一致'
          : '身强命局中克泄耗十神力量偏弱，与喜用神方向不完全一致',
        confidence: hasPower ? 0.75 : 0.45,
      }
    } else {
      // 身弱喜生扶，检查印星/比劫是否有力量
      const hasPower = inputs.tenGods.details.some(
        d => xiShenCategories.includes(d.category) && d.power >= 30,
      )
      return {
        passed: hasPower,
        reason: hasPower
          ? '身弱命局中生扶十神（印星/比劫）有一定力量，与喜用神方向一致'
          : '身弱命局中生扶十神力量偏弱，与喜用神方向不完全一致',
        confidence: hasPower ? 0.75 : 0.45,
      }
    }
  }

  if (modules.includes('fortune')) {
    // 大运相关验证 — 检查大运中喜用神到位比例
    const total = inputs.fortune.daYunSteps.length
    if (total > 0) {
      let matchCount = 0
      for (const step of inputs.fortune.daYunSteps) {
        if (step.xiYongRelations.influence === 'positive') {
          matchCount++
        }
      }
      const ratio = matchCount / total
      return {
        passed: ratio >= 0.4,
        reason: `大运 ${total} 步中 ${matchCount} 步与喜用神方向一致（${Math.round(ratio * 100)}%）`,
        confidence: clamp(ratio, 0, 1),
      }
    }
    return { passed: true, reason: '无大运数据，跳过此规则', confidence: 0.3 }
  }

  // 默认：模块组合不匹配已知逻辑时返回通过（保守策略）
  return { passed: true, reason: `规则「${rule.name}」涉及的模块组合 ${modules.join('+')} 未实现具体验证逻辑，默认通过`, confidence: 0.3 }
}

/**
 * 从格局名称中提取对应的十神类型
 * @param patternName - 格局名称（如"正官格""偏财格"等）
 * @returns 对应的十神名称，无法匹配则返回 null
 */
function extractShenShiFromPatternName(patternName: string): ShenShi | null {
  const mapping: Record<string, ShenShi> = {
    '正官格': '正官',
    '七杀格': '偏官',
    '正印格': '正印',
    '偏印格': '偏印',
    '正财格': '正财',
    '偏财格': '偏财',
    '食神格': '食神',
    '伤官格': '伤官',
    '建禄格': '比肩',
    '月刃格': '劫财',
  }
  return mapping[patternName] ?? (null as never)
}

/**
 * 从格局名称中提取关键字，用于与五行做模糊匹配
 * @param patternName - 格局名称
 * @returns 关键字数组
 */
function extractPatternKeywords(patternName: string): string[] {
  // 从格局名称中提取五行相关关键字
  const fiveElementKeywords: string[] = ['金', '木', '水', '火', '土']
  return fiveElementKeywords.filter(kw => patternName.includes(kw))
}

// ═══════════════════════════════════════════════════════════
// 5. 命局总评
// ═══════════════════════════════════════════════════════════

/**
 * 生成命局总评 — 基于多模块数据综合评定
 *
 * 综合考虑：
 * - 日主五行与阴阳
 * - 格局高低（primaryPattern）
 * - 日主强弱与喜用神
 * - 神煞吉凶
 * - 大运走势
 *
 * @param inputs - Module 1~6 聚合输入
 * @param cv - 交叉验证结果
 * @returns 总评结果
 */
function generateOverallAssessment(
  inputs: ModuleInputs,
  cv: CrossValidationResult,
): OverallAssessment {
  const { pillars, pattern, xiYong, tenGods, shenSha, fortune } = inputs
  const dayMaster = pillars.dayMaster
  const dayMasterElement = pillars.dayMasterElement

  // ── 综合摘要 ──
  const strengthDesc = xiYong.strength.strengthLevel
  const patternName = pattern.primaryPattern?.name ?? '未成格'
  const patternGrade = pattern.primaryPattern?.grade ?? '不成'
  const primaryXi = xiYong.primaryXiShen ?? (null as never)
  const primaryYong = xiYong.primaryYongShen ?? (null as never)
  const primaryJi = xiYong.primaryJiShen ?? (null as never)

  const summary = [
    `日主${dayMaster}（${dayMasterElement}），${strengthDesc}之命。`,
    pattern.primaryPattern
      ? `格局取「${patternName}」，${patternGrade}之格，成格度 ${pattern.primaryPattern.formScore}。`
      : '命局未成正规格局，宜以时柱或调候取用。',
    primaryXi && primaryYong
      ? `喜神${primaryXi}、用神${primaryYong}，忌神${primaryJi ?? '未明'}。`
      : '喜用神尚未明确判定。',
    `大运${fortune.qiYunInfo.startAge}岁起运，`,
    fortune.daYunSteps.length > 0
      ? `首步大运「${fortune.daYunSteps[0].ganZhi.gan}${fortune.daYunSteps[0].ganZhi.zhi}」（${fortune.daYunSteps[0].startAge}-${fortune.daYunSteps[0].endAge}岁）。`
      : '大运数据暂缺。',
    `十神主力：${tenGods.primaryShenShi.join('、')}。`,
    shenSha.hits.length > 0
      ? `命中神煞：${shenSha.hits.slice(0, 5).map(h => h.name).join('、')}。`
      : '命中少有神煞入命。',
    `交叉验证置信度 ${Math.round(cv.confidence * 100)}%，${cv.validated ? '各模块数据一致性良好' : '存在部分矛盾需关注'}。`,
  ].join('')

  // ── 格局评价 ──
  let patternEvaluation: string
  if (pattern.primaryPattern) {
    const pp = pattern.primaryPattern
    patternEvaluation = [
      `格局「${pp.name}」属${pp.patternClass}，`,
      pp.grade === '大成' ? '格局纯粹有力，成格度高，为命局之大贵所在。' :
      pp.grade === '中成' ? '格局基本成立，有一定贵气，但尚有提升空间。' :
      pp.grade === '小成' ? '格局成而不高，需大运扶助方能显现。' :
      pp.grade === '不成' ? '格局条件不足，难成大格，宜另寻出路。' :
      '格局存在严重破格因素，需特别注意化解。',
      pp.advantages.length > 0 ? `优势：${pp.advantages.slice(0, 3).join('；')}。` : '',
      pp.risks.length > 0 ? `风险：${pp.risks.slice(0, 3).join('；')}。` : '',
    ].filter(Boolean).join('')
  } else {
    patternEvaluation = '命局未成正规格局。可从特殊格局或调候用神角度分析，或以十神配置与喜用神为主要判断依据。'
  }

  // ── 人生定位 ──
  const careerScore = fortune.scores.careerScore
  const wealthScore = fortune.scores.wealthScore
  let lifePositioning: string
  if (careerScore >= 70 && wealthScore >= 70) {
    lifePositioning = '命主具备事业与财富双重优势，适合在商界或高层管理领域发展，具备领导才能与经济头脑。'
  } else if (careerScore >= 70) {
    lifePositioning = '命主事业运势较旺，适合走专业技术或仕途路线，通过积累专业能力和社会地位获取成就。'
  } else if (wealthScore >= 70) {
    lifePositioning = '命主财运较旺，适合从事商业、金融或贸易类工作，善于理财聚财。'
  } else {
    lifePositioning = '命局平稳，宜脚踏实地，通过勤奋努力逐步积累。中年后运势渐开，适宜稳中求进。'
  }

  // ── 收集优势与弱点 ──
  const strengths: string[] = []
  const weaknesses: string[] = []

  // 从格局收集
  if (pattern.primaryPattern) {
    strengths.push(...pattern.primaryPattern.advantages.slice(0, 3))
    weaknesses.push(...pattern.primaryPattern.risks.slice(0, 3))
  }

  // 从十神收集
  for (const detail of tenGods.details) {
    if (detail.power >= 60 && detail.nature === '吉') {
      strengths.push(`${detail.name}有力（${detail.power}），主${detail.category}方面优势`)
    }
    if (detail.power >= 60 && detail.nature === '凶') {
      weaknesses.push(`${detail.name}过旺（${detail.power}），主${detail.category}方面隐患`)
    }
  }

  // 从神煞收集
  for (const hit of shenSha.auspicious.slice(0, 3)) {
    strengths.push(`命带${hit.name}（${hit.category}），${hit.modernExplain}`)
  }
  for (const hit of shenSha.inauspicious.slice(0, 3)) {
    weaknesses.push(`命带${hit.name}（${hit.category}），${hit.modernExplain}`)
  }

  // 从大运收集
  const positiveDaYun = fortune.daYunSteps.filter(s => s.xiYongRelations.influence === 'positive')
  if (positiveDaYun.length >= fortune.daYunSteps.length * 0.5) {
    strengths.push(`大运中${Math.round(positiveDaYun.length / fortune.daYunSteps.length * 100)}%为顺势运，后天运势有助`)
  } else {
    weaknesses.push(`大运中顺势运比例偏低（${Math.round(positiveDaYun.length / fortune.daYunSteps.length * 100)}%），需注意运势波动`)
  }

  // ── 机会与风险 ──
  const opportunities: string[] = strengths.slice(0, 5)
  const risks: string[] = weaknesses.slice(0, 5)

  // ── 发展方向 ──
  const developmentDirection = buildDevelopmentDirection(inputs)

  // ── 参与模块 ──
  const sourceModules = ['pillars', 'shenSha', 'tenGods', 'pattern', 'xiYong', 'fortune']

  return {
    summary,
    patternEvaluation,
    lifePositioning,
    strengths,
    weaknesses,
    opportunities,
    risks,
    developmentDirection,
    sourceModules,
    confidence: cv.confidence,
  }
}

/**
 * 构建发展方向描述
 * @param inputs - 模块输入
 * @returns 发展方向文本
 */
function buildDevelopmentDirection(inputs: ModuleInputs): string {
  const parts: string[] = []
  const { xiYong, tenGods, fortune } = inputs

  // 基于喜用神五行给出方向
  const xiElements = xiYong.xiYongGroup.xiShen.map(s => s.element)
  const yongElements = xiYong.xiYongGroup.yongShen.map(s => s.element)
  const allFavorable = [...xiElements, ...yongElements]

  if (allFavorable.includes('木')) {
    parts.push('适宜从事与生长、教育、文化相关的行业')
  }
  if (allFavorable.includes('火')) {
    parts.push('适宜从事与能量、科技、传媒相关的行业')
  }
  if (allFavorable.includes('土')) {
    parts.push('适宜从事与房地产、农业、金融相关的行业')
  }
  if (allFavorable.includes('金')) {
    parts.push('适宜从事与法律、金融、机械相关的行业')
  }
  if (allFavorable.includes('水')) {
    parts.push('适宜从事与物流、贸易、智慧相关的行业')
  }

  // 基于十神主力补充
  if (tenGods.primaryShenShi.includes('正官') || tenGods.primaryShenShi.includes('偏官')) {
    parts.push('具有管理才能，可向管理层发展')
  }
  if (tenGods.primaryShenShi.includes('食神') || tenGods.primaryShenShi.includes('伤官')) {
    parts.push('具有创造力，可向技术研发或创意领域发展')
  }
  if (tenGods.primaryShenShi.includes('正财') || tenGods.primaryShenShi.includes('偏财')) {
    parts.push('对财务敏感，可向商业或投资领域发展')
  }
  if (tenGods.primaryShenShi.includes('正印') || tenGods.primaryShenShi.includes('偏印')) {
    parts.push('学习能力突出，可向学术或知识密集型行业发展')
  }

  if (parts.length === 0) {
    parts.push('宜根据个人兴趣与后天环境综合选择发展方向')
  }

  return parts.join('；') + '。'
}

// ═══════════════════════════════════════════════════════════
// 6. 五维评分
// ═══════════════════════════════════════════════════════════

/**
 * 计算人生五维评分（事业/财富/婚姻/健康/学业，0-100）
 *
 * 计算方式（基于 Module 1-6 已有数据，不重复计算）：
 * - 事业：基于 pattern.primaryPattern + tenGods.primaryShenShi + fortune.scores.careerScore
 * - 财富：基于 tenGods.primaryShenShi 是否包含财星 + xiYong.xiYongGroup + fortune.scores.wealthScore
 * - 婚姻：基于 shenSha 中桃花/红鸾/天喜 + pattern + xiYong + fortune.scores.relationshipScore
 * - 健康：基于 xiYong.strength.level + shenSha 中凶神 + fortune.scores.healthScore
 * - 学业：基于 shenSha 中文昌/学堂 + tenGods 中印星 + fortune.scores.studyScore
 *
 * @param inputs - Module 1~6 聚合输入
 * @returns 五维评分结果
 */
function calculateFiveDimensionScores(inputs: ModuleInputs): FiveDimensionScores {
  const career = calculateCareerDimension(inputs)
  const wealth = calculateWealthDimension(inputs)
  const marriage = calculateMarriageDimension(inputs)
  const health = calculateHealthDimension(inputs)
  const study = calculateStudyDimension(inputs)

  // 加权总分（事业0.25, 财富0.2, 婚姻0.2, 健康0.2, 学业0.15）
  const overall = Math.round(
    career.score * 0.25 +
    wealth.score * 0.2 +
    marriage.score * 0.2 +
    health.score * 0.2 +
    study.score * 0.15,
  )

  return { career, wealth, marriage, health, study, overall }
}

/**
 * 计算事业维度评分
 * 基于 pattern.primaryPattern + tenGods.primaryShenShi + fortune.scores.careerScore
 */
function calculateCareerDimension(inputs: ModuleInputs): FiveDimensionItem {
  const reasons: string[] = []
  const influencedModules: string[] = ['pattern', 'tenGods', 'fortune']
  let score = 0

  // 格局基础分（0-30）
  if (inputs.pattern.primaryPattern) {
    const pp = inputs.pattern.primaryPattern
    const patternBonus = pp.formScore * 0.3
    score += patternBonus
    reasons.push(`格局「${pp.name}」成格度 ${pp.formScore}，贡献 ${Math.round(patternBonus)} 分`)
  } else {
    score += 10
    reasons.push('无主格局，事业基础分偏低')
  }

  // 十神主力贡献（0-30）
  const primaryShenShi = inputs.tenGods.primaryShenShi
  const hasGuan = primaryShenShi.includes('正官') || primaryShenShi.includes('偏官')
  const hasYin = primaryShenShi.includes('正印') || primaryShenShi.includes('偏印')
  const hasShi = primaryShenShi.includes('食神') || primaryShenShi.includes('伤官')
  if (hasGuan) {
    score += 15
    reasons.push('十神主力中有官杀，主事业心强、有领导力')
  }
  if (hasYin) {
    score += 10
    reasons.push('十神主力中有印星，主贵人扶持、学识助力')
  }
  if (hasShi) {
    score += 5
    reasons.push('十神主力中有食伤，主才能出众、善于表达')
  }

  // 大运事业评分（0-40）
  const fortuneCareer = inputs.fortune.scores.careerScore
  score += fortuneCareer * 0.4
  reasons.push(`大运事业评分 ${fortuneCareer}，贡献 ${Math.round(fortuneCareer * 0.4)} 分`)

  score = clamp(Math.round(score), 0, 100)

  return {
    score,
    level: getDimensionLevel(score),
    influencedModules,
    weight: 0.25,
    reasons,
    confidence: clamp(score / 100, 0.3, 0.9),
  }
}

/**
 * 计算财富维度评分
 * 基于 tenGods.primaryShenShi 是否包含财星 + xiYong.xiYongGroup + fortune.scores.wealthScore
 */
function calculateWealthDimension(inputs: ModuleInputs): FiveDimensionItem {
  const reasons: string[] = []
  const influencedModules: string[] = ['tenGods', 'xiYong', 'fortune']
  let score = 0

  // 十神财星贡献（0-35）
  const primaryShenShi = inputs.tenGods.primaryShenShi
  const hasWealth = primaryShenShi.includes('正财') || primaryShenShi.includes('偏财')
  if (hasWealth) {
    score += 25
    reasons.push('十神主力中有财星，财运基础好')
    // 偏财比正财更旺财
    if (primaryShenShi.includes('偏财')) {
      score += 10
      reasons.push('偏财透干，主偏财运旺（投资、商业）')
    }
  } else {
    score += 5
    reasons.push('十神主力中无明显财星，财运基础偏弱')
  }

  // 喜用神是否生财（0-25）
  const xiYongGroup = inputs.xiYong.xiYongGroup
  const allXiYong = [...xiYongGroup.xiShen, ...xiYongGroup.yongShen]
  // 食伤生财：喜用神中有食伤
  const hasShiShang = allXiYong.some(item =>
    item.involvedShenShi.some(s => s === '食神' || s === '伤官'),
  )
  if (hasShiShang) {
    score += 15
    reasons.push('喜用神配合食伤生财，财运有源')
  }
  // 身强能担财
  if (inputs.xiYong.strength.strengthLevel === '偏强' || inputs.xiYong.strength.strengthLevel === '极强') {
    score += 10
    reasons.push('身强能担财，求财有力')
  }

  // 大运财富评分（0-40）
  const fortuneWealth = inputs.fortune.scores.wealthScore
  score += fortuneWealth * 0.4
  reasons.push(`大运财运评分 ${fortuneWealth}，贡献 ${Math.round(fortuneWealth * 0.4)} 分`)

  score = clamp(Math.round(score), 0, 100)

  return {
    score,
    level: getDimensionLevel(score),
    influencedModules,
    weight: 0.2,
    reasons,
    confidence: clamp(score / 100, 0.3, 0.9),
  }
}

/**
 * 计算婚姻维度评分
 * 基于 shenSha 中桃花/红鸾/天喜 + pattern + xiYong + fortune.scores.relationshipScore
 */
function calculateMarriageDimension(inputs: ModuleInputs): FiveDimensionItem {
  const reasons: string[] = []
  const influencedModules: string[] = ['shenSha', 'pattern', 'xiYong', 'fortune']
  let score = 0

  // 神煞贡献（0-30）
  const marriageShenSha = ['桃花', '红鸾', '天喜', '天喜贵人']
  const hitMarriageShenSha = inputs.shenSha.hits.filter(
    h => marriageShenSha.includes(h.name),
  )
  if (hitMarriageShenSha.length > 0) {
    score += 20
    reasons.push(`命带${hitMarriageShenSha.map(h => h.name).join('、')}，婚姻缘分较旺`)
  } else {
    score += 5
    reasons.push('命中无明显桃花/红鸾/天喜等婚姻神煞')
  }

  // 格局贡献（0-20）
  if (inputs.pattern.primaryPattern) {
    const pp = inputs.pattern.primaryPattern
    // 正官格和正财格利于稳定婚姻
    if (pp.name === '正官格' || pp.name === '正财格') {
      score += 15
      reasons.push(`格局「${pp.name}」主婚姻稳定`)
    } else {
      score += 8
      reasons.push(`格局「${pp.name}」对婚姻有一定影响`)
    }
  }

  // 喜用神配合（0-20）
  if (inputs.xiYong.strength.strengthLevel === '中和') {
    score += 15
    reasons.push('日主中和，性情平和，利于婚姻感情')
  } else {
    score += 5
    reasons.push(`日主${inputs.xiYong.strength.strengthLevel}，性格偏向明显，婚姻需多经营`)
  }

  // 大运关系评分（0-30）
  const fortuneRelation = inputs.fortune.scores.relationshipScore
  score += fortuneRelation * 0.3
  reasons.push(`大运人际关系评分 ${fortuneRelation}，贡献 ${Math.round(fortuneRelation * 0.3)} 分`)

  score = clamp(Math.round(score), 0, 100)

  return {
    score,
    level: getDimensionLevel(score),
    influencedModules,
    weight: 0.2,
    reasons,
    confidence: clamp(score / 100, 0.3, 0.85),
  }
}

/**
 * 计算健康维度评分
 * 基于 xiYong.strength.level + shenSha 中凶神 + fortune.scores.healthScore
 */
function calculateHealthDimension(inputs: ModuleInputs): FiveDimensionItem {
  const reasons: string[] = []
  const influencedModules: string[] = ['xiYong', 'shenSha', 'fortune']
  let score = 0

  // 身强身弱基础分（0-35）
  const strengthLevel = inputs.xiYong.strength.strengthLevel
  if (strengthLevel === '中和') {
    score += 30
    reasons.push('日主中和，五行相对平衡，健康状况基础良好')
  } else if (strengthLevel === '偏强') {
    score += 22
    reasons.push('日主偏强，体质较好，但需注意五行偏亢')
  } else if (strengthLevel === '偏弱') {
    score += 15
    reasons.push('日主偏弱，体质偏弱，需注意养生')
  } else if (strengthLevel === '极强') {
    score += 18
    reasons.push('日主极强，五行过旺可能有亢盛之疾')
  } else {
    // 极弱
    score += 8
    reasons.push('日主极弱，先天体质偏差，需特别注意健康管理')
  }

  // 凶神影响（0-25）
  const inauspiciousCount = inputs.shenSha.inauspicious.length
  if (inauspiciousCount === 0) {
    score += 20
    reasons.push('命中无明显凶煞入命，健康运势平稳')
  } else if (inauspiciousCount <= 2) {
    score += 12
    reasons.push(`命带 ${inauspiciousCount} 个凶煞，对健康有一定影响`)
  } else {
    score += 5
    reasons.push(`命带 ${inauspiciousCount} 个凶煞，健康方面需多加注意`)
  }

  // 大运健康评分（0-40）
  const fortuneHealth = inputs.fortune.scores.healthScore
  score += fortuneHealth * 0.4
  reasons.push(`大运健康评分 ${fortuneHealth}，贡献 ${Math.round(fortuneHealth * 0.4)} 分`)

  score = clamp(Math.round(score), 0, 100)

  return {
    score,
    level: getDimensionLevel(score),
    influencedModules,
    weight: 0.2,
    reasons,
    confidence: clamp(score / 100, 0.3, 0.85),
  }
}

/**
 * 计算学业维度评分
 * 基于 shenSha 中文昌/学堂 + tenGods 中印星 + fortune.scores.studyScore
 */
function calculateStudyDimension(inputs: ModuleInputs): FiveDimensionItem {
  const reasons: string[] = []
  const influencedModules: string[] = ['shenSha', 'tenGods', 'fortune']
  let score = 0

  // 神煞文昌/学堂贡献（0-35）
  const studyShenSha = ['文昌', '学堂', '华盖', '词馆']
  const hitStudyShenSha = inputs.shenSha.hits.filter(
    h => studyShenSha.includes(h.name),
  )
  if (hitStudyShenSha.length > 0) {
    score += 25
    reasons.push(`命带${hitStudyShenSha.map(h => h.name).join('、')}，利于学业考试`)
  } else {
    score += 8
    reasons.push('命中无明显文昌/学堂等学业神煞')
  }

  // 十神印星贡献（0-25）
  const primaryShenShi = inputs.tenGods.primaryShenShi
  const hasYin = primaryShenShi.includes('正印') || primaryShenShi.includes('偏印')
  if (hasYin) {
    score += 20
    reasons.push('十神主力中有印星，主聪明好学、记忆力强')
  } else {
    // 检查次要十神中是否有印星
    const hasSecondaryYin = inputs.tenGods.secondaryShenShi.some(
      s => s === '正印' || s === '偏印',
    )
    if (hasSecondaryYin) {
      score += 12
      reasons.push('次要十神中有印星，学习方面有一定天赋')
    } else {
      score += 5
      reasons.push('十神中印星不显，学业需后天努力')
    }
  }

  // 大运学业评分（0-40）
  const fortuneStudy = inputs.fortune.scores.studyScore
  score += fortuneStudy * 0.4
  reasons.push(`大运学业评分 ${fortuneStudy}，贡献 ${Math.round(fortuneStudy * 0.4)} 分`)

  score = clamp(Math.round(score), 0, 100)

  return {
    score,
    level: getDimensionLevel(score),
    influencedModules,
    weight: 0.15,
    reasons,
    confidence: clamp(score / 100, 0.3, 0.85),
  }
}

// ═══════════════════════════════════════════════════════════
// 7. 时间轴
// ═══════════════════════════════════════════════════════════

/**
 * 生成人生时间轴 — 将大运步骤分配到四个生命阶段
 *
 * 阶段划分：
 * - 儿童：起运前
 * - 青年：起运后前2步
 * - 中年：中间几步
 * - 晚年：最后几步
 *
 * @param inputs - Module 1~6 聚合输入
 * @returns 时间轴阶段列表
 */
function generateTimeline(inputs: ModuleInputs): TimelineStage[] {
  const stages: TimelineStage[] = []
  const { qiYunInfo, daYunSteps } = inputs.fortune
  const startAge = qiYunInfo.startAge
  const totalSteps = daYunSteps.length

  // ── 儿童：起运前 ──
  stages.push({
    stage: '儿童',
    ageRange: `0-${startAge - 1}岁`,
    summary: `起运前 ${startAge} 年，以原局四柱为主。${inputs.xiYong.strength.strengthLevel}之命，先天禀赋已定。`,
    fortuneInfluence: '尚未行大运，运势以原局为主，受家庭环境影响较大。',
    xiYongInfluence: `日主${inputs.xiYong.strength.strengthLevel}，喜${inputs.xiYong.primaryXiShen ?? '未定'}、用${inputs.xiYong.primaryYongShen ?? '未定'}。`,
    keyEvents: ['出生', '幼年成长', '启蒙教育'],
    confidence: 0.6,
  })

  // ── 青年：起运后前2步 ──
  const youthSteps = daYunSteps.slice(0, 2)
  if (youthSteps.length > 0) {
    const youthAges = youthSteps.map(s => `${s.startAge}-${s.endAge}岁`).join('、')
    const youthSummary = youthSteps.map(s =>
      `${s.ganZhi.gan}${s.ganZhi.zhi}运（${s.startAge}-${s.endAge}岁），${s.xiYongRelations.description}`,
    ).join('；')
    const youthKeyEvents: string[] = []
    for (const step of youthSteps) {
      if (step.fortuneScore >= 70) youthKeyEvents.push(`${step.startAge}-${step.endAge}岁运势较旺`)
      if (step.xiYongRelations.isYongShen) youthKeyEvents.push(`${step.startAge}-${step.endAge}岁用神到位`)
    }
    if (youthKeyEvents.length === 0) youthKeyEvents.push('求学、就业初期')

    stages.push({
      stage: '青年',
      ageRange: `${youthSteps[0].startAge}-${youthSteps[youthSteps.length - 1].endAge}岁`,
      summary: youthSummary || '大运初期，奠定人生基础。',
      fortuneInfluence: youthSteps.map(s =>
        `${s.ganZhi.gan}${s.ganZhi.zhi}运评分${s.fortuneScore}，${s.xiYongRelations.influence === 'positive' ? '运势顺势' : '运势逆势'}`,
      ).join('；'),
      xiYongInfluence: youthSteps.filter(s => s.xiYongRelations.isXiShen || s.xiYongRelations.isYongShen).length > 0
        ? '青年阶段有喜用神大运助力。'
        : '青年阶段大运喜用神助力不明显。',
      keyEvents: youthKeyEvents,
      confidence: 0.7,
    })
  }

  // ── 中年：中间几步 ──
  const middleStart = 2
  const middleEnd = Math.max(middleStart + 1, totalSteps - 2)
  const middleSteps = daYunSteps.slice(middleStart, middleEnd)
  if (middleSteps.length > 0) {
    const middleAges = `${middleSteps[0].startAge}-${middleSteps[middleSteps.length - 1].endAge}岁`
    const middleSummary = middleSteps.map(s =>
      `${s.ganZhi.gan}${s.ganZhi.zhi}运（${s.startAge}-${s.endAge}岁），${s.xiYongRelations.description}`,
    ).join('；')
    const positiveMiddle = middleSteps.filter(s => s.xiYongRelations.influence === 'positive').length

    stages.push({
      stage: '中年',
      ageRange: middleAges,
      summary: middleSummary || '中年阶段，事业与家庭的黄金期。',
      fortuneInfluence: `${middleSteps.length}步大运中 ${positiveMiddle} 步顺势，${middleSteps.length - positiveMiddle} 步逆势。`,
      xiYongInfluence: positiveMiddle > middleSteps.length / 2
        ? '中年大运总体喜用神到位，运势较佳。'
        : '中年大运喜用神到位比例一般，需审慎把握机遇。',
      keyEvents: ['事业高峰', '家庭责任', '财富积累'],
      confidence: 0.7,
    })
  }

  // ── 晚年：最后几步 ──
  const lateStart = Math.max(totalSteps - 2, middleEnd)
  const lateSteps = daYunSteps.slice(lateStart)
  if (lateSteps.length > 0) {
    const lateAges = `${lateSteps[0].startAge}-${lateSteps[lateSteps.length - 1].endAge}岁`
    const lateSummary = lateSteps.map(s =>
      `${s.ganZhi.gan}${s.ganZhi.zhi}运（${s.startAge}-${s.endAge}岁），${s.xiYongRelations.description}`,
    ).join('；')
    const positiveLate = lateSteps.filter(s => s.xiYongRelations.influence === 'positive').length

    stages.push({
      stage: '晚年',
      ageRange: lateAges,
      summary: lateSummary || '晚年阶段，享受人生积累。',
      fortuneInfluence: `${lateSteps.length}步大运中 ${positiveLate} 步顺势，${lateSteps.length - positiveLate} 步逆势。`,
      xiYongInfluence: positiveLate > lateSteps.length / 2
        ? '晚年大运总体顺势，安享晚年。'
        : '晚年大运逆势较多，需注意健康与养生。',
      keyEvents: ['退休', '健康维护', '家庭传承'],
      confidence: 0.65,
    })
  }

  return stages
}

// ═══════════════════════════════════════════════════════════
// 8. 风险识别
// ═══════════════════════════════════════════════════════════

/**
 * 识别命理风险 — 遍历 RISK_RULES 基于各模块数据检测风险
 *
 * 风险类型：
 * - 事业风险：十神中偏官/伤官过旺
 * - 投资风险：喜用神中忌神力量
 * - 婚姻风险：日支逢冲 + 桃花逢冲
 * - 健康风险：身极弱 + 七杀攻身
 * - 官非风险：大运中官非事件概率
 * - 财务风险：大运中破财事件概率
 *
 * 注意：使用 '偏官' 不是 '七杀'
 *
 * @param inputs - Module 1~6 聚合输入
 * @returns 风险项列表
 */
function detectRisks(inputs: ModuleInputs): RiskItem[] {
  const risks: RiskItem[] = []

  // ── 事业风险：十神中偏官/伤官过旺 ──
  const shangGuanDetail = inputs.tenGods.details.find(d => d.name === '伤官')
  const pianGuanDetail = inputs.tenGods.details.find(d => d.name === '偏官')
  if (shangGuanDetail && shangGuanDetail.power >= 60) {
    risks.push({
      type: '事业风险',
      level: getRiskLevel(shangGuanDetail.power / 100),
      reason: `伤官力量 ${shangGuanDetail.power}，过旺则克官星，事业易有波折变动`,
      sourceModules: ['tenGods'],
      suggestion: '宜从事自由职业、创意行业或技术路线，避免与领导产生冲突',
      avoidance: '忌傲慢自大、口无遮拦，宜谦逊低调',
      confidence: shangGuanDetail.power / 100,
    })
  }
  if (pianGuanDetail && pianGuanDetail.power >= 70) {
    risks.push({
      type: '事业风险',
      level: getRiskLevel(pianGuanDetail.power / 100),
      reason: `偏官力量 ${pianGuanDetail.power}，过旺则压力过大，事业环境紧张`,
      sourceModules: ['tenGods'],
      suggestion: '宜选择高压但有挑战性的工作，化压力为动力',
      avoidance: '忌铤而走险、冲动决策，遇事冷静分析',
      confidence: pianGuanDetail.power / 100,
    })
  }

  // ── 投资风险：忌神力量强 ──
  const jiShenTotalPower = inputs.xiYong.xiYongGroup.jiShen.reduce(
    (sum, item) => sum + item.score, 0,
  )
  if (jiShenTotalPower > 0) {
    const jiShenAvgScore = jiShenTotalPower / inputs.xiYong.xiYongGroup.jiShen.length
    if (jiShenAvgScore >= 60) {
      risks.push({
        type: '投资风险',
        level: getRiskLevel(jiShenAvgScore / 100),
        reason: `忌神平均评分 ${Math.round(jiShenAvgScore)}，力量较强，投资时忌神五行领域风险偏高`,
        sourceModules: ['xiYong'],
        suggestion: '避免在忌神五行相关的行业投资，选择喜用神五行领域',
        avoidance: '忌盲目跟风、大额杠杆投资',
        confidence: jiShenAvgScore / 100,
      })
    }
  }

  // ── 婚姻风险：日支逢冲 + 桃花逢冲 ──
  const dayZhi = inputs.pillars.sixLines.day.zhi
  const hasDayZhiChong = inputs.fortune.daYunSteps.some(
    step => step.originalRelations.chong.some(
      chong => chong.includes(dayZhi),
    ),
  )
  const hasTaoHua = inputs.shenSha.hits.some(h => h.name === '桃花')
  if (hasDayZhiChong && hasTaoHua) {
    risks.push({
      type: '婚姻风险',
      level: '中',
      reason: `日支${dayZhi}逢大运冲克，且命带桃花，婚姻感情方面易有波动`,
      sourceModules: ['shenSha', 'fortune'],
      suggestion: '婚姻中宜多沟通、互相包容，遇矛盾冷静处理',
      avoidance: '忌在外遇桃花时冲动行事，感情中保持忠诚',
      confidence: 0.6,
    })
  } else if (hasDayZhiChong) {
    risks.push({
      type: '婚姻风险',
      level: '低',
      reason: `日支${dayZhi}逢大运冲克，配偶宫受冲击，婚姻需经营`,
      sourceModules: ['fortune'],
      suggestion: '注意婚姻中的沟通，在冲克年份特别关注配偶关系',
      avoidance: '忌在冲克年份做重大婚姻决定',
      confidence: 0.5,
    })
  }

  // ── 健康风险：身极弱 + 偏官攻身 ──
  if (inputs.xiYong.strength.strengthLevel === '极弱' && pianGuanDetail && pianGuanDetail.power >= 50) {
    risks.push({
      type: '健康风险',
      level: '高',
      reason: `日主极弱且偏官力量 ${pianGuanDetail.power}，偏官攻身，健康方面需格外注意`,
      sourceModules: ['xiYong', 'tenGods'],
      suggestion: '定期体检，注意日常养生，避免过度劳累',
      avoidance: '忌熬夜、暴饮暴食、剧烈运动，宜规律作息',
      confidence: 0.75,
    })
  }

  // ── 官非风险：大运中官非事件概率 ──
  const legalEvents = inputs.fortune.events.filter(e => e.type === '官非' && e.probability >= 50)
  if (legalEvents.length > 0) {
    for (const evt of legalEvents) {
      risks.push({
        type: '官非风险',
        level: evt.severity === 'high' ? '高' : evt.severity === 'medium' ? '中' : '低',
        reason: `${evt.year}年官非事件概率 ${evt.probability}%，${evt.reasons.join('；')}`,
        sourceModules: ['fortune'],
        suggestion: '遵纪守法，遇纠纷时寻求法律途径解决',
        avoidance: '忌参与灰色地带活动，签订合同前仔细审阅',
        confidence: evt.confidence / 100,
      })
    }
  }

  // ── 财务风险：大运中破财事件概率 ──
  const wealthEvents = inputs.fortune.events.filter(e => e.type === '破财' && e.probability >= 50)
  if (wealthEvents.length > 0) {
    for (const evt of wealthEvents) {
      risks.push({
        type: '财务风险',
        level: evt.severity === 'high' ? '高' : evt.severity === 'medium' ? '中' : '低',
        reason: `${evt.year}年破财事件概率 ${evt.probability}%，${evt.reasons.join('；')}`,
        sourceModules: ['fortune'],
        suggestion: '注意财务规划，建立应急储备金',
        avoidance: '忌高风险投资和借贷，大额消费前审慎评估',
        confidence: evt.confidence / 100,
      })
    }
  }

  // ── 补充 RISK_RULES 中通用规则 ──
  for (const rule of RISK_RULES) {
    const matched = evaluateRiskRule(rule, inputs)
    if (matched) {
      risks.push(matched)
    }
  }

  return risks
}

/**
 * 评估单条风险规则
 * @param rule - 风险识别规则
 * @param inputs - 模块输入
 * @returns 匹配则返回 RiskItem，否则返回 null
 */
function evaluateRiskRule(
  rule: MasterRiskRule,
  inputs: ModuleInputs,
): RiskItem | null {
  // 检查十神中是否有偏官过旺 → 事业风险
  if (rule.type === '事业风险' && rule.keywords.includes('偏官')) {
    const pianGuan = inputs.tenGods.details.find(d => d.name === '偏官')
    if (pianGuan && pianGuan.power >= 60) {
      return {
        type: '事业风险',
        level: getRiskLevel(pianGuan.power / 100),
        reason: rule.classicalReference,
        sourceModules: rule.detectionModules,
        suggestion: rule.suggestion,
        avoidance: rule.avoidance,
        confidence: pianGuan.power / 100,
      }
    }
  }

  // 检查伤官过旺 → 事业风险
  if (rule.type === '事业风险' && rule.keywords.includes('伤官')) {
    const shangGuan = inputs.tenGods.details.find(d => d.name === '伤官')
    if (shangGuan && shangGuan.power >= 60) {
      return {
        type: '事业风险',
        level: getRiskLevel(shangGuan.power / 100),
        reason: rule.classicalReference,
        sourceModules: rule.detectionModules,
        suggestion: rule.suggestion,
        avoidance: rule.avoidance,
        confidence: shangGuan.power / 100,
      }
    }
  }

  return null
}

// ═══════════════════════════════════════════════════════════
// 9. 机会识别
// ═══════════════════════════════════════════════════════════

/**
 * 识别命理机会 — 遍历 OPPORTUNITY_RULES 基于大运流年喜用神到位识别机会窗口
 *
 * 机会类型：事业机会、创业机会、投资机会、婚恋机会、学习机会、迁移机会
 *
 * @param inputs - Module 1~6 聚合输入
 * @returns 机会项列表
 */
function detectOpportunities(inputs: ModuleInputs): OpportunityItem[] {
  const opportunities: OpportunityItem[] = []
  const daYunSteps = inputs.fortune.daYunSteps

  if (isEmptyArray(daYunSteps)) {
    return opportunities
  }

  // 遍历大运步骤，查找喜用神到位的运程
  for (const step of daYunSteps) {
    if (step.xiYongRelations.isXiShen || step.xiYongRelations.isYongShen) {
      // 根据十神和大运特征匹配机会类型
      const shenShi = step.shenShi
      const timing = `${step.startAge}-${step.endAge}岁（${step.ganZhi.gan}${step.ganZhi.zhi}运）`

      // 官杀到位 → 事业机会
      if (shenShi === '正官' || shenShi === '偏官') {
        opportunities.push({
          type: '事业机会',
          timing,
          reason: `${step.ganZhi.gan}${step.ganZhi.zhi}运${shenShi}到位且为喜用神，利于升迁、事业突破`,
          sourceModules: ['fortune', 'tenGods'],
          confidence: step.xiYongRelations.isYongShen ? 0.8 : 0.65,
        })
      }

      // 财星到位 → 投资机会
      if (shenShi === '正财' || shenShi === '偏财') {
        opportunities.push({
          type: shenShi === '偏财' ? '创业机会' : '投资机会',
          timing,
          reason: `${step.ganZhi.gan}${step.ganZhi.zhi}运${shenShi}到位且为喜用神，利于${shenShi === '偏财' ? '创业、开拓新业务' : '理财、稳健投资'}`,
          sourceModules: ['fortune', 'tenGods'],
          confidence: step.xiYongRelations.isYongShen ? 0.75 : 0.6,
        })
      }

      // 印星到位 → 学习机会
      if (shenShi === '正印' || shenShi === '偏印') {
        opportunities.push({
          type: '学习机会',
          timing,
          reason: `${step.ganZhi.gan}${step.ganZhi.zhi}运${shenShi}到位且为喜用神，利于考试、进修、获取资质`,
          sourceModules: ['fortune', 'tenGods'],
          confidence: step.xiYongRelations.isYongShen ? 0.75 : 0.6,
        })
      }

      // 食伤到位 → 创业机会
      if (shenShi === '食神' || shenShi === '伤官') {
        opportunities.push({
          type: '创业机会',
          timing,
          reason: `${step.ganZhi.gan}${step.ganZhi.zhi}运${shenShi}到位且为喜用神，利于创意、创业、技术革新`,
          sourceModules: ['fortune', 'tenGods'],
          confidence: step.xiYongRelations.isYongShen ? 0.7 : 0.55,
        })
      }

      // 大运中冲克较多 → 迁移机会
      if (step.originalRelations.chong.length >= 2) {
        opportunities.push({
          type: '迁移机会',
          timing,
          reason: `${step.ganZhi.gan}${step.ganZhi.zhi}运冲克较多（${step.originalRelations.chong.join('、')}），主动走动可化解`,
          sourceModules: ['fortune'],
          confidence: 0.5,
        })
      }
    }
  }

  // 从大运事件中提取正面机遇
  for (const evt of inputs.fortune.events) {
    if (evt.opportunity && evt.probability >= 50) {
      // 避免重复（大运步骤已覆盖的类型）
      const existingTypes = new Set(opportunities.map(o => o.type))
      if (!existingTypes.has(evt.type as OpportunityItem['type'])) {
        opportunities.push({
          type: mapEventTypeToOpportunity(evt.type),
          timing: `${evt.year}年`,
          reason: `${evt.year}年有${evt.type}机遇（概率 ${evt.probability}%），${evt.reasons.join('；')}`,
          sourceModules: ['fortune'],
          confidence: evt.confidence / 100,
        })
      }
    }
  }

  return opportunities
}

/**
 * 将 FortuneEventType 映射为 OpportunityType
 * @param eventType - 大运事件类型
 * @returns 对应的机会类型
 */
function mapEventTypeToOpportunity(eventType: string): OpportunityItem['type'] {
  const mapping: Record<string, OpportunityItem['type']> = {
    '事业': '事业机会',
    '财运': '投资机会',
    '婚姻': '婚恋机会',
    '恋爱': '婚恋机会',
    '考试': '学习机会',
    '升迁': '事业机会',
    '创业': '创业机会',
    '投资': '投资机会',
    '搬迁': '迁移机会',
    '出国': '迁移机会',
  }
  return mapping[eventType] ?? '事业机会'
}

// ═══════════════════════════════════════════════════════════
// 10. 建议生成
// ═══════════════════════════════════════════════════════════

/**
 * 生成命理建议 — 遍历 RECOMMENDATION_RULES 基于喜用神五行生成建议
 *
 * 建议类别：职业建议、行业建议、城市建议、颜色建议、数字建议、
 *           方位建议、五行补救、风水建议、生活建议
 *
 * @param inputs - Module 1~6 聚合输入
 * @returns 建议项列表
 */
function generateRecommendations(inputs: ModuleInputs): RecommendationItem[] {
  const recommendations: RecommendationItem[] = []

  // 收集喜用神五行
  const xiYongElements: FiveElement[] = []
  for (const item of inputs.xiYong.xiYongGroup.xiShen) {
    if (!xiYongElements.includes(item.element)) {
      xiYongElements.push(item.element)
    }
  }
  for (const item of inputs.xiYong.xiYongGroup.yongShen) {
    if (!xiYongElements.includes(item.element)) {
      xiYongElements.push(item.element)
    }
  }

  // 收集忌神五行
  const jiShenElements: FiveElement[] = []
  for (const item of inputs.xiYong.xiYongGroup.jiShen) {
    if (!jiShenElements.includes(item.element)) {
      jiShenElements.push(item.element)
    }
  }

  // ── 职业建议 ──
  const careerSuggestion = buildCareerRecommendation(inputs, xiYongElements)
  recommendations.push(careerSuggestion)

  // ── 行业建议 ──
  const industrySuggestion = buildIndustryRecommendation(xiYongElements)
  recommendations.push(industrySuggestion)

  // ── 五行补救 ──
  const wuxingSuggestion = buildWuxingRecommendation(xiYongElements, jiShenElements)
  recommendations.push(wuxingSuggestion)

  // ── 颜色建议 ──
  const colorSuggestion = buildColorRecommendation(xiYongElements)
  recommendations.push(colorSuggestion)

  // ── 方位建议 ──
  const directionSuggestion = buildDirectionRecommendation(xiYongElements)
  recommendations.push(directionSuggestion)

  // ── 数字建议 ──
  const numberSuggestion = buildNumberRecommendation(xiYongElements)
  recommendations.push(numberSuggestion)

  // ── 生活建议 ──
  const lifeSuggestion = buildLifeRecommendation(inputs)
  recommendations.push(lifeSuggestion)

  // ── 风水建议 ──
  const fengshuiSuggestion = buildFengshuiRecommendation(xiYongElements, jiShenElements)
  recommendations.push(fengshuiSuggestion)

  return recommendations
}

/**
 * 构建职业建议
 */
function buildCareerRecommendation(
  inputs: ModuleInputs,
  xiYongElements: FiveElement[],
): RecommendationItem {
  const primaryShenShi = inputs.tenGods.primaryShenShi
  const careerHints: string[] = []

  if (primaryShenShi.includes('正官') || primaryShenShi.includes('偏官')) {
    careerHints.push('管理、行政、公务员、法律')
  }
  if (primaryShenShi.includes('正财') || primaryShenShi.includes('偏财')) {
    careerHints.push('金融、贸易、商业')
  }
  if (primaryShenShi.includes('食神') || primaryShenShi.includes('伤官')) {
    careerHints.push('技术研发、创意设计、教育培训')
  }
  if (primaryShenShi.includes('正印') || primaryShenShi.includes('偏印')) {
    careerHints.push('学术研究、出版、咨询')
  }
  if (primaryShenShi.includes('比肩') || primaryShenShi.includes('劫财')) {
    careerHints.push('自由职业、合伙经营、团队协作')
  }

  return {
    category: '职业建议',
    content: careerHints.length > 0
      ? `根据命局十神配置，适宜从事：${careerHints.join('、')}等领域的工作。`
      : '根据命局喜用神五行方向选择适合的职业领域。',
    relatedElements: xiYongElements,
    relatedModules: ['tenGods', 'xiYong'],
    reasoning: `十神主力为${primaryShenShi.join('、')}，喜用神五行${xiYongElements.join('、')}，职业方向应与十神和喜用神五行相配合。`,
  }
}

/**
 * 构建行业建议
 */
function buildIndustryRecommendation(xiYongElements: FiveElement[]): RecommendationItem {
  const industryMap: Record<FiveElement, string[]> = {
    '木': ['教育', '出版', '文化', '农业', '环保', '医药'],
    '火': ['科技', '互联网', '传媒', '能源', '餐饮', '电子'],
    '土': ['房地产', '建筑', '矿业', '农业', '金融', '仓储'],
    '金': ['金融', '法律', '机械', '汽车', '珠宝', '外科医疗'],
    '水': ['物流', '贸易', '旅游', '咨询', '水产', '传媒创意'],
  }

  const industries: string[] = []
  for (const element of xiYongElements) {
    const mapped = industryMap[element]
    if (mapped) {
      industries.push(...mapped)
    }
  }

  return {
    category: '行业建议',
    content: industries.length > 0
      ? `喜用神五行相关行业：${[...new Set(industries)].join('、')}。`
      : '选择与喜用神五行属性匹配的行业发展。',
    relatedElements: xiYongElements,
    relatedModules: ['xiYong'],
    reasoning: `喜用神五行${xiYongElements.join('、')}对应的行业领域更利于命主发展。`,
  }
}

/**
 * 构建五行补救建议
 */
function buildWuxingRecommendation(
  xiYongElements: FiveElement[],
  jiShenElements: FiveElement[],
): RecommendationItem {
  const parts: string[] = []

  if (xiYongElements.length > 0) {
    parts.push(`多接触喜用五行「${xiYongElements.join('、')}」相关的事物`)
  }
  if (jiShenElements.length > 0) {
    parts.push(`减少接触忌神五行「${jiShenElements.join('、')}」相关的事物`)
  }

  return {
    category: '五行补救',
    content: parts.length > 0 ? parts.join('；') + '。' : '保持五行平衡，适度调理。',
    relatedElements: [...xiYongElements, ...jiShenElements],
    relatedModules: ['xiYong'],
    reasoning: `喜用神${xiYongElements.join('、')}需加强，忌神${jiShenElements.join('、')}需规避。`,
  }
}

/**
 * 构建颜色建议
 */
function buildColorRecommendation(xiYongElements: FiveElement[]): RecommendationItem {
  const colorMap: Record<FiveElement, string[]> = {
    '木': ['绿色', '青色'],
    '火': ['红色', '紫色', '橙色'],
    '土': ['黄色', '棕色', '米色'],
    '金': ['白色', '银色', '金色'],
    '水': ['黑色', '蓝色', '灰色'],
  }

  const colors: string[] = []
  for (const element of xiYongElements) {
    const mapped = colorMap[element]
    if (mapped) {
      colors.push(...mapped)
    }
  }

  return {
    category: '颜色建议',
    content: colors.length > 0
      ? `日常穿着和家居配色宜多用：${[...new Set(colors)].join('、')}。`
      : '根据喜用神五行选择对应的吉祥颜色。',
    relatedElements: xiYongElements,
    relatedModules: ['xiYong'],
    reasoning: `喜用神五行${xiYongElements.join('、')}对应颜色为日常幸运色。`,
  }
}

/**
 * 构建方位建议
 */
function buildDirectionRecommendation(xiYongElements: FiveElement[]): RecommendationItem {
  const directionMap: Record<FiveElement, string[]> = {
    '木': ['东方', '东南'],
    '火': ['南方'],
    '土': ['中央', '西南', '东北'],
    '金': ['西方', '西北'],
    '水': ['北方'],
  }

  const directions: string[] = []
  for (const element of xiYongElements) {
    const mapped = directionMap[element]
    if (mapped) {
      directions.push(...mapped)
    }
  }

  return {
    category: '方位建议',
    content: directions.length > 0
      ? `工作、居住的吉利方位：${[...new Set(directions)].join('、')}。`
      : '根据喜用神五行选择有利的方位。',
    relatedElements: xiYongElements,
    relatedModules: ['xiYong'],
    reasoning: `喜用神五行${xiYongElements.join('、')}对应方位为命主吉利方位。`,
  }
}

/**
 * 构建数字建议
 */
function buildNumberRecommendation(xiYongElements: FiveElement[]): RecommendationItem {
  const numberMap: Record<FiveElement, string[]> = {
    '木': ['1', '2'],
    '火': ['3', '4'],
    '土': ['5', '6'],
    '金': ['7', '8'],
    '水': ['9', '0'],
  }

  const numbers: string[] = []
  for (const element of xiYongElements) {
    const mapped = numberMap[element]
    if (mapped) {
      numbers.push(...mapped)
    }
  }

  return {
    category: '数字建议',
    content: numbers.length > 0
      ? `幸运数字：${[...new Set(numbers)].join('、')}。手机号、楼层、车牌等可参考。`
      : '根据喜用神五行选择幸运数字。',
    relatedElements: xiYongElements,
    relatedModules: ['xiYong'],
    reasoning: `喜用神五行${xiYongElements.join('、')}对应河图洛书数字为幸运数。`,
  }
}

/**
 * 构建生活建议
 */
function buildLifeRecommendation(inputs: ModuleInputs): RecommendationItem {
  const parts: string[] = []

  // 基于身强身弱
  const strength = inputs.xiYong.strength.strengthLevel
  if (strength === '极弱' || strength === '偏弱') {
    parts.push('身体偏弱，宜早睡早起，适度运动，避免过度劳累')
  } else if (strength === '极强' || strength === '偏强') {
    parts.push('精力充沛，可适当增加运动量，但忌逞强过劳')
  } else {
    parts.push('身体中和，保持规律作息即可')
  }

  // 基于大运走势
  const positiveCount = inputs.fortune.daYunSteps.filter(
    s => s.xiYongRelations.influence === 'positive',
  ).length
  if (positiveCount >= inputs.fortune.daYunSteps.length * 0.6) {
    parts.push('大运总体顺势，可积极把握机遇')
  } else {
    parts.push('大运中逆势较多，宜稳中求进，不宜冒进')
  }

  return {
    category: '生活建议',
    content: parts.join('；') + '。',
    relatedElements: [
      inputs.xiYong.primaryXiShen ?? (null as never),
      inputs.xiYong.primaryYongShen ?? (null as never),
    ].filter((e): e is FiveElement => e !== null),
    relatedModules: ['xiYong', 'fortune'],
    reasoning: `日主${strength}，大运顺势比例${Math.round(positiveCount / inputs.fortune.daYunSteps.length * 100)}%，综合给出生活建议。`,
  }
}

/**
 * 构建风水建议
 */
function buildFengshuiRecommendation(
  xiYongElements: FiveElement[],
  jiShenElements: FiveElement[],
): RecommendationItem {
  const parts: string[] = []

  if (xiYongElements.length > 0) {
    parts.push(`居住环境宜增加${xiYongElements.join('、')}五行元素`)
  }
  if (jiShenElements.length > 0) {
    parts.push(`减少${jiShenElements.join('、')}五行元素在居住环境中的比重`)
  }

  return {
    category: '风水建议',
    content: parts.length > 0 ? parts.join('；') + '。' : '保持居住环境五行平衡。',
    relatedElements: [...xiYongElements, ...jiShenElements],
    relatedModules: ['xiYong'],
    reasoning: `风水调理以喜用神${xiYongElements.join('、')}为旺、忌神${jiShenElements.join('、')}为衰的原则进行。`,
  }
}

// ═══════════════════════════════════════════════════════════
// 11. AI 解释生成
// ═══════════════════════════════════════════════════════════

/**
 * 生成 AI 解释条目 — 从 MASTER_EXPLAIN_KB 中匹配当前命局特征
 *
 * 匹配逻辑：
 * 1. 收集当前命局的关键字（格局名、十神名、喜用神五行、神煞名等）
 * 2. 遍历知识库条目，检查其 keywords 是否与命局特征有交集
 * 3. 有交集的条目纳入解释列表
 *
 * @param inputs - Module 1~6 聚合输入
 * @returns AI 解释条目列表
 */
function generateMasterExplains(inputs: ModuleInputs): MasterExplainEntry[] {
  const explains: MasterExplainEntry[] = []

  // 收集当前命局特征关键词
  const featureKeywords: string[] = []

  // 格局关键词
  if (inputs.pattern.primaryPattern) {
    featureKeywords.push(inputs.pattern.primaryPattern.name)
    featureKeywords.push('格局')
    featureKeywords.push('成格')
  }

  // 十神关键词
  featureKeywords.push(...inputs.tenGods.primaryShenShi)
  featureKeywords.push('十神')

  // 喜用神关键词
  featureKeywords.push('喜用神')
  featureKeywords.push('用神')
  if (inputs.xiYong.primaryXiShen) featureKeywords.push(inputs.xiYong.primaryXiShen)
  if (inputs.xiYong.primaryYongShen) featureKeywords.push(inputs.xiYong.primaryYongShen)

  // 神煞关键词
  for (const hit of inputs.shenSha.hits.slice(0, 5)) {
    featureKeywords.push(hit.name)
  }

  // 日主关键词
  featureKeywords.push(inputs.pillars.dayMaster)
  featureKeywords.push(inputs.pillars.dayMasterElement)

  // 大运关键词
  featureKeywords.push('大运')
  featureKeywords.push('流年')

  // 遍历知识库匹配
  for (const kbEntry of MASTER_EXPLAIN_KB) {
    const matched = kbEntry.keywords.some(kw => featureKeywords.includes(kw))
    if (matched) {
      explains.push({
        topic: kbEntry.topic,
        classicalReference: kbEntry.classicalReference,
        modernInterpretation: kbEntry.modernInterpretation,
        professionalExplanation: kbEntry.professionalExplanation,
        plainExplanation: kbEntry.plainExplanation,
        risks: kbEntry.risks,
        suggestions: kbEntry.suggestions,
        keywords: kbEntry.keywords.filter(kw => featureKeywords.includes(kw)),
        sourceModules: kbEntry.sourceModules,
      })
    }
  }

  // 确保至少包含"命局总评"条目
  const hasGeneral = explains.some(e => e.topic === '命局总评')
  if (!hasGeneral) {
    const generalKB = MASTER_EXPLAIN_KB.find(kb => kb.topic === '命局总评')
    if (generalKB) {
      explains.unshift({
        topic: generalKB.topic,
        classicalReference: generalKB.classicalReference,
        modernInterpretation: generalKB.modernInterpretation,
        professionalExplanation: generalKB.professionalExplanation,
        plainExplanation: generalKB.plainExplanation,
        risks: generalKB.risks,
        suggestions: generalKB.suggestions,
        keywords: generalKB.keywords,
        sourceModules: generalKB.sourceModules,
      })
    }
  }

  return explains
}
