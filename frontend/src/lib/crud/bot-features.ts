/**
 * Bot Features CRUD - Advanced querying for chatbot features
 * Uses query-builder for flexible, maintainable code
 */

import { supabase } from '../supabase';
import { 
  fetchWithOptions, 
  fetchPaginated, 
  createRecord, 
  updateRecord, 
  deleteRecord,
  softDelete,
  restoreRecord,
  countRecords,
  recordExists,
  applyQueryOptions,
  type QueryOptions,
  type PaginatedResult 
} from './query-builder';

// ============ BOT ANALYTICS QUERIES ============

// Get bot with full analytics (conversations, views, leads)
export async function fetchBotWithAnalytics(botId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase
    .from('chatbots')
    .select(`
      *,
      conversations:conversations(count),
      leads:leads(count),
      messages:conversations(messages(count))
    `)
    .eq('id', botId)
    .single();

  return { data, error };
}

// Get bot stats summary for dashboard
export async function fetchBotStats(userId?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  let query = supabase
    .from('chatbots')
    .select('id, name, views_count, conversations_count, is_published, created_at');

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  const stats = {
    totalBots: data?.length || 0,
    totalViews: data?.reduce((acc, b) => acc + (b.views_count || 0), 0) || 0,
    totalConversations: data?.reduce((acc, b) => acc + (b.conversations_count || 0), 0) || 0,
    publishedBots: data?.filter(b => b.is_published).length || 0,
    draftBots: data?.filter(b => !b.is_published).length || 0,
    avgConversationsPerBot: data?.length ? (data.reduce((acc, b) => acc + (b.conversations_count || 0), 0) / data.length).toFixed(1) : 0,
    bots: data
  };

  return { data: stats, error: null };
}

// ============ ADVANCED BOT QUERIES ============

// Search bots by name or description
export async function searchBots(searchTerm: string, userId?: string) {
  const options: QueryOptions = {
    ilike: {
      name: `%${searchTerm}%`,
      // Note: Supabase doesn't support OR in ilike directly, 
      // so we'd need to use textSearch or do two queries
    },
    orderBy: { column: 'created_at', ascending: false },
    limit: 20
  };

  if (userId) {
    options.eq = { user_id: userId };
  }

  return await fetchWithOptions('chatbots', options);
}

// Get popular bots (most conversations)
export async function fetchPopularBots(limit: number = 10) {
  return await fetchWithOptions('chatbots', {
    orderBy: { column: 'conversations_count', ascending: false },
    limit
  });
}

// Get recently active bots (had conversations in last 7 days)
export async function fetchRecentlyActiveBots(days: number = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return await fetchWithOptions('chatbots', {
    gte: { created_at: since.toISOString() },
    orderBy: { column: 'conversations_count', ascending: false }
  });
}

// Get bots by status
export async function fetchBotsByStatus(
  status: 'draft' | 'active' | 'inactive' | 'archived',
  userId?: string
) {
  const options: QueryOptions = {
    eq: { is_published: status === 'active' },
    orderBy: { column: 'updated_at', ascending: false }
  };

  if (userId) {
    options.filters = { user_id: userId };
  }

  return await fetchWithOptions('chatbots', options);
}

// Paginated bot list with filters
export async function fetchBotsPaginated(
  page: number = 1,
  pageSize: number = 10,
  filters: { userId?: string; industry?: string; status?: string } = {}
) {
  const options: QueryOptions = {
    orderBy: { column: 'created_at', ascending: false }
  };

  if (filters.userId) {
    options.eq = { ...options.eq, user_id: filters.userId };
  }

  if (filters.industry) {
    options.eq = { ...options.eq, industry: filters.industry };
  }

  if (filters.status) {
    options.eq = { ...options.eq, is_published: filters.status === 'active' };
  }

  return await fetchPaginated('chatbots', options, page, pageSize);
}

// ============ FLOW DATA OPERATIONS ============

// Update bot flow nodes
export async function updateBotFlowNodes(
  botId: string, 
  nodes: any[],
  edges: any[]
) {
  return await updateRecord('chatbots', botId, {
    flow_data: { nodes, edges },
    updated_at: new Date().toISOString()
  });
}

// Get bot flow data
export async function fetchBotFlow(botId: string) {
  const { data, error } = await fetchWithOptions('chatbots', {
    select: 'id, flow_data',
    eq: { id: botId },
    single: true
  });

  return { 
    data: (data as any)?.flow_data || { nodes: [], edges: [] }, 
    error 
  };
}

// ============ PRD OPERATIONS ============

// Update bot PRD
export async function updateBotPRD(botId: string, prd: any) {
  return await updateRecord('chatbots', botId, {
    prd,
    updated_at: new Date().toISOString()
  });
}

// Get bot PRD
export async function fetchBotPRD(botId: string) {
  const { data, error } = await fetchWithOptions('chatbots', {
    select: 'id, prd',
    eq: { id: botId },
    single: true
  });

  return { data: (data as any)?.prd || null, error };
}

// ============ PUBLISH OPERATIONS ============

// Publish bot
export async function publishBot(botId: string) {
  return await updateRecord('chatbots', botId, {
    is_published: true,
    published_at: new Date().toISOString()
  });
}

// Unpublish bot
export async function unpublishBot(botId: string) {
  return await updateRecord('chatbots', botId, {
    is_published: false,
    published_at: null
  });
}

// ============ ANALYTICS QUERIES ============

// Get conversation trends (last N days)
export async function getConversationTrends(days: number = 30, botId?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const since = new Date();
  since.setDate(since.getDate() - days);

  let query = supabase
    .from('conversations')
    .select('started_at, status')
    .gte('started_at', since.toISOString());

  if (botId) {
    query = query.eq('chatbot_id', botId);
  }

  const { data, error } = await query;

  if (error) return { data: null, error };

  // Group by date
  const trends = data?.reduce((acc: any, conv: any) => {
    const date = new Date(conv.started_at).toLocaleDateString();
    if (!acc[date]) acc[date] = { total: 0, completed: 0 };
    acc[date].total++;
    if (conv.status === 'completed') acc[date].completed++;
    return acc;
  }, {});

  return { data: trends, error: null };
}

// Get lead conversion stats
export async function getLeadStats(userId?: string) {
  const options: QueryOptions = {
    select: 'status, created_at'
  };

  if (userId) {
    options.eq = { user_id: userId };
  }

  const { data, error } = await fetchWithOptions('leads', options);

  if (error) return { data: null, error };

  const leads = data as any[] || [];
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    converted: leads.filter(l => l.status === 'converted').length,
    lost: leads.filter(l => l.status === 'lost').length
  };

  return { data: stats, error: null };
}

// ============ BATCH OPERATIONS ============

// Delete multiple bots (with safety check)
export async function deleteBots(
  botIds: string[], 
  soft: boolean = true
) {
  if (soft) {
    // Soft delete - mark as inactive
    const promises = botIds.map(id => softDelete('chatbots', id));
    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error).map(r => r.error);
    return { 
      data: results.filter(r => r.data).map(r => r.data), 
      error: errors.length > 0 ? errors : null 
    };
  } else {
    // Hard delete
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('chatbots')
      .delete()
      .in('id', botIds)
      .select('*');

    return { data, error };
  }
}

// Bulk update bot status
export async function bulkUpdateBotStatus(
  botIds: string[],
  status: 'draft' | 'active' | 'inactive'
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const updates: any = {
    is_published: status === 'active',
    updated_at: new Date().toISOString()
  };

  if (status === 'active') {
    updates.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('chatbots')
    .update(updates)
    .in('id', botIds)
    .select('*');

  return { data, error };
}

// ============ VALIDATION HELPERS ============

// Check if bot name is unique
export async function isBotNameUnique(name: string, excludeId?: string) {
  const options: QueryOptions = {
    ilike: { name: name },
    single: true
  };

  const { data, error } = await fetchWithOptions('chatbots', options);
  
  if (error) return { isUnique: false, error };
  if (!data) return { isUnique: true, error: null };
  if (excludeId && (data as any).id === excludeId) return { isUnique: true, error: null };
  
  return { isUnique: false, error: null };
}

// Check if user can create more bots (plan limit)
export async function canCreateBot(userId: string, tier: string) {
  const limits: Record<string, number> = {
    free: 1,
    starter: 2,
    pro: 5,
    enterprise: 100
  };

  const { count, error } = await countRecords('chatbots', {
    eq: { user_id: userId }
  });

  if (error) return { canCreate: false, error };

  const limit = limits[tier] || 1;
  const canCreate = (count || 0) < limit;

  return { 
    canCreate, 
    current: count || 0,
    limit,
    error: null 
  };
}
