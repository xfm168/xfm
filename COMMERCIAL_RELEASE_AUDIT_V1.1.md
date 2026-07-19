# 玄风门 V1.1 — Commercial Release Audit Report

**Audit Date:** 2026-07-18
**Auditor:** Automated Code Review
**Version:** V1.1
**Scope:** Part 6 (商业体验优化) + Part 7 (Commercial Release Audit)

---

## Part 6 Completion: 商业体验优化

### 6a. MembershipBenefits.tsx — CREATED
- File: `/workspace/xuanfengmen1/src/components/business/MembershipBenefits.tsx`
- Status: Created per specification. 4-tier comparison (free/basic/premium/vip) with React.createElement pattern.

### 6b. MembershipBenefits.css — CREATED
- File: `/workspace/xuanfengmen1/src/components/business/MembershipBenefits.css`
- Status: Created per specification. Black-gold design (#12151e, #c9952d). Responsive grid (4col -> 2col -> 1col).

### 6c. UsageCounter.tsx — CREATED
- File: `/workspace/xuanfengmen1/src/components/business/UsageCounter.tsx`
- Status: Created per specification. Progress bar with 3-tier color coding (good/warn/danger).

### 6d. UsageCounter.css — CREATED
- File: `/workspace/xuanfengmen1/src/components/business/UsageCounter.css`
- Status: Created per specification. Minimal styling, color-coded bar states.

---

## Part 7: Commercial Release Audit

### 7.1 商业闭环完成率

**Score: 82/100**

**Step-by-step verification:**

| Step | Component | Status | Notes |
|------|-----------|--------|-------|
| 首页 | `pages/Home.tsx` | EXISTS | Feature cards with navigation to core functions |
| 注册 | `hooks/useAuth.ts` + `pages/Login.tsx` | EXISTS | Email/password, OTP, Google/Apple OAuth |
| 免费体验一次（排盘）| `pages/BaziInput.tsx` | EXISTS | Full birth data input, navigates to BaziChart |
| 普通（截断）报告 | `pages/Analysis.tsx` + permission.ts | EXISTS | `TIER_CAPABILITIES['free']` limits to BASIC_REPORT |
| 升级提示 | `pages/Membership.tsx` | EXISTS | Full 4-tier plan display, upgrade hooks |
| 会员购买 | `hooks/useOrder.ts` + `hooks/usePaymentV2.ts` | EXISTS | Order creation via `/api/payment/create-order` |
| 支付 | `server/routes/payment.ts` | EXISTS | WeChat/Alipay/Stripe webhook endpoints |
| 自动升级 | `payment.ts` confirm + webhooks | EXISTS | Tier upgrade in user_profiles on paid status |
| 完整 VIP 报告 | `pages/PremiumReport.tsx` + `pages/ProReportPage.tsx` | EXISTS | Pro engine access for premium/vip |
| PDF 下载 | `server/lib/generatePdf.ts` + `lib/fengshui/v31/pdf/` | EXISTS | PDFKit server-side + client-side html2canvas fallback |
| 保存历史 | `hooks/useProHistory.ts` + `pages/BaziHistory.tsx` | EXISTS | Server-side history + migration from localStorage |
| 个人中心 | `pages/UserCenter.tsx` | EXISTS | 8 tabs: overview/analysis/orders/payments/membership/points/coupons/invite |

**Blockers:**
- Home page does NOT have a direct "try for free" CTA that forces login before first use. The flow allows unauthenticated users to navigate to BaziInput. There is no explicit "register to try" gate.
- MembershipBenefits component is created but NOT yet integrated into any page route (not imported in App.tsx or Membership.tsx).

---

### 7.2 收费流程完成率

**Score: 78/100**

| Item | File | Status | Notes |
|------|------|--------|-------|
| 订单创建 API | `server/routes/payment.ts` POST `/create-order` | EXISTS | authRequired, product validation, amount calculation |
| 微信支付创建 | `lib/payment/stripePay.ts` + payment.ts | PARTIAL | Stripe SDK wrapper exists with mock fallback. WeChat/Alipay real SDK integration is NOT present -- only webhook handlers. No `createPayment` API that returns QR codes or redirect URLs. |
| 支付确认 | payment.ts POST `/confirm` | EXISTS | Updates order, creates payment record, upgrades tier |
| Webhook 验签 | payment.ts (3 webhook routes) | EXISTS | HMAC-SHA256 verification for all 3 providers |
| 幂等保护 | payment.ts `isEventProcessed()` | EXISTS | Checks webhook_events table for duplicate event_id |
| 自动升级 tier | payment.ts confirm + webhooks | EXISTS | Consistent tier upgrade logic across all 3 paths |
| 前端状态刷新 | `hooks/usePaymentPolling.ts` | EXISTS | 2-second polling for 2 minutes, detects tier change |
| PDF 导出 | `server/lib/generatePdf.ts` + v31/pdf | EXISTS | Server-side PDFKit + client-side fallback |

**Blockers:**
- **No real payment channel integration**: `stripePay.ts` only has mock data when not configured. There is no WeChat Pay JSAPI/QR code generation or Alipay page redirect implementation. The `confirmPayment` hook sends to `/api/payment/confirm` but this endpoint directly marks orders as paid without actual payment gateway interaction.
- **Price inconsistency**: `membership.ts` lists basic=19yuan, premium=39yuan, vip=99yuan. `payment.ts` PRODUCT_PRICES lists basic=99yuan, premium=299yuan, vip=999yuan. `MembershipBenefits.tsx` shows 29/99/299. `Membership.tsx` page shows 29/69/129. Four different price sets exist.
- The `usePaymentPolling.ts` token retrieval directly reads from localStorage with a hardcoded key (`sb-xuanfengmen-auth-token`) rather than using the Supabase client, which is fragile.

---

### 7.3 用户留存能力

**Score: 75/100**

| Feature | Implementation | Status |
|---------|---------------|--------|
| 使用次数限制 | `lib/domain/usageLimit.ts` TIER_LIMITS | EXISTS | Free: 3 charts/day, 1 analysis. Premium/VIP: 999 (unlimited) |
| 历史记录 | `hooks/useProHistory.ts`, `pages/BaziHistory.tsx`, `pages/History.tsx` | EXISTS | Server-side + localStorage fallback + migration |
| 积分系统 | `lib/business/points.ts`, `hooks/usePoints.ts` | EXISTS | Earn rate, redeem rate, daily limits, freeze/unfreeze |
| 优惠券系统 | `lib/business/coupon.ts`, `hooks/useCoupons.ts` | EXISTS | Validate, apply, fixed/percent discount types |
| 邀请码 | `lib/business/invitation.ts` | EXISTS | Generate, validate, reward points |
| 成长体系 | `lib/business/growth.ts` | EXISTS | 10 levels (0-9), from "初入江湖" to "大道无极" |

**Blockers:**
- Usage limits are defined in `usageLimit.ts` but NOT enforced server-side on the `/api/bazi` or `/api/analyze` routes. The `user-extended.ts` route reads limits but there is no middleware or check that rejects requests when daily quota is exceeded. Enforcement is client-side only.
- Points system operates via localStorage on the client with an optional API sync. No server-side points deduction validation exists.
- Growth levels in `growth.ts` (10 levels) differ from `Membership.tsx` page (4 levels). Inconsistency.

---

### 7.4 支付安全

**Score: 85/100**

| Item | Status | Evidence |
|------|--------|----------|
| Webhook 验签 (GA-1) | EXISTS | `verifyWechatSignature`, `verifyAlipaySignature`, `verifyStripeSignature` in payment.ts. All use HMAC-SHA256 with WEBHOOK_SECRET. |
| 幂等保护 | EXISTS | `isEventProcessed()` checks webhook_events table before processing. Duplicate events return early. |
| CORS 白名单 (GA-2) | EXISTS | `server/index.ts` implements CORS via Hono cors middleware. Production: ALLOWED_ORIGINS env var required, otherwise rejects all cross-origin. Dev: allows localhost. |
| JWT authRequired | EXISTS | `server/middleware/auth.ts` uses Supabase `getUser(token)` for JWT validation. No dev fallback in authRequired. Timing-safe comparison for admin tokens. |
| Rate Limiting | EXISTS | `server/middleware/rateLimiter.ts` -- 100 req/min per IP:path. In-memory only (noted for multi-instance). |
| Monitoring | EXISTS | `server/middleware/monitoring.ts` -- slow request logging when MONITOR_ENABLED=1. Flushes to Supabase. |

**Blockers:**
- Webhook signature verification uses HMAC-SHA256 as a simplified approach. The code comments acknowledge that real WeChat Pay V3 requires RSA with platform certificates, and real Alipay requires RSA2 with public key. The current implementation is a placeholder that would need replacement for production.
- Rate limiter uses in-memory Map, which does not work across multiple server instances. No Redis integration.
- The Stripe webhook signature verification does not follow Stripe's official sv1 construction (it builds base64 from raw payload rather than from the timestamp.payload format Stripe uses).

---

### 7.5 商业价值

**Score: 70/100**

**4-Tier Value Differentiation:**

| Aspect | Assessment |
|--------|-----------|
| Value differentiation | MODERATE | Free has 3 charts/1 analysis (strong gate). Premium unlocks unlimited + AI. VIP adds priority support + early access. However, "未来情侣合盘" and "未来专家分析" in the MembershipBenefits component are listed as VIP features but do not exist yet. |
| Price reasonableness | INCONSISTENT | 4 different price sets found across files. The market cannot be evaluated without a definitive pricing strategy. |
| Feature unlock gradient | GOOD | Clear progression: Free (basic) -> Basic (save + basic AI) -> Premium (unlimited + PDF + advanced AI) -> VIP (priority + exclusive). The `permission.ts` 4-tier capability system is well-designed. |
| AI value-add | GOOD | AI analysis is gated behind premium tier. AI credits system (monthly allocation) creates recurring value. However, `canPerformAction` in usageLimit.ts has a bug: `case 'chart': return limits.dailyCharts > 5` means basic (10 charts) would return true, but free (3 charts) returns false -- the threshold should be `> 0`, not `> 5`. |

**Blockers:**
- **Critical pricing inconsistency**: Must unify to a single source of truth.
- **Nonexistent features advertised**: "未来情侣合盘" and "未来专家分析" are promised but not implemented.
- `usageLimit.ts` `canPerformAction` logic is incorrect for the 'chart' and 'analysis' cases (threshold `> 5` excludes basic tier incorrectly).

---

### 7.6 产品成熟度

**Score: 80/100**

| Aspect | Score | Notes |
|--------|-------|-------|
| Core functionality | 85 | Bazi calculation, fengshui analysis, divination, daily hexagram all exist. Pro engine with 100+ submodules. |
| Error handling | 85 | ErrorBoundary component, GlobalErrorHandler, unified error middleware, monitoring. |
| Mobile adaptation | 75 | MembershipBenefits.css has responsive breakpoints (768px, 480px). History page and other pages use CSS layouts. However, no dedicated mobile-first design system. |
| SEO | 70 | `usePageSEO` hook handles title, description, keywords, OG tags, canonical, robots. Client-side only -- no SSR/SSG, so search engine crawling is limited. |
| Monitoring | 75 | Slow request logging, health check endpoint, rate limiting headers. No alerting, no dashboard, no error tracking service (Sentry etc.). |

**Blockers:**
- No SSR/SSG -- all pages are client-side rendered, limiting SEO effectiveness for a commercial product.
- No external error tracking service integration (Sentry, LogRocket, etc.).
- `usePoints.ts` and `useCoupons.ts` modify points/coupons client-side via localStorage with optional server sync. This means a user could manipulate their points balance locally.

---

## Final Scoring Summary

| Category | Score | Weight | Weighted |
|----------|-------|--------|----------|
| 7.1 商业闭环完成率 | 82 | 25% | 20.5 |
| 7.2 收费流程完成率 | 78 | 25% | 19.5 |
| 7.3 用户留存能力 | 75 | 15% | 11.25 |
| 7.4 支付安全 | 85 | 15% | 12.75 |
| 7.5 商业价值 | 70 | 10% | 7.0 |
| 7.6 产品成熟度 | 80 | 10% | 8.0 |
| **TOTAL** | | **100%** | **79.0** |

---

## Final Verdict

# **NOT READY**

**Overall Score: 79/100** (threshold for Commercial Ready: 85)

### Critical Blockers (Must Fix Before Release)

1. **No real payment channel integration** -- The payment flow is entirely simulated. `stripePay.ts` returns mock data. No WeChat Pay JSAPI/QR or Alipay redirect exists. Users cannot actually pay money.

2. **Price inconsistency across 4 files** -- `membership.ts` (19/39/99), `payment.ts` PRODUCT_PRICES (99/299/999), `MembershipBenefits.tsx` (29/99/299), `Membership.tsx` (29/69/129). Must unify to a single source of truth.

3. **Server-side usage limit enforcement missing** -- `usageLimit.ts` defines limits but `/api/bazi` and `/api/analyze` routes do not check daily quotas. Free users can make unlimited API calls directly.

4. **Nonexistent features advertised to paying users** -- "未来情侣合盘" and "未来专家分析" are listed as VIP features but have zero implementation.

### High-Priority Items (Should Fix)

5. **`usageLimit.ts` `canPerformAction` bug** -- `> 5` threshold incorrectly gates basic tier (10 charts returns true when it should also return true for lower tiers; the function design is inverted).

6. **Client-side points manipulation** -- `usePoints.ts` `addPoints`/`spendPoints` operate on localStorage without server validation.

7. **Webhook signature verification is placeholder** -- Real WeChat V3 (RSA) and Alipay (RSA2) signatures are not implemented; HMAC-SHA256 is a simplification.

8. **MembershipBenefits and UsageCounter components not integrated** -- Created but not imported in any page or routing.

### Recommended Actions

- Unify pricing into a single `PRODUCT_PRICES` constant in `payment.ts` and reference it everywhere.
- Add server-side middleware to `/api/bazi` and `/api/analyze` that checks daily usage against `TIER_LIMITS`.
- Integrate real Stripe Checkout Session creation (at minimum) for international payments.
- Remove or clearly mark future/nonexistent features in MembershipBenefits.
- Add `MembershipBenefits` to the `/membership` page and `UsageCounter` to the analysis/bazi pages.