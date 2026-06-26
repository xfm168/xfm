import { ButtonHTMLAttributes, ReactNode } from 'react'
import './Button.css'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    'xui-btn',
    `xui-btn--${variant}`,
    `xui-btn--${size}`,
    fullWidth ? 'xui-btn--full' : '',
    loading ? 'xui-btn--loading' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <span className="xui-btn__spinner" aria-hidden />
      )}
      {!loading && leftIcon && (
        <span className="xui-btn__icon xui-btn__icon--left">{leftIcon}</span>
      )}
      {children && <span className="xui-btn__label">{children}</span>}
      {!loading && rightIcon && (
        <span className="xui-btn__icon xui-btn__icon--right">{rightIcon}</span>
      )}
    </button>
  )
}
