/**
 * Flowvibe API Client
 * Connects frontend to Cloudflare Worker API (which uses Neon)
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().slice(0, 10000);
}

function getToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  try {
    const payload = JSON.parse(atob(token));
    if (payload.exp && Date.now() > payload.exp) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  } catch {
    localStorage.removeItem('token');
    return null;
  }
  
  return token;
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (err) {
    throw new Error(err.message);
  }
}

async function apiRequestWithBody(endpoint, data) {
  const sanitizedData = {};
  for (const [key, value] of Object.entries(data)) {
    sanitizedData[sanitizeInput(key)] = typeof value === 'string' ? sanitizeInput(value) : value;
  }
  return apiRequest(endpoint, { method: 'POST', body: JSON.stringify(sanitizedData) });
}

// Auth API
export const auth = {
  login: (email, password) => {
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    return apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email: sanitizedEmail, password: sanitizedPassword }) });
  },

  register: (email, password, displayName) => {
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedPassword = sanitizeInput(password);
    const sanitizedName = sanitizeInput(displayName);
    return apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ email: sanitizedEmail, password: sanitizedPassword, displayName: sanitizedName }) });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  forgotPassword: (email) => {
    return apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
  },

  resetPassword: (email, token, newPassword) => {
    return apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, token, newPassword }) });
  },
};

// Pricing API
export const pricing = {
  getPlans: () => apiRequest('/pricing'),
  getTiers: () => apiRequest('/tiers'),
};

// Chatbots API
export const chatbots = {
  getAll: () => apiRequest('/chatbots'),

  create: (data) => apiRequest('/chatbots', { method: 'POST', body: JSON.stringify(data) }),

  update: (data) => apiRequest('/chatbots', { method: 'PUT', body: JSON.stringify(data) }),

  delete: (id) => apiRequest('/chatbots', { method: 'DELETE', body: JSON.stringify({ id }) }),
};

// Payments API
export const payments = {
  create: (data) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),

  getAll: () => apiRequest('/payments'),

  getMy: () => apiRequest('/payments'),

  update: (data) => apiRequest('/payments/update', { method: 'PUT', body: JSON.stringify(data) }),
};

// User API
export const user = {
  get: () => apiRequest('/profile'),
  update: (data) => apiRequestWithBody('/profile', data),
};

// Subscriptions API
export const subscriptions = {
  get: () => apiRequest('/subscription'),
  create: (data) => apiRequestWithBody('/subscription', data),
};

// Tier Info API (for channel access check)
export const tier = {
  getInfo: () => apiRequest('/tier-info'),
};

// Health check
export const health = () => apiRequest('/health');

// PRD Download (free, no auth)
export const prd = {
  getInfo: () => apiRequest('/prd/info'),
  download: async () => {
    const response = await fetch(`${API_BASE}/prd`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'FlowvVibe_PRD.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};

// Admin API (for admin pages)
export const admin = {
  // Payments
  getPayments: (status) => apiRequest(status ? `/admin/payments?status=${status}` : '/admin/payments'),
  updatePayment: (data) => apiRequest('/admin/payments/update', { method: 'POST', body: JSON.stringify(data) }),
  approvePayment: (data) => apiRequest('/admin/payments/approve', { method: 'POST', body: JSON.stringify(data) }),
  rejectPayment: (data) => apiRequest('/admin/payments/reject', { method: 'POST', body: JSON.stringify(data) }),
  setPaymentProcessing: (data) => apiRequest('/admin/payments/processing', { method: 'POST', body: JSON.stringify(data) }),

  // Users
  getUsers: () => apiRequest('/admin/users'),
  updateUser: (data) => apiRequest('/admin/users/update', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (userId) => apiRequest('/admin/users/delete', { method: 'POST', body: JSON.stringify({ userId }) }),
  impersonateUser: (userId) => apiRequest('/admin/users/impersonate', { method: 'POST', body: JSON.stringify({ userId }) }),

  // Chatbots
  getChatbots: (status) => apiRequest(status ? `/admin/chatbots?status=${status}` : '/admin/chatbots'),
  deleteChatbot: (chatbotId) => apiRequest('/admin/chatbots', { method: 'DELETE', body: JSON.stringify({ chatbotId }) }),
  approveChatbot: (data) => apiRequest('/admin/chatbots/approve', { method: 'POST', body: JSON.stringify(data) }),
  rejectChatbot: (data) => apiRequest('/admin/chatbots/reject', { method: 'POST', body: JSON.stringify(data) }),

  // Leads
  getLeads: () => apiRequest('/admin/leads'),
  updateLead: (data) => apiRequest('/admin/leads/update', { method: 'POST', body: JSON.stringify(data) }),
  deleteLead: (leadId) => apiRequest('/admin/leads', { method: 'DELETE', body: JSON.stringify({ leadId }) }),

  // Settings
  getSettings: () => apiRequest('/admin/settings'),
  saveSettings: (data) => apiRequest('/admin/settings', { method: 'POST', body: JSON.stringify(data) }),
  savePricingPlan: (data) => apiRequest('/admin/pricing', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscription: (data) => apiRequest('/admin/subscriptions/update', { method: 'POST', body: JSON.stringify(data) }),

  // Analytics & Exports
  getAnalytics: () => apiRequest('/admin/analytics'),
  getRevenueStats: () => apiRequest('/admin/stats/revenue'),
  getUserStats: () => apiRequest('/admin/stats/users'),
  exportChatbots: (format = 'json') => apiRequest(`/admin/export/chatbots?format=${format}`),
  exportUsers: (format = 'json') => apiRequest(`/admin/export/users?format=${format}`),
  exportPayments: (format = 'json') => apiRequest(`/admin/export/payments?format=${format}`),
};

// User profile & account
export const profile = {
  update: (data) => apiRequest('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updatePassword: (newPassword) => apiRequest('/profile/password', { method: 'PUT', body: JSON.stringify({ password: newPassword }) }),
  delete: () => apiRequest('/profile', { method: 'DELETE' }),
};

// PRD Builder API
export const prds = {
  getAll: () => apiRequest('/prds'),
  get: (id) => apiRequest(`/prds/${id}`),
  create: (data) => apiRequest('/prds', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`/prds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiRequest(`/prds/${id}`, { method: 'DELETE' }),
};

export default apiRequest;