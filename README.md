# FlowvVibe - AI Chatbot Builder Platform

## 📋 Project Overview

**Project Name:** FlowvVibe
**Version:** 2.0
**Type:** SaaS Web Application
**Tech Stack:**
- Frontend: React + TypeScript + Vite + Tailwind CSS + Zustand + React Flow
- Backend: Express.js + PostgreSQL + JWT
- Database: PostgreSQL with pgAdmin
- Deployment: Docker

## 🚀 Quick Start

### Development
```bash
# Clone & setup
git clone https://github.com/Kavita0011/FlowvVibe.git
cd FlowvVibe

# Frontend
cd frontend && npm install && npm run dev

# Backend (requires Docker for PostgreSQL)
docker-compose up -d
```

### Production
```bash
docker-compose up -d --build
```

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend  │────▶│ PostgreSQL │
│   (Vite)    │     │  (Express) │     │  Database  │
└─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │
    React Flow        REST API           pgAdmin
    Widget           JWT Auth           (Port 5050)
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

### Premium Add-ons
| Feature | Price | Description |
|---------|-------|-------------|
| Booking System | ₹199/mo | Appointment scheduling |
| Voice Calls | ₹299/mo | Twilio integration |
| Email Marketing | ₹249/mo | SMTP automation |
| Human Handoff | ₹149/mo | Live agent transfer |
| Webhooks/Zapier | ₹199/mo | 5000+ app connections |
| CRM Integration | ₹349/mo | Salesforce/HubSpot |

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

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 5173 | React dev server |
| backend | 3001 | Express API |
| postgres | 5432 | PostgreSQL |
| pgadmin | 5050 | Database admin |
| widget | 3002 | Chat widget |

## 🔧 Environment Variables

### Backend (.env)
```
PORT=3001
DATABASE_URL=postgresql://flowvibe:flowvibe2024@postgres:5432/flowvibe
DB_HOST=localhost
DB_PORT=5432
DB_NAME=flowvibe
DB_USER=postgres
DB_PASSWORD=your-password
JWT_SECRET=flowvibe-jwt-secret-2024
OPENROUTER_API_KEY=
SLACK_BOT_TOKEN=
SLACK_SIGNING_SECRET=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_ID=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

> The frontend communicates with your backend API via `VITE_API_URL`. No Supabase client keys are required in frontend runtime for this project.

## Frontend (.env)
```
VITE_API_URL=http://localhost:3001
```

## 📱 Running the Application

### Option 1: Docker (Recommended)
```bash
docker-compose up -d
# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:3001
# - pgAdmin: http://localhost:5050
```

### Option 2: Manual
```bash
# Terminal 1: PostgreSQL
docker run -p 5432:5432 -e POSTGRES_PASSWORD=flowvibe2024 postgres:16

# Terminal 2: Backend
cd backend && npm install && npm run dev

# Terminal 3: Frontend
cd frontend && npm install && npm run dev
```

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

- Email: support@flowvibe.ai
- Documentation: /guide
- User Guide: https://flowvibe.ai/guide