/**
 * 真太阳时计算模块
 * P0-③ 真太阳时（均时差校正）
 *
 * 真太阳时 = 北京时间 + 均时差(EoT) + 经度校正
 *
 * 均时差（Equation of Time）：
 *   地球公转轨道为椭圆+自转轴倾斜，导致真太阳日长度不均匀。
 *   EoT 范围约 -16~+17 分钟。
 *
 * 经度校正：
 *   中国标准时间基于东经120°，实际出生地经度不同需校正。
 *   每度经度差 = 4 分钟时间差。
 *   东经 > 120° → 真太阳时比北京时间更晚（加时间）
 *   东经 < 120° → 真太阳时比北京时间更早（减时间）
 *
 * 设计原则：
 *   - 优先使用经纬度（精确）
 *   - 城市名仅作为辅助输入（从城市表获取坐标）
 *   - 无坐标时默认东经120°（北京标准时间）
 *
 * 参考：
 *   - 寿星天文历（VSOP87 算法）
 *   - Jean Meeus, "Astronomical Algorithms"
 *   - 问真八字/元亨利贞真太阳时实现
 */

import { EARTHLY_BRANCHES } from '../core/constants'
import { createPreciseCalendar } from './preciseCalendar'

/** 经纬度坐标 */
export interface Coordinate {
  longitude: number  // 经度（东经为正，西经为负）
  latitude: number   // 纬度（北纬为正，南纬为负）
}

/** 真太阳时全过程追踪（V⑧：方便排查） */
export interface SolarTimeTrace {
  /** 时区标准时间（本地钟表时间） */
  standardTime: Date
  /** 出生地经度（东经为正，西经为负） */
  longitude: number
  /** 出生地纬度 */
  latitude: number
  /** IANA 时区标识（如 Asia/Shanghai） */
  timezone: string
  /** 相对 UTC 的时区偏移（分钟） */
  timezoneOffsetMin: number
  /** 时区标准经度（如 UTC+8 = 120°） */
  timezoneStandardLongitude: number
  /** 均时差 EoT（分钟） */
  eotMinutes: number
  /** 经度校正（分钟） */
  longitudeCorrectionMinutes: number
  /** 总校正（分钟）= EoT + 经度校正 */
  totalCorrectionMinutes: number
  /** 计算出的真太阳时（未考虑是否启用开关） */
  trueSolarTime: Date
  /** 最终采用时间：useTrueSolarTime=true 时 = trueSolarTime，否则 = standardTime */
  finalAdoptedTime: Date
  /** 是否启用了真太阳时校正 */
  useTrueSolarTime: boolean
  /** P0-A2 新增：完整可追溯链 */
  /** UTC 时间（将 standardTime 按 timezoneOffsetMin 反算） */
  utcTime?: Date
  /** 本地时间字符串（'YYYY-MM-DD HH:mm' 格式，用于 UI 展示） */
  localTimeText?: string
  /** 真太阳时是否导致跨日（与 standardTime 的日期不同） */
  isCrossDay?: boolean
  /** 最终采用的时辰（地支名，如 '子' '丑' '寅'...，基于 finalAdoptedTime） */
  adoptedShichen?: string
  /** 最终采用的时辰索引（0=子, 1=丑, ... 11=亥） */
  adoptedShichenIndex?: number
  /** 最终采用的时辰干支（如 '甲子' '乙丑'） */
  adoptedShichenGanZhi?: string
}

/** 真太阳时计算结果 */
export interface SolarTimeResult {
  /** 原始本地时间（钟表时间 = standardTime） */
  originalTime: Date
  /** 真太阳时（校正后，仅当 useTrueSolarTime=true 时生效） */
  solarTime: Date
  /** 均时差（分钟） */
  equationOfTime: number
  /** 经度校正（分钟） */
  longitudeCorrection: number
  /** 总校正量（分钟）= EoT + 经度校正 */
  totalCorrection: number
  /** 使用的坐标 */
  coordinate: Coordinate
  /** 时区标准经度 */
  standardLongitude: number
  /** 全过程追踪信息（V⑧ 验收新增） */
  trace: SolarTimeTrace
}

/**
 * 计算均时差（Equation of Time）
 *
 * 使用 Jean Meeus 简化算法（精度约 ±30 秒，满足命理排盘需求）
 * 更高精度需 VSOP87 算法（留给后续优化）
 *
 * @param date 日期
 * @returns 均时差（分钟），正值表示真太阳时比平均太阳时快
 */
export function getEquationOfTime(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  if (isLeap) monthDays[2] = 29

  let dayOfYear = day
  for (let m = 1; m < month; m++) {
    dayOfYear += monthDays[m]
  }

  const B = (360 / 365.24) * (dayOfYear - 81)
  const B_rad = (B * Math.PI) / 180

  // EoT = -(9.87×sin(2B) - 7.53×cos(B) - 1.5×sin(B))
  // Meeus 公式原始结果符号与 EoT 常规定义相反，需取反
  const eot = -(9.87 * Math.sin(2 * B_rad) - 7.53 * Math.cos(B_rad) - 1.5 * Math.sin(B_rad))

  return eot
}

/**
 * 计算经度校正（分钟）
 *
 * @param longitude 出生地经度（东经为正）
 * @param standardLongitude 时区标准经度（默认 120°）
 * @returns 校正量（分钟），正值表示真太阳时比钟表时间更晚
 */
export function getLongitudeCorrection(
  longitude: number,
  standardLongitude: number = 120,
): number {
  return (longitude - standardLongitude) * 4
}

/**
 * 计算真太阳时（经纬度优先）
 *
 * 真太阳时 = 本地时间 + 均时差(EoT) + 经度校正
 *
 * @param birth 本地出生时间（时区标准时间/钟表时间）
 * @param coordinate 出生地坐标（优先使用）
 * @param opts 可选：时区信息，用于补全 trace
 * @returns 真太阳时计算结果（含完整 trace）
 */
export function calculateSolarTime(
  birth: Date,
  coordinate: Coordinate,
  opts?: {
    standardLongitude?: number
    timezone?: string
    timezoneOffsetMin?: number
    useTrueSolarTime?: boolean
  },
): SolarTimeResult {
  const standardLon = opts?.standardLongitude ?? 120
  const eot = getEquationOfTime(birth)
  const lonCorrection = getLongitudeCorrection(coordinate.longitude, standardLon)
  const totalCorrection = eot + lonCorrection

  const trueSolarTimeDate = new Date(birth.getTime() + totalCorrection * 60 * 1000)
  const useTST = opts?.useTrueSolarTime ?? true
  const finalTime = useTST ? trueSolarTimeDate : new Date(birth.getTime())

  const tzOffsetMin = opts?.timezoneOffsetMin ?? Math.round(standardLon / 15) * 60
  // P0-A2 新增：完整可追溯链字段
  const utcTime = new Date(birth.getTime() - tzOffsetMin * 60 * 1000)
  const localTimeText = formatLocalTime(birth)
  const isCrossDay =
    trueSolarTimeDate.getDate() !== birth.getDate() ||
    trueSolarTimeDate.getMonth() !== birth.getMonth()
  const shichenInfo = computeShichenInfo(finalTime)

  const trace: SolarTimeTrace = {
    standardTime: new Date(birth.getTime()),
    longitude: coordinate.longitude,
    latitude: coordinate.latitude,
    timezone: opts?.timezone ?? timezoneForLongitude(standardLon),
    timezoneOffsetMin: tzOffsetMin,
    timezoneStandardLongitude: standardLon,
    eotMinutes: Math.round(eot * 100) / 100,
    longitudeCorrectionMinutes: Math.round(lonCorrection * 100) / 100,
    totalCorrectionMinutes: Math.round(totalCorrection * 100) / 100,
    trueSolarTime: trueSolarTimeDate,
    finalAdoptedTime: new Date(finalTime.getTime()),
    useTrueSolarTime: useTST,
    // P0-A2 新增字段
    utcTime,
    localTimeText,
    isCrossDay,
    adoptedShichen: shichenInfo.shichenName,
    adoptedShichenIndex: shichenInfo.shichenIndex,
    adoptedShichenGanZhi: shichenInfo.shichenGanZhi,
  }

  return {
    originalTime: new Date(birth.getTime()),
    solarTime: finalTime,
    equationOfTime: trace.eotMinutes,
    longitudeCorrection: trace.longitudeCorrectionMinutes,
    totalCorrection: trace.totalCorrectionMinutes,
    coordinate,
    standardLongitude: standardLon,
    trace,
  }
}

/** 根据标准经度推导常见时区（仅用于 trace 的兜底，不影响精度） */
function timezoneForLongitude(lon: number): string {
  if (Math.abs(lon - 120) < 1) return 'Asia/Shanghai'
  if (Math.abs(lon - 135) < 1) return 'Asia/Tokyo'
  if (Math.abs(lon - 105) < 1) return 'Asia/Bangkok'
  if (Math.abs(lon - 90) < 1) return 'Asia/Dhaka'
  if (Math.abs(lon - 75) < 1) return 'Asia/Kolkata'
  if (Math.abs(lon - 0) < 1) return 'UTC'
  if (Math.abs(lon + 75) < 1) return 'America/New_York'
  if (Math.abs(lon + 120) < 1) return 'America/Los_Angeles'
  const utcOff = Math.round(lon / 15)
  return utcOff >= 0 ? `UTC+${utcOff}` : `UTC${utcOff}`
}

/**
 * 格式化本地时间字符串（'YYYY-MM-DD HH:mm'）
 * P0-A2 新增：用于 trace.localTimeText 的 UI 展示
 */
function formatLocalTime(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

/**
 * 计算时辰信息（P0-A2 新增）
 *
 * 时辰索引公式：shichenIndex = Math.floor(((hour + 1) % 24) / 2)
 *   - hour=23 → (24%24)/2=0（子时）
 *   - hour=0  → 1/2=0（子时）
 *   - hour=1  → 2/2=1（丑时）
 *   - hour=3  → 4/2=2（寅时）...
 *
 * 时辰干支优先使用 createPreciseCalendar（与排盘保持一致）；
 * 若 createPreciseCalendar 抛错或字段缺失，则回退到五鼠遁简化算法：
 *   时干索引 = (日干索引 * 2 + 时辰索引) % 10
 *
 * @param finalTime 最终采用时间
 * @returns 时辰索引、地支名、时辰干支
 */
function computeShichenInfo(finalTime: Date): {
  shichenIndex: number
  shichenName: string
  shichenGanZhi: string
} {
  const hour = finalTime.getHours()
  const shichenIndex = Math.floor(((hour + 1) % 24) / 2)
  const shichenName = EARTHLY_BRANCHES[shichenIndex]
  const HEAVENLY_STEMS = '甲乙丙丁戊己庚辛壬癸'

  let dayGanIdx = -1
  let hourGanZhi = ''
  try {
    const cal = createPreciseCalendar(finalTime)
    hourGanZhi = cal.hours[shichenIndex]?.ganZhi ?? ''
    const dayGan = cal.dayGanZhi?.gan
    if (dayGan) dayGanIdx = HEAVENLY_STEMS.indexOf(dayGan)
  } catch {
    // 日期超出历法支持范围等异常，落入占位逻辑
  }

  if (hourGanZhi) {
    return { shichenIndex, shichenName, shichenGanZhi: hourGanZhi }
  }
  // 回退：五鼠遁简化算法（需有日干索引）
  if (dayGanIdx >= 0) {
    const hourGanIdx = (dayGanIdx * 2 + shichenIndex) % 10
    return {
      shichenIndex,
      shichenName,
      shichenGanZhi: HEAVENLY_STEMS[hourGanIdx] + shichenName,
    }
  }
  // 极端兜底：仅返回地支名 + 占位天干
  return { shichenIndex, shichenName, shichenGanZhi: '?' + shichenName }
}

/**
 * 修正最终采用时间（根据 useTrueSolarTime 开关）
 * 若之前调用 calculateSolarTime 时 useTrueSolarTime 未给出，可用此函数补全
 */
export function finalizeSolarTime(
  result: SolarTimeResult,
  useTrueSolarTime: boolean,
): SolarTimeResult {
  const finalTime = useTrueSolarTime ? result.trace.trueSolarTime : result.trace.standardTime
  const finalDate = new Date(finalTime.getTime())
  const standardTime = result.trace.standardTime

  // P0-A2：useTrueSolarTime 变化时，重新计算依赖 finalAdoptedTime 的字段
  const localTimeText = formatLocalTime(finalDate)
  const isCrossDay =
    finalDate.getDate() !== standardTime.getDate() ||
    finalDate.getMonth() !== standardTime.getMonth()
  const shichenInfo = computeShichenInfo(finalDate)

  return {
    ...result,
    solarTime: finalDate,
    trace: {
      ...result.trace,
      finalAdoptedTime: finalDate,
      useTrueSolarTime,
      localTimeText,
      isCrossDay,
      adoptedShichen: shichenInfo.shichenName,
      adoptedShichenIndex: shichenInfo.shichenIndex,
      adoptedShichenGanZhi: shichenInfo.shichenGanZhi,
    },
  }
}

// ========== 城市坐标辅助查询（辅助功能）==========

export interface CityLocation {
  name: string
  longitude: number
  latitude: number
}

/**
 * 中国主要城市经纬度（辅助查询用，非核心依赖）
 * 数据来源：国家测绘局标准数据
 */
export const CHINA_CITIES: Record<string, CityLocation> = {
  '北京': { name: '北京', longitude: 116.4074, latitude: 39.9042 },
  '上海': { name: '上海', longitude: 121.4737, latitude: 31.2304 },
  '广州': { name: '广州', longitude: 113.2644, latitude: 23.1291 },
  '深圳': { name: '深圳', longitude: 114.0579, latitude: 22.5431 },
  '成都': { name: '成都', longitude: 104.0665, latitude: 30.5723 },
  '重庆': { name: '重庆', longitude: 106.5516, latitude: 29.5630 },
  '武汉': { name: '武汉', longitude: 114.3055, latitude: 30.5928 },
  '杭州': { name: '杭州', longitude: 120.1551, latitude: 30.2741 },
  '南京': { name: '南京', longitude: 118.7969, latitude: 32.0603 },
  '西安': { name: '西安', longitude: 108.9402, latitude: 34.2609 },
  '乌鲁木齐': { name: '乌鲁木齐', longitude: 87.6168, latitude: 43.8256 },
  '拉萨': { name: '拉萨', longitude: 91.1322, latitude: 29.6600 },
  '哈尔滨': { name: '哈尔滨', longitude: 126.6424, latitude: 45.7567 },
  '沈阳': { name: '沈阳', longitude: 123.4315, latitude: 41.8057 },
  '天津': { name: '天津', longitude: 117.1902, latitude: 39.1256 },
  '苏州': { name: '苏州', longitude: 120.5853, latitude: 31.2989 },
  '台北': { name: '台北', longitude: 121.5654, latitude: 25.0330 },
  '香港': { name: '香港', longitude: 114.1694, latitude: 22.3193 },
  '澳门': { name: '澳门', longitude: 113.5439, latitude: 22.1987 },
}

/**
 * 根据城市名获取坐标（辅助函数）
 * 如果城市名不在表中，返回默认坐标（东经120°，北纬30°）
 */
export function getCityCoordinate(cityName: string): Coordinate {
  const city = CHINA_CITIES[cityName]
  return city ? { longitude: city.longitude, latitude: city.latitude } : { longitude: 120, latitude: 30 }
}

/**
 * 根据城市名获取经度（兼容旧接口）
 * 优先使用经纬度，此函数仅作为辅助
 */
export function getCityLongitude(cityName: string): number {
  return getCityCoordinate(cityName).longitude
}

/**
 * 创建坐标对象
 */
export function createCoordinate(longitude: number, latitude: number): Coordinate {
  return { longitude, latitude }
}
