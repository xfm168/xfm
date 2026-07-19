import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import AuthGuard from './components/AuthGuard'
import './App.css'

const Home = React.lazy(function() { return import('./pages/Home') })
const FengShui = React.lazy(function() { return import('./pages/FengShui') })
const Analysis = React.lazy(function() { return import('./pages/Analysis') })
const PremiumReport = React.lazy(function() { return import('./pages/PremiumReport') })
const Daily = React.lazy(function() { return import('./pages/Daily') })
const History = React.lazy(function() { return import('./pages/History') })
const Divination = React.lazy(function() { return import('./pages/Divination') })
const BaziInput = React.lazy(function() { return import('./pages/BaziInput') })
const BaziChart = React.lazy(function() { return import('./pages/BaziChart') })
const BaziHistory = React.lazy(function() { return import('./pages/BaziHistory') })
const Membership = React.lazy(function() { return import('./pages/Membership') })
const Dashboard = React.lazy(function() { return import('./pages/Dashboard') })
const AICostDashboard = React.lazy(function() { return import('./pages/AICostDashboard') })
const Login = React.lazy(function() { return import('./pages/Login') })
const UserCenter = React.lazy(function() { return import('./pages/UserCenter') })
const Feedback = React.lazy(function() { return import('./pages/Feedback') })
const Legal = React.lazy(function() { return import('./pages/Legal') })
const ProReport = React.lazy(function() { return import('./pages/ProReportPage') })
const KnowledgeCenter = React.lazy(function() { return import('./pages/KnowledgeCenter') })
const NotificationCenterPage = React.lazy(function() { return import('./pages/NotificationCenterPage') })
const GrowthCenter = React.lazy(function() { return import('./pages/GrowthCenter') })

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Header />
        <main className="main-content">
          <React.Suspense fallback={<div>推演中...</div>}>
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
              <Route path="/membership" element={<Membership />} />
              <Route path="/login" element={<Login />} />
              <Route path="/user-center" element={<AuthGuard><UserCenter /></AuthGuard>} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/admin" element={<AuthGuard requireAdmin={true}><Dashboard /></AuthGuard>} />
              <Route path="/admin/ai-cost" element={<AuthGuard requireAdmin={true}><AICostDashboard /></AuthGuard>} />
              <Route path="/legal" element={<Legal />} />
              <Route path="/pro-report" element={<ProReport />} />
              <Route path="/knowledge" element={<KnowledgeCenter />} />
              <Route path="/knowledge/:categorySlug" element={<KnowledgeCenter />} />
              <Route path="/knowledge/:categorySlug/:articleSlug" element={<KnowledgeCenter />} />
              <Route path="/growth" element={<AuthGuard><GrowthCenter /></AuthGuard>} />
              <Route path="/notifications" element={<AuthGuard><NotificationCenterPage /></AuthGuard>} />
            </Routes>
          </React.Suspense>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
