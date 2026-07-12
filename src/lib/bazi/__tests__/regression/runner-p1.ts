/**
 * P1 回归测试运行器（Golden Snapshot 模式）
 *
 * P1 新增规则命例：
 * - 子午冲
 * - 寅巳申无恩之刑
 * - 子未害
 * - 寅申冲
 * - 寅卯辰三会木方
 * - 子丑六合合绊
 * - 甲己天干五合化土
 * - 丙辛天干五合合绊
 * - 申子辰三合水局合绊（子被午冲）
 */

import { runP1Engine } from '@/lib/bazi/qi/runP1Engine'
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
  expectConflictTypes: string[]
  expectHeHuaTypes: string[]
  tags: string[]  // 命例标签
}

const cases: TestCase[] = [
  // ─── 冲 ───
  {
    name: '子午冲',
    sixLines: {
      year: { gan: '甲', zhi: '子' }, month: { gan: '丙', zhi: '午' },
      day: { gan: '戊', zhi: '寅' }, hour: { gan: '庚', zhi: '申' },
    },
    dayGan: '戊', monthZhi: '午',
    expectConflictTypes: ['冲'],
    expectHeHuaTypes: [],
    tags: ['冲', '子午'],
  },
  {
    name: '寅申冲',
    sixLines: {
      year: { gan: '甲', zhi: '寅' }, month: { gan: '丙', zhi: '巳' },
      day: { gan: '戊', zhi: '午' }, hour: { gan: '庚', zhi: '申' },
    },
    dayGan: '戊', monthZhi: '巳',
    expectConflictTypes: ['冲', '刑', '害', '破'],
    expectHeHuaTypes: ['六合合绊', '三合合绊'],  // 允许额外检测项
    tags: ['冲', '寅申', '刑', '害', '破', '复合'],
  },
  // ─── 刑 ───
  {
    name: '寅巳申无恩之刑',
    sixLines: {
      year: { gan: '甲', zhi: '寅' }, month: { gan: '丙', zhi: '巳' },
      day: { gan: '戊', zhi: '午' }, hour: { gan: '庚', zhi: '申' },
    },
    dayGan: '戊', monthZhi: '巳',
    expectConflictTypes: ['刑'],
    expectHeHuaTypes: [],
    tags: ['刑', '无恩之刑', '寅巳申'],
  },
  {
    name: '丑戌未恃势之刑',
    sixLines: {
      year: { gan: '甲', zhi: '丑' }, month: { gan: '丙', zhi: '戌' },
      day: { gan: '戊', zhi: '未' }, hour: { gan: '庚', zhi: '申' },
    },
    dayGan: '戊', monthZhi: '戌',
    expectConflictTypes: ['刑'],
    expectHeHuaTypes: [],
    tags: ['刑', '恃势之刑', '丑戌未'],
  },
  // ─── 害 ───
  {
    name: '子未害',
    sixLines: {
      year: { gan: '甲', zhi: '子' }, month: { gan: '丙', zhi: '寅' },
      day: { gan: '戊', zhi: '未' }, hour: { gan: '庚', zhi: '申' },
    },
    dayGan: '戊', monthZhi: '寅',
    expectConflictTypes: ['害'],
    expectHeHuaTypes: [],
    tags: ['害', '子未'],
  },
  // ─── 破 ───
  {
    name: '卯午破',
    sixLines: {
      year: { gan: '甲', zhi: '卯' }, month: { gan: '丙', zhi: '寅' },
      day: { gan: '戊', zhi: '午' }, hour: { gan: '庚', zhi: '申' },
    },
    dayGan: '戊', monthZhi: '寅',
    expectConflictTypes: ['破'],
    expectHeHuaTypes: [],
    tags: ['破', '卯午'],
  },
  // ─── 三会 ───
  {
    name: '寅卯辰三会木方',
    sixLines: {
      year: { gan: '甲', zhi: '寅' }, month: { gan: '乙', zhi: '卯' },
      day: { gan: '丙', zhi: '辰' }, hour: { gan: '丁', zhi: '亥' },
    },
    dayGan: '丙', monthZhi: '卯',
    expectConflictTypes: ['害'],
    expectHeHuaTypes: ['三会化木', '六合化木'],
    tags: ['三会', '木方', '寅卯辰', '成化'],
  },
  // ─── 三合 ───
  {
    name: '申子辰三合水局',
    sixLines: {
      year: { gan: '庚', zhi: '申' }, month: { gan: '壬', zhi: '子' },
      day: { gan: '甲', zhi: '午' }, hour: { gan: '丙', zhi: '辰' },
    },
    dayGan: '甲', monthZhi: '子',
    expectConflictTypes: ['冲'],
    expectHeHuaTypes: ['三合合绊'],  // 子被午冲，不能成化
    tags: ['三合', '水局', '申子辰', '冲破合'],
  },
  // ─── 六合 ───
  {
    name: '子丑六合合绊',
    sixLines: {
      year: { gan: '甲', zhi: '子' }, month: { gan: '丙', zhi: '寅' },
      day: { gan: '戊', zhi: '子' }, hour: { gan: '己', zhi: '丑' },
    },
    dayGan: '戊', monthZhi: '寅',
    expectConflictTypes: [],
    expectHeHuaTypes: ['六合合绊'],
    tags: ['六合', '合绊', '子丑'],
  },
  // ─── 天干五合 ───
  {
    name: '甲己天干五合化土',
    sixLines: {
      year: { gan: '甲', zhi: '寅' }, month: { gan: '己', zhi: '辰' },
      day: { gan: '丙', zhi: '午' }, hour: { gan: '丁', zhi: '酉' },
    },
    dayGan: '丙', monthZhi: '辰',
    expectConflictTypes: [],
    expectHeHuaTypes: ['天干五合化土'],
    tags: ['天干五合', '甲己', '化土', '成化'],
  },
  {
    name: '丙辛天干五合合绊',
    sixLines: {
      year: { gan: '丙', zhi: '寅' }, month: { gan: '辛', zhi: '未' },
      day: { gan: '戊', zhi: '午' }, hour: { gan: '壬', zhi: '子' },
    },
    dayGan: '戊', monthZhi: '未',
    expectConflictTypes: [],
    expectHeHuaTypes: ['天干五合合绊'],
    tags: ['天干五合', '丙辛', '合绊'],
  },
]

let passed = 0
let failed = 0
const goldenDir = path.join(__dirname, '..', '..', '..', '..', 'golden')

for (const tc of cases) {
  const result = runP1Engine(tc.sixLines, tc.dayGan as any, tc.monthZhi as any)
  const snap0 = result.snapshots[0]
  const finalSnap = result.finalSnapshot

  // 生成 golden 数据
  const golden = {
    name: tc.name,
    tags: tc.tags,
    dayElement: result.dayElement,
    wangShuai: result.wangShuai,
    strengthScore: result.strengthScore,
    finalHash: finalSnap.hash,
    finalElementScores: finalSnap.elementScores,
    finalSourceScores: finalSnap.sourceScores,
    stepCount: result.snapshots.length,
    conflictTypes: result.conflictCommands.map(c => c.type),
    heHuaTypes: result.heHuaCommands.map(c => `${c.type}${c.success ? `化${c.huaElement}` : '合绊'}`),
    validationErrors: result.validationIssues.filter(i => i.level === 'error').map(i => i.message),
    diffs: result.snapshots.map(s => ({
      step: s.step,
      diffCount: s.diffs.length,
      entries: s.diffs.slice(0, 10).map(d => ({
        nodeId: d.nodeId,
        field: d.field,
        before: d.before,
        after: d.after,
        cause: d.cause,
      })),
    })),
  }

  // Golden 比对
  const goldenPath = path.join(goldenDir, `p1-${tc.name}.json`)
  if (fs.existsSync(goldenPath)) {
    const stored = JSON.parse(fs.readFileSync(goldenPath, 'utf-8'))
    if (stored.finalHash === golden.finalHash) {
      passed++
      console.log(`✅ ${tc.name} (hash: ${golden.finalHash})`)
    } else {
      const mismatches: string[] = []
      mismatches.push(`hash: golden=${stored.finalHash} current=${golden.finalHash}`)
      for (const el of ['木', '火', '土', '金', '水'] as const) {
        if (stored.finalElementScores[el] !== golden.finalElementScores[el]) {
          mismatches.push(`${el}: golden=${stored.finalElementScores[el]} current=${golden.finalElementScores[el]}`)
        }
      }
      failed++
      console.log(`❌ ${tc.name} (golden mismatch)`)
      for (const m of mismatches) console.log(`   - ${m}`)
    }
  } else {
    fs.mkdirSync(goldenDir, { recursive: true })
    fs.writeFileSync(goldenPath, JSON.stringify(golden, null, 2), 'utf-8')
    passed++
    console.log(`✅ ${tc.name} (golden created: ${golden.finalHash})`)
  }

  // 功能验证
  const checks = [
    { label: '气节点数量', pass: snap0.qiNodes.length >= 10 },
    { label: '无负气值', pass: !result.finalQi.some((n: any) => n.strength < 0) },
    { label: 'Validation errors=0', pass: result.validationIssues.filter(i => i.level === 'error').length === 0 },
    { label: '多步快照', pass: result.snapshots.length >= 3 },  // Step0 + SeasonModifier + P1
    { label: '气值守恒', pass: (() => {
      const activeSum = result.finalQi.filter((n: any) => n.active).reduce((s: number, n: any) => s + n.strength, 0)
      return Math.abs(activeSum - finalSnap.totalStrength) < 0.1
    })() },
    { label: 'rootId完整', pass: result.finalQi.every((n: any) => typeof n.rootId === 'string' && n.rootId.length > 0) },
    { label: '冲突类型匹配', pass: tc.expectConflictTypes.every(t => result.conflictCommands.some(c => c.type === t)) },
    { label: '合化类型匹配', pass: (() => {
      for (const t of tc.expectHeHuaTypes) {
        const found = result.heHuaCommands.some(c => {
          const label = `${c.type}${c.success ? `化${c.huaElement}` : '合绊'}`
          // 支持前缀匹配（如 '六合合绊' 匹配 '地支六合合绊'）
          return label === t || label.endsWith(t)
        })
        if (!found) return false
      }
      return true
    })() },
  ]

  const allPass = checks.every(c => c.pass)
  if (!allPass) {
    failed++
    console.log(`❌ ${tc.name} (functional)`)
    for (const c of checks) { if (!c.pass) console.log(`   - ${c.label} 失败`) }
  }
}

console.log(`\nP1 回归测试完成：通过 ${passed}/${cases.length * 2}，失败 ${failed}/${cases.length * 2}`)
process.exit(failed > 0 ? 1 : 0)
