/**
 * P0-5 Foundation Layer — 统一入口
 *
 * XuanFeng Core OS（命理操作系统）
 *
 * 六层架构：
 *   Core → Knowledge → Engine → Decision → Quality → AI → Application
 *
 * 导出内容：
 *   Core:          事件总线 / 生命周期 / 插件管理 / 配置中心
 *   Shared:        公共类型 / 错误 / 日志
 *   DSL:           AST → Parser → Validator → Compiler → Runtime（完整语言管线）
 *   Knowledge:     本体 / 概念 / 典籍 / 知识图谱引擎（概念驱动）
 *   Rule:          运行时 / 依赖图 / 注册表
 *   Version:       规则版本管理
 *   Review:        五维审核系统
 *   Benchmark:     知识基准
 *   AI:            AI 上下文 + Prompt 构建器
 *   DB:            六大标准数据库
 *   API:           API 标准合约
 *   Architecture:  六层架构整合
 */

// ===== Core：操作系统内核 =====
export * from './core'

// ===== Shared：公共模块 =====
// (已在 core/index.ts 中统一导出)

// ===== DSL：声明式规则描述语言（完整管线） =====
export * from './dsl'

// ===== Knowledge：概念知识图谱 =====
export * from './knowledge'

// ===== Rule：规则运行时 + 依赖图 + 注册表 =====
export * from './rule'

// ===== Version：规则版本管理 =====
export * from './versioning'

// ===== Review：知识审核系统 =====
export * from './review'

// ===== Benchmark：知识基准 =====
export * from './benchmark'

// ===== AI：AI 助手框架 =====
export * from './ai'

// ===== DB：数据库标准化 =====
export * from './db'

// ===== API：标准合约 =====
export * from './api'

// ===== Architecture：六层架构 =====
export {
  ARCHITECTURE_LAYERS,
  ARCHITECTURE_CONFIG,
  checkArchitectureStatus,
  getLayerDependencyGraph,
} from './architecture'
export type { ArchitectureStatus } from './architecture'

// ===== 统一类型 =====
export * from './types'
