# 🚀 BotLocal Production Configuration Guide

## 1. Render Backend Settings
Create these resources in your Render dashboard:

### Database (PostgreSQL)
- **Name**: `botlocal-db`
- **Tier**: Free/Paid

### Web Service (Backend)
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `DATABASE_URL`: (Paste Internal DB URL from Neon/Render)
  - `JWT_SECRET`: (Random 32+ char string)
  - `PORT`: `10000`
  - `NODE_ENV`: `production`
  - `FRONTEND_URL`: (Your Vercel URL, e.g., `https://my-bot.vercel.app`)
  - `BACKEND_URL`: **IMPORTANT** Must be `https://botlocal.onrender.com` (Used for Telegram Webhooks)
  - `GROQ_API_KEY`: (Your Key)
  - `STRIPE_SECRET_KEY`: (Your Key)

## 2. Vercel Frontend Settings
- **Root Directory**: `./` (Project Root)
- **Framework**: Vite
- **Environment Variables**:
  - `VITE_API_URL`: `https://botlocal.onrender.com/api`

## 3. Finalizing Setup
1. [x] **Database Push**: Run `npx prisma db push` from your local terminal after setting the `DATABASE_URL` to the **External** URL.
2. [x] **Bot Linking**: Go to your live website, log in, and add your Telegram Token in **Bot Settings**.
3. [x] **Webhook Sync**: Hitting the "Save" button in settings now automatically syncs with Telegram's servers.
