/**
 * 最终100%覆盖率验证 - 优化版
 * 按规则类型分类，针对性构造测试用例
 */

import { GEJU_RULES, buildGeJuContext } from '../src/lib/bazi/rules/gejuRules'

const gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const zhis = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

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

function makeRelatedShens(dayGan: string): Record<string, string> {
  const r: Record<string, string> = {}
  for (const g of gans) r[g] = getShen(dayGan, g)
  return r
}

// ===== 生成大量测试context =====
function generateContexts(count: number): any[] {
  const ctxs: any[] = []
  
  for (let i = 0; i < count; i++) {
    const dayGan = gans[i % 10]
    const monthGan = gans[(i * 3) % 10]
    const monthZhi = zhis[(i * 7) % 12]
    const dayZhi = zhis[(i * 11) % 12]
    const hourGan = gans[(i * 13) % 10]
    const hourZhi = zhis[(i * 17) % 12]
    const yearGan = gans[(i * 19) % 10]
    const yearZhi = zhis[(i * 23) % 12]
    const strength = (i * 31) % 100
    
    const relatedShens = makeRelatedShens(dayGan)
    
    const fe: any = { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 }
    fe[ZHI_ELEMENT[monthZhi]] = 2 + (i % 3)
    
    const sixLines = {
      year: { gan: yearGan, zhi: yearZhi },
      month: { gan: monthGan, zhi: monthZhi },
      day: { gan: dayGan, zhi: dayZhi },
      hour: { gan: hourGan, zhi: hourZhi },
    }
    
    try {
      const ctx = buildGeJuContext(sixLines, relatedShens as any, strength, dayGan, monthZhi, fe)
      ctxs.push(ctx)
    } catch (e) {}
  }
  
  return ctxs
}

// ===== 主逻辑 =====
console.log('生成测试context...')
const allContexts = generateContexts(5000)  // 生成5000个
console.log(`生成了${allContexts.length}个context`)
console.log()

console.log('验证每条Rule...')
console.log()

interface Result {
  ruleId: string
  ruleName: string
  priority: number
  category: string
  covered: boolean
  hitIndex?: number
}

const results: Result[] = []

for (const rule of GEJU_RULES) {
  let covered = false
  let hitIndex = -1
  
  for (let i = 0; i < allContexts.length; i++) {
    try {
      if (rule.condition(allContexts[i] as any)) {
        covered = true
        hitIndex = i
        break
      }
    } catch (e) {}
  }
  
  results.push({
    ruleId: rule.id,
    ruleName: rule.name,
    priority: rule.priority,
    category: rule.category,
    covered,
    hitIndex,
  })
}

// ===== 输出 =====
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
    console.log(`❌ P${String(r.priority).padEnd(3)} ${r.ruleId.padEnd(25)} ${r.ruleName.padEnd(15)} [${r.category}]`)
  }
  console.log()
  
  // 输出未覆盖rule的condition源码（前100字）
  console.log('未覆盖Rule的condition摘要：')
  console.log()
  for (const r of notCovered) {
    const rule = GEJU_RULES.find(ru => ru.id === r.ruleId)!
    const cond = rule.condition.toString().replace(/\s+/g, ' ').slice(0, 120)
    console.log(`  ${r.ruleId}: ${cond}...`)
  }
}
