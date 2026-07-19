/**
 * H3 Module 1: Professional Four Pillars Engine
 * 类型定义（v1.1 — 增强推导链基础设施）
 *
 * 所有新增类型统一放在 pro/ 目录。
 * 引用 Core SSoT 类型，不重复定义基础类型。
 */

import type {
  HeavenlyStem, EarthlyBranch, FiveElement, NaYin,
  ShiErChangSheng, YinYang, ShenShi,
} from '@/lib/core/types/base'
import type { CangGan } from '@/lib/core/constants/canggan'

// ─── 基础干支柱 ───

export interface GanZhi {
  gan: HeavenlyStem
  zhi: EarthlyBranch
}

export interface SixLines {
  year: GanZhi
  month: GanZhi
  day: GanZhi
  hour: GanZhi
}

// ─── 算法来源（建议2: source 字段） ───

/** 经典命理文献来源 */
export type ClassicalSource =
  | '三命通会'
  | '渊海子平'
  | '滴天髓'
  | '子平真诠'
  | '协纪辨方书'
  | '穷通宝鉴'
  | '珞琭子'
  | '神峰通考'
  | '星平会海'
  | '兰台妙选'

/** 现代算法来源 */
export type ModernSource =
  | 'Modern Rule'
  | 'Statistical Model'
  | 'Expert System'

/** 统一来源类型 */
export type AlgorithmSource = ClassicalSource | ModernSource | string

/** 算法版本标识 */
export type AlgorithmVersion = 'v1.0-classic' | 'v2.0-modern' | string

// ─── 推导链（第二原则：所有计算可追溯） ───
// 增强：algorithmVersion + source + warnings

export interface DerivationStep {
  /** 步骤 ID */
  id: string
  /** 步骤名称 */
  name: string
  /** 输入参数快照 */
  input: Record<string, unknown>
  /** 输出结果快照 */
  output: Record<string, unknown>
  /** 规则 ID（命中哪条规则） */
  ruleId?: string
  /** 规则描述 */
  ruleDescription?: string
  /** 置信度 0-1 */
  confidence: number
  /** 算法版本（建议1） */
  algorithmVersion?: AlgorithmVersion
  /** 算法来源（建议2） */
  source?: AlgorithmSource
  /** 警告码列表（建议3: WarningCode） */
  warnings?: string[]
  /** 子步骤（建议4: 树状结构） */
  children?: DerivationStep[]
  /** 时间戳 */
  timestamp: number
}

export interface DerivationChain {
  /** 推导步骤列表（按执行顺序） */
  steps: DerivationStep[]
  /** 总体置信度 */
  overallConfidence: number
  /** 计算耗时 ms */
  computeTimeMs: number
  /** 引擎版本 */
  engineVersion: string
  /** 算法版本 */
  algorithmVersion: AlgorithmVersion
  /** 警告码汇总 */
  warnings: string[]
}

/** 链工厂（向后兼容：algorithmVersion/source/warnings 可选） */
export function createChain(
  steps: DerivationStep[],
  computeTimeMs: number,
  options?: {
    engineVersion?: string
    algorithmVersion?: AlgorithmVersion
    warnings?: string[]
  },
): DerivationChain {
  const n = steps.length
  const allWarnings = options?.warnings ?? []
  for (const step of steps) {
    if (step.warnings) allWarnings.push(...step.warnings)
  }
  return {
    steps,
    overallConfidence: n > 0 ? steps.reduce((s, step) => s + step.confidence, 0) / n : 0,
    computeTimeMs,
    engineVersion: options?.engineVersion ?? '1.0.0',
    algorithmVersion: options?.algorithmVersion ?? 'v1.0-classic',
    warnings: allWarnings,
  }
}

/** 树状推导节点工厂 */
export function createTreeNode(params: Omit<DerivationStep, 'timestamp'>): DerivationStep {
  return { ...params, timestamp: Date.now() }
}

// ─── 四柱各柱详解 ───

export interface PillarDetail {
  ganZhi: GanZhi
  naYin: NaYin
  changSheng: ShiErChangSheng
  cangGan: CangGan
  /** 本柱五行 */
  wuxing: FiveElement
  /** 阴阳 */
  yinYang: YinYang
  /** 与日主的十神关系 */
  shenShi?: ShenShi
}

// ─── 命宫 / 身宫 ───

export interface PalaceResult {
  /** 命宫/身宫干支 */
  ganZhi: GanZhi
  /** 所在宫位名称 */
  palaceName: string
  /** 计算推导链 */
  derivation: DerivationChain
}

// ─── 胎元 / 胎息 ───

export interface TaiYuanResult {
  /** 胎元干支 */
  ganZhi: GanZhi
  /** 胎元纳音 */
  naYin: NaYin
  /** 计算推导链 */
  derivation: DerivationChain
}

export interface TaiXiResult {
  /** 胎息干支 */
  ganZhi: GanZhi
  /** 胎息纳音 */
  naYin: NaYin
  /** 计算推导链 */
  derivation: DerivationChain
}

// ─── 四柱专业排盘完整结果 ───

export interface ProfessionalFourPillarsResult {
  /** 版本 */
  version: string
  /** 四柱 */
  sixLines: SixLines
  /** 四柱详解 */
  pillars: {
    year: PillarDetail
    month: PillarDetail
    day: PillarDetail
    hour: PillarDetail
  }
  /** 日主天干 */
  dayMaster: HeavenlyStem
  /** 日主五行 */
  dayMasterElement: FiveElement
  /** 日主阴阳 */
  dayMasterYinYang: YinYang
  /** 五行统计（含藏干加权） */
  fiveElementCount: Record<FiveElement, number>
  /** 纳音（四柱各柱） */
  naYin: {
    year: NaYin
    month: NaYin
    day: NaYin
    hour: NaYin
  }
  /** 十二长生（四柱各柱） */
  changSheng: {
    year: ShiErChangSheng
    month: ShiErChangSheng
    day: ShiErChangSheng
    hour: ShiErChangSheng
  }
  /** 空亡地支列表 */
  kongWang: EarthlyBranch[]
  /** 命宫 */
  mingGong: PalaceResult
  /** 身宫 */
  shenGong: PalaceResult
  /** 胎元 */
  taiYuan: TaiYuanResult
  /** 胎息 */
  taiXi: TaiXiResult
  /** 藏干表（四柱各支） */
  cangGanMap: Record<EarthlyBranch, CangGan>
  /** 完整推导链 */
  derivation: DerivationChain
  /** 警告码汇总（建议3） */
  warnings: string[]
  /** 计算时间戳 */
  computedAt: number
}
