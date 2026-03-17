import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { useAuth } from './context/AuthContext'
import { STORAGE_THEME_KEY } from './utils/theme'
import LoginPage from './pages/LoginPage'
import HomePage from './pages/HomePage'
import CampaignDetailPage from './pages/CampaignDetailPage'
import ConnectedAccountsPage from './pages/ConnectedAccountsPage'
import MySubmissionsPage from './pages/MySubmissionsPage'
import MyEarningsPage from './pages/MyEarningsPage'
import WalletPage from './pages/WalletPage'
import ProfilePage from './pages/ProfilePage'
import MyCampaignsPage from './pages/MyCampaignsPage'
import CampaignSubmissionsPage from './pages/CampaignSubmissionsPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminCampaignsPage from './pages/admin/AdminCampaignsPage'
import AdminSubmissionsPage from './pages/admin/AdminSubmissionsPage'
import AdminPayoutsPage from './pages/admin/AdminPayoutsPage'
import AdminWithdrawalsPage from './pages/admin/AdminWithdrawalsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

function ProtectedAdminRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

function App() {
  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem(STORAGE_THEME_KEY)
    if (stored !== null) return stored === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem(STORAGE_THEME_KEY, isDark ? 'dark' : 'light')
  }, [isDark])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><HomePage isDark={isDark} setIsDark={setIsDark} /></ProtectedRoute>} />
      <Route path="/campaign/:id" element={<ProtectedRoute><CampaignDetailPage isDark={isDark} setIsDark={setIsDark} /></ProtectedRoute>} />
      <Route path="/accounts" element={<ProtectedRoute><ConnectedAccountsPage isDark={isDark} setIsDark={setIsDark} /></ProtectedRoute>} />
      <Route path="/submissions" element={<ProtectedRoute><MySubmissionsPage isDark={isDark} setIsDark={setIsDark} /></ProtectedRoute>} />
      <Route path="/earnings" element={<ProtectedRoute><MyEarningsPage isDark={isDark} setIsDark={setIsDark} /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><WalletPage isDark={isDark} setIsDark={setIsDark} /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage isDark={isDark} setIsDark={setIsDark} /></ProtectedRoute>} />
      <Route path="/my-campaigns" element={<ProtectedRoute><MyCampaignsPage isDark={isDark} setIsDark={setIsDark} /></ProtectedRoute>} />
      <Route path="/my-campaigns/:campaignId/submissions" element={<ProtectedRoute><CampaignSubmissionsPage isDark={isDark} setIsDark={setIsDark} /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboardPage isDark={isDark} setIsDark={setIsDark} /></ProtectedAdminRoute>} />
      <Route path="/admin/campaigns" element={<ProtectedAdminRoute><AdminCampaignsPage isDark={isDark} setIsDark={setIsDark} /></ProtectedAdminRoute>} />
      <Route path="/admin/submissions" element={<ProtectedAdminRoute><AdminSubmissionsPage isDark={isDark} setIsDark={setIsDark} /></ProtectedAdminRoute>} />
      <Route path="/admin/payouts" element={<ProtectedAdminRoute><AdminPayoutsPage isDark={isDark} setIsDark={setIsDark} /></ProtectedAdminRoute>} />
      <Route path="/admin/withdrawals" element={<ProtectedAdminRoute><AdminWithdrawalsPage isDark={isDark} setIsDark={setIsDark} /></ProtectedAdminRoute>} />
      <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsersPage isDark={isDark} setIsDark={setIsDark} /></ProtectedAdminRoute>} />
    </Routes>
  )
}

export default App
