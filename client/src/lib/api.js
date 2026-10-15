import axios from 'axios';

function resolveBaseUrl() {
  if (import.meta.env.PROD) {
    return '/api';
  }

  return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

export function getApiErrorMessage(error) {
  return error.response?.data?.error?.message || 'Something went wrong. Please try again.';
}

export default api;
