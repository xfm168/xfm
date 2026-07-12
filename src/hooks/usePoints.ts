/**
 * usePoints — 积分管理 Hook
 * 暂时使用 localStorage 模拟后端
 */

import { useState, useCallback } from 'react'
import type { PointsTransaction } from '../lib/business/types'

const STORAGE_KEY = 'xuanfengmen_points'

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

  return {
    status: status,
    balance: balance,
    transactions: transactions,
    error: error,
    addPoints: addPoints,
    spendPoints: spendPoints,
    getTransactions: getTransactions,
  }
}
