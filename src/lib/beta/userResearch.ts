/**
 * 真实用户测试框架
 * 追踪完成率、跳出率、阅读时间、NPS、满意度、付费转化
 */

export interface UserResearchSession {
  id: string
  userId: string
  page: string
  startedAt: string
  completed: boolean
  bounced: boolean
  readTimeSeconds: number
  npsScore?: number
  satisfactionScore?: number
  payConversion?: {
    from: string
    to: string
    converted: boolean
  }
}

interface PageMetrics {
  page: string
  sessions: number
  completions: number
  bounces: number
  totalReadTime: number
  npsScores: number[]
  satisfactionScores: number[]
  conversions: number
  conversionAttempts: number
}

interface ResearchReport {
  generatedAt: string
  totalSessions: number
  overallCompletionRate: number
  overallBounceRate: number
  averageReadTime: number
  nps: number
  satisfaction: number
  payConversionRate: number
  pageBreakdown: PageMetrics[]
  recommendations: string[]
}

var sessions: UserResearchSession[] = []
var pageMetricsMap: Record<string, PageMetrics> = {}

function getOrCreatePageMetrics(page: string): PageMetrics {
  if (!pageMetricsMap[page]) {
    pageMetricsMap[page] = {
      page: page,
      sessions: 0,
      completions: 0,
      bounces: 0,
      totalReadTime: 0,
      npsScores: [],
      satisfactionScores: [],
      conversions: 0,
      conversionAttempts: 0
    }
  }
  return pageMetricsMap[page]
}

export function trackCompletionRate(page: string, completed: boolean): void {
  var metrics = getOrCreatePageMetrics(page)
  metrics.sessions += 1
  if (completed) {
    metrics.completions += 1
  }
  sessions.push({
    id: 'rs_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    userId: 'anonymous',
    page: page,
    startedAt: new Date().toISOString(),
    completed: completed,
    bounced: false,
    readTimeSeconds: 0
  })
}

export function trackBounceRate(page: string, bounced: boolean): void {
  var metrics = getOrCreatePageMetrics(page)
  if (bounced) {
    metrics.bounces += 1
  }
}

export function trackReadTime(page: string, seconds: number): void {
  var metrics = getOrCreatePageMetrics(page)
  metrics.totalReadTime += seconds
}

export function trackNPS(score: number): void {
  for (var page in pageMetricsMap) {
    pageMetricsMap[page].npsScores.push(score)
  }
}

export function trackSatisfaction(score: number): void {
  for (var page in pageMetricsMap) {
    pageMetricsMap[page].satisfactionScores.push(score)
  }
}

export function trackPayConversion(from: string, to: string): void {
  var page = from
  var metrics = getOrCreatePageMetrics(page)
  metrics.conversionAttempts += 1
  metrics.conversions += 1
}

function average(arr: number[]): number {
  if (arr.length === 0) return 0
  var sum = 0
  for (var i = 0; i < arr.length; i++) {
    sum += arr[i]
  }
  return sum / arr.length
}

function calculateNPS(scores: number[]): number {
  if (scores.length === 0) return 0
  var promoters = 0
  var detractors = 0
  for (var i = 0; i < scores.length; i++) {
    if (scores[i] >= 9) promoters += 1
    if (scores[i] <= 6) detractors += 1
  }
  return Math.round((promoters / scores.length - detractors / scores.length) * 100)
}

export function generateResearchReport(): ResearchReport {
  var pages = Object.keys(pageMetricsMap)
  var totalSessions = 0
  var totalCompletions = 0
  var totalBounces = 0
  var totalReadTime = 0
  var allNps: number[] = []
  var allSatisfaction: number[] = []
  var totalConversions = 0
  var totalConversionAttempts = 0

  var pageBreakdown: PageMetrics[] = []

  for (var i = 0; i < pages.length; i++) {
    var m = pageMetricsMap[pages[i]]
    totalSessions += m.sessions
    totalCompletions += m.completions
    totalBounces += m.bounces
    totalReadTime += m.totalReadTime
    totalConversions += m.conversions
    totalConversionAttempts += m.conversionAttempts

    for (var j = 0; j < m.npsScores.length; j++) {
      allNps.push(m.npsScores[j])
    }
    for (var k = 0; k < m.satisfactionScores.length; k++) {
      allSatisfaction.push(m.satisfactionScores[k])
    }

    pageBreakdown.push(m)
  }

  var completionRate = totalSessions > 0 ? totalCompletions / totalSessions : 0
  var bounceRate = totalSessions > 0 ? totalBounces / totalSessions : 0
  var avgReadTime = totalSessions > 0 ? totalReadTime / totalSessions : 0
  var nps = calculateNPS(allNps)
  var satisfaction = average(allSatisfaction)
  var conversionRate = totalConversionAttempts > 0 ? totalConversions / totalConversionAttempts : 0

  var recommendations: string[] = []
  if (bounceRate > 0.4) {
    recommendations.push('跳出率超过40%，建议优化页面加载速度和首屏内容')
  }
  if (completionRate < 0.6) {
    recommendations.push('完成率低于60%，建议简化交互流程')
  }
  if (avgReadTime < 30) {
    recommendations.push('平均阅读时间较短，建议增加内容吸引力')
  }
  if (nps < 30) {
    recommendations.push('NPS偏低，建议收集用户反馈并改进核心功能')
  }
  if (satisfaction < 3.5) {
    recommendations.push('满意度评分较低，建议进行可用性测试')
  }

  return {
    generatedAt: new Date().toISOString(),
    totalSessions: totalSessions,
    overallCompletionRate: Math.round(completionRate * 1000) / 10,
    overallBounceRate: Math.round(bounceRate * 1000) / 10,
    averageReadTime: Math.round(avgReadTime * 10) / 10,
    nps: nps,
    satisfaction: Math.round(satisfaction * 10) / 10,
    payConversionRate: Math.round(conversionRate * 1000) / 10,
    pageBreakdown: pageBreakdown,
    recommendations: recommendations
  }
}
