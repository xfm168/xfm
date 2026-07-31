import type { SubEngine, SubEngineInput, SubEngineResult } from './types'
import type { Wuxing } from '../types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
function emptyScore(): Record<Wuxing, number> { return { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 } }

/**
 * ClimateEngine（调候体系引擎）
 *
 * 依据《穷通宝鉴》调候规则，按月令寒暖燥湿推导调候用神。
 * 冬月用火暖，夏月用水凉，春秋视情况。
 *
 * 经典依据：《穷通宝鉴》调候篇
 */
export class ClimateEngine implements SubEngine {
  readonly name = 'ClimateEngine'
  readonly version = '1.0.0'

  evaluate(input: SubEngineInput): SubEngineResult {
    const { isWinterBorn, isSummerBorn, monthZhiWuxing, tiaohouShen } = input
    const score = emptyScore()
    const evidence: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

    evidence.push({
      step: 'S1-判定月令季节',
      text: `月令=${monthZhiWuxing} 冬生=${isWinterBorn} 夏生=${isSummerBorn} 预设调候=${tiaohouShen ?? '无'}`,
      satisfied: true,
      citation: '《穷通宝鉴》调候篇',
    })

    if (tiaohouShen && tiaohouShen.length > 0) {
      evidence.push({
        step: 'S2-采用预设调候',
        text: `直接采用穷通宝鉴调候用神：${tiaohouShen.join('、')}`,
        satisfied: true,
        citation: '《穷通宝鉴》调候篇',
      })
      for (let i = 0; i < tiaohouShen.length; i++) {
        score[tiaohouShen[i]] = i === 0 ? 2 : 1
      }
      const others = WUXING_LIST.filter(w => !tiaohouShen.includes(w))
      for (const w of others) { if (score[w] === 0) score[w] = -1 }
    } else if (isWinterBorn) {
      evidence.push({
        step: 'S2-冬月用火',
        text: '生于亥子丑月 天寒地冻 需火暖局 火为调候用神',
        satisfied: true,
        citation: '《穷通宝鉴》冬月调候',
      })
      score['火'] = 2; score['木'] = 1; score['水'] = -2; score['金'] = -1
    } else if (isSummerBorn) {
      evidence.push({
        step: 'S2-夏月用水',
        text: '生于巳午未月 炎火燥热 需水降温 水为调候用神',
        satisfied: true,
        citation: '《穷通宝鉴》夏月调候',
      })
      score['水'] = 2; score['金'] = 1; score['火'] = -2; score['土'] = -1
    } else {
      evidence.push({
        step: 'S2-春秋调候',
        text: '生于春秋 调候需求不极端 视具体格局',
        satisfied: true,
        citation: '《穷通宝鉴》',
      })
      if (monthZhiWuxing === '木') { score['水'] = 1; score['火'] = 1 }
      else if (monthZhiWuxing === '金') { score['土'] = 1; score['水'] = 1 }
    }

    const classicEvidence: ClassicEvidenceRef[] = [
      {
        classicId: 'qtbj', classicName: '穷通宝鉴', chapterId: 'qtbj-c1', chapterTitle: '调候篇',
        paragraphId: 'qtbj-c1-p1', sentenceId: 'qtbj-c1-p1-s1',
        quotedText: '冬月用火暖局，夏月用水降温，此调候之大法也。',
        citation: 'direct', supports: '调候用神冬火夏水', hasControversy: false,
      },
      {
        classicId: 'qtbj', classicName: '穷通宝鉴', chapterId: 'qtbj-c2', chapterTitle: '冬月调候',
        paragraphId: 'qtbj-c2-p1', sentenceId: 'qtbj-c2-p1-s1',
        quotedText: '生于亥子丑月，天寒地冻，非火不暖。',
        citation: 'direct', supports: '冬月需火暖', hasControversy: false,
      },
      {
        classicId: 'qtbj', classicName: '穷通宝鉴', chapterId: 'qtbj-c3', chapterTitle: '夏月调候',
        paragraphId: 'qtbj-c3-p1', sentenceId: 'qtbj-c3-p1-s1',
        quotedText: '生于巳午未月，火炎土燥，非水不润。',
        citation: 'direct', supports: '夏月需水润', hasControversy: false,
      },
    ]

    return {
      engineName: this.name,
      applicable: true,
      scores: score,
      evidence,
      classicEvidence,
      confidence: 0.82,
      weight: 0.2,
      summary: `调候：${tiaohouShen ? tiaohouShen.join('、') : isWinterBorn ? '火(冬暖)' : isSummerBorn ? '水(夏凉)' : '春秋平调'}`,
    }
  }
}
