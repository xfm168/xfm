/**
 * P2-2 病药+通关联合测试
 */
import { analyzeDiseaseMedicine } from './diseaseMedicineEngine'
import { analyzeTongGuan } from './tongGuanEngine'
import { calculateDayMasterStrength } from './dayMasterStrengthEngine'

interface TestCase {
  name: string
  fourPillars: [string, string, string, string]
  dayGan: string
  monthZhi: string
}

const CASES: TestCase[] = [
  { name: '甲木极旺多比劫', fourPillars: ['甲寅', '甲寅', '甲子', '丙寅'], dayGan: '甲', monthZhi: '寅' },
  { name: '庚金极旺', fourPillars: ['庚子', '辛酉', '庚申', '丙寅'], dayGan: '庚', monthZhi: '酉' },
  { name: '甲木极弱无根', fourPillars: ['辛酉', '庚酉', '甲午', '壬子'], dayGan: '甲', monthZhi: '酉' },
  { name: '乾隆帝', fourPillars: ['辛卯', '庚寅', '丁酉', '壬寅'], dayGan: '丁', monthZhi: '寅' },
  { name: '金木交战（庚申+甲寅）', fourPillars: ['庚申', '甲寅', '庚子', '乙卯'], dayGan: '庚', monthZhi: '寅' },
]

const ELEMENT_MAP: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
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
  const parsed = fourPillars.map(p => ({
    gan: p[0] as any, zhi: p[1] as any, element: '' as any, yinYang: '' as any, naYin: '',
  }))
  return { year: parsed[0], month: parsed[1], day: parsed[2], hour: parsed[3] }
}

function countElements(sixLines: any): Record<string, number> {
  const count: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const pillar of [sixLines.year, sixLines.month, sixLines.day, sixLines.hour]) {
    count[ELEMENT_MAP[pillar.gan] || '木']++
    const cg = CANG_GAN[pillar.zhi]
    if (cg) {
      count[ELEMENT_MAP[cg.ben] || '木']++
      if (cg.zhong) count[ELEMENT_MAP[cg.zhong] || '木'] += 0.5
      if (cg.yao) count[ELEMENT_MAP[cg.yao] || '木'] += 0.3
    }
  }
  return count
}

console.log('=== P2-2 病药+通关联合测试 ===\n')

let passed = 0
const total = CASES.length

for (const tc of CASES) {
  try {
    const sixLines = parsePillars(tc.fourPillars)
    const elementCount = countElements(sixLines)
    const strength = calculateDayMasterStrength(sixLines, tc.dayGan as any, tc.monthZhi as any)
    const dm = analyzeDiseaseMedicine(sixLines, tc.dayGan as any, tc.monthZhi as any, strength.strengthScore, strength.strengthLevelCN)
    const tg = analyzeTongGuan(elementCount as any)

    console.log(`✅ ${tc.name}`)
    console.log(`  四柱：${tc.fourPillars.join(' ')}  旺衰：${strength.strengthScore}/100 ${strength.strengthLevelCN}`)
    if (dm.hasDisease) {
      console.log(`  病：${dm.diseases.map(d => d.name).join('、')}`)
      console.log(`  药：${dm.medicines.map(m => `${m.element}(${m.name})`).join('、')}`)
      console.log(`  治法：${dm.treatment}`)
    } else {
      console.log(`  病药：无大病`)
    }
    if (tg.hasBattle) {
      console.log(`  交战：${tg.battles.map(b => b.description).join('；')}`)
      console.log(`  通关：${tg.hasTongGuan ? tg.tongGuanDescription : '通关不畅'}`)
      console.log(`  风险等级：${tg.riskLevel}/5`)
    } else {
      console.log(`  通关：五行和合，无交战`)
    }
    console.log('')
    passed++
  } catch (e: any) {
    console.log(`❌ ${tc.name}`)
    console.log(`  错误：${e.message}\n`)
  }
}

console.log(`P2-2 病药+通关测试完成：通过 ${passed}/${total}`)
