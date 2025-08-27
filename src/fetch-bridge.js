// src/fetch-bridge.js
const KNOWN_BACKENDS = [
  process.env.REACT_APP_API_URL || '',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://192.168.1.212:5000',
  'https://maks-backend.onrender.com',
].filter(Boolean);

function normalize(url = '') {
  for (const origin of KNOWN_BACKENDS) {
    if (url.startsWith(origin + '/')) { url = url.slice(origin.length); break; }
    if (url === origin) { url = '/'; break; }
  }
  url = url.replace(/^\/api\/api\//, '/api/');
  if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) url = '/' + url;
  return url;
}

(function patchFetch() {
  if (typeof window === 'undefined' || !window.fetch) return;
  const orig = window.fetch.bind(window);

  window.fetch = (input, init = {}) => {
    let url = typeof input === 'string' ? input : input?.url || '';
    const isProd = /vercel\.app$/.test(window.location.host);
    // on Vercel use /api (rewrites); locally keep as-is
    url = isProd ? normalize(url) : url;

    const token = localStorage.getItem('token');
    const headers = new Headers(init.headers || {});
    if (token && !headers.get('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return orig(url, { ...init, headers });
  };
})();
