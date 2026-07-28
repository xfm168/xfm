import { useState, useEffect, ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Coins,
  Home,
  Archive,
  User,
  Menu,
  X,
  Crown,
} from 'lucide-react'
import './Header.css'

/* 太极阴阳内联 SVG（lucide-react 1.x 无 YinYang 图标） */
const TaijiIcon = ({ size = 22, strokeWidth = 1.5 }: { size?: number; strokeWidth?: number }): ReactNode => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a6 6 0 0 1 0 12 3 3 0 0 1 0-6 3 3 0 0 0 0-6z" />
    <circle cx="12" cy="7" r="1" fill="currentColor" />
    <circle cx="12" cy="17" r="1" />
  </svg>
)

const menuItems = [
  { name: '今日卦运', path: '/daily', icon: Sparkles },
  { name: '六爻占卜', path: '/liuyao', icon: Coins },
  { name: '风水堪测', path: '/fengshui', icon: Home },
  { name: '八字命理', path: '/bazi', icon: Archive },
  { name: '会员中心', path: '/membership', icon: Crown },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  // 滚动吸顶背景渐变
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (path: string) => {
    if (path === '/fengshui') {
      return location.pathname === '/fengshui' || location.pathname === '/analysis'
    }
    return location.pathname === path
  }

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={`header-v2 ${scrolled ? 'scrolled' : ''}`}
    >
      <div className="header-v2-inner">
        {/* Logo */}
        <Link
          to="/"
          className="header-v2-logo"
          onClick={() => setMenuOpen(false)}
        >
          <span className="header-v2-logo-icon">
            <TaijiIcon size={22} strokeWidth={1.5} />
          </span>
          <span className="header-v2-logo-text">玄风门</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="header-v2-nav">
          <ul className="header-v2-nav-list">
            {menuItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className={`header-v2-nav-link ${active ? 'active' : ''}`}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    <span>{item.name}</span>
                    {active && (
                      <motion.span
                        layoutId="header-active-underline"
                        className="header-v2-nav-active-bar"
                        aria-hidden
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Profile Button */}
        <Link to="/profile" className="header-v2-profile">
          <User size={16} strokeWidth={1.8} />
          <span>我的</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className="header-v2-menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? '关闭菜单' : '打开菜单'}
        >
          {menuOpen ? (
            <X size={22} strokeWidth={1.8} />
          ) : (
            <Menu size={22} strokeWidth={1.8} />
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="header-v2-mobile-mask"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="header-v2-mobile-drawer"
            >
              <div className="header-v2-mobile-header">
                <span className="header-v2-mobile-title">导航</span>
                <button
                  className="header-v2-mobile-close"
                  onClick={() => setMenuOpen(false)}
                  aria-label="关闭"
                >
                  <X size={20} strokeWidth={1.8} />
                </button>
              </div>
              <ul className="header-v2-mobile-list">
                {menuItems.map((item, i) => {
                  const Icon = item.icon
                  const active = isActive(item.path)
                  return (
                    <motion.li
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.05 + i * 0.05 }}
                    >
                      <Link
                        to={item.path}
                        className={`header-v2-mobile-link ${active ? 'active' : ''}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <Icon size={20} strokeWidth={1.8} />
                        <span>{item.name}</span>
                      </Link>
                    </motion.li>
                  )
                })}
              </ul>
              <Link
                to="/profile"
                className="header-v2-mobile-profile"
                onClick={() => setMenuOpen(false)}
              >
                <User size={20} strokeWidth={1.8} />
                <span>个人中心</span>
              </Link>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
