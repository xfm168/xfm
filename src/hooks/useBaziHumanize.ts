/**
 * B8 AI 边界：AI 仅负责把 RuleEngine 输出的人类可读化，绝不参与排盘/推盘
 *
 * 本 Hook 只接收：
 *   1) paipanJson: 程序已经算好的排盘文本（只读展示给AI，不是让AI重新推）
 *   2) inferences: StandardInferenceResult[] — RuleEngine 输出的三元组
 *      - result:   结论
 *      - evidence: 依据（B3 追溯链 narrative）
 *      - confidence: B4 5 维可信度拆分
 *
 * ⚠️ 约束：
 *   - 禁止把 raw birth 原始出生时间直接传给 AI 让 AI 自己算四柱
 *   - 禁止 AI 重新计算五行/十神/神煞/格局/喜用神/大运/流年
 *   - AI 只做"润色/解释/扩展成自然语言"
 */
import { useState, useCallback, useEffect, useRef } from 'react'
import { getAIService } from '../services/ai'
import { safeParseAIJson } from '../utils/aiJson'
import { getCache, setCache, cacheKey, hashInput } from '../utils/aiCache'
import type { StandardInferenceResult } from '../lib/bazi/ruleEngine/types'
import type { AIPromptKey } from '../services/ai/types'

export interface UseBaziHumanizeOptions<T> {
  /** 必须使用 bazi.humanize，禁止使用 bazi.basic（旧接口允许 AI 自排盘） */
  promptKey: AIPromptKey
  /** 程序算好的排盘 JSON 文本（只用于 AI 参考，不允许 AI 修改/重新计算）*/
  paipanJson: string
  /** RuleEngine 输出的三元推断结果数组（核心输入）*/
  inferences: StandardInferenceResult<any>[]
  /** 默认返回值 */
  defaultValue: T
  /** 缓存后缀（可选） */
  cacheKeySuffix?: string
  /** 是否自动拉取 */
  autoFetch?: boolean
}

export interface UseBaziHumanizeResult<T> {
  /** AI 润色后的人类可读文本/JSON */
  data: T
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  retry: () => Promise<void>
}

function fillDefaults<T>(partial: Partial<T> | null, defaultValue: T): T {
  if (!partial) return defaultValue
  return { ...(defaultValue as any), ...(partial as any) } as T
}

/** B8 强制断言：promptKey 必须是 bazi.humanize（防止误用旧的 bazi.basic）*/
function assertB8Boundary(promptKey: AIPromptKey): void {
  if (promptKey !== 'bazi.humanize') {
    // 开发期强警告，生产退化为 warn
    const msg = `[B8 AI边界] 禁止使用 promptKey=${promptKey}。八字 AI 接口必须用 bazi.humanize，且 paipanJson + inferences 必须由程序排盘和 RuleEngine 计算后再传入。`
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      throw new Error(msg)
    } else {
      console.warn(msg)
    }
  }
}

/** B8 强制断言：inferences 必须非空且每个 inference 含 result/evidence/confidence 三元 */
function assertTriple(inferences: StandardInferenceResult<any>[]): void {
  if (!inferences || inferences.length === 0) {
    console.warn('[B8 AI边界] inferences 为空，可能未走 RuleEngine 直接调用 AI')
    return
  }
  for (const inf of inferences) {
    if (!('result' in inf && 'evidence' in inf && 'confidence' in inf)) {
      const extra = `inference: ${JSON.stringify(inf).slice(0, 200)}`
      throw new Error(`[B8 AI边界] 违反三元约定：StandardInferenceResult 必须同时包含 result / evidence / confidence 三个字段。${extra}`)
    }
  }
}

export function useBaziHumanize<T>(options: UseBaziHumanizeOptions<T>): UseBaziHumanizeResult<T> {
  const {
    promptKey, paipanJson, inferences, defaultValue, cacheKeySuffix, autoFetch = true,
  } = options

  // B8 边界断言（开发期强校验）
  try {
    assertB8Boundary(promptKey)
    assertTriple(inferences)
  } catch (e) {
    console.error(e)
  }

  const [data, setData] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  const variablesHashInput = {
    // 只用程序排盘输出做哈希，不用原始 birth
    paipanHash: hashInput({ paipan: paipanJson }),
    inferenceHash: hashInput({ inf: inferences }),
  }
  const variablesHash = useRef(hashInput({ key: variablesHashInput }))

  const storageKey = cacheKey('bazi-humanize', cacheKeySuffix || variablesHash.current)

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const aiService = getAIService()
      // B8 变量构造：严禁出现 birthDate/birthTime/gender 等让 AI 自排盘的字段
      // 全部使用程序排盘输出 + RuleEngine 三元
      const variables: Record<string, any> = {
        paipan: paipanJson,
        inferences: inferences.map(inf => ({
          result: inf.result,
          evidence: inf.evidence,
          confidence: inf.confidence,
        })),
        boundaryHint:
          '[B8 边界指令] 以上 paipan + inferences 均由程序 RuleEngine 完成排盘与推演，AI 仅可以把它们润色成人类可读的自然语言。严禁自行重新计算四柱、干支、五行、十神、神煞、格局、喜用神、大运、流年。若发现输入中缺少对应结论，直接回复"程序暂未计算此项"。',
      }
      const response = await aiService.generateWithPrompt(promptKey, variables as any)
      const json = safeParseAIJson<Partial<T>>(response.content || '')
      const result = fillDefaults<T>(json, defaultValue)
      setData(result)
      setCache(storageKey, result, response.model)
      fetchedRef.current = true
    } catch {
      setError('推演润色服务暂时不可用，请稍后重试')
      setData(defaultValue)
    } finally {
      setLoading(false)
    }
  }, [promptKey, paipanJson, inferences, defaultValue, storageKey])

  const retry = useCallback(async () => {
    await fetchAnalysis()
  }, [fetchAnalysis])

  useEffect(() => {
    if (!autoFetch) return
    if (fetchedRef.current) return
    const cached = getCache<T>(storageKey)
    if (cached) {
      setData(cached)
      fetchedRef.current = true
      return
    }
    fetchAnalysis()
  }, [autoFetch, storageKey, fetchAnalysis])

  return { data, loading, error, fetch: fetchAnalysis, retry }
}
