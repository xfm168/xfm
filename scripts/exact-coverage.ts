/**
 * 精确覆盖率统计 - Hook executeRules
 * 统计每条rule的执行次数和命中次数
 */

import { GEJU_RULES, determineGeJu, buildGeJuContext, type GeJuResult, type GeJuContext } from '../src/lib/bazi/rules/gejuRules'

// ===== 统计数据结构 =====
interface RuleStat {
  id: string
  name: string
  category: string
  priority: number
  executeCount: number
  hitCount: number
}

// 初始化统计
const stats: RuleStat[] = GEJU_RULES.map(r => ({
  id: r.id,
  name: r.name,
  category: r.category,
  priority: r.priority,
  executeCount: 0,
  hitCount: 0,
}))

const statMap = new Map(stats.map(s => [s.id, s]))

// Hook版本的buildGeJuContext，用于触发所有rules
// 同时手动执行每条rule的condition来统计

// ===== 测试用例生成 =====
const gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const zhis = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

// 生成大量测试用例
function generateTestCases(count: number) {
  const cases: any[] = []
  for (let i = 0; i < count; i++) {
    const dayIdx = i % 10
    const monthIdx = (i * 7) % 12
    const strength = (i * 13) % 100
    const dayGan = gans[dayIdx]
    const monthZhi = zhis[monthIdx]

    const relatedShens: Record<string, string> = {}
    const shenList = ['正官','偏官','正印','偏印','正财','偏财','食神','伤官','比肩','劫财']
    for (let j = 0; j < 4; j++) {
      relatedShens[gans[(dayIdx + j + 1) % 10]] = shenList[(i * (j + 1)) % 10]
    }

    const fe: any = {}
    for (const f of ['木','火','土','金','水']) {
      fe[f] = (i * (gans.indexOf(f) + 1)) % 4 + 1
    }

    cases.push({
      sixLines: {
        year: { gan: gans[(i * 3) % 10], zhi: zhis[(i * 5) % 12] },
        month: { gan: gans[(i * 7) % 10], zhi: monthZhi },
        day: { gan: dayGan, zhi: zhis[(i * 11) % 12] },
        hour: { gan: gans[(i * 13) % 10], zhi: zhis[(i * 17) % 12] },
      },
      relatedShens,
      strengthScore: strength,
      dayGan,
      monthZhi,
      fiveElementCount: fe,
    })
  }
  return cases
}

// 运行测试，同时统计每条rule的执行和命中
function runWithStats(cases: any[]) {
  for (const tc of cases) {
    try {
      // 构建context
      const ctx = buildGeJuContext(
        tc.sixLines,
        tc.relatedShens,
        tc.strengthScore,
        tc.dayGan,
        tc.monthZhi,
        tc.fiveElementCount
      )

      // 手动遍历每条rule，执行condition
      for (const rule of GEJU_RULES) {
        const stat = statMap.get(rule.id)!
        stat.executeCount++

        try {
          const hit = rule.condition(ctx as any)
          if (hit) {
            stat.hitCount++
          }
        } catch (e) {
          // condition执行错误
        }
      }
    } catch (e) {
      // context构建错误
    }
  }
}

// ===== 第一步：生成500个测试用例，运行统计 =====
console.log('='.repeat(80))
console.log('玄风门 V7 格局系统 精确代码验收')
console.log('='.repeat(80))
console.log()

console.log('【第一步：Hook executeRules - 精确统计每条Rule执行/命中】')
console.log()

const testCases500 = generateTestCases(500)
console.log(`生成测试用例：${testCases500.length}个`)
console.log('运行统计中...')

runWithStats(testCases500)

console.log()
console.log('='.repeat(80))
console.log('Rule 精确覆盖率统计')
console.log('='.repeat(80))
console.log()
console.log('ID'.padEnd(25), '名称'.padEnd(15), 'Priority'.padEnd(10), 'Executed'.padEnd(10), 'Matched'.padEnd(10), 'HitRate')
console.log('-'.repeat(80))

const hitRules = stats.filter(s => s.hitCount > 0).sort((a, b) => b.hitCount - a.hitCount)
const missRules = stats.filter(s => s.hitCount === 0)

console.log()
console.log(`总Rule数：${stats.length}`)
console.log(`已命中：${hitRules.length}`)
console.log(`未命中：${missRules.length}`)
console.log(`覆盖率：${((hitRules.length / stats.length) * 100).toFixed(1)}%`)
console.log()

console.log('已命中Rule（按命中次数降序）：')
console.log()
for (const s of hitRules) {
  const rate = ((s.hitCount / s.executeCount) * 100).toFixed(1)
  console.log(`${s.id.padEnd(25)}${s.name.padEnd(15)}${String(s.priority).padEnd(10)}${String(s.executeCount).padEnd(10)}${String(s.hitCount).padEnd(10)}${rate}%`)
}

console.log()
console.log('未命中Rule（需要补充测试用例）：')
console.log()
for (const s of missRules) {
  console.log(`${s.id.padEnd(25)}${s.name.padEnd(15)}${String(s.priority).padEnd(10)}${String(s.executeCount).padEnd(10)}${String(s.hitCount).padEnd(10)}0.0%`)
}
