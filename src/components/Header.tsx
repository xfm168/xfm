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
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-icon">玄</span>
          <span className="logo-text">玄风门</span>
        </Link>

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
