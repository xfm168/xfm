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
 *     use_solar_time?: boolean         // 是否使用真太阳时，默认 true
 *   }
 *
 * 响应：
 *   { chart: BaZiChart, meta: { strategy, use_solar_time, generated_at } }
 */

import { Hono } from 'hono'
import { calculateBaZi } from '../../lib/bazi/calculator'
import type { BirthInfo, BaZiChart } from '../../lib/bazi/types'
import { ApiError } from '../middleware/error'

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
}

app.post('/', async (c) => {
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

  // ── 调用排盘算法 ──────────────────────────
  // P0-② 已接入子时换日策略：late(默认)/early/gregorian
  const birthInfo: BirthInfo = {
    birthDate: birth_date,
    birthTime: body.birth_time as string,
    gender,
    ...(typeof body.timezone === 'string' ? { timezone: body.timezone } : {}),
    ...(typeof body.birthplace === 'string' ? { region: body.birthplace } : {}),
    solarTime: useSolarTime,
  }

  let chart: BaZiChart
  try {
    chart = calculateBaZi(birthInfo, { ziShiStrategy: strategy })
  } catch (err) {
    console.error('[bazi] 排盘失败:', err)
    throw ApiError.internal('排盘计算失败', {
      ...(err instanceof Error ? { message: err.message } : {}),
    })
  }

  return c.json({
    chart,
    meta: {
      strategy,
      use_solar_time: useSolarTime,
      generated_at: Date.now(),
    },
  })
})

export default app
