import { query } from '../db-client';
import type { Database } from '../../types/supabase';

export type Lead = Database['public']['Tables']['leads']['Row'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];

export type Booking = Database['public']['Tables']['bookings']['Row'];
export type BookingInsert = Database['public']['Tables']['bookings']['Insert'];
export type BookingUpdate = Database['public']['Tables']['bookings']['Update'];

// ========== LEADS CRUD ==========

// Fetch leads (optionally filtered by user)
export async function fetchLeads(userId?: string) {
  try {
    let queryText = 'SELECT * FROM public.leads ORDER BY created_at DESC';
    let params: any[] = [];

    if (userId) {
      queryText = 'SELECT * FROM public.leads WHERE user_id = $1 ORDER BY created_at DESC';
      params = [userId];
    }

    const data = await query<Lead>(queryText, params);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Fetch leads by chatbot
export async function fetchLeadsByChatbot(chatbotId: string) {
  try {
    const data = await query<Lead>('SELECT * FROM public.leads WHERE chatbot_id = $1 ORDER BY created_at DESC', [chatbotId]);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Create new lead
export async function createLead(lead: LeadInsert) {
  try {
    const {
      chatbot_id,
      user_id,
      conversation_id,
      name,
      email,
      phone,
      interest,
      budget,
      timeline,
      notes,
      status = 'new'
    } = lead;

    const data = await query<Lead>(
      `INSERT INTO public.leads (chatbot_id, user_id, conversation_id, name, email, phone, interest, budget, timeline, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [chatbot_id, user_id, conversation_id, name, email, phone, interest, budget, timeline, notes, status]
    );
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update lead
export async function updateLead(id: string, updates: LeadUpdate) {
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

    const queryText = `UPDATE public.leads SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const data = await query<Lead>(queryText, values);
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update lead status
export async function updateLeadStatus(
  id: string,
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
) {
  try {
    const data = await query<Lead>(
      `UPDATE public.leads
       SET status = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [status, new Date().toISOString(), id]
    );
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Delete lead
export async function deleteLead(id: string) {
  try {
    await query('DELETE FROM public.leads WHERE id = $1', [id]);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// ========== BOOKINGS CRUD ==========

// Fetch bookings (optionally filtered by user)
export async function fetchBookings(userId?: string) {
  try {
    let queryText = 'SELECT * FROM public.bookings ORDER BY booking_date ASC';
    let params: any[] = [];

    if (userId) {
      queryText = 'SELECT * FROM public.bookings WHERE user_id = $1 ORDER BY booking_date ASC';
      params = [userId];
    }

    const data = await query<Booking>(queryText, params);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Fetch bookings by chatbot
export async function fetchBookingsByChatbot(chatbotId: string) {
  try {
    const data = await query<Booking>('SELECT * FROM public.bookings WHERE chatbot_id = $1 ORDER BY booking_date ASC', [chatbotId]);
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Create new booking
export async function createBooking(booking: BookingInsert) {
  try {
    const {
      chatbot_id,
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      service,
      booking_date,
      booking_time,
      notes,
      status = 'pending'
    } = booking;

    const data = await query<Booking>(
      `INSERT INTO public.bookings (chatbot_id, user_id, customer_name, customer_email, customer_phone, service, booking_date, booking_time, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [chatbot_id, user_id, customer_name, customer_email, customer_phone, service, booking_date, booking_time, notes, status]
    );
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update booking
export async function updateBooking(id: string, updates: BookingUpdate) {
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

    const queryText = `UPDATE public.bookings SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const data = await query<Booking>(queryText, values);
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update booking status
export async function updateBookingStatus(
  id: string,
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
) {
  try {
    const data = await query<Booking>(
      `UPDATE public.bookings
       SET status = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [status, new Date().toISOString(), id]
    );
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Delete booking
export async function deleteBooking(id: string) {
  try {
    await query('DELETE FROM public.bookings WHERE id = $1', [id]);
    return { error: null };
  } catch (error) {
    return { error };
  }
}
