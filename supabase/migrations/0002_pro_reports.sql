-- Pro Report 扩展：为 analysis_history 表添加 engine_version 字段
-- 支持区分不同引擎版本生成的报告

ALTER TABLE analysis_history
ADD COLUMN IF NOT EXISTS engine_version TEXT;

-- 为 pro 类型分析创建索引
CREATE INDEX IF NOT EXISTS idx_analysis_history_pro
ON analysis_history (user_id, analysis_type, created_at DESC)
WHERE analysis_type IN ('pro', 'legacy');

-- 添加注释
COMMENT ON COLUMN analysis_history.engine_version IS '生成报告的引擎版本，例如 V5.0 GA';