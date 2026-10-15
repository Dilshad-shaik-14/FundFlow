export default function StartupForm({ initialValue, isSubmitting, onSubmit }) {
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fundingGoal = formData.get('fundingGoal');
    const fundingRaised = formData.get('fundingRaised');

    onSubmit({
      name: formData.get('name'),
      industry: formData.get('industry'),
      website: formData.get('website'),
      description: formData.get('description'),
      fundingGoal: fundingGoal === '' ? 0 : Number(fundingGoal),
      fundingRaised: fundingRaised === '' ? 0 : Number(fundingRaised),
    });
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="startup-name">
          Startup name
        </label>
        <input
          className="form-input"
          defaultValue={initialValue?.name ?? ''}
          id="startup-name"
          maxLength={120}
          minLength={2}
          name="name"
          required
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="industry">
            Industry
          </label>
          <input
            className="form-input"
            defaultValue={initialValue?.industry ?? ''}
            id="industry"
            maxLength={80}
            name="industry"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="website">
            Website
          </label>
          <input
            className="form-input"
            defaultValue={initialValue?.website ?? ''}
            id="website"
            maxLength={2048}
            name="website"
            placeholder="https://example.com"
            type="url"
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="funding-goal">
            Funding goal
          </label>
          <input
            className="form-input"
            defaultValue={initialValue?.fundingGoal ?? ''}
            id="funding-goal"
            min="0"
            name="fundingGoal"
            step="0.01"
            type="number"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="funding-raised">
            Funding raised
          </label>
          <input
            className="form-input"
            defaultValue={initialValue?.fundingRaised ?? ''}
            id="funding-raised"
            min="0"
            name="fundingRaised"
            step="0.01"
            type="number"
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700" htmlFor="description">
          Description
        </label>
        <textarea
          className="form-input min-h-28"
          defaultValue={initialValue?.description ?? ''}
          id="description"
          maxLength={2000}
          name="description"
          rows={4}
        />
      </div>
      <button className="primary-button" disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Saving…' : initialValue ? 'Save changes' : 'Create startup'}
      </button>
    </form>
  );
}
