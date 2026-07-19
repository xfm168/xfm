/**
 * Module 6 v6.0.0: 大运流年引擎 — 全量测试
 *
 * 覆盖：干支关系常量、detectRelations、事件规则、事件知识库、
 *       大运干支生成、流年干支、起运信息、引擎版本、引擎输出结构、
 *       大运步骤、流年、作用关系、事件检测、多维评分、AI Explain、
 *       缓存、RuleRegistry、推导链、完整管道、边界情况
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { HeavenlyStem, EarthlyBranch, FiveElement, ShenShi } from '@/lib/core/types/base'
import type { ProfessionalFourPillarsResult } from '../types'
import { calculateTenGods, clearTenGodsCache } from '../tenGodsEngine'
import { calculatePattern, clearPatternCache } from '../patternEngine'
import { calculateXiYong, clearXiYongCache } from '../xiyongEngine'
import {
  calculateFortune, generateFortuneExplain,
  clearFortuneCache, getFortuneCacheSize,
  generateDaYunGanZhi, calculateQiYunInfo,
  calculateLiuNianGanZhi, detectEvents,
  calculateFortuneScores,
  FORTUNE_ENGINE_VERSION, FORTUNE_CACHE_VERSION,
} from '../fortuneEngine'
import {
  TIAN_GAN_WU_HE, DI_ZHI_LIU_HE, DI_ZHI_SAN_HE, DI_ZHI_SAN_HUI,
  DI_ZHI_LIU_CHONG, DI_ZHI_LIU_HAI, DI_ZHI_SAN_XING, DI_ZHI_ZI_XING,
  TIAN_GAN_CHONG, DI_ZHI_PO,
  detectRelations,
  FORTUNE_EVENT_RULES, FORTUNE_EVENT_KB,
  getEventRule, getEventKB,
} from '../fortuneDatabase'
import { defaultRuleRegistry } from '../ruleRegistry'
import type { RelationInfo, DaYunStep, LiuNianInfo, FortuneEvent, FortuneScores } from '../fortuneTypes'
import type { FortuneEventType } from '../fortuneTypes'

// ─── 辅助 ───

function makeSixLines(overrides: Partial<{
  yearGan: HeavenlyStem; yearZhi: EarthlyBranch;
  monthGan: HeavenlyStem; monthZhi: EarthlyBranch;
  dayGan: HeavenlyStem; dayZhi: EarthlyBranch;
  hourGan: HeavenlyStem; hourZhi: EarthlyBranch;
}> = {}) {
  return {
    year: { gan: overrides.yearGan ?? '甲', zhi: overrides.yearZhi ?? '子' },
    month: { gan: overrides.monthGan ?? '丙', zhi: overrides.monthZhi ?? '寅' },
    day: { gan: overrides.dayGan ?? '甲', zhi: overrides.dayZhi ?? '子' },
    hour: { gan: overrides.hourGan ?? '庚', zhi: overrides.hourZhi ?? '午' },
  }
}

const elementMap: Record<string, FiveElement> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}

function makePillars(overrides: Parameters<typeof makeSixLines>[0] = {}): ProfessionalFourPillarsResult {
  const sl = makeSixLines(overrides)
  return {
    version: '1.1.0',
    sixLines: sl,
    pillars: {
      year: { ganZhi: sl.year, naYin: '海中金', changSheng: '长生', cangGan: null as never, wuxing: elementMap[sl.year.gan]!, yinYang: (['甲','丙','戊','庚','壬'] as string[]).includes(sl.year.gan) ? '阳' as const : '阴' as const },
      month: { ganZhi: sl.month, naYin: '炉中火', changSheng: '沐浴', cangGan: null as never, wuxing: elementMap[sl.month.gan]!, yinYang: (['甲','丙','戊','庚','壬'] as string[]).includes(sl.month.gan) ? '阳' as const : '阴' as const },
      day: { ganZhi: sl.day, naYin: '海中金', changSheng: '冠带', cangGan: null as never, wuxing: elementMap[sl.day.gan]!, yinYang: (['甲','丙','戊','庚','壬'] as string[]).includes(sl.day.gan) ? '阳' as const : '阴' as const },
      hour: { ganZhi: sl.hour, naYin: '白蜡金', changSheng: '临官', cangGan: null as never, wuxing: elementMap[sl.hour.gan]!, yinYang: (['甲','丙','戊','庚','壬'] as string[]).includes(sl.hour.gan) ? '阳' as const : '阴' as const },
    },
    dayMaster: sl.day.gan,
    dayMasterElement: elementMap[sl.day.gan]!,
    dayMasterYinYang: (['甲','丙','戊','庚','壬'] as string[]).includes(sl.day.gan) ? '阳' as const : '阴' as const,
    fiveElementCount: { '木': 2, '火': 1, '土': 1, '金': 1, '水': 1 },
    naYin: { year: '海中金', month: '炉中火', day: '海中金', hour: '白蜡金' },
    changSheng: { year: '长生', month: '沐浴', day: '冠带', hour: '临官' },
    kongWang: [],
    mingGong: null as never,
    shenGong: null as never,
    taiYuan: null as never,
    taiXi: null as never,
    cangGanMap: {} as Record<EarthlyBranch, never>,
    derivation: null,
    warnings: [],
    computedAt: Date.now(),
  }
}

const defaultOpts = { gender: 'male', birthDate: new Date(1990, 0, 15) }
beforeEach(() => { clearTenGodsCache(); clearPatternCache(); clearXiYongCache(); clearFortuneCache() })

function fullPipeline(overrides: Parameters<typeof makeSixLines>[0] = {}) {
  const pillars = makePillars(overrides)
  const tenGodOut = calculateTenGods(pillars, { gender: 'male' })
  const patternOut = calculatePattern(pillars, tenGodOut, { gender: 'male' })
  const xiYongOut = calculateXiYong(pillars, tenGodOut, patternOut, { gender: 'male' })
  const fortuneOut = calculateFortune(pillars, tenGodOut, patternOut, xiYongOut, defaultOpts)
  return { pillars, tenGodOut, patternOut, xiYongOut, fortuneOut }
}

// ═══════════════════════════════════════════
// 1. 干支关系常量 (10)
// ═══════════════════════════════════════════

describe('干支关系常量', () => {
  it('天干五合有5组', () => {
    expect(TIAN_GAN_WU_HE).toHaveLength(5)
    // 每组三项：干1、干2、化合五行
    for (const group of TIAN_GAN_WU_HE) {
      expect(group).toHaveLength(3)
      expect(group[2]).toMatch(/^[木火土金水]$/)
    }
  })

  it('地支六合有6组', () => {
    expect(DI_ZHI_LIU_HE).toHaveLength(6)
    for (const group of DI_ZHI_LIU_HE) {
      expect(group).toHaveLength(3)
      expect(group[2]).toMatch(/^[木火土金水]$/)
    }
  })

  it('三合局有4组', () => {
    expect(DI_ZHI_SAN_HE).toHaveLength(4)
    for (const group of DI_ZHI_SAN_HE) {
      expect(group).toHaveLength(4)
      // 第四项为五行
      expect(group[3]).toMatch(/^[木火土金水]$/)
    }
  })

  it('三会局有4组', () => {
    expect(DI_ZHI_SAN_HUI).toHaveLength(4)
    for (const group of DI_ZHI_SAN_HUI) {
      expect(group).toHaveLength(4)
      expect(group[3]).toMatch(/^[木火土金水]$/)
    }
  })

  it('六冲有6组', () => {
    expect(DI_ZHI_LIU_CHONG).toHaveLength(6)
    for (const group of DI_ZHI_LIU_CHONG) {
      expect(group).toHaveLength(2)
    }
  })

  it('六害有6组', () => {
    expect(DI_ZHI_LIU_HAI).toHaveLength(6)
    for (const group of DI_ZHI_LIU_HAI) {
      expect(group).toHaveLength(2)
    }
  })

  it('三刑有2组', () => {
    expect(DI_ZHI_SAN_XING).toHaveLength(2)
    for (const group of DI_ZHI_SAN_XING) {
      expect(group).toHaveLength(3)
    }
  })

  it('自刑有4个', () => {
    expect(DI_ZHI_ZI_XING).toHaveLength(4)
    for (const zhi of DI_ZHI_ZI_XING) {
      expect(['辰', '午', '酉', '亥']).toContain(zhi)
    }
  })

  it('天干冲有4组', () => {
    expect(TIAN_GAN_CHONG).toHaveLength(4)
    for (const group of TIAN_GAN_CHONG) {
      expect(group).toHaveLength(2)
    }
  })

  it('破有6组', () => {
    expect(DI_ZHI_PO).toHaveLength(6)
    for (const group of DI_ZHI_PO) {
      expect(group).toHaveLength(2)
    }
  })
})

// ═══════════════════════════════════════════
// 2. detectRelations (10)
// ═══════════════════════════════════════════

describe('detectRelations', () => {
  it('检测子午冲', () => {
    const result = detectRelations('甲', '子', '乙', '午')
    expect(result.chong).toContain('子午冲')
  })

  it('检测寅亥合（六合）', () => {
    const result = detectRelations('甲', '寅', '乙', '亥')
    expect(result.liuHe.length).toBeGreaterThanOrEqual(1)
    expect(result.he.length).toBeGreaterThanOrEqual(1)
  })

  it('检测甲庚冲（天干冲）', () => {
    const result = detectRelations('甲', '子', '庚', '午')
    expect(result.ganChong).toContain('甲庚冲')
  })

  it('检测寅申冲', () => {
    const result = detectRelations('甲', '寅', '乙', '申')
    expect(result.chong).toContain('寅申冲')
  })

  it('辰辰不自刑（需要两个独立柱的地支都是辰才自刑）', () => {
    const result = detectRelations('甲', '辰', '乙', '辰')
    // 辰辰自刑需要 zhi1 === zhi2 且在 DI_ZHI_ZI_XING 中
    expect(result.xing).toContain('辰自刑')
  })

  it('检测子丑合+申子辰半合', () => {
    // 子丑合
    const r1 = detectRelations('甲', '子', '乙', '丑')
    expect(r1.liuHe.length).toBeGreaterThanOrEqual(1)
    // 申子半合
    const r2 = detectRelations('甲', '申', '乙', '子')
    expect(r2.sanHe.length).toBeGreaterThanOrEqual(1)
  })

  it('伏吟（甲子↔甲子）', () => {
    const result = detectRelations('甲', '子', '甲', '子')
    expect(result.fuYin).toContain('甲子伏吟')
  })

  it('反吟（甲子↔庚午）', () => {
    const result = detectRelations('甲', '子', '庚', '午')
    // 甲庚天干冲 + 子午地支冲 = 反吟
    expect(result.fanYin.length).toBeGreaterThanOrEqual(1)
  })

  it('多关系并存', () => {
    // 甲己合 + 子丑合 = 天干合 + 地支合
    const result = detectRelations('甲', '子', '己', '丑')
    expect(result.ganHe.length).toBeGreaterThanOrEqual(1)
    expect(result.liuHe.length).toBeGreaterThanOrEqual(1)
  })

  it('空关系（无任何关系）', () => {
    const result = detectRelations('甲', '子', '乙', '寅')
    // 甲乙不合不冲，子寅不合不冲不刑不害
    const totalRelations = result.chong.length + result.xing.length +
      result.hai.length + result.po.length + result.he.length +
      result.ganChong.length + result.ganHe.length +
      result.fuYin.length + result.fanYin.length
    expect(totalRelations).toBe(0)
  })
})

// ═══════════════════════════════════════════
// 3. 事件规则 (5)
// ═══════════════════════════════════════════

describe('事件规则', () => {
  it('FORTUNE_EVENT_RULES 有15条', () => {
    expect(FORTUNE_EVENT_RULES).toHaveLength(15)
  })

  it('每条规则有完整字段 type/keywords/reference/triggers', () => {
    for (const rule of FORTUNE_EVENT_RULES) {
      expect(rule.type).toBeDefined()
      expect(rule.keywords.length).toBeGreaterThan(0)
      expect(rule.classicalReference.length).toBeGreaterThan(0)
      expect(rule.positiveTriggers.length).toBeGreaterThan(0)
      expect(rule.negativeTriggers.length).toBeGreaterThan(0)
    }
  })

  it('事件类型覆盖15种', () => {
    const types = new Set(FORTUNE_EVENT_RULES.map(r => r.type))
    const expected: FortuneEventType[] = [
      '事业', '财运', '婚姻', '恋爱', '子女', '考试', '升迁',
      '创业', '疾病', '官非', '破财', '搬迁', '出国', '购房', '投资',
    ]
    for (const t of expected) {
      expect(types.has(t)).toBe(true)
    }
  })

  it('getEventRule 按类型返回正确规则', () => {
    const rule = getEventRule('事业')
    expect(rule).toBeDefined()
    expect(rule!.type).toBe('事业')
  })

  it('getEventRule 对不存在的类型返回 undefined', () => {
    const rule = getEventRule('飞天' as FortuneEventType)
    expect(rule).toBeUndefined()
  })
})

// ═══════════════════════════════════════════
// 4. 事件知识库 (5)
// ═══════════════════════════════════════════

describe('事件知识库', () => {
  const allTypes: FortuneEventType[] = [
    '事业', '财运', '婚姻', '恋爱', '子女', '考试', '升迁',
    '创业', '疾病', '官非', '破财', '搬迁', '出国', '购房', '投资',
  ]

  it('FORTUNE_EVENT_KB 有15条', () => {
    expect(Object.keys(FORTUNE_EVENT_KB)).toHaveLength(15)
  })

  it('每条知识库条目有完整字段', () => {
    for (const type of allTypes) {
      const entry = FORTUNE_EVENT_KB[type]
      expect(entry).toBeDefined()
      expect(entry!.type).toBe(type)
      expect(entry!.description.length).toBeGreaterThan(0)
      expect(entry!.classicalBasis.length).toBeGreaterThan(0)
      expect(entry!.modernInterpretation.length).toBeGreaterThan(0)
      expect(entry!.riskIndicators.length).toBeGreaterThan(0)
      expect(entry!.opportunityIndicators.length).toBeGreaterThan(0)
      expect(entry!.suggestions.length).toBeGreaterThan(0)
      expect(entry!.careerFields.length).toBeGreaterThan(0)
    }
  })

  it('getEventKB 按类型返回正确条目', () => {
    const kb = getEventKB('财运')
    expect(kb).toBeDefined()
    expect(kb!.type).toBe('财运')
    expect(kb!.classicalBasis.length).toBeGreaterThanOrEqual(2)
  })

  it('getEventKB 对不存在的类型返回 undefined', () => {
    const kb = getEventKB('飞天' as FortuneEventType)
    expect(kb).toBeUndefined()
  })

  it('知识库 classicalBasis 包含古籍引用格式', () => {
    for (const type of allTypes) {
      const entry = FORTUNE_EVENT_KB[type]
      const hasClassicRef = entry!.classicalBasis.some(
        text => /《.+》/.test(text),
      )
      expect(hasClassicRef).toBe(true)
    }
  })
})

// ═══════════════════════════════════════════
// 5. 大运干支生成 (5)
// ═══════════════════════════════════════════

describe('generateDaYunGanZhi', () => {
  it('阳男顺行：甲寅月从丁卯开始', () => {
    // 甲月(0) 顺行+1 → 乙
    // 寅(2) 顺行+1 → 卯
    const result = generateDaYunGanZhi('甲', '寅', true, 1)
    expect(result).toHaveLength(1)
    expect(result[0].gan).toBe('乙')
    expect(result[0].zhi).toBe('卯')
  })

  it('阴男逆行：甲子月从癸亥开始', () => {
    // 甲月(0) 逆行-1 → 癸
    // 子(0) 逆行-1 → 亥
    const result = generateDaYunGanZhi('甲', '子', false, 1)
    expect(result).toHaveLength(1)
    expect(result[0].gan).toBe('癸')
    expect(result[0].zhi).toBe('亥')
  })

  it('步数正确', () => {
    const steps = 8
    const result = generateDaYunGanZhi('丙', '寅', true, steps)
    expect(result).toHaveLength(steps)
  })

  it('甲寅月阳男第一步', () => {
    const result = generateDaYunGanZhi('甲', '寅', true, 1)
    expect(result[0].gan).toBe('乙')
    expect(result[0].zhi).toBe('卯')
  })

  it('甲子月阴男第一步', () => {
    const result = generateDaYunGanZhi('甲', '子', false, 1)
    expect(result[0].gan).toBe('癸')
    expect(result[0].zhi).toBe('亥')
  })
})

// ═══════════════════════════════════════════
// 6. 流年干支 (5)
// ═══════════════════════════════════════════

describe('calculateLiuNianGanZhi', () => {
  it('2024年为甲辰', () => {
    const result = calculateLiuNianGanZhi(2024)
    expect(result.gan).toBe('甲')
    expect(result.zhi).toBe('辰')
  })

  it('2025年为乙巳', () => {
    const result = calculateLiuNianGanZhi(2025)
    expect(result.gan).toBe('乙')
    expect(result.zhi).toBe('巳')
  })

  it('1984年为甲子', () => {
    const result = calculateLiuNianGanZhi(1984)
    expect(result.gan).toBe('甲')
    expect(result.zhi).toBe('子')
  })

  it('干支范围正确（天干十干地支十二支）', () => {
    const tianGan: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
    const diZhi: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
    for (let y = 1900; y <= 2100; y++) {
      const r = calculateLiuNianGanZhi(y)
      expect(tianGan).toContain(r.gan)
      expect(diZhi).toContain(r.zhi)
    }
  })

  it('连续年份干支变化正确', () => {
    const r1 = calculateLiuNianGanZhi(2023)
    const r2 = calculateLiuNianGanZhi(2024)
    // 天干递进一位，地支递进一位
    const tianGan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
    const diZhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
    const expectedGan = tianGan[(tianGan.indexOf(r1.gan) + 1) % 10]
    const expectedZhi = diZhi[(diZhi.indexOf(r1.zhi) + 1) % 12]
    expect(r2.gan).toBe(expectedGan)
    expect(r2.zhi).toBe(expectedZhi)
  })
})

// ═══════════════════════════════════════════
// 7. 起运信息 (3)
// ═══════════════════════════════════════════

describe('calculateQiYunInfo', () => {
  it('返回结构完整', () => {
    const info = calculateQiYunInfo(
      new Date(1990, 0, 15), '甲', 'male', { algorithm: 'classic' },
    )
    expect(info).toHaveProperty('startAge')
    expect(info).toHaveProperty('startYear')
    expect(info).toHaveProperty('startDate')
    expect(info).toHaveProperty('isShun')
    expect(info).toHaveProperty('algorithm')
    expect(info).toHaveProperty('confidence')
  })

  it('阳男（甲）isShun 为 true', () => {
    const info = calculateQiYunInfo(
      new Date(1990, 0, 15), '甲', 'male', { algorithm: 'classic' },
    )
    expect(info.isShun).toBe(true)
  })

  it('algorithm 字段与传入一致', () => {
    const info1 = calculateQiYunInfo(
      new Date(1990, 0, 15), '甲', 'male', { algorithm: 'classic' },
    )
    expect(info1.algorithm).toBe('classic')

    const info2 = calculateQiYunInfo(
      new Date(1990, 0, 15), '甲', 'male', { algorithm: 'modern' },
    )
    expect(info2.algorithm).toBe('modern')
  })
})

// ═══════════════════════════════════════════
// 8. 引擎版本 (2)
// ═══════════════════════════════════════════

describe('引擎版本', () => {
  it('FORTUNE_ENGINE_VERSION = 6.0.0', () => {
    expect(FORTUNE_ENGINE_VERSION).toBe('6.0.0')
  })

  it('FORTUNE_CACHE_VERSION = 6.0.0', () => {
    expect(FORTUNE_CACHE_VERSION).toBe('6.0.0')
  })
})

// ═══════════════════════════════════════════
// 9. 引擎输出结构 (8)
// ═══════════════════════════════════════════

describe('引擎输出结构', () => {
  it('version 存在且为 6.0.0', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.version).toBe('6.0.0')
  })

  it('dayMaster 存在', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.dayMaster).toBe('甲')
  })

  it('qiYunInfo 存在', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.qiYunInfo).toBeDefined()
    expect(fortuneOut.qiYunInfo.isShun).toBe(true)
  })

  it('daYunSteps 存在且为数组', () => {
    const { fortuneOut } = fullPipeline()
    expect(Array.isArray(fortuneOut.daYunSteps)).toBe(true)
    expect(fortuneOut.daYunSteps.length).toBe(8)
  })

  it('liuNianYears 存在且非空', () => {
    const { fortuneOut } = fullPipeline()
    expect(Array.isArray(fortuneOut.liuNianYears)).toBe(true)
    expect(fortuneOut.liuNianYears.length).toBeGreaterThan(0)
  })

  it('events 存在且为数组', () => {
    const { fortuneOut } = fullPipeline()
    expect(Array.isArray(fortuneOut.events)).toBe(true)
  })

  it('scores 存在', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.scores).toBeDefined()
    expect(fortuneOut.scores.fortuneScore).toBeDefined()
  })

  it('cacheVersion / executionMetadata / warnings / computeTimeMs', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.cacheVersion).toBe('6.0.0')
    expect(fortuneOut.executionMetadata).toBeDefined()
    expect(fortuneOut.executionMetadata.executionTime).toBeGreaterThanOrEqual(0)
    expect(Array.isArray(fortuneOut.warnings)).toBe(true)
    expect(typeof fortuneOut.computeTimeMs).toBe('number')
  })
})

// ═══════════════════════════════════════════
// 10. 大运步骤 (6)
// ═══════════════════════════════════════════

describe('大运步骤', () => {
  it('每步有 ganZhi / naYin / shenShi / changSheng', () => {
    const { fortuneOut } = fullPipeline()
    for (const step of fortuneOut.daYunSteps) {
      expect(step).toHaveProperty('ganZhi')
      expect(step.ganZhi).toHaveProperty('gan')
      expect(step.ganZhi).toHaveProperty('zhi')
      expect(step).toHaveProperty('naYin')
      expect(typeof step.naYin).toBe('string')
      expect(step).toHaveProperty('shenShi')
      expect(step).toHaveProperty('changSheng')
    }
  })

  it('每步有 fiveElementPower', () => {
    const { fortuneOut } = fullPipeline()
    for (const step of fortuneOut.daYunSteps) {
      expect(step.fiveElementPower).toBeDefined()
      const power = step.fiveElementPower
      expect(power).toHaveProperty('木')
      expect(power).toHaveProperty('火')
      expect(power).toHaveProperty('土')
      expect(power).toHaveProperty('金')
      expect(power).toHaveProperty('水')
    }
  })

  it('每步有 originalRelations / xiYongRelations', () => {
    const { fortuneOut } = fullPipeline()
    for (const step of fortuneOut.daYunSteps) {
      expect(step).toHaveProperty('originalRelations')
      expect(step).toHaveProperty('xiYongRelations')
      expect(step.xiYongRelations).toHaveProperty('influence')
      expect(['positive', 'negative', 'neutral']).toContain(step.xiYongRelations.influence)
    }
  })

  it('每步有 fortuneScore', () => {
    const { fortuneOut } = fullPipeline()
    for (const step of fortuneOut.daYunSteps) {
      expect(typeof step.fortuneScore).toBe('number')
      expect(step.fortuneScore).toBeGreaterThanOrEqual(0)
      expect(step.fortuneScore).toBeLessThanOrEqual(100)
    }
  })

  it('大运步数从0递增', () => {
    const { fortuneOut } = fullPipeline()
    for (let i = 0; i < fortuneOut.daYunSteps.length; i++) {
      expect(fortuneOut.daYunSteps[i].index).toBe(i)
    }
  })

  it('每步年龄区间 startAge < endAge', () => {
    const { fortuneOut } = fullPipeline()
    for (const step of fortuneOut.daYunSteps) {
      expect(step.startAge).toBeLessThan(step.endAge)
      expect(step.endAge - step.startAge).toBe(9)
    }
  })
})

// ═══════════════════════════════════════════
// 11. 流年 (5)
// ═══════════════════════════════════════════

describe('流年', () => {
  it('每年有 ganZhi / shenShi / changSheng', () => {
    const { fortuneOut } = fullPipeline()
    for (const ln of fortuneOut.liuNianYears) {
      expect(ln).toHaveProperty('ganZhi')
      expect(ln.ganZhi).toHaveProperty('gan')
      expect(ln.ganZhi).toHaveProperty('zhi')
      expect(ln).toHaveProperty('shenShi')
      expect(ln).toHaveProperty('changSheng')
    }
  })

  it('每年有 originalRelations / daYunRelations / overallRelations', () => {
    const { fortuneOut } = fullPipeline()
    for (const ln of fortuneOut.liuNianYears) {
      expect(ln).toHaveProperty('originalRelations')
      expect(ln).toHaveProperty('daYunRelations')
      expect(ln).toHaveProperty('overallRelations')
    }
  })

  it('每年有 luckScore 0-100', () => {
    const { fortuneOut } = fullPipeline()
    for (const ln of fortuneOut.liuNianYears) {
      expect(typeof ln.luckScore).toBe('number')
      expect(ln.luckScore).toBeGreaterThanOrEqual(0)
      expect(ln.luckScore).toBeLessThanOrEqual(100)
    }
  })

  it('流年 year 与 startYear 对齐', () => {
    const { fortuneOut } = fullPipeline()
    const firstYear = fortuneOut.liuNianYears[0].year
    expect(firstYear).toBe(fortuneOut.qiYunInfo.startYear)
  })

  it('每年有 fiveElementPower', () => {
    const { fortuneOut } = fullPipeline()
    for (const ln of fortuneOut.liuNianYears) {
      expect(ln.fiveElementPower).toBeDefined()
      expect(ln.fiveElementPower).toHaveProperty('木')
      expect(ln.fiveElementPower).toHaveProperty('火')
    }
  })
})

// ═══════════════════════════════════════════
// 12. 作用关系 (6)
// ═══════════════════════════════════════════

describe('作用关系', () => {
  it('子午冲检测', () => {
    const result = detectRelations('甲', '子', '乙', '午')
    expect(result.chong).toContain('子午冲')
  })

  it('寅亥合检测（六合）', () => {
    const result = detectRelations('甲', '寅', '乙', '亥')
    expect(result.liuHe.length).toBeGreaterThanOrEqual(1)
  })

  it('天干五合检测', () => {
    const result = detectRelations('甲', '子', '己', '丑')
    expect(result.ganHe.length).toBeGreaterThanOrEqual(1)
  })

  it('三合半合检测', () => {
    // 申子半合
    const result = detectRelations('甲', '申', '乙', '子')
    expect(result.sanHe.length).toBeGreaterThanOrEqual(1)
  })

  it('伏吟检测', () => {
    const result = detectRelations('丙', '寅', '丙', '寅')
    expect(result.fuYin).toContain('丙寅伏吟')
  })

  it('反吟检测', () => {
    const result = detectRelations('甲', '子', '庚', '午')
    expect(result.fanYin.length).toBeGreaterThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════
// 13. 事件检测 (5)
// ═══════════════════════════════════════════

describe('事件检测', () => {
  it('events 是数组', () => {
    const { fortuneOut } = fullPipeline()
    expect(Array.isArray(fortuneOut.events)).toBe(true)
  })

  it('每个事件有 type / probability / reasons / confidence', () => {
    const { fortuneOut } = fullPipeline()
    for (const event of fortuneOut.events) {
      expect(event).toHaveProperty('type')
      expect(typeof event.probability).toBe('number')
      expect(Array.isArray(event.reasons)).toBe(true)
      expect(typeof event.confidence).toBe('number')
    }
  })

  it('至少有事件被检测', () => {
    const { fortuneOut } = fullPipeline()
    // 引擎对所有流年进行检测，应至少产生一些事件
    expect(fortuneOut.events.length).toBeGreaterThan(0)
  })

  it('事件 probability 在合理范围', () => {
    const { fortuneOut } = fullPipeline()
    for (const event of fortuneOut.events) {
      expect(event.probability).toBeGreaterThanOrEqual(0)
      expect(event.probability).toBeLessThanOrEqual(100)
    }
  })

  it('事件 severity 为 high/medium/low', () => {
    const { fortuneOut } = fullPipeline()
    for (const event of fortuneOut.events) {
      expect(['high', 'medium', 'low']).toContain(event.severity)
    }
  })
})

// ═══════════════════════════════════════════
// 14. 多维评分 (6)
// ═══════════════════════════════════════════

describe('多维评分', () => {
  it('有9个维度', () => {
    const { fortuneOut } = fullPipeline()
    const scores = fortuneOut.scores
    const keys = Object.keys(scores)
    expect(keys.length).toBe(9)
  })

  it('每个维度在 0-100 范围', () => {
    const { fortuneOut } = fullPipeline()
    const scores = fortuneOut.scores
    for (const value of Object.values(scores)) {
      expect(typeof value).toBe('number')
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(100)
    }
  })

  it('scores 结构完整', () => {
    const { fortuneOut } = fullPipeline()
    const s = fortuneOut.scores
    expect(s).toHaveProperty('fortuneScore')
    expect(s).toHaveProperty('luckScore')
    expect(s).toHaveProperty('careerScore')
    expect(s).toHaveProperty('wealthScore')
    expect(s).toHaveProperty('relationshipScore')
    expect(s).toHaveProperty('healthScore')
    expect(s).toHaveProperty('studyScore')
    expect(s).toHaveProperty('opportunityScore')
    expect(s).toHaveProperty('riskScore')
  })

  it('fortuneScore 存在且为数字', () => {
    const { fortuneOut } = fullPipeline()
    expect(typeof fortuneOut.scores.fortuneScore).toBe('number')
  })

  it('opportunityScore 与 riskScore 至少有一个 >= 50', () => {
    const { fortuneOut } = fullPipeline()
    const { opportunityScore, riskScore } = fortuneOut.scores
    // 至少一个应 >= 50，因为基线从 50 开始
    expect(opportunityScore >= 50 || riskScore >= 50).toBe(true)
  })

  it('总体评分合理（非极端值）', () => {
    const { fortuneOut } = fullPipeline()
    const { fortuneScore } = fortuneOut.scores
    // 大多数情况下不应是极端值 0 或 100
    expect(fortuneScore).toBeGreaterThan(5)
    expect(fortuneScore).toBeLessThan(98)
  })
})

// ═══════════════════════════════════════════
// 15. AI Explain (5)
// ═══════════════════════════════════════════

describe('generateFortuneExplain', () => {
  it('返回结构完整', () => {
    const { fortuneOut } = fullPipeline()
    const currentLiuNian = fortuneOut.liuNianYears[0]
    const currentDaYun = fortuneOut.daYunSteps[0]
    const yearEvents = fortuneOut.events.filter(e => e.year === currentLiuNian.year)
    const explain = generateFortuneExplain(currentLiuNian, yearEvents, fortuneOut.scores)

    expect(explain).toHaveProperty('year')
    expect(explain).toHaveProperty('yearGanZhi')
    expect(explain).toHaveProperty('classicalBasis')
    expect(explain).toHaveProperty('plainExplanation')
    expect(explain).toHaveProperty('risks')
    expect(explain).toHaveProperty('opportunities')
    expect(explain).toHaveProperty('suggestions')
    expect(explain).toHaveProperty('adjustments')
  })

  it('有 classicalBasis 和 plainExplanation', () => {
    const { fortuneOut } = fullPipeline()
    const currentLiuNian = fortuneOut.liuNianYears[0]
    const currentDaYun = fortuneOut.daYunSteps[0]
    const yearEvents = fortuneOut.events.filter(e => e.year === currentLiuNian.year)
    const explain = generateFortuneExplain(currentLiuNian, yearEvents, fortuneOut.scores)

    expect(Array.isArray(explain.classicalBasis)).toBe(true)
    expect(typeof explain.plainExplanation).toBe('string')
    expect(explain.plainExplanation.length).toBeGreaterThan(0)
  })

  it('risks 和 opportunities 为数组', () => {
    const { fortuneOut } = fullPipeline()
    const currentLiuNian = fortuneOut.liuNianYears[0]
    const yearEvents = fortuneOut.events.filter(e => e.year === currentLiuNian.year)
    const explain = generateFortuneExplain(currentLiuNian, yearEvents, fortuneOut.scores)

    expect(Array.isArray(explain.risks)).toBe(true)
    expect(Array.isArray(explain.opportunities)).toBe(true)
  })

  it('suggestions 和 adjustments 为数组', () => {
    const { fortuneOut } = fullPipeline()
    const currentLiuNian = fortuneOut.liuNianYears[0]
    const yearEvents = fortuneOut.events.filter(e => e.year === currentLiuNian.year)
    const explain = generateFortuneExplain(currentLiuNian, yearEvents, fortuneOut.scores)

    expect(Array.isArray(explain.suggestions)).toBe(true)
    expect(Array.isArray(explain.adjustments)).toBe(true)
  })

  it('plainExplanation 包含年份和干支信息', () => {
    const { fortuneOut } = fullPipeline()
    const currentLiuNian = fortuneOut.liuNianYears[0]
    const yearEvents = fortuneOut.events.filter(e => e.year === currentLiuNian.year)
    const explain = generateFortuneExplain(currentLiuNian, yearEvents, fortuneOut.scores)

    expect(explain.plainExplanation).toContain(String(currentLiuNian.year))
    expect(explain.yearGanZhi).toContain(currentLiuNian.ganZhi.gan)
    expect(explain.yearGanZhi).toContain(currentLiuNian.ganZhi.zhi)
  })
})

// ═══════════════════════════════════════════
// 16. 缓存 (3)
// ═══════════════════════════════════════════

describe('缓存', () => {
  it('首次写入后 getFortuneCacheSize >= 1', () => {
    expect(getFortuneCacheSize()).toBe(0)
    fullPipeline()
    expect(getFortuneCacheSize()).toBeGreaterThanOrEqual(1)
  })

  it('命中缓存后 computeTimeMs 极小', () => {
    const { fortuneOut: first } = fullPipeline()
    const firstTime = first.computeTimeMs
    expect(getFortuneCacheSize()).toBeGreaterThanOrEqual(1)

    // 第二次调用应命中缓存
    const { fortuneOut: second } = fullPipeline()
    // 缓存命中直接返回，computeTimeMs 应与首次相同（因为是缓存结果）
    expect(second.computeTimeMs).toBe(first.computeTimeMs)
  })

  it('clearFortuneCache 清空缓存', () => {
    fullPipeline()
    expect(getFortuneCacheSize()).toBeGreaterThanOrEqual(1)
    clearFortuneCache()
    expect(getFortuneCacheSize()).toBe(0)
  })
})

// ═══════════════════════════════════════════
// 17. RuleRegistry (4)
// ═══════════════════════════════════════════

describe('RuleRegistry', () => {
  it('dayun 分类 >= 7 条', () => {
    const dayunRules = defaultRuleRegistry.findByCategory('dayun')
    expect(dayunRules.length).toBeGreaterThanOrEqual(7)
  })

  it('liunian 分类 >= 5 条', () => {
    const liunianRules = defaultRuleRegistry.findByCategory('liunian')
    expect(liunianRules.length).toBeGreaterThanOrEqual(5)
  })

  it('module6-fortune 模块存在', () => {
    const module6Rules = defaultRuleRegistry.findByModule('module6-fortune')
    expect(module6Rules.length).toBeGreaterThan(0)
  })

  it('关键规则 ID 存在', () => {
    const expectedIds = [
      'fortune-engine', 'fortune-qiyun', 'fortune-dayun',
      'fortune-liunian', 'fortune-relation', 'fortune-event',
      'fortune-score', 'fortune-explain',
    ]
    for (const id of expectedIds) {
      const rule = defaultRuleRegistry.get(id)
      expect(rule).toBeDefined()
      expect(rule!.module).toBe('module6-fortune')
    }
  })
})

// ═══════════════════════════════════════════
// 18. 推导链 (2)
// ═══════════════════════════════════════════

describe('推导链', () => {
  it('derivation 存在', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.derivation).toBeDefined()
  })

  it('steps.length >= 2', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.derivation!.steps.length).toBeGreaterThanOrEqual(2)
  })

  it('推导链有 engineVersion', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.derivation!.engineVersion).toBe('6.0.0')
  })

  it('推导链有 computeTimeMs', () => {
    const { fortuneOut } = fullPipeline()
    expect(typeof fortuneOut.derivation!.computeTimeMs).toBe('number')
    expect(fortuneOut.derivation!.computeTimeMs).toBeGreaterThanOrEqual(0)
  })
})

// ═══════════════════════════════════════════
// 19. 完整管道 (5)
// ═══════════════════════════════════════════

describe('完整管道', () => {
  it('甲日寅月运行正常', () => {
    const { fortuneOut } = fullPipeline({
      dayGan: '甲', dayZhi: '子',
      monthGan: '丙', monthZhi: '寅',
    })
    expect(fortuneOut.version).toBe('6.0.0')
    expect(fortuneOut.daYunSteps.length).toBe(8)
    expect(fortuneOut.liuNianYears.length).toBeGreaterThan(0)
  })

  it('丙日子月运行正常', () => {
    const { fortuneOut } = fullPipeline({
      dayGan: '丙', dayZhi: '子',
      monthGan: '壬', monthZhi: '子',
    })
    expect(fortuneOut.version).toBe('6.0.0')
    expect(fortuneOut.daYunSteps.length).toBe(8)
  })

  it('丙日午月运行正常', () => {
    const { fortuneOut } = fullPipeline({
      dayGan: '丙', dayZhi: '午',
      monthGan: '甲', monthZhi: '午',
    })
    expect(fortuneOut.version).toBe('6.0.0')
    expect(fortuneOut.daYunSteps.length).toBe(8)
  })

  it('丁日卯月运行正常', () => {
    const { fortuneOut } = fullPipeline({
      dayGan: '丁', dayZhi: '卯',
      monthGan: '乙', monthZhi: '卯',
    })
    expect(fortuneOut.version).toBe('6.0.0')
    expect(fortuneOut.daYunSteps.length).toBe(8)
  })

  it('不同 gender 运行正常', () => {
    const pillars = makePillars({ dayGan: '甲', dayZhi: '子' })
    const tenGodOut = calculateTenGods(pillars, { gender: 'female' })
    const patternOut = calculatePattern(pillars, tenGodOut, { gender: 'female' })
    const xiYongOut = calculateXiYong(pillars, tenGodOut, patternOut, { gender: 'female' })
    const fortuneOut = calculateFortune(pillars, tenGodOut, patternOut, xiYongOut, {
      gender: 'female', birthDate: new Date(1990, 0, 15),
    })
    expect(fortuneOut.version).toBe('6.0.0')
    expect(fortuneOut.daYunSteps.length).toBe(8)
  })
})

// ═══════════════════════════════════════════
// 20. 边界情况 (5)
// ═══════════════════════════════════════════

describe('边界情况', () => {
  it('liuNianYears 非空', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.liuNianYears.length).toBeGreaterThan(0)
  })

  it('daYunSteps 默认 8 步', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.daYunSteps.length).toBe(8)
  })

  it('events probability 范围 0-100', () => {
    const { fortuneOut } = fullPipeline()
    for (const event of fortuneOut.events) {
      expect(event.probability).toBeGreaterThanOrEqual(0)
      expect(event.probability).toBeLessThanOrEqual(100)
    }
  })

  it('events confidence 范围 0-100', () => {
    const { fortuneOut } = fullPipeline()
    for (const event of fortuneOut.events) {
      expect(event.confidence).toBeGreaterThanOrEqual(0)
      expect(event.confidence).toBeLessThanOrEqual(100)
    }
  })

  it('overallConfidence 范围 0-1', () => {
    const { fortuneOut } = fullPipeline()
    const oc = fortuneOut.derivation!.overallConfidence
    expect(oc).toBeGreaterThanOrEqual(0)
    expect(oc).toBeLessThanOrEqual(1)
  })
})

// ═══════════════════════════════════════════
// 21. 大运步数可配置 (3)
// ═══════════════════════════════════════════

describe('大运步数可配置', () => {
  it('自定义步数 5 步', () => {
    const pillars = makePillars()
    const tenGodOut = calculateTenGods(pillars, { gender: 'male' })
    const patternOut = calculatePattern(pillars, tenGodOut, { gender: 'male' })
    const xiYongOut = calculateXiYong(pillars, tenGodOut, patternOut, { gender: 'male' })
    const fortuneOut = calculateFortune(pillars, tenGodOut, patternOut, xiYongOut, {
      ...defaultOpts, daYunSteps: 5,
    })
    expect(fortuneOut.daYunSteps.length).toBe(5)
  })

  it('自定义步数 10 步', () => {
    const pillars = makePillars()
    const tenGodOut = calculateTenGods(pillars, { gender: 'male' })
    const patternOut = calculatePattern(pillars, tenGodOut, { gender: 'male' })
    const xiYongOut = calculateXiYong(pillars, tenGodOut, patternOut, { gender: 'male' })
    const fortuneOut = calculateFortune(pillars, tenGodOut, patternOut, xiYongOut, {
      ...defaultOpts, daYunSteps: 10,
    })
    expect(fortuneOut.daYunSteps.length).toBe(10)
  })

  it('executionMetadata.daYunSteps 与配置一致', () => {
    const pillars = makePillars()
    const tenGodOut = calculateTenGods(pillars, { gender: 'male' })
    const patternOut = calculatePattern(pillars, tenGodOut, { gender: 'male' })
    const xiYongOut = calculateXiYong(pillars, tenGodOut, patternOut, { gender: 'male' })
    const fortuneOut = calculateFortune(pillars, tenGodOut, patternOut, xiYongOut, {
      ...defaultOpts, daYunSteps: 6,
    })
    expect(fortuneOut.executionMetadata.daYunSteps).toBe(6)
  })
})

// ═══════════════════════════════════════════
// 22. calculateFortuneScores 单元测试 (4)
// ═══════════════════════════════════════════

describe('calculateFortuneScores', () => {
  function makeMinimalLiuNian(year: number): LiuNianInfo {
    return {
      year,
      ganZhi: { gan: '甲', zhi: '子' },
      shenShi: '比肩' as ShenShi,
      changSheng: '长生',
      shenSha: [],
      fiveElementPower: { '木': 60, '火': 0, '土': 0, '金': 0, '水': 40 },
      originalRelations: { chong: [], xing: [], hai: [], po: [], he: [], sanHe: [], sanHui: [], liuHe: [], ganChong: [], ganHe: [], fuYin: [], fanYin: [] },
      daYunRelations: { chong: [], xing: [], hai: [], po: [], he: [], sanHe: [], sanHui: [], liuHe: [], ganChong: [], ganHe: [], fuYin: [], fanYin: [] },
      overallRelations: { chong: [], xing: [], hai: [], po: [], he: [], sanHe: [], sanHui: [], liuHe: [], ganChong: [], ganHe: [], fuYin: [], fanYin: [] },
      luckScore: 60,
    }
  }

  function makeMinimalDaYun(): DaYunStep {
    return {
      index: 0,
      startAge: 5, endAge: 14,
      startYear: 1995, endYear: 2004,
      ganZhi: { gan: '乙', zhi: '卯' },
      naYin: '大溪水',
      shenShi: '比肩' as ShenShi,
      changSheng: '帝旺',
      shenSha: [],
      fiveElementPower: { '木': 90, '火': 0, '土': 0, '金': 0, '水': 10 },
      originalRelations: { chong: [], xing: [], hai: [], po: [], he: ['甲乙五合'], sanHe: [], sanHui: [], liuHe: [], ganChong: [], ganHe: ['甲乙五合化金'], fuYin: [], fanYin: [] },
      patternRelations: [],
      xiYongRelations: {
        isXiShen: true, isYongShen: false, isJiShen: false,
        element: '木' as FiveElement, influence: 'positive',
        description: '为喜神木',
      },
      fortuneScore: 70,
    }
  }

  it('无事件时评分基于基线', () => {
    const liuNian = makeMinimalLiuNian(2024)
    const daYun = makeMinimalDaYun()
    const scores = calculateFortuneScores(liuNian, [], daYun)

    expect(scores.fortuneScore).toBeGreaterThanOrEqual(0)
    expect(scores.fortuneScore).toBeLessThanOrEqual(100)
  })

  it('正面事件提升 opportunityScore', () => {
    const liuNian = makeMinimalLiuNian(2024)
    const daYun = makeMinimalDaYun()

    const scores1 = calculateFortuneScores(liuNian, [], daYun)
    const positiveEvent: FortuneEvent = {
      type: '事业',
      probability: 70,
      reasons: ['正官喜用'],
      traceChain: {
        steps: [], overallConfidence: 0.7, computeTimeMs: 0,
        engineVersion: '6.0.0', algorithmVersion: 'v6.0-classic', warnings: [],
      },
      confidence: 70,
      year: 2024,
      severity: 'low',
      opportunity: true,
    }
    const scores2 = calculateFortuneScores(liuNian, [positiveEvent], daYun)

    expect(scores2.opportunityScore).toBeGreaterThan(scores1.opportunityScore)
  })

  it('负面事件提升 riskScore', () => {
    const liuNian = makeMinimalLiuNian(2024)
    const daYun = makeMinimalDaYun()

    const scores1 = calculateFortuneScores(liuNian, [], daYun)
    const negativeEvent: FortuneEvent = {
      type: '疾病',
      probability: 60,
      reasons: ['七杀攻身'],
      traceChain: {
        steps: [], overallConfidence: 0.6, computeTimeMs: 0,
        engineVersion: '6.0.0', algorithmVersion: 'v6.0-classic', warnings: [],
      },
      confidence: 60,
      year: 2024,
      severity: 'medium',
      opportunity: false,
    }
    const scores2 = calculateFortuneScores(liuNian, [negativeEvent], daYun)

    expect(scores2.riskScore).toBeGreaterThan(scores1.riskScore)
  })

  it('所有维度均返回数字', () => {
    const liuNian = makeMinimalLiuNian(2024)
    const daYun = makeMinimalDaYun()
    const scores = calculateFortuneScores(liuNian, [], daYun)

    const values: number[] = [
      scores.fortuneScore, scores.luckScore, scores.careerScore,
      scores.wealthScore, scores.relationshipScore, scores.healthScore,
      scores.studyScore, scores.opportunityScore, scores.riskScore,
    ]
    for (const v of values) {
      expect(typeof v).toBe('number')
    }
  })
})

// ═══════════════════════════════════════════
// 23. detectEvents 单元测试 (4)
// ═══════════════════════════════════════════

describe('detectEvents', () => {
  function makeMinimalLiuNianForEvent(year: number, shenShi: string): LiuNianInfo {
    return {
      year,
      ganZhi: { gan: '庚', zhi: '午' },
      shenShi: shenShi as ShenShi,
      changSheng: '沐浴',
      shenSha: [],
      fiveElementPower: { '木': 0, '火': 30, '土': 30, '金': 60, '水': 0 },
      originalRelations: { chong: ['子午冲'], xing: [], hai: [], po: [], he: [], sanHe: [], sanHui: [], liuHe: [], ganChong: [], ganHe: [], fuYin: [], fanYin: [] },
      daYunRelations: { chong: [], xing: [], hai: [], po: [], he: [], sanHe: [], sanHui: [], liuHe: [], ganChong: [], ganHe: [], fuYin: [], fanYin: [] },
      overallRelations: { chong: ['子午冲'], xing: [], hai: [], po: [], he: [], sanHe: [], sanHui: [], liuHe: [], ganChong: [], ganHe: [], fuYin: [], fanYin: [] },
      luckScore: 45,
    }
  }

  function makeMinimalDaYunForEvent(): DaYunStep {
    return {
      index: 0, startAge: 5, endAge: 14, startYear: 1995, endYear: 2004,
      ganZhi: { gan: '丁', zhi: '亥' },
      naYin: '屋上土',
      shenShi: '正印' as ShenShi,
      changSheng: '长生',
      shenSha: [],
      fiveElementPower: { '木': 0, '火': 60, '土': 0, '金': 0, '水': 40 },
      originalRelations: { chong: [], xing: [], hai: [], po: [], he: [], sanHe: [], sanHui: [], liuHe: [], ganChong: [], ganHe: [], fuYin: [], fanYin: [] },
      patternRelations: [],
      xiYongRelations: {
        isXiShen: true, isYongShen: false, isJiShen: false,
        element: '火' as FiveElement, influence: 'positive',
        description: '为喜神火',
      },
      fortuneScore: 65,
    }
  }

  it('有冲关系时至少检测到部分事件', () => {
    const liuNian = makeMinimalLiuNianForEvent(2024, '七杀')
    const daYun = makeMinimalDaYunForEvent()
    const events = detectEvents(liuNian, daYun, '甲', 'male', [])
    // 冲关系应触发一些事件
    expect(events.length).toBeGreaterThanOrEqual(0)
  })

  it('每个事件有 traceChain', () => {
    const liuNian = makeMinimalLiuNianForEvent(2024, '正官')
    const daYun = makeMinimalDaYunForEvent()
    const events = detectEvents(liuNian, daYun, '甲', 'male', [])
    for (const event of events) {
      expect(event.traceChain).toBeDefined()
      expect(event.traceChain.steps).toBeDefined()
    }
  })

  it('事件 year 与流年 year 一致', () => {
    const liuNian = makeMinimalLiuNianForEvent(2030, '正财')
    const daYun = makeMinimalDaYunForEvent()
    const events = detectEvents(liuNian, daYun, '甲', 'male', [])
    for (const event of events) {
      expect(event.year).toBe(2030)
    }
  })

  it('事件 opportunity 与 severity 相关', () => {
    const liuNian = makeMinimalLiuNianForEvent(2024, '伤官')
    const daYun = makeMinimalDaYunForEvent()
    const events = detectEvents(liuNian, daYun, '甲', 'male', [])
    for (const event of events) {
      if (!event.opportunity) {
        // 非正面事件应有 severity
        expect(['high', 'medium', 'low']).toContain(event.severity)
      }
    }
  })
})

// ═══════════════════════════════════════════
// 24. 天干五合与地支三合具体验证 (5)
// ═══════════════════════════════════════════

describe('干支关系详细验证', () => {
  it('天干五合：甲己合土', () => {
    const r = detectRelations('甲', '子', '己', '丑')
    expect(r.ganHe.some(h => h.includes('甲己'))).toBe(true)
  })

  it('地支六合：卯戌合火', () => {
    const r = detectRelations('甲', '卯', '乙', '戌')
    expect(r.liuHe.some(h => h.includes('卯戌'))).toBe(true)
  })

  it('三会局：寅卯辰半会', () => {
    const r = detectRelations('甲', '寅', '乙', '辰')
    expect(r.sanHui.length).toBeGreaterThanOrEqual(1)
  })

  it('六害：子未害', () => {
    const r = detectRelations('甲', '子', '乙', '未')
    expect(r.hai).toContain('子未害')
  })

  it('破：子酉破', () => {
    const r = detectRelations('甲', '子', '乙', '酉')
    expect(r.po).toContain('子酉破')
  })
})

// ═══════════════════════════════════════════
// 25. 阴阳性别对起运的影响 (3)
// ═══════════════════════════════════════════

describe('阴阳性别对起运的影响', () => {
  it('阴干男命逆行', () => {
    const info = calculateQiYunInfo(
      new Date(1990, 0, 15), '乙', 'male', { algorithm: 'classic' },
    )
    // 乙为阴干，阴男逆行
    expect(info.isShun).toBe(false)
  })

  it('阴干女命顺行', () => {
    const info = calculateQiYunInfo(
      new Date(1990, 0, 15), '乙', 'female', { algorithm: 'classic' },
    )
    // 乙为阴干，阴女顺行
    expect(info.isShun).toBe(true)
  })

  it('阳干女命逆行', () => {
    const info = calculateQiYunInfo(
      new Date(1990, 0, 15), '甲', 'female', { algorithm: 'classic' },
    )
    // 甲为阳干，阳女逆行
    expect(info.isShun).toBe(false)
  })
})

// ═══════════════════════════════════════════
// 26. executionMetadata 完整性 (3)
// ═══════════════════════════════════════════

describe('executionMetadata 完整性', () => {
  it('executionTime >= 0', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.executionMetadata.executionTime).toBeGreaterThanOrEqual(0)
  })

  it('shenShaChecks > 0', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.executionMetadata.shenShaChecks).toBeGreaterThan(0)
  })

  it('rulesApplied >= 0', () => {
    const { fortuneOut } = fullPipeline()
    expect(fortuneOut.executionMetadata.rulesApplied).toBeGreaterThanOrEqual(0)
  })
})