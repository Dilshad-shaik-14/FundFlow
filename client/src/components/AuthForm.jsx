import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({ name, email, password });
      } else {
        await login({ email, password });
      }

      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
        <Link to="/" className="text-sm font-semibold tracking-wide text-emerald-700">
          FUNDFLOW
        </Link>
        <h1 className="mt-8 text-2xl font-semibold tracking-tight text-slate-900">
          {isRegister ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {isRegister
            ? 'Keep your startup fundraising organized.'
            : 'Sign in to manage your fundraising pipeline.'}
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          {isRegister && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="name">
                Full name
              </label>
              <input
                autoComplete="name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                id="name"
                maxLength={80}
                minLength={2}
                onChange={(event) => setName(event.target.value)}
                required
                value={name}
              />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="email">
              Email address
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              id="password"
              maxLength={72}
              minLength={isRegister ? 8 : undefined}
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}

          <button
            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isRegister ? 'Already have an account?' : 'New to FundFlow?'}{' '}
          <Link
            className="font-semibold text-emerald-700 hover:text-emerald-800"
            to={isRegister ? '/login' : '/register'}
          >
            {isRegister ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </main>
  );
}
