export * from './types';
export {
  registry,
  registerRule,
  registerSandboxRule,
  promoteRule,
  demoteRule,
  getSandboxRules,
  getRuleById,
  getRulesByTags,
  getRulesByCategory,
  getExecutionOrder,
  clearCache,
  initBuiltinRules,
} from './ruleRegistry';
export * from './evidenceEngine';
export * from './confidenceEngine';
export * as TraceEngine from './evidence/traceEngine';
export * from './evidence/evidenceTree';
export * from './categories';

// P0-A7 Rule Sandbox
export * from './sandbox';

// C6-4 Explainable Rule Engine
export * from './explainableRule';

// C8 Rule Quality Center
export * from './quality';

// V③ 保证导入本 index 时，所有分类目录的规则文件被加载（registerRule 副作用执行）
// 放在最底部避免循环依赖
import './categories';

