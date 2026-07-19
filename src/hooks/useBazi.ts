import { useState, useCallback } from 'react'
import { calculateBaZi, calculateBaZiFromBirthData, type BaZiChart, type BirthInfo } from '../lib/bazi'
import type { BirthData } from '@/lib/core'

const STORAGE_KEY = 'xuanfengmen_bazi_charts'
const FAVORITES_KEY = 'xuanfengmen_bazi_favorites'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface UseBaziResult {
  status: Status
  chart: BaZiChart | null
  error: string | null
  charts: BaZiChart[]
  calculateChart: (info: BirthInfo) => void
  calculateChartFromBirthData: (data: BirthData) => void
  saveChart: (chart: BaZiChart) => void
  loadCharts: () => void
  deleteChart: (createdAt: number) => void
  clearAllCharts: () => void
  toggleFavorite: (createdAt: number) => void
  getFavorites: () => BaZiChart[]
  isFavorite: (createdAt: number) => boolean
}

function loadFromStorage(): BaZiChart[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as BaZiChart[]
  } catch {
    return []
  }
}

function saveToStorage(charts: BaZiChart[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(charts))
  } catch {
  }
}

// ===== 收藏功能辅助 =====

function loadFavorites(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return []
    return JSON.parse(raw) as number[]
  } catch {
    return []
  }
}

function saveFavorites(ids: number[]) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  } catch {
    // 静默失败
  }
}

export function useBazi(): UseBaziResult {
  const [status, setStatus] = useState<Status>('idle')
  const [chart, setChart] = useState<BaZiChart | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [charts, setCharts] = useState<BaZiChart[]>(() => loadFromStorage())

  const calculateChart = useCallback((info: BirthInfo) => {
    try {
      setStatus('loading')
      setError(null)
      const result = calculateBaZi(info)
      setChart(result)
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : '排盘失败')
      setStatus('error')
    }
  }, [])

  const calculateChartFromBirthData = useCallback((data: BirthData) => {
    try {
      setStatus('loading')
      setError(null)
      const result = calculateBaZiFromBirthData(data)
      setChart(result)
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : '排盘失败')
      setStatus('error')
    }
  }, [])

  const saveChart = useCallback((newChart: BaZiChart) => {
    setCharts(prev => {
      const exists = prev.some(c => c.createdAt === newChart.createdAt)
      if (exists) return prev
      const updated = [newChart, ...prev].slice(0, 20)
      saveToStorage(updated)
      return updated
    })
  }, [])

  const loadCharts = useCallback(() => {
    const data = loadFromStorage()
    setCharts(data)
  }, [])

  const deleteChart = useCallback((createdAt: number) => {
    setCharts(prev => {
      const updated = prev.filter(c => c.createdAt !== createdAt)
      saveToStorage(updated)
      return updated
    })
  }, [])

  const clearAllCharts = useCallback(() => {
    setCharts([])
    saveToStorage([])
  }, [])

  /** 切换收藏状态 */
  const toggleFavorite = useCallback((createdAt: number) => {
    const ids = loadFavorites()
    const idx = ids.indexOf(createdAt)
    if (idx >= 0) {
      ids.splice(idx, 1)
    } else {
      ids.push(createdAt)
    }
    saveFavorites(ids)
  }, [])

  /** 获取所有收藏的命盘 */
  const getFavorites = useCallback((): BaZiChart[] => {
    const ids = loadFavorites()
    return ids
      .map(id => charts.find(c => c.createdAt === id))
      .filter((c): c is BaZiChart => c !== undefined)
  }, [charts])

  /** 判断是否已收藏 */
  const isFavorite = useCallback((createdAt: number): boolean => {
    const ids = loadFavorites()
    return ids.includes(createdAt)
  }, [])

  return {
    status,
    chart,
    error,
    charts,
    calculateChart,
    calculateChartFromBirthData,
    saveChart,
    loadCharts,
    deleteChart,
    clearAllCharts,
    toggleFavorite,
    getFavorites,
    isFavorite,
  }
}
