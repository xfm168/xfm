import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Header.css'

const menuItems = [
  { name: '今日卦运', path: '/daily', icon: '☯' },
  { name: '六爻占卜', path: '/liuyao', icon: '☰' },
  { name: '风水堪测', path: '/fengshui', icon: '⌂' },
  { name: '八字命理', path: '/bazi', icon: '☷' },
  { name: '会员中心', path: '/membership', icon: '✦' },
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
      <div className="header-inner">
        {/* Logo */}
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">☯</span>
          <span className="logo-text">玄风门</span>
        </Link>

        {/* Right: Profile button */}
        <Link to="/profile" className="profile-btn">
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
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

        {/* Mobile nav */}
        <nav className={`nav ${menuOpen ? 'open' : ''}`}>
          <ul className="nav-list">
            {menuItems.map((item) => (
              <li key={item.name}>
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
