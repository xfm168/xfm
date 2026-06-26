import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Header.css'

const menuItems = [
  { name: '今日卦运', path: '/daily', icon: '☯' },
  { name: '问事起卦', path: '/liuyao', icon: '☰' },
  { name: '风水勘测', path: '/fengshui', icon: '⌂' },
  { name: '卦运记录', path: '/records', icon: '☷' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/fengshui') {
      return location.pathname === '/fengshui' || location.pathname === '/analysis'
    }
    return location.pathname === path
  }

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo with taiji symbol */}
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-taiji">
            <svg viewBox="0 0 40 40" width="32" height="32">
              <circle cx="20" cy="20" r="18" fill="url(#logoGrad)" />
              <path d="M20 2 A 18 18 0 0 1 20 38 A 9 9 0 0 1 20 20 A 9 9 0 0 0 20 2 Z" fill="#0b172e" />
              <circle cx="20" cy="11" r="3" fill="url(#logoGrad)" />
              <circle cx="20" cy="29" r="3" fill="#0b172e" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f5e6b8" />
                  <stop offset="50%" stopColor="#c9a24a" />
                  <stop offset="100%" stopColor="#92630a" />
                </linearGradient>
              </defs>
            </svg>
          </span>
          <span className="logo-text">玄风门</span>
        </Link>

        {/* Right side - "我的" button */}
        <Link to="/profile" className="profile-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.2" />
            <path d="M2 14 C 2 10 5 9 8 9 C 11 9 14 10 14 14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>我的</span>
        </Link>

        {/* Mobile menu toggle */}
        <button
          className={`menu-toggle ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="菜单"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.name} className="nav-item">
                <Link
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
