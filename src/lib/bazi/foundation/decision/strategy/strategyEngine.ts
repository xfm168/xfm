/**
 * P0-5 Part 6: Strategy Engine — 决策策略引擎
 *
 * 玄风门决策路径选择器：
 *   Fusion 只负责加权融合，Strategy 负责选择"走哪条路"
 *
 * 七条决策路径：
 *   1. fuyi_priority   — 扶抑优先（身旺/身弱明显时）
 *   2. tiaohou_priority — 调候优先（冬生/夏生时）
 *   3. bingyao_priority — 病药优先（有病需药时）
 *   4. geju_priority    — 格局优先（格局明确时）
 *   5. congge_priority  — 从格优先（从强/从弱时）
 *   6. balance_priority — 均衡优先（中和时）
 *   7. auto             — 自动（综合上面所有，选最优）
 *
 * 六层架构：Core → Knowledge → Engine → Decision → Quality → AI → Application
 */

// ============================================================
// 类型定义
// ============================================================

/** 决策策略类型 */
export type DecisionStrategyType =
  | 'fuyi_priority'
  | 'tiaohou_priority'
  | 'bingyao_priority'
  | 'geju_priority'
  | 'congge_priority'
  | 'balance_priority'
  | 'auto'

/** 七大引擎权重键（与 SchoolProfile.engineWeights 对齐） */
export type EngineWeightKey =
  | 'strength'
  | 'pattern'
  | 'climate'
  | 'balance'
  | 'medicine'
  | 'bridge'
  | 'season'

/** 触发器定义：当 pattern 满足 check 时触发该策略 */
export interface StrategyTrigger {
  pattern: string
  check: (input: any) => boolean
}

/**
 * 决策策略定义
 *
 * 每条策略描述：
 *   - 什么条件下触发（triggers）
 *   - 触发后各引擎的权重倍率（engineWeights）
 *   - 是否允许多用神 / 最多几个用神
 */
export interface DecisionStrategy {
  /** 策略类型 */
  type: DecisionStrategyType
  /** 优先级（数字越大越优先，用于同分时的 tie-break） */
  priority: number
  /** 触发条件列表（任一触发即生效，多个触发累加分数） */
  triggers: StrategyTrigger[]
  /** 七大引擎权重倍率（1.0 = 基准，>1 = 加强，<1 = 削弱） */
  engineWeights: Record<EngineWeightKey, number>
  /** 最多允许几个用神 */
  maxYongShenCount: number
  /** 是否允许多用神 */
  allowMultiYongShen: boolean
  /** 策略描述（中文，UI 可读） */
  description: string
}

/**
 * 单条策略的评估结果
 */
export interface StrategyEvaluation {
  /** 策略类型 */
  strategy: DecisionStrategyType
  /** 综合得分（越高越优） */
  score: number
  /** 触发原因列表（命中了哪些 trigger） */
  triggerReasons: string[]
  /** 推荐的引擎权重（经过策略倍率调整后的最终权重） */
  recommendedEngineWeights: Record<EngineWeightKey, number>
  /** 是否允许多用神 */
  multiYongShen: boolean
  /** 最多允许几个用神 */
  maxYongShenCount: number
}

// ============================================================
// 七大引擎基准权重（归一化前的默认基准）
// ============================================================

const BASE_ENGINE_WEIGHTS: Record<EngineWeightKey, number> = {
  strength: 1.0,
  pattern: 1.0,
  climate: 1.0,
  balance: 1.0,
  medicine: 1.0,
  bridge: 1.0,
  season: 1.0,
}

// ============================================================
// StrategyEngine 类
// ============================================================

/**
 * 决策策略引擎
 *
 * 职责：
 *   1. 注册/管理多条 DecisionStrategy
 *   2. 给定命局输入（dayStrength / monthZhi / isWinterBorn / ...）
 *      评估每条策略的得分，排序后返回
 *   3. 选出最优策略，供 Fusion 层使用
 *
 * 与 Fusion 的关系：
 *   Strategy 选路径（权重倍率），Fusion 用权重做融合。
 *   Strategy 不计算最终用神，只告诉 Fusion 应该"相信谁多一点"。
 */
export class StrategyEngine {
  /** 已注册的策略表：type → DecisionStrategy */
  private strategies = new Map<DecisionStrategyType, DecisionStrategy>()

  constructor() {
    this.registerDefaultStrategies()
  }

  // ---------- 注册 ----------

  /**
   * 注册一条策略
   * 已存在同 type 则覆盖
   */
  registerStrategy(strategy: DecisionStrategy): void {
    this.strategies.set(strategy.type, strategy)
  }

  /**
   * 批量注册预设的 7 条策略
   */
  private registerDefaultStrategies(): void {
    this.registerStrategy({
      type: 'fuyi_priority',
      priority: 70,
      description: '扶抑优先：身旺或身弱明显时，以平衡五行为核心',
      triggers: [
        {
          pattern: '身旺身弱明显 (|dayStrength| ≥ 2)',
          check: (input: any) => typeof input?.dayStrength === 'number' && Math.abs(input.dayStrength) >= 2,
        },
      ],
      engineWeights: {
        ...BASE_ENGINE_WEIGHTS,
        balance: 1.2,
        strength: 1.1,
      },
      maxYongShenCount: 1,
      allowMultiYongShen: false,
    })

    this.registerStrategy({
      type: 'tiaohou_priority',
      priority: 90,
      description: '调候优先：冬生/夏生命局，寒暖燥湿为第一要义',
      triggers: [
        {
          pattern: '冬生（亥子丑月）或夏生（巳午未月）',
          check: (input: any) => !!input?.isWinterBorn || !!input?.isSummerBorn,
        },
        {
          pattern: '月令为寒（亥子丑）或暖（巳午未）',
          check: (input: any) => {
            const z = input?.monthZhi
            return typeof z === 'string' && ['亥', '子', '丑', '巳', '午', '未'].includes(z)
          },
        },
      ],
      engineWeights: {
        ...BASE_ENGINE_WEIGHTS,
        season: 1.4,
        climate: 1.3,
      },
      maxYongShenCount: 2,
      allowMultiYongShen: true,
    })

    this.registerStrategy({
      type: 'bingyao_priority',
      priority: 80,
      description: '病药优先：命局有病，先用药去病',
      triggers: [
        {
          pattern: 'medicineSignal = true（病药信号）',
          check: (input: any) => input?.medicineSignal === true,
        },
        {
          pattern: '存在明显忌神（某五行过旺/过衰 ≥ 2 个标准差）',
          check: (input: any) => {
            if (input?.wuxingStd) return input.wuxingStd >= 2
            if (input?.hasExtremeWuxing) return true
            return false
          },
        },
        {
          pattern: '两神交战（金木/水火力量相当且冲突）',
          check: (input: any) => !!input?.hasWarringWuxing || !!input?.bridgeSignal,
        },
      ],
      engineWeights: {
        ...BASE_ENGINE_WEIGHTS,
        medicine: 1.5,
        bridge: 1.2,
      },
      maxYongShenCount: 2,
      allowMultiYongShen: true,
    })

    this.registerStrategy({
      type: 'geju_priority',
      priority: 85,
      description: '格局优先：格局明确时，以格局喜用为准',
      triggers: [
        {
          pattern: 'patternStrong = true（格局强烈信号）',
          check: (input: any) => input?.patternStrong === true,
        },
        {
          pattern: '已标注格局标签（patternLabel 存在）',
          check: (input: any) => !!input?.patternLabel && typeof input.patternLabel === 'string' && input.patternLabel.length > 0,
        },
        {
          pattern: '格局置信度 ≥ 0.7',
          check: (input: any) => typeof input?.patternConfidence === 'number' && input.patternConfidence >= 0.7,
        },
      ],
      engineWeights: {
        ...BASE_ENGINE_WEIGHTS,
        pattern: 1.3,
      },
      maxYongShenCount: 1,
      allowMultiYongShen: false,
    })

    this.registerStrategy({
      type: 'congge_priority',
      priority: 95,
      description: '从格优先：从强/从弱格，顺其气势不可逆',
      triggers: [
        {
          pattern: '从格信号 + 极端强弱（|dayStrength| ≥ 3）',
          check: (input: any) =>
            typeof input?.dayStrength === 'number' &&
            Math.abs(input.dayStrength) >= 3 &&
            input?.conggeSignal === true,
        },
        {
          pattern: 'conggeLabel 存在（明确的从格类型）',
          check: (input: any) => !!input?.conggeLabel && typeof input.conggeLabel === 'string' && input.conggeLabel.length > 0,
        },
      ],
      engineWeights: {
        ...BASE_ENGINE_WEIGHTS,
        pattern: 1.6,
        balance: 0.3,
      },
      maxYongShenCount: 1,
      allowMultiYongShen: false,
    })

    this.registerStrategy({
      type: 'balance_priority',
      priority: 60,
      description: '均衡优先：命局中和，取各方面综合平衡',
      triggers: [
        {
          pattern: '中和（-1 ≤ dayStrength ≤ 1）',
          check: (input: any) =>
            typeof input?.dayStrength === 'number' &&
            input.dayStrength >= -1 &&
            input.dayStrength <= 1,
        },
        {
          pattern: '五行标准差小（≤ 0.5），无明显偏颇',
          check: (input: any) => typeof input?.wuxingStd === 'number' && input.wuxingStd <= 0.5,
        },
      ],
      engineWeights: {
        ...BASE_ENGINE_WEIGHTS,
        balance: 1.1,
        strength: 1.0,
        pattern: 1.0,
        climate: 1.0,
        medicine: 1.0,
        bridge: 1.0,
        season: 1.0,
      },
      maxYongShenCount: 1,
      allowMultiYongShen: false,
    })

    this.registerStrategy({
      type: 'auto',
      priority: 50,
      description: '自动模式：综合所有策略，取最优者加权融合',
      triggers: [
        {
          pattern: 'always（默认兜底策略）',
          check: () => true,
        },
      ],
      engineWeights: {
        ...BASE_ENGINE_WEIGHTS,
      },
      maxYongShenCount: 2,
      allowMultiYongShen: true,
    })
  }

  // ---------- 评估 ----------

  /**
   * 评估所有策略，按得分降序返回
   *
   * @param input 命局输入，至少包含：dayStrength, monthZhi, isWinterBorn, isSummerBorn 等
   */
  evaluateStrategies(input: any): StrategyEvaluation[] {
    const allWeights: Record<EngineWeightKey, number> = { ...BASE_ENGINE_WEIGHTS }

    // 先对所有非 auto 策略打分
    const nonAutoEvals: Array<{ type: DecisionStrategyType; score: number; reasons: string[] }> = []

    for (const strategy of this.strategies.values()) {
      if (strategy.type === 'auto') continue

      const evalResult = this.evaluateSingle(strategy, input)
      nonAutoEvals.push({
        type: strategy.type,
        score: evalResult.score,
        reasons: evalResult.reasons,
      })
    }

    // 排序（score 降序 → priority 降序）
    nonAutoEvals.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const pa = this.strategies.get(a.type)?.priority ?? 0
      const pb = this.strategies.get(b.type)?.priority ?? 0
      return pb - pa
    })

    // 构造最终结果数组
    const results: StrategyEvaluation[] = []

    // 先放非 auto 策略
    for (const item of nonAutoEvals) {
      const strategy = this.strategies.get(item.type)!
      results.push({
        strategy: item.type,
        score: item.score,
        triggerReasons: item.reasons,
        recommendedEngineWeights: this.applyWeights(allWeights, strategy.engineWeights),
        multiYongShen: strategy.allowMultiYongShen,
        maxYongShenCount: strategy.maxYongShenCount,
      })
    }

    // 最后放 auto：auto 的推荐权重 = top3 策略的加权平均
    const autoStrategy = this.strategies.get('auto')!
    const top3 = nonAutoEvals.slice(0, 3)
    const autoWeights = this.computeAutoWeights(top3)
    results.push({
      strategy: 'auto',
      score: Math.max(0, top3[0]?.score ?? 0 - 5),
      triggerReasons: ['兜底策略：综合以上最优策略做加权融合'],
      recommendedEngineWeights: autoWeights,
      multiYongShen: autoStrategy.allowMultiYongShen,
      maxYongShenCount: autoStrategy.maxYongShenCount,
    })

    return results
  }

  /**
   * 选出最优策略（evaluateStrategies 的第一个）
   */
  selectBest(input: any): StrategyEvaluation {
    const evaluated = this.evaluateStrategies(input)
    return evaluated[0]
  }

  // ---------- 单策略内部评估 ----------

  private evaluateSingle(
    strategy: DecisionStrategy,
    input: any
  ): { score: number; reasons: string[] } {
    let score = 0
    const reasons: string[] = []

    for (const trigger of strategy.triggers) {
      try {
        if (trigger.check(input)) {
          score += 50
          reasons.push(trigger.pattern)
        }
      } catch (_e) {
        // 单个 trigger 报错不影响整体
      }
    }

    // 加上策略自身 priority / 10 的底分
    score += strategy.priority / 10

    return { score, reasons }
  }

  private applyWeights(
    base: Record<EngineWeightKey, number>,
    multipliers: Record<EngineWeightKey, number>
  ): Record<EngineWeightKey, number> {
    const result = { ...base }
    for (const key of Object.keys(result) as EngineWeightKey[]) {
      result[key] = base[key] * (multipliers[key] ?? 1.0)
    }
    return result
  }

  /**
   * auto 策略的推荐权重 = 前 N 个策略的 engineWeights 按得分加权平均
   */
  private computeAutoWeights(
    topEvals: Array<{ type: DecisionStrategyType; score: number }>
  ): Record<EngineWeightKey, number> {
    if (topEvals.length === 0) return { ...BASE_ENGINE_WEIGHTS }

    const totalScore = topEvals.reduce((s, e) => s + Math.max(1, e.score), 0)
    const result: Record<EngineWeightKey, number> = {
      strength: 0, pattern: 0, climate: 0, balance: 0,
      medicine: 0, bridge: 0, season: 0,
    }

    for (const ev of topEvals) {
      const strategy = this.strategies.get(ev.type)
      if (!strategy) continue
      const w = Math.max(1, ev.score) / totalScore
      for (const key of Object.keys(result) as EngineWeightKey[]) {
        result[key] += (strategy.engineWeights[key] ?? 1.0) * w
      }
    }

    return result
  }

  // ---------- 查询 / 管理 ----------

  /** 按类型获取策略 */
  getStrategy(type: DecisionStrategyType): DecisionStrategy | undefined {
    return this.strategies.get(type)
  }

  /** 列出所有策略 */
  listStrategies(): DecisionStrategy[] {
    return Array.from(this.strategies.values()).sort(
      (a, b) => b.priority - a.priority
    )
  }

  /**
   * 覆盖某策略的引擎权重
   * （高级用法：热更新策略参数，无需重新注册整条策略）
   */
  overrideWeights(
    type: DecisionStrategyType,
    weights: Partial<Record<EngineWeightKey, number>>
  ): void {
    const strategy = this.strategies.get(type)
    if (!strategy) return
    strategy.engineWeights = {
      ...strategy.engineWeights,
      ...weights,
    }
  }
}

// ============================================================
// 全局单例
// ============================================================

/**
 * 全局策略引擎单例
 *
 * 使用方式：
 *   import { globalStrategyEngine } from '@/lib/bazi/foundation/decision/strategy'
 *
 *   const best = globalStrategyEngine.selectBest({
 *     dayStrength: 2.5,
 *     monthZhi: '寅',
 *     isWinterBorn: false,
 *     isSummerBorn: false,
 *   })
 */
export const globalStrategyEngine = new StrategyEngine()
