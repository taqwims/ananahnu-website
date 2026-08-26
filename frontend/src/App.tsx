import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import { useAuthStore } from './store/authStore';
import RoleRoute from './components/auth/RoleRoute';

// Public pages loaded eagerly for instant first paint
import PublicLayout from './components/layout/PublicLayout';
import LandingPage from './pages/landing/LandingPage';
import NewsListPage from './pages/public/NewsListPage';
import NewsDetailPage from './pages/public/NewsDetailPage';
import TrackSubmission from './pages/tracking/TrackSubmission';
import VerifyInvoice from './pages/tracking/VerifyInvoice';
import VerifyAgreement from './pages/tracking/VerifyAgreement';

// Lazy loaded heavy dashboard and administrative components
const DashboardLayout = lazy(() => import('./components/layout/DashboardLayout'));
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome'));
const ClientList = lazy(() => import('./pages/dashboard/ClientList'));
const ClientForm = lazy(() => import('./pages/dashboard/ClientForm'));
const ClientDetail = lazy(() => import('./pages/dashboard/ClientDetail'));
const SubmissionList = lazy(() => import('./pages/dashboard/SubmissionList'));
const SubmissionCreate = lazy(() => import('./pages/dashboard/SubmissionCreate'));
const SubmissionDetail = lazy(() => import('./pages/dashboard/SubmissionDetail'));
const CoordinatorRates = lazy(() => import('./pages/dashboard/CoordinatorRates'));
const MyInvoices = lazy(() => import('./pages/dashboard/MyInvoices'));
const CMSDashboard = lazy(() => import('./pages/dashboard/CMSDashboard'));
const DistributionAdmin = lazy(() => import('./pages/dashboard/DistributionAdmin'));
const DrafterMonitoring = lazy(() => import('./pages/dashboard/DrafterMonitoring'));
const FormConfigAdmin = lazy(() => import('./pages/dashboard/FormConfigAdmin'));
const BillingConfigAdmin = lazy(() => import('./pages/dashboard/BillingConfigAdmin'));
const ConsultantProfilePage = lazy(() => import('./pages/dashboard/ConsultantProfile'));
const TrainingAdmin = lazy(() => import('./pages/dashboard/TrainingAdmin'));
const BillingManagement = lazy(() => import('./pages/dashboard/BillingManagement'));
const GeographyAdmin = lazy(() => import('./pages/dashboard/GeographyAdmin'));
const AdvisorsGeo = lazy(() => import('./pages/dashboard/AdvisorsGeo'));
const CoordinatorDashboard = lazy(() => import('./pages/dashboard/CoordinatorDashboard'));
const UserManagement = lazy(() => import('./pages/dashboard/UserManagement'));
const ConsultantVerification = lazy(() => import('./pages/dashboard/ConsultantVerification'));
const AdvisorPerformance = lazy(() => import('./pages/dashboard/AdvisorPerformance'));
const ReferralDashboard = lazy(() => import('./pages/dashboard/ReferralDashboard'));
const AdminReferralDashboard = lazy(() => import('./pages/dashboard/AdminReferralDashboard'));
const ReferralFeeAdmin = lazy(() => import('./pages/dashboard/ReferralFeeAdmin'));
const DrafterWorkspace = lazy(() => import('./pages/dashboard/DrafterWorkspace'));
const QCWorkspace = lazy(() => import('./pages/dashboard/QCWorkspace'));
const AuditManagerWorkspace = lazy(() => import('./pages/dashboard/AuditManagerWorkspace'));
const DraftManagerDashboard = lazy(() => import('./pages/dashboard/DraftManagerDashboard'));
const NotificationSettings = lazy(() => import('./pages/dashboard/NotificationSettings'));
const ProfilePage = lazy(() => import('./pages/dashboard/Profile'));
const KarirDashboard = lazy(() => import('./pages/dashboard/KarirDashboard'));
const AdminPelatihanPromosi = lazy(() => import('./pages/dashboard/AdminPelatihanPromosi'));
const FinanceDashboard = lazy(() => import('./pages/dashboard/FinanceDashboard'));
const FeeConfigAdmin = lazy(() => import('./pages/dashboard/FeeConfigAdmin'));
const BizDevDashboard = lazy(() => import('./pages/dashboard/BizDevDashboard'));
const SPHForm = lazy(() => import('./pages/dashboard/SPHForm'));
const EstimasiBiaya = lazy(() => import('./pages/dashboard/EstimasiBiaya'));
const SHWorkspace = lazy(() => import('./pages/dashboard/SHWorkspace'));
const ClientPengajuanPage = lazy(() => import('./pages/dashboard/ClientPengajuanPage'));
const OperationalSubmissions = lazy(() => import('./pages/dashboard/OperationalSubmissions'));
const OperationalQCQueue = lazy(() => import('./pages/dashboard/OperationalQCQueue'));
const OperationalHDOQueue = lazy(() => import('./pages/dashboard/OperationalHDOQueue'));
const OperationalSelfDeclare = lazy(() => import('./pages/dashboard/OperationalSelfDeclare'));
const OperationalAuditManagement = lazy(() => import('./pages/dashboard/OperationalAuditManagement'));
const OperationalReports = lazy(() => import('./pages/dashboard/OperationalReports'));
const OperationalNotifications = lazy(() => import('./pages/dashboard/OperationalNotifications'));
const OperationalSettings = lazy(() => import('./pages/dashboard/OperationalSettings'));
const OperationalHelp = lazy(() => import('./pages/dashboard/OperationalHelp'));

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

const PageLoadingFallback = () => (
  <div className="min-h-[60vh] bg-slate-50 flex flex-col items-center justify-center p-8">
    <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3"></div>
    <p className="text-xs font-semibold text-gray-500">Memuat konten...</p>
  </div>
);

import { Toaster } from 'react-hot-toast';

function App() {
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-storage') {
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
      <Toaster position="top-right" reverseOrder={false} />
      <Suspense fallback={<PageLoadingFallback />}>
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

          {/* Pengajuan Klien */}
          <Route path="pengajuan" element={
            <RoleRoute path="pengajuan"><ClientPengajuanPage /></RoleRoute>
          } />

          {/* Klien */}
          <Route path="clients" element={
            <RoleRoute path="clients"><ClientList /></RoleRoute>
          } />
          <Route path="clients/new" element={
            <RoleRoute path="clients/new"><ClientForm /></RoleRoute>
          } />
          <Route path="clients/:id" element={
            <RoleRoute path="clients"><ClientDetail /></RoleRoute>
          } />
          <Route path="clients/:id/edit" element={
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
          <Route path="sh-workspace" element={
            <RoleRoute path="sh-workspace"><SHWorkspace /></RoleRoute>
          } />
          <Route path="audit-manager-workspace" element={
            <RoleRoute path="audit-manager-workspace"><AuditManagerWorkspace /></RoleRoute>
          } />
          <Route path="draft-monitoring" element={
            <RoleRoute path="draft-monitoring"><DraftManagerDashboard /></RoleRoute>
          } />
          <Route path="advisors" element={
            <RoleRoute path="advisors"><AdvisorsGeo /></RoleRoute>
          } />

          {/* Profil Advisor & Karir */}
          <Route path="consultant-profile" element={
            <RoleRoute path="consultant-profile"><ConsultantProfilePage /></RoleRoute>
          } />
          <Route path="karir" element={
            <RoleRoute path="karir"><KarirDashboard /></RoleRoute>
          } />
          <Route path="estimasi" element={
            <RoleRoute path="estimasi"><EstimasiBiaya /></RoleRoute>
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
          <Route path="advisor-performance" element={
            <RoleRoute path="advisor-performance"><AdvisorPerformance /></RoleRoute>
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

          {/* Modul Manajer Operasional */}
          <Route path="pengajuan-masuk" element={
            <RoleRoute path="pengajuan-masuk"><OperationalSubmissions /></RoleRoute>
          } />
          <Route path="antrean-qc" element={
            <RoleRoute path="antrean-qc"><OperationalQCQueue /></RoleRoute>
          } />
          <Route path="antrean-hdo" element={
            <RoleRoute path="antrean-hdo"><OperationalHDOQueue /></RoleRoute>
          } />
          <Route path="verifikasi-self-declare" element={
            <RoleRoute path="verifikasi-self-declare"><OperationalSelfDeclare /></RoleRoute>
          } />
          <Route path="manajemen-audit" element={
            <RoleRoute path="manajemen-audit"><OperationalAuditManagement /></RoleRoute>
          } />
          <Route path="laporan-operasional" element={
            <RoleRoute path="laporan-operasional"><OperationalReports /></RoleRoute>
          } />
          <Route path="notifikasi-operasional" element={
            <RoleRoute path="notifikasi-operasional"><OperationalNotifications /></RoleRoute>
          } />
          <Route path="pengaturan-operasional" element={
            <RoleRoute path="pengaturan-operasional"><OperationalSettings /></RoleRoute>
          } />
          <Route path="bantuan" element={
            <RoleRoute path="bantuan"><OperationalHelp /></RoleRoute>
          } />
        </Route>

        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/news" element={<NewsListPage />} />
          <Route path="/news/:slug" element={<NewsDetailPage />} />
          <Route path="/track" element={<TrackSubmission />} />
          <Route path="/verify-invoice/:id" element={<VerifyInvoice />} />
          <Route path="/verify/agreement/:id/:token" element={<VerifyAgreement />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
