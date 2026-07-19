import { describe, test, expect, beforeEach, vi } from 'vitest'
import { MULTI_LANGUAGE_ENGINE_VERSION, translate, translateBatch, registerNamespace, registerTranslations, getTranslationStats, detectMissingTranslations, getSupportedLocales, getTranslationEntry, getAllTranslations, resetTranslationStore } from '../multiLanguageEngine'
import { MULTI_LANGUAGE_VERSION, LOCALE_NAMES, SUPPORTED_LOCALES } from '../multiLanguageTypes'

describe('Multi-Language Engine', () => {
  beforeEach(() => {
    resetTranslationStore()
    registerTranslations([
      { key: 'tenGod', zhCN: '十神', zhTW: '十神', ja: '十神', ko: '십신', en: 'Ten Gods', context: 'Basic terminology' },
      { key: 'pattern', zhCN: '格局', zhTW: '格局', ja: '格局', ko: '격국', en: 'Pattern', context: 'Basic terminology' },
      { key: 'xiYongShen', zhCN: '喜用神', zhTW: '喜用神', ja: '喜用神', ko: '희용신', en: 'Xi-Yong God', context: 'Core concept' },
      { key: 'dayMaster', zhCN: '日主', zhTW: '日主', ja: '日主', ko: '일주', en: 'Day Master', context: 'Core concept' },
      { key: 'fortune', zhCN: '大运', zhTW: '大運', ja: '大運', ko: '대운', en: 'Major Fortune', context: 'Fortune analysis' },
      { key: 'fourPillars', zhCN: '四柱', zhTW: '四柱', ja: '四柱', ko: '사주', en: 'Four Pillars', context: 'Basic terminology' },
      { key: 'shenSha', zhCN: '神煞', zhTW: '神煞', ja: '神煞', ko: '신살', en: 'Shen Sha', context: 'Special stars' },
      { key: 'health', zhCN: '健康', zhTW: '健康', ja: '健康', ko: '건강', en: 'Health', context: 'Life aspect' },
      { key: 'career', zhCN: '事业', zhTW: '事業', ja: '事業', ko: '사업', en: 'Career', context: 'Life aspect' },
      { key: 'marriage', zhCN: '婚姻', zhTW: '婚姻', ja: '婚姻', ko: '결혼', en: 'Marriage', context: 'Life aspect' },
    ])
  })

  test('engine version is 1.0.0', () => {
    expect(MULTI_LANGUAGE_ENGINE_VERSION).toBe('1.0.0')
  })

  test('types version is 1.0.0', () => {
    expect(MULTI_LANGUAGE_VERSION).toBe('1.0.0')
  })

  test('translate returns zhCN for tenGod', () => {
    expect(translate('tenGod', 'zh-CN')).toBe('十神')
  })

  test('translate returns zhTW for fortune', () => {
    expect(translate('fortune', 'zh-TW')).toBe('大運')
  })

  test('translate returns ja for pattern', () => {
    expect(translate('pattern', 'ja')).toBe('格局')
  })

  test('translate returns ko for dayMaster', () => {
    expect(translate('dayMaster', 'ko')).toBe('일주')
  })

  test('translate returns en for career', () => {
    expect(translate('career', 'en')).toBe('Career')
  })

  test('translate returns key for non-existent key', () => {
    expect(translate('nonexistent', 'zh-CN')).toBe('nonexistent')
  })

  test('translate with params interpolates placeholders', () => {
    registerTranslations([
      { key: 'greeting', zhCN: '你好{{name}}', zhTW: '你好{{name}}', ja: 'こんにちは{{name}}', ko: '안녕하세요{{name}}', en: 'Hello {{name}}' },
    ])
    expect(translate('greeting', 'zh-CN', { name: '世界' })).toBe('你好世界')
    expect(translate('greeting', 'en', { name: 'World' })).toBe('Hello World')
  })

  test('translate with params ignores non-matching placeholder', () => {
    expect(translate('tenGod', 'zh-CN', { foo: 'bar' })).toBe('十神')
  })

  test('translateBatch returns correct translations', () => {
    const result = translateBatch(['tenGod', 'pattern', 'career'], 'zh-CN')
    expect(result['tenGod']).toBe('十神')
    expect(result['pattern']).toBe('格局')
    expect(result['career']).toBe('事业')
  })

  test('translateBatch returns key for missing entries', () => {
    const result = translateBatch(['tenGod', 'nonexistent'], 'zh-CN')
    expect(result['tenGod']).toBe('十神')
    expect(result['nonexistent']).toBe('nonexistent')
  })

  test('translateBatch with empty keys returns empty object', () => {
    expect(translateBatch([], 'zh-CN')).toEqual({})
  })

  test('registerTranslations adds new entries', () => {
    registerTranslations([
      { key: 'newKey', zhCN: '新键', zhTW: '新鍵', ja: '新キー', ko: '새 키', en: 'New Key' },
    ])
    expect(translate('newKey', 'zh-CN')).toBe('新键')
    expect(translate('newKey', 'en')).toBe('New Key')
  })

  test('registerTranslations overwrites existing entry', () => {
    registerTranslations([
      { key: 'tenGod', zhCN: '十神改', zhTW: '十神改', ja: '十神改', ko: '십신改', en: 'Ten Gods Modified' },
    ])
    expect(translate('tenGod', 'zh-CN')).toBe('十神改')
    expect(translate('tenGod', 'en')).toBe('Ten Gods Modified')
  })

  test('registerNamespace adds entries and namespace', () => {
    registerNamespace({
      id: 'astrology',
      entries: [
        { key: 'astro.zodiac', zhCN: '生肖', zhTW: '生肖', ja: '生肖', ko: '띠', en: 'Zodiac' },
      ],
    })
    expect(translate('astro.zodiac', 'zh-CN')).toBe('生肖')
    expect(translate('astro.zodiac', 'en')).toBe('Zodiac')
  })

  test('getTranslationStats returns correct stats for zhCN', () => {
    const stats = getTranslationStats('zh-CN')
    expect(stats.locale).toBe('zh-CN')
    expect(stats.totalKeys).toBe(10)
    expect(stats.translatedKeys).toBe(10)
    expect(stats.missingKeys).toHaveLength(0)
    expect(stats.coverageRate).toBe(1)
  })

  test('getTranslationStats returns correct stats for en', () => {
    const stats = getTranslationStats('en')
    expect(stats.locale).toBe('en')
    expect(stats.totalKeys).toBe(10)
    expect(stats.translatedKeys).toBe(10)
    expect(stats.coverageRate).toBe(1)
  })

  test('getTranslationStats returns missing keys for empty translations', () => {
    resetTranslationStore()
    const stats = getTranslationStats('zh-CN')
    expect(stats.totalKeys).toBe(0)
    expect(stats.translatedKeys).toBe(0)
    expect(stats.coverageRate).toBe(0)
  })

  test('getTranslationStats detects missing values', () => {
    registerTranslations([
      { key: 'empty', zhCN: '', zhTW: '', ja: '', ko: '', en: '' },
    ])
    const stats = getTranslationStats('zh-CN')
    expect(stats.missingKeys).toContain('empty')
    expect(stats.translatedKeys).toBe(10)
  })

  test('detectMissingTranslations returns missing keys', () => {
    registerTranslations([
      { key: 'empty', zhCN: '', zhTW: '', ja: '', ko: '', en: '' },
    ])
    const missing = detectMissingTranslations('zh-CN')
    expect(missing).toContain('empty')
  })

  test('getSupportedLocales returns all 5 locales', () => {
    const locales = getSupportedLocales()
    expect(locales).toHaveLength(5)
    expect(locales).toEqual(['zh-CN', 'zh-TW', 'ja', 'ko', 'en'])
  })

  test('getTranslationEntry returns entry for existing key', () => {
    const entry = getTranslationEntry('tenGod')
    expect(entry).toBeDefined()
    expect(entry!.key).toBe('tenGod')
    expect(entry!.zhCN).toBe('十神')
  })

  test('getTranslationEntry returns undefined for non-existent key', () => {
    expect(getTranslationEntry('nonexistent')).toBeUndefined()
  })

  test('getAllTranslations returns all registered entries', () => {
    const all = getAllTranslations()
    expect(all.length).toBe(10)
    const keys = all.map(e => e.key)
    expect(keys).toContain('tenGod')
    expect(keys).toContain('marriage')
  })

  test('resetTranslationStore clears everything', () => {
    expect(getTranslationEntry('tenGod')).toBeDefined()
    resetTranslationStore()
    expect(getTranslationEntry('tenGod')).toBeUndefined()
    expect(getAllTranslations()).toHaveLength(0)
  })

  test('LOCALE_NAMES has all 5 locales mapped', () => {
    expect(Object.keys(LOCALE_NAMES)).toHaveLength(5)
    expect(LOCALE_NAMES['zh-CN']).toBe('简体中文')
    expect(LOCALE_NAMES['en']).toBe('English')
    expect(LOCALE_NAMES['ja']).toBe('日本語')
    expect(LOCALE_NAMES['ko']).toBe('한국어')
    expect(LOCALE_NAMES['zh-TW']).toBe('繁體中文')
  })

  test('SUPPORTED_LOCALES has 5 entries', () => {
    expect(SUPPORTED_LOCALES).toHaveLength(5)
  })

  test('translate works for all locales with xiYongShen', () => {
    expect(translate('xiYongShen', 'zh-CN')).toBe('喜用神')
    expect(translate('xiYongShen', 'zh-TW')).toBe('喜用神')
    expect(translate('xiYongShen', 'ja')).toBe('喜用神')
    expect(translate('xiYongShen', 'ko')).toBe('희용신')
    expect(translate('xiYongShen', 'en')).toBe('Xi-Yong God')
  })

  test('getTranslationStats coverageRate is calculated correctly', () => {
    resetTranslationStore()
    registerTranslations([
      { key: 'a', zhCN: 'a', zhTW: '', ja: 'a', ko: 'a', en: 'a' },
      { key: 'b', zhCN: 'b', zhTW: 'b', ja: 'b', ko: 'b', en: 'b' },
      { key: 'c', zhCN: '', zhTW: '', ja: '', ko: '', en: '' },
    ])
    const stats = getTranslationStats('zh-TW')
    expect(stats.totalKeys).toBe(3)
    expect(stats.translatedKeys).toBe(1)
    expect(stats.coverageRate).toBeCloseTo(0.333)
  })
})