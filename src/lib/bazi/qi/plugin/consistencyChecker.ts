/**
 * ConsistencyChecker — P3.10 一致性校验引擎
 *
 * 纯 Plugin，不修改 Kernel。
 * 收集所有引擎的分析结果，定义一致性规则，自动检测矛盾。
 *
 * 规则类别：
 *   A. 旺衰一致性（5条）
 *   B. 用神一致性（5条）
 *   C. 格局一致性（4条）
 *   D. 调候/病药/通关一致性（3条）
 *   E. 概率/时间轴/事件一致性（3条）
 *   F. Explain 文本级一致性（2条）
 *
 * 依据：
 *   《滴天髓》："八字贵在中和，偏枯为病，太过不及，皆为偏枯。"
 *   《子平真诠》："用神不可与忌神同论，取舍之间，见功夫。"
 */

import type { FiveElement } from '../../types'
import { STEM_ELEMENT, GENERATE, OVERCOME } from '../../../core'

// ────────────────────────────────────────────
// 类型定义
// ────────────────────────────────────────────

/** 一致性检查严重等级 */
export type ConsistencySeverity = 'error' | 'warning' | 'info'

/** 一致性问题 */
export interface ConsistencyIssue {
  /** 问题ID */
  id: string
  /** 严重等级 */
  severity: ConsistencySeverity
  /** 问题类别 */
  category: string
  /** 问题描述 */
  description: string
  /** 涉及的模块 */
  modules: string[]
  /** 涉及的具体矛盾对 */
  contradictions: Contradiction[]
  /** 修复建议 */
  suggestion: string
  /** 相关字段路径 */
  fieldPaths: string[]
}

/** 矛盾对 */
export interface Contradiction {
  moduleA: string
  moduleB: string
  valueA: string
  valueB: string
  reason: string
}

/** 一致性检查结果 */
export interface ConsistencyCheckResult {
  /** 所有发现的问题 */
  issues: ConsistencyIssue[]
  /** 按严重等级分组 */
  bySeverity: {
    error: ConsistencyIssue[]
    warning: ConsistencyIssue[]
    info: ConsistencyIssue[]
  }
  /** 总评 */
  summary: string
  /** 一致性评分 0-100（100=完全一致） */
  consistencyScore: number
  /** 检查的模块数量 */
  modulesChecked: number
  /** 检查的规则数量 */
  rulesChecked: number
  /** 是否通过（无error级别问题） */
  passed: boolean
  /** 古籍引用 */
  classicalRef: string
}

/** 所有引擎结果的合并输入 */
export interface ConsistencyInput {
  /** 日主天干 */
  dayGan: string
  /** 日主五行 */
  dayElement?: string
  /** 旺衰分析结果 */
  strengthResult?: {
    strengthScore: number
    strengthLevelCN?: string
    wangShuai?: string
    deLing?: boolean
    deDi?: boolean
    deShi?: boolean
    shengFuPower?: number
    keXiePower?: number
  }
  /** 用神分析结果 */
  useGodResult?: {
    yongShen: string
    xiShen: string
    jiShen: string
    chouShen: string
    xianShen: string
    yongScore?: number
    scores?: Record<string, number>
  }
  /** 格局校验结果 */
  patternResult?: {
    totalScore: number
    starLevel: number
    rank: string
    geJuName?: string
    isZhenGe: boolean
    isPoGe: boolean
    poGeReasons?: string[]
    strengths?: string[]
    defects?: string[]
  }
  /** 调候分析结果 */
  climateResult?: {
    climateType: string
    climateScore: number
    needsAdjustment: boolean
  }
  /** 病药分析结果 */
  diseaseResult?: {
    hasDisease: boolean
    diseases?: Array<{ name: string; element?: string; severity: number }>
    medicines?: Array<{ name: string }>
  }
  /** 通关分析结果 */
  tongGuanResult?: {
    hasBattle: boolean
    hasTongGuan: boolean
    tongGuanElement?: string
    riskLevel: number
  }
  /** 神煞分析结果 */
  shenShaResult?: {
    jiShenCount?: number
    xiongShenCount?: number
    overallScore?: number
  }
  /** 概率分析结果 */
  probabilityResult?: {
    overallScore: number
    dimensions?: Array<{ name: string; score: number }>
  }
  /** 时间轴分析结果 */
  timelineResult?: {
    overallTrend?: string
    bestStage?: string
    worstStage?: string
  }
  /** 事件预测结果 */
  eventResult?: {
    events?: Array<{ type: string; probability: number }>
  }
  /** 决策分析结果 */
  decisionResult?: {
    decisions?: Array<{
      type: string
      recommendation: string
      overallScore: number
    }>
  }
  /** Explain V3 输出（文本级检查） */
  explainTexts?: Array<{
    layer: string
    title: string
    content: string
  }>
}

// ────────────────────────────────────────────
// 内部一致性规则类型
// ────────────────────────────────────────────

interface ConsistencyRule {
  id: string
  category: string
  description: string
  severity: ConsistencySeverity
  /** 所属大类标记，用于 quickCheck 筛选 */
  group: 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  check: (input: ConsistencyInput) => ConsistencyIssue | null
}

// ────────────────────────────────────────────
// 辅助常量与工具函数
// ────────────────────────────────────────────

/** 木火土金水 */
const ALL_ELEMENTS: string[] = ['木', '火', '土', '金', '水']

/** 五行泄耗方向（食伤+财星+官杀）：我生、我克、克我 */
const XIE_HAO_ELEMENTS: Record<string, string[]> = {
  '木': ['火', '土', '金'],
  '火': ['土', '金', '水'],
  '土': ['金', '水', '木'],
  '金': ['水', '木', '火'],
  '水': ['木', '火', '土'],
}

/** 五行生扶方向（印比）：我生我者、同我者 */
const SHENG_FU_ELEMENTS: Record<string, string[]> = {
  '木': ['水', '木'],
  '火': ['木', '火'],
  '土': ['火', '土'],
  '金': ['土', '金'],
  '水': ['金', '水'],
}

/** 古籍引用池 */
const CLASSICAL_REFS: string[] = [
  '《滴天髓》："八字贵在中和，偏枯为病，太过不及，皆为偏枯。"',
  '《子平真诠》："用神不可与忌神同论，取舍之间，见功夫。"',
  '《穷通宝鉴》："五行流通，生化有情，方为好命。"',
  '《三命通会》："命贵中和，太过与不及，皆非善也。"',
]

/** 随机选择器 —— 从数组中随机取一项 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 随机选择器 —— 从数组中随机取 N 项（不重复） */
function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/** 判断 a 是否与 b 相同或相生 */
function isShengOrSame(a: string, b: string): boolean {
  if (a === b) return true
  return (GENERATE as any)[b] === a || (GENERATE as any)[a] === b
}

/** 判断 elementB 是否能生 elementA（elementB 生 elementA） */
function generates(elementB: string, elementA: string): boolean {
  return (GENERATE as any)[elementB] === elementA
}

/** 推断日主五行 */
function resolveDayElement(input: ConsistencyInput): string {
  if (input.dayElement) return input.dayElement
  return (STEM_ELEMENT as any)[input.dayGan] || '木'
}

/** 旺级别关键词 */
const WANG_KEYWORDS = ['旺', '极旺', '过旺', '偏旺', '身旺']
/** 弱级别关键词 */
const RUO_KEYWORDS = ['弱', '极弱', '过弱', '偏弱', '身弱']
/** 中衡关键词 */
const ZHONG_KEYWORDS = ['中和', '平衡', '中平']

/** 检查字符串是否包含数组中任一关键词 */
function containsKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw))
}

/** 生成唯一问题ID */
function makeIssueId(prefix: string, index: number): string {
  return `${prefix}${String(index).padStart(3, '0')}`
}

/** 计数已检查模块 */
function countActiveModules(input: ConsistencyInput): number {
  let count = 0
  if (input.strengthResult) count++
  if (input.useGodResult) count++
  if (input.patternResult) count++
  if (input.climateResult) count++
  if (input.diseaseResult) count++
  if (input.tongGuanResult) count++
  if (input.shenShaResult) count++
  if (input.probabilityResult) count++
  if (input.timelineResult) count++
  if (input.eventResult) count++
  if (input.decisionResult) count++
  if (input.explainTexts && input.explainTexts.length > 0) count++
  return count
}

// ────────────────────────────────────────────
// 规则实现
// ────────────────────────────────────────────

/** A 类：旺衰一致性 */
function buildRulesGroupA(): ConsistencyRule[] {
  return [
    // A1: 旺衰方向一致性
    {
      id: 'A001',
      category: '旺衰一致性',
      description: '旺衰方向一致性：strengthScore>55 应为旺类，<45 应为弱类',
      severity: 'error',
      group: 'A',
      check(input) {
        const s = input.strengthResult
        if (!s) return null
        if (s.strengthScore == null || !s.strengthLevelCN) return null

        let contradiction = false
        let valueA = `strengthScore=${s.strengthScore}`
        let valueB = `strengthLevelCN="${s.strengthLevelCN}"`
        let reason = ''

        if (s.strengthScore > 55 && !containsKeyword(s.strengthLevelCN, WANG_KEYWORDS)) {
          contradiction = true
          reason = `强度分数 ${s.strengthScore} 大于55，应为旺类级别，但标记为"${s.strengthLevelCN}"`
        }
        if (s.strengthScore < 45 && !containsKeyword(s.strengthLevelCN, RUO_KEYWORDS) && !containsKeyword(s.strengthLevelCN, ZHONG_KEYWORDS)) {
          contradiction = true
          reason = `强度分数 ${s.strengthScore} 小于45，应为弱类级别，但标记为"${s.strengthLevelCN}"`
        }
        if (s.strengthScore >= 45 && s.strengthScore <= 55) {
          // 中和区间，不报错
          return null
        }

        if (!contradiction) return null
        return {
          id: 'A001',
          severity: 'error',
          category: '旺衰一致性',
          description: `旺衰方向矛盾：${reason}`,
          modules: ['strengthEngine'],
          contradictions: [{
            moduleA: 'strengthEngine.score',
            moduleB: 'strengthEngine.levelCN',
            valueA,
            valueB,
            reason,
          }],
          suggestion: '请检查旺衰评分算法，确保分数与中文等级描述方向一致',
          fieldPaths: ['strengthResult.strengthScore', 'strengthResult.strengthLevelCN'],
        }
      },
    },

    // A2: 旺衰 vs 得令得地
    {
      id: 'A002',
      category: '旺衰一致性',
      description: '旺衰 vs 得令得地：有得令/得地/得势时，strengthScore 不应低于35',
      severity: 'warning',
      group: 'A',
      check(input) {
        const s = input.strengthResult
        if (!s) return null
        if (s.strengthScore == null) return null

        const hasAny = s.deLing === true || s.deDi === true || s.deShi === true
        if (!hasAny) return null

        if (s.strengthScore < 35) {
          const labels: string[] = []
          if (s.deLing) labels.push('得令')
          if (s.deDi) labels.push('得地')
          if (s.deShi) labels.push('得势')

          return {
            id: 'A002',
            severity: 'warning',
            category: '旺衰一致性',
            description: `日主${labels.join('、')}但强度分数仅 ${s.strengthScore}，低于35`,
            modules: ['strengthEngine'],
            contradictions: [{
              moduleA: 'strengthEngine.deLing/deDi/deShi',
              moduleB: 'strengthEngine.strengthScore',
              valueA: `${labels.join('、')}=true`,
              valueB: `strengthScore=${s.strengthScore}`,
              reason: `${labels.join('、')}通常意味着日主有较强的根基支撑，强度分数过低存在矛盾`,
            }],
            suggestion: '重新评估得令得地得势的权重，或调整强度评分算法',
            fieldPaths: ['strengthResult.deLing', 'strengthResult.deDi', 'strengthResult.deShi', 'strengthResult.strengthScore'],
          }
        }
        return null
      },
    },

    // A3: 旺衰 vs 生扶克泄
    {
      id: 'A003',
      category: '旺衰一致性',
      description: '旺衰 vs 生扶克泄：shengFuPower > keXiePower 时 strengthScore 应 >50',
      severity: 'warning',
      group: 'A',
      check(input) {
        const s = input.strengthResult
        if (!s) return null
        if (s.shengFuPower == null || s.keXiePower == null || s.strengthScore == null) return null

        if (s.shengFuPower > s.keXiePower && s.strengthScore <= 50) {
          return {
            id: 'A003',
            severity: 'warning',
            category: '旺衰一致性',
            description: `生扶力(${s.shengFuPower})大于克泄力(${s.keXiePower})，但强度分数仅${s.strengthScore}，不超过50`,
            modules: ['strengthEngine'],
            contradictions: [{
              moduleA: 'strengthEngine.shengFuPower',
              moduleB: 'strengthEngine.strengthScore',
              valueA: `shengFuPower=${s.shengFuPower}, keXiePower=${s.keXiePower}`,
              valueB: `strengthScore=${s.strengthScore}`,
              reason: '生扶力量占优时，日主强度分数应当偏高（>50）',
            }],
            suggestion: '检查生扶克泄力量的计算方式，确保与强度分数的映射关系合理',
            fieldPaths: ['strengthResult.shengFuPower', 'strengthResult.keXiePower', 'strengthResult.strengthScore'],
          }
        }
        return null
      },
    },

    // A4: 旺衰 vs 用神方向
    {
      id: 'A004',
      category: '旺衰一致性',
      description: '旺衰 vs 用神方向：身旺时用神应为泄耗方向，身弱时用神应为生扶方向',
      severity: 'error',
      group: 'A',
      check(input) {
        const s = input.strengthResult
        const u = input.useGodResult
        if (!s || !u) return null
        if (s.strengthScore == null) return null

        const dayEl = resolveDayElement(input)
        const yong = u.yongShen

        if (s.strengthScore > 60) {
          // 身旺：用神应在泄耗方向
          const xieHao = XIE_HAO_ELEMENTS[dayEl] || []
          if (!xieHao.includes(yong)) {
            return {
              id: 'A004',
              severity: 'error',
              category: '旺衰一致性',
              description: `身旺（${s.strengthScore}）用神"${yong}"不在泄耗方向（应为 ${xieHao.join('、')} 之一）`,
              modules: ['strengthEngine', 'useGodEngine'],
              contradictions: [{
                moduleA: 'strengthEngine',
                moduleB: 'useGodEngine',
                valueA: `strengthScore=${s.strengthScore}（身旺）`,
                valueB: `yongShen="${yong}"`,
                reason: '身旺之命宜泄耗（食伤/财星），用神方向不符',
              }],
              suggestion: '身旺格局应选取泄耗日主五行的元素为用神',
              fieldPaths: ['strengthResult.strengthScore', 'useGodResult.yongShen'],
            }
          }
        } else if (s.strengthScore < 40) {
          // 身弱：用神应在生扶方向
          const shengFu = SHENG_FU_ELEMENTS[dayEl] || []
          if (!shengFu.includes(yong)) {
            return {
              id: 'A004',
              severity: 'error',
              category: '旺衰一致性',
              description: `身弱（${s.strengthScore}）用神"${yong}"不在生扶方向（应为 ${shengFu.join('、')} 之一）`,
              modules: ['strengthEngine', 'useGodEngine'],
              contradictions: [{
                moduleA: 'strengthEngine',
                moduleB: 'useGodEngine',
                valueA: `strengthScore=${s.strengthScore}（身弱）`,
                valueB: `yongShen="${yong}"`,
                reason: '身弱之命宜生扶（印星/比劫），用神方向不符',
              }],
              suggestion: '身弱格局应选取生扶日主五行的元素为用神',
              fieldPaths: ['strengthResult.strengthScore', 'useGodResult.yongShen'],
            }
          }
        }
        return null
      },
    },

    // A5: 旺衰 vs 格局评级
    {
      id: 'A005',
      category: '旺衰一致性',
      description: '旺衰 vs 格局评级：身极弱（<30）时格局星级不应>=4',
      severity: 'warning',
      group: 'A',
      check(input) {
        const s = input.strengthResult
        const p = input.patternResult
        if (!s || !p) return null
        if (s.strengthScore == null || p.starLevel == null) return null

        if (s.strengthScore < 30 && p.starLevel >= 4) {
          return {
            id: 'A005',
            severity: 'warning',
            category: '旺衰一致性',
            description: `日主极弱（${s.strengthScore}），但格局星级高达${p.starLevel}级（${p.rank || ''}）`,
            modules: ['strengthEngine', 'patternEngine'],
            contradictions: [{
              moduleA: 'strengthEngine',
              moduleB: 'patternEngine',
              valueA: `strengthScore=${s.strengthScore}`,
              valueB: `starLevel=${p.starLevel}, rank="${p.rank}"`,
              reason: '日主极度衰弱通常难以支撑高等级格局',
            }],
            suggestion: '重新评估格局评级，或考虑日主从格/从弱的特殊情况',
            fieldPaths: ['strengthResult.strengthScore', 'patternResult.starLevel', 'patternResult.rank'],
          }
        }
        return null
      },
    },
  ]
}

/** B 类：用神一致性 */
function buildRulesGroupB(): ConsistencyRule[] {
  return [
    // B1: 用神 vs 忌神不重叠
    {
      id: 'B001',
      category: '用神一致性',
      description: '用神 vs 忌神不重叠：yongShen 不应与 jiShen 相同',
      severity: 'error',
      group: 'B',
      check(input) {
        const u = input.useGodResult
        if (!u) return null

        if (u.yongShen === u.jiShen) {
          return {
            id: 'B001',
            severity: 'error',
            category: '用神一致性',
            description: `用神"${u.yongShen}"与忌神"${u.jiShen}"完全相同，存在严重逻辑矛盾`,
            modules: ['useGodEngine'],
            contradictions: [{
              moduleA: 'useGodEngine.yongShen',
              moduleB: 'useGodEngine.jiShen',
              valueA: `yongShen="${u.yongShen}"`,
              valueB: `jiShen="${u.jiShen}"`,
              reason: '用神与忌神不可为同一五行，此为基本矛盾',
            }],
            suggestion: '重新审视用神与忌神的推导逻辑，确保二者互斥',
            fieldPaths: ['useGodResult.yongShen', 'useGodResult.jiShen'],
          }
        }
        return null
      },
    },

    // B2: 用神 vs 喜神互补
    {
      id: 'B002',
      category: '用神一致性',
      description: '用神 vs 喜神互补：xiShen 应与 yongShen 相生或同气',
      severity: 'warning',
      group: 'B',
      check(input) {
        const u = input.useGodResult
        if (!u) return null

        const yong = u.yongShen
        const xi = u.xiShen
        // 喜神可以与用神相同（同气），或用神生喜神（相生链），或喜神生用神
        if (yong === xi) return null
        if (generates(yong, xi) || generates(xi, yong)) return null

        return {
          id: 'B002',
          severity: 'warning',
          category: '用神一致性',
          description: `喜神"${xi}"与用神"${yong}"既不同气也不相生，互补性不足`,
          modules: ['useGodEngine'],
          contradictions: [{
            moduleA: 'useGodEngine.yongShen',
            moduleB: 'useGodEngine.xiShen',
            valueA: `yongShen="${yong}"`,
            valueB: `xiShen="${xi}"`,
            reason: '喜神应与用神同气或相生，形成有利的五行配合',
          }],
          suggestion: '喜神宜选用与用神同气或被用神所生的五行',
          fieldPaths: ['useGodResult.yongShen', 'useGodResult.xiShen'],
        }
      },
    },

    // B3: 用神 vs 五行评分
    {
      id: 'B003',
      category: '用神一致性',
      description: '用神 vs 五行评分：scores 中 yongShen 的分值应 >= jiShen 的分值',
      severity: 'warning',
      group: 'B',
      check(input) {
        const u = input.useGodResult
        if (!u || !u.scores) return null

        const yongScore = u.scores[u.yongShen]
        const jiScore = u.scores[u.jiShen]
        if (yongScore == null || jiScore == null) return null

        if (yongScore < jiScore) {
          return {
            id: 'B003',
            severity: 'warning',
            category: '用神一致性',
            description: `用神"${u.yongShen}"评分(${yongScore})低于忌神"${u.jiShen}"评分(${jiScore})`,
            modules: ['useGodEngine'],
            contradictions: [{
              moduleA: 'useGodEngine.yongShen',
              moduleB: 'useGodEngine.jiShen',
              valueA: `yongShen评分=${yongScore}`,
              valueB: `jiShen评分=${jiScore}`,
              reason: '用神的综合评分不应低于忌神，否则选择逻辑存疑',
            }],
            suggestion: '检查五行评分的维度权重，确保用神在评分模型中得分最高',
            fieldPaths: ['useGodResult.scores'],
          }
        }
        return null
      },
    },

    // B4: 用神 vs 格局需求
    {
      id: 'B004',
      category: '用神一致性',
      description: '用神 vs 格局需求：格局类型对应特定用神方向',
      severity: 'info',
      group: 'B',
      check(input) {
        const u = input.useGodResult
        const p = input.patternResult
        if (!u || !p) return null
        if (!p.geJuName) return null

        const name = p.geJuName
        const yong = u.yongShen

        // 偏财格 → 用神宜含财星相关（我克者）或水（流通）
        if (name.includes('偏财') || name.includes('正财')) {
          const dayEl = resolveDayElement(input)
          const caiElement = (OVERCOME as any)[dayEl]
          if (caiElement && yong !== caiElement && yong !== (GENERATE as any)[caiElement]) {
            return {
              id: 'B004',
              severity: 'info',
              category: '用神一致性',
              description: `${name}用神宜取财星（${caiElement}）或财星所生之五行，当前用神为"${yong}"`,
              modules: ['useGodEngine', 'patternEngine'],
              contradictions: [{
                moduleA: 'patternEngine.geJuName',
                moduleB: 'useGodEngine.yongShen',
                valueA: `格局="${name}"`,
                valueB: `yongShen="${yong}"`,
                reason: `${name}通常宜以财星或其流通五行为用神`,
              }],
              suggestion: `考虑将用神调整为 ${caiElement} 或与财星相生的五行`,
              fieldPaths: ['patternResult.geJuName', 'useGodResult.yongShen'],
            }
          }
        }

        // 正官格 → 用神宜含印星（生我者）
        if (name.includes('正官') || name.includes('七杀')) {
          const dayEl = resolveDayElement(input)
          const guanElement = (OVERCOME as any)[(GENERATE as any)[dayEl]]
          const yinElement = (GENERATE as any)[dayEl]
          // 官格通常喜印星护身
          if (yinElement && yong !== yinElement) {
            return {
              id: 'B004',
              severity: 'info',
              category: '用神一致性',
              description: `${name}用神宜取印星（${yinElement}）护卫，当前用神为"${yong}"`,
              modules: ['useGodEngine', 'patternEngine'],
              contradictions: [{
                moduleA: 'patternEngine.geJuName',
                moduleB: 'useGodEngine.yongShen',
                valueA: `格局="${name}"`,
                valueB: `yongShen="${yong}"`,
                reason: `${name}通常以印星为用神，化杀生身`,
              }],
              suggestion: `考虑将用神调整为 ${yinElement}`,
              fieldPaths: ['patternResult.geJuName', 'useGodResult.yongShen'],
            }
          }
        }

        return null
      },
    },

    // B5: 用神 vs 调候需求
    {
      id: 'B005',
      category: '用神一致性',
      description: '用神 vs 调候需求：寒命用神应含火，燥命用神应含水',
      severity: 'warning',
      group: 'B',
      check(input) {
        const u = input.useGodResult
        const c = input.climateResult
        if (!u || !c) return null

        if (c.climateType === '寒' && u.yongShen !== '火') {
          return {
            id: 'B005',
            severity: 'warning',
            category: '用神一致性',
            description: `命局偏寒（climateType=寒），用神宜取火，当前用神为"${u.yongShen}"`,
            modules: ['useGodEngine', 'climateEngine'],
            contradictions: [{
              moduleA: 'climateEngine.climateType',
              moduleB: 'useGodEngine.yongShen',
              valueA: 'climateType="寒"',
              valueB: `yongShen="${u.yongShen}"`,
              reason: '寒命急需火来调候暖局，用神不以火为主则调候不力',
            }],
            suggestion: '寒命调候优先，应考虑将火纳入用神体系',
            fieldPaths: ['climateResult.climateType', 'useGodResult.yongShen'],
          }
        }

        if (c.climateType === '燥' && u.yongShen !== '水') {
          return {
            id: 'B005',
            severity: 'warning',
            category: '用神一致性',
            description: `命局偏燥（climateType=燥），用神宜取水，当前用神为"${u.yongShen}"`,
            modules: ['useGodEngine', 'climateEngine'],
            contradictions: [{
              moduleA: 'climateEngine.climateType',
              moduleB: 'useGodEngine.yongShen',
              valueA: 'climateType="燥"',
              valueB: `yongShen="${u.yongShen}"`,
              reason: '燥命急需水来润局，用神不以水为主则调候不力',
            }],
            suggestion: '燥命调候优先，应考虑将水纳入用神体系',
            fieldPaths: ['climateResult.climateType', 'useGodResult.yongShen'],
          }
        }

        return null
      },
    },
  ]
}

/** C 类：格局一致性 */
function buildRulesGroupC(): ConsistencyRule[] {
  return [
    // C1: 格局评级 vs 总分
    {
      id: 'C001',
      category: '格局一致性',
      description: '格局评级 vs 总分：starLevel 与 totalScore 应对应',
      severity: 'error',
      group: 'C',
      check(input) {
        const p = input.patternResult
        if (!p) return null
        if (p.starLevel == null || p.totalScore == null) return null

        const level = p.starLevel
        const score = p.totalScore
        let expected: string | null = null

        if (level >= 5 && score < 90) expected = '5级应>=90'
        else if (level === 4 && score < 75) expected = '4级应>=75'
        else if (level === 3 && score < 60) expected = '3级应>=60'
        else if (level === 2 && score < 45) expected = '2级应>=45'
        else if (level === 1 && score >= 45) expected = '1级应<45'

        if (!expected) return null

        return {
          id: 'C001',
          severity: 'error',
          category: '格局一致性',
          description: `格局星级(${level}级)与总分(${score})不匹配：${expected}`,
          modules: ['patternEngine'],
          contradictions: [{
            moduleA: 'patternEngine.starLevel',
            moduleB: 'patternEngine.totalScore',
            valueA: `starLevel=${level}`,
            valueB: `totalScore=${score}`,
            reason: expected,
          }],
          suggestion: '调整星级或总分的计算逻辑，确保两者映射关系正确',
          fieldPaths: ['patternResult.starLevel', 'patternResult.totalScore'],
        }
      },
    },

    // C2: 真格 vs 破格互斥
    {
      id: 'C002',
      category: '格局一致性',
      description: '真格 vs 破格互斥：isZhenGe 和 isPoGe 不应同时为 true',
      severity: 'error',
      group: 'C',
      check(input) {
        const p = input.patternResult
        if (!p) return null

        if (p.isZhenGe && p.isPoGe) {
          return {
            id: 'C002',
            severity: 'error',
            category: '格局一致性',
            description: '格局同时标记为"真格"和"破格"，存在逻辑矛盾',
            modules: ['patternEngine'],
            contradictions: [{
              moduleA: 'patternEngine.isZhenGe',
              moduleB: 'patternEngine.isPoGe',
              valueA: 'isZhenGe=true',
              valueB: 'isPoGe=true',
              reason: '真格与破格为互斥状态，不可同时成立',
            }],
            suggestion: '重新检查格局判定逻辑，确定是成格还是破格',
            fieldPaths: ['patternResult.isZhenGe', 'patternResult.isPoGe'],
          }
        }
        return null
      },
    },

    // C3: 格局优势 vs 缺陷
    {
      id: 'C003',
      category: '格局一致性',
      description: '有缺陷时 isZhenGe 不应为 true',
      severity: 'warning',
      group: 'C',
      check(input) {
        const p = input.patternResult
        if (!p) return null

        if (p.isZhenGe && p.defects && p.defects.length > 0) {
          return {
            id: 'C003',
            severity: 'warning',
            category: '格局一致性',
            description: `格局标记为"真格"但存在${p.defects.length}个缺陷：${p.defects.slice(0, 3).join('、')}`,
            modules: ['patternEngine'],
            contradictions: [{
              moduleA: 'patternEngine.isZhenGe',
              moduleB: 'patternEngine.defects',
              valueA: 'isZhenGe=true',
              valueB: `defects=[${p.defects.slice(0, 3).join(', ')}]`,
              reason: '真格应当清纯无杂，存在缺陷说明格局有瑕疵',
            }],
            suggestion: '有缺陷的格局降级为"成格"而非"真格"，或清除不合理的缺陷标记',
            fieldPaths: ['patternResult.isZhenGe', 'patternResult.defects'],
          }
        }
        return null
      },
    },

    // C4: 格局 vs 星级描述
    {
      id: 'C004',
      category: '格局一致性',
      description: 'rank 应与 starLevel 匹配',
      severity: 'info',
      group: 'C',
      check(input) {
        const p = input.patternResult
        if (!p || !p.rank) return null
        if (p.starLevel == null) return null

        const rankMap: Record<number, string[]> = {
          5: ['极品'],
          4: ['上等'],
          3: ['中等'],
          2: ['普通'],
          1: ['破格'],
        }

        const expectedRanks = rankMap[p.starLevel]
        if (!expectedRanks || expectedRanks.some((r) => p.rank.includes(r))) return null

        return {
          id: 'C004',
          severity: 'info',
          category: '格局一致性',
          description: `星级(${p.starLevel})对应的等级应为"${expectedRanks.join('/')}"，但实际为"${p.rank}"`,
          modules: ['patternEngine'],
          contradictions: [{
            moduleA: 'patternEngine.starLevel',
            moduleB: 'patternEngine.rank',
            valueA: `starLevel=${p.starLevel}`,
            valueB: `rank="${p.rank}"`,
            reason: `${p.starLevel}级格局应对应"${expectedRanks.join('/')}"等级`,
          }],
          suggestion: '统一星级与等级名称的映射关系',
          fieldPaths: ['patternResult.starLevel', 'patternResult.rank'],
        }
      },
    },
  ]
}

/** D 类：调候/病药/通关一致性 */
function buildRulesGroupD(): ConsistencyRule[] {
  return [
    // D1: 调候 vs 用神
    {
      id: 'D001',
      category: '调候/病药/通关一致性',
      description: '调候 vs 用神：需要调候时，调候五行应与用神相容',
      severity: 'warning',
      group: 'D',
      check(input) {
        const c = input.climateResult
        const u = input.useGodResult
        if (!c || !u) return null

        if (!c.needsAdjustment) return null

        let climateElement: string | null = null
        if (c.climateType === '寒') climateElement = '火'
        else if (c.climateType === '燥') climateElement = '水'
        else if (c.climateType === '湿') climateElement = '火'
        else if (c.climateType === '暖' && c.climateScore > 80) climateElement = '水'
        else return null

        if (!climateElement) return null

        // 用神不应克调候五行
        const yong = u.yongShen
        if ((OVERCOME as any)[yong] === climateElement) {
          return {
            id: 'D001',
            severity: 'warning',
            category: '调候/病药/通关一致性',
            description: `调候需${climateElement}暖局/润局，但用神"${yong}"克${climateElement}，存在冲突`,
            modules: ['climateEngine', 'useGodEngine'],
            contradictions: [{
              moduleA: 'climateEngine',
              moduleB: 'useGodEngine',
              valueA: `climateType="${c.climateType}", 需${climateElement}`,
              valueB: `yongShen="${yong}"（克${climateElement}）`,
              reason: `用神克制调候所需的五行，可能导致调候失效`,
            }],
            suggestion: '在用神与调候需求冲突时，优先考虑调候，调整用神选择',
            fieldPaths: ['climateResult.climateType', 'climateResult.needsAdjustment', 'useGodResult.yongShen'],
          }
        }

        return null
      },
    },

    // D2: 病药配对
    {
      id: 'D002',
      category: '调候/病药/通关一致性',
      description: '病药配对：有病时应有药',
      severity: 'warning',
      group: 'D',
      check(input) {
        const d = input.diseaseResult
        if (!d) return null

        if (d.hasDisease && (!d.medicines || d.medicines.length === 0)) {
          return {
            id: 'D002',
            severity: 'warning',
            category: '调候/病药/通关一致性',
            description: '命局标记为"有病"但未给出对应"药"，病药不配',
            modules: ['diseaseEngine'],
            contradictions: [{
              moduleA: 'diseaseEngine.hasDisease',
              moduleB: 'diseaseEngine.medicines',
              valueA: 'hasDisease=true',
              valueB: 'medicines=[]（无药）',
              reason: '《滴天髓》"有病方为贵"之"病"需有对应"药"方可化解',
            }],
            suggestion: '有病必有药，请补充对应的治疗五行',
            fieldPaths: ['diseaseResult.hasDisease', 'diseaseResult.medicines'],
          }
        }
        return null
      },
    },

    // D3: 通关 vs 五行交战
    {
      id: 'D003',
      category: '调候/病药/通关一致性',
      description: '通关 vs 五行交战：有交战时应有通关五行',
      severity: 'warning',
      group: 'D',
      check(input) {
        const t = input.tongGuanResult
        if (!t) return null

        if (t.hasBattle && !t.hasTongGuan && !t.tongGuanElement) {
          return {
            id: 'D003',
            severity: 'warning',
            category: '调候/病药/通关一致性',
            description: `命局存在五行交战（riskLevel=${t.riskLevel}），但无通关五行化解`,
            modules: ['tongGuanEngine'],
            contradictions: [{
              moduleA: 'tongGuanEngine.hasBattle',
              moduleB: 'tongGuanEngine.hasTongGuan',
              valueA: 'hasBattle=true',
              valueB: 'hasTongGuan=false, tongGuanElement=无',
              reason: '五行交战而无通关，命局冲突难以调和',
            }],
            suggestion: '识别交战的两种五行，以其中间五行作为通关用神',
            fieldPaths: ['tongGuanResult.hasBattle', 'tongGuanResult.hasTongGuan', 'tongGuanResult.tongGuanElement'],
          }
        }
        return null
      },
    },
  ]
}

/** E 类：概率/时间轴/事件一致性 */
function buildRulesGroupE(): ConsistencyRule[] {
  return [
    // E1: 概率 vs 旺衰
    {
      id: 'E001',
      category: '概率/时间轴/事件一致性',
      description: '概率 vs 旺衰：身弱但事业概率过高时发出警告',
      severity: 'warning',
      group: 'E',
      check(input) {
        const s = input.strengthResult
        const p = input.probabilityResult
        if (!s || !p || !p.dimensions) return null
        if (s.strengthScore == null) return null

        // 身弱 + 事业相关维度概率>85
        if (s.strengthScore < 40) {
          const careerDim = p.dimensions.find(
            (d) => d.name.includes('事业') || d.name.includes('财运') || d.name.includes('官运'),
          )
          if (careerDim && careerDim.score > 85) {
            return {
              id: 'E001',
              severity: 'warning',
              category: '概率/时间轴/事件一致性',
              description: `身弱（${s.strengthScore}）但"${careerDim.name}"维度概率高达${careerDim.score}，可能过于乐观`,
              modules: ['strengthEngine', 'probabilityEngine'],
              contradictions: [{
                moduleA: 'strengthEngine',
                moduleB: 'probabilityEngine',
                valueA: `strengthScore=${s.strengthScore}（身弱）`,
                valueB: `${careerDim.name}概率=${careerDim.score}`,
                reason: '身弱之人承担事业压力的能力有限，高概率预测需要谨慎',
              }],
              suggestion: '适当调低事业相关维度的概率，或增加条件说明',
              fieldPaths: ['strengthResult.strengthScore', 'probabilityResult.dimensions'],
            }
          }
        }
        return null
      },
    },

    // E2: 时间轴 vs 概率
    {
      id: 'E002',
      category: '概率/时间轴/事件一致性',
      description: '时间轴 vs 概率：bestStage 对应阶段各维度分应偏高',
      severity: 'info',
      group: 'E',
      check(input) {
        const t = input.timelineResult
        const p = input.probabilityResult
        if (!t || !p || !p.dimensions || !t.bestStage) return null

        // 简化检查：如果概率引擎整体分数很低（<30），不应有明确的 bestStage
        if (p.overallScore < 30 && t.bestStage) {
          return {
            id: 'E002',
            severity: 'info',
            category: '概率/时间轴/事件一致性',
            description: `概率总分仅${p.overallScore}，但时间轴标记了最佳阶段"${t.bestStage}"`,
            modules: ['timelineEngine', 'probabilityEngine'],
            contradictions: [{
              moduleA: 'probabilityEngine.overallScore',
              moduleB: 'timelineEngine.bestStage',
              valueA: `overallScore=${p.overallScore}`,
              valueB: `bestStage="${t.bestStage}"`,
              reason: '概率引擎总体评价很低时，时间轴标记"最佳阶段"可能过于乐观',
            }],
            suggestion: '协调概率引擎与时间轴引擎的评价标准',
            fieldPaths: ['probabilityResult.overallScore', 'timelineResult.bestStage'],
          }
        }
        return null
      },
    },

    // E3: 事件 vs 概率
    {
      id: 'E003',
      category: '概率/时间轴/事件一致性',
      description: '高风险事件应对应概率引擎中对应维度低分',
      severity: 'info',
      group: 'E',
      check(input) {
        const e = input.eventResult
        const p = input.probabilityResult
        if (!e || !p || !p.dimensions || !e.events) return null

        const highRiskEvents = e.events.filter((ev) => ev.probability >= 60)
        if (highRiskEvents.length === 0) return null

        for (const ev of highRiskEvents) {
          // 尝试在概率维度中找到匹配项
          const matchedDim = p.dimensions.find(
            (d) => ev.type.includes(d.name) || d.name.includes(ev.type),
          )
          if (matchedDim && matchedDim.score > 75) {
            return {
              id: 'E003',
              severity: 'info',
              category: '概率/时间轴/事件一致性',
              description: `高风险事件"${ev.type}"概率${ev.probability}%，但概率引擎中"${matchedDim.name}"维度评分高达${matchedDim.score}`,
              modules: ['eventEngine', 'probabilityEngine'],
              contradictions: [{
                moduleA: 'eventEngine',
                moduleB: 'probabilityEngine',
                valueA: `${ev.type}概率=${ev.probability}%`,
                valueB: `${matchedDim.name}评分=${matchedDim.score}`,
                reason: '高风险事件通常对应概率引擎中较低维度分，两者方向不一致',
              }],
              suggestion: '协调事件预测与概率评分的评价逻辑',
              fieldPaths: ['eventResult.events', 'probabilityResult.dimensions'],
            }
          }
        }
        return null
      },
    },
  ]
}

/** F 类：Explain 文本级一致性 */
function buildRulesGroupF(): ConsistencyRule[] {
  return [
    // F1: Explain文本 vs 旺衰
    {
      id: 'F001',
      category: 'Explain文本级一致性',
      description: 'Explain 文本 vs 旺衰：文本不应与旺衰结果矛盾',
      severity: 'error',
      group: 'F',
      check(input) {
        const s = input.strengthResult
        const texts = input.explainTexts
        if (!s || !texts || texts.length === 0) return null
        if (s.strengthScore == null) return null

        // 合并所有 Explain 文本
        const allText = texts.map((t) => t.content).join('')

        // 身弱时文本不应说身旺
        if (s.strengthScore < 45 && containsKeyword(allText, WANG_KEYWORDS)) {
          const wangHit = WANG_KEYWORDS.find((kw) => allText.includes(kw))
          return {
            id: 'F001',
            severity: 'error',
            category: 'Explain文本级一致性',
            description: `旺衰分数${s.strengthScore}（偏弱），但解释文本中出现"${wangHit}"字样，方向矛盾`,
            modules: ['strengthEngine', 'explainEngine'],
            contradictions: [{
              moduleA: 'strengthEngine',
              moduleB: 'explainEngine',
              valueA: `strengthScore=${s.strengthScore}（偏弱）`,
              valueB: `文本含"${wangHit}"`,
              reason: '解释文本中的旺衰描述应与旺衰引擎的分析结论一致',
            }],
            suggestion: '统一解释文本的生成逻辑，确保引用正确的旺衰结论',
            fieldPaths: ['strengthResult.strengthScore', 'explainTexts'],
          }
        }

        // 身旺时文本不应说身弱
        if (s.strengthScore > 55 && containsKeyword(allText, RUO_KEYWORDS)) {
          const ruoHit = RUO_KEYWORDS.find((kw) => allText.includes(kw))
          return {
            id: 'F001',
            severity: 'error',
            category: 'Explain文本级一致性',
            description: `旺衰分数${s.strengthScore}（偏旺），但解释文本中出现"${ruoHit}"字样，方向矛盾`,
            modules: ['strengthEngine', 'explainEngine'],
            contradictions: [{
              moduleA: 'strengthEngine',
              moduleB: 'explainEngine',
              valueA: `strengthScore=${s.strengthScore}（偏旺）`,
              valueB: `文本含"${ruoHit}"`,
              reason: '解释文本中的旺衰描述应与旺衰引擎的分析结论一致',
            }],
            suggestion: '统一解释文本的生成逻辑，确保引用正确的旺衰结论',
            fieldPaths: ['strengthResult.strengthScore', 'explainTexts'],
          }
        }

        return null
      },
    },

    // F2: Explain文本 vs 用神
    {
      id: 'F002',
      category: 'Explain文本级一致性',
      description: 'Explain 文本提到的用神应与 useGodResult.yongShen 一致',
      severity: 'warning',
      group: 'F',
      check(input) {
        const u = input.useGodResult
        const texts = input.explainTexts
        if (!u || !texts || texts.length === 0) return null

        const allText = texts.map((t) => t.content).join('')

        // 在文本中查找"用神"关键字附近的五行引用（支持"用神壬水"等天干+五行格式）
        const yongShenPattern = /用神[为是：:]?\s*[「"'']?(?:[甲乙丙丁戊己庚辛壬癸])?([木火土金水])[」"'']?/g
        let match: RegExpExecArray | null
        const mentionedElements: string[] = []
        while ((match = yongShenPattern.exec(allText)) !== null) {
          mentionedElements.push(match[1])
        }

        if (mentionedElements.length === 0) return null

        // 检查是否包含用神引擎的结论
        if (!mentionedElements.includes(u.yongShen)) {
          return {
            id: 'F002',
            severity: 'warning',
            category: 'Explain文本级一致性',
            description: `解释文本中提及的用神为"${mentionedElements.join('、')}"，但用神引擎结论为"${u.yongShen}"，不一致`,
            modules: ['useGodEngine', 'explainEngine'],
            contradictions: [{
              moduleA: 'useGodEngine.yongShen',
              moduleB: 'explainEngine.texts',
              valueA: `yongShen="${u.yongShen}"`,
              valueB: `文本提及用神="${mentionedElements.join('、')}"`,
              reason: '解释文本中的用神描述应与用神引擎的分析结论一致',
            }],
            suggestion: '确保解释文本的用神引用与引擎计算结果同步',
            fieldPaths: ['useGodResult.yongShen', 'explainTexts'],
          }
        }

        return null
      },
    },
  ]
}

// ────────────────────────────────────────────
// ConsistencyChecker 核心类
// ────────────────────────────────────────────

export class ConsistencyChecker {
  /** 一致性规则列表 */
  private rules: ConsistencyRule[] = []

  constructor() {
    this.initRules()
  }

  /** 初始化全部规则 */
  private initRules(): void {
    this.rules = [
      ...buildRulesGroupA(),
      ...buildRulesGroupB(),
      ...buildRulesGroupC(),
      ...buildRulesGroupD(),
      ...buildRulesGroupE(),
      ...buildRulesGroupF(),
    ]
  }

  /**
   * 执行一致性检查
   * @param input 所有引擎结果的合并输入
   * @returns 一致性检查结果
   */
  check(input: ConsistencyInput): ConsistencyCheckResult {
    const issues = this.runRules(input)
    const score = this.calculateScore(issues)
    const summary = this.buildSummary(issues, score)
    const modulesChecked = countActiveModules(input)
    const rulesChecked = this.rules.length
    const passed = issues.every((i) => i.severity !== 'error')
    const classicalRef = pick(CLASSICAL_REFS)

    return {
      issues,
      bySeverity: {
        error: issues.filter((i) => i.severity === 'error'),
        warning: issues.filter((i) => i.severity === 'warning'),
        info: issues.filter((i) => i.severity === 'info'),
      },
      summary,
      consistencyScore: score,
      modulesChecked,
      rulesChecked,
      passed,
      classicalRef,
    }
  }

  /**
   * 执行所有规则，收集问题
   */
  private runRules(input: ConsistencyInput): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = []
    for (const rule of this.rules) {
      try {
        const issue = rule.check(input)
        if (issue) {
          issues.push(issue)
        }
      } catch {
        // 单条规则异常不影响整体检查
      }
    }
    return issues
  }

  /**
   * 计算一致性评分
   * - 基础分 100
   * - 每个 error 扣 15 分
   * - 每个 warning 扣 5 分
   * - 每个 info 扣 1 分
   * - 最低 0 分
   */
  private calculateScore(issues: ConsistencyIssue[]): number {
    let score = 100
    for (const issue of issues) {
      switch (issue.severity) {
        case 'error':
          score -= 15
          break
        case 'warning':
          score -= 5
          break
        case 'info':
          score -= 1
          break
      }
    }
    return Math.max(0, Math.min(100, score))
  }

  /**
   * 生成总评文本
   */
  private buildSummary(issues: ConsistencyIssue[], score: number): string {
    const errorCount = issues.filter((i) => i.severity === 'error').length
    const warningCount = issues.filter((i) => i.severity === 'warning').length
    const infoCount = issues.filter((i) => i.severity === 'info').length

    if (errorCount > 0) {
      const parts = pickN([
        `发现 ${errorCount} 项严重矛盾，各模块分析结果存在实质性冲突`,
        `存在 ${errorCount} 处核心逻辑矛盾，需优先修复`,
        `${errorCount} 个严重问题表明引擎间存在根本性不一致`,
      ], 1)
      return `一致性检查未通过。${parts[0]}，${warningCount} 项警告，${infoCount} 项提示。建议逐一排查矛盾来源，修正后再行分析。`
    }

    if (warningCount > 3) {
      const parts = pickN([
        `虽无严重矛盾，但有 ${warningCount} 项警告值得关注`,
        `各模块大体一致，但 ${warningCount} 项细节差异可能影响综合判断`,
      ], 1)
      return `一致性基本通过。${parts[0]}，${infoCount} 项提示。建议审视警告项，优化分析精度。`
    }

    if (warningCount > 0) {
      const parts = pickN([
        `仅有 ${warningCount} 项轻微警告，整体一致性良好`,
        `各引擎协同度较高，${warningCount} 项细微差异在可接受范围`,
      ], 1)
      return `一致性检查通过。${parts[0]}，${infoCount} 项参考信息。命理分析结果可放心引用。`
    }

    if (infoCount > 0) {
      const parts = pickN([
        `仅有 ${infoCount} 项信息提示，各模块高度一致`,
        `分析结果无矛盾，${infoCount} 项提示为优化建议`,
      ], 1)
      return `一致性优秀。${parts[0]}。分析体系运转良好，结果可信度高。`
    }

    return pick([
      '各引擎分析结果完全一致，无任何矛盾。命理分析体系运转和谐，结果高度可信。',
      '一致性完美。所有模块协同无间，分析结论互相印证，可信度极高。',
    ])
  }
}

// ────────────────────────────────────────────
// 辅助导出函数
// ────────────────────────────────────────────

/**
 * 快速检查（仅检查 A/B/C 类核心规则）
 * @param input 所有引擎结果的合并输入
 * @returns 快速检查结果
 */
export function quickCheck(input: ConsistencyInput): { passed: boolean; score: number; issueCount: number } {
  const checker = new ConsistencyChecker()
  // 复用内部规则但只执行核心规则
  const coreIssues: ConsistencyIssue[] = []
  for (const rule of checker['rules']) {
    if (rule.group === 'A' || rule.group === 'B' || rule.group === 'C') {
      try {
        const issue = rule.check(input)
        if (issue) coreIssues.push(issue)
      } catch {
        // 忽略单条规则异常
      }
    }
  }
  const score = checker['calculateScore'](coreIssues)
  const passed = coreIssues.every((i) => i.severity !== 'error')
  return { passed, score, issueCount: coreIssues.length }
}

/**
 * 格式化报告为可读文本
 * @param result 一致性检查结果
 * @returns 格式化的报告字符串
 */
export function formatReport(result: ConsistencyCheckResult): string {
  const lines: string[] = []

  lines.push('═══════ 一致性校验报告 ═══════')
  lines.push(`总评分：${result.consistencyScore}/100（${result.passed ? '通过' : '未通过'}）`)
  lines.push(`检查模块：${result.modulesChecked} | 检查规则：${result.rulesChecked}`)
  lines.push('')

  // ERROR
  lines.push(`■ ERROR (${result.bySeverity.error.length})`)
  if (result.bySeverity.error.length === 0) {
    lines.push('  无')
  } else {
    for (const issue of result.bySeverity.error) {
      lines.push(`  [${issue.id}] ${issue.description}`)
      lines.push(`    模块：${issue.modules.join('、')}`)
      if (issue.contradictions.length > 0) {
        const c = issue.contradictions[0]
        lines.push(`    矛盾：${c.valueA} vs ${c.valueB}`)
        lines.push(`    原因：${c.reason}`)
      }
      lines.push(`    建议：${issue.suggestion}`)
      lines.push('')
    }
  }
  lines.push('')

  // WARNING
  lines.push(`▲ WARNING (${result.bySeverity.warning.length})`)
  if (result.bySeverity.warning.length === 0) {
    lines.push('  无')
  } else {
    for (const issue of result.bySeverity.warning) {
      lines.push(`  [${issue.id}] ${issue.description}`)
      lines.push(`    模块：${issue.modules.join('、')}`)
      if (issue.contradictions.length > 0) {
        const c = issue.contradictions[0]
        lines.push(`    矛盾：${c.valueA} vs ${c.valueB}`)
        lines.push(`    原因：${c.reason}`)
      }
      lines.push(`    建议：${issue.suggestion}`)
      lines.push('')
    }
  }
  lines.push('')

  // INFO
  lines.push(`● INFO (${result.bySeverity.info.length})`)
  if (result.bySeverity.info.length === 0) {
    lines.push('  无')
  } else {
    for (const issue of result.bySeverity.info) {
      lines.push(`  [${issue.id}] ${issue.description}`)
      lines.push(`    模块：${issue.modules.join('、')}`)
      if (issue.contradictions.length > 0) {
        const c = issue.contradictions[0]
        lines.push(`    矛盾：${c.valueA} vs ${c.valueB}`)
        lines.push(`    原因：${c.reason}`)
      }
      lines.push(`    建议：${issue.suggestion}`)
      lines.push('')
    }
  }
  lines.push('')

  // 总评
  lines.push('───────────────────────────────')
  lines.push(`总评：${result.summary}`)
  lines.push(`古籍：${result.classicalRef}`)
  lines.push('═════════════════════════════')

  return lines.join('\n')
}
