/**
 * P2-3 全量集成测试 — 覆盖所有P2-3模块
 *
 * 30组用例 × 13个模块 = 390次调用验证
 *
 * 测试流程（对每个用例）：
 *   1. runP21Engine → 格局
 *   2. calculateDayMasterStrength → 旺衰
 *   3. calculateClimateAdjustment → 调候
 *   4. analyzeDiseaseMedicine → 病药
 *   5. analyzeTongGuan → 通关
 *   6. calculateUseGod → 喜用神
 *   7. validatePattern → 格局校验
 *   8. calculateShenSha → 神煞
 *   9. analyzeRelationships → 关系
 *  10. analyzeCareer → 事业
 *  11. analyzeWealth → 财富
 *  12. analyzeMarriage → 婚姻
 *  13. analyzeHealth → 健康
 */
import { runP21Engine } from '../runP21Engine'
import { calculateDayMasterStrength } from './dayMasterStrengthEngine'
import { calculateClimateAdjustment } from './climateAdjustmentEngine'
import { analyzeDiseaseMedicine } from './diseaseMedicineEngine'
import { analyzeTongGuan } from './tongGuanEngine'
import { calculateUseGod } from './useGodEngine'
import { validatePattern } from './patternValidator'
import { calculateShenSha } from './shenShaEngine'
import { analyzeRelationships } from './relationshipEngine'
import { analyzeCareer } from './careerEngine'
import { analyzeWealth } from './wealthEngine'
import { analyzeMarriage } from './marriageEngine'
import { analyzeHealth } from './healthEngine'

import type { FiveElement } from '../../types'

// ─── 基础数据 ───

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

// ─── 测试用例30组 ───

const CASES = [
  // 富贵命（3组）
  { name: '乾隆帝', pillars: ['辛卯','庚寅','丁酉','壬寅'], desc: '财格' },
  { name: '正官格', pillars: ['甲子','辛酉','丙寅','癸巳'], desc: '正官' },
  { name: '食神生财', pillars: ['壬子','甲寅','壬辰','丙午'], desc: '食神生财' },

  // 从格（2组）
  { name: '从财格', pillars: ['戊辰','癸亥','甲子','戊辰'], desc: '身弱财多' },
  { name: '从杀格', pillars: ['庚申','甲申','乙酉','丙子'], desc: '七杀当令' },

  // 伤官配印（2组）
  { name: '伤官配印1', pillars: ['甲寅','丙寅','丁巳','辛亥'], desc: '伤官配印' },
  { name: '伤官配印2', pillars: ['壬戌','辛亥','丁酉','甲辰'], desc: '伤官佩印' },

  // 食神制杀（2组）
  { name: '食神制杀1', pillars: ['壬辰','辛酉','乙未','丁亥'], desc: '食神制杀' },
  { name: '食神制杀2', pillars: ['甲辰','庚午','丙子','壬辰'], desc: '食神制杀' },

  // 印绶格（2组）
  { name: '正印格', pillars: ['庚子','戊子','辛巳','己丑'], desc: '正印' },
  { name: '偏印格', pillars: ['庚子','戊子','辛亥','己丑'], desc: '偏印' },

  // 财格（2组）
  { name: '正财格', pillars: ['甲寅','丁卯','甲午','戊辰'], desc: '正财' },
  { name: '偏财格', pillars: ['甲寅','丁卯','甲戌','戊辰'], desc: '偏财' },

  // 建禄月刃（2组）
  { name: '建禄格', pillars: ['甲寅','丙寅','甲子','丁巳'], desc: '建禄' },
  { name: '月刃格', pillars: ['甲寅','丙寅','乙卯','丁巳'], desc: '月刃' },

  // 专旺格（1组）
  { name: '曲直格', pillars: ['甲寅','丁卯','甲寅','丙寅'], desc: '曲直' },

  // 身旺无泄（2组）
  { name: '身旺无泄1', pillars: ['甲寅','甲寅','甲子','丙寅'], desc: '身旺' },
  { name: '身旺无泄2', pillars: ['壬子','壬子','壬子','壬子'], desc: '身旺极' },

  // 身弱（2组）
  { name: '身弱1', pillars: ['辛酉','庚酉','甲午','壬子'], desc: '身弱' },
  { name: '身弱2', pillars: ['庚申','甲申','乙酉','丙子'], desc: '身弱极' },

  // 官杀混杂（2组）
  { name: '官杀混杂1', pillars: ['壬子','辛酉','甲午','庚午'], desc: '官杀混杂' },
  { name: '官杀混杂2', pillars: ['癸巳','庚申','甲子','辛未'], desc: '官杀混杂' },

  // 杂格（4组）
  { name: '七杀格', pillars: ['壬辰','辛酉','乙未','丁亥'], desc: '七杀' },
  { name: '伤官格', pillars: ['癸巳','甲寅','戊戌','丁巳'], desc: '伤官' },
  { name: '禄神格', pillars: ['甲寅','丙寅','甲寅','壬申'], desc: '禄神' },
  { name: '羊刃格', pillars: ['甲寅','丁卯','甲卯','庚午'], desc: '羊刃' },

  // 化气格（1组）
  { name: '化气格', pillars: ['甲辰','己巳','丙辰','戊子'], desc: '化气' },

  // 贫命（2组）
  { name: '财多身弱', pillars: ['戊辰','癸亥','甲子','戊辰'], desc: '财多身弱' },
  { name: '杀旺无制', pillars: ['庚申','甲申','乙酉','庚辰'], desc: '杀旺无制' },
]

// ─── 工具函数 ───

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

function isValid(v: any): boolean {
  return v !== null && v !== undefined
}

// ─── 主测试流程 ───

console.log('=== P2-3 全量集成测试 ===')
console.log(`用例数：${CASES.length}，模块数：13\n`)

const startTime = Date.now()
let totalPassed = 0
let totalFailed = 0
const moduleStats: Record<string, { pass: number; fail: number }> = {
  '格局': { pass: 0, fail: 0 },
  '旺衰': { pass: 0, fail: 0 },
  '调候': { pass: 0, fail: 0 },
  '病药': { pass: 0, fail: 0 },
  '通关': { pass: 0, fail: 0 },
  '喜用神': { pass: 0, fail: 0 },
  '格局校验': { pass: 0, fail: 0 },
  '神煞': { pass: 0, fail: 0 },
  '关系': { pass: 0, fail: 0 },
  '事业': { pass: 0, fail: 0 },
  '财富': { pass: 0, fail: 0 },
  '婚姻': { pass: 0, fail: 0 },
  '健康': { pass: 0, fail: 0 },
}

for (const tc of CASES) {
  try {
    const caseStart = Date.now()
    const sixLines = parsePillars(tc.pillars)
    const dayGan = tc.pillars[2][0] as any
    const monthZhi = tc.pillars[1][1] as any
    const elementCount = countElements(sixLines)

    // 1. runP21Engine → 格局
    const p21 = runP21Engine(sixLines, dayGan, monthZhi)
    const geJuOk = isValid(p21) && isValid(p21.geJuResult)
    if (geJuOk) moduleStats['格局'].pass++; else moduleStats['格局'].fail++

    // 2. calculateDayMasterStrength → 旺衰
    const strength = calculateDayMasterStrength(sixLines, dayGan, monthZhi)
    const strengthOk = isValid(strength) && isValid(strength.strengthScore)
    if (strengthOk) moduleStats['旺衰'].pass++; else moduleStats['旺衰'].fail++

    // 3. calculateClimateAdjustment → 调候
    const climate = calculateClimateAdjustment(sixLines, dayGan, monthZhi)
    const climateOk = isValid(climate) && isValid(climate.climateType)
    if (climateOk) moduleStats['调候'].pass++; else moduleStats['调候'].fail++

    // 4. analyzeDiseaseMedicine → 病药
    const disease = analyzeDiseaseMedicine(sixLines, dayGan, monthZhi, strength.strengthScore, strength.strengthLevelCN)
    const diseaseOk = isValid(disease)
    if (diseaseOk) moduleStats['病药'].pass++; else moduleStats['病药'].fail++

    // 5. analyzeTongGuan → 通关
    const tongGuan = analyzeTongGuan(elementCount as any)
    const tongGuanOk = isValid(tongGuan)
    if (tongGuanOk) moduleStats['通关'].pass++; else moduleStats['通关'].fail++

    // 6. calculateUseGod → 喜用神
    const dayElement = (ELEMENT_MAP[tc.pillars[2][0]] || '木') as FiveElement
    const useGod = calculateUseGod(dayElement, strength, climate, disease, tongGuan)
    const useGodOk = isValid(useGod) && isValid(useGod.yongShen)
    if (useGodOk) moduleStats['喜用神'].pass++; else moduleStats['喜用神'].fail++

    // 7. validatePattern → 格局校验
    const validation = validatePattern(p21.geJuResult!, strength, climate, disease)
    const validOk = isValid(validation) && isValid(validation.totalScore)
    if (validOk) moduleStats['格局校验'].pass++; else moduleStats['格局校验'].fail++

    // 8. calculateShenSha → 神煞
    const shenSha = calculateShenSha(
      tc.pillars[0][0], // yearGan
      tc.pillars[0][1], // yearZhi
      tc.pillars[1][1], // monthZhi
      tc.pillars[2][0], // dayGan
      tc.pillars[2][1], // dayZhi
      tc.pillars[3][1], // hourZhi
    )
    const shenShaOk = isValid(shenSha) && isValid(shenSha.shenShaList)
    if (shenShaOk) moduleStats['神煞'].pass++; else moduleStats['神煞'].fail++

    // 9. analyzeRelationships → 关系
    const allGan = tc.pillars.map(p => p[0] as any)
    const allZhi = tc.pillars.map(p => p[1] as any)
    const relationships = analyzeRelationships(
      dayElement, p21.geJuResult!.name,
      strength.strengthLevel, useGod.yongShen,
      elementCount as any, allGan, allZhi,
    )
    const relOk = isValid(relationships) && isValid(relationships.relationships)
    if (relOk) moduleStats['关系'].pass++; else moduleStats['关系'].fail++

    // 10. analyzeCareer → 事业
    const career = analyzeCareer(
      dayElement, strength.strengthLevel,
      useGod.yongShen, p21.geJuResult!.name,
      elementCount as any,
    )
    const careerOk = isValid(career) && isValid(career.suggestions)
    if (careerOk) moduleStats['事业'].pass++; else moduleStats['事业'].fail++

    // 11. analyzeWealth → 财富
    const wealth = analyzeWealth(
      dayElement, strength.strengthLevel,
      useGod.yongShen, p21.geJuResult!.name,
      strength.strengthScore, elementCount as any,
    )
    const wealthOk = isValid(wealth) && isValid(wealth.wealthLevel)
    if (wealthOk) moduleStats['财富'].pass++; else moduleStats['财富'].fail++

    // 12. analyzeMarriage → 婚姻
    const marriage = analyzeMarriage(
      dayElement, dayGan, strength.strengthLevel,
      useGod.yongShen, p21.geJuResult!.name,
      elementCount as any, allZhi,
    )
    const marriageOk = isValid(marriage) && isValid(marriage.marriageQuality)
    if (marriageOk) moduleStats['婚姻'].pass++; else moduleStats['婚姻'].fail++

    // 13. analyzeHealth → 健康
    const health = analyzeHealth(
      dayElement, strength.strengthLevel,
      climate.climateType, elementCount as any, allZhi,
    )
    const healthOk = isValid(health) && isValid(health.organs)
    if (healthOk) moduleStats['健康'].pass++; else moduleStats['健康'].fail++

    const caseEnd = Date.now()
    const caseMs = caseEnd - caseStart
    const allOk = geJuOk && strengthOk && climateOk && diseaseOk && tongGuanOk
      && useGodOk && validOk && shenShaOk && relOk && careerOk
      && wealthOk && marriageOk && healthOk

    if (allOk) {
      totalPassed++
      const stars = '★'.repeat(validation.starLevel)
      console.log(`[PASS] ${tc.name}（${tc.desc}）— ${p21.geJuResult!.name} ${stars} ${validation.totalScore}分 | 旺衰${strength.strengthScore}分 用神${useGod.yongShen} | ${caseMs}ms`)
    } else {
      totalFailed++
      console.log(`[FAIL] ${tc.name}（${tc.desc}）— ${caseMs}ms`)
      if (!geJuOk) console.log(`  ✗ 格局`)
      if (!strengthOk) console.log(`  ✗ 旺衰`)
      if (!climateOk) console.log(`  ✗ 调候`)
      if (!diseaseOk) console.log(`  ✗ 病药`)
      if (!tongGuanOk) console.log(`  ✗ 通关`)
      if (!useGodOk) console.log(`  ✗ 喜用神`)
      if (!validOk) console.log(`  ✗ 格局校验`)
      if (!shenShaOk) console.log(`  ✗ 神煞`)
      if (!relOk) console.log(`  ✗ 关系`)
      if (!careerOk) console.log(`  ✗ 事业`)
      if (!wealthOk) console.log(`  ✗ 财富`)
      if (!marriageOk) console.log(`  ✗ 婚姻`)
      if (!healthOk) console.log(`  ✗ 健康`)
    }
  } catch (e: any) {
    totalFailed++
    console.log(`[ERROR] ${tc.name}（${tc.desc}）: ${e.message}`)
  }
}

const endTime = Date.now()
const totalMs = endTime - startTime

console.log('\n=== 模块统计 ===')
for (const [mod, stat] of Object.entries(moduleStats)) {
  const ok = stat.fail === 0 ? 'PASS' : 'FAIL'
  console.log(`  ${mod}: ${stat.pass}/${stat.pass + stat.fail} ${ok}`)
}

console.log('\n=== 汇总 ===')
console.log(`用例通过：${totalPassed}/${CASES.length}`)
console.log(`总耗时：${totalMs}ms`)
console.log(`平均耗时：${(totalMs / CASES.length).toFixed(1)}ms/盘`)

if (totalFailed === 0) {
  console.log('\n>>> ALL PASS <<<')
} else {
  console.log(`\n>>> FAIL: ${totalFailed} cases <<<`)
}
