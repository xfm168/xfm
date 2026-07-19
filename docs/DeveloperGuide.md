# 玄风门开发者指南

> 版本: V4.4 | 更新日期: 2026-07-12

---

## 目录

1. [项目克隆与安装](#项目克隆与安装)
2. [开发环境搭建](#开发环境搭建)
3. [代码规范](#代码规范)
4. [目录结构](#目录结构)
5. [命理内核约束](#命理内核约束)
6. [Git 工作流](#git-工作流)
7. [测试规范](#测试规范)
8. [新增功能标准流程](#新增功能标准流程)
9. [Pull Request 模板](#pull-request-模板)
10. [常见问题](#常见问题)

---

## 项目克隆与安装

### 前提条件

| 依赖 | 最低版本 | 检查命令 |
|------|----------|----------|
| Node.js | >= 18.0.0 | `node -v` |
| npm | >= 9.0.0 | `npm -v` |
| Git | >= 2.30 | `git --version` |

### 克隆仓库

```bash
git clone <repository-url>
cd xuanfengmen1
```

### 安装依赖

```bash
npm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入实际值
# 必须配置: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
# AI 服务: 至少配置 VITE_OPENAI_API_KEY 或 VITE_GEMINI_API_KEY 之一
```

---

## 开发环境搭建

### 启动前端开发服务器

```bash
npm run dev
```

Vite 开发服务器将在 `http://localhost:3000` 启动，支持热更新（HMR）。

### 启动后端 API 服务

```bash
npm run server:dev
```

Hono API 服务将在 `http://localhost:3001` 启动，使用 `tsx watch` 实现文件变更自动重启。

### 同时启动前后端

建议使用两个终端窗口:

终端 1:
```bash
npm run dev
```

终端 2:
```bash
npm run server:dev
```

### 验证环境

1. 访问 `http://localhost:3000` - 确认前端页面正常加载
2. 访问 `http://localhost:3001/api/health` - 确认 API 返回 `{"status":"ok"}`
3. 尝试在前端输入八字信息排盘 - 确认前后端联调正常

---

## 代码规范

### 字符串约束（重要）

本项目有一条严格的代码规范:

> **使用单引号 + 字符串拼接（`+`），禁止使用 backtick 模板字符串。**

这条规范在后端代码中严格执行，前端代码中也应尽量遵守。

**正确写法**:
```javascript
var message = '用户 ' + userName + ' 的分析已完成'
var url = '/api/payment/orders/' + orderId
var sql = 'SELECT * FROM users WHERE id = \'' + userId + '\''
```

**错误写法**:
```javascript
var message = '用户 ${userName} 的分析已完成'     // 禁止: backtick
var url = '/api/payment/orders/${orderId}'       // 禁止: backtick
```

**例外**: Markdown 文档中的代码块语法（使用 ` 作为 Markdown 标记，而非 JS 语法）是允许的。

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 文件（组件） | PascalCase | `BaziChart.tsx`, `ScoreRing.css` |
| 文件（工具/Hook） | camelCase | `useAuth.ts`, `calculateBaZi.ts` |
| 文件（路由） | camelCase | `bazi.ts`, `payment.ts` |
| React 组件 | PascalCase | `function Home() {}`, `const Bagua = () => {}` |
| 自定义 Hook | camelCase + use 前缀 | `useBazi()`, `usePayment()` |
| CSS 类名 | kebab-case | `.score-ring`, `.bazi-chart-container` |
| 环境变量 | UPPER_SNAKE_CASE + VITE_ 前缀（前端） | `VITE_SUPABASE_URL` |
| 数据库列名 | snake_case | `user_id`, `birth_date` |
| API 路径 | kebab-case | `/api/payment/create-order` |
| TypeScript 接口 | PascalCase | `BaZiChart`, `UserProfile` |
| 常量 | UPPER_SNAKE_CASE | `PRODUCT_PRICES`, `VALID_ANALYSIS_TYPES` |

### TypeScript 规范

- `tsconfig.json` 中 `strict` 设为 `false`（历史兼容），新代码应使用严格类型
- 接口定义集中在 `src/lib/database/types.ts`（数据库类型）和各模块的 `types.ts`
- 避免使用 `any`，优先使用 `unknown` + 类型守卫

### CSS 规范

- 每个组件对应一个同名的 `.css` 文件
- 使用设计系统令牌（`src/design/`），禁止硬编码颜色值
- 响应式设计使用媒体查询，不引入 CSS-in-JS 库

---

## 目录结构

```
xuanfengmen1/
├── src/
│   ├── components/        # React 组件
│   │   ├── ui/            # 通用 UI 组件
│   │   ├── business/      # 业务组件（八卦、罗盘、太极等）
│   │   ├── Header.tsx     # 全局头部
│   │   ├── Footer.tsx     # 全局底部
│   │   └── AuthGuard.tsx  # 路由鉴权守卫
│   ├── design/            # 设计系统令牌（colors, typography, spacing...）
│   ├── hooks/             # 自定义 Hooks（useAuth, useBazi, usePayment...）
│   ├── lib/
│   │   ├── bazi/          # 命理内核（FROZEN!）
│   │   ├── fengshui/      # 风水模块
│   │   ├── cache/         # 五级缓存体系
│   │   ├── core/          # 核心基础类型
│   │   ├── business/      # 业务逻辑
│   │   ├── security/      # 安全工具
│   │   ├── monitoring/    # 监控（Sentry/GA）
│   │   └── ...            # 其他工具库
│   ├── pages/             # 页面组件
│   ├── server/            # 后端 API
│   │   ├── index.ts        # Hono 入口
│   │   ├── middleware/     # 中间件
│   │   └── routes/         # 路由
│   ├── services/ai/       # AI 服务
│   └── utils/             # 工具函数
├── supabase/
│   ├── functions/          # Edge Functions
│   └── migrations/         # 数据库迁移
├── scripts/               # 工具脚本
└── docs/                  # 文档
```

### 关键目录说明

| 目录 | 说明 | 约束 |
|------|------|------|
| `src/lib/bazi/` | 命理内核（QI Engine + 规则引擎 + 知识库） | **FROZEN - 禁止修改** |
| `src/lib/fengshui/` | 风水分析模块（101 条规则，76 条知识） | 可扩展，不修改现有规则 |
| `src/server/routes/` | API 路由定义 | 新增端点遵循现有模式 |
| `src/services/ai/` | 推演服务层 | Provider 模式，支持新增引擎 |
| `src/design/` | 设计系统令牌 | 修改影响全局，需谨慎 |
| `src/golden/` | 命理黄金案例数据 | **禁止修改** - 测试基线 |

---

## 命理内核约束

### 冻结状态

`src/lib/bazi/` 目录处于 **FROZEN（冻结）** 状态，这是项目最核心的计算引擎，承载了全部命理算法和知识。

### 什么不能做

1. **禁止修改** `src/lib/bazi/` 下任何文件
2. **禁止修改** `src/golden/` 下的黄金案例 JSON 文件
3. **禁止修改** 命理内核的 228 个回归测试用例（`src/lib/bazi/__tests__/regression/`）
4. **禁止修改** 冻结清单 `src/lib/bazi/qi/reasoning/freeze-manifest.json`

### 如果必须修改

如果确有充分理由需要修改命理内核:

1. 先提交架构变更提案到 `docs/architecture/reviews/` 目录
2. 提案必须包含: 变更原因、影响范围、回归测试计划、回滚方案
3. 提案经审批后方可执行修改
4. 修改后必须重新运行全部 228 个回归测试并确保通过

### 治理机制

命理内核有完整的治理体系（`src/lib/bazi/governance/`）:

| 机制 | 说明 |
|------|------|
| `freeze.ts` | 冻结状态检查器 |
| `qualityGate.ts` | 质量门控 |
| `benchmark.ts` | 性能基准 |
| `snapshot.ts` | 快照管理 |
| `dashboard.ts` | 治理仪表盘 |
| `p0Snapshot.ts` | P0 级别快照 |
| `observability.ts` | 可观测性 |

---

## Git 工作流

### 分支策略

| 分支 | 用途 | 说明 |
|------|------|------|
| `main` | 生产分支 | 稳定代码，每次合并需通过测试 |
| `develop` | 开发分支 | 日常开发集成 |
| `feature/*` | 功能分支 | 从 develop 分出，完成后合并回 develop |
| `hotfix/*` | 热修复分支 | 从 main 分出，修复后合并回 main 和 develop |
| `release/*` | 发布分支 | 版本发布前的最后整合 |

### 分支命名规范

```
feature/<issue-id>-<short-description>
hotfix/<issue-id>-<short-description>
release/<version>
```

示例:
```
feature/42-add-fengshui-bathroom-rules
hotfix/15-fix-auth-token-expiry
release/4.4.0
```

### Commit Message 规范

遵循 Conventional Commits 格式:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Type 列表**:

| Type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档变更 |
| `style` | 代码风格（不影响逻辑） |
| `refactor` | 重构（不新增功能，不修复 Bug） |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建过程或辅助工具变动 |

**Scope 列表**:

| Scope | 说明 |
|-------|------|
| `bazi` | 命理内核（应尽量避免） |
| `fengshui` | 风水模块 |
| `api` | 后端 API |
| `auth` | 认证 |
| `payment` | 支付 |
| `ui` | 前端 UI |
| `design` | 设计系统 |
| `cache` | 缓存 |
| `ai` | 推演服务 |
| `security` | 安全 |
| `db` | 数据库 |

**示例**:

```
feat(fengshui): add bathroom fengshui rules

Add 12 new bathroom fengshui rules covering:
- Bathroom door orientation
- Mirror placement
- Ventilation requirements

Refs #42
```

```
fix(api): resolve auth token validation error

The auth middleware was not properly handling expired tokens,
causing 500 errors instead of 401.

Fixes #15
```

---

## 测试规范

### 测试框架

- **Vitest** - 单元测试和集成测试框架
- 配置文件: `vitest.config.ts`
- 测试模式匹配: `src/**/*.test.ts`

### 运行测试

```bash
# 运行全部测试
npm run test

# 监听模式
npm run test:watch
```

### 228 回归测试

命理内核包含 **228 个回归测试**，这些测试是命理计算的黄金标准，必须满足以下约束:

1. **不能修改测试用例** - 这些测试用例代表命理学的正确答案
2. **不能修改预期结果** - 所有断言值基于经典命理文献和专家验证
3. **不能让测试失败** - 如果修改导致测试失败，说明修改有误
4. **不能删除测试** - 每个测试覆盖一个命理规则或案例

回归测试文件位于:

```
src/lib/bazi/__tests__/regression/
├── cases/
│   ├── classicalCases.ts      # 经典案例（三合局、六合、会方等）
│   ├── liuHeHeBan.ts          # 六合合绊
│   ├── sanHeChengHua.ts       # 三合化
│   └── sanHuiChengHua.ts      # 三会方
├── runner-classical.ts        # 经典案例运行器
├── runner-p1.ts               # P1 级别运行器
├── runner-p21.ts              # P21 级别运行器
├── runner.ts                  # 主运行器
└── ...
```

### 测试准则

1. 提交代码前必须运行 `npm run test` 确认全部通过
2. 新增功能应编写对应测试
3. 不要跳过（skip）任何测试
4. 不要降低测试覆盖率

---

## 新增功能标准流程

### 新增页面

1. 在 `src/pages/` 创建页面组件和样式文件:

```
src/pages/NewPage.tsx
src/pages/NewPage.css
```

2. 在 `src/App.tsx` 中添加路由:

```javascript
const NewPage = React.lazy(function() { return import('./pages/NewPage') })
// 在 <Routes> 中添加:
<Route path="/new-page" element={<NewPage />} />
```

3. 如需鉴权，用 `AuthGuard` 包裹:

```javascript
<Route path="/new-page" element={<AuthGuard><NewPage /></AuthGuard>} />
```

4. 如需新 Hook:

```
src/hooks/useNewFeature.ts
```

### 新增通用 UI 组件

1. 在 `src/components/ui/` 创建组件目录:

```
src/components/ui/NewComponent/
├── NewComponent.tsx
└── NewComponent.css
```

2. 在 `src/components/ui/index.ts` 中导出组件

3. 使用设计系统令牌（`src/design/`）确保风格一致

### 新增业务组件

1. 在 `src/components/business/` 创建组件目录:

```
src/components/business/NewBusiness/
├── NewBusiness.tsx
└── NewBusiness.css
```

2. 在 `src/components/business/index.ts` 中导出

### 新增自定义 Hook

1. 在 `src/hooks/` 创建 Hook 文件:

```
src/hooks/useNewFeature.ts
```

2. 遵循命名规范: `use` + PascalCase

3. 使用 `useState` + `useCallback` 模式管理状态

4. 如需持久化，使用 `localStorage`:

```javascript
var [data, setData] = useState(function() {
  var saved = localStorage.getItem('key')
  return saved ? JSON.parse(saved) : defaultValue
})
```

### 新增 API 端点

1. 在 `src/server/routes/` 创建路由文件:

```
src/server/routes/newFeature.ts
```

2. 使用 Hono 路由模式:

```javascript
import { Hono } from 'hono'
import { authRequired, requireUser } from '../middleware/auth'
import { ApiError } from '../middleware/error'

var app = new Hono()

app.post('/', authRequired, async function(c) {
  var user = requireUser(c)
  var body = await c.req.json()
  // ... 业务逻辑
  return c.json({ success: true })
})

export default app
```

3. 在 `src/server/index.ts` 中注册路由:

```javascript
import newFeatureRoutes from './routes/newFeature'
app.route('/api/new-feature', newFeatureRoutes)
```

4. 在 `src/lib/database/types.ts` 中添加相关类型定义（如涉及数据库操作）

5. 在 `supabase/migrations/` 中添加迁移文件（如涉及数据库表变更）

### 新增风水规则

1. 在 `src/lib/fengshui/rules/rooms/` 对应房间目录中添加规则
2. 遵循现有规则的格式和结构
3. 添加对应的测试用例

---

## Pull Request 模板

提交 PR 时请填写以下内容:

```
## 概述

简要描述本次变更的内容和目的。

## 变更类型

- [ ] feat: 新功能
- [ ] fix: 修复 Bug
- [ ] docs: 文档变更
- [ ] style: 代码风格
- [ ] refactor: 重构
- [ ] perf: 性能优化
- [ ] test: 测试
- [ ] chore: 构建/工具

## 变更范围

- [ ] 前端 UI
- [ ] 后端 API
- [ ] 数据库
- [ ] 命理内核（需特别说明原因）
- [ ] 风水模块
- [ ] AI 服务
- [ ] 支付
- [ ] 安全
- [ ] 文档

## 详细说明

### 做了什么
- ...

### 为什么这样做
- ...

### 测试方式
- [ ] 本地开发环境验证通过
- [ ] 运行 npm run test 全部通过（228 个回归测试）
- [ ] 运行 npm run build 构建成功
- [ ] 手动测试了以下场景:
  1. ...
  2. ...

## 影响评估

- 是否影响命理内核: [ ] 是 / [ ] 否
- 是否影响数据库结构: [ ] 是 / [ ] 否（如果是，列出迁移文件）
- 是否影响现有 API 接口: [ ] 是 / [ ] 否（如果是，说明兼容性）
- 是否引入新的环境变量: [ ] 是 / [ ] 否

## 截图/日志

（如有必要）

## 关联 Issue

Fixes #<issue-id>
```

---

## 常见问题

### Q1: npm run dev 启动失败 "ENOENT: no such file or directory"

**原因**: 依赖未安装或 node_modules 损坏。

**解决**:
```bash
rm -rf node_modules
npm install
npm run dev
```

### Q2: npm run build 报 TypeScript 错误

**原因**: TypeScript 类型检查失败。

**解决**:
1. 检查 `tsconfig.json` 配置
2. 确认路径别名 `@/` 正确映射
3. 如果是新引入的类型错误，修复类型定义
4. 如果是第三方库类型缺失，检查 `@types/` 包

### Q3: 后端 API 返回 401 但前端已登录

**原因**: Auth 中间件校验失败。

**解决**:
1. 检查请求头是否携带 `Authorization: Bearer <token>`
2. 确认 token 未过期（可通过 `POST /api/auth/me` 验证）
3. 开发环境中 auth 中间件有 dev-user fallback，任何 token 都会放行
4. 生产环境需移除 fallback 代码

### Q4: 修改代码后页面没有更新

**原因**: Vite HMR 未正确触发。

**解决**:
1. 确认 `npm run dev` 正在运行
2. 检查文件是否在 `src/` 目录下
3. 手动刷新浏览器（Ctrl+Shift+R 强制刷新）
4. 清除 Vite 缓存: `rm -rf node_modules/.vite`

### Q5: 如何添加新的支付方式？

**步骤**:
1. 在 `src/lib/payment/` 添加新的支付模块（如 `wechatPay2.ts`）
2. 在 `src/server/routes/payment.ts` 中添加 webhook 路由
3. 在数据库 `orders.payment_method` 和 `v11_payments.payment_method` 的 CHECK 约束中添加新支付方式（需要新的迁移文件）
4. 在 `src/lib/database/types.ts` 的 `V11PaymentMethod` 类型中添加新值
5. 在 `src/server/routes/payment.ts` 的 `isValidPaymentMethod` 函数中添加新值
6. 更新产品定价映射（如需要）

### Q6: 前端 Hook 中如何调用后端 API？

项目中已有标准 Hook 模式，参考 `src/hooks/useAuth.ts`、`useBazi.ts`、`usePayment.ts` 等:

```javascript
import { useState, useCallback } from 'react'

function useNewFeature() {
  var [loading, setLoading] = useState(false)
  var [error, setError] = useState(null)
  var [data, setData] = useState(null)

  var execute = useCallback(async function(params) {
    setLoading(true)
    setError(null)
    try {
      var response = await fetch('/api/new-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify(params),
      })
      var result = await response.json()
      if (!response.ok) {
        throw new Error(result.error.message)
      }
      setData(result)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  return { data, error, loading, execute }
}
```

### Q7: 如何查看缓存命中率？

使用 `src/lib/cache/CacheReport.ts` 提供的报告生成器:

```javascript
import { generateReport, exportJSON } from '@/lib/cache'

// 生成报告
var report = generateReport()

// 导出 JSON
var jsonReport = exportJSON()
console.log(jsonReport)
```

### Q8: 生产环境部署前需要做哪些检查？

部署前清单:

1. 运行 `npm run test` - 确认 228 个回归测试全部通过
2. 运行 `npm run build` - 确认构建成功无错误
3. 运行 `npm run release-check` - 发布前检查脚本
4. 确认移除了 `src/server/middleware/auth.ts` 中的 dev-user fallback
5. 确认 CORS 配置限制了 origin
6. 确认所有环境变量已配置（不使用默认值）
7. 确认 `JWT_SECRET` 不是 `default-secret-change-me`
