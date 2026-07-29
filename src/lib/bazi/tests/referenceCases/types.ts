import type { HeavenlyStem, EarthlyBranch } from '../../core/types'
import type { ZiShiStrategy } from '../../zishi/strategies'

export interface GanZhiPair {
  gan: HeavenlyStem
  zhi: EarthlyBranch
  ganZhi: string
}

export interface FourPillars {
  year: GanZhiPair
  month: GanZhiPair
  day: GanZhiPair
  hour?: GanZhiPair
}

export interface ReferenceCaseBirth {
  id: string
  source?: string
  gender: 'male' | 'female'
  dateStr: string
  timeStr: string
  timezone?: string
  timezoneOffsetMin?: number
  longitude: number
  latitude?: number
  useTrueSolarTime?: boolean
  ziHourStrategy?: ZiShiStrategy
  locationLabel?: string
}

export interface ReferenceCaseExpect {
  fourPillars: FourPillars
  dayunStartAge?: number
  firstDayunGanZhi?: string
  solarTermName?: string
  leapMonth?: boolean
}

export interface ReferenceCase {
  birth: ReferenceCaseBirth
  expect: ReferenceCaseExpect
  tags?: string[]
  notes?: string[]
}
