/**
 * 八字命理解释层 (Interpretation Layer)
 * 将 Professional Engine 结构化数据转化为自然语言解读
 *
 * 设计原则：
 * - 纯文本生成，不修改 Engine (src/lib/bazi/pro/ 完全不可触碰)
 * - 每段解读附带数据溯源（可追溯到 Engine 原始计算）
 * - 输出结构化的 InterpretationResult
 * - 使用 var、单引号、字符串拼接（服务端风格）
 * - 中文自然语言输出
 * - 所有分析结果 Explainable、Traceable、Verifiable
 *
 * 数据源映射：
 *   Engine Module 1 (Four Pillars)  → dayMaster, dayMasterElement, pillars.day.zhi, fiveElementCount
 *   Engine Module 5 (XiYong)        → strength.strengthLevel, primaryXiShen, primaryYongShen, climateAnalysis
 *   Engine Module 6 (Fortune)       → daYunSteps[], qiYunInfo
 *   Engine Module 2 (ShenSha)       → hits[], auspicious[], inauspicious[]
 *   Engine Module 7 (MasterReport) → overallAssessment, fiveDimensionScores, timeline, risks, opportunities
 */

// ─────────────────────────────────────────────
//  类型定义
// ─────────────────────────────────────────────

/** 解释层章节 */
interface InterpretationSection {
  id: string           // 章节 ID
  title: string        // 章节标题
  content: string      // 自然语言正文
  source: string       // 数据溯源（Engine 模块 + 字段名）
  confidence: number   // 置信度 0-1
}

/** 解释层完整输出 */
interface InterpretationResult {
  sections: InterpretationSection[]
  summary: string          // 总体摘要
  generatedAt: string      // 生成时间
  traceId: string          // 追溯 ID（关联 Engine 计算结果）
}

// ─────────────────────────────────────────────
//  辅助函数
// ─────────────────────────────────────────────

/**
 * 从兼容多种格式的 chartData 中提取字段值
 * Engine 不同模块输出格式可能使用 camelCase 或 snake_case
 */
function getField(chartData: any, camelCase: string, snakeCase: string): any {
  if (chartData == null) return undefined
  if (chartData[camelCase] !== undefined) return chartData[camelCase]
  if (chartData[snakeCase] !== undefined) return chartData[snakeCase]
  return undefined
}

/** 获取日主天干 */
function getDayMaster(chartData: any): string {
  return getField(chartData, 'dayMaster', 'day_master') || '未知'
}

/** 获取日主五行 */
function getDayMasterElement(chartData: any): string {
  return getField(chartData, 'dayMasterElement', 'day_master_element') || '木'
}

/** 获取日支（夫妻宫） */
function getDayBranch(chartData: any): string {
  // 优先从 pillars.day.zhi 获取
  var pillars = getField(chartData, 'pillars', 'pillars')
  if (pillars && pillars.day && pillars.day.zhi) {
    return pillars.day.zhi
  }
  // 兼容扁平结构
  return getField(chartData, 'dayBranch', 'day_branch') || '子'
}

/** 获取日主强弱描述（支持 XiYong 模块的详细等级） */
function getStrength(chartData: any): string {
  // 优先读取 XiYong 模块的 strengthLevel
  var strengthObj = getField(chartData, 'strength', 'strength')
  if (strengthObj && typeof strengthObj === 'object') {
    var level = strengthObj.strengthLevel || strengthObj.level || ''
    if (level) return level
  }
  // 兼容简单字符串
  var val = getField(chartData, 'dayStrength', 'day_strength') || ''
  if (typeof val === 'string') return val
  return '中和'
}

/** 获取大运数据（支持 Fortune 模块格式） */
function getDayunSteps(chartData: any): any[] {
  // 从 fortune 模块的 daYunSteps 获取
  var steps = getField(chartData, 'daYunSteps', 'da_yun_steps')
  if (Array.isArray(steps) && steps.length > 0) return steps

  // 兼容 dayun / dayunData
  var dayun = getField(chartData, 'dayun', 'dayunData')
  if (Array.isArray(dayun) && dayun.length > 0) return dayun

  return []
}

/** 获取缺失五行列表 */
function getLackingElements(chartData: any): any[] {
  var lacking = getField(chartData, 'lackingElements', 'lacking_elements')
  if (Array.isArray(lacking)) return lacking
  return []
}

/** 获取起运年龄 */
function getQiYunStartAge(chartData: any): number {
  var qiYun = getField(chartData, 'qiYunInfo', 'qi_yun_info')
  if (qiYun && typeof qiYun === 'object') {
    return qiYun.startAge || 0
  }
  return 0
}

/** 辅助：判断某大运五行是否为喜用五行 */
function isElementFavorable(userElement: string, stem: string, branch: string): boolean {
  // 我生者为食伤，有利表达和发展
  var generationMap: Record<string, string> = {
    '木': '火',
    '火': '土',
    '水': '木',
    '金': '水',
    '土': '金',
  }
  var favorable = generationMap[userElement]
  if (!favorable) return false
  return stem === favorable || branch === favorable || stem === userElement || branch === userElement
}

// ─────────────────────────────────────────────
//  核心解释函数
// ─────────────────────────────────────────────

/** 生成命局总体分析 */
function interpretChartOverview(chartData: any): InterpretationSection {
  var dayMaster = getDayMaster(chartData)
  var element = getDayMasterElement(chartData)
  var strength = getStrength(chartData)

  // 将 XiYong 的五级强弱映射为四类描述
  var strengthKey = 'neutral'
  if (strength === '极强' || strength === '偏强' || strength === 'strong') {
    strengthKey = 'strong'
  } else if (strength === '极弱' || strength === '偏弱' || strength === 'weak') {
    strengthKey = 'weak'
  } else if (strength === 'balanced') {
    strengthKey = 'balanced'
  }

  var strengthDesc: Record<string, string> = {
    'strong': '身旺，精力充沛，意志坚定，具有较强的影响力',
    'weak': '身弱，需借助外力，宜守不宜攻，适合团队协作',
    'balanced': '阴阳平衡，进退有度，处事稳健',
    'neutral': '中和偏稳，宜顺势而为，不宜冒进',
  }

  var trendDesc = strengthKey === 'strong'
    ? '气势旺盛，适合开拓创新，可积极进取'
    : strengthKey === 'weak'
    ? '偏于柔弱，适合稳健发展，借力而行'
    : '平和稳重，适合循序渐进，稳中求进'

  var content = '您的日主为"' + dayMaster + '"，五行属' + element + '。' +
    strengthDesc[strengthKey] + '。' +
    '命局整体' + trendDesc + '。'

  return {
    id: 'chart_overview',
    title: '命局总论',
    content: content,
    source: 'engine.module1.pillars.dayMaster + module5.xiYong.strength',
    confidence: 0.85,
  }
}

/** 生成性格分析 */
function interpretPersonality(chartData: any): InterpretationSection {
  var dayMaster = getDayMaster(chartData)
  var element = getDayMasterElement(chartData)

  var personalityMap: Record<string, string> = {
    '木': '性格正直善良，富有同情心，有上进心，但有时固执，不善变通。为人直爽，做事有条理，适合从事教育、文化、管理等需要耐心的行业。',
    '火': '性格热情开朗，为人豪爽大方，行动力强，有领导才能。但有时急躁冲动，容易与人发生摩擦。适合从事演艺、传媒、营销等需要活力的行业。',
    '水': '性格聪明灵活，思维敏捷，善于变通，有很强的适应能力。但有时优柔寡断，缺乏恒心。适合从事商业、金融、咨询等需要智慧的行业。',
    '金': '性格刚毅果断，做事雷厉风行，讲究效率，有很强的执行力。但有时过于强硬，缺乏柔韧。适合从事法律、军事、管理等需要魄力的行业。',
    '土': '性格稳重踏实，为人诚实守信，有很强的责任心和耐心。但有时过于保守，缺乏创新。适合从事房地产、农业、建筑等需要稳健的行业。',
  }

  var stemTrait: Record<string, string> = {
    '木': '仁慈宽厚、乐于助人的特质',
    '火': '热情奔放、感染力强的特质',
    '水': '智慧深邃、洞察力强的特质',
    '金': '果断刚毅、追求效率的特质',
    '土': '厚德载物、包容万物的特质',
  }

  var content = (personalityMap[element] || personalityMap['木']) +
    '日主"' + dayMaster + '"更赋予了您' +
    (stemTrait[element] || stemTrait['木']) + '。'

  return {
    id: 'personality',
    title: '性格分析',
    content: content,
    source: 'engine.module1.pillars.dayMasterElement',
    confidence: 0.75,
  }
}

/** 生成事业分析 */
function interpretCareer(chartData: any): InterpretationSection {
  var element = getDayMasterElement(chartData)
  var strength = getStrength(chartData)
  var strengthKey = 'neutral'

  if (strength === '极强' || strength === '偏强' || strength === 'strong') {
    strengthKey = 'strong'
  } else if (strength === '极弱' || strength === '偏弱' || strength === 'weak') {
    strengthKey = 'weak'
  }

  var careerMap: Record<string, string> = {
    '木': '适合从事教育、出版、文化创作、农业、环保、医疗健康等行业。事业发展的黄金期在春季（木旺之时），宜在此时推进重要项目。',
    '火': '适合从事互联网、传媒、演艺、餐饮、能源、电子科技等行业。事业发展的黄金期在夏季（火旺之时），宜在此时把握机遇。',
    '水': '适合从事金融、贸易、物流、咨询、旅游、水产等行业。事业发展的黄金期在冬季（水旺之时），宜在此时拓展人脉。',
    '金': '适合从事法律、金融、科技、制造、审计、军事等行业。事业发展的黄金期在秋季（金旺之时），宜在此时攻坚克难。',
    '土': '适合从事房地产、建筑、农业、矿业、人力资源、行政管理等行业。事业发展的黄金期在季月（土旺之时），宜在此时稳扎稳打。',
  }

  var direction = strengthKey === 'strong' ? '创业或独立发展' : '在大型组织中积累经验'

  var directionMap: Record<string, string> = {
    '木': '东方',
    '火': '南方',
    '水': '北方',
    '金': '西方',
    '土': '本地或中央',
  }

  var content = (careerMap[element] || careerMap['木']) +
    '基于您的命局特点，建议初期以' + direction + '为主。' +
    '事业贵人方位在' + (directionMap[element] || '本地') + '。'

  return {
    id: 'career',
    title: '事业分析',
    content: content,
    source: 'engine.module1.pillars.dayMasterElement + module5.xiYong.strength',
    confidence: 0.7,
  }
}

/** 生成财运分析 */
function interpretWealth(chartData: any): InterpretationSection {
  var element = getDayMasterElement(chartData)
  var strength = getStrength(chartData)
  var strengthKey = 'neutral'

  if (strength === '极强' || strength === '偏强' || strength === 'strong') {
    strengthKey = 'strong'
  } else if (strength === '极弱' || strength === '偏弱' || strength === 'weak') {
    strengthKey = 'weak'
  }

  var wealthElement: Record<string, string> = {
    '木': '土（木克土为财）',
    '火': '金（火克金为财）',
    '水': '火（水克火为财）',
    '金': '木（金克木为财）',
    '土': '水（土克水为财）',
  }

  var wealthTrend = strengthKey === 'strong'
    ? '日主身旺，能担大财，可积极投资理财，财运亨通。'
    : strengthKey === 'weak'
    ? '日主身弱，不宜冒进投资，以稳健理财为主，积少成多。'
    : '日主中和，财运平稳，可适度投资，注意控制风险。'

  var wealthAge: Record<string, string> = {
    '木': '30-45岁',
    '火': '25-40岁',
    '水': '35-50岁',
    '金': '28-43岁',
    '土': '32-47岁',
  }

  var content = '您的正财五行属' + (wealthElement[element] || '土') + '。' +
    wealthTrend +
    '财运旺盛的年龄阶段约在' + (wealthAge[element] || '30-45岁') +
    '，此期间应把握理财机遇。'

  return {
    id: 'wealth',
    title: '财运分析',
    content: content,
    source: 'engine.module1.pillars.dayMasterElement + module5.xiYong.strength',
    confidence: 0.65,
  }
}

/** 生成感情分析 */
function interpretRelationship(chartData: any): InterpretationSection {
  var dayBranch = getDayBranch(chartData)
  var element = getDayMasterElement(chartData)

  var branchEmotion: Record<string, string> = {
    '子': '感情细腻敏感，善于倾听，是好的伴侣人选。',
    '丑': '感情内敛深沉，忠诚可靠，但表达方式较含蓄。',
    '寅': '感情热烈主动，追求浪漫，但有时占有欲较强。',
    '卯': '感情温柔体贴，善解人意，容易获得异性好感。',
    '辰': '感情稳重务实，重视家庭，是居家过日子的类型。',
    '巳': '感情外向活泼，善于交际，但容易三心二意。',
    '午': '感情热烈奔放，热情似火，注重感情体验。',
    '未': '感情温厚包容，善于照顾人，有母性/父性光辉。',
    '申': '感情机智灵活，善于调节气氛，但缺乏安全感。',
    '酉': '感情追求完美，注重品质，对伴侣要求较高。',
    '戌': '感情忠诚专一，重情重义，是值得信赖的伴侣。',
    '亥': '感情浪漫多情，富有想象力，但容易沉溺其中。',
  }

  var elementMatch: Record<string, string> = {
    '木': '您在感情中注重精神交流，适合与水、木五行的人结合。',
    '火': '您在感情中追求激情与被关注，适合与木、火五行的人结合。',
    '水': '您在感情中追求智慧与默契，适合与金、水五行的人结合。',
    '金': '您在感情中追求品质与忠诚，适合与土、金五行的人结合。',
    '土': '您在感情中追求稳定与安全感，适合与火、土五行的人结合。',
  }

  var content = '您的日支（夫妻宫）为"' + dayBranch + '"，' +
    (branchEmotion[dayBranch] || branchEmotion['子']) +
    '整体来看，' + (elementMatch[element] || elementMatch['木'])

  return {
    id: 'relationship',
    title: '感情分析',
    content: content,
    source: 'engine.module1.pillars.day.zhi + module1.pillars.dayMasterElement',
    confidence: 0.6,
  }
}

/** 生成健康建议 */
function interpretHealth(chartData: any): InterpretationSection {
  var element = getDayMasterElement(chartData)
  var weakness = getLackingElements(chartData)

  var healthMap: Record<string, string> = {
    '木': '需注意肝胆系统、筋腱、眼睛等方面的健康。建议多吃绿色蔬菜，保持规律作息，避免过度饮酒。春季是调养肝胆的最佳时期。',
    '火': '需注意心血管系统、小肠、舌头等方面的健康。建议保持心情舒畅，避免过度焦虑，适当进行有氧运动。夏季注意防暑降温。',
    '水': '需注意肾脏、泌尿系统、耳朵等方面的健康。建议多饮水，注意保暖，冬季尤其要注意腰部和下肢的保养。',
    '金': '需注意呼吸系统、大肠、皮肤等方面的健康。建议多进行深呼吸练习，保持空气流通，秋季注意防燥。',
    '土': '需注意脾胃消化系统、肌肉、口唇等方面的健康。建议饮食规律，细嚼慢咽，每季换季时注意脾胃调理。',
  }

  var content = healthMap[element] || healthMap['木']

  if (weakness && weakness.length > 0) {
    var lackingNames: string[] = []
    for (var i = 0; i < weakness.length; i++) {
      var el = weakness[i]
      var name = typeof el === 'string' ? el : (el.element || el.name || '')
      if (name) lackingNames.push(name)
    }
    if (lackingNames.length > 0) {
      content += '命局中' + lackingNames.join('、') + '偏弱，建议通过饮食、运动、作息等方面进行调理平衡。'
    }
  }

  return {
    id: 'health',
    title: '健康趋势',
    content: content,
    source: 'engine.module1.pillars.dayMasterElement + module1.pillars.fiveElementCount',
    confidence: 0.55,
  }
}

/** 生成大运人生阶段分析 */
function interpretLifeStages(chartData: any): InterpretationSection {
  var dayun = getDayunSteps(chartData)
  var element = getDayMasterElement(chartData)

  if (!dayun || dayun.length === 0) {
    return {
      id: 'life_stages',
      title: '人生阶段分析',
      content: '大运数据暂不可用，待完善后可提供更详细的人生阶段分析。',
      source: 'engine.module6.fortune.daYunSteps',
      confidence: 0.3,
    }
  }

  var stageDescriptions: string[] = []

  // 取前 4 个大运周期
  var count = Math.min(4, dayun.length)
  for (var i = 0; i < count; i++) {
    var cycle = dayun[i]
    // 兼容两种格式：
    // Fortune 模块: { ganZhi: { gan, zhi }, startAge, endAge, fortuneScore }
    // 扁平格式: { stem, branch, age, start_age }
    var stem = ''
    var branch = ''
    var age = 0
    var fortuneScore = -1

    if (cycle.ganZhi) {
      stem = cycle.ganZhi.gan || ''
      branch = cycle.ganZhi.zhi || ''
      age = cycle.startAge || 0
      fortuneScore = cycle.fortuneScore != null ? cycle.fortuneScore : -1
    } else {
      stem = cycle.stem || cycle.heavenly_stem || ''
      branch = cycle.branch || cycle.earthly_branch || ''
      age = cycle.age || cycle.start_age || (i * 10 + 10)
    }

    var isGood = isElementFavorable(element, stem, branch)

    // 如果有 fortuneScore，用它来辅助判断
    var scoreHint = ''
    if (fortuneScore >= 0) {
      scoreHint = '（运势评分 ' + fortuneScore + '/100）'
    }

    stageDescriptions.push(
      age + '岁左右（' + stem + branch + '运）' + scoreHint + '：' +
      (isGood ? '运势较佳，是发展事业、积累财富的好时机。' :
               '运势平稳或有挑战，宜保守稳健，积蓄力量。')
    )
  }

  var qiYunAge = getQiYunStartAge(chartData)
  var qiYunHint = qiYunAge > 0
    ? '您约' + qiYunAge + '岁起运。'
    : ''

  var content = qiYunHint +
    '根据大运推演，您人生的主要阶段如下：\n\n' +
    stageDescriptions.join('\n\n') +
    '\n\n总体而言，把握好运周期积极行动，在不利周期做好防守和准备，是趋吉避凶的关键。'

  return {
    id: 'life_stages',
    title: '人生阶段分析',
    content: content,
    source: 'engine.module6.fortune.daYunSteps + module6.fortune.qiYunInfo',
    confidence: 0.7,
  }
}

/** 生成五维评分解读（基于 MasterReport 的 fiveDimensionScores） */
function interpretFiveDimensions(chartData: any): InterpretationSection {
  var scores = getField(chartData, 'fiveDimensionScores', 'five_dimension_scores')
  if (!scores || typeof scores !== 'object') {
    return {
      id: 'five_dimensions',
      title: '五维评分解读',
      content: '五维评分数据暂不可用，待完善后可提供更详细的综合分析。',
      source: 'engine.module7.masterReport.fiveDimensionScores',
      confidence: 0.2,
    }
  }

  var dimensions = [
    { key: 'career', name: '事业', field: 'career' },
    { key: 'wealth', name: '财富', field: 'wealth' },
    { key: 'marriage', name: '婚姻', field: 'marriage' },
    { key: 'health', name: '健康', field: 'health' },
    { key: 'study', name: '学业', field: 'study' },
  ]

  var lines: string[] = []
  var availableCount = 0

  for (var i = 0; i < dimensions.length; i++) {
    var dim = dimensions[i]
    var item = scores[dim.field]
    if (!item || typeof item !== 'object') continue

    var score = item.score || 0
    var level = item.level || ''
    availableCount++

    var levelDesc = ''
    if (score >= 85) {
      levelDesc = '表现优秀，具有明显优势'
    } else if (score >= 70) {
      levelDesc = '表现良好，总体向好'
    } else if (score >= 50) {
      levelDesc = '表现中等，有提升空间'
    } else if (score >= 30) {
      levelDesc = '表现偏弱，需重点关注'
    } else {
      levelDesc = '表现较差，需积极改善'
    }

    lines.push(dim.name + '维度（' + score + '分' + (level ? '，' + level : '') + '）：' + levelDesc + '。')
  }

  if (availableCount === 0) {
    return {
      id: 'five_dimensions',
      title: '五维评分解读',
      content: '五维评分数据暂不可用。',
      source: 'engine.module7.masterReport.fiveDimensionScores',
      confidence: 0.2,
    }
  }

  var overall = scores.overall || 0
  var overallLine = '\n综合评分 ' + overall + '/100，' +
    (overall >= 80 ? '命局整体质量较高。' :
     overall >= 60 ? '命局整体质量良好。' :
     overall >= 40 ? '命局整体质量中等。' :
     '命局整体质量偏弱，需后天努力弥补。')

  return {
    id: 'five_dimensions',
    title: '五维评分解读',
    content: '基于 Professional Engine 的综合分析：\n\n' +
      lines.join('\n\n') + overallLine,
    source: 'engine.module7.masterReport.fiveDimensionScores',
    confidence: 0.75,
  }
}

/** 生成风险提示解读（基于 MasterReport 的 risks） */
function interpretRisks(chartData: any): InterpretationSection {
  var risks = getField(chartData, 'risks', 'risks')
  if (!Array.isArray(risks) || risks.length === 0) {
    return {
      id: 'risks',
      title: '风险提示',
      content: '经分析，您的命局暂无重大风险提示。',
      source: 'engine.module7.masterReport.risks',
      confidence: 0.5,
    }
  }

  var lines: string[] = []

  // 最多展示前 5 个风险
  var count = Math.min(5, risks.length)
  for (var i = 0; i < count; i++) {
    var risk = risks[i]
    var rType = risk.type || '未知风险'
    var rLevel = risk.level || '中'
    var rReason = risk.reason || ''
    var rSuggestion = risk.suggestion || ''

    var levelHint: Record<string, string> = {
      '高': '【高风险】',
      '中': '【中风险】',
      '低': '【低风险】',
      '极低': '【极低风险】',
    }

    var line = (levelHint[rLevel] || '【中风险】') + rType + '：' +
      (rReason || '需注意相关事项') + '。'
    if (rSuggestion) {
      line += '建议：' + rSuggestion + '。'
    }
    lines.push(line)
  }

  return {
    id: 'risks',
    title: '风险提示',
    content: '根据命局综合分析，以下方面需要关注：\n\n' +
      lines.join('\n\n') +
      '\n\n以上提示仅供参考，具体决策请结合实际情况理性判断。',
    source: 'engine.module7.masterReport.risks',
    confidence: 0.65,
  }
}

/** 生成机遇提示解读（基于 MasterReport 的 opportunities） */
function interpretOpportunities(chartData: any): InterpretationSection {
  var opps = getField(chartData, 'opportunities', 'opportunities')
  if (!Array.isArray(opps) || opps.length === 0) {
    return {
      id: 'opportunities',
      title: '机遇展望',
      content: '机遇分析数据暂不可用，待完善后可提供更详细的机遇分析。',
      source: 'engine.module7.masterReport.opportunities',
      confidence: 0.3,
    }
  }

  var lines: string[] = []
  var count = Math.min(5, opps.length)
  for (var i = 0; i < count; i++) {
    var opp = opps[i]
    var oType = opp.type || '未知机会'
    var oTiming = opp.timing || ''
    var oReason = opp.reason || ''

    var line = oType
    if (oTiming) line += '（' + oTiming + '）'
    line += '：' + (oReason || '有望获得良好发展')
    lines.push(line)
  }

  return {
    id: 'opportunities',
    title: '机遇展望',
    content: '根据命局推演，以下机遇值得关注：\n\n' +
      lines.join('\n\n') +
      '\n\n机遇需配合个人努力与环境因素，切勿坐等天机。',
    source: 'engine.module7.masterReport.opportunities',
    confidence: 0.6,
  }
}

/** 生成建议总结（基于 MasterReport 的 recommendations） */
function interpretRecommendations(chartData: any): InterpretationSection {
  var recs = getField(chartData, 'recommendations', 'recommendations')
  if (!Array.isArray(recs) || recs.length === 0) {
    return {
      id: 'recommendations',
      title: '综合建议',
      content: '建议数据暂不可用，待完善后可提供更详细的建议。',
      source: 'engine.module7.masterReport.recommendations',
      confidence: 0.3,
    }
  }

  // 按类别分组
  var grouped: Record<string, string[]> = {}
  for (var i = 0; i < recs.length; i++) {
    var rec = recs[i]
    var cat = rec.category || '其他'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(rec.content || '')
  }

  var lines: string[] = []
  var keys = Object.keys(grouped)
  for (var j = 0; j < keys.length; j++) {
    var category = keys[j]
    lines.push('【' + category + '】' + grouped[category].join('；'))
  }

  return {
    id: 'recommendations',
    title: '综合建议',
    content: '基于命局分析，为您整理以下建议：\n\n' +
      lines.join('\n\n') +
      '\n\n以上建议仅为命理参考，实际决策请结合自身情况。',
    source: 'engine.module7.masterReport.recommendations',
    confidence: 0.6,
  }
}

// ─────────────────────────────────────────────
//  主入口
// ─────────────────────────────────────────────

/**
 * 生成完整的自然语言解读
 *
 * 接收 Engine 输出的结构化数据（支持多种格式）：
 * - ProfessionalFourPillarsResult (Module 1)
 * - XiYongEngineOutput (Module 5)
 * - FortuneEngineOutput (Module 6)
 * - MasterReport (Module 7)
 * - 或以上任意组合的合并数据
 *
 * 返回 InterpretationResult，包含各章节的自然语言解读
 */
function generateInterpretation(chartData: any): InterpretationResult {
  var sections: InterpretationSection[] = []

  // 始终生成的核心章节
  sections.push(interpretChartOverview(chartData))
  sections.push(interpretPersonality(chartData))
  sections.push(interpretCareer(chartData))
  sections.push(interpretWealth(chartData))
  sections.push(interpretRelationship(chartData))
  sections.push(interpretHealth(chartData))
  sections.push(interpretLifeStages(chartData))

  // MasterReport 专属章节（有数据才生成）
  sections.push(interpretFiveDimensions(chartData))
  sections.push(interpretRisks(chartData))
  sections.push(interpretOpportunities(chartData))
  sections.push(interpretRecommendations(chartData))

  // 总体摘要
  var element = getDayMasterElement(chartData)
  var strength = getStrength(chartData)
  var strengthKey = 'neutral'

  if (strength === '极强' || strength === '偏强' || strength === 'strong') {
    strengthKey = 'strong'
  } else if (strength === '极弱' || strength === '偏弱' || strength === 'weak') {
    strengthKey = 'weak'
  }

  var summary = '日主属' + element + '，命局' +
    (strengthKey === 'strong' ? '偏旺，需以泄耗为主，宜动不宜静。' :
     strengthKey === 'weak' ? '偏弱，需以生扶为主，宜静不宜动。' :
     '中和平衡，顺其自然为上策。') +
    '喜用五行以' + element + '相关五行为主，一生发展宜顺势而为。'

  return {
    sections: sections,
    summary: summary,
    generatedAt: new Date().toISOString(),
    traceId: 'interp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
  }
}

// ─────────────────────────────────────────────
//  导出
// ─────────────────────────────────────────────

export { generateInterpretation }
export type { InterpretationResult, InterpretationSection }
