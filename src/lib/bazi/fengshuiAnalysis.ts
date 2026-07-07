import type { SixLines, HeavenlyStem, EarthlyBranch, FiveElement, XiYongShen } from './types'
import type { FiveElementPowerResult } from './fiveElementPower'
import { getStemElement, EARTHLY_BRANCHES } from '@/lib/core'

type XiyongView = {
  xiShen: FiveElement[]
  jiShen: FiveElement[]
}

function toView(r: XiYongShen): XiyongView {
  return {
    xiShen: [r.bestElement],
    jiShen: r.avoidedElements,
  }
}

export interface ColorAdvice {
  color: string
  hex: string
  element: FiveElement
  type: 'lucky' | 'avoid'
  description: string
}

export interface LuckyNumber {
  number: number
  element: FiveElement
  type: 'lucky' | 'avoid'
  description: string
}

export interface DirectionAdvice {
  name: string
  position: string
  element: FiveElement
  score: number
  usage: string
  description: string
}

export interface RoomAdvice {
  room: string
  position: string
  facing: string
  taboos: string[]
  tips: string[]
}

export interface SpecialPosition {
  name: string
  direction: string
  element: FiveElement
  description: string
  usage: string
}

export interface FengShuiAnalysisResult {
  luckyColors: ColorAdvice[]
  avoidColors: ColorAdvice[]
  luckyNumbers: LuckyNumber[]
  avoidNumbers: LuckyNumber[]
  directions: DirectionAdvice[]
  residence: { bestFacing: string; bestSitting: string; description: string }
  rooms: RoomAdvice[]
  specialPositions: SpecialPosition[]
  summary: string
}

// 五行对应颜色
const ELEMENT_COLOR_MAP: Record<FiveElement, { colors: { color: string; hex: string }[] }> = {
  '木': { colors: [
    { color: '绿色', hex: '#4CAF50' },
    { color: '青色', hex: '#009688' },
    { color: '翠色', hex: '#2E7D32' },
  ]},
  '火': { colors: [
    { color: '红色', hex: '#F44336' },
    { color: '紫色', hex: '#9C27B0' },
    { color: '橙色', hex: '#FF9800' },
  ]},
  '土': { colors: [
    { color: '黄色', hex: '#FFC107' },
    { color: '棕色', hex: '#795548' },
    { color: '米色', hex: '#D2B48C' },
  ]},
  '金': { colors: [
    { color: '白色', hex: '#FFFFFF' },
    { color: '金色', hex: '#FFD700' },
    { color: '银色', hex: '#C0C0C0' },
  ]},
  '水': { colors: [
    { color: '黑色', hex: '#212121' },
    { color: '蓝色', hex: '#2196F3' },
    { color: '深灰', hex: '#616161' },
  ]},
}

// 五行对应数字
const ELEMENT_NUMBER_MAP: Record<FiveElement, { numbers: number[] }> = {
  '木': { numbers: [1, 2] },
  '火': { numbers: [3, 4] },
  '土': { numbers: [5, 6] },
  '金': { numbers: [7, 8] },
  '水': { numbers: [9, 0] },
}

// 五行对应方位
const ELEMENT_DIRECTION_MAP: Record<FiveElement, { position: string; name: string }> = {
  '木': { position: '东方', name: '东' },
  '火': { position: '南方', name: '南' },
  '土': { position: '中央', name: '中' },
  '金': { position: '西方', name: '西' },
  '水': { position: '北方', name: '北' },
}

// 地支对应方位
const BRANCH_DIRECTION_MAP: Record<EarthlyBranch, string> = {
  '子': '正北', '丑': '东北偏北', '寅': '东北', '卯': '正东',
  '辰': '东南偏东', '巳': '东南', '午': '正南', '未': '西南偏南',
  '申': '西南', '酉': '正西', '戌': '西北偏西', '亥': '西北',
}

// 五行相克
const ELEMENT_OVERCOME: Record<FiveElement, FiveElement> = {
  '木': '土', '火': '金', '土': '水', '金': '木', '水': '火'
}

function analyzeColors(xiyongRaw: XiYongShen): { lucky: ColorAdvice[]; avoid: ColorAdvice[] } {
  const xiyong = toView(xiyongRaw)
  const lucky: ColorAdvice[] = []
  const avoid: ColorAdvice[] = []

  for (const el of xiyong.xiShen) {
    const colors = ELEMENT_COLOR_MAP[el]
    if (colors) {
      for (const c of colors.colors) {
        lucky.push({
          color: c.color, hex: c.hex, element: el, type: 'lucky',
          description: `${el}行为喜用，${c.color}有利运势。`,
        })
      }
    }
  }

  for (const el of xiyong.jiShen) {
    const colors = ELEMENT_COLOR_MAP[el]
    if (colors) {
      for (const c of colors.colors.slice(0, 2)) {
        avoid.push({
          color: c.color, hex: c.hex, element: el, type: 'avoid',
          description: `${el}行为忌神，${c.color}不利于运势。`,
        })
      }
    }
  }

  return { lucky, avoid }
}

function analyzeNumbers(xiyongRaw: XiYongShen): { lucky: LuckyNumber[]; avoid: LuckyNumber[] } {
  const xiyong = toView(xiyongRaw)
  const lucky: LuckyNumber[] = []
  const avoid: LuckyNumber[] = []

  for (const el of xiyong.xiShen) {
    const nums = ELEMENT_NUMBER_MAP[el]
    if (nums) {
      for (const n of nums.numbers) {
        lucky.push({
          number: n, element: el, type: 'lucky',
          description: `${el}行为喜用，数字${n === 0 ? '0' : n}有利于运势。`,
        })
      }
    }
  }

  for (const el of xiyong.jiShen) {
    const nums = ELEMENT_NUMBER_MAP[el]
    if (nums) {
      for (const n of nums.numbers) {
        avoid.push({
          number: n, element: el, type: 'avoid',
          description: `${el}行为忌神，数字${n === 0 ? '0' : n}不利于运势。`,
        })
      }
    }
  }

  return { lucky, avoid }
}

function analyzeDirections(
  xiyongRaw: XiYongShen,
  sixLines: SixLines,
  fiveElementPower: FiveElementPowerResult
): DirectionAdvice[] {
  const xiyong = toView(xiyongRaw)
  const directions: DirectionAdvice[] = []

  for (const el of ['木', '火', '土', '金', '水'] as FiveElement[]) {
    const dir = ELEMENT_DIRECTION_MAP[el]
    const isXi = xiyong.xiShen.includes(el)
    const isJi = xiyong.jiShen.includes(el)

    let score = 50
    if (isXi) score = 85
    else if (isJi) score = 25
    else score = 55

    // 根据五行力量微调
    const power = fiveElementPower.powerMap[el] || 0
    if (isXi && power > 20) score += 5
    if (isJi && power > 30) score -= 5

    const usage = isXi
      ? `适合作为${dir.position}朝向或工作方位`
      : isJi
      ? `不宜作为主要朝向，需避开`
      : '方位中性，可作为备选'

    directions.push({
      name: `${el}行 ${dir.position}`,
      position: dir.position,
      element: el,
      score: Math.min(95, Math.max(20, score)),
      usage,
      description: `${el}行位于${dir.position}，${isXi ? '为喜用方位，有利于运势发展。' : isJi ? '为忌神方位，需尽量避免。' : '方位中性，影响不大。'}`,
    })
  }

  return directions.sort((a, b) => b.score - a.score)
}

function analyzeResidence(
  xiyongRaw: XiYongShen,
  sixLines: SixLines
): { bestFacing: string; bestSitting: string; description: string } {
  const xiyong = toView(xiyongRaw)
  const xiElement = xiyong.xiShen[0]
  const jiElement = xiyong.jiShen[0]

  const xiDir = ELEMENT_DIRECTION_MAP[xiElement]
  const jiDir = ELEMENT_DIRECTION_MAP[jiElement]

  // 住宅坐向：坐忌神方，向喜用方
  const bestFacing = xiDir.position
  const bestSitting = jiDir.position

  const description = `住宅宜${bestFacing}朝向（向喜用${xiElement}行），坐${bestSitting}（坐忌神${jiElement}行）。这样可纳吉气、避凶气。日支（夫妻宫）在${BRANCH_DIRECTION_MAP[sixLines.day.zhi]}方位，卧室宜设于住宅的吉利方位。`

  return { bestFacing, bestSitting, description }
}

function analyzeRooms(
  xiyongRaw: XiYongShen,
  sixLines: SixLines
): RoomAdvice[] {
  const xiyong = toView(xiyongRaw)
  const xiDir = ELEMENT_DIRECTION_MAP[xiyong.xiShen[0]]
  const dayZhiDir = BRANCH_DIRECTION_MAP[sixLines.day.zhi]

  const rooms: RoomAdvice[] = []

  // 办公桌
  rooms.push({
    room: '办公桌',
    position: `面向${xiDir.position}`,
    facing: `背靠实墙，面向${xiDir.position}或窗户`,
    taboos: ['不宜背门而坐', '不宜正对厕所', '不宜在横梁下'],
    tips: [
      `桌面可放置${xiDir.name}方位相关的绿色植物`,
      '保持桌面整洁，杂乱影响思维',
      '左侧宜高（青龙位），右侧宜低（白虎位）',
    ],
  })

  // 卧室
  rooms.push({
    room: '卧室',
    position: `住宅${dayZhiDir}方位`,
    facing: '床头宜朝喜用方位',
    taboos: [
      '不宜正对大门', '不宜在厨房隔壁', '不宜有横梁压床',
      '镜子不宜正对床', '床头不宜靠窗',
    ],
    tips: [
      '床头应靠实墙', '卧室光线宜柔和',
      `睡姿方向：头朝${xiDir.position}，脚朝反方向`,
    ],
  })

  // 书房
  rooms.push({
    room: '书房',
    position: `住宅${xiDir.position}方位`,
    facing: `书桌面向${xiDir.position}`,
    taboos: ['不宜有太多杂物', '不宜正对镜子'],
    tips: [
      `文昌位在${xiDir.position}，书桌设于此处有利学业`,
      '可在书桌左侧放置文竹或富贵竹',
    ],
  })

  // 客厅
  rooms.push({
    room: '客厅',
    position: '住宅中央偏喜用方位',
    facing: `${xiDir.position}方位宜明亮宽敞`,
    taboos: ['不宜有尖锐角对着沙发', '不宜杂乱无序'],
    tips: [
      '沙发宜靠实墙', '茶几不宜过高',
      '可在客厅放置鱼缸（水行旺财）',
    ],
  })

  return rooms
}

function analyzeSpecialPositions(
  xiyongRaw: XiYongShen,
  sixLines: SixLines,
  shenShiAnalysis: { dominant: string }
): SpecialPosition[] {
  const xiyong = toView(xiyongRaw)
  const positions: SpecialPosition[] = []

  const xiDir = ELEMENT_DIRECTION_MAP[xiyong.xiShen[0]]

  // 文昌位：根据五行喜用确定
  positions.push({
    name: '文昌位',
    direction: xiDir.position,
    element: xiyong.xiShen[0],
    description: '文昌位利于学业、考试、写作，适合放置书桌。',
    usage: '书桌、书架、学习区域',
  })

  // 财神位：根据喜用五行
  const caiElement = ELEMENT_OVERCOME[xiyong.xiShen[0]]
  const caiDir = ELEMENT_DIRECTION_MAP[caiElement]
  positions.push({
    name: '财神位',
    direction: caiDir.position,
    element: caiElement,
    description: `${caiElement}行在${caiDir.position}，喜用${xiyong.xiShen[0]}生${caiElement}，此处利财。`,
    usage: '保险柜、收银台、财位装饰',
  })

  // 贵人位：根据日干确定
  const dayGan = sixLines.day.gan
  const dayIdx = '甲乙丙丁戊己庚辛壬癸'.indexOf(dayGan)
  const guirenZhi = ['丑未', '丑未', '寅亥', '寅亥', '卯戌', '卯戌', '辰丑', '辰丑', '巳申', '巳申'][Math.floor(dayIdx / 2)]
  const [gz1, gz2] = guirenZhi.split('') as [EarthlyBranch, EarthlyBranch]
  const guirenDir = `${BRANCH_DIRECTION_MAP[gz1]}、${BRANCH_DIRECTION_MAP[gz2]}`

  positions.push({
    name: '贵人位',
    direction: guirenDir,
    element: xiyong.xiShen[0],
    description: `日干${dayGan}的天乙贵人在${gz1}和${gz2}，即${guirenDir}方位，此方位有助贵人运。`,
    usage: '会客区、合作洽谈区',
  })

  // 桃花位：根据年支
  const yearZhi = sixLines.year.zhi
  const branchIdx = EARTHLY_BRANCHES.indexOf(yearZhi)
  const taohuaZhi = EARTHLY_BRANCHES[(branchIdx + 2) % 12]
  const taohuaDir = BRANCH_DIRECTION_MAP[taohuaZhi]

  positions.push({
    name: '桃花位',
    direction: taohuaDir,
    element: '水' as FiveElement,
      description: `年支${yearZhi}的桃花在${taohuaZhi}，即${taohuaDir}方位，此方位利人际和感情。`,
      usage: '客厅装饰、花卉摆放',
  })

  return positions
}

function generateFengShuiSummary(
  xiyongRaw: XiYongShen,
  residence: { bestFacing: string; bestSitting: string }
): string {
  const xiyong = toView(xiyongRaw)
  const xiElements = xiyong.xiShen.join('、')
  const jiElements = xiyong.jiShen.join('、')

  return `根据八字命局分析，喜用五行「${xiElements}」，忌神五行「${jiElements}」。` +
    `住宅最佳朝向为${residence.bestFacing}（向喜用方位），坐${residence.bestSitting}（坐忌神方位）。` +
    `日常穿着、家居布置以喜用五行的颜色为主，佩戴幸运数字相关的饰品，可增强运势。` +
    `重要位置（办公桌、卧室、文昌位）设在喜用方位，有助于事业、学业和健康。`
}

export function analyzeFengShui(
  sixLines: SixLines,
  dayGan: HeavenlyStem,
  xiyong: XiYongShen,
  fiveElementPower: FiveElementPowerResult,
  shenShiDominant: string
): FengShuiAnalysisResult {
  const { lucky: luckyColors, avoid: avoidColors } = analyzeColors(xiyong)
  const { lucky: luckyNumbers, avoid: avoidNumbers } = analyzeNumbers(xiyong)
  const directions = analyzeDirections(xiyong, sixLines, fiveElementPower)
  const residence = analyzeResidence(xiyong, sixLines)
  const rooms = analyzeRooms(xiyong, sixLines)
  const specialPositions = analyzeSpecialPositions(xiyong, sixLines, { dominant: shenShiDominant })
  const summary = generateFengShuiSummary(xiyong, residence)

  return {
    luckyColors,
    avoidColors,
    luckyNumbers,
    avoidNumbers,
    directions,
    residence,
    rooms,
    specialPositions,
    summary,
  }
}
