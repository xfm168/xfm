# Engine Registry v1.0

> 架构层定义：calculator → rule-engine → evidence → confidence → decision → explain → report → utility

---

## 已注册 Engine

| # | Engine ID | Engine Name | Class | Layer | Owner | Input | Output | NotAllowed | Dependencies | Version |
|---|-----------|-------------|-------|-------|-------|-------|--------|------------|-------------|---------|
| 1 | calculator | 排盘核心 | `calculateBaZi` | calculator | Kernel | birthDate, birthTime, gender | `BaZiChart` | 被其他模块绕过直接调用 | — | v1.0 |
| 2 | consensus | 共识推演引擎 | `ConsensusEngine` | rule-engine | Plugin | chartData | `ConsensusEngineResult` | 修改原始排盘数据, 执行AI生成 | calculator | v1.0 |
| 3 | shenSha-filter | 神煞过滤引擎 | `ShenShaFilterEngine` | rule-engine | Plugin | shenShaList, chartData | `ShenShaFilterResult` | 重新计算神煞, 修改神煞原始数据 | calculator | v1.0 |
| 4 | dynasty-simulation | 人生轨迹推演引擎 | `DynastySimulationEngine` | rule-engine | Plugin | chartData | `DynastySimulationResult` | 修改排盘数据, AI生成人生建议 | calculator | v1.0 |
| 5 | shiShen-graph | 十神关系图引擎 | `ShiShenGraphEngine` | rule-engine | Plugin | chartData | `ShiShenGraphResult` | 重新计算十神 | calculator | v1.0 |
| 6 | energy-flow | 五行能量引擎 | `EnergyFlowEngine` | rule-engine | Plugin | chartData | `EnergyFlowResult` | 重新计算五行分布 | calculator | v1.0 |
| 7 | evidence | 证据链引擎 | `ExplainEvidenceEngine` | evidence | Plugin | conclusions[], chartData | `ExplainEvidenceResult` | 推导新结论, 生成评分, 修改Evidence来源 | calculator, consensus | v1.0 |
| 8 | confidence | 可信度引擎 | `ConfidenceEngine` | confidence | Plugin | chartData + consensusData | `ConfidenceResult` | 修改排盘数据, 修改共识结论, AI生成可信度 | calculator, consensus | v1.0 |
| 9 | decision | 决策引擎 | `DecisionEngine` | decision | Plugin | confidenceData + calculator输出 | 决策建议列表 | AI生成决策, 修改RuleWeight | calculator, consensus, confidence | v1.0 |
| 10 | master-tone | 大师语气引擎 | `MasterToneEngine` | master-tone | Plugin | text: string | `MasterToneResult` | (RENDER_LAYER_PROHIBITIONS) | explain | v1.0 |
| 11 | explain | 解释引擎 | `ExplainV4Engine` | explain | Plugin | chartData + consensusData | `ExplainV4Result` | (RENDER_LAYER_PROHIBITIONS) | calculator, consensus | v1.0 |
| 12 | report | 报告组装 | `assembleMasterReport` | report | Plugin | 所有前序引擎输出 | `masterReport` | 编造默认结论, 数据为空时生成填充文本 | calculator→master-tone (9 deps) | v1.0 |
| 13 | case-learning | 案例学习引擎 | `CaseLearningEngine` | utility | Plugin | `CaseEntry` | string (案例ID) | 修改排盘数据, 修改分析结论 | calculator | v1.0 |
| 14 | accuracy | 准确率引擎 | `AccuracyEngine` | utility | Plugin | `FeedbackRecord` | string (记录ID) | 修改推演结果, 修改可信度 | confidence | v1.0 |
| 15 | i18n | 国际化引擎 | `I18nEngine` | utility | Plugin | key, locale | string (翻译文本) | 修改任何业务数据 | — | v1.0 |

---

## 未注册但存在的 Engine（Out-of-Scope）

> 以下为不需要注册的辅助模块，作为 Pipeline 内部子步骤或工具函数运行，不需要独立 Contract。

### 内嵌于 Pipeline（通过函数调用）

- `dayMasterStrengthEngine` — 日主强弱计算
- `climateAdjustmentEngine` — 气候调候
- `diseaseMedicineEngine` — 疾病医药
- `useGodEngine` — 用神推断
- `dynamicUseGod` — 动态用神
- `tongGuanEngine` — 通关分析
- `consistencyChecker` — 一致性校验
- `luckModifierEngine` — 运势修正

### 分析子引擎

- `marriageEngine` — 婚姻分析
- `relationshipEngine` — 人际关系分析
- `healthEngine` — 健康分析
- `careerEngine` — 事业分析
- `wealthEngine` — 财运分析
- `similarityEngine` — 相似度分析

### 工具引擎

- `benchmarkEngine` — 基准测试
- `shenShaEngine` — 神煞计算

---

## 版本

- **Version:** v1.0
- **Status:** LOCKED
- **Effective:** P6-B.6 Final
