/**
 * Phase 6 Batch 2 Module 2: Payment Order Engine
 *
 * 职责：订单创建、支付确认、退款、取消、过期、统计查询
 * 约束：不做实际支付对接，仅管理订单数据
 */

import type {
  PaymentMethod,
  OrderStatus,
  OrderType,
  PaymentOrder,
  PaymentStats,
} from './paymentOrderTypes'

import {
  PAYMENT_ORDER_VERSION,
  PAYMENT_METHODS,
  ORDER_EXPIRY_MINUTES,
} from './paymentOrderTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

export const PAYMENT_ORDER_ENGINE_VERSION = PAYMENT_ORDER_VERSION

// ═══════════════════════════════════════════════════════════
// 内部存储
// ═══════════════════════════════════════════════════════════

const orderStore = new Map<string, PaymentOrder>()

let orderCounter = 0

// ═══════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════

function generateOrderId(): string {
  orderCounter++
  const ts = Date.now()
  return `ORD-${ts}-${orderCounter.toString().padStart(4, '0')}`
}

function initByMethod(): Record<PaymentMethod, {count: number; revenue: number}> {
  const result = {} as Record<PaymentMethod, {count: number; revenue: number}>
  for (const m of PAYMENT_METHODS) {
    result[m] = { count: 0, revenue: 0 }
  }
  return result
}

function initByType(): Record<OrderType, {count: number; revenue: number}> {
  const orderTypes: OrderType[] = ['subscription', 'single_report', 'vip_upgrade']
  const result = {} as Record<OrderType, {count: number; revenue: number}>
  for (const t of orderTypes) {
    result[t] = { count: 0, revenue: 0 }
  }
  return result
}

function initByStatus(): Record<OrderStatus, number> {
  const statuses: OrderStatus[] = ['pending', 'paid', 'refunded', 'failed', 'expired', 'cancelled']
  const result = {} as Record<OrderStatus, number>
  for (const s of statuses) {
    result[s] = 0
  }
  return result
}

// ═══════════════════════════════════════════════════════════
// 种子数据
// ═══════════════════════════════════════════════════════════

function seedOrders(): void {
  const now = Date.now()

  const order1: PaymentOrder = {
    id: 'ORD-SEED-0001',
    userId: 'user-001',
    orderType: 'subscription',
    productId: 'PRO-MONTHLY',
    productName: '专业版月订阅',
    amount: 29.9,
    currency: 'CNY',
    paymentMethod: 'wechat',
    status: 'paid',
    createdAt: now - 7 * 24 * 3600 * 1000,
    paidAt: now - 7 * 24 * 3600 * 1000 + 60000,
    refundedAt: null,
    expiresAt: now - 7 * 24 * 3600 * 1000 + ORDER_EXPIRY_MINUTES * 60 * 1000,
    transactionId: 'WX-TXN-001',
    metadata: {},
  }
  orderStore.set(order1.id, order1)

  const order2: PaymentOrder = {
    id: 'ORD-SEED-0002',
    userId: 'user-002',
    orderType: 'subscription',
    productId: 'VIP-YEARLY',
    productName: 'VIP版年订阅',
    amount: 999,
    currency: 'CNY',
    paymentMethod: 'alipay',
    status: 'paid',
    createdAt: now - 30 * 24 * 3600 * 1000,
    paidAt: now - 30 * 24 * 3600 * 1000 + 120000,
    refundedAt: null,
    expiresAt: now - 30 * 24 * 3600 * 1000 + ORDER_EXPIRY_MINUTES * 60 * 1000,
    transactionId: 'ALI-TXN-001',
    metadata: {},
  }
  orderStore.set(order2.id, order2)

  const order3: PaymentOrder = {
    id: 'ORD-SEED-0003',
    userId: 'user-003',
    orderType: 'single_report',
    productId: 'DEEP-REPORT-001',
    productName: '深度命理报告',
    amount: 49.9,
    currency: 'CNY',
    paymentMethod: 'stripe',
    status: 'refunded',
    createdAt: now - 14 * 24 * 3600 * 1000,
    paidAt: now - 14 * 24 * 3600 * 1000 + 30000,
    refundedAt: now - 10 * 24 * 3600 * 1000,
    expiresAt: now - 14 * 24 * 3600 * 1000 + ORDER_EXPIRY_MINUTES * 60 * 1000,
    transactionId: 'ST-TXN-001',
    metadata: {},
  }
  orderStore.set(order3.id, order3)

  const order4: PaymentOrder = {
    id: 'ORD-SEED-0004',
    userId: 'user-004',
    orderType: 'vip_upgrade',
    productId: 'VIP-UPGRADE',
    productName: 'VIP升级',
    amount: 70,
    currency: 'CNY',
    paymentMethod: 'wechat',
    status: 'pending',
    createdAt: now - 5 * 60 * 1000,
    paidAt: null,
    refundedAt: null,
    expiresAt: now + 25 * 60 * 1000,
    transactionId: null,
    metadata: { from_tier: 'professional' },
  }
  orderStore.set(order4.id, order4)

  const order5: PaymentOrder = {
    id: 'ORD-SEED-0005',
    userId: 'user-005',
    orderType: 'single_report',
    productId: 'SINGLE-RPT-001',
    productName: '单次命理报告',
    amount: 19.9,
    currency: 'USD',
    paymentMethod: 'apple_pay',
    status: 'cancelled',
    createdAt: now - 2 * 24 * 3600 * 1000,
    paidAt: null,
    refundedAt: null,
    expiresAt: now - 2 * 24 * 3600 * 1000 + ORDER_EXPIRY_MINUTES * 60 * 1000,
    transactionId: null,
    metadata: {},
  }
  orderStore.set(order5.id, order5)
}

// 初始化种子
seedOrders()

// ═══════════════════════════════════════════════════════════
// 核心函数
// ═══════════════════════════════════════════════════════════

/**
 * 创建订单
 */
export function createOrder(data: Omit<PaymentOrder, 'id' | 'createdAt' | 'paidAt' | 'refundedAt' | 'expiresAt' | 'transactionId' | 'status'>): PaymentOrder {
  const now = Date.now()
  const id = generateOrderId()

  const order: PaymentOrder = {
    ...data,
    id,
    status: 'pending',
    createdAt: now,
    paidAt: null,
    refundedAt: null,
    expiresAt: now + ORDER_EXPIRY_MINUTES * 60 * 1000,
    transactionId: null,
  }

  orderStore.set(id, order)
  return order
}

/**
 * 支付订单
 */
export function payOrder(orderId: string, transactionId: string): PaymentOrder | null {
  const order = orderStore.get(orderId)
  if (!order || order.status !== 'pending') {
    return null
  }
  order.status = 'paid'
  order.paidAt = Date.now()
  order.transactionId = transactionId
  return order
}

/**
 * 退款订单
 */
export function refundOrder(orderId: string): PaymentOrder | null {
  const order = orderStore.get(orderId)
  if (!order || order.status !== 'paid') {
    return null
  }
  order.status = 'refunded'
  order.refundedAt = Date.now()
  return order
}

/**
 * 取消订单
 */
export function cancelOrder(orderId: string): PaymentOrder | null {
  const order = orderStore.get(orderId)
  if (!order || order.status !== 'pending') {
    return null
  }
  order.status = 'cancelled'
  return order
}

/**
 * 过期订单
 */
export function expireOrder(orderId: string): PaymentOrder | null {
  const order = orderStore.get(orderId)
  if (!order || order.status !== 'pending') {
    return null
  }
  order.status = 'expired'
  return order
}

/**
 * 根据 ID 获取订单
 */
export function getOrderById(orderId: string): PaymentOrder | undefined {
  return orderStore.get(orderId)
}

/**
 * 根据用户 ID 获取订单
 */
export function getOrdersByUserId(userId: string): PaymentOrder[] {
  return Array.from(orderStore.values()).filter(o => o.userId === userId)
}

/**
 * 根据状态获取订单
 */
export function getOrdersByStatus(status: OrderStatus): PaymentOrder[] {
  return Array.from(orderStore.values()).filter(o => o.status === status)
}

/**
 * 根据日期范围获取订单
 */
export function getOrdersByDateRange(start: number, end: number): PaymentOrder[] {
  return Array.from(orderStore.values()).filter(o => o.createdAt >= start && o.createdAt <= end)
}

/**
 * 获取支付统计
 */
export function getPaymentStats(): PaymentStats {
  const allOrders = Array.from(orderStore.values())
  const totalOrders = allOrders.length

  const byMethod = initByMethod()
  const byType = initByType()
  const byStatus = initByStatus()
  const dailyRevenueMap = new Map<string, {revenue: number; count: number}>()

  let totalRevenue = 0
  let paidCount = 0
  let refundedCount = 0

  for (const order of allOrders) {
    // byStatus
    byStatus[order.status] = (byStatus[order.status] ?? 0) + 1

    // byMethod
    const methodEntry = byMethod[order.paymentMethod]
    if (methodEntry) {
      methodEntry.count++
      if (order.status === 'paid') {
        methodEntry.revenue += order.amount
      }
    }

    // byType
    const typeEntry = byType[order.orderType]
    if (typeEntry) {
      typeEntry.count++
      if (order.status === 'paid') {
        typeEntry.revenue += order.amount
      }
    }

    // revenue
    if (order.status === 'paid') {
      totalRevenue += order.amount
      paidCount++
    }
    if (order.status === 'refunded') {
      refundedCount++
    }

    // dailyRevenue
    const date = new Date(order.createdAt).toISOString().slice(0, 10)
    const existing = dailyRevenueMap.get(date) ?? { revenue: 0, count: 0 }
    existing.count++
    if (order.status === 'paid') {
      existing.revenue += order.amount
    }
    dailyRevenueMap.set(date, existing)
  }

  // 排序 dailyRevenue
  const dailyRevenue = Array.from(dailyRevenueMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, data]) => ({ date, ...data }))

  const refundRate = paidCount > 0 ? refundedCount / paidCount : 0

  return {
    totalOrders,
    totalRevenue,
    byMethod,
    byType,
    byStatus,
    dailyRevenue,
    refundRate,
  }
}

/**
 * 获取所有订单
 */
export function getAllOrders(): PaymentOrder[] {
  return Array.from(orderStore.values())
}

/**
 * 重置订单存储（用于测试）
 */
export function resetOrderStore(): void {
  orderStore.clear()
  orderCounter = 0
  seedOrders()
}