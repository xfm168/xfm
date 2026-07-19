/**
 * V5.0 RC Phase 5 Module J: License Manager 测试
 *
 * 覆盖：许可证生成、验证、功能权限、吊销、升级、门禁
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  generateLicense,
  validateLicense,
  checkFeatureAccess,
  getFeaturePermissions,
  revokeLicense,
  upgradeLicense,
  enforceLicenseGate,
  getLicenseByKey,
  getAllLicenses,
  getTierLimits,
  registerCustomFeatures,
  resetLicenseStore,
  LICENSE_MANAGER_ENGINE_VERSION,
} from '../licenseManagerEngine'

import {
  LICENSE_MANAGER_VERSION,
  LICENSE_FEATURES,
  TIER_LIMITS,
  TIER_ORDER,
} from '../licenseManagerTypes'

import type {
  LicenseTier,
  LicenseInfo,
  LicenseCheckResult,
  FeaturePermission,
  TierLimits,
} from '../licenseManagerTypes'

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('V5.0 RC Phase 5: License Manager', () => {

  beforeEach(() => {
    resetLicenseStore()
  })

  // ─────────────────────────────────────────────
  // 1. 版本号
  // ─────────────────────────────────────────────
  describe('1. 版本号', () => {
    test('LICENSE_MANAGER_ENGINE_VERSION 应为 1.0.0', () => {
      expect(LICENSE_MANAGER_ENGINE_VERSION).toBe('1.0.0')
    })
    test('LICENSE_MANAGER_VERSION 应为 1.0.0', () => {
      expect(LICENSE_MANAGER_VERSION).toBe('1.0.0')
    })
  })

  // ─────────────────────────────────────────────
  // 2. LICENSE_FEATURES 常量
  // ─────────────────────────────────────────────
  describe('2. LICENSE_FEATURES 常量', () => {
    test('应包含 10 个功能', () => {
      expect(LICENSE_FEATURES.length).toBe(10)
    })
    test('每个功能有 featureId / name / description / requiredTier / isGate', () => {
      for (const f of LICENSE_FEATURES) {
        expect(f.featureId).toBeTruthy()
        expect(f.name).toBeTruthy()
        expect(f.description).toBeTruthy()
        expect(['community', 'professional', 'enterprise']).toContain(f.requiredTier)
        expect(typeof f.isGate).toBe('boolean')
      }
    })
    test('门禁功能 (isGate=true) 列表正确', () => {
      const gates = LICENSE_FEATURES.filter(f => f.isGate)
      const gateIds = gates.map(f => f.featureId)
      expect(gateIds).toContain('professional-report')
      expect(gateIds).toContain('enterprise-report')
      expect(gateIds).toContain('expert-review-access')
      expect(gateIds).toContain('api-access')
    })
  })

  // ─────────────────────────────────────────────
  // 3. TIER_ORDER
  // ─────────────────────────────────────────────
  describe('3. TIER_ORDER', () => {
    test('层级顺序：community → professional → enterprise', () => {
      expect(TIER_ORDER).toEqual(['community', 'professional', 'enterprise'])
    })
  })

  // ─────────────────────────────────────────────
  // 4. TIER_LIMITS
  // ─────────────────────────────────────────────
  describe('4. TIER_LIMITS', () => {
    test('community 限制正确', () => {
      const limits = TIER_LIMITS.community
      expect(limits.maxCases).toBe(10)
      expect(limits.maxReports).toBe(5)
      expect(limits.maxExports).toBe(2)
      expect(limits.apiAccess).toBe(false)
      expect(limits.expertReview).toBe(false)
      expect(limits.fullKnowledgeBase).toBe(false)
      expect(limits.reportTemplates).toEqual(['basic'])
    })
    test('professional 限制正确', () => {
      const limits = TIER_LIMITS.professional
      expect(limits.maxCases).toBe(500)
      expect(limits.maxReports).toBe(200)
      expect(limits.maxExports).toBe(50)
      expect(limits.apiAccess).toBe(true)
      expect(limits.expertReview).toBe(false)
      expect(limits.fullKnowledgeBase).toBe(true)
      expect(limits.reportTemplates).toEqual(['basic', 'professional'])
    })
    test('enterprise 限制为 Infinity', () => {
      const limits = TIER_LIMITS.enterprise
      expect(limits.maxCases).toBe(Infinity)
      expect(limits.maxReports).toBe(Infinity)
      expect(limits.maxExports).toBe(Infinity)
      expect(limits.apiAccess).toBe(true)
      expect(limits.expertReview).toBe(true)
      expect(limits.fullKnowledgeBase).toBe(true)
      expect(limits.reportTemplates).toEqual(['basic', 'professional', 'enterprise', 'vip'])
    })
  })

  // ─────────────────────────────────────────────
  // 5. generateLicense
  // ─────────────────────────────────────────────
  describe('5. generateLicense', () => {
    test('生成 community 许可证', () => {
      const license = generateLicense('community', '测试用户', 30)
      expect(license.tier).toBe('community')
      expect(license.status).toBe('active')
      expect(license.licensee).toBe('测试用户')
      expect(license.licenseKey).toMatch(/^XF-community-/)
      expect(license.features).toContain('basic-report')
    })
    test('生成 professional 许可证', () => {
      const license = generateLicense('professional', '专业用户', 365)
      expect(license.tier).toBe('professional')
      expect(license.features).toContain('basic-report')
      expect(license.features).toContain('professional-report')
    })
    test('生成 enterprise 许可证', () => {
      const license = generateLicense('enterprise', '企业用户', 365)
      expect(license.tier).toBe('enterprise')
      expect(license.features).toContain('benchmark')
      expect(license.features).toContain('multi-language')
    })
    test('durationDays 正确计算过期时间', () => {
      const license = generateLicense('community', '用户', 7)
      const diffMs = license.expiresAt - license.issuedAt
      expect(diffMs).toBe(7 * 24 * 3600 * 1000)
    })
  })

  // ─────────────────────────────────────────────
  // 6. validateLicense
  // ─────────────────────────────────────────────
  describe('6. validateLicense', () => {
    test('active 许可证验证通过', () => {
      const license = generateLicense('professional', '用户', 365)
      const result = validateLicense(license.licenseKey)
      expect(result.valid).toBe(true)
      expect(result.status).toBe('active')
      expect(result.tier).toBe('professional')
    })
    test('trial 许可证验证通过', () => {
      const trialLicense = getLicenseByKey('XF-community-trial-000001')
      if (trialLicense) {
        const result = validateLicense(trialLicense.licenseKey)
        expect(result.valid).toBe(true)
        expect(result.status).toBe('trial')
      }
    })
    test('不存在的许可证返回无效', () => {
      const result = validateLicense('XF-NONEXISTENT-999999')
      expect(result.valid).toBe(false)
      expect(result.warnings).toContain('许可证不存在')
    })
    test('过期许可证验证失败', () => {
      vi.useFakeTimers()
      const license = generateLicense('community', '过期用户', 1)
      vi.advanceTimersByTime(2 * 24 * 3600 * 1000)
      const result = validateLicense(license.licenseKey)
      expect(result.valid).toBe(false)
      expect(result.status).toBe('expired')
      vi.useRealTimers()
    })
    test('吊销许可证验证失败', () => {
      const license = generateLicense('professional', '吊销用户', 365)
      revokeLicense(license.licenseKey)
      const result = validateLicense(license.licenseKey)
      expect(result.valid).toBe(false)
      expect(result.status).toBe('revoked')
      expect(result.warnings).toContain('许可证已被吊销')
    })
  })

  // ─────────────────────────────────────────────
  // 7. checkFeatureAccess
  // ─────────────────────────────────────────────
  describe('7. checkFeatureAccess', () => {
    test('community 可访问 basic-report', () => {
      const license = generateLicense('community', '用户', 365)
      const result = checkFeatureAccess('basic-report', license)
      expect(result.allowed).toBe(true)
    })
    test('community 不可访问 professional-report', () => {
      const license = generateLicense('community', '用户', 365)
      const result = checkFeatureAccess('professional-report', license)
      expect(result.allowed).toBe(false)
      expect(result.requiredTier).toBe('professional')
    })
    test('professional 可访问 api-access', () => {
      const license = generateLicense('professional', '用户', 365)
      const result = checkFeatureAccess('api-access', license)
      expect(result.allowed).toBe(true)
    })
    test('professional 不可访问 enterprise-report', () => {
      const license = generateLicense('professional', '用户', 365)
      const result = checkFeatureAccess('enterprise-report', license)
      expect(result.allowed).toBe(false)
    })
    test('enterprise 可访问所有功能', () => {
      const license = generateLicense('enterprise', '用户', 365)
      for (const f of LICENSE_FEATURES) {
        const result = checkFeatureAccess(f.featureId, license)
        expect(result.allowed).toBe(true)
      }
    })
    test('未定义的功能返回不允许', () => {
      const license = generateLicense('enterprise', '用户', 365)
      const result = checkFeatureAccess('nonexistent-feature', license)
      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('未定义')
    })
  })

  // ─────────────────────────────────────────────
  // 8. getFeaturePermissions
  // ─────────────────────────────────────────────
  describe('8. getFeaturePermissions', () => {
    test('community 只有 1 个功能', () => {
      const perms = getFeaturePermissions('community')
      expect(perms.length).toBe(1)
      expect(perms[0].featureId).toBe('basic-report')
    })
    test('professional 功能数多于 community', () => {
      const proPerms = getFeaturePermissions('professional')
      const commPerms = getFeaturePermissions('community')
      expect(proPerms.length).toBeGreaterThan(commPerms.length)
    })
    test('enterprise 功能数最多', () => {
      const entPerms = getFeaturePermissions('enterprise')
      const proPerms = getFeaturePermissions('professional')
      expect(entPerms.length).toBeGreaterThanOrEqual(proPerms.length)
    })
  })

  // ─────────────────────────────────────────────
  // 9. revokeLicense
  // ─────────────────────────────────────────────
  describe('9. revokeLicense', () => {
    test('成功吊销许可证', () => {
      const license = generateLicense('professional', '吊销用户', 365)
      const result = revokeLicense(license.licenseKey)
      expect(result).toBe(true)
      const validation = validateLicense(license.licenseKey)
      expect(validation.status).toBe('revoked')
    })
    test('吊销不存在的许可证返回 false', () => {
      const result = revokeLicense('NONEXISTENT-KEY')
      expect(result).toBe(false)
    })
  })

  // ─────────────────────────────────────────────
  // 10. upgradeLicense
  // ─────────────────────────────────────────────
  describe('10. upgradeLicense', () => {
    test('community 升级到 professional', () => {
      const license = generateLicense('community', '升级用户', 365)
      const upgraded = upgradeLicense(license.licenseKey, 'professional')
      expect(upgraded).not.toBeNull()
      expect(upgraded!.tier).toBe('professional')
      expect(upgraded!.features).toContain('professional-report')
    })
    test('professional 升级到 enterprise', () => {
      const license = generateLicense('professional', '升级用户', 365)
      const upgraded = upgradeLicense(license.licenseKey, 'enterprise')
      expect(upgraded).not.toBeNull()
      expect(upgraded!.tier).toBe('enterprise')
      expect(upgraded!.features).toContain('benchmark')
    })
    test('降级返回 null', () => {
      const license = generateLicense('enterprise', '降级用户', 365)
      const result = upgradeLicense(license.licenseKey, 'professional')
      expect(result).toBeNull()
    })
    test('同级升级返回 null', () => {
      const license = generateLicense('professional', '同级用户', 365)
      const result = upgradeLicense(license.licenseKey, 'professional')
      expect(result).toBeNull()
    })
    test('不存在的许可证升级返回 null', () => {
      const result = upgradeLicense('NONEXISTENT', 'enterprise')
      expect(result).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 11. enforceLicenseGate
  // ─────────────────────────────────────────────
  describe('11. enforceLicenseGate', () => {
    test('community 通过 non-gate 功能', () => {
      const license = generateLicense('community', '用户', 365)
      // basic-report is not a gate
      expect(() => enforceLicenseGate('basic-report', license)).not.toThrow()
    })
    test('community 被 gate 功能拒绝并抛错', () => {
      const license = generateLicense('community', '用户', 365)
      expect(() => enforceLicenseGate('professional-report', license)).toThrow('许可证门禁拒绝')
    })
    test('professional 通过 professional-report 门禁', () => {
      const license = generateLicense('professional', '用户', 365)
      expect(() => enforceLicenseGate('professional-report', license)).not.toThrow()
    })
    test('professional 被 enterprise 门禁拒绝', () => {
      const license = generateLicense('professional', '用户', 365)
      expect(() => enforceLicenseGate('enterprise-report', license)).toThrow('许可证门禁拒绝')
    })
    test('enterprise 通过所有门禁', () => {
      const license = generateLicense('enterprise', '用户', 365)
      for (const f of LICENSE_FEATURES) {
        if (f.isGate) {
          expect(() => enforceLicenseGate(f.featureId, license)).not.toThrow()
        }
      }
    })
  })

  // ─────────────────────────────────────────────
  // 12. getLicenseByKey / getAllLicenses
  // ─────────────────────────────────────────────
  describe('12. getLicenseByKey / getAllLicenses', () => {
    test('种子许可证存在 3 个', () => {
      const all = getAllLicenses()
      expect(all.length).toBeGreaterThanOrEqual(3)
    })
    test('通过 key 获取种子许可证', () => {
      const license = getLicenseByKey('XF-community-trial-000001')
      expect(license).toBeDefined()
      expect(license!.tier).toBe('community')
      expect(license!.status).toBe('trial')
    })
    test('不存在的 key 返回 undefined', () => {
      const license = getLicenseByKey('NONEXISTENT')
      expect(license).toBeUndefined()
    })
  })

  // ─────────────────────────────────────────────
  // 13. getTierLimits
  // ─────────────────────────────────────────────
  describe('13. getTierLimits', () => {
    test('获取各层级限制', () => {
      const tiers: LicenseTier[] = ['community', 'professional', 'enterprise']
      for (const tier of tiers) {
        const limits = getTierLimits(tier)
        expect(limits.maxCases).toBeGreaterThan(0)
        expect(limits.maxReports).toBeGreaterThan(0)
        expect(typeof limits.apiAccess).toBe('boolean')
        expect(Array.isArray(limits.reportTemplates)).toBe(true)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 14. registerCustomFeatures
  // ─────────────────────────────────────────────
  describe('14. registerCustomFeatures', () => {
    test('注册自定义功能后可被 checkFeatureAccess 识别', () => {
      const customFeature: FeaturePermission = {
        featureId: 'custom-ai-analysis',
        name: 'AI 分析',
        description: 'AI 智能分析功能',
        requiredTier: 'professional',
        isGate: false,
      }
      registerCustomFeatures([customFeature])

      const proLicense = generateLicense('professional', '自定义用户', 365)
      const result = checkFeatureAccess('custom-ai-analysis', proLicense)
      expect(result.allowed).toBe(true)
    })
    test('自定义功能对 community 不可用', () => {
      const customFeature: FeaturePermission = {
        featureId: 'custom-premium',
        name: '高级功能',
        description: '仅限专业版',
        requiredTier: 'professional',
        isGate: true,
      }
      registerCustomFeatures([customFeature])

      const commLicense = generateLicense('community', '社区用户', 365)
      expect(() => enforceLicenseGate('custom-premium', commLicense)).toThrow()
    })
  })

  // ─────────────────────────────────────────────
  // 15. resetLicenseStore
  // ─────────────────────────────────────────────
  describe('15. resetLicenseStore', () => {
    test('重置后恢复种子数据', () => {
      // 先生成额外许可证
      generateLicense('enterprise', '额外企业', 365)
      generateLicense('professional', '额外专业', 365)
      const before = getAllLicenses()
      expect(before.length).toBeGreaterThan(3)

      resetLicenseStore()
      const after = getAllLicenses()
      expect(after.length).toBe(3)
    })
  })
})
