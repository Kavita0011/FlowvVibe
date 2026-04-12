-- FlowvVibe Database Schema for Supabase
-- Version: 2.0

-- ============================================
-- SUBSCRIPTION TIERS
-- ============================================
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
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

-- ============================================
-- SERVICES (Feature Categories)
-- ============================================
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_key VARCHAR(50) UNIQUE NOT NULL,
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

-- ============================================
-- FEATURES
-- ============================================
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key VARCHAR(50) UNIQUE NOT NULL,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    limit_value INTEGER,
    limit_unit VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TIER FEATURES (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS tier_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_id UUID REFERENCES subscription_tiers(id) ON DELETE CASCADE,
    feature_id UUID REFERENCES features(id) ON DELETE CASCADE,
    is_included BOOLEAN DEFAULT true,
    custom_limit INTEGER,
    UNIQUE(tier_id, feature_id)
);

-- ============================================
-- USERS (Profiles linked to Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    avatar_url TEXT,
    company_name VARCHAR(255),
    website VARCHAR(255),
    location VARCHAR(255),
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USER SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tier_id UUID REFERENCES subscription_tiers(id),
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    auto_renew BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id),
    amount INTEGER NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    transaction_id VARCHAR(100),
    invoice_id VARCHAR(100),
    receipt_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CUSTOM TIERS (Team/Pricing)
-- ============================================
CREATE TABLE IF NOT EXISTS custom_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    min_users INTEGER DEFAULT 1,
    max_users INTEGER DEFAULT NULL,
    price_per_user INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- ADMIN USERS
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '[]',
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- ============================================
-- CHATBOTS
-- ============================================
CREATE TABLE IF NOT EXISTS chatbots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    industry VARCHAR(100),
    business_type VARCHAR(100),
    target_audience TEXT,
    tone VARCHAR(50) DEFAULT 'friendly',
    language VARCHAR(20) DEFAULT 'en',
    welcome_message TEXT,
    flow_data JSONB DEFAULT '{"nodes":[],"edges":[]}',
    settings JSONB DEFAULT '{}',
    is_published BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    published_at TIMESTAMP,
    views_count INTEGER DEFAULT 0,
    conversations_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CHATBOT CHANNELS
-- ============================================
CREATE TABLE IF NOT EXISTS chatbot_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
    channel_type VARCHAR(50) NOT NULL,
    channel_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- CONVERSATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES chatbots(id) ON DELETE CASCADE,
    visitor_id VARCHAR(255),
    visitor_name VARCHAR(100),
    visitor_email VARCHAR(255),
    session_data JSONB DEFAULT '{}',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP,
    duration_seconds INTEGER,
    rating INTEGER,
    feedback TEXT,
    is_resolved BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- API KEYS
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    permissions JSONB DEFAULT '["read"]',
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USER ACTIVITY LOG
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_is_published ON chatbots(is_published);
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON conversations(started_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- ============================================
-- TRIGGER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_chatbots_updated_at BEFORE UPDATE ON chatbots FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON subscription_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON features FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_custom_tiers_updated_at BEFORE UPDATE ON custom_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbots ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_tiers ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update only their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Chatbots: Users can CRUD their own
CREATE POLICY "Users can view own chatbots" ON chatbots FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chatbots" ON chatbots FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chatbots" ON chatbots FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chatbots" ON chatbots FOR DELETE USING (auth.uid() = user_id);

-- Conversations: Users can access their chatbot conversations
CREATE POLICY "Users can view chatbot conversations" ON conversations FOR SELECT USING (
    EXISTS (SELECT 1 FROM chatbots WHERE id = conversations.chatbot_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert conversations" ON conversations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chatbots WHERE id = chatbot_id AND user_id = auth.uid())
);

-- Messages: Users can access through their chatbots
CREATE POLICY "Users can view messages" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM conversations c
        JOIN chatbots b ON c.chatbot_id = b.id
        WHERE c.id = messages.conversation_id AND b.user_id = auth.uid()
    )
);
CREATE POLICY "Users can insert messages" ON messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM conversations c
        JOIN chatbots b ON c.chatbot_id = b.id
        WHERE c.id = conversation_id AND b.user_id = auth.uid()
    )
);

-- Subscription tiers, services, features: Public read
CREATE POLICY "Anyone can view subscription tiers" ON subscription_tiers FOR SELECT USING (true);
CREATE POLICY "Anyone can view services" ON services FOR SELECT USING (true);
CREATE POLICY "Anyone can view features" ON features FOR SELECT USING (true);
CREATE POLICY "Anyone can view custom tiers" ON custom_tiers FOR SELECT USING (true);

-- ============================================
-- SEED DATA: Subscription Tiers
-- ============================================
INSERT INTO subscription_tiers (tier_key, name, description, price, original_price, period, is_featured, sort_order) VALUES
('free', 'Free', 'Perfect for getting started', 0, 0, 'forever', false, 1),
('starter', 'Starter', 'For small teams and startups', 999, 1999, 'one-time', false, 2),
('pro', 'Pro', 'Most popular choice for growing businesses', 2499, 4999, 'one-time', true, 3),
('enterprise', 'Enterprise', 'For large organizations', 9999, 19999, 'one-time', false, 4)
ON CONFLICT (tier_key) DO NOTHING;

-- ============================================
-- SEED DATA: Services
-- ============================================
INSERT INTO services (service_key, name, slug, description, icon, category, sort_order) VALUES
('chatbot', 'AI Chatbot Builder', 'chatbot-builder', 'Build intelligent chatbots with visual flow builder', 'bot', 'core', 1),
('analytics', 'Analytics Dashboard', 'analytics', 'Track conversations and user engagement', 'chart', 'core', 2),
('integrations', 'Integrations', 'integrations', 'Connect with your favorite tools', 'plug', 'core', 3),
('customization', 'Customization', 'customization', 'Customize chatbot appearance and behavior', 'palette', 'core', 4),
('deployment', 'Deployment', 'deployment', 'Deploy to multiple platforms', 'rocket', 'core', 5)
ON CONFLICT (service_key) DO NOTHING;

-- ============================================
-- SEED DATA: Features
-- ============================================
INSERT INTO features (feature_key, service_id, name, description, limit_value, limit_unit, sort_order) VALUES
('chatbot_flows', (SELECT id FROM services WHERE service_key='chatbot'), 'Bot Flows', 'Create unlimited conversation flows', -1, 'unlimited', 1),
('chatbot_messages', (SELECT id FROM services WHERE service_key='chatbot'), 'Monthly Messages', 'Messages per month', 100, 'monthly', 2),
('chatbot_industries', (SELECT id FROM services WHERE service_key='chatbot'), 'Industry Templates', 'Pre-built industry templates', 10, 'templates', 3),
('chatbot_languages', (SELECT id FROM services WHERE service_key='chatbot'), 'Languages', 'Supported languages', 5, 'languages', 4),
('analytics_basic', (SELECT id FROM services WHERE service_key='analytics'), 'Basic Analytics', 'View basic conversation stats', 1, 'dashboard', 5),
('analytics_advanced', (SELECT id FROM services WHERE service_key='analytics'), 'Advanced Analytics', 'Deep insights and trends', 1, 'dashboard', 6),
('analytics_export', (SELECT id FROM services WHERE service_key='analytics'), 'Data Export', 'Export analytics data', 1, 'formats', 7),
('integrations_web', (SELECT id FROM services WHERE service_key='integrations'), 'Web Embed', 'Embed on websites', 1, 'platforms', 8),
('integrations_api', (SELECT id FROM services WHERE service_key='integrations'), 'API Access', 'REST API access', 1, 'access', 9),
('integrations_webhook', (SELECT id FROM services WHERE service_key='integrations'), 'Webhooks', 'Custom webhook integrations', 5, 'hooks', 10),
('custom_branding', (SELECT id FROM services WHERE service_key='customization'), 'Custom Branding', 'Remove FlowvVibe branding', 1, 'enabled', 11),
('custom_colors', (SELECT id FROM services WHERE service_key='customization'), 'Custom Colors', 'Customize widget colors', 1, 'enabled', 12),
('custom_css', (SELECT id FROM services WHERE service_key='customization'), 'Custom CSS', 'Add custom CSS styles', 1, 'enabled', 13),
('deploy_domains', (SELECT id FROM services WHERE service_key='deployment'), 'Custom Domains', 'Deploy to custom domains', 1, 'domains', 14),
('deploy_subdomains', (SELECT id FROM services WHERE service_key='deployment'), 'Subdomains', 'Use FlowvVibe subdomains', 3, 'subdomains', 15)
ON CONFLICT (feature_key) DO NOTHING;

-- ============================================
-- SEED DATA: Tier Features
-- ============================================
INSERT INTO tier_features (tier_id, feature_id, is_included, custom_limit)
SELECT 
    st.id,
    f.id,
    CASE 
        WHEN st.tier_key = 'free' AND f.feature_key IN ('chatbot_flows', 'chatbot_messages', 'chatbot_industries', 'chatbot_languages', 'analytics_basic', 'integrations_web') THEN true
        WHEN st.tier_key = 'starter' AND f.feature_key IN ('chatbot_flows', 'chatbot_messages', 'chatbot_industries', 'chatbot_languages', 'analytics_basic', 'integrations_web', 'custom_branding', 'custom_colors') THEN true
        WHEN st.tier_key = 'pro' THEN true
        WHEN st.tier_key = 'enterprise' THEN true
        ELSE false
    END,
    CASE 
        WHEN f.feature_key = 'chatbot_flows' AND st.tier_key = 'free' THEN 3
        WHEN f.feature_key = 'chatbot_flows' AND st.tier_key = 'starter' THEN 10
        WHEN f.feature_key = 'chatbot_flows' AND st.tier_key IN ('pro', 'enterprise') THEN -1
        WHEN f.feature_key = 'chatbot_messages' AND st.tier_key = 'free' THEN 50
        WHEN f.feature_key = 'chatbot_messages' AND st.tier_key = 'starter' THEN 500
        WHEN f.feature_key = 'chatbot_messages' AND st.tier_key = 'pro' THEN 5000
        WHEN f.feature_key = 'chatbot_messages' AND st.tier_key = 'enterprise' THEN -1
        WHEN f.feature_key = 'chatbot_industries' AND st.tier_key = 'free' THEN 2
        WHEN f.feature_key = 'chatbot_industries' AND st.tier_key = 'starter' THEN 5
        WHEN f.feature_key = 'chatbot_industries' AND st.tier_key IN ('pro', 'enterprise') THEN -1
        WHEN f.feature_key = 'chatbot_languages' AND st.tier_key = 'free' THEN 1
        WHEN f.feature_key = 'chatbot_languages' AND st.tier_key = 'starter' THEN 3
        WHEN f.feature_key = 'chatbot_languages' AND st.tier_key = 'pro' THEN 10
        WHEN f.feature_key = 'chatbot_languages' AND st.tier_key = 'enterprise' THEN -1
        WHEN f.feature_key = 'integrations_web' AND st.tier_key = 'free' THEN 1
        WHEN f.feature_key = 'integrations_web' AND st.tier_key = 'starter' THEN 3
        WHEN f.feature_key = 'integrations_web' AND st.tier_key = 'pro' THEN 10
        WHEN f.feature_key = 'integrations_web' AND st.tier_key = 'enterprise' THEN -1
        WHEN f.feature_key = 'integrations_webhook' AND st.tier_key = 'pro' THEN 10
        WHEN f.feature_key = 'integrations_webhook' AND st.tier_key = 'enterprise' THEN -1
        WHEN f.feature_key = 'deploy_subdomains' AND st.tier_key = 'pro' THEN 5
        WHEN f.feature_key = 'deploy_subdomains' AND st.tier_key = 'enterprise' THEN -1
        ELSE NULL
    END
FROM subscription_tiers st
CROSS JOIN features f
ON CONFLICT (tier_id, feature_id) DO NOTHING;

-- ============================================
-- SEED DATA: Custom Tiers
-- ============================================
INSERT INTO custom_tiers (tier_key, name, min_users, max_users, price_per_user) VALUES
('team', 'Team', 6, 20, 349),
('business', 'Business', 21, 50, 299),
('enterprise_custom', 'Enterprise Custom', 51, NULL, 249)
ON CONFLICT (tier_key) DO NOTHING;
