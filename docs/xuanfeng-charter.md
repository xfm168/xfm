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

## 二、最高原则：Governance Freeze（治理冻结）

> **治理体系已健康且成熟。自即日起进入 Governance Freeze。**
>
> Governance Freeze 并不是禁止改进，而是禁止没有明确收益的改进。
>
> **《玄风开发宪章》自 Charter v1.2 起进入长期稳定维护状态。**

后续原则：
- 不主动增加章节
- 不主动增加流程
- 不主动增加规范
- 不主动增加治理概念

只有四种情况允许修订（详见[6.4 宪章永久冻结声明](#64-宪章永久冻结声明)）：
① 商业模式重大变化 ② 底层架构重大升级 ③ 法律法规或行业规范要求 ④ 重大事故复盘确认

任何治理升级，必须同时通过以下四项收益检验：

| 检验项 | 问题 | 答案 |
|--------|------|------|
| 准确率 | 是否提升排盘准确率？ | 是 / 否 |
| 稳定性 | 是否提升系统稳定性？ | 是 / 否 |
| 维护成本 | 是否降低维护成本？ | 是 / 否 |
| 开发效率 | 是否提升开发效率？ | 是 / 否 |

**四项全部为"否" → 拒绝进入 Charter**。

> **治理体系的价值，在于帮助算法研发，而不是增加研发成本。**
>
> 治理越稳定，算法越专注，产品越优秀。

未来所有新的流程、治理规范、文档体系或管理机制：

- **统一登记** [Future Ideas](file:///workspace/docs/future-ideas.md)
- **不直接进入** 正式开发流程
- **只有经过验证、确有价值时**，再以 Patch 形式纳入

### 2.1 Algorithm First（算法优先）

自 P0-② 起，项目正式进入 **Algorithm First** 阶段。

> **默认情况下，项目资源优先投入算法研发，仅保留必要工程维护投入，具体比例根据项目阶段动态调整。**

不同阶段重点自然不同：
- **P0 阶段**：算法研发占绝大多数
- **P1 阶段**：算法、产品、运营同步推进
- **P2 阶段**：商业运营、性能优化、用户体验占比增加

治理体系应保持稳定，不再持续增长。

### 2.2 Architecture Freeze（架构冻结）

P0 Final 通过后，**底层架构全面冻结**：

```
Time Engine（时间引擎）
    ↓
Calendar Engine（历法引擎）
    ↓
Rule Engine（规则引擎）
    ↓
RulePack（规则集合）
    ↓
Snapshot（命盘快照）
```

> **Architecture Freeze 冻结的是架构边界，而不是实现质量。**

**允许持续进行**：
- Bug 修复
- 性能优化
- 代码重构
- 可维护性提升
- 文档完善

**不得改变**：
- Engine 边界
- RulePack 结构
- Snapshot 结构
- 数据流方向
- 核心架构职责

架构冻结原则：
- **只能新增模块，不能推翻底层**
- P3、P4 等后续模块不得重构底层架构
- 架构级变更必须通过全量 Gold Case + Benchmark + Regression 验证
- 违反架构冻结的 PR 一律 Reject

### 2.3 P0 重定义：Trusted Fortune Engine

P0 系列整体目标重定义为：

> **建立行业级 Trusted Fortune Engine（可信命理计算引擎）**

至少具备：排盘准确、算法可验证、命盘可重现、Rule 可追溯、Snapshot 可回放、版本可追踪、商业可上线、长期可维护。

P0 的价值不在于完成若干功能，而在于打造一套**值得长期信赖的计算底座**。

### 2.4 Decision Filter（决策过滤器）

自 P0-② 起，所有开发决策必须回答：

> **它是否能提升最终用户价值？**

只有以下答案之一成立时，才优先开发：
- 提升准确率
- 提升稳定性
- 提升用户体验
- 提升商业竞争力

否则登记 Future Ideas，暂不实施。

### 2.5 P0 Definition of Done（P0 完成定义）

当且仅当以下条件全部满足时，P0 正式结束，进入 P1：

- ✅ P0-① 节气精确到时分秒
- ✅ P0-② 子时换日（早晚子时）
- ✅ P0-③ 真太阳时（均时差校正）
- ✅ P0-④ 四柱推算
- ✅ P0 Final 全引擎验收通过（[IDEA-015](file:///workspace/docs/future-ideas.md)）
  - 全链路排盘回归
  - 多模块组合验证
  - Benchmark 全量复核
  - Gold Case 全量验证
  - 性能达标
  - Acceptance 全部通过
  - Governance Review 通过（[IDEA-016](file:///workspace/docs/future-ideas.md)）
  - Commercial Readiness Review 通过（[IDEA-019](file:///workspace/docs/future-ideas.md)）
    - Deployment Ready（部署就绪：CI/CD / 部署文档）
    - Rollback Ready（回滚就绪：版本回滚机制）
    - Backup Ready（备份就绪：数据备份 / 恢复验证）
    - Monitoring Ready（监控就绪：实时监控 / 告警）
    - Logging Ready（日志就绪：结构化日志 / 查询能力）
    - Documentation Ready（文档就绪：API 文档 / 用户手册）
    - Support Ready（维护就绪：故障响应流程 / 升级路径）

> **Done 不代表完美（Perfect），而代表达到当前版本的可交付标准（Ready for Release）。**
>
> P0 的目标不是 Demo，而是 **Trusted Fortune Engine v1.0**。
>
> 避免 P0 无限扩张。P0 一旦 Done，正式进入 **P1 智能命理分析阶段**。

---

## 三、开发流程铁律

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

## 四、六项最高原则

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

#### 6.1 算法类模块的多层质量验证体系

对于传统命理算法类模块（节气、四柱、格局等），Acceptance ① Accuracy Report
必须经过"多层质量验证体系"验证，当前默认采用四层校验（缺一不可）：

| 层级 | 校验内容 | 说明 |
|------|---------|------|
| ① | 单元测试（Unit Test） | 每个函数的输入输出正确性 |
| ② | 回归测试（Regression） | Golden Dataset 全量一致，不退化 |
| ③ | 权威历法对照（Benchmark） | 与寿星天文历 / 问真八字 / 元亨利贞等对比 |
| ④ | 真实命例验证（Gold Case） | 真实命例的排盘结论与已知结果一致 |

> P0-① 验收中发现大寒月支 BUG，证明仅靠前三层不足以保证正确性。
> 第四层真实命例验证是发现"算法自洽但结论错误"的关键手段。
>
> 本体系为开放式设计，未来可根据项目发展持续扩展新的验证层，例如：
> - AI Cross Validation（AI 交叉验证）
> - Master Review（专家审核）
> - User Feedback Validation（真实用户反馈）
> - A/B Accuracy Test（版本准确率对比）
>
> 相关想法：[IDEA-006 黄金命例库](file:///workspace/docs/future-ideas.md#idea-006黄金命例库gold-case-library)、
> [IDEA-010 四层校验规范](file:///workspace/docs/future-ideas.md#idea-010传统命理算法四层校验规范)、
> [IDEA-011 多层质量验证体系](file:///workspace/docs/future-ideas.md#idea-011多层质量验证体系)

---

## 五、最终指导原则（宪章之尾）

> **项目成功的标准不是"架构越来越复杂"，而是"准确率越来越高、产品越来越稳定、用户越来越满意"。**
>
> 所有后续开发都应优先服务于算法质量、商业稳定性和用户价值，
> 而不是继续扩充治理体系。

此原则作为整个玄风项目未来开发的最高指导原则。

当本宪章前述条款与此原则发生冲突时，以此原则为准——
治理体系服务于质量，而非质量服务于治理体系。

### 5.1 宪章最后一条

> **任何治理体系，都不能成为开发算法的负担。**

如果写文档的时间、开评审会的时间、维护规范的时间，
超过了开发算法的时间，说明治理已经过度。

真正优秀的软件工程，不是治理越来越复杂，而是：

> **治理越来越稳定，算法越来越强，产品越来越好。**

### 5.2 价值顺序

> **治理创造的是开发效率，算法创造的是产品价值，用户创造的是商业价值。**
>
> 治理服务于算法，算法服务于用户，这个顺序永远不要颠倒。

```
Governance → Algorithm → User
   效率        价值        商业
```

---

## 六、附则

### 6.1 Future Ideas 登记簿

任何新的 AI 优化、Dashboard 建议、新治理模块、新统计、新架构，
统一登记至 [docs/future-ideas.md](file:///workspace/docs/future-ideas.md)，
不再修改 V4.8.1 Final 路线图。

### 6.2 宪章修订

本宪章一经发布即冻结。如需修订，必须满足：

- 提交 ADR 说明修订理由
- 通过全量 Regression
- 经项目 Owner 书面确认
- 不得违反第二节 Governance Freeze 原则（除非修订目的正是为提升准确率/稳定性/效率/可维护性）

### 6.3 文件索引

| 文档 | 位置 |
|------|------|
| 本宪章 | [docs/xuanfeng-charter.md](file:///workspace/docs/xuanfeng-charter.md) |
| Future Ideas | [docs/future-ideas.md](file:///workspace/docs/future-ideas.md) |
| P0-① 完成报告 | [docs/p0-1-completion-report.md](file:///workspace/docs/p0-1-completion-report.md) |
| P0-① 验收报告 | [docs/p0-1-acceptance-report.md](file:///workspace/docs/p0-1-acceptance-report.md) |

### 6.4 宪章永久冻结声明

自 **Charter v1.2** 起，本宪章进入**永久冻结**状态。

除以下四类情况外，不建议继续修改宪章：

| 类别 | 触发条件 |
|------|---------|
| **① 商业模式重大变化** | 商业定位、收费模式、用户群体发生根本性调整 |
| **② 底层架构重大升级** | Time Engine / Calendar Engine / Rule Engine 核心边界重构 |
| **③ 法规或行业规范要求** | 命理行业标准、数据合规、隐私保护等外部强制要求 |
| **④ 重大事故复盘确认** | 生产事故复盘确认必须修订宪章才能避免再次发生 |

除此之外，所有新的流程、规范、机制统一进入 [Future Ideas](file:///workspace/docs/future-ideas.md)，不进入正式 Charter。

任何修订必须：
1. 提交 ADR 说明修订理由与类别
2. 通过 Governance Freeze 四项收益检验（准确率/稳定性/维护成本/开发效率）
3. 通过全量 Regression
4. 经项目 Owner 书面确认

> **一个成熟的软件项目，不应该一直完善治理，而应该把绝大部分精力投入产品本身。**
>
> **真正优秀的软件工程，不是治理越来越复杂，而是在治理保持稳定的基础上，让算法越来越准确、产品越来越优秀。**

---

**宪章版本**：Charter v1.2（正式冻结版）
**基线版本**：V4.8.1 Final
**生效日期**：2026-07-02
**冻结日期**：2026-07-02
**治理状态**：✅ **已进入长期冻结状态，研发重心全面转向算法、数据和产品**
