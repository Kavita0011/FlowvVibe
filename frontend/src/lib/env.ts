const required = import.meta.env.PROD ? ['VITE_API_URL'] : [];
const missing = required.filter(k => !import.meta.env[k]);

if (missing.length > 0) {
  console.error(`CRITICAL: Missing required env vars: ${missing.join(', ')}`);
}

export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...' : '',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
