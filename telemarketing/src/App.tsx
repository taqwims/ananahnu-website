import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { Toaster } from 'react-hot-toast';

// Layouts
import DashboardLayout from './components/layout/DashboardLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import LandingPage from './pages/public/LandingPage';
import PublicFormPage from './pages/public/FormPage';
import { VerifyAgreement } from './pages/public/VerifyAgreement';
import DashboardHome from './pages/dashboard/DashboardHome';
import ClientManagement from './pages/dashboard/ClientManagement';
import MeetingSchedule from './pages/dashboard/MeetingSchedule';
import AnalyticsPage from './pages/dashboard/Analytics';
import EstimasiReguler from './pages/dashboard/EstimasiReguler';

// JWT expiry check
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

// Protected Route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const exp = getTokenExpiry(token);
  if (exp !== null && Date.now() / 1000 > exp) {
    useAuthStore.getState().logout();
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tele-auth-storage') {
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#004033',
            border: '1px solid rgba(0, 64, 51, 0.1)',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          },
        }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/form" element={<PublicFormPage />} />
        <Route path="/verify/:id/:token" element={<VerifyAgreement />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="clients" element={<ClientManagement />} />
          <Route path="meetings" element={<MeetingSchedule />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="estimasi-reguler" element={<EstimasiReguler />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
