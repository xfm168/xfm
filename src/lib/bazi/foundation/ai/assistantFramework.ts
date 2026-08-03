/**
 * P0-5 Part 7: AI Assistant Framework — AI 助手框架
 *
 * 两大核心类：
 *   1. AIContextBuilder — 将 DecisionResult 构建为分层 AIContext
 *      六层上下文：基础信息 / 决策结果 / 证据树 / 古籍引用 / 质量评估 / 案例相似度
 *      支持 Token 估算和自动截断（按重要性保留）
 *
 *   2. PromptBuilder — 基于模板生成 AI Prompt
 *      六种内置模板 + 自定义模板注册
 *      每个模板生成系统消息（角色定义）+ 用户消息（上下文 + 问题）
 *
 * 设计原则：
 *   - AI 层只读取 DecisionResult，绝不重新推理
 *   - 上下文分层，可按重要性截断
 *   - Prompt 模板化，支持自定义扩展
 */

import type { DecisionResult } from '../../xiyongshen/engines/fusion/types'
import type {
  AIContextLayer,
  AIContext,
  PromptTemplateType,
  AIPromptResult,
} from '../types'

// ============================================================
// 选项类型
// ============================================================

/** AI 上下文构建选项 */
export interface AIContextBuildOptions {
  /** 基础信息补充（DecisionResult 不含日主/四柱） */
  basicInfo?: {
    /** 日主天干（如 '甲'） */
    dayGan?: string
    /** 日主五行（如 '木'） */
    dayGanWuxing?: string
    /** 四柱 */
    fourPillars?: Array<{ gan: string; zhi: string }>
    /** 性别 */
    gender?: string
    /** 出生日期 */
    birthDate?: string
  }
  /** 最大 Token 数（超出自动截断） */
  maxTokens?: number
  /** 包含的层次名称（不指定则全部） */
  includeLayers?: string[]
}

/** Prompt 构建选项 */
export interface PromptBuildOptions {
  /** 自定义问题（覆盖模板默认问题） */
  question?: string
  /** 详情级别 */
  detailLevel?: 'basic' | 'standard' | 'detailed'
  /** 期望返回格式覆盖 */
  expectedFormat?: 'json' | 'text' | 'markdown'
}

// ============================================================
// Prompt 模板接口
// ============================================================

/** Prompt 模板定义 */
export interface PromptTemplate {
  /** 系统消息构建函数（角色定义） */
  buildSystem: (context: AIContext) => string
  /** 用户消息构建函数（上下文 + 问题） */
  buildUser: (context: AIContext, options?: PromptBuildOptions) => string
  /** 期望返回格式 */
  expectedFormat: 'json' | 'text' | 'markdown'
  /** 格式说明 */
  formatSpec?: string
}

// ============================================================
// 层次显示名称映射
// ============================================================

const LAYER_DISPLAY_NAMES: Record<string, string> = {
  basic: '基础信息',
  decision: '决策结果',
  evidence: '证据树',
  classic: '古籍引用',
  quality: '质量评估',
  caseSimilarity: '案例相似度',
}

// ============================================================
// AIContextBuilder — AI 上下文构建器
// ============================================================

/**
 * AI 上下文构建器
 *
 * 将 DecisionResult 构建为分层的 AIContext：
 *   1. basic       基础信息（日主/四柱/流派）
 *   2. decision    决策结果（喜用神/格局/策略）
 *   3. evidence    证据树（Evidence/引擎/古籍）
 *   4. classic     古籍引用（支持度/引用数）
 *   5. quality     质量评估（准确率/解释评分/置信度）
 *   6. caseSimilarity 案例相似度（Top-N 匹配）
 */
export class AIContextBuilder {
  /** 最近构建的上下文（供 truncate 使用） */
  private _lastContext: AIContext | null = null

  /**
   * 构建 AI 上下文
   *
   * @param result 决策结果
   * @param options 构建选项
   * @returns 分层 AIContext
   */
  build(result: DecisionResult, options?: AIContextBuildOptions): AIContext {
    // ===== 构建六层上下文 =====
    const allLayers: AIContextLayer[] = [
      this._buildBasicLayer(result, options),
      this._buildDecisionLayer(result),
      this._buildEvidenceLayer(result),
      this._buildClassicLayer(result),
      this._buildQualityLayer(result),
      this._buildCaseSimilarityLayer(result),
    ]

    // 按需过滤层次
    const layers = options?.includeLayers
      ? allLayers.filter(l => options.includeLayers!.includes(l.name))
      : allLayers

    // 构建完整上下文文本
    const fullContext = this._buildFullContext(layers)
    const estimatedTokens = this.estimateTokens(fullContext)

    const context: AIContext = {
      contextId: `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      builtAt: Date.now(),
      layers,
      estimatedTokens,
      fullContext,
    }

    this._lastContext = context

    // 自动截断（如指定 maxTokens 且超出）
    if (options?.maxTokens && estimatedTokens > options.maxTokens) {
      return this.truncate(options.maxTokens)
    }

    return context
  }

  /**
   * 估算文本 Token 数
   *
   * 中文约 1.5 字符/token，英文约 4 字符/token
   * 混合内容取折中值 ~2 字符/token
   */
  estimateTokens(text: string): number {
    if (!text) return 0
    return Math.ceil(text.length / 2)
  }

  /**
   * 截断上下文（按重要性保留层次）
   *
   * 逐步移除重要性最低的层次，直到 Token 数 <= maxTokens
   */
  truncate(maxTokens: number): AIContext {
    if (!this._lastContext) {
      throw new Error('没有可截断的上下文，请先调用 build()')
    }

    // 按重要性降序排列（保留重要的，移除不重要的）
    const sorted = [...this._lastContext.layers].sort(
      (a, b) => b.importance - a.importance,
    )

    // 逐步移除最低重要性的层次
    let kept = [...sorted]
    while (kept.length > 1) {
      const fullContext = this._buildFullContext(kept)
      if (this.estimateTokens(fullContext) <= maxTokens) break
      kept.pop()
    }

    const fullContext = this._buildFullContext(kept)
    const estimatedTokens = this.estimateTokens(fullContext)

    const truncated: AIContext = {
      ...this._lastContext,
      layers: kept,
      estimatedTokens,
      fullContext,
    }

    this._lastContext = truncated
    return truncated
  }

  // ============================================================
  // 各层次构建方法
  // ============================================================

  /** 基础信息层（日主/四柱/流派） */
  private _buildBasicLayer(
    result: DecisionResult,
    options?: AIContextBuildOptions,
  ): AIContextLayer {
    const basicInfo = options?.basicInfo
    const data = {
      system: result.system,
      school: result.school,
      engineVersion: result.engineVersion,
      dayGan: basicInfo?.dayGan ?? null,
      dayGanWuxing: basicInfo?.dayGanWuxing ?? null,
      fourPillars: basicInfo?.fourPillars ?? null,
      gender: basicInfo?.gender ?? null,
      birthDate: basicInfo?.birthDate ?? null,
    }

    const parts: string[] = [`命理系统：${result.system}，流派：${result.school}，引擎版本：${result.engineVersion}`]
    if (data.dayGan) {
      parts.push(`日主：${data.dayGan}${data.dayGanWuxing ?? ''}`)
    }
    if (data.fourPillars && data.fourPillars.length > 0) {
      parts.push(`四柱：${data.fourPillars.map(p => `${p.gan}${p.zhi}`).join(' / ')}`)
    }
    if (data.gender) parts.push(`性别：${data.gender}`)
    if (data.birthDate) parts.push(`出生：${data.birthDate}`)

    return {
      name: 'basic',
      data,
      summary: parts.join('。') + '。',
      importance: 1.0,
    }
  }

  /** 决策结果层（喜用神/格局/策略） */
  private _buildDecisionLayer(result: DecisionResult): AIContextLayer {
    const data = {
      primaryYongShen: result.primaryYongShen,
      secondaryYongShen: result.secondaryYongShen,
      assistantGod: result.assistantGod,
      avoidGod: result.avoidGod,
      idleGod: result.idleGod,
      isMultiYongShen: result.isMultiYongShen,
      multiYongShenPattern: result.multiYongShenPattern,
      strategy: result.strategy,
      metaStrategy: result.metaDecision?.primaryStrategy,
      summary: result.summary,
    }

    const parts: string[] = [
      `主用神：${result.primaryYongShen}`,
      `喜神：${result.assistantGod}`,
      `忌神：${result.avoidGod}`,
      `闲神：${result.idleGod}`,
    ]
    if (result.secondaryYongShen) {
      parts.push(`次用神：${result.secondaryYongShen}`)
    }
    if (result.isMultiYongShen) {
      parts.push(`多用神模式：${result.multiYongShenPattern ?? '并用'}`)
    }
    parts.push(`决策策略：${result.strategy}`)

    return {
      name: 'decision',
      data,
      summary: parts.join('，') + '。',
      importance: 0.95,
    }
  }

  /** 证据树层（Evidence/引擎/古籍） */
  private _buildEvidenceLayer(result: DecisionResult): AIContextLayer {
    const tree = result.evidenceTree
    const engineCount = result.subEngineResults?.length ?? 0

    const data = {
      totalEvidence: tree?.totalEvidence ?? 0,
      satisfiedEvidence: tree?.satisfiedEvidence ?? 0,
      completeness: tree?.completeness ?? 0,
      classics: tree?.classics ?? [],
      totalClassicRefs: tree?.totalClassicRefs ?? 0,
      engineCount,
      maxDepth: tree?.maxDepth ?? 0,
      totalNodeCount: tree?.totalNodeCount ?? 0,
    }

    const parts: string[] = []
    if (tree) {
      parts.push(`证据树包含 ${engineCount} 个引擎`)
      parts.push(`共 ${tree.totalEvidence} 条 Evidence，${tree.satisfiedEvidence} 条满足`)
      parts.push(`完整度：${(tree.completeness * 100).toFixed(0)}%`)
      if (tree.classics && tree.classics.length > 0) {
        parts.push(`涉及古籍：${tree.classics.join('、')}`)
      }
      parts.push(`古籍引用 ${tree.totalClassicRefs} 处`)
    } else {
      parts.push('无证据树数据')
    }

    return {
      name: 'evidence',
      data,
      summary: parts.join('，') + '。',
      importance: 0.8,
    }
  }

  /** 古籍引用层（支持度/引用数） */
  private _buildClassicLayer(result: DecisionResult): AIContextLayer {
    const classicSupport = result.classicSupport ?? {}
    const data: Record<string, any> = {}
    const parts: string[] = []

    for (const [wuxing, support] of Object.entries(classicSupport)) {
      data[wuxing] = {
        classicCount: support.classicCount,
        totalRefCount: support.totalRefCount,
        supportScore: support.supportScore,
      }
      parts.push(`${wuxing}(${(support.supportScore * 100).toFixed(0)}%)`)
    }

    const summary = parts.length > 0
      ? `古籍支持度：${parts.join('，')}。`
      : '无古籍支持度数据。'

    return {
      name: 'classic',
      data,
      summary,
      importance: 0.75,
    }
  }

  /** 质量评估层（准确率/解释评分/置信度） */
  private _buildQualityLayer(result: DecisionResult): AIContextLayer {
    const data = {
      confidence: result.confidence,
      accuracyScore: result.accuracyScore?.overallAccuracyScore ?? null,
      internalConsistency: result.accuracyScore?.internalConsistency ?? null,
      classicConsistency: result.accuracyScore?.classicConsistency ?? null,
      schoolConsistency: result.accuracyScore?.schoolConsistency ?? null,
      explainScore: result.explainScore?.totalScore ?? null,
      explainCompleteness: result.explainScore?.completeness ?? null,
      explainReadability: result.explainScore?.readability ?? null,
      improvementHints: result.explainScore?.improvementHints ?? [],
    }

    const parts: string[] = [`置信度：${(result.confidence * 100).toFixed(0)}%`]
    if (result.accuracyScore) {
      parts.push(`准确率：${(result.accuracyScore.overallAccuracyScore * 100).toFixed(0)}%`)
    }
    if (result.explainScore) {
      parts.push(`解释评分：${result.explainScore.totalScore}/100`)
    }

    return {
      name: 'quality',
      data,
      summary: parts.join('，') + '。',
      importance: 0.6,
    }
  }

  /** 案例相似度层（Top-N 匹配） */
  private _buildCaseSimilarityLayer(result: DecisionResult): AIContextLayer {
    const sim = result.caseSimilarity
    const data = {
      maxSimilarity: sim?.maxSimilarity ?? 0,
      topMatches: sim?.topMatches?.slice(0, 3).map(m => ({
        caseId: m.caseId,
        caseName: m.caseName,
        similarity: m.similarity,
        lifeSummary: m.lifeSummary ?? null,
      })) ?? [],
    }

    const parts: string[] = []
    if (sim && sim.topMatches && sim.topMatches.length > 0) {
      parts.push(`最高相似度：${(sim.maxSimilarity * 100).toFixed(0)}%`)
      const top = sim.topMatches[0]
      parts.push(`最相似命例：${top.caseName}（${(top.similarity * 100).toFixed(0)}%）`)
      if (top.lifeSummary) {
        parts.push(`命例参考：${top.lifeSummary}`)
      }
    } else {
      parts.push('无相似命例数据')
    }

    return {
      name: 'caseSimilarity',
      data,
      summary: parts.join('，') + '。',
      importance: 0.5,
    }
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /** 构建完整上下文文本（拼接各层摘要） */
  private _buildFullContext(layers: AIContextLayer[]): string {
    return layers
      .map(l => {
        const displayName = LAYER_DISPLAY_NAMES[l.name] ?? l.name
        return `=== ${displayName} ===\n${l.summary}`
      })
      .join('\n\n')
  }
}

// ============================================================
// PromptBuilder — Prompt 模板构建器
// ============================================================

/**
 * Prompt 模板构建器
 *
 * 内置六种模板 + 支持自定义模板注册：
 *   - bazi_full_analysis   八字完整分析
 *   - xiyongshen_explain   喜用神解释
 *   - geju_analysis        格局分析
 *   - dayun_forecast       大运预测
 *   - case_similarity      案例相似度
 *   - quality_report       质量报告
 */
export class PromptBuilder {
  /** 已注册的模板 */
  private _templates: Map<PromptTemplateType, PromptTemplate> = new Map()

  constructor() {
    // 注册内置模板
    this._registerDefaults()
  }

  /**
   * 构建 Prompt
   *
   * @param type 模板类型
   * @param context AI 上下文
   * @param options 构建选项
   * @returns AI Prompt 结果
   */
  build(
    type: PromptTemplateType,
    context: AIContext,
    options?: PromptBuildOptions,
  ): AIPromptResult {
    const template = this._templates.get(type)
    if (!template) {
      throw new Error(`未找到模板类型：${type}（请先注册模板）`)
    }

    const systemMessage = template.buildSystem(context)
    const userMessage = template.buildUser(context, options)
    const expectedFormat = options?.expectedFormat ?? template.expectedFormat

    return {
      templateType: type,
      systemMessage,
      userMessage,
      context,
      expectedFormat,
      formatSpec: template.formatSpec,
    }
  }

  /**
   * 列出所有可用模板类型
   */
  listTemplates(): PromptTemplateType[] {
    return [...this._templates.keys()]
  }

  /**
   * 注册自定义模板
   *
   * @param type 模板类型（可覆盖内置模板）
   * @param template 模板定义
   */
  registerTemplate(type: PromptTemplateType, template: PromptTemplate): void {
    this._templates.set(type, template)
  }

  // ============================================================
  // 内置模板注册
  // ============================================================

  /** 注册内置默认模板 */
  private _registerDefaults(): void {
    // 1. 八字完整分析
    this._templates.set('bazi_full_analysis', {
      buildSystem: () =>
        '你是一位精通八字命理的大师，拥有深厚的古籍功底和现代命理分析能力。'
        + '请用专业、客观、积极的语言为用户分析八字。'
        + '注意：命由己造，运靠人为，多讲积极面，少讲消极面，建议要具体可行。',
      buildUser: (ctx, opts) => {
        const detail = opts?.detailLevel ?? 'standard'
        const question = opts?.question ?? this._getBaziQuestion(detail)
        return this._formatUserMessage(ctx, question)
      },
      expectedFormat: 'json',
      formatSpec: '{ personality: string, career: string, wealth: string, '
        + 'relationship: string, health: string, family: string, '
        + 'luck: string, suggestions: string[] }',
    })

    // 2. 喜用神解释
    this._templates.set('xiyongshen_explain', {
      buildSystem: () =>
        '你是喜用神理论专家，精通调候、扶抑、病药、通关等各体系。'
        + '请基于提供的决策结果和证据，详细解释喜用神的判定依据。'
        + '要求：引用古籍原文、解释各引擎投票过程、说明冲突裁决理由。',
      buildUser: (ctx, opts) => {
        const detail = opts?.detailLevel ?? 'standard'
        const question = opts?.question ?? this._getXiyongshenQuestion(detail)
        return this._formatUserMessage(ctx, question)
      },
      expectedFormat: 'markdown',
    })

    // 3. 格局分析
    this._templates.set('geju_analysis', {
      buildSystem: () =>
        '你是八字格局分析专家，精通正格、变格、特殊格局的判定与取用。'
        + '请基于提供的命局信息，分析格局特点、成立条件和取用方向。',
      buildUser: (ctx, opts) => {
        const detail = opts?.detailLevel ?? 'standard'
        const question = opts?.question ?? this._getGejuQuestion(detail)
        return this._formatUserMessage(ctx, question)
      },
      expectedFormat: 'markdown',
    })

    // 4. 大运预测
    this._templates.set('dayun_forecast', {
      buildSystem: () =>
        '你是大运流年预测专家，精通大运排法与流年吉凶推断。'
        + '请基于当前用神分析大运流年趋势，指出有利和不利的大运阶段。',
      buildUser: (ctx, opts) => {
        const detail = opts?.detailLevel ?? 'standard'
        const question = opts?.question ?? this._getDayunQuestion(detail)
        return this._formatUserMessage(ctx, question)
      },
      expectedFormat: 'markdown',
    })

    // 5. 案例相似度
    this._templates.set('case_similarity', {
      buildSystem: () =>
        '你是命例对比分析专家，擅长从相似命例中提取规律。'
        + '请分析与历史相似命例的异同，并参考相似命例的结论给出建议。',
      buildUser: (ctx, opts) => {
        const detail = opts?.detailLevel ?? 'standard'
        const question = opts?.question ?? this._getCaseSimQuestion(detail)
        return this._formatUserMessage(ctx, question)
      },
      expectedFormat: 'text',
    })

    // 6. 质量报告
    this._templates.set('quality_report', {
      buildSystem: () =>
        '你是命理质量评估专家，负责评估命理分析的准确性和完整性。'
        + '请生成质量评估报告，包括准确率分析、解释评分、改进建议。',
      buildUser: (ctx, opts) => {
        const detail = opts?.detailLevel ?? 'standard'
        const question = opts?.question ?? this._getQualityQuestion(detail)
        return this._formatUserMessage(ctx, question)
      },
      expectedFormat: 'markdown',
    })
  }

  // ============================================================
  // 默认问题生成（按详情级别）
  // ============================================================

  /** 八字完整分析问题 */
  private _getBaziQuestion(detail: 'basic' | 'standard' | 'detailed'): string {
    if (detail === 'basic') {
      return '请简要分析此八字的核心特点（性格、事业、财运）。'
    }
    if (detail === 'detailed') {
      return '请从以下方面详细分析此八字：\n'
        + '1. 性格特质与天赋潜能\n'
        + '2. 事业方向与发展阶段\n'
        + '3. 财富格局与理财策略\n'
        + '4. 感情婚姻趋势\n'
        + '5. 健康体质注意事项\n'
        + '6. 家庭六亲关系\n'
        + '7. 大运流年走势预测\n'
        + '8. 改运建议（至少5条具体建议）'
    }
    return '请从性格、事业、财富、感情、健康、家庭、大运等方面全面分析此八字。'
  }

  /** 喜用神解释问题 */
  private _getXiyongshenQuestion(detail: 'basic' | 'standard' | 'detailed'): string {
    if (detail === 'basic') {
      return '请简要说明为何取此用神。'
    }
    if (detail === 'detailed') {
      return '请详细解释喜用神的判定依据，包括：\n'
        + '1. 为何取此用神（核心依据）\n'
        + '2. 引用了哪些古籍原文\n'
        + '3. 各引擎的投票过程\n'
        + '4. 冲突裁决理由\n'
        + '5. 与其他流派的异同'
    }
    return '请详细解释喜用神的判定依据，包括为何取此用神、依据哪些古籍、各引擎的投票过程。'
  }

  /** 格局分析问题 */
  private _getGejuQuestion(detail: 'basic' | 'standard' | 'detailed'): string {
    if (detail === 'basic') {
      return '请简要说明此八字的格局类型。'
    }
    if (detail === 'detailed') {
      return '请详细分析此八字的格局：\n'
        + '1. 格局类型与成立条件\n'
        + '2. 格局高低评判\n'
        + '3. 取用方向（用神/忌神）\n'
        + '4. 格局破败与救护\n'
        + '5. 古籍依据'
    }
    return '请分析此八字的格局特点，说明格局成立条件和取用方向。'
  }

  /** 大运预测问题 */
  private _getDayunQuestion(detail: 'basic' | 'standard' | 'detailed'): string {
    if (detail === 'basic') {
      return '请简要指出有利和不利的大运阶段。'
    }
    if (detail === 'detailed') {
      return '请基于当前用神详细分析大运流年：\n'
        + '1. 各大运阶段吉凶\n'
        + '2. 有利大运（用神当旺）\n'
        + '3. 不利大运（忌神当旺）\n'
        + '4. 关键流年提示\n'
        + '5. 趋吉避凶建议'
    }
    return '请基于当前用神分析大运流年趋势，指出有利和不利的大运阶段。'
  }

  /** 案例相似度问题 */
  private _getCaseSimQuestion(detail: 'basic' | 'standard' | 'detailed'): string {
    if (detail === 'basic') {
      return '请简要说明与相似命例的异同。'
    }
    if (detail === 'detailed') {
      return '请详细分析与历史相似命例的异同：\n'
        + '1. 相似命例的用神对比\n'
        + '2. 命局特征异同\n'
        + '3. 相似命例的人生轨迹参考\n'
        + '4. 可借鉴的经验与教训'
    }
    return '请分析与历史相似命例的异同，并参考相似命例的结论给出建议。'
  }

  /** 质量报告问题 */
  private _getQualityQuestion(detail: 'basic' | 'standard' | 'detailed'): string {
    if (detail === 'basic') {
      return '请简要评估此次命理分析的质量。'
    }
    if (detail === 'detailed') {
      return '请生成详细质量评估报告：\n'
        + '1. 准确率分析（Rule/Engine/Decision 三级）\n'
        + '2. 解释评分（6 维度）\n'
        + '3. 证据完整度评估\n'
        + '4. 古籍引用质量\n'
        + '5. 改进建议（具体可操作）'
    }
    return '请生成质量评估报告，包括准确率分析、解释评分、改进建议。'
  }

  // ============================================================
  // 辅助方法
  // ============================================================

  /** 格式化用户消息（上下文 + 问题） */
  private _formatUserMessage(context: AIContext, question: string): string {
    return `【命理分析上下文】\n${context.fullContext}\n\n【分析要求】\n${question}`
  }
}

// ============================================================
// 全局单例
// ============================================================

/** 全局 AIContextBuilder 单例 */
export const globalAIContextBuilder = new AIContextBuilder()

/** 全局 PromptBuilder 单例 */
export const globalPromptBuilder = new PromptBuilder()
