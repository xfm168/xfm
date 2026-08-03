import type { SubEngine, SubEngineInput, SubEngineResult } from '../../engines/types'
import type { Wuxing } from '../../types'
import type { ClassicEvidenceRef } from '../../../ruleEngine/types'
import { PatternClassifier } from './classifier'
import type { GejuVerdict } from './types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const KE: Record<Wuxing, Wuxing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }

function emptyScore(): Record<Wuxing, number> {
  return { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
}

const CLASSIC_ID_MAP: Record<string, { classicId: string; classicName: string }> = {
  'ZYQ': { classicId: 'zpzq', classicName: '子平真诠' },
  'DTS': { classicId: 'dts', classicName: '滴天髓' },
  'QTB': { classicId: 'qtb', classicName: '穷通宝鉴' },
  'SMTH': { classicId: 'smth', classicName: '三命通会' },
  'YSX': { classicId: 'ysx', classicName: '渊海子平' },
}

export class AdvancedPatternEngine implements SubEngine {
  readonly name = 'AdvancedPatternEngine'
  readonly version = '2.0.0'
  readonly weight = 1.2

  constructor(private classifier = new PatternClassifier()) {}

  evaluate(input: SubEngineInput): SubEngineResult {
    const result = this.classifier.classify({
      dayGanWuxing: input.dayGanWuxing,
      monthZhiWuxing: input.monthZhiWuxing,
      count: input.count,
      fourPillars: input.fourPillars,
      dayStrength: input.dayStrength ?? 0,
      dayGan: input.dayGan,
      monthZhi: input.monthZhi,
      dayRootCount: input.dayRootCount ?? 0,
      isWinterBorn: input.isWinterBorn,
      isSummerBorn: input.isSummerBorn,
      conflictingPairs: input.conflictingPairs,
    })

    const verdict: GejuVerdict | undefined = result.verdict || result.strongestVerdict
    const scores = emptyScore()
    const evidence: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []
    const classicEvidence: ClassicEvidenceRef[] = []

    const top3 = result.candidates.slice(0, 3)
    evidence.push({
      step: 'S1-格局初判',
      text: `候选格局Top${top3.length}：${top3.map((c, i) => `#${i + 1} ${c.name}(${c.category}) score=${c.score}`).join('；')}`,
      satisfied: top3.length > 0,
      citation: '综合子平真诠/滴天髓/穷通宝鉴判定',
    })

    if (result.warning) {
      evidence.push({
        step: 'S1.5-格局歧义',
        text: result.warning,
        satisfied: false,
      })
    }

    let confidence = verdict?.confidence ?? 0.5
    if (!verdict) {
      evidence.push({
        step: 'S2-主格局确认',
        text: '无明确主格局，按正格兜底处理，置信度偏低',
        satisfied: false,
      })
      confidence = 0.4
    } else {
      evidence.push({
        step: 'S2-主格局确认',
        text: `主格局=${verdict.name}（${verdict.category}），置信=${confidence.toFixed(2)}；判据：${verdict.evidences.join('；')}`,
        satisfied: true,
        citation: verdict.classicCitations.map(c => c.classicCode).join('/'),
      })

      if (verdict.conflicts && verdict.conflicts.length > 0) {
        evidence.push({
          step: 'S2.5-矛盾说明',
          text: `格局矛盾点/需注意：${verdict.conflicts.join('；')}`,
          satisfied: false,
        })
      }

      const yong = verdict.yongshenProposal ?? []
      const ji = verdict.jishenProposal ?? []

      const uniqueWX = (arr: Wuxing[]): Wuxing[] => {
        const seen = new Set<string>()
        return arr.filter(w => {
          if (seen.has(w)) return false
          seen.add(w)
          return true
        })
      }

      for (const wx of uniqueWX(yong)) {
        const idx = yong.indexOf(wx)
        scores[wx] = Math.max(scores[wx], idx === 0 ? 3 : idx === 1 ? 2 : 1)
      }
      for (const wx of uniqueWX(ji)) {
        const idx = ji.indexOf(wx)
        scores[wx] = Math.min(scores[wx], idx === 0 ? -3 : idx === 1 ? -2 : -1)
      }

      evidence.push({
        step: 'S3-喜忌推导',
        text: `拟用五行：${yong.join('/') || '（无明确提议）'}；拟忌五行：${ji.join('/') || '（无明确提议）'}；评分：${WUXING_LIST.map(w => `${w}${scores[w] >= 0 ? '+' : ''}${scores[w]}`).join(' ')}`,
        satisfied: yong.length > 0 || ji.length > 0,
        citation: '基于格局喜忌原则，主用+3、次用+2、辅助+1、忌-3/-2/-1',
      })

      for (let i = 0; i < verdict.classicCitations.length; i++) {
        const cc = verdict.classicCitations[i]
        const map = CLASSIC_ID_MAP[cc.classicCode] ?? { classicId: 'unknown', classicName: cc.classicCode }
        classicEvidence.push({
          classicId: map.classicId,
          classicName: map.classicName,
          chapterId: `${map.classicId}-p${i + 1}`,
          chapterTitle: cc.chapter,
          paragraphId: `${map.classicId}-p${i + 1}-p1`,
          sentenceId: `${map.classicId}-p${i + 1}-p1-s1`,
          quotedText: cc.quote,
          citation: 'direct',
          supports: `${verdict.name} 判定依据`,
          hasControversy: false,
        })
      }

      evidence.push({
        step: 'S4-古籍溯源',
        text: `引用古籍${verdict.classicCitations.length}条：${verdict.classicCitations.map(c => `${c.classicCode}·${c.chapter}：${c.quote.slice(0, 18)}...`).join(' | ')}`,
        satisfied: verdict.classicCitations.length > 0,
        citation: verdict.classicCitations.map(c => c.classicCode).join(','),
      })
    }

    const yongshen = verdict?.yongshenProposal?.join('、') || '（待议）'
    const jishen = verdict?.jishenProposal?.join('、') || '（待议）'
    const summary = `${verdict?.name ?? '未判格局'}（${verdict?.category ?? 'zheng'}）置信 ${confidence.toFixed(2)}；用神：${yongshen} 忌神：${jishen}`

    const applicable = !!verdict || result.candidates.length > 0

    return {
      engineName: this.name,
      applicable,
      skipReason: applicable ? undefined : '无可判定格局信息',
      scores,
      evidence,
      classicEvidence,
      confidence,
      weight: this.weight,
      summary,
    }
  }
}
