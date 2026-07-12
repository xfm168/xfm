/**
 * P2-2 旺衰系统测试
 * 
 * 验证 DayMasterStrengthEngine 的权重模型准确性。
 * 
 * 测试用例设计：
 * - 极强（得令+得地+得势）：甲日生寅月，多木
 * - 偏强（得令+得地，不得势）：庚日生酉月
 * - 中和（得令不得地不得势）：丙日生巳月，火被水克
 * - 偏弱（失令+不得地+略得势）：甲日生申月
 * - 极弱（失令+失地+失势+无根）：甲日生酉月，金旺无木根
 */

import { calculateDayMasterStrength, type DayMasterStrengthResult } from './dayMasterStrengthEngine'

interface StrengthTestCase {
  name: string
  fourPillars: [string, string, string, string]
  dayGan: string
  monthZhi: string
  expectedLevel: string  // VeryWeak/Weak/Balanced/Strong/VeryStrong
  expectedDeLing: boolean
  expectedDeDi: boolean
  source: string
}

const CASES: StrengthTestCase[] = [
  // ===== 极强 =====
  {
    name: '甲木当令极旺（寅月多木根）',
    fourPillars: ['甲寅', '甲寅', '甲子', '丙寅'],
    dayGan: '甲',
    monthZhi: '寅',
    expectedLevel: 'VeryStrong',
    expectedDeLing: true,
    expectedDeDi: true,
    source: '子平真诠',
  },
  // ===== 偏强 =====
  {
    name: '庚金当令极强（酉月通根比肩）',
    fourPillars: ['庚子', '辛酉', '庚申', '丙寅'],
    dayGan: '庚',
    monthZhi: '酉',
    expectedLevel: 'VeryStrong',
    expectedDeLing: true,
    expectedDeDi: true,
    source: '穷通宝鉴',
  },
  // ===== 中和 =====
  {
    name: '丙火得令得地中和（巳月有根但克泄重）',
    fourPillars: ['甲寅', '庚巳', '丙子', '壬子'],
    dayGan: '丙',
    monthZhi: '巳',
    expectedLevel: 'Balanced',
    expectedDeLing: true,
    expectedDeDi: true,
    source: '滴天髓',
  },
  // ===== 偏弱 =====
  {
    name: '甲木失令偏弱（申月金旺但时支有根）',
    fourPillars: ['庚申', '壬申', '甲子', '丙寅'],
    dayGan: '甲',
    monthZhi: '申',
    expectedLevel: 'Weak',
    expectedDeLing: false,
    expectedDeDi: true,
    source: '子平真诠',
  },
  // ===== 极弱 =====
  {
    name: '甲木极弱无根（酉月金旺）',
    fourPillars: ['辛酉', '庚酉', '甲午', '壬子'],
    dayGan: '甲',
    monthZhi: '酉',
    expectedLevel: 'VeryWeak',
    expectedDeLing: false,
    expectedDeDi: false,
    source: '滴天髓',
  },
  // ===== 历史名人 =====
  {
    name: '乾隆帝（辛卯庚寅丁酉壬寅）',
    fourPillars: ['辛卯', '庚寅', '丁酉', '壬寅'],
    dayGan: '丁',
    monthZhi: '寅',
    expectedLevel: 'Weak',
    expectedDeLing: true,
    expectedDeDi: true,
    source: '滴天髓',
  },
  {
    name: '任铁樵（癸巳甲寅戊戌丁巳）',
    fourPillars: ['癸巳', '甲寅', '戊戌', '丁巳'],
    dayGan: '戊',
    monthZhi: '寅',
    expectedLevel: 'Weak',
    expectedDeLing: false,
    expectedDeDi: true,
    source: '滴天髓',
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
  return { year: parsed[0], month: parsed[1], day: parsed[2], hour: parsed[3] }
}

function formatResult(result: DayMasterStrengthResult): string[] {
  const lines: string[] = []
  lines.push(`  旺衰：${result.strengthScore}/100 → ${result.strengthLevelCN}（${result.strengthLevel}）`)
  lines.push(`  旺相休囚死：${result.wangShuai}`)
  lines.push(`  得令：${result.deLing ? '是' : '否'} | 得地：${result.deDi ? '是' : '否'} | 得势：${result.deShi ? '是' : '否'} | 通根：${result.tongGen ? '是' : '否'} | 透干：${result.touGan ? '是' : '否'}`)

  // 各维度分值
  lines.push(`  ── 维度分析 ──`)
  for (const dim of result.dimensions) {
    lines.push(`  ${dim.name}：${dim.rawScore} × ${(dim.weight * 100).toFixed(0)}% = ${dim.weightedScore.toFixed(1)}`)
  }

  // 十二长生
  lines.push(`  ── 十二长生 ──`)
  for (const cs of result.changShengDetails) {
    const mark = cs.isBeneficial ? '✓' : '✗'
    lines.push(`  ${cs.pillar} ${cs.zhi} → ${cs.state} ${mark}`)
  }

  lines.push(`  生扶力量：${result.shengFuPower} | 克泄耗力量：${result.keXiePower}`)
  return lines
}

// ─── 主函数 ───

console.log('=== P2-2 旺衰系统测试 ===\n')
console.log(`权重模型：得令50% + 得地30% + 得势20%\n`)

let passed = 0
let failed = 0

for (const tc of CASES) {
  try {
    const sixLines = parsePillars(tc.fourPillars)
    const result = calculateDayMasterStrength(sixLines, tc.dayGan as any, tc.monthZhi as any)

    // 验证得令
    const deLingOk = result.deLing === tc.expectedDeLing
    // 验证得地
    const deDiOk = result.deDi === tc.expectedDeDi
    // 验证等级（允许相邻等级偏差）
    const LEVELS = ['VeryWeak', 'Weak', 'Balanced', 'Strong', 'VeryStrong']
    const expectedIdx = LEVELS.indexOf(tc.expectedLevel)
    const actualIdx = LEVELS.indexOf(result.strengthLevel)
    const levelOk = Math.abs(expectedIdx - actualIdx) <= 1

    const pass = deLingOk && deDiOk && levelOk
    const status = pass ? '✅' : '⚠️'

    console.log(`${status} [${tc.source}] ${tc.name}`)
    console.log(`  四柱：${tc.fourPillars.join(' ')}  日主${tc.dayGan}  月令${tc.monthZhi}`)
    for (const line of formatResult(result)) {
      console.log(line)
    }

    // 验证标注
    if (!deLingOk) console.log(`  ⚠️ 得令不匹配：期望${tc.expectedDeLing} 实际${result.deLing}`)
    if (!deDiOk) console.log(`  ⚠️ 得地不匹配：期望${tc.expectedDeDi} 实际${result.deDi}`)
    if (!levelOk) console.log(`  ⚠️ 等级偏差：期望${tc.expectedLevel} 实际${result.strengthLevel}（差距${Math.abs(expectedIdx - actualIdx)}级）`)

    if (pass) passed++
    else failed++
    console.log('')
  } catch (e: any) {
    console.log(`❌ [${tc.source}] ${tc.name}`)
    console.log(`  错误：${e.message}\n`)
    failed++
  }
}

console.log(`P2-2 旺衰系统测试完成：通过 ${passed}/${CASES.length}，失败 ${failed}/${CASES.length}`)
