/**
 * H2.1: AI Token 计数器
 * 
 * 统计 Prompt/Completion/Total Tokens 和估算成本。
 */

export interface TokenUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface ModelCost {
  inputPerMillion: number   // USD per million input tokens
  outputPerMillion: number  // USD per million output tokens
}

/** 参考价格（USD per 1M tokens） */
const MODEL_COSTS: Record<string, ModelCost> = {
  'gemini-2.0-flash': { inputPerMillion: 0.075, outputPerMillion: 0.3 },
  'gemini-2.0-pro': { inputPerMillion: 1.25, outputPerMillion: 5 },
  'gpt-4o': { inputPerMillion: 2.5, outputPerMillion: 10 },
  'gpt-4o-mini': { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  'claude-3.5-sonnet': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-3-opus': { inputPerMillion: 15, outputPerMillion: 75 },
  'deepseek-v3': { inputPerMillion: 0.14, outputPerMillion: 0.28 },
  'deepseek-r1': { inputPerMillion: 0.55, outputPerMillion: 2.19 },
  'qwen-max': { inputPerMillion: 1.6, outputPerMillion: 4.8 },
  'qwen-plus': { inputPerMillion: 0.8, outputPerMillion: 2.4 },
}

export class AITokenCounter {
  private records: Array<{
    model: string
    usage: TokenUsage
    cost: number
    timestamp: number
  }> = []

  record(model: string, usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number }): void {
    const u: TokenUsage = {
      promptTokens: usage?.promptTokens ?? 0,
      completionTokens: usage?.completionTokens ?? 0,
      totalTokens: usage?.totalTokens ?? (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0),
    }
    const cost = this.estimateCost(model, u)
    this.records.push({ model, usage: u, cost, timestamp: Date.now() })
  }

  estimateCost(model: string, usage: TokenUsage): number {
    const pricing = MODEL_COSTS[model] || { inputPerMillion: 1, outputPerMillion: 2 }
    const inputCost = (usage.promptTokens / 1_000_000) * pricing.inputPerMillion
    const outputCost = (usage.completionTokens / 1_000_000) * pricing.outputPerMillion
    return inputCost + outputCost
  }

  getTotalTokens(): number {
    return this.records.reduce((s, r) => s + r.usage.totalTokens, 0)
  }

  getTotalCost(): number {
    return this.records.reduce((s, r) => s + r.cost, 0)
  }

  getAverageTokens(): number {
    if (this.records.length === 0) return 0
    return this.getTotalTokens() / this.records.length
  }

  getByModel(model: string): { tokens: number; cost: number; count: number } {
    const filtered = this.records.filter(r => r.model === model)
    return {
      tokens: filtered.reduce((s, r) => s + r.usage.totalTokens, 0),
      cost: filtered.reduce((s, r) => s + r.cost, 0),
      count: filtered.length,
    }
  }

  reset(): void {
    this.records = []
  }

  getSummary() {
    return {
      totalTokens: this.getTotalTokens(),
      totalCost: this.getTotalCost(),
      avgTokens: this.getAverageTokens(),
      requestCount: this.records.length,
    }
  }
}