import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Add token to all requests automatically
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.log('Token retrieval error:', error);
  }
  return config;
});

// Handle API errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;