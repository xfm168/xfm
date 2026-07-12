/**
 * 可访问性审计检查器（AuditChecker）
 *
 * 基于运行时 DOM 执行可访问性审计，覆盖：图片 alt 文本、按钮可访问名称、
 * 表单 label 关联、色彩对比度（基于内联样式与项目色板）、焦点可见性、
 * 键盘导航（tabindex）、heading 层级等检查项，并汇总为带评分的审计结果。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { PROJECT_COLORS } from './contrast'

/** 可访问性问题 */
export interface AccessibilityIssue {
  /** 问题类型 */
  type: string
  /** 涉及元素描述（标签 + 选择器片段） */
  element: string
  /** 问题描述 */
  description: string
  /** 严重程度 */
  severity: 'critical' | 'serious' | 'moderate' | 'minor'
  /** 修复建议 */
  recommendation: string
}

/** 可访问性审计结果 */
export interface AccessibilityAuditResult {
  /** 评分（0-100） */
  score: number
  /** 发现的问题列表 */
  issues: AccessibilityIssue[]
  /** 是否通过（score >= 80 且无 critical） */
  passed: boolean
}

/** 通过审计的分数阈值 */
const PASS_SCORE_THRESHOLD: number = 80

/** 严重程度扣分权重 */
const SEVERITY_PENALTY: Record<string, number> = {
  critical: 25,
  serious: 15,
  moderate: 8,
  minor: 3
}

/** 截断元素描述，避免过长 */
function describeElement(el: Element): string {
  const tag = el.tagName.toLowerCase()
  const id = el.getAttribute('id')
  const cls = el.getAttribute('class')
  let desc = tag
  if (id) {
    desc += '#' + id
  }
  if (cls) {
    desc += '.' + cls.trim().split(/\s+/).slice(0, 2).join('.')
  }
  if (desc.length > 60) {
    desc = desc.substring(0, 60) + '...'
  }
  return desc
}

/** 检查图片 alt 文本 */
function checkImages(root: HTMLElement | Document, issues: AccessibilityIssue[]): void {
  const imgs = root.querySelectorAll('img')
  for (let i = 0; i < imgs.length; i++) {
    const img = imgs[i]
    const alt = img.getAttribute('alt')
    if (alt === null) {
      issues.push({
        type: 'image-alt',
        element: describeElement(img),
        description: '图片缺少 alt 属性，屏幕阅读器无法获取替代文本。',
        severity: 'critical',
        recommendation: '为所有有意义的图片提供 alt 描述；装饰性图片使用 alt=""。'
      })
    } else if (alt === '' && !img.hasAttribute('role')) {
      // alt="" 视为装饰性图片，但若无 role 标记则提示确认
      // 仅当图片较大时提示
      if (img.offsetWidth > 50 && img.offsetHeight > 50) {
        issues.push({
          type: 'image-alt',
          element: describeElement(img),
          description: '较大图片的 alt 为空，需确认是否为装饰性图片。',
          severity: 'minor',
          recommendation: '若为装饰性图片可保留 alt=""；否则补充描述性 alt 文本。'
        })
      }
    }
  }
}

/** 检查按钮可访问名称 */
function checkButtons(root: HTMLElement | Document, issues: AccessibilityIssue[]): void {
  const buttons = root.querySelectorAll('button, [role="button"], a[href]')
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i]
    const ariaLabel = btn.getAttribute('aria-label')
    const ariaLabelledby = btn.getAttribute('aria-labelledby')
    const text = (btn.textContent || '').trim()
    const title = btn.getAttribute('title')
    const hasName = (ariaLabel && ariaLabel !== '') || (ariaLabelledby && ariaLabelledby !== '') || text !== '' || (title && title !== '')
    if (!hasName) {
      issues.push({
        type: 'button-name',
        element: describeElement(btn),
        description: '交互元素缺少可访问名称（文本、aria-label 或 title）。',
        severity: 'critical',
        recommendation: '为按钮/链接提供文本内容或 aria-label。'
      })
    }
  }
}

/** 检查表单 label 关联 */
function checkFormLabels(root: HTMLElement | Document, issues: AccessibilityIssue[]): void {
  const inputs = root.querySelectorAll('input, select, textarea')
  for (let i = 0; i < inputs.length; i++) {
    const el = inputs[i] as HTMLInputElement
    if (el.type === 'hidden' || el.type === 'submit' || el.type === 'button' || el.type === 'reset') {
      continue
    }
    const id = el.getAttribute('id')
    const ariaLabel = el.getAttribute('aria-label')
    const ariaLabelledby = el.getAttribute('aria-labelledby')
    const hasLabel =
      (id && root.querySelector('label[for="' + id + '"]') ? true : false) ||
      (ariaLabel ? true : false) ||
      (ariaLabelledby ? true : false) ||
      (el.closest('label') ? true : false)
    if (!hasLabel) {
      issues.push({
        type: 'form-label',
        element: describeElement(el),
        description: '表单控件未关联 label，屏幕阅读器无法识别其用途。',
        severity: 'serious',
        recommendation: '使用 <label for> 包裹或 aria-label 关联表单控件。'
      })
    }
  }
}

/** 检查 heading 层级 */
function checkHeadings(root: HTMLElement | Document, issues: AccessibilityIssue[]): void {
  const headings = root.querySelectorAll('h1, h2, h3, h4, h5, h6')
  let prevLevel = 0
  let h1Count = 0
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]
    const level = parseInt(h.tagName.substring(1), 10)
    if (level === 1) {
      h1Count++
    }
    if (prevLevel > 0 && level - prevLevel > 1) {
      issues.push({
        type: 'heading-order',
        element: describeElement(h),
        description: '标题层级跳跃：从 h' + String(prevLevel) + ' 直接跳到 h' + String(level) + '。',
        severity: 'moderate',
        recommendation: '标题层级应逐级递增，不要跳过中间层级。'
      })
    }
    prevLevel = level
  }
  if (h1Count > 1) {
    issues.push({
      type: 'heading-order',
      element: 'document',
      description: '页面存在 ' + String(h1Count) + ' 个 h1，应只有一个主标题。',
      severity: 'moderate',
      recommendation: '每个页面只保留一个 h1 作为主标题。'
    })
  }
}

/** 检查键盘导航（tabindex 正值） */
function checkKeyboardNav(root: HTMLElement | Document, issues: AccessibilityIssue[]): void {
  const tabbable = root.querySelectorAll('[tabindex]')
  for (let i = 0; i < tabbable.length; i++) {
    const el = tabbable[i] as HTMLElement
    const idx = parseInt(el.getAttribute('tabindex') || '0', 10)
    if (idx > 0) {
      issues.push({
        type: 'tabindex',
        element: describeElement(el),
        description: '使用 tabindex=' + String(idx) + '（大于 0）会破坏自然 Tab 顺序。',
        severity: 'moderate',
        recommendation: '避免使用正数 tabindex；如需自定义顺序，重构 DOM 结构。'
      })
    }
  }
}

/** 检查焦点可见性（内联 outline:none） */
function checkFocusVisibility(root: HTMLElement | Document, issues: AccessibilityIssue[]): void {
  const all = root.querySelectorAll<HTMLElement>('*')
  for (let i = 0; i < all.length; i++) {
    const el = all[i]
    const style = el.style
    if (!style) {
      continue
    }
    if (style.outline === 'none' || style.outlineWidth === '0') {
      const tag = el.tagName.toLowerCase()
      if (tag === 'a' || tag === 'button' || tag === 'input' || tag === 'select' || tag === 'textarea' || el.getAttribute('tabindex')) {
        issues.push({
          type: 'focus-visible',
          element: describeElement(el),
          description: '可聚焦元素设置了 outline:none，可能导致键盘焦点不可见。',
          severity: 'serious',
          recommendation: '移除 outline:none 或提供清晰的 :focus-visible 样式。'
        })
      }
    }
  }
}

/** 检查项目色板对比度（静态检查 PROJECT_COLORS 中不达标的组合） */
function checkColorContrast(issues: AccessibilityIssue[]): void {
  for (let i = 0; i < PROJECT_COLORS.length; i++) {
    const pair = PROJECT_COLORS[i]
    if (!pair.meetsAA) {
      issues.push({
        type: 'color-contrast',
        element: pair.foreground + ' on ' + pair.background,
        description: '颜色对「' + pair.name + '」对比度为 ' + String(pair.ratio) + ':1，不满足 AA（需 4.5:1）。',
        severity: pair.ratio < 3 ? 'critical' : 'serious',
        recommendation: '调整前景/背景色，使对比度至少达到 4.5:1（大号文本 3:1）。'
      })
    }
  }
}

/**
 * 执行可访问性审计
 *
 * 在浏览器环境下扫描 DOM（默认 document），并检查项目色板对比度，
 * 返回带评分的问题清单。
 *
 * @param root - DOM 根节点，默认 document
 * @returns 可访问性审计结果
 */
export function runAccessibilityAudit(root?: HTMLElement | Document): AccessibilityAuditResult {
  const issues: AccessibilityIssue[] = []

  // 色板对比度检查（不依赖 DOM）
  checkColorContrast(issues)

  // DOM 检查（仅浏览器环境）
  if (typeof document !== 'undefined') {
    const scope = root ? root : document
    checkImages(scope, issues)
    checkButtons(scope, issues)
    checkFormLabels(scope, issues)
    checkHeadings(scope, issues)
    checkKeyboardNav(scope, issues)
    checkFocusVisibility(scope, issues)
  }

  // 计算评分
  let score = 100
  let hasCritical = false
  for (let i = 0; i < issues.length; i++) {
    const sev = issues[i].severity
    const p = SEVERITY_PENALTY[sev] !== undefined ? SEVERITY_PENALTY[sev] : 0
    score -= p
    if (sev === 'critical') {
      hasCritical = true
    }
  }
  if (score < 0) {
    score = 0
  }
  score = Math.round(score)

  const passed = score >= PASS_SCORE_THRESHOLD && !hasCritical

  return {
    score: score,
    issues: issues,
    passed: passed
  }
}
