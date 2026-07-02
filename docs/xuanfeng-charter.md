# 玄风开发宪章（XuanFeng Development Charter）

> **基线**：V4.8.1 Final
> **冻结日期**：2026-07-02
> **性质**：整个玄风项目未来开发的最高指导文件
> **适用范围**：自 P0-① 起，后续所有模块（P0、P1、P2、V5）统一执行

---

## 一、宪章地位

本宪章是玄风项目的最高开发准则，优先级高于任何模块设计文档、
Rule Pack、ADR 与个人偏好。任何与宪章冲突的实现、流程或路线图，
均以本宪章为准。

V4.8.1 Final 是项目唯一开发基线（Baseline）。自冻结之日起：
- 禁止 V4.8.2 / V4.8.3 / V4.9 等路线图版本号
- 后续修改统一使用 Patch（`V4.8.1-pN`）、Bug Fix 或 Hotfix
- 真正的平台级升级（紫微、奇门等）统一进入 V5

---

## 二、开发流程铁律

任何模块必须严格按以下顺序推进，不得跳阶段：

```
Requirement
    ↓
Design
    ↓
Implementation
    ↓
Testing
    ↓
Benchmark
    ↓
Regression
    ↓
Documentation
    ↓
Acceptance        ← V4.8.1 Final 新增
    ↓
Freeze           ← V4.8.1 Final 新增
    ↓
Next Phase
```

**只有完成 Acceptance + Freeze 后，才能进入下一模块。**

---

## 三、六项最高原则

### 1. Version First（版本优先）

所有修改必须版本化。

- 任何 Rule、Snapshot、Rule Pack、API 变更都必须递增版本号
- 冻结后修改统一走 Patch（`P0-①-p1` / `P0-①-p2`），禁止直接修改正式版本
- 版本变更必须记录 ChangeLog，并同步至 Snapshot

### 2. Evidence First（证据优先）

没有经典依据和命例验证，不进入 Stable。

- 每条 Rule 必须标注 reference（典籍 / 天文历 / 命例库）
- 证据等级分为 A / B / C 三级，仅 A/B 可入 Stable
- C 级证据必须显式标注 `experimental`，不得默认启用
- 算法结论必须可追溯至经典或权威天文历（寿星天文历 / VSOP87 / ELP2000）

### 3. Explain First（可解释优先）

所有结论必须可解释。

- 排盘输出必须附 Explain，列出规则 ID、证据等级、置信度、推导链
- 不可解释的"黑盒结论"禁止进入 Stable
- Explain 必须包含 evidenceLevel、confidence、reasons、references 四要素
- 用户看到的每个结论，都必须能回溯到 Rule 与典籍

### 4. Regression First（回归优先）

回归测试未通过，禁止合并。

- 每个模块必须维护 Golden Dataset（金标准命例库）
- 任何代码改动必须通过全量 Regression 才能合并
- Regression 失败时禁止使用 `skip` / `only` 绕过，必须修复根因
- 历史 Snapshot 永久可回归（Backward Compatibility 保证）

### 5. Backward Compatibility（向后兼容）

保证历史 Rule、Case、API、Snapshot 永久兼容。

- 已冻结的 Rule / Rule Pack / Snapshot / API 不得破坏性变更
- 必须变更时走 Deprecation → Migration → Removal 三阶段
- 历史 Golden Dataset 不得修改预期值（除非确认是 BUG，且必须记录 ADR）
- API 字段只能新增，不得删除或重命名

### 6. Acceptance First（验收优先）—— V4.8.1 Final 新增

**开发完成 ≠ 模块完成。**

必须依次完成：

1. 功能开发（Implementation）
2. 单元测试（Testing）
3. Benchmark（性能基准）
4. Regression（回归测试）
5. 文档同步（Documentation）
6. 最终验收（Acceptance）
7. Freeze（冻结）

**全部通过后，模块才算真正完成。**

Acceptance Gate 必须全部通过以下 6 项：

| # | 检查项 | 输出物 |
|---|--------|--------|
| ① | Accuracy Report | 100+ 抽样准确率，对比权威基准 |
| ② | Boundary Acceptance | 立春秒级 / 子时 / 闰年 / 时区 / DST |
| ③ | Performance Acceptance | 1000 次排盘 avg / P95 / P99 / max |
| ④ | Code Review | TODO / FIXME / 重复代码 / Magic Number |
| ⑤ | Documentation Acceptance | 代码与文档完全一致 |
| ⑥ | Freeze | Git Tag + Snapshot/Rule/RulePack 冻结 |

任一项未通过，**禁止进入下一模块**。

#### 6.1 算法类模块的四层共同校验

对于传统命理算法类模块（节气、四柱、格局等），Acceptance ① Accuracy Report
必须同时覆盖以下四层校验，缺一不可：

| 层级 | 校验内容 | 说明 |
|------|---------|------|
| ① | 单元测试（Unit Test） | 每个函数的输入输出正确性 |
| ② | 回归测试（Regression） | Golden Dataset 全量一致，不退化 |
| ③ | 权威历法对照（Benchmark） | 与寿星天文历 / 问真八字 / 元亨利贞等对比 |
| ④ | 真实命例验证（Gold Case） | 真实命例的排盘结论与已知结果一致 |

> P0-① 验收中发现大寒月支 BUG，证明仅靠前三层不足以保证正确性。
> 第四层真实命例验证是发现"算法自洽但结论错误"的关键手段。
>
> 相关想法：[IDEA-006 黄金命例库](file:///workspace/docs/future-ideas.md#idea-006黄金命例库gold-case-library)、
> [IDEA-010 四层校验规范](file:///workspace/docs/future-ideas.md#idea-010传统命理算法四层校验规范)

---

## 四、最终指导原则（宪章之尾）

> **项目成功的标准不是"架构越来越复杂"，而是"准确率越来越高、产品越来越稳定、用户越来越满意"。**
>
> 所有后续开发都应优先服务于算法质量、商业稳定性和用户价值，
> 而不是继续扩充治理体系。

此原则作为整个玄风项目未来开发的最高指导原则。

当本宪章前述条款与此原则发生冲突时，以此原则为准——
治理体系服务于质量，而非质量服务于治理体系。

---

## 五、附则

### 5.1 Future Ideas 登记簿

任何新的 AI 优化、Dashboard 建议、新治理模块、新统计、新架构，
统一登记至 [docs/future-ideas.md](file:///workspace/docs/future-ideas.md)，
不再修改 V4.8.1 Final 路线图。

### 5.2 宪章修订

本宪章一经发布即冻结。如需修订，必须满足：

- 提交 ADR 说明修订理由
- 通过全量 Regression
- 经项目 Owner 书面确认

### 5.3 文件索引

| 文档 | 位置 |
|------|------|
| 本宪章 | [docs/xuanfeng-charter.md](file:///workspace/docs/xuanfeng-charter.md) |
| Future Ideas | [docs/future-ideas.md](file:///workspace/docs/future-ideas.md) |
| P0-① 完成报告 | [docs/p0-1-completion-report.md](file:///workspace/docs/p0-1-completion-report.md) |
| P0-① 验收报告 | [docs/p0-1-acceptance-report.md](file:///workspace/docs/p0-1-acceptance-report.md) |

---

**宪章版本**：Charter v1.0
**基线版本**：V4.8.1 Final
**生效日期**：2026-07-02
