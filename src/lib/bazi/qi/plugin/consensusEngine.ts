/**
 * P4.1 ConsensusEngine  多流派推演系统 / 共识推演引擎
 *
 * 古籍依据：
 *   《子平真诠》："格局之法，以月令为先。"  子平体系核心，以月令定格为根本
 *   《滴天髓》："欲识三元万法宗，先观帝载与神功。"  滴天体系核心，五行通变为纲领
 *   《穷通宝鉴》："察其旺衰，审其用神，辨其格局。"  穷通体系核心，调候用神为关键
 *   《三命通会》："命以八字为先，运以行年为要。"  三命体系核心，大运流年为要点
 *   《渊海子平》："凡看命，以日干为主。"  渊海体系核心，日干为本命之主
 *
 * 设计原则：
 *   - 纯 Plugin，不修改 Kernel
 *   - 五大流派独立推演，各自给出各维度结论
 *   - 共识算法综合各流派观点，识别一致 / 部分一致 / 分歧
 *   - 所有用 pick() / pickN() 随机选择器避免模板化输出
 *   - 古籍引用贯穿全部分析过程
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 随机选取数组中一个元素 */
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 随机选取数组中 N 个不重复元素 */
function pickN<T>(arr: readonly T[], n: number): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, Math.min(n, shuffled.length))
}

/** 安全获取 chartData 中的字符串字段 */
function getStr(data: Record<string, unknown>, key: string): string {
  return (data[key] as string) ?? ''
}

/** 安全获取 chartData 中的数字字段 */
function getNum(data: Record<string, unknown>, key: string): number {
  return (data[key] as number) ?? 0
}

/** 将分数映射到 0-100 的置信度 */
function toConfidence(score: number, base: number = 60): number {
  return Math.min(100, Math.max(10, base + score))
}

/** 五行中文名 */
const ELEMENT_NAMES: Record<string, string> = {
  wood: '木', fire: '火', earth: '土', metal: '金', water: '水',
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
}

/** 将天干 / 五行代号转为中文名 */
function elemName(code: string): string {
  return ELEMENT_NAMES[code] ?? code
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 五大流派标识 */
export type SchoolId = 'ziping' | 'ditiansui' | 'qiongtong' | 'sanming' | 'yuanhai'

/** 流派定义 */
export interface SchoolDef {
  id: SchoolId
  name: string
  source: string
  classicalSources: string[]
  description: string
  priority: number       // 优先级权重
  strengths: string[]    // 该流派擅长领域
  methodology: string    // 方法论概述
}

/** 流派对单个维度的结论 */
export interface SchoolDimensionConclusion {
  dimension: string       // 旺衰 / 格局 / 用神 / 调候 / 婚姻 / 事业 / 财富 / 健康
  conclusion: string      // 结论文本
  confidence: number      // 0-100
  evidence: string[]      // 依据（古籍引用）
}

/** 流派推演结果 */
export interface SchoolAnalysis {
  schoolId: SchoolId
  schoolName: string
  /** 该流派对各维度的分析 */
  conclusions: SchoolDimensionConclusion[]
  /** 该流派的综合判断 */
  summary: string
  /** 关键发现 */
  keyFindings: string[]
  /** 该流派古籍引用 */
  classicalRefs: string[]
}

/** 共识维度中各流派观点 */
export interface ConsensusSchoolView {
  schoolName: string
  view: string
  confidence: number
}

/** 共识结论（单维度） */
export interface ConsensusDimension {
  dimension: string
  consensusConclusion: string
  /** 各流派对这一维度的观点 */
  schoolViews: ConsensusSchoolView[]
  /** 共识强度 */
  agreement: 'agree' | 'partial' | 'disagree'
  /** 最终综合结论 */
  finalView: string
  confidence: number
}

/** 共识推演结果 */
export interface ConsensusResult {
  /** 5 个流派各自的独立分析 */
  schoolAnalyses: SchoolAnalysis[]
  /** 共识结论（各维度综合） */
  consensus: ConsensusDimension[]
  /** 综合命盘评估 */
  overallSummary: string
  /** 所有古籍引用 */
  allClassicalRefs: string[]
  /** 古籍引用 */
  classicalRef: string
}

/** 引擎最终输出 */
export interface ConsensusEngineResult {
  generatedAt: string
  schoolAnalyses: SchoolAnalysis[]
  consensus: ConsensusDimension[]
  overallSummary: string
  classicalRef: string
}

// ═══════════════════════════════════════════════════════════
// 五大流派定义
// ═══════════════════════════════════════════════════════════

const SCHOOLS: SchoolDef[] = [
  {
    id: 'ziping',
    name: '子平法',
    source: '《子平真诠》',
    classicalSources: ['子平真诠'],
    priority: 5,
    strengths: ['格局', '用神', '十神'],
    methodology: '以月令定格，扶抑用神为核心推演方法',
    description: '沈孝瞻所创，以月令十神定格，为八字格局正格体系之圭臬',
  },
  {
    id: 'ditiansui',
    name: '滴天髓体系',
    source: '《滴天髓》',
    classicalSources: ['滴天髓'],
    priority: 5,
    strengths: ['五行', '旺衰', '调候'],
    methodology: '以五行为本，通变神机为用',
    description: '任铁樵注解，以五行为本源，论述天地人三元之通变',
  },
  {
    id: 'qiongtong',
    name: '穷通宝鉴体系',
    source: '《穷通宝鉴》',
    classicalSources: ['穷通宝鉴'],
    priority: 4,
    strengths: ['调候', '用神', '季节'],
    methodology: '以月令气候为核心，注重调候用神',
    description: '以月令寒暖燥湿为核心，详细论述各日主在不同月令的调候之法',
  },
  {
    id: 'sanming',
    name: '三命通会体系',
    source: '《三命通会》',
    classicalSources: ['三命通会'],
    priority: 4,
    strengths: ['神煞', '大运', '流年'],
    methodology: '汇通三命，参详神煞大运',
    description: '万民英所编，汇通三命（子平、五星、禄命），参详神煞与大运',
  },
  {
    id: 'yuanhai',
    name: '渊海子平体系',
    source: '《渊海子平》',
    classicalSources: ['渊海子平'],
    priority: 3,
    strengths: ['命理格局', '吉凶判断'],
    methodology: '日干为主，论命以财官印食为纲领',
    description: '以日干为主，论命以财官印食为纲领，注重实际吉凶判断',
  },
]

// ═══════════════════════════════════════════════════════════
// 分析维度
// ═══════════════════════════════════════════════════════════

const DIMENSIONS = [
  '旺衰', '格局', '用神', '调候',
  '婚姻', '事业', '财富', '健康',
] as const

// ═══════════════════════════════════════════════════════════
// 古典引用库
// ═══════════════════════════════════════════════════════════

/** 按流派索引的古籍引用 */
const CLASSICAL_QUOTES: Record<SchoolId, string[]> = {
  ziping: [
    '《子平真诠》："格局之法，以月令为先。"',
    '《子平真诠》："八字用神，专求月令。"',
    '《子平真诠》："用神者，八字中所用之神也。"',
    '《子平真诠》："财官印食，八字之四善神也。"',
    '《子平真诠》："官为禄，禄为养命之源。"',
    '《子平真诠》："财旺身强，方为富格。"',
    '《子平真诠》："印绶相生，学术相辅。"',
    '《子平真诠》："食神生财，才华自然流露。"',
  ],
  ditiansui: [
    '《滴天髓》："欲识三元万法宗，先观帝载与神功。"',
    '《滴天髓》："五行和合为贵，偏枯为贱。"',
    '《滴天髓》："旺衰有度，太过不及皆非佳境。"',
    '《滴天髓》："五阳皆阳丙为最，五阴皆阴癸为极。"',
    '《滴天髓》："辛金软弱，温润而清。"',
    '《滴天髓》："甲木参天，脱胎要火。"',
    '《滴天髓》："丁火柔中，内性昭融。"',
    '《滴天髓》："己土卑湿，中正蓄藏。"',
  ],
  qiongtong: [
    '《穷通宝鉴》："察其旺衰，审其用神，辨其格局。"',
    '《穷通宝鉴》："调候为急，寒暖燥湿，各有所宜。"',
    '《穷通宝鉴》："春木逢火，向阳而生。"',
    '《穷通宝鉴》："冬水寒冷，必须有火暖局。"',
    '《穷通宝鉴》："三夏之土，燥渴需水润泽。"',
    '《穷通宝鉴》："秋金锐利，水淘则晶莹。"',
    '《穷通宝鉴》："夏火炎炎，调候为先务。"',
    '《穷通宝鉴》："凡用神之定，先观月令气候。"',
  ],
  sanming: [
    '《三命通会》："命以八字为先，运以行年为要。"',
    '《三命通会》："大运者，人生之枢纽也。十年一变。"',
    '《三命通会》："神煞之论，不可全信，不可不信。"',
    '《三命通会》："天乙贵人在命，多主贵显。"',
    '《三命通会》："驿马逢冲，迁移变动之象。"',
    '《三命通会》："桃花带煞，婚恋多有波折。"',
    '《三命通会》："文昌入命，利考试升学。"',
    '《三命通会》："华盖临命，性好玄学。"',
  ],
  yuanhai: [
    '《渊海子平》："凡看命，以日干为主。"',
    '《渊海子平》："日干旺相，则能担财官。"',
    '《渊海子平》："财官印食，为人伦之善神。"',
    '《渊海子平》："伤官见官，为祸百端。"',
    '《渊海子平》："正官佩印，贵人提携。"',
    '《渊海子平》："财星破印，贪财坏印。"',
    '《渊海子平》："身旺财旺，天下富翁。"',
    '《渊海子平》："官星太旺，反为克身之患。"',
  ],
}

// ═══════════════════════════════════════════════════════════
// 流派分析策略  各流派对各维度的推演逻辑
// ═══════════════════════════════════════════════════════════

// ─── 子平法推演策略 ───

function analyzeZiping(
  chartData: Record<string, unknown>,
  refs: string[],
): SchoolDimensionConclusion[] {
  const dayElem = elemName(getStr(chartData, 'dayElement'))
  const monthZhi = getStr(chartData, 'monthZhi')
  const strength = getNum(chartData, 'strengthScore')
  const useGod = getStr(chartData, 'useGod')
  const pattern = getStr(chartData, 'pattern')
  const shiShen = getStr(chartData, 'shiShen') || ''

  return [
    // 旺衰
    {
      dimension: '旺衰',
      conclusion: pick([
        '渊海子平以日干为主。日主' + dayElem + '生于' + monthZhi + '月，' +
          (strength >= 60
            ? pick(['日干旺相，堪任财官，为吉命之征。', '身旺有气，足以担当财官印绶。', '日主得令，根基深厚，一生有靠。'])
            : strength >= 40
              ? pick(['日干不旺不弱，财官堪任，命运平顺。', '身旺身弱尚可，财官之论视配合而定。', '日主气势中平，命运不偏不倚。'])
              : pick(['日干身弱，难以担当财官，须有大运帮扶。', '身衰力弱，财官虽好亦难享受。', '日主力薄，求财求官多有艰辛。'])) +
          pick(['日干之旺衰为论命之本。', '身强身弱直接决定命运的走向。']),
        '日干' + dayElem + '为本命之主。' +
          pick([
            '身旺则运通，身弱则运蹇。',
            '日干之旺衰是一切推断的出发点。',
            '身强能担财官，身弱则反受其累。',
          ]),
      ]),
      confidence: toConfidence(strength, 65),
  evidence: pickN(refs, 2),
    },
    // 格局
    {
      dimension: '格局',
      conclusion: pattern
        ? pick([
            `月令${monthZhi}取格为「${pattern}」，此为子平正格之一种。` +
              pick([`格局清纯则福厚，混杂则福薄。`, `成格者贵，破格者贱。`, `格局高下关乎一生造化。`]),
            `以月令定格，${monthZhi}月透出十神为「${pattern}」格。` +
              pick([`须察格局之清纯与混杂，以定贵贱。`, `格局既成，再用神配合即可论命。`, `正格论命，先看格局得失。`]),
          ])
        : pick([
            `月令${monthZhi}未能成典型格局，须以变格或外格论之。`,
            `月令取格不明，当细察四柱隐透之十神以定格局归属。`,
          ]),
      confidence: pattern ? toConfidence(strength + 10, 60) : toConfidence(strength - 10, 40),
      evidence: pickN(refs, 2),
    },
    // 用神
    {
      dimension: '用神',
      conclusion: useGod
        ? pick([
            `以月令为核心，取${elemName(useGod)}为用神。` +
              pick([`用神有力则命吉，用神无力则命蹇。`, `用神乃命局之枢纽，不可不慎。`, `用神得力，事半功倍。`]),
            `扶抑之法，取${elemName(useGod)}为用神以调达全局。` +
              pick([`用神是为命局治病之药。`, `取用之道，在于扶抑得宜。`, `用神既定，忌神自明。`]),
          ])
        : pick([
            `用神选取尚需斟酌全局，综合十神生克方可论定。`,
            `月令之气与全局配合复杂，用神当反复推敲。`,
          ]),
      confidence: useGod ? toConfidence(strength + 15, 70) : toConfidence(strength, 35),
      evidence: pickN(refs, 2),
    },
    // 调候
    {
      dimension: '调候',
      conclusion: pick([
        `子平论命以格局用神为先，调候为辅。然${monthZhi}月` +
          pick([`气候适中，不甚偏寒偏燥。`, `寒暖适中，调候不急。`, `气候平匀，调候非首要考量。`]),
        `格局既定，再察调候。${monthZhi}月之气候` +
          pick([`与格局用神配合较为平和。`, `对格局影响有限。`, `在格局论中居于次要地位。`]),
      ]),
      confidence: toConfidence(strength, 50),
      evidence: pickN(refs, 1),
    },
    // 婚姻
    {
      dimension: '婚姻',
      conclusion: pick([
        `子平法论婚姻，首观日支（夫妻宫）与财官之配合。` +
          (shiShen.includes('财') || shiShen.includes('官')
            ? pick([`命局财官有情，婚姻缘厚。`, `财官配合得当，配偶有助。`, `财官不杂，婚姻较为顺遂。`])
            : pick([`财官之力欠佳，婚姻宜审慎经营。`, `夫妻宫需察刑冲合害以论吉凶。`, `婚姻之象尚需参看大运流年。`])),
        `以子平十神观婚姻：` +
          pick([`男命以财星论妻，女命以官星论夫。`, `夫妻宫坐落与十神配合断婚姻吉凶。`, `财官印绶之配置反映婚姻基本格局。`]),
      ]),
      confidence: toConfidence(strength, 55),
      evidence: pickN(refs, 1),
    },
    // 事业
    {
      dimension: '事业',
      conclusion: pattern
        ? pick([
            `格局「${pattern}」论事业，` +
              pick([`官印相生利于仕途，食伤生财利于创业。`, `格局为事业之基本蓝图，配合大运方知成就。`, `事业兴衰与格局高低密切相关。`]),
            `以格局取事业方向，${pattern}格之人` +
              pick([`宜从事与格局用神相关之行业。`, `事业成就取决于格局清纯与否。`, `贵人运与事业格局相辅相成。`]),
          ])
        : pick([
            `事业方向需结合用神五行与十神配置综合推断。`,
            `无明确格局时，以日主五行喜忌推论事业宜忌。`,
          ]),
      confidence: pattern ? toConfidence(strength + 5, 60) : toConfidence(strength, 45),
      evidence: pickN(refs, 1),
    },
    // 财富
    {
      dimension: '财富',
      conclusion: pick([
        `子平论财，首辨财星之旺衰与日主之强弱。` +
          (strength >= 60
            ? pick([`身旺能任财，财运亨通。`, `日主有力，可担大财。`, `身强财旺，富格之征。`])
            : pick([`身弱财多反为累，不宜贪求横财。`, `财星虽旺，身弱则担不起。`, `财多身弱，求财需量力而行。`])),
        `财星之位置与十神配合论财富格局。` +
          pick([`正财稳健，偏财灵活。`, `财有源头则富，财无根气则虚。`, `身财两停方为上格。`]),
      ]),
      confidence: toConfidence(strength, 55),
      evidence: pickN(refs, 1),
    },
    // 健康
    {
      dimension: '健康',
      conclusion: pick([
        `子平法论健康，以五行偏枯与冲克为要。` +
          pick([`五行中和者少病，偏枯者多灾。`, `冲克太重则多意外损伤。`, `日主强弱直接关乎身体根基。`]),
        `健康之论重在五行调和。` +
          pick([`用神受克则健康有损。`, `忌神当令须防疾厄。`, `日主根基稳固则体质尚可。`]),
      ]),
      confidence: toConfidence(strength, 45),
      evidence: pickN(refs, 1),
    },
  ]
}

// ─── 滴天髓推演策略 ───

function analyzeDiTianSui(
  chartData: Record<string, unknown>,
  refs: string[],
): SchoolDimensionConclusion[] {
  const dayElem = elemName(getStr(chartData, 'dayElement'))
  const monthZhi = getStr(chartData, 'monthZhi')
  const strength = getNum(chartData, 'strengthScore')
  const useGod = getStr(chartData, 'useGod')
  const pattern = getStr(chartData, 'pattern')
  const climate = getStr(chartData, 'climate') || ''

  return [
    // 旺衰
    {
      dimension: '旺衰',
      conclusion: pick([
        `三元万法归宗于五行。日主${dayElem}生于${monthZhi}月，` +
          (strength >= 65
            ? pick([`五行气势偏旺，须知太过亦为偏枯。`, `气聚而太过，须有泄耗方成通变。`, `旺极宜泄不宜克，顺势而为方合天道。`])
            : strength >= 40
              ? pick([`五行不偏不倚，和合为贵。`, `旺衰适中，不偏不倚，此为中和之美。`, `五行平和，阴阳相济。`])
              : pick([`五行气衰，须有生扶方可通达。`, `日主气弱，赖印比以资扶助。`, `衰而不死，得生扶则可奋起。`])) +
          pick([`《滴天髓》以五行为万法之宗，旺衰之辨不可不明。`, `五行通变全在旺衰之间。`]),
        `滴天髓之法，先观帝载与神功。日主${dayElem}之旺衰，` +
          pick([`关乎一生之根基。`, `决定五行的基本态势。`, `为后续推演的出发点。`]) +
          (strength >= 60 ? '今得令有气，根基尚可。' : strength >= 40 ? '今气势平和，不偏不倚。' : '今失令力薄，亟需帮扶。'),
      ]),
      confidence: toConfidence(strength + 5, 70),
      evidence: pickN(refs, 2),
    },
    // 格局
    {
      dimension: '格局',
      conclusion: pattern
        ? pick([
            `滴天髓不拘一格，${pattern}格局` +
              pick([`须合五行之通变以观其成败。`, `在五行的框架下有其独特意义。`, `格局高低在于五行的配合是否得当。`]),
            `五行视角下，格局「${pattern}」之成否，` +
              pick([`取决于五行的生克制化。`, `在于气势的流通与阻滞。`, `须看整个命局的五行是否和谐。`]),
          ])
        : pick([
            `滴天髓以五行为本，格局之辨不如五行旺衰之论精要。`,
            `无定型格局者，当以五行气势之流通论命。`,
          ]),
      confidence: pattern ? toConfidence(strength, 55) : toConfidence(strength, 40),
      evidence: pickN(refs, 2),
    },
    // 用神
    {
      dimension: '用神',
      conclusion: useGod
        ? pick([
            `滴天髓取用，以五行为归。用神${elemName(useGod)}，` +
              pick([`以通变为要，不可执一而论。`, `使偏枯之五行归于中和。`, `合乎天道则吉，逆之则凶。`]),
            `五行通变之妙在于用神之取舍。取${elemName(useGod)}为用，` +
              pick([`意在调和全局五行之势。`, `使太过者泄之，不及者补之。`, `达致阴平阳秘之境界。`]),
          ])
        : pick([
            `用神之定，须通观五行全貌，非一柱可决。`,
            `五行生克复杂，用神尚待深究。`,
          ]),
      confidence: useGod ? toConfidence(strength + 10, 65) : toConfidence(strength, 35),
      evidence: pickN(refs, 2),
    },
    // 调候
    {
      dimension: '调候',
      conclusion: pick([
        `滴天髓论调候：${monthZhi}月之气候` +
          (climate === 'cold'
            ? pick([`偏寒，须有火以暖局，寒极则生机不旺。`, `寒气偏重，宜火暖水补，以达中和。`, `气候寒冷，五行之气凝滞不流。`])
            : climate === 'hot'
              ? pick([`偏燥，须有水以润局，燥极则万物焦枯。`, `炎热之气偏重，宜水调候。`, `气候燥热，五行之火偏旺需制。`])
              : pick([`较为平和，寒暖适中。`, `不偏寒亦不偏燥，调候压力不大。`, `气候得宜，五行之气自然流通。`])) +
          pick([`调候为五行调和之重要一环。`, `寒暖燥湿各有所宜，不可不察。`]),
        `五行的寒暖燥湿直接影响命局之好坏。${monthZhi}月` +
          pick([`气候条件与日主${dayElem}之关系需细加审度。`, `寒暖适中则五行流畅，偏枯则有碍。`]),
      ]),
      confidence: toConfidence(strength, 60),
      evidence: pickN(refs, 2),
    },
    // 婚姻
    {
      dimension: '婚姻',
      conclusion: pick([
        `滴天髓论婚姻以五行为主。日主${dayElem}之` +
          pick([`婚姻宫位与五行配合断吉凶。`, `五行中财星或官星之旺衰论配偶。`, `婚姻之好坏在于五行是否和谐。`]),
        `婚姻之道亦不离五行和合。` +
          pick([`阴阳相配，五行互补为佳。`, `配偶之五行与日主喜用相合则顺。`, `五行冲克多者婚姻多波折。`]),
      ]),
      confidence: toConfidence(strength, 50),
      evidence: pickN(refs, 1),
    },
    // 事业
    {
      dimension: '事业',
      conclusion: pick([
        `事业之兴衰在于五行气势的流通与阻滞。` +
          pick([`五行流通者事业顺遂，阻滞者多生阻碍。`, `日主所喜之五行旺则事业有成。`, `事业方向应取用神五行所代表之行业。`]),
        `滴天髓以五行论事业：` +
          pick([`有气势则成，无气势则败。`, `五行偏旺之方向即事业所宜。`, `事业的起伏与五行的周期变化密切相关。`]),
      ]),
      confidence: toConfidence(strength, 55),
      evidence: pickN(refs, 1),
    },
    // 财富
    {
      dimension: '财富',
      conclusion: pick([
        `财富以五行生克论之。` +
          (strength >= 60
            ? pick([`日主有力能驾驭财星，求财有路。`, `五行身旺，财有源头不绝。`, `旺身担财，富足可期。`])
            : pick([`日主力弱，纵有财星亦难驾驭。`, `五行偏弱，求财需借外力。`, `财虽在命，身弱难以负荷。`])),
        `财富之大小取决于五行之气禀与用神之配合。` +
          pick([`用神有力生财则富。`, `忌神阻财则求财辛苦。`, `五行调和者财运相对平稳。`]),
      ]),
      confidence: toConfidence(strength, 50),
      evidence: pickN(refs, 1),
    },
    // 健康
    {
      dimension: '健康',
      conclusion: pick([
        `滴天髓论健康重在五行调和。日主${dayElem}` +
          pick([
            `五行不偏者体健，偏枯者多疾。`,
            `所缺之五行往往对应身体薄弱之处。`,
            `太过之五行亦为病灶所在。`,
          ]),
        `健康之根本在于五行的平衡。` +
          pick([`寒暖燥湿失度则疾病丛生。`, `冲克太过之处即为身体隐患。`, `五行流通无阻则身体健康。`]),
      ]),
      confidence: toConfidence(strength, 50),
      evidence: pickN(refs, 1),
    },
  ]
}

// ─── 穷通宝鉴推演策略 ───

function analyzeQiongTong(
  chartData: Record<string, unknown>,
  refs: string[],
): SchoolDimensionConclusion[] {
  const dayElem = elemName(getStr(chartData, 'dayElement'))
  const monthZhi = getStr(chartData, 'monthZhi')
  const strength = getNum(chartData, 'strengthScore')
  const useGod = getStr(chartData, 'useGod')
  const pattern = getStr(chartData, 'pattern')
  const climate = getStr(chartData, 'climate') || ''

  return [
    // 旺衰
    {
      dimension: '旺衰',
      conclusion: pick([
        `穷通宝鉴以月令气候论旺衰。日主${dayElem}生于${monthZhi}月，` +
          pick([
            `须察气候对日主之生扶或克泄。`,
            `月令之气决定日主之基本状态。`,
            `季节之气对五行旺衰影响至大。`,
          ]),
        `以调候之视角观旺衰：${monthZhi}月` +
          (strength >= 60
            ? pick([`日主得时令之气，根基充实。`, `月令帮扶日主，气聚身健。`, `季节助势，日主旺相。`])
            : strength >= 40
              ? pick([`季节与日主关系平和。`, `气候对日主影响适中。`, `月令之气不偏不倚。`])
              : pick([`季节不利于日主，需调候以救。`, `月令克泄日主，气候偏枯。`, `时令不助，日主力弱。`])) +
          pick([`此乃穷通宝鉴观命之第一步。`, `旺衰之辨为调候之基础。`]),
      ]),
      confidence: toConfidence(strength + 5, 65),
      evidence: pickN(refs, 2),
    },
    // 格局
    {
      dimension: '格局',
      conclusion: pattern
        ? pick([
            `格局「${pattern}」须结合${monthZhi}月之气候来审视。` +
              pick([`格局之成败与调候息息相关。`, `气候配合格局则吉，不合则减分。`, `穷通宝鉴论格局，气候为先。`]),
            `穷通以月令取格，${pattern}格在${monthZhi}月` +
              pick([`须察气候是否助成格局。`, `格局之高低受季节影响显著。`, `调候得宜则格局有成。`]),
          ])
        : pick([
            `格局虽未明确定型，但${monthZhi}月之气候特征` +
              pick([`已为命局奠定基本基调。`, `是判断命局优劣的重要依据。`, `不可忽视其影响力。`]),
          ]),
      confidence: pattern ? toConfidence(strength, 55) : toConfidence(strength, 40),
      evidence: pickN(refs, 2),
    },
    // 用神
    {
      dimension: '用神',
      conclusion: useGod
        ? pick([
            `穷通宝鉴最重调候用神。取${elemName(useGod)}为用，` +
              pick([`以调达${monthZhi}月之寒暖燥湿为首要任务。`, `调和气候是穷通体系的用神核心。`, `调候用神乃穷通之精髓。`]),
            `用神${elemName(useGod)}乃基于${monthZhi}月气候之实际需要。` +
              pick([`季节不同，用神随之变化。`, `气候之需即用神之由。`, `穷通宝鉴之用神取法，独重调候。`]),
          ])
        : pick([
            `调候用神尚待根据${monthZhi}月之气候进一步斟酌。`,
            `穷通以气候定用神，月令特征是关键。`,
          ]),
      confidence: useGod ? toConfidence(strength + 15, 75) : toConfidence(strength, 35),
      evidence: pickN(refs, 2),
    },
    // 调候
    {
      dimension: '调候',
      conclusion: pick([
        `穷通宝鉴论调候：${monthZhi}月` +
          (climate === 'cold'
            ? pick([`气候寒冷，须以火暖局为调候之急务。`, `寒气凝滞，火为调候第一要义。`, `寒冷之月，调候不急则有冻伤之患。`])
            : climate === 'hot'
              ? pick([`气候燥热，须以水润局为调候之急务。`, `炎热之气弥漫，水为调候第一要义。`, `炎热之月，调候不急则有焦枯之忧。`])
              : pick([`气候适中，寒暖燥湿不偏。`, `调候压力不大，气候自然平和。`, `月令气候适宜，无需特别调候。`])) +
          pick([`调候为穷通宝鉴之核心要旨。`, `调候得宜，命局方能流通。`]),
        `穷通宝鉴以调候为急。${dayElem}生于${monthZhi}月，` +
          pick([`气候调候之需为命局分析的首要考量。`, `寒暖燥湿各有所宜，此月之调候尤须重视。`, `调候到位，命局自可通达。`]),
      ]),
      confidence: toConfidence(strength, 70),
      evidence: pickN(refs, 2),
    },
    // 婚姻
    {
      dimension: '婚姻',
      conclusion: pick([
        `穷通宝鉴论婚姻重在季节与五行之配合。` +
          pick([`调候之需亦影响婚姻宫的吉凶。`, `月令气候与日主的配合论配偶缘分。`, `气候调和则婚姻少波折。`]),
        `以调候论婚姻：` +
          pick([`寒暖适宜之年月利婚嫁。`, `五行调和之命局婚姻相对平顺。`, `季节之气对感情运势有潜移默化之影响。`]),
      ]),
      confidence: toConfidence(strength, 45),
      evidence: pickN(refs, 1),
    },
    // 事业
    {
      dimension: '事业',
      conclusion: pick([
        `事业之兴衰与月令气候密切相关。` +
          pick([`调候得当则事业亨通，反之则多阻碍。`, `${monthZhi}月之季节特征暗示事业方向。`, `事业运势受季节五行之气场影响。`]),
        `穷通以气候论事业运势：` +
          pick([`顺势而为即合调候之道。`, `事业宜选择与用神五行相合之领域。`, `季节对事业运势的推波助澜不可小觑。`]),
      ]),
      confidence: toConfidence(strength, 50),
      evidence: pickN(refs, 1),
    },
    // 财富
    {
      dimension: '财富',
      conclusion: pick([
        `穷通论财运：${monthZhi}月之气候` +
          pick([`对财星之力有直接影响。`, `调候得宜则财运顺畅。`, `五行在季节中的强弱决定财富格局。`]),
        `财运之高低取决于调候用神是否到位。` +
          pick([`用神有力则财源广进。`, `调候不力则财运受阻。`, `季节之五行与财星之配合是关键。`]),
      ]),
      confidence: toConfidence(strength, 50),
      evidence: pickN(refs, 1),
    },
    // 健康
    {
      dimension: '健康',
      conclusion: pick([
        `穷通宝鉴论健康首重调候。${monthZhi}月` +
          pick([
            `气候偏寒则须防寒性疾病。`,
            `气候偏燥则须防燥热之症。`,
            `气候适宜者体质相对平稳。`,
          ]),
        `健康与调候密不可分。` +
          pick([`调候不当则五行失衡，疾病随之。`, `气候之偏直接影响身体之偏。`, `寒暖燥湿适度则身心安康。`]),
      ]),
      confidence: toConfidence(strength, 55),
      evidence: pickN(refs, 1),
    },
  ]
}

// ─── 三命通会推演策略 ───

function analyzeSanMing(
  chartData: Record<string, unknown>,
  refs: string[],
): SchoolDimensionConclusion[] {
  const dayElem = elemName(getStr(chartData, 'dayElement'))
  const monthZhi = getStr(chartData, 'monthZhi')
  const strength = getNum(chartData, 'strengthScore')
  const useGod = getStr(chartData, 'useGod')
  const pattern = getStr(chartData, 'pattern')
  const shiShen = getStr(chartData, 'shiShen') || ''

  return [
    // 旺衰
    {
      dimension: '旺衰',
      conclusion: pick([
        `三命通会观命：日主${dayElem}生于${monthZhi}月，` +
          (strength >= 60
            ? pick([`身旺有气，大运行至生扶之方则更佳。`, `日主得令，根基深厚，行运无忧。`, `身旺利于担财官，大运配合可期。`])
            : strength >= 40
              ? pick([`身旺身弱处于交替之间，大运所至方见分晓。`, `日主气势中平，须看大运引动。`, `旺衰在两可之间，大运走势决定最终强弱。`])
              : pick([`身弱宜行印比之地，大运帮扶方显其用。`, `日主失令，待大运行至生扶之地方可发达。`, `身衰力弱，大运为救。`])) +
          pick([`大运十年一变，旺衰随之流转。`, `运以行年为要，不可忽视大运对旺衰的调节。`]),
        `汇通三命观旺衰：日主${dayElem}，` +
          pick([`结合八字原局与岁运，方能准确判断旺衰。`, `原局为体，大运为用，旺衰在岁运间流转变化。`, `旺衰非一成不变，大运流年皆有影响。`]),
      ]),
      confidence: toConfidence(strength, 60),
      evidence: pickN(refs, 2),
    },
    // 格局
    {
      dimension: '格局',
      conclusion: pattern
        ? pick([
            `格局「${pattern}」在三命通会的框架下，` +
              pick([`须参详神煞与大运的配合。`, `格局之高低不仅看原局，更要看岁运。`, `结合大运方能定格局之真正成败。`]),
            `三命以格局为纲，${pattern}格之命` +
              pick([`吉凶须参岁运方能断定。`, `格局为静，岁运为动，动静相合方显吉凶。`, `格局之优劣在大运的映照下愈加分明。`]),
          ])
        : pick([
            `格局未明者，当以神煞与岁运之配合论命。`,
            `三命通会汇通三命，格局不定时尚可从神煞大运中寻找线索。`,
          ]),
      confidence: pattern ? toConfidence(strength, 55) : toConfidence(strength, 40),
      evidence: pickN(refs, 2),
    },
    // 用神
    {
      dimension: '用神',
      conclusion: useGod
        ? pick([
            `取${elemName(useGod)}为用神，` +
              pick([`在大运流年中须关注用神的旺衰变化。`, `行运用神到位之岁运为人生佳期。`, `用神行运配合得当则事半功倍。`]),
            `用神${elemName(useGod)}乃原局之根本，` +
              pick([`大运流年生扶用神则吉。`, `岁运克制用神则凶。`, `用神之吉凶随岁运而转化。`]),
          ])
        : pick([
            `用神尚需参详大运流年方能最终确定。`,
            `三命体系下，用神须与岁运动态配合考量。`,
          ]),
      confidence: useGod ? toConfidence(strength + 10, 60) : toConfidence(strength, 35),
      evidence: pickN(refs, 2),
    },
    // 调候
    {
      dimension: '调候',
      conclusion: pick([
        `三命通会对调候之论较为宏观。${monthZhi}月` +
          pick([`气候特征需结合大运流年综合审视。`, `调候在大运流年中动态变化。`, `季节气候是命局背景，大运流年才是调候的动态因素。`]),
        `调候之效随大运而变。` +
          pick([`某一大运调候得宜，下一大运可能反之。`, `岁运对调候的影响不可忽视。`, `大运流年的五行介入会改变原局的调候状态。`]),
      ]),
      confidence: toConfidence(strength, 45),
      evidence: pickN(refs, 1),
    },
    // 婚姻
    {
      dimension: '婚姻',
      conclusion: pick([
        `三命通会论婚姻兼参神煞与大运。` +
          pick([
            `桃花、红鸾等神煞对婚姻有重要参考意义。`,
            `大运行至桃花或红鸾之地多主婚姻之动。`,
            `天乙贵人入命，配偶多有助力。`,
          ]),
        `婚姻之期与大运流年密切相关。` +
          pick([`婚恋动象须在岁运中寻找。`, `大运流年的引动决定婚期。`, `婚姻宫位的刑冲合害在大运中显现。`]),
      ]),
      confidence: toConfidence(strength, 55),
      evidence: pickN(refs, 2),
    },
    // 事业
    {
      dimension: '事业',
      conclusion: pick([
        `三命通会论事业，大运为人生之枢纽。` +
          pick([`十年大运决定事业的基本走向。`, `大运与原局配合论事业成败。`, `事业高低不仅看格局，更要看大运走势。`]),
        `事业之兴衰与大运流年紧密相连。` +
          pick([`吉运行至用神之地，事业腾飞。`, `凶运克破用神，事业受挫。`, `岁运配合事业方可顺势而为。`]),
      ]),
      confidence: toConfidence(strength, 55),
      evidence: pickN(refs, 1),
    },
    // 财富
    {
      dimension: '财富',
      conclusion: pick([
        `三命论财运兼参原局与岁运。` +
          (strength >= 60
            ? pick([`身旺财旺，再得岁运生扶则大富。`, `原局有财，大运引财则财运亨通。`, `身财两旺者遇财运之岁运则大发。`])
            : pick([`身弱财多，须待印比大运方能有财。`, `财运之大须看大运是否帮扶日主。`, `身弱遇财运反为压力，须行身旺运方可担财。`])),
        `财富的大小与大运流年的配合密不可分。` +
          pick([`财运之岁运到来时方能应验。`, `流年财星引动则财运有波动。`, `大运定财运的基本格局。`]),
      ]),
      confidence: toConfidence(strength, 55),
      evidence: pickN(refs, 1),
    },
    // 健康
    {
      dimension: '健康',
      conclusion: pick([
        `三命通会论健康重视神煞与岁运。` +
          pick([`羊刃逢冲之年须防意外损伤。`, `大运流年冲克日主则健康有忧。`, `五行失衡之岁运为疾病高发期。`]),
        `健康之运随大运而变。` +
          pick([`吉运中身体康健，凶运中多病多灾。`, `岁运的五行冲克直接影响健康。`, `大运天干的生克关系揭示健康走势。`]),
      ]),
      confidence: toConfidence(strength, 50),
      evidence: pickN(refs, 1),
    },
  ]
}

// ─── 渊海子平推演策略 ───

function analyzeYuanHai(
  chartData: Record<string, unknown>,
  refs: string[],
): SchoolDimensionConclusion[] {
  const dayElem = elemName(getStr(chartData, 'dayElement'))
  const monthZhi = getStr(chartData, 'monthZhi')
  const strength = getNum(chartData, 'strengthScore')
  const useGod = getStr(chartData, 'useGod')
  const pattern = getStr(chartData, 'pattern')
  const shiShen = getStr(chartData, 'shiShen') || ''

  return [
    // 旺衰
    {
      dimension: '旺衰',
      conclusion: pick([
        '渊海子平以日干为主。日主' + dayElem + '生于' + monthZhi + '月，' +
          (strength >= 60
            ? pick(['日干旺相，堪任财官，为吉命之征。', '身旺有气，足以担当财官印绶。', '日主得令，根基深厚，一生有靠。'])
            : strength >= 40
              ? pick(['日干不旺不弱，财官堪任，命运平顺。', '身旺身弱尚可，财官之论视配合而定。', '日主气势中平，命运不偏不倚。'])
              : pick(['日干身弱，难以担当财官，须有大运帮扶。', '身衰力弱，财官虽好亦难享受。', '日主力薄，求财求官多有艰辛。'])) +
          pick(['日干之旺衰为论命之本。', '身强身弱直接决定命运的走向。']),
        '日干' + dayElem + '为本命之主。' +
          pick([
            '身旺则运通，身弱则运蹇。',
            '日干之旺衰是一切推断的出发点。',
            '身强能担财官，身弱则反受其累。',
          ]),
      ]),
      confidence: toConfidence(strength, 65),
      evidence: pickN(refs, 2),
    },
    // 格局
    {
      dimension: '格局',
      conclusion: pattern
        ? pick([
            '渊海子平以格局论贵贱。格局「' + pattern + '」，' +
              pick(['成格局者贵，破格局者贱。', '格局高低直接影响社会地位与人生成就。', '格局清纯完整则福厚，混杂破损则福薄。']),
            '格局「' + pattern + '」论命，以财官印食为纲领。' +
              pick(['格局之中财官的配合最为关键。', '格局与日主之旺衰共同决定命运。', '格局的好坏是吉凶判断的核心依据。']),
          ])
        : pick([
            '格局虽不明显，渊海子平仍以财官印食论吉凶。',
            '格局之辨重在实用，无定型格局亦可论命。',
          ]),
      confidence: pattern ? toConfidence(strength, 55) : toConfidence(strength, 40),
      evidence: pickN(refs, 2),
    },
    // 用神
    {
      dimension: '用神',
      conclusion: useGod
        ? pick([
            '渊海子平取' + elemName(useGod) + '为用神。' +
              pick(['用神有力，命运亨通。', '用神是命局的救应之神。', '用神到位，人生顺遂。']),
            '以财官印食之配合取用。用神' + elemName(useGod) + '，' +
              pick(['关系到命局的吉凶大局。', '用神的旺衰强弱是命运的关键。', '用神得地则人生有成。']),
          ])
        : pick([
            '用神之定须综合财官印食之全局。',
            '渊海子平取用神重在实用，须反复推敲。',
          ]),
      confidence: useGod ? toConfidence(strength + 10, 60) : toConfidence(strength, 35),
      evidence: pickN(refs, 2),
    },
    // 调候
    {
      dimension: '调候',
      conclusion: pick([
        '渊海子平论调候较为务实。' + monthZhi + '月' +
          pick(['之气候特征是命局的背景条件。', '对日主' + dayElem + '有潜移默化的影响。', '虽非首要考量，但调候之效不可全然忽略。']),
        '调候在渊海体系中居于辅助地位。' +
          pick(['吉凶判断以格局财官为主。', '调候为锦上添花之论。', '寒暖燥湿之调，在格局财官之后方论。']),
      ]),
      confidence: toConfidence(strength, 40),
      evidence: pickN(refs, 1),
    },
    // 婚姻
    {
      dimension: '婚姻',
      conclusion: pick([
        '渊海子平论婚姻以日支夫妻宫与财官为主。' +
          (shiShen.includes('财') || shiShen.includes('官')
            ? pick(['财官有情于日主，婚姻缘厚。', '财官配合得当，配偶贤良。', '财星不杂、官星清纯者婚姻美满。'])
            : pick(['财官之力不足，婚姻宜主动经营。', '夫妻宫若逢刑冲，婚姻多有磨折。', '财官不显者婚姻缘薄。'])) +
          pick(['婚姻之吉凶重在财官之配合。', '以财官印食论婚姻之基本格局。']),
        '日支为夫妻宫，财官为配偶星。' +
          pick(['二者配合论婚姻之成败。', '夫妻宫位坐吉神则婚姻顺遂。', '日支被冲克者婚姻多变。']),
      ]),
      confidence: toConfidence(strength, 55),
      evidence: pickN(refs, 1),
    },
    // 事业
    {
      dimension: '事业',
      conclusion: pick([
        '渊海论事业以财官为核心。' +
          pick(['官星旺而有制者利仕途。', '财星旺而有根者利经商。', '财官双全者事业大成。']),
        '事业之吉凶取决于财官印食之配合。' +
          pick(['印旺官清者利学术和管理。', '食伤生财者利技术和创业。', '财官印绶配合得当则事业有成就。']),
      ]),
      confidence: toConfidence(strength, 55),
      evidence: pickN(refs, 1),
    },
    // 财富
    {
      dimension: '财富',
      conclusion: pick([
        '渊海子平论财运以财星为核心。' +
          (strength >= 60
            ? pick(['身旺财旺，天下富翁之命。', '日主有力，财星有根，求财顺遂。', '身财两停是富命的基本条件。'])
            : pick(['身弱财多，财多压身反为累。', '财星虽旺但日主无力，求财辛苦。', '财大身小，宜安守本分，不宜冒险。'])),
        '财富之大小在于财星之旺衰与日主之配合。' +
          pick(['正财主稳健之财，偏财主意外之财。', '财有库藏则积富，财无根气则浮财。', '身财相合则富足无忧。']),
      ]),
      confidence: toConfidence(strength, 55),
      evidence: pickN(refs, 1),
    },
    // 健康
    {
      dimension: '健康',
      conclusion: pick([
        '渊海子平论健康以日主之旺衰与冲克为主。' +
          pick(['日主身旺者体健少病。', '冲克多者多灾多难。', '五行中和者寿长。']),
        '健康之吉凶判断重在实质。' +
          pick(['日主根基不固者体质偏弱。', '刑冲破害之年须防疾病。', '财官印食之偏枯暗示健康隐患。']),
      ]),
      confidence: toConfidence(strength, 45),
      evidence: pickN(refs, 1),
    },
  ]
}

// ═══════════════════════════════════════════════════════════
// 流派分析调度器
// ═══════════════════════════════════════════════════════════

/** 流派分析函数映射 */
const SCHOOL_ANALYZERS: Record<SchoolId, (
  chartData: Record<string, unknown>,
  refs: string[],
) => SchoolDimensionConclusion[]> = {
  ziping: analyzeZiping,
  ditiansui: analyzeDiTianSui,
  qiongtong: analyzeQiongTong,
  sanming: analyzeSanMing,
  yuanhai: analyzeYuanHai,
}

/** 生成流派综合总结 */
function generateSchoolSummary(
  school: SchoolDef,
  conclusions: SchoolDimensionConclusion[],
): string {
  const highConf = conclusions.filter(c => c.confidence >= 60)
  const keyDims = highConf.map(c => c.dimension)
  const dimsStr = keyDims.length > 0
    ? pick([
        `在${keyDims.join('、')}等方面有较为明确的判断`,
        `对${keyDims.join('、')}等维度的分析可信度较高`,
        `${keyDims.join('、')}等方面的推演较为可靠`,
      ])
    : pick([
        '各维度分析尚需进一步推敲',
        '分析结论置信度中等，建议综合其他流派参考',
        '推演结论需谨慎参考',
      ])

  return pick([
    `${school.name}（${school.source}）运用${school.methodology}，${dimsStr}。${school.name}擅长${school.strengths.join('、')}等领域，本次推演以此为侧重。`,
    `以${school.methodology}为纲，${school.name}（${school.source}）的推演${dimsStr}。本流派在${school.strengths.join('、')}方面具有传统优势。`,
    `${school.source}云：${pick(CLASSICAL_QUOTES[school.id])}。本次推演以此为指导，${dimsStr}，尤其关注${school.strengths.slice(0, 2).join('与')}方面。`,
  ])
}

/** 提取关键发现 */
function extractKeyFindings(
  conclusions: SchoolDimensionConclusion[],
): string[] {
  return conclusions
    .filter(c => c.confidence >= 65)
    .map(c => {
      // 截取结论的前半段作为关键发现
      const text = c.conclusion.length > 40
        ? c.conclusion.substring(0, 40) + '……'
        : c.conclusion
      return `【${c.dimension}】${text}`
    })
}

// ═══════════════════════════════════════════════════════════
// 共识算法
// ═══════════════════════════════════════════════════════════

/**
 * 判断两个结论文本是否存在关键词层面的"一致"
 * 通过提取关键词并计算重叠度来评估
 */
function textAgreement(textA: string, textB: string): number {
  // 简单的关键词匹配：提取共同的汉字片段
  const keywordsA = extractKeywords(textA)
  const keywordsB = extractKeywords(textB)
  if (keywordsA.length === 0 || keywordsB.length === 0) return 0

  let overlap = 0
  for (const ka of keywordsA) {
    if (keywordsB.some(kb => kb === ka || kb.includes(ka) || ka.includes(kb))) {
      overlap++
    }
  }
  return overlap / Math.max(keywordsA.length, keywordsB.length)
}

/** 从文本中提取关键词（二字及以上连续汉字片段） */
function extractKeywords(text: string): string[] {
  // 提取关键词特征：身旺 / 身弱 / 格局 / 用神 / 调候 / 有利 / 不利 等
  const patterns = [
    /身旺/g, /身弱/g, /得令/g, /失令/g, /有气/g, /无力/g,
    /格局/g, /用神/g, /调候/g, /有利/g, /不利/g, /吉/g, /凶/g,
    /旺/g, /衰/g, /财旺/g, /官旺/g, /印旺/g,
    /顺畅/g, /亨通/g, /阻碍/g, /波折/g,
    /中和/g, /偏枯/g, /调和/g, /失衡/g,
    /寒/g, /暖/g, /燥/g, /湿/g,
  ]
  const results: string[] = []
  for (const p of patterns) {
    p.lastIndex = 0
    if (p.test(text)) {
      results.push(p.source.replace(/\/g$/, ''))
    }
  }
  return results
}

/**
 * 计算共识强度
 * - agree：所有流派一致（平均重叠度 > 0.5）
 * - partial：部分流派一致（平均重叠度 > 0.25）
 * - disagree：流派分歧（平均重叠度 <= 0.25）
 */
function computeAgreement(views: ConsensusSchoolView[]): 'agree' | 'partial' | 'disagree' {
  if (views.length < 2) return 'agree'

  let totalAgreement = 0
  let pairCount = 0
  for (let i = 0; i < views.length; i++) {
    for (let j = i + 1; j < views.length; j++) {
      totalAgreement += textAgreement(views[i].view, views[j].view)
      pairCount++
    }
  }
  const avgAgreement = pairCount > 0 ? totalAgreement / pairCount : 0

  if (avgAgreement > 0.5) return 'agree'
  if (avgAgreement > 0.25) return 'partial'
  return 'disagree'
}

/**
 * 生成共识维度的综合结论
 * 权重 = school.priority，冲突时取最高权重流派的结论
 */
function buildConsensusDimension(
  dimension: string,
  schoolAnalyses: SchoolAnalysis[],
  schoolDefs: SchoolDef[],
): ConsensusDimension {
  // 收集各流派对该维度的结论
  const schoolViews: ConsensusSchoolView[] = []
  let bestSchool: SchoolAnalysis | null = null
  let bestPriority = -1

  for (const analysis of schoolAnalyses) {
    const conclusion = analysis.conclusions.find(c => c.dimension === dimension)
    if (conclusion) {
      schoolViews.push({
        schoolName: analysis.schoolName,
        view: conclusion.conclusion,
        confidence: conclusion.confidence,
      })

      const def = schoolDefs.find(d => d.id === analysis.schoolId)
      const priority = def?.priority ?? 1
      if (priority > bestPriority) {
        bestPriority = priority
        bestSchool = analysis
      }
    }
  }

  // 计算共识强度
  const agreement = computeAgreement(schoolViews)

  // 生成共识结论文本
  const consensusConclusion = pick([
    generateConsensusText(dimension, agreement, schoolViews, bestSchool),
    generateConsensusTextAlt(dimension, agreement, schoolViews, bestSchool),
  ])

  // 最终综合结论：取高权重 + 高置信度的流派结论
  const finalView = bestSchool
    ? bestSchool.conclusions.find(c => c.dimension === dimension)?.conclusion ?? ''
    : schoolViews[0]?.view ?? ''

  // 综合置信度
  const confidence = schoolViews.length > 0
    ? Math.round(
        schoolViews.reduce((sum, v) => sum + v.confidence, 0) / schoolViews.length
      )
    : 30

  return {
    dimension,
    consensusConclusion,
    schoolViews,
    agreement,
    finalView,
    confidence,
  }
}

/** 生成共识文本（版本 A） */
function generateConsensusText(
  dimension: string,
  agreement: 'agree' | 'partial' | 'disagree',
  views: ConsensusSchoolView[],
  bestSchool: SchoolAnalysis | null,
): string {
  if (agreement === 'agree') {
    return pick([
      `各流派在「${dimension}」维度上观点较为一致：${views[0]?.view ?? '暂无明确结论'}。共识可信度较高。`,
      `关于「${dimension}」，五大流派的分析结论趋于一致。${views[0]?.view ?? '暂无明确结论'}。各派殊途同归，可信度较高。`,
    ])
  } else if (agreement === 'partial') {
    const agreeSchools = views.slice(0, 3).map(v => v.schoolName).join('、')
    return pick([
      `关于「${dimension}」，${agreeSchools}等流派有部分共识，但仍有不同见解。${bestSchool ? `${bestSchool.schoolName}的观点最为可信` : '需综合判断'}。`,
      `「${dimension}」维度存在部分一致：${agreeSchools}等流派方向基本一致，但细节有别。综合考量以${bestSchool?.schoolName ?? '主流'}为准。`,
    ])
  } else {
    const divergeNote = views.slice(0, 3).map(v => `${v.schoolName}持不同观点`).join('，')
    return pick([
      `关于「${dimension}」，各流派存在明显分歧：${divergeNote}。${bestSchool ? `综合权重取${bestSchool.schoolName}之论` : '须谨慎参考'}。`,
      `「${dimension}」维度各派观点分歧较大，${divergeNote}。建议以${bestSchool?.schoolName ?? '高权重流派'}为主要参考。`,
    ])
  }
}

/** 生成共识文本（版本 B，备选表达） */
function generateConsensusTextAlt(
  dimension: string,
  agreement: 'agree' | 'partial' | 'disagree',
  views: ConsensusSchoolView[],
  bestSchool: SchoolAnalysis | null,
): string {
  if (agreement === 'agree') {
    return pick([
      `「${dimension}」方面各派高度一致，${views[0]?.view ?? '暂无结论'}。此结论经多流派验证，可靠性强。`,
      `五大流派在「${dimension}」问题上达成共识：${views[0]?.view ?? '暂无明确结论'}。多源印证，结论可信。`,
    ])
  } else if (agreement === 'partial') {
    return pick([
      `「${dimension}」维度呈现部分共识态势。${views.slice(0, 2).map(v => v.schoolName).join('与')}方向趋同，但其余流派有异议。取${bestSchool?.schoolName ?? '主流'}之论。`,
      `各派对「${dimension}」有部分认同，尚未完全一致。核心判断以${bestSchool?.schoolName ?? '权威流派'}为基准。`,
    ])
  } else {
    return pick([
      `「${dimension}」是各流派分歧最大的维度之一。${views.slice(0, 2).map(v => v.schoolName).join('与')}观点相左，${bestSchool?.schoolName ?? '综合'}判断为最终参考。`,
      `关于「${dimension}」，流派间分歧显著。各执己见，综合权重后以${bestSchool?.schoolName ?? '优先流派'}之论为定。`,
    ])
  }
}

/** 生成综合命盘评估 */
function generateOverallSummary(result: {
  consensus: ConsensusDimension[]
  schoolAnalyses: SchoolAnalysis[]
}): string {
  const agreeCount = result.consensus.filter(c => c.agreement === 'agree').length
  const partialCount = result.consensus.filter(c => c.agreement === 'partial').length
  const disagreeCount = result.consensus.filter(c => c.agreement === 'disagree').length

  const highConfDims = result.consensus
    .filter(c => c.confidence >= 65)
    .map(c => c.dimension)
  const lowConfDims = result.consensus
    .filter(c => c.confidence < 50)
    .map(c => c.dimension)

  const parts: string[] = []

  parts.push(pick([
    `本次共识推演综合了五大流派（子平法、滴天髓体系、穷通宝鉴体系、三命通会体系、渊海子平体系）的独立分析。`,
    `经五大流派独立推演与共识算法综合，本次分析覆盖${DIMENSIONS.length}个命理核心维度。`,
    `本次推演采用多流派共识机制，五大流派各自独立分析后在八个维度上进行综合评判。`,
  ]))

  if (agreeCount > 0) {
    parts.push(pick([
      `其中${agreeCount}个维度（${result.consensus.filter(c => c.agreement === 'agree').map(c => c.dimension).join('、')}）各流派观点一致，结论可靠性较高。`,
      `有${agreeCount}个维度获得了各流派的一致认同，可信度较强。`,
    ]))
  }

  if (partialCount > 0) {
    parts.push(pick([
      `${partialCount}个维度（${result.consensus.filter(c => c.agreement === 'partial').map(c => c.dimension).join('、')}）存在部分共识，结论有一定参考价值。`,
      `另有${partialCount}个维度各流派部分一致，需要综合判断。`,
    ]))
  }

  if (disagreeCount > 0) {
    parts.push(pick([
      `${disagreeCount}个维度（${result.consensus.filter(c => c.agreement === 'disagree').map(c => c.dimension).join('、')}）流派分歧较大，建议以高权重流派结论为主。`,
      `有${disagreeCount}个维度流派间观点分歧，取最高权重流派之论为最终参考。`,
    ]))
  }

  if (highConfDims.length > 0) {
    parts.push(pick([
      `高置信度维度（${highConfDims.join('、')}）的分析结论最为可靠，建议重点关注。`,
      `置信度较高的维度包括${highConfDims.join('、')}，这些方面的判断相对明确。`,
    ]))
  }

  if (lowConfDims.length > 0) {
    parts.push(pick([
      `低置信度维度（${lowConfDims.join('、')}）的分析尚不明确，建议谨慎参考。`,
      '在' + lowConfDims.join('、') + '等方面，各流派判断差异较大，宜多方参酌。',
    ]))
  }

  return parts.join('')
}

// ═══════════════════════════════════════════════════════════
// ConsensusEngine 主类
// ═══════════════════════════════════════════════════════════

export class ConsensusEngine {
  /** 内部流派定义引用 */
  private readonly schools: SchoolDef[] = SCHOOLS

  /** 内部分析器映射 */
  private readonly analyzers = SCHOOL_ANALYZERS

  // ─── 查询接口 ───

  /** 获取所有流派定义 */
  getSchools(): SchoolDef[] {
    return [...this.schools]
  }

  /** 获取指定流派 */
  getSchool(id: SchoolId): SchoolDef | null {
    return this.schools.find(s => s.id === id) ?? null
  }

  // ─── 分析接口 ───

  /**
   * 执行单流派推演
   * @param schoolId  流派标识
   * @param chartData 命盘数据（含 dayElement, monthZhi, strengthScore, useGod, pattern, shiShen, climate 等字段）
   */
  analyzeSchool(
    schoolId: SchoolId,
    chartData: Record<string, unknown>,
  ): SchoolAnalysis {
    const school = this.getSchool(schoolId)
    if (!school) {
      throw new Error(`未知流派标识：${schoolId}`)
    }

    const refs = CLASSICAL_QUOTES[schoolId]
    const analyzer = this.analyzers[schoolId]
    const conclusions = analyzer(chartData, refs)

    const summary = generateSchoolSummary(school, conclusions)
    const keyFindings = extractKeyFindings(conclusions)
    const classicalRefs = pickN(refs, 3)

    return {
      schoolId,
      schoolName: school.name,
      conclusions,
      summary,
      keyFindings,
      classicalRefs,
    }
  }

  /**
   * 执行所有流派推演
   * @param chartData 命盘数据
   */
  analyzeAll(chartData: Record<string, unknown>): SchoolAnalysis[] {
    return this.schools.map(school =>
      this.analyzeSchool(school.id, chartData),
    )
  }

  /**
   * 执行共识推演（全部流派 + 共识综合）
   * @param chartData 命盘数据
   */
  analyze(chartData: Record<string, unknown>): ConsensusEngineResult {
    // 第一步：五大流派独立推演
    const schoolAnalyses = this.analyzeAll(chartData)

    // 第二步：各维度共识计算
    const consensus = DIMENSIONS.map(dim =>
      buildConsensusDimension(dim, schoolAnalyses, this.schools),
    )

    // 第三步：综合命盘评估
    const overallSummary = generateOverallSummary({ consensus, schoolAnalyses })

    // 第四步：汇总古籍引用
    const allRefs = this.schools.flatMap(s => CLASSICAL_QUOTES[s.id])
    const classicalRef = pick([
      '《子平真诠》："格局之法，以月令为先。"《滴天髓》："欲识三元万法宗，先观帝载与神功。"',
      '《穷通宝鉴》："察其旺衰，审其用神，辨其格局。"《三命通会》："命以八字为先，运以行年为要。"',
      '《渊海子平》："凡看命，以日干为主。"《子平真诠》："八字用神，专求月令。"',
    ])

    return {
      generatedAt: new Date().toISOString(),
      schoolAnalyses,
      consensus,
      overallSummary,
      classicalRef,
    }
  }

  // ─── 辅助接口 ───

  /** 获取共识维度列表 */
  getDimensions(): string[] {
    return [...DIMENSIONS]
  }

  /**
   * 获取古典引用
   * @param schoolId  指定流派（可选，不传则返回全部）
   */
  getClassicalRefs(schoolId?: SchoolId): string[] {
    if (schoolId) {
      return [...(CLASSICAL_QUOTES[schoolId] ?? [])]
    }
    return this.schools.flatMap(s => CLASSICAL_QUOTES[s.id])
  }
}
