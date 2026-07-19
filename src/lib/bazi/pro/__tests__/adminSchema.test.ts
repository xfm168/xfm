/**
 * V5.0 GA P1: Admin Dashboard Schema 测试
 *
 * 覆盖：validate 函数、checkPermission、hasMinimumRole、
 *       generateSchemaDefinition、getModulePermissions、validateAllSchemas、常量
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  validateAdminUser,
  validateAdminOrder,
  validateAdminReport,
  validateAdminCase,
  validateApiKey,
  checkPermission,
  hasMinimumRole,
  generateSchemaDefinition,
  getModulePermissions,
  validateAllSchemas,
  ADMIN_SCHEMA_ENGINE_VERSION,
} from '../adminSchemaEngine'

import {
  ADMIN_SCHEMA_VERSION,
  ADMIN_MODULES,
  ROLE_HIERARCHY,
} from '../adminSchemaTypes'

import type {
  AdminUser,
  AdminOrder,
  AdminReport,
  AdminCase,
  AdminApiKey,
} from '../adminSchemaTypes'

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('V5.0 GA P1: Admin Schema', () => {

  // ─────────────────────────────────────────────
  // 1. 版本号
  // ─────────────────────────────────────────────
  describe('1. 版本号', () => {
    test('ADMIN_SCHEMA_ENGINE_VERSION 应为 1.0.0', () => {
      expect(ADMIN_SCHEMA_ENGINE_VERSION).toBe('1.0.0')
    })
    test('ADMIN_SCHEMA_VERSION 应为 1.0.0', () => {
      expect(ADMIN_SCHEMA_VERSION).toBe('1.0.0')
    })
  })

  // ─────────────────────────────────────────────
  // 2. 常量
  // ─────────────────────────────────────────────
  describe('2. 常量', () => {
    test('ADMIN_MODULES 应有 8 个模块', () => {
      expect(ADMIN_MODULES).toHaveLength(8)
    })
    test('ADMIN_MODULES 包含 user/order/report/case/knowledge/expert/stats/system', () => {
      const names = ADMIN_MODULES.map(m => m.module)
      expect(names).toEqual([
        'user', 'order', 'report', 'case',
        'knowledge', 'expert', 'stats', 'system',
      ])
    })
    test('ROLE_HIERARCHY 应有 4 级', () => {
      expect(ROLE_HIERARCHY).toHaveLength(4)
    })
    test('ROLE_HIERARCHY 顺序为 viewer < operator < admin < super_admin', () => {
      expect(ROLE_HIERARCHY).toEqual(['viewer', 'operator', 'admin', 'super_admin'])
    })
    test('每个模块至少有 1 个权限', () => {
      for (const mod of ADMIN_MODULES) {
        expect(mod.permissions.length).toBeGreaterThanOrEqual(1)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 3. validateAdminUser
  // ─────────────────────────────────────────────
  describe('3. validateAdminUser', () => {
    test('空数据应返回空错误数组', () => {
      expect(validateAdminUser({})).toEqual([])
    })
    test('完整有效数据应通过验证', () => {
      const now = Date.now()
      const data: Partial<AdminUser> = {
        id: 'u1', username: 'admin', email: 'a@b.com', phone: '13800138000',
        role: 'admin', licenseTier: 'professional', status: 'active',
        createdAt: now, lastLoginAt: null, totalReports: 0, totalPayments: 0,
      }
      expect(validateAdminUser(data)).toEqual([])
    })
    test('id 为空字符串应报错', () => {
      const errors = validateAdminUser({ id: '' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('id')
    })
    test('id 为数字应报错', () => {
      const errors = validateAdminUser({ id: 123 as unknown as string })
      expect(errors.length).toBeGreaterThanOrEqual(1)
    })
    test('无效 role 应报错', () => {
      const errors = validateAdminUser({ role: 'invalid_role' as unknown as 'admin' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('role')
    })
    test('无效 licenseTier 应报错', () => {
      const errors = validateAdminUser({ licenseTier: 'free' as unknown as 'community' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('licenseTier')
    })
    test('无效 status 应报错', () => {
      const errors = validateAdminUser({ status: 'unknown' as unknown as 'active' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('status')
    })
    test('负数 totalReports 应报错', () => {
      const errors = validateAdminUser({ totalReports: -1 })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('totalReports')
    })
  })

  // ─────────────────────────────────────────────
  // 4. validateAdminOrder
  // ─────────────────────────────────────────────
  describe('4. validateAdminOrder', () => {
    test('空数据应返回空错误数组', () => {
      expect(validateAdminOrder({})).toEqual([])
    })
    test('完整有效数据应通过验证', () => {
      const now = Date.now()
      const data: Partial<AdminOrder> = {
        id: 'o1', userId: 'u1', reportId: 'r1', amount: 99.9, currency: 'CNY',
        paymentMethod: 'wechat', paymentStatus: 'paid', productId: 'report_pro',
        createdAt: now, paidAt: now, refundedAt: null,
      }
      expect(validateAdminOrder(data)).toEqual([])
    })
    test('无效 paymentMethod 应报错', () => {
      const errors = validateAdminOrder({ paymentMethod: 'paypal' as unknown as 'wechat' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('paymentMethod')
    })
    test('无效 paymentStatus 应报错', () => {
      const errors = validateAdminOrder({ paymentStatus: 'unknown' as unknown as 'paid' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('paymentStatus')
    })
    test('负数 amount 应报错', () => {
      const errors = validateAdminOrder({ amount: -10 })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('amount')
    })
    test('paidAt 为非数字非 null 应报错', () => {
      const errors = validateAdminOrder({ paidAt: 'bad' as unknown as number })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('paidAt')
    })
  })

  // ─────────────────────────────────────────────
  // 5. validateAdminReport
  // ─────────────────────────────────────────────
  describe('5. validateAdminReport', () => {
    test('空数据应返回空错误数组', () => {
      expect(validateAdminReport({})).toEqual([])
    })
    test('完整有效数据应通过验证', () => {
      const now = Date.now()
      const data: Partial<AdminReport> = {
        id: 'r1', userId: 'u1', orderId: 'o1', title: '八字报告', template: 'pro',
        status: 'completed', language: 'zh', qualityScore: 85, trustScore: 90,
        createdAt: now, sharedCount: 0, downloadedCount: 0,
      }
      expect(validateAdminReport(data)).toEqual([])
    })
    test('无效 status 应报错', () => {
      const errors = validateAdminReport({ status: 'unknown' as unknown as 'completed' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('status')
    })
    test('orderId 允许 null', () => {
      const errors = validateAdminReport({ orderId: null })
      expect(errors).toEqual([])
    })
    test('负数 qualityScore 应报错', () => {
      const errors = validateAdminReport({ qualityScore: -1 })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('qualityScore')
    })
  })

  // ─────────────────────────────────────────────
  // 6. validateAdminCase
  // ─────────────────────────────────────────────
  describe('6. validateAdminCase', () => {
    test('空数据应返回空错误数组', () => {
      expect(validateAdminCase({})).toEqual([])
    })
    test('完整有效数据应通过验证', () => {
      const now = Date.now()
      const data: Partial<AdminCase> = {
        id: 'c1', caseId: 'case-001', title: '经典案例', category: 'career',
        source: 'classical', qualityScore: 88, reliabilityScore: 92,
        reviewStatus: 'approved', contributor: null, createdAt: now,
      }
      expect(validateAdminCase(data)).toEqual([])
    })
    test('无效 reviewStatus 应报错', () => {
      const errors = validateAdminCase({ reviewStatus: 'invalid' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('reviewStatus')
    })
    test('空 title 应报错', () => {
      const errors = validateAdminCase({ title: '' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('title')
    })
    test('contributor 允许 null', () => {
      const errors = validateAdminCase({ contributor: null })
      expect(errors).toEqual([])
    })
  })

  // ─────────────────────────────────────────────
  // 7. validateApiKey
  // ─────────────────────────────────────────────
  describe('7. validateApiKey', () => {
    test('空数据应返回空错误数组', () => {
      expect(validateApiKey({})).toEqual([])
    })
    test('完整有效数据应通过验证', () => {
      const now = Date.now()
      const data: Partial<AdminApiKey> = {
        id: 'k1', key: 'sk-test-key', name: '测试Key', userId: 'u1',
        permissions: ['user:read'], rateLimit: 60, totalCalls: 0,
        lastUsedAt: null, expiresAt: now + 86400000, status: 'active', createdAt: now,
      }
      expect(validateApiKey(data)).toEqual([])
    })
    test('permissions 为非数组应报错', () => {
      const errors = validateApiKey({ permissions: 'invalid' as unknown as string[] })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('permissions')
    })
    test('permissions 中包含非字符串应报错', () => {
      const errors = validateApiKey({ permissions: [123 as unknown as string] })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('permissions')
    })
    test('无效 status 应报错', () => {
      const errors = validateApiKey({ status: 'banned' as unknown as 'active' })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('status')
    })
    test('负数 rateLimit 应报错', () => {
      const errors = validateApiKey({ rateLimit: -1 })
      expect(errors).toHaveLength(1)
      expect(errors[0].field).toBe('rateLimit')
    })
  })

  // ─────────────────────────────────────────────
  // 8. checkPermission
  // ─────────────────────────────────────────────
  describe('8. checkPermission', () => {
    test('无效角色应返回 false', () => {
      expect(checkPermission('unknown_role', 'user', 'read')).toBe(false)
    })
    test('viewer 可以 read', () => {
      expect(checkPermission('viewer', 'user', 'read')).toBe(true)
    })
    test('viewer 不能 create', () => {
      expect(checkPermission('viewer', 'user', 'create')).toBe(false)
    })
    test('viewer 不能 update', () => {
      expect(checkPermission('viewer', 'report', 'update')).toBe(false)
    })
    test('operator 可以 create', () => {
      expect(checkPermission('operator', 'case', 'create')).toBe(true)
    })
    test('operator 可以 delete', () => {
      expect(checkPermission('operator', 'report', 'delete')).toBe(true)
    })
    test('operator 可以 export', () => {
      expect(checkPermission('operator', 'report', 'export')).toBe(true)
    })
    test('operator 不能 approve', () => {
      expect(checkPermission('operator', 'expert', 'approve')).toBe(false)
    })
    test('admin 可以 approve', () => {
      expect(checkPermission('admin', 'expert', 'approve')).toBe(true)
    })
    test('admin 可以 reject', () => {
      expect(checkPermission('admin', 'expert', 'reject')).toBe(true)
    })
    test('super_admin 所有操作返回 true', () => {
      const actions = ['create', 'read', 'update', 'delete', 'export', 'approve', 'reject']
      for (const action of actions) {
        expect(checkPermission('super_admin', 'user', action)).toBe(true)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 9. hasMinimumRole
  // ─────────────────────────────────────────────
  describe('9. hasMinimumRole', () => {
    test('super_admin >= viewer 应为 true', () => {
      expect(hasMinimumRole('super_admin', 'viewer')).toBe(true)
    })
    test('admin >= admin 应为 true', () => {
      expect(hasMinimumRole('admin', 'admin')).toBe(true)
    })
    test('viewer >= admin 应为 false', () => {
      expect(hasMinimumRole('viewer', 'admin')).toBe(false)
    })
    test('operator >= viewer 应为 true', () => {
      expect(hasMinimumRole('operator', 'viewer')).toBe(true)
    })
    test('invalid 角色 >= viewer 应为 false', () => {
      expect(hasMinimumRole('invalid', 'viewer')).toBe(false)
    })
    test('admin >= invalid 应为 false', () => {
      expect(hasMinimumRole('admin', 'invalid')).toBe(false)
    })
  })

  // ─────────────────────────────────────────────
  // 10. generateSchemaDefinition
  // ─────────────────────────────────────────────
  describe('10. generateSchemaDefinition', () => {
    test('应返回 11 个模块定义', () => {
      const schema = generateSchemaDefinition()
      expect(Object.keys(schema)).toHaveLength(11)
    })
    test('每个模块包含 fields 和 required', () => {
      const schema = generateSchemaDefinition()
      for (const key of Object.keys(schema)) {
        expect(schema[key]).toHaveProperty('fields')
        expect(schema[key]).toHaveProperty('required')
        expect(Array.isArray(schema[key].fields)).toBe(true)
        expect(Array.isArray(schema[key].required)).toBe(true)
      }
    })
    test('required 应为 fields 的子集', () => {
      const schema = generateSchemaDefinition()
      for (const key of Object.keys(schema)) {
        const def = schema[key]
        for (const req of def.required) {
          expect(def.fields).toContain(req)
        }
      }
    })
    test('AdminUser 定义应包含 id 和 username', () => {
      const schema = generateSchemaDefinition()
      expect(schema['AdminUser'].fields).toContain('id')
      expect(schema['AdminUser'].fields).toContain('username')
    })
  })

  // ─────────────────────────────────────────────
  // 11. getModulePermissions
  // ─────────────────────────────────────────────
  describe('11. getModulePermissions', () => {
    test('user 模块应返回 4 个权限', () => {
      const perms = getModulePermissions('user')
      expect(perms).toHaveLength(4)
    })
    test('user 模块包含 user:read', () => {
      const perms = getModulePermissions('user')
      expect(perms).toContain('user:read')
    })
    test('不存在的模块应返回空数组', () => {
      expect(getModulePermissions('nonexistent')).toEqual([])
    })
    test('stats 模块应返回 2 个权限', () => {
      const perms = getModulePermissions('stats')
      expect(perms).toHaveLength(2)
    })
    test('返回的是副本而非原数组引用', () => {
      const perms1 = getModulePermissions('user')
      const perms2 = getModulePermissions('user')
      expect(perms1).not.toBe(perms2)
    })
  })

  // ─────────────────────────────────────────────
  // 12. validateAllSchemas
  // ─────────────────────────────────────────────
  describe('12. validateAllSchemas', () => {
    test('应返回 5 个模块验证结果', () => {
      const result = validateAllSchemas()
      expect(Object.keys(result)).toHaveLength(5)
    })
    test('所有模块应 valid 为 true', () => {
      const result = validateAllSchemas()
      for (const key of Object.keys(result)) {
        expect(result[key].valid).toBe(true)
      }
    })
    test('每个模块 errors 应为空数组', () => {
      const result = validateAllSchemas()
      for (const key of Object.keys(result)) {
        expect(result[key].errors).toEqual([])
      }
    })
    test('包含 AdminUser 和 AdminOrder', () => {
      const result = validateAllSchemas()
      expect(result).toHaveProperty('AdminUser')
      expect(result).toHaveProperty('AdminOrder')
    })
  })
})
