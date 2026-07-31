/**
 * SchoolProfile - 流派配置系统
 *
 * 预设 4 种流派：Ziping / Qiongtong / Modern / Balanced
 * 预留 4 种未来扩展：滴天髓 / 子平真诠 / 渊海子平 / 神峰通考
 *
 * 不同流派下：
 * - Rule Weight（各子引擎权重）
 * - Evidence Weight（评分/投票/古籍/证据/共识权重）
 * - Classic Weight（不同古籍的权重）
 * - 决策参数（用神阈值/多用神阈值/冲突惩罚）
 * - 规则优先级（引擎优先级）
 */

import type { SchoolProfile } from './types'

/** 预设流派配置 */
export const SCHOOL_PROFILES: Record<string, SchoolProfile> = {
  // ============================================================
  // 传统子平：扶抑为主，格局为重，调候为辅
  // ============================================================
  ziping: {
    key: 'ziping',
    name: 'ZipingProfile',
    description: '传统子平：扶抑为主，格局为重，调候为辅',
    engineWeights: {
      strength: 0,
      pattern: 0.2,
      climate: 0.1,
      balance: 0.35,
      medicine: 0.15,
      bridge: 0.1,
      season: 0.1,
    },
    evidenceWeights: {
      scoreWeight: 0.35,
      voteWeight: 0.2,
      classicWeight: 0.2,
      evidenceWeight: 0.1,
      consensusWeight: 0.15,
    },
    classicWeights: {
      '子平真诠': 1.2,
      '滴天髓': 1.1,
      '三命通会': 1.0,
      '穷通宝鉴': 0.8,
      '渊海子平': 1.0,
    },
    yongShenThreshold: 0.5,
    multiYongShenThreshold: 0.1,
    conflictPenaltyFactor: 0.15,
    enginePriorities: {
      StrengthEngine: 3,
      PatternEngine: 4,
      ClimateEngine: 2,
      BalanceEngine: 5,
      MedicineEngine: 3,
      BridgeEngine: 2,
      SeasonEngine: 2,
    },
  },

  // ============================================================
  // 穷通体系：调候为主，寒暖燥湿为重，扶抑为辅
  // ============================================================
  qiongtong: {
    key: 'qiongtong',
    name: 'QiongtongProfile',
    description: '穷通体系：调候为主，寒暖燥湿为重，扶抑为辅',
    engineWeights: {
      strength: 0,
      pattern: 0.1,
      climate: 0.3,
      balance: 0.15,
      medicine: 0.1,
      bridge: 0.1,
      season: 0.25,
    },
    evidenceWeights: {
      scoreWeight: 0.25,
      voteWeight: 0.15,
      classicWeight: 0.3,
      evidenceWeight: 0.15,
      consensusWeight: 0.15,
    },
    classicWeights: {
      '穷通宝鉴': 1.3,
      '三命通会': 1.0,
      '子平真诠': 0.9,
      '滴天髓': 0.8,
      '渊海子平': 0.9,
    },
    yongShenThreshold: 0.45,
    multiYongShenThreshold: 0.12,
    conflictPenaltyFactor: 0.12,
    enginePriorities: {
      StrengthEngine: 2,
      PatternEngine: 2,
      ClimateEngine: 5,
      BalanceEngine: 2,
      MedicineEngine: 3,
      BridgeEngine: 2,
      SeasonEngine: 5,
    },
  },

  // ============================================================
  // 现代综合：七路均衡加权
  // ============================================================
  modern: {
    key: 'modern',
    name: 'ModernProfile',
    description: '现代综合：七路均衡加权，融合古籍与现代推理',
    engineWeights: {
      strength: 0,
      pattern: 0.1,
      climate: 0.2,
      balance: 0.25,
      medicine: 0.15,
      bridge: 0.1,
      season: 0.2,
    },
    evidenceWeights: {
      scoreWeight: 0.3,
      voteWeight: 0.2,
      classicWeight: 0.2,
      evidenceWeight: 0.15,
      consensusWeight: 0.15,
    },
    classicWeights: {
      '子平真诠': 1.0,
      '滴天髓': 1.0,
      '三命通会': 1.0,
      '穷通宝鉴': 1.0,
      '渊海子平': 1.0,
    },
    yongShenThreshold: 0.5,
    multiYongShenThreshold: 0.1,
    conflictPenaltyFactor: 0.15,
    enginePriorities: {
      StrengthEngine: 3,
      PatternEngine: 3,
      ClimateEngine: 4,
      BalanceEngine: 4,
      MedicineEngine: 3,
      BridgeEngine: 3,
      SeasonEngine: 3,
    },
  },

  // ============================================================
  // 均衡流派：完全平均，无偏好
  // ============================================================
  balanced: {
    key: 'balanced',
    name: 'BalancedProfile',
    description: '均衡流派：七路完全平均，无流派偏好',
    engineWeights: {
      strength: 0,
      pattern: 1 / 6,
      climate: 1 / 6,
      balance: 1 / 6,
      medicine: 1 / 6,
      bridge: 1 / 6,
      season: 1 / 6,
    },
    evidenceWeights: {
      scoreWeight: 0.25,
      voteWeight: 0.2,
      classicWeight: 0.2,
      evidenceWeight: 0.15,
      consensusWeight: 0.2,
    },
    classicWeights: {
      '子平真诠': 1.0,
      '滴天髓': 1.0,
      '三命通会': 1.0,
      '穷通宝鉴': 1.0,
      '渊海子平': 1.0,
    },
    yongShenThreshold: 0.45,
    multiYongShenThreshold: 0.12,
    conflictPenaltyFactor: 0.15,
    enginePriorities: {
      StrengthEngine: 3,
      PatternEngine: 3,
      ClimateEngine: 3,
      BalanceEngine: 3,
      MedicineEngine: 3,
      BridgeEngine: 3,
      SeasonEngine: 3,
    },
  },

  // ============================================================
  // 预留扩展：滴天髓体系（侧重气势流通）
  // ============================================================
  ditiansui: {
    key: 'ditiansui',
    name: 'DitiansuiProfile',
    description: '滴天髓体系：重气势流通，通关为要，扶抑次之',
    engineWeights: {
      strength: 0,
      pattern: 0.15,
      climate: 0.15,
      balance: 0.2,
      medicine: 0.15,
      bridge: 0.2,
      season: 0.15,
    },
    evidenceWeights: {
      scoreWeight: 0.25,
      voteWeight: 0.2,
      classicWeight: 0.25,
      evidenceWeight: 0.15,
      consensusWeight: 0.15,
    },
    classicWeights: {
      '滴天髓': 1.4,
      '子平真诠': 0.9,
      '三命通会': 0.9,
      '穷通宝鉴': 0.8,
      '渊海子平': 0.8,
    },
    yongShenThreshold: 0.45,
    multiYongShenThreshold: 0.12,
    conflictPenaltyFactor: 0.15,
    enginePriorities: {
      StrengthEngine: 3,
      PatternEngine: 3,
      ClimateEngine: 3,
      BalanceEngine: 3,
      MedicineEngine: 3,
      BridgeEngine: 5,
      SeasonEngine: 3,
    },
  },

  // ============================================================
  // 预留扩展：子平真诠体系（侧重格局取用）
  // ============================================================
  zipingzhenyuan: {
    key: 'zipingzhenyuan',
    name: 'ZipingZhenyuanProfile',
    description: '子平真诠体系：格局取用为宗，月令用神为本',
    engineWeights: {
      strength: 0,
      pattern: 0.35,
      climate: 0.1,
      balance: 0.2,
      medicine: 0.15,
      bridge: 0.1,
      season: 0.1,
    },
    evidenceWeights: {
      scoreWeight: 0.3,
      voteWeight: 0.2,
      classicWeight: 0.25,
      evidenceWeight: 0.1,
      consensusWeight: 0.15,
    },
    classicWeights: {
      '子平真诠': 1.4,
      '三命通会': 1.0,
      '滴天髓': 0.9,
      '穷通宝鉴': 0.8,
      '渊海子平': 1.0,
    },
    yongShenThreshold: 0.5,
    multiYongShenThreshold: 0.1,
    conflictPenaltyFactor: 0.15,
    enginePriorities: {
      StrengthEngine: 3,
      PatternEngine: 5,
      ClimateEngine: 2,
      BalanceEngine: 3,
      MedicineEngine: 3,
      BridgeEngine: 2,
      SeasonEngine: 2,
    },
  },

  // ============================================================
  // 预留扩展：渊海子平体系（侧重神煞与综合）
  // ============================================================
  yuanhaiziping: {
    key: 'yuanhaiziping',
    name: 'YuanhaiZipingProfile',
    description: '渊海子平体系：神煞兼顾，综合权衡',
    engineWeights: {
      strength: 0,
      pattern: 0.2,
      climate: 0.15,
      balance: 0.25,
      medicine: 0.15,
      bridge: 0.1,
      season: 0.15,
    },
    evidenceWeights: {
      scoreWeight: 0.3,
      voteWeight: 0.2,
      classicWeight: 0.2,
      evidenceWeight: 0.15,
      consensusWeight: 0.15,
    },
    classicWeights: {
      '渊海子平': 1.3,
      '子平真诠': 1.0,
      '三命通会': 1.0,
      '滴天髓': 0.9,
      '穷通宝鉴': 0.9,
    },
    yongShenThreshold: 0.48,
    multiYongShenThreshold: 0.11,
    conflictPenaltyFactor: 0.15,
    enginePriorities: {
      StrengthEngine: 3,
      PatternEngine: 4,
      ClimateEngine: 3,
      BalanceEngine: 4,
      MedicineEngine: 3,
      BridgeEngine: 2,
      SeasonEngine: 3,
    },
  },

  // ============================================================
  // 预留扩展：神峰通考体系（侧重病药与命理批判）
  // ============================================================
  shenfengtongkao: {
    key: 'shenfengtongkao',
    name: 'ShenfengTongkaoProfile',
    description: '神峰通考体系：病药为宗，批判虚妄，务实取用',
    engineWeights: {
      strength: 0,
      pattern: 0.15,
      climate: 0.15,
      balance: 0.2,
      medicine: 0.25,
      bridge: 0.1,
      season: 0.15,
    },
    evidenceWeights: {
      scoreWeight: 0.3,
      voteWeight: 0.25,
      classicWeight: 0.2,
      evidenceWeight: 0.1,
      consensusWeight: 0.15,
    },
    classicWeights: {
      '神峰通考': 1.3,
      '子平真诠': 1.0,
      '三命通会': 1.0,
      '滴天髓': 0.9,
      '穷通宝鉴': 0.9,
    },
    yongShenThreshold: 0.48,
    multiYongShenThreshold: 0.11,
    conflictPenaltyFactor: 0.18,
    enginePriorities: {
      StrengthEngine: 3,
      PatternEngine: 2,
      ClimateEngine: 3,
      BalanceEngine: 3,
      MedicineEngine: 5,
      BridgeEngine: 2,
      SeasonEngine: 3,
    },
  },
}

/** 默认流派 */
export const DEFAULT_SCHOOL = SCHOOL_PROFILES.modern

/** 获取流派配置 */
export function getSchoolProfile(key: string): SchoolProfile {
  return SCHOOL_PROFILES[key] ?? DEFAULT_SCHOOL
}

/** 列出所有流派 */
export function listSchoolProfiles(): Array<{ key: string; name: string; description: string }> {
  return Object.entries(SCHOOL_PROFILES).map(([key, p]) => ({
    key,
    name: p.name,
    description: p.description,
  }))
}

/**
 * 获取某引擎在指定流派下的权重
 */
export function getEngineWeight(profile: SchoolProfile, engineName: string): number {
  const map: Record<string, number> = {
    StrengthEngine: profile.engineWeights.strength,
    PatternEngine: profile.engineWeights.pattern,
    ClimateEngine: profile.engineWeights.climate,
    BalanceEngine: profile.engineWeights.balance,
    MedicineEngine: profile.engineWeights.medicine,
    BridgeEngine: profile.engineWeights.bridge,
    SeasonEngine: profile.engineWeights.season,
  }
  return map[engineName] ?? 0
}

/**
 * 获取某引擎在指定流派下的优先级
 */
export function getEnginePriority(profile: SchoolProfile, engineName: string): number {
  return profile.enginePriorities[engineName] ?? 3
}

/**
 * 获取某古籍在指定流派下的权重
 */
export function getClassicWeight(profile: SchoolProfile, classicName: string): number {
  return profile.classicWeights[classicName] ?? 1.0
}
