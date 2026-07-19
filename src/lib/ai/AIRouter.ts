/**
 * H2.1 Enterprise: AI Router
 *
 * 按任务类型自动选择最优 Provider。
 * 支持 quality/speed/cost/vision/json/stream 多维评分。
 */

import type { AIProviderType } from './AIProvider'

export type TaskType = 'general' | 'bazi' | 'ziwei' | 'fengshui' | 'face' | 'palm' | 'liuyao' | 'vision' | 'json' | 'stream' | 'longform'

export type RouterStrategy = 'quality' | 'speed' | 'cost' | 'balanced'

export interface RouterRule {
  taskType: TaskType
  providers: AIProviderType[]  // 按优先级排序
  strategy?: RouterStrategy
}

const DEFAULT_RULES: RouterRule[] = [
  { taskType: 'vision', providers: ['gemini'], strategy: 'quality' },
  { taskType: 'json', providers: ['gemini', 'deepseek', 'qwen'], strategy: 'balanced' },
  { taskType: 'stream', providers: ['gemini'], strategy: 'speed' },
  { taskType: 'longform', providers: ['claude', 'gemini'], strategy: 'quality' },
  { taskType: 'bazi', providers: ['gemini', 'deepseek', 'claude'], strategy: 'balanced' },
  { taskType: 'ziwei', providers: ['gemini', 'claude', 'deepseek'], strategy: 'balanced' },
  { taskType: 'fengshui', providers: ['gemini', 'claude'], strategy: 'quality' },
  { taskType: 'face', providers: ['gemini'], strategy: 'quality' },
  { taskType: 'palm', providers: ['gemini'], strategy: 'quality' },
  { taskType: 'liuyao', providers: ['deepseek', 'gemini', 'qwen'], strategy: 'balanced' },
  { taskType: 'general', providers: ['gemini', 'deepseek', 'openai', 'claude', 'qwen'], strategy: 'balanced' },
]

export class AIRouter {
  private rules: Map<TaskType, RouterRule> = new Map()

  constructor() {
    for (const rule of DEFAULT_RULES) {
      this.rules.set(rule.taskType, rule)
    }
  }

  /** 设置自定义规则 */
  setRule(rule: RouterRule): void {
    this.rules.set(rule.taskType, rule)
  }

  /** 移除规则 */
  removeRule(taskType: TaskType): boolean {
    return this.rules.delete(taskType)
  }

  /** 获取最优 Provider */
  route(taskType: TaskType, availableProviders: AIProviderType[], strategy?: RouterStrategy): AIProviderType | undefined {
    if (availableProviders.length === 0) return undefined

    const rule = this.rules.get(taskType)
    const effectiveStrategy = strategy || rule?.strategy || 'balanced'

    // 从规则中找到第一个可用的 provider
    const candidates = rule
      ? rule.providers.filter(p => availableProviders.includes(p))
      : availableProviders

    // 规则匹配不到任何可用 provider → fallback 到所有可用 provider（降级）
    const effective = candidates.length > 0 ? candidates : availableProviders

    if (effective.length === 1) return effective[0]

    // 按策略排序
    return this.selectByStrategy(effective, effectiveStrategy)
  }

  private selectByStrategy(providers: AIProviderType[], strategy: RouterStrategy): AIProviderType {
    const SPEED_RANK: Record<string, number> = {
      gemini: 1, deepseek: 2, qwen: 3, openai: 4, claude: 5, moonshot: 6, doubao: 7,
    }
    const COST_RANK: Record<string, number> = {
      qwen: 1, deepseek: 2, gemini: 3, openai: 4, claude: 5, moonshot: 6, doubao: 7,
    }
    const QUALITY_RANK: Record<string, number> = {
      claude: 1, gemini: 2, openai: 3, deepseek: 4, qwen: 5, moonshot: 6, doubao: 7,
    }

    const rankMap = strategy === 'speed' ? SPEED_RANK
      : strategy === 'cost' ? COST_RANK
      : strategy === 'quality' ? QUALITY_RANK
      : SPEED_RANK // balanced = speed

    return [...providers].sort((a, b) => (rankMap[a] ?? 9) - (rankMap[b] ?? 9))[0]
  }

  /** 列出所有规则 */
  listRules(): RouterRule[] {
    return Array.from(this.rules.values())
  }
}