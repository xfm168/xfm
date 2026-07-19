/**
 * H3 Module 2: Professional ShenSha Engine — 神煞类型系统
 *
 * 统一神煞输出格式，接入 TraceChain、WarningCode。
 */

import type { HeavenlyStem, EarthlyBranch } from '@/lib/core/types/base'
import type { DerivationChain } from './types'

// ─── 神煞分类 ───

export type ShenShaCategory =
  | '吉神'
  | '凶神'
  | '桃花'
  | '贵人'
  | '事业'
  | '财运'
  | '婚姻'
  | '健康'
  | '学业'
  | '出行'
  | '灾煞'
  | '刑冲'
  | '岁运'
  | '特殊'

// ─── 神煞落位信息 ───

export interface ShenShaPosition {
  /** 四柱位置: 年/月/日/时 */
  pillar: '年' | '月' | '日' | '时'
  /** 地支 */
  zhi: EarthlyBranch
  /** 是否主位（日柱为本命，权重最高） */
  isPrimary: boolean
}

// ─── 单个神煞结果 ───

export interface ShenShaResult {
  /** 神煞 ID */
  id: string
  /** 神煞名称 */
  name: string
  /** 分类 */
  category: ShenShaCategory
  /** 是否命中（四柱中存在） */
  hit: boolean
  /** 命中位置列表 */
  positions: ShenShaPosition[]
  /** 详细描述 */
  description: string
  /** 经典出处 */
  reference: string
  /** 现代解释 */
  modernExplain: string
  /** 适用条件 */
  applicable: string
  /** 冲突神煞列表 */
  conflicts: string[]
  /** 优先级（1-100，数字越大越优先） */
  priority: number
  /** 可信度 0-1 */
  confidence: number
  /** 是否为吉神 */
  isAuspicious: boolean
  /** 推导步骤（接入 TraceChain） */
  derivationSteps?: Array<{
    ruleId: string
    input: Record<string, unknown>
    output: Record<string, unknown>
    source: string
  }>
}

// ─── 神煞引擎总输出 ───

export interface ShenShaEngineOutput {
  /** 引擎版本 */
  version: string
  /** 所有神煞结果 */
  results: ShenShaResult[]
  /** 按分类分组 */
  byCategory: Record<ShenShaCategory, ShenShaResult[]>
  /** 命中神煞（仅 hit=true） */
  hits: ShenShaResult[]
  /** 吉神列表 */
  auspicious: ShenShaResult[]
  /** 凶神列表 */
  inauspicious: ShenShaResult[]
  /** 统计 */
  stats: {
    total: number
    hitCount: number
    missCount: number
    auspiciousCount: number
    inauspiciousCount: number
  }
  /** 警告码 */
  warnings: string[]
  /** 计算耗时 ms */
  computeTimeMs: number
  /** 完整推导链 */
  derivation?: DerivationChain
}

// ─── 神煞数据库条目 ───

export interface ShenShaDefinition {
  /** 唯一 ID */
  id: string
  /** 名称 */
  name: string
  /** 分类 */
  category: ShenShaCategory
  /** 是否吉神 */
  isAuspicious: boolean
  /** 优先级 1-100 */
  priority: number
  /** 经典出处 */
  source: string
  /** 现代解释 */
  modernExplain: string
  /** 适用条件 */
  applicable: string
  /** 冲突神煞 ID 列表 */
  conflicts: string[]
  /** 计算公式说明 */
  formula: string
  /** 计算函数（统一签名） */
  calculator: (
    yearGan: HeavenlyStem,
    yearZhi: EarthlyBranch,
    monthGan: HeavenlyStem,
    monthZhi: EarthlyBranch,
    dayGan: HeavenlyStem,
    dayZhi: EarthlyBranch,
    hourGan: HeavenlyStem,
    hourZhi: EarthlyBranch,
    gender: string,
  ) => { hit: boolean; positions: ShenShaPosition[]; confidence: number }
}
