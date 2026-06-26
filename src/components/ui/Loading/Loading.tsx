import './Loading.css'

export type LoadingType = 'spinner' | 'dots' | 'pulse'
export type LoadingSize = 'sm' | 'md' | 'lg'

export interface LoadingProps {
  type?: LoadingType
  size?: LoadingSize
  text?: string
  className?: string
}

export default function Loading({
  type = 'spinner',
  size = 'md',
  text,
  className = '',
}: LoadingProps) {
  const classes = [
    'xui-loading',
    `xui-loading--${size}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <div className={`xui-loading__spinner xui-loading__spinner--${type}`}>
        {type === 'spinner' && <span className="xui-spinner" />}
        {type === 'dots' && (
          <>
            <span className="xui-dot xui-dot--1" />
            <span className="xui-dot xui-dot--2" />
            <span className="xui-dot xui-dot--3" />
          </>
        )}
        {type === 'pulse' && <span className="xui-pulse" />}
      </div>
      {text && <span className="xui-loading__text">{text}</span>}
    </div>
  )
}
