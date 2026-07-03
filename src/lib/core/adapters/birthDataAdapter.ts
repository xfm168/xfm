import type { BirthData } from '../types/birth'
import type { Gender, ZiShiStrategy } from '../types/base'

export interface BirthInfo {
  birthDate: string
  birthTime: string
  gender: Gender
  timezone?: string
  region?: string
  solarTime?: boolean
}

export interface Chart {
  birth_date: string
  birth_time: string
  birth_time_unknown: boolean
  gender: Gender
  birthplace: string | null
  timezone: string | null
  latitude: number | null
  longitude: number | null
  zishi_strategy: ZiShiStrategy
  use_solar_time: boolean
}

export interface BaziRequestBody {
  birth_date?: unknown
  birth_time?: unknown
  gender?: unknown
  birthplace?: unknown
  timezone?: unknown
  zishi_strategy?: unknown
  use_solar_time?: unknown
  birth_time_unknown?: unknown
  longitude?: unknown
}

export class BirthInfoAdapter {
  static convert(info: BirthInfo): BirthData {
    return {
      birthday: info.birthDate,
      birthTime: info.birthTime,
      gender: info.gender,
      timezone: info.timezone,
      location: info.region,
      useTrueSolarTime: info.solarTime,
    }
  }
}

export class ChartAdapter {
  static convert(chart: Chart): BirthData {
    return {
      birthday: chart.birth_date,
      birthTime: chart.birth_time,
      gender: chart.gender,
      location: chart.birthplace ?? undefined,
      timezone: chart.timezone ?? undefined,
      longitude: chart.longitude ?? undefined,
      latitude: chart.latitude ?? undefined,
      childHourStrategy: chart.zishi_strategy,
      useTrueSolarTime: chart.use_solar_time,
      birthTimeUnknown: chart.birth_time_unknown,
    }
  }
}

export class ApiRequestBodyAdapter {
  static convert(body: BaziRequestBody): BirthData {
    return {
      birthday: typeof body.birth_date === 'string' ? body.birth_date : '',
      birthTime: typeof body.birth_time === 'string' ? body.birth_time : '',
      gender: typeof body.gender === 'string' && (body.gender === 'male' || body.gender === 'female') ? body.gender : 'male',
      longitude: typeof body.longitude === 'number' ? body.longitude : undefined,
      useTrueSolarTime: typeof body.use_solar_time === 'boolean' ? body.use_solar_time : true,
      childHourStrategy: typeof body.zishi_strategy === 'string' && (body.zishi_strategy === 'late' || body.zishi_strategy === 'early' || body.zishi_strategy === 'gregorian') ? body.zishi_strategy : 'late',
    }
  }
}