import type { SubEngine, SubEngineInput, SubEngineResult } from './types'
import type { Wuxing } from '../types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const KE: Record<Wuxing, Wuxing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
function emptyScore(): Record<Wuxing, number> { return { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 } }

/**
 * BridgeEngine（通关体系引擎）- Evidence 驱动
 *
 * 两行相战（相克），取中间生化之五行通关。
 * 例：金克木 → 取水通关（金生水→水生木）
 *
 * Evidence 驱动证据链：
 * 1. 阻塞五行：哪两行相战，各自数量
 * 2. 通关五行：取什么五行通关（相生链路）
 * 3. 流通检测：通关五行是否有根有源（count > 0）
 * 4. 反克检测：通关五行是否被其他五行克破
 * 5. 破局检测：冲合破坏通关五行
 *
 * 经典依据：《滴天髓》通关篇 + 《三命通会》
 */
export class BridgeEngine implements SubEngine {
  readonly name = 'BridgeEngine'
  readonly version = '1.0.0'

  evaluate(input: SubEngineInput): SubEngineResult {
    const { conflictingPairs, count } = input
    const score = emptyScore()
    const evidence: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

    evidence.push({
      step: 'S1-检测相战两行',
      text: `conflictingPairs=${JSON.stringify(conflictingPairs ?? [])} 五行计数：木=${count['木']}火=${count['火']}土=${count['土']}金=${count['金']}水=${count['水']}`,
      satisfied: true,
      citation: '《滴天髓》通关篇',
    })

    if (!conflictingPairs || conflictingPairs.length === 0) {
      evidence.push({
        step: 'S2-通关法跳过',
        text: '无两行相战信息 通关法不适用',
        satisfied: false,
        citation: '《滴天髓》',
      })
      return {
        engineName: this.name,
        applicable: false,
        skipReason: '无冲突两行',
        scores: score,
        evidence,
        classicEvidence: [],
        confidence: 0,
        weight: 0.1,
        summary: '通关：未适用（无相战）',
      }
    }

    const pairSummaries: string[] = []
    let anyTongguan = false

    for (const [a, b] of conflictingPairs) {
      const isAKeB = KE[a] === b
      const isBKeA = KE[b] === a
      let tongguan: Wuxing | null = null
      let keZhe: Wuxing = a   // 主动克方
      let beiKe: Wuxing = b   // 被克方

      if (isAKeB) {
        tongguan = SHENG[a]
        keZhe = a; beiKe = b
      } else if (isBKeA) {
        tongguan = SHENG[b]
        keZhe = b; beiKe = a
      } else {
        evidence.push({
          step: `S2-非直接相克(${a}与${b})`,
          text: `${a}与${b}非直接相克 跳过`,
          satisfied: false,
        })
        continue
      }

      const tg = tongguan!
      anyTongguan = true

      // === 阻塞五行分析 ===
      evidence.push({
        step: `S2-阻塞五行(${a}与${b})`,
        text: `阻塞：${keZhe}(${count[keZhe]}个)克${beiKe}(${count[beiKe]}个)，两行相战阻塞命局`,
        satisfied: true,
        citation: '《滴天髓》通关篇',
      })

      // === 通关五行分析 ===
      evidence.push({
        step: `S3-通关五行(${a}与${b})`,
        text: `通关：取${tg}通关，相生链路 ${keZhe}→生→${tg}→生→${beiKe}，疏通阻塞生化流通`,
        satisfied: true,
        citation: '《滴天髓》通关篇',
      })

      // === 流通检测：通关五行是否有根有源 ===
      const tgCount = count[tg]
      const hasRoot = tgCount > 0
      evidence.push({
        step: `S4-流通检测(${tg})`,
        text: hasRoot
          ? `流通：通关五行${tg}在四柱有${tgCount}个，有根有源，是否形成流通：是`
          : `流通：通关五行${tg}在四柱无根无源（0个），是否形成流通：否`,
        satisfied: hasRoot,
        citation: '《滴天髓》通关篇',
      })

      // === 反克检测：通关五行是否被克破 ===
      const keTg = WUXING_LIST.find(w => KE[w] === tg)! // 克通关者
      const keTgCount = count[keTg]
      const fanKe = keTgCount > tgCount
      evidence.push({
        step: `S5-反克检测(${tg})`,
        text: fanKe
          ? `反克：通关${tg}被${keTg}克破（${keTg}=${keTgCount} > ${tg}=${tgCount}），反克成局，通关失败`
          : `反克：通关${tg}未被${keTg}克破（${keTg}=${keTgCount} ≤ ${tg}=${tgCount}），无反克`,
        satisfied: !fanKe,
        citation: '《滴天髓》通关篇',
      })

      // === 破局检测：冲合破坏通关五行 ===
      const poJuPair = conflictingPairs.find(([x, y]) =>
        (x === tg || y === tg) && !(x === a && y === b))
      const poJu = !!poJuPair
      evidence.push({
        step: `S6-破局检测(${tg})`,
        text: poJu
          ? `破局：通关${tg}卷入其他相战(${poJuPair![0]}↔${poJuPair![1]})，冲合破坏通关`
          : `破局：未检测到冲合破坏通关${tg}，无破局`,
        satisfied: !poJu,
        citation: '《三命通会》论通关',
      })

      score[tg] = Math.max(score[tg], 2)
      score[a] = Math.min(score[a], -1)
      score[b] = Math.min(score[b], -1)

      pairSummaries.push(`${a}↔${b}→通关${tg}${hasRoot ? '(流通)' : '(无根)'}${fanKe ? '(反克)' : ''}${poJu ? '(破局)' : ''}`)
    }

    evidence.push({
      step: 'S7-通关打分',
      text: `木:${score['木']} 火:${score['火']} 土:${score['土']} 金:${score['金']} 水:${score['水']}`,
      satisfied: true,
      citation: '《滴天髓》通关篇',
    })

    const classicEvidence: ClassicEvidenceRef[] = [
      {
        classicId: 'dts', classicName: '滴天髓', chapterId: 'dts-c2', chapterTitle: '通关篇',
        paragraphId: 'dts-c2-p2', sentenceId: 'dts-c2-p2-s1',
        quotedText: '通关之法，在于两行相战，取中间生化之五行以和之。',
        citation: 'direct', supports: '通关法核心原则', hasControversy: false,
      },
      {
        classicId: 'dts', classicName: '滴天髓', chapterId: 'dts-c2', chapterTitle: '通关篇',
        paragraphId: 'dts-c2-p2', sentenceId: 'dts-c2-p2-s2',
        quotedText: '金木相战，取水通关；水火相战，取木通关。',
        citation: 'direct', supports: '通关具体取法', hasControversy: false,
      },
      {
        classicId: 'smth', classicName: '三命通会', chapterId: 'smth-c2', chapterTitle: '论通关',
        paragraphId: 'smth-c2-p3', sentenceId: 'smth-c2-p3-s1',
        quotedText: '两行相战，必有一伤，通关者和之。',
        citation: 'direct', supports: '通关者和之', hasControversy: false,
      },
    ]

    return {
      engineName: this.name,
      applicable: anyTongguan,
      scores: score,
      evidence,
      classicEvidence,
      confidence: 0.7,
      weight: 0.1,
      summary: `通关：${pairSummaries.join(' ')}`,
    }
  }
}
