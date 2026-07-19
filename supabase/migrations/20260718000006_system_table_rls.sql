-- webhook_events: 仅 service_role 可写，anon key 无法操作
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_events_service_write" ON webhook_events
  FOR ALL USING (true) WITH CHECK (false);
-- 注意：Supabase service_role key 自动绕过 RLS，所以不需要额外的 USING 策略
-- 但需要启用 RLS 以防止 anon key 访问

-- monitoring_logs: 仅 service_role 可写
ALTER TABLE monitoring_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monitoring_logs_service_write" ON monitoring_logs
  FOR ALL USING (true) WITH CHECK (false);

-- feedback.source CHECK 约束（如果不存在）
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'feedback_source_check') THEN
    ALTER TABLE feedback ADD CONSTRAINT feedback_source_check CHECK (source IN ('general', 'report'));
  END IF;
END $$;