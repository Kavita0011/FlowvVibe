-- Run this in pgAdmin to setup Flowvibe database

-- Create database (run as superuser)
-- CREATE DATABASE flowvibe;

-- Connect to flowvibe database and run:

-- Pricing Plans Table
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

-- Custom Tiers Table
CREATE TABLE IF NOT EXISTS custom_tiers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    min_users INTEGER DEFAULT 1,
    max_users VARCHAR(20) DEFAULT 'unlimited',
    price_per_user INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default pricing plans
INSERT INTO pricing_plans (id, name, price, original_price, period, description, is_on_sale, sale_ends) VALUES
('free', 'Free', 0, 0, 'forever', 'For testing', false, NULL),
('starter', 'Starter', 999, 1999, 'one-time', 'One-time payment', true, '2026-04-30'),
('pro', 'Pro', 2499, 4999, 'one-time', 'Most popular', true, '2026-04-30'),
('enterprise', 'Enterprise', 9999, 19999, 'one-time', 'For large teams', true, '2026-04-30')
ON CONFLICT (id) DO NOTHING;

-- Seed default custom tiers
INSERT INTO custom_tiers (id, name, min_users, max_users, price_per_user) VALUES
('starter', 'Starter', 1, '5', 399),
('team', 'Team', 6, '20', 349),
('business', 'Business', 21, '50', 299),
('enterprise', 'Enterprise', 51, 'unlimited', 249)
ON CONFLICT (id) DO NOTHING;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    phone VARCHAR(50),
    company_name VARCHAR(255),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login_at TIMESTAMP
);

-- Admin Users table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '[]',
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Chatbots table
CREATE TABLE IF NOT EXISTS chatbots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    description TEXT,
    tone VARCHAR(50) DEFAULT 'friendly',
    flow_data JSONB DEFAULT '{"nodes":[],"edges":[]}',
    prd JSONB,
    is_published BOOLEAN DEFAULT false,
    channel_configs JSONB DEFAULT '[]',
    views_count INTEGER DEFAULT 0,
    conversations_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(255) UNIQUE,
    visitor_id VARCHAR(255),
    visitor_name VARCHAR(100),
    visitor_email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    rating INTEGER,
    feedback TEXT,
    lead_data JSONB,
    metadata JSONB DEFAULT '{}'
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    intent VARCHAR(100),
    sentiment VARCHAR(50),
    confidence DECIMAL(5,4),
    metadata JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    method VARCHAR(50),
    transaction_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    invoice_id VARCHAR(100),
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User Subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tier_id VARCHAR(50) REFERENCES pricing_plans(id),
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID,
    name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    interest VARCHAR(255),
    budget VARCHAR(100),
    timeline VARCHAR(100),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    service VARCHAR(255),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Agents table (for human handoff)
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    online BOOLEAN DEFAULT false,
    max_chats INTEGER DEFAULT 5,
    active_chats INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions (human handoff)
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
    customer_id VARCHAR(255),
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'waiting',
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '["read"]',
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Feature access table (for premium addons)
CREATE TABLE IF NOT EXISTS feature_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feature VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT false,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, feature)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_is_published ON chatbots(is_published);
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_leads_chatbot_id ON leads(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_bookings_chatbot_id ON bookings(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON feature_access(user_id);

-- Demo Data for Users
INSERT INTO users (id, email, password_hash, display_name, role, company_name, location, subscription_tier, subscription_status) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'admin@flowvibe.com', '$2b$10$example_hash', 'Admin User', 'admin', 'Flowvibe Inc', 'San Francisco, CA', 'enterprise', 'active'),
('550e8400-e29b-41d4-a716-446655440002', 'john.doe@example.com', '$2b$10$example_hash', 'John Doe', 'user', 'Tech Startup', 'New York, NY', 'pro', 'active'),
('550e8400-e29b-41d4-a716-446655440003', 'jane.smith@example.com', '$2b$10$example_hash', 'Jane Smith', 'user', 'Marketing Agency', 'London, UK', 'starter', 'active'),
('550e8400-e29b-41d4-a716-446655440004', 'mike.wilson@example.com', '$2b$10$example_hash', 'Mike Wilson', 'user', 'E-commerce Store', 'Toronto, ON', 'free', 'active')
ON CONFLICT (id) DO NOTHING;

-- Demo Data for Admins
INSERT INTO admins (user_id, role, permissions) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'super_admin', '["all"]')
ON CONFLICT (user_id) DO NOTHING;

-- Demo Data for Chatbots
INSERT INTO chatbots (id, user_id, name, industry, description, tone, is_published, views_count, conversations_count) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Customer Support Bot', 'Technology', 'Handles customer inquiries and support tickets', 'professional', true, 1250, 342),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Sales Assistant', 'Retail', 'Helps customers with product recommendations and purchases', 'friendly', true, 890, 156),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Lead Generation Bot', 'Marketing', 'Captures leads and qualifies prospects', 'enthusiastic', false, 45, 12)
ON CONFLICT (id) DO NOTHING;

-- Demo Data for Conversations
INSERT INTO conversations (id, chatbot_id, visitor_id, visitor_name, visitor_email, status, started_at, duration_seconds) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'visitor_123', 'Alice Johnson', 'alice@example.com', 'completed', NOW() - INTERVAL '2 hours', 1200),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'visitor_124', 'Bob Smith', 'bob@example.com', 'active', NOW() - INTERVAL '30 minutes', NULL),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440002', 'visitor_125', 'Carol White', 'carol@example.com', 'completed', NOW() - INTERVAL '1 day', 900)
ON CONFLICT (id) DO NOTHING;

-- Demo Data for Messages
INSERT INTO messages (id, conversation_id, sender, content, message_type, timestamp) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'bot', 'Hello! How can I help you today?', 'text', NOW() - INTERVAL '2 hours'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'user', 'I need help with my account', 'text', NOW() - INTERVAL '1 hour 55 minutes'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'bot', 'I can help you with account issues. What specific problem are you experiencing?', 'text', NOW() - INTERVAL '1 hour 54 minutes'),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', 'bot', 'Welcome! How may I assist you?', 'text', NOW() - INTERVAL '30 minutes'),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440002', 'user', 'I want to know about your pricing plans', 'text', NOW() - INTERVAL '28 minutes')
ON CONFLICT (id) DO NOTHING;

-- Demo Data for Payments
INSERT INTO payments (id, user_id, plan, amount, currency, method, transaction_id, status) VALUES
('990e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'pro', 2499.00, 'INR', 'razorpay', 'txn_123456789', 'completed'),
('990e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'starter', 999.00, 'INR', 'razorpay', 'txn_987654321', 'completed'),
('990e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'free', 0.00, 'INR', NULL, NULL, 'completed')
ON CONFLICT (id) DO NOTHING;

-- Demo Data for User Subscriptions
INSERT INTO user_subscriptions (id, user_id, tier_id, status, started_at, expires_at) VALUES
('110e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'pro', 'active', NOW() - INTERVAL '1 month', NOW() + INTERVAL '11 months'),
('110e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'starter', 'active', NOW() - INTERVAL '2 weeks', NULL),
('110e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'free', 'active', NOW() - INTERVAL '1 month', NULL)
ON CONFLICT (id) DO NOTHING;

-- Demo Data for Leads
INSERT INTO leads (id, chatbot_id, user_id, name, email, phone, interest, budget, status) VALUES
('120e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'David Lee', 'david.lee@example.com', '+1-555-0123', 'Enterprise Solution', '$10000+', 'qualified'),
('120e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Emma Davis', 'emma@example.com', '+1-555-0124', 'Pro Plan', '$5000', 'new'),
('120e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Frank Miller', 'frank@example.com', '+1-555-0125', 'Basic Plan', '$1000', 'contacted')
ON CONFLICT (id) DO NOTHING;

-- Demo Data for Bookings
INSERT INTO bookings (id, chatbot_id, user_id, customer_name, customer_email, customer_phone, service, booking_date, booking_time, status) VALUES
('130e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Grace Chen', 'grace@example.com', '+1-555-0126', 'Product Demo', CURRENT_DATE + INTERVAL '3 days', '14:00:00', 'confirmed'),
('130e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'Henry Brown', 'henry@example.com', '+1-555-0127', 'Consultation', CURRENT_DATE + INTERVAL '1 day', '10:30:00', 'pending'),
('130e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'Iris Taylor', 'iris@example.com', '+1-555-0128', 'Support Call', CURRENT_DATE, '16:00:00', 'completed')
ON CONFLICT (id) DO NOTHING;

-- Demo Data for Agents
INSERT INTO agents (id, user_id, email, name, online, max_chats, active_chats) VALUES
('140e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'support.agent@flowvibe.com', 'Support Agent', true, 10, 3),
('140e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'sales.agent@flowvibe.com', 'Sales Agent', true, 8, 2)
ON CONFLICT (id) DO NOTHING;

-- Demo Data for Chat Sessions
INSERT INTO chat_sessions (id, chatbot_id, customer_id, customer_name, customer_email, agent_id, status, started_at) VALUES
('150e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'cust_123', 'Jack Wilson', 'jack@example.com', '140e8400-e29b-41d4-a716-446655440001', 'active', NOW() - INTERVAL '45 minutes')
ON CONFLICT (id) DO NOTHING;

-- Demo Data for API Keys
INSERT INTO api_keys (id, user_id, name, api_key, permissions, is_active) VALUES
('160e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'Production API Key', 'pk_live_1234567890abcdef', '["read", "write"]', true),
('160e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Test API Key', 'pk_test_abcdef1234567890', '["read"]', true)
ON CONFLICT (id) DO NOTHING;

-- Demo Data for Feature Access
INSERT INTO feature_access (id, user_id, feature, active, expires_at) VALUES
('180e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'advanced_analytics', true, NOW() + INTERVAL '11 months'),
('180e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'custom_branding', true, NOW() + INTERVAL '11 months'),
('180e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'basic_analytics', true, NULL),
('180e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'web_embed', true, NULL)
ON CONFLICT (user_id, feature) DO NOTHING;
