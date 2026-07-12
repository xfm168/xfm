/**
 * P2-3 PatternValidator + PatternScore 测试
 */
import { runP21Engine } from '../runP21Engine'
import { calculateDayMasterStrength } from './dayMasterStrengthEngine'
import { calculateClimateAdjustment } from './climateAdjustmentEngine'
import { analyzeDiseaseMedicine } from './diseaseMedicineEngine'
import { validatePattern } from './patternValidator'

const ELEMENT_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}
const CANG_GAN: Record<string, { ben: string; zhong: string | null; yao: string | null }> = {
  '子': { ben: '癸', zhong: null, yao: null }, '丑': { ben: '己', zhong: '辛', yao: '癸' },
  '寅': { ben: '甲', zhong: '丙', yao: '戊' }, '卯': { ben: '乙', zhong: null, yao: null },
  '辰': { ben: '戊', zhong: '乙', yao: '癸' }, '巳': { ben: '丙', zhong: '庚', yao: '戊' },
  '午': { ben: '丁', zhong: '己', yao: null }, '未': { ben: '己', zhong: '丁', yao: '乙' },
  '申': { ben: '庚', zhong: '壬', yao: '戊' }, '酉': { ben: '辛', zhong: null, yao: null },
  '戌': { ben: '戊', zhong: '辛', yao: '丁' }, '亥': { ben: '壬', zhong: '甲', yao: null },
}

function parsePillars(fourPillars: string[]) {
  const parsed = fourPillars.map(p => ({ gan: p[0] as any, zhi: p[1] as any, element: '' as any, yinYang: '' as any, naYin: '' }))
  return { year: parsed[0], month: parsed[1], day: parsed[2], hour: parsed[3] }
}

const CASES = [
  { name: '乾隆帝', fourPillars: ['辛卯', '庚寅', '丁酉', '壬寅'], dayGan: '丁', monthZhi: '寅' },
  { name: '任铁樵', fourPillars: ['癸巳', '甲寅', '戊戌', '丁巳'], dayGan: '戊', monthZhi: '寅' },
  { name: '甲木当令', fourPillars: ['甲寅', '甲寅', '甲子', '丙寅'], dayGan: '甲', monthZhi: '寅' },
  { name: '甲木极弱', fourPillars: ['辛酉', '庚酉', '甲午', '壬子'], dayGan: '甲', monthZhi: '酉' },
  { name: '七杀格', fourPillars: ['壬辰', '辛酉', '乙未', '丁亥'], dayGan: '乙', monthZhi: '酉' },
  { name: '食神格', fourPillars: ['壬子', '甲寅', '壬辰', '丙午'], dayGan: '壬', monthZhi: '寅' },
]

console.log('=== P2-3 PatternValidator 测试 ===\n')

let passed = 0
for (const tc of CASES) {
  try {
    const sixLines = parsePillars(tc.fourPillars)
    const p21 = runP21Engine(sixLines, tc.dayGan as any, tc.monthZhi as any)
    const strength = calculateDayMasterStrength(sixLines, tc.dayGan as any, tc.monthZhi as any)
    const climate = calculateClimateAdjustment(sixLines, tc.dayGan as any, tc.monthZhi as any)
    const elemCount: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
    for (const p of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
      elemCount[ELEMENT_MAP[p.gan] || '木']++
      const cg = CANG_GAN[p.zhi]
      if (cg) { elemCount[ELEMENT_MAP[cg.ben] || '木']++; if (cg.zhong) elemCount[ELEMENT_MAP[cg.zhong] || '木'] += 0.5; if (cg.yao) elemCount[ELEMENT_MAP[cg.yao] || '木'] += 0.3 }
    }
    const disease = analyzeDiseaseMedicine(sixLines, tc.dayGan as any, tc.monthZhi as any, strength.strengthScore, strength.strengthLevelCN)
    const validation = validatePattern(p21.geJuResult!, strength, climate, disease)

    const stars = '★'.repeat(validation.starLevel)
    console.log(`✅ ${tc.name}：${p21.geJuResult!.name}`)
    console.log(`   评级：${stars} ${validation.rank}（${validation.totalScore}分）`)
    if (validation.isPoGe) console.log(`   破格：${validation.poGeReasons.join('、')}`)
    if (validation.defects.length > 0) console.log(`   缺陷：${validation.defects.slice(0, 3).join('、')}`)
    if (validation.strengths.length > 0) console.log(`   优势：${validation.strengths.slice(0, 3).join('、')}`)
    console.log(`   ${validation.description}`)
    console.log('')
    passed++
  } catch (e: any) {
    console.log(`❌ ${tc.name}: ${e.message}\n`)
  }
}
console.log(`PatternValidator 测试完成：${passed}/${CASES.length}`)
