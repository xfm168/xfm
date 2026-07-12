/**
 * SeasonCommander — 月令司令分析器
 *
 * P1 原则：Detector 只负责判断，输出 SeasonCommand[]，绝不修改 Qi
 *
 * 职责：
 * - 分析月令藏干的司令关系
 * - 判断得令/失令/退令/普通
 * - 计算月令藏干力量分布
 * - 判断墓气
 *
 * 规则依据：
 * - 《子平真诠》：月令为提纲，司四时之令
 * - 《滴天髓》：得令者旺，失令者衰
 * - 墓气：辰（水墓）、戌（火墓）、丑（金墓）、未（木墓）
 */

import type { FiveElement, EarthlyBranch } from '../../types'
import type { QiNode, QiContext, SeasonCommand, SeasonStatus } from '../types'

// ─── 墓气表 ───
const MU_QI_MAP: Record<FiveElement, EarthlyBranch> = {
  '水': '辰', '火': '戌', '金': '丑', '木': '未', '土': '辰', // 土墓同水
}

// ─── 五行生克关系 ───
const GENERATES: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}

// ─── 月令藏干力量权重 ───
const CANG_GAN_WEIGHT: Record<string, number> = {
  '本气': 1.0,
  '中气': 0.5,
  '余气': 0.2,
}

/**
 * 分析月令司令关系
 * 只负责判断，绝不修改 QiNode，也不生成 QiOperation
 */
export function analyzeSeasonCommand(
  qiNodes: QiNode[],
  ctx: QiContext,
): { command: SeasonCommand } {
  const { dayElement, monthElement, monthZhi } = ctx

  // 1. 判断得令/失令/退令/普通
  let seasonStatus: SeasonStatus = '普通'
  let reason = ''

  if (dayElement === monthElement) {
    seasonStatus = '得令'
    reason = `日主${dayElement}与月令${monthZhi}(${monthElement})同五行，得令当权`
  } else if (OVERCOME[monthElement] === dayElement) {
    seasonStatus = '失令'
    reason = `日主${dayElement}被月令${monthZhi}(${monthElement})所克，失令失势`
  } else if (GENERATES[monthElement] === dayElement) {
    seasonStatus = '退令'
    reason = `月令${monthZhi}(${monthElement})生日主${dayElement}，虽生但非本气，退令偏弱`
  } else {
    seasonStatus = '普通'
    reason = `日主${dayElement}与月令${monthZhi}(${monthElement})无直接生克关系，令气普通`
  }

  // 2. 分析月令藏干力量分布
  const monthNodes = qiNodes.filter(n => n.pillar === 'month' && n.active)
  const cangGanPower = monthNodes.map(n => {
    const isCommander = n.source === '本气'
    return {
      name: n.hiddenStem ? `${n.hiddenStem}(${n.element})` : n.element,
      element: n.element,
      strength: n.strength,
      isCommander,
    }
  })

  const commanderNode = monthNodes.find(n => n.source === '本气')
  const commander = commanderNode
    ? `${commanderNode.hiddenStem ?? ''}${commanderNode.element}(本气)`
    : `${monthElement}(本气)`
  const commanderWeight = commanderNode ? CANG_GAN_WEIGHT[commanderNode.source] || 1.0 : 1.0

  // 3. 判断墓气（四柱中是否有日主五行的墓）
  const muZhi = MU_QI_MAP[dayElement]
  const hasMuQi = qiNodes.some(n => n.pillar !== 'month' && n.branch === muZhi && n.active)
  if (hasMuQi) {
    reason += `；日主${dayElement}入墓于${muZhi}，墓气缠身`
  }

  const command: SeasonCommand = {
    type: seasonStatus,
    dayElement,
    monthElement,
    monthZhi,
    commander,
    commanderWeight,
    cangGanPower,
    hasMuQi,
    muZhi: hasMuQi ? muZhi : undefined,
    reason,
  }

  return { command }
}

/**
 * 批量分析所有月令司令关系
 * 目前只分析月令，后续可扩展为分析所有 pillar
 */
export function detectSeasonCommands(qiNodes: QiNode[], ctx: QiContext): SeasonCommand[] {
  const { command } = analyzeSeasonCommand(qiNodes, ctx)
  return [command]
}
