# BotLocal - AI-Powered WhatsApp Chatbot for Local Businesses

## Goal of the Project
BotLocal aims to provide local businesses with an intelligent, automated WhatsApp customer service agent. The goal is to allow businesses (like restaurants, salons, and clinics) to automate routine inquiries, handle appointment bookings, and ingest business knowledge directly from their existing websites, freeing up staff and providing 24/7 instant responses to customers.

## Current Features & capabilities

### 1. Robust Full-Stack Architecture
- **Frontend:** Built with React, Vite, TypeScript, Tailwind CSS, and `shadcn/ui` for a premium, responsive user interface.
- **Backend:** Powered by Node.js, Express, and Prisma ORM (SQLite for development).

### 2. Secure Authentication
- Custom JWT-based authentication system.
- Secure password hashing using `bcryptjs`.
- Protected dashboard routes ensuring data isolation per business account.

### 3. Business Dashboard
- **Overview:** High-level metrics showing message usage, active conversations, and recent bookings.
- **Conversations (Mock):** A UI for reviewing AI-driven WhatsApp conversations in multiple languages.
- **Bookings:** A calendar and list view for managing appointments.
- **Knowledge Base:** Allows businesses to input their website URL for the AI to scan and learn from (currently mocked scanning functionality).
- **Settings & Billing:** Infrastructure in place for managing bot personality, business details, and subscription tiers.

## Tech Stack
- **Frontend:** React 18, Vite, React Router DOM, React Query (@tanstack/react-query), Tailwind CSS, shadcn/ui components, Lucide Icons.
- **Backend:** Node.js, Express, Prisma ORM, JSON Web Tokens (JWT), Bcryptjs for password hashing.
- **Database:** SQLite (development) via Prisma.

## Running the Project Locally

### Prerequisites
- Node.js (v18+)
- npm or bun

### 1. Backend Setup
```sh
cd backend
npm install
# Push the Prisma schema to create the SQLite database
npx prisma db push --accept-data-loss
# Seed the database with a test admin account
npx ts-node seed.ts
# Start the backend development server
npm run dev
```
*The backend will run on http://localhost:3001*

### 2. Frontend Setup
Open a new terminal window:
```sh
npm install
npm run dev
```
*The frontend will run on http://localhost:8080*

### 3. Usage
- Navigate to `http://localhost:8080` in your browser.
- You can log in with the seeded test account:
  - **Email:** `admin@botlocal.com`
  - **Password:** `password123`
- Alternatively, you can create a new account via the Sign Up page.
