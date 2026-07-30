import type { RuleCategory, RuleDefinition } from './types';

interface RuleRegistryStore {
  /** 正式注册的规则 */
  rules: Map<string, RuleDefinition>;
  /** 沙箱中的规则（未通过验证，不参与正式执行） */
  sandbox: Map<string, RuleDefinition>;
  /** 规则执行顺序缓存（按 priority + dependencies 拓扑排序） */
  executionOrderCache: Map<RuleCategory, string[]>;
}

export const registry: RuleRegistryStore = {
  rules: new Map(),
  sandbox: new Map(),
  executionOrderCache: new Map(),
};

/** 拓扑排序：按 dependencies 排列规则执行顺序 */
function topoSort(rules: RuleDefinition[]): RuleDefinition[] {
  const sorted: RuleDefinition[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(rule: RuleDefinition) {
    if (visited.has(rule.id)) return;
    if (visiting.has(rule.id)) {
      // 检测到循环依赖，跳过
      return;
    }
    visiting.add(rule.id);
    for (const depId of rule.dependencies || []) {
      const dep = rules.find(r => r.id === depId);
      if (dep) visit(dep);
    }
    visiting.delete(rule.id);
    visited.add(rule.id);
    sorted.push(rule);
  }

  // 先按 priority 降序
  const sortedByPriority = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  for (const rule of sortedByPriority) {
    visit(rule);
  }
  return sorted;
}

/** 清除执行顺序缓存（注册新规则后自动调用） */
export function clearCache(): void {
  registry.executionOrderCache.clear();
}

export function registerRule(def: RuleDefinition): void {
  registry.rules.set(def.id, def);
  clearCache();
}

/** P0-A3 新增：注册到 sandbox 而非正式 rules */
export function registerSandboxRule(rule: RuleDefinition): void {
  registry.sandbox.set(rule.id, rule);
  clearCache();
}

/** P0-A3 新增：将规则从 sandbox 提升到正式 */
export function promoteRule(ruleId: string): boolean {
  const rule = registry.sandbox.get(ruleId);
  if (!rule) return false;
  registry.sandbox.delete(ruleId);
  registry.rules.set(ruleId, rule);
  clearCache();
  return true;
}

/** P0-A3 新增：将规则从正式降级到 sandbox */
export function demoteRule(ruleId: string): boolean {
  const rule = registry.rules.get(ruleId);
  if (!rule) return false;
  registry.rules.delete(ruleId);
  registry.sandbox.set(ruleId, rule);
  clearCache();
  return true;
}

/** P0-A3 新增：获取所有沙箱规则 */
export function getSandboxRules(): RuleDefinition[] {
  return Array.from(registry.sandbox.values());
}

/** P0-A3 新增：按 ID 查找规则（先查正式，再查沙箱） */
export function getRuleById(id: string): RuleDefinition | undefined {
  return registry.rules.get(id) ?? registry.sandbox.get(id);
}

/** P0-A3 新增：按标签查找规则（匹配任意一个标签即返回，仅正式规则） */
export function getRulesByTags(tags: string[]): RuleDefinition[] {
  if (!tags || tags.length === 0) return [];
  const tagSet = new Set(tags);
  const result: RuleDefinition[] = [];
  for (const rule of registry.rules.values()) {
    if (!rule.tags) continue;
    for (const t of rule.tags) {
      if (tagSet.has(t)) {
        result.push(rule);
        break;
      }
    }
  }
  return result;
}

export function getRulesByCategory(cat: RuleCategory): RuleDefinition[] {
  const cachedIds = registry.executionOrderCache.get(cat);
  if (cachedIds) {
    const result: RuleDefinition[] = [];
    for (const id of cachedIds) {
      const r = registry.rules.get(id);
      if (r && r.status !== 'deprecated') result.push(r);
    }
    return result;
  }
  const candidates: RuleDefinition[] = [];
  for (const rule of registry.rules.values()) {
    if (rule.category !== cat) continue;
    // 只返回 status !== 'deprecated' 的规则（status 不存在视为非废弃）
    if (rule.status === 'deprecated') continue;
    candidates.push(rule);
  }
  const ordered = topoSort(candidates);
  registry.executionOrderCache.set(cat, ordered.map(r => r.id));
  return ordered;
}

/** P0-A3 新增：返回规则 ID 执行顺序数组 */
export function getExecutionOrder(cat: RuleCategory): string[] {
  const cached = registry.executionOrderCache.get(cat);
  if (cached) return [...cached];
  // 触发 getRulesByCategory 计算并写入缓存
  const ordered = getRulesByCategory(cat);
  return ordered.map(r => r.id);
}

export function initBuiltinRules(): void {
}
