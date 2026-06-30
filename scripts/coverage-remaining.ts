/**
 * 针对剩余41条未覆盖Rule，逐条精确构造测试用例
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

function makeRS(dayGan: string): Record<string, string> {
  const r: Record<string, string> = {}
  for (const g of gans) r[g] = getShen(dayGan, g)
  return r
}

// 未覆盖的41条Rule，逐条构造
const uncoveredIds = [
  'quzhi-ge', 'yanshang-ge', 'jiase-ge', 'congge-ge', 'runxia-ge',
  'qiming-congsha', 'qiming-congcai',
  'guanqing-yinzhong',
  'feitian-luma', 'jinshen-ge', 'kuigang-ge',
  'liuyi-shugui', 'renqi-longbei', 'liuyin-chaoyang', 'liujia-quqian',
  'jinglan-cha', 'daochong-ge',
  'tianyuan-yiqi',
  'jinbai-shuiqing', 'muhuo-tongming', 'shuihuo-jiji', 'huotu-chengci', 'jinhan-shuiling',
  'liuxiu-ri', 'shiling-ri',
  'siwei-chunquan', 'tiangan-shunshi', 'liangqi-chengxiang',
  'tiangan-yiqi', 'tiandi-dehe',
  'zhen-cong-qiang',
  'ban-cong-yin',
  'jiaji-huatu', 'yigeng-huajin', 'bingxin-huashui', 'dingren-huamu', 'wugui-huahuo',
  'hanming-tiaohou', 'nuanming-tiaohou',
  'guansha-tongguan',
  'zhuānwàng-gé',
]

interface Result {
  ruleId: string
  ruleName: string
  covered: boolean
  testCase?: string
}

const results: Result[] = []

for (const id of uncoveredIds) {
  const rule = GEJU_RULES.find(r => r.id === id)
  if (!rule) continue
  
  let covered = false
  let testCase = ''
  const condStr = rule.condition.toString()
  
  // ===== 专旺格 =====
  if (id === 'quzhi-ge' || id === 'yanshang-ge' || id === 'jiase-ge' || id === 'congge-ge' || id === 'runxia-ge') {
    const elementMap: Record<string, string> = {
      'quzhi-ge': '木', 'yanshang-ge': '火', 'jiase-ge': '土', 'congge-ge': '金', 'runxia-ge': '水',
    }
    const element = elementMap[id]
    const dayGans = gans.filter(g => GAN_ELEMENT[g] === element)
    const monthZhis = zhis.filter(z => ZHI_ELEMENT[z] === element)
    
    for (const dayGan of dayGans) {
      for (const monthZhi of monthZhis) {
        const rs = makeRS(dayGan)
        const monthGan = gans.find(g => getShen(dayGan, g) === '比肩') || dayGan
        const fe: any = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
        fe[element] = 5
        const dayZhi = monthZhis[0]
        const hourZhi = monthZhis[1] || monthZhis[0]
        
        const ctx = buildGeJuContext(
          { year: { gan: dayGan, zhi: monthZhi }, month: { gan: monthGan, zhi: monthZhi },
            day: { gan: dayGan, zhi: dayZhi }, hour: { gan: dayGan, zhi: hourZhi } },
          rs as any, 90, dayGan, monthZhi, fe
        )
        ;(ctx as any).tongGenCount = 3
        ;(ctx as any).isSeasonal = true
        ;(ctx as any).hasTongGen = true
        ;(ctx as any).samePartyCount = 4
        
        if (rule.condition(ctx as any)) {
          covered = true
          testCase = `${dayGan}日 ${monthZhi}月(得令) 强度90 通根3 ${element}专旺`
          break
        }
      }
      if (covered) break
    }
  }
  
  // ===== 弃命从杀/从财 =====
  else if (id === 'qiming-congsha' || id === 'qiming-congcai') {
    const target = id === 'qiming-congsha' ? '官杀' : '财'
    for (const dayGan of gans.slice(0, 5)) {
      for (const monthZhi of zhis) {
        const rs = makeRS(dayGan)
        const monthGan = gans[1]
        const fe: any = { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 }
        fe[ZHI_ELEMENT[monthZhi]] = 4
        
        const ctx = buildGeJuContext(
          { year: { gan: gans[2], zhi: zhis[0] }, month: { gan: monthGan, zhi: monthZhi },
            day: { gan: dayGan, zhi: zhis[3] }, hour: { gan: gans[4], zhi: zhis[5] } },
          rs as any, 5, dayGan, monthZhi, fe
        )
        ;(ctx as any).diffPartyCount = 5
        ;(ctx as any).tongGenCount = 0
        ;(ctx as any).hasTongGen = false
        ;(ctx as any).isSeasonal = false
        
        if (rule.condition(ctx as any)) {
          covered = true
          testCase = `弃命从${target}：${dayGan}日 ${monthZhi}月 强度5 异党5`
          break
        }
      }
      if (covered) break
    }
  }
  
  // ===== 官轻印重 =====
  else if (id === 'guanqing-yinzhong') {
    for (const dayGan of gans.slice(0, 3)) {
      for (const monthZhi of zhis.slice(0, 4)) {
        const rs = makeRS(dayGan)
        const monthGan = gans.find(g => getShen(dayGan, g) === '正官') || gans[1]
        
        const ctx = buildGeJuContext(
          { year: { gan: gans[2], zhi: zhis[0] }, month: { gan: monthGan, zhi: monthZhi },
            day: { gan: dayGan, zhi: zhis[3] }, hour: { gan: gans[4], zhi: zhis[5] } },
          rs as any, 40, dayGan, monthZhi,
          { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 } as any
        )
        
        if (rule.condition(ctx as any)) {
          covered = true
          testCase = `官轻印重：${dayGan}日 ${monthZhi}月 强度40`
          break
        }
      }
      if (covered) break
    }
  }
  
  // ===== 特殊格 - 飞天禄马 =====
  else if (id === 'feitian-luma') {
    for (const dayGan of ['庚', '壬']) {
      for (const dayZhi of ['子']) {
        const rs = makeRS(dayGan)
        const ctx = buildGeJuContext(
          { year: { gan: '甲', zhi: '子' }, month: { gan: '丙', zhi: '寅' },
            day: { gan: dayGan, zhi: dayZhi }, hour: { gan: '戊', zhi: '子' } },
          rs as any, 40, dayGan, '寅',
          { '木': 2, '火': 1, '土': 1, '金': 1, '水': 3 } as any
        )
        if (rule.condition(ctx as any)) {
          covered = true
          testCase = `飞天禄马：${dayGan}${dayZhi}日 多子水`
          break
        }
      }
      if (covered) break
    }
  }
  
  // ===== 金神格 =====
  else if (id === 'jinshen-ge') {
    for (const dayGan of ['甲', '己']) {
      for (const hourZhi of ['酉', '申', '丑', '戌']) {
        const rs = makeRS(dayGan)
        const ctx = buildGeJuContext(
          { year: { gan: '庚', zhi: '申' }, month: { gan: '辛', zhi: '酉' },
            day: { gan: dayGan, zhi: '午' }, hour: { gan: '庚', zhi: hourZhi } },
          rs as any, 50, dayGan, '酉',
          { '木': 0, '火': 2, '土': 1, '金': 4, '水': 0 } as any
        )
        if (rule.condition(ctx as any)) {
          covered = true
          testCase = `金神格：${dayGan}日 ${hourZhi}时 金旺`
          break
        }
      }
      if (covered) break
    }
  }
  
  // ===== 魁罡格 =====
  else if (id === 'kuigang-ge') {
    const kuiGangDays = [['庚', '辰'], ['壬', '辰'], ['戊', '戌'], ['庚', '戌']]
    for (const [dayGan, dayZhi] of kuiGangDays) {
      const rs = makeRS(dayGan)
      const ctx = buildGeJuContext(
        { year: { gan: '甲', zhi: '寅' }, month: { gan: '丙', zhi: '午' },
          day: { gan: dayGan, zhi: dayZhi }, hour: { gan: '戊', zhi: '申' } },
        rs as any, 60, dayGan, '午',
        { '木': 1, '火': 2, '土': 2, '金': 1, '水': 1 } as any
      )
      if (rule.condition(ctx as any)) {
        covered = true
        testCase = `魁罡格：${dayGan}${dayZhi}日`
        break
      }
    }
  }
  
  // ===== 六乙鼠贵 =====
  else if (id === 'liuyi-shugui') {
    const dayGan = '乙'
    const hourZhi = '子'
    const rs = makeRS(dayGan)
    const ctx = buildGeJuContext(
      { year: { gan: '丁', zhi: '亥' }, month: { gan: '己', zhi: '丑' },
        day: { gan: dayGan, zhi: '卯' }, hour: { gan: '丁', zhi: hourZhi } },
      rs as any, 45, dayGan, '丑',
      { '木': 2, '火': 2, '土': 2, '金': 0, '水': 2 } as any
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `六乙鼠贵：乙日子时`
    }
  }
  
  // ===== 壬骑龙背 =====
  else if (id === 'renqi-longbei') {
    const dayGan = '壬'
    const dayZhi = '辰'
    const rs = makeRS(dayGan)
    const ctx = buildGeJuContext(
      { year: { gan: '甲', zhi: '寅' }, month: { gan: '丙', zhi: '午' },
        day: { gan: dayGan, zhi: dayZhi }, hour: { gan: '庚', zhi: '申' } },
      rs as any, 55, dayGan, '午',
      { '木': 1, '火': 1, '土': 2, '金': 1, '水': 2 } as any
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `壬骑龙背：壬辰日`
    }
  }
  
  // ===== 六阴朝阳 =====
  else if (id === 'liuyin-chaoyang') {
    const dayGan = '辛'
    const hourZhi = '子'
    const rs = makeRS(dayGan)
    const ctx = buildGeJuContext(
      { year: { gan: '己', zhi: '亥' }, month: { gan: '丁', zhi: '丑' },
        day: { gan: dayGan, zhi: '酉' }, hour: { gan: '癸', zhi: hourZhi } },
      rs as any, 50, dayGan, '丑',
      { '木': 0, '火': 1, '土': 2, '金': 3, '水': 2 } as any
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `六阴朝阳：辛日子时`
    }
  }
  
  // ===== 六甲趋乾 =====
  else if (id === 'liujia-quqian') {
    const dayGan = '甲'
    const hourZhi = '亥'
    const rs = makeRS(dayGan)
    const ctx = buildGeJuContext(
      { year: { gan: '丙', zhi: '寅' }, month: { gan: '戊', zhi: '辰' },
        day: { gan: dayGan, zhi: '子' }, hour: { gan: '壬', zhi: hourZhi } },
      rs as any, 60, dayGan, '辰',
      { '木': 3, '火': 1, '土': 1, '金': 0, '水': 2 } as any
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `六甲趋乾：甲日亥时`
    }
  }
  
  // ===== 井栏叉 =====
  else if (id === 'jinglan-cha') {
    const dayGan = '庚'
    const rs = makeRS(dayGan)
    const ctx = buildGeJuContext(
      { year: { gan: '壬', zhi: '子' }, month: { gan: '戊', zhi: '申' },
        day: { gan: dayGan, zhi: '辰' }, hour: { gan: '壬', zhi: '子' } },
      rs as any, 55, dayGan, '申',
      { '木': 0, '火': 0, '土': 1, '金': 3, '水': 3 } as any
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `井栏叉：庚日 申子辰全`
    }
  }
  
  // ===== 倒冲格 =====
  else if (id === 'daochong-ge') {
    const dayGan = '丙'
    const rs = makeRS(dayGan)
    const ctx = buildGeJuContext(
      { year: { gan: '甲', zhi: '午' }, month: { gan: '戊', zhi: '午' },
        day: { gan: dayGan, zhi: '午' }, hour: { gan: '甲', zhi: '午' } },
      rs as any, 70, dayGan, '午',
      { '木': 1, '火': 5, '土': 1, '金': 0, '水': 0 } as any
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `倒冲格：丙日 多午火`
    }
  }
  
  // ===== 天元一气 =====
  else if (id === 'tianyuan-yiqi' || id === 'tiangan-yiqi') {
    for (const dayGan of gans.slice(0, 3)) {
      const rs: Record<string, string> = {}
      for (const g of gans) rs[g] = '比肩'
      const ctx = buildGeJuContext(
        { year: { gan: dayGan, zhi: '子' }, month: { gan: dayGan, zhi: '丑' },
          day: { gan: dayGan, zhi: '寅' }, hour: { gan: dayGan, zhi: '卯' } },
        rs as any, 80, dayGan, '丑',
        { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 } as any
      )
      if (rule.condition(ctx as any)) {
        covered = true
        testCase = `天元一气：${dayGan}日 四天干同`
        break
      }
    }
  }
  
  // ===== 金白水清/木火通明/水火既济/火土成慈/金寒水冷 =====
  else if (['jinbai-shuiqing', 'muhuo-tongming', 'shuihuo-jiji', 'huotu-chengci', 'jinhan-shuiling'].includes(id)) {
    const configs: Record<string, any> = {
      'jinbai-shuiqing': { dayEl: '金', fe: { '金': 3, '水': 3, '木': 0, '火': 0, '土': 0 }, month: '子' },
      'muhuo-tongming': { dayEl: '木', fe: { '木': 3, '火': 3, '金': 0, '水': 0, '土': 0 }, month: '寅' },
      'shuihuo-jiji': { dayEl: '水', fe: { '水': 2, '火': 2, '木': 1, '金': 1, '土': 0 }, month: '子' },
      'huotu-chengci': { dayEl: '火', fe: { '火': 3, '土': 3, '木': 0, '金': 0, '水': 0 }, month: '午' },
      'jinhan-shuiling': { dayEl: '金', fe: { '金': 3, '水': 2, '木': 0, '火': 0, '土': 1 }, month: '子' },
    }
    const cfg = configs[id]
    const dayGans = gans.filter(g => GAN_ELEMENT[g] === cfg.dayEl)
    for (const dayGan of dayGans) {
      const rs = makeRS(dayGan)
      const monthZhi = cfg.month
      const ctx = buildGeJuContext(
        { year: { gan: gans[0], zhi: zhis[0] }, month: { gan: gans[1], zhi: monthZhi },
          day: { gan: dayGan, zhi: zhis[3] }, hour: { gan: gans[4], zhi: zhis[5] } },
        rs as any, 50, dayGan, monthZhi, cfg.fe
      )
      if (rule.condition(ctx as any)) {
        covered = true
        testCase = `${rule.name}：${dayGan}日 ${monthZhi}月 五行配置`
        break
      }
    }
  }
  
  // ===== 六秀日/十灵日 =====
  else if (id === 'liuxiu-ri' || id === 'shiling-ri') {
    const specialDays = id === 'liuxiu-ri'
      ? [['辛', '丑'], ['丁', '未'], ['己', '未'], ['丙', '午'], ['戊', '午'], ['乙', '巳']]
      : [['甲', '寅'], ['乙', '亥'], ['丙', '辰'], ['丁', '未'], ['戊', '午'], ['己', '酉'], ['庚', '申'], ['辛', '亥'], ['壬', '子'], ['癸', '丑']]
    for (const [dayGan, dayZhi] of specialDays) {
      const rs = makeRS(dayGan)
      const ctx = buildGeJuContext(
        { year: { gan: '壬', zhi: '子' }, month: { gan: '甲', zhi: '寅' },
          day: { gan: dayGan, zhi: dayZhi }, hour: { gan: '丙', zhi: '午' } },
        rs as any, 50, dayGan, '寅',
        { '木': 2, '火': 2, '土': 1, '金': 1, '水': 2 } as any
      )
      if (rule.condition(ctx as any)) {
        covered = true
        testCase = `${rule.name}：${dayGan}${dayZhi}日`
        break
      }
    }
  }
  
  // ===== 四位纯全 =====
  else if (id === 'siwei-chunquan') {
    // 子午卯酉全
    const dayGan = '甲'
    const rs = makeRS(dayGan)
    const ctx = buildGeJuContext(
      { year: { gan: '丙', zhi: '子' }, month: { gan: '戊', zhi: '午' },
        day: { gan: dayGan, zhi: '卯' }, hour: { gan: '庚', zhi: '酉' } },
      rs as any, 55, dayGan, '午',
      { '木': 1, '火': 2, '土': 1, '金': 1, '水': 1 } as any
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `四位纯全：子午卯酉全`
    }
  }
  
  // ===== 天干顺食 =====
  else if (id === 'tiangan-shunshi') {
    // 甲乙丙丁 - 木生火（食神）
    const dayGan = '丙'  // 中间
    const rs = makeRS(dayGan)
    const ctx = buildGeJuContext(
      { year: { gan: '甲', zhi: '子' }, month: { gan: '乙', zhi: '丑' },
        day: { gan: '丙', zhi: '寅' }, hour: { gan: '丁', zhi: '卯' } },
      rs as any, 60, dayGan, '丑',
      { '木': 2, '火': 2, '土': 1, '金': 0, '水': 1 } as any
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `天干顺食：甲乙丙丁 木火相生`
    }
  }
  
  // ===== 两气成象 =====
  else if (id === 'liangqi-chengxiang') {
    // 天干同五行，地支同五行，但不同
    const dayGan = '甲'
    const rs: Record<string, string> = {}
    for (const g of gans) rs[g] = '比肩'
    const ctx = buildGeJuContext(
      { year: { gan: '甲', zhi: '子' }, month: { gan: '乙', zhi: '亥' },
        day: { gan: '甲', zhi: '子' }, hour: { gan: '乙', zhi: '亥' } },
      rs as any, 70, '甲', '亥',
      { '木': 4, '火': 0, '土': 0, '金': 0, '水': 4 } as any
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `两气成象：天干木 地支水`
    }
  }
  
  // ===== 天地德合 =====
  else if (id === 'tiandi-dehe') {
    // 日干与时干合，日支与时支合
    const dayGan = '甲'
    const hourGan = '己'  // 甲己合
    const dayZhi = '子'
    const hourZhi = '丑'  // 子丑合（试试）
    const rs = makeRS(dayGan)
    const ctx = buildGeJuContext(
      { year: { gan: '丙', zhi: '寅' }, month: { gan: '丁', zhi: '卯' },
        day: { gan: dayGan, zhi: dayZhi }, hour: { gan: hourGan, zhi: hourZhi } },
      rs as any, 50, dayGan, '卯',
      { '木': 2, '火': 2, '土': 2, '金': 0, '水': 2 } as any
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `天地德合：甲己合 子丑合`
    }
  }
  
  // ===== 真从强格 =====
  else if (id === 'zhen-cong-qiang') {
    for (const element of ['木', '火', '金', '水', '土']) {
      const dayGans = gans.filter(g => GAN_ELEMENT[g] === element)
      const monthZhis = zhis.filter(z => ZHI_ELEMENT[z] === element)
      for (const dayGan of dayGans) {
        for (const monthZhi of monthZhis) {
          const rs = makeRS(dayGan)
          const fe: any = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
          fe[element] = 5
          const ctx = buildGeJuContext(
            { year: { gan: dayGan, zhi: monthZhi }, month: { gan: dayGan, zhi: monthZhi },
              day: { gan: dayGan, zhi: monthZhi }, hour: { gan: dayGan, zhi: monthZhi } },
            rs as any, 95, dayGan, monthZhi, fe
          )
          ;(ctx as any).tongGenCount = 3
          ;(ctx as any).isSeasonal = true
          ;(ctx as any).diffPartyCount = 0
          ;(ctx as any).samePartyCount = 4
          
          if (rule.condition(ctx as any)) {
            covered = true
            testCase = `真从强格：${dayGan}日 ${monthZhi}月 强度95 从强`
            break
          }
        }
        if (covered) break
      }
      if (covered) break
    }
  }
  
  // ===== 半从印格 =====
  else if (id === 'ban-cong-yin') {
    for (const dayGan of gans.slice(0, 5)) {
      const dayElement = GAN_ELEMENT[dayGan]
      // 印星是生我者
      const yinElement = dayElement === '木' ? '水' : dayElement === '火' ? '木' : dayElement === '土' ? '火' : dayElement === '金' ? '土' : '金'
      const monthZhis = zhis.filter(z => ZHI_ELEMENT[z] === yinElement)
      for (const monthZhi of monthZhis) {
        const rs = makeRS(dayGan)
        const fe: any = { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 }
        fe[yinElement] = 3
        const ctx = buildGeJuContext(
          { year: { gan: gans[2], zhi: zhis[0] }, month: { gan: gans[1], zhi: monthZhi },
            day: { gan: dayGan, zhi: zhis[3] }, hour: { gan: gans[4], zhi: zhis[5] } },
          rs as any, 20, dayGan, monthZhi, fe
        )
        ;(ctx as any).tongGenCount = 1
        ;(ctx as any).diffPartyCount = 3
        ;(ctx as any).hasTongGen = true
        
        if (rule.condition(ctx as any)) {
          covered = true
          testCase = `半从印格：${dayGan}日 ${monthZhi}月(印) 强度20`
          break
        }
      }
      if (covered) break
    }
  }
  
  // ===== 化气格（五组） =====
  else if (['jiaji-huatu', 'yigeng-huajin', 'bingxin-huashui', 'dingren-huamu', 'wugui-huahuo'].includes(id)) {
    const pairs: Record<string, [string, string, string]> = {
      'jiaji-huatu': ['甲', '己', '土'],
      'yigeng-huajin': ['乙', '庚', '金'],
      'bingxin-huashui': ['丙', '辛', '水'],
      'dingren-huamu': ['丁', '壬', '木'],
      'wugui-huahuo': ['戊', '癸', '火'],
    }
    const [g1, g2, element] = pairs[id]
    const monthZhi = zhis.find(z => ZHI_ELEMENT[z] === element) || '辰'
    const dayGan = g1
    const rs = makeRS(dayGan)
    const fe: any = { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 }
    fe[element] = 3
    const ctx = buildGeJuContext(
      { year: { gan: g2, zhi: monthZhi }, month: { gan: g2, zhi: monthZhi },
        day: { gan: dayGan, zhi: monthZhi }, hour: { gan: g2, zhi: monthZhi } },
      rs as any, 60, dayGan, monthZhi, fe
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `${rule.name}：${g1}${g2}化${element}`
    }
  }
  
  // ===== 寒命/暖命调候 =====
  else if (id === 'hanming-tiaohou' || id === 'nuanming-tiaohou') {
    const isHan = id === 'hanming-tiaohou'
    const monthZhi = isHan ? '子' : '午'
    const dayGan = isHan ? '癸' : '丙'
    const rs = makeRS(dayGan)
    const fe: any = isHan
      ? { '木': 1, '火': 0, '土': 1, '金': 2, '水': 3 }
      : { '木': 1, '火': 4, '土': 2, '金': 1, '水': 0 }
    const ctx = buildGeJuContext(
      { year: { gan: gans[2], zhi: isHan ? '亥' : '巳' }, month: { gan: gans[1], zhi: monthZhi },
        day: { gan: dayGan, zhi: isHan ? '丑' : '未' }, hour: { gan: gans[4], zhi: isHan ? '子' : '午' } },
      rs as any, 40, dayGan, monthZhi, fe
    )
    if (rule.condition(ctx as any)) {
      covered = true
      testCase = `${rule.name}：${isHan ? '冬月无火' : '夏月无水'}`
    }
  }
  
  // ===== 官杀通关 =====
  else if (id === 'guansha-tongguan') {
    for (const dayGan of gans.slice(0, 3)) {
      for (const monthZhi of zhis.slice(0, 3)) {
        const rs = makeRS(dayGan)
        const ctx = buildGeJuContext(
          { year: { gan: gans[2], zhi: zhis[0] }, month: { gan: gans[1], zhi: monthZhi },
            day: { gan: dayGan, zhi: zhis[3] }, hour: { gan: gans[4], zhi: zhis[5] } },
          rs as any, 50, dayGan, monthZhi,
          { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 } as any
        )
        if (rule.condition(ctx as any)) {
          covered = true
          testCase = `官杀通关：${dayGan}日 ${monthZhi}月`
          break
        }
      }
      if (covered) break
    }
  }
  
  // ===== 专旺格-纯 =====
  else if (id === 'zhuānwàng-gé') {
    for (const element of ['木', '火', '金', '水', '土']) {
      const dayGans = gans.filter(g => GAN_ELEMENT[g] === element)
      const monthZhis = zhis.filter(z => ZHI_ELEMENT[z] === element)
      for (const dayGan of dayGans) {
        for (const monthZhi of monthZhis) {
          const rs = makeRS(dayGan)
          const fe: any = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
          fe[element] = 4
          const ctx = buildGeJuContext(
            { year: { gan: dayGan, zhi: monthZhi }, month: { gan: dayGan, zhi: monthZhi },
              day: { gan: dayGan, zhi: monthZhi }, hour: { gan: dayGan, zhi: monthZhi } },
            rs as any, 95, dayGan, monthZhi, fe
          )
          ;(ctx as any).samePartyCount = 4
          ;(ctx as any).diffPartyCount = 0
          
          if (rule.condition(ctx as any)) {
            covered = true
            testCase = `专旺格-纯：${dayGan}日 ${element}旺极 同党4`
            break
          }
        }
        if (covered) break
      }
      if (covered) break
    }
  }
  
  results.push({ ruleId: id, ruleName: rule.name, covered, testCase })
}

// 输出
console.log('剩余41条Rule验证结果：')
console.log()

const cov = results.filter(r => r.covered)
const miss = results.filter(r => !r.covered)

console.log(`已覆盖：${cov.length}`)
console.log(`未覆盖：${miss.length}`)
console.log()

if (miss.length > 0) {
  console.log('仍未覆盖：')
  for (const r of miss) {
    console.log(`  ❌ ${r.ruleId} - ${r.ruleName}`)
  }
}

console.log()
console.log('已覆盖：')
for (const r of cov) {
  console.log(`  ✅ ${r.ruleId} - ${r.ruleName}`)
  console.log(`     ${r.testCase}`)
}
