/**
 * 支付后自动检测会员升级
 * 通过短轮询 /api/user/membership 实现
 *
 * 代码风格：var、单引号、字符串拼接
 */
import { useState, useEffect, useRef, useCallback } from 'react'

function usePaymentPolling(orderId: string | null, enabled: boolean) {
  var [upgraded, setUpgraded] = useState(false)
  var [polling, setPolling] = useState(false)
  var previousTier = useRef<string | null>(null)
  var timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function getToken(): string {
    try {
      var raw = localStorage.getItem('sb-xuanfengmen-auth-token')
      if (raw) {
        var parsed = JSON.parse(raw)
        return parsed.access_token || ''
      }
    } catch (e) {}
    return ''
  }

  var checkUpgrade = useCallback(async function() {
    try {
      var res = await fetch('/api/user/membership', {
        headers: { 'Authorization': 'Bearer ' + getToken() }
      })
      var json = await res.json()
      if (json.success && json.membership) {
        var newTier = json.membership.tier
        if (previousTier.current === null) {
          previousTier.current = newTier
        } else if (newTier !== previousTier.current) {
          // Tier 变化了！支付成功，会员已升级
          setUpgraded(true)
          setPolling(false)
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return true
        }
      }
    } catch (e) {}
    return false
  }, [])

  useEffect(function() {
    if (!enabled || !orderId) return

    setPolling(true)
    // 立即检查一次获取当前 tier
    checkUpgrade()
    // 每 2 秒轮询一次，最多 60 次（2 分钟）
    var count = 0
    timerRef.current = setInterval(function() {
      count++
      if (count > 60) {
        if (timerRef.current) clearInterval(timerRef.current)
        setPolling(false)
        return
      }
      checkUpgrade()
    }, 2000)

    return function() {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [enabled, orderId, checkUpgrade])

  return { upgraded: upgraded, polling: polling }
}

export { usePaymentPolling }
