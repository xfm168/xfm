/**
 * 调试：为什么正官格没触发？
 */

import { buildGeJuContext } from '../src/lib/bazi/rules/gejuRules'

// 构造一个正官格的context
// 甲日主，月干辛（辛金克甲木，正官）
const dayGan = '甲'
const monthGan = '辛'
const monthZhi = '酉'

const relatedShens: Record<string, string> = {}
// 月干辛对甲日主来说是正官
relatedShens['辛'] = '正官'

const ctx = buildGeJuContext(
  {
    year: { gan: '丙', zhi: '子' },
    month: { gan: monthGan, zhi: monthZhi },
    day: { gan: dayGan, zhi: '寅' },
    hour: { gan: '戊', zhi: '辰' },
  },
  relatedShens as any,
  50,
  dayGan,
  monthZhi,
  { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 } as any
)

console.log('monthGan:', monthGan)
console.log('monthGanShen:', (ctx as any).monthGanShen)
console.log('relatedShens:', (ctx as any).relatedShens)
console.log()
console.log('正官格条件：ctx.monthGanShen === "正官"')
console.log('结果：', (ctx as any).monthGanShen === '正官')
