import axios from 'axios';

const API_BASE_URL = 'http://localhost:8099';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle redirects
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 302) {
      window.location.href = error.response.headers.location;
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  getLoginUrl: () => `${API_BASE_URL}/oauth2/authorization/google`,
  getHome: () => api.get('/home'),
  getSessionInfo: () => api.get('/session-info'),
  logout: () => api.post('/logout'),
};

export default api;
