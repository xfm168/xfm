-- Webhook 事件日志表
-- 记录所有支付回调，支持验签审计和幂等保护

CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  event_id TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('wechat', 'alipay', 'stripe')),
  signature_status TEXT NOT NULL CHECK (signature_status IN ('verified', 'failed', 'skipped')),
  payload_hash TEXT,
  order_no TEXT,
  outcome TEXT NOT NULL CHECK (outcome IN ('processed', 'rejected', 'duplicate', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 幂等保护：同一 event_id 只能存在一条记录
CREATE UNIQUE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);

-- 查询索引
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);