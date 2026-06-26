export interface RadiusToken {
  value: string
  pixel: number
  description: string
}

export type RadiusScale = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

export interface RadiusPalette {
  sm: RadiusToken
  md: RadiusToken
  lg: RadiusToken
  xl: RadiusToken
  '2xl': RadiusToken
  full: RadiusToken
}

export const radius: RadiusPalette = {
  sm: {
    value: '0.25rem',
    pixel: 4,
    description: '小圆角：徽章、标签',
  },
  md: {
    value: '0.5rem',
    pixel: 8,
    description: '中圆角：输入框、小卡片',
  },
  lg: {
    value: '0.75rem',
    pixel: 12,
    description: '大圆角：普通卡片',
  },
  xl: {
    value: '1rem',
    pixel: 16,
    description: '特大圆角：大卡片、弹窗',
  },
  '2xl': {
    value: '1.25rem',
    pixel: 20,
    description: '超大圆角：首页功能卡片',
  },
  full: {
    value: '9999px',
    pixel: 9999,
    description: '圆形、胶囊按钮',
  },
}
