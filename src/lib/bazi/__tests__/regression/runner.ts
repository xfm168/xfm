/**
 * 回归测试运行器 V4（Golden Snapshot 模式）
 * 适配：PipelineContext / Immutable / Validation / version / cause / EventBus
 */

import { runQiEngine } from '../../qi/engine'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface TestCase {
  name: string
  sixLines: any
  dayGan: string
  monthZhi: string
  expectedQiNodeCount: number
  expectedDayElement: string
  expectedWangShuai: string
}

const cases: TestCase[] = [
  {
    name: '申子辰三合水局',
    sixLines: {
      year: { gan: '庚', zhi: '申' }, month: { gan: '戊', zhi: '子' },
      day: { gan: '壬', zhi: '戌' }, hour: { gan: '甲', zhi: '辰' },
    },
    dayGan: '壬', monthZhi: '子',
    expectedQiNodeCount: 14, expectedDayElement: '水', expectedWangShuai: '旺',
  },
  {
    name: '寅卯辰三会木方',
    sixLines: {
      year: { gan: '甲', zhi: '寅' }, month: { gan: '乙', zhi: '卯' },
      day: { gan: '丙', zhi: '辰' }, hour: { gan: '丁', zhi: '亥' },
    },
    dayGan: '丙', monthZhi: '卯',
    expectedQiNodeCount: 13, expectedDayElement: '火', expectedWangShuai: '相',
  },
  {
    name: '子丑六合合绊',
    sixLines: {
      year: { gan: '甲', zhi: '子' }, month: { gan: '丙', zhi: '寅' },
      day: { gan: '戊', zhi: '子' }, hour: { gan: '己', zhi: '丑' },
    },
    dayGan: '戊', monthZhi: '寅',
    expectedQiNodeCount: 12, expectedDayElement: '土', expectedWangShuai: '死',
  },
]

let passed = 0
let failed = 0
const goldenDir = path.join(__dirname, '..', '..', '..', '..', 'golden')

for (const tc of cases) {
  const result = runQiEngine(tc.sixLines, tc.dayGan as any, tc.monthZhi as any)
  const snap0 = result.snapshots[0]
  const finalSnap = result.finalSnapshot

  // 生成 golden 数据
  const golden = {
    name: tc.name,
    dayElement: result.dayElement,
    wangShuai: result.wangShuai,
    strengthScore: result.strengthScore,
    finalHash: finalSnap.hash,
    finalElementScores: finalSnap.elementScores,
    finalSourceScores: finalSnap.sourceScores,
    stepCount: result.snapshots.length,
    validationErrors: result.validationIssues.filter(i => i.level === 'error').map(i => i.message),
    diffs: result.snapshots.map(s => ({
      step: s.step,
      diffCount: s.diffs.length,
      entries: s.diffs.map(d => ({
        nodeId: d.nodeId,
        field: d.field,
        before: d.before,
        after: d.after,
        cause: d.cause,
      })),
    })),
  }

  // Golden Snapshot 比对（优先 hash 比对，不一致时逐项比较）
  const goldenPath = path.join(goldenDir, `${tc.name}.json`)
  if (fs.existsSync(goldenPath)) {
    const stored = JSON.parse(fs.readFileSync(goldenPath, 'utf-8'))

    // Hash 快速比对
    if (stored.finalHash === golden.finalHash) {
      passed++
      console.log(`✅ ${tc.name} (golden hash matched: ${golden.finalHash})`)
    } else {
      // Hash 不一致，逐项比较给出具体差异
      const mismatches: string[] = []
      mismatches.push(`hash: golden=${stored.finalHash} current=${golden.finalHash}`)
      for (const el of ['木', '火', '土', '金', '水'] as const) {
        if (stored.finalElementScores[el] !== golden.finalElementScores[el]) {
          mismatches.push(`${el}: golden=${stored.finalElementScores[el]} current=${golden.finalElementScores[el]}`)
        }
      }
      if (stored.strengthScore !== golden.strengthScore) {
        mismatches.push(`strengthScore: golden=${stored.strengthScore} current=${golden.strengthScore}`)
      }
      if (stored.wangShuai !== golden.wangShuai) {
        mismatches.push(`wangShuai: golden=${stored.wangShuai} current=${golden.wangShuai}`)
      }
      failed++
      console.log(`❌ ${tc.name} (golden mismatch)`)
      for (const m of mismatches) console.log(`   - ${m}`)
    }
  } else {
    // 首次运行：生成 golden
    fs.mkdirSync(goldenDir, { recursive: true })
    fs.writeFileSync(goldenPath, JSON.stringify(golden, null, 2), 'utf-8')
    passed++
    console.log(`✅ ${tc.name} (golden created)`)
  }

  // 功能验证
  const checks = [
    { label: '气节点数量', pass: snap0.qiNodes.length === tc.expectedQiNodeCount },
    { label: '日主五行', pass: result.dayElement === tc.expectedDayElement },
    { label: '旺衰', pass: result.wangShuai === tc.expectedWangShuai },
    { label: '气值守恒', pass: Math.abs(
      result.finalQi.filter((n: any) => n.active).reduce((s: number, n: any) => s + n.strength, 0) -
      finalSnap.totalStrength
    ) < 0.1 },
    { label: 'rootId', pass: result.finalQi.every((n: any) => typeof n.rootId === 'string' && n.rootId.length > 0) },
    { label: 'version', pass: result.finalQi.every((n: any) =>
      n.history.length >= 1 && typeof n.history[0].version === 'number' && n.history[0].version > 0
    )},
    { label: 'cause链', pass: finalSnap.diffs.every((d: any) => Array.isArray(d.cause) && d.cause.length > 0) },
    { label: '多步快照', pass: result.snapshots.length >= 2 },
    { label: 'Source维度', pass: typeof finalSnap.sourceScores['天干'] === 'number' },
    { label: 'Validation', pass: result.validationIssues.filter(i => i.level === 'error').length === 0 },
    { label: 'Immutable', pass: (() => {
      try { (finalSnap as any).elementScores['木'] = 9999; return false } catch { return true }
    })() },
  ]

  const allPass = checks.every(c => c.pass)
  if (!allPass) {
    failed++
    console.log(`❌ ${tc.name} (functional)`)
    for (const c of checks) { if (!c.pass) console.log(`   - ${c.label} 失败`) }
  }
}

console.log(`\n回归测试完成：通过 ${passed}/${cases.length * 2}，失败 ${failed}/${cases.length * 2}`)
process.exit(failed > 0 ? 1 : 0)
