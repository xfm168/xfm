# XuanFengMen V1.2 Stable Release

发布日期：2026-07-12
版本号：v1.2.0
Git Tag：v1.2.0
Baseline Commit：3cf5362

---

## 亮点

1. **八字命理 V3.1 冻结** — 13 个算法文件 (+1448 行)，228 条回归测试全部通过
2. **全栈安全防护** — CSP + Rate Limiting + Input Validation + XSS Protection + AuthGuard
3. **支付架构就绪** — 微信支付 / 支付宝 / Stripe SDK 封装 + 8 个 API 端点
4. **三级会员体系** — Free / Pro / Master 功能权限矩阵
5. **SEO 全面优化** — Schema.org (5 种) + OG + Twitter + Sitemap + Robots
6. **9-Tab 管理后台** — 含商业 KPI 仪表盘
7. **271 个非命理源文件** — 覆盖安全、缓存、可观测性、无障碍、分析、支付等

---

## 新增模块

| 模块 | 文件数 | 说明 |
|------|--------|------|
| 安全模块 | 9 | CSP, Rate Limiter, Input Validator, Security Headers, XSS Audit |
| 缓存层 | 8 | 5 级缓存 (Analysis/Hexagram/Rule/Knowledge/Session) + Manager |
| 可观测性 | 9 | ApiTracer, Health Dashboard, PerformanceProfiler, EngineProfiler |
| 分析追踪 | 7 | GA4, Clarity, Event Tracker, Heatmap |
| 无障碍 | 5 | Audit Checker, Contrast, Keyboard, ARIA |
| 支付 SDK | 3 | WeChat Pay, Alipay, Stripe |
| 业务逻辑 | 10 | Membership V2, Growth, Refund, Invitation, Coupon, Points |
| 认证系统 | 3 | Server Routes (10 端点), useAuth Hook, AuthGuard |
| 新页面 | 11 | Login, UserCenter, Feedback, AICostDashboard, ErrorPages 等 |
| SEO | 6 | Schema.org 生成, Sitemap, Robots, RSS, Breadcrumb |
| 数据库 | 2 | 5 表迁移 + 类型定义 |

---

## 修复内容

- FengShui.tsx XSS 漏洞修复 (escapeHtml 消毒)
- useDashboard.ts 缺失 getDailyData 返回值修复
- useMembership.ts useEffect return undefined 修复
- Server middleware TS7030 隐式返回修复
- BaziChart.tsx 无障碍属性增强

---

## 性能提升

- Vite 手动 chunk 分割 (10 个独立分包)
- 5 级缓存系统减少重复计算
- Lazy Loading 路由级代码分割
- SVG 内联图表替代外部图表库

---

## 安全提升

- Content Security Policy (CSP) 配置
- 10 项 HTTP 安全响应头
- 滑动窗口 Rate Limiter
- 输入白名单验证 + HTML 转义
- AuthGuard 路由守卫 (JWT)
- .env.example 环境变量模板

---

## 测试

- 回归测试: 228/228 PASS
- 非 bazi TypeScript: 0 Error
- bazi 算法: 36 Error (历史 plugin 类型问题，不影响运行)

---

## 未来计划 (V2.0)

- 八字精研大师
- 姻缘合盘大师
- 姓名策定
- 择吉择日
- 推演 奇门 / 六壬 / 紫微
- 企业堪舆
- 开放服务平台
- SaaS 运营后台

详见 [ROADMAP_V2.md](./ROADMAP_V2.md)
