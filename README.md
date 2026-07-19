# 玄风门 (XuanFengMen)

专业八字命理、风水堪测、六爻占卜 智能分析平台

**当前版本：V1.2 Stable**

---

## 项目特点

- **八字命理 V3.1** — 四柱排盘、大运流年、十神分析、格局判断、喜用神推演，228 条回归测试冻结
- **风水堪测** — 智能图片分析 + 101 条风水规则 + 76 条知识库，12 节报告模板
- **六爻占卜** — 铜钱摇卦 / 时间起卦，智能解读
- **推演解读** — OpenAI GPT-4o / Gemini / Supabase Edge 三引擎切换
- **会员体系** — Free / Pro / Master 三级会员，功能权限矩阵
- **支付系统** — 微信支付 / 支付宝 / Stripe SDK，订单 + 退款 + 交易流水
- **安全防护** — CSP + HSTS + Rate Limiter + Input Validator + XSS 防护
- **SEO 优化** — Schema.org (5 种) + Open Graph + Twitter Card + Sitemap + Robots
- **PWA 就绪** — manifest.json + Service Worker 准备
- **可观测性** — Error Boundary + Sentry + GA4 + Clarity + Performance Profiler

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript 6 + Vite 8 |
| 路由 | react-router-dom v7 |
| 样式 | Pure CSS Design System (src/design/) |
| 后端 | Hono 4 (Node.js) |
| 数据库 | Supabase (PostgreSQL + PostgREST + Edge Functions + Auth) |
| 推演 | OpenAI GPT-4o / Gemini 2.0 / Supabase Edge Functions |
| 支付 | 微信支付 / 支付宝 / Stripe |
| 监控 | Sentry + GA4 + Microsoft Clarity |
| 测试 | Vitest + React Testing Library (228 tests) |

## 系统架构

    src/
    ├── lib/bazi/           # 八字命理内核 (FROZEN)
    │   ├── calculator.ts   # 四柱计算
    │   ├── fullReport.ts   # 完整报告
    │   ├── rules/          # 规则引擎 (changsheng, dashun, geju, liuqin, shishen, wuxing, xiyong)
    │   ├── shensha/        # 神煞系统 (13 种)
    │   ├── qi/             # Qi 引擎 (reasoning + detector + plugin)
    │   └── governance/     # 治理框架 (freeze, snapshot, quality gate)
    ├── lib/fengshui/       # 风水堪测
    │   ├── pipeline/       # 10 步分析流水线
    │   ├── rules/          # 101 条规则 (10 个房间类型)
    │   ├── knowledge/       # 76 条知识库 (8 个分类)
    │   ├── spatial/        # 空间关系引擎
    │   ├── room-engine/    # 房间评估引擎
    │   └── score-engine/   # 统一评分引擎
    ├── services/ai/        # AI 服务 (OpenAI/Gemini/Supabase Edge)
    ├── server/             # Hono 后端
    │   ├── routes/         # API 路由 (bazi, auth, payment, analyze, history, compatibility, user)
    │   └── middleware/      # 中间件 (auth, rateLimiter, inputValidator, error)
    ├── hooks/              # React Hooks (useAuth, usePaymentV2, useBazi, useMembership...)
    ├── pages/              # 页面 (Home, BaziInput, BaziChart, FengShui, Analysis, Dashboard, Login...)
    ├── components/         # 组件 (Header, Footer, AuthGuard, ErrorBoundary, UI...)
    ├── lib/security/       # 安全模块 (CSP, Rate Limit, Input Validation, XSS Audit)
    ├── lib/cache/          # 缓存层 (Analysis/Hexagram/Rule/Knowledge/Session Cache)
    ├── lib/monitoring/     # 监控 (Sentry, GA4/Clarity)
    ├── lib/observability/  # 可观测性 (ApiTracer, Health Dashboard)
    ├── lib/profiler/       # 性能分析器
    ├── lib/payment/        # 支付 SDK (WeChat Pay, Alipay, Stripe)
    ├── lib/business/       # 业务逻辑 (Membership, Growth, Refund, Invitation, Coupon, Points)
    ├── lib/database/       # 数据库类型定义
    ├── lib/seo/            # SEO 生成器
    ├── lib/a11y/           # 无障碍审计
    ├── lib/analytics/      # 分析追踪
    ├── design/             # 设计系统 (colors, spacing, typography, shadow, radius, motion)
    └── supabase/migrations/# 数据库迁移 (5 表 + RLS)

## 快速启动

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装

    git clone https://github.com/your-org/xuanfengmen.git
    cd xuanfengmen
    npm install

### 环境变量

复制 `.env.example` 为 `.env.local`，填写真实配置：

    cp .env.example .env.local

必要配置项：
- `VITE_SUPABASE_URL` — Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` — Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase 服务端密钥
- `VITE_OPENAI_API_KEY` — OpenAI API Key（推演解读功能）
- `VITE_GEMINI_API_KEY` — Gemini API Key（可选）

### 开发

    npm run dev       # 启动开发服务器
    npm test          # 运行测试 (228 tests)

### 构建

    npm run build     # 生产构建 (vite build)
    npm run preview   # 预览构建结果

## 部署

### Vercel (推荐)

1. 连接 GitHub 仓库到 Vercel
2. 设置环境变量
3. 构建命令: `npm run build`
4. 输出目录: `dist`

### Supabase

1. 创建 Supabase 项目
2. 执行 `supabase/migrations/` 下的迁移文件
3. 配置 Auth Providers (Email/OTP/OAuth)

### Docker (可选)

    FROM node:18-alpine AS builder
    WORKDIR /app
    COPY package*.json ./
    RUN npm ci
    COPY . .
    RUN npm run build

    FROM nginx:alpine
    COPY --from=builder /app/dist /usr/share/nginx/html
    EXPOSE 80

## 目录结构

    xuanfengmen/
    ├── public/              # 静态资源 (manifest.json, robots.txt, sitemap.xml, og-image.jpg)
    ├── src/                 # 源代码
    │   ├── lib/bazi/       # 八字命理内核 (FROZEN, 不允许修改)
    │   ├── lib/fengshui/   # 风水堪测模块
    │   ├── services/       # AI 服务
    │   ├── server/          # 后端服务
    │   ├── hooks/          # React Hooks
    │   ├── pages/          # 页面
    │   ├── components/     # 组件
    │   ├── lib/            # 工具库
    │   └── design/         # 设计系统
    ├── supabase/           # 数据库迁移
    ├── reports/            # 生产报告 (9 HTML)
    ├── docs/               # 文档
    ├── tests/              # 测试
    ├── .env.example        # 环境变量模板
    ├── tsconfig.json
    ├── vite.config.ts
    └── package.json

## Roadmap

### V1.2 Stable (当前)
- 八字 V3.1 算法冻结
- 风水 101 规则冻结
- 安全防护完成
- 支付架构完成
- 228 回归测试通过
- SEO 优化完成
- PWA 就绪

### V2.0 (规划中)
- 八字精研大师
- 姻缘合盘大师
- 姓名策定
- 择吉择日
- 推演 奇门 / 六壬 / 紫微
- 企业堪舆
- 开放服务平台
- SaaS 运营后台

详见 [ROADMAP_V2.md](./ROADMAP_V2.md)

## 命理算法冻结声明

`src/lib/bazi/` 目录下的所有算法文件已冻结，不允许修改。
- 冻结基线: Git commit `3cf5362`
- 回归测试: 228/228 PASS
- 治理框架: governance/ (freeze, snapshot, quality gate)

详见 [RELEASE_FREEZE.md](./RELEASE_FREEZE.md)

## License

ISC
