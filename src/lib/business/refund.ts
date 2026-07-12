/**
 * P8 退款模块
 * 纯逻辑函数，无副作用，不耦合 Engine
 */

import type { Payment } from '../database/types'

// ────────────────────────────────────────────────
//  退款配置
// ────────────────────────────────────────────────
export var refundConfig = {
  /** 默认退款时限（天） */
  defaultDaysLimit: 7,
  /** 最低退款金额（分） */
  minRefundCents: 100,
  /** 退款原因黑名单关键词 */
  blockedReasonKeywords: [
    '测试',
    'test',
    'demo',
    '演示',
  ],
}

// ────────────────────────────────────────────────
//  核心业务函数
// ────────────────────────────────────────────────

/**
 * 判断是否可以退款
 * @param payment 支付记录
 * @param createdAt 订单创建时间（ISO字符串）
 * @param daysLimit 退款时限（天），默认7天
 */
export function canRefund(
  payment: Payment,
  createdAt: string,
  daysLimit?: number
): { canRefund: boolean; message: string } {
  var limit = daysLimit || refundConfig.defaultDaysLimit

  // 已退款的不能再退
  if (payment.status === 'refunded') {
    return { canRefund: false, message: '该订单已退款' }
  }

  // 未支付的不能退
  if (payment.status !== 'paid') {
    return { canRefund: false, message: '只有已支付的订单才能退款' }
  }

  // 金额太小的不退
  if (payment.amount_cents < refundConfig.minRefundCents) {
    return { canRefund: false, message: '退款金额低于最低限额' }
  }

  // 检查是否在退款时限内
  var createdTime = new Date(createdAt).getTime()
  var now = Date.now()
  var diffDays = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24))
  if (diffDays > limit) {
    return {
      canRefund: false,
      message: '已超过' + limit + '天退款时限，无法退款',
    }
  }

  return { canRefund: true, message: '可以申请退款' }
}

/**
 * 按比例计算退款金额（分）
 * @param payment 支付记录
 * @param daysUsed 已使用天数
 * @param totalDays 总天数
 */
export function calculateRefundAmount(
  payment: Payment,
  daysUsed: number,
  totalDays: number
): number {
  if (totalDays <= 0) {
    return 0
  }
  if (daysUsed < 0) {
    daysUsed = 0
  }
  if (daysUsed > totalDays) {
    daysUsed = totalDays
  }

  // 按剩余天数比例退款，扣除已使用部分
  var remainingRatio = (totalDays - daysUsed) / totalDays
  var refundCents = Math.floor(payment.amount_cents * remainingRatio)

  // 退款金额四舍五入到整分
  return refundCents
}

/**
 * 校验退款原因是否合规
 * @returns true 表示合规
 */
export function validateRefundReason(reason: string): boolean {
  if (!reason || reason.trim().length < 5) {
    return false
  }

  var lower = reason.toLowerCase()
  for (var i = 0; i < refundConfig.blockedReasonKeywords.length; i++) {
    var keyword = refundConfig.blockedReasonKeywords[i]
    if (lower.indexOf(keyword) !== -1) {
      return false
    }
  }

  return true
}
