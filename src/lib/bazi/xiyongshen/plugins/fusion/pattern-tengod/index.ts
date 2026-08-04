export * from './types'
export * from './evidenceMerge'
export * from './priorityMatrix'
export * from './conflictResolver'
export * from './fusionEngine'
export * from './explain'
export * from './plugin'

import { PatternTenGodFusionPlugin } from './plugin'
export const defaultPatternTenGodFusionPlugin = new PatternTenGodFusionPlugin()
