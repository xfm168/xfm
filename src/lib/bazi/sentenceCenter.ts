/**
 * 统一断语中心 (Sentence Center) — 玄风门 V4.4
 *
 * 所有模块通过此中心获取断语，确保风格和术语一致。
 *
 * 核心约束：所有断语必须基于同一份 UnifiedAnalysisData 生成，
 * 不允许各模块自行拼装命理条件，从而避免术语冲突与结论不一致。
 *
 * 内部调用 masterSentence.ts 的 generateMasterSentences，
 * 但传入的 chart/geJu/xiYongShen/daYun 均来自统一分析中心，
 * 保证“同源数据 → 一致断语”。
 *
 * 典籍出处：《滴天髓》《穷通宝鉴》《三命通会》《渊海子平》《子平真诠》《命理约言》
 */

import { generateMasterSentences } from './masterSentence'
import type { UnifiedAnalysisData } from './analysisCenter'

// ========== 类型定义 ==========

/** 统一断语条目 */
export interface UnifiedSentence {
  /** 断语分类：strength/geju/tiaohou/yongshen/shishen/combination/shensha/dayun/liunian/relationship */
  category: string
  /** 断语文本 */
  text: string
  /** 典籍出处 */
  source: string
}

// ========== 分类标题映射（统一术语） ==========

const CATEGORY_TITLES: Record<string, string> = {
  strength: '日主旺衰',
  geju: '格局分析',
  tiaohou: '调候用神',
  yongshen: '喜用神',
  shishen: '十神配置',
  combination: '合化冲克',
  shensha: '神煞吉凶',
  dayun: '大运走势',
  liunian: '流年吉凶',
  relationship: '六亲婚姻',
}

/** 获取分类的统一中文标题 */
export function getCategoryTitle(category: string): string {
  return CATEGORY_TITLES[category] || category
}

// ========== 核心函数 ==========

/**
 * 根据统一分析数据生成断语。
 *
 * 内部调用 generateMasterSentences，但 chart/geJu/xiYongShen/daYun
 * 全部取自 UnifiedAnalysisData，确保所有断语基于同一份数据。
 */
export function generateUnifiedSentences(data: UnifiedAnalysisData): UnifiedSentence[] {
  const result = generateMasterSentences(
    data.chart,
    data.raw.geJu,
    data.raw.xiYongShen,
    data.raw.daYun,
  )

  return result.sentences.map(item => ({
    category: item.category,
    text: item.title ? `${item.title}：${item.text}` : item.text,
    source: item.source,
  }))
}

/**
 * 按类别获取断语。
 * @param data 统一分析数据
 * @param category 断语分类（如 'geju'、'yongshen'、'dayun'）
 */
export function getSentencesByCategory(
  data: UnifiedAnalysisData,
  category: string,
): UnifiedSentence[] {
  return generateUnifiedSentences(data).filter(s => s.category === category)
}

/**
 * 获取综合断语摘要（约 500 字）。
 *
 * 优先使用断语引擎生成的 summary；若为空，则按分类顺序自动拼装，
 * 保证即使模板未命中也能给出基于统一数据的统一表述。
 */
export function getSentenceSummary(data: UnifiedAnalysisData): string {
  const result = generateMasterSentences(
    data.chart,
    data.raw.geJu,
    data.raw.xiYongShen,
    data.raw.daYun,
  )

  if (result.summary && result.summary.trim().length > 0) {
    return result.summary
  }

  // 兜底：按分类顺序拼装统一摘要
  const sentences = generateUnifiedSentences(data)
  if (sentences.length === 0) {
    return buildFallbackSummary(data)
  }

  const byCategory = new Map<string, UnifiedSentence[]>()
  for (const s of sentences) {
    const list = byCategory.get(s.category) || []
    list.push(s)
    byCategory.set(s.category, list)
  }

  const parts: string[] = []
  for (const category of Object.keys(CATEGORY_TITLES)) {
    const list = byCategory.get(category)
    if (!list || list.length === 0) continue
    parts.push(`【${getCategoryTitle(category)}】${list.map(s => s.text).join('；')}。`)
  }

  return parts.length > 0 ? parts.join('\n') : buildFallbackSummary(data)
}

/** 兜底摘要：直接基于统一数据摘要字段生成，确保始终有输出 */
function buildFallbackSummary(data: UnifiedAnalysisData): string {
  const dm = data.dayMaster
  const gj = data.geJu
  const xy = data.xiYongShen
  const th = data.tiaoHou
  return [
    `【日主旺衰】${dm.description}`,
    `【格局分析】${gj.broken ? '格局有破，' : ''}${gj.description}`,
    `【喜用神】首取${xy.bestElement}为用，喜${xy.happiness.join('、')}，忌${xy.avoidedElements.join('、')}。${xy.description}`,
    th.isDominant ? `【调候用神】${th.description}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export default generateUnifiedSentences
