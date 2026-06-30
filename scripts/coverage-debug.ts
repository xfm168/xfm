/**
 * 精确覆盖率测试 - 直接调用每条rule的condition函数
 * 针对每条未覆盖的rule，手动构造ctx使其condition返回true
 */

import { GEJU_RULES, buildGeJuContext, determineGeJu } from '../src/lib/bazi/rules/gejuRules'

// 先看buildGeJuContext需要什么参数
const testCtx = buildGeJuContext(
  { year: {gan:'甲',zhi:'子'}, month: {gan:'乙',zhi:'丑'}, day: {gan:'丙',zhi:'寅'}, hour: {gan:'丁',zhi:'卯'} },
  { '甲': '比肩', '乙': '劫财' },
  50,
  '丙',
  '寅',
  { '木':3, '火':2, '土':1, '金':0, '水':0 }
)

console.log('Context字段：', Object.keys(testCtx))
console.log()

// 统计每条rule的condition是否可以被触发
let hitCount = 0
const missed: typeof GEJU_RULES = []

for (const rule of GEJU_RULES) {
  try {
    // 用一个通用context测试
    const ctx = buildGeJuContext(
      { year: {gan:'甲',zhi:'子'}, month: {gan:'乙',zhi:'丑'}, day: {gan:'丙',zhi:'寅'}, hour: {gan:'丁',zhi:'卯'} },
      { '甲': '比肩', '乙': '劫财' },
      50,
      '丙',
      '寅',
      { '木':3, '火':2, '土':1, '金':0, '水':0 }
    )
    
    // 检查条件
    const result = rule.condition(ctx as any)
    if (result) {
      hitCount++
    } else {
      missed.push(rule)
    }
  } catch (e) {
    missed.push(rule)
  }
}

console.log(`总Rule数：${GEJU_RULES.length}`)
console.log(`单个通用context命中：${hitCount}`)
console.log(`未命中：${missed.length}`)
console.log()

console.log('未命中的Rule列表：')
for (let i = 0; i < missed.length; i++) {
  console.log(`  ${i+1}. ${missed[i].id} - ${missed[i].name} [priority: ${missed[i].priority}]`)
}
