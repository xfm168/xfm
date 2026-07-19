// V5.0 RC Phase 5 Module VIII: Multi-Language Engine — Types

export type SupportedLocale = 'zh-CN' | 'zh-TW' | 'ja' | 'ko' | 'en'

export interface TranslationEntry {
  key: string
  zhCN: string
  zhTW: string
  ja: string
  ko: string
  en: string
  context?: string
}

export interface TranslationNamespace {
  id: string
  entries: TranslationEntry[]
}

export interface MultiLanguageOptions {
  locale: SupportedLocale
  fallbackLocale: SupportedLocale
  namespaces: string[]
}

export interface TranslationStats {
  locale: SupportedLocale
  totalKeys: number
  translatedKeys: number
  missingKeys: string[]
  coverageRate: number
}

export interface LocalizedOutput {
  locale: SupportedLocale
  translated: Record<string, string>
  stats: TranslationStats
  warnings: string[]
}

export const MULTI_LANGUAGE_VERSION = '1.0.0'

export const LOCALE_NAMES: Record<SupportedLocale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'ja': '日本語',
  'ko': '한국어',
  'en': 'English',
}

export const SUPPORTED_LOCALES: SupportedLocale[] = ['zh-CN', 'zh-TW', 'ja', 'ko', 'en']