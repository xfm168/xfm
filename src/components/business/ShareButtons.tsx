import React, { useState } from 'react'
import { generateShareText } from './ShareCard'
import './ShareButtons.css'

var PLATFORMS = [
  { key: 'wechat', name: '微信', icon: '微' },
  { key: 'moments', name: '朋友圈', icon: '圈' },
  { key: 'qq', name: 'QQ', icon: 'Q' },
  { key: 'weibo', name: '微博', icon: '博' },
  { key: 'xiaohongshu', name: '小红书', icon: '书' },
  { key: 'copy', name: '复制链接', icon: '链' },
]

function ShareButtons(props: any) {
  var type = props.type || 'bazi'
  var data = props.data || {}
  var [copied, setCopied] = useState(false)
  var shareUrl = props.url || 'https://xuanfengmen.com'
  var shareText = generateShareText(type, data)
  var fullUrl = shareUrl + '?ref=share'

  function handleShare(platform: string) {
    if (platform === 'copy') {
      navigator.clipboard.writeText(fullUrl).then(function() {
        setCopied(true)
        setTimeout(function() { setCopied(false) }, 2000)
      })
      return
    }
    // 其他平台：打开分享 URL（原生 Web Share API 或 fallback）
    if (navigator.share) {
      navigator.share({ title: '玄风门 — ' + (props.shareTitle || '命理分析'), text: shareText, url: fullUrl })
    } else {
      // Fallback: 复制到剪贴板
      navigator.clipboard.writeText(fullUrl).then(function() {
        setCopied(true)
        setTimeout(function() { setCopied(false) }, 2000)
      })
    }
  }

  var showCard = props.showCard !== false

  return React.createElement('div', { className: 'share-container' },
    showCard && React.createElement('div', { className: 'share-card-preview' },
      React.createElement('p', null, '分享卡片预览（长按保存图片）'),
      React.createElement('div', { className: 'share-card-embed' },
        React.createElement('p', { style: { textAlign: 'center', color: '#c9952d', fontWeight: 700 } }, '玄风门'),
        React.createElement('p', { style: { textAlign: 'center', color: '#e2e5ed' } }, shareText.substring(0, 40) + '...')
      )
    ),
    React.createElement('div', { className: 'share-buttons' },
      PLATFORMS.map(function(p) {
        return React.createElement('button', {
          key: p.key,
          className: 'share-btn' + (p.key === 'copy' && copied ? ' share-btn-copied' : ''),
          onClick: function() { handleShare(p.key) }
        }, p.key === 'copy' && copied ? '已复制' : p.icon + ' ' + p.name)
      })
    )
  )
}

export { ShareButtons, PLATFORMS }