/**
 * Login 页面 — 登录/注册
 * 支持邮箱密码、OTP、社交登录
 * 使用单引号 + concatenation
 */

import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { SocialProvider } from '../hooks/useAuth'
import './Login.css'

type LoginMode = 'password' | 'otp'

function Login() {
  var navigate = useNavigate()
  var auth = useAuth()

  var modeHook = useState<LoginMode>('password')
  var mode = modeHook[0]
  var setMode = modeHook[1]

  var isRegisterHook = useState(false)
  var isRegister = isRegisterHook[0]
  var setIsRegister = isRegisterHook[1]

  var emailHook = useState('')
  var email = emailHook[0]
  var setEmail = emailHook[1]

  var passwordHook = useState('')
  var password = passwordHook[0]
  var setPassword = passwordHook[1]

  var usernameHook = useState('')
  var username = usernameHook[0]
  var setUsername = usernameHook[1]

  var otpHook = useState('')
  var otp = otpHook[0]
  var setOtp = otpHook[1]

  var otpSentHook = useState(false)
  var otpSent = otpSentHook[0]
  var setOtpSent = otpSentHook[1]

  var otpCountdownHook = useState(0)
  var otpCountdown = otpCountdownHook[0]
  var setOtpCountdown = otpCountdownHook[1]

  var handleSubmit = useCallback(async function() {
    if (isRegister) {
      var ok = await auth.register(email, password)
      if (ok) {
        navigate('/user-center')
      }
      return
    }

    if (mode === 'password') {
      var ok2 = await auth.login(email, password)
      if (ok2) {
        navigate('/user-center')
      }
    } else {
      var ok3 = await auth.verifyOtp(email, otp)
      if (ok3) {
        navigate('/user-center')
      }
    }
  }, [isRegister, mode, email, password, username, otp, auth, navigate])

  var handleSendOTP = useCallback(function() {
    if (!email) return
    setOtpSent(true)
    setOtpCountdown(60)
    var timer = setInterval(function() {
      setOtpCountdown(function(prev) {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [email])

  var handleSocialLogin = useCallback(async function(provider: SocialProvider) {
    var ok = await auth.loginWithSocial(provider)
    if (ok) {
      navigate('/user-center')
    }
  }, [auth, navigate])

  if (auth.isAuthenticated) {
    navigate('/user-center')
    return null
  }

  return React.createElement('div', { className: 'login-page' },
    React.createElement('div', { className: 'login-card' },
      React.createElement('h1', null, isRegister ? '注册账号' : '欢迎回来'),
      React.createElement('p', { className: 'login-subtitle' },
        isRegister
          ? '创建旋风门账号，开始您的命理之旅'
          : '登录旋风门，探索命理奥秘'
      ),

      auth.error && React.createElement('div', { className: 'login-error' }, auth.error),

      // 登录模式切换（非注册时显示）
      !isRegister && React.createElement('div', { className: 'login-mode-tabs' },
        React.createElement('button', {
          className: 'login-mode-tab' + (mode === 'password' ? ' active' : ''),
          onClick: function() { setMode('password') }
        }, '密码登录'),
        React.createElement('button', {
          className: 'login-mode-tab' + (mode === 'otp' ? ' active' : ''),
          onClick: function() { setMode('otp') }
        }, '验证码登录')
      ),

      React.createElement('div', { className: 'login-form' },
        // 邮箱
        React.createElement('div', { className: 'login-field' },
          React.createElement('label', null, '邮箱'),
          React.createElement('input', {
            className: 'login-input',
            type: 'email',
            placeholder: '请输入邮箱',
            value: email,
            onChange: function(e) { setEmail(e.target.value) }
          })
        ),

        // 密码模式
        mode === 'password' && React.createElement('div', { className: 'login-field' },
          React.createElement('label', null, '密码'),
          React.createElement('input', {
            className: 'login-input',
            type: 'password',
            placeholder: isRegister ? '设置密码（至少6位）' : '请输入密码',
            value: password,
            onChange: function(e) { setPassword(e.target.value) }
          })
        ),

        // 注册时额外用户名
        isRegister && React.createElement('div', { className: 'login-field' },
          React.createElement('label', null, '用户名'),
          React.createElement('input', {
            className: 'login-input',
            type: 'text',
            placeholder: '请输入用户名（可选）',
            value: username,
            onChange: function(e) { setUsername(e.target.value) }
          })
        ),

        // OTP 模式
        mode === 'otp' && React.createElement('div', { className: 'login-field' },
          React.createElement('label', null, '验证码'),
          React.createElement('div', { className: 'login-otp-row' },
            React.createElement('input', {
              className: 'login-input',
              type: 'text',
              placeholder: '6位验证码',
              maxLength: 6,
              value: otp,
              onChange: function(e) { setOtp(e.target.value.replace(/\D/g, '')) }
            }),
            React.createElement('button', {
              className: 'login-send-otp',
              disabled: otpCountdown > 0 || !email,
              onClick: handleSendOTP
            }, otpCountdown > 0 ? otpCountdown + 's' : '发送验证码')
          )
        ),

        // 提交
        React.createElement('button', {
          className: 'login-submit',
          disabled: auth.loading,
          onClick: handleSubmit
        }, auth.loading ? '处理中...' : isRegister ? '注册' : '登录')
      ),

      // 社交登录
      !isRegister && React.createElement(React.Fragment, null,
        React.createElement('div', { className: 'login-divider' },
          React.createElement('span', null, '或使用以下方式登录')
        ),
        React.createElement('div', { className: 'login-social-btns' },
          React.createElement('button', {
            className: 'login-social-btn wechat',
            onClick: function() { handleSocialLogin('wechat') }
          },
            React.createElement('span', { className: 'social-icon' }, '\u5FAE\u4FE1'),
            '微信登录'
          ),
          React.createElement('button', {
            className: 'login-social-btn google',
            onClick: function() { handleSocialLogin('google') }
          },
            React.createElement('span', { className: 'social-icon' }, 'G'),
            'Google 登录'
          ),
          React.createElement('button', {
            className: 'login-social-btn apple',
            onClick: function() { handleSocialLogin('apple') }
          },
            React.createElement('span', { className: 'social-icon' }, '\uF8FF'),
            'Apple 登录'
          )
        )
      ),

      // 切换登录/注册
      React.createElement('div', { className: 'login-switch' },
        isRegister ? '已有账号？' : '没有账号？',
        React.createElement('a', {
          className: 'login-switch-link',
          onClick: function() {
            setIsRegister(!isRegister)
            auth.error && auth.error.length > 0 && void 0
          }
        }, isRegister ? '立即登录' : '立即注册')
      )
    )
  )
}

export default Login
