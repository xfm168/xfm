-- 反馈增强：为 feedback 表添加报告关联字段

-- 添加反馈来源字段（区分通用反馈 vs 报告反馈）
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'general';

-- 添加关联的报告 ID
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS report_id TEXT;

-- 添加引擎版本
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS engine_version TEXT;

-- 添加用户等级
ALTER TABLE feedback 
ADD COLUMN IF NOT EXISTS user_tier TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_feedback_report 
ON feedback (report_id) WHERE report_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_source 
ON feedback (source);

-- 注释
COMMENT ON COLUMN feedback.source IS '反馈来源：general(通用反馈) 或 report(报告反馈)';
COMMENT ON COLUMN feedback.report_id IS '关联的专业报告 ID';
COMMENT ON COLUMN feedback.engine_version IS '报告引擎版本';
COMMENT ON COLUMN feedback.user_tier IS '提交反馈时的用户等级';
