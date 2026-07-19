import { ReactNode, useEffect, useCallback } from 'react'
import './Modal.css'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  maskClosable?: boolean
  className?: string
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maskClosable = true,
  className = '',
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  // ESC 键关闭支持
  const handleKeyDown = useCallback(function(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(function() {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      return function() {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const classes = ['xui-modal', className].filter(Boolean).join(' ')

  const handleMaskClick = () => {
    if (maskClosable) onClose()
  }

  return (
    <div className="xui-modal__mask" onClick={handleMaskClick}>
      <div
        className={classes}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="xui-modal__header">
            <h3 className="xui-modal__title">{title}</h3>
            <button
              type="button"
              className="xui-modal__close"
              onClick={onClose}
              aria-label="关闭"
            >
              ×
            </button>
          </div>
        )}
        <div className="xui-modal__body">{children}</div>
        {footer && <div className="xui-modal__footer">{footer}</div>}
      </div>
    </div>
  )
}
