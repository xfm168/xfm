/**
 * 回归测试：寅卯辰三会木方成化
 * 命盘：甲寅 乙卯 丙辰 丁亥
 */

import type { SixLines, GanZhi } from '@/lib/core'

export const sixLines: SixLines = {
  year: { gan: '甲', zhi: '寅', element: '木', yinYang: '阳', naYin: '大溪水' } as GanZhi,
  month: { gan: '乙', zhi: '卯', element: '木', yinYang: '阴', naYin: '大溪水' } as GanZhi,
  day: { gan: '丙', zhi: '辰', element: '火', yinYang: '阳', naYin: '沙中土' } as GanZhi,
  hour: { gan: '丁', zhi: '亥', element: '火', yinYang: '阴', naYin: '屋上土' } as GanZhi,
}

export const dayGan = '丙'
export const monthZhi = '卯'

export const expectedQiNodeCount = 13
export const expectedDayElement = '火'
export const expectedWangShuai = '相'
