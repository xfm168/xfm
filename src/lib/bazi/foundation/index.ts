/**
 * P0-5 Foundation Layer — 统一入口
 *
 * XuanFeng Core OS（命理操作系统）
 *
 * 六层架构：
 *   Core → Knowledge → Engine → Decision → Quality → AI → Application
 *
 * 本模块导出所有 Foundation 层能力：
 *   Part 1: RuleDSL         — 声明式规则描述语言
 *   Part 2: ClassicKG       — 古籍知识图谱
 *   Part 3: RuleGraph       — 规则依赖图
 *   Part 4: VersionManager  — 规则版本管理
 *   Part 5: ReviewCenter    — 知识审核系统
 *   Part 6: KnowledgeBenchmark — 知识基准
 *   Part 7: AI Assistant    — AI 助手框架
 *   Part 8: StandardDB      — 数据库标准化
 *   Part 9: API Contracts   — API 标准合约
 *   Part 10: Architecture   — 六层架构整合
 */

// Part 1: RuleDSL
export * from './dsl'

// Part 2: Classical Knowledge Graph
export * from './knowledge'

// Part 3: Rule Dependency Graph
export * from './dependency'

// Part 4: Rule Version Manager
export * from './versioning'

// Part 5: ReviewCenter
export * from './review'

// Part 6: Knowledge Benchmark
export * from './benchmark'

// Part 7: AI Assistant Framework
export * from './ai'

// Part 8: Database Standardization
export * from './db'

// Part 9: API Standard
export * from './api'

// Part 10: Six-layer Architecture
export {
  ARCHITECTURE_LAYERS,
  ARCHITECTURE_CONFIG,
  checkArchitectureStatus,
  getLayerDependencyGraph,
} from './architecture'
export type { ArchitectureStatus } from './architecture'

// 统一类型导出
export * from './types'
