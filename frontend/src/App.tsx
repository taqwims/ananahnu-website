import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { useAuthStore } from './store/authStore';
import RoleRoute from './components/auth/RoleRoute';

// Decode JWT payload tanpa library eksternal
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

// Protected Route — cek token ada DAN belum expired
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const exp = getTokenExpiry(token);
  // Jika token sudah expired, logout dan redirect ke login
  if (exp !== null && Date.now() / 1000 > exp) {
    useAuthStore.getState().logout();
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './pages/dashboard/DashboardHome';
import ClientList from './pages/dashboard/ClientList';
import ClientForm from './pages/dashboard/ClientForm';
import SubmissionList from './pages/dashboard/SubmissionList';
import SubmissionCreate from './pages/dashboard/SubmissionCreate';
import SubmissionDetail from './pages/dashboard/SubmissionDetail';
import CoordinatorRates from './pages/dashboard/CoordinatorRates';
import MyInvoices from './pages/dashboard/MyInvoices';
import CMSDashboard from './pages/dashboard/CMSDashboard';
import DistributionAdmin from './pages/dashboard/DistributionAdmin';
import DrafterMonitoring from './pages/dashboard/DrafterMonitoring';
import PublicLayout from './components/layout/PublicLayout';
import LandingPage from './pages/landing/LandingPage';

import FormConfigAdmin from './pages/dashboard/FormConfigAdmin';
import BillingConfigAdmin from './pages/dashboard/BillingConfigAdmin';
import ConsultantProfilePage from './pages/dashboard/ConsultantProfile';
import TrainingAdmin from './pages/dashboard/TrainingAdmin';
import BillingManagement from './pages/dashboard/BillingManagement';
import GeographyAdmin from './pages/dashboard/GeographyAdmin';
import CoordinatorDashboard from './pages/dashboard/CoordinatorDashboard';
import UserManagement from './pages/dashboard/UserManagement';
import ConsultantVerification from './pages/dashboard/ConsultantVerification';
import TrackSubmission from './pages/tracking/TrackSubmission';
import ReferralDashboard from './pages/dashboard/ReferralDashboard';
import AdminReferralDashboard from './pages/dashboard/AdminReferralDashboard';
import ReferralFeeAdmin from './pages/dashboard/ReferralFeeAdmin';
import DrafterWorkspace from './pages/dashboard/DrafterWorkspace';
import QCWorkspace from './pages/dashboard/QCWorkspace';
import VerifikatorWorkspace from './pages/dashboard/VerifikatorWorkspace';
import NotificationSettings from './pages/dashboard/NotificationSettings';
import ProfilePage from './pages/dashboard/Profile';
import KarirDashboard from './pages/dashboard/KarirDashboard';
import AdminPelatihanPromosi from './pages/dashboard/AdminPelatihanPromosi';
import FinanceDashboard from './pages/dashboard/FinanceDashboard';
import FeeConfigAdmin from './pages/dashboard/FeeConfigAdmin';
import BizDevDashboard from './pages/dashboard/BizDevDashboard';
import SPHForm from './pages/dashboard/SPHForm';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          {/* Semua role bisa akses */}
          <Route index element={<DashboardHome />} />
          <Route path="profile" element={<ProfilePage />} />

          {/* Klien */}
          <Route path="clients" element={
            <RoleRoute path="clients"><ClientList /></RoleRoute>
          } />
          <Route path="clients/new" element={
            <RoleRoute path="clients/new"><ClientForm /></RoleRoute>
          } />
          <Route path="clients/:id" element={
            <RoleRoute path="clients/new"><ClientForm /></RoleRoute>
          } />

          {/* Pengajuan */}
          <Route path="submissions" element={
            <RoleRoute path="submissions"><SubmissionList /></RoleRoute>
          } />
          <Route path="submissions/new" element={
            <RoleRoute path="submissions/new"><SubmissionCreate /></RoleRoute>
          } />
          <Route path="submissions/:id" element={
            <RoleRoute path="submissions"><SubmissionDetail /></RoleRoute>
          } />

          {/* Tagihan */}
          <Route path="my-invoices" element={
            <RoleRoute path="my-invoices"><MyInvoices /></RoleRoute>
          } />

          {/* Workflow */}
          <Route path="distribution" element={
            <RoleRoute path="distribution"><DistributionAdmin /></RoleRoute>
          } />
          <Route path="monitoring" element={
            <RoleRoute path="monitoring"><DrafterMonitoring /></RoleRoute>
          } />
          <Route path="drafter-workspace" element={
            <RoleRoute path="drafter-workspace"><DrafterWorkspace /></RoleRoute>
          } />
          <Route path="qc-workspace" element={
            <RoleRoute path="qc-workspace"><QCWorkspace /></RoleRoute>
          } />
          <Route path="verifikator-workspace" element={
            <RoleRoute path="verifikator-workspace"><VerifikatorWorkspace /></RoleRoute>
          } />

          {/* Profil Advisor & Karir */}
          <Route path="consultant-profile" element={
            <RoleRoute path="consultant-profile"><ConsultantProfilePage /></RoleRoute>
          } />
          <Route path="karir" element={
            <RoleRoute path="karir"><KarirDashboard /></RoleRoute>
          } />

          {/* Jaringan & Referral */}
          <Route path="team" element={
            <RoleRoute path="team"><CoordinatorDashboard /></RoleRoute>
          } />
          <Route path="referrals" element={
            <RoleRoute path="referrals"><ReferralDashboard /></RoleRoute>
          } />
          <Route path="admin-referrals" element={
            <RoleRoute path="admin-referrals"><AdminReferralDashboard /></RoleRoute>
          } />
          <Route path="referral-fees" element={
            <RoleRoute path="referral-fees"><ReferralFeeAdmin /></RoleRoute>
          } />
          <Route path="coordinator-rates" element={
            <RoleRoute path="coordinator-rates"><CoordinatorRates /></RoleRoute>
          } />

          {/* Operasional */}
          <Route path="consultant-verification" element={
            <RoleRoute path="consultant-verification"><ConsultantVerification /></RoleRoute>
          } />
          <Route path="training" element={
            <RoleRoute path="training"><TrainingAdmin /></RoleRoute>
          } />
          <Route path="admin-promosi" element={
            <RoleRoute path="admin-promosi"><AdminPelatihanPromosi /></RoleRoute>
          } />

          {/* Pengaturan Sistem */}
          <Route path="billing" element={
            <RoleRoute path="billing"><BillingManagement /></RoleRoute>
          } />
          <Route path="form-config" element={
            <RoleRoute path="form-config"><FormConfigAdmin /></RoleRoute>
          } />
          <Route path="billing-config" element={
            <RoleRoute path="billing-config"><BillingConfigAdmin /></RoleRoute>
          } />
          <Route path="geography" element={
            <RoleRoute path="geography"><GeographyAdmin /></RoleRoute>
          } />
          <Route path="users" element={
            <RoleRoute path="users"><UserManagement /></RoleRoute>
          } />
          <Route path="notification-settings" element={
            <RoleRoute path="notification-settings"><NotificationSettings /></RoleRoute>
          } />
          <Route path="cms" element={
            <RoleRoute path="cms"><CMSDashboard /></RoleRoute>
          } />

          {/* Keuangan */}
          <Route path="finance" element={
            <RoleRoute path="finance"><FinanceDashboard /></RoleRoute>
          } />
          <Route path="fee-config" element={
            <RoleRoute path="fee-config"><FeeConfigAdmin /></RoleRoute>
          } />

          {/* Business Development */}
          <Route path="bizdev" element={
            <RoleRoute path="bizdev"><BizDevDashboard /></RoleRoute>
          } />

          {/* SPH */}
          <Route path="sph/:id" element={
            <RoleRoute path="sph"><SPHForm /></RoleRoute>
          } />
        </Route>

        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/track" element={<TrackSubmission />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
