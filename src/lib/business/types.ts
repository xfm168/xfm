/**
 * P8 商业模块类型定义
 * 扩展 src/lib/database/types.ts 中已有的数据库类型
 * 不耦合任何命理算法引擎
 */

import type {
  MembershipTier, PaymentProductType, PaymentMethod, PaymentStatus, Payment
} from '../database/types'

// ────────────────────────────────────────────────
//  会员计划
// ────────────────────────────────────────────────
export interface MembershipPlan {
  id: string
  name: string
  tier: MembershipTier
  priceCents: number
  currency: string
  durationDays: number
  features: string[]
  maxCharts: number
  maxAnalyses: number
  aiCredits: number
  highlight: boolean
}

// ────────────────────────────────────────────────
//  订单
// ────────────────────────────────────────────────
export interface Order extends Payment {
  productName: string
  pointsEarned: number
  couponCode: string | null
  couponDiscount: number
}

export type OrderStatus = 'created' | 'paid' | 'refunding' | 'refunded' | 'expired'

// ────────────────────────────────────────────────
//  积分
// ────────────────────────────────────────────────
export interface PointsBalance {
  userId: string
  total: number
  available: number
  frozen: number
}

export interface PointsTransaction {
  id: string
  userId: string
  amount: number
  type: 'earn' | 'spend' | 'freeze' | 'unfreeze' | 'expire'
  source: string
  description: string
  balanceAfter: number
  createdAt: string
}

// ────────────────────────────────────────────────
//  优惠券
// ────────────────────────────────────────────────
export interface Coupon {
  id: string
  code: string
  discountType: 'fixed' | 'percent'
  discountValue: number
  minAmountCents: number
  maxDiscountCents: number
  productTypes: PaymentProductType[]
  usageLimit: number
  usageCount: number
  validFrom: string
  validUntil: string
  active: boolean
}

// ────────────────────────────────────────────────
//  邀请码
// ────────────────────────────────────────────────
export interface InvitationCode {
  code: string
  inviterId: string
  inviteeId: string | null
  rewardPoints: number
  used: boolean
  usedAt: string | null
  expiresAt: string
  createdAt: string
}

// ────────────────────────────────────────────────
//  支付会话
// ────────────────────────────────────────────────
export interface PaymentSession {
  orderNo: string
  amountCents: number
  currency: string
  method: PaymentMethod
  provider: 'wechat' | 'alipay' | 'stripe'
  providerUrl: string
  qrCode: string | null
  expiresAt: string
}

// ────────────────────────────────────────────────
//  退款
// ────────────────────────────────────────────────
export interface RefundRequest {
  id: string
  orderNo: string
  userId: string
  amountCents: number
  reason: string
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  processedAt: string | null
  createdAt: string
}

// ────────────────────────────────────────────────
//  成长体系
// ────────────────────────────────────────────────
export interface GrowthLevel {
  level: number
  title: string
  minPoints: number
  maxCharts: number
  aiCreditsBonus: number
  discountPercent: number
  icon: string
}

// ────────────────────────────────────────────────
//  购买记录
// ────────────────────────────────────────────────
export interface PurchaseRecord extends Payment {
  productName: string
  pointsEarned: number
  couponCode: string | null
  couponDiscount: number
}

// ────────────────────────────────────────────────
//  会员状态
// ────────────────────────────────────────────────
export interface MembershipState {
  tier: MembershipTier
  expiresAt: string | null
  plan: MembershipPlan | null
  daysRemaining: number
}

// ────────────────────────────────────────────────
//  商业状态（聚合）
// ────────────────────────────────────────────────
export interface BusinessState {
  membership: MembershipState
  points: PointsBalance
  orders: PurchaseRecord[]
  coupons: Coupon[]
  growth: GrowthLevel
  invitations: InvitationCode[]
}
