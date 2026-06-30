/**
 * 风水报告生成服务 V4
 * 
 * 固定报告模板（12个部分），AI 不允许自由发挥结构：
 * ① 综合评分
 * ② 房屋基本信息
 * ③ 户型分析
 * ④ 房间评分
 * ⑤ 空间关系分析
 * ⑥ 家具布局分析
 * ⑦ 风险问题
 * ⑧ 古籍依据
 * ⑨ AI综合解读
 * ⑩ 优先整改顺序
 * ⑪ 调整后预计提升
 * ⑫ 注意事项
 */

import { AIService } from '../../services/ai/AIService'
import { analyzeFengShui } from './analyzer'
import { analyzeImage } from './aiImageAnalyzer'
import { convertToFengShuiContext, type FengShuiReport, type ImageAnalysisResult, type ImageAnalysisRequest } from './imageAnalyzer'
import type { FengShuiResult } from './types'
import { knowledgeBase } from './knowledge'

const aiService = new AIService({
  defaultProvider: 'supabase-edge',
  fallbackProviders: ['gemini', 'openai'],
})

/**
 * 报告模板类型定义
 */
export interface ReportSection {
  id: string
  title: string
  order: number
  type: 'summary' | 'info' | 'analysis' | 'risk' | 'evidence' | 'suggestion' | 'warning'
  content: string
  data?: any
}

export const REPORT_TEMPLATE_SECTIONS = [
  { id: 'overall-score', title: '一、综合评分', order: 1, type: 'summary' },
  { id: 'house-info', title: '二、房屋基本信息', order: 2, type: 'info' },
  { id: 'layout-analysis', title: '三、户型分析', order: 3, type: 'analysis' },
  { id: 'room-scores', title: '四、房间评分', order: 4, type: 'analysis' },
  { id: 'spatial-relations', title: '五、空间关系分析', order: 5, type: 'analysis' },
  { id: 'furniture-layout', title: '六、家具布局分析', order: 6, type: 'analysis' },
  { id: 'risk-issues', title: '七、风险问题', order: 7, type: 'risk' },
  { id: 'classical-evidence', title: '八、古籍依据', order: 8, type: 'evidence' },
  { id: 'ai-interpretation', title: '九、AI综合解读', order: 9, type: 'analysis' },
  { id: 'improvement-priority', title: '十、优先整改顺序', order: 10, type: 'suggestion' },
  { id: 'expected-improvement', title: '十一、调整后预计提升', order: 11, type: 'suggestion' },
  { id: 'cautions', title: '十二、注意事项', order: 12, type: 'warning' },
]

/**
 * 完整的风水分析流程
 */
export async function generateFengShuiReport(
  imageData: string,
  options?: {
    analysisType?: 'room' | 'layout' | 'furniture' | 'full'
    roomType?: string
    includeAI?: boolean
    ownerInfo?: {
      dayGan?: string
      dayElement?: string
      xiYongShen?: string
    }
  }
): Promise<FengShuiReport> {
  const reportId = generateReportId()
  const startTime = Date.now()
  
  const report: FengShuiReport = {
    id: reportId,
    createdAt: new Date().toISOString(),
    input: {
      imageData,
    },
    imageAnalysis: {
      detectedObjects: [],
      roomInfo: {
        type: 'unknown',
        size: 'medium',
        hasNaturalLight: true,
        mainDirection: 'south',
        shape: 'rectangle',
      },
      furniture: [],
      elementDistribution: {
        '木': 2,
        '火': 2,
        '土': 2,
        '金': 2,
        '水': 2,
      },
      overallConfidence: 0,
    },
    fengshuiAnalysis: {
      context: {} as any,
      result: {} as any,
    },
    aiSuggestions: {
      summary: '',
      priorities: [],
      tips: [],
    },
    report: {
      title: '风水分析报告',
      sections: [],
    },
    status: 'analyzing',
  }
  
  try {
    // Step 1: 图片分析
    console.log('[报告生成] Step 1: 图片分析...')
    const imageRequest: ImageAnalysisRequest = {
      imageData,
      analysisType: options?.analysisType || 'full',
      options: {
        includeDirections: true,
        includeElementAnalysis: true,
        roomType: options?.roomType,
      },
    }
    
    report.imageAnalysis = await analyzeImage(imageRequest)
    
    if (report.imageAnalysis.error) {
      console.warn('[报告生成] 图片分析有误:', report.imageAnalysis.error)
    }
    
    // Step 2: 转换为FengShuiContext
    console.log('[报告生成] Step 2: 转换为FengShuiContext...')
    const context = convertToFengShuiContext(report.imageAnalysis, {
      ownerBazi: options?.ownerInfo ? {
        dayGan: options.ownerInfo.dayGan || '甲',
        dayElement: options.ownerInfo.dayElement as any || '木',
        xiYongShen: options.ownerInfo.xiYongShen as any || '水',
      } : undefined,
    })
    
    report.fengshuiAnalysis.context = context
    
    // Step 3: 执行规则引擎
    console.log('[报告生成] Step 3: 执行规则引擎...')
    const fengshuiResult = analyzeFengShui(context)
    report.fengshuiAnalysis.result = fengshuiResult
    
    // Step 4: 生成固定模板报告（12部分）
    console.log('[报告生成] Step 4: 生成固定模板报告...')
    const sections = await generateV4ReportSections(report, fengshuiResult)
    report.report.sections = sections
    report.report.title = `${report.imageAnalysis.roomInfo.type}风水分析报告`
    
    report.status = 'completed'
    
    const duration = Date.now() - startTime
    console.log(`[报告生成] 完成，耗时: ${duration}ms`)
    
    return report
  } catch (error) {
    console.error('[报告生成] 失败:', error)
    report.status = 'failed'
    report.error = error instanceof Error ? error.message : '报告生成失败'
    return report
  }
}

/**
 * 生成 V4 固定模板的 12 个部分
 */
async function generateV4ReportSections(
  report: FengShuiReport,
  result: FengShuiResult
): Promise<ReportSection[]> {
  const sections: ReportSection[] = []
  
  // ① 综合评分
  sections.push(generateOverallScoreSection(result))
  
  // ② 房屋基本信息
  sections.push(generateHouseInfoSection(report.imageAnalysis, result))
  
  // ③ 户型分析
  sections.push(generateLayoutAnalysisSection(result))
  
  // ④ 房间评分
  sections.push(generateRoomScoresSection(result))
  
  // ⑤ 空间关系分析
  sections.push(generateSpatialRelationsSection(result))
  
  // ⑥ 家具布局分析
  sections.push(generateFurnitureLayoutSection(report.imageAnalysis, result))
  
  // ⑦ 风险问题
  sections.push(generateRiskIssuesSection(result))
  
  // ⑧ 古籍依据
  sections.push(generateClassicalEvidenceSection(result))
  
  // ⑨ AI综合解读
  const aiSection = await generateAIInterpretationSection(result, report.imageAnalysis)
  sections.push(aiSection)
  
  // ⑩ 优先整改顺序
  sections.push(generateImprovementPrioritySection(result))
  
  // ⑪ 调整后预计提升
  sections.push(generateExpectedImprovementSection(result))
  
  // ⑫ 注意事项
  sections.push(generateCautionsSection(result))
  
  return sections
}

// ========== 各部分生成函数 ==========

function generateOverallScoreSection(result: FengShuiResult): ReportSection {
  return {
    id: 'overall-score',
    title: '一、综合评分',
    order: 1,
    type: 'summary',
    data: {
      overallScore: result.overallScore,
      confidence: result.confidence,
      level: getScoreLevel(result.overallScore),
      directionScore: result.directionScore,
      layoutScore: result.layoutScore,
      roomScore: result.roomScore,
      elementScore: result.elementScore,
      environmentScore: result.environmentScore,
      strengths: result.strengths.slice(0, 5),
      weaknesses: result.weaknesses.slice(0, 5),
    },
    content: `## 综合评分：${result.overallScore} 分（${getScoreLevel(result.overallScore)}）

**置信度：** ${result.confidence}%

### 分项评分
| 项目 | 评分 | 等级 |
|------|------|------|
| 朝向 | ${result.directionScore} | ${getScoreLevel(result.directionScore)} |
| 户型 | ${result.layoutScore} | ${getScoreLevel(result.layoutScore)} |
| 房间 | ${result.roomScore} | ${getScoreLevel(result.roomScore)} |
| 五行 | ${result.elementScore} | ${getScoreLevel(result.elementScore)} |
| 环境 | ${result.environmentScore} | ${getScoreLevel(result.environmentScore)} |

### 主要优势
${result.strengths.slice(0, 5).map(s => `✅ ${s}`).join('\n')}

### 主要问题
${result.weaknesses.slice(0, 5).map(w => `⚠️ ${w}`).join('\n')}`,
  }
}

function generateHouseInfoSection(imageAnalysis: ImageAnalysisResult, result: FengShuiResult): ReportSection {
  const roomInfo = imageAnalysis.roomInfo
  const context = (result as any).context || {}
  
  return {
    id: 'house-info',
    title: '二、房屋基本信息',
    order: 2,
    type: 'info',
    data: {
      roomType: roomInfo.type,
      size: roomInfo.size,
      shape: roomInfo.shape,
      mainDirection: roomInfo.mainDirection,
      hasNaturalLight: roomInfo.hasNaturalLight,
      elementDistribution: imageAnalysis.elementDistribution,
      detectedFurniture: imageAnalysis.furniture?.length || 0,
    },
    content: `## 房屋基本信息

| 项目 | 信息 |
|------|------|
| 房屋类型 | ${roomInfo.type} |
| 空间大小 | ${roomInfo.size} |
| 空间形状 | ${roomInfo.shape} |
| 主朝向 | ${directionToChinese(roomInfo.mainDirection)} |
| 自然采光 | ${roomInfo.hasNaturalLight ? '有' : '无'} |
| 识别家具数 | ${imageAnalysis.furniture?.length || 0} 件 |

### 五行分布
${Object.entries(imageAnalysis.elementDistribution || {}).map(([element, count]) => {
  const bars = '█'.repeat(Math.max(1, Math.min(10, (count as number) * 2)))
  return `- ${element}: ${bars} (${count})`
}).join('\n')}`,
  }
}

function generateLayoutAnalysisSection(result: FengShuiResult): ReportSection {
  const layoutAnalysis = (result as any).layoutAnalysis || {}
  
  return {
    id: 'layout-analysis',
    title: '三、户型分析',
    order: 3,
    type: 'analysis',
    data: layoutAnalysis,
    content: `## 户型分析

**户型评分：** ${result.layoutScore} 分（${getScoreLevel(result.layoutScore)}）

### 户型优势
${(layoutAnalysis.strengths || ['户型方正，布局合理']).slice(0, 5).map((s: string) => `✅ ${s}`).join('\n')}

### 户型问题
${(layoutAnalysis.weaknesses || ['暂无明显问题']).slice(0, 5).map((w: string) => `⚠️ ${w}`).join('\n')}

### 户型特点
- **完整性：** ${layoutAnalysis.isMissingCorner ? '有缺角' : '户型方正'}
- **采光面：** ${layoutAnalysis.lightSides || '多面采光'}
- **通透度：** ${layoutAnalysis.ventilation || '良好'}`,
  }
}

function generateRoomScoresSection(result: FengShuiResult): ReportSection {
  const roomResults = (result as any).roomResults || []
  
  return {
    id: 'room-scores',
    title: '四、房间评分',
    order: 4,
    type: 'analysis',
    data: { roomResults },
    content: `## 各房间评分

| 房间 | 评分 | 等级 | 主要特点 |
|------|------|------|----------|
${roomResults.length > 0 
  ? roomResults.map((r: any) => `| ${roomTypeToName(r.roomType)} | ${r.score} | ${getScoreLevel(r.score)} | ${(r.tags || []).slice(0, 2).join('、')} |`).join('\n')
  : '| 全屋 | ' + result.roomScore + ' | ' + getScoreLevel(result.roomScore) + ' | 整体评估 |'
}

### 房间分布说明
${roomResults.length > 0 
  ? `本次共分析 ${roomResults.length} 个房间，平均得分 ${Math.round(roomResults.reduce((a: number, b: any) => a + b.score, 0) / roomResults.length)} 分。`
  : '本次为单房间/整体评估。'
}`,
  }
}

function generateSpatialRelationsSection(result: FengShuiResult): ReportSection {
  const spatial = (result as any).spatial || {}
  const spatialJi = spatial.spatialJi || []
  const spatialSha = spatial.spatialSha || []
  
  return {
    id: 'spatial-relations',
    title: '五、空间关系分析',
    order: 5,
    type: 'analysis',
    data: { spatialJi, spatialSha },
    content: `## 空间关系分析

### 吉位格局
${spatialJi.length > 0 
  ? spatialJi.map((j: any) => `✅ **${j.name}**\n   ${j.description || ''}`).join('\n\n')
  : '暂无明显吉位格局。'
}

### 煞位/问题
${spatialSha.length > 0 
  ? spatialSha.map((s: any) => `⚠️ **${s.name}**\n   ${s.description || ''}\n   严重度：${s.severity || '中'}`).join('\n\n')
  : '暂无明显煞位。'
}

### 空间建议
${spatialJi.length > 0 
  ? '充分利用吉位，将重要家具（床、沙发、书桌）放在吉位。' 
  : '建议根据实际方位调整布局。'
}`,
  }
}

function generateFurnitureLayoutSection(imageAnalysis: ImageAnalysisResult, result: FengShuiResult): ReportSection {
  const furniture = imageAnalysis.furniture || []
  
  return {
    id: 'furniture-layout',
    title: '六、家具布局分析',
    order: 6,
    type: 'analysis',
    data: { furniture },
    content: `## 家具布局分析

**识别家具：** ${furniture.length} 件

### 家具清单
${furniture.length > 0 
  ? furniture.map((f: any) => `- ${furnitureTypeToName(f.type)}（${f.position || '位置未知'}）`).join('\n')
  : '暂未识别到具体家具。'
}

### 布局评价
${furniture.length > 3 
  ? '家具布置较为充实，注意保持动线通畅。'
  : furniture.length > 0 
    ? '家具数量适中，布局合理。' 
    : '建议根据房间功能适当布置家具。'
}

### 动线分析
- **主要动线：** ${furniture.length > 0 ? '建议保持 80cm 以上通行宽度' : '待评估'}
- **空间利用率：** ${furniture.length > 5 ? '较高' : '中等'}`,
  }
}

function generateRiskIssuesSection(result: FengShuiResult): ReportSection {
  const issues = (result as any).hitRules?.filter((r: any) => r.result?.type === 'inauspicious' || r.result?.type === 'warning') || []
  const warnings = result.warnings || []
  
  return {
    id: 'risk-issues',
    title: '七、风险问题',
    order: 7,
    type: 'risk',
    data: { issues, warnings },
    content: `## 风险问题

### 高风险问题
${issues.length > 0 
  ? issues.slice(0, 5).map((issue: any, idx: number) => {
      return `${idx + 1}. ⚠️ **${issue.name}**\n   - 影响：${(issue.impact?.health ? '健康 ' : '') + (issue.impact?.wealth ? '财运 ' : '') + (issue.impact?.career ? '事业 ' : '') + (issue.impact?.relationship ? '感情 ' : '')}\n   - 严重度：${(issue.priority || 50) > 80 ? '高' : (issue.priority || 50) > 60 ? '中' : '低'}\n   - 置信度：${issue.confidence || 70}%`
    }).join('\n\n')
  : '暂无高风险问题。'
}

### 注意事项
${warnings.length > 0 
  ? warnings.map((w: string) => `📌 ${w}`).join('\n')
  : '暂无特别注意事项。'
}`,
  }
}

function generateClassicalEvidenceSection(result: FengShuiResult): ReportSection {
  const hitRules = (result as any).hitRules || []
  
  // 收集所有引用的古籍
  const references: { book: string; entries: any[] }[] = []
  const bookMap = new Map<string, any[]>()
  
  for (const rule of hitRules) {
    if (rule.referenceIds && rule.referenceIds.length > 0) {
      for (const refId of rule.referenceIds) {
        const entry = knowledgeBase.getEntryById(refId) || knowledgeBase.getModernEntryById(refId)
        if (entry) {
          const bookName = entry.bookName || '现代风水'
          if (!bookMap.has(bookName)) {
            bookMap.set(bookName, [])
          }
          bookMap.get(bookName)!.push({
            ruleId: rule.id,
            ruleName: rule.name,
            entry,
          })
        }
      }
    }
  }
  
  for (const [book, entries] of bookMap.entries()) {
    references.push({ book, entries })
  }
  
  return {
    id: 'classical-evidence',
    title: '八、古籍依据',
    order: 8,
    type: 'evidence',
    data: { references, hitRulesCount: hitRules.length },
    content: `## 古籍依据

本次分析共引用 ${references.length} 部古籍/文献，涉及 ${hitRules.length} 条规则。

${references.slice(0, 5).map((ref, idx) => {
  return `### ${idx + 1}. 《${ref.book}》

${ref.entries.slice(0, 3).map(e => `> **${e.ruleName}**
> 
> 原文：${e.entry.original || e.entry.summary || '无'}
> 
> 解释：${e.entry.translation || e.entry.explanation || '无'}`).join('\n\n')}
`
}).join('\n')}

${references.length > 5 ? `\n另有 ${references.length - 5} 部古籍引用...` : ''}`,
  }
}

async function generateAIInterpretationSection(
  result: FengShuiResult,
  imageAnalysis: ImageAnalysisResult
): Promise<ReportSection> {
  try {
    const prompt = buildV4InterpretationPrompt(result, imageAnalysis)
    
    const response = await aiService.chat([
      { role: 'user', content: prompt },
    ], {
      model: 'supabase-edge',
    })
    
    return {
      id: 'ai-interpretation',
      title: '九、AI综合解读',
      order: 9,
      type: 'analysis',
      data: { aiGenerated: true },
      content: `## AI综合解读\n\n${response.content}`,
    }
  } catch (error) {
    console.warn('[AI解读] 生成失败:', error)
    return {
      id: 'ai-interpretation',
      title: '九、AI综合解读',
      order: 9,
      type: 'analysis',
      data: { aiGenerated: false },
      content: `## AI综合解读

根据风水分析结果，您的房屋整体风水${getScoreLevel(result.overallScore)}，综合得分 ${result.overallScore} 分。

### 整体运势
- **财运：** 整体财运${result.overallScore > 70 ? '较旺' : '一般'}，${result.overallScore > 70 ? '有较好的聚财能力' : '建议通过调整布局提升财运'}
- **事业：** 事业运${result.directionScore > 70 ? '顺利' : '有提升空间'}
- **健康：** 健康运${result.environmentScore > 70 ? '良好' : '需要注意'}
- **感情：** 感情运${result.roomScore > 70 ? '和睦' : '需经营'}

### 总结
建议优先处理主要问题，逐步调整布局，整体运势有望提升。`,
    }
  }
}

function generateImprovementPrioritySection(result: FengShuiResult): ReportSection {
  const hitRules = (result as any).hitRules || []
  const issues = hitRules
    .filter((r: any) => r.result?.type === 'inauspicious' || r.result?.type === 'warning')
    .sort((a: any, b: any) => (b.priority || 50) - (a.priority || 50))
  
  return {
    id: 'improvement-priority',
    title: '十、优先整改顺序',
    order: 10,
    type: 'suggestion',
    data: { issues, totalIssues: issues.length },
    content: `## 优先整改顺序

共发现 ${issues.length} 项需要改善的问题，建议按以下优先级进行整改：

${issues.length > 0 
  ? issues.slice(0, 8).map((issue: any, idx: number) => {
      return `### ${idx + 1}. ${issue.name}

- **优先级：** ${(issue.priority || 50) > 80 ? '🔴 高' : (issue.priority || 50) > 60 ? '🟡 中' : '🟢 低'}
- **影响方面：** ${formatImpact(issue.impact)}
- **改善建议：** ${issue.improvement || '建议咨询专业人士'}
- **预计提升：** +${calculateExpectedImprovement(issue)} 分`
    }).join('\n\n')
  : '暂无需要整改的问题，继续保持良好布局！'
}`,
  }
}

function generateExpectedImprovementSection(result: FengShuiResult): ReportSection {
  const hitRules = (result as any).hitRules || []
  const issues = hitRules.filter((r: any) => r.result?.type === 'inauspicious' || r.result?.type === 'warning')
  
  // 计算各方面预计提升
  const expectedImprovements = {
    overall: Math.min(25, issues.length * 3),
    wealth: Math.min(15, issues.filter((i: any) => i.impact?.wealth).length * 3),
    health: Math.min(15, issues.filter((i: any) => i.impact?.health).length * 3),
    career: Math.min(15, issues.filter((i: any) => i.impact?.career).length * 3),
    relationship: Math.min(15, issues.filter((i: any) => i.impact?.relationship).length * 3),
  }
  
  const newScore = Math.min(100, result.overallScore + expectedImprovements.overall)
  
  return {
    id: 'expected-improvement',
    title: '十一、调整后预计提升',
    order: 11,
    type: 'suggestion',
    data: { expectedImprovements, currentScore: result.overallScore, newScore },
    content: `## 调整后预计提升

如果按优先顺序完成所有整改，预计各方面提升如下：

| 方面 | 当前 | 预计提升 | 调整后 |
|------|------|----------|--------|
| 综合评分 | ${result.overallScore} | +${expectedImprovements.overall} | ${newScore} |
| 财运 | - | +${expectedImprovements.wealth} | - |
| 健康 | - | +${expectedImprovements.health} | - |
| 事业 | - | +${expectedImprovements.career} | - |
| 感情 | - | +${expectedImprovements.relationship} | - |

### 提升说明
- 以上为**理论最大提升值**，实际效果因个人命卦、具体调整方式而异
- 建议按优先级逐步调整，每调整一项观察效果
- 重大调整建议咨询专业风水师

### 调整后等级
从 **${getScoreLevel(result.overallScore)}** 提升至 **${getScoreLevel(newScore)}**`,
  }
}

function generateCautionsSection(result: FengShuiResult): ReportSection {
  const warnings = result.warnings || []
  
  return {
    id: 'cautions',
    title: '十二、注意事项',
    order: 12,
    type: 'warning',
    data: { warnings },
    content: `## 注意事项

### 风水调理须知

1. **风水是辅助，不是万能**
   风水是环境心理学的体现，能辅助提升运势，但根本还在于个人努力和行善积德。

2. **调整宜缓不宜急**
   建议一项一项调整，观察效果后再进行下一项，不要一次性大动。

3. **以人为本**
   风水布局应以居住者的舒适感为准，自己觉得舒服最重要。

4. **结合命理**
   最佳布局需结合个人生辰八字，本报告为通用分析，个性化建议请咨询专业人士。

5. **心存善念**
   福人居福地，福地福人居。心存善念，多行善事，自然有福报。

${warnings.length > 0 ? `### 特别提醒\n\n${warnings.map((w: string) => `⚠️ ${w}`).join('\n')}\n` : ''}
---

*本报告由 AI 自动生成，仅供参考，不构成任何决策依据。*`,
  }
}

// ========== 辅助函数 ==========

function getScoreLevel(score: number): string {
  if (score >= 90) return '极佳'
  if (score >= 80) return '优秀'
  if (score >= 70) return '良好'
  if (score >= 60) return '中等'
  if (score >= 50) return '一般'
  return '较差'
}

function directionToChinese(dir: string): string {
  const map: Record<string, string> = {
    north: '正北',
    south: '正南',
    east: '正东',
    west: '正西',
    northeast: '东北',
    southeast: '东南',
    northwest: '西北',
    southwest: '西南',
  }
  return map[dir] || dir
}

function roomTypeToName(type: string): string {
  const map: Record<string, string> = {
    house: '全屋',
    entrance: '玄关',
    'living-room': '客厅',
    living: '客厅',
    'master-bedroom': '主卧',
    bedroom: '卧室',
    study: '书房',
    kitchen: '厨房',
    bathroom: '卫生间',
    'dining-room': '餐厅',
    dining: '餐厅',
    balcony: '阳台',
  }
  return map[type] || type
}

function furnitureTypeToName(type: string): string {
  const map: Record<string, string> = {
    sofa: '沙发',
    bed: '床',
    table: '桌子',
    chair: '椅子',
    desk: '书桌',
    cabinet: '柜子',
    wardrobe: '衣柜',
    tv: '电视',
    plant: '植物',
    stove: '灶台',
    sink: '水槽',
    toilet: '马桶',
    mirror: '镜子',
    door: '门',
    window: '窗户',
  }
  return map[type] || type
}

function formatImpact(impact: any): string {
  if (!impact) return '综合影响'
  const parts: string[] = []
  if (impact.health) parts.push('健康')
  if (impact.wealth) parts.push('财运')
  if (impact.career) parts.push('事业')
  if (impact.relationship) parts.push('感情')
  if (impact.study) parts.push('学业')
  return parts.length > 0 ? parts.join('、') : '综合影响'
}

function calculateExpectedImprovement(issue: any): number {
  const priority = issue.priority || 50
  const weight = issue.weight || 50
  return Math.round((priority / 100) * (weight / 100) * 10)
}

function buildV4InterpretationPrompt(result: FengShuiResult, imageAnalysis: ImageAnalysisResult): string {
  return `请作为专业风水师，对以下风水分析结果进行综合解读。

【基本信息】
- 房屋类型：${imageAnalysis.roomInfo.type}
- 主朝向：${directionToChinese(imageAnalysis.roomInfo.mainDirection)}
- 综合评分：${result.overallScore}/100
- 置信度：${result.confidence}%

【分项评分】
- 朝向：${result.directionScore}分
- 户型：${result.layoutScore}分
- 房间：${result.roomScore}分
- 五行：${result.elementScore}分
- 环境：${result.environmentScore}分

【主要优势】
${result.strengths.slice(0, 5).map(s => `- ${s}`).join('\n')}

【主要问题】
${result.weaknesses.slice(0, 5).map(w => `- ${w}`).join('\n')}

【识别到的家具】
${imageAnalysis.furniture?.slice(0, 8).map((f: any) => `- ${furnitureTypeToName(f.type)}（${f.position || '位置未知'}）`).join('\n') || '暂无'}

请从以下几个方面进行综合解读：
1. 整体风水格局评价
2. 财运分析与建议
3. 事业运分析与建议
4. 健康运分析与建议
5. 感情/家庭运分析与建议
6. 一句话总结

要求：
- 语言专业但通俗易懂
- 积极正面，给出希望
- 600字左右
- 用 markdown 格式
- 不要提 AI，以专业风水师口吻回答`
}

/**
 * 生成报告ID
 */
function generateReportId(): string {
  return `FS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 从URL生成报告
 */
export async function generateReportFromUrl(
  imageUrl: string,
  options?: Parameters<typeof generateFengShuiReport>[1]
): Promise<FengShuiReport> {
  return generateFengShuiReport(imageUrl, {
    ...options,
    input: { imageUrl },
  })
}
