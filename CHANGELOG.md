# Changelog

All notable changes to the XuanFengMen project will be documented in this file.

## [V1.2.0] - 2026-07-12

### 新增功能

- **会员体系 V2** — Free/Pro/Master 三级会员，功能权限矩阵，优惠券/积分/邀请系统
- **用户系统** — 邮箱密码登录、OTP 验证码登录、社交登录 (微信/Google/Apple) 预留
- **用户中心** — 8-Tab 个人中心 (概览/分析/订单/支付/会员/积分/优惠券/邀请)
- **支付系统** — 微信支付/支付宝/Stripe SDK 封装，订单创建/确认/退款 API
- **管理后台** — 9-Tab Dashboard (数据概览/用户管理/订单管理/支付管理/投诉处理/优惠券管理/公告管理/运营统计/商业KPI)
- **推演成本看板** — Token 消耗趋势、模型成本对比、缓存命中率、自动降级策略
- **反馈系统** — Bug/功能反馈，5 星评分，分类选择
- **错误页面** — 404/500/维护中专用页面
- **安全模块** — Rate Limiter (滑动窗口)、Input Validator (白名单)、Security Headers (10 项 HTTP 头)、CSP 策略、XSS 防护 (escapeHtml)
- **缓存层** — AnalysisCache (24h) / HexagramCache (∞) / RuleCache (1h) / KnowledgeCache (∞) / SessionCache (30min)
- **可观测性** — ApiTracer (RequestID/TraceID) / ApiHealthDashboard / PerformanceProfiler / EngineProfiler
- **无障碍** — WCAG 2.2 审计 (对比度/键盘导航/ARIA 标签)
- **SEO 生成器** — Sitemap / Robots / RSS / 城市落地页 / FAQ 页面 / Breadcrumb 生成
- **压力测试工具** — Load Test 框架
- **Error Boundary** — 全局错误边界 + Crash Log
- **Analytics** — GA4 + Microsoft Clarity 集成封装
- **Sentry** — 错误监控集成
- **PWA** — manifest.json + Apple Web App meta
- **AuthGuard** — 路由守卫组件 (支持 requireAdmin)
- **SEO 增强** — Schema.org JSON-LD (WebSite + Organization + BreadcrumbList + FAQPage + Article)
- **数据库迁移** — 5 表 (orders, v11_payments, refunds, transactions, user_profiles) + RLS 策略
- **生产报告** — 9 份 HTML 报告 (验证/用户测试/商业KPI/推演成本/安全审计/SEO增长/压力测试/认证/Baseline)

### 修复内容

- **XSS 修复** — FengShui.tsx 添加 escapeHtml，在 markdownToHtml 前消毒用户输入
- **useDashboard.ts** — 修复 getDailyData 缺失返回值
- **useMembership.ts** — useEffect return undefined 修复
- **middleware auth** — Hono 中间件 return undefined 修复 (TS7030)
- **BaziChart.tsx** — 无障碍增强 (aria-label, role 属性)

### 安全更新

- CSP (Content Security Policy) 策略配置
- HSTS / X-Frame-Options / X-Content-Type-Options 等 10 项 HTTP 安全头
- Rate Limiter 滑动窗口限流 (默认 100 req/60s)
- Input Validator 白名单校验
- sanitizeString HTML 特殊字符转义
- AuthGuard 路由保护 (/admin, /user-center)

### SEO

- 首页完整 Meta 标签 (title, description, keywords, robots)
- Open Graph 标签 (og:title, og:description, og:image 1200x630)
- Twitter Card 标签 (summary_large_image)
- 微信 itemprop 标签
- Schema.org JSON-LD (5 种结构化数据)
- robots.txt + sitemap.xml
- OG Image (og-image.jpg)
- Canonical URL

### Dashboard

- 9-Tab 管理后台 (从单一数据面板扩展)
- 商业 KPI Tab (今日收入/订单/退款/活跃/会员增长/ARPU/LTV/ROI)
- SVG 内联图表 (柱状图/环形图/折线图)
- 数据概览/用户管理/订单管理/支付管理/投诉处理/优惠券管理/公告管理/运营统计

### 推演

- 推演成本看板页面 (AICostDashboard)
- Token 消耗趋势图表 (7/30 天)
- 模型成本对比表
- 缓存命中率统计
- 自动降级策略 UI

### 八字 V3.1

- 流年分析大幅扩展 (+779 行)
- 五行合化规则大幅扩展 (+468 行)
- 五行力量计算增强 (+93 行)
- 报告输出增强 (+114 行)
- 日柱计算调整 (+32 行)
- 新增 HeHuaResult 等类型 (+30 行)
- 格局规则微调
- 冲太岁判断修复
- 喜用神规则类型扩展

### 风水

- 风水模拟引擎类型调整
- 确认 101 条规则 + 76 条知识库稳定

## [V1.1] - 2026-07-10

### 新增功能

- 真实支付 SDK 架构 (WeChat Pay, Alipay, Stripe)
- 用户认证系统 (Supabase Auth + 自定义 server routes)
- 会员体系 V2 (Free/Pro/Master)
- 用户中心 (8-Tab)
- 反馈系统
- 管理后台扩展 (9-Tab)
- GA4 + Clarity 监控集成
- Sentry 错误监控
- PWA manifest

## [V1.0] - 2026-07-08

### 新增功能

- SEO 完整优化 (Meta + OG + Twitter + Schema.org)
- 安全审计 (CSP + XSS 防护 + AuthGuard)
- Beta 测试框架
- Release Checklist (15/15 PASS)
- RC3 Production Ready (36 工程文件)
- ErrorBoundary + Logger + Profiler + Cache
- API 可观测性

## [V3.1] - 2026-07-06

### 八字算法增强

- 流年分析扩展
- 五行合化算法
- 算法冻结治理框架
- 228 条回归测试通过

## [V3.0] - 2026-07-04

### 重构

- 类型安全工程
- 统一重复代码
- Bug 修复
- 命盘海报分享
- 历史命盘比较
- 命书商业化导出
- 分步 Loading Card
