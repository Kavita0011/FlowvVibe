# FlowvVibe - AI Chatbot Builder Platform

## 📋 Project Overview

**Project Name:** FlowvVibe
**Version:** 2.0
**Type:** SaaS Web Application
**Tech Stack:**
- Frontend: React + TypeScript + Vite + Tailwind CSS + Zustand + React Flow
- Backend: Cloudflare Workers (Edge Functions)
- Database: Neon PostgreSQL
- Hosting: Cloudflare Pages + Workers

## 🚀 Quick Start

### Development
```bash
# Clone & setup
git clone https://github.com/Kavita0011/FlowvVibe.git
cd FlowvVibe

# Frontend
cd frontend && npm install && npm run dev

# Backend (Cloudflare Workers)
cd backend && npx wrangler dev
```

### Production
```bash
# Deploy to Cloudflare
npm run deploy
```

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│   Neon DB   │
│  (Pages)    │     │  (Workers)  │     │ PostgreSQL │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
  React Flow        REST API           Edge Caching
  Widget           JWT Auth           Rate Limiting
```

## 📦 Features

### Core Features
- [x] User Authentication (Register/Login/JWT)
- [x] Chatbot Builder (Drag & Drop Flow)
- [x] PRD Builder (Product Requirements)
- [x] NLP Training (Intent Management)
- [x] Analytics Dashboard
- [x] Live Chat Widget
- [x] Embed Code Generator
- [x] Invoice Generation

### Security Features
- [x] Rate Limiting (enterprise-grade)
- [x] Input Validation & Sanitization
- [x] Session Tokens
- [x] Security Headers (CSP, HSTS, X-Frame-Options)
- [x] Password Hashing (bcrypt)
- [x] Admin Approval Workflow

### Premium Add-ons
| Feature | Price | Description |
|---------|-------|-------------|
| Booking System | ₹499/mo | Appointment scheduling |
| Email Marketing | ₹599/mo | SMTP automation |
| Human Handoff | ₹349/mo | Live agent transfer |
| Webhooks/Zapier | ₹499/mo | 5000+ app connections |
| CRM Integration | ₹799/mo | Salesforce/HubSpot |

### Integrations
- Slack (OAuth)
- WhatsApp Business API
- Salesforce
- HubSpot
- Zapier
- Custom Webhooks

## 📄 Pages

| Route | Description |
|-------|-------------|
| / | Landing Page |
| /login | User Login |
| /register | User Registration |
| /pricing | Plans & Add-ons |
| /dashboard | User Dashboard |
| /prd | PRD Builder |
| /flow | Flow Builder |
| /preview | Chat Preview |
| /analytics | Analytics |
| /integrations | Channel Setup |
| /nlp | NLP Training |
| /embed | Widget Generator |
| /credentials | Client Credentials |
| /guide | User Guide |
| /invoice | Invoice Generator |
| /admin | Admin Panel |
| /admin/settings | Admin Settings |

## 🗄️ Database Schema

### Tables
- users - User accounts
- chatbots - User chatbots
- bookings - Appointment bookings
- payments - Payment records
- leads - Lead data
- conversations - Chat sessions
- messages - Chat messages
- feature_access - Premium feature access

## 🔑 API Endpoints

### Authentication
- POST /api/auth/register - Register new user
- POST /api/auth/login - Login
- GET /api/auth/verify - Verify token

### Chatbots
- GET /api/chatbots - List user chatbots
- POST /api/chatbots - Create chatbot
- PUT /api/chatbots/:id - Update chatbot
- DELETE /api/chatbots/:id - Delete chatbot
- POST /api/chat/:chatbotId - Send message

### Analytics
- GET /api/dashboard/stats - Dashboard stats
- GET /api/conversations - Chat history
- GET /api/leads - Lead data

### Integrations
- POST /api/webhooks/custom - Custom webhook
- POST /api/slack/events - Slack events
- POST /api/whatsapp/webhook - WhatsApp events

## 🔐 Environment Variables

### Backend (wrangler.toml / Cloudflare Secrets)
```
DATABASE_URL=postgresql://user:password@host/database
JWT_SECRET=your-jwt-secret
ADMIN_EMAIL=admin@flowvibe.ai
```

### Frontend (.env)
```
VITE_API_URL=https://your-worker.workers.dev
```

> **Note:** All credentials are stored in Cloudflare Secrets, never hardcoded.

## 🔒 Security Specifications

### Rate Limiting
- Login: 5 requests/minute
- Register: 3 requests/minute
- API: 100 requests/minute
- Payment: 10 requests/minute

### Input Validation
- Email format validation
- Password strength requirements
- SQL injection prevention
- XSS protection

### Headers
- Content-Security-Policy
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

## 💰 Payment System

### Workflow
1. User selects plan → Payment page
2. UPI/Bank transfer → Submit UTR
3. **Pending** status → Awaiting admin approval
4. Admin verifies payment → Approves/Rejects
5. Approved → User access activated
6. Invoice generated → Download

### Admin Approval Required
All payments require manual admin approval before activation. This prevents:
- Fraudulent payments
- Duplicate activations
- Incorrect UTR submissions

## 📱 Contact

**Email Only:** devappkavita@gmail.com

> Phone numbers have been removed from all forms. Email is the primary contact method.

## 🚀 Deployment

### Cloudflare (Recommended)
```bash
# Frontend: Cloudflare Pages
# - Unlimited bandwidth
# - Free SSL
# - Custom domains
# - Auto-deploy from GitHub

# Backend: Cloudflare Workers
# - 100K requests/day free
# - Edge computing
# - Global CDN

# Database: Neon PostgreSQL
# - Free tier available
# - PostgreSQL compatible
```

### Access Points
- Frontend: https://flowvibe.pages.dev
- API: https://flowvibe.workers.dev
- Database: Neon console

## 📊 User Guide Links

- Quick Start: /guide#quickstart
- Flow Builder: /guide#flowbuilder
- NLP Training: /guide#nlp
- Integrations: /guide#integrations
- Analytics: /guide#analytics
- FAQ: /guide#faq

## 📄 License

MIT License - See LICENSE file

## 🤝 Support

- Email: devappkavita@gmail.com
- Documentation: /guide
- User Guide: https://flowvibe.ai/guide