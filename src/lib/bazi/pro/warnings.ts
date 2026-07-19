/**
 * H3 Professional BaZi Engine: WarningCode 标准化
 *
 * 统一定义所有警告/异常码，方便：
 * - 前端展示
 * - API 返回
 * - AI 解释
 * - 日志统计
 * - 自动测试
 */

/** WarningCode 枚举 */
export type WarningCode =
  // ─── 时间相关 ───
  | 'DST_WARNING'              // 夏令时校正可能不精确
  | 'TIMEZONE_MISSING'         // 缺少时区信息，使用默认
  | 'TRUE_SOLAR_TIME_MISSING'  // 未启用真太阳时校正
  | 'UNSUPPORTED_YEAR'         // 超出支持年份范围（1900-2100）
  | 'LEAP_MONTH_HANDLED'       // 闰月已特殊处理
  // ─── 排盘相关 ───
  | 'INVALID_GANZHI'           // 干支组合无效（非六十甲子）
  | 'NA_YIN_EMPTY'             // 纳音为空（非六十甲子组合）
  | 'CHILD_HOUR_BOUNDARY'      // 子时边界（23:00-01:00）存在不确定性
  | 'SOLAR_TERM_PRECISION'     // 节气时间精度约 ±30 分钟
  // ─── 算法相关 ───
  | 'UNKNOWN_RULE'             // 未匹配到已知规则
  | 'FORMULA_OUT_OF_RANGE'     // 公式计算结果超出预期范围
  | 'MULTI_RULE_CONFLICT'     // 多条规则冲突
  | 'LOW_CONFIDENCE'           // 置信度低于阈值
  | 'FALLBACK_USED'            // 降级到备选算法
  // ─── 输入相关 ───
  | 'BIRTH_TIME_UNKNOWN'       // 出生时间未知
  | 'GENDER_MISSING'           // 性别缺失
  | 'LOCATION_IMPRECISE'       // 出生地坐标不精确
  // ─── 系统相关 ───
  | 'CACHE_MISS'               // 缓存未命中
  | 'TIMEOUT'                  // 计算超时
  | 'PERFORMANCE_DEGRADED'     // 性能降级

/** WarningCode 描述映射 */
const WARNING_DESCRIPTIONS: Record<WarningCode, string> = {
  DST_WARNING: '夏令时校正可能不精确',
  TIMEZONE_MISSING: '缺少时区信息，使用默认值',
  TRUE_SOLAR_TIME_MISSING: '未启用真太阳时校正',
  UNSUPPORTED_YEAR: '超出支持年份范围（1900-2100）',
  LEAP_MONTH_HANDLED: '闰月已特殊处理',
  INVALID_GANZHI: '干支组合无效（非六十甲子）',
  NA_YIN_EMPTY: '纳音为空（非六十甲子组合）',
  CHILD_HOUR_BOUNDARY: '子时边界存在不确定性',
  SOLAR_TERM_PRECISION: '节气时间精度约 ±30 分钟',
  UNKNOWN_RULE: '未匹配到已知规则',
  FORMULA_OUT_OF_RANGE: '公式计算结果超出预期范围',
  MULTI_RULE_CONFLICT: '多条规则冲突',
  LOW_CONFIDENCE: '置信度低于阈值',
  FALLBACK_USED: '降级到备选算法',
  BIRTH_TIME_UNKNOWN: '出生时间未知',
  GENDER_MISSING: '性别缺失',
  LOCATION_IMPRECISE: '出生地坐标不精确',
  CACHE_MISS: '缓存未命中',
  TIMEOUT: '计算超时',
  PERFORMANCE_DEGRADED: '性能降级',
}

/** 获取 WarningCode 描述 */
export function getWarningDescription(code: WarningCode): string {
  return WARNING_DESCRIPTIONS[code] ?? code
}

/** WarningCode 严重级别 */
export type WarningLevel = 'info' | 'warn' | 'error'

const WARNING_LEVELS: Record<WarningCode, WarningLevel> = {
  DST_WARNING: 'warn',
  TIMEZONE_MISSING: 'info',
  TRUE_SOLAR_TIME_MISSING: 'info',
  UNSUPPORTED_YEAR: 'error',
  LEAP_MONTH_HANDLED: 'info',
  INVALID_GANZHI: 'warn',
  NA_YIN_EMPTY: 'info',
  CHILD_HOUR_BOUNDARY: 'warn',
  SOLAR_TERM_PRECISION: 'info',
  UNKNOWN_RULE: 'warn',
  FORMULA_OUT_OF_RANGE: 'error',
  MULTI_RULE_CONFLICT: 'warn',
  LOW_CONFIDENCE: 'warn',
  FALLBACK_USED: 'info',
  BIRTH_TIME_UNKNOWN: 'warn',
  GENDER_MISSING: 'info',
  LOCATION_IMPRECISE: 'info',
  CACHE_MISS: 'info',
  TIMEOUT: 'error',
  PERFORMANCE_DEGRADED: 'warn',
}

/** 获取 WarningCode 严重级别 */
export function getWarningLevel(code: WarningCode): WarningLevel {
  return WARNING_LEVELS[code] ?? 'info'
}

/** 所有 WarningCode 列表 */
export const ALL_WARNING_CODES: WarningCode[] = Object.keys(WARNING_DESCRIPTIONS) as WarningCode[]
