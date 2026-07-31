import type { SubEngine, SubEngineInput, SubEngineResult } from './types'
import type { Wuxing } from '../types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const KE: Record<Wuxing, Wuxing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
function emptyScore(): Record<Wuxing, number> { return { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 } }

/**
 * BalanceEngine（扶抑体系引擎）
 *
 * 身强用克泄耗（官杀/食伤/财星），身弱用生扶（印星/比劫）。
 *
 * 经典依据：《子平真诠》论用神 + 《滴天髓》通神论
 */
export class BalanceEngine implements SubEngine {
  readonly name = 'BalanceEngine'
  readonly version = '1.0.0'

  evaluate(input: SubEngineInput): SubEngineResult {
    const { dayGanWuxing, dayStrength } = input
    const score = emptyScore()
    const evidence: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

    const shengWo = WUXING_LIST.find(w => SHENG[w] === dayGanWuxing)! // 印星
    const tongWo = dayGanWuxing // 比劫
    const keWo = WUXING_LIST.find(w => KE[w] === dayGanWuxing)! // 官杀
    const woSheng = SHENG[dayGanWuxing] // 食伤
    const woKe = KE[dayGanWuxing] // 财星

    const strength = dayStrength ?? 0

    evidence.push({
      step: 'S1-判定日主强弱',
      text: `日主=${dayGanWuxing} dayStrength=${strength}`,
      satisfied: true,
      citation: '《子平真诠》论用神',
    })

    if (strength > 0) {
      evidence.push({
        step: 'S2-身强用克泄耗',
        text: `身强(${strength}) 宜用克(官杀=${keWo}) 泄(食伤=${woSheng}) 耗(财星=${woKe})`,
        satisfied: true,
        citation: '《子平真诠》论用神',
      })
      score[keWo] = 2; score[woSheng] = 1; score[woKe] = 1
      score[shengWo] = -2; score[tongWo] = -1
    } else if (strength < 0) {
      evidence.push({
        step: 'S2-身弱用生扶',
        text: `身弱(${strength}) 宜用生(印星=${shengWo}) 扶(比劫=${tongWo})`,
        satisfied: true,
        citation: '《子平真诠》论用神',
      })
      score[shengWo] = 2; score[tongWo] = 1
      score[keWo] = -2; score[woSheng] = -1; score[woKe] = -1
    } else {
      evidence.push({
        step: 'S2-中和无需扶抑',
        text: '日主中和 扶抑法不强制作用神',
        satisfied: false,
        citation: '《子平真诠》',
      })
    }

    evidence.push({
      step: 'S3-扶抑打分',
      text: `印(${shengWo}):${score[shengWo]} 比(${tongWo}):${score[tongWo]} 官(${keWo}):${score[keWo]} 食(${woSheng}):${score[woSheng]} 财(${woKe}):${score[woKe]}`,
      satisfied: true,
      citation: '《滴天髓》通神论',
    })

    const classicEvidence: ClassicEvidenceRef[] = [
      {
        classicId: 'zpzq', classicName: '子平真诠', chapterId: 'zpzq-c2', chapterTitle: '论用神',
        paragraphId: 'zpzq-c2-p1', sentenceId: 'zpzq-c2-p1-s1',
        quotedText: '身强用克泄耗，身弱用生扶，此扶抑之大法也。',
        citation: 'direct', supports: '扶抑法核心原则', hasControversy: false,
      },
      {
        classicId: 'dts', classicName: '滴天髓', chapterId: 'dts-c1', chapterTitle: '通神论',
        paragraphId: 'dts-c1-p1', sentenceId: 'dts-c1-p1-s1',
        quotedText: '欲识三元万法宗，先观帝载与神机。',
        citation: 'direct', supports: '旺衰判断为扶抑基础', hasControversy: false,
      },
      {
        classicId: 'zpzq', classicName: '子平真诠', chapterId: 'zpzq-c2', chapterTitle: '论用神',
        paragraphId: 'zpzq-c2-p1', sentenceId: 'zpzq-c2-p1-s2',
        quotedText: '用神之法定于月令，月令者，提纲之府。',
        citation: 'direct', supports: '月令为扶抑判断基础', hasControversy: false,
      },
    ]

    const applicable = strength !== 0

    return {
      engineName: this.name,
      applicable,
      skipReason: applicable ? undefined : '日主中和 扶抑法不强制',
      scores: score,
      evidence,
      classicEvidence,
      confidence: 0.8,
      weight: 0.25,
      summary: `扶抑：${strength > 0 ? '身强用克泄耗' : strength < 0 ? '身弱用生扶' : '中和不强制'}`,
    }
  }
}
