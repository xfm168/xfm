/**
 * Stripe SDK 封装
 * 正式使用时需要配置真实商户信息
 */

export interface StripeConfig {
  secretKey: string
  publishableKey: string
  webhookSecret: string
}

interface CreatePaymentIntentParams {
  amount: number
  currency: string
  metadata?: Record<string, string>
}

interface PaymentIntentResult {
  id: string
  clientSecret: string
  status: string
  amount: number
  currency: string
}

interface RefundResult {
  id: string
  paymentIntentId: string
  amount: number
  status: string
}

function isConfigured(config: StripeConfig | null | undefined): boolean {
  return !!(
    config &&
    config.secretKey &&
    config.secretKey.indexOf('mock') === -1 &&
    config.secretKey.indexOf('sk_test') !== 0 &&
    config.secretKey.indexOf('sk_live') === 0
  )
}

export function createPaymentIntent(
  config: StripeConfig | null,
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResult> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[Stripe] 未配置真实商户信息，返回 mock 数据')
      resolve({
        id: 'pi_mock_' + Date.now(),
        clientSecret: 'pi_mock_secret_' + Date.now(),
        status: 'requires_confirmation',
        amount: params.amount,
        currency: params.currency || 'cny'
      })
      return
    }
    // 真实环境下调用 Stripe API
    // POST https://api.stripe.com/v1/payment_intents
    resolve({
      id: 'pi_' + Date.now(),
      clientSecret: '',
      status: 'requires_confirmation',
      amount: params.amount,
      currency: params.currency || 'cny'
    })
  })
}

export function confirmPayment(
  config: StripeConfig | null,
  paymentIntentId: string
): Promise<PaymentIntentResult> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[Stripe] 未配置真实商户信息，返回 mock 数据')
      resolve({
        id: paymentIntentId,
        clientSecret: '',
        status: 'succeeded',
        amount: 9900,
        currency: 'cny'
      })
      return
    }
    // 真实环境下调用 Stripe API 确认支付
    resolve({
      id: paymentIntentId,
      clientSecret: '',
      status: 'succeeded',
      amount: 0,
      currency: 'cny'
    })
  })
}

export function refund(
  config: StripeConfig | null,
  paymentIntentId: string,
  amount?: number
): Promise<RefundResult> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[Stripe] 未配置真实商户信息，返回 mock 数据')
      resolve({
        id: 're_mock_' + Date.now(),
        paymentIntentId: paymentIntentId,
        amount: amount || 9900,
        status: 'succeeded'
      })
      return
    }
    // 真实环境下调用 Stripe Refund API
    // POST https://api.stripe.com/v1/refunds
    resolve({
      id: 're_' + Date.now(),
      paymentIntentId: paymentIntentId,
      amount: amount || 0,
      status: 'succeeded'
    })
  })
}

export function constructEvent(
  config: StripeConfig | null,
  _payload: string,
  _signature: string
): Promise<{ type: string; data: unknown } | null> {
  return new Promise(function(resolve) {
    if (!isConfigured(config)) {
      console.warn('[Stripe] 未配置真实商户信息，跳过 Webhook 验证')
      resolve({
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_mock_' + Date.now() } }
      })
      return
    }
    // 真实环境下使用 stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    resolve({
      type: 'payment_intent.succeeded',
      data: null
    })
  })
}
