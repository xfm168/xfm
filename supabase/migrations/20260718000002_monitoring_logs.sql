-- 监控日志表
-- 记录前端 Web Vitals 和后端 API 异常

CREATE TABLE IF NOT EXISTS monitoring_logs (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('frontend', 'backend', 'database')),
  category TEXT NOT NULL CHECK (category IN (
    'web_vital',
    'js_error',
    'api_error',
    'api_slow',
    'unhandled_exception',
    'migration_status',
    'slow_query'
  )),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error', 'critical')),
  name TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  path TEXT,
  message TEXT,
  stack TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 查询索引
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_source ON monitoring_logs(source);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_category ON monitoring_logs(category);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_level ON monitoring_logs(level);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_created_at ON monitoring_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_monitoring_logs_name ON monitoring_logs(name);

-- 分区策略提示：超过 30 天的数据可归档
-- CREATE POLICY monitoring_logs_retention ON monitoring_logs AS DELETE USING (created_at < now() - interval '30 days');