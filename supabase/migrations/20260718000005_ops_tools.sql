-- Banner 管理表
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  position TEXT NOT NULL DEFAULT 'home_top' CHECK (position IN ('home_top', 'home_middle', 'home_bottom', 'sidebar', 'popup')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 公告管理表
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'notice' CHECK (type IN ('notice', 'maintenance', 'promotion', 'feature', 'urgent')),
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 活动管理表
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'promotion' CHECK (type IN ('promotion', 'membership', 'seasonal', 'special', 'coupon_drop')),
  discount_type TEXT NOT NULL DEFAULT 'none' CHECK (discount_type IN ('none', 'percent', 'fixed', 'free_trial_days')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_tier TEXT DEFAULT NULL CHECK (min_tier IN ('free', 'basic', 'premium', 'vip')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 优惠券管理表
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL,
  min_order_cents INTEGER NOT NULL DEFAULT 0,
  max_uses INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_start TIMESTAMPTZ,
  valid_end TIMESTAMPTZ,
  applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'membership', 'report', 'addon')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 优惠券使用记录表
CREATE TABLE IF NOT EXISTS coupon_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(coupon_id, user_id)  -- 每个用户每张券只能用一次
);

-- 索引
CREATE INDEX idx_banners_active ON banners(is_active, sort_order);
CREATE INDEX idx_announcements_published ON announcements(is_published, published_at DESC);
CREATE INDEX idx_campaigns_active ON campaigns(is_active, start_at, end_at);
CREATE INDEX idx_coupons_active ON coupons(is_active, code);
CREATE INDEX idx_coupon_usages_coupon ON coupon_usages(coupon_id);
CREATE INDEX idx_coupon_usages_user ON coupon_usages(user_id);

-- RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usages ENABLE ROW LEVEL SECURITY;

-- Banner/公告/活动/优惠券：公开可读，管理员可增删改
CREATE POLICY "banners_read_all" ON banners FOR SELECT USING (true);
CREATE POLICY "banners_admin" ON banners FOR ALL USING (
  COALESCE((SELECT membership_tier FROM user_profiles WHERE id = auth.uid()), 'free') IN ('vip', 'premium')
);

CREATE POLICY "announcements_read_all" ON announcements FOR SELECT USING (true);
CREATE POLICY "announcements_admin" ON announcements FOR ALL USING (
  COALESCE((SELECT membership_tier FROM user_profiles WHERE id = auth.uid()), 'free') IN ('vip', 'premium')
);

CREATE POLICY "campaigns_read_all" ON campaigns FOR SELECT USING (true);
CREATE POLICY "campaigns_admin" ON campaigns FOR ALL USING (
  COALESCE((SELECT membership_tier FROM user_profiles WHERE id = auth.uid()), 'free') IN ('vip', 'premium')
);

CREATE POLICY "coupons_read_all" ON coupons FOR SELECT USING (true);
CREATE POLICY "coupons_admin" ON coupons FOR ALL USING (
  COALESCE((SELECT membership_tier FROM user_profiles WHERE id = auth.uid()), 'free') IN ('vip', 'premium')
);

CREATE POLICY "coupon_usages_own" ON coupon_usages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "coupon_usages_admin" ON coupon_usages FOR ALL USING (
  COALESCE((SELECT membership_tier FROM user_profiles WHERE id = auth.uid()), 'free') IN ('vip', 'premium')
);