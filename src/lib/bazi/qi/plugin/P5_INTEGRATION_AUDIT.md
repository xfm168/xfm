# P5 Integration Audit Report — 接入检查报告

生成时间：2026-07-11
检查范围：P4 全部 15 个 Engine
检查方法：全代码 import/execute 追踪

## 接入状态总览

| Engine | 文件 | 是否已调用 | 调用位置 | 调用次数 | 参与最终报告 | 状态 |
|--------|------|-----------|---------|---------|-------------|------|
| P4.1 ConsensusEngine | consensusEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.2 DynastySimulationEngine | dynastySimulationEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.3 ShiShenGraphEngine | shiShenGraphEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.4 EnergyFlowEngine | energyFlowEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.5 ShenShaFilterEngine | shenShaFilterEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.6 ExplainV4 | explainV4.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.7 CaseLearningEngine | caseLearningEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.8 ConfidenceEngine | confidenceEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.9 ExplainEvidenceEngine | explainEvidenceEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.10 MasterToneEngine | masterToneEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.11 AccuracyEngine | accuracyEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.12 BenchmarkEngine2 | benchmarkEngine2.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.13 PerformanceOptEngine | performanceOptEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.14 I18nEngine | i18nEngine.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |
| P4.15 ReleaseEngine11 | releaseEngine11.ts | ✗ | — | 0 | ✗ | 【未接入主流程】 |

## 调用详情

| Engine | runner 测试文件 | runner 中已验证 | 主入口引用 |
|--------|----------------|----------------|-----------|
| P4.1 ConsensusEngine | runner-p41-consensus.ts | ✓ | ✗ |
| P4.2 DynastySimulationEngine | runner-p42-p48.ts | ✓ | ✗ |
| P4.3 ShiShenGraphEngine | runner-p42-p48.ts | ✓ | ✗ |
| P4.4 EnergyFlowEngine | runner-p42-p48.ts | ✓ | ✗ |
| P4.5 ShenShaFilterEngine | runner-p42-p48.ts | ✓ | ✗ |
| P4.6 ExplainV4 | runner-p42-p48.ts | ✓ | ✗ |
| P4.7 CaseLearningEngine | runner-p42-p48.ts | ✓ | ✗ |
| P4.8 ConfidenceEngine | runner-p42-p48.ts | ✓ | ✗ |
| P4.9 ExplainEvidenceEngine | runner-p49-p415.ts | ✓ | ✗ |
| P4.10 MasterToneEngine | runner-p49-p415.ts | ✓ | ✗ |
| P4.11 AccuracyEngine | runner-p49-p415.ts | ✓ | ✗ |
| P4.12 BenchmarkEngine2 | runner-p49-p415.ts | ✓ | ✗ |
| P4.13 PerformanceOptEngine | runner-p49-p415.ts | ✓ | ✗ |
| P4.14 I18nEngine | runner-p49-p415.ts | ✓ | ✗ |
| P4.15 ReleaseEngine11 | runner-p49-p415.ts | ✓ | ✗ |

## 主入口检查结果

| 文件路径 | plugin 引用数 | 状态 |
|---------|-------------|------|
| src/lib/bazi/index.ts | 0 | ✗ 无任何 plugin 引用 |
| src/lib/bazi/qi/index.ts | 0 | ✗ 无任何 plugin 引用 |
| plugin/index.ts | — | ✗ 文件不存在 |

## 核心问题

1. **plugin/index.ts 不存在** — 15个 Engine 无统一导出入口
2. **主入口零引用** — src/lib/bazi/index.ts 和 src/lib/bazi/qi/index.ts 均未 import 任何 plugin
3. **Pipeline 未串联** — 不存在将15个 Engine 串成统一流水线的机制
4. **所有 Engine 为孤立模块** — 仅在独立 runner 测试中验证，未参与实际推演

## 紧急修复计划

- 创建 plugin/index.ts 统一导出
- 创建 PipelineEngine 串联所有 Engine
- 将 PipelineEngine 接入主入口
