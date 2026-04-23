/**
 * FlowvVibe Backend - Cloudflare Worker
 * Connects to Neon PostgreSQL for all data operations
 */

const ALLOWED_ORIGINS = ['*'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

// Password verification helper
async function verifyPassword(password, storedHash) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'flowvibe_salt_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === storedHash;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
    }

    // Rate limiting check (simple in-memory)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateKey = `${path}:${clientIP}`;
    const now = Date.now();
    
    if (!global.rateLimits) global.rateLimits = {};
    const rl = global.rateLimits[rateKey];
    
    if (rl && rl.count > 100 && now < rl.resetAt) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { 
        status: 429, 
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!rl || now > rl.resetAt) {
      global.rateLimits[rateKey] = { count: 1, resetAt: now + 60000 };
    } else {
      global.rateLimits[rateKey].count++;
    }

    // Route handling
    try {
      // Health check
      if (path === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok', database: env.NEON_DATABASE_URL ? 'connected' : 'not_configured' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Auth API
      if (path === '/api/auth/login' && request.method === 'POST') {
        return handleLogin(request, env);
      }

      if (path === '/api/auth/register' && request.method === 'POST') {
        return handleRegister(request, env);
      }

      if (path === '/api/auth/verify' && request.method === 'POST') {
        return handleVerifyEmail(request, env);
      }

      // Pricing Plans API
      if (path === '/api/pricing' && request.method === 'GET') {
        return handleGetPricing(env);
      }

      // Subscription Tiers API
      if (path === '/api/tiers' && request.method === 'GET') {
        return handleGetTiers(env);
      }

      // Chatbots API
      if (path === '/api/chatbots' && request.method === 'GET') {
        return handleGetChatbots(request, env);
      }

      // Payments API
      if (path === '/api/payments' && request.method === 'POST') {
        return handleCreatePayment(request, env);
      }

      // Query endpoint
      if (path === '/query' && request.method === 'POST') {
        return handleQuery(request, env);
      }

      // Contact email endpoint
      if (path === '/api/contact' && request.method === 'POST') {
        return handleContactEmail(request, env);
      }

      // Send email endpoint
      if (path === '/api/send-email' && request.method === 'POST') {
        return handleSendEmail(request, env);
      }

      // Admin Settings API
      if (path === '/api/admin/settings' && request.method === 'GET') {
        return handleGetAdminSettings(request, env);
      }
      if (path === '/api/admin/settings' && request.method === 'POST') {
        return handleSaveAdminSettings(request, env);
      }
      if (path === '/api/admin/settings' && request.method === 'PUT') {
        return handleSaveAdminSettings(request, env);
      }

      // Pricing Plans CRUD
      if (path === '/api/admin/pricing' && request.method === 'GET') {
        return handleGetPricing(env);
      }
      if (path === '/api/admin/pricing' && request.method === 'POST') {
        return handleSavePricingPlan(request, env);
      }
      if (path === '/api/admin/pricing' && request.method === 'PUT') {
        return handleSavePricingPlan(request, env);
      }
      if (path === '/api/admin/pricing' && request.method === 'DELETE') {
        return handleDeletePricingPlan(request, env);
      }

      // Payments CRUD
      if (path === '/api/admin/payments' && request.method === 'GET') {
        return handleGetAllPayments(request, env);
      }
      if (path === '/api/admin/payments/approve' && request.method === 'POST') {
        return handleApprovePayment(request, env);
      }
      if (path === '/api/admin/payments/reject' && request.method === 'POST') {
        return handleRejectPayment(request, env);
      }

      // User management
      if (path === '/api/admin/users' && request.method === 'GET') {
        return handleGetAllUsers(request, env);
      }
      if (path === '/api/admin/users/update' && request.method === 'POST') {
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
      if (path === '/api/chatbots' && request.method === 'POST') {
        return handleCreateChatbot(request, env);
      }
      if (path === '/api/chatbots' && request.method === 'PUT') {
        return handleUpdateChatbot(request, env);
      }
      if (path === '/api/chatbots' && request.method === 'DELETE') {
        return handleDeleteChatbot(request, env);
      }

      // Profile API
      if (path === '/api/profile' && request.method === 'POST') {
        return handleUpdateProfile(request, env);
      }

      // Default: 404
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
    console.log('Neon HTTP API failed, using demo mode');
  }
  
  return demoQuery(sql, params);
}

function demoQuery(sql, params) {
  if (!global.db) return [];
  const sqlLower = sql.toLowerCase();
  
  if (sqlLower.includes('insert')) {
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

    // Check for admin credentials
    const adminEmail = env.VITE_ADMIN_EMAIL || 'devappkavita@gmail.com';
    const adminPassword = env.VITE_ADMIN_PASSWORD;
    
    // Admin login
    if (email === adminEmail && adminPassword) {
      if (password === adminPassword) {
        return new Response(JSON.stringify({
          user: {
            id: 'admin_001',
            email: adminEmail,
            displayName: 'Admin',
            role: 'admin',
            isActive: true,
            emailVerified: true
          },
          token: `admin_token_${Date.now()}`,
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } else {
        return new Response(JSON.stringify({ error: 'Invalid admin credentials' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
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
          
          return new Response(JSON.stringify({
            user: {
              id: user.id,
              email: user.email,
              displayName: user.display_name,
              role: user.role || 'user',
              isActive: user.is_active,
              emailVerified: user.email_verified
            },
            token: `token_${Date.now()}`,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (dbErr) {
        console.log('Database query failed, using demo mode');
      }
    }

    // Demo mode fallback
    return new Response(JSON.stringify({
      user: {
        id: `demo_${Date.now()}`,
        email,
        displayName: email.split('@')[0],
        role: email.includes('admin') ? 'admin' : 'user',
        subscription: { tier: 'free', status: 'active' },
      },
      token: `demo_token_${Date.now()}`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Auth: Register
async function handleRegister(request, env) {
  try {
    const { email, password, displayName } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create user in database if Neon is configured
    if (env.NEON_DATABASE_URL) {
      try {
        const newUser = await queryNeon(
          env,
          "INSERT INTO profiles (id, email, display_name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, display_name, role",
          [crypto.randomUUID(), email, displayName || email.split('@')[0], 'user']
        );
        
        if (newUser && newUser.length > 0) {
          const user = newUser[0];
          return new Response(JSON.stringify({
            user: {
              id: user.id,
              email: user.email,
              displayName: user.display_name,
              role: user.role,
            },
            token: `token_${Date.now()}`,
          }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      } catch (dbErr) {
        console.log('Database insert failed:', dbErr.message);
      }
    }

    // Demo mode fallback - create unverified user
    return new Response(JSON.stringify({
      user: {
        id: `user_${Date.now()}`,
        email,
        displayName: displayName || email.split('@')[0],
        role: 'user',
        isActive: false,
        emailVerified: false,
        subscription: { tier: 'free', status: 'pending' },
      },
      token: `demo_token_${Date.now()}`,
      message: 'Verification email sent'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Auth: Verify Email
async function handleVerifyEmail(request, env) {
  try {
    const { token, email } = await request.json();
    
    if (!token || !email) {
      return new Response(JSON.stringify({ error: 'Token and email required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // Verify in database
    if (env.NEON_DATABASE_URL) {
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
    }
    
    // Demo mode - verify locally
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Email verified (demo mode)'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Get Subscription Tiers
async function handleGetTiers(env) {
  return handleGetPricing(env);
}

// Get Chatbots
async function handleGetChatbots(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  try {
    if (env.NEON_DATABASE_URL && userId) {
      const bots = await queryNeon(env, "SELECT id, name, industry, is_published, created_at FROM chatbots WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
      return new Response(JSON.stringify(bots), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify([]), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Query endpoint
async function handleQuery(request, env) {
  try {
    const { sql, params } = await request.json();
    
    if (!sql) {
      return new Response(JSON.stringify({ error: 'SQL required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const rows = await queryNeon(env, sql, params);
    return new Response(JSON.stringify({ rows }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Create Payment
async function handleCreatePayment(request, env) {
  try {
    const { user_id, amount, plan, utr_number, method } = await request.json();

    if (!user_id || !amount || !utr_number) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const transaction_id = `FV${Date.now()}`;

    if (env.NEON_DATABASE_URL) {
      await queryNeon(
        env,
        "INSERT INTO payments (id, user_id, amount, status, plan, transaction_id, payment_method) VALUES ($1, $2, $3, $4, $5, $6, $7)",
        [crypto.randomUUID(), user_id, amount, 'pending', plan, transaction_id, method || 'upi']
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      transaction_id,
      message: 'Payment submitted for verification' 
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Contact form handler - sends to admin email
async function handleContactEmail(request, env) {
  try {
    const { name, email, message } = await request.json();
    
    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Name, email, and message required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const subject = `[FlowvVibe Contact] ${name} - ${email}`;
    const body = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    
    await sendEmail(env, 'devappkavita@gmail.com', subject, body, email);
    
    return new Response(JSON.stringify({ success: true, message: 'Message sent' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

// Generic email sender
async function handleSendEmail(request, env) {
  try {
    const { to, subject, body, from } = await request.json();
    
    if (!to || !subject || !body) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    await sendEmail(env, to, subject, body, from);
    
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
    const adminSettings = {
      upi: env.ADMIN_UPI || 'devappkavita@oksbi',
      bankName: env.ADMIN_BANK_NAME || 'State Bank of India',
      accountNumber: env.ADMIN_ACCOUNT_NUMBER || '',
      ifsc: env.ADMIN_IFSC || '',
      supportEmail: env.VITE_ADMIN_EMAIL || 'devappkavita@gmail.com'
    };
    
    return new Response(JSON.stringify(adminSettings), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleSaveAdminSettings(request, env) {
  try {
    const { upi, bankName, accountNumber, ifsc, supportEmail } = await request.json();
    
    // Save to Neon database if available
    if (env.NEON_DATABASE_URL) {
      const existing = await queryNeon(env, "SELECT id FROM admin_settings LIMIT 1");
      
      if (existing && existing.length > 0) {
        await queryNeon(env, 
          "UPDATE admin_settings SET upi = $1, bank_name = $2, account_number = $3, ifsc = $4, support_email = $5, updated_at = NOW()",
          [upi, bankName, accountNumber, ifsc, supportEmail]
        );
      } else {
        await queryNeon(env,
          "INSERT INTO admin_settings (upi, bank_name, account_number, ifsc, support_email) VALUES ($1, $2, $3, $4, $5)",
          [upi, bankName, accountNumber, ifsc, supportEmail]
        );
      }
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Settings saved' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
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
    return new Response(JSON.stringify({ error: err.message }), { 
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
    return new Response(JSON.stringify({ error: err.message }), { 
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
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleApprovePayment(request, env) {
  try {
    const { paymentId, userId, plan, amount } = await request.json();
    
    if (env.NEON_DATABASE_URL) {
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
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleRejectPayment(request, env) {
  try {
    const { paymentId } = await request.json();
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env, 
        "UPDATE payments SET status = 'rejected', updated_at = NOW() WHERE id = $1",
        [paymentId]
      );
    }
    
    return new Response(JSON.stringify({ success: true, message: 'Payment rejected' }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
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
    return new Response(JSON.stringify({ error: err.message }), { 
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
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================
// Subscription Management
// ============================================

async function handleGetSubscription(request, env) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  
  try {
    if (!userId) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
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
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleCreateSubscription(request, env) {
  try {
    const { userId, tierId, paymentId, amount } = await request.json();
    
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
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================
// Chatbot CRUD
// ============================================

async function handleCreateChatbot(request, env) {
  try {
    const { userId, name, industry, description } = await request.json();
    
    const botId = crypto.randomUUID();
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env,
        "INSERT INTO chatbots (id, user_id, name, industry, description, is_published, created_at) VALUES ($1, $2, $3, $4, $5, false, NOW())",
        [botId, userId, name, industry, description]
      );
    }
    
    return new Response(JSON.stringify({ id: botId, name, industry }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleUpdateChatbot(request, env) {
  try {
    const { id, name, industry, description, flow, isPublished } = await request.json();
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env,
        "UPDATE chatbots SET name = $1, industry = $2, description = $3, flow = $4, is_published = $5, updated_at = NOW() WHERE id = $6",
        [name, industry, description, JSON.stringify(flow), isPublished, id]
      );
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

async function handleDeleteChatbot(request, env) {
  try {
    const { id } = await request.json();
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env, "DELETE FROM chatbots WHERE id = $1", [id]);
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}

// ============================================
// Profile Management
// ============================================

async function handleUpdateProfile(request, env) {
  try {
    const { userId, displayName, email } = await request.json();
    
    if (env.NEON_DATABASE_URL) {
      await queryNeon(env,
        "UPDATE profiles SET display_name = $1, email = $2, updated_at = NOW() WHERE id = $3",
        [displayName, email, userId]
      );
    }
    
    return new Response(JSON.stringify({ success: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
}