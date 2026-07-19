/**
 * useGrowth -- 用户成长体系 Hook
 *
 * 管理签到、成长值、等级、徽章等状态
 * 单引号 + concatenation，禁止 backtick 模板字符串
 */

import { useState, useCallback, useEffect } from 'react'

var API_BASE = '/api/growth'

interface Badge {
  badgeKey: string
  badgeName: string
  badgeDesc: string | null
  badgeIcon: string | null
  earnedAt: string
}

interface GrowthStatus {
  checkinStreak: number
  lastCheckinDate: string | null
  chartsStreak: number
  growthPoints: number
  growthLevel: number
  totalCheckins: number
  todayCheckedIn: boolean
  badges: Badge[]
}

type GrowthStateStatus = 'idle' | 'loading' | 'ready' | 'error'

interface UseGrowthResult {
  status: GrowthStateStatus
  streak: number
  todayCheckedIn: boolean
  growthPoints: number
  growthLevel: number
  totalCheckins: number
  badges: Badge[]
  error: string | null
  checkIn: () => Promise<{ success: boolean; streak: number; reward: number; totalPoints: number; level: number; newBadges: Array<{ badgeKey: string; badgeName: string; badgeIcon: string }> }>
  refresh: () => Promise<void>
}

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
    var errMsg = json && json.error && json.error.message ? json.error.message : '\u8bf7\u6c42\u5931\u8d25'
    throw new Error(errMsg)
  }
  return json
}

export function useGrowth(): UseGrowthResult {
  var statusHook = useState<GrowthStateStatus>('idle')
  var status = statusHook[0]
  var setStatus = statusHook[1]

  var streakHook = useState(0)
  var streak = streakHook[0]
  var setStreak = streakHook[1]

  var todayCheckedInHook = useState(false)
  var todayCheckedIn = todayCheckedInHook[0]
  var setTodayCheckedIn = todayCheckedInHook[1]

  var growthPointsHook = useState(0)
  var growthPoints = growthPointsHook[0]
  var setGrowthPoints = growthPointsHook[1]

  var growthLevelHook = useState(1)
  var growthLevel = growthLevelHook[0]
  var setGrowthLevel = growthLevelHook[1]

  var totalCheckinsHook = useState(0)
  var totalCheckins = totalCheckinsHook[0]
  var setTotalCheckins = totalCheckinsHook[1]

  var badgesHook = useState<Badge[]>([])
  var badges = badgesHook[0]
  var setBadges = badgesHook[1]

  var errorHook = useState<string | null>(null)
  var error = errorHook[0]
  var setError = errorHook[1]

  var refresh = useCallback(async function() {
    setStatus('loading')
    setError(null)
    try {
      var json = await apiFetch('/status')
      var data = json as GrowthStatus
      setStreak(data.checkinStreak)
      setTodayCheckedIn(data.todayCheckedIn)
      setGrowthPoints(data.growthPoints)
      setGrowthLevel(data.growthLevel)
      setTotalCheckins(data.totalCheckins)
      setBadges(data.badges || [])
      setStatus('ready')
    } catch (e) {
      var msg = e instanceof Error ? e.message : '\u52a0\u8f7d\u6210\u957f\u72b6\u6001\u5931\u8d25'
      setError(msg)
      setStatus('error')
    }
  }, [])

  var checkIn = useCallback(async function() {
    setError(null)
    try {
      var json = await apiFetch('/checkin', { method: 'POST' })
      if (json.success) {
        setStreak(json.streak)
        setTodayCheckedIn(true)
        setGrowthPoints(json.totalPoints)
        setGrowthLevel(json.level)
        setTotalCheckins(function(prev) { return prev + 1 })
        // Refresh to get updated badges
        await refresh()
      }
      return json
    } catch (e) {
      var msg = e instanceof Error ? e.message : '\u7b7e\u5230\u5931\u8d25'
      setError(msg)
      return { success: false, streak: 0, reward: 0, totalPoints: 0, level: 1, newBadges: [] }
    }
  }, [refresh])

  useEffect(function() {
    refresh()
  }, [refresh])

  return {
    status: status,
    streak: streak,
    todayCheckedIn: todayCheckedIn,
    growthPoints: growthPoints,
    growthLevel: growthLevel,
    totalCheckins: totalCheckins,
    badges: badges,
    error: error,
    checkIn: checkIn,
    refresh: refresh
  }
}
