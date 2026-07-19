/**
 * H2.1: 统一 AI Provider 接口
 * 
 * 与现有 services/ai/ provider 兼容。
 * 新增 vision、streaming、retry/fallback 支持。
 */

export type AIProviderType = 'gemini' | 'openai' | 'claude' | 'deepseek' | 'qwen' | 'supabase-edge'

export type AIModel =
  | 'gemini-2.0-flash' | 'gemini-2.0-pro'
  | 'gpt-4o' | 'gpt-4o-mini'
  | 'claude-3.5-sonnet' | 'claude-3-opus'
  | 'deepseek-v3' | 'deepseek-r1'
  | 'qwen-max' | 'qwen-plus'
  | 'supabase-edge'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  images?: string[]  // base64 或 URL
}

export interface AIRequestOptions {
  model?: AIModel
  temperature?: number
  maxTokens?: number
  topP?: number
  timeoutMs?: number
  retryCount?: number
  metadata?: Record<string, unknown>
}

export interface AIResponse {
  content: string
  model: AIModel
  provider: AIProviderType
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  raw?: unknown
}

export interface AIStreamChunk {
  content: string
  done: boolean
  usage?: AIResponse['usage']
}

export interface AIProviderConfig {
  type: AIProviderType
  name: string
  apiKey?: string
  baseUrl?: string
  enabled: boolean
  priority: number  // fallback 优先级，越小越优先
  models: AIModel[]
}

/** Provider 可重试的错误类型 */
export type AIRetryableError = 'rate_limit' | 'server_error' | 'timeout' | 'network'

export class AIError extends Error {
  constructor(
    message: string,
    public readonly code: AIRetryableError | 'unknown' | 'auth' | 'invalid_request' | 'context_too_long',
    public readonly retryable: boolean,
    public readonly provider?: AIProviderType,
    public readonly statusCode?: number,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'AIError'
  }

  static retryable(message: string, code: AIRetryableError, provider?: AIProviderType, statusCode?: number, cause?: unknown) {
    return new AIError(message, code, true, provider, statusCode, cause)
  }

  static fatal(message: string, code: 'unknown' | 'auth' | 'invalid_request' | 'context_too_long', provider?: AIProviderType, statusCode?: number, cause?: unknown) {
    return new AIError(message, code, false, provider, statusCode, cause)
  }
}