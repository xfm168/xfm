import { useState, useCallback, useEffect, useRef } from 'react'
import { getAIService } from '../services/ai'
import { safeParseAIJson } from '../utils/aiJson'
import { getCache, setCache, cacheKey, hashInput } from '../utils/aiCache'
import type { AIPromptKey } from '../services/ai/types'

interface UseAIAnalysisOptions<T> {
  promptKey: AIPromptKey
  variables: Record<string, string | number | boolean | undefined>
  defaultValue: T
  cacheKeySuffix?: string
  autoFetch?: boolean
}

interface UseAIAnalysisResult<T> {
  data: T
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
  retry: () => Promise<void>
}

function fillDefaults<T>(partial: Partial<T> | null, defaultValue: T): T {
  if (!partial) return defaultValue
  return { ...defaultValue, ...partial }
}

export function useAIAnalysis<T>(options: UseAIAnalysisOptions<T>): UseAIAnalysisResult<T> {
  const { promptKey, variables, defaultValue, cacheKeySuffix, autoFetch = true } = options

  const [data, setData] = useState<T>(defaultValue)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchedRef = useRef(false)
  const variablesHash = useRef(hashInput(variables))

  const moduleName = promptKey.split('.')[0]
  const storageKey = cacheKey(moduleName, cacheKeySuffix || variablesHash.current)

  const fetchAnalysis = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const aiService = getAIService()
      const response = await aiService.generateWithPrompt(promptKey, variables)

      const json = safeParseAIJson<Partial<T>>(response.content || '')
      const result = fillDefaults<T>(json, defaultValue)

      setData(result)
      setCache(storageKey, result, response.model)
      fetchedRef.current = true
    } catch {
      setError('推演服务暂时不可用，请稍后重试')
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

    const cached = getCache<T>(storageKey)
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
