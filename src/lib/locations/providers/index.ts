import { StaticGeoProvider } from './staticGeoProvider'
import type { GeoProvider } from './types'

export * from './types'
export { StaticGeoProvider }

let _provider: GeoProvider = new StaticGeoProvider()

export function getGeoProvider(): GeoProvider {
  return _provider
}

export function setGeoProvider(p: GeoProvider): void {
  _provider = p
}

export function listCountries() {
  return _provider.listCountries()
}

export function searchCountry(code: string) {
  return _provider.searchCountry(code)
}

export function findLocationByPath(q: Parameters<GeoProvider['findLocationByPath']>[0]) {
  return _provider.findLocationByPath(q)
}

export function reverseGeocode(...args: Parameters<GeoProvider['reverseGeocode']>) {
  return _provider.reverseGeocode(...args)
}

export function searchCity(kw: string) {
  return _provider.searchCity?.(kw) ?? []
}
