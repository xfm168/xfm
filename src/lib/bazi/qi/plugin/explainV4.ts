/**
 * ExplainV4 — P4.6 四种模式解释引擎（含大师批命版）
 *
 * 古籍依据：
 *   《子平真诠》："论命之法，先察旺衰，次定格局，再论用神，而后推运。"
 *   《滴天髓》："顺数逆推，皆有章法。"
 *
 * 核心功能：
 *   在 Explain V3 基础上升级，支持四种输出模式，特别是"大师批命版"。
 *   四种模式：白话版(vernacular) / 专业版(professional) / 古籍版(classical) / 大师批命版(master)
 *
 * 特性：
 *   - 纯 Plugin，不修改 Kernel
 *   - 大师批命版：模拟真人命理师批命，禁止AI常用词
 *   - 100+条大师批命短语模板，通过 pick/pickN 随机组合
 *   - 所有字符串使用单引号 + 字符串连接，禁止反引号模板字符串
 *   - 所有注释使用中文
 */

import type { FiveElement } from '../../types'
import { STEM_ELEMENT, GENERATE, OVERCOME } from '../../../core'

// ─── 类型定义 ───

/** 四种输出模式 */
export type ExplainMode = 'vernacular' | 'professional' | 'classical' | 'master'

/** 单模式输出结果 */
export interface ExplainV4Result {
  /** 生成时间（ISO 8601） */
  generatedAt: string
  /** 使用的模式 */
  mode: ExplainMode
  /** 各章节内容 */
  sections: Array<{
    title: string
    content: string
    order: number
  }>
  /** 总评摘要 */
  summary: string
  /** 引用的古籍条目 */
  classicalRefs: string[]
  /** 总字数 */
  wordCount: number
  /** 语气风格 */
  tone: string  // 'natural' | 'formal' | 'classical' | 'masterful'
}

/** 全模式对比结果 */
export interface ExplainV4FullResult {
  /** 生成时间 */
  generatedAt: string
  /** 四种模式的完整结果 */
  modes: Record<ExplainMode, ExplainV4Result>
  /** 推荐模式 */
  recommendedMode: ExplainMode
  /** 核心古籍引用 */
  classicalRef: string
}

// ─── 五行关系常量（ELEMENT_MAP / GENERATE / OVERCOME 已迁移至 @/lib/core，通过 import 引入） ───

const ELEMENT_SEASON: Record<FiveElement, string> = {
  '木': '春', '火': '夏', '土': '长夏/四季', '金': '秋', '水': '冬',
}

const SHI_SHEN_NAMES: Record<string, string> = {
  '比肩': '比劫', '劫财': '比劫', '食神': '食伤', '伤官': '食伤',
  '正财': '财星', '偏财': '财星', '正官': '官杀', '七杀': '官杀',
  '正印': '印星', '偏印': '印星',
}

// ─── 默认古籍引用库 ───

const DEFAULT_CLASSICAL_REFS: Record<string, string[]> = {
  geJu: [
    '《子平真诠》论格局："成格必有真机，破格必有实据。格之成败，关乎一生穷通。"',
    '《子平真诠》："八字用神，专求月令，以日干配月令地支，而生克不同，格局分焉。"',
    '《渊海子平》："格局之名，古人立言之体也。"',
    '《子平真诠》沈孝瞻："格局者，八字之体段也。有格有局，方成完璧。"',
  ],
  wangShuai: [
    '《滴天髓》任铁樵注："旺者宜抑，衰者宜扶。扶抑得中，命局平和。"',
    '《滴天髓》："得令者旺，得地者强，得势者壮。三者皆得，其旺不可挡也。"',
    '《三命通会》："身旺则能任财官，身弱则财官反为累己之物。"',
    '《滴天髓》："阳干为刚，阴干为柔。刚者宜折，柔者宜扶。"',
  ],
  tiaoHou: [
    '《穷通宝鉴》："寒甚用暖，暖甚用寒，方为中和之美。"',
    '《滴天髓》："寒暖燥湿，四时之气。调候为要，不调则偏。"',
    '《穷通宝鉴》徐乐吾注："调候者，调和气候之谓也。命局寒暖燥湿，皆需调候。"',
  ],
  bingYao: [
    '《滴天髓》："有病方为贵，无伤不是奇。命局有病得药救之，即为贵格。"',
    '《神峰通考》："病重药轻不济，药重病轻反伤。"',
    '《滴天髓》："病之深者，药须猛；病之浅者，药宜缓。"',
    '《神峰通考》张楠："药不在多，在精；方不在大，在对。"',
  ],
  tongGuan: [
    '《滴天髓》："通关者，两行相战，以中间通关之物解之。"',
    '《滴天髓》："通关有情，格局自高。通关无情，命局多碍。"',
  ],
  yongShen: [
    '《滴天髓》："旺者宜抑，衰者宜扶。扶抑得中，命局平和。"',
    '《子平真诠》："用神者，命局之枢纽，一身之主宰。"',
    '《穷通宝鉴》："用神得力，则一生亨通；用神失力，则一生蹇滞。"',
    '《滴天髓》："用神不可损伤，喜神不可远离。"',
  ],
  masterPipi: [
    '《子平真诠》："论命之法，先察旺衰，次定格局，再论用神，而后推运。"',
    '《滴天髓》："顺数逆推，皆有章法。知命者不以成败论英雄。"',
    '《三命通会》万民英："命之理微，非聪明睿智不能察也。"',
  ],
}

// ─── 大师批命短语库（100+条） ───

/** 开篇短语 */
const MASTER_OPENERS: string[] = [
  '此造以', '观此命局，', '此命', '本造日主',
  '四柱排定，', '八字既成，', '细观此造，',
  '此盘以', '论命先观格局，',
  '日主', '细排四柱，',
  '此命', '断曰：',
  '观四柱配合，', '审此命局，',
  '按此命造，',
]

/** 体用结构短语 */
const MASTER_TI_YONG: string[] = [
  '为体，', '为用。', '为体，', '为用。取',
  '立命之本在于', '行运之枢在', '以',
  '为宗。', '立格。', '为纲领。',
  '为根基，', '为出路。', '以',
  '主事，', '辅之。', '为体，以',
  '为用神。', '取', '为用，',
  '为相。', '以', '为经，',
  '为纬。', '以', '为体用。',
]

/** 财星判断短语 */
const MASTER_WEALTH: string[] = [
  '财星有根，', '财星透干，', '财藏库中，',
  '财多身弱，须借比劫帮身。', '身旺财旺，富贵可期。',
  '财星得位，', '财气通门户，', '财星有源，',
  '财库冲开，', '偏财入命，', '正财为主，',
  '财星被劫，须防水破。', '财官双美，',
  '财多党杀，', '身财两停，',
  '财星不显，暗藏入库。', '正财坐印，衣食丰足。',
  '财入库墓，待冲方发。', '财逢食伤生助，源源不断。',
]

/** 官星判断短语 */
const MASTER_OFFICIAL: string[] = [
  '官星可扶，', '官星有力，', '官杀混杂，',
  '官星清粹，', '官印相生，', '杀印相生，',
  '七杀有制，', '官星透干，', '官星藏支，',
  '杀重身轻，须印化之。', '官星太旺，宜食伤制之。',
  '正官坐禄，', '七杀得制化，',
  '官杀得地，', '官星得位，',
  '官星不显，暗藏于支。', '正官逢印，权柄在握。',
  '官星太弱，不喜官运。', '官逢伤官，须印星护之。',
]

/** 人生阶段短语 */
const MASTER_LIFE_STAGE: string[] = [
  '少年平顺，', '少时平平，', '初年平平，',
  '少年得志，', '少年辛苦，', '少年衣食丰足，',
  '青年发奋，', '青年渐显，', '青年有志难伸，',
  '中年发达，', '中运通达，', '中年渐佳，',
  '中年转折，', '中年有成，', '中年前半平平，后半渐入佳境。',
  '晚年安稳，', '晚景康宁，', '晚年优游，',
  '晚福绵长，', '晚景无忧，', '晚年有靠，',
  '一生平顺，', '一生劳碌，', '起伏有致，',
  '先苦后甜，', '先难后易，', '早年辛苦晚来荣。',
  '少壮不努力，老大伤悲。此命不在此列。',
  '运至中年方发力，不可操之过急。',
  '初年虽晦，终有出头之日。',
]

/** 性格判断短语 */
const MASTER_PERSONALITY: string[] = [
  '为人刚毅果断。', '性格沉稳内敛。', '为人聪慧灵敏。',
  '秉性温良，', '性格刚直，', '心思细腻，',
  '处事有方，', '为人敦厚，', '性急多动，',
  '行事谨慎，', '胸怀大志，', '为人忠厚，',
  '性格直爽，', '心性平和，', '禀赋聪颖，',
  '为人多谋少断，', '处事果断，', '性急好动，',
  '为人重情重义，', '心思缜密，',
]

/** 五行旺衰判断短语 */
const MASTER_STRENGTH: string[] = [
  '得令得势，日主强健。', '身旺之命，能担财官。',
  '身弱之命，须印比帮身。', '日主中和，进退有度。',
  '身旺无依，宜泄宜克。', '身强有泄，格局流通。',
  '日主太旺，有亢龙之悔。', '身弱但有根，非死绝之命。',
  '身旺泄秀，才华出众。', '身弱印护，贵在逢印运。',
  '身旺财官双美，一生亨泰。', '身弱食伤旺，巧艺安身。',
  '得令不逢生，旺而不烈。', '失令得地，弱而有根。',
  '身中和偏旺，宜泄不宜扶。', '身中和偏弱，宜扶不宜泄。',
]

/** 格局评价短语 */
const MASTER_PATTERN: string[] = [
  '格局清粹，', '格局成矣，', '格局有破，然破而不败。',
  '格局混浊，', '格局高远，', '格局清纯有力，',
  '格局虽破，但有救应。', '格局不入正格，取外格论之。',
  '成格成局，', '格局平常，', '格局低弱，',
  '此乃贵格。', '格局中等偏上，', '格局有成。',
  '格清局正，', '格杂局乱，',
  '格局高而用神无力，美中不足。', '格局虽低而运助之，亦有可为。',
]

/** 流年运程短语 */
const MASTER_FORTUNE: string[] = [
  '逢', '年有变。', '此运大利。', '此运平平。',
  '此运有碍。', '此运转运。', '此运平平，宜守不宜攻。',
  '行', '运，', '运至',
  '方显。', '得此运相助，', '此运宜进取。',
  '逢印运大利，', '逢财运须防破财。', '逢官运升迁有望。',
  '大运走势，', '流年吉凶参半。',
  '此步运程，', '交入此运，',
  '运到', '时方见分晓。',
]

/** 结尾短语 */
const MASTER_CLOSINGS: string[] = [
  '宜顺势而为，不可逆天行事。',
  '时来运转，自有定数。',
  '命虽如此，运可改之。行善积德，自有福报。',
  '此乃天命，顺之则吉，逆之则凶。',
  '总而言之，此命', '足可安身立命。',
  '命带贵气，切勿自弃。',
  '惜福修德，自有天佑。',
  '一生之运，起伏有常，知命而不认命，方能通达。',
  '知进退，明得失，此命可保平安。',
  '富贵在天，努力在人。',
]

/** 健康判断短语 */
const MASTER_HEALTH: string[] = [
  '五行和合，身强体健。', '须防', '行之疾。',
  '水火不济，宜养心肾。', '木受金克，宜养肝胆。',
  '土虚木旺，宜健脾胃。', '火炎土燥，宜滋阴润燥。',
  '金水相生，肺肾安康。', '五行流通，百病不侵。',
  '命带病符，须留心调理。', '中年后须注意保养。',
  '体质偏', '，宜', '补之。',
  '先天不足，后天可补。',
]

/** 婚姻感情短语 */
const MASTER_MARRIAGE: string[] = [
  '夫妻宫稳，婚姻平顺。', '日支逢冲，感情多波折。',
  '财星为妻，妻宫有气。', '官星为夫，夫星得位。',
  '婚姻迟来为美。', '早婚不利。', '晚婚方安。',
  '配偶贤良，', '夫妻宫有合，', '日支喜用相合。',
  '桃花带劫，须防感情纠纷。', '男女宫位得宜，',
  '姻缘前定，不可强求。',
  '日支坐财，妻多贤惠。', '日支坐官，夫有担当。',
  '日支相合，婚姻和谐。', '配偶宫逢空，感情多有变数。',
]

/** 事业学业短语 */
const MASTER_CAREER: string[] = [
  '食伤泄秀，才思敏捷。', '印星护身，学业有成。',
  '官印相生，仕途通达。', '财官双全，事业有成。',
  '七杀有制，武职相宜。', '食神制杀，以智胜力。',
  '伤官配印，文武兼备。', '比劫帮身，合伙有利。',
  '身弱财多，不宜经商。', '身旺走食伤运，名利双收。',
  '适宜', '行发展。', '宜从事',
  '之业。', '仕途有望，但须耐心等待时机。',
  '印旺身强，宜文职。', '食伤生财，宜商贾。',
  '官杀混杂，宜武不宜文。', '身弱走印运，学业可成。',
]

/** AI禁用词列表（大师批命版禁止使用） */
const AI_BANNED_WORDS: string[] = [
  '根据分析', '综合来看', '综上所述', '建议', '建议您',
  '需要注意的是', '总的来说', '整体来看', '从以上分析可以看出',
  '由此可见', '可以看出', '需要注意的是', '需要提醒的是',
  '值得注意', '值得警惕', '务必注意', '请务必',
  '不可忽视', '不能忽略', '应该关注', '值得重视',
  '相比之下', '换句话说', '也就是说', '简而言之',
  '首先', '其次', '最后', '另外',
  '值得注意的是', '需要说明的是', '这一点很重要',
  '在此基础上', '从这个角度看', '从某种意义上说',
  '比较平稳', '比较顺利', '较为安定', '较为稳定',
  '力量较强', '力量较弱', '影响力较大',
]

// ─── 随机选择器工具 ───

/** 从数组中随机选一个 */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 从数组中随机选N个 */
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(function () { return Math.random() - 0.5 })
  return shuffled.slice(0, Math.min(n, arr.length))
}

/** 过滤AI禁用词 */
function filterAIBannedWords(text: string): string {
  let result = text
  for (var i = 0; i < AI_BANNED_WORDS.length; i++) {
    var word = AI_BANNED_WORDS[i]
    result = result.split(word).join('')
  }
  return result
}

/** 获取当前时间 ISO 8601 字符串 */
function getNow(): string {
  return new Date().toISOString()
}

/** 计算中文字数（不含标点） */
function countWords(text: string): number {
  return text.replace(/[^\u4e00-\u9fff]/g, '').length
}

/** 获取五行方向 */
function getDirection(element: FiveElement): string {
  var map: Record<FiveElement, string> = {
    '木': '东方', '火': '南方', '土': '中央/本地',
    '金': '西方', '水': '北方',
  }
  return map[element] || '四方皆可'
}

// ══════════════════════════════════════════════════════════════════════
//  ExplainV4Engine 类
// ══════════════════════════════════════════════════════════════════════

/**
 * ExplainV4 解释引擎
 *
 * 核心功能：
 *   - generate()       生成指定模式的解释
 *   - generateAll()    生成全模式对比
 *   - getRecommendedMode()  获取推荐模式
 */
export class ExplainV4Engine {

  /**
   * 生成指定模式的解释
   * @param chartData 命盘数据（包含 dayGan, monthZhi, fourPillars, geJuName, strength, useGod, pattern 等）
   * @param mode 输出模式：vernacular / professional / classical / master
   * @returns 单模式解释结果
   */
  generate(chartData: Record<string, unknown>, mode: ExplainMode): ExplainV4Result {
    // 提取命盘基础数据
    var dayGan = (chartData.dayGan as string) || ''
    var monthZhi = (chartData.monthZhi as string) || ''
    var fourPillars = (chartData.fourPillars as string) || ''
    var geJuName = (chartData.geJuName as string) || ''
    var dayElement = STEM_ELEMENT[dayGan as keyof typeof STEM_ELEMENT] || ''

    // 提取分析结果
    var strength = chartData.strength as Record<string, any> || {}
    var useGod = chartData.useGod as Record<string, any> || {}
    var pattern = chartData.pattern as Record<string, any> || {}
    var climate = chartData.climate as Record<string, any> || {}
    var disease = chartData.disease as Record<string, any> || {}
    var tongGuan = chartData.tongGuan as Record<string, any> || {}

    // 获取古籍引用
    var classicalRefs = this.collectClassicalRefs(chartData, mode)

    // 根据模式生成对应内容
    var sections: Array<{ title: string; content: string; order: number }> = []
    var tone = 'natural'
    var summary = ''

    if (mode === 'vernacular') {
      var result = this.buildVernacular(dayGan, monthZhi, fourPillars, geJuName, dayElement, strength, useGod, pattern, climate, disease, tongGuan)
      sections = result.sections
      summary = result.summary
      tone = 'natural'
    } else if (mode === 'professional') {
      var result = this.buildProfessional(dayGan, monthZhi, fourPillars, geJuName, dayElement, strength, useGod, pattern, climate, disease, tongGuan)
      sections = result.sections
      summary = result.summary
      tone = 'formal'
    } else if (mode === 'classical') {
      var result = this.buildClassical(dayGan, monthZhi, fourPillars, geJuName, dayElement, strength, useGod, pattern, climate, disease, tongGuan)
      sections = result.sections
      summary = result.summary
      tone = 'classical'
    } else if (mode === 'master') {
      var result = this.buildMaster(dayGan, monthZhi, fourPillars, geJuName, dayElement, strength, useGod, pattern, climate, disease, tongGuan)
      sections = result.sections
      summary = result.summary
      tone = 'masterful'
    }

    // 统计总字数
    var allText = sections.map(function (s) { return s.title + s.content }).join('')
    var wordCount = countWords(allText)

    return {
      generatedAt: getNow(),
      mode: mode,
      sections: sections,
      summary: summary,
      classicalRefs: classicalRefs,
      wordCount: wordCount,
      tone: tone,
    }
  }

  /**
   * 生成全模式对比
   * @param chartData 命盘数据
   * @returns 四种模式的完整结果
   */
  generateAll(chartData: Record<string, unknown>): ExplainV4FullResult {
    var modes: Record<ExplainMode, ExplainV4Result> = {
      vernacular: this.generate(chartData, 'vernacular'),
      professional: this.generate(chartData, 'professional'),
      classical: this.generate(chartData, 'classical'),
      master: this.generate(chartData, 'master'),
    }

    // 核心古籍引用
    var classicalRef = pick(DEFAULT_CLASSICAL_REFS.masterPipi)

    return {
      generatedAt: getNow(),
      modes: modes,
      recommendedMode: 'vernacular',
      classicalRef: classicalRef,
    }
  }

  /**
   * 获取推荐模式（根据用户水平）
   * @param userLevel 用户水平：beginner / intermediate / expert / master
   * @returns 推荐的模式
   */
  getRecommendedMode(userLevel?: 'beginner' | 'intermediate' | 'expert' | 'master'): ExplainMode {
    var levelMap: Record<string, ExplainMode> = {
      'beginner': 'vernacular',
      'intermediate': 'professional',
      'expert': 'classical',
      'master': 'master',
    }
    return levelMap[userLevel || 'beginner'] || 'vernacular'
  }

  // ─── 收集古籍引用 ───

  private collectClassicalRefs(chartData: Record<string, unknown>, mode: ExplainMode): string[] {
    var refs: string[] = []
    var keys = Object.keys(DEFAULT_CLASSICAL_REFS)
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      var arr = DEFAULT_CLASSICAL_REFS[key]
      refs.push(pick(arr))
    }

    // 大师批命版额外添加批命类引用
    if (mode === 'master') {
      for (var i = 0; i < DEFAULT_CLASSICAL_REFS.masterPipi.length; i++) {
        refs.push(DEFAULT_CLASSICAL_REFS.masterPipi[i])
      }
    }

    return refs
  }

  // ══════════════════════════════════════════════════════════════════════
  //  模式一：白话版 (vernacular) — 初学者
  // ══════════════════════════════════════════════════════════════════════

  private buildVernacular(
    dayGan: string, monthZhi: string, fourPillars: string, geJuName: string,
    dayElement: FiveElement, strength: Record<string, any>, useGod: Record<string, any>,
    pattern: Record<string, any>, climate: Record<string, any>,
    disease: Record<string, any>, tongGuan: Record<string, any>
  ): { sections: Array<{ title: string; content: string; order: number }>; summary: string } {
    var sections: Array<{ title: string; content: string; order: number }> = []

    // ─── 第一章：你的先天格局 ───
    var geJuOpeners = [
      '你的日主是' + dayGan + '（' + dayElement + '），生在' + monthZhi + '月，格局叫做"' + geJuName + '"。',
      '从八字来看，' + dayGan + '属于' + dayElement + '，出生在' + monthZhi + '月，格局是"' + geJuName + '"。',
    ]
    var starLevel = pattern.starLevel || 3
    var starDesc: Record<number, string> = {
      5: '这是非常难得的好格局，先天条件优越，百里挑一。',
      4: '上等格局，先天条件很好，起点比大多数人高。',
      3: '中等格局，有优有劣，整体还不错。',
      2: '格局比较普通，有一些短板，但并非没有可取之处。',
      1: '格局有较大缺陷，但"有病方为贵"，找到破解之道也能翻盘。',
    }
    var geJuContent = pick(geJuOpeners) + '\n' + (starDesc[starLevel] || starDesc[3])
    if (pattern.strengths && pattern.strengths.length > 0) {
      var strengthNames = pickN(pattern.strengths, 3).join('、')
      geJuContent = geJuContent + '\n你的先天优势：' + strengthNames + '。'
    }
    sections.push({ title: '一、你的先天格局', content: geJuContent, order: 1 })

    // ─── 第二章：你的能量状态 ───
    var strengthLevel = strength.strengthLevelCN || '中和'
    var wsDesc: Record<string, string> = {
      '极弱': '你（' + dayGan + '）的能量非常弱，就像一棵幼苗，需要阳光和水分的滋养。',
      '偏弱': '你（' + dayGan + '）的能量偏弱，就像体力不够充沛的人，需要外界帮助。',
      '中和': '你（' + dayGan + '）的能量处于平衡状态，不偏强也不偏弱，进退有度。',
      '偏强': '你（' + dayGan + '）的能量偏强，精力过剩，需要找到合适的施展渠道。',
      '极强': '你（' + dayGan + '）的能量非常强，力量充足，但过强则需要引导释放。',
    }
    var wsContent = wsDesc[strengthLevel] || wsDesc['中和']
    if (strength.deLing) wsContent = wsContent + '\n你出生的月份对你有利（得令），占了天时。'
    if (strength.deDi) wsContent = wsContent + '\n你的八字中有坚实的根基（得地），像有房有地有家底。'
    if (strength.deShi) wsContent = wsContent + '\n你身边有不少帮手（得势），有人缘有资源。'
    sections.push({ title: '二、你的能量状态', content: wsContent, order: 2 })

    // ─── 第三章：你的环境舒适度 ───
    var climateType = climate.climateType || '中和'
    var climateDesc: Record<string, string> = {
      '寒': '你的命局偏寒，像冬天出生的人，怕冷，需要温暖环境和阳光。',
      '暖': '命局偏暖，像春天温暖舒适，但注意别太燥热。',
      '燥': '命局偏燥，像夏天烈日当空，需要水分滋润降温。',
      '湿': '命局偏湿，像梅雨季节，有些阴郁，需要阳光驱散潮湿。',
      '中和': '命局寒暖适中，不冷不热，先天环境很均衡。',
    }
    var thContent = climateDesc[climateType] || climateDesc['中和']
    sections.push({ title: '三、你的环境舒适度', content: thContent, order: 3 })

    // ─── 第四章：什么对你最有利 ───
    var yongShen = (useGod.yongShen as FiveElement) || dayElement
    var xiShen = (useGod.xiShen as string) || ''
    var jiShen = (useGod.jiShen as string) || ''
    var yongDesc: Record<FiveElement, string> = {
      '木': '"' + '木' + '"是你的用神。木代表生长，你需要像树木一样不断成长。',
      '火': '"' + '火' + '"是你的用神。火代表热情和光明，保持积极向上。',
      '土': '"' + '土' + '"是你的用神。土代表稳定和厚实，踏踏实实积累。',
      '金': '"' + '金' + '"是你的用神。金代表果断和规则，做事干脆利落。',
      '水': '"' + '水' + '"是你的用神。水代表智慧和变通，灵活应变。',
    }
    var ysContent = yongDesc[yongShen] || yongShen + '是你的用神。'
    if (xiShen) ysContent = ysContent + '\n对你有利的还有' + xiShen + '（喜神）。'
    if (jiShen) ysContent = ysContent + '\n而' + jiShen + '（忌神）对你不利，尽量少接触。'
    sections.push({ title: '四、什么对你最有利', content: ysContent, order: 4 })

    // ─── 第五章：人生建议 ───
    var adviceContent = ''
    var strengthScore = strength.strengthScore || 50
    if (strengthScore >= 65) {
      adviceContent = '你能量充足，适合开创性工作，创业或带领团队是你的强项。'
    } else if (strengthScore < 45) {
      adviceContent = '你能量偏弱，适合在稳定环境中积累，先打好基础再逐步发展。'
    } else {
      adviceContent = '你能量均衡，事业发展路线灵活，可以综合发展、多条腿走路。'
    }
    sections.push({ title: '五、人生方向参考', content: adviceContent, order: 5 })

    // 生成总评
    var summary = pick([
      dayGan + dayElement + '日主，生于' + monthZhi + '月，' + geJuName + '格局。用神' + yongShen + '，顺势而为可保平安。',
      '总体来说，你的命盘' + (starLevel >= 4 ? '先天优越' : starLevel >= 3 ? '中等偏上' : '有待后天补足') + '。发挥优势，补足短板，未来可期。',
    ])

    return { sections: sections, summary: summary }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  模式二：专业版 (professional) — 命理从业者
  // ══════════════════════════════════════════════════════════════════════

  private buildProfessional(
    dayGan: string, monthZhi: string, fourPillars: string, geJuName: string,
    dayElement: FiveElement, strength: Record<string, any>, useGod: Record<string, any>,
    pattern: Record<string, any>, climate: Record<string, any>,
    disease: Record<string, any>, tongGuan: Record<string, any>
  ): { sections: Array<{ title: string; content: string; order: number }>; summary: string } {
    var sections: Array<{ title: string; content: string; order: number }> = []

    // ─── 1. 格局分析 ───
    var starLevel = pattern.starLevel || 3
    var geJuOpeners = [
      '日主' + dayGan + '（' + dayElement + '）生于' + monthZhi + '月，取' + geJuName + '论命。',
      '本造以' + dayGan + '日主立极，月令' + monthZhi + '，' + geJuName + '为宗。',
    ]
    var parts: string[] = [pick(geJuOpeners)]
    parts.push('格局评级：' + '\u2605'.repeat(starLevel) + '（' + (pattern.totalScore || 60) + '分）。')
    if (pattern.isZhenGe) parts.push('经辨真正格成格局，格局清纯有力。')
    if (pattern.isPoGe) parts.push('然格局有破，破格原因：' + (pattern.poGeReasons || []).join('；') + '。')
    if (pattern.strengths && pattern.strengths.length > 0) {
      parts.push('格局优势在于' + pickN(pattern.strengths, 3).join('、') + '。')
    }
    sections.push({ title: '一、格局分析', content: parts.join('\n'), order: 1 })

    // ─── 2. 日主旺衰 ───
    var strengthLevel = strength.strengthLevelCN || '中和'
    var wsParts: string[] = []
    wsParts.push('日主' + dayGan + '（' + dayElement + '），旺衰综合评定：' + strengthLevel + '（' + (strength.strengthScore || 50) + '/100分）。')
    var deList: string[] = []
    if (strength.deLing) deList.push('得令')
    if (strength.deDi) deList.push('得地')
    if (strength.deShi) deList.push('得势')
    wsParts.push('三才条件：' + (deList.length > 0 ? deList.join('、') : '三才皆不得，根基浅薄') + '。')
    if (strength.tongGen) wsParts.push('日主通根有力。')
    if (strength.touGan) wsParts.push('日主透干显达。')
    sections.push({ title: '二、日主旺衰', content: wsParts.join('\n'), order: 2 })

    // ─── 3. 调候分析 ───
    var climateType = climate.climateType || '中和'
    var thParts: string[] = []
    thParts.push('日主' + dayGan + '（' + dayElement + '）生于' + monthZhi + '月，命局气候' + climateType + '（评分' + (climate.climateScore || 50) + '/100）。')
    if (climate.needsAdjustment) {
      thParts.push('命局需要调候。')
      var needs = climate.needs || []
      for (var i = 0; i < needs.length; i++) {
        thParts.push('调候用神：' + needs[i].element + '（' + (needs[i].preferredStems || []).join('、') + '），' + needs[i].description + '。')
      }
    } else {
      thParts.push('命局寒暖适中，无需调候，为中和之美。')
    }
    sections.push({ title: '三、调候分析', content: thParts.join('\n'), order: 3 })

    // ─── 4. 病药分析 ───
    var byParts: string[] = []
    if (disease.hasDisease) {
      byParts.push('命局有病，共' + (disease.diseases || []).length + '项病症。')
      var diseases = disease.diseases || []
      for (var i = 0; i < diseases.length; i++) {
        byParts.push('  【' + diseases[i].name + '】' + diseases[i].cause + '（严重程度' + '\u25a0'.repeat(diseases[i].severity) + '\u25a1'.repeat(5 - diseases[i].severity) + '）')
      }
      var medicines = disease.medicines || []
      if (medicines.length > 0) {
        byParts.push('对应药方：')
        for (var i = 0; i < medicines.length; i++) {
          byParts.push('  【' + medicines[i].name + '】' + medicines[i].treatment + '。出处：' + medicines[i].source)
        }
      }
    } else {
      byParts.push('命局五行相对平衡，无大病可论。')
    }
    sections.push({ title: '四、病药分析', content: byParts.join('\n'), order: 4 })

    // ─── 5. 喜用神综合 ───
    var yongShen = (useGod.yongShen as FiveElement) || dayElement
    var ysParts: string[] = []
    ysParts.push('日主' + dayGan + '（' + dayElement + '）' + strengthLevel + '，综合喜用神如下：')
    ysParts.push('  用神：' + yongShen + '（得分' + (useGod.yongScore || 0) + '）')
    ysParts.push('  喜神：' + (useGod.xiShen || '未定'))
    ysParts.push('  忌神：' + (useGod.jiShen || '未定'))
    ysParts.push('  仇神：' + (useGod.chouShen || '未定'))
    ysParts.push('  闲神：' + (useGod.xianShen || '未定'))
    sections.push({ title: '五、喜用神综合', content: ysParts.join('\n'), order: 5 })

    // ─── 6. 通关分析 ───
    var tgParts: string[] = []
    if (tongGuan.hasBattle) {
      tgParts.push('命局存在五行交战，共' + (tongGuan.battles || []).length + '处。')
      if (tongGuan.hasTongGuan && tongGuan.tongGuanElement) {
        tgParts.push('通关成功：以' + tongGuan.tongGuanElement + '通关。' + tongGuan.tongGuanDescription + '。')
      } else {
        tgParts.push('通关不畅：' + (tongGuan.tongGuanDescription || '五行交战而通关无力。') )
      }
    } else {
      tgParts.push('命局五行和合，无交战之象。')
    }
    sections.push({ title: '六、通关分析', content: tgParts.join('\n'), order: 6 })

    // 生成总评
    var summary = pick([
      dayGan + '日主生于' + monthZhi + '月，' + geJuName + '格局，日主' + strengthLevel + '。用神' + yongShen + '，格局' + (starLevel >= 4 ? '上等' : starLevel >= 3 ? '中等' : '偏弱') + '。',
      '此造格局' + (starLevel >= 4 ? '清纯有力' : starLevel >= 3 ? '有优有劣' : '有缺陷需化解') + '，用神' + yongShen + '为命局枢纽。善用喜用神，趋吉避凶。',
    ])

    return { sections: sections, summary: summary }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  模式三：古籍版 (classical) — 古典风格
  // ══════════════════════════════════════════════════════════════════════

  private buildClassical(
    dayGan: string, monthZhi: string, fourPillars: string, geJuName: string,
    dayElement: FiveElement, strength: Record<string, any>, useGod: Record<string, any>,
    pattern: Record<string, any>, climate: Record<string, any>,
    disease: Record<string, any>, tongGuan: Record<string, any>
  ): { sections: Array<{ title: string; content: string; order: number }>; summary: string } {
    var sections: Array<{ title: string; content: string; order: number }> = []

    // ─── 一、总论 ───
    var zongLunOpeners = [
      '观此造，日主' + dayGan + '，' + dayElement + '之气，生于' + monthZhi + '月令。',
      '此造排定，四柱"' + fourPillars + '"，日主' + dayGan + '立命于' + monthZhi + '。',
      '细审此盘，' + dayGan + '日主' + dayElement + '气，生逢' + monthZhi + '月。',
    ]
    var zongLunParts: string[] = [pick(zongLunOpeners)]
    zongLunParts.push(pick(DEFAULT_CLASSICAL_REFS.masterPipi))
    zongLunParts.push('格局取' + geJuName + '，')
    var starLevel = pattern.starLevel || 3
    if (starLevel >= 4) {
      zongLunParts.push('格局清粹，先天根基深厚。')
    } else if (starLevel >= 3) {
      zongLunParts.push('格局中等，有成有破。')
    } else {
      zongLunParts.push('格局有缺，赖后天运程弥补。')
    }
    sections.push({ title: '总论', content: zongLunParts.join(''), order: 1 })

    // ─── 二、论旺衰 ───
    var strengthLevel = strength.strengthLevelCN || '中和'
    var wsParts: string[] = []
    wsParts.push('论旺衰，')
    var strengthMap: Record<string, string> = {
      '极强': '日主' + dayGan + '得令得势，旺不可挡，犹如参天之木，势不可遏。',
      '偏强': '日主' + dayGan + '偏旺，根基深厚，有力担财官。',
      '中和': '日主' + dayGan + '中和为美，不偏不倚，行运可进可退。',
      '偏弱': '日主' + dayGan + '偏弱，犹如嫩苗，需印比扶助方能成器。',
      '极弱': '日主' + dayGan + '极弱，须全赖外力帮扶，方不至倾覆。',
    }
    wsParts.push(strengthMap[strengthLevel] || strengthMap['中和'])
    wsParts.push(pick(DEFAULT_CLASSICAL_REFS.wangShuai))
    sections.push({ title: '论旺衰', content: wsParts.join('\n'), order: 2 })

    // ─── 三、论格局 ───
    var gjParts: string[] = []
    gjParts.push('论格局，')
    gjParts.push('《子平真诠》云："八字用神，专求月令，以日干配月令地支，而生克不同，格局分焉。"')
    gjParts.push('此命月令' + monthZhi + '，取' + geJuName + '论之。')
    if (pattern.isZhenGe) {
      gjParts.push('格局真而成，清纯有力。')
    }
    if (pattern.isPoGe) {
      gjParts.push('格局虽有破，然破中有救。')
    }
    sections.push({ title: '论格局', content: gjParts.join('\n'), order: 3 })

    // ─── 四、论用神 ───
    var yongShen = (useGod.yongShen as FiveElement) || dayElement
    var ysParts: string[] = []
    ysParts.push('论用神，')
    ysParts.push('《滴天髓》云："用神者，命局之枢纽，一身之主宰。"')
    ysParts.push('此命以' + yongShen + '为用神。')
    ysParts.push('用神' + yongShen + '得力，')
    if (useGod.xiShen) ysParts.push('喜' + useGod.xiShen + '辅之，')
    if (useGod.jiShen) ysParts.push('忌' + useGod.jiShen + '当避，')
    ysParts.push('方为全功。')
    sections.push({ title: '论用神', content: ysParts.join(''), order: 4 })

    // ─── 五、论调候 ───
    var climateType = climate.climateType || '中和'
    var thParts: string[] = []
    thParts.push('论调候，')
    thParts.push(pick(DEFAULT_CLASSICAL_REFS.tiaoHou))
    if (climate.needsAdjustment) {
      thParts.push('此命生于' + monthZhi + '月，命局偏' + climateType + '，')
      var needs = climate.needs || []
      for (var i = 0; i < needs.length; i++) {
        thParts.push('须以' + needs[i].element + '调之。')
      }
    } else {
      thParts.push('此命寒暖适中，不假调候，自然和合。')
    }
    sections.push({ title: '论调候', content: thParts.join(''), order: 5 })

    // ─── 六、论病药 ───
    var byParts: string[] = []
    byParts.push('论病药，')
    byParts.push(pick(DEFAULT_CLASSICAL_REFS.bingYao))
    if (disease.hasDisease) {
      var diseases = disease.diseases || []
      for (var i = 0; i < diseases.length; i++) {
        byParts.push('病在' + diseases[i].name + '，' + diseases[i].cause + '。')
      }
      var medicines = disease.medicines || []
      for (var i = 0; i < medicines.length; i++) {
        byParts.push('以' + medicines[i].name + '治之，' + medicines[i].treatment + '。')
      }
    } else {
      byParts.push('此命五行流通，无病可论，诚为平顺之造。')
    }
    sections.push({ title: '论病药', content: byParts.join('\n'), order: 6 })

    // ─── 七、论通关 ───
    var tgParts: string[] = []
    tgParts.push('论通关，')
    tgParts.push(pick(DEFAULT_CLASSICAL_REFS.tongGuan))
    if (tongGuan.hasBattle) {
      tgParts.push('此命五行交战，')
      if (tongGuan.hasTongGuan && tongGuan.tongGuanElement) {
        tgParts.push('幸有' + tongGuan.tongGuanElement + '通关有情，化敌为友，格局自高。')
      } else {
        tgParts.push('通关无力，命局多碍，运逢通关方可化解。')
      }
    } else {
      tgParts.push('五行和合，无交战之象，不须通关。')
    }
    sections.push({ title: '论通关', content: tgParts.join(''), order: 7 })

    // 生成总评
    var summary = pick([
      '此' + dayGan + dayElement + '命造，' + geJuName + '格局，日主' + strengthLevel + '。用神' + yongShen + '，依《子平真诠》之理，先察旺衰，次定格局，再论用神，而后推运。',
      '总而言之，此命以' + yongShen + '为用，格局' + (starLevel >= 4 ? '清粹有力' : starLevel >= 3 ? '有成有破' : '有缺需补') + '。《滴天髓》云："顺数逆推，皆有章法。"顺运而行，可保安泰。',
    ])

    return { sections: sections, summary: summary }
  }

  // ══════════════════════════════════════════════════════════════════════
  //  模式四：大师批命版 (master) — 核心亮点
  // ══════════════════════════════════════════════════════════════════════

  private buildMaster(
    dayGan: string, monthZhi: string, fourPillars: string, geJuName: string,
    dayElement: FiveElement, strength: Record<string, any>, useGod: Record<string, any>,
    pattern: Record<string, any>, climate: Record<string, any>,
    disease: Record<string, any>, tongGuan: Record<string, any>
  ): { sections: Array<{ title: string; content: string; order: number }>; summary: string } {
    var sections: Array<{ title: string; content: string; order: number }> = []

    var yongShen = (useGod.yongShen as FiveElement) || dayElement
    var strengthLevel = strength.strengthLevelCN || '中和'
    var strengthScore = strength.strengthScore || 50
    var starLevel = pattern.starLevel || 3
    var climateType = climate.climateType || '中和'

    // ─── 开篇批断 ───
    var opening = pick(MASTER_OPENERS)
    opening = opening + dayGan + '（' + dayElement + '）生于' + monthZhi + '月，'
    opening = opening + pick(MASTER_TI_YONG)
    opening = opening + dayElement + pick(MASTER_TI_YONG)

    // 体用格局判断
    if (starLevel >= 4) {
      opening = opening + pick(MASTER_PATTERN.filter(function (p) {
        return p.indexOf('清') >= 0 || p.indexOf('高') >= 0 || p.indexOf('成') >= 0
      }))
    } else if (starLevel >= 3) {
      opening = opening + pick(MASTER_PATTERN.filter(function (p) {
        return p.indexOf('中等') >= 0 || p.indexOf('有成') >= 0
      }))
    } else {
      opening = opening + pick(MASTER_PATTERN.filter(function (p) {
        return p.indexOf('破') >= 0 || p.indexOf('混') >= 0 || p.indexOf('低') >= 0
      }))
    }

    sections.push({ title: '批断', content: filterAIBannedWords(opening), order: 1 })

    // ─── 日主旺衰批断 ───
    var wsMaster = ''
    if (strengthScore >= 65) {
      wsMaster = pick(MASTER_STRENGTH.filter(function (s) {
        return s.indexOf('旺') >= 0
      }))
    } else if (strengthScore < 45) {
      wsMaster = pick(MASTER_STRENGTH.filter(function (s) {
        return s.indexOf('弱') >= 0
      }))
    } else {
      wsMaster = pick(MASTER_STRENGTH.filter(function (s) {
        return s.indexOf('中和') >= 0
      }))
    }
    sections.push({ title: '旺衰', content: filterAIBannedWords(wsMaster), order: 2 })

    // ─── 财星批断 ───
    var wealthElement = OVERCOME[dayElement]
    var wealthMaster = pick(MASTER_WEALTH)
    sections.push({ title: '财星', content: filterAIBannedWords(wealthMaster), order: 3 })

    // ─── 官星批断 ───
    var officialMaster = pick(MASTER_OFFICIAL)
    sections.push({ title: '官星', content: filterAIBannedWords(officialMaster), order: 4 })

    // ─── 性格批断 ───
    var personalityParts = pickN(MASTER_PERSONALITY, 3).join('')
    sections.push({ title: '性情', content: filterAIBannedWords(personalityParts), order: 5 })

    // ─── 人生阶段批断 ───
    var stageParts = pickN(MASTER_LIFE_STAGE, 4).join('')
    sections.push({ title: '运程', content: filterAIBannedWords(stageParts), order: 6 })

    // ─── 事业批断 ───
    var careerParts = pickN(MASTER_CAREER, 3).join('')
    sections.push({ title: '事业', content: filterAIBannedWords(careerParts), order: 7 })

    // ─── 婚姻批断 ───
    var marriageParts = pickN(MASTER_MARRIAGE, 2).join('')
    sections.push({ title: '婚姻', content: filterAIBannedWords(marriageParts), order: 8 })

    // ─── 健康批断 ───
    var healthParts = ''
    if (climateType !== '中和') {
      healthParts = pick(MASTER_HEALTH.filter(function (h) {
        return h.indexOf('偏') >= 0
      }))
      healthParts = healthParts.split('偏')[0] + '偏' + climateType + '，' + healthParts.split('偏' + climateType + '，')[1]
    } else {
      healthParts = pick(MASTER_HEALTH.filter(function (h) {
        return h.indexOf('和合') >= 0 || h.indexOf('流通') >= 0
      }))
    }
    sections.push({ title: '健康', content: filterAIBannedWords(healthParts), order: 9 })

    // ─── 流年运程批断 ───
    var fortuneParts = pickN(MASTER_FORTUNE, 3).join('') + dayElement
    sections.push({ title: '大运', content: filterAIBannedWords(fortuneParts), order: 10 })

    // ─── 结语 ───
    var closing = pick(MASTER_CLOSINGS)
    sections.push({ title: '结语', content: filterAIBannedWords(closing), order: 11 })

    // 生成总评（大师风格，无AI痕迹）
    var summary = pick(MASTER_OPENERS) + dayGan + '（' + dayElement + '）命造，'
    summary = summary + pick(MASTER_TI_YONG) + yongShen + '为用。'
    summary = summary + pickN(MASTER_LIFE_STAGE, 2).join('')
    summary = summary + pick(MASTER_CLOSINGS)
    summary = filterAIBannedWords(summary)

    return { sections: sections, summary: summary }
  }
}

// ─── 默认实例导出 ───

export const explainV4Engine = new ExplainV4Engine()
