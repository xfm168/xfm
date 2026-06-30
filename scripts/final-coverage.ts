/**
 * 最终100%覆盖率验证
 * 用系统方法逐条验证每条rule都能触发
 */

import { GEJU_RULES, buildGeJuContext } from '../src/lib/bazi/rules/gejuRules'

const gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const zhis = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']
const shenList = ['正官','偏官','正印','偏印','正财','偏财','食神','伤官','比肩','劫财']

const GAN_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

const ZHI_ELEMENT: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

// 计算十神
function getShen(dayGan: string, otherGan: string): string {
  const dayEl = GAN_ELEMENT[dayGan]
  const otherEl = GAN_ELEMENT[otherGan]
  const dayYang = ['甲','丙','戊','庚','壬'].includes(dayGan)
  const otherYang = ['甲','丙','戊','庚','壬'].includes(otherGan)
  
  const GEN: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const OVR: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
  
  if (otherEl === dayEl) return dayYang === otherYang ? '比肩' : '劫财'
  if (otherEl === GEN[dayEl]) return dayYang === otherYang ? '食神' : '伤官'
  if (otherEl === OVR[dayEl]) return dayYang === otherYang ? '偏财' : '正财'
  if (dayEl === OVR[otherEl]) return dayYang === otherYang ? '偏官' : '正官'
  if (dayEl === GEN[otherEl]) return dayYang === otherYang ? '偏印' : '正印'
  return '比肩'
}

interface CoverageResult {
  ruleId: string
  ruleName: string
  priority: number
  category: string
  covered: boolean
  testCase?: {
    sixLines: any
    relatedShens: Record<string, string>
    strength: number
    dayGan: string
    monthZhi: string
    fiveElement: Record<string, number>
  }
}

const results: CoverageResult[] = []

for (const rule of GEJU_RULES) {
  let covered = false
  let testCase: any = null
  
  // 系统尝试所有可能的组合
  outer: for (const dayGan of gans) {
    for (const monthGan of gans) {
      if (monthGan === dayGan) continue
      
      const monthGanShen = getShen(dayGan, monthGan)
      
      // 构造完整的relatedShens（所有天干都有十神）
      const relatedShens: Record<string, string> = {}
      for (const g of gans) {
        relatedShens[g] = getShen(dayGan, g)
      }
      
      for (const monthZhi of zhis) {
        for (const dayZhi of zhis) {
          for (const hourGan of gans) {
            for (const hourZhi of zhis.slice(0, 4)) {  // 只试4个时支加速
              for (const yearGan of gans.slice(0, 5)) {   // 只试5个年干加速
                for (const yearZhi of zhis.slice(0, 4)) {   // 只试4个年支加速
                  for (const strength of [5, 15, 25, 35, 45, 55, 65, 75, 85, 95]) {
                    
                    // 构造五行计数
                    const fe: any = { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 }
                    // 让月令元素多一些
                    const monthEl = ZHI_ELEMENT[monthZhi]
                    fe[monthEl] = 3
                    
                    const sixLines = {
                      year: { gan: yearGan, zhi: yearZhi },
                      month: { gan: monthGan, zhi: monthZhi },
                      day: { gan: dayGan, zhi: dayZhi },
                      hour: { gan: hourGan, zhi: hourZhi },
                    }
                    
                    try {
                      const ctx = buildGeJuContext(
                        sixLines,
                        relatedShens as any,
                        strength,
                        dayGan,
                        monthZhi,
                        fe
                      )
                      
                      if (rule.condition(ctx as any)) {
                        covered = true
                        testCase = { sixLines, relatedShens, strength, dayGan, monthZhi, fiveElement: fe }
                        break outer
                      }
                    } catch (e) {}
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  results.push({
    ruleId: rule.id,
    ruleName: rule.name,
    priority: rule.priority,
    category: rule.category,
    covered,
    testCase,
  })
}

// 输出结果
console.log('='.repeat(80))
console.log('玄风门 V7 格局系统 - 100% Rule Coverage 最终验证')
console.log('='.repeat(80))
console.log()

const covered = results.filter(r => r.covered)
const notCovered = results.filter(r => !r.covered)

console.log(`总Rule数：${results.length}`)
console.log(`已覆盖：${covered.length}`)
console.log(`未覆盖：${notCovered.length}`)
console.log(`覆盖率：${((covered.length / results.length) * 100).toFixed(1)}%`)
console.log()

if (notCovered.length > 0) {
  console.log('=== 未覆盖Rule ===')
  console.log()
  for (const r of notCovered) {
    console.log(`❌ ${r.ruleId.padEnd(25)} ${r.ruleName.padEnd(15)} P${r.priority} [${r.category}]`)
  }
}

console.log()
console.log('=== 已覆盖Rule（按优先级降序）===')
console.log()
const sorted = [...covered].sort((a, b) => b.priority - a.priority)
for (const r of sorted) {
  console.log(`✅ P${String(r.priority).padEnd(3)} ${r.ruleId.padEnd(25)} ${r.ruleName.padEnd(15)} [${r.category}]`)
  if (r.testCase) {
    const tc = r.testCase
    console.log(`   测试用例：${tc.dayGan}日 ${tc.monthZhi}月 强度${tc.strength}`)
    console.log(`   四柱：${tc.sixLines.year.gan}${tc.sixLines.year.zhi} ${tc.sixLines.month.gan}${tc.sixLines.month.zhi} ${tc.sixLines.day.gan}${tc.sixLines.day.zhi} ${tc.sixLines.hour.gan}${tc.sixLines.hour.zhi}`)
  }
  console.log()
}
