import { supabase } from '../supabase-client';
import type { Database } from '../../types/supabase';

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// Fetch all users (admin only)
export async function fetchUsers() {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
}

// Fetch single user by ID
export async function fetchUserById(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
}

// Fetch user by email
export async function fetchUserByEmail(email: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
}

// Create new user
export async function createUser(user: UserInsert) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('users')
    .insert(user)
    .select()
    .single();
}

// Update user
export async function updateUser(id: string, updates: UserUpdate) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('users')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
}

// Delete user
export async function deleteUser(id: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('users')
    .delete()
    .eq('id', id);
}

// Update user subscription
export async function updateUserSubscription(
  userId: string, 
  tier: string, 
  status: string = 'active'
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('users')
    .update({ 
      subscription_tier: tier, 
      subscription_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
}

// Update last login
export async function updateLastLogin(userId: string) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  return await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);
}
