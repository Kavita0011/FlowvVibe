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

// Chatbot operations
export async function fetchChatbots(userId?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  let query = supabase
    .from('chatbots')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  return await query;
}

export async function createChatbot(chatbot: Database['public']['Tables']['chatbots']['Insert']) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('chatbots')
    .insert(chatbot)
    .select()
    .single();
}

export async function updateChatbot(id: string, updates: Database['public']['Tables']['chatbots']['Update']) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('chatbots')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

export async function deleteChatbot(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('chatbots')
    .delete()
    .eq('id', id);
}

// User profile operations
export async function fetchProfile(userId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
}

export async function updateProfile(userId: string, profile: Database['public']['Tables']['profiles']['Update']) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('profiles')
    .update({ ...profile, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
}

// Conversation operations
export async function fetchConversations(chatbotId?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  let query = supabase
    .from('conversations')
    .select('*, messages(*)')
    .order('created_at', { ascending: false });
  
  if (chatbotId) {
    query = query.eq('chatbot_id', chatbotId);
  }
  
  return await query;
}

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

export { supabase };
export default supabase;
