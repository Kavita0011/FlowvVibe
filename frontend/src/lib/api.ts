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
};

// Pricing API
export const pricing = {
  getPlans: () => apiRequest('/pricing'),
  getTiers: () => apiRequest('/tiers'),
};

// Chatbots API
export const chatbots = {
  getAll: () => apiRequest('/chatbots'),
  
  create: (data) => apiRequestWithBody('/chatbots', data),
  
  update: (id, data) => apiRequestWithBody(`/chatbots/${id}`, data),
  
  delete: (id) => apiRequest(`/chatbots/${id}`, { method: 'DELETE' }),
};

// Payments API
export const payments = {
  create: (data) => apiRequestWithBody('/payments', data),
  
  getAll: () => apiRequest('/payments'),
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

// Health check
export const health = () => apiRequest('/health');

// Admin API (for admin pages)
export const admin = {
  getPayments: () => apiRequest('/admin/payments'),
  approvePayment: (data) => apiRequestWithBody('/admin/payments/approve', data),
  rejectPayment: (data) => apiRequestWithBody('/admin/payments/reject', data),
  getUsers: () => apiRequest('/admin/users'),
  getSettings: () => apiRequest('/admin/settings'),
  saveSettings: (data) => apiRequestWithBody('/admin/settings', data),
  savePricingPlan: (data) => apiRequestWithBody('/admin/pricing', data),
};

export default apiRequest;