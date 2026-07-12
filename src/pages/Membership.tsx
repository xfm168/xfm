/**
 * Membership — 会员中心页面
 * 不直接操作 localStorage，通过 hooks 管理状态
 */

import { useState, useCallback } from 'react'
import { useMembership } from '../hooks/useMembership'
import { useOrder } from '../hooks/useOrder'
import { usePoints } from '../hooks/usePoints'
import { useCoupons } from '../hooks/useCoupons'
import { usePayment } from '../hooks/usePayment'
import type { MembershipTier } from '../lib/database/types'
import type { MembershipPlan, GrowthLevel } from '../lib/business/types'
import './Membership.css'

// ── 会员计划数据 ──

var PLANS: MembershipPlan[] = [
  {
    id: 'plan_free',
    name: '免费版',
    tier: 'free',
    priceCents: 0,
    currency: 'CNY',
    durationDays: 0,
    features: ['每日卦运', '基础排盘', '单次八字'],
    maxCharts: 3,
    maxAnalyses: 1,
    aiCredits: 0,
    highlight: false,
  },
  {
    id: 'plan_basic',
    name: '基础版',
    tier: 'basic',
    priceCents: 2900,
    currency: 'CNY',
    durationDays: 30,
    features: ['每日卦运', '基础排盘', '单次八字', '保存命盘', '风水扫描'],
    maxCharts: 20,
    maxAnalyses: 10,
    aiCredits: 50,
    highlight: false,
  },
  {
    id: 'plan_premium',
    name: '高级版',
    tier: 'premium',
    priceCents: 6900,
    currency: 'CNY',
    durationDays: 30,
    features: ['每日卦运', '基础排盘', '单次八字', '保存命盘', '风水扫描', 'AI分析', '详细报告'],
    maxCharts: 100,
    maxAnalyses: 50,
    aiCredits: 200,
    highlight: true,
  },
  {
    id: 'plan_vip',
    name: '至尊版',
    tier: 'vip',
    priceCents: 12900,
    currency: 'CNY',
    durationDays: 30,
    features: ['每日卦运', '基础排盘', '单次八字', '保存命盘', '风水扫描', 'AI分析', '详细报告', '专属客服', '独家内容'],
    maxCharts: 999,
    maxAnalyses: 999,
    aiCredits: 999,
    highlight: false,
  },
]

// ── 成长等级数据 ──

var GROWTH_LEVELS: GrowthLevel[] = [
  { level: 1, title: '初学者', minPoints: 0, maxCharts: 3, aiCreditsBonus: 0, discountPercent: 0, icon: '☗' },
  { level: 2, title: '入门弟子', minPoints: 100, maxCharts: 10, aiCreditsBonus: 10, discountPercent: 5, icon: '☖' },
  { level: 3, title: '精通者', minPoints: 500, maxCharts: 50, aiCreditsBonus: 30, discountPercent: 10, icon: '☰' },
  { level: 4, title: '大师', minPoints: 2000, maxCharts: 200, aiCreditsBonus: 100, discountPercent: 15, icon: '☯' },
  { level: 5, title: '宗师', minPoints: 10000, maxCharts: 999, aiCreditsBonus: 500, discountPercent: 20, icon: '✦' },
]

// ── 等级名称映射 ──

var TIER_NAMES: Record<MembershipTier, string> = {
  'free': '免费版',
  'basic': '基础版',
  'premium': '高级版',
  'vip': '至尊版',
}

var STATUS_MAP: Record<string, string> = {
  'paid': '已支付',
  'pending': '待支付',
  'cancelled': '已取消',
  'failed': '失败',
  'refunded': '已退款',
}

// ── 工具函数 ──

function formatCents(cents: number): string {
  if (cents === 0) return '免费'
  var yuan = (cents / 100).toFixed(0)
  return '\u00A5' + yuan
}

function formatDate(iso: string | null): string {
  if (!iso) return '永久'
  var d = new Date(iso)
  var year = d.getFullYear()
  var month = d.getMonth() + 1
  var day = d.getDate()
  return year + '年' + month + '月' + day + '日'
}

function getGrowthLevel(points: number): GrowthLevel {
  var level = GROWTH_LEVELS[0]
  for (var i = 0; i < GROWTH_LEVELS.length; i++) {
    if (points >= GROWTH_LEVELS[i].minPoints) {
      level = GROWTH_LEVELS[i]
    }
  }
  return level
}

function getGrowthProgress(points: number): number {
  var level = getGrowthLevel(points)
  var currentIdx = GROWTH_LEVELS.indexOf(level)
  if (currentIdx >= GROWTH_LEVELS.length - 1) return 100
  var nextLevel = GROWTH_LEVELS[currentIdx + 1]
  var range = nextLevel.minPoints - level.minPoints
  if (range === 0) return 100
  var progress = (points - level.minPoints) / range * 100
  return Math.min(100, Math.max(0, progress))
}

function generateInviteCode(): string {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  var code = ''
  for (var i = 0; i < 8; i++) {
    var idx = Math.floor(Math.random() * chars.length)
    code = code + chars.charAt(idx)
  }
  return code
}

// ── 组件 ──

export default function Membership() {
  var membership = useMembership()
  var orderHook = useOrder()
  var pointsHook = usePoints()
  var couponsHook = useCoupons()
  var paymentHook = usePayment()

  var couponInputHook = useState('')
  var couponInput = couponInputHook[0]
  var setCouponInput = couponInputHook[1]

  var inviteCodeHook = useState(function() { return generateInviteCode() })
  var inviteCode = inviteCodeHook[0]

  var copiedHook = useState(false)
  var copied = copiedHook[0]
  var setCopied = copiedHook[1]

  // 复制邀请码
  var handleCopyInvite = useCallback(function() {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(inviteCode)
      } else {
        var textarea = document.createElement('textarea')
        textarea.value = inviteCode
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      setTimeout(function() { setCopied(false) }, 2000)
    } catch {
      // 静默失败
    }
  }, [inviteCode])

  // 兑换优惠券
  var handleApplyCoupon = useCallback(function() {
    if (!couponInput.trim()) return
    couponsHook.applyCoupon(couponInput)
    setCouponInput('')
  }, [couponInput, couponsHook])

  // 升级计划
  var handleUpgrade = useCallback(function(plan: MembershipPlan) {
    if (plan.tier === 'free') return
    if (plan.tier === membership.membership.tier) return

    // 创建订单
    var newOrder = orderHook.createOrder('membership', plan.id, plan.priceCents)
    if (!newOrder) return

    // 创建支付会话（模拟微信支付）
    var session = paymentHook.createPaymentSession(newOrder, 'wechat')
    if (!session) return

    // 模拟支付轮询
    paymentHook.pollPaymentStatus().then(function(result) {
      if (result && result.status === 'paid') {
        membership.upgradePlan(plan)
        pointsHook.addPoints(
          Math.floor(plan.priceCents / 100),
          'purchase',
          '购买 ' + plan.name + ' 会员'
        )
      }
    })
  }, [membership, orderHook, paymentHook, pointsHook])

  var currentPlan = membership.membership.plan
  var growthLevel = getGrowthLevel(pointsHook.balance)
  var growthProgress = getGrowthProgress(pointsHook.balance)

  return (
    <div className="membership-page">
      <h1 className="membership-page-title">
        <span>会员</span>中心
      </h1>

      {/* ── 当前会员状态卡片 ── */}
      <div className="membership-status-card">
        <div className="membership-status-header">
          <span className={'membership-tier-badge ' + (membership.membership.tier === 'free' ? 'tier-free' : '')}>
            {TIER_NAMES[membership.membership.tier]}
          </span>
          <button
            className="membership-invite-copy-btn"
            onClick={membership.refreshMembership}
            style={{ fontSize: '0.75rem', padding: '4px 12px' }}
          >
            刷新
          </button>
        </div>
        <div className="membership-status-details">
          <div className="membership-detail-item">
            <span className="membership-detail-label">当前等级</span>
            <span className="membership-detail-value">
              {growthLevel.icon} {growthLevel.title}
            </span>
          </div>
          <div className="membership-detail-item">
            <span className="membership-detail-label">到期时间</span>
            <span className={'membership-detail-value ' + (membership.membership.daysRemaining <= 0 && membership.membership.tier !== 'free' ? 'expired' : membership.membership.daysRemaining <= 7 ? 'expiring' : '')}>
              {formatDate(membership.membership.expiresAt)}
            </span>
          </div>
          <div className="membership-detail-item">
            <span className="membership-detail-label">剩余天数</span>
            <span className={'membership-detail-value ' + (membership.membership.daysRemaining <= 0 && membership.membership.tier !== 'free' ? 'expired' : membership.membership.daysRemaining <= 7 ? 'expiring' : '')}>
              {membership.membership.tier === 'free' ? '--' : membership.membership.daysRemaining + ' 天'}
            </span>
          </div>
          <div className="membership-detail-item">
            <span className="membership-detail-label">积分余额</span>
            <span className="membership-detail-value gold-text">
              {pointsHook.balance}
            </span>
          </div>
        </div>
      </div>

      {/* ── 成长等级进度条 ── */}
      <div className="membership-growth">
        <h3 className="membership-section-title">成长等级</h3>
        <div className="membership-growth-bar">
          <div className="membership-growth-labels">
            <span>{growthLevel.icon} {growthLevel.title}</span>
            <span>{pointsHook.balance} 积分</span>
          </div>
          <div className="membership-growth-track">
            <div
              className="membership-growth-fill"
              style={{ width: String(growthProgress) + '%' }}
            />
          </div>
          <div className="membership-growth-info">
            <span>
              {growthLevel.icon} Lv.{growthLevel.level} {growthLevel.title}
            </span>
            <span>
              下级还需 {growthProgress >= 100 ? 0 : Math.ceil(GROWTH_LEVELS[Math.min(GROWTH_LEVELS.indexOf(growthLevel) + 1, GROWTH_LEVELS.length - 1)].minPoints - pointsHook.balance)} 积分
            </span>
          </div>
        </div>
      </div>

      {/* ── 积分余额 ── */}
      <div className="membership-points-row">
        <div className="membership-points-icon">✦</div>
        <div className="membership-points-content">
          <div className="membership-points-label">可用积分</div>
          <div className="membership-points-value">{pointsHook.balance}</div>
        </div>
      </div>

      {/* ── 会员计划对比 ── */}
      <div className="membership-plans">
        <h2 className="membership-plans-title">会员计划</h2>
        <div className="membership-plans-grid">
          {PLANS.map(function(plan) {
            var isActive = currentPlan && currentPlan.id === plan.id
            var isCurrentTier = membership.membership.tier === plan.tier
            var isHigherTier = !isCurrentTier && plan.tier !== 'free'

            return (
              <div
                key={plan.id}
                className={
                  'membership-plan-card' +
                  (isActive || isCurrentTier ? ' active' : '') +
                  (plan.highlight ? ' recommended' : '')
                }
              >
                <div className="membership-plan-name">{plan.name}</div>
                <div className="membership-plan-price">{formatCents(plan.priceCents)}</div>
                <div className="membership-plan-price-unit">
                  {plan.priceCents === 0 ? '永久免费' : plan.durationDays + '天'}
                </div>
                <div className="membership-plan-duration">
                  {plan.priceCents === 0 ? '' : '约 ' + formatCents(Math.round(plan.priceCents / plan.durationDays * 30)) + '/月'}
                </div>
                <ul className="membership-plan-features">
                  {plan.features.map(function(feat) {
                    return <li key={feat}>{feat}</li>
                  })}
                </ul>
                <button
                  className={
                    'membership-plan-btn' +
                    (isActive || isCurrentTier ? ' active' : '')
                  }
                  disabled={isCurrentTier || plan.tier === 'free'}
                  onClick={function() { handleUpgrade(plan) }}
                >
                  {isCurrentTier ? '当前方案' : (isActive ? '当前方案' : '升级')}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 邀请码区域 ── */}
      <div className="membership-invite">
        <h3 className="membership-section-title">邀请好友</h3>
        <p className="membership-invite-desc">
          分享您的专属邀请码，好友注册后双方均可获得积分奖励
        </p>
        <div className="membership-invite-code-box">
          <div className="membership-invite-code">{inviteCode}</div>
          <button className="membership-invite-copy-btn" onClick={handleCopyInvite}>
            {copied ? '已复制' : '复制邀请码'}
          </button>
        </div>
      </div>

      {/* ── 优惠券区域 ── */}
      <div className="membership-coupon">
        <h3 className="membership-section-title">优惠券</h3>
        <p className="membership-coupon-desc">
          输入优惠券码，享受专属折扣
        </p>
        <div className="membership-coupon-input-row">
          <input
            className="membership-coupon-input"
            type="text"
            placeholder="请输入优惠券码"
            value={couponInput}
            onChange={function(e) { setCouponInput(e.target.value) }}
            onKeyDown={function(e) { if (e.key === 'Enter') handleApplyCoupon() }}
          />
          <button
            className="membership-coupon-btn"
            onClick={handleApplyCoupon}
            disabled={!couponInput.trim()}
          >
            兑换
          </button>
        </div>
        {couponsHook.error && (
          <div className="membership-coupon-error">{couponsHook.error}</div>
        )}
        {couponsHook.coupons.length > 0 && (
          <div className="membership-coupon-list">
            {couponsHook.coupons.map(function(coupon) {
              var desc = coupon.discountType === 'percent'
                ? coupon.discountValue + '% 折扣'
                : '\u00A5' + (coupon.discountValue / 100).toFixed(0) + ' 优惠'
              return (
                <div className="membership-coupon-item" key={coupon.id}>
                  <span className="membership-coupon-item-code">{coupon.code}</span>
                  <span className="membership-coupon-item-desc">{desc}</span>
                  <span className="membership-coupon-item-expiry">
                    {formatDate(coupon.validUntil)} 到期
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 购买记录 ── */}
      <div className="membership-orders">
        <h3 className="membership-section-title">购买记录</h3>
        {orderHook.orders.length === 0 ? (
          <div className="membership-empty">暂无购买记录</div>
        ) : (
          <div className="membership-orders-list">
            {orderHook.orders.map(function(order) {
              return (
                <div className="membership-order-item" key={order.id}>
                  <div className="membership-order-left">
                    <span className="membership-order-name">{order.productName}</span>
                    <span className="membership-order-time">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="membership-order-right">
                    <span className="membership-order-amount">
                      {formatCents(order.amount_cents)}
                    </span>
                    <span className={'membership-order-status ' + order.status}>
                      {STATUS_MAP[order.status] || order.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 支付状态弹窗 ── */}
      {paymentHook.status === 'processing' && (
        <div className="membership-payment-overlay">
          <div className="membership-payment-modal">
            <div className="membership-payment-spinner" />
            <div className="membership-payment-text">支付处理中...</div>
            <div className="membership-payment-subtext">请稍候，正在模拟支付</div>
          </div>
        </div>
      )}

      {paymentHook.status === 'success' && (
        <div className="membership-payment-overlay">
          <div className="membership-payment-modal">
            <div className="membership-payment-success">✓</div>
            <div className="membership-payment-text">支付成功</div>
            <div className="membership-payment-subtext">会员已升级</div>
            <button className="membership-payment-close-btn" onClick={paymentHook.reset}>
              确定
            </button>
          </div>
        </div>
      )}

      {paymentHook.status === 'error' && paymentHook.error && (
        <div className="membership-payment-overlay">
          <div className="membership-payment-modal">
            <div className="membership-payment-error-text">{paymentHook.error}</div>
            <button className="membership-payment-close-btn" onClick={paymentHook.reset}>
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
