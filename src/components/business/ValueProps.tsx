/**
 * ValueProps 为什么选择玄风门
 * 展示平台核心价值点，黑金设计风格
 */
import React from 'react'
import './ValueProps.css'

var VALUE_ITEMS = [
  {
    icon: '\u2630',
    title: '易学传承',
    desc: '融合周易、八字、风水经典体系，千年传承的正统命理推演',
  },
  {
    icon: '\u2605',
    title: '真人案例',
    desc: '大量真实案例持续验证，历经实战检验的命理推演方法',
  },
  {
    icon: '\u262F',
    title: '专业推演',
    desc: '完整四柱推演体系，格局、十神、喜用神全方位深度解析',
  },
  {
    icon: '\uD83D\uDD12',
    title: '隐私保护',
    desc: '数据安全本地保护，严格隐私策略，个人信息绝不外泄',
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
