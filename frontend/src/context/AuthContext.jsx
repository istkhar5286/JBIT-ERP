import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('college_erp_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('college_erp_token');
      const storedRole = localStorage.getItem('college_erp_role');
      const storedUser = localStorage.getItem('college_erp_user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setRole(storedRole);
          setUser(JSON.parse(storedUser));

          // Verify token validity with backend
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.data.user);
            setRole(res.data.data.role);
            localStorage.setItem('college_erp_user', JSON.stringify(res.data.data.user));
            localStorage.setItem('college_erp_role', res.data.data.role);
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen to unauthorized event
    const handleUnauthorized = () => logout();
    window.addEventListener('auth_unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth_unauthorized', handleUnauthorized);
  }, []);

  const login = async (selectedRole, credentials) => {
    let endpoint = '/auth/student/login';
    if (selectedRole === 'ADMIN') endpoint = '/auth/admin/login';
    else if (selectedRole === 'FACULTY') endpoint = '/auth/faculty/login';
    else if (selectedRole === 'WARDEN') endpoint = '/auth/warden/login';

    const res = await api.post(endpoint, credentials);

    if (res.data?.success) {
      const { token: receivedToken, role: receivedRole, user: receivedUser } = res.data.data;
      setToken(receivedToken);
      setRole(receivedRole);
      setUser(receivedUser);

      localStorage.setItem('college_erp_token', receivedToken);
      localStorage.setItem('college_erp_role', receivedRole);
      localStorage.setItem('college_erp_user', JSON.stringify(receivedUser));

      return res.data;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const register = async (studentData) => {
    const res = await api.post('/auth/student/register', studentData);
    if (res.data?.success) {
      const { token: receivedToken, role: receivedRole, user: receivedUser } = res.data.data;
      setToken(receivedToken);
      setRole(receivedRole);
      setUser(receivedUser);

      localStorage.setItem('college_erp_token', receivedToken);
      localStorage.setItem('college_erp_role', receivedRole);
      localStorage.setItem('college_erp_user', JSON.stringify(receivedUser));

      return res.data;
    }
    throw new Error(res.data?.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setUser(null);
    localStorage.removeItem('college_erp_token');
    localStorage.removeItem('college_erp_role');
    localStorage.removeItem('college_erp_user');
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success) {
        setUser(res.data.data.user);
        setRole(res.data.data.role);
        localStorage.setItem('college_erp_user', JSON.stringify(res.data.data.user));
        localStorage.setItem('college_erp_role', res.data.data.role);
        return res.data.data.user;
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
    return null;
  };

  const setAuthSession = (receivedToken, receivedRole, receivedUser) => {
    setToken(receivedToken);
    setRole(receivedRole);
    setUser(receivedUser);

    localStorage.setItem('college_erp_token', receivedToken);
    localStorage.setItem('college_erp_role', receivedRole);
    localStorage.setItem('college_erp_user', JSON.stringify(receivedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
        setAuthSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
