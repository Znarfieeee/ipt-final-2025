import React, { createContext, useState, useContext, useEffect } from 'react';
import backendConnection from '../api/BackendConnection';
import { errorToast } from '../util/alertHelper';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (token exists in localStorage)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // You would typically have an endpoint to verify token and get user info
          // For now, we'll use a fake implementation
          const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
          setUser(userInfo);
        } catch (error) {
          console.error('Failed to restore authentication', error);
          // Clear invalid tokens
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await backendConnection.login(email, password);
      
      // Save token and user info
      localStorage.setItem('token', response.token);
      localStorage.setItem('userInfo', JSON.stringify(response.user));
      
      setUser(response.user);
      return response;
    } catch (error) {
      errorToast(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await backendConnection.logout();
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      // Clear user data regardless of API call success
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      setUser(null);
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 