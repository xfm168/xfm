/**
 * QiTransformer — 气流迁移执行器
 *
 * P1 原则：Transformer 只负责执行，所有 Qi 的变化只能发生在 QiTransformer
 *
 * 安全机制：
 * - 同一节点被多个命令扣减时，总扣减上限 = strength - 1
 * - 确保气值永远 >= 1
 * - 安全保护只在 transformAll 的最终阶段执行（全局唯一）
 */

import type {
  QiNode, QiOperation, HeHuaCommand, ConflictCommand, QiState,
} from '../types'

// ─── 安全扣减聚合（全局唯一） ───

interface DeductionItem {
  targetId: string
  amount: number
  reason: string
  ruleId: string
  newState?: QiState
  newActive?: boolean
}

/**
 * 聚合同一节点的所有扣减，确保总扣减不超 strength - 1
 * 这是全局唯一的安全保护点
 */
function safeDeductions(items: DeductionItem[], qiNodes: QiNode[]): QiOperation[] {
  // 按节点汇总
  const nodeMap = new Map<string, { total: number; remaining: number }>()
  for (const n of qiNodes) {
    nodeMap.set(n.id, { total: 0, remaining: Math.max(0, n.strength - 1) })
  }

  // 第一遍：计算总扣减
  const grouped = new Map<string, DeductionItem[]>()
  for (const item of items) {
    if (!grouped.has(item.targetId)) grouped.set(item.targetId, [])
    grouped.get(item.targetId)!.push(item)
    const info = nodeMap.get(item.targetId)
    if (info) info.total += item.amount
  }

  // 第二遍：按比例缩减超额扣减
  const operations: QiOperation[] = []
  for (const [targetId, items] of grouped) {
    const info = nodeMap.get(targetId)!
    const maxDeduct = Math.max(0, info.remaining)

    if (info.total <= maxDeduct) {
      // 不超额，全部执行
      for (const item of items) {
        operations.push({
          targetId,
          action: 'Weaken',
          delta: -item.amount,
          ruleId: item.ruleId,
          newState: item.newState,
          newActive: item.newActive,
          reason: item.reason,
        })
      }
    } else {
      // 超额，按比例缩减（使用 floor 避免四舍五入导致总扣减超额）
      const ratio = maxDeduct / info.total
      let allocated = 0
      const scaledItems: { item: DeductionItem; amount: number }[] = []
      for (const item of items) {
        const actualAmount = Math.max(0, Math.floor(item.amount * ratio))
        if (actualAmount > 0) {
          scaledItems.push({ item, amount: actualAmount })
          allocated += actualAmount
        }
      }
      // 如有余额因 floor 丢弃，优先补回给最大项
      const remainder = maxDeduct - allocated
      if (remainder > 0 && scaledItems.length > 0) {
        scaledItems[0].amount += remainder
      }
      for (const { item, amount } of scaledItems) {
        operations.push({
          targetId,
          action: 'Weaken',
          delta: -amount,
          ruleId: item.ruleId,
          newState: item.newState,
          newActive: item.newActive,
          reason: item.reason,
        })
      }
    }
  }

  return operations
}

// ─── 内部：收集冲突扣减条目（不做安全检查） ───

function collectConflictDeductions(commands: ConflictCommand[]): DeductionItem[] {
  const stateMap: Record<ConflictCommand['type'], QiState> = {
    '冲': '被冲',
    '刑': '被刑',
    '害': '被害',
    '破': '被破',
  }

  const items: DeductionItem[] = []
  for (const cmd of commands) {
    for (const d of cmd.deductions) {
      items.push({
        targetId: d.targetId,
        amount: d.amount,
        reason: d.detail,
        ruleId: `conflict-${cmd.type}`,
        newState: stateMap[cmd.type],
        newActive: true,
      })
    }
  }
  return items
}

// ─── 内部：收集合化扣减 + boost 操作（不做安全检查） ───

function collectHeHuaItems(
  commands: HeHuaCommand[],
  qiNodes: QiNode[],
): { deductions: DeductionItem[]; boosts: QiOperation[] } {
  const deductions: DeductionItem[] = []
  const boosts: QiOperation[] = []

  for (const cmd of commands) {
    for (const d of cmd.deductions) {
      deductions.push({
        targetId: d.targetId,
        amount: d.amount,
        reason: d.detail,
        ruleId: cmd.success
          ? `hehua-${cmd.type.toLowerCase()}-chenghua`
          : `hehua-${cmd.type.toLowerCase()}-heban`,
        newState: cmd.success ? '合化' : undefined,
        newActive: cmd.success ? false : undefined,
      })
    }

    if (cmd.success) {
      for (const a of cmd.additions) {
        if (a.targetId.startsWith('__hehua_')) {
          const candidates = qiNodes
            .filter(n => n.active && n.element === a.element && !cmd.deductions.some(d => d.targetId === n.id))
            .sort((x, y) => y.strength - x.strength)

          if (candidates.length > 0) {
            const primary = candidates[0]
            boosts.push({
              targetId: primary.id,
              action: 'Boost',
              delta: a.amount,
              ruleId: `hehua-${cmd.type.toLowerCase()}-boost`,
              reason: `合化${cmd.huaElement}，化气归于${primary.id}（${a.detail}）`,
            })
          } else {
            boosts.push({
              targetId: '__fallback_huaShen__',
              action: 'Boost',
              delta: a.amount,
              ruleId: `hehua-${cmd.type.toLowerCase()}-fallback`,
              newElement: a.element,
              reason: `合化${cmd.huaElement}，无同五行活跃节点，化气待分配（${a.detail}）`,
            })
          }
        }
      }
    }
  }

  return { deductions, boosts }
}

// ─── 统一转换入口（全局安全保护） ───

/**
 * 将所有 Detector 命令转换为 QiOperation[]
 *
 * 冲先执行，合化后执行
 * 全局安全保护：同一节点总扣减不超 strength - 1
 */
export function transformAll(
  heHuaCommands: HeHuaCommand[],
  conflictCommands: ConflictCommand[],
  qiNodes: QiNode[],
): QiOperation[] {
  // 1. 收集所有扣减条目
  const conflictDeductions = collectConflictDeductions(conflictCommands)
  const { deductions: heHuaDeductions, boosts: heHuaBoosts } = collectHeHuaItems(heHuaCommands, qiNodes)

  // 2. 合并所有扣减，做全局安全保护（唯一安全点）
  const allDeductions = [...conflictDeductions, ...heHuaDeductions]
  const safeOps = safeDeductions(allDeductions, qiNodes)

  // 3. 加回 boost 操作
  return [...safeOps, ...heHuaBoosts]
}

// ─── 向后兼容的单项转换接口 ───

export function transformHeHua(
  commands: HeHuaCommand[],
  qiNodes: QiNode[],
): QiOperation[] {
  const { deductions, boosts } = collectHeHuaItems(commands, qiNodes)
  return [...safeDeductions(deductions, qiNodes), ...boosts]
}

export function transformConflict(
  commands: ConflictCommand[],
  qiNodes: QiNode[],
): QiOperation[] {
  return safeDeductions(collectConflictDeductions(commands), qiNodes)
}
