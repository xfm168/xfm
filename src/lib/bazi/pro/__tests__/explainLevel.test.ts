/**
 * V5.0 RC Phase 5 Module II: Explain Level Engine 测试
 *
 * 覆盖：三级解释生成、展开深度、树结构、截断、字数统计
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'

import {
  generateLeveledExplain,
  expandExplainSection,
  buildExpansionTree,
  truncateToTargetWordCount,
  countChineseCharacters,
  getExplainLevelConfig,
  estimateExplainWordCount,
  EXPLAIN_LEVEL_ENGINE_VERSION,
} from '../explainLevelEngine'

import {
  EXPLAIN_LEVEL_CONFIGS,
  EXPLAIN_LEVEL_VERSION,
} from '../explainLevelTypes'

import type {
  ExplainLevel,
  ExplainLevelConfig,
  ExplainInputTopic,
  ExplainExpansionNode,
  LeveledExplainSection,
} from '../explainLevelTypes'

// ═══════════════════════════════════════════════════════════════
// 测试数据
// ═══════════════════════════════════════════════════════════════

const sampleTopic: ExplainInputTopic = {
  id: 'topic-1',
  topic: '甲木日主生于子月',
  conclusion: '甲木生于子月，水旺木浮，需取丙火为用，丁火次之。',
  reason: '子月水旺，甲木无根，必须以火泄水生木，方成有用之体。',
  classicalSource: '《穷通宝鉴》云：三冬甲木，庚金为剪，丙火为解冻之神。',
  modernExplanation: '甲木为阳木，代表参天大树。子月为农历十一月，水气最旺之时。此时甲木缺乏根基，水多木漂，需要丙火温暖调候，使甲木得以生发。',
  suggestion: '建议在事业发展中寻求火属性环境，如南方地域或夏季时段，以补调候之需。同时宜佩戴红色饰品增强火气。',
  expertOpinion: '根据多位命理专家共识，甲木日主生于子月者，若原局有丙火透干，格局层次明显提升。若无丙火，需在岁运中寻求补救。',
  traceChain: '甲木日主 → 生于子月 → 水旺为忌 → 需丙火调候 → 丙火为用神 → 丁火为喜神 → 形成水火既济之象',
}

// ═══════════════════════════════════════════════════════════════
// 顶层 describe
// ═══════════════════════════════════════════════════════════════

describe('V5.0 RC Phase 5: Explain Level Engine', () => {

  // ─────────────────────────────────────────────
  // 1. 版本号
  // ─────────────────────────────────────────────
  describe('1. 版本号', () => {
    test('EXPLAIN_LEVEL_ENGINE_VERSION 应为 1.0.0', () => {
      expect(EXPLAIN_LEVEL_ENGINE_VERSION).toBe('1.0.0')
    })
    test('EXPLAIN_LEVEL_VERSION 应为 1.0.0', () => {
      expect(EXPLAIN_LEVEL_VERSION).toBe('1.0.0')
    })
  })

  // ─────────────────────────────────────────────
  // 2. EXPLAIN_LEVEL_CONFIGS
  // ─────────────────────────────────────────────
  describe('2. EXPLAIN_LEVEL_CONFIGS', () => {
    test('三个等级配置存在', () => {
      expect(EXPLAIN_LEVEL_CONFIGS.normal).toBeDefined()
      expect(EXPLAIN_LEVEL_CONFIGS.professional).toBeDefined()
      expect(EXPLAIN_LEVEL_CONFIGS.master).toBeDefined()
    })
    test('normal 目标字数 1000', () => {
      expect(EXPLAIN_LEVEL_CONFIGS.normal.targetWordCount).toBe(1000)
      expect(EXPLAIN_LEVEL_CONFIGS.normal.maxDepth).toBe(1)
      expect(EXPLAIN_LEVEL_CONFIGS.normal.includeExpertOpinion).toBe(false)
      expect(EXPLAIN_LEVEL_CONFIGS.normal.includeTraceChain).toBe(false)
    })
    test('professional 目标字数 3000', () => {
      expect(EXPLAIN_LEVEL_CONFIGS.professional.targetWordCount).toBe(3000)
      expect(EXPLAIN_LEVEL_CONFIGS.professional.maxDepth).toBe(2)
      expect(EXPLAIN_LEVEL_CONFIGS.professional.includeExpertOpinion).toBe(true)
    expect(EXPLAIN_LEVEL_CONFIGS.professional.includeTraceChain).toBe(false)
    })
    test('master 目标字数 8000', () => {
      expect(EXPLAIN_LEVEL_CONFIGS.master.targetWordCount).toBe(8000)
      expect(EXPLAIN_LEVEL_CONFIGS.master.maxDepth).toBe(3)
      expect(EXPLAIN_LEVEL_CONFIGS.master.includeExpertOpinion).toBe(true)
      expect(EXPLAIN_LEVEL_CONFIGS.master.includeTraceChain).toBe(true)
    })
    test('各级别字数递增', () => {
      expect(EXPLAIN_LEVEL_CONFIGS.normal.targetWordCount)
        .toBeLessThan(EXPLAIN_LEVEL_CONFIGS.professional.targetWordCount)
      expect(EXPLAIN_LEVEL_CONFIGS.professional.targetWordCount)
        .toBeLessThan(EXPLAIN_LEVEL_CONFIGS.master.targetWordCount)
    })
  })

  // ─────────────────────────────────────────────
  // 3. countChineseCharacters
  // ─────────────────────────────────────────────
  describe('3. countChineseCharacters', () => {
    test('纯中文字符计数正确', () => {
      expect(countChineseCharacters('甲乙丙丁')).toBe(4)
      expect(countChineseCharacters('命理学')).toBe(3)
    })
    test('混合中英文计数', () => {
      expect(countChineseCharacters('甲木Wood')).toBe(2)
    })
    test('纯英文计数为 0', () => {
      expect(countChineseCharacters('hello world')).toBe(0)
    })
    test('空字符串计数为 0', () => {
      expect(countChineseCharacters('')).toBe(0)
    })
    test('含标点只计中文字', () => {
      const count = countChineseCharacters('甲木，生于子月。')
      expect(count).toBe(6) // 甲木生于子月
    })
    test('含数字只计中文字', () => {
      const count = countChineseCharacters('三阳开泰2024')
      expect(count).toBe(4) // 三阳开泰
    })
  })

  // ─────────────────────────────────────────────
  // 4. getExplainLevelConfig
  // ─────────────────────────────────────────────
  describe('4. getExplainLevelConfig', () => {
    test('返回对应等级配置', () => {
      const normal = getExplainLevelConfig('normal')
      expect(normal.level).toBe('normal')
      expect(normal.maxDepth).toBe(1)

      const master = getExplainLevelConfig('master')
      expect(master.level).toBe('master')
      expect(master.maxDepth).toBe(3)
    })
    test('配置对象与常量一致', () => {
      const levels: ExplainLevel[] = ['normal', 'professional', 'master']
      for (const level of levels) {
        const config = getExplainLevelConfig(level)
        expect(config).toEqual(EXPLAIN_LEVEL_CONFIGS[level])
      }
    })
  })

  // ─────────────────────────────────────────────
  // 5. truncateToTargetWordCount
  // ─────────────────────────────────────────────
  describe('5. truncateToTargetWordCount', () => {
    test('不超过目标字数时不截断', () => {
      const text = '甲乙丙丁'
      const result = truncateToTargetWordCount(text, 10)
      expect(result).toBe(text)
    })
    test('超过目标字数时截断', () => {
      const text = '甲乙丙丁戊己庚辛壬癸\n子丑寅卯辰巳午未申酉'
      const result = truncateToTargetWordCount(text, 5)
      expect(countChineseCharacters(result)).toBeLessThanOrEqual(10)
    })
    test('空字符串不截断', () => {
      const result = truncateToTargetWordCount('', 100)
      expect(result).toBe('')
    })
    test('多段落截断保持段落完整', () => {
      const text = '甲乙丙丁戊己庚辛壬癸\n子丑寅卯辰巳午未申酉戌亥\n一二三四五六七八九十'
      const result = truncateToTargetWordCount(text, 15)
      // 应保持段落完整，不会截断到段落中间
      const paragraphs = result.split('\n').filter(p => p.length > 0)
      expect(paragraphs.length).toBeLessThanOrEqual(2)
    })
  })

  // ─────────────────────────────────────────────
  // 6. expandExplainSection
  // ─────────────────────────────────────────────
  describe('6. expandExplainSection', () => {
    test('normal 等级展开 2 段（结论 + 原因）', () => {
      const config = EXPLAIN_LEVEL_CONFIGS.normal
      const sections = expandExplainSection(sampleTopic, config)
      expect(sections.length).toBe(2)
      expect(sections[0].content).toContain('结论')
      expect(sections[1].content).toContain('原因')
      expect(sections.every(s => s.depth === 1)).toBe(true)
    })

    test('professional 等级展开 5 段', () => {
      const config = EXPLAIN_LEVEL_CONFIGS.professional
      const sections = expandExplainSection(sampleTopic, config)
      expect(sections.length).toBe(5)
      expect(sections[2].content).toContain('经典引用')
      expect(sections[3].content).toContain('现代解释')
      expect(sections[4].content).toContain('建议')
    })

    test('master 等级展开 7 段', () => {
      const config = EXPLAIN_LEVEL_CONFIGS.master
      const sections = expandExplainSection(sampleTopic, config)
      expect(sections.length).toBe(7)
      expect(sections[5].content).toContain('专家意见')
      expect(sections[6].content).toContain('推导链')
    })

    test('各段 wordCount 正确', () => {
      const config = EXPLAIN_LEVEL_CONFIGS.normal
      const sections = expandExplainSection(sampleTopic, config)
      for (const section of sections) {
        expect(section.wordCount).toBe(countChineseCharacters(section.content))
      }
    })

    test('深度递增', () => {
      const config = EXPLAIN_LEVEL_CONFIGS.master
      const sections = expandExplainSection(sampleTopic, config)
      const depths = sections.map(s => s.depth)
      // depth 应为非递减序列
      for (let i = 1; i < depths.length; i++) {
        expect(depths[i]).toBeGreaterThanOrEqual(depths[i - 1])
      }
    })
  })

  // ─────────────────────────────────────────────
  // 7. buildExpansionTree
  // ─────────────────────────────────────────────
  describe('7. buildExpansionTree', () => {
    test('normal 树深度为 1', () => {
      const config = EXPLAIN_LEVEL_CONFIGS.normal
      const tree = buildExpansionTree([sampleTopic], config)
      expect(tree.length).toBe(1)
      expect(tree[0].children.length).toBe(2)
      expect(tree[0].children[0].depth).toBe(1)
    })

    test('professional 树有第 2 层子节点', () => {
      const config = EXPLAIN_LEVEL_CONFIGS.professional
      const tree = buildExpansionTree([sampleTopic], config)
      const reasonNode = tree[0].children[1] // reason 节点
      expect(reasonNode.children.length).toBe(3) // classical, modern, suggestion
      expect(reasonNode.children[0].depth).toBe(2)
    })

    test('master 树有第 3 层子节点', () => {
      const config = EXPLAIN_LEVEL_CONFIGS.master
      const tree = buildExpansionTree([sampleTopic], config)
      const reasonNode = tree[0].children[1]
      const suggestionNode = reasonNode.children[2]
      expect(suggestionNode.children.length).toBe(2) // expert, trace
      expect(suggestionNode.children[0].depth).toBe(3)
    })

    test('多 topic 生成多个根节点', () => {
      const topic2: ExplainInputTopic = {
        ...sampleTopic,
        id: 'topic-2',
        topic: '丙火日主生于午月',
      }
      const config = EXPLAIN_LEVEL_CONFIGS.normal
      const tree = buildExpansionTree([sampleTopic, topic2], config)
      expect(tree.length).toBe(2)
    })

    test('节点 id 正确', () => {
      const config = EXPLAIN_LEVEL_CONFIGS.master
      const tree = buildExpansionTree([sampleTopic], config)
      expect(tree[0].id).toBe('topic-1')
      expect(tree[0].children[0].id).toBe('topic-1-conclusion')
      expect(tree[0].children[1].id).toBe('topic-1-reason')
    })
  })

  // ─────────────────────────────────────────────
  // 8. generateLeveledExplain
  // ─────────────────────────────────────────────
  describe('8. generateLeveledExplain', () => {
    test('normal 等级输出正确', () => {
      const output = generateLeveledExplain([sampleTopic], 'normal')
      expect(output.level).toBe('normal')
      expect(output.sections.length).toBe(2)
      expect(output.config).toEqual(EXPLAIN_LEVEL_CONFIGS.normal)
      expect(output.totalWordCount).toBeGreaterThan(0)
      expect(output.expansionTree.length).toBe(1)
    })

    test('normal 不包含专家意见和推导链', () => {
      const output = generateLeveledExplain([sampleTopic], 'normal')
      const allContent = output.sections.map(s => s.content).join('')
      expect(allContent).not.toContain('专家意见')
      expect(allContent).not.toContain('推导链')
    })

    test('professional 等级输出正确', () => {
      const output = generateLeveledExplain([sampleTopic], 'professional')
      expect(output.level).toBe('professional')
      expect(output.sections.length).toBe(5)
    })

    test('professional 包含经典引用但不包含推导链', () => {
      const output = generateLeveledExplain([sampleTopic], 'professional')
      const allContent = output.sections.map(s => s.content).join('')
      expect(allContent).toContain('经典引用')
      expect(allContent).not.toContain('推导链')
    })

    test('master 等级输出全部内容', () => {
      const output = generateLeveledExplain([sampleTopic], 'master')
      expect(output.level).toBe('master')
      expect(output.sections.length).toBe(7)
    })

    test('master 包含所有深度内容', () => {
      const output = generateLeveledExplain([sampleTopic], 'master')
      const allContent = output.sections.map(s => s.content).join('')
      expect(allContent).toContain('结论')
      expect(allContent).toContain('原因')
      expect(allContent).toContain('经典引用')
      expect(allContent).toContain('现代解释')
      expect(allContent).toContain('建议')
      expect(allContent).toContain('专家意见')
      expect(allContent).toContain('推导链')
    })

    test('多个 topic 时 sections 合并', () => {
      const topic2: ExplainInputTopic = {
        ...sampleTopic,
        id: 'topic-2',
        topic: '丙火日主',
      }
      const output = generateLeveledExplain([sampleTopic, topic2], 'normal')
      // 每个 topic 2 sections，共 4
      expect(output.sections.length).toBe(4)
    })
  })

  // ─────────────────────────────────────────────
  // 9. estimateExplainWordCount
  // ─────────────────────────────────────────────
  describe('9. estimateExplainWordCount', () => {
    test('normal 估算只含结论和原因', () => {
      const estimate = estimateExplainWordCount([sampleTopic], 'normal')
      const expected = countChineseCharacters(sampleTopic.conclusion)
        + countChineseCharacters(sampleTopic.reason)
      expect(estimate).toBe(expected)
    })

    test('professional 估算增加经典、现代、建议', () => {
      const estimate = estimateExplainWordCount([sampleTopic], 'professional')
      const normalEstimate = estimateExplainWordCount([sampleTopic], 'normal')
      const extra = countChineseCharacters(sampleTopic.classicalSource)
        + countChineseCharacters(sampleTopic.modernExplanation)
        + countChineseCharacters(sampleTopic.suggestion)
      expect(estimate).toBe(normalEstimate + extra)
    })

    test('master 估算增加专家和推导链', () => {
      const proEstimate = estimateExplainWordCount([sampleTopic], 'professional')
      const masterEstimate = estimateExplainWordCount([sampleTopic], 'master')
      const extra = countChineseCharacters(sampleTopic.expertOpinion)
        + countChineseCharacters(sampleTopic.traceChain)
      expect(masterEstimate).toBe(proEstimate + extra)
    })

    test('master 估算大于 professional 大于 normal', () => {
      const normal = estimateExplainWordCount([sampleTopic], 'normal')
      const pro = estimateExplainWordCount([sampleTopic], 'professional')
      const master = estimateExplainWordCount([sampleTopic], 'master')
      expect(normal).toBeLessThan(pro)
      expect(pro).toBeLessThan(master)
    })
  })
})
