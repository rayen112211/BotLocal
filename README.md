# BotLocal - AI-Powered Customer Service Agent

## 🎯 Project Goal
BotLocal empowers local businesses with an intelligent AI assistant that lives on **Telegram**. It automates customer inquiries, handles appointment bookings, and learns everything about a business by scanning its website. 

The goal is to provide 24/7 instant customer support that feels human, multi-lingual, and deeply knowledgeable about the specific business it represents.

---

## 🏗️ Architecture

```
BotLocal/
├── backend/              # Node.js + Express + Prisma
│   ├── src/
│   │   ├── index.ts      # Server entry point (Rate-limited, CORS enabled)
│   │   ├── routes/       # Telegram Webhooks, Stripe, Auth, Dash
│   │   └── services/     # AI (Groq), Telegram (Telegraf), Web Scanner
│   └── prisma/
│       └── schema.prisma # PostgreSQL (Neon) Schema
│
└── frontend/             # React + TypeScript + Vite
    ├── src/
    │   ├── pages/        # Dashboard, Bot Settings, Billing
    │   ├── context/      # Auth & Global State
    │   └── lib/          # Axios API client
    └── vercel.json       # Vercel SPA Routing
```

---

## 🛠️ Updated Tech Stack (Revamped)

### 🤖 AI Engine
- **Brain:** Groq Cloud (Llama 3.3 70B) - Ultra-fast responses.
- **Memory:** Dynamic Knowledge Base context injection.
- **Logic:** Automated Booking Detection & Extraction.

### 💬 Messaging (New!)
- **Platform:** Telegram Bot API.
- **SDK:** Telegraf.js.
- **Webhook Pattern:** Native `handleUpdate` routing to bypass Express parsing issues.

### 💰 Payments (Improved!)
- **Stripe Checkout:** 100% Automatic. 
- **Zero Config:** Uses dynamic `price_data` - no need to pre-create products in the Stripe Dashboard.
- **Webhooks:** Automated plan upgrades (Starter -> Pro -> Agency).

---

## 🚀 How it Works

1. **Magic Scan**: You provide a website URL; the bot recursively scans every page to build its "brain".
2. **Bot Linking**: You paste your Telegram Bot Token and Username in the dashboard.
3. **Instant Webhook**: The backend automatically registers a secure webhook with Telegram.
4. **AI Conversation**: Customers message your bot; the AI detects their language and replies using your business knowledge.
5. **Auto-Booking**: If a customer wants to book, the AI extracts the date/time and creates a pending appointment in your dashboard.

---

## 🔑 Key Configuration

### Render Backend
Required Environment Variables:
- `DATABASE_URL`: Your PostgreSQL string.
- `JWT_SECRET`: Secure random string.
- `BACKEND_URL`: **IMPORTANT** Must be `https://YOUR-APP.onrender.com` (Used for Telegram Webhooks).
- `GROQ_API_KEY`: Get from Groq Cloud.
- `STRIPE_SECRET_KEY`: Your Stripe Secret Key.
- `FRONTEND_URL`: Your Vercel URL.

### Vercel Frontend
- `VITE_API_URL`: `https://YOUR-APP.onrender.com/api`

---

## 📅 Maintenance & Monitoring
- **Health Check**: `https://YOUR-APP.onrender.com/api/health`
- **Bot Status**: `https://YOUR-APP.onrender.com/api/telegram/status/:your_token`

---

**Made with ❤️ for local businesses**
