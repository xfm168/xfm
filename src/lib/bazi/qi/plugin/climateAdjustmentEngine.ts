/**
 * ClimateAdjustmentEngine — P2-2 调候系统
 * 
 * 依据：
 *   《穷通宝鉴》（徐乐吾编注）— 调候用神专著
 *   《滴天髓》 — "寒暖燥湿，四时之气"
 * 
 * 核心逻辑：
 *   1. 判断命局寒暖燥湿
 *   2. 根据月令和日主确定调候用神
 *   3. 输出调候建议和评分
 * 
 * 原则：
 *   - 所有数据来自古籍
 *   - Plugin 方式接入
 *   - Explain 引用出处
 */

import type { SixLines, FiveElement, HeavenlyStem, EarthlyBranch } from '../../types'
import { STEM_ELEMENT } from '../../../core'

// ─── 类型定义 ───

export type ClimateType = '寒' | '暖' | '燥' | '湿' | '中和'

export interface ClimateNeed {
  /** 调候用神五行 */
  element: FiveElement
  /** 用神天干（如丙火、壬水） */
  preferredStems: HeavenlyStem[]
  /** 调候说明 */
  description: string
  /** 古籍出处 */
  source: string
  /** 优先级（1=最需要，5=次要） */
  priority: number
}

export interface ClimateAdjustmentResult {
  /** 命局气候类型 */
  climateType: ClimateType
  /** 气候评分 0-100（100=完美中和） */
  climateScore: number
  /** 是否需要调候 */
  needsAdjustment: boolean
  /** 调候需求列表 */
  needs: ClimateNeed[]
  /** 调候建议 */
  advice: string
  /** 古籍引用 */
  classicalQuote: string
  /** 月令寒暖属性 */
  monthClimate: ClimateType
  /** 日主调候参考 */
  dayGanClimate: string
}

// ─── 季节气候属性 ───

/** 月令气候属性 */
const MONTH_CLIMATE: Record<EarthlyBranch, ClimateType> = {
  '子': '寒', '丑': '寒',
  '寅': '暖', '卯': '暖', '辰': '湿',
  '巳': '暖', '午': '燥', '未': '燥',
  '申': '暖', '酉': '燥', '戌': '燥',
  '亥': '寒',
}

/** 五行与气候关系 */
const ELEMENT_CLIMATE_EFFECT: Record<FiveElement, { cold: number; hot: number; dry: number; wet: number }> = {
  '木': { cold: 0, hot: 2, dry: 0, wet: 1 },
  '火': { cold: 3, hot: -3, dry: 2, wet: 0 },
  '土': { cold: 0, hot: 0, dry: 1, wet: 1 },
  '金': { cold: 2, hot: -2, dry: 2, wet: 0 },
  '水': { cold: -3, hot: 1, dry: 0, wet: 2 },
}

// ─── 调候用神数据库（源自《穷通宝鉴》）───

/**
 * 调候用神速查表
 * 
 * 结构：monthZhi → dayElement → 调候方案
 * 
 * 《穷通宝鉴》核心原则：
 * - 冬水先丙（冬月水日主，先用丙火暖之）
 * - 夏火喜壬（夏月火日主，用壬水济之）
 * - 春木喜火（初春尚有余寒，丙癸并用）
 * - 秋金喜水（秋金偏燥，用壬水淘洗）
 * - 春土喜甲（春土板结，甲木疏之）
 * - 夏土喜水（夏土燥热，水润之）
 * - 秋木喜水（秋木枯槁，水润之）
 * - 冬木喜火（冬木寒冻，丙火暖之）
 */

interface ClimateRule {
  needs: ClimateNeed[]
  quote: string
  advice: string
}

const CLIMATE_RULES: Partial<Record<EarthlyBranch, Partial<Record<FiveElement, ClimateRule>>>> = {
  // ─── 冬季（亥子丑）—— 寒 ───
  '子': {
    '木': {
      needs: [
        { element: '火', preferredStems: ['丙', '丁'], description: '冬木寒冻，急用丙火暖之', source: '穷通宝鉴·十二月乙木', priority: 1 },
        { element: '水', preferredStems: ['癸'], description: '次用癸水润泽', source: '穷通宝鉴·十二月乙木', priority: 2 },
      ],
      quote: '十二月乙木，天寒地冻，木气已死。专用丙火暖之，次用癸水润之。',
      advice: '冬木需丙火暖局，癸水滋润，丙癸齐临方能发荣',
    },
    '火': {
      needs: [
        { element: '木', preferredStems: ['甲', '乙'], description: '冬火需木为源，木生火', source: '穷通宝鉴·十一月丙火', priority: 1 },
        { element: '火', preferredStems: ['丙', '丁'], description: '丙丁相助，增火之力', source: '穷通宝鉴·十一月丙火', priority: 2 },
      ],
      quote: '十一月丙火，冬至之后，阳气初动，先用甲木引丁，次取壬水为佐。',
      advice: '冬火木火并用，甲木引生，壬水辅佐',
    },
    '土': {
      needs: [
        { element: '火', preferredStems: ['丙', '丁'], description: '冬土寒湿，急用丙火暖之', source: '穷通宝鉴·十二月戊土', priority: 1 },
        { element: '木', preferredStems: ['甲'], description: '甲木疏土', source: '穷通宝鉴·十二月戊土', priority: 2 },
      ],
      quote: '十二月戊土，小寒之后，冰霜冻结。先用丙火暖之，次用甲木疏之。',
      advice: '冬土丙火为上，甲木佐之，丙甲并用以解寒湿',
    },
    '金': {
      needs: [
        { element: '火', preferredStems: ['丙', '丁'], description: '冬金水冷金寒，急用丙火暖之', source: '穷通宝鉴·十一月庚金', priority: 1 },
        { element: '水', preferredStems: ['壬'], description: '壬水淘洗寒金', source: '穷通宝鉴·十一月庚金', priority: 2 },
      ],
      quote: '十一月庚金，水冷金寒。先用丙火暖之，次用壬水淘洗。',
      advice: '冬金先用丙火暖局，再以壬水淘洗，火水并用',
    },
    '水': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '冬水旺极，专用丙火暖之', source: '穷通宝鉴·十一月壬水', priority: 1 },
        { element: '土', preferredStems: ['戊'], description: '戊土制水', source: '穷通宝鉴·十一月壬水', priority: 2 },
      ],
      quote: '十一月壬水，旺极。专用丙火，如旱得甘霖。丙火为太阳之火，壬水逢丙，如日月同辉。',
      advice: '冬水专用丙火暖之，戊土制水为辅',
    },
  },
  '丑': {
    '木': {
      needs: [
        { element: '火', preferredStems: ['丙', '丁'], description: '丑月余寒未尽，仍需丙火', source: '穷通宝鉴·正月甲木', priority: 1 },
      ],
      quote: '正月甲木，初春尚有余寒，先用丙火暖之，次用癸水润之。',
      advice: '初春木需丙癸并用，丙暖癸润',
    },
    '火': {
      needs: [
        { element: '木', preferredStems: ['甲', '乙'], description: '初春火气微弱，木生火', source: '穷通宝鉴·正月丙火', priority: 1 },
      ],
      quote: '正月丙火，初春火气微弱，专用壬水为佐，取甲木引生。',
      advice: '初春火需木引生，壬水为佐',
    },
    '土': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '丑月湿土寒凝，丙火暖之', source: '穷通宝鉴·十二月戊土', priority: 1 },
        { element: '木', preferredStems: ['甲'], description: '甲木疏土', source: '穷通宝鉴·十二月戊土', priority: 2 },
      ],
      quote: '十二月戊土，冰霜冻结。先用丙火暖之，次用甲木疏之。',
      advice: '湿土需丙甲并用，暖局疏土',
    },
    '金': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '丑月金寒，丙火暖之', source: '穷通宝鉴·十二月庚金', priority: 1 },
      ],
      quote: '十二月庚金，寒冻之金。先用丙火暖之，次用丁火为佐。',
      advice: '寒金需丙丁并用暖局',
    },
    '水': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '丑月水有余寒，丙火暖之', source: '穷通宝鉴·十二月壬水', priority: 1 },
      ],
      quote: '十二月壬癸水，旺而有余寒。专用丙火暖之。',
      advice: '冬水余寒，专用丙火',
    },
  },
  '亥': {
    '木': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '亥月木气初生但寒，丙火暖之', source: '穷通宝鉴·十月甲木', priority: 1 },
      ],
      quote: '十月甲木，初冬气寒。先用丙火暖之，次用癸水滋润。',
      advice: '初冬木需丙癸并用',
    },
    '火': {
      needs: [
        { element: '木', preferredStems: ['甲', '乙'], description: '亥月火气渐衰，木生火', source: '穷通宝鉴·十月丙火', priority: 1 },
        { element: '火', preferredStems: ['丙', '丁'], description: '丙丁助火', source: '穷通宝鉴·十月丙火', priority: 2 },
      ],
      quote: '十月丙火，月建亥水，火气渐衰。取甲木引生，壬水为佐。',
      advice: '初冬火需木火并用',
    },
    '土': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '亥月土寒湿，丙火暖之', source: '穷通宝鉴·十月戊土', priority: 1 },
        { element: '木', preferredStems: ['甲'], description: '甲木疏土', source: '穷通宝鉴·十月戊土', priority: 2 },
      ],
      quote: '十月戊土，亥水当令，土气虚寒。先用丙火暖之，次用甲木疏之。',
      advice: '初冬土需丙甲并用',
    },
    '金': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '亥月金水相生寒冷，丙火暖之', source: '穷通宝鉴·十月庚金', priority: 1 },
      ],
      quote: '十月庚金，水冷金寒。先用丙火暖之，次用壬水淘洗。',
      advice: '初冬金需丙火暖局',
    },
    '水': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '亥月水旺，丙火暖之', source: '穷通宝鉴·十月壬水', priority: 1 },
        { element: '土', preferredStems: ['戊'], description: '戊土制水', source: '穷通宝鉴·十月壬水', priority: 2 },
      ],
      quote: '十月壬水，临官之地。专用丙火暖之。',
      advice: '初冬水旺，丙火暖局，戊土辅之',
    },
  },
  // ─── 夏季（巳午未）—— 暖/燥 ───
  '午': {
    '木': {
      needs: [
        { element: '水', preferredStems: ['壬', '癸'], description: '夏木火炎，急用水润之', source: '穷通宝鉴·五月甲木', priority: 1 },
      ],
      quote: '五月甲木，火炎土燥。急用癸水润之，次用丙火为佐。',
      advice: '夏木急用癸水润泽，丙火为佐',
    },
    '火': {
      needs: [
        { element: '水', preferredStems: ['壬'], description: '夏火炎烈，专用壬水济之', source: '穷通宝鉴·五月丙火', priority: 1 },
        { element: '土', preferredStems: ['戊'], description: '戊土为堤防', source: '穷通宝鉴·五月丙火', priority: 2 },
      ],
      quote: '五月丙火，火势炎烈。专用壬水，如旱得甘霖。',
      advice: '夏火专用壬水济之，戊土为堤',
    },
    '土': {
      needs: [
        { element: '水', preferredStems: ['壬', '癸'], description: '夏土燥热，水润之', source: '穷通宝鉴·六月戊土', priority: 1 },
        { element: '金', preferredStems: ['庚', '辛'], description: '金泄土生水', source: '穷通宝鉴·六月戊土', priority: 2 },
      ],
      quote: '六月戊土，火炎土燥。先用壬水润之，次用甲木疏之。',
      advice: '夏土壬水为上，甲木佐之',
    },
    '金': {
      needs: [
        { element: '水', preferredStems: ['壬', '癸'], description: '夏金火克，水济之', source: '穷通宝鉴·五月庚金', priority: 1 },
        { element: '土', preferredStems: ['戊', '己'], description: '土生金泄火', source: '穷通宝鉴·五月庚金', priority: 2 },
      ],
      quote: '五月庚金，火旺金囚。先用壬水淘洗，次用戊土生金。',
      advice: '夏金壬水淘洗，戊土生扶',
    },
    '水': {
      needs: [
        { element: '金', preferredStems: ['庚', '辛'], description: '夏水弱极，金生水', source: '穷通宝鉴·五月壬水', priority: 1 },
        { element: '水', preferredStems: ['壬', '癸'], description: '水帮水', source: '穷通宝鉴·五月壬水', priority: 2 },
      ],
      quote: '五月壬水，火旺水囚。先用庚金发水之源，次用壬水为佐。',
      advice: '夏水金水并用，庚金发源',
    },
  },
  '巳': {
    '木': {
      needs: [
        { element: '水', preferredStems: ['癸'], description: '巳月木气渐枯，水润之', source: '穷通宝鉴·四月甲木', priority: 1 },
      ],
      quote: '四月甲木，阳气渐升。先用癸水润之，次用丙火为佐。',
      advice: '孟夏木需癸水滋润',
    },
    '火': {
      needs: [
        { element: '水', preferredStems: ['壬'], description: '巳月火渐旺，壬水济之', source: '穷通宝鉴·四月丙火', priority: 1 },
      ],
      quote: '四月丙火，火气渐旺。先用壬水，次取庚金为佐。',
      advice: '孟夏火需壬水济之',
    },
    '土': {
      needs: [
        { element: '水', preferredStems: ['壬', '癸'], description: '巳月土渐燥，水润之', source: '穷通宝鉴·四月戊土', priority: 1 },
      ],
      quote: '四月戊土，阳气渐升。先用癸水润之。',
      advice: '孟夏土需水润',
    },
    '金': {
      needs: [
        { element: '水', preferredStems: ['壬'], description: '巳月金初生但火旺，壬水护金', source: '穷通宝鉴·四月庚金', priority: 1 },
        { element: '土', preferredStems: ['戊'], description: '土生金', source: '穷通宝鉴·四月庚金', priority: 2 },
      ],
      quote: '四月庚金，火渐旺金初生。先用壬水淘洗，次用戊土生扶。',
      advice: '孟夏金需壬水淘洗',
    },
    '水': {
      needs: [
        { element: '金', preferredStems: ['庚', '辛'], description: '巳月水弱，金生水', source: '穷通宝鉴·四月壬水', priority: 1 },
      ],
      quote: '四月壬水，火气渐升。先用庚金发水之源。',
      advice: '孟夏水需金发源',
    },
  },
  '未': {
    '木': {
      needs: [
        { element: '水', preferredStems: ['壬', '癸'], description: '未月燥土木枯，水润之', source: '穷通宝鉴·六月甲木', priority: 1 },
      ],
      quote: '六月甲木，火炎土燥。先用癸水润之，次用丙火为佐。',
      advice: '季夏木需水润',
    },
    '火': {
      needs: [
        { element: '水', preferredStems: ['壬'], description: '未月余火尚存，壬水济之', source: '穷通宝鉴·六月丙火', priority: 1 },
      ],
      quote: '六月丙火，余火尚存。先用壬水济之。',
      advice: '季夏火需壬水济之',
    },
    '土': {
      needs: [
        { element: '水', preferredStems: ['壬', '癸'], description: '未月燥土，水润之', source: '穷通宝鉴·六月戊土', priority: 1 },
        { element: '木', preferredStems: ['甲'], description: '甲木疏土', source: '穷通宝鉴·六月戊土', priority: 2 },
      ],
      quote: '六月戊土，火炎土燥。先用壬水润之，次用甲木疏之。',
      advice: '季夏土壬甲并用',
    },
    '金': {
      needs: [
        { element: '水', preferredStems: ['壬'], description: '未月余火克金，壬水护之', source: '穷通宝鉴·六月庚金', priority: 1 },
      ],
      quote: '六月庚金，余火尚存。先用壬水淘洗，次用戊土生扶。',
      advice: '季夏金需壬水淘洗',
    },
    '水': {
      needs: [
        { element: '金', preferredStems: ['庚', '辛'], description: '未月水弱，金生水', source: '穷通宝鉴·六月壬水', priority: 1 },
      ],
      quote: '六月壬水，大暑之后。先用庚金发源。',
      advice: '季夏水需金发源',
    },
  },
  // ─── 秋季（申酉戌）—— 燥 ───
  '酉': {
    '木': {
      needs: [
        { element: '水', preferredStems: ['壬', '癸'], description: '秋木枯槁，水润之', source: '穷通宝鉴·八月甲木', priority: 1 },
      ],
      quote: '八月甲木，金旺木死。先用壬水，次取丁火为佐。',
      advice: '仲秋木需壬水滋润，丁火为佐',
    },
    '火': {
      needs: [
        { element: '木', preferredStems: ['甲', '乙'], description: '酉月火弱，木生火', source: '穷通宝鉴·八月丙火', priority: 1 },
      ],
      quote: '八月丙火，金旺火死。先用甲木引生，次取壬水为佐。',
      advice: '仲秋火需木引生',
    },
    '土': {
      needs: [
        { element: '火', preferredStems: ['丙', '丁'], description: '酉月土虚寒，丙火暖之', source: '穷通宝鉴·八月戊土', priority: 1 },
        { element: '木', preferredStems: ['甲'], description: '甲木疏土', source: '穷通宝鉴·八月戊土', priority: 2 },
      ],
      quote: '八月戊土，金旺土虚。先用甲木疏之，次用癸水润之。',
      advice: '仲秋土需甲癸并用',
    },
    '金': {
      needs: [
        { element: '火', preferredStems: ['丁'], description: '酉月金旺但偏燥，丁火锻炼', source: '穷通宝鉴·八月庚金', priority: 1 },
        { element: '水', preferredStems: ['壬'], description: '壬水淘洗', source: '穷通宝鉴·八月庚金', priority: 2 },
      ],
      quote: '八月庚金，金白水清。专用丁火锻炼，次用甲木引丁。',
      advice: '仲秋金需丁火锻炼，壬水淘洗',
    },
    '水': {
      needs: [
        { element: '金', preferredStems: ['庚', '辛'], description: '酉月水相，金生水', source: '穷通宝鉴·八月壬水', priority: 1 },
      ],
      quote: '八月壬水，金白水清。取庚金为源，戊土为堤。',
      advice: '仲秋水需金为源',
    },
  },
  '申': {
    '木': {
      needs: [
        { element: '水', preferredStems: ['壬', '癸'], description: '初秋木枯，水润之', source: '穷通宝鉴·七月甲木', priority: 1 },
      ],
      quote: '七月甲木，金旺木衰。先用壬水，次取丁火为佐。',
      advice: '孟秋木需壬水滋润',
    },
    '金': {
      needs: [
        { element: '火', preferredStems: ['丁'], description: '申月金初旺，丁火锻炼', source: '穷通宝鉴·七月庚金', priority: 1 },
        { element: '水', preferredStems: ['壬'], description: '壬水淘洗', source: '穷通宝鉴·七月庚金', priority: 2 },
      ],
      quote: '七月庚金，阳金刚健。先用丁火锻炼，次用壬水淘洗。',
      advice: '孟秋金需丁壬并用',
    },
    '水': {
      needs: [
        { element: '金', preferredStems: ['庚', '辛'], description: '申月水长生之地，金水相生', source: '穷通宝鉴·七月壬水', priority: 1 },
      ],
      quote: '七月壬水，长生之地。取庚金为源，戊土为堤。',
      advice: '孟秋水需金为源，土为堤',
    },
  },
  '戌': {
    '木': {
      needs: [
        { element: '水', preferredStems: ['壬', '癸'], description: '深秋木枯，水润之', source: '穷通宝鉴·九月甲木', priority: 1 },
      ],
      quote: '九月甲木，秋土已老。先用癸水润之，次用甲木为源。',
      advice: '季秋木需水滋润',
    },
    '土': {
      needs: [
        { element: '水', preferredStems: ['壬', '癸'], description: '戌月燥土，水润之', source: '穷通宝鉴·九月戊土', priority: 1 },
        { element: '木', preferredStems: ['甲'], description: '甲木疏土', source: '穷通宝鉴·九月戊土', priority: 2 },
      ],
      quote: '九月戊土，秋土已老。先用甲木疏之，次用癸水润之。',
      advice: '季秋土需甲癸并用',
    },
    '金': {
      needs: [
        { element: '火', preferredStems: ['丁'], description: '戌月余火克金，丁火为用', source: '穷通宝鉴·九月庚金', priority: 1 },
      ],
      quote: '九月庚金，余火未尽。先用丁火锻炼，次用壬水淘洗。',
      advice: '季秋金需丁火锻炼',
    },
  },
  // ─── 春季（寅卯辰）—— 暖/湿 ───
  '寅': {
    '木': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '初春余寒，丙火暖之', source: '穷通宝鉴·正月甲木', priority: 1 },
        { element: '水', preferredStems: ['癸'], description: '癸水滋润', source: '穷通宝鉴·正月甲木', priority: 2 },
      ],
      quote: '正月甲木，初春尚有余寒。先用丙火暖之，次用癸水润之。',
      advice: '初春木需丙癸并用，丙暖癸润',
    },
    '金': {
      needs: [
        { element: '火', preferredStems: ['丙', '丁'], description: '寅月金寒，丙丁暖之', source: '穷通宝鉴·正月庚金', priority: 1 },
      ],
      quote: '正月庚金，木旺金囚。先用丙火暖之，次用丁火锻炼。',
      advice: '初春金需丙丁暖局',
    },
    '水': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '初春水有余寒，丙火暖之', source: '穷通宝鉴·正月壬水', priority: 1 },
        { element: '木', preferredStems: ['甲'], description: '木泄水', source: '穷通宝鉴·正月壬水', priority: 2 },
      ],
      quote: '正月壬水，初春尚有余寒。先用丙火暖之。',
      advice: '初春水需丙火暖之',
    },
  },
  '卯': {
    '木': {
      needs: [
        { element: '火', preferredStems: ['丙'], description: '卯月木旺需发泄，丙火泄木', source: '穷通宝鉴·二月甲木', priority: 1 },
        { element: '水', preferredStems: ['癸'], description: '癸水滋润', source: '穷通宝鉴·二月甲木', priority: 2 },
      ],
      quote: '二月甲木，阳气渐升。先用丙火泄之，次用癸水润之。',
      advice: '仲春木需丙火发泄，癸水滋润',
    },
    '金': {
      needs: [
        { element: '火', preferredStems: ['丙', '丁'], description: '卯月金弱，丙丁护金', source: '穷通宝鉴·二月庚金', priority: 1 },
      ],
      quote: '二月庚金，木旺金死。先用丁火为用，次取丙火为佐。',
      advice: '仲春金需丙丁护之',
    },
    '水': {
      needs: [
        { element: '金', preferredStems: ['庚', '辛'], description: '卯月水弱，金生水', source: '穷通宝鉴·二月壬水', priority: 1 },
      ],
      quote: '二月壬水，木旺水死。先用庚金为源，戊土为堤。',
      advice: '仲春水需金为源',
    },
  },
  '辰': {
    '木': {
      needs: [
        { element: '水', preferredStems: ['癸'], description: '辰月湿土木需润', source: '穷通宝鉴·三月甲木', priority: 1 },
        { element: '火', preferredStems: ['丙'], description: '丙火暖之', source: '穷通宝鉴·三月甲木', priority: 2 },
      ],
      quote: '三月甲木，阳气已盛。先用癸水润之，次用丙火为佐。',
      advice: '季春木需癸丙并用',
    },
    '土': {
      needs: [
        { element: '木', preferredStems: ['甲'], description: '辰月湿土需疏', source: '穷通宝鉴·三月戊土', priority: 1 },
        { element: '水', preferredStems: ['癸'], description: '癸水润之', source: '穷通宝鉴·三月戊土', priority: 2 },
      ],
      quote: '三月戊土，春土湿润。先用甲木疏之，次用癸水润之。',
      advice: '季春土需甲癸并用',
    },
    '金': {
      needs: [
        { element: '火', preferredStems: ['丁'], description: '辰月金余气，丁火锻炼', source: '穷通宝鉴·三月庚金', priority: 1 },
        { element: '水', preferredStems: ['壬'], description: '壬水淘洗', source: '穷通宝鉴·三月庚金', priority: 2 },
      ],
      quote: '三月庚金，春金柔弱。先用丁火锻炼，次用壬水淘洗。',
      advice: '季春金需丁壬并用',
    },
  },
}

// ─── 默认调候规则（月令无特定规则时的回退） ───

function getDefaultRule(monthZhi: EarthlyBranch, dayElement: FiveElement): ClimateRule {
  const mc = MONTH_CLIMATE[monthZhi] || '中和'
  if (mc === '寒') {
    return {
      needs: [{ element: '火', preferredStems: ['丙', '丁'], description: `${monthZhi}月天寒，日主${dayElement}需丙火暖之`, source: '穷通宝鉴·总论', priority: 1 }],
      quote: '寒甚用暖，方为中和之美。',
      advice: '命局偏寒，需火暖局',
    }
  }
  if (mc === '燥') {
    return {
      needs: [{ element: '水', preferredStems: ['壬', '癸'], description: `${monthZhi}月天燥，日主${dayElement}需水润之`, source: '穷通宝鉴·总论', priority: 1 }],
      quote: '暖甚用寒，方为中和之美。',
      advice: '命局偏燥，需水润局',
    }
  }
  return {
    needs: [],
    quote: '寒暖燥湿适中，不需调候。',
    advice: '命局寒暖适中，无需调候',
  }
}

// ─── 核心引擎 ───

export function calculateClimateAdjustment(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  monthZhi: EarthlyBranch,
): ClimateAdjustmentResult {
  const dayElement = (dayGan as string).length ? getDayElement(dayGan) : '木'
  const monthClimate = MONTH_CLIMATE[monthZhi] || '中和'

  // 获取调候规则
  const rule = CLIMATE_RULES[monthZhi]?.[dayElement] || getDefaultRule(monthZhi, dayElement)

  // 检查命局是否已有调候用神
  const allStems = [sixLines.year.gan, sixLines.month.gan, sixLines.day.gan, sixLines.hour.gan]

  // 获取所有天干和地支本气的五行
  const CANG_GAN: Record<string, { ben: string }> = {
    '子': { ben: '癸' }, '丑': { ben: '己' }, '寅': { ben: '甲' }, '卯': { ben: '乙' },
    '辰': { ben: '戊' }, '巳': { ben: '丙' }, '午': { ben: '丁' }, '未': { ben: '己' },
    '申': { ben: '庚' }, '酉': { ben: '辛' }, '戌': { ben: '戊' }, '亥': { ben: '壬' },
  }
  const allBranchBenElements = [sixLines.year.zhi, sixLines.month.zhi, sixLines.day.zhi, sixLines.hour.zhi]
    .map(z => CANG_GAN[z]?.ben ? (STEM_ELEMENT as any)[CANG_GAN[z]!.ben] : null)
    .filter((e): e is FiveElement => e !== null)
  const allStemElements = allStems.map(s => (STEM_ELEMENT as any)[s] || '木')
  const allElements = [...allStemElements, ...allBranchBenElements]

  let needsAdjustment = false
  let climateScore = 70 // 基础分

  // 如果有调候需求
  if (rule.needs.length > 0) {
    needsAdjustment = true

    // 检查命局是否已有调候用神五行
    for (const need of rule.needs) {
      const hasElement = allElements.includes(need.element)
      const hasStem = need.preferredStems.some(s => allStems.includes(s))

      if (hasElement && hasStem) {
        climateScore += 15 // 有调候用神天干和五行
      } else if (hasElement) {
        climateScore += 8  // 仅有五行
      } else if (hasStem) {
        climateScore += 5  // 仅有天干
      } else {
        climateScore -= 10 // 完全没有
      }
    }
  }

  // 月令气候修正
  if (monthClimate === '寒') climateScore -= 10
  if (monthClimate === '燥') climateScore -= 5
  if (monthClimate === '湿') climateScore -= 3
  if (monthClimate === '暖') climateScore += 5

  climateScore = Math.max(0, Math.min(100, climateScore))

  // 如果分值高于 75，不需要调候
  if (climateScore >= 75) needsAdjustment = false

  // 综合气候类型
  const climateType = determineClimateType(monthClimate, needsAdjustment)

  return {
    climateType,
    climateScore,
    needsAdjustment,
    needs: rule.needs,
    advice: rule.advice,
    classicalQuote: rule.quote,
    monthClimate,
    dayGanClimate: `${dayGan}（${dayElement}）生于${monthZhi}月，${monthClimate === '寒' ? '气候偏寒' : monthClimate === '燥' ? '气候偏燥' : monthClimate === '湿' ? '气候偏湿' : monthClimate === '暖' ? '气候偏暖' : '气候适中'}`,
  }
}

function getDayElement(gan: string): FiveElement {
  const map: Record<string, FiveElement> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火',
    '戊': '土', '己': '土', '庚': '金', '辛': '金',
    '壬': '水', '癸': '水',
  }
  return map[gan] || '木'
}

function determineClimateType(monthClimate: ClimateType, needsAdj: boolean): ClimateType {
  if (!needsAdj) return '中和'
  return monthClimate
}
