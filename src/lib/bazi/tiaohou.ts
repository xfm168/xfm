/**
 * 调候用神系统 V4.3 — 玄风门
 *
 * 基于《穷通宝鉴》十二月调候用神规则，综合判断命局寒暖燥湿，
 * 确定调候用神，并与扶抑用神整合出真用神。
 *
 * 核心规则来源：
 * - 《穷通宝鉴》（又名《拦江网》）十二月调候用神表
 * - 《滴天髓》寒暖燥湿论
 * - 《子平真诠》调候与扶抑的关系
 */

import type { BaZiChart, FiveElement, HeavenlyStem, EarthlyBranch, WuXingWangShuai } from './types'
import {
  STEM_ELEMENT,
  BRANCH_ELEMENT,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  FIVE_ELEMENTS,
  CANG_GAN,
} from '@/lib/core'

// ========== 类型定义 ==========

export interface TiaoHouResult {
  /** 月令地支 */
  monthCommand: string
  /** 季节：春/夏/秋/冬 */
  season: string
  /** 命局温度状态 */
  temperature: 'cold' | 'hot' | 'warm' | 'dry' | 'damp' | 'balanced'
  /** 是否需要火调候 */
  needsFire: boolean
  /** 是否需要水调候 */
  needsWater: boolean
  /** 是否需要木调候 */
  needsWood: boolean
  /** 是否需要金调候 */
  needsMetal: boolean
  /** 是否需要土调候 */
  needsEarth: boolean
  /** 调候用神五行 */
  tiaoHouElement: FiveElement
  /** 调候优先级（0-100） */
  priority: number
  /** 真用神（综合考虑调候后的用神） */
  trueYongShen: FiveElement
  /** 调候分析描述（约200字） */
  description: string
  /** 调候是否优先于五行平衡 */
  isTiaoHouDominant: boolean
  /** 调候所需的十神 */
  tiaoHouShiShen?: string
  /** 调候所需的特定天干（如丙火、壬水） */
  preferredStem?: HeavenlyStem
  /** 详细调候规则 */
  rules: TiaoHouRule[]
}

interface TiaoHouRule {
  /** 适用天干 */
  stem: HeavenlyStem
  /** 适用月支 */
  monthBranch: EarthlyBranch
  /** 调候用神五行 */
  element: FiveElement
  /** 首选天干 */
  preferredStem?: HeavenlyStem
  /** 次选天干 */
  alternateStem?: HeavenlyStem
  /** 调候优先级 */
  priority: number
  /** 规则说明 */
  description: string
  /** 规则来源 */
  source: string
}

// ========== 季节映射 ==========

const SEASON_MAP: Record<EarthlyBranch, string> = {
  寅: '春', 卯: '春', 辰: '春',
  巳: '夏', 午: '夏', 未: '夏',
  申: '秋', 酉: '秋', 戌: '秋',
  亥: '冬', 子: '冬', 丑: '冬',
}

const SEASON_BRANCHES: Record<string, EarthlyBranch[]> = {
  '春': ['寅', '卯', '辰'],
  '夏': ['巳', '午', '未'],
  '秋': ['申', '酉', '戌'],
  '冬': ['亥', '子', '丑'],
}

// ========== 《穷通宝鉴》十二月调候用神规则表 ==========

/**
 * 完整调候规则表
 * 格式：[天干, 月支, 调候用神五行, 首选天干, 次选天干, 优先级, 说明, 来源]
 *
 * 此表基于《穷通宝鉴》原文整理，部分规则有简化。
 * 调候优先级：100 = 最高（生死攸关），80 = 重要，60 = 一般，40 = 辅助
 */
const TIAOHOU_RULES: TiaoHouRule[] = [
  // ==================== 正月 寅月（孟春）====================
  // 甲木生寅月：丙火为尊，癸水为佐
  { stem: '甲', monthBranch: '寅', element: '火', preferredStem: '丙', alternateStem: '丁', priority: 75, description: '甲木生寅月，初春余寒未尽，需丙火解冻，癸水润泽', source: '《穷通宝鉴》正月甲木' },
  // 乙木生寅月：丙火为主，癸水为佐
  { stem: '乙', monthBranch: '寅', element: '火', preferredStem: '丙', alternateStem: '丁', priority: 70, description: '乙木生寅月，柔木需阳光照耀，丙火为调候第一要义', source: '《穷通宝鉴》正月乙木' },
  // 丙火生寅月：壬水为主
  { stem: '丙', monthBranch: '寅', element: '水', preferredStem: '壬', alternateStem: '癸', priority: 60, description: '丙火生寅月，初春尚寒，但丙火自身较暖，壬水调候即可', source: '《穷通宝鉴》正月丙火' },
  // 丁火生寅月：甲木为主
  { stem: '丁', monthBranch: '寅', element: '木', preferredStem: '甲', priority: 60, description: '丁火生寅月，丁火柔弱需甲木引生', source: '《穷通宝鉴》正月丁火' },
  // 戊土生寅月：丙火为主，甲木为佐
  { stem: '戊', monthBranch: '寅', element: '火', preferredStem: '丙', alternateStem: '甲', priority: 70, description: '戊土生寅月，春土虚寒，需丙火暖土，甲木疏土', source: '《穷通宝鉴》正月戊土' },
  // 己土生寅月：丙火为主，甲木为佐
  { stem: '己', monthBranch: '寅', element: '火', preferredStem: '丙', alternateStem: '甲', priority: 70, description: '己土生寅月，柔土寒冷，急需丙火温暖', source: '《穷通宝鉴》正月己土' },
  // 庚金生寅月：戊土为主，丙火为佐
  { stem: '庚', monthBranch: '寅', element: '土', preferredStem: '戊', alternateStem: '丙', priority: 65, description: '庚金生寅月，金困于木，需戊土生金，丙火暖局', source: '《穷通宝鉴》正月庚金' },
  // 辛金生寅月：己土为主，丙火为佐
  { stem: '辛', monthBranch: '寅', element: '土', preferredStem: '己', alternateStem: '丙', priority: 65, description: '辛金生寅月，柔金需土生，丙火暖局', source: '《穷通宝鉴》正月辛金' },
  // 壬水生寅月：丙火为主
  { stem: '壬', monthBranch: '寅', element: '火', preferredStem: '丙', priority: 65, description: '壬水生寅月，春水寒冷，需丙火温暖', source: '《穷通宝鉴》正月壬水' },
  // 癸水生寅月：辛金为主，丙火为佐
  { stem: '癸', monthBranch: '寅', element: '金', preferredStem: '辛', alternateStem: '丙', priority: 65, description: '癸水生寅月，寒水需辛金发源，丙火暖局', source: '《穷通宝鉴》正月癸水' },

  // ==================== 二月 卯月（仲春）====================
  { stem: '甲', monthBranch: '卯', element: '火', preferredStem: '丙', alternateStem: '丁', priority: 65, description: '甲木生卯月，仲春木旺，仍需丙火泄秀', source: '《穷通宝鉴》二月甲木' },
  { stem: '乙', monthBranch: '卯', element: '火', preferredStem: '丙', priority: 60, description: '乙木生卯月，得令但需阳光调候', source: '《穷通宝鉴》二月乙木' },
  { stem: '丙', monthBranch: '卯', element: '水', preferredStem: '壬', priority: 55, description: '丙火生卯月，木旺火相，壬水调候即可', source: '《穷通宝鉴》二月丙火' },
  { stem: '丁', monthBranch: '卯', element: '木', preferredStem: '甲', priority: 55, description: '丁火生卯月，需甲木引生', source: '《穷通宝鉴》二月丁火' },
  { stem: '戊', monthBranch: '卯', element: '火', preferredStem: '丙', priority: 65, description: '戊土生卯月，春土需丙火温暖', source: '《穷通宝鉴》二月戊土' },
  { stem: '己', monthBranch: '卯', element: '火', preferredStem: '丙', priority: 65, description: '己土生卯月，柔土需丙火暖局', source: '《穷通宝鉴》二月己土' },
  { stem: '庚', monthBranch: '卯', element: '土', preferredStem: '戊', priority: 55, description: '庚金生卯月，木旺金囚，需土生金', source: '《穷通宝鉴》二月庚金' },
  { stem: '辛', monthBranch: '卯', element: '土', preferredStem: '己', priority: 55, description: '辛金生卯月，柔金最忌木旺，需土护金', source: '《穷通宝鉴》二月辛金' },
  { stem: '壬', monthBranch: '卯', element: '火', preferredStem: '丙', priority: 55, description: '壬水生卯月，需丙火温暖', source: '《穷通宝鉴》二月壬水' },
  { stem: '癸', monthBranch: '卯', element: '金', preferredStem: '辛', priority: 55, description: '癸水生卯月，需辛金发源', source: '《穷通宝鉴》二月癸水' },

  // ==================== 三月 辰月（季春）====================
  { stem: '甲', monthBranch: '辰', element: '火', preferredStem: '丙', priority: 55, description: '甲木生辰月，季春渐暖，丙火泄秀为主', source: '《穷通宝鉴》三月甲木' },
  { stem: '乙', monthBranch: '辰', element: '火', preferredStem: '丙', priority: 50, description: '乙木生辰月，春末渐暖，调候不急', source: '《穷通宝鉴》三月乙木' },
  { stem: '丙', monthBranch: '辰', element: '水', preferredStem: '壬', priority: 45, description: '丙火生辰月，渐暖不需大量水调候', source: '《穷通宝鉴》三月丙火' },
  { stem: '丁', monthBranch: '辰', element: '木', preferredStem: '甲', priority: 45, description: '丁火生辰月，甲木引生即可', source: '《穷通宝鉴》三月丁火' },
  { stem: '戊', monthBranch: '辰', element: '水', preferredStem: '壬', priority: 50, description: '戊土生辰月，湿土需水润泽', source: '《穷通宝鉴》三月戊土' },
  { stem: '己', monthBranch: '辰', element: '水', preferredStem: '癸', priority: 50, description: '己土生辰月，柔土喜水滋润', source: '《穷通宝鉴》三月己土' },
  { stem: '庚', monthBranch: '辰', element: '土', preferredStem: '戊', priority: 50, description: '庚金生辰月，辰中藏金，但仍需土生', source: '《穷通宝鉴》三月庚金' },
  { stem: '辛', monthBranch: '辰', element: '土', preferredStem: '己', priority: 50, description: '辛金生辰月，柔金需湿土生养', source: '《穷通宝鉴》三月辛金' },
  { stem: '壬', monthBranch: '辰', element: '火', preferredStem: '丙', priority: 45, description: '壬水生辰月，季春气候适中', source: '《穷通宝鉴》三月壬水' },
  { stem: '癸', monthBranch: '辰', element: '金', preferredStem: '辛', priority: 45, description: '癸水生辰月，辰中藏癸，自身有余', source: '《穷通宝鉴》三月癸水' },

  // ==================== 四月 巳月（孟夏）====================
  { stem: '甲', monthBranch: '巳', element: '水', preferredStem: '癸', alternateStem: '壬', priority: 70, description: '甲木生巳月，初夏渐热，需水润泽', source: '《穷通宝鉴》四月甲木' },
  { stem: '乙', monthBranch: '巳', element: '水', preferredStem: '癸', priority: 65, description: '乙木生巳月，柔木怕燥，需水滋润', source: '《穷通宝鉴》四月乙木' },
  { stem: '丙', monthBranch: '巳', element: '水', preferredStem: '壬', priority: 75, description: '丙火生巳月，火旺需水克制，壬水为上', source: '《穷通宝鉴》四月丙火' },
  { stem: '丁', monthBranch: '巳', element: '水', preferredStem: '癸', priority: 70, description: '丁火生巳月，火势渐旺，需水调候', source: '《穷通宝鉴》四月丁火' },
  { stem: '戊', monthBranch: '巳', element: '水', preferredStem: '壬', priority: 70, description: '戊土生巳月，夏土干燥，急需水润', source: '《穷通宝鉴》四月戊土' },
  { stem: '己', monthBranch: '巳', element: '水', preferredStem: '癸', priority: 70, description: '己土生巳月，柔土最怕炎热，急需水调候', source: '《穷通宝鉴》四月己土' },
  { stem: '庚', monthBranch: '巳', element: '水', preferredStem: '壬', priority: 80, description: '庚金生巳月，金在火地已衰，急需水洗润', source: '《穷通宝鉴》四月庚金' },
  { stem: '辛', monthBranch: '巳', element: '水', preferredStem: '癸', priority: 80, description: '辛金生巳月，柔金最怕火炼，水为救命之需', source: '《穷通宝鉴》四月辛金' },
  { stem: '壬', monthBranch: '巳', element: '土', preferredStem: '戊', priority: 65, description: '壬水生巳月，水在火地受蒸，需土制水蓄水', source: '《穷通宝鉴》四月壬水' },
  { stem: '癸', monthBranch: '巳', element: '水', preferredStem: '壬', priority: 70, description: '癸水生巳月，弱水蒸发极快，需同类帮扶', source: '《穷通宝鉴》四月癸水' },

  // ==================== 五月 午月（仲夏）====================
  { stem: '甲', monthBranch: '午', element: '水', preferredStem: '癸', priority: 80, description: '甲木生午月，仲夏炎热，木渴极需水', source: '《穷通宝鉴》五月甲木' },
  { stem: '乙', monthBranch: '午', element: '水', preferredStem: '癸', priority: 85, description: '乙木生午月，火旺木焚，癸水为救命之需', source: '《穷通宝鉴》五月乙木' },
  { stem: '丙', monthBranch: '午', element: '水', preferredStem: '壬', priority: 90, description: '丙火生午月，火旺已极，壬水调候为生死攸关', source: '《穷通宝鉴》五月丙火' },
  { stem: '丁', monthBranch: '午', element: '水', preferredStem: '癸', priority: 85, description: '丁火生午月，火势燎原，需癸水急救', source: '《穷通宝鉴》五月丁火' },
  { stem: '戊', monthBranch: '午', element: '水', preferredStem: '壬', priority: 85, description: '戊土生午月，夏土焦干，壬水滋润为第一要务', source: '《穷通宝鉴》五月戊土' },
  { stem: '己', monthBranch: '午', element: '水', preferredStem: '癸', priority: 90, description: '己土生午月，柔土最怕干燥，癸水为调候急务', source: '《穷通宝鉴》五月己土' },
  { stem: '庚', monthBranch: '午', element: '水', preferredStem: '壬', priority: 95, description: '庚金生午月，金在火地已死，壬水为第一要务，无水则金熔', source: '《穷通宝鉴》五月庚金' },
  { stem: '辛', monthBranch: '午', element: '水', preferredStem: '癸', priority: 95, description: '辛金生午月，柔金遇火即化，癸水为救命之源', source: '《穷通宝鉴》五月辛金' },
  { stem: '壬', monthBranch: '午', element: '水', preferredStem: '壬', priority: 80, description: '壬水生午月，水在火地被蒸，需同类相助', source: '《穷通宝鉴》五月壬水' },
  { stem: '癸', monthBranch: '午', element: '水', preferredStem: '癸', priority: 85, description: '癸水生午月，极弱之水需同类帮扶方可存', source: '《穷通宝鉴》五月癸水' },

  // ==================== 六月 未月（季夏）====================
  { stem: '甲', monthBranch: '未', element: '水', preferredStem: '癸', priority: 75, description: '甲木生未月，季夏燥土，需水润木', source: '《穷通宝鉴》六月甲木' },
  { stem: '乙', monthBranch: '未', element: '水', preferredStem: '癸', priority: 80, description: '乙木生未月，柔木困于燥土，急需水润', source: '《穷通宝鉴》六月乙木' },
  { stem: '丙', monthBranch: '未', element: '水', preferredStem: '壬', priority: 80, description: '丙火生未月，虽季夏渐退，仍需水制', source: '《穷通宝鉴》六月丙火' },
  { stem: '丁', monthBranch: '未', element: '水', preferredStem: '癸', priority: 80, description: '丁火生未月，未中火土燥烈，需水调候', source: '《穷通宝鉴》六月丁火' },
  { stem: '戊', monthBranch: '未', element: '水', preferredStem: '壬', priority: 75, description: '戊土生未月，燥土需水润泽', source: '《穷通宝鉴》六月戊土' },
  { stem: '己', monthBranch: '未', element: '水', preferredStem: '癸', priority: 80, description: '己土生未月，燥热之土急需水调候', source: '《穷通宝鉴》六月己土' },
  { stem: '庚', monthBranch: '未', element: '水', preferredStem: '壬', priority: 85, description: '庚金生未月，燥土不生金，需水润土方能生金', source: '《穷通宝鉴》六月庚金' },
  { stem: '辛', monthBranch: '未', element: '水', preferredStem: '癸', priority: 85, description: '辛金生未月，燥土埋金，急需水洗润', source: '《穷通宝鉴》六月辛金' },
  { stem: '壬', monthBranch: '未', element: '金', preferredStem: '庚', priority: 70, description: '壬水生未月，需金生水', source: '《穷通宝鉴》六月壬水' },
  { stem: '癸', monthBranch: '未', element: '金', preferredStem: '辛', priority: 70, description: '癸水生未月，需辛金发源', source: '《穷通宝鉴》六月癸水' },

  // ==================== 七月 申月（孟秋）====================
  { stem: '甲', monthBranch: '申', element: '火', preferredStem: '丙', priority: 60, description: '甲木生申月，初秋金旺木衰，需火克制金、温暖命局', source: '《穷通宝鉴》七月甲木' },
  { stem: '乙', monthBranch: '申', element: '火', preferredStem: '丙', priority: 60, description: '乙木生申月，金旺克木，需丙火制金护木', source: '《穷通宝鉴》七月乙木' },
  { stem: '丙', monthBranch: '申', element: '木', preferredStem: '甲', priority: 55, description: '丙火生申月，秋令渐凉，需木引火', source: '《穷通宝鉴》七月丙火' },
  { stem: '丁', monthBranch: '申', element: '木', preferredStem: '甲', priority: 55, description: '丁火生申月，柔火渐衰，需甲木维持', source: '《穷通宝鉴》七月丁火' },
  { stem: '戊', monthBranch: '申', element: '火', preferredStem: '丙', priority: 55, description: '戊土生申月，秋土渐凉，需丙火温暖', source: '《穷通宝鉴》七月戊土' },
  { stem: '己', monthBranch: '申', element: '火', preferredStem: '丙', priority: 55, description: '己土生申月，柔土渐寒，需丙火暖局', source: '《穷通宝鉴》七月己土' },
  { stem: '庚', monthBranch: '申', element: '水', preferredStem: '壬', priority: 50, description: '庚金生申月，金旺需水泄秀', source: '《穷通宝鉴》七月庚金' },
  { stem: '辛', monthBranch: '申', element: '水', preferredStem: '壬', priority: 50, description: '辛金生申月，金旺需水淘洗', source: '《穷通宝鉴》七月辛金' },
  { stem: '壬', monthBranch: '申', element: '土', preferredStem: '戊', priority: 50, description: '壬水生申月，金水相生，需土蓄水', source: '《穷通宝鉴》七月壬水' },
  { stem: '癸', monthBranch: '申', element: '土', preferredStem: '己', priority: 50, description: '癸水生申月，申中藏壬水，需土蓄之', source: '《穷通宝鉴》七月癸水' },

  // ==================== 八月 酉月（仲秋）====================
  { stem: '甲', monthBranch: '酉', element: '火', preferredStem: '丙', priority: 65, description: '甲木生酉月，仲秋金旺克木，急需火制金护木', source: '《穷通宝鉴》八月甲木' },
  { stem: '乙', monthBranch: '酉', element: '火', preferredStem: '丙', priority: 70, description: '乙木生酉月，柔木被旺金克制，丙火为先', source: '《穷通宝鉴》八月乙木' },
  { stem: '丙', monthBranch: '酉', element: '木', preferredStem: '甲', priority: 60, description: '丙火生酉月，秋深火衰，需甲木引生', source: '《穷通宝鉴》八月丙火' },
  { stem: '丁', monthBranch: '酉', element: '木', preferredStem: '甲', priority: 60, description: '丁火生酉月，柔火更衰，需甲木扶助', source: '《穷通宝鉴》八月丁火' },
  { stem: '戊', monthBranch: '酉', element: '火', preferredStem: '丙', priority: 60, description: '戊土生酉月，秋凉渐深，需丙火暖土', source: '《穷通宝鉴》八月戊土' },
  { stem: '己', monthBranch: '酉', element: '火', preferredStem: '丙', priority: 60, description: '己土生酉月，寒气渐生，需丙火温暖', source: '《穷通宝鉴》八月己土' },
  { stem: '庚', monthBranch: '酉', element: '水', preferredStem: '壬', priority: 45, description: '庚金生酉月，金旺极需水泄', source: '《穷通宝鉴》八月庚金' },
  { stem: '辛', monthBranch: '酉', element: '水', preferredStem: '壬', priority: 45, description: '辛金生酉月，金旺需水淘洗方显光泽', source: '《穷通宝鉴》八月辛金' },
  { stem: '壬', monthBranch: '酉', element: '木', preferredStem: '甲', priority: 55, description: '壬水生酉月，金水冷冽，需木调候', source: '《穷通宝鉴》八月壬水' },
  { stem: '癸', monthBranch: '酉', element: '木', preferredStem: '乙', priority: 55, description: '癸水生酉月，冷水需温暖之木', source: '《穷通宝鉴》八月癸水' },

  // ==================== 九月 戌月（季秋）====================
  { stem: '甲', monthBranch: '戌', element: '火', preferredStem: '丙', priority: 60, description: '甲木生戌月，深秋寒燥，需丙火暖木', source: '《穷通宝鉴》九月甲木' },
  { stem: '乙', monthBranch: '戌', element: '火', preferredStem: '丙', priority: 65, description: '乙木生戌月，寒燥之季，需火温暖', source: '《穷通宝鉴》九月乙木' },
  { stem: '丙', monthBranch: '戌', element: '木', preferredStem: '甲', priority: 55, description: '丙火生戌月，季秋渐寒，需甲木维持', source: '《穷通宝鉴》九月丙火' },
  { stem: '丁', monthBranch: '戌', element: '木', preferredStem: '甲', priority: 55, description: '丁火生戌月，寒气已深，需甲木暖火', source: '《穷通宝鉴》九月丁火' },
  { stem: '戊', monthBranch: '戌', element: '火', preferredStem: '丙', priority: 60, description: '戊土生戌月，燥土需丙火温暖', source: '《穷通宝鉴》九月戊土' },
  { stem: '己', monthBranch: '戌', element: '火', preferredStem: '丙', priority: 60, description: '己土生戌月，寒燥之土需丙火', source: '《穷通宝鉴》九月己土' },
  { stem: '庚', monthBranch: '戌', element: '水', preferredStem: '壬', priority: 50, description: '庚金生戌月，土燥不润金，需水淘洗', source: '《穷通宝鉴》九月庚金' },
  { stem: '辛', monthBranch: '戌', element: '水', preferredStem: '壬', priority: 50, description: '辛金生戌月，燥土埋金，需水润泽', source: '《穷通宝鉴》九月辛金' },
  { stem: '壬', monthBranch: '戌', element: '火', preferredStem: '丙', priority: 55, description: '壬水生戌月，水渐寒凝，需火温暖', source: '《穷通宝鉴》九月壬水' },
  { stem: '癸', monthBranch: '戌', element: '火', preferredStem: '丙', priority: 55, description: '癸水生戌月，寒水需火温暖', source: '《穷通宝鉴》九月癸水' },

  // ==================== 十月 亥月（孟冬）====================
  { stem: '甲', monthBranch: '亥', element: '火', preferredStem: '丙', priority: 90, description: '甲木生亥月，孟冬大寒，丙火为第一要务，无丙则木死', source: '《穷通宝鉴》十月甲木' },
  { stem: '乙', monthBranch: '亥', element: '火', preferredStem: '丙', priority: 95, description: '乙木生亥月，大寒之季，丙火为生死攸关之调候', source: '《穷通宝鉴》十月乙木' },
  { stem: '丙', monthBranch: '亥', element: '木', preferredStem: '甲', priority: 85, description: '丙火生亥月，火在冬地已死，需甲木引生', source: '《穷通宝鉴》十月丙火' },
  { stem: '丁', monthBranch: '亥', element: '木', preferredStem: '甲', priority: 85, description: '丁火生亥月，柔火在冬更弱，甲木生火急务', source: '《穷通宝鉴》十月丁火' },
  { stem: '戊', monthBranch: '亥', element: '火', preferredStem: '丙', priority: 90, description: '戊土生亥月，冬土冰冻，丙火暖土为第一要务', source: '《穷通宝鉴》十月戊土' },
  { stem: '己', monthBranch: '亥', element: '火', preferredStem: '丙', priority: 95, description: '己土生亥月，柔土大寒，丙火温暖为生死攸关', source: '《穷通宝鉴》十月己土' },
  { stem: '庚', monthBranch: '亥', element: '火', preferredStem: '丙', priority: 80, description: '庚金生亥月，寒金需丙火温暖方显光泽', source: '《穷通宝鉴》十月庚金' },
  { stem: '辛', monthBranch: '亥', element: '火', preferredStem: '丙', priority: 85, description: '辛金生亥月，寒金更需丙火温暖', source: '《穷通宝鉴》十月辛金' },
  { stem: '壬', monthBranch: '亥', element: '火', preferredStem: '丙', priority: 70, description: '壬水生亥月，虽水旺但寒，需丙火调候', source: '《穷通宝鉴》十月壬水' },
  { stem: '癸', monthBranch: '亥', element: '火', preferredStem: '丙', priority: 70, description: '癸水生亥月，寒水需丙火温暖方灵', source: '《穷通宝鉴》十月癸水' },

  // ==================== 十一月 子月（仲冬）====================
  { stem: '甲', monthBranch: '子', element: '火', preferredStem: '丙', priority: 95, description: '甲木生子月，仲冬极寒，丙火为生存之必需', source: '《穷通宝鉴》十一月甲木' },
  { stem: '乙', monthBranch: '子', element: '火', preferredStem: '丙', priority: 100, description: '乙木生子月，极寒之地，丙火为生死攸关之调候，无丙则木冻死', source: '《穷通宝鉴》十一月乙木' },
  { stem: '丙', monthBranch: '子', element: '木', preferredStem: '甲', priority: 90, description: '丙火生子月，火在冬地死绝，甲木为救命之源', source: '《穷通宝鉴》十一月丙火' },
  { stem: '丁', monthBranch: '子', element: '木', preferredStem: '甲', priority: 90, description: '丁火生子月，柔火在冬更弱，急需甲木维持', source: '《穷通宝鉴》十一月丁火' },
  { stem: '戊', monthBranch: '子', element: '火', preferredStem: '丙', priority: 95, description: '戊土生子月，仲冬冰冻，丙火暖土为生存所必需', source: '《穷通宝鉴》十一月戊土' },
  { stem: '己', monthBranch: '子', element: '火', preferredStem: '丙', priority: 100, description: '己土生子月，大寒冻土，丙火为第一要务，无丙则万物不生', source: '《穷通宝鉴》十一月己土' },
  { stem: '庚', monthBranch: '子', element: '火', preferredStem: '丙', priority: 85, description: '庚金生子月，金寒水冷，需丙火温暖', source: '《穷通宝鉴》十一月庚金' },
  { stem: '辛', monthBranch: '子', element: '火', preferredStem: '丙', priority: 90, description: '辛金生子月，寒金急需丙火温暖方显其用', source: '《穷通宝鉴》十一月辛金' },
  { stem: '壬', monthBranch: '子', element: '火', preferredStem: '丙', priority: 75, description: '壬水生子月，虽水旺但寒至极，需丙火调候', source: '《穷通宝鉴》十一月壬水' },
  { stem: '癸', monthBranch: '子', element: '火', preferredStem: '丙', priority: 75, description: '癸水生子月，极寒之水需丙火温暖方灵', source: '《穷通宝鉴》十一月癸水' },

  // ==================== 十二月 丑月（季冬）====================
  { stem: '甲', monthBranch: '丑', element: '火', preferredStem: '丙', priority: 90, description: '甲木生丑月，季冬寒湿，丙火解冻为第一要务', source: '《穷通宝鉴》十二月甲木' },
  { stem: '乙', monthBranch: '丑', element: '火', preferredStem: '丙', priority: 95, description: '乙木生丑月，大寒湿冻，丙火为生死攸关之调候', source: '《穷通宝鉴》十二月乙木' },
  { stem: '丙', monthBranch: '丑', element: '木', preferredStem: '甲', priority: 85, description: '丙火生丑月，季冬火弱，甲木引火为急', source: '《穷通宝鉴》十二月丙火' },
  { stem: '丁', monthBranch: '丑', element: '木', preferredStem: '甲', priority: 85, description: '丁火生丑月，柔火在冬极弱，甲木维持为急', source: '《穷通宝鉴》十二月丁火' },
  { stem: '戊', monthBranch: '丑', element: '火', preferredStem: '丙', priority: 90, description: '戊土生丑月，季冬冻土，丙火暖土为先', source: '《穷通宝鉴》十二月戊土' },
  { stem: '己', monthBranch: '丑', element: '火', preferredStem: '丙', priority: 95, description: '己土生丑月，寒湿之土急需丙火温暖', source: '《穷通宝鉴》十二月己土' },
  { stem: '庚', monthBranch: '丑', element: '火', preferredStem: '丙', priority: 80, description: '庚金生丑月，湿寒不生金，丙火为上', source: '《穷通宝鉴》十二月庚金' },
  { stem: '辛', monthBranch: '丑', element: '火', preferredStem: '丙', priority: 85, description: '辛金生丑月，寒湿埋金，丙火温暖为要', source: '《穷通宝鉴》十二月辛金' },
  { stem: '壬', monthBranch: '丑', element: '火', preferredStem: '丙', priority: 75, description: '壬水生丑月，虽旺但寒，需丙火调候', source: '《穷通宝鉴》十二月壬水' },
  { stem: '癸', monthBranch: '丑', element: '火', preferredStem: '丙', priority: 75, description: '癸水生丑月，丑中藏癸，但寒需丙火', source: '《穷通宝鉴》十二月癸水' },
]

// ========== 核心函数 ==========

/**
 * 计算调候用神
 * 基于《穷通宝鉴》规则，结合命局实际五行分布
 */
export function calculateTiaoHou(chart: BaZiChart): TiaoHouResult {
  const dayGan = chart.dayMaster.dayGan
  const monthZhi = chart.sixLines.month.zhi
  const season = SEASON_MAP[monthZhi] || '未知'
  const dayElement = chart.dayMaster.dayGanElement

  // 查找匹配的调候规则
  const matchedRules = TIAOHOU_RULES.filter(
    r => r.stem === dayGan && r.monthBranch === monthZhi
  )

  // 如果没有精确匹配的规则，使用通用季节规则
  const activeRule = matchedRules[0] || getGenericRule(dayGan, monthZhi)

  // 计算命局实际温度（综合天干地支五行）
  const temperature = assessTemperature(chart, season)

  // 判断需要哪些五行调候
  const needs = assessNeeds(chart, temperature, season, activeRule)

  // 确定调候优先级
  const priority = activeRule ? activeRule.priority : 50

  // 判断调候是否优先于五行平衡
  const isDominant = priority >= 80

  // 计算真用神（调候与扶抑的综合）
  const trueYongShen = calculateTrueYongShen(chart, activeRule, needs)

  // 生成调候分析描述
  const description = generateTiaoHouDescription(chart, activeRule, temperature, season, needs, trueYongShen)

  return {
    monthCommand: monthZhi,
    season,
    temperature,
    needsFire: needs.火,
    needsWater: needs.水,
    needsWood: needs.木,
    needsMetal: needs.金,
    needsEarth: needs.土,
    tiaoHouElement: activeRule.element,
    priority,
    trueYongShen,
    description,
    isTiaoHouDominant: isDominant,
    tiaoHouShiShen: activeRule.element ? getShiShenForElement(dayElement, activeRule.element) : undefined,
    preferredStem: activeRule.preferredStem,
    rules: matchedRules,
  }
}

/**
 * 评估命局温度状态
 */
function assessTemperature(
  chart: BaZiChart,
  season: string,
): TiaoHouResult['temperature'] {
  const fireCount = chart.fiveElementCount['火']
  const waterCount = chart.fiveElementCount['水']
  const woodCount = chart.fiveElementCount['木']
  const metalCount = chart.fiveElementCount['金']
  const earthCount = chart.fiveElementCount['土']

  // 综合温度分数（正值=热，负值=冷）
  let tempScore = 0

  // 季节基础分
  switch (season) {
    case '夏': tempScore += 6; break
    case '春': tempScore += 1; break
    case '秋': tempScore -= 1; break
    case '冬': tempScore -= 6; break
  }

  // 五行加分
  tempScore += fireCount * 1.5
  tempScore -= waterCount * 1.5
  tempScore += earthCount * 0.3  // 土略增温度
  tempScore += woodCount * 0.2
  tempScore -= metalCount * 0.5  // 金略降温度

  // 判断温度状态
  if (tempScore >= 8) return 'hot'
  if (tempScore >= 4) return 'warm'
  if (tempScore >= -2) return 'balanced'
  if (tempScore >= -5) return 'damp'
  if (tempScore >= -8) return 'cold'
  return 'cold'
}

/**
 * 评估命局需要哪些五行调候
 */
function assessNeeds(
  chart: BaZiChart,
  temperature: TiaoHouResult['temperature'],
  season: string,
  rule: TiaoHouRule,
): Record<FiveElement, boolean> {
  const needs: Record<FiveElement, boolean> = {
    木: false, 火: false, 土: false, 金: false, 水: false,
  }

  // 基于规则
  needs[rule.element] = true

  // 基于温度补充
  if (temperature === 'cold') {
    needs.火 = true
    needs.木 = true // 木能生火
  } else if (temperature === 'hot') {
    needs.水 = true
    needs.金 = true // 金能生水
  } else if (temperature === 'dry') {
    needs.水 = true
  } else if (temperature === 'damp') {
    needs.火 = true
  }

  // 基于季节补充
  if (season === '冬') {
    needs.火 = true
  } else if (season === '夏') {
    needs.水 = true
  }

  return needs
}

/**
 * 计算真用神（综合考虑调候和扶抑）
 */
function calculateTrueYongShen(
  chart: BaZiChart,
  rule: TiaoHouRule,
  needs: Record<FiveElement, boolean>,
): FiveElement {
  const strength = chart.dayMaster.strengthScore
  const originalBest = chart.xiYongShen.bestElement

  // 如果调候优先级很高（80+），真用神优先取调候用神
  if (rule.priority >= 80) {
    return rule.element
  }

  // 如果调候用神和扶抑用神一致，直接使用
  if (originalBest === rule.element) {
    return rule.element
  }

  // 如果两者冲突，看身强身弱
  // 身旺：喜克泄耗 → 如果调候用神是泄耗之神，优先调候
  if (strength >= 55) {
    const shiShenEl = STEM_ELEMENT[rule.element] ? rule.element : '火'
    // 调候用神如果是克泄耗（食伤/财/官杀），优先调候
    if (['火', '土', '金', '水'].includes(rule.element)) {
      return rule.element
    }
  }

  // 身弱：喜生扶 → 如果调候用神是生扶之神，优先调候
  if (strength <= 45) {
    if (['木', '水', '土'].includes(rule.element)) {
      return rule.element
    }
  }

  // 中和状态：优先扶抑用神
  return originalBest
}

/**
 * 通用调候规则（精确规则未匹配时使用）
 */
function getGenericRule(stem: HeavenlyStem, branch: EarthlyBranch): TiaoHouRule {
  const season = SEASON_MAP[branch]
  const stemEl = STEM_ELEMENT[stem]

  switch (season) {
    case '冬':
      return {
        stem, monthBranch: branch, element: '火', preferredStem: '丙',
        priority: 80, description: `${stem}生冬月，通用调候取丙火温暖`, source: '《穷通宝鉴》通用冬月规则',
      }
    case '夏':
      return {
        stem, monthBranch: branch, element: '水', preferredStem: '壬',
        priority: 80, description: `${stem}生夏月，通用调候取壬水润泽`, source: '《穷通宝鉴》通用夏月规则',
      }
    case '春':
      return {
        stem, monthBranch: branch, element: stemEl === '木' ? '火' : '火',
        preferredStem: '丙', priority: 55,
        description: `${stem}生春月，通用调候取丙火温暖`, source: '《穷通宝鉴》通用春月规则',
      }
    case '秋':
      return {
        stem, monthBranch: branch, element: stemEl === '金' ? '水' : '火',
        preferredStem: stemEl === '金' ? '壬' : '丙', priority: 55,
        description: `${stem}生秋月，通用调候取水或火`, source: '《穷通宝鉴》通用秋月规则',
      }
    default:
      return {
        stem, monthBranch: branch, element: '火', preferredStem: '丙',
        priority: 40, description: `${stem}生${branch}月，调候不急`, source: '通用规则',
      }
  }
}

/**
 * 获取调候用神对应的十神
 */
function getShiShenForElement(dayElement: FiveElement, tiaoHouElement: FiveElement): string {
  // 五行生克 → 十神关系
  const BE_OVERCOME: Record<FiveElement, FiveElement> = { 木: '金', 火: '水', 土: '木', 金: '火', 水: '土' }
  const GENERATE: Record<FiveElement, FiveElement> = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }
  const BE_GENERATE: Record<FiveElement, FiveElement> = { 木: '水', 火: '木', 土: '火', 金: '土', 水: '金' }
  const OVERCOME: Record<FiveElement, FiveElement> = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' }

  if (tiaoHouElement === BE_GENERATE[dayElement]) return '正印/偏印'
  if (tiaoHouElement === GENERATE[dayElement]) return '食神/伤官'
  if (tiaoHouElement === BE_OVERCOME[dayElement]) return '正官/偏官'
  if (tiaoHouElement === OVERCOME[dayElement]) return '正财/偏财'
  if (tiaoHouElement === dayElement) return '比肩/劫财'
  return '未知'
}

/**
 * 生成调候分析描述（约200字）
 */
function generateTiaoHouDescription(
  chart: BaZiChart,
  rule: TiaoHouRule,
  temperature: TiaoHouResult['temperature'],
  season: string,
  needs: Record<FiveElement, boolean>,
  trueYong: FiveElement,
): string {
  const dayGan = chart.dayMaster.dayGan
  const monthZhi = chart.sixLines.month.zhi

  const tempDesc: Record<string, string> = {
    cold: '命局大寒',
    hot: '命局酷热',
    warm: '命局偏暖',
    dry: '命局偏燥',
    damp: '命局偏湿',
    balanced: '命局寒暖适中',
  }

  const needsDesc = FIVE_ELEMENTS.filter(el => needs[el]).join('、')

  return (
    `${dayGan}日主生于${season}月${monthZhi}令，${tempDesc[temperature]}。` +
    `据《穷通宝鉴》所载，${rule.description}。` +
    `经综合分析，此命调候用神取${rule.element}（${rule.preferredStem || ''}），` +
    `调候优先级为${rule.priority}分。` +
    `命局需要${needsDesc}等五行来调节寒暖燥湿。` +
    `${rule.priority >= 80 ? '调候为此命之首要任务，优先于一般五行平衡分析。' : '调候为辅助参考，需与扶抑用神综合考量。'} ` +
    `最终真用神取${trueYong}，大运流年逢${trueYong}最为有利。` +
    `《滴天髓》云：「知调候则知命」，调候之理不可不知。`
  )
}

// ========== 导出 ==========

export { TIAOHOU_RULES }
export type { TiaoHouRule }
