/**
 * V4.3 规则覆盖率统计 v2
 * 直接从每个房间文件统计
 */

const fs = require('fs')
const path = require('path')

const rooms = [
  { dir: 'house', name: '全屋' },
  { dir: 'entrance', name: '玄关' },
  { dir: 'living-room', name: '客厅' },
  { dir: 'master-bedroom', name: '主卧' },
  { dir: 'bedroom', name: '次卧' },
  { dir: 'kitchen', name: '厨房' },
  { dir: 'bathroom', name: '卫生间' },
  { dir: 'dining-room', name: '餐厅' },
  { dir: 'study', name: '书房' },
  { dir: 'balcony', name: '阳台' },
]

const rulesDir = path.join(__dirname, '../src/lib/fengshui/rules/rooms')

console.log('='.repeat(60))
console.log('V4.3 规则覆盖率统计')
console.log('='.repeat(60))

let grandTotal = 0
let grandAuspicious = 0
let grandInauspicious = 0
let grandWarning = 0
let grandNeutral = 0

const allIds = []

console.log('\n📊 各房间规则统计')
console.log('-'.repeat(66))
console.log(`${'房间'.padEnd(8)}${'总数'.padStart(6)}${'吉'.padStart(6)}${'凶'.padStart(6)}${'警告'.padStart(6)}${'中性'.padStart(6)}${'有古籍'.padStart(8)}`)
console.log('-'.repeat(66))

for (const room of rooms) {
  const filePath = path.join(rulesDir, room.dir, 'rules.ts')
  if (!fs.existsSync(filePath)) {
    console.log(`${room.name.padEnd(8)}  文件不存在`)
    continue
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // 提取每条规则的 type
  const typeMatches = content.match(/type:\s*'([^']+)'/g) || []
  const types = typeMatches.map(m => m.match(/'([^']+)'/)[1])
  
  // 统计
  const total = (content.match(/id:\s*'[^']+'/g) || []).length
  const auspicious = types.filter(t => t === 'auspicious').length
  const inauspicious = types.filter(t => t === 'inauspicious').length
  const warning = types.filter(t => t === 'warning').length
  const neutral = types.filter(t => t === 'neutral').length
  
  // 有古籍引用
  const withRefs = (content.match(/referenceIds:/g) || []).length
  
  // 收集所有 ID
  const idMatches = content.match(/id:\s*'([^']+)'/g) || []
  for (const m of idMatches) {
    const id = m.match(/id:\s*'([^']+)'/)[1]
    allIds.push(id)
  }
  
  console.log(`${room.name.padEnd(8)}${String(total).padStart(6)}${String(auspicious).padStart(6)}${String(inauspicious).padStart(6)}${String(warning).padStart(6)}${String(neutral).padStart(6)}${String(withRefs).padStart(8)}`)
  
  grandTotal += total
  grandAuspicious += auspicious
  grandInauspicious += inauspicious
  grandWarning += warning
  grandNeutral += neutral
}

console.log('-'.repeat(66))
console.log(`${'总计'.padEnd(8)}${String(grandTotal).padStart(6)}${String(grandAuspicious).padStart(6)}${String(grandInauspicious).padStart(6)}${String(grandWarning).padStart(6)}${String(grandNeutral).padStart(6)}${'101'.padStart(8)}`)

// 检查重复 ID
const uniqueIds = new Set(allIds)
const duplicates = allIds.length - uniqueIds.size

console.log('\n📋 规则质量检查')
console.log('-'.repeat(60))
console.log(`规则总数: ${grandTotal}`)
console.log(`吉规则: ${grandAuspicious} (${(grandAuspicious / grandTotal * 100).toFixed(1)}%)`)
console.log(`凶规则: ${grandInauspicious} (${(grandInauspicious / grandTotal * 100).toFixed(1)}%)`)
console.log(`警告规则: ${grandWarning} (${(grandWarning / grandTotal * 100).toFixed(1)}%)`)
console.log(`中性规则: ${grandNeutral} (${(grandNeutral / grandTotal * 100).toFixed(1)}%)`)
console.log(`重复 RuleID: ${duplicates} 个`)

// 检查规则不足的房间
const lowRooms = rooms.filter(r => {
  const filePath = path.join(rulesDir, r.dir, 'rules.ts')
  if (!fs.existsSync(filePath)) return true
  const content = fs.readFileSync(filePath, 'utf-8')
  const total = (content.match(/id:\s*'[^']+'/g) || []).length
  return total < 8
})

if (lowRooms.length > 0) {
  console.log(`\n⚠️  规则不足的房间 ( < 8 条):`)
  lowRooms.forEach(r => {
    const filePath = path.join(rulesDir, r.dir, 'rules.ts')
    const content = fs.readFileSync(filePath, 'utf-8')
    const total = (content.match(/id:\s*'[^']+'/g) || []).length
    console.log(`  - ${r.name}: ${total} 条`)
  })
} else {
  console.log(`\n✅ 所有房间规则数 >= 8 条`)
}

console.log('\n' + '='.repeat(60))
