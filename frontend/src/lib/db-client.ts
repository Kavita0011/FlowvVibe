/**
 * Database client - uses API for all environments
 * No direct PostgreSQL connections from browser
 */

import api from './api';

export const isDatabaseConfigured = () => true;

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const result = await api('/query', {
    method: 'POST',
    body: JSON.stringify({ sql, params }),
  });
  return result.rows || [];
}

export async function transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  throw new Error('Transactions not supported via API. Use sequential queries.');
}

export default { query, isDatabaseConfigured };