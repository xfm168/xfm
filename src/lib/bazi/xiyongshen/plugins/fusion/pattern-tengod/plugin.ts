/**
 * P1.2.2 — 格局×十神 Fusion Plugin
 *
 * 严格遵守：
 * - Plugin 生命周期：initialize → evaluate → explain → destroy
 * - 不修改 Pattern / TenGod 内部业务（只读）
 * - 只做 Evidence 融合与权重计算，输出 SubEngineResult 供 Unified Decision Core V3
 */
import { DivinationPluginImpl, DivinationPluginConfig } from '../../../../foundation/core/plugin/types'
import { globalCapabilityRegistry } from '../../../../foundation/core/plugin/capability'

import type { SubEngineInput, SubEngineResult } from '../../../../engines/types'
import type { ClassifierInput as PatternClassifierInput } from '../../pattern/types'
import type { TenGodClassifierInput } from '../../tengod/types'

import { defaultPatternTenGodFusionEngine, PatternTenGodFusionEngine } from './fusionEngine'
import { defaultPatternTenGodFusionExplain, PatternTenGodFusionExplain } from './explain'
import { classifyPriorityMatrix, resolvePatternTenGodConflict, mergeEvidence } from './'

// Plugin 内部使用 singleton，外部可 new
let _patternCls: any = null
let _tengodCls: any = null
let _patternEngine: any = null
let _tengodPluginSingleton: any = null
let _patternPluginSingleton: any = null

function ensurePatternModules() {
  if (_patternCls) return true
  try {
    const pattern = require('../../pattern')
    _patternCls = pattern.PatternClassifier
    _patternEngine = pattern.AdvancedPatternEngine
    if (pattern.defaultBaziPatternPlugin) _patternPluginSingleton = pattern.defaultBaziPatternPlugin
    return true
  } catch (_) {
    return false
  }
}

function ensureTenGodModules() {
  if (_tengodCls) return true
  try {
    const tg = require('../../tengod')
    _tengodCls = tg.defaultTenGodClassifier
    if (tg.defaultTenGodPlugin) _tengodPluginSingleton = tg.defaultTenGodPlugin
    return true
  } catch (_) {
    return false
  }
}

export interface FusionPluginEvaluateInput extends SubEngineInput {
  tengodInput?: TenGodClassifierInput
  patternInput?: PatternClassifierInput
  prePatternResult?: SubEngineResult
  prePatternClassify?: any
  preTenGodResult?: any
  preTenGodClassify?: any
  /** 若上层已初始化过 Pattern/TenGod 插件，可直接传入，避免重复初始化 */
  patternPlugin?: any
  tengodPlugin?: any
}

export class PatternTenGodFusionPlugin extends DivinationPluginImpl {
  readonly id = 'bazi-pattern-tengod-fusion'
  readonly name = '八字·格局×十神 融合决策层 P1.2.2'
  readonly version = '1.0.0'
  readonly buildNumber = '1.0.0'
  readonly type = 'bazi-extension'
  readonly description = '玄风门格局插件 + 十神插件 融合决策层：证据融合、联合权重、冲突解决、增强UDC决策（输出SubEngineResult）'
  readonly dependencies = ['bazi', 'bazi-pattern', 'bazi-tengod']

  readonly divinationConfig: DivinationPluginConfig = {
    divinationType: 'bazi',
    divinationName: '格局×十神 Fusion',
    divinationDescription: 'Pattern + TenGod Evidence Fusion / Priority / Conflict Resolver / SubEngineResult for UDC',
    supportsFeatures: [
      'Evidence融合（Pattern+TenGod 不丢源）',
      '格局×十神联合优先级矩阵（七杀/伤官/财/印 12 模式）',
      '冲突解决报告（来源/双方证据/采信理由/最终权重）',
      '白话解释 4 要素（格局/十神/融合/古籍）',
      'SubEngineResult 统一输出，接 Unified Decision Core V3',
      '单次融合 <10ms，批量无明显退化',
    ],
    icon: '⚖️',
  }

  private _patternCls: any = null
  private _patternEngineInst: any = null
  private _patternEngineClass: any = null
  private _tengodCls: any = null
  private _tengodPlugin: any = null
  private _patternPlugin: any = null
  private _initialized = false
  public engine: PatternTenGodFusionEngine = defaultPatternTenGodFusionEngine
  public explainBuilder: PatternTenGodFusionExplain = defaultPatternTenGodFusionExplain

  async initialize(): Promise<void> {
    await super.initialize()
    const hasPattern = ensurePatternModules()
    const hasTenGod = ensureTenGodModules()
    if (hasPattern) {
      try {
        this._patternCls = _patternCls ? new _patternCls() : null
        this._patternEngineClass = _patternEngine
        this._patternEngineInst = _patternEngine ? new _patternEngine() : null
        if (_patternPluginSingleton) {
          this._patternPlugin = _patternPluginSingleton
          if (typeof this._patternPlugin.initialize === 'function' && this._patternPlugin.state !== 'initialized' && this._patternPlugin.state !== 'enabled') {
            await this._patternPlugin.initialize().catch(() => {})
          }
        }
      } catch (e) { /* no-op */ }
    }
    if (hasTenGod) {
      try {
        this._tengodCls = _tengodCls
        if (_tengodPluginSingleton) {
          this._tengodPlugin = _tengodPluginSingleton
          if (typeof this._tengodPlugin.initialize === 'function' && this._tengodPlugin.state !== 'initialized' && this._tengodPlugin.state !== 'enabled') {
            await this._tengodPlugin.initialize().catch(() => {})
          }
        }
      } catch (e) { /* no-op */ }
    }
    globalCapabilityRegistry.register({
      pluginId: this.id,
      capabilities: ['bazi', 'fusion', 'decision', 'explain', 'pattern-tengod-fusion'],
      details: {
        fusion: { description: 'Pattern+TenGod Evidence Merge + Priority + Conflict Resolver' },
        decision: { description: '输出 SubEngineResult 给 Unified Decision Core' },
        'pattern-tengod-fusion': { description: '四大格×十神状态 12 模式矩阵' },
      } as any,
    })
    this._initialized = true
  }

  async destroy(): Promise<void> {
    globalCapabilityRegistry.unregister(this.id)
    this._patternCls = null
    this._patternEngineInst = null
    this._patternEngineClass = null
    this._tengodCls = null
    this._initialized = false
    await super.destroy()
  }

  /**
   * 对外 evaluate：调用 Pattern 与 TenGod（若未 pre 提供），然后走 Fusion Engine 流水线。
   */
  evaluate(input: FusionPluginEvaluateInput): ReturnType<PatternTenGodFusionEngine['evaluate']> | { error: string; skipped: boolean } {
    if (!this._initialized) {
      return { skipped: true, error: 'PatternTenGodFusionPlugin 未初始化，请先 initialize()' }
    }
    // 1) Pattern SubEngineResult
    let patternResult: SubEngineResult = input.prePatternResult as any
    let patternClassify = input.prePatternClassify
    if (!patternResult) {
      const pe = this._patternEngineInst || (this._patternEngineClass ? new this._patternEngineClass() : null)
      if (pe && typeof pe.evaluate === 'function') {
        patternResult = pe.evaluate(input)
      } else {
        patternResult = this._dummyPatternResult(input)
      }
    }
    if (!patternClassify && this._patternCls && typeof this._patternCls.classify === 'function') {
      try {
        patternClassify = this._patternCls.classify(input)
      } catch (_) { patternClassify = undefined }
    }
    // 2) TenGod EngineResult
    let tengodResult = input.preTenGodResult
    let tengodClassify = input.preTenGodClassify
    const tgInput: TenGodClassifierInput = input.tengodInput || this._subEngineToTenGod(input)
    if (!tengodClassify && this._tengodCls && typeof this._tengodCls.classify === 'function') {
      try {
        tengodClassify = this._tengodCls.classify(tgInput)
      } catch (_) { tengodClassify = undefined }
    }
    if (!tengodResult && this._tengodPlugin && typeof this._tengodPlugin.evaluate === 'function') {
      try {
        tengodResult = this._tengodPlugin.evaluate(tgInput)
      } catch (_) { tengodResult = undefined }
    }
    if (!tengodResult) {
      tengodResult = this._dummyTenGodResult(input, tgInput, tengodClassify)
    }
    // 3) Fusion Engine
    return this.engine.evaluate({
      input,
      patternResult,
      tengodResult,
      patternClassify,
      tengodClassify,
    })
  }

  explain(args: { decision?: any; sections?: any; evidence?: any }): ReturnType<PatternTenGodFusionExplain['build']> {
    return this.explainBuilder.build(args)
  }

  /** 直接读取底层优先级矩阵（供测试/调试） */
  priority(args: any) { return classifyPriorityMatrix(args as any) }
  /** 直接读取冲突解决器（供测试/调试） */
  conflict(args: any) { return resolvePatternTenGodConflict(args as any) }
  /** 直接读取证据合并（供测试/调试） */
  merge(p: any, t: any, opts?: any) { return mergeEvidence(p, t, opts) }

  // -------- internals --------

  private _subEngineToTenGod(input: SubEngineInput): TenGodClassifierInput {
    return {
      dayGan: input.dayGan,
      monthZhi: input.monthZhi,
      fourPillars: input.fourPillars.map(p => ({
        gan: p.gan, zhi: p.zhi, ganWx: p.ganWx, zhiWx: p.zhiWx,
      })),
      dayGanWuxing: input.dayGanWuxing,
      monthZhiWuxing: input.monthZhiWuxing,
      dayStrength: input.dayStrength,
      dayRootCount: input.dayRootCount,
      isWinterBorn: input.isWinterBorn,
      isSummerBorn: input.isSummerBorn,
    }
  }

  private _dummyPatternResult(input: SubEngineInput): SubEngineResult {
    return {
      engineName: 'PatternEngineUnavailable',
      applicable: false,
      skipReason: 'Pattern 插件引擎不可用（Fusion 返回占位）',
      scores: { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 },
      evidence: [{ step: 'P0-Pattern不可用', text: '当前 Pattern Engine 不可用，Fusion 层以 TenGod 端为主', satisfied: false }],
      classicEvidence: [],
      confidence: 0.2,
      weight: 0.3,
      summary: 'Pattern 不可用，Fusion 退化为 TenGod 单端决策。',
    }
  }

  private _dummyTenGodResult(input: SubEngineInput, tgInput: TenGodClassifierInput, tgClassify: any): any {
    return {
      engineName: 'TenGodEngineUnavailable' as any,
      weight: 0.3,
      scores: {},
      combinationScores: {},
      overallWangJi: { 喜: [], 忌: [], 闲: [] } as any,
      dominantCombinations: [],
      evidence: [{ step: 'T0-TenGod不可用', text: '当前 TenGod Engine 不可用（Fusion 端占位）', satisfied: false, weight: -0.5 }],
      confidence: 0.2,
      metadata: { combinationVerdicts: (tgClassify?.combinationVerdicts as any) || [] },
    }
  }
}
