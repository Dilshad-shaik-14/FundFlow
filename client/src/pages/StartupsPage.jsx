import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getApiErrorMessage } from '../lib/api.js';
import api from '../lib/api.js';

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function StartupsPage() {
  const [startups, setStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStartups = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.get('/startups');
      setStartups(response.data.data.startups);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStartups();
  }, [loadStartups]);

  async function deleteStartup(startup) {
    if (!window.confirm(`Delete ${startup.name}? Delete its linked investors first.`)) {
      return;
    }

    setError('');
    try {
      await api.delete(`/startups/${startup.id}`);
      setStartups((current) => current.filter(({ id }) => id !== startup.id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your startups</h1>
          <p className="mt-1 text-sm text-slate-600">Track the companies in your funding pipeline.</p>
        </div>
        <Link className="primary-button inline-flex justify-center" to="/startups/new">
          Add startup
        </Link>
      </div>

      {error && <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-600">Loading startups…</p>
      ) : error && startups.length === 0 ? (
        <div className="rounded-2xl border border-red-200 bg-white p-10 text-center">
          <p className="text-sm text-red-700">Startups could not be loaded.</p>
          <button className="mt-4 text-sm font-semibold text-emerald-700" onClick={loadStartups} type="button">
            Try again
          </button>
        </div>
      ) : startups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="font-semibold">No startups yet</h2>
          <p className="mt-2 text-sm text-slate-600">Add your first startup to start tracking progress.</p>
          <Link className="mt-5 inline-flex primary-button" to="/startups/new">Add a startup</Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {startups.map((startup) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={startup.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">{startup.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">{startup.industry || 'Industry not set'}</p>
                </div>
                <Link
                  aria-label={`Edit ${startup.name}`}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                  to={`/startups/${startup.id}/edit`}
                >
                  Edit
                </Link>
              </div>
              <p className="mt-5 text-sm text-slate-600">
                {formatCurrency(startup.fundingRaised)} raised of {formatCurrency(startup.fundingGoal)}
              </p>
              {startup.description && (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{startup.description}</p>
              )}
              <button
                className="mt-5 text-sm font-medium text-red-700 hover:text-red-800"
                onClick={() => deleteStartup(startup)}
                type="button"
              >
                Delete
              </button>
            </article>
          ))}
        </div>
      )}
      {!isLoading && error && startups.length > 0 && (
        <button className="mt-4 text-sm font-semibold text-emerald-700" onClick={loadStartups} type="button">
          Try again
        </button>
      )}
    </section>
  );
}
