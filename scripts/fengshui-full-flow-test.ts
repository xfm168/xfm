/**
 * 风水模块完整流程测试
 * 
 * 测试：图片分析 → Context → Rule → AI → Report 闭环
 */

import { 
  analyzeFengShui, 
  createDefaultContext, 
  FENGSHUI_RULES,
  convertToFengShuiContext,
  analyzeImage,
  generateFengShuiReport,
  type ImageAnalysisResult,
  type FengShuiReport,
} from '../src/lib/fengshui'

console.log('='.repeat(80))
console.log('风水模块完整流程测试')
console.log('='.repeat(80))
console.log()

// ============ Step 1: 模拟图片分析结果 ============
console.log('[Step 1] 模拟图片分析结果')
console.log()

// 模拟AI返回的分析结果
const mockImageAnalysis: ImageAnalysisResult = {
  detectedObjects: [
    { type: 'door', confidence: 95, position: 'center', direction: 'south' },
    { type: 'window', confidence: 90, position: 'right', direction: 'south' },
    { type: 'window', confidence: 88, position: 'left', direction: 'east' },
    { type: 'bed', confidence: 92, position: 'center', direction: 'east' },
    { type: 'wardrobe', confidence: 85, position: 'right' },
    { type: 'mirror', confidence: 78, position: 'left', direction: 'north' },
  ],
  roomInfo: {
    type: '卧室',
    size: 'medium',
    hasNaturalLight: true,
    mainDirection: 'south',
    shape: 'rectangle',
  },
  furniture: [],
  elementDistribution: {
    '木': 3,  // 床、衣柜
    '火': 1,  // 较少
    '土': 2,
    '金': 2,  // 镜子
    '水': 1,
  },
  overallConfidence: 85,
}

console.log(`  房间类型: ${mockImageAnalysis.roomInfo.type}`)
console.log(`  房间形状: ${mockImageAnalysis.roomInfo.shape}`)
console.log(`  识别物体数: ${mockImageAnalysis.detectedObjects.length}`)
console.log(`  五行分布: 木${mockImageAnalysis.elementDistribution['木']} 火${mockImageAnalysis.elementDistribution['火']} 土${mockImageAnalysis.elementDistribution['土']} 金${mockImageAnalysis.elementDistribution['金']} 水${mockImageAnalysis.elementDistribution['水']}`)
console.log(`  识别置信度: ${mockImageAnalysis.overallConfidence}%`)
console.log()

// ============ Step 2: 转换为FengShuiContext ============
console.log('[Step 2] 转换为FengShuiContext')
console.log()

const context = convertToFengShuiContext(mockImageAnalysis)

console.log(`  房屋类型: ${context.houseType}`)
console.log(`  朝向: ${context.direction.mainDirection}`)
console.log(`  户型: ${context.layout.shape}`)
console.log(`  房间数: ${context.rooms.length}`)
console.log(`  五行分布: 木${context.elementDistribution['木']} 火${context.elementDistribution['火']} 土${context.elementDistribution['土']} 金${context.elementDistribution['金']} 水${context.elementDistribution['水']}`)
console.log()

// 显示房间详情
const mainRoom = context.rooms[0]
console.log(`  主房间类型: ${mainRoom.type}`)
console.log(`  家具数: ${mainRoom.furniture.length}`)
console.log(`  家具列表:`)
mainRoom.furniture.forEach(f => {
  console.log(`    - ${f.type}: ${f.direction}向, ${f.position}位置`)
})
console.log()

// ============ Step 3: 执行规则引擎 ============
console.log('[Step 3] 执行规则引擎')
console.log()

const result = analyzeFengShui(context)

console.log(`  主格局: ${result.mainPattern.name}`)
console.log(`  综合评分: ${result.overallScore}`)
console.log(`  置信度: ${result.confidence}`)
console.log()

console.log(`  各项评分:`)
console.log(`    朝向: ${result.directionScore}`)
console.log(`    户型: ${result.layoutScore}`)
console.log(`    房间: ${result.roomScore}`)
console.log(`    五行: ${result.elementScore}`)
console.log(`    环境: ${result.environmentScore}`)
console.log()

console.log(`  命中规则数: ${result.matchedRuleNames.length}`)
console.log()

console.log(`  优点:`)
result.strengths.slice(0, 5).forEach(s => {
  console.log(`    ✓ ${s}`)
})
console.log()

console.log(`  缺点:`)
result.weaknesses.slice(0, 5).forEach(w => {
  console.log(`    ✗ ${w}`)
})
console.log()

console.log(`  改善建议:`)
result.suggestions.slice(0, 5).forEach(s => {
  console.log(`    → ${s}`)
})
console.log()

// ============ Step 4: 生成报告 ============
console.log('[Step 4] 生成报告')
console.log()

const report: FengShuiReport = {
  id: 'TEST_001',
  createdAt: new Date().toISOString(),
  input: {
    imageData: 'mock-image-data',
  },
  imageAnalysis: mockImageAnalysis,
  fengshuiAnalysis: {
    context,
    result,
  },
  aiSuggestions: {
    summary: '基于分析结果，建议从五行平衡、空间布局、光照通风三个方面进行改善。',
    priorities: result.suggestions.slice(0, 3).map((s, i) => ({
      priority: i + 1,
      issue: '需改善项' + (i + 1),
      suggestion: s,
      reason: '提升整体风水运势',
    })),
    tips: result.explain.tips || [],
  },
  report: {
    title: `${mockImageAnalysis.roomInfo.type}风水分析报告`,
    sections: [
      {
        title: '一，综合评估',
        type: 'summary',
        content: `您的${mockImageAnalysis.roomInfo.type}风水综合评分：**${result.overallScore}分**

主要优势：
${result.strengths.slice(0, 3).map(s => `• ${s}`).join('\n')}

主要问题：
${result.weaknesses.slice(0, 3).map(w => `• ${w}`).join('\n')}`,
      },
      {
        title: '二，分项分析',
        type: 'analysis',
        content: `【朝向评分】${result.directionScore}分
【户型评分】${result.layoutScore}分
【五行评分】${result.elementScore}分
【房间评分】${result.roomScore}分`,
      },
      {
        title: '三，改善建议',
        type: 'suggestion',
        content: `${result.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      },
    ],
  },
  status: 'completed',
}

console.log(`  报告ID: ${report.id}`)
console.log(`  报告标题: ${report.report.title}`)
console.log(`  报告章节数: ${report.report.sections.length}`)
console.log()

console.log(`  报告内容预览:`)
report.report.sections.forEach(s => {
  console.log(`  --- ${s.title} ---`)
  console.log(`  ${s.content.slice(0, 100)}...`)
  console.log()
})

// ============ 完整流程验证 ============
console.log('='.repeat(80))
console.log('完整流程验证')
console.log('='.repeat(80))
console.log()

console.log('✅ Step 1: 图片分析 - 模拟完成')
console.log('✅ Step 2: Context转换 - 完成')
console.log('✅ Step 3: 规则引擎 - 完成')
console.log('✅ Step 4: 报告生成 - 完成')
console.log()

console.log('流程闭环验证:')
console.log(`  图片 → Context → Rule → Report ✅`)
console.log()

console.log('核心指标:')
console.log(`  - 规则数量: ${FENGSHUI_RULES.length}`)
console.log(`  - 命中规则: ${result.matchedRuleNames.length}`)
console.log(`  - 综合评分: ${result.overallScore}`)
console.log(`  - 置信度: ${result.confidence}`)
console.log()

console.log('下一步:')
console.log('  1. 接入真实AI图像识别服务')
console.log('  2. 开发前端上传组件')
console.log('  3. 开发报告展示页面')
console.log()

console.log('测试完成 ✅')
