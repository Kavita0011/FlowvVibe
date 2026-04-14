// Export all CRUD operations
export * from './users';
export * from './chatbots';
export * from './conversations';
export * from './payments';
export * from './leads';

// Export query builder and advanced features
export * from './query-builder';
export * from './bot-features';
export * from './admin-queries';
export * from './pricing-features';

// Payment Methods CRUD - ensure these are exported for chatbotStore
import { supabase } from '../supabase-client';

export async function fetchPaymentMethods(activeOnly = false) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  let query = supabase.from('payment_methods').select('*').order('created_at', { ascending: false });
  if (activeOnly) query = query.eq('is_active', true);
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

// Re-export types for convenience
export type { User, UserInsert, UserUpdate } from './users';
export type { Chatbot, ChatbotInsert, ChatbotUpdate } from './chatbots';
export type { Conversation, ConversationInsert, ConversationUpdate, Message, MessageInsert } from './conversations';
export type { Payment, PaymentInsert, PaymentUpdate } from './payments';
export type { Lead, LeadInsert, LeadUpdate, Booking, BookingInsert, BookingUpdate } from './leads';
export type { QueryOptions, PaginatedResult } from './query-builder';
