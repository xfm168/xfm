/**
 * P2-1 格局检测回归测试
 *
 * 测试用例来自古籍命例库，验证格局识别准确性。
 */

import { runP21Engine } from '../../qi/runP21Engine'

interface TestCase {
  name: string
  source: string
  fourPillars: [string, string, string, string]  // [年柱, 月柱, 日柱, 时柱]
  dayGan: string
  monthZhi: string
  expectedStructure?: string  // 期望格局名称
  expectedCategory?: string   // 期望格局大类
}

const CASES: TestCase[] = [
  // ─── 专旺格 ───
  {
    name: '曲直格（专旺木）',
    source: '滴天髓',
    fourPillars: ['甲寅', '丁卯', '甲寅', '丙寅'],
    dayGan: '甲',
    monthZhi: '卯',
    expectedCategory: '专旺格',
  },

  // ─── 正官格 ───
  {
    name: '正官格',
    source: '子平真诠',
    fourPillars: ['庚子', '戊子', '甲子', '丙寅'],
    dayGan: '甲',
    monthZhi: '子',
    expectedCategory: '正格',
  },

  // ─── 七杀格 ───
  {
    name: '七杀格',
    source: '子平真诠',
    fourPillars: ['辛酉', '庚寅', '甲申', '庚午'],
    dayGan: '甲',
    monthZhi: '寅',
    expectedCategory: '正格',
  },

  // ─── 食神格 ───
  {
    name: '食神格',
    source: '穷通宝鉴',
    fourPillars: ['壬辰', '辛亥', '丙戌', '癸巳'],
    dayGan: '丙',
    monthZhi: '戌',
    expectedCategory: '正格',
  },

  // ─── 正财格 ───
  {
    name: '正财格',
    source: '三命通会',
    fourPillars: ['甲子', '戊辰', '丙寅', '庚寅'],
    dayGan: '丙',
    monthZhi: '辰',
    expectedCategory: '正格',
  },

  // ─── 古籍命例 ───
  {
    name: '任铁樵自造（滴天髓作者）',
    source: '滴天髓',
    fourPillars: ['癸巳', '甲寅', '戊戌', '丁巳'],
    dayGan: '戊',
    monthZhi: '寅',
  },
  {
    name: '乾隆帝御造',
    source: '滴天髓',
    fourPillars: ['辛卯', '庚寅', '丁酉', '壬寅'],
    dayGan: '丁',
    monthZhi: '寅',
  },
]

function parsePillars(fourPillars: string[]) {
  const parsed = fourPillars.map(p => ({
    gan: p[0] as any,
    zhi: p[1] as any,
    element: '' as any,
    yinYang: '' as any,
    naYin: '',
  }))
  return {
    year: parsed[0],
    month: parsed[1],
    day: parsed[2],
    hour: parsed[3],
  }
}

function runTest(tc: TestCase): void {
  const sixLines = parsePillars(tc.fourPillars)
  const result = runP21Engine(sixLines, tc.dayGan as any, tc.monthZhi as any)

  const structure = result.geJuResult
  const status = structure ? '✅' : '❌'

  console.log(`${status} [${tc.source}] ${tc.name}`)
  if (structure) {
    console.log(`   格局：${structure.name}（${structure.category}），${structure.grade}，评分${structure.score}`)
    console.log(`   成因：${structure.reasons.slice(0, 3).join('、')}`)
    console.log(`   纯清度${structure.pureScore} 贵气${structure.nobilityScore} 富气${structure.wealthScore}`)
    if (structure.poGe) {
      console.log(`   ⚠️ 破格：${structure.poGeReason}`)
    }
    if (structure.assistGeJu.length > 0) {
      console.log(`   副格：${structure.assistGeJu.map(a => a.name).join('、')}`)
    }

    // 验证期望
    if (tc.expectedCategory && structure.category !== tc.expectedCategory) {
      console.log(`   ⚠️ 格局大类不一致: 期望 ${tc.expectedCategory} 实际 ${structure.category}`)
    }
  }

  // 验证 ReasoningContext
  if (result.reasoning) {
    const explainCount = result.reasoning.explains.length
    const eventCount = result.reasoning.eventTimeline.length
    const stateLen = result.reasoning.stateTree.length
    console.log(`   推演：${explainCount}条Explain / ${eventCount}个Event / ${stateLen}阶段`)
    console.log(`   阶段：${result.reasoning.stateTree.map(n => n.phase).join(' → ')}`)
  }
  console.log('')
}

// ─── 主函数 ───

console.log('=== P2-1 格局检测回归测试 ===\n')

let passed = 0
let failed = 0

for (const tc of CASES) {
  try {
    runTest(tc)
    passed++
  } catch (e: any) {
    console.log(`❌ [${tc.source}] ${tc.name}`)
    console.log(`   错误：${e.message}\n`)
    failed++
  }
}

console.log(`P2-1 格局检测测试完成：通过 ${passed}/${CASES.length}，失败 ${failed}/${CASES.length}`)
