import { createClient } from '@supabase/supabase-js';

// Get environment variables - MUST be set in .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('CRITICAL: Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

// API URL for custom backend (Cloudflare Worker or other)
const API_URL = import.meta.env.VITE_API_URL;

// Create Supabase client
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Export configuration
export const config = {
  supabaseUrl: supabaseUrl || '',
  supabaseAnonKey: supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '',
  apiUrl: API_URL || '',
  isProduction: import.meta.env.PROD,
};

export { API_URL };
