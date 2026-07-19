/**
 * Module 7: Professional AI Report Engine — 数据库与知识库
 *
 * 职责：提供交叉验证规则、AI解释知识库、风险/机会/建议识别规则、时间轴阶段规则
 * 约束：本模块不做任何命理计算，只做数据整合和推理
 *
 * 典籍来源：
 * 《三命通会》明·万民英 — 综合论命、格局论
 * 《滴天髓》明·京图 / 清·任铁樵注 — 用神总论、五行生克
 * 《子平真诠》清·沈孝瞻 — 格局用神详论
 * 《穷通宝鉴》清·无名氏 — 调候用神
 * 《渊海子平》宋·徐升 — 十神论、大运流年
 * 《神峰通考》明·张神峰 — 命理谬误辨正
 */

import type { FiveElement } from '@/lib/core/types/base'
import type {
  RiskType,
  OpportunityType,
  RecommendationCategory,
  LifeStage,
} from './masterReportTypes'

// ═══════════════════════════════════════════════════════════
// 0. 接口定义
// ═══════════════════════════════════════════════════════════

/** 交叉验证规则 */
export interface CrossValidationRule {
  id: string
  name: string
  modules: string[]           // 参与验证的模块名
  description: string
  checkLogic: string          // 逻辑描述（实际逻辑在 engine 中实现）
  classicalReference: string
}

/** AI 解释知识库条目 */
export interface MasterExplainKBEntry {
  topic: string
  keywords: string[]
  classicalReference: string
  modernInterpretation: string
  professionalExplanation: string
  plainExplanation: string
  risks: string[]
  suggestions: string[]
  sourceModules: string[]
}

/** 风险识别规则 */
export interface MasterRiskRule {
  type: RiskType
  keywords: string[]
  detectionModules: string[]
  classicalReference: string
  levelIndicators: {
    high: string[]
    medium: string[]
    low: string[]
  }
  suggestion: string
  avoidance: string
}

/** 机会识别规则 */
export interface MasterOpportunityRule {
  type: OpportunityType
  keywords: string[]
  detectionModules: string[]
  classicalReference: string
  suggestion: string
}

/** 建议规则 */
export interface MasterRecommendationRule {
  category: RecommendationCategory
  keywords: string[]
  detectionModules: string[]
  classicalReference: string
  elementMapping: Record<string, FiveElement>
}

/** 时间轴阶段规则 */
export interface TimelineStageRule {
  stage: LifeStage
  ageRange: string
  description: string
  focusModules: string[]
  classicalReference: string
}

// ═══════════════════════════════════════════════════════════
// 1. CROSS_VALIDATION_RULES — 交叉验证规则（8 条）
// ═══════════════════════════════════════════════════════════

export const CROSS_VALIDATION_RULES: CrossValidationRule[] = [
  {
    id: 'cv-pattern-tengods',
    name: '格局与十神一致性',
    modules: ['pattern', 'tenGods'],
    description:
      '验证格局类型与十神主力的配置是否一致。例如正官格命局中正官星应当有力，若正官被冲克破害则格局失真。',
    checkLogic:
      '提取格局名称中的十神关键字（如"正官""偏财""食神"等），检查对应十神在命局中的力量评分是否达到有效阈值（>= 0.5），同时检查是否有严重冲克（评分 < 0.3）破坏格局根基。',
    classicalReference:
      '《子平真诠》卷一："格局之法，专论用神。用神者，八字中必不可少之物。"格局既定，用神之星必须有力，方为真格。',
  },
  {
    id: 'cv-pattern-xiyong',
    name: '格局与喜用神一致性',
    modules: ['pattern', 'xiYong'],
    description:
      '验证格局所需用神与系统推导的喜用神是否一致。如财格喜食伤生财、官格喜印星护官，若喜用神与格局需求矛盾则需降权。',
    checkLogic:
      '根据格局名称映射其理想用神五行（正官格→印星五行、食神格→财星五行等），对比喜用神五行的首选项，若完全吻合则置信度加成，若相冲则标记矛盾。',
    classicalReference:
      '《滴天髓》任铁樵注："知其为一"，即明了格局后当知其喜用。又云："用神不可损伤，忌神不可不顾。"格局喜用与实际喜用应相互印证。',
  },
  {
    id: 'cv-pattern-shensha',
    name: '格局与神煞一致性',
    modules: ['pattern', 'shenSha'],
    description:
      '验证命局中神煞与格局的配合关系。某些神煞可辅助格局，如天德贵人助于正官格；某些则有害，如羊刃冲破格局核心。',
    checkLogic:
      '检查贵神（天德、月德、天乙、天魁、天钺）是否在命局中出现并与格局十神同宫或相生；检查凶煞（羊刃、孤辰、寡宿、亡神）是否冲克格局用神所在柱。',
    classicalReference:
      '《三命通会》卷九："神煞之说，虽不可尽拘，然贵人乃命中之福星，与格局相合者尤吉。"又《渊海子平》："煞有制化为权，无制化为害。"',
  },
  {
    id: 'cv-pattern-fortune',
    name: '格局与大运一致性',
    modules: ['pattern', 'fortune'],
    description:
      '验证大运走势是否与格局喜忌方向一致。行运顺局者升迁顺利，逆局者多阻滞。关键看大运干支五行是否生扶格局用神。',
    checkLogic:
      '遍历每步大运的天干地支五行，判断其与格局用神五行的生克关系。生扶用神的大运标记为"顺局"，克制用神的标记为"逆局"，统计顺逆比例计算一致性分数。',
    classicalReference:
      '《滴天髓》任铁樵注："命好不如运好。"又云："顺运者，用神得地；逆运者，用神失势。"大运与格局的配合是命理推断的关键环节。',
  },
  {
    id: 'cv-tengods-xiyong',
    name: '十神与喜用神一致性',
    modules: ['tenGods', 'xiYong'],
    description:
      '验证十神主力与喜用神之间的关系。喜用神所对应的十神应在命局中有根，忌神对应的十神应力量偏弱或受制。',
    checkLogic:
      '将喜用神五行转换为对应十神类别（生我者→印星、我生者→食伤、克我者→官杀、我克者→财星、同我者→比劫），检查这些十神在命局中的力量分布是否合理。',
    classicalReference:
      '《渊海子平》卷一："十神者，以日干为中心，推论六亲吉凶。"喜用神即命局之根本，其所对应十神有力则命造根基稳固。',
  },
  {
    id: 'cv-strength-xiyong',
    name: '身强身弱与喜用神一致性',
    modules: ['xiYong'],
    description:
      '验证身强命局是否以克泄耗为喜用、身弱命局是否以生扶为喜用。身强喜财官食伤、身弱喜印比，此为命理之基本法则。',
    checkLogic:
      '提取身强/身弱判断结果。若身强，喜用神应包含克泄耗五行（财、官杀、食伤）；若身弱，喜用神应包含生扶五行（印、比劫）。检查喜用神与身强弱方向的逻辑一致性。',
    classicalReference:
      '《滴天髓》"强众而敌寡者，势在去其寡；强寡而敌众者，势在成乎众。"又云："身旺喜克泄，身弱喜生扶。"此乃用神取法之根本纲领。',
  },
  {
    id: 'cv-tiaohou-xiyong',
    name: '调候与喜用神一致性',
    modules: ['xiYong', 'pattern'],
    description:
      '验证调候用神是否被纳入喜用神体系。冬生之人需火调候，夏生之人需水调候。调候为命局的先天需求，优先级通常高于普通喜用。',
    checkLogic:
      '提取调候需求（如"丙""丁"火等），检查其是否出现在喜用神列表中。若调候元素被列为忌神（与普通喜用冲突），则标记为特殊矛盾，需要引擎判断调候优先级。',
    classicalReference:
      '《穷通宝鉴》总论："三冬水冷木寒，非丙火不暖；三夏火炎土燥，非癸水不润。"调候为先天之需，不可不知。又云："凡论命，先论调候，次论用神。"',
  },
  {
    id: 'cv-fortune-liunian',
    name: '大运与流年一致性',
    modules: ['fortune'],
    description:
      '验证当前大运与流年干支之间的关系。大运为十年大势，流年为当年具体，两者配合则应事明显，冲克则多变故。',
    checkLogic:
      '检查流年天干地支与大运天干地支的刑冲合害关系。若流年生扶大运或两者五行一致，标记为顺；若流年冲克大运，标记为逆；若流年与大运天合地合，标记为特殊机遇年。',
    classicalReference:
      '《渊海子平》卷三："大运管十年休咎，流年主一岁吉凶。运好年不好，犹春风不入枯木；运不好年好，如好花不逢春雨。"大运与流年的配合至关重要。',
  },
]

// ═══════════════════════════════════════════════════════════
// 2. MASTER_EXPLAIN_KB — AI 解释知识库（12 条）
// ═══════════════════════════════════════════════════════════

export const MASTER_EXPLAIN_KB: MasterExplainKBEntry[] = [
  {
    topic: '命局总评',
    keywords: ['命局', '总评', '整体', '八字', '四柱', '综合'],
    classicalReference:
      '《滴天髓》"欲识三元万法宗，先观帝载与神功。"命局总评须统观四柱五行、十神格局、调候大运，方得全貌。',
    modernInterpretation:
      '命局总评是对一个人先天命造的全方位审视，综合格局高低、五行平衡度、十神配置等因素，给出命造的基本定位与发展潜力评估。',
    professionalExplanation:
      '命局总评通过聚合 Module 1 四柱、Module 2 神煞、Module 3 十神、Module 4 格局、Module 5 喜用、Module 6 大运六大模块的分析结果，交叉验证后给出综合评定。核心指标包括格局纯度、五行流通度、十神配置均衡度和用神有力程度。',
    plainExplanation:
      '命局总评就像给你的整个命运做一次"体检报告"。它把你出生时间的年月日时转化成的四柱八字，从格局高低、五行旺衰、喜忌方向等多个角度综合分析，告诉你这一生的大致走向和天赋优势。',
    risks: ['命局总评依赖于各子模块的计算精度，单一模块偏差可能影响整体判断'],
    suggestions: ['命局总评仅为先天分析，后天的选择与努力同样重要'],
    sourceModules: ['pillars', 'shenSha', 'tenGods', 'pattern', 'xiYong', 'fortune'],
  },
  {
    topic: '格局评价',
    keywords: ['格局', '成格', '破格', '用神', '相神', '格局高低'],
    classicalReference:
      '《子平真诠》卷一："八字用神，专求月令。以月令五行，分配十神。"又："成格者贵，破格者贱。"格局以月令为先决条件。',
    modernInterpretation:
      '格局是命理学中判断一个人社会层次与人生高度的核心框架。成格之人多主贵显，破格之人需要另寻出路。格局高低直接关系人生上限。',
    professionalExplanation:
      '格局判断以月令为根基，取月令藏干透出之十神定格局名。成格需满足：格局用神有力（力量 >= 0.5）、格局无忌神严重冲克（冲克力量 < 0.3）、相神配合得当。格局纯度越高、配置越佳，命造层次越高。破格命局需在建议中引导另辟蹊径。',
    plainExplanation:
      '格局就好比你的"人生蓝图"类型。有些人天生适合走仕途（官格），有些人适合做生意（财格），有些人靠才华吃饭（食神格）。格局好不好，决定了你的人生能走多高。',
    risks: ['格局破败者若执意走格局对应路线，可能事倍功半'],
    suggestions: ['成格者宜顺势而为，破格者宜寻找变通之道，不拘一格'],
    sourceModules: ['pattern', 'tenGods', 'xiYong'],
  },
  {
    topic: '身强身弱',
    keywords: ['身强', '身弱', '日主', '旺衰', '得令', '失令', '权衡'],
    classicalReference:
      '《滴天髓》"任铁樵注"："日主之强弱，在得令与否。得令者虽衰亦强，失令者虽旺亦弱。"又云："身强则任财官，身弱则喜印比。"',
    modernInterpretation:
      '身强身弱是判断日主承受能力的关键指标。身强者能担财官（能承受压力与财富），身弱者需要帮扶（需要团队与支持），两者各有优劣。',
    professionalExplanation:
      '身强身弱判断综合月令、地支根气、天干生扶等多维因素。身强日主得令、得地、得势，可担财官食伤，行事果断有力；身弱日主失令失地，宜借印比之力，适合合作共赢。身强身弱并非优劣之分，而是选对方向的关键。',
    plainExplanation:
      '身强身弱不是说你身体好坏，而是说你的"承受力"如何。身强的人抗压能力强，适合独立创业、承担大责任；身弱的人更适合团队合作、借助他人力量。就像有些人一个人能扛起一袋米，有些人需要两个人一起抬。',
    risks: ['身弱者不宜过度透支体力与精力，身强者不宜独断专行'],
    suggestions: ['身强者宜开拓进取，身弱者宜稳扎稳打、善借外力'],
    sourceModules: ['pillars', 'xiYong', 'tenGods'],
  },
  {
    topic: '喜用神',
    keywords: ['喜用神', '用神', '喜神', '忌神', '仇神', '闲神', '五行喜忌'],
    classicalReference:
      '《滴天髓》"用神者，命中必不可少之物也。"又云："喜神者，辅助用神之物也。忌神者，损害用神之物也。"喜用神的选取是命理推断的灵魂。',
    modernInterpretation:
      '喜用神是命局中最需要的五行元素，代表着对你最有利的方向、颜色、行业等。知道自己的喜用神，就等于找到了人生的"好运密码"。',
    professionalExplanation:
      '喜用神选取遵循"扶抑、调候、通关"三大原则。扶抑以平衡日主强弱，调候以解决寒暖燥湿，通关以化解五行战克。喜用神的准确性取决于身强弱判断、调候需求分析和五行流通路径的综合考量。喜用神是后续职业、方位、颜色等建议的根本依据。',
    plainExplanation:
      '喜用神就是你八字里"最缺、最需要"的那个五行。比如你的喜用神是木，那么从事与木相关的行业、去东方发展、多用绿色，就可能给你带来好运。这就像给植物找到最适合的阳光和水分。',
    risks: ['喜用神判断错误会导致后续所有建议方向偏差'],
    suggestions: ['喜用神相关的生活方式调整宜循序渐进，不宜矫枉过正'],
    sourceModules: ['xiYong', 'pattern', 'pillars'],
  },
  {
    topic: '十神主事',
    keywords: ['十神', '正官', '偏官', '正财', '偏财', '食神', '伤官', '正印', '偏印', '比肩', '劫财'],
    classicalReference:
      '《渊海子平》卷一："十神者，生克制化之理也。正官主贵，正财主富，食神主福，七杀主权，偏印主术，伤官主智。"',
    modernInterpretation:
      '十神是命理学的核心分析工具，每一种十神代表不同的人格特质、社会关系和人生领域。了解自己的十神主力，就能明白自己天生擅长什么。',
    professionalExplanation:
      '十神以日干为中心，通过五行生克关系推演而来。正官（克我者，阴阳相异）代表规矩与事业，偏官/七杀（克我者，阴阳相同）代表魄力与竞争，正财（我克者，阴阳相异）代表稳定收入，偏财（我克者，阴阳相同）代表意外之财与人缘。十神力量分布决定了命造的性格特征与社会角色倾向。',
    plainExplanation:
      '十神就像是你的"性格说明书"。每个十神代表一种特质：正官让你守规矩、有事业心；食神让你有口福、爱享受；伤官让你聪明伶俐但爱挑战权威；偏印让你思维独特。你的八字里哪种十神最突出，你的性格就越偏向那方面。',
    risks: ['单一十神过旺可能导致性格偏颇，需要平衡发展'],
    suggestions: ['发挥主力十神的优势，同时注意弥补弱势十神的不足'],
    sourceModules: ['tenGods', 'pillars'],
  },
  {
    topic: '事业运',
    keywords: ['事业', '官星', '职业', '工作', '仕途', '职场', '升迁'],
    classicalReference:
      '《三命通会》卷十八："凡论官星，先看官星之有无，次看官星之强弱，再看官星之喜忌。"官星有力且得用者，事业运亨通。',
    modernInterpretation:
      '事业运通过官星（正官、七杀）的力量和配置来判断。官星有力且有印星护佑者，适合走仕途或大企业管理路线；无官星或官星无力者，更适合自由职业或技术路线。',
    professionalExplanation:
      '事业运评估综合十神模块中的官杀力量、格局模块中的官格/杀格判定、喜用模块中官杀是否为喜用、大运模块中官杀相关运势走势。核心指标：官杀力量分（0~1）、官杀与喜用一致性（布尔）、大运官杀助力年数。三维综合计算事业运评分。',
    plainExplanation:
      '事业运看的是你适不适合"当官"、在职场上能走多远。如果你八字里官星有力又有保护，那说明你在职场上很有潜力；如果官星弱或者被克制，你可能更适合自己当老板或者走技术路线。',
    risks: ['官杀过旺无制化者，职场易有口舌是非或小人暗害'],
    suggestions: ['事业运强者宜积极进取，事业运弱者宜走技术或自由职业路线'],
    sourceModules: ['tenGods', 'pattern', 'xiYong', 'fortune'],
  },
  {
    topic: '财运',
    keywords: ['财运', '财星', '财富', '收入', '正财', '偏财', '理财', '投资'],
    classicalReference:
      '《渊海子平》卷二："财为养命之源，不可不看。"又云："身旺能胜财，财旺自丰厚；身弱逢财多，财多反累己。"',
    modernInterpretation:
      '财运通过财星（正财、偏财）的力量和日主的承受能力来判断。身强财旺者财运亨通，身弱财多者反被财累，关键在于日主能否"担得起"。',
    professionalExplanation:
      '财运评估综合财星力量（十神模块）、日主身强身弱（喜用模块）、食伤生财能力（十神模块食神/伤官力量）、大运财运走势（大运模块）。核心逻辑：身强 + 财旺 + 食伤生财 = 最佳财运组合。身弱财旺需要印星转化（财→杀→印→身），否则"富屋贫人"。',
    plainExplanation:
      '财运不光看你八字里有没有"财星"，还要看你能不能"扛得住"。就像给你一座金山，如果你的身体（日主）够强壮，你就能享受财富；如果身体太弱，反而会被金山压垮。所以身弱的人不是没财运，而是要找对赚钱方式。',
    risks: ['身弱财旺者不宜高风险投资，宜稳健理财'],
    suggestions: ['财运强者可积极开拓，财运弱者宜以技能立足、细水长流'],
    sourceModules: ['tenGods', 'xiYong', 'pattern', 'fortune'],
  },
  {
    topic: '婚姻运',
    keywords: ['婚姻', '夫妻宫', '配偶', '感情', '桃花', '配偶星', '日支'],
    classicalReference:
      '《三命通会》卷十九："男以财星为妻，女以官星为夫。"又云："日支为配偶宫，宜静不宜动，宜生不宜冲。"婚姻之吉凶，首看配偶星与配偶宫。',
    modernInterpretation:
      '婚姻运通过配偶星（男看财星、女看官杀）和配偶宫（日支）的综合状况来判断。配偶星有力、配偶宫稳定者婚姻美满，反之则需注意经营。',
    professionalExplanation:
      '婚姻运评估综合：配偶星力量与喜忌（十神模块）、配偶宫（日支）的冲合状态（四柱模块）、桃花星与咸池的配置（神煞模块）、大运流年中感情相关运势（大运模块）。男命以财星为妻星、女命以官杀为夫星，结合性别参数进行针对性分析。',
    plainExplanation:
      '婚姻运看的是你的感情之路顺不顺。男生的"老婆星"是财星，女生的"老公星"是官星。这些星星如果又亮又稳，说明感情路顺畅；如果被冲克或者太弱，就需要在婚姻中多花心思经营。',
    risks: ['配偶宫逢冲者婚姻多变故，配偶星过旺或过弱皆需注意'],
    suggestions: ['婚姻运强者宜珍惜缘分，婚姻运弱者宜选择性格互补的伴侣'],
    sourceModules: ['tenGods', 'shenSha', 'pillars', 'fortune'],
  },
  {
    topic: '健康运',
    keywords: ['健康', '五行', '疾病', '身体', '寿元', '养生', '体质'],
    classicalReference:
      '《三命通会》卷二十："五行偏枯者，多有疾厄之患。水旺无土者主肾虚，火旺无水者主心疾。"五行平衡是健康之根本。',
    modernInterpretation:
      '健康运通过五行平衡度和特定五行过旺或缺失来判断。某五行过旺或过弱都可能导致对应的身体部位出现问题，这是中医与命理相通之处。',
    professionalExplanation:
      '健康运评估基于五行平衡指数（各五行力量标准差）和特定偏枯模式识别。木过旺或过弱→肝胆系统、火→心脏系统、土→脾胃系统、金→肺呼吸系统、水→肾泌尿系统。同时参考神煞中的疾病相关标记（如"灾煞""血刃"）和大运中五行失衡加剧的时期。',
    plainExplanation:
      '健康运看的是你五行平不平衡。如果某个五行特别强或者特别弱，就可能影响对应的身体部位。比如火太旺的人要注意心脏，木太弱的人要注意肝胆。这跟中医的五行养生是完全相通的。',
    risks: ['五行严重偏枯者应定期体检，关注对应脏腑健康'],
    suggestions: ['根据五行缺失进行饮食和生活习惯调整，预防为主'],
    sourceModules: ['pillars', 'shenSha', 'xiYong', 'fortune'],
  },
  {
    topic: '学业运',
    keywords: ['学业', '印星', '文昌', '考试', '读书', '学历', '智慧'],
    classicalReference:
      '《三命通会》卷二十一："印绶为文章之母，文昌为学问之星。"印星有力且逢文昌者，主聪明好学、学业有成。',
    modernInterpretation:
      '学业运通过印星（正印、偏印）和文昌星的综合配置来判断。印星代表吸收知识的能力，文昌星代表考试的运气，两者配合好者学业运佳。',
    professionalExplanation:
      '学业运评估综合：印星力量（十神模块）、文昌/华盖等文星配置（神煞模块）、食伤（创造力指标）力量（十神模块）、大运中印星引动年份（大运模块）。印星为第一指标（吸收力），文昌为第二指标（考试运），食伤为第三指标（创造力输出）。三者综合评分。',
    plainExplanation:
      '学业运看的是你适不适合读书、考试运好不好。印星就像你的"吸收器"，能帮你把知识装进脑子里；文昌星就像你的"考试幸运星"，让你在关键时刻发挥出色。两个都好的人，天生就是读书的料。',
    risks: ['印星过旺反主固执少变通，偏印过旺者兴趣广泛但难专精'],
    suggestions: ['学业运强者宜走学术研究路线，学业运弱者宜走实践技能路线'],
    sourceModules: ['tenGods', 'shenSha', 'fortune'],
  },
  {
    topic: '大运流年',
    keywords: ['大运', '流年', '运势', '十年', '一步大运', '太岁', '流年运势'],
    classicalReference:
      '《渊海子平》卷三："大运者，人生之枢纽也。十年一换，由月柱顺排或逆推。大运好则步步高升，大运差则处处受制。"',
    modernInterpretation:
      '大运代表每十年的人生大环境，流年代表每一年的具体际遇。大运是"天时"，决定大方向；流年是"地利"，决定具体事件。两者配合才能准确预测。',
    professionalExplanation:
      '大运流年分析基于 Module 6 Fortune Engine 的输出。大运评估维度：大运干支五行与喜用神的生克关系、大运引动的十神变化、大运与原局的合化关系。流年评估维度：流年天干地支与大运的配合、流年引动的神煞、流年与命局的冲合关系。顺运期为关键机遇窗口，逆运期需谨慎行事。',
    plainExplanation:
      '大运就像人生的"天气预报"，每十年换一次"气候"。好的大运就像顺风顺水，做什么都容易成功；不好的大运就像逆风行船，需要格外小心。流年就是每年的"当日天气"，告诉你今年具体会发生什么。',
    risks: ['大运交替之年（换运年）通常多变故，需特别注意'],
    suggestions: ['顺运期积极把握机遇，逆运期宜守成蓄力、提升自我'],
    sourceModules: ['fortune', 'xiYong', 'shenSha'],
  },
  {
    topic: '五行调候',
    keywords: ['调候', '寒暖', '燥湿', '丙火', '癸水', '穷通宝鉴', '温度'],
    classicalReference:
      '《穷通宝鉴》"三冬水冷木寒，非丙火不暖；三夏火炎土燥，非癸水不润。调候为命之急需，不可不察。"',
    modernInterpretation:
      '调候是命理学中关于"温度调节"的理论。冬天出生的人需要火来温暖，夏天出生的人需要水来降温。调候需求是先天条件，优先级高于普通喜用神。',
    professionalExplanation:
      '调候分析基于出生月份的天时条件。各月调候需求：《穷通宝鉴》有明确规范——例如寅月生者需丙火暖局、午月生者需壬水润局。调候用神可能与你从身强弱推导的喜用神不同甚至矛盾，此时调候通常优先。调候需求是五维评分中健康运的重要影响因子。',
    plainExplanation:
      '调候就像给你的命运"调温度"。冬天出生的人就像冬天里的植物，需要阳光（火）才能茁壮成长；夏天出生的人就像夏天的庄稼，需要雨水（水）才能不被晒枯。这是老天爷给你安排的先天需求，不用不行。',
    risks: ['忽视调候需求可能导致健康问题和运势阻滞'],
    suggestions: ['根据调候需求调整生活环境（如温度、湿度）和生活方式'],
    sourceModules: ['pillars', 'xiYong'],
  },
]

// ═══════════════════════════════════════════════════════════
// 3. RISK_RULES — 风险识别规则（6 条，对应 6 种 RiskType）
// ═══════════════════════════════════════════════════════════

export const RISK_RULES: MasterRiskRule[] = [
  {
    type: '事业风险',
    keywords: ['官杀被冲', '七杀无制', '官星逢伤', '职场变动', '小人', '口舌是非'],
    detectionModules: ['tenGods', 'pattern', 'fortune'],
    classicalReference:
      '《渊海子平》卷四："七杀无制，主人凶狠好斗，多招官非。"又云："伤官见官，为祸百端。"官星受伤则事业多波折。',
    levelIndicators: {
      high: [
        '七杀透干无印星制化',
        '伤官见官且无财星通关',
        '大运流年双重冲克官星',
        '官星所在柱逢三刑',
      ],
      medium: [
        '官星力量偏弱（< 0.3）',
        '官星逢合但合而不化',
        '大运中有忌神克制官星',
      ],
      low: [
        '官星有力但略受冲',
        '偶有流年不利但大运护官',
      ],
    },
    suggestion: '事业运逢风险期宜低调务实，避免与人正面冲突。可借助印星（学习提升）和食伤（展现才华）的力量来化解。',
    avoidance: '不宜在此期间跳槽、创业或与上级正面冲突。避免签署重大合同，注意保留工作记录。',
  },
  {
    type: '投资风险',
    keywords: ['财星被劫', '比劫夺财', '财多身弱', '破财', '投机失利', '财务危机'],
    detectionModules: ['tenGods', 'xiYong', 'fortune'],
    classicalReference:
      '《渊海子平》卷二："比劫重重，纵有财星亦难守。"又云："身弱财多，富屋贫人。"财星受损则理财需谨慎。',
    levelIndicators: {
      high: [
        '比肩/劫财透干且财星受克',
        '身弱财旺且无印星转化',
        '偏财逢劫且大运流年同动',
        '财星入墓且墓库被冲',
      ],
      medium: [
        '财星力量偏弱且有比劫暗克',
        '身财力量相当略偏弱',
        '大运中比劫力量渐增',
      ],
      low: [
        '财星略弱但有大运生扶',
        '偶有破财但总体财运稳定',
      ],
    },
    suggestion: '投资运逢风险期宜保守理财，减少投机性投资。可选择稳健型理财产品，注重资产配置的分散化。',
    avoidance: '不宜进行高风险投资、借贷或担保他人。避免大额消费和冲动购物。',
  },
  {
    type: '婚姻风险',
    keywords: ['配偶宫逢冲', '配偶星弱', '桃花泛滥', '婚姻不顺', '感情危机', '离婚'],
    detectionModules: ['tenGods', 'shenSha', 'pillars', 'fortune'],
    classicalReference:
      '《三命通会》卷十九："日支逢冲，婚姻多有不顺。"又云："男命财星多见，主感情纷扰；女命官杀混杂，主多婚之象。"配偶宫星不稳则婚姻多波折。',
    levelIndicators: {
      high: [
        '日支逢年月时三冲之一',
        '配偶星极弱或无配偶星',
        '桃花咸池多见且逢冲',
        '大运流年双重冲击配偶宫',
        '男命财星混杂、女命官杀混杂',
      ],
      medium: [
        '日支逢合但合带刑',
        '配偶星力量偏弱',
        '大运中有冲克配偶宫之势',
      ],
      low: [
        '配偶宫偶有冲但大运化解',
        '配偶星偏弱但受生扶',
      ],
    },
    suggestion: '婚姻运逢风险期宜多沟通、多包容。已婚者应注重感情维护，未婚者不宜仓促择偶。可选择与喜用五行对应的伴侣来化解。',
    avoidance: '不宜在此期间做出重大婚姻决定。已婚者避免冷战和长期分居，未婚者避免闪婚。',
  },
  {
    type: '健康风险',
    keywords: ['五行偏枯', '某行过旺', '某行极弱', '冲克太重', '疾厄', '灾煞'],
    detectionModules: ['pillars', 'shenSha', 'xiYong', 'fortune'],
    classicalReference:
      '《三命通会》卷二十："五行偏枯，疾病随之。木盛则肝亢，火炎则心疾，土重则脾滞，金坚则肺伤，水泛则肾虚。"',
    levelIndicators: {
      high: [
        '某五行力量 > 0.7 且无有效克制',
        '某五行力量 < 0.1 且无生扶来源',
        '命局五行标准差 > 阈值',
        '灾煞、血刃等凶煞并见',
        '大运流年加剧五行失衡',
      ],
      medium: [
        '某五行力量偏高或偏低（0.15~0.25 或 0.55~0.65）',
        '偶有疾厄相关神煞出现',
      ],
      low: [
        '五行轻微不均但总体平衡',
        '健康相关神煞轻微影响',
      ],
    },
    suggestion: '健康运逢风险期宜注重养生，加强锻炼。根据五行缺失调整饮食结构，定期体检。保持作息规律，避免过度劳累。',
    avoidance: '不宜进行高强度的体力活动或剧烈运动。避免熬夜、酗酒等不良生活习惯。注意交通安全。',
  },
  {
    type: '官非风险',
    keywords: ['官非', '诉讼', '牢狱', '七杀', '伤官见官', '羊刃逢冲', '刑狱'],
    detectionModules: ['tenGods', 'shenSha', 'fortune'],
    classicalReference:
      '《渊海子平》卷四："伤官见官，为祸百端，主官非诉讼。"又云："羊刃逢冲，主人刑伤破败。"《神峰通考》："七杀无制化，多主刑狱之灾。"',
    levelIndicators: {
      high: [
        '伤官见官且无财星通关',
        '七杀透干且无印星制化',
        '羊刃逢冲且大运加剧',
        '命局带天罗地网且官杀混杂',
        '流年三刑与官杀同动',
      ],
      medium: [
        '官杀力量偏旺且制化不力',
        '偶有伤官克制官星之象',
        '大运中将行至官杀忌神运',
      ],
      low: [
        '官杀有制化但偶尔受冲',
        '轻微刑克但不构成严重威胁',
      ],
    },
    suggestion: '官非风险期宜遵纪守法，避免卷入纠纷。行事宜谨慎低调，重要文件宜咨询专业人士。注意交通安全和合同条款。',
    avoidance: '不宜参与法律纠纷或充当担保人。避免与执法部门产生冲突。签署合同前务必仔细阅读条款。',
  },
  {
    type: '财务风险',
    keywords: ['财务', '债务', '借贷', '资金链', '财运衰退', '财库被冲'],
    detectionModules: ['tenGods', 'xiYong', 'fortune'],
    classicalReference:
      '《渊海子平》卷二："财星入墓，主收藏；墓库被冲，则财散。"又云："财多无库，如水流无归。"财务之稳健在于财有库藏。',
    levelIndicators: {
      high: [
        '财星入墓且墓库被冲破',
        '正财偏财俱弱且无食伤生财',
        '大运流年同时克制财星',
        '比劫重重且无官杀制劫',
        '身弱财旺急需印星但印星缺失',
      ],
      medium: [
        '财星力量偏弱但有生扶',
        '大运中财星力量渐减',
        '偶有破财迹象但总体可控',
      ],
      low: [
        '财星稳定但有轻微波动',
        '大运总体护财但偶有不利年份',
      ],
    },
    suggestion: '财务风险期宜紧缩开支，增加储蓄。建立应急资金，避免不必要的借贷。制定清晰的财务计划，控制消费欲望。',
    avoidance: '不宜进行大额投资或借贷。避免替他人做财务担保。谨慎对待"快速致富"类投资诱惑。',
  },
]

// ═══════════════════════════════════════════════════════════
// 4. OPPORTUNITY_RULES — 机会识别规则（6 条，对应 6 种 OpportunityType）
// ═══════════════════════════════════════════════════════════

export const OPPORTUNITY_RULES: MasterOpportunityRule[] = [
  {
    type: '事业机会',
    keywords: ['官星得用', '印星护官', '升迁', '提拔', '职运亨通', '贵人提携'],
    detectionModules: ['tenGods', 'pattern', 'xiYong', 'fortune'],
    classicalReference:
      '《三命通会》卷十八："官星有印护，主贵人提携，仕途顺遂。"又云："官逢财生，升迁有期。"官星得用之时，事业机会自然涌现。',
    suggestion: '官星得用的大运流年为事业发展的黄金期。宜积极主动争取晋升机会，展现领导才能，建立人脉网络。',
  },
  {
    type: '创业机会',
    keywords: ['食伤生财', '偏财旺', '身财两停', '创业', '自立门户', '经商'],
    detectionModules: ['tenGods', 'xiYong', 'fortune'],
    classicalReference:
      '《渊海子平》卷二："食神生财，富贵自来。"又云："身财两停，创业可期。"食伤生财、身财两停是创业的最佳命理条件。',
    suggestion: '食伤生财且身强能担财的时期为创业良机。宜选择与喜用五行相关的行业，充分发挥个人才华和创造力。',
  },
  {
    type: '投资机会',
    keywords: ['财星有力', '食伤生财', '偏财透干', '投资回报', '理财收益'],
    detectionModules: ['tenGods', 'xiYong', 'fortune'],
    classicalReference:
      '《渊海子平》卷二："偏财透干，主意外之财，善把握则有丰厚回报。"偏财主投资理财之机，关键在于时机的把握。',
    suggestion: '偏财得力、食伤生财的时期是投资的良机。可选择与喜用五行相关的投资品种，注意在顺运期入场的时机把控。',
  },
  {
    type: '婚恋机会',
    keywords: ['配偶星动', '桃花带贵', '红鸾', '天喜', '配偶宫合', '姻缘'],
    detectionModules: ['tenGods', 'shenSha', 'fortune'],
    classicalReference:
      '《三命通会》卷十九："红鸾天喜入命，主有婚姻之喜。"又云："流年遇财星（男命）或官星（女命），多为姻缘动之象。"',
    suggestion: '流年引动配偶星或红鸾天喜星时，婚恋机会增多。宜积极参加社交活动，展现真诚一面。已有伴侣者可考虑推进关系。',
  },
  {
    type: '学习机会',
    keywords: ['印星得力', '文昌引动', '华盖', '考试', '升学', '进修'],
    detectionModules: ['tenGods', 'shenSha', 'fortune'],
    classicalReference:
      '《三命通会》卷二十一："印绶逢生，主学业有成。文昌入命，聪明好学。"印星与文星齐动之时，学业运极佳。',
    suggestion: '印星得力、文昌引动的大运流年适合进修学习、参加考试。宜把握时机提升学历或专业技能，为未来积累资本。',
  },
  {
    type: '迁移机会',
    keywords: ['驿马', '迁移', '变动', '远行', '出国', '调动', '出行'],
    detectionModules: ['shenSha', 'fortune'],
    classicalReference:
      '《三命通会》卷九："驿马星动，主有迁移之象。贵人引马，迁移大利。"驿马逢冲或逢合引动，主出行变动。',
    suggestion: '驿马星被流年大运引动时，迁移和出行的机会增多。可能是工作调动、搬家或出国发展的好时机。',
  },
]

// ═══════════════════════════════════════════════════════════
// 5. RECOMMENDATION_RULES — 建议规则（9 条，对应 9 种 RecommendationCategory）
// ═══════════════════════════════════════════════════════════

export const RECOMMENDATION_RULES: MasterRecommendationRule[] = [
  {
    category: '职业建议',
    keywords: ['职业', '岗位', '角色', '适合', '擅长', '专业'],
    detectionModules: ['tenGods', 'pattern', 'xiYong'],
    classicalReference:
      '《渊海子平》卷五："官星旺者宜从事管理，财星旺者宜从事商业，食伤旺者宜从事文艺，印星旺者宜从事教育。"',
    elementMapping: {
      '管理/行政': '水' as FiveElement,
      '技术/研究': '木' as FiveElement,
      '文艺/创作': '火' as FiveElement,
      '金融/商业': '金' as FiveElement,
      '教育/培训': '土' as FiveElement,
    },
  },
  {
    category: '行业建议',
    keywords: ['行业', '领域', '产业', '方向', '板块', '五行行业'],
    detectionModules: ['xiYong'],
    classicalReference:
      '《滴天髓》任铁樵注："喜用何五行，即宜从事何行业。"五行各有所属之行业，择其喜用而为之，事半功倍。',
    elementMapping: {
      '木业': '木' as FiveElement,
      '火业': '火' as FiveElement,
      '土业': '土' as FiveElement,
      '金业': '金' as FiveElement,
      '水业': '水' as FiveElement,
    },
  },
  {
    category: '城市建议',
    keywords: ['城市', '地域', '方位', '发展', '宜居', '地理'],
    detectionModules: ['xiYong'],
    classicalReference:
      '《渊海子平》卷六："方位之宜，以喜用神之方位为佳。东方属木，南方属火，西方属金，北方属水，中央属土。"',
    elementMapping: {
      '东方城市（上海、南京等）': '木' as FiveElement,
      '南方城市（广州、深圳等）': '火' as FiveElement,
      '中原城市（武汉、成都等）': '土' as FiveElement,
      '西方城市（西安、兰州等）': '金' as FiveElement,
      '北方城市（北京、沈阳等）': '水' as FiveElement,
    },
  },
  {
    category: '颜色建议',
    keywords: ['颜色', '色彩', '穿搭', '配色', '幸运色', '五行色'],
    detectionModules: ['xiYong'],
    classicalReference:
      '《三命通会》附录："五行各有其色——木青、火赤、土黄、金白、水黑。用喜用神之色，可增运助吉。"',
    elementMapping: {
      '青色/绿色': '木' as FiveElement,
      '红色/紫色': '火' as FiveElement,
      '黄色/棕色': '土' as FiveElement,
      '白色/银色': '金' as FiveElement,
      '黑色/蓝色': '水' as FiveElement,
    },
  },
  {
    category: '数字建议',
    keywords: ['数字', '号码', '楼层', '吉利数', '河图洛书', '五行数'],
    detectionModules: ['xiYong'],
    classicalReference:
      '《渊海子平》附录："河图之数，天一生水、地二生火、天三生木、地四生金、天五生土。择喜用之数，可助运势。"',
    elementMapping: {
      '1、6': '水' as FiveElement,
      '2、7': '火' as FiveElement,
      '3、8': '木' as FiveElement,
      '4、9': '金' as FiveElement,
      '5、0': '土' as FiveElement,
    },
  },
  {
    category: '方位建议',
    keywords: ['方位', '朝向', '坐向', '吉方', '方向', '五行方位'],
    detectionModules: ['xiYong'],
    classicalReference:
      '《三命通会》卷九："东方甲乙木，南方丙丁火，西方庚辛金，北方壬癸水，中央戊己土。择喜用方位而居，可纳吉气。"',
    elementMapping: {
      '正东/东南': '木' as FiveElement,
      '正南/西南': '火' as FiveElement,
      '中央/东北/西南': '土' as FiveElement,
      '正西/西北': '金' as FiveElement,
      '正北': '水' as FiveElement,
    },
  },
  {
    category: '五行补救',
    keywords: ['补救', '缺失', '五行', '平衡', '调候', '化解'],
    detectionModules: ['pillars', 'xiYong'],
    classicalReference:
      '《穷通宝鉴》"命有缺憾，可以五行补救。补其所缺，制其所过，调其寒暖，使其归于中和。"',
    elementMapping: {
      '补木': '木' as FiveElement,
      '补火': '火' as FiveElement,
      '补土': '土' as FiveElement,
      '补金': '金' as FiveElement,
      '补水': '水' as FiveElement,
    },
  },
  {
    category: '风水建议',
    keywords: ['风水', '居住', '办公', '环境', '气场', '布局'],
    detectionModules: ['xiYong', 'shenSha'],
    classicalReference:
      '《三命通会》附录："风水之道，在于乘生气、避死气。命主喜何五行，居室宜纳何方之气。"',
    elementMapping: {
      '东方/木属性摆设（绿植、木制品）': '木' as FiveElement,
      '南方/火属性摆设（灯光、红色装饰）': '火' as FiveElement,
      '中央/土属性摆设（陶瓷、玉石摆件）': '土' as FiveElement,
      '西方/金属性摆设（金属制品、铜器）': '金' as FiveElement,
      '北方/水属性摆设（鱼缸、水景）': '水' as FiveElement,
    },
  },
  {
    category: '生活建议',
    keywords: ['生活', '习惯', '养生', '作息', '饮食', '运动', '日常'],
    detectionModules: ['pillars', 'xiYong'],
    classicalReference:
      '《滴天髓》"五行和合，百病不生。"顺应五行之性，调整饮食起居，是养生之根本。又《黄帝内经》："法于阴阳，和于术数。"',
    elementMapping: {
      '绿色蔬菜、酸味食物（养肝）': '木' as FiveElement,
      '红色食材、苦味食物（养心）': '火' as FiveElement,
      '黄色谷物、甘味食物（养脾）': '土' as FiveElement,
      '白色食材、辛味食物（养肺）': '金' as FiveElement,
      '黑色食材、咸味食物（养肾）': '水' as FiveElement,
    },
  },
]

// ═══════════════════════════════════════════════════════════
// 6. TIMELINE_STAGE_RULES — 时间轴阶段规则（4 条：儿童/青年/中年/晚年）
// ═══════════════════════════════════════════════════════════

export const TIMELINE_STAGE_RULES: TimelineStageRule[] = [
  {
    stage: '儿童',
    ageRange: '0-15岁',
    description:
      '儿童阶段以学业启蒙和身体健康为核心关注点。此阶段大运的影响相对间接，主要看原局的印星配置和学习能力基础。重点关注印星（学习能力）、文昌（考试运）和健康相关五行。',
    focusModules: ['tenGods', 'shenSha', 'xiYong'],
    classicalReference:
      '《三命通会》卷二十一："幼年之命，先看印绶。印绶有力者，主聪明好学，父母庇佑。印绶无力者，需后天补运。"',
  },
  {
    stage: '青年',
    ageRange: '16-30岁',
    description:
      '青年阶段以学业深造、职业起步和感情萌芽为核心。此阶段大运开始发挥明显作用，关键看官杀（事业起步）、财星（经济独立）和桃花（感情初动）的配置。同时关注驿马星（求学/工作变动）。',
    focusModules: ['tenGods', 'shenSha', 'fortune', 'xiYong'],
    classicalReference:
      '《渊海子平》卷三："青年行运，关系一生之根基。运逢喜用，则学业事业双收；运逢忌神，则多磨砺。"',
  },
  {
    stage: '中年',
    ageRange: '31-55岁',
    description:
      '中年阶段是人生事业和财富的黄金期，也是家庭责任最重的阶段。此阶段大运影响力达到巅峰，关键看格局的发挥程度、财官食伤的综合配置和大运的顺逆走向。同时关注婚姻稳定性和健康保养。',
    focusModules: ['pattern', 'tenGods', 'xiYong', 'fortune', 'shenSha'],
    classicalReference:
      '《滴天髓》任铁樵注："中年乃人生建功立业之时，命好运好则飞黄腾达，命好运差则怀才不遇。此十年之运，至为关键。"',
  },
  {
    stage: '晚年',
    ageRange: '56岁以上',
    description:
      '晚年阶段以健康养生、家庭和睦和财富守成为主。此阶段重点关注五行的长期平衡、健康相关指标和财富的保值。印星（安稳）、食神（享福）的配置决定晚年生活质量。调候需求在此阶段尤为重要。',
    focusModules: ['pillars', 'xiYong', 'shenSha', 'fortune'],
    classicalReference:
      '《三命通会》卷二十："晚年之命，重在养生。五行调和者，高寿无忧；五行偏枯者，宜早调养。印绶有根者，晚年有靠。"',
  },
]

// ═══════════════════════════════════════════════════════════
// 7. 查询函数
// ═══════════════════════════════════════════════════════════

/** 获取全部交叉验证规则 */
export function getCrossValidationRules(): CrossValidationRule[] {
  return CROSS_VALIDATION_RULES
}

/** 根据主题查询 AI 解释知识库条目 */
export function getExplainByTopic(topic: string): MasterExplainKBEntry | undefined {
  return MASTER_EXPLAIN_KB.find(
    (entry) => entry.topic === topic
  )
}

/** 获取全部 AI 解释知识库条目 */
export function getAllExplainEntries(): MasterExplainKBEntry[] {
  return MASTER_EXPLAIN_KB
}

/** 根据风险类型获取对应的风险识别规则 */
export function getRiskRule(type: RiskType): MasterRiskRule | undefined {
  return RISK_RULES.find(
    (rule) => rule.type === type
  )
}

/** 根据机会类型获取对应的机会识别规则 */
export function getOpportunityRule(type: OpportunityType): MasterOpportunityRule | undefined {
  return OPPORTUNITY_RULES.find(
    (rule) => rule.type === type
  )
}

/** 根据建议类别获取对应的建议规则 */
export function getRecommendationRule(category: RecommendationCategory): MasterRecommendationRule | undefined {
  return RECOMMENDATION_RULES.find(
    (rule) => rule.category === category
  )
}

/** 根据人生阶段获取对应的时间轴阶段规则 */
export function getTimelineStageRule(stage: LifeStage): TimelineStageRule | undefined {
  return TIMELINE_STAGE_RULES.find(
    (rule) => rule.stage === stage
  )
}
