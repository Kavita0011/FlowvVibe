/**
 * Flowvibe API Client
 * Connects frontend to Cloudflare Worker API (which uses Neon)
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
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
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

// Auth API
export const auth = {
  login: (email, password) => 
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  
  register: (email, password, displayName) => 
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
  
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
  getAll: (userId) => apiRequest(`/chatbots?user_id=${userId}`),
  
  create: (data) => apiRequest('/chatbots', { method: 'POST', body: JSON.stringify(data) }),
  
  update: (id, data) => apiRequest(`/chatbots/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  
  delete: (id) => apiRequest(`/chatbots/${id}`, { method: 'DELETE' }),
};

// Payments API
export const payments = {
  create: (data) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
  
  getAll: (userId) => apiRequest(`/payments?user_id=${userId}`),
};

// User API
export const user = {
  get: () => apiRequest('/user'),
  update: (data) => apiRequest('/user', { method: 'PUT', body: JSON.stringify(data) }),
};

// Subscriptions API
export const subscriptions = {
  get: (userId) => apiRequest(`/subscriptions?user_id=${userId}`),
  create: (data) => apiRequest('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
};

// Health check
export const health = () => apiRequest('/health');

export default apiRequest;