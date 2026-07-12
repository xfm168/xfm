/**
 * P8 邀请码模块
 * 纯逻辑函数，无副作用，不耦合 Engine
 */

// ────────────────────────────────────────────────
//  邀请配置常量
// ────────────────────────────────────────────────
export var invitationConfig = {
  /** 邀请码长度 */
  codeLength: 8,
  /** 邀请码有效期（天） */
  expireDays: 30,
  /** 邀请人奖励积分 */
  inviterReward: 200,
  /** 被邀请人奖励积分 */
  inviteeReward: 100,
  /** 每个用户最大邀请码数量 */
  maxCodesPerUser: 5,
}

// ────────────────────────────────────────────────
//  工具函数
// ────────────────────────────────────────────────

/** 生成邀请码（基于用户ID + 随机字符） */
export function generateInvitationCode(userId: string): string {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  var seed = userId.slice(-4)
  var code = seed.toUpperCase()

  // 补齐剩余长度
  var remaining = invitationConfig.codeLength - code.length
  if (remaining > 0) {
    for (var i = 0; i < remaining; i++) {
      var idx = Math.floor(Math.random() * chars.length)
      code = code + chars.charAt(idx)
    }
  }

  return code
}

// ────────────────────────────────────────────────
//  核心业务函数
// ────────────────────────────────────────────────

/**
 * 验证邀请码
 * @returns valid 是否可用, message 说明
 */
export function validateInvitationCode(
  code: string,
  userId: string
): { valid: boolean; message: string } {
  if (!code || code.length === 0) {
    return { valid: false, message: '邀请码不能为空' }
  }

  if (code.length !== invitationConfig.codeLength) {
    return { valid: false, message: '邀请码格式不正确' }
  }

  // 邀请人不能使用自己的邀请码
  if (code.toUpperCase().indexOf(userId.slice(-4).toUpperCase()) !== -1) {
    return { valid: false, message: '不能使用自己的邀请码' }
  }

  return { valid: true, message: '邀请码有效' }
}

/**
 * 计算邀请奖励（邀请人和被邀请人各自的积分）
 */
export function applyInvitationReward(
  code: string,
  inviterPoints: number,
  inviteePoints: number
): { inviterReward: number; inviteeReward: number } {
  return {
    inviterReward: inviterPoints,
    inviteeReward: inviteePoints,
  }
}
