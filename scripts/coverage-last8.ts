/**
 * 最后8条 - 精准构造
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

function findGanForShen(dayGan: string, target: string): string {
  for (const g of gans) {
    if (getShen(dayGan, g) === target) return g
  }
  return gans[0]
}

function testRule(id: string, builder: () => any | null): boolean {
  const rule = GEJU_RULES.find(r => r.id === id)!
  const result = builder()
  if (result && rule.condition(result.ctx as any)) {
    console.log(`✅ ${rule.name}: ${result.desc}`)
    return true
  }
  console.log(`❌ ${rule.name}: 未命中`)
  return false
}

console.log('=== 最后8条 ===\n')

// 1. 正印上格: monthGanShen===正印 + hasGuan + tongGenCount>=1
testRule('zhengyin-shangge', () => {
  for (const dg of gans.slice(0, 5)) {
    const mg = findGanForShen(dg, '正印')
    const guanGan = findGanForShen(dg, '正官')
    for (const mz of zhis) {
      // 确保通根：找一个含日主本气的地支
      const rs = makeRS(dg)
      // 选一个日支有通根的
      for (const dz of zhis) {
        const ctx = buildGeJuContext(
          { year:{gan:guanGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
            day:{gan:dg,zhi:dz}, hour:{gan:findGanForShen(dg,'比肩'),zhi:zhis[5]} },
          rs as any, 50, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
        )
        if (ctx.tongGenCount >= 1) {
          const rule = GEJU_RULES.find(r => r.id === 'zhengyin-shangge')!
          if (rule.condition(ctx as any)) {
            return { ctx, desc: `${dg}日 ${mg}月干(正印) ${guanGan}年干(正官) 通根${ctx.tongGenCount}` }
          }
        }
      }
    }
  }
  return null
})

// 2. 正财上格: monthGanShen===正财 + hasGuan + tongGenCount>=1
testRule('zhengcai-shangge', () => {
  for (const dg of gans.slice(0, 5)) {
    const mg = findGanForShen(dg, '正财')
    const guanGan = findGanForShen(dg, '正官')
    for (const mz of zhis) {
      const rs = makeRS(dg)
      for (const dz of zhis) {
        const ctx = buildGeJuContext(
          { year:{gan:guanGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
            day:{gan:dg,zhi:dz}, hour:{gan:findGanForShen(dg,'比肩'),zhi:zhis[5]} },
          rs as any, 50, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
        )
        if (ctx.tongGenCount >= 1) {
          const rule = GEJU_RULES.find(r => r.id === 'zhengcai-shangge')!
          if (rule.condition(ctx as any)) {
            return { ctx, desc: `${dg}日 ${mg}月干(正财) ${guanGan}年干(正官) 通根${ctx.tongGenCount}` }
          }
        }
      }
    }
  }
  return null
})

// 3. 偏财上格: monthGanShen===偏财 + hasShi + tongGenCount>=1
testRule('piancai-shangge', () => {
  for (const dg of gans.slice(0, 5)) {
    const mg = findGanForShen(dg, '偏财')
    const shiGan = findGanForShen(dg, '食神')
    for (const mz of zhis) {
      const rs = makeRS(dg)
      for (const dz of zhis) {
        const ctx = buildGeJuContext(
          { year:{gan:shiGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
            day:{gan:dg,zhi:dz}, hour:{gan:findGanForShen(dg,'比肩'),zhi:zhis[5]} },
          rs as any, 50, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
        )
        if (ctx.tongGenCount >= 1) {
          const rule = GEJU_RULES.find(r => r.id === 'piancai-shangge')!
          if (rule.condition(ctx as any)) {
            return { ctx, desc: `${dg}日 ${mg}月干(偏财) ${shiGan}年干(食神) 通根${ctx.tongGenCount}` }
          }
        }
      }
    }
  }
  return null
})

// 4. 官轻印重: monthGanShen===正官 + yinCount>=2 + strengthScore>60
testRule('guanqing-yinzhong', () => {
  for (const dg of gans.slice(0, 3)) {
    const mg = findGanForShen(dg, '正官')
    const zhengYinGan = findGanForShen(dg, '正印')
    const pianYinGan = findGanForShen(dg, '偏印')
    for (const mz of zhis.slice(0, 6)) {
      const rs = makeRS(dg)
      const ctx = buildGeJuContext(
        { year:{gan:zhengYinGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
          day:{gan:dg,zhi:zhis[3]}, hour:{gan:pianYinGan,zhi:zhis[5]} },
        rs as any, 65, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
      )
      const rule = GEJU_RULES.find(r => r.id === 'guanqing-yinzhong')!
      if (rule.condition(ctx as any)) {
        return { ctx, desc: `${dg}日 ${mg}月干(正官) 印星2个 强度65` }
      }
    }
  }
  return null
})

// 5. 地元一气: 四地支相同
testRule('diyuan-yiqi', () => {
  const dg = '甲'
  const rs = makeRS(dg)
  for (const z of zhis.slice(0, 6)) {
    const ctx = buildGeJuContext(
      { year:{gan:'甲',zhi:z}, month:{gan:'乙',zhi:z},
        day:{gan:dg,zhi:z}, hour:{gan:'丁',zhi:z} },
      rs as any, 50, dg, z, { '木':2,'火':1,'土':1,'金':1,'水':1 } as any
    )
    const rule = GEJU_RULES.find(r => r.id === 'diyuan-yiqi')!
    if (rule.condition(ctx as any)) {
      return { ctx, desc: `四地支同${z}` }
    }
  }
  return null
})

// 6. 地支一气: 四地支相同
testRule('dizhi-yiqi', () => {
  const dg = '甲'
  const rs = makeRS(dg)
  for (const z of zhis.slice(0, 6)) {
    const ctx = buildGeJuContext(
      { year:{gan:'甲',zhi:z}, month:{gan:'乙',zhi:z},
        day:{gan:dg,zhi:z}, hour:{gan:'丁',zhi:z} },
      rs as any, 50, dg, z, { '木':2,'火':1,'土':1,'金':1,'水':1 } as any
    )
    const rule = GEJU_RULES.find(r => r.id === 'dizhi-yiqi')!
    if (rule.condition(ctx as any)) {
      return { ctx, desc: `四地支同${z}` }
    }
  }
  return null
})

// 7. 印赖杀生: hasYin + hasSha + monthGanShen是印
testRule('yinlai-shasheng', () => {
  for (const dg of gans.slice(0, 5)) {
    const mg = findGanForShen(dg, '正印')
    const shaGan = findGanForShen(dg, '偏官')
    for (const mz of zhis.slice(0, 6)) {
      const rs = makeRS(dg)
      const ctx = buildGeJuContext(
        { year:{gan:shaGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
          day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'比肩'),zhi:zhis[5]} },
        rs as any, 50, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
      )
      const rule = GEJU_RULES.find(r => r.id === 'yinlai-shasheng')!
      if (rule.condition(ctx as any)) {
        return { ctx, desc: `${dg}日 ${mg}月干(正印) ${shaGan}年干(七杀)` }
      }
    }
  }
  return null
})

// 8. 半从印格: monthElement===印星元素 + strength 18-25 + 通根1-2 + 异党>=3
testRule('ban-cong-yin', () => {
  // 印星元素 = 生我者 = BE_GENERATE[dayElement]
  // 如甲木的印星元素是水（水生木）
  const GEN: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const BE_GENERATE: Record<string, string> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' }
  
  for (const dg of gans.slice(0, 5)) {
    const dayEl = GAN_ELEMENT[dg]
    const yinEl = BE_GENERATE[dayEl]
    const yinMonthZhi = zhis.filter(z => ZHI_ELEMENT[z] === yinEl)
    
    for (const mz of yinMonthZhi) {
      const rs = makeRS(dg)
      // 异党>=3：天干中3个不是印也不是比劫
      // 异党 = 克我/我克/我生 的天干
      const diffGans = gans.filter(g => {
        const s = getShen(dg, g)
        return s !== '比肩' && s !== '劫财' && s !== '正印' && s !== '偏印'
      })
      
      if (diffGans.length < 3) continue
      
      for (const strength of [18, 20, 22, 24]) {
        const ctx = buildGeJuContext(
          { year:{gan:diffGans[0],zhi:zhis[0]}, month:{gan:diffGans[1],zhi:mz},
            day:{gan:dg,zhi:zhis[3]}, hour:{gan:diffGans[2],zhi:zhis[5]} },
          rs as any, strength, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
        )
        
        if (ctx.tongGenCount >= 1 && ctx.tongGenCount <= 2 && ctx.diffPartyCount >= 3) {
          const rule = GEJU_RULES.find(r => r.id === 'ban-cong-yin')!
          if (rule.condition(ctx as any)) {
            return { ctx, desc: `${dg}日 ${mz}月(${yinEl}印月) 强度${strength} 通根${ctx.tongGenCount} 异党${ctx.diffPartyCount}` }
          }
        }
      }
    }
  }
  return null
})

// 9. 格局上等: strength 35-65 + touGanCount>=3 + tongGenCount>=2 + sameParty>diffParty
testRule('geju-shangdeng', () => {
  for (const dg of gans.slice(0, 3)) {
    const dayEl = GAN_ELEMENT[dg]
    // 找透干多的：天干中与日主同元素的多
    const sameElGans = gans.filter(g => GAN_ELEMENT[g] === dayEl)
    // 同党 = 日主同元素 + 生我者
    const genEl = (() => {
      const map: Record<string, string> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' }
      return map[dayEl]
    })()
    const genElGans = gans.filter(g => GAN_ELEMENT[g] === genEl)
    
    // 选3个同元素的天干放年、月、时（日干本身算一个）
    const yearGan = sameElGans[1 % sameElGans.length]
    const monthGan = genElGans[0]  // 印星 = 同党
    const hourGan = sameElGans[2 % sameElGans.length]
    
    // 月支：找有日主本气的 + 通根
    const zhiWithDayEl = zhis.filter(z => {
      const cangs: Record<string, string[]> = {
        '子': ['癸'], '丑': ['己', '辛', '癸'], '寅': ['甲', '丙', '戊'],
        '卯': ['乙'], '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'],
        '午': ['丁', '己'], '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'],
        '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲'],
      }
      return cangs[z]?.some(g => GAN_ELEMENT[g] === dayEl)
    })
    
    const rs = makeRS(dg)
    
    for (const mz of zhiWithDayEl) {
      for (const dz of zhiWithDayEl) {
        for (const yz of zhiWithDayEl.slice(0, 1)) {
          for (const strength of [35, 45, 55, 65]) {
            const fe: any = { '木':1,'火':1,'土':1,'金':1,'水':1 }
            fe[dayEl] = 3
            const ctx = buildGeJuContext(
              { year:{gan:yearGan,zhi:yz}, month:{gan:monthGan,zhi:mz},
                day:{gan:dg,zhi:dz}, hour:{gan:hourGan,zhi:zhis[8]} },
              rs as any, strength, dg, mz, fe as any
            )
            const rule = GEJU_RULES.find(r => r.id === 'geju-shangdeng')!
            if (rule.condition(ctx as any)) {
              return { ctx, desc: `${dg}日 ${mz}月 强度${strength} 透干${ctx.touGanCount} 通根${ctx.tongGenCount} 同党${ctx.samePartyCount}>异党${ctx.diffPartyCount}` }
            }
          }
        }
      }
    }
  }
  return null
})
