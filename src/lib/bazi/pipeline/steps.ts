/**
 * Pipeline Step 注册表 — V4.4 Enterprise
 *
 * 每个 Step 独立封装，Pipeline 主文件只负责调度。
 * 新增分析模块只需添加 StepDefinition，不修改主文件逻辑。
 */

import type { BaZiPipelineResult, BaZiAnalysisOptions, StepResult } from './types'
import type { BaZiChart, WangShuaiResult } from '../types'
import type { GeJuResult } from '../geju'
import type { UnifiedAnalysisData } from '../analysisCenter'
import type { XiYongShenResult } from '../xiyongshen'
import type { BirthData } from '@/lib/core'
import { default as baziKnowledge } from '../knowledge'
import { analyzeLiuNian } from '../liunianAnalysis'
import { analyzeCareer } from '../careerAnalysis'
import { analyzeMarriage } from '../marriageAnalysis'
import { analyzeWealth } from '../wealthAnalysis'
import { analyzeHealth } from '../healthAnalysis'
import { generateMasterSummary } from '../masterSummary'
import { analyzeFourPillars } from '../pillarAnalysis'
import { generateShiShenDetail } from '../shishenDetail'
import { generateShenShaDetail } from '../shenshaDetail'
import { calculateComprehensiveScore } from '../scoreEngine'
import { analyzeLiuYue } from '../liuyueAnalysis'
import { analyzeFengShui } from '../fengshuiAnalysis'
import { enhanceDaYunDetail } from '../dayunDetailEnhancer'
import { enhanceLiuNianDetail } from '../liunianDetailEnhancer'
import { generateFullReport } from '../fullReport'
import {
  adaptForCareer, adaptForMarriage, adaptForWealth, adaptForHealth,
} from '../moduleAdapter'
import { calculateBaZiScore } from './score'
import type { ShenShaCategory } from '../shensha'
import { PipelineRegistry } from './registry'
import type { PipelineCache } from './cache'

export interface StepContext {
  chart: BaZiChart
  analysis: UnifiedAnalysisData
  geJu: GeJuResult
  xiYong: XiYongShenResult
  birthData: BirthData
  options: BaZiAnalysisOptions
  result: BaZiPipelineResult
  cache: PipelineCache          // 共享缓存接口（为 H2 预留）
}

export interface StepDefinition {
  id: string                // 稳定标识符（不可变更）
  name: string              // 显示名称（可国际化）
  version: number           // Step 版本号（缓存失效用）
  /** 是否启用（默认 true） */
  enabled?: (ctx: StepContext) => boolean
  /** 依赖的 Step ID（预留，当前不影响调度顺序） */
  dependsOn?: string[]
  /** 执行逻辑，返回统一的 StepResult */
  execute: (ctx: StepContext) => StepResult
}

// ===== 基础 Steps =====

/** Step 2: 格局（已由 AnalysisCenter 计算，直接标记完成） */
export const stepGeJu: StepDefinition = {
  id: 'geju',
  name: '格局判断',
  version: 1,
  dependsOn: [],
  execute: () => ({ success: true, data: undefined, warnings: [] }),
}

/** Step 3: 用神（同上） */
export const stepXiYong: StepDefinition = {
  id: 'yongshen',
  name: '用神判定',
  version: 1,
  dependsOn: [],
  execute: () => ({ success: true, data: undefined, warnings: [] }),
}

/** Step 4: 知识库引用 */
export const stepKnowledge: StepDefinition = {
  id: 'knowledge',
  name: '知识库引用',
  version: 1,
  dependsOn: ['geju'],
  execute: (ctx) => ({
    success: true,
    data: { knowledge: baziKnowledge.search(ctx.geJu.name, 3) },
    warnings: [],
  }),
}

/** Step 5: 基础评分 */
export const stepScore: StepDefinition = {
  id: 'score',
  name: '基础评分',
  version: 1,
  dependsOn: ['geju', 'yongshen'],
  execute: (ctx) => ({
    success: true,
    data: {
      score: calculateBaZiScore(ctx.chart, ctx.geJu, ctx.xiYong),
    },
    warnings: [],
  }),
}

// ===== 大运 =====
export const stepDaYun: StepDefinition = {
  id: 'dayun',
  name: '大运推演',
  version: 1,
  dependsOn: [],
  enabled: (ctx) => ctx.options.includeDaYun !== false,
  execute: (ctx) => {
    if (!ctx.analysis.raw.daYun) {
      return { success: false, warnings: ['统一分析中心未产出大运结果'] }
    }
    return { success: true, data: { daYun: ctx.analysis.raw.daYun }, warnings: [] }
  },
}

// ===== 流年 =====
export const stepLiuNian: StepDefinition = {
  id: 'liunian',
  name: '流年推演',
  version: 1,
  dependsOn: ['dayun'],
  enabled: (ctx) => ctx.options.includeLiuNian !== false,
  execute: (ctx) => {
    const birthYear = new Date(ctx.birthData.birthday).getFullYear()
    const daYunSteps = ctx.analysis.raw.daYun?.steps?.map(s => ({
      ganZhi: s.ganZhi, startYear: s.startYear, endYear: s.endYear,
    }))
    return {
      success: true,
      data: {
        liuNian: analyzeLiuNian(
          ctx.chart.sixLines, ctx.chart.dayMaster.dayGan,
          birthYear, ctx.options.years || 100, daYunSteps,
        ),
      },
      warnings: [],
    }
  },
}

// ===== 五行分析 =====
export const stepFiveElement: StepDefinition = {
  id: 'wuxing',
  name: '五行分析',
  version: 1,
  dependsOn: [],
  execute: (ctx) => ({
    success: true,
    data: {
      fiveElementPower: ctx.analysis.raw.fiveElementPower,
      shenShiAnalysis: ctx.analysis.raw.shiShen,
    },
    warnings: [],
  }),
}

// ===== 流月 =====
export const stepLiuYue: StepDefinition = {
  id: 'liuyue',
  name: '流月分析',
  version: 1,
  dependsOn: [],
  execute: (ctx) => {
    const currentYear = new Date(ctx.birthData.birthday).getFullYear()
    return {
      success: true,
      data: { liuYue: analyzeLiuYue(ctx.chart.sixLines, ctx.chart.dayMaster.dayGan, currentYear) },
      warnings: [],
    }
  },
}

// ===== 事业 =====
export const stepCareer: StepDefinition = {
  id: 'career',
  name: '事业分析',
  version: 1,
  dependsOn: ['wuxing'],
  enabled: (ctx) => ctx.options.includeCareer !== false,
  execute: (ctx) => {
    const input = adaptForCareer(ctx.analysis)
    return {
      success: true,
      data: {
        career: analyzeCareer(
          input.sixLines, input.dayGan, input.gender,
          input.shenShiAnalysis, input.geJu, input.fiveElementPower,
        ),
      },
      warnings: [],
    }
  },
}

// ===== 婚姻 =====
export const stepMarriage: StepDefinition = {
  id: 'marriage',
  name: '婚姻分析',
  version: 1,
  dependsOn: ['wuxing'],
  enabled: (ctx) => ctx.options.includeMarriage !== false,
  execute: (ctx) => {
    const input = adaptForMarriage(ctx.analysis)
    return {
      success: true,
      data: {
        marriage: analyzeMarriage(input.sixLines, input.dayGan, input.gender),
      },
      warnings: [],
    }
  },
}

// ===== 财富 =====
export const stepWealth: StepDefinition = {
  id: 'wealth',
  name: '财富分析',
  version: 1,
  dependsOn: ['liunian', 'wuxing'],
  enabled: (ctx) => ctx.options.includeWealth !== false,
  execute: (ctx) => {
    const input = adaptForWealth(ctx.analysis, { liuNian: ctx.result.liuNian })
    return {
      success: true,
      data: {
        wealth: analyzeWealth(
          input.sixLines, input.dayGan, input.shenShiAnalysis,
          ctx.result.liuNian as any, input.geJu,
        ),
      },
      warnings: [],
    }
  },
}

// ===== 健康 =====
export const stepHealth: StepDefinition = {
  id: 'health',
  name: '健康分析',
  version: 1,
  dependsOn: ['wuxing'],
  enabled: (ctx) => ctx.options.includeHealth !== false,
  execute: (ctx) => {
    const input = adaptForHealth(ctx.analysis)
    return {
      success: true,
      data: {
        health: analyzeHealth(input.sixLines, input.dayGan, input.fiveElementPower),
      },
      warnings: [],
    }
  },
}

// ===== 命局总论 =====
export const stepMasterSummary: StepDefinition = {
  id: 'mingju',
  name: '命局总论',
  version: 1,
  dependsOn: ['score', 'dayun'],
  enabled: (ctx) => ctx.options.detailed,
  execute: (ctx) => {
    const wangShuaiResult: WangShuaiResult = {
      wangShuai: ctx.chart.dayMaster.wangShuai,
      strengthScore: ctx.chart.dayMaster.strengthScore,
      deLing: ctx.analysis.raw.fiveElementPower.deLing,
      deDi: ctx.analysis.raw.fiveElementPower.deDi,
      deShi: ctx.analysis.raw.fiveElementPower.deShi,
      tongGen: ctx.analysis.raw.fiveElementPower.deDi,
      yueLing: ctx.chart.sixLines.month.zhi,
      bestElement: ctx.xiYong.bestElement,
      avoidedElements: ctx.xiYong.avoidedElements,
      level: ctx.analysis.raw.fiveElementPower.wangShuaiLevel,
    }
    return {
      success: true,
      data: {
        masterSummary: generateMasterSummary(ctx.chart, wangShuaiResult, ctx.geJu, ctx.result.daYun),
      },
      warnings: [],
    }
  },
}

// ===== 四柱详解 =====
export const stepPillars: StepDefinition = {
  id: 'pillars',
  name: '四柱详解',
  version: 1,
  dependsOn: [],
  enabled: (ctx) => ctx.options.detailed,
  execute: (ctx) => ({
    success: true,
    data: { pillarAnalysis: analyzeFourPillars(ctx.chart) },
    warnings: [],
  }),
}

// ===== 十神详解 =====
export const stepShiShenDetail: StepDefinition = {
  id: 'shishen',
  name: '十神详解',
  version: 1,
  dependsOn: [],
  enabled: (ctx) => ctx.options.detailed,
  execute: (ctx) => ({
    success: true,
    data: {
      shiShenDetail: generateShiShenDetail({
        dayGan: ctx.chart.dayMaster.dayGan,
        dayGanElement: ctx.chart.dayMaster.dayGanElement,
        relatedShens: ctx.chart.dayMaster.relatedShens,
        chart: ctx.chart,
      }),
    },
    warnings: [],
  }),
}

// ===== 神煞详解 =====
export const stepShenShaDetail: StepDefinition = {
  id: 'shensha',
  name: '神煞详解',
  version: 1,
  dependsOn: ['wuxing'],
  enabled: (ctx) => ctx.options.detailed,
  execute: (ctx) => {
    const shenShaList = ctx.analysis.shenSha.list.map(s => ({
      name: s.name, position: s.position, isAuspicious: s.isAuspicious,
    }))
    return {
      success: true,
      data: { shenShaDetail: generateShenShaDetail(shenShaList) },
      warnings: [],
    }
  },
}

// ===== 综合评分 =====
export const stepComprehensiveScore: StepDefinition = {
  id: 'comprehensive',
  name: '综合评分',
  version: 1,
  dependsOn: ['career', 'marriage', 'wealth', 'health'],
  enabled: (ctx) => ctx.options.detailed,
  execute: (ctx) => ({
    success: true,
    data: {
      comprehensiveScore: calculateComprehensiveScore(
        ctx.chart, ctx.result.career, ctx.result.marriage,
        ctx.result.wealth, ctx.result.health,
      ),
    },
    warnings: [],
  }),
}

// ===== 风水联动 =====
export const stepFengShui: StepDefinition = {
  id: 'fengshui',
  name: '风水联动',
  version: 1,
  dependsOn: ['yongshen', 'wuxing'],
  execute: (ctx) => {
    const xiYongAdapted = {
      bestElement: ctx.xiYong.bestElement,
      happiness: `${ctx.xiYong.firstHappy}${ctx.xiYong.secondHappy || ''}${ctx.xiYong.thirdHappy || ''}`,
      usage: `${ctx.xiYong.firstUsage || ctx.xiYong.usageElement || ''}`,
      avoidedElements: ctx.xiYong.avoidedElements || [],
      idleElements: ctx.xiYong.idleElements || [],
      enemyElements: ctx.xiYong.enemyElements || [],
    }
    return {
      success: true,
      data: {
        fengshui: analyzeFengShui(
          ctx.chart.sixLines, ctx.chart.dayMaster.dayGan,
          xiYongAdapted, ctx.analysis.raw.fiveElementPower,
          ctx.analysis.raw.shiShen?.details?.[0]?.name || '',
        ),
      },
      warnings: [],
    }
  },
}

// ===== 详解增强 =====
export const stepDetailEnhance: StepDefinition = {
  id: 'detail-enhance',
  name: '详解增强',
  version: 1,
  dependsOn: ['dayun', 'liunian'],
  enabled: (ctx) => ctx.options.detailed,
  execute: (ctx) => {
    const dayunDetails = ctx.result.daYun?.steps?.map(step =>
      enhanceDaYunDetail(step, ctx.chart, ctx.chart.xiYongShen)
    ) || []
    const currentDaYun = ctx.result.daYun?.currentStepIndex != null && ctx.result.daYun.currentStepIndex >= 0
      ? ctx.result.daYun.steps[ctx.result.daYun.currentStepIndex] : null
    const liunianDetails = ctx.result.liuNian?.years?.map(y =>
      enhanceLiuNianDetail(y, ctx.chart, ctx.chart.xiYongShen, currentDaYun)
    ) || []
    return { success: true, data: { dayunDetails, liunianDetails }, warnings: [] }
  },
}

// ===== 完整报告（fullReport 唯一来源） =====
export const stepFullReport: StepDefinition = {
  id: 'full-report',
  name: '完整报告',
  version: 1,
  execute: (ctx) => {
    const { sixLines, fiveElementCount, dayMaster, xiYongShen, birthInfo } = ctx.chart
    const r = ctx.result
    const wangShuai: WangShuaiResult = {
      wangShuai: dayMaster.wangShuai,
      strengthScore: dayMaster.strengthScore,
      deLing: ['旺', '相'].includes(dayMaster.wangShuai),
      deDi: dayMaster.strengthScore >= 50,
      deShi: dayMaster.strengthScore >= 60,
      tongGen: dayMaster.strengthScore >= 40,
      yueLing: sixLines.month.zhi,
      bestElement: xiYongShen.bestElement,
      avoidedElements: xiYongShen.avoidedElements,
      level: dayMaster.wangShuai,
    }

    // 适配：从 shenShaDetail 反向构建 ShenShaCategory[] 供 fullReport 使用
    // shenShaDetail 是详细分析结果，shenSha (ShenShaCategory[]) 是分类列表
    // 从 analysis.raw.shenSha（ShenShaCategory[]）获取原始数据
    const shenShaForReport: ShenShaCategory[] = ctx.analysis.raw.shenSha

    const fullReport = generateFullReport({
      chart: ctx.chart,
      sixLines, dayMaster,
      geJu: ctx.geJu,
      wangShuai,
      shenShiAnalysis: r.shenShiAnalysis,
      fiveElementPower: r.fiveElementPower,
      shenSha: shenShaForReport,
      xiYongShen: {
        bestElement: xiYongShen.bestElement,
        avoidedElements: xiYongShen.avoidedElements,
        idleElements: xiYongShen.idleElements,
        enemyElements: xiYongShen.enemyElements,
      },
      marriage: r.marriage,
      career: r.career,
      wealth: r.wealth,
      health: r.health,
      fengshui: r.fengshui,
      daYun: r.daYun,
      liuNian: r.liuNian,
      liuYue: r.liuYue,
    })
    return { success: true, data: { fullReport }, warnings: [] }
  },
}

// ===== 注册到 Registry（首次导入时自动执行） =====
PipelineRegistry.registerAll([
  stepGeJu,
  stepXiYong,
  stepKnowledge,
  stepScore,
  stepDaYun,
  stepLiuNian,
  stepFiveElement,
  stepLiuYue,
  stepCareer,
  stepMarriage,
  stepWealth,
  stepHealth,
  stepMasterSummary,
  stepPillars,
  stepShiShenDetail,
  stepShenShaDetail,
  stepComprehensiveScore,
  stepFengShui,
  stepDetailEnhance,
  stepFullReport,
])

/** 兼容导出：保留 PIPELINE_STEPS 供外部引用 */
export const PIPELINE_STEPS = PipelineRegistry.getAll()

/** 导出 Registry 供外部使用 */
export { PipelineRegistry }
