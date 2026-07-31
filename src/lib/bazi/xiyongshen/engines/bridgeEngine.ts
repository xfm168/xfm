import type { SubEngine, SubEngineInput, SubEngineResult } from './types'
import type { Wuxing } from '../types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

const WUXING_LIST: Wuxing[] = ['木', '火', '土', '金', '水']
const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
const KE: Record<Wuxing, Wuxing> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
function emptyScore(): Record<Wuxing, number> { return { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 } }

/**
 * BridgeEngine（通关体系引擎）
 *
 * 两行相战（相克），取中间生化之五行通关。
 * 例：金克木 → 取水通关（金生水→水生木）
 *
 * 经典依据：《滴天髓》通关篇 + 《三命通会》
 */
export class BridgeEngine implements SubEngine {
  readonly name = 'BridgeEngine'
  readonly version = '1.0.0'

  evaluate(input: SubEngineInput): SubEngineResult {
    const { conflictingPairs } = input
    const score = emptyScore()
    const evidence: Array<{ step: string; text: string; satisfied?: boolean; citation?: string }> = []

    evidence.push({
      step: 'S1-检测相战两行',
      text: `conflictingPairs=${JSON.stringify(conflictingPairs ?? [])}`,
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

    for (const [a, b] of conflictingPairs) {
      const isAKeB = KE[a] === b
      const isBKeA = KE[b] === a
      let tongguan: Wuxing | null = null

      if (isAKeB) {
        tongguan = SHENG[a]
        evidence.push({
          step: `S2-通关(${a}克${b})`,
          text: `${a}克${b}相战 取${a}之生化(${tongguan})通关：${a}→${tongguan}→${b}`,
          satisfied: true,
          citation: '《滴天髓》通关篇',
        })
      } else if (isBKeA) {
        tongguan = SHENG[b]
        evidence.push({
          step: `S2-通关(${b}克${a})`,
          text: `${b}克${a}相战 取${b}之生化(${tongguan})通关：${b}→${tongguan}→${a}`,
          satisfied: true,
          citation: '《滴天髓》通关篇',
        })
      } else {
        evidence.push({
          step: `S2-非直接相克(${a}与${b})`,
          text: `${a}与${b}非直接相克 跳过`,
          satisfied: false,
        })
      }

      if (tongguan) {
        score[tongguan] = Math.max(score[tongguan], 2)
        score[a] = Math.min(score[a], -1)
        score[b] = Math.min(score[b], -1)
      }
    }

    evidence.push({
      step: 'S3-通关打分',
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
      applicable: true,
      scores: score,
      evidence,
      classicEvidence,
      confidence: 0.7,
      weight: 0.1,
      summary: `通关：${conflictingPairs.map(([a, b]) => `${a}↔${b}`).join(' ')}`,
    }
  }
}
