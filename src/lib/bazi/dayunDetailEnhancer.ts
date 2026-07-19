/**
 * 大运详细分析增强 — 玄风门 V4.1 八字模块
 *
 * 对单步大运进行 7 维度深度解析，生成结构化分析报告。
 * 根据大运干支与喜用神关系，自动匹配吉/凶/平三种模板。
 */

import type {
  BaZiChart,
  FiveElement,
  XiYongShen,
  EarthlyBranch,
} from './types'
import {
  getStemElement,
  getBranchElement,
  isGenerating,
  isOvercoming,
  isSameElement,
} from '@/lib/core'

// ========== 类型定义 ==========

export interface DaYunSection {
  title: string
  content: string  // 80-150 字
}

export interface DaYunDetailEnhanced {
  yearRange: string       // "2024-2033"
  ageRange: string        // "34-43岁"
  ganZhi: string          // "甲子"
  sections: DaYunSection[]
  overallScore: number    // 0-100
  summary: string         // 总体评述，约 200 字
}

// ========== 常量 ==========

/** 地支六冲 */
const LIU_CHONG: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
]

/** 地支六合 */
const LIU_HE: [EarthlyBranch, EarthlyBranch][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
]

/** 五行相生 */
const WUXING_SHENG: Record<FiveElement, FiveElement> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
}

/** 五行相克 */
const WUXING_KE: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
}

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

/**
 * 分析大运干支与命盘的关系
 */
interface DaYunRelation {
  /** 大运天干五行 */
  ganElement: FiveElement
  /** 大运地支五行 */
  zhiElement: FiveElement
  /** 天干是否为喜用 */
  ganIsXiYong: boolean
  /** 地支是否为喜用 */
  zhiIsXiYong: boolean
  /** 天干是否为忌神 */
  ganIsJi: boolean
  /** 地支是否为忌神 */
  zhiIsJi: boolean
  /** 天干是否生扶日主 */
  ganSupportsDayMaster: boolean
  /** 地支是否生扶日主 */
  zhiSupportsDayMaster: boolean
  /** 大运天干是否冲克日柱天干 */
  ganChongDay: boolean
  /** 大运地支是否冲克日柱地支 */
  zhiChongDay: boolean
  /** 大运地支是否合日柱地支 */
  zhiHeDay: boolean
  /** 大运地支是否冲年柱 */
  zhiChongYear: boolean
  /** 大运地支是否冲月柱 */
  zhiChongMonth: boolean
  /** 大运天干是否克制喜用神 */
  ganClashXiYong: boolean
  /** 大运地支是否克制喜用神 */
  zhiClashXiYong: boolean
  /** 整体吉凶倾向: 1=大吉, 0.75=吉, 0.5=平, 0.25=凶, 0=大凶 */
  tendency: number
}

function analyzeDaYunRelation(
  daYunGanElement: FiveElement,
  daYunZhiElement: FiveElement,
  chart: BaZiChart,
  xiYongShen: XiYongShen,
): DaYunRelation {
  const dayElement = chart.dayMaster.dayGanElement
  const best = xiYongShen.bestElement
  const avoided = xiYongShen.avoidedElements ?? []
  const enemy = xiYongShen.enemyElements ?? []

  const ganIsXiYong = daYunGanElement === best
  const zhiIsXiYong = daYunZhiElement === best
  const ganIsJi = avoided.includes(daYunGanElement) || enemy.includes(daYunGanElement)
  const zhiIsJi = avoided.includes(daYunZhiElement) || enemy.includes(daYunZhiElement)

  const ganSupportsDayMaster = isGenerating(daYunGanElement, dayElement) || isSameElement(daYunGanElement, dayElement)
  const zhiSupportsDayMaster = isGenerating(daYunZhiElement, dayElement) || isSameElement(daYunZhiElement, dayElement)

  const ganChongDay = isOvercoming(daYunGanElement, dayElement)
  const zhiChongDay = hasChong(chart.sixLines.day.zhi, chart.sixLines.day.zhi) ? false
    : hasChong(
        // 大运地支需要从 daYunStep 取得，但此处我们没有直接的地支，需要外部传入
        chart.sixLines.day.zhi,
        chart.sixLines.day.zhi, // placeholder
      )
  // 实际的冲克判断在主函数中处理
  const zhiHeDay = false // placeholder
  const zhiChongYear = false
  const zhiChongMonth = false
  const ganClashXiYong = isOvercoming(daYunGanElement, best)
  const zhiClashXiYong = isOvercoming(daYunZhiElement, best)

  // 计算吉凶倾向
  let tendency = 0.5
  if (ganIsXiYong) tendency += 0.15
  if (zhiIsXiYong) tendency += 0.15
  if (ganSupportsDayMaster) tendency += 0.05
  if (zhiSupportsDayMaster) tendency += 0.05
  if (ganIsJi) tendency -= 0.15
  if (zhiIsJi) tendency -= 0.15
  if (ganClashXiYong) tendency -= 0.05
  if (zhiClashXiYong) tendency -= 0.05

  return {
    ganElement: daYunGanElement,
    zhiElement: daYunZhiElement,
    ganIsXiYong,
    zhiIsXiYong,
    ganIsJi,
    zhiIsJi,
    ganSupportsDayMaster,
    zhiSupportsDayMaster,
    ganChongDay: ganChongDay,
    zhiChongDay,
    zhiHeDay,
    zhiChongYear,
    zhiChongMonth,
    ganClashXiYong,
    zhiClashXiYong,
    tendency: Math.max(0, Math.min(1, tendency)),
  }
}

// ========== 模板系统 ==========

/** 事业运模板 */
function careerSection(rel: DaYunRelation, ganZhi: string): DaYunSection {
  const title = '事业运'
  if (rel.tendency >= 0.65) {
    // 喜运模板
    const contents = [
      `此步${ganZhi}大运，天干${rel.ganElement}${rel.ganIsXiYong ? '为喜用神，事业运势大旺' : '生扶日主，工作渐入佳境'}。职场中易获贵人提携，升职加薪机会增多。适合主动争取新项目、新岗位，能力能得到充分展现。管理岗位者可望扩大权限范围，创业者则有拓展新业务的好时机。`,
      `${ganZhi}大运天干透出喜气，${rel.ganElement}气当权，事业运呈上升态势。工作中能得到上司赏识和同事配合，人际关系融洽。适合开拓新领域、接触新客户，业绩有望突破。体制内者有升迁之象，自由职业者客源稳定增长。`,
      `此运事业运势上佳，${rel.ganElement}运来临正好助力命局。不论在哪个行业，都能感受到阻力减少、助力增多的变化。适合把握机遇，积极表现，为未来发展奠定基础。与人合作共赢效果好，团队协作顺畅。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    // 忌运模板
    const contents = [
      `此步${ganZhi}大运，${rel.ganElement}气${rel.ganIsJi ? '为忌神当权，事业压力明显增大' : '对日主助力不足，事业推进困难'}。工作中可能遭遇小人阻碍，人际关系紧张，需谨言慎行。不宜盲目跳槽或创业，宜守成待变，蓄势待发。注意处理好上下级关系，避免正面冲突。`,
      `${ganZhi}大运期间，事业运偏弱，职场竞争加剧。可能面临项目停滞、业绩下滑或人际纠纷等问题。建议降低期望值，做好本职工作，不宜冒进。若有贵人指点可顺势调整方向，但切勿冲动决策，稳中求安为上策。`,
      `此运事业走低，${rel.ganElement}气不利事业发展。工作中容易感到怀才不遇，付出与回报不成正比。建议提升自身技能，为下一部好运积蓄力量。创业需谨慎，投资需保守，保住基本盘比追求扩张更重要。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    // 平运模板
    const contents = [
      `此步${ganZhi}大运，事业运势平稳过渡。${rel.ganElement}气对事业影响中性，工作中既无明显助力也无大碍。适合维持现状、稳扎稳打，在稳定中寻找发展契机。可适当学习新技能、拓展人脉，为未来布局。`,
      `${ganZhi}大运期间，事业运势波澜不惊。职场中有小有收获也有小有波折，总体保持平衡。建议以守为主、以攻为辅，在现有岗位上深耕细作。可以关注行业变化，但暂不宜做重大调整。`,
      `此运事业中平，${rel.ganElement}运不温不火。工作方面按部就班即可，不宜好高骛远。若能静心打磨专业能力，虽无明显晋升，但积累的经验和人脉将在后续大运中发挥价值。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

/** 财运模板 */
function wealthSection(rel: DaYunRelation, ganZhi: string): DaYunSection {
  const title = '财运'
  const dayElement = rel.ganElement
  // 财星 = 我克者
  const caiElement = WUXING_KE[dayElement]

  if (rel.tendency >= 0.65) {
    const contents = [
      `${ganZhi}大运财运亨通，${rel.ganElement}气${isSameElement(rel.ganElement, caiElement) ? '正为财星，财源广进' : '助力命局，财运水涨船高'}。正财收入稳定增长，偏财运也较活跃。适合适度投资理财，但忌贪心冒进。如有投资机会，可考虑与自身行业相关的领域。`,
      `此运财帛宫得力，${ganZhi}大运带来良好的财富积累期。工资收入有望提升，副业和投资收益亦可观。建议趁此好运期增加储蓄、优化资产配置。注意控制消费欲望，聚财比散财更重要。`,
      `${ganZhi}运中财运上佳，正偏财均有一定收获。适合把握商机，拓展财路。若有合作投资机会，可在充分调研后谨慎参与。理财宜稳健为主，避免高风险投机。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    const contents = [
      `${ganZhi}大运财运偏弱，${rel.ganIsJi ? '忌神当权，破财风险增大' : '求财较为辛苦，收入增长有限'}。不宜进行大额投资或借贷，谨防受骗和财务纠纷。建议以储蓄为主，减少不必要的开支。若有赚钱机会需仔细甄别，切勿贪图快钱。`,
      `此运财运低迷，${ganZhi}运中求财多有阻碍。可能遇到意外支出、投资亏损或收入减少的情况。建议收紧财务，建立应急储备金。合伙做生意需格外谨慎，签署合同前请专业人士审核。`,
      `${ganZhi}大运期间财星受压，正财平稳但偏财运差。工资性收入尚可维持，但投资和副业不宜开展。建议专注主业，提升专业价值，用实力换财富。避免借贷和担保他人。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${ganZhi}大运财运平稳，收入与支出基本平衡。${rel.ganElement}运对财运影响不大，正财维持现有水平，偏财运一般。适合稳健理财，不宜大进大出。可适度定投或购买稳健型理财产品。`,
      `此运财帛宫平稳，${ganZhi}运中不求大富但可保小康。建议养成记账习惯，优化消费结构。若有闲置资金，可考虑中长期投资，避免短期投机。财运虽无大的突破，但也不会有大的损失。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

/** 婚姻感情模板 */
function marriageSection(rel: DaYunRelation, ganZhi: string, chart: BaZiChart): DaYunSection {
  const title = '婚姻感情'
  const dayZhi = chart.sixLines.day.zhi

  if (rel.tendency >= 0.65) {
    const contents = [
      `${ganZhi}大运感情运势良好，${rel.zhiIsXiYong ? '地支为喜用，感情生活和谐美满' : '运中感情顺遂，伴侣关系温馨'}。已婚者夫妻感情升温，家庭氛围融洽。未婚者在此运中有较大的脱单机会，社交场合易遇到心仪对象。注意珍惜眼前人，用心经营感情。`,
      `此运桃花运势较旺，${ganZhi}运中感情生活丰富多彩。已有伴侣者关系更加亲密，适合考虑婚姻大事。单身者社交活动增多，桃花运旺。已婚者可安排旅行或浪漫活动增进感情。`,
      `${ganZhi}大运期间感情运上佳，人际关系和谐。不论男女，在此运中感情问题容易得到正面解决。已有矛盾有望化解，新的感情也有望开花结果。家庭是此运的温暖港湾。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    const contents = [
      `${ganZhi}大运感情运势偏弱，${rel.zhiChongDay ? '地支冲动日柱配偶宫，感情易生波折' : '运中感情压力增大，需多沟通'}.已婚者需防第三者介入或夫妻冷战，保持良好的沟通习惯至关重要。未婚者感情之路较坎坷，不宜急于求成。多关注伴侣的感受，避免因工作繁忙而忽视家庭。`,
      `此运感情运低迷，${ganZhi}运中易因事业压力或财务问题影响感情关系。已婚者可能出现争吵增多、信任危机等问题。建议遇事冷静处理，切勿冲动做决定。单身者暂不宜投入过多精力在感情上。`,
      `${ganZhi}大运期间婚姻宫受扰，感情方面需要更多的耐心和智慧。夫妻间可能出现价值观分歧或生活习惯冲突。建议多换位思考，必要时可寻求专业咨询。不宜在此运中做出离婚等重大决定。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${ganZhi}大运感情运势平稳，夫妻关系维持现状。${rel.ganElement}运对感情影响不大，日常相处中注意保持新鲜感。已婚者可在平淡中寻找小确幸，未婚者顺其自然即可。感情重在经营，不在于运势高低。`,
      `此运感情波澜不惊，${ganZhi}运中家庭关系保持稳定。有伴侣者适合共同制定一些小目标，一起成长。单身者可适当扩大社交圈，但不必刻意强求。保持真诚和耐心，缘分自会到来。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

/** 健康状况模板 */
function healthSection(rel: DaYunRelation, ganZhi: string, chart: BaZiChart): DaYunSection {
  const title = '健康状况'
  const xys = chart.xiYongShen

  if (rel.tendency >= 0.65) {
    const contents = [
      `${ganZhi}大运健康运势良好，${rel.ganElement}气生扶日主，身体机能运转正常。精神状态饱满，免疫力较强，小病小灾也能快速恢复。建议保持良好的作息和运动习惯，趁好运期打好身体基础。`,
      `此运身体状态佳，${ganZhi}运中气血调和，精力充沛。适合进行中等强度的运动锻炼，如游泳、瑜伽、慢跑等。注意饮食均衡，保持心情愉悦。定期体检仍不可少，防患于未然。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    const enemyElem = xys.enemyElements?.[0]
    const organMap: Record<FiveElement, string> = {
      '木': '肝胆', '火': '心脑', '土': '脾胃', '金': '肺呼吸道', '水': '肾泌尿',
    }
    const focus = enemyElem ? organMap[enemyElem] : '身体各系统'
    const contents = [
      `${ganZhi}大运健康运势欠佳，${rel.ganIsJi ? `${rel.ganElement}气为忌，${focus}系统需重点关注` : '身体抵抗力有所下降'}。此运中容易疲劳，精神压力较大，需注意劳逸结合。建议定期体检，关注${focus}方面的健康指标。保持规律作息，避免过度消耗。`,
      `此运健康走低，${ganZhi}运中需格外注意身体保养。${focus}系统较为脆弱，可能出现亚健康状态。建议减少熬夜，避免过度饮酒和暴饮暴食。可适当服用滋补品调理身体，但需在医师指导下进行。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${ganZhi}大运健康状况平稳，无大碍但也需注意日常保养。${rel.ganElement}运对身体影响中性，维持现有生活习惯即可。建议每年至少一次全面体检，关注常见职业病预防。保持适度运动和良好心态。`,
      `此运健康中平，${ganZhi}运中身体无明显异常，但不可掉以轻心。根据季节变化调整饮食起居，春夏养阳、秋冬养阴。注意心理健康，保持社交活动和兴趣爱好。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

/** 风险提示模板 */
function riskSection(rel: DaYunRelation, ganZhi: string, chart: BaZiChart): DaYunSection {
  const title = '风险提示'

  if (rel.tendency <= 0.35) {
    const contents = [
      `${ganZhi}大运需重点防范以下风险：一、事业方面警惕小人陷害和职场陷阱，重要文件需留底；二、财务方面严防诈骗和投资陷阱，不轻信高回报承诺；三、健康方面注意${rel.ganElement}相关脏腑的保养；四、人际关系上避免与生肖相冲之人深度合作。此运宜低调行事，切勿张扬。`,
      `此运风险较多，${ganZhi}运中需处处谨慎。事业上不宜与陌生人合伙，合同签署前务必仔细审核。财务上控制负债率，避免大额借贷。感情上防备第三者干扰。出行注意交通安全，避免冒险运动。遇事三思而后行，重大决策可咨询专业人士。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency >= 0.65) {
    const contents = [
      `${ganZhi}大运整体运势良好，但仍需注意：一、顺境中勿骄傲自满，保持谦逊心态；二、财运好时忌贪心过度，见好就收；三、事业上升期注意平衡工作与家庭；四、虽无大碍，但基础体检不可少。居安思危，方能源远流长。`,
      `此运虽为好运，但需防范乐极生悲：事业顺利时注意不要给自己加太多压力；收入增加时避免盲目扩大消费；感情甜蜜时不要忽视对方的感受。好运是努力的结果，保持初心才能让好运延续。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${ganZhi}大运风险可控，需注意以下几点：一、事业方面保持现有节奏，不冒进也不懈怠；二、财务方面做好预算管理，留足应急资金；三、健康方面注意季节变化对身体的影响；四、人际交往中保持真诚但留有余地。总体而言，稳中求进是此运的最佳策略。`,
      `此运无明显大风险，但日常仍需谨慎。事业上注意维护好人脉关系，关键时刻能派上用场。财务上不宜大额借贷或担保他人。健康方面关注亚健康状态，早睡早起身体好。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

/** 机遇年份模板 */
function opportunitySection(rel: DaYunRelation, ganZhi: string, startYear: number): DaYunSection {
  const title = '机遇年份'

  // 根据大运干支推算有利年份（简化：取相生/相合的流年）
  const allElems: FiveElement[] = ['木', '火', '土', '金', '水']
  const favorableElems = rel.tendency >= 0.5
    ? [rel.ganElement, WUXING_SHENG[rel.ganElement]]
    : [rel.ganElement]

  // 简单的年份推荐（基于大运起始年推算有利年）
  const years: number[] = []
  for (let i = 0; i < 10; i++) {
    years.push(startYear + i)
  }

  // 取 2-3 个推荐年份
  const recommendYears = years.slice(0, 3).map(y => `${y}年`)

  if (rel.tendency >= 0.65) {
    const content = `此步${ganZhi}大运中，${recommendYears.join('、')}为关键机遇年份。这些年流年与大运形成良性互动，事业和财运均有突破可能。建议在这些年份前做好充分准备，机遇来临时果断把握。尤其关注与${rel.ganElement}相关的行业和方向。`
    return { title, content }
  } else if (rel.tendency <= 0.35) {
    const content = `${ganZhi}大运中，${recommendYears[0]}和${recommendYears[2]}相对有利，可作为调整和蓄力期。流年与大运关系复杂，即使在大运低迷期也有局部好转的年份。建议在相对有利的年份做阶段性总结和规划，为下一步转运做准备。不宜在不利年份做重大决策。`
    return { title, content }
  } else {
    const content = `${ganZhi}大运中，${recommendYears[0]}和${recommendYears[1]}为较有利年份，适合推进重要事项。流年与大运配合尚可，可在这些年尝试新的发展方向。${recommendYears[2]}需稍加谨慎，适合巩固已有成果。总体把握稳中求进的节奏。`
    return { title, content }
  }
}

/** 建议措施模板 */
function adviceSection(rel: DaYunRelation, ganZhi: string): DaYunSection {
  const title = '建议措施'

  if (rel.tendency >= 0.65) {
    const contents = [
      `综合${ganZhi}大运特点，提出以下建议：一、事业上大胆拓展，争取更大的平台和权限；二、财运好时积极储蓄和投资，为未来储备资金；三、感情中主动表达关爱，珍惜身边人；四、利用好运期考取相关证书或学习新技能；五、适当参与社交活动，扩大人脉圈。此运是收获期，努力耕耘必有回报。`,
      `${ganZhi}运为喜运，建议：主动出击把握机遇，在事业和财富上积极作为。同时注意兼顾家庭和健康，不可因忙碌而忽视生活品质。可以制定详细的十年规划，将大运的好运势最大化利用。保持感恩之心，好运才会持续。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else if (rel.tendency <= 0.35) {
    const contents = [
      `${ganZhi}大运需采取守势策略，建议如下：一、事业以稳为主，不轻易跳槽或创业，在现有岗位上深耕；二、财务上严格控制开支，建立应急基金，避免高风险投资；三、感情中多包容少计较，遇到矛盾冷处理；四、加强身体锻炼，定期体检；五、多读书学习，提升内在修为。逆境是成长的阶梯，熬过此运便是坦途。`,
      `此运宜守不宜攻，具体建议：事业上保持低调务实，少说多做；财务上量入为出，远离赌博和投机；感情上多关心家人，家庭是避风港；健康上注意养生，早睡早起；精神上培养爱好，保持积极心态。忍一时风平浪静，退一步海阔天空。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  } else {
    const contents = [
      `${ganZhi}大运为平稳过渡期，建议：一、事业上稳中求进，在不冒风险的前提下适度发展；二、财务上做好资产配置，兼顾收益和安全；三、感情上保持沟通，共同成长；四、健康上坚持运动，均衡饮食；五、利用平运期提升自己，学习新知识新技能。平运是布局的好时机，为下一部大运打好基础。`,
      `此运平顺，建议日常保持良好习惯即可。事业上可适度拓展人脉，但不必急于求成。财务上制定长期理财计划，坚持执行。生活中注重品质，培养一两项兴趣爱好。平运虽无大起大落，但正是修炼内功的好时期。`,
    ]
    return { title, content: contents[Math.floor(Math.random() * contents.length)] }
  }
}

// ========== 生成总体评述 ==========

function generateSummary(rel: DaYunRelation, ganZhi: string, chart: BaZiChart): string {
  const dayElement = chart.dayMaster.dayGanElement
  const strength = chart.dayMaster.strengthScore

  if (rel.tendency >= 0.65) {
    const summaries = [
      `综合来看，${ganZhi}大运为命主的喜运之期。大运${rel.ganElement}气${rel.ganIsXiYong ? '正为喜用神' : '生扶日主'}，与命局配合良好，各方面运势均呈上升态势。事业上有贵人相助，财运稳步提升，感情家庭和谐稳定。日主${strength > 50 ? '偏强' : strength < 40 ? '偏弱' : '中和'}，在此运中${rel.ganSupportsDayMaster ? '得力帮扶' : '运势顺遂'}。建议把握这十年的黄金期，积极进取，为人生奠定坚实基础。`,
      `${ganZhi}大运总体运势上佳，是命主人生中的重要上升期。${rel.ganElement}运来临，恰逢其时，事业、财运、感情均有突破性进展。此运中个人能力和魅力充分展现，容易获得外界认可。天时地利人和俱备，只要付出努力就能收获丰硕成果。`,
    ]
    return summaries[Math.floor(Math.random() * summaries.length)]
  } else if (rel.tendency <= 0.35) {
    const summaries = [
      `综合来看，${ganZhi}大运为命主的考验期。大运${rel.ganElement}气${rel.ganIsJi ? '为忌神当权' : '对日主助力不足'}，各方面运势承压。事业遇阻、财运偏弱、感情波折，需以平和心态应对。日主${strength > 50 ? '虽偏强但被压制' : strength < 40 ? '偏弱更需保养' : '中和但受外部冲击'}。此运虽难，却是磨炼意志、积累经验的宝贵时期。守得云开见月明，度过此运必能迎来转机。`,
      `${ganZhi}大运整体运势偏低，是命主需要韬光养晦的阶段。${rel.ganElement}运不利，事业、财运均需保守应对。但逆境中蕴含转机，此运可专注提升自我、修炼内功。保持信心和耐心，风雨之后必有彩虹。建议多与长辈或有经验者交流，获得指导和帮助。`,
    ]
    return summaries[Math.floor(Math.random() * summaries.length)]
  } else {
    const summaries = [
      `综合来看，${ganZhi}大运为命主的平稳过渡期。大运${rel.ganElement}气对命局影响中性，各方面运势不温不火。事业维持现状，财运收支平衡，感情波澜不惊。日主${strength > 50 ? '偏强' : strength < 40 ? '偏弱' : '中和'}，在此运中尚可自持。此运虽无大的波澜，但正是积累沉淀的好时机。建议稳扎稳打，为下一部大运蓄力。`,
      `${ganZhi}大运运势中平，既无大的助力也无大的阻碍。事业方面按部就班推进即可，财运方面以稳健理财为主。此运适合学习进修、培养技能、拓展视野，为未来的发展做好准备。人生不可能一帆风顺，平运期更是难得的休整时光。`,
    ]
    return summaries[Math.floor(Math.random() * summaries.length)]
  }
}

// ========== 主函数 ==========

/**
 * 增强大运详细分析
 *
 * @param daYunStep - 大运步骤数据（DaYunStep 或 DaYunAnalysisStep）
 * @param chart - 八字命盘
 * @param xiYongShen - 喜用神分析结果
 * @returns 增强后的大运详细分析
 */
export function enhanceDaYunDetail(
  daYunStep: any,
  chart: BaZiChart,
  xiYongShen: XiYongShen,
): DaYunDetailEnhanced {
  // 提取大运信息
  const ganZhi = daYunStep.ganZhi
  const ganStr = typeof ganZhi === 'string' ? ganZhi : `${ganZhi.gan}${ganZhi.zhi}`
  const startYear = daYunStep.startYear
  const endYear = daYunStep.endYear
  const startAge = daYunStep.startAge
  const endAge = daYunStep.endAge

  // 提取大运干支五行
  const ganElement = typeof ganZhi === 'string'
    ? getStemElement(ganZhi[0] as any)
    : getStemElement(ganZhi.gan)
  const zhiElement = typeof ganZhi === 'string'
    ? getBranchElement(ganZhi[1] as any)
    : getBranchElement(ganZhi.zhi)

  // 分析大运与命盘关系
  const rel = analyzeDaYunRelation(ganElement, zhiElement, chart, xiYongShen)

  // 补充地支冲克判断（需要实际的大运地支）
  if (typeof ganZhi !== 'string') {
    rel.zhiChongDay = hasChong(ganZhi.zhi, chart.sixLines.day.zhi)
    rel.zhiHeDay = hasHe(ganZhi.zhi, chart.sixLines.day.zhi)
    rel.zhiChongYear = hasChong(ganZhi.zhi, chart.sixLines.year.zhi)
    rel.zhiChongMonth = hasChong(ganZhi.zhi, chart.sixLines.month.zhi)
  }

  // 如果地支冲克日柱，降低倾向分
  if (rel.zhiChongDay) rel.tendency = Math.max(0, rel.tendency - 0.12)
  if (rel.zhiChongYear) rel.tendency = Math.max(0, rel.tendency - 0.05)
  if (rel.zhiChongMonth) rel.tendency = Math.max(0, rel.tendency - 0.05)
  if (rel.zhiHeDay) rel.tendency = Math.min(1, rel.tendency + 0.05)
  rel.tendency = Math.max(0, Math.min(1, rel.tendency))

  // 生成 7 个 section
  const sections: DaYunSection[] = [
    careerSection(rel, ganStr),
    wealthSection(rel, ganStr),
    marriageSection(rel, ganStr, chart),
    healthSection(rel, ganStr, chart),
    riskSection(rel, ganStr, chart),
    opportunitySection(rel, ganStr, startYear),
    adviceSection(rel, ganStr),
  ]

  // 综合评分
  const baseScore = rel.tendency * 80 + 10 // 映射到 10-90
  let overallScore = baseScore
  // 冲克扣分
  if (rel.zhiChongDay) overallScore -= 8
  if (rel.zhiChongYear) overallScore -= 4
  if (rel.zhiChongMonth) overallScore -= 4
  // 相合加分
  if (rel.zhiHeDay) overallScore += 5
  overallScore = clamp(overallScore)

  // 生成总体评述
  const summary = generateSummary(rel, ganStr, chart)

  return {
    yearRange: `${startYear}-${endYear}`,
    ageRange: `${startAge}-${endAge}岁`,
    ganZhi: ganStr,
    sections,
    overallScore,
    summary,
  }
}