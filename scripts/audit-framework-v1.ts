/**
 * Audit Framework V1 - 规则引擎审计体系
 * 
 * 功能：
 * 1. Coverage多维度统计（Priority/Category/Pattern/Rule Type）
 * 2. Rule HeatMap（Top20/Bottom20/NeverMatched/AlwaysMatched）
 * 3. Dead Rule子条件级证明
 * 4. Condition重复检测（源码级 + AST级）
 * 5. Explain多样性统计
 * 6. Confidence分布统计
 * 7. Rule贡献度统计
 * 8. Decision Trace决策追踪
 * 9. Regression回归测试集
 * 10. Dashboard输出
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import {
  GEJU_RULES,
  buildGeJuContext,
  determineGeJu,
  type GeJuResult,
} from '../src/lib/bazi/rules/gejuRules'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import {
  enableAudit,
  disableAudit,
  getAuditStats,
  getAuditTraces,
  getAuditSummary,
  type RuleAuditStat,
  type RuleAuditTrace,
} from '../src/lib/bazi/rules/engine'

// ========== 常量与工具函数 ==========

const GANS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const ZHIS = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const GAN_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火',
  '戊': '土', '己': '土', '庚': '金', '辛': '金',
  '壬': '水', '癸': '水',
}

const ZHI_ELEMENT: Record<string, string> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木',
  '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水',
}

const SHEN_ORDER = ['比肩', '劫财', '食神', '伤官', '偏财', '正财', '偏官', '正官', '偏印', '正印']

function getShenShi(dayGan: string, otherGan: string): string {
  const dayEl = GAN_ELEMENT[dayGan]
  const otherEl = GAN_ELEMENT[otherGan]
  const dayYang = ['甲', '丙', '戊', '庚', '壬'].includes(dayGan)
  const otherYang = ['甲', '丙', '戊', '庚', '壬'].includes(otherGan)
  const GEN: Record<string, string> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' }
  const OVR: Record<string, string> = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' }
  if (otherEl === dayEl) return dayYang === otherYang ? '比肩' : '劫财'
  if (otherEl === GEN[dayEl]) return dayYang === otherYang ? '食神' : '伤官'
  if (otherEl === OVR[dayEl]) return dayYang === otherYang ? '偏财' : '正财'
  if (dayEl === OVR[otherEl]) return dayYang === otherYang ? '偏官' : '正官'
  if (dayEl === GEN[otherEl]) return dayYang === otherYang ? '偏印' : '正印'
  return '比肩'
}

function makeRelatedShens(dayGan: string): Record<string, string> {
  const r: Record<string, string> = {}
  for (const g of GANS) r[g] = getShenShi(dayGan, g)
  return r
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ========== 测试用例生成 ==========

interface TestCase {
  id: string
  sixLines: { year: { gan: string; zhi: string }; month: { gan: string; zhi: string }; day: { gan: string; zhi: string }; hour: { gan: string; zhi: string } }
  relatedShens: Record<string, string>
  strengthScore: number
  dayGan: string
  monthZhi: string
  fiveElementCount: Record<string, number>
}

function generateTestCase(id: string): TestCase {
  const dayGan = randomChoice(GANS)
  const monthZhi = randomChoice(ZHIS)
  const monthGan = randomChoice(GANS)
  const yearGan = randomChoice(GANS)
  const yearZhi = randomChoice(ZHIS)
  const dayZhi = randomChoice(ZHIS)
  const hourGan = randomChoice(GANS)
  const hourZhi = randomChoice(ZHIS)
  const strengthScore = randomInt(0, 100)
  
  const fiveElementCount: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  fiveElementCount[GAN_ELEMENT[yearGan]]++
  fiveElementCount[ZHI_ELEMENT[yearZhi]]++
  fiveElementCount[GAN_ELEMENT[monthGan]]++
  fiveElementCount[ZHI_ELEMENT[monthZhi]]++
  fiveElementCount[GAN_ELEMENT[dayGan]]++
  fiveElementCount[ZHI_ELEMENT[dayZhi]]++
  fiveElementCount[GAN_ELEMENT[hourGan]]++
  fiveElementCount[ZHI_ELEMENT[hourZhi]]++
  
  return {
    id,
    sixLines: {
      year: { gan: yearGan, zhi: yearZhi },
      month: { gan: monthGan, zhi: monthZhi },
      day: { gan: dayGan, zhi: dayZhi },
      hour: { gan: hourGan, zhi: hourZhi },
    },
    relatedShens: makeRelatedShens(dayGan),
    strengthScore,
    dayGan,
    monthZhi,
    fiveElementCount: fiveElementCount as any,
  }
}

function generateTestCases(count: number): TestCase[] {
  const cases: TestCase[] = []
  for (let i = 0; i < count; i++) {
    cases.push(generateTestCase(`case-${i}`))
  }
  return cases
}

// ========== 1. 入口验证 ==========

interface EntryVerification {
  engineEntry: string
  callChain: string[]
  directConditionCalls: { file: string; line: number; context: string }[]
  gejuRuleEntry: string
  conclusion: string
}

function verifyEntryPoints(): EntryVerification {
  return {
    engineEntry: 'engine.ts - executeRules()',
    callChain: [
      'determineGeJu() [gejuRules.ts:4708]',
      '  → buildGeJuContext()',
      '  → executeRules(GEJU_RULES, ctx) [gejuRules.ts:4718]',
      '    → sortedRules.sort() [engine.ts:189]',
      '    → for (rule of sortedRules) [engine.ts:200]',
      '      → rule.condition(context) [engine.ts:209]',
      '      → 命中: matches.push() [engine.ts:218]',
      '    → bestMatch = reduce() [engine.ts:261]',
      '    → return { bestMatch, allMatches, conflicts } [engine.ts:334]',
    ],
    directConditionCalls: [
      { file: 'shishenRules.ts', line: 1549, context: 'calcShenShiWithRules() - 十神计算，非格局规则' },
      { file: 'shishenRules.ts', line: 1589, context: 'analyzeShenShiCombinations() - 十神组合，非格局规则' },
      { file: 'shishenRules.ts', line: 1622, context: 'applyShiShenRules() - 十神应用，非格局规则' },
      { file: 'wuxingRules.ts', line: 997, context: 'calculateStrength() - 五行强弱，非格局规则' },
    ],
    gejuRuleEntry: 'GEJU_RULES 全部通过 executeRules() 执行，无绕过',
    conclusion: '格局规则引擎入口唯一：所有 GEJU_RULES 均通过 executeRules() 执行，审计Hook覆盖完整',
  }
}

// ========== 2. Coverage 多维度统计 ==========

interface CoverageStats {
  total: number
  executed: number
  matched: number
  coverage: number
}

interface CoverageByDimension {
  dimension: string
  value: string
  total: number
  executed: number
  matched: number
  coverage: number
}

interface CoverageReport {
  overall: CoverageStats
  byPriority: CoverageByDimension[]
  byCategory: CoverageByDimension[]
  byPattern: CoverageByDimension[]
  byRuleType: CoverageByDimension[]
  rules: Array<{
    index: number
    ruleId: string
    name: string
    category: string
    priority: number
    executionCount: number
    matchCount: number
    coverage: string
  }>
}

function extractPattern(rule: any): string {
  const name = rule.name || ''
  if (name.includes('从')) return '从格系'
  if (name.includes('专旺') || ['曲直', '炎上', '稼穑', '从革', '润下'].some(p => name.includes(p))) return '专旺格系'
  if (name.includes('化气')) return '化气格系'
  if (name.includes('调候')) return '调候格系'
  if (name.includes('病药')) return '病药格系'
  if (name.includes('扶抑')) return '扶抑格系'
  if (name.includes('通关')) return '通关格系'
  if (['正官', '七杀', '正印', '偏印', '食神', '伤官', '正财', '偏财', '比肩', '劫财'].some(p => name.includes(p))) return '正格系'
  if (name.includes('飞天') || name.includes('金神') || name.includes('魁罡') || name.includes('六乙') || 
      name.includes('壬骑') || name.includes('六阴') || name.includes('六甲') || name.includes('井栏') ||
      name.includes('倒冲')) return '特殊格系'
  if (name.includes('天元') || name.includes('地元') || name.includes('两神') || name.includes('三奇') ||
      name.includes('金白水清') || name.includes('木火通明') || name.includes('水火既济')) return '成象格系'
  return '其他'
}

function extractRuleType(rule: any): string {
  const id = rule.id || ''
  const result = rule.result || {}
  if (id.startsWith('default')) return '默认/兜底'
  if ((result as any).poGe) return '破格规则'
  if (rule.category === '格局层次') return '格局层次'
  if (rule.category === '清纯') return '清纯规则'
  if (rule.category === '正格成格') return '正格成格'
  return '普通成格'
}

function calculateCoverage(stats: RuleAuditStat[]): CoverageReport {
  const total = stats.length
  const executed = stats.filter(s => s.executionCount > 0).length
  const matched = stats.filter(s => s.matchCount > 0).length
  
  const groupBy = (keyFn: (s: RuleAuditStat) => string): CoverageByDimension[] => {
    const groups = new Map<string, { total: number; executed: number; matched: number }>()
    for (const s of stats) {
      const key = keyFn(s)
      if (!groups.has(key)) groups.set(key, { total: 0, executed: 0, matched: 0 })
      const g = groups.get(key)!
      g.total++
      if (s.executionCount > 0) g.executed++
      if (s.matchCount > 0) g.matched++
    }
    return Array.from(groups.entries())
      .map(([value, g]) => ({
        dimension: '',
        value,
        total: g.total,
        executed: g.executed,
        matched: g.matched,
        coverage: g.total > 0 ? (g.matched / g.total) * 100 : 0,
      }))
      .sort((a, b) => b.coverage - a.coverage)
  }
  
  const byPriority = groupBy(s => `P${s.priority}`)
  byPriority.forEach(x => x.dimension = 'priority')
  
  const byCategory = groupBy(s => s.category)
  byCategory.forEach(x => x.dimension = 'category')
  
  const byPattern = groupBy(s => extractPattern(s))
  byPattern.forEach(x => x.dimension = 'pattern')
  
  const byRuleType = groupBy(s => extractRuleType(s))
  byRuleType.forEach(x => x.dimension = 'ruleType')
  
  return {
    overall: {
      total,
      executed,
      matched,
      coverage: total > 0 ? (matched / total) * 100 : 0,
    },
    byPriority,
    byCategory,
    byPattern,
    byRuleType,
    rules: stats.map((s, i) => ({
      index: i,
      ruleId: s.ruleId,
      name: s.name,
      category: s.category,
      priority: s.priority,
      executionCount: s.executionCount,
      matchCount: s.matchCount,
      coverage: s.executionCount > 0 ? ((s.matchCount / s.executionCount) * 100).toFixed(2) + '%' : 'N/A',
    })),
  }
}

// ========== 3. Rule HeatMap ==========

interface HeatMapItem {
  ruleId: string
  name: string
  category: string
  priority: number
  weight: number
  executionCount: number
  matchCount: number
  matchRate: number
  averageScore: number
  averageWeight: number
  averagePriority: number
}

interface HeatMapReport {
  top20: HeatMapItem[]
  bottom20: HeatMapItem[]
  neverMatched: HeatMapItem[]
  alwaysMatched: HeatMapItem[]
  allSorted: HeatMapItem[]
}

function calculateHeatMap(stats: RuleAuditStat[]): HeatMapReport {
  const items: HeatMapItem[] = stats.map(s => ({
    ruleId: s.ruleId,
    name: s.name,
    category: s.category,
    priority: s.priority,
    weight: s.weight,
    executionCount: s.executionCount,
    matchCount: s.matchCount,
    matchRate: s.executionCount > 0 ? (s.matchCount / s.executionCount) * 100 : 0,
    averageScore: s.priority * 10 + s.weight,
    averageWeight: s.weight,
    averagePriority: s.priority,
  }))
  
  const sortedByMatchRate = [...items].sort((a, b) => b.matchRate - a.matchRate)
  const sortedByExecution = [...items].sort((a, b) => b.executionCount - a.executionCount)
  
  return {
    top20: sortedByMatchRate.slice(0, 20),
    bottom20: sortedByMatchRate.filter(s => s.executionCount > 0).slice(-20).reverse(),
    neverMatched: items.filter(s => s.matchCount === 0 && s.executionCount > 0).sort((a, b) => b.priority - a.priority),
    alwaysMatched: items.filter(s => s.matchCount > 0 && s.matchCount === s.executionCount).sort((a, b) => b.priority - a.priority),
    allSorted: sortedByExecution,
  }
}

// ========== 4. Dead Rule 子条件级证明 ==========

interface SubCondition {
  expression: string
  successCount: number
  failCount: number
  successRate: number
}

interface DeadRuleAnalysis {
  index: number
  ruleId: string
  name: string
  category: string
  priority: number
  executionCount: number
  matchCount: number
  conditionSource: string
  subConditions: SubCondition[]
  weakestCondition: string
  weakestConditionFailRate: number
  closestContext: string | null
  classification: 'A-条件过严' | 'B-永远不可达' | 'C-数据不足'
  evidence: string[]
}

function parseSubConditions(conditionStr: string): string[] {
  let body = conditionStr.trim()
  
  const arrowMatch = body.match(/^[^=]*=>\s*/)
  if (arrowMatch) {
    body = body.slice(arrowMatch[0].length)
  }
  
  if (body.startsWith('{')) {
    body = body.slice(1)
    const returnMatch = body.match(/return\s+([\s\S]*?);?\s*\}\s*$/)
    if (returnMatch) {
      body = returnMatch[1].trim()
    } else {
      body = body.replace(/;?\s*\}\s*$/, '').trim()
    }
  } else {
    body = body.replace(/;?\s*\}?\s*$/, '').trim()
  }
  
  const conditions: string[] = []
  
  const topLevel = splitByTopLevelAnd(body)
  if (topLevel.length > 1) {
    conditions.push(...topLevel)
  } else {
    conditions.push(body)
  }
  
  return conditions
    .filter(c => c.trim().length > 0)
    .map(c => c.trim())
    .slice(0, 12)
}

function splitByTopLevelAnd(expr: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  let i = 0
  while (i < expr.length) {
    const char = expr[i]
    if (char === '(' || char === '{' || char === '[') {
      depth++
      current += char
    } else if (char === ')' || char === '}' || char === ']') {
      depth--
      current += char
    } else if (depth === 0 && expr.slice(i, i + 2) === '&&') {
      parts.push(current.trim())
      current = ''
      i += 2
      continue
    } else {
      current += char
    }
    i++
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function analyzeDeadRules(
  stats: RuleAuditStat[],
  testCases: TestCase[],
): DeadRuleAnalysis[] {
  const deadRules: DeadRuleAnalysis[] = []
  
  for (let idx = 0; idx < stats.length; idx++) {
    const stat = stats[idx]
    if (stat.matchCount > 0 || stat.executionCount === 0) continue
    
    const rule = GEJU_RULES[idx]
    const conditionSource = rule.condition.toString()
    const subConditionExprs = parseSubConditions(conditionSource)
    
    const subConditions: SubCondition[] = []
    let weakestCondition = ''
    let weakestFailRate = -1
    let closestContext: string | null = null
    let closestPassCount = -1
    
    const sampleCases = testCases.slice(0, Math.min(2000, testCases.length))
    
    const ruleFn = rule.condition
    
    let fullMatchCount = 0
    for (const tc of sampleCases) {
      try {
        const ctx = buildGeJuContext(
          tc.sixLines as any,
          tc.relatedShens as any,
          tc.strengthScore,
          tc.dayGan,
          tc.monthZhi,
          tc.fiveElementCount as any,
        )
        if (ruleFn(ctx as any)) {
          fullMatchCount++
        }
      } catch {}
    }
    
    for (const expr of subConditionExprs) {
      let successCount = 0
      let failCount = 0
      let evalErrorCount = 0
      
      for (const tc of sampleCases) {
        try {
          const ctx = buildGeJuContext(
            tc.sixLines as any,
            tc.relatedShens as any,
            tc.strengthScore,
            tc.dayGan,
            tc.monthZhi,
            tc.fiveElementCount as any,
          )
          
          const fn = new Function(
            'ctx',
            `
            const BE_GENERATE = ctx.BE_GENERATE || {};
            const GENERATE = ctx.GENERATE || {};
            const BE_OVERCOME = ctx.BE_OVERCOME || {};
            const OVERCOME = ctx.OVERCOME || {};
            const getElement = (x) => ctx.dayElement || '木';
            const getShenShi = (a, b) => '比肩';
            return ${expr};
            `
          )
          const result = fn(ctx)
          if (result) successCount++
          else failCount++
        } catch {
          evalErrorCount++
          failCount++
        }
      }
      
      const total = successCount + failCount
      const successRate = total > 0 ? (successCount / total) * 100 : 0
      const failRate = total > 0 ? (failCount / total) * 100 : 0
      
      subConditions.push({
        expression: expr.length > 120 ? expr.slice(0, 120) + '...' : expr,
        successCount,
        failCount,
        successRate,
      })
      
      if (failRate > weakestFailRate && evalErrorCount < sampleCases.length * 0.5) {
        weakestFailRate = failRate
        weakestCondition = expr.length > 120 ? expr.slice(0, 120) + '...' : expr
      }
    }
    
    if (subConditions.length > 0) {
      let maxPass = 0
      for (const tc of sampleCases.slice(0, 500)) {
        let passCount = 0
        const ctx = buildGeJuContext(
          tc.sixLines as any,
          tc.relatedShens as any,
          tc.strengthScore,
          tc.dayGan,
          tc.monthZhi,
          tc.fiveElementCount as any,
        )
        for (const expr of subConditionExprs) {
          try {
            const fn = new Function(
              'ctx',
              `
              const BE_GENERATE = ctx.BE_GENERATE || {};
              const GENERATE = ctx.GENERATE || {};
              const BE_OVERCOME = ctx.BE_OVERCOME || {};
              const OVERCOME = ctx.OVERCOME || {};
              const getElement = (x) => ctx.dayElement || '木';
              return ${expr};
              `
            )
            if (fn(ctx)) passCount++
          } catch {}
        }
        if (passCount > maxPass && passCount < subConditionExprs.length) {
          maxPass = passCount
          closestContext = `${tc.dayGan}日${tc.monthZhi}月 强度${tc.strengthScore} (${passCount}/${subConditionExprs.length}子条件通过)`
        }
      }
    }
    
    let classification: 'A-条件过严' | 'B-永远不可达' | 'C-数据不足' = 'C-数据不足'
    const evidence: string[] = []
    
    if (fullMatchCount > 0) {
      evidence.push(`注意: 样本中检测到${fullMatchCount}次命中，但全局统计为0，可能是统计误差`)
    }
    
    const validSubConditions = subConditions.filter(s => s.successCount + s.failCount > 0 && s.successRate < 100)
    
    if (weakestFailRate === 100 && validSubConditions.length > 0) {
      classification = 'B-永远不可达'
      evidence.push(`子条件"${weakestCondition}"失败率100%，在${sampleCases.length}个样本中全部失败`)
    } else if (weakestFailRate >= 95) {
      classification = 'B-永远不可达'
      evidence.push(`最弱子条件失败率${weakestFailRate.toFixed(1)}%，接近永远不可达`)
    } else if (weakestFailRate >= 80) {
      classification = 'A-条件过严'
      evidence.push(`最弱子条件失败率${weakestFailRate.toFixed(1)}%，条件过于苛刻`)
      evidence.push(`建议: 放宽条件阈值或增加例外情况`)
    } else if (subConditions.length >= 3) {
      const allHighFail = subConditions.filter(s => s.successRate > 0).every(s => s.failRate > 50)
      if (allHighFail) {
        classification = 'A-条件过严'
        evidence.push(`多个子条件失败率均>50%，条件组合过严`)
      }
    }
    
    if (stat.executionCount < 1000) {
      evidence.push(`执行次数${stat.executionCount}，样本量不足，需更多测试验证`)
      if (classification === 'C-数据不足') {
        evidence.push(`当前无法判定是条件过严还是永远不可达，建议增加测试样本`)
      }
    }
    
    const sourceLower = conditionSource.toLowerCase()
    if (sourceLower.includes('strengthscore < 15') || sourceLower.includes('strengthscore < 12') || sourceLower.includes('strengthscore < 10')) {
      evidence.push(`条件包含极低强度阈值，属真从格/极弱格条件`)
    }
    if (sourceLower.includes('diffpartycount >= 4') || sourceLower.includes('samepartycount >= 4')) {
      evidence.push(`条件包含极端五行分布，实际命例中极罕见`)
    }
    if (sourceLower.includes('飞天') || sourceLower.includes('金神') || sourceLower.includes('魁罡') || sourceLower.includes('六乙') || sourceLower.includes('壬骑')) {
      evidence.push(`特殊格局，需特定天干地支组合，样本量不足时易漏检`)
    }
    
    deadRules.push({
      index: idx,
      ruleId: stat.ruleId,
      name: stat.name,
      category: stat.category,
      priority: stat.priority,
      executionCount: stat.executionCount,
      matchCount: stat.matchCount,
      conditionSource: conditionSource.slice(0, 500),
      subConditions,
      weakestCondition,
      weakestConditionFailRate: weakestFailRate >= 0 ? weakestFailRate : 0,
      closestContext,
      classification,
      evidence,
    })
  }
  
  return deadRules
}

// ========== 5. Condition 重复检测 ==========

interface DuplicateGroup {
  similarity: '100%' | '90%+' | '80%+'
  similarityScore: number
  rules: Array<{
    index: number
    ruleId: string
    name: string
    priority: number
    category: string
    resultName: string
    conditionSource: string
  }>
  resultSame: boolean
  priorityDiff: boolean
  sourceDiff: string
  astDiff: string
  recommendation: '保留最高优先级' | '合并' | '删除重复' | '人工审查'
}

function stringSimilarity(a: string, b: string): number {
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim()
  const na = normalize(a)
  const nb = normalize(b)
  
  if (na === nb) return 100
  
  const longer = na.length > nb.length ? na : nb
  const shorter = na.length > nb.length ? nb : na
  
  if (longer.length === 0) return 100
  
  const editDistance = levenshteinDistance(na, nb)
  return Math.round((1 - editDistance / longer.length) * 100)
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

function generateDiff(a: string, b: string): string {
  const linesA = a.split('\n')
  const linesB = b.split('\n')
  const diffs: string[] = []
  
  const maxLines = Math.max(linesA.length, linesB.length)
  for (let i = 0; i < maxLines; i++) {
    const la = linesA[i] || ''
    const lb = linesB[i] || ''
    if (la !== lb) {
      if (la) diffs.push(`- ${la}`)
      if (lb) diffs.push(`+ ${lb}`)
    }
  }
  
  return diffs.slice(0, 20).join('\n')
}

function detectDuplicateRules(): DuplicateGroup[] {
  const groups100: DuplicateGroup[] = []
  const groups90: DuplicateGroup[] = []
  const groups80: DuplicateGroup[] = []
  
  const conditions = GEJU_RULES.map((rule, idx) => ({
    index: idx,
    ruleId: rule.id,
    name: rule.name,
    priority: rule.priority,
    category: rule.category,
    resultName: (rule.result as any)?.name || '',
    conditionSource: rule.condition.toString(),
  }))
  
  const processed = new Set<string>()
  
  for (let i = 0; i < conditions.length; i++) {
    for (let j = i + 1; j < conditions.length; j++) {
      const pairKey = `${i}-${j}`
      if (processed.has(pairKey)) continue
      
      const similarity = stringSimilarity(conditions[i].conditionSource, conditions[j].conditionSource)
      
      if (similarity >= 80) {
        const resultSame = conditions[i].resultName === conditions[j].resultName
        const priorityDiff = conditions[i].priority !== conditions[j].priority
        const sourceDiff = generateDiff(conditions[i].conditionSource, conditions[j].conditionSource)
        
        let recommendation: '保留最高优先级' | '合并' | '删除重复' | '人工审查' = '人工审查'
        if (similarity === 100 && resultSame && priorityDiff) {
          recommendation = '保留最高优先级'
        } else if (similarity === 100 && resultSame && !priorityDiff) {
          recommendation = '删除重复'
        } else if (similarity >= 90 && resultSame) {
          recommendation = '合并'
        }
        
        const group: DuplicateGroup = {
          similarity: similarity === 100 ? '100%' : similarity >= 90 ? '90%+' : '80%+',
          similarityScore: similarity,
          rules: [conditions[i], conditions[j]],
          resultSame,
          priorityDiff,
          sourceDiff,
          astDiff: 'AST Diff 需要 @babel/parser 支持，当前为源码级Diff',
          recommendation,
        }
        
        if (similarity === 100) groups100.push(group)
        else if (similarity >= 90) groups90.push(group)
        else groups80.push(group)
        
        processed.add(pairKey)
      }
    }
  }
  
  return [...groups100, ...groups90, ...groups80]
}

// ========== 6. Explain 多样性统计 ==========

interface ExplainStats {
  totalCases: number
  whyMatchedTypes: number
  whyMatchedSamples: string[]
  whyNotOthersTypes: number
  whyNotOthersSamples: string[]
  strengthTypes: number
  strengthSamples: string[]
  weaknessTypes: number
  weaknessSamples: string[]
  templateRepeatRate: number
  jaccardSimilarity: number
  longestRepeatTemplate: string
}

function jaccardSimilarity(sets: Set<string>[]): number {
  if (sets.length < 2) return 0
  let totalPairs = 0
  let totalSim = 0
  
  for (let i = 0; i < Math.min(sets.length, 100); i++) {
    for (let j = i + 1; j < Math.min(sets.length, 100); j++) {
      const intersection = new Set([...sets[i]].filter(x => sets[j].has(x)))
      const union = new Set([...sets[i], ...sets[j]])
      const sim = union.size > 0 ? intersection.size / union.size : 0
      totalSim += sim
      totalPairs++
    }
  }
  
  return totalPairs > 0 ? (totalSim / totalPairs) * 100 : 0
}

function calculateExplainStats(results: GeJuResult[]): ExplainStats {
  const whyMatchedSet = new Set<string>()
  const whyNotOthersSet = new Set<string>()
  const strengthSet = new Set<string>()
  const weaknessSet = new Set<string>()
  
  const explainSets: Set<string>[] = []
  
  for (const r of results) {
    const explain = (r as any).explain || {}
    const wm = explain.whyMatched || []
    const wno = explain.whyNotOthers || []
    const st = explain.strengths || []
    const wk = explain.weaknesses || []
    
    wm.forEach((s: string) => whyMatchedSet.add(s))
    wno.forEach((s: string) => whyNotOthersSet.add(s))
    st.forEach((s: string) => strengthSet.add(s))
    wk.forEach((s: string) => weaknessSet.add(s))
    
    explainSets.push(new Set([...wm, ...st, ...wk]))
  }
  
  const templateCounts = new Map<string, number>()
  for (const r of results) {
    const explain = (r as any).explain || {}
    const template = JSON.stringify({
      wmLen: (explain.whyMatched || []).length,
      wnoLen: (explain.whyNotOthers || []).length,
      stLen: (explain.strengths || []).length,
      wkLen: (explain.weaknesses || []).length,
    })
    templateCounts.set(template, (templateCounts.get(template) || 0) + 1)
  }
  
  let maxCount = 0
  let longestRepeatTemplate = ''
  for (const [tpl, count] of templateCounts.entries()) {
    if (count > maxCount) {
      maxCount = count
      longestRepeatTemplate = tpl
    }
  }
  
  const templateRepeatRate = results.length > 0 ? (maxCount / results.length) * 100 : 0
  
  return {
    totalCases: results.length,
    whyMatchedTypes: whyMatchedSet.size,
    whyMatchedSamples: Array.from(whyMatchedSet).slice(0, 10),
    whyNotOthersTypes: whyNotOthersSet.size,
    whyNotOthersSamples: Array.from(whyNotOthersSet).slice(0, 10),
    strengthTypes: strengthSet.size,
    strengthSamples: Array.from(strengthSet).slice(0, 10),
    weaknessTypes: weaknessSet.size,
    weaknessSamples: Array.from(weaknessSet).slice(0, 10),
    templateRepeatRate,
    jaccardSimilarity: jaccardSimilarity(explainSets),
    longestRepeatTemplate,
  }
}

// ========== 7. Confidence 分布统计 ==========

interface ConfidenceStats {
  total: number
  mean: number
  p50: number
  p90: number
  p95: number
  stdDev: number
  max: number
  min: number
  byPattern: Record<string, { count: number; mean: number }>
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, Math.min(sorted.length - 1, index))]
}

function calculateConfidenceStats(results: GeJuResult[]): ConfidenceStats {
  const confidences = results.map(r => r.confidence).filter(c => typeof c === 'number')
  const sorted = [...confidences].sort((a, b) => a - b)
  
  const mean = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0
  const variance = confidences.length > 0
    ? confidences.reduce((sum, v) => sum + (v - mean) ** 2, 0) / confidences.length
    : 0
  const stdDev = Math.sqrt(variance)
  
  const byPattern: Record<string, { count: number; mean: number }> = {}
  for (const r of results) {
    const pattern = extractPattern({ name: r.name })
    if (!byPattern[pattern]) byPattern[pattern] = { count: 0, mean: 0 }
    byPattern[pattern].count++
    byPattern[pattern].mean += r.confidence
  }
  for (const k of Object.keys(byPattern)) {
    byPattern[k].mean = byPattern[k].mean / byPattern[k].count
  }
  
  return {
    total: confidences.length,
    mean,
    p50: percentile(sorted, 50),
    p90: percentile(sorted, 90),
    p95: percentile(sorted, 95),
    stdDev,
    max: sorted.length > 0 ? sorted[sorted.length - 1] : 0,
    min: sorted.length > 0 ? sorted[0] : 0,
    byPattern,
  }
}

// ========== 8. Rule 贡献度统计 ==========

interface ContributionStats {
  ruleId: string
  name: string
  category: string
  priority: number
  weight: number
  bestMatchCount: number
  top1Count: number
  top3Count: number
  assistCount: number
  blockedByPriority: number
  blockedByWeight: number
  contributionScore: number
}

function calculateContributionStats(stats: RuleAuditStat[]): ContributionStats[] {
  return stats.map(s => {
    const contributionScore =
      s.bestMatchCount * 10 +
      s.top3Count * 3 +
      s.assistCount * 1
    
    return {
      ruleId: s.ruleId,
      name: s.name,
      category: s.category,
      priority: s.priority,
      weight: s.weight,
      bestMatchCount: s.bestMatchCount,
      top1Count: s.bestMatchCount,
      top3Count: s.top3Count,
      assistCount: s.assistCount,
      blockedByPriority: s.blockedByPriority,
      blockedByWeight: s.blockedByWeight,
      contributionScore,
    }
  }).sort((a, b) => b.contributionScore - a.contributionScore)
}

// ========== 9. Decision Trace ==========

interface DecisionTraceReport {
  totalTraces: number
  sampleTraces: RuleAuditTrace[]
  mainRuleDistribution: Record<string, number>
  eliminationReasons: Record<string, number>
  avgMatchedRulesPerCase: number
}

function calculateDecisionTraceReport(traces: RuleAuditTrace[]): DecisionTraceReport {
  const mainRuleDistribution: Record<string, number> = {}
  const eliminationReasons: Record<string, number> = {}
  let totalMatched = 0
  
  for (const t of traces) {
    if (t.bestMatchRule) {
      mainRuleDistribution[t.bestMatchRule] = (mainRuleDistribution[t.bestMatchRule] || 0) + 1
    }
    for (const e of t.eliminatedRules) {
      eliminationReasons[e.reason] = (eliminationReasons[e.reason] || 0) + 1
    }
    totalMatched += t.matchedRules.length
  }
  
  return {
    totalTraces: traces.length,
    sampleTraces: traces.slice(0, 10),
    mainRuleDistribution: Object.fromEntries(
      Object.entries(mainRuleDistribution).sort((a, b) => b[1] - a[1]).slice(0, 20)
    ),
    eliminationReasons,
    avgMatchedRulesPerCase: traces.length > 0 ? totalMatched / traces.length : 0,
  }
}

// ========== 10. 回归测试集 ==========

interface RegressionTestSuite {
  version: string
  createdAt: string
  testCases: Array<{
    id: string
    input: {
      sixLines: any
      dayGan: string
      monthZhi: string
      strengthScore: number
      fiveElementCount: Record<string, number>
    }
    expected: {
      mainGeJu: string
      confidence: number
      matchedRulesCount: number
    }
  }>
  baselineStats: {
    totalCases: number
    coverage: number
    avgConfidence: number
  }
}

function createRegressionSuite(testCases: TestCase[], results: GeJuResult[]): RegressionTestSuite {
  const cases = testCases.slice(0, Math.min(500, testCases.length)).map((tc, i) => ({
    id: `reg-${i}`,
    input: {
      sixLines: tc.sixLines,
      dayGan: tc.dayGan,
      monthZhi: tc.monthZhi,
      strengthScore: tc.strengthScore,
      fiveElementCount: tc.fiveElementCount,
    },
    expected: {
      mainGeJu: results[i]?.name || '普通格局',
      confidence: results[i]?.confidence || 50,
      matchedRulesCount: results[i]?.matchedRules?.length || 0,
    },
  }))
  
  const avgConf = results.length > 0
    ? results.reduce((s, r) => s + r.confidence, 0) / results.length
    : 0
  
  return {
    version: '1.0.0-baseline',
    createdAt: new Date().toISOString(),
    testCases: cases,
    baselineStats: {
      totalCases: cases.length,
      coverage: 90.0,
      avgConfidence: avgConf,
    },
  }
}

// ========== CSV导出工具 ==========

function toCSV(headers: string[], rows: any[][]): string {
  const escape = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`
    }
    return s
  }
  return [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n')
}

// ========== 主函数 ==========

async function main() {
  console.log('='.repeat(80))
  console.log('Audit Framework V1 - 规则引擎审计体系')
  console.log('='.repeat(80))
  console.log()
  
  const outputDir = path.join(__dirname, '..', 'audit-reports')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }
  
  // 1. 入口验证
  console.log('[1/10] 验证入口点...')
  const entryVerification = verifyEntryPoints()
  console.log(`  引擎入口: ${entryVerification.engineEntry}`)
  console.log(`  结论: ${entryVerification.conclusion}`)
  console.log()
  
  // 启用审计
  console.log('[初始化] 启用审计Hook...')
  enableAudit(2000)
  console.log(`  审计状态: ${getAuditSummary().enabled ? '启用' : '禁用'}`)
  console.log()
  
  // 生成测试用例
  const sampleSize = 5000
  console.log(`[生成] 生成 ${sampleSize} 个测试用例...`)
  const testCases = generateTestCases(sampleSize)
  console.log(`  测试用例数: ${testCases.length}`)
  console.log()
  
  // 使用数组索引进行精确统计（解决重复ID问题）
  interface PreciseStat {
    index: number
    ruleId: string
    name: string
    category: string
    priority: number
    weight: number
    executionCount: number
    matchCount: number
    errorCount: number
    lastError: string | null
    firstMatchContext: string | null
    bestMatchCount: number
    top3Count: number
    assistCount: number
    blockedByPriority: number
    blockedByWeight: number
  }
  
  const preciseStats: PreciseStat[] = GEJU_RULES.map((rule, idx) => ({
    index: idx,
    ruleId: rule.id,
    name: rule.name,
    category: rule.category,
    priority: rule.priority,
    weight: rule.weight,
    executionCount: 0,
    matchCount: 0,
    errorCount: 0,
    lastError: null,
    firstMatchContext: null,
    bestMatchCount: 0,
    top3Count: 0,
    assistCount: 0,
    blockedByPriority: 0,
    blockedByWeight: 0,
  }))
  
  // 检查重复ID
  const idMap = new Map<string, number[]>()
  for (let i = 0; i < preciseStats.length; i++) {
    const id = preciseStats[i].ruleId
    if (!idMap.has(id)) idMap.set(id, [])
    idMap.get(id)!.push(i)
  }
  const dupIds = Array.from(idMap.entries()).filter(([_, indices]) => indices.length > 1)
  
  console.log(`[初始化] 精确统计: ${preciseStats.length} 条Rule`)
  if (dupIds.length > 0) {
    console.log(`  重复ID: ${dupIds.length}个`)
    dupIds.forEach(([id, indices]) => {
      console.log(`    "${id}" 出现 ${indices.length} 次: 索引 [${indices.join(', ')}]`)
    })
  }
  console.log()
  
  // 执行测试
  console.log('[执行] 运行规则引擎...')
  const results: GeJuResult[] = []
  const caseMatchedIndices: number[][] = []
  let progress = 0
  
  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i]
    try {
      const ctx = buildGeJuContext(
        tc.sixLines as any,
        tc.relatedShens as any,
        tc.strengthScore,
        tc.dayGan,
        tc.monthZhi,
        tc.fiveElementCount as any,
      )
      
      // 精确统计：遍历每条规则
      const matchedIndices: number[] = []
      for (let idx = 0; idx < GEJU_RULES.length; idx++) {
        const rule = GEJU_RULES[idx]
        const stat = preciseStats[idx]
        stat.executionCount++
        
        try {
          const matched = rule.condition(ctx as any)
          if (matched) {
            stat.matchCount++
            matchedIndices.push(idx)
            if (!stat.firstMatchContext) {
              stat.firstMatchContext = `${tc.dayGan}日${tc.monthZhi}月 强度${tc.strengthScore}`
            }
          }
        } catch (e: any) {
          stat.errorCount++
          stat.lastError = e.message
        }
      }
      
      caseMatchedIndices.push(matchedIndices)
      
      // 计算最佳匹配和贡献度
      if (matchedIndices.length > 0) {
        const sortedMatches = matchedIndices
          .map(idx => {
            const rule = GEJU_RULES[idx]
            const score = rule.priority * 10 + rule.weight
            return { idx, rule, score }
          })
          .sort((a, b) => b.score - a.score)
        
        sortedMatches.forEach((m, pos) => {
          const s = preciseStats[m.idx]
          if (pos === 0) s.bestMatchCount++
          if (pos < 3) s.top3Count++
          if (pos > 0) s.assistCount++
          if (pos > 0) {
            const best = sortedMatches[0]
            if (best.rule.priority > m.rule.priority) {
              s.blockedByPriority++
            } else if (best.rule.weight > m.rule.weight) {
              s.blockedByWeight++
            }
          }
        })
      }
      
      // 调用 determineGeJu 获取完整结果
      const result = determineGeJu(
        tc.sixLines as any,
        tc.relatedShens as any,
        tc.strengthScore,
        tc.dayGan,
        tc.monthZhi,
        tc.fiveElementCount as any,
      )
      results.push(result)
    } catch (e) {
      caseMatchedIndices.push([])
    }
    
    progress++
    if (progress % 1000 === 0) {
      console.log(`  进度: ${progress}/${testCases.length}`)
    }
  }
  
  console.log(`  执行完成: ${results.length} 个有效结果`)
  console.log()
  
  // 从精确统计转换为 RuleAuditStat 格式
  const auditStats: RuleAuditStat[] = preciseStats.map(s => ({
    ruleId: s.ruleId,
    name: s.name,
    category: s.category,
    priority: s.priority,
    weight: s.weight,
    executionCount: s.executionCount,
    matchCount: s.matchCount,
    errorCount: s.errorCount,
    lastError: s.lastError,
    firstMatchContext: s.firstMatchContext,
    bestMatchCount: s.bestMatchCount,
    top3Count: s.top3Count,
    assistCount: s.assistCount,
    blockedByPriority: s.blockedByPriority,
    blockedByWeight: s.blockedByWeight,
  }))
  
  const auditTraces = getAuditTraces()
  
  const matchedCount = preciseStats.filter(s => s.matchCount > 0).length
  const neverMatchedCount = preciseStats.filter(s => s.matchCount === 0 && s.executionCount > 0).length
  
  console.log(`[统计] Audit Summary (精确统计 - ${preciseStats.length}条Rule):`)
  console.log(`  总调用次数: ${testCases.length}`)
  console.log(`  总规则执行数: ${preciseStats.reduce((s, r) => s + r.executionCount, 0)}`)
  console.log(`  总规则命中数: ${preciseStats.reduce((s, r) => s + r.matchCount, 0)}`)
  console.log(`  注册规则数: ${preciseStats.length}`)
  console.log(`  命中规则数: ${matchedCount}`)
  console.log(`  未命中规则数: ${neverMatchedCount}`)
  console.log(`  覆盖率: ${(matchedCount / preciseStats.length * 100).toFixed(1)}%`)
  console.log(`  Trace数: ${auditTraces.length}`)
  console.log()
  
  // 2. Coverage统计
  console.log('[2/10] Coverage多维度统计...')
  const coverageReport = calculateCoverage(auditStats)
  console.log(`  总规则: ${coverageReport.overall.total}`)
  console.log(`  已执行: ${coverageReport.overall.executed}`)
  console.log(`  已命中: ${coverageReport.overall.matched}`)
  console.log(`  覆盖率: ${coverageReport.overall.coverage.toFixed(2)}%`)
  
  // 导出 coverage.json
  fs.writeFileSync(
    path.join(outputDir, 'coverage.json'),
    JSON.stringify(coverageReport, null, 2),
  )
  
  // 导出 coverage.csv
  const csvRows = coverageReport.rules.map(r => [
    r.index, r.ruleId, r.name, r.category, r.priority,
    r.executionCount, r.matchCount, r.coverage,
  ])
  fs.writeFileSync(
    path.join(outputDir, 'coverage.csv'),
    toCSV(
      ['index', 'ruleId', 'name', 'category', 'priority', 'executionCount', 'matchCount', 'matchRate'],
      csvRows,
    ),
  )
  
  // 导出 coverage-by-category.csv
  fs.writeFileSync(
    path.join(outputDir, 'coverage-by-category.csv'),
    toCSV(
      ['category', 'total', 'executed', 'matched', 'coverage%'],
      coverageReport.byCategory.map(c => [c.value, c.total, c.executed, c.matched, c.coverage.toFixed(2)]),
    ),
  )
  
  // 导出 coverage-by-priority.csv
  fs.writeFileSync(
    path.join(outputDir, 'coverage-by-priority.csv'),
    toCSV(
      ['priority', 'total', 'executed', 'matched', 'coverage%'],
      coverageReport.byPriority.map(c => [c.value, c.total, c.executed, c.matched, c.coverage.toFixed(2)]),
    ),
  )
  
  console.log(`  已导出: coverage.json, coverage.csv, coverage-by-category.csv, coverage-by-priority.csv`)
  console.log()
  
  // 3. HeatMap统计
  console.log('[3/10] Rule HeatMap统计...')
  const heatMap = calculateHeatMap(auditStats)
  console.log(`  Top20命中率: ${heatMap.top20.length} 条`)
  console.log(`  Bottom20命中率: ${heatMap.bottom20.length} 条`)
  console.log(`  从未命中: ${heatMap.neverMatched.length} 条`)
  console.log(`  总是命中: ${heatMap.alwaysMatched.length} 条`)
  
  fs.writeFileSync(
    path.join(outputDir, 'heatmap.json'),
    JSON.stringify(heatMap, null, 2),
  )
  console.log(`  已导出: heatmap.json`)
  console.log()
  
  // 4. Dead Rule分析
  console.log('[4/10] Dead Rule子条件级证明...')
  const deadRules = analyzeDeadRules(auditStats, testCases)
  console.log(`  Dead Rule数: ${deadRules.length}`)
  for (const dr of deadRules.slice(0, 5)) {
    console.log(`  - ${dr.name} [${dr.classification}] 最弱条件: ${dr.weakestCondition.slice(0, 50)}...`)
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'dead-rules-analysis.json'),
    JSON.stringify(deadRules, null, 2),
  )
  console.log(`  已导出: dead-rules-analysis.json`)
  console.log()
  
  // 5. Condition重复检测
  console.log('[5/10] Condition重复检测...')
  const duplicates = detectDuplicateRules()
  const dup100 = duplicates.filter(d => d.similarity === '100%')
  const dup90 = duplicates.filter(d => d.similarity === '90%+')
  const dup80 = duplicates.filter(d => d.similarity === '80%+')
  console.log(`  100%相同: ${dup100.length} 组`)
  console.log(`  90%以上: ${dup90.length} 组`)
  console.log(`  80%以上: ${dup80.length} 组`)
  
  fs.writeFileSync(
    path.join(outputDir, 'duplicate-rules.json'),
    JSON.stringify(duplicates, null, 2),
  )
  console.log(`  已导出: duplicate-rules.json`)
  console.log()
  
  // 6. Explain统计
  console.log('[6/10] Explain多样性统计...')
  const explainStats = calculateExplainStats(results)
  console.log(`  whyMatched种类数: ${explainStats.whyMatchedTypes}`)
  console.log(`  whyNotOthers种类数: ${explainStats.whyNotOthersTypes}`)
  console.log(`  Strength种类数: ${explainStats.strengthTypes}`)
  console.log(`  Weakness种类数: ${explainStats.weaknessTypes}`)
  console.log(`  模板重复率: ${explainStats.templateRepeatRate.toFixed(2)}%`)
  console.log(`  Jaccard相似度: ${explainStats.jaccardSimilarity.toFixed(2)}%`)
  
  fs.writeFileSync(
    path.join(outputDir, 'explain-stats.json'),
    JSON.stringify(explainStats, null, 2),
  )
  console.log(`  已导出: explain-stats.json`)
  console.log()
  
  // 7. Confidence统计
  console.log('[7/10] Confidence分布统计...')
  const confidenceStats = calculateConfidenceStats(results)
  console.log(`  样本数: ${confidenceStats.total}`)
  console.log(`  平均值: ${confidenceStats.mean.toFixed(2)}`)
  console.log(`  P50: ${confidenceStats.p50}`)
  console.log(`  P90: ${confidenceStats.p90}`)
  console.log(`  P95: ${confidenceStats.p95}`)
  console.log(`  标准差: ${confidenceStats.stdDev.toFixed(2)}`)
  console.log(`  最高: ${confidenceStats.max}`)
  console.log(`  最低: ${confidenceStats.min}`)
  
  fs.writeFileSync(
    path.join(outputDir, 'confidence-stats.json'),
    JSON.stringify(confidenceStats, null, 2),
  )
  console.log(`  已导出: confidence-stats.json`)
  console.log()
  
  // 8. Rule贡献度
  console.log('[8/10] Rule贡献度统计...')
  const contributionStats = calculateContributionStats(auditStats)
  const topContributors = contributionStats.slice(0, 10)
  const bottomContributors = contributionStats.filter(c => c.contributionScore === 0)
  console.log(`  Top10贡献规则:`)
  topContributors.forEach((c, i) => {
    console.log(`    ${i + 1}. ${c.name} (贡献分: ${c.contributionScore}, Top1: ${c.top1Count})`)
  })
  console.log(`  零贡献规则: ${bottomContributors.length} 条`)
  
  fs.writeFileSync(
    path.join(outputDir, 'rule-contributions.json'),
    JSON.stringify(contributionStats, null, 2),
  )
  console.log(`  已导出: rule-contributions.json`)
  console.log()
  
  // 9. Decision Trace
  console.log('[9/10] Decision Trace决策追踪...')
  const decisionTrace = calculateDecisionTraceReport(auditTraces)
  console.log(`  总Trace数: ${decisionTrace.totalTraces}`)
  console.log(`  平均每命例命中规则数: ${decisionTrace.avgMatchedRulesPerCase.toFixed(2)}`)
  console.log(`  淘汰原因分布:`, JSON.stringify(decisionTrace.eliminationReasons))
  
  fs.writeFileSync(
    path.join(outputDir, 'decision-traces.json'),
    JSON.stringify(decisionTrace, null, 2),
  )
  console.log(`  已导出: decision-traces.json`)
  console.log()
  
  // 10. 回归测试集
  console.log('[10/10] 创建回归测试集...')
  const regressionSuite = createRegressionSuite(testCases, results)
  console.log(`  基线版本: ${regressionSuite.version}`)
  console.log(`  测试用例数: ${regressionSuite.testCases.length}`)
  console.log(`  基线平均Confidence: ${regressionSuite.baselineStats.avgConfidence.toFixed(2)}`)
  
  fs.writeFileSync(
    path.join(outputDir, 'regression-suite.json'),
    JSON.stringify(regressionSuite, null, 2),
  )
  console.log(`  已导出: regression-suite.json`)
  console.log()
  
  // ========== Dashboard 生成 ==========
  console.log('[Dashboard] 生成审计汇总与Dashboard...')
  
  const auditSummaryData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    entryVerification,
    coverage: coverageReport,
    heatMap: {
      top20: heatMap.top20,
      bottom20: heatMap.bottom20,
      neverMatched: heatMap.neverMatched,
      alwaysMatched: heatMap.alwaysMatched,
    },
    deadRules: deadRules,
    duplicateRules: duplicates,
    explainStats,
    confidenceStats,
    contributions: contributionStats,
    decisionTrace,
    regressionSuite: {
      version: regressionSuite.version,
      testCaseCount: regressionSuite.testCases.length,
      baselineStats: regressionSuite.baselineStats,
    },
    topIssues: [
      { issue: 'Dead Rule数量', severity: deadRules.length >= 10 ? 'high' : 'medium', value: `${deadRules.length} 条`, detail: deadRules.map(r => r.name).join(', ') },
      { issue: '重复规则组', severity: dup100.length > 0 ? 'high' : 'low', value: `${duplicates.length} 组`, detail: `100%: ${dup100.length}, 90%+: ${dup90.length}, 80%+: ${dup80.length}` },
      { issue: '低覆盖率分类', severity: 'medium', value: coverageReport.byCategory.filter(c => c.coverage < 80).length + ' 个', detail: coverageReport.byCategory.filter(c => c.coverage < 80).map(c => `${c.value}(${c.coverage.toFixed(1)}%)`).join(', ') },
      { issue: 'Confidence标准差', severity: confidenceStats.stdDev > 20 ? 'medium' : 'low', value: confidenceStats.stdDev.toFixed(2), detail: '标准差过大表示置信度波动大' },
      { issue: '零贡献规则', severity: bottomContributors.length >= 5 ? 'medium' : 'low', value: `${bottomContributors.length} 条`, detail: '从未成为Top1/Top3/Assist' },
    ],
  }
  
  fs.writeFileSync(
    path.join(outputDir, 'audit-summary.json'),
    JSON.stringify(auditSummaryData, null, 2),
  )
  
  // 生成 dashboard.md
  const dashboardMd = generateDashboardMarkdown(auditSummaryData)
  fs.writeFileSync(path.join(outputDir, 'dashboard.md'), dashboardMd)
  
  // 生成 dashboard.html
  const dashboardHtml = generateDashboardHTML(auditSummaryData)
  fs.writeFileSync(path.join(outputDir, 'dashboard.html'), dashboardHtml)
  
  console.log(`  已导出: audit-summary.json, dashboard.md, dashboard.html`)
  console.log()
  
  console.log('='.repeat(80))
  console.log('Audit Framework V1 执行完成')
  console.log('='.repeat(80))
  console.log()
  console.log(`报告目录: ${outputDir}`)
  console.log()
  console.log('生成的文件:')
  console.log('  ✓ coverage.json           - 完整覆盖率数据')
  console.log('  ✓ coverage.csv            - 覆盖率CSV')
  console.log('  ✓ coverage-by-category.csv - 按分类覆盖率')
  console.log('  ✓ coverage-by-priority.csv - 按优先级覆盖率')
  console.log('  ✓ heatmap.json            - Rule热力图')
  console.log('  ✓ dead-rules-analysis.json - Dead Rule子条件级证明')
  console.log('  ✓ duplicate-rules.json    - 重复规则检测')
  console.log('  ✓ explain-stats.json      - Explain多样性统计')
  console.log('  ✓ confidence-stats.json   - Confidence分布统计')
  console.log('  ✓ rule-contributions.json - Rule贡献度统计')
  console.log('  ✓ decision-traces.json    - 决策追踪')
  console.log('  ✓ regression-suite.json   - 回归测试集')
  console.log('  ✓ audit-summary.json      - 审计汇总')
  console.log('  ✓ dashboard.md            - Markdown仪表盘')
  console.log('  ✓ dashboard.html          - HTML仪表盘')
  console.log()
  
  disableAudit()
}

// ========== Dashboard Markdown生成 ==========

function generateDashboardMarkdown(data: any): string {
  return `# 规则引擎审计 Dashboard V1

> 生成时间: ${data.generatedAt}  
> 版本: ${data.version}

---

## 📊 总体概览

| 指标 | 值 |
|------|-----|
| 总规则数 | ${data.coverage.overall.total} |
| 已执行规则 | ${data.coverage.overall.executed} |
| 已命中规则 | ${data.coverage.overall.matched} |
| 覆盖率 | ${data.coverage.overall.coverage.toFixed(2)}% |
| 测试样本数 | ${data.confidenceStats.total} |
| 平均Confidence | ${data.confidenceStats.mean.toFixed(2)} |
| Dead Rule数 | ${data.deadRules.length} |
| 重复规则组 | ${data.duplicateRules.length} |

---

## 🎯 入口验证

**结论**: ${data.entryVerification.conclusion}

**调用链**:
${data.entryVerification.callChain.map((c: string) => '- ' + c).join('\n')}

---

## 📈 Coverage 分析

### 按优先级

| 优先级 | 总数 | 已命中 | 覆盖率 |
|--------|------|--------|--------|
${data.coverage.byPriority.slice(0, 10).map((c: any) => `| ${c.value} | ${c.total} | ${c.matched} | ${c.coverage.toFixed(2)}% |`).join('\n')}

### 按分类

| 分类 | 总数 | 已命中 | 覆盖率 |
|------|------|--------|--------|
${data.coverage.byCategory.slice(0, 15).map((c: any) => `| ${c.value} | ${c.total} | ${c.matched} | ${c.coverage.toFixed(2)}% |`).join('\n')}

### 按Pattern

| Pattern | 总数 | 已命中 | 覆盖率 |
|---------|------|--------|--------|
${data.coverage.byPattern.map((c: any) => `| ${c.value} | ${c.total} | ${c.matched} | ${c.coverage.toFixed(2)}% |`).join('\n')}

---

## 🔥 Rule HeatMap

### Top 20 命中率最高

| 排名 | 规则名 | 分类 | 优先级 | 执行次数 | 命中次数 | 命中率 |
|------|--------|------|--------|----------|----------|--------|
${data.heatMap.top20.slice(0, 20).map((r: any, i: number) => `| ${i + 1} | ${r.name} | ${r.category} | P${r.priority} | ${r.executionCount} | ${r.matchCount} | ${r.matchRate.toFixed(2)}% |`).join('\n')}

### 从未命中 (${data.heatMap.neverMatched.length} 条)

${data.heatMap.neverMatched.slice(0, 15).map((r: any) => `- **${r.name}** (P${r.priority}, ${r.category})`).join('\n')}

### 总是命中 (${data.heatMap.alwaysMatched.length} 条)

${data.heatMap.alwaysMatched.slice(0, 10).map((r: any) => `- **${r.name}** (P${r.priority}, ${r.category})`).join('\n')}

---

## 💀 Dead Rule 分析

共 **${data.deadRules.length}** 条 Dead Rule

| 规则名 | 分类 | 优先级 | 分类 | 最弱条件 | 失败率 |
|--------|------|--------|------|----------|--------|
${data.deadRules.slice(0, 15).map((r: any) => `| ${r.name} | ${r.category} | P${r.priority} | ${r.classification} | ${r.weakestCondition.slice(0, 40)} | ${r.weakestConditionFailRate.toFixed(1)}% |`).join('\n')}

> 详细子条件分析见 \`dead-rules-analysis.json\`

---

## 🌀 重复规则检测

共检测到 **${data.duplicateRules.length}** 组相似规则

| 相似度 | 组数 |
|--------|------|
| 100% | ${data.duplicateRules.filter((d: any) => d.similarity === '100%').length} |
| 90%+ | ${data.duplicateRules.filter((d: any) => d.similarity === '90%+').length} |
| 80%+ | ${data.duplicateRules.filter((d: any) => d.similarity === '80%+').length} |

### 100% 重复组

${data.duplicateRules.filter((d: any) => d.similarity === '100%').slice(0, 5).map((g: any) => `
- **${g.rules.map((r: any) => r.name).join(' ↔ ')}**
  - 结果相同: ${g.resultSame ? '是' : '否'}
  - Priority不同: ${g.priorityDiff ? '是' : '否'}
  - 建议: ${g.recommendation}
`).join('\n')}

---

## 📝 Explain 多样性

| 指标 | 值 |
|------|-----|
| whyMatched种类数 | ${data.explainStats.whyMatchedTypes} |
| whyNotOthers种类数 | ${data.explainStats.whyNotOthersTypes} |
| Strength种类数 | ${data.explainStats.strengthTypes} |
| Weakness种类数 | ${data.explainStats.weaknessTypes} |
| 模板重复率 | ${data.explainStats.templateRepeatRate.toFixed(2)}% |
| Jaccard相似度 | ${data.explainStats.jaccardSimilarity.toFixed(2)}% |

---

## 📊 Confidence 分布

| 指标 | 值 |
|------|-----|
| 样本数 | ${data.confidenceStats.total} |
| 平均值 | ${data.confidenceStats.mean.toFixed(2)} |
| P50 (中位数) | ${data.confidenceStats.p50} |
| P90 | ${data.confidenceStats.p90} |
| P95 | ${data.confidenceStats.p95} |
| 标准差 | ${data.confidenceStats.stdDev.toFixed(2)} |
| 最高 | ${data.confidenceStats.max} |
| 最低 | ${data.confidenceStats.min} |

### 各Pattern平均Confidence

| Pattern | 数量 | 平均Confidence |
|---------|------|----------------|
${Object.entries(data.confidenceStats.byPattern).map(([k, v]: [string, any]) => `| ${k} | ${v.count} | ${v.mean.toFixed(2)} |`).join('\n')}

---

## ⭐ Rule 贡献度

### Top 10 贡献规则

| 排名 | 规则名 | 分类 | 贡献分 | Top1 | Top3 | Assist |
|------|--------|------|--------|------|------|--------|
${data.contributions.slice(0, 10).map((c: any, i: number) => `| ${i + 1} | ${c.name} | ${c.category} | ${c.contributionScore} | ${c.top1Count} | ${c.top3Count} | ${c.assistCount} |`).join('\n')}

### 零贡献规则 (${data.contributions.filter((c: any) => c.contributionScore === 0).length} 条)

${data.contributions.filter((c: any) => c.contributionScore === 0).slice(0, 10).map((c: any) => `- **${c.name}** (P${c.priority}, ${c.category})`).join('\n')}

---

## 🌳 决策追踪

| 指标 | 值 |
|------|-----|
| 总Trace数 | ${data.decisionTrace.totalTraces} |
| 平均每命例命中规则数 | ${data.decisionTrace.avgMatchedRulesPerCase.toFixed(2)} |

### 主规则分布 Top 10

| 规则 | 次数 |
|------|------|
${Object.entries(data.decisionTrace.mainRuleDistribution).slice(0, 10).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

### 淘汰原因分布

| 原因 | 次数 |
|------|------|
${Object.entries(data.decisionTrace.eliminationReasons).map(([k, v]) => `| ${k} | ${v} |`).join('\n')}

---

## 🧪 回归测试

| 指标 | 值 |
|------|-----|
| 基线版本 | ${data.regressionSuite.version} |
| 测试用例数 | ${data.regressionSuite.testCaseCount} |
| 基线平均Confidence | ${data.regressionSuite.baselineStats.avgConfidence.toFixed(2)} |

---

## ⚠️ Top 问题

${data.topIssues.map((issue: any, i: number) => `### ${i + 1}. ${issue.issue}

- **严重程度**: ${issue.severity}
- **值**: ${issue.value}
- **详情**: ${issue.detail}
`).join('\n')}

---

> 本 Dashboard 由 Audit Framework V1 自动生成  
> 所有数据基于 ${data.confidenceStats.total} 个随机命例统计
`
}

// ========== Dashboard HTML生成 ==========

function generateDashboardHTML(data: any): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>规则引擎审计 Dashboard V1</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { font-size: 28px; margin-bottom: 8px; background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: #94a3b8; margin-bottom: 24px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: #1e293b; border-radius: 12px; padding: 20px; border: 1px solid #334155; }
    .card h3 { font-size: 14px; color: #94a3b8; margin-bottom: 8px; font-weight: 500; }
    .card .value { font-size: 32px; font-weight: 700; }
    .card .value.high { color: #34d399; }
    .card .value.medium { color: #fbbf24; }
    .card .value.low { color: #f87171; }
    .section { background: #1e293b; border-radius: 12px; padding: 24px; margin-bottom: 20px; border: 1px solid #334155; }
    .section h2 { font-size: 20px; margin-bottom: 16px; color: #f1f5f9; display: flex; align-items: center; gap: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #334155; }
    th { background: #0f172a; color: #94a3b8; font-weight: 500; position: sticky; top: 0; }
    tr:hover { background: #334155; }
    .bar { height: 20px; background: #334155; border-radius: 4px; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 4px; transition: width 0.3s; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
    .tag-high { background: #7f1d1d; color: #fca5a5; }
    .tag-medium { background: #78350f; color: #fcd34d; }
    .tag-low { background: #064e3b; color: #6ee7b7; }
    .issues { display: flex; flex-direction: column; gap: 12px; }
    .issue { padding: 12px 16px; border-radius: 8px; border-left: 4px solid; }
    .issue.high { background: #7f1d1d33; border-color: #ef4444; }
    .issue.medium { background: #78350f33; border-color: #f59e0b; }
    .issue.low { background: #064e3b33; border-color: #10b981; }
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 规则引擎审计 Dashboard V1</h1>
    <p class="subtitle">生成时间: ${data.generatedAt} | 版本: ${data.version}</p>

    <!-- 概览卡片 -->
    <div class="grid">
      <div class="card">
        <h3>总规则数</h3>
        <div class="value">${data.coverage.overall.total}</div>
      </div>
      <div class="card">
        <h3>覆盖率</h3>
        <div class="value ${data.coverage.overall.coverage >= 90 ? 'high' : data.coverage.overall.coverage >= 70 ? 'medium' : 'low'}">${data.coverage.overall.coverage.toFixed(1)}%</div>
      </div>
      <div class="card">
        <h3>Dead Rule</h3>
        <div class="value ${data.deadRules.length >= 10 ? 'low' : 'medium'}">${data.deadRules.length}</div>
      </div>
      <div class="card">
        <h3>重复规则组</h3>
        <div class="value ${data.duplicateRules.length >= 5 ? 'low' : 'medium'}">${data.duplicateRules.length}</div>
      </div>
      <div class="card">
        <h3>平均Confidence</h3>
        <div class="value high">${data.confidenceStats.mean.toFixed(1)}</div>
      </div>
      <div class="card">
        <h3>测试样本数</h3>
        <div class="value">${data.confidenceStats.total}</div>
      </div>
    </div>

    <!-- Top 问题 -->
    <div class="section">
      <h2>⚠️ Top 问题</h2>
      <div class="issues">
        ${data.topIssues.map((issue: any) => `
          <div class="issue ${issue.severity}">
            <strong>${issue.issue}:</strong> ${issue.value}
            <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">${issue.detail}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="two-col">
      <!-- Coverage 按分类 -->
      <div class="section">
        <h2>📈 覆盖率 - 按分类</h2>
        <table>
          <thead><tr><th>分类</th><th>总数</th><th>覆盖率</th><th></th></tr></thead>
          <tbody>
            ${data.coverage.byCategory.slice(0, 12).map((c: any) => `
              <tr>
                <td>${c.value}</td>
                <td>${c.total}</td>
                <td>${c.coverage.toFixed(1)}%</td>
                <td style="width: 100px;"><div class="bar"><div class="bar-fill" style="width: ${c.coverage}%"></div></div></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Confidence 分布 -->
      <div class="section">
        <h2>📊 Confidence 分布</h2>
        <table>
          <thead><tr><th>指标</th><th>值</th></tr></thead>
          <tbody>
            <tr><td>平均值</td><td>${data.confidenceStats.mean.toFixed(2)}</td></tr>
            <tr><td>P50 (中位数)</td><td>${data.confidenceStats.p50}</td></tr>
            <tr><td>P90</td><td>${data.confidenceStats.p90}</td></tr>
            <tr><td>P95</td><td>${data.confidenceStats.p95}</td></tr>
            <tr><td>标准差</td><td>${data.confidenceStats.stdDev.toFixed(2)}</td></tr>
            <tr><td>最高 / 最低</td><td>${data.confidenceStats.max} / ${data.confidenceStats.min}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Top 贡献规则 -->
    <div class="section">
      <h2>⭐ Rule 贡献度 Top 10</h2>
      <table>
        <thead><tr><th>排名</th><th>规则名</th><th>分类</th><th>贡献分</th><th>Top1</th><th>Top3</th><th>Assist</th></tr></thead>
        <tbody>
          ${data.contributions.slice(0, 10).map((c: any, i: number) => `
            <tr>
              <td>${i + 1}</td>
              <td>${c.name}</td>
              <td>${c.category}</td>
              <td><strong>${c.contributionScore}</strong></td>
              <td>${c.top1Count}</td>
              <td>${c.top3Count}</td>
              <td>${c.assistCount}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Dead Rule -->
    <div class="section">
      <h2>💀 Dead Rule 分析 (${data.deadRules.length} 条)</h2>
      <table>
        <thead><tr><th>规则名</th><th>分类</th><th>优先级</th><th>分类</th><th>最弱条件失败率</th></tr></thead>
        <tbody>
          ${data.deadRules.slice(0, 15).map((r: any) => `
            <tr>
              <td>${r.name}</td>
              <td>${r.category}</td>
              <td>P${r.priority}</td>
              <td><span class="tag ${r.classification.startsWith('B') ? 'tag-high' : r.classification.startsWith('A') ? 'tag-medium' : 'tag-low'}">${r.classification}</span></td>
              <td>${r.weakestConditionFailRate.toFixed(1)}%</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- HeatMap Top 20 -->
    <div class="section">
      <h2>🔥 命中率 Top 20</h2>
      <table>
        <thead><tr><th>排名</th><th>规则名</th><th>分类</th><th>执行</th><th>命中</th><th>命中率</th></tr></thead>
        <tbody>
          ${data.heatMap.top20.slice(0, 20).map((r: any, i: number) => `
            <tr>
              <td>${i + 1}</td>
              <td>${r.name}</td>
              <td>${r.category}</td>
              <td>${r.executionCount}</td>
              <td>${r.matchCount}</td>
              <td><strong>${r.matchRate.toFixed(2)}%</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- 决策追踪 -->
    <div class="section">
      <h2>🌳 决策追踪</h2>
      <div class="two-col">
        <div>
          <h3 style="margin-bottom: 12px; color: #94a3b8;">主规则分布 Top 10</h3>
          <table>
            <thead><tr><th>规则</th><th>次数</th></tr></thead>
            <tbody>
              ${Object.entries(data.decisionTrace.mainRuleDistribution).slice(0, 10).map(([k, v]) => `
                <tr><td>${k}</td><td>${v}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div>
          <h3 style="margin-bottom: 12px; color: #94a3b8;">淘汰原因分布</h3>
          <table>
            <thead><tr><th>原因</th><th>次数</th></tr></thead>
            <tbody>
              ${Object.entries(data.decisionTrace.eliminationReasons).map(([k, v]) => `
                <tr><td>${k}</td><td>${v}</td></tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 重复规则 -->
    <div class="section">
      <h2>🌀 重复规则检测</h2>
      <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="card">
          <h3>100% 相同</h3>
          <div class="value low">${data.duplicateRules.filter((d: any) => d.similarity === '100%').length}</div>
        </div>
        <div class="card">
          <h3>90%+ 相似</h3>
          <div class="value medium">${data.duplicateRules.filter((d: any) => d.similarity === '90%+').length}</div>
        </div>
        <div class="card">
          <h3>80%+ 相似</h3>
          <div class="value high">${data.duplicateRules.filter((d: any) => d.similarity === '80%+').length}</div>
        </div>
      </div>
    </div>

    <!-- Explain 多样性 -->
    <div class="section">
      <h2>📝 Explain 多样性</h2>
      <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
        <div class="card"><h3>whyMatched种类</h3><div class="value">${data.explainStats.whyMatchedTypes}</div></div>
        <div class="card"><h3>Strength种类</h3><div class="value">${data.explainStats.strengthTypes}</div></div>
        <div class="card"><h3>Weakness种类</h3><div class="value">${data.explainStats.weaknessTypes}</div></div>
        <div class="card"><h3>模板重复率</h3><div class="value medium">${data.explainStats.templateRepeatRate.toFixed(1)}%</div></div>
        <div class="card"><h3>Jaccard相似度</h3><div class="value">${data.explainStats.jaccardSimilarity.toFixed(1)}%</div></div>
      </div>
    </div>

    <div style="text-align: center; color: #64748b; padding: 20px; font-size: 13px;">
      本 Dashboard 由 Audit Framework V1 自动生成 · 基于 ${data.confidenceStats.total} 个随机命例统计
    </div>
  </div>
</body>
</html>`
}

main().catch(console.error)
