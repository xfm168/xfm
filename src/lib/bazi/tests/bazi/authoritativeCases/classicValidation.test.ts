import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { runClassicValidation } from '../../authoritativeCases/classicValidator'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 测试文件位于 src/lib/bazi/tests/bazi/authoritativeCases/
// 向上 6 级到达项目根目录 /workspace，与 B1 (authoritative.test.ts) 保持一致
const REPORT_PATH = path.resolve(__dirname, '../../../../../../.acceptance/classicValidation.report.json')

describe('C2 RuleEngine 自动校验流程（古籍标准 vs 程序输出）', () => {
  it('生成古籍标准自动校验报告', () => {
    const report = runClassicValidation()
    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true })
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2))

    // 阈值：300 案例、总体准确率 ≥ 0.85
    expect(report.totalCases).toBeGreaterThanOrEqual(300)
    expect(report.overallAccuracy).toBeGreaterThanOrEqual(0.85)

    // 四柱项通过率 ≥ 0.97
    const pillar = report.perItemBreakdown['1.年柱']
    if (pillar) {
      expect(pillar.accuracy).toBeGreaterThanOrEqual(0.97)
    }

    console.log(`📚 C2 古籍标准校验报告已写入: ${REPORT_PATH}`)
    console.log(
      `   总案例=${report.totalCases}  总体准确率=${(report.overallAccuracy * 100).toFixed(1)}%  PASS=${report.passedCases}  FAIL=${report.failedCases}`
    )
  })

  it('每个 FAIL 案例必须有 difference 和 differenceReason', () => {
    const report = runClassicValidation()
    for (const failCase of report.failures) {
      const failItems = failCase.items.filter(i => i.status === 'FAIL')
      for (const item of failItems) {
        expect(item.difference, `${failCase.caseId} ${item.name} difference`).toBeTruthy()
        expect(item.differenceReason, `${failCase.caseId} ${item.name} reason`).toBeTruthy()
      }
    }
  })

  it('10 项校验逻辑结构完整（PASS/FAIL/SKIP × Difference/DifferenceReason/Accuracy）', () => {
    const report = runClassicValidation()
    expect(report.sampleTop10.length).toBeGreaterThan(0)

    // 检查每个案例的 items 至少包含 10 项校验类别
    // （四柱一致拆为 4 个子项 + 节气/真太阳时/起运/大运顺逆/格局/喜用神/调候/神煞/旺衰 9 项 = 13 项）
    const sample = report.sampleTop10[0]
    expect(sample.items.length).toBeGreaterThanOrEqual(10)

    // 每项必须有 name / status / accuracy
    for (const item of sample.items) {
      expect(item.name).toBeTruthy()
      expect(['PASS', 'FAIL', 'SKIP']).toContain(item.status)
      expect(typeof item.accuracy).toBe('number')
      expect(item.accuracy).toBeGreaterThanOrEqual(0)
      expect(item.accuracy).toBeLessThanOrEqual(1)
    }

    // 校验 10 项类别全部存在（按类别号 1~10）
    const categoryNums = new Set(sample.items.map(i => i.name.split('.')[0]))
    for (let i = 1; i <= 10; i++) {
      expect(categoryNums.has(String(i)), `类别 ${i} 应存在`).toBe(true)
    }

    // 校验 FAIL 项必有 difference / differenceReason
    for (const item of sample.items) {
      if (item.status === 'FAIL') {
        expect(item.difference).toBeTruthy()
        expect(item.differenceReason).toBeTruthy()
      }
    }

    // 校验 SKIP 项 accuracy=1（不拖低总分）
    for (const item of sample.items) {
      if (item.status === 'SKIP') {
        expect(item.accuracy).toBe(1)
      }
    }
  })

  it('perItemBreakdown 覆盖所有 10 项校验类别', () => {
    const report = runClassicValidation()
    const keys = Object.keys(report.perItemBreakdown)
    // 至少包含四柱的 4 个子项 + 9 个其他类别
    expect(keys.length).toBeGreaterThanOrEqual(10)

    // 类别号 1~10 全部覆盖
    const categoryNums = new Set(keys.map(k => k.split('.')[0]))
    for (let i = 1; i <= 10; i++) {
      expect(categoryNums.has(String(i)), `perItemBreakdown 应含类别 ${i}`).toBe(true)
    }

    // 年柱准确率应高（程序排盘已与 expect 对齐）
    const pillar = report.perItemBreakdown['1.年柱']
    expect(pillar).toBeDefined()
    expect(pillar.checked).toBeGreaterThan(0)
  })
})
