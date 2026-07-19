/**
 * useAdminDashboard -- V1.2 管理员数据看板 Hook
 *
 * 调用真实管理员 API 获取运营数据，替代 mockData。
 * 状态：idle -> loading -> ready / error
 */

import { useState, useCallback, useEffect } from 'react'
import { fetchOverview, fetchDaily, fetchRetention, fetchConversion, fetchTrends } from '../lib/dashboard/adminApi'
import type { OverviewData } from '../lib/dashboard/types'
import type { AdminDailyMetric } from '../lib/dashboard/types'
import type { RetentionData } from '../lib/dashboard/types'
import type { ConversionData } from '../lib/dashboard/types'
import type { TrendsData } from '../lib/dashboard/types'

type AdminDashboardStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AdminDashboardState {
  status: AdminDashboardStatus
  overview: OverviewData | null
  dailyData: AdminDailyMetric[]
  retention: RetentionData | null
  conversion: ConversionData | null
  trends: TrendsData | null
  error: string | null
}

interface AdminDashboardResult {
  status: AdminDashboardStatus
  overview: OverviewData | null
  dailyData: AdminDailyMetric[]
  retention: RetentionData | null
  conversion: ConversionData | null
  trends: TrendsData | null
  error: string | null
  refresh: () => void
}

var initialState: AdminDashboardState = {
  status: 'idle',
  overview: null,
  dailyData: [],
  retention: null,
  conversion: null,
  trends: null,
  error: null
}

function useAdminDashboard(): AdminDashboardResult {
  var stateHook = useState<AdminDashboardState>(initialState)
  var state = stateHook[0]
  var setState = stateHook[1]

  var loadAll = useCallback(function() {
    setState(function(prev) {
      return {
        status: 'loading',
        overview: prev.overview,
        dailyData: prev.dailyData,
        retention: prev.retention,
        conversion: prev.conversion,
        trends: prev.trends,
        error: null
      }
    })

    var pOverview = fetchOverview()
    var pDaily = fetchDaily(30)
    var pRetention = fetchRetention()
    var pConversion = fetchConversion()
    var pTrends = fetchTrends(30)

    Promise.all([pOverview, pDaily, pRetention, pConversion, pTrends])
      .then(function(results) {
        var overview = results[0]
        var daily = results[1]
        var retention = results[2]
        var conversion = results[3]
        var trends = results[4]

        if (!overview && !daily && !retention && !conversion && !trends) {
          setState(function(prev) {
            return {
              status: 'error',
              overview: prev.overview,
              dailyData: prev.dailyData,
              retention: prev.retention,
              conversion: prev.conversion,
              trends: prev.trends,
              error: '加载运营数据失败'
            }
          })
          return
        }

        setState({
          status: 'ready',
          overview: overview,
          dailyData: daily || [],
          retention: retention,
          conversion: conversion,
          trends: trends,
          error: null
        })
      })
      .catch(function() {
        setState(function(prev) {
          return {
            status: 'error',
            overview: prev.overview,
            dailyData: prev.dailyData,
            retention: prev.retention,
            conversion: prev.conversion,
            trends: prev.trends,
            error: '加载运营数据失败'
          }
        })
      })
  }, [])

  var refresh = useCallback(function() {
    loadAll()
  }, [loadAll])

  useEffect(function() {
    if (state.status === 'idle') {
      loadAll()
    }
  }, [state.status, loadAll])

  return {
    status: state.status,
    overview: state.overview,
    dailyData: state.dailyData,
    retention: state.retention,
    conversion: state.conversion,
    trends: state.trends,
    error: state.error,
    refresh: refresh
  }
}

export default useAdminDashboard