# ServiConnect — Complete Project Setup Guide

Smart Local On-Demand Services Platform  
**Right Worker. Right Time. Right at Your Door.**

---

## 📁 Project Structure

```
serviconnect/
├── backend/                      ← Node.js + Express API Server
│   ├── server.js                 ← Entry point — starts the server
│   ├── package.json
│   ├── .env.example              ← Copy to .env and fill values
│   ├── middleware/
│   │   └── auth.js               ← JWT protect + authorize helpers
│   ├── models/
│   │   ├── index.js              ← Sequelize model bootstrap + associations
│   │   ├── Customer.js           ← Customer model
│   │   ├── Worker.js             ← Worker model
│   │   ├── Booking.js            ← Booking model
│   │   └── Review.js             ← Review + sentiment model
│   └── routes/
│       ├── auth.js               ← POST /api/auth/customer/* and /worker/*
│       ├── customer.js           ← GET/POST /api/customer/*
│       └── worker.js             ← GET/PATCH /api/worker/*
│
└── frontend/
    └── public/                   ← Served as static files by Express
        ├── index.html            ← Landing page (home)
        ├── css/
        │   └── shared.css        ← All dashboard styles
        ├── js/
        │   └── api.js            ← Auth helpers + API client (used by all pages)
        └── pages/
            ├── customer-login.html     ← Customer login + signup
            ├── worker-login.html       ← Worker login + register
            ├── customer-dashboard.html ← Customer dashboard (protected)
            └── worker-dashboard.html   ← Worker dashboard (protected)
```

---

## 🚀 How to Run (Step by Step)

### Step 1 — Install Node.js
Download from https://nodejs.org (v18 or newer recommended)

Verify installation:
```bash
node -v    # should show v18+
npm -v     # should show 9+
```

### Step 2 — Set up the Backend

```bash
# Navigate to backend folder
cd serviconnect/backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env

# (Optional) Edit .env to change port or JWT secret
```

### Step 3 — Start the Server

```bash
# From inside serviconnect/backend/
node server.js

# OR with auto-restart on file changes:
npm run dev
```

You should see:
```
╔══════════════════════════════════════════╗
║      ServiConnect API Server             ║
║      Running on http://localhost:5000    ║
╚══════════════════════════════════════════╝
```

### Step 4 — Open the App

Open your browser and go to:
```
http://localhost:5000
```

That's it! The Express server serves both the API and all frontend files.

---

## 🔗 URL Map

| URL | Page |
|-----|------|
| `http://localhost:5000/` | Landing page (home) |
| `http://localhost:5000/pages/customer-login.html` | Customer login/signup |
| `http://localhost:5000/pages/worker-login.html` | Worker login/register |
| `http://localhost:5000/pages/customer-dashboard.html` | Customer dashboard (auth required) |
| `http://localhost:5000/pages/worker-dashboard.html` | Worker dashboard (auth required) |
| `http://localhost:5000/api/health` | API health check |

---

## 👤 Demo Accounts (Ready to Use)

### Customer
- **Phone:** `9876543210`
- **Password:** `password123`

### Worker
- **Phone:** `9123456789`
- **Password:** `password123`

---

## 🔌 API Reference

### Auth Routes (public)
```
POST /api/auth/customer/register   — Create customer account
POST /api/auth/customer/login      — Customer login → returns JWT token
POST /api/auth/worker/register     — Create worker account
POST /api/auth/worker/login        — Worker login → returns JWT token
```

### Customer Routes (requires Bearer token, role: customer)
```
GET  /api/customer/me              — Profile + stats + recent bookings
GET  /api/customer/workers         — Browse available workers (?service=Plumbing)
GET  /api/customer/bookings        — All bookings
POST /api/customer/bookings        — Post new service request
PATCH /api/customer/bookings/:id/rate — Rate a completed booking
```

### Worker Routes (requires Bearer token, role: worker)
```
GET   /api/worker/me               — Profile + stats + recent jobs
PATCH /api/worker/availability     — Toggle online/offline { isAvailable: true/false }
GET   /api/worker/open-jobs        — Available jobs matching worker's skills
PATCH /api/worker/jobs/:id/accept  — Accept an open job
PATCH /api/worker/jobs/:id/complete — Mark job done + set price { price: 850 }
```

---

## 🗃️ Database & Real-Time Storage

ServiConnect now runs on **PostgreSQL via Sequelize** for customers, workers, bookings, and reviews.  
Use the existing migration and seed commands from `backend/`:

```bash
npm run migrate
npm run seed
```

For real-time features, the infrastructure templates now provision **two DynamoDB tables**:

- `*-chat-messages` for booking chat history
- `*-location-updates` for worker location tracking events

The deployed backend can read those table names from:

- `DYNAMODB_CHAT_TABLE`
- `DYNAMODB_LOCATION_TABLE`

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Database | PostgreSQL (Sequelize ORM) |
| Real-time storage | DynamoDB (chat + live location tables) |
| Frontend | Vanilla HTML + CSS + JavaScript |
| Fonts | Google Fonts — Syne + DM Sans |
| Deployment | Any Node.js host: Railway, Render, Vercel, VPS |

---

## 🌐 Deploy to Production

### Option A — Railway (easiest)
1. Push code to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Set root directory to `backend/`
4. Add environment variables from `.env`
5. Done — Railway gives you a public URL

### Option B — Render
1. Create a Web Service on render.com
2. Build command: `npm install`
3. Start command: `node server.js`
4. Add env vars in dashboard

### Option C — VPS (DigitalOcean, AWS EC2)
```bash
git clone <your-repo>
cd serviconnect/backend
npm install
# Install PM2 for process management
npm install -g pm2
pm2 start server.js --name serviconnect
pm2 save
```

### Option D — AWS CloudFormation (Enterprise Scale)
ServiConnect includes a complete set of infrastructure-as-code templates for deploying a professional, scalable architecture on AWS.
See the [Deployment Guides](./docs/DEPLOYMENT_GUIDE.md) for full instructions on deploying via AWS CloudFormation or the AWS Console.


---

## 📱 Future Enhancements

- [ ] Optional Google Maps provider support (Leaflet live tracking is already available in the dashboards)
- [ ] Push notifications (Firebase FCM)
- [ ] In-app payment (Razorpay / Stripe)
- [ ] Telugu language AI support (Sarvam AI API)
- [ ] AI smart worker matching (based on rating + distance)
- [ ] Mobile app (React Native)
- [ ] Admin panel for managing workers and disputes

---

ServiConnect © 2025 | Smart Local On-Demand Services Platform
