import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <Link to="/" className="footer-logo">
            <span className="footer-logo-icon">
              <span className="footer-seal-text">玄</span>
            </span>
            <span className="footer-logo-text">玄风门</span>
          </Link>
          <p className="footer-slogan">遇事不决，可问玄风</p>
          <p className="footer-manifesto">天地有象，万事有机。知其势者，顺势而行。</p>
        </div>

        <div className="footer-links">
          <div className="footer-section">
            <h4 className="footer-title">功能服务</h4>
            <ul className="footer-list">
              <li><Link to="/daily">☯ 今日卦运</Link></li>
              <li><Link to="/liuyao">☰ 六爻解卦</Link></li>
              <li><Link to="/fengshui">⌂ 风水勘测</Link></li>
              <li><Link to="/records">☷ 卦运记录</Link></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4 className="footer-title">关于我们</h4>
            <ul className="footer-list">
              <li><Link to="/">关于玄风门</Link></li>
              <li><Link to="/">联系方式</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright">© 2026 玄风门 · 传承东方智慧</p>
        </div>
      </div>
    </footer>
  )
}
