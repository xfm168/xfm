import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import './FengShui.css'

type RoomType = 'living' | 'bedroom' | 'kitchen' | 'balcony'

interface RoomInfo {
  id: RoomType
  name: string
  icon: string
  desc: string
}

const roomTypes: RoomInfo[] = [
  { id: 'living', name: '客厅', icon: '🛋️', desc: '会客迎财之所' },
  { id: 'bedroom', name: '卧室', icon: '🛏️', desc: '休养生息之地' },
  { id: 'kitchen', name: '厨房', icon: '🍳', desc: '炊饮食禄之源' },
  { id: 'balcony', name: '阳台', icon: '🌿', desc: '纳气聚财之道' },
]

export default function FengShui() {
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [retryInfo, setRetryInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleRoomSelect = (room: RoomType) => {
    setSelectedRoom(room)
    setUploadedImage(null)
    setError(null)
  }

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setError('请上传图片文件（JPG、PNG格式）')
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleAnalyze = async () => {
    if (!uploadedImage || !selectedRoom) return

    setIsAnalyzing(true)
    setError(null)
    setRetryInfo(null)

    // 检查 Supabase 配置
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

    if (!supabaseUrl || !anonKey) {
      setError('风水分析服务暂不可用（缺少数据库配置）')
      setIsAnalyzing(false)
      return
    }

    const apiUrl = `${supabaseUrl}/functions/v1/analyze-room`
    const RETRY_DELAYS = [2000, 5000, 10000]

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${anonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: uploadedImage,
            roomType: selectedRoom,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.error) {
            throw new Error(result.error)
          }
          navigate('/analysis', {
            state: {
              image: uploadedImage,
              roomType: selectedRoom,
              analysisResult: result,
            }
          })
          return
        }

        const errData = await response.json().catch(() => null)
        const is503 = response.status === 503
        const isRetryExhausted = is503 && attempt === RETRY_DELAYS.length

        if (isRetryExhausted) {
          throw new Error('当前服务繁忙，请稍后再试')
        }

        if (is503 && attempt < RETRY_DELAYS.length) {
          setRetryInfo(`当前分析人数较多，正在重试，请稍候... (${attempt + 1}/3)`)
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]))
          continue
        }

        let errorMsg = errData?.error || `请求失败 (${response.status})`
        throw new Error(errorMsg)
      } catch (err) {
        const message = err instanceof Error ? err.message : '分析过程中出现错误'
        setError(message)
        break
      }
    }

    setIsAnalyzing(false)
    setRetryInfo(null)
  }

  return (
    <div className="fengshui">
      <section className="fengshui-header">
        <div className="container">
          <span className="page-label">风水分析</span>
          <h1 className="page-title">上传空间照片</h1>
          <p className="page-desc">选择空间类型，上传清晰照片，即可获得专业风水分析</p>
        </div>
      </section>

      {/* Room Selection */}
      <section className="room-section">
        <div className="container">
          <h2 className="section-heading">选择空间类型</h2>
          <div className="room-grid">
            {roomTypes.map((room) => (
              <button
                key={room.id}
                className={`room-card ${selectedRoom === room.id ? 'selected' : ''}`}
                onClick={() => handleRoomSelect(room.id)}
              >
                <span className="room-icon">{room.icon}</span>
                <span className="room-name">{room.name}</span>
                <span className="room-desc">{room.desc}</span>
                {selectedRoom === room.id && (
                  <span className="room-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Upload Section */}
      <section className="upload-section">
        <div className="container">
          <h2 className="section-heading">上传照片</h2>

          <div
            className={`upload-zone ${isDragging ? 'dragging' : ''} ${uploadedImage ? 'has-image' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !uploadedImage && fileInputRef.current?.click()}
          >
            {uploadedImage ? (
              <div className="preview-container">
                <img src={uploadedImage} alt="上传预览" className="preview-image" />
                <button
                  className="change-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setUploadedImage(null)
                    setError(null)
                  }}
                >
                  更换照片
                </button>
              </div>
            ) : (
              <div className="upload-placeholder">
                <div className="upload-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
                <p className="upload-text">点击或拖拽上传照片</p>
                <p className="upload-hint">支持 JPG、PNG 格式</p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleInputChange}
            className="hidden-input"
          />

          {/* Tips */}
          <div className="tips-card">
            <h3 className="tips-title">拍照建议</h3>
            <ul className="tips-list">
              <li>
                <span className="tip-icon">📸</span>
                <span>确保光线充足，避免阴影遮盖</span>
              </li>
              <li>
                <span className="tip-icon">📐</span>
                <span>尽量拍摄完整空间，包含门窗位置</span>
              </li>
              <li>
                <span className="tip-icon">🧭</span>
                <span>如条件允许，标注大致方位</span>
              </li>
            </ul>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <span className="error-icon-inline">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Analyze Button */}
          <button
            className={`analyze-btn ${!uploadedImage || !selectedRoom ? 'disabled' : ''}`}
            onClick={handleAnalyze}
            disabled={!uploadedImage || !selectedRoom || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span className="loading-spinner"></span>
                <span>
                  {retryInfo ? retryInfo : 'AI正在识别分析...'}
                </span>
              </>
            ) : (
              <>
                <span>开始风水分析</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </>
            )}
          </button>

          {!selectedRoom && (
            <p className="hint-text">请先选择空间类型</p>
          )}
          {selectedRoom && !uploadedImage && (
            <p className="hint-text">请上传空间照片</p>
          )}
        </div>
      </section>
    </div>
  )
}
