/**
 * 格局规则引擎
 * 完整格局体系：正格、从格、专旺格、化气格、调候格、病药格、扶抑格、通关格
 */

import { executeRules, type BaseRule, type RuleContext, type RuleMatchResult } from './engine'
import type { GanZhi, ShenShi, FiveElement, YinYang } from '../types'

// ========== 类型定义 ==========

export type GeJuCategory =
  | '正格'
  | '从格'
  | '专旺格'
  | '化气格'
  | '调候格'
  | '病药格'
  | '扶抑格'
  | '通关格'
  | '特殊格'
  | '格局层次'
  | '破格'
  | '正格成格'
  | '清纯'

export type GeJuName =
  // 正格
  | '正官格' | '七杀格' | '正印格' | '偏印格'
  | '食神格' | '伤官格' | '正财格' | '偏财格'
  | '比肩格' | '劫财格'
  // 从格
  | '从官杀格' | '从财格' | '从儿格' | '从印格'
  | '从势格' | '从强格' | '从旺格'
  | '弃命从财' | '弃命从官' | '弃命从杀' | '假从格'
  // 专旺格
  | '专旺格' | '曲直格' | '炎上格' | '稼穑格' | '从革格' | '润下格'
  // 化气格
  | '化气格'
  // 其他
  | '调候格' | '寒暖燥湿格' | '病药格' | '扶抑格' | '通关格'
  // 特殊格
  | '飞天禄马' | '金神格' | '魁罡格'
  | '六乙鼠贵' | '壬骑龙背' | '六阴朝阳'
  | '六甲趋乾' | '井栏叉格' | '倒冲格'
  | '天元一气' | '地元一气' | '两神成象'
  | '三奇贵人' | '天干顺食' | '金白水清'
  | '木火通明' | '水火既济' | '火土成慈'
  | '金寒水冷' | '财官双美' | '杀印双清'
  | '食神制杀' | '伤官佩印' | '六秀日'
  | '十灵日' | '四位纯全' | '两气成象'
  | '普通格局'

export type GeJuGrade = 'S+' | 'S' | 'A+' | 'A' | 'B' | 'C' | 'D'

export interface CaseReference {
  source: string
  originalText: string
  explanation: string
  modernExplanation: string
}

export interface GeJuExplain {
  whyMatched: string[]
  whyNotOthers: string[]
  scoreBreakdown: { item: string; score: number }[]
  strengths: string[]
  weaknesses: string[]
}

export interface GeJuItem {
  name: GeJuName
  category: GeJuCategory
  score: number
  confidence: number
  description: string
  reasons: string[]
  priority: number
}

export interface GeJuResult {
  name: GeJuName
  category: GeJuCategory
  isSpecial: boolean
  score: number              // 成格评分 0-100
  grade: GeJuGrade           // 格局等级
  confidence: number         // 可信度 0-100
  confidenceReason: string   // 可信度原因
  description: string
  reasons: string[]          // 成立原因
  poGe: boolean              // 是否破格
  poGeReason: string         // 破格原因
  matchedRules: string[]     // 命中的规则
  conflicts?: string[]      // 冲突信息
  // 多格局融合
  mainGeJu: GeJuItem         // 主格
  assistGeJu: GeJuItem[]     // 副格/兼格
  conflictGeJu: GeJuItem[]   // 冲突格
  // 格局评分细项
  pureScore: number          // 清纯度 0-100
  nobilityScore: number      // 贵气 0-100
  wealthScore: number        // 富气 0-100
  careerScore: number        // 事业运 0-100
  marriageScore: number      // 婚姻运 0-100
  healthScore: number        // 健康运 0-100
  childrenScore: number      // 子女运 0-100
  // 古籍引用
  caseReference?: CaseReference
  // 解释模块
  explain?: GeJuExplain
}

export interface GeJuContext extends RuleContext {
  sixLines: { year: GanZhi; month: GanZhi; day: GanZhi; hour: GanZhi }
  dayGan: string
  dayElement: FiveElement
  dayYinYang: YinYang
  monthZhi: string
  monthElement: FiveElement
  monthGanShen: ShenShi
  strengthScore: number      // 日主强度 0-100
  relatedShens: Record<string, ShenShi>
  fiveElementCount: Record<FiveElement, number>
  hasTongGen: boolean        // 是否有通根
  hasTouGan: boolean         // 是否有透干
  touGanCount: number        // 透干数量
  tongGenCount: number       // 通根数量
  samePartyCount: number     // 同党数量
  diffPartyCount: number     // 异党数量
  isSeasonal: boolean        // 是否得令
}

// ========== 辅助函数 ==========

const GENERATE: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
}

// 克我者（官杀）：OVERCOME 的反向
const BE_OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '金', '土': '木', '水': '土', '火': '水', '金': '火',
}

// 生我者（印星）：GENERATE 的反向
const BE_GENERATE: Record<FiveElement, FiveElement> = {
  '木': '水', '火': '木', '土': '火', '金': '土', '水': '金',
}

function getElement(gan: string): FiveElement {
  const map: Record<string, FiveElement> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火',
    '戊': '土', '己': '土', '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
  }
  return map[gan] || '土'
}

function getYinYang(gan: string): YinYang {
  const map: Record<string, YinYang> = {
    '甲': '阳', '丙': '阳', '戊': '阳', '庚': '阳', '壬': '阳',
    '乙': '阴', '丁': '阴', '己': '阴', '辛': '阴', '癸': '阴',
  }
  return map[gan] || '阳'
}

// ========== 格局规则 ==========

export const GEJU_RULES: BaseRule<GeJuContext, Partial<GeJuResult>>[] = [

  // ===== 专旺格（最高优先级） =====
  {
    id: 'quzhi-ge',
    name: '曲直格',
    category: '专旺格',
    priority: 200,
    weight: 95,
    description: '甲乙木日主，地支全寅卯辰或亥卯未，木气纯一专旺',
    reference: '《滴天髓》专旺格篇',
    condition: (ctx) => {
      return ctx.dayElement === '木'
        && ctx.strengthScore >= 85
        && ctx.isSeasonal
        && ctx.tongGenCount >= 3
    },
    result: {
      name: '曲直格',
      category: '专旺格',
      isSpecial: true,
      score: 95,
      confidence: 90,
      description: '木日主得势，地支木气纯一，曲直仁寿之格。',
      reasons: ['日主得令', '木气专旺', '地支根气充足'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'yanshang-ge',
    name: '炎上格',
    category: '专旺格',
    priority: 200,
    weight: 95,
    description: '丙丁火日主，地支全巳午未或寅午戌，火气纯一专旺',
    reference: '《滴天髓》专旺格篇',
    condition: (ctx) => {
      return ctx.dayElement === '火'
        && ctx.strengthScore >= 85
        && ctx.isSeasonal
        && ctx.tongGenCount >= 3
    },
    result: {
      name: '炎上格',
      category: '专旺格',
      isSpecial: true,
      score: 95,
      confidence: 90,
      description: '火日主得势，火气纯一，光明磊落之格。',
      reasons: ['日主得令', '火气专旺', '地支根气充足'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'jiase-ge',
    name: '稼穑格',
    category: '专旺格',
    priority: 200,
    weight: 95,
    description: '戊己土日主，地支全辰戌丑未，土气纯一专旺',
    reference: '《滴天髓》专旺格篇',
    condition: (ctx) => {
      return ctx.dayElement === '土'
        && ctx.strengthScore >= 85
        && ctx.isSeasonal
        && ctx.tongGenCount >= 3
    },
    result: {
      name: '稼穑格',
      category: '专旺格',
      isSpecial: true,
      score: 95,
      confidence: 90,
      description: '土日主得势，土气纯一，厚重载物之格。',
      reasons: ['日主得令', '土气专旺', '地支根气充足'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'congge-ge',
    name: '从革格',
    category: '专旺格',
    priority: 200,
    weight: 95,
    description: '庚辛金日主，地支全申酉戌或巳酉丑，金气纯一专旺',
    reference: '《滴天髓》专旺格篇',
    condition: (ctx) => {
      return ctx.dayElement === '金'
        && ctx.strengthScore >= 85
        && ctx.isSeasonal
        && ctx.tongGenCount >= 3
    },
    result: {
      name: '从革格',
      category: '专旺格',
      isSpecial: true,
      score: 95,
      confidence: 90,
      description: '金日主得势，金气纯一，从革变革之格。',
      reasons: ['日主得令', '金气专旺', '地支根气充足'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'runxia-ge',
    name: '润下格',
    category: '专旺格',
    priority: 200,
    weight: 95,
    description: '壬癸水日主，地支全亥子丑或申子辰，水气纯一专旺',
    reference: '《滴天髓》专旺格篇',
    condition: (ctx) => {
      return ctx.dayElement === '水'
        && ctx.strengthScore >= 85
        && ctx.isSeasonal
        && ctx.tongGenCount >= 3
    },
    result: {
      name: '润下格',
      category: '专旺格',
      isSpecial: true,
      score: 95,
      confidence: 90,
      description: '水日主得势，水气纯一，润下流通之格。',
      reasons: ['日主得令', '水气专旺', '地支根气充足'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 从格（高优先级） =====
  {
    id: 'cong-guansha-zhen',
    name: '从官杀格',
    category: '从格',
    priority: 190,
    weight: 90,
    description: '日主极弱，官杀当令成势，日主不得不从',
    reference: '《子平真诠》从格篇',
    condition: (ctx) => {
      const guanShaElement = BE_OVERCOME[ctx.dayElement]
      return ctx.monthElement === guanShaElement
        && ctx.strengthScore < 20
        && !ctx.hasTongGen
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从官杀格',
      category: '从格',
      isSpecial: true,
      score: 90,
      confidence: 85,
      description: '日主极弱，官杀当令成势，真从官杀。',
      reasons: ['月令官杀', '日主无根', '异党势众'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'qiming-congsha',
    name: '弃命从杀',
    category: '从格',
    priority: 185,
    weight: 85,
    description: '七杀强旺，日主无根弃命相从',
    reference: '《三命通会》弃命从杀',
    condition: (ctx) => {
      const guanShaElement = BE_OVERCOME[ctx.dayElement]
      return ctx.monthElement === guanShaElement
        && ctx.strengthScore < 15
        && !ctx.hasTongGen
        && ctx.monthGanShen === '偏官'
    },
    result: {
      name: '弃命从杀',
      category: '从格',
      isSpecial: true,
      score: 88,
      confidence: 80,
      description: '七杀极旺，日主弃命相从。',
      reasons: ['七杀当令透干', '日主极弱无根'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'qiming-congguan',
    name: '弃命从官',
    category: '从格',
    priority: 185,
    weight: 85,
    description: '正官强旺，日主无根弃命相从',
    reference: '《三命通会》弃命从官',
    condition: (ctx) => {
      const guanShaElement = BE_OVERCOME[ctx.dayElement]
      return ctx.monthElement === guanShaElement
        && ctx.strengthScore < 15
        && !ctx.hasTongGen
        && ctx.monthGanShen === '正官'
    },
    result: {
      name: '弃命从官',
      category: '从格',
      isSpecial: true,
      score: 88,
      confidence: 80,
      description: '正官极旺，日主弃命相从。',
      reasons: ['正官当令透干', '日主极弱无根'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'cong-cai-zhen',
    name: '从财格',
    category: '从格',
    priority: 190,
    weight: 90,
    description: '日主极弱，财星当令成势，日主不得不从',
    reference: '《子平真诠》从格篇',
    condition: (ctx) => {
      // 我克者为财
      return ctx.monthElement === OVERCOME[ctx.dayElement]
        && ctx.strengthScore < 20
        && !ctx.hasTongGen
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从财格',
      category: '从格',
      isSpecial: true,
      score: 90,
      confidence: 85,
      description: '日主极弱，财星当令成势，真从财格。',
      reasons: ['月令财星', '日主无根', '异党势众'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'qiming-congcai',
    name: '弃命从财',
    category: '从格',
    priority: 185,
    weight: 85,
    description: '财星强旺，日主无根弃命相从',
    reference: '《三命通会》弃命从财',
    condition: (ctx) => {
      return ctx.monthElement === OVERCOME[ctx.dayElement]
        && ctx.strengthScore < 15
        && !ctx.hasTongGen
        && (ctx.monthGanShen === '正财' || ctx.monthGanShen === '偏财')
    },
    result: {
      name: '弃命从财',
      category: '从格',
      isSpecial: true,
      score: 88,
      confidence: 80,
      description: '财星极旺，日主弃命相从。',
      reasons: ['财星当令透干', '日主极弱无根'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'cong-er-zhen',
    name: '从儿格',
    category: '从格',
    priority: 185,
    weight: 88,
    description: '日主极弱，食伤当令成势，从儿格',
    reference: '《子平真诠》从格篇',
    condition: (ctx) => {
      const shiShangElement = GENERATE[ctx.dayElement]
      return ctx.monthElement === shiShangElement
        && ctx.strengthScore < 20
        && !ctx.hasTongGen
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从儿格',
      category: '从格',
      isSpecial: true,
      score: 88,
      confidence: 82,
      description: '日主极弱，食伤当令，从儿格。',
      reasons: ['月令食伤', '日主无根', '食伤泄秀'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'cong-yin-zhen',
    name: '从印格',
    category: '从格',
    priority: 180,
    weight: 85,
    description: '日主极弱，印星当令成势，从印格',
    reference: '《子平真诠》从格篇',
    condition: (ctx) => {
      // 生我者为印
      const yinElement = Object.entries(GENERATE).find(([_, v]) => v === ctx.dayElement)?.[0] as FiveElement
      return ctx.monthElement === yinElement
        && ctx.strengthScore < 20
        && !ctx.hasTongGen
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从印格',
      category: '从格',
      isSpecial: true,
      score: 85,
      confidence: 80,
      description: '日主极弱，印星当令，从印格。',
      reasons: ['月令印星', '日主无根', '印星生身'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'jia-cong',
    name: '假从格',
    category: '从格',
    priority: 170,
    weight: 70,
    description: '日主虽有微根，但被合克，从势不真',
    reference: '《滴天髓》假从篇',
    condition: (ctx) => {
      return ctx.strengthScore >= 15
        && ctx.strengthScore < 30
        && ctx.tongGenCount <= 1
        && ctx.diffPartyCount >= 2
    },
    result: {
      name: '假从格',
      category: '从格',
      isSpecial: true,
      score: 70,
      confidence: 65,
      description: '日主微有根气，从势不真，假从之格。',
      reasons: ['日主微有根气', '异党势众'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 化气格 =====
  {
    id: 'hua-qi-ge',
    name: '化气格',
    category: '化气格',
    priority: 160,
    weight: 80,
    description: '日干与月干或时干合，化气成局',
    reference: '《三命通会》化气格',
    condition: (ctx) => {
      // 简化判断：日月天干五合，且月令为化神
      const dayGan = ctx.dayGan
      const monthGan = ctx.sixLines.month.gan
      const heCombos: Record<string, { pair: string; hua: FiveElement }> = {
        '甲': { pair: '己', hua: '土' },
        '己': { pair: '甲', hua: '土' },
        '乙': { pair: '庚', hua: '金' },
        '庚': { pair: '乙', hua: '金' },
        '丙': { pair: '辛', hua: '水' },
        '辛': { pair: '丙', hua: '水' },
        '丁': { pair: '壬', hua: '木' },
        '壬': { pair: '丁', hua: '木' },
        '戊': { pair: '癸', hua: '火' },
        '癸': { pair: '戊', hua: '火' },
      }
      const combo = heCombos[dayGan]
      if (!combo) return false
      if (monthGan !== combo.pair) return false
      return ctx.monthElement === combo.hua && ctx.strengthScore > 50
    },
    result: {
      name: '化气格',
      category: '化气格',
      isSpecial: true,
      score: 80,
      confidence: 75,
      description: '天干五合，化气成局。',
      reasons: ['日月天干相合', '月令化神得势'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 调候格 =====
  {
    id: 'tiao-hou-zuoyong',
    name: '调候格',
    category: '调候格',
    priority: 150,
    weight: 75,
    description: '冬夏之命，调候为急，以调候用神定格局',
    reference: '《穷通宝鉴》调候篇',
    condition: (ctx) => {
      // 亥子月或巳午月，调候为急
      return (ctx.monthZhi === '亥' || ctx.monthZhi === '子' || ctx.monthZhi === '巳' || ctx.monthZhi === '午')
    },
    result: {
      name: '调候格',
      category: '调候格',
      isSpecial: false,
      score: 75,
      confidence: 70,
      description: '冬夏之命，调候为急。',
      reasons: ['冬寒夏热，调候为先'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'hannuan-zaoshi',
    name: '寒暖燥湿格',
    category: '调候格',
    priority: 145,
    weight: 70,
    description: '命局偏寒偏暖偏燥偏湿，以调和为用',
    reference: '《滴天髓》寒暖篇',
    condition: (ctx) => {
      return (ctx.monthZhi === '丑' || ctx.monthZhi === '未' || ctx.monthZhi === '辰' || ctx.monthZhi === '戌')
        && (ctx.strengthScore > 60 || ctx.strengthScore < 40)
    },
    result: {
      name: '寒暖燥湿格',
      category: '调候格',
      isSpecial: false,
      score: 70,
      confidence: 65,
      description: '四季之月，燥湿偏枯，调候为要。',
      reasons: ['四季月土旺', '燥湿需要调和'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 病药格 =====
  {
    id: 'bing-yao-ge',
    name: '病药格',
    category: '病药格',
    priority: 140,
    weight: 75,
    description: '命局有病，得药救之，以去病之神为用',
    reference: '《神峰通考》病药篇',
    condition: (ctx) => {
      // 身太强或太弱，且有明显偏枯
      return ctx.strengthScore > 75 || ctx.strengthScore < 25
    },
    result: {
      name: '病药格',
      category: '病药格',
      isSpecial: false,
      score: 75,
      confidence: 70,
      description: '命局偏枯为病，得药救之。',
      reasons: ['命局偏枯', '需要药神去病'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 扶抑格 =====
  {
    id: 'fu-yi-ge',
    name: '扶抑格',
    category: '扶抑格',
    priority: 130,
    weight: 70,
    description: '身强宜抑，身弱宜扶，以平衡为用',
    reference: '《子平真诠》用神篇',
    condition: (ctx) => {
      return ctx.strengthScore >= 30 && ctx.strengthScore <= 70
    },
    result: {
      name: '扶抑格',
      category: '扶抑格',
      isSpecial: false,
      score: 70,
      confidence: 70,
      description: '身有根气，以扶抑为用神。',
      reasons: ['身有根气', '需要扶抑平衡'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 通关格 =====
  {
    id: 'tong-guan-ge',
    name: '通关格',
    category: '通关格',
    priority: 120,
    weight: 65,
    description: '两行交战，得中间之神通关调和',
    reference: '《滴天髓》通关篇',
    condition: (ctx) => {
      // 简化：命局有明显相克两行，且有中间之神
      return ctx.samePartyCount >= 2 && ctx.diffPartyCount >= 2
        && ctx.strengthScore >= 40 && ctx.strengthScore <= 60
    },
    result: {
      name: '通关格',
      category: '通关格',
      isSpecial: false,
      score: 65,
      confidence: 60,
      description: '两行相战，得通关之神调和。',
      reasons: ['命局两势相当', '需要通关调和'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 正格（月令主气透干） =====
  {
    id: 'zheng-guan-tou',
    name: '正官格',
    category: '正格',
    priority: 100,
    weight: 85,
    description: '月令正官透干，官星清纯',
    reference: '《子平真诠》正官格',
    condition: (ctx) => ctx.monthGanShen === '正官',
    result: {
      name: '正官格',
      category: '正格',
      isSpecial: false,
      score: 85,
      confidence: 85,
      description: '月令正官透干，官星清纯。',
      reasons: ['月令正官', '官星透干'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'qi-sha-tou',
    name: '七杀格',
    category: '正格',
    priority: 100,
    weight: 85,
    description: '月令七杀透干，杀星有力',
    reference: '《子平真诠》七杀格',
    condition: (ctx) => ctx.monthGanShen === '偏官',
    result: {
      name: '七杀格',
      category: '正格',
      isSpecial: false,
      score: 85,
      confidence: 85,
      description: '月令七杀透干，杀星有力。',
      reasons: ['月令七杀', '杀星透干'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'zheng-yin-tou',
    name: '正印格',
    category: '正格',
    priority: 100,
    weight: 85,
    description: '月令正印透干，印星清纯',
    reference: '《子平真诠》正印格',
    condition: (ctx) => ctx.monthGanShen === '正印',
    result: {
      name: '正印格',
      category: '正格',
      isSpecial: false,
      score: 85,
      confidence: 85,
      description: '月令正印透干，印星清纯。',
      reasons: ['月令正印', '印星透干'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'pian-yin-tou',
    name: '偏印格',
    category: '正格',
    priority: 100,
    weight: 80,
    description: '月令偏印透干，枭印有力',
    reference: '《子平真诠》偏印格',
    condition: (ctx) => ctx.monthGanShen === '偏印',
    result: {
      name: '偏印格',
      category: '正格',
      isSpecial: false,
      score: 80,
      confidence: 80,
      description: '月令偏印透干，枭印有力。',
      reasons: ['月令偏印', '印星透干'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'shi-shen-tou',
    name: '食神格',
    category: '正格',
    priority: 100,
    weight: 85,
    description: '月令食神透干，食神泄秀',
    reference: '《子平真诠》食神格',
    condition: (ctx) => ctx.monthGanShen === '食神',
    result: {
      name: '食神格',
      category: '正格',
      isSpecial: false,
      score: 85,
      confidence: 85,
      description: '月令食神透干，食神泄秀。',
      reasons: ['月令食神', '食神通干'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'shang-guan-tou',
    name: '伤官格',
    category: '正格',
    priority: 100,
    weight: 80,
    description: '月令伤官透干，伤官泄秀',
    reference: '《子平真诠》伤官格',
    condition: (ctx) => ctx.monthGanShen === '伤官',
    result: {
      name: '伤官格',
      category: '正格',
      isSpecial: false,
      score: 80,
      confidence: 80,
      description: '月令伤官透干，伤官泄秀。',
      reasons: ['月令伤官', '伤神通干'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'zheng-cai-tou',
    name: '正财格',
    category: '正格',
    priority: 100,
    weight: 85,
    description: '月令正财透干，财星清纯',
    reference: '《子平真诠》正财格',
    condition: (ctx) => ctx.monthGanShen === '正财',
    result: {
      name: '正财格',
      category: '正格',
      isSpecial: false,
      score: 85,
      confidence: 85,
      description: '月令正财透干，财星清纯。',
      reasons: ['月令正财', '财星透干'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'pian-cai-tou',
    name: '偏财格',
    category: '正格',
    priority: 100,
    weight: 80,
    description: '月令偏财透干，偏财有力',
    reference: '《子平真诠》偏财格',
    condition: (ctx) => ctx.monthGanShen === '偏财',
    result: {
      name: '偏财格',
      category: '正格',
      isSpecial: false,
      score: 80,
      confidence: 80,
      description: '月令偏财透干，偏财有力。',
      reasons: ['月令偏财', '财星透干'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'bi-jian-tou',
    name: '比肩格',
    category: '正格',
    priority: 95,
    weight: 75,
    description: '月令比肩透干，比劫帮身',
    reference: '《子平真诠》建禄格',
    condition: (ctx) => ctx.monthGanShen === '比肩',
    result: {
      name: '比肩格',
      category: '正格',
      isSpecial: false,
      score: 75,
      confidence: 75,
      description: '月令比肩透干，比劫帮身。',
      reasons: ['月令比肩', '比劫透干'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'jie-cai-tou',
    name: '劫财格',
    category: '正格',
    priority: 95,
    weight: 70,
    description: '月令劫财透干，羊刃帮身',
    reference: '《子平真诠》羊刃格',
    condition: (ctx) => ctx.monthGanShen === '劫财',
    result: {
      name: '劫财格',
      category: '正格',
      isSpecial: false,
      score: 70,
      confidence: 70,
      description: '月令劫财透干，羊刃帮身。',
      reasons: ['月令劫财', '劫财透干'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 正格第二层：成格细化与层次判断（Priority 95-99） =====

  // 正官格-上格（官透有根有印有财）
  {
    id: 'zhengguan-shangge',
    name: '正官上格',
    category: '正格成格',
    priority: 99,
    weight: 95,
    description: '正官格中，官透有根、有印护、有财生，成上格',
    reference: '《子平真诠》正官格成格',
    condition: (ctx) => {
      if (ctx.monthGanShen !== '正官') return false
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印')
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return hasYin && hasCai && ctx.tongGenCount >= 1
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 95,
      confidence: 92,
      description: '官透有根，财官印全，正官上格，贵气逼人',
      reasons: ['官透有根', '财官印全', '格局纯正'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 正官格-中格（官透有根或有印）
  {
    id: 'zhengguan-zhongge',
    name: '正官中格',
    category: '正格成格',
    priority: 98,
    weight: 85,
    description: '正官格中，官透有根或有印护，成中格',
    reference: '《子平真诠》正官格成格',
    condition: (ctx) => {
      if (ctx.monthGanShen !== '正官') return false
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印')
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return (hasYin || hasCai || ctx.tongGenCount >= 1)
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 82,
      confidence: 80,
      description: '官透有根有辅，正官中格，可得小贵',
      reasons: ['官星透干', '有辅助之神'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 七杀格-上格（杀透有制有印化）
  {
    id: 'qisha-shangge',
    name: '七杀上格',
    category: '正格成格',
    priority: 99,
    weight: 95,
    description: '七杀格中，杀透有制、有印化杀，成上格',
    reference: '《子平真诠》七杀格成格',
    condition: (ctx) => {
      if (ctx.monthGanShen !== '偏官') return false
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印')
      const hasShi = stems.some(g => ctx.relatedShens[g] === '食神')
      return (hasYin || hasShi) && ctx.tongGenCount >= 1
    },
    result: {
      name: '七杀格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 95,
      confidence: 90,
      description: '杀透有制有化，杀印相生，七杀上格',
      reasons: ['杀透有制', '印化杀生', '格局纯正'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 七杀格-中格（杀透有根）
  {
    id: 'qisha-zhongge',
    name: '七杀中格',
    category: '正格成格',
    priority: 98,
    weight: 82,
    description: '七杀格中，杀透有根，成中格',
    reference: '《子平真诠》七杀格成格',
    condition: (ctx) => {
      if (ctx.monthGanShen !== '偏官') return false
      return ctx.tongGenCount >= 1 || ctx.strengthScore >= 40
    },
    result: {
      name: '七杀格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 78,
      confidence: 75,
      description: '杀透有根，七杀中格，武贵可期',
      reasons: ['七杀透干', '日主有根'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 正印格-上格（印透有根有官生）
  {
    id: 'zhengyin-shangge',
    name: '正印上格',
    category: '正格成格',
    priority: 99,
    weight: 92,
    description: '正印格中，印透有根、有官生印，成上格',
    reference: '《子平真诠》正印格成格',
    condition: (ctx) => {
      if (ctx.monthGanShen !== '正印') return false
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasGuan = stems.some(g => ctx.relatedShens[g] === '正官' || ctx.relatedShens[g] === '偏官')
      return hasGuan && ctx.tongGenCount >= 1
    },
    result: {
      name: '正印格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 92,
      confidence: 88,
      description: '印透有根，官印相生，正印上格，清贵之命',
      reasons: ['印透有根', '官印相生', '格局清贵'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 食神格-上格（食透有根有财生）
  {
    id: 'shishen-shangge',
    name: '食神上格',
    category: '正格成格',
    priority: 99,
    weight: 92,
    description: '食神格中，食透有根、有财泄秀，成上格',
    reference: '《子平真诠》食神格成格',
    condition: (ctx) => {
      if (ctx.monthGanShen !== '食神') return false
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return hasCai && ctx.tongGenCount >= 1
    },
    result: {
      name: '食神格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 92,
      confidence: 88,
      description: '食透有根，食神生财，食神上格，福禄丰厚',
      reasons: ['食神透干', '食神生财', '福禄丰厚'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 伤官格-上格（伤透有根有财泄）
  {
    id: 'shangguan-shangge',
    name: '伤官上格',
    category: '正格成格',
    priority: 99,
    weight: 90,
    description: '伤官格中，伤透有根、有财泄秀，成上格',
    reference: '《子平真诠》伤官格成格',
    condition: (ctx) => {
      if (ctx.monthGanShen !== '伤官') return false
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return hasCai && ctx.tongGenCount >= 1
    },
    result: {
      name: '伤官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 90,
      confidence: 85,
      description: '伤透有根，伤官生财，伤官上格，才华横溢',
      reasons: ['伤官透干', '伤官生财', '才华横溢'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 正财格-上格（财透有根有官护）
  {
    id: 'zhengcai-shangge',
    name: '正财上格',
    category: '正格成格',
    priority: 99,
    weight: 92,
    description: '正财格中，财透有根、有官护财，成上格',
    reference: '《子平真诠》正财格成格',
    condition: (ctx) => {
      if (ctx.monthGanShen !== '正财') return false
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasGuan = stems.some(g => ctx.relatedShens[g] === '正官')
      return hasGuan && ctx.tongGenCount >= 1
    },
    result: {
      name: '正财格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 92,
      confidence: 88,
      description: '财透有根，财官相生，正财上格，富贵双全',
      reasons: ['财透有根', '财官相生', '富贵双全'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 偏财格-上格（财透有根有食生）
  {
    id: 'piancai-shangge',
    name: '偏财上格',
    category: '正格成格',
    priority: 99,
    weight: 90,
    description: '偏财格中，财透有根、有食生财，成上格',
    reference: '《子平真诠》偏财格成格',
    condition: (ctx) => {
      if (ctx.monthGanShen !== '偏财') return false
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasShi = stems.some(g => ctx.relatedShens[g] === '食神' || ctx.relatedShens[g] === '伤官')
      return hasShi && ctx.tongGenCount >= 1
    },
    result: {
      name: '偏财格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 90,
      confidence: 85,
      description: '财透有根，食神生财，偏财上格，大富可期',
      reasons: ['偏财透干', '食神生财', '大富之格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 破格规则（Priority 300+，最高） =====
  // 破格规则：判断格局是否被破坏

  // 正官格破格
  {
    id: 'zhengguan-poge-guanke',
    name: '正官破格-官被克',
    category: '破格',
    priority: 92,
    weight: 95,
    description: '正官格中，官星被伤官克制破格',
    reference: '《子平真诠》正官格破格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasShangguan = stems.some(g => ctx.relatedShens[g] === '伤官')
      return ctx.monthGanShen === '正官' && hasShangguan
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 60,
      confidence: 70,
      description: '官星被伤官克制，格局有损',
      reasons: ['官星被克'],
      poGe: true,
      poGeReason: '官星被伤官克制，格局破败',
    },
  },
  {
    id: 'zhengguan-poge-qisya',
    name: '正官破格-七杀混杂',
    category: '破格',
    priority: 92,
    weight: 90,
    description: '正官格中，透出七杀混杂，官星不清',
    reference: '《子平真诠》正官格破格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasQisha = stems.some(g => ctx.relatedShens[g] === '偏官')
      return ctx.monthGanShen === '正官' && hasQisha
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 65,
      confidence: 80,
      description: '官杀混杂，格局不清',
      reasons: ['官杀混杂'],
      poGe: true,
      poGeReason: '正官格透出七杀，官星混杂不清',
    },
  },

  // 七杀格破格
  {
    id: 'qisha-poge-wuzhi',
    name: '七杀破格-无制',
    category: '破格',
    priority: 92,
    weight: 95,
    description: '七杀格中，七杀无制化',
    reference: '《子平真诠》七杀格破格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasZhengyin = stems.some(g => ctx.relatedShens[g] === '正印')
      const hasPianyin = stems.some(g => ctx.relatedShens[g] === '偏印')
      const hasShishen = stems.some(g => ctx.relatedShens[g] === '食神')
      return ctx.monthGanShen === '偏官' && !hasZhengyin && !hasPianyin && !hasShishen
    },
    result: {
      name: '七杀格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 50,
      confidence: 85,
      description: '七杀无制，凶险之格',
      reasons: ['七杀无制'],
      poGe: true,
      poGeReason: '七杀无制化，凶险难制',
    },
  },
  {
    id: 'qisha-poge-yinshang',
    name: '七杀破格-印被财破',
    category: '破格',
    priority: 88,
    weight: 85,
    description: '七杀格以印制，但印星被财星破',
    reference: '《滴天髓》七杀破格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印')
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return ctx.monthGanShen === '偏官' && hasYin && hasCai
    },
    result: {
      name: '七杀格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 55,
      confidence: 75,
      description: '印星被财星所破，七杀制化无力',
      reasons: ['印被财破'],
      poGe: true,
      poGeReason: '印星被财星所破，制杀无力',
    },
  },

  // 财格破格
  {
    id: 'cai-poge-jiecai',
    name: '财格破格-劫财分财',
    category: '破格',
    priority: 88,
    weight: 90,
    description: '财格中，劫财透干分财',
    reference: '《子平真诠》财格破格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasJiecai = stems.some(g => ctx.relatedShens[g] === '劫财')
      return (ctx.monthGanShen === '正财' || ctx.monthGanShen === '偏财') && hasJiecai
    },
    result: {
      name: '财格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 60,
      confidence: 80,
      description: '劫财分财，财星不聚',
      reasons: ['劫财分财'],
      poGe: true,
      poGeReason: '劫财透干，财星被分',
    },
  },

  // 印格破格
  {
    id: 'yin-poge-caixin',
    name: '印格破格-财星破印',
    category: '破格',
    priority: 88,
    weight: 90,
    description: '印格中，财星透干破印',
    reference: '《子平真诠》印格破格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return (ctx.monthGanShen === '正印' || ctx.monthGanShen === '偏印') && hasCai
    },
    result: {
      name: '印格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 55,
      confidence: 80,
      description: '财星破印，印星受损',
      reasons: ['财星破印'],
      poGe: true,
      poGeReason: '财星透干，印星被破',
    },
  },

  // 食神格破格
  {
    id: 'shishen-poge-xiaoshen',
    name: '食神破格-枭神夺食',
    category: '破格',
    priority: 92,
    weight: 95,
    description: '食神格中，枭神夺食',
    reference: '《子平真诠》食神格破格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasPianyin = stems.some(g => ctx.relatedShens[g] === '偏印')
      return ctx.monthGanShen === '食神' && hasPianyin
    },
    result: {
      name: '食神格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 45,
      confidence: 90,
      description: '枭神夺食，凶险之格',
      reasons: ['枭神夺食'],
      poGe: true,
      poGeReason: '偏印夺食，食神受损',
    },
  },
  {
    id: 'shishen-poge-shangguan',
    name: '食神破格-伤官见官',
    category: '破格',
    priority: 92,
    weight: 90,
    description: '食神格中，伤官见官',
    reference: '《滴天髓》食神破格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasShangguan = stems.some(g => ctx.relatedShens[g] === '伤官')
      const hasGuan = stems.some(g => ctx.relatedShens[g] === '正官' || ctx.relatedShens[g] === '偏官')
      return ctx.monthGanShen === '食神' && hasShangguan && hasGuan
    },
    result: {
      name: '食神格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 50,
      confidence: 85,
      description: '伤官见官，格局破败',
      reasons: ['伤官见官'],
      poGe: true,
      poGeReason: '伤官见官，格局破败',
    },
  },

  // 伤官格破格
  {
    id: 'shangguan-poge-guansha',
    name: '伤官破格-无财通关',
    category: '破格',
    priority: 88,
    weight: 85,
    description: '伤官格中，伤官见官无财通关',
    reference: '《子平真诠》伤官格破格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasShangguan = stems.some(g => ctx.relatedShens[g] === '伤官')
      const hasGuan = stems.some(g => ctx.relatedShens[g] === '正官')
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return ctx.monthGanShen === '伤官' && hasShangguan && hasGuan && !hasCai
    },
    result: {
      name: '伤官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 55,
      confidence: 75,
      description: '伤官见官无财通关，格局不稳',
      reasons: ['伤官见官无财通关'],
      poGe: true,
      poGeReason: '伤官见官无财通关，格局不稳',
    },
  },

  // ===== 正格成格细化（Priority 200-250） =====

  // 正官格成格
  {
    id: 'zhengguan-chengge-wugen',
    name: '正官成格-官有根',
    category: '正格成格',
    priority: 220,
    weight: 85,
    description: '正官格中，官星通根有力',
    reference: '《子平真诠》正官格成格',
    condition: (ctx) => {
      return ctx.monthGanShen === '正官' && ctx.strengthScore >= 35 && ctx.strengthScore <= 70
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 90,
      confidence: 85,
      description: '官星清正有根，格局纯正',
      reasons: ['官星清纯', '身官相当'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 七杀格成格
  {
    id: 'qisha-chengge-youzhi',
    name: '七杀成格-杀有制',
    category: '正格成格',
    priority: 220,
    weight: 88,
    description: '七杀格中，七杀有印制或食神制化',
    reference: '《子平真诠》七杀格成格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印')
      const hasShishen = stems.some(g => ctx.relatedShens[g] === '食神')
      return ctx.monthGanShen === '偏官' && (hasYin || hasShishen)
    },
    result: {
      name: '七杀格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 88,
      confidence: 85,
      description: '七杀有制，格局有成',
      reasons: ['七杀有制', '杀印相生或食神制杀'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 食神格成格
  {
    id: 'shishen-chengge-wuxie',
    name: '食神成格-食神无邪',
    category: '正格成格',
    priority: 220,
    weight: 85,
    description: '食神格中，食神清纯无杂',
    reference: '《子平真诠》食神格成格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasPianyin = stems.some(g => ctx.relatedShens[g] === '偏印')
      const hasShangguan = stems.some(g => ctx.relatedShens[g] === '伤官')
      return ctx.monthGanShen === '食神' && !hasPianyin && !hasShangguan
    },
    result: {
      name: '食神格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 90,
      confidence: 85,
      description: '食神清纯泄秀，格局清朗',
      reasons: ['食神清纯', '无枭神伤官混杂'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 财格成格
  {
    id: 'cai-chengge-caiyouli',
    name: '财格成格-财星有力',
    category: '正格成格',
    priority: 220,
    weight: 85,
    description: '财格中，财星有力且不被分夺',
    reference: '《子平真诠》财格成格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasJiecai = stems.some(g => ctx.relatedShens[g] === '劫财')
      return (ctx.monthGanShen === '正财' || ctx.monthGanShen === '偏财') && !hasJiecai && ctx.tongGenCount >= 2
    },
    result: {
      name: '财格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 88,
      confidence: 80,
      description: '财星有力不被分夺，格局有成',
      reasons: ['财星有力', '无劫财分夺'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 官印相生格
  {
    id: 'guanyin-xiangsheng',
    name: '官印相生',
    category: '正格成格',
    priority: 218,
    weight: 88,
    description: '正官配正印，官印相生，贵格',
    reference: '《子平真诠》官印相生',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasGuan = stems.some(g => ctx.relatedShens[g] === '正官')
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印')
      return hasGuan && hasYin && ctx.monthGanShen === '正官'
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 92,
      confidence: 85,
      description: '官印相生，功名显达',
      reasons: ['官星当令', '印星相随', '官印相生'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 官财相生格
  {
    id: 'guancai-xiangsheng',
    name: '官财相生',
    category: '正格成格',
    priority: 216,
    weight: 85,
    description: '正官配正财，财生官旺',
    reference: '《渊海子平》财官相生',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasGuan = stems.some(g => ctx.relatedShens[g] === '正官')
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return hasGuan && hasCai && ctx.monthGanShen === '正官'
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 88,
      confidence: 80,
      description: '财生官旺，富贵双全',
      reasons: ['官星当令', '财星生官', '官财相生'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 官星独清
  {
    id: 'guanxing-duqing',
    name: '官星独清',
    category: '正格成格',
    priority: 214,
    weight: 86,
    description: '正官一位，清纯不杂',
    reference: '《滴天髓》官星清纯',
    condition: (ctx) => {
      if (ctx.monthGanShen !== '正官') return false
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      let guanCount = 0
      let shaCount = 0
      for (const g of stems) {
        if (ctx.relatedShens[g] === '正官') guanCount++
        if (ctx.relatedShens[g] === '偏官') shaCount++
      }
      return guanCount === 1 && shaCount === 0
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 90,
      confidence: 82,
      description: '官星独清，贵而纯粹',
      reasons: ['正官一位', '无杀混杂', '官星独清'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真官格
  {
    id: 'zhen-guan-ge',
    name: '真官格',
    category: '正格成格',
    priority: 212,
    weight: 90,
    description: '月令正官，官旺身强，真官格',
    reference: '《三命通会》真官格',
    condition: (ctx) => {
      return ctx.monthGanShen === '正官'
        && ctx.isSeasonal === false
        && ctx.monthElement === BE_OVERCOME[ctx.dayElement]
        && ctx.strengthScore >= 40
        && ctx.strengthScore <= 65
        && ctx.tongGenCount >= 1
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 95,
      confidence: 88,
      description: '真官格，大贵之命',
      reasons: ['月令正官', '身官两停', '真官大贵'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 官杀混杂格
  {
    id: 'guansha-hunza',
    name: '官杀混杂',
    category: '破格',
    priority: 210,
    weight: 85,
    description: '正官七杀并见，官杀混杂',
    reference: '《子平真诠》官杀混杂',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasGuan = stems.some(g => ctx.relatedShens[g] === '正官')
      const hasSha = stems.some(g => ctx.relatedShens[g] === '偏官')
      return hasGuan && hasSha
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 55,
      confidence: 65,
      description: '官杀混杂，格局不清',
      reasons: ['官杀并见', '格局混杂'],
      poGe: true,
      poGeReason: '官杀混杂，格局不清',
    },
  },

  // 官重身轻
  {
    id: 'guanzhong-shenqing',
    name: '官重身轻',
    category: '破格',
    priority: 208,
    weight: 80,
    description: '官旺身弱，官重身轻',
    reference: '《滴天髓》官重身轻',
    condition: (ctx) => {
      return ctx.monthGanShen === '正官' && ctx.strengthScore < 35
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 50,
      confidence: 60,
      description: '官重身轻，不堪官杀',
      reasons: ['身弱官旺', '官重身轻'],
      poGe: true,
      poGeReason: '身弱不胜官，官重身轻',
    },
  },

  // 官轻印重
  {
    id: 'guanqing-yinzhong',
    name: '官轻印重',
    category: '破格',
    priority: 206,
    weight: 78,
    description: '官星弱而印星重，母多灭子',
    reference: '《子平真诠》官轻印重',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const yinCount = stems.filter(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印').length
      return ctx.monthGanShen === '正官' && yinCount >= 2 && ctx.strengthScore > 60
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 60,
      confidence: 65,
      description: '官轻印重，印多不生',
      reasons: ['印星太重', '官星被泄', '官轻印重'],
      poGe: true,
      poGeReason: '印多官泄，官轻印重',
    },
  },

  // 真七杀格
  {
    id: 'zhen-qisha-ge',
    name: '真七杀格',
    category: '正格成格',
    priority: 204,
    weight: 90,
    description: '月令七杀，杀旺有制，真杀格',
    reference: '《三命通会》真七杀格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasZhi = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印' || ctx.relatedShens[g] === '食神')
      return ctx.monthGanShen === '偏官'
        && hasZhi
        && ctx.strengthScore >= 40
        && ctx.strengthScore <= 65
    },
    result: {
      name: '七杀格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 92,
      confidence: 86,
      description: '真七杀格，杀印相生或食神制杀，大贵',
      reasons: ['月令七杀', '七杀有制', '真杀大贵'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 杀印相生格
  {
    id: 'shayin-xiangsheng',
    name: '杀印相生',
    category: '正格成格',
    priority: 202,
    weight: 88,
    description: '七杀配印，杀印相生，武贵',
    reference: '《子平真诠》杀印相生',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasSha = stems.some(g => ctx.relatedShens[g] === '偏官')
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印')
      return hasSha && hasYin && ctx.monthGanShen === '偏官'
    },
    result: {
      name: '七杀格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 90,
      confidence: 84,
      description: '杀印相生，兵权在握',
      reasons: ['七杀当令', '印星化杀', '杀印相生'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真食神格
  {
    id: 'zhen-shishen-ge',
    name: '真食神格',
    category: '正格成格',
    priority: 200,
    weight: 88,
    description: '月令食神，身强食旺，真食神格',
    reference: '《三命通会》真食神格',
    condition: (ctx) => {
      return ctx.monthGanShen === '食神'
        && ctx.strengthScore >= 50
        && ctx.strengthScore <= 80
        && ctx.tongGenCount >= 1
    },
    result: {
      name: '食神格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 90,
      confidence: 82,
      description: '真食神格，福禄丰厚',
      reasons: ['月令食神', '身强食旺', '真食神格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真伤官格
  {
    id: 'zhen-shangguan-ge',
    name: '真伤官格',
    category: '正格成格',
    priority: 198,
    weight: 86,
    description: '月令伤官，身强伤旺，真伤官格',
    reference: '《三命通会》真伤官格',
    condition: (ctx) => {
      return ctx.monthGanShen === '伤官'
        && ctx.strengthScore >= 50
        && ctx.strengthScore <= 80
        && ctx.tongGenCount >= 1
    },
    result: {
      name: '伤官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 88,
      confidence: 80,
      description: '真伤官格，聪明多才',
      reasons: ['月令伤官', '身强伤旺', '真伤官格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真财格
  {
    id: 'zhen-cai-ge',
    name: '真财格',
    category: '正格成格',
    priority: 196,
    weight: 88,
    description: '月令财星，身旺财旺，真财格',
    reference: '《三命通会》真财格',
    condition: (ctx) => {
      return (ctx.monthGanShen === '正财' || ctx.monthGanShen === '偏财')
        && ctx.strengthScore >= 45
        && ctx.strengthScore <= 75
        && ctx.tongGenCount >= 1
    },
    result: {
      name: '财格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 90,
      confidence: 82,
      description: '真财格，大富之命',
      reasons: ['月令财星', '身旺财旺', '真财大富'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真正印格
  {
    id: 'zhen-zhengyin-ge',
    name: '真正印格',
    category: '正格成格',
    priority: 194,
    weight: 86,
    description: '月令正印，身弱印旺，真印格',
    reference: '《三命通会》真印格',
    condition: (ctx) => {
      return ctx.monthGanShen === '正印'
        && ctx.strengthScore >= 25
        && ctx.strengthScore <= 50
        && ctx.tongGenCount >= 1
    },
    result: {
      name: '正印格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 88,
      confidence: 80,
      description: '真印格，文贵之命',
      reasons: ['月令正印', '印星生身', '真印文贵'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真偏印格
  {
    id: 'zhen-pianyin-ge',
    name: '真偏印格',
    category: '正格成格',
    priority: 193,
    weight: 84,
    description: '月令偏印，身弱印旺，真偏印格',
    reference: '《三命通会》真偏印格',
    condition: (ctx) => {
      return ctx.monthGanShen === '偏印'
        && ctx.strengthScore >= 25
        && ctx.strengthScore <= 50
        && ctx.tongGenCount >= 1
    },
    result: {
      name: '偏印格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 86,
      confidence: 78,
      description: '真偏印格，异路功名',
      reasons: ['月令偏印', '枭印生身', '真偏印格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真比肩格
  {
    id: 'zhen-bijian-ge',
    name: '真比肩格',
    category: '正格成格',
    priority: 192,
    weight: 82,
    description: '月令比肩，身旺有制，真比肩格',
    reference: '《三命通会》真比肩格',
    condition: (ctx) => {
      return ctx.monthGanShen === '比肩'
        && ctx.strengthScore >= 55
        && ctx.strengthScore <= 80
        && ctx.tongGenCount >= 1
    },
    result: {
      name: '比肩格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 82,
      confidence: 75,
      description: '真比肩格，朋友助力',
      reasons: ['月令比肩', '身旺有制', '真比肩格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 格局层次判断（Priority 50-100） =====

  // 格局高低
  {
    id: 'geju-gao-wanzheng',
    name: '格局高-完美成格',
    category: '格局层次',
    priority: 80,
    weight: 90,
    description: '命局格局完美，无破无杂',
    reference: '《滴天髓》格局高低',
    condition: (ctx) => {
      return ctx.strengthScore >= 35 && ctx.strengthScore <= 70 && ctx.touGanCount >= 2
    },
    result: {
      name: '普通格局' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 85,
      confidence: 75,
      description: '命局平衡，格局清朗，有贵气',
      reasons: ['身官两停', '格局清纯'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'geju-gao-tiaohou',
    name: '格局高-调候为急',
    category: '格局层次',
    priority: 80,
    weight: 88,
    description: '命局调候得用，格局加分',
    reference: '《穷通宝鉴》调候为急',
    condition: (ctx) => {
      const isDonghan = ctx.monthZhi === '子' || ctx.monthZhi === '亥'
      const isXialie = ctx.monthZhi === '午' || ctx.monthZhi === '巳'
      return (isDonghan || isXialie) && ctx.strengthScore >= 20 && ctx.strengthScore <= 80
    },
    result: {
      name: '普通格局' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 88,
      confidence: 80,
      description: '调候为急，用神得力，格局有贵',
      reasons: ['调候为急', '寒暖得调'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 格局成败
  {
    id: 'geju-chenggong',
    name: '格局成-用神有力',
    category: '格局层次',
    priority: 75,
    weight: 85,
    description: '命局用神有力，格局有成',
    reference: '《子平真诠》用神篇',
    condition: (ctx) => {
      return ctx.strengthScore >= 25 && ctx.strengthScore <= 75
    },
    result: {
      name: '普通格局' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 80,
      confidence: 80,
      description: '日主中和，用神得力，格局小成',
      reasons: ['身有根气', '用神有力'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'geju-bai',
    name: '格局败-偏枯太重',
    category: '格局层次',
    priority: 75,
    weight: 80,
    description: '命局偏枯严重，格局难成',
    reference: '《滴天髓》偏枯论',
    condition: (ctx) => {
      return ctx.strengthScore < 15
    },
    result: {
      name: '普通格局' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 45,
      confidence: 70,
      description: '命局偏枯，格局难成',
      reasons: ['偏枯太重', '用神难寻'],
      poGe: true,
      poGeReason: '偏枯太重，难以取用',
    },
  },

  // ===== 清纯程度判断（Priority 60-80） =====

  {
    id: 'qingcun-zhenguan',
    name: '清纯-官星清',
    category: '清纯判断',
    priority: 70,
    weight: 80,
    description: '正官格中，官星清纯无杂',
    reference: '《子平真诠》官星清纯',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasQisha = stems.some(g => ctx.relatedShens[g] === '偏官')
      return ctx.monthGanShen === '正官' && !hasQisha
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 88,
      confidence: 80,
      description: '官星清纯，格局清正',
      reasons: ['官星清纯无杂'],
      poGe: false,
      poGeReason: '',
    },
  },
  {
    id: 'qingcun-shishen',
    name: '清纯-食神清',
    category: '清纯判断',
    priority: 70,
    weight: 80,
    description: '食神格中，食神清纯无杂',
    reference: '《子平真诠》食神清纯',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasPianyin = stems.some(g => ctx.relatedShens[g] === '偏印')
      const hasShangguan = stems.some(g => ctx.relatedShens[g] === '伤官')
      return ctx.monthGanShen === '食神' && !hasPianyin && !hasShangguan
    },
    result: {
      name: '食神格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 88,
      confidence: 80,
      description: '食神清纯，格局清朗',
      reasons: ['食神清纯无杂'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 特殊格局补充（Priority 150-200） =====

  // 飞天禄马格
  {
    id: 'feitian-luma',
    name: '飞天禄马',
    category: '特殊格局',
    priority: 180,
    weight: 88,
    description: '庚子、壬子日生，子多冲午',
    reference: '《渊海子平》飞天禄马',
    condition: (ctx) => {
      const dayZhi = ctx.sixLines.day.zhi
      const ziCount = [ctx.sixLines.year.zhi, ctx.sixLines.month.zhi, ctx.sixLines.day.zhi, ctx.sixLines.hour.zhi]
        .filter(z => z === '子').length
      return (dayZhi === '子') && ziCount >= 3 && ctx.dayGan === '庚'
    },
    result: {
      name: '飞天禄马' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 90,
      confidence: 75,
      description: '庚子日地支多子，冲起午火禄马，奇特之格',
      reasons: ['子多冲午', '飞天禄马'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 金神格
  {
    id: 'jinshen-ge',
    name: '金神格',
    category: '特殊格局',
    priority: 170,
    weight: 85,
    description: '乙日生，支逢酉丑金多',
    reference: '《三命通会》金神格',
    condition: (ctx) => {
      const metalZhi = ['申', '酉', '戌', '丑']
      const metalCount = [ctx.sixLines.year.zhi, ctx.sixLines.month.zhi, ctx.sixLines.day.zhi, ctx.sixLines.hour.zhi]
        .filter(z => metalZhi.includes(z)).length
      return ctx.dayGan === '乙' && metalCount >= 3
    },
    result: {
      name: '金神格' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 85,
      confidence: 75,
      description: '乙木日主，地支金多，金神得用',
      reasons: ['金神得地', '乙木遇金'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 魁罡格
  {
    id: 'kuigang-ge',
    name: '魁罡格',
    category: '特殊格局',
    priority: 175,
    weight: 85,
    description: '庚辰、壬辰、戊戌、庚戌日生',
    reference: '《渊海子平》魁罡格',
    condition: (ctx) => {
      const dayZhi = ctx.sixLines.day.zhi
      const dayGan = ctx.sixLines.day.gan
      const kuiGangCombis = ['庚辰', '壬辰', '戊戌', '庚戌']
      const ganzhi = dayGan + dayZhi
      return kuiGangCombis.includes(ganzhi)
    },
    result: {
      name: '魁罡格' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 82,
      confidence: 78,
      description: '魁罡日生，刚强之格，忌见财官',
      reasons: ['魁罡日主', '刚强之格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 六乙鼠贵格
  {
    id: 'liuyi-shugui',
    name: '六乙鼠贵格',
    category: '特殊格局',
    priority: 175,
    weight: 82,
    description: '六乙日生时遇子，以子为贵神',
    reference: '《三命通会》六乙鼠贵格',
    condition: (ctx) => {
      const dayGan = ctx.dayGan
      const hourZhi = ctx.sixLines.hour.zhi
      const yiDays = ['乙']
      return yiDays.includes(dayGan) && hourZhi === '子'
    },
    result: {
      name: '六乙鼠贵' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 80,
      confidence: 75,
      description: '六乙鼠贵，贵神加临',
      reasons: ['六乙日', '子时贵神'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 壬骑龙背格
  {
    id: 'renqi-longbei',
    name: '壬骑龙背格',
    category: '特殊格局',
    priority: 175,
    weight: 85,
    description: '壬辰日生，壬骑龙背',
    reference: '《三命通会》壬骑龙背格',
    condition: (ctx) => {
      return ctx.dayGan === '壬' && ctx.sixLines.day.zhi === '辰'
    },
    result: {
      name: '壬骑龙背' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 83,
      confidence: 78,
      description: '壬骑龙背，大贵之格',
      reasons: ['壬辰日', '壬骑龙背'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 六阴朝阳格
  {
    id: 'liuyin-chaoyang',
    name: '六阴朝阳格',
    category: '特殊格局',
    priority: 175,
    weight: 83,
    description: '六辛日生时遇子，六阴朝阳',
    reference: '《三命通会》六阴朝阳格',
    condition: (ctx) => {
      return ctx.dayGan === '辛' && ctx.sixLines.hour.zhi === '子'
    },
    result: {
      name: '六阴朝阳' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 81,
      confidence: 76,
      description: '六阴朝阳，贵气自来',
      reasons: ['六辛日', '子时朝阳'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 六甲趋乾格
  {
    id: 'liujia-quqian',
    name: '六甲趋乾格',
    category: '特殊格局',
    priority: 175,
    weight: 82,
    description: '六甲日生时遇亥，趋乾格',
    reference: '《三命通会》六甲趋乾格',
    condition: (ctx) => {
      return ctx.dayGan === '甲' && ctx.sixLines.hour.zhi === '亥'
    },
    result: {
      name: '六甲趋乾' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 80,
      confidence: 75,
      description: '六甲趋乾，贵气加临',
      reasons: ['六甲日', '亥时趋乾'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 井栏叉格
  {
    id: 'jinglan-cha',
    name: '井栏叉格',
    category: '特殊格局',
    priority: 170,
    weight: 80,
    description: '庚申日生，地支全申子辰，井栏叉格',
    reference: '《三命通会》井栏叉格',
    condition: (ctx) => {
      if (ctx.dayGan !== '庚') return false
      const zhis = [ctx.sixLines.year.zhi, ctx.sixLines.month.zhi, ctx.sixLines.day.zhi, ctx.sixLines.hour.zhi]
      const hasShen = zhis.includes('申')
      const hasZi = zhis.includes('子')
      const hasChen = zhis.includes('辰')
      return hasShen && hasZi && hasChen
    },
    result: {
      name: '井栏叉格' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 82,
      confidence: 75,
      description: '井栏叉格，金水相涵',
      reasons: ['庚申日主', '申子辰全', '井栏叉格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 倒冲格
  {
    id: 'daochong-ge',
    name: '倒冲格',
    category: '特殊格局',
    priority: 170,
    weight: 78,
    description: '丙午日生，地支多午，倒冲禄马',
    reference: '《三命通会》倒冲格',
    condition: (ctx) => {
      if (ctx.dayGan !== '丙') return false
      const zhis = [ctx.sixLines.year.zhi, ctx.sixLines.month.zhi, ctx.sixLines.day.zhi, ctx.sixLines.hour.zhi]
      const wuCount = zhis.filter(z => z === '午').length
      return wuCount >= 2
    },
    result: {
      name: '倒冲格' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 78,
      confidence: 72,
      description: '倒冲禄马，丙日午多',
      reasons: ['丙午日主', '午多倒冲'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 天元一气格
  {
    id: 'tianyuan-yiqi',
    name: '天元一气',
    category: '特殊格',
    priority: 175,
    weight: 85,
    description: '四柱天干皆同，天元一气，贵格',
    reference: '《三命通会》天元一气格',
    condition: (ctx) => {
      const gan = ctx.dayGan
      return ctx.sixLines.year.gan === gan
        && ctx.sixLines.month.gan === gan
        && ctx.sixLines.hour.gan === gan
    },
    result: {
      name: '天元一气' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 90,
      confidence: 82,
      description: '天元一气，四柱皆同，贵不可言',
      reasons: ['四干相同', '天元一气', '大贵之格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 地元一气格
  {
    id: 'diyuan-yiqi',
    name: '地元一气',
    category: '特殊格',
    priority: 172,
    weight: 82,
    description: '四柱地支皆同，地元一气',
    reference: '《渊海子平》地元一气格',
    condition: (ctx) => {
      const zhi = ctx.sixLines.day.zhi
      return ctx.sixLines.year.zhi === zhi
        && ctx.sixLines.month.zhi === zhi
        && ctx.sixLines.hour.zhi === zhi
    },
    result: {
      name: '地元一气' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 85,
      confidence: 78,
      description: '地元一气，四支皆同',
      reasons: ['四支相同', '地元一气'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 两神成象格
  {
    id: 'liangshen-chengxiang',
    name: '两神成象',
    category: '特殊格',
    priority: 168,
    weight: 80,
    description: '命局只有两种五行，两神成象',
    reference: '《滴天髓》两神成象',
    condition: (ctx) => {
      const fes = Object.entries(ctx.fiveElementCount).filter(([, v]) => v > 0)
      return fes.length === 2
    },
    result: {
      name: '两神成象' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 82,
      confidence: 75,
      description: '两神成象，格局清纯',
      reasons: ['五行仅二', '两神成象', '格局清纯'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 三奇贵人
  {
    id: 'sanqi-guiren',
    name: '三奇贵人',
    category: '特殊格',
    priority: 165,
    weight: 78,
    description: '天干顺排甲戊庚或乙丙丁或壬癸辛为三奇',
    reference: '《三命通会》三奇贵人',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      // 甲戊庚 天上三奇
      if (stems.includes('甲') && stems.includes('戊') && stems.includes('庚')) return true
      // 乙丙丁 地上三奇
      if (stems.includes('乙') && stems.includes('丙') && stems.includes('丁')) return true
      // 壬癸辛 人中三奇
      if (stems.includes('壬') && stems.includes('癸') && stems.includes('辛')) return true
      return false
    },
    result: {
      name: '三奇贵人' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 80,
      confidence: 72,
      description: '三奇贵人，命带三奇，主吉',
      reasons: ['天干三奇', '贵人相助'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 金白水清
  {
    id: 'jinbai-shuiqing',
    name: '金白水清',
    category: '特殊格',
    priority: 162,
    weight: 78,
    description: '庚辛日主，金水相生，金白水清',
    reference: '《渊海子平》金白水清',
    condition: (ctx) => {
      if (ctx.dayElement !== '金') return false
      const fes = ctx.fiveElementCount
      return fes['金'] >= 2 && fes['水'] >= 2 && fes['火'] === 0
    },
    result: {
      name: '金白水清' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 80,
      confidence: 72,
      description: '金白水清，聪明秀气',
      reasons: ['金日水盛', '金白水清', '聪明好学'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 木火通明
  {
    id: 'muhuo-tongming',
    name: '木火通明',
    category: '特殊格',
    priority: 160,
    weight: 78,
    description: '甲乙日主，木火相生，木火通明',
    reference: '《滴天髓》木火通明',
    condition: (ctx) => {
      if (ctx.dayElement !== '木') return false
      const fes = ctx.fiveElementCount
      return fes['木'] >= 2 && fes['火'] >= 2 && fes['金'] === 0
    },
    result: {
      name: '木火通明' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 80,
      confidence: 72,
      description: '木火通明，文采斐然',
      reasons: ['木日火盛', '木火通明', '文章盖世'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 水火既济
  {
    id: 'shuihuo-jiji',
    name: '水火既济',
    category: '特殊格',
    priority: 158,
    weight: 75,
    description: '水火相济，阴阳调和',
    reference: '《周易》既济卦',
    condition: (ctx) => {
      const fes = ctx.fiveElementCount
      return fes['水'] >= 2 && fes['火'] >= 2
        && Math.abs(fes['水'] - fes['火']) <= 1
    },
    result: {
      name: '水火既济' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 78,
      confidence: 70,
      description: '水火既济，阴阳调和',
      reasons: ['水火相济', '阴阳平衡'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 火土成慈
  {
    id: 'huotu-chengci',
    name: '火土成慈',
    category: '特殊格',
    priority: 156,
    weight: 75,
    description: '火土相生，敦厚仁慈',
    reference: '《滴天髓》火土成慈',
    condition: (ctx) => {
      if (ctx.dayElement !== '火') return false
      const fes = ctx.fiveElementCount
      return fes['火'] >= 2 && fes['土'] >= 2 && fes['水'] === 0
    },
    result: {
      name: '火土成慈' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 78,
      confidence: 70,
      description: '火土成慈，厚德载物',
      reasons: ['火日土盛', '火土成慈', '敦厚仁慈'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 金寒水冷
  {
    id: 'jinhan-shuiling',
    name: '金寒水冷',
    category: '特殊格',
    priority: 154,
    weight: 72,
    description: '冬月金旺，金寒水冷，需火调候',
    reference: '《穷通宝鉴》金寒水冷',
    condition: (ctx) => {
      if (ctx.dayElement !== '金') return false
      if (ctx.monthElement !== '水') return false
      const fes = ctx.fiveElementCount
      return fes['金'] >= 2 && fes['水'] >= 2 && fes['火'] === 0
    },
    result: {
      name: '金寒水冷' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 72,
      confidence: 68,
      description: '金寒水冷，冬金喜火',
      reasons: ['金日水月', '金寒水冷', '需火调候'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 财官双美
  {
    id: 'caiguan-shuangmei',
    name: '财官双美',
    category: '特殊格',
    priority: 152,
    weight: 80,
    description: '财官并旺，富贵双全',
    reference: '《三命通会》财官双美',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasGuan = stems.some(g => ctx.relatedShens[g] === '正官' || ctx.relatedShens[g] === '偏官')
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return hasGuan && hasCai && ctx.tongGenCount >= 1
    },
    result: {
      name: '财官双美' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 85,
      confidence: 75,
      description: '财官双美，富贵双全',
      reasons: ['财旺', '官旺', '财官双美'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 杀印双清
  {
    id: 'shayin-shuangqing',
    name: '杀印双清',
    category: '特殊格',
    priority: 150,
    weight: 82,
    description: '七杀配印，杀印相生，武贵',
    reference: '《子平真诠》杀印相生',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasSha = stems.some(g => ctx.relatedShens[g] === '偏官')
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印')
      return hasSha && hasYin && ctx.monthGanShen === '偏官'
    },
    result: {
      name: '杀印双清' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 85,
      confidence: 78,
      description: '杀印双清，化杀为权',
      reasons: ['七杀当令', '印星化杀', '杀印相生'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 食神制杀
  {
    id: 'shishen-zhisha',
    name: '食神制杀',
    category: '特殊格',
    priority: 148,
    weight: 82,
    description: '食神制七杀，英雄独压万人',
    reference: '《渊海子平》食神制杀',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasSha = stems.some(g => ctx.relatedShens[g] === '偏官')
      const hasShi = stems.some(g => ctx.relatedShens[g] === '食神')
      return hasSha && hasShi
    },
    result: {
      name: '食神制杀' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 85,
      confidence: 78,
      description: '食神制杀，将才之命',
      reasons: ['七杀有制', '食神制杀', '英雄独压'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 伤官佩印
  {
    id: 'shangguan-peiyin',
    name: '伤官佩印',
    category: '特殊格',
    priority: 146,
    weight: 80,
    description: '伤官配印，贵不可言',
    reference: '《滴天髓》伤官佩印',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasShang = stems.some(g => ctx.relatedShens[g] === '伤官')
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印')
      return hasShang && hasYin
    },
    result: {
      name: '伤官佩印' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 82,
      confidence: 75,
      description: '伤官佩印，权柄在手',
      reasons: ['伤官旺', '印星制伤', '伤官佩印'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 六秀日
  {
    id: 'liuxiu-ri',
    name: '六秀日',
    category: '特殊格',
    priority: 120,
    weight: 65,
    description: '日柱为六秀日，主人聪明秀气',
    reference: '《三命通会》六秀日',
    condition: (ctx) => {
      const liuxiu = ['辛丑', '丁未', '戊午', '丙午', '己未', '乙巳']
      const dayGZ = ctx.sixLines.day.gan + ctx.sixLines.day.zhi
      return liuxiu.includes(dayGZ)
    },
    result: {
      name: '六秀日' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 68,
      confidence: 62,
      description: '六秀日，聪明秀气',
      reasons: ['日柱六秀', '聪明多才'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 十灵日
  {
    id: 'shiling-ri',
    name: '十灵日',
    category: '特殊格',
    priority: 118,
    weight: 65,
    description: '日柱为十灵日，主聪明机巧',
    reference: '《渊海子平》十灵日',
    condition: (ctx) => {
      const shiling = ['甲辰', '乙亥', '丙辰', '丁酉', '戊午', '庚戌', '壬寅', '癸未', '甲子', '己丑']
      const dayGZ = ctx.sixLines.day.gan + ctx.sixLines.day.zhi
      return shiling.includes(dayGZ)
    },
    result: {
      name: '十灵日' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 68,
      confidence: 62,
      description: '十灵日，聪明机巧',
      reasons: ['日柱十灵', '心灵手巧'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 四位纯全
  {
    id: 'siwei-chunquan',
    name: '四位纯全',
    category: '特殊格',
    priority: 116,
    weight: 70,
    description: '子午卯酉全，或寅申巳亥全，或辰戌丑未全',
    reference: '《三命通会》四位纯全',
    condition: (ctx) => {
      const zhis = [ctx.sixLines.year.zhi, ctx.sixLines.month.zhi, ctx.sixLines.day.zhi, ctx.sixLines.hour.zhi]
      const zhiSet = new Set(zhis)
      // 子午卯酉（四正）
      const sizheng = ['子', '午', '卯', '酉'].every(z => zhiSet.has(z))
      if (sizheng) return true
      // 寅申巳亥（四生）
      const sisheng = ['寅', '申', '巳', '亥'].every(z => zhiSet.has(z))
      if (sisheng) return true
      // 辰戌丑未（四库）
      const siku = ['辰', '戌', '丑', '未'].every(z => zhiSet.has(z))
      if (siku) return true
      return false
    },
    result: {
      name: '四位纯全' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 80,
      confidence: 72,
      description: '四位纯全，大格局',
      reasons: ['地支四位全', '格局宏大'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 天干顺食
  {
    id: 'tiangan-shunshi',
    name: '天干顺食',
    category: '特殊格',
    priority: 114,
    weight: 72,
    description: '天干顺生，食神一路相生',
    reference: '《滴天髓》天干顺食',
    condition: (ctx) => {
      const gans = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      let allShun = true
      for (let i = 0; i < gans.length - 1; i++) {
        if (GENERATE[getElement(gans[i])] !== getElement(gans[i + 1])) {
          allShun = false
          break
        }
      }
      return allShun
    },
    result: {
      name: '天干顺食' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 78,
      confidence: 70,
      description: '天干顺生，一路流通',
      reasons: ['天干顺生', '五行流通'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 两气成象
  {
    id: 'liangqi-chengxiang',
    name: '两气成象',
    category: '特殊格',
    priority: 112,
    weight: 76,
    description: '天干地支各成一气，两气成象',
    reference: '《滴天髓》两气成象',
    condition: (ctx) => {
      const ganEls = new Set([
        getElement(ctx.sixLines.year.gan),
        getElement(ctx.sixLines.month.gan),
        getElement(ctx.sixLines.day.gan),
        getElement(ctx.sixLines.hour.gan),
      ])
      const zhiEls = new Set([
        BRANCH_ELEMENT[ctx.sixLines.year.zhi],
        BRANCH_ELEMENT[ctx.sixLines.month.zhi],
        BRANCH_ELEMENT[ctx.sixLines.day.zhi],
        BRANCH_ELEMENT[ctx.sixLines.hour.zhi],
      ])
      return ganEls.size === 1 && zhiEls.size === 1 && ganEls.values().next().value !== zhiEls.values().next().value
    },
    result: {
      name: '两气成象' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 85,
      confidence: 78,
      description: '两气成象，干支各一',
      reasons: ['天干一气', '地支一气', '两气成象'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 食神生财
  {
    id: 'shishen-shengcai',
    name: '食神生财',
    category: '特殊格',
    priority: 110,
    weight: 78,
    description: '食神生财，富贵自天来',
    reference: '《子平真诠》食神生财',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasShi = stems.some(g => ctx.relatedShens[g] === '食神')
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return hasShi && hasCai && ctx.monthGanShen === '食神'
    },
    result: {
      name: '食神格' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 82,
      confidence: 75,
      description: '食神生财，富贵有余',
      reasons: ['食神当令', '财星得生', '食神生财'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 伤官生财
  {
    id: 'shangguan-shengcai',
    name: '伤官生财',
    category: '特殊格',
    priority: 108,
    weight: 76,
    description: '伤官生财，技艺生财',
    reference: '《渊海子平》伤官生财',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasShang = stems.some(g => ctx.relatedShens[g] === '伤官')
      const hasCai = stems.some(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财')
      return hasShang && hasCai && ctx.monthGanShen === '伤官'
    },
    result: {
      name: '伤官格' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 80,
      confidence: 72,
      description: '伤官生财，技艺致富',
      reasons: ['伤官当令', '财星得生', '伤官生财'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 印赖杀生格
  {
    id: 'yinlai-shasheng',
    name: '印赖杀生',
    category: '特殊格',
    priority: 104,
    weight: 80,
    description: '印星赖七杀以生身，杀印相生',
    reference: '《滴天髓》印赖杀生',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印')
      const hasSha = stems.some(g => ctx.relatedShens[g] === '偏官')
      return hasYin && hasSha && (ctx.monthGanShen === '正印' || ctx.monthGanShen === '偏印')
    },
    result: {
      name: '正印格' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 84,
      confidence: 76,
      description: '印赖杀生，权柄贵重',
      reasons: ['印星当令', '杀生印星', '印赖杀生'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 伤官见官（破格特殊格）
  {
    id: 'shangguan-jianguan',
    name: '伤官见官',
    category: '破格',
    priority: 102,
    weight: 75,
    description: '伤官见官，为祸百端',
    reference: '《渊海子平》伤官见官',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasShang = stems.some(g => ctx.relatedShens[g] === '伤官')
      const hasGuan = stems.some(g => ctx.relatedShens[g] === '正官')
      return hasShang && hasGuan
    },
    result: {
      name: '伤官格' as GeJuName,
      category: '破格' as GeJuCategory,
      isSpecial: true,
      score: 50,
      confidence: 65,
      description: '伤官见官，灾祸频生',
      reasons: ['伤官见官', '格局破损'],
      poGe: true,
      poGeReason: '伤官见官，为祸百端',
    },
  },

  // 枭神夺食
  {
    id: 'xiaoshen-duoshi',
    name: '枭神夺食',
    category: '破格',
    priority: 100,
    weight: 78,
    description: '偏印夺食神，枭神夺食',
    reference: '《子平真诠》枭神夺食',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasPianYin = stems.some(g => ctx.relatedShens[g] === '偏印')
      const hasShi = stems.some(g => ctx.relatedShens[g] === '食神')
      return hasPianYin && hasShi && ctx.monthGanShen === '食神'
    },
    result: {
      name: '食神格' as GeJuName,
      category: '破格' as GeJuCategory,
      isSpecial: true,
      score: 48,
      confidence: 68,
      description: '枭神夺食，灾病连绵',
      reasons: ['偏印克食神', '枭神夺食'],
      poGe: true,
      poGeReason: '枭神夺食，破了食神',
    },
  },

  // 天干一气格
  {
    id: 'tiangan-yiqi',
    name: '天干一气',
    category: '特殊格',
    priority: 98,
    weight: 82,
    description: '四柱天干皆同，天干一气',
    reference: '《三命通会》天干一气',
    condition: (ctx) => {
      const gan = ctx.dayGan
      return ctx.sixLines.year.gan === gan && ctx.sixLines.month.gan === gan && ctx.sixLines.hour.gan === gan
    },
    result: {
      name: '天元一气' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 85,
      confidence: 78,
      description: '天干一气，四干皆同',
      reasons: ['四干相同', '天干一气'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 地支一气格
  {
    id: 'dizhi-yiqi',
    name: '地支一气',
    category: '特殊格',
    priority: 96,
    weight: 80,
    description: '四柱地支皆同，地支一气',
    reference: '《三命通会》地支一气',
    condition: (ctx) => {
      const zhi = ctx.sixLines.day.zhi
      return ctx.sixLines.year.zhi === zhi && ctx.sixLines.month.zhi === zhi && ctx.sixLines.hour.zhi === zhi
    },
    result: {
      name: '地元一气' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 82,
      confidence: 75,
      description: '地支一气，四支皆同',
      reasons: ['四支相同', '地支一气'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 天地德合格
  {
    id: 'tiandi-dehe',
    name: '天地德合',
    category: '特殊格',
    priority: 94,
    weight: 78,
    description: '日时天干五合、地支六合，天地德合',
    reference: '《三命通会》天地德合',
    condition: (ctx) => {
      const dayGan = ctx.sixLines.day.gan
      const hourGan = ctx.sixLines.hour.gan
      const dayZhi = ctx.sixLines.day.zhi
      const hourZhi = ctx.sixLines.hour.zhi
      const ganHePairs: Record<string, string> = { '甲': '己', '己': '甲', '乙': '庚', '庚': '乙', '丙': '辛', '辛': '丙', '丁': '壬', '壬': '丁', '戊': '癸', '癸': '戊' }
      const zhiHePairs: Record<string, string> = { '子': '丑', '丑': '子', '寅': '亥', '亥': '寅', '卯': '戌', '戌': '卯', '辰': '酉', '酉': '辰', '巳': '申', '申': '巳', '午': '未', '未': '午' }
      return ganHePairs[dayGan] === hourGan && zhiHePairs[dayZhi] === hourZhi
    },
    result: {
      name: '三奇贵人' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 80,
      confidence: 72,
      description: '天地德合，日时相合',
      reasons: ['日时天干五合', '日时地支六合', '天地德合'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 福德秀气格
  {
    id: 'fude-xiuxiu',
    name: '福德秀气',
    category: '特殊格',
    priority: 92,
    weight: 75,
    description: '食神生财，福德秀气',
    reference: '《渊海子平》福德秀气',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const shiCount = stems.filter(g => ctx.relatedShens[g] === '食神').length
      const caiCount = stems.filter(g => ctx.relatedShens[g] === '正财' || ctx.relatedShens[g] === '偏财').length
      return shiCount >= 1 && caiCount >= 1 && ctx.monthGanShen === '食神' && ctx.strengthScore >= 50
    },
    result: {
      name: '食神格' as GeJuName,
      category: '特殊格' as GeJuCategory,
      isSpecial: true,
      score: 80,
      confidence: 70,
      description: '福德秀气，福禄双全',
      reasons: ['食神生财', '福德秀气'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 从格真假判断（Priority 180-195） =====

  // 真从官杀格
  {
    id: 'zhen-cong-guansha',
    name: '真从官杀格',
    category: '从格',
    priority: 195,
    weight: 92,
    description: '日主极弱无根，官杀当令成势，真从官杀',
    reference: '《子平真诠》真从格',
    condition: (ctx) => {
      const guanShaElement = BE_OVERCOME[ctx.dayElement]
      return ctx.monthElement === guanShaElement
        && ctx.strengthScore < 15
        && !ctx.hasTongGen
        && ctx.diffPartyCount >= 4
    },
    result: {
      name: '从官杀格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 92,
      confidence: 88,
      description: '日主无根不得不从，真从官杀格局纯粹',
      reasons: ['日主极弱无根', '官杀当令成势', '真从无疑'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 假从官杀格
  {
    id: 'jia-cong-guansha',
    name: '假从官杀格',
    category: '从格',
    priority: 188,
    weight: 82,
    description: '日主有微根，但官杀势大，假从官杀',
    reference: '《子平真诠》假从格',
    condition: (ctx) => {
      const guanShaElement = BE_OVERCOME[ctx.dayElement]
      return ctx.monthElement === guanShaElement
        && ctx.strengthScore >= 15
        && ctx.strengthScore < 25
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从官杀格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 78,
      confidence: 72,
      description: '日主有微根不甚旺，假从官杀格局有疑',
      reasons: ['日主有微根', '官杀势大', '假从之格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真从财格
  {
    id: 'zhen-cong-cai',
    name: '真从财格',
    category: '从格',
    priority: 195,
    weight: 92,
    description: '日主极弱无根，财星当令成势，真从财',
    reference: '《子平真诠》真从格',
    condition: (ctx) => {
      const caiElement = ctx.dayElement // 财星与我同类
      return ctx.monthElement !== caiElement
        && ctx.strengthScore < 15
        && !ctx.hasTongGen
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从财格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 90,
      confidence: 85,
      description: '日主无根不得不从，真从财格福泽深厚',
      reasons: ['日主无根', '财星当令', '真从无疑'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 假从财格
  {
    id: 'jia-cong-cai',
    name: '假从财格',
    category: '从格',
    priority: 188,
    weight: 80,
    description: '日主有微根，但财星势众，假从财',
    reference: '《子平真诠》假从格',
    condition: (ctx) => {
      return ctx.strengthScore >= 15
        && ctx.strengthScore < 25
        && ctx.tongGenCount <= 1
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从财格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 75,
      confidence: 70,
      description: '日主有微根不甚旺，假从财格需谨慎',
      reasons: ['日主有微根', '财星势众', '假从之格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真从儿格
  {
    id: 'zhen-cong-er',
    name: '真从儿格',
    category: '从格',
    priority: 195,
    weight: 90,
    description: '日主极弱无根，食伤当令成势，真从儿',
    reference: '《子平真诠》真从格',
    condition: (ctx) => {
      const shangElement = GENERATE[ctx.dayElement]
      return ctx.monthElement === shangElement
        && ctx.strengthScore < 15
        && !ctx.hasTongGen
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从儿格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 90,
      confidence: 85,
      description: '日主无根不得不从，真从儿格聪明伶俐',
      reasons: ['日主无根', '食伤当令', '真从无疑'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 假从儿格
  {
    id: 'jia-cong-er',
    name: '假从儿格',
    category: '从格',
    priority: 188,
    weight: 78,
    description: '日主有微根，但食伤势大，假从儿',
    reference: '《子平真诠》假从格',
    condition: (ctx) => {
      const shangElement = GENERATE[ctx.dayElement]
      return ctx.monthElement === shangElement
        && ctx.strengthScore >= 15
        && ctx.strengthScore < 25
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从儿格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 73,
      confidence: 68,
      description: '日主有微根不甚旺，假从儿格格局欠纯',
      reasons: ['日主有微根', '食伤势大', '假从之格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 半从格
  {
    id: 'ban-cong',
    name: '半从格',
    category: '从格',
    priority: 165,
    weight: 65,
    description: '日主有根气但被制，半从半不从',
    reference: '《滴天髓》从格篇',
    condition: (ctx) => {
      return ctx.strengthScore >= 20
        && ctx.strengthScore < 35
        && ctx.tongGenCount >= 1
        && ctx.tongGenCount <= 2
        && ctx.diffPartyCount >= 2
    },
    result: {
      name: '假从格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 65,
      confidence: 60,
      description: '日主有根但被制，半从半不从，格局未定',
      reasons: ['日主有微根', '异党势大', '半从之格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 从而不从格
  {
    id: 'cong-er-bucong',
    name: '从而不从格',
    category: '从格',
    priority: 160,
    weight: 55,
    description: '看似从格实有根气，从而不从',
    reference: '《子平真诠》从格篇',
    condition: (ctx) => {
      return ctx.strengthScore >= 30
        && ctx.strengthScore < 45
        && ctx.tongGenCount >= 2
        && ctx.diffPartyCount >= 2
    },
    result: {
      name: '假从格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: false,
      score: 55,
      confidence: 50,
      description: '看似从格实有根气，从而不从，需仔细辨别',
      reasons: ['有根气', '从而不从', '需细辨'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真从势格
  {
    id: 'zhen-cong-shi',
    name: '真从势格',
    category: '从格',
    priority: 158,
    weight: 85,
    description: '日主极弱无根，全局气势在一方，真从势',
    reference: '《滴天髓》从势格',
    condition: (ctx) => {
      return ctx.strengthScore < 12
        && !ctx.hasTongGen
        && ctx.diffPartyCount >= 4
    },
    result: {
      name: '从势格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 88,
      confidence: 80,
      description: '日主无根，全局气势专一，真从势格',
      reasons: ['日主极弱无根', '全局气势专一', '真从势格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 假从势格
  {
    id: 'jia-cong-shi',
    name: '假从势格',
    category: '从格',
    priority: 155,
    weight: 75,
    description: '日主有微根，全局气势在一方，假从势',
    reference: '《滴天髓》从势格',
    condition: (ctx) => {
      return ctx.strengthScore >= 12
        && ctx.strengthScore < 22
        && ctx.tongGenCount <= 1
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从势格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 72,
      confidence: 68,
      description: '日主有微根，全局气势专一，假从势格',
      reasons: ['日主有微根', '全局气势专一', '假从势格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真从强格
  {
    id: 'zhen-cong-qiang',
    name: '真从强格',
    category: '从格',
    priority: 153,
    weight: 88,
    description: '日主极强，全局皆比劫印星，真从强',
    reference: '《滴天髓》从强格',
    condition: (ctx) => {
      return ctx.strengthScore >= 90
        && ctx.tongGenCount >= 3
        && ctx.diffPartyCount === 0
    },
    result: {
      name: '从强格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 90,
      confidence: 82,
      description: '日主极旺，全局皆助，真从强格',
      reasons: ['日主极旺', '全局皆助', '真从强格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 假从强格
  {
    id: 'jia-cong-qiang',
    name: '假从强格',
    category: '从格',
    priority: 150,
    weight: 78,
    description: '日主甚旺，有微弱克泄，假从强',
    reference: '《滴天髓》从强格',
    condition: (ctx) => {
      return ctx.strengthScore >= 80
        && ctx.strengthScore < 90
        && ctx.tongGenCount >= 2
        && ctx.diffPartyCount <= 1
    },
    result: {
      name: '从强格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 75,
      confidence: 70,
      description: '日主甚旺，有微克泄，假从强格',
      reasons: ['日主甚旺', '有微克泄', '假从强格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 从旺格
  {
    id: 'cong-wang',
    name: '从旺格',
    category: '从格',
    priority: 148,
    weight: 80,
    description: '日主极旺，印比成势，从旺',
    reference: '《三命通会》从旺格',
    condition: (ctx) => {
      return ctx.strengthScore >= 85
        && ctx.isSeasonal
        && ctx.tongGenCount >= 2
    },
    result: {
      name: '从旺格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 82,
      confidence: 75,
      description: '日主得令得地，从旺格',
      reasons: ['日主得令', '比劫成势', '从旺格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 半从印格
  {
    id: 'ban-cong-yin',
    name: '半从印格',
    category: '从格',
    priority: 146,
    weight: 78,
    description: '日主有微根，印星势大，半从半不从',
    reference: '《滴天髓》从印格',
    condition: (ctx) => {
      const yinElement = BE_GENERATE[ctx.dayElement]
      return ctx.monthElement === yinElement
        && ctx.strengthScore < 25
        && ctx.strengthScore >= 18
        && ctx.tongGenCount >= 1
        && ctx.tongGenCount <= 2
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从印格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 76,
      confidence: 68,
      description: '日主有微根，印星势大，半从印格',
      reasons: ['日主偏弱', '印星当令', '半从半不从'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 假从印格
  {
    id: 'jia-cong-yin',
    name: '假从印格',
    category: '从格',
    priority: 144,
    weight: 76,
    description: '日主有微根，印星势大，假从印',
    reference: '《滴天髓》从印格',
    condition: (ctx) => {
      const yinElement = BE_OVERCOME_INVERSE[ctx.dayElement]
      return ctx.monthElement === yinElement
        && ctx.strengthScore >= 18
        && ctx.strengthScore < 28
        && ctx.tongGenCount >= 1
        && ctx.tongGenCount <= 2
        && ctx.diffPartyCount >= 2
    },
    result: {
      name: '从印格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 72,
      confidence: 68,
      description: '日主有微根，印星势大，假从印格',
      reasons: ['日主有微根', '印星势大', '假从印格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 真从杀格
  {
    id: 'zhen-cong-sha',
    name: '真从杀格',
    category: '从格',
    priority: 142,
    weight: 90,
    description: '日主极弱无根，七杀当令成势，真从杀',
    reference: '《子平真诠》从杀格',
    condition: (ctx) => {
      const shaElement = BE_OVERCOME[ctx.dayElement]
      return ctx.monthElement === shaElement
        && ctx.strengthScore < 12
        && !ctx.hasTongGen
        && ctx.diffPartyCount >= 4
    },
    result: {
      name: '从官杀格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 92,
      confidence: 85,
      description: '日主无根，杀星当令，真从杀格',
      reasons: ['日主无根', '七杀当令', '真从杀格'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 从格破格
  {
    id: 'congge-poge',
    name: '从格破格',
    category: '破格',
    priority: 140,
    weight: 80,
    description: '从格中见比劫印星助身，从而破格',
    reference: '《滴天髓》从格破格',
    condition: (ctx) => {
      return ctx.strengthScore >= 25
        && ctx.strengthScore < 45
        && ctx.tongGenCount >= 2
        && ctx.diffPartyCount >= 2
    },
    result: {
      name: '假从格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: false,
      score: 55,
      confidence: 60,
      description: '从格见根气，从而破格',
      reasons: ['从格见根', '破格之兆'],
      poGe: true,
      poGeReason: '从格有根，破了从格',
    },
  },

  // 假专旺格
  {
    id: 'jia-zhuanwang',
    name: '假专旺格',
    category: '专旺格',
    priority: 195,
    weight: 80,
    description: '日主极旺但有微弱点，假专旺',
    reference: '《滴天髓》专旺格篇',
    condition: (ctx) => {
      return ctx.strengthScore >= 75
        && ctx.strengthScore < 85
        && ctx.tongGenCount >= 2
        && ctx.diffPartyCount <= 1
        && ctx.isSeasonal
    },
    result: {
      name: '专旺格' as GeJuName,
      category: '专旺格' as GeJuCategory,
      isSpecial: true,
      score: 80,
      confidence: 70,
      description: '日主旺相但略有微弱点，假专旺之格',
      reasons: ['日主旺相', '略有微弱点', '假专旺'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 化气格（Priority 185-195） =====

  // 甲己化土格
  {
    id: 'jiaji-huatu',
    name: '甲己化土格',
    category: '化气格',
    priority: 192,
    weight: 90,
    description: '甲木日主，天干甲己合化土',
    reference: '《三命通会》甲己化气',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasJia = stems.some(g => g === '甲')
      const hasJi = stems.some(g => g === '己')
      return hasJia && hasJi && ctx.dayGan === '甲'
    },
    result: {
      name: '化气格' as GeJuName,
      category: '化气格' as GeJuCategory,
      isSpecial: true,
      score: 88,
      confidence: 80,
      description: '甲己合化土气，化气纯粹',
      reasons: ['甲己相合', '化气为土'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 乙庚化金格
  {
    id: 'yigeng-huajin',
    name: '乙庚化金格',
    category: '化气格',
    priority: 192,
    weight: 90,
    description: '乙木日主，天干乙庚合化金',
    reference: '《三命通会》乙庚化气',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasYi = stems.some(g => g === '乙')
      const hasGeng = stems.some(g => g === '庚')
      return hasYi && hasGeng && ctx.dayGan === '乙'
    },
    result: {
      name: '化气格' as GeJuName,
      category: '化气格' as GeJuCategory,
      isSpecial: true,
      score: 88,
      confidence: 80,
      description: '乙庚合化金气，化气纯粹',
      reasons: ['乙庚相合', '化气为金'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 丙辛化水格
  {
    id: 'bingxin-huashui',
    name: '丙辛化水格',
    category: '化气格',
    priority: 192,
    weight: 90,
    description: '丙火日主，天干丙辛合化水',
    reference: '《三命通会》丙辛化气',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasBing = stems.some(g => g === '丙')
      const hasXin = stems.some(g => g === '辛')
      return hasBing && hasXin && ctx.dayGan === '丙'
    },
    result: {
      name: '化气格' as GeJuName,
      category: '化气格' as GeJuCategory,
      isSpecial: true,
      score: 88,
      confidence: 80,
      description: '丙辛合化水气，化气纯粹',
      reasons: ['丙辛相合', '化气为水'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 丁壬化木格
  {
    id: 'dingren-huamu',
    name: '丁壬化木格',
    category: '化气格',
    priority: 192,
    weight: 90,
    description: '丁火日主，天干丁壬合化木',
    reference: '《三命通会》丁壬化气',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasDing = stems.some(g => g === '丁')
      const hasRen = stems.some(g => g === '壬')
      return hasDing && hasRen && ctx.dayGan === '丁'
    },
    result: {
      name: '化气格' as GeJuName,
      category: '化气格' as GeJuCategory,
      isSpecial: true,
      score: 88,
      confidence: 80,
      description: '丁壬合化木气，化气纯粹',
      reasons: ['丁壬相合', '化气为木'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 戊癸化火格
  {
    id: 'wugui-huahuo',
    name: '戊癸化火格',
    category: '化气格',
    priority: 192,
    weight: 90,
    description: '戊土日主，天干戊癸合化火',
    reference: '《三命通会》戊癸化气',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasWu = stems.some(g => g === '戊')
      const hasGui = stems.some(g => g === '癸')
      return hasWu && hasGui && ctx.dayGan === '戊'
    },
    result: {
      name: '化气格' as GeJuName,
      category: '化气格' as GeJuCategory,
      isSpecial: true,
      score: 88,
      confidence: 80,
      description: '戊癸合化火气，化气纯粹',
      reasons: ['戊癸相合', '化气为火'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 调候细化（Priority 160-180） =====

  // 寒命调候格
  {
    id: 'hanming-tiaohou',
    name: '寒命调候格',
    category: '调候格',
    priority: 175,
    weight: 88,
    description: '冬生无火，寒湿过重，需调候为急',
    reference: '《穷通宝鉴》寒命调候',
    condition: (ctx) => {
      const donghanZhi = ['子', '亥', '丑']
      const hasHuo = ctx.fiveElementCount['火'] || 0
      return donghanZhi.includes(ctx.monthZhi) && hasHuo === 0 && ctx.strengthScore < 50
    },
    result: {
      name: '调候格' as GeJuName,
      category: '调候格' as GeJuCategory,
      isSpecial: true,
      score: 85,
      confidence: 78,
      description: '寒湿命局，调候为急，有火暖命方贵',
      reasons: ['冬生无火', '寒湿过重', '调候为急'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 暖命调候格
  {
    id: 'nuanming-tiaohou',
    name: '暖命调候格',
    category: '调候格',
    priority: 175,
    weight: 88,
    description: '夏生无水，燥热过重，需调候为急',
    reference: '《穷通宝鉴》暖命调候',
    condition: (ctx) => {
      const xialieZhi = ['午', '巳', '未']
      const hasShui = ctx.fiveElementCount['水'] || 0
      return xialieZhi.includes(ctx.monthZhi) && hasShui === 0 && ctx.strengthScore < 50
    },
    result: {
      name: '调候格' as GeJuName,
      category: '调候格' as GeJuCategory,
      isSpecial: true,
      score: 85,
      confidence: 78,
      description: '燥热命局，调候为急，有水润命方贵',
      reasons: ['夏生无水', '燥热过重', '调候为急'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 病药格（Priority 150-170） =====

  // 病重药轻
  {
    id: 'bingzhong-yaoqing',
    name: '病重药轻格',
    category: '病药格',
    priority: 160,
    weight: 75,
    description: '命局病重，药力不及，难以救药',
    reference: '《滴天髓》病药论',
    condition: (ctx) => {
      return ctx.strengthScore < 20
    },
    result: {
      name: '病药格' as GeJuName,
      category: '病药格' as GeJuCategory,
      isSpecial: false,
      score: 45,
      confidence: 65,
      description: '病重药轻，格局难救',
      reasons: ['偏枯太重', '药力不及'],
      poGe: true,
      poGeReason: '病重药轻，难以救药',
    },
  },

  // 病药相济
  {
    id: 'bingyao-xiangji',
    name: '病药相济格',
    category: '病药格',
    priority: 160,
    weight: 85,
    description: '命局有病有药，药病相济',
    reference: '《滴天髓》病药论',
    condition: (ctx) => {
      return ctx.strengthScore >= 20 && ctx.strengthScore <= 80 && ctx.touGanCount >= 2
    },
    result: {
      name: '病药格' as GeJuName,
      category: '病药格' as GeJuCategory,
      isSpecial: false,
      score: 82,
      confidence: 78,
      description: '有病有药，药病相济，格局有成',
      reasons: ['药病相当', '相互制衡'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 通关格细化（Priority 155-170） =====

  // 官杀相战通关
  {
    id: 'guansha-tongguan',
    name: '官杀通关格',
    category: '通关格',
    priority: 165,
    weight: 82,
    description: '官杀相战，以印星通关',
    reference: '《子平真诠》通关格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasGuan = stems.some(g => ctx.relatedShens[g] === '正官')
      const hasSha = stems.some(g => ctx.relatedShens[g] === '偏官')
      const hasYin = stems.some(g => ctx.relatedShens[g] === '正印' || ctx.relatedShens[g] === '偏印')
      return hasGuan && hasSha && hasYin
    },
    result: {
      name: '通关格' as GeJuName,
      category: '通关格' as GeJuCategory,
      isSpecial: false,
      score: 80,
      confidence: 75,
      description: '官杀相战，以印通关，格局有贵',
      reasons: ['官杀相战', '印星通关'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 比劫争财通关
  {
    id: 'bijie-tongguan',
    name: '比劫通关格',
    category: '通关格',
    priority: 165,
    weight: 80,
    description: '比劫争财，以食伤通关生财',
    reference: '《子平真诠》通关格',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasBijie = stems.some(g => ctx.relatedShens[g] === '比肩' || ctx.relatedShens[g] === '劫财')
      const hasShang = stems.some(g => ctx.relatedShens[g] === '食神' || ctx.relatedShens[g] === '伤官')
      return hasBijie && hasShang
    },
    result: {
      name: '通关格' as GeJuName,
      category: '通关格' as GeJuCategory,
      isSpecial: false,
      score: 78,
      confidence: 72,
      description: '比劫争财，食伤通关生财，格局可成',
      reasons: ['比劫争财', '食伤通关'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 破格补充（Priority 340-360） =====

  // 官杀混杂破格-正官格
  {
    id: 'zhengguan-poge-hunza',
    name: '正官破格-官杀混杂',
    category: '破格',
    priority: 95,
    weight: 92,
    description: '正官格透出七杀，官星混杂不清',
    reference: '《子平真诠》官杀混杂',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasQisha = stems.some(g => ctx.relatedShens[g] === '偏官')
      return ctx.monthGanShen === '正官' && hasQisha
    },
    result: {
      name: '正官格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 55,
      confidence: 85,
      description: '官杀混杂，格局不清，难以取贵',
      reasons: ['官杀混杂', '格局不清'],
      poGe: true,
      poGeReason: '正官格透七杀，官星混杂不清',
    },
  },

  // 财星混杂破格
  {
    id: 'cai-poge-hunza',
    name: '财格破格-财星混杂',
    category: '破格',
    priority: 88,
    weight: 85,
    description: '财格中正偏财齐透，财星不清',
    reference: '《子平真诠》财星清纯',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasZhengcai = stems.some(g => ctx.relatedShens[g] === '正财')
      const hasPiancai = stems.some(g => ctx.relatedShens[g] === '偏财')
      return (ctx.monthGanShen === '正财' || ctx.monthGanShen === '偏财') && hasZhengcai && hasPiancai
    },
    result: {
      name: '财格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 60,
      confidence: 78,
      description: '正偏财齐透，财星不清，难以取贵',
      reasons: ['财星混杂', '正偏财同透'],
      poGe: true,
      poGeReason: '正偏财齐透，财星混杂不清',
    },
  },

  // 印星混杂破格
  {
    id: 'yin-poge-hunza',
    name: '印格破格-印星混杂',
    category: '破格',
    priority: 88,
    weight: 85,
    description: '印格中正偏印齐透，印星不清',
    reference: '《子平真诠》印星清纯',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasZhengyin = stems.some(g => ctx.relatedShens[g] === '正印')
      const hasPianyin = stems.some(g => ctx.relatedShens[g] === '偏印')
      return (ctx.monthGanShen === '正印' || ctx.monthGanShen === '偏印') && hasZhengyin && hasPianyin
    },
    result: {
      name: '印格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 58,
      confidence: 78,
      description: '正偏印齐透，印星不清，格局有损',
      reasons: ['印星混杂', '正偏印同透'],
      poGe: true,
      poGeReason: '正偏印齐透，印星混杂不清',
    },
  },

  // ===== 格局层次细化（Priority 60-80） =====

  // 格局上等
  {
    id: 'geju-shangdeng',
    name: '格局上等',
    category: '格局层次',
    priority: 80,
    weight: 90,
    description: '命局各项条件俱备，格局上等',
    reference: '《滴天髓》格局论',
    condition: (ctx) => {
      return ctx.strengthScore >= 35
        && ctx.strengthScore <= 65
        && ctx.touGanCount >= 3
        && ctx.tongGenCount >= 2
        && ctx.samePartyCount > ctx.diffPartyCount
    },
    result: {
      name: '普通格局' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 92,
      confidence: 85,
      description: '格局上等，各项条件俱备，贵气逼人',
      reasons: ['身官两停', '用神有力', '格局清纯'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 格局中等
  {
    id: 'geju-zhongdeng',
    name: '格局中等',
    category: '格局层次',
    priority: 70,
    weight: 75,
    description: '命局条件基本具备，格局中等',
    reference: '《滴天髓》格局论',
    condition: (ctx) => {
      return (ctx.strengthScore >= 25 && ctx.strengthScore <= 75)
        && (ctx.touGanCount >= 2 || ctx.tongGenCount >= 2)
    },
    result: {
      name: '普通格局' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 72,
      confidence: 70,
      description: '格局中等，条件基本具备，可得小贵',
      reasons: ['条件基本具备', '格局可成'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 格局下等
  {
    id: 'geju-xiadeng',
    name: '格局下等',
    category: '格局层次',
    priority: 60,
    weight: 55,
    description: '命局缺陷明显，格局下等',
    reference: '《滴天髓》格局论',
    condition: (ctx) => {
      return ctx.strengthScore < 20 || (ctx.touGanCount === 0 && ctx.tongGenCount === 0)
    },
    result: {
      name: '普通格局' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 45,
      confidence: 60,
      description: '格局下等，缺陷明显，难有成就',
      reasons: ['缺陷明显', '格局难成'],
      poGe: true,
      poGeReason: '命局偏枯或无根，格局难成',
    },
  },

  // ===== 扶抑格细化（Priority 120-150） =====

  // 扶抑格-扶身
  {
    id: 'fuyi-fushen',
    name: '扶抑格-扶身',
    category: '扶抑格',
    priority: 130,
    weight: 82,
    description: '日主偏弱，以印比扶身',
    reference: '《子平真诠》扶抑篇',
    condition: (ctx) => {
      return ctx.strengthScore >= 20 && ctx.strengthScore < 35
    },
    result: {
      name: '扶抑格' as GeJuName,
      category: '扶抑格' as GeJuCategory,
      isSpecial: false,
      score: 78,
      confidence: 75,
      description: '日主偏弱，印比扶身，格局可成',
      reasons: ['日主偏弱', '印比扶身'],
      poGe: false,
      poGeReason: '',
    },
  },

  // 扶抑格-抑泄
  {
    id: 'fuyi-yixie',
    name: '扶抑格-抑泄',
    category: '扶抑格',
    priority: 130,
    weight: 80,
    description: '日主偏旺，以食伤财官抑泄',
    reference: '《子平真诠》扶抑篇',
    condition: (ctx) => {
      return ctx.strengthScore > 70 && ctx.strengthScore <= 85
    },
    result: {
      name: '扶抑格' as GeJuName,
      category: '扶抑格' as GeJuCategory,
      isSpecial: false,
      score: 76,
      confidence: 72,
      description: '日主偏旺，食伤财官抑泄，格局可成',
      reasons: ['日主偏旺', '食伤财官抑泄'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 从印格 =====
  {
    id: 'cong-yin-zhen',
    name: '真从印格',
    category: '从格',
    priority: 190,
    weight: 88,
    description: '日主极弱无根，印星当令成势，真从印',
    reference: '《子平真诠》真从格',
    condition: (ctx) => {
      const yinElement = BE_GENERATE[ctx.dayElement]
      return ctx.monthElement === yinElement
        && ctx.strengthScore < 15
        && !ctx.hasTongGen
        && ctx.diffPartyCount >= 3
    },
    result: {
      name: '从印格' as GeJuName,
      category: '从格' as GeJuCategory,
      isSpecial: true,
      score: 88,
      confidence: 82,
      description: '日主无根不得不从印，真从印格清贵',
      reasons: ['日主无根', '印星当令', '真从无疑'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 专旺格补充（更严格的专旺条件） =====
  {
    id: 'zhuānwàng-gé',
    name: '专旺格-纯',
    category: '专旺格',
    priority: 205,
    weight: 96,
    description: '日主极旺，地支专旺无一异党',
    reference: '《滴天髓》专旺格篇',
    condition: (ctx) => {
      return ctx.strengthScore >= 90
        && ctx.samePartyCount === 4
        && ctx.diffPartyCount === 0
    },
    result: {
      name: '专旺格' as GeJuName,
      category: '专旺格' as GeJuCategory,
      isSpecial: true,
      score: 98,
      confidence: 95,
      description: '五行一行专旺，纯粹之极，大贵之格',
      reasons: ['日主极旺', '四柱纯同党', '专旺纯粹'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 格局纯粹（Priority 70-90） =====
  {
    id: 'qingcun-cai',
    name: '清纯-财星清',
    category: '清纯判断',
    priority: 70,
    weight: 82,
    description: '财格中，财星清纯无杂',
    reference: '《子平真诠》财星清纯',
    condition: (ctx) => {
      const stems = [ctx.sixLines.year.gan, ctx.sixLines.month.gan, ctx.sixLines.day.gan, ctx.sixLines.hour.gan]
      const hasJiecai = stems.some(g => ctx.relatedShens[g] === '劫财')
      return (ctx.monthGanShen === '正财' || ctx.monthGanShen === '偏财') && !hasJiecai
    },
    result: {
      name: '财格' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 85,
      confidence: 80,
      description: '财星清纯，格局清正',
      reasons: ['财星清纯无杂'],
      poGe: false,
      poGeReason: '',
    },
  },

  // ===== 败格补充（Priority 50-65） =====
  {
    id: 'geju-wanzhong',
    name: '格局万终-用神溃散',
    category: '格局层次',
    priority: 50,
    weight: 45,
    description: '命局用神被破坏，格局万终',
    reference: '《滴天髓》偏枯论',
    condition: (ctx) => {
      return ctx.strengthScore < 10
    },
    result: {
      name: '普通格局' as GeJuName,
      category: '正格' as GeJuCategory,
      isSpecial: false,
      score: 30,
      confidence: 55,
      description: '格局万终，用神溃散，难有成就',
      reasons: ['用神溃散', '偏枯至极'],
      poGe: true,
      poGeReason: '偏枯至极，格局万终',
    },
  },

  // ===== 默认普通格局 =====
  {
    id: 'default-putong',
    name: '普通格局',
    category: '正格',
    priority: 1,
    weight: 50,
    description: '命局无特殊格局，以月令主气为格',
    reference: '《子平真诠》格局总论',
    condition: () => true,
    result: {
      name: '普通格局',
      category: '正格',
      isSpecial: false,
      score: 50,
      confidence: 50,
      description: '命局五行较平衡，无特殊格局。',
      reasons: ['五行平衡', '无特殊格局'],
      poGe: false,
      poGeReason: '',
    },
  },
]

// ========== 核心函数 ==========

/**
 * 构建格局上下文
 */
export function buildGeJuContext(
  sixLines: { year: GanZhi; month: GanZhi; day: GanZhi; hour: GanZhi },
  relatedShens: Record<string, ShenShi>,
  strengthScore: number,
  dayGan: string,
  monthZhi: string,
  fiveElementCount: Record<FiveElement, number>,
): GeJuContext {
  const dayElement = getElement(dayGan)
  const dayYinYang = getYinYang(dayGan)
  const BRANCH_ELEMENT: Record<string, FiveElement> = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
  }
  const monthMainElement = BRANCH_ELEMENT[sixLines.month.zhi] || '土'

  const monthGan = sixLines.month.gan
  const monthGanShen = relatedShens[monthGan] || '偏印'

  // 计算透干数量（天干中与日主相关的十神）
  let touGanCount = 0
  const stemElements = new Set<string>()
  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    const el = getElement(pillar.gan)
    if (el === dayElement) touGanCount++
    stemElements.add(el)
  }

  // 计算通根数量（地支中有日主本气或余气）
  let tongGenCount = 0
  const BRANCH_CANG_GAN: Record<string, string[]> = {
    '子': ['癸'], '丑': ['己', '辛', '癸'], '寅': ['甲', '丙', '戊'],
    '卯': ['乙'], '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'],
    '午': ['丁', '己'], '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'],
    '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲'],
  }
  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    const cangs = BRANCH_CANG_GAN[pillar.zhi] || []
    for (const cang of cangs) {
      if (getElement(cang) === dayElement) {
        tongGenCount++
        break
      }
    }
  }

  // 同党异党
  const sameElement = dayElement
  const genElement = Object.entries(GENERATE).find(([_, v]) => v === dayElement)?.[0] as FiveElement
  let samePartyCount = 0
  let diffPartyCount = 0
  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    const ganEl = getElement(pillar.gan)
    if (ganEl === sameElement || ganEl === genElement) {
      samePartyCount++
    } else {
      diffPartyCount++
    }
  }

  // 是否得令
  const isSeasonal = monthMainElement === dayElement

  return {
    sixLines,
    dayGan,
    dayElement,
    dayYinYang,
    monthZhi,
    monthElement: monthMainElement,
    monthGanShen,
    strengthScore,
    relatedShens,
    fiveElementCount,
    hasTongGen: tongGenCount > 0,
    hasTouGan: touGanCount > 0,
    touGanCount,
    tongGenCount,
    samePartyCount,
    diffPartyCount,
    isSeasonal,
  }
}

/**
 * 计算格局 Confidence V2（置信度第二版）
 * 7维度计算：
 * 1. Rule权重加权
 * 2. Rule优先级
 * 3. Rule来源权威度
 * 4. Rule否决度
 * 5. Rule冲突度
 * 6. 多算法一致率
 * 7. 证据充分度
 */
function calculateGeJuConfidence(
  bestMatch: RuleMatchResult<GeJuContext, Partial<GeJuResult>>,
  allMatches: RuleMatchResult<GeJuContext, Partial<GeJuResult>>[],
  ctx: GeJuContext,
): { confidence: number; conflicts: string[]; reason: string } {
  const matchedRules = allMatches
  const poGeRules = matchedRules.filter(m => m.rule.result && (m.rule.result as GeJuResult).poGe)
  const chengGeRules = matchedRules.filter(m =>
    m.rule.result && (m.rule.category === '正格成格' || m.rule.category === '格局层次')
  )

  // ===== 维度1：Rule权重加权分数 =====
  let totalWeight = 0
  let weightedScore = 0
  for (const m of matchedRules) {
    if (m.rule.id.startsWith('default')) continue
    const weight = m.rule.weight || 50
    const ruleConfidence = (m.rule.result as GeJuResult)?.confidence || 60
    weightedScore += ruleConfidence * weight
    totalWeight += weight
  }
  const weightConfidence = totalWeight > 0 ? weightedScore / totalWeight : 60

  // ===== 维度2：Rule优先级加成 =====
  const bestPriority = bestMatch.rule.priority || 50
  const priorityBonus = Math.min(10, bestPriority / 20)

  // ===== 维度3：来源权威度 =====
  const reference = bestMatch.rule.reference || ''
  let authorityBonus = 0
  if (reference.includes('滴天髓')) authorityBonus += 5
  if (reference.includes('子平真诠')) authorityBonus += 4
  if (reference.includes('三命通会')) authorityBonus += 3
  if (reference.includes('渊海子平')) authorityBonus += 3
  if (reference.includes('穷通宝鉴')) authorityBonus += 3
  authorityBonus = Math.min(5, authorityBonus)

  // ===== 维度4：破格惩罚 =====
  const poGeCount = poGeRules.length
  let poGePenalty = 0
  if (poGeCount >= 3) poGePenalty = 25
  else if (poGeCount >= 2) poGePenalty = 18
  else if (poGeCount === 1) poGePenalty = 10

  // ===== 维度5：成格加成 =====
  const chengGeCount = chengGeRules.length
  let chengGeBonus = 0
  if (chengGeCount >= 4) chengGeBonus = 12
  else if (chengGeCount >= 3) chengGeBonus = 8
  else if (chengGeCount >= 2) chengGeBonus = 5
  else if (chengGeCount >= 1) chengGeBonus = 3

  // ===== 维度6：多算法一致率 =====
  const categories = new Set(matchedRules.map(m => m.rule.category))
  const categoryCount = categories.size
  const consistencyBonus = categoryCount >= 4 ? 5 : categoryCount >= 3 ? 3 : 0

  // ===== 维度7：证据充分度 =====
  let evidenceBonus = 0
  if (ctx.touGanCount >= 3) evidenceBonus += 4
  else if (ctx.touGanCount >= 2) evidenceBonus += 2
  if (ctx.tongGenCount >= 3) evidenceBonus += 3
  else if (ctx.tongGenCount >= 2) evidenceBonus += 2
  if (ctx.strengthScore >= 30 && ctx.strengthScore <= 70) evidenceBonus += 3

  // ===== 综合计算 =====
  let confidence = weightConfidence
    + priorityBonus
    + authorityBonus
    - poGePenalty
    + chengGeBonus
    + consistencyBonus
    + evidenceBonus

  confidence = Math.max(0, Math.min(100, Math.round(confidence)))

  // ===== 冲突检测 =====
  const conflicts: string[] = []
  if (poGeCount > 0 && chengGeCount > 0) {
    conflicts.push('格局成破并存，需综合判断')
  }
  if (poGeCount >= 2) {
    conflicts.push('多重破格，格局不稳')
  }
  if (categoryCount >= 4) {
    conflicts.push('多格局命中，需细辨主次')
  }

  // ===== 生成原因说明 =====
  let reason = ''
  if (poGeCount > 0) {
    reason = poGeRules.map(m => (m.rule.result as GeJuResult)?.poGeReason || m.rule.name).join('；')
  } else if (chengGeCount > 0) {
    reason = chengGeRules.map(m => (m.rule.result as GeJuResult)?.description || m.rule.name).join('；')
  } else {
    reason = (bestMatch.rule.result as GeJuResult)?.description || bestMatch.rule.description
  }

  return { confidence, conflicts, reason }
}

/**
 * 计算格局 Confidence V3（置信度第三版）
 * 7维度计算：
 * 1. RuleWeight - 规则权重
 * 2. PatternWeight - 格局类型权重
 * 3. PriorityWeight - 优先级权重
 * 4. ConflictPenalty - 冲突惩罚
 * 5. PurityBonus - 清纯加成
 * 6. SeasonBonus - 得令加成
 * 7. ClassicalBonus - 经典验证加成
 */
function calculateGeJuConfidenceV3(
  bestMatch: RuleMatchResult<GeJuContext, Partial<GeJuResult>>,
  allMatches: RuleMatchResult<GeJuContext, Partial<GeJuResult>>[],
  ctx: GeJuContext,
): { confidence: number; confidenceReason: string; conflicts: string[] } {
  const matchedRules = allMatches.filter(m => !m.rule.id.startsWith('default'))
  const poGeRules = matchedRules.filter(m => m.rule.result && (m.rule.result as GeJuResult).poGe)
  const chengGeRules = matchedRules.filter(m =>
    m.rule.result && (m.rule.category === '正格成格' || m.rule.category === '格局层次')
  )
  const qingcunRules = matchedRules.filter(m => m.rule.category === '清纯')

  const details: string[] = []

  // ===== 维度1：RuleWeight 规则权重加权 =====
  let totalWeight = 0
  let weightedScore = 0
  for (const m of matchedRules) {
    const weight = m.rule.weight || 50
    const ruleConf = (m.rule.result as GeJuResult)?.confidence || 60
    weightedScore += ruleConf * weight
    totalWeight += weight
  }
  const weightBase = totalWeight > 0 ? weightedScore / totalWeight : 60
  details.push(`规则权重加权: ${weightBase.toFixed(1)}分`)

  // ===== 维度2：PatternWeight 格局类型权重 =====
  const category = bestMatch.rule.category
  let patternBonus = 0
  if (category === '专旺格') patternBonus = 8
  else if (category === '从格') patternBonus = 6
  else if (category === '特殊格') patternBonus = 5
  else if (category === '正格') patternBonus = 4
  else if (category === '化气格') patternBonus = 5
  else patternBonus = 2
  details.push(`格局类型加成: +${patternBonus}分(${category})`)

  // ===== 维度3：PriorityWeight 优先级权重 =====
  const bestPriority = bestMatch.rule.priority || 50
  const priorityBonus = Math.min(10, Math.floor(bestPriority / 25))
  details.push(`优先级加成: +${priorityBonus}分(优先级${bestPriority})`)

  // ===== 维度4：ConflictPenalty 冲突惩罚 =====
  const poGeCount = poGeRules.length
  let conflictPenalty = 0
  if (poGeCount >= 3) conflictPenalty = 25
  else if (poGeCount >= 2) conflictPenalty = 15
  else if (poGeCount === 1) conflictPenalty = 8
  if (conflictPenalty > 0) details.push(`破格惩罚: -${conflictPenalty}分(${poGeCount}个破格规则)`)

  // ===== 维度5：PurityBonus 清纯加成 =====
  const purityCount = qingcunRules.length
  let purityBonus = 0
  if (purityCount >= 2) purityBonus = 8
  else if (purityCount === 1) purityBonus = 5
  if (purityBonus > 0) details.push(`清纯加成: +${purityBonus}分`)

  // ===== 维度6：SeasonBonus 得令加成 =====
  let seasonBonus = 0
  if (ctx.isSeasonal) {
    seasonBonus = 5
    details.push(`得令加成: +${seasonBonus}分`)
  }

  // ===== 维度7：ClassicalBonus 经典验证加成 =====
  const reference = bestMatch.rule.reference || ''
  let classicalBonus = 0
  if (reference.includes('滴天髓')) classicalBonus += 4
  if (reference.includes('子平真诠')) classicalBonus += 3
  if (reference.includes('三命通会')) classicalBonus += 2
  if (reference.includes('渊海子平')) classicalBonus += 2
  classicalBonus = Math.min(5, classicalBonus)
  if (classicalBonus > 0) details.push(`经典验证加成: +${classicalBonus}分`)

  // ===== 综合计算 =====
  let confidence = weightBase
    + patternBonus
    + priorityBonus
    - conflictPenalty
    + purityBonus
    + seasonBonus
    + classicalBonus

  confidence = Math.max(30, Math.min(100, Math.round(confidence)))
  details.push(`最终置信度: ${confidence}分`)

  // ===== 冲突检测 =====
  const conflicts: string[] = []
  if (poGeCount > 0 && chengGeRules.length > 0) {
    conflicts.push('格局成破并存，需综合判断')
  }
  if (poGeCount >= 2) {
    conflicts.push('多重破格，格局不稳')
  }
  const categories = new Set(matchedRules.map(m => m.rule.category))
  if (categories.size >= 5) {
    conflicts.push('多格局命中，需细辨主次')
  }

  const confidenceReason = details.join('；')

  return { confidence, confidenceReason, conflicts }
}

/**
 * 计算清纯度 PureScore
 */
function calculatePureScore(
  allMatches: RuleMatchResult<GeJuContext, Partial<GeJuResult>>[],
  ctx: GeJuContext,
): number {
  let score = 60
  const qingcunRules = allMatches.filter(m => m.rule.category === '清纯')
  const poGeRules = allMatches.filter(m => (m.rule.result as any)?.poGe)

  if (qingcunRules.length >= 2) score += 20
  else if (qingcunRules.length === 1) score += 10

  if (poGeRules.length === 0) score += 10
  else if (poGeRules.length === 1) score -= 10
  else if (poGeRules.length >= 2) score -= 25

  if (ctx.touGanCount === 1) score += 5
  if (ctx.tongGenCount <= 1) score += 5

  return Math.max(0, Math.min(100, score))
}

/**
 * 计算贵气 NobilityScore
 */
function calculateNobilityScore(
  bestMatch: RuleMatchResult<GeJuContext, Partial<GeJuResult>>,
  allMatches: RuleMatchResult<GeJuContext, Partial<GeJuResult>>[],
  ctx: GeJuContext,
): number {
  let score = 50
  const name = (bestMatch.rule.result as any)?.name || ''

  if (name.includes('官') || name.includes('杀')) score += 15
  if (name.includes('印')) score += 10
  if (name.includes('贵') || name.includes('三奇')) score += 20
  if (name.includes('化气')) score += 12
  if (name.includes('专旺') || ['曲直', '炎上', '稼穑', '从革', '润下'].some(n => name.includes(n))) score += 8

  const guanShaCount = allMatches.filter(m =>
    m.rule.name.includes('官') || m.rule.name.includes('杀')
  ).length
  if (guanShaCount >= 2) score += 5

  if (ctx.isSeasonal) score += 5

  const poGeRules = allMatches.filter(m => (m.rule.result as any)?.poGe)
  if (poGeRules.length > 0) score -= poGeRules.length * 8

  return Math.max(0, Math.min(100, score))
}

/**
 * 计算富气 WealthScore
 */
function calculateWealthScore(
  bestMatch: RuleMatchResult<GeJuContext, Partial<GeJuResult>>,
  allMatches: RuleMatchResult<GeJuContext, Partial<GeJuResult>>[],
  ctx: GeJuContext,
): number {
  let score = 50
  const name = (bestMatch.rule.result as any)?.name || ''

  if (name.includes('财')) score += 15
  if (name.includes('食神') || name.includes('伤官')) score += 8
  if (name.includes('食伤')) score += 10
  if (allMatches.some(m => m.rule.name.includes('食神生财') || m.rule.name.includes('伤官生财'))) score += 10

  const caiCount = allMatches.filter(m => m.rule.name.includes('财')).length
  if (caiCount >= 2) score += 5

  if (ctx.samePartyCount >= 3) score += 5

  const poGeRules = allMatches.filter(m => (m.rule.result as any)?.poGe)
  if (poGeRules.length > 0) score -= poGeRules.length * 6

  return Math.max(0, Math.min(100, score))
}

/**
 * 根据分数计算 Grade
 */
function scoreToGrade(score: number): GeJuGrade {
  if (score >= 95) return 'S+'
  if (score >= 88) return 'S'
  if (score >= 80) return 'A+'
  if (score >= 70) return 'A'
  if (score >= 55) return 'B'
  if (score >= 40) return 'C'
  return 'D'
}

export function determineGeJu(
  sixLines: { year: GanZhi; month: GanZhi; day: GanZhi; hour: GanZhi },
  relatedShens: Record<string, ShenShi>,
  strengthScore: number,
  dayGan: string,
  monthZhi: string,
  fiveElementCount: Record<FiveElement, number>,
): GeJuResult {
  const ctx = buildGeJuContext(sixLines, relatedShens, strengthScore, dayGan, monthZhi, fiveElementCount)

  const { bestMatch, allMatches } = executeRules(GEJU_RULES, ctx, {
    stopOnFirstMatch: false,
    returnAllMatches: true,
  })

  const defaultItem: GeJuItem = {
    name: '普通格局',
    category: '正格',
    score: 50,
    confidence: 50,
    description: '命局五行较平衡，无特殊格局。',
    reasons: [],
    priority: 0,
  }

  if (!bestMatch) {
    return {
      name: '普通格局',
      category: '正格',
      isSpecial: false,
      score: 50,
      grade: 'C',
      confidence: 50,
      confidenceReason: '无特殊格局命中，基础置信度50分',
      description: '命局五行较平衡，无特殊格局。',
      reasons: [],
      poGe: false,
      poGeReason: '',
      matchedRules: [],
      conflicts: [],
      mainGeJu: defaultItem,
      assistGeJu: [],
      conflictGeJu: [],
      pureScore: 60,
      nobilityScore: 50,
      wealthScore: 50,
      careerScore: 50,
      marriageScore: 50,
      healthScore: 65,
      childrenScore: 50,
    }
  }

  // V3 Confidence
  const { confidence, confidenceReason, conflicts } = calculateGeJuConfidenceV3(bestMatch, allMatches, ctx)

  const result = bestMatch.result as unknown as GeJuResult
  const matchedRulesList = allMatches.map(m => ({
    id: m.rule.id,
    name: m.rule.name,
    category: m.rule.category,
    priority: m.rule.priority,
    weight: m.rule.weight,
    score: m.rule.result?.score || 0,
    poGe: (m.rule.result as any)?.poGe || false,
  }))
  const poGeRules = allMatches.filter(m => (m.rule.result as any)?.poGe)
  const poGe = (result as any).poGe || poGeRules.length > 0
  const poGeReason = (result as any).poGeReason || conflicts.join('；')

  // 多格局融合：主格、副格、冲突格
  const mainGeJu: GeJuItem = {
    name: result.name || '普通格局',
    category: result.category || '正格',
    score: result.score || 50,
    confidence,
    description: result.description || '',
    reasons: result.reasons || [],
    priority: bestMatch.rule.priority,
  }

  // 副格：与主格不同类别的成格规则
  const mainCategory = bestMatch.rule.category
  const mainName = result.name
  const assistCandidates = allMatches
    .filter(m =>
      !m.rule.id.startsWith('default')
      && m.rule.category !== '格局层次'
      && m.rule.category !== '破格'
      && !(m.rule.result as any)?.poGe
      && m.rule.name !== mainName
      && m.rule.category !== mainCategory
    )
    .sort((a, b) => b.rule.priority - a.rule.priority)
    .slice(0, 3)

  const assistGeJu: GeJuItem[] = assistCandidates.map(m => ({
    name: ((m.rule.result as any)?.name || m.rule.name) as GeJuName,
    category: m.rule.category as GeJuCategory,
    score: (m.rule.result as any)?.score || 60,
    confidence: m.rule.weight,
    description: m.rule.description,
    reasons: [(m.rule.result as any)?.description || m.rule.description],
    priority: m.rule.priority,
  }))

  // 冲突格：破格规则
  const conflictCandidates = allMatches
    .filter(m => (m.rule.result as any)?.poGe)
    .sort((a, b) => b.rule.priority - a.rule.priority)
    .slice(0, 5)

  const conflictGeJu: GeJuItem[] = conflictCandidates.map(m => ({
    name: ((m.rule.result as any)?.name || m.rule.name) as GeJuName,
    category: m.rule.category as GeJuCategory,
    score: (m.rule.result as any)?.score || 40,
    confidence: m.rule.weight,
    description: m.rule.description,
    reasons: [(m.rule.result as any)?.poGeReason || m.rule.description],
    priority: m.rule.priority,
  }))

  // 评分细项
  const pureScore = calculatePureScore(allMatches, ctx)
  const nobilityScore = calculateNobilityScore(bestMatch, allMatches, ctx)
  const wealthScore = calculateWealthScore(bestMatch, allMatches, ctx)
  const careerScore = Math.round((nobilityScore * 0.6 + wealthScore * 0.4) * 0.9 + 10)
  const marriageScore = Math.round(50 + (pureScore - 50) * 0.3 + (result.score || 50 - 50) * 0.2)
  const healthScore = Math.round(60 + (strengthScore >= 30 && strengthScore <= 70 ? 15 : -10) + (pureScore - 50) * 0.2)
  const childrenScore = Math.round(50 + (wealthScore - 50) * 0.3 + (strengthScore >= 40 ? 5 : -5))

  const finalScore = result.score || 60
  const grade = scoreToGrade(finalScore)

  // 古籍引用（部分经典格局）
  const ref = bestMatch.rule.reference || ''
  let caseReference: CaseReference | undefined
  if (ref && ref !== '经验总结') {
    caseReference = {
      source: ref,
      originalText: '',
      explanation: bestMatch.rule.description,
      modernExplanation: result.description || '',
    }
  }

  // Explain 模块
  const explain: GeJuExplain = {
    whyMatched: [
      `月令为${ctx.monthElement}，月干十神为${ctx.monthGanShen}`,
      `日主${ctx.dayGan}，强度${ctx.strengthScore}分`,
      ...(result.reasons || []),
    ],
    whyNotOthers: [
      ...(assistGeJu.length > 0 ? [`同时命中${assistGeJu.length}个副格，但优先级低于主格`] : []),
      ...(conflictGeJu.length > 0 ? [`存在${conflictGeJu.length}个破格因素，需注意`] : []),
    ],
    scoreBreakdown: [
      { item: '基础成格分', score: finalScore },
      { item: '清纯度', score: pureScore },
      { item: '贵气', score: nobilityScore },
      { item: '富气', score: wealthScore },
    ],
    strengths: [
      ...(ctx.isSeasonal ? ['日主得令'] : []),
      ...(ctx.hasTongGen ? ['日主有根'] : []),
      ...(pureScore >= 70 ? ['格局清纯'] : []),
      ...(nobilityScore >= 70 ? ['贵气足'] : []),
      ...(wealthScore >= 70 ? ['富气足'] : []),
    ],
    weaknesses: [
      ...(poGe ? [poGeReason || '存在破格因素'] : []),
      ...(pureScore < 50 ? ['格局混杂'] : []),
      ...(strengthScore < 30 ? ['日主过弱'] : []),
      ...(strengthScore > 80 ? ['日主过旺'] : []),
    ],
  }

  return {
    ...result,
    grade,
    confidence,
    confidenceReason,
    matchedRules: matchedRulesList.map(r => r.name),
    reasons: result.reasons || [bestMatch.rule.description],
    conflicts,
    poGe,
    poGeReason,
    mainGeJu,
    assistGeJu,
    conflictGeJu,
    pureScore,
    nobilityScore,
    wealthScore,
    careerScore: Math.max(0, Math.min(100, careerScore)),
    marriageScore: Math.max(0, Math.min(100, marriageScore)),
    healthScore: Math.max(0, Math.min(100, healthScore)),
    childrenScore: Math.max(0, Math.min(100, childrenScore)),
    caseReference,
    explain,
  }
}

/**
 * 获取格局名称列表
 */
export function getGeJuNames(): GeJuName[] {
  return GEJU_RULES.map(r => r.result.name as GeJuName).filter(Boolean)
}
