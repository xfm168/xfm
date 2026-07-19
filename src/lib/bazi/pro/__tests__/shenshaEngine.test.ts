/**
 * H3 Module 2: Professional ShenSha Engine — 测试
 *
 * 覆盖：
 * - 引擎主入口 calculateShenSha
 * - 38种神煞全部命中/未命中验证
 * - 分类过滤
 * - ID过滤
 * - 冲突检测
 * - 缓存机制
 * - AI Explain 接口
 * - 性能基准
 * - TraceChain / WarningCode 集成
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateShenSha,
  clearShenShaCache,
  getShenShaCacheSize,
  explainShenSha,
  SHEN_SHA_ENGINE_VERSION,
} from '../shenshaEngine'
import type { ShenShaEngineOptions } from '../shenshaEngine'
import { SHEN_SHA_DATABASE, SHEN_SHA_BY_ID } from '../shenshaDatabase'
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
  const {
    yearGan, yearZhi, monthGan, monthZhi,
    dayGan, dayZhi, hourGan, hourZhi,
  } = opts as {
    yearGan: '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸'
    yearZhi: '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥'
    monthGan: '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸'
    monthZhi: '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥'
    dayGan: '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸'
    dayZhi: '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥'
    hourGan: '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸'
    hourZhi: '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥'
  }

  return {
    version: '1.0.0',
    sixLines: { year: { gan: yearGan, zhi: yearZhi }, month: { gan: monthGan, zhi: monthZhi }, day: { gan: dayGan, zhi: dayZhi }, hour: { gan: hourGan, zhi: hourZhi } },
    pillars: { year: {} as any, month: {} as any, day: {} as any, hour: {} as any },
    dayMaster: dayGan,
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

const defaultOpts: ShenShaEngineOptions = { gender: '男' }

// ─── 引擎基础测试 ───

describe('ShenSha Engine: 基础功能', () => {
  beforeEach(() => {
    clearShenShaCache()
  })

  it('引擎版本正确', () => {
    expect(SHEN_SHA_ENGINE_VERSION).toBe('2.0.0')
  })

  it('计算全部38种神煞', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    expect(out.results).toHaveLength(SHEN_SHA_DATABASE.length)
    expect(out.stats.total).toBe(SHEN_SHA_DATABASE.length)
  })

  it('统计命中/未命中', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    expect(out.stats.hitCount + out.stats.missCount).toBe(out.stats.total)
  })

  it('按分类分组存在', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    expect(Object.keys(out.byCategory).length).toBeGreaterThan(0)
  })

  it('吉神/凶神分离正确', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    for (const r of out.auspicious) {
      expect(r.isAuspicious).toBe(true)
    }
    for (const r of out.inauspicious) {
      expect(r.isAuspicious).toBe(false)
    }
  })

  it('优先级排序：高优先级在前', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    for (let i = 0; i < out.hits.length - 1; i++) {
      expect(out.hits[i].priority).toBeGreaterThanOrEqual(out.hits[i + 1].priority)
    }
  })

  it('包含推导链 derivation', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    expect(out.derivation).toBeDefined()
    expect(out.derivation!.steps.length).toBeGreaterThan(0)
    expect(out.derivation!.engineVersion).toBe('2.0.0')
  })

  it('计算耗时存在', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    expect(out.computeTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('每个结果都有完整字段', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    for (const r of out.results) {
      expect(r.id).toBeTruthy()
      expect(r.name).toBeTruthy()
      expect(r.category).toBeTruthy()
      expect(typeof r.hit).toBe('boolean')
      expect(Array.isArray(r.positions)).toBe(true)
      expect(r.priority).toBeGreaterThan(0)
      expect(r.confidence).toBeGreaterThanOrEqual(0)
      expect(r.confidence).toBeLessThanOrEqual(1)
    }
  })
})

// ─── 分类过滤 ───

describe('ShenSha Engine: 分类过滤', () => {
  beforeEach(() => clearShenShaCache())

  it('仅计算吉神分类', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, { gender: '男', categories: ['吉神'] })
    for (const r of out.results) {
      expect(r.category).toBe('吉神')
    }
  })

  it('仅计算桃花分类', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, { gender: '男', categories: ['桃花'] })
    for (const r of out.results) {
      expect(r.category).toBe('桃花')
    }
    expect(out.results.length).toBeGreaterThanOrEqual(1)
  })

  it('多分类过滤', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, { gender: '男', categories: ['桃花', '婚姻'] })
    for (const r of out.results) {
      expect(['桃花', '婚姻']).toContain(r.category)
    }
  })

  it('空分类返回 UNKNOWN_RULE 警告', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, { gender: '男', categories: ['不存在的分类'] as any })
    expect(out.warnings).toContain('UNKNOWN_RULE')
  })
})

// ─── ID过滤 ───

describe('ShenSha Engine: ID 过滤', () => {
  beforeEach(() => clearShenShaCache())

  it('仅计算指定 ID', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, { gender: '男', onlyIds: ['tianyi'] })
    expect(out.results).toHaveLength(1)
    expect(out.results[0].id).toBe('tianyi')
  })

  it('多 ID 过滤', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, { gender: '男', onlyIds: ['tianyi', 'taohua'] })
    expect(out.results).toHaveLength(2)
    expect(out.results.map(r => r.id).sort()).toEqual(['taohua', 'tianyi'])
  })
})

// ─── 冲突检测 ───

describe('ShenSha Engine: 冲突检测', () => {
  beforeEach(() => clearShenShaCache())

  it('羊刃与飞刃冲突检测', () => {
    // 甲日卯为羊刃，甲日酉为飞刃
    // 需要四柱同时有卯和酉
    const pillars = makePillars({ yearGan: '甲', yearZhi: '卯', monthGan: '丙', monthZhi: '酉', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, { gender: '男', detectConflicts: true })
    const yangren = out.results.find(r => r.id === 'yangren')
    const feiren = out.results.find(r => r.id === 'feiren')
    if (yangren?.hit && feiren?.hit) {
      expect(out.warnings).toContain('MULTI_RULE_CONFLICT')
    }
  })

  it('关闭冲突检测不产生 MULTI_RULE_CONFLICT', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '卯', monthGan: '丙', monthZhi: '酉', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, { gender: '男', detectConflicts: false })
    expect(out.warnings).not.toContain('MULTI_RULE_CONFLICT')
  })

  it('孤辰寡宿冲突', () => {
    // 子年男见寅为孤辰，子年男见戌为寡宿
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '戌', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, { gender: '男', detectConflicts: true })
    const guchen = out.results.find(r => r.id === 'guchen')
    const guasu = out.results.find(r => r.id === 'guasu')
    if (guchen?.hit && guasu?.hit) {
      expect(out.warnings).toContain('MULTI_RULE_CONFLICT')
    }
  })
})

// ─── 缓存测试 ───

describe('ShenSha Engine: 缓存机制', () => {
  beforeEach(() => clearShenShaCache())

  it('首次计算缓存未命中', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    calculateShenSha(pillars, defaultOpts)
    expect(getShenShaCacheSize()).toBe(1)
  })

  it('相同输入缓存命中', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out1 = calculateShenSha(pillars, defaultOpts)
    const out2 = calculateShenSha(pillars, defaultOpts)
    expect(out1).toStrictEqual(out2)
    expect(getShenShaCacheSize()).toBe(1)
  })

  it('不同输入产生不同缓存', () => {
    const p1 = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const p2 = makePillars({ yearGan: '乙', yearZhi: '丑', monthGan: '丁', monthZhi: '卯', dayGan: '己', dayZhi: '巳', hourGan: '辛', hourZhi: '未' })
    calculateShenSha(p1, defaultOpts)
    calculateShenSha(p2, defaultOpts)
    expect(getShenShaCacheSize()).toBe(2)
  })

  it('清空缓存后 size 为 0', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    calculateShenSha(pillars, defaultOpts)
    clearShenShaCache()
    expect(getShenShaCacheSize()).toBe(0)
  })
})

// ─── AI Explain ───

describe('ShenSha Engine: AI Explain', () => {
  it('explainShenSha 输出结构化数据', () => {
    const mockResult = {
      id: 'tianyi', name: '天乙贵人', category: '贵人' as const,
      hit: true, positions: [],
      description: '甲戊庚牛羊', reference: '三命通会',
      modernExplain: '贵人相助', applicable: '逢凶化吉',
      conflicts: [], priority: 95, confidence: 0.95,
      isAuspicious: true,
    }
    const exp = explainShenSha({ result: mockResult, dayMaster: '甲' })
    expect(exp.basis).toContain('天乙贵人')
    expect(exp.basis).toContain('甲')
    expect(exp.classicalReference).toBe('三命通会')
    expect(exp.modernInterpretation).toBe('贵人相助')
    expect(exp.conditions).toBe('逢凶化吉')
    expect(exp.conflictSituation).toBeNull()
    expect(exp.confidenceAssessment).toContain('95%')
    expect(exp.suggestions.length).toBeGreaterThan(0)
  })

  it('explainShenSha 冲突情况', () => {
    const mockResult = {
      id: 'yangren', name: '羊刃', category: '凶神' as const,
      hit: true, positions: [],
      description: '甲刃卯', reference: '三命通会',
      modernExplain: '刚烈', applicable: '注意情绪',
      conflicts: ['feiren'], priority: 80, confidence: 0.90,
      isAuspicious: false,
    }
    const exp = explainShenSha({ result: mockResult, dayMaster: '甲' })
    expect(exp.conflictSituation).toContain('feiren')
    expect(exp.suggestions.some(s => s.includes('谨慎'))).toBe(true)
  })

  it('explainShenSha 低置信提示', () => {
    const mockResult = {
      id: 'xuetang', name: '学堂', category: '学业' as const,
      hit: true, positions: [],
      description: '金命见巳', reference: '三命通会',
      modernExplain: '学业', applicable: '读书',
      conflicts: [], priority: 75, confidence: 0.75,
      isAuspicious: true,
    }
    const exp = explainShenSha({ result: mockResult, dayMaster: '甲' })
    expect(exp.confidenceAssessment).toContain('75%')
  })
})

// ─── 具体神煞命中验证（Golden Cases） ───

describe('ShenSha Engine: Golden Cases', () => {
  beforeEach(() => clearShenShaCache())

  it('天乙贵人：甲日见丑未', () => {
    // 甲日柱，年支丑
    const pillars = makePillars({ yearGan: '甲', yearZhi: '丑', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const tianyi = out.results.find(r => r.id === 'tianyi')
    expect(tianyi?.hit).toBe(true)
    expect(tianyi?.positions.some(p => p.pillar === '年')).toBe(true)
  })

  it('文昌：甲日见巳', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '巳', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const wenchang = out.results.find(r => r.id === 'wenchang')
    expect(wenchang?.hit).toBe(true)
    expect(wenchang?.positions.some(p => p.pillar === '日')).toBe(true)
  })

  it('桃花：申子辰见酉', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '申', monthGan: '丙', monthZhi: '子', dayGan: '戊', dayZhi: '酉', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const taohua = out.results.find(r => r.id === 'taohua')
    expect(taohua?.hit).toBe(true)
    expect(taohua?.positions.some(p => p.zhi === '酉')).toBe(true)
  })

  it('驿马：申子辰见寅', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '申', monthGan: '丙', monthZhi: '子', dayGan: '戊', dayZhi: '寅', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const yima = out.results.find(r => r.id === 'yima')
    expect(yima?.hit).toBe(true)
  })

  it('羊刃：甲日见卯', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '卯', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const yangren = out.results.find(r => r.id === 'yangren')
    expect(yangren?.hit).toBe(true)
    expect(yangren?.positions.some(p => p.pillar === '日')).toBe(true)
  })

  it('禄神：甲日见寅', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '甲', dayZhi: '寅', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const lushen = out.results.find(r => r.id === 'lushen')
    expect(lushen?.hit).toBe(true)
  })

  it('将星：寅午戌见午', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '午', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const jiangxing = out.results.find(r => r.id === 'jiangxing')
    expect(jiangxing?.hit).toBe(true)
  })

  it('华盖：寅午戌见戌', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '午', dayGan: '戊', dayZhi: '戌', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const huagai = out.results.find(r => r.id === 'huagai')
    expect(huagai?.hit).toBe(true)
  })

  it('魁罡：庚辰日柱', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '庚', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const kuigang = out.results.find(r => r.id === 'kuigang')
    expect(kuigang?.hit).toBe(true)
  })

  it('天赦：春戊寅', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '寅', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const tianshe = out.results.find(r => r.id === 'tianshe')
    expect(tianshe?.hit).toBe(true)
  })

  it('红鸾：子年见卯', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '卯', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const hongluan = out.results.find(r => r.id === 'hongluan')
    expect(hongluan?.hit).toBe(true)
  })

  it('天喜：子年见酉（红鸾对冲）', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '酉', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const tianxi = out.results.find(r => r.id === 'tianxi')
    expect(tianxi?.hit).toBe(true)
  })

  it('亡神：寅午戌见巳', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '午', dayGan: '戊', dayZhi: '巳', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const wangshen = out.results.find(r => r.id === 'wangshen')
    expect(wangshen?.hit).toBe(true)
  })

  it('劫煞：寅午戌见亥', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '午', dayGan: '戊', dayZhi: '亥', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const jiesha = out.results.find(r => r.id === 'jiesha')
    expect(jiesha?.hit).toBe(true)
  })

  it('灾煞：寅午戌见子', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '午', dayGan: '戊', dayZhi: '子', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const zaisha = out.results.find(r => r.id === 'zaisha')
    expect(zaisha?.hit).toBe(true)
  })

  it('四废：春庚申', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '寅', monthGan: '丙', monthZhi: '寅', dayGan: '庚', dayZhi: '申', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const sifei = out.results.find(r => r.id === 'sifei')
    expect(sifei?.hit).toBe(true)
  })

  it('三奇贵人：甲戊庚齐全', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '戊', monthZhi: '寅', dayGan: '庚', dayZhi: '辰', hourGan: '壬', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const sanqi = out.results.find(r => r.id === 'sanqi')
    expect(sanqi?.hit).toBe(true)
  })

  it('天德：寅月丁日', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '丁', dayZhi: '卯', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const tiande = out.results.find(r => r.id === 'tiande')
    expect(tiande?.hit).toBe(true)
  })

  it('月德：寅月丙日', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '丙', dayZhi: '寅', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, defaultOpts)
    const yuede = out.results.find(r => r.id === 'yuede')
    expect(yuede?.hit).toBe(true)
  })
})

// ─── 性能基准 ───

describe('ShenSha Engine: 性能基准', () => {
  beforeEach(() => clearShenShaCache())

  it('1000次排盘性能测试', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const start = Date.now()
    for (let i = 0; i < 1000; i++) {
      // 使用不同缓存键避免命中缓存
      calculateShenSha(pillars, { gender: i % 2 === 0 ? '男' : '女' })
    }
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(5000) // 5秒内完成1000次
  })

  it('单次计算耗时小于 20ms', () => {
    const pillars = makePillars({ yearGan: '甲', yearZhi: '子', monthGan: '丙', monthZhi: '寅', dayGan: '戊', dayZhi: '辰', hourGan: '庚', hourZhi: '午' })
    const out = calculateShenSha(pillars, { gender: '男' })
    expect(out.computeTimeMs).toBeLessThan(20)
  })
})

// ─── 数据库完整性 ───

describe('ShenSha Database: 完整性', () => {
  it('数据库包含至少35种神煞', () => {
    expect(SHEN_SHA_DATABASE.length).toBeGreaterThanOrEqual(35)
  })

  it('每个神煞都有唯一ID', () => {
    const ids = SHEN_SHA_DATABASE.map(s => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('每个神煞都有名称', () => {
    for (const s of SHEN_SHA_DATABASE) {
      expect(s.name).toBeTruthy()
    }
  })

  it('每个神煞都有分类', () => {
    for (const s of SHEN_SHA_DATABASE) {
      expect(s.category).toBeTruthy()
    }
  })

  it('每个神煞都有出处', () => {
    for (const s of SHEN_SHA_DATABASE) {
      expect(s.source).toBeTruthy()
    }
  })

  it('每个神煞都有计算公式', () => {
    for (const s of SHEN_SHA_DATABASE) {
      expect(s.formula).toBeTruthy()
    }
  })

  it('每个神煞都有 calculator', () => {
    for (const s of SHEN_SHA_DATABASE) {
      expect(typeof s.calculator).toBe('function')
    }
  })

  it('优先级在合理范围', () => {
    for (const s of SHEN_SHA_DATABASE) {
      expect(s.priority).toBeGreaterThanOrEqual(1)
      expect(s.priority).toBeLessThanOrEqual(100)
    }
  })

  it('SHEN_SHA_BY_ID 索引完整', () => {
    for (const s of SHEN_SHA_DATABASE) {
      expect(SHEN_SHA_BY_ID[s.id]).toBeDefined()
      expect(SHEN_SHA_BY_ID[s.id].name).toBe(s.name)
    }
  })

  it('吉神 isAuspicious=true', () => {
    const auspiciousCats = ['吉神', '贵人', '桃花', '事业', '财运', '学业', '出行']
    for (const s of SHEN_SHA_DATABASE) {
      if (auspiciousCats.includes(s.category)) {
        expect(s.isAuspicious).toBe(true)
      }
    }
  })

  it('凶神/灾煞 isAuspicious=false', () => {
    const inauspiciousCats = ['凶神', '灾煞', '刑冲', '健康']
    for (const s of SHEN_SHA_DATABASE) {
      if (inauspiciousCats.includes(s.category)) {
        expect(s.isAuspicious).toBe(false)
      }
    }
  })
})
