import { supabase } from '../supabase-client';
import type { Database } from '../../types/supabase';

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationInsert = Database['public']['Tables']['conversations']['Insert'];
export type ConversationUpdate = Database['public']['Tables']['conversations']['Update'];

export type Message = Database['public']['Tables']['messages']['Row'];
export type MessageInsert = Database['public']['Tables']['messages']['Insert'];

// Fetch conversations (optionally filtered by chatbot)
export async function fetchConversations(chatbotId?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  let query = supabase
    .from('conversations')
    .select('*')
    .order('started_at', { ascending: false });
  
  if (chatbotId) {
    query = query.eq('chatbot_id', chatbotId);
  }
  
  return await query;
}

// Fetch single conversation by ID
export async function fetchConversationById(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .single();
}

// Create new conversation
export async function createConversation(conversation: ConversationInsert) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('conversations')
    .insert(conversation)
    .select()
    .single();
}

// Update conversation
export async function updateConversation(id: string, updates: ConversationUpdate) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('conversations')
    .update({ 
      ...updates, 
      ended_at: updates.ended_at || new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();
}

// End conversation
export async function endConversation(
  id: string, 
  rating?: number, 
  feedback?: string
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  const endedAt = new Date().toISOString();
  
  // Get conversation to calculate duration
  const { data: conv } = await supabase
    .from('conversations')
    .select('started_at')
    .eq('id', id)
    .single();
  
  const startedAt = new Date(conv?.started_at || endedAt);
  const endedDate = new Date(endedAt);
  const durationSeconds = Math.floor((endedDate.getTime() - startedAt.getTime()) / 1000);
  
  return await supabase
    .from('conversations')
    .update({ 
      status: 'completed',
      ended_at: endedAt,
      duration_seconds: durationSeconds,
      rating,
      feedback
    })
    .eq('id', id)
    .select()
    .single();
}

// Fetch messages for a conversation
export async function fetchMessages(conversationId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true });
}

// Create new message
export async function createMessage(message: MessageInsert) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();
}

// Delete conversation (and all its messages via cascade)
export async function deleteConversation(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('conversations')
    .delete()
    .eq('id', id);
}
