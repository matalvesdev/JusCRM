import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { CasesPage } from './pages/CasesPage';

function App() {

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />          {/* Rotas protegidas */}          <Route path="/app" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />          <Route path="/app/dashboard" element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } />          <Route path="/app/clients" element={
            <ProtectedRoute>
              <ClientsPage />
            </ProtectedRoute>
          } />          <Route path="/app/cases" element={
            <ProtectedRoute>
              <CasesPage />
            </ProtectedRoute>
          } />

          <Route path="*" element={<HomePage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
