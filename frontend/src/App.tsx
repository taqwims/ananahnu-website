import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import { useAuthStore } from './store/authStore';

// Simple Protected Route
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import ClientList from './pages/dashboard/ClientList';
import ClientForm from './pages/dashboard/ClientForm';
import SubmissionList from './pages/dashboard/SubmissionList';
import SubmissionDetail from './pages/dashboard/SubmissionDetail';
import CMSDashboard from './pages/dashboard/CMSDashboard';
import PublicLayout from './components/layout/PublicLayout';
import LandingPage from './pages/landing/LandingPage';

// New pages
import FormConfigAdmin from './pages/dashboard/FormConfigAdmin';
import ConsultantProfilePage from './pages/dashboard/ConsultantProfile';
import TrainingAdmin from './pages/dashboard/TrainingAdmin';
import FinanceDashboard from './pages/dashboard/FinanceDashboard';
import GeographyAdmin from './pages/dashboard/GeographyAdmin';
import CoordinatorDashboard from './pages/dashboard/CoordinatorDashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardHome />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="clients/new" element={<ClientForm />} />
          <Route path="clients/:id" element={<ClientForm />} />

          <Route path="submissions" element={<SubmissionList />} />
          <Route path="submissions/:id" element={<SubmissionDetail />} />

          <Route path="cms" element={<CMSDashboard />} />

          {/* New Routes */}
          <Route path="form-config" element={<FormConfigAdmin />} />
          <Route path="consultant-profile" element={<ConsultantProfilePage />} />
          <Route path="training" element={<TrainingAdmin />} />
          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="geography" element={<GeographyAdmin />} />
          <Route path="team" element={<CoordinatorDashboard />} />
        </Route>

        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
