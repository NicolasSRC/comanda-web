import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { IndexRedirect, ProtectedRoute, RequireRoles } from '@/components/layout/route-guards';
import { CashierPage } from '@/pages/cashier-page';
import { KitchenPage } from '@/pages/kitchen-page';
import { LoginPage } from '@/pages/login-page';
import { NoAccessPage } from '@/pages/no-access-page';
import { NotFoundPage } from '@/pages/not-found-page';
import { OrderPage } from '@/pages/order-page';
import { PublicMenuPage } from '@/pages/public-menu-page';
import { ReportsPage } from '@/pages/reports-page';
import { TablesPage } from '@/pages/tables-page';

export function App() {
  return (
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
  );
}
