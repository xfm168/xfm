/**
 * V③ RuleEngine 统一分类目录入口
 *
 * 通过 import 副作用让所有分类规则文件执行 registerRule
 * 同时暴露 registerCategoryRules 用于显式初始化（可选）
 */

import './geju.rules';
import './xiyongshen.rules';
import './shensha.rules';
import './combo.rules';

/**
 * 显式触发所有分类规则的注册
 * 实际上 import 副作用已经完成注册，此函数仅作为语义化入口
 * 可用于需要显式初始化的场景（如测试、动态加载等）
 */
export function registerCategoryRules(): void {
  if (typeof console !== 'undefined' && 'debug' in console) {
    console.debug('[RuleEngine] Category rules already registered via import side-effect');
  }
}
