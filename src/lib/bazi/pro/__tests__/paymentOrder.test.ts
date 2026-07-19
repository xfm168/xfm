/**
 * Phase 6 Batch 2 Module 2: Payment Order 测试
 *
 * 覆盖：订单创建、支付、退款、取消、过期、查询、统计
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  createOrder,
  payOrder,
  refundOrder,
  cancelOrder,
  expireOrder,
  getOrderById,
  getOrdersByUserId,
  getOrdersByStatus,
  getOrdersByDateRange,
  getPaymentStats,
  getAllOrders,
  resetOrderStore,
  PAYMENT_ORDER_ENGINE_VERSION,
} from '../paymentOrderEngine'

import {
  PAYMENT_ORDER_VERSION,
  PAYMENT_METHODS,
  ORDER_EXPIRY_MINUTES,
} from '../paymentOrderTypes'

import type {
  PaymentMethod,
  OrderStatus,
  OrderType,
  PaymentOrder,
} from '../paymentOrderTypes'

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('Phase 6 Batch 2 Module 2: Payment Order', () => {

  beforeEach(() => {
    resetOrderStore()
  })

  // ─────────────────────────────────────────────
  // 1. 版本号
  // ─────────────────────────────────────────────
  describe('1. 版本号', () => {
    test('PAYMENT_ORDER_ENGINE_VERSION 应为 1.0.0', () => {
      expect(PAYMENT_ORDER_ENGINE_VERSION).toBe('1.0.0')
    })
    test('PAYMENT_ORDER_VERSION 应为 1.0.0', () => {
      expect(PAYMENT_ORDER_VERSION).toBe('1.0.0')
    })
  })

  // ─────────────────────────────────────────────
  // 2. PAYMENT_METHODS 常量
  // ─────────────────────────────────────────────
  describe('2. PAYMENT_METHODS 常量', () => {
    test('包含 4 种支付方式', () => {
      expect(PAYMENT_METHODS.length).toBe(4)
      expect(PAYMENT_METHODS).toEqual(['wechat', 'alipay', 'stripe', 'apple_pay'])
    })
    test('每种支付方式为有效字符串', () => {
      for (const m of PAYMENT_METHODS) {
        expect(typeof m).toBe('string')
        expect(m.length).toBeGreaterThan(0)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 3. ORDER_EXPIRY_MINUTES
  // ─────────────────────────────────────────────
  describe('3. ORDER_EXPIRY_MINUTES', () => {
    test('过期时间为 30 分钟', () => {
      expect(ORDER_EXPIRY_MINUTES).toBe(30)
    })
  })

  // ─────────────────────────────────────────────
  // 4. createOrder
  // ─────────────────────────────────────────────
  describe('4. createOrder', () => {
    test('创建订单自动填充 id/status/createdAt 等', () => {
      const order = createOrder({
        userId: 'user-test',
        orderType: 'subscription',
        productId: 'PRO-MONTHLY',
        productName: '专业版月订阅',
        amount: 29.9,
        currency: 'CNY',
        paymentMethod: 'wechat',
        metadata: {},
      })
      expect(order.id).toMatch(/^ORD-/)
      expect(order.status).toBe('pending')
      expect(order.createdAt).toBeGreaterThan(0)
      expect(order.paidAt).toBeNull()
      expect(order.refundedAt).toBeNull()
      expect(order.transactionId).toBeNull()
    })
    test('expiresAt 为当前时间 + 30 分钟', () => {
      const order = createOrder({
        userId: 'user-test2',
        orderType: 'single_report',
        productId: 'RPT-001',
        productName: '测试报告',
        amount: 19.9,
        currency: 'CNY',
        paymentMethod: 'alipay',
        metadata: {},
      })
      const diffMs = order.expiresAt - order.createdAt
      expect(diffMs).toBe(ORDER_EXPIRY_MINUTES * 60 * 1000)
    })
  })

  // ─────────────────────────────────────────────
  // 5. payOrder
  // ─────────────────────────────────────────────
  describe('5. payOrder', () => {
    test('支付 pending 订单成功', () => {
      const order = createOrder({
        userId: 'user-pay',
        orderType: 'subscription',
        productId: 'PRO-MONTHLY',
        productName: '专业版月订阅',
        amount: 29.9,
        currency: 'CNY',
        paymentMethod: 'wechat',
        metadata: {},
      })
      const result = payOrder(order.id, 'WX-TXN-TEST')
      expect(result).not.toBeNull()
      expect(result!.status).toBe('paid')
      expect(result!.transactionId).toBe('WX-TXN-TEST')
      expect(result!.paidAt).not.toBeNull()
    })
    test('支付不存在的订单返回 null', () => {
      const result = payOrder('NONEXISTENT', 'TXN-001')
      expect(result).toBeNull()
    })
    test('支付非 pending 状态订单返回 null', () => {
      const order = createOrder({
        userId: 'user-pay2',
        orderType: 'subscription',
        productId: 'PRO-MONTHLY',
        productName: '专业版月订阅',
        amount: 29.9,
        currency: 'CNY',
        paymentMethod: 'wechat',
        metadata: {},
      })
      cancelOrder(order.id)
      const result = payOrder(order.id, 'TXN-002')
      expect(result).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 6. refundOrder
  // ─────────────────────────────────────────────
  describe('6. refundOrder', () => {
    test('对 paid 订单退款成功', () => {
      const order = createOrder({
        userId: 'user-refund',
        orderType: 'single_report',
        productId: 'RPT-001',
        productName: '测试报告',
        amount: 49.9,
        currency: 'CNY',
        paymentMethod: 'alipay',
        metadata: {},
      })
      payOrder(order.id, 'ALI-TXN-001')
      const result = refundOrder(order.id)
      expect(result).not.toBeNull()
      expect(result!.status).toBe('refunded')
      expect(result!.refundedAt).not.toBeNull()
    })
    test('对 pending 订单退款返回 null', () => {
      const order = createOrder({
        userId: 'user-refund2',
        orderType: 'single_report',
        productId: 'RPT-002',
        productName: '测试报告',
        amount: 19.9,
        currency: 'CNY',
        paymentMethod: 'wechat',
        metadata: {},
      })
      const result = refundOrder(order.id)
      expect(result).toBeNull()
    })
    test('对不存在的订单退款返回 null', () => {
      const result = refundOrder('NONEXISTENT')
      expect(result).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 7. cancelOrder
  // ─────────────────────────────────────────────
  describe('7. cancelOrder', () => {
    test('取消 pending 订单成功', () => {
      const order = createOrder({
        userId: 'user-cancel',
        orderType: 'subscription',
        productId: 'PRO-YEARLY',
        productName: '专业版年订阅',
        amount: 299,
        currency: 'CNY',
        paymentMethod: 'stripe',
        metadata: {},
      })
      const result = cancelOrder(order.id)
      expect(result).not.toBeNull()
      expect(result!.status).toBe('cancelled')
    })
    test('取消已支付订单返回 null', () => {
      const order = createOrder({
        userId: 'user-cancel2',
        orderType: 'single_report',
        productId: 'RPT-003',
        productName: '测试报告',
        amount: 29.9,
        currency: 'CNY',
        paymentMethod: 'wechat',
        metadata: {},
      })
      payOrder(order.id, 'TXN-CANCEL')
      const result = cancelOrder(order.id)
      expect(result).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 8. expireOrder
  // ─────────────────────────────────────────────
  describe('8. expireOrder', () => {
    test('过期 pending 订单成功', () => {
      const order = createOrder({
        userId: 'user-expire',
        orderType: 'subscription',
        productId: 'PRO-MONTHLY',
        productName: '专业版月订阅',
        amount: 29.9,
        currency: 'CNY',
        paymentMethod: 'wechat',
        metadata: {},
      })
      const result = expireOrder(order.id)
      expect(result).not.toBeNull()
      expect(result!.status).toBe('expired')
    })
    test('过期已支付订单返回 null', () => {
      const order = createOrder({
        userId: 'user-expire2',
        orderType: 'single_report',
        productId: 'RPT-004',
        productName: '测试报告',
        amount: 19.9,
        currency: 'CNY',
        paymentMethod: 'alipay',
        metadata: {},
      })
      payOrder(order.id, 'TXN-EXP')
      const result = expireOrder(order.id)
      expect(result).toBeNull()
    })
  })

  // ─────────────────────────────────────────────
  // 9. getOrderById
  // ─────────────────────────────────────────────
  describe('9. getOrderById', () => {
    test('获取种子订单', () => {
      const order = getOrderById('ORD-SEED-0001')
      expect(order).toBeDefined()
      expect(order!.userId).toBe('user-001')
      expect(order!.status).toBe('paid')
    })
    test('不存在的 ID 返回 undefined', () => {
      const order = getOrderById('NONEXISTENT')
      expect(order).toBeUndefined()
    })
  })

  // ─────────────────────────────────────────────
  // 10. getOrdersByUserId
  // ─────────────────────────────────────────────
  describe('10. getOrdersByUserId', () => {
    test('获取种子中 user-001 的订单', () => {
      const orders = getOrdersByUserId('user-001')
      expect(orders.length).toBeGreaterThanOrEqual(1)
      expect(orders[0].userId).toBe('user-001')
    })
    test('无订单的用户返回空数组', () => {
      const orders = getOrdersByUserId('user-no-orders')
      expect(orders).toEqual([])
    })
  })

  // ─────────────────────────────────────────────
  // 11. getOrdersByStatus
  // ─────────────────────────────────────────────
  describe('11. getOrdersByStatus', () => {
    test('获取 paid 状态的订单', () => {
      const orders = getOrdersByStatus('paid')
      expect(orders.length).toBeGreaterThanOrEqual(1)
      for (const o of orders) {
        expect(o.status).toBe('paid')
      }
    })
    test('获取 cancelled 状态的订单', () => {
      const orders = getOrdersByStatus('cancelled')
      expect(orders.length).toBeGreaterThanOrEqual(1)
      for (const o of orders) {
        expect(o.status).toBe('cancelled')
      }
    })
  })

  // ─────────────────────────────────────────────
  // 12. getOrdersByDateRange
  // ─────────────────────────────────────────────
  describe('12. getOrdersByDateRange', () => {
    test('获取过去 7 天内的订单', () => {
      const now = Date.now()
      const start = now - 7 * 24 * 3600 * 1000
      const end = now
      const orders = getOrdersByDateRange(start, end)
      expect(orders.length).toBeGreaterThanOrEqual(1)
      for (const o of orders) {
        expect(o.createdAt).toBeGreaterThanOrEqual(start)
        expect(o.createdAt).toBeLessThanOrEqual(end)
      }
    })
    test('未来时间范围返回空数组', () => {
      const now = Date.now()
      const orders = getOrdersByDateRange(now + 100000, now + 200000)
      expect(orders).toEqual([])
    })
  })

  // ─────────────────────────────────────────────
  // 13. getPaymentStats
  // ─────────────────────────────────────────────
  describe('13. getPaymentStats', () => {
    test('统计总订单数 >= 5', () => {
      const stats = getPaymentStats()
      expect(stats.totalOrders).toBeGreaterThanOrEqual(5)
    })
    test('byMethod 包含所有支付方式', () => {
      const stats = getPaymentStats()
      for (const m of PAYMENT_METHODS) {
        expect(stats.byMethod[m]).toBeDefined()
        expect(typeof stats.byMethod[m].count).toBe('number')
      }
    })
    test('byStatus 包含所有状态', () => {
      const stats = getPaymentStats()
      const statuses: OrderStatus[] = ['pending', 'paid', 'refunded', 'failed', 'expired', 'cancelled']
      for (const s of statuses) {
        expect(stats.byStatus[s]).toBeDefined()
        expect(typeof stats.byStatus[s]).toBe('number')
      }
    })
    test('dailyRevenue 为按日期排序的数组', () => {
      const stats = getPaymentStats()
      expect(Array.isArray(stats.dailyRevenue)).toBe(true)
      for (let i = 1; i < stats.dailyRevenue.length; i++) {
        expect(stats.dailyRevenue[i].date >= stats.dailyRevenue[i - 1].date).toBe(true)
      }
    })
  })

  // ─────────────────────────────────────────────
  // 14. getAllOrders
  // ─────────────────────────────────────────────
  describe('14. getAllOrders', () => {
    test('种子数据有 5 个订单', () => {
      const all = getAllOrders()
      expect(all.length).toBe(5)
    })
    test('新增订单后数量增加', () => {
      const before = getAllOrders().length
      createOrder({
        userId: 'user-new-order',
        orderType: 'subscription',
        productId: 'PRO-MONTHLY',
        productName: '专业版月订阅',
        amount: 29.9,
        currency: 'CNY',
        paymentMethod: 'wechat',
        metadata: {},
      })
      const after = getAllOrders().length
      expect(after).toBe(before + 1)
    })
  })

  // ─────────────────────────────────────────────
  // 15. resetOrderStore
  // ─────────────────────────────────────────────
  describe('15. resetOrderStore', () => {
    test('重置后恢复 5 个种子订单', () => {
      createOrder({
        userId: 'user-extra-order',
        orderType: 'single_report',
        productId: 'RPT-EXTRA',
        productName: '额外订单',
        amount: 19.9,
        currency: 'CNY',
        paymentMethod: 'wechat',
        metadata: {},
      })
      expect(getAllOrders().length).toBeGreaterThan(5)

      resetOrderStore()
      expect(getAllOrders().length).toBe(5)
    })
    test('重置后种子订单数据正确', () => {
      resetOrderStore()
      const order = getOrderById('ORD-SEED-0002')
      expect(order).toBeDefined()
      expect(order!.amount).toBe(999)
      expect(order!.status).toBe('paid')
    })
  })
})