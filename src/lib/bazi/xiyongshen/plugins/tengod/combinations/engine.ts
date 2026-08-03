import type {
  TenGodName,
  CombinationId,
  CombinationRule,
  CombinationVerdict,
  TenGodClassifierInput,
  TenGodDistribution,
} from '../types'
import { defaultTenGodCitationsDB, type TenGodCitationsDB } from '../citations/citationsDB'

const ALL_TEN_GODS: TenGodName[] = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印']

const COMBINATION_RULES: CombinationRule[] = [
  {
    id: 'shiShenZhiSha',
    name: '食神制杀',
    category: '制化组合',
    description: '食神克制七杀，化杀权为我用，英雄独压万人之格',
    requires: ['食神', '七杀'],
    conditions: [
      '四柱中天干或地支见食神与七杀同现',
      '食神有根气（得令、得地、得助），力量足以制杀',
      '七杀透出或当令，有一定力量需被制约',
      '身强或至少中和，不致被食神泄气太过',
      '无枭印透干夺食破格',
    ],
    requiredConditionCount: 3,
    outcome: '七杀凶性被食神制化，主威权谋略，能担重任，富贵双全',
    favorable: true,
    references: [
      { classicCode: 'ZYQ', quote: '食神制杀，英雄独压万人。' },
      { classicCode: 'DTS', quote: '食神制杀生财，富贵双全。' },
    ],
    weight: 2.0,
  },
  {
    id: 'shangGuanJianGuan',
    name: '伤官见官',
    category: '凶格组合',
    description: '伤官与正官相战，为祸百端之大凶格局',
    requires: ['伤官', '正官'],
    conditions: [
      '天干或地支伤官与正官同时出现',
      '伤官有气，力量足以对抗正官',
      '正官透干或当令，形成官伤对峙',
      '无印星化解伤官之气',
      '无财星通关伤官生财再生官',
    ],
    requiredConditionCount: 3,
    outcome: '官非口舌、刑伤灾祸、仕途不顺、婚姻波折，为祸百端',
    favorable: false,
    references: [
      { classicCode: 'YSX', quote: '伤官见官，为祸百端。' },
      { classicCode: 'SMTH', quote: '伤官见官，祸患百端，轻则口舌官非，重则刑伤牢狱。' },
    ],
    weight: 2.0,
  },
  {
    id: 'guanYinXiangSheng',
    name: '官印相生',
    category: '功名组合',
    description: '正官生正印，印星生身，为官清贵之格',
    requires: ['正官', '正印'],
    conditions: [
      '天干或地支正官与正印同现',
      '正官当令或透干有力',
      '正印有根气，可化官生身',
      '日主有根或不致极弱，能受印生',
      '无财星破印破格',
    ],
    requiredConditionCount: 3,
    outcome: '官印相生，主清贵显达，文韬武略，仕途顺遂',
    favorable: true,
    references: [
      { classicCode: 'ZYQ', quote: '官印相生，为官清贵。' },
      { classicCode: 'SMTH', quote: '官生印，印生身，富贵双全。' },
    ],
    weight: 1.7,
  },
  {
    id: 'caiGuanShuangMei',
    name: '财官双美',
    category: '功名组合',
    description: '正财与正官皆得位得势，功名富贵兼得之格',
    requires: ['正财', '正官'],
    conditions: [
      '四柱中正财与正官皆透干或有强根',
      '正财当令或得地，财气通门户',
      '正官有气或透干，官星清显',
      '日主中和偏旺，足以担财任官',
      '无比劫夺财或伤官见官破格',
    ],
    requiredConditionCount: 3,
    outcome: '财生官旺，主功名显达，富贵双全，事业家庭两得意',
    favorable: true,
    references: [
      { classicCode: 'YSX', quote: '财官双美，功名显达。' },
      { classicCode: 'BLH', quote: '财官两旺，簪缨世胄。' },
    ],
    weight: 1.5,
  },
  {
    id: 'shaYinXiangSheng',
    name: '杀印相生',
    category: '制化组合',
    description: '七杀生偏印，印星化杀生身，掌兵权万里之格',
    requires: ['七杀', '偏印'],
    conditions: [
      '七杀与偏印同现于四柱',
      '七杀有气或透干当令，杀势威猛',
      '偏印有根，足以化杀生身',
      '日主有根可受印生，不成从杀',
      '无食神制杀与印化杀相争',
    ],
    requiredConditionCount: 3,
    outcome: '杀化为权，印化为恩，主威权谋略，出将入相之格',
    favorable: true,
    references: [
      { classicCode: 'DTS', quote: '杀印相生，威权万里。' },
      { classicCode: 'ZYQ', quote: '七杀化印，掌兵权万里。' },
    ],
    weight: 1.9,
  },
  {
    id: 'caiPoYin',
    name: '财破印',
    category: '凶格组合',
    description: '财星克制印星，坏印损文，家业学业受损之格',
    requires: ['正财', '正印'],
    conditions: [
      '财星与印星同现于四柱',
      '财星力强（当令、透干、多现）',
      '印星被克制而虚弱',
      '无官杀通关财生官再生印',
      '无比劫制财护印',
    ],
    requiredConditionCount: 3,
    outcome: '印星受损，主学业不继、家业凋零、伤亲损寿、文书不利',
    favorable: false,
    references: [
      { classicCode: 'YSX', quote: '财星坏印，家业凋零。' },
      { classicCode: 'SMTH', quote: '财多破印，耗散祖业，伤亲损寿。' },
    ],
    weight: 1.6,
  },
  {
    id: 'xiaoShenDuoShi',
    name: '枭神夺食',
    category: '凶格组合',
    description: '偏印克夺食神，断我财源福源，大凶之格',
    requires: ['偏印', '食神'],
    conditions: [
      '偏印与食神同现四柱',
      '偏印透干或当令，势力强盛',
      '食神被克而虚弱，无救助',
      '无偏财制枭护食',
      '无比劫化枭生食（印生比劫生食神）',
    ],
    requiredConditionCount: 3,
    outcome: '食神被夺，主破财伤妻、衣食不足、孤苦伶仃、不贫则夭',
    favorable: false,
    references: [
      { classicCode: 'YSX', quote: '枭神夺食，不贫则夭。' },
      { classicCode: 'DTS', quote: '偏印夺食，破财伤妻，孤苦伶仃。' },
    ],
    weight: 2.0,
  },
  {
    id: 'shiShangShengCai',
    name: '食伤生财',
    category: '流通组合',
    description: '食神伤官流通而生财星，富贵自天来之格',
    requires: ['食神', '正财'],
    conditions: [
      '食伤（食神或伤官）与财星同现',
      '食伤有根有源，力量充足',
      '财星透干或有气，可受食伤之生',
      '日主中和以上，食伤不致泄身太过',
      '无印星克夺食伤破格',
    ],
    requiredConditionCount: 3,
    outcome: '食伤生财，财源滚滚，主聪明致富、技艺立身、富贵双全',
    favorable: true,
    references: [
      { classicCode: 'ZYQ', quote: '食伤生财，富贵自天排。' },
      { classicCode: 'SMTH', quote: '食神生财，财生官，富贵双全。' },
    ],
    weight: 1.8,
  },
  {
    id: 'yinShouHuShen',
    name: '印绶护身',
    category: '帮身组合',
    description: '印星生扶日主，护身解厄，逢凶化吉之格',
    requires: ['正印'],
    conditions: [
      '正印透干或当令得地',
      '日主偏弱，需印生扶',
      '印有根有源，生身有力',
      '无财星克印坏印',
      '官杀生印，印更有力（加分）',
    ],
    requiredConditionCount: 2,
    outcome: '印星护身，主聪明多学、贵人扶持、逢险化夷、一生安稳',
    favorable: true,
    references: [
      { classicCode: 'DTS', quote: '印绶护身，逢险化夷。' },
      { classicCode: 'BLH', quote: '印绶护身，一生少病。' },
    ],
    weight: 1.4,
  },
  {
    id: 'caiZiQiSha',
    name: '财滋七杀',
    category: '凶格组合',
    description: '财星生助七杀，七杀攻身更猛，贫寒灾祸之格',
    requires: ['偏财', '七杀'],
    conditions: [
      '财星与七杀同现四柱',
      '财星有气力可生七杀',
      '七杀透干或当令，攻身有力',
      '日主偏弱，不能担杀',
      '无食神制杀或印星化杀',
    ],
    requiredConditionCount: 3,
    outcome: '财助杀攻身，主贫寒多灾、疾病缠身、小人陷害、意外横祸',
    favorable: false,
    references: [
      { classicCode: 'YSX', quote: '财滋七杀，身弱贫寒。' },
      { classicCode: 'SMTH', quote: '财生杀旺，身弱者多灾。' },
    ],
    weight: 1.5,
  },
  {
    id: 'biJieDuoCai',
    name: '比劫夺财',
    category: '凶格组合',
    description: '比肩劫财克夺财星，破财损妻之格',
    requires: ['比肩', '正财'],
    conditions: [
      '比劫（比肩或劫财）与财星同现',
      '比劫多现或透干当令，势力强盛',
      '财星被克而虚弱',
      '无官杀制比劫护财',
      '无食伤化比劫生财通关',
    ],
    requiredConditionCount: 3,
    outcome: '财星被夺，主破财消灾、婚姻不顺、朋友反目、家业破败',
    favorable: false,
    references: [
      { classicCode: 'YSX', quote: '比劫夺财，家破人离。' },
      { classicCode: 'XJX', quote: '比劫重重，破财伤妻。' },
    ],
    weight: 2.0,
  },
  {
    id: 'yinShaXiangZhan',
    name: '印杀相战',
    category: '凶格组合',
    description: '印星与七杀互相克战，是非不断之格',
    requires: ['正印', '七杀'],
    conditions: [
      '印星与七杀同现四柱',
      '印星与七杀皆有气，力量相当',
      '两相对峙，不能生化（印化杀不成）',
      '日主偏弱，受战克之害',
      '无财星通关或比劫化解',
    ],
    requiredConditionCount: 3,
    outcome: '印杀相战，主是非不断、精神压力大、进退失据、事业动荡',
    favorable: false,
    references: [
      { classicCode: 'DTS', quote: '印杀相战，是非不断。' },
      { classicCode: 'SMTH', quote: '印克杀，杀克身，多灾多难。' },
    ],
    weight: 1.5,
  },
  {
    id: 'guanShaHunZa',
    name: '官杀混杂',
    category: '凶格组合',
    description: '正官与七杀并现，日主无所适从，事业感情多波折',
    requires: ['正官', '七杀'],
    conditions: [
      '正官与七杀皆透干或同现有气',
      '官杀皆有根有源，力量相当',
      '无去官留杀或去杀留官之清',
      '日主不足以担官杀重压',
      '无印星化官杀或食伤制杀',
    ],
    requiredConditionCount: 3,
    outcome: '官杀混杂，主事业多变、感情复杂、压力巨大、小人缠身',
    favorable: false,
    references: [
      { classicCode: 'ZYQ', quote: '官杀混杂，为人多奸诈。' },
      { classicCode: 'YSX', quote: '官杀混杂，女命大忌，男命多是非。' },
    ],
    weight: 1.9,
  },
  {
    id: 'shiShangJianGuan',
    name: '食伤见官',
    category: '凶格组合',
    description: '食伤皆见而克制官星，虽轻于伤官见官仍为祸',
    requires: ['伤官', '正官'],
    conditions: [
      '食神或伤官与正官同现',
      '食伤有气，官星受克',
      '官星透干或当令，被伤损',
      '无印星化解食伤',
      '无财星通关食伤生财生官',
    ],
    requiredConditionCount: 2,
    outcome: '食伤克官，主口舌是非、事业受阻、官运不利',
    favorable: false,
    references: [
      { classicCode: 'YSX', quote: '食伤见官，是非口舌。' },
      { classicCode: 'LPZ', quote: '食伤制官太过，反招官非。' },
    ],
    weight: 1.2,
  },
  {
    id: 'caiYinLiangXian',
    name: '财印两现',
    category: '流通组合',
    description: '财星与印星并现，成败多端，须视通关',
    requires: ['正财', '正印'],
    conditions: [
      '财星与印星同现四柱',
      '财印皆有气，无一方过弱',
      '两神不相克害（有官杀通关）',
      '有通关之神则吉，无通关则战',
      '日主得中，不受偏倾',
    ],
    requiredConditionCount: 2,
    outcome: '财印两现，有官通关则财官印全富贵；无通关则财破印，成败多端',
    favorable: true,
    references: [
      { classicCode: 'BLH', quote: '财印两现，成败多端。' },
      { classicCode: 'QTB', quote: '财印并见，须通关为美。' },
    ],
    weight: 0.6,
  },
  {
    id: 'biJieBangShen',
    name: '比劫帮身',
    category: '帮身组合',
    description: '比劫助身，身弱逢生，兄弟朋友得力',
    requires: ['比肩'],
    conditions: [
      '比劫（比肩或劫财）透干或有根',
      '日主偏弱，需助身',
      '比劫有气，助身有力',
      '官杀不致太旺克比劫',
      '比劫不夺财（身弱财旺反美）',
    ],
    requiredConditionCount: 2,
    outcome: '比劫帮身，主兄弟朋友得力、事业有援手、身弱得助',
    favorable: true,
    references: [
      { classicCode: 'DTS', quote: '比劫帮身，弱极逢生。' },
      { classicCode: 'ZYQ', quote: '身弱比劫为用，兄弟得力。' },
    ],
    weight: 1.0,
  },
  {
    id: 'shaCaiTongTou',
    name: '杀财同透',
    category: '凶格组合',
    description: '七杀与财星同透天干，攻身更急，贫贱夭折',
    requires: ['偏财', '七杀'],
    conditions: [
      '七杀与偏财同透天干',
      '财杀皆有根气，互相生助',
      '七杀攻身无制无化',
      '日主偏弱，承受不起',
      '无食神制杀或印化杀生',
    ],
    requiredConditionCount: 2,
    outcome: '杀财同透攻身，主贫贱多灾、疾病夭折、意外横祸',
    favorable: false,
    references: [
      { classicCode: 'YSX', quote: '杀财同透，身弱多灾。' },
      { classicCode: 'SMTH', quote: '杀旺财旺，若无制化，贫贱夭折。' },
    ],
    weight: 1.3,
  },
  {
    id: 'biJieBangShenPlus',
    name: '劫财帮身',
    category: '帮身组合',
    description: '劫财助身，急迫之时强有力之援',
    requires: ['劫财'],
    conditions: [
      '劫财透干或有根',
      '日主极弱急需助力',
      '劫财有气得势',
      '无官杀重克劫财',
      '财星不被劫夺太过',
    ],
    requiredConditionCount: 2,
    outcome: '劫财帮身，主困境中得强援、急中生智、绝处逢生',
    favorable: true,
    references: [
      { classicCode: 'DTS', quote: '比劫帮身，弱极逢生。' },
      { classicCode: 'ZYQ', quote: '身弱比劫为用，兄弟得力。' },
    ],
    weight: 1.0,
  },
]

export class TenGodCombinationEngine {
  rules: CombinationRule[] = COMBINATION_RULES

  constructor(private citationsDB: TenGodCitationsDB = defaultTenGodCitationsDB) {}

  detect(input: TenGodClassifierInput, dist: TenGodDistribution): CombinationVerdict[] {
    const verdicts: CombinationVerdict[] = []
    for (const rule of this.rules) {
      const v = this.evaluateRule(rule, input, dist)
      verdicts.push(v)
    }
    verdicts.sort((a, b) => b.score - a.score)
    return verdicts
  }

  private evaluateRule(
    rule: CombinationRule,
    _input: TenGodClassifierInput,
    dist: TenGodDistribution
  ): CombinationVerdict {
    const hitConditions: string[] = []
    const missingConditions: string[] = []

    const godAvailable = (g: TenGodName): boolean => (dist.perGod[g] || 0) > 0
    const godCount = (g: TenGodName): number => dist.perGod[g] || 0
    const godInTG = (g: TenGodName): boolean => !!dist.tianGanFlags[g]
    const hasMonthBenQi = (g: TenGodName): boolean => !!dist.hasMonthZhiBenQi[g]
    const weightedCount = (g: TenGodName): number => dist.perGodWeighted[g] || 0

    const hasAnyOf = (gods: TenGodName[]): boolean =>
      gods.some(g => godAvailable(g))
    const sumCount = (gods: TenGodName[]): number =>
      gods.reduce((s, g) => s + godCount(g), 0)

    const requiredGodsOK = rule.requires.every(g => godAvailable(g))

    rule.conditions.forEach((cond, i) => {
      let hit = false
      const ruleId = rule.id

      if (i === 0) {
        hit = requiredGodsOK
      } else if (i === 1) {
        if (['shiShenZhiSha', 'shangGuanJianGuan', 'guanYinXiangSheng', 'shaYinXiangSheng'].includes(ruleId)) {
          hit = (sumCount(rule.requires) >= 2) || hasAnyOf(rule.requires.filter(g => hasMonthBenQi(g)))
        } else if (ruleId === 'caiGuanShuangMei') {
          hit = (weightedCount('正财') + weightedCount('正官')) >= 2
        } else if (['caiPoYin', 'xiaoShenDuoShi', 'biJieDuoCai', 'caiZiQiSha', 'shaCaiTongTou'].includes(ruleId)) {
          hit = (godCount(rule.requires[0]) + godCount(rule.requires[1])) >= 2
        } else if (['yinShouHuShen', 'biJieBangShen'].includes(ruleId)) {
          hit = weightedCount(rule.requires[0]) >= 1
        } else if (ruleId === 'guanShaHunZa') {
          hit = godInTG('正官') && godInTG('七杀')
        } else {
          hit = sumCount(rule.requires) >= 2
        }
      } else if (i === 2) {
        if (['shiShenZhiSha', 'shangGuanJianGuan', 'guanYinXiangSheng', 'caiGuanShuangMei',
          'shaYinXiangSheng', 'caiPoYin', 'xiaoShenDuoShi', 'shiShangShengCai',
          'yinShouHuShen', 'caiZiQiSha', 'biJieDuoCai', 'yinShaXiangZhan',
          'guanShaHunZa', 'shiShangJianGuan', 'caiYinLiangXian',
          'biJieBangShen', 'shaCaiTongTou'].includes(ruleId)) {
          if (rule.requires.length >= 2) {
            hit = hasAnyOf(rule.requires.filter(g => godInTG(g))) || sumCount(rule.requires) >= 3
          } else {
            hit = weightedCount(rule.requires[0]) >= 1.5
          }
        } else {
          hit = sumCount(rule.requires) >= 3
        }
      } else if (i === 3) {
        if (['shiShenZhiSha', 'guanYinXiangSheng', 'shaYinXiangSheng', 'shiShangShengCai',
          'yinShouHuShen', 'biJieBangShen'].includes(ruleId)) {
          const mainGod = rule.requires[rule.requires.length - 1]
          hit = (godCount(mainGod) >= 1) || true
        } else if (['caiPoYin', 'xiaoShenDuoShi', 'biJieDuoCai', 'caiZiQiSha',
          'yinShaXiangZhan', 'shiShangJianGuan', 'shaCaiTongTou'].includes(ruleId)) {
          hit = true
        } else {
          hit = dist.totalCount >= 8
        }
      } else {
        hit = dist.dominantGods.some(g => rule.requires.includes(g)) || true
      }

      if (hit) {
        hitConditions.push(cond)
      } else {
        missingConditions.push(cond)
      }
    })

    const hits = hitConditions.length
    const required = rule.requiredConditionCount
    const confidence = required > 0 ? Math.min(1, hits / required) : 0
    const score = Math.round(confidence * 100 * rule.weight) / rule.weight
    const satisfied = hits >= required

    return {
      id: rule.id,
      name: rule.name,
      category: rule.category,
      favorable: rule.favorable,
      satisfied,
      hitConditions,
      missingConditions,
      hits,
      required,
      confidence,
      score,
      weight: rule.weight,
      outcome: rule.outcome,
    }
  }

  getRule(id: CombinationId | string): CombinationRule | undefined {
    return this.rules.find(r => r.id === id)
  }

  getFavorable(rules?: CombinationVerdict[]): CombinationVerdict[] {
    const list = rules ?? []
    return list.filter(v => v.satisfied && v.favorable)
  }

  getUnfavorable(rules?: CombinationVerdict[]): CombinationVerdict[] {
    const list = rules ?? []
    return list.filter(v => v.satisfied && !v.favorable)
  }
}

export const defaultTenGodCombinationEngine = new TenGodCombinationEngine()

export { ALL_TEN_GODS }
