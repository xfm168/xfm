/**
 * 最后2条的精确构造
 */

import { GEJU_RULES, buildGeJuContext } from '../src/lib/bazi/rules/gejuRules'

const gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const zhis = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

const GAN_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
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

function findGanForShen(dayGan: string, target: string): string {
  for (const g of gans) {
    if (getShen(dayGan, g) === target) return g
  }
  return gans[0]
}

function makeRS(dayGan: string): Record<string, string> {
  const r: Record<string, string> = {}
  for (const g of gans) r[g] = getShen(dayGan, g)
  return r
}

// 官轻印重
console.log('测试：官轻印重')
const rule1 = GEJU_RULES.find(r => r.id === 'guanqing-yinzhong')!
// 需要：月干正官 + 印星>=2 + 强度>60
const dayGan1 = '甲'
const monthGan1 = findGanForShen(dayGan1, '正官')  // 辛
const zhengYinGan = findGanForShen(dayGan1, '正印')  // 癸
const pianYinGan = findGanForShen(dayGan1, '偏印')  // 壬
const rs1 = makeRS(dayGan1)

// 年干+时干都是印星
const ctx1 = buildGeJuContext(
  { year: { gan: zhengYinGan, zhi: '子' }, month: { gan: monthGan1, zhi: '酉' },
    day: { gan: dayGan1, zhi: '寅' }, hour: { gan: pianYinGan, zhi: '亥' } },
  rs1 as any, 65, dayGan1, '酉',
  { '木': 2, '火': 1, '土': 1, '金': 2, '水': 2 } as any
)

console.log('monthGanShen:', (ctx1 as any).monthGanShen)
const stems = ['年干', '月干', '日干', '时干']
const stemGans = [ctx1.sixLines.year.gan, ctx1.sixLines.month.gan, ctx1.sixLines.day.gan, ctx1.sixLines.hour.gan]
let yinCount = 0
for (let i = 0; i < 4; i++) {
  const s = ctx1.relatedShens[stemGans[i]]
  console.log(`  ${stems[i]}${stemGans[i]}: ${s}`)
  if (s === '正印' || s === '偏印') yinCount++
}
console.log(`印星数量：${yinCount}`)
console.log(`强度：${ctx1.strengthScore}`)
console.log(`结果：${rule1.condition(ctx1 as any)}`)

console.log()

// 金神格
console.log('测试：金神格')
const rule2 = GEJU_RULES.find(r => r.id === 'jinshen-ge')!
// 乙日 + 地支金多（申酉戌丑>=3）
const dayGan2 = '乙'
const metalZhi = ['申', '酉', '戌', '丑']
const rs2 = makeRS(dayGan2)

const ctx2 = buildGeJuContext(
  { year: { gan: '丁', zhi: '申' }, month: { gan: '己', zhi: '酉' },
    day: { gan: dayGan2, zhi: '戌' }, hour: { gan: '辛', zhi: '丑' } },
  rs2 as any, 50, dayGan2, '酉',
  { '木': 1, '火': 1, '土': 2, '金': 4, '水': 0 } as any
)

console.log(`dayGan: ${dayGan2}`)
console.log(`地支：${ctx2.sixLines.year.zhi} ${ctx2.sixLines.month.zhi} ${ctx2.sixLines.day.zhi} ${ctx2.sixLines.hour.zhi}`)
const metalCount = [ctx2.sixLines.year.zhi, ctx2.sixLines.month.zhi, ctx2.sixLines.day.zhi, ctx2.sixLines.hour.zhi]
  .filter(z => metalZhi.includes(z)).length
console.log(`金地支数量：${metalCount}`)
console.log(`结果：${rule2.condition(ctx2 as any)}`)
