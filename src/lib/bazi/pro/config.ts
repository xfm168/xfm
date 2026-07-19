/**
 * H3 Professional BaZi Engine: ProfessionalConfig 统一配置入口
 *
 * 建议5: 统一配置入口。
 * 当前全部使用 default 即可。
 * 未来增加古法、今法、不同流派时，无需修改核心算法，仅切换配置即可。
 */

import type { AlgorithmVersion, AlgorithmSource } from './types'

/** 单项规则配置 */
export interface RuleConfig {
  /** 规则 ID */
  id: string
  /** 算法版本 */
  algorithmVersion: AlgorithmVersion
  /** 算法来源 */
  source: AlgorithmSource
  /** 是否启用 */
  enabled: boolean
}

/** 命宫规则配置 */
export interface MingGongRuleConfig extends RuleConfig {
  id: 'minggong'
  /** 阳年起始天干索引 */
  yangStartGanIdx?: number  // default: 2 (丙)
  /** 阴年起始天干索引 */
  yinStartGanIdx?: number   // default: 8 (壬)
}

/** 身宫规则配置 */
export interface ShenGongRuleConfig extends RuleConfig {
  id: 'shengong'
  yangStartGanIdx?: number
  yinStartGanIdx?: number
}

/** 胎元规则配置 */
export interface TaiYuanRuleConfig extends RuleConfig {
  id: 'taiyuan'
  /** 天干偏移量 */
  ganOffset?: number   // default: 1
  /** 地支偏移量 */
  zhiOffset?: number   // default: 3
}

/** 胎息规则配置 */
export interface TaiXiRuleConfig extends RuleConfig {
  id: 'taixi'
  ganOffset?: number   // default: 1
  zhiOffset?: number   // default: 3
}

/** 藏干权重配置 */
export interface HiddenStemRuleConfig extends RuleConfig {
  id: 'hidden-stem'
  /** 本气权重 */
  benWeight?: number   // default: 0.6
  /** 中气权重 */
  zhongWeight?: number // default: 0.3
  /** 余气权重 */
  yaoWeight?: number   // default: 0.1
}

/** 空亡规则配置 */
export interface KongWangRuleConfig extends RuleConfig {
  id: 'kongwang'
  /** 是否同时计算日柱和年柱空亡 */
  includeYear?: boolean // default: true
}

/** 十二长生规则配置 */
export interface ChangShengRuleConfig extends RuleConfig {
  id: 'changsheng'
  /** 是否使用阳干顺行阴干逆行 */
  yinReverse?: boolean // default: true
}

/** 统一配置入口 */
export interface ProfessionalConfig {
  /** 全局算法版本 */
  algorithmVersion: AlgorithmVersion
  /** 全局算法来源 */
  defaultSource: AlgorithmSource
  /** 命宫规则 */
  mingGong: MingGongRuleConfig
  /** 身宫规则 */
  shenGong: ShenGongRuleConfig
  /** 胎元规则 */
  taiYuan: TaiYuanRuleConfig
  /** 胎息规则 */
  taiXi: TaiXiRuleConfig
  /** 藏干权重 */
  hiddenStem: HiddenStemRuleConfig
  /** 空亡 */
  kongWang: KongWangRuleConfig
  /** 十二长生 */
  changSheng: ChangShengRuleConfig
}

/** 经典默认配置（全部使用传统命理算法） */
export const CLASSIC_CONFIG: ProfessionalConfig = {
  algorithmVersion: 'v1.0-classic',
  defaultSource: '三命通会',
  mingGong: {
    id: 'minggong',
    algorithmVersion: 'v1.0-classic',
    source: '三命通会',
    enabled: true,
    yangStartGanIdx: 2,   // 丙
    yinStartGanIdx: 8,    // 壬
  },
  shenGong: {
    id: 'shengong',
    algorithmVersion: 'v1.0-classic',
    source: '三命通会',
    enabled: true,
    yangStartGanIdx: 2,
    yinStartGanIdx: 8,
  },
  taiYuan: {
    id: 'taiyuan',
    algorithmVersion: 'v1.0-classic',
    source: '珞琭子',
    enabled: true,
    ganOffset: 1,
    zhiOffset: 3,
  },
  taiXi: {
    id: 'taixi',
    algorithmVersion: 'v1.0-classic',
    source: '珞琭子',
    enabled: true,
    ganOffset: 1,
    zhiOffset: 3,
  },
  hiddenStem: {
    id: 'hidden-stem',
    algorithmVersion: 'v1.0-classic',
    source: '渊海子平',
    enabled: true,
    benWeight: 0.6,
    zhongWeight: 0.3,
    yaoWeight: 0.1,
  },
  kongWang: {
    id: 'kongwang',
    algorithmVersion: 'v1.0-classic',
    source: '渊海子平',
    enabled: true,
    includeYear: true,
  },
  changSheng: {
    id: 'changsheng',
    algorithmVersion: 'v1.0-classic',
    source: '三命通会',
    enabled: true,
    yinReverse: true,
  },
}
