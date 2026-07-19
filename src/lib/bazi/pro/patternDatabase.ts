/**
 * H3 Module 4: Professional Pattern Engine — 格局数据库
 *
 * 包含：
 * - 正格规则（10种）：月令本气定格法
 * - 特殊格规则（10种）：特殊条件判定
 * - PatternRuleDatabase（统一规则库）
 * - 格局 AI Explain 知识库
 */

import type { ShenShi, FiveElement, HeavenlyStem } from '@/lib/core/types/base'
import type {
  PatternType, PatternClass, PatternSchool,
  PatternRule, PatternRuleCheckFn, PatternRuleContext,
  PatternDetail, BreakFactor,
} from './patternTypes'

// ─── 辅助函数 ───

function hasShenShi(ctx: PatternRuleContext, name: ShenShi, minPower: number = 20): boolean {
  return (ctx.tenGodPower[name] ?? 0) >= minPower
}

function hasShenShiCount(ctx: PatternRuleContext, name: ShenShi, minCount: number = 1): boolean {
  return (ctx.tenGodCount[name] ?? 0) >= minCount
}

function noShenShi(ctx: PatternRuleContext, name: ShenShi): boolean {
  return (ctx.tenGodCount[name] ?? 0) === 0
}

function shenShiDeLing(ctx: PatternRuleContext, name: ShenShi): boolean {
  return ctx.tenGodDeLing[name] === true
}

function fiveElementDominant(ctx: PatternRuleContext, elem: FiveElement, minPct: number = 40): boolean {
  const total = Object.values(ctx.fiveElementCount).reduce((a, b) => a + b, 0)
  if (total === 0) return false
  const pct = (ctx.fiveElementCount[elem] ?? 0) / total * 100
  return pct >= minPct
}

function dayMasterStrong(ctx: PatternRuleContext): boolean {
  return ctx.dayMasterWangShuai === '旺' || ctx.dayMasterWangShuai === '相'
}

function dayMasterWeak(ctx: PatternRuleContext): boolean {
  return ctx.dayMasterWangShuai === '囚' || ctx.dayMasterWangShuai === '死'
}

function totalPower(ctx: PatternRuleContext, names: ShenShi[]): number {
  return names.reduce((sum, n) => sum + (ctx.tenGodPower[n] ?? 0), 0)
}

// ─── 正格规则（10种） ───
// 月令本气十神决定基本格局，配合力量和条件判定

const ZHENG_GUA_RULES: PatternRule[] = [
  // ── 正官格 ──
  {
    id: 'zheng-guan-ge',
    patternName: '正官格',
    patternClass: '正格',
    school: ['子平', '滴天髓', '子平真诠', '穷通宝鉴'],
    priority: 90,
    check: (ctx) => ctx.monthCommandShenShi === '正官' && hasShenShi(ctx, '正官', 30),
    description: '月令本气为正官，官星有力，主人贵气',
    reference: '子平真诠·论正官格',
    involvedShenShi: ['正官'],
    breakConditions: [
      (ctx) => hasShenShi(ctx, '伤官', 25),   // 伤官见官
      (ctx) => hasShenShi(ctx, '偏官', 30),    // 官杀混杂
    ],
    boostConditions: [
      (ctx) => hasShenShi(ctx, '正印', 25),    // 官印相生
      (ctx) => hasShenShi(ctx, '正财', 20),    // 财官双美
    ],
  },
  // ── 七杀格 ──
  {
    id: 'qi-sha-ge',
    patternName: '七杀格',
    patternClass: '正格',
    school: ['子平', '滴天髓', '子平真诠', '穷通宝鉴'],
    priority: 90,
    check: (ctx) => ctx.monthCommandShenShi === '偏官' && hasShenShi(ctx, '偏官', 30),
    description: '月令本气为七杀，杀星有力，主人威权',
    reference: '子平真诠·论七杀格',
    involvedShenShi: ['偏官'],
    breakConditions: [
      (ctx) => noShenShi(ctx, '食神') && noShenShi(ctx, '偏印') && noShenShi(ctx, '正印'), // 七杀无制
    ],
    boostConditions: [
      (ctx) => hasShenShi(ctx, '食神', 30),   // 食神制杀
      (ctx) => hasShenShi(ctx, '偏印', 25),    // 杀印相生
    ],
  },
  // ── 正印格 ──
  {
    id: 'zheng-yin-ge',
    patternName: '正印格',
    patternClass: '正格',
    school: ['子平', '滴天髓', '子平真诠', '穷通宝鉴'],
    priority: 88,
    check: (ctx) => ctx.monthCommandShenShi === '正印' && hasShenShi(ctx, '正印', 30),
    description: '月令本气为正印，印星得令，主人学业出众',
    reference: '子平真诠·论正印格',
    involvedShenShi: ['正印'],
    breakConditions: [
      (ctx) => hasShenShi(ctx, '偏财', 40),   // 财破印
    ],
    boostConditions: [
      (ctx) => hasShenShi(ctx, '正官', 25),   // 官印相生
      (ctx) => dayMasterStrong(ctx),           // 身旺用印
    ],
  },
  // ── 偏印格 ──
  {
    id: 'pian-yin-ge',
    patternName: '偏印格',
    patternClass: '正格',
    school: ['子平', '子平真诠'],
    priority: 86,
    check: (ctx) => ctx.monthCommandShenShi === '偏印' && hasShenShi(ctx, '偏印', 30),
    description: '月令本气为偏印，偏印得令，主人偏门才华',
    reference: '子平真诠·论偏印格',
    involvedShenShi: ['偏印'],
    breakConditions: [
      (ctx) => hasShenShi(ctx, '食神', 40),   // 枭印夺食
    ],
    boostConditions: [
      (ctx) => hasShenShi(ctx, '偏官', 25),   // 杀印相生
      (ctx) => noShenShi(ctx, '食神'),        // 无食可夺
    ],
  },
  // ── 正财格 ──
  {
    id: 'zheng-cai-ge',
    patternName: '正财格',
    patternClass: '正格',
    school: ['子平', '滴天髓', '子平真诠', '穷通宝鉴'],
    priority: 85,
    check: (ctx) => ctx.monthCommandShenShi === '正财' && hasShenShi(ctx, '正财', 30),
    description: '月令本气为正财，财星得令，主人财运稳定',
    reference: '子平真诠·论正财格',
    involvedShenShi: ['正财'],
    breakConditions: [
      (ctx) => hasShenShi(ctx, '比肩', 50),   // 比劫夺财
      (ctx) => hasShenShi(ctx, '劫财', 50),
    ],
    boostConditions: [
      (ctx) => hasShenShi(ctx, '正官', 25),   // 财官双美
      (ctx) => dayMasterWeak(ctx),             // 身弱喜财
    ],
  },
  // ── 偏财格 ──
  {
    id: 'pian-cai-ge',
    patternName: '偏财格',
    patternClass: '正格',
    school: ['子平', '滴天髓', '子平真诠'],
    priority: 85,
    check: (ctx) => ctx.monthCommandShenShi === '偏财' && hasShenShi(ctx, '偏财', 30),
    description: '月令本气为偏财，偏财运佳，主人社交广泛',
    reference: '子平真诠·论偏财格',
    involvedShenShi: ['偏财'],
    breakConditions: [
      (ctx) => hasShenShi(ctx, '比肩', 50),
      (ctx) => hasShenShi(ctx, '劫财', 50),
    ],
    boostConditions: [
      (ctx) => hasShenShi(ctx, '正官', 25),   // 财官相生
      (ctx) => hasShenShi(ctx, '食神', 25),   // 食伤生财
    ],
  },
  // ── 食神格 ──
  {
    id: 'shi-shen-ge',
    patternName: '食神格',
    patternClass: '正格',
    school: ['子平', '滴天髓', '子平真诠', '穷通宝鉴'],
    priority: 87,
    check: (ctx) => ctx.monthCommandShenShi === '食神' && hasShenShi(ctx, '食神', 30),
    description: '月令本气为食神，食神得令，主人福气深厚',
    reference: '子平真诠·论食神格',
    involvedShenShi: ['食神'],
    breakConditions: [
      (ctx) => hasShenShi(ctx, '偏印', 40),   // 枭印夺食
    ],
    boostConditions: [
      (ctx) => hasShenShi(ctx, '偏财', 25),   // 食神生财
      (ctx) => dayMasterStrong(ctx),           // 身旺泄秀
    ],
  },
  // ── 伤官格 ──
  {
    id: 'shang-guan-ge',
    patternName: '伤官格',
    patternClass: '正格',
    school: ['子平', '子平真诠'],
    priority: 86,
    check: (ctx) => ctx.monthCommandShenShi === '伤官' && hasShenShi(ctx, '伤官', 30),
    description: '月令本气为伤官，才华横溢但需制化',
    reference: '子平真诠·论伤官格',
    involvedShenShi: ['伤官'],
    breakConditions: [
      (ctx) => hasShenShi(ctx, '正官', 30),   // 伤官见官
    ],
    boostConditions: [
      (ctx) => hasShenShi(ctx, '正印', 30),   // 伤官佩印
      (ctx) => hasShenShi(ctx, '偏财', 25),   // 伤官生财
    ],
  },
  // ── 建禄格 ──
  {
    id: 'jian-lu-ge',
    patternName: '建禄格',
    patternClass: '正格',
    school: ['子平', '穷通宝鉴'],
    priority: 80,
    check: (ctx) => {
      // 月支临官位，即月支本气与日主相同
      return ctx.monthCommandShenShi === '比肩' && shenShiDeLing(ctx, '比肩')
    },
    description: '月令在日主临官之地，建禄格，身旺有力',
    reference: '渊海子平·论建禄格',
    involvedShenShi: ['比肩'],
    boostConditions: [
      (ctx) => hasShenShi(ctx, '食神', 20),   // 身旺泄秀
      (ctx) => hasShenShi(ctx, '偏财', 20),   // 身旺任财
    ],
  },
  // ── 月刃格 ──
  {
    id: 'yue-ren-ge',
    patternName: '月刃格',
    patternClass: '正格',
    school: ['子平', '穷通宝鉴'],
    priority: 78,
    check: (ctx) => {
      // 月支帝旺位，比肩得令且日主极旺
      return ctx.monthCommandShenShi === '劫财' && shenShiDeLing(ctx, '劫财') && dayMasterStrong(ctx)
    },
    description: '月令在日主帝旺之地，月刃格，日主过旺需泄',
    reference: '渊海子平·论月刃格',
    involvedShenShi: ['劫财'],
    breakConditions: [
      (ctx) => noShenShi(ctx, '食神') && noShenShi(ctx, '伤官') && noShenShi(ctx, '偏财') && noShenShi(ctx, '正财'),
    ],
    boostConditions: [
      (ctx) => hasShenShi(ctx, '食神', 25),   // 食伤泄秀
      (ctx) => hasShenShi(ctx, '偏财', 25),   // 财星耗身
    ],
  },
]

// ─── 特殊格规则（10种） ───

const SPECIAL_GUA_RULES: PatternRule[] = [
  // ── 从格（通用从格条件） ──
  {
    id: 'cong-ge',
    patternName: '从格',
    patternClass: '特殊格',
    school: ['子平', '子平真诠', '穷通宝鉴'],
    priority: 70,
    check: (ctx) => {
      // 日主极弱，无根无助，全局从旺于某一五行
      return dayMasterWeak(ctx) &&
        !shenShiDeLing(ctx, '比肩') && !shenShiDeLing(ctx, '劫财') &&
        noShenShi(ctx, '比肩') && noShenShi(ctx, '劫财') &&
        !hasShenShi(ctx, '正印', 10) && !hasShenShi(ctx, '偏印', 10)
    },
    description: '日主极弱无根无助，全局气势归于一方，从格',
    reference: '子平真诠·论从格',
    involvedShenShi: ['比肩', '劫财', '正印', '偏印'],
  },
  // ── 从儿格（从食伤） ──
  {
    id: 'cong-er-ge',
    patternName: '从儿格',
    patternClass: '特殊格',
    school: ['子平', '子平真诠'],
    priority: 68,
    check: (ctx) => {
      // 日主弱，食伤极旺
      return dayMasterWeak(ctx) &&
        totalPower(ctx, ['食神', '伤官']) >= 60 &&
        !hasShenShi(ctx, '正印', 15) && !hasShenShi(ctx, '偏印', 15)
    },
    description: '日主弱而食伤极旺，从食伤之气势',
    reference: '子平真诠·论从儿格',
    involvedShenShi: ['食神', '伤官'],
  },
  // ── 从财格 ──
  {
    id: 'cong-cai-ge',
    patternName: '从财格',
    patternClass: '特殊格',
    school: ['子平', '子平真诠', '穷通宝鉴'],
    priority: 68,
    check: (ctx) => {
      return dayMasterWeak(ctx) &&
        totalPower(ctx, ['偏财', '正财']) >= 60 &&
        noShenShi(ctx, '比肩') && noShenShi(ctx, '劫财')
    },
    description: '日主弱而财星极旺无比劫争夺，从财格',
    reference: '子平真诠·论从财格',
    involvedShenShi: ['偏财', '正财', '比肩', '劫财'],
  },
  // ── 从杀格 ──
  {
    id: 'cong-sha-ge',
    patternName: '从杀格',
    patternClass: '特殊格',
    school: ['子平', '子平真诠', '穷通宝鉴'],
    priority: 68,
    check: (ctx) => {
      return dayMasterWeak(ctx) &&
        totalPower(ctx, ['偏官', '正官']) >= 60 &&
        noShenShi(ctx, '食神') && noShenShi(ctx, '伤官') &&
        !hasShenShi(ctx, '正印', 15) && !hasShenShi(ctx, '偏印', 15)
    },
    description: '日主弱而官杀极旺无制化，从杀格',
    reference: '子平真诠·论从杀格',
    involvedShenShi: ['偏官', '正官'],
  },
  // ── 专旺格 ──
  {
    id: 'zhuan-wang-ge',
    patternName: '专旺格',
    patternClass: '特殊格',
    school: ['子平', '子平真诠', '穷通宝鉴'],
    priority: 72,
    check: (ctx) => {
      // 日主极旺，比劫成势，无官杀
      return dayMasterStrong(ctx) &&
        totalPower(ctx, ['比肩', '劫财']) >= 70 &&
        noShenShi(ctx, '偏官') && noShenShi(ctx, '正官')
    },
    description: '日主极旺，比劫成势无官杀，专旺格',
    reference: '子平真诠·论专旺格',
    involvedShenShi: ['比肩', '劫财', '偏官', '正官'],
    breakConditions: [
      (ctx) => hasShenShi(ctx, '偏官', 20),
      (ctx) => hasShenShi(ctx, '正官', 20),
    ],
  },
  // ── 化气格 ──
  {
    id: 'hua-qi-ge',
    patternName: '化气格',
    patternClass: '特殊格',
    school: ['子平', '穷通宝鉴'],
    priority: 65,
    check: (ctx) => {
      // 五合化气条件：甲己合化土、乙庚合化金、丙辛合化水、丁壬合化木、戊癸合化火
      const [yg, yz, mg, mz, dg, dz, hg, hz] = ctx.heavenlyStems as unknown as string[]
      // 检查是否有天干五合
      const pairs: [string, string, FiveElement][] = [
        ['甲', '己', '土'], ['己', '甲', '土'],
        ['乙', '庚', '金'], ['庚', '乙', '金'],
        ['丙', '辛', '水'], ['辛', '丙', '水'],
        ['丁', '壬', '木'], ['壬', '丁', '木'],
        ['戊', '癸', '火'], ['癸', '戊', '火'],
      ]
      for (const [a, b, elem] of pairs) {
        const stems = [yg, mg, dg, hg]
        if (stems.includes(a) && stems.includes(b)) {
          // 合化之五行需得令或力量强
          return ctx.monthElement === elem || (ctx.fiveElementCount[elem] ?? 0) >= 3
        }
      }
      return false
    },
    description: '天干五合化气，化气之五行得令有力',
    reference: '穷通宝鉴·论化气格',
    involvedShenShi: [],
  },
  // ── 炎上格（火专旺） ──
  {
    id: 'yan-shang-ge',
    patternName: '炎上格',
    patternClass: '特殊格',
    school: ['子平', '穷通宝鉴'],
    priority: 65,
    check: (ctx) => {
      return ctx.dayMasterElement === '火' &&
        fiveElementDominant(ctx, '火', 50) &&
        dayMasterStrong(ctx) &&
        noShenShi(ctx, '偏官') && noShenShi(ctx, '正官')
    },
    description: '丙丁日主，火气成局，炎上格',
    reference: '穷通宝鉴·论炎上格',
    involvedShenShi: ['偏官', '正官'],
  },
  // ── 润下格（水专旺） ──
  {
    id: 'run-xia-ge',
    patternName: '润下格',
    patternClass: '特殊格',
    school: ['子平', '穷通宝鉴'],
    priority: 65,
    check: (ctx) => {
      return ctx.dayMasterElement === '水' &&
        fiveElementDominant(ctx, '水', 50) &&
        dayMasterStrong(ctx) &&
        noShenShi(ctx, '偏官') && noShenShi(ctx, '正官')
    },
    description: '壬癸日主，水气成局，润下格',
    reference: '穷通宝鉴·论润下格',
    involvedShenShi: ['偏官', '正官'],
  },
  // ── 稼穑格（土专旺） ──
  {
    id: 'jia-se-ge',
    patternName: '稼穑格',
    patternClass: '特殊格',
    school: ['子平', '穷通宝鉴'],
    priority: 65,
    check: (ctx) => {
      return ctx.dayMasterElement === '土' &&
        fiveElementDominant(ctx, '土', 50) &&
        dayMasterStrong(ctx) &&
        noShenShi(ctx, '偏官') && noShenShi(ctx, '正官')
    },
    description: '戊己日主，土气成局，稼穑格',
    reference: '穷通宝鉴·论稼穑格',
    involvedShenShi: ['偏官', '正官'],
  },
  // ── 曲直格（木专旺） ──
  {
    id: 'qu-zhi-ge',
    patternName: '曲直格',
    patternClass: '特殊格',
    school: ['子平', '穷通宝鉴'],
    priority: 65,
    check: (ctx) => {
      return ctx.dayMasterElement === '木' &&
        fiveElementDominant(ctx, '木', 50) &&
        dayMasterStrong(ctx) &&
        noShenShi(ctx, '偏官') && noShenShi(ctx, '正官')
    },
    description: '甲乙日主，木气成局，曲直格',
    reference: '穷通宝鉴·论曲直格',
    involvedShenShi: ['偏官', '正官'],
  },
]

// ─── 统一规则库 ───

/** 所有格局规则 */
export const PATTERN_RULES: PatternRule[] = [...ZHENG_GUA_RULES, ...SPECIAL_GUA_RULES]

/** 按格局名称查找规则 */
export function findPatternRule(name: PatternType): PatternRule | undefined {
  return PATTERN_RULES.find(r => r.patternName === name)
}

/** 按分类获取规则 */
export function getRulesByClass(cls: PatternClass): PatternRule[] {
  return PATTERN_RULES.filter(r => r.patternClass === cls)
}

/** 按流派获取规则 */
export function getRulesBySchool(school: PatternSchool): PatternRule[] {
  return PATTERN_RULES.filter(r => r.school.includes(school))
}

// ─── 格局描述知识库（供 AI Explain） ───

interface PatternKnowledge {
  name: PatternType
  patternClass: PatternClass
  description: string
  classicalReference: string
  modernInterpretation: string
  characteristics: string[]
  career: string[]
  wealth: string[]
  marriage: string[]
  health: string[]
  advantages: string[]
  risks: string[]
  adjustments: string[]
  keywords: string[]
}

const PATTERN_KB: PatternKnowledge[] = [
  {
    name: '正官格', patternClass: '正格',
    description: '月令正官得力，主人贵气，仕途有望。',
    classicalReference: '正官者，克我之同性，主贵气、守法、名誉。得令成格，主人品端正、有管理才能。',
    modernInterpretation: '正官格代表事业有成、社会地位高、为人正直守规矩。',
    characteristics: ['正直', '守规矩', '有责任感', '注重名誉'],
    career: ['公务员', '管理', '教育', '法律'],
    wealth: ['靠职位得财', '收入稳定', '社会地位高'],
    marriage: ['婚姻正配', '伴侣端庄'],
    health: ['肾脏泌尿', '生殖系统'],
    advantages: ['社会地位高', '事业稳定', '名声好', '婚姻正配'],
    risks: ['怕伤官克之', '过于循规蹈矩', '缺乏变通'],
    adjustments: ['佩印护官', '财生官旺', '避免伤官透出'],
    keywords: ['贵气', '管理', '正直', '名誉', '仕途'],
  },
  {
    name: '七杀格', patternClass: '正格',
    description: '月令七杀得力，主人威权，有魄力但压力大。',
    classicalReference: '七杀者，克我之异性，主权威与压力。有制化为权，无制化为祸。',
    modernInterpretation: '七杀格代表有魄力、敢于冒险，适合创业或高风险行业。',
    characteristics: ['果断', '有魄力', '压力大', '不惧挑战'],
    career: ['军警', '企业家', '外科医生', '风险行业'],
    wealth: ['大起大落', '高风险高回报'],
    marriage: ['感情中有控制欲', '晚婚较稳'],
    health: ['注意意外伤害', '肝胆', '血压'],
    advantages: ['魄力非凡', '化压力为动力', '适合创业'],
    risks: ['压力过大', '意外伤害', '无制化为祸'],
    adjustments: ['食神制杀', '印星化杀', '避免杀无制'],
    keywords: ['魄力', '权力', '冒险', '压力', '挑战'],
  },
  {
    name: '正印格', patternClass: '正格',
    description: '月令正印得力，主人学业出众，贵人运佳。',
    classicalReference: '正印者，生我之同性，主学问、贵人、保护。得令成格，主人聪明好学。',
    modernInterpretation: '正印格代表学业优秀、有贵人相助、仁慈善良。',
    characteristics: ['善良', '好学', '有贵人运', '传统保守'],
    career: ['教育', '学术', '文化', '慈善', '医疗'],
    wealth: ['靠学问得财', '贵人资助'],
    marriage: ['伴侣有母性光辉', '感情温馨'],
    health: ['脾胃', '整体健康较好'],
    advantages: ['学业出众', '贵人庇护', '仁慈待人'],
    risks: ['财破印', '过于保守', '依赖性强'],
    adjustments: ['避免财星克印', '官印相生为佳', '适度进取'],
    keywords: ['贵人', '学业', '仁慈', '保护', '学问'],
  },
  {
    name: '偏印格', patternClass: '正格',
    description: '月令偏印得力，主人有偏门才华，直觉力强。',
    classicalReference: '偏印者，生我之异性，又名枭神。有偏门学问，化杀为吉。',
    modernInterpretation: '偏印格代表思维独特、有直觉力，适合研究或技术领域。',
    characteristics: ['思维独特', '直觉强', '内向', '有偏才'],
    career: ['研究', '玄学宗教', '艺术', '技术发明'],
    wealth: ['偏门得财', '专利收入'],
    marriage: ['感情中较为冷淡', '需要空间'],
    health: ['心脏', '神经系统', '失眠'],
    advantages: ['直觉力强', '非传统思维', '化杀为吉'],
    risks: ['枭印夺食', '性格孤僻', '人际关系淡'],
    adjustments: ['避免枭印夺食', '化杀为吉为佳', '保持社交'],
    keywords: ['偏门', '直觉', '孤独', '偏才', '非传统'],
  },
  {
    name: '正财格', patternClass: '正格',
    description: '月令正财得力，主人财运稳定，勤劳务实。',
    classicalReference: '正财者，我克之同性，为正当之财。得令成格，主人勤劳致富。',
    modernInterpretation: '正财格代表稳定收入、善于理财、生活踏实。',
    characteristics: ['勤劳', '务实', '节俭', '稳重'],
    career: ['金融财务', '行政管理', '稳定职业'],
    wealth: ['财运稳定', '细水长流'],
    marriage: ['婚姻稳定', '伴侣务实'],
    health: ['脾胃', '消化系统'],
    advantages: ['财运稳定', '婚姻可靠', '信用良好'],
    risks: ['守财太过', '缺乏魄力', '比劫夺财'],
    adjustments: ['官星护财', '避免比劫争夺', '适度投资'],
    keywords: ['稳定', '务实', '勤劳', '节俭', '正当'],
  },
  {
    name: '偏财格', patternClass: '正格',
    description: '月令偏财得力，主人偏财运佳，社交能力强。',
    classicalReference: '偏财者，我克之异性，为众人之财。得令成格，主人豪爽大方。',
    modernInterpretation: '偏财格代表善于经营人脉、有商业头脑、偏财运佳。',
    characteristics: ['大方', '社交能力强', '豪爽', '人缘广'],
    career: ['商业经营', '投资理财', '社交行业', '贸易'],
    wealth: ['偏财运佳', '善于投资'],
    marriage: ['异性缘佳', '感情丰富'],
    health: ['脾胃消化', '注意饮食'],
    advantages: ['人脉广泛', '商业嗅觉敏锐'],
    risks: ['比劫夺财', '挥霍无度', '感情复杂'],
    adjustments: ['官星护财', '控制支出', '专一感情'],
    keywords: ['偏财', '社交', '投资', '慷慨', '异性缘'],
  },
  {
    name: '食神格', patternClass: '正格',
    description: '月令食神得力，主人福气深厚，才华出众。',
    classicalReference: '食神者，我生之同性，为寿星、福星。得令成格，主人衣食无忧。',
    modernInterpretation: '食神格代表有才华、有福气、生活品质高。',
    characteristics: ['温和', '有才华', '享受生活', '人缘好'],
    career: ['艺术创作', '餐饮美食', '教育', '文化事业'],
    wealth: ['财运亨通', '有口福之财'],
    marriage: ['感情甜蜜', '家庭和睦'],
    health: ['消化系统', '营养过剩需注意'],
    advantages: ['才华横溢', '人缘极佳', '生活品质高'],
    risks: ['过于安逸', '缺乏进取', '枭印夺食'],
    adjustments: ['食神生财为佳', '避免偏印克制', '保持进取心'],
    keywords: ['福气', '才华', '温和', '享受', '口福'],
  },
  {
    name: '伤官格', patternClass: '正格',
    description: '月令伤官得力，主人才华横溢但需佩印制化。',
    classicalReference: '伤官者，我生之异性，聪明才智但叛逆。佩印为吉，见官为祸。',
    modernInterpretation: '伤官格代表创新能力极强，适合技术、艺术、法律领域。',
    characteristics: ['聪明', '叛逆', '有才华', '好表现'],
    career: ['演艺娱乐', '法律', '技术专家', '自由职业'],
    wealth: ['靠才华赚钱', '收入上限高'],
    marriage: ['感情丰富', '需注意沟通'],
    health: ['心脏', '呼吸系统', '眼睛'],
    advantages: ['创新能力强', '才艺出众', '敢于挑战'],
    risks: ['伤官见官', '口舌是非', '感情波折'],
    adjustments: ['伤官佩印为吉', '生财泄秀', '避免见官'],
    keywords: ['叛逆', '才华', '创新', '表演', '聪明'],
  },
  {
    name: '建禄格', patternClass: '正格',
    description: '月令临官位，日主身旺有力，需食伤泄秀。',
    classicalReference: '建禄者，月令临官之地。身旺需泄，食伤生财为佳。',
    modernInterpretation: '建禄格代表自身能力强、精力充沛，需找到正确的发力方向。',
    characteristics: ['精力充沛', '自信', '行动力强'],
    career: ['独立创业', '管理岗位', '竞争性行业'],
    wealth: ['靠自己争取', '身旺任财'],
    marriage: ['追求平等', '独立型伴侣'],
    health: ['注意平衡'],
    advantages: ['自身能力强', '精力充沛', '抗压能力强'],
    risks: ['过旺则刚愎', '不听劝', '缺乏方向'],
    adjustments: ['食伤泄秀为佳', '财星耗身', '官杀约束'],
    keywords: ['建禄', '身旺', '临官', '精力', '自强'],
  },
  {
    name: '月刃格', patternClass: '正格',
    description: '月令帝旺之地，日主过旺需泄，否则为祸。',
    classicalReference: '月刃者，月令帝旺之地。日主过旺，必须食伤泄之或财星耗之。',
    modernInterpretation: '月刃格代表意志力极强但容易过度，需要找到宣泄出口。',
    characteristics: ['意志坚强', '固执', '好胜', '过刚'],
    career: ['军警', '竞技体育', '创业'],
    wealth: ['大起大落', '需泄秀方吉'],
    marriage: ['感情中过于强势', '需柔和调和'],
    health: ['注意肝胆', '外伤'],
    advantages: ['意志力极强', '抗压能力强', '有魄力'],
    risks: ['过刚易折', '固执己见', '破财伤身'],
    adjustments: ['食伤泄秀必须', '财星耗身为佳', '避免无泄'],
    keywords: ['月刃', '帝旺', '过旺', '刚强', '泄秀'],
  },
  {
    name: '从格', patternClass: '特殊格',
    description: '日主极弱无根无助，全局气势归于一方，顺势而从。',
    classicalReference: '从格者，日主无根无助，全局气势偏于一方，从之则为贵。',
    modernInterpretation: '从格代表顺势而为的智慧，不是被动而是借力。',
    characteristics: ['灵活', '善于借力', '适应力强'],
    career: ['依赖格局所从之五行决定'],
    wealth: ['顺势得财', '需跟对方向'],
    marriage: ['看所从五行决定'],
    health: ['日主五行弱需补'],
    advantages: ['善于借力', '灵活变通', '可大富大贵'],
    risks: ['从神被破', '格局逆转', '方向错误'],
    adjustments: ['不可逆势', '补所从五行', '避免日主五行出现'],
    keywords: ['从势', '借力', '顺势', '灵活', '极弱'],
  },
  {
    name: '专旺格', patternClass: '特殊格',
    description: '日主极旺比劫成势，无官杀，顺其旺势。',
    classicalReference: '专旺者，比劫成势无官杀，一气专旺。顺之则吉，逆之则凶。',
    modernInterpretation: '专旺格代表在某一方面具有极强的专注力和统治力。',
    characteristics: ['专注', '统治力', '一气呵成'],
    career: ['独立事业', '垄断行业', '领袖'],
    wealth: ['横财运', '大富'],
    marriage: ['强势性格', '需柔和伴侣'],
    health: ['过旺之疾'],
    advantages: ['专注力极强', '统治力', '可成大事'],
    risks: ['怕官杀逆势', '过刚易折', '不喜克制'],
    adjustments: ['顺其旺势', '食伤泄秀', '财星耗身'],
    keywords: ['专旺', '一气', '成势', '统治', '极旺'],
  },
  {
    name: '化气格', patternClass: '特殊格',
    description: '天干五合化气成功，化气五行主导全局。',
    classicalReference: '化气者，天干五合，化气得令则成格。甲己化土、乙庚化金等。',
    modernInterpretation: '化气格代表合作关系转化为新的力量，善于整合资源。',
    characteristics: ['善于合作', '转化能力强', '整合力'],
    career: ['合作经营', '资源整合', '外交'],
    wealth: ['合作得财', '整合收益'],
    marriage: ['合作关系型婚姻'],
    health: ['看化气五行'],
    advantages: ['整合能力强', '善于合作', '化凶为吉'],
    risks: ['合而不化', '化气被冲', '合逢冲破'],
    adjustments: ['化气五行需得令', '避免冲破', '顺化气之势'],
    keywords: ['化气', '五合', '转化', '合作', '整合'],
  },
  {
    name: '炎上格', patternClass: '特殊格',
    description: '丙丁日主，火气成局，专旺于火。',
    classicalReference: '炎上者，丙丁日主，火气成局。有木生火更佳，怕水克火。',
    modernInterpretation: '炎上格代表热情奔放、光芒四射，但需有木生火支持。',
    characteristics: ['热情', '光芒四射', '奔放'],
    career: ['演艺', '传媒', '照明能源'],
    wealth: ['热情得财', '需木火相助'],
    marriage: ['热情似火', '需水性调和'],
    health: ['心脏', '眼睛'],
    advantages: ['热情感染力强', '创造力', '表现力'],
    risks: ['过热则焚', '水克火破格', '急躁'],
    adjustments: ['木生火为源', '避免水克', '适度降温'],
    keywords: ['炎上', '火旺', '热情', '奔放', '丙丁'],
  },
  {
    name: '润下格', patternClass: '特殊格',
    description: '壬癸日主，水气成局，专旺于水。',
    classicalReference: '润下者，壬癸日主，水气成局。有金生水更佳，怕土克水。',
    modernInterpretation: '润下格代表智慧深邃、灵活变通，如水利万物。',
    characteristics: ['智慧', '灵活', '深邃'],
    career: ['金融', '航运', '贸易', '咨询'],
    wealth: ['流动得财', '灵活经营'],
    marriage: ['灵活包容'],
    health: ['肾脏', '泌尿'],
    advantages: ['智慧过人', '灵活变通', '适应力强'],
    risks: ['土克水破格', '过于圆滑', '缺乏定力'],
    adjustments: ['金生水为源', '避免土克', '保持方向'],
    keywords: ['润下', '水旺', '智慧', '灵活', '壬癸'],
  },
  {
    name: '稼穑格', patternClass: '特殊格',
    description: '戊己日主，土气成局，专旺于土。',
    classicalReference: '稼穑者，戊己日主，土气成局。有火生土更佳，怕木克土。',
    modernInterpretation: '稼穑格代表厚重稳健、包容万物，如大地承载。',
    characteristics: ['厚重', '稳健', '包容'],
    career: ['房地产', '农业', '建筑', '仓储'],
    wealth: ['稳健积累', '土地之财'],
    marriage: ['稳重踏实'],
    health: ['脾胃', '消化'],
    advantages: ['稳重可靠', '包容力强', '厚积薄发'],
    risks: ['木克土破格', '过于保守', '固执'],
    adjustments: ['火生土为源', '避免木克', '适度灵活'],
    keywords: ['稼穑', '土旺', '厚重', '稳健', '戊己'],
  },
  {
    name: '曲直格', patternClass: '特殊格',
    description: '甲乙日主，木气成局，专旺于木。',
    classicalReference: '曲直者，甲乙日主，木气成局。有水生木更佳，怕金克木。',
    modernInterpretation: '曲直格代表生机勃勃、向上生长，如春木逢春。',
    characteristics: ['生机勃勃', '向上', '正直'],
    career: ['教育', '林业', '出版', '文化'],
    wealth: ['生长之财', '文化教育'],
    marriage: ['正直专一'],
    health: ['肝胆', '筋骨'],
    advantages: ['生命力旺盛', '正直向上', '持续成长'],
    risks: ['金克木破格', '过于直率', '不懂变通'],
    adjustments: ['水生木为源', '避免金克', '适度灵活'],
    keywords: ['曲直', '木旺', '生机', '正直', '甲乙'],
  },
  {
    name: '从儿格', patternClass: '特殊格',
    description: '日主弱而食伤极旺，从食伤之气势。',
    classicalReference: '从儿者，日主弱而食伤极旺。从食伤之势，以才华立身。',
    modernInterpretation: '从儿格代表以才华和创造力安身立命。',
    characteristics: ['才华横溢', '创造力强', '靠才艺立足'],
    career: ['艺术', '设计', '创作', '表演'],
    wealth: ['靠才华赚钱', '创意产业'],
    marriage: ['感情丰富'],
    health: ['食伤对应脏腑'],
    advantages: ['才华出众', '创造力极强', '靠才艺致富'],
    risks: ['印星破格', '才华无处施展', '过于感性'],
    adjustments: ['顺食伤之势', '生财泄秀', '避免印星克制'],
    keywords: ['从儿', '食伤', '才华', '创造', '才艺'],
  },
  {
    name: '从财格', patternClass: '特殊格',
    description: '日主弱而财星极旺，从财星之气势。',
    classicalReference: '从财者，日主弱而财星极旺无比劫争夺。从财之势，以商业立身。',
    modernInterpretation: '从财格代表善于经商、跟随财势而为。',
    characteristics: ['商业头脑', '善于理财', '跟随财势'],
    career: ['商业', '金融', '投资', '贸易'],
    wealth: ['财运极佳', '善于经营'],
    marriage: ['异性缘佳'],
    health: ['脾胃'],
    advantages: ['商业头脑', '财运极佳', '善于把握机会'],
    risks: ['比劫破格', '财来财去', '合伙纠纷'],
    adjustments: ['从财之势', '避免比劫出现', '靠财运发展'],
    keywords: ['从财', '商业', '财运', '经营', '极旺财'],
  },
  {
    name: '从杀格', patternClass: '特殊格',
    description: '日主弱而官杀极旺无制化，从官杀之气势。',
    classicalReference: '从杀者，日主弱而官杀极旺。从官杀之势，以权谋立身。',
    modernInterpretation: '从杀格代表在体制或权力体系中如鱼得水。',
    characteristics: ['权力敏感', '善于在体系中生存', '服从权威'],
    career: ['军警', '政府', '大型组织', '权力体系'],
    wealth: ['靠权力得财', '体制内发展'],
    marriage: ['对象可能有权威背景'],
    health: ['肾脏', '泌尿'],
    advantages: ['善于在体系中生存', '权力嗅觉', '服从则安'],
    risks: ['制化破格', '权力过大反噬', '缺乏自主'],
    adjustments: ['从官杀之势', '避免食伤逆势', '在体系中发展'],
    keywords: ['从杀', '官杀', '权力', '体制', '极旺杀'],
  },
]

/** 格局知识库映射 */
export const PATTERN_KB_MAP: Record<string, PatternKnowledge> = Object.fromEntries(
  PATTERN_KB.map(kb => [kb.name, kb]),
) as Record<string, PatternKnowledge>

/** 获取格局知识 */
export function getPatternKnowledge(name: PatternType): PatternKnowledge | undefined {
  return PATTERN_KB_MAP[name]
}

/** 获取所有格局名称 */
export function getAllPatternNames(): PatternType[] {
  return PATTERN_KB.map(kb => kb.name)
}
