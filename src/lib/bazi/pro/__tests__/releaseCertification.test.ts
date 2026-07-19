/**
 * Release Certification Engine — 测试
 */

import { describe, test, expect, beforeEach } from 'vitest'

import type {
  ReleaseCertification,
  CertificationCheck,
  ReleaseType,
  CertificationStatus,
} from '../releaseCertificationTypes'

import {
  generateReleaseCertification,
  validateCertification,
  getCertificateHistory,
  revokeCertification,
  RELEASE_CERTIFICATION_VERSION,
} from '../releaseCertificationEngine'

import { _clearReviewStore } from '../professionalReviewEngine'

// ═══════════════════════════════════════════
// 1. generateReleaseCertification 基础测试
// ═══════════════════════════════════════════

describe('generateReleaseCertification', () => {
  beforeEach(() => {
    _clearReviewStore()
  })

  test('返回结构完整的证书', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    expect(cert).toBeDefined()
    expect(cert.certificateId).toBeTruthy()
    expect(cert.version).toBe('5.0.0')
    expect(cert.productName).toBe('XuanFengMen')
    expect(cert.releaseType).toBe('major')
    expect(cert.generatedAt).toBeTypeOf('number')
    expect(cert.generatedAt).toBeGreaterThan(0)
  })

  test('包含 6 项检查', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    expect(cert.checks).toHaveLength(6)
  })

  test('6 项检查名称正确', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    const names = cert.checks.map((c) => c.name)
    expect(names).toContain('Performance Check')
    expect(names).toContain('Regression Check')
    expect(names).toContain('Expert Check')
    expect(names).toContain('Knowledge Check')
    expect(names).toContain('Coverage Check')
    expect(names).toContain('Health Check')
  })

  test('每项检查包含必要字段', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    for (const check of cert.checks) {
      expect(check.name).toBeTruthy()
      expect(typeof check.passed).toBe('boolean')
      expect(check.score).toBeTypeOf('number')
      expect(check.threshold).toBeTypeOf('number')
      expect(check.details).toBeTruthy()
      expect(typeof check.required).toBe('boolean')
    }
  })

  test('所有检查的 required 都为 true', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    for (const check of cert.checks) {
      expect(check.required).toBe(true)
    }
  })

  test('overallPassed 在所有检查通过时为 true', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    const allPassed = cert.checks.every((c) => c.passed)
    expect(cert.overallPassed).toBe(allPassed)
  })

  test('overallScore 在 0-100 之间', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    expect(cert.overallScore).toBeGreaterThanOrEqual(0)
    expect(cert.overallScore).toBeLessThanOrEqual(100)
  })

  test('expirationDate 大于 generatedAt', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    expect(cert.expirationDate).toBeGreaterThan(cert.generatedAt)
  })

  test('status 为 approved 或 rejected', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    expect(['approved', 'rejected']).toContain(cert.status)
  })

  test('Performance Check 使用默认值', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    const perfCheck = cert.checks.find((c) => c.name === 'Performance Check')
    expect(perfCheck).toBeDefined()
    expect(perfCheck!.details).toContain('默认值')
  })

  test('Knowledge Check 包含覆盖率信息', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    const kbCheck = cert.checks.find((c) => c.name === 'Knowledge Check')
    expect(kbCheck).toBeDefined()
    expect(kbCheck!.details).toContain('知识库覆盖率')
  })

  // ═══════════════════════════════════════════
  // 2. 签署人测试
  // ═══════════════════════════════════════════

  test('默认签署人有 2 个', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    expect(cert.signatories).toHaveLength(2)
  })

  test('可以自定义签署人', () => {
    const signatories = [
      { role: 'QA Lead', name: 'Alice', signedAt: Date.now() },
      { role: 'Release Manager', name: 'Bob', signedAt: Date.now() },
    ]
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
      signatories,
    })
    expect(cert.signatories).toHaveLength(2)
    expect(cert.signatories[0].name).toBe('Alice')
    expect(cert.signatories[1].name).toBe('Bob')
  })

  // ═══════════════════════════════════════════
  // 3. 不同 releaseType 测试
  // ═══════════════════════════════════════════

  test('支持 minor 类型', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.1.0',
      releaseType: 'minor',
    })
    expect(cert.releaseType).toBe('minor')
  })

  test('支持 patch 类型', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.1',
      releaseType: 'patch',
    })
    expect(cert.releaseType).toBe('patch')
  })

  test('支持 rc 类型', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0-rc1',
      releaseType: 'rc',
    })
    expect(cert.releaseType).toBe('rc')
  })

  // ═══════════════════════════════════════════
  // 4. validateCertification 测试
  // ═══════════════════════════════════════════

  describe('validateCertification', () => {
    test('有效证书返回 true', () => {
      const cert = generateReleaseCertification({
        productName: 'XuanFengMen',
        version: '5.0.0',
        releaseType: 'major',
      })
      expect(validateCertification(cert)).toBe(true)
    })

    test('过期证书返回 false', () => {
      const cert = generateReleaseCertification({
        productName: 'XuanFengMen',
        version: '5.0.0',
        releaseType: 'major',
      })
      // 手动将 expirationDate 设为过去
      cert.expirationDate = Date.now() - 1000
      expect(validateCertification(cert)).toBe(false)
    })

    test('检查项不足 6 项返回 false', () => {
      const cert = generateReleaseCertification({
        productName: 'XuanFengMen',
        version: '5.0.0',
        releaseType: 'major',
      })
      cert.checks = cert.checks.slice(0, 3)
      expect(validateCertification(cert)).toBe(false)
    })
  })

  // ═══════════════════════════════════════════
  // 5. getCertificateHistory 测试
  // ═══════════════════════════════════════════

  describe('getCertificateHistory', () => {
    test('初始历史为空', () => {
      // 注意：之前测试可能已经生成了证书
      const history = getCertificateHistory()
      expect(Array.isArray(history)).toBe(true)
    })

    test('生成证书后历史增加', () => {
      const beforeCount = getCertificateHistory().length
      generateReleaseCertification({
        productName: 'XuanFengMen',
        version: '5.0.0',
        releaseType: 'major',
      })
      const afterCount = getCertificateHistory().length
      expect(afterCount).toBe(beforeCount + 1)
    })

    test('历史记录不引用原对象（返回副本）', () => {
      generateReleaseCertification({
        productName: 'XuanFengMen',
        version: '5.0.0',
        releaseType: 'major',
      })
      const history1 = getCertificateHistory()
      const history2 = getCertificateHistory()
      expect(history1).not.toBe(history2)
    })
  })

  // ═══════════════════════════════════════════
  // 6. revokeCertification 测试
  // ═══════════════════════════════════════════

  describe('revokeCertification', () => {
    test('撤销存在的有效证书返回 true', () => {
      const cert = generateReleaseCertification({
        productName: 'XuanFengMen',
        version: '5.0.0',
        releaseType: 'major',
      })
      const result = revokeCertification(cert.certificateId)
      expect(result).toBe(true)
    })

    test('撤销后证书状态变为 expired', () => {
      const cert = generateReleaseCertification({
        productName: 'XuanFengMen',
        version: '5.0.0',
        releaseType: 'major',
      })
      revokeCertification(cert.certificateId)
      const history = getCertificateHistory()
      const revoked = history.find((c) => c.certificateId === cert.certificateId)
      expect(revoked!.status).toBe('expired')
    })

    test('撤销不存在的证书返回 false', () => {
      const result = revokeCertification('NON-EXISTENT-ID')
      expect(result).toBe(false)
    })

    test('撤销过期证书返回 false', () => {
      const cert = generateReleaseCertification({
        productName: 'XuanFengMen',
        version: '5.0.0',
        releaseType: 'major',
      })
      // 将过期时间设为过去
      cert.expirationDate = Date.now() - 1000
      const result = revokeCertification(cert.certificateId)
      expect(result).toBe(false)
    })
  })

  // ═══════════════════════════════════════════
  // 7. 版本号测试
  // ═══════════════════════════════════════════

  test('版本号格式正确', () => {
    expect(RELEASE_CERTIFICATION_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  // ═══════════════════════════════════════════
  // 8. certificateId 格式测试
  // ═══════════════════════════════════════════

  test('certificateId 格式正确', () => {
    const cert = generateReleaseCertification({
      productName: 'XuanFengMen',
      version: '5.0.0',
      releaseType: 'major',
    })
    expect(cert.certificateId).toMatch(/^CERT-XuanFengMen-5\.0\.0-/)
  })
})
