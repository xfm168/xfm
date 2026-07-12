/**
 * QiExecutor V4 — 事务执行器 + EventBus + version
 *
 * - begin/commit/rollback 事务语义
 * - 每次操作记录 version（Time Travel Debug）
 * - 发出事件（EventBus）
 */

import type { QiNode, QiOperation, QiModifierName, QiHistory } from './types'
import { QiEventBus } from './events'

let globalSequence = 0
let globalVersion = 0

export function resetSequence(base: number = 0): void { globalSequence = base }
export function resetVersion(base: number = 0): void { globalVersion = base }
export function setSequence(val: number): void { globalSequence = val }
export function getSequence(): number { return globalSequence }

function nextSeq(): number { return ++globalSequence }
function nextVersion(): number { return ++globalVersion }

function cloneNodes(nodes: QiNode[]): QiNode[] {
  return nodes.map(n => ({ ...n, history: [...n.history] }))
}

export class QiExecutor {
  private baseline: any[] | null = null
  private currentNodes: any[]
  public readonly events: QiEventBus

  constructor(initialNodes: QiNode[]) {
    this.currentNodes = cloneNodes(initialNodes)
    this.events = new QiEventBus()
  }

  begin(): void {
    this.baseline = cloneNodes(this.currentNodes)
  }

  execute(operations: QiOperation[], modifierName: QiModifierName): QiNode[] {
    const ver = nextVersion()
    const nodeMap = new Map<string, number>()
    for (let i = 0; i < this.currentNodes.length; i++) {
      nodeMap.set(this.currentNodes[i].id, i)
    }

    for (const op of operations) {
      const idx = nodeMap.get(op.targetId)
      if (idx === undefined) continue

      const node = this.currentNodes[idx]
      const before = node.strength

      node.strength += op.delta
      if (op.newState !== undefined) node.state = op.newState
      if (op.newActive !== undefined) node.active = op.newActive
      if (op.newElement !== undefined) node.element = op.newElement
      if (op.newRootId !== undefined) node.rootId = op.newRootId

      const history: QiHistory = {
        modifier: modifierName,
        action: op.action,
        before,
        after: node.strength,
        delta: op.delta,
        reason: op.reason,
        sequence: nextSeq(),
        version: ver,
      }
      node.history.push(history)

      // 发出事件
      this.events.emit({
        type: 'qi:changed',
        step: modifierName,
        data: { nodeId: node.id, before, after: node.strength, delta: op.delta },
        version: ver,
      })
    }

    this.events.emitStepCompleted(modifierName, ver, { operationsCount: operations.length })
    return this.currentNodes
  }

  commit(): QiNode[] {
    this.baseline = null
    return this.currentNodes
  }

  rollback(): QiNode[] {
    if (this.baseline) {
      this.currentNodes = cloneNodes(this.baseline)
      this.baseline = null
      this.events.emitRollback('QiExecutor', globalVersion)
    }
    return this.currentNodes
  }

  getNodes(): QiNode[] { return this.currentNodes }
  hasBaseline(): boolean { return this.baseline !== null }
}

/** 函数式快捷接口 */
export function executeOperations(
  qiNodes: QiNode[],
  operations: QiOperation[],
  modifierName: QiModifierName,
): QiNode[] {
  const executor = new QiExecutor(qiNodes)
  executor.begin()
  executor.execute(operations, modifierName)
  return executor.commit()
}
