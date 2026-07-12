# QiEngine V4 Core API — 冻结声明

## 冻结时间

2026-07-09

## 冻结范围

以下文件和接口构成 QiEngine V4 Core API，后续所有模块（P1/P2/P3/P4/P5）**只能扩展，禁止修改**。

### 冻结文件

```
src/lib/bazi/qi/
├── types.ts        — 核心类型（QiNode / QiOperation / QiSnapshot / QiPipelineContext）
├── executor.ts     — QiExecutor（事务执行器 + EventBus）
├── pipeline.ts     — QiPipeline（流水线驱动器）
├── aggregator.ts   — 多维聚合 + Diff + Hash
├── validator.ts    — 每步自动校验
├── events.ts       — QiEventBus（事件总线）
├── builder.ts      — QiBuilder
├── modifier.ts     — SeasonModifier
├── engine.ts       — QiEngine 主入口
└── index.ts        — 统一导出
```

### 冻结接口

| 接口 | 说明 |
|------|------|
| `QiNode` | 唯一底层操作单元（id/rootId/element/strength/source/state/active/history） |
| `QiOperation` | 统一操作指令（targetId/action/delta/ruleId/reason） |
| `QiSnapshot` | Immutable 快照（elementScores/pillarScores/sourceScores/hash/diffs） |
| `QiPipelineContext` | 统一上下文（ctx/executor/snapshots/metadata/cache/version） |
| `PipelineStep` | 流水线步骤接口（name/run） |
| `QiExecutor` | 事务执行器（begin/commit/rollback/execute + EventBus） |
| `QiPipeline` | 流水线驱动器（addStep/runAll） |
| `QiHistory` | 结构化变更记录（modifier/action/before/after/delta/sequence/version） |
| `QiDiffEntry` | 差异条目（nodeId/field/before/after/cause） |
| `ValidationIssue` | 校验问题（level/step/message/nodeId） |

### 扩展规则

1. **新增模块**：创建新文件（如 `detector/heHuaDetector.ts`），通过 `pipeline.addStep()` 注册，不修改 `engine.ts`
2. **新增类型**：在 `types.ts` 中追加新接口（如 `TongGuanCommand`），不修改已有接口
3. **新增校验规则**：在 `validator.ts` 中追加新检查项，不修改已有检查项
4. **新增事件类型**：在 `types.ts` 的 `QiEventType` 中追加新类型

### 禁止操作

- 修改 `QiNode` 的字段定义（新增字段除外）
- 修改 `QiOperation` 的字段定义（新增字段除外）
- 修改 `QiSnapshot` 的字段定义（新增字段除外）
- 修改 `QiExecutor` 的事务语义（begin/commit/rollback）
- 修改 `QiPipeline` 的驱动逻辑
- 修改 `engine.ts` 的主流程编排
- 修改已有 `QiHistory` 的字段

### 引擎零改动原则

从 V4 Core 冻结开始，所有 P1+ 模块的集成方式：

```typescript
// P1: 在独立文件中定义 Step
// src/lib/bazi/qi/detector/heHuaDetector.ts
export const heHuaStep: PipelineStep = {
  name: 'HeHuaDetector',
  run: (qiNodes, pCtx) => {
    pCtx.executor.begin()
    const commands = detectHeHua(qiNodes, pCtx.ctx)
    const ops = commandsToOperations(commands)
    const result = pCtx.executor.execute(ops, 'HeHuaDetector')
    pCtx.executor.commit()
    return result
  },
}

// 注册（在 engine.ts 外部的初始化代码中）
pipeline.addStep(heHuaStep)
```

**`engine.ts` 永远不需要修改。**
