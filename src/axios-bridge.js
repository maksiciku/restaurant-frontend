// src/axios-bridge.js
import axios from 'axios';

// --- figure out baseURL (dev vs prod) ---
const isBrowser = typeof window !== 'undefined';
const isVercel = isBrowser && /vercel\.app$/.test(window.location.host);

// use your LAN/dev server locally; use /api on Vercel so rewrites apply
const DEV_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const PROD_BASE = '/api';

// backends we want to strip if someone hard-coded them
const KNOWN_BACKENDS = [
  process.env.REACT_APP_API_URL || '',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://192.168.1.212:5000',
  'https://maks-backend.onrender.com',
].filter(Boolean);

// normalize any incoming url to a relative path, so baseURL + vercel rewrites work
function normalizeUrl(url) {
  if (!url) return url;

  // If absolute and starts with any known backend, strip that origin
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

  // Prevent accidental double /api like /api/api/...
  url = url.replace(/^\/api\/api\//, '/api/');

  // Ensure it starts with a slash for relative requests
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
    url = '/' + url;
  }

  return url;
}

// set baseURL
axios.defaults.baseURL = isVercel ? PROD_BASE : DEV_BASE;

// attach token automatically
axios.interceptors.request.use((config) => {
  // normalize any hard-coded full URLs
  if (config.url) config.url = normalizeUrl(config.url);

  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (res) => res,
  (err) => {
    // Optional: handle 401s globally
    // if (err?.response?.status === 401) { localStorage.removeItem('token'); }
    return Promise.reject(err);
  }
);
