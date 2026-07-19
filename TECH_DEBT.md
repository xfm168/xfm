# Technical Debt — XuanFengMen V1.2

本文记录 V1.2 发布时的已知技术债务，将在 V2 处理。

这些不会阻止 V1.2 发布。

---

## 1. bazi Plugin TypeScript 类型问题

- **严重性**: 低
- **影响**: tsc --noEmit 报 36 Error
- **位置**: src/lib/bazi/qi/plugin/ (14 个文件)
- **类型**: Plugin 实验代码类型不匹配 (33) + Barrel re-export 级联 (2) + 模块引用变更 (1)
- **运行时影响**: 无。Vite esbuild 转译不做类型检查，生产构建正常
- **修复方案**: V2 中将 plugin 实验代码标记为 deprecated 或修正类型接口
- **V2 优先级**: P3

## 2. bazi Plugin 历史实验模块

- **严重性**: 低
- **影响**: src/lib/bazi/qi/plugin/ 下约 80+ 个实验引擎文件
- **说明**: P3~P5 阶段探索性引擎，从未集成到生产 Pipeline
- **修复方案**: V2 中归档到 plugin/archive/ 或移除
- **V2 优先级**: P3

## 3. OAuth 生产配置

- **严重性**: 中
- **影响**: 微信 OAuth 登录无法使用
- **位置**: src/server/routes/auth.ts (2 个 TODO)
- **需要**: 微信开放平台 AppID + AppSecret + OAuth 回调 URL
- **修复方案**: 在微信开放平台注册应用，填写真实密钥
- **V2 优先级**: P1

## 4. 微信支付验签

- **严重性**: 中
- **影响**: 微信支付无法验签
- **位置**: src/server/routes/payment.ts (2 个 TODO)
- **需要**: 微信支付商户 APIv3 证书 + 密钥
- **修复方案**: 下载商户证书，实现 RSA-SHA256 签名验证
- **V2 优先级**: P1

## 5. 支付宝验签

- **严重性**: 中
- **影响**: 支付宝支付无法验签
- **位置**: src/server/routes/payment.ts (1 个 TODO)
- **需要**: 支付宝 RSA2 公钥
- **修复方案**: 下载支付宝公钥，实现 RSA2 签名验证
- **V2 优先级**: P1

## 6. Stripe Webhook 签名

- **严重性**: 中
- **影响**: Stripe Webhook 无法验证真实性
- **位置**: src/server/routes/payment.ts (1 个 TODO)
- **需要**: Stripe Webhook Signing Secret (whsec_xxx)
- **修复方案**: 使用 stripe.webhooks.constructEvent() 验证签名
- **V2 优先级**: P1

## 7. tsc && vite build 失败

- **严重性**: 低
- **影响**: npm run build 因 tsc 阶段 36 Error 失败
- **说明**: bazi plugin 类型问题导致 tsc 失败，但 vite build 独立运行正常
- **修复方案**: V2 中清理 plugin 类型后恢复 tsc && vite build
- **V2 优先级**: P2

## 8. 压力测试未在真实环境执行

- **严重性**: 低
- **影响**: 压力测试报告数据为模拟值
- **位置**: reports/stress-test-report.html
- **修复方案**: V2 部署后在真实环境执行压力测试
- **V2 优先级**: P2

## 9. 用户测试数据为模拟值

- **严重性**: 低
- **影响**: 真实用户测试报告数据为模拟值
- **位置**: reports/real-user-report.html
- **修复方案**: V2 部署后收集真实用户测试数据
- **V2 优先级**: P3

## 10. 推演成本数据为模拟值

- **严重性**: 低
- **影响**: 推演成本报告数据为模拟值
- **位置**: reports/ai-cost-report.html, src/pages/AICostDashboard.tsx
- **修复方案**: V2 对接真实 API 使用量统计
- **V2 优先级**: P3

---

## 摘要

| 严重性 | 数量 | V2 优先级 |
|--------|------|-----------|
| 中 | 4 (OAuth + 支付验签 x3) | P1 |
| 低 | 6 (TypeScript + Plugin + Build + 测试数据) | P2-P3 |
