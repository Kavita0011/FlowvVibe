-- FlowVibe Database Setup for Neon
-- Run this in Neon SQL Editor

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. USERS TABLE (Standalone for Neon - no built-in auth)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text,
  avatar_url text,
  company_name text,
  website text,
  location text,
  bio text,
  role text DEFAULT 'user',
  is_active boolean DEFAULT true,
  subscription_tier text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_login_at timestamp with time zone
);

-- 3. PROFILES (Optional - can be merged with users or kept separate)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  display_name text,
  email text,
  avatar_url text,
  company_name text,
  website text,
  location text,
  bio text,
  role text DEFAULT 'user',
  subscription_tier text DEFAULT 'free',
  subscription_status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PRICING & TIERS
CREATE TABLE IF NOT EXISTS public.subscription_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price integer NOT NULL DEFAULT 0,
  original_price integer DEFAULT 0,
  currency text DEFAULT 'INR',
  period text DEFAULT 'one-time',
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Custom Tiers for bulk pricing
CREATE TABLE IF NOT EXISTS public.custom_tiers (
  id text PRIMARY KEY,
  name text NOT NULL,
  min_users integer DEFAULT 1,
  max_users text DEFAULT 'unlimited',
  price_per_user integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. CHATBOTS
CREATE TABLE IF NOT EXISTS public.chatbots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  industry text,
  tone text DEFAULT 'friendly',
  language text DEFAULT 'en',
  welcome_message text,
  flow_data jsonb DEFAULT '{"edges": [], "nodes": []}'::jsonb,
  prd jsonb,
  is_published boolean DEFAULT false,
  channel_configs jsonb DEFAULT '[]'::jsonb,
  views_count integer DEFAULT 0,
  conversations_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id uuid REFERENCES public.chatbots(id) ON DELETE CASCADE,
  visitor_id text,
  visitor_name text,
  visitor_email text,
  session_id text UNIQUE,
  status text DEFAULT 'active',
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  duration_seconds integer,
  rating integer,
  is_resolved boolean DEFAULT false,
  feedback text,
  lead_data jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_type text NOT NULL,
  content text NOT NULL,
  message_type text DEFAULT 'text',
  intent text,
  sentiment text,
  confidence decimal(5,4),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. PAYMENTS & SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  tier_id text REFERENCES public.subscription_tiers(id),
  status text DEFAULT 'active',
  started_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  auto_renew boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.user_subscriptions(id),
  amount integer NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'pending',
  payment_method text,
  transaction_id text UNIQUE,
  razorpay_order_id text,
  razorpay_payment_id text,
  invoice_id text,
  receipt_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 7. LEADS & BOOKINGS
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id uuid REFERENCES public.chatbots(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  name text,
  email text,
  phone text,
  interest text,
  budget text,
  timeline text,
  notes text,
  status text DEFAULT 'new',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id uuid REFERENCES public.chatbots(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text,
  service text,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  notes text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 8. AGENTS & HUMAN HANDOFF
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  online boolean DEFAULT false,
  max_chats integer DEFAULT 5,
  active_chats integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chatbot_id uuid REFERENCES public.chatbots(id) ON DELETE CASCADE,
  customer_id text,
  customer_name text,
  customer_email text,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  status text DEFAULT 'waiting',
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone
);

-- 9. API KEYS
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  api_key text UNIQUE NOT NULL,
  permissions jsonb DEFAULT '["read"]'::jsonb,
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 10. FEATURE ACCESS
CREATE TABLE IF NOT EXISTS public.feature_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  active boolean DEFAULT false,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, feature)
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES (Optional - for Neon, implement at application level instead)
-- Note: Neon is standard PostgreSQL without auth.uid(). Implement authorization in your application layer.
-- Uncomment if you want to use RLS with custom user_id checks:

-- ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chatbots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.feature_access ENABLE ROW LEVEL SECURITY;

-- 12. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON public.users(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON public.profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_chatbots_user_id ON public.chatbots(user_id);
CREATE INDEX IF NOT EXISTS idx_chatbots_is_published ON public.chatbots(is_published);
CREATE INDEX IF NOT EXISTS idx_conversations_chatbot_id ON public.conversations(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_conversations_started_at ON public.conversations(started_at);
CREATE INDEX IF NOT EXISTS idx_conversations_session_id ON public.conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_leads_chatbot_id ON public.leads(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON public.leads(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_chatbot_id ON public.bookings(chatbot_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(api_key);
CREATE INDEX IF NOT EXISTS idx_feature_access_user_id ON public.feature_access(user_id);

-- 13. SEED DATA (Pricing Plans)
INSERT INTO public.subscription_tiers (id, name, price, original_price, period, description, is_featured) VALUES
('free', 'Free', 0, 0, 'forever', 'For testing', false),
('starter', 'Starter', 99900, 199900, 'one-time', 'One-time payment', false),
('pro', 'Pro', 249900, 499900, 'one-time', 'Most popular', true),
('enterprise', 'Enterprise', 999900, 1999900, 'one-time', 'For large teams', false)
ON CONFLICT (id) DO NOTHING;

-- Seed default custom tiers
INSERT INTO public.custom_tiers (id, name, min_users, max_users, price_per_user) VALUES
('starter', 'Starter', 1, '5', 39900),
('team', 'Team', 6, '20', 34900),
('business', 'Business', 21, '50', 29900),
('enterprise', 'Enterprise', 51, 'unlimited', 24900)
ON CONFLICT (id) DO NOTHING;
