/**
 * 古籍经典命例回归测试
 *
 * 验证 QiEngine 对经典命例的处理是否符合传统命理结论
 * 不追求 hash 比对（经典命例会随算法演进变化）
 * 重点验证：
 * - 无负气值
 * - 无 validation error
 * - 气值守恒
 * - 旺衰方向是否与结论一致
 */

import { runP1Engine } from '@/lib/bazi/qi/runP1Engine'
import { classicalCases, getCaseStats } from './cases/classicalCases'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const goldenDir = path.join(__dirname, '..', '..', '..', '..', 'golden', 'classical')

let passed = 0
let failed = 0
const results: any[] = []

console.log('=== 古籍经典命例回归测试 ===\n')
console.log(`当前命例统计: ${JSON.stringify(getCaseStats())}\n`)

for (const tc of classicalCases) {
  try {
    const result = runP1Engine(tc.sixLines, tc.dayGan as any, tc.monthZhi as any)

    // 核心验证
    const hasNeg = result.finalQi.some((n: any) => n.strength < 0)
    const errors = result.validationIssues.filter(i => i.level === 'error')
    const activeSum = result.finalQi.filter((n: any) => n.active).reduce((s: number, n: any) => s + n.strength, 0)
    const qiConservation = Math.abs(activeSum - result.finalSnapshot.totalStrength) < 0.1

    const checks = [
      { label: '无负气值', pass: !hasNeg },
      { label: '无Validation错误', pass: errors.length === 0 },
      { label: '气值守恒', pass: qiConservation },
      { label: '多步快照', pass: result.snapshots.length >= 3 },
      { label: 'rootId完整', pass: result.finalQi.every((n: any) => typeof n.rootId === 'string' && n.rootId.length > 0) },
    ]

    const allPass = checks.every(c => c.pass)

    if (allPass) {
      passed++
      console.log(`✅ [${tc.book}] ${tc.name}`)
    } else {
      failed++
      console.log(`❌ [${tc.book}] ${tc.name}`)
      for (const c of checks) { if (!c.pass) console.log(`   - ${c.label} 失败`) }
    }

    // 旺衰方向一致性检查（宽松匹配）
    const expectedWangShuai = tc.wangShuai
    if (expectedWangShuai) {
      const actualWangShuai = result.wangShuai
      const isMatch =
        (expectedWangShuai.includes('旺') && ['旺', '相'].includes(actualWangShuai)) ||
        (expectedWangShuai.includes('弱') && ['休', '囚', '死'].includes(actualWangShuai)) ||
        (expectedWangShuai.includes('中和') && actualWangShuai === '休') ||
        expectedWangShuai === actualWangShuai

      if (!isMatch) {
        console.log(`   ⚠️ 旺衰方向不一致: 期望${expectedWangShuai} 实际${actualWangShuai}`)
      }
    }

    // 记录结果
    results.push({
      name: tc.name,
      book: tc.book,
      dayElement: result.dayElement,
      wangShuai: result.wangShuai,
      strengthScore: result.strengthScore,
      finalHash: result.finalSnapshot.hash,
      elementScores: result.finalSnapshot.elementScores,
      conflictCount: result.conflictCommands.length,
      heHuaCount: result.heHuaCommands.length,
      seasonStatus: (result as any).seasonCommands?.[0]?.type,
      validationErrors: errors.map(e => e.message),
      hasNeg,
    })

  } catch (err: any) {
    failed++
    console.log(`❌ [${tc.book}] ${tc.name}: 异常 ${err.message}`)
  }
}

// 保存结果摘要
fs.mkdirSync(goldenDir, { recursive: true })
fs.writeFileSync(
  path.join(goldenDir, '_summary.json'),
  JSON.stringify({ stats: getCaseStats(), results, passed, failed, total: classicalCases.length }, null, 2),
  'utf-8',
)

console.log(`\n古籍命例测试完成：通过 ${passed}/${classicalCases.length}，失败 ${failed}/${classicalCases.length}`)
process.exit(failed > 0 ? 1 : 0)
