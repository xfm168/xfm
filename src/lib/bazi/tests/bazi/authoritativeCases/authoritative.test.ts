import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { runValidator } from '../../authoritativeCases/validator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPORT_PATH = path.resolve(__dirname, '../../../../../../.acceptance/authoritative.report.json')

describe('B1 权威命例验证库 300+ 10项校验', () => {
  it('生成权威案例验证报告', () => {
    const report = runValidator()
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

    expect(report.totalCases).toBeGreaterThanOrEqual(300)
    const pillarItem = report.perItemBreakdown['1.年柱一致']
    expect(pillarItem).toBeDefined()
    expect(report.perItemBreakdown['1.年柱一致'].passed).toBeGreaterThanOrEqual(
      report.perItemBreakdown['1.年柱一致'].checked * 0.97
    )

    console.log(`📚 B1 报告已写入: ${REPORT_PATH}`)
    console.log(`   总案例=${report.totalCases}  整体通过率=${report.overallPassRate}%  失败=${report.failedCases}`)
  })
})
