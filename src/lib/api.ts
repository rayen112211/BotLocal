import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('business');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  signup: (email: string, password: string, name: string) =>
    api.post('/auth/signup', { email, password, name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

// Dashboard endpoints
export const dashboardAPI = {
  getStats: (businessId: string) =>
    api.get(`/dashboard/${businessId}`),
  getAnalytics: (businessId: string) =>
    api.get(`/dashboard/${businessId}/analytics`),
};

// Bookings endpoints
export const bookingsAPI = {
  getAll: () => api.get('/bookings'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  create: (booking: any) => api.post('/bookings', booking),
  update: (id: string, booking: any) => api.put(`/bookings/${id}`, booking),
  delete: (id: string) => api.delete(`/bookings/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/bookings/${id}/status`, { status }),
  sendReview: (id: string) => api.post(`/bookings/${id}/send-review`),
  getStats: () => api.get('/bookings/stats/summary'),
};

// Knowledge base endpoints
export const scannerAPI = {
  getAll: () => api.get('/scanner'),
  getById: (id: string) => api.get(`/scanner/${id}`),
  scan: (url: string, businessId: string) =>
    api.post('/scanner/scan', { url, businessId }),
  rescan: (id: string) => api.post(`/scanner/${id}/rescan`),
  update: (id: string, content: string) =>
    api.put(`/scanner/${id}`, { content }),
  delete: (id: string) => api.delete(`/scanner/${id}`),
};

// Stripe/Billing - plan is only updated via Stripe webhook; frontend only reads
export const billingAPI = {
  getSubscription: () => api.get('/stripe/subscription'),
  createCheckout: (planId: string) =>
    api.post('/stripe/create-checkout-session', { planId }),
};

// Conversations (if we add a route for it)
export const conversationsAPI = {
  getAll: (businessId: string) => api.get(`/conversations/${businessId}`),
  getById: (businessId: string, customerPhone: string) =>
    api.get(`/conversations/${businessId}/${customerPhone}`),
  toggleAi: (conversationId: string, isAiEnabled: boolean) =>
    api.patch('/conversations/toggle-ai', { conversationId, isAiEnabled }),
};

// Business settings
export const businessAPI = {
  update: (data: any) => api.put('/business', data),
  get: () => api.get('/business'),
};

// Telegram status
export const telegramAPI = {
  getStatus: (businessId: string) => api.get(`/telegram/business-status/${businessId}`),
  registerWebhook: (businessId: string, backendUrl: string) =>
    api.post(`/telegram/register-webhook/${businessId}`, { backendUrl }),
};

// Notifications
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// System health
export const healthAPI = {
  getDetailed: () => api.get('/health/detailed'),
  getSystemStatus: () => api.get('/system/status'),
};

export default api;
