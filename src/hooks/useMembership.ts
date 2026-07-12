/**
 * useMembership — 会员状态管理 Hook
 * 参考 useBazi.ts 的模式：Status 联合类型 + useState + useCallback
 * 暂时使用 localStorage 模拟后端
 */

import { useState, useCallback, useEffect } from 'react'
import type { MembershipTier } from '../lib/database/types'
import type { MembershipPlan, MembershipState } from '../lib/business/types'

const STORAGE_KEY = 'xuanfengmen_membership'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface FeatureAccess {
  feature: string
  allowed: boolean
  reason: string
}

interface UseMembershipResult {
  status: Status
  membership: MembershipState
  error: string | null
  canAccess: (feature: string) => boolean
  refreshMembership: () => void
  checkFeatureAccess: (feature: string) => FeatureAccess
  upgradePlan: (plan: MembershipPlan) => void
}

var TIER_ORDER: Record<MembershipTier, number> = {
  'free': 0,
  'basic': 1,
  'premium': 2,
  'vip': 3,
}

var TIER_FEATURES: Record<MembershipTier, string[]> = {
  'free': ['daily_hexagram', 'basic_chart', 'single_bazi'],
  'basic': ['daily_hexagram', 'basic_chart', 'single_bazi', 'save_charts', 'fengshui_scan'],
  'premium': ['daily_hexagram', 'basic_chart', 'single_bazi', 'save_charts', 'fengshui_scan', 'ai_analysis', 'detailed_report'],
  'vip': ['daily_hexagram', 'basic_chart', 'single_bazi', 'save_charts', 'fengshui_scan', 'ai_analysis', 'detailed_report', 'priority_support', 'exclusive_content'],
}

var DEFAULT_MEMBERSHIP: MembershipState = {
  tier: 'free',
  expiresAt: null,
  plan: null,
  daysRemaining: 0,
}

function loadFromStorage(): MembershipState {
  try {
    var raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_MEMBERSHIP
    return JSON.parse(raw) as MembershipState
  } catch {
    return DEFAULT_MEMBERSHIP
  }
}

function saveToStorage(state: MembershipState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // 静默失败
  }
}

function calculateDaysRemaining(expiresAt: string | null): number {
  if (!expiresAt) return 0
  var now = Date.now()
  var expires = new Date(expiresAt).getTime()
  var diffMs = expires - now
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

export function useMembership(): UseMembershipResult {
  var initMembership = loadFromStorage()
  initMembership.daysRemaining = calculateDaysRemaining(initMembership.expiresAt)

  var membershipHook = useState<MembershipState>(initMembership)
  var membership = membershipHook[0]
  var setMembership = membershipHook[1]

  var statusHook = useState<Status>('idle')
  var status = statusHook[0]
  var setStatus = statusHook[1]

  var errorHook = useState<string | null>(null)
  var error = errorHook[0]
  var setError = errorHook[1]

  // 自动检查会员过期
  useEffect(function() {
    if (!membership.expiresAt) return undefined
    var timer = setInterval(function() {
      var remaining = calculateDaysRemaining(membership.expiresAt)
      if (remaining <= 0) {
        var expired = Object.assign({}, DEFAULT_MEMBERSHIP)
        setMembership(expired)
        saveToStorage(expired)
      } else if (remaining !== membership.daysRemaining) {
        var updated = Object.assign({}, membership, { daysRemaining: remaining })
        setMembership(updated)
        saveToStorage(updated)
      }
    }, 60 * 1000)
    return function() { clearInterval(timer) }
  }, [membership.expiresAt, membership.daysRemaining])

  var refreshMembership = useCallback(function() {
    try {
      setStatus('loading')
      setError(null)
      var data = loadFromStorage()
      data.daysRemaining = calculateDaysRemaining(data.expiresAt)
      setMembership(data)
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : '刷新会员状态失败')
      setStatus('error')
    }
  }, [])

  var canAccess = useCallback(function(feature: string): boolean {
    var features = TIER_FEATURES[membership.tier]
    return features.indexOf(feature) !== -1
  }, [membership.tier])

  var checkFeatureAccess = useCallback(function(feature: string): FeatureAccess {
    var features = TIER_FEATURES[membership.tier]
    var allowed = features.indexOf(feature) !== -1
    return {
      feature: feature,
      allowed: allowed,
      reason: allowed
        ? '当前会员等级可用'
        : '需要升级到 ' + getNextTierName(membership.tier) + ' 及以上',
    }
  }, [membership.tier])

  var upgradePlan = useCallback(function(plan: MembershipPlan) {
    try {
      setStatus('loading')
      setError(null)

      var now = new Date()
      var expires = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000)
      var remaining = calculateDaysRemaining(membership.expiresAt)
      var finalExpires: Date

      if (remaining > 0 && TIER_ORDER[plan.tier] > TIER_ORDER[membership.tier]) {
        // 升级时叠加剩余天数
        finalExpires = new Date(expires.getTime() + remaining * 24 * 60 * 60 * 1000)
      } else {
        finalExpires = expires
      }

      var newState: MembershipState = {
        tier: plan.tier,
        expiresAt: finalExpires.toISOString(),
        plan: plan,
        daysRemaining: calculateDaysRemaining(finalExpires.toISOString()),
      }

      setMembership(newState)
      saveToStorage(newState)
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : '升级会员失败')
      setStatus('error')
    }
  }, [membership.expiresAt, membership.tier])

  return {
    status: status,
    membership: membership,
    error: error,
    canAccess: canAccess,
    refreshMembership: refreshMembership,
    checkFeatureAccess: checkFeatureAccess,
    upgradePlan: upgradePlan,
  }
}

function getNextTierName(current: MembershipTier): string {
  var names: Record<MembershipTier, string> = {
    'free': '基础版',
    'basic': '高级版',
    'premium': '至尊版',
    'vip': '至尊版',
  }
  var tiers: MembershipTier[] = ['free', 'basic', 'premium', 'vip']
  var idx = tiers.indexOf(current)
  if (idx < tiers.length - 1) {
    return names[tiers[idx + 1]]
  }
  return names[current]
}
