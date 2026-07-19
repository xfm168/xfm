/**
 * 八字排盘路由
 *
 *   POST /api/bazi   —— 计算八字命盘
 *
 * 请求体：
 *   {
 *     birth_date: "1990-01-15",        // 公历日期 YYYY-MM-DD（必填）
 *     birth_time: "08:30",             // HH:MM（必填；birth_time_unknown=true 时可传空）
 *     gender: "male" | "female",       // 必填
 *     birthplace?: "北京",
 *     timezone?: "Asia/Shanghai",
 *     zishi_strategy?: "late" | "early" | "gregorian",  // 子时策略，默认 late
 *     use_solar_time?: boolean,         // 是否使用真太阳时，默认 true
 *     longitude?: number                // 出生地经度（东经为正），优先于 birthplace
 *   }
 *
 * 响应：
 *   { chart: BaZiChart, meta: { strategy, use_solar_time, generated_at } }
 */

import { Hono } from 'hono'
import { calculateBaZiFromBirthData } from '../../lib/bazi/calculator'
import type { BaZiChart } from '../../lib/bazi/types'
import { ApiError } from '../middleware/error'
import { BirthData } from '@/lib/core'
import { authOptional } from '../middleware/auth'
import { getTierLimits } from '../../lib/domain/usageLimit'

const app = new Hono()

/** 校验 YYYY-MM-DD */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
/** 校验 HH:MM */
const TIME_RE = /^\d{2}:\d{2}$/

interface BaziRequestBody {
  birth_date?: unknown
  birth_time?: unknown
  gender?: unknown
  birthplace?: unknown
  timezone?: unknown
  zishi_strategy?: unknown
  use_solar_time?: unknown
  birth_time_unknown?: unknown
  longitude?: unknown
}

app.post('/', authOptional, async (c) => {
  let body: BaziRequestBody
  try {
    body = await c.req.json()
  } catch {
    throw ApiError.badRequest('请求体不是合法的 JSON')
  }

  if (!body || typeof body !== 'object') {
    throw ApiError.badRequest('请求体不能为空')
  }

  // ── 参数校验 ──────────────────────────────
  const { birth_date, birth_time, gender } = body

  if (typeof birth_date !== 'string' || !DATE_RE.test(birth_date)) {
    throw ApiError.validationError('birth_date 必须为 YYYY-MM-DD 格式', { field: 'birth_date' })
  }

  const birthTimeUnknown = body.birth_time_unknown === true
  if (!birthTimeUnknown) {
    if (typeof birth_time !== 'string' || !TIME_RE.test(birth_time)) {
      throw ApiError.validationError('birth_time 必须为 HH:MM 格式', { field: 'birth_time' })
    }
  } else if (typeof birth_time !== 'string' || !birth_time) {
    // 未知时辰时给一个中性占位（中午 12:00）
    body.birth_time = '12:00'
  }

  if (gender !== 'male' && gender !== 'female') {
    throw ApiError.validationError('gender 必须为 male 或 female', { field: 'gender' })
  }

  const strategy =
    body.zishi_strategy === 'early' || body.zishi_strategy === 'gregorian'
      ? body.zishi_strategy
      : 'late'

  const useSolarTime = typeof body.use_solar_time === 'boolean' ? body.use_solar_time : true

  // ── 使用次数限制检查（仅限已登录用户） ──────────────
  var authUser = c.get('user') as any
  if (authUser && authUser.id) {
    var tier = authUser.membership_tier || 'free'
    var limits = getTierLimits(tier)
    if (limits.dailyCharts < 999) {
      try {
        var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
        var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        if (supabaseUrl && supabaseServiceKey) {
          var { createClient } = await import('@supabase/supabase-js')
          var supabase = createClient(supabaseUrl, supabaseServiceKey)
          var todayStart = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          var { count } = await supabase
            .from('analysis_history')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', authUser.id)
            .gte('created_at', todayStart)
          if ((count || 0) >= limits.dailyCharts) {
            return c.json({
              error: 'UPGRADE_REQUIRED',
              message: '今日免费次数已用完，升级会员获取更多次数',
              currentUsage: count || 0,
              dailyLimit: limits.dailyCharts,
              requiredTier: 'basic',
            }, 429)
          }
        }
      } catch (usageErr) {
        // 使用次数查询失败不阻断排盘（降级策略）
        console.error('[bazi] 使用次数检查失败:', usageErr)
      }
    }
  }

  // ── 调用排盘算法 ──────────────────────────
  // P0-② 子时策略 + P0-③ 真太阳时
  const birthData: BirthData = {
    birthday: birth_date,
    birthTime: body.birth_time as string,
    gender,
    timezone: typeof body.timezone === 'string' ? body.timezone : undefined,
    location: typeof body.birthplace === 'string' ? body.birthplace : undefined,
    longitude: typeof body.longitude === 'number' ? body.longitude : undefined,
    useTrueSolarTime: useSolarTime,
    childHourStrategy: strategy,
    birthTimeUnknown: birthTimeUnknown,
  }

  let chart: BaZiChart
  try {
    chart = calculateBaZiFromBirthData(birthData)
  } catch (err) {
    console.error('[bazi] 排盘失败:', err)
    throw ApiError.internal('排盘计算失败', {
      ...(err instanceof Error ? { message: err.message } : {}),
    })
  }

  // ── 已登录用户：写入 charts 表，返回 chart_id ─────────────────
  var chartId: string | null = null
  if (authUser && authUser.id) {
    try {
      var supabaseUrl2 = process.env.VITE_SUPABASE_URL || ''
      var supabaseServiceKey2 = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      if (supabaseUrl2 && supabaseServiceKey2) {
        var { createClient: createClient2 } = await import('@supabase/supabase-js')
        var supabase2 = createClient2(supabaseUrl2, supabaseServiceKey2)
        var chartDataJson = JSON.stringify(chart)
        var { data: newChart, error: insertErr } = await supabase2
          .from('charts')
          .insert({
            user_id: authUser.id,
            name: body.birth_date + ' ' + (body.birth_time as string),
            birth_date: birth_date,
            birth_time: body.birth_time as string,
            gender: gender,
            birthplace: typeof body.birthplace === 'string' ? body.birthplace : null,
            timezone: typeof body.timezone === 'string' ? body.timezone : null,
            chart_data: chartDataJson,
          })
          .select('id')
          .single()
        if (!insertErr && newChart) {
          chartId = newChart.id
        } else if (insertErr) {
          console.error('[bazi] charts 写入失败:', insertErr.message)
        }
      }
    } catch (chartErr) {
      console.error('[bazi] charts 写入异常:', chartErr)
    }
  }

  return c.json({
    chart,
    chart_id: chartId,
    meta: {
      strategy,
      use_solar_time: useSolarTime,
      generated_at: Date.now(),
    },
  })
})

export default app
