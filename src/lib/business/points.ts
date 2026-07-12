/**
 * P8 积分模块
 * 纯逻辑函数，无副作用，不耦合 Engine
 */

import type { PointsBalance } from './types'

// ────────────────────────────────────────────────
//  积分配置常量
// ────────────────────────────────────────────────
export var pointsConfig = {
  /** 消费1元可获得积分 */
  earnRate: 10,
  /** 积分兑换比例：100积分=1元 */
  redeemRate: 100,
  /** 单笔消费最大可获得积分 */
  maxEarnPerTransaction: 5000,
  /** 单日消费可获得积分上限 */
  dailyEarnLimit: 20000,
  /** 积分冻结最长时间（天） */
  freezeExpireDays: 7,
  /** 注册赠送积分 */
  registerBonus: 100,
  /** 每日签到积分 */
  dailyCheckin: 5,
  /** 完善资料积分 */
  profileComplete: 50,
}

// ────────────────────────────────────────────────
//  积分操作函数
// ────────────────────────────────────────────────

/** 增加积分 */
export function addPoints(
  balance: PointsBalance,
  amount: number,
  source: string
): PointsBalance {
  return {
    userId: balance.userId,
    total: balance.total + amount,
    available: balance.available + amount,
    frozen: balance.frozen,
  }
}

/** 消费积分（可用余额不足时返回 null） */
export function spendPoints(
  balance: PointsBalance,
  amount: number,
  source: string
): PointsBalance | null {
  if (balance.available < amount) {
    return null
  }
  return {
    userId: balance.userId,
    total: balance.total - amount,
    available: balance.available - amount,
    frozen: balance.frozen,
  }
}

/** 冻结积分（可用余额不足时返回 null） */
export function freezePoints(
  balance: PointsBalance,
  amount: number
): PointsBalance | null {
  if (balance.available < amount) {
    return null
  }
  return {
    userId: balance.userId,
    total: balance.total,
    available: balance.available - amount,
    frozen: balance.frozen + amount,
  }
}

/** 解冻积分 */
export function unfreezePoints(
  balance: PointsBalance,
  amount: number
): PointsBalance {
  var actual = Math.min(amount, balance.frozen)
  return {
    userId: balance.userId,
    total: balance.total,
    available: balance.available + actual,
    frozen: balance.frozen - actual,
  }
}

/** 根据消费金额（分）计算可获得积分 */
export function calculatePointsEarned(amountCents: number): number {
  var yuan = amountCents / 100
  var points = Math.floor(yuan * pointsConfig.earnRate)
  if (points > pointsConfig.maxEarnPerTransaction) {
    points = pointsConfig.maxEarnPerTransaction
  }
  return points
}
