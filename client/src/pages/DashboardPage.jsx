import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { getApiErrorMessage } from '../lib/api.js';
import { INVESTOR_STATUS_LABELS } from '../lib/investorStatuses.js';
import api from '../lib/api.js';

const EMPTY_METRICS = {
  startupCount: 0,
  totalFundingGoal: 0,
  totalFundingRaised: 0,
  investorCount: 0,
  investorStatusCounts: Object.fromEntries(
    Object.keys(INVESTOR_STATUS_LABELS).map((status) => [status, 0]),
  ),
  overdueFollowUps: 0,
  followUpsDueToday: 0,
  upcomingFollowUps: 0,
};

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {detail && <p className="mt-1 text-sm text-slate-500">{detail}</p>}
    </article>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.get('/dashboard/metrics');
      setMetrics(response.data.data.metrics);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const data = metrics ?? EMPTY_METRICS;
  const fundingProgress = data.totalFundingGoal > 0
    ? Math.min((data.totalFundingRaised / data.totalFundingGoal) * 100, 100)
    : 0;

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">Fundraising overview</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Welcome, {user?.name?.split(' ')[0] || 'Founder'}
          </h1>
          <p className="mt-1 text-sm text-slate-600">A snapshot of your startup funding pipeline.</p>
        </div>
        <div className="flex gap-3">
          <Link className="secondary-button" to="/startups/new">Add startup</Link>
          <Link className="primary-button" to="/investors/new">Add investor</Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-red-800" role="alert">{error}</p>
          <button
            className="shrink-0 text-left text-sm font-semibold text-red-800 underline"
            onClick={loadMetrics}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      {isLoading ? (
        <div aria-label="Loading dashboard metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="h-32 animate-pulse rounded-2xl bg-slate-200" key={index} />
          ))}
        </div>
      ) : error && !metrics ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Dashboard metrics are unavailable until the request succeeds.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Startups" value={data.startupCount} detail="In your portfolio" />
            <MetricCard label="Investors" value={data.investorCount} detail="Across your startups" />
            <MetricCard label="Funding raised" value={formatCurrency(data.totalFundingRaised)} />
            <MetricCard label="Funding goal" value={formatCurrency(data.totalFundingGoal)} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Funding progress</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatCurrency(data.totalFundingRaised)} raised toward your goals
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-800">
                  {Math.round(fundingProgress)}%
                </span>
              </div>
              <div
                aria-label={`${Math.round(fundingProgress)}% of total funding goal`}
                aria-valuemax="100"
                aria-valuemin="0"
                aria-valuenow={Math.round(fundingProgress)}
                className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100"
                role="progressbar"
              >
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${fundingProgress}%` }}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="font-semibold">Follow-ups</h2>
                <Link className="text-sm font-semibold text-emerald-700" to="/investors">
                  View investors
                </Link>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-red-50 p-3">
                  <p className="text-xl font-semibold text-red-800">{data.overdueFollowUps}</p>
                  <p className="mt-1 text-xs text-red-800">Overdue</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xl font-semibold text-amber-800">{data.followUpsDueToday}</p>
                  <p className="mt-1 text-xs text-amber-800">Due today</p>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <p className="text-xl font-semibold text-emerald-800">{data.upcomingFollowUps}</p>
                  <p className="mt-1 text-xs text-emerald-800">Next 7 days</p>
                </div>
              </div>
            </section>
          </div>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-semibold">Investor pipeline</h2>
                <p className="mt-1 text-sm text-slate-600">Contacts grouped by their current status.</p>
              </div>
              <Link className="text-sm font-semibold text-emerald-700" to="/investors">
                Manage investors
              </Link>
            </div>
            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {Object.entries(INVESTOR_STATUS_LABELS).map(([status, label]) => (
                <div className="rounded-xl bg-slate-50 p-4" key={status}>
                  <dt className="text-sm text-slate-600">{label}</dt>
                  <dd className="mt-2 text-xl font-semibold">{data.investorStatusCounts[status]}</dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}
    </section>
  );
}
