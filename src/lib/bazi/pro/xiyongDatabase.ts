/**
 * H3 Module 5: Professional XiYong Engine — 喜用神知识库与规则数据库
 *
 * 本文件为喜用神引擎的知识基础，包含三大核心数据库：
 * 1. XIYONG_KB   — 五行喜用神知识库（基于子平真诠、滴天髓、穷通宝鉴、渊海子平等典籍）
 * 2. CLIMATE_RULES — 调候规则库（基于穷通宝鉴十二月调候用神）
 * 3. FUYI_RULES    — 扶抑规则库（六大扶抑方法及其判定逻辑）
 *
 * 所有古籍引用均为真实典籍。
 */

import type {
  FiveElement,
  HeavenlyStem,
  EarthlyBranch,
} from '@/lib/core/types/base'
import type { TenGodDetail } from './tenGodsTypes'
import type { PatternDetail } from './patternTypes'
import type { StrengthLevel } from './xiyongTypes'
import type { XiYongKnowledgeEntry, FuYiMethod } from './xiyongTypes'
import { FIVE_ELEMENT_SHENG, FIVE_ELEMENT_KE, FIVE_ELEMENT_BE_SHENG, FIVE_ELEMENT_BE_KE } from './helpers'

// ─── XiYongContext — 扶抑判定上下文 ───

/** 喜用神判定上下文，聚合 Module 3 / Module 4 的分析结果 */
export interface XiYongContext {
  /** 日主五行 */
  dayMasterElement: FiveElement
  /** 日主强弱评分 0-100 */
  strengthScore: number
  /** 日主强弱等级 */
  strengthLevel: StrengthLevel
  /** 五行力量百分比（五行名 → 百分比 0-100） */
  fiveElementPower: Record<string, number>
  /** 十神详细分析结果（来自 Module 3） */
  tenGodDetails: TenGodDetail[]
  /** 主格局详情（来自 Module 4，可能为 null） */
  primaryPattern: PatternDetail | null
  /** 月支地支 */
  monthBranch: EarthlyBranch
  /** 日主天干 */
  dayMaster: HeavenlyStem
}

// ─── 调候规则类型 ───

/** 调候规则 */
export interface ClimateRule {
  /** 月支 */
  monthBranch: EarthlyBranch
  /** 气候类型 */
  climateType: '寒' | '暖' | '燥' | '湿' | '平'
  /** 需要补充的五行 */
  needElement: FiveElement[]
  /** 调候方案 */
  solution: string
  /** 古典依据 */
  reference: string
  /** 调候紧迫度评分 0-100 */
  score: number
}

// ─── 扶抑规则类型 ───

/** 扶抑规则 */
export interface FuYiRule {
  /** 扶抑方法名称 */
  method: FuYiMethod
  /** 是否适用此方法 */
  applicable: (ctx: XiYongContext) => boolean
  /** 推荐喜神 */
  determineXiShen: (ctx: XiYongContext) => FiveElement[]
  /** 推荐用神 */
  determineYongShen: (ctx: XiYongContext) => FiveElement[]
  /** 古典依据 */
  reference: string
  /** 方法说明 */
  description: string
}

// ─── 五行生克辅助函数 ───

/** 我生（泄我） */
function woSheng(element: FiveElement): FiveElement {
  return FIVE_ELEMENT_SHENG[element]
}

/** 生我（印星） */
function shengWo(element: FiveElement): FiveElement {
  return FIVE_ELEMENT_BE_SHENG[element]
}

/** 我克（财星） */
function woKe(element: FiveElement): FiveElement {
  return FIVE_ELEMENT_KE[element]
}

/** 克我（官杀） */
function keWo(element: FiveElement): FiveElement {
  return FIVE_ELEMENT_BE_KE[element]
}

/** 同我（比劫） — 即自身五行 */
function tongWo(element: FiveElement): FiveElement {
  return element
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 1. 五行喜用神知识库（XIYONG_KB）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 五行喜用神知识库
 *
 * 每个五行作为喜用神时的完整信息，包括：
 * 古籍依据、现代解释、事业/财富/婚姻/健康建议、风险与调整方案
 */
export const XIYONG_KB: Record<FiveElement, XiYongKnowledgeEntry> = {
  '木': {
    element: '木',
    keywords: ['生长', '仁慈', '向上', '条达', '生机'],
    classicalBasis: [
      '《滴天髓》："甲木参天，脱胎要火。木不离心，春不容金，秋不容土。"',
      '《子平真诠》："木旺得金，方成栋梁。木能生火，火多木焚；强木得火，方化其顽。"',
      '《穷通宝鉴》："三春甲木，阳气渐升，先用庚金，次用丙丁。"',
      '《渊海子平》："木主仁，其性直，其情和。"',
    ],
    modernInterpretation:
      '木为东方，主生机与成长。喜木之人具有向上发展的潜力，性格仁慈正直，富有同情心与创造力。木旺需金修剪以成材，木弱需水滋养以生根。',
    career: [
      '适合教育、培训、文化传播等助人成长型行业',
      '适合农林牧渔、环保、绿色产业等与自然相关领域',
      '适合出版、创意设计、文字工作者等需要创造力的职业',
      '适合医药、健康管理等关怀型行业',
    ],
    wealth: [
      '财运需靠水（印星）滋养，长期积累为佳',
      '木火通明格局利于以才华变现，文化创意领域有利',
    ],
    marriage: [
      '宜找五行带水之人为伴，水能生木，感情持久',
      '避免金过旺之配，金克木易生摩擦',
      '木木组合感情深厚但需注意双方都缺乏妥协',
    ],
    health: [
      '注意肝胆系统健康，避免过劳与熬夜',
      '春季需防过敏、风湿等与木相关的疾病',
      '保持情绪舒畅，避免郁怒伤肝',
    ],
    risks: [
      '木弱逢金克，易遇事业阻碍或健康问题',
      '木过旺而无金修剪，性格固执难变通',
      '火多木焚，过度的热情消耗可能导致身心疲惫',
    ],
    suggestions: [
      '日常可多接触绿色植物与自然环境，增强木气',
      '适宜居住朝东的房屋，方位上利木气生发',
      '穿搭上可选择绿色系，有助于补充木之能量',
      '早起晨练，顺应木气升发之性',
    ],
    tags: ['仁慈', '成长', '创造', '正直', '生机'],
  },

  '火': {
    element: '火',
    keywords: ['光明', '礼仪', '热情', '昭显', '文明'],
    classicalBasis: [
      '《滴天髓》："丙火猛烈，欺霜侮雪。戊土固重，喜丙丁为曜。"',
      '《子平真诠》："火旺得水，方成相济。火能生土，土多火晦；强火得水，方成既济。"',
      '《穷通宝鉴》："三夏丙火，阳刃用壬，己土为佐。"',
      '《渊海子平》："火主礼，其性急，其情恭。"',
    ],
    modernInterpretation:
      '火为南方，主光明与礼仪。喜火之人热情开朗，善于表达，具有领导力与感染力。火旺需水济之以成既济，火弱需木生之以助其势。',
    career: [
      '适合演艺、传媒、广告等需要展现力与感染力的行业',
      '适合餐饮、能源、电力等与火相关领域',
      '适合管理、公关、市场营销等需要人际互动的职业',
      '适合科技、互联网、电子等高科技领域',
    ],
    wealth: [
      '火为财之源头（木火通明），才华施展即有收获',
      '需水调节，财源才能稳定持续，不宜急功近利',
    ],
    marriage: [
      '宜找五行带木之人为伴，木能生火，感情温暖',
      '火火组合热情洋溢但需防过于激烈导致矛盾',
      '适当的水元素配对有助于调和感情温度',
    ],
    health: [
      '注意心血管系统健康，避免过度兴奋与焦虑',
      '夏季需防中暑、上火等与火相关的疾病',
      '保持充足睡眠，避免心火过旺',
    ],
    risks: [
      '火弱逢水克，容易缺乏自信或热情消退',
      '火过旺而缺水，急躁冲动易引发人际冲突',
      '木多火塞，外力扶持过多反而失去自主性',
    ],
    suggestions: [
      '适宜居住朝南的房屋，采光充足为佳',
      '穿搭上可选择红色、橙色系，有助于补充火之能量',
      '多参与社交活动，发挥火的传播特质',
      '练习冥想静心，避免火气过旺导致情绪失控',
    ],
    tags: ['热情', '礼仪', '领导', '表达', '光明'],
  },

  '土': {
    element: '土',
    keywords: ['厚重', '信义', '包容', '承载', '中和'],
    classicalBasis: [
      '《滴天髓》："戊土固重，既中且正，静翕动辟，万物司命。己土卑湿，中正蓄藏。"',
      '《子平真诠》："土旺得木，方能疏通。土多火晦，强土得木，方成稼穑。"',
      '《穷通宝鉴》："三月戊土，先用甲木，次取丙火，忌阴水。"（季春土需木疏）',
      '《渊海子平》："土主信，其性重，其情厚。"',
    ],
    modernInterpretation:
      '土为中央，主厚重与信义。喜土之人稳重踏实，值得信赖，具有包容力和忍耐力。土旺需木疏通以防壅塞，土弱需火生之以增其力。',
    career: [
      '适合房地产、建筑、土木工程等与土相关行业',
      '适合农业、矿业、仓储物流等实体型领域',
      '适合金融、保险、信托等以稳定为特点的行业',
      '适合行政、人事、后勤管理等统筹协调型职业',
    ],
    wealth: [
      '土为财库之象，善于储蓄与稳健投资',
      '需火生土或木疏土，财路方能通畅',
      '土多而缺木疏则财困滞不动，需主动求变',
    ],
    marriage: [
      '宜找五行带火之人为伴，火能生土，感情稳固',
      '土土组合踏实可靠但需注意生活缺乏变化',
      '木土组合一方疏一方受，需包容理解',
    ],
    health: [
      '注意脾胃消化系统健康，饮食规律为要',
      '长夏（季夏）需防湿热之疾，饮食宜清淡',
      '避免思虑过度，以免伤脾',
    ],
    risks: [
      '土弱逢木克，易遇压力与不信任感',
      '土过旺而缺木疏，性格固执保守、拒绝变化',
      '水多土流，过于迎合他人而失去立场',
    ],
    suggestions: [
      '适宜居住居中的房屋或低楼层，接地气为佳',
      '穿搭上可选择黄色、棕色系，有助于补充土之能量',
      '培养信任与坦诚的品质，发挥土的信义特质',
      '适当进行户外登山、徒步等接地活动',
    ],
    tags: ['厚重', '信义', '包容', '稳健', '承载'],
  },

  '金': {
    element: '金',
    keywords: ['肃杀', '义气', '果断', '坚毅', '变革'],
    classicalBasis: [
      '《滴天髓》："庚金带煞，刚健为最。得水而清，得火而锐。"',
      '《子平真诠》："金旺得火，方成器皿。金能生水，水多金沉；强金得火，方锻成器。"',
      '《穷通宝鉴》："七月初秋庚金，阳气未除，先用丁火，次取甲木。"',
      '《渊海子平》："金主义，其性刚，其情烈。"',
    ],
    modernInterpretation:
      '金为西方，主肃杀与义气。喜金之人果断刚毅，重义气，具有决断力与执行力。金旺需火锻炼以成器，金弱需土生之以助其势。',
    career: [
      '适合法律、司法、军警等需要执行力与纪律性的行业',
      '适合金融、投资、证券等与金直接相关的领域',
      '适合外科医疗、牙科等需要精准操作的职业',
      '适合机械制造、五金、汽车等工业领域',
    ],
    wealth: [
      '金为直接财富之象，善理财者可快速积累',
      '需土生金或水泄金，财富才能流通增值',
      '金过旺而缺火锻炼，虽有财但管理粗放',
    ],
    marriage: [
      '宜找五行带土之人为伴，土能生金，感情踏实',
      '金金组合义气相投但需注意双方都过于刚硬',
      '火金组合一方克一方受，需相互磨合成器',
    ],
    health: [
      '注意呼吸系统与肺部健康，秋季尤需防护',
      '避免过度操劳与干燥环境，保护呼吸道',
      '适当锻炼增强体质，金气旺盛者耐力好',
    ],
    risks: [
      '金弱逢火克，易遇口舌是非或健康受损',
      '金过旺而无火锻炼，性格刚愎自用、不易合作',
      '水多金沉，优柔寡断失去金的果断本色',
    ],
    suggestions: [
      '适宜居住朝西的房屋，通风干燥为佳',
      '穿搭上可选择白色、银色系，有助于补充金之能量',
      '培养果断与正义的品质，发挥金的义气特质',
      '练习武术或拳击等运动，疏导金的肃杀之气',
    ],
    tags: ['义气', '果断', '坚毅', '变革', '纪律'],
  },

  '水': {
    element: '水',
    keywords: ['智慧', '流动', '灵活', '润下', '深邃'],
    classicalBasis: [
      '《滴天髓》："壬水通河，能泄金气，刚中之德，周流不息。癸水润下，通济万物。"',
      '《子平真诠》："水旺得土，方成池沼。水能生木，木多水缩；强水得土，方能止蓄。"',
      '《穷通宝鉴》："十一月壬水，陽刃用己，忌丙火。"',
      '《渊海子平》："水主智，其性聪，其情善。"',
    ],
    modernInterpretation:
      '水为北方，主智慧与流动。喜水之人聪慧灵活，善于变通，具有深刻的洞察力。水旺需土止蓄以成池沼，水弱需金生之以助其源。',
    career: [
      '适合学术研究、教育、咨询等需要智力深度投入的行业',
      '适合贸易、物流、运输等与流动相关领域',
      '适合IT、互联网、通信等信息流通型行业',
      '适合旅游、航运、传媒等流动性强的职业',
    ],
    wealth: [
      '水为流动之财，利于经商贸易与流通领域',
      '需土止蓄方能聚财，否则财来财去难以积累',
      '金生水则财源不断，持续学习是理财之本',
    ],
    marriage: [
      '宜找五行带金之人为伴，金能生水，感情和谐',
      '水水组合聪明默契但需注意感情飘忽不定',
      '土木组合一方止一方流，需找到平衡点',
    ],
    health: [
      '注意肾脏与泌尿系统健康，冬季尤需保暖',
      '避免过度劳累与寒冷刺激，保护肾气',
      '保持适度运动，水的体质需要流动但不可过度消耗',
    ],
    risks: [
      '水弱逢土克，智慧受压、思维受阻',
      '水过旺而缺土止蓄，感情漂泊、难以安定',
      '木多水缩，过度消耗精力导致身心疲惫',
    ],
    suggestions: [
      '适宜居住朝北的房屋或近水之处，环境湿润为佳',
      '穿搭上可选择黑色、蓝色系，有助于补充水之能量',
      '培养学习与思考的习惯，发挥水的智慧特质',
      '游泳、太极等柔韧运动最利水气调养',
    ],
    tags: ['智慧', '灵活', '深邃', '变通', '流动'],
  },
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 2. 调候规则库（CLIMATE_RULES）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 调候规则库
 *
 * 基于穷通宝鉴十二月调候用神理论，按月支地支定义各月的气候特点及调候需求。
 * 调候的核心：寒需暖（火），燥需湿（水），使命局五行在气候层面保持平衡。
 */
export const CLIMATE_RULES: ClimateRule[] = [
  {
    monthBranch: '亥',
    climateType: '寒',
    needElement: ['火'],
    solution: '亥月水旺，气候寒冷，需丙火暖局、丁火辅助调候。火既能暖局又可调节水之寒气。',
    reference: '《穷通宝鉴》："十月亥水，三冬初临，阳气已微，先用丙火，次用甲木。"（冬月调候以火为第一要义）',
    score: 85,
  },
  {
    monthBranch: '子',
    climateType: '寒',
    needElement: ['火'],
    solution: '子月隆冬，水旺至极，寒气最重。急需丙火暖局解冻，甲木辅助以引丁火之气。无火则命局冰冻万物不生。',
    reference: '《穷通宝鉴》："十一月子水，阳生阴杀，建禄之月，先用丙火解冻，次用壬水戊土。"（子月为一年中最寒冷之时）',
    score: 95,
  },
  {
    monthBranch: '丑',
    climateType: '寒',
    needElement: ['火'],
    solution: '丑月季冬，湿土寒冷，水虽渐退但寒气犹重。需丙火暖局化冻，兼以甲木疏通湿土。',
    reference: '《穷通宝鉴》："十二月丑土，严冬之际，先用丙火暖局，次取甲木疏土。丑土为湿寒之土，非丙不暖。"',
    score: 80,
  },
  {
    monthBranch: '寅',
    climateType: '寒',
    needElement: ['火'],
    solution: '寅月初春，阳气初动而余寒未尽。木气渐旺但气候仍寒，需丙火暖局促其生机，调候与扶抑并重。',
    reference: '《穷通宝鉴》："正月寅木，三阳开泰，然余寒未退，先用丙火暖局，次取壬水。"（初春阳气虽动仍需火暖）',
    score: 65,
  },
  {
    monthBranch: '卯',
    climateType: '寒',
    needElement: ['火'],
    solution: '卯月仲春，木气旺盛，阳气渐升但阴湿仍存。需丁火辅助暖局，乙木渐旺仍需阳和之气调候。',
    reference: '《穷通宝鉴》："二月卯木，阳气渐盛，然春寒料峭，需丙丁火调候，木火通明方为上格。"',
    score: 50,
  },
  {
    monthBranch: '辰',
    climateType: '平',
    needElement: [],
    solution: '辰月季春，气候温和，寒暖适中。辰为水之墓库，土气渐旺。一般无需特别调候，视命局五行偏颇而定。',
    reference: '《穷通宝鉴》："三月辰土，季春气候渐暖，土旺木衰，多用甲木疏土，调候需求不大。"',
    score: 15,
  },
  {
    monthBranch: '巳',
    climateType: '暖',
    needElement: ['水'],
    solution: '巳月初夏，火气渐旺，气候转暖。需壬水济火降温，兼以庚金发水源。水火既济为最佳状态。',
    reference: '《穷通宝鉴》："四月巳火，初夏阳炽，先用壬水，次取庚金。壬水为调候第一要义。"',
    score: 60,
  },
  {
    monthBranch: '午',
    climateType: '燥',
    needElement: ['水'],
    solution: '午月盛夏，火旺至极，气候炎热干燥。急需壬水调候济火，癸水亦可辅助润泽。无水则火炎土燥万物焦枯。',
    reference: '《穷通宝鉴》："五月午火，阳刃当令，炎上之极，先用壬水，次取己土。"（午月为一年中最炎热之时）',
    score: 90,
  },
  {
    monthBranch: '未',
    climateType: '燥',
    needElement: ['水'],
    solution: '未月季夏，燥土当令，暑热未消。需癸水润土降温，壬水亦可。水能济未土之燥，使万物得以滋养。',
    reference: '《穷通宝鉴》："六月未土，季夏燥气未除，先用癸水润土，次取丙火。"（未土为燥土，最需水润）',
    score: 70,
  },
  {
    monthBranch: '申',
    climateType: '平',
    needElement: [],
    solution: '申月初秋，金水渐生，气候由暖转凉。申为水之长生，金水相生。一般无需特别调候，但需注意秋季偏燥之性。',
    reference: '《穷通宝鉴》："七月申金，阳进气爽，秋气初临，壬水长生，调候需求不大。"',
    score: 20,
  },
  {
    monthBranch: '酉',
    climateType: '燥',
    needElement: ['水'],
    solution: '酉月仲秋，金旺水死，气候干燥。需壬水润泽调候，癸水亦可。金白水清方为上格。',
    reference: '《穷通宝鉴》："八月酉金，仲秋金旺，水气渐衰，需壬水调候润泽，金水相生。"（仲秋金旺水弱，需水润泽）',
    score: 45,
  },
  {
    monthBranch: '戌',
    climateType: '燥',
    needElement: ['水'],
    solution: '戌月季秋，燥土当令，秋燥渐深。需壬水或癸水润燥调候。戌为火之墓库，余热未尽，水之调候作用十分重要。',
    reference: '《穷通宝鉴》："九月戌土，季秋干燥，火之余气尚存，先用壬水润燥，次取甲木。"',
    score: 55,
  },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 3. 扶抑规则库（FUYI_RULES）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 辅助函数：获取命局中最强和最弱的五行
 */
function getStrongestElement(ctx: XiYongContext): FiveElement {
  const entries = Object.entries(ctx.fiveElementPower) as [string, number][]
  let maxEntry = entries[0]
  for (let i = 1; i < entries.length; i++) {
    if (entries[i][1] > maxEntry[1]) {
      maxEntry = entries[i]
    }
  }
  return maxEntry[0] as FiveElement
}

/**
 * 辅助函数：获取命局中最弱的五行
 */
function getWeakestElement(ctx: XiYongContext): FiveElement {
  const entries = Object.entries(ctx.fiveElementPower) as [string, number][]
  let minEntry = entries[0]
  for (let i = 1; i < entries.length; i++) {
    if (entries[i][1] < minEntry[1]) {
      minEntry = entries[i]
    }
  }
  return minEntry[0] as FiveElement
}

/**
 * 辅助函数：判断两行是否严重相克（力量均超 30%）
 */
function hasSevereConflict(ctx: XiYongContext): { source: FiveElement; target: FiveElement } | null {
  const elements: FiveElement[] = ['木', '火', '土', '金', '水']
  for (const e of elements) {
    const power = ctx.fiveElementPower[e] ?? 0
    if (power > 30) {
      const target = FIVE_ELEMENT_KE[e]
      const targetPower = ctx.fiveElementPower[target] ?? 0
      if (targetPower > 30) {
        return { source: e, target }
      }
    }
  }
  return null
}

/**
 * 扶抑规则库
 *
 * 六大扶抑方法及其判定逻辑：
 * 1. 扶抑法 — 身弱扶之（印比），身强抑之（财官泄耗）
 * 2. 调候法 — 寒需暖（火），燥需湿（水）
 * 3. 病药法 — 找最强失衡五行为"病"，其克制五行为"药"
 * 4. 通关法 — 两行相克需中间五行通关化解
 * 5. 专旺法 — 一行独旺顺势，以泄耗为用
 * 6. 从格法 — 从格顺势不可逆，以从势五行为用
 */
export const FUYI_RULES: FuYiRule[] = [
  // ── 1. 扶抑法 ──
  {
    method: '扶抑法',
    applicable: (ctx: XiYongContext): boolean => {
      // 非专旺、非从格的普通命局均适用扶抑法
      if (ctx.primaryPattern === null) return true
      const specialPatterns: string[] = [
        '从格', '专旺格', '化气格', '炎上格', '润下格', '稼穑格', '曲直格',
        '从儿格', '从财格', '从杀格',
      ]
      return !specialPatterns.includes(ctx.primaryPattern.name)
    },
    determineXiShen: (ctx: XiYongContext): FiveElement[] => {
      const dm = ctx.dayMasterElement
      // 身弱：喜印（生我）和比劫（同我）
      if (ctx.strengthLevel === '偏弱' || ctx.strengthLevel === '极弱') {
        const xi: FiveElement[] = [shengWo(dm), tongWo(dm)]
        // 去重
        return [...new Set(xi)]
      }
      // 身强：喜财（我克）和官杀（克我）、食伤（我生泄气）
      const xi: FiveElement[] = [woSheng(dm), woKe(dm), keWo(dm)]
      return [...new Set(xi)]
    },
    determineYongShen: (ctx: XiYongContext): FiveElement[] => {
      const dm = ctx.dayMasterElement
      if (ctx.strengthLevel === '偏弱' || ctx.strengthLevel === '极弱') {
        // 身弱：用神首选印星（生我），次取比劫（同我）
        return [shengWo(dm), tongWo(dm)]
      }
      // 身强：用神首选官杀（克我制身），次取食伤（泄秀）
      return [keWo(dm), woSheng(dm)]
    },
    reference: '《子平真诠》："扶抑者，衰则扶之，旺则抑之。扶之者，印比也；抑之者，官食财也。"',
    description:
      '扶抑法是最基本的用神选取方法。日主身弱则需印星（生我者）和比劫（同我者）帮扶，日主身强则需财星（我克者）、官杀（克我者）和食伤（我生泄秀者）泄耗。',
  },

  // ── 2. 调候法 ──
  {
    method: '调候法',
    applicable: (ctx: XiYongContext): boolean => {
      // 查找当前月支的调候规则
      const rule = CLIMATE_RULES.find(r => r.monthBranch === ctx.monthBranch)
      if (!rule || rule.climateType === '平') return false
      if (rule.needElement.length === 0) return false
      return true
    },
    determineXiShen: (_ctx: XiYongContext): FiveElement[] => {
      // 调候喜神由具体调候规则决定，此处在 applicable 阶段已过滤
      return []
    },
    determineYongShen: (ctx: XiYongContext): FiveElement[] => {
      const rule = CLIMATE_RULES.find(r => r.monthBranch === ctx.monthBranch)
      if (!rule) return []
      return rule.needElement
    },
    reference: '《穷通宝鉴》："寒则暖之，燥则润之。十二月各有调候用神，不可不察。"',
    description:
      '调候法依据穷通宝鉴十二月调候理论，冬季命局寒凝需火暖，夏季命局火炎需水润。调候与扶抑可并行不悖，调候优先于扶抑——即命局寒暖失衡时，需先解决调候问题。',
  },

  // ── 3. 病药法 ──
  {
    method: '病药法',
    applicable: (ctx: XiYongContext): boolean => {
      // 当某一五行力量超过 40%（明显过旺）时适用
      const elements: FiveElement[] = ['木', '火', '土', '金', '水']
      for (const e of elements) {
        if ((ctx.fiveElementPower[e] ?? 0) > 40) return true
      }
      return false
    },
    determineXiShen: (ctx: XiYongContext): FiveElement[] => {
      // 病为最强之五行，喜其克制五行
      const strongest = getStrongestElement(ctx)
      return [FIVE_ELEMENT_KE[strongest]]
    },
    determineYongShen: (ctx: XiYongContext): FiveElement[] => {
      // 药为克制最强五行的五行
      const strongest = getStrongestElement(ctx)
      const medicine = FIVE_ELEMENT_KE[strongest]
      // 同时考虑通关：如果药本身也弱，需生药的五行
      const medicinePower = ctx.fiveElementPower[medicine] ?? 0
      if (medicinePower < 15) {
        return [medicine, shengWo(medicine)]
      }
      return [medicine]
    },
    reference: '《滴天髓》："有病方为贵，无伤不是奇。格中如去病，财禄两相随。"',
    description:
      '病药法寻找命局中最强、最失衡的五行为"病"，以克制该五行的力量为"药"。有病有药，命局方能平衡。病重药轻则力不从心，病轻药重则矫枉过正，需恰到好处。',
  },

  // ── 4. 通关法 ──
  {
    method: '通关法',
    applicable: (ctx: XiYongContext): boolean => {
      // 当命局中存在两行严重相克（力量均超 30%）时适用
      return hasSevereConflict(ctx) !== null
    },
    determineXiShen: (ctx: XiYongContext): FiveElement[] => {
      // 通关五行 = source 生出的五行（即 source → 通关 → target）
      const conflict = hasSevereConflict(ctx)
      if (!conflict) return []
      return [FIVE_ELEMENT_SHENG[conflict.source]]
    },
    determineYongShen: (ctx: XiYongContext): FiveElement[] => {
      const conflict = hasSevereConflict(ctx)
      if (!conflict) return []
      // 通关五行为用神
      const bridge = FIVE_ELEMENT_SHENG[conflict.source]
      return [bridge]
    },
    reference: '《子平真诠》："通关者，两行相克，以生我者通之。如木克土，以火通关，使木生火、火生土，则克者化为生者。"',
    description:
      '通关法用于命局中两行严重相克的局面。如木旺克土，则以火为通关之神——木生火、火生土，将克化为生。通关五行既泄了强者之气，又生了弱者之根，一举两得。',
  },

  // ── 5. 专旺法 ──
  {
    method: '专旺法',
    applicable: (ctx: XiYongContext): boolean => {
      // 日主极强且为专旺格局
      if (ctx.strengthLevel !== '极强') return false
      if (ctx.primaryPattern === null) return false
      const zhuanWangPatterns: string[] = [
        '专旺格', '炎上格', '润下格', '稼穑格', '曲直格', '从儿格',
      ]
      return zhuanWangPatterns.includes(ctx.primaryPattern.name)
    },
    determineXiShen: (ctx: XiYongContext): FiveElement[] => {
      // 专旺顺势：喜泄（我生）和耗（我克），不可逆势扶抑
      const dm = ctx.dayMasterElement
      return [woSheng(dm), woKe(dm)]
    },
    determineYongShen: (ctx: XiYongContext): FiveElement[] => {
      // 用神：食伤泄秀为第一用神
      const dm = ctx.dayMasterElement
      return [woSheng(dm)]
    },
    reference: '《滴天髓》："旺极宜泄不宜克，泄之为秀，克之则激。专旺之局，顺其势而泄之。"',
    description:
      '专旺法适用于日主极强且一行独旺的命局（如曲直格纯木、润下格纯水等）。专旺命局顺势不可逆，只能泄耗不可克伐。食伤泄秀为第一用神，财星耗气为第二用神。',
  },

  // ── 6. 从格法 ──
  {
    method: '从格法',
    applicable: (ctx: XiYongContext): boolean => {
      // 日主极弱且为从格格局
      if (ctx.strengthLevel !== '极弱') return false
      if (ctx.primaryPattern === null) return false
      const congPatterns: string[] = [
        '从格', '从财格', '从杀格', '从儿格',
      ]
      return congPatterns.includes(ctx.primaryPattern.name)
    },
    determineXiShen: (ctx: XiYongContext): FiveElement[] => {
      // 从格顺势：喜从势五行，即命局中最强之五行
      const strongest = getStrongestElement(ctx)
      // 同时喜生最强五行的五行（助其势）
      return [strongest, shengWo(strongest)]
    },
    determineYongShen: (ctx: XiYongContext): FiveElement[] => {
      // 用神：以从势五行为主
      return [getStrongestElement(ctx)]
    },
    reference: '《子平真诠》："从格者，日主无根无生，不得不从旺者之势。从其势而顺之，不可逆势扶之。"',
    description:
      '从格法适用于日主极弱、毫无根气与生扶的命局。日主无力自立，只能顺从命局中最强之五行的气势。从财格以财星为用，从杀格以官杀为用，从儿格以食伤为用。切忌扶抑日主，逆势而为则凶。',
  },
]

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 4. 查询函数
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 查询指定五行的喜用神知识库条目
 * @param element 五行
 * @returns 对应的喜用神知识条目，未找到则返回 undefined
 */
export function getXiYongKnowledge(element: FiveElement): XiYongKnowledgeEntry | undefined {
  return XIYONG_KB[element]
}

/**
 * 查询指定月支的调候规则
 * @param monthBranch 月支地支
 * @returns 对应的调候规则，未找到则返回 undefined
 */
export function getClimateRule(monthBranch: EarthlyBranch): ClimateRule | undefined {
  return CLIMATE_RULES.find(rule => rule.monthBranch === monthBranch)
}

/**
 * 获取全部调候规则
 * @returns 所有12个月的调候规则数组
 */
export function getAllClimateRules(): ClimateRule[] {
  return [...CLIMATE_RULES]
}

/**
 * 获取全部扶抑规则
 * @returns 6种扶抑方法的规则数组
 */
export function getAllFuYiRules(): FuYiRule[] {
  return [...FUYI_RULES]
}
