/**
 * 格局规则统一目录（V③ RuleEngine 统一分类目录）
 *
 * 开发指南：
 * 1. 所有格局（geju）相关的规则，统一在此文件中调用 registerRule() 注册
 * 2. 规则按 priority 从小到大排序（数字越小优先级越高，先执行）
 * 3. 规则 id 命名规范：GEJU-{序号三位数}，如 GEJU-001、GEJU-012
 * 4. evaluate 函数返回 EvidenceBundle（遵循 V④ 三元约定，上游再包装为 StandardInferenceResult）
 *
 * 示例：
 *   import { registerRule } from '../ruleRegistry';
 *
 *   registerRule({
 *     id: 'GEJU-001',
 *     name: '正官格',
 *     category: 'geju',
 *     description: '月令为官星且透干，为正官格',
 *     priority: 1,
 *     evaluate: (input, context) => {
 *       // ... 判定逻辑
 *       return {
 *         conclusion: '正官格成立',
 *         direction: 'good',
 *         items: [ ... ],
 *         coreSatisfied: 2,
 *         coreTotal: 3,
 *         counterHits: 0,
 *         counterThreshold: 2,
 *       };
 *     },
 *   });
 */

import { registerRule } from '../ruleRegistry';

registerRule({
  id: 'GEJU-PLACEHOLDER-000',
  name: '格局规则占位（以后删除）',
  category: 'geju',
  description: '所有格局规则统一在此目录注册',
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
