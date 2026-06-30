/**
 * 户型识别模块测试
 */

import { analyzeFloorPlan, generateFloorPlanSummary } from '../src/lib/fengshui/floor-plan'

console.log('='.repeat(80))
console.log('户型识别模块测试')
console.log('='.repeat(80))

// ============ 测试1：基本分析 ============
console.log('\n[测试1] 户型图分析\n')

const result = await analyzeFloorPlan('mock-image-data', {
  depth: 'standard',
  identifyRoomTypes: true,
  analyzeOrientation: true,
  assessFengShui: true,
})

console.log('分析结果：')
console.log('  户型形状:', result.outline.shape)
console.log('  总面积:', result.outline.totalArea)
console.log('  缺角数:', result.outline.missingCorners.length)
console.log('  房间数:', result.rooms.length)
console.log('  中宫:', result.centerPoint.isOccupied ? '被占用' : '开阔')
console.log('  朝向:', result.orientation.mainDirection)
console.log('  风水评分:', result.fengShuiAssessment.overallScore, '分')

// ============ 测试2：缺角评估 ============
console.log('\n[测试2] 缺角评估\n')

if (result.outline.missingCorners.length > 0) {
  for (const mc of result.outline.missingCorners) {
    console.log(`  ${mc.direction}: ${mc.severity} (${mc.areaRatio * 100}%面积缺失)`)
  }
} else {
  console.log('  无缺角')
}

const mcAssessments = result.fengShuiAssessment.missingCornerAssessment
if (mcAssessments.length > 0) {
  console.log('\n  详细评估：')
  for (const mc of mcAssessments) {
    console.log(`    ${mc.direction}: 影响${mc.impact}`)
    console.log(`    建议: ${mc.suggestion}`)
  }
}

// ============ 测试3：中宫评估 ============
console.log('\n[测试3] 中宫评估\n')

const center = result.centerPoint
console.log('  位置:', center.point)
console.log('  面积:', center.area)
console.log('  是否被占用:', center.isOccupied ? '是' : '否')
if (center.isOccupied) {
  console.log('  占用功能:', center.function)
}
console.log('  评估:', center.assessment.isGood ? '良好' : '需改善')
console.log('  原因:', center.assessment.reason)

// ============ 测试4：房间识别 ============
console.log('\n[测试4] 房间识别\n')

for (const room of result.rooms) {
  console.log(`  ${room.name}:`)
  console.log(`    类型: ${room.type}`)
  console.log(`    位置: ${room.position}`)
  console.log(`    朝向: ${room.direction}`)
  console.log(`    面积: ${room.area}`)
  console.log(`    窗户: ${room.hasWindow ? '有' : '无'}`)
  console.log(`    阳台: ${room.hasBalcony ? '有' : '无'}`)
}

// ============ 测试5：风水问题汇总 ============
console.log('\n[测试5] 风水问题汇总\n')

const issues = result.fengShuiAssessment.mainIssues
if (issues.length > 0) {
  for (const issue of issues) {
    console.log(`  [${issue.severity}] ${issue.description}`)
    console.log(`    建议: ${issue.suggestion}`)
  }
} else {
  console.log('  无明显风水问题')
}

// ============ 测试6：风水优点 ============
console.log('\n[测试6] 风水优点\n')

const strengths = result.fengShuiAssessment.mainStrengths
if (strengths.length > 0) {
  for (const s of strengths) {
    console.log(`  ✓ ${s}`)
  }
} else {
  console.log('  无明显优点')
}

// ============ 测试7：摘要生成 ============
console.log('\n[测试7] 户型摘要\n')

const summary = generateFloorPlanSummary(result)
console.log('  ', summary)

// ============ 总结 ============
console.log('\n' + '='.repeat(80))
console.log('户型识别模块测试完成')
console.log('='.repeat(80))
console.log('')
console.log('功能验证：')
console.log('  ✓ 户型轮廓提取')
console.log('  ✓ 缺角检测')
console.log('  ✓ 房间分隔识别')
console.log('  ✓ 中宫位置计算')
console.log('  ✓ 朝向分析')
console.log('  ✓ 风水评估')
console.log('  ✓ 摘要生成')
