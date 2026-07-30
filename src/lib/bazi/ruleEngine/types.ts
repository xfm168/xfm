export interface EvidenceItem {
  id: string;
  rule: string;
  level: 'core' | 'support' | 'counter';
  result: 'satisfied' | 'partially' | 'failed';
  weight: number;
  description: string;
  source?: string;
  trace?: Record<string, any>;
}

export interface EvidenceBundle {
  conclusion: string;
  direction: 'good' | 'bad' | 'neutral';
  items: EvidenceItem[];
  coreSatisfied: number;
  coreTotal: number;
  counterHits: number;
  counterThreshold: number;
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

export interface RuleDefinition<TInput = any, TResult = any> {
  id: string;
  name: string;
  category: RuleCategory;
  description: string;
  source?: string;
  evaluate: (input: TInput, context?: any) => (EvidenceBundle & { result?: TResult }) | Promise<EvidenceBundle & { result?: TResult }>;
  priority: number;
  /** P0-A3 新增：依赖的其他规则 ID（必须先执行这些规则） */
  dependencies?: string[];
  /** P0-A3 新增：规则标签（用于过滤和分组） */
  tags?: string[];
  /** P0-A3 新增：规则状态（sandbox=沙箱测试中, active=正式启用, deprecated=已废弃） */
  status?: 'sandbox' | 'active' | 'deprecated';
  /** P0-A3 新增：规则版本（用于变更追踪） */
  version?: string;
}

export interface Confidence {
  value: number;
  level: 'low' | 'medium' | 'high' | 'very_high';
  breakdown: Array<{
    name: string;
    contribution: number;
    weightPct: number;
  }>;
  uncertainty?: string[];
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

/**
 * Confidence 扩展字段（V⑤ ConfidenceEngine 独立入口需要）
 * 通过 TypeScript declaration merging 附加到原有 Confidence 接口
 */
export interface Confidence {
  /** 各组件权重（原局/大运/流年/调候/格局/其他） */
  components?: Partial<Record<'yuanju' | 'dayun' | 'liunian' | 'tiaohou' | 'geju' | 'other', number>>
  /** 可信度备注（附加说明、扣分项说明等） */
  notes?: string[]
}
