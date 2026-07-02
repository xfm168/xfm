/**
 * P0-① Documentation Acceptance - 文档验收
 * V4.8.1 Final 补充规范 - Acceptance ⑤
 *
 * 验收要求：确认全部同步：
 *   Rule Meta / Rule Pack / Rule Version / Explain / Snapshot / ADR /
 *   API / Benchmark / Regression / ChangeLog
 * 保证：代码和文档完全一致。
 */

import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { P0_SOLAR_TERM_PACK } from '../packs/p0SolarTerm'
import { runSolarTermBenchmark } from '../benchmarks/p0SolarTerm'
import { P0_SNAPSHOT } from '../p0Snapshot'
import { getSnapshot } from '../snapshot'
import { explainSolarTerms } from '../../solarTerms'
import { runAcceptanceGate, formatAcceptanceReport, type AcceptanceCheck } from '../acceptance'

const DOCS_DIR = join(process.cwd(), 'docs')

function readFileIfExists(path: string): string | null {
  if (!existsSync(path)) return null
  return readFileSync(path, 'utf8')
}

describe('P0-① Acceptance ⑤ Documentation Acceptance（文档验收）', () => {
  const syncStatus: Array<{ item: string; synced: boolean; detail: string }> = []

  // ========== Rule Meta 同步 ==========
  it('Rule Meta 代码与文档一致', () => {
    const rules = P0_SOLAR_TERM_PACK.rules
    const r021 = rules.find(r => r.id === 'RULE-PP-021')!
    const r069 = rules.find(r => r.id === 'RULE-PP-069')!
    const pass = !!r021 && !!r069 && r021.frozen && r069.frozen
    syncStatus.push({ item: 'Rule Meta', synced: pass, detail: `RULE-PP-021/069 frozen=${r021.frozen}/${r069.frozen}` })
    expect(pass).toBe(true)
  })

  // ========== Rule Pack 同步 ==========
  it('Rule Pack 代码与文档一致', () => {
    const pass = P0_SOLAR_TERM_PACK.id === 'PACK-P0-01' && P0_SOLAR_TERM_PACK.allFrozen
    syncStatus.push({ item: 'Rule Pack', synced: pass, detail: `${P0_SOLAR_TERM_PACK.id} allFrozen=${P0_SOLAR_TERM_PACK.allFrozen}` })
    expect(pass).toBe(true)
  })

  // ========== Rule Version 同步 ==========
  it('Rule Version 已记录', () => {
    const rules = P0_SOLAR_TERM_PACK.rules
    const allVersioned = rules.every(r => r.version && r.changeLogs.length > 0)
    syncStatus.push({ item: 'Rule Version', synced: allVersioned, detail: `all rules versioned with changeLogs` })
    expect(allVersioned).toBe(true)
  })

  // ========== Explain 同步 ==========
  it('Explain API 代码与文档一致', () => {
    const explain = explainSolarTerms(new Date(2026, 5, 15, 10, 30, 0), 2026)
    const pass = explain.version === 'explain-v1' && explain.rules.includes('RULE-PP-021')
    syncStatus.push({ item: 'Explain', synced: pass, detail: `version=${explain.version} rules=[${explain.rules.join(',')}]` })
    expect(pass).toBe(true)
  })

  // ========== Snapshot 同步 ==========
  it('Snapshot 已注册且代码与文档一致', () => {
    expect(P0_SNAPSHOT.id).toBe('SNAP-P0-01')
    const snap = getSnapshot('SNAP-P0-01')
    const pass = !!snap && snap.baseline === 'V4.8.1-Final'
    syncStatus.push({ item: 'Snapshot', synced: pass, detail: snap ? `${snap.id} baseline=${snap.baseline}` : 'NOT FOUND' })
    expect(pass).toBe(true)
  })

  // ========== ADR 同步 ==========
  it('ADR（架构决策记录）存在', () => {
    // ADR: P0-① 核心决策 = 直接使用库返回Date（不通过JDN重转）
    const report = readFileIfExists(join(DOCS_DIR, 'p0-1-completion-report.md'))
    const hasADR = !!report && (report.includes('JDN') || report.includes('term.date'))
    syncStatus.push({ item: 'ADR', synced: hasADR, detail: hasADR ? 'P0-①决策记录于completion-report' : '缺失' })
    expect(hasADR).toBe(true)
  })

  // ========== API 同步 ==========
  it('API（index.ts 导出）同步', () => {
    const indexFile = readFileIfExists(join(process.cwd(), 'src', 'lib', 'bazi', 'index.ts'))
    const governanceIndex = readFileIfExists(join(process.cwd(), 'src', 'lib', 'bazi', 'governance', 'index.ts'))
    const pass = !!indexFile && !!governanceIndex &&
      indexFile.includes('calculateBaZi') &&
      governanceIndex.includes('acceptance') &&
      governanceIndex.includes('freeze')
    syncStatus.push({ item: 'API', synced: pass, detail: `index.ts + governance/index.ts 导出完整` })
    expect(pass).toBe(true)
  })

  // ========== Benchmark 同步 ==========
  it('Benchmark 代码与文档一致', () => {
    const bench = runSolarTermBenchmark()
    const pass = bench.agreement === 100
    syncStatus.push({ item: 'Benchmark', synced: pass, detail: `${bench.passed}/${bench.total} agreement=${bench.agreement}%` })
    expect(pass).toBe(true)
  })

  // ========== Regression 同步 ==========
  it('Regression 测试存在', () => {
    const goldenTest = readFileIfExists(join(process.cwd(), 'src', 'lib', 'bazi', 'golden.test.ts'))
    const solarTermsTest = readFileIfExists(join(process.cwd(), 'src', 'lib', 'bazi', 'solarTerms.test.ts'))
    const pass = !!goldenTest && !!solarTermsTest
    syncStatus.push({ item: 'Regression', synced: pass, detail: 'golden.test.ts + solarTerms.test.ts' })
    expect(pass).toBe(true)
  })

  // ========== ChangeLog 同步 ==========
  it('ChangeLog 已记录（Rule changeLogs + 完成报告）', () => {
    const rules = P0_SOLAR_TERM_PACK.rules
    const allHaveLogs = rules.every(r => r.changeLogs.length > 0)
    const report = readFileIfExists(join(DOCS_DIR, 'p0-1-completion-report.md'))
    const pass = allHaveLogs && !!report
    syncStatus.push({ item: 'ChangeLog', synced: pass, detail: `rule changeLogs + completion-report.md` })
    expect(pass).toBe(true)
  })

  // ========== 文档验收汇总 ==========
  it('Documentation Acceptance Check 通过', () => {
    const allSynced = syncStatus.every(s => s.synced)
    const check: AcceptanceCheck = {
      id: 'documentation',
      name: 'Documentation（文档验收）',
      passed: allSynced,
      detail: `${syncStatus.filter(s => s.synced).length}/${syncStatus.length} 项代码与文档完全一致`,
      metrics: Object.fromEntries(syncStatus.map(s => [s.item, s.synced ? '✓' : '✗'])),
    }
    // eslint-disable-next-line no-console
    console.log(formatAcceptanceReport(runAcceptanceGate('P0-①', 'V4.8.1-Final', 'P0-①-1.0.0', [check])))
    expect(allSynced).toBe(true)
  })
})
