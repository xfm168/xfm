import type { SubEngine, SubEngineInput, SubEngineResult } from './types'
import type { Wuxing } from '../types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const KE: Record<Wuxing, Wuxing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }

function emptyScore(): Record<Wuxing, number> { return { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 } }

/**
 * PatternEngine（格局判定影响引擎）
 *
 * 根据格局类别（正格/从格/专旺等）提供喜用神 Evidence。
 * 从格从旺神，专旺助旺泄秀，正格配合扶抑。
 *
 * 经典依据：《子平真诠》论格局 + 《滴天髓》从象篇 + 《三命通会》
 */
export class PatternEngine implements SubEngine {
  readonly name = 'PatternEngine'
  readonly version = '1.0.0'

  evaluate(input: SubEngineInput): SubEngineResult {
    const { gejuCategory, count, dayGanWuxing } = input
    const score = emptyScore()
    const evidence: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

    evidence.push({
      step: 'S1-判定格局类别',
      text: `gejuCategory=${gejuCategory ?? '正格'} 日主=${dayGanWuxing} 计数：木=${count['木']}火=${count['火']}土=${count['土']}金=${count['金']}水=${count['水']}`,
      satisfied: true,
      citation: '《子平真诠》论格局',
    })

    const maxCount = Math.max(...WUXING_LIST.map(w => count[w]))
    const wangShenList = WUXING_LIST.filter(w => count[w] === maxCount)
    const wangShen = wangShenList[0]

    if (!gejuCategory || gejuCategory === '正格') {
      evidence.push({
        step: 'S2-正格取用',
        text: '正格以月令用神为主，格局法辅助参考，不强制评分',
        satisfied: false,
        citation: '《子平真诠》正格篇',
      })
    } else if (gejuCategory.includes('从') || gejuCategory.includes('假从') || gejuCategory.includes('半从')) {
      evidence.push({
        step: 'S2-从格从旺神',
        text: `格局=${gejuCategory} 从格当顺旺势 从${wangShen}(${maxCount}个最旺)`,
        satisfied: true,
        citation: '《滴天髓》从象篇',
      })
      score[wangShen] = 2
      score[SHENG[wangShen]] = 1
      const keWang = WUXING_LIST.find(w => KE[w] === wangShen)!
      score[keWang] = -2
      score[KE[wangShen]] = -1
    } else if (gejuCategory.includes('专旺') || gejuCategory.includes('曲直') || gejuCategory.includes('炎上') || gejuCategory.includes('稼穑') || gejuCategory.includes('从革') || gejuCategory.includes('润下')) {
      evidence.push({
        step: 'S2-专旺助旺泄秀',
        text: `格局=${gejuCategory} 专旺宜助旺(${wangShen})+泄秀(${SHENG[wangShen]})`,
        satisfied: true,
        citation: '《子平真诠》专旺篇',
      })
      score[wangShen] = 2
      score[SHENG[wangShen]] = 2
      const keWang = WUXING_LIST.find(w => KE[w] === wangShen)!
      score[keWang] = -2
    } else {
      evidence.push({
        step: 'S2-其他格局',
        text: `格局=${gejuCategory} 按正格扶抑原则处理`,
        satisfied: true,
        citation: '《三命通会》',
      })
    }

    const classicEvidence: ClassicEvidenceRef[] = [
      {
        classicId: 'zpzq', classicName: '子平真诠', chapterId: 'zpzq-c3', chapterTitle: '论格局',
        paragraphId: 'zpzq-c3-p1', sentenceId: 'zpzq-c3-p1-s1',
        quotedText: '格局正变，用神取舍，皆从月令而出。',
        citation: 'direct', supports: '格局取用依月令', hasControversy: false,
      },
      {
        classicId: 'dts', classicName: '滴天髓', chapterId: 'dts-c3', chapterTitle: '论格局',
        paragraphId: 'dts-c3-p3', sentenceId: 'dts-c3-p3-s1',
        quotedText: '从象者，顺其旺势，不可逆其性。',
        citation: 'direct', supports: '从格顺旺势', hasControversy: false,
      },
      {
        classicId: 'smth', classicName: '三命通会', chapterId: 'smth-c3', chapterTitle: '论格局',
        paragraphId: 'smth-c3-p1', sentenceId: 'smth-c3-p1-s1',
        quotedText: '格局有正有变，正者月令所藏，变者从化专旺。',
        citation: 'direct', supports: '格局正变分类', hasControversy: false,
      },
    ]

    const applicable = !(!gejuCategory || gejuCategory === '正格')

    return {
      engineName: this.name,
      applicable,
      skipReason: applicable ? undefined : '正格不强制格局法评分',
      scores: score,
      evidence,
      classicEvidence,
      confidence: 0.8,
      weight: 0.1,
      summary: `格局=${gejuCategory ?? '正格'} ${applicable ? '已评分' : '正格不强制'}`,
    }
  }
}
