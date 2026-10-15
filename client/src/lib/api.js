import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
});

export function getApiErrorMessage(error) {
  return error.response?.data?.error?.message || 'Something went wrong. Please try again.';
}

export default api;
