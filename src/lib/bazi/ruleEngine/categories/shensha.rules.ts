/**
 * 神煞规则统一目录（V③ RuleEngine 统一分类目录）
 *
 * 开发指南：
 * 1. 所有神煞（shensha）相关的规则，统一在此文件中调用 registerRule() 注册
 * 2. 规则按 priority 从小到大排序（数字越小优先级越高，先执行）
 * 3. 规则 id 命名规范：SHENSHA-{序号三位数}，如 SHENSHA-001、SHENSHA-012
 * 4. evaluate 函数返回 EvidenceBundle（遵循 V④ 三元约定，上游再包装为 StandardInferenceResult）
 *
 * 示例：
 *   import { registerRule } from '../ruleRegistry';
 *
 *   registerRule({
 *     id: 'SHENSHA-001',
 *     name: '天乙贵人',
 *     category: 'shensha',
 *     description: '命中带天乙贵人，主逢凶化吉',
 *     priority: 1,
 *     evaluate: (input, context) => {
 *       // ... 判定逻辑
 *       return {
 *         conclusion: '命中带天乙贵人',
 *         direction: 'good',
 *         items: [ ... ],
 *         coreSatisfied: 1,
 *         coreTotal: 1,
 *         counterHits: 0,
 *         counterThreshold: 1,
 *       };
 *     },
 *   });
 */

import { registerRule } from '../ruleRegistry';

registerRule({
  id: 'SHENSHA-PLACEHOLDER-000',
  name: '神煞规则占位（以后删除）',
  category: 'shensha',
  description: '所有神煞规则统一在此目录注册',
  evaluate: () => ({
    conclusion: '',
    direction: 'neutral' as const,
    items: [],
    coreSatisfied: 0,
    coreTotal: 0,
    counterHits: 0,
    counterThreshold: 0,
  }),
  priority: 9999,
});
