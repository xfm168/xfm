import type {
  AIMessage,
  AIRequestOptions,
  AIResponse,
  AIProvider,
  AIProviderType,
  AIModel,
} from '../types'
import { AIError } from '../types'

/** Default timeout for AI requests (60 seconds) */
const DEFAULT_TIMEOUT_MS = 60000

/** Default retry count */
const DEFAULT_RETRY_COUNT = 2

/** Default retry delay (exponential backoff base) */
const DEFAULT_RETRY_DELAY_MS = 2000

export abstract class BaseAIProvider implements AIProvider {
  abstract type: AIProviderType
  abstract name: string

  abstract chat(
    messages: AIMessage[],
    options?: AIRequestOptions
  ): Promise<AIResponse>

  abstract supportsModel(model: AIModel): boolean

  protected buildPrompt(messages: AIMessage[]): string {
    return messages
      .map((m) => `[${m.role.toUpperCase()}]\n${m.content}`)
      .join('\n\n')
  }

  /**
   * Execute request with timeout and retry
   * Unified mechanism for all providers
   */
  protected async withTimeoutAndRetry<T>(
    fn: (signal: AbortSignal) => Promise<T>,
    options: AIRequestOptions = {}
  ): Promise<T> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const retryCount = options.retryCount ?? DEFAULT_RETRY_COUNT
    const delayMs = DEFAULT_RETRY_DELAY_MS

    let lastError: unknown

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      try {
        const result = await fn(controller.signal)
        clearTimeout(timeoutId)
        return result
      } catch (err) {
        clearTimeout(timeoutId)
        lastError = err

        // Don't retry on timeout or rate limit
        if (err instanceof AIError) {
          if (err.code === 'TIMEOUT' || err.code === 'RATE_LIMIT') {
            throw err
          }
        }

        if (attempt < retryCount) {
          await this.sleep(delayMs * Math.pow(2, attempt))
        }
      }
    }

    throw lastError
  }

  /**
   * Legacy retry method (for backward compatibility)
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    retryCount: number = DEFAULT_RETRY_COUNT,
    delayMs: number = DEFAULT_RETRY_DELAY_MS
  ): Promise<T> {
    let lastError: unknown

    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err
        if (attempt < retryCount) {
          await this.sleep(delayMs * Math.pow(2, attempt))
        }
      }
    }

    throw lastError
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  protected assertMessages(messages: AIMessage[]): void {
    if (!messages || messages.length === 0) {
      throw new AIError(
        'Messages cannot be empty',
        'INVALID_INPUT',
        this.type
      )
    }
  }

  /**
   * Handle fetch error uniformly
   */
  protected handleFetchError(err: unknown): AIError {
    if (err instanceof AIError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      return AIError.Timeout(this.type, err)
    }
    return AIError.ProviderUnavailable(this.type, err)
  }
}
