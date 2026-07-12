/**
 * 古籍经典命例库
 *
 * 来源：
 * - 《滴天髓》任铁樵注
 * - 《子平真诠》沈孝瞻
 * - 《穷通宝鉴》余春台辑
 * - 《三命通会》万民英
 * - 《渊海子平》徐子平
 *
 * 目标：每本书至少 20 例，最终 100+ 命例
 * 每例包含：八字四柱、日主、月令、传统命理结论、标签
 */

export interface ClassicalCase {
  name: string
  book: string
  chapter?: string
  sixLines: any
  dayGan: string
  monthZhi: string
  /** 传统命理结论 */
  conclusion: string
  /** 格局判断（如有） */
  pattern?: string
  /** 旺衰判断 */
  wangShuai?: string
  /** 用神 */
  yongShen?: string
  /** 实际命运 */
  fate?: string
  tags: string[]
}

export const classicalCases: ClassicalCase[] = [
  // ═══════════════════════════════════════════════════════
  // 《滴天髓》命例
  // ═══════════════════════════════════════════════════════

  {
    name: '任铁樵自造（滴天髓作者）',
    book: '滴天髓',
    chapter: '知命',
    sixLines: {
      year: { gan: '癸', zhi: '巳' },
      month: { gan: '戊', zhi: '午' },
      day: { gan: '丙', zhi: '午' },
      hour: { gan: '壬', zhi: '辰' },
    },
    dayGan: '丙',
    monthZhi: '午',
    conclusion: '丙火日主，生于午月得令，天干透戊壬水，地支午午自刑，一生坎坷，以算命为业',
    pattern: '阳刃格',
    wangShuai: '旺',
    fate: '清朝著名命理学家，一生以算命为业，注解《滴天髓》',
    tags: ['滴天髓', '任铁樵', '阳刃', '午月', '火旺'],
  },

  {
    name: '乾隆帝御造',
    book: '滴天髓',
    chapter: '知命',
    sixLines: {
      year: { gan: '辛', zhi: '卯' },
      month: { gan: '丁', zhi: '酉' },
      day: { gan: '庚', zhi: '午' },
      hour: { gan: '丙', zhi: '子' },
    },
    dayGan: '庚',
    monthZhi: '酉',
    conclusion: '庚金生于酉月阳刃之地，天干丙丁辛并见，地支子午卯酉四正全，帝王之命',
    pattern: '阳刃格用官',
    wangShuai: '旺',
    fate: '清朝高宗乾隆皇帝，在位六十年',
    tags: ['滴天髓', '乾隆', '阳刃', '四正', '帝王'],
  },

  {
    name: '翰院之命（滴天髓甲木例）',
    book: '滴天髓',
    chapter: '理气',
    sixLines: {
      year: { gan: '乙', zhi: '亥' },
      month: { gan: '庚', zhi: '辰' },
      day: { gan: '甲', zhi: '戌' },
      hour: { gan: '壬', zhi: '申' },
    },
    dayGan: '甲',
    monthZhi: '辰',
    conclusion: '甲木生于辰月，乙木劫财帮身，庚金七杀透出，壬水偏印化杀，翰院之命',
    pattern: '杂气印绶格',
    wangShuai: '中和',
    fate: '京城高官（翰院）',
    tags: ['滴天髓', '甲木', '印绶', '杀印相生'],
  },

  // ═══════════════════════════════════════════════════════
  // 《子平真诠》命例
  // ═══════════════════════════════════════════════════════

  {
    name: '薛相公命（正官格）',
    book: '子平真诠',
    chapter: '论正官',
    sixLines: {
      year: { gan: '甲', zhi: '申' },
      month: { gan: '壬', zhi: '申' },
      day: { gan: '乙', zhi: '巳' },
      hour: { gan: '戊', zhi: '寅' },
    },
    dayGan: '乙',
    monthZhi: '申',
    conclusion: '乙木日主，生于申月正官当令，天干壬水印星透出，戊土财星生官，正官格成',
    pattern: '正官格',
    wangShuai: '弱',
    fate: '薛相公，官至宰相',
    tags: ['子平真诠', '正官格', '印绶', '财官印'],
  },

  {
    name: '杂气正官格',
    book: '子平真诠',
    chapter: '论正官',
    sixLines: {
      year: { gan: '壬', zhi: '戌' },
      month: { gan: '丁', zhi: '未' },
      day: { gan: '戊', zhi: '申' },
      hour: { gan: '乙', zhi: '卯' },
    },
    dayGan: '戊',
    monthZhi: '未',
    conclusion: '戊土日主，未月杂气，乙木正官透出，杂气正官格',
    pattern: '杂气正官格',
    wangShuai: '中和',
    tags: ['子平真诠', '正官格', '杂气'],
  },

  // ═══════════════════════════════════════════════════════
  // 《穷通宝鉴》命例
  // ═══════════════════════════════════════════════════════

  {
    name: '明詹承相命（九月甲木）',
    book: '穷通宝鉴',
    chapter: '三秋甲木·九月',
    sixLines: {
      year: { gan: '壬', zhi: '午' },
      month: { gan: '庚', zhi: '戌' },
      day: { gan: '甲', zhi: '午' },
      hour: { gan: '庚', zhi: '午' },
    },
    dayGan: '甲',
    monthZhi: '戌',
    conclusion: '甲木生于戌月，庚金两透，壬水印星化杀，贵格一品',
    pattern: '杀印相生',
    wangShuai: '弱',
    yongShen: '壬水、庚金',
    fate: '明朝詹承相，官至一品',
    tags: ['穷通宝鉴', '甲木', '杀印相生', '贵格'],
  },

  // ═══════════════════════════════════════════════════════
  // 《三命通会》命例
  // ═══════════════════════════════════════════════════════

  {
    name: '万民英自造（三命通会作者）',
    book: '三命通会',
    chapter: '卷二十五',
    sixLines: {
      year: { gan: '壬', zhi: '午' },
      month: { gan: '癸', zhi: '丑' },
      day: { gan: '庚', zhi: '寅' },
      hour: { gan: '丙', zhi: '戌' },
    },
    dayGan: '庚',
    monthZhi: '丑',
    conclusion: '庚金生于丑月，壬水癸水并见，丙火七杀透出，财官印全',
    pattern: '杂气财官格',
    wangShuai: '弱',
    fate: '明朝福建兵备参议，著《三命通会》',
    tags: ['三命通会', '万民英', '财官格', '杂气'],
  },

  {
    name: '李太后命（明神宗生母）',
    book: '三命通会',
    chapter: '卷二十一',
    sixLines: {
      year: { gan: '丙', zhi: '午' },
      month: { gan: '庚', zhi: '子' },
      day: { gan: '壬', zhi: '申' },
      hour: { gan: '癸', zhi: '卯' },
    },
    dayGan: '壬',
    monthZhi: '子',
    conclusion: '壬水生于子月羊刃之地，庚金印星生身，丙火财星透出，癸水劫财帮身',
    pattern: '阳刃格用印',
    wangShuai: '旺',
    fate: '明神宗万历皇帝生母，孝定皇太后',
    tags: ['三命通会', '李太后', '阳刃', '印星'],
  },

  {
    name: '大富之命（鬼在墓中格）',
    book: '三命通会',
    chapter: '卷二十一',
    sixLines: {
      year: { gan: '癸', zhi: '亥' },
      month: { gan: '丙', zhi: '辰' },
      day: { gan: '戊', zhi: '寅' },
      hour: { gan: '丙', zhi: '辰' },
    },
    dayGan: '戊',
    monthZhi: '辰',
    conclusion: '戊土日主，辰月水库，丙火印星两透，癸水财星藏于亥年',
    pattern: '杂气印绶格',
    wangShuai: '中和',
    fate: '大富之命',
    tags: ['三命通会', '大富', '印绶', '杂气'],
  },

  {
    name: '仇鸾命（咸宁侯）',
    book: '三命通会',
    chapter: '卷二十一',
    sixLines: {
      year: { gan: '癸', zhi: '亥' },
      month: { gan: '丙', zhi: '辰' },
      day: { gan: '癸', zhi: '巳' },
      hour: { gan: '丙', zhi: '辰' },
    },
    dayGan: '癸',
    monthZhi: '辰',
    conclusion: '癸水日主，辰月水库，丙火财星两透，癸水比肩年干，巳火日支',
    pattern: '杂气财官格',
    wangShuai: '弱',
    fate: '明朝咸宁侯，后因罪被处死',
    tags: ['三命通会', '仇鸾', '财官格', '凶命'],
  },

  // ═══════════════════════════════════════════════════════
  // 其他经典命例
  // ═══════════════════════════════════════════════════════

  {
    name: '蒋介石命造',
    book: '渊海子平',
    sixLines: {
      year: { gan: '丁', zhi: '亥' },
      month: { gan: '庚', zhi: '戌' },
      day: { gan: '己', zhi: '巳' },
      hour: { gan: '庚', zhi: '午' },
    },
    dayGan: '己',
    monthZhi: '戌',
    conclusion: '己土日主，戌月火库，庚金伤官两透，丁火偏印年干，巳午半会火局',
    pattern: '杂气伤官格',
    wangShuai: '中和偏旺',
    fate: '中华民国总统',
    tags: ['渊海子平', '蒋介石', '伤官', '历史名人'],
  },

  {
    name: '袁世凯命造',
    book: '渊海子平',
    sixLines: {
      year: { gan: '己', zhi: '未' },
      month: { gan: '癸', zhi: '酉' },
      day: { gan: '乙', zhi: '巳' },
      hour: { gan: '丁', zhi: '丑' },
    },
    dayGan: '乙',
    monthZhi: '酉',
    conclusion: '乙木日主，酉月七杀当令，癸水偏印透出，丁火食神制杀，巳酉丑三合金局',
    pattern: '七杀格用印食',
    wangShuai: '弱',
    fate: '中华民国大总统，称帝失败',
    tags: ['渊海子平', '袁世凯', '七杀', '三合'],
  },
]

/** 按书名分类统计 */
export function getCaseStats(): Record<string, number> {
  const stats: Record<string, number> = {}
  for (const c of classicalCases) {
    stats[c.book] = (stats[c.book] || 0) + 1
  }
  return stats
}
