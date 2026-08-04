/**
 * P1.2.2 — 格局-十神 融合层类型
 *
 * 核心原则：Pattern 插件 / 只输出Evidence。
 * Fusion 层负责：证据融合 · 权重计算 · 结构判断 · 冲突分析 · 对 Unified Decision Core 提供增强 SubEngineResult。
 */
import type { Wuxing } from '../../../pattern/types'
import type {
  GejuVerdict,
  PatternClassifierResult,
} from '../../../pattern/types'
import type {
  TenGodName,
  CombinationVerdict,
  TenGodEvidenceReport,
  TenGodClassifierResult,
  TenGodClassifierInput,
} from '../../../tengod/types'
import type { SubEngineResult, SubEngineInput } from '../../../../engines/types'

// ============================================================
// 原始证据：Pattern+十神联合证据
// ============================================================

export type EvidenceSource = 'pattern' | 'tengod' | 'fusion' | 'classic-center'

export interface PatternEvidenceLeaf {
  /** 证据来源 */
  source: EvidenceSource
  /** 步骤 ID（对应 SubEngine evidence.step） */
  step: string
  /** 文本内容 */
  text: string
  /** 是否成立 */
  satisfied: boolean
  /** 原始权重（-5~+5） */
  weight: number
  /** 古籍引用（可空：`《古籍》·章节：原文` 格式，允许 null/undefined 字符串） */
  citation?: string | null
  /** 来源章节（如存在） */
  chapter?: string
  /** 可信度 0~1 */
  confidence: number
  /** 原始子证据（可空子节点用于构建树） */
  children?: PatternEvidenceLeaf[]
}

export interface PatternTenGodEvidenceTree {
  /** 根节点唯一 ID */
  id: string
  /** 总权重 */
  totalWeight: number
  /** 正证权重 */
  positiveWeight: number
  /** 反证权重 */
  negativeWeight: number
  /** Pattern 来源证据链 */
  patternLeaves: PatternEvidenceLeaf[]
  /** TenGod 来源证据链 */
  tengodLeaves: PatternEvidenceLeaf[]
  /** Fusion 层判定（新增） */
  fusionLeaves: PatternEvidenceLeaf[]
  /** 子节点组合形成完整证据链） */
  children: PatternEvidenceLeaf[]
  /** 总体置信度 0~1 */
  confidence: number
}

/**
 * 标准融合证据类型：
 * 供外部直接消费的「格局+十神联合证据
 */
export interface PatternTenGodEvidence {
  patternEvidence: {
    verdict?: GejuVerdict
    candidates: PatternClassifierResult['candidates']
    evidence: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }>
    classicCitations: Array<{ classicCode: string; chapter?: string; quote: string; classicName?: string }>
    score: number // Pattern 综合分（0~1）
    confidence: number
  }
  tengodEvidence: {
    classifier?: TenGodClassifierResult
    combinationVerdicts: CombinationVerdict[]
    evidenceReport?: TenGodEvidenceReport
    evidence: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }>
    classicCitations: Array<{ classicCode: string; chapter?: string; quote: string; classicName?: string }>
    score: number // TenGod 综合分（0~1）
    confidence: number
  }
  patternScore: number // Pattern 对命局匹配度 0~100
  tengodScore: number  // TenGod 对命局匹配度 0~100
  classicCitation: Array<{
    source: 'pattern' | 'tengod'
    classicName: string
    chapter: string
    quote: string
  }>
  confidence: number // 融合总体置信度 0~1
  evidenceTree: PatternTenGodEvidenceTree
}

// ============================================================
// 联合优先级矩阵输出
// ============================================================

export type PatternTag =
  | 'qi-sha-wang'        // 七杀格·杀旺
  | 'qi-sha-yin-xiang-sheng' // 七杀格·杀印相生
  | 'qi-shi-zhi-sha'      // 七杀格·食神制杀
  | 'qi-sha-wu-zhi'        // 七杀格·杀旺无制
  | 'shang-guan-jian-guan' // 伤官见官
  | 'shang-guan-pei-yin'   // 伤官配印
  | 'shang-guan-sheng-cai' // 伤官生财
  | 'cai-wang-shen-ruo'    // 财格·财旺身弱
  | 'cai-wang-shen-qiang'   // 财格·财旺身强
  | 'cai-guan-xiang-sheng'  // 财官相生
  | 'yin-wang-shen-ruo'     // 印格·印旺身弱（印多为忌）
  | 'unknown'

export interface PriorityMatrixEntry {
  tag: PatternTag
  /** 命中模式名（中文字） */
  label: string
  /** 基础权重 -10~+10 */
  baseWeight: number
  /** 吉凶 */
  favorable: boolean
  /** 触发条件（简要说明） */
  trigger: string
}

export interface PriorityMatrixResult {
  /** 所有命中标签 */
  hits: PriorityMatrixEntry[]
  /** 最高优先级命中 */
  dominant?: PriorityMatrixEntry
  /** 联合结构总权重 */
  totalWeight: number
  /** 吉权重 */
  favorableWeight: number
  /** 凶权重 */
  unfavorableWeight: number
}

// ============================================================
// 冲突解决报告
// ============================================================

export interface FusionConflictItem {
  /** 冲突唯一 ID */
  id: string
  /** 冲突来源（Pattern 侧观点 / 十神 侧观点） */
  sources: Array<{
    source: 'pattern' | 'tengod'
    view: string
    evidenceSummary: string
    weight: number
    citation?: string
  }>
  /** 融合采信理由（怎么解消了） */
  resolveReason: string
  /** 最终裁决（采用哪一方，或按比例融合） */
  verdict: 'adopt-pattern' | 'adopt-tengod' | 'blend'
  /** 采纳双方给出的融合权重 -10~+10 */
  finalWeight: number
  /** 最终置信度 0~1 */
  confidence: number
}

export interface ConflictResolverResult {
  /** 是否存在冲突 */
  hasConflict: boolean
  /** 冲突条目 */
  items: FusionConflictItem[]
  /** 冲突严重度 0~1（1 越严重） */
  conflictSeverity: number
  /** 融合后净权重（扣除冲突扣损） */
  adjustedWeight: number
}

// ============================================================
// Fusion Decision 输出
// ============================================================

export interface FusionDominantStructure {
  /** 主格局名（七杀格/伤官格/财格/印格/其他） */
  patternName: string
  /** 核心十神标签（例如“杀印相生” / “食神制杀” / “伤官配印” 等） */
  patternTag: PatternTag | string
  /** 核心十神集合（主导） */
  keyTenGods: TenGodName[]
  /** 核心格局候选十神（辅助） */
  supportTenGods: TenGodName[]
  /** 喜五行（建议） */
  favorableWuxing: Wuxing[]
  /** 忌五行（建议） */
  unfavorableWuxing: Wuxing[]
}

export interface FusionDecisionResult {
  /** 主结构 */
  dominantStructure: FusionDominantStructure
  /** 支撑因素（吉） */
  supportingFactors: Array<{ factor: string; weight: number; evidence: string }>
  /** 冲突因素（凶或矛盾） */
  conflictingFactors: Array<{ factor: string; weight: number; evidence: string }>
  /** 最终影响权重（-100~+100，传给 UDC V3 使用） */
  influenceWeight: number
  /** 证据树（完整证据链完整透传） */
  evidenceTree: PatternTenGodEvidenceTree
  /** 解释（explain.ts 中使用） */
  explanation: {
    patternBasis: string // 格局基础（白话）
    tengodState: string // 十神状态白话
    fusionJudgment: string // 融合判断白话
    classicRefs: string[] // 古籍依据
  }
  /** 子引擎统一结果（透传给 UDC） */
  subEngineResult: SubEngineResult
}

// ============================================================
// Fusion Engine 输入（对齐 SubEngineInput + Pattern/TenGod 插件原始输入）
// ============================================================

export interface FusionInput extends SubEngineInput {
  /** 透传 TenGod 分类器输入（供 fusion 调 TenGod 时使用） */
  tengodInput?: TenGodClassifierInput
  /** 若上层已经调用过 Pattern/TenGod，可直接传入结果，避免重复计算 */
  prePatternResult?: any
  preTenGodResult?: any
  prePatternClassify?: PatternClassifierResult
  preTenGodClassify?: TenGodClassifierResult
}

// ============================================================
// Fusion Explain 输出
// ============================================================

export interface FusionExplainResult {
  /** Markdown 报告全文 */
  markdown: string
  sections: {
    patternBasis: string   // 1.格局基础
    tengodState: string   // 2.十神状态
    fusionJudgment: string // 3.融合判断
    classicRefs: string[] // 4.古籍依据
  }
}
