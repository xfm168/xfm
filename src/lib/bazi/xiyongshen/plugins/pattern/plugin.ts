import { DivinationPluginImpl, type DivinationPluginConfig } from '@/lib/bazi/foundation/core/plugin/types'
import { globalCapabilityRegistry } from '@/lib/bazi/foundation/core/plugin/capability'
import { AdvancedPatternEngine } from './advancedPatternEngine'
import { PatternClassifier } from './classifier'

export class BaziPatternPlugin extends DivinationPluginImpl {
  readonly id = 'bazi-pattern'
  readonly name = '八字·格局体系 P1.1'
  readonly version = '1.0.0'
  readonly type = 'bazi-extension'
  readonly description = '八字格局判定 10 大类：正格/假从/真从/专旺/一气/化气/调候/病药/通关/扶抑'
  readonly dependencies = ['bazi']
  readonly divinationConfig: DivinationPluginConfig = {
    divinationType: 'bazi',
    divinationName: '八字格局体系',
    divinationDescription: '八字十类格局判定 + 喜忌证据链 + 古籍溯源',
    supportsFeatures: ['格局判定', '格局分类', '格局喜忌', '格局古籍溯源', '格局证据链'],
    icon: '📐',
  }

  public classifier: PatternClassifier | null = null
  public engine: AdvancedPatternEngine | null = null

  async initialize(): Promise<void> {
    await super.initialize()
    this.classifier = new PatternClassifier()
    this.engine = new AdvancedPatternEngine(this.classifier)
    globalCapabilityRegistry.register({
      pluginId: this.id,
      capabilities: ['bazi', 'knowledge', 'quality', 'rule', 'decision', 'case-db', 'classic-db', 'explain'],
      details: {
        bazi: { description: '八字格局体系 (10大类)', version: this.version },
        knowledge: { description: '格局知识图谱' },
        quality: { description: '格局判定质量控制' },
      } as any,
    })
  }

  async destroy(): Promise<void> {
    globalCapabilityRegistry.unregister(this.id)
    this.classifier = null
    this.engine = null
    await super.destroy()
  }

  classify(input: any) { return this.classifier?.classify(input) }
  evaluate(input: any) { return this.engine?.evaluate(input) }
}
