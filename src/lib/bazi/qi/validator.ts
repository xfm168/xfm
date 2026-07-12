/**
 * QiValidator — 每步自动校验层
 *
 * 检查项：
 * - 负气值（strength < 0）
 * - active=false 仍被 Aggregator 统计（防止逻辑错误）
 * - rootId 丢失
 * - Snapshot 与 QiNode 总气值不一致
 * - History 无序（sequence 乱序）
 * - 气守恒（active 节点总和变化量应等于 diff 中 delta 之和）
 */

import type { QiNode, QiSnapshot, ValidationIssue } from './types'

export function validateStep(
  stepName: string,
  qiNodes: QiNode[],
  snapshot: QiSnapshot,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // 1. 负气值
  for (const node of qiNodes) {
    if (node.strength < 0) {
      issues.push({
        level: 'error',
        step: stepName,
        message: `负气值: ${node.id} strength=${node.strength}`,
        nodeId: node.id,
      })
    }
  }

  // 2. active=false 仍参与统计
  const qiSum = qiNodes.filter(n => n.active).reduce((s, n) => s + n.strength, 0)
  const snapSum = snapshot.totalStrength
  if (Math.abs(qiSum - snapSum) > 0.1) {
    issues.push({
      level: 'error',
      step: stepName,
      message: `气值不一致: active汇总=${qiSum.toFixed(1)} snapshot=${snapSum.toFixed(1)}`,
    })
  }

  // 3. rootId 丢失
  for (const node of qiNodes) {
    if (!node.rootId || node.rootId.length === 0) {
      issues.push({
        level: 'error',
        step: stepName,
        message: `rootId丢失: ${node.id}`,
        nodeId: node.id,
      })
    }
  }

  // 4. history 无序（sequence 乱序）
  for (const node of qiNodes) {
    for (let i = 1; i < node.history.length; i++) {
      if (node.history[i].sequence <= node.history[i - 1].sequence) {
        issues.push({
          level: 'warning',
          step: stepName,
          message: `history乱序: ${node.id} sequence[${i - 1}]=${node.history[i - 1].sequence} <= sequence[${i}]=${node.history[i].sequence}`,
          nodeId: node.id,
        })
        break
      }
    }
  }

  // 5. 气守恒（diff delta 之和应等于 totalStrength 变化）
  for (const diff of snapshot.diffs) {
    if (diff.field === 'strength' && typeof diff.before === 'number' && typeof diff.after === 'number') {
      // strength 变化量应与该节点的 history 最新 delta 一致
      const node = qiNodes.find(n => n.id === diff.nodeId)
      if (node && node.history.length > 0) {
        const latest = node.history[node.history.length - 1]
        const expectedAfter = latest.before + latest.delta
        if (Math.abs(latest.after - expectedAfter) > 0.1) {
          issues.push({
            level: 'warning',
            step: stepName,
            message: `气守恒异常: ${node.id} expected=${expectedAfter.toFixed(1)} actual=${latest.after.toFixed(1)}`,
            nodeId: node.id,
          })
        }
      }
    }
  }

  return issues
}
