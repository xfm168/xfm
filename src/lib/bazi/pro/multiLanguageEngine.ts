// V5.0 RC Phase 5 Module VIII: Multi-Language Engine — Engine

import type { SupportedLocale } from './multiLanguageTypes'
import type { TranslationEntry } from './multiLanguageTypes'
import type { TranslationNamespace } from './multiLanguageTypes'
import type { TranslationStats } from './multiLanguageTypes'

import { SUPPORTED_LOCALES } from './multiLanguageTypes'

export const MULTI_LANGUAGE_ENGINE_VERSION = '1.0.0'

const translationStore = new Map<string, TranslationEntry>()
const namespaceStore = new Map<string, TranslationNamespace>()

const LOCALE_FIELD_MAP: Record<SupportedLocale, keyof TranslationEntry> = {
  'zh-CN': 'zhCN',
  'zh-TW': 'zhTW',
  'ja': 'ja',
  'ko': 'ko',
  'en': 'en',
}

const SEED_TRANSLATIONS: TranslationEntry[] = [
  {
    key: 'tenGod',
    zhCN: '十神',
    zhTW: '十神',
    ja: '十神',
    ko: '십신',
    en: 'Ten Gods',
    context: 'Basic terminology',
  },
  {
    key: 'pattern',
    zhCN: '格局',
    zhTW: '格局',
    ja: '格局',
    ko: '격국',
    en: 'Pattern',
    context: 'Basic terminology',
  },
  {
    key: 'xiYongShen',
    zhCN: '喜用神',
    zhTW: '喜用神',
    ja: '喜用神',
    ko: '희용신',
    en: 'Xi-Yong God',
    context: 'Core concept',
  },
  {
    key: 'dayMaster',
    zhCN: '日主',
    zhTW: '日主',
    ja: '日主',
    ko: '일주',
    en: 'Day Master',
    context: 'Core concept',
  },
  {
    key: 'fortune',
    zhCN: '大运',
    zhTW: '大運',
    ja: '大運',
    ko: '대운',
    en: 'Major Fortune',
    context: 'Fortune analysis',
  },
  {
    key: 'fourPillars',
    zhCN: '四柱',
    zhTW: '四柱',
    ja: '四柱',
    ko: '사주',
    en: 'Four Pillars',
    context: 'Basic terminology',
  },
  {
    key: 'shenSha',
    zhCN: '神煞',
    zhTW: '神煞',
    ja: '神煞',
    ko: '신살',
    en: 'Shen Sha',
    context: 'Special stars',
  },
  {
    key: 'health',
    zhCN: '健康',
    zhTW: '健康',
    ja: '健康',
    ko: '건강',
    en: 'Health',
    context: 'Life aspect',
  },
  {
    key: 'career',
    zhCN: '事业',
    zhTW: '事業',
    ja: '事業',
    ko: '사업',
    en: 'Career',
    context: 'Life aspect',
  },
  {
    key: 'marriage',
    zhCN: '婚姻',
    zhTW: '婚姻',
    ja: '婚姻',
    ko: '결혼',
    en: 'Marriage',
    context: 'Life aspect',
  },
]

// Initialize seed data
for (const entry of SEED_TRANSLATIONS) {
  translationStore.set(entry.key, entry)
}

export function translate(
  key: string,
  locale: SupportedLocale,
  params?: Record<string, string>
): string {
  const entry = translationStore.get(key)
  if (!entry) return key

  const fieldName = LOCALE_FIELD_MAP[locale]
  const value = entry[fieldName] as string

  if (!params) return value

  let result = value
  for (const [paramKey, paramValue] of Object.entries(params)) {
    result = result.replace(`{{${paramKey}}}`, paramValue)
  }
  return result
}

export function translateBatch(
  keys: string[],
  locale: SupportedLocale
): Record<string, string> {
  const result: Record<string, string> = {}
  for (const key of keys) {
    result[key] = translate(key, locale)
  }
  return result
}

export function registerNamespace(namespace: TranslationNamespace): void {
  namespaceStore.set(namespace.id, namespace)
  for (const entry of namespace.entries) {
    translationStore.set(entry.key, entry)
  }
}

export function registerTranslations(entries: TranslationEntry[]): void {
  for (const entry of entries) {
    translationStore.set(entry.key, entry)
  }
}

export function getTranslationStats(locale: SupportedLocale): TranslationStats {
  const allKeys = Array.from(translationStore.keys())
  const missingKeys: string[] = []
  let translatedCount = 0

  for (const key of allKeys) {
    const entry = translationStore.get(key)!
    const fieldName = LOCALE_FIELD_MAP[locale]
    const value = entry[fieldName] as string
    if (value && value.trim() !== '') {
      translatedCount++
    } else {
      missingKeys.push(key)
    }
  }

  const totalKeys = allKeys.length
  const coverageRate = totalKeys > 0
    ? Math.round((translatedCount / totalKeys) * 1000) / 1000
    : 0

  return {
    locale,
    totalKeys,
    translatedKeys: translatedCount,
    missingKeys,
    coverageRate,
  }
}

export function detectMissingTranslations(locale: SupportedLocale): string[] {
  const stats = getTranslationStats(locale)
  return stats.missingKeys
}

export function getSupportedLocales(): SupportedLocale[] {
  return [...SUPPORTED_LOCALES]
}

export function getTranslationEntry(key: string): TranslationEntry | undefined {
  return translationStore.get(key)
}

export function getAllTranslations(): TranslationEntry[] {
  return Array.from(translationStore.values())
}

export function resetTranslationStore(): void {
  translationStore.clear()
  namespaceStore.clear()
}