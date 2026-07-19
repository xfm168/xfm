/**
 * 前端 FeatureFlag hook
 * 基于当前用户会员等级检查功能是否可用
 *
 * 依赖 useAuth() 提供的 profile（含 membership_tier），
 * 纯同步计算，无额外网络请求。
 */

import { useAuth } from './useAuth'
import { isFeatureEnabled as checkFeatureFlag, hasCapability as checkCapability, getAvailableFeatures as getAvailable } from '../lib/domain/permission'

/** 检查某 FeatureFlag 是否对当前用户启用 */
function useFeatureFlag(flagName: string): boolean {
  var auth = useAuth()
  var profile = auth.profile
  var tier = profile ? profile.membership_tier || 'free' : 'free'
  return checkFeatureFlag(tier, flagName)
}

/** 检查当前用户是否拥有某 Capability */
function useCapability(capability: string): boolean {
  var auth = useAuth()
  var profile = auth.profile
  var tier = profile ? profile.membership_tier || 'free' : 'free'
  return checkCapability(tier, capability)
}

/** 获取当前用户 Tier 所有可用的 FeatureFlag 列表 */
function useAvailableFeatures(): string[] {
  var auth = useAuth()
  var profile = auth.profile
  var tier = profile ? profile.membership_tier || 'free' : 'free'
  return getAvailable(tier)
}

export { useFeatureFlag, useCapability, useAvailableFeatures }
