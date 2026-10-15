import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const refreshUser = useCallback(async () => {
    setStatus('loading');
    setError('');

    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
      setStatus('ready');
      return response.data.data.user;
    } catch (requestError) {
      if (requestError.response?.status === 401) {
        setUser(null);
        setStatus('ready');
        return null;
      }

      setError('Could not connect to FundFlow. Check your connection and try again.');
      setStatus('error');
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    setUser(response.data.data.user);
    setStatus('ready');
    setError('');
    return response.data.data.user;
  };

  const register = async (details) => {
    const response = await api.post('/auth/register', details);
    setUser(response.data.data.user);
    setStatus('ready');
    setError('');
    return response.data.data.user;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        error,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
