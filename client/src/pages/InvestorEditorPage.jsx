import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import InvestorForm from '../components/InvestorForm.jsx';
import { getApiErrorMessage } from '../lib/api.js';
import api from '../lib/api.js';

export default function InvestorEditorPage() {
  const { investorId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(investorId);
  const [investor, setInvestor] = useState(null);
  const [startups, setStartups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;
    const requests = [
      api.get('/startups'),
      ...(isEditing ? [api.get(`/investors/${investorId}`)] : []),
    ];

    Promise.all(requests)
      .then(([startupResponse, investorResponse]) => {
        if (isActive) {
          setStartups(startupResponse.data.data.startups);
          if (investorResponse) {
            setInvestor(investorResponse.data.data.investor);
          }
        }
      })
      .catch((requestError) => {
        if (isActive) {
          setError(getApiErrorMessage(requestError));
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [investorId, isEditing]);

  async function saveInvestor(input) {
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await api.patch(`/investors/${investorId}`, input);
      } else {
        await api.post('/investors', input);
      }

      navigate('/investors', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const missingStartup = !isLoading && startups.length === 0;

  return (
    <section className="mx-auto max-w-3xl">
      <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" to="/investors">
        Back to investors
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEditing ? 'Edit investor' : 'Add an investor'}
        </h1>
        {isLoading ? (
          <p className="py-8 text-sm text-slate-600">Loading investor details…</p>
        ) : error && isEditing && !investor ? (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
        ) : missingStartup ? (
          <div className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            <p>Add a startup before creating an investor record.</p>
            <Link className="mt-3 inline-block font-semibold underline" to="/startups/new">
              Add a startup
            </Link>
          </div>
        ) : (
          <>
            {error && <p className="my-5 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
            <div className="mt-6">
              <InvestorForm
                initialValue={investor}
                isSubmitting={isSubmitting}
                onSubmit={saveInvestor}
                startups={startups}
              />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
