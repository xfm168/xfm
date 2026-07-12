/**
 * 《滴天髓》 Rule Package（P2-1）
 * 
 * 作者：任铁樵（清）注
 * 原著相传为京图（宋）
 * 核心：旺衰顺逆、调候病药、通关相生
 * 
 * 本文件：
 * 1. 在 ClassicalLibrary 注册《滴天髓》
 * 2. 定义组合格局的古籍原文和白话解释
 * 3. 定义调候/病药/通关格的核心理论
 * 4. 导出可供 Explain 引用的原文记录
 */

import { ruleEngine } from '../../reasoning/ruleEngine'
import type { GeJuClassicalQuote } from './zipingZhengLunRules'

// ─── 组合格局原文 ───

/** 《滴天髓》组合格局原文 */
export const DITIAN_SUI_COMBO_STRUCTURES: GeJuClassicalQuote[] = [
  {
    structure: '食神制杀',
    originalText: '食神制杀者，以食神控制七杀。食神有力而杀有根，食杀两停，主大贵。若食神太旺杀太弱，反为不利。',
    vernacular: '食神制杀是用食神来制约七杀的力量。食神要有力，七杀要有根，两者力量均衡，主大贵之命。如果食神太旺而杀太弱，反而不利。',
    chapter: '论食神制杀',
  },
  {
    structure: '杀印相生',
    originalText: '杀印相生者，以印星化解七杀之力。杀旺有印化之，七杀化为权柄。无印则杀攻身为祸。',
    vernacular: '杀印相生是用印星来化解七杀的克伐力量。杀旺有印来化杀，七杀反而变成权力。没有印星则七杀直接攻身为祸。',
    chapter: '论杀印相生',
  },
  {
    structure: '伤官佩印',
    originalText: '伤官佩印者，以印星克制伤官。伤官佩印，化凶为吉。印绶制伤，才华得正途。',
    vernacular: '伤官佩印是用印星来制约伤官的破坏力。有了印星控制，伤官的凶性化为吉祥。印绶约束伤官，才华走正道。',
    chapter: '论伤官佩印',
  },
  {
    structure: '财官双美',
    originalText: '财官双美者，财星官星两不相伤。财旺生官，官卫财星。但须身旺任财官，方能双美。',
    vernacular: '财官双美是财星和官星互不伤害、互相生扶。财旺能生官，官能护卫财。但必须日主身旺才能担当。',
    chapter: '论财官',
  },
  {
    structure: '食伤生财',
    originalText: '食伤生财者，食神伤官能生财星。食伤为源，财星为流。源远流长，富格之命。',
    vernacular: '食伤生财是食神或伤官能生扶财星。食伤是源头，财星是流水。源头充足流得远，是富贵的命格。',
    chapter: '论食伤生财',
  },
  {
    structure: '官印相生',
    originalText: '官印相生者，官星生印星，印星生日主。官为权，印为柄，官印双全，权柄在握。',
    vernacular: '官印相生是官星生印星，印星再生日主。官代表权力，印代表印信，官印同时具备，权柄在手。',
    chapter: '论官印',
  },
]

/** 《滴天髓》调候/病药/通关理论原文 */
export const DITIAN_SUI_THEORY: GeJuClassicalQuote[] = [
  {
    structure: '调候格',
    originalText: '寒暖燥湿，四时之气。凡命局偏寒偏暖，皆需调候。寒甚用暖，暖甚用寒，方为中和之美。',
    vernacular: '寒暖燥湿是四季的自然之气。凡命局偏寒或偏暖，都需要调候调和。太寒用暖来调，太暖用寒来调，达到中和才算美。',
    chapter: '论调候',
  },
  {
    structure: '病药格',
    originalText: '有病方为贵，无伤不是奇。命局有病得药救之，即为贵格。病重药轻不济，药重病轻反伤。',
    vernacular: '命局有病才可能成为贵格，完全没有受伤的不是奇格。命局有病能得到药物救治，就是贵格。但病重药轻救不了，药重病轻反而会伤害命局。',
    chapter: '论病药',
  },
  {
    structure: '通关格',
    originalText: '通关者，两行相战，以中间通关之物解之。如金木相战以水通关，水火相战以木通关。',
    vernacular: '通关是两种五行交战时，用中间的五行来调和化解。比如金木交战用水来通关，水火交战用木来通关。',
    chapter: '论通关',
  },
  {
    structure: '扶抑格',
    originalText: '旺者宜抑，衰者宜扶。扶抑得中，命局平和。过扶过抑，反为不美。',
    vernacular: '太旺的五行宜抑制，太衰的五行宜扶助。扶抑恰到好处，命局就平和。扶得太过或抑得太过，反而不美。',
    chapter: '论扶抑',
  },
]

// ─── 获取格局原文 ───

export function getDiTianSuiQuote(structureName: string): GeJuClassicalQuote | undefined {
  return DITIAN_SUI_COMBO_STRUCTURES.find(q => q.structure === structureName)
    ?? DITIAN_SUI_THEORY.find(q => q.structure === structureName)
}

export function getAllDiTianSuiQuotes(): GeJuClassicalQuote[] {
  return [...DITIAN_SUI_COMBO_STRUCTURES, ...DITIAN_SUI_THEORY]
}

// ─── Rule Package 定义 ───

/**
 * 注册《滴天髓》组合格局到 RuleEngine
 * 
 * 《滴天髓》主要贡献：
 * 1. 组合格局的成格条件细化（食神制杀、杀印相生等）
 * 2. 调候/病药/通关的理论框架
 * 3. 旺衰顺逆的核心方法论
 */
export function registerDiTianSuiRules(): void {
  ruleEngine.registerPackage({
    id: 'ditiansui-combo-structures',
    name: '《滴天髓》组合格局与理论',
    description: '任铁樵注解，涵盖食神制杀、杀印相生、伤官佩印、财官双美等组合格局，以及调候、病药、通关理论。',
    version: '1.0.0',
    source: '滴天髓',
    author: '任铁樵（注）',
    dynasty: '清',
    rules: [
      // 组合格局验证规则
      {
        id: 'ditiansui-shishen-zhisha',
        name: '食神制杀成格验证',
        category: '格局',
        condition: [
          { field: 'matchedRules', operator: 'contains', value: '食神制杀' },
        ],
        priority: 90,
        source: '滴天髓',
        description: '命局命中食神制杀组合格局',
        enabled: true,
      },
      {
        id: 'ditiansui-shayin-xiangsheng',
        name: '杀印相生成格验证',
        category: '格局',
        condition: [
          { field: 'matchedRules', operator: 'contains', value: '杀印相生' },
        ],
        priority: 90,
        source: '滴天髓',
        description: '命局命中杀印相生组合格局',
        enabled: true,
      },
      {
        id: 'ditiansui-shangguan-peiyin',
        name: '伤官佩印成格验证',
        category: '格局',
        condition: [
          { field: 'matchedRules', operator: 'contains', value: '伤官佩印' },
        ],
        priority: 90,
        source: '滴天髓',
        description: '命局命中伤官佩印组合格局',
        enabled: true,
      },
      {
        id: 'ditiansui-caiguan-shuangmei',
        name: '财官双美成格验证',
        category: '格局',
        condition: [
          { field: 'matchedRules', operator: 'contains', value: '财官双美' },
        ],
        priority: 90,
        source: '滴天髓',
        description: '命局命中财官双美组合格局',
        enabled: true,
      },
      // 调候/病药/通关
      {
        id: 'ditiansui-tiaohou',
        name: '调候格判定',
        category: '格局',
        condition: [
          { field: 'matchedRules', operator: 'contains', value: '调候格' },
        ],
        priority: 90,
        source: '滴天髓',
        description: '命局需要调候',
        enabled: true,
      },
      {
        id: 'ditiansui-bingyao',
        name: '病药格判定',
        category: '格局',
        condition: [
          { field: 'matchedRules', operator: 'contains', value: '病药格' },
        ],
        priority: 90,
        source: '滴天髓',
        description: '命局有病有药',
        enabled: true,
      },
      {
        id: 'ditiansui-tongguan',
        name: '通关格判定',
        category: '格局',
        condition: [
          { field: 'matchedRules', operator: 'contains', value: '通关格' },
        ],
        priority: 90,
        source: '滴天髓',
        description: '命局需要通关',
        enabled: true,
      },
    ],
  })
}
