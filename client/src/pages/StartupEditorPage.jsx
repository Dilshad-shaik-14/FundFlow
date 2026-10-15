import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import StartupForm from '../components/StartupForm.jsx';
import { getApiErrorMessage } from '../lib/api.js';
import api from '../lib/api.js';

export default function StartupEditorPage() {
  const { startupId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(startupId);
  const [startup, setStartup] = useState(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEditing) {
      return;
    }

    let isActive = true;
    api
      .get(`/startups/${startupId}`)
      .then((response) => {
        if (isActive) {
          setStartup(response.data.data.startup);
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
  }, [isEditing, startupId]);

  async function saveStartup(input) {
    setIsSubmitting(true);
    setError('');

    try {
      if (isEditing) {
        await api.patch(`/startups/${startupId}`, input);
      } else {
        await api.post('/startups', input);
      }

      navigate('/startups', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl">
      <Link className="text-sm font-medium text-emerald-700 hover:text-emerald-800" to="/startups">
        Back to startups
      </Link>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEditing ? 'Edit startup' : 'Add a startup'}
        </h1>
        {isLoading ? (
          <p className="py-8 text-sm text-slate-600">Loading startup…</p>
        ) : error && !startup && isEditing ? (
          <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>
        ) : (
          <>
            {error && <p className="my-5 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
            <div className="mt-6">
              <StartupForm initialValue={startup} isSubmitting={isSubmitting} onSubmit={saveStartup} />
            </div>
          </>
        )}
      </div>
    </section>
  );
}
