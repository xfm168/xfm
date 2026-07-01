import { BaseAIProvider } from './base'
import type {
  AIMessage,
  AIRequestOptions,
  AIResponse,
  AIModel,
  AIProviderType,
} from '../types'
import { AIError } from '../types'

export interface OpenAIProviderConfig {
  apiKey: string
  baseUrl?: string
}

const OPENAI_MODELS: AIModel[] = ['gpt-4o', 'gpt-4o-mini']

export class OpenAIProvider extends BaseAIProvider {
  readonly type: AIProviderType = 'openai'
  readonly name = 'OpenAI'

  private config: OpenAIProviderConfig

  constructor(config: OpenAIProviderConfig) {
    super()
    this.config = config
  }

  supportsModel(model: AIModel): boolean {
    return OPENAI_MODELS.includes(model)
  }

  async chat(
    messages: AIMessage[],
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    this.assertMessages(messages)

    const model = options.model || 'gpt-4o-mini'
    if (!this.supportsModel(model)) {
      throw new AIError(
        `Model ${model} not supported by OpenAI`,
        'UNSUPPORTED_MODEL',
        this.type
      )
    }

    const baseUrl = this.config.baseUrl || 'https://api.openai.com/v1'

    return this.withTimeoutAndRetry(async (signal) => {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature,
          max_tokens: options.maxTokens,
          top_p: options.topP,
        }),
        signal,
      })

      if (!response.ok) {
        if (response.status === 429) throw AIError.RateLimit(this.type)
        if (response.status >= 500) throw AIError.ProviderUnavailable(this.type)
        throw new AIError(`OpenAI error: ${response.status}`, 'HTTP_ERROR', this.type)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''

      if (!content) {
        throw AIError.InvalidResponse(this.type, data)
      }

      return {
        content,
        model: data.model || model,
        provider: this.type,
        usage: data.usage,
        raw: data,
      }
    }, options)
  }
}
