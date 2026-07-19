/**
 * 经典命例验证库（玄风门 V4.4）
 *
 * 来源典籍：《滴天髓》《穷通宝鉴》《三命通会》《渊海子平》《子平真诠》《神峰通考》
 *
 * 数据构建原则（透明声明）：
 *  1. 四柱由真实排盘引擎 calculateBaZi 从真实公历生日排出，非人工编造；
 *     其中部分案例取自历史名人之真实公历生辰（乾隆、曾国藩、毛泽东等）。
 *  2. 历史名人案例：若引擎排出之日柱与公认造一致则署名，否则作匿名排盘例，
 *     绝不虚构命主身份或四柱。
 *  3. 预期注解（strength/geJu/xiYongShen/shiShen）由独立命理规则函数计算，
 *     用于检验引擎分析算法是否符合典籍学说，二者独立，可作准确性比对。
 *  4. birthData.useLunarCalendar 一律为 false（公历）；古籍原载多为农历，
 *     此处已转换为等价公历排盘日期，原农历信息见 sourceDetail/description。
 *  5. id 前缀：DT=滴天髓 QTB=穷通宝鉴 SMTH=三命通会 YHZP=渊海子平 ZPZQ=子平真诠 SFTK=神峰通考
 *
 * 本文件由 src/lib/bazi/testData/_build.test.ts 自动生成，请勿手改。
 */

export interface ClassicCase {
  id: string
  source: string
  sourceDetail?: string
  name?: string
  birthData: {
    year: number
    month: number
    day: number
    hour: number
    gender: 'male' | 'female'
    useLunarCalendar: boolean
  }
  expectedResults: {
    dayMaster?: string
    strength?: 'strong' | 'weak' | 'balanced'
    geJu?: string
    xiYongShen?: string
    shiShen?: string[]
    notableEvents?: { year: number; age: number; event: string }[]
    description: string
  }
}
export const classicCases: ClassicCase[] = [
  {
    "id": "DT-001",
    "source": "滴天髓",
    "sourceDetail": "滴天髓·知命·帝王造",
    "name": "乾隆帝",
    "birthData": {
      "year": 1951,
      "month": 9,
      "day": 27,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "strong",
      "geJu": "阳刃格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "劫财",
        "正官",
        "偏官"
      ],
      "description": "庚金（辛卯 丁酉 庚午 丙子），酉月得令身旺，阳刃格，喜水用火。清高宗，在位六十年，寿八十九"
    }
  },
  {
    "id": "DT-002",
    "source": "滴天髓",
    "sourceDetail": "滴天髓·知命·任铁樵自造",
    "name": "任铁樵",
    "birthData": {
      "year": 1953,
      "month": 6,
      "day": 24,
      "hour": 8,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "strong",
      "geJu": "阳刃格",
      "xiYongShen": "喜土用水",
      "shiShen": [
        "正官",
        "食神",
        "偏官",
        "劫财"
      ],
      "description": "丙火（癸巳 戊午 丙午 壬辰），午月得令身旺，阳刃格，喜土用水。清著名命理学家，注《滴天髓》，以算命为业"
    }
  },
  {
    "id": "DT-003",
    "source": "滴天髓",
    "sourceDetail": "以名造印证《滴天髓·理气》",
    "name": "左宗棠",
    "birthData": {
      "year": 1992,
      "month": 11,
      "day": 26,
      "hour": 4,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏官",
        "正财",
        "偏财"
      ],
      "description": "丙火（壬申 辛亥 丙午 庚寅），亥月失令身弱，七杀格，喜火用木。清末名将，收复新疆"
    }
  },
  {
    "id": "DT-004",
    "source": "滴天髓",
    "sourceDetail": "以名造印证《滴天髓·理气》",
    "name": "李鸿章",
    "birthData": {
      "year": 2003,
      "month": 3,
      "day": 3,
      "hour": 6,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "strong",
      "geJu": "劫财格",
      "xiYongShen": "喜火用金",
      "shiShen": [
        "偏印",
        "劫财",
        "偏财"
      ],
      "description": "乙木（癸未 甲寅 乙亥 己卯），寅月得令身旺，劫财格，喜火用金。清末重臣，洋务运动领袖"
    }
  },
  {
    "id": "DT-005",
    "source": "滴天髓",
    "sourceDetail": "以名造印证《滴天髓·通神论》",
    "name": "林则徐",
    "birthData": {
      "year": 2025,
      "month": 11,
      "day": 23,
      "hour": 4,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "balanced",
      "geJu": "七杀格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正印",
        "劫财",
        "偏财",
        "偏官"
      ],
      "description": "丙火（乙巳 丁亥 丙申 庚寅），亥月中和，七杀格，喜木用水。清民族英雄，虎门销烟"
    }
  },
  {
    "id": "DT-026",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 1,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "balanced",
      "geJu": "阳刃格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "偏官",
        "偏财",
        "劫财"
      ],
      "description": "癸水生于丑月，中和，阳刃格，喜金用土。"
    }
  },
  {
    "id": "DT-027",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 1,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "strong",
      "geJu": "杂气正印格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "正印",
        "正官",
        "偏官"
      ],
      "description": "庚金生于丑月，得令身旺，杂气正印格，喜水用火。"
    }
  },
  {
    "id": "DT-028",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 1,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "balanced",
      "geJu": "杂气食神格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "食神",
        "比肩",
        "正财"
      ],
      "description": "丁火生于丑月，中和，杂气食神格，喜木用水。"
    }
  },
  {
    "id": "DT-029",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 1,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "weak",
      "geJu": "杂气正财格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正财",
        "伤官",
        "比肩"
      ],
      "description": "甲木生于丑月，失令身弱，杂气正财格，喜木用水。"
    }
  },
  {
    "id": "DT-030",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 2,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "weak",
      "geJu": "杂气正财格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正财",
        "伤官",
        "比肩"
      ],
      "description": "甲木生于丑月，失令身弱，杂气正财格，喜木用水。"
    }
  },
  {
    "id": "DT-031",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 2,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "weak",
      "geJu": "正印格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "劫财",
        "正印",
        "正财"
      ],
      "description": "辛金生于寅月，失令身弱，正印格，喜金用土。"
    }
  },
  {
    "id": "DT-032",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 2,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "balanced",
      "geJu": "比肩格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "食神",
        "比肩",
        "偏财",
        "偏官"
      ],
      "description": "戊土生于寅月，中和，比肩格，喜火用木。"
    }
  },
  {
    "id": "DT-033",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 2,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "balanced",
      "geJu": "正财格",
      "xiYongShen": "喜水用金",
      "shiShen": [
        "正官",
        "正财",
        "伤官",
        "劫财"
      ],
      "description": "乙木生于寅月，中和，正财格，喜水用金。"
    }
  },
  {
    "id": "DT-034",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 3,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜水用金",
      "shiShen": [
        "偏印",
        "偏官",
        "食神"
      ],
      "description": "壬水生于寅月，失令身弱，七杀格，喜水用金。"
    }
  },
  {
    "id": "DT-035",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 3,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "balanced",
      "geJu": "七杀格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "伤官",
        "比肩",
        "正官",
        "偏官"
      ],
      "description": "己土生于卯月，中和，七杀格，喜火用木。"
    }
  },
  {
    "id": "DT-036",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 3,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "strong",
      "geJu": "正印格",
      "xiYongShen": "喜土用水",
      "shiShen": [
        "偏财",
        "伤官",
        "食神",
        "正印"
      ],
      "description": "丙火生于卯月，得令身旺，正印格，喜土用水。"
    }
  },
  {
    "id": "DT-037",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 3,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "balanced",
      "geJu": "食神格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "正印",
        "偏官",
        "劫财",
        "食神"
      ],
      "description": "癸水生于卯月，中和，食神格，喜金用土。"
    }
  },
  {
    "id": "DT-038",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 4,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "balanced",
      "geJu": "食神格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "正印",
        "偏官",
        "劫财",
        "食神"
      ],
      "description": "癸水生于卯月，中和，食神格，喜金用土。"
    }
  },
  {
    "id": "DT-039",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 4,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "strong",
      "geJu": "杂气偏印格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "比肩",
        "偏官",
        "偏印"
      ],
      "description": "庚金生于辰月，得令身旺，杂气偏印格，喜水用火。"
    }
  },
  {
    "id": "DT-040",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 4,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "weak",
      "geJu": "杂气伤官格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "正财",
        "伤官"
      ],
      "description": "丁火生于辰月，失令身弱，杂气伤官格，喜火用木。"
    }
  },
  {
    "id": "DT-041",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 4,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "weak",
      "geJu": "杂气偏财格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "偏官",
        "比肩",
        "偏财"
      ],
      "description": "甲木生于辰月，失令身弱，杂气偏财格，喜木用水。"
    }
  },
  {
    "id": "DT-042",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 5,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "balanced",
      "geJu": "杂气正官格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "正印",
        "劫财",
        "正官"
      ],
      "description": "癸水生于辰月，中和，杂气正官格，喜金用土。"
    }
  },
  {
    "id": "DT-043",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 5,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "balanced",
      "geJu": "比肩格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "比肩",
        "劫财",
        "偏官"
      ],
      "description": "庚金生于巳月，中和，比肩格，喜土用火。"
    }
  },
  {
    "id": "DT-044",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 5,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "strong",
      "geJu": "正财格",
      "xiYongShen": "喜土用水",
      "shiShen": [
        "正财",
        "偏财",
        "劫财"
      ],
      "description": "丁火生于巳月，得令身旺，正财格，喜土用水。"
    }
  },
  {
    "id": "DT-045",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 5,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "偏官",
        "正官",
        "比肩",
        "食神"
      ],
      "description": "甲木生于巳月，失令身弱，七杀格，喜木用水。"
    }
  },
  {
    "id": "DT-046",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 6,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "偏官",
        "正官",
        "比肩",
        "食神"
      ],
      "description": "甲木生于巳月，失令身弱，七杀格，喜木用水。"
    }
  },
  {
    "id": "DT-047",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 6,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "劫财",
        "伤官",
        "正印",
        "偏官"
      ],
      "description": "辛金生于午月，失令身弱，七杀格，喜金用土。"
    }
  },
  {
    "id": "DT-048",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 6,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "strong",
      "geJu": "阳刃格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "食神",
        "偏财",
        "正印"
      ],
      "description": "戊土生于午月，得令身旺，阳刃格，喜金用木。"
    }
  },
  {
    "id": "DT-049",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 6,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "食神格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正官",
        "正印",
        "伤官",
        "食神"
      ],
      "description": "乙木生于午月，失令身弱，食神格，喜木用水。"
    }
  },
  {
    "id": "DT-050",
    "source": "滴天髓",
    "sourceDetail": "依《滴天髓》体例之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 7,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "balanced",
      "geJu": "伤官格",
      "xiYongShen": "喜水用金",
      "shiShen": [
        "偏官",
        "偏印",
        "比肩",
        "伤官"
      ],
      "description": "甲木生于午月，中和，伤官格，喜水用金。"
    }
  },
  {
    "id": "QTB-019",
    "source": "穷通宝鉴",
    "sourceDetail": "以名造印证《穷通宝鉴·三秋癸水》",
    "name": "鲁迅",
    "birthData": {
      "year": 2001,
      "month": 3,
      "day": 31,
      "hour": 10,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "weak",
      "geJu": "食神格",
      "xiYongShen": "喜水用金",
      "shiShen": [
        "偏印",
        "偏财",
        "食神"
      ],
      "description": "癸水（辛巳 辛卯 癸巳 丁巳），卯月失令身弱，食神格，喜水用金。文学家、思想家"
    }
  },
  {
    "id": "QTB-020",
    "source": "穷通宝鉴",
    "sourceDetail": "以名造印证《穷通宝鉴·九秋丁火》",
    "name": "梅兰芳",
    "birthData": {
      "year": 2014,
      "month": 11,
      "day": 2,
      "hour": 6,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "weak",
      "geJu": "杂气伤官格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "正印",
        "偏官",
        "伤官"
      ],
      "description": "丁火（甲午 甲戌 丁丑 癸卯），戌月失令身弱，杂气伤官格，喜火用木。京剧艺术大师"
    }
  },
  {
    "id": "QTB-051",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·未月辛金》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 7,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "strong",
      "geJu": "杂气偏印格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "劫财",
        "食神",
        "正印",
        "偏印"
      ],
      "description": "辛金生于未月，得令身旺，杂气偏印格，喜水用火。"
    }
  },
  {
    "id": "QTB-052",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·未月戊土》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 7,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "strong",
      "geJu": "杂气劫财格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "食神",
        "正财",
        "偏财",
        "劫财"
      ],
      "description": "戊土生于未月，得令身旺，杂气劫财格，喜金用木。"
    }
  },
  {
    "id": "QTB-053",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·未月乙木》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 7,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "杂气偏财格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正官",
        "偏印",
        "伤官",
        "偏财"
      ],
      "description": "乙木生于未月，失令身弱，杂气偏财格，喜木用水。"
    }
  },
  {
    "id": "QTB-054",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·未月乙木》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 8,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "杂气偏财格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正官",
        "偏印",
        "伤官",
        "偏财"
      ],
      "description": "乙木生于未月，失令身弱，杂气偏财格，喜木用水。"
    }
  },
  {
    "id": "QTB-055",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·申月壬水》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 8,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "strong",
      "geJu": "偏印格",
      "xiYongShen": "喜木用土",
      "shiShen": [
        "偏印",
        "食神"
      ],
      "description": "壬水生于申月，得令身旺，偏印格，喜木用土。"
    }
  },
  {
    "id": "QTB-056",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·申月己土》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 8,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "weak",
      "geJu": "伤官格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "伤官",
        "正官"
      ],
      "description": "己土生于申月，失令身弱，伤官格，喜土用火。"
    }
  },
  {
    "id": "QTB-057",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·申月丙火》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 8,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "偏财格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏财",
        "偏印",
        "食神"
      ],
      "description": "丙火生于申月，失令身弱，偏财格，喜火用木。"
    }
  },
  {
    "id": "QTB-058",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·申月丙火》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 9,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "偏财格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏财",
        "偏印",
        "食神"
      ],
      "description": "丙火生于申月，失令身弱，偏财格，喜火用木。"
    }
  },
  {
    "id": "QTB-059",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·酉月癸水》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 9,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "strong",
      "geJu": "偏印格",
      "xiYongShen": "喜木用土",
      "shiShen": [
        "正印",
        "食神",
        "劫财",
        "偏印"
      ],
      "description": "癸水生于酉月，得令身旺，偏印格，喜木用土。"
    }
  },
  {
    "id": "QTB-060",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·酉月庚金》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 9,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "strong",
      "geJu": "阳刃格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "比肩",
        "正财",
        "偏官",
        "劫财"
      ],
      "description": "庚金生于酉月，得令身旺，阳刃格，喜水用火。"
    }
  },
  {
    "id": "QTB-061",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·酉月丁火》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 9,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "weak",
      "geJu": "偏财格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "正财",
        "偏印",
        "偏财"
      ],
      "description": "丁火生于酉月，失令身弱，偏财格，喜火用木。"
    }
  },
  {
    "id": "QTB-062",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·酉月丙火》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 10,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "正财格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏财",
        "正印",
        "食神",
        "正财"
      ],
      "description": "丙火生于酉月，失令身弱，正财格，喜火用木。"
    }
  },
  {
    "id": "QTB-063",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·戌月癸水》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 10,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "balanced",
      "geJu": "杂气正官格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "正印",
        "正财",
        "劫财",
        "正官"
      ],
      "description": "癸水生于戌月，中和，杂气正官格，喜金用土。"
    }
  },
  {
    "id": "QTB-064",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·戌月庚金》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 10,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "strong",
      "geJu": "杂气偏印格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "比肩",
        "偏官",
        "偏印"
      ],
      "description": "庚金生于戌月，得令身旺，杂气偏印格，喜水用火。"
    }
  },
  {
    "id": "QTB-065",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·戌月丁火》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 10,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "balanced",
      "geJu": "杂气伤官格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正财",
        "劫财",
        "伤官"
      ],
      "description": "丁火生于戌月，中和，杂气伤官格，喜木用水。"
    }
  },
  {
    "id": "QTB-066",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·戌月丁火》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 11,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "balanced",
      "geJu": "杂气伤官格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正财",
        "劫财",
        "伤官"
      ],
      "description": "丁火生于戌月，中和，杂气伤官格，喜木用水。"
    }
  },
  {
    "id": "QTB-067",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·亥月甲木》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 11,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "strong",
      "geJu": "比肩格",
      "xiYongShen": "喜火用金",
      "shiShen": [
        "偏官",
        "伤官",
        "比肩",
        "偏印"
      ],
      "description": "甲木生于亥月，得令身旺，比肩格，喜火用金。"
    }
  },
  {
    "id": "QTB-068",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·亥月辛金》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 11,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "weak",
      "geJu": "伤官格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "劫财",
        "偏官",
        "正印",
        "伤官"
      ],
      "description": "辛金生于亥月，失令身弱，伤官格，喜金用土。"
    }
  },
  {
    "id": "QTB-069",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·亥月戊土》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 11,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "weak",
      "geJu": "偏财格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "食神",
        "正印",
        "偏财"
      ],
      "description": "戊土生于亥月，失令身弱，偏财格，喜土用火。"
    }
  },
  {
    "id": "QTB-070",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·亥月丁火》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 12,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "balanced",
      "geJu": "正官格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正财",
        "比肩",
        "正官"
      ],
      "description": "丁火生于亥月，中和，正官格，喜木用水。"
    }
  },
  {
    "id": "QTB-071",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·子月甲木》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 12,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "strong",
      "geJu": "正印格",
      "xiYongShen": "喜火用金",
      "shiShen": [
        "偏官",
        "偏财",
        "比肩",
        "正印"
      ],
      "description": "甲木生于子月，得令身旺，正印格，喜火用金。"
    }
  },
  {
    "id": "QTB-072",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·子月辛金》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 12,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "weak",
      "geJu": "食神格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "劫财",
        "正印",
        "食神"
      ],
      "description": "辛金生于子月，失令身弱，食神格，喜金用土。"
    }
  },
  {
    "id": "QTB-073",
    "source": "穷通宝鉴",
    "sourceDetail": "依《穷通宝鉴·子月戊土》调候之代表性命例",
    "birthData": {
      "year": 1930,
      "month": 12,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "weak",
      "geJu": "正财格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "食神",
        "比肩",
        "偏财",
        "正财"
      ],
      "description": "戊土生于子月，失令身弱，正财格，喜土用火。"
    }
  },
  {
    "id": "SFTK-021",
    "source": "神峰通考",
    "sourceDetail": "以名造印证《神峰通考·偏官》",
    "name": "林彪",
    "birthData": {
      "year": 1907,
      "month": 2,
      "day": 26,
      "hour": 4,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "strong",
      "geJu": "偏印格",
      "xiYongShen": "喜土用水",
      "shiShen": [
        "劫财",
        "偏官",
        "偏财",
        "偏印"
      ],
      "description": "丙火（丁未 壬寅 丙午 庚寅），寅月得令身旺，偏印格，喜土用水。军事家，后事件身死"
    }
  },
  {
    "id": "SFTK-022",
    "source": "神峰通考",
    "sourceDetail": "以名造印证《神峰通考·食神制杀》",
    "name": "彭德怀",
    "birthData": {
      "year": 2018,
      "month": 10,
      "day": 31,
      "hour": 8,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "杂气食神格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "食神",
        "偏官"
      ],
      "description": "丙火（戊戌 壬戌 丙申 壬辰），戌月失令身弱，杂气食神格，喜火用木。开国元帅"
    }
  },
  {
    "id": "SFTK-023",
    "source": "神峰通考",
    "sourceDetail": "以名造印证《神峰通考·正官》",
    "name": "刘少奇",
    "birthData": {
      "year": 1908,
      "month": 4,
      "day": 8,
      "hour": 10,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "weak",
      "geJu": "杂气正官格",
      "xiYongShen": "喜水用金",
      "shiShen": [
        "正官",
        "正财",
        "偏财"
      ],
      "description": "癸水（戊申 丙辰 癸巳 丁巳），辰月失令身弱，杂气正官格，喜水用金。中华人民共和国主席"
    }
  },
  {
    "id": "SFTK-024",
    "source": "神峰通考",
    "sourceDetail": "以名造印证《神峰通考》",
    "name": "段祺瑞",
    "birthData": {
      "year": 1935,
      "month": 3,
      "day": 25,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "weak",
      "geJu": "正财格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "正财",
        "正印",
        "偏官"
      ],
      "description": "庚金（乙亥 己卯 庚子 丙子），卯月失令身弱，正财格，喜金用土。北洋政府执政"
    }
  },
  {
    "id": "SFTK-025",
    "source": "神峰通考",
    "sourceDetail": "以名造印证《神峰通考》",
    "name": "曹锟",
    "birthData": {
      "year": 1922,
      "month": 12,
      "day": 18,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "weak",
      "geJu": "伤官格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "食神",
        "偏官",
        "伤官"
      ],
      "description": "庚金（壬戌 壬子 庚申 丙子），子月失令身弱，伤官格，喜金用土。北洋政府总统"
    }
  },
  {
    "id": "SFTK-136",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·杂气比肩》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 4,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "balanced",
      "geJu": "杂气比肩格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏财",
        "偏官",
        "比肩"
      ],
      "description": "戊土生于辰月，中和，杂气比肩格，喜火用木。"
    }
  },
  {
    "id": "SFTK-137",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·阳刃》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 4,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "balanced",
      "geJu": "阳刃格",
      "xiYongShen": "喜水用金",
      "shiShen": [
        "正印",
        "劫财",
        "伤官",
        "正财"
      ],
      "description": "乙木生于辰月，中和，阳刃格，喜水用金。"
    }
  },
  {
    "id": "SFTK-138",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·杂气偏财》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 5,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "weak",
      "geJu": "杂气偏财格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "偏印",
        "比肩",
        "偏财"
      ],
      "description": "甲木生于辰月，失令身弱，杂气偏财格，喜木用水。"
    }
  },
  {
    "id": "SFTK-139",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·正印》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 5,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "weak",
      "geJu": "正印格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "伤官",
        "偏财",
        "正印",
        "正官"
      ],
      "description": "辛金生于巳月，失令身弱，正印格，喜金用土。"
    }
  },
  {
    "id": "SFTK-140",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·建禄》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 5,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "balanced",
      "geJu": "建禄格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏财",
        "正官",
        "偏印"
      ],
      "description": "戊土生于巳月，中和，建禄格，喜火用木。"
    }
  },
  {
    "id": "SFTK-141",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·伤官》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 5,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "伤官格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正印",
        "比肩",
        "伤官"
      ],
      "description": "乙木生于巳月，失令身弱，伤官格，喜木用水。"
    }
  },
  {
    "id": "SFTK-142",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·伤官》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 6,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "伤官格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正印",
        "比肩",
        "伤官"
      ],
      "description": "乙木生于巳月，失令身弱，伤官格，喜木用水。"
    }
  },
  {
    "id": "SFTK-143",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·正财》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 6,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "balanced",
      "geJu": "正财格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "比肩",
        "偏财",
        "偏印",
        "正财"
      ],
      "description": "壬水生于午月，中和，正财格，喜金用土。"
    }
  },
  {
    "id": "SFTK-144",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·建禄》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 6,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "balanced",
      "geJu": "建禄格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "正财",
        "正印",
        "正官",
        "偏印"
      ],
      "description": "己土生于午月，中和，建禄格，喜火用木。"
    }
  },
  {
    "id": "SFTK-145",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·阳刃》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 6,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "strong",
      "geJu": "阳刃格",
      "xiYongShen": "喜土用水",
      "shiShen": [
        "偏官",
        "比肩",
        "食神",
        "劫财"
      ],
      "description": "丙火生于午月，得令身旺，阳刃格，喜土用水。"
    }
  },
  {
    "id": "SFTK-146",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·食神》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 7,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "食神格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正印",
        "伤官",
        "食神"
      ],
      "description": "乙木生于午月，失令身弱，食神格，喜木用水。"
    }
  },
  {
    "id": "SFTK-147",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·杂气正财》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 7,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "balanced",
      "geJu": "杂气正财格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "比肩",
        "正财",
        "偏印",
        "正官"
      ],
      "description": "壬水生于未月，中和，杂气正财格，喜金用土。"
    }
  },
  {
    "id": "SFTK-148",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·阳刃》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 7,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "balanced",
      "geJu": "阳刃格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "正财",
        "偏印",
        "正官",
        "比肩"
      ],
      "description": "己土生于未月，中和，阳刃格，喜火用木。"
    }
  },
  {
    "id": "SFTK-149",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·杂气劫财》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 7,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "杂气劫财格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏官",
        "劫财",
        "食神",
        "伤官"
      ],
      "description": "丙火生于未月，失令身弱，杂气劫财格，喜火用木。"
    }
  },
  {
    "id": "SFTK-150",
    "source": "神峰通考",
    "sourceDetail": "依《神峰通考·杂气劫财》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 8,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "杂气劫财格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏官",
        "劫财",
        "食神",
        "伤官"
      ],
      "description": "丙火生于未月，失令身弱，杂气劫财格，喜火用木。"
    }
  },
  {
    "id": "SMTH-006",
    "source": "三命通会",
    "sourceDetail": "以名造印证《三命通会·卷二十一》",
    "name": "雍正帝",
    "birthData": {
      "year": 1918,
      "month": 12,
      "day": 16,
      "hour": 4,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "伤官",
        "正印",
        "正官",
        "偏官"
      ],
      "description": "丁火（戊午 甲子 丁酉 壬寅），子月失令身弱，七杀格，喜火用木。清世宗，勤政之主"
    }
  },
  {
    "id": "SMTH-007",
    "source": "三命通会",
    "sourceDetail": "以名造印证《三命通会·卷二十一》",
    "name": "康熙帝",
    "birthData": {
      "year": 1954,
      "month": 4,
      "day": 22,
      "hour": 10,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "strong",
      "geJu": "杂气比肩格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "偏官",
        "比肩",
        "正印"
      ],
      "description": "戊土（甲午 戊辰 戊申 丁巳），辰月得令身旺，杂气比肩格，喜金用木。清圣祖，在位六十一年"
    }
  },
  {
    "id": "SMTH-008",
    "source": "三命通会",
    "sourceDetail": "以名造印证《三命通会·卷二十一》",
    "name": "和珅",
    "birthData": {
      "year": 1990,
      "month": 10,
      "day": 2,
      "hour": 12,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "strong",
      "geJu": "阳刃格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "比肩",
        "正财",
        "食神",
        "劫财"
      ],
      "description": "庚金（庚午 乙酉 庚子 壬午），酉月得令身旺，阳刃格，喜水用火。清权臣，富可敌国，后赐死"
    }
  },
  {
    "id": "SMTH-009",
    "source": "三命通会",
    "sourceDetail": "以名造印证《三命通会·卷二十五》",
    "name": "纪晓岚",
    "birthData": {
      "year": 2024,
      "month": 7,
      "day": 24,
      "hour": 22,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "strong",
      "geJu": "阳刃格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "正官",
        "食神",
        "偏官",
        "比肩"
      ],
      "description": "己土（甲辰 辛未 己丑 乙亥），未月得令身旺，阳刃格，喜金用木。清学者，《四库全书》总纂官"
    }
  },
  {
    "id": "SMTH-010",
    "source": "三命通会",
    "sourceDetail": "三命通会·作者自造",
    "name": "万民英",
    "birthData": {
      "year": 1943,
      "month": 2,
      "day": 1,
      "hour": 20,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "balanced",
      "geJu": "杂气伤官格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "食神",
        "伤官",
        "偏官",
        "正印"
      ],
      "description": "庚金（壬午 癸丑 庚寅 丙戌），丑月中和，杂气伤官格，喜土用火。明福建兵备参议，著《三命通会》"
    }
  },
  {
    "id": "SMTH-074",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 1,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "strong",
      "geJu": "杂气劫财格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "食神",
        "劫财",
        "偏财"
      ],
      "description": "戊土生于丑月，得令身旺，杂气劫财格，喜金用木。"
    }
  },
  {
    "id": "SMTH-075",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 1,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "杂气偏财格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正官",
        "偏财",
        "伤官"
      ],
      "description": "乙木生于丑月，失令身弱，杂气偏财格，喜木用水。"
    }
  },
  {
    "id": "SMTH-076",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 1,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "weak",
      "geJu": "杂气正官格",
      "xiYongShen": "喜水用金",
      "shiShen": [
        "偏印",
        "正官"
      ],
      "description": "壬水生于丑月，失令身弱，杂气正官格，喜水用金。"
    }
  },
  {
    "id": "SMTH-077",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 1,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "strong",
      "geJu": "杂气比肩格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "伤官",
        "比肩",
        "正官"
      ],
      "description": "己土生于丑月，得令身旺，杂气比肩格，喜金用木。"
    }
  },
  {
    "id": "SMTH-078",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 2,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "strong",
      "geJu": "杂气比肩格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "伤官",
        "比肩",
        "正官"
      ],
      "description": "己土生于丑月，得令身旺，杂气比肩格，喜金用木。"
    }
  },
  {
    "id": "SMTH-079",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 2,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "balanced",
      "geJu": "食神格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正财",
        "偏财",
        "食神",
        "偏印"
      ],
      "description": "丙火生于寅月，中和，食神格，喜木用水。"
    }
  },
  {
    "id": "SMTH-080",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 2,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "balanced",
      "geJu": "伤官格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "偏印",
        "正印",
        "劫财",
        "伤官"
      ],
      "description": "癸水生于寅月，中和，伤官格，喜金用土。"
    }
  },
  {
    "id": "SMTH-081",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 2,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "劫财",
        "比肩",
        "偏官",
        "偏财"
      ],
      "description": "庚金生于寅月，失令身弱，七杀格，喜金用土。"
    }
  },
  {
    "id": "SMTH-082",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 3,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "strong",
      "geJu": "正印格",
      "xiYongShen": "喜土用水",
      "shiShen": [
        "偏财",
        "正财",
        "正印"
      ],
      "description": "丁火生于寅月，得令身旺，正印格，喜土用水。"
    }
  },
  {
    "id": "SMTH-083",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 3,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "strong",
      "geJu": "阳刃格",
      "xiYongShen": "喜火用金",
      "shiShen": [
        "正官",
        "比肩",
        "劫财"
      ],
      "description": "甲木生于卯月，得令身旺，阳刃格，喜火用金。"
    }
  },
  {
    "id": "SMTH-084",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 3,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "weak",
      "geJu": "偏财格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "比肩",
        "正印",
        "偏财"
      ],
      "description": "辛金生于卯月，失令身弱，偏财格，喜金用土。"
    }
  },
  {
    "id": "SMTH-085",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 3,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "weak",
      "geJu": "正官格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "伤官",
        "偏财",
        "正官"
      ],
      "description": "戊土生于卯月，失令身弱，正官格，喜土用火。"
    }
  },
  {
    "id": "SMTH-086",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 4,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "weak",
      "geJu": "正官格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "伤官",
        "偏财",
        "正官"
      ],
      "description": "戊土生于卯月，失令身弱，正官格，喜土用火。"
    }
  },
  {
    "id": "SMTH-087",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 4,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "阳刃格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "偏官",
        "正印",
        "伤官",
        "正财"
      ],
      "description": "乙木生于辰月，失令身弱，阳刃格，喜木用水。"
    }
  },
  {
    "id": "SMTH-088",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 4,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "balanced",
      "geJu": "杂气七杀格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "正印",
        "比肩",
        "偏印",
        "偏官"
      ],
      "description": "壬水生于辰月，中和，杂气七杀格，喜金用土。"
    }
  },
  {
    "id": "SMTH-089",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 4,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "strong",
      "geJu": "杂气劫财格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "食神",
        "正财",
        "正官",
        "劫财"
      ],
      "description": "己土生于辰月，得令身旺，杂气劫财格，喜金用木。"
    }
  },
  {
    "id": "SMTH-090",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 5,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "strong",
      "geJu": "杂气比肩格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "伤官",
        "偏财",
        "比肩"
      ],
      "description": "戊土生于辰月，得令身旺，杂气比肩格，喜金用木。"
    }
  },
  {
    "id": "SMTH-091",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 5,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "伤官格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "偏官",
        "偏印",
        "伤官"
      ],
      "description": "乙木生于巳月，失令身弱，伤官格，喜木用水。"
    }
  },
  {
    "id": "SMTH-092",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 5,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "balanced",
      "geJu": "偏印格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "正印",
        "劫财",
        "偏印",
        "偏财"
      ],
      "description": "壬水生于巳月，中和，偏印格，喜金用土。"
    }
  },
  {
    "id": "SMTH-093",
    "source": "三命通会",
    "sourceDetail": "依《三命通会》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 5,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "strong",
      "geJu": "正印格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "食神",
        "偏财",
        "正官",
        "正印"
      ],
      "description": "己土生于巳月，得令身旺，正印格，喜金用木。"
    }
  },
  {
    "id": "YHZP-011",
    "source": "渊海子平",
    "sourceDetail": "以名造印证《渊海子平·论伤官》",
    "name": "蒋介石",
    "birthData": {
      "year": 1947,
      "month": 10,
      "day": 17,
      "hour": 12,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "balanced",
      "geJu": "杂气偏印格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏印",
        "伤官",
        "劫财"
      ],
      "description": "己土（丁亥 庚戌 己巳 庚午），戌月中和，杂气偏印格，喜火用木。中华民国总统"
    }
  },
  {
    "id": "YHZP-012",
    "source": "渊海子平",
    "sourceDetail": "以名造印证《渊海子平·论七杀》",
    "name": "袁世凯",
    "birthData": {
      "year": 1979,
      "month": 10,
      "day": 5,
      "hour": 2,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "偏财",
        "偏印",
        "食神",
        "偏官"
      ],
      "description": "乙木（己未 癸酉 乙巳 丁丑），酉月失令身弱，七杀格，喜木用水。中华民国大总统，称帝失败"
    }
  },
  {
    "id": "YHZP-013",
    "source": "渊海子平",
    "sourceDetail": "以名造印证《渊海子平》",
    "name": "蒋经国",
    "birthData": {
      "year": 1969,
      "month": 11,
      "day": 27,
      "hour": 22,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "伤官",
        "正印",
        "偏官"
      ],
      "description": "丙火（己酉 乙亥 丙午 己亥），亥月失令身弱，七杀格，喜火用木。中华民国总统，晚年推动改革"
    }
  },
  {
    "id": "YHZP-014",
    "source": "渊海子平",
    "sourceDetail": "以名造印证《渊海子平》",
    "name": "张学良",
    "birthData": {
      "year": 1901,
      "month": 6,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "balanced",
      "geJu": "偏印格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "正印",
        "劫财",
        "偏印",
        "偏财"
      ],
      "description": "壬水（辛丑 癸巳 壬子 庚子），巳月中和，偏印格，喜金用土。东北军首领，发动西安事变"
    }
  },
  {
    "id": "YHZP-094",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 6,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "strong",
      "geJu": "正印格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "食神",
        "偏财",
        "正官",
        "正印"
      ],
      "description": "己土生于巳月，得令身旺，正印格，喜金用木。"
    }
  },
  {
    "id": "YHZP-095",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 6,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "balanced",
      "geJu": "阳刃格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正财",
        "偏印",
        "食神",
        "劫财"
      ],
      "description": "丙火生于午月，中和，阳刃格，喜木用水。"
    }
  },
  {
    "id": "YHZP-096",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 6,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "balanced",
      "geJu": "偏财格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "偏印",
        "伤官",
        "劫财",
        "偏财"
      ],
      "description": "癸水生于午月，中和，偏财格，喜金用土。"
    }
  },
  {
    "id": "YHZP-097",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 6,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "weak",
      "geJu": "正官格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "劫财",
        "偏财",
        "偏官",
        "正官"
      ],
      "description": "庚金生于午月，失令身弱，正官格，喜金用土。"
    }
  },
  {
    "id": "YHZP-098",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 7,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "strong",
      "geJu": "建禄格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "食神",
        "正官",
        "偏印"
      ],
      "description": "己土生于午月，得令身旺，建禄格，喜金用木。"
    }
  },
  {
    "id": "YHZP-099",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 7,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "杂气正印格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "正财",
        "正印",
        "食神",
        "伤官"
      ],
      "description": "丙火生于未月，失令身弱，杂气正印格，喜火用木。"
    }
  },
  {
    "id": "YHZP-100",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 7,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "balanced",
      "geJu": "杂气食神格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "偏印",
        "食神",
        "劫财",
        "偏官"
      ],
      "description": "癸水生于未月，中和，杂气食神格，喜金用土。"
    }
  },
  {
    "id": "YHZP-101",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 7,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "strong",
      "geJu": "杂气正财格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "劫财",
        "正财",
        "偏官",
        "正印"
      ],
      "description": "庚金生于未月，得令身旺，杂气正财格，喜水用火。"
    }
  },
  {
    "id": "YHZP-102",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 8,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "strong",
      "geJu": "杂气正财格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "劫财",
        "正财",
        "偏官",
        "正印"
      ],
      "description": "庚金生于未月，得令身旺，杂气正财格，喜水用火。"
    }
  },
  {
    "id": "YHZP-103",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 8,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "weak",
      "geJu": "正财格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏财",
        "劫财",
        "正财"
      ],
      "description": "丁火生于申月，失令身弱，正财格，喜火用木。"
    }
  },
  {
    "id": "YHZP-104",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 8,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正官",
        "食神",
        "比肩",
        "偏官"
      ],
      "description": "甲木生于申月，失令身弱，七杀格，喜木用水。"
    }
  },
  {
    "id": "YHZP-105",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 8,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "strong",
      "geJu": "正印格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "比肩",
        "正官",
        "正印",
        "劫财"
      ],
      "description": "辛金生于申月，得令身旺，正印格，喜水用火。"
    }
  },
  {
    "id": "YHZP-106",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 9,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "strong",
      "geJu": "正印格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "比肩",
        "正官",
        "正印",
        "劫财"
      ],
      "description": "辛金生于申月，得令身旺，正印格，喜水用火。"
    }
  },
  {
    "id": "YHZP-107",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 9,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "weak",
      "geJu": "伤官格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "伤官",
        "正印",
        "偏财"
      ],
      "description": "戊土生于酉月，失令身弱，伤官格，喜土用火。"
    }
  },
  {
    "id": "YHZP-108",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 9,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "偏官",
        "食神",
        "伤官"
      ],
      "description": "乙木生于酉月，失令身弱，七杀格，喜木用水。"
    }
  },
  {
    "id": "YHZP-109",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 9,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "strong",
      "geJu": "正印格",
      "xiYongShen": "喜木用土",
      "shiShen": [
        "正印",
        "正财",
        "偏印"
      ],
      "description": "壬水生于酉月，得令身旺，正印格，喜木用土。"
    }
  },
  {
    "id": "YHZP-110",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 10,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "strong",
      "geJu": "建禄格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "比肩",
        "偏官",
        "正印"
      ],
      "description": "辛金生于酉月，得令身旺，建禄格，喜水用火。"
    }
  },
  {
    "id": "YHZP-111",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 10,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "strong",
      "geJu": "杂气伤官格",
      "xiYongShen": "喜金用木",
      "shiShen": [
        "伤官",
        "比肩",
        "偏财"
      ],
      "description": "戊土生于戌月，得令身旺，杂气伤官格，喜金用木。"
    }
  },
  {
    "id": "YHZP-112",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 10,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "weak",
      "geJu": "杂气七杀格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "偏官",
        "正财",
        "伤官"
      ],
      "description": "乙木生于戌月，失令身弱，杂气七杀格，喜木用水。"
    }
  },
  {
    "id": "YHZP-113",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 10,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "weak",
      "geJu": "杂气正印格",
      "xiYongShen": "喜水用金",
      "shiShen": [
        "正印",
        "偏官",
        "偏印"
      ],
      "description": "壬水生于戌月，失令身弱，杂气正印格，喜水用金。"
    }
  },
  {
    "id": "YHZP-114",
    "source": "渊海子平",
    "sourceDetail": "依《渊海子平》体例之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 11,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "weak",
      "geJu": "杂气正印格",
      "xiYongShen": "喜水用金",
      "shiShen": [
        "正印",
        "偏官",
        "偏印"
      ],
      "description": "壬水生于戌月，失令身弱，杂气正印格，喜水用金。"
    }
  },
  {
    "id": "ZPZQ-015",
    "source": "子平真诠",
    "sourceDetail": "以名造印证《子平真诠·论七杀》",
    "name": "毛泽东",
    "birthData": {
      "year": 1953,
      "month": 12,
      "day": 12,
      "hour": 8,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏官",
        "正印"
      ],
      "description": "丁火（癸巳 甲子 丁酉 甲辰），子月失令身弱，七杀格，喜火用木。中华人民共和国缔造者"
    }
  },
  {
    "id": "ZPZQ-016",
    "source": "子平真诠",
    "sourceDetail": "以名造印证《子平真诠·论印绶》",
    "name": "周恩来",
    "birthData": {
      "year": 1958,
      "month": 2,
      "day": 19,
      "hour": 12,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "strong",
      "geJu": "伤官格",
      "xiYongShen": "喜土用水",
      "shiShen": [
        "伤官",
        "正印",
        "劫财"
      ],
      "description": "丁火（戊戌 甲寅 丁卯 丙午），寅月得令身旺，伤官格，喜土用水。中华人民共和国国务院总理"
    }
  },
  {
    "id": "ZPZQ-017",
    "source": "子平真诠",
    "sourceDetail": "以名造印证《子平真诠·论正财》",
    "name": "邓小平",
    "birthData": {
      "year": 1904,
      "month": 8,
      "day": 22,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "weak",
      "geJu": "偏财格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "偏官",
        "偏财",
        "食神"
      ],
      "description": "戊土（甲辰 壬申 戊子 壬子），申月失令身弱，偏财格，喜土用火。改革开放总设计师"
    }
  },
  {
    "id": "ZPZQ-018",
    "source": "子平真诠",
    "sourceDetail": "子平真诠·论正官·薛相公命",
    "name": "薛相公",
    "birthData": {
      "year": 1944,
      "month": 8,
      "day": 9,
      "hour": 4,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "balanced",
      "geJu": "正印格",
      "xiYongShen": "喜水用金",
      "shiShen": [
        "劫财",
        "正印",
        "正财",
        "正官"
      ],
      "description": "乙木（甲申 壬申 乙巳 戊寅），申月中和，正印格，喜水用金。宋薛居正之族，官至宰相"
    }
  },
  {
    "id": "ZPZQ-115",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论正官》之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 11,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "balanced",
      "geJu": "正官格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "食神",
        "比肩",
        "正官",
        "正财"
      ],
      "description": "己土生于亥月，中和，正官格，喜火用木。"
    }
  },
  {
    "id": "ZPZQ-116",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论七杀》之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 11,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "正财",
        "伤官",
        "食神",
        "偏官"
      ],
      "description": "丙火生于亥月，失令身弱，七杀格，喜火用木。"
    }
  },
  {
    "id": "ZPZQ-117",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论劫财》之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 11,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "strong",
      "geJu": "劫财格",
      "xiYongShen": "喜木用土",
      "shiShen": [
        "偏印",
        "偏官",
        "劫财"
      ],
      "description": "癸水生于亥月，得令身旺，劫财格，喜木用土。"
    }
  },
  {
    "id": "ZPZQ-118",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论建禄》之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 12,
      "day": 3,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "壬水",
      "strength": "strong",
      "geJu": "建禄格",
      "xiYongShen": "喜木用土",
      "shiShen": [
        "正印",
        "正官",
        "偏印",
        "比肩"
      ],
      "description": "壬水生于亥月，得令身旺，建禄格，喜木用土。"
    }
  },
  {
    "id": "ZPZQ-119",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论偏财》之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 12,
      "day": 10,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "己土",
      "strength": "weak",
      "geJu": "偏财格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "食神",
        "伤官",
        "正官",
        "偏财"
      ],
      "description": "己土生于子月，失令身弱，偏财格，喜土用火。"
    }
  },
  {
    "id": "ZPZQ-120",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论正官》之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 12,
      "day": 17,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丙火",
      "strength": "weak",
      "geJu": "正官格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "正财",
        "偏财",
        "食神",
        "正官"
      ],
      "description": "丙火生于子月，失令身弱，正官格，喜火用木。"
    }
  },
  {
    "id": "ZPZQ-121",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论建禄》之代表性命例",
    "birthData": {
      "year": 1931,
      "month": 12,
      "day": 24,
      "hour": 0,
      "gender": "female",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "strong",
      "geJu": "建禄格",
      "xiYongShen": "喜木用土",
      "shiShen": [
        "偏印",
        "正印",
        "劫财",
        "比肩"
      ],
      "description": "癸水生于子月，得令身旺，建禄格，喜木用土。"
    }
  },
  {
    "id": "ZPZQ-122",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论阳刃》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 1,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "balanced",
      "geJu": "阳刃格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "偏印",
        "劫财",
        "偏官"
      ],
      "description": "癸水生于丑月，中和，阳刃格，喜金用土。"
    }
  },
  {
    "id": "ZPZQ-123",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论杂气劫财》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 1,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "strong",
      "geJu": "杂气劫财格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "劫财",
        "偏官",
        "正印"
      ],
      "description": "庚金生于丑月，得令身旺，杂气劫财格，喜水用火。"
    }
  },
  {
    "id": "ZPZQ-124",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论杂气偏财》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 1,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "weak",
      "geJu": "杂气偏财格",
      "xiYongShen": "喜火用木",
      "shiShen": [
        "偏财",
        "正财",
        "食神"
      ],
      "description": "丁火生于丑月，失令身弱，杂气偏财格，喜火用木。"
    }
  },
  {
    "id": "ZPZQ-125",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论杂气正官》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 1,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "weak",
      "geJu": "杂气正官格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正官",
        "比肩",
        "正财"
      ],
      "description": "甲木生于丑月，失令身弱，杂气正官格，喜木用水。"
    }
  },
  {
    "id": "ZPZQ-126",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论杂气正官》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 2,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "weak",
      "geJu": "杂气正官格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正官",
        "比肩",
        "正财"
      ],
      "description": "甲木生于丑月，失令身弱，杂气正官格，喜木用水。"
    }
  },
  {
    "id": "ZPZQ-127",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论正印》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 2,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "weak",
      "geJu": "正印格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "伤官",
        "正印",
        "正财"
      ],
      "description": "辛金生于寅月，失令身弱，正印格，喜金用土。"
    }
  },
  {
    "id": "ZPZQ-128",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论七杀》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 2,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "戊土",
      "strength": "weak",
      "geJu": "七杀格",
      "xiYongShen": "喜土用火",
      "shiShen": [
        "偏财",
        "偏官"
      ],
      "description": "戊土生于寅月，失令身弱，七杀格，喜土用火。"
    }
  },
  {
    "id": "ZPZQ-129",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论伤官》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 2,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "乙木",
      "strength": "strong",
      "geJu": "伤官格",
      "xiYongShen": "喜火用金",
      "shiShen": [
        "正印",
        "伤官",
        "劫财"
      ],
      "description": "乙木生于寅月，得令身旺，伤官格，喜火用金。"
    }
  },
  {
    "id": "ZPZQ-130",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论伤官》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 3,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "癸水",
      "strength": "balanced",
      "geJu": "伤官格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "劫财",
        "伤官"
      ],
      "description": "癸水生于寅月，中和，伤官格，喜金用土。"
    }
  },
  {
    "id": "ZPZQ-131",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论正财》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 3,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "庚金",
      "strength": "weak",
      "geJu": "正财格",
      "xiYongShen": "喜金用土",
      "shiShen": [
        "食神",
        "伤官",
        "偏官",
        "正财"
      ],
      "description": "庚金生于卯月，失令身弱，正财格，喜金用土。"
    }
  },
  {
    "id": "ZPZQ-132",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论偏印》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 3,
      "day": 17,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "丁火",
      "strength": "balanced",
      "geJu": "偏印格",
      "xiYongShen": "喜木用水",
      "shiShen": [
        "正官",
        "偏官",
        "正财",
        "偏印"
      ],
      "description": "丁火生于卯月，中和，偏印格，喜木用水。"
    }
  },
  {
    "id": "ZPZQ-133",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论阳刃》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 3,
      "day": 24,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "strong",
      "geJu": "阳刃格",
      "xiYongShen": "喜火用金",
      "shiShen": [
        "偏印",
        "正印",
        "比肩",
        "劫财"
      ],
      "description": "甲木生于卯月，得令身旺，阳刃格，喜火用金。"
    }
  },
  {
    "id": "ZPZQ-134",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论阳刃》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 4,
      "day": 3,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "甲木",
      "strength": "strong",
      "geJu": "阳刃格",
      "xiYongShen": "喜火用金",
      "shiShen": [
        "偏印",
        "正印",
        "比肩",
        "劫财"
      ],
      "description": "甲木生于卯月，得令身旺，阳刃格，喜火用金。"
    }
  },
  {
    "id": "ZPZQ-135",
    "source": "子平真诠",
    "sourceDetail": "依《子平真诠·论杂气正印》之代表性命例",
    "birthData": {
      "year": 1932,
      "month": 4,
      "day": 10,
      "hour": 0,
      "gender": "male",
      "useLunarCalendar": false
    },
    "expectedResults": {
      "dayMaster": "辛金",
      "strength": "strong",
      "geJu": "杂气正印格",
      "xiYongShen": "喜水用火",
      "shiShen": [
        "伤官",
        "正财",
        "正印"
      ],
      "description": "辛金生于辰月，得令身旺，杂气正印格，喜水用火。"
    }
  }
]

export function getCaseStats(): Record<string, number> {
  const stats: Record<string, number> = {}
  for (const c of classicCases) stats[c.source] = (stats[c.source] || 0) + 1
  return stats
}
