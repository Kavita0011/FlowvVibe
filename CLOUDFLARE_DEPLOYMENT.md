# FlowvVibe Deployment Guide

## Complete Setup for Cloudflare (Frontend + Backend)

---

## Overview

This guide covers deploying FlowvVibe on Cloudflare's free tier:
- **Cloudflare Pages** - Frontend hosting (unlimited bandwidth)
- **Cloudflare Workers** - Serverless backend API
- **Supabase** - Database (pricing, users, payments)

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Browser   │────▶│ Cloudflare Pages │────▶│    Supabase     │
│   (Frontend)    │     │   (React App)   │     │   (Database)    │
└─────────────────┘     └────────┬─────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │ Cloudflare      │
                        │ Workers (API)   │
                        └─────────────────┘
```

---

## Prerequisites

1. **GitHub Account** - Code repository
2. **Cloudflare Account** - [dash.cloudflare.com](https://dash.cloudflare.com) (No credit card)
3. **Supabase Account** - [supabase.com](https://supabase.com) (No credit card)

---

## Part 1: Supabase Setup (Database)

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up with GitHub
3. Click **New Project**
4. Settings:
   - Name: `flowvibe-db`
   - Password: `[Strong password]`
   - Region: `ap-south-1` (Mumbai)
5. Click **Create Project**

### 1.2 Get API Keys
1. Go to **Settings** → **API**
2. Copy:
   - **Project URL**: `https://xxxx.supabase.co`
   - **anon public key**: `eyJ...`

### 1.3 Create Database Tables
1. Go to **SQL Editor**
2. Run this SQL:

```sql
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
```

---

## Part 2: Cloudflare Pages Setup (Frontend)

### 2.1 Create Cloudflare Account
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Sign up** (email or Google)
3. **No credit card required!**

### 2.2 Connect GitHub Repository
1. Click **Pages** (left sidebar)
2. Click **Create a project**
3. Select **Connect to Git**
4. Connect your GitHub account
5. Select **`FlowvVibe`** repository

### 2.3 Configure Build Settings
```
Build command: npm run build
Output directory: dist
Root directory: frontend
```

### 2.4 Add Environment Variables
Click **Environment Variables** and add:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` (your Supabase URL) |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (your anon key) |
| `VITE_API_URL` | `https://flowvibe-api.your-subdomain.workers.dev` (after deploying worker) |

### 2.5 Deploy
Click **Save and Deploy**

Your site will be live at: `https://flowvibe.pages.dev`

---

## Part 3: Cloudflare Workers Setup (Backend)

### 3.1 Deploy the Worker
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Click **Workers & Pages**
3. Click **Create application**
4. Select **Create Worker**
5. Name: `flowvibe-api`
6. Click **Deploy**

### 3.2 Configure the Worker
1. Click **Edit code**
2. Copy contents of `backend/worker.js`
3. Paste into the editor
4. Click **Save and Deploy**

### 3.3 Get Worker URL
Your API will be at: `https://flowvibe-api.YOUR_SUBDOMAIN.workers.dev`

### 3.4 Update Environment Variable
Add to Cloudflare Pages environment variables:
```
VITE_API_URL = https://flowvibe-api.your-subdomain.workers.dev
```

---

## Part 4: Update Frontend Code

### 4.1 Update supabase.ts
Edit `frontend/src/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const API_URL = import.meta.env.VITE_API_URL;
```

### 4.2 Push Changes
```bash
git add -A
git commit -m "Update for Cloudflare deployment"
git push origin main
```

Cloudflare will auto-deploy!

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/pricing` | GET | Get all pricing plans |
| `/api/tiers` | GET | Get custom tiers |
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |

---

## Custom Domain (Optional)

### Cloudflare Pages
1. Go to **Pages** → Your project
2. Click **Custom domains**
3. Add your domain
4. Update DNS as instructed

### Cloudflare Worker
1. Go to **Workers & Pages** → Your worker
2. Click **Settings** → **Triggers**
3. Add **Custom Domain**
4. Enter your domain

---

## Future Projects

### Adding New Projects
1. Push project to GitHub
2. Go to Cloudflare Pages
3. Click **Create a project**
4. Connect new repository
5. Each project gets its own subdomain: `project.pages.dev`

### Sharing Across Projects
- Use same Supabase project with different tables
- Or create separate Supabase projects per project

---

## Troubleshooting

### Build Failed
1. Check build logs in Cloudflare dashboard
2. Ensure `npm run build` works locally
3. Verify environment variables are set

### API Not Working
1. Check Worker logs in Cloudflare dashboard
2. Verify CORS headers are set
3. Test endpoint directly in browser

### Database Connection Failed
1. Verify Supabase URL and key
2. Check RLS policies (disable for now)
3. Test connection in Supabase dashboard

---

## Cost Summary

| Service | Free Tier | Cost |
|---------|-----------|------|
| Cloudflare Pages | Unlimited bandwidth | FREE |
| Cloudflare Workers | 100,000 requests/day | FREE |
| Supabase | 500MB database | FREE |
| Custom Domain | SSL included | FREE |

**Total: $0/month forever!**

---

## Support

- Cloudflare Docs: [developers.cloudflare.com](https://developers.cloudflare.com)
- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- FlowvVibe Issues: GitHub Issues
