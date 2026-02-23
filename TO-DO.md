# 📋 BotLocal TO-DO List

## 🚨 CRITICAL: Fix My Current Deployment
If your bot is not replying right now, follow these exact steps:

1. [ ] **Update Render URL**: In Render Dashboard, change `BACKEND_URL` to exactly `https://botlocal.onrender.com`. 
    - *Why?* The previous one had `-backend` in it which does not exist.
2. [ ] **Wait for Deploy**: Watch the Render logs until it says "Live".
3. [ ] **Save Settings**: Go to your dashboard settings and re-save your Telegram Bot Token.
4. [ ] **Test Bot**: Send a message to your Telegram bot.

---

## ✅ Completed (Recently Revamped)
- [x] **Telegram Integration**: Swapped Twilio for a native Telegraf system.
- [x] **Zero-Config Stripe**: Checkout now creates products automatically (no IDs needed).
- [x] **Rate Limit Bypass**: Webhooks are now excluded from global rate limiting to prevent dropped messages.
- [x] **SPA Routing**: Added `vercel.json` to fix 404s on page refresh.

---

## 🛠️ Upcoming Features
- [ ] **Multi-Agent Industry Selection**: Allow bots to specialize in even more specific sub-industries.
- [ ] **Voice Ingestion**: Allow users to upload audio files to the knowledge base.
- [ ] **Google Calendar Sync**: Automatically push AI bookings to your actual calendar.
- [ ] **Bot usage analytics**: Visual charts showing how many messages were saved by AI.

---

## 🧹 Cleanup Tasks
- [ ] **Remove Twilio remnants**: Delete old variables from internal configs.
- [ ] **Database Optimization**: Add indexes for faster conversation lookups.
- [ ] **Custom CSS Polish**: Finish the premium glassmorphism effect on the dashboard.
