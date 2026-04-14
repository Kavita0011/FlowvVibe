import { supabase } from '../supabase';

// Query options interface for flexible querying
export interface QueryOptions {
  select?: string;
  filters?: Record<string, any>;
  eq?: Record<string, any>;
  neq?: Record<string, any>;
  gt?: Record<string, number | string>;
  gte?: Record<string, number | string>;
  lt?: Record<string, number | string>;
  lte?: Record<string, number | string>;
  like?: Record<string, string>;
  ilike?: Record<string, string>;
  in?: Record<string, any[]>;
  is?: Record<string, null | boolean>;
  not?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  order?: { column: string; ascending?: boolean };
  limit?: number;
  range?: { from: number; to: number };
  single?: boolean;
  maybeSingle?: boolean;
}

// Pagination result interface
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Apply query options to a Supabase query
export function applyQueryOptions(
  query: any,
  options: QueryOptions
): any {
  let q = query;

  // Apply select
  if (options.select) {
    // Note: select is already applied when creating the query
  }

  // Apply equality filters
  if (options.eq) {
    Object.entries(options.eq).forEach(([column, value]) => {
      q = q.eq(column, value);
    });
  }

  // Apply not-equal filters
  if (options.neq) {
    Object.entries(options.neq).forEach(([column, value]) => {
      q = q.neq(column, value);
    });
  }

  // Apply greater-than filters
  if (options.gt) {
    Object.entries(options.gt).forEach(([column, value]) => {
      q = q.gt(column, value);
    });
  }

  // Apply greater-than-or-equal filters
  if (options.gte) {
    Object.entries(options.gte).forEach(([column, value]) => {
      q = q.gte(column, value);
    });
  }

  // Apply less-than filters
  if (options.lt) {
    Object.entries(options.lt).forEach(([column, value]) => {
      q = q.lt(column, value);
    });
  }

  // Apply less-than-or-equal filters
  if (options.lte) {
    Object.entries(options.lte).forEach(([column, value]) => {
      q = q.lte(column, value);
    });
  }

  // Apply like filters (case-sensitive)
  if (options.like) {
    Object.entries(options.like).forEach(([column, pattern]) => {
      q = q.like(column, pattern);
    });
  }

  // Apply ilike filters (case-insensitive)
  if (options.ilike) {
    Object.entries(options.ilike).forEach(([column, pattern]) => {
      q = q.ilike(column, pattern);
    });
  }

  // Apply in filters
  if (options.in) {
    Object.entries(options.in).forEach(([column, values]) => {
      q = q.in(column, values);
    });
  }

  // Apply is filters (for null/boolean)
  if (options.is) {
    Object.entries(options.is).forEach(([column, value]) => {
      q = q.is(column, value);
    });
  }

  // Apply not filters
  if (options.not) {
    Object.entries(options.not).forEach(([column, value]) => {
      q = q.not(column, 'eq', value);
    });
  }

  // Apply legacy filters (backward compatibility)
  if (options.filters) {
    Object.entries(options.filters).forEach(([column, value]) => {
      if (value !== undefined && value !== null) {
        q = q.eq(column, value);
      }
    });
  }

  // Apply ordering
  const orderColumn = options.orderBy?.column || options.order?.column;
  if (orderColumn) {
    q = q.order(orderColumn, { 
      ascending: options.orderBy?.ascending ?? options.order?.ascending ?? true 
    });
  }

  // Apply limit
  if (options.limit !== undefined) {
    q = q.limit(options.limit);
  }

  // Apply range (for pagination)
  if (options.range) {
    q = q.range(options.range.from, options.range.to);
  }

  return q;
}

// Generic fetch function with flexible query options
export async function fetchWithOptions<T>(
  table: string,
  options: QueryOptions = {}
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  let query = supabase.from(table).select(options.select || '*');
  query = applyQueryOptions(query, options);

  if (options.single) {
    return await query.single() as { data: T | null; error: any };
  }

  if (options.maybeSingle) {
    return await query.maybeSingle() as { data: T | null; error: any };
  }

  return await query as { data: T[] | null; error: any };
}

// Generic paginated fetch
export async function fetchPaginated<T>(
  table: string,
  options: QueryOptions = {},
  page: number = 1,
  pageSize: number = 10
): Promise<{ data: PaginatedResult<T> | null; error: any }> {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from(table).select('*', { count: 'exact' });
  query = applyQueryOptions(query, options);
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) return { data: null, error };

  const totalCount = count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  const result: PaginatedResult<T> = {
    data: data as T[] || [],
    count: totalCount,
    page,
    pageSize,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };

  return { data: result, error: null };
}

// Generic create function
export async function createRecord<T>(
  table: string,
  record: Partial<T>,
  options: { select?: string } = {}
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase
    .from(table)
    .insert(record)
    .select(options.select || '*')
    .single();

  return { data: data as T | null, error };
}

// Generic create multiple function
export async function createRecords<T>(
  table: string,
  records: Partial<T>[],
  options: { select?: string } = {}
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const { data, error } = await supabase
    .from(table)
    .insert(records)
    .select(options.select || '*');

  return { data: data as T[] | null, error };
}

// Generic update function
export async function updateRecord<T>(
  table: string,
  id: string,
  updates: Partial<T>,
  options: { select?: string; idColumn?: string } = {}
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const idColumn = options.idColumn || 'id';
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from(table)
    .update(updateData)
    .eq(idColumn, id)
    .select(options.select || '*')
    .single();

  return { data: data as T | null, error };
}

// Generic update by query
export async function updateRecords<T>(
  table: string,
  queryOptions: QueryOptions,
  updates: Partial<T>
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  let query = supabase.from(table).update({
    ...updates,
    updated_at: new Date().toISOString()
  });

  query = applyQueryOptions(query, queryOptions);

  const { data, error } = await query.select('*');
  return { data: data as T[] | null, error };
}

// Generic delete function
export async function deleteRecord(
  table: string,
  id: string,
  options: { idColumn?: string } = {}
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const idColumn = options.idColumn || 'id';

  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq(idColumn, id)
    .select()
    .single();

  return { data, error };
}

// Generic delete by query
export async function deleteRecords(
  table: string,
  queryOptions: QueryOptions
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  let query = supabase.from(table).delete();
  query = applyQueryOptions(query, queryOptions);

  const { data, error } = await query.select('*');
  return { data, error };
}

// Soft delete (update is_active to false instead of deleting)
export async function softDelete<T>(
  table: string,
  id: string,
  options: { select?: string; idColumn?: string } = {}
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const idColumn = options.idColumn || 'id';

  const { data, error } = await supabase
    .from(table)
    .update({
      is_active: false,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq(idColumn, id)
    .select(options.select || '*')
    .single();

  return { data: data as T | null, error };
}

// Restore soft-deleted record
export async function restoreRecord<T>(
  table: string,
  id: string,
  options: { select?: string; idColumn?: string } = {}
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const idColumn = options.idColumn || 'id';

  const { data, error } = await supabase
    .from(table)
    .update({
      is_active: true,
      deleted_at: null,
      updated_at: new Date().toISOString()
    })
    .eq(idColumn, id)
    .select(options.select || '*')
    .single();

  return { data: data as T | null, error };
}

// Count records
export async function countRecords(
  table: string,
  queryOptions: QueryOptions = {}
) {
  if (!supabase) return { count: 0, error: new Error('Supabase not configured') };

  let query = supabase.from(table).select('*', { count: 'exact', head: true });
  query = applyQueryOptions(query, queryOptions);

  const { count, error } = await query;
  return { count: count || 0, error };
}

// Check if record exists
export async function recordExists(
  table: string,
  queryOptions: QueryOptions
): Promise<boolean> {
  const { count, error } = await countRecords(table, { ...queryOptions, limit: 1 });
  if (error) return false;
  return (count || 0) > 0;
}

// Batch update
export async function batchUpdate<T>(
  table: string,
  ids: string[],
  updates: Partial<T>,
  options: { idColumn?: string } = {}
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const idColumn = options.idColumn || 'id';

  const { data, error } = await supabase
    .from(table)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .in(idColumn, ids)
    .select('*');

  return { data: data as T[] | null, error };
}

// Batch delete
export async function batchDelete(
  table: string,
  ids: string[],
  options: { idColumn?: string } = {}
) {
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };

  const idColumn = options.idColumn || 'id';

  const { data, error } = await supabase
    .from(table)
    .delete()
    .in(idColumn, ids)
    .select('*');

  return { data, error };
}
