/**
 * 调试：为什么正官格在5000个context中没命中？
 */

import { buildGeJuContext } from '../src/lib/bazi/rules/gejuRules'

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

// 手动测试：甲日主，月干辛
const dayGan = '甲'
const monthGan = '辛'
const monthZhi = '酉'

const relatedShens: Record<string, string> = {}
for (const g of gans) {
  relatedShens[g] = getShen(dayGan, g)
}

console.log('甲日主，各天干十神：')
for (const g of gans) {
  console.log(`  ${g}: ${relatedShens[g]}`)
}
console.log()

const ctx = buildGeJuContext(
  { year: { gan: '丙', zhi: '子' }, month: { gan: monthGan, zhi: monthZhi }, day: { gan: dayGan, zhi: '寅' }, hour: { gan: '戊', zhi: '辰' } },
  relatedShens as any,
  50, dayGan, monthZhi,
  { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 } as any
)

console.log('monthGanShen:', (ctx as any).monthGanShen)
console.log('正官格条件：', (ctx as any).monthGanShen === '正官')
console.log()

// 现在统计500个中，有多少个月干十神是正官
let zhengguanCount = 0
for (let i = 0; i < 500; i++) {
  const dg = gans[i % 10]
  const mg = gans[(i * 3) % 10]
  const mz = zhis[(i * 7) % 12]
  
  const rs: Record<string, string> = {}
  for (const g of gans) rs[g] = getShen(dg, g)
  
  const c = buildGeJuContext(
    { year: { gan: '丙', zhi: '子' }, month: { gan: mg, zhi: mz }, day: { gan: dg, zhi: '寅' }, hour: { gan: '戊', zhi: '辰' } },
    rs as any, 50, dg, mz,
    { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 } as any
  )
  
  if ((c as any).monthGanShen === '正官') zhengguanCount++
}

console.log(`500个样本中，monthGanShen === '正官' 的数量：${zhengguanCount}`)
console.log(`比例：${(zhengguanCount / 500 * 100).toFixed(1)}%`)
