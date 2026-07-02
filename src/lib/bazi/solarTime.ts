/**
 * 真太阳时计算模块
 * P0-③ 真太阳时（均时差校正）
 *
 * 真太阳时 = 北京时间 + 均时差(EoT) + 经度校正
 *
 * 均时差（Equation of Time）：
 *   地球公转轨道为椭圆+自转轴倾斜，导致真太阳日长度不均匀。
 *   EoT 范围约 -14~+16 分钟。
 *
 * 经度校正：
 *   中国标准时间基于东经120°，实际出生地经度不同需校正。
 *   每度经度差 = 4 分钟时间差。
 *   东经 > 120° → 真太阳时比北京时间更晚（加时间）
 *   东经 < 120° → 真太阳时比北京时间更早（减时间）
 *
 * 参考：
 *   - 寿星天文历（VSOP87 算法）
 *   - Jean Meeus, "Astronomical Algorithms"
 *   - 问真八字/元亨利贞真太阳时实现
 */

/** 真太阳时计算结果 */
export interface SolarTimeResult {
  /** 原始本地时间 */
  originalTime: Date
  /** 真太阳时（校正后） */
  solarTime: Date
  /** 均时差（分钟） */
  equationOfTime: number
  /** 经度校正（分钟） */
  longitudeCorrection: number
  /** 总校正量（分钟）= EoT + 经度校正 */
  totalCorrection: number
  /** 使用的经度 */
  longitude: number
  /** 使用的时区标准经度 */
  standardLongitude: number
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

  // 计算年内的日序号（Day of Year）
  const monthDays = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  // 闰年判断
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
  if (isLeap) monthDays[2] = 29

  let dayOfYear = day
  for (let m = 1; m < month; m++) {
    dayOfYear += monthDays[m]
  }

  // Meeus 简化公式
  // B = 360/365.24 × (N - 81)，N 为年内日序号
  const B = (360 / 365.24) * (dayOfYear - 81)
  const B_rad = (B * Math.PI) / 180

  // 均时差（分钟）
  // EoT = -(9.87×sin(2B) - 7.53×cos(B) - 1.5×sin(B))
  // 注意：Meeus 公式原始结果符号与 EoT 常规定义相反，需取反
  // 常规定义：EoT > 0 表示真太阳时比钟表时间快（真太阳时更晚）
  const eot = -(9.87 * Math.sin(2 * B_rad) - 7.53 * Math.cos(B_rad) - 1.5 * Math.sin(B_rad))

  return eot
}

/**
 * 计算经度校正（分钟）
 *
 * 中国标准时间 = 东经 120°
 * 实际经度与标准经度每差 1°，时间差 4 分钟
 *
 * @param longitude 出生地经度（东经为正，西经为负）
 * @param standardLongitude 时区标准经度（默认 120°，即北京时间）
 * @returns 校正量（分钟），正值表示真太阳时比钟表时间更晚
 */
export function getLongitudeCorrection(
  longitude: number,
  standardLongitude: number = 120,
): number {
  return (longitude - standardLongitude) * 4 // 每度4分钟
}

/**
 * 计算真太阳时
 *
 * 真太阳时 = 本地时间 + 均时差(EoT) + 经度校正
 *
 * @param birth 本地出生时间
 * @param longitude 出生地经度（东经为正）
 * @param standardLongitude 时区标准经度（默认 120°）
 * @returns 真太阳时计算结果
 */
export function calculateSolarTime(
  birth: Date,
  longitude: number,
  standardLongitude: number = 120,
): SolarTimeResult {
  const eot = getEquationOfTime(birth)
  const lonCorrection = getLongitudeCorrection(longitude, standardLongitude)
  const totalCorrection = eot + lonCorrection

  // 校正后的真太阳时
  const solarTime = new Date(birth.getTime() + totalCorrection * 60 * 1000)

  return {
    originalTime: new Date(birth.getTime()),
    solarTime,
    equationOfTime: Math.round(eot * 100) / 100,
    longitudeCorrection: Math.round(lonCorrection * 100) / 100,
    totalCorrection: Math.round(totalCorrection * 100) / 100,
    longitude,
    standardLongitude,
  }
}

// ========== 中国主要城市经度表 ==========

export interface CityLocation {
  name: string
  longitude: number  // 东经
  latitude: number   // 北纬
}

/**
 * 中国主要城市经纬度
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
  '长沙': { name: '长沙', longitude: 112.9388, latitude: 28.2282 },
  '沈阳': { name: '沈阳', longitude: 123.4315, latitude: 41.8057 },
  '哈尔滨': { name: '哈尔滨', longitude: 126.6424, latitude: 45.7567 },
  '大连': { name: '大连', longitude: 121.6147, latitude: 38.9140 },
  '昆明': { name: '昆明', longitude: 102.8329, latitude: 25.0389 },
  '贵阳': { name: '贵阳', longitude: 106.6302, latitude: 26.6477 },
  '福州': { name: '福州', longitude: 119.2965, latitude: 26.0745 },
  '厦门': { name: '厦门', longitude: 118.0894, latitude: 24.4798 },
  '南宁': { name: '南宁', longitude: 108.3200, latitude: 22.8240 },
  '海口': { name: '海口', longitude: 110.3500, latitude: 20.0200 },
  '太原': { name: '太原', longitude: 112.5489, latitude: 37.8706 },
  '合肥': { name: '合肥', longitude: 117.2272, latitude: 31.8206 },
  '南昌': { name: '南昌', longitude: 115.8581, latitude: 28.6820 },
  '济南': { name: '济南', longitude: 117.1205, latitude: 36.6510 },
  '郑州': { name: '郑州', longitude: 113.6254, latitude: 34.7466 },
  '兰州': { name: '兰州', longitude: 103.8343, latitude: 36.0611 },
  '乌鲁木齐': { name: '乌鲁木齐', longitude: 87.6168, latitude: 43.8256 },
  '拉萨': { name: '拉萨', longitude: 91.1322, latitude: 29.6600 },
  '呼和浩特': { name: '呼和浩特', longitude: 111.7510, latitude: 40.8424 },
  '石家庄': { name: '石家庄', longitude: 114.5149, latitude: 38.0428 },
  '天津': { name: '天津', longitude: 117.1902, latitude: 39.1256 },
  '长春': { name: '长春', longitude: 125.3245, latitude: 43.8868 },
  '苏州': { name: '苏州', longitude: 120.5853, latitude: 31.2989 },
  '无锡': { name: '无锡', longitude: 120.3119, latitude: 31.4912 },
  '宁波': { name: '宁波', longitude: 121.5440, latitude: 29.8683 },
  '青岛': { name: '青岛', longitude: 120.3826, latitude: 36.0671 },
  '东莞': { name: '东莞', longitude: 113.7518, latitude: 23.0209 },
  '佛山': { name: '佛山', longitude: 113.1218, latitude: 23.0219 },
  '温州': { name: '温州', longitude: 120.6994, latitude: 28.0006 },
  '台北': { name: '台北', longitude: 121.5654, latitude: 25.0330 },
  '香港': { name: '香港', longitude: 114.1694, latitude: 22.3193 },
  '澳门': { name: '澳门', longitude: 113.5439, latitude: 22.1987 },
}

/**
 * 根据城市名获取经度（用于真太阳时计算）
 * 如果城市名不在表中，返回默认值 120（东经120°=北京时间标准经度，无校正）
 */
export function getCityLongitude(cityName: string): number {
  const city = CHINA_CITIES[cityName]
  return city ? city.longitude : 120
}
