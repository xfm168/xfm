/**
 * 玄风门 V4.3 — 行业匹配系统模块
 *
 * 基于八字命局中的喜用神五行、十神组合、格局和大运走向，
 * 从 55 个细分行业中推荐最匹配的职业方向，按匹配度排序。
 */

import type { BaZiChart, FiveElement, ShenShi } from './types'
import { getStemElement, getBranchElement } from '@/lib/core'

// ──────────────────────── 类型定义 ────────────────────────

export interface IndustryRecommendation {
  name: string                   // 行业名称
  category: string               // 大类
  matchScore: number             // 0-100
  reasons: string[]              // 推荐理由 2-3 条
  riskNote?: string              // 风险提示
  fiveElementAffinity: string   // 五行属性
}

export interface CareerRecommendResult {
  industries: IndustryRecommendation[]  // 按匹配度排序
  topPicks: string[]                     // Top 5 行业名称
  summary: string                        // 总述约 200 字
}

// ──────────────────────── 55 个行业数据 ────────────────────────

interface IndustryDef {
  name: string
  category: string
  element: FiveElement
  shiShenBonus: Partial<Record<ShenShi, number>>
  geJuBonus: Partial<Record<string, number>>
  tags: string[]
  riskNote?: string
}

const INDUSTRY_DATABASE: IndustryDef[] = [
  // ===== 木属性行业（12 个） =====
  { name: '教育', category: '教育', element: '木', shiShenBonus: { '正印': 20, '食神': 15 }, geJuBonus: { '食神格': 15, '正印格': 15 }, tags: ['文化', '传授', '育人'], riskNote: '竞争激烈，需持续进修' },
  { name: '培训', category: '教育', element: '木', shiShenBonus: { '食神': 18, '伤官': 15, '正印': 10 }, geJuBonus: { '食神格': 15 }, tags: ['技能', '成长', '知识付费'] },
  { name: '出版', category: '传媒', element: '木', shiShenBonus: { '正印': 18, '食神': 15, '偏印': 10 }, geJuBonus: { '正印格': 12 }, tags: ['图书', '编辑', '内容'] },
  { name: '林业', category: '农业', element: '木', shiShenBonus: { '比肩': 12, '正财': 10 }, geJuBonus: {}, tags: ['种植', '生态', '绿化'] },
  { name: '家具', category: '制造', element: '木', shiShenBonus: { '正财': 12, '比肩': 10 }, geJuBonus: {}, tags: ['家居', '设计', '生产'] },
  { name: '文具', category: '零售', element: '木', shiShenBonus: { '正财': 12, '正印': 10 }, geJuBonus: {}, tags: ['办公用品', '文具用品'] },
  { name: '环保', category: '公共服务', element: '木', shiShenBonus: { '正官': 12, '正印': 10 }, geJuBonus: { '正官格': 10 }, tags: ['生态', '可持续发展'] },
  { name: '农业', category: '农业', element: '木', shiShenBonus: { '正财': 15, '比肩': 10 }, geJuBonus: {}, tags: ['种植', '养殖', '农产品'] },
  { name: '中医药', category: '医疗', element: '木', shiShenBonus: { '正印': 18, '食神': 12 }, geJuBonus: { '正印格': 15 }, tags: ['中医', '中药', '养生'] },
  { name: '设计', category: '创意', element: '木', shiShenBonus: { '食神': 20, '伤官': 18, '偏印': 12 }, geJuBonus: { '食神格': 15, '伤官配印格': 18 }, tags: ['平面设计', 'UI设计', '工业设计'] },
  { name: '花艺', category: '服务', element: '木', shiShenBonus: { '食神': 15, '正财': 10 }, geJuBonus: {}, tags: ['花卉', '装饰', '审美'] },
  { name: '纸业', category: '制造', element: '木', shiShenBonus: { '正财': 12, '比肩': 10 }, geJuBonus: {}, tags: ['造纸', '包装', '印刷材料'] },

  // ===== 火属性行业（12 个） =====
  { name: '互联网', category: '互联网', element: '火', shiShenBonus: { '伤官': 18, '偏印': 15, '食神': 12 }, geJuBonus: { '伤官配印格': 18 }, tags: ['技术', '平台', '在线服务'] },
  { name: '电商', category: '互联网', element: '火', shiShenBonus: { '偏财': 18, '伤官': 15, '食神': 12 }, geJuBonus: {}, tags: ['在线零售', '平台运营'] },
  { name: '自媒体', category: '传媒', element: '火', shiShenBonus: { '食神': 20, '伤官': 18 }, geJuBonus: { '食神格': 15 }, tags: ['内容创作', '短视频', '直播'] },
  { name: '人工智能', category: '互联网', element: '火', shiShenBonus: { '偏印': 20, '伤官': 15, '食神': 12 }, geJuBonus: { '偏印格': 18 }, tags: ['AI', '机器学习', '深度学习'] },
  { name: '电信', category: '通信', element: '火', shiShenBonus: { '正官': 12, '偏印': 10 }, geJuBonus: { '正官格': 10 }, tags: ['通信服务', '运营商'] },
  { name: '餐饮', category: '服务', element: '火', shiShenBonus: { '食神': 20, '偏财': 12, '正财': 10 }, geJuBonus: { '食神格': 18 }, tags: ['美食', '餐饮管理', '连锁'] },
  { name: '影视', category: '传媒', element: '火', shiShenBonus: { '食神': 18, '伤官': 18, '偏印': 10 }, geJuBonus: { '食神格': 15 }, tags: ['电影', '电视', '短视频制作'] },
  { name: '传媒', category: '传媒', element: '火', shiShenBonus: { '伤官': 15, '食神': 12, '正印': 10 }, geJuBonus: {}, tags: ['新闻', '媒体', '公关'] },
  { name: '广告', category: '创意', element: '火', shiShenBonus: { '伤官': 20, '食神': 15 }, geJuBonus: { '伤官配印格': 15 }, tags: ['品牌', '营销', '创意'] },
  { name: '照明', category: '制造', element: '火', shiShenBonus: { '正财': 12, '比肩': 10 }, geJuBonus: {}, tags: ['灯具', '光电', 'LED'] },
  { name: '电子烟', category: '消费品', element: '火', shiShenBonus: { '偏财': 15, '伤官': 10 }, geJuBonus: {}, tags: ['消费品', '新型行业'], riskNote: '政策风险较大' },
  { name: '新能源', category: '能源', element: '火', shiShenBonus: { '偏印': 12, '偏财': 12, '正官': 10 }, geJuBonus: {}, tags: ['太阳能', '储能', '碳中和'] },

  // ===== 土属性行业（11 个） =====
  { name: '房地产', category: '房地产', element: '土', shiShenBonus: { '正财': 18, '正印': 12, '比肩': 10 }, geJuBonus: { '正财格': 15 }, tags: ['开发', '销售', '物业管理'], riskNote: '受政策影响大，周期性强' },
  { name: '建筑', category: '建筑', element: '土', shiShenBonus: { '比肩': 15, '正财': 12, '偏印': 10 }, geJuBonus: {}, tags: ['工程', '施工', '基建'] },
  { name: '矿业', category: '资源', element: '土', shiShenBonus: { '正财': 15, '比肩': 12, '偏官': 10 }, geJuBonus: {}, tags: ['采矿', '资源开发'], riskNote: '受资源价格和政策影响大' },
  { name: '农业种植', category: '农业', element: '土', shiShenBonus: { '正财': 15, '比肩': 10, '食神': 8 }, geJuBonus: {}, tags: ['粮食', '经济作物', '现代农业'] },
  { name: '仓储', category: '物流', element: '土', shiShenBonus: { '正财': 12, '比肩': 10 }, geJuBonus: {}, tags: ['仓库管理', '供应链'] },
  { name: '物流', category: '物流', element: '土', shiShenBonus: { '偏财': 12, '正财': 10, '比肩': 8 }, geJuBonus: {}, tags: ['快递', '配送', '货运'] },
  { name: '人力资源', category: '服务', element: '土', shiShenBonus: { '正官': 15, '正印': 12, '比肩': 8 }, geJuBonus: { '正官格': 12 }, tags: ['招聘', '猎头', '企业管理'] },
  { name: '酒店', category: '服务', element: '土', shiShenBonus: { '正财': 15, '食神': 12 }, geJuBonus: {}, tags: ['住宿', '酒店管理', '民宿'] },
  { name: '旅游', category: '服务', element: '土', shiShenBonus: { '食神': 12, '偏财': 12, '正财': 10 }, geJuBonus: {}, tags: ['旅行社', '导游', '景区'] },
  { name: '保险', category: '金融', element: '土', shiShenBonus: { '正印': 12, '正官': 12, '偏财': 10 }, geJuBonus: { '正官格': 10 }, tags: ['寿险', '财险', '保险经纪'] },
  { name: '法律', category: '专业服务', element: '土', shiShenBonus: { '正官': 20, '伤官': 12 }, geJuBonus: { '正官格': 18 }, tags: ['律师', '法务', '知识产权'] },

  // ===== 金属性行业（11 个） =====
  { name: '金融', category: '金融', element: '金', shiShenBonus: { '偏财': 20, '正财': 15, '偏官': 10 }, geJuBonus: { '偏财格': 18 }, tags: ['银行', '证券', '基金'] },
  { name: '银行', category: '金融', element: '金', shiShenBonus: { '正财': 18, '正官': 15 }, geJuBonus: { '正官格': 15, '正财格': 15 }, tags: ['存贷', '理财', '信贷'] },
  { name: '证券', category: '金融', element: '金', shiShenBonus: { '偏财': 20, '偏官': 12, '伤官': 10 }, geJuBonus: { '偏财格': 18 }, tags: ['股票', '债券', '期货'], riskNote: '风险较高，需专业知识' },
  { name: '投资', category: '金融', element: '金', shiShenBonus: { '偏财': 22, '偏官': 12, '食神': 8 }, geJuBonus: { '偏财格': 20 }, tags: ['VC', 'PE', '天使投资'], riskNote: '高风险高回报' },
  { name: '审计', category: '专业服务', element: '金', shiShenBonus: { '正官': 18, '正印': 12 }, geJuBonus: { '正官格': 15 }, tags: ['会计', '财务审计', '税务'] },
  { name: '医疗器械', category: '医疗', element: '金', shiShenBonus: { '偏印': 15, '正财': 12, '偏官': 10 }, geJuBonus: {}, tags: ['设备', '诊断', '康复器械'] },
  { name: '汽车', category: '制造', element: '金', shiShenBonus: { '正财': 14, '偏官': 12, '比肩': 10 }, geJuBonus: {}, tags: ['整车', '零部件', '新能源车'] },
  { name: '制造业', category: '制造', element: '金', shiShenBonus: { '比肩': 14, '正财': 12, '偏印': 10 }, geJuBonus: {}, tags: ['工厂', '生产', '质量管理'] },
  { name: 'IT硬件', category: '互联网', element: '金', shiShenBonus: { '偏印': 18, '比肩': 12, '伤官': 10 }, geJuBonus: { '偏印格': 12 }, tags: ['芯片', '服务器', '硬件工程'] },
  { name: '珠宝', category: '零售', element: '金', shiShenBonus: { '正财': 15, '偏财': 12 }, geJuBonus: {}, tags: ['黄金', '钻石', '奢侈品'] },
  { name: '钟表', category: '制造', element: '金', shiShenBonus: { '偏印': 15, '正财': 12 }, geJuBonus: {}, tags: ['精密制造', '奢侈品'] },

  // ===== 水属性行业（12 个，含与土交叉但侧重不同的行业） =====
  { name: '贸易', category: '贸易', element: '水', shiShenBonus: { '偏财': 18, '伤官': 12, '劫财': 10 }, geJuBonus: { '偏财格': 15 }, tags: ['进出口', '跨境贸易', '批发'] },
  { name: '物流航运', category: '物流', element: '水', shiShenBonus: { '偏财': 14, '比肩': 10 }, geJuBonus: {}, tags: ['海运', '空运', '货运代理'] },
  { name: '水利', category: '公共服务', element: '水', shiShenBonus: { '正官': 15, '正印': 12 }, geJuBonus: { '正官格': 12 }, tags: ['水利建设', '水务', '防洪'] },
  { name: '渔业', category: '农业', element: '水', shiShenBonus: { '正财': 12, '比肩': 10 }, geJuBonus: {}, tags: ['水产', '养殖', '捕捞'] },
  { name: '咨询', category: '专业服务', element: '水', shiShenBonus: { '偏印': 18, '伤官': 15, '正官': 10 }, geJuBonus: { '偏印格': 15 }, tags: ['管理咨询', '战略咨询', '技术咨询'] },
  { name: '通信', category: '通信', element: '水', shiShenBonus: { '偏印': 15, '正官': 10 }, geJuBonus: {}, tags: ['通信设备', '网络', '5G'] },
  { name: '心理学', category: '医疗', element: '水', shiShenBonus: { '正印': 20, '偏印': 15 }, geJuBonus: { '正印格': 18 }, tags: ['心理咨询', '治疗', '研究'] },
  { name: '饮品', category: '消费品', element: '水', shiShenBonus: { '食神': 18, '正财': 12, '偏财': 10 }, geJuBonus: { '食神格': 12 }, tags: ['茶饮', '酒类', '饮料'] },
  { name: '运输', category: '物流', element: '水', shiShenBonus: { '偏财': 12, '比肩': 10, '正财': 8 }, geJuBonus: {}, tags: ['货运', '客运', '铁路'] },
  { name: '美容', category: '服务', element: '水', shiShenBonus: { '食神': 18, '伤官': 12 }, geJuBonus: { '食神格': 12 }, tags: ['护肤', '美甲', '医美'] },
  { name: '游戏', category: '互联网', element: '水', shiShenBonus: { '食神': 20, '伤官': 18, '偏印': 12 }, geJuBonus: { '食神格': 18, '伤官配印格': 18 }, tags: ['游戏开发', '游戏运营', '电竞'] },
  { name: '慈善公益', category: '公共服务', element: '水', shiShenBonus: { '正印': 18, '正官': 12 }, geJuBonus: { '正印格': 15 }, tags: ['公益', '基金会', '社工'] },
]

// ──────────────────────── 辅助函数 ────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * 从命局四柱提取十神分布（简化版：统计天干十神出现次数）
 */
function extractShiShenProfile(chart: BaZiChart): Record<ShenShi, number> {
  const dayGanElement = chart.dayMaster.dayGanElement
  const stems = [
    chart.sixLines.year.gan,
    chart.sixLines.month.gan,
    chart.sixLines.hour.gan,
  ]

  const WUXING_SHENG: Record<FiveElement, FiveElement> = {
    '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
  }
  const WUXING_KE: Record<FiveElement, FiveElement> = {
    '木': '土', '火': '金', '土': '水', '金': '木', '水': '火',
  }

  const getShenShiType = (targetElement: FiveElement, samePolarity: boolean): ShenShi | null => {
    if (targetElement === dayGanElement) return samePolarity ? '比肩' : '劫财'
    if (targetElement === WUXING_SHENG[dayGanElement]) return samePolarity ? '食神' : '伤官'
    if (targetElement === WUXING_KE[dayGanElement]) return samePolarity ? '偏财' : '正财'
    if (WUXING_SHENG[targetElement] === dayGanElement) return samePolarity ? '偏印' : '正印'
    if (WUXING_KE[targetElement] === dayGanElement) return samePolarity ? '偏官' : '正官'
    return null
  }

  const dayYinYang = (dayGanElement === '木' || dayGanElement === '火' || dayGanElement === '水') ? '阳' : '阴'

  const profile: Record<ShenShi, number> = {
    '比肩': 0, '劫财': 0, '食神': 0, '伤官': 0,
    '偏财': 0, '正财': 0, '偏官': 0, '正官': 0,
    '偏印': 0, '正印': 0,
  }

  for (const stem of stems) {
    const element = getStemElement(stem)
    const yinYang = (['甲', '丙', '戊', '庚', '壬'] as string[]).includes(stem) ? '阳' : '阴'
    const samePolarity = dayYinYang === yinYang
    const shiShen = getShenShiType(element, samePolarity)
    if (shiShen) profile[shiShen]++
  }

  return profile
}

/**
 * 获取当前大运信息
 */
function getCurrentDaYun(daYun: any): { gan: string; zhi: string; startYear: number; endYear: number; isXi: boolean } | null {
  if (!daYun) return null
  if (daYun.steps && daYun.currentStepIndex !== undefined) {
    const step = daYun.steps[daYun.currentStepIndex]
    if (!step) return null
    return {
      gan: step.ganZhi.gan,
      zhi: step.ganZhi.zhi,
      startYear: step.startYear,
      endYear: step.endYear,
      isXi: step.isXi,
    }
  }
  if (daYun.ganZhi) {
    return {
      gan: daYun.ganZhi.gan,
      zhi: daYun.ganZhi.zhi,
      startYear: daYun.startYear || 2020,
      endYear: daYun.endYear || 2030,
      isXi: daYun.isXi ?? false,
    }
  }
  return null
}

/**
 * 判断大运五行是否匹配某个行业
 */
function daYunMatchesIndustry(daYun: ReturnType<typeof getCurrentDaYun>, industryElement: FiveElement): boolean {
  if (!daYun) return false
  const daYunElement = getStemElement(daYun.gan as any) || getBranchElement(daYun.zhi as any)
  return daYunElement === industryElement
}

// ──────────────────────── 匹配算法 ────────────────────────

/**
 * 行业推荐主函数
 * @param chart      八字命盘
 * @param xiYongShen 喜用神信息（可选，默认使用 chart 内的）
 * @param geJu       格局信息（可选，默认从 chart 推断）
 */
export function recommendIndustries(
  chart: BaZiChart,
  xiYongShen?: any,
  geJu?: any,
): CareerRecommendResult {
  const xiYong = xiYongShen || chart.xiYongShen
  const geJuData = geJu || null
  const curDaYun = getCurrentDaYun(null) // 大运参数可选
  const shiShenProfile = extractShiShenProfile(chart)

  // 找出命局中力量排名前三的十神
  const topShiShen = (Object.entries(shiShenProfile) as [ShenShi, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name]) => name)

  // 格局名称（如果有）
  const geJuName = geJuData?.name || null
  const geJuCategory = geJuData?.category || null

  // ── 逐行业计算匹配分 ──
  const scoredIndustries: IndustryRecommendation[] = INDUSTRY_DATABASE.map(industry => {
    let score = 40 // 基础分

    // 1. 喜用神五行 → 对应行业组基础分
    if (xiYong.bestElement === industry.element) {
      score += 20 // 喜神五行匹配
    }
    if (xiYong.usage === industry.element) {
      score += 5 // 用神五行额外加分
    }
    if (xiYong.avoidedElements?.includes(industry.element)) {
      score -= 15 // 忌神五行扣分
    }

    // 2. 十神组合 → 加分/减分
    for (const ss of topShiShen) {
      const bonus = industry.shiShenBonus[ss]
      if (bonus) {
        score += bonus
      }
    }

    // 3. 格局 → 加分
    if (geJuName && industry.geJuBonus[geJuName]) {
      score += industry.geJuBonus[geJuName]
    }

    // 4. 大运近期 → 加分
    // 此处大运参数为外部可选，若未传入则不加
    // （调用方可传入 daYun 参数）

    score = clamp(Math.round(score), 5, 98)

    // 生成推荐理由
    const reasons = generateReasons(industry, chart, xiYong, topShiShen, geJuName)

    return {
      name: industry.name,
      category: industry.category,
      matchScore: score,
      reasons,
      riskNote: industry.riskNote,
      fiveElementAffinity: industry.element,
    }
  })

  // ── 按匹配度排序 ──
  scoredIndustries.sort((a, b) => b.matchScore - a.matchScore)

  // ── Top 5 ──
  const topPicks = scoredIndustries.slice(0, 5).map(ind => ind.name)

  // ── 总述 ──
  const summary = generateRecommendSummary(chart, xiYong, topPicks, topShiShen, geJuName)

  return {
    industries: scoredIndustries,
    topPicks,
    summary,
  }
}

// ──────────────────────── 推荐理由生成 ────────────────────────

function generateReasons(
  industry: IndustryDef,
  chart: BaZiChart,
  xiYong: any,
  topShiShen: ShenShi[],
  geJuName: string | null,
): string[] {
  const reasons: string[] = []
  const dayElement = chart.dayMaster.dayGanElement

  // 喜用神匹配
  if (xiYong.bestElement === industry.element) {
    reasons.push(`行业五行属${industry.element}，与您的喜神五行${xiYong.bestElement}高度契合，有助于事业发展。`)
  }
  if (xiYong.usage === industry.element) {
    reasons.push(`该行业五行与用神一致，是发挥您核心优势的最佳领域。`)
  }

  // 十神匹配
  for (const ss of topShiShen) {
    if (industry.shiShenBonus[ss] && industry.shiShenBonus[ss]! >= 15) {
      const shiShenDescMap: Partial<Record<ShenShi, string>> = {
        '正官': '管理规范、体制稳定',
        '偏官': '开拓进取、竞争魄力',
        '正印': '学习能力强、贵人运旺',
        '偏印': '技术专精、研究能力突出',
        '食神': '才华横溢、创意丰富',
        '伤官': '创新能力出众、表达力强',
        '正财': '踏实稳健、善于经营',
        '偏财': '商业嗅觉敏锐、善于投资',
        '比肩': '团队合作能力强',
        '劫财': '竞争意识强、敢于冒险',
      }
      reasons.push(`命局中${ss}力量突出（${shiShenDescMap[ss] || ''}），与${industry.name}行业特质高度匹配。`)
    }
  }

  // 格局匹配
  if (geJuName && industry.geJuBonus[geJuName]) {
    reasons.push(`您的命局格局为${geJuName}，与${industry.name}行业天然相合。`)
  }

  // 至少保证 2 条理由
  if (reasons.length === 0) {
    reasons.push(`${industry.name}行业五行属${industry.element}，与日主${dayElement}命存在一定的相生相克关系。`)
    reasons.push(`综合十神与格局分析，${industry.name}可作为备选发展方向。`)
  }

  return reasons.slice(0, 3)
}

// ──────────────────────── 总述生成 ────────────────────────

function generateRecommendSummary(
  chart: BaZiChart,
  xiYong: any,
  topPicks: string[],
  topShiShen: ShenShi[],
  geJuName: string | null,
): string {
  const dayElement = chart.dayMaster.dayGanElement

  const shiShenCareerMap: Partial<Record<ShenShi, string>> = {
    '正官': '管理/体制方向',
    '偏官': '开拓/创业方向',
    '正印': '学术/教育方向',
    '偏印': '技术/研发方向',
    '食神': '创意/艺术方向',
    '伤官': '创新/表达方向',
    '正财': '稳健经营方向',
    '偏财': '投资/商业方向',
    '比肩': '合作/团队方向',
    '劫财': '竞争/冒险方向',
  }

  const topDirections = topShiShen.map(ss => shiShenCareerMap[ss]).filter(Boolean).join('、')
  const geJuStr = geJuName ? `，格局为${geJuName}` : ''

  return `日主${dayElement}命，喜用神为${xiYong.bestElement}（${xiYong.usage ? `用神${xiYong.usage}` : '综合判断'}）${geJuStr}。命局十神以${topShiShen.join('、')}为主力，职业倾向为${topDirections}。

综合五行喜忌、十神组合与格局分析，最推荐的五大行业为：${topPicks.join('、')}。建议优先选择与喜用神五行一致的行业，在命局优势十神对应的领域深耕，可事半功倍、事业顺遂。具体行业评分详见上方列表。`
}
