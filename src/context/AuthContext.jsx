import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true); // true while checking localStorage

  // On app load — restore session from localStorage then validate with backend
  useEffect(() => {
    const savedToken = localStorage.getItem('jws_token');
    const savedUser  = localStorage.getItem('jws_user');

    if (!savedToken || !savedUser) {
      setLoading(false);
      return;
    }

    // Optimistically set session first (fast UI)
    setToken(savedToken);
    setUser(JSON.parse(savedUser));

    // Then validate token is still alive with backend
    authAPI.me()
      .then((res) => {
        // Refresh user data from server
        const freshUser = res.data.user || res.data;
        localStorage.setItem('jws_user', JSON.stringify(freshUser));
        setUser(freshUser);
      })
      .catch((err) => {
        // Only clear session on a confirmed 401 (invalid/expired token).
        // Do NOT clear on network errors (CORS, backend down, etc.)
        // so the user stays logged in if we can't reach the server.
        if (err.response?.status === 401) {
          localStorage.removeItem('jws_token');
          localStorage.removeItem('jws_refresh_token');
          localStorage.removeItem('jws_user');
          setToken(null);
          setUser(null);
        } else {
          console.warn('[AuthContext] Could not validate token with server (network/CORS error). Using cached session.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  // Called after login or set-password succeeds
  function saveSession(token, refreshToken, userData) {
    localStorage.setItem('jws_token',        token);
    localStorage.setItem('jws_refresh_token', refreshToken);
    localStorage.setItem('jws_user',          JSON.stringify(userData));
    setToken(token);
    setUser(userData);
  }

  // Logout
  async function logout() {
    try { await authAPI.logout(); } catch (_) {}
    localStorage.removeItem('jws_token');
    localStorage.removeItem('jws_refresh_token');
    localStorage.removeItem('jws_user');
    setToken(null);
    setUser(null);
  }

  const isAuthenticated = !!token;
  const role            = user?.role || null;

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated, role, saveSession, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
