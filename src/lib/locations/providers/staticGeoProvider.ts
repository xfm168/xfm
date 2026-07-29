import { LOCATIONS_DB, findLocationByPath as staticFind } from '..'
import { GeoProvider, LocationQuery, LocationInfo, GeoSearchResult } from './types'

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
    const raw = staticFind(
      LOCATIONS_DB,
      query.countryCode ?? 'CN',
      query.provinceName,
      query.cityName,
      query.countyName,
    )
    return {
      ...raw,
      countryCode: query.countryCode ?? 'CN',
      provinceName: query.provinceName,
      cityName: query.cityName,
      countyName: query.countyName,
    }
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
