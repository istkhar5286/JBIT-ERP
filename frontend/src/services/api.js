import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('college_erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle token expiration and server availability
api.interceptors.response.use(
  (response) => {
    // Notify application that backend connection is healthy
    window.dispatchEvent(new Event('erp_server_recovered'));
    return response;
  },
  (error) => {
    // Detect server down, network drop, or service worker 503 offline fallback
    if (!error.response || error.code === 'ERR_NETWORK' || error.response.status === 503) {
      window.dispatchEvent(new Event('erp_server_unavailable'));
    }

    if (error.response && error.response.status === 401) {
      // If unauthorized, clear auth and dispatch event
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        localStorage.removeItem('college_erp_token');
        localStorage.removeItem('college_erp_user');
        localStorage.removeItem('college_erp_role');
        window.dispatchEvent(new Event('auth_unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
