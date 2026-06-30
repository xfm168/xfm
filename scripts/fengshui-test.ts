/**
 * 风水模块测试
 */

import { analyzeFengShui, createExampleContext, createDefaultContext, FENGSHUI_RULES } from '../src/lib/fengshui'

console.log('='.repeat(80))
console.log('风水模块测试')
console.log('='.repeat(80))
console.log()

// 1. 检查规则数量
console.log('[1] 规则数量检查')
console.log(`  FENGSHUI_RULES 数量: ${FENGSHUI_RULES.length}`)
const categories = new Map<string, number>()
for (const rule of FENGSHUI_RULES) {
  categories.set(rule.category, (categories.get(rule.category) || 0) + 1)
}
console.log('  分类统计:')
for (const [cat, count] of categories) {
  console.log(`    ${cat}: ${count}`)
}
console.log()

// 2. 测试示例上下文
console.log('[2] 示例上下文测试')
const exampleCtx = createExampleContext()
console.log(`  房屋类型: ${exampleCtx.houseType}`)
console.log(`  朝向: ${exampleCtx.direction.mainDirection}`)
console.log(`  户型: ${exampleCtx.layout.shape}`)
console.log(`  房间数: ${exampleCtx.rooms.length}`)
console.log(`  五行分布: 木${exampleCtx.elementDistribution['木']} 火${exampleCtx.elementDistribution['火']} 土${exampleCtx.elementDistribution['土']} 金${exampleCtx.elementDistribution['金']} 水${exampleCtx.elementDistribution['水']}`)
console.log()

// 3. 执行风水分析
console.log('[3] 风水分析结果')
const result = analyzeFengShui(exampleCtx)

console.log(`  主格局: ${result.mainPattern.name}`)
console.log(`  综合评分: ${result.overallScore}`)
console.log(`  置信度: ${result.confidence}`)
console.log(`  置信度原因: ${result.confidenceReason}`)
console.log()

console.log('  各项评分:')
console.log(`    朝向: ${result.directionScore}`)
console.log(`    户型: ${result.layoutScore}`)
console.log(`    房间: ${result.roomScore}`)
console.log(`    五行: ${result.elementScore}`)
console.log(`    环境: ${result.environmentScore}`)
console.log()

console.log(`  命中规则数: ${result.matchedRuleNames.length}`)
if (result.matchedRuleNames.length > 0) {
  console.log(`  命中规则: ${result.matchedRuleNames.slice(0, 10).join(', ')}${result.matchedRuleNames.length > 10 ? '...' : ''}`)
}
console.log()

console.log('  优点:')
for (const s of result.strengths.slice(0, 5)) {
  console.log(`    ✓ ${s}`)
}
console.log()

console.log('  缺点:')
for (const w of result.weaknesses.slice(0, 5)) {
  console.log(`    ✗ ${w}`)
}
console.log()

console.log('  改善建议:')
for (const s of result.suggestions.slice(0, 5)) {
  console.log(`    → ${s}`)
}
console.log()

console.log('  注意事项:')
for (const w of result.warnings.slice(0, 3)) {
  console.log(`    ⚠ ${w}`)
}
console.log()

// 4. 测试不同配置
console.log('[4] 不同配置测试')
const configs = [
  { name: '坐北朝南户型方正', ctx: createDefaultContext({ direction: { mainDirection: 'south', facingDirection: 'north', doorDirection: 'south' }, layout: { shape: 'square', score: 90, missingCorners: [], totalArea: 100, usableArea: 95 } }) },
  { name: '坐南朝北缺角', ctx: createDefaultContext({ direction: { mainDirection: 'north', facingDirection: 'south', doorDirection: 'north' }, layout: { shape: 'irregular', score: 50, missingCorners: ['north', 'east'], totalArea: 100, usableArea: 80 } }) },
  { name: '五行失衡', ctx: createDefaultContext({ elementDistribution: { '木': 4, '火': 1, '土': 1, '金': 3, '水': 1 } }) },
  { name: '路冲煞', ctx: createDefaultContext({ nearbyTJunction: true, nearbyPole: true }) },
]

for (const { name, ctx } of configs) {
  const r = analyzeFengShui(ctx)
  console.log(`  ${name}: 综合${r.overallScore} | 朝向${r.directionScore} | 户型${r.layoutScore} | 五行${r.elementScore}`)
}
console.log()

// 5. 性能测试
console.log('[5] 性能测试')
const iterations = 1000
const start = performance.now()
for (let i = 0; i < iterations; i++) {
  analyzeFengShui(exampleCtx)
}
const end = performance.now()
const avgTime = (end - start) / iterations
console.log(`  ${iterations}次分析平均耗时: ${avgTime.toFixed(3)}ms`)
console.log(`  TPS: ${Math.round(1000 / avgTime)}`)
console.log()

console.log('测试完成 ✅')
