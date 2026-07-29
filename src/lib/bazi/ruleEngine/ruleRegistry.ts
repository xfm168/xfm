import type { RuleCategory, RuleDefinition } from './types';

export const RULE_REGISTRY: Map<string, RuleDefinition> = new Map();

export function registerRule(def: RuleDefinition): void {
  RULE_REGISTRY.set(def.id, def);
}

export function getRulesByCategory(cat: RuleCategory): RuleDefinition[] {
  const rules: RuleDefinition[] = [];
  for (const rule of RULE_REGISTRY.values()) {
    if (rule.category === cat) {
      rules.push(rule);
    }
  }
  return rules.sort((a, b) => a.priority - b.priority);
}

export function getRuleById(id: string): RuleDefinition | undefined {
  return RULE_REGISTRY.get(id);
}

export function initBuiltinRules(): void {
}
