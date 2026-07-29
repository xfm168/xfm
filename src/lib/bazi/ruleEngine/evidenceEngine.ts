import type { EvidenceBundle, EvidenceItem } from './types';

let _evidenceCounter = 0;

export function makeEvidenceItem(
  opts: Partial<EvidenceItem> & Pick<EvidenceItem, 'rule' | 'result' | 'description'>,
): EvidenceItem {
  _evidenceCounter += 1;
  return {
    id: opts.id ?? `EVID-${Date.now().toString(36)}-${_evidenceCounter}`,
    rule: opts.rule,
    level: opts.level ?? 'support',
    result: opts.result,
    weight: opts.weight ?? 0.5,
    description: opts.description,
    source: opts.source,
    trace: opts.trace,
  };
}

export function mergeEvidence(bundles: EvidenceBundle[], finalConclusion: string): EvidenceBundle {
  const items: EvidenceItem[] = [];
  let coreSatisfied = 0;
  let coreTotal = 0;
  let counterHits = 0;
  let counterThreshold = 0;
  let direction: EvidenceBundle['direction'] = 'neutral';

  let goodWeight = 0;
  let badWeight = 0;

  for (const bundle of bundles) {
    items.push(...bundle.items);
    coreSatisfied += bundle.coreSatisfied;
    coreTotal += bundle.coreTotal;
    counterHits += bundle.counterHits;
    counterThreshold += bundle.counterThreshold;

    if (bundle.direction === 'good') {
      goodWeight += 1;
    } else if (bundle.direction === 'bad') {
      badWeight += 1;
    }
  }

  if (goodWeight > badWeight) {
    direction = 'good';
  } else if (badWeight > goodWeight) {
    direction = 'bad';
  }

  return {
    conclusion: finalConclusion,
    direction,
    items,
    coreSatisfied,
    coreTotal,
    counterHits,
    counterThreshold,
  };
}

export function calcEvidenceScore(bundle: EvidenceBundle): number {
  if (bundle.items.length === 0) {
    return 0;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  for (const item of bundle.items) {
    let resultScore = 0;
    if (item.result === 'satisfied') {
      resultScore = 1;
    } else if (item.result === 'partially') {
      resultScore = 0.5;
    } else {
      resultScore = 0;
    }

    let multiplier = 1;
    if (item.level === 'core') {
      multiplier = 2;
    } else if (item.level === 'counter') {
      multiplier = 1.5;
      resultScore = 1 - resultScore;
    }

    weightedSum += resultScore * item.weight * multiplier;
    totalWeight += item.weight * multiplier;
  }

  let coreRatio = 1;
  if (bundle.coreTotal > 0) {
    coreRatio = bundle.coreSatisfied / bundle.coreTotal;
  }

  let counterPenalty = 1;
  if (bundle.counterThreshold > 0 && bundle.counterHits >= bundle.counterThreshold) {
    counterPenalty = Math.max(0.2, 1 - (bundle.counterHits / bundle.counterThreshold) * 0.8);
  }

  const baseScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
  return Math.max(0, Math.min(100, Math.round(baseScore * coreRatio * counterPenalty * 100)));
}
