/**
 * P8 会员模块
 * 纯逻辑函数，无副作用，不耦合 Engine
 */

import type { MembershipTier } from '../database/types'
import type { MembershipPlan } from './types'

// ────────────────────────────────────────────────
//  会员计划常量
// ────────────────────────────────────────────────
export const membershipPlans: MembershipPlan[] = [
  {
    id: 'plan-free',
    name: '免费版',
    tier: 'free',
    priceCents: 0,
    currency: 'CNY',
    durationDays: 0,
    features: [
      '每日3次排盘',
      '每日1次基础分析',
      '社区功能',
    ],
    maxCharts: 3,
    maxAnalyses: 1,
    aiCredits: 0,
    highlight: false,
  },
  {
    id: 'plan-basic',
    name: '基础版',
    tier: 'basic',
    priceCents: 1900,
    currency: 'CNY',
    durationDays: 30,
    features: [
      '每日10次排盘',
      '每日5次分析',
      '50 AI积分/月',
      '基础报告导出',
    ],
    maxCharts: 10,
    maxAnalyses: 5,
    aiCredits: 50,
    highlight: false,
  },
  {
    id: 'plan-premium',
    name: '专业版',
    tier: 'premium',
    priceCents: 3900,
    currency: 'CNY',
    durationDays: 30,
    features: [
      '无限排盘',
      '无限分析',
      '200 AI积分/月',
      '完整报告导出',
      '高级命盘对比',
    ],
    maxCharts: -1,
    maxAnalyses: -1,
    aiCredits: 200,
    highlight: true,
  },
  {
    id: 'plan-vip',
    name: '至尊版',
    tier: 'vip',
    priceCents: 9900,
    currency: 'CNY',
    durationDays: 30,
    features: [
      '无限排盘',
      '无限分析',
      '500 AI积分/月',
      '完整报告导出',
      '高级命盘对比',
      '专属客服',
      '优先队列',
    ],
    maxCharts: -1,
    maxAnalyses: -1,
    aiCredits: 500,
    highlight: true,
  },
]

// ────────────────────────────────────────────────
//  会员功能权限映射
// ────────────────────────────────────────────────
var FEATURE_ACCESS: Record<string, MembershipTier[]> = {
  'chart.create': ['free', 'basic', 'premium', 'vip'],
  'analysis.basic': ['free', 'basic', 'premium', 'vip'],
  'analysis.full': ['basic', 'premium', 'vip'],
  'analysis.ai': ['premium', 'vip'],
  'analysis.compatibility': ['premium', 'vip'],
  'report.export.basic': ['basic', 'premium', 'vip'],
  'report.export.full': ['premium', 'vip'],
  'chart.compare': ['premium', 'vip'],
  'support.priority': ['vip'],
  'support.exclusive': ['vip'],
}

// ────────────────────────────────────────────────
//  查询函数
// ────────────────────────────────────────────────

/** 根据等级获取会员计划 */
export function getMembershipTier(tier: MembershipTier): MembershipPlan | null {
  for (var i = 0; i < membershipPlans.length; i++) {
    if (membershipPlans[i].tier === tier) {
      return membershipPlans[i]
    }
  }
  return null
}

/** 计算会员剩余天数 */
export function calculateMembershipDaysRemaining(expiresAt: string | null): number {
  if (!expiresAt) {
    return 0
  }
  var now = Date.now()
  var expires = new Date(expiresAt).getTime()
  var diffMs = expires - now
  if (diffMs <= 0) {
    return 0
  }
  var diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  return diffDays
}

/** 判断当前等级是否有权使用某功能 */
export function canAccessFeature(tier: MembershipTier, feature: string): boolean {
  var tiers = FEATURE_ACCESS[feature]
  if (!tiers) {
    return false
  }
  return tiers.indexOf(tier) !== -1
}

/** 判断会员是否已过期 */
export function checkMembershipExpired(tier: MembershipTier, expiresAt: string | null): boolean {
  if (tier === 'free') {
    return false
  }
  return calculateMembershipDaysRemaining(expiresAt) === 0
}
