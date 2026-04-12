const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missing = required.filter(k => !import.meta.env[k]);

if (missing.length > 0 && import.meta.env.PROD) {
  console.error(`CRITICAL: Missing required env vars: ${missing.join(', ')}`);
}

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...' : '',
  apiUrl: import.meta.env.VITE_API_URL || '',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};