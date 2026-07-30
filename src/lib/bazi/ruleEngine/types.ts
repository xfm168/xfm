export interface EvidenceItem {
  id: string
  rule: string
  ruleId?: string
  version?: string
  source?: string | string[]
  category?: RuleCategory
  result: boolean | 'partial' | 'satisfied' | 'partially' | 'failed'
  confidence?: number
  level: 'support' | 'weaken' | 'neutral' | 'strong_support' | 'strong_weaken' | 'core' | 'counter'
  weight: number
  description: string
  trace?: Array<{
    step: string
    text: string
    satisfied?: boolean
    satisfaction?: number
    citation?: string
  }>
  conditions?: RuleCondition[]
  meta?: Record<string, any>
}

export interface EvidenceBundle {
  ruleId?: string
  ruleName?: string
  items: EvidenceItem[]
  summary?: string
  narrative?: string
  version?: string
  conclusion?: string
  direction?: 'good' | 'bad' | 'neutral'
  coreSatisfied?: number
  coreTotal?: number
  counterHits?: number
  counterThreshold?: number
}

export type RuleCategory =
  | 'hehua'
  | 'geju'
  | 'xiyongshen'
  | 'tiaohou'
  | 'bingyao'
  | 'tongguan'
  | 'shensha'
  | 'fuyi'
  | 'wuxing';

/**
 * 规则成立条件（B2 规范）：
 * - 必须可以独立解释给用户，不得写成代码字符串
 * - traceable = true 表示该条件可被 EvidenceEngine 展开成追溯链
 */
export interface RuleCondition {
  /** 自然语言描述的条件（UI 可读） */
  description: string
  /** 条件类型：'required' 核心条件 / 'sufficient' 充分条件 / 'exception' 例外条件 */
  type: 'required' | 'sufficient' | 'exception'
  /** 判断此条件的依据（如 '月令=申金'、'甲己相合且化土'） */
  formula?: string
  /** 该条件是否满足（evaluate 时填充） */
  satisfied?: boolean
  /** 满足度（0~1），部分满足条件可用 */
  satisfaction?: number
  /** 是否可追溯（B3） */
  traceable?: boolean
  /** 满足时显示给用户的"为什么" */
  traceText?: string
}

/** 规则冲突策略（B2 规范） */
export type ConflictStrategy =
  | 'priority-then-vote'
  | 'majority-vote'
  | 'prefer-conservative'
  | 'prefer-newer'
  | 'reject-both'
  | 'custom'

export interface RuleDefinition<TInput = any, _TResult = any> {
  // 【强制10字段】B2 规范，禁止匿名规则
  /** 1. 规则 ID（全局唯一，如 GEJU-CONG-001）*/
  id: string
  /** 2. 版本号（语义化版本） */
  version: string
  /** 3. 优先级（数字越大越优先） */
  priority: number
  /** 4. 来源（书籍/标准名，如 '滴天髓' '子平真诠' '穷通宝鉴' 等） */
  source: string | string[]
  /** 5. 人类可读规则名描述（一句话说明该规则判断什么） */
  description: string
  /** 6. 成立条件集合（可追溯，B3） */
  condition: RuleCondition[]
  /** 7. 规则成立时的结论说明（人类可读） */
  result: string
  /** 8. 依据：规则成立时应产生的 EvidenceItem 模板 */
  evidence: Omit<EvidenceItem, 'id' | 'result'> & { resultOverride?: EvidenceItem['result'] }
  /** 9. 可信度构成：该规则可信度如何拆分 4 维度权重 */
  confidence: {
    components: Partial<Record<'calendar' | 'geju' | 'xiyongshen' | 'shensha', number>>
    note?: string
  }
  /** 10. 与其他规则结论冲突时的处理策略 */
  conflictStrategy: ConflictStrategy

  // 【扩展可选字段】
  name?: string
  category?: RuleCategory
  dependencies?: string[]
  tags?: string[]
  status?: 'sandbox' | 'active' | 'deprecated'
  /** 规则评估函数 */
  evaluate: (input: TInput, ctx?: { traceable?: boolean }) => EvidenceBundle | Promise<EvidenceBundle>
}

export interface Confidence {
  calendar: number
  geju: number
  xiyongshen: number
  shensha: number
  overall: number
  value: number
  level: 'low' | 'medium' | 'high' | 'very_high'
  breakdown: Array<{
    name: 'calendar' | 'geju' | 'xiyongshen' | 'shensha' | 'overall'
    contribution: number
    weightPct: number
  }>
  uncertainty?: string[]
  notes?: {
    calendar?: string
    geju?: string
    xiyongshen?: string
    shensha?: string
  }
  components?: Partial<Record<'yuanju' | 'dayun' | 'liunian' | 'tiaohou' | 'geju' | 'other', number>>
}

export type ScoreDimension =
  | 'career'
  | 'wealth'
  | 'marriage'
  | 'health'
  | 'study'
  | 'family'
  | 'luck'
  | 'social';

export interface DimensionScore {
  dimension: ScoreDimension | string;
  score: number;
  stars: number;
  level: 'excellent' | 'good' | 'average' | 'below' | 'poor';
  label: string;
  evidence: EvidenceBundle;
  confidence: Confidence;
}

export interface ComprehensiveScore {
  overall: number;
  level: string;
  dimensionScores: DimensionScore[];
  radarData: Record<string, number>;
}

/** 推演标准返回（V④ 三元约定）：任何核心推演必须返回 {result, evidence, confidence} */
export interface StandardInferenceResult<TResult> {
  /** 推演结论（可以是评分对象、格局名称、喜用神数组等任意结构） */
  result: TResult
  /** 论断依据（AI / UI / 专业模式共用） */
  evidence: EvidenceItem[]
  /** 可信度（拆分原局/大运/流年/调候/格局权重） */
  confidence: Confidence
}

/**
 * V④ 简化维度评分（三元约定专用）
 * 与现有 DimensionScore（含 evidence/confidence 的完整结构）并行，
 * 用于 StandardInferenceResult 的 result 字段
 */
export interface StandardDimensionScore {
  score: number          // 0~100
  level: 'great'|'good'|'neutral'|'bad'|'terrible'
  stars: number          // 1~5
  dimensions?: Record<string, number>  // 五行/十神子维度分
}

/** V④ 维度评分三元返回 */
export type DimensionScoreResult = StandardInferenceResult<StandardDimensionScore>



/** B2 规范默认兜底值（用于旧规则在 register 时补齐） */
export const DEFAULT_RULE_FALLBACKS: Omit<RuleDefinition, 'id'|'name'|'category'|'evaluate'> = {
  version: '0.0.0-unspec',
  priority: 0,
  source: '未指定（待补）',
  description: '',
  condition: [{ description: '待补充条件定义', type: 'required', traceable: false }],
  result: '规则结论待补充',
  evidence: { rule: '匿名规则', level: 'support', weight: 0.1, description: '该规则未按 B2 规范填写' },
  confidence: { components: {} },
  conflictStrategy: 'priority-then-vote',
}
