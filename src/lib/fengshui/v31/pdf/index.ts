/**
 * 玄风门 V3.1 PDF 报告生成接口
 *
 * 基于 jspdf + html2canvas 风格接口的浏览器端 PDF 生成器。
 * 当前为占位实现，使用 DOM + Canvas 方式构建 PDF 数据流。
 */

import type {
  PDFReportConfig,
  ProfessionalReportV31,
  ImageAnnotation,
  DimensionScore,
  ScoreDimension12D,
} from '../types'

// ═══════════════════════════════════════════════
// 主入口：生成 PDF 报告
// ═══════════════════════════════════════════════

/**
 * 生成 PDF 报告
 * @param config PDF 配置（封面、选项等）
 * @param report V3.1 专业报告数据
 * @param annotations 图片标注数据
 * @returns PDF Data URL（base64）
 */
export async function generatePDFReport(
  config: PDFReportConfig,
  report: ProfessionalReportV31,
  annotations: ImageAnnotation[]
): Promise<string> {
  const container = createPrintContainer()

  try {
    // 1. 封面
    renderCoverPage(container, config)

    // 2. 综合评分页
    renderScorePage(container, report.score12D)

    // 3. 12维雷达图占位页
    if (config.includeRadarChart) {
      renderRadarChartPage(container, report.score12D)
    }

    // 4. 标注图片页
    if (config.includeAnnotations && annotations.length > 0) {
      renderAnnotationPage(container, annotations)
    }

    // 5. 详细报告页（6大分析）
    renderDetailedAnalysisPage(container, report)

    // 6. 整改方案页
    renderRemediationPage(container, report.remediationPlans)

    // 7. 经典理论页
    if (config.includeClassical) {
      renderClassicalPage(container, report.classicalInterpretation)
    }

    // 8. 结论页
    renderConclusionPage(container, report)

    // 使用 html2canvas 风格截图生成（占位：实际使用 DOM-to-Canvas）
    const dataUrl = await renderContainerToPDF(container)
    return dataUrl
  } finally {
    cleanupContainer(container)
  }
}

// ═══════════════════════════════════════════════
// 页面渲染器
// ═══════════════════════════════════════════════

function createPrintContainer(): HTMLElement {
  const div = document.createElement('div')
  div.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    background: #fff;
    font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif;
    color: #1a1a1a;
    line-height: 1.6;
  `
  document.body.appendChild(div)
  return div
}

function cleanupContainer(container: HTMLElement): void {
  if (container.parentNode) {
    container.parentNode.removeChild(container)
  }
}

/**
 * 封面页：标题 / 副标题 / 日期
 */
function renderCoverPage(container: HTMLElement, config: PDFReportConfig): void {
  const page = document.createElement('div')
  page.className = 'pdf-page pdf-cover'
  page.style.cssText = pageStyle + `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
    color: #fff;
  `

  const now = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  page.innerHTML = `
    <div style="margin-bottom: 40px;">
      ${config.logo ? `<img src="${config.logo}" style="width: 120px; height: auto;" />` : '<div style="font-size: 64px; font-weight: bold;">玄</div>'}
    </div>
    <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 16px 0; letter-spacing: 4px;">${escapeHtml(config.title)}</h1>
    <h2 style="font-size: 20px; font-weight: normal; margin: 0 0 40px 0; opacity: 0.9;">${escapeHtml(config.subtitle)}</h2>
    <div style="font-size: 14px; opacity: 0.7;">生成日期：${now}</div>
    <div style="font-size: 12px; opacity: 0.5; margin-top: 80px;">玄风门智能风水分析系统 V3.1</div>
  `

  container.appendChild(page)
}

/**
 * 综合评分页
 */
function renderScorePage(container: HTMLElement, score12D: ProfessionalReportV31['score12D']): void {
  const page = createStandardPage('综合评分')

  let html = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 56px; font-weight: bold; color: #1a365d;">${score12D.overall}</div>
      <div style="font-size: 18px; color: #666; margin-top: 8px;">综合评分 / 100</div>
      <div style="font-size: 16px; color: #2c5282; margin-top: 8px;">评级：${score12D.level}</div>
    </div>
    <div style="font-size: 14px; color: #333; text-align: center; margin-bottom: 24px;">${escapeHtml(score12D.summary)}</div>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <thead>
        <tr style="background: #edf2f7;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">维度</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e0;">评分</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e0;">等级</th>
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">说明</th>
        </tr>
      </thead>
      <tbody>
  `

  const dims = Object.values(score12D.dimensions) as DimensionScore[]
  for (const dim of dims) {
    const color = dim.score >= 80 ? '#276749' : dim.score >= 60 ? '#c05621' : '#c53030'
    html += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${escapeHtml(dim.name)}</td>
        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: ${color};">${dim.score}</td>
        <td style="padding: 10px; text-align: center; border-bottom: 1px solid #e2e8f0;">${escapeHtml(dim.level)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #666;">${escapeHtml(dim.description)}</td>
      </tr>
    `
  }

  html += '</tbody></table>'
  page.innerHTML = html
  container.appendChild(page)
}

/**
 * 12维雷达图占位页
 */
function renderRadarChartPage(container: HTMLElement, score12D: ProfessionalReportV31['score12D']): void {
  const page = createStandardPage('12维雷达图分析')

  const dims = Object.values(score12D.dimensions) as DimensionScore[]
  const canvasSize = 400
  const center = canvasSize / 2
  const radius = 150
  const angleStep = (Math.PI * 2) / dims.length

  // 使用 SVG 绘制雷达图（便于 html2canvas 捕获）
  let svgPoints = ''
  let labels = ''

  for (let i = 0; i < dims.length; i++) {
    const angle = i * angleStep - Math.PI / 2
    const value = dims[i].score / 100
    const x = center + radius * value * Math.cos(angle)
    const y = center + radius * value * Math.sin(angle)
    svgPoints += `${x},${y} `

    const labelRadius = radius + 24
    const lx = center + labelRadius * Math.cos(angle)
    const ly = center + labelRadius * Math.sin(angle)
    const anchor = lx > center ? 'start' : lx < center ? 'end' : 'middle'
    labels += `<text x="${lx}" y="${ly}" text-anchor="${anchor}" font-size="12" fill="#4a5568">${escapeHtml(dims[i].name)}</text>`
  }

  // 绘制网格圆
  let gridCircles = ''
  for (let i = 1; i <= 5; i++) {
    const r = (radius / 5) * i
    gridCircles += `<circle cx="${center}" cy="${center}" r="${r}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`
  }

  const svg = `
    <div style="text-align: center;">
      <svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" style="margin: 0 auto; display: block;">
        ${gridCircles}
        <polygon points="${svgPoints.trim()}" fill="rgba(44, 82, 130, 0.2)" stroke="#2c5282" stroke-width="2"/>
        ${labels}
      </svg>
      <p style="font-size: 12px; color: #999; margin-top: 16px;">注：此雷达图基于 12 维评分体系自动生成</p>
    </div>
  `

  page.innerHTML = svg
  container.appendChild(page)
}

/**
 * 标注图片页
 */
function renderAnnotationPage(container: HTMLElement, annotations: ImageAnnotation[]): void {
  const page = createStandardPage('空间标注分析')

  let html = `<div style="font-size: 14px; margin-bottom: 16px;">共识别 ${annotations.length} 处标注：</div>`

  for (const ann of annotations) {
    const colorMap: Record<string, string> = {
      problem: '#c53030',
      risk: '#c05621',
      suggestion: '#2c5282',
      wealth: '#276749',
      health: '#38a169',
      career: '#744210',
    }
    const color = colorMap[ann.type] ?? '#4a5568'

    html += `
      <div style="border-left: 4px solid ${color}; padding: 12px 16px; margin-bottom: 12px; background: #f7fafc;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px; color: ${color};">
          [${escapeHtml(ann.type)}] ${escapeHtml(ann.label)}
        </div>
        <div style="font-size: 13px; color: #333; margin-bottom: 4px;">${escapeHtml(ann.suggestion)}</div>
        <div style="font-size: 12px; color: #999;">
          严重等级：${ann.severity} | 规则：${ann.ruleId}
        </div>
      </div>
    `
  }

  page.innerHTML = html
  container.appendChild(page)
}

/**
 * 详细报告页（6大分析）
 */
function renderDetailedAnalysisPage(container: HTMLElement, report: ProfessionalReportV31): void {
  const analyses = [
    { title: '格局分析', data: report.patternAnalysis },
    { title: '藏风聚气分析', data: report.windQiAnalysis },
    { title: '财位分析', data: report.wealthAnalysis },
    { title: '健康影响分析', data: report.healthAnalysis },
    { title: '事业影响分析', data: report.careerAnalysis },
    { title: '家庭关系分析', data: report.familyAnalysis },
  ]

  for (const item of analyses) {
    const page = createStandardPage(item.title)
    let html = ''

    if (item.title === '格局分析') {
      const d = item.data as ProfessionalReportV31['patternAnalysis']
      html = `
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 16px; color: #1a365d; margin-bottom: 8px;">格局描述</h3>
          <p style="font-size: 13px; color: #333; line-height: 1.8;">${escapeHtml(d.description)}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 16px; color: #1a365d; margin-bottom: 8px;">风水原理</h3>
          <p style="font-size: 13px; color: #333; line-height: 1.8;">${escapeHtml(d.principle)}</p>
        </div>
        <div style="margin-bottom: 16px;">
          <h3 style="font-size: 16px; color: #1a365d; margin-bottom: 8px;">通俗解释</h3>
          <p style="font-size: 13px; color: #333; line-height: 1.8;">${escapeHtml(d.explanation)}</p>
        </div>
        ${d.strength.length > 0 ? `<div style="margin-bottom: 8px;"><strong>优势：</strong>${d.strength.map(s => escapeHtml(s)).join('、')}</div>` : ''}
        ${d.weakness.length > 0 ? `<div><strong>不足：</strong>${d.weakness.map(s => escapeHtml(s)).join('、')}</div>` : ''}
      `
    } else if (item.title === '藏风聚气分析') {
      const d = item.data as ProfessionalReportV31['windQiAnalysis']
      html = `
        <p style="font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.8;">${escapeHtml(d.description)}</p>
        <div style="margin-bottom: 8px;"><strong>气流状况：</strong>${escapeHtml(d.qiFlow)}</div>
        <div style="margin-bottom: 16px;"><strong>藏风效果：</strong>${escapeHtml(d.windGathering)}</div>
        ${d.suggestions.length > 0 ? `<div style="background: #f0fff4; padding: 12px; border-radius: 4px;"><strong>建议：</strong><ul>${d.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></div>` : ''}
      `
    } else if (item.title === '财位分析') {
      const d = item.data as ProfessionalReportV31['wealthAnalysis']
      html = `
        <p style="font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.8;">${escapeHtml(d.description)}</p>
        ${d.wealthPositions.length > 0 ? `<div style="margin-bottom: 16px;"><strong>财位分布：</strong></div>` + d.wealthPositions.map(p => `
          <div style="border: 1px solid #e2e8f0; padding: 10px; margin-bottom: 8px; border-radius: 4px;">
            <div style="font-weight: bold;">${escapeHtml(p.name)} (${escapeHtml(p.location)})</div>
            <div style="font-size: 12px; color: #666;">状态：${p.status === 'good' ? '良好' : p.status === 'average' ? '一般' : '需改善'}</div>
            <div style="font-size: 12px; color: #666;">建议：${escapeHtml(p.suggestion)}</div>
          </div>
        `).join('') : '<div style="color: #999;">未检测到特殊财位信息</div>'}
        ${d.suggestions.length > 0 ? `<div style="background: #fffaf0; padding: 12px; border-radius: 4px;"><strong>财运建议：</strong><ul>${d.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></div>` : ''}
      `
    } else if (item.title === '健康影响分析') {
      const d = item.data as ProfessionalReportV31['healthAnalysis']
      html = `
        <p style="font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.8;">${escapeHtml(d.description)}</p>
        ${d.healthFactors.length > 0 ? `<div style="margin-bottom: 8px;"><strong>健康影响因素：</strong>${d.healthFactors.map(f => escapeHtml(f)).join('、')}</div>` : ''}
        ${d.riskAreas.length > 0 ? `<div style="margin-bottom: 16px;"><strong style="color: #c53030;">风险区域：</strong>${d.riskAreas.map(f => escapeHtml(f)).join('、')}</div>` : ''}
        ${d.suggestions.length > 0 ? `<div style="background: #fff5f5; padding: 12px; border-radius: 4px;"><strong>健康建议：</strong><ul>${d.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></div>` : ''}
      `
    } else if (item.title === '事业影响分析') {
      const d = item.data as ProfessionalReportV31['careerAnalysis']
      html = `
        <p style="font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.8;">${escapeHtml(d.description)}</p>
        ${d.careerFactors.length > 0 ? `<div style="margin-bottom: 8px;"><strong>事业影响因素：</strong>${d.careerFactors.map(f => escapeHtml(f)).join('、')}</div>` : ''}
        ${d.opportunities.length > 0 ? `<div style="margin-bottom: 8px;"><strong style="color: #276749;">机遇：</strong>${d.opportunities.map(f => escapeHtml(f)).join('、')}</div>` : ''}
        ${d.obstacles.length > 0 ? `<div style="margin-bottom: 16px;"><strong style="color: #c53030;">障碍：</strong>${d.obstacles.map(f => escapeHtml(f)).join('、')}</div>` : ''}
        ${d.suggestions.length > 0 ? `<div style="background: #ebf8ff; padding: 12px; border-radius: 4px;"><strong>事业建议：</strong><ul>${d.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></div>` : ''}
      `
    } else if (item.title === '家庭关系分析') {
      const d = item.data as ProfessionalReportV31['familyAnalysis']
      html = `
        <p style="font-size: 13px; color: #333; margin-bottom: 12px; line-height: 1.8;">${escapeHtml(d.description)}</p>
        ${d.harmonyFactors.length > 0 ? `<div style="margin-bottom: 8px;"><strong style="color: #276749;">和谐因素：</strong>${d.harmonyFactors.map(f => escapeHtml(f)).join('、')}</div>` : ''}
        ${d.tensionAreas.length > 0 ? `<div style="margin-bottom: 16px;"><strong style="color: #c53030;">紧张区域：</strong>${d.tensionAreas.map(f => escapeHtml(f)).join('、')}</div>` : ''}
        ${d.suggestions.length > 0 ? `<div style="background: #faf5ff; padding: 12px; border-radius: 4px;"><strong>家庭建议：</strong><ul>${d.suggestions.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul></div>` : ''}
      `
    }

    page.innerHTML = html
    container.appendChild(page)
  }
}

/**
 * 整改方案页
 */
function renderRemediationPage(container: HTMLElement, plans: ProfessionalReportV31['remediationPlans']): void {
  const page = createStandardPage('整改方案')

  if (plans.length === 0) {
    page.innerHTML = '<div style="text-align: center; color: #999; padding: 40px;">未生成整改方案</div>'
    container.appendChild(page)
    return
  }

  let html = `<div style="font-size: 14px; margin-bottom: 16px;">共 ${plans.length} 项整改方案，按优先级排序：</div>`

  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i]
    const urgencyColor = plan.urgency === 'immediate' ? '#c53030' : plan.urgency === 'shortTerm' ? '#c05621' : plan.urgency === 'longTerm' ? '#744210' : '#718096'
    const urgencyText = plan.urgency === 'immediate' ? '立即执行' : plan.urgency === 'shortTerm' ? '短期执行' : plan.urgency === 'longTerm' ? '长期规划' : '可选优化'

    html += `
      <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <div style="font-weight: bold; font-size: 15px; color: #1a365d;">${i + 1}. ${escapeHtml(plan.issue)}</div>
          <div style="font-size: 12px; color: ${urgencyColor}; border: 1px solid ${urgencyColor}; padding: 2px 8px; border-radius: 4px;">${urgencyText}</div>
        </div>
        <div style="font-size: 13px; color: #333; margin-bottom: 8px;"><strong>原因：</strong>${escapeHtml(plan.cause)}</div>
        <div style="font-size: 13px; color: #333; margin-bottom: 8px;"><strong>方案：</strong>${escapeHtml(plan.solution.summary)}</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
          步骤：${plan.solution.steps.map((s, idx) => `${idx + 1}. ${escapeHtml(s)}`).join(' ')}
        </div>
        <div style="display: flex; gap: 16px; font-size: 12px; color: #666;">
          <span>难度：${'★'.repeat(plan.difficulty)}${'☆'.repeat(5 - plan.difficulty)}</span>
          <span>成本：${plan.cost === 'free' ? '免费' : plan.cost === 'low' ? '低' : plan.cost === 'medium' ? '中' : plan.cost === 'high' ? '高' : '很高'}</span>
          <span>耗时：${escapeHtml(plan.solution.timeRequired)}</span>
          <span>DIY：${plan.solution.diyPossible ? '可自行整改' : '建议请专业人士'}</span>
        </div>
        <div style="font-size: 12px; color: #38a169; margin-top: 8px;"><strong>预计效果：</strong>${escapeHtml(plan.expectedEffect)}</div>
        ${plan.solution.cautions.length > 0 ? `<div style="font-size: 12px; color: #c05621; margin-top: 8px;"><strong>注意：</strong>${plan.solution.cautions.map(c => escapeHtml(c)).join('；')}</div>` : ''}
      </div>
    `
  }

  page.innerHTML = html
  container.appendChild(page)
}

/**
 * 经典理论页
 */
function renderClassicalPage(
  container: HTMLElement,
  interpretation: ProfessionalReportV31['classicalInterpretation']
): void {
  const page = createStandardPage('经典理论依据')

  let html = ''

  if (interpretation.theories.length === 0) {
    html = '<div style="text-align: center; color: #999; padding: 40px;">本报告未引用特定经典理论条目</div>'
  } else {
    html = `<div style="font-size: 14px; margin-bottom: 16px;">本报告依据以下经典理论进行分析：</div>`

    for (const theory of interpretation.theories) {
      html += `
        <div style="border-left: 3px solid #744210; padding: 12px 16px; margin-bottom: 16px; background: #fffaf0;">
          <div style="font-weight: bold; font-size: 14px; color: #744210; margin-bottom: 6px;">${escapeHtml(theory.name)}</div>
          <div style="font-size: 12px; color: #999; margin-bottom: 6px;">出处：${escapeHtml(theory.source)}</div>
          <div style="font-size: 13px; color: #333; margin-bottom: 8px; line-height: 1.7;">${escapeHtml(theory.content)}</div>
          <div style="font-size: 12px; color: #666;"><strong>应用：</strong>${escapeHtml(theory.application)}</div>
        </div>
      `
    }
  }

  if (interpretation.summary) {
    html += `
      <div style="margin-top: 24px; padding: 16px; background: #f7fafc; border-radius: 4px;">
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: #1a365d;">理论总结</div>
        <div style="font-size: 13px; color: #333; line-height: 1.7;">${escapeHtml(interpretation.summary)}</div>
      </div>
    `
  }

  page.innerHTML = html
  container.appendChild(page)
}

/**
 * 结论页
 */
function renderConclusionPage(container: HTMLElement, report: ProfessionalReportV31): void {
  const page = createStandardPage('结论与总结')

  page.innerHTML = `
    <div style="font-size: 15px; line-height: 1.8; color: #333; margin-bottom: 24px;">
      ${escapeHtml(report.summary)}
    </div>
    <div style="border-top: 1px solid #e2e8f0; padding-top: 24px;">
      <div style="font-size: 14px; font-weight: bold; color: #1a365d; margin-bottom: 12px;">分析可信度</div>
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
        <div style="font-size: 32px; font-weight: bold; color: #2c5282;">${report.credibility.score}</div>
        <div>
          <div style="font-size: 14px; color: #333;">等级：${report.credibility.level === 'veryHigh' ? '极高' : report.credibility.level === 'high' ? '高' : report.credibility.level === 'medium' ? '中' : report.credibility.level === 'low' ? '低' : '极低'}</div>
          <div style="font-size: 12px; color: #666;">${escapeHtml(report.credibility.explanation)}</div>
        </div>
      </div>
    </div>
    <div style="margin-top: 32px; text-align: center; color: #999; font-size: 12px;">
      <div>本报告由玄风门智能风水分析系统 V3.1 自动生成</div>
      <div>仅供参考，重大决策请咨询专业风水师</div>
    </div>
  `

  container.appendChild(page)
}

// ═══════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════

const pageStyle = `
  width: 794px;
  min-height: 1123px;
  padding: 48px 56px;
  box-sizing: border-box;
  page-break-after: always;
  background: #fff;
`

function createStandardPage(title: string): HTMLElement {
  const page = document.createElement('div')
  page.className = 'pdf-page'
  page.style.cssText = pageStyle

  const header = document.createElement('div')
  header.style.cssText = 'border-bottom: 2px solid #1a365d; padding-bottom: 12px; margin-bottom: 24px;'
  header.innerHTML = `<div style="font-size: 18px; font-weight: bold; color: #1a365d;">${escapeHtml(title)}</div>`
  page.appendChild(header)

  const body = document.createElement('div')
  body.className = 'pdf-page-body'
  page.appendChild(body)

  // 重定向 innerHTML 到 body
  const originalSet = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML')
  Object.defineProperty(page, 'innerHTML', {
    set(value: string) {
      header.innerHTML = `<div style="font-size: 18px; font-weight: bold; color: #1a365d;">${escapeHtml(title)}</div>`
      body.innerHTML = value
    },
    get() {
      return page.innerHTML
    },
    configurable: true,
  })

  return page
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// ═══════════════════════════════════════════════
// DOM-to-Canvas / PDF 渲染核心（占位实现）
// ═══════════════════════════════════════════════

/**
 * 将打印容器渲染为 PDF Data URL
 * 占位实现：使用 window.print() 风格或 html2canvas 截图
 */
async function renderContainerToPDF(container: HTMLElement): Promise<string> {
  // 策略一：优先尝试 html2canvas + jsPDF（若库已加载）
  if (typeof (window as any).html2canvas === 'function' && typeof (window as any).jspdf?.jsPDF === 'function') {
    return renderWithHtml2Canvas(container)
  }

  // 策略二：降级为打印样式 Data URL（浏览器打印对话框）
  return renderWithPrintMedia(container)
}

async function renderWithHtml2Canvas(container: HTMLElement): Promise<string> {
  const html2canvas = (window as any).html2canvas as (el: HTMLElement, opts?: object) => Promise<HTMLCanvasElement>
  const { jsPDF } = (window as any).jspdf as { jsPDF: new (o: object) => any }

  const pages = container.querySelectorAll('.pdf-page')
  const pdf = new jsPDF({ unit: 'px', format: 'a4', orientation: 'portrait' })

  for (let i = 0; i < pages.length; i++) {
    const pageEl = pages[i] as HTMLElement
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      logging: false,
    })
    const imgData = canvas.toDataURL('image/png')
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width

    if (i > 0) pdf.addPage()
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  }

  return pdf.output('datauristring')
}

async function renderWithPrintMedia(container: HTMLElement): Promise<string> {
  // 创建一个带有打印样式的独立 iframe，返回其 document 的 data URL 占位
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>玄风门风水报告</title>
      <style>
        @page { size: A4; margin: 0; }
        body { margin: 0; font-family: "Noto Sans SC", "Microsoft YaHei", sans-serif; }
        .pdf-page { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; page-break-after: always; background: #fff; }
        .pdf-page:last-child { page-break-after: auto; }
      </style>
    </head>
    <body>
      ${container.innerHTML}
    </body>
    </html>
  `
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  return URL.createObjectURL(blob)
}

// ═══════════════════════════════════════════════
// 下载工具
// ═══════════════════════════════════════════════

/**
 * 下载 PDF 文件
 * @param dataUrl PDF Data URL 或 Blob URL
 * @param filename 文件名
 */
export function downloadPDF(dataUrl: string, filename?: string): void {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename || `xuanfeng_fengshui_report_${Date.now()}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
