/**
 * 玄风八字功能开关 (Feature Flags)
 * V4.8.1 Baseline
 *
 * 用于 A/B 测试、灰度发布、快速回滚。
 */

export interface BaziFeatureFlags {
  // 排盘功能
  ENABLE_SOLAR_TIME: boolean
  ENABLE_LUNAR_INPUT: boolean
  ENABLE_DST: boolean
  ENABLE_SECOND_PRECISION: boolean

  // 命理功能
  ENABLE_CONG_GE: boolean
  ENABLE_HUA_GE: boolean
  ENABLE_ZHUAN_WANG: boolean
  ENABLE_BING_YAO: boolean
  ENABLE_TONG_GUAN: boolean

  // 算法版本
  ENABLE_NEW_WUXING_SCORE: boolean
  ENABLE_NEW_XIYONG: boolean
  ENABLE_NEW_GEJU: boolean

  // 输出功能
  ENABLE_NEW_REPORT: boolean
  ENABLE_EXPLAIN_API: boolean
  ENABLE_EVIDENCE_CHAIN: boolean

  // 性能
  ENABLE_CACHE: boolean
}

/** 默认功能开关（当前阶段） */
export const DEFAULT_FEATURE_FLAGS: BaziFeatureFlags = {
  // 排盘功能
  ENABLE_SOLAR_TIME: false,      // P0-④ 未实现
  ENABLE_LUNAR_INPUT: false,     // P0-⑦ 未实现
  ENABLE_DST: false,             // P0-⑥ 未实现
  ENABLE_SECOND_PRECISION: true, // P0-① 本次实现

  // 命理功能
  ENABLE_CONG_GE: true,
  ENABLE_HUA_GE: true,
  ENABLE_ZHUAN_WANG: true,
  ENABLE_BING_YAO: false,        // P1-D-③ 未实现
  ENABLE_TONG_GUAN: false,       // P1-D-④ 未实现

  // 算法版本
  ENABLE_NEW_WUXING_SCORE: false, // P1-A-④ 未实现
  ENABLE_NEW_XIYONG: false,       // P1-D-⑤ 未实现
  ENABLE_NEW_GEJU: false,         // P1-B 未实现

  // 输出功能
  ENABLE_NEW_REPORT: false,
  ENABLE_EXPLAIN_API: true,       // 本次实现
  ENABLE_EVIDENCE_CHAIN: true,    // 本次实现

  // 性能
  ENABLE_CACHE: true,
}

/** 当前生效的功能开关 */
let currentFlags: BaziFeatureFlags = { ...DEFAULT_FEATURE_FLAGS }

/** 获取当前功能开关 */
export function getFeatureFlags(): BaziFeatureFlags {
  return { ...currentFlags }
}

/** 更新功能开关（运行时） */
export function setFeatureFlag(key: keyof BaziFeatureFlags, value: boolean): void {
  currentFlags[key] = value
}

/** 批量更新功能开关 */
export function setFeatureFlags(flags: Partial<BaziFeatureFlags>): void {
  currentFlags = { ...currentFlags, ...flags }
}

/** 重置为默认开关 */
export function resetFeatureFlags(): void {
  currentFlags = { ...DEFAULT_FEATURE_FLAGS }
}

/** 检查某个功能是否启用 */
export function isFeatureEnabled(key: keyof BaziFeatureFlags): boolean {
  return currentFlags[key]
}
