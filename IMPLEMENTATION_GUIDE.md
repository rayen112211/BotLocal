# BotLocal Implementation Guide

## 📍 Where We Are Now
✅ Project structure set up
✅ Dependencies configured  
✅ Database schema planned (Prisma)
✅ Authentication system (JWT ready)
✅ UI framework (shadcn/ui + Tailwind)

🔴 **What's Missing:** The actual source code (src/ folders for backend and frontend)

---

## 📝 Step-by-Step Implementation

### Phase 1: Core Infrastructure (Week 1-2)

#### 1.1 Backend Server Setup
**Create:** `backend/src/index.ts`
```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

// Routes (to be added)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
// ... more routes

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

#### 1.2 Create Prisma Schema
**Create:** `backend/prisma/schema.prisma`
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Business {
  id          String @id @default(cuid())
  email       String @unique
  password    String
  name        String
  phone       String?
  plan        String @default("Starter")
  messageCount Int @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  conversations Conversation[]
  bookings      Booking[]
  knowledgeBase KnowledgeBase[]
}

model Conversation {
  id        String @id @default(cuid())
  businessId String
  business  Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  messages  Message[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Message {
  id           String @id @default(cuid())
  conversationId String
  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  
  sender      String // "user" or "bot"
  content     String
  language    String @default("en")
  createdAt   DateTime @default(now())
}

model Booking {
  id        String @id @default(cuid())
  businessId String
  business  Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  customerName String
  customerPhone String
  serviceType String
  startTime   DateTime
  endTime     DateTime?
  status      String @default("pending")
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model KnowledgeBase {
  id        String @id @default(cuid())
  businessId String
  business  Business @relation(fields: [businessId], references: [id], onDelete: Cascade)
  
  websiteUrl String
  content    String @db.Text
  embedding  String? @db.Text // For vector storage
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

#### 1.3 Create Auth Routes
**Create:** `backend/src/routes/auth.ts`
```typescript
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const business = await prisma.business.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    res.status(201).json({ message: 'Business created', businessId: business.id });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Email already registered' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const business = await prisma.business.findUnique({ where: { email } });
    if (!business) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, business.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { businessId: business.id, email: business.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({ token, businessId: business.id, name: business.name });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
```

#### 1.4 Create Auth Middleware
**Create:** `backend/src/middleware/auth.ts`
```typescript
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  businessId?: string;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.businessId = decoded.businessId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

### Phase 2: Frontend Setup (Week 1-2)

#### 2.1 Frontend Project Structure
```
src/
├── pages/
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Dashboard.tsx
│   ├── Conversations.tsx
│   ├── Bookings.tsx
│   ├── KnowledgeBase.tsx
│   └── Settings.tsx
├── components/
│   ├── ui/                  (shadcn/ui components)
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   └── ProtectedRoute.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useApi.ts
├── lib/
│   ├── api.ts               (Axios instance)
│   ├── utils.ts
│   └── auth.ts
├── App.tsx                  (Router setup)
└── main.tsx                 (Entry point)
```

#### 2.2 Create API Client
**Create:** `frontend/src/lib/api.ts`
```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (email: string, password: string, name: string) =>
    api.post('/auth/register', { email, password, name }),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
};

export const dashboardApi = {
  getMetrics: () => api.get('/dashboard/metrics'),
  getConversations: () => api.get('/conversations'),
  getBookings: () => api.get('/bookings'),
};
```

#### 2.3 Create Auth Hook
**Create:** `frontend/src/hooks/useAuth.ts`
```typescript
import { useState, useCallback } from 'react';
import { authApi } from '@/lib/api';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register(email, password, name);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authApi.login(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('businessId', data.businessId);
      localStorage.setItem('name', data.name);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
  }, []);

  return { register, login, logout, loading, error };
};
```

#### 2.4 Create Login Page
**Create:** `frontend/src/pages/Login.tsx`
```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('admin@botlocal.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-2">BotLocal</h1>
        <p className="text-gray-600 mb-8">Sign in to your account</p>
        
        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4"
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4"
            required
          />
          
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          
          <Button
            type="submit"
            className="w-full mb-4"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        
        <p className="text-center text-gray-600 text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
```

---

### Phase 3: Core Features (Week 2-3)

#### 3.1 Whatsapp Integration (using Twilio)
```typescript
// backend/src/services/whatsapp.ts
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendWhatsAppMessage = async (
  to: string,
  message: string
) => {
  try {
    const result = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
      to: `whatsapp:${to}`,
      body: message,
    });
    return result.sid;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    throw error;
  }
};
```

#### 3.2 AI Integration (using Groq - FREE)
```typescript
// backend/src/services/ai.ts
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const generateAIResponse = async (
  userMessage: string,
  businessContext: string
) => {
  try {
    const response = await groq.messages.create({
      model: 'mixtral-8x7b-32768',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are a helpful customer service bot for a business. Context: ${businessContext}\n\nCustomer: ${userMessage}`,
        },
      ],
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
};
```

#### 3.3 Knowledge Base Ingestion
```typescript
// backend/src/services/knowledgeBase.ts
import axios from 'axios';
import * as cheerio from 'cheerio';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ingestWebsite = async (
  businessId: string,
  websiteUrl: string
) => {
  try {
    const { data } = await axios.get(websiteUrl);
    const $ = cheerio.load(data);
    
    // Extract text content
    const content = $('body').text().trim();
    
    // Store in database
    await prisma.knowledgeBase.create({
      data: {
        businessId,
        websiteUrl,
        content,
      },
    });

    return { success: true, contentLength: content.length };
  } catch (error) {
    console.error('Website ingestion error:', error);
    throw error;
  }
};
```

---

### Phase 4: Complete Dashboard UI (Week 3-4)

Create these page components:
- `Dashboard.tsx` - Overview with metrics
- `Conversations.tsx` - Chat history
- `Bookings.tsx` - Appointment management
- `KnowledgeBase.tsx` - Upload website
- `Settings.tsx` - Business configuration

---

## 🎯 Your Action Items

1. **Send me the existing source code** from your `chatbot-buddy-main` folder:
   - All files in `src/` (frontend)
   - All files in `backend/src/` (backend)
   - `backend/prisma/schema.prisma`

2. **Or choose an option:**
   - Option A: Push everything to GitHub, I'll clone and review
   - Option B: Send files one-by-one 
   - Option C: I build from scratch based on this guide

3. **Get Free API Keys:**
   - Groq: https://console.groq.com
   - Twilio: https://www.twilio.com/console
   - Hugging Face: https://huggingface.co

4. **Create `.env` file** in backend with keys from above

---

## ✅ Checklist to Complete BotLocal

- [ ] Backend server running
- [ ] Prisma database configured
- [ ] Auth routes working (login/signup)
- [ ] Frontend login page functional
- [ ] Dashboard page built
- [ ] Groq AI integration
- [ ] Twilio WhatsApp setup
- [ ] Conversations page with AI responses
- [ ] Bookings calendar integrated
- [ ] Knowledge base ingestion working
- [ ] Settings page complete
- [ ] Deployed to production

---

**Ready to start building? Let me know what code you have and we'll integrate it! 🚀**
