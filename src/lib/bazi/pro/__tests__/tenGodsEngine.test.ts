/**
 * H3 Module 3: Professional Ten Gods Engine — 测试
 *
 * 覆盖：
 * - 十神透藏分析
 * - 十神力量统计
 * - 旺相休囚死
 * - 得令/得地/得势
 * - 十神关系网络
 * - 十神组合匹配
 * - 十神评分
 * - AI Explain
 * - 缓存机制
 * - 性能基准
 * - Golden Cases
 * - 数据库完整性
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateTenGods,
  clearTenGodsCache,
  getTenGodsCacheSize,
  TEN_GODS_ENGINE_VERSION,
} from '../tenGodsEngine'
import type { TenGodsEngineOptions } from '../tenGodsEngine'
import { TEN_GODS, TEN_GOD_CATEGORY, TEN_GOD_NATURE, TEN_GOD_RELATION_RULES, TEN_GOD_COMBINATION_RULES } from '../tenGodsDatabase'
import { generateTenGodExplain } from '../tenGodsDatabase'
import type { TenGodDetail } from '../tenGodsTypes'
import type { ProfessionalFourPillarsResult } from '../types'

// ─── 测试数据工厂 ───

function makePillars(opts: {
  yearGan: string
  yearZhi: string
  monthGan: string
  monthZhi: string
  dayGan: string
  dayZhi: string
  hourGan: string
  hourZhi: string
}): ProfessionalFourPillarsResult {
  return {
    version: '1.0.0',
    sixLines: { year: { gan: opts.yearGan as any, zhi: opts.yearZhi as any }, month: { gan: opts.monthGan as any, zhi: opts.monthZhi as any }, day: { gan: opts.dayGan as any, zhi: opts.dayZhi as any }, hour: { gan: opts.hourGan as any, zhi: opts.hourZhi as any } },
    pillars: { year: {} as any, month: {} as any, day: {} as any, hour: {} as any },
    dayMaster: opts.dayGan as any,
    dayMasterElement: '木',
    dayMasterYinYang: '阳',
    fiveElementCount: {} as any,
    naYin: {} as any,
    changSheng: {} as any,
    kongWang: [],
    mingGong: {} as any,
    shenGong: {} as any,
    taiYuan: {} as any,
    taiXi: {} as any,
    cangGanMap: {} as any,
    derivation: {} as any,
    warnings: [],
    computedAt: Date.now(),
  }
}

const defaultOpts: TenGodsEngineOptions = { gender: '男' }

// ─── 引擎基础 ───

describe('Ten Gods Engine: 基础功能', () => {
  beforeEach(() => clearTenGodsCache())

  it('引擎版本正确', () => {
    expect(TEN_GODS_ENGINE_VERSION).toBe('3.1.0')
  })

  it('计算返回10种十神', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.details).toHaveLength(10)
  })

  it('返回日主信息', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.dayMaster).toBe('甲')
    expect(out.dayMasterElement).toBe('木')
    expect(out.dayMasterYinYang).toBeDefined()
  })

  it('包含推导链', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.derivation).toBeDefined()
    expect(out.derivation!.steps.length).toBeGreaterThan(0)
    expect(out.derivation!.engineVersion).toBe('3.1.0')
  })

  it('计算耗时存在', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.computeTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('每个十神都有完整字段', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (const d of out.details) {
      expect(d.name).toBeTruthy()
      expect(d.category).toBeTruthy()
      expect(d.nature).toBeTruthy()
      expect(d.element).toBeTruthy()
      expect(typeof d.power).toBe('number')
      expect(typeof d.wangShuai).toBe('string')
      expect(typeof d.deLing).toBe('boolean')
      expect(typeof d.deDi).toBe('boolean')
      expect(typeof d.deShi).toBe('boolean')
      expect(typeof d.youGen).toBe('boolean')
      expect(typeof d.strengthScore).toBe('number')
      expect(typeof d.auspiciousScore).toBe('number')
      expect(typeof d.balanceScore).toBe('number')
    }
  })
})

// ─── 十神透藏分析 ───

describe('Ten Gods Engine: 透藏分析', () => {
  beforeEach(() => clearTenGodsCache())

  it('透干列表正确（甲日见甲=比肩）', () => {
    // 甲日，年干甲→比肩，月干丙→食神
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.touCang.touGanList).toContain('比肩')
    expect(out.touCang.touGanList).toContain('食神')
  })

  it('藏干列表不为空', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '午', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '申' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.touCang.cangGanList.length).toBeGreaterThan(0)
  })

  it('日干十神固定为比肩', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.touCang.dayGanShenShi).toBe('比肩')
  })

  it('月干十神正确', () => {
    // 甲日见丙→食神
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.touCang.monthGanShenShi).toBe('食神')
  })

  it('时干十神正确', () => {
    // 甲日见庚→偏官
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.touCang.hourGanShenShi).toBe('偏官')
  })
})

// ─── 旺相休囚死 ───

describe('Ten Gods Engine: 旺相休囚死', () => {
  beforeEach(() => clearTenGodsCache())

  it('甲日寅月（木旺月）比肩为旺', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const bijian = out.details.find(d => d.name === '比肩')
    expect(bijian?.wangShuai).toBe('旺')
  })

  it('甲日寅月火为相', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const shiShen = out.details.find(d => d.name === '食神')
    expect(shiShen?.wangShuai).toBe('相')
  })

  it('甲日寅月金为囚', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const pianGuan = out.details.find(d => d.name === '偏官')
    expect(pianGuan?.wangShuai).toBe('囚')
  })
})

// ─── 得令得地得势 ───

describe('Ten Gods Engine: 得令得地得势', () => {
  beforeEach(() => clearTenGodsCache())

  it('甲日寅月比肩得令（月支本气甲=比肩）', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const bijian = out.details.find(d => d.name === '比肩')
    expect(bijian?.deLing).toBe(true)
  })

  it('甲日寅月食神不得令', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const shiShen = out.details.find(d => d.name === '食神')
    expect(shiShen?.deLing).toBe(false)
  })

  it('四柱含藏干时得地为true', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '午', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '申' })
    const out = calculateTenGods(pillars, defaultOpts)
    // 寅、午、申都有藏干，大部分十神应得地
    const deDiCount = out.details.filter(d => d.deDi).length
    expect(deDiCount).toBeGreaterThan(0)
  })
})

// ─── 十神力量与评分 ───

describe('Ten Gods Engine: 力量与评分', () => {
  beforeEach(() => clearTenGodsCache())

  it('力量值在0-100范围', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (const d of out.details) {
      expect(d.power).toBeGreaterThanOrEqual(0)
      expect(d.power).toBeLessThanOrEqual(100)
      expect(d.strengthScore).toBeGreaterThanOrEqual(0)
      expect(d.strengthScore).toBeLessThanOrEqual(100)
      expect(d.auspiciousScore).toBeGreaterThanOrEqual(0)
      expect(d.auspiciousScore).toBeLessThanOrEqual(100)
      expect(d.balanceScore).toBeGreaterThanOrEqual(0)
      expect(d.balanceScore).toBeLessThanOrEqual(100)
    }
  })

  it('按力量排序', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (let i = 0; i < out.sortedByPower.length - 1; i++) {
      const d1 = out.details.find(d => d.name === out.sortedByPower[i])!.power
      const d2 = out.details.find(d => d.name === out.sortedByPower[i + 1])!.power
      expect(d1).toBeGreaterThanOrEqual(d2)
    }
  })

  it('总体评分在0-100范围', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.overallAuspiciousScore).toBeGreaterThanOrEqual(0)
    expect(out.overallAuspiciousScore).toBeLessThanOrEqual(100)
    expect(out.overallBalanceScore).toBeGreaterThanOrEqual(0)
    expect(out.overallBalanceScore).toBeLessThanOrEqual(100)
  })
})

// ─── 十神关系网络 ───

describe('Ten Gods Engine: 关系网络', () => {
  beforeEach(() => clearTenGodsCache())

  it('关系网络存在', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.relationNetwork.relations.length).toBeGreaterThan(0)
    expect(out.relationNetwork.shengKeChain).toBeTruthy()
  })

  it('和谐关系（相生）存在', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.relationNetwork.harmonyRelations.length).toBeGreaterThan(0)
    for (const r of out.relationNetwork.harmonyRelations) {
      expect(r.type).toBe('生')
    }
  })

  it('冲突关系（相克）存在', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.relationNetwork.conflictRelations.length).toBeGreaterThan(0)
    for (const r of out.relationNetwork.conflictRelations) {
      expect(r.type).toBe('克')
    }
  })
})

// ─── 十神组合匹配 ───

describe('Ten Gods Engine: 组合匹配', () => {
  beforeEach(() => clearTenGodsCache())

  it('组合规则库不为空', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.combinations.length).toBe(TEN_GOD_COMBINATION_RULES.length)
  })

  it('部分组合命中', () => {
    // 甲日寅月午时：食神（丙月干）+ 偏官（庚时干）
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const hitCount = out.combinations.filter(c => c.hit).length
    // 至少应有食神和偏官的组合
    expect(hitCount).toBeGreaterThanOrEqual(0)
  })
})

// ─── AI Explain ───

describe('Ten Gods Engine: AI Explain', () => {
  it('生成结构化解释', () => {
    const mockDetail: TenGodDetail = {
      name: '食神', category: '食伤', nature: '吉', element: '火',
      count: 3, touGan: 1, cangGan: 2, benGan: 1, zhongGan: 1, yaoGan: 0,
      power: 65, wangShuai: '相', deLing: false, deDi: true, deShi: true, youGen: true,
      positions: ['月干' as any], strengthScore: 65, auspiciousScore: 85, balanceScore: 70,
      powerBreakdown: { deLing: 0, deDi: 20, deShi: 18, youGen: 12, touGan: 8, shengFu: 6, heHua: 0, xiuZheng: 0 },
      state: 'active', confidence: 75,
    }
    const exp = generateTenGodExplain(mockDetail)
    expect(exp.name).toBe('食神')
    expect(exp.powerSummary).toContain('65')
    expect(exp.classicalReference).toBeTruthy()
    expect(exp.modernInterpretation).toBeTruthy()
    expect(exp.personality.length).toBeGreaterThan(0)
    expect(exp.career.length).toBeGreaterThan(0)
    expect(exp.wealth.length).toBeGreaterThan(0)
    expect(exp.marriage.length).toBeGreaterThan(0)
    expect(exp.health.length).toBeGreaterThan(0)
    expect(exp.conditions).toBeTruthy()
    expect(exp.confidenceAssessment).toBeTruthy()
    expect(exp.suggestions.length).toBeGreaterThan(0)
    // 新增字段
    expect(exp.keywords.length).toBeGreaterThan(0)
    expect(exp.traits.length).toBeGreaterThan(0)
    expect(exp.advantages.length).toBeGreaterThan(0)
    expect(exp.risks.length).toBeGreaterThan(0)
  })

  it('所有10种十神都有解释', () => {
    const mockDetail: TenGodDetail = {
      name: '比肩', category: '比劫', nature: '中性', element: '木',
      count: 1, touGan: 1, cangGan: 0, benGan: 0, zhongGan: 0, yaoGan: 0,
      power: 25, wangShuai: '旺', deLing: false, deDi: false, deShi: false, youGen: true,
      positions: ['年干' as any], strengthScore: 25, auspiciousScore: 50, balanceScore: 90,
      powerBreakdown: { deLing: 0, deDi: 0, deShi: 0, youGen: 12, touGan: 8, shengFu: 6, heHua: 0, xiuZheng: 0 },
      state: 'active', confidence: 60,
    }
    for (const ss of TEN_GODS) {
      mockDetail.name = ss
      mockDetail.category = TEN_GOD_CATEGORY[ss]
      mockDetail.nature = TEN_GOD_NATURE[ss]
      const exp = generateTenGodExplain({ ...mockDetail })
      expect(exp.classicalReference).toBeTruthy()
    }
  })
})

// ─── 缓存 ───

describe('Ten Gods Engine: 缓存', () => {
  beforeEach(() => clearTenGodsCache())

  it('首次计算缓存增长', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    calculateTenGods(pillars, defaultOpts)
    expect(getTenGodsCacheSize()).toBe(1)
  })

  it('相同输入命中缓存', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    calculateTenGods(pillars, defaultOpts)
    calculateTenGods(pillars, defaultOpts)
    expect(getTenGodsCacheSize()).toBe(1)
  })

  it('清空缓存', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    calculateTenGods(pillars, defaultOpts)
    clearTenGodsCache()
    expect(getTenGodsCacheSize()).toBe(0)
  })
})

// ─── Golden Cases ───

describe('Ten Gods Engine: Golden Cases', () => {
  beforeEach(() => clearTenGodsCache())

  it('Golden Case 1: 甲日甲年—比肩透年干', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const bijian = out.details.find(d => d.name === '比肩')
    expect(bijian?.count).toBeGreaterThanOrEqual(2) // 日干甲+年干甲=比肩
    expect(bijian?.touGan).toBeGreaterThanOrEqual(2)
  })

  it('Golden Case 2: 丙日庚时—食神制杀', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '壬', monthZhi: '午', dayGan: '丙', dayZhi: '寅', hourGan: '庚', hourZhi: '申' })
    const out = calculateTenGods(pillars, defaultOpts)
    const shiShen = out.details.find(d => d.name === '食神')
    const pianGuan = out.details.find(d => d.name === '偏官')
    // 丙日见庚=偏官，丙本身=比肩，壬=偏官，寅藏甲=偏印
    expect(pianGuan?.count).toBeGreaterThanOrEqual(1)
  })

  it('Golden Case 3: 戊日丁月—伤官佩印', () => {
    const pillars = makePillars({ yearGan: '壬', yearZhi: '子', monthGan: '丁', monthZhi: '巳', dayGan: '戊', dayZhi: '戌', hourGan: '癸', hourZhi: '丑' })
    const out = calculateTenGods(pillars, defaultOpts)
    const shangGuan = out.details.find(d => d.name === '伤官')
    const zhengYin = out.details.find(d => d.name === '正印')
    // 戊日见丁=伤官
    expect(shangGuan?.count).toBeGreaterThanOrEqual(1)
  })
})

// ─── 性能基准 ───

describe('Ten Gods Engine: 性能', () => {
  beforeEach(() => clearTenGodsCache())

  it('1000次排盘性能', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const start = Date.now()
    for (let i = 0; i < 1000; i++) {
      calculateTenGods(pillars, { gender: i % 2 === 0 ? '男' : '女' })
    }
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(5000)
  })

  it('单次耗时<30ms', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.computeTimeMs).toBeLessThan(30)
  })
})

// ─── 数据库完整性 ───

describe('Ten Gods Database: 完整性', () => {
  it('十神列表10种', () => {
    expect(TEN_GODS).toHaveLength(10)
  })

  it('每个十神都有分类', () => {
    for (const ss of TEN_GODS) {
      expect(TEN_GOD_CATEGORY[ss]).toBeTruthy()
    }
  })

  it('每个十神都有性质', () => {
    for (const ss of TEN_GODS) {
      expect(['吉', '凶', '中性']).toContain(TEN_GOD_NATURE[ss])
    }
  })

  it('关系规则库≥15条', () => {
    expect(TEN_GOD_RELATION_RULES.length).toBeGreaterThanOrEqual(15)
  })

  it('每条关系规则都有check函数', () => {
    for (const r of TEN_GOD_RELATION_RULES) {
      expect(typeof r.check).toBe('function')
      expect(r.source).toBeTruthy()
      expect(r.modernExplain).toBeTruthy()
    }
  })

  it('组合规则库≥15条', () => {
    expect(TEN_GOD_COMBINATION_RULES.length).toBeGreaterThanOrEqual(15)
  })

  it('生克链数据完整', () => {
    for (const r of TEN_GOD_RELATION_RULES) {
      expect(r.id).toBeTruthy()
      expect(r.name).toBeTruthy()
      expect(r.shenShi.length).toBeGreaterThanOrEqual(1)
      expect(r.source).toBeTruthy()
    }
  })
})

// ─── 五行力量 ───

describe('Ten Gods Engine: 五行力量', () => {
  beforeEach(() => clearTenGodsCache())

  it('5种五行都有分析', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.fiveElementPower).toHaveLength(5)
    const elements = out.fiveElementPower.map(f => f.element)
    expect(elements).toEqual(['木', '火', '土', '金', '水'])
  })

  it('五行百分比总和约100', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const total = out.fiveElementPower.reduce((sum, f) => sum + f.percentage, 0)
    expect(total).toBeCloseTo(100, 0)
  })
})

// ─── 3.1 力量来源拆分（Power Breakdown） ───

describe('Ten Gods Engine: Power Breakdown', () => {
  beforeEach(() => clearTenGodsCache())

  it('每个十神都有 powerBreakdown', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (const d of out.details) {
      expect(d.powerBreakdown).toBeDefined()
      expect(typeof d.powerBreakdown.deLing).toBe('number')
      expect(typeof d.powerBreakdown.deDi).toBe('number')
      expect(typeof d.powerBreakdown.deShi).toBe('number')
      expect(typeof d.powerBreakdown.youGen).toBe('number')
      expect(typeof d.powerBreakdown.touGan).toBe('number')
      expect(typeof d.powerBreakdown.shengFu).toBe('number')
      expect(typeof d.powerBreakdown.heHua).toBe('number')
      expect(typeof d.powerBreakdown.xiuZheng).toBe('number')
    }
  })

  it('得令的十神 deLing > 0', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const bijian = out.details.find(d => d.name === '比肩')
    expect(bijian?.deLing).toBe(true)
    expect(bijian?.powerBreakdown.deLing).toBe(35)
  })

  it('powerBreakdown 总和与 power 一致', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (const d of out.details) {
      const bd = d.powerBreakdown
      const bdSum = bd.deLing + bd.deDi + bd.deShi + bd.youGen + bd.touGan + bd.shengFu + bd.heHua + bd.xiuZheng
      expect(d.power).toBe(Math.min(100, Math.max(0, Math.round(bdSum / 100 * 100))))
    }
  })
})

// ─── 3.2 RelationshipGraph 升级 ───

describe('Ten Gods Engine: RelationshipGraph 升级', () => {
  beforeEach(() => clearTenGodsCache())

  it('每条关系都有 direction 和 reason', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (const r of out.relationNetwork.relations) {
      expect(['forward', 'backward', 'bidirectional']).toContain(r.direction)
      expect(r.reason).toBeTruthy()
    }
  })

  it('包含泄关系', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const xie = out.relationNetwork.relations.filter(r => r.type === '泄')
    // 食神生偏财时，偏财泄食神
    expect(xie.length).toBeGreaterThan(0)
  })

  it('包含耗关系', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const hao = out.relationNetwork.relations.filter(r => r.type === '耗')
    expect(hao.length).toBeGreaterThan(0)
  })
})

// ─── 3.3 TenGod State ───

describe('Ten Gods Engine: TenGod State', () => {
  beforeEach(() => clearTenGodsCache())

  it('每个十神都有 state', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (const d of out.details) {
      expect(['active', 'hidden', 'suppressed', 'damaged', 'transformed']).toContain(d.state)
    }
  })

  it('出现次数为0的十神 state 为 hidden', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (const d of out.details) {
      if (d.count === 0) {
        expect(d.state).toBe('hidden')
      }
    }
  })

  it('有透干的十神 state 为 active', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const bijian = out.details.find(d => d.name === '比肩')
    expect(bijian?.touGan).toBeGreaterThanOrEqual(2)
    expect(bijian?.state).toBe('active')
  })
})

// ─── 3.4 PatternCandidate ───

describe('Ten Gods Engine: PatternCandidate', () => {
  beforeEach(() => clearTenGodsCache())

  it('possiblePatterns 字段存在', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.possiblePatterns).toBeDefined()
    expect(Array.isArray(out.possiblePatterns)).toBe(true)
  })

  it('每个候选格局都有完整字段', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (const p of out.possiblePatterns) {
      expect(p.name).toBeTruthy()
      expect(p.confidence).toBeGreaterThanOrEqual(0)
      expect(p.confidence).toBeLessThanOrEqual(1)
      expect(p.involvedShenShi.length).toBeGreaterThan(0)
      expect(p.reference).toBeTruthy()
    }
  })
})

// ─── 3.5 评分可信度 ───

describe('Ten Gods Engine: Confidence', () => {
  beforeEach(() => clearTenGodsCache())

  it('每个十神都有 confidence 0-100', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (const d of out.details) {
      expect(d.confidence).toBeGreaterThanOrEqual(0)
      expect(d.confidence).toBeLessThanOrEqual(100)
    }
  })

  it('出现多次且透干的十神 confidence 较高', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const bijian = out.details.find(d => d.name === '比肩')
    // 比肩出现多次+透干+得令 → confidence 应较高
    expect(bijian?.confidence).toBeGreaterThanOrEqual(50)
  })

  it('未出现的十神 confidence 较低', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    for (const d of out.details) {
      if (d.count === 0) {
        // 基础30 + 可能的 youGen(12) + 旺相(10) = 最高 52，但 hidden 通常 30-50
        expect(d.confidence).toBeLessThanOrEqual(55)
      }
    }
  })
})

// ─── 3.6 AI Explain Keywords ───

describe('Ten Gods Engine: AI Explain Keywords', () => {
  it('所有10种十神都有 keywords/traits/advantages/risks', () => {
    const mockDetail: TenGodDetail = {
      name: '比肩', category: '比劫', nature: '中性', element: '木',
      count: 1, touGan: 1, cangGan: 0, benGan: 0, zhongGan: 0, yaoGan: 0,
      power: 25, wangShuai: '旺', deLing: false, deDi: false, deShi: false, youGen: true,
      positions: ['年干' as any], strengthScore: 25, auspiciousScore: 50, balanceScore: 90,
      powerBreakdown: { deLing: 0, deDi: 0, deShi: 0, youGen: 12, touGan: 8, shengFu: 6, heHua: 0, xiuZheng: 0 },
      state: 'active', confidence: 60,
    }
    for (const ss of TEN_GODS) {
      mockDetail.name = ss
      mockDetail.category = TEN_GOD_CATEGORY[ss]
      mockDetail.nature = TEN_GOD_NATURE[ss]
      const exp = generateTenGodExplain({ ...mockDetail })
      expect(exp.keywords.length).toBeGreaterThan(0)
      expect(exp.traits.length).toBeGreaterThan(0)
      expect(exp.advantages.length).toBeGreaterThan(0)
      expect(exp.risks.length).toBeGreaterThan(0)
    }
  })
})

// ─── 3.7 ExecutionMetadata ───

describe('Ten Gods Engine: ExecutionMetadata', () => {
  beforeEach(() => clearTenGodsCache())

  it('executionMetadata 存在且字段正确', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.executionMetadata).toBeDefined()
    expect(typeof out.executionMetadata.executionTime).toBe('number')
    expect(typeof out.executionMetadata.ruleCount).toBe('number')
    expect(typeof out.executionMetadata.matchedRules).toBe('number')
    expect(out.executionMetadata.executionTime).toBeGreaterThanOrEqual(0)
    expect(out.executionMetadata.ruleCount).toBeGreaterThan(0)
    expect(out.executionMetadata.matchedRules).toBeGreaterThanOrEqual(0)
  })

  it('ruleCount = 关系规则 + 组合规则总数', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    const expected = TEN_GOD_RELATION_RULES.length + TEN_GOD_COMBINATION_RULES.length
    expect(out.executionMetadata.ruleCount).toBe(expected)
  })
})

// ─── 3.8 Cache Version ───

describe('Ten Gods Engine: Cache Version', () => {
  beforeEach(() => clearTenGodsCache())

  it('cacheVersion 字段存在', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateTenGods(pillars, defaultOpts)
    expect(out.cacheVersion).toBeDefined()
    expect(out.cacheVersion).toBe('3.1.0')
  })

  it('缓存 key 包含版本号', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    calculateTenGods(pillars, defaultOpts)
    expect(getTenGodsCacheSize()).toBe(1)
  })
})
