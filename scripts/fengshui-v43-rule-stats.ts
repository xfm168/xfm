/**
 * V4.3 规则覆盖率统计
 * 统计每个房间的规则数量、吉凶分布
 */

import { ALL_RULES, RULE_STATS } from '../src/lib/fengshui/rules'

interface RoomStats {
  room: string
  total: number
  auspicious: number  // 吉
  inauspicious: number // 凶
  warning: number     // 警告
  neutral: number     // 中性
}

function main() {
  console.log('='.repeat(60))
  console.log('V4.3 规则覆盖率统计')
  console.log('='.repeat(60))

  const rooms = [
    { key: 'house', name: '全屋' },
    { key: 'entrance', name: '玄关' },
    { key: 'living-room', name: '客厅' },
    { key: 'master-bedroom', name: '主卧' },
    { key: 'bedroom', name: '次卧' },
    { key: 'kitchen', name: '厨房' },
    { key: 'bathroom', name: '卫生间' },
    { key: 'dining-room', name: '餐厅' },
    { key: 'study', name: '书房' },
    { key: 'balcony', name: '阳台' },
  ]

  const roomStats: RoomStats[] = []

  for (const room of rooms) {
    const roomRules = ALL_RULES.filter(r => 
      r.applicableTo?.includes(room.key as any) || 
      r.category === room.key ||
      r.id.startsWith(room.key)
    )

    // 更准确的方式：按 ID 前缀匹配
    const rulesByIdPrefix = ALL_RULES.filter(r => r.id.startsWith(room.key + '-'))
    
    const stats: RoomStats = {
      room: room.name,
      total: rulesByIdPrefix.length,
      auspicious: rulesByIdPrefix.filter(r => r.result.type === 'auspicious').length,
      inauspicious: rulesByIdPrefix.filter(r => r.result.type === 'inauspicious').length,
      warning: rulesByIdPrefix.filter(r => r.result.type === 'warning').length,
      neutral: rulesByIdPrefix.filter(r => r.result.type === 'neutral').length,
    }
    roomStats.push(stats)
  }

  console.log('\n📊 各房间规则统计')
  console.log('-'.repeat(60))
  console.log(`${'房间'.padEnd(8)}${'总数'.padStart(6)}${'吉'.padStart(6)}${'凶'.padStart(6)}${'警告'.padStart(6)}${'中性'.padStart(6)}`)
  console.log('-'.repeat(60))
  
  let totalAuspicious = 0
  let totalInauspicious = 0
  let totalWarning = 0
  let totalNeutral = 0
  
  for (const s of roomStats) {
    console.log(`${s.room.padEnd(8)}${String(s.total).padStart(6)}${String(s.auspicious).padStart(6)}${String(s.inauspicious).padStart(6)}${String(s.warning).padStart(6)}${String(s.neutral).padStart(6)}`)
    totalAuspicious += s.auspicious
    totalInauspicious += s.inauspicious
    totalWarning += s.warning
    totalNeutral += s.neutral
  }
  
  console.log('-'.repeat(60))
  console.log(`${'总计'.padEnd(8)}${String(ALL_RULES.length).padStart(6)}${String(totalAuspicious).padStart(6)}${String(totalInauspicious).padStart(6)}${String(totalWarning).padStart(6)}${String(totalNeutral).padStart(6)}`)

  console.log('\n📋 规则质量检查')
  console.log('-'.repeat(60))
  
  // 检查有古籍引用的规则
  const withRefs = ALL_RULES.filter(r => r.referenceIds && r.referenceIds.length > 0)
  console.log(`有古籍引用: ${withRefs.length} 条 (${(withRefs.length / ALL_RULES.length * 100).toFixed(1)}%)`)
  
  // 检查有影响分析的规则
  const withImpact = ALL_RULES.filter(r => r.impact && Object.keys(r.impact).length > 0)
  console.log(`有影响分析: ${withImpact.length} 条 (${(withImpact.length / ALL_RULES.length * 100).toFixed(1)}%)`)
  
  // 检查有改善建议的规则
  const withImprovement = ALL_RULES.filter(r => r.improvement && r.improvement.length > 0)
  console.log(`有改善建议: ${withImprovement.length} 条 (${(withImprovement.length / ALL_RULES.length * 100).toFixed(1)}%)`)
  
  // 检查规则不足的房间 (< 8 条)
  const lowRooms = roomStats.filter(s => s.total < 8)
  if (lowRooms.length > 0) {
    console.log(`\n⚠️  规则不足的房间 ( < 8 条):`)
    lowRooms.forEach(s => console.log(`  - ${s.room}: ${s.total} 条`))
  } else {
    console.log(`\n✅ 所有房间规则数 >= 8 条`)
  }

  // 检查重复 ID
  const ids = ALL_RULES.map(r => r.id)
  const uniqueIds = new Set(ids)
  const duplicateCount = ids.length - uniqueIds.size
  console.log(`\n重复 RuleID: ${duplicateCount} 个`)
  
  console.log('\n' + '='.repeat(60))
  console.log(`总计: ${ALL_RULES.length} 条规则`)
  console.log('='.repeat(60))
}

main()
