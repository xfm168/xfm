/**
 * ARIA 属性工具
 *
 * 提供一组生成 ARIA 属性对象的辅助函数，便于在组件中为交互元素、
 * 对话框、告警、选项卡等补充无障碍语义。返回的对象可直接展开到 JSX 元素上。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

import { AriaAttributes } from 'react'

/**
 * 生成 aria-label 属性
 *
 * @param text - 标签文本
 * @returns { 'aria-label': text }
 */
export function ariaLabel(text: string): Pick<AriaAttributes, 'aria-label'> {
  return { 'aria-label': text }
}

/**
 * 生成 aria-describedby 属性
 *
 * @param id - 描述元素的 id
 * @returns { 'aria-describedby': id }
 */
export function ariaDescribedBy(id: string): Pick<AriaAttributes, 'aria-describedby'> {
  return { 'aria-describedby': id }
}

/**
 * 生成 aria-hidden 属性
 *
 * @param hidden - 是否对辅助技术隐藏
 * @returns { 'aria-hidden': hidden }
 */
export function ariaHidden(hidden: boolean): Pick<AriaAttributes, 'aria-hidden'> {
  return { 'aria-hidden': hidden }
}

/**
 * 生成 aria-expanded 属性
 *
 * @param expanded - 展开/折叠状态
 * @returns { 'aria-expanded': expanded }
 */
export function ariaExpanded(expanded: boolean): Pick<AriaAttributes, 'aria-expanded'> {
  return { 'aria-expanded': expanded }
}

/**
 * 生成 aria-selected 属性
 *
 * @param selected - 选中状态
 * @returns { 'aria-selected': selected }
 */
export function ariaSelected(selected: boolean): Pick<AriaAttributes, 'aria-selected'> {
  return { 'aria-selected': selected }
}

/**
 * 生成 aria-live 属性
 *
 * @param live - 'polite' | 'assertive'
 * @returns { 'aria-live': live }
 */
export function ariaLive(live: 'polite' | 'assertive'): Pick<AriaAttributes, 'aria-live'> {
  return { 'aria-live': live }
}

/**
 * 生成 button 角色
 *
 * @returns { role: 'button' }
 */
export function roleButton(): { role: 'button' } {
  return { role: 'button' }
}

/**
 * 生成 dialog 角色
 *
 * @returns { role: 'dialog' }
 */
export function roleDialog(): { role: 'dialog' } {
  return { role: 'dialog' }
}

/**
 * 生成 alert 角色
 *
 * @returns { role: 'alert' }
 */
export function roleAlert(): { role: 'alert' } {
  return { role: 'alert' }
}

/**
 * 生成 tab 角色（含位置信息）
 *
 * @param index - 当前 tab 在集合中的位置（从 1 开始）
 * @param total - 集合中 tab 总数
 * @returns { role: 'tab', 'aria-posinset': index, 'aria-setsize': total }
 */
export function roleTab(
  index: number,
  total: number
): { role: 'tab'; 'aria-posinset': number; 'aria-setsize': number } {
  return {
    role: 'tab',
    'aria-posinset': index,
    'aria-setsize': total
  }
}
