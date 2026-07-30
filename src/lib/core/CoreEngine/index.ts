export * from './types'
export * from './registry'
export { BaZiCoreEngine } from './baziEngine'

// 自动注册八字引擎
import { registerEngine } from './registry'
import { BaZiCoreEngine } from './baziEngine'
registerEngine('bazi', () => new BaZiCoreEngine())
