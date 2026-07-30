import type { RuleDefinition } from '../ruleEngine/types'
import { registerRule, registry } from '../ruleEngine/ruleRegistry'
import type { MinimalPillarInput, GeJuResult, GeJuJudgement } from './types'
import RULES from './geju.rules'

class LocalRuleRegistry {
  registerRule(def: any): void {
    registerRule(def)
  }
  listRules(): RuleDefinition[] {
    return Array.from(registry.rules.values())
  }
}

export class GeJuEngine {
  private readonly registry: LocalRuleRegistry
  constructor() {
    this.registry = new LocalRuleRegistry()
    RULES.forEach(r => this.registry.registerRule(r as any))
  }

  async evaluate(input: MinimalPillarInput): Promise<GeJuResult> {
    const results: GeJuJudgement[] = []
    const rules = this.registry.listRules().filter(r => r.id.startsWith('GEJU-'))
    for (const rule of rules) {
      try {
        const bundle = await (rule as any).evaluate(input, { traceable: true })
        const active = bundle.items.every((i: any) => i.result === true || i.result === 'satisfied' || i.result === 'partial' || i.result === 'partially')
        const top = bundle.items[0]
        results.push({
          geju: (rule as any)._gejuCategory as any,
          subtype: (rule as any)._gejuSubtype,
          score: top?.confidence ?? 0,
          ruleId: rule.id,
          evidence: (top?.trace ?? []).map((t: any) => ({
            step: t.step, text: t.text, satisfied: t.satisfied ?? true, citation: t.citation,
          })),
          active,
          note: bundle.summary,
          source: (Array.isArray(rule.source) ? rule.source : [rule.source]) as string[],
        })
      } catch (e) {
      }
    }
    results.sort((a, b) => b.score - a.score)
    const primary = results.find(r => r.active) ?? results[0]
    const secondary = results.filter(r => r.active && r !== primary).slice(0, 3)
    const rejected = results.filter(r => !r.active).slice(0, 5)
    const summary = `主格局：${primary.geju}${primary.subtype ? '·' + primary.subtype : ''}；次格局候选 ${secondary.length} 个；不成立 ${rejected.length} 个。`
    return { primary, secondary, rejected, summary, hasSchoolConflict: secondary.some(s => s.geju !== primary.geju && s.score > 0.7) }
  }
}

export const globalGeJuEngine = new GeJuEngine()
