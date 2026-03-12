# BidVerse — Professional Real-Time Auction Platform

A full-stack real-time auction platform with separate Admin and Bidder panels, built with Next.js 14, Express, MongoDB, and Socket.io. Designed for competitive, live bidding with a robust credit system, smart automation, and a polished UI.

---

## Features

### Admin Panel

- Create and manage auction listings with **image file upload** (multer-powered, UUID filenames)
- **AI-powered description generator** — one-click smart description based on item title & category
- Assign and adjust credits for registered bidders
- Monitor live bids in real time via WebSocket (Live Bid Monitor)
- Declare winners and close auctions manually
- Full auction reports, analytics dashboard, and bidding history

### Bidder Panel

- Secure registration and JWT-based login (tokens expire after 7 days)
- Browse active auctions with live countdown timers
- Place bids using assigned credits — credits escrowed on bid, returned instantly on outbid
- **Smart bid suggestions** — Safe / Compete / Aggressive bid levels with competition heat indicators
- **Auto-bidding system** — set a maximum budget; the platform bids on your behalf automatically
- **Auto-bid opt-out** — cancel auto-bidding at any time directly from the auction page
- Real-time outbid / win / auto-bid notifications via Socket.io
- Track credit balance and full personal bidding history

### Credits System

- Admin assigns a fixed number of credits to each bidder
- Credits are deducted (escrowed) when a bid is placed
- Credits returned immediately when outbid
- Only the winning bid's credits are permanently consumed on auction close

### Auto-Bid Engine (Crash-Safe)

- Resolves multi-user auto-bid chains in a single controlled loop (max 20 rounds)
- **Per-auction lock** — prevents two concurrent chains from running on the same auction simultaneously
- **300 ms cooldown between rounds** — prevents DB/CPU storms when many users have auto-bids active
- Budget exhaustion detection — deactivates auto-bid and notifies the user when their cap is reached

---

## Tech Stack

| Layer       | Technology                                           |
| ----------- | ---------------------------------------------------- |
| Frontend    | Next.js 14 (App Router), Chakra UI v2, Framer Motion |
| Backend     | Node.js, Express 4                                   |
| Database    | MongoDB + Mongoose                                   |
| Real-time   | Socket.io 4                                          |
| Auth        | JWT (jsonwebtoken) + bcryptjs                        |
| File Upload | Multer (disk storage) + UUID filenames               |
| Analytics   | Recharts                                             |
| Scheduling  | node-cron (auto-close expired auctions)              |
| Security    | Helmet, express-mongo-sanitize, rate limiting        |

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/Abhishek182005/BIDVERSE.git
cd BIDVERSE
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values (see Environment Variables below)
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in NEXT_PUBLIC_API_URL and NEXT_PUBLIC_SOCKET_URL
npm run dev
```

### 4. Open in browser

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## Environment Variables

### Backend (`.env`)

```env
MONGO_URI=mongodb://localhost:27017/bidverse
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d
PORT=5000
ADMIN_SEED=true        # set to true on first run to seed the admin account
```

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Default Admin Account

Set `ADMIN_SEED=true` in your backend `.env` and start the server once to seed the default admin:

- **Email:** admin@bidverse.com
- **Password:** Admin@123

---

## Project Structure

```
BIDVERSE/
├── backend/
│   ├── server.js
│   ├── uploads/           # Uploaded auction images (served statically)
│   └── src/
│       ├── config/        # DB connection
│       ├── controllers/   # Business logic (auth, auctions, bids, admin)
│       ├── middleware/    # JWT auth, error handler
│       ├── models/        # Mongoose schemas (User, Auction, Bid, AutoBid, Notification)
│       ├── routes/        # Express routes + /api/upload/image
│       ├── socket/        # Socket.io event handlers
│       └── utils/         # Auction scheduler (node-cron)
└── frontend/
    └── src/
        ├── app/           # Next.js App Router pages + favicon (icon.svg)
        ├── components/    # Admin & Bidder UI components
        ├── context/       # AuthContext, SocketContext, NotificationContext
        ├── hooks/         # useCountdown
        ├── lib/           # Axios API client (api.js) + socket helper
        └── theme/         # Chakra UI custom dark theme
```

---

## Features & Improvements Summary

### Core Features

- Real-time bidding via WebSockets (Socket.io)
- Auction analytics dashboard (Recharts)
- Credit escrow system (bid → escrow → return/consume)
- Mobile-responsive dark UI (Chakra UI + Framer Motion)
- Auto-close expired auctions (node-cron)
- Rate limiting & security hardening (Helmet, mongo-sanitize)

### Bonus Features

- **Auto-bidding** — set max budget, system bids automatically
- **Smart bid suggestions** — Safe / Compete / Aggressive levels
- **AI description generator** — generates auction descriptions from title + category
- **Image file upload** — upload auction images directly (no URL required)
- **Auto-bid opt-out** — cancel auto-bid from the auction page in real time

### Stability & Bug Fixes

- Auto-bid crash fix — MAX_ROUNDS cap + per-auction lock + 300ms cooldown
- JWT refresh fix — 401 interceptor no longer logs user out on page refresh
- Credits field fix — admin assign-credits modal correctly posts `credits` field
- Image CORS fix — `Cross-Origin-Resource-Policy: cross-origin` on `/uploads` route

---

## Known Limitations

- Email notifications not wired (requires SMTP setup)
- No payment gateway (credits-only system)
- Uploaded images stored locally — use cloud storage (S3/Cloudinary) for production

---

## Team

Built for the **Unstop Auction Platform Hackathon Challenge**.
