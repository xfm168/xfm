import { LOCATIONS_DB, findLocationByPath as staticFind } from '..'
import { GeoProvider, LocationQuery, LocationInfo, GeoSearchResult } from './types'

/** 欧洲使用 DST 的国家（按 '3月最后周日-10月最后周日' 规则） */
const EU_DST_COUNTRIES = new Set(['GB', 'FR', 'DE', 'ES', 'IT'])
const US_DST_RULE = '3月第2周日-11月第1周日'
const EU_DST_RULE = '3月最后周日-10月最后周日'

/** 获取某国家的 DST 规则字符串；若无则返回 undefined */
function getDSTRule(countryCode: string): string | undefined {
  if (countryCode === 'US') return US_DST_RULE
  if (EU_DST_COUNTRIES.has(countryCode)) return EU_DST_RULE
  return undefined
}

/** 计算某年某月（0-indexed）第 n 个周日（UTC 00:00） */
function nthSundayOfMonth(year: number, month: number, n: number): Date {
  const firstDayWeek = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const firstSunday = 1 + ((7 - firstDayWeek) % 7)
  return new Date(Date.UTC(year, month, firstSunday + (n - 1) * 7))
}

/** 计算某年某月（0-indexed）最后一个周日（UTC 00:00） */
function lastSundayOfMonth(year: number, month: number): Date {
  const lastDay = new Date(Date.UTC(year, month + 1, 0))
  return new Date(Date.UTC(year, month, lastDay.getUTCDate() - lastDay.getUTCDay()))
}

/** 美国 DST：3月第2周日 - 11月第1周日 */
function isUSDST(date: Date): boolean {
  const year = date.getUTCFullYear()
  return date >= nthSundayOfMonth(year, 2, 2) && date < nthSundayOfMonth(year, 10, 1)
}

/** 欧洲 DST：3月最后周日 - 10月最后周日 */
function isEuropeDST(date: Date): boolean {
  const year = date.getUTCFullYear()
  return date >= lastSundayOfMonth(year, 2) && date < lastSundayOfMonth(year, 9)
}

/** 将经度转换为本地平太阳时 UTC 偏移字符串（如 116.407 → 'UTC+7:46'） */
function formatSolarTimeOffset(longitude: number): string {
  const totalMin = Math.round(longitude * 4)
  const sign = totalMin >= 0 ? '+' : '-'
  const absMin = Math.abs(totalMin)
  const h = Math.floor(absMin / 60)
  const m = absMin % 60
  return `UTC${sign}${h}:${m.toString().padStart(2, '0')}`
}

export class StaticGeoProvider implements GeoProvider {
  name = 'xuanfengmen-static'
  version = '1.0.0'
  capabilities = {
    hasChinaProvinces: true,
    hasMajorGlobalCities: true,
    supportsOnlineReverse: false,
    supportsSearch: true,
  }

  listCountries = () => LOCATIONS_DB.countries

  searchCountry = (code: string) => LOCATIONS_DB.countries.find((c) => c.code === code)

  findLocationByPath(query: LocationQuery): LocationInfo {
    const countryCode = query.countryCode ?? 'CN'
    const raw = staticFind(
      LOCATIONS_DB,
      countryCode,
      query.provinceName,
      query.cityName,
      query.countyName,
    )
    const dstRule = getDSTRule(countryCode)
    const dstObserved = dstRule !== undefined
    const historicalTimezones = countryCode === 'CN'
      ? [`${query.cityName ?? '本地'}: 1949前 ${formatSolarTimeOffset(raw.longitude)}`]
      : undefined
    return {
      ...raw,
      countryCode,
      provinceName: query.provinceName,
      cityName: query.cityName,
      countyName: query.countyName,
      utcOffsetMin: raw.timezoneOffsetMin,
      dstObserved,
      dstOffsetMin: dstObserved ? 60 : undefined,
      dstRule,
      historicalTimezones,
    }
  }

  isDST(date: Date, countryCode: string, _cityName?: string): boolean {
    if (countryCode === 'US') return isUSDST(date)
    if (EU_DST_COUNTRIES.has(countryCode)) return isEuropeDST(date)
    return false
  }

  getUtcOffset(date: Date, countryCode: string, cityName?: string): number {
    const country = this.searchCountry(countryCode)
    const base = country?.defaultTimezoneOffsetMin ?? 480
    return base + (this.isDST(date, countryCode, cityName) ? 60 : 0)
  }

  reverseGeocode(lng: number, lat: number): GeoSearchResult {
    let best = Infinity
    let bestR: GeoSearchResult | null = null
    for (const country of LOCATIONS_DB.countries) {
      for (const city of country.majorCities) {
        const d = Math.abs(city.latitude - lat) + Math.abs(city.longitude - lng)
        if (d < best) {
          best = d
          bestR = { country, city, distance: d }
        }
        for (const county of city.counties) {
          const d2 = Math.abs(county.latitude - lat) + Math.abs(county.longitude - lng)
          if (d2 < best) {
            best = d2
            bestR = { country, city, county, distance: d2 }
          }
        }
      }
      if (country.provinces) {
        for (const province of country.provinces) {
          for (const city of province.cities) {
            const d = Math.abs(city.latitude - lat) + Math.abs(city.longitude - lng)
            if (d < best) {
              best = d
              bestR = { country, province, city, distance: d }
            }
            for (const county of city.counties) {
              const d2 = Math.abs(county.latitude - lat) + Math.abs(county.longitude - lng)
              if (d2 < best) {
                best = d2
                bestR = { country, province, city, county, distance: d2 }
              }
            }
          }
        }
      }
    }
    if (!bestR) {
      const c = this.searchCountry('CN')!
      const province = c.provinces!.find((p) => p.name === '北京市')!
      const city = province.cities.find((cc) => cc.name === '北京市')!
      const county = city.counties.find((cc) => cc.name === '东城区')!
      return { country: c, province, city, county, distance: best }
    }
    return bestR
  }

  searchCity(keyword: string): GeoSearchResult[] {
    const results: GeoSearchResult[] = []
    const kw = keyword.trim()
    if (!kw) return results
    for (const country of LOCATIONS_DB.countries) {
      if (country.name.includes(kw)) {
        if (country.majorCities[0]) results.push({ country, city: country.majorCities[0] })
      }
      for (const city of country.majorCities) {
        if (city.name.includes(kw)) results.push({ country, city })
        for (const county of city.counties) {
          if (county.name.includes(kw)) results.push({ country, city, county })
        }
      }
      if (country.provinces) {
        for (const province of country.provinces) {
          if (province.name.includes(kw)) {
            if (province.cities[0]) results.push({ country, province, city: province.cities[0] })
          }
          for (const city of province.cities) {
            if (city.name.includes(kw)) results.push({ country, province, city })
            for (const county of city.counties) {
              if (county.name.includes(kw)) results.push({ country, province, city, county })
            }
          }
        }
      }
    }
    return results
  }
}
