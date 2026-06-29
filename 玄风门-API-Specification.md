# 玄风门 API Specification（接口规范）

> 版本：V1.0 | 日期：2026-06-29
>
> 本文档为整个系统所有 API 的唯一标准。
> 以后任何接口必须符合统一规范。

---

## 文档体系

玄风门十大核心文档：

| # | 文档 | 定位 |
|---|------|------|
| 01 | Project Status | 当前开发状态 |
| 02 | Architecture Constitution | 最高开发原则 |
| 03 | Engineering Handbook | 工程开发规范 |
| 04 | Master PRD | 产品需求总文档 |
| 05 | Version Roadmap | 长期版本规划 |
| 06 | Algorithm Whitepaper | 核心知识资产 |
| 07 | Rule Specification | 规则唯一来源 |
| 08 | Data Dictionary | 数据库唯一标准 |
| 09 | **API Specification（本文）** | **接口唯一标准** |
| 10 | Admin Handbook | 后台运营手册 |

---

## 一、统一响应格式

### 1.1 标准 Response

所有 API 必须返回统一格式：

```typescript
interface ApiResponse<T = any> {
  success: boolean          // 是否成功
  code: number             // 状态码（200=成功，其他=错误）
  message: string          // 提示信息
  data: T | null           // 数据主体
  meta?: {                 // 元信息（分页等）
    page?: number
    pageSize?: number
    total?: number
    totalPages?: number
    hasMore?: boolean
    processingTime?: number  // 处理时间（毫秒）
    requestId?: string       // 请求ID
    version?: string         // API版本
  }
}
```

### 1.2 成功响应示例

```json
{
  "success": true,
  "code": 200,
  "message": "ok",
  "data": {
    "id": "uuid",
    "name": "乾卦"
  },
  "meta": {
    "processingTime": 156,
    "requestId": "req_abc123",
    "version": "v1.0"
  }
}
```

### 1.3 分页响应示例

```json
{
  "success": true,
  "code": 200,
  "message": "ok",
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 156,
    "totalPages": 8,
    "hasMore": true,
    "processingTime": 45
  }
}
```

### 1.4 错误响应示例

```json
{
  "success": false,
  "code": 40001,
  "message": "参数错误：出生日期格式不正确",
  "data": null,
  "meta": {
    "processingTime": 12
  }
}
```

---

## 二、错误码规范

### 2.1 错误码分段

| 错误码范围 | 类型 | 说明 |
|-----------|------|------|
| 200 | 成功 | 请求成功 |
| 40000 - 40099 | 参数错误 | 客户端参数问题 |
| 40100 - 40199 | 认证错误 | 登录/Token 问题 |
| 40300 - 40399 | 权限错误 | 无权限访问 |
| 40400 - 40499 | 资源不存在 | 找不到资源 |
| 42900 - 42999 | 限流错误 | 请求过于频繁 |
| 50000 - 50099 | 服务器错误 | 服务端内部错误 |
| 50300 - 50399 | 服务不可用 | 服务暂时不可用 |

### 2.2 常用错误码

| 错误码 | 含义 | HTTP状态码 |
|--------|------|-----------|
| 200 | 成功 | 200 |
| 40000 | 参数错误 | 400 |
| 40001 | 缺少必填参数 | 400 |
| 40002 | 参数格式错误 | 400 |
| 40003 | 参数值超出范围 | 400 |
| 40100 | 未认证 | 401 |
| 40101 | Token 过期 | 401 |
| 40102 | Token 无效 | 401 |
| 40300 | 无权限 | 403 |
| 40301 | VIP权限不足 | 403 |
| 40302 | 次数超限 | 403 |
| 40400 | 资源不存在 | 404 |
| 40900 | 资源冲突 | 409 |
| 42900 | 请求过于频繁 | 429 |
| 50000 | 服务器内部错误 | 500 |
| 50300 | 服务暂时不可用 | 503 |
| 50301 | AI服务暂时不可用 | 503 |

---

## 三、鉴权规范

### 3.1 鉴权方式

| 方式 | 说明 | 适用场景 |
|------|------|---------|
| anon key | Supabase 匿名 key | 公开接口 |
| JWT Token | 用户登录后的 Token | 用户相关接口 |
| service_role | 服务端密钥 | 仅限 Edge Function 内部使用 |
| API Key | 第三方接入 Key | 开放 API |

### 3.2 Header 规范

```http
Authorization: Bearer <jwt_token>
X-Api-Key: <api_key>
X-Client-Version: 1.0.0
X-Request-Id: <uuid>
```

---

## 四、分页规范

### 4.1 游标分页（推荐）

用于大列表，性能更好。

**请求：**
```
GET /api/v1/items?limit=20&cursor=<last_id>
```

**响应：**
```json
{
  "success": true,
  "code": 200,
  "data": [...],
  "meta": {
    "limit": 20,
    "hasMore": true,
    "nextCursor": "next_cursor_id"
  }
}
```

### 4.2 页码分页

用于小数据量、需要跳页的场景。

**请求：**
```
GET /api/v1/items?page=1&pageSize=20
```

**响应：**
```json
{
  "success": true,
  "code": 200,
  "data": [...],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 156,
    "totalPages": 8,
    "hasMore": true
  }
}
```

---

## 五、限流规范

### 5.1 限流策略

| 接口类型 | 限制 | 周期 |
|---------|------|------|
| 公开接口（游客） | 60次 | 1分钟 |
| 用户接口 | 120次 | 1分钟 |
| AI接口 | 10次 | 1分钟 |
| 上传接口 | 30次 | 1小时 |
| 开放API | 按套餐 | - |

### 5.2 限流响应头

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 85
X-RateLimit-Reset: 1687000000
Retry-After: 30
```

---

## 六、缓存规范

### 6.1 缓存层级

| 层级 | 位置 | 适用 | TTL |
|------|------|------|-----|
| L1 | 浏览器 localStorage | 用户偏好、静态数据 | 7天 |
| L2 | 浏览器内存（状态管理） | 当前会话数据 | 会话 |
| L3 | CDN / Edge Cache | 静态资源、公开接口 | 1小时 - 7天 |
| L4 | Redis | 热点数据、AI结果 | 5分钟 - 24小时 |
| L5 | 数据库 | 持久化数据 | 永久 |

### 6.2 缓存失效

- 数据变更主动失效
- TTL 自然过期
- 规则版本更新导致 AI 缓存失效

---

## 七、Edge Functions API

### 7.1 analyze-room（风水图像分析）

**路径：** `POST /functions/v1/analyze-room`

**鉴权：** anon key

**限流：** 10次/分钟/用户

**请求：**

```json
{
  "imageUrl": "https://...",
  "roomType": "bedroom",
  "visitorId": "uuid"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| imageUrl | string | 是 | 房间照片URL |
| roomType | string | 是 | 空间类型：bedroom/living_room/study/kitchen/office/balcony/other |
| visitorId | string | 是 | 访客ID |

**响应：**

```json
{
  "success": true,
  "code": 200,
  "message": "ok",
  "data": {
    "detectedRoomType": "卧室",
    "detectedObjects": ["床", "衣柜", "窗户", "台灯"],
    "roomMatch": true,
    "mismatchReason": "",
    "analysisBasis": "基于八宅风水与形峦理论分析",
    "score": 75,
    "summary": "整体格局尚可，注意床头朝向...",
    "issues": [
      {
        "id": "issue_1",
        "severity": "high",
        "title": "床头靠窗",
        "description": "床头直接靠窗户，无靠山...",
        "location": "北侧",
        "suggestion": "调整床头位置，靠实墙放置...",
        "relatedObjects": ["床", "窗户"]
      }
    ]
  },
  "meta": {
    "processingTime": 3500,
    "version": "v1.0"
  }
}
```

**错误码：**
- 40001 — 缺少 imageUrl
- 40002 — roomType 无效
- 50301 — AI服务暂时不可用
- 42900 — 请求过于频繁

---

## 八、八字算法 API（规划 V7.5）

### 8.1 八字排盘

**路径：** `POST /api/v1/bazi/calculate`

**鉴权：** anon key / 用户 Token

**请求：**

```json
{
  "birthDate": "1990-05-15",
  "birthTime": "12:30",
  "gender": "male",
  "timezone": "Asia/Shanghai"
}
```

**响应：** 完整八字排盘结果（BaZiChart）

---

### 8.2 格局分析

**路径：** `POST /api/v1/bazi/geju`

**返回：** 格局详细分析 + 匹配规则 + 可信度

---

### 8.3 喜用神分析

**路径：** `POST /api/v1/bazi/xiyong`

**返回：** 喜用神完整分析 + 多因素权重 + 理由

---

### 8.4 大运流年

**路径：** `POST /api/v1/bazi/dayun`

**返回：** 起运时间 + 十年大运 + 流年 + 流月

---

## 九、用户 API（规划 V8.0）

### 9.1 发送验证码

```
POST /api/v1/auth/sms/send
```

### 9.2 登录

```
POST /api/v1/auth/login
POST /api/v1/auth/wechat
POST /api/v1/auth/apple
POST /api/v1/auth/google
```

### 9.3 用户信息

```
GET    /api/v1/user/profile
PUT    /api/v1/user/profile
```

### 9.4 会员信息

```
GET /api/v1/user/membership
```

---

## 十、支付 API（规划 V8.0）

```
POST   /api/v1/pay/wechat
POST   /api/v1/pay/alipay
POST   /api/v1/pay/stripe
GET    /api/v1/orders
GET    /api/v1/orders/:id
POST   /api/v1/orders/:id/refund
```

---

## 十一、Admin API（规划 V8.0）

### 11.1 统计

```
GET /api/v1/admin/stats/dashboard
GET /api/v1/admin/stats/users
GET /api/v1/admin/stats/revenue
GET /api/v1/admin/stats/ai
```

### 11.2 用户管理

```
GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id
PUT    /api/v1/admin/users/:id
POST   /api/v1/admin/users/:id/ban
```

### 11.3 订单管理

```
GET  /api/v1/admin/orders
GET  /api/v1/admin/orders/:id
POST /api/v1/admin/orders/:id/refund
```

### 11.4 Prompt 管理

```
GET    /api/v1/admin/prompts
GET    /api/v1/admin/prompts/:id
POST   /api/v1/admin/prompts
PUT    /api/v1/admin/prompts/:id
POST   /api/v1/admin/prompts/:id/publish
```

### 11.5 Rule 管理

```
GET    /api/v1/admin/rules
GET    /api/v1/admin/rules/:id
GET    /api/v1/admin/rules/versions
POST   /api/v1/admin/rules/:id/publish
POST   /api/v1/admin/rules/:id/rollback
```

### 11.6 日志

```
GET /api/v1/admin/logs/operations
GET /api/v1/admin/logs/errors
GET /api/v1/admin/logs/ai-calls
```

---

## 十二、Webhook（规划 V8.0）

### 12.1 支付回调

```
POST /webhooks/payment/wechat
POST /webhooks/payment/alipay
POST /webhooks/payment/stripe
```

### 12.2 事件通知

```
POST /webhooks/events
```

事件类型：
- `user.registered` — 用户注册
- `user.vip_purchased` — 购买VIP
- `payment.success` — 支付成功
- `ai.call_completed` — AI调用完成

---

## 十三、AI API 内部规范

### 13.1 Provider 接口

```typescript
interface AIProvider {
  name: string
  generateText(params: AIRequest): Promise<AIResponse>
  generateVision(params: VisionRequest): Promise<AIResponse>
  getTokenUsage(): TokenUsage
}
```

### 13.2 统一请求

```typescript
interface AIRequest {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json'
  model?: string
}
```

### 13.3 统一响应

```typescript
interface AIResponse {
  success: boolean
  content: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  model: string
  latency: number
}
```

---

## 十四、版本管理

### 14.1 API 版本

URL 中包含版本号：
```
/api/v1/...
/api/v2/...
```

### 14.2 兼容性

- 主版本：可能不兼容
- 次版本：新增字段，向后兼容
- 修订号：Bug修复，完全兼容

### 14.3 弃用策略

- 旧版本至少保留 6 个月
- 弃用前提前 3 个月通知
- Response Header 中增加 Deprecation 警告

---

## 附录

### A. 状态码速查

| HTTP | 业务码 | 含义 |
|------|--------|------|
| 200 | 200 | 成功 |
| 400 | 40001 | 参数错误 |
| 401 | 40100 | 未认证 |
| 401 | 40101 | Token过期 |
| 403 | 40300 | 无权限 |
| 403 | 40301 | VIP权限不足 |
| 404 | 40400 | 资源不存在 |
| 429 | 42900 | 限流 |
| 500 | 50000 | 服务器错误 |
| 503 | 50301 | AI服务不可用 |

### B. 命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 路径 | kebab-case | `/api/v1/user-profile` |
| Query | camelCase | `?pageSize=20` |
| Body字段 | camelCase | `birthDate` |
| 响应字段 | camelCase | `processingTime` |
| Header | X-大写开头 | `X-Request-Id` |

### C. 安全要求

- 所有生产接口必须 HTTPS
- 敏感数据必须加密传输
- 输入必须校验，防止注入
- 文件上传必须校验类型和大小
- 错误信息不暴露内部细节

---

> 本文档为API唯一标准，新增/修改接口必须同步更新。
> 下一次大规模更新：V8.0 用户系统上线后。
