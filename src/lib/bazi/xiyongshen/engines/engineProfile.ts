/**
 * EngineProfile（引擎权重配置）
 *
 * 不同流派可以调整各子引擎的权重，而不需要修改代码。
 * 用户可切换：传统子平 / 穷通体系 / 现代综合
 */

/** 引擎权重配置 */
export interface EngineWeights {
  strength: number    // StrengthEngine（通常为0，不参与评分）
  pattern: number     // PatternEngine
  climate: number     // ClimateEngine
  balance: number     // BalanceEngine
  medicine: number    // MedicineEngine
  bridge: number      // BridgeEngine
  season: number      // SeasonEngine
}

/** 预设 Profile */
export const ENGINE_PROFILES: Record<string, EngineWeights & { name: string; description: string }> = {
  /** 传统子平：重视扶抑和格局，调候为辅 */
  ziping: {
    name: 'ZipingProfile',
    description: '传统子平：扶抑为主，格局为重，调候为辅',
    strength: 0,
    pattern: 0.2,
    climate: 0.1,
    balance: 0.35,
    medicine: 0.15,
    bridge: 0.1,
    season: 0.1,
  },
  /** 穷通体系：重视调候和寒暖燥湿，扶抑为辅 */
  qiongtong: {
    name: 'QiongtongProfile',
    description: '穷通体系：调候为主，寒暖燥湿为重，扶抑为辅',
    strength: 0,
    pattern: 0.1,
    climate: 0.3,
    balance: 0.15,
    medicine: 0.1,
    bridge: 0.1,
    season: 0.25,
  },
  /** 现代综合：七路均衡加权 */
  modern: {
    name: 'ModernProfile',
    description: '现代综合：七路均衡加权',
    strength: 0,
    pattern: 0.1,
    climate: 0.2,
    balance: 0.25,
    medicine: 0.15,
    bridge: 0.1,
    season: 0.2,
  },
}

/** 默认 Profile */
export const DEFAULT_PROFILE = ENGINE_PROFILES.modern

/** 获取 Profile */
export function getProfile(name: string): EngineWeights & { name: string; description: string } {
  return ENGINE_PROFILES[name] ?? DEFAULT_PROFILE
}

/** 列出所有 Profile */
export function listProfiles(): Array<{ key: string; name: string; description: string }> {
  return Object.entries(ENGINE_PROFILES).map(([key, p]) => ({
    key, name: p.name, description: p.description,
  }))
}
