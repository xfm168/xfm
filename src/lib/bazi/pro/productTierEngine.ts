/**
 * Phase 6 Batch 2 Module 1: Product Tier Engine
 *
 * 职责：产品版本配置查询、订阅管理、权限检查、报告限额
 * 约束：不做命理计算，仅提供产品版本与订阅数据管理
 */

import type {
  ProductTier,
  ReportType,
  ProductTierConfig,
  UserSubscription,
} from './productTierTypes'

import {
  PRODUCT_TIER_VERSION,
  TIER_CONFIGS,
} from './productTierTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

export const PRODUCT_TIER_ENGINE_VERSION = PRODUCT_TIER_VERSION

// ═══════════════════════════════════════════════════════════
// 内部存储
// ═══════════════════════════════════════════════════════════

const subscriptionStore = new Map<string, UserSubscription>()

let idCounter = 0

// ═══════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════

function generateSubscriptionId(): string {
  idCounter++
  const ts = Date.now()
  return `SUB-${ts}-${idCounter.toString().padStart(4, '0')}`
}

// ═══════════════════════════════════════════════════════════
// 种子数据
// ═══════════════════════════════════════════════════════════

function seedSubscriptions(): void {
  const now = Date.now()

  const sub1: UserSubscription = {
    id: 'SUB-SEED-0001',
    userId: 'user-001',
    tier: 'professional',
    startDate: now - 30 * 24 * 3600 * 1000,
    endDate: now + 335 * 24 * 3600 * 1000,
    autoRenew: true,
    reportsUsedThisMonth: 5,
    reportsUsedTotal: 42,
    status: 'active',
    createdAt: now - 30 * 24 * 3600 * 1000,
  }
  subscriptionStore.set(sub1.id, sub1)

  const sub2: UserSubscription = {
    id: 'SUB-SEED-0002',
    userId: 'user-002',
    tier: 'vip',
    startDate: now - 60 * 24 * 3600 * 1000,
    endDate: now + 305 * 24 * 3600 * 1000,
    autoRenew: true,
    reportsUsedThisMonth: 12,
    reportsUsedTotal: 128,
    status: 'active',
    createdAt: now - 60 * 24 * 3600 * 1000,
  }
  subscriptionStore.set(sub2.id, sub2)

  const sub3: UserSubscription = {
    id: 'SUB-SEED-0003',
    userId: 'user-003',
    tier: 'free',
    startDate: now - 90 * 24 * 3600 * 1000,
    endDate: now + 275 * 24 * 3600 * 1000,
    autoRenew: false,
    reportsUsedThisMonth: 1,
    reportsUsedTotal: 8,
    status: 'trial',
    createdAt: now - 90 * 24 * 3600 * 1000,
  }
  subscriptionStore.set(sub3.id, sub3)
}

// 初始化种子
seedSubscriptions()

// ═══════════════════════════════════════════════════════════
// 核心函数
// ═══════════════════════════════════════════════════════════

/**
 * 获取层级配置
 */
export function getTierConfig(tier: ProductTier): ProductTierConfig {
  return TIER_CONFIGS[tier]
}

/**
 * 获取层级功能列表
 */
export function getTierFeatures(tier: ProductTier): string[] {
  return [...TIER_CONFIGS[tier].features]
}

/**
 * 检查层级是否可访问某功能
 */
export function canAccessFeature(tier: ProductTier, featureId: string): boolean {
  const config = TIER_CONFIGS[tier]
  return config.features.includes(featureId)
}

/**
 * 检查层级是否可访问某报告类型
 */
export function canAccessReportType(tier: ProductTier, reportType: ReportType): boolean {
  const config = TIER_CONFIGS[tier]
  return config.reportTypes.includes(reportType)
}

/**
 * 创建订阅
 */
export function createSubscription(userId: string, tier: ProductTier, durationMonths: number): UserSubscription {
  const now = Date.now()
  const id = generateSubscriptionId()

  const subscription: UserSubscription = {
    id,
    userId,
    tier,
    startDate: now,
    endDate: now + durationMonths * 30 * 24 * 3600 * 1000,
    autoRenew: tier !== 'free',
    reportsUsedThisMonth: 0,
    reportsUsedTotal: 0,
    status: 'active',
    createdAt: now,
  }

  subscriptionStore.set(id, subscription)
  return subscription
}

/**
 * 取消订阅
 */
export function cancelSubscription(subscriptionId: string): UserSubscription | null {
  const sub = subscriptionStore.get(subscriptionId)
  if (!sub) {
    return null
  }
  sub.status = 'cancelled'
  sub.autoRenew = false
  return sub
}

/**
 * 续订订阅
 */
export function renewSubscription(subscriptionId: string, months: number): UserSubscription | null {
  const sub = subscriptionStore.get(subscriptionId)
  if (!sub) {
    return null
  }
  const now = Date.now()
  const baseEnd = Math.max(now, sub.endDate)
  sub.endDate = baseEnd + months * 30 * 24 * 3600 * 1000
  sub.status = 'active'
  return sub
}

/**
 * 获取用户活跃订阅
 */
export function getActiveSubscription(userId: string): UserSubscription | null {
  const now = Date.now()
  for (const sub of subscriptionStore.values()) {
    if (sub.userId === userId && sub.status === 'active' && sub.endDate > now) {
      return sub
    }
  }
  return null
}

/**
 * 获取用户层级（无订阅返回 'free'）
 */
export function getUserTier(userId: string): ProductTier {
  const active = getActiveSubscription(userId)
  if (!active) {
    return 'free'
  }
  return active.tier
}

/**
 * 检查报告限额
 */
export function checkReportLimit(userId: string): { canCreate: boolean; used: number; max: number } {
  const tier = getUserTier(userId)
  const config = TIER_CONFIGS[tier]
  const max = config.maxReportsPerMonth
  const active = getActiveSubscription(userId)
  const used = active ? active.reportsUsedThisMonth : 0

  return {
    canCreate: used < max,
    used,
    max,
  }
}

/**
 * 获取所有订阅
 */
export function getAllSubscriptions(): UserSubscription[] {
  return Array.from(subscriptionStore.values())
}

/**
 * 重置订阅存储（用于测试）
 */
export function resetSubscriptionStore(): void {
  subscriptionStore.clear()
  idCounter = 0
  seedSubscriptions()
}