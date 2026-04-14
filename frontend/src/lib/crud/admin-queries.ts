/**
 * Admin Queries - Specialized queries for admin dashboard
 * Handles complex aggregations, reports, and admin-specific operations
 */

import { supabase } from '../supabase-client';
import { fetchWithOptions, fetchPaginated, countRecords, type QueryOptions } from './query-builder';

// ============ ADMIN DASHBOARD STATS ============

export interface AdminDashboardStats {
  totalUsers: number;
  totalBots: number;
  totalConversations: number;
  totalRevenue: number;
  todayUsers: number;
  todayConversations: number;
  todayRevenue: number;
  activeUsers: number; // Logged in within 7 days
  conversionRate: number;
}

// Get comprehensive admin dashboard stats
export async function getAdminDashboardStats(): Promise<{ data: AdminDashboardStats | null; error: any }> {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  try {
    // Get total counts
    const { count: totalUsers } = await countRecords('users');
    const { count: totalBots } = await countRecords('chatbots');
    const { count: totalConversations } = await countRecords('conversations');

    // Get revenue
    const { data: payments } = await fetchWithOptions('payments', {
      eq: { status: 'completed' },
      select: 'amount'
    });
    const totalRevenue = (payments as any[])?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;

    // Get today's stats
    const today = new Date().toISOString().split('T')[0];
    const { count: todayUsers } = await countRecords('users', {
      gte: { created_at: today }
    });
    const { count: todayConversations } = await countRecords('conversations', {
      gte: { started_at: today }
    });

    // Get today's revenue
    const { data: todayPayments } = await fetchWithOptions('payments', {
      eq: { status: 'completed' },
      gte: { created_at: today },
      select: 'amount'
    });
    const todayRevenue = (todayPayments as any[])?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;

    // Get active users (logged in within 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: activeUsers } = await countRecords('users', {
      gte: { last_login_at: sevenDaysAgo.toISOString() }
    });

    // Calculate conversion rate (free to paid)
    const { count: freeUsers } = await countRecords('users', {
      eq: { subscription_tier: 'free' }
    });
    const paidUsers = (totalUsers || 0) - (freeUsers || 0);
    const conversionRate = totalUsers ? ((paidUsers / totalUsers) * 100).toFixed(1) : '0';

    const stats: AdminDashboardStats = {
      totalUsers: totalUsers || 0,
      totalBots: totalBots || 0,
      totalConversations: totalConversations || 0,
      totalRevenue,
      todayUsers: todayUsers || 0,
      todayConversations: todayConversations || 0,
      todayRevenue,
      activeUsers: activeUsers || 0,
      conversionRate: parseFloat(conversionRate as string)
    };

    return { data: stats, error: null };
  } catch (err) {
    return { data: null, error: err };
  }
}

// ============ USER MANAGEMENT ============

// Get users with their bot counts
export async function getUsersWithStats(page: number = 1, pageSize: number = 20) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data: paginatedResult, error } = await fetchPaginated('users', {
    orderBy: { column: 'created_at', ascending: false }
  }, page, pageSize);

  if (error) return { data: null, error };

  const users = paginatedResult?.data || [];
  const totalCount = paginatedResult?.count || 0;
  const totalPages = paginatedResult?.totalPages || 1;

  // Get bot counts for each user
  const userIds = users.map((u: any) => u.id) || [];
  const { data: bots } = await fetchWithOptions('chatbots', {
    in: { user_id: userIds },
    select: 'user_id, id'
  });

  // Count bots per user
  const botCounts: Record<string, number> = {};
  (bots as any[])?.forEach((bot: any) => {
    botCounts[bot.user_id] = (botCounts[bot.user_id] || 0) + 1;
  });

  // Merge stats
  const usersWithStats = users.map((user: any) => ({
    ...user,
    botCount: botCounts[user.id] || 0
  }));

  return {
    data: {
      users: usersWithStats,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount
      }
    },
    error: null
  };
}

// Search users by email or name
export async function searchUsers(searchTerm: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  // Search by email
  const { data: byEmail, error: emailError } = await supabase
    .from('users')
    .select('*')
    .ilike('email', `%${searchTerm}%`)
    .limit(20);

  if (emailError) return { data: null, error: emailError };

  // Search by display name
  const { data: byName, error: nameError } = await supabase
    .from('users')
    .select('*')
    .ilike('display_name', `%${searchTerm}%`)
    .limit(20);

  if (nameError) return { data: null, error: nameError };

  // Combine and deduplicate
  const combined = [...(byEmail || []), ...(byName || [])];
  const unique = combined.filter((user, index, self) =>
    index === self.findIndex((u: any) => u.id === user.id)
  );

  return { data: unique, error: null };
}

// Get user details with all related data
export async function getUserDetails(userId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  // Get user
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (userError) return { data: null, error: userError };

  // Get user's bots
  const { data: bots } = await fetchWithOptions('chatbots', {
    eq: { user_id: userId },
    select: 'id, name, is_published, views_count, conversations_count, created_at'
  });

  // Get user's payments
  const { data: payments } = await fetchWithOptions('payments', {
    eq: { user_id: userId },
    orderBy: { column: 'created_at', ascending: false }
  });

  // Get user's leads
  const { data: leads } = await fetchWithOptions('leads', {
    eq: { user_id: userId }
  });

  return {
    data: {
      user,
      bots: bots || [],
      payments: payments || [],
      leads: leads || [],
      stats: {
        totalBots: (bots as any[])?.length || 0,
        totalPayments: (payments as any[])?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0,
        totalLeads: (leads as any[])?.length || 0
      }
    },
    error: null
  };
}

// Suspend/unsuspend user
export async function updateUserStatus(userId: string, status: 'active' | 'suspended' | 'banned') {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  return await supabase
    .from('users')
    .update({ 
      subscription_status: status === 'active' ? 'active' : 'inactive',
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
}

// ============ BOT MANAGEMENT ============

// Get all bots with owner info
export async function getAllBotsWithOwners(page: number = 1, pageSize: number = 20, filters?: { status?: string; industry?: string }) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  let query = supabase
    .from('chatbots')
    .select('*, users(email, display_name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('is_published', filters.status === 'active');
  }

  if (filters?.industry) {
    query = query.eq('industry', filters.industry);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) return { data: null, error };

  const totalPages = Math.ceil((count || 0) / pageSize);

  return {
    data: {
      bots: data,
      pagination: {
        page,
        pageSize,
        totalPages,
        totalCount: count
      }
    },
    error: null
  };
}

// Get bot analytics
export async function getBotAnalytics(botId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  // Get bot details
  const { data: bot, error: botError } = await supabase
    .from('chatbots')
    .select('*')
    .eq('id', botId)
    .single();

  if (botError) return { data: null, error: botError };

  // Get conversations over time
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: conversations } = await supabase
    .from('conversations')
    .select('started_at, status')
    .eq('chatbot_id', botId)
    .gte('started_at', thirtyDaysAgo.toISOString());

  // Get messages count
  const { count: messagesCount } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('conversation_id', conversations?.map((c: any) => c.id) || []);

  // Group conversations by date
  const dailyStats = (conversations as any[])?.reduce((acc: any, conv: any) => {
    const date = new Date(conv.started_at).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { conversations: 0, completed: 0 };
    }
    acc[date].conversations++;
    if (conv.status === 'completed') acc[date].completed++;
    return acc;
  }, {});

  return {
    data: {
      bot,
      totalConversations: conversations?.length || 0,
      totalMessages: messagesCount || 0,
      dailyStats,
      completionRate: conversations?.length
        ? ((conversations.filter((c: any) => c.status === 'completed').length / conversations.length) * 100).toFixed(1)
        : 0
    },
    error: null
  };
}

// ============ REVENUE REPORTS ============

export interface RevenueReport {
  totalRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  byPlan: Record<string, number>;
  byMonth: Record<string, number>;
  growthRate: number;
}

// Get comprehensive revenue report
export async function getRevenueReport(): Promise<{ data: RevenueReport | null; error: any }> {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data: payments, error } = await supabase
    .from('payments')
    .select('amount, plan_id, created_at, status')
    .eq('status', 'completed');

  if (error) return { data: null, error };

  const completedPayments = (payments as any[]) || [];

  // Calculate totals
  const totalRevenue = completedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

  // Get this month
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const monthlyRevenue = completedPayments
    .filter((p: any) => p.created_at?.startsWith(thisMonth))
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  // Get this year
  const thisYear = now.getFullYear().toString();
  const yearlyRevenue = completedPayments
    .filter((p: any) => p.created_at?.startsWith(thisYear))
    .reduce((acc, p) => acc + (p.amount || 0), 0);

  // By plan
  const byPlan: Record<string, number> = {};
  completedPayments.forEach((p: any) => {
    const plan = p.plan_id || 'unknown';
    byPlan[plan] = (byPlan[plan] || 0) + (p.amount || 0);
  });

  // By month (last 12 months)
  const byMonth: Record<string, number> = {};
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toISOString().slice(0, 7);
    byMonth[monthKey] = 0;
  }
  completedPayments.forEach((p: any) => {
    const month = p.created_at?.slice(0, 7);
    if (month && byMonth.hasOwnProperty(month)) {
      byMonth[month] += (p.amount || 0);
    }
  });

  // Calculate growth rate (compare this month vs last month)
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
  const lastMonthRevenue = completedPayments
    .filter((p: any) => p.created_at?.startsWith(lastMonth))
    .reduce((acc, p) => acc + (p.amount || 0), 0);
  const growthRate = lastMonthRevenue
    ? (((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : 0;

  return {
    data: {
      totalRevenue,
      monthlyRevenue,
      yearlyRevenue,
      byPlan,
      byMonth,
      growthRate: parseFloat(growthRate as string)
    },
    error: null
  };
}

// ============ SYSTEM HEALTH ============

export interface SystemHealth {
  databaseStatus: 'healthy' | 'degraded' | 'down';
  lastBackup: string | null;
  totalTables: number;
  totalRecords: number;
  recentErrors: number;
}

// Get system health status
export async function getSystemHealth(): Promise<{ data: SystemHealth | null; error: any }> {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  try {
    // Test database connection
    const { error: pingError } = await supabase.from('users').select('id', { count: 'exact', head: true });
    const databaseStatus = pingError ? 'degraded' : 'healthy';

    // Count records in main tables
    const tables = ['users', 'chatbots', 'conversations', 'payments', 'leads', 'bookings'];
    let totalRecords = 0;

    for (const table of tables) {
      const { count } = await countRecords(table);
      totalRecords += count || 0;
    }

    return {
      data: {
        databaseStatus,
        lastBackup: null, // Would need backup tracking table
        totalTables: tables.length,
        totalRecords,
        recentErrors: 0 // Would need error logging
      },
      error: null
    };
  } catch (err) {
    return {
      data: {
        databaseStatus: 'down',
        lastBackup: null,
        totalTables: 0,
        totalRecords: 0,
        recentErrors: 1
      },
      error: null
    };
  }
}
