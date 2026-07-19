/**
 * useProHistory -- 专业报告历史 Hook
 *
 * 封装专业报告历史的存取：
 *   - fetchHistory(page, limit)    查询历史列表
 *   - saveReport(chartId, data)    保存报告
 *   - getReport(id)                获取报告详情
 *   - migrateLocalData(items)      迁移 localStorage 旧数据
 *
 * 全部单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { ProReportData } from '../types/proReport'

// ─── 常量 ───

var PRO_REPORTS_API_BASE = '/api/pro-reports'

// ─── Supabase 客户端 ───

var supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
var supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
var supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ─── 类型 ───

interface ProHistoryItem {
  id: string
  chart_id: string | null
  engineVersion: string
  created_at: string
}

interface ProHistoryListResponse {
  items: ProHistoryItem[]
  total: number
  page: number
  limit: number
}

interface ProSaveResponse {
  success: boolean
  analysis_id: string
}

interface ProReportDetail {
  id: string
  analysis_type: string
  result: Record<string, unknown>
  created_at: string
}

interface MigrateResponse {
  success: boolean
  migrated: number
  skipped: number
  errors: string[]
}

interface LegacyItem {
  birth_date: string
  birth_time: string
  gender: string
  chart_data: Record<string, unknown>
  created_at: string
}

interface UseProHistoryResult {
  history: ProHistoryItem[]
  loading: boolean
  error: string | null
  totalCount: number
  fetchHistory: (page: number, limit: number) => Promise<ProHistoryListResponse | null>
  saveReport: (chartId: string | null, reportData: ProReportData) => Promise<ProSaveResponse | null>
  getReport: (id: string) => Promise<ProReportDetail | null>
  migrateLocalData: (items: LegacyItem[]) => Promise<MigrateResponse | null>
}

// ─── 通用 fetch 封装 ───

async function proReportsFetch(
  path: string,
  options: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  var url = PRO_REPORTS_API_BASE + path
  var headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (supabaseClient) {
    var session = await supabaseClient.auth.getSession()
    var token = session.data.session
      ? session.data.session.access_token
      : ''
    if (token) {
      headers['Authorization'] = 'Bearer ' + token
    }
  }

  var fetchOptions: Record<string, unknown> = {
    method: options.method || 'GET',
    headers: headers,
  }

  if (options.body !== undefined) {
    fetchOptions.body = JSON.stringify(options.body)
  }

  var res = await fetch(url, fetchOptions as RequestInit)
  var json = await res.json()

  if (!res.ok) {
    var errMsg = json && json.error && json.error.message
      ? json.error.message
      : '\u8BF7\u6C42\u5931\u8D25'
    throw new Error(errMsg)
  }

  return json as Record<string, unknown>
}

// ─── Hook ───

export function useProHistory(): UseProHistoryResult {
  var historyHook = useState<ProHistoryItem[]>([])
  var history = historyHook[0]
  var setHistory = historyHook[1]

  var loadingHook = useState<boolean>(false)
  var loading = loadingHook[0]
  var setLoading = loadingHook[1]

  var errorHook = useState<string | null>(null)
  var error = errorHook[0]
  var setError = errorHook[1]

  var totalCountHook = useState<number>(0)
  var totalCount = totalCountHook[0]
  var setTotalCount = totalCountHook[1]

  /** 查询专业报告历史列表 */
  var fetchHistory = useCallback(async function(
    page: number,
    limit: number,
  ): Promise<ProHistoryListResponse | null> {
    setLoading(true)
    setError(null)
    try {
      var query = '?page=' + String(page) + '&limit=' + String(limit)
      var rawResponse = await proReportsFetch(query, {
        method: 'GET',
      })

      var items = (rawResponse.items || []) as ProHistoryItem[]
      var total = (rawResponse.total as number) || 0

      setHistory(items)
      setTotalCount(total)

      return {
        items: items,
        total: total,
        page: (rawResponse.page as number) || page,
        limit: (rawResponse.limit as number) || limit,
      }
    } catch (e) {
      var msg = e instanceof Error ? e.message : '\u67E5\u8BE2\u5386\u53F2\u5931\u8D25'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 保存专业报告 */
  var saveReport = useCallback(async function(
    chartId: string | null,
    reportData: ProReportData,
  ): Promise<ProSaveResponse | null> {
    setLoading(true)
    setError(null)
    try {
      var rawResponse = await proReportsFetch('', {
        method: 'POST',
        body: {
          chart_id: chartId,
          report_data: reportData,
        },
      })

      var result = {
        success: !!(rawResponse.success),
        analysis_id: String(rawResponse.analysis_id || ''),
      }

      return result
    } catch (e) {
      var msg = e instanceof Error ? e.message : '\u4FDD\u5B58\u62A5\u544A\u5931\u8D25'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 获取单个报告详情 */
  var getReport = useCallback(async function(
    id: string,
  ): Promise<ProReportDetail | null> {
    setLoading(true)
    setError(null)
    try {
      var rawResponse = await proReportsFetch('/' + id, {
        method: 'GET',
      })

      var result: ProReportDetail = {
        id: String(rawResponse.id || ''),
        analysis_type: String(rawResponse.analysis_type || ''),
        result: (rawResponse.result || {}) as Record<string, unknown>,
        created_at: String(rawResponse.created_at || ''),
      }

      return result
    } catch (e) {
      var msg = e instanceof Error ? e.message : '\u83B7\u53D6\u62A5\u544A\u5931\u8D25'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /** 迁移 localStorage 旧数据 */
  var migrateLocalData = useCallback(async function(
    items: LegacyItem[],
  ): Promise<MigrateResponse | null> {
    setLoading(true)
    setError(null)
    try {
      var rawResponse = await proReportsFetch('/migrate', {
        method: 'POST',
        body: { items: items },
      })

      var result: MigrateResponse = {
        success: !!(rawResponse.success),
        migrated: (rawResponse.migrated as number) || 0,
        skipped: (rawResponse.skipped as number) || 0,
        errors: (rawResponse.errors || []) as string[],
      }

      return result
    } catch (e) {
      var msg = e instanceof Error ? e.message : '\u8FC1\u79FB\u6570\u636E\u5931\u8D25'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    history: history,
    loading: loading,
    error: error,
    totalCount: totalCount,
    fetchHistory: fetchHistory,
    saveReport: saveReport,
    getReport: getReport,
    migrateLocalData: migrateLocalData,
  }
}