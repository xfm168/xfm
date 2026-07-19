# Release v1.0.0-h1 — 八字 Pipeline 架构

> 玄风门 XuanFengMen V4.4 Enterprise — H1 Pipeline 架构发布说明
>
> Git Tag: `v1.0.0-h1` | Commit: `17feb6f` | 日期: 2026-07-15

---

## 1. 版本信息

| 项目 | 数值 |
|------|------|
| Pipeline Version | 1.0.0 |
| Git Commit | 17feb6f |
| Git Tag | v1.0.0-h1 |
| 源码文件数量 | 8 |
| 总代码行数 | 1,207 行（源码）+ 374 行（测试） |
| Pipeline 文件数量 | 8 |
| Step 数量 | 20 |
| Hook 数量 | 5 |
| Registry API 数量 | 8 |
| Metadata 字段数量 | 13 |
| Cache Interface 数量 | 6 |
| 测试数量 | 37 tests / 4 suites |
| 测试通过率 | 100% |
| TypeScript Error 数（pipeline/） | 0 |

---

## 2. 新增功能

- **PipelineRegistry** — Step 中央注册表，支持注册/查询/依赖校验/拓扑排序
- **PipelineCache 接口 + MemoryPipelineCache** — LRU + TTL 缓存策略
- **PipelineHooks 生命周期** — beforePipeline / afterPipeline / beforeStep / afterStep / onError
- **deepFreeze** — 不可变结果冻结（递归冻结全部嵌套对象/数组）
- **PipelineMetadata** — 13 字段运行时元数据（pipelineVersion/stepVersions/executedSteps/skippedSteps/totalTime/memoryUsage/cacheHits/cacheMisses/retryCount/pipelineStart/pipelineEnd/stepCount/traceId）
- **StepResult** — 统一 Step 结果格式 `{ success, data?, warnings, metadata? }`
- **StepDefinition** — 注册式 Step（20 个），支持 id/name/version/enabled/dependsOn/execute
- **Step ID / Version** — 稳定标识体系（id 不可变，version 控制缓存失效）
- **Pipeline Progress** — 动态进度回调 `PipelineProgressEvent { stepId, stepName, progress, elapsed }`
- **Pipeline Logger** — `[traceId][stepId] stepName elapsedms` 格式 Trace 日志
- **emptyHooks + mergeHooks** — 默认空钩子 + 钩子合并工具

---

## 3. 架构升级

### 3.1 三层分离

| 层级 | 文件 | 职责 |
|------|------|------|
| UI 层 | BaziChart.tsx | 只读消费 Pipeline 结果 |
| Pipeline 调度层 | index.ts (160行) | 纯调度：遍历/钩子/冻结 |
| Step 执行层 | steps.ts (496行) | 20 个 StepDefinition + 注册 |
| 分析引擎层 | 各模块 | 纯计算，无状态依赖 |

### 3.2 核心重构

- Pipeline 主文件从臃肿拆分为 **8 个独立模块**
- `index.ts` **160 行零业务逻辑**（纯调度器）
- `BaziChart.tsx` 移除 **13+ 直接分析函数调用**，统一通过 Pipeline 获取数据
- `fullReport` **唯一来源**（无 fallback）
- `shenSha` 统一为 `shenShaDetail`

---

## 4. 目录结构

```
pipeline/
├── index.ts          # 调度器主文件（160行），零业务逻辑
├── types.ts          # 类型定义 + PIPELINE_VERSION = '1.0.0'
├── steps.ts          # 20 个 StepDefinition + 注册到 PipelineRegistry
├── registry.ts       # PipelineRegistry（注册/查询/依赖校验/拓扑排序）
├── cache.ts          # PipelineCache 接口 + MemoryPipelineCache 实现
├── hooks.ts          # PipelineHooks（5 个生命周期钩子）
├── immutable.ts      # deepFreeze()（递归冻结）
├── score.ts          # calculateBaZiScore（纯函数提取）
└── __tests__/
    ├── registry.test.ts    # 14 tests
    ├── cache.test.ts       # 9 tests
    ├── immutable.test.ts   # 7 tests
    └── hooks.test.ts       # 7 tests
```

---

## 5. 公开 API

| 导出 | 类型 | 说明 |
|------|------|------|
| `runBaZiPipeline()` | function | 向后兼容入口（BirthInfo → Result） |
| `runBaZiPipelineFromBirthData()` | function | 主入口（BirthData + Progress + Hooks） |
| `PipelineRegistry` | class | Step 注册表（只读查询） |
| `PipelineCache` | interface | 缓存接口类型 |
| `PipelineHooks` | interface | 生命周期钩子类型 |
| `PipelineProgressCallback` | type | 进度回调函数类型 |
| `PipelineMetadata` | interface | 运行时元数据类型 |
| `StepResult` | interface | Step 结果统一格式 |
| `PIPELINE_VERSION` | const | 版本号 '1.0.0' |

---

## 6. 性能基线（detailed 模式）

> 数据来源：`scripts/pipeline-benchmark-v2.mts` | 测试环境：Node.js 22 | 单次运行

### 6.1 Pipeline 分项耗时

| 项目 | 数值 |
|------|------|
| Pipeline 总耗时 | **82.70 ms** |
| AnalysisCenter | 39.57 ms |
| Steps 总耗时 | 36.19 ms |
| deepFreeze | 5.78 ms |
| Registry 校验 | 0.51 ms |
| Metadata 构建 | 0.06 ms |
| Cache 初始化 | 0.04 ms |
| Hook 初始化 | 0.01 ms |

### 6.2 Step 耗时排行榜

| 排名 | Step ID | 名称 | 耗时 (ms) | 占比 |
|------|---------|------|-----------|------|
| 1 | liunian | 流年推演 | 11.067 | 30.6% |
| 2 | full-report | 完整报告 | 5.781 | 16.0% |
| 3 | detail-enhance | 详解增强 | 4.857 | 13.4% |
| 4 | mingju | 命局总论 | 2.799 | 7.7% |
| 5 | pillars | 四柱详解 | 2.017 | 5.6% |
| 6 | comprehensive | 综合评分 | 1.646 | 4.5% |
| 7 | liuyue | 流月分析 | 1.572 | 4.3% |
| 8 | shishen | 十神详解 | 1.060 | 2.9% |
| 9 | career | 事业分析 | 1.012 | 2.8% |
| 10 | marriage | 婚姻分析 | 0.955 | 2.6% |
| 11 | health | 健康分析 | 0.851 | 2.4% |
| 12 | wealth | 财富分析 | 0.773 | 2.1% |
| 13 | fengshui | 风水联动 | 0.756 | 2.1% |
| 14 | shensha | 神煞详解 | 0.595 | 1.6% |
| 15 | knowledge | 知识库引用 | 0.174 | 0.5% |
| 16 | score | 基础评分 | 0.108 | 0.3% |
| 17 | geju | 格局判断 | 0.068 | 0.2% |
| 18 | wuxing | 五行分析 | 0.059 | 0.2% |
| 19 | dayun | 大运推演 | 0.031 | 0.1% |
| 20 | yongshen | 用神判定 | 0.014 | 0.0% |

| 指标 | 数值 |
|------|------|
| 最快 Step | yongshen 0.014 ms |
| 最慢 Step | liunian 11.067 ms |
| 平均 Step 耗时 | 1.81 ms |
| Cache Hit | 0 |
| Cache Miss | 0 |
| Memory Usage | N/A（Node.js 环境） |

---

## 7. 最终统计

| 指标 | 数值 |
|------|------|
| Pipeline Version | 1.0.0 |
| Git Commit | 295084a |
| Git Tag | v1.0.0-h1 |
| 源码文件数量 | 8 |
| 总代码行数 | 1,207 行 |
| 测试代码行数 | 374 行 |
| Step 数量 | 20 |
| Hook 数量 | 5 |
| Registry API 数量 | 8 |
| Metadata 字段数量 | 13 |
| Cache Interface 数量 | 6 |
| 测试数量 | 37 tests / 4 suites |
| 测试通过率 | 100% |
| TypeScript pipeline/ Error 数 | 0 |
| index.ts 行数 | 160 |

---

## 8. 已知问题

- **liunian（流年推演）耗时较高**（11ms），占总 Step 耗时的 30.6%。H2 可通过缓存优化。
- **MemoryPipelineCache 为纯内存实现**，页面刷新后丢失。H2 将引入 IndexedDB / LocalStorage 持久化。
- **performance.memory（JS Heap）** 仅在 Chrome 支持，其他浏览器返回 N/A。
- **deepFreeze 耗时 5.78ms**（递归遍历大型 Result 对象），可考虑 H2 优化为 Proxy-based 惰性冻结。

### Breaking Change

None.

### Migration

None. v1.0 为初始架构版本，无历史 API 需要迁移。

---

## 9. API Freeze

以下接口自 `v1.0.0-h1` 起进入**冻结状态**，H2 不允许破坏兼容性修改。只能新增。

| 序号 | 接口 | 类型 | 文件 |
|------|------|------|------|
| 1 | `BaZiPipelineResult` | interface | types.ts |
| 2 | `StepResult<T>` | interface | types.ts |
| 3 | `PipelineMetadata` | interface | types.ts |
| 4 | `PipelineHooks` | interface | hooks.ts |
| 5 | `PipelineRegistry` | class | registry.ts |
| 6 | `PipelineCache` | interface | cache.ts |
| 7 | `PipelineProgressEvent` | interface | types.ts |
| 8 | `StepDefinition` | interface | steps.ts |
| 9 | `runBaZiPipeline()` | function | index.ts |
| 10 | `runBaZiPipelineFromBirthData()` | function | index.ts |

> **v1.x 不允许修改任何 Public API。只能新增。不得删除。不得修改签名。**

---

## 10. H2 Roadmap

### 开发分支

`feature/h2-cache`（基于 `v1.0.0-h1`）

### 允许范围

- Unified Cache（统一缓存体系）
- Cache Key 规范
- Cache TTL 策略
- LRU 淘汰优化
- IndexedDB 持久化
- LocalStorage 备用
- Memory Cache 一级缓存
- CacheManager 统一管理
- Cache Metrics（命中率统计）
- Cache Warmup（预热）
- Cache Version（版本化失效）
- Cache 自动失效机制

### 禁止范围

- 不得修改 Pipeline 调度器（index.ts）
- 不得修改 Registry（registry.ts）
- 不得修改 Hooks（hooks.ts）
- 不得修改 Metadata 结构（types.ts PipelineMetadata）
- 不得修改 StepDefinition（steps.ts）
- 不得修改 StepResult（types.ts）
- 不得修改 Public API 签名
- 不得修改 Progress Event
- 不得修改 Result Schema（BaZiPipelineResult）

所有 H2 修改必须保持 H1 API **完全兼容**。

---

## 架构图

> 8 类 Mermaid 架构图，详见 [Pipeline 架构文档](../pipeline-architecture/pipeline-architecture.html)

1. **整体架构图** — 三层分离
2. **Registry 注册/校验/调度流程图**
3. **Hook 生命周期时序图**
4. **Cache 接口抽象流程图**
5. **Step 调度完整流程图**
6. **Metadata 结构图**
7. **Step DAG 依赖图**
8. **Result 数据流图**
