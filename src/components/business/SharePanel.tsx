/**
 * 玄风门 V3.2 分享面板组件
 *
 * 弹窗形式的分享面板，支持：
 * - 分享到微信（显示二维码）
 * - 分享到朋友圈
 * - 分享到小红书
 * - 保存图片
 * - 复制文案
 * - 复制报告链接
 */

import { useState, useCallback } from 'react'
import Modal from '../ui/Modal/Modal'
import type { FengShuiHistoryRecordV31 } from '../../lib/fengshui/v31/types'
import {
  generateShareImage,
  generateShareText,
  generateShareReport,
  downloadSharePoster,
  copyToClipboard,
  generateShareLink,
  nativeShare,
  type SharePlatform,
} from '../../lib/fengshui/v31/share'
import './SharePanel.css'

export interface SharePanelProps {
  open: boolean
  onClose: () => void
  record: FengShuiHistoryRecordV31
}

type ActiveTab = 'image' | 'text' | 'link'

export default function SharePanel({ open, onClose, record }: SharePanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('image')
  const [posterUrl, setPosterUrl] = useState<string>('')
  const [posterLoading, setPosterLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState<string>('')
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')

  // 生成海报图片
  const generatePoster = useCallback(async () => {
    if (posterUrl) return posterUrl
    setPosterLoading(true)
    try {
      const url = await generateShareImage(record)
      setPosterUrl(url)
      return url
    } catch (e) {
      console.error('海报生成失败：', e)
      return ''
    } finally {
      setPosterLoading(false)
    }
  }, [record, posterUrl])

  // 当面板打开时自动生成海报
  const handleOpen = useCallback(async () => {
    if (open && !posterUrl && activeTab === 'image') {
      generatePoster()
    }
  }, [open, posterUrl, activeTab, generatePoster])

  // 切换 Tab 时生成对应内容
  const handleTabChange = useCallback((tab: ActiveTab) => {
    setActiveTab(tab)
    if (tab === 'image' && !posterUrl) {
      generatePoster()
    }
  }, [posterUrl, generatePoster])

  // 保存图片
  const handleSaveImage = useCallback(async () => {
    const success = await downloadSharePoster(record)
    if (success) {
      setCopySuccess('image')
      setTimeout(() => setCopySuccess(''), 2000)
    }
  }, [record])

  // 复制文案
  const handleCopyText = useCallback(async (platform: SharePlatform) => {
    const text = generateShareText(record, platform)
    const success = await copyToClipboard(text)
    if (success) {
      setCopySuccess(`text-${platform}`)
      setTimeout(() => setCopySuccess(''), 2000)
    }
  }, [record])

  // 复制报告链接
  const handleCopyLink = useCallback(async () => {
    const link = generateShareLink(record)
    const success = await copyToClipboard(link)
    if (success) {
      setCopySuccess('link')
      setTimeout(() => setCopySuccess(''), 2000)
    }
  }, [record])

  // 复制 HTML 报告
  const handleCopyReport = useCallback(async () => {
    const html = generateShareReport(record)
    const success = await copyToClipboard(html)
    if (success) {
      setCopySuccess('report')
      setTimeout(() => setCopySuccess(''), 2000)
    }
  }, [record])

  // 微信分享（显示二维码）
  const handleWechatShare = useCallback(() => {
    const link = generateShareLink(record)
    // 使用 API 生成二维码，这里用占位
    setQrCodeUrl(link)
    setActiveTab('image')
  }, [record])

  // 朋友圈分享
  const handleMomentsShare = useCallback(async () => {
    const shared = await nativeShare(record, 'moments')
    if (!shared) {
      // 不支持原生分享则复制文案 + 保存图片
      handleCopyText('moments')
      handleSaveImage()
    }
  }, [record, handleCopyText, handleSaveImage])

  // 小红书分享
  const handleXiaohongshuShare = useCallback(async () => {
    const shared = await nativeShare(record, 'xiaohongshu')
    if (!shared) {
      handleCopyText('xiaohongshu')
      handleSaveImage()
    }
  }, [record, handleCopyText, handleSaveImage])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="分享报告"
      className="share-panel-modal"
    >
      <div className="share-panel">
        {/* Tab 切换 */}
        <div className="share-tabs">
          <button
            className={`share-tab ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => handleTabChange('image')}
          >
            <span className="share-tab-icon">🖼️</span>
            <span>图片海报</span>
          </button>
          <button
            className={`share-tab ${activeTab === 'text' ? 'active' : ''}`}
            onClick={() => handleTabChange('text')}
          >
            <span className="share-tab-icon">📝</span>
            <span>分享文案</span>
          </button>
          <button
            className={`share-tab ${activeTab === 'link' ? 'active' : ''}`}
            onClick={() => handleTabChange('link')}
          >
            <span className="share-tab-icon">🔗</span>
            <span>链接报告</span>
          </button>
        </div>

        {/* 图片海报 Tab */}
        {activeTab === 'image' && (
          <div className="share-content">
            <div className="poster-preview-wrap">
              {posterLoading ? (
                <div className="poster-loading">
                  <div className="poster-spinner" />
                  <span>生成海报中...</span>
                </div>
              ) : posterUrl ? (
                <img
                  src={posterUrl}
                  alt="分享海报"
                  className="poster-preview"
                />
              ) : (
                <div className="poster-placeholder">
                  <span className="placeholder-icon">🖼️</span>
                  <span>点击下方按钮生成海报</span>
                </div>
              )}
            </div>

            {/* 快速分享按钮 */}
            <div className="share-quick-buttons">
              <button
                className="share-quick-btn wechat"
                onClick={handleWechatShare}
                title="分享到微信"
              >
                <span className="quick-btn-icon">💬</span>
                <span className="quick-btn-label">微信</span>
              </button>
              <button
                className="share-quick-btn moments"
                onClick={handleMomentsShare}
                title="分享到朋友圈"
              >
                <span className="quick-btn-icon">🌙</span>
                <span className="quick-btn-label">朋友圈</span>
              </button>
              <button
                className="share-quick-btn xiaohongshu"
                onClick={handleXiaohongshuShare}
                title="分享到小红书"
              >
                <span className="quick-btn-icon">📕</span>
                <span className="quick-btn-label">小红书</span>
              </button>
              <button
                className="share-quick-btn save"
                onClick={handleSaveImage}
                title="保存图片"
              >
                <span className="quick-btn-icon">💾</span>
                <span className="quick-btn-label">
                  {copySuccess === 'image' ? '已保存' : '保存'}
                </span>
              </button>
            </div>

            {/* 生成海报按钮（当还未生成时） */}
            {!posterUrl && !posterLoading && (
              <button
                className="share-generate-btn"
                onClick={generatePoster}
              >
                生成分享海报
              </button>
            )}
          </div>
        )}

        {/* 分享文案 Tab */}
        {activeTab === 'text' && (
          <div className="share-content">
            <div className="share-text-section">
              <h4 className="share-section-title">选择平台风格</h4>
              <div className="share-text-platforms">
                <button
                  className={`platform-btn ${copySuccess === 'text-wechat' ? 'copied' : ''}`}
                  onClick={() => handleCopyText('wechat')}
                >
                  <span className="platform-icon">💬</span>
                  <span className="platform-name">微信</span>
                  <span className="platform-action">
                    {copySuccess === 'text-wechat' ? '✓ 已复制' : '复制文案'}
                  </span>
                </button>
                <button
                  className={`platform-btn ${copySuccess === 'text-moments' ? 'copied' : ''}`}
                  onClick={() => handleCopyText('moments')}
                >
                  <span className="platform-icon">🌙</span>
                  <span className="platform-name">朋友圈</span>
                  <span className="platform-action">
                    {copySuccess === 'text-moments' ? '✓ 已复制' : '复制文案'}
                  </span>
                </button>
                <button
                  className={`platform-btn ${copySuccess === 'text-xiaohongshu' ? 'copied' : ''}`}
                  onClick={() => handleCopyText('xiaohongshu')}
                >
                  <span className="platform-icon">📕</span>
                  <span className="platform-name">小红书</span>
                  <span className="platform-action">
                    {copySuccess === 'text-xiaohongshu' ? '✓ 已复制' : '复制文案'}
                  </span>
                </button>
                <button
                  className={`platform-btn ${copySuccess === 'text-general' ? 'copied' : ''}`}
                  onClick={() => handleCopyText('general')}
                >
                  <span className="platform-icon">📋</span>
                  <span className="platform-name">通用版</span>
                  <span className="platform-action">
                    {copySuccess === 'text-general' ? '✓ 已复制' : '复制文案'}
                  </span>
                </button>
              </div>
            </div>

            {/* 文案预览 */}
            <div className="share-text-preview">
              <h4 className="share-section-title">文案预览</h4>
              <div className="text-preview-box">
                <pre>{generateShareText(record, 'general')}</pre>
              </div>
            </div>
          </div>
        )}

        {/* 链接报告 Tab */}
        {activeTab === 'link' && (
          <div className="share-content">
            <div className="share-link-section">
              <h4 className="share-section-title">分享链接</h4>
              <div className="link-box">
                <span className="link-text">{generateShareLink(record)}</span>
                <button
                  className={`link-copy-btn ${copySuccess === 'link' ? 'copied' : ''}`}
                  onClick={handleCopyLink}
                >
                  {copySuccess === 'link' ? '已复制' : '复制链接'}
                </button>
              </div>
              <p className="link-hint">
                复制链接发送给好友，对方打开即可查看报告摘要
              </p>
            </div>

            <div className="share-report-section">
              <h4 className="share-section-title">精简版报告</h4>
              <p className="report-desc">
                复制 HTML 格式的精简报告，可直接粘贴到邮件或文档中
              </p>
              <button
                className={`report-copy-btn ${copySuccess === 'report' ? 'copied' : ''}`}
                onClick={handleCopyReport}
              >
                {copySuccess === 'report' ? '✓ 已复制报告代码' : '复制 HTML 报告'}
              </button>
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div className="share-footer">
          <span>📊 {record.roomName} · {record.overallScore} 分</span>
          <span className="share-brand">玄风门</span>
        </div>
      </div>
    </Modal>
  )
}
