/**
 * TrialEntry 免费体验入口组件
 * 根据用户登录状态和会员等级显示不同的 CTA
 */
import React from 'react'
import './TrialEntry.css'

type UserStatus = 'guest' | 'free' | 'member'

interface TrialEntryProps {
  userStatus?: UserStatus
  onRegister?: () => void
  onStartTrial?: () => void
  onViewReports?: () => void
}

function TrialEntry(props: TrialEntryProps) {
  var userStatus = props.userStatus || 'guest'
  var onRegister = props.onRegister || function() {}
  var onStartTrial = props.onStartTrial || function() {}
  var onViewReports = props.onViewReports || function() {}

  var config = {
    guest: {
      icon: '\u2728',
      headline: '开启您的命理探索之旅',
      subtitle: '免费注册，即刻体验八字排盘与国学推演',
      btnText: '免费注册',
      btnClass: 'te-btn-gold',
      onClick: onRegister,
    },
    free: {
      icon: '\u2630',
      headline: '立即免费排盘',
      subtitle: '今日剩余次数可用，一键获取您的八字命理报告',
      btnText: '立即免费排盘',
      btnClass: 'te-btn-gold',
      onClick: onStartTrial,
    },
    member: {
      icon: '\u2606',
      headline: '欢迎回来',
      subtitle: '查看您的专属命理报告与深度推演解读',
      btnText: '查看我的报告',
      btnClass: 'te-btn-outline',
      onClick: onViewReports,
    },
  }

  var current = config[userStatus]

  return React.createElement('div', { className: 'te-card' },
    React.createElement('div', { className: 'te-glow' }),
    React.createElement('div', { className: 'te-content' },
      React.createElement('div', { className: 'te-icon' }, current.icon),
      React.createElement('h2', { className: 'te-headline' }, current.headline),
      React.createElement('p', { className: 'te-subtitle' }, current.subtitle),
      React.createElement('button', { className: 'te-btn ' + current.btnClass, onClick: current.onClick },
        current.btnText
      ),
      userStatus === 'guest'
        ? React.createElement('p', { className: 'te-note' }, '注册即享每日 3 次免费排盘')
        : null
    )
  )
}

export { TrialEntry }
