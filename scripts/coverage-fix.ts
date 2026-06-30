/**
 * 覆盖率补充测试 - 针对55条未覆盖Rule各设计一个专门的测试用例
 */

import { GEJU_RULES, determineGeJu, buildGeJuContext } from '../src/lib/bazi/rules/gejuRules'

// 初始化统计
const nameHitCount: Record<string, number> = {}
for (const r of GEJU_RULES) nameHitCount[r.name] = 0

const testCases: any[] = []

function addCase(name: string, opts: any) {
  testCases.push({
    name,
    dayGan: opts.dayGan || '甲',
    monthZhi: opts.monthZhi || '子',
    strengthScore: opts.strengthScore ?? 50,
    sixLines: opts.sixLines || {
      year: { gan: '庚', zhi: '申' },
      month: { gan: '辛', zhi: opts.monthZhi || '子' },
      day: { gan: opts.dayGan || '甲', zhi: '寅' },
      hour: { gan: '壬', zhi: '子' },
    },
    relatedShens: opts.relatedShens || {},
    fiveElementCount: opts.fiveElementCount || { 木:2, 火:1, 土:1, 金:2, 水:2 },
  })
}

// ===== 专旺格 5条 =====
// 曲直格：木日主 + 强度>=85 + 得令 + 通根>=3
addCase('曲直格', {
  dayGan: '甲', monthZhi: '寅', strengthScore: 90,
  relatedShens: {'甲':'比肩','乙':'劫财'},
  fiveElementCount: {木:5,火:1,土:0,金:0,水:0},
  sixLines: {
    year: { gan: '甲', zhi: '寅' },
    month: { gan: '乙', zhi: '寅' },
    day: { gan: '甲', zhi: '卯' },
    hour: { gan: '乙', zhi: '辰' },
  }
})

// 炎上格：火日主 + 强度>=85 + 得令 + 通根>=3
addCase('炎上格', {
  dayGan: '丙', monthZhi: '午', strengthScore: 92,
  relatedShens: {'丙':'比肩','丁':'劫财'},
  fiveElementCount: {木:1,火:5,土:1,金:0,水:0},
  sixLines: {
    year: { gan: '丙', zhi: '巳' },
    month: { gan: '丁', zhi: '午' },
    day: { gan: '丙', zhi: '午' },
    hour: { gan: '丁', zhi: '未' },
  }
})

// 从革格：金日主 + 强度>=85 + 得令 + 通根>=3
addCase('从革格', {
  dayGan: '庚', monthZhi: '申', strengthScore: 90,
  relatedShens: {'庚':'比肩','辛':'劫财'},
  fiveElementCount: {木:0,火:0,土:1,金:5,水:0},
  sixLines: {
    year: { gan: '庚', zhi: '申' },
    month: { gan: '辛', zhi: '酉' },
    day: { gan: '庚', zhi: '申' },
    hour: { gan: '辛', zhi: '戌' },
  }
})

// 润下格：水日主 + 强度>=85 + 得令 + 通根>=3
addCase('润下格', {
  dayGan: '壬', monthZhi: '子', strengthScore: 92,
  relatedShens: {'壬':'比肩','癸':'劫财'},
  fiveElementCount: {木:0,火:0,土:0,金:1,水:5},
  sixLines: {
    year: { gan: '癸', zhi: '亥' },
    month: { gan: '癸', zhi: '子' },
    day: { gan: '壬', zhi: '亥' },
    hour: { gan: '癸', zhi: '申' },
  }
})

// ===== 从格 5条 =====
// 从官杀格：官杀当令 + 强度<15 + 无根 + 异党>=3
addCase('从官杀格', {
  dayGan: '甲', monthZhi: '酉', strengthScore: 8,
  relatedShens: {'辛':'正官','庚':'偏官'},
  fiveElementCount: {木:0,火:0,土:0,金:5,水:1},
  sixLines: {
    year: { gan: '庚', zhi: '申' },
    month: { gan: '辛', zhi: '酉' },
    day: { gan: '甲', zhi: '申' },
    hour: { gan: '庚', zhi: '申' },
  }
})

// 弃命从杀
addCase('弃命从杀', {
  dayGan: '甲', monthZhi: '申', strengthScore: 5,
  relatedShens: {'庚':'偏官'},
  fiveElementCount: {木:0,火:0,土:1,金:5,水:0},
  sixLines: {
    year: { gan: '庚', zhi: '申' },
    month: { gan: '庚', zhi: '申' },
    day: { gan: '甲', zhi: '申' },
    hour: { gan: '庚', zhi: '申' },
  }
})

// 弃命从官
addCase('弃命从官', {
  dayGan: '甲', monthZhi: '酉', strengthScore: 5,
  relatedShens: {'辛':'正官'},
  fiveElementCount: {木:0,火:0,土:0,金:5,水:1},
  sixLines: {
    year: { gan: '辛', zhi: '酉' },
    month: { gan: '辛', zhi: '酉' },
    day: { gan: '甲', zhi: '酉' },
    hour: { gan: '辛', zhi: '巳' },
  }
})

// 从财格：财当令 + 强度<15 + 无根 + 异党>=3
addCase('从财格', {
  dayGan: '甲', monthZhi: '辰', strengthScore: 8,
  relatedShens: {'戊':'偏财','己':'正财'},
  fiveElementCount: {木:0,火:1,土:5,金:0,水:0},
  sixLines: {
    year: { gan: '戊', zhi: '戌' },
    month: { gan: '戊', zhi: '辰' },
    day: { gan: '甲', zhi: '戌' },
    hour: { gan: '戊', zhi: '辰' },
  }
})

// 弃命从财
addCase('弃命从财', {
  dayGan: '甲', monthZhi: '辰', strengthScore: 5,
  relatedShens: {'戊':'偏财'},
  fiveElementCount: {木:0,火:1,土:5,金:0,水:0},
  sixLines: {
    year: { gan: '戊', zhi: '戌' },
    month: { gan: '戊', zhi: '辰' },
    day: { gan: '甲', zhi: '戌' },
    hour: { gan: '己', zhi: '未' },
  }
})

// 从儿格：食伤当令 + 强度<15 + 无根 + 异党>=3
addCase('从儿格', {
  dayGan: '甲', monthZhi: '巳', strengthScore: 8,
  relatedShens: {'丙':'食神','丁':'伤官'},
  fiveElementCount: {木:0,火:5,土:1,金:0,水:0},
  sixLines: {
    year: { gan: '丙', zhi: '午' },
    month: { gan: '丁', zhi: '巳' },
    day: { gan: '甲', zhi: '巳' },
    hour: { gan: '丙', zhi: '寅' },
  }
})

// 真从印格
addCase('真从印格', {
  dayGan: '甲', monthZhi: '亥', strengthScore: 10,
  relatedShens: {'壬':'正印','癸':'偏印'},
  fiveElementCount: {木:1,火:0,土:0,金:0,水:5},
  sixLines: {
    year: { gan: '壬', zhi: '子' },
    month: { gan: '癸', zhi: '亥' },
    day: { gan: '甲', zhi: '亥' },
    hour: { gan: '壬', zhi: '申' },
  }
})

// ===== 化气格 1条 =====
addCase('化气格', {
  dayGan: '甲', monthZhi: '辰', strengthScore: 45,
  relatedShens: {'己':'正财'},
  fiveElementCount: {木:1,火:1,土:4,金:0,水:0},
  sixLines: {
    year: { gan: '己', zhi: '未' },
    month: { gan: '甲', zhi: '辰' },
    day: { gan: '甲', zhi: '辰' },
    hour: { gan: '己', zhi: '丑' },
  }
})

// ===== 正印格 1条 =====
addCase('正印格', {
  dayGan: '甲', monthZhi: '亥', strengthScore: 50,
  relatedShens: {'壬':'正印'},
  fiveElementCount: {木:2,火:0,土:0,金:1,水:3},
  sixLines: {
    year: { gan: '壬', zhi: '子' },
    month: { gan: '壬', zhi: '亥' },
    day: { gan: '甲', zhi: '寅' },
    hour: { gan: '壬', zhi: '申' },
  }
})

// ===== 正格上格 5条 =====
addCase('正官上格', {
  dayGan: '甲', monthZhi: '酉', strengthScore: 50,
  relatedShens: {'辛':'正官','癸':'正印'},
  fiveElementCount: {木:2,火:0,土:0,金:2,水:2},
})

addCase('正印上格', {
  dayGan: '甲', monthZhi: '亥', strengthScore: 52,
  relatedShens: {'壬':'正印','甲':'比肩'},
  fiveElementCount: {木:3,火:0,土:0,金:0,水:3},
})

addCase('伤官上格', {
  dayGan: '甲', monthZhi: '午', strengthScore: 48,
  relatedShens: {'丁':'伤官','戊':'偏财'},
  fiveElementCount: {木:2,火:2,土:2,金:0,水:0},
})

addCase('正财上格', {
  dayGan: '甲', monthZhi: '辰', strengthScore: 50,
  relatedShens: {'戊':'偏财','丙':'食神'},
  fiveElementCount: {木:2,火:2,土:2,金:0,水:0},
})

addCase('偏财上格', {
  dayGan: '甲', monthZhi: '戌', strengthScore: 48,
  relatedShens: {'己':'正财','丁':'伤官'},
  fiveElementCount: {木:2,火:2,土:2,金:0,水:0},
})

// ===== 破格 6条 =====
// 正官破格-官被克：月干正官 + 有伤官
addCase('正官破格-官被克', {
  dayGan: '甲', monthZhi: '酉', strengthScore: 45,
  relatedShens: {'辛':'正官','丁':'伤官'},
  fiveElementCount: {木:2,火:2,土:0,金:2,水:0},
  sixLines: {
    year: { gan: '丁', zhi: '午' },
    month: { gan: '辛', zhi: '酉' },
    day: { gan: '甲', zhi: '寅' },
    hour: { gan: '丁', zhi: '巳' },
  }
})

// 七杀破格-无制：月干七杀 + 无正印无偏印无食神无伤官
addCase('七杀破格-无制', {
  dayGan: '甲', monthZhi: '申', strengthScore: 30,
  relatedShens: {'庚':'偏官'},
  fiveElementCount: {木:1,火:0,土:0,金:4,水:1},
  sixLines: {
    year: { gan: '庚', zhi: '申' },
    month: { gan: '庚', zhi: '申' },
    day: { gan: '甲', zhi: '申' },
    hour: { gan: '庚', zhi: '戌' },
  }
})

// 七杀破格-印被财破：月干七杀 + 有印 + 有财
addCase('七杀破格-印被财破', {
  dayGan: '甲', monthZhi: '申', strengthScore: 35,
  relatedShens: {'庚':'偏官','壬':'偏印','戊':'偏财'},
  fiveElementCount: {木:1,火:0,土:2,金:2,水:1},
  sixLines: {
    year: { gan: '戊', zhi: '戌' },
    month: { gan: '庚', zhi: '申' },
    day: { gan: '甲', zhi: '辰' },
    hour: { gan: '壬', zhi: '申' },
  }
})

// 财格破格-劫财分财：月干偏财 + 有劫财
addCase('财格破格-劫财分财', {
  dayGan: '甲', monthZhi: '辰', strengthScore: 55,
  relatedShens: {'戊':'偏财','乙':'劫财'},
  fiveElementCount: {木:3,火:0,土:2,金:0,水:0},
  sixLines: {
    year: { gan: '乙', zhi: '卯' },
    month: { gan: '戊', zhi: '辰' },
    day: { gan: '甲', zhi: '卯' },
    hour: { gan: '乙', zhi: '寅' },
  }
})

// 食神破格-枭神夺食：月干食神 + 有偏印
addCase('食神破格-枭神夺食', {
  dayGan: '甲', monthZhi: '巳', strengthScore: 40,
  relatedShens: {'丙':'食神','癸':'偏印'},
  fiveElementCount: {木:2,火:1,土:0,金:0,水:3},
  sixLines: {
    year: { gan: '癸', zhi: '亥' },
    month: { gan: '丙', zhi: '巳' },
    day: { gan: '甲', zhi: '子' },
    hour: { gan: '癸', zhi: '子' },
  }
})

// 食神破格-伤官见官：月干食神 + 有伤官 + 有官
addCase('食神破格-伤官见官', {
  dayGan: '甲', monthZhi: '巳', strengthScore: 42,
  relatedShens: {'丙':'食神','丁':'伤官','辛':'正官'},
  fiveElementCount: {木:2,火:2,土:0,金:2,水:0},
  sixLines: {
    year: { gan: '辛', zhi: '酉' },
    month: { gan: '丙', zhi: '巳' },
    day: { gan: '甲', zhi: '寅' },
    hour: { gan: '丁', zhi: '午' },
  }
})

// 伤官破格-无财通关：月干伤官 + 有伤官 + 有官 + 无财
addCase('伤官破格-无财通关', {
  dayGan: '甲', monthZhi: '午', strengthScore: 40,
  relatedShens: {'丁':'伤官','辛':'正官'},
  fiveElementCount: {木:2,火:2,土:0,金:2,水:0},
  sixLines: {
    year: { gan: '辛', zhi: '酉' },
    month: { gan: '丁', zhi: '午' },
    day: { gan: '甲', zhi: '寅' },
    hour: { gan: '辛', zhi: '巳' },
  }
})

// 印格破格-印星混杂
addCase('印格破格-印星混杂', {
  dayGan: '甲', monthZhi: '亥', strengthScore: 50,
  relatedShens: {'壬':'正印','癸':'偏印'},
  fiveElementCount: {木:2,火:0,土:0,金:1,水:4},
  sixLines: {
    year: { gan: '癸', zhi: '子' },
    month: { gan: '壬', zhi: '亥' },
    day: { gan: '甲', zhi: '子' },
    hour: { gan: '癸', zhi: '亥' },
  }
})

// ===== 官财相生 =====
addCase('官财相生', {
  dayGan: '甲', monthZhi: '酉', strengthScore: 45,
  relatedShens: {'辛':'正官','戊':'偏财'},
  fiveElementCount: {木:1,火:0,土:2,金:2,水:1},
  sixLines: {
    year: { gan: '戊', zhi: '戌' },
    month: { gan: '辛', zhi: '酉' },
    day: { gan: '甲', zhi: '子' },
    hour: { gan: '戊', zhi: '辰' },
  }
})

// ===== 真正印格 =====
addCase('真正印格', {
  dayGan: '甲', monthZhi: '亥', strengthScore: 40,
  relatedShens: {'壬':'正印'},
  fiveElementCount: {木:2,火:0,土:0,金:1,水:3},
  sixLines: {
    year: { gan: '壬', zhi: '申' },
    month: { gan: '壬', zhi: '亥' },
    day: { gan: '甲', zhi: '子' },
    hour: { gan: '癸', zhi: '亥' },
  }
})

// ===== 真比肩格 =====
addCase('真比肩格', {
  dayGan: '甲', monthZhi: '寅', strengthScore: 68,
  relatedShens: {'甲':'比肩'},
  fiveElementCount: {木:4,火:1,土:0,金:0,水:1},
  sixLines: {
    year: { gan: '甲', zhi: '寅' },
    month: { gan: '甲', zhi: '寅' },
    day: { gan: '甲', zhi: '卯' },
    hour: { gan: '乙', zhi: '辰' },
  }
})

// ===== 特殊格：飞天禄马 =====
addCase('飞天禄马', {
  dayGan: '庚', monthZhi: '子', strengthScore: 50,
  relatedShens: {'癸':'伤官'},
  fiveElementCount: {木:0,火:0,土:1,金:2,水:3},
  sixLines: {
    year: { gan: '壬', zhi: '子' },
    month: { gan: '癸', zhi: '子' },
    day: { gan: '庚', zhi: '子' },
    hour: { gan: '壬', zhi: '子' },
  }
})

// ===== 金神格 =====
addCase('金神格', {
  dayGan: '乙', monthZhi: '酉', strengthScore: 45,
  relatedShens: {'辛':'偏官'},
  fiveElementCount: {木:2,火:0,土:2,金:2,水:0},
  sixLines: {
    year: { gan: '庚', zhi: '申' },
    month: { gan: '己', zhi: '酉' },
    day: { gan: '乙', zhi: '丑' },
    hour: { gan: '庚', zhi: '申' },
  }
})

// ===== 魁罡格 =====
addCase('魁罡格', {
  dayGan: '庚', monthZhi: '辰', strengthScore: 55,
  relatedShens: {'戊':'偏印'},
  fiveElementCount: {木:0,火:1,土:2,金:3,水:0},
  sixLines: {
    year: { gan: '戊', zhi: '戌' },
    month: { gan: '庚', zhi: '辰' },
    day: { gan: '庚', zhi: '辰' },
    hour: { gan: '戊', zhi: '戌' },
  }
})

// ===== 壬骑龙背格 =====
addCase('壬骑龙背格', {
  dayGan: '壬', monthZhi: '辰', strengthScore: 50,
  relatedShens: {'甲':'食神'},
  fiveElementCount: {木:2,火:0,土:2,金:1,水:2},
  sixLines: {
    year: { gan: '甲', zhi: '寅' },
    month: { gan: '甲', zhi: '辰' },
    day: { gan: '壬', zhi: '辰' },
    hour: { gan: '甲', zhi: '寅' },
  }
})

// ===== 井栏叉格 =====
addCase('井栏叉格', {
  dayGan: '庚', monthZhi: '申', strengthScore: 65,
  relatedShens: {'庚':'比肩'},
  fiveElementCount: {木:0,火:1,土:1,金:4,水:0},
  sixLines: {
    year: { gan: '庚', zhi: '申' },
    month: { gan: '庚', zhi: '申' },
    day: { gan: '庚', zhi: '申' },
    hour: { gan: '壬', zhi: '子' },
  }
})

// ===== 倒冲格 =====
addCase('倒冲格', {
  dayGan: '丙', monthZhi: '午', strengthScore: 60,
  relatedShens: {'丁':'劫财'},
  fiveElementCount: {木:0,火:4,土:1,金:1,水:0},
  sixLines: {
    year: { gan: '丁', zhi: '巳' },
    month: { gan: '丙', zhi: '午' },
    day: { gan: '丙', zhi: '午' },
    hour: { gan: '丁', zhi: '未' },
  }
})

// ===== 天干顺食 =====
addCase('天干顺食', {
  dayGan: '甲', monthZhi: '巳', strengthScore: 50,
  relatedShens: {'丙':'食神','戊':'偏财'},
  fiveElementCount: {木:2,火:2,土:2,金:0,水:0},
  sixLines: {
    year: { gan: '甲', zhi: '子' },
    month: { gan: '丙', zhi: '巳' },
    day: { gan: '戊', zhi: '辰' },
    hour: { gan: '庚', zhi: '申' },
  }
})

// ===== 两气成象 =====
addCase('两气成象', {
  dayGan: '甲', monthZhi: '卯', strengthScore: 75,
  relatedShens: {'乙':'劫财'},
  fiveElementCount: {木:4,火:0,土:0,金:0,水:0},
  sixLines: {
    year: { gan: '甲', zhi: '寅' },
    month: { gan: '乙', zhi: '卯' },
    day: { gan: '甲', zhi: '卯' },
    hour: { gan: '乙', zhi: '寅' },
  }
})

// ===== 伤官生财 =====
addCase('伤官生财', {
  dayGan: '甲', monthZhi: '午', strengthScore: 45,
  relatedShens: {'丁':'伤官','己':'正财'},
  fiveElementCount: {木:2,火:2,土:2,金:0,水:0},
  sixLines: {
    year: { gan: '己', zhi: '未' },
    month: { gan: '丁', zhi: '午' },
    day: { gan: '甲', zhi: '午' },
    hour: { gan: '己', zhi: '巳' },
  }
})

// ===== 伤官见官（特殊格） =====
addCase('伤官见官', {
  dayGan: '甲', monthZhi: '午', strengthScore: 42,
  relatedShens: {'丁':'伤官','辛':'正官'},
  fiveElementCount: {木:2,火:2,土:0,金:2,水:0},
  sixLines: {
    year: { gan: '辛', zhi: '酉' },
    month: { gan: '丁', zhi: '午' },
    day: { gan: '甲', zhi: '寅' },
    hour: { gan: '辛', zhi: '巳' },
  }
})

// ===== 枭神夺食（特殊格） =====
addCase('枭神夺食', {
  dayGan: '甲', monthZhi: '巳', strengthScore: 38,
  relatedShens: {'丙':'食神','癸':'偏印'},
  fiveElementCount: {木:2,火:1,土:0,金:0,水:3},
  sixLines: {
    year: { gan: '癸', zhi: '亥' },
    month: { gan: '丙', zhi: '巳' },
    day: { gan: '甲', zhi: '子' },
    hour: { gan: '癸', zhi: '子' },
  }
})

// ===== 天地德合 =====
addCase('天地德合', {
  dayGan: '甲', monthZhi: '丑', strengthScore: 50,
  relatedShens: {'己':'正财'},
  fiveElementCount: {木:2,火:1,土:2,金:1,水:0},
  sixLines: {
    year: { gan: '己', zhi: '丑' },
    month: { gan: '己', zhi: '丑' },
    day: { gan: '甲', zhi: '寅' },
    hour: { gan: '己', zhi: '丑' },
  }
})

// ===== 真从官杀格 =====
addCase('真从官杀格', {
  dayGan: '甲', monthZhi: '酉', strengthScore: 6,
  relatedShens: {'辛':'正官','庚':'偏官'},
  fiveElementCount: {木:0,火:0,土:0,金:5,水:1},
  sixLines: {
    year: { gan: '庚', zhi: '申' },
    month: { gan: '辛', zhi: '酉' },
    day: { gan: '甲', zhi: '申' },
    hour: { gan: '庚', zhi: '申' },
  }
})

// ===== 真从财格 =====
addCase('真从财格', {
  dayGan: '甲', monthZhi: '辰', strengthScore: 6,
  relatedShens: {'戊':'偏财','己':'正财'},
  fiveElementCount: {木:0,火:1,土:5,金:0,水:0},
  sixLines: {
    year: { gan: '戊', zhi: '戌' },
    month: { gan: '戊', zhi: '辰' },
    day: { gan: '甲', zhi: '戌' },
    hour: { gan: '己', zhi: '未' },
  }
})

// ===== 真从儿格 =====
addCase('真从儿格', {
  dayGan: '甲', monthZhi: '巳', strengthScore: 6,
  relatedShens: {'丙':'食神','丁':'伤官'},
  fiveElementCount: {木:0,火:5,土:1,金:0,水:0},
  sixLines: {
    year: { gan: '丙', zhi: '午' },
    month: { gan: '丁', zhi: '巳' },
    day: { gan: '甲', zhi: '巳' },
    hour: { gan: '丙', zhi: '寅' },
  }
})

// ===== 假从儿格 =====
addCase('假从儿格', {
  dayGan: '甲', monthZhi: '巳', strengthScore: 18,
  relatedShens: {'丙':'食神'},
  fiveElementCount: {木:1,火:4,土:1,金:0,水:0},
  sixLines: {
    year: { gan: '丙', zhi: '午' },
    month: { gan: '丙', zhi: '巳' },
    day: { gan: '甲', zhi: '巳' },
    hour: { gan: '丁', zhi: '未' },
  }
})

// ===== 真从势格 =====
addCase('真从势格', {
  dayGan: '甲', monthZhi: '酉', strengthScore: 5,
  relatedShens: {'辛':'正官'},
  fiveElementCount: {木:0,火:1,土:0,金:4,水:1},
  sixLines: {
    year: { gan: '辛', zhi: '酉' },
    month: { gan: '庚', zhi: '申' },
    day: { gan: '甲', zhi: '酉' },
    hour: { gan: '庚', zhi: '午' },
  }
})

// ===== 假从强格 =====
addCase('假从强格', {
  dayGan: '甲', monthZhi: '寅', strengthScore: 82,
  relatedShens: {'甲':'比肩'},
  fiveElementCount: {木:4,火:1,土:0,金:0,水:0},
  sixLines: {
    year: { gan: '甲', zhi: '寅' },
    month: { gan: '乙', zhi: '卯' },
    day: { gan: '甲', zhi: '卯' },
    hour: { gan: '丙', zhi: '巳' },
  }
})

// ===== 半从印格 =====
addCase('半从印格', {
  dayGan: '甲', monthZhi: '亥', strengthScore: 20,
  relatedShens: {'壬':'正印','癸':'偏印'},
  fiveElementCount: {木:1,火:0,土:0,金:0,水:4},
  sixLines: {
    year: { gan: '壬', zhi: '子' },
    month: { gan: '癸', zhi: '亥' },
    day: { gan: '甲', zhi: '子' },
    hour: { gan: '壬', zhi: '申' },
  }
})

// ===== 假从印格 =====
addCase('假从印格', {
  dayGan: '甲', monthZhi: '亥', strengthScore: 22,
  relatedShens: {'壬':'正印'},
  fiveElementCount: {木:1,火:0,土:0,金:0,水:4},
  sixLines: {
    year: { gan: '癸', zhi: '亥' },
    month: { gan: '壬', zhi: '亥' },
    day: { gan: '甲', zhi: '子' },
    hour: { gan: '癸', zhi: '子' },
  }
})

// ===== 真从杀格 =====
addCase('真从杀格', {
  dayGan: '甲', monthZhi: '申', strengthScore: 6,
  relatedShens: {'庚':'偏官'},
  fiveElementCount: {木:0,火:0,土:1,金:5,水:0},
  sixLines: {
    year: { gan: '庚', zhi: '申' },
    month: { gan: '庚', zhi: '申' },
    day: { gan: '甲', zhi: '申' },
    hour: { gan: '庚', zhi: '戌' },
  }
})

// ===== 假专旺格 =====
addCase('假专旺格', {
  dayGan: '甲', monthZhi: '寅', strengthScore: 80,
  relatedShens: {'甲':'比肩'},
  fiveElementCount: {木:4,火:1,土:0,金:0,水:0},
  sixLines: {
    year: { gan: '甲', zhi: '寅' },
    month: { gan: '甲', zhi: '寅' },
    day: { gan: '甲', zhi: '卯' },
    hour: { gan: '丙', zhi: '巳' },
  }
})

// ===== 甲己化土格 =====
addCase('甲己化土格', {
  dayGan: '甲', monthZhi: '辰', strengthScore: 45,
  relatedShens: {'己':'正财'},
  fiveElementCount: {木:1,火:1,土:4,金:0,水:0},
  sixLines: {
    year: { gan: '己', zhi: '未' },
    month: { gan: '甲', zhi: '辰' },
    day: { gan: '甲', zhi: '辰' },
    hour: { gan: '己', zhi: '丑' },
  }
})

// ===== 戊癸化火格 =====
addCase('戊癸化火格', {
  dayGan: '戊', monthZhi: '午', strengthScore: 50,
  relatedShens: {'癸':'正财'},
  fiveElementCount: {木:0,火:4,土:2,金:0,水:1},
  sixLines: {
    year: { gan: '癸', zhi: '巳' },
    month: { gan: '丁', zhi: '午' },
    day: { gan: '戊', zhi: '午' },
    hour: { gan: '丁', zhi: '未' },
  }
})

// ===== 官杀通关格 =====
addCase('官杀通关格', {
  dayGan: '甲', monthZhi: '酉', strengthScore: 45,
  relatedShens: {'辛':'正官','丙':'食神'},
  fiveElementCount: {木:2,火:2,土:0,金:2,水:0},
  sixLines: {
    year: { gan: '丙', zhi: '午' },
    month: { gan: '辛', zhi: '酉' },
    day: { gan: '甲', zhi: '寅' },
    hour: { gan: '丙', zhi: '巳' },
  }
})

// ===== 运行测试 =====
console.log('补充测试用例数：', testCases.length)
console.log()

for (const tc of testCases) {
  try {
    const r = determineGeJu(
      tc.sixLines,
      tc.relatedShens,
      tc.strengthScore,
      tc.dayGan,
      tc.monthZhi,
      tc.fiveElementCount
    )
    if (r.matchedRules) {
      for (const name of r.matchedRules) {
        nameHitCount[name] = (nameHitCount[name] || 0) + 1
      }
    }
  } catch (e) {}
}

// 计算覆盖率
const nameToIds: Record<string, string[]> = {}
for (const r of GEJU_RULES) {
  if (!nameToIds[r.name]) nameToIds[r.name] = []
  nameToIds[r.name].push(r.id)
}

const coveredIds = new Set<string>()
for (const [name, count] of Object.entries(nameHitCount)) {
  if (count > 0) {
    const ids = nameToIds[name] || []
    for (const id of ids) coveredIds.add(id)
  }
}

console.log(`Rule总数：${GEJU_RULES.length}`)
console.log(`已覆盖：${coveredIds.size}`)
console.log(`未覆盖：${GEJU_RULES.length - coveredIds.size}`)
console.log(`覆盖率：${((coveredIds.size / GEJU_RULES.length) * 100).toFixed(1)}%`)
console.log()

if (coveredIds.size < GEJU_RULES.length) {
  console.log('仍未覆盖的Rule：')
  let idx = 1
  for (const r of GEJU_RULES) {
    if (!coveredIds.has(r.id)) {
      console.log(`  ${idx}. ${r.id} - ${r.name} [priority: ${r.priority}]`)
      idx++
    }
  }
}
