/**
 * 风水图片AI识别服务
 * 
 * 使用AI多模态能力识别图片中的风水元素
 */

import { AIService } from '../../services/ai/AIService'
import type { AIMessage } from '../../services/ai/types'
import type {
  ImageAnalysisRequest,
  ImageAnalysisResult,
  DetectedObject,
  DetectedObjectType,
} from './imageAnalyzer'

// 创建AI服务实例
const aiService = new AIService({
  defaultProvider: 'supabase-edge',
  fallbackProviders: ['gemini', 'openai'],
})

/**
 * 分析图片识别风水元素
 */
export async function analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResult> {
  try {
    // 优先使用支持多模态的模型
    const result = await callMultimodalAI(request)
    
    // 解析AI返回的JSON
    const parsed = parseAIResponse(result)
    
    return parsed
  } catch (error) {
    console.error('图片分析失败:', error)
    return {
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
      error: error instanceof Error ? error.message : '图片分析失败',
    }
  }
}

/**
 * 调用多模态AI进行图像识别
 */
async function callMultimodalAI(request: ImageAnalysisRequest): Promise<string> {
  const prompt = getPromptForAnalysisType(request.analysisType)
  
  // 构建消息
  const messages = [
    {
      role: 'user' as const,
      content: [
        {
          type: 'text' as const,
          text: prompt,
        },
        {
          type: 'image_url' as const,
          image_url: {
            url: request.imageData?.startsWith('data:') 
              ? request.imageData 
              : `data:image/jpeg;base64,${request.imageData}`,
          },
        },
      ],
    },
  ]
  
  try {
    // 尝试使用 Gemini
    const response = await aiService.chat(messages as unknown as AIMessage[], {
      model: 'gemini-2.0-flash',
    })
    
    return response.content
  } catch (error) {
    console.error('Gemini 调用失败，尝试其他方式:', error)
    
    // 如果多模态失败，尝试使用文本描述
    return await analyzeFromTextDescription(request)
  }
}

/**
 * 获取分析类型的提示词
 */
function getPromptForAnalysisType(type: ImageAnalysisRequest['analysisType']): string {
  switch (type) {
    case 'room':
      return ROOM_ANALYSIS_PROMPT
    case 'furniture':
      return FURNITURE_ANALYSIS_PROMPT
    case 'layout':
      return LAYOUT_ANALYSIS_PROMPT
    case 'full':
    default:
      return FULL_ANALYSIS_PROMPT
  }
}

/**
 * 解析AI返回的响应
 */
function parseAIResponse(content: string): ImageAnalysisResult {
  try {
    // 尝试提取JSON
    let jsonStr = content
    
    // 移除markdown代码块
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }
    
    // 尝试解析
    const parsed = JSON.parse(jsonStr)
    
    return {
      detectedObjects: (parsed.detectedObjects || []).map((obj: any) => ({
        type: obj.type as DetectedObjectType,
        confidence: obj.confidence || 50,
        position: obj.position,
        direction: obj.direction,
      })),
      roomInfo: {
        type: parsed.roomInfo?.type || 'unknown',
        size: parsed.roomInfo?.size || 'medium',
        hasNaturalLight: parsed.roomInfo?.hasNaturalLight ?? true,
        mainDirection: normalizeDirection(parsed.roomInfo?.mainDirection || 'south'),
        shape: parsed.roomInfo?.shape || 'rectangle',
      },
      furniture: [],
      elementDistribution: {
        '木': parsed.elementAnalysis?.wood || 2,
        '火': parsed.elementAnalysis?.fire || 2,
        '土': parsed.elementAnalysis?.earth || 2,
        '金': parsed.elementAnalysis?.metal || 2,
        '水': parsed.elementAnalysis?.water || 2,
      },
      overallConfidence: parsed.confidence || 50,
      rawResult: parsed,
    }
  } catch (error) {
    console.error('解析AI响应失败:', error)
    return {
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
      error: '无法解析AI响应',
    }
  }
}

/**
 * 规范化方向值
 */
function normalizeDirection(dir: string): 'north' | 'south' | 'east' | 'west' | 'northeast' | 'northwest' | 'southeast' | 'southwest' {
  const dirMap: Record<string, string> = {
    '北': 'north',
    '南': 'south',
    '东': 'east',
    '西': 'west',
    '东北': 'northeast',
    '西北': 'northwest',
    '东南': 'southeast',
    '西南': 'southwest',
    'north': 'north',
    'south': 'south',
    'east': 'east',
    'west': 'west',
    'northeast': 'northeast',
    'northwest': 'northwest',
    'southeast': 'southeast',
    'southwest': 'southwest',
  }
  
  return (dirMap[dir] || 'south') as any
}

/**
 * 当多模态失败时，从文本描述分析
 */
async function analyzeFromTextDescription(request: ImageAnalysisRequest): Promise<string> {
  const response = await aiService.chat([
    {
      role: 'user',
      content: `这是一个风水分析请求。请根据房间描述识别风水元素：

请识别以下内容并以JSON格式输出：
1. 房间中有什么家具和物品
2. 房间的朝向（门/窗朝向）
3. 光照情况
4. 五行分布（根据家具材质推断）

房间类型：${request.options?.roomType || '未指定'}

只输出JSON格式。`,
    },
  ], {
    model: 'supabase-edge',
  })
  
  return response.content
}

// ============ 提示词定义 ============

const ROOM_ANALYSIS_PROMPT = `请分析这张图片，识别以下风水相关元素：

需要识别的物体：
- 门（door）
- 窗户（window）
- 床（bed）
- 沙发（sofa）
- 书桌（desk）
- 灶台（stove）
- 镜子（mirror）
- 财神位（fortune-position）
- 横梁（beam）
- 通道（corridor）
- 光照（light）

请输出JSON格式，包含：
- detectedObjects: 识别到的物体列表
- roomInfo: 房间信息
- elementAnalysis: 五行分析
- confidence: 整体置信度

只输出JSON，不要输出其他内容。`

const FURNITURE_ANALYSIS_PROMPT = `请详细分析这张图片中的家具：

识别内容：
- 家具类型
- 家具位置（左/右/中/角落）
- 家具朝向
- 家具材质

输出JSON格式。`

const LAYOUT_ANALYSIS_PROMPT = `请分析这张图片的房间布局：

识别内容：
- 房间形状（方正/长方/L形/不规则）
- 门窗位置
- 缺角情况
- 房间面积估算
- 中宫位置

输出JSON格式。`

const FULL_ANALYSIS_PROMPT = `请进行完整的风水图像分析：

1. 识别所有风水相关物体
2. 分析房间布局和朝向
3. 推断五行分布
4. 识别风水煞气（如横梁、门冲等）
5. 评估整体风水状况

请输出详细的JSON格式分析结果。`

// ============ 导出 ============

export { ROOM_ANALYSIS_PROMPT, FURNITURE_ANALYSIS_PROMPT, LAYOUT_ANALYSIS_PROMPT, FULL_ANALYSIS_PROMPT }
