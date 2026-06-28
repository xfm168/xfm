/**
 * 喜用神规则引擎
 * 完整喜用神体系：调候优先、特殊格局、身强身弱扶抑、格局喜用、病药、通关
 */

import { executeRules, type BaseRule, type RuleContext } from './engine'
import type { FiveElement, WuXingWangShuai } from '../types'
import type { GeJuName, GeJuCategory } from './gejuRules'

// ========== 类型定义 ==========

export interface XiYongContext extends RuleContext {
  dayElement: FiveElement
  dayYinYang: '阳' | '阴'
  strengthScore: number
  wangShuai: WuXingWangShuai
  geJuName: GeJuName
  geJuCategory: GeJuCategory
  isSpecialGe: boolean
  monthZhi: string
  monthElement: FiveElement
  fiveElementCount: Record<FiveElement, number>
  hasTiaoHou: boolean
  hasBingYao: boolean
  seasonalBias: '燥' | '湿' | '寒' | '暖' | null
  tongGenCount: number
  touGanCount: number
  samePartyCount: number
  diffPartyCount: number
  geJuScore: number
}

export interface XiYongResult {
  firstHappy: FiveElement | null
  secondHappy: FiveElement | null
  thirdHappy: FiveElement | null
  firstUsage: FiveElement | null
  secondUsage: FiveElement | null
  avoidedElements: FiveElement[]
  enemyElements: FiveElement[]
  idleElements: FiveElement[]
  confidence: number
  reasons: string[]
  matchedRules: string[]
  explanation: string
}

// ========== 辅助函数 ==========

const GENERATE: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}

function getMotherElement(el: FiveElement): FiveElement {
  const entries = Object.entries(GENERATE) as [FiveElement, FiveElement][]
  const found = entries.find(([_, v]) => v === el)
  return found ? found[0] : '水'
}

function allElementsExcept(exclude: FiveElement[]): FiveElement[] {
  const all: FiveElement[] = ['木', '火', '土', '金', '水']
  return all.filter(el => !exclude.includes(el))
}

// ========== 喜用神规则 ==========

export const XIYONG_RULES: BaseRule<XiYongContext, Partial<XiYongResult>>[] = [

  // ===== 调候优先（优先级 200） =====

  {
    id: 'tiao-hou-dong-water',
    name: '冬水调候喜火',
    category: '调候优先',
    priority: 200,
    weight: 95,
    description: '亥子月水旺寒冷，以火调候为第一要务',
    reference: '《穷通宝鉴》调候篇',
    condition: (ctx) => {
      return ctx.hasTiaoHou && (ctx.monthZhi === '亥' || ctx.monthZhi === '子')
    },
    result: {
      firstHappy: '火',
      secondHappy: '木',
      firstUsage: '火',
      secondUsage: '木',
      avoidedElements: ['水'],
      enemyElements: ['金'],
      idleElements: ['土'],
      reasons: ['冬水寒凉，火能暖局调候', '木能生火，助调候之力'],
      explanation: '冬月水寒，调候为急，喜火暖局，木火为用。',
    },
  },
  {
    id: 'tiao-hou-xia-fire',
    name: '夏火调候喜水',
    category: '调候优先',
    priority: 200,
    weight: 95,
    description: '巳午月火旺炎燥，以水调候为第一要务',
    reference: '《穷通宝鉴》调候篇',
    condition: (ctx) => {
      return ctx.hasTiaoHou && (ctx.monthZhi === '巳' || ctx.monthZhi === '午')
    },
    result: {
      firstHappy: '水',
      secondHappy: '金',
      firstUsage: '水',
      secondUsage: '金',
      avoidedElements: ['火'],
      enemyElements: ['木'],
      idleElements: ['土'],
      reasons: ['夏火炎燥，水能润局调候', '金能生水，助调候之力'],
      explanation: '夏月火炎，调候为急，喜水润局，金水为用。',
    },
  },
  {
    id: 'tiao-hou-chun-zao',
    name: '春木调候喜火',
    category: '调候优先',
    priority: 198,
    weight: 85,
    description: '寅卯月木旺，喜火泄秀暖局',
    reference: '《穷通宝鉴》调候篇',
    condition: (ctx) => {
      return ctx.monthZhi === '寅' || ctx.monthZhi === '卯'
    },
    result: {
      firstHappy: '火',
      secondHappy: '土',
      firstUsage: '火',
      avoidedElements: ['水'],
      enemyElements: [],
      idleElements: ['金'],
      reasons: ['春木旺相，火能泄木之秀', '土为财，火生土财星有源'],
      explanation: '春木得令，喜火泄秀生财，火土为用。',
    },
  },
  {
    id: 'tiao-hou-qiu-zao',
    name: '秋金调候喜火',
    category: '调候优先',
    priority: 198,
    weight: 85,
    description: '申酉月金旺，喜火锻炼成器',
    reference: '《穷通宝鉴》调候篇',
    condition: (ctx) => {
      return ctx.monthZhi === '申' || ctx.monthZhi === '酉'
    },
    result: {
      firstHappy: '火',
      secondHappy: '木',
      firstUsage: '火',
      avoidedElements: ['金'],
      enemyElements: ['土'],
      idleElements: ['水'],
      reasons: ['秋金当令，火能锻炼成器', '木为财，生火助官杀'],
      explanation: '秋金得令，喜火锻炼，木火为用。',
    },
  },
  {
    id: 'tiao-hou-chen-xu-chou-wei',
    name: '四季月调候',
    category: '调候优先',
    priority: 196,
    weight: 80,
    description: '辰戌丑未月土旺，视燥湿调候',
    reference: '《滴天髓》寒暖燥湿篇',
    condition: (ctx) => {
      return ctx.monthZhi === '辰' || ctx.monthZhi === '戌'
        || ctx.monthZhi === '丑' || ctx.monthZhi === '未'
    },
    result: {
      firstHappy: '木',
      secondHappy: '水',
      firstUsage: '木',
      avoidedElements: ['土'],
      enemyElements: [],
      idleElements: ['金', '火'],
      reasons: ['四季月土旺，木能疏土', '水润土或火暖局视情况而定'],
      explanation: '四季月土旺，喜木疏土，视燥湿补水或火。',
    },
  },

  // ===== 特殊格局（优先级 190） =====

  {
    id: 'zhuan-wang-ge-xiyong',
    name: '专旺格喜用',
    category: '特殊格局',
    priority: 190,
    weight: 92,
    description: '专旺格一行独旺，宜顺不宜逆，喜印比助势，食伤泄秀',
    reference: '《滴天髓》专旺格篇',
    condition: (ctx) => {
      return ctx.isSpecialGe && ctx.geJuCategory === '专旺格'
    },
    result: {
      firstHappy: '水',
      secondHappy: '木',
      thirdHappy: '火',
      firstUsage: '水',
      secondUsage: '木',
      avoidedElements: ['土'],
      enemyElements: ['金'],
      idleElements: [],
      reasons: ['专旺格宜顺不宜逆', '印星生身，比劫助势', '食伤泄秀亦吉'],
      explanation: '专旺格一行独旺，顺其势则吉，喜印比食伤，忌官杀克伐。',
    },
  },
  {
    id: 'cong-guan-sha-xiyong',
    name: '从官杀格喜用',
    category: '特殊格局',
    priority: 190,
    weight: 90,
    description: '从官杀格，官杀当令成势，喜财生官杀，忌印比逆局',
    reference: '《子平真诠》从格篇',
    condition: (ctx) => {
      return ctx.isSpecialGe && ctx.geJuCategory === '从格'
        && (ctx.geJuName === '从官杀格' || ctx.geJuName === '弃命从官' || ctx.geJuName === '弃命从杀')
    },
    result: {
      firstHappy: '木',
      secondHappy: '火',
      firstUsage: '木',
      secondUsage: '火',
      avoidedElements: ['水'],
      enemyElements: ['金'],
      idleElements: ['土'],
      reasons: ['从官杀格宜顺官杀之势', '财星生官杀为喜', '忌印星化杀生身逆局'],
      explanation: '从官杀格，日主从官杀之势，喜财生官杀，忌印比帮身。',
    },
  },
  {
    id: 'cong-cai-xiyong',
    name: '从财格喜用',
    category: '特殊格局',
    priority: 190,
    weight: 90,
    description: '从财格，财星当令成势，喜食伤生财，忌比劫夺财',
    reference: '《子平真诠》从格篇',
    condition: (ctx) => {
      return ctx.isSpecialGe && ctx.geJuCategory === '从格'
        && (ctx.geJuName === '从财格' || ctx.geJuName === '弃命从财')
    },
    result: {
      firstHappy: '火',
      secondHappy: '土',
      firstUsage: '火',
      secondUsage: '土',
      avoidedElements: ['木'],
      enemyElements: ['水'],
      idleElements: ['金'],
      reasons: ['从财格宜顺财星之势', '食伤生财为喜', '忌比劫夺财逆局'],
      explanation: '从财格，日主从财星之势，喜食伤生财，忌比劫夺财。',
    },
  },
  {
    id: 'cong-er-xiyong',
    name: '从儿格喜用',
    category: '特殊格局',
    priority: 190,
    weight: 88,
    description: '从儿格，食伤当令成势，喜财星泄秀，忌印星制食伤',
    reference: '《子平真诠》从格篇',
    condition: (ctx) => {
      return ctx.isSpecialGe && ctx.geJuCategory === '从格' && ctx.geJuName === '从儿格'
    },
    result: {
      firstHappy: '土',
      secondHappy: '金',
      firstUsage: '土',
      secondUsage: '金',
      avoidedElements: ['木'],
      enemyElements: ['水'],
      idleElements: ['火'],
      reasons: ['从儿格宜顺食伤之势', '财星泄食伤之气为喜', '忌印星制食伤逆局'],
      explanation: '从儿格，日主从食伤之势，喜财星泄秀，忌印星克制。',
    },
  },
  {
    id: 'cong-yin-xiyong',
    name: '从印格喜用',
    category: '特殊格局',
    priority: 190,
    weight: 85,
    description: '从印格，印星当令成势，喜官杀生印，忌财星坏印',
    reference: '《子平真诠》从格篇',
    condition: (ctx) => {
      return ctx.isSpecialGe && ctx.geJuCategory === '从格' && ctx.geJuName === '从印格'
    },
    result: {
      firstHappy: '金',
      secondHappy: '水',
      firstUsage: '金',
      secondUsage: '水',
      avoidedElements: ['火'],
      enemyElements: ['土'],
      idleElements: ['木'],
      reasons: ['从印格宜顺印星之势', '官杀生印为喜', '忌财星坏印逆局'],
      explanation: '从印格，日主从印星之势，喜官杀生印，忌财星坏印。',
    },
  },

  // ===== 身强身弱扶抑（优先级 100） =====

  {
    id: 'shen-qiang-xie',
    name: '身强宜泄',
    category: '身强身弱扶抑',
    priority: 100,
    weight: 85,
    description: '身强旺者，宜食伤泄秀，财星耗身，官杀克身',
    reference: '《子平真诠》用神篇',
    condition: (ctx) => {
      return ctx.strengthScore >= 70 && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '火',
      secondHappy: '土',
      thirdHappy: '金',
      firstUsage: '火',
      secondUsage: '土',
      avoidedElements: ['水'],
      enemyElements: ['木'],
      idleElements: [],
      reasons: ['身强旺宜泄宜耗宜克', '食伤泄秀为上', '财星耗身次之', '官杀克身再次之'],
      explanation: '身强旺者，以食伤泄秀为用神，财星官杀为辅，忌印比生扶。',
    },
  },
  {
    id: 'shen-ruo-fu',
    name: '身弱宜扶',
    category: '身强身弱扶抑',
    priority: 100,
    weight: 85,
    description: '身衰弱者，宜印星生身，比劫帮身',
    reference: '《子平真诠》用神篇',
    condition: (ctx) => {
      return ctx.strengthScore <= 30 && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '水',
      secondHappy: '木',
      firstUsage: '水',
      secondUsage: '木',
      avoidedElements: ['金'],
      enemyElements: ['土'],
      idleElements: ['火'],
      reasons: ['身衰弱宜生宜扶', '印星生身为上', '比劫帮身次之'],
      explanation: '身衰弱者，以印星生身为用神，比劫帮身为辅，忌财官克泄。',
    },
  },
  {
    id: 'shen-zhong-zhong-he',
    name: '中和顺势',
    category: '身强身弱扶抑',
    priority: 95,
    weight: 75,
    description: '身中和者，以食伤泄秀为喜，顺势而为',
    reference: '《滴天髓》中和篇',
    condition: (ctx) => {
      return ctx.strengthScore > 40 && ctx.strengthScore < 60 && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '火',
      secondHappy: '土',
      firstUsage: '火',
      avoidedElements: [],
      enemyElements: [],
      idleElements: ['金', '水', '木'],
      reasons: ['中和之局，顺势为吉', '食伤泄秀为喜'],
      explanation: '身中和者，不宜强克强补，以食伤泄秀为喜，顺势而为。',
    },
  },

  // ===== 格局喜用（优先级 90） =====

  {
    id: 'zheng-guan-ge-xiyong',
    name: '正官格喜用',
    category: '格局喜用',
    priority: 90,
    weight: 85,
    description: '正官格喜印星化官生身，忌伤官破官',
    reference: '《子平真诠》正官格',
    condition: (ctx) => {
      return ctx.geJuName === '正官格' && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '水',
      secondHappy: '木',
      firstUsage: '水',
      secondUsage: '木',
      avoidedElements: ['火'],
      enemyElements: ['土'],
      idleElements: ['金'],
      reasons: ['正官格喜印星化官生身', '比劫帮身亦吉', '忌伤官破官'],
      explanation: '正官格，官星为用，喜印化官生身，忌伤官破官。',
    },
  },
  {
    id: 'qi-sha-ge-xiyong',
    name: '七杀格喜用',
    category: '格局喜用',
    priority: 90,
    weight: 85,
    description: '七杀格喜食伤制杀，或印星化杀生身',
    reference: '《子平真诠》七杀格',
    condition: (ctx) => {
      return ctx.geJuName === '七杀格' && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '水',
      secondHappy: '火',
      firstUsage: '水',
      secondUsage: '火',
      avoidedElements: ['土'],
      enemyElements: [],
      idleElements: ['金', '木'],
      reasons: ['七杀格喜食伤制杀', '印星化杀生身亦吉'],
      explanation: '七杀格，杀星为病，食伤制杀为药，印化杀亦吉。',
    },
  },
  {
    id: 'zheng-yin-ge-xiyong',
    name: '正印格喜用',
    category: '格局喜用',
    priority: 90,
    weight: 80,
    description: '正印格喜官杀生印，忌财星坏印',
    reference: '《子平真诠》正印格',
    condition: (ctx) => {
      return ctx.geJuName === '正印格' && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '金',
      secondHappy: '水',
      firstUsage: '金',
      secondUsage: '水',
      avoidedElements: ['土'],
      enemyElements: ['火'],
      idleElements: ['木'],
      reasons: ['正印格喜官杀生印', '忌财星坏印'],
      explanation: '正印格，印星为用，喜官杀生印，忌财星坏印。',
    },
  },
  {
    id: 'pian-yin-ge-xiyong',
    name: '偏印格喜用',
    category: '格局喜用',
    priority: 90,
    weight: 78,
    description: '偏印格喜财星制枭，忌枭神夺食',
    reference: '《子平真诠》偏印格',
    condition: (ctx) => {
      return ctx.geJuName === '偏印格' && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '土',
      secondHappy: '金',
      firstUsage: '土',
      secondUsage: '金',
      avoidedElements: ['木'],
      enemyElements: ['水'],
      idleElements: ['火'],
      reasons: ['偏印格喜财星制枭', '忌枭神夺食'],
      explanation: '偏印格，枭印为病，财星制枭为药，忌枭神夺食。',
    },
  },
  {
    id: 'shi-shen-ge-xiyong',
    name: '食神格喜用',
    category: '格局喜用',
    priority: 90,
    weight: 85,
    description: '食神格喜财星泄食生财，忌枭印夺食',
    reference: '《子平真诠》食神格',
    condition: (ctx) => {
      return ctx.geJuName === '食神格' && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '土',
      secondHappy: '金',
      firstUsage: '土',
      secondUsage: '金',
      avoidedElements: ['木'],
      enemyElements: ['水'],
      idleElements: ['火'],
      reasons: ['食神格喜财星泄秀生财', '忌枭印夺食'],
      explanation: '食神格，食神泄秀，喜财星生发，忌枭印夺食。',
    },
  },
  {
    id: 'shang-guan-ge-xiyong',
    name: '伤官格喜用',
    category: '格局喜用',
    priority: 90,
    weight: 82,
    description: '伤官格喜印星制伤，或财星化伤生财',
    reference: '《子平真诠》伤官格',
    condition: (ctx) => {
      return ctx.geJuName === '伤官格' && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '水',
      secondHappy: '土',
      firstUsage: '水',
      secondUsage: '土',
      avoidedElements: ['火'],
      enemyElements: [],
      idleElements: ['金', '木'],
      reasons: ['伤官格喜印星制伤', '财星化伤生财亦吉'],
      explanation: '伤官格，伤官为病，印星制伤为药，财化伤亦吉。',
    },
  },
  {
    id: 'zheng-cai-ge-xiyong',
    name: '正财格喜用',
    category: '格局喜用',
    priority: 90,
    weight: 85,
    description: '正财格喜官杀卫财，忌比劫夺财',
    reference: '《子平真诠》正财格',
    condition: (ctx) => {
      return ctx.geJuName === '正财格' && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '金',
      secondHappy: '木',
      firstUsage: '金',
      secondUsage: '木',
      avoidedElements: ['木'],
      enemyElements: ['水'],
      idleElements: ['火', '土'],
      reasons: ['正财格喜官杀卫财', '忌比劫夺财'],
      explanation: '正财格，财星为用，喜官杀卫财，忌比劫夺财。',
    },
  },
  {
    id: 'pian-cai-ge-xiyong',
    name: '偏财格喜用',
    category: '格局喜用',
    priority: 90,
    weight: 82,
    description: '偏财格喜官杀卫财，食伤生财，忌比劫夺财',
    reference: '《子平真诠》偏财格',
    condition: (ctx) => {
      return ctx.geJuName === '偏财格' && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '金',
      secondHappy: '火',
      firstUsage: '金',
      secondUsage: '火',
      avoidedElements: ['木'],
      enemyElements: ['水'],
      idleElements: ['土'],
      reasons: ['偏财格喜官杀卫财', '食伤生财亦吉', '忌比劫夺财'],
      explanation: '偏财格，财星为用，喜官杀卫财食伤生财，忌比劫夺财。',
    },
  },
  {
    id: 'bi-jian-jie-cai-xiyong',
    name: '比劫格喜用',
    category: '格局喜用',
    priority: 88,
    weight: 80,
    description: '比劫格（建禄羊刃）喜食伤泄秀生财，或官杀制比劫',
    reference: '《子平真诠》建禄羊刃格',
    condition: (ctx) => {
      return (ctx.geJuName === '比肩格' || ctx.geJuName === '劫财格') && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '火',
      secondHappy: '土',
      thirdHappy: '金',
      firstUsage: '火',
      secondUsage: '土',
      avoidedElements: ['水'],
      enemyElements: ['木'],
      idleElements: [],
      reasons: ['比劫格喜食伤泄秀生财', '官杀制比劫亦吉', '忌印星生扶'],
      explanation: '比劫格，比劫帮身太过，喜食伤泄秀生财，官杀制劫，忌印比。',
    },
  },

  // ===== 病药（优先级 80） =====

  {
    id: 'bing-yao-wang-ji',
    name: '身旺为病宜克泄',
    category: '病药',
    priority: 80,
    weight: 78,
    description: '身旺无制为病，以官杀克、食伤泄、财星耗为药',
    reference: '《神峰通考》病药篇',
    condition: (ctx) => {
      return ctx.hasBingYao && ctx.strengthScore >= 75 && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '火',
      secondHappy: '土',
      thirdHappy: '金',
      firstUsage: '火',
      avoidedElements: ['水'],
      enemyElements: ['木'],
      idleElements: [],
      reasons: ['身旺太过为病', '食伤泄、财星耗、官杀克为药'],
      explanation: '身旺无制为病，以克泄耗为药，食伤财官为喜。',
    },
  },
  {
    id: 'bing-yao-ruo-ji',
    name: '身弱为病宜生扶',
    category: '病药',
    priority: 80,
    weight: 78,
    description: '身弱受制为病，以印星生、比劫扶为药',
    reference: '《神峰通考》病药篇',
    condition: (ctx) => {
      return ctx.hasBingYao && ctx.strengthScore <= 25 && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '水',
      secondHappy: '木',
      firstUsage: '水',
      avoidedElements: ['金'],
      enemyElements: ['土'],
      idleElements: ['火'],
      reasons: ['身弱受制为病', '印星生、比劫扶为药'],
      explanation: '身弱受制为病，以生扶为药，印比为喜。',
    },
  },

  // ===== 通关（优先级 70） =====

  {
    id: 'tong-guan-liang-zhan',
    name: '两行交战喜通关',
    category: '通关',
    priority: 70,
    weight: 75,
    description: '命局两行交战，得中间之神通关调和为美',
    reference: '《滴天髓》通关篇',
    condition: (ctx) => {
      return ctx.samePartyCount >= 2 && ctx.diffPartyCount >= 2
        && ctx.strengthScore >= 35 && ctx.strengthScore <= 65
        && !ctx.isSpecialGe
    },
    result: {
      firstHappy: '火',
      secondHappy: '土',
      firstUsage: '火',
      avoidedElements: [],
      enemyElements: [],
      idleElements: ['金', '水', '木'],
      reasons: ['命局两势相战', '通关之神调和为美'],
      explanation: '命局两行相战，以通关之神调和为喜，使五行流通。',
    },
  },

  // ===== 默认规则 =====

  {
    id: 'default-xiyong',
    name: '默认喜用',
    category: '通用',
    priority: 1,
    weight: 50,
    description: '综合身强身弱判断喜用神',
    reference: '《子平真诠》用神总论',
    condition: () => true,
    result: {
      firstHappy: '火',
      secondHappy: '土',
      firstUsage: '火',
      avoidedElements: [],
      enemyElements: [],
      idleElements: ['金', '水', '木'],
      reasons: ['综合判断'],
      explanation: '综合命局五行平衡，以调和为用。',
    },
  },
]

// ========== 核心函数 ==========

/**
 * 执行喜用神规则
 */
export function executeXiYongRules(
  ctx: XiYongContext,
): {
  bestMatch: { rule: BaseRule<XiYongContext, Partial<XiYongResult>>; result: XiYongResult; confidence: number } | null
  allMatches: Array<{ rule: BaseRule<XiYongContext, Partial<XiYongResult>>; result: Partial<XiYongResult>; confidence: number }>
  conflicts: BaseRule<XiYongContext, Partial<XiYongResult>>[]
} {
  const { bestMatch, allMatches, conflicts } = executeRules(XIYONG_RULES, ctx, {
    stopOnFirstMatch: false,
    returnAllMatches: true,
  })

  const finalBest = bestMatch
    ? {
        rule: bestMatch.rule as BaseRule<XiYongContext, Partial<XiYongResult>>,
        result: mergeXiYongResult(ctx, allMatches as Array<{ rule: BaseRule<XiYongContext, Partial<XiYongResult>>; result: Partial<XiYongResult>; confidence: number }>),
        confidence: bestMatch.confidence,
      }
    : null

  return {
    bestMatch: finalBest,
    allMatches: allMatches.map(m => ({
      rule: m.rule as BaseRule<XiYongContext, Partial<XiYongResult>>,
      result: m.result as Partial<XiYongResult>,
      confidence: m.confidence,
    })),
    conflicts: conflicts as BaseRule<XiYongContext, Partial<XiYongResult>>[],
  }
}

/**
 * 合并多条规则结果
 */
function mergeXiYongResult(
  ctx: XiYongContext,
  matches: Array<{ rule: BaseRule<XiYongContext, Partial<XiYongResult>>; result: Partial<XiYongResult>; confidence: number }>,
): XiYongResult {
  if (matches.length === 0) {
    return buildDefaultResult(ctx)
  }

  const scoreMap: Record<FiveElement, number> = {
    '木': 0, '火': 0, '土': 0, '金': 0, '水': 0,
  }
  const avoidSet = new Set<FiveElement>()
  const enemySet = new Set<FiveElement>()
  const idleSet = new Set<FiveElement>()
  const reasons: string[] = []
  const matchedRules: string[] = []

  for (const match of matches) {
    const r = match.result as Partial<XiYongResult>
    const weight = match.confidence / 100

    if (r.firstHappy) scoreMap[r.firstHappy] += 10 * weight
    if (r.secondHappy) scoreMap[r.secondHappy] += 7 * weight
    if (r.thirdHappy) scoreMap[r.thirdHappy] += 4 * weight
    if (r.firstUsage) scoreMap[r.firstUsage] += 8 * weight
    if (r.secondUsage) scoreMap[r.secondUsage] += 5 * weight

    r.avoidedElements?.forEach(el => avoidSet.add(el))
    r.enemyElements?.forEach(el => enemySet.add(el))
    r.idleElements?.forEach(el => idleSet.add(el))
    r.reasons?.forEach(reason => reasons.push(reason))
    matchedRules.push(match.rule.name)
  }

  const sortedByScore = (Object.entries(scoreMap) as [FiveElement, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0)

  const happyElements = sortedByScore.slice(0, 3).map(([el]) => el)
  const usageElements = sortedByScore.slice(0, 2).map(([el]) => el)

  const firstHappy = happyElements[0] || null
  const secondHappy = happyElements[1] || null
  const thirdHappy = happyElements[2] || null
  const firstUsage = usageElements[0] || null
  const secondUsage = usageElements[1] || null

  const allAvoided = Array.from(avoidSet).filter(el => el !== firstHappy && el !== secondHappy)
  const allEnemy = Array.from(enemySet).filter(el => el !== firstHappy && el !== secondHappy)
  const allIdle = Array.from(idleSet).filter(el =>
    el !== firstHappy && el !== secondHappy && el !== thirdHappy
      && !allAvoided.includes(el) && !allEnemy.includes(el)
  )

  const avgConfidence = matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length

  const explanation = buildExplanation(ctx, firstHappy, secondHappy, matchedRules, reasons)

  return {
    firstHappy,
    secondHappy,
    thirdHappy,
    firstUsage,
    secondUsage,
    avoidedElements: allAvoided,
    enemyElements: allEnemy,
    idleElements: allIdle,
    confidence: Math.round(avgConfidence),
    reasons: [...new Set(reasons)],
    matchedRules,
    explanation,
  }
}

/**
 * 构建默认结果
 */
function buildDefaultResult(ctx: XiYongContext): XiYongResult {
  const dayEl = ctx.dayElement
  const sheng = getMotherElement(dayEl)
  const woSheng = GENERATE[dayEl]
  const woKe = OVERCOME[dayEl]
  const keWo = Object.entries(OVERCOME).find(([_, v]) => v === dayEl)?.[0] as FiveElement

  if (ctx.strengthScore >= 60) {
    return {
      firstHappy: woSheng,
      secondHappy: woKe,
      thirdHappy: keWo,
      firstUsage: woSheng,
      secondUsage: woKe,
      avoidedElements: [dayEl, sheng],
      enemyElements: [sheng],
      idleElements: [],
      confidence: 50,
      reasons: ['身强宜泄宜克', '食伤泄秀为上'],
      matchedRules: ['默认规则'],
      explanation: '身强旺者，宜泄宜克，以食伤财官为用。',
    }
  } else if (ctx.strengthScore <= 40) {
    return {
      firstHappy: sheng,
      secondHappy: dayEl,
      thirdHappy: null,
      firstUsage: sheng,
      secondUsage: dayEl,
      avoidedElements: [keWo, woSheng],
      enemyElements: [keWo],
      idleElements: [woKe],
      confidence: 50,
      reasons: ['身弱宜生宜扶', '印星生身为上'],
      matchedRules: ['默认规则'],
      explanation: '身衰弱者，宜生宜扶，以印比为用。',
    }
  } else {
    return {
      firstHappy: woSheng,
      secondHappy: woKe,
      thirdHappy: null,
      firstUsage: woSheng,
      secondUsage: woKe,
      avoidedElements: [],
      enemyElements: [],
      idleElements: allElementsExcept([woSheng, woKe]),
      confidence: 50,
      reasons: ['中和之局，顺势而为'],
      matchedRules: ['默认规则'],
      explanation: '身中和者，顺势为吉，食伤泄秀为喜。',
    }
  }
}

/**
 * 构建解释文案
 */
function buildExplanation(
  ctx: XiYongContext,
  firstHappy: FiveElement | null,
  _secondHappy: FiveElement | null,
  matchedRules: string[],
  reasons: string[],
): string {
  const parts: string[] = []

  parts.push(`日主${ctx.dayElement}，身${ctx.strengthScore >= 60 ? '强' : ctx.strengthScore <= 40 ? '弱' : '中和'}。`)

  if (ctx.isSpecialGe) {
    parts.push(`格局为${ctx.geJuName}（特殊格局）。`)
  } else {
    parts.push(`格局为${ctx.geJuName}。`)
  }

  if (ctx.hasTiaoHou) {
    parts.push('调候为急，')
  }

  if (firstHappy) {
    parts.push(`喜神首取${firstHappy}。`)
  }

  if (reasons.length > 0) {
    parts.push(reasons[0])
  }

  if (matchedRules.length > 0) {
    parts.push(`（命中规则：${matchedRules.slice(0, 3).join('、')}${matchedRules.length > 3 ? '等' : ''}）`)
  }

  return parts.join('')
}

/**
 * 判断喜用神（主入口函数）
 */
export function determineXiYongShen(
  ctx: XiYongContext,
): XiYongResult {
  const { bestMatch, allMatches } = executeXiYongRules(ctx)

  if (bestMatch) {
    return bestMatch.result
  }

  if (allMatches.length > 0) {
    return mergeXiYongResult(ctx, allMatches)
  }

  return buildDefaultResult(ctx)
}
