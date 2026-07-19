/**
 * Expert Consensus Types
 *
 * 定义专家共识分析的类型和结果结构
 */

/** 共识等级 */
export type ConsensusLevel = 'unanimous' | 'strong' | 'moderate' | 'weak' | 'disputed'

/** 共识分析结果 */
export interface ConsensusResult {
  caseId: string
  consensusScore: number
  consensusLevel: ConsensusLevel
  opinionCount: number
  agreementRate: number
  dominantConclusion: string
  minorityViews: string[]
}

/** 共识分析选项 */
export interface ConsensusOptions {
  minOpinions: number
  weightByExpertScore: boolean
}
