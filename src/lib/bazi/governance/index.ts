/**
 * Governance Module - V4.8.1 Baseline
 *
 * 企业级治理能力（已冻结，不再新增治理模块）：
 *   - Snapshot        版本快照（历史可重现）
 *   - Benchmark       基准对比（精度回归）
 *   - QualityGate     质量门（Merge Block）
 *   - Observability   可观测性
 *   - Dashboard       规则统计仪表盘
 *   - RulePack        规则包
 *
 * P0-① 交付物：
 *   - packs/p0SolarTerm          规则包（RULE-PP-021, RULE-PP-069）
 *   - benchmarks/p0SolarTerm      权威节气基准
 *   - p0Snapshot                  交付快照
 */

export * from './snapshot'
export * from './benchmark'
export * from './qualityGate'
export * from './observability'
export * from './dashboard'
export * from './rulePack'
export * from './acceptance'
export * from './freeze'

export { P0_SOLAR_TERM_PACK, P0_SOLAR_TERM_RULES } from './packs/p0SolarTerm'
export { runSolarTermBenchmark, SOLAR_TERM_BENCHMARK_COUNT } from './benchmarks/p0SolarTerm'
export { P0_SNAPSHOT } from './p0Snapshot'
