import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const API_BASE = import.meta.env.VITE_API_URL || 'https://my-mart-backend-two.vercel.app/api';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success && response.data.user?.role === 'admin') {
        setUser(response.data.user);
      } else {
        localStorage.removeItem('admin_token');
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('admin_token');
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      
      if (response.data.success && response.data.user?.role === 'admin') {
        localStorage.setItem('admin_token', response.data.token);
        setUser(response.data.user);
        return { success: true };
      } else if (response.data.success) {
        localStorage.removeItem('admin_token');
        setUser(null);
        const message = 'هذا الحساب ليس حساب مدير ولا يمكنه الدخول إلى لوحة الإدارة.';
        setError(message);
        return { success: false, error: message };
      } else {
        setError(response.data.error);
        return { success: false, error: response.data.error };
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Login failed. Check if backend is running on port 5000.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
