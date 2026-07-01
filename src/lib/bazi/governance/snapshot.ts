/**
 * Version Snapshot - 版本快照
 * V4.8.1 Baseline
 *
 * 捕获某个时刻全部 Rule / Pipeline / Explain 版本状态，
 * 用于回滚和历史报告永久可重现（Backward Compatibility 铁律）。
 *
 * 历史报告必须能基于当时快照重新生成，不受后续规则升级影响。
 */

export interface RuleSnapshotEntry {
  ruleId: string
  version: string
  status: 'draft' | 'review' | 'stable' | 'deprecated'
  frozen: boolean
}

export interface SnapshotMeta {
  /** 快照ID */
  id: string
  /** 快照名称 */
  name: string
  /** 模块（如 P0-①） */
  module: string
  /** 创建时间 ISO */
  createdAt: string
  /** 基线版本 */
  baseline: string
  /** Pipeline 版本 */
  pipelineVersion: string
  /** Explain API 版本 */
  explainVersion: string
  /** Golden Dataset 版本 */
  goldenDatasetVersion: string
  /** 规则版本清单 */
  rules: RuleSnapshotEntry[]
}

/** 快照注册表 */
const SNAPSHOT_REGISTRY: SnapshotMeta[] = []

/** 注册快照 */
export function registerSnapshot(snapshot: SnapshotMeta): void {
  const exists = SNAPSHOT_REGISTRY.find(s => s.id === snapshot.id)
  if (!exists) {
    SNAPSHOT_REGISTRY.push(snapshot)
  }
}

/** 获取快照 */
export function getSnapshot(id: string): SnapshotMeta | undefined {
  return SNAPSHOT_REGISTRY.find(s => s.id === id)
}

/** 列出全部快照 */
export function listSnapshots(): SnapshotMeta[] {
  return [...SNAPSHOT_REGISTRY]
}

/** 获取某模块最新快照 */
export function getLatestSnapshot(module: string): SnapshotMeta | undefined {
  const moduleSnapshots = SNAPSHOT_REGISTRY.filter(s => s.module === module)
  if (moduleSnapshots.length === 0) return undefined
  return moduleSnapshots[moduleSnapshots.length - 1]
}
