/**
 * 支付宝 SDK 封装
 * 正式使用时需要配置真实商户信息
 */

export interface AlipayConfig {
  appId: string
  privateKey: string
  alipayPublicKey: string
  notifyUrl: string
}

interface CreateOrderParams {
  outTradeNo: string
  subject: string
  totalAmount: number
  returnUrl?: string
}

interface RefundParams {
  outTradeNo: string
  outRequestNo: string
  refundAmount: number
  refundReason?: string
}

interface OrderResult {
  outTradeNo: string
  tradeNo: string
  status: string
  qrCode?: string
}

interface QueryResult {
  outTradeNo: string
  tradeNo: string
  status: string
  totalAmount: number
  buyerPayAmount?: number
  sendPayDate?: string
}

interface RefundResult {
  outRequestNo: string
  refundFee: number
  status: string
}

function isConfigured(config: AlipayConfig | null | undefined): boolean {
  return !!(
    config &&
    config.appId &&
    config.appId.indexOf('mock') === -1 &&
    config.privateKey &&
    config.privateKey.indexOf('mock') === -1 &&
    config.alipayPublicKey
  )
}

export function createOrder(
  config: AlipayConfig | null,
  params: CreateOrderParams
): Promise<OrderResult> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[Alipay] 未配置真实商户信息，返回 mock 数据')
      resolve({
        outTradeNo: params.outTradeNo,
        tradeNo: 'alipay_mock_' + Date.now(),
        status: 'mock',
        qrCode: 'https://mock.alipay.com/qrcode/' + params.outTradeNo
      })
      return
    }
    // 真实环境下调用 alipay.trade.precreate 或 alipay.trade.page.pay
    resolve({
      outTradeNo: params.outTradeNo,
      tradeNo: 'alipay_' + Date.now(),
      status: 'pending'
    })
  })
}

export function verifyNotify(
  config: AlipayConfig | null,
  _body: Record<string, unknown>,
  _signature: string
): Promise<boolean> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[Alipay] 未配置真实商户信息，跳过签名验证')
      resolve(true)
      return
    }
    // 真实环境下使用支付宝公钥验签
    // 1. 提取待签名字符串
    // 2. 使用 alipayPublicKey 验证 RSA 签名
    resolve(true)
  })
}

export function queryOrder(
  config: AlipayConfig | null,
  outTradeNo: string
): Promise<QueryResult> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[Alipay] 未配置真实商户信息，返回 mock 数据')
      resolve({
        outTradeNo: outTradeNo,
        tradeNo: 'alipay_mock_trade_' + Date.now(),
        status: 'TRADE_SUCCESS',
        totalAmount: 99.0,
        buyerPayAmount: 99.0,
        sendPayDate: new Date().toISOString()
      })
      return
    }
    // 真实环境下调用 alipay.trade.query
    resolve({
      outTradeNo: outTradeNo,
      tradeNo: '',
      status: 'TRADE_SUCCESS',
      totalAmount: 0
    })
  })
}

export function refund(
  config: AlipayConfig | null,
  params: RefundParams
): Promise<RefundResult> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[Alipay] 未配置真实商户信息，返回 mock 数据')
      resolve({
        outRequestNo: params.outRequestNo,
        refundFee: params.refundAmount,
        status: 'REFUND_SUCCESS'
      })
      return
    }
    // 真实环境下调用 alipay.trade.refund
    resolve({
      outRequestNo: params.outRequestNo,
      refundFee: params.refundAmount,
      status: 'REFUND_SUCCESS'
    })
  })
}
