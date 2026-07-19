/**
 * UserCenter 用户中心
 * Tab 导航: 概览 | 我的分析 | 订单管理 | 支付记录 | 会员信息 | 积分 | 优惠券 | 邀请奖励
 * 使用单引号 + concatenation
 */

import React, { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useOrder } from '../hooks/useOrder'
import { usePoints } from '../hooks/usePoints'
import { useCoupons } from '../hooks/useCoupons'
import { useMembership } from '../hooks/useMembership'
import { getPlan, calculateDaysRemaining, isExpired } from '../lib/business/membershipV2'
import './UserCenter.css'

var TABS = [
  { key: 'overview', label: '概览' },
  { key: 'analysis', label: '我的分析' },
  { key: 'orders', label: '订单管理' },
  { key: 'payments', label: '支付记录' },
  { key: 'membership', label: '会员信息' },
  { key: 'points', label: '积分' },
  { key: 'coupons', label: '优惠券' },
  { key: 'invite', label: '邀请奖励' }
]

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  var d = new Date(dateStr)
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' +
    String(d.getMinutes()).padStart(2, '0')
}

function formatMoney(cents: number): string {
  return '\u00A5' + (cents / 100).toFixed(2)
}

function getStatusLabel(status: string): string {
  var labels: Record<string, string> = {
    'pending': '待支付',
    'paid': '已支付',
    'completed': '已完成',
    'failed': '失败',
    'refunding': '退款中',
    'refunded': '已退款',
    'cancelled': '已取消',
    'expired': '已过期',
    'created': '已创建'
  }
  return labels[status] || status
}

function UserCenter() {
  var navigate = useNavigate()
  var auth = useAuth()
  var orderHook = useOrder()
  var pointsHook = usePoints()
  var couponsHook = useCoupons()
  var membershipHook = useMembership()

  var tabHook = useState('overview')
  var activeTab = tabHook[0]
  var setActiveTab = tabHook[1]

  // 分析历史数据（从 API 加载）
  var analysisHook = useState([])
  var analysisData = analysisHook[0]
  var setAnalysisData = analysisHook[1]
  var analysisLoadingHook = useState(true)
  var analysisLoading = analysisLoadingHook[0]
  var setAnalysisLoading = analysisLoadingHook[1]

  // 支付记录数据（从 API 加载）
  var paymentHook = useState([])
  var paymentData = paymentHook[0]
  var setPaymentData = paymentHook[1]
  var paymentLoadingHook = useState(true)
  var paymentLoading = paymentLoadingHook[0]
  var setPaymentLoading = paymentLoadingHook[1]

  // 邀请奖励数据（从 API 加载）
  var inviteHook = useState({ inviteCode: '', inviteeCount: 0 })
  var inviteData = inviteHook[0]
  var setInviteData = inviteHook[1]

  function getToken() {
    try {
      var raw = localStorage.getItem('sb-xuanfengmen-auth-token')
      if (raw) {
        var parsed = JSON.parse(raw)
        return parsed.access_token || ''
      }
    } catch (e) {}
    return ''
  }

  // 加载分析历史数据
  useEffect(function() {
    if (activeTab !== 'analysis') return
    setAnalysisLoading(true)
    fetch('/api/history', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
      .then(function(r) { return r.json() })
      .then(function(json) {
        setAnalysisData(json.data || json.history || json.items || [])
      })
      .catch(function() {})
      .finally(function() { setAnalysisLoading(false) })
  }, [activeTab])

  // 加载支付记录数据
  useEffect(function() {
    if (activeTab !== 'payments') return
    setPaymentLoading(true)
    fetch('/api/user/payments', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
      .then(function(r) { return r.json() })
      .then(function(json) {
        setPaymentData(json.payments || [])
      })
      .catch(function() {})
      .finally(function() { setPaymentLoading(false) })
  }, [activeTab])

  // 加载邀请奖励数据
  useEffect(function() {
    if (activeTab !== 'invite') return
    fetch('/api/user/invite', {
      headers: { 'Authorization': 'Bearer ' + getToken() }
    })
      .then(function(r) { return r.json() })
      .then(function(json) {
        if (json.success) {
          setInviteData({ inviteCode: json.inviteCode || '', inviteeCount: json.inviteeCount || 0 })
        }
      })
      .catch(function() {})
  }, [activeTab])

  var handleLogout = useCallback(function() {
    auth.logout()
    navigate('/')
  }, [auth, navigate])

  if (!auth.isAuthenticated || !auth.user) {
    return React.createElement('div', { className: 'user-center-page' },
      React.createElement('h1', null, '用户中心'),
      React.createElement('div', { className: 'uc-login-prompt' },
        React.createElement('p', null, '请先登录后查看用户中心'),
        React.createElement('button', {
          className: 'uc-login-btn',
          onClick: function() { navigate('/login') }
        }, '立即登录')
      )
    )
  }

  var user = auth.user
  var profile = auth.profile
  var tierLabel: Record<string, string> = {
    'free': 'Free',
    'basic': 'Basic',
    'premium': 'Premium',
    'vip': 'VIP'
  }

  var tierClass = profile ? profile.membership_tier : 'free'

  /* ==================== Tab 渲染函数 ==================== */

  var renderOverview = function() {
    return React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'uc-stats-grid' },
        React.createElement('div', { className: 'uc-stat-card' },
          React.createElement('div', { className: 'uc-stat-value' }, profile ? profile.total_analyses : 0),
          React.createElement('div', { className: 'uc-stat-label' }, '总分析次数')
        ),
        React.createElement('div', { className: 'uc-stat-card' },
          React.createElement('div', { className: 'uc-stat-value' }, profile ? profile.total_charts : 0),
          React.createElement('div', { className: 'uc-stat-label' }, '命盘数量')
        ),
        React.createElement('div', { className: 'uc-stat-card' },
          React.createElement('div', { className: 'uc-stat-value' }, pointsHook.balance),
          React.createElement('div', { className: 'uc-stat-label' }, '积分余额')
        ),
        React.createElement('div', { className: 'uc-stat-card' },
          React.createElement('div', { className: 'uc-stat-value' }, formatMoney(profile ? profile.total_spent_cents : 0)),
          React.createElement('div', { className: 'uc-stat-label' }, '总消费')
        )
      )
    )
  }

  var renderAnalysis = function() {
    if (analysisLoading) {
      return React.createElement(React.Fragment, null,
        React.createElement('h2', null, '分析历史'),
        React.createElement('div', { className: 'uc-empty' }, '加载中...')
      )
    }
    if (analysisData.length === 0) {
      return React.createElement(React.Fragment, null,
        React.createElement('h2', null, '分析历史'),
        React.createElement('div', { className: 'uc-empty' }, '暂无分析记录')
      )
    }
    return React.createElement(React.Fragment, null,
      React.createElement('h2', null, '分析历史'),
      React.createElement('div', { className: 'uc-list' },
        analysisData.map(function(item) {
          return React.createElement('div', { key: item.id, className: 'uc-list-item' },
            React.createElement('div', { className: 'uc-list-title' }, item.type || item.analysis_type || '分析'),
            React.createElement('div', { className: 'uc-list-meta' }, item.date || item.created_at || ''),
            React.createElement('span', { className: 'uc-status ' + (item.status || 'completed') }, getStatusLabel(item.status || 'completed')),
            React.createElement('button', { className: 'uc-action-btn' }, '查看')
          )
        })
      )
    )
  }

  var renderOrders = function() {
    var orders = orderHook.orders
    if (orders.length === 0) {
      return React.createElement(React.Fragment, null,
        React.createElement('h2', null, '订单管理'),
        React.createElement('div', { className: 'uc-empty' }, '暂无订单记录')
      )
    }
    return React.createElement(React.Fragment, null,
      React.createElement('h2', null, '订单管理'),
      React.createElement('div', { className: 'uc-list' },
        orders.slice(0, 20).map(function(order) {
          return React.createElement('div', { key: order.id, className: 'uc-list-item' },
            React.createElement('div', { className: 'uc-list-title' },
              order.productName,
              React.createElement('br', null),
              React.createElement('small', { style: { color: '#6B7D94' } }, order.order_no)
            ),
            React.createElement('div', { className: 'uc-list-meta' }, formatDate(order.created_at)),
            React.createElement('div', { className: 'uc-list-amount' }, formatMoney(order.amount_cents)),
            React.createElement('span', { className: 'uc-status ' + order.status }, getStatusLabel(order.status)),
            React.createElement('button', { className: 'uc-action-btn' }, '详情')
          )
        })
      )
    )
  }

  var renderPayments = function() {
    if (paymentLoading) {
      return React.createElement(React.Fragment, null,
        React.createElement('h2', null, '支付记录'),
        React.createElement('div', { className: 'uc-empty' }, '加载中...')
      )
    }
    if (paymentData.length === 0) {
      return React.createElement(React.Fragment, null,
        React.createElement('h2', null, '支付记录'),
        React.createElement('div', { className: 'uc-empty' }, '暂无支付记录')
      )
    }
    return React.createElement(React.Fragment, null,
      React.createElement('h2', null, '支付记录'),
      React.createElement('div', { className: 'uc-list' },
        paymentData.map(function(item) {
          return React.createElement('div', { key: item.id, className: 'uc-list-item' },
            React.createElement('div', { className: 'uc-list-title' }, item.method || item.payment_method || '支付'),
            React.createElement('div', { className: 'uc-list-meta' }, item.time || item.created_at || ''),
            React.createElement('div', { className: 'uc-list-amount' }, formatMoney(item.amount || item.amount_cents || 0)),
            React.createElement('span', { className: 'uc-status ' + (item.status || 'paid') }, getStatusLabel(item.status || 'paid'))
          )
        })
      )
    )
  }

  var renderMembership = function() {
    var tier = membershipHook.membership.tier
    var expiresAt = membershipHook.membership.expiresAt
    var daysLeft = calculateDaysRemaining(expiresAt)
    var expired = tier !== 'free' && isExpired(expiresAt)
    var tierName = tierLabel[tier] || tier
    var plan = getPlan(tier as any)

    var features = plan ? plan.features : []

    return React.createElement(React.Fragment, null,
      React.createElement('div', { className: 'uc-membership-card' },
        React.createElement('div', { className: 'uc-membership-tier-name' }, tierName + ' 会员'),
        React.createElement('div', { className: 'uc-membership-expires' },
          tier === 'free'
            ? '免费版 — 无到期限制'
            : expired
              ? '已过期'
              : '到期时间: ' + formatDate(expiresAt || '') + '（剩余 ' + daysLeft + ' 天）'
        ),
        features.length > 0 && React.createElement('ul', {
          style: { listStyle: 'none', padding: 0, margin: '0 0 16px 0' }
        },
          features.map(function(f, i) {
            return React.createElement('li', {
              key: i,
              style: {
                fontSize: '14px',
                color: '#B8C4D6',
                padding: '4px 0',
                borderBottom: '1px solid rgba(212,175,55,0.08)'
              }
            }, '\u2713 ' + f)
          })
        ),
        tier === 'free' && React.createElement('button', {
          className: 'uc-upgrade-btn',
          onClick: function() { navigate('/membership') }
        }, '升级会员')
      )
    )
  }

  var renderPoints = function() {
    return React.createElement(React.Fragment, null,
      React.createElement('h2', null, '积分'),
      React.createElement('div', { className: 'uc-points-balance' },
        React.createElement('div', { className: 'uc-points-number' }, pointsHook.balance),
        React.createElement('div', { className: 'uc-points-label' }, '可用积分')
      ),
      React.createElement('h2', { style: { fontSize: '16px' } }, '积分明细'),
      pointsHook.transactions.length > 0
        ? React.createElement('div', { className: 'uc-list' },
            pointsHook.transactions.slice(0, 20).map(function(tx) {
              return React.createElement('div', { key: tx.id, className: 'uc-list-item' },
                React.createElement('div', { className: 'uc-list-title' }, tx.description),
                React.createElement('div', { className: 'uc-list-meta' }, formatDate(tx.createdAt)),
                React.createElement('div', {
                  className: 'uc-list-amount',
                  style: { color: tx.amount > 0 ? '#6B9E7A' : '#C46060' }
                }, (tx.amount > 0 ? '+' : '') + tx.amount),
                React.createElement('div', { className: 'uc-list-meta' }, '余额: ' + tx.balanceAfter)
              )
            })
          )
        : React.createElement('div', { className: 'uc-empty' }, '暂无积分记录')
    )
  }

  var renderCoupons = function() {
    var coupons = couponsHook.coupons
    if (coupons.length === 0) {
      return React.createElement(React.Fragment, null,
        React.createElement('h2', null, '优惠券'),
        React.createElement('div', { className: 'uc-empty' }, '暂无优惠券，可在会员页面获取')
      )
    }
    return React.createElement(React.Fragment, null,
      React.createElement('h2', null, '优惠券'),
      React.createElement('div', { className: 'uc-coupon-grid' },
        coupons.map(function(coupon) {
          return React.createElement('div', {
            key: coupon.id,
            className: 'uc-coupon-card' + (coupon.usageCount >= coupon.usageLimit ? ' used' : '')
          },
            React.createElement('div', { className: 'uc-coupon-value' },
              coupon.discountType === 'percent'
                ? coupon.discountValue + '% 折扣'
                : '\u00A5' + (coupon.discountValue / 100).toFixed(0) + ' 优惠'
            ),
            React.createElement('div', { className: 'uc-coupon-code' }, coupon.code),
            React.createElement('div', { className: 'uc-coupon-expire' },
              '有效期至 ' + formatDate(coupon.validUntil)
            )
          )
        })
      )
    )
  }

  var renderInvite = function() {
    return React.createElement(React.Fragment, null,
      React.createElement('h2', null, '邀请奖励'),
      React.createElement('div', { className: 'uc-invite-section' },
        React.createElement('div', { style: { marginBottom: '12px', color: '#B8C4D6' } }, '您的专属邀请码'),
        React.createElement('div', { className: 'uc-invite-code' }, inviteData.inviteCode || '-'),
        React.createElement('div', { className: 'uc-invite-stats' },
          '邀请好友注册，双方各获得 200 积分奖励'
        )
      ),
      React.createElement('div', { className: 'uc-stats-grid' },
        React.createElement('div', { className: 'uc-stat-card' },
          React.createElement('div', { className: 'uc-stat-value' }, '' + inviteData.inviteeCount),
          React.createElement('div', { className: 'uc-stat-label' }, '成功邀请')
        ),
        React.createElement('div', { className: 'uc-stat-card' },
          React.createElement('div', { className: 'uc-stat-value' }, '' + (inviteData.inviteeCount * 200)),
          React.createElement('div', { className: 'uc-stat-label' }, '获得积分')
        )
      )
    )
  }

  var renderTabContent = function() {
    switch (activeTab) {
      case 'overview': return renderOverview()
      case 'analysis': return renderAnalysis()
      case 'orders': return renderOrders()
      case 'payments': return renderPayments()
      case 'membership': return renderMembership()
      case 'points': return renderPoints()
      case 'coupons': return renderCoupons()
      case 'invite': return renderInvite()
      default: return renderOverview()
    }
  }

  var avatarLetter = profile && profile.display_name ? profile.display_name.charAt(0).toUpperCase() : '?'

  return React.createElement('div', { className: 'user-center-page' },
    React.createElement('h1', null, '用户中心'),

    // 用户信息头部
    React.createElement('div', { className: 'uc-profile-header' },
      React.createElement('div', { className: 'uc-avatar' }, avatarLetter),
      React.createElement('div', { className: 'uc-profile-info' },
        React.createElement('div', { className: 'uc-profile-name' }, profile && profile.display_name ? profile.display_name : '用户'),
        React.createElement('div', { className: 'uc-profile-email' }, user.email),
        React.createElement('span', { className: 'uc-profile-tier ' + tierClass },
          tierLabel[profile ? profile.membership_tier : 'free'] || (profile ? profile.membership_tier : 'free')
        )
      ),
      React.createElement('button', {
        className: 'uc-logout-btn',
        onClick: handleLogout
      }, '退出登录')
    ),

    // Tab 导航
    React.createElement('div', { className: 'uc-tab-nav' },
      TABS.map(function(tab) {
        return React.createElement('button', {
          key: tab.key,
          className: 'uc-tab-btn' + (activeTab === tab.key ? ' active' : ''),
          onClick: function() { setActiveTab(tab.key) }
        }, tab.label)
      })
    ),

    // Tab 内容
    React.createElement('div', { className: 'uc-tab-content' }, renderTabContent())
  )
}

export default UserCenter
