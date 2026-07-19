/**
 * MembershipBenefits 会员权益对比展示
 * 用于会员购买页和升级引导弹窗
 */
import React from 'react'
import { useAuth } from '../../hooks/useAuth'
import { TIER_LIMITS } from '../../lib/domain/usageLimit'
import './MembershipBenefits.css'

var TIERS = [
  {
    key: 'free',
    name: '免费用户',
    price: '0',
    features: ['每日 3 次排盘', '每日 1 次分析', '基础报告', '无 PDF 导出', '5 条历史记录'],
    highlight: false,
  },
  {
    key: 'basic',
    name: '基础会员',
    price: '29',
    features: ['每日 10 次排盘', '每日 5 次分析', '完整八字分析', 'PDF 导出', '3 次 AI 解读', '50 条历史'],
    highlight: false,
  },
  {
    key: 'premium',
    name: '高级会员',
    price: '99',
    features: ['无限排盘', '无限分析', '专业报告', '全部 PDF', '20 次 AI 深度解读', '无限历史', '高级流年分析', 'AI 行动建议'],
    highlight: true,
  },
  {
    key: 'vip',
    name: 'VIP 尊享',
    price: '299',
    features: ['全部高级功能', '无限 AI', '优先客服', '优先体验新功能', '专属客服通道', '年度运势分析'],
    highlight: false,
  },
]

function MembershipBenefits(props: any) {
  var currentTier = props.currentTier || 'free'
  var onSelectPlan = props.onSelectPlan || function() {}

  var cards = TIERS.map(function(tier) {
    var isCurrent = tier.key === currentTier
    return React.createElement('div', {
      key: tier.key,
      className: 'mb-card' + (tier.highlight ? ' mb-card-highlight' : '') + (isCurrent ? ' mb-card-current' : ''),
    },
      React.createElement('div', { className: 'mb-card-badge' },
        tier.highlight ? '推荐' : isCurrent ? '当前' : ''
      ),
      React.createElement('h3', { className: 'mb-card-name' }, tier.name),
      React.createElement('div', { className: 'mb-card-price' },
        React.createElement('span', { className: 'mb-price-num' }, '\u00A5' + tier.price),
        React.createElement('span', { className: 'mb-price-unit' }, tier.key === 'free' ? '' : '/月')
      ),
      React.createElement('ul', { className: 'mb-features' },
        tier.features.map(function(f, i) {
          return React.createElement('li', { key: i }, f)
        })
      ),
      isCurrent
        ? React.createElement('button', { className: 'mb-btn mb-btn-current', disabled: true }, '当前方案')
        : React.createElement('button', {
            className: 'mb-btn' + (tier.highlight ? ' mb-btn-primary' : ''),
            onClick: function() { onSelectPlan(tier.key) }
          }, tier.key === 'free' ? '降级' : '立即升级')
    )
  })

  return React.createElement('div', { className: 'mb-benefits' }, cards)
}

export { MembershipBenefits, TIERS }