/**
 * 获取所有未命中Rule的condition源码
 * 用于分析和构造测试用例
 */

import { GEJU_RULES, buildGeJuContext } from '../src/lib/bazi/rules/gejuRules'

// 先找出哪些rule未命中（基于之前的统计）
// 我们用一个更系统的方法：对每条rule，尝试构造context使其condition返回true

const gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const zhis = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

interface TriggerResult {
  id: string
  name: string
  priority: number
  category: string
  canTrigger: boolean
  testCase?: any
  conditionCode: string
}

const results: TriggerResult[] = []

// 对每条rule，尝试多种context组合
for (const rule of GEJU_RULES) {
  let triggered = false
  let testCase: any = null

  // 系统尝试各种组合
  const combos = generateCombos()
  
  for (const combo of combos) {
    try {
      const ctx = buildGeJuContext(
        combo.sixLines,
        combo.relatedShens,
        combo.strength,
        combo.dayGan,
        combo.monthZhi,
        combo.fiveElement
      )
      
      // 手动设置一些可能需要的字段
      ;(ctx as any).tongGenCount = combo.tongGenCount
      ;(ctx as any).diffPartyCount = combo.diffPartyCount
      ;(ctx as any).touGanCount = combo.touGanCount
      ;(ctx as any).hasTongGen = combo.hasTongGen
      ;(ctx as any).monthElement = combo.monthElement
      
      if (rule.condition(ctx as any)) {
        triggered = true
        testCase = combo
        break
      }
    } catch (e) {}
  }

  results.push({
    id: rule.id,
    name: rule.name,
    priority: rule.priority,
    category: rule.category,
    canTrigger: triggered,
    testCase,
    conditionCode: rule.condition.toString().slice(0, 200)
  })
}

function generateCombos(): any[] {
  const combos: any[] = []
  const shenList = ['正官','偏官','正印','偏印','正财','偏财','食神','伤官','比肩','劫财']
  
  // 生成关键组合
  for (let di = 0; di < 5; di++) {
    const dayGan = gans[di * 2]
    for (let mi = 0; mi < 6; mi++) {
      const monthZhi = zhis[mi * 2]
      for (const strength of [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]) {
        for (const monthGanShen of shenList.slice(0, 5)) {
          const relatedShens: Record<string, string> = {}
          // 月干十神
          relatedShens[gans[(di * 2 + 1) % 10]] = monthGanShen
          // 再加几个
          relatedShens[gans[(di * 2 + 3) % 10]] = shenList[(di + mi) % 10]
          relatedShens[gans[(di * 2 + 5) % 10]] = shenList[(di + mi + 2) % 10]
          
          for (const tongGenCount of [0, 1, 2, 3]) {
            for (const diffPartyCount of [0, 2, 3, 4, 5]) {
              for (const touGanCount of [0, 1, 2, 3]) {
                const fiveElement: any = {木:2,火:2,土:2,金:2,水:2}
                fiveElement[['木','火','土','金','水'][mi % 5]] = 3
                
                const monthZhiElement = ['水','土','木','木','土','火','火','土','金','金','土','水'][[
                  '子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'
                ].indexOf(monthZhi)]
                
                combos.push({
                  sixLines: {
                    year: { gan: gans[(di * 2 + 2) % 10], zhi: zhis[(mi + 1) % 12] },
                    month: { gan: gans[(di * 2 + 1) % 10], zhi: monthZhi },
                    day: { gan: dayGan, zhi: zhis[(mi + 3) % 12] },
                    hour: { gan: gans[(di * 2 + 4) % 10], zhi: zhis[(mi + 5) % 12] },
                  },
                  relatedShens,
                  strength,
                  dayGan,
                  monthZhi,
                  fiveElement,
                  tongGenCount,
                  diffPartyCount,
                  touGanCount,
                  hasTongGen: tongGenCount >= 1,
                  monthElement: monthZhiElement,
                })
              }
            }
          }
        }
      }
    }
  }
  
  return combos.slice(0, 5000) // 限制数量防止太慢
}

// 输出结果
console.log('总Rule数：', GEJU_RULES.length)
console.log('可触发：', results.filter(r => r.canTrigger).length)
console.log('不可触发：', results.filter(r => !r.canTrigger).length)
console.log()

console.log('=== 可触发Rule ===')
for (const r of results.filter(r => r.canTrigger)) {
  console.log(`  ✅ ${r.id} - ${r.name} (P${r.priority})`)
}

console.log()
console.log('=== 不可触发Rule（需人工验证）===')
for (const r of results.filter(r => !r.canTrigger)) {
  console.log(`  ❌ ${r.id} - ${r.name} (P${r.priority}) [${r.category}]`)
  console.log(`     condition: ${r.conditionCode}...`)
  console.log()
}
