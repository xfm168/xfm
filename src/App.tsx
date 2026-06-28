import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import FengShui from './pages/FengShui'
import Analysis from './pages/Analysis'
import PremiumReport from './pages/PremiumReport'
import Daily from './pages/Daily'
import History from './pages/History'
import Divination from './pages/Divination'
import BaziInput from './pages/BaziInput'
import BaziChart from './pages/BaziChart'
import BaziHistory from './pages/BaziHistory'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/fengshui" element={<FengShui />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/premium-report" element={<PremiumReport />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/bazi" element={<BaziInput />} />
            <Route path="/bazi/chart" element={<BaziChart />} />
            <Route path="/bazi/history" element={<BaziHistory />} />
            <Route path="/liuyao" element={<Divination />} />
            <Route path="/records" element={<History />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
