import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { InstitutionLayout } from './components/layout/InstitutionLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Auth Pages
import { LoginPage } from './pages/LoginPage';
import { InstitutionSignupPage } from './pages/institution/InstitutionSignupPage';
import { VerifyEmailPage } from './pages/institution/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/institution/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/institution/ResetPasswordPage';

// Institution Portal Pages
import { InstitutionDashboardPage } from './pages/institution/InstitutionDashboardPage';
import { InstitutionApplicationsPage } from './pages/institution/InstitutionApplicationsPage';
import { NewApplicationWizardPage } from './pages/institution/NewApplicationWizardPage';
import { InstitutionApplicationDetailPage } from './pages/institution/InstitutionApplicationDetailPage';
import { InstitutionDocumentsPage } from './pages/institution/InstitutionDocumentsPage';
import { InstitutionCompliancePage } from './pages/institution/InstitutionCompliancePage';
import { InstitutionProfilePage } from './pages/institution/InstitutionProfilePage';

// Officer Portal Pages
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { WorkflowQueuePage } from './pages/WorkflowQueuePage';
import { EVCManagementPage } from './pages/EVCManagementPage';
import { CompliancePage } from './pages/CompliancePage';
import { DocumentValidityPage } from './pages/DocumentValidityPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuditPage } from './pages/AuditPage';
import { AdminRulesPage } from './pages/AdminRulesPage';

const RootRedirect: React.FC = () => {
  const { currentUser, isLoading } = useAuth();
  if (isLoading) return null;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'INSTITUTION_USER') {
    return <Navigate to="/institution/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Endpoints */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/institution/signup" element={<InstitutionSignupPage />} />
          <Route path="/institution/verify-email" element={<VerifyEmailPage />} />
          <Route path="/institution/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/institution/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Institution Portal Shell */}
          <Route
            path="/institution"
            element={
              <ProtectedRoute allowedRoles={['INSTITUTION_USER']}>
                <InstitutionLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/institution/dashboard" replace />} />
            <Route path="dashboard" element={<InstitutionDashboardPage />} />
            <Route path="applications" element={<InstitutionApplicationsPage />} />
            <Route path="applications/new" element={<NewApplicationWizardPage />} />
            <Route path="applications/:id" element={<InstitutionApplicationDetailPage />} />
            <Route path="documents" element={<InstitutionDocumentsPage />} />
            <Route path="compliance" element={<InstitutionCompliancePage />} />
            <Route path="profile" element={<InstitutionProfilePage />} />
          </Route>

          {/* Protected Officer Portal Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute
                allowedRoles={[
                  'SCRUTINY_OFFICER',
                  'REGIONAL_OFFICER',
                  'EVC_EXPERT',
                  'EVC_CONVENER',
                  'SAC_SHC_MEMBER',
                  'MEMBER_SECRETARY',
                  'SYSTEM_ADMIN',
                ]}
              >
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="workflow-queue" element={<WorkflowQueuePage />} />
            <Route path="evc" element={<EVCManagementPage />} />
            <Route path="compliance" element={<CompliancePage />} />
            <Route path="document-validity" element={<DocumentValidityPage />} />
            <Route path="reports" element={<ReportsPage />} />
            {/* Restricted Route: Only Member Secretary and System Admin */}
            <Route
              path="audit"
              element={
                <ProtectedRoute allowedRoles={['MEMBER_SECRETARY', 'SYSTEM_ADMIN']}>
                  <AuditPage />
                </ProtectedRoute>
              }
            />
            <Route path="admin/rules" element={<AdminRulesPage />} />
          </Route>

          {/* Fallback Catch-all Route */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
