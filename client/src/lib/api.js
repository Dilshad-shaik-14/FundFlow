import axios from 'axios';

function resolveBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return '/api';
    }
  }
  return envUrl || 'http://localhost:5000/api';
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
