# QiEngine 技术规格书

## 1. 架构定位

QiEngine 是玄风门八字系统的底层气流计算引擎。所有上层模块（旺衰、格局、喜用神、大运、流年）统一读取 QiEngine 输出，禁止私自统计五行。

## 2. 核心类型

### 2.1 QiNode（气节点）

QiNode 是引擎的唯一最小操作单元。四柱中的每一股气（天干、本气、中气、余气）都对应一个 QiNode。

```typescript
export interface QiNode {
  id: string                          // 唯一标识，如 "year-gan-甲"
  pillar: 'year' | 'month' | 'day' | 'hour'
  branch: EarthlyBranch               // 所在地支
  hiddenStem: HeavenlyStem | null     // 藏干（天干本身为 null）
  element: FiveElement                // 五行
  strength: number                    // 气值（初始由 QiBuilder 分配）
  source: '天干' | '本气' | '中气' | '余气'
  state: QiState
  history: QiChangeRecord[]           // 变更历史，保证可追溯
}

export type QiState =
  | '正常'
  | '被抽'
  | '合化'
  | '消散'
  | '被冲'
  | '被刑'
  | '被害'
  | '被破'

export interface QiChangeRecord {
  step: string        // 执行步骤，如 'SeasonModifier' / 'HeHuaEngine'
  action: string      // 动作：'抽气' | '增气' | '迁移' | '消散' | '加权'
  amount: number      // 变化量（正为增，负为减）
  reason: string      // 原因说明
  timestamp: number   // 顺序标记，用于回溯时排序
}
```

### 2.2 HeHuaCommand（合化指令）

HeHuaEngine 不直接修改 QiNode，而是生成指令，由 QiTransformer 统一执行。

```typescript
export interface HeHuaCommand {
  type: '天干五合' | '地支六合' | '地支三合' | '地支三会'
  sources: string[]         // 参与合化的干支标识
  huaElement: FiveElement   // 化出的五行
  success: boolean          // 是否成化
  isHeBan: boolean         // 是否合绊
  reason: string
  deductions: QiDeduction[]
  additions: QiAddition[]
}

export interface QiDeduction {
  targetId: string    // 被抽的 QiNode.id
  amount: number
  detail: string
}

export interface QiAddition {
  targetId: string    // 获得气的 QiNode.id（可新建）
  element: FiveElement
  amount: number
  detail: string
}
```

### 2.3 QiEngineResult（引擎输出）

```typescript
export interface QiEngineResult {
  originalQi: QiNode[]              // QiBuilder 原始输出
  seasonModifiedQi: QiNode[]        // SeasonModifier 后
  conflictQi: QiNode[]              // ConflictEngine 后（预留）
  heHuaQi: QiNode[]                 // HeHuaEngine + QiTransformer 后
  finalQi: QiNode[]                 // 最终气态（当前即 heHuaQi）
  elementScores: Record<FiveElement, number>
  heHuaCommands: HeHuaCommand[]
  strengthScore: number
  wangShuai: WuXingWangShuai
  dayElement: FiveElement
}
```

## 3. 流水线接口

```typescript
// P0
export function buildQiNodes(sixLines: SixLines, cangGanData: Record<EarthlyBranch, CangGan>): QiNode[]
export function applySeasonModifier(qiNodes: QiNode[], monthZhi: EarthlyBranch): QiNode[]
export function aggregateElements(qiNodes: QiNode[]): Record<FiveElement, number>

// P1
export function detectConflicts(qiNodes: QiNode[]): ConflictCommand[]    // 预留
export function detectHeHua(qiNodes: QiNode[], ctx: QiContext): HeHuaCommand[]
export function transformQi(qiNodes: QiNode[], commands: HeHuaCommand[]): QiNode[]

// 主入口
export function runQiEngine(sixLines: SixLines, dayGan: HeavenlyStem, monthZhi: EarthlyBranch): QiEngineResult
```

## 4. 架构原则落地方案

### 4.1 单一数据源

`QiNode[]` 是唯一真实数据。`elementScores` 仅由 `QiAggregator` 从 `QiNode[]` 推导，禁止任何模块直接修改。

### 4.2 单向流水线

每个步骤接收上游 `QiNode[]`，返回新的 `QiNode[]`（不可变更新），绝不反向修改。

### 4.3 模块独立

- `QiBuilder`：只负责从四柱建立气节点
- `SeasonModifier`：只负责月令加权
- `HeHuaEngine`：只负责检测合化条件并生成指令
- `QiTransformer`：只负责根据指令迁移气
- `QiAggregator`：只负责汇总五行分数

### 4.4 可追溯

每个 `QiNode` 的 `history` 数组记录完整的变更历史。调试时可输出任意节点的气流变化过程。

## 5. P0 实现范围

1. `qi/types.ts` — QiNode、HeHuaCommand、QiEngineResult 类型定义
2. `qi/builder.ts` — QiBuilder
3. `qi/modifier.ts` — SeasonModifier
4. `qi/aggregator.ts` — QiAggregator
5. `qi/engine.ts` — runQiEngine 主入口
6. `__tests__/regression/cases/` — 标准命例
