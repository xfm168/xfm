# 玄风门系统架构文档

> 版本: V4.4 | 更新日期: 2026-07-12

---

## 目录

1. [整体架构](#整体架构)
2. [前端架构](#前端架构)
3. [后端架构](#后端架构)
4. [数据库架构](#数据库架构)
5. [推演服务架构](#ai-服务架构)
6. [缓存架构](#缓存架构)
7. [安全架构](#安全架构)
8. [目录结构](#目录结构)

---

## 整体架构

玄风门是一个全栈命理风水分析平台，采用前后端分离架构，前端 SPA + 后端 API 服务，数据库和认证托管于 Supabase。

```
┌─────────────────────────────────────────────────────────────┐
│                        客户端 (浏览器)                        │
│  React 19 + TypeScript 6 + Vite 8 + react-router-dom v7    │
│  Pure CSS Design System (src/design/)                        │
│  Hooks 模式: useState + useCallback + localStorage           │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTP / REST API
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    后端 API (Hono 4)                          │
│  src/server/                                                 │
│  ├── middleware/  (auth, error, rateLimiter, inputValidator) │
│  └── routes/      (bazi, analyze, payment, auth, etc.)       │
└──────┬──────────┬──────────┬────────────────────────────────┘
       │          │          │
       ▼          ▼          ▼
┌────────────┐ ┌──────────┐ ┌───────────────────┐
│  Supabase  │ │ AI 引擎  │ │    支付网关         │
│            │ │          │ │                     │
│ PostgreSQL │ │ OpenAI   │ │ 微信支付 / 支付宝   │
│ Auth       │ │ Gemini   │ │ Stripe              │
│ Edge Fns   │ │ Edge Fns │ │                     │
└────────────┘ └──────────┘ └───────────────────┘
```

**核心数据流:**

1. 用户在浏览器输入出生信息 -> 前端调用 `POST /api/bazi` 排盘
2. 排盘结果缓存到前端 -> 用户发起分析请求 `POST /api/analyze`
3. 分析引擎（命理内核 QI Engine）计算结果 -> 可选调用推演生成解读
4. 结果写入 Supabase `analysis_history` 表 -> 前端展示报告

---

## 前端架构

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.x | UI 渲染 |
| TypeScript | 6.x | 类型安全 |
| Vite | 8.x | 构建工具 |
| react-router-dom | 7.x | 路由管理 |

### 设计系统

采用 Pure CSS 方案，无第三方 UI 框架依赖。设计令牌定义在 `src/design/`:

| 文件 | 内容 |
|------|------|
| `colors.ts` | 色彩系统（主色、辅色、语义色） |
| `typography.ts` | 字体排版规范 |
| `spacing.ts` | 间距系统 |
| `radius.ts` | 圆角规范 |
| `shadow.ts` | 阴影规范 |
| `motion.ts` | 动效规范 |
| `theme.ts` | 主题聚合导出 |

### 组件架构

```
src/components/
├── ui/              # 通用 UI 组件
│   ├── Button/      # 按钮
│   ├── Card/        # 卡片
│   ├── Modal/       # 模态框
│   ├── Loading/     # 加载指示器
│   ├── Badge/       # 徽章
│   ├── Tag/         # 标签
│   ├── Divider/     # 分割线
│   ├── Skeleton/    # 骨架屏
│   ├── Section/     # 区块容器
│   └── PageTitle/  # 页面标题
├── business/        # 业务组件
│   ├── Bagua/       # 八卦图
│   ├── Compass/     # 罗盘
│   ├── Taiji/       # 太极图
│   ├── ScoreRing/   # 评分环
│   ├── ScoreBar/    # 评分条
│   ├── FeatureCard/ # 特征卡片
│   ├── BaziPoster/  # 八字海报
│   ├── ReportExperience/ # 报告体验
│   └── ConfidenceReport/ # 置信度报告
├── Header.tsx       # 全局头部
├── Footer.tsx       # 全局底部
├── AuthGuard.tsx    # 路由鉴权守卫
├── ErrorBoundary.tsx # 错误边界
└── SkipLink.tsx     # 无障碍跳链
```

### 状态管理

采用 React Hooks + localStorage 方案，无 Redux/Zustand 等外部状态库:

- **useState / useCallback**: 组件级状态与回调缓存
- **localStorage**: 用户会话持久化（登录态、偏好设置）
- **React.lazy**: 页面级代码分割与懒加载

### 路由结构

所有路由定义在 `src/App.tsx`，使用 `BrowserRouter`:

| 路径 | 页面 | 鉴权 |
|------|------|------|
| `/` | Home (首页) | 无 |
| `/bazi` | BaziInput (八字输入) | 无 |
| `/bazi/chart` | BaziChart (命盘展示) | 无 |
| `/bazi/history` | BaziHistory (命盘历史) | 无 |
| `/analysis` | Analysis (分析页) | 无 |
| `/premium-report` | PremiumReport (高级报告) | 无 |
| `/fengshui` | FengShui (风水分析) | 无 |
| `/daily` | Daily (每日卦象) | 无 |
| `/liuyao` | Divination (六爻占卜) | 无 |
| `/records` | History (历史记录) | 无 |
| `/membership` | Membership (会员中心) | 无 |
| `/login` | Login (登录) | 无 |
| `/feedback` | Feedback (反馈) | 无 |
| `/user-center` | UserCenter (个人中心) | AuthGuard |
| `/admin` | Dashboard (管理面板) | AuthGuard + Admin |
| `/admin/ai-cost` | AICostDashboard (推演成本) | AuthGuard + Admin |

### 构建优化

通过 Vite `manualChunks` 策略进行分包:

| 分包名称 | 包含模块 |
|----------|----------|
| `bazi-case-data` | 命理案例数据 |
| `bazi-knowledge` | 命理知识库 |
| `bazi-knowledge-graph` | 知识图谱 |
| `bazi-rules` | 规则引擎（格局/十神/五行/喜用） |
| `hexagram` | 六十四卦数据 |
| `fengshui` | 风水模块（pipeline/explainEngine/evidenceChain） |
| `payment` | 支付业务模块 |
| `dashboard-v2` | 仪表盘与用户中心 |
| `auth` | 认证模块 |
| `monitoring` | 监控模块（Sentry/GA） |

---

## 后端架构

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Hono | 4.x | Web 框架 |
| @hono/node-server | 2.x | Node.js HTTP 适配 |
| tsx | 4.x | TypeScript 直接运行 |

### 架构设计

后端服务入口在 `src/server/index.ts`，Hono 应用以默认导出形式暴露，兼容 Edge 运行时部署（Cloudflare Workers / Vercel Edge / Deno）。本地开发通过 `typeof process` 守卫启动 Node HTTP 服务。

### 中间件栈

| 中间件 | 文件 | 功能 |
|--------|------|------|
| CORS | Hono 内置 | 跨域请求处理（生产环境应限制 origin） |
| ErrorHandler | `middleware/error.ts` | 统一错误处理（ApiError -> JSON） |
| authRequired | `middleware/auth.ts` | 强制鉴权（Bearer JWT 校验） |
| authOptional | `middleware/auth.ts` | 可选鉴权（有 token 则校验，无则跳过） |
| rateLimiter | `middleware/rateLimiter.ts` | 滑动窗口限流（内存存储，60s 窗口） |
| inputValidator | `middleware/inputValidator.ts` | 输入校验 |

### 错误处理

统一使用 `ApiError` 类处理业务错误:

| HTTP 状态码 | 错误码 | 说明 |
|-------------|--------|------|
| 400 | bad_request | 请求参数错误 |
| 401 | unauthorized | 未登录或登录失效 |
| 403 | forbidden | 无权访问 |
| 404 | not_found | 资源不存在 |
| 422 | validation_error | 数据校验失败 |
| 429 | - | 请求频率超限（由 rateLimiter 返回） |
| 500 | internal_error | 服务器内部错误 |

### 路由模块

| 路由文件 | 挂载路径 | 端点数 |
|----------|----------|--------|
| `routes/bazi.ts` | `/api/bazi` | 1 |
| `routes/analyze.ts` | `/api/analyze` | 2 (GET + POST) |
| `routes/compatibility.ts` | `/api/compatibility` | 1 |
| `routes/auth.ts` | `/api/auth` | 12 |
| `routes/payment.ts` | `/api/payment` | 9 |
| `routes/history.ts` | `/api/history` | 1 |
| `routes/user.ts` | `/api/user` | 1 |
| 健康检查 | `/api/health` | 1 |

---

## 数据库架构

### Supabase 配置

- **数据库**: PostgreSQL 16+
- **认证**: Supabase Auth（邮箱密码 / OTP / OAuth）
- **实时**: 未启用
- **存储**: 未启用（图片使用 格局解析，不持久化）

### 核心数据表

| 表名 | 用途 | 行级安全 |
|------|------|----------|
| `users` | 用户扩展信息 | 已启用 |
| `charts` | 命盘数据 | 已启用 |
| `analysis_history` | 分析历史 | 已启用 |
| `feedback` | 用户反馈 | 已启用 |
| `usage_logs` | 使用日志 | 已启用 |
| `payments` | 支付记录（V1） | 已启用 |
| `orders` | 订单（V1.1） | 已启用 |
| `v11_payments` | 支付流水（V1.1） | 已启用 |
| `refunds` | 退款记录（V1.1） | 已启用 |
| `transactions` | 交易流水（V1.1） | 已启用 |
| `user_profiles` | 用户档案（V1.1） | 已启用 |

### RLS 策略模式

所有业务表启用行级安全（Row Level Security），遵循统一策略模式:

1. **SELECT**: 用户可查看自己的数据，service_role 可查看全部
2. **INSERT**: 仅允许创建自己的数据，service_role 可代为创建
3. **UPDATE**: 仅允许修改自己的数据
4. **DELETE**: 仅所有者或 service_role 可删除

`charts` 表额外支持公开命盘（`is_public = TRUE`）被任意用户读取。

---

## 推演服务架构

### 三引擎切换

推演服务定义在 `src/services/ai/AIService.ts`，采用 Provider 注册模式，支持三个 推演引擎:

```
                    ┌──────────────────┐
                    │   AIService      │
                    │                  │
                    │  default:        │
                    │  supabase-edge   │
                    │                  │
                    │  fallback:       │
                    │  gemini -> openai│
                    └────┬─────────────┘
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
   ┌───────────┐  ┌───────────┐  ┌───────────┐
   │Supabase   │  │  Gemini   │  │  OpenAI   │
   │Edge Fns   │  │  Provider │  │  Provider │
   └───────────┘  └───────────┘  └───────────┘
```

| 引擎 | 标识 | 配置变量 | 优先级 |
|------|------|----------|--------|
| Supabase Edge Functions | `supabase-edge` | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` | 默认（首选） |
| Google Gemini | `gemini` | `VITE_GEMINI_API_KEY` | 第二备选 |
| OpenAI GPT-4o | `openai` | `VITE_OPENAI_API_KEY` | 第三备选 |

### 容错机制

1. 请求按引擎优先级依次尝试
2. 前一引擎抛出异常时自动切换到下一个
3. 所有引擎均失败时抛出 `AIError.ProviderUnavailable`
4. 通过 `healthCheck()` 方法检测各引擎可用性

### Prompt 管理

Prompt 模板定义在 `src/services/ai/prompts/`:

| 文件 | 用途 |
|------|------|
| `bazi.ts` | 八字分析 Prompt |
| `daily.ts` | 每日卦象 Prompt |
| `divination.ts` | 占卜 Prompt |
| `fengshui.ts` | 风水分析 Prompt |

---

## 缓存架构

### 五级缓存体系

缓存模块定义在 `src/lib/cache/`，采用分层缓存策略:

| 级别 | 模块 | TTL | 用途 |
|------|------|-----|------|
| L1 - 会话缓存 | `SessionCache` | 30 分钟 | 用户会话状态、临时数据 |
| L2 - 规则缓存 | `RuleCache` | 1 小时 | 规则引擎计算结果 |
| L3 - 分析缓存 | `AnalysisCache` | 24 小时 | 命理分析结果 |
| L4 - 知识缓存 | `KnowledgeCache` | 永久 | 命理知识库条目 |
| L5 - 卦象缓存 | `HexagramCache` | 永久 | 六十四卦原始数据 |

### 缓存键策略

每级缓存使用独立的键生成函数，确保键的唯一性:

- `AnalysisCache`: `generateAnalysisKey(params)` -> 基于分析参数哈希
- `RuleCache`: `generateRuleKey(params)` -> 基于规则输入哈希
- `HexagramCache`: 按卦名/卦象编号索引

### 缓存管理

- `CacheManager`: 核心缓存管理器，提供通用的 get/set/delete/has 操作
- `CacheReport`: 缓存报告生成器，支持 HTML/JSON 格式导出缓存命中率

---

## 安全架构

### 安全模块

安全工具统一导出在 `src/lib/security/`:

| 模块 | 功能 |
|------|------|
| `csp.ts` | Content Security Policy 策略定义（DEFAULT_CSP / EXPORTED_CSP） |
| `rateLimit.ts` | 客户端限流器（`createRateLimiter`） |
| `inputValidation.ts` | 输入验证（邮箱/手机/日期/时间/性别/房间类型/文件） |
| `headers.ts` | 安全响应头（X-Content-Type-Options, X-Frame-Options 等） |
| `sanitize.ts` | 输出清理（HTML/URL/JSON/文件名编码） |
| `audit.ts` | 安全审计（XSS/CSRF/RateLimit/Input/Output/Secrets/依赖/License） |

### 安全层级

```
请求 -> CSP (浏览器端)
     -> Rate Limiter (滑动窗口, IP+Path 粒度)
     -> Input Validation (服务端参数校验)
     -> AuthGuard (JWT 鉴权)
     -> RLS (数据库行级安全)
     -> Output Sanitize (输出清理)
```

### CSP 策略

Content Security Policy 通过 `DEFAULT_CSP` 常量定义，限制外部资源加载来源，防止 XSS 攻击。

### 限流策略

服务端 `rateLimiter` 中间件:

- 存储方式: 内存 Map（生产环境建议 Redis）
- 窗口大小: 60 秒（可配置）
- 默认上限: 100 次/窗口（可配置）
- 粒度: IP + 路径
- 响应头: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 超限响应: HTTP 429 + JSON 错误体

---

## 目录结构

```
xuanfengmen1/
├── src/
│   ├── components/        # React 组件
│   │   ├── ui/            # 通用 UI 组件 (Button, Card, Modal...)
│   │   ├── business/      # 业务组件 (Bagua, Compass, Taiji...)
│   │   ├── Header.tsx     # 全局头部导航
│   │   ├── Footer.tsx     # 全局底部
│   │   ├── AuthGuard.tsx  # 路由鉴权守卫
│   │   └── ErrorBoundary.tsx
│   ├── config/            # 配置（release.ts）
│   ├── constants/         # 常量（defaultAnalysis.ts）
│   ├── design/            # 设计系统令牌（colors, typography, spacing...）
│   ├── golden/            # 命理黄金案例数据（JSON）
│   ├── hooks/             # 自定义 Hooks
│   │   ├── useAuth.ts     # 认证
│   │   ├── useBazi.ts     # 八字排盘
│   │   ├── useAIAnalysis.ts # AI 分析
│   │   ├── usePayment.ts  # 支付
│   │   ├── useMembership.ts # 会员
│   │   └── ...
│   ├── lib/               # 核心库
│   │   ├── bazi/          # ★ 命理内核 (FROZEN，禁止修改)
│   │   │   ├── calculator.ts
│   │   │   ├── types.ts
│   │   │   ├── solarTerms.ts
│   │   │   ├── qi/        # QI Engine（推理引擎）
│   │   │   ├── rules/     # 规则引擎（格局/十神/五行/喜用/长生/大运/六亲）
│   │   │   ├── shensha/   # 神煞库
│   │   │   ├── knowledge/ # 知识库
│   │   │   ├── pipeline/  # 分析管道
│   │   │   ├── explain/   # 解释引擎
│   │   │   ├── governance/# 治理（冻结/质量门/基线/快照）
│   │   │   ├── __tests__/ # 回归测试（228 tests）
│   │   │   └── ...
│   │   ├── fengshui/      # 风水模块（101 rules, 76 knowledge）
│   │   │   ├── rules/     # 风水规则（按房间类型：卧室/客厅/厨房...）
│   │   │   ├── knowledge/ # 风水知识（色彩/材质/植物/学校/符号...）
│   │   │   ├── spatial/   # 空间关系引擎
│   │   │   ├── floor-plan/# 户型图分析
│   │   │   ├── room-engine/# 房间引擎
│   │   │   ├── score-engine/# 评分引擎
│   │   │   ├── simulation/# 模拟引擎
│   │   │   └── pipeline/  # 分析管道
│   │   ├── cache/         # 五级缓存体系
│   │   ├── core/          # 核心基础（类型/常量/工具）
│   │   ├── business/       # 业务逻辑（支付/会员/积分/优惠券）
│   │   ├── security/       # 安全工具（CSP/限流/验证/审计）
│   │   ├── monitoring/     # 监控（Sentry/GA4）
│   │   ├── analytics/      # 用户行为分析（热力图/追踪器）
│   │   ├── logger/         # 日志
│   │   ├── a11y/           # 无障碍
│   │   ├── seo/            # SEO
│   │   ├── payment/        # 支付集成（微信/支付宝/Stripe）
│   │   ├── profiler/       # 性能分析器
│   │   ├── observability/  # 可观测性（API 追踪/健康仪表盘）
│   │   ├── divination.ts  # 占卜（六爻）
│   │   ├── hexagram.ts    # 六十四卦
│   │   ├── supabase.ts    # Supabase 客户端
│   │   └── database/       # 数据库类型定义
│   ├── pages/              # 页面组件
│   ├── server/            # 后端 API
│   │   ├── index.ts        # Hono 应用入口
│   │   ├── middleware/     # 中间件
│   │   └── routes/         # 路由
│   ├── services/           # 服务层
│   │   └── ai/             # AI 服务
│   │       ├── AIService.ts # AI 服务主类
│   │       ├── providers/  # AI 引擎实现
│   │       ├── prompts/    # Prompt 模板
│   │       └── types.ts    # AI 类型
│   ├── utils/              # 工具函数
│   ├── App.tsx             # 应用根组件
│   └── main.tsx            # 入口文件
├── supabase/
│   ├── functions/          # Edge Functions
│   │   └── analyze-room/   # 房间分析 Edge Function
│   └── migrations/         # 数据库迁移文件
│       ├── 0001_init.sql
│       ├── 20260619112842_create_hexagrams_table.sql
│       ├── 20260619112905_create_daily_hexagrams_table.sql
│       ├── 20260619164507_create_divinations_table.sql
│       ├── 20260621044157_create_fengshui_reports_table.sql
│       └── 20260712000001_v11_orders_payments.sql
├── scripts/               # 工具脚本
├── docs/                  # 文档
├── audit-reports/         # 审计报告
├── coverage-reports/       # 覆盖率报告
├── reports/               # 各类报告
├── dist/                  # 构建产物
├── public/                # 静态资源
├── .env.example            # 环境变量模板
├── package.json            # 项目配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 构建配置
└── vitest.config.ts        # 测试配置
```
