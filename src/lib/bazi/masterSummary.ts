/**
 * 大师级命局总论引擎
 * 基于八字四柱数据，生成大师断命风格的深度命局总论
 *
 * 四个分析维度：
 * 1. 命局概况 — 身旺/身弱、格局、用忌神、八字特点
 * 2. 性格分析 — 日主+十神+五行推导的性格画像
 * 3. 一生命运走势 — 少年/青年/中年/晚年四段人生
 * 4. 人生建议 — 事业/婚姻/投资/健康/修身
 */

import type {
  BaZiChart,
  WangShuaiResult,
  FiveElement,
  FiveElementCount,
  ShenShi,
  HeavenlyStem,
  EarthlyBranch,
  SixLines,
  GanZhi,
} from './types'
import { getNaYin } from './nayin'

// ========== 导出类型 ==========

export interface MasterSummarySection {
  title: string
  content: string
}

export interface MasterSummaryResult {
  sections: MasterSummarySection[]
  fullText: string
}

// ========== 辅助工具 ==========

/** 获取日主五行分组 */
function getElementGroup(element: FiveElement): 'wood' | 'fire' | 'earth' | 'metal' | 'water' {
  const map: Record<FiveElement, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
    '木': 'wood', '火': 'fire', '土': 'earth', '金': 'metal', '水': 'water',
  }
  return map[element]
}

/** 从数组中随机选取（基于种子字符串确定性选择） */
function pickBySeed<T>(arr: T[], seed: string): T {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
  }
  return arr[Math.abs(hash) % arr.length]
}

/** 获取身旺/身弱描述词 */
function getStrengthLabel(wangShuai: WangShuaiResult): '身旺' | '身弱' | '身中和' {
  if (wangShuai.strengthScore >= 55) return '身旺'
  if (wangShuai.strengthScore <= 45) return '身弱'
  return '身中和'
}

/** 判断五行是否平衡 */
function isWuxingBalanced(count: FiveElementCount): boolean {
  const vals: number[] = [count['\u6728'], count['\u706B'], count['\u571F'], count['\u91D1'], count['\u6C34']]
  const max = Math.max(...vals)
  const min = Math.min(...vals)
  return max - min <= 20
}

/** 获取合化描述 */
function getHeHuaDescription(heHuaResults: any[]): string {
  if (!heHuaResults || heHuaResults.length === 0) return ''
  const successes = heHuaResults.filter((r: any) => r.success)
  const fails = heHuaResults.filter((r: any) => !r.success && r.isHeBan)
  const parts: string[] = []
  if (successes.length > 0) {
    parts.push(`命中有${successes.map((r: any) => `${r.sources.join('')}${r.type}化${r.huaElement}`).join('、')}之合化`)
  }
  if (fails.length > 0) {
    parts.push(`又有${fails.map((r: any) => `${r.sources.join('')}${r.type}合而不化`).join('、')}，合绊有情`)
  }
  return parts.join('；')
}

/** 获取冲克描述 */
function getChongKeDescription(chart: BaZiChart): string {
  const zhis = [
    chart.sixLines.year.zhi, chart.sixLines.month.zhi,
    chart.sixLines.day.zhi, chart.sixLines.hour.zhi,
  ]
  // 六冲
  const LIU_CHONG: Record<string, string> = {
    '子': '午', '午': '子', '丑': '未', '未': '丑',
    '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
  }
  const chongs: string[] = []
  for (let i = 0; i < zhis.length; i++) {
    for (let j = i + 1; j < zhis.length; j++) {
      if (LIU_CHONG[zhis[i]] === zhis[j]) {
        const labels = ['年支', '月支', '日支', '时支']
        chongs.push(`${labels[i]}${zhis[i]}与${labels[j]}${zhis[j]}相冲`)
      }
    }
  }
  return chongs.length > 0 ? chongs.join('；') : ''
}

/** 判断日干阴阳 */
function isYangStem(gan: HeavenlyStem): boolean {
  return '甲丙戊庚壬'.includes(gan)
}

// ========== 第一节：命局概况 ==========

function generateSection1(chart: BaZiChart, wangShuai: WangShuaiResult, geJu: any): MasterSummarySection {
  const dayGan = chart.sixLines.day.gan
  const dayElement = chart.dayMaster.dayGanElement
  const strengthLabel = getStrengthLabel(wangShuai)
  const geJuName = geJu?.name || '普通格局'
  const geJuCategory = geJu?.category || '正格'
  const bestElement = chart.xiYongShen.bestElement
  const avoidedElements = chart.xiYongShen.avoidedElements || []
  const balanced = isWuxingBalanced(chart.fiveElementCount)
  const heHua = getHeHuaDescription(chart.dayMaster.heHuaResults || [])
  const chongKe = getChongKeDescription(chart)

  // 日主描述映射
  const DAY_MASTER_DESC: Record<FiveElement, { wang: string[]; ruo: string[]; zhong: string[] }> = {
    '木': {
      wang: [
        '日元${gan}${element}，参天挺拔，如栋梁之材，根基深厚，生机勃发',
        '日元${gan}${element}，得时令之助，枝繁叶茂，参天古木之象',
      ],
      ruo: [
        '日元${gan}${element}，根基不固，如幼苗初生，亟待雨露滋养',
        '日元${gan}${element}，柔木逢秋，虽有向上之心，奈何根基浅薄',
      ],
      zhong: [
        '日元${gan}${element}，不偏不倚，刚柔相济，进退有度',
        '日元${gan}${element}，中和平和，如松柏常青，经得起岁月打磨',
      ],
    },
    '火': {
      wang: [
        '日元${gan}${element}，烈焰当空，光芒万丈，照耀四方，气势磅礴',
        '日元${gan}${element}，如日中天，旺火燎原，驱散一切阴霾',
      ],
      ruo: [
        '日元${gan}${element}，灯火微明，虽有心照亮，奈何力有不逮',
        '日元${gan}${element}，萤火之光，需借风势方可燎原',
      ],
      zhong: [
        '日元${gan}${element}，明暗适宜，光照大地而不烈，温润如春',
        '日元${gan}${element}，火候恰当，既能照亮他人，又不至灼伤自身',
      ],
    },
    '土': {
      wang: [
        '日元${gan}${element}，厚德载物，如山岳巍峨，稳重厚实，不可撼动',
        '日元${gan}${element}，坤土广袤，承载万物，包容天地，根基极深',
      ],
      ruo: [
        '日元${gan}${element}，薄土浅丘，承载力有限，需得旺火生扶方能成器',
        '日元${gan}${element}，如沙地散土，难以聚拢，须赖水润木固',
      ],
      zhong: [
        '日元${gan}${element}，土质肥沃，不燥不湿，最宜生养万物',
        '日元${gan}${element}，厚薄适中，既能承载，又可生金，生化有情',
      ],
    },
    '金': {
      wang: [
        '日元${gan}${element}，刚健中正，如宝剑出鞘，锋芒毕露，锐不可当',
        '日元${gan}${element}，金白水清，秋金肃杀，果断刚毅，令人敬畏',
      ],
      ruo: [
        '日元${gan}${element}，碎金弱铁，虽有金之质，尚欠锻造之功',
        '日元${gan}${element}，金埋土中，未经淬炼，需待时机方能显露锋芒',
      ],
      zhong: [
        '日元${gan}${element}，金玉之质，成器有望，刚柔并济，不失分寸',
        '日元${gan}${element}，精金美玉，质地纯正，宜加珍惜善加打磨',
      ],
    },
    '水': {
      wang: [
        '日元${gan}${element}，江河浩荡，奔流不息，气势雄浑，润泽四方',
        '日元${gan}${element}，如渊之水，深不可测，智慧内蕴，动静皆宜',
      ],
      ruo: [
        '日元${gan}${element}，涓涓细流，虽清可见底，奈何水浅难载大舟',
        '日元${gan}${element}，如露如霜，柔弱无力，亟需源头活水补充',
      ],
      zhong: [
        '日元${gan}${element}，清泉流响，不急不缓，恰到好处，润物无声',
        '日元${gan}${element}，水量适中，既可灌溉，又不泛滥，最为调和',
      ],
    },
  }

  // 格局描述映射
  const GEJU_DESC: Record<string, string[]> = {
    '正官格': [
      '入正官格，官星正气，主贵显达，品行端正，适合仕途发展',
      '成正官之格，官星得令，主贵人提携，事业有成，声名远播',
    ],
    '七杀格': [
      '入七杀格，杀星当权，主威权显赫，魄力非凡，宜武职或创业',
      '成七杀之格，刚毅果决，不畏艰险，但需印星制杀方为上格',
    ],
    '正印格': [
      '入正印格，印绶护身，主学业有成，贵人多助，一生安稳',
      '成正印之格，学识渊博，仁慈宽厚，最宜文教研究之途',
    ],
    '偏印格': [
      '入偏印格，偏印生身，主思维独特，有玄学天赋，直觉敏锐',
      '成偏印之格，灵慧过人，但需防多学少成、想法偏激之弊',
    ],
    '食神格': [
      '入食神格，食神泄秀，主才华出众，口福深厚，人缘极佳',
      '成食神之格，温文尔雅，福气绵长，一生衣食无忧',
    ],
    '伤官格': [
      '入伤官格，伤官透出，主才华横溢，创造力非凡，但需佩印为佳',
      '成伤官之格，聪明绝顶，口才了得，适合自由职业或艺术发展',
    ],
    '正财格': [
      '入正财格，正财得位，主财运稳健，脚踏实地，宜正途求财',
      '成正财之格，勤俭持家，理财有方，一生衣食丰足',
    ],
    '偏财格': [
      '入偏财格，偏财旺相，主商业头脑敏锐，善于把握投资机会',
      '成偏财之格，财运活跃，人缘广阔，但需防财来财去',
    ],
    '比肩格': [
      '入比肩格，比肩帮身，主独立自主，重情重义，适合合伙经营',
      '成比肩之格，意志坚强，自主性强，但需防争财之患',
    ],
    '劫财格': [
      '入劫财格，劫财旺而身强，主交际广泛，行动力强，有开拓精神',
      '成劫财之格，善于交际，慷慨大方，但需注意理财规划',
    ],
    '从官杀格': [
      '入从官杀格，弃命从杀，主官运亨通，可掌权柄，事业显达',
      '成从官杀之格，因势利导，借力打力，贵人运极旺',
    ],
    '从财格': [
      '入从财格，命从财势，主财运极佳，商道亨通，一生富足',
      '成从财之格，弃命从财，与财富缘分极深，善于经营',
    ],
    '从儿格': [
      '入从儿格，食伤泄秀到底，主才华尽展，创造力丰富',
      '成从儿之格，聪明机智，一生以才华立足，适合文教艺术',
    ],
    '专旺格': [
      '入专旺格，一气专旺，气势磅礴，自成格局，非常人可比',
      '成专旺之格，五行归一，气势极盛，顺其势者成，逆其势者败',
    ],
    '化气格': [
      '入化气格，合化成象，气质脱俗，命运独特，非凡命造',
      '成化气之格，五行化合，别开生面，有脱胎换骨之象',
    ],
  }

  // 五行平衡描述
  const wuxingDesc = balanced
    ? '五行分布均匀，不偏不倚，命局中和，乃有福之象。'
    : `五行之中${getDominantElement(chart.fiveElementCount)}偏旺，${getWeakElement(chart.fiveElementCount)}偏弱，格局有偏旺之象，需借运助之。`

  // 特殊关系描述
  const specialDesc = []
  if (heHua) specialDesc.push(heHua)
  if (chongKe) specialDesc.push(chongKe)

  const dayDesc = pickBySeed(DAY_MASTER_DESC[dayElement][strengthLabel === '身旺' ? 'wang' : strengthLabel === '身弱' ? 'ruo' : 'zhong'], dayGan + '概况')
    .replace(/\$\{gan\}/g, dayGan)
    .replace(/\$\{element\}/g, dayElement)

  const gejuDesc = GEJU_DESC[geJuName]
    ? pickBySeed(GEJU_DESC[geJuName], dayGan + geJuName)
    : `格局定为${geJuName}，属${geJuCategory}，${geJu?.description || '自成一格'}。`

  const avoidedStr = avoidedElements.length > 0 ? `忌${avoidedElements.join('、')}。` : ''

  let content = `观此命局，${dayDesc}。${strengthLabel === '身旺' ? '命主身旺，精力充沛，抗压能力极强，然过旺则刚愎自用，须以泄耗为佳。' : strengthLabel === '身弱' ? '命主身弱，然弱而有气，非无根之木，宜生扶补益，方可成器。' : '命主身中和，不偏不倚，阴阳调和，此为最佳状态，一生平稳顺遂。'}`

  content += `格局取${geJuName}，${gejuDesc}${wuxingDesc}`

  if (bestElement) {
    content += `命局用神取${bestElement}，喜其生助日主、调和命局。${avoidedStr}`
  }

  if (specialDesc.length > 0) {
    content += `此外，${specialDesc.join('，')}，皆为命局之关键变数。`
  }

  content += `旺衰评分${wangShuai.strengthScore}分，${wangShuai.deLing ? '得令' : '不得令'}，${wangShuai.deDi ? '得地' : '不得地'}，${wangShuai.tongGen ? '通根' : '无根'}，综合论之，此命${geJuName}${geJu?.grade || '中格'}，${geJu?.poGe ? '然有破格之忧，需岁运补救。' : '格局清纯，难得可贵。'}`

  return { title: '命局概况', content }
}

function getDominantElement(count: FiveElementCount): string {
  const entries: [string, number][] = [
    ['\u6728', count['\u6728']], ['\u706B', count['\u706B']],
    ['\u571F', count['\u571F']], ['\u91D1', count['\u91D1']], ['\u6C34', count['\u6C34']],
  ]
  let maxEl = '\u6728'
  let maxVal = 0
  for (const [el, val] of entries) {
    if (val > maxVal) { maxVal = val; maxEl = el }
  }
  return maxEl
}

function getWeakElement(count: FiveElementCount): string {
  const entries: [string, number][] = [
    ['\u6728', count['\u6728']], ['\u706B', count['\u706B']],
    ['\u571F', count['\u571F']], ['\u91D1', count['\u91D1']], ['\u6C34', count['\u6C34']],
  ]
  let minEl = '\u6728'
  let minVal = Infinity
  for (const [el, val] of entries) {
    if (val < minVal) { minVal = val; minEl = el }
  }
  return minEl
}

// ========== 第二节：性格分析 ==========

function generateSection2(chart: BaZiChart, wangShuai: WangShuaiResult): MasterSummarySection {
  const dayGan = chart.sixLines.day.gan
  const dayElement = chart.dayMaster.dayGanElement
  const yinYang = isYangStem(dayGan) ? '阳' : '阴'
  const strengthLabel = getStrengthLabel(wangShuai)
  const relatedShens = chart.dayMaster.relatedShens

  // 获取主导十神
  const shenShiList: { name: ShenShi; gan: HeavenlyStem }[] = []
  const allGans: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const pillarGans = [
    chart.sixLines.year.gan, chart.sixLines.month.gan,
    chart.sixLines.day.gan, chart.sixLines.hour.gan,
  ]
  for (const g of pillarGans) {
    if (relatedShens[g] && g !== dayGan) {
      shenShiList.push({ name: relatedShens[g], gan: g })
    }
  }

  // 找出主导十神
  const shenShiCount: Record<string, number> = {}
  for (const s of shenShiList) {
    shenShiCount[s.name] = (shenShiCount[s.name] || 0) + 1
  }
  const dominantShenShi = Object.entries(shenShiCount)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
  const topSS = dominantShenShi[0] || '正印'
  const secSS = dominantShenShi[1]

  // 日主五行性格模板
  const ELEMENT_PERSONALITY: Record<FiveElement, { yang: { pros: string[]; cons: string[] }; yin: { pros: string[]; cons: string[] } }> = {
    '木': {
      yang: {
        pros: ['刚直不阿', '正直坦率', '积极向上', '有领导才能', '富有同情心'],
        cons: ['固执己见', '不善变通', '过于直率而易伤人', '争强好胜'],
      },
      yin: {
        pros: ['温文尔雅', '善于忍耐', '心地善良', '适应力强', '富有艺术气质'],
        cons: ['优柔寡断', '过于退让', '心胸较窄', '多愁善感'],
      },
    },
    '火': {
      yang: {
        pros: ['热情豪爽', '光明磊落', '行动力强', '善于社交', '充满活力'],
        cons: ['急躁冲动', '缺乏耐心', '锋芒太露', '情绪波动大'],
      },
      yin: {
        pros: ['温柔细腻', '洞察力强', '感情丰富', '有内涵', '善于观察'],
        cons: ['心机较深', '多疑善妒', '好逸恶劳', '内心敏感'],
      },
    },
    '土': {
      yang: {
        pros: ['稳重踏实', '诚实守信', '包容大度', '有耐心', '重信誉'],
        cons: ['反应迟缓', '过于保守', '不善表达', '固执己见'],
      },
      yin: {
        pros: ['温和谦逊', '勤劳肯干', '善于照顾人', '心思细腻', '默默付出'],
        cons: ['缺乏自信', '过于依赖', '优柔寡断', '谨小慎微'],
      },
    },
    '金': {
      yang: {
        pros: ['果断决绝', '重义气', '组织力强', '有魄力', '意志坚定'],
        cons: ['好勇斗狠', '过于刚烈', '不留情面', '独断专行'],
      },
      yin: {
        pros: ['精致优雅', '心思缜密', '有审美力', '言辞精准', '重感情'],
        cons: ['多愁善感', '爱面子', '敏感多疑', '内心脆弱'],
      },
    },
    '水': {
      yang: {
        pros: ['智慧过人', '应变力强', '口才出众', '善于交际', '思维活跃'],
        cons: ['心猿意马', '缺乏恒心', '善变', '过于圆滑'],
      },
      yin: {
        pros: ['聪明机智', '温润如玉', '有洞察力', '想象力丰富', '直觉敏锐'],
        cons: ['胆小怕事', '缺乏勇气', '优柔寡断', '心胸不够开阔'],
      },
    },
  }

  // 十神性格模板
  const SHENSHI_CHAR: Record<string, { thinking: string[]; action: string[]; emotion: string[]; social: string[] }> = {
    '比肩': {
      thinking: ['独立思考', '自主判断', '不易受他人影响'],
      action: ['雷厉风行', '独来独往', '亲力亲为'],
      emotion: ['情绪稳定', '遇事冷静', '不易表露内心'],
      social: ['重情重义', '朋友广泛', '但易与人争权'],
    },
    '劫财': {
      thinking: ['大胆果决', '敢于冒险', '善于捕捉机会'],
      action: ['行动力极强', '说干就干', '敢于挑战权威'],
      emotion: ['热情奔放', '情绪起伏大', '慷慨大方'],
      social: ['交际广泛', '人脉极广', '但需防损友'],
    },
    '食神': {
      thinking: ['思维开阔', '乐观豁达', '注重生活品质'],
      action: ['不急不躁', '稳扎稳打', '享受过程'],
      emotion: ['平和安详', '知足常乐', '内心富足'],
      social: ['人缘极佳', '善于照顾人', '朋友圈稳定'],
    },
    '伤官': {
      thinking: ['思维独特', '逆向思考', '富有创造力'],
      action: ['标新立异', '敢做敢当', '不按常理出牌'],
      emotion: ['感情丰富', '情绪起伏', '内心有傲气'],
      social: ['才华吸引人', '口才出众', '但易得罪人'],
    },
    '偏财': {
      thinking: ['商业思维', '善于分析', '精明能干'],
      action: ['善于投资', '灵活变通', '把握时机'],
      emotion: ['乐观开朗', '享受生活', '物质追求强'],
      social: ['慷慨大方', '人缘极佳', '异性缘好'],
    },
    '正财': {
      thinking: ['务实保守', '注重实际', '计划性强'],
      action: ['脚踏实地', '勤恳认真', '有始有终'],
      emotion: ['内敛沉稳', '感情专一', '不善表达'],
      social: ['诚实可靠', '重承诺', '社交圈较小但稳固'],
    },
    '偏官': {
      thinking: ['战略思维', '果断利落', '善抓核心'],
      action: ['执行力强', '敢于担当', '不惧压力'],
      emotion: ['内心刚强', '外冷内热', '重义轻情'],
      social: ['有领导魅力', '令人敬畏', '但需防树敌'],
    },
    '正官': {
      thinking: ['条理清晰', '守规矩', '重视秩序'],
      action: ['按部就班', '有计划', '稳扎稳打'],
      emotion: ['克制内敛', '重视名誉', '有责任感'],
      social: ['受人尊敬', '有社会地位', '人际关系和谐'],
    },
    '偏印': {
      thinking: ['深度思考', '直觉敏锐', '善于联想'],
      action: ['独辟蹊径', '做事有节奏', '有研究精神'],
      emotion: ['内心丰富', '不善表达', '享受独处'],
      social: ['交游不广', '但知己深交', '给人神秘感'],
    },
    '正印': {
      thinking: ['博学多识', '善于学习', '思维缜密'],
      action: ['有耐心', '稳步前进', '不急功近利'],
      emotion: ['温和善良', '富有同情心', '乐于助人'],
      social: ['人缘好', '贵人运旺', '受人信赖'],
    },
  }

  const elementChar = ELEMENT_PERSONALITY[dayElement][yinYang === '阳' ? 'yang' : 'yin']
  const ssChar = SHENSHI_CHAR[topSS]

  const pros = pickBySeed(elementChar.pros, dayGan + 'pros')
  const cons = pickBySeed(elementChar.cons, dayGan + 'cons')

  let content = `日元${dayGan}${dayElement}，${yinYang === '阳' ? '阳刚' : '阴柔'}之性。`

  // 优点描述
  content += `观其本性，${pros}、${elementChar.pros.find(p => p !== pros)}，此乃天性之优。`
  content += `命中以${topSS}为主导十神，${pickBySeed(ssChar.thinking, dayGan + 'think')}，思虑深远；${pickBySeed(ssChar.action, dayGan + 'act')}，做事有章法。`

  // 缺点描述
  content += `然${cons}，${elementChar.cons.find(c => c !== cons)}，此为需修之处。`

  // 思维方式
  content += `思维方式上，命主${pickBySeed(ssChar.thinking, dayGan + 'thinking')}，${secSS ? `兼有${secSS}之${pickBySeed(SHENSHI_CHAR[secSS]?.thinking || ['灵活'], dayGan + 'sec_think')}，` : ''}${strengthLabel === '身旺' ? '因身旺而自信满满，有时过于主观。' : strengthLabel === '身弱' ? '因身弱而多思多虑，遇事容易犹豫。' : '心态平衡，思维客观，难得可贵。'}`

  // 做事风格
  content += `做事风格方面，${pickBySeed(ssChar.action, dayGan + 'doing')}。`

  // 情绪特点
  content += `情绪上，${pickBySeed(ssChar.emotion, dayGan + 'emotion')}，${strengthLabel === '身旺' ? '需防怒气伤肝，修身养性为上。' : strengthLabel === '身弱' ? '需增强自信，遇事莫要过度内耗。' : '情绪管理得当，不易大起大落。'}`

  // 人际关系
  content += `人际方面，${pickBySeed(ssChar.social, dayGan + 'social')}。${dayElement === '木' ? '木主仁，命主天然具有慈悲之心，人缘根基不错。' : dayElement === '火' ? '火主礼，命主待人有礼有节，容易获得他人好感。' : dayElement === '土' ? '土主信，命主信守承诺，是值得信赖之人。' : dayElement === '金' ? '金主义，命主讲义气重承诺，交友虽少但交心。' : '水主智，命主以智慧取胜，善于用头脑经营人际关系。'}`

  return { title: '性格分析', content }
}

// ========== 第三节：一生命运走势 ==========

function generateSection3(chart: BaZiChart, wangShuai: WangShuaiResult, daYun: any): MasterSummarySection {
  const dayGan = chart.sixLines.day.gan
  const dayElement = chart.dayMaster.dayGanElement
  const bestElement = chart.xiYongShen.bestElement
  const avoidedElements = chart.xiYongShen.avoidedElements || []

  // 获取大运数据
  const daYunSteps: any[] = daYun?.steps || []

  // 辅助函数：根据大运判断某阶段吉凶
  function getDaYunPhaseQuality(startAge: number, endAge: number): { isGood: boolean; elements: FiveElement[]; description: string } {
    const relevantSteps = daYunSteps.filter((s: any) => {
      return s.startAge <= endAge && s.endAge >= startAge
    })
    const xiCount = relevantSteps.filter((s: any) => s.isXi).length
    const jiCount = relevantSteps.filter((s: any) => s.isJi).length
    const elements: FiveElement[] = []
    for (const step of relevantSteps) {
      if (step.ganZhi?.element && !elements.includes(step.ganZhi.element)) {
        elements.push(step.ganZhi.element)
      }
    }
    const isGood = xiCount >= jiCount
    return {
      isGood,
      elements,
      description: isGood
        ? `此运喜神当权，事业顺遂，贵人相助。`
        : `此运忌神当令，需韬光养晦，谨慎行事。`,
    }
  }

  // 少年运 (1-18)
  const yearGan = chart.sixLines.year.gan
  const yearZhi = chart.sixLines.year.zhi
  const monthGan = chart.sixLines.month.gan
  const monthZhi = chart.sixLines.month.zhi
  const yearNaYin = getNaYin(yearGan, yearZhi)
  const yearElement = chart.sixLines.year.element

  const YOUTH_TEMPLATES: Record<FiveElement, { good: string[]; bad: string[] }> = {
    '木': {
      good: [
        `少年时期，年柱${yearGan}${yearZhi}${yearNaYin}，${yearElement}气旺盛，${getDaYunPhaseQuality(1, 18).description}祖辈根基深厚，幼年得庇护，家境尚可。月柱${monthGan}${monthZhi}为少年学业之根基，若月支${bestElement ? '含用神之气' : '逢生助'}，学业可期。少年运整体顺遂，有贵人护佑。`,
        `观年柱${yearGan}${yearZhi}${yearNaYin}，乃少年之根基，${yearElement}主生机，幼年环境宽松。月柱${monthGan}${monthZhi}管十六岁前之学业运，${getDaYunPhaseQuality(1, 18).isGood ? '早运行喜神之地，聪颖好学，成绩出众。' : '早年运程稍显平淡，需加倍努力方可有成。'}此阶段宜重学业，打牢根基。`,
      ],
      bad: [
        `少年时期，年柱${yearGan}${yearZhi}${yearNaYin}，根基虽有但力弱。月柱${monthGan}${monthZhi}管少年运程，${getDaYunPhaseQuality(1, 18).isGood ? '得早运帮扶，虽然起步艰难，但贵在坚持。' : '早年忌神较多，家庭环境或有不顺，学业需靠自身毅力。'}幼年宜培养独立性格，以备将来之需。`,
        `年柱${yearGan}${yearZhi}${yearNaYin}，为少年祖辈宫，${yearElement === avoidedElements[0] ? '忌神临位，幼年家道或有起伏。' : `${yearElement}助身，幼年根基尚可。`}月柱${monthGan}${monthZhi}主学业宫，${getDaYunPhaseQuality(1, 18).description}少年时期宜静心读书，不求速成但求扎实。`,
      ],
    },
    '火': {
      good: [
        `少年运看年月两柱，年柱${yearGan}${yearZhi}${yearNaYin}，火光明亮，${getDaYunPhaseQuality(1, 18).description}幼年聪慧活泼，得长辈喜爱。月柱${monthGan}${monthZhi}管学业，若得${bestElement}之助，成绩斐然。少年时期运势整体向好，宜多接触各类知识。`,
        `观年柱${yearGan}${yearZhi}${yearNaYin}，火气照命，幼年性格外向开朗。月柱${monthGan}${monthZhi}管初运，${getDaYunPhaseQuality(1, 18).isGood ? '早运得助，少年得志，学业运佳，可重点培养。' : '早年运程有波折，但火性之人不怕困难，愈挫愈勇。'}此阶段重在开拓眼界。`,
      ],
      bad: [
        `年柱${yearGan}${yearZhi}${yearNaYin}，少年根基，${getDaYunPhaseQuality(1, 18).isGood ? '虽有波折但总体尚可，父母虽辛苦但尽力栽培。' : '早年运程欠佳，家庭条件或有不宽裕，需自立自强。'}月柱${monthGan}${monthZhi}管学业，少年时期宜刻苦努力，为将来打下基础。`,
        `少年运看年柱${yearGan}${yearZhi}${yearNaYin}与月柱${monthGan}${monthZhi}，${yearElement === avoidedElements[0] ? '忌神在年柱，幼年家庭多有变动。' : '根基尚可，虽有不足但有可借之力。'}${getDaYunPhaseQuality(1, 18).description}少年阶段宜静待花开，厚积薄发。`,
      ],
    },
    '土': {
      good: [
        `少年时期，年柱${yearGan}${yearZhi}${yearNaYin}，土厚载物，根基稳固。${getDaYunPhaseQuality(1, 18).description}家庭环境稳定，幼年生活安宁。月柱${monthGan}${monthZhi}管学业，土主信，少年踏实肯学，成绩平稳向上。少年运稳健，宜重基础学科。`,
        `观年柱${yearGan}${yearZhi}${yearNaYin}，土气浑厚，幼年环境朴实。月柱${monthGan}${monthZhi}管初运，${getDaYunPhaseQuality(1, 18).isGood ? '早运平稳，学业顺利，得师长器重。' : '早年运中有小阻，但土性之人不怕困难，稳扎稳打即可。'}此阶段重在培养耐心与恒心。`,
      ],
      bad: [
        `年柱${yearGan}${yearZhi}${yearNaYin}为少年根基，${getDaYunPhaseQuality(1, 18).isGood ? '家底虽不丰厚，但家人齐心，幼年尚安。' : '早年忌神较多，家境或有些许艰辛。'}月柱${monthGan}${monthZhi}管学业宫，${getDaYunPhaseQuality(1, 18).description}少年宜吃苦耐劳，为将来厚积薄发。`,
        `少年看年柱${yearGan}${yearZhi}${yearNaYin}与月柱${monthGan}${monthZhi}，根基${yearElement === avoidedElements[0] ? '偏弱，幼年多有艰辛。' : '尚可，虽非大富大贵但衣食无忧。'}${getDaYunPhaseQuality(1, 18).description}此阶段宜安分守己，勤勉学习。`,
      ],
    },
    '金': {
      good: [
        `少年运中，年柱${yearGan}${yearZhi}${yearNaYin}，金质精纯，幼年有贵气。${getDaYunPhaseQuality(1, 18).description}月柱${monthGan}${monthZhi}管学业，金主义，少年有担当，学业上勇于竞争，成绩突出。早年运势佳，宜培养领导才能。`,
        `年柱${yearGan}${yearZhi}${yearNaYin}，秋金之气，幼年性格刚毅。月柱${monthGan}${monthZhi}管初运，${getDaYunPhaseQuality(1, 18).isGood ? '早运顺遂，学业有成，少年得志之象。' : '早年虽有波折，但金性之人意志坚强，能化阻力为助力。'}此阶段宜多参与集体活动。`,
      ],
      bad: [
        `年柱${yearGan}${yearZhi}${yearNaYin}为少年根基，${getDaYunPhaseQuality(1, 18).isGood ? '家底一般但家教严格，幼年养成了良好习惯。' : '早年运中有困难，家庭或有不顺之处。'}月柱${monthGan}${monthZhi}管学业，${getDaYunPhaseQuality(1, 18).description}少年时期需磨练意志，方能成大器。`,
        `少年看年柱${yearGan}${yearZhi}${yearNaYin}与月柱${monthGan}${monthZhi}，${yearElement === avoidedElements[0] ? '忌神临早年，幼年生活艰辛。' : '根基尚可，虽非富贵但平安。'}${getDaYunPhaseQuality(1, 18).description}少年阶段宜忍辱负重，以勤补拙。`,
      ],
    },
    '水': {
      good: [
        `少年运看年月两柱，年柱${yearGan}${yearZhi}${yearNaYin}，水灵聪慧，幼年天赋过人。${getDaYunPhaseQuality(1, 18).description}月柱${monthGan}${monthZhi}管学业，水主智，少年思维活跃，学习成绩好，尤其在文科方面天赋明显。早年运佳，宜善加培养。`,
        `观年柱${yearGan}${yearZhi}${yearNaYin}，水润无声，幼年性格聪颖内敛。月柱${monthGan}${monthZhi}管初运，${getDaYunPhaseQuality(1, 18).isGood ? '早运顺遂，学业运佳，得师长赏识。' : '早年虽有波折，但水性之人适应力强，能化险为夷。'}此阶段宜多阅读思考，拓展知识面。`,
      ],
      bad: [
        `年柱${yearGan}${yearZhi}${yearNaYin}为少年根基，${getDaYunPhaseQuality(1, 18).isGood ? '幼年虽不富裕但环境尚可，家人用心栽培。' : '早年运中有困顿，需靠自身智慧渡过。'}月柱${monthGan}${monthZhi}管学业宫，${getDaYunPhaseQuality(1, 18).description}少年宜发挥水之智慧，灵活应对困难。`,
        `少年看年柱${yearGan}${yearZhi}${yearNaYin}与月柱${monthGan}${monthZhi}，${yearElement === avoidedElements[0] ? '忌神在早年，幼年家境有变。' : '根基平稳，虽非显赫但安康。'}${getDaYunPhaseQuality(1, 18).description}此阶段宜静心学习，为将来蓄力。`,
      ],
    },
  }

  // 青年运 (18-35)
  const dayZhi = chart.sixLines.day.zhi
  const youthPhase = getDaYunPhaseQuality(18, 35)
  const YOUTH2_TEMPLATES: Record<FiveElement, string[]> = {
    '木': [
      `青年运（十八至三十五岁），重点看月柱${monthGan}${monthZhi}与日柱${chart.sixLines.day.gan}${dayZhi}。月柱管事业基础，日柱管自身发展。${youthPhase.description}此阶段正值日柱当权，${dayElement}气旺盛，命主精力充沛，${dayElement === '木' ? '如春天之树，蓬勃生长，事业与感情齐头并进。' : dayElement === '火' ? '如火之渐旺，热情高涨，事业上有冲劲，但需注意把握方向。' : dayElement === '土' ? '如大地承载，稳扎稳打，事业基础逐渐夯实。' : dayElement === '金' ? '如秋金成器，渐露锋芒，事业上有突破机会。' : '如水之汇聚，智慧日增，事业上有贵人提携。'}`,
      `步入青年，月柱${monthGan}${monthZhi}与日柱${chart.sixLines.day.gan}${dayZhi}主导此运。${youthPhase.isGood ? '此运喜用神交汇，事业上升期明显，感情运也同步发展。' : '此运需注意平衡，事业虽有阻力，但日柱${dayElement}自有根基，不至大败。'}青年时期是人生关键十年，${bestElement}为用，宜在${getElementDirection(bestElement)}方位发展。`,
    ],
    '火': [
      `青年运（十八至三十五岁），月柱${monthGan}${monthZhi}与日柱${chart.sixLines.day.gan}${dayZhi}主事。${youthPhase.description}${youthPhase.isGood ? '此运火气旺盛，事业上升势头明显，适合在火热之行业如科技、传媒、教育等大展拳脚。' : '此运虽有阻碍，但火性之人不怕挑战，逢凶化吉之象。'}青年期是感情婚姻的关键阶段，日支${dayZhi}为夫妻宫，需重点关注。`,
      `观青年运程，月柱${monthGan}${monthZhi}乃事业之基，日柱${chart.sixLines.day.gan}${dayZhi}为自身宫位。${youthPhase.description}此十年是命主人生第一个重要转折期，${dayElement === '火' ? '火性光明，青年时代表现活跃，社交广泛，人脉积累迅速。' : '虽非火命，但青年运中有火气相助，精力旺盛，事业稳步前行。'}宜把握机遇，大胆尝试。`,
    ],
    '土': [
      `青年运（十八至三十五岁），月柱${monthGan}${monthZhi}与日柱${chart.sixLines.day.gan}${dayZhi}主导。${youthPhase.description}此阶段事业基础逐渐形成，${youthPhase.isGood ? '土性稳重，事业稳中有升，贵人暗中相助。' : '虽遇困难，但土性之人韧性极强，坚持必有回报。'}青年运重在积累，日支${dayZhi}为夫妻宫，此阶段感情运也值得关注。`,
      `步入青年期，月柱${monthGan}${monthZhi}与日柱${chart.sixLines.day.gan}${dayZhi}共主此运。${youthPhase.description}${bestElement}为用神，青年运中若行${bestElement}之运，事业学业皆有突破。此阶段宜选择与${bestElement}相关之行业深耕，厚积薄发。`,
    ],
    '金': [
      `青年运（十八至三十五岁），月柱${monthGan}${monthZhi}与日柱${chart.sixLines.day.gan}${dayZhi}主事。${youthPhase.description}${youthPhase.isGood ? '金性果断，青年时期决策力强，事业发展迅速，有升职创业之象。' : '此运虽有阻力，但金性坚韧，能经考验，困难过后便是坦途。'}青年时期社交运活跃，人脉拓展为中年事业打下基础。`,
      `观青年运，月柱${monthGan}${monthZhi}与日柱${chart.sixLines.day.gan}${dayZhi}共同主导。${youthPhase.description}日支${dayZhi}为夫妻宫，青年期婚姻感情为主题之一。${dayElement === '金' ? '金性之人青年时期务实进取，事业方向明确，执行力强。' : '青年运中有金气相助，果断决策，事业有成。'}此阶段宜把握机会，果断出手。`,
    ],
    '水': [
      `青年运（十八至三十五岁），月柱${monthGan}${monthZhi}与日柱${chart.sixLines.day.gan}${dayZhi}共主此运。${youthPhase.description}此阶段${youthPhase.isGood ? '水势顺畅，学业事业双丰收，贵人多助，尤其在知识密集型行业表现突出。' : '水虽遇阻，但水性灵活，总能找到出路，此运宜灵活应变。'}青年运中社交运极佳，人际关系为事业助力。`,
      `青年期看月柱${monthGan}${monthZhi}与日柱${chart.sixLines.day.gan}${dayZhi}，${youthPhase.description}此十年是命主积累知识与经验的关键期。${bestElement}为用，青年运若逢${bestElement}之流年，学业事业皆有突破。日支${dayZhi}为夫妻宫，青年晚期的感情运尤为重要。`,
    ],
  }

  // 中年运 (35-55)
  const hourGan = chart.sixLines.hour.gan
  const hourZhi = chart.sixLines.hour.zhi
  const middlePhase = getDaYunPhaseQuality(35, 55)
  const MIDDLE_TEMPLATES: Record<FiveElement, string[]> = {
    '木': [
      `中年运（三十五至五十五岁），日柱${chart.sixLines.day.gan}${dayZhi}与时柱${hourGan}${hourZhi}主事。${middlePhase.description}${dayElement === '木' ? '如中年之树，枝繁叶茂，事业根基已固，正是收获之时。' : '中年时期是人生事业的高峰期，'}${middlePhase.isGood ? '此运喜神当权，事业财运双丰收，贵人运旺，社会地位显著提升。' : '此运需注意身体，避免过度操劳，凡事以稳为主。'}中年运中人际关系极为重要，宜多结善缘。`,
      `步入中年，日柱${chart.sixLines.day.gan}${dayZhi}自身当权，时柱${hourGan}${hourZhi}晚年根基亦在此期萌芽。${middlePhase.description}此阶段${middlePhase.isGood ? '事业达到巅峰，财运亨通，名利双收之象。' : '事业虽有波折，但根基已稳，守成为上，开拓为辅。'}中年时期家庭责任加重，需平衡事业与家庭。`,
    ],
    '火': [
      `中年运（三十五至五十五岁），日柱${chart.sixLines.day.gan}${dayZhi}与时柱${hourGan}${hourZhi}共主。${middlePhase.description}${middlePhase.isGood ? '此运如火之正旺，事业辉煌，社会影响力扩大，名利双收。' : '中年需注意压力管理，火性虽旺但过旺则伤身。'}中年运中健康需特别关注，${dayElement === '火' ? '火旺之人中年宜养心，少熬夜少躁怒。' : '宜适当运动，保持心态平和。'}`,
      `观中年运程，日柱${chart.sixLines.day.gan}${dayZhi}与中运交汇。${middlePhase.description}此阶段事业进入稳定发展期，${middlePhase.isGood ? '中年运势极佳，事业财运同步提升，社会地位稳固。' : '运势虽平淡，但中年经验丰富，可凭智慧化解困难。'}此阶段宜注重家庭与事业的平衡。`,
    ],
    '土': [
      `中年运（三十五至五十五岁），日柱${chart.sixLines.day.gan}${dayZhi}与时柱${hourGan}${hourZhi}主导。${middlePhase.description}${middlePhase.isGood ? '土性厚重，中年根基极为稳固，事业财富稳步积累，是人生最富足的阶段。' : '中年运势平稳，虽无大风大浪，但也需警惕暗流，宜保守经营。'}中年运中贵人运旺，人脉资源是此阶段最大的资产。`,
      `步入中年，日柱${chart.sixLines.day.gan}${dayZhi}与时柱${hourGan}${hourZhi}主事此运。${middlePhase.description}此阶段${bestElement}为用，中年运若行${bestElement}之运，事业财运皆有大突破。中年是人生承上启下的关键阶段，${dayElement === '土' ? '土性稳重，中年运最宜守成，不宜冒进。' : '宜稳中求进，循序渐进。'}`,
    ],
    '金': [
      `中年运（三十五至五十五岁），日柱${chart.sixLines.day.gan}${dayZhi}与时柱${hourGan}${hourZhi}主事。${middlePhase.description}${middlePhase.isGood ? '金性成器，中年事业最为辉煌，权柄在握，财运极佳。' : '中年虽有挑战，但金性之人善于把握机会，困难中亦有大机遇。'}中年运中社交运极旺，人脉助力事业发展。`,
      `观中年运，日柱${chart.sixLines.day.gan}${dayZhi}与中运交汇。${middlePhase.description}此阶段${middlePhase.isGood ? '事业达到高峰，财运充盈，名利兼收。' : '事业进入平稳期，守成为主，适度开拓。'}中年运中健康需注意${dayElement === '金' ? '呼吸系统' : dayElement === '木' ? '肝胆' : dayElement === '水' ? '肾脏' : dayElement === '火' ? '心血管' : '脾胃'}方面。`,
    ],
    '水': [
      `中年运（三十五至五十五岁），日柱${chart.sixLines.day.gan}${dayZhi}与时柱${hourGan}${hourZhi}共主。${middlePhase.description}${middlePhase.isGood ? '水性灵活，中年运顺势而为，事业财运大旺，投资运佳。' : '中年需注意稳健，水性虽灵活但过灵活则不踏实。'}中年运中智慧积累已达巅峰，决策质量极高。`,
      `步入中年，日柱${chart.sixLines.day.gan}${dayZhi}与中运交汇。${middlePhase.description}此阶段${middlePhase.isGood ? '事业财运双双提升，贵人运旺，人脉资源丰富。' : '运势平稳，宜把握现有资源，稳中求进。'}中年时期宜培养接班人或布局晚年事业。`,
    ],
  }

  // 晚年运 (55+)
  const latePhase = getDaYunPhaseQuality(55, 85)
  const hourNaYin = getNaYin(hourGan, hourZhi)
  const LATE_TEMPLATES: Record<FiveElement, string[]> = {
    '木': [
      `晚年运（五十五岁后），时柱${hourGan}${hourZhi}${hourNaYin}主导。${latePhase.description}${latePhase.isGood ? '晚年运喜神护佑，子女孝顺，家庭和睦，生活富足安康。' : '晚年需注意身体健康，宜早做养生规划。'}${dayElement === '木' ? '木主生机，晚年仍有活力，可继续从事力所能及之事。' : '晚年宜以养生为重，享受天伦之乐。'}时柱为子女宫，晚年与子女缘分深厚。`,
      `观晚年运，时柱${hourGan}${hourZhi}${hourNaYin}管此阶段。${latePhase.description}${latePhase.isGood ? '晚年运势顺遂，精神生活丰富，有享清福之象。' : '晚年宜保持乐观心态，多与家人交流。'}此阶段${bestElement}为用，晚年行${bestElement}之地，则福寿绵长。`,
    ],
    '火': [
      `晚年运（五十五岁后），时柱${hourGan}${hourZhi}${hourNaYin}主事。${latePhase.description}${latePhase.isGood ? '晚年如火之余晖，温暖明亮，子女有成，生活安宁。' : '晚年需注意保养，宜清淡饮食，规律作息。'}${dayElement === '火' ? '火性光明，晚年精神矍铄，有长者风范。' : '晚年宜修身养性，回归内心的平静。'}`,
      `步入晚年，时柱${hourGan}${hourZhi}${hourNaYin}主导。${latePhase.description}晚年${latePhase.isGood ? '运势平稳上升，儿孙绕膝，享受人生。' : '虽有挑战，但一生积累之经验智慧足以应对。'}此阶段宜注重精神生活，培养兴趣爱好。`,
    ],
    '土': [
      `晚年运（五十五岁后），时柱${hourGan}${hourZhi}${hourNaYin}主事。${latePhase.description}${latePhase.isGood ? '土性厚重，晚年根基稳固，家业丰足，子女孝顺。' : '晚年需注意消化系统保养，饮食宜规律。'}${dayElement === '土' ? '土主信，晚年德高望重，受人尊敬。' : '晚年宜回归田园，享受自然之乐。'}时柱为晚年宫，晚年生活品质取决于此。`,
      `观晚年运程，时柱${hourGan}${hourZhi}${hourNaYin}为晚年根基。${latePhase.description}${latePhase.isGood ? '晚年安享太平，子孙有出息，家风传承良好。' : '晚年宜居安思危，合理规划财务。'}此阶段宜以养生修身为主，知足常乐。`,
    ],
    '金': [
      `晚年运（五十五岁后），时柱${hourGan}${hourZhi}${hourNaYin}主导。${latePhase.description}${latePhase.isGood ? '金性坚固，晚年家业稳固，物质富足，精神充实。' : '晚年需注意肺部保养，宜适度运动。'}${dayElement === '金' ? '金主义，晚年朋友众多，社交生活丰富。' : '晚年宜保持社交活动，避免孤独。'}时柱管子女宫，晚年子女运势直接影响命主晚年质量。`,
      `步入晚年，时柱${hourGan}${hourZhi}${hourNaYin}为主。${latePhase.description}此阶段${latePhase.isGood ? '运势圆满，福寿双全，可安享晚年。' : '虽有小波折，但金性之人一生积蓄丰厚，晚年无忧。'}晚年宜发挥余热，指导后辈。`,
    ],
    '水': [
      `晚年运（五十五岁后），时柱${hourGan}${hourZhi}${hourNaYin}主导。${latePhase.description}${latePhase.isGood ? '水性灵动，晚年思维依然活跃，精神生活丰富。' : '晚年需注意肾脏保养，宜多饮水，适度运动。'}${dayElement === '水' ? '水主智，晚年智慧更深，有智者之风。' : '晚年宜以养生为先，保持平和心态。'}时柱为子女宫，晚年子女缘深，儿孙孝顺。`,
      `观晚年运，时柱${hourGan}${hourZhi}${hourNaYin}管此阶段。${latePhase.description}${latePhase.isGood ? '晚年运佳，精神饱满，生活富足，有游山玩水之福气。' : '晚年宜保持乐观，多参加社交活动。'}此阶段${bestElement}为用，晚年行${bestElement}之地，则福泽绵长。`,
    ],
  }

  const youthGood = youthPhase.isGood || yearElement === bestElement
  const shaonian = pickBySeed(YOUTH_TEMPLATES[dayElement][youthGood ? 'good' : 'bad'], dayGan + 'youth')
  const qingnian = pickBySeed(YOUTH2_TEMPLATES[dayElement], dayGan + 'youth2')
  const zhongnian = pickBySeed(MIDDLE_TEMPLATES[dayElement], dayGan + 'middle')
  const wannian = pickBySeed(LATE_TEMPLATES[dayElement], dayGan + 'late')

  let content = `综观命主一生运程，四柱各有管辖：`
  content += `\n\n【少年运（一至十八岁）】${shaonian}`
  content += `\n\n【青年运（十八至三十五岁）】${qingnian}`
  content += `\n\n【中年运（三十五至五十五岁）】${zhongnian}`
  content += `\n\n【晚年运（五十五岁后）】${wannian}`

  return { title: '一生命运走势', content }
}

function getElementDirection(element: FiveElement): string {
  const map: Record<FiveElement, string> = {
    '木': '东方', '火': '南方', '土': '中央', '金': '西方', '水': '北方',
  }
  return map[element]
}

// ========== 第四节：人生建议 ==========

function generateSection4(chart: BaZiChart, wangShuai: WangShuaiResult, geJu: any): MasterSummarySection {
  const dayGan = chart.sixLines.day.gan
  const dayElement = chart.dayMaster.dayGanElement
  const bestElement = chart.xiYongShen.bestElement
  const avoidedElements = chart.xiYongShen.avoidedElements || []
  const geJuName = geJu?.name || '普通格局'
  const strengthLabel = getStrengthLabel(wangShuai)

  // 事业方向建议
  const CAREER_ADVICE: Record<string, string[]> = {
    '木': [
      `事业方面，${dayElement}命人适合在东方、东南方发展。宜从事与${bestElement}相关之行业，如教育、文化、医药、农林、设计等。${strengthLabel === '身旺' ? '身旺宜泄，适合创新研发类工作。' : '身弱宜扶，宜在大平台或大企业中稳步发展。'}${geJuName.includes('官') ? '官星入格，仕途有望，可考虑公职管理。' : geJuName.includes('财') ? '财星入格，经商之命，宜走商业路线。' : geJuName.includes('印') ? '印星入格，学术研究之途最佳。' : geJuName.includes('食') || geJuName.includes('伤') ? '食伤入格，宜走技术、艺术、创意之路。' : '事业方向宜灵活选择，以发挥自身特长为主。'}`,
      `事业发展建议：${bestElement}为用神，宜在${getElementDirection(bestElement)}方位或与${bestElement}相关行业发展。${dayElement === '木' ? '木命人天生有向上生长的力量，适合教育、培训、文化传播等行业。' : ''}${strengthLabel === '身旺' ? '命主身旺，精力充沛，适合创业或独立经营。' : '命主身弱，宜依托团队之力，在大机构中循序渐进。'}事业关键期在三十五至五十五岁，宜提前布局。`,
    ],
    '火': [
      `事业方面，${dayElement}命人适合在南方发展，宜从事与${bestElement}相关的行业。${strengthLabel === '身旺' ? '身旺宜泄耗，适合竞争激烈的行业，如科技、传媒、演艺等。' : '身弱宜扶助，适合稳定发展之行业，如教育、医疗、公共服务等。'}${geJuName.includes('官') ? '官星入格，有管理才能，可向领导岗位发展。' : geJuName.includes('财') ? '财星入格，商业嗅觉灵敏，适合投资创业。' : geJuName.includes('印') ? '印星入格，学术研究、文化教育是最佳选择。' : geJuName.includes('食') || geJuName.includes('伤') ? '食伤入格，适合演艺、设计、传媒等创意行业。' : '事业方向宜结合自身兴趣与五行喜用。'}`,
      `事业发展建议：${bestElement}为用神，宜在与${bestElement}相关或位于${getElementDirection(bestElement)}方位之行业发展。${dayElement === '火' ? '火命人热情开朗，适合需要沟通表达的行业。' : ''}${strengthLabel === '身旺' ? '身旺宜积极进取，大胆开拓事业版图。' : '身弱宜步步为营，稳扎稳打。'}宜把握三十五岁前的事业窗口期。`,
    ],
    '土': [
      `事业方面，${dayElement}命人适合在本地或中央方位发展。宜从事与${bestElement}相关的稳定性行业，如房地产、建筑、金融、农业、行政管理等。${strengthLabel === '身旺' ? '身旺宜泄，适合需要耐心和坚持的行业。' : '身弱宜扶，适合在大企业中稳定发展。'}${geJuName.includes('官') ? '官星入格，适合公职管理，仕途平稳。' : geJuName.includes('财') ? '财星入格，善于稳健理财，适合银行业或实业。' : geJuName.includes('印') ? '印星入格，学术行政兼备，适合教育管理。' : geJuName.includes('食') || geJuName.includes('伤') ? '食伤入格，适合科研、设计等技术工作。' : '事业以稳为主，不急功近利。'}`,
      `事业发展建议：${bestElement}为用神，宜在稳定环境中发挥自身优势。${dayElement === '土' ? '土命人踏实可靠，适合需要长期积累的行业。' : ''}${strengthLabel === '身旺' ? '身旺者宜开拓新领域，但需保持稳重本色。' : '身弱者宜守成，在专业领域深耕。'}事业高峰在中年时期，宜提前积累。`,
    ],
    '金': [
      `事业方面，${dayElement}命人适合在西方发展。宜从事与${bestElement}相关之行业，如金融、法律、军警、机械、珠宝、医疗等。${strengthLabel === '身旺' ? '身旺宜泄耗，适合竞争激烈、需要决断力的行业。' : '身弱宜扶助，适合在体制内或大企业中稳步前进。'}${geJuName.includes('官') ? '官星入格，有执法管理之才，适合军政法领域。' : geJuName.includes('财') ? '财星入格，金融理财天赋过人，适合投资银行。' : geJuName.includes('印') ? '印星入格，技术型管理最佳。' : geJuName.includes('食') || geJuName.includes('伤') ? '食伤入格，适合精密设计、技术研发。' : '事业宜发挥金的果断与组织力。'}`,
      `事业发展建议：${bestElement}为用神，宜在${getElementDirection(bestElement)}方位发展。${dayElement === '金' ? '金命人做事果断高效，适合管理、金融等行业。' : ''}${strengthLabel === '身旺' ? '身旺者有魄力，适合创业或高层管理。' : '身弱者宜积累实力，等待时机。'}事业关键期在青年到中年。`,
    ],
    '水': [
      `事业方面，${dayElement}命人适合在北方发展。宜从事与${bestElement}相关之行业，如物流、贸易、咨询、IT、传媒、旅游、学术等。${strengthLabel === '身旺' ? '身旺宜泄耗，适合灵活多变、需要应变力的行业。' : '身弱宜扶助，适合有稳定收入的行业，如教育、医疗等。'}${geJuName.includes('官') ? '官星入格，适合行政管理或外交事务。' : geJuName.includes('财') ? '财星入格，商业头脑灵活，适合贸易、投资。' : geJuName.includes('印') ? '印星入格，学术研究、高等教育最佳。' : geJuName.includes('食') || geJuName.includes('伤') ? '食伤入格，适合创意、传媒、咨询等行业。' : '事业宜灵活应变，把握机遇。'}`,
      `事业发展建议：${bestElement}为用神，宜在与${bestElement}相关或${getElementDirection(bestElement)}方位行业发展。${dayElement === '水' ? '水命人智慧灵活，适合知识密集型行业。' : ''}${strengthLabel === '身旺' ? '身旺者宜积极把握机会，大胆行动。' : '身弱者宜选择稳定平台，厚积薄发。'}事业宜保持灵活性，不拘一格。`,
    ],
  }

  // 婚姻建议
  const MARRIAGE_ADVICE: Record<string, string[]> = {
    '木': [
      `婚姻方面，日支${chart.sixLines.day.zhi}为夫妻宫，${dayElement === '木' ? '木命人感情专一，婚姻稳定。' : '命主感情温和，婚后家庭和睦。'}${strengthLabel === '身旺' ? '身旺者配偶宜${bestElement}命之人，互补为佳。' : '身弱者配偶宜同类或生助之人，方能长久。'}最佳婚配年龄在${dayElement === '木' ? '二十五至三十岁之间' : '二十八至三十二岁之间'}，宜择${getElementDirection(bestElement)}方位之人。婚后宜多沟通，避免冷战。`,
      `婚姻建议：日支${chart.sixLines.day.zhi}为配偶宫位。${chart.sixLines.day.zhi === chart.sixLines.month.zhi ? '日支月支相同，配偶多在同学同乡中寻觅。' : '配偶可能来自远方或不同领域。'}婚姻中${strengthLabel === '身旺' ? '需克制争强好胜之心，多体谅对方。' : '需增强自信，主动经营感情。'}感情宫位宜养不宜冲，家庭为人生之根。`,
    ],
    '火': [
      `婚姻方面，日支${chart.sixLines.day.zhi}为夫妻宫。${dayElement === '火' ? '火命人热情浪漫，感情丰富，但需防激情过后归于平淡的不适。' : '命主感情真挚热烈，婚姻中宜保持热情。'}${strengthLabel === '身旺' ? '身旺者宜找性格柔和之配偶，以水济火，阴阳调和。' : '身弱者宜找同气之配偶，互相扶持。'}婚配年龄宜在${dayElement === '火' ? '二十六至三十一岁' : '二十七至三十三岁'}之间。`,
      `婚姻建议：夫妻宫日支${chart.sixLines.day.zhi}，${chart.sixLines.day.zhi === chart.sixLines.month.zhi ? '配偶多为亲近之人。' : '配偶来自不同环境，需互相适应。'}${strengthLabel === '身旺' ? '婚后需控制脾气，给对方足够空间。' : '婚后需主动表达爱意，增进感情。'}婚姻中最忌冲动行事，三思而后行。`,
    ],
    '土': [
      `婚姻方面，日支${chart.sixLines.day.zhi}为夫妻宫。${dayElement === '土' ? '土命人对感情忠贞不渝，婚姻基础极为稳固。' : '命主感情踏实，婚后生活安稳。'}${strengthLabel === '身旺' ? '身旺者配偶宜灵活之人，互补方能长久。' : '身弱者宜找稳重踏实之人，互相支撑。'}最佳婚配年龄在${dayElement === '土' ? '二十六至三十二岁' : '二十五至三十岁'}之间，宜${getElementDirection(bestElement)}方位之人。`,
      `婚姻建议：日支${chart.sixLines.day.zhi}为配偶宫，${strengthLabel === '身旺' ? '需防过于固执而影响夫妻感情。' : '需增强主动性，多关心配偶。'}土性之人家庭观念重，婚后应以家庭为重。婚姻中宜保持新鲜感，定期营造浪漫。`,
    ],
    '金': [
      `婚姻方面，日支${chart.sixLines.day.zhi}为夫妻宫。${dayElement === '金' ? '金命人对感情重义气，婚姻忠诚。' : '命主感情果断，不拖泥带水。'}${strengthLabel === '身旺' ? '身旺者配偶宜温柔之命，以柔克刚，婚姻和谐。' : '身弱者宜找同气之配偶，互相扶助。'}最佳婚配年龄在${dayElement === '金' ? '二十八至三十四岁' : '二十七至三十二岁'}之间。`,
      `婚姻建议：夫妻宫${chart.sixLines.day.zhi}，${strengthLabel === '身旺' ? '需学会温柔表达，避免过于严厉。' : '需增强果断力，在婚姻中主动担当。'}金性之人婚姻中重承诺，一诺千金。婚后宜注意情绪管理，避免冷战。`,
    ],
    '水': [
      `婚姻方面，日支${chart.sixLines.day.zhi}为夫妻宫。${dayElement === '水' ? '水命人感情细腻，善于体贴，婚姻中浪漫温馨。' : '命主感情深沉内敛，婚后家庭生活和谐。'}${strengthLabel === '身旺' ? '身旺者配偶宜土命之人，土克水，婚姻有约束力。' : '身弱者宜金命配偶，金生水，感情有源。'}最佳婚配年龄在${dayElement === '水' ? '二十七至三十三岁' : '二十六至三十一岁'}之间。`,
      `婚姻建议：日支${chart.sixLines.day.zhi}为配偶宫，${strengthLabel === '身旺' ? '需防感情多变，坚守承诺。' : '需增强自信，在感情中主动表达。'}水命人善解人意，婚后应保持沟通。婚姻中宜互信互敬，忌猜疑。`,
    ],
  }

  // 投资理财建议
  const INVEST_ADVICE: Record<string, string[]> = {
    '木': [
      `投资理财方面，${bestElement}为用神，宜投资与${bestElement}相关的领域。${dayElement === '木' ? '木命人财运如草木生长，需长期培育方能收获。' : '财运需要耐心经营。'}${strengthLabel === '身旺' ? '身旺可承担适度风险，但不宜投机取巧，宜长线投资。' : '身弱宜保守理财，以稳健为主，定期储蓄、购买保本型产品为佳。'}${avoidedElements.length > 0 ? `忌投资与${avoidedElements.join('、')}相关的行业。` : ''}最佳投资方位在${getElementDirection(bestElement)}。`,
    ],
    '火': [
      `投资理财方面，${bestElement}为用神，宜投资与${bestElement}相关的领域。${dayElement === '火' ? '火命人财运来去如火焰，需及时把握，不宜犹豫。' : '财运有周期性波动，需把握节奏。'}${strengthLabel === '身旺' ? '身旺财运活跃，可适当投资高风险高回报项目，但需控制仓位。' : '身弱财运偏弱，宜稳健投资，不宜冒险。'}${avoidedElements.length > 0 ? `忌与${avoidedElements.join('、')}相关之投资。` : ''}财运最佳方位在${getElementDirection(bestElement)}。`,
    ],
    '土': [
      `投资理财方面，${bestElement}为用神，${dayElement === '土' ? '土命人理财稳健，适合房地产、基金等长期投资。' : '财运平稳，宜稳健经营。'}${strengthLabel === '身旺' ? '身旺可适度投资实业，以土之稳固特性获利。' : '身弱宜保守理财，不宜大额投资，以储蓄和稳健型基金为主。'}${avoidedElements.length > 0 ? `忌投${avoidedElements.join('、')}相关领域。` : ''}`,
    ],
    '金': [
      `投资理财方面，${bestElement}为用神，${dayElement === '金' ? '金命人对金钱敏感，理财能力极强，适合金融投资。' : '财运精准，善于把握时机。'}${strengthLabel === '身旺' ? '身旺财运旺盛，可适当大胆投资，但需见好就收。' : '身弱财运偏弱，宜选择保本型投资，不宜投机。'}${avoidedElements.length > 0 ? `忌投${avoidedElements.join('、')}相关领域。` : ''}投资宜果断，犹豫则失良机。`,
    ],
    '水': [
      `投资理财方面，${bestElement}为用神，${dayElement === '水' ? '水命人财运如流水，源源不断但需善于引导。' : '财运灵活多变，需顺势而为。'}${strengthLabel === '身旺' ? '身旺财运佳，可投资多种领域，但需分散风险。' : '身弱财运弱，宜选择低风险投资，不宜贪大。'}${avoidedElements.length > 0 ? `忌投${avoidedElements.join('、')}相关领域。` : ''}投资宜灵活应变，不宜死板。`,
    ],
  }

  // 健康建议
  const HEALTH_ADVICE: Record<FiveElement, string[]> = {
    '木': [
      `健康方面，${dayElement}命人需注意肝胆系统、筋骨关节、眼睛方面的保养。${strengthLabel === '身旺' ? '身旺者木气过盛，易肝气郁结，宜多户外运动，疏肝理气。' : '身弱者木气不足，肝胆功能偏弱，宜早睡早起，养肝护肝。'}春季为${dayElement}之旺季，此季节尤需注意身体。饮食宜绿色蔬菜为主，少饮酒。`,
      `养生建议：${dayElement}命人先天与肝胆、眼睛、筋骨相关。${strengthLabel === '身旺' ? '宜多食绿色蔬果，保持心情舒畅，避免怒气伤肝。' : '宜补肝养血，多吃枸杞、菊花茶等养肝之品。'}运动方面适合散步、太极等柔和运动。`,
    ],
    '火': [
      `健康方面，${dayElement}命人需注意心血管系统、眼睛、小肠方面的保养。${strengthLabel === '身旺' ? '身旺者火气过旺，易心火上炎，宜清心降火，少熬夜少暴躁。' : '身弱者火气不足，心血偏弱，宜养心安神，避免过度劳累。'}夏季为${dayElement}之旺季，此季节尤需防暑降温。饮食宜清淡，多食苦味食物。`,
      `养生建议：${dayElement}命人与心脏、血液循环密切相关。${strengthLabel === '身旺' ? '宜保持心态平和，避免情绪大起大落。' : '宜适当运动，增强心肺功能。'}作息宜规律，少食辛辣，多食红色蔬果。`,
    ],
    '土': [
      `健康方面，${dayElement}命人需注意脾胃消化系统、肌肉方面的保养。${strengthLabel === '身旺' ? '身旺者土气过旺，易消化不良，宜少食油腻，多运动助消化。' : '身弱者土气不足，脾胃虚弱，宜规律饮食，忌生冷。'}每个季节转换之时尤需注意脾胃保养。饮食宜温热为主，定时定量。`,
      `养生建议：${dayElement}命人与消化系统关系最密。${strengthLabel === '身旺' ? '宜控制食量，避免暴饮暴食。' : '宜健脾养胃，多食山药、薏米等。'}运动适合慢跑、登山等中等强度运动。`,
    ],
    '金': [
      `健康方面，${dayElement}命人需注意呼吸系统、肺部、皮肤方面的保养。${strengthLabel === '身旺' ? '身旺者金气过旺，易呼吸系统不适，宜多做有氧运动，增强肺活量。' : '身弱者金气不足，肺功能偏弱，宜润肺养肺，避免干燥环境。'}秋季为${dayElement}之旺季，此季节尤需防燥。饮食宜白色食物为主，如梨、百合等。`,
      `养生建议：${dayElement}命人与肺、大肠、皮肤密切相关。${strengthLabel === '身旺' ? '宜多深呼吸，练习吐纳之功。' : '宜补肺气，多食银耳、雪梨等润肺之品。'}运动适合游泳、跑步等有氧运动。`,
    ],
    '水': [
      `健康方面，${dayElement}命人需注意肾脏、泌尿系统、生殖系统方面的保养。${strengthLabel === '身旺' ? '身旺者水气过旺，易肾气过盛，宜适度运动，不可过度劳累。' : '身弱者水气不足，肾脏功能偏弱，宜养肾固精，早睡早起。'}冬季为${dayElement}之旺季，此季节尤需保暖。饮食宜黑色食物为主，如黑豆、黑芝麻等。`,
      `养生建议：${dayElement}命人与肾、膀胱、骨骼密切相关。${strengthLabel === '身旺' ? '宜保持作息规律，避免房事过度。' : '宜补肾壮骨，多食核桃、黑芝麻等。'}运动适合游泳、太极等柔和运动，忌剧烈运动。`,
    ],
  }

  // 修身建议
  const CULTIVATE_ADVICE: Record<FiveElement, string[]> = {
    '木': [
      `修身方面，${dayElement}主仁，命主应以仁德为本。${strengthLabel === '身旺' ? '身旺者需修炼包容之心，少与人争辩，多听他人意见。' : '身弱者需修炼意志力，遇事莫要退缩，勇往直前。'}可多阅读儒家经典，修养仁德。每日静坐片刻，观照内心，方为修身之本。出行宜向东方，居室宜置绿植，有助于调养${dayElement}气。`,
    ],
    '火': [
      `修身方面，${dayElement}主礼，命主应以礼待人，克制急躁。${strengthLabel === '身旺' ? '身旺者需修炼耐心，遇事三思，不可冲动行事。' : '身弱者需修炼勇气，敢于面对困难，不逃避不退缩。'}可研习佛学或禅修，以静制动。出行宜向南方，居室宜采光充足，有助于振奋${dayElement}气。`,
    ],
    '土': [
      `修身方面，${dayElement}主信，命主应以诚信立身。${strengthLabel === '身旺' ? '身旺者需修炼变通之术，固执己见反为不利。' : '身弱者需修炼自信，多肯定自己，不妄自菲薄。'}可多行善积德，广结善缘。出行宜居中不宜远行，居室宜整洁有序。`,
    ],
    '金': [
      `修身方面，${dayElement}主义，命主应以义为先，重情重义。${strengthLabel === '身旺' ? '身旺者需修炼柔和，刚则易折，学会以柔克刚。' : '身弱者需修炼决断力，遇事果断，不拖泥带水。'}可研习武艺或武术，以强健体魄。出行宜向西方，居室宜简洁明亮。`,
    ],
    '水': [
      `修身方面，${dayElement}主智，命主应以智慧处世。${strengthLabel === '身旺' ? '身旺者需修炼恒心，善变则无成，定力为修身之要。' : '身弱者需修炼魄力，智慧虽足但行动不足，需知行合一。'}可研习道家哲学，上善若水，厚积薄发。出行宜向北方，居室宜有水景或鱼缸。`,
    ],
  }

  const career = pickBySeed(CAREER_ADVICE[dayElement], dayGan + 'career')
  const marriage = pickBySeed(MARRIAGE_ADVICE[dayElement], dayGan + 'marriage')
  const invest = pickBySeed(INVEST_ADVICE[dayElement], dayGan + 'invest')
  const health = pickBySeed(HEALTH_ADVICE[dayElement], dayGan + 'health')
  const cultivate = pickBySeed(CULTIVATE_ADVICE[dayElement], dayGan + 'cultivate')

  let content = `综合命局分析，为命主提出以下人生建议：`
  content += `\n\n【事业方向】${career}`
  content += `\n\n【婚姻建议】${marriage}`
  content += `\n\n【投资理财】${invest}`
  content += `\n\n【健康养生】${health}`
  content += `\n\n【修身养性】${cultivate}`

  content += `\n\n综上所述，命主${dayGan}${dayElement}${strengthLabel}，格局${geJuName}，一生运势${getOverallFortune(wangShuai, geJu)}。善用${bestElement}，规避${avoidedElements.join('、') || '忌神'}，顺势而为，修身积德，则命运可期，福报绵长。`

  return { title: '人生建议', content }
}

function getOverallFortune(wangShuai: WangShuaiResult, geJu: any): string {
  if (geJu?.grade === '上格' && wangShuai.deLing) return '极佳，贵人多助，事业有成'
  if (geJu?.grade === '上格') return '甚佳，格局清纯，前途光明'
  if (geJu?.grade === '中格' && !geJu?.poGe) return '不错，平稳中有上升，一生安康'
  if (geJu?.poGe) return '有波折，但破格亦有补救之法，需配合岁运'
  return '平稳中带有挑战，需自身努力方能成就'
}

// ========== 主函数 ==========

/**
 * 生成大师级命局总论
 * @param chart 八字排盘结果
 * @param wangShuai 旺衰分析结果
 * @param geJu 格局分析结果
 * @param daYun 大运分析结果（可选，传入后可精准分析各阶段运势）
 */
export function generateMasterSummary(
  chart: BaZiChart,
  wangShuai: WangShuaiResult,
  geJu: any,
  daYun?: any,
): MasterSummaryResult {
  const sections: MasterSummarySection[] = [
    generateSection1(chart, wangShuai, geJu),
    generateSection2(chart, wangShuai),
    generateSection3(chart, wangShuai, daYun),
    generateSection4(chart, wangShuai, geJu),
  ]

  const fullText = sections.map(s => `【${s.title}】\n${s.content}`).join('\n\n')

  return { sections, fullText }
}
