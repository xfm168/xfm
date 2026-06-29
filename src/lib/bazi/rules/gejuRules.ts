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

export type GeJuName =
  // 正格
  | '正官格' | '七杀格' | '正印格' | '偏印格'
  | '食神格' | '伤官格' | '正财格' | '偏财格'
  | '比肩格' | '劫财格'
  // 从格
  | '从官杀格' | '从财格' | '从儿格' | '从印格'
  | '弃命从财' | '弃命从官' | '弃命从杀' | '假从格'
  // 专旺格
  | '专旺格' | '曲直格' | '炎上格' | '稼穑格' | '从革格' | '润下格'
  // 化气格
  | '化气格'
  // 其他
  | '调候格' | '寒暖燥湿格' | '病药格' | '扶抑格' | '通关格'
  // 特殊格
  | '飞天禄马' | '金神格' | '魁罡格'
  | '普通格局'

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

export interface GeJuResult {
  name: GeJuName
  category: GeJuCategory
  isSpecial: boolean
  score: number              // 成格评分 0-100
  confidence: number         // 可信度 0-100
  description: string
  reasons: string[]          // 成立原因
  poGe: boolean              // 是否破格
  poGeReason: string         // 破格原因
  matchedRules: string[]     // 命中的规则
  conflicts?: string[]      // 冲突信息
}

// ========== 辅助函数 ==========

const GENERATE: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
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
      const guanShaElement = OVERCOME[ctx.dayElement]
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
      const guanShaElement = OVERCOME[ctx.dayElement]
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
      const guanShaElement = OVERCOME[ctx.dayElement]
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

  // ===== 破格规则（Priority 300+，最高） =====
  // 破格规则：判断格局是否被破坏

  // 正官格破格
  {
    id: 'zhengguan-poge-guanke',
    name: '正官破格-官被克',
    category: '破格',
    priority: 350,
    weight: 95,
    description: '正官格中，官星被伤官克制破格',
    reference: '《子平真诠》正官格破格',
    condition: (ctx) => {
      return ctx.monthGanShen === '正官' && Object.keys(ctx.relatedShens).length > 0
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
    priority: 350,
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
    priority: 350,
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
    priority: 340,
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
    priority: 340,
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
    priority: 340,
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
    priority: 350,
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
    priority: 350,
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
    priority: 340,
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
      return ctx.strengthScore < 15 || ctx.strengthScore > 85
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
      const guanShaElement = OVERCOME[ctx.dayElement]
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
      const guanShaElement = OVERCOME[ctx.dayElement]
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
      return ctx.strengthScore < 20 || ctx.strengthScore > 80
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
    priority: 355,
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
    priority: 340,
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
    priority: 340,
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
      return ctx.strengthScore < 20 || ctx.strengthScore > 80 || (ctx.touGanCount === 0 && ctx.tongGenCount === 0)
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
      const yinElement = ctx.dayElement // 印星与日主同象
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
      return ctx.strengthScore < 10 || ctx.strengthScore > 90
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
  const monthMainElement = getElement(sixLines.month.zhi) // 月支主气

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
 * 计算格局 Confidence（置信度）
 * 基于：Rule命中数量、冲突数量、证据数量
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

  // 1. 基础分数（从最佳匹配规则继承）
  const baseConfidence = (bestMatch.rule.result as GeJuResult)?.confidence || 75
  let confidence = baseConfidence

  // 2. 命中数量加成（命中的成格/层次规则越多，越可信）
  const validRules = matchedRules.filter(m => !m.rule.id.startsWith('default'))
  const ruleCount = validRules.length
  if (ruleCount >= 5) confidence += 10
  else if (ruleCount >= 3) confidence += 5
  else if (ruleCount === 1) confidence -= 5

  // 3. 破格惩罚
  const poGeCount = poGeRules.length
  if (poGeCount >= 2) confidence -= 20
  else if (poGeCount === 1) confidence -= 10

  // 4. 成格加成
  const chengGeCount = chengGeRules.length
  if (chengGeCount >= 3) confidence += 10
  else if (chengGeCount >= 1) confidence += 5

  // 5. 旺衰平衡加成
  if (ctx.strengthScore >= 25 && ctx.strengthScore <= 75) confidence += 5

  // 6. 证据充分度（透干数量越多，证据越充分）
  if (ctx.touGanCount >= 3) confidence += 5
  else if (ctx.touGanCount >= 2) confidence += 3

  // 确保置信度在 0-100 范围内
  confidence = Math.max(0, Math.min(100, confidence))

  // 7. 检测冲突
  const conflicts: string[] = []
  if (poGeCount > 0 && chengGeCount > 0) {
    conflicts.push('格局成破并存，需综合判断')
  }
  if (poGeCount >= 2) {
    conflicts.push('多重破格，格局不稳')
  }

  // 8. 生成原因说明
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

  if (!bestMatch) {
    return {
      name: '普通格局',
      category: '正格',
      isSpecial: false,
      score: 50,
      confidence: 50,
      description: '命局五行较平衡，无特殊格局。',
      reasons: [],
      poGe: false,
      poGeReason: '',
      matchedRules: [],
      conflicts: [],
    }
  }

  // 动态计算 Confidence
  const { confidence, conflicts, reason } = calculateGeJuConfidence(bestMatch, allMatches, ctx)

  const result = bestMatch.result as unknown as GeJuResult
  const matchedRules = allMatches.map(m => ({
    id: m.rule.id,
    name: m.rule.name,
    category: m.rule.category,
    priority: m.rule.priority,
    weight: m.rule.weight,
    score: m.rule.result?.score || 0,
    poGe: (m.rule.result as any)?.poGe || false,
  }))
  const poGeRules = allMatches.filter(m => (m.rule.result as any)?.poGe)

  return {
    ...result,
    confidence,
    matchedRules: matchedRules.map(r => r.name),
    reasons: result.reasons || [reason],
    conflicts,
    poGe: (result as any).poGe || poGeRules.length > 0,
    poGeReason: (result as any).poGeReason || conflicts.join('；'),
  }
}

/**
 * 获取格局名称列表
 */
export function getGeJuNames(): GeJuName[] {
  return GEJU_RULES.map(r => r.result.name as GeJuName).filter(Boolean)
}
