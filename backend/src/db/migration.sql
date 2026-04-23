-- Flowvibe Migration: Add missing fields and features
-- Run this on existing databases to add new functionality

-- 1. Add is_approved to chatbots
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS approval_notes TEXT;
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES profiles(id);
ALTER TABLE chatbots ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;

-- 2. Add subscription_tier to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'free';

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_chatbots_approved ON chatbots(is_approved);
CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(subscription_tier);

-- 4. Add missing payment fields
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'upi';

-- 5. Create activity_logs table if not exists
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB DEFAULT '{}',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- 6. Update existing free tier users (if they have subscriptions)
UPDATE profiles SET subscription_tier = 'free'
WHERE subscription_tier IS NULL
AND id IN (SELECT user_id FROM user_subscriptions WHERE tier_id = 'free');

-- 7. Set is_approved = true for existing published chatbots
UPDATE chatbots SET is_approved = true WHERE is_published = true;

PRINT 'Migration completed successfully!';