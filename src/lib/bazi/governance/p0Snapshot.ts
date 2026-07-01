/**
 * P0-① Snapshot - 模块版本快照
 * V4.8.1 Baseline
 *
 * 冻结 P0-① 交付时刻的全部版本状态，用于历史报告可重现。
 */

import { registerSnapshot, type SnapshotMeta } from './snapshot'
import { P0_SOLAR_TERM_PACK } from './packs/p0SolarTerm'

const P0_SNAPSHOT: SnapshotMeta = {
  id: 'SNAP-P0-01',
  name: '节气精确到时分秒 - 交付快照',
  module: 'P0-①',
  createdAt: '2026-07-01T00:00:00.000Z',
  baseline: 'V4.8.1-Final',
  pipelineVersion: 'pipeline-v1',
  explainVersion: 'explain-v1',
  goldenDatasetVersion: 'golden-v1',
  rules: P0_SOLAR_TERM_PACK.rules.map(r => ({
    ruleId: r.id,
    version: r.version,
    status: r.status,
    frozen: r.frozen,
  })),
}

registerSnapshot(P0_SNAPSHOT)

export { P0_SNAPSHOT }
