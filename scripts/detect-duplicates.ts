/**
 * Rule 重复/冲突检测
 * 检测：Condition等价、Result相同、Priority冲突、Name重复
 */

import * as fs from 'fs'
import * as path from 'path'
import { GEJU_RULES } from '../src/lib/bazi/rules/gejuRules'

console.log('='.repeat(80))
console.log('Rule 重复/冲突检测')
console.log('='.repeat(80))
console.log()

const rules = GEJU_RULES
const n = rules.length

// 1. 检测重复id（已知有cong-yin-zhen）
const idCount = new Map<string, number>()
for (const r of rules) {
  idCount.set(r.id, (idCount.get(r.id) || 0) + 1)
}
const duplicateIds = Array.from(idCount.entries()).filter(([_, c]) => c > 1)
console.log(`[1] 重复ID检测：${duplicateIds.length}个`)
for (const [id, count] of duplicateIds) {
  console.log(`  ⚠️ "${id}" 出现 ${count} 次`)
  const dupes = rules.filter(r => r.id === id)
  dupes.forEach(r => console.log(`     - P${r.priority} ${r.name}`))
}
console.log()

// 2. 检测完全相同的Condition
console.log('[2] Condition完全相同检测：')
const condMap = new Map<string, typeof rules>()
for (const r of rules) {
  const cond = r.condition.toString()
  if (!condMap.has(cond)) condMap.set(cond, [])
  condMap.get(cond)!.push(r)
}

const duplicateConds = Array.from(condMap.entries()).filter(([_, rs]) => rs.length > 1)
console.log(`  发现 ${duplicateConds.length} 组Condition完全相同的Rule：`)
for (const [_, rs] of duplicateConds) {
  console.log(`    ${rs.map(r => `${r.id}(P${r.priority}:${r.name})`).join(' = ')}`)
}
console.log()

// 3. 检测完全相同的Result
console.log('[3] Result完全相同检测：')
function getResultKey(r: any): string {
  return JSON.stringify({
    name: r.result?.name,
    category: r.result?.category,
    isSpecial: r.result?.isSpecial,
    score: r.result?.score,
    confidence: r.result?.confidence,
    poGe: r.result?.poGe,
  })
}

const resultMap = new Map<string, typeof rules>()
for (const r of rules) {
  const key = getResultKey(r)
  if (!resultMap.has(key)) resultMap.set(key, [])
  resultMap.get(key)!.push(r)
}

const duplicateResults = Array.from(resultMap.entries()).filter(([_, rs]) => rs.length > 1)
console.log(`  发现 ${duplicateResults.length} 组Result完全相同的Rule：`)
for (const [key, rs] of duplicateResults) {
  const parsed = JSON.parse(key)
  console.log(`    Result: ${parsed.name} (${parsed.category}) - ${rs.length}个Rule`)
  rs.forEach(r => console.log(`     - ${r.id}(P${r.priority})`))
}
console.log()

// 4. 检测Priority冲突（同优先级且Result不同）
console.log('[4] Priority冲突检测（同优先级 + Result不同）：')
const priorityMap = new Map<number, typeof rules>()
for (const r of rules) {
  if (!priorityMap.has(r.priority)) priorityMap.set(r.priority, [])
  priorityMap.get(r.priority)!.push(r)
}

let conflictCount = 0
const conflicts: { priority: number; rules: typeof rules }[] = []
for (const [priority, rs] of priorityMap) {
  if (rs.length > 1) {
    // 检查Result是否相同
    const resultKeys = new Set(rs.map(r => getResultKey(r)))
    if (resultKeys.size > 1) {
      conflictCount++
      conflicts.push({ priority, rules: rs })
      console.log(`  ⚠️ P${priority}: ${rs.length}个Rule，${resultKeys.size}种不同Result`)
      rs.forEach(r => console.log(`     - ${r.id} ${r.name} → ${r.result?.name}`))
    }
  }
}
if (conflictCount === 0) {
  console.log('  ✅ 无Priority冲突（同优先级Rule的Result均相同）')
}
console.log()

// 5. 检测重复Name
console.log('[5] 重复Name检测：')
const nameCount = new Map<string, number>()
for (const r of rules) {
  nameCount.set(r.name, (nameCount.get(r.name) || 0) + 1)
}
const duplicateNames = Array.from(nameCount.entries()).filter(([_, c]) => c > 1)
console.log(`  发现 ${duplicateNames.length} 个重复Name：`)
for (const [name, count] of duplicateNames) {
  console.log(`  ⚠️ "${name}" 出现 ${count} 次`)
  const dupes = rules.filter(r => r.name === name)
  dupes.forEach(r => console.log(`     - ${r.id}(P${r.priority})`))
}
console.log()

// 6. 检测category混乱（同id模式但category不同）
console.log('[6] Category一致性检测：')
const categoryPatterns: { pattern: string; categories: Set<string> }[] = []
for (const r of rules) {
  // 从id中提取模式
  const parts = r.id.split('-')
  const pattern = parts.slice(0, 2).join('-')
  let entry = categoryPatterns.find(p => p.pattern === pattern)
  if (!entry) {
    entry = { pattern, categories: new Set() }
    categoryPatterns.push(entry)
  }
  entry.categories.add(r.category)
}

const categoryConflicts = categoryPatterns.filter(p => p.categories.size > 1)
if (categoryConflicts.length > 0) {
  console.log(`  发现 ${categoryConflicts.length} 个id模式有不同category：`)
  for (const c of categoryConflicts.slice(0, 10)) {
    console.log(`    "${c.pattern}*" → [${Array.from(c.categories).join(', ')}]`)
  }
} else {
  console.log('  ✅ 所有id模式对应单一category')
}
console.log()

// 导出汇总JSON
const summary = {
  duplicateIds: duplicateIds.map(([id, count]) => ({ id, count })),
  duplicateConditions: duplicateConds.map(([_, rs]) => ({
    condition: rs[0].condition.toString().slice(0, 100),
    rules: rs.map(r => ({ id: r.id, name: r.name, priority: r.priority, category: r.category }))
  })),
  duplicateResults: duplicateResults.map(([key, rs]) => ({
    result: JSON.parse(key),
    rules: rs.map(r => ({ id: r.id, name: r.name, priority: r.priority }))
  })),
  priorityConflicts: conflicts.map(c => ({
    priority: c.priority,
    rules: c.rules.map(r => ({ id: r.id, name: r.name, result: r.result?.name }))
  })),
  duplicateNames: duplicateNames.map(([name, count]) => ({
    name,
    count,
    rules: rules.filter(r => r.name === name).map(r => ({ id: r.id, priority: r.priority }))
  })),
}

const outputPath = '/workspace/coverage-reports/duplicate-rules.json'
fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2))
console.log(`✅ duplicate-rules.json → ${outputPath}`)

console.log()
console.log('='.repeat(80))
console.log('汇总')
console.log('='.repeat(80))
console.log(`- 重复ID: ${duplicateIds.length}个`)
console.log(`- Condition相同: ${duplicateConds.length}组`)
console.log(`- Result相同: ${duplicateResults.length}组`)
console.log(`- Priority冲突: ${conflicts.length}组`)
console.log(`- Name重复: ${duplicateNames.length}个`)
