import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER || 'flowvibe'}:${process.env.DB_PASSWORD || 'flowvibe2024'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'flowvibe'}`,
  max: parseInt(process.env.DB_POOL_MAX || '30'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
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
  const fields = Object.keys(data).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [...Object.values(data), id];
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
  const fields = Object.keys(data).map((k, i) => `${k} = $${i + 2}`).join(', ');
  const values = [...Object.values(data), id];
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