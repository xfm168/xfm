/**
 * 风水图片识别模块 (Vision Module)
 * 
 * 架构：图片 → AI分析 → FengShuiContext → Rule Engine → Explain Engine → AI Report
 * 
 * 使用方式：
 * 
 * ```typescript
 * import { analyzeFengShuiImage, createFengShuiContext } from './vision'
 * 
 * // 分析图片
 * const result = await analyzeFengShuiImage({
 *   imageData: 'base64...',
 *   imageType: 'room-photo',
 * })
 * 
 * // 使用结果
 * const context = result.context  // FengShuiContext
 * const sha = result.detectedSha // 识别到的煞气
 * ```
 */

export * from './types'
export * from './contextConverter'
export * from './analyzer'

// 重新导出主函数，方便使用
import { analyzeFengShuiImage, createFengShuiContext } from './analyzer'
export { analyzeFengShuiImage, createFengShuiContext }

// 导出便捷类型
export type { VisionInput, VisionReport } from './types'
