/**
 * H3 Module 2: Professional ShenSha Engine
 *
 * 可配置神煞引擎 — 主入口。
 *
 * 数据流：
 *   ProfessionalFourPillarsResult + gender
 *       │
 *       ▼
 *   ShenShaDatabase（38种神煞统一定义）
 *       │
 *       ▼
 *   统一 Calculator 调用
 *       │
 *       ▼
 *   冲突检测 + 优先级排序
 *       │
 *       ▼
 *   ShenShaEngineOutput (JSON)
 *
 * 所有计算可追溯（TraceChain），异常使用 WarningCode。
 */

import type { HeavenlyStem, EarthlyBranch } from '@/lib/core/types/base'
import type {
  ProfessionalFourPillarsResult,
  DerivationStep,
} from './types'
import { createChain } from './types'
import type {
  ShenShaResult,
  ShenShaEngineOutput,
  ShenShaCategory,
} from './shenshaTypes'
import { SHEN_SHA_DATABASE } from './shenshaDatabase'
import type { ProfessionalConfig } from './config'
import { CLASSIC_CONFIG } from './config'
import type { WarningCode } from './warnings'

export const SHEN_SHA_ENGINE_VERSION = '2.0.0'

/** 神煞引擎选项 */
export interface ShenShaEngineOptions {
  /** 性别 */
  gender: string
  /** 配置（可选，默认 CLASSIC_CONFIG） */
  config?: ProfessionalConfig
  /** 仅计算指定分类（可选） */
  categories?: ShenShaCategory[]
  /** 仅计算指定神煞 ID（可选） */
  onlyIds?: string[]
  /** 是否启用冲突检测 */
  detectConflicts?: boolean
}

/** 冲突检测结果 */
export interface ConflictInfo {
  id: string
  name: string
  conflictWith: string[]
  resolution: string
}

/** 缓存结构 */
const resultCache = new Map<string, ShenShaEngineOutput>()

/** 构建缓存键 */
function buildCacheKey(
  sixLines: ProfessionalFourPillarsResult['sixLines'],
  gender: string,
  categories?: ShenShaCategory[],
  onlyIds?: string[],
): string {
  const base = `${sixLines.year.gan}${sixLines.year.zhi}-${sixLines.month.gan}${sixLines.month.zhi}-${sixLines.day.gan}${sixLines.day.zhi}-${sixLines.hour.gan}${sixLines.hour.zhi}-${gender}`
  const cat = categories?.join(',') ?? 'all'
  const ids = onlyIds?.join(',') ?? 'all'
  return `${base}|${cat}|${ids}`
}

/**
 * Professional ShenSha Engine 主入口
 *
 * @param pillars - Module 1 四柱排盘结果
 * @param options - 引擎选项
 * @returns 完整神煞引擎输出
 */
export function calculateShenSha(
  pillars: ProfessionalFourPillarsResult,
  options: ShenShaEngineOptions,
): ShenShaEngineOutput {
  const engineStart = Date.now()
  const {
    gender,
    config = CLASSIC_CONFIG,
    categories,
    onlyIds,
    detectConflicts = true,
  } = options

  // 缓存检查
  const cacheKey = buildCacheKey(pillars.sixLines, gender, categories, onlyIds)
  const cached = resultCache.get(cacheKey)
  if (cached) {
    return {
      ...cached,
      computeTimeMs: 0, // 缓存命中视为 0ms
    }
  }

  const allSteps: DerivationStep[] = []
  const warnings: WarningCode[] = []

  const { year, month, day, hour } = pillars.sixLines

  // Step 1: 过滤需要计算的神煞
  let database = SHEN_SHA_DATABASE
  if (categories && categories.length > 0) {
    database = database.filter(s => categories.includes(s.category))
  }
  if (onlyIds && onlyIds.length > 0) {
    database = database.filter(s => onlyIds.includes(s.id))
  }

  if (database.length === 0) {
    warnings.push('UNKNOWN_RULE')
  }

  allSteps.push({
    id: 'shensha-filter',
    name: '神煞过滤',
    input: { total: SHEN_SHA_DATABASE.length, filtered: database.length, categories, onlyIds },
    output: { selected: database.map(s => s.id) },
    confidence: 1.0,
    algorithmVersion: config.algorithmVersion,
    source: config.defaultSource,
    timestamp: Date.now(),
  })

  // Step 2: 逐个计算神煞
  const results: ShenShaResult[] = []
  const conflicts: ConflictInfo[] = []

  for (const def of database) {
    const calcStart = Date.now()

    const calcResult = def.calculator(
      year.gan, year.zhi,
      month.gan, month.zhi,
      day.gan, day.zhi,
      hour.gan, hour.zhi,
      gender,
    )

    const result: ShenShaResult = {
      id: def.id,
      name: def.name,
      category: def.category,
      hit: calcResult.hit,
      positions: calcResult.positions,
      description: def.formula,
      reference: def.source,
      modernExplain: def.modernExplain,
      applicable: def.applicable,
      conflicts: def.conflicts,
      priority: def.priority,
      confidence: calcResult.confidence,
      isAuspicious: def.isAuspicious,
      derivationSteps: [
        {
          ruleId: def.id,
          input: {
            year: `${year.gan}${year.zhi}`,
            month: `${month.gan}${month.zhi}`,
            day: `${day.gan}${day.zhi}`,
            hour: `${hour.gan}${hour.zhi}`,
            gender,
          },
          output: { hit: calcResult.hit, positions: calcResult.positions },
          source: def.source,
        },
      ],
    }

    results.push(result)

    allSteps.push({
      id: `shensha-${def.id}`,
      name: `神煞计算：${def.name}`,
      input: { dayGan: day.gan, dayZhi: day.zhi, yearZhi: year.zhi, monthZhi: month.zhi },
      output: { hit: calcResult.hit, positions: calcResult.positions.length },
      ruleId: def.id,
      ruleDescription: def.formula,
      confidence: calcResult.confidence,
      algorithmVersion: config.algorithmVersion,
      source: def.source,
      timestamp: calcStart,
    })
  }

  // Step 3: 冲突检测
  if (detectConflicts) {
    const hitMap = new Map<string, ShenShaResult>()
    for (const r of results) {
      if (r.hit) hitMap.set(r.id, r)
    }

    for (const r of results) {
      if (!r.hit || r.conflicts.length === 0) continue
      const activeConflicts = r.conflicts.filter(cid => hitMap.has(cid))
      if (activeConflicts.length > 0) {
        const conflictNames = activeConflicts.map(cid => hitMap.get(cid)!.name)
        conflicts.push({
          id: r.id,
          name: r.name,
          conflictWith: conflictNames,
          resolution: `${r.name}与${conflictNames.join('、')}同现，需综合判断吉凶转化。`,
        })
      }
    }

    if (conflicts.length > 0) {
      warnings.push('MULTI_RULE_CONFLICT')
    }

    // LOW_CONFIDENCE: 检查是否有低置信度的命中神煞
    const lowConfHits = results.filter(r => r.hit && r.confidence < 0.8)
    if (lowConfHits.length > 0) {
      warnings.push('LOW_CONFIDENCE')
    }

    // FALLBACK_USED: 无匹配规则时使用了默认数据库
    if (database.length === 0 && SHEN_SHA_DATABASE.length > 0) {
      warnings.push('FALLBACK_USED')
    }

    allSteps.push({
      id: 'conflict-detection',
      name: '冲突检测',
      input: { hitCount: hitMap.size },
      output: { conflicts: conflicts.map(c => c.id) },
      confidence: 0.90,
      algorithmVersion: config.algorithmVersion,
      source: config.defaultSource,
      timestamp: Date.now(),
    })
  }

  // Step 4: 按分类分组
  const byCategory: Record<string, ShenShaResult[]> = {}
  for (const r of results) {
    if (!byCategory[r.category]) byCategory[r.category] = []
    byCategory[r.category].push(r)
  }

  // Step 5: 命中 / 吉凶分离
  const hits = results.filter(r => r.hit)
  const auspicious = hits.filter(r => r.isAuspicious)
  const inauspicious = hits.filter(r => !r.isAuspicious)

  // Step 6: 按优先级排序
  const sortByPriority = (a: ShenShaResult, b: ShenShaResult) => b.priority - a.priority
  hits.sort(sortByPriority)
  auspicious.sort(sortByPriority)
  inauspicious.sort(sortByPriority)

  // Step 7: 统计
  const stats = {
    total: results.length,
    hitCount: hits.length,
    missCount: results.length - hits.length,
    auspiciousCount: auspicious.length,
    inauspiciousCount: inauspicious.length,
  }

  allSteps.push({
    id: 'shensha-stats',
    name: '神煞统计',
    input: { total: results.length },
    output: { hitCount: hits.length, auspicious: auspicious.length, inauspicious: inauspicious.length },
    confidence: 1.0,
    algorithmVersion: config.algorithmVersion,
    source: config.defaultSource,
    timestamp: Date.now(),
  })

  const computeTimeMs = Date.now() - engineStart

  const output: ShenShaEngineOutput = {
    version: SHEN_SHA_ENGINE_VERSION,
    results,
    byCategory: byCategory as Record<ShenShaCategory, ShenShaResult[]>,
    hits,
    auspicious,
    inauspicious,
    stats,
    warnings,
    computeTimeMs,
    derivation: createChain(allSteps, computeTimeMs, {
      engineVersion: SHEN_SHA_ENGINE_VERSION,
      algorithmVersion: config.algorithmVersion,
      warnings,
    }),
  }

  // 写入缓存
  resultCache.set(cacheKey, output)

  return output
}

/**
 * 清空神煞缓存（测试用）
 */
export function clearShenShaCache(): void {
  resultCache.clear()
}

/**
 * 获取缓存大小（测试/监控用）
 */
export function getShenShaCacheSize(): number {
  return resultCache.size
}

/**
 * AI Explain 接口 — 为神煞结果生成结构化解释
 *
 * 不直接写死解释文本，而是输出结构化数据供 AI 层使用。
 */
export interface ShenShaExplainInput {
  result: ShenShaResult
  dayMaster: HeavenlyStem
}

export interface ShenShaExplainOutput {
  /** 计算依据 */
  basis: string
  /** 经典出处 */
  classicalReference: string
  /** 现代解释 */
  modernInterpretation: string
  /** 适用条件 */
  conditions: string
  /** 冲突情况 */
  conflictSituation: string | null
  /** 可信度评估 */
  confidenceAssessment: string
  /** 建议 */
  suggestions: string[]
}

export function explainShenSha(
  input: ShenShaExplainInput,
  _config?: ProfessionalConfig,
): ShenShaExplainOutput {
  const { result, dayMaster } = input

  const basis = `${result.name}以${dayMaster}日干查得，${result.description}`
  const classicalReference = result.reference
  const modernInterpretation = result.modernExplain
  const conditions = result.applicable
  const conflictSituation = result.conflicts.length > 0
    ? `与${result.conflicts.join('、')}存在潜在冲突，需综合判断。`
    : null
  const confidenceAssessment = `可信度${(result.confidence * 100).toFixed(0)}%，${result.confidence >= 0.9 ? '高置信' : result.confidence >= 0.8 ? '中置信' : '低置信'}。`

  const suggestions: string[] = []
  if (result.isAuspicious && result.hit) {
    suggestions.push(`善用${result.name}之吉象，把握机遇。`)
  } else if (!result.isAuspicious && result.hit) {
    suggestions.push(`注意${result.name}之凶象，谨慎行事。`)
  }
  if (result.conflicts.length > 0) {
    suggestions.push('注意与其他神煞的相互作用，综合判断。')
  }

  return {
    basis,
    classicalReference,
    modernInterpretation,
    conditions,
    conflictSituation,
    confidenceAssessment,
    suggestions,
  }
}
