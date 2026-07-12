# Architecture Rules v1.0 — LOCKED

## 永久禁止 (Permanent Prohibitions)

### 数据流禁止

1. **Engine → Calculator 直接调用**：Engine 不得绕过 Pipeline 直接调用 Calculator。所有命盘数据必须通过 Pipeline Context 传递。
2. **Engine → UI/React/Page**：Engine 不得导入或引用任何 UI 组件、React hook、或页面模块。
3. **跨层 Import**：禁止跨越架构层直接导入（如 Report 层导入 Rule 层内部实现）。
4. **Engine → Engine 直接依赖**：Engine 之间不得直接调用，必须通过 Pipeline Context 传递数据。

### 常量禁止

5. **新增重复五行映射**：禁止在 Engine 文件中定义 `const XXX_ELEMENT = { 甲:'木', ... }`。所有五行映射必须从 `@/lib/core` 导入。
6. **新增重复天干映射**：禁止定义 `const STEM_ELEMENT` / `const TIANGAN_ELEMENT`。唯一来源：`@/lib/core/constants/stem.ts`。
7. **新增重复地支映射**：禁止定义 `const BRANCH_ELEMENT` / `const DIZHI_ELEMENT`。唯一来源：`@/lib/core/constants/branch.ts`。
8. **重复 RuleWeight**：禁止在其他文件中重新定义已冻结的规则权重。
9. **重复 GENERATE/OVERCOME**：禁止在 Engine 中重新定义五行生克关系。

### 数据完整禁止

10. **覆盖 Evidence**：禁止覆盖或修改已生成的 EvidenceItem 数据。
11. **覆盖 Score**：禁止覆盖 ConfidenceEngine 计算的可信度评分。
12. **覆盖 Pipeline Context**：禁止在 Pipeline 执行过程中回写修改已完成的 Context 快照。

### Engine Contract 禁止

13. **未注册 Engine**：禁止开发未在 EngineRegistry 注册的新 Engine。
14. **违反 I→P→O 模式**：禁止 Engine 出现 Input → Calculator → 重新计算 的模式。所有 Engine 必须 Input → Process → Output。

---

## 永久允许 (Permanent Allowances)

### 数据流允许

1. **Pipeline → Calculator**：PipelineEngine 是唯一允许调用 Calculator 的模块。
2. **Pipeline → Engine**：PipelineEngine 可以调用任何已注册 Engine。
3. **Engine → Evidence**：Evidence 层 Engine 可以引用上游 Engine 的输出。
4. **Decision → Explain**：Decision 层输出可以作为 Explain 层输入。
5. **Explain → Report**：Explain 层输出作为 Report 层组装素材。
6. **Engine → Core 常量/工具函数**：Engine 允许从 `@/lib/core` 导入纯查询函数和常量（`getStemElement`, `STEM_ELEMENT`, `GENERATE`, `OVERCOME`, `WANG_SHUAI_TABLE` 等）。**禁止导入计算函数**（`calculateFiveElementPower`, `getChangSheng` 等）。

### Core 导入白名单

**允许从 `@/lib/core` 导入：**

- `STEM_ELEMENT`, `BRANCH_ELEMENT`, `HEAVENLY_STEMS`, `EARTHLY_BRANCHES`
- `GENERATE`, `OVERCOME`, `BE_GENERATE`, `BE_OVERCOME`
- `WANG_SHUAI_TABLE`, `FIVE_ELEMENTS`
- `getStemElement()`, `getBranchElement()`
- `import type { ... }` — 类型导入无限制

**禁止从 `@/lib/core` 导入（需通过 Pipeline 注入）：**

- `calculateFiveElementPower()`, `getChangSheng()` — 计算函数
- 任何修改状态或产生副作用的函数

---

## 新增 Engine 流程

1. 在 `EngineRegistry.md` 注册（声明 engineId, layer, inputSpec, outputSpec, notAllowed, owner）
2. 在 `engineContract.ts` 的 `ENGINE_CONTRACTS` 数组添加 Contract
3. 验证 I → P → O 模式
4. 验证不违反任何永久禁止项
5. 提交 Architecture Changelog 更新

---

## 版本

- **Version:** v1.0
- **Status:** LOCKED
- **Effective:** P6-B.6 Final
