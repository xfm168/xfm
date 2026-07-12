/**
 * P8 支付模块
 * 纯逻辑函数，实际对接后续实现，不耦合 Engine
 */

import type { PaymentProductType, PaymentMethod, PaymentStatus } from '../database/types'
import type { Order, Coupon, PaymentSession } from './types'

// ────────────────────────────────────────────────
//  工具函数
// ────────────────────────────────────────────────

/** 生成订单号：时间戳 + 4位随机数 */
export function generateOrderNo(): string {
  var now = Date.now()
  var rand = Math.floor(Math.random() * 10000)
  var randStr = String(rand)
  // 补零到4位
  while (randStr.length < 4) {
    randStr = '0' + randStr
  }
  return String(now) + randStr
}

/** 根据产品类型获取默认名称 */
function getProductDefaultName(productType: PaymentProductType): string {
  var names: Record<string, string> = {
    'membership': '会员订阅',
    'report': '命理报告',
    'addon': '增值服务',
    'credits': 'AI积分充值',
  }
  return names[productType] || '商品'
}

/** 获取支付渠道对应的 provider */
function getProvider(method: PaymentMethod): 'wechat' | 'alipay' | 'stripe' {
  var mapping: Record<string, 'wechat' | 'alipay' | 'stripe'> = {
    'wechat': 'wechat',
    'alipay': 'alipay',
    'stripe': 'stripe',
  }
  return mapping[method] || 'stripe'
}

// ────────────────────────────────────────────────
//  核心业务函数
// ────────────────────────────────────────────────

/** 计算最终金额（分） */
export function calculateFinalAmount(
  amountCents: number,
  coupon?: Coupon | null
): number {
  if (!coupon) {
    return amountCents
  }
  if (coupon.discountType === 'fixed') {
    var discount = coupon.discountValue
    if (coupon.maxDiscountCents > 0 && discount > coupon.maxDiscountCents) {
      discount = coupon.maxDiscountCents
    }
    var result = amountCents - discount
    return result < 0 ? 0 : result
  }
  // 百分比
  var percentDiscount = Math.floor(amountCents * coupon.discountValue / 100)
  if (coupon.maxDiscountCents > 0 && percentDiscount > coupon.maxDiscountCents) {
    percentDiscount = coupon.maxDiscountCents
  }
  var finalAmount = amountCents - percentDiscount
  return finalAmount < 0 ? 0 : finalAmount
}

/** 创建订单 */
export function createOrder(
  productType: PaymentProductType,
  productId: string,
  amountCents: number,
  userId: string,
  coupon?: Coupon | null
): Order {
  var finalAmount = calculateFinalAmount(amountCents, coupon)
  var couponCode = coupon ? coupon.code : null
  var couponDiscount = amountCents - finalAmount

  return {
    id: generateOrderNo(),
    user_id: userId,
    order_no: '',
    product_type: productType,
    product_id: productId,
    amount_cents: finalAmount,
    currency: 'CNY',
    payment_method: null,
    payment_provider_order_id: null,
    payment_provider_transaction_id: null,
    paid_at: null,
    status: 'pending',
    metadata: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    productName: getProductDefaultName(productType),
    pointsEarned: 0,
    couponCode: couponCode,
    couponDiscount: couponDiscount,
  }
}

/** 创建支付会话 */
export function createPaymentSession(
  order: Order,
  method: PaymentMethod
): PaymentSession {
  var now = Date.now()
  var expiresMs = 30 * 60 * 1000 // 30分钟过期
  var provider = getProvider(method)

  return {
    orderNo: order.order_no || order.id,
    amountCents: order.amount_cents,
    currency: order.currency,
    method: method,
    provider: provider,
    providerUrl: '',
    qrCode: null,
    expiresAt: new Date(now + expiresMs).toISOString(),
  }
}

/** 模拟支付（2秒延迟，90%概率成功） */
export function simulatePayment(session: PaymentSession): Promise<PaymentStatus> {
  return new Promise(function (resolve) {
    setTimeout(function () {
      // 检查是否过期
      var now = Date.now()
      var expiresAt = new Date(session.expiresAt).getTime()
      if (now > expiresAt) {
        resolve('failed')
        return
      }
      // 90%概率支付成功
      var rand = Math.random()
      if (rand < 0.9) {
        resolve('paid')
      } else {
        resolve('failed')
      }
    }, 2000)
  })
}
