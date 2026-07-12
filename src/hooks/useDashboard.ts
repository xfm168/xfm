import { useState, useCallback, useEffect } from 'react'
import { DashboardMetrics, DailyMetric } from '../lib/dashboard/types'
import { getDashboardMetrics, getDailyMetrics } from '../lib/dashboard/mockData'

type DashboardStatus = 'idle' | 'loading' | 'ready' | 'error'

interface DashboardState {
  status: DashboardStatus
  metrics: DashboardMetrics | null
  dailyData: DailyMetric[]
  error: string | null
}

interface DashboardResult {
  status: DashboardStatus
  metrics: DashboardMetrics | null
  dailyData: DailyMetric[]
  error: string | null
  refreshMetrics: () => void
  getDailyData: () => DailyMetric[]
}

function useDashboard(): DashboardResult {
  var initialState: DashboardState = {
    status: 'idle',
    metrics: null,
    dailyData: [],
    error: null
  }

  var stateHook = useState<DashboardState>(initialState)
  var state = stateHook[0]
  var setState = stateHook[1]

  var loadMetrics = useCallback(function() {
    setState(function(prev) {
      return {
        status: 'loading',
        metrics: prev.metrics,
        dailyData: prev.dailyData,
        error: null
      }
    })

    // 模拟异步加载
    setTimeout(function() {
      try {
        var metrics = getDashboardMetrics()
        var daily = getDailyMetrics()
        setState({
          status: 'ready',
          metrics: metrics,
          dailyData: daily,
          error: null
        })
      } catch (e) {
        setState(function(prev) {
          return {
            status: 'error',
            metrics: prev.metrics,
            dailyData: prev.dailyData,
            error: '加载运营数据失败'
          }
        })
      }
    }, 300)
  }, [])

  var refreshMetrics = useCallback(function() {
    loadMetrics()
  }, [loadMetrics])

  var getDailyData = useCallback(function(): DailyMetric[] {
    return state.dailyData
  }, [state.dailyData])

  useEffect(function() {
    if (state.status === 'idle') {
      loadMetrics()
    }
  }, [state.status, loadMetrics])

  return {
    status: state.status,
    metrics: state.metrics,
    dailyData: state.dailyData,
    error: state.error,
    refreshMetrics: refreshMetrics,
    getDailyData: getDailyData
  }
}

export default useDashboard
