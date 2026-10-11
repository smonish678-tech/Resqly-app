import axios from 'axios';

const BACKEND_URL = (process.env.REACT_APP_BACKEND_URL || '').trim().replace(/\/+$/, '');
export const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  if (!BACKEND_URL && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    // The app can still render, but API calls fail with a helpful configuration error
    // instead of silently calling the wrong preview server.
    return Promise.reject(new Error('Resqly backend URL is not configured for this build. Please update REACT_APP_BACKEND_URL.'));
  }
  const token = localStorage.getItem('resqly_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      // Auth state is reset only by the auth provider to avoid competing redirects.
    }
    return Promise.reject(err);
  }
);

export default api;
