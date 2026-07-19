-- V1.2 用户成长体系：签到 + 徽章 + 等级 + 积分 + 成长值

-- 用户签到表
CREATE TABLE IF NOT EXISTS user_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  consecutive_days INTEGER NOT NULL DEFAULT 1,
  reward_points INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);
CREATE INDEX idx_checkins_user ON user_checkins(user_id, checkin_date DESC);

-- 用户徽章表
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_desc TEXT,
  badge_icon TEXT,  -- emoji or icon name
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
CREATE INDEX idx_badges_user ON user_badges(user_id);

-- 用户成长值表
CREATE TABLE IF NOT EXISTS user_growth (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  growth_points INTEGER NOT NULL DEFAULT 0,      -- 成长值（永久）
  growth_level INTEGER NOT NULL DEFAULT 1,      -- 成长等级
  checkin_streak INTEGER NOT NULL DEFAULT 0,     -- 当前连续签到天数
  last_checkin_date DATE,
  charts_streak INTEGER NOT NULL DEFAULT 0,     -- 当前连续排盘天数
  last_chart_date DATE,
  total_checkins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE user_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checkins_own" ON user_checkins FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_own" ON user_badges FOR ALL USING (auth.uid() = user_id);

ALTER TABLE user_growth ENABLE ROW LEVEL SECURITY;
CREATE POLICY "growth_own" ON user_growth FOR ALL USING (auth.uid() = user_id);
