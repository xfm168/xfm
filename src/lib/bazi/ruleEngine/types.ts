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
  evaluate: (input: TInput, context?: any) => EvidenceBundle | Promise<EvidenceBundle>;
  priority: number;
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
