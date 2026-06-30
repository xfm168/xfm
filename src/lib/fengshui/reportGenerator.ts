/**
 * 风水报告生成服务
 * 
 * 整合图片分析 + 规则引擎 + AI建议 = 完整报告
 */

import { AIService } from '../../services/ai/AIService'
import { analyzeFengShui } from './analyzer'
import { analyzeImage, type ImageAnalysisRequest } from './aiImageAnalyzer'
import { convertToFengShuiContext, type FengShuiReport, type ImageAnalysisResult } from './imageAnalyzer'
import type { FengShuiResult } from './types'

const aiService = new AIService({
  defaultProvider: 'supabase-edge',
  fallbackProviders: ['gemini', 'openai'],
})

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
    
    // Step 4: AI改善建议（如果启用）
    if (options?.includeAI !== false) {
      console.log('[报告生成] Step 4: AI生成改善建议...')
      report.aiSuggestions = await generateAISuggestions(context, fengshuiResult, report.imageAnalysis)
    }
    
    // Step 5: 生成完整报告
    console.log('[报告生成] Step 5: 生成完整报告...')
    report.report = generateReportContent(report)
    
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
 * 生成AI改善建议
 */
async function generateAISuggestions(
  context: any,
  result: FengShuiResult,
  imageAnalysis: ImageAnalysisResult
): Promise<FengShuiReport['aiSuggestions']> {
  try {
    const prompt = buildSuggestionPrompt(context, result, imageAnalysis)
    
    const response = await aiService.chat([
      {
        role: 'user',
        content: prompt,
      },
    ], {
      model: 'supabase-edge',
    })
    
    return parseSuggestionResponse(response.content)
  } catch (error) {
    console.warn('[AI建议] 生成失败:', error)
    return {
      summary: '基于分析结果，建议从五行平衡、空间布局、光照通风三个方面进行改善。',
      priorities: result.suggestions.slice(0, 3).map((s, i) => ({
        priority: i + 1,
        issue: '需改善项',
        suggestion: s,
        reason: '提升整体风水运势',
      })),
      tips: result.explain.tips || [],
    }
  }
}

/**
 * 构建AI建议提示词
 */
function buildSuggestionPrompt(context: any, result: FengShuiResult, imageAnalysis: ImageAnalysisResult): string {
  return `请根据以下风水分析结果，提供针对性的改善建议：

【风水分析结果】
综合评分: ${result.overallScore}/100
置信度: ${result.confidence}%

各项评分:
- 朝向: ${result.directionScore}
- 户型: ${result.layoutScore}
- 房间: ${result.roomScore}
- 五行: ${result.elementScore}
- 环境: ${result.environmentScore}

【优点】
${result.strengths.map(s => `- ${s}`).join('\n')}

【缺点】
${result.weaknesses.map(w => `- ${w}`).join('\n')}

【改善建议】
${result.suggestions.map(s => `- ${s}`).join('\n')}

【注意事项】
${result.warnings.map(w => `- ${w}`).join('\n')}

【识别到的物体】
${imageAnalysis.detectedObjects.map(o => `- ${o.type}: ${o.position || '未知'}位置`).join('\n')}

请输出JSON格式：
{
  "summary": "整体改善方向的简要总结",
  "priorities": [
    {
      "priority": 1,
      "issue": "问题描述",
      "suggestion": "具体改善建议",
      "reason": "为什么这个建议有效"
    }
  ],
  "tips": ["小贴士1", "小贴士2", "小贴士3"]
}

只输出JSON。`
}

/**
 * 解析AI建议响应
 */
function parseSuggestionResponse(content: string): FengShuiReport['aiSuggestions'] {
  try {
    let jsonStr = content
    
    // 移除markdown代码块
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }
    
    const parsed = JSON.parse(jsonStr)
    
    return {
      summary: parsed.summary || '建议从多个方面改善风水运势',
      priorities: (parsed.priorities || []).slice(0, 5),
      tips: (parsed.tips || []).slice(0, 5),
    }
  } catch {
    return {
      summary: '建议从五行平衡、空间布局、光照通风三个方面进行改善',
      priorities: [],
      tips: [],
    }
  }
}

/**
 * 生成报告内容
 */
function generateReportContent(report: FengShuiReport): FengShuiReport['report'] {
  const result = report.fengshuiAnalysis.result as FengShuiResult
  
  const sections: FengShuiReport['report']['sections'] = [
    {
      title: '一、综合评估',
      type: 'summary',
      content: `您的家居风水综合评分：**${result.overallScore}分**（${getScoreLevel(result.overallScore)}）

主要优势：
${result.strengths.slice(0, 3).map(s => `• ${s}`).join('\n')}

主要问题：
${result.weaknesses.slice(0, 3).map(w => `• ${w}`).join('\n')}`,
    },
    {
      title: '二，分项分析',
      type: 'analysis',
      content: `【朝向评分】${result.directionScore}分
${result.directionAnalysis?.reasons?.slice(0, 3).map(r => `• ${r}`).join('\n') || '朝向符合风水原则'}

【户型评分】${result.layoutScore}分
${result.layoutAnalysis?.strengths?.slice(0, 3).map(s => `• ${s}`).join('\n') || '户型布局合理'}
${result.layoutAnalysis?.weaknesses?.length ? '\n注意事项：\n' + result.layoutAnalysis.weaknesses.slice(0, 2).map(w => `• ${w}`).join('\n') : ''}

【五行评分】${result.elementScore}分
${result.elementAnalysis?.suggestions?.slice(0, 3).map(s => `• ${s}`).join('\n') || '五行分布较平衡'}`,
    },
    {
      title: '三，改善建议',
      type: 'suggestion',
      content: `根据分析结果，建议按以下优先级进行改善：

${report.aiSuggestions.priorities.map(p => `${p.priority}. **${p.issue}**
   建议：${p.suggestion}
   原因：${p.reason}`).join('\n\n')}

【日常调理小贴士】
${report.aiSuggestions.tips.map(t => `• ${t}`).join('\n')}`,
    },
  ]
  
  // 如果有警告，添加警告部分
  if (result.warnings.length > 0) {
    sections.push({
      title: '四，特别注意',
      type: 'warning',
      content: `以下风水问题需要特别注意：

${result.warnings.map(w => `⚠️ ${w}`).join('\n\n')}

如无法自行化解，建议咨询专业风水师。`,
    })
  }
  
  return {
    title: `${report.imageAnalysis.roomInfo.type}风水分析报告`,
    sections,
  }
}

/**
 * 获取评分等级
 */
function getScoreLevel(score: number): string {
  if (score >= 85) return '优秀'
  if (score >= 75) return '良好'
  if (score >= 65) return '中等'
  if (score >= 55) return '一般'
  return '较差'
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
