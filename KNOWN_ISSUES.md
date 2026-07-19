# Known Issues — XuanFengMen V1.2

本文记录 V1.2 发布时的已知问题。这些问题不会阻止 V1.2 发布，将在后续版本中处理。

---

## 1. bazi plugin TypeScript 类型错误

- **严重性**: 低
- **状态**: 已知
- **数量**: 36 个 TypeScript Error
- **位置**: src/lib/bazi/qi/plugin/ (14 个文件)
- **说明**: 属于 P3~P5 阶段的历史实验 Plugin 引擎，使用了旧版类型接口。从未集成到生产 Pipeline。
- **运行时影响**: 无。Vite esbuild 转译不做类型检查，生产构建正常。
- **计划**: V2.0 中重构 Plugin 类型接口或归档废弃模块。

## 2. 微信 OAuth 生产配置

- **严重性**: 中
- **状态**: 等待配置
- **位置**: src/server/routes/auth.ts (2 个 TODO)
- **说明**: 微信 OAuth 登录功能框架已完成，但需要微信开放平台的 AppID 和 AppSecret 才能正式启用。
- **需要**: 在微信开放平台 (open.weixin.qq.com) 注册应用，获取 AppID + AppSecret，配置回调 URL。
- **计划**: V2.0 前完成配置，与微信登录功能同步上线。

## 3. 微信支付商户配置

- **严重性**: 中
- **状态**: 等待配置
- **位置**: src/server/routes/payment.ts (2 个 TODO)
- **说明**: 微信支付 SDK 封装和 API 端点已完成，但需要微信支付商户的 APIv3 证书和密钥才能启用验签。
- **需要**: 在微信支付商户平台 (pay.weixin.qq.com) 申请商户号，下载 APIv3 证书。
- **计划**: V2.0 前完成配置，与会员购买流程同步上线。

## 4. 支付宝 RSA2 公钥

- **严重性**: 中
- **状态**: 等待配置
- **位置**: src/server/routes/payment.ts (1 个 TODO)
- **说明**: 支付宝 SDK 封装和 API 端点已完成，但需要支付宝 RSA2 公钥才能启用验签。
- **需要**: 在支付宝开放平台 (open.alipay.com) 创建应用，获取 RSA2 公钥。
- **计划**: V2.0 前完成配置。

## 5. Stripe Webhook Secret

- **严重性**: 中
- **状态**: 等待配置
- **位置**: src/server/routes/payment.ts (1 个 TODO)
- **说明**: Stripe SDK 封装和 API 端点已完成，但需要 Stripe Webhook Signing Secret 才能验证 Webhook 真实性。
- **需要**: 在 Stripe Dashboard (dashboard.stripe.com) 获取 Webhook Signing Secret (whsec_xxx)。
- **计划**: V2.0 前完成配置。

---

## 声明

以上问题均不会阻止 V1.2 发布。支付相关功能在生产环境配置完成前将以 Mock 模式运行。
命理算法核心 (src/lib/bazi/ 非 plugin 部分) 不受任何已知问题影响，228 条回归测试全部通过。
