export interface County {
  name: string;
  longitude: number;
  latitude: number;
  timezone: string;
  timezoneOffsetMin: number;
}

export interface City {
  name: string;
  longitude: number;
  latitude: number;
  timezone: string;
  timezoneOffsetMin: number;
  counties: County[];
}

export interface Province {
  name: string;
  longitude: number;
  latitude: number;
  timezone: string;
  timezoneOffsetMin: number;
  cities: City[];
}

export interface Country {
  code: string;
  name: string;
  defaultTimezone: string;
  defaultTimezoneOffsetMin: number;
  majorCities: City[];
  provinces?: Province[];
}

export type LocationsDB = { countries: Country[] };

export const DEFAULT_LOCATION: County = {
  name: '北京市东城区（默认）',
  longitude: 116.407,
  latitude: 39.904,
  timezone: 'Asia/Shanghai',
  timezoneOffsetMin: 480,
};

export function findLocationByPath(
  db: LocationsDB,
  countryCode: string,
  provinceName?: string,
  cityName?: string,
  countyName?: string,
): { longitude: number; latitude: number; timezone: string; timezoneOffsetMin: number } {
  const country = db.countries.find((c) => c.code === countryCode);
  if (!country) {
    return DEFAULT_LOCATION;
  }

  if (countryCode !== 'CN' || !country.provinces) {
    if (country.majorCities.length === 0) {
      return {
        longitude: DEFAULT_LOCATION.longitude,
        latitude: DEFAULT_LOCATION.latitude,
        timezone: country.defaultTimezone,
        timezoneOffsetMin: country.defaultTimezoneOffsetMin,
      };
    }
    const defaultCity = country.majorCities[0];
    if (cityName) {
      const foundCity = country.majorCities.find((c) => c.name === cityName);
      if (foundCity) {
        if (countyName) {
          const foundCounty = foundCity.counties.find((co) => co.name === countyName);
          if (foundCounty) {
            return {
              longitude: foundCounty.longitude,
              latitude: foundCounty.latitude,
              timezone: foundCounty.timezone,
              timezoneOffsetMin: foundCounty.timezoneOffsetMin,
            };
          }
        }
        return {
          longitude: foundCity.longitude,
          latitude: foundCity.latitude,
          timezone: foundCity.timezone,
          timezoneOffsetMin: foundCity.timezoneOffsetMin,
        };
      }
    }
    return {
      longitude: defaultCity.longitude,
      latitude: defaultCity.latitude,
      timezone: defaultCity.timezone,
      timezoneOffsetMin: defaultCity.timezoneOffsetMin,
    };
  }

  let province: Province | undefined;
  if (provinceName) {
    province = country.provinces.find((p) => p.name === provinceName);
  }
  if (!province) {
    const firstProvince = country.provinces[0];
    const firstCity = firstProvince.cities[0];
    const firstCounty = firstCity.counties[0];
    return {
      longitude: firstCounty.longitude,
      latitude: firstCounty.latitude,
      timezone: firstCounty.timezone,
      timezoneOffsetMin: firstCounty.timezoneOffsetMin,
    };
  }

  let city: City | undefined;
  if (cityName) {
    city = province.cities.find((c) => c.name === cityName);
  }
  if (!city) {
    const firstCity = province.cities[0];
    const firstCounty = firstCity.counties[0];
    return {
      longitude: firstCounty.longitude,
      latitude: firstCounty.latitude,
      timezone: firstCounty.timezone,
      timezoneOffsetMin: firstCounty.timezoneOffsetMin,
    };
  }

  let county: County | undefined;
  if (countyName) {
    county = city.counties.find((co) => co.name === countyName);
  }
  if (!county) {
    const firstCounty = city.counties[0];
    return {
      longitude: firstCounty.longitude,
      latitude: firstCounty.latitude,
      timezone: firstCounty.timezone,
      timezoneOffsetMin: firstCounty.timezoneOffsetMin,
    };
  }

  return {
    longitude: county.longitude,
    latitude: county.latitude,
    timezone: county.timezone,
    timezoneOffsetMin: county.timezoneOffsetMin,
  };
}
