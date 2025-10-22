import React, { createContext, useContext, useState, useEffect } from 'react';
import { LogBox, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext();

// Cross-platform storage utility
const storage = {
  setItem: async (key, value) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    } else {
      return SecureStore.setItemAsync(key, value);
    }
  },
  getItem: async (key) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    } else {
      return SecureStore.getItemAsync(key);
    }
  },
  deleteItem: async (key) => {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    } else {
      return SecureStore.deleteItemAsync(key);
    }
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Suppress irrelevant warnings
  useEffect(() => {
    LogBox.ignoreLogs([
      'Animated: `useNativeDriver`',
      'setNativeProps'
    ]);
  }, []);

  useEffect(() => {
    const loadStoredToken = async () => {
      try {
        const token = await storage.getItem('userToken');

        if (token) {
          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(res.data.user);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        await storage.deleteItem('userToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredToken();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      await storage.setItem('userToken', token);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.response) {
        errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Network error: Cannot connect to server';
      } else {
        errorMessage = error.message || 'Login request failed';
      }
      console.error('Login error details:', { message: errorMessage, fullError: error });
      return { success: false, error: errorMessage };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;

      await storage.setItem('userToken', token);
      setUser(user);
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.response?.data?.error || 'Registration failed.' };
    }
  };

  const logout = async () => {
    try {
      await storage.deleteItem('userToken');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};