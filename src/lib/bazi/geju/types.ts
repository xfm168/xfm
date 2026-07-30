/**
 * B6 格局系统：10 大类
 * 参考：《滴天髓》《子平真诠》《三命通会》《渊海子平》现代命理流派
 */

export type GeJuCategory =
  | '正格'
  | '专旺格'
  | '从格'
  | '假从格'
  | '半从格'
  | '从儿格'
  | '从财格'
  | '从杀格'
  | '两神成象格'
  | '化气格'
  | '现代特殊格'

export type WuXing = '木' | '火' | '土' | '金' | '水'

export type ShiShen =
  | '比肩' | '劫财' | '食神' | '伤官' | '偏财' | '正财' | '七杀' | '正官' | '偏印' | '正印'

export interface MinimalPillarInput {
  dayGan: string
  dayGanWuxing: WuXing
  monthZhi: string
  monthZhiWuxing: WuXing
  fourPillars: Array<{ gan: string; zhi: string; ganWx: WuXing; zhiWx: WuXing }>
  wuxingCount: Record<WuXing, number>
  monthTouGan?: ShiShen[]
  dayStrengthLevel?: number
  dayRootCount?: number
  tags?: string[]
}

export interface GeJuJudgement {
  geju: GeJuCategory
  subtype?: string
  score: number
  ruleId: string
  evidence: Array<{ step: string; text: string; satisfied: boolean; citation?: string }>
  active: boolean
  note?: string
  source: string[]
}

export interface GeJuResult {
  primary: GeJuJudgement
  secondary: GeJuJudgement[]
  rejected: GeJuJudgement[]
  summary: string
  hasSchoolConflict?: boolean
}
