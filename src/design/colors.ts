export interface ColorToken {
  value: string
  description: string
}

export interface ColorPalette {
  bg: {
    primary: ColorToken
    secondary: ColorToken
    tertiary: ColorToken
    card: ColorToken
    cardHover: ColorToken
  }
  gold: {
    50: ColorToken
    100: ColorToken
    300: ColorToken
    500: ColorToken
    700: ColorToken
    900: ColorToken
    glow: ColorToken
    glowStrong: ColorToken
  }
  text: {
    primary: ColorToken
    secondary: ColorToken
    muted: ColorToken
  }
  border: {
    default: ColorToken
    light: ColorToken
  }
  status: {
    success: ColorToken
    warning: ColorToken
    error: ColorToken
  }
}

export const colors: ColorPalette = {
  bg: {
    primary: {
      value: '#071629',
      description: '主背景：深夜蓝',
    },
    secondary: {
      value: '#0B1F3B',
      description: '次级背景',
    },
    tertiary: {
      value: '#112845',
      description: '第三级背景',
    },
    card: {
      value: 'rgba(11, 31, 59, 0.85)',
      description: '卡片背景',
    },
    cardHover: {
      value: 'rgba(17, 40, 69, 0.9)',
      description: '卡片悬停背景',
    },
  },
  gold: {
    50: {
      value: '#FAF3DC',
      description: '金色最浅',
    },
    100: {
      value: '#F0E0A8',
      description: '金色浅',
    },
    300: {
      value: '#E8C56A',
      description: '金色高光',
    },
    500: {
      value: '#D4AF37',
      description: '古铜金主色（品牌色）',
    },
    700: {
      value: '#B8860B',
      description: '古铜金深色',
    },
    900: {
      value: '#8B6914',
      description: '深古铜',
    },
    glow: {
      value: 'rgba(212, 175, 55, 0.12)',
      description: '金色光晕（淡）',
    },
    glowStrong: {
      value: 'rgba(212, 175, 55, 0.25)',
      description: '金色光晕（强）',
    },
  },
  text: {
    primary: {
      value: '#F5F1E8',
      description: '主文字：米白',
    },
    secondary: {
      value: '#B8C4D6',
      description: '次级文字',
    },
    muted: {
      value: '#6B7D94',
      description: '弱化文字',
    },
  },
  border: {
    default: {
      value: 'rgba(212, 175, 55, 0.2)',
      description: '默认边框',
    },
    light: {
      value: 'rgba(212, 175, 55, 0.08)',
      description: '淡边框',
    },
  },
  status: {
    success: {
      value: '#6B9E7A',
      description: '成功状态色',
    },
    warning: {
      value: '#C4A24A',
      description: '警告状态色',
    },
    error: {
      value: '#C46060',
      description: '错误状态色',
    },
  },
}

export const goldGradient = {
  vertical: 'linear-gradient(180deg, #E8C56A 0%, #D4AF37 35%, #B8860B 65%, #8B6914 100%)',
  horizontal: 'linear-gradient(90deg, #E8C56A 0%, #D4AF37 50%, #B8860B 100%)',
  radial: 'radial-gradient(circle, #E8C56A 0%, #D4AF37 50%, #B8860B 100%)',
}
