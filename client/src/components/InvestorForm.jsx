import { INVESTOR_STATUS_LABELS } from '../lib/investorStatuses.js';

export default function InvestorForm({
  initialValue,
  isSubmitting,
  onSubmit,
  startups,
}) {
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      startupId: formData.get('startupId'),
      name: formData.get('name'),
      firm: formData.get('firm'),
      email: formData.get('email'),
      status: formData.get('status'),
      followUpDate: formData.get('followUpDate') || null,
      notes: formData.get('notes'),
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="investor-startup">
          Startup
        </label>
        <select
          className="form-input"
          defaultValue={initialValue?.startup.id ?? ''}
          id="investor-startup"
          name="startupId"
          required
        >
          <option disabled value="">Select a startup</option>
          {startups.map((startup) => (
            <option key={startup.id} value={startup.id}>{startup.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="investor-name">
            Investor name
          </label>
          <input
            className="form-input"
            defaultValue={initialValue?.name ?? ''}
            id="investor-name"
            maxLength={120}
            minLength={2}
            name="name"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="investor-firm">
            Firm
          </label>
          <input
            className="form-input"
            defaultValue={initialValue?.firm ?? ''}
            id="investor-firm"
            maxLength={120}
            name="firm"
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="investor-email">
            Email
          </label>
          <input
            className="form-input"
            defaultValue={initialValue?.email ?? ''}
            id="investor-email"
            name="email"
            type="email"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="investor-status">
            Status
          </label>
          <select
            className="form-input"
            defaultValue={initialValue?.status ?? 'potential'}
            id="investor-status"
            name="status"
          >
            {Object.entries(INVESTOR_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="follow-up-date">
          Follow-up date
        </label>
        <input
          className="form-input"
          defaultValue={initialValue?.followUpDate ?? ''}
          id="follow-up-date"
          name="followUpDate"
          type="date"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="investor-notes">
          Notes
        </label>
        <textarea
          className="form-input min-h-28"
          defaultValue={initialValue?.notes ?? ''}
          id="investor-notes"
          maxLength={2000}
          name="notes"
          rows={4}
        />
      </div>
      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Saving…' : initialValue ? 'Save changes' : 'Add investor'}
      </button>
    </form>
  );
}
