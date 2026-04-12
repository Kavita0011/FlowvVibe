-- FlowvVibe Database Setup for Supabase

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

-- Users Table (for auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    password_hash VARCHAR(255),
    role VARCHAR(20) DEFAULT 'user',
    subscription_tier VARCHAR(20) DEFAULT 'free',
    subscription_status VARCHAR(20) DEFAULT 'active',
    company_name VARCHAR(255),
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending',
    method VARCHAR(20),
    plan VARCHAR(50),
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chatbots Table
CREATE TABLE IF NOT EXISTS chatbots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    tone VARCHAR(50) DEFAULT 'friendly',
    flow_data JSONB DEFAULT '{}',
    published BOOLEAN DEFAULT false,
    channels TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations Table
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    messages JSONB DEFAULT '[]',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
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

-- Enable Row Level Security (RLS) - optional for now
-- ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE custom_tiers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
