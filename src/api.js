// src/api.js
import axios from 'axios';

const isDev = process.env.NODE_ENV === 'development';

const api = axios.create({
  // Local dev -> your LAN backend; Prod (Vercel) -> proxy at /api
  baseURL: isDev
    ? (process.env.REACT_APP_API_URL || 'http://192.168.1.212:5000')
    : '/api',
});

// Attach JWT + sanitize any accidental '/api/' prefix in request path
api.interceptors.request.use((config) => {
  // 🔧 If baseURL already '/api', and url also starts with '/api/', strip one
  if (config.baseURL?.endsWith('/api') && config.url?.startsWith('/api/')) {
    config.url = config.url.replace(/^\/api\//, '/');
  }

  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  return config;
});

export default api;
