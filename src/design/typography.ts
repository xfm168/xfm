export interface TypographyToken {
  fontSize: string
  lineHeight: string
  fontWeight: number
  letterSpacing?: string
  description: string
}

export interface TypographyPalette {
  display: TypographyToken
  h1: TypographyToken
  h2: TypographyToken
  h3: TypographyToken
  body: TypographyToken
  bodySmall: TypographyToken
  caption: TypographyToken
  small: TypographyToken
}

export const fontFamily = {
  serif: "'Noto Serif SC', 'Songti SC', 'STKaiti', 'KaiTi', Georgia, serif",
  sans: "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif",
}

export const typography: TypographyPalette = {
  display: {
    fontSize: '2.5rem',
    lineHeight: '1.2',
    fontWeight: 700,
    letterSpacing: '0.25em',
    description: '大标题，用于首页品牌名',
  },
  h1: {
    fontSize: '1.75rem',
    lineHeight: '1.3',
    fontWeight: 600,
    letterSpacing: '0.15em',
    description: '页面主标题',
  },
  h2: {
    fontSize: '1.375rem',
    lineHeight: '1.4',
    fontWeight: 600,
    letterSpacing: '0.1em',
    description: '区块标题',
  },
  h3: {
    fontSize: '1.125rem',
    lineHeight: '1.4',
    fontWeight: 600,
    letterSpacing: '0.05em',
    description: '卡片标题',
  },
  body: {
    fontSize: '1rem',
    lineHeight: '1.8',
    fontWeight: 400,
    description: '正文内容',
  },
  bodySmall: {
    fontSize: '0.9375rem',
    lineHeight: '1.7',
    fontWeight: 400,
    description: '次要正文',
  },
  caption: {
    fontSize: '0.875rem',
    lineHeight: '1.6',
    fontWeight: 400,
    description: '辅助说明',
  },
  small: {
    fontSize: '0.75rem',
    lineHeight: '1.5',
    fontWeight: 400,
    description: '标签、时间、小字',
  },
}
