import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { runValidator } from '../../authoritativeCases/validator'
import { AUTHORITATIVE_CASES } from '../../authoritativeCases/loader'

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

describe('C1 权威命例校正工程·古籍标准', () => {
  it('C1: 至少 50 个案例有 classic 字段且 validationStatus 非 pending', () => {
    const verified = AUTHORITATIVE_CASES.filter(c => c.classic?.validationStatus === 'verified')
    expect(verified.length).toBeGreaterThanOrEqual(50)
  })

  it('C1: verified 案例的 classic 字段包含 originalStructure/originalUsefulGod/originalStrength', () => {
    const verified = AUTHORITATIVE_CASES.filter(c => c.classic?.validationStatus === 'verified')
    for (const c of verified.slice(0, 10)) {
      expect(c.classic!.originalStructure).toBeDefined()
      expect(c.classic!.originalStructure!.length).toBeGreaterThan(0)
      expect(c.classic!.originalUsefulGod).toBeDefined()
      expect(c.classic!.originalStrength).toBeTruthy()
    }
  })
})
