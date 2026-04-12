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
