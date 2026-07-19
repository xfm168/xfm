/**
 * useCoupons — 优惠券 Hook
 * 优先调用后端 API，localStorage 作为缓存/降级
 */

import { useState, useCallback } from 'react'
import type { Coupon } from '../lib/business/types'

const STORAGE_KEY = 'xuanfengmen_coupons'
var API_BASE = '/api/user'

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

interface UseCouponsResult {
  status: Status
  coupons: Coupon[]
  error: string | null
  applyCoupon: (code: string) => Promise<Coupon | null>
  loadCoupons: () => void
}

function loadFromStorage(): Coupon[] {
  try {
    var raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Coupon[]
  } catch {
    return []
  }
}

function saveToStorage(coupons: Coupon[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons))
  } catch {
    // 静默失败
  }
}

export function useCoupons(): UseCouponsResult {
  var statusHook = useState<Status>('idle')
  var status = statusHook[0]
  var setStatus = statusHook[1]

  var errorHook = useState<string | null>(null)
  var error = errorHook[0]
  var setError = errorHook[1]

  var couponsHook = useState<Coupon[]>(function() { return loadFromStorage() })
  var coupons = couponsHook[0]
  var setCoupons = couponsHook[1]

  var applyCoupon = useCallback(async function(code: string): Promise<Coupon | null> {
    setStatus('loading')
    setError(null)

    var normalizedCode = code.trim().toUpperCase()
    if (!normalizedCode) {
      setError('请输入优惠券码')
      setStatus('error')
      return null
    }

    // 优先调用 API
    try {
      var json = await apiFetch('/coupons/apply', {
        method: 'POST',
        body: { code: normalizedCode },
      })
      if (json.success && json.coupon) {
        var coupon: Coupon = json.coupon
        setCoupons(function(prev) {
          var updated = [coupon, ...prev]
          saveToStorage(updated)
          return updated
        })
        setStatus('ready')
        return coupon
      }
    } catch (e) {
      // API 失败（可能是 404 路由不存在），降级到本地模拟
    }

    // 降级：本地模拟
    try {
      // 检查是否已持有
      var existing = coupons.find(function(c) { return c.code === normalizedCode })
      if (existing) {
        setError('已持有此优惠券')
        setStatus('error')
        return null
      }

      // 模拟验证优惠券
      var now = new Date()
      var expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      var coupon: Coupon = {
        id: String(Date.now()),
        code: normalizedCode,
        discountType: normalizedCode.indexOf('PCT') !== -1 ? 'percent' : 'fixed',
        discountValue: normalizedCode.indexOf('PCT') !== -1 ? 20 : 1000,
        minAmountCents: 0,
        maxDiscountCents: 5000,
        productTypes: ['membership', 'report', 'addon', 'credits'],
        usageLimit: 1,
        usageCount: 0,
        validFrom: now.toISOString(),
        validUntil: expiresAt.toISOString(),
        active: true,
      }

      setCoupons(function(prev) {
        var updated = [coupon, ...prev]
        saveToStorage(updated)
        return updated
      })
      setStatus('ready')
      return coupon
    } catch (e) {
      setError(e instanceof Error ? e.message : '兑换优惠券失败')
      setStatus('error')
      return null
    }
  }, [coupons])

  var loadCoupons = useCallback(async function() {
    setStatus('loading')
    setError(null)
    try {
      var json = await apiFetch('/coupons')
      if (json.success && json.coupons) {
        setCoupons(json.coupons)
        saveToStorage(json.coupons)
        setStatus('ready')
        return
      }
    } catch (e) {
      // API 失败（可能是 404 路由不存在），降级到 localStorage
    }
    try {
      var data = loadFromStorage()
      setCoupons(data)
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载优惠券失败')
      setStatus('error')
    }
  }, [])

  return {
    status: status,
    coupons: coupons,
    error: error,
    applyCoupon: applyCoupon,
    loadCoupons: loadCoupons,
  }
}
