import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { AppLayout } from '@/layouts/AppLayout';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuthStore } from '@/lib/auth-store';

import { LoginPage } from '@/pages/auth/Login';
import { RegisterPage } from '@/pages/auth/Register';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPassword';

import { DashboardPage } from '@/pages/Dashboard';
import { CompaniesIndexPage } from '@/pages/companies/Index';
import { CompanyShowPage } from '@/pages/companies/Show';
import { CompanyFormPage } from '@/pages/companies/Form';
import { ContactsIndexPage } from '@/pages/contacts/Index';
import { ContactShowPage } from '@/pages/contacts/Show';
import { ContactFormPage } from '@/pages/contacts/Form';
import { DealsBoardPage } from '@/pages/deals/Board';
import { DealShowPage } from '@/pages/deals/Show';
import { DealFormPage } from '@/pages/deals/Form';
import { TasksIndexPage } from '@/pages/tasks/Index';
import { CustomFieldsPage } from '@/pages/admin/CustomFields';
import { PicklistsPage } from '@/pages/admin/Picklists';
import { PipelineSettingsPage } from '@/pages/admin/PipelineSettings';
import { ProfilePage } from '@/pages/settings/Profile';
import { SecurityPage } from '@/pages/settings/Security';
import { LanguagePage } from '@/pages/settings/Language';
import { AppearancePage } from '@/pages/settings/Appearance';
import { TeamsIndexPage } from '@/pages/teams/Index';
import { TeamEditPage } from '@/pages/teams/Edit';

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (!user.currentTeam) return <Navigate to="/teams" replace />;
  return <Navigate to={`/${user.currentTeam.slug}/dashboard`} replace />;
}

export const router = createBrowserRouter([
  { path: '/', element: <RootRedirect /> },

  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
    ],
  },

  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { path: '/teams', element: <TeamsIndexPage /> },
      { path: '/teams/:slug', element: <TeamEditPage /> },
      { path: '/settings/profile', element: <ProfilePage /> },
      { path: '/settings/security', element: <SecurityPage /> },
      { path: '/settings/appearance', element: <AppearancePage /> },
      { path: '/settings/language', element: <LanguagePage /> },

      { path: '/:teamSlug/dashboard', element: <DashboardPage /> },
      { path: '/:teamSlug/companies', element: <CompaniesIndexPage /> },
      { path: '/:teamSlug/companies/new', element: <CompanyFormPage /> },
      { path: '/:teamSlug/companies/:id', element: <CompanyShowPage /> },
      { path: '/:teamSlug/companies/:id/edit', element: <CompanyFormPage /> },
      { path: '/:teamSlug/contacts', element: <ContactsIndexPage /> },
      { path: '/:teamSlug/contacts/new', element: <ContactFormPage /> },
      { path: '/:teamSlug/contacts/:id', element: <ContactShowPage /> },
      { path: '/:teamSlug/contacts/:id/edit', element: <ContactFormPage /> },
      { path: '/:teamSlug/pipeline', element: <DealsBoardPage /> },
      { path: '/:teamSlug/deals/new', element: <DealFormPage /> },
      { path: '/:teamSlug/deals/:id', element: <DealShowPage /> },
      { path: '/:teamSlug/deals/:id/edit', element: <DealFormPage /> },
      { path: '/:teamSlug/tasks', element: <TasksIndexPage /> },
      { path: '/:teamSlug/custom-fields', element: <CustomFieldsPage /> },
      { path: '/:teamSlug/picklists', element: <PicklistsPage /> },
      { path: '/:teamSlug/pipeline-settings', element: <PipelineSettingsPage /> },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
]);
