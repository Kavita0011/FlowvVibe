import { supabase } from '../supabase-client';
import type { Database } from '../../types/supabase';

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

// Fetch all payments (admin) or filter by user
export async function fetchPayments(userId?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  let query = supabase
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  return await query;
}

// Fetch payment by ID
export async function fetchPaymentById(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('payments')
    .select('*')
    .eq('id', id)
    .single();
}

// Create new payment
export async function createPayment(payment: PaymentInsert) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('payments')
    .insert(payment)
    .select()
    .single();
}

// Update payment status
export async function updatePaymentStatus(
  id: string, 
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  transactionId?: string
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  const updates: any = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  
  if (transactionId) {
    updates.transaction_id = transactionId;
  }
  
  return await supabase
    .from('payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
}

// Update payment with receipt
export async function updatePaymentReceipt(
  id: string, 
  receiptUrl: string, 
  invoiceId?: string
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('payments')
    .update({ 
      receipt_url: receiptUrl,
      invoice_id: invoiceId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
}

// Get total revenue (admin only)
export async function getTotalRevenue() {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  const { data, error } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'completed');
  
  if (error) return { data: null, error };
  
  const total = data?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
  return { data: total, error: null };
}

// Get revenue by period (admin only)
export async function getRevenueByPeriod(startDate: string, endDate: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  const { data, error } = await supabase
    .from('payments')
    .select('amount, created_at')
    .eq('status', 'completed')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  if (error) return { data: null, error };
  
  const total = data?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
  return { data: { total, payments: data }, error: null };
}
