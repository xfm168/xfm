/**
 * 最终覆盖率测试 - 针对每条未覆盖Rule的condition精确构造测试用例
 */

import { GEJU_RULES, determineGeJu, buildGeJuContext } from '../src/lib/bazi/rules/gejuRules'

// ===== 测试用例 =====
// 每条用例设计为精确触发特定规则
const testCases: any[] = []

const gans = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
const zhis = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

function add(name: string, dayGan: string, monthZhi: string, monthGanShen: string, 
            strengthScore: number, relatedShens: Record<string, string>,
            fe: Record<string, number>, sixLines?: any) {
  const defaultLines = {
    year: { gan: '庚', zhi: '申' },
    month: { gan: '辛', zhi: monthZhi },
    day: { gan: dayGan, zhi: '寅' },
    hour: { gan: '壬', zhi: '子' },
  }
  testCases.push({
    name,
    dayGan, monthZhi, strengthScore,
    relatedShens,
    fiveElementCount: fe,
    sixLines: sixLines || defaultLines,
  })
}

// ===== 专旺格：稼穑格 =====
// 条件：dayElement=土 + strength>=85 + isSeasonal + tongGenCount>=3
add('稼穑格', '戊', '辰', '比肩', 92,
  {'戊':'比肩','己':'劫财'},
  {木:0,火:1,土:5,金:0,水:0},
  { year: {gan:'戊',zhi:'戌'}, month: {gan:'己',zhi:'辰'}, day: {gan:'戊',zhi:'戌'}, hour: {gan:'己',zhi:'未'} }
)

// ===== 从财格 =====
// 条件：财当令 + 强度<15 + 无根 + 异党>=3
add('从财格', '甲', '辰', '偏财', 10,
  {'戊':'偏财','己':'正财'},
  {木:0,火:1,土:5,金:0,水:0},
  { year: {gan:'戊',zhi:'戌'}, month: {gan:'戊',zhi:'辰'}, day: {gan:'甲',zhi:'戌'}, hour: {gan:'己',zhi:'未'} }
)

// 弃命从财
add('弃命从财', '甲', '辰', '偏财', 5,
  {'戊':'偏财'},
  {木:0,火:1,土:5,金:0,水:0},
  { year: {gan:'戊',zhi:'戌'}, month: {gan:'戊',zhi:'辰'}, day: {gan:'甲',zhi:'戌'}, hour: {gan:'己',zhi:'未'} }
)

// ===== 从儿格 =====
add('从儿格', '甲', '巳', '食神', 10,
  {'丙':'食神','丁':'伤官'},
  {木:0,火:5,土:1,金:0,水:0},
  { year: {gan:'丙',zhi:'午'}, month: {gan:'丁',zhi:'巳'}, day: {gan:'甲',zhi:'巳'}, hour: {gan:'丙',zhi:'寅'} }
)

// ===== 从印格 =====
add('从印格', '甲', '亥', '正印', 12,
  {'壬':'正印','癸':'偏印'},
  {木:1,火:0,土:0,金:0,水:5},
  { year: {gan:'壬',zhi:'子'}, month: {gan:'癸',zhi:'亥'}, day: {gan:'甲',zhi:'亥'}, hour: {gan:'壬',zhi:'申'} }
)

// ===== 化气格 =====
add('化气格', '甲', '辰', '偏财', 50,
  {'己':'正财'},
  {木:1,火:1,土:4,金:0,水:0},
  { year: {gan:'己',zhi:'未'}, month: {gan:'甲',zhi:'辰'}, day: {gan:'甲',zhi:'辰'}, hour: {gan:'己',zhi:'丑'} }
)

// ===== 正格上格 5条 =====
add('正官上格', '甲', '酉', '正官', 52,
  {'辛':'正官','癸':'正印'},
  {木:2,火:0,土:0,金:2,水:2},
  { year: {gan:'癸',zhi:'亥'}, month: {gan:'辛',zhi:'酉'}, day: {gan:'甲',zhi:'寅'}, hour: {gan:'癸',zhi:'子'} }
)

add('正印上格', '甲', '亥', '正印', 50,
  {'壬':'正印','甲':'比肩'},
  {木:3,火:0,土:0,金:0,水:3},
  { year: {gan:'壬',zhi:'子'}, month: {gan:'壬',zhi:'亥'}, day: {gan:'甲',zhi:'子'}, hour: {gan:'甲',zhi:'寅'} }
)

add('正财上格', '甲', '辰', '偏财', 50,
  {'戊':'偏财','丙':'食神'},
  {木:2,火:2,土:2,金:0,水:0},
  { year: {gan:'戊',zhi:'辰'}, month: {gan:'丙',zhi:'辰'}, day: {gan:'甲',zhi:'寅'}, hour: {gan:'戊',zhi:'戌'} }
)

add('偏财上格', '甲', '戌', '偏财', 48,
  {'己':'正财','丁':'伤官'},
  {木:2,火:2,土:2,金:0,水:0},
  { year: {gan:'己',zhi:'未'}, month: {gan:'丁',zhi:'戌'}, day: {gan:'甲',zhi:'戌'}, hour: {gan:'己',zhi:'丑'} }
)

// ===== 官印相生 =====
// 条件：有正官 + 有正印 + 月干十神=正官
add('官印相生', '甲', '酉', '正官', 50,
  {'辛':'正官','癸':'正印'},
  {木:2,火:0,土:0,金:2,水:2},
  { year: {gan:'癸',zhi:'亥'}, month: {gan:'辛',zhi:'酉'}, day: {gan:'甲',zhi:'寅'}, hour: {gan:'癸',zhi:'子'} }
)

// ===== 官轻印重 =====
// 条件：月干正官 + 印星>=2 + 强度>60
add('官轻印重', '甲', '酉', '正官', 65,
  {'辛':'正官','壬':'正印','癸':'偏印'},
  {木:3,火:0,土:0,金:1,水:3},
  { year: {gan:'癸',zhi:'亥'}, month: {gan:'辛',zhi:'酉'}, day: {gan:'甲',zhi:'卯'}, hour: {gan:'壬',zhi:'子'} }
)

// ===== 真七杀格 =====
// 条件：月干偏官 + 有制化（印或食神） + 强度40-65
add('真七杀格', '甲', '申', '偏官', 50,
  {'庚':'偏官','壬':'偏印'},
  {木:2,火:0,土:0,金:2,水:2},
  { year: {gan:'壬',zhi:'申'}, month: {gan:'庚',zhi:'申'}, day: {gan:'甲',zhi:'寅'}, hour: {gan:'壬',zhi:'子'} }
)

// ===== 真伤官格 =====
// 条件：月干伤官 + 强度50-80 + 通根>=1
add('真伤官格', '甲', '午', '伤官', 60,
  {'丁':'伤官'},
  {木:3,火:2,土:2,金:0,水:0},
  { year: {gan:'丁',zhi:'午'}, month: {gan:'丁',zhi:'午'}, day: {gan:'甲',zhi:'卯'}, hour: {gan:'丙',zhi:'寅'} }
)

// ===== 六乙鼠贵格 =====
add('六乙鼠贵格', '乙', '子', '偏印', 45,
  {'癸':'偏印'},
  {木:2,火:0,土:1,金:1,水:2},
  { year: {gan:'癸',zhi:'亥'}, month: {gan:'丙',zhi:'子'}, day: {gan:'乙',zhi:'子'}, hour: {gan:'癸',zhi:'亥'} }
)

// ===== 六阴朝阳格 =====
add('六阴朝阳格', '辛', '子', '食神', 48,
  {'癸':'食神'},
  {木:0,火:1,土:1,金:2,水:2},
  { year: {gan:'癸',zhi:'亥'}, month: {gan:'戊',zhi:'子'}, day: {gan:'辛',zhi:'子'}, hour: {gan:'癸',zhi:'丑'} }
)

// ===== 井栏叉格 =====
add('井栏叉格', '庚', '申', '比肩', 65,
  {'庚':'比肩'},
  {木:0,火:1,土:1,金:4,水:0},
  { year: {gan:'庚',zhi:'申'}, month: {gan:'庚',zhi:'申'}, day: {gan:'庚',zhi:'申'}, hour: {gan:'壬',zhi:'子'} }
)

// ===== 天元一气 =====
add('天元一气', '甲', '子', '比肩', 55,
  {'甲':'比肩'},
  {木:4,火:0,土:0,金:0,水:0},
  { year: {gan:'甲',zhi:'子'}, month: {gan:'甲',zhi:'寅'}, day: {gan:'甲',zhi:'辰'}, hour: {gan:'甲',zhi:'午'} }
)

// ===== 水火既济 =====
add('水火既济', '壬', '午', '正财', 50,
  {'丁':'正财','丙':'偏财'},
  {木:0,火:3,土:1,金:0,水:2},
  { year: {gan:'壬',zhi:'子'}, month: {gan:'丙',zhi:'午'}, day: {gan:'壬',zhi:'亥'}, hour: {gan:'丁',zhi:'未'} }
)

// ===== 火土成慈 =====
add('火土成慈', '丙', '辰', '食神', 55,
  {'戊':'食神','己':'伤官'},
  {木:0,火:3,土:3,金:0,水:0},
  { year: {gan:'戊',zhi:'戌'}, month: {gan:'戊',zhi:'辰'}, day: {gan:'丙',zhi:'午'}, hour: {gan:'己',zhi:'未'} }
)

// ===== 食神制杀 =====
add('食神制杀', '甲', '申', '偏官', 48,
  {'庚':'偏官','丙':'食神'},
  {木:2,火:2,土:0,金:2,水:0},
  { year: {gan:'庚',zhi:'申'}, month: {gan:'庚',zhi:'申'}, day: {gan:'甲',zhi:'寅'}, hour: {gan:'丙',zhi:'寅'} }
)

// ===== 伤官佩印 =====
add('伤官佩印', '甲', '午', '伤官', 45,
  {'丁':'伤官','壬':'正印'},
  {木:2,火:2,土:0,金:0,水:2},
  { year: {gan:'壬',zhi:'子'}, month: {gan:'丁',zhi:'午'}, day: {gan:'甲',zhi:'寅'}, hour: {gan:'癸',zhi:'亥'} }
)

// ===== 四位纯全 =====
add('四位纯全', '甲', '亥', '偏印', 50,
  {'壬':'偏印'},
  {木:2,火:1,土:1,金:0,水:2},
  { year: {gan:'丙',zhi:'寅'}, month: {gan:'丁',zhi:'亥'}, day: {gan:'甲',zhi:'巳'}, hour: {gan:'庚',zhi:'申'} }
)

// ===== 两气成象 =====
add('两气成象', '甲', '卯', '劫财', 70,
  {'乙':'劫财'},
  {木:4,火:0,土:0,金:0,水:0},
  { year: {gan:'甲',zhi:'寅'}, month: {gan:'乙',zhi:'卯'}, day: {gan:'甲',zhi:'卯'}, hour: {gan:'乙',zhi:'寅'} }
)

// ===== 印赖杀生 =====
add('印赖杀生', '甲', '申', '偏官', 42,
  {'庚':'偏官','壬':'偏印'},
  {木:1,火:0,土:0,金:3,水:2},
  { year: {gan:'壬',zhi:'申'}, month: {gan:'庚',zhi:'申'}, day: {gan:'甲',zhi:'子'}, hour: {gan:'壬',zhi:'子'} }
)

// ===== 天干一气 =====
add('天干一气', '甲', '寅', '比肩', 60,
  {'甲':'比肩'},
  {木:4,火:0,土:0,金:0,水:0},
  { year: {gan:'甲',zhi:'子'}, month: {gan:'甲',zhi:'寅'}, day: {gan:'甲',zhi:'辰'}, hour: {gan:'甲',zhi:'午'} }
)

// ===== 天地德合 =====
add('天地德合', '甲', '丑', '正财', 50,
  {'己':'正财'},
  {木:2,火:1,土:2,金:1,水:0},
  { year: {gan:'己',zhi:'丑'}, month: {gan:'己',zhi:'丑'}, day: {gan:'甲',zhi:'寅'}, hour: {gan:'己',zhi:'丑'} }
)

// ===== 真从官杀格 =====
add('真从官杀格', '甲', '酉', '正官', 6,
  {'辛':'正官','庚':'偏官'},
  {木:0,火:0,土:0,金:5,水:1},
  { year: {gan:'庚',zhi:'申'}, month: {gan:'辛',zhi:'酉'}, day: {gan:'甲',zhi:'申'}, hour: {gan:'庚',zhi:'申'} }
)

// ===== 假从官杀格 =====
add('假从官杀格', '甲', '酉', '正官', 18,
  {'辛':'正官'},
  {木:1,火:0,土:0,金:4,水:1},
  { year: {gan:'辛',zhi:'酉'}, month: {gan:'辛',zhi:'酉'}, day: {gan:'甲',zhi:'子'}, hour: {gan:'庚',zhi:'申'} }
)

// ===== 真从儿格 =====
add('真从儿格', '甲', '巳', '食神', 6,
  {'丙':'食神','丁':'伤官'},
  {木:0,火:5,土:1,金:0,水:0},
  { year: {gan:'丙',zhi:'午'}, month: {gan:'丁',zhi:'巳'}, day: {gan:'甲',zhi:'巳'}, hour: {gan:'丙',zhi:'寅'} }
)

// ===== 半从格 =====
add('半从格', '甲', '申', '偏官', 28,
  {'庚':'偏官'},
  {木:2,火:0,土:0,金:3,水:1},
  { year: {gan:'庚',zhi:'申'}, month: {gan:'庚',zhi:'申'}, day: {gan:'甲',zhi:'寅'}, hour: {gan:'庚',zhi:'戌'} }
)

// ===== 从而不从格 =====
add('从而不从格', '甲', '酉', '正官', 22,
  {'辛':'正官'},
  {木:1,火:0,土:0,金:4,水:1},
  { year: {gan:'辛',zhi:'酉'}, month: {gan:'辛',zhi:'酉'}, day: {gan:'甲',zhi:'子'}, hour: {gan:'庚',zhi:'申'} }
)

// ===== 真从势格 =====
add('真从势格', '甲', '酉', '正官', 5,
  {'辛':'正官'},
  {木:0,火:1,土:0,金:4,水:1},
  { year: {gan:'辛',zhi:'酉'}, month: {gan:'庚',zhi:'申'}, day: {gan:'甲',zhi:'酉'}, hour: {gan:'庚',zhi:'午'} }
)

// ===== 半从印格 =====
add('半从印格', '甲', '亥', '正印', 20,
  {'壬':'正印','癸':'偏印'},
  {木:1,火:0,土:0,金:0,水:4},
  { year: {gan:'壬',zhi:'子'}, month: {gan:'癸',zhi:'亥'}, day: {gan:'甲',zhi:'子'}, hour: {gan:'壬',zhi:'申'} }
)

// ===== 假从印格 =====
add('假从印格', '甲', '亥', '正印', 22,
  {'壬':'正印'},
  {木:1,火:0,土:0,金:0,水:4},
  { year: {gan:'癸',zhi:'亥'}, month: {gan:'壬',zhi:'亥'}, day: {gan:'甲',zhi:'子'}, hour: {gan:'癸',zhi:'子'} }
)

// ===== 真从杀格 =====
add('真从杀格', '甲', '申', '偏官', 5,
  {'庚':'偏官'},
  {木:0,火:0,土:1,金:5,水:0},
  { year: {gan:'庚',zhi:'申'}, month: {gan:'庚',zhi:'申'}, day: {gan:'甲',zhi:'申'}, hour: {gan:'庚',zhi:'戌'} }
)

// ===== 从格破格 =====
add('从格破格', '甲', '申', '偏官', 18,
  {'庚':'偏官'},
  {木:1,火:0,土:1,金:4,水:0},
  { year: {gan:'庚',zhi:'申'}, month: {gan:'庚',zhi:'申'}, day: {gan:'甲',zhi:'申'}, hour: {gan:'甲',zhi:'寅'} }
)

// ===== 丙辛化水格 =====
add('丙辛化水格', '丙', '子', '正官', 40,
  {'辛':'正财'},
  {木:0,火:1,土:0,金:2,水:3},
  { year: {gan:'辛',zhi:'亥'}, month: {gan:'壬',zhi:'子'}, day: {gan:'丙',zhi:'子'}, hour: {gan:'辛',zhi:'丑'} }
)

// ===== 丁壬化木格 =====
add('丁壬化木格', '丁', '寅', '正印', 45,
  {'壬':'正官'},
  {木:3,火:2,土:0,金:0,水:1},
  { year: {gan:'壬',zhi:'寅'}, month: {gan:'甲',zhi:'寅'}, day: {gan:'丁',zhi:'卯'}, hour: {gan:'壬',zhi:'辰'} }
)

// ===== 官杀通关格 =====
add('官杀通关格', '甲', '酉', '正官', 48,
  {'辛':'正官','丙':'食神'},
  {木:2,火:2,土:0,金:2,水:0},
  { year: {gan:'丙',zhi:'午'}, month: {gan:'辛',zhi:'酉'}, day: {gan:'甲',zhi:'寅'}, hour: {gan:'丙',zhi:'巳'} }
)

// ===== 比劫通关格 =====
add('比劫通关格', '甲', '辰', '偏财', 52,
  {'戊':'偏财','甲':'比肩','丙':'食神'},
  {木:2,火:2,土:2,金:0,水:0},
  { year: {gan:'丙',zhi:'寅'}, month: {gan:'戊',zhi:'辰'}, day: {gan:'甲',zhi:'寅'}, hour: {gan:'戊',zhi:'戌'} }
)

// ===== 真从印格 =====
add('真从印格2', '甲', '亥', '正印', 10,
  {'壬':'正印','癸':'偏印'},
  {木:1,火:0,土:0,金:0,水:5},
  { year: {gan:'壬',zhi:'子'}, month: {gan:'癸',zhi:'亥'}, day: {gan:'甲',zhi:'亥'}, hour: {gan:'壬',zhi:'申'} }
)

// ===== 运行 =====
console.log('补充测试用例数：', testCases.length)
console.log()

const nameHitCount: Record<string, number> = {}
for (const r of GEJU_RULES) nameHitCount[r.name] = 0

for (const tc of testCases) {
  try {
    const r = determineGeJu(
      tc.sixLines,
      tc.relatedShens,
      tc.strengthScore,
      tc.dayGan,
      tc.monthZhi,
      tc.fiveElementCount
    )
    if (r.matchedRules) {
      for (const name of r.matchedRules) {
        nameHitCount[name] = (nameHitCount[name] || 0) + 1
      }
    }
  } catch (e) {}
}

// 计算
const nameToIds: Record<string, string[]> = {}
for (const r of GEJU_RULES) {
  if (!nameToIds[r.name]) nameToIds[r.name] = []
  nameToIds[r.name].push(r.id)
}

const coveredIds = new Set<string>()
for (const [name, count] of Object.entries(nameHitCount)) {
  if (count > 0) {
    const ids = nameToIds[name] || []
    for (const id of ids) coveredIds.add(id)
  }
}

console.log(`Rule总数：${GEJU_RULES.length}`)
console.log(`已覆盖：${coveredIds.size}`)
console.log(`未覆盖：${GEJU_RULES.length - coveredIds.size}`)
console.log(`覆盖率：${((coveredIds.size / GEJU_RULES.length) * 100).toFixed(1)}%`)
console.log()

if (coveredIds.size < GEJU_RULES.length) {
  console.log('仍未覆盖的Rule：')
  let idx = 1
  for (const r of GEJU_RULES) {
    if (!coveredIds.has(r.id)) {
      console.log(`  ${idx}. ${r.id} - ${r.name} [priority: ${r.priority}]`)
      idx++
    }
  }
} else {
  console.log('✅ 100% 覆盖率达成！')
}
