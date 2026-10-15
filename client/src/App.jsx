import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import AppLayout from './components/AppLayout.jsx';
import StartupsPage from './pages/StartupsPage.jsx';
import StartupEditorPage from './pages/StartupEditorPage.jsx';
import InvestorsPage from './pages/InvestorsPage.jsx';
import InvestorEditorPage from './pages/InvestorEditorPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/startups" element={<StartupsPage />} />
              <Route path="/startups/new" element={<StartupEditorPage />} />
              <Route path="/startups/:startupId/edit" element={<StartupEditorPage />} />
              <Route path="/investors" element={<InvestorsPage />} />
              <Route path="/investors/new" element={<InvestorEditorPage />} />
              <Route path="/investors/:investorId/edit" element={<InvestorEditorPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
