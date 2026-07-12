/**
 * V2 会员系统 — 三级会员 Free / Pro / Master
 * 纯逻辑函数，无副作用
 * 使用单引号 + concatenation
 */

// ────────────────────────────────────────────────
//  接口定义
// ────────────────────────────────────────────────

export interface MembershipPlanV2 {
  id: string
  name: string
  price: number
  currency: string
  features: string[]
  dailyLimit: number
  hasAIChat: boolean
  hasExpertConsult: boolean
  hasPDFExport: boolean
  hasHDReport: boolean
}

export type PlanTierV2 = 'free' | 'pro' | 'master'

// ────────────────────────────────────────────────
//  计划常量
// ────────────────────────────────────────────────

export var PLANS_V2: MembershipPlanV2[] = [
  {
    id: 'plan-v2-free',
    name: 'Free',
    price: 0,
    currency: 'CNY',
    features: [
      '每日3次分析',
      '基础报告',
      '社区功能',
      '每日运势'
    ],
    dailyLimit: 3,
    hasAIChat: false,
    hasExpertConsult: false,
    hasPDFExport: false,
    hasHDReport: false
  },
  {
    id: 'plan-v2-pro',
    name: 'Pro',
    price: 29,
    currency: 'CNY',
    features: [
      '每日20次分析',
      '高清报告',
      'PDF导出',
      'AI问答',
      '优先客服',
      '每日运势'
    ],
    dailyLimit: 20,
    hasAIChat: true,
    hasExpertConsult: false,
    hasPDFExport: true,
    hasHDReport: true
  },
  {
    id: 'plan-v2-master',
    name: 'Master',
    price: 99,
    currency: 'CNY',
    features: [
      '无限分析',
      '高级命理',
      'AI问答',
      '专家咨询',
      '高清报告',
      'PDF导出',
      '专属客服',
      '全部分析工具'
    ],
    dailyLimit: -1,
    hasAIChat: true,
    hasExpertConsult: true,
    hasPDFExport: true,
    hasHDReport: true
  }
]

// ────────────────────────────────────────────────
//  功能权限映射
// ────────────────────────────────────────────────

var FEATURE_ACCESS_V2: Record<string, PlanTierV2[]> = {
  'analysis.basic': ['free', 'pro', 'master'],
  'analysis.advanced': ['pro', 'master'],
  'analysis.unlimited': ['master'],
  'report.hd': ['pro', 'master'],
  'report.pdf': ['pro', 'master'],
  'ai.chat': ['pro', 'master'],
  'expert.consult': ['master'],
  'daily.fortune': ['free', 'pro', 'master']
}

// ────────────────────────────────────────────────
//  查询函数
// ────────────────────────────────────────────────

/** 根据等级获取计划详情 */
export function getPlan(tier: PlanTierV2): MembershipPlanV2 | null {
  for (var i = 0; i < PLANS_V2.length; i++) {
    if (PLANS_V2[i].id === 'plan-v2-' + tier) {
      return PLANS_V2[i]
    }
  }
  return null
}

/** 检查功能权限 */
export function canAccess(tier: PlanTierV2, feature: string): boolean {
  var tiers = FEATURE_ACCESS_V2[feature]
  if (!tiers) {
    return false
  }
  return tiers.indexOf(tier) !== -1
}

/** 计算剩余天数 */
export function calculateDaysRemaining(expiresAt: string | null): number {
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

/** 检查是否过期 */
export function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) {
    return true
  }
  return calculateDaysRemaining(expiresAt) <= 0
}
