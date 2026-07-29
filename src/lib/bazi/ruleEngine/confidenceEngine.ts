import type { Confidence, DimensionScore } from './types';

/** V⑤ 可信度组件名（权重维度）*/
export type ConfidenceComponent = 'yuanju' | 'dayun' | 'liunian' | 'tiaohou' | 'geju' | 'other';

const DEFAULT_WEIGHTS: Record<ConfidenceComponent, number> = {
  yuanju: 0.40,
  dayun: 0.30,
  liunian: 0.17,
  tiaohou: 0.08,
  geju: 0.05,
  other: 0.00,
};

function valueToLevel(value: number): Confidence['level'] {
  if (value >= 85) return 'very_high';
  if (value >= 65) return 'high';
  if (value >= 40) return 'medium';
  return 'low';
}

/**
 * 根据证据 bundle 的统计数据生成 5 个维度的布尔判定
 * 内部辅助：coreRatio >= 0.66 视为 satisfied
 */
function evidenceToBools(input?: {
  coreSatisfied?: number
  coreTotal?: number
  counterHits?: number
  counterThreshold?: number
}) {
  const coreRatio = input && input.coreTotal && input.coreTotal > 0
    ? ((input.coreSatisfied ?? 0) / input.coreTotal)
    : 0.5
  const counterOk = input && input.counterThreshold && input.counterThreshold > 0
    ? (input.counterHits ?? 0) < input.counterThreshold
    : true
  return {
    yuanjuOk: coreRatio >= 0.66,
    dayunOk: coreRatio >= 0.5,
    liunianOk: coreRatio >= 0.4,
    tiaohouOk: counterOk,
    gejuOk: coreRatio >= 0.6,
  }
}

/**
 * 构建默认可信度
 * 【签名1 · 向后兼容】5 个 boolean + 可选 extra
 * 【签名2 · V④/V⑤ 新增】接受对象参数（从 EvidenceBundle 统计直接构造）
 */
export function buildDefaultConfidence(
  yuanjuOk: boolean,
  dayunOk: boolean,
  liunianOk: boolean,
  tiaohouOk: boolean,
  gejuOk: boolean,
  extra?: Partial<Confidence>,
): Confidence
export function buildDefaultConfidence(input: {
  coreSatisfied?: number
  coreTotal?: number
  counterHits?: number
  counterThreshold?: number
  extra?: Partial<Confidence>
}): Confidence
export function buildDefaultConfidence(
  a: boolean | { coreSatisfied?: number; coreTotal?: number; counterHits?: number; counterThreshold?: number; extra?: Partial<Confidence> },
  b?: boolean,
  c?: boolean,
  d?: boolean,
  e?: boolean,
  f?: Partial<Confidence>,
): Confidence {
  let yuanjuOk: boolean, dayunOk: boolean, liunianOk: boolean, tiaohouOk: boolean, gejuOk: boolean, extra: Partial<Confidence> | undefined
  if (typeof a === 'boolean') {
    yuanjuOk = a
    dayunOk = b as boolean
    liunianOk = c as boolean
    tiaohouOk = d as boolean
    gejuOk = e as boolean
    extra = f
  } else {
    const bools = evidenceToBools(a)
    yuanjuOk = bools.yuanjuOk
    dayunOk = bools.dayunOk
    liunianOk = bools.liunianOk
    tiaohouOk = bools.tiaohouOk
    gejuOk = bools.gejuOk
    extra = a.extra
  }

  const weights = DEFAULT_WEIGHTS;

  const yuanjuContrib = yuanjuOk ? 1.0 : 0.3;
  const dayunContrib = dayunOk ? 1.0 : 0.3;
  const liunianContrib = liunianOk ? 1.0 : 0.3;
  const tiaohouContrib = tiaohouOk ? 1.0 : 0.4;
  const gejuContrib = gejuOk ? 1.0 : 0.5;

  const breakdown = [
    {
      name: '原局结构',
      contribution: yuanjuContrib,
      weightPct: Math.round(weights.yuanju * 100),
    },
    {
      name: '大运',
      contribution: dayunContrib,
      weightPct: Math.round(weights.dayun * 100),
    },
    {
      name: '流年',
      contribution: liunianContrib,
      weightPct: Math.round(weights.liunian * 100),
    },
    {
      name: '调候',
      contribution: tiaohouContrib,
      weightPct: Math.round(weights.tiaohou * 100),
    },
    {
      name: '格局',
      contribution: gejuContrib,
      weightPct: Math.round(weights.geju * 100),
    },
  ];

  const value = Math.round(
    yuanjuContrib * weights.yuanju * 100 +
    dayunContrib * weights.dayun * 100 +
    liunianContrib * weights.liunian * 100 +
    tiaohouContrib * weights.tiaohou * 100 +
    gejuContrib * weights.geju * 100,
  );

  const uncertainty: string[] = [];
  if (!yuanjuOk) uncertainty.push('原局结构信息不完整');
  if (!dayunOk) uncertainty.push('大运数据缺失');
  if (!liunianOk) uncertainty.push('流年数据缺失');
  if (!tiaohouOk) uncertainty.push('调候判定存在争议');
  if (!gejuOk) uncertainty.push('格局判定存在争议');

  const components: Confidence['components'] = {
    yuanju: Math.round(yuanjuContrib * weights.yuanju * 100),
    dayun: Math.round(dayunContrib * weights.dayun * 100),
    liunian: Math.round(liunianContrib * weights.liunian * 100),
    tiaohou: Math.round(tiaohouContrib * weights.tiaohou * 100),
    geju: Math.round(gejuContrib * weights.geju * 100),
    other: 0,
  };

  const base: Confidence = {
    value: Math.max(0, Math.min(100, value)),
    level: valueToLevel(Math.max(0, Math.min(100, value))),
    breakdown,
    uncertainty: uncertainty.length > 0 ? uncertainty : undefined,
    components,
    notes: [],
  };

  if (!extra) return base;

  return {
    ...base,
    ...extra,
    breakdown: extra.breakdown ?? base.breakdown,
    level: extra.level ?? base.level,
    value: extra.value ?? base.value,
    components: { ...base.components, ...(extra.components || {}) },
    notes: extra.notes ?? base.notes,
  };
}

/**
 * V⑤ 合成多个可信度 + 覆盖权重
 * 将多个 Confidence 合并，并按给定的 components 权重重新计算总分
 * 若只传 1 个 baseConfidence，则直接按 components 覆盖权重重新打分
 */
export function composeConfidence(
  baseConfidences: Confidence[],
  componentWeights: Partial<Record<ConfidenceComponent, number>> = {},
): Confidence {
  const weights: Record<ConfidenceComponent, number> = {
    yuanju: componentWeights.yuanju ?? DEFAULT_WEIGHTS.yuanju,
    dayun: componentWeights.dayun ?? DEFAULT_WEIGHTS.dayun,
    liunian: componentWeights.liunian ?? DEFAULT_WEIGHTS.liunian,
    tiaohou: componentWeights.tiaohou ?? DEFAULT_WEIGHTS.tiaohou,
    geju: componentWeights.geju ?? DEFAULT_WEIGHTS.geju,
    other: componentWeights.other ?? DEFAULT_WEIGHTS.other,
  }
  const totalWeight = weights.yuanju + weights.dayun + weights.liunian + weights.tiaohou + weights.geju + weights.other

  let weightedValue = 0
  const allBreakdown: Confidence['breakdown'] = []
  const allUncertainty: string[] = []
  const mergedComponents: Confidence['components'] = {}
  const allNotes: string[] = []

  for (const base of baseConfidences) {
    if (base.components) {
      for (const k of Object.keys(base.components) as ConfidenceComponent[]) {
        mergedComponents[k] = (mergedComponents[k] ?? 0) + (base.components[k] ?? 0)
      }
    }
    if (base.breakdown) allBreakdown.push(...base.breakdown)
    if (base.uncertainty) allUncertainty.push(...base.uncertainty)
    if (base.notes) allNotes.push(...base.notes)
  }

  const avgComponents: Confidence['components'] = {}
  const n = Math.max(1, baseConfidences.length)
  for (const k of Object.keys(mergedComponents) as ConfidenceComponent[]) {
    avgComponents[k] = Math.round((mergedComponents[k] ?? 0) / n)
    const w = weights[k] ?? 0
    weightedValue += ((avgComponents[k] ?? 0) / 100) * (w / (totalWeight || 1)) * 100
  }

  const value = Math.max(0, Math.min(100, Math.round(weightedValue || (baseConfidences[0]?.value ?? 50))))

  return {
    value,
    level: valueToLevel(value),
    breakdown: allBreakdown.length > 0 ? allBreakdown : (baseConfidences[0]?.breakdown ?? []),
    uncertainty: allUncertainty.length > 0 ? Array.from(new Set(allUncertainty)) : baseConfidences[0]?.uncertainty,
    components: avgComponents,
    notes: Array.from(new Set(allNotes)),
  }
}

export function scoreToStars(score: number): number {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 90) return 5;
  if (s >= 75) return 4;
  if (s >= 55) return 3;
  if (s >= 35) return 2;
  return 1;
}

export function scoreToLevel(score: number): DimensionScore['level'] {
  const s = Math.max(0, Math.min(100, score));
  if (s >= 85) return 'excellent';
  if (s >= 65) return 'good';
  if (s >= 45) return 'average';
  if (s >= 25) return 'below';
  return 'poor';
}

/**
 * V⑤ ConfidenceEngine 独立入口
 * 根据 Pipeline/推演结果动态生成可信度
 * 以后 AI/UI 统一调用此函数获取可信度
 */
export function evaluateConfidence(input: {
  coreSatisfied?: number
  coreTotal?: number
  counterHits?: number
  counterThreshold?: number
  components?: Partial<Record<ConfidenceComponent, number>>
  birthTimeUnknown?: boolean
  overrides?: Partial<Confidence>
} = {}): Confidence {
  const base = buildDefaultConfidence({
    coreSatisfied: input.coreSatisfied,
    coreTotal: input.coreTotal,
    counterHits: input.counterHits,
    counterThreshold: input.counterThreshold,
  })
  const composed = input.components ? composeConfidence([base], input.components) : base
  let result = composed
  if (input.birthTimeUnknown) {
    result = composeConfidence([result], { yuanju: 35 })
    result.components = result.components ?? {}
    result.components.other = (result.components.other || 0) + 5
    result.notes = [...(result.notes || []), '出生时辰未知，原局可信度扣减 5 分']
  }
  if (input.overrides) {
    result = {
      ...result,
      ...input.overrides,
      components: { ...result.components, ...(input.overrides.components || {}) },
      breakdown: input.overrides.breakdown ? [...input.overrides.breakdown] : [...result.breakdown],
      notes: Array.from(new Set([...(result.notes || []), ...(input.overrides.notes || [])])),
    }
  }
  return result
}
