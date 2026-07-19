/**
 * 玄风门 V3.2 风水勘测分享模块
 *
 * 功能：
 * 1. generateShareImage() - Canvas 绘制分享海报（1080x1920 竖版）
 * 2. generateShareText()  - 根据分数生成不同风格的分享文案
 * 3. generateShareReport() - 生成精简版 HTML 报告
 * 4. downloadSharePoster() - 触发浏览器下载分享海报
 */

import type { FengShuiHistoryRecordV31, FengShuiHistoryRecordV32 } from '../types'
import { isV32Record } from '../types'

// ═══════════════════════════════════════════════
// 类型定义
// ═══════════════════════════════════════════════

export interface ShareImageOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'png' | 'jpeg'
}

export type SharePlatform = 'wechat' | 'moments' | 'xiaohongshu' | 'general'

// ═══════════════════════════════════════════════
// 常量与主题
// ═══════════════════════════════════════════════

const POSTER_WIDTH = 1080
const POSTER_HEIGHT = 1920

// 玄风门品牌色
const COLORS = {
  bgPrimary: '#071629',
  bgSecondary: '#0B1F3B',
  goldLight: '#E8C56A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  textPrimary: '#F5F1E8',
  textSecondary: '#B8C4D6',
  textMuted: '#6B7D94',
  border: 'rgba(212, 175, 55, 0.3)',
  success: '#6B9E7A',
  warning: '#C4A24A',
  error: '#C46060',
}

// ═══════════════════════════════════════════════
// 内部工具函数
// ═══════════════════════════════════════════════

/**
 * 获取评分等级描述
 */
function getScoreLevel(score: number): { label: string; color: string; emoji: string } {
  if (score >= 90) return { label: '极佳', color: COLORS.success, emoji: '🌟' }
  if (score >= 80) return { label: '优良', color: COLORS.goldLight, emoji: '✨' }
  if (score >= 70) return { label: '良好', color: COLORS.gold, emoji: '👍' }
  if (score >= 60) return { label: '一般', color: COLORS.warning, emoji: '⚠️' }
  return { label: '待改善', color: COLORS.error, emoji: '🔧' }
}

/**
 * 加载图片（用于 Canvas 绘制）
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Canvas 绘制圆角矩形
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Canvas 多行文本绘制
 */
function drawMultilineText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const chars = text.split('')
  let line = ''
  let currentY = y
  let lineCount = 0

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i]
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && line !== '') {
      ctx.fillText(line, x, currentY)
      line = chars[i]
      currentY += lineHeight
      lineCount++
    } else {
      line = testLine
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY)
    lineCount++
  }
  return lineCount
}

/**
 * 创建 Canvas 上下文
 */
function createCanvas(width: number, height: number): {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
} {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D 上下文创建失败')
  return { canvas, ctx }
}

// ═══════════════════════════════════════════════
// 一、分享图片生成（Canvas 海报）
// ═══════════════════════════════════════════════

/**
 * 生成分享图片（Canvas 绘制海报风格）
 * - 顶部：玄风门 Logo + 标题
 * - 中部：房屋图片 + 总分大字显示
 * - 下部：3个核心问题摘要
 * - 底部：二维码占位 + "扫码查看完整报告"
 * 适合微信朋友圈（1080x1920 竖版）
 */
export async function generateShareImage(
  record: FengShuiHistoryRecordV31,
  options: ShareImageOptions = {}
): Promise<string> {
  const {
    width = POSTER_WIDTH,
    height = POSTER_HEIGHT,
    quality = 0.92,
    format = 'jpeg',
  } = options

  const { canvas, ctx } = createCanvas(width, height)

  // 1. 绘制背景渐变
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
  bgGradient.addColorStop(0, '#0A1A2F')
  bgGradient.addColorStop(0.5, '#0D2240')
  bgGradient.addColorStop(1, '#071629')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)

  // 装饰性光点
  drawDecorativeDots(ctx, width, height)

  let currentY = 80

  // 2. 顶部：Logo + 标题
  currentY = drawHeader(ctx, width, currentY)

  // 3. 空间名称
  ctx.fillStyle = COLORS.textSecondary
  ctx.font = '32px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(record.roomName, width / 2, currentY)
  currentY += 60

  // 4. 中部：房屋图片
  currentY = await drawHouseImage(ctx, record.imageData, width, currentY)

  // 5. 总分大字显示
  currentY = drawScore(ctx, record.overallScore, width, currentY)

  // 6. 可信度与问题数
  const extraInfo: string[] = []
  extraInfo.push(`可信度 ${record.credibility.score} 分`)
  if (isV32Record(record)) {
    extraInfo.push(`发现 ${record.issueCount} 个问题`)
  }
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '26px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(extraInfo.join('  ·  '), width / 2, currentY)
  currentY += 60

  // 7. 分隔线
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(120, currentY)
  ctx.lineTo(width - 120, currentY)
  ctx.stroke()
  currentY += 50

  // 8. 3个核心问题摘要
  const topIssues = record.mainIssues.slice(0, 3)
  currentY = drawIssues(ctx, topIssues, width, currentY)

  // 9. 底部：二维码占位 + 提示文字
  drawFooter(ctx, width, height)

  // 导出
  const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
  return canvas.toDataURL(mimeType, quality)
}

/**
 * 绘制装饰性光点
 */
function drawDecorativeDots(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const dots = [
    { x: width * 0.1, y: height * 0.08, r: 80, alpha: 0.08 },
    { x: width * 0.9, y: height * 0.15, r: 120, alpha: 0.06 },
    { x: width * 0.05, y: height * 0.7, r: 100, alpha: 0.05 },
    { x: width * 0.95, y: height * 0.85, r: 90, alpha: 0.07 },
  ]
  dots.forEach(dot => {
    const gradient = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, dot.r)
    gradient.addColorStop(0, `rgba(212, 175, 55, ${dot.alpha})`)
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2)
    ctx.fill()
  })
}

/**
 * 绘制顶部 Logo + 标题
 */
function drawHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  startY: number
): number {
  const centerX = width / 2

  // Logo 圆形背景
  const logoRadius = 50
  const logoY = startY + logoRadius
  const logoGradient = ctx.createRadialGradient(centerX, logoY, 0, centerX, logoY, logoRadius)
  logoGradient.addColorStop(0, COLORS.goldLight)
  logoGradient.addColorStop(1, COLORS.goldDark)
  ctx.fillStyle = logoGradient
  ctx.beginPath()
  ctx.arc(centerX, logoY, logoRadius, 0, Math.PI * 2)
  ctx.fill()

  // Logo 内文字（八卦符号）
  ctx.fillStyle = COLORS.bgPrimary
  ctx.font = 'bold 48px serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('☯', centerX, logoY)
  ctx.textBaseline = 'alphabetic'

  // 标题
  ctx.fillStyle = COLORS.textPrimary
  ctx.font = 'bold 56px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('玄风门', centerX, logoY + logoRadius + 70)

  // 副标题
  ctx.fillStyle = COLORS.gold
  ctx.font = '28px sans-serif'
  ctx.fillText('风水勘测报告', centerX, logoY + logoRadius + 120)

  return logoY + logoRadius + 170
}

/**
 * 绘制房屋图片
 */
async function drawHouseImage(
  ctx: CanvasRenderingContext2D,
  imageData: string,
  width: number,
  startY: number
): Promise<number> {
  const imgWidth = width - 160
  const imgHeight = 540
  const imgX = 80
  const imgY = startY

  // 图片背景圆角卡片
  ctx.save()
  roundRect(ctx, imgX, imgY, imgWidth, imgHeight, 24)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)'
  ctx.fill()
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 2
  ctx.stroke()
  ctx.clip()

  try {
    const img = await loadImage(imageData)
    // 计算等比缩放
    const scale = Math.max(imgWidth / img.width, imgHeight / img.height)
    const scaledW = img.width * scale
    const scaledH = img.height * scale
    const drawX = imgX + (imgWidth - scaledW) / 2
    const drawY = imgY + (imgHeight - scaledH) / 2
    ctx.drawImage(img, drawX, drawY, scaledW, scaledH)
  } catch {
    // 图片加载失败，显示占位
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '32px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('图片加载中', imgX + imgWidth / 2, imgY + imgHeight / 2)
  }

  ctx.restore()

  return startY + imgHeight + 40
}

/**
 * 绘制总分大字
 */
function drawScore(
  ctx: CanvasRenderingContext2D,
  score: number,
  width: number,
  startY: number
): number {
  const centerX = width / 2
  const level = getScoreLevel(score)

  // 评分等级标签
  ctx.fillStyle = level.color
  ctx.font = '28px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${level.emoji} ${level.label}`, centerX, startY)

  // 分数数字
  ctx.fillStyle = COLORS.goldLight
  ctx.font = 'bold 160px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(String(score), centerX, startY + 100)
  ctx.textBaseline = 'alphabetic'

  // "分"字
  ctx.fillStyle = COLORS.textSecondary
  ctx.font = '32px sans-serif'
  ctx.fillText('分', centerX + 100, startY + 100)

  return startY + 200
}

/**
 * 绘制问题摘要
 */
function drawIssues(
  ctx: CanvasRenderingContext2D,
  issues: string[],
  width: number,
  startY: number
): number {
  const padding = 40
  const cardX = 80
  const cardWidth = width - 160

  // 标题
  ctx.fillStyle = COLORS.textPrimary
  ctx.font = 'bold 34px sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('核心问题', cardX, startY)
  startY += 20

  if (issues.length === 0) {
    ctx.fillStyle = COLORS.textMuted
    ctx.font = '28px sans-serif'
    ctx.fillText('未发现明显问题，格局良好', cardX, startY + 40)
    return startY + 80
  }

  let currentY = startY + 50

  issues.forEach((issue, index) => {
    const bulletColor = index === 0 ? COLORS.error : index === 1 ? COLORS.warning : COLORS.gold

    // 序号圆点
    ctx.fillStyle = bulletColor
    ctx.beginPath()
    ctx.arc(cardX + 20, currentY - 8, 16, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = COLORS.bgPrimary
    ctx.font = 'bold 22px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(index + 1), cardX + 20, currentY - 8)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left'

    // 问题文字
    ctx.fillStyle = COLORS.textPrimary
    ctx.font = '28px sans-serif'
    const lines = drawMultilineText(
      ctx,
      issue,
      cardX + 55,
      currentY,
      cardWidth - 70,
      40
    )
    currentY += lines * 40 + 20
  })

  return currentY + padding
}

/**
 * 绘制底部二维码占位和提示
 */
function drawFooter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  const centerX = width / 2
  const qrSize = 180
  const qrY = height - 340

  // 二维码占位框
  const qrX = centerX - qrSize / 2
  ctx.fillStyle = '#FFFFFF'
  roundRect(ctx, qrX, qrY, qrSize, qrSize, 12)
  ctx.fill()
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = 2
  ctx.stroke()

  // 二维码占位图案（简单的网格）
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 1
  const cellSize = qrSize / 10
  for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 10; j++) {
      if (Math.random() > 0.5) {
        ctx.fillStyle = '#222'
        ctx.fillRect(qrX + i * cellSize, qrY + j * cellSize, cellSize, cellSize)
      }
    }
  }
  // 三个定位方块
  const corners = [
    [0, 0],
    [qrSize - cellSize * 3, 0],
    [0, qrSize - cellSize * 3],
  ]
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = '#222'
    ctx.fillRect(qrX + cx, qrY + cy, cellSize * 3, cellSize * 3)
    ctx.fillStyle = '#FFF'
    ctx.fillRect(qrX + cx + cellSize * 0.5, qrY + cy + cellSize * 0.5, cellSize * 2, cellSize * 2)
    ctx.fillStyle = '#222'
    ctx.fillRect(qrX + cx + cellSize, qrY + cy + cellSize, cellSize, cellSize)
  })

  // 扫码提示
  ctx.fillStyle = COLORS.textSecondary
  ctx.font = '26px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('扫码查看完整报告', centerX, qrY + qrSize + 45)

  // 品牌信息
  ctx.fillStyle = COLORS.textMuted
  ctx.font = '22px sans-serif'
  ctx.fillText('玄风门 · 专业风水勘测', centerX, height - 80)

  ctx.fillStyle = COLORS.gold
  ctx.font = '20px sans-serif'
  ctx.fillText('xuanfengmen.com', centerX, height - 50)
}

// ═══════════════════════════════════════════════
// 二、分享文案生成
// ═══════════════════════════════════════════════

/**
 * 生成分享文案
 * 根据分数生成不同风格的文案
 * 包含房间类型、总分、核心问题
 * 支持微信/小红书等平台风格
 */
export function generateShareText(
  record: FengShuiHistoryRecordV31,
  platform: SharePlatform = 'general'
): string {
  const level = getScoreLevel(record.overallScore)
  const topIssues = record.mainIssues.slice(0, 3)
  const isV32 = isV32Record(record)

  switch (platform) {
    case 'wechat':
      return generateWechatText(record, level, topIssues, isV32)
    case 'moments':
      return generateMomentsText(record, level, topIssues, isV32)
    case 'xiaohongshu':
      return generateXiaohongshuText(record, level, topIssues, isV32)
    default:
      return generateGeneralText(record, level, topIssues, isV32)
  }
}

function generateWechatText(
  record: FengShuiHistoryRecordV31,
  level: { label: string; color: string; emoji: string },
  topIssues: string[],
  isV32: boolean
): string {
  const lines = [
    `${level.emoji} 【玄风门风水勘测】`,
    '',
    `📍 ${record.roomName}`,
    `📊 综合评分：${record.overallScore} 分（${level.label}）`,
    `🎯 可信度：${record.credibility.score} 分`,
    isV32 ? `🔍 发现问题：${(record as FengShuiHistoryRecordV32).issueCount} 个` : '',
    '',
    '⚠️ 核心问题：',
    ...topIssues.map((issue, i) => `  ${i + 1}. ${issue}`),
    '',
    '💡 建议：下载玄风门 APP 查看完整整改方案',
    '',
    '—— 玄风门 · 让风水更科学 ——',
  ]
  return lines.filter(Boolean).join('\n')
}

function generateMomentsText(
  record: FengShuiHistoryRecordV31,
  level: { label: string; color: string; emoji: string },
  topIssues: string[],
  isV32: boolean
): string {
  const goodScore = record.overallScore >= 80
  const lines = goodScore
    ? [
        `${level.emoji} 家里风水居然这么好！`,
        '',
        `刚用玄风门测了一下${record.roomName}，`,
        `综合评分 ${record.overallScore} 分！${level.label}水平！`,
        '',
        ...topIssues.map(issue => `✅ ${issue}`),
        '',
        '推荐大家也测测看～',
        '#玄风门 #风水 #家居',
      ]
    : [
        `${level.emoji} 原来我家风水有这些问题...`,
        '',
        `用玄风门测了${record.roomName}，`,
        `评分 ${record.overallScore} 分，${level.label}。`,
        isV32 ? `发现了 ${(record as FengShuiHistoryRecordV32).issueCount} 个问题。` : '',
        '',
        '⚠️ 主要问题：',
        ...topIssues.map(issue => `  • ${issue}`),
        '',
        '准备按照建议整改一下，期待效果！',
        '#玄风门 #风水 #家居改造',
      ]
  return lines.filter(Boolean).join('\n')
}

function generateXiaohongshuText(
  record: FengShuiHistoryRecordV31,
  level: { label: string; color: string; emoji: string },
  topIssues: string[],
  isV32: boolean
): string {
  const goodScore = record.overallScore >= 80
  const lines = goodScore
    ? [
        `🏮 姐妹们！我家风水居然有${record.overallScore}分！`,
        '',
        '最近被安利了玄风门这个APP，',
        '抱着试一试的心态测了我家' + record.roomName + '，',
        `结果居然有${record.overallScore}分！${level.label}！🎉`,
        '',
        '✨ 优点盘点：',
        ...topIssues.map((issue, i) => `${i + 1}. ${issue}`),
        '',
        '有兴趣的姐妹可以试试～',
        '测完回来告诉我你们家多少分呀～',
        '',
        '#风水 #家居 #玄风门 #好物分享',
        '#居家好物 #生活小技巧',
      ]
    : [
        `💔 测完我家风水，我沉默了...`,
        '',
        '跟风下了玄风门，测了下我家' + record.roomName + '，',
        `只有${record.overallScore}分...${level.label}`,
        isV32 ? `足足有${(record as FengShuiHistoryRecordV32).issueCount}个问题...` : '',
        '',
        '😣 踩雷清单：',
        ...topIssues.map((issue, i) => `${i + 1}. ${issue}`),
        '',
        '已经在看整改方案了，',
        '改完再来更新效果！有同款的姐妹吗？',
        '',
        '#风水 #家居改造 #玄风门 #踩雷',
        '#居家避坑 #装修干货',
      ]
  return lines.filter(Boolean).join('\n')
}

function generateGeneralText(
  record: FengShuiHistoryRecordV31,
  level: { label: string; color: string; emoji: string },
  topIssues: string[],
  isV32: boolean
): string {
  const lines = [
    '【玄风门 · 风水勘测报告】',
    '',
    `空间名称：${record.roomName}`,
    `空间类型：${record.roomType}`,
    `综合评分：${record.overallScore} 分（${level.label}）`,
    `分析可信度：${record.credibility.score} 分`,
    isV32 ? `问题数量：${(record as FengShuiHistoryRecordV32).issueCount} 个` : '',
    '',
    '核心问题：',
    ...topIssues.map((issue, i) => `${i + 1}. ${issue}`),
    '',
    `分析时间：${new Date(record.createdAt).toLocaleString('zh-CN')}`,
    '',
    '—— 来自玄风门 xuanfengmen.com',
  ]
  return lines.filter(Boolean).join('\n')
}

// ═══════════════════════════════════════════════
// 三、精简版 HTML 报告生成
// ═══════════════════════════════════════════════

/**
 * 生成精简版报告（HTML 格式）
 * 可直接复制的 HTML 字符串
 * 包含核心数据 + 建议
 */
export function generateShareReport(
  record: FengShuiHistoryRecordV31
): string {
  const level = getScoreLevel(record.overallScore)
  const isV32 = isV32Record(record)
  const topIssues = record.mainIssues.slice(0, 5)
  const topPlans = record.remediationPlans.slice(0, 3)

  // 12 维评分展示（V3.2 有详情数组）
  let score12DHtml = ''
  if (isV32) {
    const v32 = record as FengShuiHistoryRecordV32
    const topDims = v32.score12DDetails.slice(0, 6)
    score12DHtml = `
      <div class="section">
        <h3>📊 12 维评分</h3>
        <div class="dim-grid">
          ${topDims.map(dim => `
            <div class="dim-item">
              <span class="dim-name">${dim.name}</span>
              <span class="dim-score">${dim.score}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `
  }

  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>玄风门风水报告 - ${record.roomName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(180deg, #0A1A2F 0%, #071629 100%);
      color: #F5F1E8;
      min-height: 100vh;
      padding: 20px;
    }
    .report-container {
      max-width: 600px;
      margin: 0 auto;
      background: rgba(11, 31, 59, 0.85);
      border-radius: 16px;
      padding: 32px;
      border: 1px solid rgba(212, 175, 55, 0.2);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 48px;
      margin-bottom: 8px;
    }
    .title {
      font-size: 28px;
      color: #D4AF37;
      margin-bottom: 4px;
    }
    .subtitle {
      font-size: 14px;
      color: #6B7D94;
    }
    .room-info {
      text-align: center;
      margin-bottom: 24px;
    }
    .room-name {
      font-size: 20px;
      color: #F5F1E8;
      margin-bottom: 16px;
    }
    .score-display {
      text-align: center;
      padding: 24px;
      background: rgba(212, 175, 55, 0.08);
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .score-value {
      font-size: 72px;
      font-weight: bold;
      color: #E8C56A;
      line-height: 1;
    }
    .score-unit {
      font-size: 20px;
      color: #B8C4D6;
    }
    .score-level {
      margin-top: 8px;
      font-size: 16px;
      color: ${level.color};
    }
    .meta-row {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #6B7D94;
    }
    .section {
      margin-bottom: 24px;
    }
    .section h3 {
      font-size: 18px;
      color: #F5F1E8;
      margin-bottom: 12px;
      padding-left: 10px;
      border-left: 3px solid #D4AF37;
    }
    .issue-list {
      list-style: none;
    }
    .issue-item {
      padding: 12px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      margin-bottom: 8px;
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .issue-num {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #C46060;
      color: #fff;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .issue-text {
      font-size: 14px;
      line-height: 1.6;
      color: #B8C4D6;
    }
    .plan-list {
      list-style: none;
    }
    .plan-item {
      padding: 12px;
      background: rgba(107, 158, 122, 0.08);
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 14px;
      line-height: 1.6;
      color: #B8C4D6;
    }
    .dim-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .dim-item {
      padding: 10px;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      text-align: center;
    }
    .dim-name {
      display: block;
      font-size: 12px;
      color: #6B7D94;
      margin-bottom: 4px;
    }
    .dim-score {
      font-size: 20px;
      font-weight: bold;
      color: #D4AF37;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid rgba(212, 175, 55, 0.1);
      font-size: 12px;
      color: #6B7D94;
    }
    .footer-brand {
      color: #D4AF37;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header">
      <div class="logo">☯</div>
      <div class="title">玄风门</div>
      <div class="subtitle">风水勘测精简报告</div>
    </div>

    <div class="room-info">
      <div class="room-name">📍 ${record.roomName}</div>
    </div>

    <div class="score-display">
      <span class="score-value">${record.overallScore}</span>
      <span class="score-unit">分</span>
      <div class="score-level">${level.emoji} ${level.label}</div>
    </div>

    <div class="meta-row">
      <span>可信度 ${record.credibility.score} 分</span>
      ${isV32 ? `<span>${(record as FengShuiHistoryRecordV32).issueCount} 个问题</span>` : ''}
    </div>

    ${score12DHtml}

    ${topIssues.length > 0 ? `
    <div class="section">
      <h3>⚠️ 核心问题</h3>
      <ul class="issue-list">
        ${topIssues.map((issue, i) => `
          <li class="issue-item">
            <span class="issue-num">${i + 1}</span>
            <span class="issue-text">${issue}</span>
          </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${topPlans.length > 0 ? `
    <div class="section">
      <h3>💡 整改建议</h3>
      <ul class="plan-list">
        ${topPlans.map(plan => `
          <li class="plan-item">${plan}</li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <div class="footer">
      <div class="footer-brand">玄风门 · 让风水更科学</div>
      <div>本报告由玄风门自动生成 · xuanfengmen.com</div>
      <div style="margin-top: 4px;">生成时间：${new Date(record.createdAt).toLocaleString('zh-CN')}</div>
    </div>
  </div>
</body>
</html>
  `.trim()

  return html
}

// ═══════════════════════════════════════════════
// 四、下载分享海报
// ═══════════════════════════════════════════════

/**
 * 下载分享海报
 * 调用 generateShareImage 生成图片
 * 触发浏览器下载
 */
export async function downloadSharePoster(
  record: FengShuiHistoryRecordV31,
  options: ShareImageOptions & { filename?: string } = {}
): Promise<boolean> {
  try {
    const { filename, ...imgOptions } = options
    const dataUrl = await generateShareImage(record, imgOptions)

    const a = document.createElement('a')
    a.href = dataUrl
    a.download = filename || `玄风门风水报告_${record.roomName}_${Date.now()}.${imgOptions.format === 'png' ? 'png' : 'jpg'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    return true
  } catch (e) {
    console.error('分享海报下载失败：', e)
    return false
  }
}

// ═══════════════════════════════════════════════
// 五、分享辅助函数
// ═══════════════════════════════════════════════

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
    // 降级方案
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const result = document.execCommand('copy')
    document.body.removeChild(textarea)
    return result
  } catch {
    return false
  }
}

/**
 * 复制 HTML 报告到剪贴板
 */
export async function copyReportHtml(record: FengShuiHistoryRecordV31): Promise<boolean> {
  const html = generateShareReport(record)
  return copyToClipboard(html)
}

/**
 * 生成分享链接（占位实现，实际需后端支持）
 */
export function generateShareLink(record: FengShuiHistoryRecordV31): string {
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/share`
    : 'https://xuanfengmen.com/share'
  const params = new URLSearchParams({
    id: record.id,
    name: record.roomName,
    score: String(record.overallScore),
  })
  return `${baseUrl}?${params.toString()}`
}

/**
 * 使用 Web Share API 进行原生分享
 */
export async function nativeShare(
  record: FengShuiHistoryRecordV31,
  platform: SharePlatform = 'general'
): Promise<boolean> {
  if (!navigator.share) return false
  try {
    const text = generateShareText(record, platform)
    await navigator.share({
      title: `玄风门风水报告 - ${record.roomName}`,
      text,
      url: generateShareLink(record),
    })
    return true
  } catch {
    return false
  }
}
