import type {
  AIProvider,
  AIProviderType,
  AIModel,
  AIMessage,
  AIRequestOptions,
  AIResponse,
  AIServiceConfig,
  AIPromptKey,
} from './types'
import { AIError } from './types'
import { SupabaseEdgeProvider } from './providers/supabase-edge'
import { GeminiProvider } from './providers/gemini'
import { OpenAIProvider } from './providers/openai'
import { getPrompt, renderPrompt } from './prompts'

export class AIService {
  private providers: Map<AIProviderType, AIProvider> = new Map()
  private config: AIServiceConfig

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = {
      defaultProvider: config.defaultProvider || 'supabase-edge',
      defaultModel: config.defaultModel || 'supabase-edge',
      fallbackProviders: config.fallbackProviders || [],
      fallbackModels: config.fallbackModels || [],
    }
  }

  registerProvider(type: AIProviderType, provider: AIProvider): void {
    this.providers.set(type, provider)
  }

  getProvider(type: AIProviderType): AIProvider | undefined {
    return this.providers.get(type)
  }

  getDefaultProvider(): AIProvider {
    const provider = this.providers.get(this.config.defaultProvider)
    if (!provider) {
      throw AIError.ProviderUnavailable(this.config.defaultProvider)
    }
    return provider
  }

  async chat(
    messages: AIMessage[],
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    const providers = [
      this.config.defaultProvider,
      ...(this.config.fallbackProviders || []),
    ]

    let lastError: unknown

    for (const providerType of providers) {
      const provider = this.providers.get(providerType)
      if (!provider) continue

      const model = options.model || this.config.defaultModel
      if (!provider.supportsModel(model)) continue

      try {
        return await provider.chat(messages, {
          ...options,
          model,
        })
      } catch (err) {
        lastError = err
        console.error(`[AI] Provider ${providerType} failed:`, err)
      }
    }

    if (lastError instanceof AIError) throw lastError
    throw AIError.ProviderUnavailable(
      this.config.defaultProvider,
      lastError
    )
  }

  async generateWithPrompt(
    promptKey: AIPromptKey,
    variables: Record<string, string | number | boolean | undefined>,
    userMessage?: string,
    options: AIRequestOptions = {}
  ): Promise<AIResponse> {
    const prompt = getPrompt(promptKey)
    const systemContent = prompt.system
    const userContent = userMessage
      ? userMessage
      : renderPrompt(prompt.userTemplate, variables)

    const messages: AIMessage[] = [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ]

    return this.chat(messages, {
      ...options,
      model: options.model || prompt.defaultModel,
      temperature: options.temperature ?? prompt.defaultTemperature,
    })
  }

  setDefaultProvider(type: AIProviderType): void {
    this.config.defaultProvider = type
  }

  setDefaultModel(model: AIModel): void {
    this.config.defaultModel = model
  }

  listProviders(): AIProviderType[] {
    return Array.from(this.providers.keys())
  }

  async healthCheck(): Promise<Record<AIProviderType, boolean>> {
    const results: Record<string, boolean> = {}

    for (const [type, provider] of this.providers) {
      try {
        results[type] = provider.healthCheck ? await provider.healthCheck() : true
      } catch {
        results[type] = false
      }
    }

    return results as Record<AIProviderType, boolean>
  }
}

let globalAIService: AIService | null = null

export function initAIService(): AIService {
  const service = new AIService({
    defaultProvider: 'supabase-edge',
    defaultModel: 'supabase-edge',
    fallbackProviders: ['gemini', 'openai'],
  })

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

  if (supabaseUrl && anonKey) {
    service.registerProvider(
      'supabase-edge',
      new SupabaseEdgeProvider({ supabaseUrl, anonKey })
    )
  }

  const geminiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  if (geminiKey) {
    service.registerProvider(
      'gemini',
      new GeminiProvider({ apiKey: geminiKey })
    )
  }

  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  if (openaiKey) {
    service.registerProvider(
      'openai',
      new OpenAIProvider({ apiKey: openaiKey })
    )
  }

  globalAIService = service
  return service
}

export function getAIService(): AIService {
  if (!globalAIService) {
    return initAIService()
  }
  return globalAIService
}
