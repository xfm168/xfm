/**
 * shareUtils.ts — 玄风门 V4.2 分享海报工具
 *
 * 纯 Canvas 绘制，不使用 html2canvas，无外部依赖。
 * 三种海报类型：
 * - 九宫格（3x3 网格，9张卡片）
 * - 长图（1080x1920 小红书竖版）
 * - 微信卡片（600x400 简洁版）
 *
 * 风格：黑金国风
 */

import type { BaZiChart } from './types'

// ============================================================
// 类型定义
// ============================================================

export interface NineGridConfig {
  chart: BaZiChart
  geJu?: string
  dayMasterDesc?: string
  xiYongShenDesc?: string
  overallScore?: number
  luckyColor?: string
  luckyNumber?: string
  fortuneSummary?: string
  title?: string
}

export interface LongImageConfig {
  chart: BaZiChart
  geJu?: string
  dayMasterDesc?: string
  xiYongShenDesc?: string
  overallScore?: number
  fiveElementPower?: { element: string; percentage: number }[]
  daYun?: { ganZhi: string; startYear: number; endYear: number; description?: string }[]
  marriage?: string
  career?: string
  wealth?: string
  health?: string
  fortuneSummary?: string
  title?: string
}

export interface WeChatShareConfig {
  chart: BaZiChart
  geJu?: string
  dayMasterDesc?: string
  xiYongShenDesc?: string
  overallScore?: number
  title?: string
}

// ============================================================
// 常量 — 黑金国风配色
// ============================================================

const COLORS = {
  bg: '#0A0A0A',
  bgSecondary: '#111111',
  gold: '#D4A843',
  goldLight: '#F0D68A',
  goldDark: '#8B6914',
  text: '#F5F0E1',
  textSecondary: '#A89F8A',
  textMuted: '#6B6354',
  border: '#2A2520',
  borderGold: '#3D3527',
  cardBg: '#141210',
  cardBgAlt: '#1A1714',
  red: '#C4453A',
  green: '#5B8C5A',
  blue: '#4A7FB5',
} as const

/** 五行颜色 */
const ELEMENT_COLORS: Record<string, string> = {
  '木': '#2E8B57',
  '火': '#DC143C',
  '土': '#DAA520',
  '金': '#C0C0C0',
  '水': '#1E90FF',
}

// ============================================================
// Canvas 绘制工具函数
// ============================================================

/** 绘制圆角矩形路径 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

/** 绘制填充圆角矩形 */
function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  color: string,
) {
  ctx.fillStyle = color
  roundRect(ctx, x, y, w, h, r)
  ctx.fill()
}

/** 绘制描边圆角矩形 */
function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
  color: string, lineWidth: number = 1,
) {
  ctx.strokeStyle = color
  ctx.lineWidth = lineWidth
  roundRect(ctx, x, y, w, h, r)
  ctx.stroke()
}

/** 绘制居中文字 */
function drawCenterText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  maxWidth: number,
  color: string,
  fontSize: number,
  fontWeight: string = 'normal',
  fontFamily: string = 'serif',
) {
  ctx.fillStyle = color
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // 自动换行
  const words = text.split('')
  let line = ''
  const lines: string[] = []
  for (const char of words) {
    const testLine = line + char
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line) {
      lines.push(line)
      line = char
    } else {
      line = testLine
    }
  }
  lines.push(line)
  const lineHeight = fontSize * 1.5
  const totalHeight = lines.length * lineHeight
  const startY = y - totalHeight / 2 + lineHeight / 2
  lines.forEach((l, i) => {
    ctx.fillText(l, x, startY + i * lineHeight)
  })
}

/** 绘制顶部装饰线 */
function drawTopOrnament(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  ctx.strokeStyle = COLORS.gold
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.lineTo(x + width, y)
  ctx.stroke()

  // 中心菱形装饰
  const cx = x + width / 2
  ctx.fillStyle = COLORS.gold
  ctx.beginPath()
  ctx.moveTo(cx, y - 4)
  ctx.lineTo(cx + 4, y)
  ctx.lineTo(cx, y + 4)
  ctx.lineTo(cx - 4, y)
  ctx.closePath()
  ctx.fill()
}

/** 绘制底部装饰线 */
function drawBottomOrnament(ctx: CanvasRenderingContext2D, x: number, y: number, width: number) {
  drawTopOrnament(ctx, x, y, width)
}

/** 绘制八边形装饰框 */
function drawOctagonBorder(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number,
) {
  ctx.strokeStyle = COLORS.goldDark
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let i = 0; i < 8; i++) {
    const angle = (i * 45 - 22.5) * Math.PI / 180
    const px = cx + size * Math.cos(angle)
    const py = cy + size * Math.sin(angle)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.stroke()
}

// ============================================================
// 九宫格分享图
// ============================================================

/**
 * 生成九宫格分享图
 *
 * 9张卡片 3x3 网格：日主 + 八字 + 五行 + 格局 + 喜用 + 评分 + 幸运色 + 幸运数字 + 运势总结
 * 每格 320x320，总图 960x960 + 边距
 */
export function generateNineGridImage(config: NineGridConfig): HTMLCanvasElement {
  const { chart, geJu, dayMasterDesc, xiYongShenDesc, overallScore, luckyColor, luckyNumber, fortuneSummary, title } = config
  const { sixLines, fiveElementCount, dayMaster, xiYongShen, birthInfo } = chart

  const CELL = 320
  const GAP = 12
  const PADDING = 40
  const TOTAL = CELL * 3 + GAP * 2 + PADDING * 2
  const HEADER = 80

  const canvas = document.createElement('canvas')
  canvas.width = TOTAL
  canvas.height = TOTAL + HEADER + 60
  const ctx = canvas.getContext('2d')!

  // 背景
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // 标题区
  ctx.fillStyle = COLORS.bgSecondary
  ctx.fillRect(0, 0, canvas.width, HEADER)

  const titleText = title || '玄风命理'
  ctx.fillStyle = COLORS.gold
  ctx.font = 'bold 28px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(titleText, TOTAL / 2, HEADER / 2 - 10)

  ctx.fillStyle = COLORS.textSecondary
  ctx.font = '14px sans-serif'
  ctx.fillText(`${birthInfo.birthDate} ${birthInfo.gender === 'male' ? '男命' : '女命'}`, TOTAL / 2, HEADER / 2 + 20)

  drawTopOrnament(ctx, PADDING, HEADER - 1, TOTAL - PADDING * 2)

  // 九宫格卡片数据
  const cards = [
    {
      label: '日主',
      content: dayMasterDesc || `${dayMaster.dayGan}${dayMaster.dayGanElement}`,
      sub: `${dayMaster.dayGanYinYang}${dayMaster.dayGan}`,
    },
    {
      label: '四柱',
      content: `${sixLines.year.gan}${sixLines.year.zhi} ${sixLines.month.gan}${sixLines.month.zhi}\n${sixLines.day.gan}${sixLines.day.zhi} ${sixLines.hour.gan}${sixLines.hour.zhi}`,
      sub: '年 月 日 时',
    },
    {
      label: '五行',
      content: `木${fiveElementCount.木} 火${fiveElementCount.火} 土${fiveElementCount.土}\n金${fiveElementCount.金} 水${fiveElementCount.水}`,
      sub: '金木水火土',
    },
    {
      label: '格局',
      content: geJu || '推演中',
      sub: '命局格局',
    },
    {
      label: '喜用神',
      content: xiYongShenDesc || `喜${xiYongShen.happiness} 用${xiYongShen.usage}`,
      sub: '五行调候',
    },
    {
      label: '综合评分',
      content: `${overallScore ?? chart.overallScore}分`,
      sub: overallScore != null && overallScore >= 80 ? '上等命局' : overallScore != null && overallScore >= 60 ? '中上命局' : chart.overallScore >= 80 ? '上等命局' : chart.overallScore >= 60 ? '中上命局' : '可造之材',
    },
    {
      label: '幸运色',
      content: luckyColor || ELEMENT_COLORS[xiYongShen.bestElement] ? xiYongShen.bestElement + '系' : '金木水火土',
      sub: '开运色系',
    },
    {
      label: '幸运数字',
      content: luckyNumber || getLuckyNumbers(xiYongShen.bestElement),
      sub: '吉利数字',
    },
    {
      label: '运势总结',
      content: fortuneSummary || chart.analysis?.summary || '命格分析完成',
      sub: '',
    },
  ]

  // 绘制九宫格
  cards.forEach((card, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = PADDING + col * (CELL + GAP)
    const y = HEADER + 10 + row * (CELL + GAP)

    // 卡片背景
    fillRoundRect(ctx, x, y, CELL, CELL, 8, i % 2 === 0 ? COLORS.cardBg : COLORS.cardBgAlt)
    strokeRoundRect(ctx, x, y, CELL, CELL, 8, COLORS.borderGold, 0.5)

    // 装饰角标
    ctx.fillStyle = COLORS.goldDark
    ctx.fillRect(x + 8, y + 8, 2, 20)
    ctx.fillRect(x + 8, y + 8, 20, 2)

    // 标签
    ctx.fillStyle = COLORS.gold
    ctx.font = 'bold 16px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(card.label, x + 16, y + 16)

    // 内容
    ctx.fillStyle = COLORS.text
    ctx.font = card.label === '运势总结' ? '15px sans-serif' : 'bold 22px serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    const contentLines = card.content.split('\n')
    contentLines.forEach((line, li) => {
      ctx.fillText(line, x + 16, y + CELL / 2 - (contentLines.length - 1) * 14 + li * 28)
    })

    // 副标签
    if (card.sub) {
      ctx.fillStyle = COLORS.textMuted
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      ctx.fillText(card.sub, x + CELL - 16, y + CELL - 16)
    }
  })

  // 底部水印
  const footerY = canvas.height - 30
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('玄风命理 V4.2 · 八字排盘分析', TOTAL / 2, footerY)
  drawBottomOrnament(ctx, PADDING, footerY - 16, TOTAL - PADDING * 2)

  return canvas
}

// ============================================================
// 长图海报（小红书竖版 1080x1920）
// ============================================================

/**
 * 生成长图海报
 *
 * 完整命盘信息，适合小红书竖版分享 1080x1920
 */
export function generateLongImage(config: LongImageConfig): HTMLCanvasElement {
  const { chart, geJu, dayMasterDesc, xiYongShenDesc, overallScore, fiveElementPower, daYun, marriage, career, wealth, health, fortuneSummary, title } = config
  const { sixLines, fiveElementCount, dayMaster, xiYongShen, birthInfo } = chart

  const W = 1080
  const H = 1920
  const PAD = 60

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 背景
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, W, H)

  // ====== 标题区 ======
  const titleY = 100
  ctx.fillStyle = COLORS.gold
  ctx.font = 'bold 48px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(title || '玄风命理', W / 2, titleY)

  ctx.fillStyle = COLORS.textSecondary
  ctx.font = '24px sans-serif'
  ctx.fillText(`${birthInfo.birthDate} ${birthInfo.gender === 'male' ? '男命' : '女命'}`, W / 2, titleY + 50)

  drawTopOrnament(ctx, PAD, titleY + 80, W - PAD * 2)

  // ====== 八卦装饰 ======
  drawOctagonBorder(ctx, W / 2, titleY + 140, 30)

  // ====== 命盘核心信息 ======
  let curY = 340

  // 四柱展示
  const pillars = [
    { label: '年柱', gan: sixLines.year.gan, zhi: sixLines.year.zhi, nayin: sixLines.year.naYin },
    { label: '月柱', gan: sixLines.month.gan, zhi: sixLines.month.zhi, nayin: sixLines.month.naYin },
    { label: '日柱', gan: sixLines.day.gan, zhi: sixLines.day.zhi, nayin: sixLines.day.naYin },
    { label: '时柱', gan: sixLines.hour.gan, zhi: sixLines.hour.zhi, nayin: sixLines.hour.naYin },
  ]

  const pillarW = (W - PAD * 2 - 30 * 3) / 4
  pillars.forEach((p, i) => {
    const px = PAD + i * (pillarW + 30)
    fillRoundRect(ctx, px, curY, pillarW, 160, 8, COLORS.cardBg)
    strokeRoundRect(ctx, px, curY, pillarW, 160, 8, COLORS.borderGold, 0.5)

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '18px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(p.label, px + pillarW / 2, curY + 12)

    ctx.fillStyle = i === 2 ? COLORS.gold : COLORS.text
    ctx.font = `bold 42px serif`
    ctx.textBaseline = 'middle'
    ctx.fillText(`${p.gan}${p.zhi}`, px + pillarW / 2, curY + 75)

    ctx.fillStyle = COLORS.textSecondary
    ctx.font = '16px sans-serif'
    ctx.fillText(p.nayin || '', px + pillarW / 2, curY + 115)

    // 日柱高亮标记
    if (i === 2) {
      strokeRoundRect(ctx, px, curY, pillarW, 160, 8, COLORS.gold, 1.5)
    }
  })

  curY += 200

  // ====== 日主 + 格局 + 喜用神 ======
  fillRoundRect(ctx, PAD, curY, W - PAD * 2, 130, 8, COLORS.cardBg)
  strokeRoundRect(ctx, PAD, curY, W - PAD * 2, 130, 8, COLORS.borderGold, 0.5)

  // 日主
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('日主', PAD + 24, curY + 16)
  ctx.fillStyle = COLORS.gold
  ctx.font = 'bold 32px serif'
  ctx.fillText(dayMasterDesc || `${dayMaster.dayGan}${dayMaster.dayGanElement}`, PAD + 24, curY + 42)

  // 格局
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '16px sans-serif'
  ctx.fillText('格局', W / 2, curY + 16)
  ctx.fillStyle = COLORS.text
  ctx.font = 'bold 28px serif'
  ctx.fillText(geJu || '推演中', W / 2, curY + 42)

  // 喜用神
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText('喜用神', W - PAD - 24, curY + 16)
  ctx.fillStyle = COLORS.goldLight
  ctx.font = 'bold 24px serif'
  ctx.fillText(xiYongShenDesc || `喜${xiYongShen.happiness} 用${xiYongShen.usage}`, W - PAD - 24, curY + 42)

  // 五行柱状图
  const feX = PAD + 24
  const feY = curY + 95
  const feBarW = 60
  const feBarH = 24
  const feMax = Math.max(...Object.values(fiveElementCount), 1)
  const elements: [string, number][] = [['木', fiveElementCount.木], ['火', fiveElementCount.火], ['土', fiveElementCount.土], ['金', fiveElementCount.金], ['水', fiveElementCount.水]]
  elements.forEach(([el, count], ei) => {
    const bx = feX + ei * (feBarW + 20)
    ctx.fillStyle = ELEMENT_COLORS[el]
    ctx.globalAlpha = 0.3
    ctx.fillRect(bx, feY, feBarW, feBarH)
    ctx.globalAlpha = 1
    ctx.fillStyle = ELEMENT_COLORS[el]
    ctx.fillRect(bx, feY, feBarW * (count / feMax), feBarH)
    ctx.fillStyle = COLORS.textSecondary
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`${el}${count}`, bx + feBarW / 2, feY + feBarH / 2)
  })

  curY += 160

  // ====== 综合评分 ======
  const score = overallScore ?? chart.overallScore
  const scoreLabel = score >= 85 ? '上等命格' : score >= 70 ? '中上命格' : score >= 55 ? '中等命格' : '待运而兴'

  fillRoundRect(ctx, PAD, curY, W - PAD * 2, 100, 8, COLORS.cardBg)
  strokeRoundRect(ctx, PAD, curY, W - PAD * 2, 100, 8, COLORS.borderGold, 0.5)

  ctx.fillStyle = COLORS.textMuted
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('综合评分', PAD + 24, curY + 35)

  ctx.fillStyle = score >= 70 ? COLORS.gold : score >= 50 ? COLORS.text : COLORS.red
  ctx.font = 'bold 44px serif'
  ctx.fillText(`${score}`, PAD + 24, curY + 72)

  ctx.fillStyle = COLORS.textSecondary
  ctx.font = '20px sans-serif'
  ctx.fillText(`分 · ${scoreLabel}`, PAD + 100, curY + 72)

  // 评分条
  const barX = PAD + 260
  const barW = W - PAD * 2 - 260 - 24
  ctx.fillStyle = COLORS.border
  ctx.fillRect(barX, curY + 62, barW, 12)
  ctx.fillStyle = score >= 70 ? COLORS.gold : score >= 50 ? COLORS.textSecondary : COLORS.red
  ctx.fillRect(barX, curY + 62, barW * (score / 100), 12)

  curY += 130

  // ====== 五行能量（如果有传入详细数据） ======
  if (fiveElementPower && fiveElementPower.length > 0) {
    fillRoundRect(ctx, PAD, curY, W - PAD * 2, 160, 8, COLORS.cardBg)
    strokeRoundRect(ctx, PAD, curY, W - PAD * 2, 160, 8, COLORS.borderGold, 0.5)

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('五行力量分析', PAD + 24, curY + 16)

    const epY = curY + 50
    const epBarH = 18
    const epMaxP = Math.max(...fiveElementPower.map(e => e.percentage), 1)
    fiveElementPower.forEach((ep, ei) => {
      const ey = epY + ei * (epBarH + 10)
      const eName = ep.element as string

      ctx.fillStyle = COLORS.textSecondary
      ctx.font = '16px serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'middle'
      ctx.fillText(eName, PAD + 24, ey + epBarH / 2)

      const ebx = PAD + 60
      const ebw = W - PAD * 2 - 160
      ctx.fillStyle = COLORS.border
      ctx.fillRect(ebx, ey, ebw, epBarH)
      ctx.fillStyle = ELEMENT_COLORS[eName] || COLORS.gold
      ctx.fillRect(ebx, ey, ebw * (ep.percentage / epMaxP), epBarH)

      ctx.fillStyle = COLORS.textMuted
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${ep.percentage}%`, W - PAD - 24, ey + epBarH / 2)
    })

    curY += 190
  }

  // ====== 大运概览 ======
  if (daYun && daYun.length > 0) {
    fillRoundRect(ctx, PAD, curY, W - PAD * 2, 140, 8, COLORS.cardBg)
    strokeRoundRect(ctx, PAD, curY, W - PAD * 2, 140, 8, COLORS.borderGold, 0.5)

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '16px sans-serif'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('大运概览', PAD + 24, curY + 16)

    const showDaYun = daYun.slice(0, 5)
    const dayunW = (W - PAD * 2 - (showDaYun.length - 1) * 12 - 48) / showDaYun.length
    showDaYun.forEach((d, i) => {
      const dx = PAD + 24 + i * (dayunW + 12)
      fillRoundRect(ctx, dx, curY + 48, dayunW, 70, 6, i === 0 ? COLORS.goldDark + '33' : COLORS.border)
      ctx.fillStyle = COLORS.text
      ctx.font = 'bold 22px serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(d.ganZhi, dx + dayunW / 2, curY + 70)
      ctx.fillStyle = COLORS.textMuted
      ctx.font = '13px sans-serif'
      ctx.fillText(`${d.startYear}-${d.endYear}`, dx + dayunW / 2, curY + 98)
    })

    curY += 170
  }

  // ====== 运势总结 ======
  const summaryText = fortuneSummary || chart.analysis?.summary || '命格分析完成，请查看详细解读。'
  fillRoundRect(ctx, PAD, curY, W - PAD * 2, 200, 8, COLORS.cardBg)
  strokeRoundRect(ctx, PAD, curY, W - PAD * 2, 200, 8, COLORS.borderGold, 0.5)

  ctx.fillStyle = COLORS.textMuted
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('运势总结', PAD + 24, curY + 16)

  ctx.fillStyle = COLORS.text
  ctx.font = '20px serif'
  drawCenterText(ctx, summaryText, W / 2, curY + 110, W - PAD * 2 - 48, COLORS.text, 20, 'normal', 'serif')

  curY += 230

  // ====== 底部水印 ======
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '16px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('玄风命理 V4.2 · 八字排盘分析', W / 2, H - 60)
  drawBottomOrnament(ctx, PAD, H - 80, W - PAD * 2)

  return canvas
}

// ============================================================
// 微信分享卡片（600x400 简洁版）
// ============================================================

/**
 * 生成微信分享卡片
 *
 * 简洁版，适合微信对话分享 600x400
 */
export function generateWeChatShareCard(config: WeChatShareConfig): HTMLCanvasElement {
  const { chart, geJu, dayMasterDesc, xiYongShenDesc, overallScore, title } = config
  const { sixLines, fiveElementCount, dayMaster, xiYongShen, birthInfo } = chart

  const W = 600
  const H = 400
  const PAD = 40

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // 背景
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, '#0E0C0A')
  grad.addColorStop(1, '#0A0908')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // 金色装饰边框
  strokeRoundRect(ctx, 8, 8, W - 16, H - 16, 12, COLORS.goldDark, 1)
  strokeRoundRect(ctx, 12, 12, W - 24, H - 24, 10, COLORS.border, 0.5)

  // ====== 标题 ======
  ctx.fillStyle = COLORS.gold
  ctx.font = 'bold 28px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(title || '玄风命理', W / 2, 50)

  drawTopOrnament(ctx, PAD, 72, W - PAD * 2)

  // ====== 八字展示 ======
  const pillars = [
    { label: '年', gan: sixLines.year.gan, zhi: sixLines.year.zhi },
    { label: '月', gan: sixLines.month.gan, zhi: sixLines.month.zhi },
    { label: '日', gan: sixLines.day.gan, zhi: sixLines.day.zhi },
    { label: '时', gan: sixLines.hour.gan, zhi: sixLines.hour.zhi },
  ]

  const pillarCellW = (W - PAD * 2 - 20 * 3) / 4
  pillars.forEach((p, i) => {
    const px = PAD + i * (pillarCellW + 20)
    const py = 95

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(p.label, px + pillarCellW / 2, py)

    ctx.fillStyle = i === 2 ? COLORS.gold : COLORS.text
    ctx.font = `bold 30px serif`
    ctx.textBaseline = 'middle'
    ctx.fillText(`${p.gan}${p.zhi}`, px + pillarCellW / 2, py + 35)
  })

  // ====== 核心信息三栏 ======
  const infoY = 175
  const infoItems = [
    {
      label: '日主',
      value: dayMasterDesc || `${dayMaster.dayGan}${dayMaster.dayGanElement}`,
      color: COLORS.gold,
    },
    {
      label: '格局',
      value: geJu || '推演中',
      color: COLORS.text,
    },
    {
      label: '喜用',
      value: xiYongShenDesc || `喜${xiYongShen.happiness} 用${xiYongShen.usage}`,
      color: COLORS.goldLight,
    },
  ]

  const infoCellW = (W - PAD * 2 - 20 * 2) / 3
  infoItems.forEach((item, i) => {
    const ix = PAD + i * (infoCellW + 20)

    ctx.fillStyle = COLORS.textMuted
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(item.label, ix + infoCellW / 2, infoY)

    ctx.fillStyle = item.color
    ctx.font = 'bold 22px serif'
    ctx.textBaseline = 'middle'
    ctx.fillText(item.value, ix + infoCellW / 2, infoY + 35)
  })

  // ====== 评分 ======
  const score = overallScore ?? chart.overallScore
  const scoreY = 270

  fillRoundRect(ctx, PAD, scoreY, W - PAD * 2, 50, 8, COLORS.cardBg)

  ctx.fillStyle = COLORS.textMuted
  ctx.font = '14px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('综合评分', PAD + 20, scoreY + 25)

  ctx.fillStyle = score >= 70 ? COLORS.gold : COLORS.text
  ctx.font = 'bold 26px serif'
  ctx.fillText(`${score}分`, PAD + 110, scoreY + 25)

  // 评分条
  const sBarX = PAD + 200
  const sBarW = W - PAD * 2 - 200 - 20
  ctx.fillStyle = COLORS.border
  ctx.fillRect(sBarX, scoreY + 20, sBarW, 10)
  ctx.fillStyle = COLORS.gold
  ctx.fillRect(sBarX, scoreY + 20, sBarW * (score / 100), 10)

  // ====== 运势小结 ======
  const summaryText = chart.analysis?.summary
  if (summaryText) {
    const summaryDisplay = summaryText.length > 50 ? summaryText.slice(0, 50) + '...' : summaryText
    ctx.fillStyle = COLORS.textSecondary
    ctx.font = '16px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(summaryDisplay, W / 2, 348)
  }

  // ====== 底部 ======
  drawBottomOrnament(ctx, PAD, H - 30, W - PAD * 2)
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('玄风命理 V4.2', W / 2, H - 16)

  return canvas
}

// ============================================================
// 下载工具
// ============================================================

/**
 * 触发下载 Canvas 图片
 *
 * @param canvas HTMLCanvasElement
 * @param filename 下载文件名（不含扩展名）
 */
export function downloadShareImage(canvas: HTMLCanvasElement, filename: string): void {
  try {
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  } catch {
    console.error('下载分享图失败')
  }
}

/**
 * 兼容旧接口：接收 HTML 字符串并下载（内部会创建 canvas）
 * 注意：本实现直接返回 Canvas，此函数为接口兼容保留
 */
export function downloadShareImageFromString(htmlContent: string, filename: string): void {
  // htmlContent 在本实现中实为 JSON 字符串的 canvas 配置
  // 此为兼容接口，实际建议直接使用 downloadShareImage(canvas, filename)
  try {
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    console.error('下载失败')
  }
}

// ============================================================
// 辅助函数
// ============================================================

/** 根据喜用神五行推算幸运数字 */
function getLuckyNumbers(element: string): string {
  const numberMap: Record<string, string> = {
    '木': '3, 8',
    '火': '2, 7',
    '土': '5, 6',
    '金': '4, 9',
    '水': '1, 6',
  }
  return numberMap[element] || '1-9'
}
