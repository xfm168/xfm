/**
 * Expert Review Upgrade Engine 测试套件
 *
 * 覆盖：
 *   - 版本号
 *   - createExpertAccount 创建专家
 *   - getExpertAccount 查询专家
 *   - updateExpertStats 更新统计
 *   - promoteExpert 自动升级
 *   - getExpertLeaderboard 排行榜
 *   - getExpertsByTier / getExpertsBySpecialty
 *   - getExpertSystemStats 全局统计
 *   - checkTierEligibility 等级检查
 *   - getAllExperts / resetExpertStore
 *   - 种子数据验证
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import type {
  ExpertTier,
  ExpertSpecialty,
  ExpertAccount,
  ExpertLeaderboard,
  ExpertSystemStats,
} from '../expertReviewUpgradeTypes'

import {
  EXPERT_REVIEW_UPGRADE_VERSION,
  EXPERT_TIER_REQUIREMENTS,
  EXPERT_TIERS,
} from '../expertReviewUpgradeTypes'

import {
  EXPERT_REVIEW_UPGRADE_ENGINE_VERSION,
  createExpertAccount,
  getExpertAccount,
  updateExpertStats,
  promoteExpert,
  getExpertLeaderboard,
  getExpertsByTier,
  getExpertsBySpecialty,
  getExpertSystemStats,
  checkTierEligibility,
  getAllExperts,
  resetExpertStore,
} from '../expertReviewUpgradeEngine'

describe('expertReviewUpgradeEngine', () => {
  beforeEach(() => {
    resetExpertStore()
  })

  // ─── 版本号 ───
  describe('版本号', () => {
    test('types 版本为 1.0.0', () => {
      expect(EXPERT_REVIEW_UPGRADE_VERSION).toBe('1.0.0')
    })

    test('engine 版本与 types 一致', () => {
      expect(EXPERT_REVIEW_UPGRADE_ENGINE_VERSION).toBe(EXPERT_REVIEW_UPGRADE_VERSION)
    })
  })

  // ─── createExpertAccount ───
  describe('createExpertAccount', () => {
    test('创建专家账号返回正确结构', () => {
      const expert = createExpertAccount({
        name: '测试专家',
        tier: 'bronze',
        specialties: ['pattern'],
        lastActiveAt: Date.now(),
        bio: '测试简介',
      })

      expect(expert.id).toMatch(/^EXP-\d+-\d{4}$/)
      expect(expert.name).toBe('测试专家')
      expect(expert.tier).toBe('bronze')
      expect(expert.specialties).toEqual(['pattern'])
      expect(expert.totalReviews).toBe(0)
      expect(expert.agreementRate).toBe(0)
      expect(expert.avgReviewTime).toBe(0)
      expect(expert.qualityScore).toBe(0)
      expect(expert.joinedAt).toBeGreaterThan(0)
      expect(expert.badges).toEqual([])
    })

    test('自动设置 joinedAt', () => {
      const before = Date.now()
      const expert = createExpertAccount({
        name: '测试',
        tier: 'bronze',
        specialties: ['xiYong'],
        lastActiveAt: Date.now(),
        bio: '',
      })
      expect(expert.joinedAt).toBeGreaterThanOrEqual(before)
    })
  })

  // ─── getExpertAccount ───
  describe('getExpertAccount', () => {
    test('存在 ID 返回专家对象', () => {
      const all = getAllExperts()
      if (all.length > 0) {
        const found = getExpertAccount(all[0].id)
        expect(found).toBeDefined()
        expect(found!.id).toBe(all[0].id)
      }
    })

    test('不存在 ID 返回 undefined', () => {
      const result = getExpertAccount('nonexistent-id')
      expect(result).toBeUndefined()
    })
  })

  // ─── updateExpertStats ───
  describe('updateExpertStats', () => {
    test('更新后 totalReviews 增加', () => {
      const expert = createExpertAccount({
        name: '更新测试',
        tier: 'bronze',
        specialties: ['pattern'],
        lastActiveAt: Date.now(),
        bio: '',
      })
      updateExpertStats(expert.id, { agreement: true, reviewTime: 10, qualityScore: 70 })
      const updated = getExpertAccount(expert.id)!
      expect(updated.totalReviews).toBe(1)
    })

    test('多次更新后 agreementRate 正确计算', () => {
      const expert = createExpertAccount({
        name: '一致率测试',
        tier: 'bronze',
        specialties: ['tenGod'],
        lastActiveAt: Date.now(),
        bio: '',
      })
      updateExpertStats(expert.id, { agreement: true, reviewTime: 5, qualityScore: 80 })
      updateExpertStats(expert.id, { agreement: true, reviewTime: 8, qualityScore: 85 })
      updateExpertStats(expert.id, { agreement: false, reviewTime: 6, qualityScore: 75 })
      const updated = getExpertAccount(expert.id)!
      expect(updated.totalReviews).toBe(3)
      expect(updated.agreementRate).toBeCloseTo(2 / 3, 5)
    })

    test('更新 lastActiveAt', () => {
      const expert = createExpertAccount({
        name: '活跃时间测试',
        tier: 'bronze',
        specialties: ['fortune'],
        lastActiveAt: 0,
        bio: '',
      })
      const before = Date.now()
      updateExpertStats(expert.id, { agreement: true, reviewTime: 5, qualityScore: 70 })
      const updated = getExpertAccount(expert.id)!
      expect(updated.lastActiveAt).toBeGreaterThanOrEqual(before)
    })

    test('不存在的专家返回 null', () => {
      const result = updateExpertStats('nonexistent', { agreement: true, reviewTime: 5, qualityScore: 70 })
      expect(result).toBeNull()
    })

    test('avgReviewTime 正确计算加权平均', () => {
      const expert = createExpertAccount({
        name: '时间测试',
        tier: 'bronze',
        specialties: ['pattern'],
        lastActiveAt: Date.now(),
        bio: '',
      })
      updateExpertStats(expert.id, { agreement: true, reviewTime: 10, qualityScore: 70 })
      updateExpertStats(expert.id, { agreement: true, reviewTime: 20, qualityScore: 70 })
      const updated = getExpertAccount(expert.id)!
      expect(updated.avgReviewTime).toBeCloseTo(15, 5)
    })
  })

  // ─── promoteExpert ───
  describe('promoteExpert', () => {
    test('bronze 专家满足条件升级到 silver', () => {
      const expert = createExpertAccount({
        name: '升级测试',
        tier: 'bronze',
        specialties: ['pattern'],
        lastActiveAt: Date.now(),
        bio: '',
      })
      // 模拟 20 次审核，agreement 0.75, quality 65
      for (let i = 0; i < 15; i++) {
        updateExpertStats(expert.id, { agreement: true, reviewTime: 10, qualityScore: 65 })
      }
      for (let i = 0; i < 5; i++) {
        updateExpertStats(expert.id, { agreement: false, reviewTime: 10, qualityScore: 65 })
      }
      const result = promoteExpert(expert.id)
      expect(result).not.toBeNull()
      expect(result!.tier).toBe('silver')
    })

    test('不满足条件不升级', () => {
      const expert = createExpertAccount({
        name: '不升级测试',
        tier: 'bronze',
        specialties: ['pattern'],
        lastActiveAt: Date.now(),
        bio: '',
      })
      // 只有 5 次审核
      for (let i = 0; i < 5; i++) {
        updateExpertStats(expert.id, { agreement: true, reviewTime: 10, qualityScore: 80 })
      }
      const result = promoteExpert(expert.id)
      expect(result).not.toBeNull()
      expect(result!.tier).toBe('bronze')
    })

    test('不存在的专家返回 null', () => {
      const result = promoteExpert('nonexistent')
      expect(result).toBeNull()
    })

    test('升级后获得对应徽章', () => {
      const expert = createExpertAccount({
        name: '徽章测试',
        tier: 'bronze',
        specialties: ['pattern'],
        lastActiveAt: Date.now(),
        bio: '',
      })
      for (let i = 0; i < 20; i++) {
        updateExpertStats(expert.id, { agreement: true, reviewTime: 10, qualityScore: 70 })
      }
      promoteExpert(expert.id)
      const updated = getExpertAccount(expert.id)!
      expect(updated.badges.length).toBeGreaterThan(0)
    })
  })

  // ─── getExpertLeaderboard ───
  describe('getExpertLeaderboard', () => {
    test('返回排行榜结构', () => {
      const lb = getExpertLeaderboard('total_reviews')
      expect(lb.dimension).toBe('total_reviews')
      expect(lb.rankings).toBeInstanceOf(Array)
    })

    test('total_reviews 降序排列', () => {
      const lb = getExpertLeaderboard('total_reviews')
      for (let i = 1; i < lb.rankings.length; i++) {
        expect(lb.rankings[i - 1].value).toBeGreaterThanOrEqual(lb.rankings[i].value)
      }
    })

    test('avg_time 升序排列（越小越好）', () => {
      // 先给专家添加审核记录
      const all = getAllExperts()
      for (const exp of all) {
        updateExpertStats(exp.id, { agreement: true, reviewTime: Math.random() * 30 + 5, qualityScore: 70 })
      }
      const lb = getExpertLeaderboard('avg_time')
      for (let i = 1; i < lb.rankings.length; i++) {
        expect(lb.rankings[i - 1].value).toBeLessThanOrEqual(lb.rankings[i].value)
      }
    })

    test('每条排名包含必要字段', () => {
      const lb = getExpertLeaderboard('quality_score')
      for (const r of lb.rankings) {
        expect(r).toHaveProperty('expertId')
        expect(r).toHaveProperty('expertName')
        expect(r).toHaveProperty('tier')
        expect(r).toHaveProperty('value')
      }
    })
  })

  // ─── getExpertsByTier ───
  describe('getExpertsByTier', () => {
    test('bronze 等级有专家', () => {
      const experts = getExpertsByTier('bronze')
      expect(experts.length).toBeGreaterThanOrEqual(1)
      for (const e of experts) {
        expect(e.tier).toBe('bronze')
      }
    })

    test('不存在的等级返回空数组', () => {
      // ExpertTier 类型限制，但空数组仍可测试
      const experts = getExpertsByTier('master')
      expect(experts).toBeInstanceOf(Array)
    })
  })

  // ─── getExpertsBySpecialty ───
  describe('getExpertsBySpecialty', () => {
    test('pattern 专长有专家', () => {
      const experts = getExpertsBySpecialty('pattern')
      expect(experts.length).toBeGreaterThanOrEqual(1)
      for (const e of experts) {
        expect(e.specialties).toContain('pattern')
      }
    })

    test('不存在的专长返回空数组', () => {
      const experts = getExpertsBySpecialty('nonexistent' as ExpertSpecialty)
      expect(experts).toEqual([])
    })
  })

  // ─── getExpertSystemStats ───
  describe('getExpertSystemStats', () => {
    test('返回完整统计结构', () => {
      const stats = getExpertSystemStats()
      expect(stats.totalExperts).toBeGreaterThan(0)
      expect(stats.byTier).toBeDefined()
      expect(stats.totalReviews).toBeGreaterThanOrEqual(0)
      expect(stats.overallAgreementRate).toBeGreaterThanOrEqual(0)
      expect(stats.topDisagreementFields).toBeInstanceOf(Array)
      expect(stats.averageReviewTime).toBeGreaterThanOrEqual(0)
      expect(stats.expertProductivity).toBeInstanceOf(Array)
    })

    test('byTier 包含所有等级', () => {
      const stats = getExpertSystemStats()
      for (const tier of EXPERT_TIERS) {
        expect(stats.byTier).toHaveProperty(tier)
      }
    })

    test('totalExperts 与 getAllExperts 一致', () => {
      const stats = getExpertSystemStats()
      expect(stats.totalExperts).toBe(getAllExperts().length)
    })
  })

  // ─── checkTierEligibility ───
  describe('checkTierEligibility', () => {
    test('新创建专家符合 bronze', () => {
      const expert = createExpertAccount({
        name: '资格测试',
        tier: 'bronze',
        specialties: ['pattern'],
        lastActiveAt: Date.now(),
        bio: '',
      })
      const eligible = checkTierEligibility(expert.id)
      expect(eligible).toBe('bronze')
    })

    test('不存在的专家返回 bronze', () => {
      const eligible = checkTierEligibility('nonexistent')
      expect(eligible).toBe('bronze')
    })

    test('满足多级条件返回最高等级', () => {
      const expert = createExpertAccount({
        name: '多级测试',
        tier: 'bronze',
        specialties: ['pattern'],
        lastActiveAt: Date.now(),
        bio: '',
      })
      // 100 次审核，agreement 0.85, quality 80 -> gold
      for (let i = 0; i < 85; i++) {
        updateExpertStats(expert.id, { agreement: true, reviewTime: 10, qualityScore: 80 })
      }
      for (let i = 0; i < 15; i++) {
        updateExpertStats(expert.id, { agreement: false, reviewTime: 10, qualityScore: 80 })
      }
      const eligible = checkTierEligibility(expert.id)
      expect(eligible).toBe('gold')
    })
  })

  // ─── getAllExperts ───
  describe('getAllExperts', () => {
    test('返回专家数组', () => {
      const all = getAllExperts()
      expect(Array.isArray(all)).toBe(true)
    })

    test('每条专家包含必要字段', () => {
      const all = getAllExperts()
      for (const e of all) {
        expect(e).toHaveProperty('id')
        expect(e).toHaveProperty('name')
        expect(e).toHaveProperty('tier')
        expect(e).toHaveProperty('specialties')
        expect(e).toHaveProperty('totalReviews')
        expect(e).toHaveProperty('agreementRate')
      }
    })
  })

  // ─── resetExpertStore ───
  describe('resetExpertStore', () => {
    test('重置后种子数据恢复', () => {
      createExpertAccount({
        name: '临时专家',
        tier: 'bronze',
        specialties: ['pattern'],
        lastActiveAt: Date.now(),
        bio: '',
      })
      resetExpertStore()
      const all = getAllExperts()
      expect(all.length).toBe(5)
    })
  })

  // ─── 种子数据验证 ───
  describe('种子数据验证', () => {
    test('种子数据有 5 个专家', () => {
      const all = getAllExperts()
      expect(all.length).toBe(5)
    })

    test('各等级都有专家分布', () => {
      const all = getAllExperts()
      const tiers = new Set(all.map(e => e.tier))
      expect(tiers.has('bronze')).toBe(true)
      expect(tiers.has('silver')).toBe(true)
      expect(tiers.has('gold')).toBe(true)
      expect(tiers.has('master')).toBe(true)
    })

    test('EXPERT_TIER_REQUIREMENTS 包含所有等级', () => {
      for (const tier of EXPERT_TIERS) {
        expect(EXPERT_TIER_REQUIREMENTS).toHaveProperty(tier)
        const req = EXPERT_TIER_REQUIREMENTS[tier]
        expect(typeof req.minReviews).toBe('number')
        expect(typeof req.minAgreement).toBe('number')
        expect(typeof req.minQuality).toBe('number')
        expect(typeof req.title).toBe('string')
      }
    })

    test('EXPERT_TIERS 顺序正确', () => {
      expect(EXPERT_TIERS).toEqual(['bronze', 'silver', 'gold', 'master'])
    })

    test('宗师级专家有全领域专长', () => {
      const all = getAllExperts()
      const master = all.find(e => e.tier === 'master')
      expect(master).toBeDefined()
      expect(master!.specialties.length).toBe(8)
    })

    test('种子数据专家 totalReviews 为 0', () => {
      const all = getAllExperts()
      for (const e of all) {
        expect(e.totalReviews).toBe(0)
      }
    })
  })
})