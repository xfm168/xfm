/**
 * 风水流派融合接口
 * 支持多流派综合评分与动态注册
 */

import type { FengShuiSchoolConfig, FengShuiSchool } from '../types'

/** 评分上下文（可由调用方扩展） */
interface ScoringContext {
  roomType: string
  direction?: string
  detectedObjects: string[]
  layoutFeatures?: Record<string, unknown>
}

/** 内置流派评分方法工厂 */
function createScoringMethod(id: string, name: string) {
  return {
    id,
    name,
    calculate(context: unknown): { score: number; details: string[] } {
      const ctx = context as ScoringContext
      const details: string[] = []

      switch (id) {
        case 'general':
          details.push('依据通用风水原则进行整体评估')
          break
        case 'bazhai':
          details.push('结合宅主命卦与八宅方位分析')
          break
        case 'xuankong':
          details.push('运用玄空飞星推算当运旺衰')
          break
        case 'jiugong':
          details.push('按九宫飞星布局判断吉凶')
          break
        case 'yangzhai':
          details.push('参照阳宅三要门主灶关系')
          break
        case 'sanyuan':
          details.push('基于三元九运时间维度分析')
          break
        case 'luantou':
          details.push('勘察外部峦头形势影响')
          break
        case 'liqi':
          details.push('以理气方位为核心进行推演')
          break
        default:
          details.push('使用默认评分逻辑')
      }

      // 占位分数：基于检测物体数量做简单波动，实际应由流派算法实现
      const baseScore = 60
      const objectCount = ctx.detectedObjects?.length ?? 0
      const score = Math.min(100, Math.max(0, baseScore + objectCount * 2))
      details.push(`当前环境检测要素数量: ${objectCount}`)

      return { score, details }
    },
  }
}

/** 预定义风水流派配置 */
export const FENGSHUI_SCHOOLS: FengShuiSchoolConfig[] = [
  {
    id: 'general',
    name: '通用风水',
    description: '综合各派精华的通用评估体系，适用于日常快速诊断',
    weight: 0.4,
    scoring: createScoringMethod('general', '通用风水'),
    rules: [],
    enabled: true,
  },
  {
    id: 'bazhai',
    name: '八宅派',
    description: '以宅主命卦配合八宅方位，判断吉凶方位分布',
    weight: 0.15,
    scoring: createScoringMethod('bazhai', '八宅派'),
    rules: [],
    enabled: true,
  },
  {
    id: 'xuankong',
    name: '玄空飞星',
    description: '依据时间变化推算飞星落宫，分析当运旺衰',
    weight: 0.15,
    scoring: createScoringMethod('xuankong', '玄空飞星'),
    rules: [],
    enabled: true,
  },
  {
    id: 'luantou',
    name: '峦头派',
    description: '注重外部形势与内部格局的直观勘察',
    weight: 0.1,
    scoring: createScoringMethod('luantou', '峦头派'),
    rules: [],
    enabled: true,
  },
  {
    id: 'liqi',
    name: '理气派',
    description: '以罗盘方位和理气计算为核心的精细推演',
    weight: 0.1,
    scoring: createScoringMethod('liqi', '理气派'),
    rules: [],
    enabled: true,
  },
  {
    id: 'jiugong',
    name: '九宫飞星',
    description: '以九宫格布局配合飞星判断各宫吉凶',
    weight: 0.05,
    scoring: createScoringMethod('jiugong', '九宫飞星'),
    rules: [],
    enabled: false,
  },
  {
    id: 'yangzhai',
    name: '阳宅三要',
    description: '聚焦门、主、灶三者关系的传统方法',
    weight: 0.05,
    scoring: createScoringMethod('yangzhai', '阳宅三要'),
    rules: [],
    enabled: false,
  },
  {
    id: 'sanyuan',
    name: '三元九运',
    description: '结合宏观时间周期的长周期运势分析',
    weight: 0.05,
    scoring: createScoringMethod('sanyuan', '三元九运'),
    rules: [],
    enabled: false,
  },
]

/** 流派注册表（运行时可变） */
const schoolRegistry: Map<FengShuiSchool, FengShuiSchoolConfig> = new Map(
  FENGSHUI_SCHOOLS.map((s) => [s.id, s])
)

/**
 * 获取当前启用的风水流派
 * @returns 启用的流派配置列表
 */
export function getEnabledSchools(): FengShuiSchoolConfig[] {
  return Array.from(schoolRegistry.values()).filter((s) => s.enabled)
}

/**
 * 多流派综合评分
 * @param context 评分上下文
 * @param schools 参与评分的流派列表（默认使用启用流派）
 * @returns 加权综合分数与详细分解
 */
export function calculateMultiSchoolScore(
  context: ScoringContext,
  schools?: FengShuiSchoolConfig[]
): {
  overall: number
  breakdown: Array<{ school: FengShuiSchool; name: string; score: number; weight: number; details: string[] }>
} {
  const targetSchools = schools ?? getEnabledSchools()
  const breakdown: Array<{
    school: FengShuiSchool
    name: string
    score: number
    weight: number
    details: string[]
  }> = []

  let totalWeight = 0
  let weightedSum = 0

  for (const school of targetSchools) {
    const result = school.scoring.calculate(context)
    breakdown.push({
      school: school.id,
      name: school.name,
      score: result.score,
      weight: school.weight,
      details: result.details,
    })
    totalWeight += school.weight
    weightedSum += result.score * school.weight
  }

  const overall = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0

  return { overall, breakdown }
}
