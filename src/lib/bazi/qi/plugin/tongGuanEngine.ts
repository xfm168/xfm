/**
 * TongGuanEngine — P2-2 通关系统
 * 
 * 依据：《滴天髓》"通关者，两行相战，以中间通关之物解之"
 * 
 * 核心逻辑：
 *   1. 识别五行交战（如金木相战、水火相战）
 *   2. 判断是否存在通关五行
 *   3. 输出最佳通关神和风险等级
 */

import type { FiveElement } from '../../types'
import { OVERCOME } from '../../../core'

export interface BattlePair {
  /** 交战双方 */
  element1: FiveElement
  element2: FiveElement
  /** 交战描述 */
  description: string
  /** 战斗强度（基于双方力量差） */
  intensity: number
}

export interface TongGuanResult {
  /** 是否存在交战 */
  hasBattle: boolean
  /** 交战对 */
  battles: BattlePair[]
  /** 是否通关 */
  hasTongGuan: boolean
  /** 最佳通关五行 */
  tongGuanElement?: FiveElement
  /** 通关说明 */
  tongGuanDescription?: string
  /** 风险等级 1-5 */
  riskLevel: number
  /** 古籍引用 */
  classicalQuote: string
}

// ─── 五行关系 ───

/** 通关关系表：克我者 → 我 → 我克者（如金克木，通关用火） */
const TONG_GUAN_MAP: Record<string, FiveElement> = {
  '金-木': '水', // 金克木，水通关（金生水，水生木）
  '木-土': '火', // 木克土，火通关（木生火，火生土）
  '水-火': '木', // 水克火，木通关（水生木，木生火）
  '火-金': '土', // 火克金，土通关（火生土，土生金）
  '土-水': '金', // 土克水，金通关（土生金，金生水）
}

const ELEMENT_NAMES: Record<FiveElement, string> = {
  '木': '木', '火': '火', '土': '土', '金': '金', '水': '水',
}

// ─── 核心引擎 ───

export function analyzeTongGuan(
  elementCount: Record<FiveElement, number>,
): TongGuanResult {
  const battles: BattlePair[] = []

  // 检查所有克伐关系
  const elements: FiveElement[] = ['木', '火', '土', '金', '水']
  for (let i = 0; i < elements.length; i++) {
    for (let j = 0; j < elements.length; j++) {
      if (i === j) continue
      const el1 = elements[i]
      const el2 = elements[j]

      // el1 克 el2?
      if (OVERCOME[el1] === el2) {
        // 检查是否双方都有力量
        if (elementCount[el1] >= 2 && elementCount[el2] >= 2) {
          const intensity = Math.min(elementCount[el1], elementCount[el2])
          battles.push({
            element1: el1,
            element2: el2,
            description: `${el1}(${elementCount[el1].toFixed(1)})克${el2}(${elementCount[el2].toFixed(1)})，${el1}${el2}交战`,
            intensity,
          })
        }
      }
    }
  }

  if (battles.length === 0) {
    return {
      hasBattle: false,
      battles: [],
      hasTongGuan: true,
      riskLevel: 1,
      classicalQuote: '《滴天髓》："五行和合，命局平稳，不需通关。"',
    }
  }

  // 检查通关
  let hasTongGuan = false
  let tongGuanElement: FiveElement | undefined
  let tongGuanDescription = ''

  // 按强度排序，处理最激烈的交战
  const sortedBattles = [...battles].sort((a, b) => b.intensity - a.intensity)
  const topBattle = sortedBattles[0]

  // 构造查找 key
  const key1 = `${topBattle.element1}-${topBattle.element2}`
  const key2 = `${topBattle.element2}-${topBattle.element1}`
  const bridgeElement = TONG_GUAN_MAP[key1] || TONG_GUAN_MAP[key2]

  if (bridgeElement) {
    const bridgeCount = elementCount[bridgeElement] || 0
    if (bridgeCount >= 1) {
      hasTongGuan = true
      tongGuanElement = bridgeElement
      tongGuanDescription = `${topBattle.element1}${topBattle.element2}交战，以${bridgeElement}通关（${topBattle.element1}生${bridgeElement}，${bridgeElement}生${topBattle.element2}）`
    } else {
      tongGuanDescription = `${topBattle.element1}${topBattle.element2}交战，应以${bridgeElement}通关，但命局缺${bridgeElement}，通关不畅`
    }
  }

  // 风险等级
  let riskLevel = 1
  if (battles.length >= 2) riskLevel = 3
  if (!hasTongGuan) riskLevel = 4
  if (battles.length >= 2 && !hasTongGuan) riskLevel = 5

  return {
    hasBattle: true,
    battles,
    hasTongGuan,
    tongGuanElement,
    tongGuanDescription,
    riskLevel,
    classicalQuote: '《滴天髓》："通关者，两行相战，以中间通关之物解之。如金木相战以水通关，水火相战以木通关。"',
  }
}
