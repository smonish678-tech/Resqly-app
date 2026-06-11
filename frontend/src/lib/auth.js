import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('resqly_token'));
  const [role, setRole] = useState(() => localStorage.getItem('resqly_role'));
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!localStorage.getItem('resqly_token')) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/me');
      setMe(data.user);
      setRole(data.user.role);
      localStorage.setItem('resqly_role', data.user.role);
    } catch (e) {
      setMe(null);
      setToken(null);
      setRole(null);
      localStorage.removeItem('resqly_token');
      localStorage.removeItem('resqly_role');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMe(); }, [loadMe]);

  const login = (tk, r) => {
    localStorage.setItem('resqly_token', tk);
    localStorage.setItem('resqly_role', r);
    setToken(tk);
    setRole(r);
    loadMe();
  };

  const logout = () => {
    localStorage.removeItem('resqly_token');
    localStorage.removeItem('resqly_role');
    setToken(null);
    setRole(null);
    setMe(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, me, loading, login, logout, refresh: loadMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
