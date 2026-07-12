/**
 * P4.14 I18nEngine — 国际化引擎
 *
 * 纯 Plugin 模块，不修改 Kernel。
 * Core 完全无语言绑定，语言层作为 Plugin 实现。
 * 内置 55 条命理术语的五语言翻译（zh-CN / zh-TW / en / ja / ko）。
 *
 * 古籍依据：
 *   《礼记·中庸》引《易经》："今天下车同轨，书同文，行同伦。"
 *   —— 国际化即"书同文"，让同一套命理知识以不同语言呈现，
 *      不改变 Core 逻辑，仅在语言层做映射。
 *
 * 支持语言：
 *   zh-CN  简体中文
 *   zh-TW  繁體中文
 *   en     English
 *   ja     日本語
 *   ko     한국어
 */

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

/** 格式化时间为 YYYY-MM-DD HH:mm:ss */
function formatDateTime(d: Date): string {
  var pad = function (n: number): string {
    return n.toString().padStart(2, '0')
  }
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' '
    + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
}

/** 保留一位小数 */
function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** 安全除法，分母为零返回 0 */
function safeDiv(a: number, b: number): number {
  return b === 0 ? 0 : a / b
}

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

/** 支持的语言区域 */
export type SupportedLocale = 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko'

/** 国际化词条 */
export interface I18nEntry {
  /** 词条键（推荐使用英文 snake_case） */
  key: string
  /** 各语言翻译 */
  translations: Record<SupportedLocale, string>
}

/** 国际化报告 */
export interface I18nResult {
  /** 报告生成时间 */
  generatedAt: string
  /** 当前语言区域 */
  locale: SupportedLocale
  /** 所有支持的语言 */
  supportedLocales: SupportedLocale[]
  /** 总词条数 */
  totalEntries: number
  /** 各语言的翻译覆盖率（百分比） */
  coverage: Record<SupportedLocale, number>
  /** 详细报告文本 */
  report: string
  /** 古籍引用 */
  classicalRef: string
}

/** 所有支持的语言区域列表 */
export var ALL_LOCALES: SupportedLocale[] = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']

/** 语言区域的中文名称 */
var LOCALE_LABEL: Record<SupportedLocale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어'
}

// ═══════════════════════════════════════════════════════════
// 内置命理术语翻译数据（55 条）
// ═══════════════════════════════════════════════════════════

/** 十天干 */
var TEN_STEMS: I18nEntry[] = [
  {
    key: 'stem_jia',
    translations: { 'zh-CN': '甲', 'zh-TW': '甲', 'en': 'Jia (Yang Wood)', 'ja': '甲（きのえ）', 'ko': '갑목(양목)' }
  },
  {
    key: 'stem_yi',
    translations: { 'zh-CN': '乙', 'zh-TW': '乙', 'en': 'Yi (Yin Wood)', 'ja': '乙（きのと）', 'ko': '을목(음목)' }
  },
  {
    key: 'stem_bing',
    translations: { 'zh-CN': '丙', 'zh-TW': '丙', 'en': 'Bing (Yang Fire)', 'ja': '丙（ひのえ）', 'ko': '병화(양화)' }
  },
  {
    key: 'stem_ding',
    translations: { 'zh-CN': '丁', 'zh-TW': '丁', 'en': 'Ding (Yin Fire)', 'ja': '丁（ひのと）', 'ko': '정화(음화)' }
  },
  {
    key: 'stem_wu',
    translations: { 'zh-CN': '戊', 'zh-TW': '戊', 'en': 'Wu (Yang Earth)', 'ja': '戊（つちのえ）', 'ko': '무토(양토)' }
  },
  {
    key: 'stem_ji',
    translations: { 'zh-CN': '己', 'zh-TW': '己', 'en': 'Ji (Yin Earth)', 'ja': '己（つちのと）', 'ko': '기토(음토)' }
  },
  {
    key: 'stem_geng',
    translations: { 'zh-CN': '庚', 'zh-TW': '庚', 'en': 'Geng (Yang Metal)', 'ja': '庚（かのえ）', 'ko': '경금(양금)' }
  },
  {
    key: 'stem_xin',
    translations: { 'zh-CN': '辛', 'zh-TW': '辛', 'en': 'Xin (Yin Metal)', 'ja': '辛（かのと）', 'ko': '신금(음금)' }
  },
  {
    key: 'stem_ren',
    translations: { 'zh-CN': '壬', 'zh-TW': '壬', 'en': 'Ren (Yang Water)', 'ja': '壬（みずのえ）', 'ko': '임수(양수)' }
  },
  {
    key: 'stem_gui',
    translations: { 'zh-CN': '癸', 'zh-TW': '癸', 'en': 'Gui (Yin Water)', 'ja': '癸（みずのと）', 'ko': '계수(음수)' }
  }
]

/** 十二地支 */
var TWELVE_BRANCHES: I18nEntry[] = [
  {
    key: 'branch_zi',
    translations: { 'zh-CN': '子', 'zh-TW': '子', 'en': 'Zi (Rat)', 'ja': '子（ね）', 'ko': '자(쥐)' }
  },
  {
    key: 'branch_chou',
    translations: { 'zh-CN': '丑', 'zh-TW': '丑', 'en': 'Chou (Ox)', 'ja': '丑（うし）', 'ko': '축(소)' }
  },
  {
    key: 'branch_yin',
    translations: { 'zh-CN': '寅', 'zh-TW': '寅', 'en': 'Yin (Tiger)', 'ja': '寅（とら）', 'ko': '인(호랑이)' }
  },
  {
    key: 'branch_mao',
    translations: { 'zh-CN': '卯', 'zh-TW': '卯', 'en': 'Mao (Rabbit)', 'ja': '卯（う）', 'ko': '묘(토끼)' }
  },
  {
    key: 'branch_chen',
    translations: { 'zh-CN': '辰', 'zh-TW': '辰', 'en': 'Chen (Dragon)', 'ja': '辰（たつ）', 'ko': '진(용)' }
  },
  {
    key: 'branch_si',
    translations: { 'zh-CN': '巳', 'zh-TW': '巳', 'en': 'Si (Snake)', 'ja': '巳（み）', 'ko': '사(뱀)' }
  },
  {
    key: 'branch_wu',
    translations: { 'zh-CN': '午', 'zh-TW': '午', 'en': 'Wu (Horse)', 'ja': '午（うま）', 'ko': '오(말)' }
  },
  {
    key: 'branch_wei',
    translations: { 'zh-CN': '未', 'zh-TW': '未', 'en': 'Wei (Goat)', 'ja': '未（ひつじ）', 'ko': '미(양)' }
  },
  {
    key: 'branch_shen',
    translations: { 'zh-CN': '申', 'zh-TW': '申', 'en': 'Shen (Monkey)', 'ja': '申（さる）', 'ko': '신(원숭이)' }
  },
  {
    key: 'branch_you',
    translations: { 'zh-CN': '酉', 'zh-TW': '酉', 'en': 'You (Rooster)', 'ja': '酉（とり）', 'ko': '유(닭)' }
  },
  {
    key: 'branch_xu',
    translations: { 'zh-CN': '戌', 'zh-TW': '戌', 'en': 'Xu (Dog)', 'ja': '戌（いぬ）', 'ko': '술(개)' }
  },
  {
    key: 'branch_hai',
    translations: { 'zh-CN': '亥', 'zh-TW': '亥', 'en': 'Hai (Pig)', 'ja': '亥（い）', 'ko': '해(돼지)' }
  }
]

/** 核心命理术语（十神、格局、神煞等） */
var CORE_TERMS: I18nEntry[] = [
  {
    key: 'ri_zhu',
    translations: {
      'zh-CN': '日主',
      'zh-TW': '日主',
      'en': 'Day Master',
      'ja': '日主（にっしゅ）',
      'ko': '일주'
    }
  },
  {
    key: 'yue_ling',
    translations: {
      'zh-CN': '月令',
      'zh-TW': '月令',
      'en': 'Monthly Command',
      'ja': '月令（げつれい）',
      'ko': '월령'
    }
  },
  {
    key: 'shi_chen',
    translations: {
      'zh-CN': '时辰',
      'zh-TW': '時辰',
      'en': 'Birth Hour',
      'ja': '時辰（じしん）',
      'ko': '시진'
    }
  },
  {
    key: 'zheng_guan',
    translations: {
      'zh-CN': '正官',
      'zh-TW': '正官',
      'en': 'Direct Officer',
      'ja': '正官（せいかん）',
      'ko': '정관'
    }
  },
  {
    key: 'qi_sha',
    translations: {
      'zh-CN': '七杀',
      'zh-TW': '七殺',
      'en': 'Seven Killings',
      'ja': '七殺（しちさつ）',
      'ko': '칠살'
    }
  },
  {
    key: 'zheng_yin',
    translations: {
      'zh-CN': '正印',
      'zh-TW': '正印',
      'en': 'Direct Seal',
      'ja': '正印（しょういん）',
      'ko': '정인'
    }
  },
  {
    key: 'pian_yin',
    translations: {
      'zh-CN': '偏印',
      'zh-TW': '偏印',
      'en': 'Indirect Seal',
      'ja': '偏印（へんいん）',
      'ko': '편인'
    }
  },
  {
    key: 'shi_shen',
    translations: {
      'zh-CN': '食神',
      'zh-TW': '食神',
      'en': 'Eating God',
      'ja': '食神（しょくしん）',
      'ko': '식신'
    }
  },
  {
    key: 'shang_guan',
    translations: {
      'zh-CN': '伤官',
      'zh-TW': '傷官',
      'en': 'Hurting Officer',
      'ja': '傷官（しょうかん）',
      'ko': '상관'
    }
  },
  {
    key: 'zheng_cai',
    translations: {
      'zh-CN': '正财',
      'zh-TW': '正財',
      'en': 'Direct Wealth',
      'ja': '正財（せいざい）',
      'ko': '정재'
    }
  },
  {
    key: 'pian_cai',
    translations: {
      'zh-CN': '偏财',
      'zh-TW': '偏財',
      'en': 'Indirect Wealth',
      'ja': '偏財（へんざい）',
      'ko': '편재'
    }
  },
  {
    key: 'bi_jian',
    translations: {
      'zh-CN': '比肩',
      'zh-TW': '比肩',
      'en': 'Friend (Rob Wealth)',
      'ja': '比肩（ひけん）',
      'ko': '비견'
    }
  },
  {
    key: 'jie_cai',
    translations: {
      'zh-CN': '劫财',
      'zh-TW': '劫財',
      'en': 'Rob Wealth',
      'ja': '劫財（ごうざい）',
      'ko': '겁재'
    }
  },
  {
    key: 'wang_shuai',
    translations: {
      'zh-CN': '旺衰',
      'zh-TW': '旺衰',
      'en': 'Strength (Prosperity/Decline)',
      'ja': '旺衰（おうすい）',
      'ko': '왕쇠(강약)'
    }
  },
  {
    key: 'ge_ju',
    translations: {
      'zh-CN': '格局',
      'zh-TW': '格局',
      'en': 'Chart Pattern',
      'ja': '格局（かっかく）',
      'ko': '격국'
    }
  },
  {
    key: 'yong_shen',
    translations: {
      'zh-CN': '用神',
      'zh-TW': '用神',
      'en': 'Useful God',
      'ja': '用神（ようしん）',
      'ko': '용신'
    }
  },
  {
    key: 'xi_shen',
    translations: {
      'zh-CN': '喜神',
      'zh-TW': '喜神',
      'en': 'Favorable God',
      'ja': '喜神（きしん）',
      'ko': '희신'
    }
  },
  {
    key: 'ji_shen',
    translations: {
      'zh-CN': '忌神',
      'zh-TW': '忌神',
      'en': 'Taboo God',
      'ja': '忌神（いみしん）',
      'ko': '기신'
    }
  },
  {
    key: 'tiao_hou',
    translations: {
      'zh-CN': '调候',
      'zh-TW': '調候',
      'en': 'Climate Adjustment',
      'ja': '調候（ちょうこう）',
      'ko': '조후'
    }
  },
  {
    key: 'bing_yao',
    translations: {
      'zh-CN': '病药',
      'zh-TW': '病藥',
      'en': 'Disease and Medicine',
      'ja': '病薬（びょうやく）',
      'ko': '병약'
    }
  },
  {
    key: 'tong_guan',
    translations: {
      'zh-CN': '通关',
      'zh-TW': '通關',
      'en': 'Bridging (Pass)',
      'ja': '通関（つうかん）',
      'ko': '통관'
    }
  },
  {
    key: 'da_yun',
    translations: {
      'zh-CN': '大运',
      'zh-TW': '大運',
      'en': 'Major Luck Cycles',
      'ja': '大運（だいうん）',
      'ko': '대운'
    }
  },
  {
    key: 'liu_nian',
    translations: {
      'zh-CN': '流年',
      'zh-TW': '流年',
      'en': 'Annual Luck',
      'ja': '流年（りゅうねん）',
      'ko': '유년'
    }
  },
  {
    key: 'tian_yi_gui_ren',
    translations: {
      'zh-CN': '天乙贵人',
      'zh-TW': '天乙貴人',
      'en': 'Heavenly Yi Noble',
      'ja': '天乙貴人（てんいつきじん）',
      'ko': '천을귀인'
    }
  },
  {
    key: 'wen_chang',
    translations: {
      'zh-CN': '文昌',
      'zh-TW': '文昌',
      'en': 'Wen Chang (Literary Star)',
      'ja': '文昌（ぶんしょう）',
      'ko': '문창'
    }
  },
  {
    key: 'yi_ma',
    translations: {
      'zh-CN': '驿马',
      'zh-TW': '驛馬',
      'en': 'Traveling Horse',
      'ja': '駅馬（えきば）',
      'ko': '역마'
    }
  },
  {
    key: 'tao_hua',
    translations: {
      'zh-CN': '桃花',
      'zh-TW': '桃花',
      'en': 'Peach Blossom',
      'ja': '桃花（とうか）',
      'ko': '도화'
    }
  },
  {
    key: 'hua_gai',
    translations: {
      'zh-CN': '华盖',
      'zh-TW': '華蓋',
      'en': 'Canopy (Hua Gai)',
      'ja': '華蓋（かがい）',
      'ko': '화개'
    }
  },
  {
    key: 'yang_ren',
    translations: {
      'zh-CN': '羊刃',
      'zh-TW': '羊刃',
      'en': 'Yang Ren (Yang Blade)',
      'ja': '羊刃（ようじん）',
      'ko': '양인'
    }
  },
  {
    key: 'kong_wang',
    translations: {
      'zh-CN': '空亡',
      'zh-TW': '空亡',
      'en': 'Void (Kong Wang)',
      'ja': '空亡（くうぼう）',
      'ko': '공망'
    }
  },
  {
    key: 'wu_xing',
    translations: {
      'zh-CN': '五行',
      'zh-TW': '五行',
      'en': 'Five Elements',
      'ja': '五行（ごぎょう）',
      'ko': '오행'
    }
  },
  {
    key: 'yin_yang',
    translations: {
      'zh-CN': '阴阳',
      'zh-TW': '陰陽',
      'en': 'Yin and Yang',
      'ja': '陰陽（いんよう）',
      'ko': '음양'
    }
  },
  {
    key: 'si_zhu',
    translations: {
      'zh-CN': '四柱',
      'zh-TW': '四柱',
      'en': 'Four Pillars',
      'ja': '四柱（しちゅう）',
      'ko': '사주'
    }
  },
  {
    key: 'nian_zhu',
    translations: {
      'zh-CN': '年柱',
      'zh-TW': '年柱',
      'en': 'Year Pillar',
      'ja': '年柱（ねんちゅう）',
      'ko': '년주'
    }
  },
  {
    key: 'yue_zhu',
    translations: {
      'zh-CN': '月柱',
      'zh-TW': '月柱',
      'en': 'Month Pillar',
      'ja': '月柱（げっちゅう）',
      'ko': '월주'
    }
  },
  {
    key: 'ri_zhu',
    translations: {
      'zh-CN': '日柱',
      'zh-TW': '日柱',
      'en': 'Day Pillar',
      'ja': '日柱（にっちゅう）',
      'ko': '일주'
    }
  },
  {
    key: 'shi_zhu',
    translations: {
      'zh-CN': '时柱',
      'zh-TW': '時柱',
      'en': 'Hour Pillar',
      'ja': '時柱（じちゅう）',
      'ko': '시주'
    }
  },
  {
    key: 'ming_pan',
    translations: {
      'zh-CN': '命盘',
      'zh-TW': '命盤',
      'en': 'Birth Chart',
      'ja': '命盤（めいばん）',
      'ko': '명반'
    }
  },
  {
    key: 'shi_shen_zheng',
    translations: {
      'zh-CN': '十神',
      'zh-TW': '十神',
      'en': 'Ten Gods',
      'ja': '十神（じっしん）',
      'ko': '십신'
    }
  },
  {
    key: 'cang_gan',
    translations: {
      'zh-CN': '藏干',
      'zh-TW': '藏干',
      'en': 'Hidden Stems',
      'ja': '蔵干（ぞうかん）',
      'ko': '장간'
    }
  },
  {
    key: 'he_hua',
    translations: {
      'zh-CN': '合化',
      'zh-TW': '合化',
      'en': 'Combination and Transformation',
      'ja': '合化（ごうか）',
      'ko': '합화'
    }
  },
  {
    key: 'chong',
    translations: {
      'zh-CN': '冲',
      'zh-TW': '沖',
      'en': 'Clash',
      'ja': '沖（ちゅう）',
      'ko': '충'
    }
  },
  {
    key: 'xing',
    translations: {
      'zh-CN': '刑',
      'zh-TW': '刑',
      'en': 'Punishment',
      'ja': '刑（けい）',
      'ko': '형'
    }
  },
  {
    key: 'hai',
    translations: {
      'zh-CN': '害',
      'zh-TW': '害',
      'en': 'Harm',
      'ja': '害（がい）',
      'ko': '해'
    }
  },
  {
    key: 'po_yue',
    translations: {
      'zh-CN': '破月',
      'zh-TW': '破月',
      'en': 'Destruction',
      'ja': '破（は）',
      'ko': '파'
    }
  },
  {
    key: 'ming_gong',
    translations: {
      'zh-CN': '命宫',
      'zh-TW': '命宮',
      'en': 'Life Palace',
      'ja': '命宮（めいきゅう）',
      'ko': '명궁'
    }
  },
  {
    key: 'shen_sha',
    translations: {
      'zh-CN': '神煞',
      'zh-TW': '神煞',
      'en': 'Spiritual Stars (Shen Sha)',
      'ja': '神煞（しんさつ）',
      'ko': '신살'
    }
  },
  {
    key: 'tai_yin',
    translations: {
      'zh-CN': '太阴',
      'zh-TW': '太陰',
      'en': 'Tai Yin (Moon)',
      'ja': '太陰（たいいん）',
      'ko': '태음'
    }
  },
  {
    key: 'tai_yang',
    translations: {
      'zh-CN': '太阳',
      'zh-TW': '太陽',
      'en': 'Tai Yang (Sun)',
      'ja': '太陽（たいよう）',
      'ko': '태양'
    }
  },
  {
    key: 'tian_kui',
    translations: {
      'zh-CN': '天魁',
      'zh-TW': '天魁',
      'en': 'Tian Kui (Heavenly Leader)',
      'ja': '天魁（てんかい）',
      'ko': '천귀'
    }
  },
  {
    key: 'tian_yue',
    translations: {
      'zh-CN': '天钺',
      'zh-TW': '天鉞',
      'en': 'Tian Yue (Heavenly Axe)',
      'ja': '天鉞（てんえつ）',
      'ko': '천월'
    }
  },
  {
    key: 'lu_shen',
    translations: {
      'zh-CN': '禄神',
      'zh-TW': '祿神',
      'en': 'Lu Shen (Prosperity God)',
      'ja': '禄神（ろくしん）',
      'ko': '녹신'
    }
  },
  {
    key: 'jiang_xing',
    translations: {
      'zh-CN': '将星',
      'zh-TW': '將星',
      'en': 'General Star',
      'ja': '将星（しょうせい）',
      'ko': '장성'
    }
  },
  {
    key: 'jiao_xing',
    translations: {
      'zh-CN': '绞煞',
      'zh-TW': '絞煞',
      'en': 'Strangling Sha',
      'ja': '絞煞（こうさつ）',
      'ko': '교살'
    }
  },
  {
    key: 'wang_shen',
    translations: {
      'zh-CN': '亡神',
      'zh-TW': '亡神',
      'en': 'Death Spirit',
      'ja': '亡神（ぼうしん）',
      'ko': '망신'
    }
  }
]

// ═══════════════════════════════════════════════════════════
// I18nEngine 主类
// ═══════════════════════════════════════════════════════════

export class I18nEngine {
  /** 翻译词条映射表（key -> entry） */
  private _entries: Map<string, I18nEntry>

  /** 当前语言区域 */
  private _locale: SupportedLocale

  /** 古籍引用 */
  private _classicalRef: string

  constructor() {
    this._entries = new Map<string, I18nEntry>()
    this._locale = 'zh-CN'
    this._classicalRef = '《礼记·中庸》引《易经》："今天下车同轨，书同文，行同伦。"'

    // 加载内置术语
    this._loadBuiltInTerms()
  }

  /** 加载内置命理术语 */
  private _loadBuiltInTerms(): void {
    // 加载十天干
    for (var i = 0; i < TEN_STEMS.length; i++) {
      this._entries.set(TEN_STEMS[i].key, TEN_STEMS[i])
    }
    // 加载十二地支
    for (var j = 0; j < TWELVE_BRANCHES.length; j++) {
      this._entries.set(TWELVE_BRANCHES[j].key, TWELVE_BRANCHES[j])
    }
    // 加载核心术语
    for (var k = 0; k < CORE_TERMS.length; k++) {
      this._entries.set(CORE_TERMS[k].key, CORE_TERMS[k])
    }
  }

  // ─── 翻译 ──────────────────────────────────────────

  /** 翻译指定 key 到当前语言区域 */
  t(key: string, locale?: SupportedLocale): string {
    var targetLocale = locale || this._locale
    var entry = this._entries.get(key)
    if (!entry) {
      // 未找到词条时返回 key 本身作为 fallback
      return '[i18n:' + key + ']'
    }
    return entry.translations[targetLocale] || entry.translations['zh-CN'] || key
  }

  /** 翻译到所有支持的语言 */
  tAll(key: string): Record<SupportedLocale, string> {
    var entry = this._entries.get(key)
    if (!entry) {
      var fallback: Record<SupportedLocale, string> = {
        'zh-CN': '[i18n:' + key + ']',
        'zh-TW': '[i18n:' + key + ']',
        'en': '[i18n:' + key + ']',
        'ja': '[i18n:' + key + ']',
        'ko': '[i18n:' + key + ']'
      }
      return fallback
    }
    // 返回拷贝防止外部修改
    var result: Record<SupportedLocale, string> = {
      'zh-CN': entry.translations['zh-CN'],
      'zh-TW': entry.translations['zh-TW'],
      'en': entry.translations['en'],
      'ja': entry.translations['ja'],
      'ko': entry.translations['ko']
    }
    return result
  }

  // ─── 词条管理 ──────────────────────────────────────

  /** 添加单条词条 */
  addEntry(entry: I18nEntry): void {
    if (!entry.key || entry.key.trim().length === 0) {
      throw new Error('词条 key 不能为空')
    }
    // 验证翻译完整性
    var locales: SupportedLocale[] = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko']
    for (var i = 0; i < locales.length; i++) {
      if (!entry.translations[locales[i]]) {
        throw new Error('词条 "' + entry.key + '" 缺少 ' + locales[i] + ' 翻译')
      }
    }
    // 深拷贝存储
    this._entries.set(entry.key, structuredClone(entry))
  }

  /** 批量添加词条 */
  addEntries(entries: I18nEntry[]): void {
    for (var i = 0; i < entries.length; i++) {
      this.addEntry(entries[i])
    }
  }

  /** 删除词条 */
  removeEntry(key: string): boolean {
    return this._entries.delete(key)
  }

  /** 获取单条词条 */
  getEntry(key: string): I18nEntry | null {
    var entry = this._entries.get(key)
    if (!entry) {
      return null
    }
    // 返回深拷贝
    return structuredClone(entry)
  }

  /** 获取所有词条 */
  getAllEntries(): I18nEntry[] {
    var result: I18nEntry[] = []
    this._entries.forEach(function (entry) {
      result.push(structuredClone(entry))
    })
    return result
  }

  /** 获取所有 key */
  getAllKeys(): string[] {
    var keys: string[] = []
    this._entries.forEach(function (_value, key) {
      keys.push(key)
    })
    return keys
  }

  /** 检查是否存在某词条 */
  hasEntry(key: string): boolean {
    return this._entries.has(key)
  }

  /** 获取词条总数 */
  getEntryCount(): number {
    return this._entries.size
  }

  // ─── 语言管理 ──────────────────────────────────────

  /** 获取所有支持的语言区域 */
  getSupportedLocales(): SupportedLocale[] {
    // 返回拷贝
    return ALL_LOCALES.slice()
  }

  /** 设置当前语言区域 */
  setLocale(locale: SupportedLocale): void {
    // 验证是否为支持的语言
    var found = false
    for (var i = 0; i < ALL_LOCALES.length; i++) {
      if (ALL_LOCALES[i] === locale) {
        found = true
        break
      }
    }
    if (!found) {
      throw new Error('不支持的语言区域: ' + locale + '，支持的语言: ' + ALL_LOCALES.join(', '))
    }
    this._locale = locale
  }

  /** 获取当前语言区域 */
  getLocale(): SupportedLocale {
    return this._locale
  }

  /** 检查是否支持某语言区域 */
  isLocaleSupported(locale: string): boolean {
    for (var i = 0; i < ALL_LOCALES.length; i++) {
      if (ALL_LOCALES[i] === locale) {
        return true
      }
    }
    return false
  }

  // ─── 覆盖率分析 ──────────────────────────────────────

  /** 计算某语言区域的翻译覆盖率 */
  private _getCoverageForLocale(locale: SupportedLocale): number {
    var total = this._entries.size
    if (total === 0) {
      return 0
    }
    var translated = 0
    this._entries.forEach(function (entry) {
      var value = entry.translations[locale]
      if (value && value.length > 0) {
        translated++
      }
    })
    return round1(safeDiv(translated * 100, total))
  }

  /** 获取所有语言的覆盖率 */
  getCoverage(): Record<SupportedLocale, number> {
    var coverage: Record<SupportedLocale, number> = {
      'zh-CN': this._getCoverageForLocale('zh-CN'),
      'zh-TW': this._getCoverageForLocale('zh-TW'),
      'en': this._getCoverageForLocale('en'),
      'ja': this._getCoverageForLocale('ja'),
      'ko': this._getCoverageForLocale('ko')
    }
    return coverage
  }

  /** 查找某语言中缺失翻译的词条 */
  getMissingKeys(locale: SupportedLocale): string[] {
    var missing: string[] = []
    this._entries.forEach(function (entry, key) {
      var value = entry.translations[locale]
      if (!value || value.length === 0) {
        missing.push(key)
      }
    })
    return missing
  }

  // ─── 报告生成 ──────────────────────────────────────

  /** 获取完整国际化报告 */
  getReport(): I18nResult {
    var coverage = this.getCoverage()

    // 构建报告文本
    var lines: string[] = []
    lines.push('═══════════════════════════════════════════════')
    lines.push('  国际化（i18n）报告')
    lines.push('═══════════════════════════════════════════════')
    lines.push('')
    lines.push('【古籍依据】' + this._classicalRef)
    lines.push('')
    lines.push('报告生成时间：' + formatDateTime(new Date()))
    lines.push('')

    // 当前设置
    lines.push('── 当前设置 ──────────────────────────')
    lines.push('  当前语言：' + this._locale + '（' + LOCALE_LABEL[this._locale] + '）')
    lines.push('  支持语言：' + ALL_LOCALES.length + ' 种')
    for (var i = 0; i < ALL_LOCALES.length; i++) {
      var loc = ALL_LOCALES[i]
      lines.push('    ' + loc + ' — ' + LOCALE_LABEL[loc])
    }
    lines.push('')

    // 词条统计
    lines.push('── 词条统计 ──────────────────────────')
    lines.push('  总词条数：' + this._entries.size)
    lines.push('  十天干：' + TEN_STEMS.length + ' 条')
    lines.push('  十二地支：' + TWELVE_BRANCHES.length + ' 条')
    lines.push('  核心术语：' + CORE_TERMS.length + ' 条')
    lines.push('')

    // 覆盖率
    lines.push('── 翻译覆盖率 ────────────────────────')
    for (var j = 0; j < ALL_LOCALES.length; j++) {
      var locale = ALL_LOCALES[j]
      var cov = coverage[locale]
      var missingKeys = this.getMissingKeys(locale)
      var status = cov >= 100 ? '完整' : '缺失 ' + missingKeys.length + ' 条'
      lines.push('  ' + locale + '（' + LOCALE_LABEL[locale] + '）：' + cov + '% — ' + status)
    }
    lines.push('')

    // 示例翻译
    lines.push('── 示例翻译（前 10 条）─────────────────')
    var allKeys = this.getAllKeys()
    var displayCount = Math.min(10, allKeys.length)
    for (var k = 0; k < displayCount; k++) {
      var key = allKeys[k]
      var entry = this.getEntry(key)
      if (entry) {
        lines.push('  [' + key + ']')
        for (var m = 0; m < ALL_LOCALES.length; m++) {
          var loc2 = ALL_LOCALES[m]
          lines.push('    ' + loc2 + ': ' + entry.translations[loc2])
        }
      }
    }
    lines.push('')

    // 架构说明
    lines.push('── 架构说明 ──────────────────────────')
    lines.push('  Core 完全无语言绑定，所有语言映射在 Plugin 层完成。')
    lines.push('  引擎内部使用英文 key，翻译通过 t() 方法获取。')
    lines.push('  支持运行时动态添加/修改翻译词条。')
    lines.push('')
    lines.push('═══════════════════════════════════════════════')

    return {
      generatedAt: formatDateTime(new Date()),
      locale: this._locale,
      supportedLocales: this.getSupportedLocales(),
      totalEntries: this._entries.size,
      coverage: coverage,
      report: lines.join('\n'),
      classicalRef: this._classicalRef
    }
  }

  /** 获取简短摘要 */
  getSummary(): string {
    var coverage = this.getCoverage()
    return '当前语言: ' + this._locale + ' | '
      + '词条: ' + this._entries.size + ' | '
      + '覆盖率: zh-CN ' + coverage['zh-CN'] + '%, en ' + coverage['en'] + '%, ja ' + coverage['ja'] + '%, ko ' + coverage['ko'] + '%'
  }

  // ─── 高级功能 ──────────────────────────────────────

  /** 导出为 JSON 字符串 */
  exportJSON(): string {
    var entries = this.getAllEntries()
    return JSON.stringify({
      locale: this._locale,
      totalEntries: entries.length,
      entries: entries,
      exportedAt: formatDateTime(new Date())
    }, null, 2)
  }

  /** 从 JSON 字符串导入词条（合并模式，不覆盖已有） */
  importJSON(json: string, overwrite?: boolean): void {
    var data = JSON.parse(json)
    if (!data.entries || !Array.isArray(data.entries)) {
      throw new Error('无效的 JSON 格式，缺少 entries 数组')
    }
    for (var i = 0; i < data.entries.length; i++) {
      var entry = data.entries[i]
      if (!overwrite && this._entries.has(entry.key)) {
        continue // 不覆盖已有词条
      }
      this.addEntry(entry)
    }
  }

  /** 批量翻译（将一组 key 翻译到当前语言） */
  batchTranslate(keys: string[], locale?: SupportedLocale): Record<string, string> {
    var targetLocale = locale || this._locale
    var result: Record<string, string> = {}
    for (var i = 0; i < keys.length; i++) {
      result[keys[i]] = this.t(keys[i], targetLocale)
    }
    return result
  }

  /** 获取某语言区域的所有翻译（键值对形式） */
  getTranslationsForLocale(locale: SupportedLocale): Record<string, string> {
    var result: Record<string, string> = {}
    this._entries.forEach(function (entry, key) {
      result[key] = entry.translations[locale] || ''
    })
    return result
  }
}

// ═══════════════════════════════════════════════════════════
// 导出便捷实例
// ═══════════════════════════════════════════════════════════

/** 全局默认实例 */
export var i18nEngine = new I18nEngine()
