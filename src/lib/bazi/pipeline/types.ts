/**
 * 八字 Pipeline 类型定义
 */

/** Pipeline 版本号 */
export const PIPELINE_VERSION = '1.0.0'

import type { BaZiChart, BirthInfo, XiYongShen } from '../types'
import type { GeJuResult } from '../geju'
import type { XiYongShenResult } from '../xiyongshen'
import type { BaZiKnowledgeEntry } from '../knowledge/types'
import type { BirthData } from '@/lib/core'
import type { DaYunAnalysisResult } from '../dayunAnalysis'
import type { LiuNianAnalysisResult } from '../liunianAnalysis'
import type { CareerAnalysisResult } from '../careerAnalysis'
import type { MarriageAnalysisResult } from '../marriageAnalysis'
import type { WealthAnalysisResult } from '../wealthAnalysis'
import type { HealthAnalysisResult } from '../healthAnalysis'

export interface BaZiAnalysisOptions {
  includeAI?: boolean
  detailed?: boolean
  includeLuck?: boolean
  years?: number
  // 新增：专业分析引擎开关
  includeDaYun?: boolean       // 大运推演，默认 true
  includeLiuNian?: boolean      // 流年推演，默认 true
  includeCareer?: boolean      // 事业分析，默认 true
  includeMarriage?: boolean    // 婚姻分析，默认 true
  includeWealth?: boolean      // 财富分析，默认 true
  includeHealth?: boolean      // 健康分析，默认 true
}

export interface BaZiPipelineInput {
  birthData: BirthData
  options?: BaZiAnalysisOptions
}

export interface BaZiPipelineStep {
  id: string              // Step ID（稳定标识符）
  name: string
  status: 'pending' | 'running' | 'completed' | 'error'
  duration: number
  error?: string
}

export interface BaZiScore {
  overall: number
  strength: number
  balance: number
  pattern: number
}

export interface BaZiPipelineResult {
  success: boolean
  birthData: BirthData
  chart: BaZiChart
  geJu: GeJuResult
  xiYongShen: XiYongShenResult
  score: BaZiScore
  knowledge: BaZiKnowledgeEntry[]
  steps: BaZiPipelineStep[]
  aiReport: BaZiAIReport | null
  includeAI: boolean
  detailed: boolean
  createdAt: number
  version: string
  // V4.4 Enterprise: Pipeline 元数据
  metadata?: PipelineMetadata
  error?: string
  duration: number
  // 新增：专业分析引擎结果
  daYun?: DaYunAnalysisResult
  liuNian?: LiuNianAnalysisResult
  career?: CareerAnalysisResult
  marriage?: MarriageAnalysisResult
  wealth?: WealthAnalysisResult
  health?: HealthAnalysisResult
  // V4.1 新增：深度分析结果
  masterSummary?: any
  pillarAnalysis?: any
  shiShenDetail?: any
  shenShaDetail?: any
  comprehensiveScore?: any
  // V4.4 Enterprise: 补充分析字段（供 BaziChart 统一读取）
  // 注：shenSha 已移除，统一使用 shenShaDetail
  shenShiAnalysis?: import('../shishenAnalysis').ShenShiAnalysisResult
  fiveElementPower?: import('../fiveElementPower').FiveElementPowerResult
  liuYue?: import('../liuyueAnalysis').LiuYueAnalysisResult
  fengshui?: import('../fengshuiAnalysis').FengShuiAnalysisResult
  fullReport?: import('../fullReport').FullReportResult
  dayunDetails?: any[]
  liunianDetails?: any[]
}

export interface BaZiAIReport {
  personality: string
  career: string
  wealth: string
  relationship: string
  health: string
  family: string
  luck: string
  suggestions: string[]
}

export type {
  BirthInfo,
  BaZiChart,
  XiYongShen,
}

/** Pipeline 元数据 */
export interface PipelineMetadata {
  pipelineVersion: string
  stepVersions: Record<string, number>
  executedSteps: string[]   // Step ID 列表
  skippedSteps: string[]    // Step ID 列表
  totalTime: number
  /** 性能指标 */
  memoryUsage?: number
  cacheHits?: number
  cacheMisses?: number
  retryCount?: number
  pipelineStart?: number
  pipelineEnd?: number
  stepCount?: number
}

/** Step 执行结果统一结构（elapsed 由 Pipeline 调度器计算，Step 不负责） */
export interface StepResult<T = unknown> {
  success: boolean
  data?: T
  warnings: string[]
  metadata?: Record<string, unknown>
}

/** Progress 回调参数 */
export interface PipelineProgressEvent {
  stepId: string
  stepName: string
  progress: number
  elapsed: number
}

export type PipelineProgressCallback = (event: PipelineProgressEvent) => void
