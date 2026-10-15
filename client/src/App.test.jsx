import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';
import api from './lib/api.js';

afterEach(() => {
  cleanup();
});

function unauthenticatedSession() {
  vi.spyOn(api, 'get').mockRejectedValue({ response: { status: 401 } });
}

describe('authentication flow', () => {
  it('redirects unauthenticated visitors to the login page', async () => {
    unauthenticatedSession();
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeRequired();
  });

  it('registers an account and navigates to the protected dashboard', async () => {
    unauthenticatedSession();
    vi.spyOn(api, 'post').mockResolvedValue({
      data: { data: { user: { id: 'user-1', name: 'Taylor Founder', email: 'taylor@example.com' } } },
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('link', { name: 'Create an account' }));
    await user.type(await screen.findByLabelText('Full name'), 'Taylor Founder');
    await user.type(screen.getByLabelText('Email address'), 'taylor@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct horse battery staple');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('heading', { name: 'Welcome, Taylor' })).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      name: 'Taylor Founder',
      email: 'taylor@example.com',
      password: 'correct horse battery staple',
    });
  });

  it('shows API authentication errors on the login form', async () => {
    unauthenticatedSession();
    vi.spyOn(api, 'post').mockRejectedValue({
      response: { data: { error: { message: 'Email or password is incorrect.' } } },
    });
    const user = userEvent.setup();
    render(<App />);

    await user.type(await screen.findByLabelText('Email address'), 'taylor@example.com');
    await user.type(screen.getByLabelText('Password'), 'incorrect password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.');
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'taylor@example.com',
      password: 'incorrect password',
    }));
  });

  it('uses credentialed cookie requests without storing tokens in browser storage', () => {
    expect(api.defaults.withCredentials).toBe(true);
    expect(window.localStorage.length).toBe(0);
  });
});
