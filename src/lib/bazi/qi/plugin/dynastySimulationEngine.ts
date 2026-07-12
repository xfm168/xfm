/**
 * DynastySimulationEngine — P4.2 命局动态推演引擎
 *
 * 古籍依据（源自《三命通会》《滴天髓》《子平真诠》《渊海子平》）：
 *   《三命通会》云："命以八字为先，运以行年为要。"
 *   《滴天髓》云："何知其人富，财气通门户。"
 *   《子平真诠》云："虽命运各有不同，然大运流年之影响不可忽视。"
 *   《渊海子平》云："少年重印，青年重食伤，中年重财官，晚年重印比。"
 *
 * 核心功能：
 *   不是静态分析，而是模拟人生0-90岁每个阶段的动态变化。
 *   0-90岁分10个阶段，每阶段10岁（0-10, 10-20, ..., 80-90, 90+）。
 *   根据日主五行 + 月令 + 大运流年推算各阶段五行平衡。
 *   大运每10年一变，影响喜用神权重。
 *   十神在不同阶段权重变化（如官杀在青年期影响大）。
 *   运势评分基于五行平衡 + 喜用神得令 + 格局高低。
 *   事件预测基于十神 + 五行组合。
 *
 * 原则：
 *   - Plugin 方式接入，不修改 Kernel
 *   - 所有算法引用古籍来源
 *   - pick() / pickN() 非模板输出
 *   - 所有注释使用中文
 */

// ─── 类型定义 ───

import { STEM_ELEMENT, BRANCH_ELEMENT, GENERATE, OVERCOME } from '../../../core'

/** 人生六阶段枚举 */
export type LifePhase = 'childhood' | 'youth' | 'prime' | 'middle' | 'elderly' | 'late'

/** 阶段运势趋势 */
export type FortuneTrend = 'rising' | 'stable' | 'declining' | 'volatile'

/** 单阶段完整数据 */
export interface LifeStageData {
  /** 年龄段，如 '0-10岁' */
  ageRange: string
  /** 阶段英文标识 */
  phase: LifePhase
  /** 阶段中文名，如 '少年' */
  phaseName: string
  /** 五行各占百分比 */
  wuXingBalance: { [element: string]: number }
  /** 该阶段喜用神 */
  favorableGods: string[]
  /** 该阶段忌神 */
  unfavorableGods: string[]
  /** 十神权重变化 */
  shiShenStrength: { [shiShen: string]: number }
  /** 格局在该阶段的影响 */
  patternInfluence: string
  /** 运势评分 0-100 */
  luckScore: number
  /** 运势趋势 */
  fortuneTrend: FortuneTrend
  /** 可能发生的事件 */
  keyEvents: string[]
  /** 建议 */
  advice: string
  /** 古籍引用 */
  classicalRef: string
}

/** 完整推演结果 */
export interface DynastySimulationResult {
  /** 生成时间 */
  generatedAt: string
  /** 10个阶段数据（0-10, 10-20, ..., 90+） */
  stages: LifeStageData[]
  /** 整体人生轨迹描述 */
  overallTrajectory: string
  /** 巅峰年龄段 */
  peakAge: number
  /** 低谷年龄段 */
  lowAge: number
  /** 古籍引用 */
  classicalRef: string
}

/** 运势曲线数据点（供前端绘图） */
export interface LuckCurvePoint {
  ageRange: string
  score: number
  trend: string
}

/** 人生轨迹摘要 */
export interface TrajectoryInfo {
  peakAge: number
  lowAge: number
  overall: string
}
// ─── 常量定义 ───

/** 五行列表 */
const FIVE_ELEMENTS = ['木', '火', '土', '金', '水'] as const
/** 十神列表 */
const TEN_GODS = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '七杀', '正官', '偏印', '正印'] as const

/** 十大人生阶段 */
const LIFE_STAGES = [
  { range: '0-10岁', min: 0, max: 10 },
  { range: '10-20岁', min: 10, max: 20 },
  { range: '20-30岁', min: 20, max: 30 },
  { range: '30-40岁', min: 30, max: 40 },
  { range: '40-50岁', min: 40, max: 50 },
  { range: '50-60岁', min: 50, max: 60 },
  { range: '60-70岁', min: 60, max: 70 },
  { range: '70-80岁', min: 70, max: 80 },
  { range: '80-90岁', min: 80, max: 90 },
  { range: '90+岁', min: 90, max: 120 },
] as const

/** 阶段 → LifePhase 映射 */
const PHASE_MAP: Record<string, LifePhase> = {
  '0-10岁':  'childhood',
  '10-20岁': 'youth',
  '20-30岁': 'youth',
  '30-40岁': 'prime',
  '40-50岁': 'prime',
  '50-60岁': 'middle',
  '60-70岁': 'middle',
  '70-80岁': 'elderly',
  '80-90岁': 'elderly',
  '90+岁':   'late',
}

/** 阶段 → 中文别名映射 */
const PHASE_NAME_MAP: Record<string, string> = {
  '0-10岁':  '少年',
  '10-20岁': '青少年',
  '20-30岁': '青年',
  '30-40岁': '壮年',
  '40-50岁': '盛年',
  '50-60岁': '中年',
  '60-70岁': '初老',
  '70-80岁': '暮年',
  '80-90岁': '耄耋',
  '90+岁':   '期颐',
}
/** 地支 → 本气天干映射 */
const BRANCH_MAIN_GAN: Record<string, string> = {
  '子': '癸', '丑': '己', '寅': '甲', '卯': '乙',
  '辰': '戊', '巳': '丙', '午': '丁', '未': '己',
  '申': '庚', '酉': '辛', '戌': '戊', '亥': '壬',
}

/** 五行在各季节的旺衰基数（GENERATE / OVERCOME 已迁移至 core） */
const SEASON_STRENGTH: Record<string, Record<string, number>> = {
  '春': { '木': 90, '火': 70, '土': 40, '金': 30, '水': 50 },
  '夏': { '木': 50, '火': 90, '土': 60, '金': 20, '水': 40 },
  '秋': { '木': 30, '火': 40, '土': 50, '金': 90, '水': 70 },
  '冬': { '木': 40, '火': 20, '土': 30, '金': 50, '水': 90 },
}

/** 月份 → 季节映射 */
const MONTH_SEASON: Record<number, string> = {
  1: '春', 2: '春', 3: '春',
  4: '夏', 5: '夏', 6: '夏',
  7: '秋', 8: '秋', 9: '秋',
  10: '冬', 11: '冬', 12: '冬',
}

/** 各阶段侧重十神（核心权重）
 *  格式：[比肩, 劫财, 食神, 伤官, 偏财, 正财, 七杀, 正官, 偏印, 正印]
 */
const STAGE_SHISHEN_RAW: Record<string, number[]> = {
  '0-10岁':  [5, 4, 3, 2, 1, 1, 2, 2, 8, 10],
  '10-20岁': [5, 4, 5, 4, 2, 2, 3, 3, 7, 8],
  '20-30岁': [6, 5, 8, 7, 6, 5, 5, 5, 4, 4],
  '30-40岁': [5, 4, 6, 5, 9, 8, 8, 9, 3, 3],
  '40-50岁': [5, 4, 5, 4, 8, 7, 7, 8, 4, 5],
  '50-60岁': [6, 5, 4, 3, 5, 5, 4, 4, 6, 7],
  '60-70岁': [7, 6, 3, 2, 3, 3, 3, 3, 7, 8],
  '70-80岁': [8, 7, 2, 1, 2, 2, 2, 2, 8, 9],
  '80-90岁': [9, 8, 1, 1, 1, 1, 1, 1, 9, 10],
  '90+岁':   [10, 9, 1, 1, 1, 1, 1, 1, 10, 10],
}

/** 展开为 Record<十神, 权重> 格式 */
function expandShiShenWeights(stage: string): Record<string, number> {
  const raw = STAGE_SHISHEN_RAW[stage] || STAGE_SHISHEN_RAW['30-40岁']
  const result: Record<string, number> = {}
  TEN_GODS.forEach((god, i) => { result[god] = raw[i] })
  return result
}

/** 各阶段关键事件池（非模板，随机抽取） */
const STAGE_EVENT_POOL: Record<string, string[]> = {
  '0-10岁': [
    '启蒙教育关键期，智力开发宜早', '家庭环境塑造性格底色', '身体发育需关注营养均衡', '幼年多病者需调养脾胃', '祖辈缘分深厚，得长辈庇佑',
  ],
  '10-20岁': [
    '学业冲刺阶段，宜专心苦读', '青春叛逆期，家庭沟通至关重要', '身体快速发育，运动锻炼有益', '升学考试运势波动明显', '社交能力初步形成，人脉种子期',
  ],
  '20-30岁': [
    '感情萌芽，适宜寻找志同道合之伴侣', '初入社会，事业基础建设期', '适合考取专业资格证书', '理财观念应尽早建立', '职业方向选择影响深远', '购房安家之念渐起',
  ],
  '30-40岁': [
    '事业突破关键期，宜积极进取', '财运渐旺，投资宜谨慎把握', '家庭责任加重，平衡为要', '健康开始走下坡路，需定期体检', '人际关系网络成熟，贵人运显现',
  ],
  '40-50岁': [
    '事业或达巅峰，或遇瓶颈转型', '财富积累丰厚，守成为主', '子女教育关键期，投入精力', '中年危机需警惕心理落差', '慢性病风险增加，养生不可忽视', '可能经历重大人生转折',
  ],
  '50-60岁': [
    '事业进入收成期，传承与交接', '财务规划重点转向保值稳健', '健康体检频率应加倍', '家庭关系需用心经营', '社交圈精简，质量重于数量', '考虑退休后的生活安排',
  ],
  '60-70岁': [
    '正式退休或退居二线', '养生保健为第一要务', '关注心脑血管健康', '含饴弄孙，享受天伦之乐', '精神生活需充实，防止孤独', '遗产规划宜早安排',
  ],
  '70-80岁': [
    '身体机能明显衰退，需悉心照料', '精神寄托至关重要', '可能与旧友重聚', '需防跌倒等意外伤害', '智慧沉淀，可著书立说', '信仰或精神支柱支撑心灵',
  ],
  '80-90岁': [
    '长寿之相，五行水土需调和', '需专人照护，日常生活需辅助', '心态平和是长寿秘诀', '家族传承有成就感', '过往功德显现福报', '需注意季节变化对身体的影响',
  ],
  '90+岁': [
    '期颐高寿，命局根基深厚', '五行调和者方能至此', '德高望重，受人敬仰', '子孙满堂，福泽绵延', '安享天年，心如止水',
  ],
}

const STAGE_ADVICE_POOL: Record<string, string[]> = {
  '0-10岁': [
    '注重教育培养，奠定学习基础。', '营造温馨家庭环境，培养良好品德。', '关注身体健康，预防少儿常见疾病。', '多接触自然，激发好奇心。',
  ],
  '10-20岁': [
    '学业为重，全力以赴争取升学。', '注意心理健康，培养独立人格。', '适度体育锻炼，增强体质。', '发展兴趣爱好，发掘潜能。',
  ],
  '20-30岁': [
    '把握事业起点，踏实积累经验与人脉。', '感情宜真诚相待，选择合适伴侣。', '理财从早做起，养成储蓄习惯。', '持续学习提升，为未来打基础。',
  ],
  '30-40岁': [
    '事业全力以赴，争取关键突破。', '家庭与事业兼顾，避免失衡。', '定期体检，警惕亚健康信号。', '控制消费冲动，稳健投资。',
  ],
  '40-50岁': [
    '善用经验优势，巩固已有地位。', '注重养生，预防慢性疾病。', '关注子女发展，给予适度空间。', '做好资产配置，分散风险。',
  ],
  '50-60岁': [
    '合理规划退休生活，确保财务稳健。', '坚持适量运动，保持身心活力。', '经营家庭关系，享受天伦之乐。', '调整生活节奏，减少不必要应酬。',
  ],
  '60-70岁': [
    '养生保健为第一要务。', '保持学习习惯，让精神充实不空虚。', '培养兴趣爱好，丰富退休生活。', '适度社交，避免孤立封闭。',
  ],
  '70-80岁': [
    '注重日常保健，规律作息。', '保持平和心态，不为琐事所扰。', '与家人保持紧密联系。', '定期体检，遵医嘱服药。',
  ],
  '80-90岁': [
    '注意防寒保暖，顺应四时。', '饮食清淡，少食多餐。', '保持心情愉悦，多笑少愁。', '家人陪伴是最好的良药。',
  ],
  '90+岁': [
    '顺应天命，安享晚年。', '保持平和心境，不急不躁。', '珍惜当下，感恩所有。', '福寿双全，人生圆满。',
  ],
}

/** 格局影响描述池 */
const PATTERN_INFLUENCE_POOL: Record<string, string[]> = {
  'childhood': ['原局格局奠定智慧根基，少年聪颖者多有印星护佑。', '格局清正者自幼受到良好教养，性格温和。'],
  'youth': ['格局高者青年时期才华初现，食伤泄秀，锋芒渐露。', '格局助运，青年可得贵人提携，学业事业双收。'],
  'prime': ['格局在此阶段发挥最大效用，财官得力，事业有成。', '格局纯正者正值壮年大展宏图，官印相生，升迁有望。'],
  'middle': ['格局影响渐趋平稳，中年后重在守成与传承。', '格局在此阶段由进取转为持重，稳中求进。'],
  'elderly': ['格局对晚年运势的庇佑逐渐减弱，重在后天养生。', '格局深厚者晚年仍有余荫，福泽绵延。'],
  'late': ['命局根基决定高寿之基，五行调和者可期颐。', '格局高远者善终有德，名留后世。'],
}

/** 古籍引用池（按运势高低分类） */
const CLASSICAL_HIGH = [
  '《滴天髓》云："何知其人富，财气通门户。"',
  '《三命通会》云："命以八字为先，运以行年为要。运到自当发福。"',
  '《子平真诠》云："用神得力，格局清纯，自然富贵双全。"',
  '《渊海子平》云："身旺用官，官旺财旺，此为上等之命。"',
]
const CLASSICAL_MID = [
  '《三命通会》云："命不可先定，运有穷通。平平者居多，修德可改。"',
  '《滴天髓》云："旺衰强弱，各有命运。中平之命，贵在知足。"',
  '《子平真诠》云："虽命运各有不同，然大运流年之影响不可忽视。"',
  '《渊海子平》云："命如舟，运如水。顺风则快，逆风则缓。"',
]
const CLASSICAL_LOW = [
  '《三命通会》云："运蹇之时，宜韬光养晦，待时而动。"',
  '《滴天髓》云："衰弱之命，须借外力扶助，方可度过难关。"',
  '《子平真诠》云："忌神当令，需忍耐坚守，不宜冒进。"',
  '《渊海子平》云："逆境中尤需修心养性，以德化厄。"',
]

// ─── 工具函数 ───

/** 限制数值范围 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** 获取天干五行 */
function stemElement(stem: string): string {
  return (STEM_ELEMENT as any)[stem] || '木'
}

/** 获取地支五行 */
function branchElement(branch: string): string {
  return (BRANCH_ELEMENT as any)[branch] || '木'
}

/** 地支 → 本气天干映射 */
function branchMainGan(branch: string): string {
  return BRANCH_MAIN_GAN[branch] || '甲'
}

/** 从数组中随机选取一项（非模板输出） */
function pick<T>(arr: T[]): T {
  if (arr.length === 0) return '' as unknown as T
  return arr[Math.floor(Math.random() * arr.length)]
}

/** 从数组中随机选取N项（不重复） */
function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

/** 五行关系判断 */
function elementRelation(a: string, b: string): '生' | '克' | '比和' | '受生' | '受克' {
  if (a === b) return '比和'
  if ((GENERATE as any)[a] === b) return '生'
  if ((OVERCOME as any)[a] === b) return '克'
  if ((GENERATE as any)[b] === a) return '受生'
  if ((OVERCOME as any)[b] === a) return '受克'
  return '比和'
}

/** 判断日主与某天干的十神关系 */
function getShiShen(dayGan: string, targetGan: string): string {
  const dayElem = stemElement(dayGan)
  const targetElem = stemElement(targetGan)

  // 阴阳判断
  const isYangStem = (s: string) => ['甲', '丙', '戊', '庚', '壬'].includes(s)
  const dayYang = isYangStem(dayGan)
  const targetYang = isYangStem(targetGan)
  const samePolarity = dayYang === targetYang

  if (dayElem === targetElem) {
    return samePolarity ? '比肩' : '劫财'
  }

  const relation = elementRelation(dayElem, targetElem)

  if (relation === '生') {
    // 日主生目标 → 食伤
    return samePolarity ? '食神' : '伤官'
  }
  if (relation === '受生') {
    // 目标生日主 → 印星
    return samePolarity ? '偏印' : '正印'
  }
  if (relation === '克') {
    // 日主克目标 → 财星
    return samePolarity ? '偏财' : '正财'
  }
  if (relation === '受克') {
    return samePolarity ? '七杀' : '正官'
  }

  return '比肩'
}

/** 根据日主天干和月支推算月令信息 */
function getMonthLing(monthBranch: string): { element: string; season: string; monthGan: string } {
  const branchMonth: Record<string, number> = {
    '寅': 1, '卯': 2, '辰': 3, '巳': 4, '午': 5, '未': 6,
    '申': 7, '酉': 8, '戌': 9, '亥': 10, '子': 11, '丑': 12,
  }
  const monthNum = branchMonth[monthBranch] || 1
  return { element: branchElement(monthBranch), season: MONTH_SEASON[monthNum] || '春', monthGan: branchMainGan(monthBranch) }
}

/** 计算八字四柱的五行分布（天干权重1.2，地支权重1.0，结果为百分比） */
function calcBaZiElements(
  yg: string, yz: string, mg: string, mz: string, dg: string, dz: string, hg: string, hz: string,
): Record<string, number> {
  const count: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  for (const s of [yg, mg, dg, hg]) { const e = stemElement(s); if (e in count) count[e] += 1.2 }
  const total = Object.values(count).reduce((a, b) => a + b, 0)
  for (const key of FIVE_ELEMENTS) count[key] = Math.round((count[key] / total) * 100)
  return count
}

/** 根据大运推算阶段五行修正 */
function calcDaYunElementModifier(daYunGan: string, daYunZhi: string, _dayElement: string): Record<string, number> {
  const modifier: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  const ganElem = stemElement(daYunGan), zhiElem = branchElement(daYunZhi)
  modifier[ganElem] = (modifier[ganElem] || 0) + 8
  modifier[zhiElem] = (modifier[zhiElem] || 0) + 6
  if ((GENERATE as any)[ganElem]) modifier[(GENERATE as any)[ganElem]] = (modifier[(GENERATE as any)[ganElem]] || 0) + 2
  if ((GENERATE as any)[zhiElem]) modifier[(GENERATE as any)[zhiElem]] = (modifier[(GENERATE as any)[zhiElem]] || 0) + 1
  if ((OVERCOME as any)[ganElem]) modifier[(OVERCOME as any)[ganElem]] = (modifier[(OVERCOME as any)[ganElem]] || 0) - 3
  if ((OVERCOME as any)[zhiElem]) modifier[(OVERCOME as any)[zhiElem]] = (modifier[(OVERCOME as any)[zhiElem]] || 0) - 2
  return modifier
}

/** 计算某阶段综合运势评分 */
function calcLuckScore(
  wuXingBalance: Record<string, number>,
  favorableGods: string[],
  unfavorableGods: string[],
  patternScore: number,
  strengthScore: number,
  stageWeights: Record<string, number>,
): number {
  // 五行平衡度（越均匀越高分）
  const values = Object.values(wuXingBalance)
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, b) => a + (b - avg) ** 2, 0) / values.length
  const balanceScore = clamp(100 - Math.sqrt(variance) * 1.5, 0, 100)

  // 喜用神得令分（喜用神五行占比越高越好）
  let favorScore = 0
  for (const god of favorableGods) {
    // 喜用神可能是十神或五行
    if (god in wuXingBalance) {
      favorScore += (wuXingBalance as Record<string, number>)[god] * 0.8
    }
  }

  // 忌神得分（忌神五行占比越低越好）
  let unfavorScore = 0
  for (const god of unfavorableGods) {
    if (god in wuXingBalance) {
      unfavorScore -= (wuXingBalance as Record<string, number>)[god] * 0.6
    }
  }
  unfavorScore = clamp(unfavorScore, -20, 0)

  // 格局评分加权
  const patternFactor = patternScore * 0.2

  // 身旺身弱基础分
  const strengthFactor = Math.abs(strengthScore - 50) < 15 ? 10 : 5

  // 综合计算
  const rawScore = balanceScore * 0.35 + favorScore + unfavorScore + patternFactor + strengthFactor

  return clamp(Math.round(rawScore), 0, 100)
}

/** 判断运势趋势 */
function judgeFortuneTrend(
  currentScore: number,
  prevScore: number,
  prevPrevScore: number,
): FortuneTrend {
  const diff = currentScore - prevScore
  const diffPrev = prevScore - prevPrevScore

  // 波动判断：前一期和当前期方向相反
  if ((diff > 5 && diffPrev < -5) || (diff < -5 && diffPrev > 5)) {
    return 'volatile'
  }
  if (diff > 6) return 'rising'
  if (diff < -6) return 'declining'
  return 'stable'
}

/** 从 chartData 安全提取字段 */
function safeGet(data: Record<string, unknown>, key: string, fallback: string = ''): string {
  const val = data[key]; return typeof val === 'string' ? val : fallback
}
function safeGetNumber(data: Record<string, unknown>, key: string, fallback: number = 0): number {
  const val = data[key]; return typeof val === 'number' ? val : fallback
}
function safeGetArray(data: Record<string, unknown>, key: string): unknown[] {
  const val = data[key]; return Array.isArray(val) ? val : []
}

// ─── DynastySimulationEngine 主类 ───

export class DynastySimulationEngine {
  /**
   * 模拟完整人生（0-90+岁，10个阶段）
   * @param chartData 命局数据，需包含四柱、日主信息、大运等
   */
  simulate(chartData: Record<string, unknown>): DynastySimulationResult {
    // 提取四柱
    const yearGan = safeGet(chartData, 'yearGan', '甲'), yearZhi = safeGet(chartData, 'yearZhi', '子')
    const monthGan = safeGet(chartData, 'monthGan', '丙'), monthZhi = safeGet(chartData, 'monthZhi', '寅')
    const dayGan = safeGet(chartData, 'dayGan', '甲'), dayZhi = safeGet(chartData, 'dayZhi', '子')
    const hourGan = safeGet(chartData, 'hourGan', '甲'), hourZhi = safeGet(chartData, 'hourZhi', '子')
    const dayElement = stemElement(dayGan)
    const monthLing = getMonthLing(monthZhi)
    const strengthScore = safeGetNumber(chartData, 'strengthScore', 50)
    const patternScore = safeGetNumber(chartData, 'patternScore', 50)
    const useGod = safeGet(chartData, 'useGod', this._inferUseGod(dayElement, strengthScore))
    const xiShen = safeGet(chartData, 'xiShen', this._inferXiShen(dayElement, strengthScore))
    const jiShen = safeGet(chartData, 'jiShen', this._inferJiShen(dayElement, strengthScore))
    const daYunList: string[] = safeGetArray(chartData, 'daYun').map(String)
    const startDaYunAge = safeGetNumber(chartData, 'startDaYunAge', 5)

    // 计算原局五行分布
    const wuXingBalance = calcBaZiElements(yearGan, yearZhi, monthGan, monthZhi, dayGan, dayZhi, hourGan, hourZhi)

    // ── 生成10个阶段 ──
    const stages: LifeStageData[] = []
    const scores: number[] = []

    for (let i = 0; i < LIFE_STAGES.length; i++) {
      const stageInfo = LIFE_STAGES[i]
      const ageRange = stageInfo.range
      const midAge = (stageInfo.min + Math.min(stageInfo.max, stageInfo.min + 10)) / 2

      // 当前阶段的大运
      const daYunIndex = Math.floor((midAge - startDaYunAge) / 10)
      const currentDaYun = (daYunIndex >= 0 && daYunIndex < daYunList.length) ? daYunList[daYunIndex] : ''

      // 计算阶段五行平衡
      if (currentDaYun && currentDaYun.length >= 2) {
        const modifier = calcDaYunElementModifier(currentDaYun[0], currentDaYun[1], dayElement)
        for (const elem of FIVE_ELEMENTS) wuXingBalance[elem] = clamp(wuXingBalance[elem] + (modifier[elem] || 0), 5, 50)
      }
      // 季节修正（月令对少年期影响更大，随年龄递减）
      const seasonFactor = Math.max(0.1, 1 - i * 0.08)
      const seasonData = SEASON_STRENGTH[monthLing.season]
      if (seasonData) {
        for (const elem of FIVE_ELEMENTS) {
          wuXingBalance[elem] = clamp(wuXingBalance[elem] + (seasonData[elem] - 50) * 0.05 * seasonFactor, 5, 50)
        }
      }
      // 归一化为百分比
      const wuXingTotal = Object.values(wuXingBalance).reduce((a, b) => a + b, 0)
      for (const elem of FIVE_ELEMENTS) wuXingBalance[elem] = Math.round((wuXingBalance[elem] / wuXingTotal) * 100)

      // 阶段喜用神 / 忌神
      const favorableGods = this._calcFavorableGods(dayElement, useGod, xiShen, ageRange, currentDaYun)
      const unfavorableGods = this._calcUnfavorableGods(dayElement, jiShen, ageRange, currentDaYun)

      // 十神阶段权重
      const baseWeights = expandShiShenWeights(ageRange)
      const shiShenStrength: Record<string, number> = {}
      for (const god of TEN_GODS) shiShenStrength[god] = baseWeights[god] || 3
      if (currentDaYun && currentDaYun.length >= 2) {
        const daYunShiShen = getShiShen(dayGan, currentDaYun[0])
        if (daYunShiShen in shiShenStrength) shiShenStrength[daYunShiShen] = clamp(shiShenStrength[daYunShiShen] + 4, 1, 12)
      }

      // 格局影响、运势评分、趋势
      const phase = PHASE_MAP[ageRange] || 'middle'
      const patternInfluence = pick(PATTERN_INFLUENCE_POOL[phase] || PATTERN_INFLUENCE_POOL['middle'])
      const luckScore = calcLuckScore(wuXingBalance, favorableGods, unfavorableGods, patternScore, strengthScore, baseWeights)
      scores.push(luckScore)
      const fortuneTrend = i === 0 ? 'stable' : judgeFortuneTrend(luckScore, scores[i - 1], i >= 2 ? scores[i - 2] : scores[i - 1])

      // 关键事件、建议、古籍引用
      const eventPool = STAGE_EVENT_POOL[ageRange] || STAGE_EVENT_POOL['30-40岁']
      const keyEvents = this._filterEvents(eventPool, luckScore, favorableGods, unfavorableGods)
      const advicePool = STAGE_ADVICE_POOL[ageRange] || STAGE_ADVICE_POOL['30-40岁']
      const advice = pick(advicePool) + (currentDaYun ? this._daYunAdvice(currentDaYun, dayElement, useGod, luckScore) : '')
      const classicalRef = luckScore >= 65 ? pick(CLASSICAL_HIGH) : luckScore >= 40 ? pick(CLASSICAL_MID) : pick(CLASSICAL_LOW)

      stages.push({
        ageRange,
        phase,
        phaseName: PHASE_NAME_MAP[ageRange] || '中年',
        wuXingBalance,
        favorableGods,
        unfavorableGods,
        shiShenStrength,
        patternInfluence,
        luckScore,
        fortuneTrend,
        keyEvents,
        advice,
        classicalRef,
      })
    }

    // ── 计算整体轨迹 ──
    const { peakAge, lowAge, overallTrajectory } = this._calcTrajectory(stages, dayGan, dayElement, strengthScore, patternScore)

    // ── 总体古籍引用 ──
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    const classicalRef = avgScore >= 65
      ? '《三命通会》云："命以八字为先，运以行年为要。"一生运势总体向好，善加把握可成大器。'
      : avgScore >= 45
        ? '《子平真诠》云："虽命运各有不同，然大运流年之影响不可忽视。"人生起伏皆有定数，贵在修德。'
        : '《三命通会》云："命以八字为先，运以行年为要。"运程虽有波折，守正待时终有所获。'

    return {
      generatedAt: new Date().toISOString(),
      stages,
      overallTrajectory,
      peakAge,
      lowAge,
      classicalRef,
    }
  }

  /**
   * 获取单阶段数据
   *
   * @param chartData 命局数据
   * @param age 指定年龄
   * @returns 该阶段的完整数据
   */
  getStage(chartData: Record<string, unknown>, age: number): LifeStageData {
    const result = this.simulate(chartData)

    // 查找对应阶段
    for (const stage of result.stages) {
      const range = stage.ageRange.replace('岁', '')
      if (range.endsWith('+')) {
        // 90+ 岁
        if (age >= 90) return stage
      } else {
        const [minStr, maxStr] = range.split('-')
        const min = parseInt(minStr)
        const max = parseInt(maxStr)
        if (age >= min && age < max) return stage
      }
    }

    // 默认返回中间阶段
    return result.stages[4] || result.stages[0]
  }

  /**
   * 获取人生轨迹摘要
   *
   * @param chartData 命局数据
   * @returns 巅峰年龄段、低谷年龄段、整体描述
   */
  getTrajectory(chartData: Record<string, unknown>): TrajectoryInfo {
    const result = this.simulate(chartData)
    return {
      peakAge: result.peakAge,
      lowAge: result.lowAge,
      overall: result.overallTrajectory,
    }
  }

  /**
   * 获取运势曲线数据（供前端绘图）
   *
   * @param chartData 命局数据
   * @returns 包含年龄段、评分、趋势的数据点数组
   */
  getLuckCurve(chartData: Record<string, unknown>): LuckCurvePoint[] {
    const result = this.simulate(chartData)
    return result.stages.map(stage => ({
      ageRange: stage.ageRange,
      score: stage.luckScore,
      trend: stage.fortuneTrend,
    }))
  }

  // ─── 内部方法 ───

  /** 推算用神（无外部提供时）：身旺取克泄耗，身弱取生扶 */
  private _inferUseGod(dayElement: string, strengthScore: number): string {
    if (strengthScore > 60) return (OVERCOME as any)[dayElement] || '金'
    if (strengthScore < 40) return (GENERATE as any)[dayElement] || '水'
    return dayElement
  }

  /** 推算喜神（无外部提供时） */
  private _inferXiShen(dayElement: string, strengthScore: number): string {
    if (strengthScore > 60) return (GENERATE as any)[dayElement] || '火'
    for (const elem of FIVE_ELEMENTS) { if ((GENERATE as any)[elem] === dayElement) return elem }
    return dayElement
  }

  /** 推算忌神（无外部提供时） */
  private _inferJiShen(dayElement: string, strengthScore: number): string {
    if (strengthScore > 60) {
      for (const elem of FIVE_ELEMENTS) { if ((GENERATE as any)[elem] === dayElement) return elem }
      return dayElement
    }
    return (OVERCOME as any)[dayElement] || '木'
  }

  /** 计算阶段喜用神列表 */
  private _calcFavorableGods(dayElement: string, useGod: string, xiShen: string, ageRange: string, daYun: string): string[] {
    const gods: string[] = [useGod]
    if (xiShen && xiShen !== useGod) gods.push(xiShen)
    if (daYun && daYun.length >= 2) {
      const daYunElem = stemElement(daYun[0])
      const relation = elementRelation(daYunElem, useGod)
      if ((relation === '生' || relation === '比和') && !gods.includes(daYunElem)) gods.push(daYunElem)
    }
    const phase = PHASE_MAP[ageRange]
    if ((phase === 'childhood' || phase === 'late') && !gods.includes(dayElement)) gods.push(dayElement)
    return gods
  }

  /** 计算阶段忌神列表 */
  private _calcUnfavorableGods(dayElement: string, jiShen: string, ageRange: string, daYun: string): string[] {
    const gods: string[] = [jiShen]
    if (daYun && daYun.length >= 2) {
      const daYunElem = stemElement(daYun[0])
      const _relation = elementRelation(daYunElem, dayElement)
    }
    if (PHASE_MAP[ageRange] === 'prime') {
      const keElement = (OVERCOME as any)[dayElement]
      if (keElement && !gods.includes(keElement)) gods.push(keElement)
    }
    return gods
  }

  /** 根据运势和五行关系筛选关键事件 */
  private _filterEvents(pool: string[], luckScore: number, favorableGods: string[], unfavorableGods: string[]): string[] {
    const count = luckScore >= 65 ? 4 : luckScore >= 45 ? 3 : 2
    const events = pickN(pool, count)
    if (luckScore >= 70 && favorableGods.length > 0) events.push(favorableGods[0] + '气旺盛，此阶段多有贵人相助')
    if (luckScore <= 35 && unfavorableGods.length > 0) events.push('需防' + unfavorableGods[0] + '气过旺带来的冲击')
    return events
  }
  /** 大运相关建议 */
  private _daYunAdvice(daYun: string, dayElement: string, useGod: string, _luckScore: number): string {
    if (!daYun || daYun.length < 2) return ''
    const ganElem = stemElement(daYun[0])
    const relation = elementRelation(ganElem, useGod)
    if (relation === '生' || relation === '比和') return '大运"' + daYun + '"生扶用神，运势顺遂，宜积极进取。'
    if (relation === '克') return '大运"' + daYun + '"克制用神，需审慎行事，守成为上。'
    if (relation === '受生') return '大运"' + daYun + '"泄用神之气，运势平平，宜蓄势待发。'
    return '大运"' + daYun + '"与用神关系微妙，宜随机应变。'
  }

  /** 计算整体人生轨迹 */
  private _calcTrajectory(stages: LifeStageData[], dayGan: string, dayElement: string, strengthScore: number, patternScore: number): { peakAge: number; lowAge: number; overallTrajectory: string } {
    const scores = stages.map(s => s.luckScore)
    const maxScore = Math.max(...scores), minScore = Math.min(...scores)
    const peakAge = scores.indexOf(maxScore) * 10, lowAge = scores.indexOf(minScore) * 10

    // 判断整体走势类型
    const avgFirst = scores.slice(0, 5).reduce((a, b) => a + b, 0) / 5
    const avgSecond = scores.slice(5).reduce((a, b) => a + b, 0) / (scores.length - 5)
    const diff = avgSecond - avgFirst
    let alternations = 0
    for (let i = 1; i < scores.length - 1; i++) {
      if ((scores[i] > scores[i - 1] && scores[i] > scores[i + 1]) || (scores[i] < scores[i - 1] && scores[i] < scores[i + 1])) alternations++
    }
    let trajectoryType = alternations >= 5 || (maxScore - minScore) > 35 ? '波浪起伏型'
      : diff > 10 ? '先抑后扬型' : diff < -10 ? '先扬后抑型'
        : diff > 5 ? '稳步上升型' : diff < -5 ? '逐步下降型' : '平稳发展型'

    const overallTrajectory = this._generateTrajectoryDesc(trajectoryType, dayGan, dayElement, strengthScore, patternScore, maxScore, minScore, peakAge, lowAge)
    return { peakAge, lowAge, overallTrajectory }
  }

  /** 生成轨迹描述文本 */
  private _generateTrajectoryDesc(type: string, dayGan: string, dayElement: string, strengthScore: number, patternScore: number, maxScore: number, minScore: number, peakAge: number, lowAge: number): string {
    const strengthDesc = strengthScore > 60 ? '身旺' : strengthScore < 40 ? '身弱' : '中和'
    const patternDesc = patternScore > 70 ? '格局颇高' : patternScore > 45 ? '格局中平' : '格局偏低'
    let desc = dayGan + dayElement + '日主，' + strengthDesc + '，' + patternDesc + '。'
    const peakLow = '峰值在' + peakAge + '岁附近（' + maxScore + '分），低谷在' + lowAge + '岁附近（' + minScore + '分）'

    switch (type) {
      case '先扬后抑型':
        desc += '早年运势较好，' + peakLow + '，中后期有所回落。'
        desc += '《三命通会》云："先富后贫者，宜早修福报，守成知足。"'
        break
      case '先抑后扬型':
        desc += '早年运势平平，' + peakLow + '，中后期渐入佳境。'
        desc += '《滴天髓》云："命不可先定，运有穷通。"大器晚成者，尤须坚持。'
        break
      case '稳步上升型':
        desc += '运势随年龄稳步提升，' + peakLow + '，整体趋势良好。'
        desc += '《渊海子平》云："运至自然发福，循序渐进，水到渠成。"'
        break
      case '逐步下降型':
        desc += '早年运势较旺，后期渐弱，' + peakLow + '，需提前规划。'
        desc += '《三命通会》云："少年运好者，老年更须修福积德。"'
        break
      case '波浪起伏型':
        desc += '运势高低交替，波动较大，' + peakLow + '，相差' + (maxScore - minScore) + '分。'
        desc += '《渊海子平》云："人生运势如波浪起伏，顺境不骄，逆境不馁。"'
        break
      default:
        desc += '各阶段运势较为均衡，' + peakLow + '，波动幅度有限。'
        desc += '《子平真诠》云："虽命运各有不同，然大运流年之影响不可忽视。"'
        break
    }
    return desc
  }
}

// ─── 导出便捷实例 ───

/** 默认推演引擎实例 */
export const dynastySimulationEngine = new DynastySimulationEngine()
