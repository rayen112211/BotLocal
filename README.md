# BotLocal - AI-Powered WhatsApp Chatbot for Local Businesses

## 🎯 Project Goal
Provide local businesses with an intelligent, automated WhatsApp customer service agent that automates routine inquiries, handles appointment bookings, and ingests business knowledge from websites - freeing staff and providing 24/7 instant responses.

## 🏗️ Architecture

```
BotLocal/
├── backend/              # Node.js + Express + Prisma
│   ├── src/
│   │   ├── index.ts     # Server entry point
│   │   ├── routes/      # API routes
│   │   ├── controllers/ # Business logic
│   │   ├── middleware/  # Auth, error handling
│   │   └── services/    # AI, WhatsApp, etc
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── seed.ts          # Test data
│
└── frontend/             # React + TypeScript + Vite
    ├── src/
    │   ├── pages/       # Page components
    │   ├── components/  # Reusable UI components
    │   ├── hooks/       # Custom React hooks
    │   ├── lib/         # Utilities & helpers
    │   └── main.tsx     # Entry point
    └── public/          # Static assets
```

## 🛠️ Tech Stack

### Backend
- **Framework:** Node.js + Express
- **Database:** Prisma ORM + PostgreSQL
- **Auth:** JWT + bcryptjs
- **AI:** Groq (free) + Hugging Face + LangChain
- **WhatsApp:** Twilio API
- **Web Scraping:** Cheerio
- **Validation:** Zod

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Components:** shadcn/ui
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios + React Query
- **Routing:** React Router DOM
- **Forms:** React Hook Form
- **Icons:** Lucide Icons

## 📦 Free Services Used

- **AI/LLM:** Groq (free tier - unlimited requests)
- **Database:** SQLite (local, free)
- **WhatsApp:** Twilio (free trial)
- **Hosting:** Railway/Render/Fly.io (free tier)

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ 
- npm or yarn

### 1️⃣ Backend Setup
```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Backend runs on: **http://localhost:3001**

Test Account:
- Email: `admin@botlocal.com`
- Password: `password123`

### 2️⃣ Frontend Setup
```bash
# from the project root
npm install
npm run dev
```

Frontend runs on: **http://localhost:8080**

### 3️⃣ Access the App
Navigate to `http://localhost:8080` and log in with test credentials above.

## 🔑 Getting Free API Keys

### Groq (Free AI)
1. Go to https://console.groq.com
2. Sign up (free)
3. Create API key
4. Add to `.env`: `GROQ_API_KEY=xxx`

### Twilio (WhatsApp - Free Trial)
1. Go to https://www.twilio.com/console
2. Sign up with phone number
3. Get Account SID & Auth Token
4. Verify sandbox number
5. Add to `.env`: `TWILIO_ACCOUNT_SID=xxx` etc

### Hugging Face (Free Models)
1. Go to https://huggingface.co
2. Sign up free
3. Create API token
4. Add to `.env`: `HUGGING_FACE_API_KEY=xxx`

## 🧠 How it Works (Technical Deep Dive)

One of the most powerful features of BotLocal is its **Multi-Tenant Architecture**. This allows one backend server to handle hundreds of different businesses simultaneously without their data or conversations overlapping.

### 1. Data Isolation (Multi-Tenancy)
- Each user (Business Owner) has a unique account with their own email and password.
- In the database, every `Conversation`, `Booking`, and `KnowledgeBase` entry is strictly tied to a `businessId`.
- When a business owner logs into the dashboard, the system only fetches and displays data that matches their specific `businessId`.

### 2. WhatsApp Routing (The "Same Number" Question)
How can multiple businesses use WhatsApp without getting mixed up?

- **Production Mode:** In a real-world scenario, each business registers their own unique WhatsApp-enabled phone number with Twilio. The backend stores this in the `twilioPhone` field. When a message arrives at the webhook, our system looks at the `To` field (the number the customer messaged) and finds the corresponding Business in our database instantly.
- **Sandbox Mode:** For testing purposes, businesses often share a Twilio "Sandbox" number. Our system handles this by providing a fallback to the first available business, ensuring your testing always works even before you buy a production number.

### 3. Industry-Specific Brains
Even if two businesses work in the same field, their bots will sound different because:
- **Knowledge Base**: Each bot is "trained" on a specific business website URL using our recursive "Magic Scanner."
- **Industry IQ**: The AI system prompt dynamically injects specialized rules based on whether the business is a Restaurant, a Dental Clinic, etc.
- **Personality Tuning**: You can choose if your bot should be "Friendly," "Professional," or "Concise."

---

## 📋 Project Features

### ✅ Currently Implemented & Verified
- **Magic Onboarding**: Multi-step flow with industry selection and personality tuning.
- **Recursive Website Scanner**: "Magic Scan" that learns from multiple pages of a business site.
- **Unified Inbox**: Real-time monitoring of all WhatsApp chats in one dashboard.
- **Human Takeover**: One-click toggle to pause the AI and take over a conversation manually.
- **AI Booking Engine**: Automatic extraction of dates and times from chats to create bookings.
- **Managed Usage Limits**: Tracks message counts and plan limits (e.g., 500/mo) for each user.
- **Multi-tenant Backend**: Secure JWT authentication and data isolation.
- **Stripe-Ready Billing**: Interface and logic ready for subscription management.

### 📅 Next Steps
1. Deploy to production (AWS/Railway/Vercel)
2. Connect real Stripe keys for live payments
3. Buy unique Twilio WhatsApp numbers for each business
4. Add SMS fallback for customers without WhatsApp

## 🗂️ Project Structure Details

### Backend Routes (implemented)
```
POST   /api/auth/signup             - Create account
POST   /api/auth/login              - Login

GET    /api/dashboard/:businessId   - Get business metrics

GET    /api/conversations/:businessId                  - List conversations
GET    /api/conversations/:businessId/:customerPhone   - Full history
PATCH  /api/conversations/toggle-ai                    - Toggle AI for a conversation

GET    /api/bookings                - List bookings for current business
POST   /api/bookings                - Create booking
GET    /api/bookings/:id            - Get single booking
PUT    /api/bookings/:id            - Update booking
DELETE /api/bookings/:id            - Delete booking
PATCH  /api/bookings/:id/status     - Update booking status
POST   /api/bookings/:id/send-review - Send review request flag

GET    /api/scanner                 - List knowledge base entries
POST   /api/scanner/scan            - Scan website and ingest content
GET    /api/scanner/:id             - Get entry content
PUT    /api/scanner/:id             - Update content
DELETE /api/scanner/:id             - Delete entry
POST   /api/scanner/:id/rescan      - Rescan website

POST   /api/whatsapp/webhook        - Receive WhatsApp messages (Twilio)

POST   /api/stripe/create-checkout-session - Start Stripe subscription checkout
POST   /api/stripe/webhook          - Stripe webhooks (server-to-server)

GET    /api/business                - Get current business info (from JWT)
PATCH  /api/business                - Update current business info
```

### Frontend Pages (to be created)
```
/                 - Dashboard/Home
/login            - Login page
/signup           - Sign up page
/conversations    - Chat history
/bookings         - Appointment management
/knowledge-base   - Upload business knowledge
/settings         - Business settings
/billing          - Payment & subscription
```

## 🔒 Security

- ✅ JWT token-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Protected routes & data isolation
- ✅ CORS enabled
- ✅ Global rate limiting
- ✅ Input validation with Zod on critical routes

## 📝 Environment Variables

Create `.env` in backend folder (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for tokens (required)
- `GROQ_API_KEY` - AI model access
- `TWILIO_*` - WhatsApp integration
- `HUGGING_FACE_API_KEY` - Alternative AI
- `STRIPE_SECRET_KEY` - Payments (optional in dev)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook verification
- `FRONTEND_URL` - Deployed frontend origin (for Stripe redirects & CORS)

For production deployment and a full list of env vars, see `LAUNCH_CHECKLIST.md` and `DEPLOYMENT.md`.

## 📚 Database Schema

```prisma
model Business {
  id          String @id @default(cuid())
  email       String @unique
  password    String
  name        String
  phone       String?
  plan        String  // Starter, Pro, Enterprise
  messageCount Int @default(0)
  conversations Conversation[]
  bookings    Booking[]
  knowledgeBase KnowledgeBase[]
}

model Conversation {
  id      String @id @default(cuid())
  businessId String
  business Business @relation(fields: [businessId], references: [id])
  messages Message[]
}

model Booking {
  id      String @id @default(cuid())
  businessId String
  business Business @relation(fields: [businessId], references: [id])
  // booking details
}

model KnowledgeBase {
  id      String @id @default(cuid())
  businessId String
  business Business @relation(fields: [businessId], references: [id])
  // website content & vectors
}
```

## 🐛 Debugging

### Backend Not Starting?
```bash
# Check Node version
node --version # Should be v18+

# Check ports
lsof -i :3001  # Check if port 3001 is free

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Frontend Not Loading?
```bash
# Clear Vite cache
rm -rf dist .vite

# Reinstall deps
rm -rf node_modules
npm install

# Check if backend proxy is working
curl http://localhost:3001/api/health
```

## 🚀 Deployment (Free Options)

### Backend
- **Railway** (free tier) - `npm run build && npm start`
- **Render** (free tier)
- **Fly.io** (free tier)

### Frontend
- **Vercel** (free) - `npm run build`
- **Netlify** (free) - `npm run build`
- **GitHub Pages** - static build

## 📄 License

MIT

## 🤝 Contributing

This is an open project. Feel free to:
1. Report bugs
2. Suggest features
3. Submit pull requests
4. Share improvements

---

**Made with ❤️ for local businesses**
