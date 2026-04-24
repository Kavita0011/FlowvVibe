/**
 * Flowvibe API Client
 * Connects frontend to Cloudflare Worker API (which uses Neon)
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

function sanitizeInput(input: any) {
  if (typeof input !== 'string') return input;
  return input.trim().slice(0, 10000);
}

function getToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    // Token format from worker: "base64(payload).hmacSig"
    // Token format from Express JWT: "header.payload.sig" (3 parts)
    const parts = token.split('.');
    // Worker token has 2 parts, JWT has 3
    const payloadPart = parts.length === 3 ? parts[1] : parts[0];
    const payload = JSON.parse(atob(payloadPart));
    const expiry = payload.exp;
    // Worker uses milliseconds timestamp, JWT uses seconds
    const isExpired = expiry
      ? expiry > 1e12
        ? Date.now() > expiry          // worker ms
        : Date.now() > expiry * 1000   // JWT seconds
      : false;
    if (isExpired) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
  } catch {
    // Token is not parseable — clear it
    localStorage.removeItem('token');
    return null;
  }

  return token;
}

async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new Error('Invalid response from server');
  }

  if (!response.ok) {
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data;
}

async function apiRequestWithBody(endpoint: string, data: Record<string, any>) {
  const sanitizedData: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    sanitizedData[sanitizeInput(key)] = typeof value === 'string' ? sanitizeInput(value) : value;
  }
  return apiRequest(endpoint, { method: 'POST', body: JSON.stringify(sanitizedData) });
}

// Auth API
export const auth = {
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: sanitizeInput(email), password: sanitizeInput(password) }),
    }),

  register: (email: string, password: string, displayName: string) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: sanitizeInput(email),
        password: sanitizeInput(password),
        displayName: sanitizeInput(displayName),
      }),
    }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  },

  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (email: string, token: string, newPassword: string) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword }),
    }),

  verify: () => apiRequest('/auth/verify'),
};

// Pricing API
export const pricing = {
  getPlans: () => apiRequest('/pricing'),
  getTiers: () => apiRequest('/tiers'),
};

// Chatbots API
export const chatbotsApi = {
  getAll: () => apiRequest('/chatbots'),
  getById: (id: string) => apiRequest(`/chatbots/${id}`),
  create: (data: any) => apiRequest('/chatbots', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    apiRequest(`/chatbots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/chatbots/${id}`, { method: 'DELETE' }),
};

// Payments API
export const payments = {
  create: (data: any) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
  getAll: () => apiRequest('/payments'),
  getMy: () => apiRequest('/payments'),
  update: (data: any) =>
    apiRequest('/payments/update', { method: 'PUT', body: JSON.stringify(data) }),
};

// User/Profile API
export const profile = {
  get: () => apiRequest('/profile'),
  update: (data: any) => apiRequest('/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updatePassword: (newPassword: string) =>
    apiRequest('/profile/password', { method: 'PUT', body: JSON.stringify({ password: newPassword }) }),
  delete: () => apiRequest('/profile', { method: 'DELETE' }),
};

// Subscriptions API
export const subscriptions = {
  get: () => apiRequest('/subscription'),
  create: (data: any) => apiRequestWithBody('/subscription', data),
};

// Tier Info API
export const tier = {
  getInfo: () => apiRequest('/tier-info'),
};

// Health check
export const health = () => apiRequest('/health');

// PRD API
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

// PRD Builder API
export const prds = {
  getAll: () => apiRequest('/prds'),
  get: (id: string) => apiRequest(`/prds/${id}`),
  create: (data: any) => apiRequest('/prds', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest(`/prds/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest(`/prds/${id}`, { method: 'DELETE' }),
};

// Admin API
export const admin = {
  getPayments: (status?: string) =>
    apiRequest(status ? `/admin/payments?status=${status}` : '/admin/payments'),
  updatePayment: (data: any) =>
    apiRequest('/admin/payments/update', { method: 'POST', body: JSON.stringify(data) }),
  approvePayment: (data: any) =>
    apiRequest('/admin/payments/approve', { method: 'POST', body: JSON.stringify(data) }),
  rejectPayment: (data: any) =>
    apiRequest('/admin/payments/reject', { method: 'POST', body: JSON.stringify(data) }),
  getUsers: () => apiRequest('/admin/users'),
  updateUser: (data: any) =>
    apiRequest('/admin/users/update', { method: 'POST', body: JSON.stringify(data) }),
  deleteUser: (userId: string) =>
    apiRequest('/admin/users/delete', { method: 'POST', body: JSON.stringify({ userId }) }),
  getChatbots: (status?: string) =>
    apiRequest(status ? `/admin/chatbots?status=${status}` : '/admin/chatbots'),
  deleteChatbot: (chatbotId: string) =>
    apiRequest('/admin/chatbots', { method: 'DELETE', body: JSON.stringify({ chatbotId }) }),
  getLeads: () => apiRequest('/admin/leads'),
  updateLead: (data: any) =>
    apiRequest('/admin/leads/update', { method: 'POST', body: JSON.stringify(data) }),
  deleteLead: (leadId: string) =>
    apiRequest('/admin/leads', { method: 'DELETE', body: JSON.stringify({ leadId }) }),
  getSettings: () => apiRequest('/admin/settings'),
  saveSettings: (data: any) =>
    apiRequest('/admin/settings', { method: 'POST', body: JSON.stringify(data) }),
  savePricingPlan: (data: any) =>
    apiRequest('/admin/pricing', { method: 'POST', body: JSON.stringify(data) }),
  updateSubscription: (data: any) =>
    apiRequest('/admin/subscriptions/update', { method: 'POST', body: JSON.stringify(data) }),
  getAnalytics: () => apiRequest('/admin/analytics'),
  getRevenueStats: () => apiRequest('/admin/stats/revenue'),
  getUserStats: () => apiRequest('/admin/stats/users'),
  exportChatbots: (format = 'json') => apiRequest(`/admin/export/chatbots?format=${format}`),
  exportUsers: (format = 'json') => apiRequest(`/admin/export/users?format=${format}`),
  exportPayments: (format = 'json') => apiRequest(`/admin/export/payments?format=${format}`),
};

export default apiRequest;
