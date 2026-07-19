/**
 * usePoints — 积分管理 Hook
 * 优先调用后端 API，localStorage 作为缓存/降级
 */

import { useState, useCallback } from 'react'
import type { PointsTransaction } from '../lib/business/types'

const STORAGE_KEY = 'xuanfengmen_points'
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

interface PointsData {
  balance: number
  transactions: PointsTransaction[]
}

interface UsePointsResult {
  status: Status
  balance: number
  transactions: PointsTransaction[]
  error: string | null
  refreshPoints: () => Promise<void>
  addPoints: (amount: number, source: string, description: string) => boolean
  spendPoints: (amount: number, source: string, description: string) => boolean
  getTransactions: () => PointsTransaction[]
}

function loadFromStorage(): PointsData {
  try {
    var raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { balance: 0, transactions: [] }
    return JSON.parse(raw) as PointsData
  } catch {
    return { balance: 0, transactions: [] }
  }
}

function saveToStorage(data: PointsData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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

export function usePoints(): UsePointsResult {
  var initData = loadFromStorage()

  var balanceHook = useState<number>(initData.balance)
  var balance = balanceHook[0]
  var setBalance = balanceHook[1]

  var transactionsHook = useState<PointsTransaction[]>(initData.transactions)
  var transactions = transactionsHook[0]
  var setTransactions = transactionsHook[1]

  var statusHook = useState<Status>('idle')
  var status = statusHook[0]
  var setStatus = statusHook[1]

  var errorHook = useState<string | null>(null)
  var error = errorHook[0]
  var setError = errorHook[1]

  var addPoints = useCallback(function(
    amount: number,
    source: string,
    description: string
  ): boolean {
    try {
      setStatus('loading')
      setError(null)

      if (amount <= 0) {
        setError('积分数量必须大于0')
        setStatus('error')
        return false
      }

      var newBalance = balance + amount
      var tx: PointsTransaction = {
        id: generateId(),
        userId: '',
        amount: amount,
        type: 'earn',
        source: source,
        description: description,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
      }

      setBalance(newBalance)
      setTransactions(function(prev) {
        var updated = [tx, ...prev]
        saveToStorage({ balance: newBalance, transactions: updated })
        return updated
      })
      setStatus('ready')
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '增加积分失败')
      setStatus('error')
      return false
    }
  }, [balance])

  var spendPoints = useCallback(function(
    amount: number,
    source: string,
    description: string
  ): boolean {
    try {
      setStatus('loading')
      setError(null)

      if (amount <= 0) {
        setError('积分数量必须大于0')
        setStatus('error')
        return false
      }

      if (amount > balance) {
        setError('积分余额不足')
        setStatus('error')
        return false
      }

      var newBalance = balance - amount
      var tx: PointsTransaction = {
        id: generateId(),
        userId: '',
        amount: -amount,
        type: 'spend',
        source: source,
        description: description,
        balanceAfter: newBalance,
        createdAt: new Date().toISOString(),
      }

      setBalance(newBalance)
      setTransactions(function(prev) {
        var updated = [tx, ...prev]
        saveToStorage({ balance: newBalance, transactions: updated })
        return updated
      })
      setStatus('ready')
      return true
    } catch (e) {
      setError(e instanceof Error ? e.message : '消费积分失败')
      setStatus('error')
      return false
    }
  }, [balance])

  var getTransactions = useCallback(function(): PointsTransaction[] {
    var data = loadFromStorage()
    return data.transactions.sort(function(a, b) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [])

  var refreshPoints = useCallback(async function() {
    setStatus('loading')
    setError(null)
    try {
      var json = await apiFetch('/points')
      if (json.success && json.points) {
        var p = json.points
        setBalance(p.balance)
        setTransactions(p.transactions || [])
        saveToStorage({ balance: p.balance, transactions: p.transactions || [] })
        setStatus('ready')
        return
      }
    } catch (e) {
      // API 失败，降级到 localStorage
    }
    try {
      var data = loadFromStorage()
      setBalance(data.balance)
      setTransactions(data.transactions)
      setStatus('ready')
    } catch (e) {
      setError(e instanceof Error ? e.message : '刷新积分失败')
      setStatus('error')
    }
  }, [])

  return {
    status: status,
    balance: balance,
    transactions: transactions,
    error: error,
    refreshPoints: refreshPoints,
    addPoints: addPoints,
    spendPoints: spendPoints,
    getTransactions: getTransactions,
  }
}
