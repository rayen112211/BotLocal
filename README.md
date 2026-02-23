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
- **Database:** Prisma ORM + SQLite
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
npx prisma db push --accept-data-loss
npm run db:seed
npm run dev
```

Backend runs on: **http://localhost:3001**

Test Account:
- Email: `admin@botlocal.com`
- Password: `password123`

### 2️⃣ Frontend Setup
```bash
cd frontend
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

## 📋 Project Features

### ✅ Currently Implemented
- JWT Authentication
- Business Dashboard
- Conversation UI (multi-language support)
- Bookings Calendar
- Knowledge Base Upload Form
- Settings & Billing Pages
- Database Schema

### 🔨 In Development
- WhatsApp API Integration
- AI/LLM Connection
- Knowledge Base Ingestion (web scraping)
- Real Booking Logic
- Payment Integration

### 📅 Next Steps
1. Connect Groq/Hugging Face API
2. Set up Twilio WhatsApp
3. Build knowledge base pipeline
4. Implement real booking system
5. Add email notifications
6. Deploy to production

## 🗂️ Project Structure Details

### Backend Routes (to be created)
```
POST   /api/auth/register      - Create account
POST   /api/auth/login         - Login
POST   /api/auth/refresh       - Refresh token

GET    /api/dashboard          - Get business metrics
GET    /api/conversations      - List conversations
POST   /api/conversations      - Create new conversation
GET    /api/bookings           - List bookings
POST   /api/bookings           - Create booking

POST   /api/knowledge-base     - Upload website URL
GET    /api/knowledge-base     - Get stored knowledge

POST   /api/whatsapp/webhook   - Receive WhatsApp messages
POST   /api/whatsapp/send      - Send WhatsApp message

GET    /api/business           - Get business info
PUT    /api/business           - Update business info
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
- ⏳ Rate limiting (to add)
- ⏳ Input validation (Zod)

## 📝 Environment Variables

Create `.env` in backend folder (see `.env.example`):
- `DATABASE_URL` - SQLite path
- `JWT_SECRET` - Secret key for tokens
- `GROQ_API_KEY` - AI model access
- `TWILIO_*` - WhatsApp integration
- `HUGGING_FACE_API_KEY` - Alternative AI
- `STRIPE_SECRET_KEY` - Payments (optional)

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
