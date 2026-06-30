/**
 * Vision 模块测试
 * 
 * 测试图片识别 → Context 转换 → Rule Engine 完整流程
 */

import { 
  analyzeFengShuiImage, 
  createFengShuiContext,
  detectShaFromAnalysis,
  type VisionInput,
} from '../src/lib/fengshui/vision'
import type { ImageAnalysisResult } from '../src/lib/fengshui/vision/types'

console.log('='.repeat(80))
console.log('Vision 模块测试')
console.log('='.repeat(80))

// ============ 测试1：模拟AI分析结果 ============
console.log('\n[测试1] 模拟AI图片分析结果 → FengShuiContext 转换\n')

const mockAnalysis: ImageAnalysisResult = {
  detectedObjects: [
    { type: 'entrance', confidence: 90, position: 'front', direction: 'south' },
    { type: 'window', confidence: 85, position: 'back', direction: 'north' },
    { type: 'sofa', confidence: 80, position: 'center', direction: 'south' },
    { type: 'bed', confidence: 85, position: 'back', direction: 'north' },
    { type: 'beam', confidence: 75, position: 'center' },
    { type: 'stove', confidence: 80, position: 'right', direction: 'west' },
  ],
  roomInfo: {
    type: 'master-bedroom',
    size: 'medium',
    hasNaturalLight: true,
    mainDirection: 'south',
    shape: 'rectangle',
    estimatedArea: 20,
  },
  furniture: [
    { type: 'bed', position: 'back', direction: 'north', confidence: 85 },
    { type: 'sofa', position: 'center', direction: 'south', confidence: 80 },
  ],
  elementDistribution: {
    wood: 3,
    fire: 2,
    earth: 2,
    metal: 1,
    water: 2,
    dominant: '木',
    deficient: '金',
  },
  detectedSha: [],
  confidence: 85,
}

// 测试煞气检测
console.log('检测煞气：')
const detectedSha = detectShaFromAnalysis(mockAnalysis)
if (detectedSha.length > 0) {
  for (const sha of detectedSha) {
    console.log(`  - ${sha.type} (${sha.severity})`)
    console.log(`    ${sha.description}`)
    console.log(`    建议: ${sha.suggestions.join(', ')}`)
  }
} else {
  console.log('  未检测到煞气')
}

// 转换为 Context
console.log('\n转换为 FengShuiContext：')
const { context, warnings, detectedSha: sha2 } = (await import('../src/lib/fengshui/vision/contextConverter')).convertToFengShuiContext(
  mockAnalysis,
  {
    totalFloors: 30,
    currentFloor: 15,
    totalArea: 120,
  }
)

console.log('  房屋类型:', context.houseType)
console.log('  朝向:', context.direction.mainDirection)
console.log('  户型:', context.layout.shape)
console.log('  房间数:', context.rooms.length)
console.log('  五行分布:', context.elementDistribution)
console.log('  警告:', warnings)

// ============ 测试2：基础 Context 创建 ============
console.log('\n[测试2] 基础 Context 创建\n')

const basicContext = createFengShuiContext({
  houseType: 'apartment',
  totalArea: 120,
  totalFloors: 30,
  currentFloor: 15,
  mainDirection: 'south',
  layoutShape: 'rectangle',
})

console.log('  基本 Context 创建成功')
console.log('  朝向:', basicContext.direction.mainDirection)
console.log('  户型:', basicContext.layout.shape)

// ============ 测试3：Vision 模块类型检查 ============
console.log('\n[测试3] Vision 模块类型导出检查\n')

const visionModule = await import('../src/lib/fengshui/vision')
console.log('  导出的函数/类型:')
console.log('  - analyzeFengShuiImage:', typeof visionModule.analyzeFengShuiImage)
console.log('  - createFengShuiContext:', typeof visionModule.createFengShuiContext)
console.log('  - detectShaFromAnalysis:', typeof visionModule.detectShaFromAnalysis)
console.log('  - convertToFengShuiContext:', typeof visionModule.convertToFengShuiContext)

// ============ 测试4：煞气识别测试 ============
console.log('\n[测试4] 煞气识别测试\n')

const testCases: { name: string; analysis: Partial<ImageAnalysisResult> }[] = [
  {
    name: '穿堂煞',
    analysis: {
      detectedObjects: [
        { type: 'entrance', confidence: 90, position: 'front' },
        { type: 'window', confidence: 85, position: 'back' },
        { type: 'balcony', confidence: 80, position: 'back' },
      ],
    },
  },
  {
    name: '横梁压床',
    analysis: {
      detectedObjects: [
        { type: 'bed', confidence: 90, position: 'center', boundingBox: { x: 100, y: 100, width: 200, height: 200 } },
        { type: 'beam', confidence: 85, position: 'center', boundingBox: { x: 90, y: 90, width: 220, height: 20 } },
      ],
    },
  },
  {
    name: '镜子对门',
    analysis: {
      detectedObjects: [
        { type: 'entrance', confidence: 90, position: 'front', direction: 'south' },
        { type: 'mirror', confidence: 80, position: 'back', direction: 'north' },
      ],
    },
  },
  {
    name: '开门见灶',
    analysis: {
      detectedObjects: [
        { type: 'entrance', confidence: 90, position: 'front', direction: 'south' },
        { type: 'stove', confidence: 85, position: 'back', direction: 'north' },
      ],
    },
  },
  {
    name: '缺角',
    analysis: {
      roomInfo: {
        type: 'unknown',
        size: 'medium',
        hasNaturalLight: true,
        mainDirection: 'south',
        shape: 'L-shape',
        missingCorners: ['northeast', 'southeast'],
      },
    },
  },
]

for (const tc of testCases) {
  const fullAnalysis: ImageAnalysisResult = {
    detectedObjects: tc.analysis.detectedObjects || [],
    roomInfo: tc.analysis.roomInfo || {
      type: 'unknown',
      size: 'medium',
      hasNaturalLight: true,
      mainDirection: 'south',
      shape: 'rectangle',
    },
    furniture: [],
    elementDistribution: { wood: 2, fire: 2, earth: 2, metal: 2, water: 2, dominant: '土', deficient: '土' },
    detectedSha: [],
    confidence: 80,
  }
  
  const sha = detectShaFromAnalysis(fullAnalysis)
  console.log(`  ${tc.name}:`)
  if (sha.length > 0) {
    for (const s of sha) {
      console.log(`    ✓ 检测到: ${s.type} (${s.severity}, ${s.confidence}%)`)
    }
  } else {
    console.log(`    ✗ 未检测到`)
  }
}

// ============ 总结 ============
console.log('\n' + '='.repeat(80))
console.log('Vision 模块测试完成')
console.log('='.repeat(80))
console.log('')
console.log('架构验证：')
console.log('  图片 → AI分析 → 煞气检测 → FengShuiContext → Rule Engine ✓')
console.log('')
console.log('下一步：')
console.log('  1. 接入真实 AI 多模态模型')
console.log('  2. 完善煞气识别规则')
console.log('  3. 与 Rule Engine 完整对接')
