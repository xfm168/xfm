export * from './semantic'

// 新版概念知识图谱
export * from './ontology/ontology'
export * from './concept/concept'
export * from './classic/classic'
export * from './graph/graphEngine'

// 向后兼容：旧版 ClassicKnowledgeGraph（仍被部分测试和模块引用）
export { ClassicKnowledgeGraph, globalClassicKG } from './classicGraph'
