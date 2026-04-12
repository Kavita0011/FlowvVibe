-- FlowvVibe Database Setup for Supabase

-- Admin Table
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '[]',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Features Table
CREATE TABLE IF NOT EXISTS features (
    id VARCHAR(50) PRIMARY KEY,
    service_id VARCHAR(50) REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    feature_key VARCHAR(100),
    is_enabled BOOLEAN DEFAULT true,
    limit_value INTEGER,
    limit_unit VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase Tiers Table
CREATE TABLE IF NOT EXISTS purchase_tiers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    tier_key VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price INTEGER NOT NULL DEFAULT 0,
    original_price INTEGER DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'INR',
    period VARCHAR(50) DEFAULT 'one-time',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tier Features (many-to-many between purchase_tiers and features)
CREATE TABLE IF NOT EXISTS tier_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_id VARCHAR(50) REFERENCES purchase_tiers(id) ON DELETE CASCADE,
    feature_id VARCHAR(50) REFERENCES features(id) ON DELETE CASCADE,
    limit_value INTEGER,
    is_included BOOLEAN DEFAULT true,
    UNIQUE(tier_id, feature_id)
);

-- Pricing Plans Table
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
-- Enable Row Level Security (RLS) - optional for now
-- ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE custom_tiers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE services ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE features ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE purchase_tiers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tier_features ENABLE ROW LEVEL SECURITY;

-- Seed default services
INSERT INTO services (id, name, slug, description, icon, category, sort_order) VALUES
('chatbot', 'AI Chatbot Builder', 'chatbot-builder', 'Build intelligent chatbots with visual flow builder', 'bot', 'core', 1),
('analytics', 'Analytics Dashboard', 'analytics', 'Track conversations and user engagement', 'chart', 'core', 2),
('integrations', 'Integrations', 'integrations', 'Connect with your favorite tools', 'plug', 'core', 3),
('customization', 'Customization', 'customization', 'Customize chatbot appearance and behavior', 'palette', 'core', 4),
('deployment', 'Deployment', 'deployment', 'Deploy to multiple platforms', 'rocket', 'core', 5)
ON CONFLICT (id) DO NOTHING;

-- Seed default features
INSERT INTO features (id, service_id, name, description, feature_key, limit_value, limit_unit, sort_order) VALUES
('chatbot_flows', 'chatbot', 'Bot Flows', 'Create unlimited conversation flows', 'flows', -1, 'unlimited', 1),
('chatbot_messages', 'chatbot', 'Monthly Messages', 'Messages per month', 'messages', 100, 'monthly', 2),
('chatbot_industries', 'chatbot', 'Industry Templates', 'Pre-built industry templates', 'industries', 10, 'templates', 3),
('chatbot_languages', 'chatbot', 'Languages', 'Supported languages', 'languages', 5, 'languages', 4),
('analytics_basic', 'analytics', 'Basic Analytics', 'View basic conversation stats', 'analytics_basic', 1, 'dashboard', 5),
('analytics_advanced', 'analytics', 'Advanced Analytics', 'Deep insights and trends', 'analytics_advanced', 1, 'dashboard', 6),
('analytics_export', 'analytics', 'Data Export', 'Export analytics data', 'export', 1, 'formats', 7),
('integrations_web', 'integrations', 'Web Embed', 'Embed on websites', 'web', 1, 'platforms', 8),
('integrations_api', 'integrations', 'API Access', 'REST API access', 'api', 1, 'access', 9),
('integrations_webhook', 'integrations', 'Webhooks', 'Custom webhook integrations', 'webhooks', 5, 'hooks', 10),
('custom_branding', 'customization', 'Custom Branding', 'Remove FlowvVibe branding', 'custom_branding', 1, 'enabled', 11),
('custom_colors', 'customization', 'Custom Colors', 'Customize widget colors', 'colors', 1, 'enabled', 12),
('custom_css', 'customization', 'Custom CSS', 'Add custom CSS styles', 'css', 1, 'enabled', 13),
('deploy_domains', 'deployment', 'Custom Domains', 'Deploy to custom domains', 'domains', 1, 'domains', 14),
('deploy_subdomains', 'deployment', 'Subdomains', 'Use FlowvVibe subdomains', 'subdomains', 3, 'subdomains', 15)
ON CONFLICT (id) DO NOTHING;

-- Seed default purchase tiers
INSERT INTO purchase_tiers (id, name, tier_key, description, price, original_price, period, is_active, is_featured, sort_order) VALUES
('free', 'Free', 'free', 'Perfect for getting started', 0, 0, 'forever', true, false, 1),
('starter', 'Starter', 'starter', 'For small teams', 999, 1999, 'one-time', true, false, 2),
('pro', 'Pro', 'pro', 'Most popular choice', 2499, 4999, 'one-time', true, true, 3),
('enterprise', 'Enterprise', 'enterprise', 'For large organizations', 9999, 19999, 'one-time', true, false, 4)
ON CONFLICT (id) DO NOTHING;

-- Seed tier features (which features are included in which tiers)
INSERT INTO tier_features (tier_id, feature_id, is_included, limit_value) VALUES
-- Free tier
('free', 'chatbot_flows', true, 3),
('free', 'chatbot_messages', true, 50),
('free', 'chatbot_industries', true, 2),
('free', 'chatbot_languages', true, 1),
('free', 'analytics_basic', true, 1),
('free', 'integrations_web', true, 1),
('free', 'custom_branding', false, 0),
('free', 'deploy_domains', false, 0),
-- Starter tier
('starter', 'chatbot_flows', true, 10),
('starter', 'chatbot_messages', true, 500),
('starter', 'chatbot_industries', true, 5),
('starter', 'chatbot_languages', true, 3),
('starter', 'analytics_basic', true, 1),
('starter', 'analytics_advanced', false, 0),
('starter', 'integrations_web', true, 3),
('starter', 'integrations_api', false, 0),
('starter', 'custom_branding', true, 1),
('starter', 'custom_colors', true, 1),
('starter', 'deploy_domains', false, 0),
-- Pro tier
('pro', 'chatbot_flows', true, -1),
('pro', 'chatbot_messages', true, 5000),
('pro', 'chatbot_industries', true, -1),
('pro', 'chatbot_languages', true, 10),
('pro', 'analytics_basic', true, 1),
('pro', 'analytics_advanced', true, 1),
('pro', 'analytics_export', true, 1),
('pro', 'integrations_web', true, 10),
('pro', 'integrations_api', true, 1),
('pro', 'integrations_webhook', true, 10),
('pro', 'custom_branding', true, 1),
('pro', 'custom_colors', true, 1),
('pro', 'custom_css', true, 1),
('pro', 'deploy_domains', true, 1),
('pro', 'deploy_subdomains', true, 5),
-- Enterprise tier
('enterprise', 'chatbot_flows', true, -1),
('enterprise', 'chatbot_messages', true, -1),
('enterprise', 'chatbot_industries', true, -1),
('enterprise', 'chatbot_languages', true, -1),
('enterprise', 'analytics_basic', true, 1),
('enterprise', 'analytics_advanced', true, 1),
('enterprise', 'analytics_export', true, 1),
('enterprise', 'integrations_web', true, -1),
('enterprise', 'integrations_api', true, 1),
('enterprise', 'integrations_webhook', true, -1),
('enterprise', 'custom_branding', true, 1),
('enterprise', 'custom_colors', true, 1),
('enterprise', 'custom_css', true, 1),
('enterprise', 'deploy_domains', true, -1),
('enterprise', 'deploy_subdomains', true, -1)
ON CONFLICT (tier_id, feature_id) DO NOTHING;
