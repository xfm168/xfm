import { useState, useCallback, useEffect, useRef } from 'react'
import { getAIService } from '../services/ai'
import { safeParseAIJson } from '../utils/aiJson'
import { AI_SCHEMA_VERSION } from '../constants/defaultAnalysis'
import type { AIPromptKey } from '../services/ai/types'

const CACHE_TTL = 24 * 60 * 60 * 1000

interface AICacheEntry<T> {
  data: T
  version: string
  model: string
  createdAt: number
}

interface UseAIAnalysisOptions<T> {
  promptKey: AIPromptKey
  variables: Record<string, string | number | boolean | undefined>
  defaultValue: T
  cacheKey?: string
  autoFetch?: boolean
}

interface UseAIAnalysisResult<T> {
  data: T
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  retry: () => Promise<void>
}

function getCacheKey(module: string, inputHash: string): string {
  return `ai:${module}:${inputHash}`
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const entry = JSON.parse(raw) as AICacheEntry<T>
    if (!entry || !entry.createdAt) return null
    if (Date.now() - entry.createdAt > CACHE_TTL) return null
    if (entry.version !== AI_SCHEMA_VERSION) return null
    return entry.data
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T, model: string): void {
  try {
    const entry: AICacheEntry<T> = {
      data,
      version: AI_SCHEMA_VERSION,
      model,
      createdAt: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // ignore
  }
}

function hashInput(variables: Record<string, unknown>): string {
  const str = JSON.stringify(variables)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function fillDefaults<T>(partial: Partial<T> | null, defaultValue: T): T {
  if (!partial) return defaultValue
  return { ...defaultValue, ...partial }
}

export function useAIAnalysis<T>(options: UseAIAnalysisOptions<T>): UseAIAnalysisResult<T> {
  const { promptKey, variables, defaultValue, cacheKey, autoFetch = true } = options

  const [data, setData] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)
  const variablesHash = useRef(hashInput(variables))

  const moduleName = promptKey.split('.')[0]
  const storageKey = cacheKey || getCacheKey(moduleName, variablesHash.current)

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const aiService = getAIService()
      const response = await aiService.generateWithPrompt(promptKey, variables)

      const json = safeParseAIJson<Partial<T>>(response.content || '')
      const result = fillDefaults<T>(json, defaultValue)

      setData(result)
      writeCache(storageKey, result, response.model)
      fetchedRef.current = true
    } catch (err) {
      console.warn('[AI] analysis failed:', promptKey, err)
      setError('AI 暂时不可用，请稍后重试')
      // 失败时保持默认值，页面继续可用
      setData(defaultValue)
    } finally {
      setLoading(false)
    }
  }, [promptKey, variables, defaultValue, storageKey])

  const retry = useCallback(async () => {
    await fetchAnalysis()
  }, [fetchAnalysis])

  useEffect(() => {
    if (!autoFetch) return
    if (fetchedRef.current) return

    // 先读缓存
    const cached = readCache<T>(storageKey)
    if (cached) {
      setData(cached)
      fetchedRef.current = true
      return
    }

    fetchAnalysis()
  }, [autoFetch, storageKey, fetchAnalysis])

  return {
    data,
    loading,
    error,
    fetch: fetchAnalysis,
    retry,
  }
}
