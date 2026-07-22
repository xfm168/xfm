import { calculateBaZiFromBirthData } from './src/lib/bazi/calculator.ts'
import { runBaZiPipelineFromBirthData } from './src/lib/bazi/pipeline/index.ts'
import { generateFullReport } from './src/lib/bazi/fullReport.ts'

console.log('=== 八字命理真实运行测试 ===\n')

const birthData = {
  birthday: '1990-05-15',
  birthTime: '10:30',
  gender: 'male',
  location: '北京'
}

console.log('1. 测试排盘 calculateBaZiFromBirthData...')
try {
  const chart = calculateBaZiFromBirthData(birthData)
  console.log('   ✓ 排盘成功')
  console.log('   四柱:', 
    chart.sixLines.year.gan + chart.sixLines.year.zhi,
    chart.sixLines.month.gan + chart.sixLines.month.zhi,
    chart.sixLines.day.gan + chart.sixLines.day.zhi,
    chart.sixLines.hour.gan + chart.sixLines.hour.zhi
  )
  console.log('   日主:', chart.dayMaster.dayGan, chart.dayMaster.dayGanElement)
  console.log('   旺衰:', chart.dayMaster.wangShuai)
  console.log('   喜用神:', chart.xiYongShen.bestElement)
  console.log('   格局:', chart.geJu ? chart.geJu.name : 'null')

  console.log('\n2. 测试 Pipeline runBaZiPipelineFromBirthData...')
  const steps = []
  const pipelineResult = await runBaZiPipelineFromBirthData({ birthData }, (step) => {
    steps.push(step.text)
  })
  
  console.log('   ✓ Pipeline 完成')
  console.log('   步骤数:', steps.length)
  console.log('   步骤:', steps.map(s => s.substring(0, 20)).join(' → '))
  
  if (pipelineResult) {
    console.log('\n3. 测试 fullReport 生成...')
    try {
      const reportInput = {
        chart,
        dayMaster: chart.dayMaster,
        sixLines: chart.sixLines,
        geJu: chart.geJu,
        xiYongShen: chart.xiYongShen,
        fiveElementPower: pipelineResult.fiveElementPower,
        shenShiAnalysis: pipelineResult.shenShiAnalysis,
        shenSha: chart.shenSha,
        marriage: pipelineResult.marriage,
        wealth: pipelineResult.wealth,
        career: pipelineResult.career,
        health: pipelineResult.health,
        fengshui: pipelineResult.fengshui,
        daYun: pipelineResult.daYun,
        liuNian: pipelineResult.liuNian,
        liuYue: pipelineResult.liuYue,
      }
      const fullReport = generateFullReport(reportInput)
      console.log('   ✓ 报告生成成功')
      console.log('   章节数:', fullReport.chapters.length)
      console.log('   总字数:', fullReport.wordCount.toLocaleString())
      console.log('   章节列表:')
      fullReport.chapters.forEach((ch, i) => {
        console.log(`   ${i + 1}. ${ch.title} (${ch.content.length}字)`)
      })
    } catch (e) {
      console.log('   ✗ 报告生成失败:', e.message)
      console.log('   堆栈:', e.stack)
    }
  } else {
    console.log('   ✗ pipelineResult 为 null')
  }

} catch (e) {
  console.log('   ✗ 排盘失败:', e.message)
  console.log('   堆栈:', e.stack)
}
