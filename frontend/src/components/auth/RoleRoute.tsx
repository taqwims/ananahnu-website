import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { canAccess } from '../../config/rbac';

interface RoleRouteProps {
  /** Path key yang terdaftar di PAGE_ROLES (tanpa /dashboard/) */
  path: string;
  children: React.ReactNode;
}

/**
 * Membungkus route yang butuh role tertentu.
 * Jika role tidak punya akses → redirect ke /dashboard (home).
 */
export default function RoleRoute({ path, children }: RoleRouteProps) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  // Jika tidak ada user atau token, redirect ke login
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }

  const role = user.role ?? '';

  if (!canAccess(role, path)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
