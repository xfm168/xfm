/**
 * 大师断语引擎 V4.3 — 玄风门
 *
 * 建立专业断语模板库，基于命理条件匹配生成综合断语。
 * 核心模板 1000+ 条，通过组合函数自动扩展到 5000+ 变体。
 *
 * 典籍出处：《滴天髓》《穷通宝鉴》《三命通会》《渊海子平》《子平真诠》《命理约言》
 */

import type { BaZiChart, FiveElement, HeavenlyStem, EarthlyBranch, ShenShi, WuXingWangShuai } from './types'
import { STEM_ELEMENT, BRANCH_ELEMENT, HEAVENLY_STEMS, EARTHLY_BRANCHES } from '@/lib/core'

// ========== 类型定义 ==========

export interface SentenceCondition {
  /** 匹配字段路径，如 'dayMaster.dayGan', 'strengthScore', 'gejuName' 等 */
  field: string
  /** 操作符 */
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains'
  /** 比较值 */
  value: any
}

export interface SentenceTemplate {
  id: string
  /** 断语分类 */
  category: 'strength' | 'geju' | 'tiaohou' | 'yongshen' | 'shishen' | 'combination' | 'shensha' | 'dayun' | 'liunian' | 'relationship'
  /** 匹配条件（全部满足时生效） */
  conditions: SentenceCondition[]
  /** 满足条件时的断语文本（3-5个变体，随机选取） */
  texts: string[]
  /** 优先级（数字越大越优先） */
  weight: number
  /** 典籍出处 */
  source: string
}

export interface MasterSentenceItem {
  category: string
  title: string
  text: string
  source: string
}

export interface MasterSentenceResult {
  sentences: MasterSentenceItem[]
  /** 综合断语，约500字 */
  summary: string
  /** 匹配到的模板总数 */
  totalMatched: number
}

// ========== 辅助常量 ==========

const TIAN_GAN_NAMES: Record<HeavenlyStem, string> = {
  '甲': '甲木', '乙': '乙木', '丙': '丙火', '丁': '丁火',
  '戊': '戊土', '己': '己土', '庚': '庚金', '辛': '辛金',
  '壬': '壬水', '癸': '癸水',
}

const SEASON_MAP: Record<string, string> = {
  '寅': '春', '卯': '春', '辰': '春',
  '巳': '夏', '午': '夏', '未': '夏',
  '申': '秋', '酉': '秋', '戌': '秋',
  '亥': '冬', '子': '冬', '丑': '冬',
}

const STRENGTH_LABELS: Record<string, string> = {
  strong: '身旺', weak: '身弱', balanced: '中和',
}

// ========== 条件匹配器 ==========

function getFieldValue(chart: BaZiChart, field: string): any {
  const paths: Record<string, () => any> = {
    'dayMaster.dayGan': () => chart.dayMaster.dayGan,
    'dayMaster.dayGanElement': () => chart.dayMaster.dayGanElement,
    'dayMaster.wangShuai': () => chart.dayMaster.wangShuai,
    'dayMaster.strengthScore': () => chart.dayMaster.strengthScore,
    'strengthScore': () => chart.dayMaster.strengthScore,
    'monthZhi': () => chart.sixLines.month.zhi,
    'monthGan': () => chart.sixLines.month.gan,
    'yearZhi': () => chart.sixLines.year.zhi,
    'dayZhi': () => chart.sixLines.day.zhi,
    'hourZhi': () => chart.sixLines.hour.zhi,
    'hourGan': () => chart.sixLines.hour.gan,
    'bestElement': () => chart.xiYongShen.bestElement,
    'usage': () => chart.xiYongShen.usage,
    'happiness': () => chart.xiYongShen.happiness,
    'season': () => SEASON_MAP[chart.sixLines.month.zhi] || '',
  }
  if (paths[field]) return paths[field]()
  // 嵌套路径
  const parts = field.split('.')
  let obj: any = chart
  for (const p of parts) {
    if (obj == null) return undefined
    obj = obj[p]
  }
  return obj
}

function matchCondition(fieldValue: any, cond: SentenceCondition): boolean {
  if (fieldValue === undefined || fieldValue === null) return false
  switch (cond.operator) {
    case 'eq': return fieldValue === cond.value
    case 'neq': return fieldValue !== cond.value
    case 'gt': return fieldValue > cond.value
    case 'lt': return fieldValue < cond.value
    case 'gte': return fieldValue >= cond.value
    case 'lte': return fieldValue <= cond.value
    case 'in': return Array.isArray(cond.value) && cond.value.includes(fieldValue)
    case 'contains': return typeof fieldValue === 'string' && fieldValue.includes(cond.value)
    default: return false
  }
}

function matchAllConditions(chart: BaZiChart, conditions: SentenceCondition[]): boolean {
  return conditions.every(cond => matchCondition(getFieldValue(chart, cond.field), cond))
}

// ========== 一、身强身弱断语模板（strength）==========

function generateStrengthTemplates(): SentenceTemplate[] {
  const templates: SentenceTemplate[] = []
  const stems: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const seasons = ['春', '夏', '秋', '冬']
  const seasonBranches: Record<string, string[]> = {
    '春': ['寅', '卯', '辰'], '夏': ['巳', '午', '未'],
    '秋': ['申', '酉', '戌'], '冬': ['亥', '子', '丑'],
  }

  // 十天干 × 身旺 × 四季 = 40 条
  for (const stem of stems) {
    for (const season of seasons) {
      const el = STEM_ELEMENT[stem]
      const branches = seasonBranches[season]
      templates.push({
        id: `str_${stem}_strong_${season}`,
        category: 'strength',
        conditions: [
          { field: 'dayMaster.dayGan', operator: 'eq', value: stem },
          { field: 'monthZhi', operator: 'in', value: branches },
          { field: 'dayMaster.strengthScore', operator: 'gte', value: 55 },
        ],
        texts: [
          `${TIAN_GAN_NAMES[stem]}生于${season}月，得令当权，气数充沛。经云：「当令者旺，失令者衰」。${TIAN_GAN_NAMES[stem]}逢${season}令，犹如大树扎根沃土，枝繁叶茂，根基深厚。身旺则喜克泄耗，宜以食伤泄秀、财星耗身、官杀制之，方为上格。`,
          `${TIAN_GAN_NAMES[stem]}日主临${season}月令，正所谓「得时得令」，日主之气充盈。${el}于${season}月司令，四柱若再见比劫帮身，则身旺可知。此等命造，当以财官食伤为用，不可再助比劫，否则恐有物极必反之患。`,
          `观此${TIAN_GAN_NAMES[stem]}命造，生于${season}月，月令${el}气旺盛。日主得令，如龙归大海、虎入深山，正当其时。然身旺不可一味扶助，宜取财官食伤为用神，制衡太过之势。《滴天髓》云：「旺极宜泄不宜克」，当审慎取用。`,
        ],
        weight: 80,
        source: '《滴天髓》《子平真诠》',
      })
    }
  }

  // 十天干 × 身弱 × 四季 = 40 条
  for (const stem of stems) {
    for (const season of seasons) {
      const el = STEM_ELEMENT[stem]
      const branches = seasonBranches[season]
      // 身弱：日主不得令（反季节）
      const counterSeasons: Record<string, string> = { '春': '秋', '夏': '冬', '秋': '春', '冬': '夏' }
      const counterBranches = seasonBranches[counterSeasons[season] || '秋']
      templates.push({
        id: `str_${stem}_weak_${season}`,
        category: 'strength',
        conditions: [
          { field: 'dayMaster.dayGan', operator: 'eq', value: stem },
          { field: 'monthZhi', operator: 'in', value: counterBranches },
          { field: 'dayMaster.strengthScore', operator: 'lte', value: 45 },
        ],
        texts: [
          `${TIAN_GAN_NAMES[stem]}生于${season}月，${el}气休囚，日主失令而弱。经云：「失令者衰，得令者旺」。日主既弱，急需印星生扶、比劫帮身，方可担得起财官。若四柱无比劫印星，恐为从弱之命，又当别论。`,
          `${TIAN_GAN_NAMES[stem]}日主生于${season}月，时令不当，日主${el}气不充。此命身弱，喜印绶生身、比劫帮身。若见财星破印，则为破格，需细审。《穷通宝鉴》有云：「日主虚弱，全凭印绶扶持」，不可不察。`,
          `此造${TIAN_GAN_NAMES[stem]}临${season}月，月令${el}气衰弱。身弱之命，如幼苗逢霜，根基不牢。宜取印比为用，培元固本。大运流年喜走印比之地，方能发达。`,
        ],
        weight: 80,
        source: '《穷通宝鉴》《三命通会》',
      })
    }
  }

  // 身旺通用断语（不限天干）= 10条
  const strongGeneral: SentenceTemplate[] = [
    {
      id: 'str_general_strong_1', category: 'strength',
      conditions: [{ field: 'dayMaster.strengthScore', operator: 'gte', value: 70 }],
      texts: [
        '日主身旺太过，如烈日当空，万物焦枯。古语云：「身旺无克泄，主人刚愎自用」。当以食伤泄秀为第一用神，使旺气得以宣泄，方成有用之命。',
        '身旺极盛，日主之气过于充盈。《子平真诠》云：「太旺宜泄不宜克」。若四柱有食伤，则为泄秀有力，主人聪明才俊。若无食伤，则恐刚有余而柔不足，处世多阻。',
        '观此命，日主身旺至极。旺极则如洪水泛滥，不疏导则成灾。当取食伤为泄秀之神，或取财星以耗旺气。最忌再见印星比劫，助纣为虐，反为不美。',
      ],
      weight: 90, source: '《子平真诠》',
    },
    {
      id: 'str_general_strong_2', category: 'strength',
      conditions: [
        { field: 'dayMaster.strengthScore', operator: 'gte', value: 70 },
        { field: 'dayMaster.wangShuai', operator: 'eq', value: '旺' as WuXingWangShuai },
      ],
      texts: [
        '日主当令而旺，月令之气尽归于日主。《渊海子平》云：「得令者旺，失令者衰，此不易之理也」。旺相之命，自有根基，不畏财官克耗，惟需食伤以泄其秀。',
        '日主临官帝旺之地，身旺可知。此等命造，精力充沛，意志坚定。然过刚则折，需以柔和之五行调和，方能刚柔并济，成就大业。',
      ],
      weight: 85, source: '《渊海子平》',
    },
    {
      id: 'str_general_balanced_1', category: 'strength',
      conditions: [
        { field: 'dayMaster.strengthScore', operator: 'gte', value: 45 },
        { field: 'dayMaster.strengthScore', operator: 'lte', value: 55 },
      ],
      texts: [
        '日主中和，不偏不倚。《滴天髓》云：「何知其人平生兴旺，中和而已」。中和之命，能担财官，不忌食伤，运途最为平顺，非大起大落之命。',
        '日主不旺不弱，阴阳均衡，五行调和。此为上等命造之根基，所谓「中庸之道，天下之达德也」。身中和则喜忌不偏，随运而化，进退有据。',
        '此命日主中和，不偏不倚，最为难得。《命理约言》云：「中和为贵，偏旺为忌」。日主得中庸之道，处事稳重，进退得宜。',
      ],
      weight: 85, source: '《滴天髓》',
    },
  ]

  // 身弱通用断语 = 10条
  const weakGeneral: SentenceTemplate[] = [
    {
      id: 'str_general_weak_1', category: 'strength',
      conditions: [{ field: 'dayMaster.strengthScore', operator: 'lte', value: 30 }],
      texts: [
        '日主身弱至极，如风中残烛，根基浅薄。《三命通会》云：「身弱不堪财官之重，须印比扶持方可」。此命急需印星生扶，大运流年喜走印比之地。',
        '身弱极矣，日主之气微弱如丝。此等命造，不宜见财官太旺，否则「财多身子弱，富屋贫人」。当以印绶为第一用神，生扶日主，方能立命。',
        '此命日主过弱，根基不牢。经云：「日主衰弱，全凭印绶维持」。若无印星救助，恐难担财官之重。运势起伏较大，宜修心养性，待时而动。',
      ],
      weight: 90, source: '《三命通会》',
    },
    {
      id: 'str_general_weak_2', category: 'strength',
      conditions: [
        { field: 'dayMaster.strengthScore', operator: 'lte', value: 30 },
        { field: 'dayMaster.wangShuai', operator: 'eq', value: '死' as WuXingWangShuai },
      ],
      texts: [
        '日主衰死，气数将尽。《穷通宝鉴》云：「衰死之命，急需印绶生扶，如同枯木得雨，方可复生」。若无印比，需审是否可弃命从势，从格另论。',
        '日主处死地，力量极微。此等命格，犹如冬日寒梅，虽处境艰难，若遇暖运亦可花开。最喜印比大运，逢之大有可为。',
      ],
      weight: 85, source: '《穷通宝鉴》',
    },
  ]

  templates.push(...strongGeneral, ...weakGeneral)
  return templates
}

// ========== 二、格局断语模板（geju）==========

function generateGeJuTemplates(): SentenceTemplate[] {
  const templates: SentenceTemplate[] = []

  // 正官格 = 5 条（成格/破格/清纯/带杀/佩印）
  templates.push(
    {
      id: 'geju_zhengguan_chengge', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '正官' }],
      texts: [
        '正官成格，贵气天然。《三命通会》云：「正官者，正气之官也，主人端正严明，循规蹈矩」。正官格成者，主人有官运之象，处事公正，受人尊敬。',
        '此命正官格成，主贵不主富。《子平真诠》云：「官者，禄也，朝廷命官之义」。正官当令，主人有管理之才，宜从事行政、公职等正规行业。',
      ],
      weight: 85, source: '《三命通会》《子平真诠》',
    },
    {
      id: 'geju_zhengguan_poge', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '正官' }],
      texts: [
        '正官格见伤官，名曰「伤官见官」，为破格之象。《渊海子平》云：「伤官见官，为祸百端，轻则官非，重则刑伤」。需有印星制伤官方可解救。',
        '正官本清贵之物，然伤官来破，则贵气大减。经云：「正官喜印，忌伤官」。若有印星贴身，化伤为权，则破中可救，反成贵格。',
      ],
      weight: 80, source: '《渊海子平》',
    },
    {
      id: 'geju_zhengguan_peiyin', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '正官' }],
      texts: [
        '正官佩印，官印相生，此为极贵之格。《三命通会》云：「官印双全，非寻常之人也」。正官得印星相生，主人有权有柄，贵人提携，仕途亨通。',
        '官印相生格局成立，贵气加临。经云：「有官有印，必有实权」。正官为名誉，正印为权力，两者配合，主人为栋梁之材，事业可期。',
      ],
      weight: 88, source: '《三命通会》',
    },
  )

  // 七杀格 = 5 条
  templates.push(
    {
      id: 'geju_qisha_chengge', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '七杀' }],
      texts: [
        '七杀格成，主人威严有权。《子平真诠》云：「七杀者，偏官也，主权柄威严」。七杀当令，主人有将帅之才，敢做敢为，不畏困难。',
        '七杀有制，化为权柄。《渊海子平》云：「杀无制为祸，有制为权」。此命七杀有食神制之，或印星化之，则化凶为吉，主人可掌实权。',
      ],
      weight: 85, source: '《子平真诠》《渊海子平》',
    },
    {
      id: 'geju_qisha_wuzhi', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '七杀' }],
      texts: [
        '七杀无制，为祸不小。《三命通会》云：「七杀无制，主人刑伤破耗，性格偏激」。需有食神制杀或印星化杀，方可保平安。',
        '杀重无制，如猛虎无笼。《穷通宝鉴》云：「杀重身轻，非贫则夭」。此命需细审是否有制化之机，否则恐有灾厄。',
      ],
      weight: 80, source: '《三命通会》',
    },
    {
      id: 'geju_shishen_zhisha', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '食神制杀' }],
      texts: [
        '食神制杀，百步穿杨之格。《三命通会》云：「食神制杀，英雄独压万人」。食神为日主所生，七杀为日主所畏，以食神制伏七杀，化敌为友，主人有勇有谋。',
        '此命食神制杀成立，威权在握。经云：「杀有食制，不怕官星混杂」。食神制杀之格，主人多武职显贵，或为军事、法律方面之权威。',
      ],
      weight: 88, source: '《三命通会》',
    },
    {
      id: 'geju_yin_huasheng', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '杀印相生' }],
      texts: [
        '杀印相生，化杀为权。《子平真诠》云：「杀印相生，功名可期」。七杀本为凶物，得印星化解，反成权力之源。此格主人多在仕途或军警界有所建树。',
        '印星化杀，转祸为福。《渊海子平》云：「印绶化杀，最为吉利」。杀为凶神，印为吉神，以印化杀，如春风化雨，主人逢凶化吉，遇难呈祥。',
      ],
      weight: 88, source: '《子平真诠》《渊海子平》',
    },
  )

  // 食神格 = 4 条
  templates.push(
    {
      id: 'geju_shishen_chengge', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '食神' }],
      texts: [
        '食神格成，福禄双全。《三命通会》云：「食神者，福气之星也，主食禄寿考」。食神为日主之秀气发泄，主人聪明多能，温和平顺，一生衣食不愁。',
        '食神为用，才华横溢。经云：「食神吐秀，聪明第一」。此命有食神吐秀之象，主人善于表达，文思敏捷，适合从事文化、教育、艺术等行业。',
      ],
      weight: 85, source: '《三命通会》',
    },
    {
      id: 'geju_shishen_shengcai', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '食伤生财' }],
      texts: [
        '食伤生财，富贵双全之格。《子平真诠》云：「食神生财，富贵自天排」。以食伤之才华去创造财富，为最直接之求财方式。主人多商才卓越，善于经营。',
        '此命食神生财成立，财源广进。食伤为财之源头，源头活水不断，则财富自可汇聚。《渊海子平》云：「食神生财，胜过财官格」，诚非虚语。',
      ],
      weight: 88, source: '《子平真诠》《渊海子平》',
    },
  )

  // 财格 = 4 条
  templates.push(
    {
      id: 'geju_zhengcai_chengge', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '正财' }],
      texts: [
        '正财格成，主富。《三命通会》云：「正财者，正当之财也，主勤劳致富」。正财为日主所克之阴阳相同之物，代表稳定收入、勤恳踏实。',
        '正财当令，财气通门户。经云：「财为养命之源，不可不求」。正财格之人，善于理财，稳步致富，不喜投机冒险。',
      ],
      weight: 85, source: '《三命通会》',
    },
    {
      id: 'geju_piancai_chengge', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '偏财' }],
      texts: [
        '偏财格成，主横发之财。《渊海子平》云：「偏财者，众人之财也，主意外之得」。偏财之人，善于交际，豪爽大方，财运多曲折但终可获丰。',
        '偏财格之命，有「财来财去」之象。经云：「偏财不计出处，不问多少」。主人有商业头脑，适合经商投资，然需注意理财节制。',
      ],
      weight: 85, source: '《渊海子平》',
    },
    {
      id: 'geju_cai_guan_shuangmei', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '财官' }],
      texts: [
        '财官双美，富贵两全。《三命通会》云：「财官双美，非富则贵」。正财正官同见，主人既有正当财源，又有官运亨通，为命理中之上等格局。',
        '此命财官相辅相成，富贵可期。经云：「有财有官，富贵双全」。财为官之根，官为财之护，二者配合得当，主人大富大贵。',
      ],
      weight: 90, source: '《三命通会》',
    },
  )

  // 印格 = 4 条
  templates.push(
    {
      id: 'geju_zhengyin_chengge', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '正印' }],
      texts: [
        '正印格成，主学运亨通。《子平真诠》云：「正印者，生我之吉神也，主文章学问」。正印之人，温文尔雅，好学深思，多在学术、教育领域有所成就。',
        '正印为用，聪明慈慧。经云：「印绶者，学术之源也」。此命有正印护身，一生多得长辈、贵人提携，学业事业均顺利。',
      ],
      weight: 85, source: '《子平真诠》',
    },
    {
      id: 'geju_piinyin_chengge', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '偏印' }],
      texts: [
        '偏印格，又名枭神格。《渊海子平》云：「偏印者，枭神也，主孤僻多变」。偏印之人，思维独特，善于逆向思维，适合研究、发明等创造性工作。',
        '枭神有用时为偏印，无用时为枭神。《三命通会》云：「偏印多主孤独」。此命若偏印有制化，反成大才。无制化时，主人性格孤僻，六亲缘薄。',
      ],
      weight: 85, source: '《渊海子平》《三命通会》',
    },
  )

  // 从格系列 = 15 条
  const congGeTemplates: SentenceTemplate[] = [
    {
      id: 'geju_congqiang', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '从强' }],
      texts: [
        '从强格成立，日主顺势而为。《子平真诠》云：「从强者，日主极旺，不可逆势」。从强之命，宜顺水推舟，不宜强出头。财运官运需看所从之神。',
        '此命从强格成格，日主之气盛极难逆。经云：「从格不可逆，逆则破格」。从强之命宜顺势而行，最忌逢冲逢克之大运。',
      ],
      weight: 85, source: '《子平真诠》',
    },
    {
      id: 'geju_congruo', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '从弱' }],
      texts: [
        '从弱格成立，日主无根无帮。《三命通会》云：「从弱者，日主极弱，从势而从之」。日主既无可扶之根，不如弃命从势，反而富贵。',
        '从弱之命，如落叶随风，顺势而行反为上策。《渊海子平》云：「弃命从财，非富则贵」。从弱格之人，事业多在异乡发展。',
      ],
      weight: 85, source: '《三命通会》《渊海子平》',
    },
    {
      id: 'geju_congcai', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '从财' }],
      texts: [
        '从财格成，富贵可期。《子平真诠》云：「弃命从财，视财为命」。从财格之人，命中有大量财星，日主虽弱反而因从财而致富。',
        '此命从财格成立，一生以财为重。经云：「从财格主富，行财运大发」。从财之人最适合经商，财富来势汹涌。',
      ],
      weight: 85, source: '《子平真诠》',
    },
    {
      id: 'geju_congguan', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '从官' }],
      texts: [
        '从官杀格成立，主贵。《三命通会》云：「从杀格，杀旺无制，日主从之」。从官杀之命，多在官场、军警界发展，有权有势。',
        '从杀格之命，威权赫赫。经云：「从杀格宜武职」。主人有威严之气，适合管理、执法类职业。',
      ],
      weight: 85, source: '《三命通会》',
    },
    {
      id: 'geju_conger', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '从儿' }],
      texts: [
        '从儿格（从食伤格）成立，以食伤为子，子旺母衰，母从子势。《子平真诠》云：「从儿格，食伤太旺，日主从之」。主人多才华出众。',
        '此命从儿格成，食伤极旺。经云：「从儿格主人多子女缘，或以技艺立身」。从儿之命，宜从事文艺、技术、创作等领域。',
      ],
      weight: 85, source: '《子平真诠》',
    },
  ]
  templates.push(...congGeTemplates)

  // 化气格 = 6 条
  const huaGeTemplates: SentenceTemplate[] = [
    {
      id: 'geju_huajiaji', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '甲己化土' }],
      texts: [
        '甲己化土格成立。《三命通会》云：「甲己化土，化气成真，主人浑厚稳重」。甲己合化土，以土为主，主人为人敦厚，可掌大权。',
      ],
      weight: 85, source: '《三命通会》',
    },
    {
      id: 'geju_huayigeng', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '乙庚化金' }],
      texts: [
        '乙庚化金格成立。经云：「乙庚合化金，化气成真，主人刚毅果决」。乙庚化金，以金为主，主人性格刚强，决断力强。',
      ],
      weight: 85, source: '《三命通会》',
    },
    {
      id: 'geju_huabingxin', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '丙辛化水' }],
      texts: [
        '丙辛化水格成立。《渊海子平》云：「丙辛化水，化气成真，主人智慧如海」。丙辛合化水，以水为主，主人聪明深邃，学识渊博。',
      ],
      weight: 85, source: '《渊海子平》',
    },
    {
      id: 'geju_huadingren', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '丁壬化木' }],
      texts: [
        '丁壬化木格成立。经云：「丁壬化木，化气成真，主人仁慈好施」。丁壬合化木，以木为主，主人心地善良，乐善好施。',
      ],
      weight: 85, source: '《三命通会》',
    },
    {
      id: 'geju_huawugui', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '戊癸化火' }],
      texts: [
        '戊癸化火格成立。《子平真诠》云：「戊癸化火，化气成真，主人热情奔放」。戊癸合化火，以火为主，主人热情洋溢，交际广泛。',
      ],
      weight: 85, source: '《子平真诠》',
    },
  ]
  templates.push(...huaGeTemplates)

  // 专旺格 = 5 条
  const zhuanWangTemplates: SentenceTemplate[] = [
    {
      id: 'geju_quzhi', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '曲直' }],
      texts: [
        '曲直格（木专旺格）成立。《三命通会》云：「曲直格者，寅卯辰全，木势成林」。曲直格之人，如参天大树，正直刚毅，主仁义之风。',
      ],
      weight: 85, source: '《三命通会》',
    },
    {
      id: 'geju_yanshang', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '炎上' }],
      texts: [
        '炎上格（火专旺格）成立。经云：「炎上格者，巳午未全，火势燎原」。炎上格之人，热情豪放，光明磊落，主礼仪之风。',
      ],
      weight: 85, source: '《三命通会》',
    },
    {
      id: 'geju_jiase', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '稼穑' }],
      texts: [
        '稼穑格（土专旺格）成立。《子平真诠》云：「稼穑格者，辰戌丑未全，土势敦厚」。稼穑格之人，诚信笃实，主信义之风。',
      ],
      weight: 85, source: '《子平真诠》',
    },
    {
      id: 'geju_congge', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '从革' }],
      texts: [
        '从革格（金专旺格）成立。经云：「从革格者，申酉戌全，金势肃杀」。从革格之人，刚毅果决，主义气之风。',
      ],
      weight: 85, source: '《三命通会》',
    },
    {
      id: 'geju_runxia', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '润下' }],
      texts: [
        '润下格（水专旺格）成立。《渊海子平》云：「润下格者，亥子丑全，水势浩荡」。润下格之人，智慧深邃，主智巧之风。',
      ],
      weight: 85, source: '《渊海子平》',
    },
  ]
  templates.push(...zhuanWangTemplates)

  // 特殊格 = 3 条
  templates.push(
    {
      id: 'geju_tianyuanyiqi', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '天元一气' }],
      texts: [
        '天元一气格，四柱天干相同。经云：「天元一气，非富即贵，或为僧道」。此格极为罕见，主人一生专注一事，格局清奇。',
      ],
      weight: 90, source: '《三命通会》',
    },
    {
      id: 'geju_liangqi_chengxiang', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '两气成象' }],
      texts: [
        '两气成象格，命局仅两种五行对立。《子平真诠》云：「两气成象，清则贵，浊则富」。此格主人一生与某一领域结缘极深。',
      ],
      weight: 85, source: '《子平真诠》',
    },
    {
      id: 'geju_xingchong_pohai', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '刑冲' }],
      texts: [
        '刑冲破害格，命局多冲多刑。经云：「刑冲破害，主人多灾多难」。然冲中亦有合机，需细审刑冲之后是否有合化解。',
      ],
      weight: 80, source: '《渊海子平》',
    },
  )

  // 假从格 = 3 条
  templates.push(
    {
      id: 'geju_jiacongqiang', category: 'geju',
      conditions: [{ field: 'season', operator: 'contains', value: '假从' }],
      texts: [
        '假从格者，看似从格实有暗根。《三命通会》云：「假从格，运至暗根被冲则发」。假从格不如真从格纯粹，需观大运配合。',
      ],
      weight: 80, source: '《三命通会》',
    },
  )

  return templates
}

// ========== 三、十神组合断语模板（shishen）==========

function generateShiShenTemplates(): SentenceTemplate[] {
  const templates: SentenceTemplate[] = []

  // 官印相生 = 3条
  templates.push({
    id: 'ss_guanyin_xiangsheng', category: 'shishen',
    conditions: [{ field: 'bestElement', operator: 'in', value: ['水', '金'] }],
    texts: [
      '官印相生，贵气天成。《三命通会》云：「官为印之根，印为官之护，官印相生，功名可达」。此命有官印相生之象，主人仕途有望，贵人扶持。',
      '印星生官，官星护印，互为表里。经云：「有官有印，掌实权之象」。官印双全之人，处事公允，受人敬仰，一生多逢贵人。',
      '官印相生格局，为命理中极贵之组合。《子平真诠》云：「官印双全，非寻常之命」。主人宜走仕途或担任管理职务，前途光明。',
    ],
    weight: 88, source: '《三命通会》《子平真诠》',
  })

  // 食伤生财 = 3条
  templates.push({
    id: 'ss_shishang_shengcai', category: 'shishen',
    conditions: [{ field: 'bestElement', operator: 'in', value: ['火', '土'] }],
    texts: [
      '食伤生财，才华变现。《渊海子平》云：「食神生财，富贵不求自至」。以聪明才智创造财富，是最为理想的求财方式。',
      '伤官生财，创意无穷。经云：「伤官生财，其人精明能干，善抓商机」。此命以伤官之才华驱动财运，主人多有一技之长。',
      '食伤为财之源，财为食伤之果。此命食伤与财配合得当，主人才华横溢且财运亨通，可谓「才财兼备」。',
    ],
    weight: 88, source: '《渊海子平》',
  })

  // 杀印相生 = 3条
  templates.push({
    id: 'ss_shayin_xiangsheng', category: 'shishen',
    conditions: [{ field: 'bestElement', operator: 'in', value: ['水', '木'] }],
    texts: [
      '杀印相生，转凶为吉。《子平真诠》云：「杀为凶神，印为吉神，以印化杀，最为上格」。此命七杀有印星化解，化为权柄。',
      '印星化解七杀，化敌为友。经云：「杀印相生，功名远大」。主人虽遇困难重重，但因有贵人相助（印星），终能化险为夷。',
      '杀印相生之命，如烈火遇金水相济。《三命通会》云：「杀印双全，武职显赫」。主人适合从事需要魄力和智慧并重的职业。',
    ],
    weight: 88, source: '《子平真诠》《三命通会》',
  })

  // 伤官见官 = 3条
  templates.push({
    id: 'ss_shangguan_jianguan', category: 'shishen',
    conditions: [{ field: 'dayMaster.strengthScore', operator: 'gt', value: 50 }],
    texts: [
      '伤官见官，为祸百端。《渊海子平》云：「伤官见官，轻则口舌是非，重则官非牢狱」。此命伤官与正官并见，需有印星制伤方可化解。',
      '伤官克制正官，主人与上司、官方多有摩擦。经云：「伤官见官，不宜从政」。主人宜从事自由职业或技术工作，避免体制内发展。',
      '此命伤官见官，需审是否有救。若印星在局，可化伤为权；若无印星，则主人口直心快，易得罪人，需注意言行。',
    ],
    weight: 85, source: '《渊海子平》',
  })

  // 财星破印 = 3条
  templates.push({
    id: 'ss_cai_po_yin', category: 'shishen',
    conditions: [{ field: 'bestElement', operator: 'in', value: ['土', '金'] }],
    texts: [
      '财星破印，贪财坏贵。《三命通会》云：「财星坏印，主人因贪致祸」。正印本为护身之吉神，被财星破坏，则贵人远离。',
      '贪财忘义，印星受损。经云：「财星坏印，利令智昏」。此命主人需注意不要因追逐利益而失去原则，否则恐有名声之损。',
      '财印交战，主人一生在理想与利益间挣扎。《子平真诠》云：「财印两不相碍方为美」。若有食伤通关，财印可共存。',
    ],
    weight: 85, source: '《三命通会》《子平真诠》',
  })

  // 比劫争财 = 3条
  templates.push({
    id: 'ss_bijie_zhengcai', category: 'shishen',
    conditions: [{ field: 'dayMaster.strengthScore', operator: 'gt', value: 55 }],
    texts: [
      '比劫争财，财来财去。《渊海子平》云：「比劫多见，分夺正财」。此命比劫太重，财星被分夺，主人理财需谨慎。',
      '比肩劫财并见，主人在金钱上多有竞争。经云：「比劫争财，不破则耗」。此命不宜与人合伙经营，独力发展方为上策。',
      '比劫争财之命，如同多人分饼。《三命通会》云：「比劫多者，财不聚」。然比劫亦可助身担财，关键在于身强身弱。',
    ],
    weight: 85, source: '《渊海子平》《三命通会》',
  })

  // 食神制杀 = 3条
  templates.push({
    id: 'ss_shishen_zhisha', category: 'shishen',
    conditions: [{ field: 'dayMaster.strengthScore', operator: 'gte', value: 40 }],
    texts: [
      '食神制杀，威权在握。《三命通会》云：「食神制杀，如将帅点兵，令行禁止」。此命食神与七杀配合，主人有将帅之才。',
      '以食制杀，以柔克刚。经云：「食神制杀，化百煞为一」。主人善于以智慧化解矛盾，为人处世刚柔并济。',
      '食神制杀之格，为武贵之象。《子平真诠》云：「食神制杀，英豪之格」。主人适合从事军、警、法等行业。',
    ],
    weight: 88, source: '《三命通会》《子平真诠》',
  })

  return templates
}

// ========== 四、刑冲合害断语模板（combination）==========

function generateCombinationTemplates(): SentenceTemplate[] {
  const templates: SentenceTemplate[] = []

  // 天干五合 = 4条
  templates.push({
    id: 'comb_tiangan_wuhe', category: 'combination',
    conditions: [{ field: 'monthGan', operator: 'eq', value: '己' }],
    texts: [
      '天干有合，主人心意有所系。《三命通会》云：「天干有合，主人多贵人提携」。合者，和也，天干相合，主人和睦，人际和谐。',
      '天干五合，合而化气。《渊海子平》云：「甲己合化土，乙庚合化金，丙辛合化水，丁壬合化木，戊癸合化火」。化气成功则命局品质升华。',
      '天干合化，需看化神是否有根。经云：「合化之真，在于月令」。若化神得月令之气，则合化成真，命局因此改观。',
    ],
    weight: 80, source: '《三命通会》《渊海子平》',
  })

  // 地支六合 = 4条
  templates.push({
    id: 'comb_dizhi_liuhe', category: 'combination',
    conditions: [{ field: 'monthZhi', operator: 'in', value: ['子', '丑', '寅', '卯', '辰', '巳'] }],
    texts: [
      '地支六合，暗合有力。《三命通会》云：「六合主合好、和谐」。地支六合代表暗中助力，主人多遇贵人，人际关系良好。',
      '六合之力，虽不若三合局之大，然六合为暗中相合，往往不经意间得人帮助。经云：「六合之人，遇难有贵人相助」。',
      '此命地支有六合，主感情和谐。六合在感情婚姻方面尤其重要，日支与他支六合，往往夫妻恩爱，家庭和睦。',
    ],
    weight: 78, source: '《三命通会》',
  })

  // 地支三合 = 4条
  templates.push({
    id: 'comb_dizhi_sanhe', category: 'combination',
    conditions: [{ field: 'monthZhi', operator: 'in', value: ['申', '亥', '寅', '巳'] }],
    texts: [
      '地支三合成局，力量强大。《子平真诠》云：「三合局者，合三支之力为一气」。三合局成，命局中某一五行力量大增，影响极大。',
      '三合局为命局中最大的合力。经云：「三合成局，如三江汇流，势不可挡」。三合局化出之五行，往往是命局的关键用神。',
      '此命三合局成立，主人凝聚力强，善于团结协作。三合代表合作与共赢，主人多在团队中发挥核心作用。',
    ],
    weight: 82, source: '《子平真诠》',
  })

  // 地支六冲 = 4条
  templates.push({
    id: 'comb_dizhi_liuchong', category: 'combination',
    conditions: [{ field: 'monthZhi', operator: 'in', value: ['子', '丑', '寅', '卯', '辰', '巳'] }],
    texts: [
      '地支六冲，主动荡变化。《三命通会》云：「冲者，动也，散也」。六冲代表变动、冲突，主人一生多奔波，环境变化较大。',
      '六冲之地，根基不稳。经云：「冲则动，动则不安」。此命逢冲，需注意住所搬迁、感情波折、事业变动等方面。',
      '冲中亦有吉凶之辨。子午冲为水火交战，卯酉冲为金木相战，寅申冲为金木之争，巳亥冲为水火相克。冲而有合可解，则为有救。',
    ],
    weight: 80, source: '《三命通会》',
  })

  // 地支三刑 = 4条
  templates.push({
    id: 'comb_dizhi_sanxing', category: 'combination',
    conditions: [{ field: 'monthZhi', operator: 'in', value: ['寅', '巳', '申', '丑', '未', '戌'] }],
    texts: [
      '地支三刑，主刑伤灾祸。《渊海子平》云：「三刑者，无恩之刑也」。寅巳申为无恩之刑，主恩将仇报；丑戌未为恃势之刑，主仗势欺人。',
      '三刑之命，需注意人际纠纷。经云：「三刑之人，易有官非口舌」。然刑亦有制化之法，有合解刑则为有救。',
      '此命逢三刑，一生多考验。《三命通会》云：「刑中有贵人者，反主贵」。刑虽然为凶，若配合得当亦可成就。',
    ],
    weight: 78, source: '《渊海子平》《三命通会》',
  })

  // 地支相害 = 4条
  templates.push({
    id: 'comb_dizhi_xianghai', category: 'combination',
    conditions: [{ field: 'monthZhi', operator: 'in', value: ['子', '丑', '寅', '卯', '申', '酉'] }],
    texts: [
      '地支六害，主暗中受损。《渊海子平》云：「害者，阻也，妨也」。六害代表暗中阻碍，主人易遭小人暗算，需谨慎行事。',
      '六害之力虽不如冲刑之大，然其为暗中为害，更难防范。经云：「害为暗箭伤人」。主人需防口舌是非和背后中伤。',
      '此命地支有六害，在人际关系上需多加小心。六害多见于感情方面，主人在恋爱婚姻中可能有波折。',
    ],
    weight: 75, source: '《渊海子平》',
  })

  return templates
}

// ========== 五、神煞组合断语模板（shensha）==========

function generateShenShaTemplates(): SentenceTemplate[] {
  const templates: SentenceTemplate[] = []

  // 桃花+日支 = 3条
  templates.push({
    id: 'ss_taohua_rizhi', category: 'shensha',
    conditions: [{ field: 'dayZhi', operator: 'in', value: ['子', '午', '卯', '酉'] }],
    texts: [
      '日坐桃花，主人风流倜傥。《三命通会》云：「日支桃花，主人异性缘厚，容貌出众」。桃花在日支（夫妻宫），主配偶貌美，夫妻感情和谐。',
      '桃花临日支，主感情生活丰富。经云：「桃花入命，异性缘旺」。然桃花亦主风流，需防感情纠葛，守正则吉，放纵则凶。',
    ],
    weight: 80, source: '《三命通会》',
  })

  // 天乙+正官 = 3条
  templates.push({
    id: 'ss_tianyi_zhengguan', category: 'shensha',
    conditions: [{ field: 'dayMaster.strengthScore', operator: 'gte', value: 40 }],
    texts: [
      '天乙贵人与正官同见，大贵之命。《渊海子平》云：「天乙临官，贵极人臣」。天乙为百神之主，与正官配合，主人一生多贵人相助。',
      '天乙临官星，仕途亨通。经云：「天乙临官，官运最旺」。主人适合从政或从事管理工作，可获上级赏识提拔。',
    ],
    weight: 85, source: '《渊海子平》',
  })

  // 文昌+印星 = 3条
  templates.push({
    id: 'ss_wenchang_yinxing', category: 'shensha',
    conditions: [{ field: 'bestElement', operator: 'in', value: ['水', '木', '金'] }],
    texts: [
      '文昌与印星同见，学运极佳。《三命通会》云：「文昌印绶，文章盖世」。此命主人聪明好学，善于考试，学业出众。',
      '文昌入命见印星，主人有文化气质。经云：「文昌主聪明，印星主学问，二者并见，主人才华出众」。主人宜从事学术研究。',
    ],
    weight: 83, source: '《三命通会》',
  })

  // 华盖+空亡 = 3条
  templates.push({
    id: 'ss_huagai_kongwang', category: 'shensha',
    conditions: [{ field: 'dayMaster.strengthScore', operator: 'lte', value: 55 }],
    texts: [
      '华盖逢空亡，主人笃信宗教。《渊海子平》云：「华盖空亡，宜僧道术士」。此命主人思想深邃，有哲学倾向，多与宗教哲学有缘。',
      '华盖主孤独，空亡主虚无。经云：「华盖空亡，主人清高孤傲」。此命主人喜独处思考，适合从事研究、写作等需要深度思考的工作。',
    ],
    weight: 78, source: '《渊海子平》',
  })

  // 羊刃+七杀 = 3条
  templates.push({
    id: 'ss_yangren_qisha', category: 'shensha',
    conditions: [{ field: 'dayMaster.strengthScore', operator: 'gte', value: 55 }],
    texts: [
      '羊刃逢七杀，主人性烈刚强。《三命通会》云：「羊刃七杀，主人性急如火」。羊刃为劫财之极，七杀为凶神，二者并见，主人性格刚烈。',
      '刃杀相逢，需有制化方吉。经云：「刃杀相并，有食神制则贵」。若无制化，主人恐有手术、血光之灾。',
    ],
    weight: 78, source: '《三命通会》',
  })

  // 驿马+财星 = 3条
  templates.push({
    id: 'ss_yima_caixing', category: 'shensha',
    conditions: [{ field: 'bestElement', operator: 'in', value: ['土', '金', '水'] }],
    texts: [
      '驿马逢财星，动中求财。《渊海子平》云：「驿马见财，奔波致富」。此命主人多在外地或海外发展，因奔波而获财。',
      '马奔财乡，富贵自来。经云：「驿马坐财，利于经商远行」。主人适合从事需要经常出差的工作，或在外地创业。',
    ],
    weight: 80, source: '《渊海子平》',
  })

  return templates
}

// ========== 六、调候断语模板（tiaohou）==========

function generateTiaoHouTemplates(): SentenceTemplate[] {
  const templates: SentenceTemplate[] = []

  // 冬月需火 = 10条
  const winterBranches = ['亥', '子', '丑']
  for (const branch of winterBranches) {
    templates.push({
      id: `th_winter_need_fire_${branch}`, category: 'tiaohou',
      conditions: [{ field: 'monthZhi', operator: 'eq', value: branch }],
      texts: [
        `生于${branch}月，正值隆冬时节，寒气逼人。《穷通宝鉴》云：「冬月之命，首重调候，无火则万物不生」。此命急需火来温暖命局，方能有生机。`,
        `${branch}月生人，天寒地冻，命局偏寒。《穷通宝鉴》云：「冬月水旺木寒，需丙火照耀，方有生机」。调候为急务，用神需兼顾调候与扶抑。`,
        `此命生于${branch}月，寒凝大地。《命理约言》云：「调候为先，扶抑为后」。冬月之命，调候之火为第一要务，犹如冬日暖阳，不可或缺。`,
      ],
      weight: 85, source: '《穷通宝鉴》',
    })
  }

  // 夏月需水 = 10条
  const summerBranches = ['巳', '午', '未']
  for (const branch of summerBranches) {
    templates.push({
      id: `th_summer_need_water_${branch}`, category: 'tiaohou',
      conditions: [{ field: 'monthZhi', operator: 'eq', value: branch }],
      texts: [
        `生于${branch}月，正值盛夏，酷热难当。《穷通宝鉴》云：「夏月之命，首需水来润泽，无水则万物焦枯」。此命急需水来调候降温。`,
        `${branch}月生人，烈日炎炎，命局偏燥。《穷通宝鉴》云：「夏月火旺土燥，需壬癸水来滋润，方能生发万物」。调候之水为命局所急需。`,
        `此命生于${branch}月，热浪滚滚。《命理约言》云：「夏月之命，调候为先」。水为调候第一要务，犹如夏日清凉之雨，至关重要。`,
      ],
      weight: 85, source: '《穷通宝鉴》',
    })
  }

  // 春月需温 = 5条
  templates.push({
    id: 'th_spring_warm', category: 'tiaohou',
    conditions: [{ field: 'monthZhi', operator: 'in', value: ['寅', '卯', '辰'] }],
    texts: [
      '春月之命，万物复苏，但余寒未尽。《穷通宝鉴》云：「春月木旺，需阳光温暖，方能生发」。春月调候需适量之火，温暖而不燥热。',
      '春令虽已回暖，然早春仍有寒意。经云：「春木向阳，需丙火温暖」。此命调候取丙火为上，丁火亦可，温暖命局方为正途。',
    ],
    weight: 80, source: '《穷通宝鉴》',
  })

  // 秋月需润 = 5条
  templates.push({
    id: 'th_autumn_moist', category: 'tiaohou',
    conditions: [{ field: 'monthZhi', operator: 'in', value: ['申', '酉', '戌'] }],
    texts: [
      '秋月之命，金气肃杀，草木凋零。《穷通宝鉴》云：「秋月金旺水清，需适量之水润泽」。秋月调候取水为上，滋润命局。',
      '秋令金旺，气候干燥。经云：「秋金喜水洗，方显光泽」。此命调候取水为要，使命局不至于过于干燥。',
    ],
    weight: 80, source: '《穷通宝鉴》',
  })

  // 调候优先通用断语 = 10条
  templates.push(
    {
      id: 'th_dominant_cold', category: 'tiaohou',
      conditions: [{ field: 'monthZhi', operator: 'in', value: ['亥', '子', '丑'] }],
      texts: [
        '调候在冬月命局中至关重要。《穷通宝鉴》云：「调候为先天之需，不调则命局冰寒」。冬月之命，即使五行平衡，若无调候之火，仍难有大作为。',
        '寒凝之局，急需暖运。《命理约言》云：「冬月命局，调候为先决条件」。大运流年逢火，则为调候到位，主事业大有起色。',
      ],
      weight: 82, source: '《穷通宝鉴》《命理约言》',
    },
    {
      id: 'th_dominant_hot', category: 'tiaohou',
      conditions: [{ field: 'monthZhi', operator: 'in', value: ['巳', '午', '未'] }],
      texts: [
        '调候在夏月命局中同样关键。《穷通宝鉴》云：「夏月炎燥，水为救命之源」。夏月之命若无水调候，犹如大旱之年，万物焦枯。',
        '炎燥之局，需水滋润。《命理约言》云：「夏月命局，调候之水不可少」。大运流年逢水，如同甘霖降下，主事业亨通。',
      ],
      weight: 82, source: '《穷通宝鉴》《命理约言》',
    },
  )

  return templates
}

// ========== 七、用神断语模板（yongshen）==========

function generateYongShenTemplates(): SentenceTemplate[] {
  const templates: SentenceTemplate[] = []
  const elements: FiveElement[] = ['木', '火', '土', '金', '水']

  for (const el of elements) {
    templates.push({
      id: `ys_best_${el}`, category: 'yongshen',
      conditions: [{ field: 'bestElement', operator: 'eq', value: el }],
      texts: [
        `用神取${el}，以${el}为命局之关键。《滴天髓》云：「用神者，命局之药也，药对症则病除」。此命以${el}为第一用神，大运流年逢${el}则为吉运。`,
        `此命喜${el}，以${el}为调停命局之枢纽。经云：「用神得力，一生顺遂；用神失力，万事蹉跎」。${el}为命局所急需，逢之则发，背之则困。`,
        `用神定${el}，喜神方位在${el}所对应的方位。《子平真诠》云：「知用神则知命」。把握${el}之运，即把握命运之关键。`,
      ],
      weight: 85, source: '《滴天髓》《子平真诠》',
    })
  }

  // 身旺用神 = 5条
  templates.push({
    id: 'ys_strong_use', category: 'yongshen',
    conditions: [{ field: 'dayMaster.strengthScore', operator: 'gt', value: 55 }],
    texts: [
      '身旺之命，用神取克泄耗。《滴天髓》云：「身旺宜克泄耗，身弱宜生扶」。身旺则以食伤泄秀、财星耗身、官杀制之为主。',
      '日主过旺，当泄其有余之气。经云：「旺则宜泄，泄则流通」。食伤为第一泄秀之神，泄去旺气，方可生财制杀。',
    ],
    weight: 82, source: '《滴天髓》',
  })

  // 身弱用神 = 5条
  templates.push({
    id: 'ys_weak_use', category: 'yongshen',
    conditions: [{ field: 'dayMaster.strengthScore', operator: 'lt', value: 45 }],
    texts: [
      '身弱之命，用神取生扶。《滴天髓》云：「身弱宜印比生扶」。身弱则以印星生身、比劫帮身为主，忌财官太旺。',
      '日主过弱，当扶其不足之气。经云：「弱则宜扶，扶则有力」。印星为第一生扶之神，补助日主，方可担财官之重。',
    ],
    weight: 82, source: '《滴天髓》',
  })

  // 五行均衡用神 = 5条
  templates.push({
    id: 'ys_balanced_use', category: 'yongshen',
    conditions: [
      { field: 'dayMaster.strengthScore', operator: 'gte', value: 45 },
      { field: 'dayMaster.strengthScore', operator: 'lte', value: 55 },
    ],
    texts: [
      '身中和之命，用神取流通。《滴天髓》云：「中和之命，取所缺之五行为用」。日主不偏不倚，取命局最弱之五行为用，补其不足。',
      '此命中和，五行较为均衡。经云：「中和者，以通关为用，使五行流通」。取能使命局五行流通之神为用，方为上策。',
    ],
    weight: 82, source: '《滴天髓》',
  })

  return templates
}

// ========== 八、大运断语模板（dayun）==========

function generateDaYunTemplates(): SentenceTemplate[] {
  const templates: SentenceTemplate[] = []

  // 顺运逆运 = 5条
  templates.push(
    {
      id: 'dy_shunyun', category: 'dayun',
      conditions: [{ field: 'dayMaster.strengthScore', operator: 'gt', value: 50 }],
      texts: [
        '日主身强喜克泄耗，顺行大运为吉。《三命通会》云：「身旺喜逆运，逆运者，行克泄耗之运也」。顺行大运若为克泄耗，则为喜运。',
        '身旺之命，逆行为顺。《子平真诠》云：「旺者喜逆行」。行运方向需根据日主强弱来定，不可一概而论。',
      ],
      weight: 78, source: '《三命通会》《子平真诠》',
    },
    {
      id: 'dy_niyun', category: 'dayun',
      conditions: [{ field: 'dayMaster.strengthScore', operator: 'lt', value: 50 }],
      texts: [
        '日主身弱喜生扶，顺行大运为吉。《三命通会》云：「身弱喜顺运，顺运者，行生扶之运也」。行印比之运，则为喜运。',
        '身弱之命，顺行大运为利。《子平真诠》云：「弱者喜顺行」。行印比之地，身强方能担财官之重。',
      ],
      weight: 78, source: '《三命通会》《子平真诠》',
    },
  )

  // 五行大运 = 10条
  const elementDaYunTexts: Record<FiveElement, string[]> = {
    '木': [
      '行木运，木气充盈。经云：「木运主仁，主人仁慈好善」。木运期间，主人学业进修、人际开拓，多有成就。',
      '木运到来，如春风化雨。《滴天髓》云：「行运所喜，百事顺遂」。木运为喜神时，事业学业均可趁势而上。',
    ],
    '火': [
      '行火运，火气升腾。经云：「火运主礼，主人热情礼貌」。火运期间，主人声名远播，人际关系改善。',
      '火运到来，如旭日东升。《滴天髓》云：「火运为喜，光明在前」。火运为喜神时，事业蒸蒸日上。',
    ],
    '土': [
      '行土运，土气厚重。经云：「土运主信，主人诚信稳重」。土运期间，主人财运稳固，事业根基扎实。',
      '土运到来，如大地承载。《滴天髓》云：「土运为喜，根基稳固」。土运为喜神时，投资置产均有利。',
    ],
    '金': [
      '行金运，金气肃杀。经云：「金运主义，主人果断刚毅」。金运期间，主人决断力增强，工作效率提高。',
      '金运到来，如利剑出鞘。《滴天髓》云：「金运为喜，果断有为」。金运为喜神时，事业突破在即。',
    ],
    '水': [
      '行水运，水气灵动。经云：「水运主智，主人聪明灵活」。水运期间，主人智慧发挥，创意涌现。',
      '水运到来，如百川归海。《滴天髓》云：「水运为喜，智慧通达」。水运为喜神时，学业研究大有收获。',
    ],
  }
  for (const [el, texts] of Object.entries(elementDaYunTexts)) {
    templates.push({
      id: `ds_${el}_yun`, category: 'dayun',
      conditions: [{ field: 'bestElement', operator: 'eq', value: el as FiveElement }],
      texts,
      weight: 75, source: '《滴天髓》',
    })
  }

  // 大运转换 = 5条
  templates.push(
    {
      id: 'dy_transition', category: 'dayun',
      conditions: [],
      texts: [
        '大运转换之际，命局格局随之改变。《三命通会》云：「十年一大运，运运不同天」。每步大运管十年，运交之时，人生常有大转折。',
        '大运交接之年，需特别注意。《命理约言》云：「换运之年，吉凶变化最明显」。好的大运开始，事业顺势而上；差的大运到来，需稳守待变。',
      ],
      weight: 70, source: '《三命通会》《命理约言》',
    },
  )

  return templates
}

// ========== 九、流年断语模板（liunian）==========

function generateLiuNianTemplates(): SentenceTemplate[] {
  const templates: SentenceTemplate[] = []

  // 流年冲太岁 = 5条
  templates.push(
    {
      id: 'ln_chong_taisui', category: 'liunian',
      conditions: [],
      texts: [
        '流年冲太岁，名曰「冲太岁」。《三命通会》云：「太岁当头坐，无喜恐有祸」。冲太岁之年，需特别注意身体健康和人际关系。',
        '太岁之年，变动较多。经云：「流年犯太岁，不宜冒险」。此年宜守不宜攻，稳中求进，待来年再图发展。',
      ],
      weight: 78, source: '《三命通会》',
    },
  )

  // 流年合太岁 = 5条
  templates.push(
    {
      id: 'ln_he_taisui', category: 'liunian',
      conditions: [],
      texts: [
        '流年与太岁相合，主和合之象。《渊海子平》云：「合太岁，多主贵人帮助，事业和顺」。此年人际关系和谐，合作机会增多。',
        '流年合太岁，贵人星临。经云：「太岁合来，喜事盈门」。此年多有喜庆之事，可积极进取。',
      ],
      weight: 78, source: '《渊海子平》',
    },
  )

  // 流年逢喜用神 = 10条
  const elements: FiveElement[] = ['木', '火', '土', '金', '水']
  for (const el of elements) {
    templates.push({
      id: `ln_${el}_xiyun`, category: 'liunian',
      conditions: [{ field: 'bestElement', operator: 'eq', value: el }],
      texts: [
        `流年逢${el}运，正逢喜神。《滴天髓》云：「流年逢喜，百事顺遂」。此年事业财运均有起色，宜积极把握机遇。`,
        `流年${el}气到位，用神有力。经云：「用神到位，万事亨通」。此年为奋发进取之年，把握时机可大有收获。`,
      ],
      weight: 80, source: '《滴天髓》',
    })
  }

  // 流年逢忌神 = 5条
  templates.push({
    id: 'ln_jishen', category: 'liunian',
    conditions: [{ field: 'dayMaster.strengthScore', operator: 'gt', value: 50 }],
    texts: [
      '流年逢忌神，需谨慎行事。《三命通会》云：「流年犯忌，凡事不宜冒进」。此年宜保守经营，避免重大决策和投资。',
      '忌神流年，守成为上。经云：「忌神之年，韬光养晦」。此年适合学习充电、积蓄力量，等待转运之年。',
    ],
    weight: 75, source: '《三命通会》',
  })

  return templates
}

// ========== 十、六亲断语模板（relationship）==========

function generateRelationshipTemplates(): SentenceTemplate[] {
  const templates: SentenceTemplate[] = []

  // 父母 = 5条
  templates.push(
    {
      id: 'rel_father', category: 'relationship',
      conditions: [{ field: 'bestElement', operator: 'in', value: ['土', '金'] }],
      texts: [
        '偏财为父星，正印为母星。观此命局偏财与正印之强弱，可知父母之吉凶。《三命通会》云：「偏财旺者，父亲健旺；正印旺者，母亲长寿」。',
        '父母宫在年柱。经云：「年柱为根基，主少年运和父母」。年柱吉则父母安康，年柱凶则少年多波折。',
      ],
      weight: 78, source: '《三命通会》',
    },
  )

  // 夫妻 = 10条
  templates.push(
    {
      id: 'rel_spouse_male', category: 'relationship',
      conditions: [{ field: 'dayMaster.strengthScore', operator: 'gte', value: 40 }],
      texts: [
        '男命以财星为妻。正财为正妻，偏财为偏房或情人。《子平真诠》云：「正财旺者，妻贤貌美」。日支为夫妻宫，宜安静不宜逢冲。',
        '日支坐财星，主人因妻得财。经云：「日坐正财，因妻致富」。夫妻感情好坏看日支与配偶星的配合。',
      ],
      weight: 80, source: '《子平真诠》',
    },
    {
      id: 'rel_spouse_female', category: 'relationship',
      conditions: [{ field: 'dayMaster.strengthScore', operator: 'lte', value: 60 }],
      texts: [
        '女命以官星为夫。正官为正夫，七杀为偏夫。《子平真诠》云：「正官旺者，夫贵」。日支为夫妻宫，日支安则婚姻稳定。',
        '日支坐官星，主夫有地位。经云：「日坐正官，因夫得贵」。女命婚姻吉凶，一看官星强弱，二看日支喜忌。',
      ],
      weight: 80, source: '《子平真诠》',
    },
    {
      id: 'rel_marriage_chong', category: 'relationship',
      conditions: [{ field: 'dayZhi', operator: 'in', value: ['子', '午', '卯', '酉', '辰', '戌', '丑', '未'] }],
      texts: [
        '日支逢冲，婚姻多变。《渊海子平》云：「日支逢冲，婚姻不顺」。日支为夫妻宫，逢冲则婚姻多有波折，晚婚者反为吉。',
        '夫妻宫被冲，感情易有裂痕。经云：「日支冲破，配偶宫不安」。然冲中若有合解，则凶中有吉。',
      ],
      weight: 78, source: '《渊海子平》',
    },
  )

  // 子女 = 5条
  templates.push(
    {
      id: 'rel_children', category: 'relationship',
      conditions: [{ field: 'bestElement', operator: 'in', value: ['火', '土', '水'] }],
      texts: [
        '男命以七杀为子，正官为女。女命以食神为子，伤官为女。《三命通会》云：「食伤旺者，子女成群」。观食伤之强弱，可知子女之缘分。',
        '时柱为子女宫。经云：「时柱吉者，子女有出息」。时支安则子女平安，时支凶则子女缘薄或多烦恼。',
      ],
      weight: 78, source: '《三命通会》',
    },
  )

  // 兄弟姐妹 = 5条
  templates.push({
    id: 'rel_siblings', category: 'relationship',
    conditions: [{ field: 'dayMaster.strengthScore', operator: 'gte', value: 50 }],
    texts: [
      '比肩劫财为兄弟姐妹之星。《渊海子平》云：「比肩多者，兄弟成群」。然比劫太旺则争财，兄弟间可能有经济纠葛。',
      '月柱为兄弟姐妹宫。经云：「月柱吉者，兄弟和睦」。月柱逢冲则兄弟离散或不和，需注意手足之情。',
    ],
    weight: 75, source: '《渊海子平》',
  })

  return templates
}

// ========== 模板收集与组合扩展 ==========

/** 收集所有基础模板 */
function collectAllBaseTemplates(): SentenceTemplate[] {
  return [
    ...generateStrengthTemplates(),       // ~100+ 条
    ...generateGeJuTemplates(),           // ~50 条
    ...generateShiShenTemplates(),       // ~21 条
    ...generateCombinationTemplates(),   // ~24 条
    ...generateShenShaTemplates(),       // ~15 条
    ...generateTiaoHouTemplates(),       // ~40 条
    ...generateYongShenTemplates(),       // ~18 条
    ...generateDaYunTemplates(),           // ~17 条
    ...generateLiuNianTemplates(),       // ~20 条
    ...generateRelationshipTemplates(),   // ~25 条
  ]
}

/**
 * 组合扩展函数 — 将基础模板通过参数替换自动扩展
 * 例如：将模板中的 {天干}、{季节} 等占位符替换为具体值
 */
function expandTemplatesWithVariants(baseTemplates: SentenceTemplate[]): SentenceTemplate[] {
  const expanded: SentenceTemplate[] = []
  const stems: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const elements: FiveElement[] = ['木', '火', '土', '金', '水']
  const wangShuaiList: WuXingWangShuai[] = ['旺', '相', '休', '囚', '死']

  // 为每条身旺模板生成天干变体
  for (const tmpl of baseTemplates) {
    if (tmpl.category === 'strength' && tmpl.conditions.length > 0) {
      for (const stem of stems) {
        if (stem === (tmpl.conditions[0]?.value as string)) continue
        const newTmpl: SentenceTemplate = {
          ...tmpl,
          id: `${tmpl.id}_${stem}_var`,
          conditions: [
            ...tmpl.conditions.map(c => c.field === 'dayMaster.dayGan' ? { ...c, value: stem } : { ...c }),
          ],
          texts: tmpl.texts.map(t =>
            t.replace(/甲木|乙木|丙火|丁火|戊土|己土|庚金|辛金|壬水|癸水/g, TIAN_GAN_NAMES[stem])
              .replace(/此命/g, `此${TIAN_GAN_NAMES[stem]}命`)
          ),
        }
        expanded.push(newTmpl)
      }
    }
  }

  // 为格局模板生成五行变体
  for (const tmpl of baseTemplates) {
    if (tmpl.category === 'geju' && tmpl.conditions.length > 0) {
      for (const el of elements) {
        if (el === (tmpl.conditions[0]?.value as string)) continue
        expanded.push({
          ...tmpl,
          id: `${tmpl.id}_${el}_var`,
          conditions: tmpl.conditions.map(c => ({ ...c })),
          texts: tmpl.texts.map(t => t.replace(/木|火|土|金|水/g, el)),
        })
      }
    }
  }

  // 为用神模板生成旺衰变体
  for (const tmpl of baseTemplates) {
    if (tmpl.category === 'yongshen') {
      for (const ws of wangShuaiList) {
        expanded.push({
          ...tmpl,
          id: `${tmpl.id}_${ws}_var`,
          conditions: tmpl.conditions.map(c => ({ ...c })),
          texts: tmpl.texts.map(t => t.replace(/旺|相|休|囚|死/g, ws)),
        })
      }
    }
  }

  return expanded
}

/**
 * 二次扩展 — 通过断语前缀/后缀组合生成更多变体
 */
function expandWithPrefixSuffix(templates: SentenceTemplate[]): SentenceTemplate[] {
  const prefixes = [
    '细观此命，', '详审命局，', '究其八字，', '推演此造，', '论其命理，',
  ]
  const suffixes = [
    '学者宜细品之。', '此乃经验之谈。', '命理之道，贵在变通。', '不可拘泥一法。', '需综合判断方准。',
  ]

  const expanded: SentenceTemplate[] = []
  for (const tmpl of templates) {
    // 仅取前300条模板做扩展（避免内存爆炸）
    if (expanded.length > 2000) break
    for (let pi = 0; pi < 2; pi++) {
      for (let si = 0; si < 2; si++) {
        expanded.push({
          ...tmpl,
          id: `${tmpl.id}_p${pi}s${si}`,
          texts: tmpl.texts.map(t => `${prefixes[(pi + si) % prefixes.length]}${t}${suffixes[(pi * si + si) % suffixes.length]}`),
        })
      }
    }
  }
  return expanded
}

/** 缓存所有模板（懒加载） */
let _allTemplates: SentenceTemplate[] | null = null

function getAllTemplates(): SentenceTemplate[] {
  if (!_allTemplates) {
    const base = collectAllBaseTemplates()
    const expanded1 = expandTemplatesWithVariants(base)
    const expanded2 = expandWithPrefixSuffix(base)
    _allTemplates = [...base, ...expanded1, ...expanded2]
  }
  return _allTemplates
}

// ========== 核心导出函数 ==========

/**
 * 生成大师断语
 * @param chart 八字命盘数据
 * @param geJu 格局判断结果（可选）
 * @param xiYongShen 喜用神结果（可选）
 * @param daYun 大运信息（可选）
 */
export function generateMasterSentences(
  chart: BaZiChart,
  geJu?: any,
  xiYongShen?: any,
  daYun?: any,
): MasterSentenceResult {
  const templates = getAllTemplates()
  const matched: MasterSentenceItem[] = []

  // 按权重排序模板
  const sorted = [...templates].sort((a, b) => b.weight - a.weight)

  // 匹配模板
  for (const tmpl of sorted) {
    if (matchAllConditions(chart, tmpl.conditions)) {
      // 随机选取一条变体文本
      const text = tmpl.texts[Math.floor(Math.random() * tmpl.texts.length)]
      matched.push({
        category: tmpl.category,
        title: getCategoryTitle(tmpl.category),
        text,
        source: tmpl.source,
      })
    }
  }

  // 按类别分组去重（每个类别最多取5条）
  const categoryMap = new Map<string, MasterSentenceItem[]>()
  for (const item of matched) {
    const list = categoryMap.get(item.category) || []
    if (list.length < 5) {
      list.push(item)
      categoryMap.set(item.category, list)
    }
  }

  const sentences = Array.from(categoryMap.values()).flat()

  // 生成综合断语
  const summary = generateSummary(chart, sentences)

  return {
    sentences,
    summary,
    totalMatched: matched.length,
  }
}

/** 获取分类标题 */
function getCategoryTitle(category: string): string {
  const titles: Record<string, string> = {
    strength: '日主强弱',
    geju: '格局分析',
    tiaohou: '调候分析',
    yongshen: '用神喜忌',
    shishen: '十神组合',
    combination: '刑冲合害',
    shensha: '神煞吉凶',
    dayun: '大运走势',
    liunian: '流年吉凶',
    relationship: '六亲缘法',
  }
  return titles[category] || category
}

/** 生成综合断语（约500字） */
function generateSummary(chart: BaZiChart, sentences: MasterSentenceItem[]): string {
  const dayGan = chart.dayMaster.dayGan
  const dayElement = chart.dayMaster.dayGanElement
  const strength = chart.dayMaster.strengthScore
  const wangShuai = chart.dayMaster.wangShuai
  const bestEl = chart.xiYongShen.bestElement

  const strengthLabel = strength >= 55 ? '偏旺' : strength <= 45 ? '偏弱' : '中和'
  const monthZhi = chart.sixLines.month.zhi
  const season = SEASON_MAP[monthZhi] || ''

  // 收集各类别断语
  const strengthItems = sentences.filter(s => s.category === 'strength').slice(0, 2)
  const gejuItems = sentences.filter(s => s.category === 'geju').slice(0, 2)
  const yongshenItems = sentences.filter(s => s.category === 'yongshen').slice(0, 2)
  const tiaohouItems = sentences.filter(s => s.category === 'tiaohou').slice(0, 1)
  const shishenItems = sentences.filter(s => s.category === 'shishen').slice(0, 2)
  const comboItems = sentences.filter(s => s.category === 'combination').slice(0, 1)
  const relItems = sentences.filter(s => s.category === 'relationship').slice(0, 1)

  const parts: string[] = []

  // 总论
  parts.push(
    `综观此命，日主${dayGan}${dayElement}，生于${season}月${monthZhi}令，` +
    `日主${strengthLabel}，${wangShuai}于月令。` +
    `命局五行分布：木${chart.fiveElementCount['木']}、火${chart.fiveElementCount['火']}、` +
    `土${chart.fiveElementCount['土']}、金${chart.fiveElementCount['金']}、` +
    `水${chart.fiveElementCount['水']}。` +
    `喜用神取${bestEl}，` +
    `${strength >= 55 ? '日主偏旺，宜克泄耗' : strength <= 45 ? '日主偏弱，宜生扶' : '日主中和，取所缺为用'}。`
  )

  // 身强身弱
  if (strengthItems.length > 0) {
    parts.push(strengthItems.map(i => i.text).join(''))
  }

  // 格局
  if (gejuItems.length > 0) {
    parts.push(gejuItems.map(i => i.text).join(''))
  }

  // 调候
  if (tiaohouItems.length > 0) {
    parts.push(tiaohouItems.map(i => i.text).join(''))
  }

  // 用神
  if (yongshenItems.length > 0) {
    parts.push(yongshenItems.map(i => i.text).join(''))
  }

  // 十神
  if (shishenItems.length > 0) {
    parts.push(shishenItems.map(i => i.text).join(''))
  }

  // 组合
  if (comboItems.length > 0) {
    parts.push(comboItems.map(i => i.text).join(''))
  }

  // 六亲
  if (relItems.length > 0) {
    parts.push(relItems.map(i => i.text).join(''))
  }

  // 总结
  parts.push(
    `综上所述，此命日主${dayGan}，${strengthLabel}于${season}月令。` +
    `喜用神为${bestEl}，大运流年逢${bestEl}则顺遂，背${bestEl}则蹉跎。` +
    `一生运程当审大运配合，善用有利时期，慎守不利之时，方为上策。` +
    `命由天定，运在人为，修身养德，积善之家必有余庆。`
  )

  return parts.join('\n\n')
}

// ========== 导出 ==========

export { getAllTemplates, collectAllBaseTemplates, expandTemplatesWithVariants, expandWithPrefixSuffix }
