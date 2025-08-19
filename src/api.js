import axios from 'axios';

const api = axios.create({
  baseURL:
    process.env.NODE_ENV === 'development'
      ? process.env.REACT_APP_API_URL || 'http://192.168.1.212:5000'
      : '/api', // ✅ when deployed, all calls go through vercel.json rewrites
});

// ✅ Attach JWT token automatically if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
