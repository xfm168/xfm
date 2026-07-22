import { getHexagramByNumber } from './src/lib/hexagram.ts'
import { buildAnalysis, castHexagram } from './src/lib/divination.ts'

console.log('=== 六爻占卜真实运行测试 ===\n')

console.log('1. 测试卦象查询 getHexagramByNumber...')
try {
  const hex1 = getHexagramByNumber(1)
  console.log('   ✓ 第1卦:', hex1.name, `(${hex1.symbol})`)
  console.log('   卦辞:', (hex1.description || '').substring(0, 50) + '...')
  
  const hex64 = getHexagramByNumber(64)
  console.log('   ✓ 第64卦:', hex64.name, `(${hex64.symbol})`)
} catch (e) {
  console.log('   ✗ 失败:', e.message)
}

console.log('\n2. 测试起卦 castHexagram...')
try {
  const result = castHexagram()
  console.log('   ✓ 起卦成功')
  console.log('   本卦编号:', result.hexagramNumber)
  console.log('   变卦编号:', result.changedHexagramNumber)
  console.log('   动爻数:', result.changingPositions.length)
  console.log('   本卦名:', getHexagramByNumber(result.hexagramNumber).name)
  if (result.changedHexagramNumber) {
    console.log('   变卦名:', getHexagramByNumber(result.changedHexagramNumber).name)
  }
} catch (e) {
  console.log('   ✗ 失败:', e.message)
  console.log('   堆栈:', e.stack)
}

console.log('\n3. 测试解卦 buildAnalysis（本卦+变卦）...')
try {
  const hex = getHexagramByNumber(1)
  const changed = getHexagramByNumber(2)
  const analysis = buildAnalysis(hex, changed, 'career', '工作晋升')
  console.log('   ✓ 解卦成功')
  console.log('   分析长度:', analysis.length, '字')
  console.log('   开头:', analysis.substring(0, 100) + '...')
} catch (e) {
  console.log('   ✗ 失败:', e.message)
  console.log('   堆栈:', e.stack)
}

console.log('\n4. 测试解卦 buildAnalysis（无变卦）...')
try {
  const hex = getHexagramByNumber(5)
  const analysis = buildAnalysis(hex, null, 'love', '感情发展')
  console.log('   ✓ 解卦成功（无变卦）')
  console.log('   分析长度:', analysis.length, '字')
  console.log('   开头:', analysis.substring(0, 100) + '...')
} catch (e) {
  console.log('   ✗ 失败:', e.message)
  console.log('   堆栈:', e.stack)
}

console.log('\n5. 测试所有64卦完整性...')
try {
  let errors = 0
  let missingFields = {}
  for (let i = 1; i <= 64; i++) {
    const h = getHexagramByNumber(i)
    if (!h || !h.name || !h.symbol) {
      errors++
    }
    for (const f of ['name', 'symbol', 'description', 'fortune', 'career', 'wealth', 'love', 'health']) {
      if (!h[f]) {
        missingFields[f] = (missingFields[f] || 0) + 1
      }
    }
  }
  console.log('   ✓ 64卦基本完整' + (errors > 0 ? `，${errors}个有问题` : ''))
  if (Object.keys(missingFields).length > 0) {
    console.log('   缺失字段统计:', JSON.stringify(missingFields))
  }
} catch (e) {
  console.log('   ✗ 失败:', e.message)
}

console.log('\n6. 测试所有分类都能正确解卦...')
try {
  const categories = ['career', 'wealth', 'love', 'health', 'general', 'family', 'study']
  const hex = getHexagramByNumber(11)
  let failed = []
  for (const cat of categories) {
    try {
      const r = buildAnalysis(hex, null, cat, '测试问题')
      if (!r || r.length < 10) failed.push(cat + '(空)')
    } catch (e) {
      failed.push(cat + '(' + e.message + ')')
    }
  }
  if (failed.length === 0) {
    console.log('   ✓ 所有分类都能正常解卦')
  } else {
    console.log('   ✗ 失败分类:', failed.join(', '))
  }
} catch (e) {
  console.log('   ✗ 失败:', e.message)
}
