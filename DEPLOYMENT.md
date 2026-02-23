# BotLocal Deployment Guide

## 🚀 Overview

This guide covers deploying BotLocal to **production for FREE** using:
- **Backend**: Railway (free tier - $5/month credits)
- **Frontend**: Vercel (completely free)
- **Database**: SQLite (free)
- **APIs**: Groq (free), Twilio (trial credits)

**Total Cost: $0-5/month** (well within free tiers)

---

## 📋 Prerequisites

Before deploying, make sure you have:

1. **GitHub account** - for version control
2. **Railway account** - for backend hosting (https://railway.app)
3. **Vercel account** - for frontend hosting (https://vercel.com)
4. **Groq API key** - free from https://console.groq.com
5. **Twilio credentials** - free trial from https://www.twilio.com

---

## **Part 1: Backend Deployment (Railway)**

### Step 1: Prepare Your Backend

```bash
# Navigate to backend folder
cd backend

# Make sure all dependencies are listed
npm install

# Create .env file with production variables
cp .env.example .env
```

### Step 2: Push Code to GitHub

```bash
# From root folder
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 3: Deploy on Railway

1. Go to https://railway.app and sign in
2. Click **New Project**
3. Select **Deploy from GitHub**
4. Authorize GitHub and select your repository
5. Choose the folder: `backend`
6. Railway will auto-detect Node.js

### Step 4: Configure Environment Variables

In Railway dashboard:

1. Click on your project
2. Go to **Variables**
3. Add these variables:

```
DATABASE_URL=file:./dev.db
JWT_SECRET=your_super_secret_key_change_this_12345
PORT=3001
NODE_ENV=production
GROQ_API_KEY=your_groq_key_from_console.groq.com
HUGGINGFACE_API_KEY=your_hf_key_from_huggingface.co
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_whatsapp_number
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
FRONTEND_URL=https://your-frontend.vercel.app
```

### Step 5: Deploy Database

```bash
# Run migrations in Railway terminal
npx prisma db push --accept-data-loss
npx ts-node seed.ts
```

### Step 6: Get Your Backend URL

After deployment, Railway gives you a public URL like:
```
https://botlocal-backend-production.up.railway.app
```

Save this! You'll need it for the frontend.

---

## **Part 2: Frontend Deployment (Vercel)**

### Step 1: Update API URL

In `frontend/.env.local`:
```
VITE_API_URL=https://botlocal-backend-production.up.railway.app/api
```

Or update in `vite.config.ts`:
```typescript
proxy: {
  '/api': {
    target: 'https://botlocal-backend-production.up.railway.app',
    changeOrigin: true,
  }
}
```

### Step 2: Deploy on Vercel

1. Go to https://vercel.com and sign in
2. Click **Add New... → Project**
3. Select your GitHub repository
4. In "Root Directory", select `frontend`
5. Click **Deploy**

Vercel auto-detects Vite and builds it correctly.

### Step 3: Set Environment Variables

In Vercel dashboard:

1. Go to your project → Settings → Environment Variables
2. Add:
```
VITE_API_URL=https://your-backend-railway-url/api
```

3. Redeploy after adding env vars

### Step 4: Get Your Frontend URL

Vercel provides a URL like:
```
https://botlocal-frontend.vercel.app
```

---

## **Part 3: Configure Free APIs**

### Groq (Free AI)

1. Go to https://console.groq.com
2. Sign up (free)
3. Create API key
4. Add to Railway env variables as `GROQ_API_KEY`

**Unlimited free usage!**

### Twilio (WhatsApp - Free Trial)

1. Sign up at https://www.twilio.com
2. Verify your phone number
3. Get Account SID & Auth Token from Console
4. Create WhatsApp Sandbox (free):
   - Go to Messaging → Try it out → Send a WhatsApp message
   - Join sandbox by texting code to number shown
5. Add credentials to Railway:
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+14155552671 (from sandbox)
```

**Free $15 trial + $0.0075 per message after**

### Stripe (Payments - Optional)

1. Go to https://stripe.com
2. Sign up (free test mode)
3. Get test keys
4. Add to Railway:
```
STRIPE_SECRET_KEY=sk_test_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
```

---

## **Part 4: Domain Setup (Optional)**

### Custom Domain on Vercel

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Vercel provides DNS records
4. Update your domain registrar's DNS settings
5. Takes 24-48 hours to propagate

**Or use free vercel.app subdomain:**
```
https://botlocal.vercel.app
```

---

## **Part 5: Testing Deployment**

### Test Backend

```bash
# Health check
curl https://your-railway-url/api/health

# Should return: {"status":"ok"}
```

### Test Frontend

1. Go to your Vercel URL
2. Try signing up
3. Try logging in with test account (admin@botlocal.com / password123)
4. Test scanning a website
5. Check that data saves to database

### Test WhatsApp

1. Send message to your Twilio WhatsApp number
2. Should get automated response from bot
3. Try booking appointment
4. Check dashboard for saved booking

---

## **Part 6: Monitoring & Logs**

### Railway Logs

1. Go to Railway project dashboard
2. Click **Logs** to see server logs
3. Check for errors or issues
4. Use logs to debug problems

### Vercel Logs

1. Go to Vercel project → Deployments
2. Click on a deployment to see build logs
3. Check for TypeScript/build errors

---

## **Part 7: Database Backup**

SQLite database is stored on Railway. To backup:

1. Download from Railway file browser
2. Or use Railway CLI:
```bash
railway download dev.db
```

To restore:
```bash
railway upload dev.db
```

---

## **Part 8: Scaling (When You Get Popular)**

Once you outgrow free tier:

### Backend
- Upgrade Railway to paid plan ($5-50/month)
- Or move to: AWS EC2, Heroku, Digital Ocean ($5-10/month)

### Database
- Upgrade to PostgreSQL on Railway
- Or use: AWS RDS, PlanetScale (free tier available)

### Frontend
- Vercel is still free even at scale

### APIs
- Groq: Still free at scale
- Twilio: Pay per message ($0.0075)
- Stripe: 2.9% + $0.30 per transaction

---

## **Troubleshooting**

### Backend won't start
```bash
# Check logs in Railway
# Make sure all env variables are set
# Verify database migrations ran
```

### Frontend not connecting to backend
```
# Check CORS is enabled in backend
# Verify API URL in .env
# Check browser console for errors
```

### WhatsApp not responding
```
# Verify Twilio credentials are correct
# Check Twilio webhook URL points to Railway
# Test with curl first
```

### Database errors
```bash
# SSH into Railway
# Run: npx prisma db push
# Run: npx ts-node seed.ts
```

---

## **Free Tier Limits**

| Service | Free Tier | Cost After |
|---------|-----------|-----------|
| Railway | $5/month credit | $0.000463/GB/hr |
| Vercel | Unlimited | Starts at $20/month |
| Groq | Unlimited | Unlimited (always free) |
| Twilio | $15 trial credit | $0.0075/message |
| Stripe | Test mode free | 2.9% + $0.30/transaction |
| SQLite | Unlimited | N/A |

---

## **Next Steps**

1. ✅ Deploy backend to Railway
2. ✅ Deploy frontend to Vercel
3. ✅ Set up Groq API
4. ✅ Configure Twilio WhatsApp
5. ✅ Test end-to-end
6. ✅ Set up custom domain (optional)
7. ✅ Monitor logs and performance
8. ⏭️ Launch to target market!

---

## **Support**

Need help deploying?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Groq Docs: https://console.groq.com/docs
- Twilio Docs: https://www.twilio.com/docs
- Prisma Docs: https://www.prisma.io/docs

Good luck! 🚀
