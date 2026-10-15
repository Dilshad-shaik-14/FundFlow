import axios from 'axios';

function resolveBaseUrl() {
  if (import.meta.env.PROD) {
    return '/api';
  }

  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
}

const TOKEN_STORAGE_KEY = 'fundflow_token';

export function getStoredToken() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    }
  } catch (_error) {
    // Gracefully handle sandboxed environments or private browsing
  }
  return null;
}

export function setStoredToken(token) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  } catch (_error) {
    // Gracefully handle sandboxed environments or private browsing
  }
}

export function clearStoredToken() {
  setStoredToken(null);
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function getApiErrorMessage(error) {
  return error.response?.data?.error?.message || 'Something went wrong. Please try again.';
}

export default api;
