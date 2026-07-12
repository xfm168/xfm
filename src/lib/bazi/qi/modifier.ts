/**
 * SeasonModifier
 * 月令季节性调整
 *
 * 职责：只生成 QiOperation[]，不直接修改 QiNode
 * 执行由 QiExecutor 完成
 */

import type { EarthlyBranch, FiveElement } from '../types'
import type { QiNode, QiOperation } from './types'
import { getBranchElement } from '@/lib/core'

const OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}

/**
 * 检测月令季节性影响，返回操作指令
 * - 月令五行 → Boost +3
 * - 月令所克五行 → Weaken -2
 */
export function detectSeasonOperations(
  qiNodes: QiNode[],
  monthZhi: EarthlyBranch,
): QiOperation[] {
  const monthElement = getBranchElement(monthZhi)
  const overcomeElement = OVERCOME[monthElement]
  const operations: QiOperation[] = []

  for (const node of qiNodes) {
    if (!node.active) continue

    if (node.element === monthElement) {
      operations.push({
        targetId: node.id,
        action: 'Boost',
        delta: 3,
        ruleId: 'season-boost',
        reason: `${node.element}得令（月令${monthZhi}为${monthElement}），季节性加权+3`,
      })
    } else if (node.element === overcomeElement && node.strength > 2) {
      operations.push({
        targetId: node.id,
        action: 'Weaken',
        delta: -Math.min(2, node.strength - 0),
        ruleId: 'season-weaken',
        reason: `${node.element}被月令${monthZhi}(${monthElement})所克，季节性削弱-2`,
      })
    }
  }

  return operations
}
