-- ══════════════════════════════════════════
--  六爻解卦记录表
-- ══════════════════════════════════════════
CREATE TABLE divinations (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id              text NOT NULL,
  question                text NOT NULL DEFAULT '',
  category                text NOT NULL DEFAULT 'general',
  hexagram_id             uuid NOT NULL REFERENCES hexagrams(id),
  hexagram_number         smallint NOT NULL,
  changed_hexagram_id     uuid REFERENCES hexagrams(id),
  changed_hexagram_number smallint,
  raw_lines               text[6] NOT NULL,    -- '老阳'|'少阳'|'老阴'|'少阴', index 0=初爻(底)
  changing_lines          integer[] NOT NULL DEFAULT '{}',  -- 变爻位置 1-6，无变爻为空
  ai_analysis             text,
  analysis_status         text NOT NULL DEFAULT 'pending',
  created_at              timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE divinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "divinations_select" ON divinations
  FOR SELECT USING (true);

CREATE POLICY "divinations_insert" ON divinations
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_divinations_visitor ON divinations (visitor_id, created_at DESC);
