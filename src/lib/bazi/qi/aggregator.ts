/**
 * QiAggregator V4 — 多维聚合 + Diff（含 cause） + Immutable Snapshot
 */

import type { FiveElement } from '../types'
import type { QiNode, QiPillar, QiSource, QiSnapshot, QiDiffEntry } from './types'

/**
 * 确定性 hash：基于 elementScores 生成
 * 用于 golden test 高速比对
 */
export function computeSnapshotHash(elementScores: Record<FiveElement, number>): string {
  const raw = ['木', '火', '土', '金', '水'].map(el => `${el}:${elementScores[el as FiveElement]}`).join(',')
  // 简单 FNV-1a hash（无需 crypto 依赖）
  let h = 2166136261
  for (let i = 0; i < raw.length; i++) {
    h ^= raw.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

export function aggregateElements(qiNodes: QiNode[]): Record<FiveElement, number> {
  const scores: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const node of qiNodes) {
    if (node.active) scores[node.element] += node.strength
  }
  return scores
}

export function aggregateByPillar(qiNodes: QiNode[]): Record<QiPillar, Record<FiveElement, number>> {
  const result: Record<QiPillar, Record<FiveElement, number>> = {
    year: { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 },
    month: { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 },
    day: { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 },
    hour: { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 },
  }
  for (const node of qiNodes) {
    if (node.active) result[node.pillar][node.element] += node.strength
  }
  return result
}

export function aggregateBySource(qiNodes: QiNode[]): Record<QiSource, number> {
  const result: Record<QiSource, number> = { '天干': 0, '本气': 0, '中气': 0, '余气': 0 }
  for (const node of qiNodes) {
    if (node.active) result[node.source] += node.strength
  }
  return result
}

/** 自动生成 Diff（含 cause 链） */
export function computeDiff(
  beforeNodes: QiNode[],
  afterNodes: QiNode[],
  stepName: string,
): QiDiffEntry[] {
  const diffs: QiDiffEntry[] = []
  const beforeMap = new Map(beforeNodes.map(n => [n.id, n]))

  for (const afterNode of afterNodes) {
    const beforeNode = beforeMap.get(afterNode.id)
    if (!beforeNode) continue

    if (beforeNode.strength !== afterNode.strength) {
      const latest = afterNode.history[afterNode.history.length - 1]
      diffs.push({
        nodeId: afterNode.id,
        field: 'strength',
        before: beforeNode.strength,
        after: afterNode.strength,
        modifier: latest?.modifier || stepName,
        reason: latest?.reason || '',
        cause: latest ? [latest.modifier, latest.reason] : [stepName],
      })
    }

    if (beforeNode.active !== afterNode.active) {
      diffs.push({
        nodeId: afterNode.id,
        field: 'active',
        before: beforeNode.active,
        after: afterNode.active,
        modifier: stepName,
        reason: afterNode.active ? '重新激活' : '消散/被合化',
        cause: [stepName, afterNode.active ? '重新激活' : '消散/被合化'],
      })
    }

    if (beforeNode.element !== afterNode.element) {
      diffs.push({
        nodeId: afterNode.id,
        field: 'element',
        before: beforeNode.element,
        after: afterNode.element,
        modifier: stepName,
        reason: '五行转化',
        cause: [stepName, '五行转化'],
      })
    }

    if (beforeNode.state !== afterNode.state) {
      diffs.push({
        nodeId: afterNode.id,
        field: 'state',
        before: beforeNode.state,
        after: afterNode.state,
        modifier: stepName,
        reason: '状态变更',
        cause: [stepName, '状态变更'],
      })
    }
  }

  return diffs
}

let snapshotSequence = 0
export function resetSnapshotSequence(): void { snapshotSequence = 0 }

/**
 * 生成 Immutable Snapshot
 * Object.freeze 防止任何下游模块修改
 */
export function takeSnapshot(
  step: string,
  qiNodes: QiNode[],
  prevNodes?: QiNode[],
  version: number = 0,
): QiSnapshot {
  const elementScores = aggregateElements(qiNodes)
  const pillarScores = aggregateByPillar(qiNodes)
  const sourceScores = aggregateBySource(qiNodes)
  const totalStrength = Object.values(elementScores).reduce((s, v) => s + v, 0)
  const diffs = prevNodes ? computeDiff(prevNodes, qiNodes, step) : []

  // 深拷贝 + freeze
  const frozenNodes = qiNodes.map(n => Object.freeze({
    ...n,
    history: Object.freeze([...n.history]),
  }))

  const snapshot: QiSnapshot = Object.freeze({
    step,
    version,
    sequence: ++snapshotSequence,
    elementScores: Object.freeze({ ...elementScores }),
    pillarScores: Object.freeze({
      year: Object.freeze({ ...pillarScores.year }),
      month: Object.freeze({ ...pillarScores.month }),
      day: Object.freeze({ ...pillarScores.day }),
      hour: Object.freeze({ ...pillarScores.hour }),
    }),
    sourceScores: Object.freeze({ ...sourceScores }),
    totalStrength,
    diffs: Object.freeze(diffs),
    qiNodes: frozenNodes,
    hash: computeSnapshotHash(elementScores),
  })

  return snapshot
}
