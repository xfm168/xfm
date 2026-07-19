-- V1.1-A: Orders, Payments, Refunds, Transactions tables
-- Updated: 2026-07-18 — Domain v2 CHECK 对齐（合并原 0005_migration）
-- 说明：本文件同时包含表创建和 CHECK 约束对齐，确保从零环境可一次执行

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_no TEXT NOT NULL UNIQUE,
  product_type TEXT NOT NULL CHECK (product_type IN ('membership', 'report', 'addon', 'credits')),
  product_id TEXT,
  product_name TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  discount_cents INTEGER NOT NULL DEFAULT 0,
  final_amount_cents INTEGER NOT NULL CHECK (final_amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'CNY',
  payment_method TEXT CHECK (payment_method IN ('wechat', 'alipay', 'stripe', 'free')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'expired', 'refunded')),
  paid_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments table
CREATE TABLE IF NOT EXISTS v11_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('wechat', 'alipay', 'stripe')),
  provider_payment_id TEXT,
  provider_order_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CNY',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'expired')),
  paid_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES v11_payments(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  refund_no TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions table (ledger)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('payment', 'refund', 'credits_purchase', 'credits_spend', 'points_earn', 'points_spend', 'invitation_reward')),
  amount_cents INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles table (for V1.1-B)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  membership_tier TEXT NOT NULL DEFAULT 'free' CHECK (membership_tier IN ('free', 'pro', 'master')),
  membership_expires_at TIMESTAMPTZ,
  points_balance INTEGER NOT NULL DEFAULT 0,
  total_spent_cents INTEGER NOT NULL DEFAULT 0,
  total_charts INTEGER NOT NULL DEFAULT 0,
  total_analyses INTEGER NOT NULL DEFAULT 0,
  invitation_code TEXT UNIQUE,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON orders(order_no);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_v11_payments_order_id ON v11_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_v11_payments_user_id ON v11_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_invitation_code ON user_profiles(invitation_code);

-- RLS Policies
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE v11_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own payments" ON v11_payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON v11_payments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own refunds" ON refunds FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own refunds" ON refunds FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- ════════════════════════════════════════════════════════════════════
-- Domain v2 CHECK 对齐（原 0005_domain_v2_db_align.sql 合并）
-- Date: 2026-07-18
-- 说明：将 CHECK 约束修正为 Domain v2.1 Enterprise 定义
-- ════════════════════════════════════════════════════════════════════

-- ── user_profiles.membership_tier → Domain UserTier ──
-- Domain v2: free, basic, premium, vip（原: free, pro, master）
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_membership_tier_check;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_membership_tier_check
CHECK (membership_tier IN ('free', 'basic', 'premium', 'vip'));

-- ── v11_payments.status → Domain PaymentStatus ──
-- Domain v2: pending, paid, failed, refunded, cancelled（原: pending, processing, success, failed, expired）
ALTER TABLE public.v11_payments
DROP CONSTRAINT IF EXISTS v11_payments_status_check;

ALTER TABLE public.v11_payments
ADD CONSTRAINT v11_payments_status_check
CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled'));

-- ── refunds.status → Domain RefundStatus ──
-- Domain v2: pending, processing, succeeded, failed（原: pending, processing, success, failed）
-- 注意：表名是 refunds（不是 v11_refunds）
ALTER TABLE public.refunds
DROP CONSTRAINT IF EXISTS refunds_status_check;

ALTER TABLE public.refunds
ADD CONSTRAINT refunds_status_check
CHECK (status IN ('pending', 'processing', 'succeeded', 'failed'));

-- ── users.membership_tier 确认索引 ──
CREATE INDEX IF NOT EXISTS idx_users_membership_tier
ON public.users (membership_tier);
