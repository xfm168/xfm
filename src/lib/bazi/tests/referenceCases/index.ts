export * from './types'
export { REFERENCE_CASES_SEED } from './seed20'

import type { ReferenceCase } from './types'
import { REFERENCE_CASES_SEED } from './seed20'

export function getCaseById(id: string): ReferenceCase | undefined {
  return REFERENCE_CASES_SEED.find((c) => c.birth.id === id)
}

export function getCasesByTag(tag: string): ReferenceCase[] {
  return REFERENCE_CASES_SEED.filter((c) => c.tags?.includes(tag) ?? false)
}
