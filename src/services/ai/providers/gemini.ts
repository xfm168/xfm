import { BaseAIProvider } from './base'
import type {
  AIMessage,
  AIRequestOptions,
  AIResponse,
  AIModel,
  AIProviderType,
} from '../types'
import { AIError } from '../types'

export interface GeminiProviderConfig {
  apiKey: string
  baseUrl?: string
}

const GEMINI_MODELS: AIModel[] = ['gemini-2.0-flash', 'gemini-2.0-pro']

export class GeminiProvider extends BaseAIProvider {
  readonly type: AIProviderType = 'gemini'
  readonly name = 'Google Gemini'

  private config: GeminiProviderConfig

  constructor(config: GeminiProviderConfig) {
    super()
    this.config = config
  }

  supportsModel(model: AIModel): boolean {
    return GEMINI_MODELS.includes(model)
  }

  async chat(
    messages: AIMessage[],
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    this.assertMessages(messages)

    const model = options.model || 'gemini-2.0-flash'
    if (!this.supportsModel(model)) {
      throw new AIError(
        `Model ${model} not supported by Gemini`,
        'UNSUPPORTED_MODEL',
        this.type
      )
    }

    const baseUrl = this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
    const url = `${baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`

    return this.withTimeoutAndRetry(async (signal) => {
      const systemInstruction = messages.find((m) => m.role === 'system')
      const chatMessages = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }))

      const body: Record<string, unknown> = {
        contents: chatMessages,
      }

      if (systemInstruction) {
        body.systemInstruction = {
          parts: [{ text: systemInstruction.content }],
        }
      }

      if (options.temperature !== undefined) {
        body.generationConfig = {
          temperature: options.temperature,
          maxOutputTokens: options.maxTokens,
          topP: options.topP,
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal,
      })

      if (!response.ok) {
        if (response.status === 429) throw AIError.RateLimit(this.type)
        if (response.status >= 500) throw AIError.ProviderUnavailable(this.type)
        throw new AIError(`Gemini error: ${response.status}`, 'HTTP_ERROR', this.type)
      }

      const data = await response.json()
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      if (!content) {
        throw AIError.InvalidResponse(this.type, data)
      }

      return {
        content,
        model,
        provider: this.type,
        usage: {
          promptTokens: data.usageMetadata?.promptTokenCount,
          completionTokens: data.usageMetadata?.candidatesTokenCount,
          totalTokens: data.usageMetadata?.totalTokenCount,
        },
        raw: data,
      }
    }, options)
  }
}
