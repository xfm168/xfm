import type { Wuxing } from '../types'
import type { ClassicEvidenceRef } from '../../ruleEngine/types'

/** 子引擎输入（统一接口） */
export interface SubEngineInput {
  dayGanWuxing: Wuxing
  monthZhiWuxing: Wuxing
  /** 五行计数 */
  count: Record<Wuxing, number>
  /** 四柱天干 */
  dayGan: string
  /** 四柱地支 */
  fourPillars: Array<{ gan: string; zhi: string; ganWx: Wuxing; zhiWx: Wuxing }>
  /** 日主根气数 */
  dayRootCount?: number
  /** 日主强弱等级（-3~+3） */
  dayStrength?: number
  /** 月令地支 */
  monthZhi: string
  /** 是否冬生 */
  isWinterBorn?: boolean
  /** 是否夏生 */
  isSummerBorn?: boolean
  /** 是否湿月 */
  isWetSeason?: boolean
  /** 是否燥月 */
  isDrySeason?: boolean
  /** 相战两行 */
  conflictingPairs?: Array<[Wuxing, Wuxing]>
  /** 格局类别 */
  gejuCategory?: string
  /** 调候用神预设 */
  tiaohouShen?: Wuxing[]
  /** 病神五行 */
  diseaseWuxing?: Wuxing
}

/** 子引擎输出（只提供 Evidence，不直接决策） */
export interface SubEngineResult {
  /** 引擎名称 */
  engineName: string
  /** 是否适用 */
  applicable: boolean
  /** 跳过原因 */
  skipReason?: string
  /** 五行评分（该引擎对每个五行的评价 -3~+3） */
  scores: Record<Wuxing, number>
  /** 证据 trace */
  evidence: Array<{
    step: string
    text: string
    satisfied?: boolean
    citation?: string
  }>
  /** 经典引用 */
  classicEvidence: ClassicEvidenceRef[]
  /** 该引擎结论的可信度 0~1 */
  confidence: number
  /** 该引擎在最终决策中的权重 */
  weight: number
  /** 引擎结论摘要 */
  summary: string
}

/** 子引擎接口 */
export interface SubEngine {
  readonly name: string
  readonly version: string
  evaluate(input: SubEngineInput): SubEngineResult
}
