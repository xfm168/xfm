/**
 * Gemini AI 文本增强
 * 将 interpretation layer 的输出通过 Gemini 润色
 * 注意：Gemini 不做任何命理计算
 *
 * 职责边界：
 *   - 润色自然语言
 *   - 生成个性化解释
 *   - 阅读体验优化
 *   - 总结
 *   - 行动建议
 *   - 不做命理计算（由 Professional Engine 负责）
 */

import type { InterpretationResult, InterpretationSection } from '../../lib/interpretation/baziInterpreter'

var GEMINI_API_KEY = (typeof process !== 'undefined') ? (process.env.GEMINI_API_KEY || '') : ''
var GEMINI_MODEL = 'gemini-2.5-flash'

/**
 * 调用 Gemini API 润色文本
 */
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return '' // 无 API key 时返回空，降级使用原始文本
  }

  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent?key=' + GEMINI_API_KEY

  var body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 2000,
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  })

  try {
    var res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    })
    var json = await res.json()
    var candidates = json.candidates || []
    if (candidates.length > 0) {
      var parts = candidates[0].content || {}
      var textParts = parts.parts || []
      if (textParts.length > 0) {
        return textParts[0].text || ''
      }
    }
  } catch (e) {
    // 静默失败
  }
  return ''
}

/** 润色单个章节 */
async function enhanceSection(section: InterpretationSection, chartContext: any): Promise<InterpretationSection> {
  var prompt = '你是一位专业的命理顾问，请基于以下结构化命理数据，润色生成一段自然流畅的分析文本。\n\n' +
    '要求：\n' +
    '1. 使用专业但不晦涩的中文表达\n' +
    '2. 保持传统命理术语的准确性\n' +
    '3. 不夸大、不神化，保持客观可信\n' +
    '4. 字数控制在 200-400 字\n' +
    '5. 以第二人称（"您"）撰写\n' +
    '6. 只输出分析文本，不要输出标题或其他格式\n\n' +
    '章节：' + section.title + '\n' +
    '原始分析：' + section.content + '\n' +
    '命理数据：' + JSON.stringify(chartContext || {}).substring(0, 500) + '\n\n' +
    '请润色以上内容：'

  var enhanced = await callGemini(prompt)
  if (enhanced && enhanced.length > 20) {
    return {
      ...section,
      content: enhanced,
      enhanced: true,
    }
  }
  return section // Gemini 不可用时使用原始文本
}

/** 增强完整解读 */
async function enhanceInterpretation(interpretation: InterpretationResult, chartData: any): Promise<InterpretationResult> {
  if (!GEMINI_API_KEY) {
    return interpretation // 无 API key 直接返回
  }

  // 只润色前 5 个核心章节（避免 API 调用过多）
  var sectionsToEnhance = interpretation.sections.slice(0, 5)
  var remainingSections = interpretation.sections.slice(5)

  var enhancedSections: InterpretationSection[] = []
  for (var i = 0; i < sectionsToEnhance.length; i++) {
    var enhanced = await enhanceSection(sectionsToEnhance[i], chartData)
    enhancedSections.push(enhanced)
  }

  return {
    ...interpretation,
    sections: enhancedSections.concat(remainingSections),
    aiEnhanced: true,
  }
}

/** 生成综合建议（Gemini 独立生成） */
async function generateAdvice(chartData: any, interpretation: InterpretationResult): Promise<string> {
  if (!GEMINI_API_KEY) {
    return interpretation.summary
  }

  var prompt = '你是一位资深命理顾问，请根据以下命理信息，给出 3-5 条具体的行动建议。\n\n' +
    '要求：\n' +
    '1. 建议要具体、可执行，不要泛泛而谈\n' +
    '2. 涵盖事业、财运、感情、健康等方面\n' +
    '3. 基于命理特点给出针对性的建议\n' +
    '4. 使用温和专业的语气\n' +
    '5. 不要过度神化，保持理性\n' +
    '6. 字数控制在 300-500 字\n\n' +
    '命局摘要：' + interpretation.summary + '\n\n' +
    '解读章节概要：\n' +
    interpretation.sections.map(function(s) { return s.title + ': ' + s.content.substring(0, 100) + '...' }).join('\n') + '\n\n' +
    '请给出行动建议：'

  var advice = await callGemini(prompt)
  return advice || interpretation.summary
}

export { enhanceInterpretation, generateAdvice, enhanceSection, callGemini }
