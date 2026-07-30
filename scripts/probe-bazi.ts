// Preload shim MUST be imported first so globalThis.require exists before the
// qimenStandaloneProvider module is evaluated.
import './preload-require.mjs'

import { calculateBaZiFromBirthData } from '../src/lib/bazi/calculator'
import { createPreciseCalendar } from '../src/lib/bazi/preciseCalendar'
import { calcDaYunStart, generateDaYun } from '../src/lib/bazi/rules/dashunRules'
import { getSolarTermName } from 'qimendunjia-standalone'
import type { BirthData } from '../src/lib/core/types/birth'

function probe(label: string, birth: BirthData) {
  try {
    const chart = calculateBaZiFromBirthData(birth)
    const sl = chart.sixLines
    console.log(`[${label}]`)
    console.log(`  birth: ${birth.birthday} ${birth.birthTime} gender=${birth.gender} lon=${birth.longitude} tz=${birth.timezone} TST=${birth.useTrueSolarTime}`)
    console.log(`  四柱: 年${sl.year.gan}${sl.year.zhi} 月${sl.month.gan}${sl.month.zhi} 日${sl.day.gan}${sl.day.zhi} 时${sl.hour.gan}${sl.hour.zhi}`)
  } catch (e) {
    console.log(`[${label}] ERROR: ${(e as Error).message}`)
  }
}

probe('task-example 2024立春04:02', {
  birthday: '2024-02-04', birthTime: '04:02', gender: 'male',
  longitude: 116.4074, latitude: 39.9042, timezone: 'Asia/Shanghai',
  useTrueSolarTime: true, location: '北京',
})
probe('pre-lichun 2024-02-04 00:00', {
  birthday: '2024-02-04', birthTime: '00:00', gender: 'male',
  longitude: 116.4074, latitude: 39.9042, timezone: 'Asia/Shanghai',
  useTrueSolarTime: true, location: '北京',
})
probe('post-lichun 2024-02-04 20:00', {
  birthday: '2024-02-04', birthTime: '20:00', gender: 'male',
  longitude: 116.4074, latitude: 39.9042, timezone: 'Asia/Shanghai',
  useTrueSolarTime: true, location: '北京',
})

// lunar + solarTerm probe
function lunarProbe(label: string, y: number, mo: number, d: number, h = 12) {
  try {
    const dt = new Date(y, mo - 1, d, h)
    const cal = createPreciseCalendar(dt)
    console.log(`[lunar ${label} ${y}-${mo}-${d}]`)
    console.log(`  snapshot.lunarDate: ${cal.snapshot?.lunarDate}`)
    console.log(`  solarTermName: ${cal.solarTermName}`)
    console.log(`  lunar.yearText: ${cal.lunar.yearText} monthText: ${cal.lunar.monthText} dayText: ${cal.lunar.dayText} leap: ${cal.lunar.leap}`)
    console.log(`  yearGanZhi: ${cal.yearGanZhi.ganZhi} monthGanZhi: ${cal.monthGanZhi.ganZhi} dayGanZhi: ${cal.dayGanZhi.ganZhi}`)
    console.log(`  hours[0] (子): ${cal.hours[0]?.ganZhi} hours[5] (巳): ${cal.hours[5]?.ganZhi} hours[6] (午): ${cal.hours[6]?.ganZhi}`)
  } catch (e) {
    console.log(`[lunar ${label}] ERROR: ${(e as Error).message}`)
  }
}

lunarProbe('2024立春日', 2024, 2, 4, 4)
lunarProbe('2023闰二月', 2023, 4, 20)
lunarProbe('2020闰四月', 2020, 5, 23)
lunarProbe('2017闰六月', 2017, 7, 23)
lunarProbe('1976闰八月', 1976, 9, 25)

// dayun probe
try {
  const d = new Date(2024, 1, 4, 4, 2)
  const chart = calculateBaZiFromBirthData({
    birthday: '2024-02-04', birthTime: '04:02', gender: 'male',
    longitude: 116.4074, latitude: 39.9042, timezone: 'Asia/Shanghai',
    useTrueSolarTime: true, location: '北京',
  })
  const qi = calcDaYunStart(d, chart.sixLines.day.gan, 'male')
  console.log('[dayun probe male]')
  console.log(`  isShun: ${qi.isShun} qiYunAge: ${qi.qiYunAge} fromTerm: ${qi.fromTerm} toTerm: ${qi.toTerm}`)
  const steps = generateDaYun(d, chart.sixLines.day.gan, 'male', chart.sixLines.month.zhi, 1)
  console.log(`  first step: ganZhi=${steps[0]?.ganZhi.gan}${steps[0]?.ganZhi.zhi} startAge=${steps[0]?.startAge}`)
  // female test
  const chartF = calculateBaZiFromBirthData({
    birthday: '2024-02-04', birthTime: '04:02', gender: 'female',
    longitude: 116.4074, latitude: 39.9042, timezone: 'Asia/Shanghai',
    useTrueSolarTime: true, location: '北京',
  })
  const qiF = calcDaYunStart(d, chartF.sixLines.day.gan, 'female')
  console.log(`[dayun female] isShun: ${qiF.isShun} qiYunAge: ${qiF.qiYunAge}`)
} catch (e) {
  console.log('[dayun probe] ERROR: ' + (e as Error).message)
}

void getSolarTermName
