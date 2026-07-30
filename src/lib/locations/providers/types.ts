import type { Country, County } from '../types'

export interface LocationQuery {
  countryCode?: string
  provinceName?: string
  cityName?: string
  countyName?: string
}

export interface LocationInfo {
  longitude: number
  latitude: number
  timezone: string
  timezoneOffsetMin: number
  countryCode: string
  provinceName?: string
  cityName?: string
  countyName?: string
  // P0-A1 新增字段
  /** UTC 偏移（分钟），如 UTC+8 = 480，与 timezoneOffsetMin 相同但语义明确 */
  utcOffsetMin?: number
  /** 是否处于夏令时（需要日期判断，静态数据中标注该地区是否使用 DST） */
  dstObserved?: boolean
  /** DST 偏移（分钟，通常 60），仅在 dstObserved=true 时生效 */
  dstOffsetMin?: number
  /** DST 起止规则（如 '3月第2周日-11月第1周日'） */
  dstRule?: string
  /** 行政区编码（如中国行政区划代码 110000 = 北京） */
  adminCode?: string
  /** 历史时区变更记录（如 '1949前: UTC+8:06'） */
  historicalTimezones?: string[]
  /** 海拔（米，预留用于风水/紫微等模块） */
  elevation?: number
}

export interface GeoSearchResult {
  country: Country
  province?: import('../types').Province
  city: import('../types').City
  county?: County
  distance?: number
}

export interface GeoProvider {
  readonly name: string
  readonly version: string
  readonly capabilities: {
    hasChinaProvinces: boolean
    hasMajorGlobalCities: boolean
    supportsOnlineReverse: boolean
    supportsSearch: boolean
  }
  listCountries(): Country[]
  findLocationByPath(query: LocationQuery): LocationInfo
  searchCountry(code: string): Country | undefined
  reverseGeocode(longitude: number, latitude: number): GeoSearchResult | Promise<GeoSearchResult>
  searchCity?(keyword: string): GeoSearchResult[] | Promise<GeoSearchResult[]>
  /** 获取某地在特定日期是否处于夏令时 */
  isDST?(date: Date, countryCode: string, cityName?: string): boolean
  /** 获取某地在特定日期的 UTC offset（含 DST） */
  getUtcOffset?(date: Date, countryCode: string, cityName?: string): number
}
