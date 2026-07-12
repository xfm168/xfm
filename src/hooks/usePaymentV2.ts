/**
 * usePaymentV2 -- V1.1-A 支付 Hook
 *
 * 调用服务端支付 API：
 *   - createOrder      创建订单
 *   - confirmPayment   确认支付
 *   - requestRefund    申请退款
 *   - getOrders        获取订单列表
 *   - getOrderDetail   获取订单详情
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type {
  Order,
  V11Payment,
  Refund,
  OrderProductType,
  V11PaymentStatus,
} from '../lib/database/types'

type PaymentStatusType = 'idle' | 'loading' | 'success' | 'error'

interface UsePaymentV2Result {
  orders: Order[]
  currentOrder: Order | null
  currentPayments: V11Payment[]
  currentRefunds: Refund[]
  paymentStatus: PaymentStatusType
  error: string | null
  loading: boolean
  createOrder: (
    productType: OrderProductType,
    productId: string,
    amountCents: number
  ) => Promise<Order | null>
  confirmPayment: (orderId: string, paymentMethod: V11PaymentMethod) => Promise<Order | null>
  requestRefund: (orderId: string, reason: string) => Promise<Refund | null>
  getOrders: () => Promise<Order[]>
  getOrderDetail: (orderId: string) => Promise<Order | null>
}

type V11PaymentMethod = 'wechat' | 'alipay' | 'stripe'

var supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
var supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

var supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

var API_BASE = '/api/payment'

/** 通用 fetch 封装（带 Bearer token） */
async function apiFetch(path: string, options: Record<string, unknown> = {}): Promise<any> {
  var url = API_BASE + path
  var headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // 附加 Bearer token
  if (supabaseClient) {
    var session = await supabaseClient.auth.getSession()
    var token = session.data.session ? session.data.session.access_token : ''
    if (token) {
      headers['Authorization'] = 'Bearer ' + token
    }
  }

  var fetchOptions: Record<string, unknown> = {
    method: options.method || 'GET',
    headers: headers,
  }

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  var res = await fetch(url, fetchOptions as RequestInit)
  var json = await res.json()

  if (!res.ok) {
    var errMsg = json && json.error && json.error.message
      ? json.error.message
      : '请求失败'
    throw new Error(errMsg)
  }

  return json
}

export function usePaymentV2(): UsePaymentV2Result {
  var ordersHook = useState<Order[]>([])
  var orders = ordersHook[0]
  var setOrders = ordersHook[1]

  var currentOrderHook = useState<Order | null>(null)
  var currentOrder = currentOrderHook[0]
  var setCurrentOrder = currentOrderHook[1]

  var currentPaymentsHook = useState<V11Payment[]>([])
  var currentPayments = currentPaymentsHook[0]
  var setCurrentPayments = currentPaymentsHook[1]

  var currentRefundsHook = useState<Refund[]>([])
  var currentRefunds = currentRefundsHook[0]
  var setCurrentRefunds = currentRefundsHook[1]

  var paymentStatusHook = useState<PaymentStatusType>('idle')
  var paymentStatus = paymentStatusHook[0]
  var setPaymentStatus = paymentStatusHook[1]

  var errorHook = useState<string | null>(null)
  var error = errorHook[0]
  var setError = errorHook[1]

  var loadingHook = useState<boolean>(false)
  var loading = loadingHook[0]
  var setLoading = loadingHook[1]

  /** 创建订单 */
  var createOrder = useCallback(async function(
    productType: OrderProductType,
    productId: string,
    amountCents: number
  ): Promise<Order | null> {
    setLoading(true)
    setError(null)
    setPaymentStatus('loading')
    try {
      var res = await apiFetch('/create-order', {
        method: 'POST',
        body: {
          product_type: productType,
          product_id: productId,
          discount_cents: 0,
        },
      })
      if (res.success && res.order) {
        setCurrentOrder(res.order)
        setPaymentStatus('success')
        return res.order
      }
      setError('创建订单失败')
      setPaymentStatus('error')
      return null
    } catch (e) {
      var msg = e instanceof Error ? e.message : '创建订单失败'
      setError(msg)
      setPaymentStatus('error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 确认支付 */
  var confirmPayment = useCallback(async function(
    orderId: string,
    paymentMethod: V11PaymentMethod
  ): Promise<Order | null> {
    setLoading(true)
    setError(null)
    setPaymentStatus('loading')
    try {
      var res = await apiFetch('/confirm', {
        method: 'POST',
        body: {
          order_id: orderId,
          payment_method: paymentMethod,
        },
      })
      if (res.success && res.order) {
        setCurrentOrder(res.order)
        // 刷新订单列表
        getOrders().catch(function() {})
        setPaymentStatus('success')
        return res.order
      }
      setError('确认支付失败')
      setPaymentStatus('error')
      return null
    } catch (e) {
      var msg = e instanceof Error ? e.message : '确认支付失败'
      setError(msg)
      setPaymentStatus('error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 申请退款 */
  var requestRefund = useCallback(async function(
    orderId: string,
    reason: string
  ): Promise<Refund | null> {
    setLoading(true)
    setError(null)
    try {
      var res = await apiFetch('/refund', {
        method: 'POST',
        body: {
          order_id: orderId,
          reason: reason,
        },
      })
      if (res.success && res.refund) {
        setCurrentRefunds([res.refund])
        return res.refund
      }
      setError('申请退款失败')
      return null
    } catch (e) {
      var msg = e instanceof Error ? e.message : '申请退款失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 获取订单列表 */
  var getOrders = useCallback(async function(): Promise<Order[]> {
    setLoading(true)
    setError(null)
    try {
      var res = await apiFetch('/orders')
      if (res.success && res.orders) {
        setOrders(res.orders)
        return res.orders
      }
      return []
    } catch (e) {
      var msg = e instanceof Error ? e.message : '获取订单失败'
      setError(msg)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  /** 获取订单详情 */
  var getOrderDetail = useCallback(async function(orderId: string): Promise<Order | null> {
    setLoading(true)
    setError(null)
    try {
      var res = await apiFetch('/orders/' + orderId)
      if (res.success && res.order) {
        setCurrentOrder(res.order)
        setCurrentPayments(res.payments || [])
        setCurrentRefunds(res.refunds || [])
        return res.order
      }
      setError('获取订单详情失败')
      return null
    } catch (e) {
      var msg = e instanceof Error ? e.message : '获取订单详情失败'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    orders: orders,
    currentOrder: currentOrder,
    currentPayments: currentPayments,
    currentRefunds: currentRefunds,
    paymentStatus: paymentStatus,
    error: error,
    loading: loading,
    createOrder: createOrder,
    confirmPayment: confirmPayment,
    requestRefund: requestRefund,
    getOrders: getOrders,
    getOrderDetail: getOrderDetail,
  }
}
