-- ══════════════════════════════════════════
--  风水勘测报告表（免费 + 付费深度报告）
-- ══════════════════════════════════════════
CREATE TABLE fengshui_reports (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id     text        NOT NULL,
  image_url      text,
  room_type      text        NOT NULL,
  basic_score    smallint,
  basic_analysis jsonb,
  premium_report jsonb,
  payment_status text        NOT NULL DEFAULT 'free',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fengshui_reports ENABLE ROW LEVEL SECURITY;

-- No auth in this app — visitor_id provides soft ownership tracking
CREATE POLICY "fs_reports_select" ON fengshui_reports
  FOR SELECT USING (true);

CREATE POLICY "fs_reports_insert" ON fengshui_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "fs_reports_update" ON fengshui_reports
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE INDEX idx_fengshui_reports_visitor
  ON fengshui_reports (visitor_id, created_at DESC);
