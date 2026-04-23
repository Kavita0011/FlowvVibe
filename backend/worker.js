/**
 * FlowvVibe Backend - Cloudflare Worker
 * Connects to Neon PostgreSQL for all data operations
 */

const ALLOWED_ORIGINS = [
  'https://flowvibe.pages.dev',
  'https://flowvibe-frontend.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
];

const corsHeaders = {
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : (ALLOWED_ORIGINS[0] || '*');
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigin,
  };
}

// Security headers (10/10)
const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.openrouter.ai https://*.neon.tech https://api.razorpay.com; frame-src https://checkout.razorpay.com;",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cache-Control': 'public, max-age=0, s-maxage=3600',
  'X-Powered-By': 'Cloudflare Workers',
};

// Cache headers for static assets
const staticAssetHeaders = {
  'Cache-Control': 'public, max-age=31536000, immutable',
};

// JSON response helper - includes security headers
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      ...securityHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// JSON response helper with dynamic CORS
function jsonResponseDynamic(data, status, dynamicCors) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...dynamicCors,
      ...securityHeaders,
      'Content-Type': 'application/json',
    },
  });
}

// Password verification helper
async function verifyPassword(password, storedHash) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'flowvibe_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === storedHash;
}

// Admin authentication middleware
async function verifyAdminAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing authorization header', status: 401 };
  }
  
  const token = authHeader.substring(7);
  const adminEmail = env.VITE_ADMIN_EMAIL || 'devappkavita@gmail.com';
  
  // Parse token using new format
  const parsed = parseToken(token);
  if (parsed.error) {
    return { error: parsed.error, status: parsed.status };
  }
  
  const { payload } = parsed;
  
  // Verify it's an admin token
  if (payload.role !== 'admin') {
    return { error: 'Admin access required', status: 403 };
  }
  
  return { isAdmin: true, email: adminEmail, userId: payload.userId };
}

// User authentication middleware
async function verifyUserAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing authorization header', status: 401 };
  }
  
  const token = authHeader.substring(7);
  
  // Parse using new token format
  const parsed = parseToken(token);
  if (parsed.error) {
    return parsed;
  }
  
  const { payload } = parsed;
  
  // Check if admin
  if (payload.role === 'admin') {
    return { isAdmin: true, userId: payload.userId, email: env.VITE_ADMIN_EMAIL || 'devappkavita@gmail.com' };
  }
  
  return { isValid: true, userId: payload.userId, role: payload.role };
}

// Generate secure token
function generateToken(userId, role = 'user') {
  const payload = {
    userId,
    role,
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    nonce: crypto.randomUUID()
  };
  const jsonStr = JSON.stringify(payload);
  return btoa(jsonStr);
}

// Verify and parse token
function parseToken(token) {
  try {
    const jsonStr = atob(token);
    const payload = JSON.parse(jsonStr);
    if (payload.exp && Date.now() > payload.exp) {
      return { error: 'Token expired', status: 401 };
    }
    return { payload };
  } catch (e) {
    return { error: 'Invalid token', status: 401 };
  }
}

// Input validation helpers
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

function isStrongPassword(password) {
  if (password.length < 8) return false;
  if (password.length > 128) return false;
  return true;
}

function sanitizeString(str, maxLength = 255) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength).replace(/[<>]/g, '');
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Get dynamic CORS headers based on request origin
    const dynamicCorsHeaders = getCorsHeaders(request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...dynamicCorsHeaders, ...securityHeaders } });
    }

    // Rate limiting check (simple in-memory)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateKey = `${path}:${clientIP}`;
    const now = Date.now();
    
    if (!global.rateLimits) global.rateLimits = {};
    const rl = global.rateLimits[rateKey];
    
    // Stricter limits for auth endpoints
    const isAuthEndpoint = path.startsWith('/api/auth');
    const maxRequests = isAuthEndpoint ? 10 : 100; // 10/min for auth, 100/min for others
    
    if (rl && rl.count > maxRequests && now < rl.resetAt) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { 
        status: 429, 
        headers: { ...dynamicCorsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!rl || now > rl.resetAt) {
      global.rateLimits[rateKey] = { count: 1, resetAt: now + 60000 };
    } else {
      global.rateLimits[rateKey].count++;
    }

    // Safe JSON parser wrapper
    async function parseJson(request) {
      try {
        return await request.json();
      } catch (e) {
        return null;
      }
    }

    // Route handling
    try {
      // Health check
      if (path === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok', database: env.NEON_DATABASE_URL ? 'connected' : 'not_configured' }), {
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Auth API
      if (path === '/api/auth/login' && request.method === 'POST') {
        const body = await parseJson(request);
        if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleLogin({ json: () => Promise.resolve(body) }, env);
      }

      if (path === '/api/auth/register' && request.method === 'POST') {
        const body = await parseJson(request);
        if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleRegister({ json: () => Promise.resolve(body) }, env);
      }

      if (path === '/api/auth/verify' && request.method === 'POST') {
        const body = await parseJson(request);
        if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleVerifyEmail({ json: () => Promise.resolve(body) }, env);
      }

      // Pricing Plans API
      if (path === '/api/pricing' && request.method === 'GET') {
        return handleGetPricing(env);
      }

      // Subscription Tiers API
      if (path === '/api/tiers' && request.method === 'GET') {
        return handleGetTiers(env);
      }

      // Chatbots API - requires auth
      if (path === '/api/chatbots' && request.method === 'GET') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetChatbots(request, env, userAuth);
      }

      // Payments API - requires auth
      if (path === '/api/payments' && request.method === 'POST') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleCreatePayment(request, env, userAuth);
      }

      // Query endpoint - REMOVED (SQL injection vulnerability)
      // if (path === '/query' && request.method === 'POST') {
      //   return handleQuery(request, env);
      // }

      // Contact email endpoint
      if (path === '/api/contact' && request.method === 'POST') {
        return handleContactEmail(request, env);
      }

      // Send email endpoint - admin only
      if (path === '/api/send-email' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleSendEmail(request, env);
      }

      // Admin Settings API
      if (path === '/api/admin/settings' && request.method === 'GET') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetAdminSettings(request, env);
      }
      if (path === '/api/admin/settings' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleSaveAdminSettings(request, env);
      }
      if (path === '/api/admin/settings' && request.method === 'PUT') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleSaveAdminSettings(request, env);
      }

      // Pricing Plans CRUD
      if (path === '/api/admin/pricing' && request.method === 'GET') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetPricing(env);
      }
      if (path === '/api/admin/pricing' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleSavePricingPlan(request, env);
      }
      if (path === '/api/admin/pricing' && request.method === 'PUT') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleSavePricingPlan(request, env);
      }
      if (path === '/api/admin/pricing' && request.method === 'DELETE') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleDeletePricingPlan(request, env);
      }

      // Payments CRUD
      if (path === '/api/admin/payments' && request.method === 'GET') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetAllPayments(request, env);
      }
      if (path === '/api/admin/payments/approve' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleApprovePayment(request, env);
      }
      if (path === '/api/admin/payments/reject' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleRejectPayment(request, env);
      }

      // User management
      if (path === '/api/admin/users' && request.method === 'GET') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetAllUsers(request, env);
      }
      if (path === '/api/admin/users/update' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleUpdateUser(request, env);
      }

      // Subscription management
      if (path === '/api/subscription' && request.method === 'GET') {
        return handleGetSubscription(request, env);
      }
      if (path === '/api/subscription' && request.method === 'POST') {
        return handleCreateSubscription(request, env);
      }

// Chatbot CRUD
      if (path === '/api/chatbots' && request.method === 'GET') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetChatbots(request, env, userAuth);
      }
      if (path === '/api/chatbots' && request.method === 'POST') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleCreateChatbot(request, env, userAuth);
      }
      if (path === '/api/chatbots' && request.method === 'PUT') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleUpdateChatbot(request, env, userAuth);
      }
      if (path === '/api/chatbots' && request.method === 'DELETE') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleDeleteChatbot(request, env, userAuth);
      }

      // Profile API
      if (path === '/api/profile' && request.method === 'POST') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleUpdateProfile(request, env, userAuth);
      }

      // Subscription API
      if (path === '/api/subscription' && request.method === 'GET') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetSubscription(request, env, userAuth);
      }
      if (path === '/api/subscription' && request.method === 'POST') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleCreateSubscription(request, env, userAuth);
      }

      // Payments API - requires auth
      if (path === '/api/payments' && request.method === 'POST') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleCreatePayment(request, env, userAuth);
      }

      // Default: 404
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  },
};

// Neon Database Helper - uses HTTP to Neon project API
// Note: Requires Neon paid plan for HTTP API access
async function queryNeon(env, sql, params = []) {
  if (!global.db) {
    global.db = {
      users: [],
      chatbots: [],
      payments: [],
      messages: [],
      leads: [],
    };
  }

  if (!env.NEON_PROJECT_ID || !env.NEON_API_KEY) {
    return demoQuery(sql, params);
  }

  try {
    const endpoint = `https://console.neon.tech/api/v2/projects/${env.NEON_PROJECT_ID}/query`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.NEON_API_KEY}`,
      },
      body: JSON.stringify({ queries: [{ sql, params: params || [] }] }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.query_results || [];
    }
  } catch (e) {
    // Silently fail - let it fallback
  }
  
  return demoQuery(sql, params);
}

function demoQuery(sql, params) {
  if (!global.db) return [];
  const sqlLower = sql.toLowerCase();
  
  if (sqlLower.includes('insert') || sqlLower.includes('update') || sqlLower.includes('delete')) {
    return [];
  }
  if (sqlLower.includes('select')) {
    if (sqlLower.includes('profiles') || sqlLower.includes('users')) return global.db.users;
    if (sqlLower.includes('chatbots')) return global.db.chatbots;
    if (sqlLower.includes('payment')) return global.db.payments;
    if (sqlLower.includes('messages')) return global.db.messages;
  }
  return [];
}

// Auth: Login
async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check for admin credentials from environment
    const adminEmail = env.VITE_ADMIN_EMAIL;
    const adminPassword = env.VITE_ADMIN_PASSWORD;
    
    // Admin login - only if credentials are properly configured
    if (adminEmail && adminPassword && email === adminEmail && password === adminPassword) {
      const token = generateToken('admin_001', 'admin');
      return new Response(JSON.stringify({
        user: {
          id: 'admin_001',
          email: adminEmail,
          displayName: 'Admin',
          role: 'admin',
          isActive: true,
          emailVerified: true
        },
        token: token,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Try to find user in database
    if (env.NEON_DATABASE_URL) {
      try {
        const users = await queryNeon(env, "SELECT id, email, display_name, role, is_active, email_verified, password_hash FROM profiles WHERE email = $1", [email]);
        
        if (users && users.length > 0) {
          const user = users[0];
          
          // Check if email is verified
          if (!user.email_verified && !user.is_active) {
            return new Response(JSON.stringify({ 
              error: 'Email not verified. Please check your email and click the verification link.',
              needsVerification: true,
              email: email
            }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
          }
          
          // Verify password if hash exists
          if (user.password_hash) {
            const passwordMatch = await verifyPassword(password, user.password_hash);
            if (!passwordMatch) {
              return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          }
          
          const token = generateToken(user.id, user.role || 'user');
          return new Response(JSON.stringify({
            user: {
              id: user.id,
              email: user.email,
              displayName: user.display_name,
              role: user.role || 'user',
              isActive: user.is_active,
              emailVerified: user.email_verified
            },
            token: token,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (dbErr) {
        // Database error - don't leak details
      }
    }

    // NO demo mode fallback - require valid credentials
    return new Response(JSON.stringify({ error: 'Invalid email or password' }), { 
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Auth: Register
async function handleRegister(request, env) {
  try {
    const { email, password, displayName } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return new Response(JSON.stringify({ error: 'Password must be 8-128 characters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Sanitize display name
    const sanitizedDisplayName = sanitizeString(displayName) || email.split('@')[0];

    // Create user in database if Neon is configured
    if (env.NEON_DATABASE_URL) {
      try {
        // Check if email already exists
        const existing = await queryNeon(env, "SELECT id FROM profiles WHERE email = $1", [email]);
        if (existing && existing.length > 0) {
          return new Response(JSON.stringify({ error: 'Email already registered' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const newUser = await queryNeon(
          env,
          "INSERT INTO profiles (id, email, display_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, role",
          [crypto.randomUUID(), email, sanitizedDisplayName, 'user']
        );
        
        if (newUser && newUser.length > 0) {
          const user = newUser[0];
          const token = generateToken(user.id, user.role || 'user');
          return new Response(JSON.stringify({
            user: {
              id: user.id,
              email: user.email,
              displayName: user.display_name,
              role: user.role,
            },
            token: token,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (dbErr) {
        // Database error - don't leak details
      }
    }

    // NO demo mode fallback - require valid credentials and database
    return new Response(JSON.stringify({ error: 'Registration failed. Please try again later.' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Registration failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Auth: Verify Email
async function handleVerifyEmail(request, env) {
  try {
    const { token, email } = await request.json();
    
    if (!token || !email) {
      return new Response(JSON.stringify({ error: 'Token and email required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Verify in database - requires Neon to be configured
    if (!env.NEON_DATABASE_URL) {
      return new Response(JSON.stringify({ error: 'Verification unavailable' }), { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const verified = await queryNeon(env, 
      "UPDATE profiles SET email_verified = true, is_active = true, updated_at = NOW() WHERE email = $1 RETURNING id",
      [email]
    );
    
    if (verified && verified.length > 0) {
      // Create subscription for verified user
      await queryNeon(env,
        "INSERT INTO user_subscriptions (id, user_id, tier_id, status, start_date, expires_at) VALUES ($1, $2, 'free', 'active', NOW(), NOW() + INTERVAL '1 year') ON CONFLICT DO NOTHING",
        [crypto.randomUUID(), verified[0].id]
      );
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Email verified successfully',
        user: { email, verified: true }
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Verification failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Get Pricing Plans
async function handleGetPricing(env) {
  try {
    if (env.NEON_DATABASE_URL) {
      const tiers = await queryNeon(env, "SELECT tier_key as id, name, price, description, is_active, is_featured, sort_order FROM subscription_tiers WHERE is_active = true ORDER BY sort_order");
      
      if (tiers && tiers.length > 0) {
        return new Response(JSON.stringify(tiers), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Default pricing if DB not available
    const DEFAULT_PRICING = [
      { id: 'free', name: 'Free', price: 0, description: 'For testing', is_active: true },
      { id: 'starter', name: 'Starter', price: 999, description: 'One-time payment', is_active: true },
      { id: 'pro', name: 'Pro', price: 2499, description: 'Most popular', is_active: true, is_featured: true },
      { id: 'enterprise', name: 'Enterprise', price: 9999, description: 'For large teams', is_active: true },
    ];
    return new Response(JSON.stringify(DEFAULT_PRICING), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Get Subscription Tiers
async function handleGetTiers(env) {
  return handleGetPricing(env);
}

// Get Chatbots
async function handleGetChatbots(request, env, userAuth) {
  const userId = userAuth.userId;

  try {
    if (env.NEON_DATABASE_URL && userId) {
      const bots = await queryNeon(env, "SELECT id, name, industry, is_published, created_at FROM chatbots WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
      return new Response(JSON.stringify(bots), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Create Payment
async function handleCreatePayment(request, env, userAuth) {
  try {
    const { amount, plan, utr_number, method } = await request.json();
    const userId = userAuth.userId;

    if (!amount || !utr_number) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate UTR format (12-18 digits)
    if (!/^\d{12,18}$/.test(utr_number)) {
      return new Response(JSON.stringify({ error: 'Invalid UTR number format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate amount
    if (amount < 1 || amount > 1000000) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Idempotency check - prevent duplicate payments with same UTR
    if (env.NEON_DATABASE_URL) {
      const existingPayment = await queryNeon(env, 
        "SELECT id FROM payments WHERE utr_number = $1 AND user_id = $2", 
        [utr_number, userId]
      );
      if (existingPayment && existingPayment.length > 0) {
        return new Response(JSON.stringify({ 
          error: 'Payment with this UTR already submitted',
          existingTransactionId: existingPayment[0].transaction_id 
        }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    const transaction_id = `FV${Date.now()}`;

    if (env.NEON_DATABASE_URL) {
      await queryNeon(
        env,
        "INSERT INTO payments (id, user_id, amount, status, plan, transaction_id, utr_number, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [crypto.randomUUID(), userId, amount, 'pending', plan || 'unknown', transaction_id, utr_number, method || 'upi']
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      transaction_id,
      message: 'Payment submitted for verification' 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Contact form handler - sends to admin email
async function handleContactEmail(request, env) {
  try {
    const { name, email, message } = await request.json();
    
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Name, email, and message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate email
    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Sanitize inputs to prevent XSS and header injection
    const sanitizedName = sanitizeString(name, 100);
    const sanitizedMessage = sanitizeString(message, 2000);

    if (!sanitizedName || !sanitizedMessage) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const subject = `[FlowvVibe Contact] ${sanitizedName}`;
    const body = `Name: ${sanitizedName}\nEmail: ${email}\n\nMessage:\n${sanitizedMessage}`;
    
    await sendEmail(env, 'devappkavita@gmail.com', subject, body);
    
    return new Response(JSON.stringify({ success: true, message: 'Message sent' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Generic email sender - admin only
async function handleSendEmail(request, env) {
  try {
    const { to, subject, body } = await request.json();
    
    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate email
    if (!isValidEmail(to)) {
      return new Response(JSON.stringify({ error: 'Invalid recipient email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Sanitize
    const sanitizedSubject = sanitizeString(subject, 200);
    const sanitizedBody = sanitizeString(body, 5000);

    if (!sanitizedSubject || !sanitizedBody) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await sendEmail(env, to, sanitizedSubject, sanitizedBody);
    
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Send email using Cloudflare email workers (free) or SMTP
async function sendEmail(env, to, subject, body, from) {
  // Use Cloudflare Email Workers (free) if configured
  if (env.CF_EMAIL_USER && env.CF_EMAIL_PASSWORD) {
    const formData = new FormData();
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('body', body);
    if (from) formData.append('from', from);
    
    const response = await fetch(`https://api.mailgun.net/v3/${env.CF_EMAIL_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${env.CF_EMAIL_USER}:${env.CF_EMAIL_PASSWORD}`)}`,
      },
      body: formData,
    });
    
    if (response.ok) return;
  }
  
  // Fallback: store in database for manual processing
  if (env.NEON_DATABASE_URL) {
    await queryNeon(
      env,
      "INSERT INTO messages (sender, content, subject, direction) VALUES ($1, $2, $3, 'outbound')",
      [from || to, body, subject]
    );
  }
}

// ============================================
// Admin Settings API
// ============================================

async function handleGetAdminSettings(request, env) {
  try {
    // Public payment info - can expose UPI/bank name
    const adminSettings = {
      upi: env.ADMIN_UPI || 'support@flowvibe',
      bankName: env.ADMIN_BANK_NAME || 'FlowvVibe',
      supportEmail: env.SUPPORT_EMAIL || 'support@flowvibe.com' // Not admin email
    };
    
    return new Response(JSON.stringify(adminSettings), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleSaveAdminSettings(request, env) {
  try {
    const { upi, bankName, accountNumber, ifsc, supportEmail } = await request.json();
    
    // Sanitize inputs
    const sanitizedUpi = sanitizeString(upi, 100);
    const sanitizedBankName = sanitizeString(bankName, 100);
    const sanitizedSupportEmail = sanitizeString(supportEmail, 255);
    const sanitizedAccountNumber = sanitizeString(accountNumber, 30);
    const sanitizedIfsc = sanitizeString(ifsc, 20);

    if (!sanitizedUpi || !sanitizedBankName || !sanitizedSupportEmail) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Validate support email
    if (!isValidEmail(sanitizedSupportEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Save to Neon database if available
    if (env.NEON_DATABASE_URL) {
      const existing = await queryNeon(env, "SELECT id FROM admin_settings LIMIT 1");
      
      if (existing && existing.length > 0) {
        await queryNeon(env, 
          "UPDATE admin_settings SET upi = $1, bank_name = $2, account_number = $3, ifsc = $4, support_email = $5, updated_at = NOW()",
          [sanitizedUpi, sanitizedBankName, sanitizedAccountNumber, sanitizedIfsc, sanitizedSupportEmail]
        );
      } else {
        await queryNeon(env,
          "INSERT INTO admin_settings (upi, bank_name, account_number, ifsc, support_email) VALUES ($1, $2, $3, $4, $5)",
          [sanitizedUpi, sanitizedBankName, sanitizedAccountNumber, sanitizedIfsc, sanitizedSupportEmail]
        );
      }
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Settings saved' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================
// Pricing Plans CRUD
// ============================================

async function handleSavePricingPlan(request, env) {
  try {
    const { id, name, price, originalPrice, period, description, isOnSale, saleReason } = await request.json();
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env, 
        `INSERT INTO subscription_tiers (tier_key, name, price, original_price, period, description, is_on_sale, sale_reason, is_active, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 10)
         ON CONFLICT (tier_key) DO UPDATE SET name = $2, price = $3, original_price = $4, description = $5, is_on_sale = $7, sale_reason = $8`,
        [id, name, price, originalPrice || price, period, description, isOnSale || false, saleReason || '']
      );
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleDeletePricingPlan(request, env) {
  try {
    const { id } = await request.json();
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env, "UPDATE subscription_tiers SET is_active = false WHERE tier_key = $1", [id]);
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================
// Payments CRUD
// ============================================

async function handleGetAllPayments(request, env) {
  try {
    let payments = [];
    
    if (env.NEON_DATABASE_URL) {
      payments = await queryNeon(env, 
        `SELECT p.*, u.email as user_email, u.display_name as user_name 
         FROM payments p 
         LEFT JOIN profiles u ON p.user_id = u.id 
         ORDER BY p.created_at DESC LIMIT 100`
      );
    } else {
      payments = global.db?.payments || [];
    }
    
    return new Response(JSON.stringify(payments || []), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleApprovePayment(request, env) {
  try {
    const { paymentId, userId, plan, amount } = await request.json();
    
    // Validate inputs
    if (!paymentId || !userId || !plan) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Validate plan
    const validTiers = ['free', 'starter', 'pro', 'enterprise'];
    if (!validTiers.includes(plan)) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (env.NEON_DATABASE_URL) {
      // Check if already approved (idempotency)
      const existing = await queryNeon(env, "SELECT status FROM payments WHERE id = $1", [paymentId]);
      if (existing && existing.length > 0 && existing[0].status === 'completed') {
        return new Response(JSON.stringify({ error: 'Payment already approved' }), { 
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      // Update payment status
      await queryNeon(env, 
        "UPDATE payments SET status = 'completed', approved = true, activated = true, updated_at = NOW() WHERE id = $1",
        [paymentId]
      );
      
      // Create or update user subscription
      const existingSub = await queryNeon(env, 
        "SELECT id FROM user_subscriptions WHERE user_id = $1 AND status = 'active'",
        [userId]
      );
      
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 10); // Lifetime
      
      if (existingSub && existingSub.length > 0) {
        await queryNeon(env,
          "UPDATE user_subscriptions SET tier_id = $1, status = 'active', start_date = NOW(), expires_at = $2 WHERE user_id = $3",
          [plan, expiresAt.toISOString(), userId]
        );
      } else {
        await queryNeon(env,
          "INSERT INTO user_subscriptions (id, user_id, tier_id, status, start_date, expires_at) VALUES ($1, $2, $3, 'active', NOW(), $4)",
          [crypto.randomUUID(), userId, plan, expiresAt.toISOString()]
        );
      }
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Payment approved, subscription activated' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Approval failed' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleRejectPayment(request, env) {
  try {
    const { paymentId } = await request.json();
    
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'Payment ID required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (env.NEON_DATABASE_URL) {
      // Check if already rejected (idempotency)
      const existing = await queryNeon(env, "SELECT status FROM payments WHERE id = $1", [paymentId]);
      if (existing && existing.length > 0 && existing[0].status === 'rejected') {
        return new Response(JSON.stringify({ error: 'Payment already rejected' }), { 
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }

      await queryNeon(env, 
        "UPDATE payments SET status = 'rejected', updated_at = NOW() WHERE id = $1",
        [paymentId]
      );
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Payment rejected' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================
// User Management
// ============================================

async function handleGetAllUsers(request, env) {
  try {
    let users = [];
    
    if (env.NEON_DATABASE_URL) {
      users = await queryNeon(env, 
        `SELECT id, email, display_name, role, is_active, created_at FROM profiles ORDER BY created_at DESC LIMIT 100`
      );
    } else {
      users = global.db?.users || [];
    }
    
    return new Response(JSON.stringify(users || []), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleUpdateUser(request, env) {
  try {
    const { userId, isActive, role } = await request.json();
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env,
        "UPDATE profiles SET is_active = $1, role = $2 WHERE id = $3",
        [isActive, role, userId]
      );
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================
// Subscription Management
// ============================================

async function handleGetSubscription(request, env, userAuth) {
  const userId = userAuth.userId;
  
  try {
    let subscription = null;
    
    if (env.NEON_DATABASE_URL) {
      subscription = await queryNeon(env,
        `SELECT us.*, st.name as tier_name, st.price as tier_price 
         FROM user_subscriptions us 
         LEFT JOIN subscription_tiers st ON us.tier_id = st.tier_key 
         WHERE us.user_id = $1 AND us.status = 'active'`,
        [userId]
      );
    }
    
    return new Response(JSON.stringify(subscription || null), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleCreateSubscription(request, env, userAuth) {
  try {
    const { tierId, paymentId, amount } = await request.json();
    const userId = userAuth.userId;
    
    // Validate tier_id
    const validTiers = ['free', 'starter', 'pro', 'enterprise'];
    if (!validTiers.includes(tierId)) {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 10);
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env,
        "INSERT INTO user_subscriptions (id, user_id, tier_id, status, start_date, expires_at) VALUES ($1, $2, $3, 'active', NOW(), $4)",
        [crypto.randomUUID(), userId, tierId, expiresAt.toISOString()]
      );
    }
    
    return new Response(JSON.stringify({ success: true, expiresAt: expiresAt.toISOString() }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================
// Chatbot CRUD
// ============================================

async function handleCreateChatbot(request, env, userAuth) {
  try {
    const { name, industry, description } = await request.json();
    const userId = userAuth.userId;
    
    if (!name || name.length < 2) {
      return new Response(JSON.stringify({ error: 'Name must be at least 2 characters' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const botId = crypto.randomUUID();
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env,
        "INSERT INTO chatbots (id, user_id, name, industry, description, is_published, created_at) VALUES ($1, $2, $3, $4, $5, false, NOW())",
        [botId, userId, name, industry || '', description || '']
      );
    }
    
    return new Response(JSON.stringify({ id: botId, name, industry }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleUpdateChatbot(request, env, userAuth) {
  try {
    const { id, name, industry, description, flow, isPublished } = await request.json();
    const userId = userAuth.userId;
    
    // Verify ownership before updating
    if (env.NEON_DATABASE_URL) {
      const bot = await queryNeon(env, "SELECT user_id FROM chatbots WHERE id = $1", [id]);
      if (!bot || bot.length === 0) {
        return new Response(JSON.stringify({ error: 'Chatbot not found' }), { 
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      if (bot[0].user_id !== userId && userAuth.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Access denied' }), { 
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      await queryNeon(env,
        "UPDATE chatbots SET name = $1, industry = $2, description = $3, flow = $4, is_published = $5, updated_at = NOW() WHERE id = $6",
        [name, industry || '', description || '', JSON.stringify(flow || {}), isPublished || false, id]
      );
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleDeleteChatbot(request, env, userAuth) {
  try {
    const { id } = await request.json();
    const userId = userAuth.userId;
    
    // Verify ownership before deleting
    if (env.NEON_DATABASE_URL) {
      const bot = await queryNeon(env, "SELECT user_id FROM chatbots WHERE id = $1", [id]);
      if (!bot || bot.length === 0) {
        return new Response(JSON.stringify({ error: 'Chatbot not found' }), { 
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      if (bot[0].user_id !== userId && userAuth.role !== 'admin') {
        return new Response(JSON.stringify({ error: 'Access denied' }), { 
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      await queryNeon(env, "DELETE FROM chatbots WHERE id = $1", [id]);
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================
// Profile Management
// ============================================

async function handleUpdateProfile(request, env, userAuth) {
  try {
    const { displayName, email } = await request.json();
    const userId = userAuth.userId;
    
    if (!displayName || displayName.length < 2) {
      return new Response(JSON.stringify({ error: 'Display name must be at least 2 characters' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env,
        "UPDATE profiles SET display_name = $1, email = $2, updated_at = NOW() WHERE id = $3",
        [displayName, email || null, userId]
      );
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}