import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../auth/AuthContext.jsx';
import api from '../lib/api.js';
import DashboardPage from './DashboardPage.jsx';

afterEach(() => {
  cleanup();
});

function renderDashboard() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('dashboard page', () => {
  it('renders API metrics and the funding progress accessibly', async () => {
    vi.spyOn(api, 'get').mockImplementation((path) => {
      if (path === '/auth/me') {
        return Promise.resolve({
          data: { data: { user: { id: 'user-1', name: 'Taylor Founder' } } },
        });
      }

      return Promise.resolve({
        data: {
          data: {
            metrics: {
              startupCount: 2,
              totalFundingGoal: 100000,
              totalFundingRaised: 25000,
              investorCount: 3,
              investorStatusCounts: {
                potential: 1,
                contacted: 1,
                meeting_scheduled: 0,
                passed: 0,
                committed: 1,
              },
              overdueFollowUps: 1,
              followUpsDueToday: 0,
              upcomingFollowUps: 2,
            },
          },
        },
      });
    });

    renderDashboard();

    expect(await screen.findByRole('heading', { name: 'Welcome, Taylor' })).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
    expect(screen.getByLabelText('25% of total funding goal')).toHaveAttribute('aria-valuenow', '25');
    expect(screen.getByText('Next 7 days')).toBeInTheDocument();
    expect(screen.getByText('Potential')).toBeInTheDocument();
  });

  it('surfaces dashboard request failures and retries', async () => {
    const apiGet = vi.spyOn(api, 'get').mockImplementation((path) => {
      if (path === '/auth/me') {
        return Promise.resolve({
          data: { data: { user: { id: 'user-1', name: 'Taylor Founder' } } },
        });
      }

      return Promise.reject({
        response: { data: { error: { message: 'Dashboard is unavailable.' } } },
      });
    });
    const user = userEvent.setup();

    renderDashboard();

    expect(await screen.findByRole('alert')).toHaveTextContent('Dashboard is unavailable.');
    apiGet.mockImplementation((path) => {
      if (path === '/auth/me') {
        return Promise.resolve({
          data: { data: { user: { id: 'user-1', name: 'Taylor Founder' } } },
        });
      }

      return Promise.resolve({
        data: {
          data: {
            metrics: {
              startupCount: 0,
              totalFundingGoal: 0,
              totalFundingRaised: 0,
              investorCount: 0,
              investorStatusCounts: {
                potential: 0,
                contacted: 0,
                meeting_scheduled: 0,
                passed: 0,
                committed: 0,
              },
              overdueFollowUps: 0,
              followUpsDueToday: 0,
              upcomingFollowUps: 0,
            },
          },
        },
      });
    });

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Funding progress')).toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledWith('/dashboard/metrics');
  });
});
