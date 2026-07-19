/**
 * baziFengShuiLink.ts — 八字 x 风水联动分析模块
 *
 * 基于命盘喜用神五行推算风水布局建议，不修改原有风水模块。
 * 核心逻辑：五行 → 方位/颜色/数字/楼层/布局 的完整映射。
 */

import type {
  BaZiChart,
  FiveElement,
  ShenShi,
  EarthlyBranch,
} from './types'

// ---------------------------------------------------------------------------
// 接口定义
// ---------------------------------------------------------------------------

export interface DirectionAdvice {
  direction: string        // 方位名称（东方/南方/中央/西方/北方）
  element: FiveElement     // 对应五行
  score: number            // 适配分数 0-100
  usage: string            // 使用建议
  isFavorable: boolean     // 是否为有利方位
}

export interface LayoutAdvice {
  type: string             // 布局类型（书房型/创意型/稳定型等）
  position: string         // 推荐位置
  facing: string           // 朝向建议
  taboos: string[]          // 禁忌事项
  tips: string[]            // 布局建议
  description: string       // 详细说明
}

export interface WealthPositionAdvice {
  position: string          // 财位名称
  direction: string        // 所在方位
  element: FiveElement     // 对应五行
  tips: string[]             // 布局建议
}

export interface ColorAdvice {
  color: string            // 颜色名称
  hex: string               // 十六进制色值
  element: FiveElement      // 对应五行
  type: 'lucky' | 'avoid'  // 幸运/忌讳
  description: string
}

export interface FloorAdvice {
  floor: string             // 楼层描述（如"1层、6层"）
  element: FiveElement       // 对应五行
  score: number             // 适配分数
  reason: string           // 推荐原因
}

export interface BaziFengShuiLinkResult {
  favorableDirections: DirectionAdvice[]     // 有利方位（4个）
  officeLayout: LayoutAdvice[]              // 办公室布局建议
  bedroomLayout: LayoutAdvice[]             // 卧室布局建议
  bedDirection: string                      // 床位朝向建议
  wealthPositions: WealthPositionAdvice[]   // 财位建议
  luckyColors: ColorAdvice[]                // 幸运颜色
  unluckyColors: ColorAdvice[]              // 忌讳颜色
  luckyNumbers: number[]                    // 幸运数字
  unluckyNumbers: number[]                  // 忌讳数字
  luckyFloors: FloorAdvice[]               // 幸运楼层
  summary: string                           // 总体风水建议，200字
}

// ---------------------------------------------------------------------------
// 常量映射表
// ---------------------------------------------------------------------------

/** 五行 → 方位映射 */
const ELEMENT_DIRECTION_MAP: Record<FiveElement, string> = {
  '木': '东方',
  '火': '南方',
  '土': '中央',
  '金': '西方',
  '水': '北方',
}

/** 五行 → 四隅子方位（土行扩展） */
const ELEMENT_SUB_DIRECTION_MAP: Record<FiveElement, string[]> = {
  '木': ['正东', '东南偏东'],
  '火': ['正南', '东南偏南'],
  '土': ['中央', '东北', '西南', '西北偏南', '东南偏东'],
  '金': ['正西', '西北偏西'],
  '水': ['正北', '东北偏北'],
}

/** 五行 → 颜色映射 */
const ELEMENT_COLOR_MAP: Record<FiveElement, { color: string; hex: string }[]> = {
  '木': [
    { color: '绿色', hex: '#4CAF50' },
    { color: '青色', hex: '#009688' },
    { color: '翠色', hex: '#2E7D32' },
  ],
  '火': [
    { color: '红色', hex: '#F44336' },
    { color: '紫色', hex: '#9C27B0' },
    { color: '橙色', hex: '#FF9800' },
  ],
  '土': [
    { color: '黄色', hex: '#FFC107' },
    { color: '棕色', hex: '#795548' },
    { color: '米色', hex: '#D2B48C' },
  ],
  '金': [
    { color: '白色', hex: '#FFFFFF' },
    { color: '金色', hex: '#FFD700' },
    { color: '银色', hex: '#C0C0C0' },
  ],
  '水': [
    { color: '黑色', hex: '#212121' },
    { color: '蓝色', hex: '#2196F3' },
    { color: '深灰', hex: '#616161' },
  ],
}

/** 五行 → 河图洛书数字 */
const ELEMENT_NUMBER_MAP: Record<FiveElement, number[]> = {
  '水': [1, 6],
  '火': [2, 7],
  '木': [3, 8],
  '金': [4, 9],
  '土': [5, 10],
}

/** 五行 → 楼层映射 */
const ELEMENT_FLOOR_MAP: Record<FiveElement, { floors: string; score: number; reason: string }> = {
  '水': { floors: '1层、6层、11层、16层、21层、26层', score: 90, reason: '水行尾数为1、6的楼层，利智慧与流动' },
  '火': { floors: '2层、7层、12层、17层、22层、27层', score: 88, reason: '火行尾数为2、7的楼层，利热情与上升' },
  '木': { floors: '3层、8层、13层、18层、23层、28层', score: 85, reason: '木行尾数为3、8的楼层，利生长与发展' },
  '金': { floors: '4层、9层、14层、19层、24层、29层', score: 87, reason: '金行尾数为4、9的楼层，利收敛与聚财' },
  '土': { floors: '5层、10层、15层、20层、25层、30层', score: 86, reason: '土行尾数为5、10的楼层，利稳重与根基' },
}

/** 地支 → 方位映射 */
const BRANCH_DIRECTION_MAP: Record<EarthlyBranch, string> = {
  '子': '正北', '丑': '东北偏北', '寅': '东北', '卯': '正东',
  '辰': '东南偏东', '巳': '东南', '午': '正南', '未': '西南偏南',
  '申': '西南', '酉': '正西', '戌': '西北偏西', '亥': '西北',
}

/** 地支 → 五行映射 */
const BRANCH_ELEMENT_MAP: Record<string, FiveElement> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

/** 十神 → 办公布局类型 */
const SHISHI_OFFICE_MAP: Record<string, { type: string; position: string; facing: string; taboos: string[]; tips: string[] }> = {
  '正官': {
    type: '管理型',
    position: '办公室宜选在正对门口的位置',
    facing: '坐北朝南或坐西朝东，背靠实墙',
    taboos: ['不宜背门而坐', '不宜在横梁下方', '不宜正对厕所'],
    tips: ['办公桌左侧宜高（青龙位）', '可摆放泰山石或文昌塔增强权威感', '桌面上可放置与官星五行相关的物品'],
  },
  '偏官': {
    type: '领导型',
    position: '办公室宜选在角落位置（利于掌控全局）',
    facing: '坐实朝虚，背后有靠山',
    taboos: ['不宜背门坐', '不宜座位背后有窗', '不宜正对电梯口'],
    tips: ['办公桌宜大不宜小', '可放置金属质感的装饰品增强决断力', '保持办公区域整洁有序'],
  },
  '正印': {
    type: '书房型',
    position: '安静的区域，远离喧闹',
    facing: '面向喜用方位，自然采光充足',
    taboos: ['不宜在嘈杂区域', '不宜正对卫生间', '不宜背对窗户'],
    tips: ['书架上可放置专业书籍', '桌面宜放置文房四宝或绿植', '保持环境安静，利于思考学习'],
  },
  '偏印': {
    type: '研究型',
    position: '独立的角落或隔间',
    facing: '面向采光好的方向',
    taboos: ['不宜开放式办公', '不宜频繁被打扰', '桌面上不宜杂乱'],
    tips: ['可放置个人灵感墙或白板', '电脑屏幕不宜正对门口', '适合独立思考的布局'],
  },
  '食神': {
    type: '创意型',
    position: '靠近窗户或自然光源的位置',
    facing: '面向开阔视野的方向',
    taboos: ['不宜封闭隔间', '不宜面对空白墙壁', '环境不宜过于压抑'],
    tips: ['桌面可放置创意摆件或艺术品', '色彩搭配丰富活泼', '可摆放绿植增强灵感'],
  },
  '伤官': {
    type: '表现型',
    position: '开放区域的中心位置',
    facing: '面向人群活动的方向',
    taboos: ['不宜角落位置', '不宜背对全团队', '不宜过于封闭'],
    tips: ['办公区域可适当个性化装饰', '保持与团队成员的视线交流', '可放置展示作品的空间'],
  },
  '正财': {
    type: '稳健型',
    position: '稳定且安静的位置',
    facing: '坐实朝虚，面向采光方向',
    taboos: ['不宜正对大门', '不宜在走动频繁的通道旁', '不宜头顶横梁'],
    tips: ['办公桌保持整洁有序', '可放置与财务相关的吉祥物', '左侧（青龙位）宜高于右侧'],
  },
  '偏财': {
    type: '商贸型',
    position: '靠近入口或人流较多的位置',
    facing: '面向门口或接待区域',
    taboos: ['不宜在死角位置', '不宜完全封闭', '不宜面对墙壁'],
    tips: ['可放置招财摆件如貔貅、金蟾', '接待区域宜宽敞明亮', '保持气流通畅'],
  },
  '比肩': {
    type: '协作型',
    position: '靠近团队成员的位置',
    facing: '面向团队协作区域',
    taboos: ['不宜完全隔离', '不宜背对团队', '不宜独自在角落'],
    tips: ['办公桌间保持适当间距', '可设置小型交流讨论区', '利于团队合作的布局'],
  },
  '劫财': {
    type: '竞争型',
    position: '独立但视野开阔的位置',
    facing: '面向全局视野的方向',
    taboos: ['不宜与同事过于靠近', '不宜正面相对', '不宜共享办公桌'],
    tips: ['可设置个人私密空间', '桌面可放置提升决断力的物品', '保持适度的竞争氛围'],
  },
}

/** 默认办公室布局 */
const DEFAULT_OFFICE_LAYOUT: { type: string; position: string; facing: string; taboos: string[]; tips: string[] } = {
  type: '通用型',
  position: '面向喜用方位',
  facing: '背靠实墙，面向采光好的方向',
  taboos: ['不宜背门而坐', '不宜正对厕所', '不宜在横梁下'],
  tips: ['办公桌左侧宜高', '保持桌面整洁', '可放置与喜用五行相关的物品'],
}

// ---------------------------------------------------------------------------
// 核心函数
// ---------------------------------------------------------------------------

export function generateBaziFengShuiLink(
  chart: BaZiChart,
  xiYongShen?: any
): BaziFengShuiLinkResult {
  const xy = resolveXiYongShen(chart, xiYongShen)
  const sl = chart.sixLines
  const dm = chart.dayMaster

  const favorableDirections = analyzeDirections(xy, sl)
  const officeLayout = analyzeOfficeLayout(xy, sl, dm)
  const bedroomLayout = analyzeBedroomLayout(xy, sl, dm)
  const bedDirection = analyzeBedDirection(xy, sl)
  const wealthPositions = analyzeWealthPositions(xy, sl)
  const luckyColors = analyzeColors(xy.happyElements, 'lucky')
  const unluckyColors = analyzeColors(xy.jiElements, 'avoid')
  const luckyNumbers = analyzeNumbers(xy.happyElements)
  const unluckyNumbers = analyzeNumbers(xy.jiElements)
  const luckyFloors = analyzeFloors(xy.happyElements, xy.jiElements)
  const summary = generateSummary(chart, xy)

  return {
    favorableDirections,
    officeLayout,
    bedroomLayout,
    bedDirection,
    wealthPositions,
    luckyColors,
    unluckyColors,
    luckyNumbers,
    unluckyNumbers,
    luckyFloors,
    summary,
  }
}

// ---------------------------------------------------------------------------
// 内部分析函数
// ---------------------------------------------------------------------------

interface ResolvedXiYong {
  happyElements: FiveElement[]
  jiElements: FiveElement[]
  bestElement: FiveElement
}

function resolveXiYongShen(chart: BaZiChart, xiYongShen?: any): ResolvedXiYong {
  const xy = xiYongShen || chart.xiYongShen
  const bestElement: FiveElement = xy.bestElement || xy.firstHappy || '木'
  const happyElements: FiveElement[] = [
    xy.bestElement || xy.firstHappy,
    (xy as any).secondHappy,
    (xy as any).thirdHappy,
    (xy as any).usageElement || (xy as any).firstUsage,
  ].filter((el): el is FiveElement => !!el && ['木', '火', '土', '金', '水'].includes(el))

  const jiElements: FiveElement[] = (xy.avoidedElements || []).filter(
    (el: FiveElement) => ['木', '火', '土', '金', '水'].includes(el)
  )

  return { happyElements, jiElements, bestElement }
}

/** 分析有利方位（返回4个） */
function analyzeDirections(xy: ResolvedXiYong, sl: any): DirectionAdvice[] {
  const allFive: FiveElement[] = ['木', '火', '土', '金', '水']
  const results: DirectionAdvice[] = []

  for (const el of allFive) {
    const isHappy = xy.happyElements.includes(el)
    const isJi = xy.jiElements.includes(el)

    let score = 50
    if (isHappy) score = 90
    else if (isJi) score = 25
    else score = 55

    // 喜用神的第一五行加分
    if (el === xy.bestElement) score = Math.min(98, score + 8)

    results.push({
      direction: ELEMENT_DIRECTION_MAP[el],
      element: el,
      score,
      usage: isHappy
        ? `适合作为${ELEMENT_DIRECTION_MAP[el]}朝向或工作方位`
        : isJi
        ? `不宜作为主要朝向，需避开`
        : '方位中性，可作为备选',
      isFavorable: isHappy,
    })
  }

  return results.sort((a, b) => b.score - a.score).slice(0, 4)
}

/** 分析办公室布局 */
function analyzeOfficeLayout(xy: ResolvedXiYong, sl: any, dm: any): LayoutAdvice[] {
  // 根据月干十神确定基础布局类型
  const monthShenShi: ShenShi = (sl.month.shenShi as ShenShi) || '正官'
  const hourShenShi: ShenShi = (sl.hour.shenShi as ShenShi) || '比肩'
  const dayShenShi: ShenShi = (sl.day.shenShi as ShenShi) || '正财'

  const layouts: LayoutAdvice[] = []

  // 主布局：基于月柱十神
  const monthLayout = SHISHI_OFFICE_MAP[monthShenShi] || DEFAULT_OFFICE_LAYOUT
  layouts.push({
    type: monthLayout.type,
    position: `${monthLayout.position}，面向${ELEMENT_DIRECTION_MAP[xy.bestElement]}`,
    facing: monthLayout.facing,
    taboos: [...monthLayout.taboos],
    tips: [
      ...monthLayout.tips,
      `桌面宜放置${xy.bestElement}行相关的物品（如${xy.bestElement === '木' ? '绿植' : xy.bestElement === '火' ? '红色台灯' : xy.bestElement === '土' ? '陶瓷摆件' : xy.bestElement === '金' ? '金属笔筒' : '鱼缸或流水摆件'}）`,
    ],
    description: `基于月柱${sl.month.gan}${sl.month.zhi}（${monthShenShi}）分析，您的办公室适合${monthLayout.type}布局。`,
  })

  // 副布局：基于时柱十神（若与月柱不同）
  if (hourShenShi !== monthShenShi) {
    const hourLayout = SHISHI_OFFICE_MAP[hourShenShi] || DEFAULT_OFFICE_LAYOUT
    layouts.push({
      type: hourLayout.type,
      position: hourLayout.position,
      facing: `${hourLayout.facing}，朝${ELEMENT_DIRECTION_MAP[xy.bestElement]}`,
      taboos: hourLayout.taboos,
      tips: hourLayout.tips,
      description: `基于时柱${sl.hour.gan}${sl.hour.zhi}（${hourShenShi}）分析，可辅以${hourLayout.type}布局元素。`,
    })
  }

  return layouts
}

/** 分析卧室布局 */
function analyzeBedroomLayout(xy: ResolvedXiYong, sl: any, dm: any): LayoutAdvice[] {
  const dayZhi: EarthlyBranch = sl.day.zhi as EarthlyBranch
  const dayZhiElement: FiveElement = BRANCH_ELEMENT_MAP[dayZhi] || '土'
  const dayZhiDir = BRANCH_DIRECTION_MAP[dayZhi]

  const layouts: LayoutAdvice[] = []

  // 主布局：基于日支（夫妻宫）+ 喜用神
  const isDayZhiHappy = xy.happyElements.includes(dayZhiElement)
  layouts.push({
    type: isDayZhiHappy ? '和谐型' : '调和型',
    position: `卧室宜设在住宅的${ELEMENT_DIRECTION_MAP[xy.bestElement]}方位`,
    facing: `门朝${ELEMENT_DIRECTION_MAP[xy.bestElement]}或窗户面向喜用方位`,
    taboos: [
      '不宜正对大门',
      '不宜在厨房正下方',
      '不宜镜子正对床铺',
      '不宜床头正对窗户',
      '不宜横梁压床',
    ],
    tips: [
      `卧室主色调宜用${xy.bestElement === '木' ? '绿色系' : xy.bestElement === '火' ? '暖色系' : xy.bestElement === '土' ? '米黄色系' : xy.bestElement === '金' ? '白色系' : '深蓝/灰色系'}`,
      `可放置${xy.bestElement === '木' ? '绿植' : xy.bestElement === '火' ? '暖色调灯光' : xy.bestElement === '土' ? '陶瓷装饰' : xy.bestElement === '金' ? '金属装饰' : '水景或鱼缸'}`,
      '保持卧室整洁、通风良好',
      `夫妻宫（日支${dayZhi}）在${dayZhiDir}方位，卧室宜兼顾此方位的能量`,
    ],
    description: `日支${dayZhi}为夫妻宫，${dayZhiElement}行，${isDayZhiHappy ? '与喜用神相合，夫妻感情和谐' : '与喜用神不完全一致，需通过风水布局调和'}。卧室整体宜以${xy.bestElement}行元素为主调。`,
  })

  // 副布局：基于年支（祖辈宫）
  const yearZhi: EarthlyBranch = sl.year.zhi as EarthlyBranch
  const yearZhiElement: FiveElement = BRANCH_ELEMENT_MAP[yearZhi] || '土'
  if (yearZhiElement !== dayZhiElement) {
    layouts.push({
      type: '补充型',
      position: `可在卧室的${ELEMENT_DIRECTION_MAP[yearZhiElement]}方位放置${yearZhiElement}行装饰品`,
      facing: '与主布局一致',
      taboos: ['不宜过度强化忌神五行'],
      tips: [
        `年支${yearZhi}${yearZhiElement}行代表家族根基，可适度点缀${ELEMENT_COLOR_MAP[yearZhiElement]?.[0]?.color || '中性'}色`,
        '但不宜喧宾夺主，仍以喜用五行为主',
      ],
      description: `年支${yearZhi}${yearZhiElement}行为家族根基五行，可适度融入卧室布局中。`,
    })
  }

  return layouts
}

/** 分析床位朝向 */
function analyzeBedDirection(xy: ResolvedXiYong, sl: any): string {
  const bestDir = ELEMENT_DIRECTION_MAP[xy.bestElement]
  const dayZhi: EarthlyBranch = sl.day.zhi as EarthlyBranch
  const dayZhiDir = BRANCH_DIRECTION_MAP[dayZhi]

  // 床位朝向规则：
  // 1. 床头宜朝喜用方位
  // 2. 不宜正对门/窗/镜
  // 3. 宜坐忌向喜（头朝喜用方）
  const jiDir = xy.jiElements[0] ? ELEMENT_DIRECTION_MAP[xy.jiElements[0]] : ''

  return `床头宜朝${bestDir}（喜用${xy.bestElement}行方位），脚朝${jiDir || '反方向'}（忌神方位）。` +
    `夫妻宫在${dayZhiDir}方位，卧室床位宜与该方位形成呼应。` +
    `具体建议：床头紧贴实墙，面向${bestDir}方向入睡，` +
    `${xy.bestElement === '木' ? '床头可朝正东或东南' : xy.bestElement === '火' ? '床头可朝正南或东南' : xy.bestElement === '土' ? '床头可朝中央区域或四隅' : xy.bestElement === '金' ? '床头可朝正西或西北' : '床头可朝正北或东北'}。` +
    `忌讳：床头不宜正对门口、不宜悬空（上方无支撑）、不宜有横梁压顶。`
}

/** 分析财位 */
function analyzeWealthPositions(xy: ResolvedXiYong, sl: any): WealthPositionAdvice[] {
  const positions: WealthPositionAdvice[] = []

  // 正财位：正财十神对应的喜用方位
  const hasZhengCai = [sl.year.shenShi, sl.month.shenShi, sl.day.shenShi, sl.hour.shenShi].includes('正财')
  const hasPianCai = [sl.year.shenShi, sl.month.shenShi, sl.day.shenShi, sl.hour.shenShi].includes('偏财')

  // 主财位：喜用方位中的第一吉位
  positions.push({
    position: '明财位',
    direction: ELEMENT_DIRECTION_MAP[xy.bestElement],
    element: xy.bestElement,
    tips: [
      `${ELEMENT_DIRECTION_MAP[xy.bestElement]}为您的第一财位方位`,
      `可放置${xy.bestElement === '木' ? '大型绿植如发财树' : xy.bestElement === '火' ? '红色装饰或灯光' : xy.bestElement === '土' ? '陶瓷聚宝盆' : xy.bestElement === '金' ? '铜质貔貅或金蟾' : '鱼缸或流水摆件'}`,
      '保持财位整洁明亮',
      '财位不宜放置重物压住',
      '财位不宜有垃圾桶',
    ],
  })

  // 正财星位置
  if (hasZhengCai) {
    const caiElement: FiveElement = xy.bestElement // 正财以喜用五行方位为财位
    positions.push({
      position: '正财位',
      direction: ELEMENT_DIRECTION_MAP[caiElement],
      element: caiElement,
      tips: [
        `命带正财，${ELEMENT_DIRECTION_MAP[caiElement]}为正财位`,
        '正财位宜放置稳重的摆件，如水晶球、玉石等',
        '此处不宜摆放尖锐物品',
      ],
    })
  }

  // 偏财星位置
  if (hasPianCai) {
    const pianElement: FiveElement = xy.bestElement
    positions.push({
      position: '偏财位',
      direction: ELEMENT_SUB_DIRECTION_MAP[pianElement]?.[1] || ELEMENT_DIRECTION_MAP[pianElement],
      element: pianElement,
      tips: [
        `命带偏财，${ELEMENT_SUB_DIRECTION_MAP[pianElement]?.[1] || ELEMENT_DIRECTION_MAP[pianElement]}为偏财位`,
        '偏财位宜放置招财物件，如貔貅、金蟾等',
        '偏财位可摆放流水摆件，以活水聚财',
      ],
    })
  }

  // 补充：次喜用五行方位也是次财位
  if (xy.happyElements.length > 1) {
    const secondBest = xy.happyElements[1]
    if (secondBest !== xy.bestElement) {
      positions.push({
        position: '暗财位',
        direction: ELEMENT_DIRECTION_MAP[secondBest],
        element: secondBest,
        tips: [
          `${ELEMENT_DIRECTION_MAP[secondBest]}为暗财位方位`,
          '可在此方位放置小型聚财物品',
          '保持此方位光线充足',
        ],
      })
    }
  }

  return positions
}

/** 分析颜色 */
function analyzeColors(elements: FiveElement[], type: 'lucky' | 'avoid'): ColorAdvice[] {
  const results: ColorAdvice[] = []
  for (const el of elements) {
    const colors = ELEMENT_COLOR_MAP[el]
    if (!colors) continue
    const count = type === 'lucky' ? 3 : 2 // 幸运色取3个，忌讳色取2个
    for (const c of colors.slice(0, count)) {
      results.push({
        color: c.color,
        hex: c.hex,
        element: el,
        type,
        description: type === 'lucky'
          ? `${el}行为喜用，${c.color}有利运势，适合日常穿搭、家居装饰。`
          : `${el}行为忌神，${c.color}不利于运势，建议减少使用。`,
      })
    }
  }
  return results
}

/** 分析数字 */
function analyzeNumbers(elements: FiveElement[]): number[] {
  const nums: number[] = []
  for (const el of elements) {
    const mapped = ELEMENT_NUMBER_MAP[el]
    if (mapped) nums.push(...mapped)
  }
  return [...new Set(nums)].sort((a, b) => a - b)
}

/** 分析楼层 */
function analyzeFloors(happyElements: FiveElement[], jiElements: FiveElement[]): FloorAdvice[] {
  const results: FloorAdvice[] = []

  // 幸运楼层
  for (const el of happyElements) {
    const floorInfo = ELEMENT_FLOOR_MAP[el]
    if (floorInfo) {
      results.push({
        floor: floorInfo.floors,
        element: el,
        score: floorInfo.score,
        reason: `喜用${el}行，${floorInfo.reason}`,
      })
    }
  }

  // 忌讳楼层（低分）
  for (const el of jiElements) {
    if (!happyElements.includes(el)) {
      const floorInfo = ELEMENT_FLOOR_MAP[el]
      if (floorInfo) {
        results.push({
          floor: floorInfo.floors,
          element: el,
          score: 20,
          reason: `忌神${el}行，${floorInfo.floors}楼层不建议选择`,
        })
      }
    }
  }

  return results.sort((a, b) => b.score - a.score)
}

/** 生成总体建议 */
function generateSummary(chart: BaZiChart, xy: ResolvedXiYong): string {
  const dm = chart.dayMaster
  const sl = chart.sixLines

  return `综合${dm.dayGan}${dm.dayGanElement}日主命盘分析，您` +
    `的喜用五行为${xy.happyElements.join('、')}行，忌神为${xy.jiElements.join('、') || '无'}行。` +
    `风水布局以${xy.bestElement}行为核心，方位首选${ELEMENT_DIRECTION_MAP[xy.bestElement]}，` +
    `居住坐向宜坐${xy.jiElements[0] ? ELEMENT_DIRECTION_MAP[xy.jiElements[0]] : '任意'}、向${ELEMENT_DIRECTION_MAP[xy.bestElement]}。` +
    `家居办公宜多用${xy.happyElements.map(el => ELEMENT_COLOR_MAP[el]?.[0]?.color || el + '色').join('、')}系，` +
    `少用${xy.jiElements.map(el => ELEMENT_COLOR_MAP[el]?.[0]?.color || el + '色').join('、')}系。` +
    `幸运数字为${analyzeNumbers(xy.happyElements).join('、')}，宜用于楼层、手机号等选择。` +
    `财位设在${ELEMENT_DIRECTION_MAP[xy.bestElement]}，可放置相关五行物品聚财旺运。` +
    `床位朝向以${ELEMENT_DIRECTION_MAP[xy.bestElement]}为佳，利于休息恢复。` +
    `以上建议基于八字命理与风水学结合分析，方位布局需结合实际户型灵活调整。`
}
