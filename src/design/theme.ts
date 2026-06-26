import { colors } from './colors'
import { typography, fontFamily } from './typography'
import { spacing } from './spacing'
import { radius } from './radius'
import { shadow } from './shadow'
import { motion, keyframes } from './motion'

export interface DesignTheme {
  colors: typeof colors
  typography: typeof typography
  fontFamily: typeof fontFamily
  spacing: typeof spacing
  radius: typeof radius
  shadow: typeof shadow
  motion: typeof motion
  keyframes: typeof keyframes
}

export const theme: DesignTheme = {
  colors,
  typography,
  fontFamily,
  spacing,
  radius,
  shadow,
  motion,
  keyframes,
}

export function generateCSSVariables(): string {
  const lines: string[] = []

  lines.push('/* ═══════════════════════════════════════════')
  lines.push('   玄风门 Design System — CSS Variables')
  lines.push('   ═══════════════════════════════════════════ */')
  lines.push('')
  lines.push(':root {')

  lines.push('  /* ── Background ── */')
  lines.push(`  --bg-primary: ${colors.bg.primary.value};`)
  lines.push(`  --bg-secondary: ${colors.bg.secondary.value};`)
  lines.push(`  --bg-tertiary: ${colors.bg.tertiary.value};`)
  lines.push(`  --bg-card: ${colors.bg.card.value};`)
  lines.push(`  --bg-card-hover: ${colors.bg.cardHover.value};`)
  lines.push('')

  lines.push('  /* ── Gold Palette ── */')
  lines.push(`  --gold-50: ${colors.gold['50'].value};`)
  lines.push(`  --gold-100: ${colors.gold['100'].value};`)
  lines.push(`  --gold-300: ${colors.gold['300'].value};`)
  lines.push(`  --gold-500: ${colors.gold['500'].value};`)
  lines.push(`  --gold-700: ${colors.gold['700'].value};`)
  lines.push(`  --gold-900: ${colors.gold['900'].value};`)
  lines.push(`  --gold-glow: ${colors.gold.glow.value};`)
  lines.push(`  --gold-glow-strong: ${colors.gold.glowStrong.value};`)
  lines.push('')

  lines.push('  /* ── Text ── */')
  lines.push(`  --text-primary: ${colors.text.primary.value};`)
  lines.push(`  --text-secondary: ${colors.text.secondary.value};`)
  lines.push(`  --text-muted: ${colors.text.muted.value};`)
  lines.push('')

  lines.push('  /* ── Border ── */')
  lines.push(`  --border: ${colors.border.default.value};`)
  lines.push(`  --border-light: ${colors.border.light.value};`)
  lines.push('')

  lines.push('  /* ── Status ── */')
  lines.push(`  --success: ${colors.status.success.value};`)
  lines.push(`  --warning: ${colors.status.warning.value};`)
  lines.push(`  --error: ${colors.status.error.value};`)
  lines.push('')

  lines.push('  /* ── Typography ── */')
  lines.push(`  --font-serif: ${fontFamily.serif};`)
  lines.push(`  --font-sans: ${fontFamily.sans};`)
  lines.push('')

  lines.push('  /* ── Spacing (4px base) ── */')
  for (const [key, val] of Object.entries(spacing)) {
    lines.push(`  --space-${key}: ${val.value};`)
  }
  lines.push('')

  lines.push('  /* ── Border Radius ── */')
  for (const [key, val] of Object.entries(radius)) {
    lines.push(`  --radius-${key}: ${val.value};`)
  }
  lines.push('')

  lines.push('  /* ── Shadows ── */')
  lines.push(`  --shadow-sm: ${shadow.sm.value};`)
  lines.push(`  --shadow-md: ${shadow.md.value};`)
  lines.push(`  --shadow-lg: ${shadow.lg.value};`)
  lines.push(`  --shadow-gold: ${shadow.goldSoft.value};`)
  lines.push(`  --shadow-gold-md: ${shadow.goldMedium.value};`)
  lines.push(`  --shadow-gold-lg: ${shadow.goldStrong.value};`)
  lines.push('')

  lines.push('  /* ── Motion ── */')
  lines.push(`  --duration-fast: ${motion.duration.fast.value};`)
  lines.push(`  --duration-base: ${motion.duration.base.value};`)
  lines.push(`  --duration-slow: ${motion.duration.slow.value};`)
  lines.push(`  --duration-gentle: ${motion.duration.gentle.value};`)
  lines.push('')
  lines.push(`  --ease-standard: ${motion.easing.standard.value};`)
  lines.push(`  --ease-enter: ${motion.easing.enter.value};`)
  lines.push(`  --ease-exit: ${motion.easing.exit.value};`)
  lines.push(`  --ease-elegant: ${motion.easing.elegant.value};`)

  lines.push('}')
  lines.push('')

  lines.push('/* ── Keyframes ── */')
  for (const kf of Object.values(keyframes)) {
    lines.push(kf)
  }

  lines.push('')
  lines.push('/* ── Utility Classes ── */')
  lines.push('.animate-fade-in { animation: fadeIn var(--duration-gentle) var(--ease-elegant) both; }')
  lines.push('.animate-fade-in-up { animation: fadeInUp var(--duration-gentle) var(--ease-elegant) both; }')
  lines.push('.animate-slide-up { animation: slideUp var(--duration-slow) var(--ease-elegant) both; }')
  lines.push('.animate-pulse-soft { animation: pulseSoft var(--duration-slow) var(--ease-elegant) infinite; }')
  lines.push('.animate-spin-slow { animation: spinSlow 20s linear infinite; }')
  lines.push('.animate-gold-breath { animation: goldBreath 4s var(--ease-elegant) infinite; }')
  lines.push('')
  lines.push('.gold-text { color: var(--gold-500); }')
  lines.push('.gold-gradient-text {')
  lines.push('  background: linear-gradient(180deg, var(--gold-300) 0%, var(--gold-500) 35%, var(--gold-700) 65%, var(--gold-900) 100%);')
  lines.push('  -webkit-background-clip: text;')
  lines.push('  -webkit-text-fill-color: transparent;')
  lines.push('  background-clip: text;')
  lines.push('}')

  return lines.join('\n')
}

export default theme
