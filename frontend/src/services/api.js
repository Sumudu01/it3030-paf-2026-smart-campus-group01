import axios from 'axios';

const API_BASE_URL = 'http://localhost:8099';

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
  // OAuth
  getLoginUrl: () => `${API_BASE_URL}/oauth2/authorization/google`,
  
  // Legacy Thymeleaf endpoints (for backward compatibility)
  getHome: () => api.get('/home'),
  getSessionInfo: () => api.get('/session-info'),
  logout: () => api.post('/api/auth/logout'),
  
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
  create: ({ resourceId, startAt, endAt, purpose }) =>
    api.post('/api/bookings', { resourceId, startAt, endAt, purpose }),

  mine: () => api.get('/api/bookings/mine'),

  cancel: (id, note) => api.delete(`/api/bookings/${id}`, { params: note ? { note } : undefined }),

  history: (id) => api.get(`/api/bookings/${id}/history`),

  adminPending: () => api.get('/api/bookings/admin/pending'),

  adminApprove: (id, reason) =>
    api.post(`/api/bookings/admin/${id}/approve`, reason ? { reason } : null),

  adminReject: (id, reason) =>
    api.post(`/api/bookings/admin/${id}/reject`, reason ? { reason } : null),
};

export const ticketAPI = {
  create: (formData) => api.post('/api/tickets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/api/tickets'),
  getMine: () => api.get('/api/tickets/mine'),
  getAssigned: () => api.get('/api/tickets/assigned'),
  getById: (id) => api.get(`/api/tickets/${id}`),
  assign: (id, technicianId) => api.post(`/api/tickets/${id}/assign`, { technicianId }),
  updateStatus: (id, status, resolutionNotes) => api.post(`/api/tickets/${id}/status`, { status, resolutionNotes }),
  addComment: (id, content) => api.post(`/api/tickets/${id}/comments`, { content }),
  getComments: (id) => api.get(`/api/tickets/${id}/comments`),
  getTechnicians: () => api.get('/api/auth/users').then(res => ({
    data: res.data.filter(u => u.role === 'TECHNICIAN')
  })),
};

export const notificationAPI = {
  getAll: () => api.get('/api/notifications'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markAsRead: (id) => api.post(`/api/notifications/${id}/read`),
  markAllAsRead: () => api.post('/api/notifications/read-all'),
  delete: (id) => api.delete(`/api/notifications/${id}`),
  clearAll: () => api.delete('/api/notifications/clear-all')
};

export default api;
