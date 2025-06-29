import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useInactivityLogout } from './hooks/useInactivityLogout';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { CasesPage } from './pages/CasesPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { AgendaPage } from './pages/AgendaPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ReportsPage } from './pages/ReportsPage';
import { TemplatesPage } from './pages/TemplatesPage';

function AppContent() {
  // Hook para logout automático por inatividade (30 minutos)
  useInactivityLogout({
    inactivityTimeout: 30 * 60 * 1000, // 30 minutos
    warningTimeout: 5 * 60 * 1000, // Aviso 5 minutos antes
  });

  return (
    <Router>
      <Routes>
        {/* Página institucional inicial */}
        <Route path="/" element={<LandingPage />} />

        {/* Rotas públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* Rotas protegidas */}
        <Route path="/app" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/app/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/app/clients" element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        } />

        <Route path="/app/cases" element={
          <ProtectedRoute>
            <CasesPage />
          </ProtectedRoute>
        } />

        <Route path="/app/documents" element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        } />

        <Route path="/app/agenda" element={
          <ProtectedRoute>
            <AgendaPage />
          </ProtectedRoute>
        } />

        <Route path="/app/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/app/notifications" element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        } />

        <Route path="/app/reports" element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } />

        <Route path="/app/templates" element={
          <ProtectedRoute>
            <TemplatesPage />
          </ProtectedRoute>
        } />

        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
