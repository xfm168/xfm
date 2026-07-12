/**
 * P8 优惠券模块
 * 纯逻辑函数，无副作用，不耦合 Engine
 */

import type { PaymentProductType } from '../database/types'
import type { Coupon } from './types'

// ────────────────────────────────────────────────
//  工具函数
// ────────────────────────────────────────────────

/** 生成8位大写字母+数字的优惠券码 */
export function generateCouponCode(): string {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  var code = ''
  for (var i = 0; i < 8; i++) {
    var idx = Math.floor(Math.random() * chars.length)
    code = code + chars.charAt(idx)
  }
  return code
}

/** 判断优惠券是否已过期 */
export function isCouponExpired(coupon: Coupon): boolean {
  var now = Date.now()
  var validUntil = new Date(coupon.validUntil).getTime()
  return now > validUntil
}

/** 判断优惠券是否尚未生效 */
function isCouponNotYetValid(coupon: Coupon): boolean {
  var now = Date.now()
  var validFrom = new Date(coupon.validFrom).getTime()
  return now < validFrom
}

// ────────────────────────────────────────────────
//  核心业务函数
// ────────────────────────────────────────────────

/**
 * 验证优惠券是否可用
 * @returns valid 是否可用, discount 折扣金额（分）, message 说明
 */
export function validateCoupon(
  coupon: Coupon,
  productType: PaymentProductType,
  amountCents: number
): { valid: boolean; discount: number; message: string } {
  // 检查是否激活
  if (!coupon.active) {
    return { valid: false, discount: 0, message: '该优惠券已失效' }
  }

  // 检查是否未生效
  if (isCouponNotYetValid(coupon)) {
    return { valid: false, discount: 0, message: '该优惠券尚未生效' }
  }

  // 检查是否已过期
  if (isCouponExpired(coupon)) {
    return { valid: false, discount: 0, message: '该优惠券已过期' }
  }

  // 检查使用次数
  if (coupon.usageLimit > 0 && coupon.usageCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, message: '该优惠券已达到使用上限' }
  }

  // 检查商品类型
  if (coupon.productTypes.length > 0) {
    var found = false
    for (var i = 0; i < coupon.productTypes.length; i++) {
      if (coupon.productTypes[i] === productType) {
        found = true
        break
      }
    }
    if (!found) {
      return { valid: false, discount: 0, message: '该优惠券不适用于此商品类型' }
    }
  }

  // 检查最低消费
  if (amountCents < coupon.minAmountCents) {
    var minYuan = coupon.minAmountCents / 100
    return {
      valid: false,
      discount: 0,
      message: '该优惠券需满' + minYuan + '元才能使用',
    }
  }

  // 计算折扣
  var discount = applyCoupon(coupon, amountCents)

  return { valid: true, discount: discount, message: '优惠券可用，优惠' + (discount / 100) + '元' }
}

/**
 * 应用优惠券计算实际折扣金额（分）
 * 不做前置校验，由 validateCoupon 负责
 */
export function applyCoupon(coupon: Coupon, amountCents: number): number {
  var discount = 0
  if (coupon.discountType === 'fixed') {
    // 固定金额折扣（单位：分）
    discount = coupon.discountValue
  } else {
    // 百分比折扣
    discount = Math.floor(amountCents * coupon.discountValue / 100)
  }

  // 不超过最大折扣
  if (coupon.maxDiscountCents > 0 && discount > coupon.maxDiscountCents) {
    discount = coupon.maxDiscountCents
  }

  // 折扣不能超过商品金额
  if (discount > amountCents) {
    discount = amountCents
  }

  return discount
}
