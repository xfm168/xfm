# Type Safety Debt — `as any` 全仓审计报告

> 基于全仓扫描：314 处 `as any`，分布在 54 个文件。按处理策略分为 3 类。

---

## A. 必须保留 (Must Keep) — 29 处

这些出现在测试文件（动态属性访问）、第三方库类型不匹配、或未知外部数据结构的场景中，**不可移除**。

| 文件 | 数量 | 原因 |
|------|------|------|
| `runner-p317-architecture.ts` | 11 | 测试中对 adapter/event 对象的动态属性访问 |
| `runner-p318-roadmap.ts` | 3 | 无效 ID 测试参数（如 `'P99' as any`） |
| `runner-p41-consensus.ts` | 2 | 无效学派名称测试 |
| `runner-p312-expert.ts` | 1 | 概率来源字符串强制转换 |
| `archive/interactiveTest.ts.deprecated` | 10 | 已弃用文件 |
| `archive/runner-p38-explain.ts.deprecated` | 1 | 已弃用文件 |
| `BaziPoster.tsx` | 1 | 动态柱属性访问 |

---

## B. 可以逐步优化 (Can Optimize) — 230 处

### Pattern 1: 动态键索引 `(SOME_MAP as any)[variable]` — ~120 处

**涉及文件：**
`reasoningLayer.ts`(14), `dynastySimulationEngine.ts`(25), `decisionEngine.ts`(14), `benchmarkEngine.ts`(8), `consistencyChecker.ts`(8), `dayMasterStrengthEngine.ts`(9), `diseaseMedicineEngine.ts`(5), `climateAdjustmentEngine.ts`(2), `luckModifierEngine.ts`(2), `shenShaEngine.ts`(1)

**原因：** TypeScript 严格索引签名 — `Record<HeavenlyStem, FiveElement>` 不允许字符串索引。

**建议：** 创建重载索引访问器，或使用 `@/lib/core` 中的类型安全查找函数（`getStemElement`, `getGenerated` 等）。

### Pattern 2: 日干月支强制转换 `tc.dayGan as any` — ~25 处

**涉及文件：**
`runner-p23-perf.ts`, `runner-p23-full.ts`, `runner-p22-*.ts`, `runner-p21-8structures.ts`, `runner.ts`, `runner-p21.ts`, `runner-classical.ts`, `runner-p1.ts`

**原因：** 字符串需要收窄为 `HeavenlyStem` / `EarthlyBranch` 类型。

**建议：** 创建验证函数：
```typescript
function asHeavenlyStem(s: string): HeavenlyStem | null {
  return HEAVENLY_STEMS.includes(s as HeavenlyStem) ? (s as HeavenlyStem) : null;
}
```

### Pattern 3: 柱解析占位 `gan: p[0] as any, zhi: p[1] as any` — ~20 处

**涉及文件：** 同上 runner 文件

**原因：** `string[]` 元组解构到类型化的 `Pillar`。

**建议：** 创建类型化解析函数：
```typescript
function parsePillars(sixLines: string[][]): Pillar[] {
  return sixLines.map(([gan, zhi]) => ({
    gan: asHeavenlyStem(gan)!,
    zhi: asEarthlyBranch(zhi)!,
  }));
}
```

### Pattern 4: 规则结果属性 `(m.rule.result as any)?.poGe/name` — 17 处

**涉及文件：** `gejuRules.ts`(17)

**原因：** `RuleResult` 类型未声明 `poGe`、`name`、`score`、`description` 字段。

**建议：** 扩展 `RuleResult` 接口：
```typescript
interface RuleResult {
  // ... 现有字段
  poGe?: string;
  name?: string;
  score?: number;
  description?: string;
}
```

### Pattern 5: 缓存值强制转 `pCtx.cache.get('...') as any[]` — 12 处

**涉及文件：** `runP20Engine.ts`, `runP1Engine.ts`, `pipelineSteps.ts`

**原因：** 缓存返回 `unknown` 类型。

**建议：** 创建泛型缓存获取器：
```typescript
function getCacheValue<T>(cache: Cache, key: string): T | undefined {
  return cache.get(key) as T | undefined;
}
```

### Pattern 6: 五行计数传参 `elementCount as any` — 20 处

**涉及文件：** `benchmarkEngine.ts`(6), `runner-p23-*.ts`(12), `runner-p22-*.ts`(2)

**原因：** `Record<string, number>` 与期望类型不匹配。

**建议：** 统一 `elementCount` 类型：
```typescript
type ElementCount = Record<FiveElement, number>;
```

### Pattern 7: 引擎结果透传 `return data as any` — 4 处

**涉及文件：** `engine.ts`(1), `runP1Engine.ts`(1), `runP20Engine.ts`(1), `pipelineSteps.ts`(1)

**原因：** 通用引擎包装器。

**建议：** 使用泛型类型参数：
```typescript
function wrapEngineResult<T>(data: unknown): T {
  return data as T;
}
```

### Pattern 8: 藏干/六线数据转换 — 10 处

**涉及文件：** `shishen.ts`(5), `shishenAnalysis.ts`(5), `wuxing.ts`(4), `fiveElementPower.ts`(1)

**原因：** 跨函数类型格式不匹配。

**建议：** 统一 `CangGanData` 和 `SixLine` 类型定义。

---

## C. 应该删除 (Should Delete) — 55 处

这些位于 `fengshui/` 模块（非八字模块），不在 Architecture v1 范围内，但已追踪记录。

### lib/fengshui/ — 30 处

| 文件 | 数量 |
|------|------|
| `pipeline/index.ts` | 11 |
| `explainEngine.ts` | 5 |
| `imageAnalyzer.ts` | 4 |
| `simulation/engine.ts` | 4 |
| 其他 | 6 |

### lib/bazi/ — 25 处

| 文件 | 数量 | 原因 |
|------|------|------|
| `qi/runP21Engine.ts` | 3 | 局部 `ELEMENT_MAP`，应从 core 导入 |
| `pipeline/index.ts` | 3 | 动态属性访问，可用类型守卫 |
| `qi/builder.ts` | 1 | score source 可改为类型枚举 |
| `qi/detector/seasonTransformer.ts` | 1 | `QiYunState` 可扩展 |
| `governance/` | 4 | 测试边界用例 |
| 其他 | 13 | 各类零散场景 |

---

## 汇总

| Category | Count | Files | Priority |
|----------|-------|-------|----------|
| A. 必须保留 | 29 | 8 | — |
| B. 可以逐步优化 | 230 | 30 | P6-D 或后续 |
| C. 应该删除 | 55 | 15 | P6-D 或后续 |
