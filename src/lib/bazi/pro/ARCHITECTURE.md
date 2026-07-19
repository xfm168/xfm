# H3 Professional BaZi Engine — 架构文档

> 玄风门 V5.0 GA Enterprise · H3 Professional BaZi Engine
> Version: **V5.0 GA** · Status: **Enterprise Stable** · State: **Frozen**
> Modules: 8 · Regression: 100% · Health Score: 95+ · Production Ready: **YES**
> 开发原则: **算法停止扩张，产品持续进化**
>
> Module 1~8 Frozen — V5.0 RC Phase 1~5 Complete — GA Declared 2026-07-17 — GA Post-Release Complete — Phase 6 Real World Validation Complete — **运营模式启动 2026-07-17**
> 最后更新: 2026-07-17

---

## 0. 运营宣言与开发原则

**技术研发阶段正式结束。产品运营阶段正式开始。**

> «数据驱动，而不是开发驱动。»

### 四大运营原则

**第一原则：数据驱动优化**

```
用户反馈 → 问题统计 → 专家审核 → 案例积累 → 确认存在共性 → 再决定是否优化
```

不是想到什么就开发什么。一切优化方向由真实用户数据决定。

**第二原则：算法修改硬门槛**

任何算法修改必须同时满足以下 6 项条件：

| 条件 | 门槛 |
|------|------|
| 真实用户验证 | ≥ 300 人 |
| 真实报告 | ≥ 1000 份 |
| 高质量反馈 | ≥ 100 条 |
| 专家审核 | ≥ 50 条 |
| 共性问题证明 | 能明确证明当前算法存在共性问题 |
| 以上全部 | 缺一不可 |

**第三原则：产品体验优先**

以下指标的重要性高于继续开发算法：

| 指标 | 说明 |
|------|------|
| 首页转化率 | visitor → registered |
| 用户留存 | 7日/30日/90日留存率 |
| 阅读完成率 | 报告全文阅读比例 |
| 分享率 | 报告分享行为比例 |
| 付费率 | free → professional/vip |
| 用户满意度 | 综合满意度评分 ≥ 4.0/5.0 |

**第四原则：持续积累数据资产**

| 数据资产 | 短期目标 | 中期目标 | 长期目标 |
|----------|---------|---------|---------|
| 案例库 | 1000 | 5000 | 10000 |
| 知识库 | 500 | 1000 | 2000 |
| 专家审核 | 100 | 500 | 1000 |

### 永久约束

| 约束 | 规则 |
|------|------|
| Engine | 不再新增任何 Engine |
| Module | 不再新增任何 Module，Module 1~8 永久冻结 |
| Rule | 不再扩大 Rule Registry |
| 算法 | 不再扩大算法体系，不修改命理逻辑，不改变计算结果 |
| 允许范围 | Bug Fix、性能优化、安全修复、产品体验优化 |
| 影响范围 | 任何产品功能不得影响 Module 1~8 |
| 质量标准 | TS Error = 0, Regression = 100%, Health Score >= 95 |

### 最终目标

**打造中国领先的 AI 命理分析平台。**

以真实案例、专家审核和用户反馈持续提升产品价值。数据资产是核心竞争力。

**Web Product Layer 开发规范：** 项目根目录 `PRODUCT_CONSTITUTION.md` — 产品开发宪章（适用于 W2/W3/W4 及未来所有运营阶段）。

---

## 1. 引擎整体架构

### 数据流（第一原则：规则优先）

```
BirthData
    │
    ▼
四柱排盘（JDN + 立春 + 节气 + 五鼠遁） ── Module 1
    │
    ▼
神煞引擎（38种神煞 + 冲突检测） ── Module 2
    │
    ▼
十神引擎（10十神 + 透藏分析 + 旺相休囚死 + 力量拆分 + 状态 + 关系网络[泄/耗] + 组合匹配 + PatternCandidate + confidence + AI Keywords + ExecutionMetadata + cacheVersion） ── Module 3 Frozen
    │
    ▼
ProfessionalFourPillarsResult + ShenShaEngineOutput + TenGodsEngineOutput (JSON)
    │
    ▼
AI 解释层（H2 Unified AI Layer）
    │
    ▼
最终报告（PDF / Web）
```

**禁止 AI 直接推算任何命理结果。所有计算由规则引擎完成，AI 仅负责解释。**

### 核心架构

```
ProfessionalConfig ──── 配置
       │
       ▼
RuleRegistry ──── 注册
       │
       ▼
规则计算 ──── 执行
       │
       ▼
TraceChain ──── 记录（algorithmVersion + source + children）
       │
       ▼
WarningCode ──── 异常
```

---

## 2. Module 划分

| Module | 名称 | 状态 | 目录 | 规则数 |
|--------|------|------|------|--------|
| Module 1 | Professional Four Pillars Engine | Frozen v1.0 | `src/lib/bazi/pro/` | 11 |
| Module 1.1 | Infrastructure | Frozen v1.0 | `src/lib/bazi/pro/` | 4组件 |
| Module 2 | Professional ShenSha Engine | **Frozen v2.0** | `src/lib/bazi/pro/` | 38神煞 + 11规则 |
| Module 3 | Professional Ten Gods Engine | **Frozen v3.1.0** | `src/lib/bazi/pro/` | 10十神 + 15关系规则 + 15组合规则 + PowerBreakdown + State + PatternCandidate + Confidence + AI Keywords + ExecutionMetadata + CacheVersion |
| Module 4 | Professional Pattern Engine | **Frozen v4.1.0** | `src/lib/bazi/pro/` | 20格局(10正格+10特殊格) + 4流派 + PatternRuleDatabase + 破格检测 + 加分项 + 成格评分 + AI知识库 + ScoreDetail + FormationChain + ConflictResolver + 主副格 + schoolResults + AI增强 + cacheVersion |
| Module 5 | Professional XiYong Engine | **Frozen v5.0.0** | `src/lib/bazi/pro/` | 日主强弱7维判定 + 喜用忌仇闲5神分组 + 调候分析(12月) + 扶抑6法 + 多流派喜用神 + ConflictResolver + ScoreDetail + AI Explain + KnowledgeBase + RuleRegistry(11) + CacheVersion |
| Module 6 | Professional Fortune Engine | **Frozen v6.0.0** | `src/lib/bazi/pro/` | 起运年龄(顺逆) + 十年大运(十神/长生/神煞/五行/原局-格局-喜用神关系) + 流年(三层关系) + 作用关系(冲刑害破合/三合三会/伏吟反吟) + Event Engine(15事件) + FortuneScores(9维度) + AI Explain + 干支关系常量 + RuleRegistry(12) + CacheVersion |
| Module 7 | Professional AI Report Engine | **Frozen v7.0.0** | `src/lib/bazi/pro/` | MasterAnalysis(数据整合) + CrossValidation(多模块交叉验证8规则) + 命局总评 + FiveDimensions(事业/财富/婚姻/健康/学业) + Timeline(4阶段) + RiskEngine(6风险) + OpportunityEngine(6机会) + RecommendationEngine(9类建议) + AI Explain KB(12主题) + MasterReport统一输出 + RuleRegistry(12) + CacheVersion |
| Module 8 | Professional Report Export Engine | **Frozen v8.0.0** | `src/lib/bazi/pro/` | 5模板(专业/古籍/现代/简洁/VIP) + 15章节 + 7图表 + 5导出格式 + 品牌化 + 国际化(zh/en) + RuleRegistry(8) + CacheVersion |

### V4.5 Case Library（产品化验证层 — Phase 1 Frozen v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| caseLibraryTypes.ts | **Frozen v1.0.0** | CaseEntry/CaseCategory/RegressionReport/FieldComparison 等类型 |
| caseDatabase.ts | **Frozen v1.0.0** | 10经典命例 + 5匿名 + 10回归 + 7查询函数 |
| caseValidationEngine.ts | **Frozen v1.0.0** | runRegression 验证引擎 + 自回归模式 + 字段级比对 + 一致率统计 |

### V4.5 Phase 2: Knowledge Base + Expert Validation Center（Frozen v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| knowledgeBaseTypes.ts | **Frozen v1.0.0** | KnowledgeEntry/ExpertValidationRecord/DifferenceReport/LearningQueueItem/RegressionLock 等类型 |
| knowledgeBaseDatabase.ts | **Frozen v1.0.0** | 20知识条目(7来源/11分类) + 5专家验证 + 3学习队列 + 2回归锁 + 10查询函数 |
| expertValidationEngine.ts | **Frozen v1.0.0** | generateValidationCenterReport 7步流水线 + 差异分析 + 学习队列更新 + 汇总生成 |

**Phase 2 数据流（闭环体系）：**

```
Knowledge Base（古籍原文 + 现代解释 + 关联规则 + 引用等级）
    ↓
RuleRegistry ← 统一知识来源
    ↓
TraceChain ← 统一引用关系
    ↓
MasterReport ← 数据整合
    ↓
Case Library ← 命例验证
    ↓
Expert Validation Center ← 多人审核 + 差异分析
    ↓
Learning Queue ← 争议案例自动入队
    ↓
Regression Lock ← 专家确认案例锁定 + 版本报警
    ↓
AI Explain ← 统一解释输出
```

**Phase 2 核心能力：**

| 能力 | 说明 |
|------|------|
| Knowledge Base | 20条命理知识（十神/格局/喜用神/合化/冲刑/五行/大运/事业/财运/婚姻/健康），来自7部经典古籍 |
| Citation Level | primary/secondary/reference 三级引用等级 + confidence 置信度 |
| Knowledge Association | 关联十神/格局/喜用神/神煞/五行等知识维度 |
| Expert Validation | 多专家支持 + ReviewStatus(pending→verified/disputed/deprecated) + VerdictType(agree/partially_agree/disagree/unclear) |
| Difference Analyzer | 自动分析系统结论 vs 专家结论 → DifferenceReport(critical/major/minor/info) + 改进建议 |
| Learning Queue | 争议案例(disagree/unclear)自动入队，优先级排序，resolved 状态跟踪 |
| Regression Lock | 专家验证案例自动锁定，版本升级结果变化自动报警 |

### V5.0 RC: Quality Gate Engine（Active v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| qualityGateTypes.ts | **Active v1.0.0** | QualityCheckResult/ReleaseThreshold/EngineHealthScore/HealthGrade/QualityGateReport 等类型 |
| qualityGateDatabase.ts | **Active v1.0.0** | 默认发布门槛(7项) + 9维健康评分 + 14项检查定义 + 查询函数 |
| qualityGateEngine.ts | **Active v1.0.0** | runQualityGate 主入口 + 14项自动检查 + 健康评分 + Release Gate |

**Quality Gate 14 项检查：**

| ID | 检查项 | 严重级别 | 门槛 |
|----|--------|---------|------|
| qg-001 | 重复代码 | major | P0 已修复 clamp/五行常量/权重 |
| qg-002 | 重复规则 | major | 已通过 — 引用标注 + 五行映射统一 |
| qg-003 | 重复数据库 | major | 通过 |
| qg-004 | RuleRegistry 覆盖率 | critical | v45 缺 2 模块规则 |
| qg-005 | TraceChain 覆盖率 | critical | V4.5 引擎缺 derivation |
| qg-006 | Knowledge 引用覆盖率 | major | 12/19 分类（63%） |
| qg-007 | WarningCode 覆盖率 | minor | 5/20 使用（25%） |
| qg-008 | TypeScript 错误 | critical | 0 错误 |
| qg-009 | 循环依赖 | critical | 0 循环 |
| qg-010 | 死代码 | minor | 已通过 — 7处清理完成 |
| qg-011 | Cache Version 一致性 | minor | 通过 |
| qg-012 | Regression 一致率 | critical | 1045/1045 通过 |
| qg-013 | Test Coverage | critical | 15 套件 / 1078 测试 |
| qg-014 | Performance Threshold | major | 通过 |

**发布门槛（ReleaseThreshold）：**

| 指标 | 门槛 |
|------|------|
| TS Error | 0 |
| RuleRegistry 覆盖率 | 100% |
| TraceChain 覆盖率 | 100% |
| Knowledge 引用率 | ≥ 95% |
| Regression | 100% |
| Performance | ≥ 上一版本 |
| Circular Dependency | 0 |

**Engine Health Score 9 维度：**
Code Quality(15%) + Documentation(10%) + Architecture(15%) + Knowledge(10%) + Testing(15%) + Performance(10%) + Coverage(10%) + Maintainability(10%) + Security(5%)

**V5.0 RC Phase 1.3 Code Cleanup (2026-07-17):**
- qg-002 重复规则: 十神组合规则添加 [源自: RELATION_RULE] 引用标注 + xiyong 五行映射统一引用
- qg-010 死代码: 清理 shenshaDatabase(3项) + tenGodsDatabase(1项) + helpers(2项) + types(1项) 共7处
- Import 整理: 6个引擎文件 import 顺序规范化
- 五行映射: xiyongEngine(55处) + xiyongDatabase(5处+4函数) 统一引用 helpers 公共常量
- 藏干权重: xiyongEngine 权重引用 CLASSIC_CONFIG.hiddenStem

### V5.0 RC Phase 2: Performance Benchmark Engine（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| performanceBenchmarkTypes.ts | **Complete v1.0.0** | BenchmarkScale / EngineBenchmarkResult / FullPipelineBenchmark / ConcurrencyBenchmark / PerformanceBenchmarkReport |
| performanceBenchmarkEngine.ts | **Complete v1.0.0** | runPerformanceBenchmark 主入口 + 单引擎/完整管线/并发/缓存 四类基准测试 |

**测试规模：**

| 规模 | 迭代数 | 用途 |
|------|--------|------|
| single | 1 | 单命盘完整流程耗时 |
| batch-100 | 100 | 小规模批量吞吐量 |
| batch-1000 | 1000 | 中规模批量吞吐量 |
| batch-10000 | 10000 | 大规模压力测试（可选） |

**并发压力：**

| 并发级别 | 请求数 | 统计项 |
|----------|--------|--------|
| 1 | 10 | 单线程基线 |
| 5 | 50 | 中等并发 |
| 10 | 100 | 高并发压力 |

**性能指标：**

| 指标 | 说明 |
|------|------|
| totalTimeMs | 总耗时 |
| avgTimeMs | 平均单次耗时 |
| p95TimeMs | 95 分位耗时 |
| p99TimeMs | 99 分位耗时 |
| throughputPerSecond | 每秒处理量 |
| memoryPeakMB | 内存峰值 |
| memoryAfterGCMB | GC 后内存 |
| cacheHitRate | 缓存命中率 |

### V5.0 RC: Project Dashboard Engine（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| projectDashboardTypes.ts | **Complete v1.0.0** | DashboardMetric / DashboardSection / ProjectDashboard / statusColor / trendIcon |
| projectDashboardEngine.ts | **Complete v1.0.0** | generateProjectDashboard 主入口，读取已有数据生成 6 大板块指标 |

**6 大板块指标：**

| 板块 | 指标示例 |
|------|---------|
| 引擎版本 | Module 1~8 / Case Library / Expert Validation / Quality Gate 版本号 |
| 质量门禁 | 14/14 PASS / Health Score 92.0 / Release Gate PASS / TS Error 0 |
| 规则中心 | 总规则数 / 启用规则 / 覆盖模块 / 覆盖率 100% |
| 知识库 | 知识条目 / 覆盖分类 / 古籍来源 / 平均置信度 |
| 案例库 | 经典命例 / 匿名命例 / 回归样本 / 总计 |
| 测试覆盖 | 测试套件 / 测试用例 / 通过率 / 失败数 |

### V5.0 RC Phase 3: Case Expansion — Case Database v2.0（Complete v2.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| caseLibraryTypesV2.ts | **Complete v2.0.0** | 统一 CaseEntryV2 接口，8 种 category，ExpertOpinionV2 / ConflictRecordV2 / CaseVersionHistoryV2 / ReliabilityDimensionsV2 |
| caseDatabaseV2.ts | **Complete v2.0.0** | 8 种案例类型统一查询 + 统计 + CRUD |
| caseCompatibility.ts | **Complete v1.0.0** | v1 <-> v2 双向迁移与降级 |
| caseDataMigration.ts | **Complete v1.0.0** | v1 数据自动迁移 + 审计 |

**8 种案例类型：**

| 类型 | 说明 | 当前数量 |
|------|------|---------|
| classic | 经典命例 | 10（目标 100+） |
| anonymous | 匿名命例 | 5（目标 1000+） |
| regression | 回归样本 | 10（目标 3000+） |
| expertVerified | 专家验证 | 0（目标 500+） |
| edge | 边缘案例 | 0（目标 300+） |
| conflict | 冲突案例 | 0（目标 100+） |
| historical | 历史命例 | 0（目标 200+） |
| celebrity | 名人命例 | 0（可关闭） |

**统一 CaseEntryV2 结构：**

| 模块 | 字段示例 |
|------|---------|
| Module B 质量评分 | qualityScore / starRating / confidence / excludeFromLearning |
| Module C 专家共识 | expertOpinions[] / consensusScore |
| Module D 冲突记录 | conflicts[] / conflictTopic |
| Module E 回归分级 | regressionTier(gold/silver/bronze/none) |
| Module H 版本历史 | version / history[] / changeLog[] |
| Extension 1 可信度 | reliability / reliabilityDimensions(5 维) |

### V5.0 RC Phase 3: Module B — Case Quality Score（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| caseQualityScoreTypes.ts | **Complete v1.0.0** | QualityDimension / QualityScoreResult / QualityThreshold |
| caseQualityScoreEngine.ts | **Complete v1.0.0** | 5 维度评分(完整度/来源/专家/一致率/引用)，总分 0-100，星级映射，低质量过滤 |

### V5.0 RC Phase 3: Module C — Expert Consensus（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| expertConsensusTypes.ts | **Complete v1.0.0** | ConsensusLevel / ConsensusResult / ConsensusOptions |
| expertConsensusEngine.ts | **Complete v1.0.0** | 多专家观点聚合，Consensus Score 0-100，主导/少数观点识别 |

### V5.0 RC Phase 3: Module D — Disagreement Database（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| disagreementTypes.ts | **Complete v1.0.0** | DisagreementSource / DisagreementSeverity / DisagreementReport |
| disagreementDatabase.ts | **Complete v1.0.0** | 12 条真实命理冲突静态数据（调候/滴天髓/子平/神峰通考等） |
| disagreementEngine.ts | **Complete v1.0.0** | 冲突查询 / 命例关联匹配 / 结构化解释生成 |

### V5.0 RC Phase 3: Module E — Regression Gold Cases（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| regressionGoldTypes.ts | **Complete v1.0.0** | GoldTierCriteria / GoldCaseReport / RegressionGoldSummary |
| regressionGoldEngine.ts | **Complete v1.0.0** | Gold/Silver/Bronze 分级判定，Gold 一致性强制校验(100%) |

### V5.0 RC Phase 3: Module F — Case Search Engine（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| caseSearchTypes.ts | **Complete v1.0.0** | SearchField / SearchOperator / SearchCondition / CaseSearchQuery / SearchResult / SearchFacet |
| caseSearchEngine.ts | **Complete v1.0.0** | 多条件 AND/OR 组合查询，8 字段搜索（格局/十神/神煞/五行/关键词/标签/强弱/喜用神），分页，Facet 统计，结构相似度 |

### V5.0 RC Phase 3: Module G — Benchmark Dataset（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| benchmarkDatasetTypes.ts | **Complete v1.0.0** | BenchmarkScale / BenchmarkDataset / BenchmarkRunResult / BenchmarkReport |
| benchmarkDatasetEngine.ts | **Complete v1.0.0** | Top100/Top500/Top1000 数据集创建，统一 Benchmark 运行，性能/一致率/准确率报告 |

### V5.0 RC Phase 3: Extension 1 — Case Reliability（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| caseReliabilityTypes.ts | **Complete v1.0.0** | ReliabilityLevel / ReliabilityReport / ReliabilityFilter |
| caseReliabilityEngine.ts | **Complete v1.0.0** | 5 维度加权评分(数据完整度/来源可信度/专家数量/一致率/引用次数)，0-100 综合可信度，改进建议生成 |

### V5.0 RC Phase 3: Extension 2 — Report Linker（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| caseReportLinkerTypes.ts | **Complete v1.0.0** | CaseComparisonDetail / SimilarCasesReport / LinkerOptions |
| caseReportLinker.ts | **Complete v1.0.0** | 基于 MasterReport 特征提取，返回 Top 5 最相似命例推荐（共同特点/不同点/历史结果/调理建议/可信度） |

### V5.0 RC Phase 3: Extension 3 — Case Dashboard（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| caseDashboardTypes.ts | **Complete v1.0.0** | CaseDashboardMetric / CaseDashboardSection / CaseDashboard |
| caseDashboardEngine.ts | **Complete v1.0.0** | 6 大板块实时统计（案例概览/质量评分/专家共识/回归分级/可信度/动态统计），overallStatus 综合判断 |

### V5.0 RC Phase 4: Professional Review & Validation Center（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| professionalReviewTypes.ts + Engine | **Complete v1.0.0** | 专家审核中心（待审核/通过/退回/争议/废弃）+ 修订追踪 |
| aiVsExpertCompareTypes.ts + Engine | **Complete v1.0.0** | AI vs 专家对比（8字段一致率 + 差异定位） |
| confidenceCalibrationTypes.ts + Engine | **Complete v1.0.0** | 5 维 Final Trust Score（confidence/reliability/evidence/consensus/regression） |
| ancientClassicsValidatorTypes.ts + Engine | **Complete v1.0.0** | 7 古籍验证中心（引用覆盖率 + 置信度 + 推荐） |
| conflictAnalyzerTypes.ts + Engine | **Complete v1.0.0** | 跨模块冲突检测（强弱-格局-喜用神-流年一致性） |
| professionalBenchmarkTypes.ts + Engine | **Complete v1.0.0** | 行业基准对比（多数据源注册 + 一致率统计） |
| engineReliabilityDashboardTypes.ts + Engine | **Complete v1.0.0** | 引擎驾驶舱（10板块实时统计 + 就绪度评估） |
| releaseCertificationTypes.ts + Engine | **Complete v1.0.0** | 企业发布证书（6项检查 + 证书管理） |

**Phase 4 验收数据：**

| 指标 | 值 |
|------|-----|
| 新增源文件 | 16（8 Types + 8 Engines） |
| 新增测试 | 220（220/220 PASS） |
| TS 错误 | 0 |
| 新增知识库 | 50 条（26→76） |
| 新增规则 | 28 条（67→115） |
| Health Score | 92+ |
| Release | Enterprise Ready |

### V5.0 RC Phase 5: Product Polish（Complete v1.0.0）

| 组件 | 状态 | 说明 |
|------|------|------|
| reportUxTypes.ts + Engine | **Complete v1.0.0** | 报告 UX（阅读节奏 + 风险颜色 + 四线趋势 + 五行可视化 + 十神关系图） |
| explainLevelTypes.ts + Engine | **Complete v1.0.0** | 多级解释引擎（普通/专业/大师三等级） |
| caseCitationTypes.ts + Engine | **Complete v1.0.0** | 案例引用引擎（段落内联引用 + 相关度计算） |
| confidenceVizTypes.ts + Engine | **Complete v1.0.0** | 可信度可视化（仪表盘 + 来源贡献 + 分项明细） |
| explainTraceTypes.ts + Engine | **Complete v1.0.0** | 用户可追溯解释链（追溯树 + 面包屑 + 路径摘要） |
| cacheTierTypes.ts + Engine | **Complete v1.0.0** | 三级缓存（Memory/Redis/Persistent + LRU 淘汰） |
| multiLanguageTypes.ts + Engine | **Complete v1.0.0** | 多语言引擎（zh-CN/zh-TW/ja/ko/en 五语言） |
| dashboardV2Types.ts + Engine | **Complete v1.0.0** | 企业驾驶舱 v2（8 板块实时统计 + 评分 + 建议） |
| licenseManagerTypes.ts + Engine | **Complete v1.0.0** | 许可证管理（Community/Professional/Enterprise 三版本） |
| releaseChecklistTypes.ts + Engine | **Complete v1.0.0** | 发布检查清单（12 项自动检查 + Release Gate） |

**Phase 5 验收数据：**

| 指标 | 值 |
|------|-----|
| 新增源文件 | 20（10 Types + 10 Engines） |
| 新增测试 | 459（459/459 PASS） |
| TS 错误 | 0 |
| Health Score | 95+ |
| Release | Enterprise Ready |

### V5.0 GA Post-Release: Product Launch Infrastructure（Complete v1.0.0）

#### P0: Real User Validation System

| 组件 | 状态 | 说明 |
|------|------|------|
| userFeedbackTypes.ts + Engine | **Complete v1.0.0** | 用户反馈表单（1~5 星评分 + 板块准确度 + 改进建议） |
| expertReviewFormTypes.ts + Engine | **Complete v1.0.0** | 命理师审核表单（6 维评分 + 差异记录 + 审核员档案） |
| aiExpertDiffTypes.ts + Engine | **Complete v1.0.0** | AI vs 专家差异记录（5 类差异 + 解决流程） |
| knowledgeQueueBridgeTypes.ts + Engine | **Complete v1.0.0** | Knowledge Queue Bridge（自动入队 + 分配 + 解决） |

反馈闭环：用户反馈评分<=2 → 自动入队 | 专家审核 verdict=incorrect → 自动入队 | AI 差异 severity=critical → 自动入队 → Case Library + Expert Validation

#### P1: Admin Dashboard Schema

| 组件 | 状态 | 说明 |
|------|------|------|
| adminSchemaTypes.ts + Engine | **Complete v1.0.0** | 运营后台 Schema（10 模块 + RBAC 权限 + 数据验证） |

10 个管理模块：用户管理 / 订单管理 / 报告管理 / 案例管理 / 知识库管理 / 专家审核管理 / 数据统计 / 系统日志 / 权限管理 / API Key 管理

#### P2: GA Release Audit

| 组件 | 状态 | 说明 |
|------|------|------|
| gaReleaseAuditTypes.ts + Engine | **Complete v1.0.0** | GA 发布审核清单（28 项检查 + 12 类别 + Release Gate） |

28 项审核覆盖：安全(4) / 性能(3) / 数据(3) / API(2) / 权限(2) / SEO(2) / 移动端(2) / 浏览器(2) / 监控(2) / 隐私(2) / 支付(2) / 灾难恢复(2)

**GA Post-Release 验收数据：**

| 指标 | 值 |
|------|-----|
| 新增源文件 | 10（5 Types + 5 Engines） |
| 新增测试 | 272（272/272 PASS） |
| TS 错误 | 0 |
| 全量测试 | 2374/2374 PASS |

### V5.0 GA Phase 6: Real World Validation（Complete v1.0.0）

#### P0: 真人测试平台完善

| 组件 | 状态 | 说明 |
|------|------|------|
| userLifecycleTypes.ts + Engine | **Complete v1.0.0** | 用户生命周期系统（7 事件 + 6 阶段漏斗 + 转化率 + 留存率） |
| reportFeedbackEnhancedTypes.ts + Engine | **Complete v1.0.0** | 报告反馈闭环（6 维评分 + 段落标记 + 自动入队 Case Library） |
| expertReviewUpgradeTypes.ts + Engine | **Complete v1.0.0** | 专家审核升级（4 级等级 + 排行榜 + 审核历史 + 一致率统计） |

用户生命周期：register → birth_chart → report_generated → report_read → report_shared → payment_made → feedback_submitted
转化漏斗：visitor → registered → first_report → returning → paying → loyal

反馈闭环：用户 6 维评分（总体/性格/事业/财富/婚姻/健康）+ 段落认可/争议标记 → 争议段落自动入队 Case Library

专家等级：bronze(见习) → silver(20评/70%一致率/60质量) → gold(100评/80%/75) → master(500评/85%/90)
排行榜维度：agreement_rate / total_reviews / quality_score / avg_time

#### P1: 商业化准备

| 组件 | 状态 | 说明 |
|------|------|------|
| productTierTypes.ts + Engine | **Complete v1.0.0** | 产品版本体系（free/professional/vip + 特性门控 + 订阅管理） |
| paymentOrderTypes.ts + Engine | **Complete v1.0.0** | 支付订单系统（4 支付方式 + 6 状态流转 + 30 分钟过期） |

产品版本：free(免费/基础排盘/简版报告) / professional(29.9¥/月/完整报告/大运流年) / vip(99.9¥/月/深度报告/专家审核)
支付方式：wechat / alipay / stripe / apple_pay
订单状态：pending → paid / refunded / failed / expired / cancelled

#### P2: 报告产品优化

| 组件 | 状态 | 说明 |
|------|------|------|
| reportOptimizationTypes.ts + Engine | **Complete v1.0.0** | 报告优化建议（6 默认建议 + 建议生命周期 + 体验评分） |

6 大优化方向：3 秒核心结论 / 减少术语 / 风险-建议配对 / 时间轴 / 分享卡片 / 移动端
建议生命周期：pending → implemented / deferred / rejected

#### P3: 数据资产积累

| 组件 | 状态 | 说明 |
|------|------|------|
| dataAssetTrackerTypes.ts + Engine | **Complete v1.0.0** | 数据资产追踪（里程碑 + 增长记录 + 快照 + 阶段达标判定） |

**阶段完成标准（6 项）：**

| 标准 | 目标 | 当前 |
|------|------|------|
| 案例库积累 | 1000 例 | 25 |
| 知识库扩充 | 500 条 | 76 |
| 专家审核案例 | 50 例 | 0 |
| 有效用户反馈 | 100 条 | 0 |
| 真实报告生成 | 1000 份 | 0 |
| 真实用户测试 | 300 人 | 0 |

**禁止启动 V6 算法研发，直至上述 6 项标准全部达标。**

**Phase 6 验收数据：**

| 指标 | 值 |
|------|-----|
| 新增源文件 | 14（7 Types + 7 Engines） |
| 新增测试 | 249（249/249 PASS） |
| TS 错误 | 0 |
| 全量测试 | 2623/2623 PASS（59 文件） |

**数据闭环架构：**

```
用户生命周期（register → report → read → share → pay → feedback）
    ↓
报告反馈（6 维评分 + 段落标记）
    ↓
专家审核（等级晋升 + 排行榜 + 一致率）
    ↓
AI vs 专家差异（自动记录 + 解决流程）
    ↓
Knowledge Queue（自动入队 → 分配 → 解决）
    ↓
Case Library（案例积累 + 回归验证）
    ↓
数据资产追踪（里程碑 + 增长趋势 + 阶段达标判定）
    ↓
【达标后】→ 允许进入下一代规划
```

### 已冻结的 H1/H2 层

| 层 | 目录 | 状态 |
|-----|------|------|
| H1 Pipeline | `src/lib/bazi/pipeline/` | v1.0.0-h1 Frozen |
| H2 Cache | `src/lib/cache/unified/` | Frozen |
| H2 AI | `src/lib/ai/` | Frozen |

**H3 所有新增代码放在 `src/lib/bazi/pro/`，禁止修改 H1/H2 已冻结代码。**

---

## 3. Module 2: Professional ShenSha Engine

### 3.1 设计目标

建立业内专业神煞系统，不是简单计算神煞，而是**可配置神煞引擎**。

### 3.2 核心能力

| 能力 | 说明 |
|------|------|
| 神煞数据库 | 38种常用神煞统一定义 |
| 神煞分类 | 14个分类（吉神/凶神/桃花/贵人/事业/财运/婚姻/健康/学业/出行/灾煞/刑冲/岁运/特殊）|
| 神煞优先级 | 1-100 数字越大越优先 |
| 冲突处理 | 自动检测羊刃-飞刃、孤辰-寡宿等冲突 |
| 重复去重 | 同一神煞多位置命中自动合并 |
| 多流派 | 通过 ProfessionalConfig 切换算法版本 |
| 可配置 | 支持分类过滤、ID过滤、启用/禁用 |
| 缓存 | Map-based 内存缓存，相同输入直接返回 |
| AI Explain | 结构化解释输出（依据/出处/现代解释/建议） |

### 3.3 数据流

```
ProfessionalFourPillarsResult + gender + options
    │
    ▼
ShenShaDatabase（SHEN_SHA_DATABASE: 38种）
    │
    ▼
统一 Calculator（8 gan/zhi + gender → hit/positions/confidence）
    │
    ▼
冲突检测（detectConflicts: 命中+conflicts数组交集）
    │
    ▼
分类分组 + 吉凶分离 + 优先级排序
    │
    ▼
ShenShaEngineOutput
```

### 3.4 神煞分类覆盖

| 分类 | 数量 | 代表神煞 |
|------|------|----------|
| 吉神 | 4 | 天德、月德、天赦、三奇贵人、福星 |
| 贵人 | 1 | 天乙贵人 |
| 学业 | 3 | 文昌、学堂、词馆 |
| 事业 | 2 | 将星、国印 |
| 财运 | 2 | 金舆、禄神 |
| 桃花 | 1 | 桃花 |
| 婚姻 | 2 | 红鸾、天喜 |
| 凶神 | 9 | 羊刃、飞刃、魁罡、亡神、劫煞、天罗地网、勾绞、飞廉、四废、浮沉 |
| 灾煞 | 3 | 灾煞、吊客、丧门、披麻 |
| 健康 | 1 | 血刃 |
| 出行 | 1 | 驿马 |
| 特殊 | 2 | 华盖、孤辰、寡宿 |

### 3.5 冲突检测规则

```typescript
// 羊刃 ↔ 飞刃
// 孤辰 ↔ 寡宿
// 命中且 conflicts 数组有交集时触发 MULTI_RULE_CONFLICT
```

### 3.6 AI Explain 接口

```typescript
import { explainShenSha } from '@/lib/bazi/pro'

const explain = explainShenSha({
  result: shenShaResult,
  dayMaster: '甲',
})

// 输出：
// {
//   basis: '天乙贵人以甲日干查得，甲戊庚牛羊',
//   classicalReference: '三命通会',
//   modernInterpretation: '贵人相助...',
//   conditions: '逢凶化吉...',
//   conflictSituation: null,
//   confidenceAssessment: '可信度95%，高置信。',
//   suggestions: ['善用天乙贵人之吉象，把握机遇。'],
// }
```

### 3.7 使用方式

```typescript
import { calculateShenSha, SHEN_SHA_ENGINE_VERSION } from '@/lib/bazi/pro'

// 全量计算
const shensha = calculateShenSha(pillarsResult, { gender: '男' })

// 仅计算特定分类
const marriage = calculateShenSha(pillarsResult, {
  gender: '男',
  categories: ['桃花', '婚姻'],
})

// 仅计算指定神煞
const onlyTianyi = calculateShenSha(pillarsResult, {
  gender: '男',
  onlyIds: ['tianyi'],
})

// 关闭冲突检测
const noConflict = calculateShenSha(pillarsResult, {
  gender: '男',
  detectConflicts: false,
})
```

---

## 4. TraceChain 推导链

### 第二原则：所有计算可追溯

每个计算结果都必须带推导链，包含：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 步骤唯一标识 |
| `name` | string | 步骤名称 |
| `input` | Record | 输入参数快照 |
| `output` | Record | 输出结果快照 |
| `ruleId` | string? | 命中规则 ID |
| `ruleDescription` | string? | 规则描述 |
| `confidence` | number | 置信度 0-1 |
| `algorithmVersion` | AlgorithmVersion | 算法版本（如 `v1.0-classic`） |
| `source` | AlgorithmSource | 算法来源（如 `三命通会`） |
| `warnings` | string[] | 警告码列表 |
| `children` | DerivationStep[]? | 子步骤（树状结构） |
| `timestamp` | number | 时间戳 |

### 使用方式

```typescript
import { createChain, createTreeNode } from '@/lib/bazi/pro'

// 创建推导链
const chain = createChain(steps, elapsedMs, {
  engineVersion: '1.0.0',
  algorithmVersion: 'v1.0-classic',
  warnings: ['TIMEZONE_MISSING'],
})

// 创建树状节点
const treeNode = createTreeNode({
  id: 'solar-time',
  name: '真太阳时',
  input: { birth: '1990-01-01T10:00' },
  output: { adjusted: true },
  confidence: 0.90,
  algorithmVersion: 'v1.0-classic',
  source: 'Modern Rule',
  children: [childNode],
})
```

---

## 5. WarningCode 规范

### 类型定义

```typescript
type WarningCode =
  | 'DST_WARNING'              // 夏令时
  | 'TIMEZONE_MISSING'         // 缺时区
  | 'TRUE_SOLAR_TIME_MISSING'  // 未启用真太阳时
  | 'UNSUPPORTED_YEAR'         // 超出年份范围
  | 'INVALID_GANZHI'           // 无效干支
  | 'NA_YIN_EMPTY'             // 纳音为空
  | 'CHILD_HOUR_BOUNDARY'      // 子时边界
  | 'SOLAR_TERM_PRECISION'     // 节气精度
  | 'UNKNOWN_RULE'             // 未知规则
  | 'FORMULA_OUT_OF_RANGE'     // 公式越界
  | 'MULTI_RULE_CONFLICT'     // 规则冲突
  | 'LOW_CONFIDENCE'           // 低置信度
  | 'FALLBACK_USED'            // 降级使用
  | 'BIRTH_TIME_UNKNOWN'       // 时间未知
  | 'GENDER_MISSING'           // 缺性别
  | 'LOCATION_IMPRECISE'       // 坐标不精确
  | 'CACHE_MISS'               // 缓存未命中
  | 'TIMEOUT'                  // 超时
  | 'PERFORMANCE_DEGRADED'     // 性能降级
  // ... 新增 WarningCode 在此扩展
```

### 严重级别

| 级别 | 说明 | 示例 |
|------|------|------|
| `info` | 信息提示 | `TIMEZONE_MISSING` |
| `warn` | 需要关注 | `DST_WARNING` |
| `error` | 严重问题 | `UNSUPPORTED_YEAR` |

### 使用方式

```typescript
import { getWarningDescription, getWarningLevel } from '@/lib/bazi/pro'

const level = getWarningLevel('DST_WARNING')    // 'warn'
const desc = getWarningDescription('DST_WARNING') // '夏令时校正可能不精确'
```

---

## 6. ProfessionalConfig 使用方式

### 配置结构

```typescript
const config: ProfessionalConfig = {
  algorithmVersion: 'v1.0-classic',
  defaultSource: '三命通会',
  mingGong:  { yangStartGanIdx: 2, yinStartGanIdx: 8, ... },
  shenGong:  { ... },
  taiYuan:   { ganOffset: 1, zhiOffset: 3, ... },
  taiXi:     { ... },
  hiddenStem: { benWeight: 0.6, zhongWeight: 0.3, yaoWeight: 0.1 },
  kongWang:  { includeYear: true },
  changSheng: { yinReverse: true },
}
```

### 切换流派（未来）

```typescript
// 古法配置
import { CLASSIC_CONFIG } from '@/lib/bazi/pro'

// 未来可定义 MODERN_CONFIG、SCHOOL_A_CONFIG 等
// 无需修改核心算法，仅切换配置
```

---

## 7. RuleRegistry 说明

### 规则条目结构

```typescript
interface RuleEntry {
  id: string               // 唯一 ID
  name: string             // 规则名称
  category: RuleCategory   // 分类
  algorithmVersion: AlgorithmVersion
  source: AlgorithmSource
  configKey?: string       // 关联 ProfessionalConfig 键
  enabled: boolean
  priority: number
  module: string           // 所属 Module
  description?: string
}
```

### 分类

| Category | 说明 |
|----------|------|
| `pillar` | 四柱排盘 |
| `shensha` | 神煞 |
| `shishen` | 十神 |
| `wangshuai` | 旺衰 |
| `geju` | 格局 |
| `xiyong` | 喜用神 |
| `dayun` | 大运 |
| `liunian` | 流年 |
| `fengshui` | 风水 |

### 使用方式

```typescript
import { defaultRuleRegistry, RuleRegistry } from '@/lib/bazi/pro'

// 查询规则
defaultRuleRegistry.get('minggong')
defaultRuleRegistry.findByCategory('pillar')
defaultRuleRegistry.findByModule('module1-four-pillars')
defaultRuleRegistry.findByModule('module2-shensha')

// 新模块注册规则
const registry = new RuleRegistry()
registry.register({
  id: 'tianyi-guiren',
  name: '天乙贵人',
  category: 'shensha',
  algorithmVersion: 'v2.0-classic',
  source: '三命通会',
  configKey: 'shensha.tianyi',
  enabled: true,
  priority: 95,
  module: 'module2-shensha',
  description: '以日干查贵人星',
})
```

---

## 8. 新模块开发规范

### 开发流程

```
1. 在 pro/ 下创建新模块文件（如 shenshaEngine.ts）
2. 在 RuleRegistry 中注册新规则
3. 每个计算结果带 TraceChain（createChain + createTreeNode）
4. 异常使用 WarningCode
5. 配置参数放入 ProfessionalConfig
6. 编写测试（回归 + Golden Case + Boundary）
7. 冻结 + 回归 + Benchmark
```

### 命名规范

- 源文件：`camelCase.ts`（如 `shenshaEngine.ts`）
- 规则 ID：`kebab-case`（如 `tianyi-guiren`）
- 规则分类：`RuleCategory` 枚举值
- 测试文件：`kebab-case.test.ts`
- 模块标识：`moduleN-name`（如 `module2-shensha`）

### 禁止事项

- ❌ 修改 `src/lib/bazi/pipeline/`（H1 Frozen）
- ❌ 修改 `src/lib/ai/`（H2 Frozen）
- ❌ 修改 `src/lib/cache/unified/`（H2 Frozen）
- ❌ 重复定义基础常量（必须引用 `@/lib/core`）
- ❌ 使用 `as any`（新增代码禁止）
- ❌ AI 直接计算命理结果

### 必须事项

- ✅ 所有常量引用 Core SSoT
- ✅ 所有结果带 TraceChain
- ✅ 所有异常使用 WarningCode
- ✅ 所有规则注册到 RuleRegistry
- ✅ 所有配置通过 ProfessionalConfig
- ✅ 新增模块不得影响已冻结模块测试

---

## 9. Module 3: Professional Ten Gods Engine

### 9.1 设计目标

建立业内专业十神系统，基于《子平真诠》经典理论，实现完整的十神计算、力量评估、关系分析与组合匹配能力。不只是简单的十神标注，而是**可配置十神引擎**，支持透藏分析、旺相休囚死判定、得令得地得势三维力量评估、十神关系网络构建与经典组合格局匹配。

### 9.2 核心能力

| 能力 | 说明 |
|------|------|
| 十神计算 | 10种十神（比肩、劫财、食神、伤官、正财、偏财、正官、七杀、正印、偏印）的精准计算与定位 |
| 透藏分析 | 天干透出 + 地支藏干全量分析，区分天干十神与地支藏干十神的出现层次 |
| 旺相休囚死 | 以月令为基准，判断十神五行的旺相休囚死状态，决定十神力量层次 |
| 得令得地得势 | 综合月令（得令）、地支藏干（得地）、天干帮扶（得势）三维度评估十神实际力量 |
| 关系网络 | 15条十神关系规则，构建十神之间的生克合冲刑害关系网络图 |
| 组合匹配 | 15条经典十神组合规则（食神生财、财生官杀、杀印相生等），自动匹配命局中的经典格局 |
| 评分系统 | 基于十神力量、关系、组合的综合评分 |
| AI Explain | 结构化解释输出（依据/出处/现代解释/建议），支持每种十神与组合的详细解读 |

### 9.3 数据流

```
ProfessionalFourPillarsResult + gender + options
    │
    ▼
十神基础计算（天干十神 + 地支藏干十神）
    │
    ▼
透藏分析（天干透出层次 vs 地支藏干层次）
    │
    ├──→ 旺相休囚死（月令基准 → 十神五行力量状态）
    │
    ├──→ 得令得地得势（三维力量综合评估 → FiveElementPower）
    │
    ├──→ 关系网络（15条关系规则 → TenGodRelationNetwork）
    │
    └──→ 组合匹配（15条组合规则 → TenGodCombination[]）
    │
    ▼
综合评分 + 排序
    │
    ▼
TenGodsEngineOutput
    │
    ▼
AI Explain（generateTenGodExplain → TenGodExplainOutput）
```

### 9.4 使用方式

```typescript
import {
  calculateTenGods,
  clearTenGodsCache,
  getTenGodsCacheSize,
  TEN_GODS_ENGINE_VERSION,
  type TenGodsEngineOptions,
} from '@/lib/bazi/pro'

// 全量计算十神
const result = calculateTenGods(pillarsResult, {
  gender: '男',
  includeHiddenStems: true,    // 包含地支藏干十神
  includeRelations: true,      // 包含十神关系网络
  includeCombinations: true,   // 包含组合匹配
  includeWangShuai: true,      // 包含旺相休囚死
  includePowerAnalysis: true,  // 包含得令得地得势
})

console.log(result.tenGods)        // 10种十神的详细出现信息
console.log(result.touCang)        // 透藏分析
console.log(result.wangShuai)      // 旺相休囚死状态
console.log(result.powerAnalysis)  // 得令得地得势
console.log(result.relationNetwork) // 十神关系网络
console.log(result.combinations)   // 匹配到的经典组合

// 缓存管理
clearTenGodsCache()
const cacheSize = getTenGodsCacheSize()

// AI 解释
import { generateTenGodExplain } from '@/lib/bazi/pro'

const explain = generateTenGodExplain({
  tenGodType: '正官',
  occurrences: result.tenGods['正官'],
  dayMaster: '甲',
  wangShuaiState: '旺',
  powerLevel: 0.85,
})

// 输出：
// {
//   basis: '甲日主见辛金为正官，辛金克甲木...',
//   classicalReference: '子平真诠',
//   modernInterpretation: '正官代表事业、权力...',
//   conditions: '正官得令则事业顺利...',
//   confidenceAssessment: '可信度90%，高置信。',
//   suggestions: ['正官为用神，宜顺势而为...'],
// }
```
