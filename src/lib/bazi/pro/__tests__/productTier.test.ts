/**
 * Phase 6 Batch 2 Module 1: Product Tier 测试
 *
 * 覆盖：层级配置、功能权限、报告类型、订阅管理、报告限额
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  getTierConfig,
  getTierFeatures,
  canAccessFeature,
  canAccessReportType,
  createSubscription,
  cancelSubscription,
  renewSubscription,
  getActiveSubscription,
  getUserTier,
  checkReportLimit,
  getAllSubscriptions,
  resetSubscriptionStore,
  PRODUCT_TIER_ENGINE_VERSION,
} from '../productTierEngine'

import {
  PRODUCT_TIER_VERSION,
  TIER_CONFIGS,
} from '../productTierTypes'

import type {
  ProductTier,
  ReportType,
  ProductTierConfig,
  UserSubscription,
} from '../productTierTypes'

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('Phase 6 Batch 2 Module 1: Product Tier', () => {

  beforeEach(() => {
    resetSubscriptionStore()
  })

  // ─────────────────────────────────────────────
  // 1. 版本号
  // ─────────────────────────────────────────────
  describe('1. 版本号', () => {
    test('PRODUCT_TIER_ENGINE_VERSION 应为 1.0.0', () => {
      expect(PRODUCT_TIER_ENGINE_VERSION).toBe('1.0.0')
    })
    test('PRODUCT_TIER_VERSION 应为 1.0.0', () => {
      expect(PRODUCT_TIER_VERSION).toBe('1.0.0')
    })
  })

  // ─────────────────────────────────────────────
  // 2. TIER_CONFIGS 常量
  // ─────────────────────────────────────────────
  describe('2. TIER_CONFIGS 常量', () => {
    test('应包含 3 个层级', () => {
      const tiers = Object.keys(TIER_CONFIGS)
      expect(tiers).toEqual(['free', 'professional', 'vip'])
    })
    test('free 版价格为 0', () => {
      expect(TIER_CONFIGS.free.priceMonthly).toBe(0)
      expect(TIER_CONFIGS.free.priceYearly).toBe(0)
    })
    test('vip 版 maxReportsPerMonth 为 Infinity', () => {
      expect(TIER_CONFIGS.vip.maxReportsPerMonth).toBe(Infinity)
      expect(TIER_CONFIGS.vip.maxExportsPerMonth).toBe(Infinity)
    })
  })

  // ─────────────────────────────────────────────
  // 3. getTierConfig
  // ─────────────────────────────────────────────
  describe('3. getTierConfig', () => {
    test('返回对应层级的完整配置', () => {
      const config = getTierConfig('professional')
      expect(config.tier).toBe('professional')
      expect(config.name).toBe('专业版')
      expect(config.priceMonthly).toBe(29.9)
      expect(config.apiAccess).toBe(true)
      expect(config.expertReview).toBe(false)
    })
  })

  // ─────────────────────────────────────────────
  // 4. getTierFeatures
  // ─────────────────────────────────────────────
  describe('4. getTierFeatures', () => {
    test('free 有 4 个功能', () => {
      const features = getTierFeatures('free')
      expect(features.length).toBe(4)
      expect(features).toContain('basic_chart')
    })
    test('professional 功能数多于 free', () => {
      const pro = getTierFeatures('professional')
      const free = getTierFeatures('free')
      expect(pro.length).toBeGreaterThan(free.length)
    })
    test('vip 功能数最多', () => {
      const vip = getTierFeatures('vip')
      const pro = getTierFeatures('professional')
      expect(vip.length).toBeGreaterThanOrEqual(pro.length)
      expect(vip).toContain('ai_chat')
    })
  })

  // ─────────────────────────────────────────────
  // 5. canAccessFeature
  // ─────────────────────────────────────────────
  describe('5. canAccessFeature', () => {
    test('free 可访问 basic_chart', () => {
      expect(canAccessFeature('free', 'basic_chart')).toBe(true)
    })
    test('free 不可访问 master_report', () => {
      expect(canAccessFeature('free', 'master_report')).toBe(false)
    })
    test('professional 可访问 master_report', () => {
      expect(canAccessFeature('professional', 'master_report')).toBe(true)
    })
    test('vip 可访问 ai_chat', () => {
      expect(canAccessFeature('vip', 'ai_chat')).toBe(true)
    })
  })

  // ─────────────────────────────────────────────
  // 6. canAccessReportType
  // ─────────────────────────────────────────────
  describe('6. canAccessReportType', () => {
    test('free 可访问 basic_chart', () => {
      expect(canAccessReportType('free', 'basic_chart')).toBe(true)
    })
    test('free 不可访问 master_report', () => {
      expect(canAccessReportType('free', 'master_report')).toBe(false)
    })
    test('professional 可访问 master_report', () => {
      expect(canAccessReportType('professional', 'master_report')).toBe(true)
    })
    test('vip 可访问 deep_report 和 expert_reviewed', () => {
      expect(canAccessReportType('vip', 'deep_report')).toBe(true)
      expect(canAccessReportType('vip', 'expert_reviewed')).toBe(true)
    })
  })

  // ─────────────────────────────────────────────
  // 7. createSubscription
  // ─────────────────────────────────────────────
  describe('7. createSubscription', () => {
    test('创建 professional 订阅', () => {
      const sub = createSubscription('user-new', 'professional', 12)
      expect(sub.userId).toBe('user-new')
      expect(sub.tier).toBe('professional')
      expect(sub.status).toBe('active')
      expect(sub.autoRenew).toBe(true)
      expect(sub.reportsUsedThisMonth).toBe(0)
    })
    test('创建 free 订阅 autoRenew 为 false', () => {
      const sub = createSubscription('user-free', 'free', 6)
      expect(sub.autoRenew).toBe(false)
    })
    test('订阅 endDate 正确计算', () => {
      const sub = createSubscription('user-dur', 'vip', 6)
      const diffMs = sub.endDate - sub.startDate
      const expectedMs = 6 * 30 * 24 * 3600 * 1000
      expect(diffMs).toBe(expectedMs)
    })
  })

  // ─────────────────────────────────────────────
  // 8. cancelSubscription
  // ─────────────────────────────────────────────
  describe('8. cancelSubscription', () => {
    test('取消订阅成功', () => {
      const sub = createSubscription('user-cancel', 'professional', 12)
      const result = cancelSubscription(sub.id)
      expect(result).not.toBeNull()
      expect(result!.status).toBe('cancelled')
      expect(result!.autoRenew).toBe(false)
    })
    test('取消不存在的订阅返回 null', () => {
      const result = cancelSubscription('NONEXISTENT')
      expect(result).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 9. renewSubscription
  // ─────────────────────────────────────────────
  describe('9. renewSubscription', () => {
    test('续订成功延长 endDate', () => {
      const sub = createSubscription('user-renew', 'professional', 12)
      const before = sub.endDate
      const result = renewSubscription(sub.id, 6)
      expect(result).not.toBeNull()
      expect(result!.endDate).toBeGreaterThan(before)
    })
    test('续订不存在的订阅返回 null', () => {
      const result = renewSubscription('NONEXISTENT', 3)
      expect(result).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 10. getActiveSubscription
  // ─────────────────────────────────────────────
  describe('10. getActiveSubscription', () => {
    test('获取种子数据中 user-001 的活跃订阅', () => {
      const sub = getActiveSubscription('user-001')
      expect(sub).not.toBeNull()
      expect(sub!.tier).toBe('professional')
      expect(sub!.status).toBe('active')
    })
    test('不存在的用户返回 null', () => {
      const sub = getActiveSubscription('user-nonexistent')
      expect(sub).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 11. getUserTier
  // ─────────────────────────────────────────────
  describe('11. getUserTier', () => {
    test('有活跃订阅返回对应层级', () => {
      expect(getUserTier('user-001')).toBe('professional')
      expect(getUserTier('user-002')).toBe('vip')
    })
    test('无订阅返回 free', () => {
      expect(getUserTier('user-no-sub')).toBe('free')
    })
  })

  // ─────────────────────────────────────────────
  // 12. checkReportLimit
  // ─────────────────────────────────────────────
  describe('12. checkReportLimit', () => {
    test('free 用户限额为 3', () => {
      const limit = checkReportLimit('user-no-sub')
      expect(limit.max).toBe(3)
      expect(limit.used).toBe(0)
      expect(limit.canCreate).toBe(true)
    })
    test('professional 用户已使用 5 次限额 50', () => {
      const limit = checkReportLimit('user-001')
      expect(limit.used).toBe(5)
      expect(limit.max).toBe(50)
      expect(limit.canCreate).toBe(true)
    })
    test('vip 用户限额 Infinity', () => {
      const limit = checkReportLimit('user-002')
      expect(limit.max).toBe(Infinity)
      expect(limit.canCreate).toBe(true)
    })
  })

  // ─────────────────────────────────────────────
  // 13. getAllSubscriptions
  // ─────────────────────────────────────────────
  describe('13. getAllSubscriptions', () => {
    test('种子数据有 3 个订阅', () => {
      const all = getAllSubscriptions()
      expect(all.length).toBe(3)
    })
    test('新增订阅后数量增加', () => {
      const before = getAllSubscriptions().length
      createSubscription('user-new2', 'vip', 12)
      const after = getAllSubscriptions().length
      expect(after).toBe(before + 1)
    })
  })

  // ─────────────────────────────────────────────
  // 14. resetSubscriptionStore
  // ─────────────────────────────────────────────
  describe('14. resetSubscriptionStore', () => {
    test('重置后恢复 3 个种子订阅', () => {
      createSubscription('user-extra', 'vip', 12)
      createSubscription('user-extra2', 'professional', 6)
      expect(getAllSubscriptions().length).toBeGreaterThan(3)

      resetSubscriptionStore()
      expect(getAllSubscriptions().length).toBe(3)
    })
    test('重置后可正常查询种子数据', () => {
      resetSubscriptionStore()
      const sub = getActiveSubscription('user-002')
      expect(sub).not.toBeNull()
      expect(sub!.tier).toBe('vip')
    })
  })
})