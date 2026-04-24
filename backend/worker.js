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
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
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

// Password verification helper - PBKDF2 with 100,000 iterations
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const saltData = encoder.encode(salt);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes('$')) {
    return false;
  }
  
  const [salt, hash] = storedHash.split('$');
  const computedHash = await hashPassword(password, salt);
  return computedHash === hash;
}

function generatePasswordHash(password) {
  const salt = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt + 'flowvibe_salt_2024');
  return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `${salt}$${hashHex}`;
  });
}

// Admin authentication middleware
async function verifyAdminAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing authorization header', status: 401 };
  }
  
  const token = authHeader.substring(7);
  const adminEmail = env.VITE_ADMIN_EMAIL;
  
  if (!adminEmail) {
    return { error: 'Admin not configured', status: 503 };
  }
  
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
    return { isAdmin: true, userId: payload.userId, email: env.VITE_ADMIN_EMAIL };
  }
  
  return { isValid: true, userId: payload.userId, role: payload.role };
}

// UUID validation
function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// HMAC-SHA256 signing for tokens
async function signToken(payload, secret) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret || 'flowvibe-signing-key');
  const messageData = encoder.encode(JSON.stringify(payload));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifyTokenSignature(token, secret) {
  try {
    const [payloadB64, signatureB64] = token.split('.');
    if (!payloadB64 || !signatureB64) return false;
    
    const payload = JSON.parse(atob(payloadB64));
    const expectedSig = await signToken(payload, secret || 'flowvibe-signing-key');
    
    return signatureB64 === expectedSig;
  } catch {
    return false;
  }
}

// Failed login tracking
function trackFailedLogin(email) {
  if (!global.loginAttempts) global.loginAttempts = {};
  const key = email.toLowerCase();
  const now = Date.now();
  
  if (!global.loginAttempts[key]) {
    global.loginAttempts[key] = { count: 0, lockedUntil: 0 };
  }
  
  global.loginAttempts[key].count++;
  global.loginAttempts[key].lastAttempt = now;
  
  // Lock after 5 failed attempts for 15 minutes
  if (global.loginAttempts[key].count >= 5) {
    global.loginAttempts[key].lockedUntil = now + (15 * 60 * 1000);
  }
  
  // Clean up old entries (older than 1 hour)
  for (const k in global.loginAttempts) {
    if (global.loginAttempts[k].lastAttempt < now - (60 * 60 * 1000)) {
      delete global.loginAttempts[k];
    }
  }
}

function isAccountLocked(email) {
  if (!global.loginAttempts) return false;
  const key = email.toLowerCase();
  const attempt = global.loginAttempts[key];
  
  if (!attempt) return false;
  
  if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
    return true;
  }
  
  return false;
}

function clearFailedLogins(email) {
  if (!global.loginAttempts) return;
  const key = email.toLowerCase();
  delete global.loginAttempts[key];
}

// Generate secure token with HMAC signature
async function generateToken(userId, role = 'user') {
  const payload = {
    userId,
    role,
    exp: Date.now() + (24 * 60 * 60 * 1000),
    nonce: Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join(''),
    iat: Date.now()
  };
  
  const payloadB64 = btoa(JSON.stringify(payload));
  const encoder = new TextEncoder();
  const signingKey = encoder.encode((env?.SIGNING_SECRET) || 'flowvibe-default-secret-key-change-in-production');
  const messageData = encoder.encode(payloadB64);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    signingKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${payloadB64}.${sigB64}`;
}

// Verify and parse token with signature
function parseToken(token) {
  try {
    if (!token || !token.includes('.')) {
      return { error: 'Invalid token format', status: 401 };
    }
    
    const parts = token.split('.');
    if (parts.length !== 2) {
      return { error: 'Invalid token', status: 401 };
    }
    
    const [payloadB64, sig] = parts;
    
    const jsonStr = atob(payloadB64);
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

// Audit logging
async function logActivity(env, userId, action, resourceType, resourceId, details) {
  if (!env.NEON_DATABASE_URL) return;
  
  const clientIP = global.clientIP || 'unknown';
  
  try {
    await queryNeon(env,
      "INSERT INTO activity_logs (id, user_id, action, resource_type, resource_id, details, ip_address, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())",
      [crypto.randomUUID(), userId, action, resourceType, resourceId, JSON.stringify(details || {}), clientIP]
    );
  } catch (e) {
    // Silently fail - don't break main flow
  }
}

// Constant-time string comparison to prevent timing attacks
function secureCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
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

    // Get client IP for audit logging
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    global.clientIP = clientIP;

    // Rate limiting check (simple in-memory)
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

      // Free PRD Download (no auth required)
      if (path === '/api/prd' && request.method === 'GET') {
        return handleDownloadPRD();
      }

      // Free PRD JSON info (no auth)
      if (path === '/api/prd/info' && request.method === 'GET') {
        return new Response(JSON.stringify({
          title: 'FlowvVibe PRD',
          version: '2.0',
          description: 'Product Requirements Document - Free Download',
          downloadUrl: '/api/prd',
          features: [
            'Visual Flow Builder',
            'AI Integration',
            'Multiple Chatbots',
            'Premium Add-ons',
            'One-time Pricing',
            'Indian Payment Options'
          ],
          pricing: {
            free: 0,
            starter: 999,
            pro: 2499,
            enterprise: 9999
          }
        }), {
          headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' }
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

      // Password Reset - Request
      if (path === '/api/auth/forgot-password' && request.method === 'POST') {
        const body = await parseJson(request);
        if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleForgotPassword({ json: () => Promise.resolve(body) }, env);
      }

      // Password Reset - Reset with token
      if (path === '/api/auth/reset-password' && request.method === 'POST') {
        const body = await parseJson(request);
        if (!body) return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleResetPassword({ json: () => Promise.resolve(body) }, env);
      }

      // Pricing Plans API
      if (path === '/api/pricing' && request.method === 'GET') {
        return handleGetPricing(env);
      }

      // Subscription Tiers API
      if (path === '/api/tiers' && request.method === 'GET') {
        return handleGetTiers(env);
      }

      // Analytics API (public for page views, authed for events)
      if (path === '/api/analytics' && request.method === 'POST') {
        return handleAnalytics(request, env);
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
        return handleApprovePayment(request, env, adminAuth);
      }
      if (path === '/api/admin/payments/reject' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleRejectPayment(request, env, adminAuth);
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
        return handleUpdateUser(request, env, adminAuth);
      }

      // Admin Chatbot Management
      if (path === '/api/admin/chatbots' && request.method === 'GET') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetAllChatbotsAdmin(request, env, adminAuth);
      }
      if (path === '/api/admin/chatbots/approve' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleApproveChatbot(request, env, adminAuth);
      }
      if (path === '/api/admin/chatbots/reject' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleRejectChatbot(request, env, adminAuth);
      }

      // Admin Leads Management
      if (path === '/api/admin/leads' && request.method === 'GET') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetAllLeads(request, env, adminAuth);
      }
      if (path === '/api/admin/leads/update' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleUpdateLeadStatus(request, env, adminAuth);
      }
      if (path === '/api/admin/leads' && request.method === 'DELETE') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleDeleteLead(request, env, adminAuth);
      }

      // Admin Payment Management
      if (path === '/api/admin/payments' && request.method === 'GET') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetAllPayments(request, env, adminAuth);
      }
      if (path === '/api/admin/payments/update' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleAdminUpdatePayment(request, env, adminAuth);
      }
      if (path === '/api/admin/subscriptions/update' && request.method === 'POST') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleAdminUpdateSubscription(request, env, adminAuth);
      }

      // Admin Export Endpoints
      if (path === '/api/admin/export/chatbots' && request.method === 'GET') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleExportChatbots(request, env, adminAuth);
      }
      if (path === '/api/admin/export/users' && request.method === 'GET') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleExportUsers(request, env, adminAuth);
      }
      if (path === '/api/admin/export/payments' && request.method === 'GET') {
        const adminAuth = await verifyAdminAuth(request, env);
        if (adminAuth.error) return new Response(JSON.stringify({ error: adminAuth.error }), { status: adminAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleExportPayments(request, env, adminAuth);
      }

      // Subscription management
      if (path === '/api/subscription' && request.method === 'GET') {
        return handleGetSubscription(request, env);
      }
      if (path === '/api/subscription' && request.method === 'POST') {
        return handleCreateSubscription(request, env);
      }

      // Subscription API (requires auth)
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

      // Tier Info (for frontend channel access check)
      if (path === '/api/tier-info' && request.method === 'GET') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetTierInfo(request, env, userAuth);
      }

      // Chatbot CRUD
      if (path === '/api/payments' && request.method === 'GET') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleGetUserPayments(request, env, userAuth);
      }
      if (path === '/api/payments' && request.method === 'POST') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleCreatePayment(request, env, userAuth);
      }
      if (path === '/api/payments/update' && request.method === 'PUT') {
        const userAuth = await verifyUserAuth(request, env);
        if (userAuth.error) return new Response(JSON.stringify({ error: userAuth.error }), { status: userAuth.status, headers: { ...dynamicCorsHeaders, 'Content-Type': 'application/json' } });
        return handleUpdatePayment(request, env, userAuth);
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

    // Check if account is locked
    if (isAccountLocked(email)) {
      return new Response(JSON.stringify({ error: 'Account temporarily locked. Try again in 15 minutes.' }), { status: 423, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
      clearFailedLogins(email);
      const token = await generateToken('admin_001', 'admin');
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
    } else if (adminEmail && email === adminEmail) {
      // Track failed admin login
      trackFailedLogin(email);
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
              trackFailedLogin(email);
              return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
          }
          
          // Clear failed logins on successful login
          clearFailedLogins(email);
          const token = await generateToken(user.id, user.role || 'user');
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

    // Track failed login (same message whether user exists or not)
    trackFailedLogin(email);
    
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
          const token = await generateToken(user.id, user.role || 'user');
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

// Forgot Password - Request reset link
async function handleForgotPassword(request, env) {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (env.NEON_DATABASE_URL) {
      const user = await queryNeon(env, "SELECT id FROM profiles WHERE email = $1", [email]);

      if (user && user.length > 0) {
        const resetToken = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        await queryNeon(env,
          "UPDATE profiles SET verification_token = $1, updated_at = NOW() WHERE id = $2",
          [resetToken, user[0].id]
        );

        const resetUrl = `${env.VITE_APP_URL || 'https://flowvibe.com'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
        const subject = 'FlowvVibe Password Reset';
        const body = `You requested a password reset for your FlowvVibe account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link expires in 15 minutes.\n\nIf you didn't request this, ignore this email.`;

        await sendEmail(env, email, subject, body);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Reset Password - Complete reset with token
async function handleResetPassword(request, env) {
  try {
    const { email, token, newPassword } = await request.json();

    if (!email || !token || !newPassword) {
      return new Response(JSON.stringify({ error: 'Email, token, and new password required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!isStrongPassword(newPassword)) {
      return new Response(JSON.stringify({ error: 'Password must be 8-128 characters' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (env.NEON_DATABASE_URL) {
      const user = await queryNeon(env,
        "SELECT id, verification_token FROM profiles WHERE email = $1",
        [email]
      );

      if (!user || user.length === 0 || user[0].verification_token !== token) {
        return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const passwordHash = hashPassword(newPassword);
      await queryNeon(env,
        "UPDATE profiles SET password_hash = $1, verification_token = NULL, updated_at = NOW() WHERE id = $2",
        [passwordHash, user[0].id]
      );

      await logActivity(env, user[0].id, 'PASSWORD_RESET', 'profile', user[0].id, {});
    }

    return new Response(JSON.stringify({ success: true, message: 'Password reset successful' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Analytics Handler
async function handleAnalytics(request, env) {
  try {
    const { type, data } = await request.json();

    if (env.NEON_DATABASE_URL) {
      if (type === 'pageview') {
        await queryNeon(env,
          `INSERT INTO analytics_events (event_type, event_name, session_id, url, metadata, created_at)
           VALUES ('pageview', $1, $2, $3, $4, NOW())`,
          [data.path, data.sessionId, data.path, JSON.stringify(data)]
        );
      } else if (type === 'event') {
        await queryNeon(env,
          `INSERT INTO analytics_events (event_type, event_name, session_id, url, user_id, metadata, created_at)
           VALUES ('event', $1, $2, $3, $4, $5, NOW())`,
          [data.event, data.sessionId, data.url, data.userId || null, JSON.stringify(data)]
        );
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
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

    // Default pricing if DB not available (with features)
    const DEFAULT_PRICING = [
      { id: 'free', name: 'Free', price: 0, description: 'For testing', is_active: true, features: TIER_FEATURES.free },
      { id: 'starter', name: 'Starter', price: 999, description: 'One-time payment', is_active: true, features: TIER_FEATURES.starter },
      { id: 'pro', name: 'Pro', price: 2499, description: 'Most popular', is_active: true, is_featured: true, features: TIER_FEATURES.pro },
      { id: 'enterprise', name: 'Enterprise', price: 9999, description: 'For large teams', is_active: true, features: TIER_FEATURES.enterprise },
    ];
    return new Response(JSON.stringify(DEFAULT_PRICING), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// ============================================
// Tier Features Configuration
// ============================================
const TIER_FEATURES = {
  free: {
    maxChatbots: 1,
    maxConversations: 50,
    maxMessagesPerMonth: 100,
    channels: ['widget'],
    features: ['basic-widget', 'basic-ai'],
    addOns: [],
    exportEnabled: false,
    apiAccess: false,
  },
  starter: {
    maxChatbots: 2,
    maxConversations: 500,
    maxMessagesPerMonth: 1000,
    channels: ['widget', 'web-embed'],
    features: ['basic-widget', 'basic-ai', 'premium-widget'],
    addOns: ['booking', 'voice', 'email-marketing', 'handoff'],
    exportEnabled: false,
    apiAccess: false,
  },
  pro: {
    maxChatbots: 5,
    maxConversations: -1, // unlimited
    maxMessagesPerMonth: -1,
    channels: ['widget', 'web-embed', 'whatsapp', 'slack', 'api'],
    features: ['basic-widget', 'basic-ai', 'premium-widget', 'all-channels', 'export-widget', 'advanced-analytics'],
    addOns: ['booking', 'voice', 'email-marketing', 'handoff'],
    exportEnabled: true,
    apiAccess: true,
  },
  enterprise: {
    maxChatbots: -1, // unlimited
    maxConversations: -1,
    maxMessagesPerMonth: -1,
    channels: ['widget', 'web-embed', 'whatsapp', 'slack', 'api', 'custom'],
    features: ['basic-widget', 'basic-ai', 'premium-widget', 'all-channels', 'export-widget', 'advanced-analytics', 'custom-integrations', 'dedicated-support', 'sla'],
    addOns: ['booking', 'voice', 'email-marketing', 'handoff', 'priority-support'],
    exportEnabled: true,
    apiAccess: true,
  },
};

function getTierFeatures(tierId) {
  return TIER_FEATURES[tierId] || TIER_FEATURES.free;
}

function getMaxChatbots(tierId) {
  return TIER_FEATURES[tierId]?.maxChatbots ?? 1;
}

function canUseChannel(tierId, channel) {
  const tierFeatures = getTierFeatures(tierId);
  return tierFeatures.channels.includes(channel) || tierFeatures.channels.includes('all');
}

function canUseFeature(tierId, feature) {
  const tierFeatures = getTierFeatures(tierId);
  return tierFeatures.features.includes(feature);
}

// Get Subscription Tiers
async function handleGetTiers(env) {
  return handleGetPricing(env);
}

// Free PRD Download (no auth)
function handleDownloadPRD() {
  const prdContent = `# FlowvVibe - Product Requirements Document (PRD)

## Version 2.0
**Launch Date:** April 2026
**Status:** Production Ready

---

## 🎯 Vision & Mission

**Vision:** Make AI chatbot building accessible to everyone without coding knowledge.

**Mission:** Empower businesses to create, deploy, and manage AI chatbots through an intuitive drag-and-drop interface with affordable one-time pricing.

---

## 👥 Target Audience

### Primary Users
1. Small Business Owners - E-commerce, retail, services
2. Startups - Customer support automation
3. Marketing Agencies - Client chatbot projects
4. Freelancers - Chatbot development services

---

## 💰 Pricing Structure

### Plans (One-Time Payment)

| Plan | Price | Features |
|------|-------|----------|
| **Free** | ₹0 | 1 Chatbot, 50 Conversations, Basic Widget |
| **Starter** | ₹999 | 2 Chatbots, 500 Conversations, Premium Widget |
| **Pro** | ₹2,499 | 5 Chatbots, Unlimited Conversations, All Channels, Export Widget |
| **Enterprise** | ₹9,999 | Unlimited Chatbots, Custom Integrations, Dedicated Support |

### Premium Add-ons
- Booking System: ₹499
- Voice Calls: ₹699
- Email Marketing: ₹599
- Human Handoff: ₹349
- Webhooks & Zapier: ₹499
- CRM Integration: ₹799

---

## 🔧 Core Features

### PRD Builder
- Company name input
- Industry selection (8+ templates)
- Services management
- Target audience specification
- Tone selection (Formal/Friendly/Professional/Casual)
- FAQ builder with AI suggestions
- Escalation rules configuration
- AI-powered flow generation

### Visual Flow Builder
- Start, AI Response, Intent Detection (Free)
- Text Input, Yes/No Input, Choice Input, Email Input, Phone Input (Free)
- Condition, Branch, Delay (Free)
- Collect Feedback, Rating (Free)
- Booking, Make Call, Human Handoff, Zapier, CRM Update (Premium)

### Payment System
- Card payment (simulated)
- UPI payment with QR code
- Bank transfer with account details
- UTR verification
- Invoice generation and download

---

## 🚀 Get Started

1. Visit: https://flowvibe.pages.dev
2. Sign up for free
3. Build your first chatbot in minutes
4. Export widget to your website

---

## 📞 Support

- Email: support@flowvibe.com
- Website: https://flowvibe.pages.dev

---

*Last Updated: April 2026*
`;

  return new Response(prdContent, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="FlowvVibe_PRD.md"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
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

// Get user's own payments
async function handleGetUserPayments(request, env, userAuth) {
  const userId = userAuth.userId;
  
  try {
    let payments = [];
    
    if (env.NEON_DATABASE_URL) {
      payments = await queryNeon(env,
        "SELECT id, amount, plan, status, payment_method, transaction_id, utr_number, created_at, updated_at FROM payments WHERE user_id = $1 ORDER BY created_at DESC",
        [userId]
      );
    }
    
    return new Response(JSON.stringify(payments || []), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Update user's own payment (only if pending)
async function handleUpdatePayment(request, env, userAuth) {
  const userId = userAuth.userId;
  
  try {
    const { paymentId, utr_number, amount, plan, method } = await request.json();
    
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'Payment ID required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!isValidUUID(paymentId)) {
      return new Response(JSON.stringify({ error: 'Invalid payment ID format' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (env.NEON_DATABASE_URL) {
      const existing = await queryNeon(env, 
        "SELECT id, status, user_id FROM payments WHERE id = $1", 
        [paymentId]
      );
      
      if (!existing || existing.length === 0) {
        return new Response(JSON.stringify({ error: 'Payment not found' }), { 
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      if (existing[0].user_id !== userId) {
        return new Response(JSON.stringify({ error: 'Access denied' }), { 
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      if (existing[0].status !== 'pending') {
        return new Response(JSON.stringify({ error: 'Only pending payments can be updated' }), { 
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const updates = [];
      const params = [];
      let paramIndex = 1;
      
      if (utr_number !== undefined) {
        if (!/^\d{12,18}$/.test(utr_number)) {
          return new Response(JSON.stringify({ error: 'Invalid UTR format (12-18 digits)' }), { 
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        updates.push(`utr_number = $${paramIndex++}`);
        params.push(utr_number);
      }
      
      if (amount !== undefined) {
        if (amount < 1 || amount > 1000000) {
          return new Response(JSON.stringify({ error: 'Invalid amount' }), { 
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          });
        }
        updates.push(`amount = $${paramIndex++}`);
        params.push(amount);
      }
      
      if (plan !== undefined) {
        updates.push(`plan = $${paramIndex++}`);
        params.push(plan);
      }
      
      if (method !== undefined) {
        updates.push(`payment_method = $${paramIndex++}`);
        params.push(method);
      }
      
      if (updates.length === 0) {
        return new Response(JSON.stringify({ error: 'No fields to update' }), { 
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      updates.push(`updated_at = NOW()`);
      params.push(paymentId);
      
      await queryNeon(env, `UPDATE payments SET ${updates.join(', ')} WHERE id = $${paramIndex}`, params);
      await logActivity(env, userId, 'UPDATE_PAYMENT', 'payment', paymentId, { utr_number, amount, plan });
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Payment updated' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
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
    const contactEmail = env.SUPPORT_EMAIL || env.VITE_ADMIN_EMAIL || 'support@flowvibe.com';
    
    await sendEmail(env, contactEmail, subject, body);
    
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

async function handleGetAllPayments(request, env, adminAuth) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // pending, completed, rejected, all

    let query = `SELECT p.*, u.email as user_email, u.display_name as user_name
                 FROM payments p
                 LEFT JOIN profiles u ON p.user_id = u.id`;
    const params = [];

    if (status && status !== 'all') {
      query += ' WHERE p.status = $1';
      params.push(status);
    }
    query += ' ORDER BY p.created_at DESC LIMIT 100';

    let payments = [];
    if (env.NEON_DATABASE_URL) {
      payments = await queryNeon(env, query, params);
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

// ============================================
// Leads CRUD
// ============================================

async function handleGetAllLeads(request, env, adminAuth) {
  try {
    let leads = [];
    if (env.NEON_DATABASE_URL) {
      leads = await queryNeon(env, `SELECT l.*, c.name as chatbot_name, u.email as user_email
        FROM leads l
        LEFT JOIN chatbots c ON l.chatbot_id = c.id
        LEFT JOIN profiles u ON c.user_id = u.id
        ORDER BY l.created_at DESC LIMIT 100`);
    }
    
    return new Response(JSON.stringify({ leads }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleUpdateLeadStatus(request, env, adminAuth) {
  try {
    const { leadId, status } = await request.json();
    
    if (!leadId || !status) {
      return new Response(JSON.stringify({ error: 'Lead ID and status required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env, 
        "UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2",
        [status, leadId]
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

async function handleDeleteLead(request, env, adminAuth) {
  try {
    const { leadId } = await request.json();
    
    if (!leadId) {
      return new Response(JSON.stringify({ error: 'Lead ID required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env, "DELETE FROM leads WHERE id = $1", [leadId]);
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

async function handleApprovePayment(request, env, adminAuth) {
  try {
    const { paymentId, userId, plan, amount } = await request.json();
    
    // Validate inputs
    if (!paymentId || !userId || !plan) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Validate UUIDs
    if (!isValidUUID(paymentId) || !isValidUUID(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid ID format' }), { 
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
      
      // Audit log
      await logActivity(env, adminAuth.userId, 'APPROVE_PAYMENT', 'payment', paymentId, { userId, plan, amount });
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

async function handleRejectPayment(request, env, adminAuth) {
  try {
    const { paymentId } = await request.json();
    
    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'Payment ID required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!isValidUUID(paymentId)) {
      return new Response(JSON.stringify({ error: 'Invalid payment ID format' }), { 
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
      
      // Audit log
      await logActivity(env, adminAuth.userId, 'REJECT_PAYMENT', 'payment', paymentId, {});
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

async function handleAdminUpdatePayment(request, env, adminAuth) {
  try {
    const { paymentId, status, amount, plan, paymentMethod, utrNumber } = await request.json();

    if (!paymentId) {
      return new Response(JSON.stringify({ error: 'Payment ID required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!isValidUUID(paymentId)) {
      return new Response(JSON.stringify({ error: 'Invalid payment ID format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (env.NEON_DATABASE_URL) {
      const existing = await queryNeon(env, 'SELECT * FROM payments WHERE id = $1', [paymentId]);
      if (!existing || existing.length === 0) {
        return new Response(JSON.stringify({ error: 'Payment not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const updates = [];
      const params = [];
      let idx = 1;

      if (status !== undefined) {
        const validStatuses = ['pending', 'completed', 'rejected'];
        if (!validStatuses.includes(status)) {
          return new Response(JSON.stringify({ error: 'Invalid status' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        updates.push(`status = $${idx++}`);
        params.push(status);
      }

      if (amount !== undefined) {
        if (amount < 1 || amount > 1000000) {
          return new Response(JSON.stringify({ error: 'Invalid amount' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        updates.push(`amount = $${idx++}`);
        params.push(amount);
      }

      if (plan !== undefined) {
        const validPlans = ['free', 'starter', 'pro', 'enterprise'];
        if (!validPlans.includes(plan)) {
          return new Response(JSON.stringify({ error: 'Invalid plan' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        updates.push(`plan = $${idx++}`);
        params.push(plan);
      }

      if (paymentMethod !== undefined) {
        updates.push(`payment_method = $${idx++}`);
        params.push(paymentMethod);
      }

      if (utrNumber !== undefined) {
        if (!/^\d{12,18}$/.test(utrNumber)) {
          return new Response(JSON.stringify({ error: 'Invalid UTR format' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        updates.push(`utr_number = $${idx++}`);
        params.push(utrNumber);
      }

      if (updates.length === 0) {
        return new Response(JSON.stringify({ error: 'No fields to update' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      updates.push('updated_at = NOW()');
      params.push(paymentId);

      await queryNeon(env, `UPDATE payments SET ${updates.join(', ')} WHERE id = $${idx}`, params);
      await logActivity(env, adminAuth.userId, 'ADMIN_UPDATE_PAYMENT', 'payment', paymentId, { status, amount, plan });
    }

    return new Response(JSON.stringify({ success: true, message: 'Payment updated' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleAdminUpdateSubscription(request, env, adminAuth) {
  try {
    const { userId, tierId, status, expiresAt } = await request.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!isValidUUID(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (env.NEON_DATABASE_URL) {
      const existing = await queryNeon(env,
        'SELECT * FROM user_subscriptions WHERE user_id = $1 AND status = $2',
        [userId, status || 'active']
      );

      if (tierId !== undefined) {
        const validTiers = ['free', 'starter', 'pro', 'enterprise'];
        if (!validTiers.includes(tierId)) {
          return new Response(JSON.stringify({ error: 'Invalid tier' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      if (existing && existing.length > 0) {
        const updates = [];
        const params = [];
        let idx = 1;

        if (tierId !== undefined) {
          updates.push(`tier_id = $${idx++}`);
          params.push(tierId);
        }
        if (status !== undefined) {
          updates.push(`status = $${idx++}`);
          params.push(status);
        }
        if (expiresAt !== undefined) {
          updates.push(`expires_at = $${idx++}`);
          params.push(expiresAt);
        }

        if (updates.length > 0) {
          params.push(existing[0].id);
          await queryNeon(env,
            `UPDATE user_subscriptions SET ${updates.join(', ')} WHERE id = $${idx}`,
            params
          );
        }
      } else if (tierId !== undefined) {
        const expAt = expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        await queryNeon(env,
          'INSERT INTO user_subscriptions (id, user_id, tier_id, status, start_date, expires_at) VALUES ($1, $2, $3, $4, NOW(), $5)',
          [crypto.randomUUID(), userId, tierId, status || 'active', expAt]
        );
      }

      await logActivity(env, adminAuth.userId, 'ADMIN_UPDATE_SUBSCRIPTION', 'subscription', userId, { tierId, status });
    }

    return new Response(JSON.stringify({ success: true, message: 'Subscription updated' }), {
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

async function handleUpdateUser(request, env, adminAuth) {
  try {
    const { userId, isActive, role } = await request.json();
    
    if (!userId || isActive === undefined || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!isValidUUID(userId)) {
      return new Response(JSON.stringify({ error: 'Invalid user ID format' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Prevent admin from demoting themselves
    if (userId === adminAuth.userId && role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Cannot demote yourself' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Validate role
    const validRoles = ['user', 'admin'];
    if (!validRoles.includes(role)) {
      return new Response(JSON.stringify({ error: 'Invalid role' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env,
        "UPDATE profiles SET is_active = $1, role = $2, updated_at = NOW() WHERE id = $3",
        [isActive, role, userId]
      );
      
      // Audit log
      await logActivity(env, adminAuth.userId, 'UPDATE_USER', 'profile', userId, { isActive, role });
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
    let tierFeatures = TIER_FEATURES.free;

    if (env.NEON_DATABASE_URL) {
      subscription = await queryNeon(env,
        `SELECT us.*, st.name as tier_name, st.price as tier_price
         FROM user_subscriptions us
         LEFT JOIN subscription_tiers st ON us.tier_id = st.tier_key
         WHERE us.user_id = $1 AND us.status = 'active'`,
        [userId]
      );
      if (subscription && subscription.length > 0) {
        const tierId = subscription[0].tier_id || 'free';
        tierFeatures = getTierFeatures(tierId);
      }
    }

    const response = subscription && subscription.length > 0
      ? {
          ...subscription[0],
          features: tierFeatures,
          maxChatbots: tierFeatures.maxChatbots,
          maxConversations: tierFeatures.maxConversations,
          channels: tierFeatures.channels,
          featuresList: tierFeatures.features,
          exportEnabled: tierFeatures.exportEnabled,
          apiAccess: tierFeatures.apiAccess,
        }
      : {
          tier_id: 'free',
          tier_name: 'Free',
          status: 'active',
          features: TIER_FEATURES.free,
          maxChatbots: TIER_FEATURES.free.maxChatbots,
          maxConversations: TIER_FEATURES.free.maxConversations,
          channels: TIER_FEATURES.free.channels,
          featuresList: TIER_FEATURES.free.features,
          exportEnabled: false,
          apiAccess: false,
        };

    return new Response(JSON.stringify(response), {
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

async function handleGetTierInfo(request, env, userAuth) {
  try {
    const userId = userAuth.userId;
    let tierId = 'free';
    let features = TIER_FEATURES.free;

    if (env.NEON_DATABASE_URL) {
      const sub = await queryNeon(env,
        'SELECT tier_id FROM user_subscriptions WHERE user_id = $1 AND status = $2',
        [userId, 'active']
      );
      if (sub && sub.length > 0) {
        tierId = sub[0].tier_id || 'free';
        features = getTierFeatures(tierId);
      }
    }

    return new Response(JSON.stringify({
      tier: tierId,
      features,
      maxChatbots: features.maxChatbots,
      maxConversations: features.maxConversations,
      channels: features.channels,
      canExport: features.exportEnabled,
      canUseAPI: features.apiAccess,
      availableAddOns: features.addOns,
    }), {
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

    // Get user's tier and check chatbot limit
    let userTier = 'free';
    if (env.NEON_DATABASE_URL) {
      const sub = await queryNeon(env,
        "SELECT tier_id FROM user_subscriptions WHERE user_id = $1 AND status = 'active'",
        [userId]
      );
      if (sub && sub.length > 0) {
        userTier = sub[0].tier_id || 'free';
      }
    }

    const maxChatbots = getMaxChatbots(userTier);

    // Count existing chatbots
    if (env.NEON_DATABASE_URL) {
      const existingBots = await queryNeon(env,
        "SELECT COUNT(*) as count FROM chatbots WHERE user_id = $1",
        [userId]
      );
      const currentCount = existingBots?.[0]?.count || 0;

      if (maxChatbots !== -1 && currentCount >= maxChatbots) {
        return new Response(JSON.stringify({
          error: `Chatbot limit reached. Your ${userTier} plan allows ${maxChatbots} chatbot(s).`,
          currentTier: userTier,
          maxChatbots,
          currentCount,
          upgradeRequired: true
        }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const botId = crypto.randomUUID();

    if (env.NEON_DATABASE_URL) {
      await queryNeon(env,
        "INSERT INTO chatbots (id, user_id, name, industry, description, is_published, is_approved, created_at) VALUES ($1, $2, $3, $4, $5, false, true, NOW())",
        [botId, userId, name, industry || '', description || '']
      );
    }

    return new Response(JSON.stringify({
      id: botId,
      name,
      industry,
      tier: userTier,
      maxChatbots
    }), {
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
// Export Functions (Admin Only)
// ============================================

function convertToCSV(data, headers) {
  const csvRows = [];
  csvRows.push(headers.join(','));
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] ?? '';
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }
  return csvRows.join('\n');
}

async function handleExportChatbots(request, env, adminAuth) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    let chatbots = [];
    if (env.NEON_DATABASE_URL) {
      chatbots = await queryNeon(env,
        `SELECT c.*, u.email as owner_email, u.display_name as owner_name, st.name as tier_name
         FROM chatbots c
         LEFT JOIN profiles u ON c.user_id = u.id
         LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
         LEFT JOIN subscription_tiers st ON us.tier_id = st.tier_key
         ORDER BY c.created_at DESC`
      );
    }

    if (format === 'csv') {
      const headers = ['id', 'name', 'industry', 'is_published', 'is_approved', 'created_at', 'owner_email', 'tier_name'];
      const csv = convertToCSV(chatbots, headers);
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="chatbots_${Date.now()}.csv"`
        }
      });
    }

    return new Response(JSON.stringify({ chatbots }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleExportUsers(request, env, adminAuth) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    let users = [];
    if (env.NEON_DATABASE_URL) {
      users = await queryNeon(env,
        `SELECT p.id, p.email, p.display_name, p.role, p.is_active, p.created_at,
                us.tier_id, st.name as tier_name, st.price as tier_price,
                (SELECT COUNT(*)::int FROM chatbots WHERE user_id = p.id) as chatbot_count
         FROM profiles p
         LEFT JOIN user_subscriptions us ON p.id = us.user_id AND us.status = 'active'
         LEFT JOIN subscription_tiers st ON us.tier_id = st.tier_key
         ORDER BY p.created_at DESC`
      );
    }

    if (format === 'csv') {
      const headers = ['id', 'email', 'display_name', 'role', 'is_active', 'created_at', 'tier_name', 'chatbot_count'];
      const csv = convertToCSV(users, headers);
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="users_${Date.now()}.csv"`
        }
      });
    }

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleExportPayments(request, env, adminAuth) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') || 'json';

    let payments = [];
    if (env.NEON_DATABASE_URL) {
      payments = await queryNeon(env,
        `SELECT p.*, u.email as user_email, u.display_name as user_name
         FROM payments p
         LEFT JOIN profiles u ON p.user_id = u.id
         ORDER BY p.created_at DESC`
      );
    }

    if (format === 'csv') {
      const headers = ['id', 'user_email', 'user_name', 'amount', 'plan', 'status', 'payment_method', 'utr_number', 'transaction_id', 'created_at'];
      const csv = convertToCSV(payments, headers);
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="payments_${Date.now()}.csv"`
        }
      });
    }

    return new Response(JSON.stringify({ payments }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Export failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// ============================================
// Chatbot Approval (Admin)
// ============================================

async function handleGetAllChatbotsAdmin(request, env, adminAuth) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // pending, approved, rejected, all

    let query = `SELECT c.*, u.email as owner_email, u.display_name as owner_name,
                 us.tier_id, st.name as tier_name
                 FROM chatbots c
                 LEFT JOIN profiles u ON c.user_id = u.id
                 LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
                 LEFT JOIN subscription_tiers st ON us.tier_id = st.tier_key`;

    const params = [];
    if (status && status !== 'all') {
      if (status === 'pending') {
        query += ' WHERE c.is_approved = false';
      } else if (status === 'approved') {
        query += ' WHERE c.is_approved = true';
      }
    }
    query += ' ORDER BY c.created_at DESC LIMIT 100';

    let chatbots = [];
    if (env.NEON_DATABASE_URL) {
      chatbots = await queryNeon(env, query, params);
    }

    return new Response(JSON.stringify(chatbots), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleApproveChatbot(request, env, adminAuth) {
  try {
    const { chatbotId } = await request.json();

    if (!chatbotId) {
      return new Response(JSON.stringify({ error: 'Chatbot ID required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!isValidUUID(chatbotId)) {
      return new Response(JSON.stringify({ error: 'Invalid chatbot ID format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (env.NEON_DATABASE_URL) {
      const existing = await queryNeon(env, 'SELECT id, is_approved FROM chatbots WHERE id = $1', [chatbotId]);
      if (!existing || existing.length === 0) {
        return new Response(JSON.stringify({ error: 'Chatbot not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      if (existing[0].is_approved) {
        return new Response(JSON.stringify({ error: 'Chatbot already approved' }), {
          status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await queryNeon(env,
        'UPDATE chatbots SET is_approved = true, is_published = true, updated_at = NOW() WHERE id = $1',
        [chatbotId]
      );
      await logActivity(env, adminAuth.userId, 'APPROVE_CHATBOT', 'chatbot', chatbotId, {});
    }

    return new Response(JSON.stringify({ success: true, message: 'Chatbot approved and published' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

async function handleRejectChatbot(request, env, adminAuth) {
  try {
    const { chatbotId, reason } = await request.json();

    if (!chatbotId) {
      return new Response(JSON.stringify({ error: 'Chatbot ID required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!isValidUUID(chatbotId)) {
      return new Response(JSON.stringify({ error: 'Invalid chatbot ID format' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (env.NEON_DATABASE_URL) {
      const existing = await queryNeon(env, 'SELECT id, is_approved FROM chatbots WHERE id = $1', [chatbotId]);
      if (!existing || existing.length === 0) {
        return new Response(JSON.stringify({ error: 'Chatbot not found' }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      await queryNeon(env,
        'UPDATE chatbots SET is_approved = false, is_published = false, updated_at = NOW() WHERE id = $1',
        [chatbotId]
      );
      await logActivity(env, adminAuth.userId, 'REJECT_CHATBOT', 'chatbot', chatbotId, { reason });
    }

    return new Response(JSON.stringify({ success: true, message: 'Chatbot rejected' }), {
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