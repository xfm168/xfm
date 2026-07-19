// Phase 6 Batch 2 Module 2: Payment Order — Types
// 支付订单系统：订单创建、支付、退款、统计

export type PaymentMethod = 'wechat' | 'alipay' | 'stripe' | 'apple_pay'
export type OrderStatus = 'pending' | 'paid' | 'refunded' | 'failed' | 'expired' | 'cancelled'
export type OrderType = 'subscription' | 'single_report' | 'vip_upgrade'

export interface PaymentOrder {
  id: string
  userId: string
  orderType: OrderType
  productId: string
  productName: string
  amount: number
  currency: string             // 'CNY' | 'USD'
  paymentMethod: PaymentMethod
  status: OrderStatus
  createdAt: number
  paidAt: number | null
  refundedAt: number | null
  expiresAt: number
  transactionId: string | null
  metadata: Record<string, string>
}

export interface PaymentStats {
  totalOrders: number
  totalRevenue: number
  byMethod: Record<PaymentMethod, {count: number; revenue: number}>
  byType: Record<OrderType, {count: number; revenue: number}>
  byStatus: Record<OrderStatus, number>
  dailyRevenue: Array<{date: string; revenue: number; count: number}>
  refundRate: number
}

export const PAYMENT_ORDER_VERSION = '1.0.0'

export const PAYMENT_METHODS: PaymentMethod[] = ['wechat', 'alipay', 'stripe', 'apple_pay']

export const ORDER_EXPIRY_MINUTES = 30