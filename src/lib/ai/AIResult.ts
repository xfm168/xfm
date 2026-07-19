/**
 * H2.1 Enterprise: 统一 AIResult<T> Schema
 *
 * 所有 Provider 输出统一为 AIResult<T>。
 * 确保调用方无需关心底层 Provider 差异。
 */

import type { AIProviderType, AIModel } from './AIProvider'

export interface AIResult<T = unknown> {
  /** 是否成功 */
  success: boolean
  /** Provider 类型 */
  provider: AIProviderType
  /** 使用的模型 */
  model: AIModel
  /** 响应延迟 ms */
  latencyMs: number
  /** Token 使用 */
  tokens: {
    prompt: number
    completion: number
    total: number
  }
  /** 估算成本（USD） */
  cost: number
  /** 是否来自缓存 */
  cached: boolean
  /** 追踪 ID */
  traceId: string
  /** 业务数据 */
  data: T
  /** 错误信息（失败时） */
  error?: string
}

export interface AIResultList<T = unknown> {
  results: AIResult<T>[]
  totalCount: number
  successCount: number
  failureCount: number
  totalLatencyMs: number
  totalTokens: number
  totalCost: number
}

/** 构建成功结果 */
export function aiSuccess<T>(params: {
  data: T
  provider: AIProviderType
  model: AIModel
  latencyMs: number
  tokens: { prompt: number; completion: number }
  cost: number
  cached?: boolean
  traceId?: string
}): AIResult<T> {
  return {
    success: true,
    provider: params.provider,
    model: params.model,
    latencyMs: params.latencyMs,
    tokens: { ...params.tokens, total: params.tokens.prompt + params.tokens.completion },
    cost: params.cost,
    cached: params.cached ?? false,
    traceId: params.traceId ?? '',
    data: params.data,
  }
}

/** 构建失败结果 */
export function aiFailure<T = never>(params: {
  provider: AIProviderType
  model: AIModel
  latencyMs: number
  error: string
  traceId?: string
}): AIResult<T> {
  return {
    success: false,
    provider: params.provider,
    model: params.model,
    latencyMs: params.latencyMs,
    tokens: { prompt: 0, completion: 0, total: 0 },
    cost: 0,
    cached: false,
    traceId: params.traceId ?? '',
    data: undefined as T,
    error: params.error,
  }
}

/** 合并批量结果 */
export function mergeResults<T>(results: AIResult<T>[]): AIResultList<T> {
  return {
    results,
    totalCount: results.length,
    successCount: results.filter(r => r.success).length,
    failureCount: results.filter(r => !r.success).length,
    totalLatencyMs: results.reduce((s, r) => s + r.latencyMs, 0),
    totalTokens: results.reduce((s, r) => s + r.tokens.total, 0),
    totalCost: results.reduce((s, r) => s + r.cost, 0),
  }
}