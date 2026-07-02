-- ════════════════════════════════════════════════════════════════════
--  玄风门八字命理平台 - 核心数据模型初始化
--  文件: 0001_init.sql
-- ════════════════════════════════════════════════════════════════════
--  用法：
--    supabase db push            # 本地推送到远端
--    supabase migration up       # 应用所有迁移
--    或在 Supabase Dashboard 的 SQL Editor 中直接执行本文件。
--
--  设计要点：
--    1. public.users 扩展自 Supabase auth.users（FK + ON DELETE CASCADE）
--    2. 所有业务表均启用 RLS：用户只能访问自己的数据，admin 角色可访问全部
--    3. 通用 updated_at 触发器自动维护更新时间
--    4. 为高频查询字段（user_id / chart_id / created_at / status）建立索引
-- ════════════════════════════════════════════════════════════════════

-- 启用扩展（gen_random_uuid 依赖 pgcrypto；较新 Supabase 已内置 pgcrypto/pg16+）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════════════════
--  通用：updated_at 触发器函数
-- ════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════════
--  1. 用户表（扩展 Supabase auth.users）
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free','basic','premium','vip')),
  membership_expires_at TIMESTAMPTZ,
  total_charts INTEGER DEFAULT 0,
  total_analyses INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_users_membership
  ON public.users (membership_tier, membership_expires_at);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 用户只能读/写自己的资料；admin 角色可访问全部
CREATE POLICY "users_select_own_or_admin" ON public.users
  FOR SELECT USING (
    auth.uid() = id
    OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ════════════════════════════════════════════════════════════════════
--  2. 命盘表
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT,                       -- 用户给命盘起的名字，如"张三的八字"
  birth_date DATE NOT NULL,        -- 公历日期
  birth_time TEXT NOT NULL,        -- "08:30" 格式
  birth_time_unknown BOOLEAN DEFAULT FALSE,
  gender TEXT NOT NULL CHECK (gender IN ('male','female')),
  birthplace TEXT,
  timezone TEXT,
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  zishi_strategy TEXT DEFAULT 'late' CHECK (zishi_strategy IN ('late','early','gregorian')),
  use_solar_time BOOLEAN DEFAULT TRUE,
  -- 排盘结果（JSON）
  chart_data JSONB NOT NULL,       -- 完整 BaZiChart
  chart_meta JSONB,                -- {strategy, snapshot_version, ...}
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_charts_updated_at
  BEFORE UPDATE ON public.charts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_charts_user_created
  ON public.charts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_charts_public
  ON public.charts (is_public, created_at DESC) WHERE is_public = TRUE;

ALTER TABLE public.charts ENABLE ROW LEVEL SECURITY;

-- 所有者可读写；公开命盘可被任意访问者读取；admin 可访问全部
CREATE POLICY "charts_select_owner_or_public" ON public.charts
  FOR SELECT USING (
    user_id = auth.uid()
    OR is_public = TRUE
    OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

CREATE POLICY "charts_insert_own" ON public.charts
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

CREATE POLICY "charts_update_own" ON public.charts
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "charts_delete_own" ON public.charts
  FOR DELETE USING (
    user_id = auth.uid()
    OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

-- ════════════════════════════════════════════════════════════════════
--  3. 分析历史表
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  chart_id UUID REFERENCES public.charts(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('basic','full','ai','compatibility')),
  -- 分析结果
  result JSONB NOT NULL,
  -- 元数据
  ai_model TEXT,
  ai_tokens_used INTEGER,
  duration_ms INTEGER,
  -- 状态
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending','processing','completed','failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_user_created
  ON public.analysis_history (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_chart
  ON public.analysis_history (chart_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_status
  ON public.analysis_history (status, created_at DESC);

ALTER TABLE public.analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analysis_select_own_or_admin" ON public.analysis_history
  FOR SELECT USING (
    user_id = auth.uid()
    OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

CREATE POLICY "analysis_insert_own" ON public.analysis_history
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

CREATE POLICY "analysis_update_own" ON public.analysis_history
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "analysis_delete_own" ON public.analysis_history
  FOR DELETE USING (
    user_id = auth.uid()
    OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

-- ════════════════════════════════════════════════════════════════════
--  4. 用户反馈表
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  chart_id UUID REFERENCES public.charts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug','feature','accuracy','other')),
  severity TEXT DEFAULT 'normal' CHECK (severity IN ('low','normal','high','critical')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  contact TEXT,
  -- 处理状态
  status TEXT DEFAULT 'open' CHECK (status IN ('open','processing','resolved','closed')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  resolution TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_feedback_status_created
  ON public.feedback (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_user
  ON public.feedback (user_id, created_at DESC);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 提交者可读取自己的反馈；admin 可访问全部
CREATE POLICY "feedback_select_own_or_admin" ON public.feedback
  FOR SELECT USING (
    user_id = auth.uid()
    OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

-- 允许已登录用户提交反馈（user_id 必须为本人）
CREATE POLICY "feedback_insert_own" ON public.feedback
  FOR INSERT WITH CHECK (
    user_id IS NULL OR user_id = auth.uid()
  );

CREATE POLICY "feedback_update_admin" ON public.feedback
  FOR UPDATE USING (
    COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

CREATE POLICY "feedback_delete_admin" ON public.feedback
  FOR DELETE USING (
    COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

-- ════════════════════════════════════════════════════════════════════
--  5. 使用日志表
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,            -- 'chart_create','analysis','ai_call', etc
  resource_type TEXT,             -- 'chart','analysis', etc
  resource_id UUID,
  -- 详细信息
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  -- 用量统计
  tokens_used INTEGER DEFAULT 0,
  cost_cents INTEGER DEFAULT 0,   -- 成本（分）
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_created
  ON public.usage_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_created
  ON public.usage_logs (action, created_at DESC);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的用量日志；写入由 service_role（服务端）完成
CREATE POLICY "usage_logs_select_own_or_admin" ON public.usage_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

CREATE POLICY "usage_logs_insert_admin" ON public.usage_logs
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

-- ════════════════════════════════════════════════════════════════════
--  6. 支付记录表（预留）
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  -- 订单信息
  order_no TEXT UNIQUE NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('membership','report','addon','credits')),
  product_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'CNY',
  -- 支付信息
  payment_method TEXT,             -- 'wechat','alipay','stripe'
  payment_provider_order_id TEXT,
  payment_provider_transaction_id TEXT,
  paid_at TIMESTAMPTZ,
  -- 状态
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded','cancelled')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_payments_user_created
  ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created
  ON public.payments (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_order_no
  ON public.payments (order_no);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payments_select_own_or_admin" ON public.payments
  FOR SELECT USING (
    user_id = auth.uid()
    OR COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

-- 写入与更新由服务端 service_role 完成
CREATE POLICY "payments_insert_admin" ON public.payments
  FOR INSERT WITH CHECK (
    COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

CREATE POLICY "payments_update_admin" ON public.payments
  FOR UPDATE USING (
    COALESCE((auth.jwt() ->> 'role'), '') = 'service_role'
  );

-- ════════════════════════════════════════════════════════════════════
--  END 0001_init.sql
-- ════════════════════════════════════════════════════════════════════
