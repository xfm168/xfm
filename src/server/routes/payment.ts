/**
 * V1.1-A 支付路由
 *
 *   POST /api/payment/create-order      创建订单
 *   POST /api/payment/confirm            确认支付
 *   POST /api/payment/webhook/wechat     微信支付回调
 *   POST /api/payment/webhook/alipay     支付宝回调
 *   POST /api/payment/webhook/stripe     Stripe 回调
 *   POST /api/payment/refund             申请退款
 *   GET  /api/payment/orders             获取用户订单列表
 *   GET  /api/payment/orders/:id         获取订单详情
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { Hono } from 'hono'
import { authRequired, requireUser } from '../middleware/auth'
import { ApiError } from '../middleware/error'
import type {
  OrderProductType,
  OrderStatus,
  V11PaymentMethod,
  V11PaymentStatus,
} from '../../lib/database/types'

var app = new Hono()

// ───────────────────────────────────────────────
//  工具函数
// ───────────────────────────────────────────────

/**
 * 生成订单号: XF + YYYYMMDDHHmmss + 6位随机
 * 例如: XF20260712103045A3B2C1
 */
function generateOrderNo(): string {
  var now = new Date()
  var y = String(now.getFullYear())
  var mo = String(now.getMonth() + 1).padStart(2, '0')
  var d = String(now.getDate()).padStart(2, '0')
  var h = String(now.getHours()).padStart(2, '0')
  var mi = String(now.getMinutes()).padStart(2, '0')
  var s = String(now.getSeconds()).padStart(2, '0')
  var dateStr = y + mo + d + h + mi + s
  var chars = 'ABCDEFabcdef0123456789'
  var random = ''
  for (var i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return 'XF' + dateStr + random
}

/** 生成退款号 */
function generateRefundNo(): string {
  var now = new Date()
  var ts = String(now.getTime())
  var chars = 'ABCDEFabcdef0123456789'
  var random = ''
  for (var i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return 'RF' + ts + random
}

/** 获取 Supabase Admin 客户端（服务端使用 service_role key） */
async function getSupabaseAdmin() {
  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !supabaseServiceKey) {
    throw ApiError.internal('缺少 Supabase 环境变量配置')
  }
  var { createClient } = await import('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseServiceKey)
}

/** 30 分钟超时时间戳 */
function getExpireAt(): string {
  var expires = new Date(Date.now() + 30 * 60 * 1000)
  return expires.toISOString()
}

/** 校验产品类型 */
function isValidProductType(type: string): boolean {
  var valid: string[] = ['membership', 'report', 'addon', 'credits']
  return valid.indexOf(type) !== -1
}

/** 校验支付方式 */
function isValidPaymentMethod(method: string): boolean {
  var valid: string[] = ['wechat', 'alipay', 'stripe']
  return valid.indexOf(method) !== -1
}

// ───────────────────────────────────────────────
//  产品定价映射（单位: 分）
// ───────────────────────────────────────────────

var PRODUCT_PRICES: Record<string, number> = {
  'membership-pro': 9900,
  'membership-master': 29900,
  'report-basic': 1990,
  'report-full': 4990,
  'report-ai': 9990,
  'addon-compatibility': 2990,
  'credits-100': 990,
  'credits-500': 3990,
  'credits-1000': 6990,
}

var PRODUCT_NAMES: Record<string, string> = {
  'membership-pro': '玄风门 Pro 会员',
  'membership-master': '玄风门 Master 会员',
  'report-basic': '基础分析报告',
  'report-full': '完整分析报告',
  'report-ai': 'AI 深度分析报告',
  'addon-compatibility': '合婚分析附加报告',
  'credits-100': '100 积分包',
  'credits-500': '500 积分包',
  'credits-1000': '1000 积分包',
}

// ───────────────────────────────────────────────
//  路由
// ───────────────────────────────────────────────

/**
 * POST /api/payment/create-order
 *
 * 创建订单：验证用户已登录，校验产品类型，生成订单号，计算金额，设置 30 分钟超时。
 */
app.post('/create-order', authRequired, async function(c) {
  var user = requireUser(c)
  var body = await c.req.json()
  var productType = body.product_type as string || ''
  var productId = body.product_id as string || ''
  var paymentMethod = body.payment_method as string || null
  var discountCents = body.discount_cents as number || 0

  // 校验产品类型
  if (!isValidProductType(productType)) {
    throw ApiError.badRequest('无效的产品类型: ' + productType)
  }

  // 校验产品 ID
  var productKey = productType + '-' + productId
  var priceCents = PRODUCT_PRICES[productKey]
  if (!priceCents) {
    throw ApiError.badRequest('无效的产品: ' + productKey)
  }

  // 计算金额
  if (discountCents < 0 || discountCents >= priceCents) {
    throw ApiError.badRequest('无效的折扣金额')
  }
  var finalAmountCents = priceCents - discountCents
  if (finalAmountCents <= 0) {
    throw ApiError.badRequest('最终金额必须大于 0')
  }

  // 校验支付方式
  if (paymentMethod && !isValidPaymentMethod(paymentMethod)) {
    throw ApiError.badRequest('无效的支付方式: ' + paymentMethod)
  }

  // 生成订单号和超时
  var orderNo = generateOrderNo()
  var expiresAt = getExpireAt()
  var productName = PRODUCT_NAMES[productKey] || productKey

  var supabase = await getSupabaseAdmin()

  // 插入订单
  var insertData: Record<string, unknown> = {
    user_id: user.id,
    order_no: orderNo,
    product_type: productType,
    product_id: productId || null,
    product_name: productName,
    amount_cents: priceCents,
    discount_cents: discountCents,
    final_amount_cents: finalAmountCents,
    currency: 'CNY',
    payment_method: paymentMethod,
    status: 'pending',
    expires_at: expiresAt,
  }

  var { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(insertData)
    .select()
    .single()

  if (orderError || !order) {
    throw ApiError.internal('创建订单失败: ' + (orderError ? orderError.message : ''))
  }

  return c.json({
    success: true,
    order: order,
  })
})

/**
 * POST /api/payment/confirm
 *
 * 确认支付：更新订单状态为 paid，创建 payment 记录，更新用户会员等级，创建 transaction。
 */
app.post('/confirm', authRequired, async function(c) {
  var user = requireUser(c)
  var body = await c.req.json()
  var orderId = body.order_id as string || ''
  var paymentMethod = body.payment_method as string || ''
  var providerPaymentId = body.provider_payment_id as string || null
  var providerOrderId = body.provider_order_id as string || null

  if (!orderId) {
    throw ApiError.badRequest('缺少 order_id')
  }
  if (!isValidPaymentMethod(paymentMethod)) {
    throw ApiError.badRequest('无效的支付方式: ' + paymentMethod)
  }

  var supabase = await getSupabaseAdmin()

  // 查询订单
  var { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) {
    throw ApiError.notFound('订单不存在')
  }

  if (order.status !== 'pending') {
    throw ApiError.badRequest('订单状态不允许支付: ' + order.status)
  }

  var now = new Date().toISOString()

  // 更新订单状态
  var { error: updateOrderError } = await supabase
    .from('orders')
    .update({
      status: 'paid',
      payment_method: paymentMethod,
      paid_at: now,
      updated_at: now,
    })
    .eq('id', orderId)

  if (updateOrderError) {
    throw ApiError.internal('更新订单状态失败: ' + updateOrderError.message)
  }

  // 创建 payment 记录
  var paymentInsert: Record<string, unknown> = {
    order_id: orderId,
    user_id: user.id,
    payment_method: paymentMethod,
    provider_payment_id: providerPaymentId,
    provider_order_id: providerOrderId,
    amount_cents: order.final_amount_cents,
    currency: order.currency,
    status: 'success',
    paid_at: now,
    metadata: {},
  }

  var { data: payment, error: paymentError } = await supabase
    .from('v11_payments')
    .insert(paymentInsert)
    .select()
    .single()

  if (paymentError || !payment) {
    throw ApiError.internal('创建支付记录失败: ' + (paymentError ? paymentError.message : ''))
  }

  // 更新用户会员等级（如果是会员产品）
  if (order.product_type === 'membership') {
    var tierMap: Record<string, string> = {
      'pro': 'pro',
      'master': 'master',
    }
    var tier = tierMap[order.product_id] || null
    if (tier) {
      var durationDays: Record<string, number> = {
        'pro': 30,
        'master': 365,
      }
      var days = durationDays[order.product_id] || 30
      var expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()

      // 先尝试更新已有 profile
      var { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (existingProfile) {
        var existing = existingProfile as { total_spent_cents?: number }
        await supabase
          .from('user_profiles')
          .update({
            membership_tier: tier,
            membership_expires_at: expiresAt,
            total_spent_cents: (existing.total_spent_cents || 0) + order.final_amount_cents,
            updated_at: now,
          })
          .eq('id', user.id)
      } else {
        // 创建 profile
        await supabase
          .from('user_profiles')
          .insert({
            id: user.id,
            membership_tier: tier,
            membership_expires_at: expiresAt,
            total_spent_cents: order.final_amount_cents,
          })
      }
    }
  }

  // 创建 transaction 记录
  var { data: profile } = await supabase
    .from('user_profiles')
    .select('points_balance, total_spent_cents')
    .eq('id', user.id)
    .single()

  var balanceAfter = profile ? (profile as { total_spent_cents?: number }).total_spent_cents || 0 : 0

  var transactionInsert: Record<string, unknown> = {
    user_id: user.id,
    type: 'payment',
    amount_cents: order.final_amount_cents,
    balance_after: balanceAfter,
    reference_id: orderId,
    description: '支付订单 ' + order.order_no + ' - ' + order.product_name,
    metadata: {
      order_id: orderId,
      payment_id: payment.id,
      payment_method: paymentMethod,
    },
  }

  await supabase
    .from('transactions')
    .insert(transactionInsert)

  return c.json({
    success: true,
    order: order,
    payment: payment,
  })
})

/**
 * POST /api/payment/webhook/wechat
 *
 * 微信支付回调：验签，更新支付状态。
 */
app.post('/webhook/wechat', async function(c) {
  var body = await c.req.json()

  // TODO: 微信支付验签
  // var wepaySignature = c.req.header('Wechatpay-Signature')
  // var wepayTimestamp = c.req.header('Wechatpay-Timestamp')
  // var wepayNonce = c.req.header('Wechatpay-Nonce')
  // if (!wepaySignature || !wepayTimestamp || !wepayNonce) {
  //   throw ApiError.badRequest('缺少微信支付签名头')
  // }

  var resource = body.resource || {}
  var ciphertext = resource.ciphertext || ''
  var nonce = resource.nonce || ''
  var associatedData = resource.associated_data || ''

  // TODO: 解密 ciphertext 获取真实支付结果
  var decryptedAmount = body.amount || {}
  var totalCents = decryptedAmount.total ? decryptedAmount.total * 100 : 0
  var outTradeNo = decryptedAmount.out_trade_no || body.out_trade_no || ''
  var transactionId = decryptedAmount.transaction_id || body.transaction_id || ''
  var tradeState = decryptedAmount.trade_state || body.trade_state || ''

  if (!outTradeNo) {
    throw ApiError.badRequest('缺少商户订单号')
  }

  var supabase = await getSupabaseAdmin()

  // 查找订单
  var { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('order_no', outTradeNo)
    .single()

  if (orderError || !order) {
    return c.json({ code: 'FAIL', message: '订单不存在' }, 400)
  }

  if (order.status === 'paid') {
    return c.json({ code: 'SUCCESS', message: '重复通知' })
  }

  var now = new Date().toISOString()
  var status: V11PaymentStatus = tradeState === 'SUCCESS' ? 'success' : 'failed'
  var orderStatus: OrderStatus = tradeState === 'SUCCESS' ? 'paid' : 'expired'

  // 更新订单状态
  if (tradeState === 'SUCCESS') {
    await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_method: 'wechat',
        paid_at: now,
        updated_at: now,
      })
      .eq('id', order.id)

    // 创建 payment 记录
    var paymentInsert: Record<string, unknown> = {
      order_id: order.id,
      user_id: order.user_id,
      payment_method: 'wechat',
      provider_payment_id: transactionId,
      provider_order_id: outTradeNo,
      amount_cents: totalCents || order.final_amount_cents,
      currency: order.currency,
      status: status,
      paid_at: now,
      metadata: {
        wechat_raw: body,
      },
    }
    await supabase.from('v11_payments').insert(paymentInsert)

    // 创建 transaction
    var txInsert: Record<string, unknown> = {
      user_id: order.user_id,
      type: 'payment',
      amount_cents: totalCents || order.final_amount_cents,
      balance_after: 0,
      reference_id: order.id,
      description: '微信支付订单 ' + order.order_no,
      metadata: { provider: 'wechat', transaction_id: transactionId },
    }
    await supabase.from('transactions').insert(txInsert)
  } else {
    await supabase
      .from('orders')
      .update({ status: orderStatus, updated_at: now })
      .eq('id', order.id)
  }

  return c.json({ code: 'SUCCESS', message: '处理成功' })
})

/**
 * POST /api/payment/webhook/alipay
 *
 * 支付宝回调。
 */
app.post('/webhook/alipay', async function(c) {
  var body = await c.req.json()
  var params = body || {}

  // TODO: 支付宝验签
  // var sign = params.sign || ''
  // var signType = params.sign_type || ''
  // 使用支付宝公钥验签

  var outTradeNo = params.out_trade_no || ''
  var tradeNo = params.trade_no || ''
  var tradeStatus = params.trade_status || ''
  var totalAmount = params.total_amount || ''
  var totalCents = Math.round(parseFloat(totalAmount) * 100)

  if (!outTradeNo) {
    throw ApiError.badRequest('缺少商户订单号')
  }

  var supabase = await getSupabaseAdmin()

  var { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('order_no', outTradeNo)
    .single()

  if (orderError || !order) {
    return c.text('fail', 400)
  }

  if (order.status === 'paid') {
    return c.text('success')
  }

  var now = new Date().toISOString()
  var status: V11PaymentStatus = tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED'
    ? 'success'
    : 'failed'
  var orderStatus: OrderStatus = status === 'success' ? 'paid' : 'expired'

  if (status === 'success') {
    await supabase
      .from('orders')
      .update({
        status: orderStatus,
        payment_method: 'alipay',
        paid_at: now,
        updated_at: now,
      })
      .eq('id', order.id)

    var paymentInsert: Record<string, unknown> = {
      order_id: order.id,
      user_id: order.user_id,
      payment_method: 'alipay',
      provider_payment_id: tradeNo,
      provider_order_id: outTradeNo,
      amount_cents: totalCents || order.final_amount_cents,
      currency: order.currency,
      status: status,
      paid_at: now,
      metadata: { alipay_raw: params },
    }
    await supabase.from('v11_payments').insert(paymentInsert)

    var txInsert: Record<string, unknown> = {
      user_id: order.user_id,
      type: 'payment',
      amount_cents: totalCents || order.final_amount_cents,
      balance_after: 0,
      reference_id: order.id,
      description: '支付宝支付订单 ' + order.order_no,
      metadata: { provider: 'alipay', trade_no: tradeNo },
    }
    await supabase.from('transactions').insert(txInsert)
  } else {
    await supabase
      .from('orders')
      .update({ status: orderStatus, updated_at: now })
      .eq('id', order.id)
  }

  return c.text('success')
})

/**
 * POST /api/payment/webhook/stripe
 *
 * Stripe 回调。
 */
app.post('/webhook/stripe', async function(c) {
  var body = await c.req.json()
  var type = body.type || ''
  var data = body.data || {}
  var object = data.object || {}

  // TODO: Stripe 签名验证
  // var stripeSignature = c.req.header('stripe-signature')
  // 使用 stripe.webhooks.constructEvent 验证

  if (type === 'checkout.session.completed') {
    var orderId = object.metadata ? object.metadata.order_id : ''
    var paymentIntentId = object.payment_intent || ''
    var stripePaymentStatus = object.payment_status || ''

    if (!orderId) {
      return c.json({ received: true })
    }

    var supabase = await getSupabaseAdmin()

    var { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return c.json({ received: true })
    }

    if (order.status === 'paid') {
      return c.json({ received: true })
    }

    var now = new Date().toISOString()

    await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_method: 'stripe',
        paid_at: now,
        updated_at: now,
      })
      .eq('id', order.id)

    var paymentInsert: Record<string, unknown> = {
      order_id: order.id,
      user_id: order.user_id,
      payment_method: 'stripe',
      provider_payment_id: paymentIntentId,
      provider_order_id: object.id || '',
      amount_cents: order.final_amount_cents,
      currency: order.currency,
      status: 'success',
      paid_at: now,
      metadata: { stripe_event: body },
    }
    await supabase.from('v11_payments').insert(paymentInsert)

    var txInsert: Record<string, unknown> = {
      user_id: order.user_id,
      type: 'payment',
      amount_cents: order.final_amount_cents,
      balance_after: 0,
      reference_id: order.id,
      description: 'Stripe 支付订单 ' + order.order_no,
      metadata: { provider: 'stripe', payment_intent: paymentIntentId },
    }
    await supabase.from('transactions').insert(txInsert)
  }

  return c.json({ received: true })
})

/**
 * POST /api/payment/refund
 *
 * 申请退款：检查退款窗口 7 天，计算退款金额。
 */
app.post('/refund', authRequired, async function(c) {
  var user = requireUser(c)
  var body = await c.req.json()
  var orderId = body.order_id as string || ''
  var reason = body.reason as string || ''

  if (!orderId) {
    throw ApiError.badRequest('缺少 order_id')
  }
  if (!reason) {
    throw ApiError.badRequest('缺少退款原因')
  }

  var supabase = await getSupabaseAdmin()

  // 查询订单
  var { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (orderError || !order) {
    throw ApiError.notFound('订单不存在')
  }

  if (order.status !== 'paid') {
    throw ApiError.badRequest('订单状态不允许退款: ' + order.status)
  }

  // 检查 7 天退款窗口
  var paidAt = order.paid_at ? new Date(order.paid_at) : null
  if (!paidAt) {
    throw ApiError.badRequest('订单无支付时间')
  }
  var sevenDaysMs = 7 * 24 * 60 * 60 * 1000
  var nowMs = Date.now()
  if (nowMs - paidAt.getTime() > sevenDaysMs) {
    throw ApiError.badRequest('已超过 7 天退款窗口期')
  }

  // 检查是否已有退款
  var { data: existingRefund } = await supabase
    .from('refunds')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', 'pending')
    .single()

  if (existingRefund) {
    throw ApiError.badRequest('该订单已有待处理的退款申请')
  }

  // 查找 payment 记录
  var { data: payment } = await supabase
    .from('v11_payments')
    .select('id')
    .eq('order_id', orderId)
    .eq('status', 'success')
    .single()

  if (!payment) {
    throw ApiError.notFound('未找到对应的支付记录')
  }

  // 退款金额 = 实付金额
  var refundAmountCents = order.final_amount_cents
  var refundNo = generateRefundNo()
  var now = new Date().toISOString()

  // 创建退款记录
  var refundInsert: Record<string, unknown> = {
    payment_id: payment.id,
    order_id: orderId,
    user_id: user.id,
    refund_no: refundNo,
    amount_cents: refundAmountCents,
    reason: reason,
    status: 'pending',
  }

  var { data: refund, error: refundError } = await supabase
    .from('refunds')
    .insert(refundInsert)
    .select()
    .single()

  if (refundError || !refund) {
    throw ApiError.internal('创建退款记录失败: ' + (refundError ? refundError.message : ''))
  }

  return c.json({
    success: true,
    refund: refund,
    refund_no: refundNo,
    refund_amount_cents: refundAmountCents,
  })
})

/**
 * GET /api/payment/orders
 *
 * 获取用户订单列表。
 */
app.get('/orders', authRequired, async function(c) {
  var user = requireUser(c)
  var supabase = await getSupabaseAdmin()

  var { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw ApiError.internal('获取订单列表失败: ' + error.message)
  }

  return c.json({
    success: true,
    orders: orders || [],
    total: orders ? orders.length : 0,
  })
})

/**
 * GET /api/payment/orders/:id
 *
 * 获取订单详情。
 */
app.get('/orders/:id', authRequired, async function(c) {
  var user = requireUser(c)
  var orderId = c.req.param('id')

  if (!orderId) {
    throw ApiError.badRequest('缺少订单 ID')
  }

  var supabase = await getSupabaseAdmin()

  var { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (error || !order) {
    throw ApiError.notFound('订单不存在')
  }

  // 查询关联的支付记录
  var { data: payments } = await supabase
    .from('v11_payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  // 查询关联的退款记录
  var { data: refunds } = await supabase
    .from('refunds')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })

  return c.json({
    success: true,
    order: order,
    payments: payments || [],
    refunds: refunds || [],
  })
})

export default app
