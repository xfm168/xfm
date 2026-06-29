# 玄风门 Engineering Handbook

> 版本：**V2.0** | 生效日期：2026-06-29 | 适用范围：所有开发人员 & AI
>
> 本文档为玄风门项目工程开发规范。所有代码编写、重构、优化必须遵守。
> 违反规范的代码不得合并入主线。
>
> V2.0 更新：新增 Quality Gate（质量门禁）、质量评分、Bug等级、Code Review Checklist、Release Checklist

---

## 文档体系

玄风门十大核心文档：

| # | 文档 | 作用 | 状态 |
|---|------|------|------|
| 01 | [Project Status](./玄风门-Project-Status.md) | 当前开发状态 | ✅ |
| 02 | [Architecture Constitution](./玄风门-架构宪章.md) | 最高开发原则 | ✅ |
| 03 | Engineering Handbook（本文） | 工程开发规范 | ✅ |
| 04 | [Master PRD](./玄风门-Master-PRD.md) | 产品需求总文档 | ✅ |
| 05 | Version Roadmap | 长期版本规划 | ✅（在Project Status中） |
| 06 | [Algorithm Whitepaper](./玄风门-Algorithm-Whitepaper.md) | 算法白皮书 | ✅ |
| 07 | [Rule Specification](./玄风门-Rule-Specification.md) | 规则唯一来源 | ✅ |
| 08 | [Data Dictionary](./玄风门-Data-Dictionary.md) | 数据库唯一标准 | ✅ |
| 09 | [API Specification](./玄风门-API-Specification.md) | 接口唯一标准 | ✅ |
| 10 | [Admin Handbook](./玄风门-Admin-Handbook.md) | 后台运营手册 | ✅ |

---

## 1. 开发环境规范

### 1.1 基础环境

| 工具 | 版本要求 | 说明 |
|------|---------|------|
| Node.js | >= 20.x | LTS版本 |
| 包管理器 | npm | 统一使用npm，禁止混用pnpm/yarn |
| TypeScript | 6.x | 严格模式 |
| React | 19.x | |
| Vite | 8.x | |

### 1.2 TypeScript 严格模式

✅ **已开启：**
- `strict: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noFallthroughCasesInSwitch: true`

### 1.3 代码质量工具

| 工具 | 状态 | 计划版本 |
|------|------|---------|
| ESLint | ❌ 待接入 | V7.5 |
| Prettier | ❌ 待接入 | V7.5 |
| Husky | ❌ 待接入 | V8.0 |
| lint-staged | ❌ 待接入 | V8.0 |
| Commitlint | ❌ 待接入 | V8.0 |

---

## 2. Git 规范

### 2.1 分支模型

```
main ──────────────────────────────── 生产环境
  │
  └── develop ─────────────────────── 开发主线
        │
        ├── feature/bazi-geju ────── 功能开发
        ├── feature/fengshui-bazhai
        ├── fix/login-bug
        └── release/v7.0.0 ───────── 发布准备
```

### 2.2 分支命名规范

| 分支类型 | 命名格式 | 示例 |
|---------|---------|------|
| 功能开发 | `feature/<模块>-<功能>` | `feature/bazi-geju-refine` |
| Bug修复 | `fix/<问题描述>` | `fix/xiyong-calc-error` |
| 发布 | `release/v<版本号>` | `release/v7.0.0` |
| 热修复 | `hotfix/<问题>` | `hotfix/v7.0.1-crash` |
| 文档 | `docs/<内容>` | `docs/handbook-update` |

### 2.3 Commit 规范

采用 Conventional Commits：

```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型

| type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug修复 |
| `refactor` | 重构（不改变功能） |
| `style` | 代码格式（不影响逻辑） |
| `docs` | 文档更新 |
| `test` | 测试相关 |
| `perf` | 性能优化 |
| `chore` | 构建/工具/依赖 |
| `revert` | 回滚 |

#### 示例

```
feat(bazi): 增加飞天禄马格判断

- 新增 feitianlumaRule
- 补充破格条件
- 增加单元测试

Refs: #123
```

```
fix(xiyong): 修复调候权重计算错误

- 修正冬季调候权重
- 增加边界case测试

Closes: #456
```

### 2.4 版本Tag规范

```
v7.0.0
v7.1.0
v7.0.1   ← 补丁版本
v8.0.0
```

---

## 3. React 规范

### 3.1 组件拆分原则

| 组件类型 | 职责 | 示例 |
|---------|------|------|
| Page 页面组件 | 页面布局、数据组装、业务编排 | `BaziChart.tsx` |
| Container 容器组件 | 业务逻辑、状态管理 | `BaziResultContainer.tsx` |
| Presentational 展示组件 | 纯UI渲染、无业务逻辑 | `ScoreRing.tsx` |
| Business 业务组件 | 领域相关的可复用组件 | `Bagua.tsx`, `Compass.tsx` |

### 3.2 组件写法

✅ **函数组件 + Hooks**（统一使用）

❌ **禁止：** Class组件

### 3.3 Hooks 规范

1. **命名：** `use<功能>`
   - `useBaziCalculator`
   - `useDailyHexagram`
   - `useAIAnalysis`

2. **职责单一：** 一个Hook只做一件事

3. **放置位置：**
   - 通用Hook：`src/hooks/`
   - 业务Hook：`src/lib/<模块>/hooks/`

### 3.4 禁止事项

- ❌ 禁止在UI组件中写业务计算逻辑
- ❌ 禁止组件直接调用Supabase（必须走Service/Repository）
- ❌ 禁止超大组件（超过300行考虑拆分）
- ❌ 禁止props drilling超过3层（用Context或状态管理）

---

## 4. TypeScript 规范

### 4.1 类型优先

- ✅ 所有函数必须有返回类型
- ✅ 所有对象必须有interface/type
- ✅ 禁止隐式any
- ❌ 禁止 `as any`
- ❌ 禁止 `@ts-ignore`

### 4.2 命名规范

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| Interface | `I<名称>` 或 `<名称>` | `IBaziResult`, `BaziChartProps` |
| Type | `<名称>Type` 或直接命名 | `WuxingType`, `GejuLevel` |
| Enum | `<名称>Enum` 或  PascalCase | `GanzhiEnum`, `Gender` |
| 函数返回 | `<动作>Result` | `CalculateBaziResult` |
| Props | `<组件名>Props` | `ScoreRingProps` |
| State | `<名称>State` | `BaziState` |

### 4.3 统一 Result 对象

```typescript
// 成功
interface SuccessResult<T> {
  success: true
  data: T
}

// 失败
interface ErrorResult {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

type ApiResult<T> = SuccessResult<T> | ErrorResult
```

### 4.4 统一分析结果对象

所有命理分析模块必须返回：

```typescript
interface AnalysisResult {
  score: number               // 综合评分 0-100
  confidence: number          // 可信度 0-100
  matchedRules: string[]      // 命中的规则ID
  matchedRuleDetails: RuleDetail[]
  conflicts: Conflict[]       // 冲突规则
  reason: string              // 主要判断依据
  summary: string             // 算法总结（非AI）
  suggestions: string[]       // 建议列表
  derivationProcess: string   // 推导过程
}
```

---

## 5. 文件命名规范

### 5.1 统一规范

| 类型 | 命名格式 | 示例 | 位置 |
|------|---------|------|------|
| Page | `<名称>.tsx` | `BaziChart.tsx` | `src/pages/` |
| UI组件 | `index.tsx` + 目录 | `Button/index.tsx` | `src/components/ui/` |
| 业务组件 | `<名称>.tsx` | `Bagua.tsx` | `src/components/business/` |
| Hook | `use<名称>.ts` | `useBaziCalculator.ts` | `src/hooks/` |
| Service | `<名称>Service.ts` | `BaziService.ts` | `src/services/` |
| Repository | `<名称>Repository.ts` | `HexagramRepository.ts` | `src/repositories/` |
| Rule | `<模块>Rules.ts` | `gejuRules.ts` | `src/lib/bazi/rules/` |
| Prompt | `<模块>.ts` | `bazi.prompts.ts` | `src/services/ai/prompts/` |
| Migration | `<日期>_<名称>.sql` | `20260619_create_hexagrams.sql` | `supabase/migrations/` |
| Edge Function | `index.ts` + 目录 | `analyze-room/index.ts` | `supabase/functions/` |
| 测试 | `<名称>.test.ts` | `gejuRules.test.ts` | 同目录或 `__tests__/` |
| 工具函数 | `<名称>.ts` | `dateUtils.ts` | `src/utils/` |
| 类型定义 | `types.ts` | `types.ts` | 各模块内 |
| 常量 | `constants.ts` | `constants.ts` | 各模块内 |

### 5.2 目录结构原则

```
src/
├── components/           # 组件
│   ├── ui/              # UI基础组件（无业务）
│   └── business/        # 业务组件
├── pages/               # 页面
├── hooks/               # 通用Hook
├── services/            # 业务服务层
├── repositories/        # 数据访问层
├── lib/                 # 核心算法库
│   └── <模块>/
│       ├── rules/       # 规则
│       ├── types.ts
│       ├── constants.ts
│       └── index.ts
├── utils/               # 工具函数
├── types/               # 全局类型
└── assets/              # 静态资源
```

---

## 6. Rule Engine 规范

### 6.1 Rule 结构

```typescript
interface BaseRule<TContext, TResult> {
  id: string              // 唯一ID，全局唯一
  name: string            // 规则名称（中文，便于阅读）
  description: string     // 规则描述
  priority: number        // 优先级，数字越大越先执行
  weight: number          // 权重 0-100
  category: string        // 分类：geju/xiyong/wangshuai/...
  source: string          // 来源：滴天髓/穷通宝鉴/...
  version: string         // 版本号

  match(context: TContext): boolean        // 是否命中
  execute(context: TContext): TResult       // 执行
  explain(context: TContext): string        // 解释
}
```

### 6.2 Rule ID 命名规范

```
<模块>_<分类>_<序号>_<名称>
```

示例：
```
geju_zhengge_001_yueshangguansheng
geju_waige_001_feitianluma
xiyong_tiaohou_001_dongtianhuo
wangshuai_hehua_001_jiajihe
```

### 6.3 优先级定义

| 优先级 | 数值范围 | 说明 |
|--------|---------|------|
| 最高 | 900-999 | 基础事实（天干地支五行等） |
| 高 | 700-899 | 核心格局判断 |
| 中 | 400-699 | 普通规则 |
| 低 | 100-399 | 补充规则、特殊情况 |
| 最低 | 0-99 | 兜底规则 |

### 6.4 冲突解决

1. **高优先级覆盖低优先级**
2. **同优先级：**
   - 取权重高的
   - 权重相同则记录为冲突，交由上层判断
3. **所有冲突必须记录在 conflicts 中**

### 6.5 新增 Rule 要求

- ✅ 必须有唯一ID
- ✅ 必须有名称和描述
- ✅ 必须设置合理的优先级和权重
- ✅ 必须有来源说明（哪本书/哪派理论）
- ✅ 必须有单元测试
- ✅ 必须可追溯（能找到依据）
- ✅ 必须在 Project Status 中更新规则数量

---

## 7. AI 开发规范

### 7.1 AI 职责边界

> 详见《架构宪章》第六原则：AI只是解释器。

| ✅ 可以 | ❌ 禁止 |
|--------|--------|
| 解释算法结果 | 自行排盘 |
| 润色表达 | 自行判断格局 |
| 生成报告 | 自行判断喜用神 |
| 回答用户问题 | 自行判断旺衰 |
| 个性化建议 | 编造命理术语 |

### 7.2 Prompt 模板规范

1. **位置：** `src/services/ai/prompts/`
2. **命名：** `<模块>.prompts.ts`
3. **每个Prompt必须包含：**
   - System Prompt（角色设定）
   - User Prompt 模板
   - 输入变量说明
   - 输出格式说明
   - 温度设置
   - 预期模型

### 7.3 输出格式

- 优先使用 JSON 输出
- JSON schema 必须明确定义
- 必须有 JSON 解析失败的 fallback
- 必须有内容安全检查

### 7.4 重试与 Fallback

```
第一次调用：主要Provider（Gemini）
  ↓ 失败
第二次调用：备用Provider（OpenAI）
  ↓ 失败
Fallback：本地算法结果 + 模板化输出
```

### 7.5 缓存策略

- 相同输入 + 相同规则版本 = 可缓存
- 缓存Key：`ai:<promptName>:<hash(input)>:<ruleVersion>`
- 缓存时间：24小时
- 规则版本更新后缓存失效

### 7.6 Token 统计

- 每次调用必须记录 token 使用量
- 按模块统计成本
- 超限告警
- 月度预算控制

### 7.7 Provider 规范

| Provider | 用途 | 优先级 |
|----------|------|--------|
| Gemini Flash | 日常分析、解读 | P0 |
| Gemini Pro | 复杂深度分析 | P1 |
| OpenAI GPT | 备用/对比 | P2 |
| 本地模板 | Fallback | P3 |

---

## 8. Edge Function 规范

### 8.1 统一返回格式

```typescript
interface EdgeResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  meta?: {
    processingTime: number
    version: string
  }
}
```

### 8.2 命名与目录

```
supabase/functions/
├── analyze-room/
│   ├── index.ts          # 入口
│   ├── types.ts          # 类型
│   └── README.md         # 说明
├── bazi-calculate/
│   └── index.ts
└── _shared/              # 共享代码（以下划线开头）
    └── response.ts
```

### 8.3 日志规范

- 统一使用 `console.log/error/warn`
- 必须有 requestId 追踪
- 关键节点必须打日志
- 错误必须有堆栈
- 禁止打敏感信息（密钥、token等）

### 8.4 安全

- 必须校验 Authorization
- 必须做 Rate Limit
- 必须做输入校验
- 禁止返回数据库原始错误

---

## 9. 数据库规范

### 9.1 Migration 命名

```
<YYYYMMDD>_<动作>_<表名>.sql
```

示例：
```
20260619_create_hexagrams_table.sql
20260621_create_fengshui_reports_table.sql
20260701_add_user_id_to_divinations.sql
20260715_create_index_on_daily_hexagrams.sql
```

### 9.2 表设计规范

1. **主键：** `id` 用 `uuid` 或 `bigint`
2. **时间戳：** `created_at`, `updated_at` 必须有
3. **软删除：** `deleted_at`（可选）
4. **索引：**
   - 外键必须建索引
   - 常用查询字段建索引
   - 联合索引按区分度排序
5. **RLS：** 所有业务表必须启用 RLS

### 9.3 Repository 调用规范

> 详见《架构宪章》第四原则：Repository模式

```
Page → Service → Repository → Supabase
```

Repository 层职责：
- 数据CRUD
- 缓存操作
- 批量操作
- 事务管理

Service 层职责：
- 业务逻辑
- 结果组装
- 多Repository协调

✅ 正确：
```typescript
// 在Service中
const result = await baziRepository.getHistory(userId)
```

❌ 错误：
```typescript
// 在组件中
const { data } = await supabase.from('bazi_history').select('*')
```

---

## 10. 测试规范

### 10.1 测试金字塔

```
        /\
       /  \       E2E测试（少而精）
      /----\
     /      \     集成测试
    /--------\
   /          \   单元测试（大量）
  /------------\
 /    算法验证    \  算法测试（最核心）
/__________________\
```

### 10.2 测试框架

| 类型 | 框架 | 状态 | 计划版本 |
|------|------|------|---------|
| 算法测试 | 手写 + Node.js | ✅ 已有 | - |
| 单元测试 | Vitest | ❌ 待接入 | V7.5 |
| 组件测试 | Vitest + Testing Library | ❌ 待接入 | V8.0 |
| E2E测试 | Playwright | ❌ 待接入 | V8.0 |
| 性能测试 | k6 / Lighthouse | ❌ 待接入 | V8.5 |

### 10.3 算法测试要求

- ✅ 每个Rule必须有测试
- ✅ 边界case必须覆盖
- ✅ 100000组随机验证（八字模块）
- ✅ 准确率必须 >= 99%
- ✅ 每次重构必须跑全量测试

### 10.4 CI 自动化

| 检查项 | 时机 | 计划版本 |
|--------|------|---------|
| TypeScript 编译 | 每次PR | ✅ 已有 |
| 算法测试 | 每次PR | ✅ 已有 |
| ESLint | 每次PR | V7.5 |
| 单元测试 | 每次PR | V7.5 |
| E2E测试 | 合并前 | V8.0 |
| 构建检查 | 每次PR | ✅ 已有 |

---

## 11. Quality Gate（质量门禁）

任何代码 Merge 前必须经过 7 级质量门禁。

**任何一级不通过，不得进入下一级。**

```
Level 1  ──  代码完成
    ↓
Level 2  ──  TypeScript 无错误
    ↓
Level 3  ──  Rule 无冲突
    ↓
Level 4  ──  单元测试全部通过
    ↓
Level 5  ──  经典案例验证通过
    ↓
Level 6  ──  AI 输出符合算法
    ↓
Level 7  ──  文档同步更新
    ↓
 允许 Merge
```

### 各级门禁详细要求

| 级别 | 门禁 | 检查内容 | 验证方式 |
|------|------|---------|---------|
| L1 | 代码完成 | 功能开发完成，自测通过 | 开发者自查 |
| L2 | TypeScript 无错误 | 严格模式下 0 错误，0 warning | `tsc --noEmit` |
| L3 | Rule 无冲突 | 规则之间无冲突，优先级正确 | Rule Engine 自检 |
| L4 | 单元测试全部通过 | 正常+边界+经典+反例 全部通过 | Vitest 测试 |
| L5 | 经典案例验证通过 | 典籍案例验证达标 | 人工验证 + 自动化对比 |
| L6 | AI 输出符合算法 | AI解释与算法结论一致，无幻觉 | 抽样检查 + Prompt Review |
| L7 | 文档同步更新 | 相关文档全部更新 | Code Review 检查 |

---

## 12. 质量评分（Quality Score）

每个模块必须有 Quality Score，满分 100 分。

**低于 80 分禁止上线。**

### 评分组成

| 维度 | 权重 | 说明 |
|------|------|------|
| 代码质量 | 15% | TypeScript 规范、代码可读性、架构符合度 |
| 算法准确率 | 30% | 与经典案例/商业软件比对的正确率 |
| 测试覆盖率 | 20% | 单元测试、集成测试、边界测试覆盖 |
| 文档完整度 | 10% | Rule文档、技术文档、API文档 |
| 性能 | 10% | 响应速度、资源占用 |
| 安全 | 10% | 安全漏洞、数据保护、权限控制 |
| 可维护性 | 5% | 代码复杂度、可扩展性、回滚能力 |

### 等级划分

| 分数 | 等级 | 状态 |
|------|------|------|
| 90-100 | A | ✅ 优秀，可上线 |
| 80-89 | B | ✅ 良好，可上线 |
| 70-79 | C | ⚠️ 待改进，禁止上线 |
| 60-69 | D | ❌ 较差，需重构 |
| <60 | F | ❌ 不可用，必须重写 |

---

## 13. Bug 等级

| 等级 | 定义 | 响应时间 | 修复要求 | 示例 |
|------|------|---------|---------|------|
| **P0** | 致命错误 | 立即修复 | 2小时内出修复方案，4小时内上线 | 算法错误、排盘错误、数据错误 |
| **P1** | 严重错误 | 24小时修复 | 24小时内出修复方案，48小时内上线 | 推导错误、Rule冲突、AI解释错误 |
| **P2** | 一般问题 | 版本修复 | 当前版本或下一版本修复 | UI问题、性能问题、体验问题 |
| **P3** | 优化建议 | Backlog | 排期处理，不影响上线 | 代码优化、体验优化、功能建议 |

### P0 示例

- 八字排盘结果错误
- 五行旺衰计算完全错误
- 格局判断与典籍严重不符
- 用户数据丢失或泄露
- 系统崩溃无法使用

### P1 示例

- 喜用神判断偏差较大
- 规则之间有冲突未解决
- AI解释与算法结论不一致
- 大运流年计算有误差

---

## 14. 发布规范

### 14.1 发布流程

```
开发 → 测试 → 预发布 → 正式发布 → 监控
  │       │       │          │
  ▼       ▼       ▼          ▼
feature  develop  release    main
  │       │       │          │
  └──────►└──────►└─────────►┘
```

### 14.2 环境

| 环境 | 分支 | 域名 | 说明 |
|------|------|------|------|
| 开发 | develop | dev.xxx.com | 日常开发 |
| 预发布 | release/* | staging.xxx.com | 发布前验证 |
| 生产 | main | www.xxx.com | 正式环境 |

### 14.3 发布步骤

1. **准备阶段**
   - 创建 release 分支
   - 更新版本号
   - 更新 Project Status
   - 更新 Changelog

2. **验证阶段**
   - 全量测试
   - 预发布环境验证
   - 回归测试

3. **发布阶段**
   - 合并到 main
   - 打 Tag
   - 触发自动部署
   - 数据库迁移

4. **发布后**
   - 监控错误率
   - 监控性能
   - 验证核心功能
   - 回滚预案

### 14.4 Rollback 策略

- 小问题：快速修复，发补丁版本
- 大问题：回滚到上一版本
- 数据库问题：迁移脚本 + 数据修复脚本
- 回滚必须在30分钟内完成

### 14.5 Release Checklist

每次发布必须逐项确认：

| # | 检查项 | 说明 | 责任人 |
|---|--------|------|--------|
| 1 | Rule版本号 | 规则引擎版本号已更新 | 算法负责人 |
| 2 | Prompt版本号 | AI Prompt 版本号已更新 | AI负责人 |
| 3 | 数据库Migration | 迁移脚本已验证，回滚脚本已准备 | 后端负责人 |
| 4 | Edge Function | 所有Edge Function已部署并测试 | 后端负责人 |
| 5 | API | 接口兼容，无破坏性变更 | 后端负责人 |
| 6 | Admin | 后台功能正常 | 前端负责人 |
| 7 | 文档 | 相关文档全部同步更新 | 全体 |
| 8 | 回滚方案 | 回滚方案已准备并验证 | 技术负责人 |

> ⚠️ 发布后 **24小时监控日志**，发现异常立即回滚。

---

## 15. 代码审查规范

### 15.1 Code Review Checklist

每次 Review 必须逐项检查：

| # | 检查项 | 说明 |
|---|--------|------|
| 1 | ✅ 符合架构宪章 | 是否违反12大原则 |
| 2 | ✅ 符合工程规范 | 是否符合本文档所有规范 |
| 3 | ✅ 新增测试 | 是否有足够的测试覆盖（正常/边界/经典/反例） |
| 4 | ✅ Rule说明 | 新增的Rule是否有来源依据，是否有文档 |
| 5 | ✅ 更新文档 | 是否同步更新相关文档（Rule Spec / Whitepaper / API Spec / Project Status） |
| 6 | ✅ 影响其他模块 | 是否影响其他模块，影响是否可控 |
| 7 | ✅ 影响AI Prompt | 是否需要更新 Prompt，Reason Chain 是否同步 |
| 8 | ✅ 影响API | 是否有API变更，是否有版本兼容 |
| 9 | ✅ 影响数据库 | 是否有数据库变更，是否有Migration |
| 10 | ✅ TypeScript无错误 | 严格模式下0错误 |
| 11 | ✅ 可回滚 | 出问题是否能快速回滚 |

**全部通过才能合并。**

### 15.2 审查原则

- 架构问题：一票否决
- 算法问题：一票否决
- 安全问题：一票否决
- 质量问题：一票否决
- 代码风格：建议修改
- 性能问题：视情况而定

---

## 附录 A：快速检查清单

开发新功能前：

- [ ] 阅读架构宪章，确认不违反原则
- [ ] 查看 Project Status，了解当前状态
- [ ] 阅读 Master PRD，确认产品方向
- [ ] 按Git规范创建分支
- [ ] 按命名规范创建文件

开发完成后（Quality Gate 自查）：

- [ ] L1 代码完成，自测通过
- [ ] L2 TypeScript 编译通过（0错误）
- [ ] L3 Rule 无冲突
- [ ] L4 单元测试全部通过
- [ ] L5 经典案例验证通过
- [ ] L6 AI 输出符合算法
- [ ] L7 文档同步更新
- [ ] Project Status 已更新
- [ ] 提交信息符合规范
- [ ] PR 描述清晰

发布前：

- [ ] Rule版本号已更新
- [ ] Prompt版本号已更新
- [ ] 数据库Migration已验证
- [ ] Edge Function已部署
- [ ] API兼容性已确认
- [ ] 文档已全部更新
- [ ] 回滚方案已准备

---

> 本文档为工程开发最高规范，所有代码必须遵守。
> 如需修改，需架构师审批。
