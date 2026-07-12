/**
 * AuthGuard — 路由权限守卫
 * 临时方案：检查 localStorage 中是否有管理员标记
 * 未来应替换为真实的 Supabase JWT 鉴权
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
}

function isAdmin(): boolean {
  try {
    var token = localStorage.getItem('xuanfengmen_admin_token')
    if (!token) return false
    var parts = token.split('.')
    if (parts.length !== 3) return false
    var payload = JSON.parse(atob(parts[1]))
    return payload.role === 'admin' && payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export default function AuthGuard({ children, requireAdmin }: AuthGuardProps) {
  var navigate = useNavigate()
  var [authorized, setAuthorized] = useState(false)
  var [checking, setChecking] = useState(true)

  useEffect(function() {
    if (requireAdmin && !isAdmin()) {
      navigate('/')
    } else {
      setAuthorized(true)
    }
    setChecking(false)
  }, [navigate, requireAdmin])

  if (checking) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: '#999',
        fontSize: '14px'
      }}>
        验证权限中...
      </div>
    )
  }

  if (!authorized) {
    return null
  }

  return <>{children}</>
}
