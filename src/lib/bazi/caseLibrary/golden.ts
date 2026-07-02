/**
 * 金标准命例集 (Golden Dataset)
 * V4.8.1 Baseline
 *
 * 用于 CI 回归测试的金标准命例。
 * 每个命例包含：出生信息 + 已知四柱
 *
 * 验证状态：
 * - calculator-baseline: 以当前计算器输出为基线（回归保护用）
 * - verified: 已与权威排盘软件交叉验证
 *
 * 命例来源：
 * - 边界时间命例（立春前后、节气交节前后、子时等）
 * - 各年代普通命例
 * - 不同时辰验证
 *
 * 注意：expected 四柱基于北京时间排盘
 */

export interface GoldenCase {
  /** 命例ID */
  id: string
  /** 来源描述 */
  source: string
  /** 权重等级 */
  importance: 'normal' | 'important' | 'classic' | 'boundary' | 'difficult'

  // 出生信息
  birthDate: string       // YYYY-MM-DD
  birthTime: string       // HH:mm
  gender: 'male' | 'female'

  // 已知四柱
  expected: {
    yearGanZhi: string    // 如 "丙寅"
    monthGanZhi: string
    dayGanZhi: string
    hourGanZhi: string
  }

  /** 验证状态 */
  verified: 'calculator-baseline' | 'verified'
  /** 备注 */
  note?: string
}

export const GOLDEN_CASES: GoldenCase[] = [
  // ========== 边界命例（立春前后）==========
  {
    id: 'GD-B001',
    source: '立春边界验证',
    importance: 'boundary',
    birthDate: '2026-02-04',
    birthTime: '04:02',
    gender: 'male',
    expected: {
      yearGanZhi: '乙巳',   // 立春前 → 属上一年乙巳
      monthGanZhi: '己丑',   // 丑月（大寒为气不换月，小寒→立春整段丑月）
      dayGanZhi: '己酉',
      hourGanZhi: '丙寅',
    },
    verified: 'verified',
    note: '2026年立春前，年柱属乙巳年。立春精确时刻决定年柱归属。Acceptance①修正：大寒不换月，丑月己丑',
  },
  {
    id: 'GD-B002',
    source: '立春边界验证',
    importance: 'boundary',
    birthDate: '2025-02-03',
    birthTime: '12:00',
    gender: 'female',
    expected: {
      yearGanZhi: '甲辰',   // 立春前 → 属上一年甲辰
      monthGanZhi: '丁丑',   // 丑月（大寒为气不换月）
      dayGanZhi: '癸卯',
      hourGanZhi: '戊午',
    },
    verified: 'verified',
    note: '2025年立春前后边界。Acceptance①修正：大寒不换月，丑月丁丑',
  },

  // ========== 节气换月边界 ==========
  {
    id: 'GD-B003',
    source: '惊蛰换月边界',
    importance: 'boundary',
    birthDate: '2026-03-06',
    birthTime: '12:00',
    gender: 'male',
    expected: {
      yearGanZhi: '丙午',
      monthGanZhi: '辛卯',   // 卯月
      dayGanZhi: '己卯',
      hourGanZhi: '庚午',
    },
    verified: 'calculator-baseline',
    note: '惊蛰后，寅卯月交替',
  },
  {
    id: 'GD-B004',
    source: '立秋换月边界',
    importance: 'boundary',
    birthDate: '2026-08-07',
    birthTime: '12:00',
    gender: 'female',
    expected: {
      yearGanZhi: '丙午',
      monthGanZhi: '乙未',   // 未月（立秋前）
      dayGanZhi: '癸丑',
      hourGanZhi: '戊午',
    },
    verified: 'calculator-baseline',
    note: '立秋前，未申月交替',
  },

  // ========== 子时边界 ==========
  {
    id: 'GD-B005',
    source: '子时边界',
    importance: 'boundary',
    birthDate: '2026-06-15',
    birthTime: '23:30',
    gender: 'male',
    expected: {
      yearGanZhi: '丙午',
      monthGanZhi: '甲午',
      dayGanZhi: '辛酉',   // P0-② 晚子时换日：chartDate=次日2026-06-16辛酉日
      hourGanZhi: '戊子',   // 辛日子时起戊子（五鼠遁：丙辛起戊子）
    },
    verified: 'calculator-baseline',
    note: '晚子时 23:30（P0-②已修复子初换日）：chartDate=次日2026-06-16辛酉日，与早子时00:30(GD-B006)日柱不同',
  },
  {
    id: 'GD-B006',
    source: '子时边界',
    importance: 'boundary',
    birthDate: '2026-06-15',
    birthTime: '00:30',
    gender: 'male',
    expected: {
      yearGanZhi: '丙午',
      monthGanZhi: '甲午',
      dayGanZhi: '庚申',   // P0-② 早子时：chartDate=当日2026-06-15庚申日（不换日）
      hourGanZhi: '丙子',   // 庚日子时起丙子（五鼠遁：乙庚起丙子）
    },
    verified: 'calculator-baseline',
    note: '早子时 00:30（P0-②已修复）：chartDate=当日2026-06-15庚申日，与晚子时23:30(GD-B005)日柱不同',
  },

  // ========== 普通命例 ==========
  {
    id: 'GD-N001',
    source: '普通命例',
    importance: 'normal',
    birthDate: '1990-01-15',
    birthTime: '08:30',
    gender: 'male',
    expected: {
      yearGanZhi: '己巳',
      monthGanZhi: '丁丑',
      dayGanZhi: '庚辰',
      hourGanZhi: '庚辰',
    },
    verified: 'calculator-baseline',
    note: '标准命例（立春前，年柱属己巳）',
  },
  {
    id: 'GD-N002',
    source: '普通命例',
    importance: 'normal',
    birthDate: '1985-06-20',
    birthTime: '14:00',
    gender: 'female',
    expected: {
      yearGanZhi: '乙丑',
      monthGanZhi: '壬午',
      dayGanZhi: '庚寅',
      hourGanZhi: '癸未',
    },
    verified: 'calculator-baseline',
    note: '标准命例',
  },
  {
    id: 'GD-N003',
    source: '普通命例',
    importance: 'normal',
    birthDate: '2000-10-01',
    birthTime: '10:00',
    gender: 'male',
    expected: {
      yearGanZhi: '庚辰',
      monthGanZhi: '乙酉',
      dayGanZhi: '壬辰',
      hourGanZhi: '乙巳',
    },
    verified: 'calculator-baseline',
    note: '国庆日',
  },
  {
    id: 'GD-N004',
    source: '普通命例',
    importance: 'normal',
    birthDate: '1978-12-25',
    birthTime: '06:00',
    gender: 'female',
    expected: {
      yearGanZhi: '戊午',
      monthGanZhi: '甲子',
      dayGanZhi: '辛酉',
      hourGanZhi: '辛卯',
    },
    verified: 'calculator-baseline',
    note: '冬至附近',
  },
  {
    id: 'GD-N005',
    source: '普通命例',
    importance: 'normal',
    birthDate: '1995-04-15',
    birthTime: '18:30',
    gender: 'male',
    expected: {
      yearGanZhi: '乙亥',
      monthGanZhi: '庚辰',
      dayGanZhi: '丙子',
      hourGanZhi: '丁酉',
    },
    verified: 'calculator-baseline',
    note: '辰月',
  },

  // ========== 不同年代验证 ==========
  {
    id: 'GD-N006',
    source: '年代验证',
    importance: 'important',
    birthDate: '1960-08-15',
    birthTime: '12:00',
    gender: 'male',
    expected: {
      yearGanZhi: '庚子',
      monthGanZhi: '甲申',
      dayGanZhi: '乙亥',
      hourGanZhi: '壬午',
    },
    verified: 'calculator-baseline',
    note: '60年代',
  },
  {
    id: 'GD-N007',
    source: '年代验证',
    importance: 'important',
    birthDate: '2008-08-08',
    birthTime: '20:00',
    gender: 'male',
    expected: {
      yearGanZhi: '戊子',
      monthGanZhi: '庚申',
      dayGanZhi: '庚辰',
      hourGanZhi: '丙戌',
    },
    verified: 'calculator-baseline',
    note: '北京奥运开幕式',
  },

  // ========== 各时辰验证 ==========
  {
    id: 'GD-N008',
    source: '时辰验证',
    importance: 'important',
    birthDate: '2026-06-15',
    birthTime: '02:00',
    gender: 'male',
    expected: {
      yearGanZhi: '丙午',
      monthGanZhi: '甲午',
      dayGanZhi: '庚申',
      hourGanZhi: '丁丑',
    },
    verified: 'calculator-baseline',
    note: '丑时',
  },
  {
    id: 'GD-N009',
    source: '时辰验证',
    importance: 'important',
    birthDate: '2026-06-15',
    birthTime: '12:00',
    gender: 'male',
    expected: {
      yearGanZhi: '丙午',
      monthGanZhi: '甲午',
      dayGanZhi: '庚申',
      hourGanZhi: '壬午',
    },
    verified: 'calculator-baseline',
    note: '午时',
  },
  {
    id: 'GD-N010',
    source: '时辰验证',
    importance: 'important',
    birthDate: '2026-06-15',
    birthTime: '18:00',
    gender: 'male',
    expected: {
      yearGanZhi: '丙午',
      monthGanZhi: '甲午',
      dayGanZhi: '庚申',
      hourGanZhi: '乙酉',
    },
    verified: 'calculator-baseline',
    note: '酉时',
  },
]

/** 金标准命例数量 */
export const GOLDEN_CASE_COUNT = GOLDEN_CASES.length

/** 按重要性统计 */
export function getGoldenCaseStats() {
  const stats = {
    total: GOLDEN_CASES.length,
    boundary: GOLDEN_CASES.filter(c => c.importance === 'boundary').length,
    classic: GOLDEN_CASES.filter(c => c.importance === 'classic').length,
    important: GOLDEN_CASES.filter(c => c.importance === 'important').length,
    normal: GOLDEN_CASES.filter(c => c.importance === 'normal').length,
    difficult: GOLDEN_CASES.filter(c => c.importance === 'difficult').length,
  }
  return stats
}
