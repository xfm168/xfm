# 八字 Pipeline 架构文档

> V4.4 Enterprise — Step 注册式调度架构

## 版本

- Pipeline Version: 1.0.0
- Last Updated: 2026-07-15

## 架构概述

```
BirthData
    │
    ▼
PipelineRegistry.register(step) ─── 可插拔 Step 注册
    │
    ▼
PipelineRegistry.validateDependencyGraph() ─── 依赖图校验
    │
    ▼
runBaZiPipelineFromBirthData(input, onProgress?)
    │
    ├─ Step 1: AnalysisCenter (单一数据源)
    │
    ├─ Step 2-21: 注册式调度 (PIPELINE_STEPS)
    │   ├─ beforeStep Hook
    │   ├─ step.execute(ctx) → StepResult
    │   ├─ afterStep Hook
    │   └─ onProgress callback
    │
    ├─ Result 冻结 (deepFreeze)
    │
    └─ BaZiPipelineResult (只读)
            │
            ▼
        BaziChart.tsx (UI 只读)
```

## 核心文件

| 文件 | 行数 | 职责 |
|------|------|------|
| `index.ts` | ≤160 | 调度器：遍历 Steps + Progress + Error + Metadata |
| `steps.ts` | ~400 | Step 定义 + 注册 |
| `registry.ts` | ~120 | 注册中心 + 依赖校验 + 拓扑排序 |
| `types.ts` | ~140 | 类型定义 |
| `score.ts` | ~50 | 基础评分独立模块 |
| `cache.ts` | ~100 | PipelineCache 接口 + MemoryPipelineCache |
| `hooks.ts` | ~80 | Hook 生命周期 |
| `immutable.ts` | ~50 | Result 冻结工具 |

## Step 流程

```
analysis-center ─── AnalysisCenter 单一数据源
    │
geju ─── 格局判断 (id: geju, v1)
    │
yongshen ─── 用神判定 (id: yongshen, v1)
    │
knowledge ─── 知识库引用 (id: knowledge, v1, dep: [geju])
    │
score ─── 基础评分 (id: score, v1, dep: [geju, yongshen])
    │
dayun ─── 大运推演 (id: dayun, v1)
    │
liunian ─── 流年推演 (id: liunian, v1, dep: [dayun])
    │
wuxing ─── 五行分析 (id: wuxing, v1)
    │
liuyue ─── 流月分析 (id: liuyue, v1)
    │
career ─── 事业分析 (id: career, v1, dep: [wuxing])
    │
marriage ─── 婚姻分析 (id: marriage, v1, dep: [wuxing])
    │
wealth ─── 财富分析 (id: wealth, v1, dep: [liunian, wuxing])
    │
health ─── 健康分析 (id: health, v1, dep: [wuxing])
    │
mingju ─── 命局总论 (id: mingju, v1, dep: [score, dayun])
    │
pillars ─── 四柱详解 (id: pillars, v1)
    │
shishen ─── 十神详解 (id: shishen, v1)
    │
shensha ─── 神煞详解 (id: shensha, v1, dep: [wuxing])
    │
comprehensive ─── 综合评分 (id: comprehensive, v1, dep: [career, marriage, wealth, health])
    │
fengshui ─── 风水联动 (id: fengshui, v1, dep: [yongshen, wuxing])
    │
detail-enhance ─── 详解增强 (id: detail-enhance, v1, dep: [dayun, liunian])
    │
full-report ─── 完整报告 (id: full-report, v1)
```

## Context

```typescript
interface StepContext {
  chart: BaZiChart
  analysis: UnifiedAnalysisData
  geJu: GeJuResult
  xiYong: XiYongShenResult
  birthData: BirthData
  options: BaZiAnalysisOptions
  result: BaZiPipelineResult
  cache: Map<string, unknown>  // 共享缓存
  traceId: string              // 链路追踪
}
```

## Cache

```typescript
interface PipelineCache {
  get<T>(key: string): T | undefined
  set<T>(key: string, value: T, ttl?: number): void
  delete(key: string): boolean
  has(key: string): boolean
  clear(): void
  getStats(): { size: number; hits: number; misses: number }
}
```

当前实现：MemoryPipelineCache（LRU + TTL）
未来可替换：RedisCache / IndexedDBCache / SupabaseCache

## Progress

```typescript
interface PipelineProgressEvent {
  stepId: string
  stepName: string
  progress: number    // 0-100
  elapsed: number    // ms
}
```

## Metadata

```typescript
interface PipelineMetadata {
  pipelineVersion: string
  stepVersions: Record<string, number>
  executedSteps: string[]
  skippedSteps: string[]
  totalTime: number
  memoryUsage?: number
  cacheHits?: number
  cacheMisses?: number
  retryCount?: number
  pipelineStart?: number
  pipelineEnd?: number
  stepCount?: number
}
```

## Error Flow

```
Step.execute() throws
    │
    ▼
catch (err)
    │
    ├─ stepRecord.status = 'error'
    ├─ stepRecord.error = errMsg
    ├─ result.success = false
    ├─ result.error = '[stepId] stepName: errMsg'
    └─ onError Hook
```

## Hook 生命周期

```
beforePipeline()
    │
    ├─ Step N: beforeStep() → execute() → afterStep()
    ├─ Step N+1: beforeStep() → execute() → afterStep()
    └─ ...
        │
afterPipeline()
```

## StepResult

```typescript
interface StepResult<T = unknown> {
  success: boolean
  data?: T
  warnings: string[]
  metadata?: Record<string, unknown>
}
```

## 扩展指南

### 新增 Step

1. 在 steps.ts 中定义 StepDefinition
2. 添加到 registerAll 数组
3. 无需修改 index.ts

### 替换缓存

1. 实现 PipelineCache 接口
2. 替换 MemoryPipelineCache 实例
3. 无需修改任何 Step

### 监控/埋点

1. 实现 PipelineHooks
2. 传入 runBaZiPipelineFromBirthData
3. 无需修改任何 Step
