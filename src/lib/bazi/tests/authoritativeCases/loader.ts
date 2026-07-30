import authoritativeJson from './authoritativeCases.json'
export * from './authoritative.types'
import type { AuthoritativeCase } from './authoritative.types'

export const AUTHORITATIVE_CASES: AuthoritativeCase[] = authoritativeJson as AuthoritativeCase[]

export function getCaseById(id: string): AuthoritativeCase | undefined {
  return AUTHORITATIVE_CASES.find(c => c.id === id)
}

export function getCasesBySource(src: string): AuthoritativeCase[] {
  return AUTHORITATIVE_CASES.filter(c => c.source === src)
}

export function getCasesByTags(tags: string[]): AuthoritativeCase[] {
  return AUTHORITATIVE_CASES.filter(c => tags.every(t => c.tags?.includes(t)))
}

export function getSourceSummary(): Record<string, number> {
  const s: Record<string, number> = {}
  for (const c of AUTHORITATIVE_CASES) s[c.source] = (s[c.source] || 0) + 1
  return s
}
