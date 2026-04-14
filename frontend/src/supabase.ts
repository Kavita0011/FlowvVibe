// Compatibility layer for frontend pages that previously used Supabase
// This wrapper now routes auth and pricing operations to the backend API.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const isProduction = import.meta.env.PROD;

if (isProduction && !API_URL) {
  console.error('Missing required VITE_API_URL in production environment');
}

const AUTH_TOKEN_KEY = 'flowvibe_token';

function buildUrl(path: string) {
  const base = API_URL.replace(/\/$/, '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

async function backendFetch(path: string, options: RequestInit = {}) {
  const url = buildUrl(path);
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  } as Record<string, string>;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => null);
  return {
    ok: response.ok,
    status: response.status,
    body,
  };
}

function normalizeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName || user.display_name || user.email?.split('@')[0] || 'User',
    role: user.role || 'user',
    isActive: user.is_active ?? true,
    createdAt: new Date(user.created_at || user.createdAt || Date.now()),
    subscription: {
      tier: user.subscriptionTier || user.subscription_tier || 'free',
      status: 'active',
      startDate: new Date(),
    },
  };
}

function createTableClient(table: string) {
  const endpoint =
    table === 'pricing_plans' ? '/api/psadmin/pricing' :
    table === 'custom_tiers' ? '/api/psadmin/tiers' :
    null;

  if (!endpoint) {
    throw new Error(`Unsupported table: ${table}`);
  }

  return {
    select: (_columns = '*') => ({
      order: async (_column: string, _options: { ascending?: boolean } = { ascending: true }) => {
        const result = await backendFetch(endpoint, { method: 'GET' });
        if (!result.ok) {
          return { data: null, error: { message: result.body?.error || 'Failed to fetch data' } };
        }
        return { data: result.body, error: null };
      },
    }),
    upsert: async (payload: any, _opts?: any) => {
      const rows = Array.isArray(payload) ? payload : [payload];
      const result = await backendFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(rows),
      });
      if (!result.ok) {
        return { data: null, error: { message: result.body?.error || 'Failed to save data' } };
      }
      return { data: result.body, error: null };
    },
  };
}

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const result = await backendFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (!result.ok) {
        return { data: null, error: { message: result.body?.error || 'Login failed' } };
      }
      const token = result.body?.token;
      setAuthToken(token || null);
      return {
        data: {
          user: normalizeUser(result.body.user),
          session: { access_token: token },
        },
        error: null,
      };
    },
    signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: { display_name?: string } } }) => {
      const displayName = options?.data?.display_name;
      const result = await backendFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, displayName }),
      });
      if (!result.ok) {
        return { data: null, error: { message: result.body?.error || 'Registration failed' } };
      }
      const token = result.body?.token;
      setAuthToken(token || null);
      return {
        data: {
          user: normalizeUser(result.body.user),
          session: { access_token: token },
        },
        error: null,
      };
    },
  },
  chatbots: {
    create: async ({ name, industry, description, tone }: { name: string; industry: string; description?: string; tone?: string }) => {
      const result = await backendFetch('/api/chatbots', {
        method: 'POST',
        body: JSON.stringify({ name, industry, description, tone }),
      });
      if (!result.ok) {
        return { data: null, error: { message: result.body?.error || 'Failed to create chatbot' } };
      }
      return { data: result.body, error: null };
    },
    list: async () => {
      const result = await backendFetch('/api/chatbots', { method: 'GET' });
      if (!result.ok) {
        return { data: null, error: { message: result.body?.error || 'Failed to fetch chatbots' } };
      }
      return { data: result.body, error: null };
    },
  },
  from: (table: string) => createTableClient(table),
};

export const config = {
  apiUrl: API_URL,
  isProduction,
};

export { API_URL };

// Payment Methods CRUD (exported for chatbotStore compatibility)
export async function fetchPaymentMethods(activeOnly = false) {
  return { data: [], error: null };
}

export async function createPaymentMethod(method: any) {
  return { data: null, error: new Error('Not implemented in demo mode') };
}

export async function updatePaymentMethod(id: string, updates: any) {
  return { data: null, error: new Error('Not implemented in demo mode') };
}

export async function deletePaymentMethod(id: string) {
  return { data: null, error: new Error('Not implemented in demo mode') };
}

// Pricing Plans CRUD
export async function fetchPricingPlans(activeOnly = true) {
  return { data: [], error: null };
}

export async function createPricingPlan(plan: any) {
  return { data: null, error: new Error('Not implemented in demo mode') };
}

export async function updatePricingPlan(id: string, updates: any) {
  return { data: null, error: new Error('Not implemented in demo mode') };
}

export async function deletePricingPlan(id: string) {
  return { data: null, error: new Error('Not implemented in demo mode') };
}
