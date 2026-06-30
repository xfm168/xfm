/**
 * 100% Rule Coverage - 针对每条规则精确构造测试用例
 * 逐条验证每条rule的condition都能返回true
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

// 十神与日主元素的关系
// 比劫：同我
// 食伤：我生
// 财：我克
// 官杀：克我
// 印：生我
function getShenRelation(dayElement: string, otherGan: string): string {
  const otherElement = GAN_ELEMENT[otherGan]
  const GENERATE: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const OVERCOME: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
  
  if (otherElement === dayElement) return '比劫'
  if (otherElement === GENERATE[dayElement]) return '食伤'
  if (otherElement === OVERCOME[dayElement]) return '财'
  if (otherElement === OVERCOME[otherElement]) return '官杀'  // 克我者
  if (otherElement === GENERATE[otherElement]) return '印'  // 生我者
  return '比劫'
}

interface TestResult {
  ruleId: string
  ruleName: string
  canTrigger: boolean
  testCase?: any
  reason: string
}

const results: TestResult[] = []

// 对每条规则，尝试构造满足条件的context
for (const rule of GEJU_RULES) {
  let found = false
  let testCase: any = null
  let reason = ''

  // 根据rule的category和condition特征，针对性构造
  const condStr = rule.condition.toString()

  // 策略1：专旺格 - 木火土金水日主，得令，强度高，通根多
  if (rule.category === '专旺格' || condStr.includes('专旺')) {
    // 找对应日主元素
    const elements = ['木', '火', '土', '金', '水']
    for (const element of elements) {
      if (condStr.includes(`'${element}'`) || condStr.includes(element)) {
        // 找对应日主
        const dayGans = gans.filter(g => GAN_ELEMENT[g] === element)
        for (const dayGan of dayGans) {
          // 找月令（得令）
          const monthZhis = zhis.filter(z => ZHI_ELEMENT[z] === element)
          for (const monthZhi of monthZhis) {
            // 构造context
            const ctx = buildHighStrengthContext(dayGan, monthZhi, element, 90, 3)
            try {
              if (rule.condition(ctx as any)) {
                found = true
                testCase = { dayGan, monthZhi, element, strength: 90, tongGenCount: 3 }
                reason = '专旺格：日主得令+强度90+通根3'
                break
              }
            } catch (e) {}
          }
          if (found) break
        }
        if (found) break
      }
    }
  }

  // 策略2：正格基础 - 月干十神匹配
  if (!found && (rule.category === '正格' || condStr.includes('monthGanShen'))) {
    const shenList = ['正官','偏官','正印','偏印','正财','偏财','食神','伤官','比肩','劫财']
    for (const targetShen of shenList) {
      if (condStr.includes(targetShen)) {
        // 找一个日主，使得月干十神是targetShen
        for (const dayGan of gans) {
          const dayElement = GAN_ELEMENT[dayGan]
          // 找一个月干，其十神为targetShen
          for (const monthGan of gans) {
            const monthGanShen = getSpecificShen(dayGan, monthGan, targetShen)
            if (monthGanShen === targetShen) {
              // 找月令
              for (const monthZhi of zhis) {
                const ctx = buildBasicContext(dayGan, monthGan, monthZhi, targetShen, 50)
                try {
                  if (rule.condition(ctx as any)) {
                    found = true
                    testCase = { dayGan, monthGan, monthZhi, monthGanShen: targetShen, strength: 50 }
                    reason = `正格：月干十神为${targetShen}`
                    break
                  }
                } catch (e) {}
              }
              if (found) break
            }
          }
          if (found) break
        }
        if (found) break
      }
    }
  }

  // 策略3：特殊格 - 如魁罡、飞天禄马等，需要特定干支
  if (!found && rule.category === '特殊格') {
    const specialTests = [
      // 魁罡格
      { dayGan: '庚', dayZhi: '辰', testName: '庚辰' },
      { dayGan: '壬', dayZhi: '辰', testName: '壬辰' },
      { dayGan: '戊', dayZhi: '戌', testName: '戊戌' },
      { dayGan: '庚', dayZhi: '戌', testName: '庚戌' },
      // 飞天禄马
      { dayGan: '庚', dayZhi: '子', testName: '庚子' },
      { dayGan: '壬', dayZhi: '子', testName: '壬子' },
      // 六乙鼠贵
      { dayGan: '乙', hourZhi: '子', testName: '乙日子时' },
      // 壬骑龙背
      { dayGan: '壬', dayZhi: '辰', testName: '壬辰' },
      // 六阴朝阳
      { dayGan: '辛', hourZhi: '子', testName: '辛日子时' },
      // 六甲趋乾
      { dayGan: '甲', hourZhi: '亥', testName: '甲日亥时' },
      // 井栏叉
      { dayGan: '庚', testName: '庚日' },
      // 倒冲格
      { dayGan: '丙', testName: '丙日' },
    ]

    for (const st of specialTests) {
      const dayGan = st.dayGan || '甲'
      const dayZhi = st.dayZhi || '子'
      const monthZhi = '寅'
      const monthGan = '丙'
      const hourZhi = st.hourZhi || '寅'
      const hourGan = '戊'

      const ctx = buildSpecialContext(dayGan, dayZhi, monthGan, monthZhi, hourGan, hourZhi)
      try {
        if (rule.condition(ctx as any)) {
          found = true
          testCase = { testName: st.testName, dayGan, dayZhi, monthZhi, hourZhi }
          reason = `特殊格：${st.testName}`
          break
        }
      } catch (e) {}
    }
  }

  // 策略4：天元一气/地元一气
  if (!found && (condStr.includes('天元一气') || condStr.includes('天干一气') || condStr.includes('year.gan===gan'))) {
    // 四天干相同
    for (const dayGan of gans) {
      const ctx = buildContextWithSameGans(dayGan)
      try {
        if (rule.condition(ctx as any)) {
          found = true
          testCase = { dayGan, pattern: '四天干相同' }
          reason = '四天干相同'
          break
        }
      } catch (e) {}
    }
  }

  if (!found && (condStr.includes('地元一气') || condStr.includes('地支一气') || condStr.includes('year.zhi===zhi'))) {
    for (const dayZhi of zhis) {
      const ctx = buildContextWithSameZhis(dayZhi)
      try {
        if (rule.condition(ctx as any)) {
          found = true
          testCase = { dayZhi, pattern: '四地支相同' }
          reason = '四地支相同'
          break
        }
      } catch (e) {}
    }
  }

  // 策略5：从格 - 弱极
  if (!found && (rule.category === '从格' || condStr.includes('strengthScore<') || condStr.includes('diffPartyCount'))) {
    const elements = ['木', '火', '土', '金', '水']
    for (const element of elements) {
      const dayGans = gans.filter(g => GAN_ELEMENT[g] === element)
      for (const dayGan of dayGans) {
        for (const monthZhi of zhis) {
          for (const strength of [5, 10, 15, 20, 25]) {
            const ctx = buildWeakContext(dayGan, monthZhi, strength, 5)
            try {
              if (rule.condition(ctx as any)) {
                found = true
                testCase = { dayGan, monthZhi, strength, diffPartyCount: 5 }
                reason = `从格：强度${strength}+异党5`
                break
              }
            } catch (e) {}
          }
          if (found) break
        }
        if (found) break
      }
      if (found) break
    }
  }

  // 策略6：破格 - 需要有特定十神组合
  if (!found && rule.category === '破格') {
    // 尝试多种组合
    for (const dayGan of gans.slice(0, 3)) {
      for (const monthZhi of zhis.slice(0, 3)) {
        for (const strength of [30, 50, 70]) {
          // 构造一个有多个十神的relatedShens
          const relatedShens = getAllShensForDay(dayGan)
          const ctx = buildPogeContext(dayGan, monthZhi, relatedShens, strength)
          try {
            if (rule.condition(ctx as any)) {
              found = true
              testCase = { dayGan, monthZhi, strength }
              reason = `破格：多种十神组合`
              break
            }
          } catch (e) {}
        }
        if (found) break
      }
      if (found) break
    }
  }

  // 策略7：化气格
  if (!found && rule.category === '化气格') {
    const huaQiPairs: Record<string, string[]> = {
      '甲': ['己'], '己': ['甲'],
      '乙': ['庚'], '庚': ['乙'],
      '丙': ['辛'], '辛': ['丙'],
      '丁': ['壬'], '壬': ['丁'],
      '戊': ['癸'], '癸': ['戊'],
    }
    for (const [gan1, gan2s] of Object.entries(huaQiPairs)) {
      for (const gan2 of gan2s) {
        const ctx = buildHuaQiContext(gan1, gan2)
        try {
          if (rule.condition(ctx as any)) {
            found = true
            testCase = { gan1, gan2 }
            reason = `化气格：${gan1}${gan2}化气`
            break
          }
        } catch (e) {}
      }
      if (found) break
    }
  }

  // 策略8：两神成象/金白水清等 - 特定五行组合
  if (!found && (condStr.includes('两神成象') || condStr.includes('金白水清') || condStr.includes('木火通明') || condStr.includes('fes.length===2'))) {
    const combos = [
      { dayElement: '金', fe: { '金': 3, '水': 3, '木': 0, '火': 0, '土': 0 } },
      { dayElement: '木', fe: { '木': 3, '火': 3, '金': 0, '水': 0, '土': 0 } },
      { dayElement: '火', fe: { '火': 3, '土': 3, '金': 0, '水': 0, '木': 0 } },
      { dayElement: '土', fe: { '土': 3, '金': 3, '木': 0, '火': 0, '水': 0 } },
      { dayElement: '水', fe: { '水': 3, '木': 3, '火': 0, '土': 0, '金': 0 } },
    ]
    for (const combo of combos) {
      const dayGans = gans.filter(g => GAN_ELEMENT[g] === combo.dayElement)
      for (const dayGan of dayGans) {
        const ctx = buildTwoElementContext(dayGan, combo.fe as any)
        try {
          if (rule.condition(ctx as any)) {
            found = true
            testCase = { dayElement: combo.dayElement }
            reason = `两神成象：${combo.dayElement}生另一行`
            break
          }
        } catch (e) {}
      }
      if (found) break
    }
  }

  // 策略9：最后暴力尝试
  if (!found) {
    const bruteForce = generateBruteForceContexts()
    for (const ctx of bruteForce) {
      try {
        if (rule.condition(ctx as any)) {
          found = true
          testCase = { method: '暴力枚举' }
          reason = '暴力枚举找到'
          break
        }
      } catch (e) {}
    }
  }

  results.push({
    ruleId: rule.id,
    ruleName: rule.name,
    canTrigger: found,
    testCase,
    reason: found ? reason : '无法构造满足条件的context',
  })
}

// ===== 辅助函数 =====

function buildHighStrengthContext(dayGan: string, monthZhi: string, element: string, strength: number, tongGen: number) {
  const dayElement = GAN_ELEMENT[dayGan]
  const monthElement = ZHI_ELEMENT[monthZhi]
  const isSeasonal = dayElement === monthElement
  
  const relatedShens: Record<string, string> = {}
  for (const g of gans) {
    relatedShens[g] = getSpecificShenForGan(dayGan, g)
  }
  
  const fiveElement: any = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  fiveElement[element] = 4
  
  return buildGeJuContext(
    {
      year: { gan: gans[0], zhi: monthZhi },
      month: { gan: gans[1], zhi: monthZhi },
      day: { gan: dayGan, zhi: monthZhi },
      hour: { gan: gans[2], zhi: monthZhi },
    },
    relatedShens as any,
    strength,
    dayGan,
    monthZhi,
    fiveElement
  )
}

function buildBasicContext(dayGan: string, monthGan: string, monthZhi: string, monthGanShen: string, strength: number) {
  const relatedShens: Record<string, string> = {}
  relatedShens[monthGan] = monthGanShen
  // 再加几个
  for (const g of gans) {
    if (!relatedShens[g]) {
      relatedShens[g] = getSpecificShenForGan(dayGan, g)
    }
  }
  
  return buildGeJuContext(
    {
      year: { gan: gans[2], zhi: zhis[5] },
      month: { gan: monthGan, zhi: monthZhi },
      day: { gan: dayGan, zhi: zhis[3] },
      hour: { gan: gans[4], zhi: zhis[7] },
    },
    relatedShens as any,
    strength,
    dayGan,
    monthZhi,
    { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 }
  )
}

function buildSpecialContext(dayGan: string, dayZhi: string, monthGan: string, monthZhi: string, hourGan: string, hourZhi: string) {
  const relatedShens: Record<string, string> = {}
  for (const g of gans) {
    relatedShens[g] = getSpecificShenForGan(dayGan, g)
  }
  
  return buildGeJuContext(
    {
      year: { gan: gans[0], zhi: zhis[0] },
      month: { gan: monthGan, zhi: monthZhi },
      day: { gan: dayGan, zhi: dayZhi },
      hour: { gan: hourGan, zhi: hourZhi },
    },
    relatedShens as any,
    50,
    dayGan,
    monthZhi,
    { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 }
  )
}

function buildContextWithSameGans(dayGan: string) {
  const relatedShens: Record<string, string> = {}
  relatedShens[dayGan] = '比肩'
  for (const g of gans) {
    relatedShens[g] = '比肩'
  }
  
  return buildGeJuContext(
    {
      year: { gan: dayGan, zhi: zhis[0] },
      month: { gan: dayGan, zhi: zhis[1] },
      day: { gan: dayGan, zhi: zhis[2] },
      hour: { gan: dayGan, zhi: zhis[3] },
    },
    relatedShens as any,
    80,
    dayGan,
    zhis[1],
    { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 }
  )
}

function buildContextWithSameZhis(dayZhi: string) {
  const dayGan = '甲'
  const relatedShens: Record<string, string> = {}
  for (const g of gans) {
    relatedShens[g] = getSpecificShenForGan(dayGan, g)
  }
  
  return buildGeJuContext(
    {
      year: { gan: gans[0], zhi: dayZhi },
      month: { gan: gans[1], zhi: dayZhi },
      day: { gan: dayGan, zhi: dayZhi },
      hour: { gan: gans[2], zhi: dayZhi },
    },
    relatedShens as any,
    50,
    dayGan,
    dayZhi,
    { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 }
  )
}

function buildWeakContext(dayGan: string, monthZhi: string, strength: number, diffParty: number) {
  const relatedShens: Record<string, string> = {}
  for (const g of gans) {
    relatedShens[g] = getSpecificShenForGan(dayGan, g)
  }
  
  const ctx = buildGeJuContext(
    {
      year: { gan: gans[0], zhi: zhis[0] },
      month: { gan: gans[1], zhi: monthZhi },
      day: { gan: dayGan, zhi: zhis[3] },
      hour: { gan: gans[2], zhi: zhis[5] },
    },
    relatedShens as any,
    strength,
    dayGan,
    monthZhi,
    { '木': 1, '火': 1, '土': 1, '金': 3, '水': 3 }
  )
  
  ;(ctx as any).diffPartyCount = diffParty
  ;(ctx as any).tongGenCount = 0
  ;(ctx as any).hasTongGen = false
  ;(ctx as any).samePartyCount = 1
  ;(ctx as any).isSeasonal = false
  
  return ctx
}

function buildPogeContext(dayGan: string, monthZhi: string, relatedShens: Record<string, string>, strength: number) {
  return buildGeJuContext(
    {
      year: { gan: gans[0], zhi: zhis[0] },
      month: { gan: gans[1], zhi: monthZhi },
      day: { gan: dayGan, zhi: zhis[3] },
      hour: { gan: gans[2], zhi: zhis[5] },
    },
    relatedShens as any,
    strength,
    dayGan,
    monthZhi,
    { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 }
  )
}

function buildHuaQiContext(gan1: string, gan2: string) {
  const dayGan = gan1
  const relatedShens: Record<string, string> = {}
  relatedShens[gan2] = '正财'  // 随便设
  for (const g of gans) {
    if (!relatedShens[g]) relatedShens[g] = '比肩'
  }
  
  return buildGeJuContext(
    {
      year: { gan: gan2, zhi: zhis[0] },
      month: { gan: gans[1], zhi: zhis[1] },
      day: { gan: gan1, zhi: zhis[2] },
      hour: { gan: gans[3], zhi: zhis[3] },
    },
    relatedShens as any,
    50,
    dayGan,
    zhis[1],
    { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 }
  )
}

function buildTwoElementContext(dayGan: string, fe: Record<string, number>) {
  const relatedShens: Record<string, string> = {}
  for (const g of gans) {
    relatedShens[g] = getSpecificShenForGan(dayGan, g)
  }
  
  return buildGeJuContext(
    {
      year: { gan: gans[0], zhi: zhis[0] },
      month: { gan: gans[1], zhi: zhis[1] },
      day: { gan: dayGan, zhi: zhis[2] },
      hour: { gan: gans[3], zhi: zhis[3] },
    },
    relatedShens as any,
    50,
    dayGan,
    zhis[1],
    fe as any
  )
}

function getAllShensForDay(dayGan: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const g of gans) {
    result[g] = getSpecificShenForGan(dayGan, g)
  }
  return result
}

function getSpecificShenForGan(dayGan: string, otherGan: string): string {
  const dayElement = GAN_ELEMENT[dayGan]
  const otherElement = GAN_ELEMENT[otherGan]
  const dayYang = ['甲','丙','戊','庚','壬'].includes(dayGan)
  const otherYang = ['甲','丙','戊','庚','壬'].includes(otherGan)
  
  const GENERATE: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const OVERCOME: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
  
  if (otherElement === dayElement) {
    return dayYang === otherYang ? '比肩' : '劫财'
  }
  if (otherElement === GENERATE[dayElement]) {
    return dayYang === otherYang ? '食神' : '伤官'
  }
  if (otherElement === OVERCOME[dayElement]) {
    return dayYang === otherYang ? '偏财' : '正财'
  }
  if (dayElement === OVERCOME[otherElement]) {
    return dayYang === otherYang ? '偏官' : '正官'
  }
  if (dayElement === GENERATE[otherElement]) {
    return dayYang === otherYang ? '偏印' : '正印'
  }
  return '比肩'
}

function getSpecificShen(dayGan: string, otherGan: string, target: string): string {
  return getSpecificShenForGan(dayGan, otherGan)
}

function generateBruteForceContexts(): any[] {
  const ctxs: any[] = []
  for (let i = 0; i < 1000; i++) {
    const dayGan = gans[i % 10]
    const monthZhi = zhis[(i * 3) % 12]
    const strength = (i * 7) % 100
    
    const relatedShens: Record<string, string> = {}
    for (const g of gans) {
      relatedShens[g] = getSpecificShenForGan(dayGan, g)
    }
    
    const fe: any = {
      '木': (i * 2) % 4 + 1,
      '火': (i * 3) % 4 + 1,
      '土': (i * 5) % 4 + 1,
      '金': (i * 7) % 4 + 1,
      '水': (i * 11) % 4 + 1,
    }
    
    const ctx = buildGeJuContext(
      {
        year: { gan: gans[(i*2)%10], zhi: zhis[(i*3)%12] },
        month: { gan: gans[(i*5)%10], zhi: monthZhi },
        day: { gan: dayGan, zhi: zhis[(i*7)%12] },
        hour: { gan: gans[(i*11)%10], zhi: zhis[(i*13)%12] },
      },
      relatedShens as any,
      strength,
      dayGan,
      monthZhi,
      fe
    )
    
    ctxs.push(ctx)
  }
  return ctxs
}

// ===== 输出结果 =====
console.log('='.repeat(80))
console.log('100% Rule Coverage 验证')
console.log('='.repeat(80))
console.log()

const triggered = results.filter(r => r.canTrigger)
const notTriggered = results.filter(r => !r.canTrigger)

console.log(`总Rule数：${results.length}`)
console.log(`可触发：${triggered.length}`)
console.log(`不可触发：${notTriggered.length}`)
console.log(`覆盖率：${((triggered.length / results.length) * 100).toFixed(1)}%`)
console.log()

if (notTriggered.length > 0) {
  console.log('=== 不可触发的Rule ===')
  console.log()
  for (const r of notTriggered) {
    console.log(`❌ ${r.ruleId} - ${r.ruleName}`)
    console.log(`   原因：${r.reason}`)
    console.log()
  }
}

console.log()
console.log('=== 可触发的Rule（含触发条件）===')
console.log()
for (const r of triggered) {
  console.log(`✅ ${r.ruleId} - ${r.ruleName}`)
  console.log(`   触发条件：${r.reason}`)
  console.log(`   测试用例：${JSON.stringify(r.testCase)}`)
  console.log()
}
