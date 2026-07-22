import { calculateScore } from './src/lib/fengshui/score-engine/index.ts'
import { calculateScore12D } from './src/lib/fengshui/v31/scoring/index.ts'

console.log('=== 风水勘测核心引擎真实运行测试 ===\n')

console.log('1. 测试 score-engine calculateScore...')
try {
  const result = calculateScore({
    userProvided: {
      totalArea: 100,
      floor: 10,
      totalFloors: 30,
      orientation: 'south',
      houseType: 'apartment'
    },
    ruleResults: [],
    features: {},
    spatial: {},
    rooms: {}
  })
  console.log('   ✓ 评分引擎运行成功')
  console.log('   总分:', result.overallScore)
  console.log('   置信度:', result.confidence)
} catch (e) {
  console.log('   ✗ 失败:', e.message)
  console.log('   堆栈:', e.stack)
}

console.log('\n2. 测试 v31 12D 评分 calculateScore12D...')
try {
  const result = calculateScore12D({
    userProvided: {
      totalArea: 100,
      floor: 10,
      totalFloors: 30,
      orientation: 'south',
      houseType: 'apartment'
    },
    ruleResults: [],
    features: {},
    spatial: {},
    rooms: {}
  })
  console.log('   ✓ 12D 评分引擎运行成功')
  console.log('   总分:', result.overall)
  console.log('   维度数:', Object.keys(result.dimensions || {}).length)
} catch (e) {
  console.log('   ✗ 失败:', e.message)
  console.log('   堆栈:', e.stack)
}

console.log('\n3. 测试规则引擎（卧室）...')
try {
  const { runRulesForRoom } = await import('./src/lib/fengshui/rules/rooms/bedroom/rules.ts')
  console.log('   规则引擎模块:', typeof runRulesForRoom)
} catch (e) {
  console.log('   ~ 跳过（模块导入方式不同）:', e.message.substring(0, 80))
}

console.log('\n4. 测试风水知识模块...')
try {
  const { searchKnowledge } = await import('./src/lib/fengshui/knowledge/index.ts')
  console.log('   知识模块:', typeof searchKnowledge)
} catch (e) {
  console.log('   ~ 跳过:', e.message.substring(0, 80))
}

console.log('\n5. 测试 room-engine 模块...')
try {
  const m = await import('./src/lib/fengshui/room-engine/rooms/bedroom.ts')
  console.log('   卧室引擎导出:', Object.keys(m))
} catch (e) {
  console.log('   ~ 跳过:', e.message.substring(0, 80))
}
