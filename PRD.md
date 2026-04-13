# FlowvVibe - Product Requirements Document (PRD)

## Version 2.0
**Launch Date:** April 2026
**Status:** Production Ready (Cloudflare Deployment)

---

## 🎯 Vision & Mission

**Vision:** Make AI chatbot building accessible to everyone without coding knowledge.

**Mission:** Empower businesses to create, deploy, and manage AI chatbots through an intuitive drag-and-drop interface with affordable one-time pricing.

---

## 👥 Target Audience

### Primary Users
1. Small Business Owners - E-commerce, retail, services
2. Startups - Customer support automation
3. Marketing Agencies - Client chatbot projects
4. Freelancers - Chatbot development services

### User Demographics
- Age: 22-45 years
- Tech-savvy: Basic to Intermediate
- Industry: Any (e-commerce, healthcare, education, real estate)

---

## 🏆 Competitive Analysis

### Comparison Table
| Feature | FlowvVibe | Botpress | Voiceflow | Tidio | Chatbase | Dialogflow |
|---------|-----------|----------|-----------|-------|----------|------------|
| **Pricing** | ₹0-9999/lifetime | $99/mo | $50-500/mo | $39-199/mo | $99/mo | $60-180/mo |
| One-time Pricing | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Indian Payment | ✅ UPI/Bank | ❌ | ❌ | ❌ | ❌ | ❌ |
| Free Plan | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Visual Builder | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| AI Integration | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export Widget | ✅ Pro+ | ❌ | ❌ | ❌ | ❌ | ❌ |

### Our Differentiation
1. **Indian Market Focus** - INR pricing, UPI/Bank transfer support
2. **One-Time Payment** - No monthly subscriptions
3. **Generous Free Tier** - 50 conversations free
4. **Premium Add-ons** - Pay for what you use
5. **Easy Deployment** - Export widget for any website

---

## 💰 Pricing Structure

### Plans (One-Time Payment)

| Plan | Price | Features |
|------|-------|----------|
| **Free** | ₹0 | 1 Chatbot, 50 Conversations, Basic Widget, All Flow Features |
| **Starter** | ₹999 | 2 Chatbots, 500 Conversations, Premium Widget, Slack Integration |
| **Pro** | ₹2,499 | 5 Chatbots, Unlimited Conversations, All Channels, Advanced Analytics, Export Widget |
| **Enterprise** | ₹9,999 | Unlimited Chatbots, Custom Integrations, Dedicated Support, SLA Guarantee |

### Premium Add-ons

| Add-on | Price | Features |
|--------|-------|----------|
| Booking System | ₹499 | Multiple services, Time slots, Email confirmations, Calendar sync |
| Voice Calls | ₹699 | Twilio integration, Call forwarding, Voicemail, Call recording |
| Email Marketing | ₹599 | SMTP integration, Email templates, Automated sequences |
| Human Handoff | ₹349 | Agent dashboard, Chat routing, Canned responses |
| Webhooks & Zapier | ₹499 | Zapier integration, Custom webhooks, 300+ apps |
| CRM Integration | ₹799 | Salesforce sync, HubSpot integration, Custom CRM |

---

## ⚙️ Technical Architecture

### Frontend Stack
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| TailwindCSS | Styling |
| Zustand | State Management |
| React Flow | Visual Flow Builder |
| Supabase | Database & Auth |
| Cloudflare Pages | Hosting |

### Backend Stack
| Technology | Purpose |
|------------|---------|
| Cloudflare Workers | Serverless API |
| Supabase | PostgreSQL Database |
| KV Storage | Caching |

### Deployment Architecture
```
Frontend: Cloudflare Pages (Free, Unlimited bandwidth)
Backend API: Cloudflare Workers (Free, 100K req/day)
Database: Supabase (Free, 500MB)
Total Cost: $0/month
```

---

## 🔧 Core Features

### 4.1 User Authentication
- Email/password registration and login
- Demo accounts for testing
- Admin access for management
- Session persistence

### 4.2 PRD Builder
- Company name input
- Industry selection (8+ templates)
- Services management
- Target audience specification
- Tone selection (Formal/Friendly/Professional/Casual)
- FAQ builder with AI suggestions
- Escalation rules configuration
- AI-powered flow generation

### 4.3 Visual Flow Builder
| Node Type | Category | Availability |
|-----------|----------|---------------|
| Start | Core | Free |
| AI Response | AI/ML | Free |
| Intent Detection | AI/ML | Free |
| Text Input | Input | Free |
| Yes/No Input | Input | Free |
| Choice Input | Input | Free |
| Email Input | Input | Free |
| Phone Input | Input | Free |
| Condition | Logic | Free |
| Branch | Logic | Free |
| Delay | Logic | Free |
| Collect Feedback | Feedback | Free |
| Rating | Feedback | Free |
| Booking | Premium | Pro+ |
| Make Call | Premium | Pro+ |
| Human Handoff | Premium | Pro+ |
| Zapier | Premium | Pro+ |
| CRM Update | Premium | Pro+ |

### 4.4 Chat Preview
- Live chatbot testing
- Conversation simulation
- Lead collection display
- End chat functionality

### 4.5 Payment System
- Card payment (simulated)
- UPI payment with QR code
- Bank transfer with account details (SBI)
- UTR verification
- Invoice generation and download
- Payment history

---

## 👨‍💼 Admin Features

### 5.1 User Management
- View all users
- Enable/Disable users
- Delete users
- User search
- Subscription status tracking

### 5.2 Pricing Management
- Edit pricing plans
- Set sale reasons (Diwali, Holi, Eid, Christmas, New Year, etc.)
- Add/Edit/Delete plans
- Custom tiers configuration
- Real-time database sync with Supabase

### 5.3 Payment Management
- View all payments
- Payment status (completed/pending/failed/refunded)
- Refund processing
- Transaction history

### 5.4 Analytics Dashboard
- Total users
- Active chatbots
- Total conversations
- Revenue tracking
- Popular templates

---

## 🔒 Security Specifications

### Authentication
- Password validation
- JWT tokens for API authentication
- Demo mode for testing
- Session persistence

### Authorization
- Role-based access (user/admin)
- Plan-based feature gating
- Premium node restrictions

### Data Protection
- HTTPS only
- CORS headers configured
- Input validation
- XSS prevention

---

## 📜 Legal Policies

### Refund Policy
- **No refunds** after 7 days of purchase
- Users must report issues within 7 days
- Review period: 7 days from purchase date
- Refund approval at admin discretion within window

### Privacy Policy
- Data collection transparency
- User consent required
- Data deletion on request
- GDPR compliant

### Terms of Service
- User responsibilities
- Service limitations
- Liability clauses
- Dispute resolution

---

## 🚀 Roadmap

### Phase 1: MVP (Completed) ✅
- [x] User registration/login
- [x] PRD Builder
- [x] Visual Flow Builder
- [x] Chat Preview
- [x] Pricing page
- [x] Payment gateway
- [x] Admin dashboard
- [x] Cloudflare deployment

### Phase 2: Enhanced Features (Q2 2026)
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] A/B testing for flows
- [ ] Template marketplace
- [ ] Mobile app

### Phase 3: Scale (Q3-Q4 2026)
- [ ] WhatsApp integration
- [ ] Telegram integration
- [ ] Slack integration
- [ ] API access for developers
- [ ] White-label solution

---

## 📊 Success Metrics

### Key Performance Indicators
| Metric | Target (Month 1) | Target (Year 1) |
|--------|------------------|----------------|
| Registered Users | 100 | 10,000 |
| Active Chatbots | 50 | 5,000 |
| Paid Customers | 10 | 500 |
| Monthly Revenue | ₹10,000 | ₹200,000 |
| Customer Satisfaction | 4.5/5 | 4.8/5 |

---

## 🌐 Deployment Guide

### Free Hosting (Cloudflare + Supabase)

**Frontend:** Cloudflare Pages
- Unlimited bandwidth
- Free SSL
- Custom domains
- Auto-deploy from GitHub

**Backend:** Cloudflare Workers
- 100,000 requests/day free
- Edge computing
- Global CDN

**Database:** Supabase
- 500MB free
- PostgreSQL
- Auto backups

**Total Cost:** $0/month forever

### Setup Links
- Cloudflare: https://dash.cloudflare.com
- Supabase: https://supabase.com
- GitHub: https://github.com/Kavita0011/FlowvVibe

---

## 👤 Team

**Developer:** Kavita
**Email:** devappkavita@gmail.com
**Website:** flowvibe.pages.dev

---

## 📚 Documentation

- [Cloudflare Deployment Guide] (./CLOUDFLARE_DEPLOYMENT.md)
- [API Documentation] (./backend/worker.js)
- [Database Schema] (./supabase-setup.sql)

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Initial | MVP features |
| 2.0 | April 2026 | Cloudflare deployment, enhanced features |

---

**Document Status:** Active
**Last Updated:** April 2026
**Owner:** Kavita
