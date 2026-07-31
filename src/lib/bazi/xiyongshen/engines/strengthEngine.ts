import type { SubEngine, SubEngineInput, SubEngineResult } from './types'
import type { Wuxing } from '../types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']

const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const KE: Record<Wuxing, Wuxing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }

/** 生我者（印星） */
function get印(dayGanWx: Wuxing): Wuxing {
  return WUXING_LIST.find(w => SHENG[w] === dayGanWx)!
}
/** 同我者（比劫） */
function get比劫(dayGanWx: Wuxing): Wuxing {
  return dayGanWx
}
/** 我生者（食伤） */
function get食伤(dayGanWx: Wuxing): Wuxing {
  return SHENG[dayGanWx]
}
/** 克我者（官杀，最强抑制力） */
function get官杀(dayGanWx: Wuxing): Wuxing {
  return WUXING_LIST.find(w => KE[w] === dayGanWx)!
}

/**
 * StrengthEngine（日主旺衰判断引擎）
 *
 * 不直接产生喜用神评分，而是计算日主强弱等级并输出 Evidence。
 * 旺衰是扶抑法、格局法等其他引擎的基础输入。
 *
 * 经典依据：《滴天髓》通神论 + 《子平真诠》论用神
 */
export class StrengthEngine implements SubEngine {
  readonly name = 'StrengthEngine'
  readonly version = '1.0.0'

  evaluate(input: SubEngineInput): SubEngineResult {
    const { dayGanWuxing, count, monthZhiWuxing, dayRootCount } = input

    const yin = get印(dayGanWuxing)
    const bi = get比劫(dayGanWuxing)
    const shi = get食伤(dayGanWuxing)
    const ke = get官杀(dayGanWuxing)

    const yinCount = count[yin] ?? 0
    const biCount = count[bi] ?? 0
    const shiCount = count[shi] ?? 0
    const keCount = count[ke] ?? 0

    // 月令是否得令
    const deLing = monthZhiWuxing === yin || monthZhiWuxing === bi
    // 根气
    const roots = dayRootCount ?? 0

    // 综合强弱：印比生扶日主，食伤泄气、官杀克制（官杀抑制力最强，权重 3）
    const supportScore = yinCount * 2 + biCount * 2 + (deLing ? 3 : 0) + roots
    const drainScore = shiCount * 1 + keCount * 3

    let strengthLevel: number
    if (supportScore - drainScore >= 10) strengthLevel = 3
    else if (supportScore - drainScore >= 6) strengthLevel = 2
    else if (supportScore - drainScore >= 3) strengthLevel = 1
    else if (supportScore - drainScore >= -2) strengthLevel = 0
    else if (supportScore - drainScore >= -6) strengthLevel = -1
    else if (supportScore - drainScore >= -10) strengthLevel = -2
    else strengthLevel = -3

    const strengthText = strengthLevel >= 2 ? '身强' : strengthLevel <= -2 ? '身弱' : '中和'

    const evidence = [
      {
        step: 'S1-计算印比官杀',
        text: `印星(${yin})=${yinCount} 比劫(${bi})=${biCount} 支持分=${yinCount * 2 + biCount * 2} | 食伤(${shi})=${shiCount} 官杀(${ke})=${keCount} 耗泄分=${shiCount + keCount * 3}`,
        satisfied: true,
        citation: '《滴天髓》通神论',
      },
      {
        step: 'S2-月令得令',
        text: `月令=${monthZhiWuxing} 得令=${deLing}（印比同五行则得令）`,
        satisfied: deLing,
        citation: '《子平真诠》论用神',
      },
      {
        step: 'S3-根气',
        text: `dayRootCount=${roots}`,
        satisfied: roots >= 1,
      },
      {
        step: 'S4-综合判定',
        text: `支持分=${supportScore} 耗泄分=${drainScore} → 强弱等级=${strengthLevel}(${strengthText})`,
        satisfied: true,
        citation: '《滴天髓》通神论',
      },
    ]

    // StrengthEngine 不产生喜用神评分，但将 strengthLevel 写入 summary 供其他引擎读取
    return {
      engineName: this.name,
      applicable: true,
      scores: { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 },
      evidence,
      classicEvidence: [
        {
          classicId: 'dts', classicName: '滴天髓', chapterId: 'dts-c1', chapterTitle: '通神论',
          paragraphId: 'dts-c1-p1', sentenceId: 'dts-c1-p1-s1',
          quotedText: '欲识三元万法宗，先观帝载与神机。',
          citation: 'direct', supports: '日主旺衰为八字根本', hasControversy: false,
        },
        {
          classicId: 'zpzq', classicName: '子平真诠', chapterId: 'zpzq-c2', chapterTitle: '论用神',
          paragraphId: 'zpzq-c2-p1', sentenceId: 'zpzq-c2-p1-s1',
          quotedText: '用神之法定于月令，月令者，提纲之府，故先观月令。',
          citation: 'direct', supports: '月令是旺衰判断基础', hasControversy: false,
        },
      ],
      confidence: 0.85,
      weight: 0, // 不参与最终评分加权，仅提供 strengthLevel
      summary: `日主${dayGanWuxing} ${strengthText}(等级${strengthLevel}) 支持分=${supportScore}`,
    }
  }
}
