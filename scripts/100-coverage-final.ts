/**
 * 100% Rule Coverage - 针对每条未覆盖Rule手动构造测试用例
 * 按类型分组，每组构造专用context
 */

import { GEJU_RULES, buildGeJuContext } from '../src/lib/bazi/rules/gejuRules'

const gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const zhis = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

const GAN_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

const ZHI_ELEMENT: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

function getShen(dayGan: string, otherGan: string): string {
  const dayEl = GAN_ELEMENT[dayGan]
  const otherEl = GAN_ELEMENT[otherGan]
  const dayYang = ['甲','丙','戊','庚','壬'].includes(dayGan)
  const otherYang = ['甲','丙','戊','庚','壬'].includes(otherGan)
  
  const GEN: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const OVR: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
  
  if (otherEl === dayEl) return dayYang === otherYang ? '比肩' : '劫财'
  if (otherEl === GEN[dayEl]) return dayYang === otherYang ? '食神' : '伤官'
  if (otherEl === OVR[dayEl]) return dayYang === otherYang ? '偏财' : '正财'
  if (dayEl === OVR[otherEl]) return dayYang === otherYang ? '偏官' : '正官'
  if (dayEl === GEN[otherEl]) return dayYang === otherYang ? '偏印' : '正印'
  return '比肩'
}

function makeRelatedShens(dayGan: string): Record<string, string> {
  const r: Record<string, string> = {}
  for (const g of gans) r[g] = getShen(dayGan, g)
  return r
}

// 找一个月干十神为targetShen的组合
function findMonthGanForShen(dayGan: string, targetShen: string): string {
  for (const g of gans) {
    if (getShen(dayGan, g) === targetShen) return g
  }
  return gans[0]
}

interface TestResult {
  ruleId: string
  ruleName: string
  priority: number
  category: string
  covered: boolean
  testCase?: string
}

const results: TestResult[] = []

// 对每条规则，尝试多种策略
for (const rule of GEJU_RULES) {
  let covered = false
  let testCase = ''
  
  const condStr = rule.condition.toString()
  
  // 策略1：正格基础 - monthGanShen匹配
  const shenTypes = ['正官','偏官','正印','偏印','正财','偏财','食神','伤官','比肩','劫财']
  for (const shen of shenTypes) {
    if (condStr.includes(shen) && condStr.includes('monthGanShen')) {
      for (const dayGan of gans) {
        const monthGan = findMonthGanForShen(dayGan, shen)
        for (const monthZhi of zhis) {
          const rs = makeRelatedShens(dayGan)
          for (const strength of [10, 30, 50, 70, 90]) {
            const fe = makeFiveElement(ZHI_ELEMENT[monthZhi], 3)
            const ctx = buildCtx(dayGan, monthGan, monthZhi, rs, strength, fe)
            if (rule.condition(ctx as any)) {
              covered = true
              testCase = `${dayGan}日 ${monthGan}月干(${shen}) ${monthZhi}月 强度${strength}`
              break
            }
          }
          if (covered) break
        }
        if (covered) break
      }
      if (covered) break
    }
  }
  
  // 策略2：专旺格
  if (!covered && rule.category === '专旺格') {
    for (const element of ['木','火','土','金','水']) {
      if (condStr.includes(element)) {
        const dayGans = gans.filter(g => GAN_ELEMENT[g] === element)
        const monthZhis = zhis.filter(z => ZHI_ELEMENT[z] === element)
        for (const dayGan of dayGans) {
          for (const monthZhi of monthZhis) {
            const monthGan = findMonthGanForShen(dayGan, '比肩')
            const rs = makeRelatedShens(dayGan)
            const fe = makeFiveElement(element, 4)
            // 专旺格需要strength>=85 + isSeasonal + tongGenCount>=3
            for (const strength of [85, 90, 95]) {
              const ctx = buildCtxWithGen(dayGan, monthGan, monthZhi, rs, strength, fe, {
                tongGenCount: 3,
                isSeasonal: true,
                hasTongGen: true,
              })
              if (rule.condition(ctx as any)) {
                covered = true
                testCase = `${dayGan}日 ${monthZhi}月(得令) 强度${strength} 通根3 专旺格`
                break
              }
            }
            if (covered) break
          }
          if (covered) break
        }
        if (covered) break
      }
    }
  }
  
  // 策略3：特殊格 - 特定干支
  if (!covered && (rule.category === '特殊格' || rule.category === '特殊格局')) {
    const specialCases = [
      // 六乙鼠贵
      { test: (c: string) => c.includes('六乙鼠') || (c.includes('乙') && c.includes('子') && c.includes('hourZhi')),
        build: () => {
          const dayGan = '乙'
          const monthGan = findMonthGanForShen(dayGan, '正官')
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '子', monthGan, '寅', gans[2], '子', rs, 50, makeFiveElement('木', 2))
        },
        name: '六乙鼠贵(乙日子时)'
      },
      // 六阴朝阳
      { test: (c: string) => c.includes('六阴朝阳') || (c.includes('辛') && c.includes('hour.zhi') && c.includes('子')),
        build: () => {
          const dayGan = '辛'
          const monthGan = findMonthGanForShen(dayGan, '正官')
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '酉', monthGan, '酉', gans[2], '子', rs, 50, makeFiveElement('金', 2))
        },
        name: '六阴朝阳(辛日子时)'
      },
      // 六甲趋乾
      { test: (c: string) => c.includes('六甲趋乾') || (c.includes('甲') && c.includes('hour.zhi') && c.includes('亥')),
        build: () => {
          const dayGan = '甲'
          const monthGan = findMonthGanForShen(dayGan, '正官')
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '寅', monthGan, '寅', gans[2], '亥', rs, 50, makeFiveElement('木', 2))
        },
        name: '六甲趋乾(甲日亥时)'
      },
      // 井栏叉
      { test: (c: string) => c.includes('井栏叉') || c.includes('庚日'),
        build: () => {
          const dayGan = '庚'
          const monthGan = findMonthGanForShen(dayGan, '正官')
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '辰', monthGan, '申', '壬', '子', rs, 50, makeFiveElement('金', 3))
        },
        name: '井栏叉(庚日申子辰)'
      },
      // 天元一气
      { test: (c: string) => c.includes('天元一气') || c.includes('year.gan===gan'),
        build: () => {
          const dayGan = '甲'
          const rs: Record<string, string> = {}
          for (const g of gans) rs[g] = '比肩'
          return buildCtxCustom(dayGan, '子', dayGan, '丑', dayGan, '寅', rs, 70, makeFiveElement('木', 2))
        },
        name: '天元一气(四天干同)'
      },
      // 地元一气
      { test: (c: string) => c.includes('地元一气') || c.includes('year.zhi===zhi'),
        build: () => {
          const dayGan = '甲'
          const dayZhi = '子'
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, dayZhi, gans[1], dayZhi, gans[2], dayZhi, rs, 50, makeFiveElement('水', 4))
        },
        name: '地元一气(四地支同)'
      },
      // 两神成象
      { test: (c: string) => c.includes('两神成象') || c.includes('fes.length===2'),
        build: () => {
          const dayGan = '庚'
          const monthGan = findMonthGanForShen(dayGan, '食神')
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '申', monthGan, '酉', '壬', '子', rs, 50, { '金': 3, '水': 2, '木': 0, '火': 0, '土': 0 } as any)
        },
        name: '两神成象(金+水)'
      },
      // 三奇贵人
      { test: (c: string) => c.includes('三奇贵人') || c.includes('甲戊庚'),
        build: () => {
          const dayGan = '庚'
          const monthGan = '戊'
          const yearGan = '甲'
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '午', monthGan, '寅', yearGan, '子', rs, 50, makeFiveElement('金', 2))
        },
        name: '三奇贵人(甲戊庚)'
      },
      // 金白水清
      { test: (c: string) => c.includes('金白水清'),
        build: () => {
          const dayGan = '庚'
          const monthGan = '壬'
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '申', monthGan, '酉', '癸', '子', rs, 50, { '金': 3, '水': 3, '木': 0, '火': 0, '土': 0 } as any)
        },
        name: '金白水清(金日金水旺)'
      },
      // 木火通明
      { test: (c: string) => c.includes('木火通明'),
        build: () => {
          const dayGan = '甲'
          const monthGan = '丙'
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '寅', monthGan, '卯', '丁', '午', rs, 50, { '木': 3, '火': 3, '金': 0, '水': 0, '土': 0 } as any)
        },
        name: '木火通明(木日木火旺)'
      },
      // 水火既济
      { test: (c: string) => c.includes('水火既济'),
        build: () => {
          const dayGan = '壬'
          const monthGan = '丙'
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '子', monthGan, '午', '丁', '巳', rs, 50, { '水': 3, '火': 3, '木': 0, '金': 0, '土': 0 } as any)
        },
        name: '水火既济(水火各半)'
      },
      // 火土成慈
      { test: (c: string) => c.includes('火土成慈'),
        build: () => {
          const dayGan = '丙'
          const monthGan = '戊'
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '午', monthGan, '巳', '己', '未', rs, 50, { '火': 3, '土': 3, '木': 0, '金': 0, '水': 0 } as any)
        },
        name: '火土成慈(火日火土旺)'
      },
      // 金寒水冷
      { test: (c: string) => c.includes('金寒水冷'),
        build: () => {
          const dayGan = '庚'
          const monthGan = '壬'
          const monthZhi = '子'
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '申', monthGan, monthZhi, '癸', '亥', rs, 40, { '金': 3, '水': 3, '木': 0, '火': 0, '土': 0 } as any)
        },
        name: '金寒水冷(金日冬月)'
      },
      // 食神生财/伤官生财
      { test: (c: string) => c.includes('食神生财') || c.includes('伤官生财'),
        build: () => {
          const dayGan = '甲'
          const monthGan = '丙'  // 食神
          const rs = makeRelatedShens(dayGan)
          // 需要同时有食神和财
          return buildCtxCustom(dayGan, '寅', monthGan, '午', '戊', '辰', rs, 50, makeFiveElement('木', 2))
        },
        name: '食神生财(有食神有财)'
      },
      // 枭神夺食/伤官见官
      { test: (c: string) => c.includes('枭神夺食') || c.includes('伤官见官'),
        build: () => {
          const dayGan = '甲'
          const monthGan = '丙'  // 食神
          const rs = makeRelatedShens(dayGan)
          return buildCtxCustom(dayGan, '寅', monthGan, '午', '壬', '子', rs, 50, makeFiveElement('木', 2))
        },
        name: '枭神夺食(有偏印有食神)'
      },
    ]
    
    for (const sc of specialCases) {
      if (sc.test(condStr)) {
        try {
          const ctx = sc.build()
          if (rule.condition(ctx as any)) {
            covered = true
            testCase = sc.name
            break
          }
        } catch (e) {}
      }
    }
  }
  
  // 策略4：从格
  if (!covered && rule.category === '从格') {
    for (const element of ['木','火','土','金','水']) {
      const dayGans = gans.filter(g => GAN_ELEMENT[g] === element)
      for (const dayGan of dayGans) {
        for (const monthZhi of zhis) {
          const monthEl = ZHI_ELEMENT[monthZhi]
          // 从格月令异党
          if (monthEl === element) continue
          
          const monthGan = findMonthGanForShen(dayGan, '正官')
          const rs = makeRelatedShens(dayGan)
          const fe = makeFiveElement(monthEl, 4)
          
          for (const strength of [5, 10, 15, 20, 25]) {
            const ctx = buildCtxWithGen(dayGan, monthGan, monthZhi, rs, strength, fe, {
              diffPartyCount: 5,
              tongGenCount: 0,
              hasTongGen: false,
              isSeasonal: false,
            })
            if (rule.condition(ctx as any)) {
              covered = true
              testCase = `${dayGan}日 ${monthZhi}月(异党) 强度${strength} 异党5`
              break
            }
          }
          if (covered) break
        }
        if (covered) break
      }
      if (covered) break
    }
  }
  
  // 策略5：化气格
  if (!covered && rule.category === '化气格') {
    const huaQiCombos: [string, string, string][] = [
      ['甲', '己', '土'], ['己', '甲', '土'],
      ['乙', '庚', '金'], ['庚', '乙', '金'],
      ['丙', '辛', '水'], ['辛', '丙', '水'],
      ['丁', '壬', '木'], ['壬', '丁', '木'],
      ['戊', '癸', '火'], ['癸', '戊', '火'],
    ]
    for (const [g1, g2, element] of huaQiCombos) {
      if (condStr.includes(g1) && condStr.includes(g2)) {
        const dayGan = g1
        const rs = makeRelatedShens(dayGan)
        const monthZhi = zhis.find(z => ZHI_ELEMENT[z] === element) || '辰'
        const fe = makeFiveElement(element, 3)
        const ctx = buildCtxCustom(dayGan, '寅', g2, monthZhi, gans[3], '午', rs, 50, fe)
        if (rule.condition(ctx as any)) {
          covered = true
          testCase = `${g1}${g2}化${element}气`
          break
        }
      }
    }
  }
  
  // 策略6：调候格
  if (!covered && (rule.category === '调候格' || condStr.includes('调候'))) {
    // 寒命调候：冬月无火
    if (condStr.includes('寒') || condStr.includes('冬') || condStr.includes('子亥丑')) {
      const dayGan = '癸'
      const monthZhi = '子'
      const monthGan = findMonthGanForShen(dayGan, '正官')
      const rs = makeRelatedShens(dayGan)
      const fe: any = { '木': 1, '火': 0, '土': 1, '金': 2, '水': 3 }
      const ctx = buildCtxCustom(dayGan, '亥', monthGan, monthZhi, gans[3], '丑', rs, 40, fe)
      if (rule.condition(ctx as any)) {
        covered = true
        testCase = '寒命调候(冬月无火)'
      }
    }
    // 暖命调候：夏月无水
    if (!covered && (condStr.includes('暖') || condStr.includes('夏') || condStr.includes('午巳未'))) {
      const dayGan = '丙'
      const monthZhi = '午'
      const monthGan = findMonthGanForShen(dayGan, '正财')
      const rs = makeRelatedShens(dayGan)
      const fe: any = { '木': 1, '火': 4, '土': 2, '金': 1, '水': 0 }
      const ctx = buildCtxCustom(dayGan, '巳', monthGan, monthZhi, gans[3], '未', rs, 40, fe)
      if (rule.condition(ctx as any)) {
        covered = true
        testCase = '暖命调候(夏月无水)'
      }
    }
  }
  
  // 策略7：最后暴力尝试
  if (!covered) {
    for (const dayGan of gans) {
      const rs = makeRelatedShens(dayGan)
      for (const monthGan of gans.slice(0, 5)) {
        for (const monthZhi of zhis.slice(0, 6)) {
          for (const strength of [5, 20, 35, 50, 65, 80, 95]) {
            const fe = makeFiveElement(ZHI_ELEMENT[monthZhi], 2)
            const ctx = buildCtx(dayGan, monthGan, monthZhi, rs, strength, fe)
            if (rule.condition(ctx as any)) {
              covered = true
              testCase = `暴力找到: ${dayGan}日 ${monthGan}月 ${monthZhi}月支 强度${strength}`
              break
            }
          }
          if (covered) break
        }
        if (covered) break
      }
      if (covered) break
    }
  }
  
  results.push({
    ruleId: rule.id,
    ruleName: rule.name,
    priority: rule.priority,
    category: rule.category,
    covered,
    testCase,
  })
}

// ===== 辅助函数 =====
function buildCtx(dayGan: string, monthGan: string, monthZhi: string, rs: Record<string, string>, strength: number, fe: any) {
  return buildGeJuContext(
    { year: { gan: gans[0], zhi: zhis[0] }, month: { gan: monthGan, zhi: monthZhi }, day: { gan: dayGan, zhi: zhis[3] }, hour: { gan: gans[4], zhi: zhis[5] } },
    rs as any, strength, dayGan, monthZhi, fe
  )
}

function buildCtxCustom(dayGan: string, dayZhi: string, monthGan: string, monthZhi: string, yearGan: string, hourZhi: string, rs: Record<string, string>, strength: number, fe: any) {
  return buildGeJuContext(
    { year: { gan: yearGan, zhi: zhis[0] }, month: { gan: monthGan, zhi: monthZhi }, day: { gan: dayGan, zhi: dayZhi }, hour: { gan: gans[5], zhi: hourZhi } },
    rs as any, strength, dayGan, monthZhi, fe
  )
}

function buildCtxWithGen(dayGan: string, monthGan: string, monthZhi: string, rs: Record<string, string>, strength: number, fe: any, overrides: any) {
  const ctx = buildGeJuContext(
    { year: { gan: gans[0], zhi: zhis[0] }, month: { gan: monthGan, zhi: monthZhi }, day: { gan: dayGan, zhi: zhis[3] }, hour: { gan: gans[4], zhi: zhis[5] } },
    rs as any, strength, dayGan, monthZhi, fe
  )
  Object.assign(ctx, overrides)
  return ctx
}

function makeFiveElement(dominant: string, count: number): any {
  const fe: any = { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 }
  fe[dominant] = count
  return fe
}

// ===== 输出 =====
console.log('='.repeat(80))
console.log('玄风门 V7 格局系统 - 100% Rule Coverage 最终验证')
console.log('='.repeat(80))
console.log()

const covered = results.filter(r => r.covered)
const notCovered = results.filter(r => !r.covered)

console.log(`总Rule数：${results.length}`)
console.log(`已覆盖：${covered.length}`)
console.log(`未覆盖：${notCovered.length}`)
console.log(`覆盖率：${((covered.length / results.length) * 100).toFixed(1)}%`)
console.log()

if (notCovered.length > 0) {
  console.log('=== 未覆盖Rule ===')
  console.log()
  for (const r of notCovered) {
    console.log(`❌ P${String(r.priority).padEnd(3)} ${r.ruleId.padEnd(25)} ${r.ruleName.padEnd(15)} [${r.category}]`)
  }
}

console.log()
console.log('=== 已覆盖Rule完整列表 ===')
console.log()
const sorted = [...covered].sort((a, b) => b.priority - a.priority)
let idx = 1
for (const r of sorted) {
  console.log(`${String(idx).padStart(3)}. P${String(r.priority).padEnd(3)} ${r.ruleId.padEnd(25)} ${r.ruleName.padEnd(15)} [${r.category}]`)
  console.log(`     触发条件：${r.testCase}`)
  idx++
}
