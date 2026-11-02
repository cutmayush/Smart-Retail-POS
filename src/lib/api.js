import axios from 'axios';

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const apiBaseUrl = /^https?:\/\//i.test(configuredApiBaseUrl)
  ? configuredApiBaseUrl
  : `https://${configuredApiBaseUrl}`;
const API_BASE_URL = apiBaseUrl.replace(/\/+$/, '').endsWith('/api')
  ? apiBaseUrl.replace(/\/+$/, '')
  : `${apiBaseUrl.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every outgoing request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('smart-retail-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Globally handle expired/invalid tokens
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('smart-retail-token');
      localStorage.removeItem('smart-retail-auth');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
