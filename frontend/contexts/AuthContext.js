// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      if (token) {
        // Mock user data for development
        setUser({
          id: 'user123',
          name: 'Connecta User',
          email: 'user@connecta.com',
          profilePicture: '',
          department: 'Development',
          title: 'Software Developer'
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await SecureStore.deleteItemAsync('userToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData, token) => {
    try {
      setUser(userData);
      await SecureStore.setItemAsync('userToken', token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await SecureStore.deleteItemAsync('userToken');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const updateUser = async (updatedUserData) => {
    try {
      setUser(updatedUserData);
    } catch (error) {
      console.error('User update failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;