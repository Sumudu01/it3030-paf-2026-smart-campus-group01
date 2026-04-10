import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle redirects and errors
let authCheckRetries = 0;
api.interceptors.response.use(
  (response) => {
    authCheckRetries = 0;
    return response;
  },
  async (error) => {
    // Handle OAuth redirect during login
    if (error.response?.status === 302) {
      window.location.href = error.response.headers.location;
    }
    
    // Handle 401 Unauthorized - retry a couple of times for session propagation
    if (error.response?.status === 401) {
      if (authCheckRetries < 2) {
        authCheckRetries++;
        await new Promise(resolve => setTimeout(resolve, 500));
        return api.get('/api/auth/user');
      }
      authCheckRetries = 0;
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied:', error.response.data?.error || 'Forbidden');
    }
    
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Get login endpoint from backend (for OAuth SPA flow)
  getLoginEndpoint: () => api.get('/api/login'),
  
  // Legacy (deprecated)
  getLoginUrl: () => `${API_BASE_URL}/oauth2/authorization/google`,
  
  // Legacy Thymeleaf endpoints (for backward compatibility)
  getHome: () => api.get('/home'),
  getSessionInfo: () => api.get('/session-info'),
  logout: () => api.post('/logout'),
  
  // REST API endpoints
  getCurrentUser: () => api.get('/api/auth/user'),
  selectRole: (role) => api.post('/api/auth/select-role', null, { params: { role } }),
  updateProfile: (name, picture) => api.post('/api/auth/profile', null, { params: { name, picture } }),
  updateUserRole: (email, role) => api.put(`/api/auth/user/${email}/role`, null, { params: { role } }),
  deleteUser: (email) => api.delete(`/api/auth/user/${email}`),
  getAllUsers: () => api.get('/api/auth/users'),
  
  // Permission management (Admin only)
  grantPermissions: (email, permissions) => api.put(`/api/auth/user/${email}/permissions`, { permissions }),
  revokePermissions: (email, permissions) => api.delete(`/api/auth/user/${email}/permissions`, { data: { permissions } }),
  grantAllPermissions: (email) => api.put(`/api/auth/user/${email}/grant-all-permissions`),
  getAllPermissions: () => api.get('/api/auth/permissions'),
  setUserEnabled: (email, enabled) => api.put(`/api/auth/user/${email}/enable`, null, { params: { enabled } }),
};

export const bookingAPI = {
  getResources: () => api.get('/api/bookings/resources'),
  
  // User bookings
  createBooking: (bookingData) => api.post('/api/bookings', bookingData),
  getMyBookings: () => api.get('/api/bookings/my'),
  cancelBooking: (bookingId) => api.delete(`/api/bookings/${bookingId}`),
  
  // Admin/Staff
  getPendingBookings: () => api.get('/api/bookings/pending'),
  getAllBookings: () => api.get('/api/bookings/admin'),
  approveBooking: (bookingId, reason = '') => api.put(`/api/bookings/${bookingId}/approve`, null, { params: { reason } }),
  rejectBooking: (bookingId, reason) => api.put(`/api/bookings/${bookingId}/reject`, null, { params: { reason } }),
};

export default api;

