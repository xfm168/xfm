import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import './ImageUploader.css'

export interface ImageUploaderProps {
  value?: string
  onChange?: (dataUrl: string) => void
  accept?: string
  maxSizeMB?: number
  className?: string
}

export default function ImageUploader({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 10,
  className = '',
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('请上传图片文件')
      return
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`图片大小不能超过 ${maxSizeMB}MB`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result as string
      onChange?.(result)
    }
    reader.onerror = () => {
      setError('图片读取失败，请重试')
    }
    reader.readAsDataURL(file)
  }, [maxSizeMB, onChange])

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const classes = [
    'xbiz-image-uploader',
    isDragging ? 'dragging' : '',
    value ? 'has-image' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="xbiz-image-uploader__input"
      />

      {value ? (
        <div className="xbiz-image-uploader__preview">
          <img src={value} alt="预览" className="xbiz-image-uploader__img" />
          <button
            type="button"
            className="xbiz-image-uploader__reupload"
            onClick={handleClick}
          >
            重新上传
          </button>
        </div>
      ) : (
        <div
          className="xbiz-image-uploader__dropzone"
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="xbiz-image-uploader__icon">
            <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
              <rect x="6" y="10" width="36" height="30" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="16" cy="22" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10 38 L18 28 L26 34 L32 28 L38 38" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M24 10 V22 M18 16 L24 10 L30 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="xbiz-image-uploader__text">
            <span className="xbiz-image-uploader__title">点击或拖拽上传图片</span>
            <span className="xbiz-image-uploader__hint">支持 JPG、PNG 格式，最大 {maxSizeMB}MB</span>
          </div>
        </div>
      )}

      {error && <div className="xbiz-image-uploader__error">{error}</div>}
    </div>
  )
}
