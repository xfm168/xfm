/**
 * 键盘事件工具
 *
 * 提供键盘按键判断函数（Enter、Space、Escape、Tab、方向键等），
 * 以及模态框焦点陷阱（trapFocus）与可聚焦元素查询（getFocusableElements）。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

/** 可聚焦元素的选择器 */
const FOCUSABLE_SELECTOR: string =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), ' +
  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), ' +
  'audio[controls], video[controls], [contenteditable]:not([contenteditable="false"])'

/**
 * 判断是否为 Enter 键
 *
 * @param e - 键盘事件
 */
export function isEnter(e: KeyboardEvent): boolean {
  return e.key === 'Enter' || e.keyCode === 13
}

/**
 * 判断是否为 Space 键
 *
 * @param e - 键盘事件
 */
export function isSpace(e: KeyboardEvent): boolean {
  return e.key === ' ' || e.key === 'Spacebar' || e.keyCode === 32
}

/**
 * 判断是否为 Escape 键
 *
 * @param e - 键盘事件
 */
export function isEscape(e: KeyboardEvent): boolean {
  return e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27
}

/**
 * 判断是否为 Tab 键
 *
 * @param e - 键盘事件
 */
export function isTab(e: KeyboardEvent): boolean {
  return e.key === 'Tab' || e.keyCode === 9
}

/**
 * 判断是否为 Shift + Tab 组合键
 *
 * @param e - 键盘事件
 */
export function isShiftTab(e: KeyboardEvent): boolean {
  return isTab(e) && e.shiftKey
}

/**
 * 判断是否为方向键 上
 *
 * @param e - 键盘事件
 */
export function isArrowUp(e: KeyboardEvent): boolean {
  return e.key === 'ArrowUp' || e.key === 'Up' || e.keyCode === 38
}

/**
 * 判断是否为方向键 下
 *
 * @param e - 键盘事件
 */
export function isArrowDown(e: KeyboardEvent): boolean {
  return e.key === 'ArrowDown' || e.key === 'Down' || e.keyCode === 40
}

/**
 * 判断是否为方向键 左
 *
 * @param e - 键盘事件
 */
export function isArrowLeft(e: KeyboardEvent): boolean {
  return e.key === 'ArrowLeft' || e.key === 'Left' || e.keyCode === 37
}

/**
 * 判断是否为方向键 右
 *
 * @param e - 键盘事件
 */
export function isArrowRight(e: KeyboardEvent): boolean {
  return e.key === 'ArrowRight' || e.key === 'Right' || e.keyCode === 39
}

/**
 * 获取容器内所有可聚焦元素（按 DOM 顺序）
 *
 * @param container - 容器元素
 * @returns 可聚焦元素数组（已过滤不可见元素）
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  if (!container) {
    return []
  }
  const nodes = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  const result: HTMLElement[] = []
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i]
    // 过滤不可见元素
    if (el.offsetWidth === 0 && el.offsetHeight === 0) {
      continue
    }
    result.push(el)
  }
  return result
}

/**
 * 模态框焦点陷阱
 *
 * 在指定容器内捕获 Tab/Shift+Tab，使焦点在容器内的可聚焦元素间循环，
 * 不会跳出容器。返回一个取消监听的清理函数。
 *
 * @param container - 模态框容器元素
 * @returns 取消焦点陷阱的清理函数
 */
export function trapFocus(container: HTMLElement): () => void {
  function handleKeydown(e: KeyboardEvent): void {
    if (!isTab(e)) {
      return
    }
    const focusable = getFocusableElements(container)
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    if (e.shiftKey) {
      // Shift + Tab：从第一个跳到最后一个
      if (active === first || !container.contains(active)) {
        e.preventDefault()
        last.focus()
      }
    } else {
      // Tab：从最后一个跳到第一个
      if (active === last || !container.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  container.addEventListener('keydown', handleKeydown)

  // 进入时自动聚焦第一个可聚焦元素
  const focusable = getFocusableElements(container)
  if (focusable.length > 0) {
    focusable[0].focus()
  }

  return function cleanup(): void {
    container.removeEventListener('keydown', handleKeydown)
  }
}
