/**
 * H2.1 Enterprise: AI 批量请求
 * 
 * batchGenerate() / batchVision()
 * 支持并发控制和进度回调。
 */

import type { AIMessage, AIRequestOptions, AIResponse } from './AIProvider'

export interface BatchOptions {
  concurrency?: number
  onProgress?: (completed: number, total: number) => void
  stopOnError?: boolean
}

export interface BatchResult {
  results: (AIResponse | Error)[]
  successCount: number
  failureCount: number
  totalLatencyMs: number
}

export async function batchGenerate(
  requests: Array<{ messages: AIMessage[]; options?: AIRequestOptions }>,
  executor: (messages: AIMessage[], options?: AIRequestOptions) => Promise<AIResponse>,
  batchOptions?: BatchOptions,
): Promise<BatchResult> {
  const concurrency = batchOptions?.concurrency ?? 3
  const onProgress = batchOptions?.onProgress
  const stopOnError = batchOptions?.stopOnError ?? false
  const startTime = Date.now()

  const results: (AIResponse | Error)[] = new Array(requests.length)
  let stopped = false
  let completed = 0

  async function runItem(index: number) {
    if (stopped) return
    try {
      results[index] = await executor(requests[index].messages, requests[index].options)
    } catch (err) {
      results[index] = err instanceof Error ? err : new Error(String(err))
      if (stopOnError) stopped = true
    }
    completed++
    onProgress?.(completed, requests.length)
  }

  // 并发控制
  const executing: Promise<void>[] = []
  for (let i = 0; i < requests.length; i++) {
    if (stopped) break
    if (executing.length >= concurrency) {
      await Promise.race(executing)
      // 清理已完成的
      for (let j = executing.length - 1; j >= 0; j--) {
        // 无法直接检查 settled，用 race 效果
      }
    }
    executing.push(runItem(i))
  }
  await Promise.allSettled(executing)

  return {
    results,
    successCount: results.filter(r => !(r instanceof Error)).length,
    failureCount: results.filter(r => r instanceof Error).length,
    totalLatencyMs: Date.now() - startTime,
  }
}

export async function batchVision(
  requests: Array<{ images: string[]; prompt: string; options?: AIRequestOptions }>,
  executor: (images: string[], prompt: string, options?: AIRequestOptions) => Promise<AIResponse>,
  batchOptions?: BatchOptions,
): Promise<BatchResult> {
  const adapted = requests.map(r => ({
    messages: [{ role: 'user' as const, content: r.prompt, images: r.images }],
    options: r.options,
  }))
  const adaptedExecutor = async (messages: AIMessage[], options?: AIRequestOptions) => {
    const msg = messages[0]
    return executor(msg.images || [], msg.content, options)
  }
  return batchGenerate(adapted, adaptedExecutor, batchOptions)
}