import pg from 'pg';
const { Pool } = pg;

// Detect if we're connecting to Neon (serverless Postgres) or local
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER || 'flowvibe'}:${process.env.DB_PASSWORD || 'flowvibe2024'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'flowvibe'}`;

const isNeon = connectionString.includes('neon.tech');

const pool = new Pool({
  connectionString,
  // Neon requires SSL; local Postgres does not
  ssl: isNeon ? { rejectUnauthorized: false } : false,
  // Neon's pooler manages connections externally — keep local pool small
  max: parseInt(process.env.DB_POOL_MAX || (isNeon ? '5' : '10')),
  idleTimeoutMillis: isNeon ? 10000 : 30000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
});

pool.on('error', (err) => console.error('Unexpected error on idle client', err));

export const query = (text: string, params?: unknown[]) => pool.query(text, params);
export const getClient = () => pool.connect();

// ==================== PAGINATION HELPER ====================
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const paginate = async <T>(
  table: string, 
  where: string = '', 
  page: number = 1, 
  limit: number = 20, 
  orderBy: string = 'created_at DESC',
  params: unknown[] = []
): Promise<PaginatedResult<T>> => {
  const offset = (page - 1) * limit;
  const whereClause = where ? `WHERE ${where}` : '';
  
  const [countResult, dataResult] = await Promise.all([
    query(`SELECT COUNT(*) FROM ${table} ${whereClause}`, params),
    query(`SELECT * FROM ${table} ${whereClause} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`, params)
  ]);

  const total = parseInt(countResult.rows[0].count);
  return {
    data: dataResult.rows as T[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

// ==================== USER OPERATIONS ====================
export const createUser = async (email: string, passwordHash: string, displayName: string) => {
  const result = await query(
    'INSERT INTO users(email, password_hash, display_name) VALUES($1, $2, $3) RETURNING *',
    [email, passwordHash, displayName]
  );
  return result.rows[0];
};

export const getUserByEmail = async (email: string) => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
};

export const getUserById = async (id: string) => {
  const result = await query('SELECT id, email, display_name, role, is_active, subscription_tier, created_at FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

export const updateUser = async (id: string, data: Record<string, unknown>) => {
  const keys = Object.keys(data);
  if (keys.length === 0) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }
  const fields = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [id, ...Object.values(data)];
  const result = await query(`UPDATE users SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`, values);
  return result.rows[0];
};

// ==================== CHATBOT OPERATIONS ====================
export const createChatbot = async (userId: string, name: string, industry: string) => {
  const result = await query(
    'INSERT INTO chatbots(user_id, name, industry) VALUES($1, $2, $3) RETURNING *',
    [userId, name, industry]
  );
  return result.rows[0];
};

export const getUserChatbots = async (userId: string, page = 1, limit = 20) => {
  return paginate('chatbots', 'user_id = $1', page, limit, 'created_at DESC', [userId]);
};

export const getAllChatbots = async (page = 1, limit = 20) => {
  return paginate('chatbots', '', page, limit, 'created_at DESC');
};

export const getChatbotById = async (id: string) => {
  const result = await query('SELECT * FROM chatbots WHERE id = $1', [id]);
  return result.rows[0];
};

export const updateChatbot = async (id: string, data: Record<string, unknown>) => {
  const keys = Object.keys(data);
  if (keys.length === 0) {
    const result = await query('SELECT * FROM chatbots WHERE id = $1', [id]);
    return result.rows[0];
  }
  const fields = keys.map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [id, ...Object.values(data)];
  const result = await query(`UPDATE chatbots SET ${fields}, updated_at = NOW() WHERE id = $1 RETURNING *`, values);
  return result.rows[0];
};

export const deleteChatbot = async (id: string) => {
  await query('DELETE FROM chatbots WHERE id = $1', [id]);
};

// ==================== BOOKING OPERATIONS ====================
export const createBooking = async (data: {
  chatbotId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  service: string;
  date: string;
  time: string;
  notes?: string;
}) => {
  const result = await query(
    `INSERT INTO bookings(chatbot_id, user_id, customer_name, customer_email, customer_phone, service, booking_date, booking_time, notes)
     VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [data.chatbotId, data.userId, data.customerName, data.customerEmail, data.customerPhone, data.service, data.date, data.time, data.notes]
  );
  return result.rows[0];
};

export const getChatbotBookings = async (chatbotId: string, page = 1, limit = 20) => {
  return paginate('bookings', 'chatbot_id = $1', page, limit, 'created_at DESC', [chatbotId]);
};

export const updateBookingStatus = async (id: string, status: string) => {
  const result = await query('UPDATE bookings SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING *', [id, status]);
  return result.rows[0];
};

// ==================== PAYMENT OPERATIONS ====================
export const createPayment = async (data: {
  userId: string;
  plan: string;
  amount: number;
  method?: string;
  transactionId?: string;
  status?: string;
}) => {
  const result = await query(
    'INSERT INTO payments(user_id, plan, amount, method, transaction_id, status) VALUES($1, $2, $3, $4, $5, $6) RETURNING *',
    [data.userId, data.plan, data.amount, data.method, data.transactionId, data.status || 'pending']
  );
  return result.rows[0];
};

export const getUserPayments = async (userId: string, page = 1, limit = 20) => {
  return paginate('payments', 'user_id = $1', page, limit, 'created_at DESC', [userId]);
};

// ==================== LEAD OPERATIONS ====================
export const createLead = async (data: {
  chatbotId: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  budget?: string;
}) => {
  const result = await query(
    'INSERT INTO leads(chatbot_id, user_id, name, email, phone, interest, budget) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [data.chatbotId, data.userId, data.name, data.email, data.phone, data.interest, data.budget]
  );
  return result.rows[0];
};

export const getChatbotLeads = async (chatbotId: string, page = 1, limit = 20) => {
  return paginate('leads', 'chatbot_id = $1', page, limit, 'created_at DESC', [chatbotId]);
};

export const getAllLeads = async (page = 1, limit = 20) => {
  return paginate('leads', '', page, limit, 'created_at DESC');
};

// ==================== CONVERSATION OPERATIONS ====================
export const createConversation = async (chatbotId: string, sessionId: string) => {
  const result = await query(
    'INSERT INTO conversations(chatbot_id, session_id) VALUES($1, $2) RETURNING *',
    [chatbotId, sessionId]
  );
  return result.rows[0];
};

export const getChatbotConversations = async (chatbotId: string, page = 1, limit = 20) => {
  return paginate('conversations', 'chatbot_id = $1', page, limit, 'started_at DESC', [chatbotId]);
};

export const ensureConversation = async (chatbotId: string, sessionId: string) => {
  const existing = await query(
    'SELECT * FROM conversations WHERE chatbot_id = $1 AND session_id = $2',
    [chatbotId, sessionId]
  );
  if (existing.rows[0]) return existing.rows[0];
  const created = await query(
    'INSERT INTO conversations (chatbot_id, session_id) VALUES ($1, $2) RETURNING *',
    [chatbotId, sessionId]
  );
  return created.rows[0];
};

export const addMessage = async (params: {
  conversationId: string;
  sender: string;
  content: string;
  intent?: string | null;
  sentiment?: string | null;
}) => {
  const r = await query(
    `INSERT INTO messages (conversation_id, sender, content, intent, sentiment)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      params.conversationId,
      params.sender,
      params.content,
      params.intent ?? null,
      params.sentiment ?? null,
    ]
  );
  return r.rows[0];
};

export const getRecentMessagesForConversation = async (
  conversationId: string,
  limit = 24
) => {
  const r = await query(
    `SELECT sender, content FROM messages
     WHERE conversation_id = $1
     ORDER BY timestamp ASC
     LIMIT $2`,
    [conversationId, limit]
  );
  return r.rows as Array<{ sender: string; content: string }>;
};

// ==================== ANALYTICS ====================
export const getDashboardStats = async () => {
  const [users, chatbots, payments, leads, bookings] = await Promise.all([
    query('SELECT COUNT(*) as total, COUNT(CASE WHEN is_active THEN 1 END) as active FROM users'),
    query('SELECT COUNT(*) as total, COUNT(CASE WHEN is_published THEN 1 END) as published FROM chatbots'),
    query("SELECT COUNT(*) as total, COALESCE(SUM(amount), 0) as revenue FROM payments WHERE status = 'completed'"),
    query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'new' THEN 1 END) as new_leads FROM leads"),
    query("SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed FROM bookings"),
  ]);
  
  return {
    totalUsers: parseInt(users.rows[0].total),
    activeUsers: parseInt(users.rows[0].active),
    totalChatbots: parseInt(chatbots.rows[0].total),
    publishedChatbots: parseInt(chatbots.rows[0].published),
    totalPayments: parseInt(payments.rows[0].total),
    totalRevenue: parseInt(payments.rows[0].revenue),
    totalLeads: parseInt(leads.rows[0].total),
    newLeads: parseInt(leads.rows[0].new_leads),
    totalBookings: parseInt(bookings.rows[0].total),
    confirmedBookings: parseInt(bookings.rows[0].confirmed),
  };
};

export interface ChatbotAnalytics {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: number;
  satisfaction: number;
  topIntents: { intent: string; count: number }[];
  conversationsByDay: { date: string; count: number }[];
  leadsCollected: number;
  conversionRate: number;
}

export const getChatbotAnalytics = async (
  chatbotId: string,
  period: '7d' | '30d' | '90d'
): Promise<ChatbotAnalytics> => {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;

  const [convRow, msgRow, intentRows, dayRows, leadsRow, ratingRow] = await Promise.all([
    query(
      `SELECT COUNT(*)::text AS c FROM conversations
       WHERE chatbot_id = $1 AND started_at >= NOW() - ($2::integer * INTERVAL '1 day')`,
      [chatbotId, days]
    ),
    query(
      `SELECT COUNT(*)::text AS c FROM messages m
       INNER JOIN conversations c ON c.id = m.conversation_id
       WHERE c.chatbot_id = $1 AND c.started_at >= NOW() - ($2::integer * INTERVAL '1 day')`,
      [chatbotId, days]
    ),
    query(
      `SELECT COALESCE(m.intent, 'general') AS intent, COUNT(*)::text AS count FROM messages m
       INNER JOIN conversations c ON c.id = m.conversation_id
       WHERE c.chatbot_id = $1 AND m.sender = 'bot' AND c.started_at >= NOW() - ($2::integer * INTERVAL '1 day')
       GROUP BY COALESCE(m.intent, 'general') ORDER BY COUNT(*) DESC LIMIT 8`,
      [chatbotId, days]
    ),
    query(
      `SELECT to_char(date_trunc('day', started_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS d,
              COUNT(*)::text AS c
       FROM conversations
       WHERE chatbot_id = $1 AND started_at >= NOW() - ($2::integer * INTERVAL '1 day')
       GROUP BY 1 ORDER BY 1`,
      [chatbotId, days]
    ),
    query(
      `SELECT COUNT(*)::text AS c FROM leads
       WHERE chatbot_id = $1 AND created_at >= NOW() - ($2::integer * INTERVAL '1 day')`,
      [chatbotId, days]
    ),
    query(
      `SELECT AVG(rating)::text AS avg FROM conversations
       WHERE chatbot_id = $1 AND rating IS NOT NULL AND started_at >= NOW() - ($2::integer * INTERVAL '1 day')`,
      [chatbotId, days]
    ),
  ]);

  const totalConversations = parseInt(convRow.rows[0]?.c || '0', 10);
  const totalMessages = parseInt(msgRow.rows[0]?.c || '0', 10);
  const leadsCollected = parseInt(leadsRow.rows[0]?.c || '0', 10);
  const topIntents = intentRows.rows.map((r) => ({
    intent: r.intent,
    count: parseInt(r.count, 10),
  }));
  const conversationsByDay = dayRows.rows.map((r) => ({
    date: r.d,
    count: parseInt(r.c, 10),
  }));

  const avgRating = ratingRow.rows[0]?.avg ? parseFloat(ratingRow.rows[0].avg) : 0;
  const satisfaction = avgRating > 0 ? Math.min(100, Math.round((avgRating / 5) * 100)) : 0;

  const conversionRate =
    totalConversations > 0
      ? Math.round((leadsCollected / totalConversations) * 1000) / 10
      : 0;

  return {
    totalConversations,
    totalMessages,
    avgResponseTime: 0,
    satisfaction,
    topIntents,
    conversationsByDay,
    leadsCollected,
    conversionRate,
  };
};

// ==================== SEARCH ====================
export const searchUsers = async (search: string, page = 1, limit = 20) => {
  return paginate('users', 'email ILIKE $1', page, limit, 'created_at DESC', [`%${search}%`]);
};

export const searchChatbots = async (search: string, page = 1, limit = 20) => {
  return paginate('chatbots', 'name ILIKE $1 OR industry ILIKE $1', page, limit, 'created_at DESC', [`%${search}%`]);
};

export const searchLeads = async (search: string, page = 1, limit = 20) => {
  return paginate('leads', 'name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1', page, limit, 'created_at DESC', [`%${search}%`]);
};

/** Creates pricing_plans / custom_tiers if missing (admin pricing API). Idempotent. */
export const initPricingTables = async (): Promise<void> => {
  await query(`
    CREATE TABLE IF NOT EXISTS pricing_plans (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      price INTEGER NOT NULL DEFAULT 0,
      original_price INTEGER DEFAULT 0,
      period VARCHAR(50) DEFAULT 'one-time',
      description TEXT,
      is_on_sale BOOLEAN DEFAULT false,
      sale_reason VARCHAR(100),
      sale_ends DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS custom_tiers (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      min_users INTEGER DEFAULT 1,
      max_users VARCHAR(20) DEFAULT 'unlimited',
      price_per_user INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const { rows } = await query('SELECT COUNT(*)::text AS c FROM pricing_plans');
  if (parseInt(rows[0].c, 10) === 0) {
    await query(`
      INSERT INTO pricing_plans (id, name, price, original_price, period, description, is_on_sale, sale_ends) VALUES
      ('free', 'Free', 0, 0, 'forever', 'For testing', false, NULL),
      ('starter', 'Starter', 999, 1999, 'one-time', 'One-time payment', true, '2026-04-30'),
      ('pro', 'Pro', 2499, 4999, 'one-time', 'Most popular', true, '2026-04-30'),
      ('enterprise', 'Enterprise', 9999, 19999, 'one-time', 'For large teams', true, '2026-04-30')
      ON CONFLICT (id) DO NOTHING;
    `);
  }
  const tierCount = await query('SELECT COUNT(*)::text AS c FROM custom_tiers');
  if (parseInt(tierCount.rows[0].c, 10) === 0) {
    await query(`
      INSERT INTO custom_tiers (id, name, min_users, max_users, price_per_user) VALUES
      ('starter', 'Starter', 1, '5', 399),
      ('team', 'Team', 6, '20', 349),
      ('business', 'Business', 21, '50', 299),
      ('enterprise', 'Enterprise', 51, 'unlimited', 249)
      ON CONFLICT (id) DO NOTHING;
    `);
  }
};