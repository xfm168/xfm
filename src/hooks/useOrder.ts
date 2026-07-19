/**
 * useOrder — 订单管理 Hook
 * 优先调用后端 API，localStorage 作为缓存/降级
 */

import { useState, useCallback } from 'react'
import type { PaymentProductType } from '../lib/database/types'
import type { Order } from '../lib/business/types'

const STORAGE_KEY = 'xuanfengmen_orders'
var API_BASE = '/api/payment'

/** 从 localStorage 获取 Supabase access_token */
function getToken(): string {
  try {
    var raw = localStorage.getItem('sb-xuanfengmen-auth-token')
    if (raw) {
      var parsed = JSON.parse(raw)
      if (parsed && parsed.access_token) return parsed.access_token
    }
  } catch {}
  return ''
}

/** 通用 fetch 封装（带 Bearer token） */
async function apiFetch(path: string, options: Record<string, unknown> = {}): Promise<any> {
  var url = API_BASE + path
  var token = getToken()
  var headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = 'Bearer ' + token

  var fetchOptions: Record<string, unknown> = { method: options.method || 'GET', headers: headers }
  if (options.body !== undefined) fetchOptions.body = JSON.stringify(options.body)

  var res = await fetch(url, fetchOptions as RequestInit)
  var json = await res.json()

  if (!res.ok) {
    var errMsg = json && json.error && json.error.message ? json.error.message : '请求失败'
    throw new Error(errMsg)
  }
  return json
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface UseOrderResult {
  status: Status
  orders: Order[]
  error: string | null
  createOrder: (
    productType: PaymentProductType,
    productId: string,
    amountCents: number
  ) => Promise<Order | null>
  cancelOrder: (orderId: string) => boolean
  getOrderHistory: () => Promise<Order[]>
}

function loadFromStorage(): Order[] {
  try {
    var raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Order[]
  } catch {
    return []
  }
}

function saveToStorage(orders: Order[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    // 静默失败
  }
}

function generateId(): string {
  var now = Date.now()
  var rand = Math.floor(Math.random() * 10000)
  var randStr = String(rand)
  while (randStr.length < 4) {
    randStr = '0' + randStr
  }
  return String(now) + randStr
}

function getProductDefaultName(productType: PaymentProductType): string {
  var names: Record<string, string> = {
    'membership': '会员订阅',
    'report': '命理报告',
    'addon': '增值服务',
    'credits': 'AI积分充值',
  }
  return names[productType] || '商品'
}

export function useOrder(): UseOrderResult {
  var statusHook = useState<Status>('idle')
  var status = statusHook[0]
  var setStatus = statusHook[1]

  var errorHook = useState<string | null>(null)
  var error = errorHook[0]
  var setError = errorHook[1]

  var ordersHook = useState<Order[]>(function() { return loadFromStorage() })
  var orders = ordersHook[0]
  var setOrders = ordersHook[1]

  var createOrder = useCallback(async function(
    productType: PaymentProductType,
    productId: string,
    amountCents: number
  ): Promise<Order | null> {
    setStatus('loading')
    setError(null)

    try {
      var json = await apiFetch('/create-order', {
        method: 'POST',
        body: {
          product_type: productType,
          product_id: productId,
          amount_cents: amountCents,
        },
      })
      if (json.success && json.order) {
        var newOrder: Order = json.order
        setOrders(function(prev) {
          var updated = [newOrder, ...prev]
          saveToStorage(updated)
          return updated
        })
        setStatus('ready')
        return newOrder
      }
    } catch (e) {
      // API 失败，降级到本地创建
    }

    try {
      var now = new Date().toISOString()
      var newOrder: Order = {
        id: generateId(),
        user_id: '',
        order_no: generateId(),
        product_type: productType,
        product_id: productId,
        amount_cents: amountCents,
        currency: 'CNY',
        payment_method: null,
        payment_provider_order_id: null,
        payment_provider_transaction_id: null,
        paid_at: null,
        status: 'pending',
        metadata: null,
        created_at: now,
        updated_at: now,
        productName: getProductDefaultName(productType),
        pointsEarned: Math.floor(amountCents / 100),
        couponCode: null,
        couponDiscount: 0,
      }

      setOrders(function(prev) {
        var updated = [newOrder, ...prev]
        saveToStorage(updated)
        return updated
      })
      setStatus('ready')
      return newOrder
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建订单失败')
      setStatus('error')
      return null
    }
  }, [])

  var cancelOrder = useCallback(function(orderId: string): boolean {
    try {
      setStatus('loading')
      setError(null)
      var found = false

      setOrders(function(prev) {
        var updated = prev.map(function(order) {
          if (order.id === orderId && order.status === 'pending') {
            found = true
            return Object.assign({}, order, {
              status: 'cancelled' as const,
              updated_at: new Date().toISOString(),
            })
          }
          return order
        })
        saveToStorage(updated)
        return updated
      })

      setStatus('ready')
      return found
    } catch (e) {
      setError(e instanceof Error ? e.message : '取消订单失败')
      setStatus('error')
      return false
    }
  }, [])

  var getOrderHistory = useCallback(async function(): Promise<Order[]> {
    try {
      var json = await apiFetch('/orders')
      if (json.success && json.orders) {
        var apiOrders: Order[] = json.orders
        setOrders(apiOrders)
        saveToStorage(apiOrders)
        return apiOrders
      }
    } catch (e) {
      // API 失败，降级到 localStorage
    }
    return loadFromStorage().sort(function(a, b) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [])

  return {
    status: status,
    orders: orders,
    error: error,
    createOrder: createOrder,
    cancelOrder: cancelOrder,
    getOrderHistory: getOrderHistory,
  }
}
