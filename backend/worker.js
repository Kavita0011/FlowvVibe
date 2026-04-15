/**
 * FlowvVibe Backend - Cloudflare Worker
 * Handles API requests for pricing, users, and payments
 */

const ALLOWED_ORIGINS = [
  '*', // Allow all origins for development
];

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
      // Pricing Plans API
      if (path === '/api/pricing' && request.method === 'GET') {
        return handleGetPricing(env);
      }

      // Custom Tiers API
      if (path === '/api/tiers' && request.method === 'GET') {
        return handleGetTiers(env);
      }

      // Auth API (Demo mode for now)
      if (path === '/api/auth/login' && request.method === 'POST') {
        return handleLogin(request, env);
      }

      if (path === '/api/auth/register' && request.method === 'POST') {
        return handleRegister(request, env);
      }

      // Health check
      if (path === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // For asset files (JS, CSS, SVG, etc.), let Cloudflare serve them
      if (path.startsWith('/assets/') || path.match(/\.(js|css|svg|png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot)$/)) {
        return new Response('Asset not found', { status: 404 });
      }
      
      // For all other non-API routes, return index.html (SPA routing)
      const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="FlowvVibe - Build AI chatbots with drag & drop. No coding required. Create, customize, and deploy conversational AI for your business." />
    <meta name="keywords" content="AI chatbot, chatbot builder, no-code, conversational AI, customer support bot, automation" />
    <meta name="author" content="FlowvVibe" />
    <meta property="og:title" content="FlowvVibe - AI Chatbot Builder" />
    <meta property="og:description" content="Build AI chatbots with drag & drop. No coding required." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
    <title>FlowvVibe - AI Chatbot Builder | No-Code Platform</title>
    <script type="module" crossorigin src="/assets/index-BWzpZPdi.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-Cd-vZvxr.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
      return new Response(indexHtml, {
        headers: { 'Content-Type': 'text/html' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};

// Default pricing plans
const DEFAULT_PRICING = [
  { id: 'free', name: 'Free', price: 0, original_price: 0, period: 'forever', description: 'For testing', is_on_sale: false },
  { id: 'starter', name: 'Starter', price: 999, original_price: 1999, period: 'one-time', description: 'One-time payment', is_on_sale: true, sale_reason: 'Limited Offer' },
  { id: 'pro', name: 'Pro', price: 2499, original_price: 4999, period: 'one-time', description: 'Most popular', is_on_sale: true, sale_reason: 'Limited Offer' },
  { id: 'enterprise', name: 'Enterprise', price: 9999, original_price: 19999, period: 'one-time', description: 'For large teams', is_on_sale: true, sale_reason: 'Limited Offer' },
];

// Default custom tiers
const DEFAULT_TIERS = [
  { id: 'starter', name: 'Starter', min_users: 1, max_users: 5, price_per_user: 399 },
  { id: 'team', name: 'Team', min_users: 6, max_users: 20, price_per_user: 349 },
  { id: 'business', name: 'Business', min_users: 21, max_users: 50, price_per_user: 299 },
  { id: 'enterprise', name: 'Enterprise', min_users: 51, max_users: 'unlimited', price_per_user: 249 },
];

/** Optional: bind JSON in Cloudflare as DEMO_USERS_KV or use Workers secrets — never commit real credentials. */
const DEMO_USERS = {};

// Handle GET pricing
async function handleGetPricing(env) {
  try {
    // Try to get from KV storage first
    if (env.PRICING) {
      const cached = await env.PRICING.get('pricing_plans');
      if (cached) {
        return new Response(cached, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Return default pricing
    return new Response(JSON.stringify(DEFAULT_PRICING), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify(DEFAULT_PRICING), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handle GET tiers
async function handleGetTiers(env) {
  try {
    if (env.TIERS) {
      const cached = await env.TIERS.get('custom_tiers');
      if (cached) {
        return new Response(cached, {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    return new Response(JSON.stringify(DEFAULT_TIERS), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify(DEFAULT_TIERS), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handle POST pricing (admin only)
async function handlePostPricing(request, env) {
  try {
    const body = await request.json();
    if (env.PRICING) {
      await env.PRICING.put('pricing_plans', JSON.stringify(body.pricing || body));
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handle login
async function handleLogin(request, env) {
  try {
    const { email, password } = await request.json();
    
    if (DEMO_USERS[email] && DEMO_USERS[email].password === password) {
      const user = DEMO_USERS[email];
      return new Response(JSON.stringify({
        user: {
          id: user.id,
          email,
          role: user.role,
          subscription: { tier: user.tier, status: 'active' },
        },
        token: `demo_token_${Date.now()}`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Demo mode: allow any login (disable in production Worker or use real auth)
    return new Response(JSON.stringify({
      user: {
        id: `user_${Date.now()}`,
        email,
        role: 'user',
        subscription: { tier: 'free', status: 'active' },
      },
      token: `demo_token_${Date.now()}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Login failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Handle register
async function handleRegister(request, env) {
  try {
    const { email, password, displayName } = await request.json();
    
    // Demo mode registration
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      displayName: displayName || email.split('@')[0],
      role: 'user',
      subscription: { tier: 'free', status: 'active' },
    };
    
    return new Response(JSON.stringify({
      user: newUser,
      token: `demo_token_${Date.now()}`,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Registration failed' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
