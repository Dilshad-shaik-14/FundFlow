import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { getApiErrorMessage } from '../lib/api.js';

const navigation = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/startups', label: 'Startups' },
  { to: '/investors', label: 'Investors' },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState('');

  async function handleLogout() {
    setLogoutError('');

    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      setLogoutError(getApiErrorMessage(error));
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex items-center justify-between gap-8">
            <span className="text-lg font-bold tracking-tight text-emerald-800">FundFlow</span>
            <nav aria-label="Main navigation" className="flex gap-1">
              {navigation.map(({ to, label }) => (
                <NavLink
                  className={({ isActive }) =>
                    `rounded-lg px-3 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                  key={to}
                  to={to}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="truncate text-sm text-slate-600">{user?.name}</span>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={handleLogout}
              type="button"
            >
              Sign out
            </button>
          </div>
          {logoutError && <p className="text-sm text-red-700" role="alert">{logoutError}</p>}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
