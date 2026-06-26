import { CSSProperties } from 'react'
import './Skeleton.css'

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card'

export interface SkeletonProps {
  variant?: SkeletonVariant
  width?: string | number
  height?: string | number
  count?: number
  gap?: number
  className?: string
}

export default function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  gap = 8,
  className = '',
}: SkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => i)

  const style: CSSProperties = {}
  if (width !== undefined) style.width = typeof width === 'number' ? `${width}px` : width
  if (height !== undefined) style.height = typeof height === 'number' ? `${height}px` : height

  const containerStyle: CSSProperties = count > 1 ? { gap: `${gap}px` } : {}

  const classes = [
    'xui-skeleton',
    `xui-skeleton--${variant}`,
    count > 1 ? 'xui-skeleton--multi' : '',
    className,
  ].filter(Boolean).join(' ')

  if (count <= 1) {
    return <div className={classes} style={style} />
  }

  return (
    <div className={classes} style={containerStyle}>
      {items.map((i) => (
        <div
          key={i}
          className="xui-skeleton__item"
          style={{
            ...style,
            width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
            height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
          }}
        />
      ))}
    </div>
  )
}
