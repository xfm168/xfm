/**
 * 十二长生规则引擎
 * 阳干顺行十二地支，阴干逆行十二地支
 */

import type { BaseRule, RuleContext, RuleResult } from './engine'
import type { HeavenlyStem, EarthlyBranch, ShiErChangSheng, YinYang } from '../types'
import { executeRules } from './engine'

export interface ChangShengContext extends RuleContext {
  gan: HeavenlyStem
  zhi: EarthlyBranch
  ganIndex: number
  zhiIndex: number
  ganYinYang: YinYang
}

export interface ChangShengRuleResult extends RuleResult {
  changSheng: ShiErChangSheng
  offset: number
}

export type ChangShengRule = BaseRule<ChangShengContext, ChangShengRuleResult>

const STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export const CHANG_SHENG_NAMES: ShiErChangSheng[] = [
  '长生', '沐浴', '冠带', '临官', '帝旺', '衰',
  '病', '死', '墓', '绝', '胎', '养',
]

// 各天干长生起点（地支索引）
const CHANG_SHENG_START: Record<HeavenlyStem, number> = {
  '甲': 11, '乙': 6, '丙': 2, '丁': 8, '戊': 8,
  '己': 8, '庚': 5, '辛': 0, '壬': 8, '癸': 3,
}

// 阴阳属性
const GAN_YINYANG: Record<HeavenlyStem, YinYang> = {
  '甲': '阳', '丙': '阳', '戊': '阳', '庚': '阳', '壬': '阳',
  '乙': '阴', '丁': '阴', '己': '阴', '辛': '阴', '癸': '阴',
}

/**
 * 十二长生规则
 * 每个天干对应一条规则，定义其长生起点及顺逆方向
 */
export const CHANGSHENG_RULES: ChangShengRule[] = [
  {
    id: 'jia-changsheng',
    name: '甲木长生',
    category: '阳干顺行',
    priority: 100,
    weight: 100,
    description: '甲木长生在亥，顺行十二地支',
    reference: '《三命通会》论长生',
    condition: (ctx) => ctx.gan === '甲',
    result: {
      changSheng: '长生',
      offset: 0,
    },
  },
  {
    id: 'yi-changsheng',
    name: '乙木长生',
    category: '阴干逆行',
    priority: 100,
    weight: 100,
    description: '乙木长生在午，逆行十二地支',
    reference: '《三命通会》论长生',
    condition: (ctx) => ctx.gan === '乙',
    result: {
      changSheng: '长生',
      offset: 0,
    },
  },
  {
    id: 'bing-changsheng',
    name: '丙火长生',
    category: '阳干顺行',
    priority: 100,
    weight: 100,
    description: '丙火长生在寅，顺行十二地支',
    reference: '《三命通会》论长生',
    condition: (ctx) => ctx.gan === '丙',
    result: {
      changSheng: '长生',
      offset: 0,
    },
  },
  {
    id: 'ding-changsheng',
    name: '丁火长生',
    category: '阴干逆行',
    priority: 100,
    weight: 100,
    description: '丁火长生在酉，逆行十二地支',
    reference: '《三命通会》论长生',
    condition: (ctx) => ctx.gan === '丁',
    result: {
      changSheng: '长生',
      offset: 0,
    },
  },
  {
    id: 'wu-changsheng',
    name: '戊土长生',
    category: '阳干顺行',
    priority: 100,
    weight: 100,
    description: '戊土长生在申，顺行十二地支（土寄生于金）',
    reference: '《三命通会》论长生',
    condition: (ctx) => ctx.gan === '戊',
    result: {
      changSheng: '长生',
      offset: 0,
    },
  },
  {
    id: 'ji-changsheng',
    name: '己土长生',
    category: '阴干逆行',
    priority: 100,
    weight: 100,
    description: '己土长生在酉，逆行十二地支（土寄生于金）',
    reference: '《三命通会》论长生',
    condition: (ctx) => ctx.gan === '己',
    result: {
      changSheng: '长生',
      offset: 0,
    },
  },
  {
    id: 'geng-changsheng',
    name: '庚金长生',
    category: '阳干顺行',
    priority: 100,
    weight: 100,
    description: '庚金长生在巳，顺行十二地支',
    reference: '《三命通会》论长生',
    condition: (ctx) => ctx.gan === '庚',
    result: {
      changSheng: '长生',
      offset: 0,
    },
  },
  {
    id: 'xin-changsheng',
    name: '辛金长生',
    category: '阴干逆行',
    priority: 100,
    weight: 100,
    description: '辛金长生在子，逆行十二地支',
    reference: '《三命通会》论长生',
    condition: (ctx) => ctx.gan === '辛',
    result: {
      changSheng: '长生',
      offset: 0,
    },
  },
  {
    id: 'ren-changsheng',
    name: '壬水长生',
    category: '阳干顺行',
    priority: 100,
    weight: 100,
    description: '壬水长生在申，顺行十二地支',
    reference: '《三命通会》论长生',
    condition: (ctx) => ctx.gan === '壬',
    result: {
      changSheng: '长生',
      offset: 0,
    },
  },
  {
    id: 'gui-changsheng',
    name: '癸水长生',
    category: '阴干逆行',
    priority: 100,
    weight: 100,
    description: '癸水长生在卯，逆行十二地支',
    reference: '《三命通会》论长生',
    condition: (ctx) => ctx.gan === '癸',
    result: {
      changSheng: '长生',
      offset: 0,
    },
  },
]

/**
 * 通过规则引擎计算十二长生
 */
export function calcChangShengByRules(
  gan: HeavenlyStem,
  zhi: EarthlyBranch,
): { changSheng: ShiErChangSheng; matchedRule: string; confidence: number } {
  const ganIndex = STEMS.indexOf(gan)
  const zhiIndex = BRANCHES.indexOf(zhi)
  const ganYinYang = GAN_YINYANG[gan]

  const ctx: ChangShengContext = {
    gan,
    zhi,
    ganIndex,
    zhiIndex,
    ganYinYang,
  }

  const { bestMatch } = executeRules(CHANGSHENG_RULES, ctx, {
    stopOnFirstMatch: true,
    returnAllMatches: false,
  })

  const startIdx = CHANG_SHENG_START[gan]

  let offset: number
  if (ganYinYang === '阳') {
    offset = (zhiIndex - startIdx + 12) % 12
  } else {
    offset = (startIdx - zhiIndex + 12) % 12
  }

  const changSheng = CHANG_SHENG_NAMES[offset]

  return {
    changSheng,
    matchedRule: bestMatch?.rule.id || 'unknown',
    confidence: 100,
  }
}

/**
 * 获取某天干的长生宫位地支
 */
export function getChangShengStartZhi(gan: HeavenlyStem): EarthlyBranch {
  const startIdx = CHANG_SHENG_START[gan]
  return BRANCHES[startIdx]
}

/**
 * 获取十二长生名称列表
 */
export function getChangShengNames(): ShiErChangSheng[] {
  return [...CHANG_SHENG_NAMES]
}
