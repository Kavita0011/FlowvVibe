# FlowvVibe - AI Chatbot Builder

A SaaS platform for building AI chatbots with one-time pricing.

## Deployment Guide

### Option 1: Railway (Recommended for Backend)

1. **Database Setup**
   - Create account at [Supabase](https://supabase.com) or [Neon](https://neon.tech)
   - Create new PostgreSQL project
   - Copy connection details

2. **Backend Deployment**
   - Connect your GitHub repo to [Railway](https://railway.app)
   - Add environment variables:
     ```
     PGHOST=your-db-host
     PGPORT=5432
     PGDATABASE=postgres
     PGUSER=postgres
     PGPASSWORD=your-password
     PORT=3001
     ```
   - Railway auto-detects Node.js

3. **Frontend Deployment (Vercel)**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repo
   - Add environment variable:
     ```
     VITE_API_URL=https://your-railway-url.up.railway.app
     ```
   - Deploy!

### Option 2: Render

1. **Database**: Use [Render PostgreSQL](https://render.com/docs/databases)

2. **Backend**:
   - Create Web Service
   - Root directory: `backend`
   - Start command: `node server.js`
   - Add env vars for PostgreSQL

3. **Frontend**:
   - Vercel or Netlify
   - Build command: `npm run build`
   - Output directory: `dist`

### Option 3: Manual VPS

```bash
# Install Node.js 18+, PostgreSQL

# Clone and setup
git clone https://github.com/Kavita0011/FlowvVibe.git
cd FlowvVibe

# Install dependencies
npm install
cd backend && npm install && cd ..

# Setup PostgreSQL
psql -U postgres
CREATE DATABASE flowvibe;
\q
psql -U postgres -d flowvibe -f backend/setup.sql

# Set environment
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=flowvibe
export PGUSER=postgres
export PGPASSWORD=yourpassword

# Start backend
node backend/server.js &

# Build and serve frontend
cd frontend
npm install
npm run build
npx serve -s dist -l 3000
```

## Environment Variables

### Backend (`backend/.env`)
```
PGHOST=localhost
PGPORT=5432
PGDATABASE=flowvibe
PGUSER=postgres
PGPASSWORD=yourpassword
PORT=3001
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:3001
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Zustand, React Flow
- **Backend**: Express.js, PostgreSQL
- **Database**: PostgreSQL
- **Deployment**: Vercel (frontend) + Railway/Render (backend)
