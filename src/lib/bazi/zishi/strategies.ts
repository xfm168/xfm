/**
 * 子时换日策略 - 策略接口与三种实现
 * P0-② 子时换日模块
 *
 * 三种主流流派：
 * - LateZiShiStrategy（晚子时/子初换日）：23:00 即换日（默认）
 * - EarlyZiShiStrategy（早子时/子正换日）：00:00 才换日
 * - GregorianStrategy（公历换日）：00:00 换日，子时跨日（与 Early 行为相同，区别在 reference）
 *
 * 时区处理：与现有 calculator.ts 保持一致，使用本地时间 getHours/getMinutes。
 */

// 策略类型（统一定义于 ../types，此处导入复用，避免重复导出冲突）
import type { ZiShiStrategyType } from '../types'

// 策略接口
export interface ZiShiStrategy {
  id: string
  name: string
  description: string
  reference: string
  evidenceLevel: 'A' | 'B' | 'C'
  resolveChartDate(birth: Date): ChartDateResult
}

// 解析结果
export interface ChartDateResult {
  chartDate: Date        // 用于计算日柱/月柱/年柱的日期
  hourIndex: number      // 时支索引 0=子,1=丑,...,11=亥
  isLateZiShi: boolean   // 是否晚子时（23:00-24:00）
  strategyId: string
}

// ========== 时辰索引计算（共享逻辑）==========
/**
 * 根据小时和分钟计算时辰索引
 * 23:00-00:59 → 0 (子)
 * 01:00-02:59 → 1 (丑)
 * 03:00-04:59 → 2 (寅)
 * 05:00-06:59 → 3 (卯)
 * 07:00-08:59 → 4 (辰)
 * 09:00-10:59 → 5 (巳)
 * 11:00-12:59 → 6 (午)
 * 13:00-14:59 → 7 (未)
 * 15:00-16:59 → 8 (申)
 * 17:00-18:59 → 9 (酉)
 * 19:00-20:59 → 10 (戌)
 * 21:00-22:59 → 11 (亥)
 */
export function computeHourIndex(hours: number, minutes: number): number {
  const totalMinutes = hours * 60 + minutes
  // 23:00-23:59 或 00:00-00:59 → 子时 (0)
  if (totalMinutes >= 23 * 60 || totalMinutes < 1 * 60) {
    return 0
  }
  // 01:00-22:59：每2小时一个时辰
  // hour 1-2 → 1(丑), hour 3-4 → 2(寅), ..., hour 21-22 → 11(亥)
  return Math.floor((hours - 1) / 2) + 1
}

/**
 * 判断是否为晚子时（23:00-23:59:59）
 */
function isLateZiHours(hours: number, minutes: number): boolean {
  const totalMinutes = hours * 60 + minutes
  return totalMinutes >= 23 * 60
}

// ========== 晚子时策略（子初换日）==========
/**
 * 晚子时（子初换日）：23:00 即换日。
 * 23:00-23:59:59 的 chartDate = 次日0点，hourIndex=0，isLateZiShi=true。
 * 这是默认策略，对应问真八字/元亨利贞默认行为。
 */
export class LateZiShiStrategy implements ZiShiStrategy {
  id = 'late'
  name = '晚子时（子初换日）'
  description = '23:00 即换日。23:00-23:59:59 的 chartDate = 次日，hourIndex=0，isLateZiShi=true。'
  reference = '三命通会、渊海子平（主流派）；参考：问真八字、元亨利贞默认'
  evidenceLevel = 'A' as const

  resolveChartDate(birth: Date): ChartDateResult {
    const hours = birth.getHours()
    const minutes = birth.getMinutes()
    const hourIndex = computeHourIndex(hours, minutes)

    // 23:00-23:59:59 → 晚子时，chartDate = 次日0点
    if (isLateZiHours(hours, minutes)) {
      return {
        chartDate: new Date(birth.getFullYear(), birth.getMonth(), birth.getDate() + 1, 0, 0, 0, 0),
        hourIndex: 0,
        isLateZiShi: true,
        strategyId: this.id,
      }
    }

    // 其他时辰（含早子时 00:00-00:59）：chartDate = 当日（保留原时刻）
    return {
      chartDate: new Date(birth.getTime()),
      hourIndex,
      isLateZiShi: false,
      strategyId: this.id,
    }
  }
}

// ========== 早子时策略（子正换日）==========
/**
 * 早子时（子正换日）：00:00 才换日。
 * 23:00-23:59:59 的 chartDate = 当日，hourIndex=0，isLateZiShi=false。
 * 00:00-00:59:59 的 chartDate = 当日（已是新日），hourIndex=0，isLateZiShi=false。
 */
export class EarlyZiShiStrategy implements ZiShiStrategy {
  id = 'early'
  name = '早子时（子正换日）'
  description = '00:00 才换日。23:00-23:59:59 的 chartDate = 当日，hourIndex=0，isLateZiShi=false。'
  reference = '李虚中书（古法）；部分传统派'
  evidenceLevel = 'B' as const

  resolveChartDate(birth: Date): ChartDateResult {
    const hours = birth.getHours()
    const minutes = birth.getMinutes()
    const hourIndex = computeHourIndex(hours, minutes)

    // 早子时策略：23:xx 和 00:xx 均不换日，chartDate = 当日
    return {
      chartDate: new Date(birth.getTime()),
      hourIndex,
      isLateZiShi: false,
      strategyId: this.id,
    }
  }
}

// ========== 公历换日策略 ==========
/**
 * 公历换日：00:00 换日，子时跨日。
 * 行为与早子时策略相同，区别仅在 reference 标注。
 * 注：此策略下时柱的日干需要特殊处理（早子时用次日干，晚子时用当日干），
 *     但为简化，本策略与 Early 策略行为相同。
 */
export class GregorianStrategy implements ZiShiStrategy {
  id = 'gregorian'
  name = '公历换日'
  description = '00:00 换日，子时跨日。行为与早子时策略相同，区别在 reference 标注。'
  reference = '现代简化'
  evidenceLevel = 'C' as const

  resolveChartDate(birth: Date): ChartDateResult {
    const hours = birth.getHours()
    const minutes = birth.getMinutes()
    const hourIndex = computeHourIndex(hours, minutes)

    // 公历换日：与早子时策略行为相同
    return {
      chartDate: new Date(birth.getTime()),
      hourIndex,
      isLateZiShi: false,
      strategyId: this.id,
    }
  }
}
