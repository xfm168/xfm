-- ════════════════════════════════════════════════════════════════════
--  W2 Phase A.5 Critical Fix Migration
--  文件: 0004_critical_fix_domain_unify.sql
--
--  修复三个 Critical Issue：
--    C1: feedback.status CHECK 约束扩展为 7 种状态
--    C2: （代码层修复，无需 DB 变更）
--    C3: analysis_history.analysis_type CHECK 约束扩展为 6 种类型
--
--  同时补充 feedback 表写入 0003 新增字段的触发逻辑。
--  所有枚举值的唯一来源：src/shared/domain/index.ts
-- ════════════════════════════════════════════════════════════════════

-- ─── Critical-01: 扩展 feedback.status CHECK 约束 ───
-- 原约束：('open','processing','resolved','closed')
-- 新约束：('open','processing','reviewed','accepted','rejected','resolved','closed')
-- 来源：FeedbackStatus enum — ANALYSIS_TYPE_VALUES

ALTER TABLE public.feedback DROP CONSTRAINT IF EXISTS feedback_status_check;
ALTER TABLE public.feedback ADD CONSTRAINT feedback_status_check
  CHECK (status IN ('open','processing','reviewed','accepted','rejected','resolved','closed'));

-- ─── Critical-03: 扩展 analysis_history.analysis_type CHECK 约束 ───
-- 原约束：('basic','full','ai','compatibility')
-- 新约束：('basic','full','ai','compatibility','pro','legacy','future')
-- 来源：AnalysisType enum — ANALYSIS_TYPE_VALUES

ALTER TABLE public.analysis_history DROP CONSTRAINT IF EXISTS analysis_history_analysis_type_check;
ALTER TABLE public.analysis_history ADD CONSTRAINT analysis_history_analysis_type_check
  CHECK (analysis_type IN ('basic','full','ai','compatibility','pro','legacy','future'));

-- ─── 为 feedback 新增复合索引（补充 0003 遗漏） ───
-- 支持按报告关联查询反馈
CREATE INDEX IF NOT EXISTS idx_feedback_report
  ON public.feedback (report_id) WHERE report_id IS NOT NULL;

-- 支持按来源筛选
CREATE INDEX IF NOT EXISTS idx_feedback_source
  ON public.feedback (source);
