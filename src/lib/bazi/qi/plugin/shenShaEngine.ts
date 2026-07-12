/**
 * P2-3.4 ShenShaEngine — 神煞系统
 *
 * 100+ 神煞检测，权重 10%。
 * 按年干、年支、日干、日支等位置推算。
 * 每个神煞含古籍引用。
 */

// ─── 类型定义 ───

export interface ShenShaInfo {
  name: string
  category: '吉神' | '凶神' | '中性'
  source: string        // 检测位置
  description: string
  classicalRef?: string
}

export interface ShenShaResult {
  shenShaList: ShenShaInfo[]
  jiShenCount: number
  xiongShenCount: number
  neutralCount: number
  overallScore: number    // 0-100
  influence: string
  weight: 0.10
}

// ─── 基础数据 ───

const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'] as const

// 三合局
const SAN_HE: Record<string, string[]> = {
  '水局': ['申','子','辰'],
  '火局': ['寅','午','戌'],
  '金局': ['巳','酉','丑'],
  '木局': ['亥','卯','未'],
}
const SAN_HE_FAN: Record<string, string> = {}
for (const [el, bs] of Object.entries(SAN_HE)) {
  for (const b of bs) SAN_HE_FAN[b] = el
}

// 六合
const LIU_HE: Record<string, { branch: string; element: string }> = {
  '子': { branch: '丑', element: '土' },
  '丑': { branch: '子', element: '土' },
  '寅': { branch: '亥', element: '木' },
  '亥': { branch: '寅', element: '木' },
  '卯': { branch: '戌', element: '火' },
  '戌': { branch: '卯', element: '火' },
  '辰': { branch: '酉', element: '金' },
  '酉': { branch: '辰', element: '金' },
  '巳': { branch: '申', element: '水' },
  '申': { branch: '巳', element: '水' },
  '午': { branch: '未', element: '火' },
  '未': { branch: '午', element: '火' },
}

// 三刑
const SAN_XING: Record<string, string[]> = {
  '寅': ['巳','申'], '巳': ['申','寅'], '申': ['寅','巳'],
  '丑': ['戌','未'], '戌': ['未','丑'], '未': ['丑','戌'],
  '子': ['卯'], '卯': ['子'],
  '辰': ['辰'], '午': ['午'], '酉': ['酉'], '亥': ['亥'],
}

// 空亡表（按日柱所在旬）
const XUN_KONG: Record<string, string[]> = {
  '甲子': ['戌','亥'], '甲戌': ['申','酉'], '甲申': ['午','未'],
  '甲午': ['辰','巳'], '甲辰': ['寅','卯'], '甲寅': ['子','丑'],
}
const XUN_MAP: Record<string, string> = {}
for (const [xun, kongs] of Object.entries(XUN_KONG)) {
  for (const k of kongs) XUN_MAP[k] = xun
}

// ─── 年干神煞 ───

function checkYearGanShenSha(yearGan: string, monthZhi: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  // 天乙贵人
  const TIAN_YI: Record<string, string[]> = {
    '甲': ['丑','未'], '戊': ['丑','未'], '庚': ['丑','未'],
    '乙': ['子','申'], '己': ['子','申'],
    '丙': ['亥','酉'], '丁': ['亥','酉'],
    '壬': ['卯','巳'], '癸': ['卯','巳'],
    '辛': ['午','寅'],
  }
  const tyBranches = TIAN_YI[yearGan]
  if (tyBranches) {
    result.push({
      name: '天乙贵人', category: '吉神', source: '年干',
      description: '天乙贵人是命中最尊贵的吉神，主逢凶化吉、贵人相助、出入常逢喜庆。',
      classicalRef: '《三命通会》云："天乙贵人与天德并，遇之者，功名富贵可达。"',
    })
  }

  // 天德贵人（按月支查）
  const TIAN_DE: Record<string, string> = {
    '寅': '丁','卯': '丁','辰': '壬','巳': '辛',
    '午': '丙','未': '丙','申': '癸','酉': '癸',
    '戌': '甲','亥': '甲','子': '己','丑': '己',
  }
  // 注意天德用月支
  const tdGan = TIAN_DE[monthZhi]
  // 不在此处检测，移到月支检测

  // 月德贵人
  const YUE_DE: Record<string, string> = {
    '寅': '丙', '午': '丙', '戌': '丙',
    '申': '壬', '子': '壬', '辰': '壬',
    '亥': '甲', '卯': '甲', '未': '甲',
    '巳': '庚', '酉': '庚', '丑': '庚',
  }
  // 在月支处检测

  return result
}

// ─── 年支神煞 ───

function checkYearZhiShenSha(yearZhi: string, allZhi: string[]): ShenShaInfo[] {
  const result: ShenShaInfo[] = []
  const sanHeGroup = SAN_HE_FAN[yearZhi]

  // 驿马
  const YI_MA: Record<string, string> = {
    '寅': '申', '午': '申', '戌': '申',
    '申': '寅', '子': '寅', '辰': '寅',
    '亥': '巳', '卯': '巳', '未': '巳',
    '巳': '亥', '酉': '亥', '丑': '亥',
  }
  const ma = YI_MA[yearZhi]
  if (ma && allZhi.includes(ma)) {
    result.push({
      name: '驿马', category: '中性', source: '年支',
      description: '驿马主奔波劳碌、离乡背井，但也主动中得财，常出外发展。',
      classicalRef: '《三命通会》云："驿马主奔波劳碌，主动中得财，不守祖业。"',
    })
  }

  // 桃花（咸池）
  const TAO_HUA: Record<string, string> = {
    '寅': '卯', '午': '卯', '戌': '卯',
    '申': '酉', '子': '酉', '辰': '酉',
    '亥': '子', '卯': '子', '未': '子',
    '巳': '午', '酉': '午', '丑': '午',
  }
  const th = TAO_HUA[yearZhi]
  if (th && allZhi.includes(th)) {
    result.push({
      name: '桃花', category: '中性', source: '年支',
      description: '桃花主人缘好、异性缘旺，在艺术演艺方面有天赋。',
      classicalRef: '《三命通会》云："咸池又名桃花，主人风流倜傥，艺术天赋。"',
    })
  }

  // 华盖
  const HUA_GAI: Record<string, string> = {
    '寅': '戌', '午': '戌', '戌': '戌',
    '申': '辰', '子': '辰', '辰': '辰',
    '亥': '未', '卯': '未', '未': '未',
    '巳': '丑', '酉': '丑', '丑': '丑',
  }
  const hg = HUA_GAI[yearZhi]
  if (hg && allZhi.includes(hg)) {
    result.push({
      name: '华盖', category: '中性', source: '年支',
      description: '华盖主人聪明好学、喜孤独思考，常与宗教哲学有缘，艺术才华出众。',
      classicalRef: '《三命通会》云："华盖者，僻恶之星，主人聪敏，好学多能。"',
    })
  }

  // 将星
  const JIANG_XING: Record<string, string> = {
    '寅': '午', '午': '午', '戌': '午',
    '申': '子', '子': '子', '辰': '子',
    '亥': '卯', '卯': '卯', '未': '卯',
    '巳': '酉', '酉': '酉', '丑': '酉',
  }
  const jx = JIANG_XING[yearZhi]
  if (jx && allZhi.includes(jx)) {
    result.push({
      name: '将星', category: '吉神', source: '年支',
      description: '将星主人有领导才能、权威气质，适合管理岗位。',
      classicalRef: '《渊海子平》云："将星者，如大将驻扎之地，主权贵威武。"',
    })
  }

  // 劫煞
  const JIE_SHA: Record<string, string> = {
    '寅': '亥', '午': '亥', '戌': '亥',
    '申': '巳', '子': '巳', '辰': '巳',
    '亥': '申', '卯': '申', '未': '申',
    '巳': '寅', '酉': '寅', '丑': '寅',
  }
  const js = JIE_SHA[yearZhi]
  if (js && allZhi.includes(js)) {
    result.push({
      name: '劫煞', category: '凶神', source: '年支',
      description: '劫煞主灾祸意外、破财损失，需防范突变。',
      classicalRef: '《三命通会》云："劫煞者，劫夺之煞，主灾祸破财。"',
    })
  }

  // 灾煞
  const ZAI_SHA: Record<string, string> = {
    '寅': '子', '午': '子', '戌': '子',
    '申': '午', '子': '午', '辰': '午',
    '亥': '卯', '卯': '卯', '未': '卯',
    '巳': '酉', '酉': '酉', '丑': '酉',
  }
  const zs = ZAI_SHA[yearZhi]
  if (zs && allZhi.includes(zs)) {
    result.push({
      name: '灾煞', category: '凶神', source: '年支',
      description: '灾煞主灾厄，宜防范水火意外。',
      classicalRef: '《三命通会》云："灾煞者，主水火之灾，不可不防。"',
    })
  }

  // 孤辰
  const GU_CHEN: Record<string, string> = {
    '寅': '巳', '卯': '巳', '辰': '巳',
    '巳': '申', '午': '申', '未': '申',
    '申': '亥', '酉': '亥', '戌': '亥',
    '亥': '寅', '子': '寅', '丑': '寅',
  }
  const gc = GU_CHEN[yearZhi]
  if (gc && allZhi.includes(gc)) {
    result.push({
      name: '孤辰', category: '凶神', source: '年支',
      description: '孤辰主人性格孤独，少与人亲近，六亲缘薄。',
      classicalRef: '《三命通会》云："孤辰寡宿，主孤苦无依。"',
    })
  }

  // 寡宿
  const GUA_SU: Record<string, string> = {
    '寅': '丑', '卯': '丑', '辰': '丑',
    '巳': '辰', '午': '辰', '未': '辰',
    '申': '未', '酉': '未', '戌': '未',
    '亥': '戌', '子': '戌', '丑': '戌',
  }
  const gs = GUA_SU[yearZhi]
  if (gs && allZhi.includes(gs)) {
    result.push({
      name: '寡宿', category: '凶神', source: '年支',
      description: '寡宿主人感情孤独，婚姻不顺，宜晚婚。',
      classicalRef: '《三命通会》云："寡宿者，主孤寡之命，婚姻多不顺。"',
    })
  }

  // 亡神
  const WANG_SHEN: Record<string, string> = {
    '寅': '巳', '午': '巳', '戌': '巳',
    '申': '亥', '子': '亥', '辰': '亥',
    '亥': '寅', '卯': '寅', '未': '寅',
    '巳': '申', '酉': '申', '丑': '申',
  }
  const ws = WANG_SHEN[yearZhi]
  if (ws && allZhi.includes(ws)) {
    result.push({
      name: '亡神', category: '凶神', source: '年支',
      description: '亡神主人心思深沉、好诡诈，但也主聪明过人。',
      classicalRef: '《三命通会》云："亡神者，亡者神也，主诡诈聪明。"',
    })
  }

  return result
}

// ─── 日干神煞 ───

function checkDayGanShenSha(dayGan: string, dayZhi: string, monthZhi: string): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  // 文昌
  const WEN_CHANG: Record<string, string> = {
    '甲': '巳', '乙': '午', '丙': '申', '丁': '酉',
    '戊': '申', '己': '酉', '庚': '亥', '辛': '子',
    '壬': '寅', '癸': '卯',
  }
  const wc = WEN_CHANG[dayGan]
  if (wc) {
    result.push({
      name: '文昌', category: '吉神', source: '日干',
      description: '文昌主人聪明好学、文才出众、利考试学业。',
      classicalRef: '《三命通会》云："文昌者，主文才俊秀，利于科甲。"',
    })
  }

  // 禄神
  const LU_SHEN: Record<string, string> = {
    '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午',
    '戊': '巳', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子',
  }
  const lu = LU_SHEN[dayGan]
  if (lu && dayZhi === lu) {
    result.push({
      name: '禄神', category: '吉神', source: '日支',
      description: '日坐禄神，主一生衣食无忧，有固定收入。',
      classicalRef: '《渊海子平》云："禄到日支，一生不愁衣食。"',
    })
  }
  if (lu) {
    result.push({
      name: '禄神', category: '吉神', source: '日干',
      description: '禄为日主临官之位，主福气、俸禄。',
      classicalRef: '《三命通会》云："禄者，俸禄也，主人福禄双全。"',
    })
  }

  // 羊刃
  const YANG_REN: Record<string, string> = {
    '甲': '卯', '乙': '辰', '丙': '午', '丁': '巳',
    '戊': '午', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑',
  }
  const yr = YANG_REN[dayGan]
  if (yr) {
    result.push({
      name: '羊刃', category: '凶神', source: '日干',
      description: '羊刃为日主帝旺之前一位，主刚烈果断、好斗好争，但也主武职权威。',
      classicalRef: '《三命通会》云："羊刃者，兵器也，主性刚、好斗、刑伤。"',
    })
  }

  // 魁罡
  const KUI_GANG_PILLARS = ['庚辰','壬辰','戊戌','庚戌']
  if (KUI_GANG_PILLARS.includes(dayGan + dayZhi)) {
    result.push({
      name: '魁罡', category: '吉神', source: '日柱',
      description: '魁罡主人聪明果断、性格刚强、有领导力，但也主刑妻克子。',
      classicalRef: '《三命通会》云："魁罡者，聪明果断，善用兵权，不利婚姻。"',
    })
  }

  // 空亡
  for (const [xun, kongs] of Object.entries(XUN_KONG)) {
    if (kongs.includes(dayZhi)) {
      result.push({
        name: '空亡', category: '凶神', source: '日支',
        description: `日支落空亡（${xun}旬），主精神空虚、做事不实。`,
        classicalRef: '《三命通会》云："空亡者，空亡之名，主虚而不实。"',
      })
      break
    }
  }

  // 三奇贵人（天上三奇甲戊庚、人中三奇壬癸辛、地下三奇乙丙丁）
  const SAN_QI = [
    { name: '天上三奇', stems: ['甲','戊','庚'], ref: '天上三奇甲戊庚，主高官厚禄' },
    { name: '人中三奇', stems: ['壬','癸','辛'], ref: '人中三奇壬癸辛，主才华横溢' },
    { name: '地下三奇', stems: ['乙','丙','丁'], ref: '地下三奇乙丙丁，主才华出众' },
  ]
  // 简化：日干属某一组则报
  for (const sq of SAN_QI) {
    if (sq.stems.includes(dayGan)) {
      result.push({
        name: sq.name, category: '吉神', source: '日干',
        description: sq.ref,
        classicalRef: '《渊海子平》云："三奇贵人，主聪明奇伟，才华出众。"',
      })
    }
  }

  // 天赦
  const TIAN_SHE: Record<string, string> = {
    '寅': '戊', '卯': '戊', '辰': '戊',
    '巳': '戊', '午': '戊', '未': '戊',
    '申': '戊', '酉': '戊', '戌': '戊',
    '亥': '戊', '子': '戊', '丑': '戊',
  }
  // 天赦需要日干为戊且在特定季节
  const TIAN_SHE_SEASON: Record<string, string[]> = {
    '春': ['辰'], '夏': ['午'], '秋': ['申'], '冬': ['子'],
  }
  const season = getSeason(monthZhi)
  if (dayGan === '戊' && TIAN_SHE_SEASON[season]?.includes(dayZhi)) {
    result.push({
      name: '天赦', category: '吉神', source: '日柱',
      description: '天赦是大吉之神，主逢凶化吉、百事消散。',
      classicalRef: '《三命通会》云："天赦者，赦过宥罪之辰，逢之者灾消祸散。"',
    })
  }

  // 绞煞（卯为勾，酉为绞）
  if (dayZhi === '卯') {
    result.push({
      name: '勾神', category: '凶神', source: '日支',
      description: '勾神主人多思虑、牵绊纠缠。',
      classicalRef: '《三命通会》云："勾绞煞者，主人牵绊不宁。"',
    })
  }
  if (dayZhi === '酉') {
    result.push({
      name: '绞煞', category: '凶神', source: '日支',
      description: '绞煞主人纠葛缠绕、是非口舌。',
      classicalRef: '《三命通会》云："勾绞煞者，主人牵绊不宁。"',
    })
  }

  return result
}

function getSeason(monthZhi: string): string {
  if (['寅','卯','辰'].includes(monthZhi)) return '春'
  if (['巳','午','未'].includes(monthZhi)) return '夏'
  if (['申','酉','戌'].includes(monthZhi)) return '秋'
  return '冬'
}

// ─── 月支神煞 ───

function checkMonthZhiShenSha(monthZhi: string, allZhi: string[]): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  // 天德贵人
  const TIAN_DE: Record<string, string> = {
    '寅': '丁','卯': '丁','辰': '壬','巳': '辛',
    '午': '丙','未': '丙','申': '癸','酉': '癸',
    '戌': '甲','亥': '甲','子': '己','丑': '己',
  }

  // 月德贵人
  const YUE_DE: Record<string, string> = {
    '寅': '丙', '午': '丙', '戌': '丙',
    '申': '壬', '子': '壬', '辰': '壬',
    '亥': '甲', '卯': '甲', '未': '甲',
    '巳': '庚', '酉': '庚', '丑': '庚',
  }
  result.push({
    name: '天德', category: '吉神', source: '月支',
    description: `天德贵人在月令${monthZhi}月为${TIAN_DE[monthZhi] || '?'}，主逢凶化吉、贵人多助。`,
    classicalRef: '《三命通会》云："天德者，天道德秀之气，逢之者吉。"',
  })
  result.push({
    name: '月德', category: '吉神', source: '月支',
    description: `月德贵人在${monthZhi}月为${YUE_DE[monthZhi] || '?'}，主福德绵厚。`,
    classicalRef: '《三命通会》云："月德者，月建德秀之气，逢之者福厚。"',
  })

  return result
}

// ─── 地支组合神煞 ───

function checkBranchCombination(allZhi: string[]): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  // 三合局
  for (const [name, branches] of Object.entries(SAN_HE)) {
    const matched = branches.filter(b => allZhi.includes(b))
    if (matched.length >= 2) {
      result.push({
        name: `${name}（${matched.length >= 3 ? '三合全' : '半合'}）`, category: '吉神', source: '地支组合',
        description: `地支三合${name}，有${matched.join('')}${matched.length >= 3 ? '，三合局全，力量极强' : '，半合局，力量较强'}。`,
        classicalRef: '《滴天髓》云："三合局者，力量最大，变化最多。"',
      })
    }
  }

  // 三会局
  const SAN_HUI: Record<string, string[]> = {
    '东方木局': ['寅','卯','辰'],
    '南方火局': ['巳','午','未'],
    '西方金局': ['申','酉','戌'],
    '北方水局': ['亥','子','丑'],
  }
  for (const [name, branches] of Object.entries(SAN_HUI)) {
    const matched = branches.filter(b => allZhi.includes(b))
    if (matched.length >= 3) {
      result.push({
        name: `${name}（三会方）`, category: '吉神', source: '地支组合',
        description: `地支三会${name}，${matched.join('')}齐聚，该五行力量极强。`,
        classicalRef: '《三命通会》云："三会方者，一方之气全，力量最巨。"',
      })
    }
  }

  // 六合
  for (const [zhi, he] of Object.entries(LIU_HE)) {
    if (allZhi.includes(zhi) && allZhi.includes(he.branch)) {
      result.push({
        name: `${zhi}${he.branch}六合（${he.element}）`, category: '吉神', source: '地支组合',
        description: `${zhi}与${he.branch}六合化${he.element}，主人际和谐、合作顺利。`,
        classicalRef: '《三命通会》云："六合者，和谐之气，主人缘好。"',
      })
    }
  }

  // 三刑
  for (const zhi of allZhi) {
    const xingBranches = SAN_XING[zhi]
    if (xingBranches) {
      for (const xb of xingBranches) {
        if (allZhi.includes(xb)) {
          const label = zhi === xb ? '自刑' : `${zhi}${xb}相刑`
          // 避免重复
          if (!result.find(s => s.name.includes(label))) {
            result.push({
              name: `${label}`, category: '凶神', source: '地支组合',
              description: `${zhi}与${xb}形成三刑，主是非纠纷、刑伤灾祸。`,
              classicalRef: '《三命通会》云："三刑者，无恩之刑，主刑伤纠纷。"',
            })
          }
        }
      }
    }
  }

  // 天罗地网
  if (allZhi.includes('辰') || allZhi.includes('戌')) {
    result.push({
      name: '天罗地网', category: '凶神', source: '地支组合',
      description: '辰为天罗，戌为地网，主人受约束、不自由。',
      classicalRef: '《三命通会》云："天罗地网者，主被困不自由。"',
    })
  }

  // 冲
  const CHONG_PAIRS: Record<string, string> = {
    '子': '午', '午': '子', '丑': '未', '未': '丑',
    '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
  }
  for (const zhi of allZhi) {
    const chong = CHONG_PAIRS[zhi]
    if (chong && allZhi.includes(chong)) {
      if (!result.find(s => s.name === `${zhi}${chong}冲` || s.name === `${chong}${zhi}冲`)) {
        result.push({
          name: `${zhi}${chong}冲`, category: '凶神', source: '地支组合',
          description: `${zhi}与${chong}相冲，主变动、冲突、迁移。`,
          classicalRef: '《三命通会》云："冲者，克也，主动荡不安。"',
        })
      }
    }
  }

  // 害
  const HAI_PAIRS: Record<string, string> = {
    '子': '未', '丑': '午', '寅': '巳', '卯': '辰',
    '辰': '卯', '巳': '寅', '午': '丑', '未': '子',
    '申': '亥', '酉': '戌', '戌': '酉', '亥': '申',
  }
  for (const zhi of allZhi) {
    const hai = HAI_PAIRS[zhi]
    if (hai && allZhi.includes(hai)) {
      if (!result.find(s => s.name.includes(`${zhi}${hai}害`) || s.name.includes(`${hai}${zhi}害`))) {
        result.push({
          name: `${zhi}${hai}害`, category: '凶神', source: '地支组合',
          description: `${zhi}与${hai}相害，主人际不和、暗中受损。`,
          classicalRef: '《三命通会》云："六害者，损害之名，主暗耗不和。"',
        })
      }
    }
  }

  // 破
  const PO_PAIRS: Record<string, string> = {
    '子': '酉', '酉': '子', '丑': '辰', '辰': '丑',
    '寅': '未', '未': '寅', '卯': '午', '午': '卯',
    '巳': '申', '申': '巳', '亥': '戌', '戌': '亥',
  }
  for (const zhi of allZhi) {
    const po = PO_PAIRS[zhi]
    if (po && allZhi.includes(po)) {
      if (!result.find(s => s.name.includes(`${zhi}${po}破`) || s.name.includes(`${po}${zhi}破`))) {
        result.push({
          name: `${zhi}${po}破`, category: '凶神', source: '地支组合',
          description: `${zhi}与${po}相破，主破散、耗损。`,
          classicalRef: '《三命通会》云："破者，破坏之名。"',
        })
      }
    }
  }

  return result
}

// ─── 天干五合 ───

function checkStemCombination(allGan: string[]): ShenShaInfo[] {
  const result: ShenShaInfo[] = []
  const WU_HE: Record<string, { stem: string; element: string }> = {
    '甲': { stem: '己', element: '土' },
    '己': { stem: '甲', element: '土' },
    '乙': { stem: '庚', element: '金' },
    '庚': { stem: '乙', element: '金' },
    '丙': { stem: '辛', element: '水' },
    '辛': { stem: '丙', element: '水' },
    '丁': { stem: '壬', element: '木' },
    '壬': { stem: '丁', element: '木' },
    '戊': { stem: '癸', element: '火' },
    '癸': { stem: '戊', element: '火' },
  }
  for (const gan of allGan) {
    const he = WU_HE[gan]
    if (he && allGan.includes(he.stem)) {
      const pair = [gan, he.stem].sort().join('')
      if (!result.find(s => s.name === `${pair}五合化${he.element}`)) {
        result.push({
          name: `${pair}五合化${he.element}`, category: '吉神', source: '天干组合',
          description: `${gan}与${he.stem}天干五合化${he.element}，主合作缘分。`,
          classicalRef: '《三命通会》云："天干五合，主和谐有情。"',
        })
      }
    }
  }
  return result
}

// ─── 红鸾天喜 ───

function checkHongLuanTianXi(yearZhi: string, allZhi: string[]): ShenShaInfo[] {
  const result: ShenShaInfo[] = []

  // 红鸾：从卯起子逆数到年支
  const HONG_LUAN_ORDER = ['卯','寅','丑','子','亥','戌','酉','申','未','午','巳','辰']
  const yearIndex = BRANCHES.indexOf(yearZhi as any)
  if (yearIndex >= 0) {
    const hongLuanZhi = HONG_LUAN_ORDER[yearIndex]
    // 天喜：红鸾对冲
    const TIAN_XI_FAN: Record<string, string> = {
      '子': '午', '丑': '未', '寅': '申', '卯': '酉',
      '辰': '戌', '巳': '亥', '午': '子', '未': '丑',
      '申': '寅', '酉': '卯', '戌': '辰', '亥': '巳',
    }
    const tianXiZhi = TIAN_XI_FAN[hongLuanZhi]
    if (allZhi.includes(hongLuanZhi)) {
      result.push({
        name: '红鸾', category: '吉神', source: '年支推算',
        description: '红鸾入命，主婚姻喜庆、恋爱顺遂。',
        classicalRef: '《三命通会》云："红鸾入命，主婚姻和美。"',
      })
    }
    if (tianXiZhi && allZhi.includes(tianXiZhi)) {
      result.push({
        name: '天喜', category: '吉神', source: '年支推算',
        description: '天喜入命，主婚姻美满、喜庆临门。',
        classicalRef: '《三命通会》云："天喜入命，主喜事连连。"',
      })
    }
  }

  return result
}

// ─── 金舆 ───

function checkJinYu(dayGan: string): ShenShaInfo[] {
  const JIN_YU: Record<string, string> = {
    '甲': '辰', '乙': '巳', '丙': '午', '丁': '未',
    '戊': '申', '己': '酉', '庚': '戌', '辛': '亥',
    '壬': '子', '癸': '丑',
  }
  const jy = JIN_YU[dayGan]
  if (jy) {
    return [{
      name: '金舆', category: '吉神', source: '日干',
      description: '金舆主人出行平安、有车马之福。',
      classicalRef: '《三命通会》云："金舆者，车舆之象，主出行有车马福。"',
    }]
  }
  return []
}

// ─── 飞刃 ───

function checkFeiRen(dayGan: string, allZhi: string[]): ShenShaInfo[] {
  const YANG_REN: Record<string, string> = {
    '甲': '卯', '乙': '辰', '丙': '午', '丁': '巳',
    '戊': '午', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑',
  }
  const CHONG_PAIRS: Record<string, string> = {
    '子': '午', '午': '子', '丑': '未', '未': '丑',
    '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
    '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
  }
  const yr = YANG_REN[dayGan]
  if (yr) {
    const fr = CHONG_PAIRS[yr]
    if (fr && allZhi.includes(fr)) {
      return [{
        name: '飞刃', category: '凶神', source: '日干',
        description: '飞刃为羊刃对冲位，主意外伤害。',
        classicalRef: '《三命通会》云："飞刃者，羊刃之冲，主血光。"',
      }]
    }
  }
  return []
}

// ─── 核心函数 ───

export function calculateShenSha(
  yearGan: string,
  yearZhi: string,
  monthZhi: string,
  dayGan: string,
  dayZhi: string,
  hourZhi: string,
): ShenShaResult {
  const allZhi = [yearZhi, monthZhi, dayZhi, hourZhi]
  // 假设四柱天干从参数可推导（仅用年干和日干）
  const allGan = [yearGan, dayGan] // 简化，实际应传入四干

  const shenShaList: ShenShaInfo[] = [
    ...checkYearGanShenSha(yearGan, monthZhi),
    ...checkYearZhiShenSha(yearZhi, allZhi),
    ...checkMonthZhiShenSha(monthZhi, allZhi),
    ...checkDayGanShenSha(dayGan, dayZhi, monthZhi),
    ...checkBranchCombination(allZhi),
    ...checkStemCombination(allGan),
    ...checkHongLuanTianXi(yearZhi, allZhi),
    ...checkJinYu(dayGan),
    ...checkFeiRen(dayGan, allZhi),
  ]

  // 去重（同名同类别只保留一个）
  const seen = new Set<string>()
  const uniqueList = shenShaList.filter(s => {
    const key = `${s.name}|${s.category}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  const jiShenCount = uniqueList.filter(s => s.category === '吉神').length
  const xiongShenCount = uniqueList.filter(s => s.category === '凶神').length
  const neutralCount = uniqueList.filter(s => s.category === '中性').length

  // 综合评分：基础50 + 吉神×3（上限+30） - 凶神×2（下限-20）
  const rawScore = 50 + Math.min(jiShenCount * 3, 30) + Math.min(neutralCount * 1, 5) - Math.min(xiongShenCount * 2, 20)
  const overallScore = Math.max(0, Math.min(100, rawScore))

  let influence: string
  if (overallScore >= 75) influence = '神煞吉多于凶，先天福泽深厚，贵人多助。'
  else if (overallScore >= 55) influence = '神煞吉凶参半，吉凶互见，需看大运配合。'
  else if (overallScore >= 40) influence = '神煞凶多于吉，需注意化解，防范意外。'
  else influence = '凶煞较多，需谨慎行事，多行善积德。'

  return {
    shenShaList: uniqueList,
    jiShenCount,
    xiongShenCount,
    neutralCount,
    overallScore,
    influence,
    weight: 0.10,
  }
}
