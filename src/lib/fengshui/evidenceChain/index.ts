/**
 * Evidence Chain - 证据链
 * 
 * 结构：结论 → 命中 Rule → 引用古籍 → 为什么这样判断 → 改善依据 → 预计提升
 * 
 * 每条结论都有完整的证据链支持，让系统可信度大幅提高。
 */

import type { FengShuiRule } from '../rules/types'
import { knowledgeBase } from '../knowledge'

export interface EvidenceItem {
  /** 证据类型 */
  type: 'rule' | 'classical' | 'modern' | 'case' | 'data'
  
  /** 证据标题 */
  title: string
  
  /** 证据详情 */
  detail: string
  
  /** 证据来源 */
  source?: string
  
  /** 证据ID */
  refId?: string
  
  /** 可信度 0-100 */
  confidence?: number
}

export interface EvidenceChain {
  /** 结论ID */
  id: string
  
  /** 结论名称 */
  conclusion: string
  
  /** 结论类型 */
  type: 'auspicious' | 'inauspicious' | 'warning' | 'neutral'
  
  /** 严重程度 */
  severity: 'high' | 'medium' | 'low'
  
  /** 影响方面 */
  impact: {
    health?: number
    wealth?: number
    career?: number
    relationship?: number
    study?: number
  }
  
  /** 置信度 0-100 */
  confidence: number
  
  /** 命中的规则 */
  hitRule?: {
    id: string
    name: string
    category: string
    priority: number
    weight: number
  }
  
  /** 引用的古籍/文献 */
  references: EvidenceItem[]
  
  /** 判断逻辑说明 */
  reasoning: string
  
  /** 改善建议 */
  improvement: {
    suggestion: string
    method?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    costLevel?: 'low' | 'medium' | 'high'
  }
  
  /** 预计提升 */
  expectedImprovement: {
    overall: number
    health?: number
    wealth?: number
    career?: number
    relationship?: number
    study?: number
  }
  
  /** 相关案例 */
  relatedCases?: EvidenceItem[]
  
  /** 推荐植物/摆件 */
  recommendations?: {
    type: 'plant' | 'symbol' | 'color' | 'material'
    name: string
    reason: string
  }[]
}

/**
 * 从规则生成完整证据链
 */
export function buildEvidenceChain(rule: FengShuiRule, result?: any): EvidenceChain {
  const type = result?.type || rule.result?.type || 'neutral'
  const severity = calculateSeverity(rule)
  
  // 收集古籍引用
  const references: EvidenceItem[] = []
  
  if (rule.referenceIds && rule.referenceIds.length > 0) {
    for (const refId of rule.referenceIds) {
      const entry = knowledgeBase.getEntryById(refId) || knowledgeBase.getModernEntryById(refId)
      if (entry) {
        references.push({
          type: entry.bookName?.includes('现代') ? 'modern' : 'classical',
          title: entry.topic || rule.name,
          detail: entry.translation || entry.modern || entry.original || '',
          source: entry.bookName || '古籍',
          refId: refId,
          confidence: 85,
        })
      }
    }
  }
  
  // 补充来源
  if (rule.source && rule.source.length > 0) {
    for (const src of rule.source) {
      if (!references.some(r => r.source === src)) {
        references.push({
          type: 'classical',
          title: src,
          detail: `${src}中有相关记载`,
          source: src,
          confidence: 80,
        })
      }
    }
  }
  
  // 搜索相关案例
  const relatedCases: EvidenceItem[] = []
  if (rule.tags && rule.tags.length > 0) {
    const caseResults = knowledgeBase.search(rule.tags[0], 3)
    for (const c of caseResults) {
      if (c.type === 'case') {
        relatedCases.push({
          type: 'case',
          title: c.title || c.id,
          detail: c.description || '',
          source: '案例库',
          refId: c.id,
          confidence: 75,
        })
      }
    }
  }
  
  // 推荐植物/摆件
  const recommendations = buildRecommendations(rule)
  
  return {
    id: `ev-${rule.id}`,
    conclusion: rule.name,
    type: type as any,
    severity,
    impact: rule.impact || {},
    confidence: rule.confidence || 70,
    hitRule: {
      id: rule.id,
      name: rule.name,
      category: rule.category,
      priority: rule.priority || 50,
      weight: rule.weight || 50,
    },
    references,
    reasoning: buildReasoning(rule),
    improvement: {
      suggestion: rule.improvement || '建议咨询专业风水师',
      method: buildImprovementMethod(rule),
      difficulty: calculateDifficulty(rule),
      costLevel: calculateCostLevel(rule),
    },
    expectedImprovement: calculateExpectedImprovement(rule),
    relatedCases: relatedCases.length > 0 ? relatedCases : undefined,
    recommendations: recommendations.length > 0 ? recommendations : undefined,
  }
}

/**
 * 批量构建证据链
 */
export function buildEvidenceChains(rules: FengShuiRule[]): EvidenceChain[] {
  return rules.map(rule => buildEvidenceChain(rule))
}

/**
 * 生成证据链 Markdown 格式
 */
export function evidenceChainToMarkdown(chain: EvidenceChain): string {
  const typeEmoji = {
    auspicious: '✅',
    inauspicious: '⚠️',
    warning: '⚡',
    neutral: '📋',
  }
  
  const severityText = {
    high: '🔴 高',
    medium: '🟡 中',
    low: '🟢 低',
  }
  
  let md = `### ${typeEmoji[chain.type as keyof typeof typeEmoji] || '📋'} ${chain.conclusion}\n\n`
  
  md += `| 项目 | 说明 |\n|------|------|\n`
  md += `| 类型 | ${chain.type === 'auspicious' ? '吉' : chain.type === 'inauspicious' ? '凶' : chain.type === 'warning' ? '警告' : '中性'} |\n`
  md += `| 严重度 | ${severityText[chain.severity]} |\n`
  md += `| 置信度 | ${chain.confidence}% |\n`
  
  if (chain.impact && Object.keys(chain.impact).length > 0) {
    const impactStr = Object.entries(chain.impact)
      .map(([k, v]) => `${impactToChinese(k)}${(v as number) > 0 ? '+' : ''}${v}`)
      .join('、')
    md += `| 影响方面 | ${impactStr} |\n`
  }
  
  md += `\n---\n\n`
  
  // 命中规则
  if (chain.hitRule) {
    md += `**命中规则：** ${chain.hitRule.name} (${chain.hitRule.id})\n\n`
    md += `- 优先级：${chain.hitRule.priority}\n`
    md += `- 权重：${chain.hitRule.weight}\n\n`
  }
  
  // 判断逻辑
  md += `#### 判断逻辑\n\n${chain.reasoning}\n\n`
  
  // 古籍依据
  if (chain.references.length > 0) {
    md += `#### 古籍依据\n\n`
    chain.references.slice(0, 5).forEach((ref, idx) => {
      md += `${idx + 1}. **《${ref.source}》**\n`
      md += `   > ${ref.detail.slice(0, 100)}${ref.detail.length > 100 ? '...' : ''}\n\n`
    })
  }
  
  // 改善建议
  md += `#### 改善建议\n\n`
  md += `- **建议：** ${chain.improvement.suggestion}\n`
  md += `- **难度：** ${difficultyToText(chain.improvement.difficulty)}\n`
  md += `- **成本：** ${costToText(chain.improvement.costLevel)}\n\n`
  
  // 预计提升
  md += `#### 预计提升\n\n`
  md += `- **综合：** +${chain.expectedImprovement.overall} 分\n`
  if (chain.expectedImprovement.health) md += `- **健康：** +${chain.expectedImprovement.health} 分\n`
  if (chain.expectedImprovement.wealth) md += `- **财运：** +${chain.expectedImprovement.wealth} 分\n`
  if (chain.expectedImprovement.career) md += `- **事业：** +${chain.expectedImprovement.career} 分\n`
  if (chain.expectedImprovement.relationship) md += `- **感情：** +${chain.expectedImprovement.relationship} 分\n`
  
  // 推荐
  if (chain.recommendations && chain.recommendations.length > 0) {
    md += `\n#### 推荐\n\n`
    chain.recommendations.forEach(rec => {
      md += `- **${rec.name}**：${rec.reason}\n`
    })
  }
  
  // 相关案例
  if (chain.relatedCases && chain.relatedCases.length > 0) {
    md += `\n#### 相关案例\n\n`
    chain.relatedCases.forEach((c, idx) => {
      md += `${idx + 1}. ${c.title}\n`
    })
  }
  
  return md
}

// ========== 辅助函数 ==========

function calculateSeverity(rule: FengShuiRule): 'high' | 'medium' | 'low' {
  const priority = rule.priority || 50
  if (priority >= 80) return 'high'
  if (priority >= 60) return 'medium'
  return 'low'
}

function buildReasoning(rule: FengShuiRule): string {
  const type = (rule.result?.type || 'neutral') as string
  
  if (type === 'auspicious') {
    return `根据${rule.source?.join('、') || '风水理论'}，${rule.name}为吉格，` +
           `主要影响${formatImpact(rule.impact)}方面。` +
           `该结论优先级为${rule.priority || 50}，权重${rule.weight || 50}，` +
           `置信度${rule.confidence || 70}%。`
  } else if (type === 'inauspicious') {
    return `根据${rule.source?.join('、') || '风水理论'}，${rule.name}为凶格，` +
           `主要影响${formatImpact(rule.impact)}方面。` +
           `该结论优先级为${rule.priority || 50}，权重${rule.weight || 50}，` +
           `置信度${rule.confidence || 70}%。建议及时化解。`
  } else if (type === 'warning') {
    return `根据${rule.source?.join('、') || '风水理论'}，${rule.name}需要注意，` +
           `可能影响${formatImpact(rule.impact)}方面。` +
           `该结论优先级为${rule.priority || 50}，权重${rule.weight || 50}，` +
           `置信度${rule.confidence || 70}%。`
  }
  
  return `${rule.name}，置信度${rule.confidence || 70}%。`
}

function buildImprovementMethod(rule: FengShuiRule): string {
  if (rule.improvement) return rule.improvement
  
  const category = rule.category
  if (category?.includes('bed')) return '调整床位位置'
  if (category?.includes('door')) return '设置玄关或门帘'
  if (category?.includes('mirror')) return '移动镜子或遮盖'
  if (category?.includes('beam')) return '做吊顶或装饰化解'
  
  return '建议咨询专业风水师'
}

function calculateDifficulty(rule: FengShuiRule): 'easy' | 'medium' | 'hard' {
  const category = rule.category || ''
  
  if (category.includes('mirror') || category.includes('plant')) return 'easy'
  if (category.includes('bed') || category.includes('door')) return 'medium'
  if (category.includes('beam') || category.includes('layout')) return 'hard'
  
  const priority = rule.priority || 50
  if (priority >= 80) return 'medium'
  return 'easy'
}

function calculateCostLevel(rule: FengShuiRule): 'low' | 'medium' | 'high' {
  const category = rule.category || ''
  
  if (category.includes('plant') || category.includes('mirror')) return 'low'
  if (category.includes('bed') || category.includes('furniture')) return 'medium'
  if (category.includes('beam') || category.includes('renovation')) return 'high'
  
  return 'low'
}

function calculateExpectedImprovement(rule: FengShuiRule) {
  const priority = rule.priority || 50
  const weight = rule.weight || 50
  const overall = Math.round((priority / 100) * (weight / 100) * 10)
  
  const improvement: any = { overall }
  
  if (rule.impact) {
    if (rule.impact.health) improvement.health = Math.round(Math.abs(rule.impact.health) * 1.5)
    if (rule.impact.wealth) improvement.wealth = Math.round(Math.abs(rule.impact.wealth) * 1.5)
    if (rule.impact.career) improvement.career = Math.round(Math.abs(rule.impact.career) * 1.5)
    if (rule.impact.relationship) improvement.relationship = Math.round(Math.abs(rule.impact.relationship) * 1.5)
    if (rule.impact.study) improvement.study = Math.round(Math.abs(rule.impact.study) * 1.5)
  }
  
  return improvement
}

function buildRecommendations(rule: FengShuiRule) {
  const recs: { type: 'plant' | 'symbol' | 'color' | 'material'; name: string; reason: string }[] = []
  
  const category = rule.category || ''
  const tags = rule.tags || []
  
  // 根据标签推荐植物
  if (tags.some(t => t.includes('财')) || category.includes('wealth')) {
    recs.push({ type: 'plant', name: '发财树', reason: '招财进宝，聚财纳福' })
    recs.push({ type: 'symbol', name: '貔貅', reason: '只进不出，招财辟邪' })
  }
  
  if (tags.some(t => t.includes('健康')) || category.includes('health')) {
    recs.push({ type: 'plant', name: '龟背竹', reason: '健康长寿，净化空气' })
  }
  
  if (tags.some(t => t.includes('文昌')) || category.includes('study')) {
    recs.push({ type: 'plant', name: '富贵竹', reason: '步步高升，学业有成' })
    recs.push({ type: 'symbol', name: '文昌塔', reason: '旺学业，助事业' })
  }
  
  if (tags.some(t => t.includes('煞')) || category.includes('sha')) {
    recs.push({ type: 'symbol', name: '五帝钱', reason: '化煞辟邪，挡小人' })
  }
  
  if (tags.some(t => t.includes('桃花')) || category.includes('relationship')) {
    recs.push({ type: 'plant', name: '红掌', reason: '旺桃花，增进感情' })
  }
  
  return recs.slice(0, 3)
}

function formatImpact(impact: any): string {
  if (!impact) return '综合'
  const parts: string[] = []
  if (impact.health) parts.push('健康')
  if (impact.wealth) parts.push('财运')
  if (impact.career) parts.push('事业')
  if (impact.relationship) parts.push('感情')
  if (impact.study) parts.push('学业')
  return parts.length > 0 ? parts.join('、') : '综合'
}

function impactToChinese(key: string): string {
  const map: Record<string, string> = {
    health: '健康',
    wealth: '财运',
    career: '事业',
    relationship: '感情',
    study: '学业',
  }
  return map[key] || key
}

function difficultyToText(d?: string): string {
  if (d === 'easy') return '简单'
  if (d === 'medium') return '中等'
  if (d === 'hard') return '较难'
  return '未知'
}

function costToText(c?: string): string {
  if (c === 'low') return '低'
  if (c === 'medium') return '中'
  if (c === 'high') return '高'
  return '未知'
}
