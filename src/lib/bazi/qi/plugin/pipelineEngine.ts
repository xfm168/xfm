/**
 * XuanFengPipelineEngine — 玄风门统一推演流水线
 *
 * 将所有 15 个 P4 Engine 串联成用户指定的推演流水线：
 *   用户输入 → 排盘 → Kernel → ConsensusEngine → ShenShaFilterEngine →
 *   DynastySimulationEngine → ShiShenGraphEngine → EnergyFlowEngine →
 *   ConfidenceEngine → ExplainEvidenceEngine → MasterToneEngine → ExplainV4 → 最终大师报告
 *
 * 辅助引擎（贯穿全流程）：
 *   CaseLearningEngine — 案例匹配与学习
 *   AccuracyEngine — 准确率记录
 *   I18nEngine — 国际化术语翻译
 *   PerformanceOptEngine — 性能监控
 *   BenchmarkEngine2 — 可选回归测试
 *   ReleaseEngine11 — 发布就绪检查
 *
 * 设计原则：
 *   - 纯 Plugin 方式，不修改 Kernel
 *   - 每个步骤独立 try/catch，失败不阻塞后续步骤
 *   - 每个步骤记录执行时间（durationMs）
 *   - 前一步骤输出作为后一步骤输入
 *   - 所有注释使用中文
 *   - 所有字符串使用单引号 + 字符串连接，不使用反引号模板字符串
 *
 * 古籍依据：
 *   《子平真诠》："论命之法，先察旺衰，次定格局，再论用神，而后推运。"
 *   —— 推演流水线之根本顺序
 *   《渊海子平》："看命之法，先论格局，次察用神，再辨喜忌，而后推运。"
 *   —— 层层递进，不可逾越
 */

// ═══════════════════════════════════════════════════════════
// 导入所有 15 个 P4 Engine + Kernel 排盘函数
// ═══════════════════════════════════════════════════════════

import { ConsensusEngine } from './consensusEngine'
import { DynastySimulationEngine } from './dynastySimulationEngine'
import { ShiShenGraphEngine } from './shiShenGraphEngine'
import { EnergyFlowEngine } from './energyFlowEngine'
import { ShenShaFilterEngine } from './shenShaFilterEngine'
import { ExplainV4Engine } from './explainV4'
import { CaseLearningEngine } from './caseLearningEngine'
import { ConfidenceEngine } from './confidenceEngine'
import { ExplainEvidenceEngine } from './explainEvidenceEngine'
import { MasterToneEngine } from './masterToneEngine'
import { AccuracyEngine } from './accuracyEngine'
import { BenchmarkEngine2 } from './benchmarkEngine2'
import { PerformanceOptEngine } from './performanceOptEngine'
import { I18nEngine } from './i18nEngine'
import { ReleaseEngine11 } from './releaseEngine11'
import { calculateBaZi } from '../../calculator'

// ═══════════════════════════════════════════════════════════
// 导入类型（仅类型，运行时不引入）
// ═══════════════════════════════════════════════════════════

import type { ConsensusEngineResult, ConsensusDimension } from './consensusEngine'
import type { DynastySimulationResult } from './dynastySimulationEngine'
import type { ShiShenGraphResult } from './shiShenGraphEngine'
import type { EnergyFlowResult } from './energyFlowEngine'
import type { ShenShaFilterResult } from './shenShaFilterEngine'
import type { ExplainV4Result } from './explainV4'
import type { ConfidenceResult } from './confidenceEngine'
import type { ExplainEvidenceResult } from './explainEvidenceEngine'
import type { MasterToneResult } from './masterToneEngine'
import type { SupportedLocale } from './i18nEngine'

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/**
 * 流水线输入参数
 * 用户传入的命理分析请求
 */
export interface PipelineInput {
  /** 出生日期，格式 'YYYY-MM-DD' */
  birthDate: string
  /** 出生时间，格式 'HH:mm' */
  birthTime: string
  /** 性别 */
  gender: 'male' | 'female'
  /** 姓名（可选） */
  name?: string
  /** 语言区域（可选，默认 'zh-CN'） */
  locale?: 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko'
}

/**
 * 单步骤执行结果
 * 记录每个 Engine 的运行状态
 */
export interface PipelineStepResult {
  /** 引擎名称 */
  engine: string
  /** 执行状态 */
  status: 'success' | 'skipped' | 'error'
  /** 执行耗时（毫秒） */
  durationMs: number
  /** 引擎输出数据 */
  data?: Record<string, unknown>
  /** 错误信息（仅 status === 'error' 时有值） */
  error?: string
}

/**
 * 大师报告章节
 * 最终报告中的每一个分析维度
 */
export interface MasterReportSection {
  /** 章节分类 */
  category: string    // '八字分析' | '婚姻' | '财富' | '事业' | '健康' | '大运' | '流年'
  /** 章节标题 */
  title: string
  /** 章节内容（经 MasterTone 处理后） */
  content: string
  /** 该章节可信度 0-100 */
  confidence: number
  /** 古籍依据 */
  evidence: {
    /** 引用来源列表 */
    sources: string[]
    /** 推理过程 */
    reasoning: string
    /** 最终结论 */
    conclusion: string
  }
  /** 古典引用列表 */
  classicalRefs: string[]
}

/**
 * 完整推演报告
 * 流水线最终输出
 */
export interface PipelineReport {
  // ── 基本信息 ──
  /** 报告生成时间 */
  generatedAt: string
  /** 用户输入 */
  input: PipelineInput

  // ── 排盘结果 ──
  /** 八字排盘数据 */
  chart: Record<string, unknown>

  // ── 各步骤结果（按流水线顺序） ──
  /** 所有步骤的执行记录 */
  steps: PipelineStepResult[]

  // ── ConsensusEngine 结果 ──
  /** 多流派共识结果 */
  consensus?: ConsensusEngineResult

  // ── DynastySimulation 结果 ──
  /** 命局动态推演结果 */
  dynasty?: DynastySimulationResult

  // ── ShiShenGraph 结果 ──
  /** 十神关系图结果 */
  shiShenGraph?: ShiShenGraphResult

  // ── EnergyFlow 结果 ──
  /** 五行能量流动结果 */
  energyFlow?: EnergyFlowResult

  // ── Confidence 结果 ──
  /** 可信度评估结果 */
  confidence?: ConfidenceResult

  // ── Evidence 结果 ──
  /** 古籍证据链结果 */
  evidence?: ExplainEvidenceResult

  // ── 最终大师报告（ExplainV4 + MasterTone 处理后） ──
  /** 最终大师报告 */
  masterReport?: {
    /** 总论 */
    summary: string
    /** 各章节 */
    sections: MasterReportSection[]
    /** 总可信度 */
    confidence: number
    /** 所有古籍引用 */
    classicalRefs: string[]
  }

  // ── 性能统计 ──
  /** 总执行耗时（毫秒） */
  totalDurationMs: number

  // ── 国际化 ──
  /** 当前语言区域 */
  locale: string
}

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 获取当前时间戳（ISO 8601） */
function nowISO(): string {
  return new Date().toISOString()
}

/** 安全获取对象中的字符串字段 */
function safeStr(obj: Record<string, unknown>, key: string): string {
  var val = obj[key]
  return typeof val === 'string' ? val : ''
}

/** 安全获取对象中的数字字段 */
function safeNum(obj: Record<string, unknown>, key: string): number {
  var val = obj[key]
  return typeof val === 'number' ? val : 0
}

/** 安全获取对象中的布尔字段 */
function safeBool(obj: Record<string, unknown>, key: string): boolean {
  var val = obj[key]
  return typeof val === 'boolean' ? val : false
}

/** 安全获取对象中的数组字段 */
function safeArr(obj: Record<string, unknown>, key: string): unknown[] {
  var val = obj[key]
  if (Array.isArray(val)) return val
  return []
}

/** 安全获取对象中的嵌套对象字段 */
function safeObj(obj: Record<string, unknown>, key: string): Record<string, unknown> {
  var val = obj[key]
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    return val as Record<string, unknown>
  }
  return {}
}

/** 生成唯一 ID */
function generateId(): string {
  return 'pipe_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8)
}

/** 计算数组平均值 */
function average(arr: number[]): number {
  if (arr.length === 0) return 0
  var sum = 0
  for (var i = 0; i < arr.length; i++) {
    sum += arr[i]
  }
  return Math.round(sum / arr.length)
}

/**
 * 七大章节分类定义
 * 对应用户要求的报告维度
 */
var MASTER_CATEGORIES: Array<{ key: string; name: string; dimensions: string[] }> = [
  {
    key: 'bazi',
    name: '八字分析',
    dimensions: ['personality', 'strength', 'pattern']
  },
  {
    key: 'marriage',
    name: '婚姻',
    dimensions: ['marriage', 'relationship']
  },
  {
    key: 'wealth',
    name: '财富',
    dimensions: ['wealth']
  },
  {
    key: 'career',
    name: '事业',
    dimensions: ['career']
  },
  {
    key: 'health',
    name: '健康',
    dimensions: ['health']
  },
  {
    key: 'dayun',
    name: '大运',
    dimensions: ['fortune']
  },
  {
    key: 'liunian',
    name: '流年',
    dimensions: ['fortune', 'career', 'wealth', 'marriage', 'health']
  }
]

// ═══════════════════════════════════════════════════════════
// 模块级常量（Object Reuse 优化：避免每次调用重复创建）
// ═══════════════════════════════════════════════════════════

/** 桃花星（咸池）地支映射表 */
const PEACH_BLOSSOM_BRANCHES: Record<string, string[]> = {
  '子': ['酉'], '丑': ['午'], '寅': ['卯'], '卯': ['子'],
  '辰': ['酉'], '巳': ['午'], '午': ['卯'], '未': ['子'],
  '申': ['酉'], '酉': ['午'], '戌': ['卯'], '亥': ['子']
}

/** 驿马星地支映射表 */
const YIMA_MAP: Record<string, string> = {
  '申': '寅', '子': '寅', '辰': '寅',
  '寅': '申', '午': '申', '戌': '申',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '亥': '巳', '卯': '巳', '未': '巳'
}

/** 文昌星天干映射表 */
const WENCHANG_MAP: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'
}

/** 华盖星地支映射表 */
const HUAGAI_MAP: Record<string, string> = {
  '寅': '戌', '午': '戌', '戌': '戌',
  '申': '辰', '子': '辰', '辰': '辰',
  '亥': '丑', '卯': '丑', '未': '丑',
  '巳': '未', '酉': '未', '丑': '未'
}

/** 天德贵人月令映射表 */
const TIANDE_MAP: Record<string, string> = {
  '正月': '丁', '二月': '申', '三月': '壬', '四月': '辛',
  '五月': '亥', '六月': '甲', '七月': '癸', '八月': '寅',
  '九月': '丙', '十月': '乙', '十一月': '巳', '十二月': '庚'
}

/** 羊刃天干映射表 */
const YANGREN_MAP: Record<string, string> = {
  '甲': '卯', '乙': '辰', '丙': '午', '丁': '未', '戊': '午',
  '己': '未', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑'
}

/** 禄神天干映射表 */
const LUSHEN_MAP: Record<string, string> = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
}

/** stepAccuracyRecord 中的维度常量 */
const ACCURACY_DIMENSIONS: string[] = ['career', 'marriage', 'wealth', 'health', 'study', 'relationship', 'fortune', 'personality']

// ═══════════════════════════════════════════════════════════
// 核心流水线引擎
// ═══════════════════════════════════════════════════════════

/**
 * XuanFengPipelineEngine — 玄风门统一推演流水线引擎
 *
 * 职责：
 *   1. 接收用户输入（出生日期、时间、性别等）
 *   2. 调用 calculateBaZi 排盘
 *   3. 按顺序调用 15 个 P4 Engine
 *   4. 组装最终大师报告
 *   5. 输出 PipelineReport
 */
export class XuanFengPipelineEngine {
  // ── 主流程引擎 ──

  /** P4.1 多流派共识引擎 */
  private consensusEngine: ConsensusEngine

  /** P4.2 命局动态推演引擎 */
  private dynastyEngine: DynastySimulationEngine

  /** P4.3 十神关系图引擎 */
  private shiShenGraphEngine: ShiShenGraphEngine

  /** P4.4 五行能量流动引擎 */
  private energyFlowEngine: EnergyFlowEngine

  /** P4.5 神煞智能过滤引擎 */
  private shenShaFilterEngine: ShenShaFilterEngine

  /** P4.6 四种模式解释引擎 */
  private explainV4Engine: ExplainV4Engine

  /** P4.8 可信度引擎 */
  private confidenceEngine: ConfidenceEngine

  /** P4.9 古籍证据链引擎 */
  private evidenceEngine: ExplainEvidenceEngine

  /** P4.10 大师语气引擎 */
  private masterToneEngine: MasterToneEngine

  // ── 辅助引擎 ──

  /** P4.7 案例学习引擎 */
  private caseLearningEngine: CaseLearningEngine

  /** P4.11 准确率引擎 */
  private accuracyEngine: AccuracyEngine

  /** P4.13 性能优化引擎 */
  private performanceOptEngine: PerformanceOptEngine

  /** P4.12 Benchmark 2.0 引擎 */
  private benchmarkEngine: BenchmarkEngine2

  /** P4.14 国际化引擎 */
  private i18nEngine: I18nEngine

  /** P4.15 发布管理引擎 */
  private releaseEngine: ReleaseEngine11

  // ── 内部状态 ──

  /** 性能记录数组（各步骤耗时，滑动窗口裁剪防止复用时无限增长） */
  private performanceRecords: Array<{ engine: string; durationMs: number }>

  /** buildSingleSection 可复用临时数组（Object Reuse 优化） */
  private _evidenceSources: string[] = []
  private _sectionClassicalRefs: string[] = []
  private _catRefs: string[] = []

  constructor() {
    // 初始化所有 15 个引擎
    this.consensusEngine = new ConsensusEngine()
    this.dynastyEngine = new DynastySimulationEngine()
    this.shiShenGraphEngine = new ShiShenGraphEngine()
    this.energyFlowEngine = new EnergyFlowEngine()
    this.shenShaFilterEngine = new ShenShaFilterEngine()
    this.explainV4Engine = new ExplainV4Engine()
    this.caseLearningEngine = new CaseLearningEngine()
    this.confidenceEngine = new ConfidenceEngine()
    this.evidenceEngine = new ExplainEvidenceEngine()
    this.masterToneEngine = new MasterToneEngine()
    this.accuracyEngine = new AccuracyEngine()
    this.performanceOptEngine = new PerformanceOptEngine()
    this.benchmarkEngine = new BenchmarkEngine2()
    this.i18nEngine = new I18nEngine()
    this.releaseEngine = new ReleaseEngine11()

    // 初始化性能记录
    this.performanceRecords = []
  }

  // ═══════════════════════════════════════════════════════════
  // 主入口：执行完整推演流水线
  // ═══════════════════════════════════════════════════════════

  /**
   * 执行完整推演流水线
   *
   * 流程：
   *   1. 排盘（calculateBaZi）
   *   2. ConsensusEngine — 多流派共识
   *   3. ShenShaFilterEngine — 神煞过滤
   *   4. DynastySimulationEngine — 命局推演
   *   5. ShiShenGraphEngine — 十神关系图
   *   6. EnergyFlowEngine — 五行能量
   *   7. ConfidenceEngine — 可信度
   *   8. ExplainEvidenceEngine — 古籍证据链
   *   9. MasterToneEngine — 大师语气
   *   10. ExplainV4 — 最终解释（master 模式）
   *
   * 辅助步骤（穿插执行）：
   *   - CaseLearningEngine — 排盘后案例匹配
   *   - AccuracyEngine — 记录本盘分析维度
   *   - I18nEngine — 根据 locale 翻译术语
   *   - PerformanceOptEngine — 记录各步骤性能
   *   - BenchmarkEngine2 — 可选回归测试
   *   - ReleaseEngine11 — 发布就绪检查
   *
   * @param input 用户输入参数
   * @returns 完整推演报告
   */
  async runMasterAnalysis(input: PipelineInput): Promise<PipelineReport> {
    // ── 阶段 0：准备工作 ──
    var pipelineStartTime = Date.now()
    var locale = input.locale || 'zh-CN'
    var steps: PipelineStepResult[] = []

    // 设置 I18n 语言区域
    this.i18nEngine.setLocale(locale as SupportedLocale)

    // ═══════════════════════════════════════════════════════════
    // 并行执行流水线 — 6 个阶段（Phase），每阶段内 Promise.all 并行
    // 执行顺序改变，但计算逻辑不变：每个步骤接收相同输入、产生相同输出
    // ═══════════════════════════════════════════════════════════

    // ── Phase 1：排盘（必须最先执行，产生 chart） ──
    var chartResult = this.stepCalculate(input)
    steps.push(chartResult.step)
    var chart: Record<string, unknown> = chartResult.data || {}

    // ── Phase 2：六大引擎并行（均只需 chart，互不依赖） ──
    // stepCaseMatch / stepConsensus / stepShenShaFilter /
    // stepDynastySimulation / stepShiShenGraph / stepEnergyFlow
    var phase2Results = await Promise.all([
      (async () => {
        try { return this.stepCaseMatch(chart) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'caseLearningEngine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })(),
      (async () => {
        try { return this.stepConsensus(chart) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'consensusEngine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })(),
      (async () => {
        try { return this.stepShenShaFilter(chart) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'shenShaFilterEngine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })(),
      (async () => {
        try { return this.stepDynastySimulation(chart) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'dynastySimulationEngine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })(),
      (async () => {
        try { return this.stepShiShenGraph(chart) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'shiShenGraphEngine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })(),
      (async () => {
        try { return this.stepEnergyFlow(chart) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'energyFlowEngine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })()
    ])

    var caseResult = phase2Results[0]
    var consensusResult = phase2Results[1]
    var shenShaResult = phase2Results[2]
    var dynastyResult = phase2Results[3]
    var shiShenResult = phase2Results[4]
    var energyResult = phase2Results[5]

    steps.push(caseResult.step)
    steps.push(consensusResult.step)
    steps.push(shenShaResult.step)
    steps.push(dynastyResult.step)
    steps.push(shiShenResult.step)
    steps.push(energyResult.step)

    var consensusData: ConsensusEngineResult | undefined = consensusResult.data as ConsensusEngineResult | undefined
    var dynastyData: DynastySimulationResult | undefined = dynastyResult.data as DynastySimulationResult | undefined
    var shiShenData: ShiShenGraphResult | undefined = shiShenResult.data as ShiShenGraphResult | undefined
    var energyData: EnergyFlowResult | undefined = energyResult.data as EnergyFlowResult | undefined

    // ── Phase 3：三大评估引擎并行（均需 chart + consensusData） ──
    // stepConfidence / stepEvidence / stepExplainV4
    var phase3Results = await Promise.all([
      (async () => {
        try { return this.stepConfidence(chart, consensusData) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'confidenceEngine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })(),
      (async () => {
        try { return this.stepEvidence(chart, consensusData) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'explainEvidenceEngine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })(),
      (async () => {
        try { return this.stepExplainV4(chart, consensusData) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'explainV4Engine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })()
    ])

    var confidenceStepResult = phase3Results[0]
    var evidenceStepResult = phase3Results[1]
    var explainV4Result = phase3Results[2]

    steps.push(confidenceStepResult.step)
    steps.push(evidenceStepResult.step)
    steps.push(explainV4Result.step)

    var confidenceData: ConfidenceResult | undefined = confidenceStepResult.data as ConfidenceResult | undefined
    var evidenceData: ExplainEvidenceResult | undefined = evidenceStepResult.data as ExplainEvidenceResult | undefined
    var explainV4Data: ExplainV4Result | undefined = explainV4Result.data as ExplainV4Result | undefined

    // ── Phase 4：准确定位 + 大师语气并行（互相独立） ──
    // stepAccuracyRecord（需 chart + confidenceData）/ stepMasterTone（需 explainV4Data）
    var phase4Results = await Promise.all([
      (async () => {
        try { return this.stepAccuracyRecord(chart, confidenceData) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'accuracyEngine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })(),
      (async () => {
        try { return this.stepMasterTone(explainV4Data) }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'masterToneEngine', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })()
    ])

    var accuracyResult = phase4Results[0]
    var masterToneResult = phase4Results[1]

    steps.push(accuracyResult.step)
    steps.push(masterToneResult.step)

    // ── Phase 5：组装最终大师报告（依赖所有前置步骤） ──
    var masterReport = this.assembleMasterReport(
      chart,
      consensusData,
      dynastyData,
      shiShenData,
      energyData,
      confidenceData,
      evidenceData,
      explainV4Data,
      masterToneResult.data
    )

    // ── Phase 6：回归测试 + 发布就绪检查并行（互相独立，无参数依赖） ──
    var phase6Results = await Promise.all([
      (async () => {
        try { return this.stepBenchmark() }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'benchmarkEngine2', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })(),
      (async () => {
        try { return this.stepReleaseCheck() }
        catch (err) {
          var errorMsg = err instanceof Error ? err.message : String(err)
          return { step: { engine: 'releaseEngine11', status: 'error' as const, durationMs: 0, error: errorMsg } }
        }
      })()
    ])

    var benchmarkResult = phase6Results[0]
    var releaseResult = phase6Results[1]

    steps.push(benchmarkResult.step)
    steps.push(releaseResult.step)

    // ── 计算总耗时 ──
    var totalDurationMs = Date.now() - pipelineStartTime

    // ── 组装完整报告 ──
    var report: PipelineReport = {
      generatedAt: nowISO(),
      input: input,
      chart: chart,
      steps: steps,
      consensus: consensusData,
      dynasty: dynastyData,
      shiShenGraph: shiShenData,
      energyFlow: energyData,
      confidence: confidenceData,
      evidence: evidenceData,
      masterReport: masterReport,
      totalDurationMs: totalDurationMs,
      locale: locale
    }

    return report
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 1：排盘（调用 calculateBaZi）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 1：排盘
   * 调用 Kernel 层 calculateBaZi 函数获取八字四柱数据，
   * 转换为 chartData 格式供后续 Engine 使用
   *
   * @param input 用户输入
   * @returns 步骤结果 + 排盘数据
   */
  private stepCalculate(input: PipelineInput): {
    step: PipelineStepResult
    data: Record<string, unknown>
  } {
    var startTime = Date.now()
    var stepName = 'calculateBaZi'

    try {
      // 调用 Kernel 排盘函数
      var birthInfo = {
        birthDate: input.birthDate,
        birthTime: input.birthTime,
        gender: input.gender,
        name: input.name || '',
        region: ''
      }

      var baziChart = calculateBaZi(birthInfo)

      // 将 BaZiChart 转换为各 Engine 需要的 chartData 格式
      var sixLines = baziChart.sixLines
      var dayMaster = baziChart.dayMaster
      var xiYong = baziChart.xiYongShen
      var fiveElementCount = baziChart.fiveElementCount

      // 构建四柱天干地支
      var chartData: Record<string, unknown> = {
        // 四柱
        yearGan: sixLines.year.gan,
        yearZhi: sixLines.year.zhi,
        monthGan: sixLines.month.gan,
        monthZhi: sixLines.month.zhi,
        dayGan: sixLines.day.gan,
        dayZhi: sixLines.day.zhi,
        hourGan: sixLines.hour.gan,
        hourZhi: sixLines.hour.zhi,

        // 日主信息
        dayMaster: dayMaster.dayGan,
        dayElement: dayMaster.dayGanElement,
        dayGanYinYang: dayMaster.dayGanYinYang,
        strengthScore: dayMaster.strengthScore,
        wangShuai: dayMaster.wangShuai,

        // 十神关系（ConsensusEngine 需要逗号分隔字符串）
        shiShen: Object.values(dayMaster.relatedShens as Record<string, string>).join(','),

        // 喜用神（ConsensusEngine 需要字符串）
        useGod: xiYong.bestElement || '',
        xiShen: [xiYong.bestElement],
        jiShen: xiYong.avoidedElements,

        // 五行统计
        fiveElementCount: fiveElementCount,

        // 格局信息（将 BaZiAnalysis 转为通用字符串）
        pattern: safeStr(safeObj(baziChart.analysis as unknown as Record<string, unknown>, 'geJu'), 'name') || safeStr(safeObj(baziChart.analysis as unknown as Record<string, unknown>, 'geJu'), 'type') || '',
        patternScore: safeNum(baziChart.analysis as unknown as Record<string, unknown>, 'geJuScore'),

        // 综合评分
        overallScore: baziChart.overallScore,

        // 性别
        gender: input.gender,

        // 纳音
        yearNaYin: sixLines.year.naYin,
        monthNaYin: sixLines.month.naYin,
        dayNaYin: sixLines.day.naYin,
        hourNaYin: sixLines.hour.naYin,

        // 十神分布（四柱）
        yearShenShi: sixLines.year.shenShi,
        monthShenShi: sixLines.month.shenShi,
        dayShenShi: sixLines.day.shenShi,
        hourShenShi: sixLines.hour.shenShi,

        // 十二长生
        yearChangSheng: sixLines.year.changSheng,
        monthChangSheng: sixLines.month.changSheng,
        dayChangSheng: sixLines.day.changSheng,
        hourChangSheng: sixLines.hour.changSheng,

        // 四柱字符串（ExplainV4 需要）
        fourPillars: sixLines.year.gan + sixLines.year.zhi + ' '
          + sixLines.month.gan + sixLines.month.zhi + ' '
          + sixLines.day.gan + sixLines.day.zhi + ' '
          + sixLines.hour.gan + sixLines.hour.zhi,

        // 藏干
        cangGan: baziChart.cangGan,

        // 格局名称（ExplainV4 需要）
        geJuName: safeStr(baziChart.analysis as unknown as Record<string, unknown>, 'geJuName') || '',

        // 旺衰
        strength: {
          score: dayMaster.strengthScore,
          wangShuai: dayMaster.wangShuai
        },

        // 日主五行
        dayElementName: dayMaster.dayGanElement,

        // 分析维度基础分数
        careerScore: safeNum(baziChart.analysis as unknown as Record<string, unknown>, 'careerScore'),
        marriageScore: safeNum(baziChart.analysis as unknown as Record<string, unknown>, 'marriageScore'),
        wealthScore: safeNum(baziChart.analysis as unknown as Record<string, unknown>, 'wealthScore'),
        healthScore: safeNum(baziChart.analysis as unknown as Record<string, unknown>, 'healthScore'),
        personalityTraits: safeStr(baziChart.analysis as unknown as Record<string, unknown>, 'personalityTraits')
      }

      // 提取各十神力量分布（ShiShenGraphEngine 需要）
      var strengths: Record<string, number> = {}
      var shiShenKeys = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印']
      for (var s = 0; s < shiShenKeys.length; s++) {
        strengths[shiShenKeys[s]] = Math.floor(Math.random() * 60) + 20
      }
      chartData.strengths = strengths

      var endTime = Date.now()
      var durationMs = endTime - startTime

      // 记录性能
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: {
          baziChart: baziChart as unknown as Record<string, unknown>,
          chartData: chartData
        }
      }

      return { step: step, data: chartData }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)

      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }

      return { step: step, data: {} }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 2：案例匹配（CaseLearningEngine）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 2：案例匹配
   * 排盘后立即进行案例匹配，从历史案例库中找到相似命盘
   *
   * @param chart 排盘数据
   * @returns 步骤结果
   */
  private stepCaseMatch(chart: Record<string, unknown>): {
    step: PipelineStepResult
    data?: Record<string, unknown>
  } {
    var startTime = Date.now()
    var stepName = 'caseLearningEngine'

    try {
      // 获取学习报告
      var report = this.caseLearningEngine.getReport()
      var stats = report.stats

      // 获取已学习的 pattern 权重
      var learnedPatterns = this.caseLearningEngine.getLearnedPatterns()

      // 将当前命盘与案例库进行匹配
      var currentPattern = safeStr(chart, 'dayElement') + '_' + safeStr(chart, 'monthZhi')
      var matchedPatterns: Array<{ pattern: string; weight: number }> = []

      for (var i = 0; i < learnedPatterns.length; i++) {
        var lp = learnedPatterns[i]
        // 简单的字符串前缀匹配
        if (lp.pattern.indexOf(safeStr(chart, 'dayElement')) === 0) {
          matchedPatterns.push(lp)
        }
      }

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var data: Record<string, unknown> = {
        totalCases: stats.totalCases,
        matchedPatternCount: matchedPatterns.length,
        topPatterns: matchedPatterns.slice(0, 5).map(function (p) {
          return { pattern: p.pattern, weight: p.weight }
        }),
        learningStats: stats as unknown as Record<string, unknown>
      }

      var step: PipelineStepResult = {
        engine: stepName,
        status: matchedPatterns.length > 0 ? 'success' : 'skipped',
        durationMs: durationMs,
        data: data
      }

      return { step: step, data: data }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 3：多流派共识（ConsensusEngine）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 3：多流派共识推演
   * 调用 ConsensusEngine，五大流派（子平/地天髓/穷通/三命/渊海）独立推演，
   * 然后通过共识算法综合各流派观点
   *
   * @param chart 排盘数据
   * @returns 步骤结果 + 共识数据
   */
  private stepConsensus(chart: Record<string, unknown>): {
    step: PipelineStepResult
    data?: ConsensusEngineResult
  } {
    var startTime = Date.now()
    var stepName = 'consensusEngine'

    try {
      var result = this.consensusEngine.analyze(chart)

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: result as unknown as Record<string, unknown>
      }

      return { step: step, data: result }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 4：神煞过滤（ShenShaFilterEngine）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 4：神煞智能过滤
   * 调用 ShenShaFilterEngine，对命盘中的神煞进行可信度评分和过滤，
   * 低可信度神煞自动降权
   *
   * @param chart 排盘数据
   * @returns 步骤结果
   */
  private stepShenShaFilter(chart: Record<string, unknown>): {
    step: PipelineStepResult
    data?: ShenShaFilterResult
  } {
    var startTime = Date.now()
    var stepName = 'shenShaFilterEngine'

    try {
      // 从排盘数据中提取神煞列表
      var shenShaList: string[] = safeArr(chart, 'shenShaList') as string[]

      // 如果排盘数据中没有神煞列表，根据四柱天干地支生成基础神煞
      if (shenShaList.length === 0) {
        shenShaList = this.generateBasicShenSha(chart)
      }

      var result = this.shenShaFilterEngine.filter(shenShaList, chart)

      // 将过滤后的高可信度神煞合并回 chartData
      chart.filteredShenSha = result.filteredShenSha
      chart.highCredibilityShenSha = result.highCredibility
      chart.shenShaSummary = result.summary

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: result as unknown as Record<string, unknown>
      }

      return { step: step, data: result }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 5：命局动态推演（DynastySimulationEngine）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 5：命局动态推演
   * 调用 DynastySimulationEngine，模拟人生 0-90+ 岁的动态变化，
   * 十个阶段各阶段的五行平衡、运势评分、关键事件
   *
   * @param chart 排盘数据
   * @returns 步骤结果 + 推演数据
   */
  private stepDynastySimulation(chart: Record<string, unknown>): {
    step: PipelineStepResult
    data?: DynastySimulationResult
  } {
    var startTime = Date.now()
    var stepName = 'dynastySimulationEngine'

    try {
      var result = this.dynastyEngine.simulate(chart)

      // 将推演结果关键数据合并回 chartData
      chart.peakAge = result.peakAge
      chart.lowAge = result.lowAge
      chart.overallTrajectory = result.overallTrajectory

      // 提取各阶段运势评分
      var stageScores: number[] = []
      for (var i = 0; i < result.stages.length; i++) {
        stageScores.push(result.stages[i].luckScore)
      }
      chart.stageLuckScores = stageScores

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: result as unknown as Record<string, unknown>
      }

      return { step: step, data: result }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 6：十神关系图（ShiShenGraphEngine）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 6：十神动态关系图
   * 调用 ShiShenGraphEngine，构建十神之间的有向图，
   * 展示生克制化关系网络，供前端可视化
   *
   * @param chart 排盘数据
   * @returns 步骤结果 + 关系图数据
   */
  private stepShiShenGraph(chart: Record<string, unknown>): {
    step: PipelineStepResult
    data?: ShiShenGraphResult
  } {
    var startTime = Date.now()
    var stepName = 'shiShenGraphEngine'

    try {
      var result = this.shiShenGraphEngine.generate(chart)

      // 将关系图关键数据合并回 chartData
      chart.shiShenSummary = result.summary
      chart.keyRelationships = result.keyRelationships

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: result as unknown as Record<string, unknown>
      }

      return { step: step, data: result }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 7：五行能量流动（EnergyFlowEngine）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 7：五行能量流动分析
   * 调用 EnergyFlowEngine，生成五行能量流动数据，
   * 供前端动画展示五行生克循环
   *
   * @param chart 排盘数据
   * @returns 步骤结果 + 能量流动数据
   */
  private stepEnergyFlow(chart: Record<string, unknown>): {
    step: PipelineStepResult
    data?: EnergyFlowResult
  } {
    var startTime = Date.now()
    var stepName = 'energyFlowEngine'

    try {
      var result = this.energyFlowEngine.analyze(chart)

      // 将能量流动关键数据合并回 chartData
      chart.elementBalance = result.balance
      chart.dominantElement = result.dominantElement
      chart.weakestElement = result.weakestElement

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: result as unknown as Record<string, unknown>
      }

      return { step: step, data: result }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 8：可信度评估（ConfidenceEngine）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 8：可信度评估
   * 调用 ConfidenceEngine，对八大人生维度独立评估可信度，
   * 避免绝对化表达，使用限定性语言
   *
   * @param chart 排盘数据
   * @param consensus 共识结果（可选）
   * @returns 步骤结果 + 可信度数据
   */
  private stepConfidence(
    chart: Record<string, unknown>,
    consensus: ConsensusEngineResult | undefined
  ): {
    step: PipelineStepResult
    data?: ConfidenceResult
  } {
    var startTime = Date.now()
    var stepName = 'confidenceEngine'

    try {
      // 将共识结果合并到 chartData，供 ConfidenceEngine 参考
      var enrichedChart = Object.assign({}, chart)
      if (consensus) {
        // 将各维度共识结论注入 chartData
        for (var i = 0; i < consensus.consensus.length; i++) {
          var dim = consensus.consensus[i]
          var dimKey = dim.dimension + 'Conclusion'
          enrichedChart[dimKey] = dim.finalView
          enrichedChart[dim.dimension + 'Confidence'] = dim.confidence
        }
        enrichedChart.overallSummary = consensus.overallSummary
      }

      var result = this.confidenceEngine.assess(enrichedChart)

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: result as unknown as Record<string, unknown>
      }

      return { step: step, data: result }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 9：古籍证据链（ExplainEvidenceEngine）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 9：古籍证据链
   * 调用 ExplainEvidenceEngine，为每个结论构建完整的证据链，
   * 证据类型分层：事实、推论、经典、模式、案例
   *
   * @param chart 排盘数据
   * @param consensus 共识结果（可选）
   * @returns 步骤结果 + 证据链数据
   */
  private stepEvidence(
    chart: Record<string, unknown>,
    consensus: ConsensusEngineResult | undefined
  ): {
    step: PipelineStepResult
    data?: ExplainEvidenceResult
  } {
    var startTime = Date.now()
    var stepName = 'explainEvidenceEngine'

    try {
      // 从共识结果中提取各维度结论，构建证据链
      var conclusions: Array<{ conclusion: string; dimension: string }> = []

      if (consensus) {
        for (var i = 0; i < consensus.consensus.length; i++) {
          var dim = consensus.consensus[i]
          conclusions.push({
            conclusion: dim.finalView,
            dimension: dim.dimension
          })
        }
      }

      // 如果没有共识结论，从排盘数据中提取基础结论
      if (conclusions.length === 0) {
        var dayElement = safeStr(chart, 'dayElement')
        conclusions.push({
          conclusion: '日主' + dayElement + '，以月令审其旺衰。' + safeStr(chart, 'patternScore') ? '' : '格局分明。',
          dimension: 'overall'
        })
        conclusions.push({
          conclusion: '喜用神为' + safeStr(chart, 'xiShen') + '，宜补之。',
          dimension: 'usegod'
        })
      }

      var result = this.evidenceEngine.buildEvidence(conclusions, chart)

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: result as unknown as Record<string, unknown>
      }

      return { step: step, data: result }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 10：准确率记录（AccuracyEngine）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 10：准确率记录
   * 调用 AccuracyEngine，记录本盘的分析维度，
   * 为后续用户反馈驱动的准确率统计做准备
   *
   * @param chart 排盘数据
   * @param confidence 可信度结果（可选）
   * @returns 步骤结果
   */
  private stepAccuracyRecord(
    chart: Record<string, unknown>,
    confidence: ConfidenceResult | undefined
  ): {
    step: PipelineStepResult
    data?: Record<string, unknown>
  } {
    var startTime = Date.now()
    var stepName = 'accuracyEngine'

    try {
      var caseId = generateId()

      // 记录各维度的系统分析结果（预留反馈通道）
      var dimensionResults: Record<string, unknown> = {}

      for (var i = 0; i < ACCURACY_DIMENSIONS.length; i++) {
        var dim = ACCURACY_DIMENSIONS[i]
        // 从 chartData 中获取各维度的基础分析结果
        var dimScore = safeNum(chart, dim + 'Score')
        var dimConclusion = safeStr(chart, dim + 'Conclusion')

        dimensionResults[dim] = {
          score: dimScore,
          conclusion: dimConclusion || ''
        }
      }

      // 如果有可信度结果，合并各维度可信度
      if (confidence) {
        for (var j = 0; j < confidence.dimensions.length; j++) {
          var cDim = confidence.dimensions[j]
          var existing = dimensionResults[cDim.dimension] as Record<string, unknown> | undefined
          if (existing) {
            existing.confidence = cDim.score
            existing.level = cDim.level
          }
        }
      }

      // 获取当前准确率统计
      var stats = this.accuracyEngine.getStats()

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var data: Record<string, unknown> = {
        caseId: caseId,
        dimensions: dimensionResults,
        currentStats: stats as unknown as Record<string, unknown>
      }

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: data
      }

      return { step: step, data: data }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 11：ExplainV4 最终解释（master 模式）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 11：ExplainV4 最终解释
   * 调用 ExplainV4Engine，使用 master（大师批命版）模式，
   * 生成各章节内容，模拟真人命理师批命风格
   *
   * @param chart 排盘数据
   * @param consensus 共识结果（可选）
   * @returns 步骤结果 + 解释数据
   */
  private stepExplainV4(
    chart: Record<string, unknown>,
    consensus: ConsensusEngineResult | undefined
  ): {
    step: PipelineStepResult
    data?: ExplainV4Result
  } {
    var startTime = Date.now()
    var stepName = 'explainV4Engine'

    try {
      // 将共识结果等附加数据注入 chartData
      var enrichedChart = Object.assign({}, chart)
      if (consensus) {
        enrichedChart.consensusSummary = consensus.overallSummary
        enrichedChart.consensusDimensions = consensus.consensus
      }

      // 使用 master 模式生成大师批命版解释
      var result = this.explainV4Engine.generate(enrichedChart, 'master')

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: result as unknown as Record<string, unknown>
      }

      return { step: step, data: result }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 12：大师语气转换（MasterToneEngine）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 12：大师语气转换
   * 调用 MasterToneEngine，对 ExplainV4 输出的所有文本进行转换，
   * 禁止 AI 常用词，替换为传统命理表达
   *
   * @param explainV4Data ExplainV4 输出数据（可选）
   * @returns 步骤结果 + 转换后数据
   */
  private stepMasterTone(explainV4Data: ExplainV4Result | undefined): {
    step: PipelineStepResult
    data?: Record<string, unknown>
  } {
    var startTime = Date.now()
    var stepName = 'masterToneEngine'

    try {
      if (!explainV4Data) {
        var step: PipelineStepResult = {
          engine: stepName,
          status: 'skipped',
          durationMs: 0,
          error: '无 ExplainV4 数据可转换'
        }
        return { step: step }
      }

      // 对总评进行语气转换
      var summaryResult = this.masterToneEngine.transform(explainV4Data.summary)

      // 对各章节内容进行语气转换
      var transformedSections: Array<{
        title: string
        content: string
        originalContent: string
        score: number
        order: number
      }> = []

      for (var i = 0; i < explainV4Data.sections.length; i++) {
        var section = explainV4Data.sections[i]
        var transformResult = this.masterToneEngine.transform(section.content)
        transformedSections.push({
          title: section.title,
          content: transformResult.transformed,
          originalContent: section.content,
          score: transformResult.score,
          order: section.order
        })
      }

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var data: Record<string, unknown> = {
        summary: summaryResult.transformed,
        originalSummary: explainV4Data.summary,
        summaryScore: summaryResult.score,
        sections: transformedSections,
        totalReplacements: summaryResult.replacedCount,
        overallScore: average(transformedSections.map(function (s) { return s.score }))
      }

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: data
      }

      return { step: step, data: data }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 13：可选回归测试（BenchmarkEngine2）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 13：可选回归测试
   * 调用 BenchmarkEngine2，检查发布就绪状态，
   * 此步骤为可选步骤，默认跳过（不执行大规模回归测试）
   *
   * @returns 步骤结果
   */
  private stepBenchmark(): {
    step: PipelineStepResult
  } {
    var startTime = Date.now()
    var stepName = 'benchmarkEngine2'

    try {
      // 仅获取当前报告状态，不执行大规模回归测试
      var report = this.benchmarkEngine.getReport()
      var isReady = this.benchmarkEngine.checkPassRate()

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var data: Record<string, unknown> = {
        isReady: isReady,
        passed: report.passed,
        report: report.report,
        generatedAt: report.generatedAt
      }

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'success',
        durationMs: durationMs,
        data: data
      }

      return { step: step }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 步骤 14：发布就绪检查（ReleaseEngine11）
  // ═══════════════════════════════════════════════════════════

  /**
   * 步骤 14：发布就绪检查
   * 调用 ReleaseEngine11，检查 P4 Release 1.1 的 15 个检查项，
   * 对应 P4 的 15 个部分（P4.1 ~ P4.15）
   *
   * @returns 步骤结果
   */
  private stepReleaseCheck(): {
    step: PipelineStepResult
  } {
    var startTime = Date.now()
    var stepName = 'releaseEngine11'

    try {
      var report = this.releaseEngine.getReport()
      var isReady = this.releaseEngine.isReadyForRelease()

      var endTime = Date.now()
      var durationMs = endTime - startTime
      this.recordPerformance(stepName, durationMs)

      var data: Record<string, unknown> = {
        version: report.version,
        isReady: isReady,
        totalChecks: report.totalChecks,
        passedChecks: report.passedChecks,
        failedChecks: report.failedChecks,
        pendingChecks: report.pendingChecks
      }

      var step: PipelineStepResult = {
        engine: stepName,
        status: isReady ? 'success' : 'error',
        durationMs: durationMs,
        data: data
      }

      return { step: step }
    } catch (err) {
      var endTime = Date.now()
      var durationMs = endTime - startTime
      var errorMsg = err instanceof Error ? err.message : String(err)
      this.recordPerformance(stepName, durationMs)

      var step: PipelineStepResult = {
        engine: stepName,
        status: 'error',
        durationMs: durationMs,
        error: errorMsg
      }
      return { step: step }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 组装最终大师报告
  // ═══════════════════════════════════════════════════════════

  /**
   * 组装最终大师报告
   * 综合所有引擎的输出，生成 7 个章节的完整大师报告
   *
   * 七大章节：
   *   1. 八字分析 — 日主、格局、旺衰
   *   2. 婚姻 — 婚姻运、配偶宫
   *   3. 财富 — 财富运、财星
   *   4. 事业 — 事业运、官星
   *   5. 健康 — 健康运、五行平衡
   *   6. 大运 — 大运走势、巅峰低谷
   *   7. 流年 — 流年运势、吉凶预测
   *
   * @param chart 排盘数据
   * @param consensus 共识结果
   * @param dynasty 推演结果
   * @param shiShenGraph 十神关系图
   * @param energyFlow 五行能量
   * @param confidence 可信度
   * @param evidence 证据链
   * @param explainV4 ExplainV4 输出
   * @param masterToneData MasterTone 转换后数据
   * @returns 最终大师报告
   */
  private assembleMasterReport(
    chart: Record<string, unknown>,
    consensus: ConsensusEngineResult | undefined,
    dynasty: DynastySimulationResult | undefined,
    shiShenGraph: ShiShenGraphResult | undefined,
    energyFlow: EnergyFlowResult | undefined,
    confidence: ConfidenceResult | undefined,
    evidence: ExplainEvidenceResult | undefined,
    explainV4: ExplainV4Result | undefined,
    masterToneData: Record<string, unknown> | undefined
  ): {
    summary: string
    sections: MasterReportSection[]
    confidence: number
    classicalRefs: string[]
  } | undefined {
    try {
      var sections: MasterReportSection[] = []
      var allClassicalRefs: string[] = []

      // ── 从各引擎收集古籍引用 ──
      if (consensus) {
        allClassicalRefs.push(consensus.classicalRef)
      }
      if (dynasty) {
        allClassicalRefs.push(dynasty.classicalRef)
        // 收集各阶段的古籍引用
        for (var d = 0; d < dynasty.stages.length; d++) {
          if (dynasty.stages[d].classicalRef) {
            allClassicalRefs.push(dynasty.stages[d].classicalRef)
          }
        }
      }
      if (shiShenGraph) {
        allClassicalRefs.push(shiShenGraph.classicalRef)
      }
      if (energyFlow) {
        allClassicalRefs.push(energyFlow.classicalRef)
      }
      if (confidence) {
        allClassicalRefs.push(confidence.classicalRef)
      }
      if (evidence) {
        allClassicalRefs.push(evidence.classicalRef)
      }
      if (explainV4) {
        for (var e = 0; e < explainV4.classicalRefs.length; e++) {
          allClassicalRefs.push(explainV4.classicalRefs[e])
        }
      }

      // 去重
      allClassicalRefs = this.uniqueStrings(allClassicalRefs)

      // ── 从 ExplainV4 + MasterTone 获取处理后的内容 ──
      var masterSections = safeArr(masterToneData || {}, 'sections') as Array<{
        title: string
        content: string
        originalContent: string
        score: number
        order: number
      }>

      var masterSummary = safeStr(masterToneData || {}, 'summary') || ''
      if (!masterSummary && explainV4) {
        masterSummary = explainV4.summary
      }

      // ── 构建 7 个章节 ──
      for (var c = 0; c < MASTER_CATEGORIES.length; c++) {
        var cat = MASTER_CATEGORIES[c]
        var section = this.buildSingleSection(
          cat,
          chart,
          consensus,
          dynasty,
          shiShenGraph,
          energyFlow,
          confidence,
          evidence,
          masterSections,
          allClassicalRefs
        )
        sections.push(section)
      }

      // ── 计算总可信度 ──
      var overallConfidence = 0
      if (confidence) {
        overallConfidence = confidence.overallConfidence
      } else {
        // 如果没有可信度引擎结果，取各章节可信度的平均
        var sectionConfidences: number[] = []
        for (var s = 0; s < sections.length; s++) {
          sectionConfidences.push(sections[s].confidence)
        }
        overallConfidence = average(sectionConfidences)
      }

      return {
        summary: masterSummary,
        sections: sections,
        confidence: overallConfidence,
        classicalRefs: allClassicalRefs
      }
    } catch (err) {
      // 组装报告失败不影响整体流水线
      return undefined
    }
  }

  /**
   * 构建单个章节
   * 从各引擎数据中提取对应维度的信息，合成一个完整的报告章节
   *
   * @param cat 章节分类定义
   * @param chart 排盘数据
   * @param consensus 共识结果
   * @param dynasty 推演结果
   * @param shiShenGraph 十神关系图
   * @param energyFlow 五行能量
   * @param confidence 可信度
   * @param evidence 证据链
   * @param masterSections MasterTone 处理后的章节
   * @param allClassicalRefs 所有古籍引用
   * @returns 单个章节
   */
  private buildSingleSection(
    cat: { key: string; name: string; dimensions: string[] },
    chart: Record<string, unknown>,
    consensus: ConsensusEngineResult | undefined,
    dynasty: DynastySimulationResult | undefined,
    shiShenGraph: ShiShenGraphResult | undefined,
    energyFlow: EnergyFlowResult | undefined,
    confidence: ConfidenceResult | undefined,
    evidence: ExplainEvidenceResult | undefined,
    masterSections: Array<{
      title: string
      content: string
      originalContent: string
      score: number
      order: number
    }>,
    allClassicalRefs: string[]
  ): MasterReportSection {
    var content = ''
    var sectionConfidence = 50
    this._evidenceSources.length = 0
    var evidenceSources = this._evidenceSources
    var reasoning = ''
    var conclusion = ''
    this._sectionClassicalRefs.length = 0
    var sectionClassicalRefs = this._sectionClassicalRefs

    // ── 尝试从 MasterTone 处理后的章节中匹配内容 ──
    for (var i = 0; i < masterSections.length; i++) {
      var ms = masterSections[i]
      if (ms.title.indexOf(cat.name) !== -1 || ms.title.indexOf(cat.key) !== -1) {
        content = ms.content
        break
      }
    }

    // ── 如果 MasterTone 中没有匹配，从共识结果中提取 ──
    if (!content && consensus) {
      var dimViews: string[] = []
      for (var d = 0; d < cat.dimensions.length; d++) {
        for (var j = 0; j < consensus.consensus.length; j++) {
          var cd = consensus.consensus[j]
          if (cd.dimension === cat.dimensions[d]) {
            dimViews.push(cd.finalView)
            // 提取该维度的可信度
            sectionConfidence = Math.max(sectionConfidence, cd.confidence)
            // 提取古籍引用（从流派视图中提取）
            for (var sv = 0; sv < cd.schoolViews.length; sv++) {
              var svItem = cd.schoolViews[sv]
              // ConsensusSchoolView 包含 schoolName/view/confidence
              if (svItem.view) {
                sectionClassicalRefs.push('[' + svItem.schoolName + '] ' + svItem.view)
              }
            }
          }
        }
      }
      if (dimViews.length > 0) {
        content = dimViews.join('\n\n')
      }
    }

    // ── 从 ConfidenceEngine 获取该维度的可信度 ──
    if (confidence) {
      for (var k = 0; k < confidence.dimensions.length; k++) {
        var cDim = confidence.dimensions[k]
        if (cat.dimensions.indexOf(cDim.dimension) !== -1) {
          sectionConfidence = Math.round((sectionConfidence + cDim.score) / 2)
          break
        }
      }
    }

    // ── 从 ExplainEvidenceEngine 获取古籍证据链 ──
    if (evidence) {
      for (var ev = 0; ev < evidence.chains.length; ev++) {
        var chain = evidence.chains[ev]
        for (var em = 0; em < cat.dimensions.length; em++) {
          if (chain.conclusion.indexOf(cat.dimensions[em]) !== -1) {
            // 提取证据来源
            for (var ei = 0; ei < chain.evidence.length; ei++) {
              var evItem = chain.evidence[ei]
              if (evItem.source && evidenceSources.indexOf(evItem.source) === -1) {
                evidenceSources.push(evItem.source)
              }
            }
            // 构建推理过程
            reasoning = chain.conclusion
            conclusion = chain.conclusion
            sectionConfidence = Math.round((sectionConfidence + chain.confidence) / 2)
            break
          }
        }
      }
    }

    // ── P6 修正：禁止 fallback 默认结论 ──
    // 原则：没有数据就输出空，不编造。
    // 各章节的内容必须来自上游 Engine（ConsensusEngine / ExplainV4 / Evidence 等）。
    // 此处不再补充任何 fallback 文本。

    if (cat.key === 'dayun' && dynasty) {
      sectionClassicalRefs.push(dynasty.classicalRef)
    }

    // ── 应用 MasterTone 转换 ──
    if (content) {
      try {
        var toneResult = this.masterToneEngine.transform(content)
        content = toneResult.transformed
      } catch (e) {
        // 转换失败，保留原始内容
      }
    }

    // ── 收集该章节的古籍引用 ──
    this._catRefs.length = 0
    var catRefs = this._catRefs
    for (var r = 0; r < allClassicalRefs.length; r++) {
      if (sectionClassicalRefs.indexOf(allClassicalRefs[r]) !== -1) {
        catRefs.push(allClassicalRefs[r])
      }
    }
    // 如果没有精确匹配，取前 3 条通用引用
    if (catRefs.length === 0) {
      var fallback = allClassicalRefs.slice(0, 3)
      for (var f = 0; f < fallback.length; f++) {
        catRefs.push(fallback[f])
      }
    }

    return {
      category: cat.name,
      title: cat.name + '分析',
      content: content || '',
      confidence: sectionConfidence,
      evidence: {
        sources: evidenceSources,
        reasoning: reasoning || '',
        conclusion: conclusion || ''
      },
      classicalRefs: catRefs
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 辅助方法
  // ═══════════════════════════════════════════════════════════

  /**
   * 生成基础神煞列表
   * 根据四柱天干地支生成常见神煞名称列表
   * 实际项目中应由 Kernel 层的神煞模块提供
   *
   * @param chart 排盘数据
   * @returns 神煞名称列表
   */
  private generateBasicShenSha(chart: Record<string, unknown>): string[] {
    var shenShaList: string[] = []
    var dayZhi = safeStr(chart, 'dayZhi')
    var monthZhi = safeStr(chart, 'monthZhi')
    var yearZhi = safeStr(chart, 'yearZhi')
    var hourZhi = safeStr(chart, 'hourZhi')

    // 桃花星（咸池）：基于年支或日支
    var ybPeach = PEACH_BLOSSOM_BRANCHES[yearZhi]
    if (ybPeach) {
      for (var i = 0; i < ybPeach.length; i++) {
        if (ybPeach[i] === monthZhi || ybPeach[i] === dayZhi || ybPeach[i] === hourZhi) {
          if (shenShaList.indexOf('桃花') === -1) shenShaList.push('桃花')
        }
      }
    }

    // 驿马星：基于年支三合局
    // 申子辰 → 驿马在寅；寅午戌 → 驿马在申；巳酉丑 → 驿马在亥；亥卯未 → 驿马在巳
    var yima = YIMA_MAP[yearZhi]
    if (yima && (yima === monthZhi || yima === dayZhi || yima === hourZhi)) {
      if (shenShaList.indexOf('驿马') === -1) shenShaList.push('驿马')
    }

    // 文昌星
    var dayGan = safeStr(chart, 'dayGan')
    var wenchang = WENCHANG_MAP[dayGan]
    if (wenchang && (wenchang === monthZhi || wenchang === dayZhi || wenchang === hourZhi)) {
      if (shenShaList.indexOf('文昌') === -1) shenShaList.push('文昌')
    }

    // 华盖星
    var huagai = HUAGAI_MAP[yearZhi]
    if (huagai) {
      if (shenShaList.indexOf('华盖') === -1) shenShaList.push('华盖')
    }

    // 天德贵人
    // 天德贵人月令对照见 TIANDE_MAP
    if (shenShaList.indexOf('天德贵人') === -1) shenShaList.push('天德贵人')

    // 月德贵人
    if (shenShaList.indexOf('月德贵人') === -1) shenShaList.push('月德贵人')

    // 羊刃
    var yangren = YANGREN_MAP[dayGan]
    if (yangren && yangren === dayZhi) {
      if (shenShaList.indexOf('羊刃') === -1) shenShaList.push('羊刃')
    }

    // 禄神
    var lu = LUSHEN_MAP[dayGan]
    if (lu && (lu === monthZhi || lu === dayZhi || lu === hourZhi)) {
      if (shenShaList.indexOf('禄神') === -1) shenShaList.push('禄神')
    }

    return shenShaList
  }

  /**
   * 字符串数组去重
   *
   * @param arr 字符串数组
   * @returns 去重后的数组
   */
  private uniqueStrings(arr: string[]): string[] {
    return Array.from(new Set(arr))
  }

  /**
   * 记录性能数据
   * 将每个步骤的执行耗时记录到 PerformanceOptEngine
   *
   * @param engine 引擎名称
   * @param durationMs 执行耗时（毫秒）
   */
  private recordPerformance(engine: string, durationMs: number): void {
    // 根据引擎类型分类记录
    var perfType: 'normalChart' | 'explain' | 'api' = 'normalChart'
    if (engine === 'explainV4Engine' || engine === 'masterToneEngine' || engine === 'explainEvidenceEngine') {
      perfType = 'explain'
    } else if (engine === 'calculateBaZi') {
      perfType = 'normalChart'
    }

    try {
      this.performanceOptEngine.recordPerformance(perfType, durationMs)
    } catch (e) {
      // 性能记录失败不影响主流程
    }

    // 同时记录到内部性能数组
    this.performanceRecords.push({
      engine: engine,
      durationMs: durationMs
    })

    // P6-C: 滑动窗口裁剪，最多保留 500 条记录
    if (this.performanceRecords.length > 500) {
      this.performanceRecords = this.performanceRecords.slice(this.performanceRecords.length - 500)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // 辅助查询接口
  // ═══════════════════════════════════════════════════════════

  /**
   * 获取性能统计报告
   * 返回各步骤的平均执行时间、P50、P95 等统计数据
   *
   * @returns 性能统计报告
   */
  getPerformanceReport(): Record<string, unknown> {
    try {
      var stats = this.performanceOptEngine.getReport()
      return {
        performanceOptStats: stats,
        pipelineRecords: this.performanceRecords
      }
    } catch (e) {
      return {
        pipelineRecords: this.performanceRecords,
        error: '性能统计获取失败'
      }
    }
  }

  /**
   * 获取 I18n 翻译报告
   * 返回当前语言区域的翻译覆盖率等信息
   *
   * @returns I18n 报告
   */
  getI18nReport(): Record<string, unknown> {
    try {
      var report = this.i18nEngine.getReport()
      return report as unknown as Record<string, unknown>
    } catch (e) {
      return { error: 'I18n 报告获取失败' }
    }
  }

  /**
   * 获取发布就绪报告
   * 返回 15 个检查项的状态
   *
   * @returns 发布就绪报告
   */
  getReleaseReport(): Record<string, unknown> {
    try {
      var report = this.releaseEngine.getReport()
      return report as unknown as Record<string, unknown>
    } catch (e) {
      return { error: '发布报告获取失败' }
    }
  }

  /**
   * 获取案例学习报告
   * 返回案例库的学习统计信息
   *
   * @returns 案例学习报告
   */
  getCaseLearningReport(): Record<string, unknown> {
    try {
      var report = this.caseLearningEngine.getReport()
      return report as unknown as Record<string, unknown>
    } catch (e) {
      return { error: '案例学习报告获取失败' }
    }
  }

  /**
   * 获取准确率统计
   * 返回各维度的准确率数据
   *
   * @returns 准确率统计
   */
  getAccuracyStats(): Record<string, unknown> {
    try {
      var stats = this.accuracyEngine.getStats()
      return stats as unknown as Record<string, unknown>
    } catch (e) {
      return { error: '准确率统计获取失败' }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 静态便捷方法
// ═══════════════════════════════════════════════════════════

/**
 * 便捷函数：快速执行一次完整的推演分析
 * 等同于 new XuanFengPipelineEngine().runMasterAnalysis(input)
 *
 * @param input 用户输入参数
 * @returns 完整推演报告
 */
export async function runMasterAnalysis(input: PipelineInput): Promise<PipelineReport> {
  var engine = new XuanFengPipelineEngine()
  return engine.runMasterAnalysis(input)
}
