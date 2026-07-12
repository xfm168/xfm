/**
 * P7 Human Review Framework — Task-7
 *
 * 建立人工审核框架：随机抽取 200 Case，
 * 输出结构化 Review Report 模板供命理老师填写。
 *
 * 核心设计：
 * - 系统输出固定不变，仅生成审核模板
 * - 审核维度：格局/用神/旺衰/五行/十神/大运/流年/总体
 * - 每个维度提供系统输出 + 传统答案 + 审核空间
 * - 生成 JSON 格式的 Review Report，便于统计分析
 *
 * 使用单引号 + 字符串拼接，禁止模板字符串
 */

import { CASE_DATA } from './caseData'
import { P7_EXTENDED_CASES } from './caseDataExtended'
import type { BaziCase } from './caseLibrary'
import { runQiEngine } from '../engine'
import { determineGeJu } from '../../geju'
import { calculateStrength } from '../../wuxing'
import { determineXiYongShen } from '../../xiyongshen'
import { getRelatedShens } from '../../shishen'
import { getStemElement } from '../../../core'

// ═══════════════════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════════════════

export interface CaseForReview {
  caseId: string
  caseName: string
  category: string
  trustLevel: string
  source: string
  // 四柱
  yearGan: string
  yearZhi: string
  monthGan: string
  monthZhi: string
  dayGan: string
  dayZhi: string
  hourGan: string
  hourZhi: string
  dayElement: string
  // 系统推演结果
  systemPattern: string
  systemWangShuai: string
  systemStrengthScore: number
  systemYongShen: string
  systemXiShen: string
  systemJiShen: string
  systemGeJuReasons: string[]
  systemXiYongReasons: string[]
  // 传统标注答案（来自案例库）
  traditionalPattern: string
  traditionalWangShuai: string
  traditionalYongShen: string
  traditionalXiShen: string
  traditionalJiShen: string
  // 审核空间
  review: {
    pattern: { systemCorrect: null | boolean; traditionalCorrect: null | boolean; comment: string }
    wangShuai: { systemCorrect: null | boolean; traditionalCorrect: null | boolean; comment: string }
    yongShen: { systemCorrect: null | boolean; traditionalCorrect: null | boolean; comment: string }
    dayElement: { systemCorrect: null | boolean; comment: string }
    overall: { score: null | number; comment: string }
    reviewerNotes: string
  }
}

export interface HumanReviewReport {
  version: string
  createdAt: string
  totalCases: number
  reviewer: string
  cases: CaseForReview[]
  summary: {
    totalReviewed: number
    avgOverallScore: number
    patternAccuracy: number
    wangShuaiAccuracy: number
    yongShenAccuracy: number
    dayElementAccuracy: number
  }
}

// ═══════════════════════════════════════════════════════════
// 工具函数
// ═══════════════════════════════════════════════════════════

function safeStr(v: unknown): string {
  if (typeof v === 'string') return v
  if (v == null) return ''
  return String(v)
}

function buildSixLines(caze: BaziCase) {
  return {
    year: { gan: caze.yearGan, zhi: caze.yearZhi },
    month: { gan: caze.monthGan, zhi: caze.monthZhi },
    day: { gan: caze.dayGan, zhi: caze.dayZhi },
    hour: { gan: caze.hourGan, zhi: caze.hourZhi },
  }
}

function countFiveElements(caze: BaziCase): Record<string, number> {
  var counts: Record<string, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 }
  var ganzhis = [
    caze.yearGan, caze.yearZhi, caze.monthGan, caze.monthZhi,
    caze.dayGan, caze.dayZhi, caze.hourGan, caze.hourZhi,
  ]
  var stemEl: Record<string, string> = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
  }
  var branchEl: Record<string, string> = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土',
    '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金',
    '戌': '土', '亥': '水',
  }
  for (var i = 0; i < ganzhis.length; i++) {
    var el = stemEl[ganzhis[i]] || branchEl[ganzhis[i]]
    if (el) counts[el]++
  }
  return counts
}

/** Fisher-Yates shuffle */
function fisherYatesShuffle<T>(arr: T[]): T[] {
  var result = arr.slice()
  for (var i = result.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1))
    var temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}

// ═══════════════════════════════════════════════════════════
// 生成审核案例
// ═══════════════════════════════════════════════════════════

export function generateReviewCases(sampleSize: number): CaseForReview[] {
  var allCases: BaziCase[] = CASE_DATA.concat(P7_EXTENDED_CASES)
  var shuffled = fisherYatesShuffle(allCases)
  var sampled = shuffled.slice(0, Math.min(sampleSize, shuffled.length))

  var cases: CaseForReview[] = []

  for (var i = 0; i < sampled.length; i++) {
    var caze = sampled[i]
    try {
      var sixLines = buildSixLines(caze)
      var dayGan = caze.dayGan
      var monthZhi = caze.monthZhi

      // 运行系统分析
      var strengthResult = calculateStrength(sixLines as any, dayGan, monthZhi)
      var fiveElementCount = countFiveElements(caze)
      var relatedShens = getRelatedShens(dayGan as any)
      var geJuResult = determineGeJu(
        sixLines as any, relatedShens as any, strengthResult.strengthScore,
        dayGan, monthZhi, fiveElementCount as any,
      )
      var dayElement = getStemElement(dayGan as any)
      var xiYongResult = determineXiYongShen(
        strengthResult.strengthScore,
        strengthResult.wangShuai as any,
        (safeStr(geJuResult.name) || '正官格') as any,
        dayElement,
        strengthResult.heHuaResults || [],
      )

      var caseForReview: CaseForReview = {
        caseId: caze.id,
        caseName: caze.name || '',
        category: Array.isArray(caze.category) ? caze.category.join(',') : safeStr(caze.category),
        trustLevel: caze.trustLevel || '',
        source: Array.isArray(caze.source) ? caze.source.join(',') : safeStr(caze.source),
        yearGan: caze.yearGan, yearZhi: caze.yearZhi,
        monthGan: caze.monthGan, monthZhi: caze.monthZhi,
        dayGan: caze.dayGan, dayZhi: caze.dayZhi,
        hourGan: caze.hourGan, hourZhi: caze.hourZhi,
        dayElement: dayElement,
        systemPattern: safeStr(geJuResult.name) || safeStr((geJuResult as any).type) || '',
        systemWangShuai: safeStr(strengthResult.wangShuai),
        systemStrengthScore: strengthResult.strengthScore,
        systemYongShen: safeStr(xiYongResult.bestElement) || safeStr((xiYongResult as any).firstHappy) || '',
        systemXiShen: safeStr((xiYongResult as any).firstHappy) + ',' + safeStr((xiYongResult as any).secondHappy),
        systemJiShen: Array.isArray((xiYongResult as any).avoidedElements)
          ? (xiYongResult as any).avoidedElements.join(',')
          : safeStr((xiYongResult as any).avoidedElements),
        systemGeJuReasons: Array.isArray((geJuResult as any).reasons)
          ? (geJuResult as any).reasons : [],
        systemXiYongReasons: Array.isArray((xiYongResult as any).reasons)
          ? (xiYongResult as any).reasons : [],
        traditionalPattern: safeStr(caze.pattern),
        traditionalWangShuai: safeStr(caze.wangShuai),
        traditionalYongShen: safeStr(caze.yongShen),
        traditionalXiShen: safeStr(caze.xiShen),
        traditionalJiShen: safeStr(caze.jiShen),
        review: {
          pattern: { systemCorrect: null, traditionalCorrect: null, comment: '' },
          wangShuai: { systemCorrect: null, traditionalCorrect: null, comment: '' },
          yongShen: { systemCorrect: null, traditionalCorrect: null, comment: '' },
          dayElement: { systemCorrect: null, comment: '' },
          overall: { score: null, comment: '' },
          reviewerNotes: '',
        },
      }

      cases.push(caseForReview)
    } catch (e) {
      // 单案例失败不影响整体
    }
  }

  return cases
}

// ═══════════════════════════════════════════════════════════
// 保存 Review Report
// ═══════════════════════════════════════════════════════════

var REVIEW_REPORT_PATH = '/workspace/xuanfengmen1/src/golden/p7-human-review-report.json'

export function saveReviewReport(reviewerName: string): HumanReviewReport {
  var cases = generateReviewCases(200)

  var report: HumanReviewReport = {
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    totalCases: cases.length,
    reviewer: reviewerName,
    cases: cases,
    summary: {
      totalReviewed: 0,
      avgOverallScore: 0,
      patternAccuracy: 0,
      wangShuaiAccuracy: 0,
      yongShenAccuracy: 0,
      dayElementAccuracy: 0,
    },
  }

  var fs = require('fs')
  var path = require('path')
  var dir = path.dirname(REVIEW_REPORT_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(REVIEW_REPORT_PATH, JSON.stringify(report, null, 2), 'utf-8')

  console.log('[p7HumanReview] 审核报告已生成: ' + REVIEW_REPORT_PATH)
  console.log('[p7HumanReview] 案例数: ' + cases.length)
  console.log('[p7HumanReview] 审核人: ' + reviewerName)

  return report
}

// ═══════════════════════════════════════════════════════════
// CLI 入口
// ═══════════════════════════════════════════════════════════

if (typeof require !== 'undefined' && require.main === module) {
  var reviewer = '命理老师'
  var args = process.argv
  for (var a = 0; a < args.length; a++) {
    if (args[a] === '--reviewer' && args[a + 1]) {
      reviewer = args[a + 1]
    }
    if (args[a] === '--sample' && args[a + 1]) {
      // handled inside
    }
  }
  var sampleSize = 200
  for (var b = 0; b < args.length; b++) {
    if (args[b] === '--sample' && args[b + 1]) {
      sampleSize = parseInt(args[b + 1], 10) || 200
    }
  }
  console.log('[p7HumanReview] 生成审核报告, 审核人=' + reviewer + ', 抽样数=' + sampleSize)
  var report = saveReviewReport(reviewer)
}
