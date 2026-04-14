import { supabase } from '../supabase-client';
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
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  let query = supabase
    .from('leads')
    .select('*, chatbots(name)')
    .order('created_at', { ascending: false });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  return await query;
}

// Fetch leads by chatbot
export async function fetchLeadsByChatbot(chatbotId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('leads')
    .select('*')
    .eq('chatbot_id', chatbotId)
    .order('created_at', { ascending: false });
}

// Create new lead
export async function createLead(lead: LeadInsert) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();
}

// Update lead
export async function updateLead(id: string, updates: LeadUpdate) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

// Update lead status
export async function updateLeadStatus(
  id: string, 
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('leads')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();
}

// Delete lead
export async function deleteLead(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('leads')
    .delete()
    .eq('id', id);
}

// ========== BOOKINGS CRUD ==========

// Fetch bookings (optionally filtered by user)
export async function fetchBookings(userId?: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  let query = supabase
    .from('bookings')
    .select('*')
    .order('booking_date', { ascending: true });
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  return await query;
}

// Fetch bookings by chatbot
export async function fetchBookingsByChatbot(chatbotId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('bookings')
    .select('*')
    .eq('chatbot_id', chatbotId)
    .order('booking_date', { ascending: true });
}

// Create new booking
export async function createBooking(booking: BookingInsert) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single();
}

// Update booking
export async function updateBooking(id: string, updates: BookingUpdate) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('bookings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

// Update booking status
export async function updateBookingStatus(
  id: string, 
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('bookings')
    .update({ 
      status, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select()
    .single();
}

// Delete booking
export async function deleteBooking(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('bookings')
    .delete()
    .eq('id', id);
}
