import { type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import type { Role } from '@/types/api';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const location = useLocation();

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function RequireRoles({
  roles,
  children,
}: {
  roles: Role[];
  children: ReactNode;
}) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/app/sin-acceso" replace />;
  }

  return <>{children}</>;
}

export function IndexRedirect() {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Navigate to="/login" replace />;

  const route =
    user.role === 'KITCHEN'
      ? '/app/cocina'
      : user.role === 'CASHIER'
        ? '/app/caja'
        : user.role === 'ADMIN' || user.role === 'WAITER'
          ? '/app/mesas'
          : '/app/sin-acceso';

  return <Navigate to={route} replace />;
}

export function AppOutlet() {
  return <Outlet />;
}
