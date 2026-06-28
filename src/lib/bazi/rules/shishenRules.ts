/**
 * 十神规则引擎 V2
 * 基于统一 BaseRule 接口的十神计算、力量分析与组合判断
 */

import type { BaseRule, RuleContext, RuleResult } from './engine'
import type {
  SixLines,
  HeavenlyStem,
  EarthlyBranch,
  ShenShi,
  FiveElement,
  CangGan,
  YinYang,
} from '../types'

// ========== 类型定义 ==========

export interface ShenShiCalcContext extends RuleContext {
  dayGan: HeavenlyStem
  targetGan: HeavenlyStem
  dayElement: FiveElement
  targetElement: FiveElement
  dayYinYang: YinYang
  targetYinYang: YinYang
}

export interface ShenShiCalcResult extends RuleResult {
  shenShi: ShenShi
}

export interface ShenShiCombinationContext extends RuleContext {
  sixLines: SixLines
  dayGan: HeavenlyStem
  cangGanData: Record<EarthlyBranch, CangGan>
  shenShiPowers: Record<ShenShi, ShenShiPower>
}

export interface ShenShiPower {
  count: number
  touGan: number
  cangGan: number
  power: number
}

export interface ShenShiCombinationResult extends RuleResult {
  name: string
  description: string
  auspicious: boolean
  strength: number
  mainShens: ShenShi[]
}

export type ShenShiRule = BaseRule<ShenShiCalcContext, ShenShiCalcResult>
export type ShenShiCombinationRule = BaseRule<ShenShiCombinationContext, ShenShiCombinationResult>

export interface ShenShiCombination {
  id: string
  name: string
  description: string
  auspicious: boolean
  strength: number
  confidence: number
  mainShens: ShenShi[]
  reference: string
}

export interface CalcShenShiResult {
  shenShi: ShenShi
  matchedRule: ShenShiRule | null
  confidence: number
}

// ========== 基础数据 ==========

const STEM_ELEMENT: Record<HeavenlyStem, FiveElement> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
}

const STEM_YINYANG: Record<HeavenlyStem, YinYang> = {
  甲: '阳', 丙: '阳', 戊: '阳', 庚: '阳', 壬: '阳',
  乙: '阴', 丁: '阴', 己: '阴', 辛: '阴', 癸: '阴',
}

const GENERATE: Record<FiveElement, FiveElement> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
}

const OVERCOME: Record<FiveElement, FiveElement> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
}

const ALL_SHENSHI: ShenShi[] = [
  '比肩', '劫财', '食神', '伤官',
  '偏财', '正财', '偏官', '正官',
  '偏印', '正印',
]

const ALL_STEMS: HeavenlyStem[] = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
]

// ========== 辅助函数 ==========

function getStemElement(gan: HeavenlyStem): FiveElement {
  return STEM_ELEMENT[gan]
}

function getStemYinYang(gan: HeavenlyStem): YinYang {
  return STEM_YINYANG[gan]
}

function calcSingleShenShi(dayGan: HeavenlyStem, targetGan: HeavenlyStem): ShenShi {
  const dayElement = getStemElement(dayGan)
  const dayYinYang = getStemYinYang(dayGan)
  const targetElement = getStemElement(targetGan)
  const targetYinYang = getStemYinYang(targetGan)
  const sameYinYang = dayYinYang === targetYinYang

  if (targetElement === dayElement) {
    return sameYinYang ? '比肩' : '劫财'
  }
  if (GENERATE[dayElement] === targetElement) {
    return sameYinYang ? '食神' : '伤官'
  }
  if (OVERCOME[dayElement] === targetElement) {
    return sameYinYang ? '偏财' : '正财'
  }
  if (OVERCOME[targetElement] === dayElement) {
    return sameYinYang ? '偏官' : '正官'
  }
  if (GENERATE[targetElement] === dayElement) {
    return sameYinYang ? '偏印' : '正印'
  }
  return '比肩'
}

function getAllShenShiMap(dayGan: HeavenlyStem): Record<HeavenlyStem, ShenShi> {
  const result = {} as Record<HeavenlyStem, ShenShi>
  for (const stem of ALL_STEMS) {
    result[stem] = calcSingleShenShi(dayGan, stem)
  }
  return result
}

function buildShenShiCalcContext(
  dayGan: HeavenlyStem,
  targetGan: HeavenlyStem,
): ShenShiCalcContext {
  return {
    dayGan,
    targetGan,
    dayElement: getStemElement(dayGan),
    targetElement: getStemElement(targetGan),
    dayYinYang: getStemYinYang(dayGan),
    targetYinYang: getStemYinYang(targetGan),
  }
}

// ========== 十神基础计算规则 ==========

export const SHISHEN_RULES: ShenShiRule[] = [
  // ===== 比肩（同五行同阴阳）=====
  {
    id: 'bi-jian-jia',
    name: '比肩-甲',
    category: '比劫',
    priority: 100,
    weight: 100,
    description: '甲木日主遇甲木，同五行同阴阳为比肩',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '甲' && ctx.targetGan === '甲',
    result: { shenShi: '比肩' },
  },
  {
    id: 'bi-jian-yi',
    name: '比肩-乙',
    category: '比劫',
    priority: 100,
    weight: 100,
    description: '乙木日主遇乙木，同五行同阴阳为比肩',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '乙' && ctx.targetGan === '乙',
    result: { shenShi: '比肩' },
  },
  {
    id: 'bi-jian-bing',
    name: '比肩-丙',
    category: '比劫',
    priority: 100,
    weight: 100,
    description: '丙火日主遇丙火，同五行同阴阳为比肩',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丙' && ctx.targetGan === '丙',
    result: { shenShi: '比肩' },
  },
  {
    id: 'bi-jian-ding',
    name: '比肩-丁',
    category: '比劫',
    priority: 100,
    weight: 100,
    description: '丁火日主遇丁火，同五行同阴阳为比肩',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丁' && ctx.targetGan === '丁',
    result: { shenShi: '比肩' },
  },
  {
    id: 'bi-jian-wu',
    name: '比肩-戊',
    category: '比劫',
    priority: 100,
    weight: 100,
    description: '戊土日主遇戊土，同五行同阴阳为比肩',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '戊' && ctx.targetGan === '戊',
    result: { shenShi: '比肩' },
  },
  {
    id: 'bi-jian-ji',
    name: '比肩-己',
    category: '比劫',
    priority: 100,
    weight: 100,
    description: '己土日主遇己土，同五行同阴阳为比肩',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '己' && ctx.targetGan === '己',
    result: { shenShi: '比肩' },
  },
  {
    id: 'bi-jian-geng',
    name: '比肩-庚',
    category: '比劫',
    priority: 100,
    weight: 100,
    description: '庚金日主遇庚金，同五行同阴阳为比肩',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '庚' && ctx.targetGan === '庚',
    result: { shenShi: '比肩' },
  },
  {
    id: 'bi-jian-xin',
    name: '比肩-辛',
    category: '比劫',
    priority: 100,
    weight: 100,
    description: '辛金日主遇辛金，同五行同阴阳为比肩',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '辛' && ctx.targetGan === '辛',
    result: { shenShi: '比肩' },
  },
  {
    id: 'bi-jian-ren',
    name: '比肩-壬',
    category: '比劫',
    priority: 100,
    weight: 100,
    description: '壬水日主遇壬水，同五行同阴阳为比肩',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '壬' && ctx.targetGan === '壬',
    result: { shenShi: '比肩' },
  },
  {
    id: 'bi-jian-gui',
    name: '比肩-癸',
    category: '比劫',
    priority: 100,
    weight: 100,
    description: '癸水日主遇癸水，同五行同阴阳为比肩',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '癸' && ctx.targetGan === '癸',
    result: { shenShi: '比肩' },
  },

  // ===== 劫财（同五行异阴阳）=====
  {
    id: 'jie-cai-jia-yi',
    name: '劫财-甲乙',
    category: '比劫',
    priority: 95,
    weight: 100,
    description: '甲木日主遇乙木，同五行异阴阳为劫财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '甲' && ctx.targetGan === '乙',
    result: { shenShi: '劫财' },
  },
  {
    id: 'jie-cai-yi-jia',
    name: '劫财-乙甲',
    category: '比劫',
    priority: 95,
    weight: 100,
    description: '乙木日主遇甲木，同五行异阴阳为劫财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '乙' && ctx.targetGan === '甲',
    result: { shenShi: '劫财' },
  },
  {
    id: 'jie-cai-bing-ding',
    name: '劫财-丙丁',
    category: '比劫',
    priority: 95,
    weight: 100,
    description: '丙火日主遇丁火，同五行异阴阳为劫财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丙' && ctx.targetGan === '丁',
    result: { shenShi: '劫财' },
  },
  {
    id: 'jie-cai-ding-bing',
    name: '劫财-丁丙',
    category: '比劫',
    priority: 95,
    weight: 100,
    description: '丁火日主遇甲木，同五行异阴阳为劫财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丁' && ctx.targetGan === '丙',
    result: { shenShi: '劫财' },
  },
  {
    id: 'jie-cai-wu-ji',
    name: '劫财-戊己',
    category: '比劫',
    priority: 95,
    weight: 100,
    description: '戊土日主遇己土，同五行异阴阳为劫财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '戊' && ctx.targetGan === '己',
    result: { shenShi: '劫财' },
  },
  {
    id: 'jie-cai-ji-wu',
    name: '劫财-己戊',
    category: '比劫',
    priority: 95,
    weight: 100,
    description: '己土日主遇戊土，同五行异阴阳为劫财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '己' && ctx.targetGan === '戊',
    result: { shenShi: '劫财' },
  },
  {
    id: 'jie-cai-geng-xin',
    name: '劫财-庚辛',
    category: '比劫',
    priority: 95,
    weight: 100,
    description: '庚金日主遇辛金，同五行异阴阳为劫财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '庚' && ctx.targetGan === '辛',
    result: { shenShi: '劫财' },
  },
  {
    id: 'jie-cai-xin-geng',
    name: '劫财-辛庚',
    category: '比劫',
    priority: 95,
    weight: 100,
    description: '辛金日主遇庚金，同五行异阴阳为劫财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '辛' && ctx.targetGan === '庚',
    result: { shenShi: '劫财' },
  },
  {
    id: 'jie-cai-ren-gui',
    name: '劫财-壬癸',
    category: '比劫',
    priority: 95,
    weight: 100,
    description: '壬水日主遇癸水，同五行异阴阳为劫财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '壬' && ctx.targetGan === '癸',
    result: { shenShi: '劫财' },
  },
  {
    id: 'jie-cai-gui-ren',
    name: '劫财-癸壬',
    category: '比劫',
    priority: 95,
    weight: 100,
    description: '癸水日主遇壬水，同五行异阴阳为劫财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '癸' && ctx.targetGan === '壬',
    result: { shenShi: '劫财' },
  },

  // ===== 食神（我生同阴阳）=====
  {
    id: 'shi-shen-jia-bing',
    name: '食神-甲丙',
    category: '食伤',
    priority: 90,
    weight: 100,
    description: '甲木日主遇丙火，我生同阴阳为食神',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '甲' && ctx.targetGan === '丙',
    result: { shenShi: '食神' },
  },
  {
    id: 'shi-shen-yi-ding',
    name: '食神-乙丁',
    category: '食伤',
    priority: 90,
    weight: 100,
    description: '乙木日主遇丁火，我生同阴阳为食神',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '乙' && ctx.targetGan === '丁',
    result: { shenShi: '食神' },
  },
  {
    id: 'shi-shen-bing-wu',
    name: '食神-丙戊',
    category: '食伤',
    priority: 90,
    weight: 100,
    description: '丙火日主遇戊土，我生同阴阳为食神',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丙' && ctx.targetGan === '戊',
    result: { shenShi: '食神' },
  },
  {
    id: 'shi-shen-ding-ji',
    name: '食神-丁己',
    category: '食伤',
    priority: 90,
    weight: 100,
    description: '丁火日主遇己土，我生同阴阳为食神',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丁' && ctx.targetGan === '己',
    result: { shenShi: '食神' },
  },
  {
    id: 'shi-shen-wu-geng',
    name: '食神-戊庚',
    category: '食伤',
    priority: 90,
    weight: 100,
    description: '戊土日主遇庚金，我生同阴阳为食神',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '戊' && ctx.targetGan === '庚',
    result: { shenShi: '食神' },
  },
  {
    id: 'shi-shen-ji-xin',
    name: '食神-己辛',
    category: '食伤',
    priority: 90,
    weight: 100,
    description: '己土日主遇辛金，我生同阴阳为食神',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '己' && ctx.targetGan === '辛',
    result: { shenShi: '食神' },
  },
  {
    id: 'shi-shen-geng-ren',
    name: '食神-庚壬',
    category: '食伤',
    priority: 90,
    weight: 100,
    description: '庚金日主遇壬水，我生同阴阳为食神',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '庚' && ctx.targetGan === '壬',
    result: { shenShi: '食神' },
  },
  {
    id: 'shi-shen-xin-gui',
    name: '食神-辛癸',
    category: '食伤',
    priority: 90,
    weight: 100,
    description: '辛金日主遇癸水，我生同阴阳为食神',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '辛' && ctx.targetGan === '癸',
    result: { shenShi: '食神' },
  },
  {
    id: 'shi-shen-ren-jia',
    name: '食神-壬甲',
    category: '食伤',
    priority: 90,
    weight: 100,
    description: '壬水日主遇甲木，我生同阴阳为食神',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '壬' && ctx.targetGan === '甲',
    result: { shenShi: '食神' },
  },
  {
    id: 'shi-shen-gui-yi',
    name: '食神-癸乙',
    category: '食伤',
    priority: 90,
    weight: 100,
    description: '癸水日主遇乙木，我生同阴阳为食神',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '癸' && ctx.targetGan === '乙',
    result: { shenShi: '食神' },
  },

  // ===== 伤官（我生异阴阳）=====
  {
    id: 'shang-guan-jia-ding',
    name: '伤官-甲丁',
    category: '食伤',
    priority: 85,
    weight: 100,
    description: '甲木日主遇丁火，我生异阴阳为伤官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '甲' && ctx.targetGan === '丁',
    result: { shenShi: '伤官' },
  },
  {
    id: 'shang-guan-yi-bing',
    name: '伤官-乙丙',
    category: '食伤',
    priority: 85,
    weight: 100,
    description: '乙木日主遇丙火，我生异阴阳为伤官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '乙' && ctx.targetGan === '丙',
    result: { shenShi: '伤官' },
  },
  {
    id: 'shang-guan-bing-ji',
    name: '伤官-丙己',
    category: '食伤',
    priority: 85,
    weight: 100,
    description: '丙火日主遇己土，我生异阴阳为伤官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丙' && ctx.targetGan === '己',
    result: { shenShi: '伤官' },
  },
  {
    id: 'shang-guan-ding-wu',
    name: '伤官-丁戊',
    category: '食伤',
    priority: 85,
    weight: 100,
    description: '丁火日主遇戊土，我生异阴阳为伤官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丁' && ctx.targetGan === '戊',
    result: { shenShi: '伤官' },
  },
  {
    id: 'shang-guan-wu-xin',
    name: '伤官-戊辛',
    category: '食伤',
    priority: 85,
    weight: 100,
    description: '戊土日主遇辛金，我生异阴阳为伤官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '戊' && ctx.targetGan === '辛',
    result: { shenShi: '伤官' },
  },
  {
    id: 'shang-guan-ji-geng',
    name: '伤官-己庚',
    category: '食伤',
    priority: 85,
    weight: 100,
    description: '己土日主遇庚金，我生异阴阳为伤官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '己' && ctx.targetGan === '庚',
    result: { shenShi: '伤官' },
  },
  {
    id: 'shang-guan-geng-gui',
    name: '伤官-庚癸',
    category: '食伤',
    priority: 85,
    weight: 100,
    description: '庚金日主遇癸水，我生异阴阳为伤官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '庚' && ctx.targetGan === '癸',
    result: { shenShi: '伤官' },
  },
  {
    id: 'shang-guan-xin-ren',
    name: '伤官-辛壬',
    category: '食伤',
    priority: 85,
    weight: 100,
    description: '辛金日主遇壬水，我生异阴阳为伤官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '辛' && ctx.targetGan === '壬',
    result: { shenShi: '伤官' },
  },
  {
    id: 'shang-guan-ren-yi',
    name: '伤官-壬乙',
    category: '食伤',
    priority: 85,
    weight: 100,
    description: '壬水日主遇乙木，我生异阴阳为伤官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '壬' && ctx.targetGan === '乙',
    result: { shenShi: '伤官' },
  },
  {
    id: 'shang-guan-gui-jia',
    name: '伤官-癸甲',
    category: '食伤',
    priority: 85,
    weight: 100,
    description: '癸水日主遇甲木，我生异阴阳为伤官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '癸' && ctx.targetGan === '甲',
    result: { shenShi: '伤官' },
  },

  // ===== 偏财（我克同阴阳）=====
  {
    id: 'pian-cai-jia-wu',
    name: '偏财-甲戊',
    category: '财星',
    priority: 80,
    weight: 100,
    description: '甲木日主遇戊土，我克同阴阳为偏财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '甲' && ctx.targetGan === '戊',
    result: { shenShi: '偏财' },
  },
  {
    id: 'pian-cai-yi-ji',
    name: '偏财-乙己',
    category: '财星',
    priority: 80,
    weight: 100,
    description: '乙木日主遇己土，我克同阴阳为偏财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '乙' && ctx.targetGan === '己',
    result: { shenShi: '偏财' },
  },
  {
    id: 'pian-cai-bing-geng',
    name: '偏财-丙庚',
    category: '财星',
    priority: 80,
    weight: 100,
    description: '丙火日主遇庚金，我克同阴阳为偏财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丙' && ctx.targetGan === '庚',
    result: { shenShi: '偏财' },
  },
  {
    id: 'pian-cai-ding-xin',
    name: '偏财-丁辛',
    category: '财星',
    priority: 80,
    weight: 100,
    description: '丁火日主遇辛金，我克同阴阳为偏财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丁' && ctx.targetGan === '辛',
    result: { shenShi: '偏财' },
  },
  {
    id: 'pian-cai-wu-ren',
    name: '偏财-戊壬',
    category: '财星',
    priority: 80,
    weight: 100,
    description: '戊土日主遇壬水，我克同阴阳为偏财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '戊' && ctx.targetGan === '壬',
    result: { shenShi: '偏财' },
  },
  {
    id: 'pian-cai-ji-gui',
    name: '偏财-己癸',
    category: '财星',
    priority: 80,
    weight: 100,
    description: '己土日主遇癸水，我克同阴阳为偏财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '己' && ctx.targetGan === '癸',
    result: { shenShi: '偏财' },
  },
  {
    id: 'pian-cai-geng-jia',
    name: '偏财-庚甲',
    category: '财星',
    priority: 80,
    weight: 100,
    description: '庚金日主遇甲木，我克同阴阳为偏财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '庚' && ctx.targetGan === '甲',
    result: { shenShi: '偏财' },
  },
  {
    id: 'pian-cai-xin-yi',
    name: '偏财-辛乙',
    category: '财星',
    priority: 80,
    weight: 100,
    description: '辛金日主遇乙木，我克同阴阳为偏财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '辛' && ctx.targetGan === '乙',
    result: { shenShi: '偏财' },
  },
  {
    id: 'pian-cai-ren-bing',
    name: '偏财-壬丙',
    category: '财星',
    priority: 80,
    weight: 100,
    description: '壬水日主遇丙火，我克同阴阳为偏财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '壬' && ctx.targetGan === '丙',
    result: { shenShi: '偏财' },
  },
  {
    id: 'pian-cai-gui-ding',
    name: '偏财-癸丁',
    category: '财星',
    priority: 80,
    weight: 100,
    description: '癸水日主遇丁火，我克同阴阳为偏财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '癸' && ctx.targetGan === '丁',
    result: { shenShi: '偏财' },
  },

  // ===== 正财（我克异阴阳）=====
  {
    id: 'zheng-cai-jia-ji',
    name: '正财-甲己',
    category: '财星',
    priority: 75,
    weight: 100,
    description: '甲木日主遇己土，我克异阴阳为正财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '甲' && ctx.targetGan === '己',
    result: { shenShi: '正财' },
  },
  {
    id: 'zheng-cai-yi-wu',
    name: '正财-乙戊',
    category: '财星',
    priority: 75,
    weight: 100,
    description: '乙木日主遇戊土，我克异阴阳为正财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '乙' && ctx.targetGan === '戊',
    result: { shenShi: '正财' },
  },
  {
    id: 'zheng-cai-bing-xin',
    name: '正财-丙辛',
    category: '财星',
    priority: 75,
    weight: 100,
    description: '丙火日主遇辛金，我克异阴阳为正财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丙' && ctx.targetGan === '辛',
    result: { shenShi: '正财' },
  },
  {
    id: 'zheng-cai-ding-geng',
    name: '正财-丁庚',
    category: '财星',
    priority: 75,
    weight: 100,
    description: '丁火日主遇庚金，我克异阴阳为正财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丁' && ctx.targetGan === '庚',
    result: { shenShi: '正财' },
  },
  {
    id: 'zheng-cai-wu-gui',
    name: '正财-戊癸',
    category: '财星',
    priority: 75,
    weight: 100,
    description: '戊土日主遇癸水，我克异阴阳为正财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '戊' && ctx.targetGan === '癸',
    result: { shenShi: '正财' },
  },
  {
    id: 'zheng-cai-ji-ren',
    name: '正财-己壬',
    category: '财星',
    priority: 75,
    weight: 100,
    description: '己土日主遇壬水，我克异阴阳为正财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '己' && ctx.targetGan === '壬',
    result: { shenShi: '正财' },
  },
  {
    id: 'zheng-cai-geng-yi',
    name: '正财-庚乙',
    category: '财星',
    priority: 75,
    weight: 100,
    description: '庚金日主遇乙木，我克异阴阳为正财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '庚' && ctx.targetGan === '乙',
    result: { shenShi: '正财' },
  },
  {
    id: 'zheng-cai-xin-jia',
    name: '正财-辛甲',
    category: '财星',
    priority: 75,
    weight: 100,
    description: '辛金日主遇甲木，我克异阴阳为正财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '辛' && ctx.targetGan === '甲',
    result: { shenShi: '正财' },
  },
  {
    id: 'zheng-cai-ren-ding',
    name: '正财-壬丁',
    category: '财星',
    priority: 75,
    weight: 100,
    description: '壬水日主遇丁火，我克异阴阳为正财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '壬' && ctx.targetGan === '丁',
    result: { shenShi: '正财' },
  },
  {
    id: 'zheng-cai-gui-bing',
    name: '正财-癸丙',
    category: '财星',
    priority: 75,
    weight: 100,
    description: '癸水日主遇丙火，我克异阴阳为正财',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '癸' && ctx.targetGan === '丙',
    result: { shenShi: '正财' },
  },

  // ===== 偏官/七杀（克我同阴阳）=====
  {
    id: 'pian-guan-jia-geng',
    name: '偏官-甲庚',
    category: '官杀',
    priority: 70,
    weight: 100,
    description: '甲木日主遇庚金，克我同阴阳为偏官（七杀）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '甲' && ctx.targetGan === '庚',
    result: { shenShi: '偏官' },
  },
  {
    id: 'pian-guan-yi-xin',
    name: '偏官-乙辛',
    category: '官杀',
    priority: 70,
    weight: 100,
    description: '乙木日主遇辛金，克我同阴阳为偏官（七杀）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '乙' && ctx.targetGan === '辛',
    result: { shenShi: '偏官' },
  },
  {
    id: 'pian-guan-bing-ren',
    name: '偏官-丙壬',
    category: '官杀',
    priority: 70,
    weight: 100,
    description: '丙火日主遇壬水，克我同阴阳为偏官（七杀）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丙' && ctx.targetGan === '壬',
    result: { shenShi: '偏官' },
  },
  {
    id: 'pian-guan-ding-gui',
    name: '偏官-丁癸',
    category: '官杀',
    priority: 70,
    weight: 100,
    description: '丁火日主遇癸水，克我同阴阳为偏官（七杀）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丁' && ctx.targetGan === '癸',
    result: { shenShi: '偏官' },
  },
  {
    id: 'pian-guan-wu-jia',
    name: '偏官-戊甲',
    category: '官杀',
    priority: 70,
    weight: 100,
    description: '戊土日主遇甲木，克我同阴阳为偏官（七杀）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '戊' && ctx.targetGan === '甲',
    result: { shenShi: '偏官' },
  },
  {
    id: 'pian-guan-ji-yi',
    name: '偏官-己乙',
    category: '官杀',
    priority: 70,
    weight: 100,
    description: '己土日主遇乙木，克我同阴阳为偏官（七杀）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '己' && ctx.targetGan === '乙',
    result: { shenShi: '偏官' },
  },
  {
    id: 'pian-guan-geng-bing',
    name: '偏官-庚丙',
    category: '官杀',
    priority: 70,
    weight: 100,
    description: '庚金日主遇丙火，克我同阴阳为偏官（七杀）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '庚' && ctx.targetGan === '丙',
    result: { shenShi: '偏官' },
  },
  {
    id: 'pian-guan-xin-ding',
    name: '偏官-辛丁',
    category: '官杀',
    priority: 70,
    weight: 100,
    description: '辛金日主遇丁火，克我同阴阳为偏官（七杀）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '辛' && ctx.targetGan === '丁',
    result: { shenShi: '偏官' },
  },
  {
    id: 'pian-guan-ren-wu',
    name: '偏官-壬戊',
    category: '官杀',
    priority: 70,
    weight: 100,
    description: '壬水日主遇戊土，克我同阴阳为偏官（七杀）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '壬' && ctx.targetGan === '戊',
    result: { shenShi: '偏官' },
  },
  {
    id: 'pian-guan-gui-ji',
    name: '偏官-癸己',
    category: '官杀',
    priority: 70,
    weight: 100,
    description: '癸水日主遇己土，克我同阴阳为偏官（七杀）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '癸' && ctx.targetGan === '己',
    result: { shenShi: '偏官' },
  },

  // ===== 正官（克我异阴阳）=====
  {
    id: 'zheng-guan-jia-xin',
    name: '正官-甲辛',
    category: '官杀',
    priority: 65,
    weight: 100,
    description: '甲木日主遇辛金，克我异阴阳为正官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '甲' && ctx.targetGan === '辛',
    result: { shenShi: '正官' },
  },
  {
    id: 'zheng-guan-yi-geng',
    name: '正官-乙庚',
    category: '官杀',
    priority: 65,
    weight: 100,
    description: '乙木日主遇庚金，克我异阴阳为正官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '乙' && ctx.targetGan === '庚',
    result: { shenShi: '正官' },
  },
  {
    id: 'zheng-guan-bing-gui',
    name: '正官-丙癸',
    category: '官杀',
    priority: 65,
    weight: 100,
    description: '丙火日主遇癸水，克我异阴阳为正官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丙' && ctx.targetGan === '癸',
    result: { shenShi: '正官' },
  },
  {
    id: 'zheng-guan-ding-ren',
    name: '正官-丁壬',
    category: '官杀',
    priority: 65,
    weight: 100,
    description: '丁火日主遇壬水，克我异阴阳为正官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丁' && ctx.targetGan === '壬',
    result: { shenShi: '正官' },
  },
  {
    id: 'zheng-guan-wu-yi',
    name: '正官-戊乙',
    category: '官杀',
    priority: 65,
    weight: 100,
    description: '戊土日主遇乙木，克我异阴阳为正官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '戊' && ctx.targetGan === '乙',
    result: { shenShi: '正官' },
  },
  {
    id: 'zheng-guan-ji-jia',
    name: '正官-己甲',
    category: '官杀',
    priority: 65,
    weight: 100,
    description: '己土日主遇甲木，克我异阴阳为正官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '己' && ctx.targetGan === '甲',
    result: { shenShi: '正官' },
  },
  {
    id: 'zheng-guan-geng-ding',
    name: '正官-庚丁',
    category: '官杀',
    priority: 65,
    weight: 100,
    description: '庚金日主遇丁火，克我异阴阳为正官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '庚' && ctx.targetGan === '丁',
    result: { shenShi: '正官' },
  },
  {
    id: 'zheng-guan-xin-bing',
    name: '正官-辛丙',
    category: '官杀',
    priority: 65,
    weight: 100,
    description: '辛金日主遇丙火，克我异阴阳为正官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '辛' && ctx.targetGan === '丙',
    result: { shenShi: '正官' },
  },
  {
    id: 'zheng-guan-ren-ji',
    name: '正官-壬己',
    category: '官杀',
    priority: 65,
    weight: 100,
    description: '壬水日主遇己土，克我异阴阳为正官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '壬' && ctx.targetGan === '己',
    result: { shenShi: '正官' },
  },
  {
    id: 'zheng-guan-gui-wu',
    name: '正官-癸戊',
    category: '官杀',
    priority: 65,
    weight: 100,
    description: '癸水日主遇戊土，克我异阴阳为正官',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '癸' && ctx.targetGan === '戊',
    result: { shenShi: '正官' },
  },

  // ===== 偏印（生我同阴阳）=====
  {
    id: 'pian-yin-jia-ren',
    name: '偏印-甲壬',
    category: '印星',
    priority: 60,
    weight: 100,
    description: '甲木日主遇壬水，生我同阴阳为偏印（枭神）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '甲' && ctx.targetGan === '壬',
    result: { shenShi: '偏印' },
  },
  {
    id: 'pian-yin-yi-gui',
    name: '偏印-乙癸',
    category: '印星',
    priority: 60,
    weight: 100,
    description: '乙木日主遇癸水，生我同阴阳为偏印（枭神）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '乙' && ctx.targetGan === '癸',
    result: { shenShi: '偏印' },
  },
  {
    id: 'pian-yin-bing-jia',
    name: '偏印-丙甲',
    category: '印星',
    priority: 60,
    weight: 100,
    description: '丙火日主遇甲木，生我同阴阳为偏印（枭神）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丙' && ctx.targetGan === '甲',
    result: { shenShi: '偏印' },
  },
  {
    id: 'pian-yin-ding-yi',
    name: '偏印-丁乙',
    category: '印星',
    priority: 60,
    weight: 100,
    description: '丁火日主遇乙木，生我同阴阳为偏印（枭神）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丁' && ctx.targetGan === '乙',
    result: { shenShi: '偏印' },
  },
  {
    id: 'pian-yin-wu-bing',
    name: '偏印-戊丙',
    category: '印星',
    priority: 60,
    weight: 100,
    description: '戊土日主遇丙火，生我同阴阳为偏印（枭神）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '戊' && ctx.targetGan === '丙',
    result: { shenShi: '偏印' },
  },
  {
    id: 'pian-yin-ji-ding',
    name: '偏印-己丁',
    category: '印星',
    priority: 60,
    weight: 100,
    description: '己土日主遇丁火，生我同阴阳为偏印（枭神）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '己' && ctx.targetGan === '丁',
    result: { shenShi: '偏印' },
  },
  {
    id: 'pian-yin-geng-wu',
    name: '偏印-庚戊',
    category: '印星',
    priority: 60,
    weight: 100,
    description: '庚金日主遇戊土，生我同阴阳为偏印（枭神）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '庚' && ctx.targetGan === '戊',
    result: { shenShi: '偏印' },
  },
  {
    id: 'pian-yin-xin-ji',
    name: '偏印-辛己',
    category: '印星',
    priority: 60,
    weight: 100,
    description: '辛金日主遇己土，生我同阴阳为偏印（枭神）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '辛' && ctx.targetGan === '己',
    result: { shenShi: '偏印' },
  },
  {
    id: 'pian-yin-ren-geng',
    name: '偏印-壬庚',
    category: '印星',
    priority: 60,
    weight: 100,
    description: '壬水日主遇庚金，生我同阴阳为偏印（枭神）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '壬' && ctx.targetGan === '庚',
    result: { shenShi: '偏印' },
  },
  {
    id: 'pian-yin-gui-xin',
    name: '偏印-癸辛',
    category: '印星',
    priority: 60,
    weight: 100,
    description: '癸水日主遇辛金，生我同阴阳为偏印（枭神）',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '癸' && ctx.targetGan === '辛',
    result: { shenShi: '偏印' },
  },

  // ===== 正印（生我异阴阳）=====
  {
    id: 'zheng-yin-jia-gui',
    name: '正印-甲癸',
    category: '印星',
    priority: 55,
    weight: 100,
    description: '甲木日主遇癸水，生我异阴阳为正印',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '甲' && ctx.targetGan === '癸',
    result: { shenShi: '正印' },
  },
  {
    id: 'zheng-yin-yi-ren',
    name: '正印-乙壬',
    category: '印星',
    priority: 55,
    weight: 100,
    description: '乙木日主遇壬水，生我异阴阳为正印',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '乙' && ctx.targetGan === '壬',
    result: { shenShi: '正印' },
  },
  {
    id: 'zheng-yin-bing-yi',
    name: '正印-丙乙',
    category: '印星',
    priority: 55,
    weight: 100,
    description: '丙火日主遇乙木，生我异阴阳为正印',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丙' && ctx.targetGan === '乙',
    result: { shenShi: '正印' },
  },
  {
    id: 'zheng-yin-ding-jia',
    name: '正印-丁甲',
    category: '印星',
    priority: 55,
    weight: 100,
    description: '丁火日主遇甲木，生我异阴阳为正印',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '丁' && ctx.targetGan === '甲',
    result: { shenShi: '正印' },
  },
  {
    id: 'zheng-yin-wu-ding',
    name: '正印-戊丁',
    category: '印星',
    priority: 55,
    weight: 100,
    description: '戊土日主遇丁火，生我异阴阳为正印',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '戊' && ctx.targetGan === '丁',
    result: { shenShi: '正印' },
  },
  {
    id: 'zheng-yin-ji-bing',
    name: '正印-己丙',
    category: '印星',
    priority: 55,
    weight: 100,
    description: '己土日主遇丙火，生我异阴阳为正印',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '己' && ctx.targetGan === '丙',
    result: { shenShi: '正印' },
  },
  {
    id: 'zheng-yin-geng-ji',
    name: '正印-庚己',
    category: '印星',
    priority: 55,
    weight: 100,
    description: '庚金日主遇己土，生我异阴阳为正印',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '庚' && ctx.targetGan === '己',
    result: { shenShi: '正印' },
  },
  {
    id: 'zheng-yin-xin-wu',
    name: '正印-辛戊',
    category: '印星',
    priority: 55,
    weight: 100,
    description: '辛金日主遇戊土，生我异阴阳为正印',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '辛' && ctx.targetGan === '戊',
    result: { shenShi: '正印' },
  },
  {
    id: 'zheng-yin-ren-xin',
    name: '正印-壬辛',
    category: '印星',
    priority: 55,
    weight: 100,
    description: '壬水日主遇辛金，生我异阴阳为正印',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '壬' && ctx.targetGan === '辛',
    result: { shenShi: '正印' },
  },
  {
    id: 'zheng-yin-gui-geng',
    name: '正印-癸庚',
    category: '印星',
    priority: 55,
    weight: 100,
    description: '癸水日主遇庚金，生我异阴阳为正印',
    reference: '《子平真诠》十神篇',
    condition: (ctx) => ctx.dayGan === '癸' && ctx.targetGan === '庚',
    result: { shenShi: '正印' },
  },
]

// ========== 十神力量分析 ==========

function createEmptyShenShiPowers(): Record<ShenShi, ShenShiPower> {
  const result = {} as Record<ShenShi, ShenShiPower>
  for (const shen of ALL_SHENSHI) {
    result[shen] = {
      count: 0,
      touGan: 0,
      cangGan: 0,
      power: 0,
    }
  }
  return result
}

export function getShenShiPowers(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  cangGanData: Record<EarthlyBranch, CangGan>,
): Record<ShenShi, ShenShiPower> {
  const powers = createEmptyShenShiPowers()
  const shenShiMap = getAllShenShiMap(dayGan)

  const pillars = [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]

  for (const pillar of pillars) {
    const touGanShen = shenShiMap[pillar.gan]
    powers[touGanShen].touGan += 1
    powers[touGanShen].count += 1

    const cangGan = cangGanData[pillar.zhi]
    if (cangGan) {
      const benShen = shenShiMap[cangGan.ben]
      powers[benShen].cangGan += 1
      powers[benShen].count += 1

      if (cangGan.zhong) {
        const zhongShen = shenShiMap[cangGan.zhong]
        powers[zhongShen].cangGan += 1
        powers[zhongShen].count += 1
      }
      if (cangGan.yao) {
        const yaoShen = shenShiMap[cangGan.yao]
        powers[yaoShen].cangGan += 1
        powers[yaoShen].count += 1
      }
    }
  }

  let maxCount = 0
  for (const shen of ALL_SHENSHI) {
    if (powers[shen].count > maxCount) {
      maxCount = powers[shen].count
    }
  }

  if (maxCount > 0) {
    for (const shen of ALL_SHENSHI) {
      const p = powers[shen]
      const baseScore = p.touGan * 10 + p.cangGan * 5
      const normalizedScore = Math.min(100, Math.round((baseScore / 40) * 100))
      p.power = normalizedScore
    }
  }

  return powers
}

// ========== 十神组合规则 ==========

export const SHISHEN_COMBINATION_RULES: ShenShiCombinationRule[] = [
  {
    id: 'shi-shen-zhi-sha',
    name: '食神制杀',
    category: '吉格',
    priority: 100,
    weight: 90,
    description: '食神与七杀同现，食神制伏七杀，化凶为吉',
    reference: '《三命通会》食神制杀格',
    condition: (ctx) => {
      const shiShen = ctx.shenShiPowers['食神']
      const qiSha = ctx.shenShiPowers['偏官']
      return shiShen.count >= 1 && qiSha.count >= 1 && shiShen.power >= qiSha.power * 0.6
    },
    result: {
      name: '食神制杀',
      description: '食神制伏七杀，威权显赫，有勇有谋',
      auspicious: true,
      strength: 85,
      mainShens: ['食神', '偏官'],
    },
  },
  {
    id: 'sha-yin-xiang-sheng',
    name: '杀印相生',
    category: '吉格',
    priority: 95,
    weight: 88,
    description: '七杀与正印同现，杀生印，印生身，贵格',
    reference: '《子平真诠》杀印相生格',
    condition: (ctx) => {
      const qiSha = ctx.shenShiPowers['偏官']
      const zhengYin = ctx.shenShiPowers['正印']
      return qiSha.count >= 1 && zhengYin.count >= 1
    },
    result: {
      name: '杀印相生',
      description: '杀生印，印生身，功名显达，文武双全',
      auspicious: true,
      strength: 88,
      mainShens: ['偏官', '正印'],
    },
  },
  {
    id: 'shang-guan-pei-yin',
    name: '伤官配印',
    category: '吉格',
    priority: 90,
    weight: 85,
    description: '伤官与正印同现，印星制伤生身，才华横溢',
    reference: '《滴天髓》伤官配印格',
    condition: (ctx) => {
      const shangGuan = ctx.shenShiPowers['伤官']
      const zhengYin = ctx.shenShiPowers['正印']
      return shangGuan.count >= 1 && zhengYin.count >= 1
    },
    result: {
      name: '伤官配印',
      description: '伤官泄秀配印星，聪明过人，文章盖世',
      auspicious: true,
      strength: 85,
      mainShens: ['伤官', '正印'],
    },
  },
  {
    id: 'cai-guan-shuang-mei',
    name: '财官双美',
    category: '吉格',
    priority: 85,
    weight: 82,
    description: '正财与正官同现，财生官，富贵双全',
    reference: '《三命通会》财官双美格',
    condition: (ctx) => {
      const zhengCai = ctx.shenShiPowers['正财']
      const zhengGuan = ctx.shenShiPowers['正官']
      return zhengCai.count >= 1 && zhengGuan.count >= 1
    },
    result: {
      name: '财官双美',
      description: '财生官旺，富贵双全，名利双收',
      auspicious: true,
      strength: 82,
      mainShens: ['正财', '正官'],
    },
  },
  {
    id: 'guan-yin-xiang-sheng',
    name: '官印相生',
    category: '吉格',
    priority: 80,
    weight: 80,
    description: '正官与正印同现，官生印，印生身，清贵之格',
    reference: '《子平真诠》官印相生格',
    condition: (ctx) => {
      const zhengGuan = ctx.shenShiPowers['正官']
      const zhengYin = ctx.shenShiPowers['正印']
      return zhengGuan.count >= 1 && zhengYin.count >= 1
    },
    result: {
      name: '官印相生',
      description: '官印相生，清正廉洁，仕途顺遂',
      auspicious: true,
      strength: 80,
      mainShens: ['正官', '正印'],
    },
  },
  {
    id: 'shi-shang-sheng-cai',
    name: '食伤生财',
    category: '吉格',
    priority: 75,
    weight: 78,
    description: '食神伤官与财星同现，食伤生财，财源广进',
    reference: '《滴天髓》食伤生财格',
    condition: (ctx) => {
      const shiShen = ctx.shenShiPowers['食神']
      const shangGuan = ctx.shenShiPowers['伤官']
      const zhengCai = ctx.shenShiPowers['正财']
      const pianCai = ctx.shenShiPowers['偏财']
      const shiShangCount = shiShen.count + shangGuan.count
      const caiCount = zhengCai.count + pianCai.count
      return shiShangCount >= 1 && caiCount >= 1
    },
    result: {
      name: '食伤生财',
      description: '食伤生财，财源广进，富贵自天来',
      auspicious: true,
      strength: 78,
      mainShens: ['食神', '伤官', '正财', '偏财'],
    },
  },
  {
    id: 'bi-jie-duo-cai',
    name: '比劫夺财',
    category: '凶格',
    priority: 70,
    weight: 85,
    description: '比劫与财星同现且比劫旺，财运被夺',
    reference: '《三命通会》比劫夺财',
    condition: (ctx) => {
      const biJian = ctx.shenShiPowers['比肩']
      const jieCai = ctx.shenShiPowers['劫财']
      const zhengCai = ctx.shenShiPowers['正财']
      const pianCai = ctx.shenShiPowers['偏财']
      const biJieCount = biJian.count + jieCai.count
      const caiCount = zhengCai.count + pianCai.count
      return biJieCount >= 2 && caiCount >= 1 && (biJian.power + jieCai.power) > (zhengCai.power + pianCai.power)
    },
    result: {
      name: '比劫夺财',
      description: '比劫旺而夺财，财运起伏，易有破财',
      auspicious: false,
      strength: 75,
      mainShens: ['比肩', '劫财', '正财', '偏财'],
    },
  },
  {
    id: 'yang-ren-jia-sha',
    name: '羊刃驾杀',
    category: '吉格',
    priority: 65,
    weight: 82,
    description: '劫财（羊刃）与七杀同现，以刃敌杀，威权显赫',
    reference: '《三命通会》羊刃驾杀格',
    condition: (ctx) => {
      const yangRen = ctx.shenShiPowers['劫财']
      const qiSha = ctx.shenShiPowers['偏官']
      return yangRen.count >= 1 && qiSha.count >= 1 && yangRen.touGan >= 1 && qiSha.touGan >= 1
    },
    result: {
      name: '羊刃驾杀',
      description: '羊刃驾杀，权威出众，武将之命',
      auspicious: true,
      strength: 82,
      mainShens: ['劫财', '偏官'],
    },
  },
]

// ========== 核心导出函数 ==========

export function calcShenShiByRules(
  dayGan: HeavenlyStem,
  targetGan: HeavenlyStem,
): CalcShenShiResult {
  const ctx = buildShenShiCalcContext(dayGan, targetGan)

  const sortedRules = [...SHISHEN_RULES].sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    try {
      if (rule.condition(ctx)) {
        return {
          shenShi: rule.result.shenShi,
          matchedRule: rule,
          confidence: rule.weight,
        }
      }
    } catch (_e) {
      continue
    }
  }

  const fallbackShenShi = calcSingleShenShi(dayGan, targetGan)
  return {
    shenShi: fallbackShenShi,
    matchedRule: null,
    confidence: 70,
  }
}

export function analyzeShenShiCombinations(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  cangGanData: Record<EarthlyBranch, CangGan>,
): ShenShiCombination[] {
  const shenShiPowers = getShenShiPowers(sixLines, dayGan, cangGanData)

  const ctx: ShenShiCombinationContext = {
    sixLines,
    dayGan,
    cangGanData,
    shenShiPowers,
  }

  const results: ShenShiCombination[] = []

  const sortedRules = [...SHISHEN_COMBINATION_RULES].sort((a, b) => b.priority - a.priority)

  for (const rule of sortedRules) {
    try {
      if (rule.condition(ctx)) {
        const confidence = Math.min(100, Math.round(rule.weight * 0.6 + rule.result.strength * 0.4))
        results.push({
          id: rule.id,
          name: rule.result.name,
          description: rule.result.description,
          auspicious: rule.result.auspicious,
          strength: rule.result.strength,
          confidence,
          mainShens: rule.result.mainShens,
          reference: rule.reference,
        })
      }
    } catch (_e) {
      continue
    }
  }

  return results
}

// ========== 向后兼容导出 ==========

export type ShenShiContext = ShenShiCalcContext

export function calculateShenShi(dayGan: HeavenlyStem, targetGan: HeavenlyStem): ShenShi {
  return calcSingleShenShi(dayGan, targetGan)
}

export function applyShiShenRules(ctx: ShenShiCalcContext): ShenShi {
  const sortedRules = [...SHISHEN_RULES].sort((a, b) => b.priority - a.priority)
  for (const rule of sortedRules) {
    try {
      if (rule.condition(ctx)) {
        return rule.result.shenShi
      }
    } catch (_e) {
      continue
    }
  }
  return calcSingleShenShi(ctx.dayGan, ctx.targetGan)
}

export function getAllShenShi(dayGan: HeavenlyStem): Record<HeavenlyStem, ShenShi> {
  return getAllShenShiMap(dayGan)
}
