/**
 * Professional Master Report 路由
 *
 *   POST /api/pro/master-report   —— 调用 Professional Engine 生成完整命理报告
 *
 * 数据链路（严格遵守 Module 1~8 冻结，不修改任何算法）：
 *   BirthData → Module1 四柱 → Module2 神煞 → Module3 十神
 *           → Module4 格局 → Module5 喜用神 → Module6 大运流年
 *           → Module7 MasterReport → JSON 输出
 *
 * 请求体：
 *   {
 *     birth_date: "1990-01-15",
 *     birth_time: "08:30",
 *     gender: "male" | "female",
 *     birthplace?: "北京",
 *     timezone?: "Asia/Shanghai",
 *     zishi_strategy?: "late" | "early" | "gregorian",
 *     use_solar_time?: boolean,
 *     longitude?: number
 *   }
 *
 * 响应（含引擎中间模块数据，供前端 Data Contract 使用）：
 *   {
 *     success: true,
 *     data: {
 *       reportId: "pro_...",
 *       report: MasterReport,       // Module 7 完整输出
 *       _modules: {                 // 引擎中间结果
 *         pillars, shenSha, tenGods, pattern, xiYong, fortune
 *       },
 *       meta: { computeTimeMs, engineVersions },
 *       createdAt: "2026-07-17T..."
 *     }
 *   }
 */

import { Hono } from 'hono'
import {
  calculateProfessionalFourPillars,
  calculateShenSha,
  calculateTenGods,
  calculatePattern,
  calculateXiYong,
  calculateFortune,
  generateMasterReport,
  FOUR_PILLARS_VERSION,
  SHEN_SHA_ENGINE_VERSION,
  TEN_GODS_ENGINE_VERSION,
  PATTERN_ENGINE_VERSION,
  XIYONG_ENGINE_VERSION,
  FORTUNE_ENGINE_VERSION,
  MASTER_REPORT_VERSION,
} from '../../lib/bazi/pro'

import type { MasterReport } from '../../lib/bazi/pro/masterReportTypes'

import { ApiError } from '../middleware/error'
import { authRequired } from '../middleware/auth'
import { requireCapability } from '../middleware/permission'
import { BirthData } from '@/lib/core'
import { AnalysisType, AnalysisStatus, ENGINE_VERSION } from '../../shared/domain'

/** 获取 Supabase Admin 客户端（自动保存用） */
async function getSupabaseAdminForSave() {
  var supabaseUrl = process.env.VITE_SUPABASE_URL || ''
  var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!supabaseUrl || !supabaseServiceKey) {
    return null
  }
  var { createClient } = await import('@supabase/supabase-js')
  return createClient(supabaseUrl, supabaseServiceKey)
}

const app = new Hono()

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^\d{2}:\d{2}$/

interface ProReportRequestBody {
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

app.post('/', authRequired, requireCapability('PRO_ENGINE_ACCESS'), async (c) => {
  let body: ProReportRequestBody
  try {
    body = await c.req.json()
  } catch {
    throw ApiError.badRequest('请求体不是合法的 JSON')
  }

  if (!body || typeof body !== 'object') {
    throw ApiError.badRequest('请求体不能为空')
  }

  // ── 参数校验 ──
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

  // 性别映射：API 使用 male/female，Pro Engine 使用 男/女
  const genderCN = gender === 'male' ? '男' : '女'

  // ── 构建 BirthData ──
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

  const startTime = Date.now()

  try {
    // ── Module 1: 四柱排盘（Frozen）──
    const pillars = calculateProfessionalFourPillars(birthData)

    // ── Module 2: 神煞（Frozen v2.0）──
    const shenSha = calculateShenSha(pillars, {
      gender: genderCN,
    })

    // ── Module 3: 十神（Frozen v3.1.0）──
    const tenGods = calculateTenGods(pillars, {
      gender: genderCN,
    })

    // ── Module 4: 格局（Frozen v4.1.0）──
    const pattern = calculatePattern(pillars, tenGods, {
      gender: genderCN,
    })

    // ── Module 5: 喜用神（Frozen v5.0.0）──
    const xiYong = calculateXiYong(pillars, tenGods, pattern, {
      gender: genderCN,
    })

    // ── Module 6: 大运流年（Frozen v6.0.0）──
    const birthDateObj = new Date(birth_date + 'T' + (body.birth_time || '12:00') + ':00+08:00')
    const fortune = calculateFortune(pillars, tenGods, pattern, xiYong, {
      gender: genderCN,
      birthDate: birthDateObj,
    })

    // ── Module 7: MasterReport（Frozen v7.0.0）──
    const report: MasterReport = generateMasterReport(
      { pillars, shenSha, tenGods, pattern, xiYong, fortune },
      {
        gender: genderCN,
        birthYear: parseInt(birth_date.split('-')[0], 10),
        enableCrossValidation: true,
        enableTimeline: true,
        enableRiskEngine: true,
        enableOpportunityEngine: true,
        enableRecommendation: true,
        enableExplain: true,
      },
    )

    const totalComputeTimeMs = Date.now() - startTime

    // 生成唯一 reportId
    const reportId = 'pro_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8)

    // 自动保存到 analysis_history（如果用户已登录）
    try {
      var authHeader = c.req.header('Authorization')
      if (authHeader && authHeader.startsWith('Bearer ')) {
        var supabase = await getSupabaseAdminForSave()
        if (supabase) {
          // 从 JWT 解析 user_id（通过 Supabase auth.users 查询）
          // 禁止硬编码 null，统一从 Auth Context 获取
          var token = authHeader.replace('Bearer ', '')
          var { data: authUser } = await supabase.auth.getUser(token)
          var userId = authUser?.user?.id || null

          await supabase.from('analysis_history').insert({
            user_id: userId,
            analysis_type: AnalysisType.PRO,
            result: {
              reportId: reportId,
              engineVersion: ENGINE_VERSION,
              chart: {
                dayMaster: report.dayMaster || '',
                dayMasterElement: report.dayMasterElement || '',
                gender: genderCN,
                birthDate: birth_date,
                birthTime: body.birth_time || '',
              },
              confidence: (report as unknown as { confidence?: number }).confidence || null,
              createdAt: new Date().toISOString(),
            },
            status: AnalysisStatus.COMPLETED,
            duration_ms: totalComputeTimeMs,
          })
        }
      }
    } catch (saveErr) {
      // 保存失败不影响报告返回，仅记录日志
      console.warn('[pro/master-report] 自动保存历史记录失败:', saveErr)
    }

    return c.json({
      success: true,
      data: {
        reportId,
        engineVersion: ENGINE_VERSION,
        report,
        _modules: {
          pillars,
          shenSha,
          tenGods,
          pattern,
          xiYong,
          fortune,
        },
        meta: {
          computeTimeMs: totalComputeTimeMs,
          engineVersions: {
            pillars: FOUR_PILLARS_VERSION,
            shenSha: SHEN_SHA_ENGINE_VERSION,
            tenGods: TEN_GODS_ENGINE_VERSION,
            pattern: PATTERN_ENGINE_VERSION,
            xiYong: XIYONG_ENGINE_VERSION,
            fortune: FORTUNE_ENGINE_VERSION,
            masterReport: MASTER_REPORT_VERSION,
          },
        },
        createdAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error('[pro/master-report] Professional Engine 执行失败:', err)
    throw ApiError.internal('专业命理引擎计算失败', {
      ...(err instanceof Error ? { message: err.message } : {}),
    })
  }
})

export default app
