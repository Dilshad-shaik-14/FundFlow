import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import InvestorEditorPage from './InvestorEditorPage.jsx';
import InvestorsPage from './InvestorsPage.jsx';
import StartupEditorPage from './StartupEditorPage.jsx';
import StartupsPage from './StartupsPage.jsx';
import api from '../lib/api.js';

afterEach(() => {
  cleanup();
});

describe('startup management pages', () => {
  it('loads and deletes a startup after confirmation', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: {
          startups: [{
            id: 'startup-1',
            name: 'Aster Labs',
            industry: 'Climate',
            fundingGoal: 100000,
            fundingRaised: 25000,
            description: '',
          }],
        },
      },
    });
    vi.spyOn(api, 'delete').mockResolvedValue({ data: { success: true } });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <StartupsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Aster Labs' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/startups/startup-1'));
    expect(screen.getByText('No startups yet')).toBeInTheDocument();
  });

  it('keeps a startup listed and explains when linked investors block deletion', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: {
          startups: [{
            id: 'startup-1',
            name: 'Aster Labs',
            industry: 'Climate',
            fundingGoal: 100000,
            fundingRaised: 25000,
            description: '',
          }],
        },
      },
    });
    vi.spyOn(api, 'delete').mockRejectedValue({
      response: {
        data: {
          error: { message: 'Remove this startup’s investors before deleting the startup.' },
        },
      },
    });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <StartupsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Aster Labs' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(window.confirm).toHaveBeenCalledWith(
      'Delete Aster Labs? Delete its linked investors first.',
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Remove this startup’s investors before deleting the startup.',
    );
    expect(screen.getByRole('heading', { name: 'Aster Labs' })).toBeInTheDocument();
  });

  it('submits startup form values and navigates after creation', async () => {
    vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true } });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/startups/new']}>
        <Routes>
          <Route path="/startups/new" element={<StartupEditorPage />} />
          <Route path="/startups" element={<p>Startup saved</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.type(await screen.findByLabelText('Startup name'), 'Aster Labs');
    await user.type(screen.getByLabelText('Funding goal'), '100000');
    await user.click(screen.getByRole('button', { name: 'Create startup' }));

    expect(await screen.findByText('Startup saved')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/startups', expect.objectContaining({
      name: 'Aster Labs',
      fundingGoal: 100000,
      fundingRaised: 0,
    }));
  });
});

describe('investor management pages', () => {
  it('loads investor status and follow-up information', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: {
        data: {
          investors: [{
            id: 'investor-1',
            startup: { id: 'startup-1', name: 'Aster Labs' },
            name: 'Morgan Investor',
            firm: 'Northstar Capital',
            status: 'contacted',
            followUpDate: '2026-11-01',
          }],
        },
      },
    });

    render(
      <MemoryRouter>
        <InvestorsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Morgan Investor' })).toBeInTheDocument();
    expect(screen.getByText('Northstar Capital · Aster Labs')).toBeInTheDocument();
    expect(screen.getByText('Contacted · Follow up 2026-11-01')).toBeInTheDocument();
  });

  it('associates a new investor with a selected startup and saves follow-up data', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({
      data: { data: { startups: [{ id: 'startup-1', name: 'Aster Labs' }] } },
    });
    vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true } });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/investors/new']}>
        <Routes>
          <Route path="/investors/new" element={<InvestorEditorPage />} />
          <Route path="/investors" element={<p>Investor saved</p>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.selectOptions(await screen.findByLabelText('Startup'), 'startup-1');
    await user.type(screen.getByLabelText('Investor name'), 'Morgan Investor');
    await user.selectOptions(screen.getByLabelText('Status'), 'contacted');
    await user.type(screen.getByLabelText('Follow-up date'), '2026-11-01');
    await user.click(screen.getByRole('button', { name: 'Add investor' }));

    expect(await screen.findByText('Investor saved')).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/investors', {
      startupId: 'startup-1',
      name: 'Morgan Investor',
      firm: '',
      email: '',
      status: 'contacted',
      followUpDate: '2026-11-01',
      notes: '',
    });
  });
});
