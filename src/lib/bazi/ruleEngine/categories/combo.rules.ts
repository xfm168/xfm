/**
 * 合冲刑害规则统一目录（V③ RuleEngine 统一分类目录）
 *
 * 开发指南：
 * 1. 所有合冲刑害（combo）相关的规则，统一在此文件中调用 registerRule() 注册
 * 2. 规则按 priority 从小到大排序（数字越小优先级越高，先执行）
 * 3. 规则 id 命名规范：COMBO-{序号三位数}，如 COMBO-001、COMBO-012
 * 4. evaluate 函数返回 EvidenceBundle（遵循 V④ 三元约定，上游再包装为 StandardInferenceResult）
 *
 * 涵盖内容：天干五合、地支六合/三合/三会、六冲、三刑、六害、相破 等
 *
 * 示例：
 *   import { registerRule } from '../ruleRegistry';
 *
 *   registerRule({
 *     id: 'COMBO-001',
 *     name: '甲己合化土',
 *     category: 'hehua',
 *     description: '甲己相邻且得月令，合化土成功',
 *     priority: 1,
 *     evaluate: (input, context) => {
 *       // ... 判定逻辑
 *       return {
 *         conclusion: '甲己合化土成功',
 *         direction: 'good',
 *         items: [ ... ],
 *         coreSatisfied: 3,
 *         coreTotal: 4,
 *         counterHits: 0,
 *         counterThreshold: 2,
 *       };
 *     },
 *   });
 */

import { registerRule } from '../ruleRegistry';

registerRule({
  id: 'COMBO-PLACEHOLDER-000',
  name: '合冲刑害规则占位（以后删除）',
  category: 'hehua',
  description: '所有合冲刑害规则统一在此目录注册',
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
