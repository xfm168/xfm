/**
 * useProFeedback -- 专业报告反馈提交 Hook
 *
 * 调用 POST /api/pro-feedback 提交用户对报告的评价反馈
 *
 * 参考 useProReport 风格：var、单引号、concatenation
 * 约束：禁止 import { type X }，使用 import type { X } 单独语句
 * 约束：禁止 any，禁止 @ts-ignore
 */

import { useState, useCallback } from 'react'
import { supabase as supabaseClient } from '../lib/supabase'

// ─── 常量 ───

var FEEDBACK_API_ENDPOINT = '/api/pro-feedback'

// ─── 类型 ───

export interface ProFeedbackSubmitData {
  report_id: string
  user_id?: string | null
  chart_id?: string | null
  engine_version?: string
  tier?: string
  overall_rating: number
  dimension_ratings: {
    accuracy: number
    personality: number
    career: number
    wealth: number
    marriage: number
    health: number
  }
  most_accurate?: string
  improvement_suggestions?: string
  would_continue?: string
  is_anonymous?: boolean
}

interface UseProFeedbackReturn {
  submitting: boolean
  success: boolean
  error: string | null
  submitFeedback: (data: ProFeedbackSubmitData) => Promise<void>
  reset: () => void
}

// ─── Hook ───

export function useProFeedback(): UseProFeedbackReturn {
  var submittingState = useState<boolean>(false)
  var submitting = submittingState[0]
  var setSubmitting = submittingState[1]

  var successState = useState<boolean>(false)
  var success = successState[0]
  var setSuccess = successState[1]

  var errorState = useState<string | null>(null)
  var error = errorState[0]
  var setError = errorState[1]

  var submitFeedback = useCallback(async function(data: ProFeedbackSubmitData) {
    setSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
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

      var res = await fetch(FEEDBACK_API_ENDPOINT, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(data),
      })

      var json = await res.json()

      if (!res.ok) {
        var errMsg = '\u63D0\u4EA4\u53CD\u9988\u5931\u8D25'
        if (json && json.error && json.error.message) {
          errMsg = String(json.error.message)
        }
        setError(errMsg)
        return
      }

      if (!json.success) {
        setError('\u63D0\u4EA4\u53CD\u9988\u5931\u8D25')
        return
      }

      setSuccess(true)
    } catch (e) {
      var msg = e instanceof Error ? e.message : '\u63D0\u4EA4\u53CD\u9988\u5931\u8D25'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }, [])

  var reset = useCallback(function() {
    setSubmitting(false)
    setSuccess(false)
    setError(null)
  }, [])

  return {
    submitting: submitting,
    success: success,
    error: error,
    submitFeedback: submitFeedback,
    reset: reset,
  }
}
