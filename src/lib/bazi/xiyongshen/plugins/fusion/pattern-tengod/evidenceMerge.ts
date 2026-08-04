/**
 * P1.2.2 — 格局Evidence + 十神Evidence 融合器
 *
 * 职责：
 * - 接收 PatternPlugin.evaluate() + TenGodPlugin.evaluate() 原始输出
 * - 合并为统一 EvidenceTree（不丢来源/权重/古籍依据/置信度）
 * - 产出 PatternTenGodEvidence（对外统一）
 *
 * 禁止：
 * - 覆盖原 Pattern/TenGod 原始证据字段（任何情况下不丢源）
 */
import type { PatternTenGodEvidence, PatternTenGodEvidenceTree, PatternEvidenceLeaf } from './types'
import type { SubEngineResult } from '../../../../engines/types'
import type { TenGodEngineResult } from '../../../tengod/tengodEngine'
import type { Wuxing } from '../../../pattern/types'

const CLASSIC_CODE_TO_NAME: Record<string, string> = {
  YSX: '渊海子平',
  ZYQ: '子平真诠',
  DTS: '滴天髓',
  SMTH: '三命通会',
  QTB: '穷通宝鉴',
  LPZ: '神峰通考',
  XJX: '星平会海',
  BLH: '命理约言',
  YDZP: '御定子平',
  SBTK: '三辟统宗',
  QLMG: '千里命稿',
}

function leafW(weight?: number, satisfied?: boolean): number {
  if (typeof weight === 'number' && !Number.isNaN(weight)) return weight
  return satisfied === false ? -1.2 : satisfied === true ? 1.2 : 0.5
}

function buildPatternLeaves(patternResult: SubEngineResult): PatternEvidenceLeaf[] {
  const leaves: PatternEvidenceLeaf[] = []
  const evArr = patternResult.evidence || []
  for (const e of evArr) {
    const satisfied = !!e.satisfied
    leaves.push({
      source: 'pattern',
      step: e.step,
      text: e.text,
      satisfied,
      weight: leafW(undefined, satisfied),
      citation: e.citation || null,
      confidence: Math.max(0.3, Math.min(1, patternResult.confidence || 0.5)),
    })
  }
  // 经典证据补充为 fusion 侧子 leaves
  const classics = patternResult.classicEvidence || []
  for (const c of classics as any[]) {
    const classicName = (c as any).classicName || CLASSIC_CODE_TO_NAME[(c as any).classicId || ''] || ''
    const quote = (c as any).quote || ''
    leaves.push({
      source: 'classic-center',
      step: 'P-CLASSIC-' + (leaves.length + 1),
      text: quote || (classicName ? `《${classicName}》引述` : 'Pattern classic reference'),
      satisfied: true,
      weight: 0.8,
      citation: classicName && quote ? `《${classicName}》：${quote}` : null,
      chapter: (c as any).chapter || '',
      confidence: 0.9,
    })
  }
  return leaves
}

function buildTenGodLeaves(tengodResult: TenGodEngineResult): PatternEvidenceLeaf[] {
  const leaves: PatternEvidenceLeaf[] = []
  const evArr = (tengodResult as any).evidence || []
  const conf = Math.max(0.3, Math.min(1, (tengodResult as any).confidence ?? 0.5))
  for (const e of evArr as any[]) {
    const satisfied = !!e.satisfied
    leaves.push({
      source: 'tengod',
      step: e.step || `T-${leaves.length + 1}`,
      text: e.text || '',
      satisfied,
      weight: typeof e.weight === 'number' ? e.weight : leafW(undefined, satisfied),
      citation: e.citation || null,
      confidence: conf,
    })
  }
  const report = (tengodResult as any).evidenceReport as any
  if (report?.steps && Array.isArray(report.steps)) {
    for (const s of report.steps as any[]) {
      leaves.push({
        source: 'tengod',
        step: s.stepId || s.step || `TR-${leaves.length + 1}`,
        text: s.stepName + '：' + s.text,
        satisfied: !!s.satisfied,
        weight: typeof s.weight === 'number' ? s.weight : leafW(undefined, !!s.satisfied),
        citation: s.citation || null,
        confidence: conf,
      })
    }
  }
  const classics = (tengodResult as any).classicEvidence || []
  for (const c of classics as any[]) {
    const classicName = (c as any).classicName || CLASSIC_CODE_TO_NAME[(c as any).classicId || ''] || ''
    const quote = (c as any).quote || ''
    leaves.push({
      source: 'classic-center',
      step: 'T-CLASSIC-' + (leaves.length + 1),
      text: quote || (classicName ? `《${classicName}》引述` : 'TenGod classic reference'),
      satisfied: true,
      weight: 0.8,
      citation: classicName && quote ? `《${classicName}》：${quote}` : null,
      chapter: (c as any).chapter || '',
      confidence: 0.9,
    })
  }
  return leaves
}

export function mergeEvidence(
  patternResult: SubEngineResult,
  tengodResult: TenGodEngineResult,
  opts?: {
    patternClassify?: any
    tengodClassify?: any
  }
): {
  evidence: PatternTenGodEvidence
  tree: PatternTenGodEvidenceTree
} {
  const patternLeaves = buildPatternLeaves(patternResult)
  const tengodLeaves = buildTenGodLeaves(tengodResult)

  const sumW = (leaves: PatternEvidenceLeaf[]) =>
    leaves.reduce((acc, l) => {
      const w = l.weight ?? 0
      return { pos: acc.pos + Math.max(0, w), neg: acc.neg + Math.min(0, w) }
    }, { pos: 0, neg: 0 })

  const pw = sumW(patternLeaves)
  const tw = sumW(tengodLeaves)
  const positiveWeight = Math.max(0, pw.pos) + Math.max(0, tw.pos)
  const negativeWeight = Math.min(0, pw.neg) + Math.min(0, tw.neg)
  const totalWeight = +(positiveWeight + negativeWeight).toFixed(3)
  const confidence = +(
    (Math.max(0.3, patternResult.confidence) * 0.45 +
      Math.max(0.3, (tengodResult as any).confidence ?? 0.5) * 0.55)
  ).toFixed(3)

  const children: PatternEvidenceLeaf[] = [...patternLeaves, ...tengodLeaves]

  const tree: PatternTenGodEvidenceTree = {
    id: 'fusion-evidence-' + Date.now() + '-' + Math.floor(Math.random() * 1e6),
    totalWeight,
    positiveWeight: +positiveWeight.toFixed(3),
    negativeWeight: +negativeWeight.toFixed(3),
    patternLeaves,
    tengodLeaves,
    fusionLeaves: [],
    children,
    confidence,
  }

  const patternCitations: Array<{
    classicCode: string
    chapter?: string
    quote: string
    classicName?: string
  }> = []
  for (const c of patternResult.classicEvidence || [] as any[]) {
    const classicCode = (c as any).classicId || (c as any).classicCode || ''
    patternCitations.push({
      classicCode,
      chapter: (c as any).chapter || '',
      quote: (c as any).quote || '',
      classicName: (c as any).classicName || CLASSIC_CODE_TO_NAME[classicCode] || '',
    })
  }
  const tengodCitations: Array<{
    classicCode: string
    chapter?: string
    quote: string
    classicName?: string
  }> = []
  for (const c of (tengodResult as any).classicEvidence || [] as any[]) {
    const classicCode = (c as any).classicId || (c as any).classicCode || ''
    tengodCitations.push({
      classicCode,
      chapter: (c as any).chapter || '',
      quote: (c as any).quote || '',
      classicName: (c as any).classicName || CLASSIC_CODE_TO_NAME[classicCode] || '',
    })
  }

  const classicCitation: PatternTenGodEvidence['classicCitation'] = []
  for (const c of patternCitations) {
    if (c.quote && (c.classicName || c.classicCode)) {
      classicCitation.push({
        source: 'pattern',
        classicName: c.classicName || c.classicCode,
        chapter: c.chapter || '未分卷',
        quote: c.quote,
      })
    }
  }
  for (const c of tengodCitations) {
    if (c.quote && (c.classicName || c.classicCode)) {
      classicCitation.push({
        source: 'tengod',
        classicName: c.classicName || c.classicCode,
        chapter: c.chapter || '未分卷',
        quote: c.quote,
      })
    }
  }

  // Pattern 侧评分：confidence × 100
  const patternScore = Math.max(0, Math.min(100, (patternResult.confidence * 90 + (patternResult.applicable ? 10 : 0))))
  // TenGod 侧评分：overall（若存在）或 confidence
  const tgOverall = (tengodResult as any).scores
    ? undefined
    : (tengodResult as any).evidenceReport?.balanceScore ?? 0
  const tengodScoreRaw = (tengodResult as any).overallWangJi
    ? (positiveWeight / Math.max(1, positiveWeight - negativeWeight)) * 100
    : Math.max(0, Math.min(100, ((tengodResult as any).confidence ?? 0.5) * 100))
  const tengodScore = typeof tgOverall === 'number'
    ? tgOverall
    : +(tengodScoreRaw || 50).toFixed(2)

  const evidence: PatternTenGodEvidence = {
    patternEvidence: {
      verdict: (opts?.patternClassify as any)?.verdict || (opts?.patternClassify as any)?.strongestVerdict,
      candidates: (opts?.patternClassify as any)?.candidates || [],
      evidence: patternResult.evidence.map((e) => ({
        step: e.step,
        text: e.text,
        satisfied: e.satisfied,
        citation: e.citation,
      })),
      classicCitations: patternCitations,
      score: +(patternResult.confidence || 0).toFixed(3),
      confidence: +(patternResult.confidence || 0).toFixed(3),
    },
    tengodEvidence: {
      classifier: opts?.tengodClassify,
      combinationVerdicts: ((tengodResult as any).metadata?.combinationVerdicts as any) || ((tengodResult as any).combinations ?? []),
      evidenceReport: (tengodResult as any).evidenceReport,
      evidence: ((tengodResult as any).evidence || [] as any[]).map((e: any) => ({
        step: e.step || '',
        text: e.text || '',
        satisfied: e.satisfied,
        citation: e.citation,
      })),
      classicCitations: tengodCitations,
      score: +(((tengodResult as any).confidence ?? 0.5) || 0).toFixed(3),
      confidence: +(((tengodResult as any).confidence ?? 0.5) || 0).toFixed(3),
    },
    patternScore: +patternScore.toFixed(2),
    tengodScore: +(tengodScore || 50).toFixed(2),
    classicCitation,
    confidence,
    evidenceTree: tree,
  }

  return { evidence, tree }
}
