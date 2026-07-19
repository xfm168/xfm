/**
 * 运行时权限检查层
 * 消费 Domain v2.1 定义的 Role / Capability / FeatureFlag / Permission
 *
 * 四级权限体系：Tier → Capability → FeatureFlag → Permission
 * Tier 由 user_profiles.membership_tier 决定（free / basic / premium / vip）
 * Capability 是粗粒度能力（运营后台控制）
 * FeatureFlag 是功能开关（可按 Tier + 开启状态控制）
 * Permission 是细粒度权限（API 路由守卫使用）
 */

import type { UserTier } from '../database/types'

// ─────────────────────────────────────────────
//  Tier → Capability 映射
// ─────────────────────────────────────────────

var TIER_CAPABILITIES: Record<string, string[]> = {
  'free': [
    'VIEW_PUBLIC',
    'BASIC_CHART',
    'BASIC_REPORT',
    'REGISTER',
  ],
  'basic': [
    'VIEW_PUBLIC',
    'BASIC_CHART',
    'BASIC_REPORT',
    'REGISTER',
    'SAVE_HISTORY_LIMITED',
    'AI_EXPLAIN_BASIC',
    'GENERATE_REPORT',
  ],
  'premium': [
    'VIEW_PUBLIC',
    'BASIC_CHART',
    'BASIC_REPORT',
    'REGISTER',
    'SAVE_HISTORY_UNLIMITED',
    'AI_EXPLAIN_ADVANCED',
    'GENERATE_REPORT',
    'VIP_REPORT',
    'PDF_EXPORT',
    'ADVANCED_ANALYSIS',
    'FENGSHUI_ADVANCED',
    'PRO_ENGINE_ACCESS',
  ],
  'vip': [
    'VIEW_PUBLIC',
    'BASIC_CHART',
    'BASIC_REPORT',
    'REGISTER',
    'SAVE_HISTORY_UNLIMITED',
    'AI_EXPLAIN_UNLIMITED',
    'GENERATE_REPORT',
    'VIP_REPORT',
    'PDF_EXPORT',
    'ADVANCED_ANALYSIS',
    'FENGSHUI_ADVANCED',
    'PRO_ENGINE_ACCESS',
    'PRIORITY_SUPPORT',
    'EARLY_ACCESS',
  ],
}

// ─────────────────────────────────────────────
//  FeatureFlag 配置
// ─────────────────────────────────────────────

var FEATURE_FLAGS: Record<string, { enabled: boolean; minTier: string }> = {
  'vip_report': { enabled: true, minTier: 'premium' },
  'pdf_export': { enabled: true, minTier: 'premium' },
  'ai_explain': { enabled: true, minTier: 'basic' },
  'ai_explain_advanced': { enabled: true, minTier: 'premium' },
  'fengshui_advanced': { enabled: true, minTier: 'premium' },
  'pro_engine': { enabled: true, minTier: 'premium' },
  'history_unlimited': { enabled: true, minTier: 'premium' },
  'priority_support': { enabled: false, minTier: 'vip' },
  'early_access': { enabled: false, minTier: 'vip' },
  'compatibility': { enabled: true, minTier: 'free' },
}

// ─────────────────────────────────────────────
//  Tier 等级数值（用于比较）
// ─────────────────────────────────────────────

var TIER_LEVEL: Record<string, number> = {
  'free': 0,
  'basic': 1,
  'premium': 2,
  'vip': 3,
}

// ─────────────────────────────────────────────
//  权限检查函数
// ─────────────────────────────────────────────

/** 检查用户是否拥有某 Capability */
function hasCapability(tier: string, capability: string): boolean {
  var caps = TIER_CAPABILITIES[tier]
  if (!caps) return false
  return caps.indexOf(capability) !== -1
}

/** 检查 FeatureFlag 是否启用 */
function isFeatureEnabled(tier: string, flagName: string): boolean {
  var flag = FEATURE_FLAGS[flagName]
  if (!flag) return false
  if (!flag.enabled) return false
  var userLevel = TIER_LEVEL[tier] || 0
  var minLevel = TIER_LEVEL[flag.minTier] || 0
  return userLevel >= minLevel
}

/** 检查用户权限（Capability + Tier 级别） */
function hasPermission(tier: string, permission: string): boolean {
  // Permission 格式: "capability:tier" 或直接 "capability"
  var parts = permission.split(':')
  if (parts.length === 2) {
    // 带等级要求的权限
    var requiredTier = parts[1]
    return hasCapability(tier, parts[0]) && (TIER_LEVEL[tier] || 0) >= (TIER_LEVEL[requiredTier] || 0)
  }
  return hasCapability(tier, permission)
}

/** 获取用户 Tier 的所有 Capability */
function getCapabilities(tier: string): string[] {
  return TIER_CAPABILITIES[tier] || []
}

/** 获取用户 Tier 的所有可用 FeatureFlag */
function getAvailableFeatures(tier: string): string[] {
  var result: string[] = []
  var keys = Object.keys(FEATURE_FLAGS)
  for (var i = 0; i < keys.length; i++) {
    if (isFeatureEnabled(tier, keys[i])) {
      result.push(keys[i])
    }
  }
  return result
}

export { hasCapability, isFeatureEnabled, hasPermission, getCapabilities, getAvailableFeatures, TIER_CAPABILITIES, FEATURE_FLAGS, TIER_LEVEL }
