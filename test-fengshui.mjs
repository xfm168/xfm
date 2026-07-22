import { createDefaultContext } from './src/lib/fengshui/index.ts'
import { buildProfessionalReportV31 } from './src/lib/fengshui/v31/report/index.ts'

console.log('=== 风水勘测真实运行测试 ===\n')

console.log('1. 测试 createDefaultContext...')
try {
  const ctx = createDefaultContext()
  console.log('   ✓ 上下文创建成功')
  console.log('   房屋类型:', ctx.houseType)
  console.log('   总面积:', ctx.totalArea)
  console.log('   朝向:', ctx.direction?.mainDirection)
} catch (e) {
  console.log('   ✗ 失败:', e.message)
  console.log('   堆栈:', e.stack)
}

console.log('\n2. 测试 buildProfessionalReportV31（客厅）...')
try {
  const ctx = createDefaultContext({ houseType: 'apartment', totalArea: 120 })
  const report = buildProfessionalReportV31({
    roomType: 'living_room',
    context: ctx,
    analysisResult: {
      roomType: 'living_room',
      features: [],
      issues: [],
      suggestions: [],
      score: 75
    }
  })
  console.log('   ✓ 报告生成成功')
  console.log('   报告类型:', report.roomType)
  console.log('   总分:', report.overallScore)
  console.log('   章节数:', report.sections ? report.sections.length : 0)
} catch (e) {
  console.log('   ✗ 失败:', e.message)
  console.log('   堆栈:', e.stack)
}

console.log('\n3. 测试 buildProfessionalReportV31（卧室）...')
try {
  const ctx = createDefaultContext({ houseType: 'apartment' })
  const report = buildProfessionalReportV31({
    roomType: 'bedroom',
    context: ctx,
    analysisResult: {
      roomType: 'bedroom',
      features: [],
      issues: [],
      suggestions: [],
      score: 70
    }
  })
  console.log('   ✓ 卧室报告生成成功')
  console.log('   总分:', report.overallScore)
  console.log('   章节数:', report.sections ? report.sections.length : 0)
} catch (e) {
  console.log('   ✗ 失败:', e.message)
  console.log('   堆栈:', e.stack)
}

console.log('\n4. 测试所有房间类型...')
try {
  const roomTypes = ['living_room', 'bedroom', 'kitchen', 'bathroom', 'study', 'balcony', 'master_bedroom', 'dining_room', 'entrance', 'house']
  const ctx = createDefaultContext()
  let failed = []
  for (const rt of roomTypes) {
    try {
      const report = buildProfessionalReportV31({
        roomType: rt,
        context: ctx,
        analysisResult: {
          roomType: rt,
          features: [],
          issues: [],
          suggestions: [],
          score: 80
        }
      })
      if (!report || !report.overallScore) failed.push(rt + '(空报告)')
    } catch (e) {
      failed.push(rt + '(' + e.message + ')')
    }
  }
  if (failed.length === 0) {
    console.log('   ✓ 所有房间类型报告均生成成功')
  } else {
    console.log('   ✗ 失败房间:', failed.join(', '))
  }
} catch (e) {
  console.log('   ✗ 失败:', e.message)
  console.log('   堆栈:', e.stack)
}
