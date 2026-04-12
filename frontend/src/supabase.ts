import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://amkstseqvrazqlxqahjx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcHN5eHFsaWhtZHNicndseWd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5NDY1OTAsImV4cCI6MjA5MTUyMjU5MH0.i397B6vTmMsuOZ0ZOr-DzoTuTqmuFJjenJn4txBEiTQ';

// API URL for custom backend (Cloudflare Worker or other)
const API_URL = import.meta.env.VITE_API_URL || 'https://flowvibe-api.pages.dev';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export configuration
export const config = {
  supabaseUrl,
  supabaseAnonKey,
  apiUrl: API_URL,
  isProduction: import.meta.env.PROD,
};

export { API_URL };
