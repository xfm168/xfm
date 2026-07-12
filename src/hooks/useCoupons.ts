/**
 * useCoupons — 优惠券 Hook
 * 暂时使用 localStorage 模拟后端
 */

import { useState, useCallback } from 'react'
import type { Coupon } from '../lib/business/types'

const STORAGE_KEY = 'xuanfengmen_coupons'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface UseCouponsResult {
  status: Status
  coupons: Coupon[]
  error: string | null
  applyCoupon: (code: string) => Coupon | null
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

  var applyCoupon = useCallback(function(code: string): Coupon | null {
    try {
      setStatus('loading')
      setError(null)

      var normalizedCode = code.trim().toUpperCase()
      if (!normalizedCode) {
        setError('请输入优惠券码')
        setStatus('error')
        return null
      }

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

  var loadCoupons = useCallback(function() {
    try {
      setStatus('loading')
      setError(null)
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
