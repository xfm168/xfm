import type {
  SixLines, HeavenlyStem, EarthlyBranch,
  FiveElement, ShenShi, BaZiChart
} from './types'
import type { WangShuaiResult } from './types'
import type { GeJuResult } from './geju'
import type { ShenShiAnalysisResult } from './shishenAnalysis'
import type { FiveElementPowerResult } from './fiveElementPower'
import type { ShenShaCategory } from './shensha'
import type { MarriageAnalysisResult } from './marriageAnalysis'
import type { CareerAnalysisResult } from './careerAnalysis'
import type { WealthAnalysisResult } from './wealthAnalysis'
import type { HealthAnalysisResult } from './healthAnalysis'
import type { FengShuiAnalysisResult } from './fengshuiAnalysis'
import type { DaYunAnalysisResult } from './dayunAnalysis'
import type { LiuNianAnalysisResult, LiuNianYear } from './liunianAnalysis'
import type { LiuYueAnalysisResult } from './liuyueAnalysis'

export interface ReportChapter {
  id: string
  title: string
  content: string
}

export interface FullReportResult {
  title: string
  subtitle: string
  chapters: ReportChapter[]
  wordCount: number
}

export interface FullReportInput {
  chart: BaZiChart
  sixLines: SixLines
  dayMaster: { dayGan: HeavenlyStem; dayGanElement: FiveElement; wangShuai: string; strengthScore: number }
  geJu: GeJuResult
  wangShuai: WangShuaiResult
  shenShiAnalysis: ShenShiAnalysisResult
  fiveElementPower: FiveElementPowerResult
  shenSha: ShenShaCategory[]
  xiYongShen: {
    bestElement: FiveElement
    avoidedElements: FiveElement[]
    idleElements: FiveElement[]
    enemyElements: FiveElement[]
    derivationSteps?: { step: string; result: string; reason: string }[]
  }
  marriage: MarriageAnalysisResult
  career: CareerAnalysisResult
  wealth: WealthAnalysisResult
  health: HealthAnalysisResult
  fengshui: FengShuiAnalysisResult
  daYun: DaYunAnalysisResult
  liuNian: LiuNianAnalysisResult
  liuYue: LiuYueAnalysisResult
}

function generateChapter1_overview(input: FullReportInput): string {
  const { chart, dayMaster, sixLines } = input
  const lines = [
    `## 一、命局概况`,
    ``,
    `命主生于${sixLines.year.gan}${sixLines.year.zhi}年、${sixLines.month.gan}${sixLines.month.zhi}月、${sixLines.day.gan}${sixLines.day.zhi}日、${sixLines.hour.gan}${sixLines.hour.zhi}时。`,
    ``,
    `日主为${dayMaster.dayGan}，五行属${dayMaster.dayGanElement}。${dayMaster.dayGanElement}主仁、主礼、主信、主义、主智，${getElementPersonality(dayMaster.dayGanElement)}。`,
    ``,
    `四柱纳音：`,
    `- 年柱${sixLines.year.naYin}`,
    `- 月柱${sixLines.month.naYin}`,
    `- 日柱${sixLines.day.naYin}`,
    `- 时柱${sixLines.hour.naYin}`,
    ``,
    `此命局天干地支组合独特，蕴含着丰富的人生信息。下面将从旺衰、格局、十神、神煞、喜用神等多个维度进行深入剖析。`,
  ]
  return lines.join('\n')
}

function generateChapter2_wangshuai(input: FullReportInput): string {
  const { wangShuai, dayMaster, fiveElementPower } = input
  const lines = [
    `## 二、旺衰分析`,
    ``,
    `日主${dayMaster.dayGan}（${dayMaster.dayGanElement}）的旺衰状态为：**${dayMaster.wangShuai}**。`,
    ``,
    `旺衰力量评分：**${dayMaster.strengthScore}分**。`,
    ``,
    `**综合旺衰**：${fiveElementPower.wangShuaiLevel}。`,
    ``,
    `**得令分析**：${wangShuai.deLing ? '得令' : '不得令'}（${fiveElementPower.deLingScore}分）。${fiveElementPower.deLingReason}。`,
    ``,
    `**得地分析**：${wangShuai.deDi ? '得地' : '不得地'}（${fiveElementPower.deDiScore}分）。${fiveElementPower.deDiReason}。`,
    ``,
    `**得势分析**：${wangShuai.deShi ? '得势' : '不得势'}（${fiveElementPower.deShiScore}分）。${fiveElementPower.deShiReason}。`,
    ``,
    `**通根分析**：${wangShuai.tongGen ? '有根' : '无根'}。`,
    `**透干分析**：${fiveElementPower.touGan ? '日主透干' : '日主不透'}。${fiveElementPower.touGanReason}`,
    `**生扶力量**：${fiveElementPower.shengFuPower}分。${fiveElementPower.shengFuReason}`,
    `**克泄耗力量**：${fiveElementPower.keXiePower}分。${fiveElementPower.keXieReason}`,
    ` `,
  ]

  // 十二长生状态
  const csStates = fiveElementPower.changShengStates
  if (csStates && Object.keys(csStates).length > 0) {
    lines.push(`**十二长生状态**（参考，不单独决定旺衰）：`)
    lines.push(``)
    lines.push(`| 地支 | 长生状态 | 说明 |`)
    lines.push(`|:---:|:---:|:---|`)
    const pillarNames: Record<string, string> = {
      [input.sixLines.year.zhi]: '年支',
      [input.sixLines.month.zhi]: '月支',
      [input.sixLines.day.zhi]: '日支',
      [input.sixLines.hour.zhi]: '时支',
    }
    for (const [zhi, info] of Object.entries(csStates)) {
      const name = pillarNames[zhi] || zhi
      lines.push(`| ${name}（${zhi}） | ${info.state} | ${info.description} |`)
    }
    lines.push(``)
  }

  // 地支合局
  if (fiveElementPower.heJu && fiveElementPower.heJu.length > 0) {
    lines.push(`**地支合局**：${fiveElementPower.heJu.join('、')}。合局增强了对应五行力量，对命局有重要影响。`)
    lines.push(``)
  }

  // 五行力量分布
  lines.push(`**五行力量分布**：`)
  lines.push(``)
  lines.push(`| 五行 | 力量 | 占比 | 旺衰 |`)
  lines.push(`|:---:|:---:|:---:|:---:|`)
  for (const el of fiveElementPower.elements) {
    lines.push(`| ${el.element} | ${el.total} | ${el.percentage}% | ${el.wangShuai} |`)
  }
  lines.push(``)

  lines.push(`综合判断：日主${dayMaster.wangShuai === '旺' || dayMaster.wangShuai === '强' ? '身旺，能担财官，适合开拓进取' : dayMaster.wangShuai === '弱' || dayMaster.wangShuai === '衰' ? '身弱，宜稳扎稳打，借助外力' : '中和，平衡发展，顺势而为'}。`)
  return lines.join('\n')
}

function generateChapter3_geju(input: FullReportInput): string {
  const { geJu } = input
  const lines = [
    `## 三、格局分析`,
    ``,
    `命局格局：**${geJu.name}**。`,
    ``,
    `${geJu.description}`,
    ``,
    `**成格依据**：`,
    ``,
  ]

  // 详细解释成格原因
  if (geJu.reasons && geJu.reasons.length > 0) {
    for (const reason of geJu.reasons) {
      lines.push(`- ${reason}`)
    }
    lines.push(``)
  }

  lines.push(`**破格分析**：${geJu.poGe ? geJu.poGeReason : '无破格因素，格局清纯。'}`)
  lines.push(``)

  // 层次判断依据
  let gradeReason = ''
  if (geJu.grade === '上格') {
    gradeReason = '格局清纯，官星/财星/印星透干得令，配合有情，无破格因素，故属上格。'
  } else if (geJu.grade === '中格') {
    gradeReason = '格局基本成立，但略有瑕疵（如力量稍弱、配合不够完美），故属中格。'
  } else if (geJu.grade === '下格') {
    gradeReason = '格局力量薄弱，或配合不佳，或存在轻微破格，故属下格。'
  } else if (geJu.grade === '败格') {
    gradeReason = '格局被严重破格（如伤官见官、官杀混杂、枭神夺食等），格局难成，故属败格。'
  }
  lines.push(`**格局层次**：${geJu.grade}。${gradeReason}`)
  lines.push(``)

  // 格局细项评分
  if (typeof geJu.pureScore === 'number') {
    lines.push(`**格局细项评分**：`)
    lines.push(``)
    lines.push(`| 项目 | 评分 |`)
    lines.push(`|:---:|:---:|`)
    lines.push(`| 清纯度 | ${geJu.pureScore}分 |`)
    if (typeof geJu.nobilityScore === 'number') lines.push(`| 贵气度 | ${geJu.nobilityScore}分 |`)
    if (typeof geJu.wealthScore === 'number') lines.push(`| 富气度 | ${geJu.wealthScore}分 |`)
    if (typeof geJu.careerScore === 'number') lines.push(`| 事业运 | ${geJu.careerScore}分 |`)
    if (typeof geJu.marriageScore === 'number') lines.push(`| 婚姻运 | ${geJu.marriageScore}分 |`)
    if (typeof geJu.healthScore === 'number') lines.push(`| 健康运 | ${geJu.healthScore}分 |`)
    if (typeof geJu.childrenScore === 'number') lines.push(`| 子女运 | ${geJu.childrenScore}分 |`)
    lines.push(``)
  }

  // 兼格分析
  if (geJu.jianGe && geJu.jianGe.length > 0) {
    lines.push(`**兼格分析**：命局除主格外，兼有${geJu.jianGe.map(j => j.name).join('、')}之格。`)
    lines.push(``)
    for (const jg of geJu.jianGe) {
      lines.push(`- **${jg.name}**：${jg.description}（置信度${jg.confidence}%）`)
      if (jg.reasons && jg.reasons.length > 0) {
        lines.push(`  - 成立原因：${jg.reasons.join('、')}`)
      }
    }
    lines.push(``)
  }

  // 副格
  if (geJu.assistGeJu && geJu.assistGeJu.length > 0) {
    lines.push(`**副格**：${geJu.assistGeJu.map(a => a.name).join('、')}。`)
    lines.push(``)
  }

  return lines.join('\n')
}

function generateChapter4_shishen(input: FullReportInput): string {
  const { shenShiAnalysis } = input
  const lines = [
    `## 四、十神分析`,
    ``,
    `**十神力量详表**：`,
  ]

  // 十神力量详表（含星级）
  lines.push(`| 十神 | 力量 | 星级 | 状态 |`)
  lines.push(`|:---:|:---:|:---:|:---|`)
  for (const d of shenShiAnalysis.details) {
    const stars = shenShiAnalysis.starRatings?.[d.name] || ''
    const status = `${d.touGan ? '透干 ' : ''}${d.deLing ? '得令 ' : ''}${d.deDi ? '得地 ' : ''}${d.youGen ? '通根 ' : ''}${d.shouZhi ? '受制' : ''}`
    lines.push(`| ${d.name} | ${d.power}分 | ${stars} | ${status || '无特殊状态'} |`)
  }
  lines.push(``)

  // 十神主次分类
  lines.push(`**十神主次**：`)
  lines.push(``)
  if (shenShiAnalysis.primaryShenShi && shenShiAnalysis.primaryShenShi.length > 0) {
    lines.push(`- **主导十神**：${shenShiAnalysis.primaryShenShi.join('、')} —— 主导命主性格与人生走向`)
  }
  if (shenShiAnalysis.secondaryShenShi && shenShiAnalysis.secondaryShenShi.length > 0) {
    lines.push(`- **辅助十神**：${shenShiAnalysis.secondaryShenShi.join('、')} —— 辅助主导十神发挥作用`)
  }
  if (shenShiAnalysis.tertiaryShenShi && shenShiAnalysis.tertiaryShenShi.length > 0) {
    lines.push(`- **次要十神**：${shenShiAnalysis.tertiaryShenShi.join('、')} —— 影响力较弱`)
  }
  lines.push(``)

  // 十神生克链分析
  if (shenShiAnalysis.shengKeLinks && shenShiAnalysis.shengKeLinks.length > 0) {
    lines.push(`**十神生克链**：`)
    lines.push(``)
    lines.push(`| 关系 | 力量 | 说明 |`)
    lines.push(`|:---:|:---:|:---|`)
    for (const link of shenShiAnalysis.shengKeLinks.slice(0, 8)) {
      lines.push(`| ${link.from} ${link.type} ${link.to} | ${link.strength} | ${link.description} |`)
    }
    lines.push(``)
  }

  if (shenShiAnalysis.shengKeAnalysis) {
    lines.push(`**生克链综合分析**：${shenShiAnalysis.shengKeAnalysis}`)
    lines.push(``)
  }

  // 十神组合
  if (shenShiAnalysis.combinations && shenShiAnalysis.combinations.length > 0) {
    lines.push(`**十神组合**：`)
    lines.push(``)
    for (const combo of shenShiAnalysis.combinations.slice(0, 5)) {
      lines.push(`- **${combo.name}**：${combo.description}（${combo.auspicious ? '吉' : '凶'}，置信度${combo.confidence}%）`)
    }
    lines.push(``)
  }

  lines.push(`**人格特质**：${shenShiAnalysis.personality}`)
  lines.push(``)
  lines.push(`**性格倾向**：${shenShiAnalysis.personalityTraits?.join('、')}`)
  lines.push(``)
  lines.push(`**职业倾向**：${shenShiAnalysis.careerTendency}`)
  lines.push(``)
  lines.push(`**婚恋特点**：${shenShiAnalysis.relationshipTraits}`)
  return lines.join('\n')
}

function generateChapter5_shensha(input: FullReportInput): string {
  const { shenSha } = input
  const lines = [
    `## 五、神煞分析`,
    ``,
    `命局神煞汇总：`,
    ``,
  ]
  for (const cat of shenSha) {
    const hitItems = cat.items.filter(i => i.inPosition)
    if (hitItems.length > 0) {
      lines.push(`**${cat.name}**：${hitItems.map(i => i.name).join('、')}`)
      for (const item of hitItems) {
        lines.push(`- ${item.name}：${item.description}`)
      }
      lines.push(``)
    }
  }
  return lines.join('\n')
}

function generateChapter6_xiyong(input: FullReportInput): string {
  const { xiYongShen, fiveElementPower } = input
  const powerMap = Object.fromEntries(fiveElementPower.elements.map(e => [e.element, e.percentage])) as Record<FiveElement, number>
  const lines = [
    `## 六、喜用神`,
    ``,
    `**喜用神**：${xiYongShen.bestElement}。`,
    ``,
    `**忌神**：${xiYongShen.avoidedElements.join('、')}。`,
    ``,
  ]

  // 推导步骤
  if (xiYongShen.derivationSteps && xiYongShen.derivationSteps.length > 0) {
    lines.push(`**喜用神推导过程**：`)
    lines.push(``)
    for (const step of xiYongShen.derivationSteps) {
      lines.push(`**${step.step}**：${step.result}`)
      lines.push(`→ ${step.reason}`)
      lines.push(``)
    }
  }

  lines.push(`**五行力量分布**：`)
  lines.push(`- 木：${powerMap['木']?.toFixed(1) || 0}%`)
  lines.push(`- 火：${powerMap['火']?.toFixed(1) || 0}%`)
  lines.push(`- 土：${powerMap['土']?.toFixed(1) || 0}%`)
  lines.push(`- 金：${powerMap['金']?.toFixed(1) || 0}%`)
  lines.push(`- 水：${powerMap['水']?.toFixed(1) || 0}%`)
  lines.push(``)

  // 闲神
  if (xiYongShen.idleElements && xiYongShen.idleElements.length > 0) {
    lines.push(`**闲神**：${xiYongShen.idleElements.join('、')}。闲神对命局影响不大，既不为喜也不为忌，运势中可顺其自然。`)
    lines.push(``)
  }

  // 仇神
  if (xiYongShen.enemyElements && xiYongShen.enemyElements.length > 0) {
    lines.push(`**仇神**：${xiYongShen.enemyElements.join('、')}。仇神生助忌神，对命主不利，日常生活中应尽量避免接触仇神五行相关的事物。`)
    lines.push(``)
  }

  lines.push(`喜用神${xiYongShen.bestElement}为命局所喜，能补命局之不足，增福添寿。日常生活中多接触${xiYongShen.bestElement}行相关的事物，有助于提升运势。`)
  return lines.join('\n')
}

function generateChapter7_marriage(input: FullReportInput): string {
  const { marriage } = input
  const lines = [
    `## 七、婚姻分析`,
    ``,
    `婚恋综合评分：**${marriage.score}分**。`,
    ``,
    `夫妻宫为日支${marriage.spousePalace.zhi}，五行属${marriage.spousePalace.element}。`,
    ``,
    `**夫妻宫关系**：`,
  ]
  for (const rel of marriage.relations) {
    lines.push(`- ${rel.type}（${rel.target}）：${rel.description}`)
  }
  lines.push(``)
  lines.push(`**婚姻神煞**：`)
  for (const ss of marriage.shenSha) {
    lines.push(`- ${ss.name}：${ss.inPosition ? '命中，位于' + ss.position : '未命中'}。${ss.description}`)
  }
  lines.push(``)
  lines.push(`**最佳结婚年龄**：${marriage.bestMarriageAge.min}岁至${marriage.bestMarriageAge.max}岁。`)
  lines.push(``)
  lines.push(`**婚姻风险**：`)
  for (const risk of marriage.risks) {
    lines.push(`- ${risk.type}（${risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '中风险' : '低风险'}）：${risk.description}`)
  }
  lines.push(``)
  lines.push(`**改善建议**：`)
  for (const s of marriage.suggestions) {
    lines.push(`- ${s}`)
  }
  return lines.join('\n')
}

function generateChapter8_wealth(input: FullReportInput): string {
  const { wealth } = input
  const lines = [
    `## 八、财富分析`,
    ``,
    `财富综合评分：**${wealth.score}分**。`,
    ``,
  ]
  if (wealth.zhengCai) {
    lines.push(`**正财**：${wealth.zhengCai.power}分。${wealth.zhengCai.description}`)
  }
  if (wealth.pianCai) {
    lines.push(`**偏财**：${wealth.pianCai.power}分。${wealth.pianCai.description}`)
  }
  lines.push(``)
  lines.push(`**财库**：${wealth.caiKu.hasCaiKu ? '命带财库（' + wealth.caiKu.caiKuZhi + '）' : '命中无财库'}。${wealth.caiKu.description}`)
  lines.push(``)
  lines.push(`**财运特征**：${wealth.louCai ? '有漏财之象' : '无漏财之忧'}；${wealth.poCai ? '有破财之险' : '无破财之忧'}。`)
  lines.push(``)
  lines.push(`**赚钱方式**：${wealth.moneyMakingStyle}`)
  lines.push(``)
  lines.push(`**投资方向**：`)
  for (const dir of wealth.investmentDirections) {
    lines.push(`- ${dir.direction}：${dir.score}分 ${dir.suitable ? '【适合】' : '【一般】'} ${dir.reason}`)
  }
  lines.push(``)
  lines.push(`**风险年份**：`)
  for (const ry of wealth.riskYears) {
    lines.push(`- ${ry.year}年（${ry.ganZhi}）：${ry.riskType} ${ry.description}`)
  }
  lines.push(``)
  lines.push(`**理财建议**：`)
  for (const s of wealth.suggestions) {
    lines.push(`- ${s}`)
  }
  return lines.join('\n')
}

function generateChapter9_career(input: FullReportInput): string {
  const { career } = input
  const lines = [
    `## 九、事业分析`,
    ``,
    `事业综合评分：**${career.score}分**。`,
    ``,
    `**十神格局**：`,
  ]
  for (const ss of career.shishenScores.slice(0, 5)) {
    lines.push(`- ${ss.name}（${ss.role}）：${ss.power}分。${ss.description}`)
  }
  lines.push(``)
  lines.push(`**发展方向**：`)
  for (const dir of career.directions) {
    lines.push(`- ${dir.name}：${dir.score}分 ${dir.suitable ? '【适合】' : ''} ${dir.description}`)
  }
  lines.push(``)
  lines.push(`**适合行业**（Top 5）：`)
  for (const ind of career.industries.slice(0, 5)) {
    lines.push(`- ${ind.industry}：${ind.score}分 ${ind.reason}`)
  }
  lines.push(``)
  lines.push(`**最佳发展路径**：${career.bestPath}`)
  lines.push(``)
  lines.push(`**财富方向**：${career.wealthDirection}`)
  lines.push(``)
  lines.push(`**事业风险**：`)
  for (const r of career.risks) {
    lines.push(`- ${r}`)
  }
  lines.push(``)
  lines.push(`**发展建议**：`)
  for (const s of career.suggestions) {
    lines.push(`- ${s}`)
  }
  return lines.join('\n')
}

function generateChapter10_health(input: FullReportInput): string {
  const { health } = input
  const lines = [
    `## 十、健康分析`,
    ``,
    `健康综合评分：**${health.score}分**。`,
    ``,
    `**体质类型**：${health.constitution.type}`,
    ``,
    `${health.constitution.description}`,
    ``,
    `**体质特征**：${health.constitution.characteristics.join('、')}`,
    ``,
    `**寒热状态**：${health.temperature.type}（${health.temperature.level}级）。${health.temperature.description}`,
    ``,
    `**燥湿状态**：${health.moisture.type}（${health.moisture.level}级）。${health.moisture.description}`,
    ``,
    `**易患疾病**：`,
  ]
  for (const d of health.diseaseRisks) {
    lines.push(`- ${d.organ}：${d.riskLevel === 'high' ? '高风险' : d.riskLevel === 'medium' ? '中风险' : '低风险'}。${d.description} 常见疾病：${d.diseases.join('、')}`)
  }
  lines.push(``)
  lines.push(`**饮食建议**：`)
  for (const diet of health.dietSuggestions) {
    lines.push(`- ${diet.category}：宜食${diet.recommend.join('、')}；忌食${diet.avoid.join('、')}。${diet.reason}`)
  }
  lines.push(``)
  lines.push(`**运动建议**：`)
  for (const ex of health.exerciseSuggestions) {
    lines.push(`- ${ex.type}：${ex.reason}`)
  }
  lines.push(``)
  lines.push(`**调理方案**：`)
  for (const r of health.regimens) {
    lines.push(`- ${r.aspect}：`)
    for (const s of r.suggestions) {
      lines.push(`  - ${s}`)
    }
  }
  return lines.join('\n')
}

function getDayunCareerAdvice(shenShi: { gan: string; zhi: string }, isXi: boolean, isJi: boolean, score: number): string {
  const gan = shenShi.gan as string
  const careerMap: Record<string, { xi: string[]; ji: string[]; mid: string[] }> = {
    '正官': { xi: ['官运亨通，贵人提拔，职位升迁有望', '事业稳步上升，适合在体制内或大企业发展', '管理工作得心应手，领导能力受到认可'], ji: ['官杀压力大，职场竞争激烈，谨防小人排挤', '注意职场人际关系，避免卷入权力斗争', '不宜冒进，踏实做事方为上策'], mid: ['官星暗藏，事业变化不大，需主动争取机会', '适合稳中求进，不宜频繁跳槽'] },
    '偏官': { xi: ['七杀化权，胆识过人，适合开创事业新局面', '突破常规，敢打敢拼，有领导才能', '竞争中获得优势，能攻克难关'], ji: ['压力过重，身体透支，注意劳逸结合', '易有口舌是非，谨防官非诉讼', '小人当道，做事需低调谨慎'], mid: ['事业有挑战也有机遇，需审时度势', '遇事冷静应对，不可冲动行事'] },
    '正印': { xi: ['印星护身，学业有成，考试顺利', '上司赏识，文化教育类事业大吉', '适合进修学习，考取资格证书'], ji: ['依赖心过重，缺乏自主判断力', '长辈干预过多，需有自己的主见', '文书方面易出纰漏，需仔细核对'], mid: ['学业运平稳，适合提升专业技能', '适合从事教育、文化、出版等事业'] },
    '偏印': { xi: ['偏印得力，灵感充沛，适合创作研究', '技艺类事业大放异彩，专利、版权收益佳', '玄学、宗教、心理学等领域有所建树'], ji: ['思虑过重，容易钻牛角尖', '事业方向摇摆不定，缺乏持续动力', '人际关系冷淡，需主动沟通交流'], mid: ['思维活跃，适合技术、研发、设计类工作', '可发展副业或兼职'] },
    '比肩': { xi: ['朋友相助，合伙经营有利', '同辈贵人多，人脉资源广', '适合团队协作，共同发展'], ji: ['竞争激烈，容易被取代', '合伙易生纠纷，不宜合伙创业', '开销增大，钱财难聚'], mid: ['朋友运一般，需靠自己努力', '竞争中求合作，合作中求共赢'] },
    '劫财': { xi: ['竞争带来动力，反而激发斗志', '社交活跃，人际关系广泛', '适合销售、贸易等竞争性行业'], ji: ['破财风险极大，不宜投资借贷', '小人多，谨防被骗', '感情易有第三者介入'], mid: ['财运平稳，不宜贪大求全', '守住本分，稳健发展'] },
    '食神': { xi: ['食神吐秀，才华得到充分展现', '口福好，社交宴会增多，拓展人脉', '创意类事业大吉，文艺创作丰收'], ji: ['贪图享乐，不思进取', '过于理想化，落地执行不足', '注意控制饮食，防止肥胖及三高'], mid: ['生活惬意，适合从事餐饮、美容、艺术等行业', '心情愉悦，工作效率较高'] },
    '伤官': { xi: ['伤官配印，才华横溢，创新突破', '口才极佳，适合律师、讲师、咨询师', '敢于打破常规，事业焕发新机'], ji: ['口舌是非多，易得罪领导', '恃才傲物，人际关系紧张', '感情波折，需多沟通包容'], mid: ['才华出众但需低调行事', '适合技术、艺术、自媒体等自由职业'] },
    '正财': { xi: ['正财旺运，收入稳步增长', '努力付出有丰厚回报，加薪升职', '适合从事商业、金融、贸易类工作'], ji: ['因贪财而误事，需财外求财', '过度劳累赚钱，损害健康', '投资需谨慎，不宜冒险'], mid: ['收入稳定，适合稳扎稳打', '理财需有规划，不宜冲动消费'] },
    '偏财': { xi: ['偏财运旺，意外之财频频', '投资眼光独到，理财收益丰厚', '人缘极佳，贵人带来商机'], ji: ['贪财冒险，血本无归', '桃花过旺，感情复杂', '一夜暴富心态不可取'], mid: ['有偏财机会但需谨慎把握', '适合做投资但不宜重仓'] },
  }
  const map = careerMap[gan] || careerMap['比肩']
  if (isXi) return map.xi[0]
  if (isJi) return map.ji[0]
  return map.mid[0]
}

function getDayunWealthAdvice(shenShi: { gan: string; zhi: string }, isXi: boolean, isJi: boolean, score: number): string {
  const gan = shenShi.gan as string
  if (['正财', '偏财'].includes(gan)) {
    if (isXi) return score >= 70 ? '财运大旺，正偏财兼得，投资获利丰厚，是积累财富的黄金十年' : '财运不错，收入增长，适合稳健理财，积少成多'
    if (isJi) return '财星虽现但受克，求财辛苦，易因借贷、担保破财，需严控开支'
    return '财运平淡，收入稳定，不宜投机冒险，宜勤俭持家'
  }
  if (['食神', '伤官'].includes(gan)) {
    if (isXi) return '食伤生财，靠才华技能赚钱，副业收入可观，适合发展创意经济'
    if (isJi) return '食伤泄身太过，身体消耗大，赚钱花费也大，存不住钱'
    return '靠技术和才华赚钱，收入尚可，可考虑兼职或副业增加收入'
  }
  if (['比肩', '劫财'].includes(gan)) {
    if (isXi) return '比劫帮身，人脉带来财运，合伙经营有利，但需防合伙纠纷'
    if (isJi) return '比劫争财，财运不聚，易因朋友借贷、合伙而破财，不宜大额投资'
    return '社交花费较多，守财需谨慎，不宜借钱给人'
  }
  if (['正官', '偏官'].includes(gan)) {
    if (isXi) return '官星护财，职位提升带来收入增长，正当收入丰厚'
    if (isJi) return '官杀克身，工作压力大，收入难以提升，需注意职场变故'
    return '工作稳定带来稳定收入，财运平淡但可靠'
  }
  // 印星
  if (isXi) return '印星护身，有长辈贵人资助，学业提升带来未来财富'
  if (isJi) return '印星受克，投资判断力下降，不宜大额投资，需多咨询专业人士'
  return '偏重精神生活，财运平稳，适合稳中求财'
}

function getDayunMarriageAdvice(shenShi: { gan: string; zhi: string }, isXi: boolean, isJi: boolean, score: number): string {
  const gan = shenShi.gan as string
  if (['正财', '正官'].includes(gan)) {
    if (isXi) return '婚姻宫稳固，夫妻感情和睦，家庭幸福美满'
    if (isJi) return '财官受克，感情有波折，需多沟通理解，谨防冷战'
    return '婚姻平稳，日常磕碰难免，需彼此包容'
  }
  if (['偏财', '偏官'].includes(gan)) {
    if (isJi) return '偏星旺盛，桃花过旺，异性缘太好反成困扰，需守住本心'
    if (isXi) return '异性缘好，社交活跃，单身者易遇良缘，已婚者需注意分寸'
    return '感情生活较丰富，需以家庭为重，避免外界干扰'
  }
  if (['比肩', '劫财'].includes(gan)) {
    if (isJi) return '比劫争妻/夫，感情有竞争者出现，婚姻面临考验'
    if (isXi) return '伴侣关系平等，能共同奋斗，但需注意各自空间'
    return '伴侣间需多沟通，避免因朋友社交引发矛盾'
  }
  if (['食神', '伤官'].includes(gan)) {
    if (isJi) return '伤官克官，对伴侣挑剔苛刻，口舌争端增多，需改善沟通方式'
    if (isXi) return '食伤运浪漫多情，感情生活丰富多彩，适合增进夫妻感情'
    return '追求浪漫和品质生活，与伴侣的共同爱好增多'
  }
  if (isXi) return '印星护身，家庭和睦，长辈助力婚姻，生活安定'
  if (isJi) return '印星受克，内心孤独感增强，与伴侣易产生隔阂，需多关心对方'
  return '婚姻生活平淡安宁，注重精神交流'
}

function getDayunHealthAdvice(shenShi: { gan: string; zhi: string }, wangShuai: string, isXi: boolean, isJi: boolean, score: number): string {
  const gan = shenShi.gan as string
  const zhi = shenShi.zhi as string
  const elementMap: Record<string, string> = {
    '木': '肝胆系统', '火': '心血管系统', '土': '脾胃消化系统', '金': '肺及呼吸系统', '水': '肾脏泌尿系统',
  }
  const shenShiElementMap: Record<string, string> = {
    '正官': '木', '偏官': '木', '正印': '火', '偏印': '火',
    '比肩': '土', '劫财': '土', '食神': '金', '伤官': '金',
    '正财': '水', '偏财': '水',
  }
  const relatedOrgan = elementMap[shenShiElementMap[gan] || '土']
  if (['食神', '伤官'].includes(gan)) {
    if (isJi) return `食伤泄身太过，${relatedOrgan}负担加重，注意饮食规律，避免暴饮暴食，定期体检`
    return `食伤运注意${relatedOrgan}保养，饮食宜清淡，适当运动`
  }
  if (['比肩', '劫财'].includes(gan)) {
    if (isJi) return `比劫旺争，${relatedOrgan}易失衡，注意外伤、意外，出行需谨慎`
    return `身体消耗较大，注意休息充足，避免过度劳累`
  }
  if (['正官', '偏官'].includes(gan)) {
    if (isJi) return `官杀克身，精神压力大，容易失眠焦虑，注意心理健康，建议冥想或瑜伽`
    return `事业压力下需注意身体，保持规律作息，适度锻炼`
  }
  if (isXi && wangShuai === '旺' || wangShuai === '相') return '身体状态良好，精力充沛，但不可因此透支身体，保持良好作息'
  if (isJi && (wangShuai === '囚' || wangShuai === '死')) return `大运${wangShuai}地，身体抵抗力下降，${relatedOrgan}需重点防护，建议定期体检`
  return '健康无大碍，日常注意保养即可'
}

function getDayunOverallSuggestion(shenShi: { gan: string; zhi: string }, isXi: boolean, isJi: boolean, score: number, step: { startAge: number; endAge: number }): string {
  if (isXi && score >= 75) return `此运为命主人生的黄金十年，正值${step.startAge}至${step.endAge}岁，应乘势而上，大胆开拓，把握一切机遇，成就人生高峰。`
  if (isXi && score >= 60) return `${step.startAge}至${step.endAge}岁运势向好，宜积极进取，拓展事业版图，但不可骄傲自满，稳中求进。`
  if (isJi && score <= 35) return `${step.startAge}至${step.endAge}岁为人生低谷期，宜韬光养晦，积蓄力量，保守稳健，切不可冒进。多读书、多学习、多运动，为下一个好运期做准备。`
  if (isJi && score <= 50) return `${step.startAge}至${step.endAge}岁运势偏弱，做事多遇阻力，需耐心应对。保持低调，减少不必要的社交和投资，专注提升自身实力。`
  return `${step.startAge}至${step.endAge}岁运势平稳，不温不火。宜保持平常心，稳扎稳打，不宜大起大落。可利用此阶段夯实基础，培养新技能。`
}

function generateChapter11_dayun(input: FullReportInput): string {
  const { daYun, dayMaster } = input
  const lines: string[] = [
    `## 十一、大运分析`,
    ``,
    `大运是人生每十年一个阶段的运势走向，反映了命主在不同人生阶段的吉凶祸福、事业起伏、财富聚散、婚姻走向和健康变化。`,
    ``,
    `**日主**：${dayMaster.dayGan}（${dayMaster.dayGanElement}）`,
    ``,
    `**起运信息**：${daYun.qiYun.qiYunAge}岁起运，${daYun.qiYun.isShun ? '顺行' : '逆行'}。`,
    ``,
    `**当前大运**：第${(daYun.currentStepIndex >= 0 ? daYun.currentStepIndex + 1 : '—')}步。`,
    ``,
    `命主一生共行${daYun.totalSteps}步大运，详细分析如下：`,
    ``,
  ]

  for (const step of daYun.steps) {
    const ganZhiStr = `${step.ganZhi.gan}${step.ganZhi.zhi}`
    const shenShiStr = `${step.shenShi.gan}（天干）、${step.shenShi.zhi}（地支本气）`
    const jiXiLabel = step.isXi ? '吉' : step.isJi ? '凶' : '平'
    const jiXiEmoji = step.isXi ? '✦ 吉运' : step.isJi ? '✧ 凶运' : '○ 平运'
    const scoreBar = step.score >= 80 ? '████████░░' : step.score >= 60 ? '██████░░░░' : step.score >= 40 ? '████░░░░░░' : step.score <= 20 ? '██░░░░░░░░' : '█████░░░░░'
    const isCurrent = step.index === daYun.currentStepIndex

    lines.push(`### 第${step.index + 1}步大运：${ganZhiStr}（${step.startAge}～${step.endAge}岁）`)
    if (isCurrent) {
      lines.push(`**← 当前所在大运（${step.startYear}～${step.endYear}年）**`)
    } else {
      lines.push(`（${step.startYear}～${step.endYear}年）`)
    }
    lines.push(``)

    lines.push(`| 项目 | 内容 |`)
    lines.push(`|:---:|:---|`)
    lines.push(`| 起止年龄 | ${step.startAge}岁 ～ ${step.endAge}岁 |`)
    lines.push(`| 干支 | ${ganZhiStr} |`)
    lines.push(`| 十神 | ${shenShiStr} |`)
    lines.push(`| 旺衰 | ${step.wangShuai} |`)
    lines.push(`| 运势 | ${jiXiEmoji}（${scoreBar} ${step.score}分）|`)
    lines.push(``)

    lines.push(`**【事业变化】**`)
    lines.push(getDayunCareerAdvice(step.shenShi, step.isXi, step.isJi, step.score))
    lines.push(``)

    lines.push(`**【财富变化】**`)
    lines.push(getDayunWealthAdvice(step.shenShi, step.isXi, step.isJi, step.score))
    lines.push(``)

    lines.push(`**【婚姻变化】**`)
    lines.push(getDayunMarriageAdvice(step.shenShi, step.isXi, step.isJi, step.score))
    lines.push(``)

    lines.push(`**【健康变化】**`)
    lines.push(getDayunHealthAdvice(step.shenShi, step.wangShuai, step.isXi, step.isJi, step.score))
    lines.push(``)

    // 大运与命局刑冲合害
    const vs = step.vsMingJu
    const vsRelations: string[] = []
    if (vs.chong.length > 0) vsRelations.push(`冲：${vs.chong.join('、')}`)
    if (vs.he.length > 0) vsRelations.push(`合：${vs.he.join('、')}`)
    if (vs.xing.length > 0) vsRelations.push(`刑：${vs.xing.join('、')}`)
    if (vs.hai.length > 0) vsRelations.push(`害：${vs.hai.join('、')}`)
    if (vsRelations.length > 0) {
      lines.push(`**【大运与命局关系】**${vsRelations.join('；')}。`)
      lines.push(``)
    }

    // 应期分析
    if (step.yingQiYears && step.yingQiYears.length > 0) {
      lines.push(`**【应期年份】**此运中以下年份为关键节点：`)
      lines.push(``)
      lines.push(`| 年份 | 干支 | 事件 | 强度 | 影响 |`)
      lines.push(`|:---:|:---:|:---|:---:|:---|`)
      for (const yq of step.yingQiYears.slice(0, 6)) {
        const impl = yq.implications?.slice(0, 2).join('；') || ''
        lines.push(`| ${yq.year} | ${yq.ganZhi} | ${yq.event} | ${yq.intensity} | ${impl} |`)
      }
      lines.push(``)
    }

    lines.push(`**【此运总评】**`)
    lines.push(step.detail)
    lines.push(``)

    lines.push(`**【建议】**`)
    lines.push(getDayunOverallSuggestion(step.shenShi, step.isXi, step.isJi, step.score, step))
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  }

  lines.push(`**大运总论**`)
  lines.push(``)
  lines.push(`命主一生运势起伏有序。吉运期间应抓住机遇、乘势而上；凶运期间应韬光养晦、稳扎稳打。大运与流年相互交织，吉凶互见。了解自身大运走势，有助于在人生关键节点做出明智决策，趋吉避凶，顺势而为。`)
  lines.push(``)

  return lines.join('\n')
}

function getLiuNianNotice(year: LiuNianYear): string {
  const parts: string[] = []
  if (year.vsMingJu.chong.length > 0) parts.push(`有冲（${year.vsMingJu.chong.join('、')}），宜防变动与冲突`)
  if (year.vsMingJu.xing.length > 0) parts.push(`犯三刑，需防官非口舌`)
  if (year.vsMingJu.hai.length > 0) parts.push(`有相害（${year.vsMingJu.hai.join('、')}），人际需谨慎`)
  if (year.vsMingJu.chuan.length > 0) parts.push(`有穿（${year.vsMingJu.chuan.join('、')}），防暗伤`)
  if (year.vsMingJu.po.length > 0) parts.push(`有破（${year.vsMingJu.po.join('、')}），注意财物破损`)
  if (year.vsMingJu.he.length > 0) parts.push(`有合（${year.vsMingJu.he.join('、')}），利合作与感情`)
  if (parts.length === 0) parts.push('四柱平和，无冲合刑害，稳中向好')
  return parts.join('；')
}

function getLiuNianSuggestion(year: LiuNianYear): string {
  const hasHigh = year.yingQi.some(yq => yq.intensity === '高')
  const hasEvent = year.yingQi.length > 0
  if (!hasEvent) {
    return `${year.year}年运势平稳，流年${year.ganZhi.gan}${year.ganZhi.zhi}无显著刑冲合害，宜保持平常心，做好本职工作。`
  }
  if (hasHigh) {
    return `${year.year}年为变动之年，流年${year.ganZhi.gan}${year.ganZhi.zhi}有${year.yingQi.map(y => y.event).join('、')}，需格外谨慎。宜修身养性、积蓄力量，切忌冲动行事，凡事三思而后行。`
  }
  return `${year.year}年有变化，流年${year.ganZhi.gan}${year.ganZhi.zhi}出现${year.yingQi.map(y => y.event).join('、')}，宜稳中求进，把握贵人助力，避免贪多嚼不烂。`
}

function generateChapter12_liunian(input: FullReportInput): string {
  const { liuNian, dayMaster } = input
  const lines: string[] = [
    `## 十二、流年分析`,
    ``,
    `流年是命主每年的具体运势变化。流年与大运相互作用，吉凶交织，构成人生一年一变的运势图谱。`,
    ``,
    `**日主**：${dayMaster.dayGan}（${dayMaster.dayGanElement}）`,
    ``,
    `**分析范围**：${liuNian.startYear}年 ～ ${liuNian.endYear}年，共${liuNian.years.length}年。`,
    ``,
    `以下逐年分析（仅展示有应期事件的年份及当前年附近），其余年份概览列于文末：`,
    ``,
  ]

  // 分类：有应期事件的年份、当前年附近 ±3年
  const eventYears = liuNian.years.filter(y => y.yingQi.length > 0)
  const nearbyYears = liuNian.years.filter(y => Math.abs(y.year - liuNian.currentYear) <= 3)
  const highlightSet = new Set<number>()
  for (const y of eventYears) highlightSet.add(y.year)
  for (const y of nearbyYears) highlightSet.add(y.year)

  // 输出高亮年份的详细分析
  const sortedHighlights = liuNian.years.filter(y => highlightSet.has(y.year)).sort((a, b) => a.year - b.year)
  for (const year of sortedHighlights) {
    const ganZhiStr = `${year.ganZhi.gan}${year.ganZhi.zhi}`
    const hasHigh = year.yingQi.some(yq => yq.intensity === '高')
    const jiXiEmoji = year.yingQi.length === 0 ? '— 平' : hasHigh ? '▼ 变动' : '☆ 有变'
    const isCurrent = year.isCurrentYear

    lines.push(`### ${year.year}年（${ganZhiStr}）`)
    if (isCurrent) lines.push(`**← 今年**`)
    lines.push(``)

    lines.push(`| 项目 | 内容 |`)
    lines.push(`|:---:|:---|`)
    lines.push(`| 流年干支 | ${ganZhiStr} |`)
    lines.push(`| 天干十神 | ${year.shenShi.gan} |`)
    lines.push(`| 地支十神 | ${year.shenShi.zhi} |`)
    lines.push(`| 状态 | ${jiXiEmoji} |`)
    lines.push(``)

    // 应期事件
    if (year.yingQi.length > 0) {
      lines.push(`**【应期事件】**`)
      for (const yq of year.yingQi) {
        lines.push(`- ${yq.event}（强度：${yq.intensity}）`)
        lines.push(`  - 原因：${yq.reason}`)
        lines.push(`  - 影响：${yq.implications.join('、')}`)
      }
      lines.push(``)
    }

    // 冲合刑害
    const relations: string[] = []
    if (year.vsMingJu.chong.length > 0) relations.push(`**冲**：${year.vsMingJu.chong.join('、')}`)
    if (year.vsMingJu.he.length > 0) relations.push(`**合**：${year.vsMingJu.he.join('、')}`)
    if (year.vsMingJu.xing.length > 0) relations.push(`**刑**：${year.vsMingJu.xing.join('、')}`)
    if (year.vsMingJu.hai.length > 0) relations.push(`**害**：${year.vsMingJu.hai.join('、')}`)
    if (year.vsMingJu.chuan.length > 0) relations.push(`**穿**：${year.vsMingJu.chuan.join('、')}`)
    if (year.vsMingJu.po.length > 0) relations.push(`**破**：${year.vsMingJu.po.join('、')}`)
    if (relations.length === 0) relations.push('无冲合刑害')
    lines.push(`**【流年与命局关系】** ${relations.join('；')}`)
    lines.push(``)

    // 流年与大运关系
    const dyRelations: string[] = []
    if (year.vsDaYun.chong.length > 0) dyRelations.push(`冲大运`)
    if (year.vsDaYun.he.length > 0) dyRelations.push(`合大运`)
    if (year.vsDaYun.xing.length > 0) dyRelations.push(`刑大运`)
    if (year.vsDaYun.hai.length > 0) dyRelations.push(`害大运`)
    if (year.vsDaYun.chuan.length > 0) dyRelations.push(`穿大运`)
    if (year.vsDaYun.po.length > 0) dyRelations.push(`破大运`)
    if (year.vsDaYun.fuYin.length > 0) dyRelations.push(...year.vsDaYun.fuYin)
    if (dyRelations.length > 0) {
      lines.push(`**【流年与大运关系】** ${dyRelations.join('、')}`)
      lines.push(``)
    }

    // 神煞
    lines.push(`**【流年神煞】** ${year.shenSha.length > 0 ? year.shenSha.join('、') : '无特殊神煞'}`)
    lines.push(``)

    // 注意事项
    lines.push(`**【注意事项】** ${getLiuNianNotice(year)}`)
    lines.push(``)

    // 总评
    lines.push(`**【流年总评】** ${year.detail}`)
    lines.push(``)

    // 建议
    lines.push(`**【综合建议】** ${getLiuNianSuggestion(year)}`)
    lines.push(``)
    lines.push(`---`)
    lines.push(``)
  }

  // 其余年份概览表
  const otherYears = liuNian.years.filter(y => !highlightSet.has(y.year))
  if (otherYears.length > 0) {
    lines.push(`### 其余年份概览`)
    lines.push(``)
    lines.push(`| 年份 | 干支 | 十神（干/支） | 与命局关系 | 与大运关系 |`)
    lines.push(`|:---:|:---:|:---:|:---|:---|`)
    for (const year of otherYears) {
      const ganZhiStr = `${year.ganZhi.gan}${year.ganZhi.zhi}`
      const mingRelations = [...year.vsMingJu.chong, ...year.vsMingJu.he, ...year.vsMingJu.xing, ...year.vsMingJu.hai, ...year.vsMingJu.chuan, ...year.vsMingJu.po]
      const mingStr = mingRelations.length > 0 ? mingRelations.join('、') : '无'
      const dyRelations = [...year.vsDaYun.chong, ...year.vsDaYun.he, ...year.vsDaYun.xing, ...year.vsDaYun.hai, ...year.vsDaYun.chuan, ...year.vsDaYun.po, ...year.vsDaYun.fuYin]
      const dyStr = dyRelations.length > 0 ? dyRelations.join('、') : '无'
      lines.push(`| ${year.year} | ${ganZhiStr} | ${year.shenShi.gan} / ${year.shenShi.zhi} | ${mingStr} | ${dyStr} |`)
    }
    lines.push(``)
  }

  lines.push(`**流年总结**`)
  lines.push(``)
  const eventCount = liuNian.years.filter(y => y.yingQi.length > 0).length
  const highCount = liuNian.years.filter(y => y.yingQi.some(yq => yq.intensity === '高')).length
  lines.push(`命主${liuNian.startYear}至${liuNian.endYear}年共${liuNian.years.length}年中，有应期事件的年份约${eventCount}年，其中高强度变动年份约${highCount}年。有应期事件的年份需特别注意冲合刑害穿破的影响，结合大运走势判断吉凶程度；无显著事件的年份运势相对平稳，宜保持平常心。`)

  return lines.join('\n')
}

function generateChapter14_liuyue(input: FullReportInput): string {
  const { liuYue } = input
  const lines: string[] = [
    `## 十四、流月分析`,
    ``,
    `流月是大运和流年之下的精细化运势分析，精确到每个月的吉凶变化，帮助命主在关键月份趋吉避凶。`,
    ``,
    `**分析年份**：${liuYue.year}年（${liuYue.yearGanZhi.gan}${liuYue.yearGanZhi.zhi}）`,
    ``,
  ]

  // 分类吉月/凶月
  const jiMonths = liuYue.months.filter(m => m.jiXiong === '大吉' || m.jiXiong === '吉')
  const xiongMonths = liuYue.months.filter(m => m.jiXiong === '凶' || m.jiXiong === '大凶')
  const pingMonths = liuYue.months.filter(m => m.jiXiong === '平')

  // 吉月/凶月/平月分类表格（统一辅助函数）
  function pushMonthTable(lines: string[], title: string, months: typeof liuYue.months) {
    if (months.length === 0) return
    lines.push(`### ${title}`)
    lines.push(``)
    lines.push(`| 月份 | 干支 | 十神 | 吉凶 | 评分 | 注意事项 |`)
    lines.push(`|:---:|:---:|:---:|:---:|:---:|:---|`)
    for (const m of months) {
      const ganZhiStr = `${m.ganZhi.gan}${m.ganZhi.zhi}`
      lines.push(`| ${m.monthName} | ${ganZhiStr} | ${m.shenShi.gan} / ${m.shenShi.zhi} | ${m.jiXiong} | ${m.score} | ${m.notice} |`)
    }
    lines.push(``)
  }

  pushMonthTable(lines, '吉月', jiMonths)
  pushMonthTable(lines, '凶月', xiongMonths)
  pushMonthTable(lines, '平月', pingMonths)

  // 逐月详细分析
  lines.push(`### 逐月详析`)
  lines.push(``)
  for (const m of liuYue.months) {
    const ganZhiStr = `${m.ganZhi.gan}${m.ganZhi.zhi}`
    const jiXiEmoji = m.jiXiong === '大吉' ? '★★★' : m.jiXiong === '吉' ? '★★☆' : m.jiXiong === '凶' ? '★☆☆' : m.jiXiong === '大凶' ? '☆☆☆' : '★★★'
    const relations: string[] = []
    if (m.chong.length > 0) relations.push(`冲${m.chong.join('、')}`)
    if (m.he.length > 0) relations.push(`合${m.he.join('、')}`)
    if (m.xing.length > 0) relations.push(`刑${m.xing.join('、')}`)
    if (m.hai.length > 0) relations.push(`害${m.hai.join('、')}`)
    if (m.po.length > 0) relations.push(`破${m.po.join('、')}`)

    lines.push(`**${m.monthName}**（${ganZhiStr}）${jiXiEmoji} ${m.jiXiong}（${m.score}分）`)
    lines.push(`- 十神：${m.shenShi.gan}（天干）、${m.shenShi.zhi}（地支本气）`)
    lines.push(`- ${m.summary}`)
    if (relations.length > 0) lines.push(`- 冲合刑害：${relations.join('、')}`)
    lines.push(`- ${m.notice}`)
    lines.push(``)
  }

  lines.push(`**流月总结**`)
  lines.push(``)
  lines.push(`${liuYue.year}年共${jiMonths.length}个吉月、${xiongMonths.length}个凶月、${pingMonths.length}个平月。吉月应积极行动、把握机遇；凶月应保守稳健、规避风险。流月与流年、大运叠加判断，方能精准把握每月运势节奏。`)

  return lines.join('\n')
}

function generateChapter13_suggestions(input: FullReportInput): string {
  const { xiYongShen, fengshui, health, career, wealth, marriage } = input
  const lines = [
    `## 十三、改运建议`,
    ``,
    `综合以上分析，为命主提供以下改运建议：`,
    ``,
    `### 1. 五行调理`,
    ``,
    `喜用神为${xiYongShen.bestElement}，日常生活中可多接触${xiYongShen.bestElement}行相关的事物。`,
    ``,
    `**喜用颜色**：${fengshui.luckyColors.slice(0, 3).map(c => c.color).join('、')}。`,
    ``,
    `**忌讳颜色**：${fengshui.avoidColors.slice(0, 3).map(c => c.color).join('、')}。`,
    ``,
    `**幸运数字**：${fengshui.luckyNumbers.slice(0, 4).map(n => n.number).join('、')}。`,
    ``,
    `### 2. 方位调理`,
    ``,
    `吉方位：${fengshui.directions.slice(0, 2).map(d => d.position).join('、')}。`,
    ``,
    `住宅宜${fengshui.residence.bestFacing}朝向，坐${fengshui.residence.bestSitting}。`,
    ``,
    `### 3. 事业调理`,
    ``,
    ...career.suggestions.slice(0, 3).map(s => `- ${s}`),
    ``,
    `### 4. 财富调理`,
    ``,
    ...wealth.suggestions.slice(0, 3).map(s => `- ${s}`),
    ``,
    `### 5. 婚姻调理`,
    ``,
    ...marriage.suggestions.slice(0, 3).map(s => `- ${s}`),
    ``,
    `### 6. 健康调理`,
    ``,
    ...health.regimens.flatMap(r => r.suggestions.slice(0, 2).map(s => `- ${r.aspect}：${s}`)),
    ``,
    `### 7. 心态调理`,
    ``,
    `- 保持积极乐观的心态，相信美好的事情即将发生。`,
    `- 命由己造，运靠人为。积极的心态是最好的改运方法。`,
    `- 多行善事，广结善缘，福报自然来。`,
    `- 坚持学习，不断提升自我，增强自身实力。`,
    `- 珍惜当下，感恩所有，幸福就在身边。`,
    ``,
    `---`,
    ``,
    '*玄风门命理推演报告。命理之说，信则有，不信则无。宜修德积善，以天时地利人和为本。*',
  ]
  return lines.join('\n')
}

function getElementPersonality(element: FiveElement): string {
  const map: Record<FiveElement, string> = {
    '木': '性格仁厚，有恻隐之心，为人正直，举止优雅',
    '火': '性格热情，有礼有节，富有感染力，行动迅速',
    '土': '性格稳重，诚实守信，有包容心，重视承诺',
    '金': '性格刚毅，讲义气，有原则，做事认真',
    '水': '性格聪明，灵活变通，富有想象力，善于交际',
  }
  return map[element] || ''
}

// P1: 新增章节 — 人生总论（综合命局、走势、特点、喜忌、五行平衡）
function generateChapter15_lifeOverview(input: FullReportInput): string {
  const { chart, dayMaster, sixLines, geJu, xiYongShen, fiveElementPower, shenShiAnalysis } = input
  const lines: string[] = [
    `## 十五、人生总论`,
    ``,
    `### 整体命局`,
    ``,
    `命主生于${sixLines.year.gan}${sixLines.year.zhi}年，日主为${dayMaster.dayGan}（${dayMaster.dayGanElement}），格局为${geJu.name}。日主${dayMaster.wangShuai}，力量评分${dayMaster.strengthScore}分，五行综合${fiveElementPower.wangShuaiLevel}。`,
    ``,
    `四柱排列为：年柱${sixLines.year.gan}${sixLines.year.zhi}（${sixLines.year.naYin}）、月柱${sixLines.month.gan}${sixLines.month.zhi}（${sixLines.month.naYin}）、日柱${sixLines.day.gan}${sixLines.day.zhi}（${sixLines.day.naYin}）、时柱${sixLines.hour.gan}${sixLines.hour.zhi}（${sixLines.hour.naYin}）。`,
    ``,
    `### 人生走势`,
    ``,
    `综合格局层次（${geJu.grade}）与日主旺衰（${dayMaster.wangShuai}），命主一生运势呈${dayMaster.wangShuai === '旺' || dayMaster.wangShuai === '强' ? '先扬后抑，宜趁旺运时积累资本，中年之后转为守成' : dayMaster.wangShuai === '弱' || dayMaster.wangShuai === '衰' ? '先抑后扬，早年磨砺积累，中年后运势渐入佳境' : '平稳发展，起伏不大，宜循序渐进'}之势。`,
    ``,
    `### 命格特点`,
    ``,
    `- **格局特点**：${geJu.description}`,
    `- **十神主导**：${shenShiAnalysis.primaryShenShi?.join('、') || '无明显主导十神'}`,
    `- **性格倾向**：${shenShiAnalysis.personality}`,
    `- **职业天赋**：${shenShiAnalysis.careerTendency}`,
    ``,
    `### 喜用神`,
    ``,
    `命局所喜五行为**${xiYongShen.bestElement}**，此五行能补命局之不足，增福添寿。日常生活中宜多接触${xiYongShen.bestElement}行相关事物（颜色、方位、数字、行业等）。`,
    ``,
    `### 忌神`,
    ``,
    `命局所忌五行为**${xiYongShen.avoidedElements.join('、')}**，此五行会加重命局之失衡，带来不顺。日常生活中应尽量避免接触忌神五行相关事物，尤其是重大决策（投资、合作、婚配）时更需谨慎。`,
    ``,
    `### 五行平衡`,
    ``,
    `命局五行分布：`,
  ]
  for (const el of fiveElementPower.elements) {
    lines.push(`- ${el.element}：${el.percentage}%（${el.wangShuai}）`)
  }
  const dominant = fiveElementPower.dominant
  const weakest = fiveElementPower.weakest || '无明显弱势'
  lines.push(``)
  lines.push(`五行${dominant}最旺，${weakest}最弱。整体五行${fiveElementPower.wangShuaiLevel}，${dominant === weakest ? '五行力量较为均衡' : `五行偏${dominant}，需以${xiYongShen.bestElement}调和`}。`)
  return lines.join('\n')
}

// P1: 新增章节 — 性格分析（优点、缺点、待改善、人际、领导、执行）
function generateChapter16_personality(input: FullReportInput): string {
  const { shenShiAnalysis, dayMaster, fiveElementPower } = input
  const el = dayMaster.dayGanElement
  const personalityMap: Record<string, { strengths: string[]; weaknesses: string[]; improvements: string[] }> = {
    '木': {
      strengths: ['仁慈宽厚，有恻隐之心', '为人正直，举止优雅', '富有同情心，乐于助人', '有上进心，追求成长'],
      weaknesses: ['性格固执，不撞南墙不回头', '过于理想化，脱离实际', '优柔寡断，难以决断'],
      improvements: ['学会变通，不可过于执着', '增强决断力，果断行事', '平衡理想与现实'],
    },
    '火': {
      strengths: ['热情开朗，富有感染力', '有礼有节，尊师重道', '行动迅速，雷厉风行', '富有领导魅力'],
      weaknesses: ['性急冲动，容易得罪人', '情绪波动大，喜怒形于色', '缺乏耐心，半途而废'],
      improvements: ['学会控制情绪，三思后行', '增强耐心，坚持到底', '沉稳应对，不可急躁'],
    },
    '土': {
      strengths: ['稳重踏实，诚实守信', '有包容心，能容人容事', '重视承诺，一诺千金', '勤奋努力，任劳任怨'],
      weaknesses: ['过于保守，缺乏创新', '反应迟缓，错失良机', '固执己见，难以沟通'],
      improvements: ['增强灵活性，学会变通', '把握时机，敢于尝试', '开放心态，接受新事物'],
    },
    '金': {
      strengths: ['刚毅果敢，有原则', '讲义气，重情重义', '做事认真，追求完美', '意志坚定，不屈不挠'],
      weaknesses: ['过于刚硬，缺乏圆融', '刻板守旧，不懂变通', '好胜心强，易与人冲突'],
      improvements: ['学会柔和处事，刚柔并济', '增强灵活性，圆融待人', '放下胜负欲，和为贵'],
    },
    '水': {
      strengths: ['聪明智慧，反应敏捷', '灵活变通，善于应变', '富有想象力，创造力强', '善于交际，人脉广泛'],
      weaknesses: ['情绪多变，难以捉摸', '缺乏定性，见异思迁', '过于圆滑，缺乏真诚'],
      improvements: ['增强定性，专注一事', '真诚待人，不可过于圆滑', '稳定情绪，保持平和'],
    },
  }
  const p = personalityMap[el] || personalityMap['土']
  const lines: string[] = [
    `## 十六、性格分析`,
    ``,
    `命主日主为${dayMaster.dayGan}（${el}），${getElementPersonality(el)}。`,
    ``,
    `### 优点`,
    ``,
    ...p.strengths.map(s => `- ${s}`),
    ``,
    `### 缺点`,
    ``,
    ...p.weaknesses.map(s => `- ${s}`),
    ``,
    `### 待改善`,
    ``,
    ...p.improvements.map(s => `- ${s}`),
    ``,
    `### 人际关系`,
    ``,
    `${shenShiAnalysis.relationshipTraits || '人际关系一般，需主动经营人脉。'}`,
    ``,
    `### 领导能力`,
    ``,
    `${shenShiAnalysis.primaryShenShi?.includes('正官') || shenShiAnalysis.primaryShenShi?.includes('偏官') ? '命带官星，有领导天赋，善于统筹全局，适合担任管理职务。' : shenShiAnalysis.primaryShenShi?.includes('比肩') || shenShiAnalysis.primaryShenShi?.includes('劫财') ? '比劫旺盛，善于团队合作，但领导力需培养，宜合伙经营。' : '领导能力一般，更适合专业岗位或技术工作，宜辅佐他人成就事业。'}`,
    ``,
    `### 执行能力`,
    ``,
    `${shenShiAnalysis.primaryShenShi?.includes('食神') || shenShiAnalysis.primaryShenShi?.includes('伤官') ? '食伤吐秀，执行力强，善于将想法落地，行动力充沛。' : shenShiAnalysis.primaryShenShi?.includes('正官') || shenShiAnalysis.primaryShenShi?.includes('偏官') ? '官星护身，执行力稳健，按部就班，条理清晰。' : '执行力中等，需明确目标与计划，方能有效推进。'}`,
  ]
  return lines.join('\n')
}

// P1: 新增章节 — 家庭分析（父母、兄弟姐妹、子女、家庭运势、晚年运）
function generateChapter17_family(input: FullReportInput): string {
  const { sixLines, shenShiAnalysis, shenSha } = input
  const lines: string[] = [
    `## 十七、家庭分析`,
    ``,
    `### 父母`,
    ``,
    `年柱代表父母宫。年柱${sixLines.year.gan}${sixLines.year.zhi}，${sixLines.year.gan}为父位，${sixLines.year.zhi}为母位。`,
    ``,
    `${shenShiAnalysis.details.find(d => d.name === '正印')?.power && shenShiAnalysis.details.find(d => d.name === '正印')!.power > 50 ? '印星有力，与父母缘分深厚，得长辈庇护，家境良好。' : '印星力量一般，与父母关系平淡，宜主动尽孝，珍惜亲情。'}`,
    ``,
    `### 兄弟姐妹`,
    ``,
    `月柱代表兄弟姐妹宫。月柱${sixLines.month.gan}${sixLines.month.zhi}。`,
    ``,
    `${shenShiAnalysis.details.find(d => d.name === '比肩')?.power && shenShiAnalysis.details.find(d => d.name === '比肩')!.power > 50 ? '比肩有力，兄弟姐妹和睦，手足情深，能互相扶持。' : shenShiAnalysis.details.find(d => d.name === '劫财')?.power && shenShiAnalysis.details.find(d => d.name === '劫财')!.power > 50 ? '劫财旺盛，兄弟姐妹间易有竞争，需注意财物分明。' : '兄弟姐妹缘分一般，各自发展，保持联络即可。'}`,
    ``,
    `### 子女`,
    ``,
    `时柱代表子女宫。时柱${sixLines.hour.gan}${sixLines.hour.zhi}。`,
    ``,
    `${shenShiAnalysis.details.find(d => d.name === '食神')?.power && shenShiAnalysis.details.find(d => d.name === '食神')!.power > 50 ? '食神有力，子女缘分深厚，子女聪明孝顺，晚年享福。' : shenShiAnalysis.details.find(d => d.name === '伤官')?.power && shenShiAnalysis.details.find(d => d.name === '伤官')!.power > 50 ? '伤官旺盛，子女个性较强，需注重教育方式，培养其品行。' : '子女缘分平稳，注重子女教育，陪伴成长，自有福报。'}`,
    ``,
    `### 家庭运势`,
    ``,
    `综合四柱与十神分析，命主家庭运势${shenShiAnalysis.details.find(d => d.name === '正财')?.power && shenShiAnalysis.details.find(d => d.name === '正财')!.power > 50 ? '较好，家庭经济基础稳固，夫妻感情和睦，子女孝顺有出息。' : '平稳，需夫妻共同经营，注重家庭沟通，方能家庭和睦。'}`,
    ``,
    `### 晚年运`,
    ``,
    `时柱为晚年宫位。时柱${sixLines.hour.gan}${sixLines.hour.zhi}（${sixLines.hour.naYin}）。`,
    ``,
    `${shenShiAnalysis.details.find(d => d.name === '食神')?.power && shenShiAnalysis.details.find(d => d.name === '食神')!.power > 50 ? '食神在时柱，晚年福禄双全，儿孙绕膝，安享天伦。' : shenShiAnalysis.details.find(d => d.name === '正官')?.power && shenShiAnalysis.details.find(d => d.name === '正官')!.power > 50 ? '官星在时柱，晚年地位尊崇，受人敬重。' : '晚年运势平稳，宜提前规划养老，保持身心健康，自然安享晚年。'}`,
  ]
  return lines.join('\n')
}

// P1: 新增章节 — 贵人分析（贵人类型、方向、生肖、行业、小人提醒）
function generateChapter18_noble(input: FullReportInput): string {
  const { xiYongShen, shenSha, shenShiAnalysis } = input
  const bestEl = xiYongShen.bestElement
  const nobleDirectionMap: Record<string, string> = {
    '木': '东方、东南方',
    '火': '南方',
    '土': '中央、东北方、西南方',
    '金': '西方、西北方',
    '水': '北方',
  }
  const nobleZodiacMap: Record<string, string[]> = {
    '木': ['虎', '兔', '猫'],
    '火': ['蛇', '马'],
    '土': ['牛', '龙', '羊', '狗'],
    '金': ['猴', '鸡'],
    '水': ['鼠', '猪'],
  }
  const nobleIndustryMap: Record<string, string[]> = {
    '木': ['林业', '木材', '家具', '纺织', '服装', '教育', '文化', '出版', '医药', '宗教'],
    '火': ['能源', '电力', '光学', '电子', '餐饮', '食品', '美容', '化妆品', '摄影', '娱乐'],
    '土': ['房地产', '建筑', '建材', '陶瓷', '石材', '农业', '畜牧', '保险', '仓储', '殡葬'],
    '金': ['金融', '银行', '证券', '机械', '汽车', '五金', '刀具', '珠宝', '钟表', '武术'],
    '水': ['航运', '水产', '旅游', '酒店', '贸易', '物流', '清洁', '饮料', '酒类', '信息'],
  }
  const lines: string[] = [
    `## 十八、贵人分析`,
    ``,
    `### 贵人类型`,
    ``,
    `命主喜用神为${bestEl}，故贵人多出现于${bestEl}行相关领域。`,
    ``,
    `${shenShiAnalysis.details.find(d => d.name === '正官')?.power && shenShiAnalysis.details.find(d => d.name === '正官')!.power > 50 ? '命带官星，贵人多为领导、上司、长辈，能在事业上给予提拔。' : ''}`,
    `${shenShiAnalysis.details.find(d => d.name === '正印')?.power && shenShiAnalysis.details.find(d => d.name === '正印')!.power > 50 ? '印星有力，贵人多为老师、学者、长辈，能在学业与思想上给予指点。' : ''}`,
    `${shenShiAnalysis.details.find(d => d.name === '食神')?.power && shenShiAnalysis.details.find(d => d.name === '食神')!.power > 50 ? '食神吐秀，贵人多为同事、朋友、晚辈，能在创意与人脉上给予帮助。' : ''}`,
    ``,
    `### 贵人方向`,
    ``,
    `贵方位于：**${nobleDirectionMap[bestEl] || '四方皆有'}**。出行、办公、求贵人，宜朝此方位。`,
    ``,
    `### 贵人生肖`,
    ``,
    `贵人生肖：**${(nobleZodiacMap[bestEl] || []).join('、')}**。在人际交往中，与这些生肖的人合作或交往，易得助力。`,
    ``,
    `### 贵人行业`,
    ``,
    `贵人所在行业：`,
    ...((nobleIndustryMap[bestEl] || []).map(ind => `- ${ind}`)),
    ``,
    `### 小人提醒`,
    ``,
    `命局忌神为${xiYongShen.avoidedElements.join('、')}，此五行旺盛之人易为小人，需谨慎交往。`,
    ``,
    `${shenShiAnalysis.details.find(d => d.name === '劫财')?.power && shenShiAnalysis.details.find(d => d.name === '劫财')!.power > 50 ? '劫财旺盛，易因朋友、合伙人破财，合伙需谨慎，借贷需担保。' : ''}`,
    `${shenShiAnalysis.details.find(d => d.name === '伤官')?.power && shenShiAnalysis.details.find(d => d.name === '伤官')!.power > 50 ? '伤官旺盛，易因口舌是非得罪小人，宜谨言慎行，低调做人。' : ''}`,
    `${shenShiAnalysis.details.find(d => d.name === '偏官')?.power && shenShiAnalysis.details.find(d => d.name === '偏官')!.power > 50 ? '七杀旺盛，易招小人暗算，需提高警惕，凡事留有余地。' : ''}`,
  ]
  return lines.join('\n')
}

// P1: 新增章节 — 学业分析（学习能力、考试运、学历潜力、发展方向）
function generateChapter19_study(input: FullReportInput): string {
  const { shenShiAnalysis, dayMaster, xiYongShen } = input
  const yinPower = shenShiAnalysis.details.find(d => d.name === '正印')?.power || 0
  const pianYinPower = shenShiAnalysis.details.find(d => d.name === '偏印')?.power || 0
  const totalYin = yinPower + pianYinPower
  const lines: string[] = [
    `## 十九、学业分析`,
    ``,
    `### 学习能力`,
    ``,
    `印星主学业。命主正印力量${yinPower}分，偏印力量${pianYinPower}分，印星总力量${totalYin}分。`,
    ``,
    `${totalYin > 60 ? '印星有力，学习能力强，领悟力高，善于吸收新知识，适合深造。' : totalYin > 30 ? '印星力量中等，学习能力尚可，需勤勉努力，方能有所成就。' : '印星力量较弱，学习需付出更多努力，宜选择实用型学科，扬长避短。'}`,
    ``,
    `### 考试运`,
    ``,
    `${totalYin > 60 ? '考试运佳，逢印星大运流年，考试顺利，金榜题名。' : totalYin > 30 ? '考试运平稳，需踏实备考，不可侥幸。' : '考试运一般，需加倍努力，把握印星流年考试。'}`,
    ``,
    `### 学历潜力`,
    ``,
    `${totalYin > 70 ? '学历潜力高，可攻读至硕士、博士，适合学术研究。' : totalYin > 50 ? '学历潜力中上，可攻读至本科、硕士，适合专业技术。' : totalYin > 30 ? '学历潜力中等，可完成本科教育，注重实用技能。' : '学历潜力一般，宜注重实用技能，职业教育亦可成才。'}`,
    ``,
    `### 适合发展方向`,
    ``,
    `${dayMaster.dayGanElement === '木' ? '适合教育、文化、出版、医药、宗教、哲学等方向。' : ''}${dayMaster.dayGanElement === '火' ? '适合电子、能源、光学、传媒、艺术、心理学等方向。' : ''}${dayMaster.dayGanElement === '土' ? '适合建筑、房地产、农业、地理、历史、考古等方向。' : ''}${dayMaster.dayGanElement === '金' ? '适合金融、机械、法律、军事、武术、精密仪器等方向。' : ''}${dayMaster.dayGanElement === '水' ? '适合哲学、数学、物理、信息、传播、旅游等方向。' : ''}`,
    ``,
    `喜用神为${xiYongShen.bestElement}，选择与喜用神五行相关的专业与方向，更能发挥潜能，事半功倍。`,
  ]
  return lines.join('\n')
}

export function generateFullReport(input: FullReportInput): FullReportResult {
  const chapters: ReportChapter[] = [
    { id: 'overview', title: '命局概况', content: generateChapter1_overview(input) },
    { id: 'life-overview', title: '人生总论', content: generateChapter15_lifeOverview(input) },
    { id: 'wangshuai', title: '旺衰分析', content: generateChapter2_wangshuai(input) },
    { id: 'geju', title: '格局分析', content: generateChapter3_geju(input) },
    { id: 'shishen', title: '十神分析', content: generateChapter4_shishen(input) },
    { id: 'personality', title: '性格分析', content: generateChapter16_personality(input) },
    { id: 'shensha', title: '神煞分析', content: generateChapter5_shensha(input) },
    { id: 'xiyong', title: '喜用神', content: generateChapter6_xiyong(input) },
    { id: 'study', title: '学业分析', content: generateChapter19_study(input) },
    { id: 'career', title: '事业分析', content: generateChapter9_career(input) },
    { id: 'wealth', title: '财富分析', content: generateChapter8_wealth(input) },
    { id: 'marriage', title: '婚姻分析', content: generateChapter7_marriage(input) },
    { id: 'health', title: '健康分析', content: generateChapter10_health(input) },
    { id: 'family', title: '家庭分析', content: generateChapter17_family(input) },
    { id: 'noble', title: '贵人分析', content: generateChapter18_noble(input) },
    { id: 'dayun', title: '大运分析', content: generateChapter11_dayun(input) },
    { id: 'liunian', title: '流年分析', content: generateChapter12_liunian(input) },
    { id: 'liuyue', title: '流月分析', content: generateChapter14_liuyue(input) },
    { id: 'suggestions', title: '改运建议', content: generateChapter13_suggestions(input) },
  ]

  const fullText = chapters.map(c => c.content).join('\n\n')
  const wordCount = fullText.length

  return {
    title: `${input.dayMaster.dayGan}${input.dayMaster.dayGanElement}日主完整命书`,
    subtitle: `${input.sixLines.year.gan}${input.sixLines.year.zhi}年 ${input.sixLines.month.gan}${input.sixLines.month.zhi}月 ${input.sixLines.day.gan}${input.sixLines.day.zhi}日 ${input.sixLines.hour.gan}${input.sixLines.hour.zhi}时`,
    chapters,
    wordCount,
  }
}
