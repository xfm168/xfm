/**
 * 回归测试：申子辰三合水局成化
 * 命盘：庚申 戊子 壬戌 甲辰
 */

import type { SixLines, GanZhi } from '@/lib/core'

export const sixLines: SixLines = {
  year: { gan: '庚', zhi: '申', element: '金', yinYang: '阳', naYin: '石榴木' } as GanZhi,
  month: { gan: '戊', zhi: '子', element: '土', yinYang: '阳', naYin: '霹雳火' } as GanZhi,
  day: { gan: '壬', zhi: '戌', element: '水', yinYang: '阳', naYin: '大海水' } as GanZhi,
  hour: { gan: '甲', zhi: '辰', element: '木', yinYang: '阳', naYin: '佛灯火' } as GanZhi,
}

export const dayGan = '壬'
export const monthZhi = '子'

// P0 期望：QiBuilder 建立 14 股气，SeasonModifier 后水得令加权
export const expectedQiNodeCount = 14
export const expectedDayElement = '水'
export const expectedWangShuai = '旺'
