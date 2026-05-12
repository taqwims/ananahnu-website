import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
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
import SubmissionCreate from './pages/dashboard/SubmissionCreate';
import SubmissionDetail from './pages/dashboard/SubmissionDetail';
import CoordinatorRates from './pages/dashboard/CoordinatorRates';
import MyInvoices from './pages/dashboard/MyInvoices';
import InvoiceList from './pages/dashboard/InvoiceList';
import CMSDashboard from './pages/dashboard/CMSDashboard';
import DistributionAdmin from './pages/dashboard/DistributionAdmin';
import DrafterMonitoring from './pages/dashboard/DrafterMonitoring';
import PublicLayout from './components/layout/PublicLayout';
import LandingPage from './pages/landing/LandingPage';

// Feature pages
import FormConfigAdmin from './pages/dashboard/FormConfigAdmin';
import BillingConfigAdmin from './pages/dashboard/BillingConfigAdmin';
import ConsultantProfilePage from './pages/dashboard/ConsultantProfile';
import TrainingAdmin from './pages/dashboard/TrainingAdmin';
import FinanceDashboard from './pages/dashboard/FinanceDashboard';
import GeographyAdmin from './pages/dashboard/GeographyAdmin';
import CoordinatorDashboard from './pages/dashboard/CoordinatorDashboard';
import PaymentDashboard from './pages/dashboard/PaymentDashboard';
import UserManagement from './pages/dashboard/UserManagement';
import ConsultantVerification from './pages/dashboard/ConsultantVerification';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
          <Route path="submissions/new" element={<SubmissionCreate />} />
          <Route path="submissions/:id" element={<SubmissionDetail />} />
          <Route path="distribution" element={<DistributionAdmin />} />
          <Route path="monitoring" element={<DrafterMonitoring />} />
          <Route path="coordinator-rates" element={<CoordinatorRates />} />
          <Route path="my-invoices" element={<MyInvoices />} />

          <Route path="cms" element={<CMSDashboard />} />

          {/* Feature Routes */}
          <Route path="form-config" element={<FormConfigAdmin />} />
          <Route path="billing-config" element={<BillingConfigAdmin />} />
          <Route path="consultant-profile" element={<ConsultantProfilePage />} />
          <Route path="training" element={<TrainingAdmin />} />
          <Route path="finance" element={<FinanceDashboard />} />
          <Route path="geography" element={<GeographyAdmin />} />
          <Route path="team" element={<CoordinatorDashboard />} />
          <Route path="payments" element={<PaymentDashboard />} />
          <Route path="all-invoices" element={<InvoiceList />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="consultant-verification" element={<ConsultantVerification />} />
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
