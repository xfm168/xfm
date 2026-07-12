/**
 * QiPipeline V4 — 流水线驱动器（PipelineContext 模式）
 *
 * Engine 永远不知道有哪些模块。
 * Engine 只负责：for (step of pipeline) { step.run(pCtx) }
 * 所有 Step 共享 QiPipelineContext（executor/snapshots/cache/metadata）
 */

import type { QiNode, QiPipelineContext, PipelineStep, QiSnapshot } from './types'

export class QiPipeline {
  private steps: PipelineStep[] = []

  addStep(step: PipelineStep): QiPipeline {
    this.steps.push(step)
    return this
  }

  getSteps(): PipelineStep[] {
    return [...this.steps]
  }

  /**
   * 执行全部步骤，每步自动生成 snapshot 并校验
   */
  runAll(
    initialNodes: QiNode[],
    pCtx: QiPipelineContext,
    onSnapshot: (stepName: string, qiNodes: QiNode[], prevNodes: QiNode[]) => QiSnapshot,
  ): QiNode[] {
    let current = initialNodes

    for (const step of this.steps) {
      const prev = current
      current = step.run(current, pCtx)

      // 自动生成 snapshot
      const snapshot = onSnapshot(step.name, current, prev)
      pCtx.snapshots.push(snapshot)
    }

    return current
  }
}
