# 玄风门部署文档

> 版本: V4.4 | 更新日期: 2026-07-12

---

## 目录

1. [环境要求](#环境要求)
2. [Vercel 部署](#vercel-部署)
3. [Supabase 初始化](#supabase-初始化)
4. [环境变量配置](#环境变量配置)
5. [构建与预览](#构建与预览)
6. [Docker 部署](#docker-部署)
7. [常见问题](#常见问题)

---

## 环境要求

### 本地开发

| 依赖 | 最低版本 | 推荐版本 | 说明 |
|------|----------|----------|------|
| Node.js | >= 18.0.0 | 20.x LTS | JavaScript 运行时 |
| npm | >= 9.0.0 | 10.x | 包管理器 |
| Git | >= 2.30 | 最新 | 版本管理 |

### 生产部署

| 平台 | 要求 |
|------|------|
| Vercel | 支持 Edge Functions，Node.js 18+ 运行时 |
| Supabase | 免费版或 Pro 版，PostgreSQL 16+ |
| Docker | Docker 20+ / Docker Compose 2+ |

---

## Vercel 部署

### 步骤 1: Fork / Clone 仓库

```bash
git clone <repository-url>
cd xuanfengmen1
```

### 步骤 2: 安装依赖

```bash
npm install
```

### 步骤 3: 在 Vercel 创建项目

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择 Git 仓库
4. 配置项目设置

### 步骤 4: 配置构建设置

在 Vercel 项目设置中配置:

| 配置项 | 值 |
|--------|-----|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | 20.x |

### 步骤 5: 配置环境变量

在 Vercel 项目的 Settings -> Environment Variables 中添加所有环境变量（详见 [环境变量配置](#环境变量配置)）。

### 步骤 6: 部署

点击 "Deploy" 即可。Vercel 会自动执行构建和部署。

部署完成后，前端 SPA 将托管在 Vercel 的 CDN 上。后端 API 可通过 Vercel Serverless Functions 部署，或独立部署到 Node.js 环境。

---

## Supabase 初始化

### 步骤 1: 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://app.supabase.com)
2. 点击 "New Project"
3. 选择组织（或创建新组织）
4. 填写项目名称和数据库密码
5. 选择区域（建议选择用户最近的区域，如 Southeast Asia）
6. 点击 "Create new project"

### 步骤 2: 获取连接信息

项目创建完成后，在 Settings -> API 中获取:

- **Project URL**: `VITE_SUPABASE_URL`
- **anon public key**: `VITE_SUPABASE_ANON_KEY`
- **service_role key**: `SUPABASE_SERVICE_ROLE_KEY`

**重要**: `service_role key` 拥有数据库完全访问权限，绝不能暴露到前端代码中。

### 步骤 3: 执行数据库迁移

#### 方式 A: 通过 Supabase SQL Editor

1. 在 Supabase Dashboard 中打开 SQL Editor
2. 按文件名顺序依次执行迁移文件:
   - `supabase/migrations/0001_init.sql`（核心数据模型: users, charts, analysis_history, feedback, usage_logs, payments）
   - `supabase/migrations/20260619112842_create_hexagrams_table.sql`（六十四卦表）
   - `supabase/migrations/20260619112905_create_daily_hexagrams_table.sql`（每日卦象表）
   - `supabase/migrations/20260619164507_create_divinations_table.sql`（占卜表）
   - `supabase/migrations/20260621044157_create_fengshui_reports_table.sql`（风水报告表）
   - `supabase/migrations/20260712000001_v11_orders_payments.sql`（V1.1 订单支付表: orders, v11_payments, refunds, transactions, user_profiles）

#### 方式 B: 通过 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录
supabase login

# 关联项目
supabase link --project-ref <your-project-id>

# 推送迁移
supabase db push
```

### 步骤 4: 配置认证

1. 进入 Authentication -> Providers
2. **Email**: 确认已启用，开启 "Confirm email" 或关闭（开发阶段可关闭）
3. **Email OTP**: 在 Email -> Enable Email OTP 开启邮箱验证码登录
4. **Google**: 
   - 启用 Google Provider
   - 填入 Google Cloud Console 获取的 Client ID 和 Client Secret
   - 设置 Callback URL: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
5. **Apple**: 
   - 启用 Apple Provider
   - 填入 Apple Developer 获取的 Service ID 和 Private Key
6. **WeChat**: 
   - 微信 OAuth 尚未完全接入（后端路由已预留）
   - 需配置微信开放平台 AppID 和 AppSecret

### 步骤 5: 验证部署

访问 Supabase Dashboard -> Table Editor，确认以下表已创建:

- users, charts, analysis_history, feedback, usage_logs, payments
- orders, v11_payments, refunds, transactions, user_profiles

---

## 环境变量配置

### 完整 .env.example

```bash
# Supabase（必需）
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI 服务（必需至少配置一个）
VITE_OPENAI_API_KEY=your_openai_key
VITE_GEMINI_API_KEY=your_gemini_key

# 服务端（可选）
SERVER_PORT=3001
NODE_ENV=production

# 管理员（可选）
ADMIN_SECRET=your_admin_secret
JWT_SECRET=your_jwt_secret

# 监控（可选）
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_CLARITY_PROJECT_ID=your_clarity_project_id
```

### 变量获取方式

| 变量 | 获取方式 |
|------|----------|
| `VITE_SUPABASE_URL` | Supabase Dashboard -> Settings -> API -> Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard -> Settings -> API -> anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard -> Settings -> API -> service_role |
| `VITE_OPENAI_API_KEY` | OpenAI Platform -> API Keys |
| `VITE_GEMINI_API_KEY` | Google AI Studio -> Get API Key |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics -> Admin -> Data Streams -> Measurement ID |
| `VITE_CLARITY_PROJECT_ID` | Microsoft Clarity -> Settings -> Project ID |

---

## 构建与预览

### 本地开发

```bash
# 安装依赖
npm install

# 启动前端开发服务器（Vite，端口 3000）
npm run dev

# 启动后端 API 服务（Hono，端口 3001）
npm run server:dev
```

### 构建

```bash
# TypeScript 类型检查 + Vite 构建
npm run build
```

构建产物输出到 `dist/` 目录。

### 预览

```bash
# 预览构建产物
npm run preview
```

### 运行测试

```bash
# 运行全部测试（228 个回归测试）
npm run test

# 监听模式运行测试
npm run test:watch
```

### 发布检查

```bash
# 发布前检查
npm run release-check
```

---

## Docker 部署

### Dockerfile

```dockerfile
# 阶段 1: 安装依赖
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# 阶段 2: 构建
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx tsc && npx vite build

# 阶段 3: 生产运行
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 复制构建产物
COPY --from=builder /app/dist ./dist

# 复制生产依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制服务端代码
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/lib ./src/lib
COPY --from=builder /app/src/services ./src/services
COPY --from=builder /app/src/utils ./src/utils
COPY --from=builder /app/package.json ./

# 安装 tsx 用于运行 TypeScript
RUN npm install tsx --no-save

EXPOSE 3001

CMD ["node", "--import", "tsx", "src/server/index.ts"]
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
      - VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - VITE_OPENAI_API_KEY=${VITE_OPENAI_API_KEY}
      - VITE_GEMINI_API_KEY=${VITE_GEMINI_API_KEY}
      - SERVER_PORT=3001
    env_file:
      - .env.production
    restart: unless-stopped

  # 静态文件服务（可选，用于直接提供前端资源）
  static:
    image: nginx:alpine
    ports:
      - "3000:80"
    volumes:
      - ./dist:/usr/share/nginx/html:ro
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - app
```

### 构建和运行

```bash
# 构建镜像
docker build -t xuanfengmen .

# 运行容器
docker run -d \
  --name xuanfengmen \
  -p 3001:3001 \
  -e VITE_SUPABASE_URL=your_url \
  -e VITE_SUPABASE_ANON_KEY=your_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_service_key \
  xuanfengmen

# 使用 Docker Compose
docker-compose up -d
```

---

## 常见问题

### Q1: 构建时 TypeScript 报错 "Cannot find module"

**原因**: 路径别名 `@/` 未正确解析。

**解决方案**: 确认 `tsconfig.json` 中配置了 `"paths": { "@/*": ["./src/*"] }`，`vite.config.ts` 中配置了 `resolve.alias`。运行前先清理缓存:

```bash
rm -rf node_modules/.vite
npm run build
```

### Q2: Supabase 迁移失败 "relation already exists"

**原因**: 迁移文件已执行过，重复执行会报错。

**解决方案**: Supabase SQL Editor 中检查表是否已存在。如需重新执行，先手动删除已有表，再运行迁移。或在 SQL Editor 中使用 `CREATE TABLE IF NOT EXISTS` 语法（项目中已使用）。

### Q3: API 返回 "缺少 Supabase 环境变量配置"

**原因**: 环境变量未正确加载。

**解决方案**: 
1. 确认项目根目录有 `.env` 文件
2. 确认变量名与 `.env.example` 完全一致（注意 `VITE_` 前缀）
3. Vercel 部署时检查 Settings -> Environment Variables 是否已配置
4. 重启开发服务器

### Q4: 微信/支付宝支付回调验签失败

**原因**: 回调验签逻辑尚未完全实现（当前代码中有 TODO 标记）。

**解决方案**: 当前支付回调为占位实现，生产环境需要:
1. 配置微信支付商户证书
2. 实现微信支付回调的 AES-256-GCM 解密
3. 配置支付宝公钥验签
4. 配置 Stripe Webhook Secret

### Q5: 测试失败 "228 tests failed"

**原因**: 命理内核的 228 个回归测试是冻结的，不应修改也不应失败。

**解决方案**: 
1. 确认未修改 `src/lib/bazi/` 下的任何代码
2. 如果意外修改，执行 `git checkout -- src/lib/bazi/` 恢复
3. 运行 `npm run test` 确认全部通过后再提交
4. 如确需修改命理内核，必须先提交架构变更提案并通过审批
