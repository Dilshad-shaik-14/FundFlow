import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { INVESTOR_STATUS_LABELS } from '../lib/investorStatuses.js';
import { getApiErrorMessage } from '../lib/api.js';
import api from '../lib/api.js';

export default function InvestorsPage() {
  const [investors, setInvestors] = useState([]);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadInvestors = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.get('/investors', {
        params: status ? { status } : {},
      });
      setInvestors(response.data.data.investors);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadInvestors();
  }, [loadInvestors]);

  async function deleteInvestor(investor) {
    if (!window.confirm(`Delete ${investor.name}?`)) {
      return;
    }

    setError('');
    try {
      await api.delete(`/investors/${investor.id}`);
      setInvestors((current) => current.filter(({ id }) => id !== investor.id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  }

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Investors</h1>
          <p className="mt-1 text-sm text-slate-600">Manage conversations and follow-up dates.</p>
        </div>
        <Link className="primary-button inline-flex justify-center" to="/investors/new">
          Add investor
        </Link>
      </div>

      <div className="mb-5 max-w-xs">
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="status-filter">
          Filter by status
        </label>
        <select
          className="form-input"
          id="status-filter"
          onChange={(event) => setStatus(event.target.value)}
          value={status}
        >
          <option value="">All statuses</option>
          {Object.entries(INVESTOR_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && <p className="mb-5 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-600">Loading investors…</p>
      ) : error && investors.length === 0 ? (
        <div className="rounded-2xl border border-red-200 bg-white p-10 text-center">
          <p className="text-sm text-red-700">Investors could not be loaded.</p>
          <button className="mt-4 text-sm font-semibold text-emerald-700" onClick={loadInvestors} type="button">
            Try again
          </button>
        </div>
      ) : investors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="font-semibold">No investors found</h2>
          <p className="mt-2 text-sm text-slate-600">Add an investor to keep track of your outreach.</p>
          <Link className="mt-5 inline-flex primary-button" to="/investors/new">Add an investor</Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <ul className="divide-y divide-slate-200">
            {investors.map((investor) => (
              <li className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between" key={investor.id}>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{investor.name}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {[investor.firm, investor.startup.name].filter(Boolean).join(' · ')}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {INVESTOR_STATUS_LABELS[investor.status]}
                    {investor.followUpDate ? ` · Follow up ${investor.followUpDate}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  <Link
                    aria-label={`Edit ${investor.name}`}
                    className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                    to={`/investors/${investor.id}/edit`}
                  >
                    Edit
                  </Link>
                  <button
                    className="text-sm font-medium text-red-700 hover:text-red-800"
                    onClick={() => deleteInvestor(investor)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!isLoading && error && investors.length > 0 && (
        <button className="mt-4 text-sm font-semibold text-emerald-700" onClick={loadInvestors} type="button">
          Try again
        </button>
      )}
    </section>
  );
}
