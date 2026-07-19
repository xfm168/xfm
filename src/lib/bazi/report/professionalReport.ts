/**
 * 玄风门 V4.2 - 专业命理报告导出
 *
 * 生成 HTML 字符串 -> 创建 Blob -> 触发下载
 * 文件名格式：玄风门命理报告_${姓名}_${日期}.html
 *
 * 不修改现有 reportExport.ts，纯新增模块。
 */

import type { BaZiChart } from '../types'

// ============================================================
// 类型定义
// ============================================================

/** PDF 报告配置 */
export interface BaziPDFReportConfig {
  chart: BaZiChart
  masterSummary?: any
  pillarAnalysis?: any
  shiShenDetail?: any
  shenShaDetail?: any
  comprehensiveScore?: any
  daYun?: any
  liuNian?: any
  baziFengShuiLink?: any
  userName?: string
  generateDate?: string
}

/** 报告章节结构 */
export interface PDFSection {
  type: 'cover' | 'chapter' | 'chart' | 'text' | 'table' | 'score'
  title?: string
  content?: string
  data?: any
}

// ============================================================
// 辅助函数
// ============================================================

/** 格式化日期 */
function formatDate(dateStr?: string): string {
  if (!dateStr) {
    const now = new Date()
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
  }
  return dateStr
}

/** 生成唯一 gradient ID */
function uniqueId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}

/** 简单 Markdown 转义 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Markdown 转简单 HTML */
function mdToHtml(md: string): string {
  return md
    .split('\n')
    .map(line => {
      const trimmed = line.trim()
      if (!trimmed) return '<div style="height:8px"></div>'
      if (trimmed.startsWith('## ')) return `<h3 style="color:#8B4513;border-left:3px solid #D4AF37;padding:4px 0 4px 12px;margin:16px 0 8px;font-size:14pt">${trimmed.replace('## ', '')}</h3>`
      if (trimmed.startsWith('### ')) return `<h4 style="color:#555;margin:12px 0 6px;font-size:12pt">${trimmed.replace('### ', '')}</h4>`
      if (trimmed.startsWith('- ')) return `<li style="text-indent:2em;list-style:none">${trimmed.replace('- ', '<span style="color:#D4AF37">&#8226; </span>')}</li>`
      if (trimmed.startsWith('| ')) {
        if (trimmed.includes('---')) return ''
        const cells = trimmed.split('|').filter(c => c.trim()).map(c => `<td style="border:1px solid #ddd;padding:6px 10px">${c.trim()}</td>`).join('')
        return `<tr>${cells}</tr>`
      }
      const withBold = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      return `<p style="text-indent:2em;margin:4px 0;text-align:justify">${withBold}</p>`
    })
    .filter(l => l && l.trim() !== '<div style="height:8px"></div>')
    .join('\n')
}

/** 五行颜色 */
const ELEMENT_COLORS: Record<string, string> = {
  '金': '#C0C0C0',
  '木': '#2E8B57',
  '水': '#1E90FF',
  '火': '#DC143C',
  '土': '#DAA520',
}

// ============================================================
// 通用样式
// ============================================================

function getReportStyles(): string {
  return `
@page {
  size: A4;
  margin: 25mm 20mm 30mm 20mm;
  @top-center {
    content: "玄风门命理 V4.2 - 专业命理报告";
    font-size: 9pt;
    color: #999;
    font-family: "Noto Sans CJK SC", serif;
  }
  @bottom-center {
    content: "第 " counter(page) " 页";
    font-size: 9pt;
    color: #999;
    font-family: "Noto Sans CJK SC", serif;
  }
}
@page :first {
  @top-center { content: none; }
  @bottom-center { content: none; }
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: "Noto Sans CJK SC", "Source Han Serif CN", "SimSun", serif;
  font-size: 11pt;
  line-height: 2;
  color: #2c2c2c;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* 封面 */
.rpt-cover {
  page-break-after: always;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.rpt-cover-inner {
  border: 3px double #D4AF37;
  padding: 60px 50px;
  text-align: center;
  max-width: 520px;
}
.rpt-cover-ornament { font-size: 16pt; color: #D4AF37; letter-spacing: 12px; margin-bottom: 40px; }
.rpt-cover-title { font-size: 26pt; font-weight: bold; color: #8B4513; margin-bottom: 12px; letter-spacing: 6px; }
.rpt-cover-subtitle { font-size: 12pt; color: #666; margin-bottom: 30px; line-height: 1.8; }
.rpt-cover-divider { font-size: 10pt; color: #D4AF37; letter-spacing: 8px; margin: 20px 0; }
.rpt-cover-info { font-size: 11pt; color: #444; margin: 6px 0; letter-spacing: 2px; }
.rpt-cover-score { font-size: 36pt; font-weight: bold; color: #D4AF37; margin: 16px 0; }
.rpt-cover-score-label { font-size: 10pt; color: #999; }
.rpt-cover-date { font-size: 10pt; color: #888; margin-top: 16px; letter-spacing: 2px; }
.rpt-cover-bottom { font-size: 14pt; color: #D4AF37; letter-spacing: 10px; margin-top: 40px; }

/* 目录 */
.rpt-toc { page-break-after: always; padding-top: 40px; }
.rpt-toc-heading { text-align: center; font-size: 18pt; color: #8B4513; letter-spacing: 12px; margin-bottom: 8px; }
.rpt-toc-divider { width: 120px; height: 2px; background: #D4AF37; margin: 0 auto 30px; }
.rpt-toc-item { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px dotted #ddd; font-size: 11pt; }
.rpt-toc-num { color: #D4AF37; font-weight: bold; width: 36px; flex-shrink: 0; }
.rpt-toc-title { flex: 1; color: #333; }
.rpt-toc-dots { flex: 1; border-bottom: 1px dotted #ccc; margin-left: 8px; min-width: 40px; }

/* 章节 */
.rpt-chapter { padding-top: 10px; }
.rpt-chapter-heading { display: flex; align-items: baseline; gap: 12px; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; margin-bottom: 20px; }
.rpt-chapter-num { font-size: 10pt; color: #D4AF37; font-weight: bold; flex-shrink: 0; }
.rpt-chapter-title { font-size: 15pt; color: #8B4513; font-weight: bold; }

/* 表格 */
.rpt-table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 10pt; }
.rpt-table th, .rpt-table td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; }
.rpt-table th { background: #f5f0e8; color: #8B4513; font-weight: bold; }
.rpt-table tr:nth-child(even) { background: #faf8f5; }

/* 评分条 */
.rpt-score-bar-track { width: 100%; height: 18px; background: #f0f0f0; border-radius: 4px; overflow: hidden; }
.rpt-score-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s; }

/* 五行环 */
.rpt-wuxing-row { display: flex; gap: 12px; flex-wrap: wrap; margin: 12px 0; }
.rpt-wuxing-item { flex: 1; min-width: 80px; text-align: center; padding: 10px; border-radius: 6px; background: #faf8f5; }
.rpt-wuxing-name { font-size: 16pt; font-weight: bold; }
.rpt-wuxing-value { font-size: 11pt; color: #666; margin-top: 4px; }

.page-break { page-break-before: always; }
`
}

// ============================================================
// 章节生成器
// ============================================================

/** 1. 封面 */
function buildCoverSection(config: BaziPDFReportConfig): PDFSection {
  return {
    type: 'cover',
    data: config,
  }
}

/** 2. 目录 */
function buildTocSection(): PDFSection {
  const tocItems = [
    '命盘总览',
    '命局总论',
    '四柱详解',
    '十神分析',
    '神煞分析',
    '综合评分',
    '大运分析',
    '流年分析',
    '风水建议',
    '总结建议',
  ]
  return { type: 'chapter', title: '目录', data: { tocItems } }
}

/** 3. 命盘总览 */
function buildOverviewSection(config: BaziPDFReportConfig): PDFSection {
  const { chart } = config
  const sl = chart.sixLines
  const dm = chart.dayMaster
  const fe = chart.fiveElementCount
  const total = (fe['木'] || 0) + (fe['火'] || 0) + (fe['土'] || 0) + (fe['金'] || 0) + (fe['水'] || 0)
  const xys = chart.xiYongShen

  const wuxingHtml = `
    <div class="rpt-wuxing-row">
      ${['木', '火', '土', '金', '水'].map(el => {
        const val = fe[el] || 0
        const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0'
        return `<div class="rpt-wuxing-item">
          <div class="rpt-wuxing-name" style="color:${ELEMENT_COLORS[el]}">${el}</div>
          <div class="rpt-wuxing-value">${val} (${pct}%)</div>
        </div>`
      }).join('\n')}
    </div>`

  const content = `
    <h3>四柱干支</h3>
    <table class="rpt-table">
      <tr><th>柱位</th><th>天干</th><th>地支</th><th>纳音</th><th>十神</th><th>五行</th></tr>
      <tr><td>年柱</td><td>${sl.year.gan}</td><td>${sl.year.zhi}</td><td>${sl.year.naYin}</td><td>${sl.year.shenShi || '-'}</td><td>${sl.year.element}</td></tr>
      <tr><td>月柱</td><td>${sl.month.gan}</td><td>${sl.month.zhi}</td><td>${sl.month.naYin}</td><td>${sl.month.shenShi || '-'}</td><td>${sl.month.element}</td></tr>
      <tr><td>日柱</td><td><strong>${sl.day.gan}</strong></td><td><strong>${sl.day.zhi}</strong></td><td>${sl.day.naYin}</td><td>日主</td><td>${sl.day.element}</td></tr>
      <tr><td>时柱</td><td>${sl.hour.gan}</td><td>${sl.hour.zhi}</td><td>${sl.hour.naYin}</td><td>${sl.hour.shenShi || '-'}</td><td>${sl.hour.element}</td></tr>
    </table>
    <h3>日主信息</h3>
    <p>日主为 <strong>${dm.dayGan}</strong>，五行属 <strong>${dm.dayGanElement}</strong>，旺衰状态：${dm.wangShuai || '-'}，力量评分：${dm.strengthScore || '-'}分。</p>
    ${xys ? `<p>喜用神：<strong>${xys.bestElement}</strong>；忌神：${xys.avoidedElements?.join('、') || '-'}；闲神：${xys.idleElements?.join('、') || '-'}</p>` : ''}
    <h3>五行分布</h3>
    ${wuxingHtml}
  `

  return { type: 'chart', title: '命盘总览', content }
}

/** 4. 命局总论 */
function buildMasterSummarySection(config: BaziPDFReportConfig): PDFSection {
  const { masterSummary, chart } = config
  let content = ''

  if (masterSummary) {
    if (typeof masterSummary === 'string') {
      content = mdToHtml(masterSummary)
    } else if (masterSummary.overall) {
      content = mdToHtml(masterSummary.overall)
      if (masterSummary.personality) content += mdToHtml(masterSummary.personality)
      if (masterSummary.career) content += mdToHtml(masterSummary.career)
      if (masterSummary.wealth) content += mdToHtml(masterSummary.wealth)
      if (masterSummary.relationship) content += mdToHtml(masterSummary.relationship)
      if (masterSummary.health) content += mdToHtml(masterSummary.health)
    }
  } else if (chart.analysis) {
    const a = chart.analysis
    content = `
      <h3>综合概述</h3><p>${a.overall || ''}</p>
      <h3>性格</h3><p>${a.personality || ''}</p>
      <h3>事业</h3><p>${a.career || ''}</p>
      <h3>财富</h3><p>${a.wealth || ''}</p>
      <h3>感情</h3><p>${a.relationship || ''}</p>
      <h3>健康</h3><p>${a.health || ''}</p>
    `
  } else {
    content = '<p>暂无命局总论数据。</p>'
  }

  return { type: 'text', title: '命局总论', content }
}

/** 5. 四柱详解 */
function buildPillarSection(config: BaziPDFReportConfig): PDFSection {
  const { pillarAnalysis, chart } = config
  let content = ''

  if (pillarAnalysis && typeof pillarAnalysis === 'object') {
    const pillars = [
      { name: '年柱', gan: chart.sixLines.year.gan, zhi: chart.sixLines.year.zhi },
      { name: '月柱', gan: chart.sixLines.month.gan, zhi: chart.sixLines.month.zhi },
      { name: '日柱', gan: chart.sixLines.day.gan, zhi: chart.sixLines.day.zhi },
      { name: '时柱', gan: chart.sixLines.hour.gan, zhi: chart.sixLines.hour.zhi },
    ]

    content = pillars.map(p => {
      const analysis = pillarAnalysis[p.name]
      const detail = analysis
        ? (typeof analysis === 'string' ? analysis : analysis.detail || analysis.description || JSON.stringify(analysis))
        : '暂无详细分析'
      return `
        <h3>${p.name}：${p.gan}${p.zhi}</h3>
        <p>${escapeHtml(detail)}</p>
      `
    }).join('\n')
  } else {
    content = `
      <table class="rpt-table">
        <tr><th>柱位</th><th>天干</th><th>地支</th><th>纳音</th><th>五行</th></tr>
        <tr><td>年柱</td><td>${chart.sixLines.year.gan}</td><td>${chart.sixLines.year.zhi}</td><td>${chart.sixLines.year.naYin}</td><td>${chart.sixLines.year.element}</td></tr>
        <tr><td>月柱</td><td>${chart.sixLines.month.gan}</td><td>${chart.sixLines.month.zhi}</td><td>${chart.sixLines.month.naYin}</td><td>${chart.sixLines.month.element}</td></tr>
        <tr><td>日柱</td><td>${chart.sixLines.day.gan}</td><td>${chart.sixLines.day.zhi}</td><td>${chart.sixLines.day.naYin}</td><td>${chart.sixLines.day.element}</td></tr>
        <tr><td>时柱</td><td>${chart.sixLines.hour.gan}</td><td>${chart.sixLines.hour.zhi}</td><td>${chart.sixLines.hour.naYin}</td><td>${chart.sixLines.hour.element}</td></tr>
      </table>
    `
  }

  return { type: 'chapter', title: '四柱详解', content }
}

/** 6. 十神分析 */
function buildShiShenSection(config: BaziPDFReportConfig): PDFSection {
  const { shiShenDetail, chart } = config

  if (shiShenDetail && shiShenDetail.details && Array.isArray(shiShenDetail.details)) {
    const rows = shiShenDetail.details.map((d: any) => `
      <tr>
        <td><strong>${d.name}</strong></td>
        <td>${d.power ?? '-'}</td>
        <td>${d.touGan ? '透干' : ''} ${d.deLing ? '得令' : ''} ${d.deDi ? '得地' : ''}</td>
        <td>${d.description || '-'}</td>
      </tr>
    `).join('')

    const content = `
      <h3>十神力量详表</h3>
      <table class="rpt-table">
        <tr><th>十神</th><th>力量</th><th>状态</th><th>说明</th></tr>
        ${rows}
      </table>
      ${shiShenDetail.personality ? `<h3>人格特质</h3><p>${shiShenDetail.personality}</p>` : ''}
      ${shiShenDetail.careerTendency ? `<h3>职业倾向</h3><p>${shiShenDetail.careerTendency}</p>` : ''}
      ${shiShenDetail.relationshipTraits ? `<h3>婚恋特点</h3><p>${shiShenDetail.relationshipTraits}</p>` : ''}
    `
    return { type: 'table', title: '十神分析', content }
  }

  // 回退：简单展示日主相关十神
  const relatedShens = chart.dayMaster?.relatedShens
  let content = ''
  if (relatedShens && Object.keys(relatedShens).length > 0) {
    const rows = Object.entries(relatedShens).map(([stem, shenshen]) => `
      <tr><td>${stem}</td><td>${shenshen as string}</td></tr>
    `).join('')
    content = `
      <table class="rpt-table">
        <tr><th>天干</th><th>十神</th></tr>
        ${rows}
      </table>
    `
  } else {
    content = '<p>暂无十神分析数据。</p>'
  }

  return { type: 'table', title: '十神分析', content }
}

/** 7. 神煞分析 */
function buildShenShaSection(config: BaziPDFReportConfig): PDFSection {
  const { shenShaDetail } = config

  if (shenShaDetail && Array.isArray(shenShaDetail)) {
    const items = shenShaDetail
      .filter((cat: any) => cat.items && cat.items.some((i: any) => i.inPosition))
      .map((cat: any) => {
        const hits = cat.items.filter((i: any) => i.inPosition)
        return `
          <h3>${escapeHtml(cat.name)}</h3>
          ${hits.map((item: any) => `
            <p><strong>${escapeHtml(item.name)}</strong>（${escapeHtml(item.position || '')}）：${escapeHtml(item.description || '')}</p>
          `).join('')}
        `
      }).join('\n')
    return { type: 'chapter', title: '神煞分析', content: items || '<p>命局无特殊神煞。</p>' }
  }

  return { type: 'chapter', title: '神煞分析', content: '<p>暂无神煞分析数据。</p>' }
}

/** 8. 综合评分 */
function buildScoreSection(config: BaziPDFReportConfig): PDFSection {
  const { comprehensiveScore, chart } = config

  let dimensions: Array<{ name: string; score: number }> = []

  if (comprehensiveScore && typeof comprehensiveScore === 'object') {
    // 支持多种格式
    if (Array.isArray(comprehensiveScore.dimensions)) {
      dimensions = comprehensiveScore.dimensions
    } else if (comprehensiveScore.scores) {
      dimensions = Object.entries(comprehensiveScore.scores).map(([name, score]) => ({
        name,
        score: score as number,
      }))
    } else {
      // 遍历所有数值属性
      const knownKeys = ['career', 'wealth', 'marriage', 'health', 'personality', 'fengshui', 'dayun', 'liunian', 'geju', 'xiyong']
      dimensions = knownKeys
        .filter(k => typeof comprehensiveScore[k] === 'number')
        .map(k => ({ name: k, score: comprehensiveScore[k] as number }))
    }
  }

  if (dimensions.length === 0) {
    // 回退：使用 chart.overallScore
    dimensions = [{ name: '综合', score: chart.overallScore || 0 }]
  }

  const overall = comprehensiveScore?.overall
    ?? (Array.isArray(comprehensiveScore?.dimensions) ? comprehensiveScore.dimensions.reduce((s: number, d: any) => s + (d.score || 0), 0) / dimensions.length : chart.overallScore || 0)

  const scoreColor = (s: number) => s >= 80 ? '#D4AF37' : s >= 60 ? '#2E8B57' : s >= 40 ? '#DAA520' : '#DC143C'

  const rows = dimensions.map(d => `
    <tr>
      <td>${escapeHtml(d.name)}</td>
      <td style="text-align:center;font-weight:bold;color:${scoreColor(d.score)}">${d.score}</td>
      <td>
        <div class="rpt-score-bar-track">
          <div class="rpt-score-bar-fill" style="width:${Math.max(0, Math.min(100, d.score))}%;background:${scoreColor(d.score)}"></div>
        </div>
      </td>
    </tr>
  `).join('')

  const content = `
    <div style="text-align:center;margin:20px 0">
      <div style="font-size:42pt;font-weight:bold;color:${scoreColor(Math.round(overall))}">${Math.round(overall)}</div>
      <div style="font-size:10pt;color:#999;margin-top:4px">综合评分</div>
    </div>
    <table class="rpt-table">
      <tr><th>维度</th><th style="text-align:center">分数</th><th>评分条</th></tr>
      ${rows}
    </table>
  `

  return { type: 'score', title: '综合评分', content }
}

/** 9. 大运分析 */
function buildDaYunSection(config: BaziPDFReportConfig): PDFSection {
  const { daYun } = config

  if (daYun && daYun.steps && Array.isArray(daYun.steps)) {
    const rows = daYun.steps.map((step: any, idx: number) => {
      const ganZhi = typeof step.ganZhi === 'string' ? step.ganZhi : `${step.ganZhi?.gan || ''}${step.ganZhi?.zhi || ''}`
      const isCurrent = daYun.currentStepIndex != null && idx === daYun.currentStepIndex
      const jiXi = step.isXi ? '喜' : step.isJi ? '忌' : '平'
      const scoreColor = step.isXi ? '#D4AF37' : step.isJi ? '#DC143C' : '#666'
      return `
        <tr style="${isCurrent ? 'background:#FFF8E7;font-weight:bold' : ''}">
          <td>${idx + 1}</td>
          <td>${ganZhi}</td>
          <td>${step.startAge ?? '-'}~${step.endAge ?? '-'}岁</td>
          <td style="color:${scoreColor}">${jiXi}</td>
          <td>${step.score ?? '-'}</td>
          <td style="font-size:9pt">${step.detail ? escapeHtml(step.detail.slice(0, 80)) : '-'}</td>
        </tr>
      `
    }).join('')

    const content = `
      <p>命主共行 ${daYun.totalSteps || daYun.steps.length} 步大运。</p>
      <table class="rpt-table">
        <tr><th>序</th><th>干支</th><th>年龄段</th><th>喜忌</th><th>评分</th><th>概要</th></tr>
        ${rows}
      </table>
    `
    return { type: 'table', title: '大运分析', content }
  }

  return { type: 'chapter', title: '大运分析', content: '<p>暂无大运分析数据。</p>' }
}

/** 10. 流年分析 */
function buildLiuNianSection(config: BaziPDFReportConfig): PDFSection {
  const { liuNian } = config

  if (liuNian && liuNian.years && Array.isArray(liuNian.years)) {
    // 当前年份 + 未来3年
    const currentYear = liuNian.currentYear ?? new Date().getFullYear()
    const highlightYears = liuNian.years.filter((y: any) => y.year >= currentYear && y.year <= currentYear + 3)

    const rows = highlightYears.map((year: any) => {
      const ganZhi = typeof year.ganZhi === 'string' ? year.ganZhi : `${year.ganZhi?.gan || ''}${year.ganZhi?.zhi || ''}`
      const isCurrent = year.year === currentYear
      const shenShiStr = typeof year.shenShi === 'string'
        ? year.shenShi
        : `${year.shenShi?.gan || '-'} / ${year.shenShi?.zhi || '-'}`
      return `
        <tr style="${isCurrent ? 'background:#FFF8E7;font-weight:bold' : ''}">
          <td>${year.year}${isCurrent ? ' (今年)' : ''}</td>
          <td>${ganZhi}</td>
          <td>${shenShiStr}</td>
          <td>${year.score ?? '-'}</td>
          <td style="font-size:9pt">${year.detail ? escapeHtml(year.detail.slice(0, 100)) : '-'}</td>
        </tr>
      `
    }).join('')

    const content = `
      <p>以下展示 ${currentYear} 年（今年）及未来 3 年的流年概要。</p>
      <table class="rpt-table">
        <tr><th>年份</th><th>干支</th><th>十神</th><th>评分</th><th>概要</th></tr>
        ${rows}
      </table>
    `
    return { type: 'table', title: '流年分析', content }
  }

  return { type: 'chapter', title: '流年分析', content: '<p>暂无流年分析数据。</p>' }
}

/** 11. 风水建议 */
function buildFengShuiSection(config: BaziPDFReportConfig): PDFSection {
  const { baziFengShuiLink, chart } = config

  let content = ''

  if (baziFengShuiLink && typeof baziFengShuiLink === 'object') {
    // 方位
    if (baziFengShuiLink.directions) {
      const dirs = Array.isArray(baziFengShuiLink.directions)
        ? baziFengShuiLink.directions.map((d: any) => `${d.position || d.name || d}(${d.score || ''}分)`).join('、')
        : baziFengShuiLink.directions
      content += `<h3>方位建议</h3><p>${escapeHtml(dirs)}</p>`
    }
    // 颜色
    if (baziFengShuiLink.luckyColors) {
      const colors = Array.isArray(baziFengShuiLink.luckyColors)
        ? baziFengShuiLink.luckyColors.map((c: any) => typeof c === 'string' ? c : c.color || c.name || '').join('、')
        : baziFengShuiLink.luckyColors
      content += `<h3>颜色建议</h3><p>幸运颜色：${escapeHtml(colors)}</p>`
    }
    if (baziFengShuiLink.avoidColors) {
      const avoid = Array.isArray(baziFengShuiLink.avoidColors)
        ? baziFengShuiLink.avoidColors.map((c: any) => typeof c === 'string' ? c : c.color || c.name || '').join('、')
        : baziFengShuiLink.avoidColors
      content += `<p>忌讳颜色：${escapeHtml(avoid)}</p>`
    }
    // 数字
    if (baziFengShuiLink.luckyNumbers) {
      const nums = Array.isArray(baziFengShuiLink.luckyNumbers)
        ? baziFengShuiLink.luckyNumbers.map((n: any) => typeof n === 'string' ? n : n.number || n.name || '').join('、')
        : baziFengShuiLink.luckyNumbers
      content += `<h3>幸运数字</h3><p>${escapeHtml(nums)}</p>`
    }
    // 布局
    if (baziFengShuiLink.layout) {
      content += `<h3>布局建议</h3><p>${escapeHtml(typeof baziFengShuiLink.layout === 'string' ? baziFengShuiLink.layout : JSON.stringify(baziFengShuiLink.layout))}</p>`
    }
    // 额外建议
    if (baziFengShuiLink.suggestions && Array.isArray(baziFengShuiLink.suggestions)) {
      content += `<h3>其他建议</h3>${baziFengShuiLink.suggestions.map((s: string) => `<li>${escapeHtml(s)}</li>`).join('')}`
    }
  }

  // 回退：基于喜用神生成简单建议
  if (!content && chart.xiYongShen) {
    const xys = chart.xiYongShen
    const elementColorMap: Record<string, string[]> = {
      '木': ['绿色', '青色', '碧色'],
      '火': ['红色', '紫色', '橙色'],
      '土': ['黄色', '棕色', '米色'],
      '金': ['白色', '金色', '银色'],
      '水': ['黑色', '蓝色', '灰色'],
    }
    const elementDirMap: Record<string, string[]> = {
      '木': ['东方', '东南方'],
      '火': ['南方'],
      '土': ['中央', '西南方', '东北方'],
      '金': ['西方', '西北方'],
      '水': ['北方'],
    }

    content = `
      <h3>方位建议</h3>
      <p>吉方位：${elementDirMap[xys.bestElement]?.join('、') || '-'}</p>
      <h3>颜色建议</h3>
      <p>幸运颜色：${elementColorMap[xys.bestElement]?.join('、') || '-'}</p>
      <h3>宜忌</h3>
      <p>喜用神为 <strong>${xys.bestElement}</strong>，日常生活中多接触${xys.bestElement}行相关事物。</p>
      <p>忌神：${xys.avoidedElements?.join('、') || '-'}，应尽量避免。</p>
    `
  }

  if (!content) {
    content = '<p>暂无风水建议数据。</p>'
  }

  return { type: 'chapter', title: '风水建议', content }
}

/** 12. 总结建议 */
function buildSummarySection(config: BaziPDFReportConfig): PDFSection {
  const { chart } = config
  const xys = chart.xiYongShen
  const dm = chart.dayMaster

  const content = `
    <h3>命局概要</h3>
    <p>命主为 <strong>${dm.dayGan}${dm.dayGanElement}</strong> 日主，旺衰状态为 <strong>${dm.wangShuai || '-'}</strong>。
    喜用神为 <strong>${xys?.bestElement || '-'}</strong>，综合评分 <strong>${chart.overallScore || '-'}分</strong>。</p>

    <h3>核心建议</h3>
    <li>五行调理：多接触${xys?.bestElement || '-'}行相关事物，利用喜用神补命局之不足。</li>
    <li>事业方向：身旺宜开拓进取，身弱宜稳扎稳打、借助外力。</li>
    <li>财富策略：正财为主，偏财谨慎，不宜投机冒险。</li>
    <li>健康关注：注意${xys?.avoidedElements?.[0] || '-'}行相关脏腑保养，保持规律作息。</li>
    <li>心态调整：命由己造，运靠人为。积极向善，努力奋斗。</li>

    <h3>免责声明</h3>
    <p style="color:#999;font-size:10pt;margin-top:20px">
      本文由「玄风门 V4.2」生成，仅供娱乐参考，不构成任何决策建议。
      命理之说，信则有，不信则无。宜修德积善，以天时地利人和为本。
    </p>
  `

  return { type: 'text', title: '总结建议', content }
}

// ============================================================
// 核心 API
// ============================================================

/**
 * 生成专业 PDF 报告内容（章节列表）
 *
 * @param config - 报告配置
 * @returns PDFSection[] 按顺序排列的报告章节
 */
export function generateProfessionalPDFContent(config: BaziPDFReportConfig): PDFSection[] {
  return [
    buildCoverSection(config),
    buildTocSection(),
    buildOverviewSection(config),
    buildMasterSummarySection(config),
    buildPillarSection(config),
    buildShiShenSection(config),
    buildShenShaSection(config),
    buildScoreSection(config),
    buildDaYunSection(config),
    buildLiuNianSection(config),
    buildFengShuiSection(config),
    buildSummarySection(config),
  ]
}

/**
 * 导出专业 HTML 报告
 *
 * 生成 HTML 字符串 -> 创建 Blob -> 触发浏览器下载。
 * 文件名格式：玄风门命理报告_${姓名}_${日期}.html
 *
 * @param config - 报告配置
 * @returns Promise<Blob> - 生成的 HTML Blob
 */
export async function exportProfessionalReport(config: BaziPDFReportConfig): Promise<Blob> {
  const sections = generateProfessionalPDFContent(config)
  const styles = getReportStyles()

  const userName = config.userName || '命主'
  const dateStr = formatDate(config.generateDate)
  const overallScore = config.comprehensiveScore?.overall ?? config.chart.overallScore ?? 0

  // 构建 HTML
  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>玄风门命理报告 - ${escapeHtml(userName)}</title>
<style>${styles}</style>
</head>
<body>
`

  // 1. 封面
  const coverSection = sections[0]
  if (coverSection) {
    html += `
<div class="rpt-cover">
  <div class="rpt-cover-inner">
    <div class="rpt-cover-ornament">&#9775; &#9775; &#9775;</div>
    <div class="rpt-cover-title">玄风门命理报告</div>
    <div class="rpt-cover-subtitle">V4.2 专业版</div>
    <div class="rpt-cover-divider">&#9670; &#9671; &#9670;</div>
    <div class="rpt-cover-info">命主：${escapeHtml(userName)}</div>
    <div class="rpt-cover-info">排盘日期：${dateStr}</div>
    <div class="rpt-cover-score">${Math.round(overallScore)}</div>
    <div class="rpt-cover-score-label">综合评分（满分 100）</div>
    <div class="rpt-cover-divider">&#9670; &#9671; &#9670;</div>
    <div class="rpt-cover-date">玄风门命理 V4.2</div>
    <div class="rpt-cover-bottom">&#9776; &#9780; &#9781; &#9782; &#9783; &#9784; &#9785; &#9786; &#9787;</div>
  </div>
</div>
`
  }

  // 2. 目录
  const tocSection = sections[1]
  if (tocSection && tocSection.data?.tocItems) {
    const tocItemsHtml = tocSection.data.tocItems.map((item: string, i: number) => {
      const num = (i + 1).toString().padStart(2, '0')
      return `<div class="rpt-toc-item">
        <span class="rpt-toc-num">${num}</span>
        <span class="rpt-toc-title">${escapeHtml(item)}</span>
        <span class="rpt-toc-dots"></span>
      </div>`
    }).join('\n')

    html += `
<div class="rpt-toc">
  <h2 class="rpt-toc-heading">目&#12288;录</h2>
  <div class="rpt-toc-divider"></div>
  ${tocItemsHtml}
</div>
`
  }

  // 3~12. 正文章节
  for (let i = 2; i < sections.length; i++) {
    const section = sections[i]
    if (!section) continue

    const chapterNum = i - 1
    const numStr = chapterNum < 10 ? `0${chapterNum}` : `${chapterNum}`

    html += `<div class="rpt-chapter" data-chapter="${chapterNum}">`
    html += `<h2 class="rpt-chapter-heading">
      <span class="rpt-chapter-num">第${chapterNum}章</span>
      <span class="rpt-chapter-title">${escapeHtml(section.title || '')}</span>
    </h2>`

    if (section.content) {
      html += `<div class="rpt-chapter-content">${section.content}</div>`
    }

    html += `</div>`

    // 分页（最后一个章节不需要）
    if (i < sections.length - 1) {
      html += `<div class="page-break"></div>`
    }
  }

  // 页脚
  html += `
<div style="text-align:center;font-size:9pt;color:#999;margin-top:40px;padding-top:20px;border-top:1px solid #eee">
  本文由「玄风门 V4.2」生成，仅供娱乐参考，不构成任何决策建议。
</div>
`

  html += `</body></html>`

  // 创建 Blob
  const blob = new Blob([html], {
    type: 'text/html;charset=utf-8',
  })

  // 触发下载
  const safeName = userName.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_')
  const safeDate = dateStr.replace(/[^0-9]/g, '').slice(0, 8) || new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const fileName = `玄风门命理报告_${safeName}_${safeDate}.html`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)

  return blob
}
