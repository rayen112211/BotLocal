# 🚀 BotLocal Production Configuration Guide

## 1. Render Backend Settings
Create these resources in your Render dashboard:

### Database (PostgreSQL)
- **Name**: `botlocal-db`
- **Tier**: Free

### Web Service (Backend)
- **Repository**: (Your Repo)
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `DATABASE_URL`: (Paste Internal DB URL)
  - `JWT_SECRET`: (Random 32+ char string)
  - `PORT`: `10000`
  - `NODE_ENV`: `production`
  - `FRONTEND_URL`: (Your Vercel URL)
  - `GROQ_API_KEY`: (Your Key)
  - `TWILIO_ACCOUNT_SID`: (Your SID)
  - `TWILIO_AUTH_TOKEN`: (Your Token)
  - `TWILIO_PHONE_NUMBER`: (Your WhatsApp Number)

## 2. Vercel Frontend Settings
- **Root Directory**: `./` (Project Root)
- **Framework**: Vite
- **Environment Variables**:
  - `VITE_API_URL`: `https://your-app.onrender.com/api`

## 3. Deployment Checklist
1. [ ] Database created on Render
2. [ ] Backend service deployed on Render
3. [ ] Environment variables configured on Render
4. [ ] Local `npx prisma db push` run against **External DB URL**
5. [ ] Frontend deployed on Vercel
6. [ ] Twilio Webhook URL updated
