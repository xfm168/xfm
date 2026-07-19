/**
 * ValueProps 为什么选择玄风门
 * 展示平台核心价值点，黑金设计风格
 */
import React from 'react'
import './ValueProps.css'

var VALUE_ITEMS = [
  {
    icon: '\u2699',
    title: '专业 Engine',
    desc: '140+ 测试用例覆盖，天干地支、五行生克、十神关系等核心算法精准可靠',
  },
  {
    icon: '\u2728',
    title: 'AI 增强',
    desc: 'Gemini 深度解读，融合传统命理与现代 AI，提供更丰富的分析视角',
  },
  {
    icon: '\uD83D\uDD12',
    title: '安全可靠',
    desc: 'JWT 认证 + Webhook 验签，金融级安全保障，确保交易与数据安全',
  },
  {
    icon: '\uD83D\uDEE1',
    title: '隐私保护',
    desc: '数据加密存储，严格隐私策略，您的个人信息绝不会被泄露或滥用',
  },
]

function ValueProps() {
  return React.createElement('div', { className: 'vp-section' },
    React.createElement('h2', { className: 'vp-title' }, '为什么选择玄风门'),
    React.createElement('div', { className: 'vp-grid' },
      VALUE_ITEMS.map(function(item, i) {
        return React.createElement('div', { key: i, className: 'vp-card' },
          React.createElement('div', { className: 'vp-icon-wrap' },
            React.createElement('span', { className: 'vp-icon' }, item.icon)
          ),
          React.createElement('h3', { className: 'vp-card-title' }, item.title),
          React.createElement('p', { className: 'vp-card-desc' }, item.desc)
        )
      })
    )
  )
}

export { ValueProps }
