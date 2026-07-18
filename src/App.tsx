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
const PaymentsPage       = lazy(() => import('./features/payments/pages/PaymentsPage'));
const BroadcastsPage     = lazy(() => import('./features/notifications/pages/BroadcastsPage'));
const SecuritySettingsPage    = lazy(() => import('./features/settings/pages/SecuritySettingsPage'));
const ForceUpdateSettingsPage = lazy(() => import('./features/settings/pages/ForceUpdateSettingsPage'));
const MaintenanceSettingsPage = lazy(() => import('./features/settings/pages/MaintenanceSettingsPage'));
const AiSettingsPage          = lazy(() => import('./features/settings/pages/AiSettingsPage'));
const GuestAccessSettingsPage = lazy(() => import('./features/settings/pages/GuestAccessSettingsPage'));
const ReferralSettingsPage    = lazy(() => import('./features/settings/pages/ReferralSettingsPage'));
const JothishamKnowledgePage = lazy(() => import('./features/jothisham/pages/JothishamKnowledgePage'));
const CmsCategoriesPage    = lazy(() => import('./features/cms/pages/CmsCategoriesPage'));
const CmsSubCategoriesPage = lazy(() => import('./features/cms/pages/CmsSubCategoriesPage'));
const CmsContentListPage   = lazy(() => import('./features/cms/pages/CmsContentListPage'));
const CmsContentPriorityPage = lazy(() => import('./features/cms/pages/CmsContentPriorityPage'));
const CmsContentEditorPage = lazy(() => import('./features/cms/pages/CmsContentEditorPage'));
const CmsSectionsPage      = lazy(() => import('./features/cms/pages/CmsSectionsPage'));
const AdminsPage          = lazy(() => import('./features/admins/pages/AdminsPage'));
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
          <Route path="/payments"       element={<PaymentsPage />} />
          <Route path="/ai-usage"       element={<AIUsagePage />} />
          <Route path="/notifications"  element={<BroadcastsPage />} />
          <Route path="/settings/security"      element={<SecuritySettingsPage />} />
          <Route path="/settings/force-update"  element={<ForceUpdateSettingsPage />} />
          <Route path="/settings/maintenance"   element={<MaintenanceSettingsPage />} />
          <Route path="/settings/ai"            element={<AiSettingsPage />} />
          <Route path="/settings/guest-access"  element={<GuestAccessSettingsPage />} />
          <Route path="/settings/referral"      element={<ReferralSettingsPage />} />
          <Route path="/settings" element={<Navigate to="/settings/security" replace />} />
          <Route path="/jothisham-knowledge" element={<JothishamKnowledgePage />} />
          <Route path="/cms/books/categories" element={<CmsCategoriesPage />} />
          <Route path="/cms/books/categories/:categoryId/subcategories" element={<CmsSubCategoriesPage />} />
          <Route path="/cms/books/content" element={<CmsContentListPage />} />
          <Route path="/cms/books/content/priority" element={<CmsContentPriorityPage />} />
          <Route path="/cms/books/content/new" element={<CmsContentEditorPage />} />
          <Route path="/cms/books/content/:id/edit" element={<CmsContentEditorPage />} />
          <Route path="/cms/books/settings" element={<CmsSectionsPage />} />
          <Route path="/admins"         element={<AdminsPage />} />
          <Route path="*"             element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AdminShell>
  );
}
