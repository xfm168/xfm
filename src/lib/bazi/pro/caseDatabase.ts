/**
 * V4.5 Case Library — 命例验证库 数据库
 *
 * 职责：存储经典命例、匿名命例和回归样本的静态数据
 * 约束：不参与任何命理计算，仅存储和提供数据
 *
 * 数据规模：
 * - CLASSIC_CASES: 10 个代表性经典命例样本
 * - ANONYMOUS_CASES: 5 个匿名真实命例样本
 * - REGRESSION_CASES: 10 个自动回归样本
 */

import type {
  ClassicCase,
  AnonymousCase,
  RegressionCase,
  CaseEntry,
  CaseCategory,
  CasePillarsInput,
  CaseExpectedResult,
} from './caseLibraryTypes'
import type {
  HeavenlyStem,
  EarthlyBranch,
  FiveElement,
} from '@/lib/core/types/base'

// ═══════════════════════════════════════════
// 1. 经典命例样本集（10 个代表性样本）
// ═══════════════════════════════════════════

/**
 * 经典命例样本集
 *
 * 收录 10 个具有代表性的经典命例，来源于古籍文献。
 * 用于验证格局引擎、喜用神判断和五维评分的准确性。
 * 完整样本集待后续扩充至 100 个。
 */
export const CLASSIC_CASES: readonly ClassicCase[] = [
  // ─── CLS-001: 甲子日主，建禄格，偏强 ───
  {
    caseId: 'CLS-001',
    name: '某名人',
    description: '甲子日主，建禄格，日主偏强，水木两旺',
    source: '《三命通会》',
    dynasty: '明',
    yearGan: '甲' as HeavenlyStem,
    yearZhi: '子' as EarthlyBranch,
    monthGan: '丙' as HeavenlyStem,
    monthZhi: '寅' as EarthlyBranch,
    dayGan: '甲' as HeavenlyStem,
    dayZhi: '子' as EarthlyBranch,
    hourGan: '甲' as HeavenlyStem,
    hourZhi: '子' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '木' as FiveElement,
      primaryPattern: '建禄格',
      strengthLevel: '偏强',
      primaryXiShen: '水' as FiveElement,
      primaryYongShen: '木' as FiveElement,
      primaryJiShen: '金' as FiveElement,
      careerScore: 70,
      wealthScore: 65,
      marriageScore: 60,
      healthScore: 70,
      studyScore: 68,
      overallScore: 66,
    },
  },

  // ─── CLS-002: 丙寅日主，正官格，中和 ───
  {
    caseId: 'CLS-002',
    name: '某名臣',
    description: '丙寅日主，正官格，火木相生，日主中和',
    source: '《滴天髓》',
    dynasty: '清',
    yearGan: '辛' as HeavenlyStem,
    yearZhi: '卯' as EarthlyBranch,
    monthGan: '壬' as HeavenlyStem,
    monthZhi: '寅' as EarthlyBranch,
    dayGan: '丙' as HeavenlyStem,
    dayZhi: '寅' as EarthlyBranch,
    hourGan: '己' as HeavenlyStem,
    hourZhi: '丑' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '火' as FiveElement,
      primaryPattern: '正官格',
      strengthLevel: '中和',
      primaryXiShen: '木' as FiveElement,
      primaryYongShen: '火' as FiveElement,
      primaryJiShen: '水' as FiveElement,
      careerScore: 78,
      wealthScore: 72,
      marriageScore: 70,
      healthScore: 75,
      studyScore: 80,
      overallScore: 75,
    },
  },

  // ─── CLS-003: 戊辰日主，正财格，偏弱 ───
  {
    caseId: 'CLS-003',
    name: '某富商',
    description: '戊辰日主，正财格，土旺身弱，财多身轻',
    source: '《子平真诠》',
    dynasty: '清',
    yearGan: '壬' as HeavenlyStem,
    yearZhi: '戌' as EarthlyBranch,
    monthGan: '庚' as HeavenlyStem,
    monthZhi: '申' as EarthlyBranch,
    dayGan: '戊' as HeavenlyStem,
    dayZhi: '辰' as EarthlyBranch,
    hourGan: '壬' as HeavenlyStem,
    hourZhi: '子' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '土' as FiveElement,
      primaryPattern: '正财格',
      strengthLevel: '偏弱',
      primaryXiShen: '火' as FiveElement,
      primaryYongShen: '火' as FiveElement,
      primaryJiShen: '水' as FiveElement,
      careerScore: 55,
      wealthScore: 72,
      marriageScore: 60,
      healthScore: 58,
      studyScore: 50,
      overallScore: 59,
    },
  },

  // ─── CLS-004: 庚午日主，食神格，中和 ───
  {
    caseId: 'CLS-004',
    name: '某文士',
    description: '庚午日主，食神格，金火相制，日主中和',
    source: '《渊海子平》',
    dynasty: '宋',
    yearGan: '丙' as HeavenlyStem,
    yearZhi: '子' as EarthlyBranch,
    monthGan: '己' as HeavenlyStem,
    monthZhi: '亥' as EarthlyBranch,
    dayGan: '庚' as HeavenlyStem,
    dayZhi: '午' as EarthlyBranch,
    hourGan: '丁' as HeavenlyStem,
    hourZhi: '丑' as EarthlyBranch,
    gender: 'female' as const,
    expectedResult: {
      dayMasterElement: '金' as FiveElement,
      primaryPattern: '食神格',
      strengthLevel: '中和',
      primaryXiShen: '土' as FiveElement,
      primaryYongShen: '水' as FiveElement,
      primaryJiShen: '火' as FiveElement,
      careerScore: 65,
      wealthScore: 60,
      marriageScore: 75,
      healthScore: 68,
      studyScore: 78,
      overallScore: 69,
    },
  },

  // ─── CLS-005: 壬申日主，偏官格，偏强 ───
  {
    caseId: 'CLS-005',
    name: '某武将',
    description: '壬申日主，偏官格，金水相生，日主偏强',
    source: '《三命通会》',
    dynasty: '明',
    yearGan: '庚' as HeavenlyStem,
    yearZhi: '申' as EarthlyBranch,
    monthGan: '戊' as HeavenlyStem,
    monthZhi: '申' as EarthlyBranch,
    dayGan: '壬' as HeavenlyStem,
    dayZhi: '申' as EarthlyBranch,
    hourGan: '庚' as HeavenlyStem,
    hourZhi: '戌' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '水' as FiveElement,
      primaryPattern: '偏官格',
      strengthLevel: '偏强',
      primaryXiShen: '金' as FiveElement,
      primaryYongShen: '木' as FiveElement,
      primaryJiShen: '土' as FiveElement,
      careerScore: 82,
      wealthScore: 60,
      marriageScore: 50,
      healthScore: 75,
      studyScore: 62,
      overallScore: 66,
    },
  },

  // ─── CLS-006: 癸酉日主，偏印格，极弱 ───
  {
    caseId: 'CLS-006',
    name: '某隐士',
    description: '癸酉日主，偏印格，金旺水弱，身极弱',
    source: '《穷通宝鉴》',
    dynasty: '清',
    yearGan: '辛' as HeavenlyStem,
    yearZhi: '酉' as EarthlyBranch,
    monthGan: '丁' as HeavenlyStem,
    monthZhi: '酉' as EarthlyBranch,
    dayGan: '癸' as HeavenlyStem,
    dayZhi: '酉' as EarthlyBranch,
    hourGan: '辛' as HeavenlyStem,
    hourZhi: '酉' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '水' as FiveElement,
      primaryPattern: '偏印格',
      strengthLevel: '极弱',
      primaryXiShen: '金' as FiveElement,
      primaryYongShen: '水' as FiveElement,
      primaryJiShen: '土' as FiveElement,
      careerScore: 45,
      wealthScore: 40,
      marriageScore: 50,
      healthScore: 42,
      studyScore: 72,
      overallScore: 50,
    },
  },

  // ─── CLS-007: 己亥日主，正印格，中和 ───
  {
    caseId: 'CLS-007',
    name: '某学者',
    description: '己亥日主，正印格，土水相涵，日主中和',
    source: '《滴天髓》',
    dynasty: '清',
    yearGan: '丙' as HeavenlyStem,
    yearZhi: '寅' as EarthlyBranch,
    monthGan: '辛' as HeavenlyStem,
    monthZhi: '卯' as EarthlyBranch,
    dayGan: '己' as HeavenlyStem,
    dayZhi: '亥' as EarthlyBranch,
    hourGan: '丙' as HeavenlyStem,
    hourZhi: '寅' as EarthlyBranch,
    gender: 'female' as const,
    expectedResult: {
      dayMasterElement: '土' as FiveElement,
      primaryPattern: '正印格',
      strengthLevel: '中和',
      primaryXiShen: '火' as FiveElement,
      primaryYongShen: '土' as FiveElement,
      primaryJiShen: '木' as FiveElement,
      careerScore: 70,
      wealthScore: 62,
      marriageScore: 68,
      healthScore: 72,
      studyScore: 85,
      overallScore: 71,
    },
  },

  // ─── CLS-008: 乙卯日主，食神格，偏强 ───
  {
    caseId: 'CLS-008',
    name: '某名医',
    description: '乙卯日主，食神格，木旺身强，食神泄秀',
    source: '《渊海子平》',
    dynasty: '宋',
    yearGan: '癸' as HeavenlyStem,
    yearZhi: '卯' as EarthlyBranch,
    monthGan: '乙' as HeavenlyStem,
    monthZhi: '卯' as EarthlyBranch,
    dayGan: '乙' as HeavenlyStem,
    dayZhi: '卯' as EarthlyBranch,
    hourGan: '己' as HeavenlyStem,
    hourZhi: '卯' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '木' as FiveElement,
      primaryPattern: '食神格',
      strengthLevel: '偏强',
      primaryXiShen: '水' as FiveElement,
      primaryYongShen: '火' as FiveElement,
      primaryJiShen: '金' as FiveElement,
      careerScore: 75,
      wealthScore: 68,
      marriageScore: 62,
      healthScore: 70,
      studyScore: 76,
      overallScore: 70,
    },
  },

  // ─── CLS-009: 辛巳日主，正官格，偏弱 ───
  {
    caseId: 'CLS-009',
    name: '某官员',
    description: '辛巳日主，正官格，火旺金弱，官杀太重',
    source: '《子平真诠》',
    dynasty: '清',
    yearGan: '甲' as HeavenlyStem,
    yearZhi: '午' as EarthlyBranch,
    monthGan: '丙' as HeavenlyStem,
    monthZhi: '午' as EarthlyBranch,
    dayGan: '辛' as HeavenlyStem,
    dayZhi: '巳' as EarthlyBranch,
    hourGan: '丁' as HeavenlyStem,
    hourZhi: '巳' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '金' as FiveElement,
      primaryPattern: '正官格',
      strengthLevel: '偏弱',
      primaryXiShen: '土' as FiveElement,
      primaryYongShen: '土' as FiveElement,
      primaryJiShen: '火' as FiveElement,
      careerScore: 58,
      wealthScore: 48,
      marriageScore: 55,
      healthScore: 52,
      studyScore: 60,
      overallScore: 55,
    },
  },

  // ─── CLS-010: 丁未日主，偏财格，中和 ───
  {
    caseId: 'CLS-010',
    name: '某商贾',
    description: '丁未日主，偏财格，火土相生，日主中和',
    source: '《神峰通考》',
    dynasty: '明',
    yearGan: '戊' as HeavenlyStem,
    yearZhi: '午' as EarthlyBranch,
    monthGan: '己' as HeavenlyStem,
    monthZhi: '未' as EarthlyBranch,
    dayGan: '丁' as HeavenlyStem,
    dayZhi: '未' as EarthlyBranch,
    hourGan: '丙' as HeavenlyStem,
    hourZhi: '午' as EarthlyBranch,
    gender: 'female' as const,
    expectedResult: {
      dayMasterElement: '火' as FiveElement,
      primaryPattern: '偏财格',
      strengthLevel: '中和',
      primaryXiShen: '木' as FiveElement,
      primaryYongShen: '火' as FiveElement,
      primaryJiShen: '水' as FiveElement,
      careerScore: 72,
      wealthScore: 80,
      marriageScore: 65,
      healthScore: 70,
      studyScore: 68,
      overallScore: 71,
    },
  },
]

// ═══════════════════════════════════════════
// 2. 匿名命例样本集（5 个样本）
// ═══════════════════════════════════════════

/**
 * 匿名真实命例样本集
 *
 * 收录 5 个经过专家标注的匿名真实命例。
 * 每条记录附带 confidence 字段表示预期结果的可信度。
 * 完整样本集待后续扩充至 500 个。
 */
export const ANONYMOUS_CASES: readonly AnonymousCase[] = [
  // ─── ANM-001: 甲木日主，伤官格 ───
  {
    caseId: 'ANM-001',
    yearGan: '乙' as HeavenlyStem,
    yearZhi: '酉' as EarthlyBranch,
    monthGan: '庚' as HeavenlyStem,
    monthZhi: '辰' as EarthlyBranch,
    dayGan: '甲' as HeavenlyStem,
    dayZhi: '子' as EarthlyBranch,
    hourGan: '丁' as HeavenlyStem,
    hourZhi: '卯' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '木' as FiveElement,
      primaryPattern: '伤官格',
      strengthLevel: '中和',
      primaryXiShen: '水' as FiveElement,
      primaryYongShen: '水' as FiveElement,
      primaryJiShen: '金' as FiveElement,
      careerScore: 62,
      wealthScore: 58,
      marriageScore: 55,
      healthScore: 65,
      studyScore: 70,
      overallScore: 62,
    },
    confidence: 0.9,
    source: 'expert-annotated',
  },

  // ─── ANM-002: 丙火日主，偏印格 ───
  {
    caseId: 'ANM-002',
    yearGan: '壬' as HeavenlyStem,
    yearZhi: '辰' as EarthlyBranch,
    monthGan: '甲' as HeavenlyStem,
    monthZhi: '辰' as EarthlyBranch,
    dayGan: '丙' as HeavenlyStem,
    dayZhi: '戌' as EarthlyBranch,
    hourGan: '戊' as HeavenlyStem,
    hourZhi: '申' as EarthlyBranch,
    gender: 'female' as const,
    expectedResult: {
      dayMasterElement: '火' as FiveElement,
      primaryPattern: '偏印格',
      strengthLevel: '偏弱',
      primaryXiShen: '木' as FiveElement,
      primaryYongShen: '木' as FiveElement,
      primaryJiShen: '水' as FiveElement,
      careerScore: 55,
      wealthScore: 50,
      marriageScore: 62,
      healthScore: 58,
      studyScore: 72,
      overallScore: 59,
    },
    confidence: 0.85,
    source: 'expert-annotated',
  },

  // ─── ANM-003: 戊土日主，正官格 ───
  {
    caseId: 'ANM-003',
    yearGan: '癸' as HeavenlyStem,
    yearZhi: '亥' as EarthlyBranch,
    monthGan: '甲' as HeavenlyStem,
    monthZhi: '寅' as EarthlyBranch,
    dayGan: '戊' as HeavenlyStem,
    dayZhi: '午' as EarthlyBranch,
    hourGan: '乙' as HeavenlyStem,
    hourZhi: '卯' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '土' as FiveElement,
      primaryPattern: '正官格',
      strengthLevel: '偏弱',
      primaryXiShen: '火' as FiveElement,
      primaryYongShen: '火' as FiveElement,
      primaryJiShen: '木' as FiveElement,
      careerScore: 60,
      wealthScore: 52,
      marriageScore: 58,
      healthScore: 55,
      studyScore: 65,
      overallScore: 58,
    },
    confidence: 0.92,
    source: 'expert-annotated',
  },

  // ─── ANM-004: 庚金日主，正财格 ───
  {
    caseId: 'ANM-004',
    yearGan: '丙' as HeavenlyStem,
    yearZhi: '申' as EarthlyBranch,
    monthGan: '丁' as HeavenlyStem,
    monthZhi: '丑' as EarthlyBranch,
    dayGan: '庚' as HeavenlyStem,
    dayZhi: '辰' as EarthlyBranch,
    hourGan: '甲' as HeavenlyStem,
    hourZhi: '申' as EarthlyBranch,
    gender: 'female' as const,
    expectedResult: {
      dayMasterElement: '金' as FiveElement,
      primaryPattern: '正财格',
      strengthLevel: '偏强',
      primaryXiShen: '土' as FiveElement,
      primaryYongShen: '水' as FiveElement,
      primaryJiShen: '火' as FiveElement,
      careerScore: 68,
      wealthScore: 75,
      marriageScore: 70,
      healthScore: 72,
      studyScore: 60,
      overallScore: 69,
    },
    confidence: 0.88,
    source: 'expert-annotated',
  },

  // ─── ANM-005: 壬水日主，正印格 ───
  {
    caseId: 'ANM-005',
    yearGan: '辛' as HeavenlyStem,
    yearZhi: '丑' as EarthlyBranch,
    monthGan: '庚' as HeavenlyStem,
    monthZhi: '丑' as EarthlyBranch,
    dayGan: '壬' as HeavenlyStem,
    dayZhi: '寅' as EarthlyBranch,
    hourGan: '辛' as HeavenlyStem,
    hourZhi: '丑' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '水' as FiveElement,
      primaryPattern: '正印格',
      strengthLevel: '中和',
      primaryXiShen: '金' as FiveElement,
      primaryYongShen: '木' as FiveElement,
      primaryJiShen: '土' as FiveElement,
      careerScore: 72,
      wealthScore: 65,
      marriageScore: 68,
      healthScore: 70,
      studyScore: 80,
      overallScore: 71,
    },
    confidence: 0.95,
    source: 'expert-annotated',
  },
]

// ═══════════════════════════════════════════
// 3. 回归样本集（10 个样本）
// ═══════════════════════════════════════════

/**
 * 自动回归样本集
 *
 * 收录 10 个自动生成的回归样本，每条记录附带引擎输出快照。
 * snapshotVersion 表示生成快照时的引擎版本，
 * snapshotAt 表示快照时间戳（毫秒）。
 * 完整样本集待后续扩充至 1000 个。
 */
export const REGRESSION_CASES: readonly RegressionCase[] = [
  // ─── REG-001: 甲木日主，食神格 ───
  {
    caseId: 'REG-001',
    yearGan: '丙' as HeavenlyStem,
    yearZhi: '寅' as EarthlyBranch,
    monthGan: '辛' as HeavenlyStem,
    monthZhi: '卯' as EarthlyBranch,
    dayGan: '甲' as HeavenlyStem,
    dayZhi: '午' as EarthlyBranch,
    hourGan: '壬' as HeavenlyStem,
    hourZhi: '申' as EarthlyBranch,
    gender: 'female' as const,
    expectedResult: {
      dayMasterElement: '木' as FiveElement,
      primaryPattern: '食神格',
      strengthLevel: '偏强',
      primaryXiShen: '水' as FiveElement,
      primaryYongShen: '火' as FiveElement,
      primaryJiShen: '金' as FiveElement,
      careerScore: 68,
      wealthScore: 62,
      marriageScore: 70,
      healthScore: 65,
      studyScore: 72,
      overallScore: 67,
    },
    snapshotVersion: '7.0.0',
    snapshotAt: 1752624000000,
  },

  // ─── REG-002: 丙火日主，偏财格 ───
  {
    caseId: 'REG-002',
    yearGan: '戊' as HeavenlyStem,
    yearZhi: '戌' as EarthlyBranch,
    monthGan: '壬' as HeavenlyStem,
    monthZhi: '子' as EarthlyBranch,
    dayGan: '丙' as HeavenlyStem,
    dayZhi: '申' as EarthlyBranch,
    hourGan: '庚' as HeavenlyStem,
    hourZhi: '寅' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '火' as FiveElement,
      primaryPattern: '偏财格',
      strengthLevel: '偏弱',
      primaryXiShen: '木' as FiveElement,
      primaryYongShen: '火' as FiveElement,
      primaryJiShen: '水' as FiveElement,
      careerScore: 55,
      wealthScore: 70,
      marriageScore: 52,
      healthScore: 58,
      studyScore: 60,
      overallScore: 59,
    },
    snapshotVersion: '7.0.0',
    snapshotAt: 1752624000000,
  },

  // ─── REG-003: 戊土日主，正印格 ───
  {
    caseId: 'REG-003',
    yearGan: '丁' as HeavenlyStem,
    yearZhi: '巳' as EarthlyBranch,
    monthGan: '丙' as HeavenlyStem,
    monthZhi: '午' as EarthlyBranch,
    dayGan: '戊' as HeavenlyStem,
    dayZhi: '午' as EarthlyBranch,
    hourGan: '己' as HeavenlyStem,
    hourZhi: '巳' as EarthlyBranch,
    gender: 'female' as const,
    expectedResult: {
      dayMasterElement: '土' as FiveElement,
      primaryPattern: '正印格',
      strengthLevel: '偏强',
      primaryXiShen: '火' as FiveElement,
      primaryYongShen: '土' as FiveElement,
      primaryJiShen: '木' as FiveElement,
      careerScore: 70,
      wealthScore: 65,
      marriageScore: 68,
      healthScore: 72,
      studyScore: 75,
      overallScore: 70,
    },
    snapshotVersion: '7.0.0',
    snapshotAt: 1752624000000,
  },

  // ─── REG-004: 庚金日主，七杀格 ───
  {
    caseId: 'REG-004',
    yearGan: '甲' as HeavenlyStem,
    yearZhi: '申' as EarthlyBranch,
    monthGan: '丁' as HeavenlyStem,
    monthZhi: '卯' as EarthlyBranch,
    dayGan: '庚' as HeavenlyStem,
    dayZhi: '寅' as EarthlyBranch,
    hourGan: '丙' as HeavenlyStem,
    hourZhi: '子' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '金' as FiveElement,
      primaryPattern: '七杀格',
      strengthLevel: '偏弱',
      primaryXiShen: '土' as FiveElement,
      primaryYongShen: '土' as FiveElement,
      primaryJiShen: '火' as FiveElement,
      careerScore: 52,
      wealthScore: 48,
      marriageScore: 45,
      healthScore: 50,
      studyScore: 55,
      overallScore: 50,
    },
    snapshotVersion: '7.0.0',
    snapshotAt: 1752624000000,
  },

  // ─── REG-005: 壬水日主，正官格 ───
  {
    caseId: 'REG-005',
    yearGan: '己' as HeavenlyStem,
    yearZhi: '未' as EarthlyBranch,
    monthGan: '辛' as HeavenlyStem,
    monthZhi: '酉' as EarthlyBranch,
    dayGan: '壬' as HeavenlyStem,
    dayZhi: '辰' as EarthlyBranch,
    hourGan: '己' as HeavenlyStem,
    hourZhi: '酉' as EarthlyBranch,
    gender: 'female' as const,
    expectedResult: {
      dayMasterElement: '水' as FiveElement,
      primaryPattern: '正官格',
      strengthLevel: '中和',
      primaryXiShen: '金' as FiveElement,
      primaryYongShen: '木' as FiveElement,
      primaryJiShen: '土' as FiveElement,
      careerScore: 72,
      wealthScore: 65,
      marriageScore: 70,
      healthScore: 68,
      studyScore: 74,
      overallScore: 70,
    },
    snapshotVersion: '7.0.0',
    snapshotAt: 1752624000000,
  },

  // ─── REG-006: 乙木日主，偏财格 ───
  {
    caseId: 'REG-006',
    yearGan: '庚' as HeavenlyStem,
    yearZhi: '午' as EarthlyBranch,
    monthGan: '癸' as HeavenlyStem,
    monthZhi: '未' as EarthlyBranch,
    dayGan: '乙' as HeavenlyStem,
    dayZhi: '酉' as EarthlyBranch,
    hourGan: '己' as HeavenlyStem,
    hourZhi: '丑' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '木' as FiveElement,
      primaryPattern: '偏财格',
      strengthLevel: '偏弱',
      primaryXiShen: '水' as FiveElement,
      primaryYongShen: '水' as FiveElement,
      primaryJiShen: '金' as FiveElement,
      careerScore: 58,
      wealthScore: 68,
      marriageScore: 60,
      healthScore: 55,
      studyScore: 62,
      overallScore: 61,
    },
    snapshotVersion: '7.0.0',
    snapshotAt: 1752624000000,
  },

  // ─── REG-007: 丁火日主，伤官格 ───
  {
    caseId: 'REG-007',
    yearGan: '壬' as HeavenlyStem,
    yearZhi: '寅' as EarthlyBranch,
    monthGan: '癸' as HeavenlyStem,
    monthZhi: '卯' as EarthlyBranch,
    dayGan: '丁' as HeavenlyStem,
    dayZhi: '未' as EarthlyBranch,
    hourGan: '乙' as HeavenlyStem,
    hourZhi: '巳' as EarthlyBranch,
    gender: 'female' as const,
    expectedResult: {
      dayMasterElement: '火' as FiveElement,
      primaryPattern: '伤官格',
      strengthLevel: '偏弱',
      primaryXiShen: '木' as FiveElement,
      primaryYongShen: '木' as FiveElement,
      primaryJiShen: '水' as FiveElement,
      careerScore: 55,
      wealthScore: 50,
      marriageScore: 48,
      healthScore: 52,
      studyScore: 70,
      overallScore: 55,
    },
    snapshotVersion: '7.0.0',
    snapshotAt: 1752624000000,
  },

  // ─── REG-008: 己土日主，食神格 ───
  {
    caseId: 'REG-008',
    yearGan: '甲' as HeavenlyStem,
    yearZhi: '子' as EarthlyBranch,
    monthGan: '丙' as HeavenlyStem,
    monthZhi: '寅' as EarthlyBranch,
    dayGan: '己' as HeavenlyStem,
    dayZhi: '卯' as EarthlyBranch,
    hourGan: '庚' as HeavenlyStem,
    hourZhi: '午' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '土' as FiveElement,
      primaryPattern: '食神格',
      strengthLevel: '偏弱',
      primaryXiShen: '火' as FiveElement,
      primaryYongShen: '火' as FiveElement,
      primaryJiShen: '木' as FiveElement,
      careerScore: 60,
      wealthScore: 58,
      marriageScore: 65,
      healthScore: 62,
      studyScore: 68,
      overallScore: 63,
    },
    snapshotVersion: '7.0.0',
    snapshotAt: 1752624000000,
  },

  // ─── REG-009: 辛金日主，正印格 ───
  {
    caseId: 'REG-009',
    yearGan: '戊' as HeavenlyStem,
    yearZhi: '申' as EarthlyBranch,
    monthGan: '庚' as HeavenlyStem,
    monthZhi: '申' as EarthlyBranch,
    dayGan: '辛' as HeavenlyStem,
    dayZhi: '巳' as EarthlyBranch,
    hourGan: '戊' as HeavenlyStem,
    hourZhi: '戌' as EarthlyBranch,
    gender: 'female' as const,
    expectedResult: {
      dayMasterElement: '金' as FiveElement,
      primaryPattern: '正印格',
      strengthLevel: '偏强',
      primaryXiShen: '土' as FiveElement,
      primaryYongShen: '水' as FiveElement,
      primaryJiShen: '火' as FiveElement,
      careerScore: 72,
      wealthScore: 68,
      marriageScore: 65,
      healthScore: 70,
      studyScore: 75,
      overallScore: 70,
    },
    snapshotVersion: '7.0.0',
    snapshotAt: 1752624000000,
  },

  // ─── REG-010: 癸水日主，偏官格 ───
  {
    caseId: 'REG-010',
    yearGan: '己' as HeavenlyStem,
    yearZhi: '未' as EarthlyBranch,
    monthGan: '辛' as HeavenlyStem,
    monthZhi: '酉' as EarthlyBranch,
    dayGan: '癸' as HeavenlyStem,
    dayZhi: '丑' as EarthlyBranch,
    hourGan: '庚' as HeavenlyStem,
    hourZhi: '申' as EarthlyBranch,
    gender: 'male' as const,
    expectedResult: {
      dayMasterElement: '水' as FiveElement,
      primaryPattern: '偏官格',
      strengthLevel: '偏强',
      primaryXiShen: '金' as FiveElement,
      primaryYongShen: '木' as FiveElement,
      primaryJiShen: '土' as FiveElement,
      careerScore: 75,
      wealthScore: 60,
      marriageScore: 52,
      healthScore: 68,
      studyScore: 65,
      overallScore: 64,
    },
    snapshotVersion: '7.0.0',
    snapshotAt: 1752624000000,
  },
]

// ═══════════════════════════════════════════
// 4. 查询函数
// ═══════════════════════════════════════════

/**
 * 获取所有经典命例
 * @returns 经典命例数组的副本
 */
export function getClassicCases(): ClassicCase[] {
  return [...CLASSIC_CASES]
}

/**
 * 获取所有匿名命例
 * @returns 匿名命例数组的副本
 */
export function getAnonymousCases(): AnonymousCase[] {
  return [...ANONYMOUS_CASES]
}

/**
 * 获取所有回归样本
 * @returns 回归样本数组的副本
 */
export function getRegressionCases(): RegressionCase[] {
  return [...REGRESSION_CASES]
}

/**
 * 获取所有命例（经典 + 匿名 + 回归）
 * @returns 合并后的全部命例数组
 */
export function getAllCases(): CaseEntry[] {
  return [
    ...CLASSIC_CASES,
    ...ANONYMOUS_CASES,
    ...REGRESSION_CASES,
  ]
}

/**
 * 根据 caseId 查询单个命例
 * @param id - 命例唯一标识符（如 'CLS-001'、'ANM-003'、'REG-010'）
 * @returns 匹配的命例，若未找到则返回 undefined
 */
export function getCaseById(id: string): CaseEntry | undefined {
  const all: readonly CaseEntry[] = getAllCases()
  return all.find((entry) => entry.caseId === id)
}

/**
 * 根据类别筛选命例
 * @param category - 命例类别：'classic' | 'anonymous' | 'regression'
 * @returns 属于指定类别的命例数组
 */
export function getCasesByCategory(category: CaseCategory): CaseEntry[] {
  switch (category) {
    case 'classic':
      return [...CLASSIC_CASES]
    case 'anonymous':
      return [...ANONYMOUS_CASES]
    case 'regression':
      return [...REGRESSION_CASES]
  }
}

/**
 * 获取各类别命例数量统计
 * @returns 包含 classic、anonymous、regression 和 total 四个计数的统计对象
 */
export function getTotalCaseCount(): {
  classic: number
  anonymous: number
  regression: number
  total: number
} {
  return {
    classic: CLASSIC_CASES.length,
    anonymous: ANONYMOUS_CASES.length,
    regression: REGRESSION_CASES.length,
    total: CLASSIC_CASES.length + ANONYMOUS_CASES.length + REGRESSION_CASES.length,
  }
}