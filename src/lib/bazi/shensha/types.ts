/**
 * B5 神煞 7 字段重定义
 * 参考权威：
 *  《三命通会》神煞篇、《渊海子平》神煞赋、《协纪辨方书》用事宜忌
 */

export type ShenShaSource =
  | '三命通会'
  | '渊海子平'
  | '协纪辨方书'
  | '穷通宝鉴'
  | '滴天髓'
  | '子平真诠'
  | '现代命理（常用）'

/** 神煞所在位置：四柱 / 大运 / 流年 / 流月 / 流日 / 流时 / 全局 */
export type ShenShaLocation =
  | 'year' | 'month' | 'day' | 'hour'
  | 'dayun' | 'liunian' | 'liuyue' | 'liuri' | 'liushi'
  | 'global'

/** 吉/凶/中性 */
export type ShenShaNature = 'ji' | 'xiong' | 'zhong'

export interface ShenShaInvalidation {
  /** 被某神煞克制（名称） */
  byShenSha?: string[]
  /** 被某种干支作用破坏：冲/刑/害/破/合化失败 */
  byGzAction?: ('chong' | 'xing' | 'hai' | 'po' | 'hehua-failed')[]
  /** 失效说明文字（给 UI） */
  description?: string
  /** 失效程度 0~1（1=完全失效） */
  degree: number
}

export interface ShenShaWeight {
  /** 基础权重 0~1（吉越大越吉，凶越大越凶） */
  base: number
  /** 得令加成权重（当月令时）*/
  lingWeight?: number
  /** 透干加成权重 */
  touganWeight?: number
  /** 得地加成权重（地支有根） */
  dediWeight?: number
  /** 失效/破坏后剩余权重 */
  effective?: number
}

/**
 * B5 DefinedShenSha：神煞重新定义（7 字段）
 * 1. source        来源（引用典籍）
 * 2. condition     成立条件（自然语言 + 伪代码）
 * 3. invalidation  是否失效
 * 4. destroyed?    是否被刑冲破坏
 * 5. weight        权重
 * 6. effect        实际影响（吉/凶/中性说明）
 * 7. citation      引用古籍原文
 */
export interface DefinedShenSha {
  /** 神煞英文 ID，如 'tian_yi' */
  id: string
  /** 中文标准名称 */
  name: string
  /** 别名 */
  aliases?: string[]
  /** 吉凶属性 */
  nature: ShenShaNature
  /** 1. 来源（典籍/流派） */
  source: ShenShaSource
  /** 适用位置 */
  appliesTo: ShenShaLocation[]
  /** 2. 成立条件 */
  condition: {
    /** 自然语言说明（用户可读） */
    description: string
    /** 伪代码公式（给开发者） */
    formula: string
    /** 成立示例，如 "甲日见未" */
    example?: string
  }
  /** 3. 失效条件 */
  invalidation?: ShenShaInvalidation
  /** 4. 是否被刑冲合害破坏（运行时填充） */
  destroyed?: ShenShaInvalidation
  /** 5. 权重构成 */
  weight: ShenShaWeight
  /** 6. 实际影响（UI / AI 直接引用） */
  effect: {
    /** 吉：描述吉在哪里；凶：描述凶在哪里 */
    human: string
    /** 实际影响分类，方便排序/统计 */
    categories: ('贵人' | '文星' | '武星' | '桃花' | '驿马' | '血光' | '官非' | '孤克' | '才艺' | '福气' | '权势' | '财富' | '其他')[]
    /** 适用场景：事业 / 财运 / 婚姻 / 健康 / 学业 / 六亲 */
    scenes: ('career' | 'wealth' | 'marriage' | 'health' | 'study' | 'family' | 'overall')[]
  }
  /** 7. 引用古籍原文（便于专业用户核对） */
  citation?: string[]
  /** 版本号（B2 对齐） */
  version?: string
}

/** 运行时命中结果 */
export interface ShenShaHit {
  shenShaId: string
  name: string
  location: ShenShaLocation
  /** 是否成立（condition 通过） */
  active: boolean
  /** 是否整体失效 */
  invalidated: boolean
  /** 被破坏情况 */
  destroyed?: ShenShaInvalidation
  /** 命中时的具体干支位置，如 day */
  ganzhi?: { gan?: string; zhi?: string }
  /** 有效权重（已扣除无效/破坏部分） */
  effectiveWeight: number
  /** 实际影响文本（可直接展示给用户） */
  effectText: string
}
