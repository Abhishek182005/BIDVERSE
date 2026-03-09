# BidVerse — Professional Auction Platform

A full-stack real-time auction platform with separate Admin and Bidder panels, built with Next.js, Express, MongoDB, and Socket.io.

---

## ✨ Features

### Admin Panel

- Create and manage auction listings (title, description, image, start/end time, minimum bid)
- Assign and manage credits for registered bidders
- Monitor live bids in real time via WebSocket
- Declare winners and close auctions
- View auction reports, analytics & bidding history

### Bidder Panel

- Secure registration and JWT-based login
- Browse active auctions with live countdown timers
- Place bids using assigned credits
- Real-time outbid and winning notifications via Socket.io
- Track credit balance and personal bidding history

### Credits System

- Admin assigns a fixed number of credits to each bidder
- Credits are deducted when a bid is placed (escrowed)
- When outbid, credits are returned immediately
- Only the winner's credits are permanently deducted on auction close

---

## 🛠 Tech Stack

| Layer      | Technology                                           |
| ---------- | ---------------------------------------------------- |
| Frontend   | Next.js 14 (App Router), Chakra UI v2, Framer Motion |
| Backend    | Node.js, Express 4                                   |
| Database   | MongoDB + Mongoose                                   |
| Real-time  | Socket.io 4                                          |
| Auth       | JWT (jsonwebtoken) + bcryptjs                        |
| Analytics  | Recharts                                             |
| Scheduling | node-cron (auto-close expired auctions)              |

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js ≥ 18
- MongoDB (local or Atlas)

### 1. Clone the repository

```bash
git clone <repo-url>
cd Bidder
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Fill in your .env values (MongoDB URI, JWT secret, etc.)
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

## 🔑 Default Admin Account

To create the first admin account, set `ADMIN_SEED=true` in your backend `.env` and start the server. This seeds an admin user:

- **Email:** admin@bidverse.com
- **Password:** Admin@123

---

## 📁 Project Structure

```
Bidder/
├── backend/
│   ├── server.js
│   └── src/
│       ├── config/        # DB connection
│       ├── controllers/   # Business logic
│       ├── middleware/    # Auth, error handling
│       ├── models/        # Mongoose schemas
│       ├── routes/        # Express routes
│       ├── socket/        # Socket.io handlers
│       └── utils/         # Auction scheduler
└── frontend/
    └── src/
        ├── app/           # Next.js App Router pages
        ├── components/    # Reusable UI components
        ├── context/       # React context providers
        ├── hooks/         # Custom React hooks
        ├── lib/           # API client & socket
        └── theme/         # Chakra UI custom theme
```

---

## 🎯 Bonus Features Implemented

- ✅ Live bid notifications (Socket.io)
- ✅ Auction analytics dashboard (Recharts)
- ✅ Mobile-responsive design
- ✅ Dark mode interface
- ✅ Auto-close expired auctions (node-cron)
- ✅ Rate limiting & security (Helmet, mongo-sanitize)

---

## ⚠️ Known Limitations

- Image upload uses URL input (no file storage configured)
- Email notifications not wired (requires SMTP setup)
- No payment gateway (credits-only system)

---

## 👥 Team

Built for the Unstop Auction Platform Challenge.
