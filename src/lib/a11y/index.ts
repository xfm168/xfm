/**
 * 无障碍（Accessibility）统一导出
 *
 * 汇总导出 aria、keyboard、contrast、AuditChecker 模块的全部公开接口，
 * 便于外部统一引用。
 *
 * 所有字符串拼接使用单引号 + concatenation，禁止 backtick 模板字符串。
 */

// aria 模块导出
export {
  ariaLabel,
  ariaDescribedBy,
  ariaHidden,
  ariaExpanded,
  ariaSelected,
  ariaLive,
  roleButton,
  roleDialog,
  roleAlert,
  roleTab
} from './aria'

// keyboard 模块导出
export {
  isEnter,
  isSpace,
  isEscape,
  isTab,
  isShiftTab,
  isArrowUp,
  isArrowDown,
  isArrowLeft,
  isArrowRight,
  trapFocus,
  getFocusableElements
} from './keyboard'

// contrast 模块导出
export {
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  meetsAA,
  meetsAAA,
  PROJECT_COLORS
} from './contrast'
export type { Rgb, ColorPair } from './contrast'

// AuditChecker 模块导出
export { runAccessibilityAudit } from './AuditChecker'
export type { AccessibilityIssue, AccessibilityAuditResult } from './AuditChecker'
