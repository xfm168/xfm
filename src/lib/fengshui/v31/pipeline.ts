/**
 * V3.1 Pipeline 集成层
 * 在现有 V3.0 Pipeline 基础上增强 V3.1 能力
 * 不影响原有功能，通过包装器模式实现无缝升级
 */

import { runFullPipeline, type PipelineInput, type PipelineOutput } from '../pipeline'
import { calculateScore12D } from './scoring'
import { buildProfessionalReportV31, toPipelineReportV31 } from './report'
import { generateAnnotations, exportAnnotatedImage } from './annotation'
import { calculateCredibilityV31 } from './credibility'
import { matchRules, getRuleStats, ALL_RULES_V31 } from './rules/registry'
import { getEnabledSchools, calculateMultiSchoolScore } from './schools'
import { AnalysisPipelineV31 } from './performance'
import type {
  Score12DResult,
  ProfessionalReportV31,
  ImageAnnotation,
  CredibilityResultV31,
} from './types'

export interface V31PipelineOutput extends PipelineOutput {
  v31?: {
    score12D: Score12DResult
    professionalReport: ProfessionalReportV31
    annotations: ImageAnnotation[]
    annotatedImage?: string
    credibility: CredibilityResultV31
    schoolScores: { school: string; score: number; weight: number }[]
    ruleStats: ReturnType<typeof getRuleStats>
    performance: ReturnType<AnalysisPipelineV31['generatePerformanceReport']>
  }
}

export interface V31PipelineOptions {
  enable12D: boolean
  enableAnnotations: boolean
  enableSchoolFusion: boolean
  enableV31Credibility: boolean
  enablePDF: boolean
}

const DEFAULT_OPTIONS: V31PipelineOptions = {
  enable12D: true,
  enableAnnotations: true,
  enableSchoolFusion: true,
  enableV31Credibility: true,
  enablePDF: false,
}

// ═══════════════════════════════════════════════
// Adapter 层：V3.0 数据结构 → V3.1 模块期望格式
// 不修改 V3.0 数据结构、不修改公共类型、不修改业务逻辑
// ═══════════════════════════════════════════════

/** Adapter: ImageQualityCheck → CredibilityOptions.imageQuality */
function adaptImageQualityForCredibility(imageQuality: { overallScore: number } | undefined) {
  const score = imageQuality?.overallScore ?? 70
  return {
    resolution: {
      width: score >= 80 ? 1920 : score >= 50 ? 1280 : 640,
      height: score >= 80 ? 1080 : score >= 50 ? 720 : 480,
    },
    brightness: score,
    angleDeviation: 0,
  }
}

/** Adapter: ImageAnalysisResult → CredibilityOptions.visionResult */
function adaptVisionResultForCredibility(
  visionResult: { detectedObjects?: Array<{ type: string; confidence: number }> } | undefined
) {
  return {
    objects: (visionResult?.detectedObjects ?? []).map((o) => ({
      label: o.type,
      confidence: o.confidence,
    })),
  }
}

/** Adapter: ImageAnalysisResult → annotation.VisionResult */
function adaptVisionResultForAnnotation(
  visionResult: {
    detectedObjects?: Array<{
      type: string
      confidence: number
      boundingBox?: { x: number; y: number; width: number; height: number }
    }>
  } | undefined
) {
  return {
    objects: (visionResult?.detectedObjects ?? []).map((o, i) => ({
      id: `obj-${i}`,
      label: o.type,
      bbox: o.boundingBox
        ? {
            x: Math.max(0, Math.min(1, o.boundingBox.x)),
            y: Math.max(0, Math.min(1, o.boundingBox.y)),
            width: Math.max(0, Math.min(1, o.boundingBox.width)),
            height: Math.max(0, Math.min(1, o.boundingBox.height)),
          }
        : { x: 0, y: 0, width: 0.1, height: 0.1 },
      confidence: o.confidence,
    })),
    imageWidth: 1920,
    imageHeight: 1080,
  }
}

/** Pipeline 图片缓存：Base64 → HTMLImageElement，限制 20 张 FIFO */
const imageCache = new Map<string, HTMLImageElement>()
const CACHE_MAX_SIZE = 20

/** 解析 Pipeline 图片资源（优先复用已有对象，避免重复解码） */
function resolvePipelineImage(
  input: PipelineInput
): Promise<HTMLImageElement | ImageBitmap> {
  if (input.imageBitmap) {
    return Promise.resolve(input.imageBitmap)
  }
  if (input.imageElement) {
    return Promise.resolve(input.imageElement)
  }
  const cached = imageCache.get(input.imageData)
  if (cached) {
    return Promise.resolve(cached)
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      if (imageCache.size >= CACHE_MAX_SIZE) {
        const firstKey = imageCache.keys().next().value
        if (firstKey !== undefined) {
          imageCache.delete(firstKey)
        }
      }
      imageCache.set(input.imageData, img)
      resolve(img)
    }
    img.onerror = () => reject(new Error('图片加载失败'))
    img.src = input.imageData
  })
}

/**
 * 运行 V3.1 增强版 Pipeline
 * 先执行 V3.0 Pipeline，然后叠加 V3.1 分析层
 */
export async function runV31Pipeline(
  input: PipelineInput,
  options: Partial<V31PipelineOptions> = {}
): Promise<V31PipelineOutput> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const perf = new AnalysisPipelineV31()
  perf.beginPhase('total')

  // Step 1: 运行 V3.0 Pipeline（已有功能不受影响）
  perf.beginPhase('v30_pipeline')
  const baseResult = await runFullPipeline(input)
  perf.endPhase('v30_pipeline')

  const output: V31PipelineOutput = { ...baseResult, v31: undefined }

  // 如果 V3.0 执行失败，直接返回错误结果
  if (baseResult.status === 'error' || !baseResult.report) {
    return output
  }

  try {
    // Step 2: V3.1 规则匹配（100条规则）
    perf.beginPhase('v31_rule_matching')
    const roomType = input.roomType || 'living'
    const detectedObjects = baseResult.visionResult?.detectedObjects?.map(o => o.type) || []
    const ruleMatches = matchRules(roomType, detectedObjects)
    perf.endPhase('v31_rule_matching')

    // Step 3: 12维评分
    perf.beginPhase('v31_scoring_12d')
    const score12D = calculateScore12D({
      features: baseResult.featureResult,
      spatial: baseResult.spatialResult,
      rooms: baseResult.roomResult,
      ruleResults: baseResult.ruleResult,
      userProvided: input.userInfo,
    })
    perf.endPhase('v31_scoring_12d')

    // Step 4: 图片标注
    let annotations: ImageAnnotation[] = []
    let annotatedImage: string | undefined
    perf.beginPhase('v31_annotation')
    if (opts.enableAnnotations && baseResult.visionResult) {
      annotations = generateAnnotations(adaptVisionResultForAnnotation(baseResult.visionResult), ruleMatches)
      if (input.imageData && annotations.length > 0) {
        try {
          const img = await resolvePipelineImage(input)
          annotatedImage = exportAnnotatedImage(img, annotations)
        } catch (err) {
          console.warn('[V3.1] 标注导出失败，不影响主流程:', err)
        }
      }
    }
    perf.endPhase('v31_annotation')

    // Step 5: 多流派融合评分
    let schoolScores: { school: string; score: number; weight: number }[] = []
    perf.beginPhase('v31_school_fusion')
    if (opts.enableSchoolFusion) {
      const schools = getEnabledSchools()
      const context = {
        roomType,
        detectedObjects,
        scoreResult: baseResult.scoreResult,
        spatialResult: baseResult.spatialResult,
      }
      const multiScore = calculateMultiSchoolScore(context, schools)
      schoolScores = multiScore.breakdown
    }
    perf.endPhase('v31_school_fusion')

    // Step 6: V3.1 可信度计算
    let credibility: CredibilityResultV31
    perf.beginPhase('v31_credibility')
    if (opts.enableV31Credibility) {
      credibility = calculateCredibilityV31({
        imageQuality: adaptImageQualityForCredibility(baseResult.imageQuality),
        visionResult: adaptVisionResultForCredibility(baseResult.visionResult),
        ruleMatches,
        totalRules: ALL_RULES_V31.length,
        modelResults: [baseResult.scoreResult],
        duration: baseResult.totalTime,
      })
    } else {
      credibility = {
        score: baseResult.report?.confidence || 70,
        level: 'medium',
        factors: {
          imageCompleteness: 70,
          recognitionAccuracy: 70,
          ruleMatchRate: 50,
          elementRecognitionCount: 5,
          modelConsistency: 80,
        },
        explanation: '基于 V3.0 兼容模式计算',
      }
    }
    perf.endPhase('v31_credibility')

    // Step 7: 生成 V3.1 专业报告
    perf.beginPhase('v31_report')
    const professionalReport = buildProfessionalReportV31({
      score12D,
      ruleMatches,
      visionResult: baseResult.visionResult,
      annotations,
      credibility,
    })
    perf.endPhase('v31_report')

    // Step 8: 兼容转换（供前端使用）
    const v31Report = toPipelineReportV31(professionalReport)
    // 合并到 baseResult.report 的 sections 中
    if (output.report) {
      output.report.sections = [...(output.report.sections || []), ...v31Report.sections]
      output.report.overallScore = score12D.overall
    }

    perf.endPhase('total')

    output.v31 = {
      score12D,
      professionalReport,
      annotations,
      annotatedImage,
      credibility,
      schoolScores,
      ruleStats: getRuleStats(),
      performance: perf.generatePerformanceReport(),
    }

    return output
  } catch (err) {
    // V3.1 增强层失败时，返回 V3.0 结果 + 错误标记
    console.warn('V3.1 enhancement failed, falling back to V3.0:', err)
    return output
  }
}
