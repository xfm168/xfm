import type { TenGodName, Wuxing } from '../types'

export interface TenGodKnowledgeEntry {
  name: TenGodName
  positiveTraits: string[]
  negativeTraits: string[]
  career: string[]
  healthNote: string
  favorableWhen: string
  unfavorableWhen: string
}

export class TenGodKnowledgeDB {
  private entries = new Map<TenGodName, TenGodKnowledgeEntry>()

  constructor() {
    this.initDefaults()
  }

  private initDefaults() {
    const defaults: Record<TenGodName, TenGodKnowledgeEntry> = {
      比肩: {
        name: '比肩',
        positiveTraits: ['独立自主', '意志坚定', '重情重义', '有领导力'],
        negativeTraits: ['固执己见', '独断专行', '好胜心强', '易招小人'],
        career: ['创业', '自由职业', '管理岗位', '技术骨干'],
        healthNote: '注意肝胆、筋骨',
        favorableWhen: '身弱时帮身得力，兄弟朋友相助',
        unfavorableWhen: '身旺时比劫夺财，破财损妻',
      },
      劫财: {
        name: '劫财',
        positiveTraits: ['热情豪爽', '善于交际', '反应敏捷', '行动力强'],
        negativeTraits: ['冲动好赌', '破财风险', '易惹口舌', '感情波折'],
        career: ['销售', '公关', '金融', '演艺'],
        healthNote: '注意心血管、精神压力',
        favorableWhen: '身弱急需助力时，可解燃眉之急',
        unfavorableWhen: '身旺财旺时，必夺财招灾',
      },
      食神: {
        name: '食神',
        positiveTraits: ['温文尔雅', '才华横溢', '衣食丰足', '心性平和'],
        negativeTraits: ['过于理想主义', '行动力弱', '思虑过多', '懒散'],
        career: ['教育', '文化艺术', '餐饮', '设计创作'],
        healthNote: '注意脾胃、消化系统',
        favorableWhen: '身旺食神泄秀，或制杀为用',
        unfavorableWhen: '身弱食神泄气太过，或枭神夺食',
      },
      伤官: {
        name: '伤官',
        positiveTraits: ['聪明绝顶', '创新能力强', '口才出众', '才艺双全'],
        negativeTraits: ['高傲自大', '目中无人', '好管闲事', '易招官非'],
        career: ['技术研发', '艺术创作', '律师', '咨询顾问'],
        healthNote: '注意泌尿、生殖系统',
        favorableWhen: '身旺伤官泄秀生财，或杀重需制',
        unfavorableWhen: '身弱泄气，或伤官见官',
      },
      偏财: {
        name: '偏财',
        positiveTraits: ['慷慨大方', '善于理财', '人缘极佳', '商业天赋'],
        negativeTraits: ['挥霍浪费', '投机心理', '感情不稳', '贪多务得'],
        career: ['投资', '贸易', '金融', '企业经营'],
        healthNote: '注意肾脏、腰部',
        favorableWhen: '身旺能担财，或食伤来生',
        unfavorableWhen: '身弱财多压身，或比劫来夺',
      },
      正财: {
        name: '正财',
        positiveTraits: ['勤俭节约', '脚踏实地', '诚实守信', '家庭观念强'],
        negativeTraits: ['过于保守', '吝啬小气', '缺乏魄力', '安于现状'],
        career: ['财务会计', '公务员', '传统行业', '稳定工作'],
        healthNote: '注意脾胃、消化系统',
        favorableWhen: '身旺财旺，财生官为美',
        unfavorableWhen: '身弱财多，或财破印',
      },
      七杀: {
        name: '七杀',
        positiveTraits: ['果敢决断', '魄力过人', '权威感强', '应变能力高'],
        negativeTraits: ['暴躁凶狠', '多疑善变', '压力山大', '意外灾祸'],
        career: ['军警', '管理层', '创业', '高风险行业'],
        healthNote: '注意肝胆、神经系统、意外伤害',
        favorableWhen: '身旺杀有制（食神制杀/杀印相生）',
        unfavorableWhen: '身弱杀旺无制，财滋七杀',
      },
      正官: {
        name: '正官',
        positiveTraits: ['正直光明', '遵纪守法', '责任感强', '有领导才能'],
        negativeTraits: ['保守刻板', '循规蹈矩', '压力较大', '优柔寡断'],
        career: ['政府官员', '行政管理', '法律', '大型企业'],
        healthNote: '注意骨骼、肾脏',
        favorableWhen: '身旺官旺，财官双美或官印相生',
        unfavorableWhen: '身弱官多压身，或官杀混杂',
      },
      偏印: {
        name: '偏印',
        positiveTraits: ['思维独特', '悟性极高', '偏门专长', '第六感强'],
        negativeTraits: ['孤僻冷漠', '疑心重', '钻牛角尖', '好幻想'],
        career: ['科研', '玄学宗教', '技术专家', '心理咨询'],
        healthNote: '注意神经系统、脾胃',
        favorableWhen: '身弱需生扶，或杀旺需化（杀印相生）',
        unfavorableWhen: '夺食为祸（枭神夺食），身旺印多反为灾',
      },
      正印: {
        name: '正印',
        positiveTraits: ['仁慈善良', '学识渊博', '稳重踏实', '贵人相助'],
        negativeTraits: ['依赖性强', '缺乏主见', '懒散拖沓', '过度保护'],
        career: ['教育学术', '文化出版', '医疗', '事业单位'],
        healthNote: '注意脾胃、皮肤',
        favorableWhen: '身弱得印生扶，或官印相生功名显达',
        unfavorableWhen: '身旺印多壅塞，或财破印坏印',
      },
    }
    for (const [k, v] of Object.entries(defaults)) {
      this.entries.set(k as TenGodName, v)
    }
  }

  get(name: TenGodName): TenGodKnowledgeEntry | undefined {
    return this.entries.get(name)
  }

  list(): TenGodKnowledgeEntry[] {
    return Array.from(this.entries.values())
  }

  getByWx(_wx: Wuxing): TenGodKnowledgeEntry[] {
    return []
  }
}

export const defaultTenGodKnowledgeDB = new TenGodKnowledgeDB()
