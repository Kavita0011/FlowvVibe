import { supabase } from '../supabase-client';
import type { Database } from '../../types/supabase';

export type Chatbot = Database['public']['Tables']['chatbots']['Row'];
export type ChatbotInsert = Database['public']['Tables']['chatbots']['Insert'];
export type ChatbotUpdate = Database['public']['Tables']['chatbots']['Update'];

// Fetch all chatbots (admin) or filter by user
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

// Fetch single chatbot by ID
export async function fetchChatbotById(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('chatbots')
    .select('*')
    .eq('id', id)
    .single();
}

// Create new chatbot
export async function createChatbot(chatbot: ChatbotInsert) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('chatbots')
    .insert(chatbot)
    .select()
    .single();
}

// Update chatbot
export async function updateChatbot(id: string, updates: ChatbotUpdate) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('chatbots')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

// Delete chatbot
export async function deleteChatbot(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('chatbots')
    .delete()
    .eq('id', id);
}

// Update chatbot status
export async function updateChatbotStatus(
  id: string, 
  status: 'draft' | 'active' | 'inactive' | 'archived'
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('chatbots')
    .update({ 
      is_published: status === 'active',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
}

// Update chatbot flow data
export async function updateChatbotFlow(
  id: string, 
  flowData: { nodes: any[], edges: any[] }
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('chatbots')
    .update({ 
      flow_data: flowData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
}

// Update chatbot PRD
export async function updateChatbotPRD(id: string, prd: any) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('chatbots')
    .update({ 
      prd,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
}

// Increment view count
export async function incrementChatbotViews(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await (supabase as any).rpc('increment_views', { chatbot_id: id });
}

// Increment conversation count
export async function incrementChatbotConversations(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await (supabase as any).rpc('increment_conversations', { chatbot_id: id });
}
