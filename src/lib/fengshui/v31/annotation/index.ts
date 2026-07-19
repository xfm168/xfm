/**
 * 图片标注引擎
 * 基于 AI 识别结果与规则匹配结果生成可视化标注
 */

import type { ImageAnnotation, AnnotationType, BBox } from '../types'

/** 标注类型与颜色映射 */
const ANNOTATION_COLORS: Record<AnnotationType, string> = {
  problem: '#e85d5d',
  risk: '#f0a030',
  suggestion: '#5a9fd4',
  wealth: '#d4a847',
  health: '#7ecb7e',
  career: '#a78bfa',
}

/** 标注类型中文标签 */
const ANNOTATION_LABELS: Record<AnnotationType, string> = {
  problem: '问题',
  risk: '风险',
  suggestion: '建议',
  wealth: '财运',
  health: '健康',
  career: '事业',
}

/** AI 识别结果中的单个物体 */
interface VisionObject {
  id: string
  label: string
  bbox: BBox
  confidence: number
}

/** AI 识别结果 */
interface VisionResult {
  objects: VisionObject[]
  imageWidth: number
  imageHeight: number
}

/** 规则匹配项（兼容 V3.1 RuleMatchResult） */
interface RuleMatch {
  ruleId: string
  ruleName: string
  category: string
  severity: 'critical' | 'severe' | 'significant' | 'moderate' | 'suggestion'
  matchedObjects: string[] // 匹配到的物体 ID 列表
  suggestion: string
}

/** RuleMatchResult 兼容项（来自 rules/registry.ts） */
interface RuleMatchResultCompat {
  rule: {
    id: string
    name: string
    category: string
    severity: 'critical' | 'severe' | 'significant' | 'moderate' | 'suggestion'
    solution: { summary: string }
  }
  matched: boolean
  confidence: number
  reason: string
}

/**
 * 将 RuleMatchResult[] 转换为 RuleMatch[]
 * 规则匹配到的物体通过 visionResult.objects 的类型关联推断
 */
function toRuleMatches(
  ruleMatchResults: RuleMatchResultCompat[],
  visionObjects: VisionObject[]
): RuleMatch[] {
  const objectTypeMap = new Map<string, string[]>()
  for (const obj of visionObjects) {
    const existing = objectTypeMap.get(obj.label) || []
    existing.push(obj.id)
    objectTypeMap.set(obj.label, existing)
  }

  return ruleMatchResults
    .filter(r => r.matched)
    .map(r => ({
      ruleId: r.rule.id,
      ruleName: r.rule.name,
      category: r.rule.category,
      severity: r.rule.severity,
      matchedObjects: r.rule.condition?.target
        ? (objectTypeMap.get(r.rule.condition.target) || [])
        : [],
      suggestion: r.rule.solution?.summary || '',
    }))
}

/**
 * 根据规则分类与严重等级推断标注类型
 */
function inferAnnotationType(category: string, severity: string): AnnotationType {
  if (category === 'wealth') return 'wealth'
  if (category === 'health') return 'health'
  if (category === 'career') return 'career'
  if (severity === 'critical' || severity === 'severe') return 'problem'
  if (severity === 'significant' || severity === 'moderate') return 'risk'
  return 'suggestion'
}

/**
 * 生成图片标注列表
 * @param visionResult AI 识别结果
 * @param ruleMatches 规则匹配结果
 * @returns 标注列表
 */
export function generateAnnotations(
  visionResult: VisionResult,
  ruleMatches: RuleMatchResultCompat[]
): ImageAnnotation[] {
  const compatibleMatches = toRuleMatches(ruleMatches, visionResult.objects)
  const annotations: ImageAnnotation[] = []
  const objectMap = new Map<string, VisionObject>()

  for (const obj of visionResult.objects) {
    objectMap.set(obj.id, obj)
  }

  for (const match of compatibleMatches) {
    for (const objectId of match.matchedObjects) {
      const obj = objectMap.get(objectId)
      if (!obj) continue

      const type = inferAnnotationType(match.category, match.severity)
      const annotation: ImageAnnotation = {
        id: `ANNO-${match.ruleId}-${objectId}`,
        type,
        bbox: { ...obj.bbox },
        label: `${ANNOTATION_LABELS[type]}: ${obj.label}`,
        suggestion: match.suggestion,
        severity: match.severity,
        ruleId: match.ruleId,
        color: ANNOTATION_COLORS[type],
        icon: undefined,
      }

      annotations.push(annotation)
    }
  }

  return annotations
}

/**
 * 在 Canvas 上绘制标注框与文字
 * @param canvas HTMLCanvasElement
 * @param image 原始图片（HTMLImageElement 或 ImageBitmap）
 * @param annotations 标注列表
 */
export function renderAnnotations(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement | ImageBitmap,
  annotations: ImageAnnotation[]
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = image.width
  canvas.height = image.height

  ctx.drawImage(image, 0, 0)

  for (const anno of annotations) {
    const { x, y, width, height } = anno.bbox
    const px = x * canvas.width
    const py = y * canvas.height
    const pw = width * canvas.width
    const ph = height * canvas.height

    // 绘制标注框
    ctx.strokeStyle = anno.color
    ctx.lineWidth = 3
    ctx.strokeRect(px, py, pw, ph)

    // 绘制半透明填充背景
    ctx.fillStyle = anno.color + '1A' // 10% 透明度
    ctx.fillRect(px, py, pw, ph)

    // 文字背景
    const text = anno.label
    ctx.font = 'bold 14px sans-serif'
    const textMetrics = ctx.measureText(text)
    const textHeight = 18
    const padding = 4

    ctx.fillStyle = anno.color
    ctx.fillRect(px, py - textHeight - padding * 2, textMetrics.width + padding * 2, textHeight + padding * 2)

    // 文字
    ctx.fillStyle = '#ffffff'
    ctx.textBaseline = 'top'
    ctx.fillText(text, px + padding, py - textHeight - padding)

    // 若存在建议文字，在框下方绘制
    if (anno.suggestion) {
      const suggestionText = anno.suggestion.length > 20 ? anno.suggestion.slice(0, 20) + '...' : anno.suggestion
      ctx.font = '12px sans-serif'
      const sugMetrics = ctx.measureText(suggestionText)
      const sugY = py + ph + padding

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.fillRect(px, sugY, sugMetrics.width + padding * 2, textHeight + padding * 2)

      ctx.fillStyle = '#ffffff'
      ctx.fillText(suggestionText, px + padding, sugY + padding)
    }
  }
}

/**
 * 导出带标注的图片（Base64）
 * @param image 原始图片
 * @param annotations 标注列表
 * @returns Base64 图片数据（PNG 格式）
 */
export function exportAnnotatedImage(
  image: HTMLImageElement | ImageBitmap,
  annotations: ImageAnnotation[]
): string {
  const canvas = document.createElement('canvas')
  renderAnnotations(canvas, image, annotations)
  return canvas.toDataURL('image/png')
}
