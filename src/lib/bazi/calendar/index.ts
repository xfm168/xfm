import { QimenStandaloneCalendarProvider } from './providers/qimenStandaloneProvider'
import type { CalendarProvider, PreciseCalendarResult, CalendarProviderOptions } from './types'

export * from './types'
export { QimenStandaloneCalendarProvider } from './providers/qimenStandaloneProvider'
export { DateChineseCalendarProvider } from './providers/dateChineseProvider'

let _provider: CalendarProvider = new QimenStandaloneCalendarProvider()

export function getCalendarProvider(): CalendarProvider {
  return _provider
}

export function setCalendarProvider(provider: CalendarProvider): void {
  _provider = provider
}

export function getPreciseCalendar(date: Date, opts?: CalendarProviderOptions): PreciseCalendarResult {
  return _provider.getPreciseCalendar(date, opts)
}

export function getSolarTerms(year: number, opts?: CalendarProviderOptions) {
  return _provider.getSolarTerms(year, opts)
}
