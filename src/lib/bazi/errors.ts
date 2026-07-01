/**
 * 统一错误码
 * V4.8.1 Baseline
 */

export type BaziErrorCode =
  | 'BZ-001'
  | 'BZ-002'
  | 'BZ-003'
  | 'BZ-004'
  | 'BZ-005'
  | 'BZ-006'
  | 'BZ-007'
  | 'BZ-008'
  | 'BZ-009'
  | 'BZ-010'

export interface BaziError {
  code: BaziErrorCode
  message: string
  level: 'Error' | 'Warn'
  detail?: string
}

export const ERROR_CODES: Record<BaziErrorCode, Omit<BaziError, 'detail'>> = {
  'BZ-001': { code: 'BZ-001', message: '排盘失败（参数错误）', level: 'Error' },
  'BZ-002': { code: 'BZ-002', message: '节气数据不存在', level: 'Error' },
  'BZ-003': { code: 'BZ-003', message: '命例校验失败', level: 'Error' },
  'BZ-004': { code: 'BZ-004', message: 'Rule 不存在', level: 'Error' },
  'BZ-005': { code: 'BZ-005', message: 'Explain 失败', level: 'Error' },
  'BZ-006': { code: 'BZ-006', message: '配置无效', level: 'Warn' },
  'BZ-007': { code: 'BZ-007', message: '规则冲突未解决', level: 'Warn' },
  'BZ-008': { code: 'BZ-008', message: '命例不足（低于阈值）', level: 'Warn' },
  'BZ-009': { code: 'BZ-009', message: 'Benchmark 一致率低于阈值', level: 'Warn' },
  'BZ-010': { code: 'BZ-010', message: 'AI 调用失败（已降级）', level: 'Warn' },
}

export function createError(code: BaziErrorCode, detail?: string): BaziError {
  const base = ERROR_CODES[code]
  return { ...base, detail }
}
