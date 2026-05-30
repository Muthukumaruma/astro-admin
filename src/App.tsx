import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import AdminShell from './components/layout/AdminShell';
import { useAdminAuthStore } from './stores/auth.store';

const DashboardPage  = lazy(() => import('./features/dashboard/pages/AdminDashboardPage'));
const UsersPage      = lazy(() => import('./features/users/pages/UsersPage'));
const AstrologersPage = lazy(() => import('./features/astrologers/pages/AstrologersPage'));
const SubscriptionsPage = lazy(() => import('./features/subscriptions/pages/SubscriptionsPage'));
const PlansPage          = lazy(() => import('./features/plans/pages/PlansPage'));
const PromosPage         = lazy(() => import('./features/promos/pages/PromosPage'));
const AIUsagePage        = lazy(() => import('./features/ai-usage/pages/AIUsagePage'));
const BroadcastsPage     = lazy(() => import('./features/notifications/pages/BroadcastsPage'));
const SettingsPage       = lazy(() => import('./features/settings/pages/AdminSettingsPage'));
const LoginPage      = lazy(() => import('./features/auth/AdminLoginPage'));

export default function App() {
  const { checkAuth, isAuthenticated } = useAdminAuthStore();
  useEffect(() => { checkAuth(); }, [checkAuth]);

  if (!isAuthenticated) {
    return (
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <AdminShell>
      <Suspense fallback={<div className="p-8 text-white/50">Loading...</div>}>
        <Routes>
          <Route path="/"             element={<DashboardPage />} />
          <Route path="/users"        element={<UsersPage />} />
          <Route path="/astrologers"  element={<AstrologersPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/plans"         element={<PlansPage />} />
          <Route path="/promos"        element={<PromosPage />} />
          <Route path="/ai-usage"       element={<AIUsagePage />} />
          <Route path="/notifications"  element={<BroadcastsPage />} />
          <Route path="/settings"       element={<SettingsPage />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AdminShell>
  );
}
