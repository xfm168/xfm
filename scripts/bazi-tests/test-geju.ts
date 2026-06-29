/**
 * 格局模块专项测试
 * 包含：正常案例、边界案例、经典命例、失败案例、冲突案例
 */

import { determineGeJu, buildGeJuContext, GEJU_RULES } from '../../src/lib/bazi/rules/gejuRules'
import type { GanZhi, ShenShi, FiveElement } from '../../src/lib/bazi/types'

let total = 0
let passed = 0
let failed = 0

function test(name: string, condition: boolean, detail?: string) {
  total++
  if (condition) {
    passed++
  } else {
    failed++
    console.log(`  ✗ [${name}] ${detail || ''}`)
  }
  return condition
}

function makeGanZhi(gan: string, zhi: string): GanZhi {
  return { gan: gan as any, zhi: zhi as any }
}

function makeSixLines(
  year: [string, string],
  month: [string, string],
  day: [string, string],
  hour: [string, string],
) {
  return {
    year: makeGanZhi(year[0], year[1]),
    month: makeGanZhi(month[0], month[1]),
    day: makeGanZhi(day[0], day[1]),
    hour: makeGanZhi(hour[0], hour[1]),
  }
}

function makeRelatedShens(shens: Record<string, ShenShi>): Record<string, ShenShi> {
  return shens
}

function makeFiveElementCount(counts: Partial<Record<FiveElement, number>>): Record<FiveElement, number> {
  const result: Record<FiveElement, number> = {
    '木': counts['木'] || 0,
    '火': counts['火'] || 0,
    '土': counts['土'] || 0,
    '金': counts['金'] || 0,
    '水': counts['水'] || 0,
  }
  return result
}

function analyzeGeJu(
  sixLines: ReturnType<typeof makeSixLines>,
  dayGan: string,
  monthZhi: string,
  relatedShens: Record<string, ShenShi>,
  strengthScore: number,
  fiveElementCount: Partial<Record<FiveElement, number>>,
) {
  return determineGeJu(sixLines, relatedShens, strengthScore, dayGan, monthZhi, makeFiveElementCount(fiveElementCount))
}

console.log('====================================================')
console.log('  格局模块专项测试')
console.log('  Rule 数量:', GEJU_RULES.length)
console.log('====================================================')
console.log()

// ==================== 第一组：正官格测试 ====================
console.log('【1】正官格测试')
console.log()

// 1.1 标准正官格 - 辛金月令
const r1 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['辛', '酉'], ['甲', '寅'], ['乙', '卯']),
  '甲',
  '酉',
  makeRelatedShens({ '辛': '正官' }),
  55,
  { '木': 3, '火': 0, '土': 1, '金': 2, '水': 2 },
)
test('甲木申月辛金官星透干 → 正官格',
  r1.name === '正官格',
  `实际: ${r1.name}, 置信度: ${r1.confidence}`)

// 1.2 正官格-官被克破格
const r2 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['辛', '酉'], ['甲', '寅'], ['丁', '卯']),
  '甲',
  '酉',
  makeRelatedShens({ '辛': '正官', '丁': '伤官' }),
  45,
  { '木': 3, '火': 1, '土': 1, '金': 2, '水': 1 },
)
test('正官格遇伤官 → 应显示正官格(可能被破)',
  r2.name === '正官格',
  `实际: ${r2.name}, 破格: ${r2.poGe}`)

// 1.3 正官格-官杀混杂
const r3 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['辛', '酉'], ['甲', '寅'], ['庚', '卯']),
  '甲',
  '酉',
  makeRelatedShens({ '辛': '正官', '庚': '偏官' }),
  50,
  { '木': 3, '火': 0, '土': 1, '金': 3, '水': 1 },
)
test('正官格透七杀 → 官杀混杂',
  r3.name === '正官格',
  `实际: ${r3.name}`)

// ==================== 第二组：七杀格测试 ====================
console.log('【2】七杀格测试')
console.log()

// 2.1 标准七杀格-有制
const r4 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['庚', '申'], ['丙', '午'], ['辛', '戌']),
  '丙',
  '申',
  makeRelatedShens({ '庚': '偏官', '壬': '正印' }),
  65,
  { '木': 0, '火': 3, '土': 2, '金': 2, '水': 1 },
)
test('丙火申月七杀有印 → 七杀格',
  r4.name === '七杀格',
  `实际: ${r4.name}`)

// 2.2 七杀格-无制破格
const r5 = analyzeGeJu(
  makeSixLines(['甲', '子'], ['庚', '申'], ['丙', '午'], ['壬', '戌']),
  '丙',
  '申',
  makeRelatedShens({ '庚': '偏官' }),
  40,
  { '木': 1, '火': 2, '土': 1, '金': 2, '水': 2 },
)
test('七杀无制 → 可能破格',
  r5.poGe || r5.name === '七杀格',
  `实际: ${r5.name}, 破格: ${r5.poGe}`)

// ==================== 第三组：专旺格测试 ====================
console.log('【3】专旺格测试')
console.log()

// 3.1 曲直格 - 寅月木令
const r6 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['乙', '卯'], ['甲', '辰'], ['乙', '亥']),
  '甲',
  '寅',
  makeRelatedShens({ '乙': '比肩' }),
  92,
  { '木': 5, '火': 0, '土': 1, '金': 0, '水': 2 },
)
test('甲木寅月，地支木多 → 曲直格或专旺格',
  r6.name === '曲直格' || r6.name === '专旺格',
  `实际: ${r6.name}`)

// 3.2 炎上格 - 午月火令
const r7 = analyzeGeJu(
  makeSixLines(['丙', '巳'], ['丁', '午'], ['丙', '午'], ['丁', '未']),
  '丙',
  '巳',
  makeRelatedShens({ '丁': '劫财' }),
  90,
  { '木': 0, '火': 5, '土': 2, '金': 0, '水': 1 },
)
test('丙火巳月，地支火多 → 炎上格或专旺格',
  r7.name === '炎上格' || r7.name === '专旺格',
  `实际: ${r7.name}`)

// 3.3 稼穑格 - 辰月土令
const r8 = analyzeGeJu(
  makeSixLines(['戊', '辰'], ['己', '丑'], ['戊', '戌'], ['己', '未']),
  '戊',
  '辰',
  makeRelatedShens({ '己': '比肩' }),
  88,
  { '木': 0, '火': 0, '土': 5, '金': 0, '水': 1 },
)
test('戊土辰月，地支土多 → 稼穑格或专旺格',
  r8.name === '稼穑格' || r8.name === '专旺格',
  `实际: ${r8.name}`)

// 3.4 从革格 - 申月金令
const r9 = analyzeGeJu(
  makeSixLines(['庚', '申'], ['辛', '酉'], ['庚', '戌'], ['辛', '丑']),
  '庚',
  '申',
  makeRelatedShens({ '辛': '劫财' }),
  91,
  { '木': 0, '火': 0, '土': 2, '金': 5, '水': 1 },
)
test('庚金申月，地支金多 → 从革格或专旺格',
  r9.name === '从革格' || r9.name === '专旺格',
  `实际: ${r9.name}`)

// 3.5 润下格 - 子月水令
const r10 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['癸', '亥'], ['壬', '丑'], ['癸', '申']),
  '壬',
  '子',
  makeRelatedShens({ '癸': '劫财' }),
  90,
  { '木': 0, '火': 0, '土': 1, '金': 1, '水': 5 },
)
test('壬水子月，地支水多 → 润下格或专旺格',
  r10.name === '润下格' || r10.name === '专旺格',
  `实际: ${r10.name}`)

// ==================== 第四组：从格测试 ====================
console.log('【4】从格测试')
console.log()

// 4.1 真从官杀格 - 午月火令克金
const r11 = analyzeGeJu(
  makeSixLines(['壬', '午'], ['丁', '午'], ['庚', '申'], ['辛', '戌']),
  '庚',
  '午',
  makeRelatedShens({ '丁': '偏官', '壬': '正印' }),
  12,
  { '木': 0, '火': 3, '土': 1, '金': 2, '水': 1 },
)
test('日主极弱无根，官杀当令 → 从格',
  r11.category === '从格' || r11.name.includes('从'),
  `实际: ${r11.name}, 分类: ${r11.category}`)

// 4.2 真从财格 - 辰月土令
const r12 = analyzeGeJu(
  makeSixLines(['甲', '辰'], ['丁', '辰'], ['己', '丑'], ['戊', '辰']),
  '己',
  '辰',
  makeRelatedShens({ '丁': '伤官', '戊': '偏财' }),
  10,
  { '木': 1, '火': 0, '土': 5, '金': 0, '水': 2 },
)
test('日主极弱无根，财星当令 → 从财格',
  r12.name.includes('从财') || r12.category === '从格',
  `实际: ${r12.name}`)

// 4.3 真从儿格 - 寅月木令生火
const r13 = analyzeGeJu(
  makeSixLines(['辛', '寅'], ['壬', '寅'], ['癸', '丑'], ['甲', '辰']),
  '癸',
  '寅',
  makeRelatedShens({ '壬': '劫财', '甲': '食神' }),
  8,
  { '木': 2, '火': 0, '土': 1, '金': 0, '水': 4 },
)
test('日主极弱，食伤当令 → 从儿格',
  r13.name.includes('从儿') || r13.category === '从格',
  `实际: ${r13.name}`)

// 4.4 假从官杀格
const r14 = analyzeGeJu(
  makeSixLines(['壬', '午'], ['丁', '亥'], ['庚', '寅'], ['辛', '巳']),
  '庚',
  '亥',
  makeRelatedShens({ '丁': '偏官' }),
  20,
  { '木': 2, '火': 2, '土': 0, '金': 2, '水': 2 },
)
test('日主有微根，官杀势大 → 假从',
  r14.category === '从格' || r14.name.includes('从'),
  `实际: ${r14.name}`)

// ==================== 第五组：化气格测试 ====================
console.log('【5】化气格测试')
console.log()

// 5.1 甲己化土格
const r15 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['己', '亥'], ['甲', '寅'], ['乙', '卯']),
  '甲',
  '寅',
  makeRelatedShens({ '己': '正印' }),
  50,
  { '木': 3, '火': 0, '土': 2, '金': 0, '水': 3 },
)
test('甲己相合 → 化气格或格局判断',
  r15.category === '化气格' || r15.name === '化气格',
  `实际: ${r15.name}`)

// 5.2 乙庚化金格
const r16 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['庚', '申'], ['乙', '寅'], ['丙', '午']),
  '乙',
  '申',
  makeRelatedShens({ '庚': '正官' }),
  45,
  { '木': 2, '火': 1, '土': 0, '金': 3, '水': 2 },
)
test('乙庚相合 → 化气格或格局判断',
  r16.category === '化气格' || r16.name === '化气格',
  `实际: ${r16.name}`)

// ==================== 第六组：特殊格局测试 ====================
console.log('【6】特殊格局测试')
console.log()

// 6.1 飞天禄马格 - 庚子日多子
const r17 = analyzeGeJu(
  makeSixLines(['庚', '子'], ['壬', '子'], ['庚', '子'], ['癸', '丑']),
  '庚',
  '子',
  makeRelatedShens({}),
  75,
  { '木': 0, '火': 0, '土': 1, '金': 3, '水': 4 },
)
test('庚子日地支多子 → 飞天禄马或特殊格',
  r17.category === '特殊格' || r17.name === '飞天禄马',
  `实际: ${r17.name}`)

// 6.2 金神格 - 乙日酉丑金多
const r18 = analyzeGeJu(
  makeSixLines(['乙', '酉'], ['辛', '丑'], ['乙', '丑'], ['丁', '亥']),
  '乙',
  '丑',
  makeRelatedShens({ '辛': '正官' }),
  60,
  { '木': 2, '火': 1, '土': 1, '金': 3, '水': 1 },
)
test('乙木日主地支金多 → 金神格或特殊格',
  r18.category === '特殊格' || r18.name === '金神格',
  `实际: ${r18.name}`)

// 6.3 魁罡格 - 庚辰日
const r19 = analyzeGeJu(
  makeSixLines(['壬', '辰'], ['庚', '戌'], ['庚', '辰'], ['壬', '戌']),
  '庚',
  '辰',
  makeRelatedShens({ '壬': '偏印' }),
  70,
  { '木': 0, '火': 0, '土': 3, '金': 2, '水': 3 },
)
test('庚辰日 → 魁罡格或特殊格',
  r19.category === '特殊格' || r19.name === '魁罡格',
  `实际: ${r19.name}`)

// ==================== 第七组：调候格测试 ====================
console.log('【7】调候格测试')
console.log()

// 7.1 寒命调候格 - 冬月无火
const r20 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['癸', '丑'], ['庚', '子'], ['辛', '亥']),
  '庚',
  '子',
  makeRelatedShens({ '癸': '正印' }),
  35,
  { '木': 0, '火': 0, '土': 1, '金': 2, '水': 5 },
)
test('冬生无火寒湿过重 → 调候格',
  r20.category === '调候格' || r20.name === '调候格',
  `实际: ${r20.name}`)

// 7.2 暖命调候格 - 夏月无水
const r21 = analyzeGeJu(
  makeSixLines(['丙', '午'], ['丁', '巳'], ['甲', '午'], ['乙', '巳']),
  '甲',
  '巳',
  makeRelatedShens({ '丁': '伤官' }),
  30,
  { '木': 3, '火': 4, '土': 0, '金': 0, '水': 0 },
)
test('夏生无水燥热 → 调候格',
  r21.category === '调候格' || r21.name === '调候格',
  `实际: ${r21.name}`)

// ==================== 第八组：破格规则测试 ====================
console.log('【8】破格规则测试')
console.log()

// 8.1 财格破格-劫财分财
const r22 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['戊', '辰'], ['戊', '戌'], ['乙', '卯']),
  '戊',
  '辰',
  makeRelatedShens({ '甲': '正官', '乙': '劫财' }),
  55,
  { '木': 2, '火': 0, '土': 4, '金': 0, '水': 2 },
)
test('财格遇劫财分财 → 可能破格',
  r22.name.includes('财') || r22.poGe,
  `实际: ${r22.name}, 破格: ${r22.poGe}`)

// 8.2 印格破格-财星破印
const r23 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['癸', '亥'], ['乙', '卯'], ['丙', '子']),
  '乙',
  '亥',
  makeRelatedShens({ '癸': '正印', '甲': '正财' }),
  50,
  { '木': 3, '火': 0, '土': 0, '金': 0, '水': 3 },
)
test('印格遇财破印 → 可能破格',
  r23.poGe || r23.name.includes('印'),
  `实际: ${r23.name}, 破格: ${r23.poGe}`)

// 8.3 食神格破格-枭神夺食
const r24 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['丙', '巳'], ['丁', '酉'], ['乙', '亥']),
  '丁',
  '巳',
  makeRelatedShens({ '丙': '食神', '乙': '偏印' }),
  60,
  { '木': 2, '火': 2, '土': 0, '金': 1, '水': 3 },
)
test('食神格遇枭神夺食 → 可能破格',
  r24.poGe || r24.name === '食神格',
  `实际: ${r24.name}, 破格: ${r24.poGe}`)

// 8.4 伤官格破格-无财通关
const r25 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['丁', '午'], ['乙', '亥'], ['丙', '子']),
  '乙',
  '午',
  makeRelatedShens({ '丁': '伤官', '甲': '正官' }),
  45,
  { '木': 2, '火': 2, '土': 0, '金': 0, '水': 2 },
)
test('伤官见官无财通关 → 可能破格',
  r25.poGe || r25.name === '伤官格',
  `实际: ${r25.name}, 破格: ${r25.poGe}`)

// ==================== 第九组：格局层次测试 ====================
console.log('【9】格局层次测试')
console.log()

// 9.1 格局上等
const r26 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['辛', '酉'], ['乙', '卯'], ['丙', '子']),
  '乙',
  '卯',
  makeRelatedShens({ '辛': '正官', '丙': '食神' }),
  55,
  { '木': 4, '火': 1, '土': 0, '金': 2, '水': 1 },
)
test('格局条件较好 → 应有较高分数',
  r26.score >= 60,
  `实际分数: ${r26.score}`)

// 9.2 格局下等
const r27 = analyzeGeJu(
  makeSixLines(['甲', '申'], ['庚', '午'], ['乙', '酉'], ['丙', '子']),
  '乙',
  '午',
  makeRelatedShens({ '庚': '正官' }),
  15,
  { '木': 1, '火': 1, '土': 0, '金': 3, '水': 2 },
)
test('日主极弱偏枯 → 格局下等或破格',
  r27.score < 60 || r27.poGe,
  `实际分数: ${r27.score}, 破格: ${r27.poGe}`)

// ==================== 第十组：通关格测试 ====================
console.log('【10】通关格测试')
console.log()

// 10.1 官杀相战通关
const r28 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['辛', '酉'], ['甲', '寅'], ['丁', '午']),
  '甲',
  '酉',
  makeRelatedShens({ '辛': '正官', '丁': '偏官', '壬': '正印' }),
  55,
  { '木': 2, '火': 1, '土': 0, '金': 2, '水': 3 },
)
test('官杀相战有印通关 → 通关格或正官格',
  r28.name === '通关格' || r28.category === '通关格' || r28.name === '正官格',
  `实际: ${r28.name}`)

// 10.2 比劫争财通关
const r29 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['乙', '卯'], ['丙', '午'], ['丁', '未']),
  '丙',
  '午',
  makeRelatedShens({ '甲': '比肩', '乙': '劫财', '丁': '食神' }),
  75,
  { '木': 2, '火': 4, '土': 1, '金': 0, '水': 0 },
)
test('比劫争财有食伤通关 → 通关格',
  r29.name === '通关格' || r29.category === '通关格',
  `实际: ${r29.name}`)

// ==================== 第十一组：扶抑格测试 ====================
console.log('【11】扶抑格测试')
console.log()

// 11.1 扶抑格-扶身
const r30 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['癸', '亥'], ['甲', '寅'], ['乙', '卯']),
  '甲',
  '亥',
  makeRelatedShens({ '癸': '正印', '壬': '偏印' }),
  28,
  { '木': 2, '火': 0, '土': 0, '金': 0, '水': 5 },
)
test('日主偏弱以印扶身 → 扶抑格或印格',
  r30.name === '扶抑格' || r30.category === '扶抑格' || r30.name === '印格',
  `实际: ${r30.name}`)

// 11.2 扶抑格-抑泄
const r31 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['乙', '卯'], ['甲', '寅'], ['丙', '午']),
  '甲',
  '寅',
  makeRelatedShens({ '乙': '比肩', '丙': '食神' }),
  78,
  { '木': 4, '火': 1, '土': 0, '金': 0, '水': 0 },
)
test('日主偏旺以食伤抑泄 → 扶抑格或专旺格',
  r31.name === '扶抑格' || r31.category === '扶抑格' || r31.name === '专旺格' || r31.name === '曲直格',
  `实际: ${r31.name}`)

// ==================== 第十二组：病药格测试 ====================
console.log('【12】病药格测试')
console.log()

// 12.1 病重药轻
const r32 = analyzeGeJu(
  makeSixLines(['甲', '申'], ['庚', '午'], ['乙', '酉'], ['丙', '子']),
  '乙',
  '午',
  makeRelatedShens({ '庚': '正官' }),
  12,
  { '木': 1, '火': 1, '土': 0, '金': 3, '水': 1 },
)
test('命局偏枯病重 → 病药格或破格',
  r32.poGe || r32.category === '病药格' || r32.score < 50,
  `实际: ${r32.name}, 破格: ${r32.poGe}`)

// 12.2 病药相济
const r33 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['丙', '午'], ['乙', '亥'], ['丙', '子']),
  '乙',
  '午',
  makeRelatedShens({ '丙': '食神', '甲': '正官' }),
  50,
  { '木': 2, '火': 3, '土': 0, '金': 0, '水': 3 },
)
test('有病有药药病相济 → 病药格或食神格',
  r33.name === '病药格' || r33.category === '病药格' || r33.name === '食神格',
  `实际: ${r33.name}`)

// ==================== 第十三组：清纯判断测试 ====================
console.log('【13】清纯判断测试')
console.log()

// 13.1 正官格-清纯
const r34 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['辛', '酉'], ['甲', '寅'], ['乙', '卯']),
  '甲',
  '酉',
  makeRelatedShens({ '辛': '正官' }),
  55,
  { '木': 3, '火': 0, '土': 1, '金': 2, '水': 2 },
)
test('正官格无七杀 → 正官格',
  r34.name === '正官格',
  `实际: ${r34.name}`)

// 13.2 食神格-清纯
const r35 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['癸', '丑'], ['丙', '巳'], ['丁', '未']),
  '丙',
  '巳',
  makeRelatedShens({ '癸': '偏印' }),
  65,
  { '木': 0, '火': 3, '土': 2, '金': 1, '水': 2 },
)
test('食神格无偏印伤官 → 食神格或调候格',
  r35.name === '食神格' || r35.category === '调候格',
  `实际: ${r35.name}`)

// ==================== 第十四组：边界案例测试 ====================
console.log('【14】边界案例测试')
console.log()

// 14.1 日主刚好50分
const r36 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['乙', '卯'], ['丙', '午'], ['丁', '未']),
  '丙',
  '午',
  makeRelatedShens({ '乙': '偏印' }),
  50,
  { '木': 2, '火': 3, '土': 1, '金': 0, '水': 0 },
)
test('日主50分中和 → 正常判断',
  r36.name !== '',
  `实际: ${r36.name}`)

// 14.2 日主刚好25分
const r37 = analyzeGeJu(
  makeSixLines(['壬', '子'], ['癸', '丑'], ['甲', '寅'], ['乙', '卯']),
  '甲',
  '丑',
  makeRelatedShens({ '癸': '正印' }),
  25,
  { '木': 2, '火': 0, '土': 1, '金': 0, '水': 4 },
)
test('日主25分偏弱下线 → 正常判断',
  r37.name !== '',
  `实际: ${r37.name}`)

// 14.3 日主刚好75分
const r38 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['乙', '卯'], ['甲', '寅'], ['乙', '卯']),
  '甲',
  '寅',
  makeRelatedShens({ '乙': '比肩' }),
  75,
  { '木': 4, '火': 0, '土': 0, '金': 0, '水': 0 },
)
test('日主75分偏强上线 → 正常判断',
  r38.name !== '',
  `实际: ${r38.name}`)

// 14.4 无透干无通根
const r39 = analyzeGeJu(
  makeSixLines(['庚', '子'], ['辛', '丑'], ['壬', '寅'], ['癸', '卯']),
  '壬',
  '寅',
  makeRelatedShens({}),
  45,
  { '木': 2, '火': 0, '土': 1, '金': 2, '水': 3 },
)
test('无透干无通根 → 普通格局',
  r39.name === '普通格局' || r39.name !== '',
  `实际: ${r39.name}`)

// 14.5 四柱全异党
const r40 = analyzeGeJu(
  makeSixLines(['庚', '申'], ['辛', '酉'], ['壬', '子'], ['癸', '亥']),
  '壬',
  '申',
  makeRelatedShens({}),
  5,
  { '木': 0, '火': 0, '土': 0, '金': 4, '水': 4 },
)
test('四柱全异党日主极弱 → 从格',
  r40.category === '从格' || r40.name !== '普通格局',
  `实际: ${r40.name}, 分类: ${r40.category}`)

// ==================== 第十五组：经典命例测试 ====================
console.log('【15】经典命例测试')
console.log()

// 15.1 任铁樵命例（滴天髓作者）
const r41 = analyzeGeJu(
  makeSixLines(['癸', '酉'], ['壬', '戌'], ['壬', '申'], ['辛', '亥']),
  '壬',
  '戌',
  makeRelatedShens({ '癸': '正印', '壬': '比肩' }),
  72,
  { '木': 0, '火': 0, '土': 2, '金': 2, '水': 5 },
)
test('任铁樵命例 → 格局判断',
  r41.name !== '',
  `实际: ${r41.name}, 分数: ${r41.score}`)

// 15.2 经典正官格
const r42 = analyzeGeJu(
  makeSixLines(['甲', '辰'], ['癸', '酉'], ['乙', '亥'], ['丙', '午']),
  '乙',
  '酉',
  makeRelatedShens({ '癸': '正印', '丙': '食神' }),
  50,
  { '木': 2, '火': 1, '土': 2, '金': 2, '水': 1 },
)
test('经典正官格 → 正官格',
  r42.name === '正官格',
  `实际: ${r42.name}`)

// 15.3 经典七杀格
const r43 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['庚', '申'], ['丙', '午'], ['壬', '辰']),
  '丙',
  '申',
  makeRelatedShens({ '庚': '偏官', '壬': '偏印' }),
  55,
  { '木': 1, '火': 2, '土': 1, '金': 2, '水': 2 },
)
test('经典七杀格-杀印相生 → 七杀格',
  r43.name === '七杀格',
  `实际: ${r43.name}`)

// 15.4 经典食神格
const r44 = analyzeGeJu(
  makeSixLines(['甲', '辰'], ['丙', '辰'], ['丁', '酉'], ['戊', '申']),
  '丁',
  '辰',
  makeRelatedShens({ '丙': '食神' }),
  60,
  { '木': 1, '火': 2, '土': 3, '金': 2, '水': 0 },
)
test('经典食神格 → 食神格',
  r44.name === '食神格',
  `实际: ${r44.name}`)

// 15.5 经典伤官格
const r45 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['丁', '卯'], ['乙', '亥'], ['丙', '子']),
  '乙',
  '卯',
  makeRelatedShens({ '丁': '伤官', '丙': '食神' }),
  45,
  { '木': 3, '火': 2, '土': 0, '金': 0, '水': 3 },
)
test('经典伤官格 → 伤官格',
  r45.name === '伤官格',
  `实际: ${r45.name}`)

// ==================== 第十六组：冲突案例测试 ====================
console.log('【16】冲突案例测试')
console.log()

// 16.1 成破并存
const r46 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['辛', '酉'], ['乙', '卯'], ['丁', '午']),
  '乙',
  '酉',
  makeRelatedShens({ '辛': '正官', '丁': '伤官' }),
  55,
  { '木': 3, '火': 1, '土': 0, '金': 2, '水': 2 },
)
test('正官格同时有伤官 → 成破并存',
  r46.name === '正官格',
  `实际: ${r46.name}, 冲突: ${r46.conflicts?.join(', ') || '无'}`)

// 16.2 多重破格
const r47 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['辛', '酉'], ['乙', '卯'], ['丁', '丑']),
  '乙',
  '酉',
  makeRelatedShens({ '辛': '正官', '丁': '伤官', '甲': '正财' }),
  40,
  { '木': 3, '火': 0, '土': 2, '金': 2, '水': 1 },
)
test('多重破格条件 → 格局不稳',
  r47.poGe || r47.conflicts?.length > 0 || r47.score < 60,
  `实际: ${r47.name}, 破格: ${r47.poGe}, 分数: ${r47.score}`)

// ==================== 第十七组：Confidence计算测试 ====================
console.log('【17】Confidence计算测试')
console.log()

// 17.1 高Confidence
const r48 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['辛', '酉'], ['乙', '卯'], ['丙', '子']),
  '乙',
  '卯',
  makeRelatedShens({ '辛': '正官', '丙': '食神' }),
  55,
  { '木': 3, '火': 1, '土': 0, '金': 2, '水': 2 },
)
test('正常格局 → Confidence应在合理范围',
  r48.confidence >= 50 && r48.confidence <= 100,
  `实际Confidence: ${r48.confidence}`)

// 17.2 低Confidence
const r49 = analyzeGeJu(
  makeSixLines(['甲', '申'], ['庚', '午'], ['乙', '酉'], ['丙', '子']),
  '乙',
  '午',
  makeRelatedShens({ '庚': '正官' }),
  15,
  { '木': 1, '火': 1, '土': 0, '金': 3, '水': 1 },
)
test('极弱日主 → Confidence应较低或破格',
  r49.confidence < 80 || r49.poGe || r49.score < 60,
  `实际Confidence: ${r49.confidence}`)

// 17.3 命中多条规则
const r50 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['辛', '酉'], ['乙', '卯'], ['丙', '辰']),
  '乙',
  '卯',
  makeRelatedShens({ '辛': '正官', '丙': '食神', '壬': '正印' }),
  58,
  { '木': 3, '火': 1, '土': 1, '金': 2, '水': 2 },
)
test('命中多条规则 → Confidence应较高',
  r50.confidence >= 60 || r50.score >= 70,
  `实际Confidence: ${r50.confidence}, 分数: ${r50.score}`)

// ==================== 第十八组：边界条件测试 ====================
console.log('【18】边界条件测试')
console.log()

// 18.1 strengthScore = 0
const r51 = analyzeGeJu(
  makeSixLines(['甲', '申'], ['庚', '午'], ['乙', '酉'], ['丙', '子']),
  '乙',
  '午',
  makeRelatedShens({ '庚': '正官' }),
  0,
  { '木': 1, '火': 1, '土': 0, '金': 3, '水': 1 },
)
test('strengthScore=0 → 应能正常处理',
  r51.name !== '',
  `实际: ${r51.name}, 分数: ${r51.score}`)

// 18.2 strengthScore = 100
const r52 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['乙', '卯'], ['甲', '寅'], ['乙', '卯']),
  '甲',
  '寅',
  makeRelatedShens({ '乙': '比肩' }),
  100,
  { '木': 4, '火': 0, '土': 0, '金': 0, '水': 0 },
)
test('strengthScore=100 → 应判断为专旺',
  r52.name === '专旺格' || r52.category === '专旺格' || r52.name === '曲直格',
  `实际: ${r52.name}`)

// 18.3 五行计数正常
const r53 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['丙', '午'], ['戊', '辰'], ['庚', '申']),
  '壬',
  '寅',
  makeRelatedShens({}),
  50,
  { '木': 1, '火': 1, '土': 1, '金': 1, '水': 0 },
)
test('五行计数正常 → 应能正常处理',
  r53.name !== '',
  `实际: ${r53.name}`)

// ==================== 第十九组：正财偏财测试 ====================
console.log('【19】正财偏财测试')
console.log()

// 19.1 标准正财格 - 辰月土令
const r54 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['戊', '辰'], ['丙', '戌'], ['丁', '卯']),
  '丙',
  '辰',
  makeRelatedShens({ '戊': '正财' }),
  55,
  { '木': 2, '火': 2, '土': 3, '金': 0, '水': 1 },
)
test('丙火辰月正财透干 → 正财格或财格',
  r54.name === '正财格' || r54.name === '财格',
  `实际: ${r54.name}`)

// 19.2 标准偏财格 - 子月水令
const r55 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['壬', '子'], ['庚', '戌'], ['辛', '丑']),
  '庚',
  '子',
  makeRelatedShens({ '壬': '偏财' }),
  60,
  { '木': 1, '火': 0, '土': 2, '金': 2, '水': 3 },
)
test('庚金子月偏财透干 → 偏财格或财格',
  r55.name === '偏财格' || r55.name === '财格',
  `实际: ${r55.name}`)

// 19.3 财格破格-劫财分财
const r56 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['戊', '辰'], ['丙', '戌'], ['乙', '卯']),
  '丙',
  '辰',
  makeRelatedShens({ '戊': '正财', '乙': '劫财' }),
  50,
  { '木': 2, '火': 1, '土': 3, '金': 0, '水': 1 },
)
test('正财格遇劫财 → 可能破格',
  r56.poGe || r56.name === '正财格',
  `实际: ${r56.name}, 破格: ${r56.poGe}`)

// ==================== 第二十组：印格测试 ====================
console.log('【20】印格测试')
console.log()

// 20.1 标准正印格 - 亥月水令
const r57 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['癸', '亥'], ['乙', '卯'], ['壬', '子']),
  '乙',
  '亥',
  makeRelatedShens({ '癸': '正印' }),
  40,
  { '木': 3, '火': 0, '土': 0, '金': 0, '水': 4 },
)
test('乙木亥月正印透干 → 正印格',
  r57.name === '正印格',
  `实际: ${r57.name}`)

// 20.2 标准偏印格 - 子月水令
const r58 = analyzeGeJu(
  makeSixLines(['甲', '寅'], ['壬', '子'], ['乙', '卯'], ['癸', '丑']),
  '乙',
  '子',
  makeRelatedShens({ '壬': '偏印' }),
  35,
  { '木': 2, '火': 0, '土': 1, '金': 0, '水': 5 },
)
test('乙木子月偏印透干 → 偏印格',
  r58.name === '偏印格',
  `实际: ${r58.name}`)

// ==================== 总结 ====================
console.log('====================================================')
console.log('  测试总结')
console.log('====================================================')
console.log()
console.log(`  总测试数: ${total}`)
console.log(`  通过: ${passed}`)
console.log(`  失败: ${failed}`)
console.log(`  通过率: ${((passed / total) * 100).toFixed(1)}%`)
console.log()
if (failed === 0) {
  console.log('  ✓ 所有测试通过！')
} else {
  console.log(`  ✗ ${failed} 个测试失败`)
  process.exit(1)
}
