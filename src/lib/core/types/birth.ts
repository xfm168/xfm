import type { Gender, CalendarType, ZiShiStrategy } from './base'

export interface BirthData {
  birthday: string
  birthTime: string
  gender: Gender
  longitude?: number
  latitude?: number
  timezone?: string
  calendarType?: CalendarType
  useTrueSolarTime?: boolean
  trueSolarTime?: Date
  childHourStrategy?: ZiShiStrategy
  location?: string
  birthTimeUnknown?: boolean
  hash?: string
}