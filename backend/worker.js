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

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
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

      // Default: 404
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
  },
};

// Neon Database Helper
async function queryNeon(env, sql, params = []) {
  if (!env.NEON_DATABASE_URL) {
    throw new Error('NEON_DATABASE_URL not configured');
  }

  // Neon connection string format:
  // postgresql://user:pass@host/neondb?sslmode=require
  const connectionString = env.NEON_DATABASE_URL;
  
  // For Cloudflare Worker, we need to use a different approach
  // Using @neondatabase/serverless
  const { neon } = await import('@neondatabase/serverless');
  const sqlPool = neon(connectionString);
  
  try {
    const result = await sqlPool(sql, params);
    return result;
  } catch (err) {
    console.error('Neon query error:', err);
    throw err;
  }
}

// Auth: Login
async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Try to find user in database
    if (env.NEON_DATABASE_URL) {
      try {
        const users = await queryNeon(env, "SELECT id, email, display_name, role FROM profiles WHERE email = $1", [email]);
        
        if (users && users.length > 0) {
          // In production, verify password hash here
          const user = users[0];
          return new Response(JSON.stringify({
            user: {
              id: user.id,
              email: user.email,
              displayName: user.display_name,
              role: user.role || 'user',
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

    // Demo mode fallback
    return new Response(JSON.stringify({
      user: {
        id: `user_${Date.now()}`,
        email,
        displayName: displayName || email.split('@')[0],
        role: 'user',
        subscription: { tier: 'free', status: 'active' },
      },
      token: `demo_token_${Date.now()}`,
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