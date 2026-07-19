/**
 * H3 Module 1: 基础设施测试（5项增强）
 */
import { describe, it, expect } from 'vitest'
import {
  createChain, createTreeNode,
  CLASSIC_CONFIG,
  ALL_WARNING_CODES,
  getWarningDescription, getWarningLevel,
} from '../index'
import type { AlgorithmVersion, DerivationStep } from '../types'

describe('TraceChain: algorithmVersion + engineVersion', () => {
  it('createChain 默认 engineVersion=1.0.0, algorithmVersion=v1.0-classic', () => {
    const chain = createChain([], 10)
    expect(chain.engineVersion).toBe('1.0.0')
    expect(chain.algorithmVersion).toBe('v1.0-classic')
    expect(chain.warnings).toEqual([])
  })

  it('createChain 支持自定义 engineVersion', () => {
    const chain = createChain([], 10, { engineVersion: '2.0.0' })
    expect(chain.engineVersion).toBe('2.0.0')
  })

  it('createChain 支持自定义 algorithmVersion', () => {
    const chain = createChain([], 10, { algorithmVersion: 'v2.0-modern' })
    expect(chain.algorithmVersion).toBe('v2.0-modern')
  })

  it('DerivationStep 支持 algorithmVersion 和 source', () => {
    const step: DerivationStep = {
      id: 'test', name: 'test',
      input: {}, output: {},
      confidence: 0.9,
      algorithmVersion: 'v1.0-classic',
      source: '三命通会',
      timestamp: Date.now(),
    }
    expect(step.algorithmVersion).toBe('v1.0-classic')
    expect(step.source).toBe('三命通会')
  })
})

describe('TraceChain: source 字段', () => {
  it('source 支持经典文献', () => {
    const step: DerivationStep = {
      id: 'test', name: 'test',
      input: {}, output: {},
      confidence: 0.95,
      source: '渊海子平',
      timestamp: Date.now(),
    }
    expect(step.source).toBe('渊海子平')
  })

  it('source 支持现代算法', () => {
    const step: DerivationStep = {
      id: 'test', name: 'test',
      input: {}, output: {},
      confidence: 0.85,
      source: 'Modern Rule',
      timestamp: Date.now(),
    }
    expect(step.source).toBe('Modern Rule')
  })
})

describe('TraceChain: warnings 自动汇总', () => {
  it('createChain 收集 step 中的 warnings', () => {
    const step1: DerivationStep = {
      id: 's1', name: 's1', input: {}, output: {},
      confidence: 0.9, warnings: ['TIMEZONE_MISSING'], timestamp: Date.now(),
    }
    const step2: DerivationStep = {
      id: 's2', name: 's2', input: {}, output: {},
      confidence: 0.9, warnings: ['DST_WARNING', 'CHILD_HOUR_BOUNDARY'], timestamp: Date.now(),
    }
    const chain = createChain([step1, step2], 10)
    expect(chain.warnings).toEqual(['TIMEZONE_MISSING', 'DST_WARNING', 'CHILD_HOUR_BOUNDARY'])
  })

  it('createChain 合并 options.warnings 和 step.warnings', () => {
    const step: DerivationStep = {
      id: 's', name: 's', input: {}, output: {},
      confidence: 0.9, warnings: ['LOW_CONFIDENCE'], timestamp: Date.now(),
    }
    const chain = createChain([step], 10, { warnings: ['CACHE_MISS'] })
    expect(chain.warnings).toEqual(['CACHE_MISS', 'LOW_CONFIDENCE'])
  })
})

describe('TraceChain: 树状结构 (children)', () => {
  it('DerivationStep 支持 children 子步骤', () => {
    const child: DerivationStep = {
      id: 'timezone', name: '时区处理',
      input: { tz: 'Asia/Shanghai' }, output: { offset: 8 },
      confidence: 0.95, timestamp: Date.now(),
    }
    const step: DerivationStep = {
      id: 'solar-time', name: '真太阳时',
      input: { birth: '1990-01-01T10:00' }, output: { adjusted: true },
      confidence: 0.90,
      children: [child],
      timestamp: Date.now(),
    }
    expect(step.children).toHaveLength(1)
    expect(step.children![0].id).toBe('timezone')
  })

  it('createTreeNode 工厂函数', () => {
    const node = createTreeNode({
      id: 'test', name: 'test',
      input: { a: 1 }, output: { b: 2 },
      confidence: 0.88,
    })
    expect(node.id).toBe('test')
    expect(node.timestamp).toBeGreaterThan(0)
  })
})

describe('WarningCode 标准化', () => {
  it('ALL_WARNING_CODES 列表完整', () => {
    expect(ALL_WARNING_CODES.length).toBeGreaterThanOrEqual(20)
  })

  it('每个 WarningCode 都有描述', () => {
    for (const code of ALL_WARNING_CODES) {
      const desc = getWarningDescription(code)
      expect(desc).toBeTruthy()
      expect(desc.length).toBeGreaterThan(0)
    }
  })

  it('每个 WarningCode 都有严重级别', () => {
    for (const code of ALL_WARNING_CODES) {
      const level = getWarningLevel(code)
      expect(['info', 'warn', 'error']).toContain(level)
    }
  })

  it('DST_WARNING 为 warn 级别', () => {
    expect(getWarningLevel('DST_WARNING')).toBe('warn')
  })

  it('UNSUPPORTED_YEAR 为 error 级别', () => {
    expect(getWarningLevel('UNSUPPORTED_YEAR')).toBe('error')
  })

  it('TIMEZONE_MISSING 为 info 级别', () => {
    expect(getWarningLevel('TIMEZONE_MISSING')).toBe('info')
  })
})

describe('ProfessionalConfig', () => {
  it('CLASSIC_CONFIG 结构完整', () => {
    expect(CLASSIC_CONFIG.algorithmVersion).toBe('v1.0-classic')
    expect(CLASSIC_CONFIG.defaultSource).toBe('三命通会')
    expect(CLASSIC_CONFIG.mingGong.id).toBe('minggong')
    expect(CLASSIC_CONFIG.shenGong.id).toBe('shengong')
    expect(CLASSIC_CONFIG.taiYuan.id).toBe('taiyuan')
    expect(CLASSIC_CONFIG.taiXi.id).toBe('taixi')
    expect(CLASSIC_CONFIG.hiddenStem.id).toBe('hidden-stem')
    expect(CLASSIC_CONFIG.kongWang.id).toBe('kongwang')
    expect(CLASSIC_CONFIG.changSheng.id).toBe('changsheng')
  })

  it('藏干权重默认 0.6/0.3/0.1', () => {
    const hs = CLASSIC_CONFIG.hiddenStem
    expect(hs.benWeight).toBe(0.6)
    expect(hs.zhongWeight).toBe(0.3)
    expect(hs.yaoWeight).toBe(0.1)
  })

  it('命宫五虎遁默认值', () => {
    expect(CLASSIC_CONFIG.mingGong.yangStartGanIdx).toBe(2)
    expect(CLASSIC_CONFIG.mingGong.yinStartGanIdx).toBe(8)
  })

  it('胎元偏移默认值', () => {
    expect(CLASSIC_CONFIG.taiYuan.ganOffset).toBe(1)
    expect(CLASSIC_CONFIG.taiYuan.zhiOffset).toBe(3)
  })

  it('每个规则都有 source', () => {
    const rules = [
      CLASSIC_CONFIG.mingGong, CLASSIC_CONFIG.shenGong,
      CLASSIC_CONFIG.taiYuan, CLASSIC_CONFIG.taiXi,
      CLASSIC_CONFIG.hiddenStem, CLASSIC_CONFIG.kongWang,
      CLASSIC_CONFIG.changSheng,
    ]
    for (const rule of rules) {
      expect(rule.source).toBeTruthy()
      expect(rule.algorithmVersion).toBeTruthy()
      expect(rule.enabled).toBe(true)
    }
  })
})
