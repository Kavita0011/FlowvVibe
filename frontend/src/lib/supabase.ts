// Import and re-export the Supabase client (separate file to avoid circular imports)
import { supabase } from './supabase-client';
export { supabase, isSupabaseConfigured } from './supabase-client';

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

// Payment Methods CRUD (Admin only) - exported for chatbotStore
export async function fetchPaymentMethods(activeOnly = false) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  let query = supabase.from('payment_methods').select('*').order('created_at', { ascending: false });
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  return await query;
}

export async function createPaymentMethod(method: any) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.from('payment_methods').insert(method).select().single();
}

export async function updatePaymentMethod(id: string, updates: any) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.from('payment_methods').update(updates).eq('id', id).select().single();
}

export async function deletePaymentMethod(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.from('payment_methods').delete().eq('id', id);
}

// Pricing Plans CRUD
export async function fetchPricingPlans(activeOnly = true) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  let query = supabase.from('pricing_plans').select('*').order('price', { ascending: true });
  if (activeOnly) {
    query = query.eq('is_active', true);
  }
  return await query;
}

export async function createPricingPlan(plan: any) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.from('pricing_plans').insert(plan).select().single();
}

export async function updatePricingPlan(id: string, updates: any) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.from('pricing_plans').update(updates).eq('id', id).select().single();
}

export async function deletePricingPlan(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  return await supabase.from('pricing_plans').delete().eq('id', id);
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

// export default supabase;
export const fetchPaymentMethods = async (activeOnly = false) => {
  // ... rest of your code
};
