/**
 * usePayment — 支付 Hook
 * 使用 payment.ts 中的纯逻辑函数
 * 模拟支付（setTimeout 2s）
 */

import { useState, useCallback } from 'react'
import type { PaymentMethod, PaymentStatus } from '../lib/database/types'
import type { PaymentSession, Order } from '../lib/business/types'
import {
  createPaymentSession as createSession,
  simulatePayment,
} from '../lib/business/payment'

type Status = 'idle' | 'loading' | 'processing' | 'success' | 'error'

interface PaymentResult {
  status: PaymentStatus
  orderNo: string
  paidAt: string | null
}

interface UsePaymentResult {
  status: Status
  session: PaymentSession | null
  payment: PaymentResult | null
  error: string | null
  createPaymentSession: (order: Order, method: PaymentMethod) => PaymentSession | null
  pollPaymentStatus: () => Promise<PaymentResult | null>
  reset: () => void
}

export function usePayment(): UsePaymentResult {
  var statusHook = useState<Status>('idle')
  var status = statusHook[0]
  var setStatus = statusHook[1]

  var sessionHook = useState<PaymentSession | null>(null)
  var session = sessionHook[0]
  var setSession = sessionHook[1]

  var paymentHook = useState<PaymentResult | null>(null)
  var payment = paymentHook[0]
  var setPayment = paymentHook[1]

  var errorHook = useState<string | null>(null)
  var error = errorHook[0]
  var setError = errorHook[1]

  var createPaymentSession = useCallback(function(
    order: Order,
    method: PaymentMethod
  ): PaymentSession | null {
    try {
      setStatus('loading')
      setError(null)
      setPayment(null)

      var newSession = createSession(order, method)
      setSession(newSession)
      setStatus('processing')
      return newSession
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建支付会话失败')
      setStatus('error')
      return null
    }
  }, [])

  var pollPaymentStatus = useCallback(async function(): Promise<PaymentResult | null> {
    if (!session) {
      setError('没有活跃的支付会话')
      setStatus('error')
      return null
    }

    // 仅在测试模式或开发环境下使用模拟支付
    var isDev = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.DEV) || false
    if (!isDev) {
      setError('模拟支付仅在开发环境下可用')
      setStatus('error')
      return null
    }

    try {
      setStatus('processing')
      setError(null)

      var result: PaymentStatus = await simulatePayment(session)
      var paymentResult: PaymentResult = {
        status: result,
        orderNo: session.orderNo,
        paidAt: result === 'paid' ? new Date().toISOString() : null,
      }

      setPayment(paymentResult)

      if (result === 'paid') {
        setStatus('success')
      } else {
        setStatus('error')
        setError('支付失败，请重试')
      }

      return paymentResult
    } catch (e) {
      setError(e instanceof Error ? e.message : '支付处理失败')
      setStatus('error')
      return null
    }
  }, [session])

  var reset = useCallback(function() {
    setStatus('idle')
    setSession(null)
    setPayment(null)
    setError(null)
  }, [])

  return {
    status: status,
    session: session,
    payment: payment,
    error: error,
    createPaymentSession: createPaymentSession,
    pollPaymentStatus: pollPaymentStatus,
    reset: reset,
  }
}
