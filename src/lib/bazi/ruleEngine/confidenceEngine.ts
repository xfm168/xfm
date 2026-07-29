import type { Confidence, DimensionScore } from './types';

const DEFAULT_WEIGHTS = {
  yuanju: 0.40,
  dayun: 0.30,
  liunian: 0.17,
  tiaohou: 0.08,
  geju: 0.05,
};

function valueToLevel(value: number): Confidence['level'] {
  if (value >= 85) return 'very_high';
  if (value >= 65) return 'high';
  if (value >= 40) return 'medium';
  return 'low';
}

export function buildDefaultConfidence(
  yuanjuOk: boolean,
  dayunOk: boolean,
  liunianOk: boolean,
  tiaohouOk: boolean,
  gejuOk: boolean,
  extra?: Partial<Confidence>,
): Confidence {
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

  const base: Confidence = {
    value: Math.max(0, Math.min(100, value)),
    level: valueToLevel(Math.max(0, Math.min(100, value))),
    breakdown,
    uncertainty: uncertainty.length > 0 ? uncertainty : undefined,
  };

  if (!extra) return base;

  return {
    ...base,
    ...extra,
    breakdown: extra.breakdown ?? base.breakdown,
    level: extra.level ?? base.level,
    value: extra.value ?? base.value,
  };
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
