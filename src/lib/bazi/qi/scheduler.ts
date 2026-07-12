/**
 * RuleScheduler
 * 统一规则调度器
 *
 * 职责：
 * - 按优先级排列所有规则引擎
 * - 每完成一步，刷新 QiNode[]，下一步读取新的 QiNode
 * - 新增规则只需注册，不需要修改 Engine
 */

import type { QiNode, QiOperation, QiModifierName } from './types'

/** 规则处理器接口 */
export interface QiRuleHandler {
  name: QiModifierName
  priority: number             // 数字越小越先执行
  detect: (qiNodes: QiNode[], ctx: any) => QiOperation[]
}

/** 已注册的规则处理器 */
const handlers: QiRuleHandler[] = []

/**
 * 注册规则处理器
 * 优先级排序：冲 > 刑 > 害 > 破 > 三会 > 三合 > 六合 > 半合 > 暗合 > 天干五合
 */
export function registerHandler(handler: QiRuleHandler): void {
  handlers.push(handler)
  handlers.sort((a, b) => a.priority - b.priority)
}

/** 获取已注册的处理器列表（调试用） */
export function getRegisteredHandlers(): QiRuleHandler[] {
  return [...handlers]
}

/**
 * 按优先级依次执行所有规则
 * 返回最终 QiNode[] 和所有操作记录
 */
export function runScheduler(
  qiNodes: QiNode[],
  ctx: any,
  executor: (nodes: QiNode[], ops: QiOperation[], name: QiModifierName) => QiNode[],
): { finalQiNodes: QiNode[]; allOperations: { handler: QiModifierName; ops: QiOperation[] }[] } {
  let currentNodes = qiNodes
  const allOperations: { handler: QiModifierName; ops: QiOperation[] }[] = []

  for (const handler of handlers) {
    const ops = handler.detect(currentNodes, ctx)
    if (ops.length > 0) {
      currentNodes = executor(currentNodes, ops, handler.name)
      allOperations.push({ handler: handler.name, ops })
    }
  }

  return { finalQiNodes: currentNodes, allOperations }
}
