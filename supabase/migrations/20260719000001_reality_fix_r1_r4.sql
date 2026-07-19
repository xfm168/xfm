-- Reality Fix: 数据库一致性修复
-- R1: user_profiles 添加 role 列（支持真正的管理员权限）
-- R4a: user_profiles.membership_tier CHECK 对齐 Domain（free/basic/premium/vip）
-- R4b: monitoring_logs.category CHECK 扩展（添加 pdf_download, ai_usage, share）

-- ─────────────────────────────────────────────
--  R1: user_profiles.role
-- ─────────────────────────────────────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- 创建索引加速管理员查询
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- ─────────────────────────────────────────────
--  R4a: user_profiles.membership_tier CHECK 对齐 Domain
--  原 CHECK: ('free', 'pro', 'master') → 与 Domain/UserTier 不一致
--  Domain 定义: free, basic, premium, vip
-- ─────────────────────────────────────────────
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_membership_tier_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_membership_tier_check
  CHECK (membership_tier IN ('free', 'basic', 'premium', 'vip'));

-- ─────────────────────────────────────────────
--  R4b: monitoring_logs.category CHECK 扩展
--  原 CHECK 缺少 pdf_download, ai_usage, share
--  ─────────────────────────────────────────────
ALTER TABLE monitoring_logs DROP CONSTRAINT IF EXISTS monitoring_logs_category_check;
ALTER TABLE monitoring_logs ADD CONSTRAINT monitoring_logs_category_check
  CHECK (category IN (
    'web_vital',
    'js_error',
    'api_error',
    'api_slow',
    'unhandled_exception',
    'migration_status',
    'slow_query',
    'pdf_download',
    'ai_usage',
    'share'
  ));
