/**
 * P2-2 调候系统测试
 */
import { calculateClimateAdjustment } from './climateAdjustmentEngine'

interface ClimateTestCase {
  name: string
  fourPillars: [string, string, string, string]
  dayGan: string
  monthZhi: string
  expectNeedsAdjustment: boolean
  expectClimateType: string
}

const CASES: ClimateTestCase[] = [
  {
    name: '冬木寒冻需丙火',
    fourPillars: ['甲子', '癸子', '甲子', '丙寅'],
    dayGan: '甲', monthZhi: '子',
    expectNeedsAdjustment: false, // 已有丙火
    expectClimateType: '寒',
  },
  {
    name: '冬木无火需调候',
    fourPillars: ['庚子', '癸子', '甲子', '乙丑'],
    dayGan: '甲', monthZhi: '子',
    expectNeedsAdjustment: true,
    expectClimateType: '寒',
  },
  {
    name: '夏火有壬水但缺戊土',
    fourPillars: ['甲寅', '庚午', '丙子', '壬子'],
    dayGan: '丙', monthZhi: '午',
    expectNeedsAdjustment: true, // 有壬水但缺戊土
    expectClimateType: '燥',
  },
  {
    name: '夏火地支有水有土（子丑藏癸己）',
    fourPillars: ['甲寅', '庚午', '丙子', '乙丑'],
    dayGan: '丙', monthZhi: '午',
    expectNeedsAdjustment: false, // 地支藏干有水(癸)+土(己)
    expectClimateType: '燥',
  },
  {
    name: '春木适中',
    fourPillars: ['甲寅', '丁卯', '甲子', '丙寅'],
    dayGan: '甲', monthZhi: '卯',
    expectNeedsAdjustment: false,
    expectClimateType: '暖',
  },
]

function parsePillars(fourPillars: string[]) {
  const parsed = fourPillars.map(p => ({
    gan: p[0] as any, zhi: p[1] as any, element: '' as any, yinYang: '' as any, naYin: '',
  }))
  return { year: parsed[0], month: parsed[1], day: parsed[2], hour: parsed[3] }
}

console.log('=== P2-2 调候系统测试 ===\n')

let passed = 0
let failed = 0

for (const tc of CASES) {
  try {
    const sixLines = parsePillars(tc.fourPillars)
    const result = calculateClimateAdjustment(sixLines, tc.dayGan as any, tc.monthZhi as any)

    const adjOk = result.needsAdjustment === tc.expectNeedsAdjustment
    const typeOk = result.climateType === tc.expectClimateType || result.climateType === '中和'
    const pass = adjOk && typeOk
    const status = pass ? '✅' : '⚠️'

    console.log(`${status} ${tc.name}`)
    console.log(`  四柱：${tc.fourPillars.join(' ')}  日主${tc.dayGan}  月令${tc.monthZhi}`)
    console.log(`  气候类型：${result.climateType}  评分：${result.climateScore}  需调候：${result.needsAdjustment ? '是' : '否'}`)
    if (result.needs.length > 0) {
      console.log(`  调候用神：${result.needs.map(n => `${n.element}(${n.preferredStems.join('/')})`).join('、')}`)
    }
    console.log(`  建议：${result.advice}`)
    if (!adjOk) console.log(`  ⚠️ 需调候不匹配：期望${tc.expectNeedsAdjustment} 实际${result.needsAdjustment}`)
    if (pass) passed++
    else failed++
    console.log('')
  } catch (e: any) {
    console.log(`❌ ${tc.name}`)
    console.log(`  错误：${e.message}\n`)
    failed++
  }
}

console.log(`P2-2 调候系统测试完成：通过 ${passed}/${CASES.length}，失败 ${failed}/${CASES.length}`)
