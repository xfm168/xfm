# 玄风门 V1.2 Stable

## 概述

玄风门 V1.2 Stable 是首个正式生产级发布版本，包含八字命理 V3.1 冻结算法、完整安全防护体系、支付架构、SEO 优化、管理后台和 PWA 支持。

---

## 新增功能

### 命理系统
- 八字 V3.1 算法冻结 — 13 个算法文件 (+1448 行)，228 条回归测试通过
- 流年分析大幅扩展 (+779 行)
- 五行合化规则扩展 (+468 行)
- 新增 HeHuaResult 等类型定义

### 安全模块
- CSP (Content Security Policy) 策略
- HSTS + 10 项 HTTP 安全响应头
- 滑动窗口 Rate Limiter (默认 100 req/60s)
- 输入白名单验证 + HTML 特殊字符转义
- XSS 防护 (FengShui.tsx escapeHtml)
- AuthGuard 路由守卫 (JWT)

### 支付与会员
- 微信支付 / 支付宝 / Stripe SDK 封装
- 8 个支付 API 端点 (创建订单/确认/退款/Webhook)
- 三级会员体系 (Free/Pro/Master)
- 优惠券 / 积分 / 邀请系统
- 10 个业务逻辑模块

### 用户系统
- 邮箱密码登录
- OTP 验证码登录
- 社交登录预留 (微信/Google/Apple)
- 8-Tab 用户中心

### 管理后台
- 9-Tab Dashboard (数据概览/用户/订单/支付/投诉/优惠券/公告/运营/商业KPI)
- SVG 内联图表 (柱状/环形/折线)
- 商业 KPI 实时面板

### SEO 优化
- Schema.org JSON-LD (WebSite + Organization + BreadcrumbList + FAQPage + Article)
- Open Graph 完整标签
- Twitter Card 标签
- 微信 itemprop 标签
- robots.txt + sitemap.xml
- OG Image (1200x630)

### 基础设施
- 5 级缓存系统 (Analysis/Hexagram/Rule/Knowledge/Session)
- 可观测性 (ApiTracer + Health Dashboard + Profiler)
- GA4 + Microsoft Clarity 集成
- Sentry 错误监控
- Error Boundary + Crash Log
- PWA manifest + Apple meta
- 压力测试工具
- 11 个新页面 (Login, UserCenter, Feedback, AICostDashboard, ErrorPages...)

---

## 修复内容

- FengShui.tsx XSS 漏洞 (escapeHtml 消毒)
- useDashboard.ts 缺失 getDailyData 返回值
- useMembership.ts useEffect return undefined
- Server middleware TS7030 隐式返回
- BaziChart.tsx 无障碍属性增强

---

## 安全更新

- CSP 策略配置
- HSTS / X-Frame-Options / X-Content-Type-Options
- Rate Limiter 滑动窗口限流
- Input Validator 白名单校验
- sanitizeString HTML 转义
- AuthGuard 路由保护

---

## 推演 更新

- 推演成本看板页面
- Token 消耗趋势 (7/30 天)
- 模型成本对比表
- 缓存命中率统计
- 自动降级策略 UI

---

## 数据库

- 5 表迁移 (orders, v11_payments, refunds, transactions, user_profiles)
- Row Level Security (RLS) 策略
- 13 + 8 个索引

---

## 已知问题 (Known Issues)

1. **bazi Plugin 类型错误** — 36 个 TS Error 在 qi/plugin/ 实验代码中，不影响运行
2. **微信 OAuth** — 等待微信开放平台生产配置
3. **微信支付验签** — 等待商户 APIv3 证书
4. **支付宝验签** — 等待 RSA2 公钥
5. **Stripe Webhook** — 等待 Webhook Signing Secret

详见 [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)

---

## V2 Preview

V2 将从"玄风门网站"升级为"**玄风命理平台**"：

| 版本 | 主题 | 功能 |
|------|------|------|
| V2.0 | 命理推演系统 | 八字精研深度报告、姻缘合盘大师、智能起名 |
| V2.1 | 商业化扩展 | 择吉择日、企业堪舆、开放服务平台 |
| V2.2 | 传统命理完善 | 奇门遁甲、六壬、紫微斗数 |

统一平台架构：推演 + 规则引擎 + 知识库 + 推理引擎

详见 [ROADMAP_V2.md](./ROADMAP_V2.md)

---

**下载/安装**:

    git clone https://github.com/your-org/xuanfengmen.git
    cd xuanfengmen
    npm install
    cp .env.example .env.local
    npm run dev
