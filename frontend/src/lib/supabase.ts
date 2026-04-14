import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase credentials not configured. Using demo mode.');
}

// Create Supabase client
export const supabase = supabaseUrl && supabaseKey 
  ? createClient<Database>(supabaseUrl, supabaseKey)
  : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;

// Re-export all CRUD operations from organized files
export * from './crud';

// Auth helpers
export async function signInWithPassword(email: string, password: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, userData?: { display_name?: string }) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: userData
    }
  });
}

export async function signOut() {
  if (!supabase) return { error: new Error('Supabase not configured') };
  return await supabase.auth.signOut();
}

export async function getCurrentUser() {
  if (!supabase) return { data: { user: null }, error: new Error('Supabase not configured') };
  return await supabase.auth.getUser();
}

export async function getSession() {
  if (!supabase) return { data: { session: null }, error: new Error('Supabase not configured') };
  return await supabase.auth.getSession();
}

// Realtime subscriptions
export function subscribeToChatbots(userId: string, callback: (payload: any) => void) {
  if (!supabase) return null;
  
  return supabase
    .channel('chatbots_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'chatbots',
      filter: `user_id=eq.${userId}`
    }, callback)
    .subscribe();
}

export function subscribeToConversations(chatbotId: string, callback: (payload: any) => void) {
  if (!supabase) return null;
  
  return supabase
    .channel('conversations_changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'conversations',
      filter: `chatbot_id=eq.${chatbotId}`
    }, callback)
    .subscribe();
}

export default supabase;
