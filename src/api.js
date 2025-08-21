// src/api.js
import axios from 'axios';

// detect prod (Vercel) vs dev
const isBrowser = typeof window !== 'undefined';
const isVercel = isBrowser && /vercel\.app$/.test(window.location.host);

// your local dev backend; adjust if needed
const DEV_BASE = process.env.REACT_APP_API_URL || 'http://192.168.1.212:5000';
const BASE_URL = isVercel ? '/api' : DEV_BASE;

// any hard-coded origins we want to strip from requests
const KNOWN_BACKENDS = [
  DEV_BASE,
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://192.168.1.212:5000',
  'https://maks-backend.onrender.com',
].filter(Boolean);

// normalize hard-coded absolute URLs to relative so baseURL + Vercel rewrites work
function normalizeUrl(url = '') {
  // strip known origins
  for (const origin of KNOWN_BACKENDS) {
    if (url.startsWith(origin + '/')) {
      url = url.slice(origin.length);
      break;
    }
    if (url === origin) {
      url = '/';
      break;
    }
  }
  // collapse accidental double-prefixes like /api/api/...
  url = url.replace(/^\/api\/api\//, '/api/');

  // ensure leading slash for relative requests
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    url = '/' + url;
  }
  return url;
}

const api = axios.create({ baseURL: BASE_URL });

// attach token + normalize URLs
api.interceptors.request.use((config) => {
  if (config.url) config.url = normalizeUrl(config.url);

  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// optional: force re-login on 401/403
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
