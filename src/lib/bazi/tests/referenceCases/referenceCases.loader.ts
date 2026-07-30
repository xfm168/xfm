import referenceCasesJson from './referenceCases.json'

export interface ReferenceCaseBirth {
  solarDate: string
  solarTime: string
  gender: 'male' | 'female'
  longitude: number
  latitude: number
  timezone: string
  timezoneOffsetMin: number
  useTrueSolarTime?: boolean
  locationLabel?: string
}

export interface ReferenceCasePillar {
  gan: string
  zhi: string
  ganZhi: string
}

export interface ReferenceCaseFourPillars {
  year: ReferenceCasePillar
  month: ReferenceCasePillar
  day: ReferenceCasePillar
  hour?: ReferenceCasePillar
}

export interface ReferenceCaseExpect {
  lunarDate?: string
  lunarLeap?: boolean
  fourPillars: ReferenceCaseFourPillars
  solarTerm?: string
  dayunStartAge?: number
  dayunDirection?: '顺行' | '逆行'
  firstDayun?: ReferenceCasePillar
}

export interface ReferenceCaseJson {
  id: string
  source: string
  birth: ReferenceCaseBirth
  expect: ReferenceCaseExpect
  tags: string[]
  notes?: string
}

export const REFERENCE_CASES: ReferenceCaseJson[] = referenceCasesJson as ReferenceCaseJson[]

export function getReferenceCaseById(id: string): ReferenceCaseJson | undefined {
  return REFERENCE_CASES.find(c => c.id === id)
}
export function getReferenceCasesByTag(tag: string): ReferenceCaseJson[] {
  return REFERENCE_CASES.filter(c => c.tags.includes(tag))
}
export function getReferenceCasesBySource(source: string): ReferenceCaseJson[] {
  return REFERENCE_CASES.filter(c => c.source === source)
}
export function getReferenceCaseCount(): number { return REFERENCE_CASES.length }
