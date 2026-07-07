/**
 * 命书导出工具
 * V3.0 商业版 - 封面/目录/章节编号/页眉页脚/分页
 */

import type { FullReportResult } from './fullReport'

interface BirthInfo {
  birthDate: string
  birthTime: string
  gender: 'male' | 'female'
}

/**
 * 生成中式命书封面 HTML
 */
function generateCoverHTML(report: FullReportResult, birthInfo?: BirthInfo): string {
  const genderText = birthInfo?.gender === 'male' ? '男命' : birthInfo?.gender === 'female' ? '女命' : ''
  const birthStr = birthInfo ? `${birthInfo.birthDate} ${birthInfo.birthTime}` : ''
  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`

  return `
<div class="cover-page">
  <div class="cover-border">
    <div class="cover-inner">
      <div class="cover-ornament-top">☯ ☯ ☯</div>
      <h1 class="cover-title">${report.title}</h1>
      <div class="cover-subtitle">${report.subtitle}</div>
      <div class="cover-divider">◈ ◇ ◈</div>
      ${birthStr ? `<div class="cover-info">出生：${birthStr}</div>` : ''}
      ${genderText ? `<div class="cover-info">性别：${genderText}</div>` : ''}
      <div class="cover-wordcount">全书共 ${report.wordCount.toLocaleString()} 字</div>
      <div class="cover-divider">◈ ◇ ◈</div>
      <div class="cover-date">玄风命理 · ${dateStr}</div>
      <div class="cover-ornament-bottom">☰ ☱ ☲ ☳ ☴ ☵ ☶ ☷</div>
    </div>
  </div>
</div>`
}

/**
 * 生成目录 HTML
 */
function generateTocHTML(report: FullReportResult): string {
  const items = report.chapters.map((ch, i) => {
    const num = i + 1
    const numStr = num < 10 ? `0${num}` : `${num}`
    return `<div class="toc-item"><span class="toc-num">${numStr}</span><span class="toc-title">${ch.title}</span><span class="toc-dots"></span></div>`
  }).join('\n')

  return `
<div class="toc-page">
  <h2 class="toc-heading">目　录</h2>
  <div class="toc-divider"></div>
  ${items}
</div>`
}

/**
 * 生成章节内容 HTML（含编号和分页）
 */
function generateChaptersHTML(report: FullReportResult): string {
  return report.chapters.map((chapter, idx) => {
    const num = idx + 1

    // 处理 markdown → HTML
    const contentHTML = chapter.content.split('\n').map(line => {
      if (line.startsWith('## ')) return `<h3 class="ch-section">${line.replace('## ', '')}</h3>`
      if (line.startsWith('### ')) return `<h4 class="ch-subsection">${line.replace('### ', '')}</h4>`
      if (line.startsWith('- ')) return `<li class="ch-list">${line.replace('- ', '')}</li>`
      if (line.startsWith('**') && line.endsWith('**')) return `<p class="ch-bold">${line.replace(/\*\*/g, '')}</p>`
      if (line.startsWith('|')) {
        if (line.includes('---')) return ''
        const cells = line.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('')
        return `<tr>${cells}</tr>`
      }
      if (line.trim() === '') return '<div class="ch-spacer"></div>'
      // 处理 **bold** inline
      const withBold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      return `<p class="ch-paragraph">${withBold}</p>`
    }).filter(l => l).join('\n')

    return `
<div class="chapter-page" data-chapter="${num}">
  <h2 class="chapter-heading">
    <span class="chapter-num">第${num}章</span>
    <span class="chapter-title">${chapter.title}</span>
  </h2>
  <div class="chapter-content">${contentHTML}</div>
</div>`
  }).join('\n\n<div class="page-break"></div>\n')
}

/**
 * 通用页面样式（Word + PDF 共用）
 */
function getBookStyles(): string {
  return `
@page {
  size: A4;
  margin: 25mm 20mm 30mm 20mm;
  @top-center {
    content: "玄风命理 · 八字命书";
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

/* ===== 封面 ===== */
.cover-page {
  page: cover;
  page-break-after: always;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
.cover-border {
  border: 3px double #D4AF37;
  padding: 60px 50px;
  text-align: center;
  max-width: 500px;
}
.cover-inner { padding: 20px 0; }
.cover-ornament-top {
  font-size: 16pt;
  color: #D4AF37;
  letter-spacing: 12px;
  margin-bottom: 40px;
}
.cover-title {
  font-size: 28pt;
  font-weight: bold;
  color: #8B4513;
  margin-bottom: 12px;
  letter-spacing: 6px;
}
.cover-subtitle {
  font-size: 13pt;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.8;
}
.cover-divider {
  font-size: 10pt;
  color: #D4AF37;
  letter-spacing: 8px;
  margin: 24px 0;
}
.cover-info {
  font-size: 11pt;
  color: #444;
  margin: 8px 0;
  letter-spacing: 2px;
}
.cover-wordcount {
  font-size: 10pt;
  color: #888;
  margin-top: 20px;
}
.cover-date {
  font-size: 10pt;
  color: #888;
  margin-top: 10px;
  letter-spacing: 2px;
}
.cover-ornament-bottom {
  font-size: 14pt;
  color: #D4AF37;
  letter-spacing: 10px;
  margin-top: 50px;
}

/* ===== 目录 ===== */
.toc-page {
  page-break-after: always;
  padding-top: 40px;
}
.toc-heading {
  text-align: center;
  font-size: 18pt;
  color: #8B4513;
  letter-spacing: 12px;
  margin-bottom: 8px;
}
.toc-divider {
  width: 120px;
  height: 2px;
  background: #D4AF37;
  margin: 0 auto 30px;
}
.toc-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dotted #ddd;
  font-size: 11pt;
}
.toc-num {
  color: #D4AF37;
  font-weight: bold;
  width: 36px;
  flex-shrink: 0;
}
.toc-title {
  flex: 1;
  color: #333;
}
.toc-dots {
  flex: 1;
  border-bottom: 1px dotted #ccc;
  margin-left: 8px;
  min-width: 40px;
}

/* ===== 章节正文 ===== */
.chapter-page {
  padding-top: 10px;
}
.chapter-heading {
  display: flex;
  align-items: baseline;
  gap: 12px;
  border-bottom: 2px solid #D4AF37;
  padding-bottom: 10px;
  margin-bottom: 20px;
}
.chapter-num {
  font-size: 10pt;
  color: #D4AF37;
  font-weight: bold;
  flex-shrink: 0;
}
.chapter-title {
  font-size: 15pt;
  color: #8B4513;
  font-weight: bold;
}
.chapter-content { margin-top: 8px; }
.ch-section {
  font-size: 13pt;
  color: #8B4513;
  margin: 20px 0 10px;
  padding-left: 4px;
  border-left: 3px solid #D4AF37;
  padding: 4px 0 4px 12px;
}
.ch-subsection {
  font-size: 11.5pt;
  color: #555;
  margin: 14px 0 8px;
}
.ch-paragraph {
  text-indent: 2em;
  margin: 6px 0;
  text-align: justify;
}
.ch-bold {
  font-weight: bold;
  text-indent: 0;
  margin: 10px 0;
  color: #8B4513;
}
.ch-list {
  text-indent: 2em;
  margin: 4px 0;
  list-style: none;
}
.ch-list::before {
  content: "• ";
  color: #D4AF37;
}
.ch-spacer { height: 8px; }
table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 10pt;
}
td, th {
  border: 1px solid #ddd;
  padding: 6px 10px;
  text-align: left;
}
tr:nth-child(even) { background: #faf8f5; }
th {
  background: #f5f0e8;
  color: #8B4513;
  font-weight: bold;
}

.page-break {
  page-break-before: always;
}
`
}

/**
 * 导出 Markdown（含封面+目录+章节编号）
 */
export function exportMarkdown(report: FullReportResult, birthInfo?: BirthInfo): void {
  const today = new Date()
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
  const genderText = birthInfo?.gender === 'male' ? '男命' : birthInfo?.gender === 'female' ? '女命' : ''
  const birthStr = birthInfo ? `${birthInfo.birthDate} ${birthInfo.birthTime}` : ''

  let md = ''
  // 封面
  md += `---\n`
  md += `title: "${report.title}"\n`
  md += `subtitle: "${report.subtitle}"\n`
  if (birthStr) md += `birth: "${birthStr}"\n`
  if (genderText) md += `gender: "${genderText}"\n`
  md += `date: "${dateStr}"\n`
  md += `words: "${report.wordCount.toLocaleString()}"\n`
  md += `generator: "玄风命理 V3.0"\n`
  md += `---\n\n`

  md += `# ${report.title}\n\n`
  md += `> ${report.subtitle}\n\n`
  md += `---\n\n`
  if (birthStr) md += `**出生**：${birthStr}  \n`
  if (genderText) md += `**性别**：${genderText}  \n`
  md += `**字数**：${report.wordCount.toLocaleString()}字  \n`
  md += `**生成日期**：${dateStr}\n\n`
  md += `---\n\n`

  // 目录
  md += `## 目录\n\n`
  report.chapters.forEach((ch, i) => {
    md += `${String(i + 1).padStart(2, ' ')}. ${ch.title}\n`
  })
  md += `\n---\n\n`

  // 章节
  report.chapters.forEach((chapter, idx) => {
    md += `## 第${idx + 1}章 ${chapter.title}\n\n`
    md += chapter.content
    md += `\n\n---\n\n`
  })

  // 页脚
  md += `*本文由「玄风命理 V3.0」生成，仅供娱乐参考。*\n`

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.title}.md`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 导出 Word（.doc via HTML Blob）
 * 含封面+目录+章节编号+页眉页脚
 */
export function exportWord(report: FullReportResult, birthInfo?: BirthInfo): void {
  const coverHTML = generateCoverHTML(report, birthInfo)
  const tocHTML = generateTocHTML(report)
  const chaptersHTML = generateChaptersHTML(report)
  const styles = getBookStyles()

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>${report.title}</title>
<style>${styles}
/* Word-specific: disable page counter since Word doesn't support @page content well */
@page { @top-center { content: none; } @bottom-center { content: none; } }
.word-header { text-align: center; font-size: 8pt; color: #999; border-bottom: 1px solid #eee; padding: 4px 0; margin-bottom: 20px; }
.word-footer { text-align: center; font-size: 8pt; color: #999; border-top: 1px solid #eee; padding: 4px 0; margin-top: 20px; }
</style>
</head>
<body>
${coverHTML}
${tocHTML}
<div class="word-header">玄风命理 · 八字命书</div>
${chaptersHTML}
<div class="word-footer">本文由「玄风命理 V3.0」生成，仅供娱乐参考</div>
</body></html>`

  const blob = new Blob(['\ufeff' + html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${report.title}.doc`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 导出 PDF（通过打开新窗口打印）
 * 含封面+目录+章节编号+页眉页脚+分页
 */
export function exportPdf(report: FullReportResult, birthInfo?: BirthInfo): void {
  const coverHTML = generateCoverHTML(report, birthInfo)
  const tocHTML = generateTocHTML(report)
  const chaptersHTML = generateChaptersHTML(report)
  const styles = getBookStyles()

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<title>${report.title}</title>
<style>${styles}</style>
</head>
<body>
${coverHTML}
${tocHTML}
${chaptersHTML}
</body></html>`

  const printWin = window.open('', '_blank')
  if (!printWin) return
  printWin.document.write(html)
  printWin.document.close()
  printWin.focus()
  // 等待样式和字体加载完毕
  setTimeout(() => {
    printWin.print()
  }, 500)
}
