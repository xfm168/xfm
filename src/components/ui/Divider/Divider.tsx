import './Divider.css'

export type DividerOrientation = 'horizontal' | 'vertical'
export type DividerVariant = 'line' | 'gradient' | 'dotted'

export interface DividerProps {
  orientation?: DividerOrientation
  variant?: DividerVariant
  className?: string
}

export default function Divider({
  orientation = 'horizontal',
  variant = 'line',
  className = '',
}: DividerProps) {
  const classes = [
    'xui-divider',
    `xui-divider--${orientation}`,
    `xui-divider--${variant}`,
    className,
  ].filter(Boolean).join(' ')

  return <div className={classes} role="separator" />
}
