/**
 * notificationHelper — 通知发送工具
 *
 * 提供 sendNotification 通用函数及各业务场景的便捷函数。
 * 其他模块可调用便捷函数发送站内通知。
 *
 * 代码风格：var、单引号、字符串拼接，禁止 backtick 模板字符串。
 */

/** 合法通知类型 */
var VALID_TYPES = [
  'membership_expiry',
  'membership_upgraded',
  'order_paid',
  'order_failed',
  'daily_fortune',
  'report_ready',
  'system',
  'promotion',
  'feedback_reply',
  'checkin_reward',
  'badge_earned',
]

/**
 * 发送通知到 user_notifications 表
 *
 * @param supabase - Supabase admin 客户端
 * @param userId - 目标用户 ID
 * @param type - 通知类型
 * @param title - 通知标题
 * @param content - 通知内容
 * @param metadata - 可选附加元数据
 * @returns 通知 ID，失败返回 null
 */
async function sendNotification(
  supabase: any,
  userId: string,
  type: string,
  title: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<string | null> {
  if (VALID_TYPES.indexOf(type) === -1) {
    return null
  }
  var insertData: Record<string, unknown> = {
    user_id: userId,
    type: type,
    title: title,
    content: content,
    metadata: metadata || {},
  }
  var { data, error } = await supabase
    .from('user_notifications')
    .insert(insertData)
    .select('id')
    .single()
  if (error || !data) {
    return null
  }
  return data.id
}

/**
 * 会员即将到期提醒
 */
async function notifyMembershipExpiring(
  supabase: any,
  userId: string,
  tier: string,
  expiresAt: string,
  daysRemaining: number
): Promise<string | null> {
  var title = '会员即将到期'
  var content = '您的' + tier + '会员将于 ' + daysRemaining + ' 天后到期（' + expiresAt.slice(0, 10) + '），请及时续费以免影响使用。'
  var metadata = { tier: tier, expiresAt: expiresAt, daysRemaining: daysRemaining }
  return sendNotification(supabase, userId, 'membership_expiry', title, content, metadata)
}

/**
 * 会员升级成功通知
 */
async function notifyMembershipUpgraded(
  supabase: any,
  userId: string,
  newTier: string,
  expiresAt: string
): Promise<string | null> {
  var tierLabels: Record<string, string> = {
    'basic': '基础会员',
    'premium': '高级会员',
    'vip': 'VIP会员',
  }
  var tierLabel = tierLabels[newTier] || newTier
  var title = '会员升级成功'
  var content = '恭喜您成功升级为' + tierLabel + '，有效期至 ' + expiresAt.slice(0, 10) + '。尽情享受会员特权吧！'
  var metadata = { tier: newTier, expiresAt: expiresAt }
  return sendNotification(supabase, userId, 'membership_upgraded', title, content, metadata)
}

/**
 * 订单支付成功通知
 */
async function notifyOrderPaid(
  supabase: any,
  userId: string,
  productName: string,
  amountCents: number,
  orderId: string
): Promise<string | null> {
  var yuan = (amountCents / 100).toFixed(2)
  var title = '支付成功'
  var content = '您已成功支付 ' + productName + '，金额 \u00A5' + yuan + '。'
  var metadata = { productName: productName, amountCents: amountCents, orderId: orderId }
  return sendNotification(supabase, userId, 'order_paid', title, content, metadata)
}

/**
 * 订单支付失败通知
 */
async function notifyOrderFailed(
  supabase: any,
  userId: string,
  productName: string,
  orderId: string,
  reason: string
): Promise<string | null> {
  var title = '支付失败'
  var content = productName + ' 支付未成功' + (reason ? '，原因：' + reason : '') + '。请重试或联系客服。'
  var metadata = { productName: productName, orderId: orderId, reason: reason }
  return sendNotification(supabase, userId, 'order_failed', title, content, metadata)
}

/**
 * 报告生成完成通知
 */
async function notifyReportReady(
  supabase: any,
  userId: string,
  reportId: string,
  reportType: string
): Promise<string | null> {
  var title = '报告已生成'
  var content = '您的' + reportType + '报告已生成完毕，请前往查看。'
  var metadata = { reportId: reportId, reportType: reportType }
  return sendNotification(supabase, userId, 'report_ready', title, content, metadata)
}

/**
 * 获得徽章通知
 */
async function notifyBadgeEarned(
  supabase: any,
  userId: string,
  badgeName: string,
  badgeKey: string
): Promise<string | null> {
  var title = '获得新徽章'
  var content = '恭喜您获得「' + badgeName + '」徽章！继续探索更多精彩内容吧。'
  var metadata = { badgeName: badgeName, badgeKey: badgeKey }
  return sendNotification(supabase, userId, 'badge_earned', title, content, metadata)
}

/**
 * 签到奖励通知
 */
async function notifyCheckinReward(
  supabase: any,
  userId: string,
  streak: number,
  rewardPoints: number
): Promise<string | null> {
  var title = '签到奖励'
  var content = '连续签到 ' + streak + ' 天，获得 ' + rewardPoints + ' 积分奖励！'
  var metadata = { streak: streak, rewardPoints: rewardPoints }
  return sendNotification(supabase, userId, 'checkin_reward', title, content, metadata)
}

export {
  sendNotification,
  notifyMembershipExpiring,
  notifyMembershipUpgraded,
  notifyOrderPaid,
  notifyOrderFailed,
  notifyReportReady,
  notifyBadgeEarned,
  notifyCheckinReward,
}