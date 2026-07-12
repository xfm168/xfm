/**
 * 回归测试：子丑六合合绊
 * 命盘：甲子 丙寅 戊子 己丑
 */

import type { SixLines, GanZhi } from '@/lib/core'

export const sixLines: SixLines = {
  year: { gan: '甲', zhi: '子', element: '木', yinYang: '阳', naYin: '海中金' } as GanZhi,
  month: { gan: '丙', zhi: '寅', element: '火', yinYang: '阳', naYin: '炉中火' } as GanZhi,
  day: { gan: '戊', zhi: '子', element: '土', yinYang: '阳', naYin: '霹雳火' } as GanZhi,
  hour: { gan: '己', zhi: '丑', element: '土', yinYang: '阴', naYin: '霹雳火' } as GanZhi,
}

export const dayGan = '戊'
export const monthZhi = '寅'

export const expectedQiNodeCount = 12
export const expectedDayElement = '土'
export const expectedWangShuai = '死'
