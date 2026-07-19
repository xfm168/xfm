# Product Constitution
# 玄风门产品开发宪章
#
# 适用范围：W2、W3、W4 及未来所有运营阶段
# 生效日期：2026-07-18
# 状态：Active
# 前身：W2 Development Charter v1.0.0
# 上级文档：PRODUCT_VISION.md（产品愿景）
#
# 本文档是 PRODUCT_VISION.md 的下一层级，
# 承接愿景，制定执行层面的开发原则与规范。
# 所有后续开发必须遵守。
# 一次制定，长期执行。

---

## 0. Product Constitution — 核心价值观

玄风门所有后续开发，优先级永远遵循：

| 优先级 | 维度 | 说明 |
|--------|------|------|
| 1 | **用户价值** | 是否让用户获得更好的体验？ |
| 2 | **数据价值** | 是否产生可沉淀、可分析、可回流的数据？ |
| 3 | **商业价值** | 是否有助于长期商业闭环？ |
| 4 | **技术实现** | 技术方案是否合理、可维护？ |

**永远：用户价值 > 数据价值 > 商业价值 > 技术实现。**

**禁止技术驱动的开发。所有开发由数据和用户需求驱动。**

---

## 一、开发原则

W2 不是算法开发。W2 是运营系统开发。

任何需求：
- **禁止修改**：Module 1~8、Professional Engine、MasterReport
- **只能**：调用 API、组合页面、沉淀数据
- **允许**：Bug Fix、性能优化、安全修复、产品体验优化
- **影响范围**：任何 Web 层功能不得影响 `src/lib/bazi/pro/` 目录下的任何文件

---

## 二、数据优先原则

任何新页面/功能必须回答四个问题：

| # | 问题 | 必须回答 |
|---|------|---------|
| 1 | 数据来自哪里？ | 指定数据源（API/Supabase 表/用户输入） |
| 2 | 数据保存到哪里？ | 指定存储位置（Supabase 表名 + 字段） |
| 3 | 数据如何统计？ | 指定统计方式（Dashboard 指标 + SQL） |
| 4 | 数据如何回流？ | 指定数据闭环路径（反馈→案例库→知识库→优化） |

**没有数据闭环，禁止开发。**

---

## 三、页面优先级

所有页面按以下优先级开发：

| 优先级 | 方向 | 说明 | 示例 |
|--------|------|------|------|
| **P0** | 用户增长 | 获取新用户、提高注册转化 | 首页优化、引导流程、分享裂变 |
| **P1** | 用户留存 | 提高用户回访率、使用深度 | 报告体验、推送提醒、历史记录 |
| **P2** | 运营效率 | 提高运营团队工作效率 | 反馈管理、数据统计、批量操作 |
| **P3** | 后台管理 | 内部管理工具 | 用户管理、订单管理、系统配置 |

**不要先做后台。先做用户价值。**

---

## 四、统一 API 规范

### 4.1 RESTful

所有新增 API 必须遵循 RESTful 规范：

| 方法 | 用途 | 示例 |
|------|------|------|
| GET | 查询 | `GET /api/pro-reports` |
| POST | 创建 | `POST /api/pro-reports` |
| PUT | 全量更新 | `PUT /api/pro-reports/:id` |
| PATCH | 部分更新 | `PATCH /api/pro-feedback/:id/status` |
| DELETE | 删除 | `DELETE /api/pro-reports/:id` |

### 4.2 统一返回格式

**成功响应：**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "timestamp": "2026-07-18T12:00:00.000Z"
  },
  "error": null
}
```

**失败响应：**
```json
{
  "success": false,
  "data": null,
  "meta": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "birth_date 必须为 YYYY-MM-DD 格式",
    "details": { "field": "birth_date" }
  }
}
```

**禁止不同接口不同格式。**

### 4.3 错误码规范

| 错误码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| VALIDATION_ERROR | 400 | 参数校验失败 |
| UNAUTHORIZED | 401 | 未登录 |
| FORBIDDEN | 403 | 权限不足（如免费用户访问 VIP 功能） |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| RATE_LIMITED | 429 | 请求频率超限 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 五、统一组件规范

所有新组件必须支持 **四种状态**：

| 状态 | 说明 | 处理方式 |
|------|------|---------|
| **Loading** | 数据加载中 | 显示 Spinner + 提示文字 |
| **Empty** | 数据为空 | 显示空状态插图 + 引导文字 + 操作按钮 |
| **Error** | 请求失败 | 显示错误信息 + 重试按钮 |
| **Permission** | 权限不足 | 显示权限提示 + 升级引导（如升级会员） |

组件 Props 必须包含：
```typescript
interface ComponentProps {
  loading?: boolean
  error?: string | null
  onRetry?: () => void
}
```

---

## 六、统一版本记录

每个新增模块/页面必须包含以下元数据：

| 字段 | 说明 | 示例 |
|------|------|------|
| moduleVersion | 模块版本 | '1.0.0' |
| createdAt | 创建时间 | '2026-07-18' |
| updatedAt | 最后更新 | '2026-07-18' |
| owner | 负责人 | 'web-team' |
| status | 状态 | 'active' / 'deprecated' / 'removed' |

API 响应的 meta 字段中包含版本信息：
```json
{
  "meta": {
    "moduleVersion": "1.0.0",
    "apiVersion": "v1",
    "engineVersion": "V5.0 GA"
  }
}
```

---

## 七、运营 KPI

不只开发，必须统计以下指标并进入 Dashboard：

| 指标 | 说明 | 数据源 |
|------|------|--------|
| 日报告生成量 | 每日成功生成的专业报告数 | analysis_history 表 |
| 历史报告查看率 | 查看历史报告的用户比例 | usage_logs 表 |
| 反馈率 | 提交反馈的用户占生成报告用户的比例 | feedback 表 / analysis_history 表 |
| 分享率 | 分享报告的用户比例 | usage_logs 表 |
| 会员转化率 | free → professional/vip 转化比例 | payments 表 / auth.users 表 |
| 报告完成率 | 从生成到阅读完成的用户比例 | usage_logs 表 |
| 平均阅读时间 | 用户在报告页面的平均停留时间 | usage_logs 表 |
| 7日留存率 | 7 天后回访的用户比例 | auth.users 表 |

所有指标必须：
- 每日自动计算
- Dashboard 可视化展示
- 异常值自动报警（低于阈值时）

---

## 八、完成标准

每个阶段的完成标准不是代码完成，而是：

| 标准 | 门槛 | 说明 |
|------|------|------|
| 数据产生 | 日报告生成量 > 0 | 用户持续产生真实数据 |
| 数据可见 | Dashboard 全部 KPI 正常展示 | 运营可以持续看到数据 |
| 数据闭环 | 反馈 → 审核 → 案例 → 优化 链路畅通 | 产品可以持续优化数据 |
| 数据增长 | 周环比数据量增长 > 0 | 形成真正的数据飞轮 |

**数据飞轮：**
```
用户 → 数据 → 运营 → 优化 → 增长 → 更多用户
```

---

## 九、Decision Rules — 需求决策规则

以后所有新需求，必须经过四项检查：

| # | 检查项 | 问题 | 通过条件 |
|---|--------|------|---------|
| 1 | 用户价值 | 是否提升用户价值？ | 用户体验明显改善 |
| 2 | 数据价值 | 是否产生可沉淀的数据？ | 数据可统计、可分析、可回流 |
| 3 | 商业价值 | 是否有商业价值？ | 直接或间接支持长期收入 |
| 4 | 架构合规 | 是否符合长期架构？ | 不违反 Frozen 约束和本宪章 |

**四项中至少满足三项，才能进入开发。否则直接 Reject。**

| 通过项数 | 决策 |
|---------|------|
| 4/4 | 立即开发 |
| 3/4 | 可开发，记录权衡理由 |
| 2/4 | 降级为 Backlog，等待条件成熟 |
| 1/4 | 直接 Reject |
| 0/4 | 直接 Reject |

---

## 十、Product Debt — 产品债务

### 定义

Product Debt 不同于 Technical Debt，是指产品设计层面累积的问题：

| 类型 | 示例 |
|------|------|
| 体验债务 | 页面复杂、流程冗长、阅读困难 |
| 转化债务 | 按钮太多、CTA 不明确、步骤过多导致流失 |
| 一致性债务 | 不同页面风格不统一、交互模式混乱 |
| 信息债务 | 专业术语堆积、帮助文档缺失 |

### 管理规则

- **每个版本必须处理一部分 Product Debt**（至少 1 项）
- Product Debt 优先级高于新功能开发（P0 除外）
- Product Debt 清单记录在项目管理工具中，每周 Review
- 不要只处理 Technical Debt，Product Debt 同样重要

---

## 十一、KPI Review — 复盘节奏

| 周期 | 复盘内容 | 参与者 | 产出 |
|------|---------|--------|------|
| **每周** | KPI 数据 Review | 产品 + 运营 | 周报 + 异常处理 |
| **每月** | Product Review | 产品 + 运营 + 技术 | 月度总结 + 优先级调整 |
| **每季度** | Strategy Review | 全团队 | 季度规划 + Charter 更新 |

**不要等版本结束才复盘。固定节奏，持续改进。**

---

## 十二、User First — 用户至上原则

### 冲突解决规则

| 冲突场景 | 原则 | 说明 |
|---------|------|------|
| 用户体验 vs 开发便利 | **用户优先** | 宁可增加开发工作量，不降低用户体验 |
| 商业收益 vs 用户信任 | **用户信任优先** | 短期收益不得损害长期信任 |
| 功能丰富 vs 简洁清晰 | **简洁优先** | 少即是多，避免功能膨胀 |
| 技术完美 vs 用户需求 | **需求优先** | 先满足需求，再优化技术 |
| 数据收集 vs 用户隐私 | **隐私优先** | 最小化数据收集，明确告知用途 |

**这是玄风门长期原则，不可妥协。**

---

## 十三、AI Governance — AI 治理规范

### Professional Engine 永久原则

Professional Engine 永久保持三大特性：

| 特性 | 说明 | 实现方式 |
|------|------|---------|
| **可解释（Explainable）** | 每个结论能解释来源 | Explain Trace + Plain Explanation |
| **可追溯（Traceable）** | 每个结果能追溯到计算步骤 | TraceChain + Rule ID + Confidence |
| **可验证（Verifiable）** | 每个分析能被专家验证 | Expert Review + Cross Validation |

### 新增 AI 功能规范

任何新增 AI 功能：
- **不得输出**无法解释来源的结论
- **必须能够追溯**以下四类来源：
  - Rule（命中了哪条规则）
  - Knowledge（引用了哪条知识）
  - TraceChain（经过了哪些计算步骤）
  - Case（参考了哪个案例）

### AI 输出红线

| 禁止 | 说明 |
|------|------|
| 编造命理结论 | 没有规则/知识/案例支撑的结论 |
| 修改计算结果 | AI 不得改变 Professional Engine 的计算输出 |
| 隐藏数据来源 | 必须对用户展示分析依据 |
| 越权扩展 | 不得新增未经 Rule Registry 注册的分析维度 |

---

## 十四、Version Strategy — 版本策略

### 版本命名统一

以后版本命名严格遵循以下序列：

| 阶段 | 命名 | 说明 |
|------|------|------|
| 算法引擎 | GA | General Availability，如 V5.0 GA |
| 产品开发 | W1, W2, W3... | Web Product Layer 迭代 |
| 运营阶段 | Operations | 正式运营 |
| 长期支持 | LTS | Long Term Support |

**禁止恢复以下命名：** RC、Beta、Alpha。

### 版本记录

每个版本必须记录：
- 版本号 + 发布日期
- 新增功能列表
- 修复列表
- Product Debt 处理记录
- KPI 变化

---

## 十五、冻结约束确认

| 维度 | 约束 | 状态 |
|------|------|------|
| Professional Engine | 永久冻结 | Frozen |
| Module 1~8 | 永久冻结 | Frozen |
| Rule Registry | 不再扩大 | Frozen |
| 算法体系 | 不再扩展 | Frozen |
| W1 代码 | 除 Bug Fix 外冻结 | Frozen |
| W2+ 代码 | 遵循本宪章 | Active |

---

## 十六、变更流程

本宪章的修改流程：

1. 提出修改建议（书面，含理由）
2. 评估影响范围（是否违反核心价值观）
3. 确认不违反 frozen 约束
4. 更新本文档版本号
5. 通知所有开发人员
6. 更新 ARCHITECTURE.md 引用

版本记录：

| 版本 | 日期 | 变更说明 |
|------|------|---------|
| 1.0.0 | 2026-07-18 | W2 Development Charter 初始版本 |
| 2.0.0 | 2026-07-18 | 升级为 Product Constitution：新增 Section 0 核心价值观、九 Decision Rules、十 Product Debt、十一 KPI Review、十二 User First、十三 AI Governance、十四 Version Strategy |
| 2.1.0 | 2026-07-18 | 新增十七 Domain Governance：SSOT 约束、变更流程、禁止事项、Domain Reference Matrix |
| 2.2.0 | 2026-07-18 | Domain Governance 升级为 Enterprise Domain Platform：新增 Deprecation、ChangeLog、i18n、FeatureFlag、DomainMetrics、DomainEvent、Validator Strict Mode |

---

## 十七、Domain Governance — Domain 治理规范

### 17.1 Single Source of Truth

`src/shared/domain/index.ts` 是玄风门 **Enterprise Domain Platform**，项目的唯一数据标准（Single Source of Truth）。

所有层级必须统一引用 Domain：

| 层级 | 要求 |
|------|------|
| 数据库 | Migration 中的 CHECK 约束必须与 Domain 100% 一致 |
| API | 路由中的参数校验必须使用 Domain Validator |
| Hook | 自定义 Hook 中引用 Domain 枚举 |
| Component | 页面/组件中的展示必须引用 Domain Dictionary |
| Dashboard | 统计页面中的标签和颜色必须引用 Domain Dictionary |

### 17.2 Domain 变更流程

任何新增或修改枚举、状态、版本、标签、映射，必须遵循以下顺序：

1. **修改 Domain** — 先修改 `src/shared/domain/index.ts`
2. **Migration** — 创建数据库 Migration 对齐 CHECK 约束
3. **API** — 更新 API 路由引用新的 Domain 定义
4. **Hook** — 更新前端 Hook 引用
5. **Component** — 更新页面/组件引用

### 17.3 禁止事项

| 禁止行为 | 说明 |
|---------|------|
| 组件自己新增 Enum | 前端页面禁止定义独立的枚举值 |
| API 自己定义 Status | 后端路由禁止硬编码状态字符串 |
| Dashboard 自己维护 Label | 统计页面禁止自行维护标签映射 |
| 跳过 Domain 修改 | 禁止直接修改数据库 CHECK 而不先更新 Domain |
| 禁止 switch 分支硬编码 | 页面禁止使用 switch 硬编码枚举值到标签的映射，必须使用 Domain Dictionary 函数 |

### 17.4 Domain Reference Matrix

每个 Domain 枚举必须记录其在各层级的引用情况：

| Domain 枚举 | DB | API | Hook | Component | Dashboard |
|------------|-----|------|------|-----------|-----------|
| AnalysisType | ✓ | ✓ | ✓ | ✓ | ✓ |
| FeedbackStatus | ✓ | ✓ | ✓ | ✓ | ✓ |
| UserTier | ✓ | ✓ | ✓ | ✓ | ✓ |
| Gender | ✓ | ✓ | ✓ | ✓ | — |
| PaymentStatus | ✓ | ✓ | ✓ | ✓ | — |
| OrderStatus | ✓ | ✓ | — | ✓ | — |
| RefundStatus | ✓ | ✓ | — | — | — |
| Role | ✓ | ✓ | ✓ | ✓ | — |
| Permission | — | ✓ | ✓ | ✓ | — |
| Capability | — | ✓ | — | — | ✓ |

新增模块时，先查阅此 Matrix，确保不会产生新的重复定义。

### 17.5 Domain Enterprise Modules

Domain v2.1.0 Enterprise 统一管理以下模块：

| 模块 | 说明 | 使用场景 |
|------|------|---------|
| Enum | 枚举定义 | 全局 |
| Dictionary | 字典（中英文双语预留） | 前端 / Dashboard / 运营 |
| Validator | 校验函数（Strict / Loose） | API / 数据导入 |
| Version Registry | 版本注册（含 Deprecated/Removed） | Migration / History / API |
| Capability | 能力标识 | 权限控制 |
| FeatureFlag | 功能开关（含灰度/限量） | 运营后台 / A/B 测试 |
| DomainMetrics | 指标定义 | Dashboard / 运营统计 / 事件追踪 |
| DomainEvent | 领域事件 | Analytics / 日志 / 生命周期 |
| ChangeLog | 变更日志 | API / Migration / 审计 |

### 17.6 FeatureFlag 规则

功能开关遵循以下规则：

- **新增功能**：默认 `enabled: false`，经过验收后开启
- **灰度发布**：通过 `rolloutPercent` 控制放量比例
- **权限控制**：通过 `allowedRoles` / `allowedTiers` 限制可见范围
- **禁止代码耦合**：前端不得直接硬编码功能开关，必须引用 Domain FeatureFlag

### 17.7 Domain Event 规则

- **所有业务事件**必须使用 DomainEvent 枚举，禁止自定义事件名称
- **Analytics 事件追踪**仅跟踪 `trackAnalytics: true` 的事件
- **事件命名格式**：`领域:动作`（如 `report:created`, `pay:success`）

---

**本文档为玄风门产品开发宪章，承接 PRODUCT_VISION.md。**

**所有开发、评审、验收，全部引用这一份文档。**

**一次制定，长期执行。**
