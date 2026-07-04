import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ConfigProvider } from './context/ConfigContext';
import MobileLayout from './components/layout/MobileLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Step1_Terms from './pages/PlayerOnboarding/Step1_Terms';
import Step2_BasicRegistration from './pages/PlayerOnboarding/Step2_BasicRegistration';
import Step3_Payment from './pages/PlayerOnboarding/Step3_Payment';
import Step4_PlayerProfile from './pages/PlayerOnboarding/Step4_PlayerProfile';
import Step5_MyGameplay from './pages/PlayerOnboarding/Step5_MyGameplay';
import DashboardLayout from './components/layout/DashboardLayout';
import PlayerDashboard from './pages/Dashboard/PlayerDashboard';
import MatchesCalendar from './pages/Dashboard/MatchesCalendar';
import MatchBookings from './pages/Dashboard/MatchBookings';
import GameplayUpload from './pages/Dashboard/GameplayUpload';
import MyDocuments from './pages/Dashboard/MyDocuments';
import OfflineTrials from './pages/Dashboard/OfflineTrials';

// Coach / Selector Imports
import CoachRegistrationFlow from './pages/CoachOnboarding/CoachRegistrationFlow';
import CoachDashboardLayout from './components/layout/CoachDashboardLayout';
import CoachDashboardHome from './pages/CoachDashboard/CoachDashboardHome';
import SquadOverview from './pages/CoachDashboard/SquadOverview';
import VideoScrutiny from './pages/CoachDashboard/VideoScrutiny';
import CoachMatchesCalendar from './pages/CoachDashboard/CoachMatchesCalendar';

// Admin Imports (legacy — store-based)
import AdminLogin from './pages/Admin/AdminLogin';
import AdminDashboardLayout from './components/layout/AdminDashboardLayout';
import AdminDashboard from './pages/Admin/AdminDashboard';
import AppConfig from './pages/Admin/AppConfig';
import PlayerConfig from './pages/Admin/PlayerConfig';
import PlayerManagement from './pages/Admin/PlayerManagement';
import CoachManagement from './pages/Admin/CoachManagement';
import MatchManagement from './pages/Admin/MatchManagement';
import PlayerAllotment from './pages/Admin/PlayerAllotment';
import AdminVideoScrutiny from './pages/Admin/VideoScrutiny';

// Admin Imports (new — API-based)
import AdminLayout from './pages/Admin/AdminLayout';
import NewAdminDashboard from './pages/Admin/NewAdminDashboard';
import Players from './pages/Admin/Players';
import PlayerDetail from './pages/Admin/PlayerDetail';
import Coaches from './pages/Admin/Coaches';
import Matches from './pages/Admin/Matches';
import Config from './pages/Admin/Config';
import AdminPlayerAllotment from './pages/Admin/PlayerAllotment';

// ── Route Guard: redirect to /login if not authenticated ──
// For players, also checks payment completion and redirects to the right step.
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, role, loading, user } = useAuth();
  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'var(--text-primary)' }}>Loading…</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // Wrong role: send admin to admin2, others back to landing
  if (requiredRole && role !== requiredRole) {
    if (role === 'admin') return <Navigate to="/admin2" replace />;
    return <Navigate to="/" replace />;
  }

  // ── Player onboarding guard ─────────────────────────────
  // If a player hasn't paid, send them to payment. After payment, dashboard is accessible.
  if (requiredRole === 'player' && user) {
    const paymentDone = user.payment_status === 'paid' || user.is_dashboard_unlocked || user.isDashboardUnlocked;
    if (!paymentDone) {
      return <Navigate to="/onboarding/payment" replace />;
    }
    // After payment: allow full dashboard access (no profile/video check)
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<MobileLayout />}>
        <Route index element={<Landing />} />
        <Route path="login" element={<Login />} />
        <Route path="onboarding/step1" element={<Step1_Terms />} />
        <Route path="onboarding/step2" element={<Step2_BasicRegistration />} />
        <Route path="onboarding/payment" element={<Step3_Payment />} />
        <Route path="onboarding/step4" element={<Step4_PlayerProfile />} />
        <Route path="onboarding/step5" element={<Step5_MyGameplay />} />
      </Route>

      {/* Selector Onboarding — public */}
      <Route path="/coach-onboarding" element={
        <div style={{ backgroundColor: 'var(--bg-color)', minHeight: '100vh', color: 'var(--text-primary)' }}>
          <CoachRegistrationFlow />
        </div>
      } />

      {/* Player Dashboard — protected */}
      <Route path="/dashboard" element={
        <ProtectedRoute requiredRole="player"><DashboardLayout /></ProtectedRoute>
      }>
        <Route index element={<PlayerDashboard />} />
        <Route path="matches" element={<Navigate to="/dashboard/trials" replace />} />
        <Route path="bookings" element={<Navigate to="/dashboard/trials" replace />} />
        <Route path="trials" element={<OfflineTrials />} />
        <Route path="gameplay" element={<GameplayUpload />} />
        <Route path="documents" element={<MyDocuments />} />
      </Route>

      {/* Selector Dashboard — protected */}
      <Route path="/coach-dashboard" element={
        <ProtectedRoute requiredRole="coach"><CoachDashboardLayout /></ProtectedRoute>
      }>
        <Route index element={<CoachDashboardHome />} />
        <Route path="squad" element={<SquadOverview />} />
        <Route path="scrutiny" element={<VideoScrutiny />} />
        <Route path="matches" element={<CoachMatchesCalendar />} />
      </Route>

      {/* Admin — protected (legacy store-based) */}
      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedRoute requiredRole="admin"><AdminDashboardLayout /></ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="config" element={<AppConfig />} />
        <Route path="player-config" element={<PlayerConfig />} />
        <Route path="players" element={<PlayerManagement />} />
        <Route path="coaches" element={<CoachManagement />} />
        <Route path="matches" element={<MatchManagement />} />
        <Route path="allotment" element={<PlayerAllotment />} />
        <Route path="scrutiny" element={<AdminVideoScrutiny />} />
      </Route>

      {/* Admin v2 — API-based new panel */}
      <Route path="/admin2" element={<AdminLayout />}>
        <Route index element={<NewAdminDashboard />} />
        <Route path="players" element={<Players />} />
        <Route path="players/:id" element={<PlayerDetail />} />
        <Route path="coaches" element={<Coaches />} />
        <Route path="matches" element={<Matches />} />
        <Route path="config" element={<Config />} />
        <Route path="scrutiny" element={<AdminVideoScrutiny />} />
        <Route path="allotment" element={<AdminPlayerAllotment />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ConfigProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
