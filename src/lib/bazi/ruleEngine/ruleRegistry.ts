import type { RuleCategory, RuleDefinition, RuleCondition, ConflictStrategy } from './types';
import { DEFAULT_RULE_FALLBACKS } from './types';

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

const ID_PATTERN = /^[A-Z]{2,6}-[A-Z0-9]{2,6}-[0-9]{3,}$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+.*$/;

function validateAndNormalizeRule(def: Partial<RuleDefinition> & { id: string; evaluate: RuleDefinition['evaluate'] }): RuleDefinition {
  const ruleId = def.id || 'UNKNOWN-ID';
  const warnings: string[] = [];

  const requiredFields: Array<keyof RuleDefinition> = [
    'version',
    'priority',
    'source',
    'description',
    'condition',
    'result',
    'evidence',
    'confidence',
    'conflictStrategy',
  ];

  for (const field of requiredFields) {
    if (def[field] === undefined || def[field] === null) {
      warnings.push(`[B2 规范] 规则 ${ruleId} 缺失强制字段 '${field}'，已用默认值补齐`);
    }
  }

  if (!ID_PATTERN.test(ruleId)) {
    warnings.push(`[B2 规范] 规则 ID '${ruleId}' 建议按规范 XXX-YYY-### 命名（如 GEJU-CONG-001）`);
  }

  const version = def.version ?? DEFAULT_RULE_FALLBACKS.version;
  if (!VERSION_PATTERN.test(version)) {
    warnings.push(`[B2 规范] 规则 ${ruleId} 的 version '${version}' 建议使用语义化版本（如 1.0.0）`);
  }

  const source = def.source ?? DEFAULT_RULE_FALLBACKS.source;
  const sourceEmpty =
    (typeof source === 'string' && source.trim() === '') ||
    (Array.isArray(source) && (source.length === 0 || source.every(s => s.trim() === '')));
  if (sourceEmpty) {
    warnings.push(`[B2 规范] 规则 ${ruleId} 的 source 必须是非空字符串或非空字符串数组，建议补充来源（如 '滴天髓'、'子平真诠'）`);
  }

  const condition = def.condition ?? DEFAULT_RULE_FALLBACKS.condition;
  if (!Array.isArray(condition) || condition.length === 0) {
    warnings.push(`[B2 规范] 规则 ${ruleId} 的 condition 必须是非空数组，已用默认值补齐`);
  } else {
    for (let i = 0; i < condition.length; i++) {
      const c: RuleCondition = condition[i] as RuleCondition;
      if (!c.description || !c.type) {
        warnings.push(`[B2 规范] 规则 ${ruleId} 的 condition[${i}] 缺少 description 或 type 字段`);
      }
    }
  }

  const confidence = def.confidence ?? DEFAULT_RULE_FALLBACKS.confidence;
  if (confidence && confidence.components) {
    for (const [key, val] of Object.entries(confidence.components)) {
      if (typeof val === 'number' && val < 0) {
        warnings.push(`[B2 规范] 规则 ${ruleId} 的 confidence.components.${key} 权重为负数 (${val})，应为非负值`);
      }
    }
  }

  for (const w of warnings) {
    console.warn(w);
  }

  const normalized: RuleDefinition = {
    id: ruleId,
    version: version,
    priority: def.priority ?? DEFAULT_RULE_FALLBACKS.priority,
    source: source,
    description: def.description ?? DEFAULT_RULE_FALLBACKS.description,
    condition: condition,
    result: def.result ?? DEFAULT_RULE_FALLBACKS.result,
    evidence: def.evidence ?? DEFAULT_RULE_FALLBACKS.evidence,
    confidence: confidence,
    conflictStrategy: (def.conflictStrategy ?? DEFAULT_RULE_FALLBACKS.conflictStrategy) as ConflictStrategy,
    name: def.name,
    category: def.category,
    dependencies: def.dependencies,
    tags: def.tags,
    status: def.status,
    evaluate: def.evaluate,
  };

  return normalized;
}

/** 拓扑排序：按 dependencies 排列规则执行顺序 */
function topoSort(rules: RuleDefinition[]): RuleDefinition[] {
  const sorted: RuleDefinition[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(rule: RuleDefinition) {
    if (visited.has(rule.id)) return;
    if (visiting.has(rule.id)) {
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

export function registerRule(def: Partial<RuleDefinition> & { id: string; evaluate: RuleDefinition['evaluate'] }): void {
  const normalized = validateAndNormalizeRule(def);
  registry.rules.set(normalized.id, normalized);
  clearCache();
}

/** P0-A3 新增：注册到 sandbox 而非正式 rules */
export function registerSandboxRule(def: Partial<RuleDefinition> & { id: string; evaluate: RuleDefinition['evaluate'] }): void {
  const normalized = validateAndNormalizeRule(def);
  registry.sandbox.set(normalized.id, normalized);
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
  const ordered = getRulesByCategory(cat);
  return ordered.map(r => r.id);
}

export function initBuiltinRules(): void {
}
