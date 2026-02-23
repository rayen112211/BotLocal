## BotLocal Launch Checklist

### Backend
- [ ] Set production `.env` for backend:
  - [ ] `PORT`
  - [ ] `JWT_SECRET` (strong random string)
  - [ ] `DATABASE_URL` (managed Postgres)
  - [ ] `GROQ_API_KEY`
  - [ ] `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
  - [ ] `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - [ ] `FRONTEND_URL` (deployed frontend origin)
- [ ] Run Prisma migrations against production database
- [ ] Configure CORS to allow only `FRONTEND_URL` in production
- [ ] Verify:
  - [ ] `/api/health` returns `status: ok`
  - [ ] Auth routes work (signup, login)
  - [ ] Dashboard, bookings, scanner, conversations routes respect `businessId`

### Frontend
- [ ] Set `.env` for frontend:
  - [ ] `VITE_API_URL=https://your-backend-domain/api`
- [ ] Build and deploy frontend (Vercel/Netlify/etc.)
- [ ] Test flows end-to-end:
  - [ ] Signup → onboarding → dashboard
  - [ ] Login/logout
  - [ ] Knowledge Base scan
  - [ ] Bookings list + status updates
  - [ ] Conversations inbox + AI toggle

### Integrations
- [ ] Twilio:
  - [ ] WhatsApp sandbox/number configured to point to `/api/whatsapp/webhook`
  - [ ] Inbound message creates/updates conversations and sends AI replies
- [ ] Stripe:
  - [ ] Test checkout for each plan in test mode
  - [ ] Webhook receives `checkout.session.completed`
  - [ ] Business `plan` and `stripeCustomerId` updated correctly
  - [ ] Subscription cancellation downgrades to Starter

### Ops
- [ ] Enable logs on hosting platform for backend
- [ ] Turn on automatic database backups
- [ ] Add links to Terms of Service and Privacy Policy on landing page

