/**
 * 八字模块图片懒加载组件 V4.4
 *
 * 从 baziPerformance.ts 拆出（.ts 文件不支持 JSX）。
 *
 * 特性：
 *  - 原生 `loading="lazy"` 兜底
 *  - IntersectionObserver 控制真实加载时机
 *  - 支持 placeholder 模糊放大过渡（渐进式加载）
 *  - 可访问性：携带 alt、decoding="async"
 */

import { useEffect, useRef, useState } from 'react'

export interface LazyImageProps {
  src: string
  alt: string
  /** 占位缩略图（模糊放大过渡到清晰） */
  placeholder?: string
  width?: number | string
  height?: number | string
  className?: string
  style?: React.CSSProperties
  /** 根据视口预加载距离，默认 200px */
  rootMargin?: string
  onClick?: () => void
}

/**
 * 图片懒加载组件
 *
 * @example
 * <LazyImage src={posterUrl} alt="命盘海报" placeholder={blurUrl} />
 */
export function LazyImage(props: LazyImageProps): React.ReactElement {
  const { src, alt, placeholder, width, height, className, style, rootMargin, onClick } = props
  const ref = useRef<HTMLImageElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let observer: IntersectionObserver | null = null
    const el = ref.current
    if (el && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        entries => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setVisible(true)
              observer?.disconnect()
            }
          }
        },
        { rootMargin: rootMargin ?? '200px' }
      )
      observer.observe(el)
    } else {
      // 无 IntersectionObserver 环境直接加载
      setVisible(true)
    }
    return () => {
      observer?.disconnect()
    }
  }, [rootMargin])

  return (
    <img
      ref={ref}
      className={className}
      style={{
        width,
        height,
        filter: loaded ? 'none' : 'blur(12px)',
        transition: 'filter 0.4s ease',
        ...style,
      }}
      src={visible ? src : placeholder}
      alt={alt}
      loading="lazy"
      decoding="async"
      onClick={onClick}
      onLoad={() => setLoaded(true)}
    />
  )
}
