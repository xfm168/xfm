/**
 * 玄风门 V7 - 框架级Coverage统计
 *
 * 使用Hook统计所有Rule的真实执行/命中数据
 * 不修改Rule，只收集数据
 */

import * as fs from 'fs'
import * as path from 'path'
import { GEJU_RULES, buildGeJuContext, determineGeJu } from '../src/lib/bazi/rules/gejuRules'
import { initCoverage, executeRulesWithHook, getCoverageReport, getUnmatchedRules, getTopMatched, getTopUnmatched, exportCoverageCSV, exportDeadRulesJSON } from '../src/lib/bazi/rules/coverageHook'

const gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const zhis = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

const GAN_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

const ZHI_ELEMENT: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

function getShen(dayGan: string, otherGan: string): string {
  const dayEl = GAN_ELEMENT[dayGan]
  const otherEl = GAN_ELEMENT[otherGan]
  const dayYang = ['甲','丙','戊','庚','壬'].includes(dayGan)
  const otherYang = ['甲','丙','戊','庚','壬'].includes(otherGan)
  const GEN: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const OVR: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
  if (otherEl === dayEl) return dayYang === otherYang ? '比肩' : '劫财'
  if (otherEl === GEN[dayEl]) return dayYang === otherYang ? '食神' : '伤官'
  if (otherEl === OVR[dayEl]) return dayYang === otherYang ? '偏财' : '正财'
  if (dayEl === OVR[otherEl]) return dayYang === otherYang ? '偏官' : '正官'
  if (dayEl === GEN[otherEl]) return dayYang === otherYang ? '偏印' : '正印'
  return '比肩'
}

function makeRS(dayGan: string): Record<string, string> {
  const r: Record<string, string> = {}
  for (const g of gans) r[g] = getShen(dayGan, g)
  return r
}

// ============================================================
// 1. 初始化Hook统计
// ============================================================
console.log('='.repeat(80))
console.log('玄风门 V7 - 框架级Coverage统计')
console.log('='.repeat(80))
console.log()

initCoverage(GEJU_RULES)
console.log(`[1/4] 初始化统计：${GEJU_RULES.length} 条 Rule 已注册`)
console.log()

// ============================================================
// 2. 收集真实数据
// ============================================================
console.log('[2/4] 运行测试收集数据...')

let testCount = 0
const startTime = Date.now()

// 生成测试用例：全组合覆盖
// 10天干 × 12地支 × 10月干 × 5强度 = 6000个基本组合
for (const dg of gans) {
  for (const mz of zhis) {
    for (const mg of gans) {
      for (const strength of [10, 30, 50, 70, 90]) {
        const rs = makeRS(dg)
        const fe: any = { '木':1,'火':1,'土':1,'金':1,'水':1 }
        fe[ZHI_ELEMENT[mz]] = 2

        const ctx = buildGeJuContext(
          { year:{gan:gans[2],zhi:zhis[0]}, month:{gan:mg,zhi:mz},
            day:{gan:dg,zhi:zhis[3]}, hour:{gan:gans[4],zhi:zhis[5]} },
          rs as any, strength, dg, mz, fe
        )

        // 使用带Hook的executeRules
        executeRulesWithHook(GEJU_RULES, ctx as any)
        testCount++
      }
    }
  }
}

// 额外：随机测试2000个
for (let i = 0; i < 2000; i++) {
  const dg = gans[Math.floor(Math.random() * 10)]
  const mz = zhis[Math.floor(Math.random() * 12)]
  const mg = gans[Math.floor(Math.random() * 10)]
  const strength = Math.floor(Math.random() * 100)
  const rs = makeRS(dg)
  const fe: any = { '木':1,'火':1,'土':1,'金':1,'水':1 }
  fe[ZHI_ELEMENT[mz]] = 2

  const ctx = buildGeJuContext(
    { year:{gan:gans[Math.floor(Math.random()*10)],zhi:zhis[Math.floor(Math.random()*12)]},
      month:{gan:mg,zhi:mz},
      day:{gan:dg,zhi:zhis[Math.floor(Math.random()*12)]},
      hour:{gan:gans[Math.floor(Math.random()*10)],zhi:zhis[Math.floor(Math.random()*12)]} },
    rs as any, strength, dg, mz, fe
  )

  executeRulesWithHook(GEJU_RULES, ctx as any)
  testCount++
}

const duration = Date.now() - startTime

console.log(`测试执行完成：`)
console.log(`  - 测试用例数：${testCount}`)
console.log(`  - 执行时间：${duration}ms`)
console.log(`  - TPS：${Math.round(testCount / (duration / 1000))}`)
console.log()

// ============================================================
// 3. 获取报告
// ============================================================
console.log('[3/4] 生成报告...')

const report = getCoverageReport()
const unmatched = getUnmatchedRules()
const topMatched = getTopMatched(20)
const topUnmatched = getTopUnmatched(20)

console.log()
console.log('='.repeat(80))
console.log('Coverage 统计结果')
console.log('='.repeat(80))
console.log()

console.log(`总Rule数：${report.totalRules}`)
console.log(`已命中：${report.matchedRules}`)
console.log(`未命中：${report.unmatchedRules}`)
console.log(`真实Coverage：**${report.coverage.toFixed(1)}%**`)
console.log()

// ============================================================
// 4. Top20 命中最多
// ============================================================
console.log('-'.repeat(80))
console.log('Top20 命中最多：')
console.log('-'.repeat(80))
console.log('Rank | RuleId           | Name               | P    | Exec    | Match   | Coverage')
console.log('-'.repeat(80))

topMatched.forEach((s, i) => {
  const pct = s.executionCount > 0 ? ((s.matchCount / s.executionCount) * 100).toFixed(1) + '%' : '0%'
  console.log(
    `${String(i+1).padStart(4)} | ${s.ruleId.padEnd(16)} | ${s.name.padEnd(18)} | P${String(s.priority).padEnd(3)} | ${String(s.executionCount).padStart(7)} | ${String(s.matchCount).padStart(7)} | ${pct}`
  )
})

// ============================================================
// 5. Top20 未命中
// ============================================================
if (topUnmatched.length > 0) {
  console.log()
  console.log('-'.repeat(80))
  console.log('Top20 从未命中（按优先级排序）：')
  console.log('-'.repeat(80))
  console.log('Rank | RuleId           | Name               | P    | Exec    | ErrorCount | LastError')
  console.log('-'.repeat(80))

  topUnmatched.forEach((s, i) => {
    const err = s.lastError ? s.lastError.slice(0, 30) : '-'
    console.log(
      `${String(i+1).padStart(4)} | ${s.ruleId.padEnd(16)} | ${s.name.padEnd(18)} | P${String(s.priority).padEnd(3)} | ${String(s.executionCount).padStart(7)} | ${String(s.errorCount).padStart(10)} | ${err}`
    )
  })
}

// ============================================================
// 6. 全部未命中Rule
// ============================================================
console.log()
console.log('-'.repeat(80))
console.log(`所有未命中Rule（共${unmatched.length}条）：`)
console.log('-'.repeat(80))

unmatched.forEach((s, i) => {
  const err = s.errorCount > 0 ? ` ⚠️ ERR:${s.errorCount}` : ''
  console.log(`${String(i+1).padStart(3)}. P${String(s.priority).padEnd(3)} ${s.ruleId.padEnd(20)} ${s.name}${err}`)
})

// ============================================================
// 7. 导出文件
// ============================================================
console.log()
console.log('[4/4] 导出文件...')

const outputDir = '/workspace/coverage-reports'
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 导出CSV
const csvPath = path.join(outputDir, 'coverage.csv')
fs.writeFileSync(csvPath, exportCoverageCSV())
console.log(`✅ coverage.csv → ${csvPath}`)

// 导出Dead Rules JSON
const deadJsonPath = path.join(outputDir, 'dead-rules.json')
fs.writeFileSync(deadJsonPath, exportDeadRulesJSON())
console.log(`✅ dead-rules.json → ${deadJsonPath}`)

// 导出完整报告JSON
const fullReportPath = path.join(outputDir, 'full-report.json')
fs.writeFileSync(fullReportPath, JSON.stringify(report, null, 2))
console.log(`✅ full-report.json → ${fullReportPath}`)

// 导出未命中详情
const unmatchedDetail = unmatched.map(s => ({
  ruleId: s.ruleId,
  name: s.name,
  category: s.category,
  priority: s.priority,
  executionCount: s.executionCount,
  matchCount: s.matchCount,
  errorCount: s.errorCount,
  lastError: s.lastError,
}))
const unmatchedPath = path.join(outputDir, 'unmatched-rules.json')
fs.writeFileSync(unmatchedPath, JSON.stringify(unmatchedDetail, null, 2))
console.log(`✅ unmatched-rules.json → ${unmatchedPath}`)

console.log()
console.log('='.repeat(80))
console.log(`真实 Coverage：**${report.coverage.toFixed(1)}%** (${report.matchedRules}/${report.totalRules})`)
console.log(`Dead Rules：**${unmatched.length}** 条`)
console.log(`错误Rule：**${unmatched.filter(s => s.errorCount > 0).length}** 条`)
console.log('='.repeat(80))
