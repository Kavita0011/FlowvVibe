import { query } from '../db-client';
import type { Database } from '../../types/supabase';

export type Chatbot = Database['public']['Tables']['chatbots']['Row'];
export type ChatbotInsert = Database['public']['Tables']['chatbots']['Insert'];
export type ChatbotUpdate = Database['public']['Tables']['chatbots']['Update'];

// Fetch all chatbots (admin) or filter by user
export async function fetchChatbots(userId?: string) {
  try {
    let queryText = 'SELECT * FROM public.chatbots ORDER BY created_at DESC';
    let params: any[] = [];

    if (userId) {
      queryText = 'SELECT * FROM public.chatbots WHERE user_id = $1 ORDER BY created_at DESC';
      params = [userId];
    }

    const data = await query<Chatbot>(queryText, params);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Fetch single chatbot by ID
export async function fetchChatbotById(id: string) {
  try {
    const data = await query<Chatbot>('SELECT * FROM public.chatbots WHERE id = $1', [id]);
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Create new chatbot
export async function createChatbot(chatbot: ChatbotInsert) {
  try {
    const {
      user_id,
      name,
      description,
      industry,
      tone = 'friendly',
      language = 'en',
      welcome_message,
      flow_data,
      is_published = false,
      views_count = 0,
      conversations_count = 0
    } = chatbot;

    const data = await query<Chatbot>(
      `INSERT INTO public.chatbots (user_id, name, description, industry, tone, language, welcome_message, flow_data, is_published, views_count, conversations_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [user_id, name, description, industry, tone, language, welcome_message, flow_data, is_published, views_count, conversations_count]
    );
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update chatbot
export async function updateChatbot(id: string, updates: ChatbotUpdate) {
  try {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date().toISOString());
    paramCount++;

    values.push(id);

    const queryText = `UPDATE public.chatbots SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const data = await query<Chatbot>(queryText, values);
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Delete chatbot
export async function deleteChatbot(id: string) {
  try {
    await query('DELETE FROM public.chatbots WHERE id = $1', [id]);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// Update chatbot status
export async function updateChatbotStatus(
  id: string,
  status: 'draft' | 'active' | 'inactive' | 'archived'
) {
  try {
    const data = await query<Chatbot>(
      `UPDATE public.chatbots
       SET is_published = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [status === 'active', new Date().toISOString(), id]
    );
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update chatbot flow data
export async function updateChatbotFlow(
  id: string,
  flowData: { nodes: any[], edges: any[] }
) {
  try {
    const data = await query<Chatbot>(
      `UPDATE public.chatbots
       SET flow_data = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [flowData, new Date().toISOString(), id]
    );
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update chatbot PRD (removed - field not in schema)
export async function updateChatbotPRD(id: string, prdData: any) {
  try {
    // PRD is not in the current schema, this function is kept for compatibility
    console.warn('PRD field not in current schema');
    return { data: null, error: new Error('PRD field not supported') };
  } catch (error) {
    return { data: null, error };
  }
}

// Increment view count
export async function incrementChatbotViews(id: string) {
  try {
    await query('UPDATE public.chatbots SET views_count = views_count + 1 WHERE id = $1', [id]);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// Increment conversation count
export async function incrementChatbotConversations(id: string) {
  try {
    await query('UPDATE public.chatbots SET conversations_count = conversations_count + 1 WHERE id = $1', [id]);
    return { error: null };
  } catch (error) {
    return { error };
  }
}
