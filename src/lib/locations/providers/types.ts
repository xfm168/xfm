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
}
