-- 用户通知表
CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'membership_expiry',    -- 会员到期提醒
    'membership_upgraded',  -- 会员升级成功
    'order_paid',           -- 订单支付成功
    'order_failed',         -- 订单支付失败
    'daily_fortune',        -- 每日运势提醒
    'report_ready',         -- 报告生成完成
    'system',               -- 系统通知
    'promotion',            -- 活动通知
    'feedback_reply',       -- 反馈回复
    'checkin_reward',       -- 签到奖励
    'badge_earned'          -- 获得徽章
  )),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 索引
CREATE INDEX idx_notifications_user_unread ON user_notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_user_created ON user_notifications(user_id, created_at DESC);

-- RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own" ON user_notifications FOR ALL USING (auth.uid() = user_id);