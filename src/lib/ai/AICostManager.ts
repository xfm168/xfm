/**
 * H2.1 Enterprise: AI 成本管理器
 * 
 * 统计每日/每月/Provider/Model 的 Token 和成本。
 * 支持预算预警和停止阈值。
 */

export interface CostRecord {
  provider: string
  model: string
  tokens: number
  cost: number
  timestamp: number
  traceId: string
}

export interface BudgetConfig {
  dailyBudget?: number      // USD
  monthlyBudget?: number    // USD
  stopThreshold?: number    // 达到预算的百分比时停止 (0-1)
  warnThreshold?: number     // 达到预算的百分比时警告 (0-1)
}

export interface CostSnapshot {
  totalCost: number
  totalTokens: number
  dailyCost: number
  dailyTokens: number
  monthlyCost: number
  monthlyTokens: number
  byProvider: Record<string, { cost: number; tokens: number }>
  byModel: Record<string, { cost: number; tokens: number }>
  budgetWarning: boolean
  budgetExceeded: boolean
}

export class AICostManager {
  private records: CostRecord[] = []
  private budget: BudgetConfig

  constructor(budget?: BudgetConfig) {
    this.budget = {
      warnThreshold: budget?.warnThreshold ?? 0.8,
      stopThreshold: budget?.stopThreshold ?? 1.0,
      ...budget,
    }
  }

  record(params: CostRecord): void {
    this.records.push(params)
  }

  getSnapshot(): CostSnapshot {
    const now = Date.now()
    const dayMs = 24 * 60 * 60 * 1000
    const todayStart = now - (now % dayMs)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()

    const daily = this.records.filter(r => r.timestamp >= todayStart)
    const monthly = this.records.filter(r => r.timestamp >= monthStart)

    const totalCost = this.records.reduce((s, r) => s + r.cost, 0)
    const totalTokens = this.records.reduce((s, r) => s + r.tokens, 0)
    const dailyCost = daily.reduce((s, r) => s + r.cost, 0)
    const monthlyCost = monthly.reduce((s, r) => s + r.cost, 0)

    const byProvider: Record<string, { cost: number; tokens: number }> = {}
    const byModel: Record<string, { cost: number; tokens: number }> = {}
    for (const r of this.records) {
      if (!byProvider[r.provider]) byProvider[r.provider] = { cost: 0, tokens: 0 }
      byProvider[r.provider].cost += r.cost
      byProvider[r.provider].tokens += r.tokens
      if (!byModel[r.model]) byModel[r.model] = { cost: 0, tokens: 0 }
      byModel[r.model].cost += r.cost
      byModel[r.model].tokens += r.tokens
    }

    const budgetWarning = this.budget.monthlyBudget
      ? monthlyCost >= this.budget.monthlyBudget * this.budget.warnThreshold!
      : false
    const budgetExceeded = this.budget.monthlyBudget
      ? monthlyCost >= this.budget.monthlyBudget * this.budget.stopThreshold!
      : false

    return {
      totalCost, totalTokens,
      dailyCost, dailyTokens: daily.reduce((s, r) => s + r.tokens, 0),
      monthlyCost, monthlyTokens: monthly.reduce((s, r) => s + r.tokens, 0),
      byProvider, byModel,
      budgetWarning, budgetExceeded,
    }
  }

  /** 检查是否应该停止请求（预算超限） */
  shouldStop(): boolean {
    const snap = this.getSnapshot()
    return snap.budgetExceeded
  }

  reset(): void {
    this.records = []
  }

  setBudget(config: Partial<BudgetConfig>): void {
    this.budget = { ...this.budget, ...config }
  }
}