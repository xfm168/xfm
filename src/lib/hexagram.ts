// ══════════════════════════════════════════════════
//  Types matching Supabase hexagrams & daily_hexagrams
// ══════════════════════════════════════════════════

export interface Hexagram {
  id: string
  number: number
  name: string
  symbol: string
  upper_trigram: string
  lower_trigram: string
  lines: string[]       // 6 elements: '阳'|'阴', index 0 = 初爻(底)
  description: string
  fortune: string
  career: string
  wealth: string
  love: string
  health: string
  advice_do: string[]
  advice_dont: string[]
  created_at: string
}

export interface DailyHexagram {
  id: string
  visitor_id: string
  date: string          // YYYY-MM-DD
  hexagram_id: string
  hexagram_number: number
  score: number
  career_score: number
  wealth_score: number
  love_score: number
  health_score: number
  lucky_color: string
  lucky_number: number
  analysis: string
  created_at: string
}

export interface DailyHexagramWithDetail extends DailyHexagram {
  hexagram: Hexagram
}

// ══════════════════════════════════════════════════
//  Visitor ID — persisted in localStorage
// ══════════════════════════════════════════════════

const VISITOR_KEY = 'xfm_visitor_id'

export function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(VISITOR_KEY, id)
  }
  return id
}

// ══════════════════════════════════════════════════
//  Deterministic seed hash
//  Same visitor_id + date always → same results
// ══════════════════════════════════════════════════

function hashSeed(input: string): number {
  let h = 2166136261 >>> 0  // FNV-1a 32-bit offset basis
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h
}

// Extract a score in [min, max] from different bit regions of the seed
function scoreFrom(seed: number, shift: number, min: number, max: number): number {
  const range = max - min + 1
  return min + (((seed >>> shift) & 0xffff) % range)
}

const LUCKY_COLORS = [
  '朱砂红', '琉璃蓝', '松石绿', '月白', '赤金',
  '黛紫', '霜白', '墨黑', '藏青', '铜绿',
]

// Mock analysis sentences keyed by hexagram number (1-indexed)
// In Phase 2 this will be replaced by AI-generated content
const MOCK_ANALYSIS: Record<number, string> = {
  1:  '今日乾卦当令，天行健，元气充沛。宜主动出击，开拓新局面，一切尽在掌握之中。',
  2:  '坤卦临身，厚德载物。今日宜低调行事，以柔克刚，默默耕耘终见成效。',
  3:  '屯卦示警，开创初期难免坎坷。今日遇事需冷静应对，寻求援助，守正待机。',
  4:  '蒙卦开蒙，宜虚心求教，积累学识。今日不宜独断，多听多看多思考。',
  5:  '需卦示期，静待时机成熟。今日宜养精蓄锐，机遇就在不远处。',
  6:  '讼卦警示，今日是非纠纷易起，宜以和为贵，退一步海阔天空。',
  7:  '师卦统兵，今日宜团队协作，统筹规划，凝聚力量共同前进。',
  8:  '比卦亲比，广结善缘之日。今日多与人联络，合作机遇处处皆是。',
  9:  '小畜积累，今日收获虽小，坚持下去方见大成，积少成多正当时。',
  10: '履卦警慎，今日如履薄冰，谨慎行事，以礼待人，逢凶化吉。',
  11: '泰卦大吉，天地交泰，万事亨通。今日运势极佳，宜把握良机大展身手。',
  12: '否卦受阻，今日诸事不顺，宜守静待时，蓄积能量，切莫强行突破。',
  13: '同人和谐，志同道合相聚之日。今日广结同仁，合力并进，共创佳绩。',
  14: '大有丰盛，火天高照。今日大展才华，丰收在望，珍惜拥有。',
  15: '谦卦示谦，今日以谦逊之心待人，以德服人，赢得真正的尊重。',
  16: '豫卦欢愉，今日心情舒畅，宜鼓舞他人，传递正能量，众乐乐更美。',
  17: '随卦顺时，今日宜随机应变，顺势而为，灵活调整方向。',
  18: '蛊卦整顿，今日适合除旧布新，解决积累问题，重建良好秩序。',
  19: '临卦临机，机遇来临需把握。今日宜亲力亲为，主动出击，不可错失。',
  20: '观卦审视，今日宜冷静观察，洞悉形势，以观待变，蓄势而动。',
  21: '噬嗑克难，今日遇障碍需果断处理，打通关节，方可一路顺畅。',
  22: '贲卦修饰，今日注重形象气质，内外兼修，以美好仪态赢得好感。',
  23: '剥卦衰退，今日宜守势保守，养精蓄锐，等待时机转变再出发。',
  24: '复卦回归，否极泰来。今日重新出发，积极心态迎接崭新机遇。',
  25: '无妄顺天，今日凡事顺应天道，不妄为，踏实行事自然顺遂。',
  26: '大畜蓄积，今日厚积薄发，继续充实自己，时机成熟方一鸣惊人。',
  27: '颐卦养正，今日宜节制饮食，修身养性，以自力更生之心处世。',
  28: '大过承重，今日肩负重任，需非凡勇气，独当一面展现实力。',
  29: '坎卦险阻，今日重重险阻需坚守信念，以诚信渡过难关，见光明在前。',
  30: '离卦光明，才华光耀四方。今日展现智慧与才华，成为众人焦点。',
  31: '咸卦感应，心意相通之日。今日人际关系和谐，互相共鸣，合作顺畅。',
  32: '恒卦持久，今日坚持就是胜利，恒心恒力，日积月累终见大成。',
  33: '遁卦退隐，今日以退为进，韬光养晦，远离是非，静待时机。',
  34: '大壮雄强，今日势如破竹，凭借实力大展宏图，乘胜追击。',
  35: '晋卦晋升，今日步步高升，名利双收，前途无量，积极把握机遇。',
  36: '明夷韬光，今日处境不利，宜低调蛰伏，保存实力，等待光明。',
  37: '家人和睦，今日以家庭和团队为重，各司其职，和谐共处。',
  38: '睽卦异见，今日宜求同存异，包容不同观点，在差异中寻求和谐。',
  39: '蹇卦阻难，今日举步维艰，宜寻求贵人相助，借力化解困境。',
  40: '解卦解困，今日困境逐步解除，豁然开朗，把握复苏机遇大步前进。',
  41: '损卦减损，今日宜精简节约，删除不必要消耗，以少胜多。',
  42: '益卦增益，今日上下协力，各方支持，事业财运同步增长。',
  43: '夬卦决断，今日宜果断决策，斩断纠葛，正当竞争，除去障碍。',
  44: '姤卦邂逅，今日不期而遇，宜谨慎辨别，珍惜良缘，防止陷阱。',
  45: '萃卦汇聚，今日人才资源汇聚，团结合力，共同创造辉煌成果。',
  46: '升卦上升，今日循序渐进，稳步上升，每一步积累都是向上的力量。',
  47: '困卦磨砺，今日处困境，坚守信念与诚信，终必脱困见光明。',
  48: '井卦涌泉，今日以专业与知识滋养他人，源源不断创造价值。',
  49: '革卦变革，今日大胆革新，突破旧模式，创新引领，焕然一新。',
  50: '鼎卦调和，今日广纳贤才，调和各方，均衡发展，鼎力合作。',
  51: '震卦雷动，今日变化突如其来，宜冷静应对，危中见机，展现从容。',
  52: '艮卦静止，今日宜静心思考，放慢脚步，内观修炼，知足常乐。',
  53: '渐卦渐进，今日循序渐进，脚踏实地，一步一个脚印，稳步成长。',
  54: '归妹顺从，今日宜守本分，明确关系，循规蹈矩，不贪非份之财。',
  55: '丰卦鼎盛，今日如日中天，收获丰盛，珍惜鼎盛时期，趁势扩大。',
  56: '旅卦羁旅，今日宜谨慎低调，以礼待人，适应环境，防止摩擦。',
  57: '巽卦顺风，今日以柔和渐进方式推进，润物无声，效果深远。',
  58: '兑卦喜悦，今日充满欢乐，善用沟通与笑容，感染他人，广结善缘。',
  59: '涣卦散布，今日打破壁垒，扩大影响，化解隔阂，广泛传播正能量。',
  60: '节卦节制，今日凡事适可而止，节制有度，恰到好处，中庸之道。',
  61: '中孚诚信，今日以真诚立身，信守承诺，以诚感化他人，财运亨通。',
  62: '小过谨慎，今日宜从小事做起，积少成多，谨慎行事，防微杜渐。',
  63: '既济守成，今日已有成就，宜守成为主，防止骄傲大意，持续经营。',
  64: '未济进行，今日事业仍在进行中，宜谨慎推进，保持耐心，坚持到底。',
}

// ══════════════════════════════════════════════════
//  Main generator — pure function, no side effects
// ══════════════════════════════════════════════════

export interface GeneratedDaily {
  hexagram_number: number
  score: number
  career_score: number
  wealth_score: number
  love_score: number
  health_score: number
  lucky_color: string
  lucky_number: number
  analysis: string
}

export function generateDailyValues(visitorId: string, date: string): GeneratedDaily {
  const seed = hashSeed(visitorId + '|' + date)

  const hexagram_number = (seed % 64) + 1
  const score          = scoreFrom(seed,  0, 68, 98)
  const career_score   = scoreFrom(seed,  4, 60, 99)
  const wealth_score   = scoreFrom(seed,  8, 60, 99)
  const love_score     = scoreFrom(seed, 12, 60, 99)
  const health_score   = scoreFrom(seed, 16, 60, 99)
  const lucky_number   = (seed % 9) + 1
  const lucky_color    = LUCKY_COLORS[(seed >>> 20) % LUCKY_COLORS.length]
  const analysis       = MOCK_ANALYSIS[hexagram_number] ?? '今日卦象神秘，宜静心感悟，顺其自然。'

  return {
    hexagram_number,
    score,
    career_score,
    wealth_score,
    love_score,
    health_score,
    lucky_color,
    lucky_number,
    analysis,
  }
}

// Today's date string YYYY-MM-DD in local time
export function todayString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
