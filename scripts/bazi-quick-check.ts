/**
 * 八字模块快速检查
 * 验证核心功能是否正常工作
 */

import {
  GEJU_RULES,
  buildGeJuContext,
  determineGeJu,
  type GeJuResult,
} from '../src/lib/bazi/rules/gejuRules'
import { calculateBaZi, type BirthInfo } from '../src/lib/bazi'

console.log('='.repeat(80))
console.log('八字模块快速检查')
console.log('='.repeat(80))
console.log()

// 1. 检查规则数量
console.log('[1] 规则数量检查')
console.log(`  GEJU_RULES 数量: ${GEJU_RULES.length}`)
const ids = GEJU_RULES.map(r => r.id)
const uniqueIds = new Set(ids)
console.log(`  唯一ID数量: ${uniqueIds.size}`)
if (ids.length !== uniqueIds.size) {
  const dup = ids.filter((id, idx) => ids.indexOf(id) !== idx)
  console.log(`  ⚠️ 重复ID: ${[...new Set(dup)].join(', ')}`)
} else {
  console.log('  ✅ 所有ID唯一')
}
console.log()

// 2. 测试一个真实命例
console.log('[2] 真实命例测试')
const testBirthInfo: BirthInfo = {
  birthDate: '1990-01-15',
  birthTime: '10:30',
  gender: 'male',
  timezone: 'Asia/Shanghai',
}

try {
  const chart = calculateBaZi(testBirthInfo)
  console.log(`  姓名: 庚午年 丙寅月 丁酉日 乙巳时`)
  console.log(`  日主: ${chart.dayMaster.dayGan}`)
  console.log(`  日主五行: ${chart.dayMaster.dayGanElement}`)
  console.log(`  强度: ${chart.dayMaster.strengthScore}`)
  console.log(`  五行分布: 木${chart.fiveElementCount.木} 火${chart.fiveElementCount.火} 土${chart.fiveElementCount.土} 金${chart.fiveElementCount.金} 水${chart.fiveElementCount.水}`)
  console.log()

  // 3. 测试格局判断
  console.log('[3] 格局判断结果')
  const geju = determineGeJu(
    chart.sixLines as any,
    chart.dayMaster.relatedShens as any,
    chart.dayMaster.strengthScore,
    chart.dayMaster.dayGan,
    chart.sixLines.month.zhi,
    chart.fiveElementCount as any,
  )

  console.log(`  主格局: ${geju.mainGeJu?.name || '普通格局'}`)
  console.log(`  格局分类: ${geju.mainGeJu?.category || '正格'}`)
  console.log(`  Confidence: ${geju.confidence}`)
  console.log(`  命中规则数: ${geju.matchedRules?.length || 0}`)
  if (geju.matchedRules?.length > 0) {
    console.log(`  命中规则: ${geju.matchedRules.slice(0, 5).join(', ')}${geju.matchedRules.length > 5 ? '...' : ''}`)
  }
  console.log()

  // 4. 检查Explain
  console.log('[4] Explain检查')
  if (geju.explain) {
    console.log(`  whyMatched: ${geju.explain.whyMatched?.length || 0} 条`)
    console.log(`  strengths: ${geju.explain.strengths?.length || 0} 条`)
    console.log(`  weaknesses: ${geju.explain.weaknesses?.length || 0} 条`)
  } else {
    console.log('  ⚠️ 无Explain数据')
  }
  console.log()

  // 5. 检查Scores
  console.log('[5] Scores检查')
  console.log(`  格局层次分: ${geju.pureScore}`)
  console.log(`  贵气分: ${geju.nobilityScore}`)
  console.log(`  富气分: ${geju.wealthScore}`)
  console.log(`  事业分: ${geju.careerScore}`)
  console.log(`  婚姻分: ${geju.marriageScore}`)
  console.log(`  健康分: ${geju.healthScore}`)
  console.log()

} catch (e: any) {
  console.log(`  ❌ 错误: ${e.message}`)
  console.log()
}

// 6. 测试多个命例
console.log('[6] 批量测试（10个随机命例）')
const testCases = [
  { birthDate: '1985-03-20', birthTime: '14:30', gender: 'female' },
  { birthDate: '1992-07-15', birthTime: '08:00', gender: 'male' },
  { birthDate: '2000-11-08', birthTime: '22:30', gender: 'female' },
  { birthDate: '1978-02-28', birthTime: '06:15', gender: 'male' },
  { birthDate: '1995-09-10', birthTime: '11:45', gender: 'female' },
  { birthDate: '1988-12-25', birthTime: '16:20', gender: 'male' },
  { birthDate: '2001-04-05', birthTime: '09:00', gender: 'female' },
  { birthDate: '1970-06-18', birthTime: '13:30', gender: 'male' },
  { birthDate: '1999-08-22', birthTime: '19:45', gender: 'female' },
  { birthDate: '1983-01-30', birthTime: '03:00', gender: 'male' },
]

let success = 0
let fail = 0
const gejuDistribution: Record<string, number> = {}

for (const info of testCases) {
  try {
    const chart = calculateBaZi(info as any)
    const geju = determineGeJu(
      chart.sixLines as any,
      chart.dayMaster.relatedShens as any,
      chart.dayMaster.strengthScore,
      chart.dayMaster.dayGan,
      chart.sixLines.month.zhi,
      chart.fiveElementCount as any,
    )

    success++
    const name = geju.mainGeJu?.name || '普通格局'
    gejuDistribution[name] = (gejuDistribution[name] || 0) + 1

  } catch (e) {
    fail++
  }
}

console.log(`  成功: ${success}/${testCases.length}`)
console.log(`  失败: ${fail}/${testCases.length}`)
console.log(`  格局分布:`)
for (const [name, count] of Object.entries(gejuDistribution)) {
  console.log(`    ${name}: ${count}`)
}
console.log()

// 7. 检查潜在问题
console.log('[7] 潜在问题检查')
console.log()

// 检查是否有规则没有result
const rulesWithoutResult = GEJU_RULES.filter(r => !r.result)
if (rulesWithoutResult.length > 0) {
  console.log(`  ⚠️ ${rulesWithoutResult.length} 条规则没有result`)
} else {
  console.log('  ✅ 所有规则都有result')
}

// 检查是否有规则没有description
const rulesWithoutDesc = GEJU_RULES.filter(r => !r.result?.description)
if (rulesWithoutDesc.length > 0) {
  console.log(`  ⚠️ ${rulesWithoutDesc.length} 条规则没有description`)
} else {
  console.log('  ✅ 所有规则都有description')
}

// 检查是否有规则没有name
const rulesWithoutName = GEJU_RULES.filter(r => !r.result?.name)
if (rulesWithoutName.length > 0) {
  console.log(`  ⚠️ ${rulesWithoutName.length} 条规则没有name`)
} else {
  console.log('  ✅ 所有规则都有name')
}

console.log()
console.log('检查完成')
