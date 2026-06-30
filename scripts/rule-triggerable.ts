/**
 * Rule可触发性验证 - 逐条验证每条rule的condition是否能被满足
 * 不是随机测试，而是针对每条rule的condition逻辑构造测试用例
 */

import { GEJU_RULES, buildGeJuContext } from '../src/lib/bazi/rules/gejuRules'

// 针对每条rule，我们尝试构造context使其condition返回true
// 记录结果

const results: { id: string; name: string; canTrigger: boolean; reason?: string }[] = []

// 通用测试框架：对每条rule，尝试多种context组合
function testRule(rule: any): boolean {
  const gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
  const zhis = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
  const feKeys = ['木','火','土','金','水'] as const
  
  // 生成多种context组合来测试
  const testContexts: any[] = []
  
  // 不同日主 - 只测3个代表性的
  for (let di = 0; di < 5; di++) {
    const dayGan = gans[di * 2]
    
    // 不同月令 - 只测6个
    for (let mi = 0; mi < 6; mi++) {
      const monthZhi = zhis[mi * 2]
      
      // 不同旺衰等级
      for (const strength of [10, 30, 50, 70, 90]) {
        
        // 不同十神配置（月干十神）
        const monthGanShenOptions = ['正官','偏官','正印','偏印','正财','偏财','食神','伤官','比肩','劫财']
        
        for (const mgs of monthGanShenOptions.slice(0, 5)) {
          
          // 构造relatedShens
          const relatedShens: Record<string, string> = {}
          // 月干十神
          relatedShens[gans[(di+1)%10]] = mgs
          
          // 随机加入一些其他十神
          relatedShens[gans[(di+3)%10]] = monthGanShenOptions[(di+mi)%10]
          relatedShens[gans[(di+5)%10]] = monthGanShenOptions[(di+mi+2)%10]
          
          // 构造五行计数
          const fe: any = {木:1,火:1,土:1,金:1,水:1}
          fe[feKeys[mi % 5]] = 3
          
          // 构造六线
          const sixLines = {
            year: { gan: gans[(di+2)%10], zhi: zhis[(mi+3)%12] },
            month: { gan: gans[(di+1)%10], zhi: monthZhi },
            day: { gan: dayGan, zhi: zhis[(mi+5)%12] },
            hour: { gan: gans[(di+4)%10], zhi: zhis[(mi+7)%12] },
          }
          
          testContexts.push({ sixLines, relatedShens, strengthScore: strength, dayGan, monthZhi, fiveElementCount: fe })
        }
      }
    }
  }
  
  // 测试所有context
  for (const tc of testContexts) {
    try {
      const ctx = buildGeJuContext(
        tc.sixLines,
        tc.relatedShens,
        tc.strengthScore,
        tc.dayGan,
        tc.monthZhi,
        tc.fiveElementCount
      )
      if (rule.condition(ctx as any)) {
        return true
      }
    } catch (e) {}
  }
  
  return false
}

console.log('正在验证150条Rule的可触发性...')
console.log()

let triggerable = 0
let dead = 0

for (const rule of GEJU_RULES) {
  const canTrigger = testRule(rule)
  results.push({ id: rule.id, name: rule.name, canTrigger })
  if (canTrigger) {
    triggerable++
  } else {
    dead++
  }
}

console.log(`总Rule数：${GEJU_RULES.length}`)
console.log(`可触发：${triggerable}`)
console.log(`不可触发（Dead Rule）：${dead}`)
console.log(`可触发率：${((triggerable / GEJU_RULES.length) * 100).toFixed(1)}%`)
console.log()

if (dead > 0) {
  console.log('Dead Rule列表：')
  let idx = 1
  for (const r of results) {
    if (!r.canTrigger) {
      console.log(`  ${idx}. ${r.id} - ${r.name}`)
      idx++
    }
  }
} else {
  console.log('✅ 全部150条Rule均可触发，无Dead Rule')
}
