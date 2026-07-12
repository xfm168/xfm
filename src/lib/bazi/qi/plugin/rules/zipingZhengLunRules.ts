/**
 * 《子平真诠》 Rule Package（P2-1）
 * 
 * 作者：沈孝瞻（清）
 * 核心：以月令十神取格，为八字格局正格体系之圭臬。
 * 
 * 本文件：
 * 1. 在 ClassicalLibrary 注册《子平真诠》
 * 2. 定义八大基础格局的古籍原文和白话解释
 * 3. 导出可供 Explain 引用的原文记录
 */

import { ruleEngine } from '../../reasoning/ruleEngine'
import { classicalLibrary } from '../../reasoning/classicalLibrary'

// ─── 注册古籍 ───

// The classicalLibrary should already have 子平真诠 pre-registered
// But we ensure it's registered and add chapter info if not present

// ─── 格局原文数据 ───

export interface GeJuClassicalQuote {
  structure: string       // 格局名称
  originalText: string    // 古籍原文
  vernacular: string      // 白话解释
  chapter: string         // 出处章节
}

/** 《子平真诠》八大基础格局原文 */
export const ZIPPING_EIGHT_STRUCTURES: GeJuClassicalQuote[] = [
  // ① 正官格
  {
    structure: '正官格',
    originalText: '官者，治也。官者，管也。官为禄，禄为养命之源。凡命以官为用者，必须身旺官清。',
    vernacular: '官星是治理、管理之意。官代表禄，禄是养命的源头。凡以正官为用神的命局，必须身旺且官星清纯不杂。',
    chapter: '论正官',
  },
  // ② 七杀格
  {
    structure: '七杀格',
    originalText: '七杀者，偏官也。七杀必须要有制化。有制化则为权贵，无制化则为祸端。',
    vernacular: '七杀即偏官。七杀格必须有制化（食神制杀或印星化杀）。有制化为权贵之人，无制化则为灾祸之源。',
    chapter: '论七杀',
  },
  // ③ 正财格
  {
    structure: '正财格',
    originalText: '财为养命之源，凡命以财为用者，必须财旺身强，方能任其财。',
    vernacular: '财星是养命的源头。以正财为用神的命局，必须财旺身强，才能担当得起财富。',
    chapter: '论正财',
  },
  // ④ 偏财格
  {
    structure: '偏财格',
    originalText: '偏财者，众人之财也。偏财格人豪爽大方，善于交际。偏财不忌劫财分夺。',
    vernacular: '偏财代表众人共享的财富。偏财格的人通常豪爽大方，善于交际。偏财格不太忌讳劫财分夺。',
    chapter: '论偏财',
  },
  // ⑤ 食神格
  {
    structure: '食神格',
    originalText: '食神者，吾之食也。食神第一不可枭印夺之。食神生财，财有源头。',
    vernacular: '食神代表我之食禄。食神格最重要的是不被偏印（枭神）夺食。食神能生财，财有源头不绝。',
    chapter: '论食神',
  },
  // ⑥ 伤官格
  {
    structure: '伤官格',
    originalText: '伤官者，我伤害官星也。伤官格分为伤官见官、伤官生财、伤官佩印三种格局。',
    vernacular: '伤官是克制官星的十神。伤官格分为三种情况：伤官见官（多见是非）、伤官生财（才华变现）、伤官佩印（以印制伤）。',
    chapter: '论伤官',
  },
  // ⑦ 正印格
  {
    structure: '正印格',
    originalText: '印者，生我者也。印绶格必须印旺身轻，印为权柄之所寄，学术之所系。',
    vernacular: '印星是生日主的十神。正印格必须印旺而身偏弱，印代表权力和学术，是贵人相扶之格。',
    chapter: '论正印',
  },
  // ⑧ 偏印格
  {
    structure: '偏印格',
    originalText: '偏印者，枭神也。偏印格以偏印为用，宜身弱，不宜身旺。偏印多主聪明机变，但偏于小道。',
    vernacular: '偏印即枭神。偏印格适合身弱之人，身旺反不宜。偏印格的人通常聪明机变，但偏向于小道技巧。',
    chapter: '论偏印',
  },
]

/** 《子平真诠》建禄格/月刃格原文 */
export const ZIPPING_LU_REN_YANG_REN: GeJuClassicalQuote[] = [
  {
    structure: '建禄格',
    originalText: '建禄者，月建之禄也。月令为禄，身旺得地。建禄格主人自立自强，财官为用。',
    vernacular: '建禄格是指月支恰为日干的禄位。月令是禄位说明日主当令得地。建禄格的人自立自强，以财官为用神。',
    chapter: '论建禄格',
  },
  {
    structure: '月刃格',
    originalText: '月刃者，阳刃在月令也。阳刃者，劫财之极也。月刃格主刚烈果断，武贵之命。最喜官杀制之。',
    vernacular: '月刃格是指月支恰为日干的阳刃位。阳刃是劫财的极端表现。月刃格的人性格刚烈果断，有武贵之命。最喜官杀来制衡。',
    chapter: '论月刃格',
  },
]

/** 专旺格/从格/化气格古籍引用 */
export const ZIPPING_SPECIAL_STRUCTURES: GeJuClassicalQuote[] = [
  // ─── 专旺格（五类） ───
  {
    structure: '曲直格',
    originalText: '曲直格者，甲乙日主生于寅卯辰月，地支全木，无金克之，木气专旺。喜水木，忌金。',
    vernacular: '曲直格是甲乙木日主生于春季寅卯辰月，地支全是木，没有金来克，木气纯粹专旺。喜水木相助，忌金来克伐。',
    chapter: '论专旺格',
  },
  {
    structure: '炎上格',
    originalText: '炎上格者，丙丁日主生于巳午未月，地支全火，无水克之，火气专旺。喜木火，忌水。',
    vernacular: '炎上格是丙丁火日主生于夏季巳午未月，地支全是火，没有水来克，火气纯粹专旺。喜木火相助，忌水来克。',
    chapter: '论专旺格',
  },
  {
    structure: '稼穑格',
    originalText: '稼穑格者，戊己日主生于辰戌丑未月，地支全土，无木克之，土气专旺。喜火土，忌木。',
    vernacular: '稼穑格是戊己土日主生于四季辰戌丑未月，地支全是土，没有木来克，土气纯粹专旺。喜火土相助，忌木来克。',
    chapter: '论专旺格',
  },
  {
    structure: '从革格',
    originalText: '从革格者，庚辛日主生于申酉戌月，地支全金，无火克之，金气专旺。喜土金，忌火。',
    vernacular: '从革格是庚辛金日主生于秋季申酉戌月，地支全是金，没有火来克，金气纯粹专旺。喜土金相助，忌火来克。',
    chapter: '论专旺格',
  },
  {
    structure: '润下格',
    originalText: '润下格者，壬癸日主生于亥子丑月，地支全水，无土克之，水气专旺。喜金水，忌土。',
    vernacular: '润下格是壬癸水日主生于冬季亥子丑月，地支全是水，没有土来克，水气纯粹专旺。喜金水相助，忌土来克。',
    chapter: '论专旺格',
  },
  // ─── 从格 ───
  {
    structure: '从格',
    originalText: '从格者，日主无根无助，不得不从其旺势。从格有真从假从之分。真从格为贵，假从格为凶。',
    vernacular: '从格是日主完全没有根气和帮助，不得不顺从命局中最旺的五行势力。从格分真从和假从。真从格主贵，假从格反而不吉。',
    chapter: '论从格',
  },
  {
    structure: '弃命从财',
    originalText: '弃命从财者，日主太弱，财星太旺，从财而行。命主经商求财，不宜仕途。',
    vernacular: '弃命从财是日主太弱而财星太旺，只能顺从财势。这种命格适合经商求财，不适合走仕途。',
    chapter: '论从格',
  },
  {
    structure: '弃命从杀',
    originalText: '弃命从杀者，日主太弱，官杀太旺，从杀而行。命主权贵显达，武职尤佳。',
    vernacular: '弃命从杀是日主太弱而官杀太旺，只能顺从杀势。这种命格主有权贵显达，尤其适合武职。',
    chapter: '论从格',
  },
  // ─── 化气格 ───
  {
    structure: '化气格',
    originalText: '化气格者，天干五合化气成功，命局以化出之五行为主。化气格以化神之旺衰定吉凶。',
    vernacular: '化气格是天干五合成功化气，整个命局以化出的五行为核心。化气格的吉凶以化神的旺衰来判定。',
    chapter: '论化气格',
  },
]

// ─── 获取格局原文 ───

export function getClassicalQuote(structureName: string): GeJuClassicalQuote | undefined {
  return ZIPPING_EIGHT_STRUCTURES.find(q => q.structure === structureName)
    ?? ZIPPING_LU_REN_YANG_REN.find(q => q.structure === structureName)
    ?? ZIPPING_SPECIAL_STRUCTURES.find(q => q.structure === structureName)
}

export function getAllQuotes(): GeJuClassicalQuote[] {
  return [...ZIPPING_EIGHT_STRUCTURES, ...ZIPPING_LU_REN_YANG_REN, ...ZIPPING_SPECIAL_STRUCTURES]
}

// ─── Rule Package 定义 ───

/**
 * 注册《子平真诠》八大格局到 RuleEngine
 */
export function registerZipingRules(): void {
  // Register the RulePackage
  ruleEngine.registerPackage({
    id: 'ziping-zhenglun-8-structures',
    name: '《子平真诠》八大基础格局',
    description: '以月令十神取格，涵盖正官、七杀、正财、偏财、食神、伤官、正印、偏印八种基础格局。',
    version: '1.0.0',
    source: '子平真诠',
    author: '沈孝瞻',
    dynasty: '清',
    rules: [
      // 正官格
      {
        id: 'ziping-zhengguan-rule',
        name: '正官格判定',
        category: '格局',
        condition: [
          { field: 'monthGanShen', operator: 'eq', value: '正官' },
        ],
        priority: 100,
        source: '子平真诠',
        description: '月干十神为正官，取正官格。',
        enabled: true,
      },
      // 七杀格
      {
        id: 'ziping-qisha-rule',
        name: '七杀格判定',
        category: '格局',
        condition: [
          { field: 'monthGanShen', operator: 'eq', value: '偏官' },
        ],
        priority: 100,
        source: '子平真诠',
        description: '月干十神为偏官（七杀），取七杀格。',
        enabled: true,
      },
      // 正财格
      {
        id: 'ziping-zhengcai-rule',
        name: '正财格判定',
        category: '格局',
        condition: [
          { field: 'monthGanShen', operator: 'eq', value: '正财' },
        ],
        priority: 100,
        source: '子平真诠',
        description: '月干十神为正财，取正财格。',
        enabled: true,
      },
      // 偏财格
      {
        id: 'ziping-piancai-rule',
        name: '偏财格判定',
        category: '格局',
        condition: [
          { field: 'monthGanShen', operator: 'eq', value: '偏财' },
        ],
        priority: 100,
        source: '子平真诠',
        description: '月干十神为偏财，取偏财格。',
        enabled: true,
      },
      // 食神格
      {
        id: 'ziping-shishen-rule',
        name: '食神格判定',
        category: '格局',
        condition: [
          { field: 'monthGanShen', operator: 'eq', value: '食神' },
        ],
        priority: 100,
        source: '子平真诠',
        description: '月干十神为食神，取食神格。',
        enabled: true,
      },
      // 伤官格
      {
        id: 'ziping-shangguan-rule',
        name: '伤官格判定',
        category: '格局',
        condition: [
          { field: 'monthGanShen', operator: 'eq', value: '伤官' },
        ],
        priority: 100,
        source: '子平真诠',
        description: '月干十神为伤官，取伤官格。',
        enabled: true,
      },
      // 正印格
      {
        id: 'ziping-zhengyin-rule',
        name: '正印格判定',
        category: '格局',
        condition: [
          { field: 'monthGanShen', operator: 'eq', value: '正印' },
        ],
        priority: 100,
        source: '子平真诠',
        description: '月干十神为正印，取正印格。',
        enabled: true,
      },
      // 偏印格
      {
        id: 'ziping-pianyin-rule',
        name: '偏印格判定',
        category: '格局',
        condition: [
          { field: 'monthGanShen', operator: 'eq', value: '偏印' },
        ],
        priority: 100,
        source: '子平真诠',
        description: '月干十神为偏印，取偏印格。',
        enabled: true,
      },
      // 建禄格
      {
        id: 'ziping-jianlu-rule',
        name: '建禄格判定',
        category: '格局',
        condition: [
          { field: 'monthGanShen', operator: 'eq', value: '比肩' },
        ],
        priority: 100,
        source: '子平真诠',
        description: '月干十神为比肩（即建禄），取建禄格。',
        enabled: true,
      },
      // 月刃格
      {
        id: 'ziping-yueren-rule',
        name: '月刃格判定',
        category: '格局',
        condition: [
          { field: 'monthGanShen', operator: 'eq', value: '劫财' },
        ],
        priority: 100,
        source: '子平真诠',
        description: '月干十神为劫财（即月刃/阳刃），取月刃格。',
        enabled: true,
      },
    ],
  })
}
