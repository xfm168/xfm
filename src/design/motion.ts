export interface DurationToken {
  value: string
  ms: number
  description: string
}

export interface EasingToken {
  value: string
  description: string
}

export interface MotionPalette {
  duration: {
    fast: DurationToken
    base: DurationToken
    slow: DurationToken
    gentle: DurationToken
  }
  easing: {
    standard: EasingToken
    enter: EasingToken
    exit: EasingToken
    elegant: EasingToken
  }
}

export const motion: MotionPalette = {
  duration: {
    fast: {
      value: '150ms',
      ms: 150,
      description: '快速：微交互（hover、press）',
    },
    base: {
      value: '300ms',
      ms: 300,
      description: '标准：常规过渡',
    },
    slow: {
      value: '500ms',
      ms: 500,
      description: '缓慢：较大变化',
    },
    gentle: {
      value: '800ms',
      ms: 800,
      description: '柔和：入场动画',
    },
  },
  easing: {
    standard: {
      value: 'cubic-bezier(0.4, 0, 0.2, 1)',
      description: '标准缓动',
    },
    enter: {
      value: 'cubic-bezier(0, 0, 0.2, 1)',
      description: '入场加速',
    },
    exit: {
      value: 'cubic-bezier(0.4, 0, 1, 1)',
      description: '出场减速',
    },
    elegant: {
      value: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      description: '优雅缓动（东方美学）',
    },
  },
}

export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  fadeInUp: `
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,
  pulseSoft: `
    @keyframes pulseSoft {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
  `,
  spinSlow: `
    @keyframes spinSlow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,
  goldBreath: `
    @keyframes goldBreath {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
  `,
}
