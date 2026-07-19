# 玄风门数据库文档

> 版本: V4.4 | 更新日期: 2026-07-12
> 数据库: Supabase PostgreSQL 16+
> 迁移文件: `supabase/migrations/`

---

## 目录

1. [Supabase 项目配置](#supabase-项目配置)
2. [核心表结构（V1 初始迁移）](#核心表结构v1-初始迁移)
3. [V1.1 订单支付表](#v11-订单支付表)
4. [索引汇总](#索引汇总)
5. [RLS 策略说明](#rls-策略说明)
6. [迁移文件与执行方式](#迁移文件与执行方式)
7. [数据库设计决策](#数据库设计决策)

---

## Supabase 项目配置

### 服务概览

| 服务 | 配置 | 状态 |
|------|------|------|
| PostgreSQL | 自动托管，版本 16+ | 已启用 |
| Auth | 邮箱密码 + OTP + Google + Apple | 已启用 |
| Realtime | WebSocket 实时订阅 | 未启用 |
| Storage | 文件存储 | 未启用 |
| Edge Functions | TypeScript 函数 | 已部署（analyze-room） |
| Row Level Security | 行级安全策略 | 全部启用 |

### 认证配置

| Provider | 状态 | 说明 |
|----------|------|------|
| Email/Password | 已启用 | 支持 `signInWithPassword` |
| Email OTP | 已启用 | 支持 `signInWithOtp` + `verifyOtp` |
| Google OAuth | 已启用 | 通过 `signInWithIdToken` |
| Apple OAuth | 已启用 | 通过 `signInWithIdToken` |
| WeChat OAuth | 预留 | 后端路由已预留，尚未接入 |

---

## 核心表结构（V1 初始迁移）

迁移文件: `supabase/migrations/0001_init.sql`

### 1. users 表

用户扩展信息表，关联 Supabase `auth.users`。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | 关联 auth.users |
| `username` | TEXT | UNIQUE | 用户名 |
| `avatar_url` | TEXT | - | 头像 URL |
| `membership_tier` | TEXT | DEFAULT 'free', CHECK IN ('free','basic','premium','vip') | 会员等级（V1 枚举） |
| `membership_expires_at` | TIMESTAMPTZ | - | 会员到期时间 |
| `total_charts` | INTEGER | DEFAULT 0 | 总排盘次数 |
| `total_analyses` | INTEGER | DEFAULT 0 | 总分析次数 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), 自动触发器更新 | 更新时间 |

**RLS 策略**:
- `users_select_own_or_admin`: SELECT - `auth.uid() = id OR service_role`
- `users_insert_own`: INSERT - `auth.uid() = id`
- `users_update_own`: UPDATE - `auth.uid() = id`

**索引**: `idx_users_membership` ON (membership_tier, membership_expires_at)

> 注: V1.1 引入 `user_profiles` 表后，新用户创建使用 `user_profiles` 而非此表。此表保留兼容。

---

### 2. charts 表

命盘数据表，存储用户输入的出生信息和排盘计算结果。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 命盘 ID |
| `user_id` | UUID | REFERENCES users(id) ON DELETE CASCADE | 所属用户 |
| `name` | TEXT | - | 命盘名称（如"张三的八字"） |
| `birth_date` | DATE | NOT NULL | 公历出生日期 |
| `birth_time` | TEXT | NOT NULL | 出生时间，"HH:MM" 格式 |
| `birth_time_unknown` | BOOLEAN | DEFAULT FALSE | 是否未知时辰 |
| `gender` | TEXT | NOT NULL, CHECK IN ('male','female') | 性别 |
| `birthplace` | TEXT | - | 出生地 |
| `timezone` | TEXT | - | 时区 |
| `latitude` | NUMERIC(10,7) | - | 纬度 |
| `longitude` | NUMERIC(10,7) | - | 经度 |
| `zishi_strategy` | TEXT | DEFAULT 'late', CHECK IN ('late','early','gregorian') | 子时策略 |
| `use_solar_time` | BOOLEAN | DEFAULT TRUE | 是否使用真太阳时 |
| `chart_data` | JSONB | NOT NULL | 完整 BaZiChart 排盘结果 |
| `chart_meta` | JSONB | - | 元数据（strategy, snapshot_version 等） |
| `is_public` | BOOLEAN | DEFAULT FALSE | 是否公开 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), 自动触发器更新 | 更新时间 |

**RLS 策略**:
- `charts_select_owner_or_public`: SELECT - `user_id = auth.uid() OR is_public = TRUE OR service_role`
- `charts_insert_own`: INSERT - `user_id = auth.uid() OR service_role`
- `charts_update_own`: UPDATE - `user_id = auth.uid()`
- `charts_delete_own`: DELETE - `user_id = auth.uid() OR service_role`

**索引**:
- `idx_charts_user_created` ON (user_id, created_at DESC)
- `idx_charts_public` ON (is_public, created_at DESC) WHERE is_public = TRUE

---

### 3. analysis_history 表

分析历史表，记录用户的分析请求和结果。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 分析记录 ID |
| `user_id` | UUID | REFERENCES users(id) ON DELETE CASCADE | 所属用户 |
| `chart_id` | UUID | REFERENCES charts(id) ON DELETE CASCADE | 关联命盘 |
| `analysis_type` | TEXT | NOT NULL, CHECK IN ('basic','full','ai','compatibility') | 分析类型 |
| `result` | JSONB | NOT NULL | 分析结果 |
| `ai_model` | TEXT | - | AI 模型名称（如 'gpt-4o'） |
| `ai_tokens_used` | INTEGER | - | AI 消耗 token 数 |
| `duration_ms` | INTEGER | - | 分析耗时（毫秒） |
| `status` | TEXT | DEFAULT 'completed', CHECK IN ('pending','processing','completed','failed') | 状态 |
| `error_message` | TEXT | - | 错误信息 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

**RLS 策略**:
- `analysis_select_own_or_admin`: SELECT - `user_id = auth.uid() OR service_role`
- `analysis_insert_own`: INSERT - `user_id = auth.uid() OR service_role`
- `analysis_update_own`: UPDATE - `user_id = auth.uid()`
- `analysis_delete_own`: DELETE - `user_id = auth.uid() OR service_role`

**索引**:
- `idx_analysis_user_created` ON (user_id, created_at DESC)
- `idx_analysis_chart` ON (chart_id, created_at DESC)
- `idx_analysis_status` ON (status, created_at DESC)

---

### 4. feedback 表

用户反馈表。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 反馈 ID |
| `user_id` | UUID | REFERENCES users(id) ON DELETE SET NULL | 提交用户 |
| `chart_id` | UUID | REFERENCES charts(id) ON DELETE SET NULL | 关联命盘 |
| `type` | TEXT | NOT NULL, CHECK IN ('bug','feature','accuracy','other') | 反馈类型 |
| `severity` | TEXT | DEFAULT 'normal', CHECK IN ('low','normal','high','critical') | 严重程度 |
| `title` | TEXT | NOT NULL | 标题 |
| `content` | TEXT | NOT NULL | 内容 |
| `contact` | TEXT | - | 联系方式 |
| `status` | TEXT | DEFAULT 'open', CHECK IN ('open','processing','resolved','closed') | 处理状态 |
| `resolved_at` | TIMESTAMPTZ | - | 解决时间 |
| `resolved_by` | UUID | REFERENCES users(id) | 解决人 |
| `resolution` | TEXT | - | 解决方案 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), 自动触发器更新 | 更新时间 |

**RLS 策略**:
- `feedback_select_own_or_admin`: SELECT - `user_id = auth.uid() OR service_role`
- `feedback_insert_own`: INSERT - `user_id IS NULL OR user_id = auth.uid()`
- `feedback_update_admin`: UPDATE - `service_role` only
- `feedback_delete_admin`: DELETE - `service_role` only

**索引**:
- `idx_feedback_status_created` ON (status, created_at DESC)
- `idx_feedback_user` ON (user_id, created_at DESC)

---

### 5. usage_logs 表

使用日志表，记录 API 调用、推演调用等用量信息。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | BIGSERIAL | PRIMARY KEY | 自增 ID |
| `user_id` | UUID | REFERENCES users(id) ON DELETE SET NULL | 用户 |
| `action` | TEXT | NOT NULL | 操作类型（'chart_create','analysis','ai_call' 等） |
| `resource_type` | TEXT | - | 资源类型 |
| `resource_id` | UUID | - | 资源 ID |
| `ip_address` | INET | - | IP 地址 |
| `user_agent` | TEXT | - | 用户代理 |
| `metadata` | JSONB | - | 元数据 |
| `tokens_used` | INTEGER | DEFAULT 0 | AI token 消耗 |
| `cost_cents` | INTEGER | DEFAULT 0 | 成本（分） |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |

**RLS 策略**:
- `usage_logs_select_own_or_admin`: SELECT - `user_id = auth.uid() OR service_role`
- `usage_logs_insert_admin`: INSERT - `service_role` only（由服务端写入）

**索引**:
- `idx_usage_logs_user_created` ON (user_id, created_at DESC)
- `idx_usage_logs_action_created` ON (action, created_at DESC)

---

### 6. payments 表（V1 预留）

V1 阶段的支付记录表。V1.1 引入 `orders` + `v11_payments` 后，此表保留但不再作为主要支付表使用。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 支付记录 ID |
| `user_id` | UUID | REFERENCES users(id) ON DELETE RESTRICT | 用户 |
| `order_no` | TEXT | UNIQUE NOT NULL | 订单号 |
| `product_type` | TEXT | NOT NULL, CHECK IN ('membership','report','addon','credits') | 产品类型 |
| `product_id` | TEXT | - | 产品 ID |
| `amount_cents` | INTEGER | NOT NULL | 金额（分） |
| `currency` | TEXT | DEFAULT 'CNY' | 币种 |
| `payment_method` | TEXT | - | 支付方式 |
| `payment_provider_order_id` | TEXT | - | 支付平台订单 ID |
| `payment_provider_transaction_id` | TEXT | - | 支付平台交易 ID |
| `paid_at` | TIMESTAMPTZ | - | 支付时间 |
| `status` | TEXT | DEFAULT 'pending', CHECK IN ('pending','paid','failed','refunded','cancelled') | 状态 |
| `metadata` | JSONB | - | 元数据 |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW(), 自动触发器更新 | 更新时间 |

---

## V1.1 订单支付表

迁移文件: `supabase/migrations/20260712000001_v11_orders_payments.sql`

### 7. orders 表

订单表，记录用户购买的产品订单。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 订单 ID |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | 用户 |
| `order_no` | TEXT | NOT NULL UNIQUE | 订单号（格式: XF + 时间戳 + 随机码） |
| `product_type` | TEXT | NOT NULL, CHECK IN ('membership','report','addon','credits') | 产品类型 |
| `product_id` | TEXT | - | 产品 ID（如 'pro', 'master', 'basic' 等） |
| `product_name` | TEXT | NOT NULL | 产品显示名称 |
| `amount_cents` | INTEGER | NOT NULL, CHECK > 0 | 原价（分） |
| `discount_cents` | INTEGER | NOT NULL DEFAULT 0 | 折扣金额（分） |
| `final_amount_cents` | INTEGER | NOT NULL, CHECK > 0 | 实付金额（分） |
| `currency` | TEXT | NOT NULL DEFAULT 'CNY' | 币种 |
| `payment_method` | TEXT | CHECK IN ('wechat','alipay','stripe','free') | 支付方式 |
| `status` | TEXT | NOT NULL DEFAULT 'pending', CHECK IN ('pending','paid','cancelled','expired','refunded') | 订单状态 |
| `paid_at` | TIMESTAMPTZ | - | 支付时间 |
| `expires_at` | TIMESTAMPTZ | NOT NULL | 超时时间（创建后 30 分钟） |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 更新时间 |

**RLS 策略**:
- "Users can read own orders": SELECT - `auth.uid() = user_id`
- "Users can insert own orders": INSERT - `auth.uid() = user_id`
- "Users can update own orders": UPDATE - `auth.uid() = user_id`

---

### 8. v11_payments 表

支付流水表，记录每笔支付的详细信息。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 支付记录 ID |
| `order_id` | UUID | NOT NULL, REFERENCES orders(id) ON DELETE CASCADE | 关联订单 |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | 用户 |
| `payment_method` | TEXT | NOT NULL, CHECK IN ('wechat','alipay','stripe') | 支付方式 |
| `provider_payment_id` | TEXT | - | 支付平台交易 ID |
| `provider_order_id` | TEXT | - | 支付平台订单 ID |
| `amount_cents` | INTEGER | NOT NULL | 支付金额（分） |
| `currency` | TEXT | NOT NULL DEFAULT 'CNY' | 币种 |
| `status` | TEXT | NOT NULL DEFAULT 'pending', CHECK IN ('pending','processing','success','failed','expired') | 支付状态 |
| `paid_at` | TIMESTAMPTZ | - | 支付时间 |
| `error_message` | TEXT | - | 错误信息 |
| `metadata` | JSONB | DEFAULT '{}' | 元数据（存储原始回调数据） |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 更新时间 |

**RLS 策略**:
- "Users can read own payments": SELECT - `auth.uid() = user_id`
- "Users can insert own payments": INSERT - `auth.uid() = user_id`

---

### 9. refunds 表

退款记录表。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 退款记录 ID |
| `payment_id` | UUID | NOT NULL, REFERENCES v11_payments(id) ON DELETE CASCADE | 关联支付记录 |
| `order_id` | UUID | NOT NULL, REFERENCES orders(id) ON DELETE CASCADE | 关联订单 |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | 用户 |
| `refund_no` | TEXT | NOT NULL UNIQUE | 退款号（格式: RF + 时间戳 + 随机码） |
| `amount_cents` | INTEGER | NOT NULL, CHECK > 0 | 退款金额（分） |
| `reason` | TEXT | NOT NULL | 退款原因 |
| `status` | TEXT | NOT NULL DEFAULT 'pending', CHECK IN ('pending','processing','success','failed') | 退款状态 |
| `processed_at` | TIMESTAMPTZ | - | 处理时间 |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 更新时间 |

**RLS 策略**:
- "Users can read own refunds": SELECT - `auth.uid() = user_id`
- "Users can insert own refunds": INSERT - `auth.uid() = user_id`

---

### 10. transactions 表

交易流水表（账本），记录所有资金变动。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | 交易 ID |
| `user_id` | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | 用户 |
| `type` | TEXT | NOT NULL, CHECK IN ('payment','refund','credits_purchase','credits_spend','points_earn','points_spend','invitation_reward') | 交易类型 |
| `amount_cents` | INTEGER | NOT NULL | 金额（分） |
| `balance_after` | INTEGER | NOT NULL | 交易后余额 |
| `reference_id` | TEXT | NOT NULL | 关联 ID（订单/退款/积分等） |
| `description` | TEXT | NOT NULL | 交易描述 |
| `metadata` | JSONB | DEFAULT '{}' | 元数据 |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 创建时间 |

**RLS 策略**:
- "Users can read own transactions": SELECT - `auth.uid() = user_id`

---

### 11. user_profiles 表

用户档案表（V1.1），包含用户扩展信息和业务状态。

| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | 关联 auth.users |
| `display_name` | TEXT | - | 显示名称 |
| `avatar_url` | TEXT | - | 头像 URL |
| `membership_tier` | TEXT | NOT NULL DEFAULT 'free', CHECK IN ('free','pro','master') | 会员等级（V1.1 枚举） |
| `membership_expires_at` | TIMESTAMPTZ | - | 会员到期时间 |
| `points_balance` | INTEGER | NOT NULL DEFAULT 0 | 积分余额 |
| `total_spent_cents` | INTEGER | NOT NULL DEFAULT 0 | 累计消费（分） |
| `total_charts` | INTEGER | NOT NULL DEFAULT 0 | 总排盘次数 |
| `total_analyses` | INTEGER | NOT NULL DEFAULT 0 | 总分析次数 |
| `invitation_code` | TEXT | UNIQUE | 邀请码（6 位随机大写字母+数字） |
| `invited_by` | UUID | REFERENCES auth.users(id) | 邀请人 |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() | 更新时间 |

**RLS 策略**:
- "Users can read own profile": SELECT - `auth.uid() = id`
- "Users can update own profile": UPDATE - `auth.uid() = id`

---

## 索引汇总

### V1 迁移索引

| 索引名 | 表 | 列 | 说明 |
|--------|-----|-----|------|
| `idx_users_membership` | users | (membership_tier, membership_expires_at) | 会员等级查询 |
| `idx_charts_user_created` | charts | (user_id, created_at DESC) | 用户命盘列表 |
| `idx_charts_public` | charts | (is_public, created_at DESC) WHERE is_public = TRUE | 公开命盘列表（部分索引） |
| `idx_analysis_user_created` | analysis_history | (user_id, created_at DESC) | 用户分析历史 |
| `idx_analysis_chart` | analysis_history | (chart_id, created_at DESC) | 命盘关联分析 |
| `idx_analysis_status` | analysis_history | (status, created_at DESC) | 按状态筛选分析 |
| `idx_feedback_status_created` | feedback | (status, created_at DESC) | 按状态筛选反馈 |
| `idx_feedback_user` | feedback | (user_id, created_at DESC) | 用户反馈列表 |
| `idx_usage_logs_user_created` | usage_logs | (user_id, created_at DESC) | 用户用量日志 |
| `idx_usage_logs_action_created` | usage_logs | (action, created_at DESC) | 按操作类型统计 |
| `idx_payments_user_created` | payments | (user_id, created_at DESC) | 用户支付列表 |
| `idx_payments_status_created` | payments | (status, created_at DESC) | 按状态筛选支付 |
| `idx_payments_order_no` | payments | (order_no) | 订单号唯一查询 |

### V1.1 迁移索引

| 索引名 | 表 | 列 | 说明 |
|--------|-----|-----|------|
| `idx_orders_user_id` | orders | (user_id) | 用户订单查询 |
| `idx_orders_order_no` | orders | (order_no) | 订单号唯一查询 |
| `idx_orders_status` | orders | (status) | 按状态筛选订单 |
| `idx_v11_payments_order_id` | v11_payments | (order_id) | 订单关联支付 |
| `idx_v11_payments_user_id` | v11_payments | (user_id) | 用户支付记录 |
| `idx_refunds_user_id` | refunds | (user_id) | 用户退款记录 |
| `idx_transactions_user_id` | transactions | (user_id) | 用户交易流水 |
| `idx_user_profiles_invitation_code` | user_profiles | (invitation_code) | 邀请码唯一查询 |

---

## RLS 策略说明

### 设计原则

1. **所有业务表均启用 RLS** - 无例外
2. **用户数据隔离** - 用户只能访问自己的数据
3. **service_role 超级权限** - 服务端使用 service_role key 可绕过 RLS
4. **公开数据例外** - `charts.is_public = TRUE` 的命盘可被任何人读取

### RLS 检查机制

Supabase RLS 通过以下方式工作:

```
客户端请求 -> Supabase API -> JWT 解析 -> auth.uid() -> RLS 策略检查 -> 数据过滤
```

- 前端使用 `VITE_SUPABASE_ANON_KEY` 创建的客户端，自动附加当前用户的 JWT
- `auth.uid()` 从 JWT 中提取用户 ID
- `auth.jwt() ->> 'role'` 提取用户角色（service_role 角色拥有超级权限）
- 服务端使用 `SUPABASE_SERVICE_ROLE_KEY` 创建的 admin client，绕过所有 RLS

### 策略模式

| 操作 | 普通表模式 | 反馈表特殊处理 | 日志表特殊处理 |
|------|-----------|---------------|---------------|
| SELECT | `user_id = auth.uid() OR service_role` | 同左 | 同左 |
| INSERT | `user_id = auth.uid() OR service_role` | `user_id IS NULL OR user_id = auth.uid()`（允许匿名） | `service_role` only |
| UPDATE | `user_id = auth.uid()` | `service_role` only（管理员处理） | - |
| DELETE | `user_id = auth.uid() OR service_role` | `service_role` only | - |

---

## 迁移文件与执行方式

### 迁移文件列表

| 序号 | 文件名 | 内容 |
|------|--------|------|
| 1 | `0001_init.sql` | 核心表: users, charts, analysis_history, feedback, usage_logs, payments + 通用触发器 |
| 2 | `20260619112842_create_hexagrams_table.sql` | 六十四卦表 |
| 3 | `20260619112905_create_daily_hexagrams_table.sql` | 每日卦象表 |
| 4 | `20260619164507_create_divinations_table.sql` | 占卜记录表 |
| 5 | `20260621044157_create_fengshui_reports_table.sql` | 风水报告表 |
| 6 | `20260712000001_v11_orders_payments.sql` | V1.1 表: orders, v11_payments, refunds, transactions, user_profiles |

### 执行方式

#### 方式 A: Supabase SQL Editor

1. 进入 Supabase Dashboard -> SQL Editor
2. 按文件名顺序依次复制粘贴执行
3. 每个文件执行后确认无错误

#### 方式 B: Supabase CLI

```bash
# 安装 CLI
npm install -g supabase

# 登录
supabase login

# 关联项目
supabase link --project-ref <your-project-ref>

# 推送所有迁移
supabase db push

# 或者查看迁移状态
supabase migration list
```

#### 方式 C: 本地开发（Supabase Local）

```bash
# 初始化本地 Supabase
supabase init

# 启动本地服务
supabase start

# 重置本地数据库并应用所有迁移
supabase db reset
```

---

## 数据库设计决策

### 为什么选择 Supabase

1. **Auth 开箱即用**: 内置邮箱密码、OTP、OAuth（Google/Apple/微信）认证，无需自建认证服务
2. **RLS 行级安全**: 数据库层面强制数据隔离，即使客户端直接访问也无法越权
3. **Edge Functions**: TypeScript 编写的 Serverless 函数，可调用推演模型（如 analyze-room）
4. **实时能力**: 预留 Realtime 功能，未来可用于 WebSocket 推送分析进度
5. **免费起步**: Supabase Free Tier 提供 500MB 数据库 + 50000 MAU，适合早期项目

### RLS 策略原理

传统 Web 应用在应用层实现权限控制，但客户端直连数据库时需要数据库层面的安全保障。

**RLS 优势**:
- **零信任架构**: 不信任客户端，每个查询都经过权限检查
- **自动生效**: 前端代码无法绕过，即使请求被篡改
- **角色分离**: anon key（前端）受 RLS 限制，service_role key（后端）绕过 RLS

**角色说明**:
- `anon`: 使用 anon key 的请求，代表未认证或已认证的终端用户
- `authenticated`: 已登录用户（`auth.uid()` 不为 null）
- `service_role`: 服务端管理员角色，拥有完全访问权限

### V1 到 V1.1 的演进

| 方面 | V1 | V1.1 |
|------|-----|------|
| 用户模型 | `users` 表扩展 | `user_profiles` 独立表（支持邀请码、积分、会员等级） |
| 支付模型 | 单一 `payments` 表 | `orders` + `v11_payments` + `refunds` + `transactions` 四表分离 |
| 会员等级 | free/basic/premium/vip | free/pro/master |
| 交易记录 | 无 | `transactions` 表记录所有资金变动 |
| 订单超时 | 无 | `expires_at` 字段（30 分钟超时） |

### 通用触发器

所有表共享 `set_updated_at()` 触发器函数，在 UPDATE 操作时自动更新 `updated_at` 字段:

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

已注册此触发器的表: users, charts, feedback, payments。
V1.1 表（orders, v11_payments, refunds, transactions, user_profiles）使用 `DEFAULT now()` 设置初始值。
