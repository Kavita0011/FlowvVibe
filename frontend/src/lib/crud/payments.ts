import { query } from '../db-client';
import type { Database } from '../../types/supabase';

export type Payment = Database['public']['Tables']['payments']['Row'];
export type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
export type PaymentUpdate = Database['public']['Tables']['payments']['Update'];

// Fetch all payments (admin) or filter by user
export async function fetchPayments(userId?: string) {
  try {
    let queryText = 'SELECT * FROM public.payments ORDER BY created_at DESC';
    let params: any[] = [];

    if (userId) {
      queryText = 'SELECT * FROM public.payments WHERE user_id = $1 ORDER BY created_at DESC';
      params = [userId];
    }

    const data = await query<Payment>(queryText, params);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Fetch payment by ID
export async function fetchPaymentById(id: string) {
  try {
    const data = await query<Payment>('SELECT * FROM public.payments WHERE id = $1', [id]);
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Create new payment
export async function createPayment(payment: PaymentInsert) {
  try {
    const {
      user_id,
      subscription_id,
      amount,
      currency = 'INR',
      status = 'pending',
      payment_method,
      transaction_id,
      invoice_id,
      receipt_url
    } = payment;

    const data = await query<Payment>(
      `INSERT INTO public.payments (user_id, subscription_id, amount, currency, status, payment_method, transaction_id, invoice_id, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [user_id, subscription_id, amount, currency, status, payment_method, transaction_id, invoice_id, receipt_url]
    );
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update payment status
export async function updatePaymentStatus(
  id: string,
  status: 'pending' | 'completed' | 'failed' | 'refunded',
  transactionId?: string
) {
  try {
    let queryText = 'UPDATE public.payments SET status = $1, updated_at = $2 WHERE id = $3 RETURNING *';
    let params: any[] = [status, new Date().toISOString(), id];

    if (transactionId) {
      queryText = 'UPDATE public.payments SET status = $1, transaction_id = $2, updated_at = $3 WHERE id = $4 RETURNING *';
      params = [status, transactionId, new Date().toISOString(), id];
    }

    const data = await query<Payment>(queryText, params);
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update payment with receipt
export async function updatePaymentReceipt(
  id: string,
  receiptUrl: string,
  invoiceId?: string
) {
  try {
    let queryText = 'UPDATE public.payments SET receipt_url = $1, updated_at = $2 WHERE id = $3 RETURNING *';
    let params: any[] = [receiptUrl, new Date().toISOString(), id];

    if (invoiceId) {
      queryText = 'UPDATE public.payments SET receipt_url = $1, invoice_id = $2, updated_at = $3 WHERE id = $4 RETURNING *';
      params = [receiptUrl, invoiceId, new Date().toISOString(), id];
    }

    const data = await query<Payment>(queryText, params);
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Get total revenue (admin only)
export async function getTotalRevenue() {
  try {
    const data = await query<{ amount: number }>('SELECT amount FROM public.payments WHERE status = $1', ['completed']);
    const total = data?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
    return { data: total, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Get revenue by period (admin only)
export async function getRevenueByPeriod(startDate: string, endDate: string) {
  try {
    const data = await query<{ amount: number; created_at: string }>(
      'SELECT amount, created_at FROM public.payments WHERE status = $1 AND created_at >= $2 AND created_at <= $3',
      ['completed', startDate, endDate]
    );
    const total = data?.reduce((acc, p) => acc + (p.amount || 0), 0) || 0;
    return { data: { total, payments: data }, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
