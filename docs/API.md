# 玄风门 API 文档

> 版本: V4.4 | 更新日期: 2026-07-12
> 服务入口: `src/server/index.ts`
> 框架: Hono 4

---

## 概览

### 基础 URL

- 开发环境: `http://localhost:3001`
- 生产环境: `https://<your-domain>/api`

### 认证方式

除公开端点外，所有 API 需要在请求头中携带 Bearer Token:

```
Authorization: Bearer <access_token>
```

Token 由 Supabase Auth 颁发，通过登录/注册接口获取。

### 统一错误响应

所有错误遵循统一格式:

```json
{
  "error": {
    "code": "bad_request",
    "message": "请求参数错误",
    "details": {}
  }
}
```

| HTTP 状态码 | 错误码 | 说明 |
|-------------|--------|------|
| 400 | bad_request | 请求参数错误 |
| 401 | unauthorized | 未登录或 token 无效 |
| 403 | forbidden | 无权访问该资源 |
| 404 | not_found | 资源不存在 |
| 422 | validation_error | 数据校验失败 |
| 429 | - | 请求频率超限 |
| 500 | internal_error | 服务器内部错误 |

### 端点总览

| 模块 | 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|------|
| 健康 | GET | `/api/health` | 无 | 健康检查 |
| 八字 | POST | `/api/bazi` | 无 | 八字排盘计算 |
| 分析 | POST | `/api/analyze` | 需登录 | 创建分析 |
| 分析 | GET | `/api/analyze` | 可选 | 分析记录 |
| 合婚 | POST | `/api/compatibility` | 需登录 | 合婚分析 |
| 认证 | POST | `/api/auth/register` | 无 | 邮箱注册 |
| 认证 | POST | `/api/auth/login` | 无 | 邮箱登录 |
| 认证 | POST | `/api/auth/otp` | 无 | 发送 OTP |
| 认证 | POST | `/api/auth/otp/verify` | 无 | 验证 OTP |
| 认证 | POST | `/api/auth/social/wechat` | 无 | 微信登录 |
| 认证 | POST | `/api/auth/social/google` | 无 | Google 登录 |
| 认证 | POST | `/api/auth/social/apple` | 无 | Apple 登录 |
| 认证 | GET | `/api/auth/me` | 可选 | 当前用户信息 |
| 认证 | POST | `/api/auth/profile` | 需登录 | 更新用户资料 |
| 认证 | POST | `/api/auth/logout` | 需登录 | 登出 |
| 支付 | POST | `/api/payment/create-order` | 需登录 | 创建订单 |
| 支付 | POST | `/api/payment/confirm` | 需登录 | 确认支付 |
| 支付 | POST | `/api/payment/webhook/wechat` | 无 | 微信回调 |
| 支付 | POST | `/api/payment/webhook/alipay` | 无 | 支付宝回调 |
| 支付 | POST | `/api/payment/webhook/stripe` | 无 | Stripe 回调 |
| 支付 | POST | `/api/payment/refund` | 需登录 | 申请退款 |
| 支付 | GET | `/api/payment/orders` | 需登录 | 订单列表 |
| 支付 | GET | `/api/payment/orders/:id` | 需登录 | 订单详情 |
| 历史 | GET | `/api/history` | 可选 | 历史记录 |
| 用户 | GET | `/api/user` | 可选 | 用户信息 |

---

## 健康检查

### GET /api/health

健康检查端点，用于监控和负载均衡。

**请求**: 无需参数

**响应** (200 OK):

```json
{
  "status": "ok",
  "version": "0.1.0",
  "service": "xuanfengmen-api"
}
```

---

## 八字排盘

### POST /api/bazi

计算八字命盘。基于公历出生日期时间和性别，执行四柱排盘计算，包括天干地支、十神、大运流年等。

**路由文件**: `src/server/routes/bazi.ts`

**鉴权**: 无需登录

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `birth_date` | string | 是 | 公历日期，格式 `YYYY-MM-DD` |
| `birth_time` | string | 条件必填 | 出生时间，格式 `HH:MM`；`birth_time_unknown=true` 时可传空 |
| `gender` | string | 是 | 性别，`"male"` 或 `"female"` |
| `birth_time_unknown` | boolean | 否 | 是否未知时辰，默认 `false` |
| `birthplace` | string | 否 | 出生地（如 "北京"） |
| `timezone` | string | 否 | 时区（如 "Asia/Shanghai"） |
| `zishi_strategy` | string | 否 | 子时策略，`"late"`（默认）/ `"early"` / `"gregorian"` |
| `use_solar_time` | boolean | 否 | 是否使用真太阳时，默认 `true` |
| `longitude` | number | 否 | 出生地经度（东经为正），优先于 birthplace |

**请求示例**:

```json
{
  "birth_date": "1990-01-15",
  "birth_time": "08:30",
  "gender": "male",
  "birthplace": "北京",
  "zishi_strategy": "late",
  "use_solar_time": true
}
```

**响应** (200 OK):

```json
{
  "chart": {
    "year": { "stem": "己", "branch": "巳", "element": "土", "naYin": "大林木" },
    "month": { "stem": "丁", "branch": "丑", "element": "火", "naYin": "涧下水" },
    "day": { "stem": "丙", "branch": "寅", "element": "火", "naYin": "炉中火" },
    "hour": { "stem": "壬", "branch": "辰", "element": "水", "naYin": "长流水" },
    "dayMaster": "丙",
    "fiveElements": { ... }
  },
  "meta": {
    "strategy": "late",
    "use_solar_time": true,
    "generated_at": 1689456789000
  }
}
```

**错误响应**:

| 状态码 | 场景 |
|--------|------|
| 400 | 请求体非 JSON、birth_date 格式错误、gender 非法 |
| 422 | birth_date 不符合 YYYY-MM-DD、birth_time 不符合 HH:MM |
| 500 | 排盘计算内部错误 |

---

## 命盘分析

### POST /api/analyze

对命盘执行分析。支持 basic（基础分析）、full（完整分析）、ai（智能深度分析）三种类型。

**路由文件**: `src/server/routes/analyze.ts`

**鉴权**: 需登录（authRequired）

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `chart_id` | string | 条件必填 | 命盘 ID（与 chart_data 二选一） |
| `chart_data` | object | 条件必填 | 命盘数据（与 chart_id 二选一） |
| `analysis_type` | string | 是 | 分析类型：`"basic"` / `"full"` / `"ai"` |

**请求示例**:

```json
{
  "chart_id": "abc-123-def",
  "analysis_type": "full"
}
```

**响应** (200 OK):

```json
{
  "success": true,
  "analysis": {
    "id": "uuid",
    "analysis_type": "full",
    "status": "completed",
    "result": {
      "type": "full",
      "message": "分析结果占位，等待 Pipeline 接入"
    },
    "created_at": "2026-07-12T10:00:00Z"
  }
}
```

---

## 合婚分析

### POST /api/compatibility

对两张命盘执行合婚分析。

**路由文件**: `src/server/routes/compatibility.ts`

**鉴权**: 需登录（authRequired）

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `chart1_id` | string | 是 | 第一张命盘 ID |
| `chart2_id` | string | 是 | 第二张命盘 ID |

**请求示例**:

```json
{
  "chart1_id": "uuid-1",
  "chart2_id": "uuid-2"
}
```

**响应** (200 OK):

```json
{
  "success": true,
  "compatibility": {
    "id": "uuid",
    "chart1_id": "uuid-1",
    "chart2_id": "uuid-2",
    "score": 78,
    "summary": "合婚分析结果占位，等待合婚算法接入",
    "status": "completed"
  }
}
```

---

## 认证模块

### POST /api/auth/register

邮箱注册。使用 Supabase Auth Admin API 创建用户，同时创建 user_profile。

**路由文件**: `src/server/routes/auth.ts`

**鉴权**: 无

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `password` | string | 是 | 密码，至少 6 位 |
| `display_name` | string | 否 | 显示名称 |
| `invited_by` | string | 否 | 邀请人的邀请码 |

**响应** (200 OK):

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "message": "注册成功"
}
```

**错误响应**: 400 - 邮箱已注册 / 密码长度不足 / 注册失败

---

### POST /api/auth/login

邮箱密码登录。

**鉴权**: 无

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `password` | string | 是 | 密码 |

**响应** (200 OK):

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "v1.xxx",
    "expires_at": 1689456789
  }
}
```

**错误响应**: 400 - 邮箱或密码错误 / 登录失败

---

### POST /api/auth/otp

发送 Email OTP 验证码。

**鉴权**: 无

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |

**响应** (200 OK):

```json
{
  "success": true,
  "message": "OTP 已发送至 user@example.com"
}
```

---

### POST /api/auth/otp/verify

验证 Email OTP。

**鉴权**: 无

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `email` | string | 是 | 邮箱地址 |
| `token` | string | 是 | OTP 验证码 |

**响应** (200 OK):

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "v1.xxx",
    "expires_at": 1689456789
  }
}
```

---

### POST /api/auth/social/wechat

微信 OAuth 登录。

**鉴权**: 无

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `code` | string | 是 | 微信授权码 |

**响应** (200 OK):

```json
{
  "success": false,
  "message": "微信 OAuth 尚未接入，请等待后续版本"
}
```

> 注意: 微信 OAuth 当前为占位实现，返回 `success: false`。

---

### POST /api/auth/social/google

Google OAuth 登录。使用 Google ID Token 通过 Supabase Auth 验证。

**鉴权**: 无

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id_token` | string | 是 | Google ID Token |

**响应** (200 OK):

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@gmail.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "v1.xxx",
    "expires_at": 1689456789
  }
}
```

---

### POST /api/auth/social/apple

Apple OAuth 登录。使用 Apple ID Token 通过 Supabase Auth 验证。

**鉴权**: 无

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id_token` | string | 是 | Apple ID Token |

**响应** (200 OK):

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@icloud.com"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "v1.xxx",
    "expires_at": 1689456789
  }
}
```

---

### GET /api/auth/me

获取当前用户信息（含 user_profile）。

**鉴权**: 可选（authOptional）- 未登录返回 `user: null`

**请求参数**: 无

**响应** (200 OK) - 已登录:

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2026-01-01T00:00:00Z"
  },
  "profile": {
    "id": "uuid",
    "display_name": "张三",
    "avatar_url": null,
    "membership_tier": "free",
    "points_balance": 0,
    "total_charts": 5,
    "total_analyses": 3,
    "invitation_code": "ABC123"
  },
  "isAuthenticated": true
}
```

**响应** (200 OK) - 未登录:

```json
{
  "success": true,
  "user": null,
  "profile": null,
  "isAuthenticated": false
}
```

---

### GET /api/auth/profile

获取用户资料。等同于 GET /api/auth/me 中的 profile 字段。

**鉴权**: 可选（authOptional）

**请求参数**: 无

**响应**: 同 GET /api/auth/me 中的 profile 数据。

---

### POST /api/auth/profile

更新用户资料。

**鉴权**: 需登录（authRequired）

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `display_name` | string | 否 | 显示名称 |
| `avatar_url` | string | 否 | 头像 URL |

**响应** (200 OK):

```json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "display_name": "新名称",
    "avatar_url": "https://example.com/avatar.jpg",
    "updated_at": "2026-07-12T10:00:00Z"
  }
}
```

---

### POST /api/auth/logout

登出，撤销 session。

**鉴权**: 需登录（authRequired）

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `refresh_token` | string | 否 | 要撤销的 refresh token |

**响应** (200 OK):

```json
{
  "success": true,
  "message": "登出成功"
}
```

---

## 支付模块

### POST /api/payment/create-order

创建订单。校验产品类型和价格，生成订单号，设置 30 分钟超时。

**路由文件**: `src/server/routes/payment.ts`

**鉴权**: 需登录（authRequired）

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `product_type` | string | 是 | 产品类型：`"membership"` / `"report"` / `"addon"` / `"credits"` |
| `product_id` | string | 是 | 产品 ID（如 `"pro"`, `"master"`, `"basic"`, `"full"`, `"ai"`, `"compatibility"`, `"100"`, `"500"`, `"1000"`） |
| `payment_method` | string | 否 | 支付方式：`"wechat"` / `"alipay"` / `"stripe"` |
| `discount_cents` | number | 否 | 折扣金额（分），默认 0 |

**产品定价表**:

| 产品 Key | 名称 | 价格（分） |
|----------|------|-----------|
| `membership-pro` | 玄风门 Pro 会员 | 9900 (99.00 元) |
| `membership-master` | 玄风门 Master 会员 | 29900 (299.00 元) |
| `report-basic` | 基础分析报告 | 1990 (19.90 元) |
| `report-full` | 完整分析报告 | 4990 (49.90 元) |
| `report-ai` | 推演深度分析报告 | 9990 (99.90 元) |
| `addon-compatibility` | 合婚分析附加报告 | 2990 (29.90 元) |
| `credits-100` | 100 积分包 | 990 (9.90 元) |
| `credits-500` | 500 积分包 | 3990 (39.90 元) |
| `credits-1000` | 1000 积分包 | 6990 (69.90 元) |

**响应** (200 OK):

```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "user_id": "uuid",
    "order_no": "XF20260712103045A3B2C1",
    "product_type": "membership",
    "product_id": "pro",
    "product_name": "玄风门 Pro 会员",
    "amount_cents": 9900,
    "discount_cents": 0,
    "final_amount_cents": 9900,
    "currency": "CNY",
    "status": "pending",
    "expires_at": "2026-07-12T10:30:00Z",
    "created_at": "2026-07-12T10:00:00Z"
  }
}
```

---

### POST /api/payment/confirm

确认支付。更新订单状态为 paid，创建 payment 和 transaction 记录，如果是会员产品则更新 user_profiles。

**鉴权**: 需登录（authRequired）

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `order_id` | string | 是 | 订单 ID |
| `payment_method` | string | 是 | 支付方式：`"wechat"` / `"alipay"` / `"stripe"` |
| `provider_payment_id` | string | 否 | 支付平台交易 ID |
| `provider_order_id` | string | 否 | 支付平台订单 ID |

**响应** (200 OK):

```json
{
  "success": true,
  "order": { "id": "uuid", "status": "paid", "paid_at": "..." },
  "payment": {
    "id": "uuid",
    "order_id": "uuid",
    "payment_method": "wechat",
    "status": "success",
    "amount_cents": 9900
  }
}
```

---

### POST /api/payment/webhook/wechat

微信支付回调。接收微信支付通知，验签（TODO），更新支付状态。

**鉴权**: 无（由微信支付签名验证）

**请求参数**: 微信支付通知 JSON（含 resource.ciphertext 等）

**响应**:

- 成功: `{ "code": "SUCCESS", "message": "处理成功" }`
- 重复通知: `{ "code": "SUCCESS", "message": "重复通知" }`
- 订单不存在: `{ "code": "FAIL", "message": "订单不存在" }` (400)

> 注意: 当前验签逻辑为 TODO，生产环境需实现 AES-256-GCM 解密。

---

### POST /api/payment/webhook/alipay

支付宝回调。

**鉴权**: 无（由支付宝签名验证）

**请求参数**: 支付宝异步通知参数

**响应**:

- 成功: `"success"` (text/plain)
- 已支付: `"success"` (text/plain)
- 订单不存在: `"fail"` (400, text/plain)

---

### POST /api/payment/webhook/stripe

Stripe Webhook 回调。

**鉴权**: 无（由 Stripe 签名验证）

**请求参数**: Stripe Event JSON

**响应**:

- 成功: `{ "received": true }`

当前仅处理 `checkout.session.completed` 事件。

---

### POST /api/payment/refund

申请退款。检查 7 天退款窗口，创建退款记录。

**鉴权**: 需登录（authRequired）

**请求参数**:

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `order_id` | string | 是 | 订单 ID |
| `reason` | string | 是 | 退款原因 |

**响应** (200 OK):

```json
{
  "success": true,
  "refund": {
    "id": "uuid",
    "refund_no": "RF1689456789A1B2",
    "amount_cents": 9900,
    "status": "pending"
  },
  "refund_no": "RF1689456789A1B2",
  "refund_amount_cents": 9900
}
```

**错误响应**:

| 状态码 | 场景 |
|--------|------|
| 400 | 订单状态不允许退款 / 超过 7 天退款窗口 / 已有待处理退款 |
| 404 | 订单不存在 / 未找到支付记录 |

---

### GET /api/payment/orders

获取当前用户的订单列表。

**鉴权**: 需登录（authRequired）

**请求参数**: 无

**响应** (200 OK):

```json
{
  "success": true,
  "orders": [
    {
      "id": "uuid",
      "order_no": "XF20260712103045A3B2C1",
      "product_name": "玄风门 Pro 会员",
      "amount_cents": 9900,
      "status": "paid",
      "created_at": "2026-07-12T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### GET /api/payment/orders/:id

获取订单详情，包含关联的支付记录和退款记录。

**鉴权**: 需登录（authRequired）

**路径参数**:

| 参数 | 说明 |
|------|------|
| `:id` | 订单 UUID |

**响应** (200 OK):

```json
{
  "success": true,
  "order": { "id": "uuid", ... },
  "payments": [{ "id": "uuid", "status": "success", ... }],
  "refunds": []
}
```

---

## 历史记录

### GET /api/history

查询当前用户的历史记录，合并命盘和分析历史。

**路由文件**: `src/server/routes/history.ts`

**鉴权**: 可选（authOptional）- 未登录返回空列表

**查询参数**:

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `page` | number | 否 | 1 | 页码（从 1 开始） |
| `limit` | number | 否 | 20 | 每页数量（上限 100） |
| `type` | string | 否 | 无 | 筛选类型：`"chart"` / `"analysis"` |

**响应** (200 OK):

```json
{
  "items": [
    {
      "id": "uuid",
      "item_type": "analysis",
      "name": null,
      "chart_id": "uuid",
      "analysis_type": "full",
      "result": { ... },
      "status": "completed",
      "created_at": "2026-07-12T10:00:00Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

---

## 用户信息

### GET /api/user

获取当前登录用户的 user_profiles 信息。

**路由文件**: `src/server/routes/user.ts`

**鉴权**: 可选（authOptional）- 未登录返回 `user: null`

**请求参数**: 无

**响应** (200 OK):

```json
{
  "user": {
    "id": "uuid",
    "display_name": "张三",
    "avatar_url": null,
    "membership_tier": "pro",
    "membership_expires_at": "2026-08-12T00:00:00Z",
    "points_balance": 500,
    "total_spent_cents": 9900,
    "total_charts": 10,
    "total_analyses": 8,
    "invitation_code": "ABC123",
    "invited_by": null,
    "created_at": "2026-01-01T00:00:00Z",
    "updated_at": "2026-07-12T10:00:00Z"
  }
}
```

**响应** (200 OK) - 未登录:

```json
{
  "user": null
}
```
