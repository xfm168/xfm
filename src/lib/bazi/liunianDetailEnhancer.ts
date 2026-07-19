/**
 * 流年详细分析增强 — 玄风门 V4.1 八字模块
 *
 * 对单年流年进行 7 维度深度解析，结合大运背景生成结构化年度报告。
 * 根据流年干支与喜用神、大运的关系，自动匹配多种分析模板。
 */

import type {
  BaZiChart,
  FiveElement,
  XiYongShen,
  EarthlyBranch,
  HeavenlyStem,
} from './types'
import {
  getStemElement,
  getBranchElement,
  isGenerating,
  isOvercoming,
  isSameElement,
} from '@/lib/core'

// ========== 类型定义 ==========

export interface LiuNianSection {
  title: string
  content: string
}

export interface LiuNianDetailEnhanced {
  year: number
  ganZhi: string
  sections: LiuNianSection[]
  overallScore: number
  summary: string
}

// ========== 常量 ==========

const LIU_CHONG: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

const LIU_HE: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

const WUXING_SHENG: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

const WUXING_KE: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

/** 十二生肖对应地支 */
const SHENGXIAO: string[] = [
  '鼠', '牛', '虎', '兔', '龙', '蛇',
  '马', '羊', '猴', '鸡', '狗', '猪',
]

const BRANCHES: EarthlyBranch[] = [
  '子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥',
]

const STEMS: HeavenlyStem[] = [
  '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸',
]

// ========== 工具函数 ==========

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

function hasChong(a: EarthlyBranch, b: EarthlyBranch): boolean {
  return LIU_CHONG.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

function hasHe(a: EarthlyBranch, b: EarthlyBranch): boolean {
  return LIU_HE.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

interface LiuNianRelation {
  ganElement: FiveElement
  zhiElement: FiveElement
  ganIsXiYong: boolean
  zhiIsXiYong: boolean
  ganIsJi: boolean
  zhiIsJi: boolean
  chongDayZhi: boolean
  heDayZhi: boolean
  chongYearZhi: boolean
  chongMonthZhi: boolean
  chongHourZhi: boolean
  /** 与大运天干关系: 1=生扶, 0=比和, -1=克 */
  vsDaYunGan: number
  /** 与大运地支关系 */
  vsDaYunZhi: number
  tendency: number
}

function analyzeLiuNianRelation(
  lnGanElement: FiveElement,
  lnZhiElement: FiveElement,
  lnZhi: EarthlyBranch,
  chart: BaZiChart,
  xiYongShen: XiYongShen,
  daYunGanElement: FiveElement | null,
  daYunZhiElement: FiveElement | null,
): LiuNianRelation {
  const best = xiYongShen.bestElement
  const avoided = xiYongShen.avoidedElements ?? []
  const enemy = xiYongShen.enemyElements ?? []

  const ganIsXiYong = lnGanElement === best
  const zhiIsXiYong = lnZhiElement === best
  const ganIsJi = avoided.includes(lnGanElement) || enemy.includes(lnGanElement)
  const zhiIsJi = avoided.includes(lnZhiElement) || enemy.includes(lnZhiElement)

  const chongDayZhi = hasChong(lnZhi, chart.sixLines.day.zhi)
  const heDayZhi = hasHe(lnZhi, chart.sixLines.day.zhi)
  const chongYearZhi = hasChong(lnZhi, chart.sixLines.year.zhi)
  const chongMonthZhi = hasChong(lnZhi, chart.sixLines.month.zhi)
  const chongHourZhi = hasChong(lnZhi, chart.sixLines.hour.zhi)

  // 与大运关系
  let vsDaYunGan = 0
  let vsDaYunZhi = 0
  if (daYunGanElement) {
    if (isGenerating(lnGanElement, daYunGanElement)) vsDaYunGan = 1
    else if (isOvercoming(lnGanElement, daYunGanElement)) vsDaYunGan = -1
  }
  if (daYunZhiElement) {
    if (isGenerating(lnZhiElement, daYunZhiElement)) vsDaYunZhi = 1
    else if (isOvercoming(lnZhiElement, daYunZhiElement)) vsDaYunZhi = -1
  }

  // 计算吉凶倾向
  let tendency = 0.5
  if (ganIsXiYong) tendency += 0.12
  if (zhiIsXiYong) tendency += 0.12
  if (ganIsJi) tendency -= 0.12
  if (zhiIsJi) tendency -= 0.12
  if (chongDayZhi) tendency -= 0.1
  if (heDayZhi) tendency += 0.08
  if (chongYearZhi) tendency -= 0.04
  if (chongMonthZhi) tendency -= 0.04
  if (chongHourZhi) tendency -= 0.03
  // 与大运同向加分
  if (vsDaYunGan > 0) tendency += 0.03
  if (vsDaYunZhi > 0) tendency += 0.03

  return {
    ganElement: lnGanElement,
    zhiElement: lnZhiElement,
    ganIsXiYong,
    zhiIsXiYong,
    ganIsJi,
    zhiIsJi,
    chongDayZhi,
    heDayZhi,
    chongYearZhi,
    chongMonthZhi,
    chongHourZhi,
    vsDaYunGan,
    vsDaYunZhi,
    tendency: Math.max(0, Math.min(1, tendency)),
  }
}

// ========== 7 个 section 生成函数 ==========

/** 1. 事业运势 */
function careerSection(rel: LiuNianRelation, year: number, ganZhi: string): LiuNianSection {
  const title = '事业运势'
  if (rel.tendency >= 0.65) {
    const contents = [
      `${year}年${ganZhi}，天干${rel.ganElement}气${rel.ganIsXiYong ? '为喜用神，事业运势旺盛' : '助力命局，工作顺遂'}。职场中有望获得晋升或重要项目机会，领导对你的表现认可度较高。适合主动争取更大责任，展现才华。与同事合作愉快，团队氛围良好。自由职业者客源增加，创业者在${year}年下半年可能迎来业务突破。`,
      `${year}年事业运上佳，${ganZhi}流年与命局配合默契。工作中阻力减少，推进项目顺利。可能有贵人暗中相助，遇到困难时有人出手相援。适合拓展人脉，参加行业活动。管理者团队凝聚力增强，执行力提升。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    const contents = [
      `${year}年${ganZhi}，${rel.ganIsJi ? '忌神当头，事业压力显著' : '事业运势低迷，推进困难'}。职场中可能遭遇小人干扰，人际关系紧张。${rel.chongDayZhi ? '流年冲动日柱，工作变动可能性增大' : '工作中容易感到力不从心'}。建议保持低调，做好本职工作，不宜主动挑起矛盾。重大决策推迟到下半年再考虑。`,
      `${year}年事业运承压，${ganZhi}流年对工作影响偏负面。可能面临项目延期、客户流失或团队变动等问题。建议降低预期，专注于提升专业能力。若有跳槽或创业念头，建议暂缓。此年适合修炼内功，为来年蓄力。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${year}年${ganZhi}，事业运势平稳。工作中无大起大落，按部就班推进即可。${rel.ganIsXiYong ? '天干虽为喜用但力量有限，局部有亮点' : '流年对事业影响中性'}。适合维持现状，在稳定中寻找小机会。可适当学习新技能，为未来发展储备能力。`,
      `${year}年事业运中平，${ganZhi}流年不温不火。职场上保持现有节奏即可，不宜好高骛远。若有小机会可以尝试，但不宜投入过多资源。关注行业趋势变化，为下一步做准备。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

/** 2. 感情运势 */
function emotionSection(rel: LiuNianRelation, year: number, ganZhi: string, chart: BaZiChart): LiuNianSection {
  const title = '感情运势'
  if (rel.tendency >= 0.65) {
    const contents = [
      `${year}年${ganZhi}，感情运势良好。${rel.heDayZhi ? '流年与日支相合，感情生活甜蜜' : '流年对感情宫影响正面'}。已婚者夫妻关系和谐，适合安排浪漫活动增进感情。未婚者在社交场合易遇到心仪对象，尤其是春夏季节桃花更旺。已有暧昧关系者有望在此年确定关系。`,
      `${year}年感情运旺盛，${ganZhi}流年带来温馨的人际互动。家庭氛围融洽，与伴侣之间沟通顺畅。单身者可通过朋友介绍或社交活动认识新朋友。有伴侣者适合共同旅行或学习新事物，增加共同话题。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    const contents = [
      `${year}年${ganZhi}，感情运势偏弱。${rel.chongDayZhi ? '流年冲动配偶宫，感情易生波折' : '感情方面压力增大'}。已婚者需注意夫妻间的沟通方式，避免因工作压力影响家庭和谐。未婚者感情之路坎坷，暂不宜强求。${rel.chongDayZhi ? '特别注意农历三四月和九十月，感情矛盾易在此期间爆发' : '保持平和心态，感情顺其自然'}。`,
      `${year}年感情运低迷，${ganZhi}流年对感情宫影响偏负面。已有伴侣者可能出现争吵增多或冷战的情况，建议多换位思考。单身者暂不宜投入过多精力于感情。将重心放在自我提升上，为更好的感情关系做准备。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${year}年${ganZhi}，感情运势平稳。夫妻关系维持现状，无大的波动。单身者感情生活平淡但稳定。适合在平淡中经营感情，关注生活中的小细节。`,
      `${year}年感情运中平，${ganZhi}流年对感情影响不大。有伴侣者保持日常的关心和沟通即可。单身者可适当扩大社交圈，但不必刻意追求。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

/** 3. 财富运势 */
function wealthSection(rel: LiuNianRelation, year: number, ganZhi: string): LiuNianSection {
  const title = '财富运势'
  const dayElement = rel.ganElement
  const caiElement = WUXING_KE[dayElement]

  if (rel.tendency >= 0.65) {
    const contents = [
      `${year}年${ganZhi}财运亨通。${isSameElement(rel.ganElement, caiElement) || isSameElement(rel.zhiElement, caiElement) ? '流年财星透出，正偏财均有收获' : '流年喜用助力，财运水涨船高'}。工资收入有望提升，投资理财收益可观。${rel.ganIsXiYong ? '天干为喜用，正财尤为旺盛' : '地支助力，偏财运较好'}。建议合理规划资金，既可适度投资也不忘储蓄。`,
      `${year}年财运上佳，${ganZhi}流年带来财富增长机会。可能获得加薪、奖金或意外收入。投资方面适合稳健型产品，避免高风险投机。若有经商机会可适度参与，但需做好风险评估。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    const contents = [
      `${year}年${ganZhi}财运偏弱。${rel.ganIsJi ? '流年忌神当头，破财风险增大' : '流年对财运助力不足'}。收入可能减少或增长停滞，投资需格外谨慎。${rel.chongDayZhi ? '流年冲动日柱，需防因感情或家庭导致意外支出' : '控制消费欲望，避免冲动购物'}。建议以储蓄为主，减少非必要开支。切勿参与赌博或高风险投资。`,
      `${year}年财运低迷，${ganZhi}流年求财较为辛苦。可能遇到货款回收困难、投资亏损或意外支出等情况。建议收紧财务，建立应急储备。不宜大额借贷或为他人担保。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${year}年${ganZhi}财运平稳。收入维持现有水平，无大进大出。适合稳健理财，可考虑定投或定期存款。消费方面量入为出，避免不必要的浪费。`,
      `${year}年财运中平，${ganZhi}流年对财帛宫影响不大。正财稳定但偏财运一般。建议专注主业收入，副业和投资暂缓。保持良好的理财习惯，积少成多。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

/** 4. 健康状况 */
function healthSection(rel: LiuNianRelation, year: number, ganZhi: string, chart: BaZiChart): LiuNianSection {
  const title = '健康状况'
  const xys = chart.xiYongShen
  const organMap: Record<FiveElement, string> = {
    '木': '肝胆', '火': '心脑', '土': '脾胃', '金': '肺呼吸道', '水': '肾泌尿',
  }

  if (rel.tendency >= 0.65) {
    const contents = [
      `${year}年${ganZhi}，健康状况良好。流年${rel.ganElement}气生扶日主，精力充沛，免疫力较强。适合进行体育锻炼和户外活动。保持规律作息和均衡饮食，身体状态会保持良好。`,
      `${year}年健康运上佳，${ganZhi}流年对身体有正面影响。精神状态饱满，工作效率高。建议保持每周三到四次运动，注意季节变化时的衣物增减。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    const weakElem = rel.ganIsJi ? rel.ganElement
      : rel.zhiIsJi ? rel.zhiElement
      : xys.enemyElements?.[0]
    const focus = weakElem ? organMap[weakElem] : '身体各系统'
    const contents = [
      `${year}年${ganZhi}，健康运势需关注。流年${rel.ganElement}气不利日主，${focus}系统较为脆弱。${rel.chongDayZhi ? '冲动日柱，身体可能有明显不适感' : '容易感到疲劳和精力不济'}。建议定期体检，关注${focus}相关指标。保持规律作息，避免过度劳累。`,
      `${year}年健康走低，${ganZhi}流年需格外注意身体保养。${focus}方面容易出现亚健康状态，如食欲不振、睡眠不佳等。建议减少熬夜，注意饮食卫生，可适当进行中医调理。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${year}年${ganZhi}，健康状况平稳。流年对健康影响中性，维持现有生活习惯即可。建议每年至少一次体检，关注常见健康指标。保持适度运动和良好心态。`,
      `${year}年健康中平，${ganZhi}流年无明显健康异常。注意季节交替时的身体变化，及时增减衣物。保持规律作息，均衡饮食，适度锻炼。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

/** 5. 注意事项 */
function cautionSection(rel: LiuNianRelation, year: number, ganZhi: string, chart: BaZiChart): LiuNianSection {
  const title = '注意事项'
  const items: string[] = []

  // 根据关系动态生成注意事项
  if (rel.chongDayZhi) {
    items.push(`流年地支冲动日柱（配偶宫），需注意感情稳定和身体健康，农历${rel.zhiElement === '木' || rel.zhiElement === '金' ? '三四月' : rel.zhiElement === '火' || rel.zhiElement === '水' ? '五六月' : '九十月'}尤需警惕。`)
  }
  if (rel.chongYearZhi) {
    items.push('流年冲动年柱（祖业宫），家中长辈健康需关注，可能有家庭变动。')
  }
  if (rel.chongMonthZhi) {
    items.push('流年冲动月柱（父母宫），与父母关系可能紧张，注意沟通方式。')
  }
  if (rel.chongHourZhi) {
    items.push('流年冲时柱（子女宫），子女方面可能有小波折，多关心孩子成长。')
  }
  if (rel.ganIsJi) {
    items.push(`流年天干${rel.ganElement}为忌神，事业和人际方面需谨言慎行，避免冲动决策。`)
  }
  if (rel.zhiIsJi) {
    items.push(`流年地支${rel.zhiElement}为忌神，财运和健康方面需多加注意，控制风险。`)
  }

  // 通用注意事项
  if (items.length === 0) {
    items.push(`${year}年整体平稳，但仍需注意日常细节。保持积极心态，遇事冷静处理。`)
  }
  items.push('无论运势高低，保持良好的作息习惯和积极的心态都是最重要的。')

  return { title, content: items.join('') }
}

/** 6. 宜做事项 */
function favorableSection(rel: LiuNianRelation, year: number, ganZhi: string): LiuNianSection {
  const title = '宜做事项'

  if (rel.tendency >= 0.65) {
    const contents = [
      `${year}年${ganZhi}，宜做事项如下：一、宜积极争取事业上的新机会，主动请缨重要项目；二、宜适度投资理财，把握财富增长机会；三、宜拓展社交圈，结交行业内有影响力的人士；四、宜学习新技能或考取证书，提升竞争力；五、宜安排家庭旅行或浪漫活动，增进家庭和谐；六、宜进行体育锻炼，保持身体活力。`,
      `${year}年运势较好，宜：积极进取，把握机遇；投资理财，稳健为主；社交活动，扩大人脉；学习进修，提升自我；家庭聚会，增进感情；运动健身，增强体质。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    const contents = [
      `${year}年${ganZhi}，宜做事项如下：一、宜保持低调务实，做好本职工作；二、宜加强储蓄，建立应急资金；三、宜读书学习，提升专业能力；四、宜锻炼身体，增强免疫力；五、宜与家人多沟通，维护家庭稳定；六、宜反思总结，规划未来方向。此年宜守不宜攻，养精蓄锐。`,
      `${year}年宜：稳守阵地，不冒进；量入为出，多储蓄；读书学习，练内功；运动养生，保健康；家庭为重，多陪伴；静心反思，谋未来。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${year}年${ganZhi}，宜做事项：一、宜维持现状，在稳定中寻找小机会；二、宜适度理财，兼顾收益与安全；三、宜培养兴趣爱好，丰富精神生活；四、宜定期体检，关注健康指标；五、宜与亲友保持联系，维护人际关系；六、宜制定中长期目标，为未来布局。`,
      `${year}年宜：按部就班，稳步推进；稳健理财，量力而行；培养兴趣，陶冶情操；关注健康，定期体检；维护人脉，保持联系；制定计划，未雨绸缪。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

/** 7. 忌做事项 */
function unfavorableSection(rel: LiuNianRelation, year: number, ganZhi: string): LiuNianSection {
  const title = '忌做事项'

  if (rel.tendency >= 0.65) {
    const contents = [
      `${year}年${ganZhi}，虽运势较好，但仍需注意：一、忌骄傲自满，好运时更要谦虚谨慎；二、忌贪心冒进，投资需控制仓位和风险；三、忌忽视家庭，事业再忙也要陪伴家人；四、忌铺张浪费，收入增加时更应注重储蓄；五、忌轻信他人，涉及重大合作需充分调查。`,
      `${year}年忌：得意忘形，忘乎所以；贪得无厌，过度投资；忽视感情，冷落家人；铺张浪费，大手大脚；轻信他人，不加防范。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    const contents = [
      `${year}年${ganZhi}，忌做事项如下：一、忌冲动跳槽或盲目创业，此年不宜做重大职业变动；二、忌大额投资和高风险投机，尤其远离赌博；三、忌与他人发生正面冲突，忍让为上；四、忌大额借贷或为他人担保，财务风险极高；五、忌忽视健康信号，身体不适及时就医；六、忌做重大人生决定，如离婚、移民等。`,
      `${year}年忌：冲动行事，贸然变动；赌博投机，大额投资；正面冲突，得罪小人；借贷担保，财务冒险；忽视健康，硬扛不医；重大决定，草率从事。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${year}年${ganZhi}，忌做事项：一、忌好高骛远，设定不切实际的目标；二、忌过度消费，保持收支平衡；三、忌与人争执，以和为贵；四、忌熬夜过度，保持规律作息；五、忌听信谣言，理性判断信息；六、忌拖延重要事项，今日事今日毕。`,
      `${year}年忌：好高骛远，眼高手低；过度消费，入不敷出；斤斤计较，伤和伤气；熬夜过度，透支身体；轻信谣言，人云亦云；拖延懈怠，虚度光阴。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

// ========== 生成总体评述 ==========

function generateLiuNianSummary(rel: LiuNianRelation, year: number, ganZhi: string): string {
  if (rel.tendency >= 0.65) {
    return `${year}年${ganZhi}流年运势上佳，是值得期待的年份。流年${rel.ganElement}气${rel.ganIsXiYong ? '为喜用神当值' : '生扶日主有力'}，事业、财运、感情均有积极变化。${rel.heDayZhi ? '流年地支与日支相合，感情运尤为突出' : ''}建议把握这一年的良好机遇，在事业和财富上积极作为，同时注重家庭和健康的平衡。此年是播种收获的好时节。`
  } else if (rel.tendency <= 0.35) {
    return `${year}年${ganZhi}流年运势承压，需做好心理准备。${rel.ganIsJi ? `${rel.ganElement}气为忌神，各方面阻力增大` : '流年对命局助力不足'}。${rel.chongDayZhi ? '地支冲动日柱，感情和健康需重点关注' : ''}建议此年以守为主，稳中求安。逆境中修炼内功，提升自我，为来年的转机做好准备。记住：艰难困苦，玉汝于成。`
  } else {
    return `${year}年${ganZhi}流年运势平稳，波澜不惊。各方面维持现状即可，无大的起伏。适合在稳定中寻求小的发展，在平淡中积累经验和资源。建议保持良好的生活和工作习惯，为未来的机遇做好准备。平运年也是修炼和布局的好时机。`
  }
}

// ========== 主函数 ==========

/**
 * 增强流年详细分析
 *
 * @param liuNianYear - 流年数据（LiuNianYear）
 * @param chart - 八字命盘
 * @param xiYongShen - 喜用神分析结果
 * @param currentDaYun - 当前大运步骤数据
 * @returns 增强后的流年详细分析
 */
export function enhanceLiuNianDetail(
  liuNianYear: any,
  chart: BaZiChart,
  xiYongShen: XiYongShen,
  currentDaYun: any,
): LiuNianDetailEnhanced {
  // 提取流年信息
  const year = liuNianYear.year
  const ganZhi = liuNianYear.ganZhi
  const ganStr = typeof ganZhi === 'string' ? ganZhi : `${ganZhi.gan}${ganZhi.zhi}`

  // 提取流年干支五行
  const ganElement = typeof ganZhi === 'string'
    ? getStemElement(ganZhi[0] as any)
    : getStemElement(ganZhi.gan)
  const zhi = typeof ganZhi === 'string'
    ? (ganZhi[1] as EarthlyBranch)
    : ganZhi.zhi
  const zhiElement = getBranchElement(zhi)

  // 提取大运干支五行
  let daYunGanElement: FiveElement | null = null
  let daYunZhiElement: FiveElement | null = null
  if (currentDaYun) {
    const dyGanZhi = currentDaYun.ganZhi
    if (dyGanZhi) {
      daYunGanElement = typeof dyGanZhi === 'string'
        ? getStemElement(dyGanZhi[0] as any)
        : getStemElement(dyGanZhi.gan)
      daYunZhiElement = typeof dyGanZhi === 'string'
        ? getBranchElement(dyGanZhi[1] as any)
        : getBranchElement(dyGanZhi.zhi)
    }
  }

  // 分析流年与命盘关系
  const rel = analyzeLiuNianRelation(ganElement, zhiElement, zhi, chart, xiYongShen, daYunGanElement, daYunZhiElement)

  // 生成 7 个 section
  const sections: LiuNianSection[] = [
    careerSection(rel, year, ganStr),
    emotionSection(rel, year, ganStr, chart),
    wealthSection(rel, year, ganStr),
    healthSection(rel, year, ganStr, chart),
    cautionSection(rel, year, ganStr, chart),
    favorableSection(rel, year, ganStr),
    unfavorableSection(rel, year, ganStr),
  ]

  // 综合评分
  let score = rel.tendency * 80 + 10
  if (rel.chongDayZhi) score -= 8
  if (rel.chongYearZhi) score -= 4
  if (rel.chongMonthZhi) score -= 4
  if (rel.chongHourZhi) score -= 3
  if (rel.heDayZhi) score += 5
  // 结合大运背景微调
  if (rel.vsDaYunGan > 0) score += 2
  if (rel.vsDaYunZhi > 0) score += 2
  if (rel.vsDaYunGan < 0) score -= 2
  if (rel.vsDaYunZhi < 0) score -= 2
  score = clamp(score)

  // 生成总体评述
  const summary = generateLiuNianSummary(rel, year, ganStr)

  return {
    year,
    ganZhi: ganStr,
    sections,
    overallScore: score,
    summary,
  }
}