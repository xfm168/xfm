export interface SpacingToken {
  value: string
  pixel: number
  description: string
}

export type SpacingScale =
  | '1' | '2' | '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16' | '20' | '24' | '32'

export interface SpacingPalette {
  [key: string]: SpacingToken
}

export const spacing: SpacingPalette = {
  '1': { value: '0.25rem', pixel: 4, description: '极小间距' },
  '2': { value: '0.5rem', pixel: 8, description: '小间距' },
  '3': { value: '0.75rem', pixel: 12, description: '中等间距' },
  '4': { value: '1rem', pixel: 16, description: '标准间距' },
  '5': { value: '1.25rem', pixel: 20, description: '较大间距' },
  '6': { value: '1.5rem', pixel: 24, description: '区块内边距' },
  '8': { value: '2rem', pixel: 32, description: '区块间距' },
  '10': { value: '2.5rem', pixel: 40, description: '大间距' },
  '12': { value: '3rem', pixel: 48, description: '超大间距' },
  '16': { value: '4rem', pixel: 64, description: '页面区块间距' },
  '20': { value: '5rem', pixel: 80, description: '特大间距' },
  '24': { value: '6rem', pixel: 96, description: '超大区块间距' },
  '32': { value: '8rem', pixel: 128, description: '最大间距' },
}
