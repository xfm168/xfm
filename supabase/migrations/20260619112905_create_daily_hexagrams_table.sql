-- ══════════════════════════════════════════
--  用户每日卦运记录表
--  Phase 1: visitor_id (localStorage UUID)
--  Phase 2: 可添加 user_id FK to auth.users
-- ══════════════════════════════════════════
CREATE TABLE daily_hexagrams (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id      text NOT NULL,
  date            date NOT NULL,
  hexagram_id     uuid NOT NULL REFERENCES hexagrams(id),
  hexagram_number smallint NOT NULL,
  score           smallint NOT NULL CHECK (score BETWEEN 1 AND 100),
  career_score    smallint NOT NULL CHECK (career_score BETWEEN 1 AND 100),
  wealth_score    smallint NOT NULL CHECK (wealth_score BETWEEN 1 AND 100),
  love_score      smallint NOT NULL CHECK (love_score BETWEEN 1 AND 100),
  health_score    smallint NOT NULL CHECK (health_score BETWEEN 1 AND 100),
  lucky_color     text NOT NULL,
  lucky_number    smallint NOT NULL,
  analysis        text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (visitor_id, date)
);

ALTER TABLE daily_hexagrams ENABLE ROW LEVEL SECURITY;

-- Phase 1: 公开读写（基于 visitor_id 过滤在应用层处理）
-- Phase 2 升级时换为 auth.uid() = user_id 的策略
CREATE POLICY "daily_hexagrams_select" ON daily_hexagrams
  FOR SELECT USING (true);

CREATE POLICY "daily_hexagrams_insert" ON daily_hexagrams
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_daily_hexagrams_visitor_date ON daily_hexagrams (visitor_id, date);
