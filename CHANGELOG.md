# Changelog

All notable changes to the XuanFengMen project will be documented in this file.

---

## [V1.2.0] - 2026-07-19 — Final Release (Launch Ready)

### Reality Fix (R1-R4)

**R1: Admin 权限体系**
- 新增 `requireAdmin()` 中间件，检查 `user_profiles.role='admin'`
- admin-analytics (5 端点)、admin-ops (17 端点)、feedback admin (3 端点) 全部接入
- 移除旧的 `tier=premium/vip` 作为管理员判断的逻辑
- `user_profiles` 新增 `role` 列（`user`/`admin`）

**R2: 会员权限**
- 免费用户分析结果改为白名单截断，VIP 数据（geJu/xiYongShen/score/interpretation）不再泄露
- `requireFeatureFlag('pdf_export')` 拦截免费用户 PDF 下载
- `requireFeatureFlag('ai_explain')` + credit check 双重拦截免费用户 AI 解读
- VIP_REPORT capability 正确拦截免费用户 ai/pro 类型分析

**R3: charts 持久化**
- `POST /api/bazi` 已登录用户写入 `charts` 表，返回 `chart_id`
- `analysis_history` 通过 `chart_id` 外键关联 `charts`

**R4: 数据库一致性**
- `user_profiles.membership_tier` CHECK 修复为 `free/basic/premium/vip`
- `monitoring_logs.category` CHECK 扩展，新增 `pdf_download`/`ai_usage`/`share`
- 新增 `MonitoringCategory` Domain 枚举（10 值）

### Phase S Launch Verification

26 项验证全部 PASS：
- 普通用户完整流程 8/8 PASS
- 会员完整流程 8/8 PASS
- 后台验证 10/10 PASS
- 数据库验证 8/8 PASS（charts/analysis_history/orders/payments/webhook_events/monitoring_logs/notifications/user_profiles）
- 安全验证 10/10 PASS（JWT/Role/Tier/Permission/FeatureFlag/RLS/Webhook/CORS/RateLimit）

### V1.2 核心功能

**商业闭环**
- 4 级会员体系：Free/Basic/Premium/VIP
- 3 渠道支付：微信支付/支付宝/Stripe
- Webhook 验签（timingSafeEqual）+ 幂等性检查
- 自动会员升级 + 通知触发
- FeatureFlag + Capability 权限矩阵

**八字命理引擎**
- Pipeline + AnalysisCenter 双模式
- baziInterpreter 自然语言解读
- 免费截断 + VIP 完整报告
- PDF 生成（pdfkit）

**运营后台**
- Dashboard 数据分析（overview/daily/retention/conversion/trends）
- 运营工具（Banner/公告/活动/优惠券 CRUD）
- 反馈管理（状态流转）
- 成长体系（签到/徽章/等级/排行榜）
- 通知系统（11 种类型）

**SEO + 分享**
- 知识中心 + JSON-LD + sitemap.xml + robots.txt
- 分享卡片（3 种样式，6 平台）

**安全**
- JWT 鉴权 + Admin role-based 权限
- RLS 行级安全
- CORS 白名单
- Rate Limiting (100 req/min/IP)
- Webhook timingSafeEqual 签名验证

### 数据库 Migration

| Migration | 用途 |
|-----------|------|
| `0001_init.sql` | 初始表结构 |
| `0002_pro_reports.sql` | Pro 报告系统 |
| `0003_feedback_enhancement.sql` | 反馈增强 |
| `0004_critical_fix_domain_unify.sql` | Domain 统一修复 |
| `20260718000001_webhook_events.sql` | Webhook 事件表 |
| `20260718000002_monitoring_logs.sql` | 监控日志表 |
| `20260718000003_growth_system.sql` | 成长体系 |
| `20260718000004_notifications.sql` | 通知系统 |
| `20260718000005_ops_tools.sql` | 运营工具表 |
| `20260718000006_system_table_rls.sql` | RLS 策略 |
| `20260719000001_reality_fix_r1_r4.sql` | Reality Fix（role/tier/category） |

---

## [V1.2.0-RC] - 2026-07-12

### 新增功能

- 会员体系 V2 — Free/Basic/Premium/VIP 四级会员
- 用户系统 — 邮箱密码登录、OTP 验证码登录
- 支付系统 — 微信支付/支付宝/Stripe
- 管理后台 — Dashboard + 运营工具
- 反馈系统 — Bug/功能反馈，5 星评分
- 安全模块 — Rate Limiter/Input Validator/Security Headers/CSP

---

## [V1.1.0] - 2026-07-05

### 商业化

- 会员购买流程
- 支付 Webhook 集成
- PDF 导出
- AI 深度解读（Gemini API）

---

## [V1.0.0] - 2026-06-28

### 初始发布

- 八字排盘核心引擎（V3.1）
- 免费分析报告
- 用户注册/登录
- 基础 UI 框架
