import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function ProtectedRoute() {
  const { user, status, error, refreshUser } = useAuth();

  if (status === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-sm text-slate-600">
        Checking your session…
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p role="alert" className="text-sm text-red-700">{error}</p>
        <button
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          onClick={refreshUser}
          type="button"
        >
          Retry
        </button>
      </main>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
