/**
 * P3.13 LearningEngine — 学习系统引擎
 *
 * 核心设计理念：
 *   - 允许专家人工修正引擎结果（如修改喜用神）
 *   - 系统记录所有修正
 *   - 基于历史修正数据优化未来推荐
 *   - 形成持续学习能力
 *   - Kernel 保持纯净，Learning 全部是 Plugin
 *
 * 古籍依据：
 *   《论语》："学而不思则罔，思而不学则殆。"
 *     —— 学习引擎以"学"（积累修正）与"思"（归纳模式）并重，缺一则罔殆。
 *   《易经》："天行健，君子以自强不息。"
 *     —— 引擎持续学习、自我优化，永不止息。
 *   《荀子》："君子生非异也，善假于物也。"
 *     —— 借专家之修正，成引擎之智慧；善假于物，方能日进。
 *
 * 设计原则：
 *   - 纯 Plugin，不修改 Kernel
 *   - import type 仅导入类型
 *   - 所有文本中文字符串
 *   - 用 pick() / pickN() 随机选择器避免模板化
 *   - 所有数据存储在内存中（Map）
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 随机选取数组中一个元素（避免模板化输出） */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 随机选取数组中 N 个不重复元素（Fisher-Yates 洗牌） */
function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    // 前置分号防止 ASI 将本行误解析为上一行的索引访问
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 修正类型 */
export type CorrectionType =
  | 'yongShen'        // 用神修正
  | 'xiShen'          // 喜神修正
  | 'jiShen'          // 忌神修正
  | 'wangShuai'       // 旺衰修正
  | 'geJu'            // 格局修正
  | 'tiaoHou'         // 调候修正
  | 'bingYao'         // 病药修正
  | 'pattern'         // 格局评级修正
  | 'career'          // 事业建议修正
  | 'wealth'          // 财富建议修正
  | 'marriage'        // 婚姻建议修正
  | 'health'          // 健康建议修正
  | 'custom'          // 自定义修正

/** 修正状态 */
export type CorrectionStatus = 'pending' | 'accepted' | 'rejected' | 'applied'

/** 修正来源 */
export type CorrectionSource = 'expert' | 'user' | 'benchmark' | 'auto'

/** 单条人工修正记录 */
export interface CorrectionRecord {
  /** 唯一ID */
  id: string
  /** 修正时间 */
  timestamp: string
  /** 修正类型 */
  type: CorrectionType
  /** 修正来源 */
  source: CorrectionSource
  /** 修正人（专家名称或用户ID） */
  corrector: string
  /** 修正人等级 */
  correctorLevel: 'master' | 'senior' | 'junior' | 'user'

  // ── 命盘标识 ──
  /** 日主天干 */
  dayGan: string
  /** 日主五行 */
  dayElement: string
  /** 四柱字符串 */
  fourPillars: string
  /** 月支 */
  monthZhi: string

  // ── 修正内容 ──
  /** 引擎原始值 */
  originalValue: string
  /** 修正后的值 */
  correctedValue: string
  /** 修正原因 */
  reason: string
  /** 修正详细说明 */
  detail?: string

  // ── 上下文 ──
  /** 修正时的引擎完整结果摘要（JSON） */
  engineSnapshot?: string
  /** 关联的命盘ID */
  caseId?: string

  // ── 状态 ──
  status: CorrectionStatus
  /** 修正置信度（专家自评） */
  confidence: number

  // ── 学习权重 ──
  /** 该修正已被应用次数 */
  appliedCount: number
  /** 该修正的验证反馈（1=好评, -1=差评） */
  feedback: number[]
}

/** 学习模式（从修正中提取的规律） */
export interface LearningPattern {
  /** 模式ID */
  id: string
  /** 模式名称 */
  name: string
  /** 修正类型 */
  type: CorrectionType
  /** 适用条件 */
  conditions: PatternCondition[]
  /** 推荐修正 */
  recommendation: string
  /** 支持该模式的修正记录数 */
  supportCount: number
  /** 置信度 0-100 */
  confidence: number
  /** 来源修正记录IDs */
  sourceRecords: string[]
  /** 创建时间 */
  createdAt: string
  /** 最后更新时间 */
  updatedAt: string
}

/** 模式条件 */
export interface PatternCondition {
  field: string        // 如 "dayElement", "monthZhi", "wangShuai"
  operator: 'equals' | 'contains' | 'in' | 'range'
  value: string | number | string[]
}

/** 学习结果 */
export interface LearningResult {
  /** 推荐修正列表 */
  recommendations: CorrectionRecommendation[]
  /** 匹配的学习模式 */
  matchedPatterns: LearningPattern[]
  /** 所有学习模式统计 */
  patternStats: {
    totalPatterns: number
    byType: Record<string, number>
    avgConfidence: number
  }
  /** 学习系统状态 */
  systemStatus: {
    totalCorrections: number
    acceptedCorrections: number
    rejectedCorrections: number
    appliedCorrections: number
    totalPatterns: number
    learningAccuracy: number  // 基于反馈计算
  }
  /** 摘要 */
  summary: string
  /** 古籍引用 */
  classicalRef: string
}

/** 修正推荐 */
export interface CorrectionRecommendation {
  /** 推荐修正类型 */
  type: CorrectionType
  /** 引擎当前值 */
  currentValue: string
  /** 推荐修正值 */
  recommendedValue: string
  /** 推荐理由 */
  reason: string
  /** 置信度 */
  confidence: number
  /** 来源模式ID */
  patternId: string
  /** 来源修正记录数 */
  supportCount: number
}

/** 学习引擎输入 */
export interface LearningEngineInput {
  dayGan: string
  dayElement: string
  fourPillars: string
  monthZhi: string
  // 引擎当前结果
  currentResults?: {
    yongShen?: string
    xiShen?: string
    jiShen?: string
    wangShuai?: string
    geJu?: string
    pattern?: string
    tiaoHou?: string
  }
  caseId?: string
}

/** 导入导出 */
export interface LearningExportData {
  corrections: CorrectionRecord[]
  patterns: LearningPattern[]
  exportedAt: string
  version: number
}

// ═══════════════════════════════════════════════════════════
// 常量映射
// ═══════════════════════════════════════════════════════════

/** 修正人等级权重（master 最高，user 最低） */
const CORRECTOR_LEVEL_WEIGHT: Record<'master' | 'senior' | 'junior' | 'user', number> = {
  master: 1.0,
  senior: 0.8,
  junior: 0.6,
  user: 0.4,
}

/** 修正类型中文名映射 */
const CORRECTION_TYPE_LABEL: Record<CorrectionType, string> = {
  yongShen: '用神',
  xiShen: '喜神',
  jiShen: '忌神',
  wangShuai: '旺衰',
  geJu: '格局',
  tiaoHou: '调候',
  bingYao: '病药',
  pattern: '格局评级',
  career: '事业建议',
  wealth: '财富建议',
  marriage: '婚姻建议',
  health: '健康建议',
  custom: '自定义',
}

/** 修正状态中文名映射 */
const CORRECTION_STATUS_LABEL: Record<CorrectionStatus, string> = {
  pending: '待审核',
  accepted: '已采纳',
  rejected: '已驳回',
  applied: '已应用',
}

/** 修正来源中文名映射 */
const CORRECTION_SOURCE_LABEL: Record<CorrectionSource, string> = {
  expert: '专家',
  user: '用户',
  benchmark: '基准案例',
  auto: '自动',
}

/** 学习模式所需的最小支持数（少于该数不足以成律） */
const MIN_SUPPORT_COUNT = 2

/** 单条修正对置信度的贡献系数 */
const SUPPORT_CONFIDENCE_FACTOR = 15

/** 模式置信度上限 */
const MAX_PATTERN_CONFIDENCE = 95

/** 无反馈数据时的中性准确率 */
const NEUTRAL_ACCURACY = 50

// ═══════════════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════════════

/**
 * 安全解析 JSON 字符串，失败时返回 undefined。
 * engineSnapshot 为引擎完整结果摘要的 JSON 文本，需容错解析。
 */
function safeJsonParse(text: string | undefined): Record<string, unknown> | undefined {
  if (!text) return undefined
  try {
    const obj = JSON.parse(text)
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return obj as Record<string, unknown>
    }
  } catch {
    // 解析失败属预期情况（快照可能为空或非标准 JSON），静默忽略
  }
  return undefined
}

/**
 * 从引擎快照（JSON）中提取指定字段值。
 * 用于在聚类时获取 wangShuai 等未直接存于 CorrectionRecord 顶层的信息。
 */
function extractFieldFromSnapshot(
  snapshot: string | undefined,
  field: string
): string | undefined {
  const obj = safeJsonParse(snapshot)
  if (!obj) return undefined
  const val = obj[field]
  if (typeof val === 'string' && val.length > 0) return val
  if (typeof val === 'number') return String(val)
  return undefined
}

// ═══════════════════════════════════════════════════════════
// 核心类：LearningEngine
// ═══════════════════════════════════════════════════════════

/**
 * LearningEngine — 学习系统引擎
 *
 * 以"修正记录 → 学习模式 → 智能推荐"为闭环：
 *   1. 专家对引擎结果进行人工修正，系统记录每一条修正；
 *   2. 系统从已采纳的修正中归纳出可复用的学习模式（聚类算法）；
 *   3. 对新命盘，系统依据学习模式推荐修正，并标记需复核之处；
 *   4. 推荐被采纳/驳回/反馈，反哺模式置信度，形成持续学习。
 *
 * 所有数据存储在内存 Map 中，支持导入导出以持久化或迁移。
 */
var MAX_CORRECTIONS = 5000
var MAX_PATTERNS = 2000

export class LearningEngine {
  /** 修正记录库：id → CorrectionRecord（滑动窗口，超过上限自动裁剪） */
  private corrections: Map<string, CorrectionRecord> = new Map()
  /** 学习模式库：id → LearningPattern（滑动窗口，超过上限自动裁剪） */
  private patterns: Map<string, LearningPattern> = new Map()

  constructor() {
    // 学习引擎初始为空，随修正记录积累而成长。
    // 模式在修正被采纳时自动提取（auto-前缀），亦可手动添加（manual-前缀）。
  }

  // ───────────────────────────────────────────────────────
  // 修正记录管理
  // ───────────────────────────────────────────────────────

  /**
   * recordCorrection — 记录一条人工修正
   *
   * @param record 修正内容（不含系统自动生成的 id/timestamp/appliedCount/feedback）
   * @returns 新生成的修正记录 ID
   */
  recordCorrection(
    record: Omit<CorrectionRecord, 'id' | 'timestamp' | 'appliedCount' | 'feedback'>
  ): string {
    const id = this.generateId('corr')
    const full: CorrectionRecord = {
      ...record,
      id,
      timestamp: new Date().toISOString(),
      appliedCount: 0,
      feedback: [],
    }
    this.corrections.set(id, full)

    // P6-C: 滑动窗口裁剪，防止修正库无限增长
    if (this.corrections.size > MAX_CORRECTIONS) {
      var keys = Array.from(this.corrections.keys())
      for (var i = 0; i < keys.length - MAX_CORRECTIONS; i++) {
        this.corrections.delete(keys[i])
      }
    }

    // 若该修正已被采纳，立即触发模式重新提取，使学习即时生效
    if (full.status === 'accepted') {
      this.autoExtractPatterns()
    }
    return id
  }

  /** 获取修正记录 */
  getCorrection(id: string): CorrectionRecord | undefined {
    return this.corrections.get(id)
  }

  /** 获取所有修正记录（按时间倒序） */
  getAllCorrections(): CorrectionRecord[] {
    return Array.from(this.corrections.values()).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    )
  }

  /** 按类型获取修正 */
  getCorrectionsByType(type: CorrectionType): CorrectionRecord[] {
    return this.getAllCorrections().filter(c => c.type === type)
  }

  /** 按命盘获取修正（四柱字符串完全匹配） */
  getCorrectionsByChart(fourPillars: string): CorrectionRecord[] {
    return this.getAllCorrections().filter(c => c.fourPillars === fourPillars)
  }

  /**
   * updateCorrectionStatus — 更新修正状态
   *
   * 状态变化（尤其进入/离开 accepted）会影响学习模式的提取结果，
   * 故每次更新后重新提取模式，并刷新引用该修正的模式置信度。
   */
  updateCorrectionStatus(id: string, status: CorrectionStatus): boolean {
    const rec = this.corrections.get(id)
    if (!rec) return false
    rec.status = status
    // 重新提取模式（accepted 集合可能变化）
    this.autoExtractPatterns()
    // 刷新引用该修正的模式置信度
    this.refreshPatternsReferencing(id)
    return true
  }

  /**
   * addFeedback — 添加验证反馈
   *
   * @param feedback 1=好评，-1=差评
   * 反馈将用于计算学习准确率，并微调相关模式置信度。
   */
  addFeedback(id: string, feedback: number): boolean {
    const rec = this.corrections.get(id)
    if (!rec) return false
    rec.feedback.push(feedback)
    // 反映到引用该修正的模式上
    this.refreshPatternsReferencing(id)
    return true
  }

  /** 删除修正记录（同步清理模式中的引用并重新提取） */
  deleteCorrection(id: string): boolean {
    const deleted = this.corrections.delete(id)
    if (!deleted) return false
    // 从所有模式的 sourceRecords 中移除该修正
    for (const p of this.patterns.values()) {
      p.sourceRecords = p.sourceRecords.filter(r => r !== id)
    }
    this.autoExtractPatterns()
    return true
  }

  // ───────────────────────────────────────────────────────
  // 学习模式管理
  // ───────────────────────────────────────────────────────

  /**
   * extractPatterns — 从修正记录中提取学习模式
   *
   * 核心学习算法：
   *   1. 取所有 accepted 状态的修正记录；
   *   2. 按 type 分组；
   *   3. 在每个 type 内，按 dayElement / monthZhi / wangShuai 聚类；
   *   4. 对每个聚类，统计最常见的 correctedValue，若其支持数 ≥ 2 则生成模式；
   *   5. 模式置信度 = min(支持数 × 15 + 平均专家等级权重, 95)；
   *   6. 模式推荐 = 该聚类中最常见的修正值。
   *
   * 提取结果同时合并入内部模式库（auto-前缀自动重建，manual-前缀手动模式保留）。
   *
   * @returns 本次提取出的学习模式列表
   */
  extractPatterns(): LearningPattern[] {
    const extracted = this.runExtractionAlgorithm()
    this.mergeExtractedPatterns(extracted)
    return extracted
  }

  /** 获取所有学习模式（按置信度倒序） */
  getAllPatterns(): LearningPattern[] {
    return Array.from(this.patterns.values()).sort((a, b) => b.confidence - a.confidence)
  }

  /** 按类型获取模式 */
  getPatternsByType(type: CorrectionType): LearningPattern[] {
    return this.getAllPatterns().filter(p => p.type === type)
  }

  /**
   * addPattern — 手动添加学习模式
   *
   * 手动模式以 manual- 前缀标识，不会被自动提取流程覆盖。
   *
   * @param pattern 模式内容（不含 id/createdAt/updatedAt）
   * @returns 新生成的模式 ID
   */
  addPattern(pattern: Omit<LearningPattern, 'id' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateId('manual')
    const now = new Date().toISOString()
    const full: LearningPattern = {
      ...pattern,
      id,
      createdAt: now,
      updatedAt: now,
    }
    this.patterns.set(id, full)

    // P6-C: 滑动窗口裁剪，防止模式库无限增长
    if (this.patterns.size > MAX_PATTERNS) {
      var keys = Array.from(this.patterns.keys())
      for (var i = 0; i < keys.length - MAX_PATTERNS; i++) {
        this.patterns.delete(keys[i])
      }
    }

    return id
  }

  /** 删除模式 */
  deletePattern(id: string): boolean {
    return this.patterns.delete(id)
  }

  // ───────────────────────────────────────────────────────
  // 推荐优化
  // ───────────────────────────────────────────────────────

  /**
   * recommend — 基于学习模式为当前命盘推荐修正
   *
   * 推荐逻辑：
   *   1. 遍历所有学习模式；
   *   2. 对每个模式，检查其 conditions 是否匹配当前命盘；
   *   3. 匹配的模式生成 CorrectionRecommendation；
   *   4. 若当前引擎结果与推荐值不同，于理由中标记"建议复核"；
   *   5. 按置信度倒序排列推荐。
   *
   * @returns 完整学习结果（推荐、匹配模式、统计、摘要、古籍引用）
   */
  recommend(input: LearningEngineInput): LearningResult {
    const { recommendations, matched } = this.generateRecommendations(input)
    const patternStats = this.computePatternStats()
    const systemStatus = this.getStats()
    const summary = this.buildSummary(recommendations, matched, systemStatus)
    const classicalRef = this.buildClassicalRef()

    return {
      recommendations,
      matchedPatterns: matched,
      patternStats,
      systemStatus,
      summary,
      classicalRef,
    }
  }

  /**
   * checkNeeded — 检查当前结果是否需要修正
   *
   * 仅返回"当前引擎值存在且与推荐值不同"的推荐项，
   * 即真正需要专家复核的修正点。
   */
  checkNeeded(input: LearningEngineInput): CorrectionRecommendation[] {
    const { recommendations } = this.generateRecommendations(input)
    return recommendations.filter(rec => {
      const current = this.getCurrentValueForType(rec.type, input)
      return current !== undefined && current !== '' && current !== rec.recommendedValue
    })
  }

  // ───────────────────────────────────────────────────────
  // 统计与分析
  // ───────────────────────────────────────────────────────

  /** 获取学习系统统计 */
  getStats(): LearningResult['systemStatus'] {
    const all = this.getAllCorrections()
    return {
      totalCorrections: all.length,
      acceptedCorrections: all.filter(c => c.status === 'accepted').length,
      rejectedCorrections: all.filter(c => c.status === 'rejected').length,
      appliedCorrections: all.filter(c => c.status === 'applied').length,
      totalPatterns: this.patterns.size,
      learningAccuracy: this.calculateAccuracy(),
    }
  }

  /**
   * calculateAccuracy — 计算学习准确率（基于反馈）
   *
   * 算法：accuracy = sum(positive_feedback) / sum(all_feedback) × 100
   * 若无反馈数据，返回 50（中性）。
   */
  calculateAccuracy(): number {
    let positive = 0
    let total = 0
    for (const c of this.corrections.values()) {
      for (const f of c.feedback) {
        total++
        if (f > 0) positive++
      }
    }
    if (total === 0) return NEUTRAL_ACCURACY
    return Math.round((positive / total) * 100)
  }

  /**
   * getCorrectionHotspots — 获取修正热点分析
   *
   * 统计每种 CorrectionType 的出现频率，按频率降序排列，并计算百分比。
   */
  getCorrectionHotspots(): Array<{ type: CorrectionType; count: number; percentage: number }> {
    const all = this.getAllCorrections()
    const counts = new Map<CorrectionType, number>()
    for (const c of all) {
      counts.set(c.type, (counts.get(c.type) || 0) + 1)
    }
    const total = all.length
    const result = Array.from(counts.entries()).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    result.sort((a, b) => b.count - a.count)
    return result
  }

  // ───────────────────────────────────────────────────────
  // 导入导出
  // ───────────────────────────────────────────────────────

  /**
   * exportData — 导出学习数据
   *
   * JSON 格式，包含 corrections + patterns + exportedAt + version。
   */
  exportData(): LearningExportData {
    return {
      corrections: this.getAllCorrections(),
      patterns: this.getAllPatterns(),
      exportedAt: new Date().toISOString(),
      version: 1,
    }
  }

  /**
   * importData — 导入学习数据
   *
   * 合并导入（不覆盖已有数据）：仅添加 id 不存在的修正与模式。
   * 导入完成后重新提取模式，使外部模式与本地修正数据自洽。
   *
   * @returns 本次新增的记录数（修正 + 模式）
   */
  importData(data: LearningExportData): number {
    let added = 0
    const corrections = data?.corrections ?? []
    const patterns = data?.patterns ?? []

    for (const c of corrections) {
      if (c && c.id && !this.corrections.has(c.id)) {
        this.corrections.set(c.id, c)
        added++
      }
    }
    for (const p of patterns) {
      if (p && p.id && !this.patterns.has(p.id)) {
        this.patterns.set(p.id, p)
        added++
      }
    }
    // 依据合并后的修正数据重新提取自动模式
    this.autoExtractPatterns()
    return added
  }

  // ═══════════════════════════════════════════════════════════
  // 内部方法
  // ═══════════════════════════════════════════════════════════

  /**
   * matchPattern — 检查模式条件是否匹配当前命盘
   *
   * 所有条件为 AND 关系：任一条件不满足即不匹配。
   * 支持四种算子：equals / contains / in / range。
   */
  private matchPattern(pattern: LearningPattern, input: LearningEngineInput): boolean {
    for (const cond of pattern.conditions) {
      const fieldValue = this.getFieldValue(cond.field, input)
      if (!this.evaluateCondition(cond, fieldValue)) {
        return false
      }
    }
    return true
  }

  /**
   * getFieldValue — 按 field 名从输入中取值
   *
   * 支持命盘基础字段（dayGan/dayElement/fourPillars/monthZhi）
   * 与引擎当前结果字段（wangShuai/geJu/yongShen 等）。
   */
  private getFieldValue(field: string, input: LearningEngineInput): string | undefined {
    const r = input.currentResults
    switch (field) {
      case 'dayGan': return input.dayGan
      case 'dayElement': return input.dayElement
      case 'fourPillars': return input.fourPillars
      case 'monthZhi': return input.monthZhi
      case 'wangShuai': return r?.wangShuai
      case 'geJu': return r?.geJu
      case 'yongShen': return r?.yongShen
      case 'xiShen': return r?.xiShen
      case 'jiShen': return r?.jiShen
      case 'pattern': return r?.pattern
      case 'tiaoHou': return r?.tiaoHou
      default: return undefined
    }
  }

  /**
   * evaluateCondition — 评估单个条件
   *
   * @param cond 条件定义
   * @param fieldValue 命盘中取到的字段值（可能为 undefined）
   */
  private evaluateCondition(
    cond: PatternCondition,
    fieldValue: string | undefined
  ): boolean {
    if (fieldValue === undefined || fieldValue === '') return false
    switch (cond.operator) {
      case 'equals':
        return fieldValue === String(cond.value)
      case 'contains':
        return fieldValue.includes(String(cond.value))
      case 'in':
        return Array.isArray(cond.value) && cond.value.includes(fieldValue)
      case 'range': {
        // value 形如 "30,70" / "30-70" / "30~70" / "30至70"
        if (typeof cond.value !== 'string') return false
        const parts = cond.value.split(/[,，\-~～至]/).map(s => s.trim())
        if (parts.length !== 2) return false
        const min = parseFloat(parts[0])
        const max = parseFloat(parts[1])
        if (isNaN(min) || isNaN(max)) return false
        const num = parseFloat(fieldValue)
        if (isNaN(num)) return false
        return num >= min && num <= max
      }
      default:
        return false
    }
  }

  /**
   * generateId — 生成唯一 ID
   *
   * 格式：{prefix}-{timestamp(base36)}-{random(base36)}
   * prefix 用于区分来源：corr=修正、auto=自动模式、manual=手动模式。
   */
  private generateId(prefix: string): string {
    const ts = Date.now().toString(36)
    const rand = Math.random().toString(36).slice(2, 8)
    return `${prefix}-${ts}-${rand}`
  }

  /**
   * autoExtractPatterns — 自动提取并合并学习模式（内部触发）
   *
   * 在修正记录变更（新增/状态变更/删除/导入）后调用，
   * 重建 auto- 模式，保留 manual- 模式。
   */
  private autoExtractPatterns(): void {
    const extracted = this.runExtractionAlgorithm()
    this.mergeExtractedPatterns(extracted)
  }

  /**
   * runExtractionAlgorithm — 执行聚类提取算法（纯计算，无副作用）
   *
   * 步骤：
   *   1. 取所有 accepted 修正，按 type 分组；
   *   2. 每个 type 内按 (dayElement, monthZhi, wangShuai) 聚类；
   *   3. 每个聚类统计 correctedValue 频次，取最常见的值；
   *   4. 若该值支持数 ≥ 2，生成 LearningPattern；
   *   5. 置信度 = min(支持数 × 15 + 平均等级权重, 95)。
   */
  private runExtractionAlgorithm(): LearningPattern[] {
    const accepted = this.getAllCorrections().filter(c => c.status === 'accepted')
    const extracted: LearningPattern[] = []

    // 1. 按 type 分组
    const byType = new Map<CorrectionType, CorrectionRecord[]>()
    for (const c of accepted) {
      if (!byType.has(c.type)) byType.set(c.type, [])
      byType.get(c.type)!.push(c)
    }

    for (const [type, records] of byType) {
      // 2. 按 dayElement / monthZhi / wangShuai 聚类
      const clusters = new Map<string, CorrectionRecord[]>()
      for (const rec of records) {
        const wangShuai = extractFieldFromSnapshot(rec.engineSnapshot, 'wangShuai') || ''
        const key = [rec.dayElement || '', rec.monthZhi || '', wangShuai].join('|')
        if (!clusters.has(key)) clusters.set(key, [])
        clusters.get(key)!.push(rec)
      }

      for (const [key, clusterRecs] of clusters) {
        // 3. 统计 correctedValue 频次，取最常见的值
        const valueBuckets = new Map<string, CorrectionRecord[]>()
        for (const rec of clusterRecs) {
          if (!valueBuckets.has(rec.correctedValue)) valueBuckets.set(rec.correctedValue, [])
          valueBuckets.get(rec.correctedValue)!.push(rec)
        }
        const sortedBuckets = Array.from(valueBuckets.entries())
          .sort((a, b) => b[1].length - a[1].length)
        if (sortedBuckets.length === 0) continue

        const [topValue, topRecs] = sortedBuckets[0]
        const supportCount = topRecs.length

        // 4. 支持数不足则跳过
        if (supportCount < MIN_SUPPORT_COUNT) continue

        // 5. 置信度 = min(支持数 × 15 + 平均等级权重, 95)
        const avgWeight = topRecs.reduce(
          (s, r) => s + CORRECTOR_LEVEL_WEIGHT[r.correctorLevel],
          0
        ) / supportCount
        const rawConfidence = supportCount * SUPPORT_CONFIDENCE_FACTOR + avgWeight
        const confidence = Math.min(rawConfidence, MAX_PATTERN_CONFIDENCE)

        // 构建条件（来自聚类键）
        const [dayElement, monthZhi, wangShuai] = key.split('|')
        const conditions: PatternCondition[] = []
        if (dayElement) {
          conditions.push({ field: 'dayElement', operator: 'equals', value: dayElement })
        }
        if (monthZhi) {
          conditions.push({ field: 'monthZhi', operator: 'equals', value: monthZhi })
        }
        if (wangShuai) {
          conditions.push({ field: 'wangShuai', operator: 'equals', value: wangShuai })
        }

        const now = new Date().toISOString()
        extracted.push({
          id: this.generateId('auto'),
          name: this.buildPatternName(type, conditions, topValue),
          type,
          conditions,
          recommendation: topValue,
          supportCount,
          confidence: Math.round(confidence * 10) / 10,
          sourceRecords: topRecs.map(r => r.id),
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    return extracted
  }

  /**
   * mergeExtractedPatterns — 合并提取结果到内部模式库
   *
   * 策略：保留所有 manual- 模式，清除并重建所有 auto- 模式。
   * 这样自动模式始终反映最新修正数据，手动模式不被覆盖。
   */
  private mergeExtractedPatterns(extracted: LearningPattern[]): void {
    const manual: LearningPattern[] = []
    for (const p of this.patterns.values()) {
      if (p.id.startsWith('manual-')) manual.push(p)
    }
    this.patterns.clear()
    for (const p of manual) this.patterns.set(p.id, p)
    for (const p of extracted) this.patterns.set(p.id, p)
  }

  /**
   * updatePatternConfidence — 依据来源修正重新计算模式置信度
   *
   * 当某条修正的反馈或状态变化时，引用它的模式应同步刷新。
   */
  private updatePatternConfidence(patternId: string): void {
    const pattern = this.patterns.get(patternId)
    if (!pattern) return
    const recs = pattern.sourceRecords
      .map(id => this.corrections.get(id))
      .filter((r): r is CorrectionRecord => r !== undefined)
    if (recs.length === 0) return

    const avgWeight = recs.reduce(
      (s, r) => s + CORRECTOR_LEVEL_WEIGHT[r.correctorLevel],
      0
    ) / recs.length
    pattern.supportCount = recs.length
    const rawConfidence = recs.length * SUPPORT_CONFIDENCE_FACTOR + avgWeight
    pattern.confidence = Math.round(Math.min(rawConfidence, MAX_PATTERN_CONFIDENCE) * 10) / 10
    pattern.updatedAt = new Date().toISOString()
  }

  /** 刷新所有引用指定修正的模式置信度 */
  private refreshPatternsReferencing(correctionId: string): void {
    for (const p of this.patterns.values()) {
      if (p.sourceRecords.includes(correctionId)) {
        this.updatePatternConfidence(p.id)
      }
    }
  }

  /**
   * generateRecommendations — 生成推荐（内部核心）
   *
   * 遍历所有模式，匹配当前命盘者生成推荐，按置信度倒序排列。
   */
  private generateRecommendations(
    input: LearningEngineInput
  ): { recommendations: CorrectionRecommendation[]; matched: LearningPattern[] } {
    const recommendations: CorrectionRecommendation[] = []
    const matched: LearningPattern[] = []

    for (const pattern of this.patterns.values()) {
      if (!this.matchPattern(pattern, input)) continue
      matched.push(pattern)

      const currentValue = this.getCurrentValueForType(pattern.type, input) ?? ''
      recommendations.push({
        type: pattern.type,
        currentValue,
        recommendedValue: pattern.recommendation,
        reason: this.buildRecommendationReason(pattern, currentValue),
        confidence: pattern.confidence,
        patternId: pattern.id,
        supportCount: pattern.supportCount,
      })
    }

    // 按置信度倒序，置信度相同则按支持数倒序
    recommendations.sort((a, b) => {
      if (b.confidence !== a.confidence) return b.confidence - a.confidence
      return b.supportCount - a.supportCount
    })

    return { recommendations, matched }
  }

  /**
   * getCurrentValueForType — 取当前引擎结果中对应类型的值
   *
   * career/wealth/marriage/health 等建议类修正不在 currentResults 内，
   * 返回 undefined（推荐时 currentValue 留空，仅作参考）。
   */
  private getCurrentValueForType(
    type: CorrectionType,
    input: LearningEngineInput
  ): string | undefined {
    const r = input.currentResults
    if (!r) return undefined
    switch (type) {
      case 'yongShen': return r.yongShen
      case 'xiShen': return r.xiShen
      case 'jiShen': return r.jiShen
      case 'wangShuai': return r.wangShuai
      case 'geJu': return r.geJu
      case 'pattern': return r.pattern
      case 'tiaoHou': return r.tiaoHou
      default: return undefined
    }
  }

  /** computePatternStats — 计算学习模式统计 */
  private computePatternStats(): LearningResult['patternStats'] {
    const all = Array.from(this.patterns.values())
    const byType: Record<string, number> = {}
    let confSum = 0
    for (const p of all) {
      byType[p.type] = (byType[p.type] || 0) + 1
      confSum += p.confidence
    }
    return {
      totalPatterns: all.length,
      byType,
      avgConfidence: all.length > 0
        ? Math.round((confSum / all.length) * 10) / 10
        : 0,
    }
  }

  /** buildPatternName — 构建模式名称 */
  private buildPatternName(
    type: CorrectionType,
    conditions: PatternCondition[],
    recommendation: string
  ): string {
    const typeLabel = CORRECTION_TYPE_LABEL[type] || type
    const condParts = conditions.map(c => {
      const v = Array.isArray(c.value) ? c.value.join('/') : String(c.value)
      return `${c.field}=${v}`
    })
    const condStr = condParts.length > 0 ? `（${condParts.join('，')}）` : ''
    return `${typeLabel}修正规律${condStr}→${recommendation}`
  }

  /** buildRecommendationReason — 构建推荐理由（随机选择避免模板化） */
  private buildRecommendationReason(
    pattern: LearningPattern,
    currentValue: string
  ): string {
    const typeLabel = CORRECTION_TYPE_LABEL[pattern.type] || pattern.type
    const templates = [
      `基于历史${pattern.supportCount}条已采纳的${typeLabel}修正记录，在相似命局条件下，多被修正为"${pattern.recommendation}"，置信度${pattern.confidence}%。`,
      '学习系统从' + pattern.supportCount + '条' + typeLabel + '修正中归纳出此规律：当前条件下建议值为"' + pattern.recommendation + '"。',
      `历史修正数据显示，满足此条件的命局中，${typeLabel}以"${pattern.recommendation}"为常见修正方向（支持数${pattern.supportCount}，置信度${pattern.confidence}%）。`,
      `经聚类分析，${pattern.supportCount}条专家${typeLabel}修正指向同一方向"${pattern.recommendation}"，已形成可复用规律。`,
    ]
    let reason = pick(templates)
    if (currentValue && currentValue !== pattern.recommendation) {
      reason += '当前引擎值为"' + currentValue + '"，与建议值存在差异，宜请专家复核。'
    } else if (currentValue && currentValue === pattern.recommendation) {
      reason += '当前引擎值与建议值一致，历史修正规律印证引擎判断。'
    }
    return reason
  }

  /** buildSummary — 生成学习结果摘要 */
  private buildSummary(
    recommendations: CorrectionRecommendation[],
    matched: LearningPattern[],
    status: LearningResult['systemStatus']
  ): string {
    const parts: string[] = []

    // 开头综述
    const openers = [
      '学习引擎已基于' + status.totalCorrections + '条历史修正记录与' + status.totalPatterns + '条学习模式完成当前命局的智能推演。',
      '本次推演综合分析了' + status.totalCorrections + '条修正数据，提取' + status.totalPatterns + '条学习规律，学习准确率' + status.learningAccuracy + '%。',
      `学习系统持续积累经验，当前共${status.totalCorrections}条修正记录、${status.totalPatterns}条模式，为本次命局匹配到${matched.length}条相关规律。`,
      `经学习引擎运算：累计修正${status.totalCorrections}条（已采纳${status.acceptedCorrections}条）、模式${status.totalPatterns}条、反馈准确率${status.learningAccuracy}%。`,
    ]
    parts.push(pick(openers))

    // 推荐内容
    if (recommendations.length === 0) {
      const emptyTexts = [
        '当前命局未匹配到已有学习模式，暂无修正建议。随着修正记录的积累，系统将逐步形成可复用的命理规律。',
        '尚无匹配的学习模式可供参考。学习引擎如白纸待书，待专家修正渐多，自能见微知著。',
        '本命局暂无历史修正可参考。建议专家在审阅后留下修正意见，以充实学习语料。',
      ]
      parts.push(pick(emptyTexts))
    } else {
      const needFix = recommendations.filter(
        r => r.currentValue && r.currentValue !== r.recommendedValue
      )
      const introTexts = [
        '共匹配' + matched.length + '条学习模式，生成' + recommendations.length + '条修正建议（其中' + needFix.length + '条与当前引擎值存在差异），按置信度排序如下：',
        '本次命中' + matched.length + '条学习规律，输出' + recommendations.length + '条建议；其中' + needFix.length + '条宜复核引擎原值：',
      ]
      parts.push(pick(introTexts))
      for (const rec of recommendations.slice(0, 5)) {
        const typeLabel = CORRECTION_TYPE_LABEL[rec.type] || rec.type
        const cur = rec.currentValue || '（空）'
        parts.push(
          `  · ${typeLabel}：${cur} → ${rec.recommendedValue}（置信度${rec.confidence}%，支持${rec.supportCount}条）`
        )
      }
    }

    // 修正热点提示
    const hotspots = this.getCorrectionHotspots()
    if (hotspots.length > 0) {
      const top = hotspots[0]
      const topLabel = CORRECTION_TYPE_LABEL[top.type] || top.type
      const hotspotTexts = [
        `修正热点：${topLabel}类修正最为频繁（${top.count}条，占${top.percentage}%），引擎在此维度最需向专家学习。`,
        `数据显示，${topLabel}方向的历史修正最多（${top.percentage}%），是引擎优化的重点方向。`,
      ]
      parts.push(pick(hotspotTexts))
    }

    // 结尾古训
    const closers = [
      '《荀子》云："君子生非异也，善假于物也。"学习引擎正是借历史修正之"物"，助未来分析之"用"。',
      '系统将持续记录每一次专家修正，于实践中沉淀命理智慧，实现"学而时习之"的良性循环。',
      '《易经》云："天行健，君子以自强不息。"引擎亦当如此，于修正反馈中自我精进，永不停滞。',
    ]
    parts.push(pick(closers))

    return parts.join('\n')
  }

  /** buildClassicalRef — 生成古籍引用（随机排列避免模板化） */
  private buildClassicalRef(): string {
    const refs = [
      '《论语》："学而不思则罔，思而不学则殆。"——学习引擎以思（归纳模式）与学（积累修正）并重，缺一则罔殆。',
      '《易经》："天行健，君子以自强不息。"——引擎持续学习、自我优化，于反馈中精进不止。',
      '《荀子》："君子生非异也，善假于物也。"——借专家之修正，成引擎之智慧；善假于物，方能日进。',
    ]
    return pickN(refs, refs.length).join('\n')
  }

  // ───────────────────────────────────────────────────────
  // 调试与展示辅助（非调试输出，供上层展示用）
  // ───────────────────────────────────────────────────────

  /**
   * describeCorrection — 以中文描述一条修正记录（供上层展示/日志）
   *
   * 注意：此方法不产生任何调试输出，仅返回描述文本。
   */
  describeCorrection(id: string): string {
    const c = this.corrections.get(id)
    if (!c) return `未找到修正记录：${id}`
    const typeLabel = CORRECTION_TYPE_LABEL[c.type] || c.type
    const statusLabel = CORRECTION_STATUS_LABEL[c.status] || c.status
    const sourceLabel = CORRECTION_SOURCE_LABEL[c.source] || c.source
    const templates = [
      `[${typeLabel}修正] ${c.corrector}（${sourceLabel}）于 ${c.timestamp} 将"${c.originalValue}"修正为"${c.correctedValue}"，状态：${statusLabel}。`,
      `${c.corrector}${sourceLabel}提出${typeLabel}修正：${c.originalValue}→${c.correctedValue}（${statusLabel}），理由：${c.reason}`,
      `修正记录#${c.id.slice(-6)}｜${typeLabel}｜${c.corrector}｜${c.originalValue}→${c.correctedValue}｜${statusLabel}｜置信度${c.confidence}`,
    ]
    return pick(templates)
  }
}
