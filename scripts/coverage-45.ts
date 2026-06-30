/**
 * 45条未覆盖规则 - 逐条精准构造
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

const BRANCH_CANG_GAN: Record<string, string[]> = {
  '子': ['癸'], '丑': ['己', '辛', '癸'], '寅': ['甲', '丙', '戊'],
  '卯': ['乙'], '辰': ['戊', '乙', '癸'], '巳': ['丙', '庚', '戊'],
  '午': ['丁', '己'], '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'],
  '酉': ['辛'], '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲'],
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

function getDayGanByElement(el: string, yang: boolean): string {
  const map: Record<string, [string,string]> = {
    '木': ['甲','乙'], '火': ['丙','丁'], '土': ['戊','己'], '金': ['庚','辛'], '水': ['壬','癸']
  }
  return yang ? map[el][0] : map[el][1]
}

function getZhiByElement(el: string): string[] {
  return zhis.filter(z => ZHI_ELEMENT[z] === el)
}

function zhiHasElement(zhi: string, el: string): boolean {
  const cangs = BRANCH_CANG_GAN[zhi] || []
  return cangs.some(g => GAN_ELEMENT[g] === el)
}

function findGanForShen(dayGan: string, target: string): string {
  for (const g of gans) {
    if (getShen(dayGan, g) === target) return g
  }
  return gans[0]
}

// ========= 逐个构造测试 =========
const uncovered = [
  'quzhi-ge', 'yanshang-ge', 'jiase-ge', 'congge-ge', 'runxia-ge',
  'qiming-congsha', 'qiming-congcai', 'zhengyin-shangge',
  'zhengcai-shangge', 'piancai-shangge',
  'zhengguan-poge-guanke', 'zhengguan-poge-qisya',
  'qisha-poge-wuzhi', 'qisha-poge-yinshang',
  'cai-poge-jiecai', 'yin-poge-caixin',
  'shishen-poge-xiaoshen', 'shishen-poge-shangguan',
  'shangguan-poge-guansha',
  'guanyin-xiangsheng', 'guansha-hunza', 'guanqing-yinzhong',
  'tianyuan-yiqi', 'diyuan-yiqi',
  'shishen-zhisha', 'yinlai-shasheng', 'shangguan-jianguan', 'xiaoshen-duoshi',
  'tiangan-yiqi', 'dizhi-yiqi',
  'zhen-cong-qiang', 'jia-cong-qiang', 'ban-cong-yin', 'jia-zhuanwang',
  'jiaji-huatu', 'bingxin-huashui', 'wugui-huahuo',
  'hanming-tiaohou', 'nuanming-tiaohou', 'guansha-tongguan',
  'zhengguan-poge-hunza', 'cai-poge-hunza', 'yin-poge-hunza',
  'geju-shangdeng', 'zhuānwàng-gé',
]

for (const id of uncovered) {
  const rule = GEJU_RULES.find(r => r.id === id)
  if (!rule) {
    console.log(`❌ 找不到规则: ${id}`)
    continue
  }
  
  const condStr = rule.condition.toString()
  console.log(`\n=== ${rule.name} (${rule.id}) ===`)
  console.log(`category: ${rule.category}, priority: ${rule.priority}`)
  // console.log(`condition: ${condStr.slice(0, 200)}...`)
  
  let found = false
  
  // 1. 专旺格
  if (['曲直格','炎上格','稼穑格','从革格','润下格'].some(n => rule.name.includes(n)) || rule.id === 'zhuānwàng-gé') {
    const elMap: Record<string, string> = {
      '曲直': '木', '炎上': '火', '稼穑': '土', '从革': '金', '润下': '水', '专旺': '木'
    }
    let el = '木'
    for (const [k, v] of Object.entries(elMap)) {
      if (rule.name.includes(k)) { el = v; break }
    }
    
    for (const yang of [true, false]) {
      const dg = getDayGanByElement(el, yang)
      const monthZhis = getZhiByElement(el)
      for (const mz of monthZhis) {
        // 找3个含日主本气的地支
        const zhiWithEl = zhis.filter(z => zhiHasElement(z, el))
        if (zhiWithEl.length < 3) continue
        
        const zhi3 = zhiWithEl.slice(0, 3)
        const rs = makeRS(dg)
        const fe: any = { '木':0,'火':0,'土':0,'金':0,'水':0 }
        fe[el] = 6
        
        const ctx = buildGeJuContext(
          { year:{gan:dg, zhi:zhi3[0]}, month:{gan:dg, zhi:mz},
            day:{gan:dg, zhi:zhi3[1]}, hour:{gan:dg, zhi:zhi3[2]} },
          rs as any, 90, dg, mz, fe as any
        )
        
        if (rule.condition(ctx as any)) {
          console.log(`✅ 命中: ${dg}日 ${mz}月 强度90 通根${ctx.tongGenCount} 得令:${ctx.isSeasonal}`)
          found = true
          break
        }
      }
      if (found) break
    }
  }
  
  // 2. 弃命从杀/从财
  if (!found && (rule.id === 'qiming-congsha' || rule.id === 'qiming-congcai')) {
    const target = rule.id === 'qiming-congsha' ? '杀' : '财'
    for (const dg of gans) {
      for (const mz of zhis) {
        const dayEl = GAN_ELEMENT[dg]
        const monthEl = ZHI_ELEMENT[mz]
        if (monthEl === dayEl) continue
        
        const rs = makeRS(dg)
        // 找月干十神
        const mg = findGanForShen(dg, target === '杀' ? '偏官' : '正财')
        
        // 多几个异党天干
        const diffGans = gans.filter(g => {
          const s = getShen(dg, g)
          return s !== '比肩' && s !== '劫财' && s !== '偏印' && s !== '正印'
        })
        
        if (diffGans.length < 3) continue
        
        const ctx = buildGeJuContext(
          { year:{gan:diffGans[0], zhi:mz}, month:{gan:mg, zhi:mz},
            day:{gan:dg, zhi:zhis[0]}, hour:{gan:diffGans[1], zhi:zhis[1]} },
          rs as any, 5, dg, mz,
          { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
        )
        
        if (rule.condition(ctx as any)) {
          console.log(`✅ 命中: ${dg}日 ${mg}月干 ${mz}月 强度5`)
          found = true
          break
        }
      }
      if (found) break
    }
  }
  
  // 3. 上格
  if (!found && rule.name.includes('上格')) {
    const shenMap: Record<string, string> = {
      '正印': '正印', '正财': '正财', '偏财': '偏财'
    }
    for (const [shenName, shen] of Object.entries(shenMap)) {
      if (rule.name.includes(shenName)) {
        for (const dg of gans.slice(0, 5)) {
          const mg = findGanForShen(dg, shen)
          for (const mz of zhis) {
            const rs = makeRS(dg)
            const fe: any = { '木':1,'火':1,'土':1,'金':1,'水':1 }
            fe[ZHI_ELEMENT[mz]] = 2
            
            const ctx = buildGeJuContext(
              { year:{gan:findGanForShen(dg,'偏印'),zhi:zhis[0]}, month:{gan:mg,zhi:mz},
                day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'比肩'),zhi:zhis[5]} },
              rs as any, 70, dg, mz, fe as any
            )
            
            if (rule.condition(ctx as any)) {
              console.log(`✅ 命中: ${dg}日 ${mg}月干(${shen}) ${mz}月 强度70`)
              found = true
              break
            }
          }
          if (found) break
        }
      }
    }
  }
  
  // 4. 破格系列
  if (!found && rule.category === '破格') {
    const name = rule.name
    
    // 正官破格-官被克: 需要伤官
    if (name.includes('官被克')) {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '正官')
        const shangGan = findGanForShen(dg, '伤官')
        for (const mz of zhis.slice(0,6)) {
          const rs = makeRS(dg)
          const ctx = buildGeJuContext(
            { year:{gan:shangGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'正印'),zhi:zhis[5]} },
            rs as any, 40, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(正官) ${shangGan}年干(伤官) ${mz}月 强度40`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    // 正官破格-七杀混杂 / 官杀混杂
    if (!found && (name.includes('七杀混杂') || name.includes('官杀混杂') || name.includes('官杀混'))) {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '正官')
        const qiShaGan = findGanForShen(dg, '偏官')
        for (const mz of zhis.slice(0,6)) {
          const rs = makeRS(dg)
          const ctx = buildGeJuContext(
            { year:{gan:qiShaGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'正印'),zhi:zhis[5]} },
            rs as any, 50, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(正官) ${qiShaGan}年干(七杀) ${mz}月`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    // 七杀破格-无制
    if (!found && name.includes('无制')) {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '偏官')
        for (const mz of zhis.slice(0,6)) {
          if (ZHI_ELEMENT[mz] === GAN_ELEMENT[dg]) continue
          const rs = makeRS(dg)
          // 确保无制：无食神伤官
          const noZhiGans = gans.filter(g => {
            const s = getShen(dg, g)
            return s !== '食神' && s !== '伤官'
          })
          const ctx = buildGeJuContext(
            { year:{gan:noZhiGans[2],zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:noZhiGans[4],zhi:zhis[5]} },
            rs as any, 30, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(偏官) ${mz}月 强度30`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    // 七杀破格-印被财破
    if (!found && name.includes('印被财破')) {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '偏官')
        const caiGan = findGanForShen(dg, '正财')
        for (const mz of zhis.slice(0,6)) {
          const rs = makeRS(dg)
          const ctx = buildGeJuContext(
            { year:{gan:caiGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'正印'),zhi:zhis[5]} },
            rs as any, 40, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(偏官) ${caiGan}年干(财) ${mz}月`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    // 财格破格-劫财分财
    if (!found && name.includes('劫财分财')) {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '正财')
        const jieGan = findGanForShen(dg, '劫财')
        for (const mz of zhis.slice(0,6)) {
          const rs = makeRS(dg)
          const ctx = buildGeJuContext(
            { year:{gan:jieGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'正官'),zhi:zhis[5]} },
            rs as any, 45, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(正财) ${jieGan}年干(劫财) ${mz}月`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    // 印格破格-财星破印
    if (!found && name.includes('财星破印')) {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '正印')
        const caiGan = findGanForShen(dg, '正财')
        for (const mz of zhis.slice(0,6)) {
          const rs = makeRS(dg)
          const ctx = buildGeJuContext(
            { year:{gan:caiGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'正官'),zhi:zhis[5]} },
            rs as any, 45, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(正印) ${caiGan}年干(财) ${mz}月`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    // 食神破格-枭神夺食
    if (!found && name.includes('枭神夺食')) {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '食神')
        const xiaoGan = findGanForShen(dg, '偏印')
        for (const mz of zhis.slice(0,6)) {
          const rs = makeRS(dg)
          const ctx = buildGeJuContext(
            { year:{gan:xiaoGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'正财'),zhi:zhis[5]} },
            rs as any, 40, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(食神) ${xiaoGan}年干(偏印) ${mz}月`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    // 食神破格-伤官见官
    if (!found && name.includes('伤官见官') && rule.category === '破格') {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '食神')
        const shangGan = findGanForShen(dg, '伤官')
        const guanGan = findGanForShen(dg, '正官')
        for (const mz of zhis.slice(0,6)) {
          const rs = makeRS(dg)
          const ctx = buildGeJuContext(
            { year:{gan:guanGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:shangGan,zhi:zhis[5]} },
            rs as any, 45, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(食神) ${guanGan}年干(官) ${shangGan}时干(伤)`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    // 伤官破格-无财通关
    if (!found && name.includes('无财通关')) {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '伤官')
        for (const mz of zhis.slice(0,6)) {
          const rs = makeRS(dg)
          const noCaiGans = gans.filter(g => {
            const s = getShen(dg, g)
            return s !== '正财' && s !== '偏财'
          })
          const ctx = buildGeJuContext(
            { year:{gan:noCaiGans[2],zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:noCaiGans[4],zhi:zhis[5]} },
            rs as any, 40, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(伤官) ${mz}月 无财`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    // 财格破格-财星混杂
    if (!found && name.includes('财星混杂')) {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '正财')
        const pianCaiGan = findGanForShen(dg, '偏财')
        for (const mz of zhis.slice(0,6)) {
          const rs = makeRS(dg)
          const ctx = buildGeJuContext(
            { year:{gan:pianCaiGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'正官'),zhi:zhis[5]} },
            rs as any, 45, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(正财) ${pianCaiGan}年干(偏财) ${mz}月`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
    
    // 印格破格-印星混杂
    if (!found && name.includes('印星混杂')) {
      for (const dg of gans.slice(0,3)) {
        const mg = findGanForShen(dg, '正印')
        const pianYinGan = findGanForShen(dg, '偏印')
        for (const mz of zhis.slice(0,6)) {
          const rs = makeRS(dg)
          const ctx = buildGeJuContext(
            { year:{gan:pianYinGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'正官'),zhi:zhis[5]} },
            rs as any, 45, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干(正印) ${pianYinGan}年干(偏印) ${mz}月`)
            found = true
            break
          }
        }
        if (found) break
      }
    }
  }
  
  // 5. 官印相生 / 官轻印重 / 食神制杀 / 印赖杀生 / 伤官见官 / 枭神夺食 / 财官相生(已有)
  if (!found && (rule.id === 'guanyin-xiangsheng' || rule.id === 'guanqing-yinzhong' || rule.id === 'shishen-zhisha' || rule.id === 'yinlai-shasheng' || rule.id === 'shangguan-jianguan' || rule.id === 'xiaoshen-duoshi' || rule.id === 'guansha-hunza')) {
    for (const dg of gans.slice(0, 5)) {
      for (const mz of zhis.slice(0, 6)) {
        const rs = makeRS(dg)
        // 测试多个强度值
        for (const strength of [20, 40, 60, 80]) {
          const fe: any = { '木':1,'火':1,'土':1,'金':1,'水':1 }
          fe[ZHI_ELEMENT[mz]] = 2
          
          // 官+印的组合
          const guanGan = findGanForShen(dg, '正官')
          const yinGan = findGanForShen(dg, '正印')
          const pianYinGan = findGanForShen(dg, '偏印')
          const qiShaGan = findGanForShen(dg, '偏官')
          const shiShenGan = findGanForShen(dg, '食神')
          const shangGan = findGanForShen(dg, '伤官')
          const caiGan = findGanForShen(dg, '正财')
          
          const combos: [string, string, string][] = [
            [guanGan, yinGan, '官+印'],
            [guanGan, pianYinGan, '官+偏印'],
            [guanGan, qiShaGan, '官+杀'],
            [qiShaGan, yinGan, '杀+印'],
            [shiShenGan, qiShaGan, '食+杀'],
            [shangGan, guanGan, '伤+官'],
            [pianYinGan, shiShenGan, '偏印+食'],
            [caiGan, yinGan, '财+印'],
          ]
          
          for (const [yg, hg, desc] of combos) {
            const ctx = buildGeJuContext(
              { year:{gan:yg, zhi:zhis[0]}, month:{gan:guanGan, zhi:mz},
                day:{gan:dg, zhi:zhis[3]}, hour:{gan:hg, zhi:zhis[5]} },
              rs as any, strength, dg, mz, fe as any
            )
            if (rule.condition(ctx as any)) {
              console.log(`✅ 命中: ${dg}日 ${mz}月 强度${strength} 组合:${desc}`)
              found = true
              break
            }
          }
          if (found) break
        }
        if (found) break
      }
      if (found) break
    }
  }
  
  // 6. 天元一气 / 天干一气 / 地元一气 / 地支一气
  if (!found && (rule.id === 'tianyuan-yiqi' || rule.id === 'tiangan-yiqi' || rule.id === 'diyuan-yiqi' || rule.id === 'dizhi-yiqi')) {
    const isTian = rule.id.includes('tian') || rule.id.includes('tiangan')
    for (const dg of gans.slice(0, 5)) {
      let sameGanG: string
      if (isTian) {
        sameGanG = dg
      } else {
        sameGanG = gans[0]
      }
      
      for (const z of zhis.slice(0, 4)) {
        const rs = makeRS(dg)
        if (isTian) {
          for (const g of gans) rs[g] = '比肩'
        }
        
        const zhiArr = isTian ? [z, z, z, z] : [zhis[0], zhis[1], zhis[2], zhis[3]]
        const ganArr = isTian ? [dg, dg, dg, dg] : [gans[0], gans[1], dg, gans[3]]
        
        const ctx = buildGeJuContext(
          { year:{gan:ganArr[0], zhi:zhiArr[0]}, month:{gan:ganArr[1], zhi:zhiArr[1]},
            day:{gan:dg, zhi:zhiArr[2]}, hour:{gan:ganArr[3], zhi:zhiArr[3]} },
          rs as any, 50, dg, z, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
        )
        if (rule.condition(ctx as any)) {
          console.log(`✅ 命中: ${isTian ? '四天干同' + dg : '四地支同'}`)
          found = true
          break
        }
      }
      if (found) break
    }
  }
  
  // 7. 从强格 / 半从印 / 假专旺
  if (!found && (['zhen-cong-qiang','jia-cong-qiang','ban-cong-yin','jia-zhuanwang'].includes(rule.id))) {
    for (const el of ['木','火','土','金','水']) {
      for (const yang of [true, false]) {
        const dg = getDayGanByElement(el, yang)
        const monthZhis = getZhiByElement(el)
        for (const mz of monthZhis) {
          const rs = makeRS(dg)
          const fe: any = { '木':0,'火':0,'土':0,'金':0,'水':0 }
          fe[el] = 5
          
          for (const strength of [60, 70, 80, 90]) {
            const zhiWithEl = zhis.filter(z => zhiHasElement(z, el))
            const ctx = buildGeJuContext(
              { year:{gan:dg, zhi:zhiWithEl[0]||zhis[0]}, month:{gan:dg, zhi:mz},
                day:{gan:dg, zhi:zhiWithEl[1]||zhis[1]}, hour:{gan:gans[2], zhi:zhiWithEl[2]||zhis[2]} },
              rs as any, strength, dg, mz, fe as any
            )
            if (rule.condition(ctx as any)) {
              console.log(`✅ 命中: ${dg}日 ${mz}月 强度${strength}`)
              found = true
              break
            }
          }
          if (found) break
        }
        if (found) break
      }
      if (found) break
    }
  }
  
  // 8. 化气格
  if (!found && (rule.id === 'jiaji-huatu' || rule.id === 'bingxin-huashui' || rule.id === 'wugui-huahuo')) {
    const pairs: Record<string, [string,string,string]> = {
      'jiaji': ['甲','己','土'], 'bingxin': ['丙','辛','水'], 'wugui': ['戊','癸','火'],
    }
    for (const [key, [g1, g2, el]] of Object.entries(pairs)) {
      if (rule.id.includes(key.replace('-', ''))) {
        const dg = g1
        const rs = makeRS(dg)
        // 找月支对应元素
        const mz = zhis.find(z => ZHI_ELEMENT[z] === el) || '辰'
        const fe: any = { '木':0,'火':0,'土':0,'金':0,'水':0 }
        fe[el] = 4
        
        for (const strength of [30, 50, 70]) {
          const ctx = buildGeJuContext(
            { year:{gan:g2, zhi:mz}, month:{gan:g2, zhi:mz},
              day:{gan:dg, zhi:mz}, hour:{gan:g2, zhi:mz} },
            rs as any, strength, dg, mz, fe as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${g2}月干 ${mz}月 化${el} 强度${strength}`)
            found = true
            break
          }
        }
      }
    }
  }
  
  // 9. 调候格
  if (!found && (rule.id === 'hanming-tiaohou' || rule.id === 'nuanming-tiaohou')) {
    const isHan = rule.id.includes('hanming')
    const dg = isHan ? '癸' : '丙'
    const mz = isHan ? '子' : '午'
    const rs = makeRS(dg)
    const fe: any = { '木':1,'火':0,'土':1,'金':2,'水':3 }
    if (!isHan) { fe['火'] = 4; fe['水'] = 0; fe['土'] = 2 }
    
    for (const strength of [20, 40]) {
      const ctx = buildGeJuContext(
        { year:{gan:gans[0],zhi:'亥'}, month:{gan:gans[1],zhi:mz},
          day:{gan:dg,zhi:isHan?'丑':'未'}, hour:{gan:gans[3],zhi:isHan?'子':'午'} },
        rs as any, strength, dg, mz, fe as any
      )
      if (rule.condition(ctx as any)) {
        console.log(`✅ 命中: ${dg}日 ${mz}月 强度${strength} ${isHan?'寒':'暖'}`)
        found = true
        break
      }
    }
  }
  
  // 10. 官杀通关
  if (!found && rule.id === 'guansha-tongguan') {
    for (const dg of gans.slice(0,3)) {
      const mg = findGanForShen(dg, '正官')
      const qiShaGan = findGanForShen(dg, '偏官')
      for (const mz of zhis.slice(0,6)) {
        const rs = makeRS(dg)
        const ctx = buildGeJuContext(
          { year:{gan:qiShaGan,zhi:zhis[0]}, month:{gan:mg,zhi:mz},
            day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'正印'),zhi:zhis[5]} },
          rs as any, 45, dg, mz, { '木':1,'火':1,'土':1,'金':1,'水':1 } as any
        )
        if (rule.condition(ctx as any)) {
          console.log(`✅ 命中: ${dg}日 ${mg}月干(正官) ${qiShaGan}年干(七杀) ${mz}月`)
          found = true
          break
        }
      }
      if (found) break
    }
  }
  
  // 11. 格局上等
  if (!found && rule.id === 'geju-shangdeng') {
    for (const dg of gans.slice(0,3)) {
      const mg = findGanForShen(dg, '正官')
      for (const mz of zhis.slice(0,6)) {
        const rs = makeRS(dg)
        for (const strength of [50, 60, 70, 80]) {
          const fe: any = { '木':1,'火':1,'土':1,'金':1,'水':1 }
          fe[ZHI_ELEMENT[mz]] = 2
          const ctx = buildGeJuContext(
            { year:{gan:findGanForShen(dg,'正印'),zhi:zhis[0]}, month:{gan:mg,zhi:mz},
              day:{gan:dg,zhi:zhis[3]}, hour:{gan:findGanForShen(dg,'正财'),zhi:zhis[5]} },
            rs as any, strength, dg, mz, fe as any
          )
          if (rule.condition(ctx as any)) {
            console.log(`✅ 命中: ${dg}日 ${mg}月干 ${mz}月 强度${strength}`)
            found = true
            break
          }
        }
        if (found) break
      }
      if (found) break
    }
  }
  
  if (!found) {
    console.log(`❌ 未命中 - condition: ${condStr.slice(0, 300)}`)
  }
}
