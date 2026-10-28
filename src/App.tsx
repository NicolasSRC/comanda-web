import { Loader2 } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { IndexRedirect, ProtectedRoute, RequireRoles } from '@/components/layout/route-guards';

// Cada pantalla se carga bajo demanda para que la primera visita no descargue
// el panel operativo completo (caja, cocina y reportes incluidos).
const CashierPage = lazy(() =>
  import('@/pages/cashier-page').then((module) => ({ default: module.CashierPage })),
);
const KitchenPage = lazy(() =>
  import('@/pages/kitchen-page').then((module) => ({ default: module.KitchenPage })),
);
const LoginPage = lazy(() =>
  import('@/pages/login-page').then((module) => ({ default: module.LoginPage })),
);
const NoAccessPage = lazy(() =>
  import('@/pages/no-access-page').then((module) => ({ default: module.NoAccessPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/not-found-page').then((module) => ({ default: module.NotFoundPage })),
);
const OrderPage = lazy(() =>
  import('@/pages/order-page').then((module) => ({ default: module.OrderPage })),
);
const PublicMenuPage = lazy(() =>
  import('@/pages/public-menu-page').then((module) => ({ default: module.PublicMenuPage })),
);
const ReportsPage = lazy(() =>
  import('@/pages/reports-page').then((module) => ({ default: module.ReportsPage })),
);
const TablesPage = lazy(() =>
  import('@/pages/tables-page').then((module) => ({ default: module.TablesPage })),
);

function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

export function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<PublicMenuPage />} />
        <Route path="/:slug" element={<PublicMenuPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<IndexRedirect />} />
          <Route
            path="mesas"
            element={
              <RequireRoles roles={['ADMIN', 'WAITER']}>
                <TablesPage />
              </RequireRoles>
            }
          />
          <Route
            path="pedidos/:orderId"
            element={
              <RequireRoles roles={['ADMIN', 'WAITER']}>
                <OrderPage />
              </RequireRoles>
            }
          />
          <Route
            path="cocina"
            element={
              <RequireRoles roles={['ADMIN', 'KITCHEN']}>
                <KitchenPage />
              </RequireRoles>
            }
          />
          <Route
            path="caja"
            element={
              <RequireRoles roles={['ADMIN', 'CASHIER']}>
                <CashierPage />
              </RequireRoles>
            }
          />
          <Route
            path="reportes"
            element={
              <RequireRoles roles={['ADMIN']}>
                <ReportsPage />
              </RequireRoles>
            }
          />
          <Route path="sin-acceso" element={<NoAccessPage />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}
