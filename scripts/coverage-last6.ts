/**
 * 最后6条未覆盖Rule的精确构造
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

// 找一个月干十神为target的天干
function findGanForShen(dayGan: string, target: string): string {
  for (const g of gans) {
    if (getShen(dayGan, g) === target) return g
  }
  return gans[0]
}

function makeRS(dayGan: string): Record<string, string> {
  const r: Record<string, string> = {}
  for (const g of gans) r[g] = getShen(dayGan, g)
  return r
}

const remainingIds = ['qiming-congsha', 'qiming-congcai', 'guanqing-yinzhong', 'jinshen-ge', 'tiangan-shunshi', 'guansha-tongguan']

for (const id of remainingIds) {
  const rule = GEJU_RULES.find(r => r.id === id)!
  let covered = false
  let tc = ''
  
  console.log(`\n测试：${id} - ${rule.name}`)
  console.log(`condition: ${rule.condition.toString().replace(/\s+/g, ' ').slice(0, 150)}...`)
  
  // 弃命从杀
  if (id === 'qiming-congsha') {
    for (const dayGan of gans.slice(0, 5)) {
      const dayEl = GAN_ELEMENT[dayGan]
      // 官杀元素：克我者
      const guanShaEl = dayEl === '木' ? '金' : dayEl === '火' ? '水' : dayEl === '土' ? '木' : dayEl === '金' ? '火' : '土'
      const monthZhis = zhis.filter(z => ZHI_ELEMENT[z] === guanShaEl)
      for (const monthZhi of monthZhis) {
        // 月干为偏官
        const monthGan = findGanForShen(dayGan, '偏官')
        const rs = makeRS(dayGan)
        const fe: any = { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 }
        fe[guanShaEl] = 4
        
        // 找一个没有通根的日支
        for (const dayZhi of zhis) {
          if (ZHI_ELEMENT[dayZhi] === dayEl) continue  // 有通根
          
          const ctx = buildGeJuContext(
            { year: { gan: gans[2], zhi: zhis[0] }, month: { gan: monthGan, zhi: monthZhi },
              day: { gan: dayGan, zhi: dayZhi }, hour: { gan: gans[4], zhi: zhis[5] } },
            rs as any, 10, dayGan, monthZhi, fe
          )
          
          if (rule.condition(ctx as any)) {
            covered = true
            tc = `${dayGan}日 ${monthZhi}月(官杀) ${monthGan}月干(偏官) 日支${dayZhi}(无通根) 强度10`
            console.log(`✅ 命中：${tc}`)
            break
          }
        }
        if (covered) break
      }
      if (covered) break
    }
  }
  
  // 弃命从财
  else if (id === 'qiming-congcai') {
    for (const dayGan of gans.slice(0, 5)) {
      const dayEl = GAN_ELEMENT[dayGan]
      // 财元素：我克者
      const caiEl = dayEl === '木' ? '土' : dayEl === '火' ? '金' : dayEl === '土' ? '水' : dayEl === '金' ? '木' : '火'
      const monthZhis = zhis.filter(z => ZHI_ELEMENT[z] === caiEl)
      for (const monthZhi of monthZhis) {
        // 月干为偏财或正财
        for (const target of ['偏财', '正财']) {
          const monthGan = findGanForShen(dayGan, target)
          const rs = makeRS(dayGan)
          const fe: any = { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 }
          fe[caiEl] = 4
          
          for (const dayZhi of zhis) {
            if (ZHI_ELEMENT[dayZhi] === dayEl) continue
            
            const ctx = buildGeJuContext(
              { year: { gan: gans[2], zhi: zhis[0] }, month: { gan: monthGan, zhi: monthZhi },
                day: { gan: dayGan, zhi: dayZhi }, hour: { gan: gans[4], zhi: zhis[5] } },
              rs as any, 10, dayGan, monthZhi, fe
            )
            
            if (rule.condition(ctx as any)) {
              covered = true
              tc = `${dayGan}日 ${monthZhi}月(财) ${monthGan}月干(${target}) 日支${dayZhi}(无通根) 强度10`
              console.log(`✅ 命中：${tc}`)
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
  
  // 官轻印重
  else if (id === 'guanqing-yinzhong') {
    for (const dayGan of gans.slice(0, 5)) {
      for (const monthZhi of zhis.slice(0, 6)) {
        // 确保有官有印
        const monthGan = findGanForShen(dayGan, '正官')
        const rs = makeRS(dayGan)
        const ctx = buildGeJuContext(
          { year: { gan: findGanForShen(dayGan, '正印'), zhi: zhis[0] }, month: { gan: monthGan, zhi: monthZhi },
            day: { gan: dayGan, zhi: zhis[3] }, hour: { gan: findGanForShen(dayGan, '偏印'), zhi: zhis[5] } },
          rs as any, 40, dayGan, monthZhi,
          { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 } as any
        )
        
        if (rule.condition(ctx as any)) {
          covered = true
          tc = `${dayGan}日 ${monthZhi}月 强度40`
          console.log(`✅ 命中：${tc}`)
          break
        }
      }
      if (covered) break
    }
  }
  
  // 金神格
  else if (id === 'jinshen-ge') {
    // 金神日：甲己日，时柱金神（乙丑/己巳/癸酉）
    for (const dayGan of ['甲', '己']) {
      for (const hourZhi of ['酉', '丑', '巳']) {
        for (const hourGan of ['乙', '己', '癸']) {
          const rs = makeRS(dayGan)
          const ctx = buildGeJuContext(
            { year: { gan: '庚', zhi: '申' }, month: { gan: '辛', zhi: '酉' },
              day: { gan: dayGan, zhi: '午' }, hour: { gan: hourGan, zhi: hourZhi } },
            rs as any, 50, dayGan, '酉',
            { '木': 0, '火': 2, '土': 2, '金': 3, '水': 0 } as any
          )
          
          if (rule.condition(ctx as any)) {
            covered = true
            tc = `金神格：${dayGan}日 ${hourGan}${hourZhi}时 金旺`
            console.log(`✅ 命中：${tc}`)
            break
          }
        }
        if (covered) break
      }
      if (covered) break
    }
  }
  
  // 天干顺食
  else if (id === 'tiangan-shunshi') {
    // 甲乙丙丁或丙戊庚壬等，依次相生
    const sequences = [
      ['甲', '丙', '戊', '庚'],  // 木→火→土→金
      ['乙', '丁', '己', '辛'],
      ['丙', '戊', '庚', '壬'],
      ['丁', '己', '辛', '癸'],
    ]
    for (const seq of sequences) {
      const dayGan = seq[2]  // 戊
      const rs = makeRS(dayGan)
      const ctx = buildGeJuContext(
        { year: { gan: seq[0], zhi: '寅' }, month: { gan: seq[1], zhi: '卯' },
          day: { gan: seq[2], zhi: '辰' }, hour: { gan: seq[3], zhi: '巳' } },
        rs as any, 60, dayGan, '卯',
        { '木': 1, '火': 1, '土': 1, '金': 1, '水': 1 } as any
      )
      
      if (rule.condition(ctx as any)) {
        covered = true
        tc = `天干顺食：${seq.join('')} 依次相生`
        console.log(`✅ 命中：${tc}`)
        break
      }
    }
  }
  
  // 官杀通关格
  else if (id === 'guansha-tongguan') {
    for (const dayGan of gans.slice(0, 5)) {
      for (const monthZhi of zhis.slice(0, 6)) {
        const rs = makeRS(dayGan)
        const monthGan = findGanForShen(dayGan, '正官')
        const ctx = buildGeJuContext(
          { year: { gan: findGanForShen(dayGan, '偏官'), zhi: zhis[0] }, month: { gan: monthGan, zhi: monthZhi },
            day: { gan: dayGan, zhi: zhis[3] }, hour: { gan: findGanForShen(dayGan, '正印'), zhi: zhis[5] } },
          rs as any, 50, dayGan, monthZhi,
          { '木': 2, '火': 2, '土': 2, '金': 2, '水': 2 } as any
        )
        
        if (rule.condition(ctx as any)) {
          covered = true
          tc = `官杀通关：${dayGan}日 ${monthZhi}月`
          console.log(`✅ 命中：${tc}`)
          break
        }
      }
      if (covered) break
    }
  }
  
  if (!covered) {
    console.log(`❌ 未命中`)
  }
}
