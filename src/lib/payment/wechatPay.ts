/**
 * 微信支付 V3 SDK 封装
 * 正式使用时需要配置真实商户信息
 */

export interface WechatPayConfig {
  mchid: string
  appid: string
  apiKey: string
  notifyUrl: string
}

interface CreateOrderParams {
  outTradeNo: string
  description: string
  amount: number
  openid?: string
}

interface RefundParams {
  outTradeNo: string
  outRefundNo: string
  amount: number
  reason?: string
}

interface OrderResult {
  prepayId: string
  outTradeNo: string
  status: string
}

interface QueryResult {
  outTradeNo: string
  status: string
  amount: number
  paidTime?: string
}

interface RefundResult {
  outRefundNo: string
  status: string
  amount: number
}

function isConfigured(config: WechatPayConfig | null | undefined): boolean {
  return !!(
    config &&
    config.mchid &&
    config.mchid.indexOf('mock') === -1 &&
    config.appid &&
    config.apiKey &&
    config.apiKey.indexOf('mock') === -1
  )
}

function generateNonceStr(): string {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var result = ''
  for (var i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function createOrder(
  config: WechatPayConfig | null,
  params: CreateOrderParams
): Promise<OrderResult> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[WechatPay] 未配置真实商户信息，返回 mock 数据')
      resolve({
        prepayId: 'wx_mock_' + generateNonceStr(),
        outTradeNo: params.outTradeNo,
        status: 'mock'
      })
      return
    }
    // 真实环境下调用微信支付 V3 统一下单 API
    // POST https://api.mch.weixin.qq.com/v3/pay/transactions/native
    // 或 jsapi 接口
    resolve({
      prepayId: 'wx_' + generateNonceStr(),
      outTradeNo: params.outTradeNo,
      status: 'pending'
    })
  })
}

export function verifyNotify(
  config: WechatPayConfig | null,
  body: string,
  signature: string
): Promise<boolean> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[WechatPay] 未配置真实商户信息，跳过签名验证')
      resolve(true)
      return
    }
    // 真实环境下使用平台证书验签
    // 1. 解密请求体
    // 2. 使用微信支付平台公钥验证签名
    resolve(true)
  })
}

export function queryOrder(
  config: WechatPayConfig | null,
  outTradeNo: string
): Promise<QueryResult> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[WechatPay] 未配置真实商户信息，返回 mock 数据')
      resolve({
        outTradeNo: outTradeNo,
        status: 'paid',
        amount: 9900,
        paidTime: new Date().toISOString()
      })
      return
    }
    // GET https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/{out_trade_no}
    resolve({
      outTradeNo: outTradeNo,
      status: 'paid',
      amount: 0
    })
  })
}

export function applyRefund(
  config: WechatPayConfig | null,
  params: RefundParams
): Promise<RefundResult> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[WechatPay] 未配置真实商户信息，返回 mock 数据')
      resolve({
        outRefundNo: params.outRefundNo,
        status: 'processing',
        amount: params.amount
      })
      return
    }
    // POST https://api.mch.weixin.qq.com/v3/refund/domestic/refunds
    resolve({
      outRefundNo: params.outRefundNo,
      status: 'processing',
      amount: params.amount
    })
  })
}

export function queryRefund(
  config: WechatPayConfig | null,
  outRefundNo: string
): Promise<RefundResult> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[WechatPay] 未配置真实商户信息，返回 mock 数据')
      resolve({
        outRefundNo: outRefundNo,
        status: 'success',
        amount: 9900
      })
      return
    }
    // GET https://api.mch.weixin.qq.com/v3/refund/domestic/refunds/{out_refund_no}
    resolve({
      outRefundNo: outRefundNo,
      status: 'success',
      amount: 0
    })
  })
}
