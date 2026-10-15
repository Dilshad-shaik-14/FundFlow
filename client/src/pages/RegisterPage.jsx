import { Navigate } from 'react-router-dom';
import AuthForm from '../components/AuthForm.jsx';
import { useAuth } from '../auth/AuthContext.jsx';

export default function RegisterPage() {
  const { user, status } = useAuth();

  if (status === 'loading') {
    return <main className="p-8 text-center text-sm text-slate-600">Checking your session…</main>;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthForm mode="register" />;
}
