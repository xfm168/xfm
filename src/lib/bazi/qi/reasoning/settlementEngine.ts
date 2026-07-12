/**
 * 结算引擎模块
 *
 * 提供命局推演的结算流水线（Pipeline）能力。
 * 将命局推演过程拆分为多个有序步骤（如格局结算、旺衰结算、用神结算等），
 * 按顺序逐步执行，每步记录耗时与变更，最终输出完整的结算结果。
 *
 * 使用 `any` 类型作为 ctx 与 competitionResult 参数类型，
 * 以避免与其他模块之间的循环引用。
 */

// ═══════════════════════════════════════════════════════════════
// 接口定义
// ═══════════════════════════════════════════════════════════════

/**
 * 结算步骤
 *
 * 每个步骤代表流水线中的一个结算阶段，包含处理函数与元信息。
 *
 * @example
 * {
 *   id: 'structure-settle',
 *   name: '格局结算',
 *   order: 1,
 *   phase: 'AfterStructure',
 *   handler: (ctx, result) => { ... },
 *   enabled: true,
 *   description: '根据竞争结果确定命局格局'
 * }
 */
export interface SettlementStep {
  /** 步骤唯一ID */
  id: string
  /** 步骤名称 */
  name: string
  /** 步骤序号（决定执行顺序） */
  order: number
  /** 所属阶段 */
  phase: string
  /** 处理函数，接收上下文与当前结算结果，返回变更描述或任意数据 */
  handler: (ctx: any, result: any) => any
  /** 是否启用 */
  enabled: boolean
  /** 步骤描述 */
  description: string
}

/**
 * 结算流水线
 *
 * 将多个结算步骤按序组合为一条可执行的流水线。
 *
 * @example
 * {
 *   id: 'default-pipeline',
 *   name: '默认结算流水线',
 *   steps: [step1, step2, step3, ...]
 * }
 */
export interface SettlementPipeline {
  /** 流水线唯一ID */
  id: string
  /** 流水线名称 */
  name: string
  /** 包含的步骤列表（已按 order 排序） */
  steps: SettlementStep[]
}

/**
 * 单步结算结果
 *
 * 记录一个步骤执行后的结果信息。
 */
export interface StepResult {
  /** 步骤ID */
  stepId: string
  /** 步骤名称 */
  stepName: string
  /** 执行耗时（毫秒） */
  duration: number
  /** 该步骤产生的变更描述列表 */
  changes: string[]
}

/**
 * 流水线结算结果
 *
 * 包含整条流水线的执行状态、各步结果与错误信息。
 *
 * @example
 * {
 *   success: true,
 *   stepResults: [
 *     { stepId: 'structure', stepName: '格局结算', duration: 12, changes: ['格局确定为正官格'] },
 *     { stepId: 'strength', stepName: '旺衰结算', duration: 8, changes: ['日主偏旺'] },
 *     ...
 *   ],
 *   errors: [],
 *   timestamp: 1719600000000
 * }
 */
export interface SettlementResult {
  /** 整体是否成功 */
  success: boolean
  /** 各步骤的执行结果 */
  stepResults: StepResult[]
  /** 错误列表 */
  errors: string[]
  /** 结算完成时间戳 */
  timestamp: number
}

// ═══════════════════════════════════════════════════════════════
// SettlementEngine 实现
// ═══════════════════════════════════════════════════════════════

/**
 * 结算引擎
 *
 * 管理结算步骤的注册、流水线的创建与执行。
 * 内置默认的6步结算流水线：格局 -> 旺衰 -> 用神 -> 病态 -> 药方 -> 最终确认。
 */
export class SettlementEngine {
  /** 所有已注册的步骤（按 order 排序） */
  private steps: Map<string, SettlementStep> = new Map()
  /** 所有已创建的流水线 */
  private pipelines: Map<string, SettlementPipeline> = new Map()

  constructor() {
    this._registerDefaultSteps()
  }

  /**
   * 注册单个结算步骤
   *
   * @param step - 要注册的步骤对象
   */
  registerStep(step: SettlementStep): void {
    if (this.steps.has(step.id)) {
      console.warn(`[SettlementEngine] 步骤 "${step.id}" 已存在，将被覆盖`)
    }
    this.steps.set(step.id, step)
  }

  /**
   * 创建一条结算流水线
   *
   * 根据给定的步骤ID列表，按 order 升序排列组合为流水线。
   *
   * @param name - 流水线名称
   * @param stepIds - 步骤ID列表
   * @returns 创建的流水线对象
   * @throws 如果某个 stepId 未注册，将跳过并打印警告
   */
  createPipeline(name: string, stepIds: string[]): SettlementPipeline {
    const id = `pipeline-${name}-${Date.now()}`
    const pipelineSteps: SettlementStep[] = []

    for (const stepId of stepIds) {
      const step = this.steps.get(stepId)
      if (!step) {
        console.warn(`[SettlementEngine] 步骤 "${stepId}" 未注册，已跳过`)
        continue
      }
      if (step.enabled) {
        pipelineSteps.push(step)
      }
    }

    // 按 order 升序排列
    pipelineSteps.sort((a, b) => a.order - b.order)

    const pipeline: SettlementPipeline = { id, name, steps: pipelineSteps }
    this.pipelines.set(id, pipeline)
    return pipeline
  }

  /**
   * 执行指定流水线
   *
   * 按步骤顺序逐一执行流水线中所有已启用步骤，记录每步耗时与变更。
   *
   * @param pipelineId - 流水线唯一ID
   * @param ctx - 推演上下文（使用 any 避免循环引用）
   * @param competitionResult - 竞争结算结果（使用 any 避免循环引用）
   * @returns 完整的结算结果对象
   */
  executePipeline(pipelineId: string, ctx: any, competitionResult: any): SettlementResult {
    const pipeline = this.pipelines.get(pipelineId)
    if (!pipeline) {
      return {
        success: false,
        stepResults: [],
        errors: [`流水线 "${pipelineId}" 不存在`],
        timestamp: Date.now(),
      }
    }

    const stepResults: StepResult[] = []
    const errors: string[] = []
    let cumulativeResult: any = competitionResult

    for (const step of pipeline.steps) {
      if (!step.enabled) continue

      const startTime = Date.now()
      try {
        const stepOutput = step.handler(ctx, cumulativeResult)
        const duration = Date.now() - startTime

        // 收集变更描述
        const changes: string[] = []
        if (Array.isArray(stepOutput)) {
          changes.push(...stepOutput.map(String))
        } else if (typeof stepOutput === 'object' && stepOutput !== null && stepOutput.changes) {
          changes.push(...stepOutput.changes)
        } else if (stepOutput !== undefined && stepOutput !== null) {
          changes.push(String(stepOutput))
        }

        stepResults.push({
          stepId: step.id,
          stepName: step.name,
          duration,
          changes,
        })

        // 将输出传递给下一步
        cumulativeResult = stepOutput
      } catch (err) {
        const duration = Date.now() - startTime
        const errorMsg = err instanceof Error ? err.message : String(err)
        errors.push(`步骤 "${step.name}" (${step.id}) 执行失败: ${errorMsg}`)
        stepResults.push({
          stepId: step.id,
          stepName: step.name,
          duration,
          changes: [],
        })
      }
    }

    return {
      success: errors.length === 0,
      stepResults,
      errors,
      timestamp: Date.now(),
    }
  }

  /**
   * 列出所有已创建的流水线
   *
   * @returns 流水线列表
   */
  listPipelines(): SettlementPipeline[] {
    return Array.from(this.pipelines.values())
  }

  /**
   * 在指定步骤之前插入新步骤
   *
   * @param beforeStepId - 目标步骤ID（新步骤将插入到此步骤之前）
   * @param step - 要插入的步骤对象
   */
  insertStepBefore(beforeStepId: string, step: SettlementStep): void {
    const targetStep = this.steps.get(beforeStepId)
    if (!targetStep) {
      console.warn(`[SettlementEngine] 目标步骤 "${beforeStepId}" 不存在，新步骤将以给定 order 注册`)
      this.registerStep(step)
      return
    }

    // 调整 order，让新步骤排在目标步骤之前
    step.order = targetStep.order - 0.5
    this.registerStep(step)
  }

  /**
   * 在指定步骤之后插入新步骤
   *
   * @param afterStepId - 目标步骤ID（新步骤将插入到此步骤之后）
   * @param step - 要插入的步骤对象
   */
  insertStepAfter(afterStepId: string, step: SettlementStep): void {
    const targetStep = this.steps.get(afterStepId)
    if (!targetStep) {
      console.warn(`[SettlementEngine] 目标步骤 "${afterStepId}" 不存在，新步骤将以给定 order 注册`)
      this.registerStep(step)
      return
    }

    // 调整 order，让新步骤排在目标步骤之后
    step.order = targetStep.order + 0.5
    this.registerStep(step)
  }

  /**
   * 移除指定步骤
   *
   * @param stepId - 要移除的步骤ID
   */
  removeStep(stepId: string): void {
    if (!this.steps.has(stepId)) {
      console.warn(`[SettlementEngine] 步骤 "${stepId}" 不存在，无法移除`)
      return
    }
    this.steps.delete(stepId)
  }

  /**
   * 注册默认的6个结算步骤
   * @private
   */
  private _registerDefaultSteps(): void {
    this.registerStep({
      id: 'settle-structure',
      name: '格局结算',
      order: 1,
      phase: 'AfterStructure',
      handler: (_ctx, _result) => {
        // 实际逻辑在外部注入
        return { changes: ['格局结算完成'] }
      },
      enabled: true,
      description: '根据竞争结果确定命局格局（正官格、偏官格、食神格等）',
    })

    this.registerStep({
      id: 'settle-strength',
      name: '旺衰结算',
      order: 2,
      phase: 'AfterStrength',
      handler: (_ctx, _result) => {
        return { changes: ['旺衰结算完成'] }
      },
      enabled: true,
      description: '综合月令、得令、根气等因素计算日主旺衰',
    })

    this.registerStep({
      id: 'settle-yongshen',
      name: '用神结算',
      order: 3,
      phase: 'AfterYongShen',
      handler: (_ctx, _result) => {
        return { changes: ['用神结算完成'] }
      },
      enabled: true,
      description: '根据格局与旺衰确定用神、喜神、忌神',
    })

    this.registerStep({
      id: 'settle-disease',
      name: '病态结算',
      order: 4,
      phase: 'AfterDisease',
      handler: (_ctx, _result) => {
        return { changes: ['病态结算完成'] }
      },
      enabled: true,
      description: '检测命局中的病态（如用神受克、喜神无力等）',
    })

    this.registerStep({
      id: 'settle-medicine',
      name: '药方结算',
      order: 5,
      phase: 'AfterMedicine',
      handler: (_ctx, _result) => {
        return { changes: ['药方结算完成'] }
      },
      enabled: true,
      description: '为命局病态配制药方（五行补救方向）',
    })

    this.registerStep({
      id: 'settle-finalize',
      name: '最终确认',
      order: 6,
      phase: 'Final',
      handler: (_ctx, _result) => {
        return { changes: ['最终确认完成'] }
      },
      enabled: true,
      description: '汇总所有结算结果，确认最终命局状态',
    })
  }
}

/** 结算引擎全局单例 */
export const settlementEngine = new SettlementEngine()
