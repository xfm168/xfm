/**
 * V4.2 报告内容质量检查
 * 检查报告的12章节内容、排版、数据完整性
 */

import { runFullPipeline } from '../src/lib/fengshui/pipeline'

const TEST_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

async function main() {
  console.log('='.repeat(60))
  console.log('V4.2 报告内容质量检查')
  console.log('='.repeat(60))

  const result = await runFullPipeline({
    imageData: TEST_IMAGE,
    roomType: 'living',
    mode: 'standard',
  })

  if (!result.report) {
    console.error('❌ 报告生成失败')
    return
  }

  const report = result.report

  console.log('\n📊 一、报告基本信息')
  console.log('-'.repeat(40))
  console.log(`标题: ${report.title}`)
  console.log(`综合评分: ${report.overallScore}`)
  console.log(`置信度: ${report.confidence}%`)
  console.log(`章节数: ${report.sections.length}`)

  console.log('\n📋 二、12章节完整性检查')
  console.log('-'.repeat(40))
  const expectedSections = [
    '综合评分', '房屋概况', '户型分析', '房间分析', '空间分析', '家具分析',
    '风险问题', '古籍依据', 'AI解读', '整改方案', '预计提升', '注意事项'
  ]
  
  let allPresent = true
  expectedSections.forEach((name, i) => {
    const found = report.sections.some(s => s.title.includes(name) || s.title.includes(name.replace(/分析$/, '')))
    console.log(`${found ? '✅' : '❌'} ${i + 1}. ${name}`)
    if (!found) allPresent = false
  })

  console.log('\n📝 三、各章节内容质量')
  console.log('-'.repeat(40))
  report.sections.forEach((section, i) => {
    const contentLength = section.content?.length || 0
    const hasContent = contentLength > 50
    console.log(`${i + 1}. ${section.title}`)
    console.log(`   内容长度: ${contentLength} 字符 ${hasContent ? '✅' : '⚠️'}`)
    // 打印前100字预览
    if (section.content) {
      console.log(`   预览: ${section.content.substring(0, 80)}...`)
    }
  })

  console.log('\n🔗 四、证据链检查')
  console.log('-'.repeat(40))
  console.log(`证据链数量: ${result.evidenceChains?.length || 0}`)
  if (result.evidenceChains && result.evidenceChains.length > 0) {
    console.log('✅ 证据链正常')
    const chain = result.evidenceChains[0]
    console.log(`   第一条: ${chain.conclusion.substring(0, 50)}...`)
    console.log(`   引用数: ${chain.references.length}`)
  } else {
    console.log('⚠️  证据链为空')
  }

  console.log('\n⚡ 五、Pipeline 步骤状态')
  console.log('-'.repeat(40))
  result.steps.forEach(step => {
    const icon = step.status === 'completed' ? '✅' : step.status === 'error' ? '❌' : step.status === 'running' ? '⏳' : '⏸️'
    console.log(`${icon} ${step.name} - ${step.status}`)
  })

  console.log('\n' + '='.repeat(60))
  console.log('检查完成')
  console.log('='.repeat(60))
}

main().catch(console.error)
