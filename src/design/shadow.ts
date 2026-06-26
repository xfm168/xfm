export interface ShadowToken {
  value: string
  description: string
}

export interface ShadowPalette {
  sm: ShadowToken
  md: ShadowToken
  lg: ShadowToken
  goldSoft: ShadowToken
  goldMedium: ShadowToken
  goldStrong: ShadowToken
}

export const shadow: ShadowPalette = {
  sm: {
    value: '0 1px 4px rgba(0, 0, 0, 0.4)',
    description: '轻微阴影',
  },
  md: {
    value: '0 4px 16px rgba(0, 0, 0, 0.4)',
    description: '卡片阴影',
  },
  lg: {
    value: '0 12px 40px rgba(0, 0, 0, 0.5)',
    description: '弹窗/悬浮阴影',
  },
  goldSoft: {
    value: '0 0 20px rgba(212, 175, 55, 0.1)',
    description: '淡金光',
  },
  goldMedium: {
    value: '0 0 40px rgba(212, 175, 55, 0.18)',
    description: '中金光',
  },
  goldStrong: {
    value: '0 0 60px rgba(212, 175, 55, 0.25)',
    description: '强金光',
  },
}
