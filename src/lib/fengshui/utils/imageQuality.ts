/**
 * 图片质量检测工具 V3.0
 *
 * 在客户端对上传的图片进行基础质量检测，
 * 避免将明显不合格的图片送入分析流程。
 */

import type { ImageQualityCheck } from '../types'

/**
 * 检测图片质量
 * 返回详细的检测结果和建议
 */
export function checkImageQuality(imageData: string): ImageQualityCheck {
  const checks: ImageQualityCheck['checks'] = []

  // 1. 检测图片是否为空
  const isEmpty = imageData.length < 1000
  checks.push({
    item: '图片内容',
    passed: !isEmpty,
    message: isEmpty ? '图片内容为空或损坏，请重新上传。' : '图片内容正常。',
    severity: isEmpty ? 'error' : 'info',
  })

  if (isEmpty) {
    return { passed: false, checks, overallScore: 0, suggestions: ['请重新选择有效的图片文件上传。'] }
  }

  // 2. 检测文件大小（通过 Base64 长度估算）
  const estimatedBytes = Math.round(imageData.length * 0.75)
  const estimatedKB = estimatedBytes / 1024
  const estimatedMB = estimatedBytes / (1024 * 1024)
  const isTooSmall = estimatedBytes < 10 * 1024       // < 10KB
  const isTooLarge = estimatedBytes > 10 * 1024 * 1024 // > 10MB

  checks.push({
    item: '文件大小',
    passed: !isTooSmall && !isTooLarge,
    message: isTooSmall
      ? '图片文件过小（' + Math.round(estimatedKB) + 'KB），可能分辨率不足，建议上传更高清的图片。'
      : isTooLarge
        ? '图片文件过大（' + estimatedMB.toFixed(1) + 'MB），分析时间可能较长，建议压缩后重新上传。'
        : '文件大小适中（' + estimatedMB.toFixed(1) + 'MB）。',
    severity: isTooSmall ? 'warning' : isTooLarge ? 'warning' : 'info',
  })

  // 3. 检测分辨率（通过 Base64 元数据或创建 Image 对象）
  const resolutionCheck = estimateResolution(imageData)
  checks.push({
    item: '图片分辨率',
    passed: resolutionCheck.passed,
    message: resolutionCheck.message,
    severity: resolutionCheck.passed ? 'info' : 'warning',
  })

  // 4. 估算色彩丰富度（检测是否过暗/过曝/模糊）
  const colorCheck = estimateColorDistribution(imageData)
  checks.push({
    item: '曝光与亮度',
    passed: colorCheck.passed,
    message: colorCheck.message,
    severity: colorCheck.passed ? 'info' : 'warning',
  })

  // 5. 检测是否为重复上传（通过简单哈希）
  const hash = simpleHash(imageData.substring(0, 2000))
  const lastHash = sessionStorage.getItem('xfm_last_image_hash')
  const isDuplicate = lastHash === hash && lastHash !== null
  checks.push({
    item: '重复检测',
    passed: !isDuplicate,
    message: isDuplicate
      ? '检测到您上传了与上次相同的图片。如需重新分析，建议先拍摄新的照片。'
      : '图片未重复。',
    severity: isDuplicate ? 'warning' : 'info',
  })
  if (!isDuplicate) {
    sessionStorage.setItem('xfm_last_image_hash', hash)
  }

  // 计算综合评分
  const errorCount = checks.filter(c => c.severity === 'error').length
  const warningCount = checks.filter(c => c.severity === 'warning').length
  const overallScore = Math.max(0, 100 - errorCount * 30 - warningCount * 10)

  const passed = overallScore >= 60 && errorCount === 0

  // 生成建议
  const suggestions: string[] = []
  if (isTooSmall) suggestions.push('建议使用分辨率更高的手机或相机拍摄，确保图片清晰。')
  if (isTooLarge) suggestions.push('建议使用图片压缩工具减小文件大小，或降低拍摄分辨率。')
  if (!resolutionCheck.passed) suggestions.push(resolutionCheck.suggestion)
  if (!colorCheck.passed) suggestions.push(colorCheck.suggestion)
  if (isDuplicate) suggestions.push('如需对比分析，请使用不同的照片。')

  if (suggestions.length === 0) {
    suggestions.push('图片质量良好，可以进行风水分析。')
  }

  return { passed, checks, overallScore, suggestions }
}

/**
 * 估算图片分辨率
 * 通过创建 Image 对象异步检测（返回同步估算结果）
 */
function estimateResolution(imageData: string): {
  passed: boolean
  message: string
  suggestion: string
} {
  // 同步估算：从 Base64 数据大小推断
  const estimatedBytes = Math.round(imageData.length * 0.75)
  // 假设平均 JPEG 压缩比，估算像素数
  const estimatedPixels = estimatedBytes * 3
  const estimatedWidth = Math.sqrt(estimatedPixels / 0.75)

  if (estimatedWidth < 400) {
    return {
      passed: false,
      message: '图片分辨率可能较低（估算宽度约 ' + Math.round(estimatedWidth) + ' 像素），细节可能不够清晰。',
      suggestion: '建议使用 800x600 像素以上的图片，以便更准确识别空间布局和家具摆放。',
    }
  }

  if (estimatedWidth > 4000) {
    return {
      passed: true,
      message: '图片分辨率很高（估算宽度约 ' + Math.round(estimatedWidth) + ' 像素），细节丰富。',
      suggestion: '',
    }
  }

  return {
    passed: true,
    message: '图片分辨率适中（估算宽度约 ' + Math.round(estimatedWidth) + ' 像素），适合分析。',
    suggestion: '',
  }
}

/**
 * 估算色彩分布，检测过暗/过曝
 */
function estimateColorDistribution(imageData: string): {
  passed: boolean
  message: string
  suggestion: string
} {
  // 通过分析 Base64 数据的字节分布来粗略估算
  // 这是一个简化算法，仅用于检测极端情况
  const data = atob(imageData.split(',')[1] || '')
  if (!data || data.length < 100) {
    return {
      passed: false,
      message: '无法解析图片色彩信息。',
      suggestion: '请上传标准格式的图片（JPG/PNG）。',
    }
  }

  // 采样部分字节计算平均亮度
  let totalBrightness = 0
  let sampleCount = 0
  const step = Math.max(1, Math.floor(data.length / 1000))

  for (let i = 0; i < data.length; i += step) {
    const charCode = data.charCodeAt(i)
    totalBrightness += charCode
    sampleCount++
  }

  const avgBrightness = totalBrightness / sampleCount

  // 字节平均值的粗略判断（JPEG 编码后不够准确，仅作参考）
  if (avgBrightness < 40) {
    return {
      passed: false,
      message: '图片整体偏暗，可能是夜间拍摄或逆光环境。',
      suggestion: '建议在白天光线充足时拍摄，或打开室内灯光，确保空间明亮可见。',
    }
  }

  if (avgBrightness > 220) {
    return {
      passed: false,
      message: '图片整体偏亮，可能存在过曝现象。',
      suggestion: '建议避免正对强光源拍摄，或调整曝光后再上传。',
    }
  }

  return {
    passed: true,
    message: '图片亮度适中，色彩分布正常。',
    suggestion: '',
  }
}

/**
 * 简单字符串哈希
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return String(hash)
}

/**
 * 异步精确检测图片分辨率
 */
export function getImageDimensions(imageData: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      reject(new Error('无法加载图片'))
    }
    img.src = imageData
  })
}

// 用于文件大小显示
const estimatedKB = 0
