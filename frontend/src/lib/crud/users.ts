import { query } from '../db-client';
import type { Database } from '../../types/supabase';

export type User = Database['public']['Tables']['users']['Row'];
export type UserInsert = Database['public']['Tables']['users']['Insert'];
export type UserUpdate = Database['public']['Tables']['users']['Update'];

// Fetch all users (admin only)
export async function fetchUsers() {
  try {
    const data = await query<User>('SELECT * FROM public.users ORDER BY created_at DESC');
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Fetch single user by ID
export async function fetchUserById(id: string) {
  try {
    const data = await query<User>('SELECT * FROM public.users WHERE id = $1', [id]);
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Fetch user by email
export async function fetchUserByEmail(email: string) {
  try {
    const data = await query<User>('SELECT * FROM public.users WHERE email = $1', [email]);
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Create new user
export async function createUser(user: UserInsert) {
  try {
    const {
      email,
      password_hash,
      display_name,
      company_name,
      location,
      role = 'user',
      is_active = true,
      subscription_tier = 'free',
      subscription_status = 'active'
    } = user;

    const data = await query<User>(
      `INSERT INTO public.users (email, password_hash, display_name, company_name, location, role, is_active, subscription_tier, subscription_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [email, password_hash, display_name, company_name, location, role, is_active, subscription_tier, subscription_status]
    );
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update user
export async function updateUser(id: string, updates: UserUpdate) {
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

    const queryText = `UPDATE public.users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const data = await query<User>(queryText, values);
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Delete user
export async function deleteUser(id: string) {
  try {
    await query('DELETE FROM public.users WHERE id = $1', [id]);
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// Update user subscription
export async function updateUserSubscription(
  userId: string,
  tier: string,
  status: string = 'active'
) {
  try {
    const data = await query<User>(
      `UPDATE public.users 
       SET subscription_tier = $1, subscription_status = $2, updated_at = $3
       WHERE id = $4
       RETURNING *`,
      [tier, status, new Date().toISOString(), userId]
    );
    return { data: data[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// Update last login
export async function updateLastLogin(userId: string) {
  try {
    await query('UPDATE public.users SET last_login_at = $1 WHERE id = $2', [new Date().toISOString(), userId]);
    return { error: null };
  } catch (error) {
    return { error };
  }
}
