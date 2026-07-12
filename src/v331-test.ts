/**
 * V3.3.1 真实验收测试
 * 覆盖：三合/三会/六合/合绊/合化/旺衰/格局/喜用神 联动变化
 */

import { calculateBaZiFromBirthData } from './lib/bazi/calculator'
import { calculateStrength } from './lib/bazi/wuxing'
import { determineGeJu } from './lib/bazi/geju'
import { determineXiYongShen } from './lib/bazi/xiyongshen'
import type { BirthData, GanZhi } from './lib/core'
import type { FiveElement } from './lib/bazi/types'

function printDivider(title: string) {
  console.log(`\n========== ${title} ==========`)
}

function printScores(label: string, scores: Record<FiveElement, number>) {
  console.log(`  ${label}`)
  for (const el of ['金', '木', '水', '火', '土'] as FiveElement[]) {
    console.log(`    ${el}：${scores[el].toFixed(1)}`)
  }
}

function runCase(
  name: string,
  birthData: BirthData,
  expectedHeHuaTypes: Array<'天干五合' | '地支六合' | '地支三合' | '地支三会'>,
) {
  printDivider(name)

  const chart = calculateBaZiFromBirthData(birthData)
  const zhis = [chart.sixLines.year.zhi, chart.sixLines.month.zhi, chart.sixLines.day.zhi, chart.sixLines.hour.zhi]
  const gans = [chart.sixLines.year.gan, chart.sixLines.month.gan, chart.sixLines.day.gan, chart.sixLines.hour.gan]

  console.log(`【四柱】${gans[0]}${zhis[0]}  ${gans[1]}${zhis[1]}  ${gans[2]}${zhis[2]}  ${gans[3]}${zhis[3]}`)
  console.log(`【日主】${chart.dayMaster.dayGan}（${chart.dayMaster.dayGanElement}）`)

  // 直接调用底层引擎获取合化前后对比
  const strengthResult = calculateStrength(
    chart.sixLines as any,
    chart.dayMaster.dayGan,
    chart.sixLines.month.zhi,
  )

  // 原始分数（合化前）
  const original: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const s of strengthResult.originalScores) {
    original[s.element] = s.total
  }

  // 合化后分数
  const after: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const s of strengthResult.scores) {
    after[s.element] = s.total
  }

  printScores('五行力量（合化前）', original)
  printScores('五行力量（合化后）', after)

  // 合化明细
  console.log('\n【合化结果】')
  if (strengthResult.heHuaResults.length === 0) {
    console.log('  无合化')
  } else {
    for (const hh of strengthResult.heHuaResults) {
      console.log(`  ${hh.type}：${hh.sources.join('+')} → ${hh.huaElement}`)
      console.log(`    成化：${hh.success ? '成功' : '失败'} ${hh.isHeBan ? '(合绊)' : ''}`)
      console.log(`    原因：${hh.reason}`)
      if (hh.deductions.length > 0) {
        console.log('    抽气明细：')
        for (const d of hh.deductions) {
          console.log(`      ${d.source} ${d.element} -${d.amount}分 (${d.detail})`)
        }
      }
      if (hh.additions.length > 0) {
        console.log('    增力明细：')
        for (const a of hh.additions) {
          console.log(`      ${a.element} +${a.amount}分 (${a.detail})`)
        }
      }
    }
  }

  // 旺衰
  console.log('\n【旺衰】')
  console.log(`  strengthScore：${strengthResult.strengthScore}`)
  console.log(`  wangShuai：${strengthResult.wangShuai}`)

  // 格局（重新计算以展示联动）
  const geJuResult = determineGeJu(
    chart.sixLines as any,
    chart.dayMaster.relatedShens,
    strengthResult.strengthScore,
    chart.dayMaster.dayGan,
    chart.sixLines.month.zhi,
    after,
  )
  console.log(`\n【格局】${geJuResult.name}（${geJuResult.category}）`)

  // 喜用神（使用合化后的数据重新计算）
  const xiYongResult = determineXiYongShen(
    strengthResult.strengthScore,
    strengthResult.wangShuai,
    geJuResult.name,
    chart.dayMaster.dayGanElement,
    strengthResult.heHuaResults,
  )
  console.log(`\n【喜用神】`)
  console.log(`  bestElement：${xiYongResult.bestElement}`)
  console.log(`  avoided：${xiYongResult.avoidedElements.join('、')}`)

  // 验证期望
  const actualTypes = strengthResult.heHuaResults.map(h => h.type)
  const allExpected = expectedHeHuaTypes.every(t => actualTypes.includes(t))
  console.log(`\n【验收】${allExpected ? '✅ 通过' : '❌ 未通过'}（期望合化：${expectedHeHuaTypes.join('、')}）`)
}

// ========== 命例1：申子辰三合水局成化 ==========
runCase(
  '命例1：申子辰三合水局成化',
  {
    birthday: '1980-12-15',
    birthTime: '08:00',
    gender: 'male',
    location: '北京',
    timezone: 'Asia/Shanghai',
    longitude: 116.4,
    latitude: 39.9,
    useTrueSolarTime: false,
    childHourStrategy: 'late',
  },
  ['地支三合'],
)

// ========== 命例2：寅卯辰三会木方 + 寅亥六合成化 ==========
// 手动构造一个命中三会+六合的 sixLines，通过底层 API 直接验证
printDivider('命例2：寅卯辰三会木方 + 寅亥六合成化（硬编码验证）')

const case2SixLines = {
  year: { gan: '甲', zhi: '寅', element: '木', yinYang: '阳', naYin: '大溪水' } as GanZhi,
  month: { gan: '乙', zhi: '卯', element: '木', yinYang: '阴', naYin: '大溪水' } as GanZhi,
  day: { gan: '丙', zhi: '辰', element: '火', yinYang: '阳', naYin: '沙中土' } as GanZhi,
  hour: { gan: '丁', zhi: '亥', element: '火', yinYang: '阴', naYin: '屋上土' } as GanZhi,
}
const case2DayGan = '丙'
const case2MonthZhi = '卯'

const case2Strength = calculateStrength(case2SixLines as any, case2DayGan, case2MonthZhi)
const case2Original: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
for (const s of case2Strength.originalScores) case2Original[s.element] = s.total
const case2After: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
for (const s of case2Strength.scores) case2After[s.element] = s.total

console.log(`【四柱】甲寅  乙卯  丙辰  丁亥`)
console.log(`【日主】丙（火）`)
printScores('五行力量（合化前）', case2Original)
printScores('五行力量（合化后）', case2After)

console.log('\n【合化结果】')
for (const hh of case2Strength.heHuaResults) {
  console.log(`  ${hh.type}：${hh.sources.join('+')} → ${hh.huaElement}`)
  console.log(`    成化：${hh.success ? '成功' : '失败'} ${hh.isHeBan ? '(合绊)' : ''}`)
  if (hh.deductions.length > 0) {
    console.log('    抽气明细：')
    for (const d of hh.deductions) {
      console.log(`      ${d.source} ${d.element} -${d.amount}分`)
    }
  }
  if (hh.additions.length > 0) {
    console.log('    增力明细：')
    for (const a of hh.additions) {
      console.log(`      ${a.element} +${a.amount}分`)
    }
  }
}

const case2GeJu = determineGeJu(case2SixLines as any, {} as any, case2Strength.strengthScore, case2DayGan, case2MonthZhi, case2After)
const case2XiYong = determineXiYongShen(case2Strength.strengthScore, case2Strength.wangShuai, case2GeJu.name, '火' as FiveElement, case2Strength.heHuaResults)
console.log(`\n【旺衰】strengthScore=${case2Strength.strengthScore} wangShuai=${case2Strength.wangShuai}`)
console.log(`【格局】${case2GeJu.name}`)
console.log(`【喜用神】bestElement=${case2XiYong.bestElement} avoided=${case2XiYong.avoidedElements.join('、')}`)
console.log(`\n【验收】${case2Strength.heHuaResults.some(h => h.type === '地支三会' && h.success) && case2Strength.heHuaResults.some(h => h.type === '地支六合' && h.success) ? '✅ 通过' : '❌ 未通过'}（期望：三会成化 + 六合成化）`)

// ========== 命例3：子丑六合合绊（月令不支持 + 化神不透）==========
printDivider('命例3：子丑六合合绊（硬编码验证）')

const case3SixLines = {
  year: { gan: '甲', zhi: '子', element: '木', yinYang: '阳', naYin: '海中金' } as GanZhi,
  month: { gan: '丙', zhi: '寅', element: '火', yinYang: '阳', naYin: '炉中火' } as GanZhi,
  day: { gan: '戊', zhi: '子', element: '土', yinYang: '阳', naYin: '霹雳火' } as GanZhi,
  hour: { gan: '己', zhi: '丑', element: '土', yinYang: '阴', naYin: '霹雳火' } as GanZhi,
}
const case3DayGan = '戊'
const case3MonthZhi = '寅'

const case3Strength = calculateStrength(case3SixLines as any, case3DayGan, case3MonthZhi)
const case3Original: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
for (const s of case3Strength.originalScores) case3Original[s.element] = s.total
const case3After: Record<FiveElement, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
for (const s of case3Strength.scores) case3After[s.element] = s.total

console.log(`【四柱】甲子  丙寅  戊子  己丑`)
console.log(`【日主】戊（土）`)
printScores('五行力量（合化前）', case3Original)
printScores('五行力量（合化后）', case3After)

console.log('\n【合化结果】')
for (const hh of case3Strength.heHuaResults) {
  console.log(`  ${hh.type}：${hh.sources.join('+')} → ${hh.huaElement}`)
  console.log(`    成化：${hh.success ? '成功' : '失败'} ${hh.isHeBan ? '(合绊)' : ''}`)
  console.log(`    原因：${hh.reason}`)
  if (hh.deductions.length > 0) {
    console.log('    抽气明细：')
    for (const d of hh.deductions) {
      console.log(`      ${d.source} ${d.element} -${d.amount}分`)
    }
  }
}

const case3GeJu = determineGeJu(case3SixLines as any, {} as any, case3Strength.strengthScore, case3DayGan, case3MonthZhi, case3After)
const case3XiYong = determineXiYongShen(case3Strength.strengthScore, case3Strength.wangShuai, case3GeJu.name, '土' as FiveElement, case3Strength.heHuaResults)
console.log(`\n【旺衰】strengthScore=${case3Strength.strengthScore} wangShuai=${case3Strength.wangShuai}`)
console.log(`【格局】${case3GeJu.name}`)
console.log(`【喜用神】bestElement=${case3XiYong.bestElement} avoided=${case3XiYong.avoidedElements.join('、')}`)

const case3HeBan = case3Strength.heHuaResults.find(h => h.type === '地支六合' && h.isHeBan)
console.log(`\n【验收】${case3HeBan ? '✅ 通过' : '❌ 未通过'}（期望：子丑六合合绊，月令寅不支持土，化神土不透干）`)

printDivider('V3.3.1 五行引擎重构版验收完成')
