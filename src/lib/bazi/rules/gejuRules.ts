/**
 * 格局规则引擎
 * 完整格局体系：正格、从格、专旺格、化气格、调候格、病药格、扶抑格、通关格
 */

import { executeRules, type BaseRule, type RuleContext } from './engine'
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
 * 判断命局格局
 */
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
    }
  }

  const result = bestMatch.result as unknown as GeJuResult
  return {
    ...result,
    matchedRules: allMatches.map(m => m.rule.name),
  }
}

/**
 * 获取格局名称列表
 */
export function getGeJuNames(): GeJuName[] {
  return GEJU_RULES.map(r => r.result.name as GeJuName).filter(Boolean)
}
