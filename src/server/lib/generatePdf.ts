/**
 * PDF 报告生成器
 * 使用 pdfkit 生成黑金风格命理报告
 */

import PDFDocument from 'pdfkit'
import { PassThrough } from 'stream'

var COLORS = {
  black: '#0a0a0a',
  gold: '#c9952d',
  goldLight: '#d4a843',
  darkBg: '#12151e',
  textWhite: '#e2e5ed',
  textMuted: '#6b7394',
  red: '#e74c3c',
  green: '#2ecc71',
  orange: '#f39c12',
  line: '#252b3d',
}

/** 生成 PDF 并返回 ReadableStream（供 Hono c.body 使用） */
async function generatePdf(data: ReportData): Promise<PassThrough> {
  var doc = new PDFDocument({
    size: 'A4',
    margins: { top: 60, bottom: 60, left: 50, right: 50 },
    info: {
      Title: '玄风门 — ' + (data.reportType === 'bazi' ? '八字命理报告' : '专业分析报告'),
      Author: '玄风门 XuanFengMen',
      Subject: data.personName || '命理分析',
    },
  })

  var stream = new PassThrough()
  doc.pipe(stream)

  // --- 封面 ---
  drawCover(doc, data)

  // --- 基本信息页 ---
  doc.addPage()
  drawBasicInfo(doc, data)

  // --- 八字排盘信息 ---
  if (data.baziChart) {
    doc.addPage()
    drawBaziChart(doc, data)
  }

  // --- 五行分析 ---
  if (data.wuxingAnalysis) {
    doc.addPage()
    drawWuxingAnalysis(doc, data)
  }

  // --- 十神分析 ---
  if (data.shishenAnalysis) {
    doc.addPage()
    drawShishenAnalysis(doc, data)
  }

  // --- 大运信息 ---
  if (data.dayunAnalysis) {
    doc.addPage()
    drawDayunAnalysis(doc, data)
  }

  // --- 综合建议 ---
  if (data.suggestions) {
    doc.addPage()
    drawSuggestions(doc, data)
  }

  // --- 页脚声明 ---
  doc.end()

  return stream
}

// ───────────────────────────────────────────────
//  PDF 页面绘制函数
// ───────────────────────────────────────────────

function drawCover(doc: any, data: ReportData): void {
  // 黑色背景
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.black)

  // 金色装饰线
  doc.moveTo(50, 200).lineTo(doc.page.width - 50, 200)
    .strokeColor(COLORS.gold).lineWidth(1).stroke()

  // 标题
  doc.font('Helvetica-Bold')
  doc.fontSize(28)
  doc.fillColor(COLORS.gold)
  doc.text(data.reportType === 'bazi' ? 'Bazi Fortune Report' : 'Professional Analysis',
    50, 230, { align: 'center', width: doc.page.width - 100 })

  doc.fontSize(16)
  doc.fillColor(COLORS.textWhite)
  doc.text(data.personName || 'User Report', 50, 280, { align: 'center', width: doc.page.width - 100 })

  // 日期
  doc.fontSize(10)
  doc.fillColor(COLORS.textMuted)
  doc.text('XuanFengMen v1.0', 50, 350, { align: 'center', width: doc.page.width - 100 })
  doc.text(data.generatedAt || new Date().toISOString().slice(0, 10), 50, 368, { align: 'center', width: doc.page.width - 100 })

  // 底部装饰线
  doc.moveTo(50, 500).lineTo(doc.page.width - 50, 500)
    .strokeColor(COLORS.gold).lineWidth(1).stroke()

  doc.fontSize(8)
  doc.fillColor(COLORS.textMuted)
  doc.text('Confidential - For personal use only', 50, 520, { align: 'center', width: doc.page.width - 100 })
}

function drawBasicInfo(doc: any, data: ReportData): void {
  drawPageHeader(doc, 'Basic Information')

  var info = [
    { label: 'Name', value: data.personName || 'N/A' },
    { label: 'Gender', value: data.gender || 'N/A' },
    { label: 'Birth Date', value: data.birthDate || 'N/A' },
    { label: 'Birth Time', value: data.birthTime || 'N/A' },
    { label: 'Birth Place', value: data.birthPlace || 'N/A' },
    { label: 'Zodiac', value: data.zodiac || 'N/A' },
    { label: 'Element', value: data.dayMasterElement || 'N/A' },
  ]

  var y = 100
  for (var i = 0; i < info.length; i++) {
    doc.font('Helvetica-Bold')
    doc.fontSize(11)
    doc.fillColor(COLORS.gold)
    doc.text(info[i].label + ':', 50, y)

    doc.font('Helvetica')
    doc.fontSize(11)
    doc.fillColor(COLORS.textWhite)
    doc.text(info[i].value, 160, y)

    y += 28
  }
}

function drawBaziChart(doc: any, data: ReportData): void {
  drawPageHeader(doc, 'Bazi Chart (Four Pillars)')

  if (!data.baziChart) return

  var pillars = data.baziChart
  var pillarNames = ['Year Pillar', 'Month Pillar', 'Day Pillar', 'Hour Pillar']
  var y = 100

  for (var i = 0; i < 4 && i < pillars.length; i++) {
    var p = pillars[i]
    // Pillar 名称
    doc.font('Helvetica-Bold')
    doc.fontSize(10)
    doc.fillColor(COLORS.gold)
    doc.text(pillarNames[i], 50, y)

    // 天干
    doc.font('Helvetica')
    doc.fontSize(14)
    doc.fillColor(COLORS.textWhite)
    doc.text('Stem: ' + (p.stem || p.tianGan || '\u2014'), 50, y + 18)

    // 地支
    doc.text('Branch: ' + (p.branch || p.diZhi || '\u2014'), 50, y + 36)

    // 纳音
    if (p.nayin) {
      doc.fontSize(9)
      doc.fillColor(COLORS.textMuted)
      doc.text('Nayin: ' + p.nayin, 50, y + 54)
    }

    y += 80
  }
}

function drawWuxingAnalysis(doc: any, data: ReportData): void {
  drawPageHeader(doc, 'Five Elements Analysis')

  if (!data.wuxingAnalysis) return

  var elements = data.wuxingAnalysis
  var elementNames = ['Metal', 'Wood', 'Water', 'Fire', 'Earth']
  var y = 100

  for (var i = 0; i < 5 && i < elements.length; i++) {
    var el = elements[i]
    doc.font('Helvetica-Bold')
    doc.fontSize(11)
    doc.fillColor(COLORS.gold)
    doc.text(elementNames[i] || el.name || ('Element ' + (i + 1)), 50, y)

    doc.font('Helvetica')
    doc.fontSize(10)
    doc.fillColor(COLORS.textWhite)
    doc.text('Count: ' + (el.count || el.value || 0), 160, y)
    doc.text('Status: ' + (el.status || el.label || '\u2014'), 260, y)

    y += 30
  }

  // 综合评述
  if (data.wuxingSummary) {
    y += 20
    doc.font('Helvetica-Bold')
    doc.fontSize(11)
    doc.fillColor(COLORS.gold)
    doc.text('Summary', 50, y)

    doc.font('Helvetica')
    doc.fontSize(10)
    doc.fillColor(COLORS.textWhite)
    doc.text(data.wuxingSummary, 50, y + 18, { width: doc.page.width - 100 })
  }
}

function drawShishenAnalysis(doc: any, data: ReportData): void {
  drawPageHeader(doc, 'Ten Gods Analysis')

  if (!data.shishenAnalysis) return

  var items = data.shishenAnalysis
  var y = 100

  if (Array.isArray(items)) {
    for (var i = 0; i < items.length && i < 10; i++) {
      var item = items[i]
      doc.font('Helvetica')
      doc.fontSize(10)
      doc.fillColor(COLORS.gold)
      doc.text((item.name || item.type || ('Ten God ' + (i + 1))) + ':', 50, y)

      doc.fillColor(COLORS.textWhite)
      doc.text(item.description || item.relation || item.detail || '', 180, y)

      y += 26
    }
  } else if (typeof items === 'string') {
    doc.font('Helvetica')
    doc.fontSize(10)
    doc.fillColor(COLORS.textWhite)
    doc.text(items, 50, y, { width: doc.page.width - 100 })
  }
}

function drawDayunAnalysis(doc: any, data: ReportData): void {
  drawPageHeader(doc, 'Major Luck Cycles (Da Yun)')

  if (!data.dayunAnalysis) return

  var cycles = data.dayunAnalysis
  var y = 100

  if (Array.isArray(cycles)) {
    for (var i = 0; i < cycles.length && i < 8; i++) {
      var cycle = cycles[i]
      doc.font('Helvetica-Bold')
      doc.fontSize(10)
      doc.fillColor(COLORS.gold)
      doc.text('Cycle ' + (i + 1), 50, y)

      doc.font('Helvetica')
      doc.fillColor(COLORS.textWhite)
      doc.text((cycle.stem || '') + ' ' + (cycle.branch || '') + ' (' + (cycle.age || cycle.startAge || '') + ' years)', 120, y)

      if (cycle.description) {
        doc.fontSize(9)
        doc.fillColor(COLORS.textMuted)
        doc.text(cycle.description, 120, y + 16, { width: doc.page.width - 170 })
        y += 36
      } else {
        y += 22
      }
    }
  }
}

function drawSuggestions(doc: any, data: ReportData): void {
  drawPageHeader(doc, 'Suggestions')

  var suggestions = data.suggestions || []
  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    doc.font('Helvetica')
    doc.fontSize(10)
    doc.fillColor(COLORS.textMuted)
    doc.text('No suggestions available for this report.', 50, 100)
    return
  }

  var y = 100
  for (var i = 0; i < suggestions.length && i < 8; i++) {
    var s = suggestions[i]
    doc.font('Helvetica-Bold')
    doc.fontSize(10)
    doc.fillColor(COLORS.gold)
    doc.text((i + 1) + '. ' + (s.title || s.category || 'Suggestion'), 50, y)

    doc.font('Helvetica')
    doc.fontSize(9)
    doc.fillColor(COLORS.textWhite)
    doc.text(s.content || s.text || s.description || '', 70, y + 16, { width: doc.page.width - 120 })

    y += 50
  }
}

function drawPageHeader(doc: any, title: string): void {
  doc.font('Helvetica-Bold')
  doc.fontSize(16)
  doc.fillColor(COLORS.gold)
  doc.text(title, 50, 50)

  doc.moveTo(50, 75).lineTo(doc.page.width - 50, 75)
    .strokeColor(COLORS.gold).lineWidth(0.5).stroke()
}

// ───────────────────────────────────────────────
//  类型定义
// ───────────────────────────────────────────────

interface ReportData {
  reportType: string
  personName: string
  gender: string
  birthDate: string
  birthTime: string
  birthPlace: string
  zodiac: string
  dayMasterElement: string
  generatedAt: string
  baziChart: Array<{ stem?: string; tianGan?: string; branch?: string; diZhi?: string; nayin?: string }>
  wuxingAnalysis: Array<{ name?: string; count?: number; value?: number; status?: string; label?: string }>
  wuxingSummary: string
  shishenAnalysis: any
  dayunAnalysis: Array<{ stem?: string; branch?: string; age?: number; startAge?: number; description?: string }>
  suggestions: Array<{ title?: string; category?: string; content?: string; text?: string; description?: string }>
}

export { generatePdf }
