import { Pool } from 'pg';
import type { Database } from '../types/supabase';

// Neon PostgreSQL connection string
const neonUrl = import.meta.env.VITE_NEON_DATABASE_URL || import.meta.env.NEXT_PUBLIC_NEON_DATABASE_URL;

if (!neonUrl) {
  console.warn('Neon database URL not configured. Using demo mode.');
}

// Create PostgreSQL pool for Neon
export const pool = neonUrl
  ? new Pool({
      connectionString: neonUrl,
      ssl: {
        rejectUnauthorized: false // Neon requires SSL
      }
    })
  : null;

// Helper to check if database is configured
export const isDatabaseConfigured = () => !!pool;

// Query helper function
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  if (!pool) {
    throw new Error('Database not configured');
  }
  
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    return res.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Transaction helper
export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  if (!pool) {
    throw new Error('Database not configured');
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default pool;
