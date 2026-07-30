export type AIModel =
  | 'gemini-2.0-flash'
  | 'gemini-2.0-pro'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'claude-3.5-sonnet'
  | 'deepseek-v3'
  | 'deepseek-r1'
  | 'openrouter-auto'
  | 'supabase-edge'

export type AIProviderType =
  | 'supabase-edge'
  | 'gemini'
  | 'openai'
  | 'deepseek'
  | 'openrouter'
  | 'claude'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
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

export type AIPromptKey =
  | 'divination.analyze'
  | 'divination.changing'
  | 'fengshui.room'
  | 'daily.interpretation'
  | 'bazi.basic'
  | 'bazi.humanize'
  | 'ziwei.chart'
  | 'qimen.analysis'
  | 'couple.compatibility'
  | 'mentor.chat'

export interface AIPrompt {
  key: AIPromptKey
  system: string
  userTemplate: string
  description: string
  category: 'divination' | 'fengshui' | 'daily' | 'bazi' | 'ziwei' | 'qimen' | 'couple' | 'mentor'
  defaultModel?: AIModel
  defaultTemperature?: number
}

export interface AIProvider {
  type: AIProviderType
  name: string

  chat(
    messages: AIMessage[],
    options?: AIRequestOptions
  ): Promise<AIResponse>

  supportsModel(model: AIModel): boolean

  healthCheck?(): Promise<boolean>
}

export interface AIServiceConfig {
  defaultProvider: AIProviderType
  defaultModel: AIModel
  fallbackProviders?: AIProviderType[]
  fallbackModels?: AIModel[]
}

export class AIError extends Error {
  readonly code: string
  readonly provider?: AIProviderType
  readonly cause?: unknown

  constructor(
    message: string,
    code: string,
    provider?: AIProviderType,
    cause?: unknown
  ) {
    super(message)
    this.name = 'AIError'
    this.code = code
    this.provider = provider
    this.cause = cause
  }

  static ProviderUnavailable(provider: AIProviderType, cause?: unknown): AIError {
    return new AIError(
      `AI provider "${provider}" is unavailable`,
      'PROVIDER_UNAVAILABLE',
      provider,
      cause
    )
  }

  static RateLimit(provider?: AIProviderType, cause?: unknown): AIError {
    return new AIError('Rate limit exceeded', 'RATE_LIMIT', provider, cause)
  }

  static Timeout(provider?: AIProviderType, cause?: unknown): AIError {
    return new AIError('Request timed out', 'TIMEOUT', provider, cause)
  }

  static InvalidResponse(provider?: AIProviderType, cause?: unknown): AIError {
    return new AIError('Invalid AI response', 'INVALID_RESPONSE', provider, cause)
  }
}
