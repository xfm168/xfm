/**
 * SeasonTransformer — 月令司令命令转 QiOperation 执行器
 *
 * 职责：
 * - 将 SeasonCommand[] 转换为 QiOperation[]
 * - 得令 → 月令本气 +2
 * - 退令 → 月令本气 +1
 * - 墓气 → 墓中节点 -1
 *
 * 规则依据：
 * - 得令者旺，月令本气额外加权
 * - 退令者弱，月令本气微补
 * - 墓气封锁，墓中之气减弱
 */

import type { QiNode, QiOperation, SeasonCommand } from '../types'

/**
 * 将 SeasonCommand[] 转换为 QiOperation[]
 *
 * @param commands - 月令司令命令列表
 * @param qiNodes  - 当前气节点快照（用于定位目标节点）
 * @returns QiOperation[] — 待执行的气值微调操作
 */
export function transformSeasonCommands(
  commands: SeasonCommand[],
  qiNodes: QiNode[],
): QiOperation[] {
  const operations: QiOperation[] = []

  for (const cmd of commands) {
    // 得令 / 退令：找到月令本气节点
    const commanderNode = qiNodes.find(
      n => n.pillar === 'month' && n.source === '本气' && n.active,
    )

    if (cmd.type === '得令' && commanderNode) {
      operations.push({
        targetId: commanderNode.id,
        action: 'Boost',
        delta: 2,
        ruleId: 'season-commander-de-ling',
        reason: `日主${cmd.dayElement}得令于${cmd.monthZhi}，月令司令${commanderNode.hiddenStem ?? ''}${commanderNode.element}(本气)额外加权+2`,
      })
    } else if (cmd.type === '退令' && commanderNode) {
      operations.push({
        targetId: commanderNode.id,
        action: 'Boost',
        delta: 1,
        ruleId: 'season-commander-tui-ling',
        reason: `月令${cmd.monthZhi}(${cmd.monthElement})生日主${cmd.dayElement}，退令微补+1`,
      })
    }

    // 墓气影响：墓中之气被封锁
    if (cmd.hasMuQi && cmd.muZhi) {
      const muNodes = qiNodes.filter(
        n => n.branch === cmd.muZhi && n.active && n.source !== '天干',
      )
      for (const node of muNodes) {
        operations.push({
          targetId: node.id,
          action: 'Weaken',
          delta: -1,
          ruleId: 'season-commander-mu-qi',
          newState: '墓气' as any,
          reason: `${node.id}入墓于${cmd.muZhi}，气被封锁-1`,
        })
      }
    }
  }

  return operations
}
