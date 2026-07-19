/**
 * V5.0 RC Phase 5 Module II: Explain Level Engine — 三级解释引擎
 *
 * 职责：根据解释等级（normal/professional/master）生成不同深度的命理解释
 * 约束：仅负责内容结构和深度控制，不做命理计算
 */

import type {
  ExplainLevel,
  ExplainLevelConfig,
  LeveledExplainSection,
  ExplainExpansionNode,
  ExplainLevelOutput,
  ExplainInputTopic,
} from './explainLevelTypes'

import {
  EXPLAIN_LEVEL_CONFIGS,
  EXPLAIN_LEVEL_VERSION,
} from './explainLevelTypes'

// ═══════════════════════════════════════════════════════════
// 版本号
// ═══════════════════════════════════════════════════════════

export const EXPLAIN_LEVEL_ENGINE_VERSION = '1.0.0'

// ═══════════════════════════════════════════════════════════
// 核心函数
// ═══════════════════════════════════════════════════════════

/**
 * 中文字符计数
 */
export function countChineseCharacters(text: string): number {
  const regex = /[\u4e00-\u9fff]/g
  const matches = text.match(regex)
  return matches ? matches.length : 0
}

/**
 * 智能截断（保持段落完整）
 */
export function truncateToTargetWordCount(content: string, target: number): string {
  const charCount = countChineseCharacters(content)
  if (charCount <= target) {
    return content
  }

  // 按段落分割
  const paragraphs = content.split(/\n+/).filter(p => p.trim().length > 0)

  let result = ''
  let currentCount = 0

  for (const para of paragraphs) {
    const paraCharCount = countChineseCharacters(para)
    if (currentCount + paraCharCount > target && currentCount > 0) {
      break
    }
    result += (result ? '\n' : '') + para
    currentCount += paraCharCount
  }

  return result || paragraphs[0] || ''
}

/**
 * 获取解释等级配置
 */
export function getExplainLevelConfig(level: ExplainLevel): ExplainLevelConfig {
  return EXPLAIN_LEVEL_CONFIGS[level]
}

/**
 * 预估字数
 */
export function estimateExplainWordCount(topics: ExplainInputTopic[], level: ExplainLevel): number {
  const config = EXPLAIN_LEVEL_CONFIGS[level]
  let total = 0

  for (const topic of topics) {
    // normal: conclusion + reason
    total += countChineseCharacters(topic.conclusion)
    total += countChineseCharacters(topic.reason)

    if (config.maxDepth >= 2) {
      // professional 增加
      total += countChineseCharacters(topic.classicalSource)
      total += countChineseCharacters(topic.modernExplanation)
      total += countChineseCharacters(topic.suggestion)
    }

    if (config.maxDepth >= 3) {
      // master 增加
      total += countChineseCharacters(topic.expertOpinion)
      total += countChineseCharacters(topic.traceChain)
    }
  }

  return total
}

/**
 * 按配置展开为多段
 */
export function expandExplainSection(topic: ExplainInputTopic, config: ExplainLevelConfig): LeveledExplainSection[] {
  const sections: LeveledExplainSection[] = []

  // Depth 1：基础（所有层级都有）
  const conclusionContent = `【结论】${topic.conclusion}`
  const reasonContent = `【原因】${topic.reason}`
  sections.push({
    topic: topic.topic,
    content: conclusionContent,
    depth: 1,
    wordCount: countChineseCharacters(conclusionContent),
    sources: [],
    classicalQuotes: [],
  })
  sections.push({
    topic: topic.topic,
    content: reasonContent,
    depth: 1,
    wordCount: countChineseCharacters(reasonContent),
    sources: [],
    classicalQuotes: [],
  })

  if (config.maxDepth >= 2) {
    // Depth 2：专业展开
    const classicalContent = `【经典引用】${topic.classicalSource}`
    const modernContent = `【现代解释】${topic.modernExplanation}`
    const suggestionContent = `【建议】${topic.suggestion}`

    sections.push({
      topic: topic.topic,
      content: classicalContent,
      depth: 2,
      wordCount: countChineseCharacters(classicalContent),
      sources: [topic.classicalSource],
      classicalQuotes: [topic.classicalSource],
    })
    sections.push({
      topic: topic.topic,
      content: modernContent,
      depth: 2,
      wordCount: countChineseCharacters(modernContent),
      sources: [],
      classicalQuotes: [],
    })
    sections.push({
      topic: topic.topic,
      content: suggestionContent,
      depth: 2,
      wordCount: countChineseCharacters(suggestionContent),
      sources: [],
      classicalQuotes: [],
    })
  }

  if (config.maxDepth >= 3) {
    // Depth 3：大师级展开
    const expertContent = `【专家意见】${topic.expertOpinion}`
    const traceContent = `【推导链】${topic.traceChain}`

    sections.push({
      topic: topic.topic,
      content: expertContent,
      depth: 3,
      wordCount: countChineseCharacters(expertContent),
      sources: [],
      classicalQuotes: [],
    })
    sections.push({
      topic: topic.topic,
      content: traceContent,
      depth: 3,
      wordCount: countChineseCharacters(traceContent),
      sources: [],
      classicalQuotes: [],
    })
  }

  return sections
}

/**
 * 构建可展开树
 */
export function buildExpansionTree(topics: ExplainInputTopic[], config: ExplainLevelConfig): ExplainExpansionNode[] {
  return topics.map(topic => {
    const node: ExplainExpansionNode = {
      id: topic.id,
      topic: topic.topic,
      depth: 0,
      expanded: config.maxDepth >= 1,
      children: [],
    }

    // Depth 1 子节点
    if (config.maxDepth >= 1) {
      const conclusionNode: ExplainExpansionNode = {
        id: `${topic.id}-conclusion`,
        topic: '结论',
        depth: 1,
        expanded: config.maxDepth >= 2,
        children: [],
      }
      const reasonNode: ExplainExpansionNode = {
        id: `${topic.id}-reason`,
        topic: '原因',
        depth: 1,
        expanded: config.maxDepth >= 2,
        children: [],
      }
      node.children.push(conclusionNode, reasonNode)

      // Depth 2 子节点
      if (config.maxDepth >= 2) {
        const classicalNode: ExplainExpansionNode = {
          id: `${topic.id}-classical`,
          topic: '经典引用',
          depth: 2,
          expanded: config.maxDepth >= 3,
          children: [],
        }
        const modernNode: ExplainExpansionNode = {
          id: `${topic.id}-modern`,
          topic: '现代解释',
          depth: 2,
          expanded: config.maxDepth >= 3,
          children: [],
        }
        const suggestionNode: ExplainExpansionNode = {
          id: `${topic.id}-suggestion`,
          topic: '建议',
          depth: 2,
          expanded: config.maxDepth >= 3,
          children: [],
        }
        reasonNode.children.push(classicalNode, modernNode, suggestionNode)

        // Depth 3 子节点
        if (config.maxDepth >= 3) {
          const expertNode: ExplainExpansionNode = {
            id: `${topic.id}-expert`,
            topic: '专家意见',
            depth: 3,
            expanded: false,
            children: [],
          }
          const traceNode: ExplainExpansionNode = {
            id: `${topic.id}-trace`,
            topic: '推导链',
            depth: 3,
            expanded: false,
            children: [],
          }
          suggestionNode.children.push(expertNode, traceNode)
        }
      }
    }

    return node
  })
}

/**
 * 根据等级生成对应深度解释（主入口）
 */
export function generateLeveledExplain(topics: ExplainInputTopic[], level: ExplainLevel): ExplainLevelOutput {
  const config = EXPLAIN_LEVEL_CONFIGS[level]

  // 展开所有 topic 为 sections
  const allSections: LeveledExplainSection[] = []
  for (const topic of topics) {
    const sections = expandExplainSection(topic, config)
    allSections.push(...sections)
  }

  // 计算总字数
  let totalWordCount = 0
  for (const section of allSections) {
    totalWordCount += section.wordCount
  }

  // 截断到目标字数（如果超出）
  const fullContent = allSections.map(s => s.content).join('\n')
  if (totalWordCount > config.targetWordCount) {
    const truncated = truncateToTargetWordCount(fullContent, config.targetWordCount)
    // 重新计算截断后的字数
    totalWordCount = countChineseCharacters(truncated)

    // 将截断后的内容重新映射为 sections（简化：合并为一个大 section）
    const finalSections: LeveledExplainSection[] = [
      {
        topic: topics.map(t => t.topic).join('、'),
        content: truncated,
        depth: 1,
        wordCount: totalWordCount,
        sources: allSections.flatMap(s => s.sources),
        classicalQuotes: allSections.flatMap(s => s.classicalQuotes),
      },
    ]

    return {
      level,
      sections: finalSections,
      totalWordCount,
      expansionTree: buildExpansionTree(topics, config),
      config,
    }
  }

  return {
    level,
    sections: allSections,
    totalWordCount,
    expansionTree: buildExpansionTree(topics, config),
    config,
  }
}
