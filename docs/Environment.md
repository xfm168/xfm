# 玄风门环境变量文档

> 版本: V4.4 | 更新日期: 2026-07-12

---

## 目录

1. [必需环境变量](#必需环境变量)
2. [可选环境变量](#可选环境变量)
3. [完整 .env.example](#完整-envexample)
4. [不同环境配置建议](#不同环境配置建议)
5. [安全注意事项](#安全注意事项)

---

## 必需环境变量

以下环境变量是系统运行所必需的，缺少任一将导致核心功能不可用。

### VITE_SUPABASE_URL

| 属性 | 值 |
|------|-----|
| 说明 | Supabase 项目 URL |
| 类型 | string (URL) |
| 示例 | `https://abcxyz.supabase.co` |
| 使用位置 | 前端 Supabase 客户端初始化、后端 Auth 中间件、后端所有路由的数据库操作 |
| 获取方式 | Supabase Dashboard -> Settings -> API -> Project URL |
| 前缀说明 | `VITE_` 前缀使变量在 Vite 构建时被注入前端代码，同时也被后端代码引用 |

### VITE_SUPABASE_ANON_KEY

| 属性 | 值 |
|------|-----|
| 说明 | Supabase 匿名（公开）密钥 |
| 类型 | string (JWT) |
| 示例 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| 使用位置 | 前端 Supabase 客户端初始化、后端 Auth 中间件（anon client 的 signInWithPassword）、后端 OTP/Google/Apple 登录 |
| 获取方式 | Supabase Dashboard -> Settings -> API -> anon public |
| 安全性 | 此密钥设计为公开安全的，受 Supabase RLS 策略保护。可安全暴露到前端。 |

### SUPABASE_SERVICE_ROLE_KEY

| 属性 | 值 |
|------|-----|
| 说明 | Supabase 服务端管理密钥，拥有数据库完全访问权限（绕过 RLS） |
| 类型 | string (JWT) |
| 示例 | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| 使用位置 | 后端所有路由（通过 `getSupabaseAdmin()` 函数创建 admin client）、用户注册、支付订单创建、历史记录查询等 |
| 获取方式 | Supabase Dashboard -> Settings -> API -> service_role |
| 安全性 | **极高敏感**。绝不能暴露到前端。无 `VITE_` 前缀，因此不会被打包到前端。仅服务端使用。 |

### VITE_OPENAI_API_KEY

| 属性 | 值 |
|------|-----|
| 说明 | Open开放服务平台 密钥 |
| 类型 | string |
| 示例 | `sk-proj-abc123...` |
| 使用位置 | `src/services/ai/providers/openai.ts` - OpenAI GPT-4o 调用 |
| 获取方式 | [OpenAI Platform](https://platform.openai.com/api-keys) -> API Keys -> Create new secret key |
| 默认值 | 无（未配置时 OpenAI Provider 不会被注册） |

### VITE_GEMINI_API_KEY

| 属性 | 值 |
|------|-----|
| 说明 | Google Gemini API 密钥 |
| 类型 | string |
| 示例 | `AIzaSyB...` |
| 使用位置 | `src/services/ai/providers/gemini.ts` - Gemini 模型调用 |
| 获取方式 | [Google AI Studio](https://aistudio.google.com/app/apikey) -> Get API Key |
| 默认值 | 无（未配置时 Gemini Provider 不会被注册） |

### SERVER_PORT

| 属性 | 值 |
|------|-----|
| 说明 | 后端 API 服务端口 |
| 类型 | number (string) |
| 默认值 | `3001` |
| 使用位置 | `src/server/index.ts` - Node HTTP 服务启动端口 |
| 说明 | 通过 `Number(process.env.PORT) || 3001` 读取 |

### NODE_ENV

| 属性 | 值 |
|------|-----|
| 说明 | Node.js 运行环境标识 |
| 类型 | string |
| 默认值 | `production` |
| 可选值 | `"development"` / `"production"` / `"test"` / `"staging"` |
| 使用位置 | 构建工具、日志级别、错误详情展示 |
| 说明 | Vite 构建时 `import.meta.env.DEV` / `import.meta.env.PROD` 由 NODE_ENV 决定 |

### ADMIN_SECRET

| 属性 | 值 |
|------|-----|
| 说明 | 管理员密钥，用于内部管理场景的 API 访问控制 |
| 类型 | string |
| 默认值 | 无（强烈建议设置） |
| 使用位置 | `src/server/middleware/auth.ts` - `createAdminToken()` 函数签名密钥 |
| 安全性 | **高敏感**。用于 JWT 签名。无 `VITE_` 前缀。 |

### JWT_SECRET

| 属性 | 值 |
|------|-----|
| 说明 | JWT 签名密钥 |
| 类型 | string |
| 默认值 | `default-secret-change-me`（必须修改！） |
| 使用位置 | `src/server/middleware/auth.ts` - `createAdminToken()` 函数中生成管理员 JWT 的签名密钥 |
| 安全性 | **高敏感**。默认值 `default-secret-change-me` 仅用于开发，生产环境必须替换为随机强密钥。无 `VITE_` 前缀。 |

> 注意: `JWT_SECRET` 在 `createAdminToken()` 中有默认值 `default-secret-change-me`，即使环境变量未设置也能运行。但生产环境必须显式设置为强随机值，否则 JWT 可被伪造。

---

## 可选环境变量

以下环境变量用于增强功能，缺失时系统仍可正常运行。

### VITE_GA_MEASUREMENT_ID

| 属性 | 值 |
|------|-----|
| 说明 | Google Analytics 4 测量 ID |
| 类型 | string |
| 示例 | `G-XXXXXXXXXX` |
| 使用位置 | `src/lib/monitoring/analytics.ts` - Google Analytics 4 事件追踪 |
| 获取方式 | Google Analytics -> Admin -> Data Streams -> Measurement ID |
| 默认行为 | 未配置时 GA4 追踪不启用 |

### VITE_CLARITY_PROJECT_ID

| 属性 | 值 |
|------|-----|
| 说明 | Microsoft Clarity 项目 ID |
| 类型 | string |
| 示例 | `clarity-project-id` |
| 使用位置 | `src/lib/monitoring/analytics.ts` - Clarity 热力图和会话记录 |
| 获取方式 | [Microsoft Clarity](https://clarity.microsoft.com/) -> Settings -> Project ID |
| 默认行为 | 未配置时 Clarity 不启用 |

### ADMIN_SECRET

| 属性 | 值 |
|------|-----|
| 说明 | 管理员操作密钥 |
| 类型 | string |
| 默认值 | 无 |
| 使用位置 | 管理员 API 端点的访问验证 |
| 默认行为 | 未配置时管理员功能不可用或使用弱验证 |

### JWT_SECRET

| 属性 | 值 |
|------|-----|
| 说明 | JWT 令牌签名密钥 |
| 类型 | string |
| 默认值 | `default-secret-change-me` |
| 使用位置 | `src/server/middleware/auth.ts` |
| 默认行为 | 使用默认值（仅限开发环境） |

---

## 完整 .env.example

项目根目录 `.env.example` 文件内容:

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI
VITE_OPENAI_API_KEY=your_openai_key
VITE_GEMINI_API_KEY=your_gemini_key

# Server
SERVER_PORT=3000
NODE_ENV=production

# Admin
ADMIN_SECRET=your_admin_secret
JWT_SECRET=your_jwt_secret
```

**使用方法**: 复制 `.env.example` 为 `.env`，填入实际值:

```bash
cp .env.example .env
```

---

## 不同环境配置建议

### 开发环境 (development)

```bash
# Supabase - 使用本地或开发项目
VITE_SUPABASE_URL=https://dev-abcxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...（开发项目 anon key）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...（开发项目 service_role key）

# AI - 使用测试密钥或较低额度密钥
VITE_OPENAI_API_KEY=sk-proj-dev-abc123
VITE_GEMINI_API_KEY=AIzaSyB-dev-key

# Server
SERVER_PORT=3001
NODE_ENV=development

# Admin - 开发环境可用弱密钥
ADMIN_SECRET=dev-admin-secret-123
JWT_SECRET=dev-jwt-secret-123

# 监控 - 通常不启用
# VITE_GA_MEASUREMENT_ID=
# VITE_CLARITY_PROJECT_ID=
```

**开发环境特点**:

- 服务端 Auth 中间件有 dev-user fallback（任何 token 都会被放行为 dev-user）
- 这是有意为之的便利机制，但必须在生产环境移除
- 日志级别更详细，错误堆栈完整输出
- Vite 开发服务器端口 3000，API 服务端口 3001

### 预发布环境 (staging)

```bash
# Supabase - 使用独立的 staging 项目
VITE_SUPABASE_URL=https://staging-abcxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...（staging anon key）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...（staging service_role key）

# AI - 使用生产密钥（与生产共用以验证行为一致性）
VITE_OPENAI_API_KEY=sk-proj-prod-abc123
VITE_GEMINI_API_KEY=AIzaSyB-prod-key

# Server
SERVER_PORT=3001
NODE_ENV=staging

# Admin - 使用与生产不同但同样强度的密钥
ADMIN_SECRET=<随机生成 32+ 字符>
JWT_SECRET=<随机生成 32+ 字符>

# 监控 - 可启用测试追踪
VITE_GA_MEASUREMENT_ID=G-STAGING_ID
VITE_CLARITY_PROJECT_ID=staging-clarity-id
```

**预发布环境特点**:

- 应移除 dev-user fallback 或添加 staging-specific 鉴权
- 数据使用 staging 数据库（与生产隔离）
- 应执行完整测试套件（228 个回归测试）
- 构建使用 `npm run build`（与生产相同）

### 生产环境 (production)

```bash
# Supabase - 生产项目
VITE_SUPABASE_URL=https://prod-abcxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...（生产 anon key）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...（生产 service_role key）

# AI - 生产密钥
VITE_OPENAI_API_KEY=sk-proj-<强密钥>
VITE_GEMINI_API_KEY=AIzaSyB-<强密钥>

# Server
SERVER_PORT=3001
NODE_ENV=production

# Admin - 生产强密钥
ADMIN_SECRET=<随机生成 64+ 字符强密钥>
JWT_SECRET=<随机生成 64+ 字符强密钥>

# 监控
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_CLARITY_PROJECT_ID=<clarity-project-id>
```

**生产环境要求**:

1. **必须移除** dev-user fallback（`src/server/middleware/auth.ts` 中标注 WARNING 的代码段）
2. 所有密钥使用强随机值（建议 32 字符以上）
3. CORS 配置应限制 origin 为实际域名
4. 启用所有监控（Sentry + GA4 + Clarity）
5. 限流器建议迁移到 Redis 存储（当前为内存存储）

---

## 安全注意事项

### 变量前缀规则

| 前缀 | 行为 | 示例 |
|------|------|------|
| `VITE_` | Vite 构建时注入前端代码，**会暴露到浏览器** | `VITE_SUPABASE_URL`, `VITE_OPENAI_API_KEY` |
| 无前缀 | 仅服务端可用，不会打包到前端 | `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` |

### 安全分级

| 级别 | 变量 | 原因 |
|------|------|------|
| **极高敏感** | `SUPABASE_SERVICE_ROLE_KEY` | 可绕过 RLS 完全访问数据库 |
| **极高敏感** | `JWT_SECRET` | 可伪造管理员 JWT |
| **高敏感** | `ADMIN_SECRET` | 管理员操作权限 |
| **中敏感** | `VITE_OPENAI_API_KEY` | API 调用计费，有额度限制 |
| **中敏感** | `VITE_GEMINI_API_KEY` | API 调用计费，有额度限制 |
| **低敏感** | `VITE_SUPABASE_URL` | 公开信息 |
| **低敏感** | `VITE_SUPABASE_ANON_KEY` | 设计为公开安全（受 RLS 保护） |

### 最佳实践

1. **永远不要** 将 `.env` 文件提交到 Git（已在 `.gitignore` 中排除）
2. **永远不要** 在前端代码中使用无 `VITE_` 前缀的环境变量（不会被注入）
3. Vercel 部署时使用 Vercel Dashboard 的 Environment Variables 功能配置，不要在代码中硬编码
4. 定期轮换 API 密钥
5. 不同环境使用不同密钥，禁止开发/生产共用密钥
