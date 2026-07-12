/**
 * QiBuilder — 从四柱建立气节点（QiNode）
 */

import type { SixLines, CangGan, EarthlyBranch, HeavenlyStem } from '../types'
import type { QiNode, QiPillar } from './types'
import { getStemElement } from '@/lib/core'

// 使用全局 sequence 计数器（与 executor 共享）
let globalSeq = 0
let globalVer = 0
export function resetBuilderSequence(): void { globalSeq = 0; globalVer = 0 }
export function getGlobalSeq(): number { return globalSeq }
export function setGlobalSeq(val: number): void { globalSeq = val }

export function buildQiNodes(
  sixLines: SixLines,
  cangGanData: Record<EarthlyBranch, CangGan>,
): QiNode[] {
  const nodes: QiNode[] = []
  const pillars: QiPillar[] = ['year', 'month', 'day', 'hour']
  const ver = ++globalVer

  for (const pillar of pillars) {
    const p = sixLines[pillar]
    const isMonth = pillar === 'month'

    // 天干
    const ganElement = getStemElement(p.gan)
    const ganId = `${pillar}-gan-${p.gan}`
    const ganStrength = 10
    nodes.push({
      id: ganId, rootId: ganId, pillar, branch: p.zhi, hiddenStem: null,
      element: ganElement, strength: ganStrength, source: '天干', state: '正常', active: true,
      history: [{ modifier: 'QiBuilder', action: 'Create', before: 0, after: ganStrength, delta: ganStrength,
        reason: `${pillar}天干${p.gan}(${ganElement})初始气值${ganStrength}`, sequence: ++globalSeq, version: ver }],
    })

    // 藏干
    const cg = cangGanData[p.zhi]
    if (cg) {
      const scores = { ben: isMonth ? 20 : 6, zhong: isMonth ? 10 : 3, yao: isMonth ? 5 : 1 }
      const entries: { key: '本气' | '中气' | '余气'; stem: HeavenlyStem | null; score: number }[] = [
        { key: '本气', stem: cg.ben, score: scores.ben },
        { key: '中气', stem: cg.zhong, score: scores.zhong },
        { key: '余气', stem: cg.yao, score: scores.yao },
      ]

      for (const { key, stem, score } of entries) {
        if (!stem) continue
        const el = getStemElement(stem)
        const id = `${pillar}-${key === '本气' ? 'ben' : key === '中气' ? 'zhong' : 'yao'}-${stem}`
        const src = key === '本气' ? '本气' : key === '中气' ? '中气' : '余气'
        nodes.push({
          id, rootId: id, pillar, branch: p.zhi, hiddenStem: stem,
          element: el, strength: score, source: src as any, state: '正常', active: true,
          history: [{ modifier: 'QiBuilder', action: 'Create', before: 0, after: score, delta: score,
            reason: `${pillar}${p.zhi}${key}${stem}(${el})初始气值${score}${isMonth ? '（月令加权）' : ''}`,
            sequence: ++globalSeq, version: ver }],
        })
      }
    }
  }

  return nodes
}
