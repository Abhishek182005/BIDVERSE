# BidVerse — Complete Codebase Explanation

> Full explanation of every module, feature, and code flow for evaluation reference.

---

## Project Overview

**BidVerse** is a **full-stack real-time auction platform** using the **MERN stack** (MongoDB + Express + React/Next.js + Node.js). Users (Bidders) can browse and bid on items. Admins create auctions, manage credits, and monitor everything live.

---

## ARCHITECTURE DIAGRAM

```
Browser (Next.js 14)
   │  HTTP (Axios)          │  WebSocket (Socket.io-client)
   ▼                        ▼
Express.js REST API ◄──── Socket.io Server
       │
   MongoDB (Mongoose)
```

---

# PART 1 — FULL CODEBASE EXPLANATION

---

## BACKEND — `backend/`

### 1. `server.js` — The Entry Point

This is the **heart of the backend**. Every line does something important:

| Code                                    | Purpose                                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `express()`                             | Creates the HTTP application                                                                                           |
| `http.createServer(app)`                | Creates a raw HTTP server so Socket.io can share the same port                                                         |
| `new Server(server, {...})`             | Attaches Socket.io to the HTTP server                                                                                  |
| `helmet()`                              | Sets security HTTP headers (prevents XSS, clickjacking, etc.)                                                          |
| `mongoSanitize()`                       | Strips `$` and `.` from request bodies to prevent **NoSQL injection**                                                  |
| `rateLimit(...)`                        | `globalLimiter`: 200 requests per 15 min; `authLimiter`: 20 requests per 15 min on `/api/auth/` — prevents brute-force |
| `cors({...})`                           | Allows only the frontend origin (localhost:3000) to call the API                                                       |
| `express.json({ limit: "10mb" })`       | Parses JSON bodies                                                                                                     |
| `morgan("dev")`                         | HTTP request logger in development                                                                                     |
| `req.io = io`                           | Attaches the Socket.io instance to every request so controllers can emit events                                        |
| `app.use("/uploads", ...)`              | Serves uploaded images as static files with `cross-origin` resource policy so Next.js can show them                    |
| `app.use("/api/auth", authRoutes)` etc. | Mounts all route modules                                                                                               |
| `initSocket(io)`                        | Sets up all Socket.io event listeners                                                                                  |
| `startAuctionScheduler(io)`             | Starts the cron job                                                                                                    |
| `app.use(errorHandler)`                 | Global error handler (must be last)                                                                                    |

---

### 2. `src/config/database.js` — MongoDB Connection

- Uses **Mongoose** to connect to MongoDB using `MONGO_URI` from `.env`
- If connection fails → `process.exit(1)` (crash the server — can't run without DB)
- **seedAdmin**: If env var `ADMIN_SEED=true`, it auto-creates the default admin account `admin@bidverse.com / Admin@123` on first boot

---

### 3. MODELS (`src/models/`) — MongoDB Schemas

#### `User.js`

| Field       | Type    | Notes                                                  |
| ----------- | ------- | ------------------------------------------------------ |
| `name`      | String  | max 60 chars                                           |
| `email`     | String  | unique, lowercase                                      |
| `password`  | String  | `select: false` — never returned in queries by default |
| `role`      | String  | `"admin"` or `"bidder"`                                |
| `credits`   | Number  | Virtual currency for bidding                           |
| `isActive`  | Boolean | Admin can deactivate users                             |
| `lastLogin` | Date    | Updated on each login                                  |

**Key methods:**

- `pre("save")` hook: Auto-hashes password with **bcrypt (cost factor 12)** before saving
- `comparePassword()`: Uses `bcrypt.compare()` to verify login
- `toJSON()`: Removes the `password` field from any JSON response

#### `Auction.js`

| Field                                       | Purpose                                      |
| ------------------------------------------- | -------------------------------------------- |
| `title`, `description`, `image`, `category` | Auction details                              |
| `startTime`, `endTime`                      | When bidding opens/closes                    |
| `minBid`, `bidIncrement`                    | Minimum first bid, minimum raise             |
| `currentBid`, `currentBidder`               | Live tracking who is winning                 |
| `status`                                    | `pending` → `active` → `ended` / `cancelled` |
| `winner`, `winningBid`, `closedAt`          | Set when auction ends                        |
| `totalBids`                                 | Counter for sorting/display                  |
| `createdBy`                                 | Reference to the admin who made it           |

**Indexes:** `{ status, endTime }` and `{ status, startTime }` — these make the scheduler's queries very fast.

**Virtual `isActive`**: Computed property, not stored in DB, that returns `true` if status is active AND current time is within the time window.

#### `Bid.js`

| Field             | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| `auction`         | Reference to Auction                                   |
| `bidder`          | Reference to User                                      |
| `amount`          | Credits spent                                          |
| `status`          | `active` (current leader), `outbid`, `won`, `returned` |
| `creditsReturned` | Prevents double-refunding credits                      |
| `isAutoBid`       | Whether this was placed by the auto-bid system         |

**Compound indexes** for fast queries like "all bids for auction X sorted by time".

#### `AutoBid.js`

| Field               | Purpose                                         |
| ------------------- | ----------------------------------------------- |
| `auction`, `bidder` | Who is auto-bidding on what (unique constraint) |
| `maxAmount`         | The maximum the system will bid on their behalf |
| `isActive`          | Can be deactivated when budget is exhausted     |

**Unique compound index** on `{ auction, bidder }` — one auto-bid setting per user per auction.

#### `Notification.js`

| Field              | Purpose                                                              |
| ------------------ | -------------------------------------------------------------------- |
| `recipient`        | User who gets the notification                                       |
| `type`             | `outbid`, `won`, `lost`, `credits_assigned`, `auction_started/ended` |
| `title`, `message` | Display text                                                         |
| `auction`          | Optional link to the auction                                         |
| `read`             | For unread count badge                                               |
| `metadata`         | Extra data (e.g., new bid amount)                                    |

---

### 4. MIDDLEWARE (`src/middleware/`)

#### `auth.js`

Two exported functions:

**`protect`** (authentication):

1. Reads `Authorization: Bearer <token>` header
2. Verifies the JWT using `JWT_SECRET`
3. Looks up the user in DB
4. Checks `isActive` status
5. Attaches `req.user` for use in controllers
6. Returns 401 if token is missing/invalid/expired

**`authorize(...roles)`** (authorization):

- Factory function that returns middleware
- Example: `authorize("admin")` blocks non-admin users with 403

#### `errorHandler.js`

Global Express error handler. Translates technical errors into clean HTTP responses:

- Mongoose `CastError` (bad ObjectId) → 400
- Mongoose duplicate key error (code 11000) → 409 Conflict
- Mongoose `ValidationError` → 400 with all field messages
- JWT `JsonWebTokenError` → 401
- In development mode, includes the stack trace in the response

---

### 5. CONTROLLERS (`src/controllers/`)

#### `authController.js`

- **`register`**: Validates input → checks for duplicate email → creates user with `role: "bidder", credits: 0` → signs JWT → returns token + user object
- **`login`**: Validates → finds user with password → `comparePassword()` → checks `isActive` → updates `lastLogin` (uses `updateOne` to bypass the pre-save hook that would re-hash the password) → signs JWT
- **`getMe`**: Returns the current user's full profile (protected route)

**`signToken(id)`**: Creates a JWT with just the user's `_id`, signed with `JWT_SECRET`, expires in `JWT_EXPIRE` (default 7 days)

#### `auctionController.js`

- **`getAuctions`**: Pagination + filtering by status, category, search (regex). Returns `{ data, pagination }`.
- **`getAuction`**: Single auction + last 50 bids, both populated with user names.
- **`createAuction`**: Validates dates, sets status to `active` if start time is already past, emits `auction_created` socket event.
- **`updateAuction`**: Blocks critical field changes once bidding has started (only `description` and `image` can be edited).
- **`deleteAuction`**: Marks as `cancelled`, refunds all active bids' credits to bidders.
- **`finalizeAuction`**: Called by scheduler when auction time ends — sets winner, marks winning bid, marks losing bids as `lost`, notifies winner and losers, emits socket events.

#### `bidController.js` — Most Complex Controller

**`_executeBidInternal(auctionId, bidderId, amount, io, isAutoBid, suppressChain)`**:
This private async function is the core bidding engine. Steps:

1. Fetch auction and validate it's active and in time window
2. Calculate `minRequired = max(minBid, currentBid + bidIncrement)`
3. Validate amount ≥ minRequired
4. Fetch bidder, check they have enough credits
5. Find the previous active bid
6. If previous bidder is different: refund their credits, create `outbid` notification, send socket event to their user room
7. If same user (self-raise): refund only their own previous bid
8. Deduct credits from new bidder
9. Create new `Bid` document with `status: "active"`
10. Update auction's `currentBid`, `currentBidder`, `totalBids`
11. Emit `new_bid` to the auction room AND `live_bid_update` to admin room
12. Unless `suppressChain`, trigger auto-bid for the outbid user via `setImmediate`

**`_triggerAutoBid(...)`**:
The auto-bid chain engine. Runs up to 20 rounds between competing auto-bidders:

1. Checks and sets a per-auction lock (prevents race conditions)
2. Loops: find the outbid user's AutoBid config → calculate next amount → if over their max, deactivate and notify → otherwise call `_executeBidInternal` with `suppressChain=true`
3. 300ms delay between rounds to prevent server overload
4. Lock is released in `finally` block

**`placeBid`**: HTTP endpoint that validates the request then calls `_executeBidInternal`

**`setAutoBid`**: Uses `findOneAndUpdate` with `upsert: true` to create or update the auto-bid for a user

**`getMyBids`**: Returns the authenticated bidder's bid history with auction details populated

#### `adminController.js`

- **`getAllUsers`**: Lists all bidders with stats (total bids placed, auctions won) — uses `Promise.all` to fetch stats in parallel
- **`assignCredits`**: Supports `set`, `add`, `subtract` operations on a user's credits, then sends a `credits_assigned` notification
- **`toggleUserStatus`**: Flips `isActive` true/false
- **`getStats`**: Uses `Promise.all` for 7 parallel DB queries. Also uses MongoDB **aggregation pipeline** for:
  - Total credits in circulation: `$group` with `$sum`
  - Bids per day (last 7 days): `$match` → `$group` by date string → `$sort`
  - Top 5 auctions by bid count

#### `userController.js`

- **`getProfile`**: Get own profile
- **`updateProfile`**: Update name/avatar only
- **`getNotifications`**: Paginated notifications with `unreadCount`
- **`markNotificationsRead`**: Can mark specific IDs or all at once

---

### 6. ROUTES (`src/routes/`)

| File          | Base Path       | Key Routes                                                           |
| ------------- | --------------- | -------------------------------------------------------------------- |
| `auth.js`     | `/api/auth`     | POST `/register`, POST `/login`, GET `/me`                           |
| `auctions.js` | `/api/auctions` | GET `/`, GET `/:id`, POST `/`, PUT `/:id`, DELETE `/:id`             |
| `bids.js`     | `/api/bids`     | POST `/`, GET `/my`, GET `/auction/:id`, POST/GET/DELETE `/autobid`  |
| `admin.js`    | `/api/admin`    | GET `/stats`, GET `/users`, PUT `/users/:id/credits`, GET `/reports` |
| `users.js`    | `/api/users`    | GET/PUT `/profile`, GET `/notifications`, PUT `/notifications/read`  |
| `upload.js`   | `/api/upload`   | POST `/image` (admin only)                                           |

All bidder routes use `protect, authorize("bidder")`. All admin routes use `protect, authorize("admin")`.

#### `upload.js` in detail

Uses **Multer** for file uploads:

- `multer.diskStorage` saves files to `backend/uploads/` folder
- Filename is a **UUID** + original extension (security: prevents path traversal)
- `fileFilter` blocks non-image MIME types
- 5 MB size limit
- Returns the public URL: `http://localhost:5000/uploads/<uuid>.jpg`

---

### 7. `socket/socketHandler.js` — WebSocket Server

**Socket.io middleware** (runs on every new connection):

- Reads JWT from `socket.handshake.auth.token`
- If valid: sets `socket.userId` and allows connection
- If no token: allows connection as anonymous (for browsing public auctions)

**Event handlers:**
| Event (client → server) | What it does |
|---|---|
| `join_auction` | `socket.join("auction:{id}")` — subscribe to that auction's bids |
| `leave_auction` | `socket.leave("auction:{id}")` |
| `join_admin` | `socket.join("admin_room")` — admin live dashboard |
| `leave_admin` | Leave admin room |
| `ping` | Server replies with `pong` + timestamp |
| `disconnect` | Removes user from `connectedUsers` map |

**Events emitted (server → clients):**
| Event | Who receives it | Trigger |
|---|---|---|
| `new_bid` | Everyone in `auction:{id}` room | New bid placed |
| `live_bid_update` | Admin room | New bid placed |
| `auction_created` | All connected clients | Admin creates auction |
| `auction_updated` | All connected clients | Admin edits auction |
| `auction_activated` | All connected clients | Scheduler starts auction |
| `auction_ended` | All connected clients | Scheduler ends auction |
| `notification` | Specific `user:{id}` room | Outbid, won, etc. |

---

### 8. `utils/auctionScheduler.js` — Cron Job

Uses **`node-cron`** to run every minute (`"* * * * *"`):

1. **Activate** pending auctions: finds all with `status: "pending"` AND `startTime <= now`, sets them to `active`, emits `auction_activated`
2. **End** active auctions: finds all with `status: "active"` AND `endTime <= now`, calls `finalizeAuction()` for each

---

## FRONTEND — `frontend/`

Built with **Next.js 14 App Router**. All client components are marked `"use client"`.

---

### 1. `src/app/layout.js` — Root Layout

- Sets `<html lang="en">` with the Inter font via `next/font/google`
- Sets page `<title>` and meta tags via the `metadata` export
- Wraps everything in `<Providers>` so all context is available globally

### 2. `src/app/providers.jsx` — Context Tree

The provider nesting order matters:

```
CacheProvider (Chakra + Emotion CSS cache)
  ChakraProvider (theme)
    ColorModeScript (forces dark mode)
      AuthProvider  ← must be outermost
        SocketProvider  ← needs auth to know if authenticated
          NotificationProvider  ← needs both auth and socket
            {children}
            <Toaster />  ← global toast notifications
```

---

### 3. CONTEXTS (`src/context/`)

#### `AuthContext.jsx`

State: `user` object, `loading` boolean

- **On mount**: Reads `bv_token` + `bv_user` from `localStorage`. If found, sets user from storage immediately (fast), then verifies by hitting `/api/auth/me` (background). If the token is invalid, clears storage.
- **`login()`**: Calls API, stores token + user in localStorage, calls `reconnectSocket(token)` to upgrade the socket connection with auth
- **`register()`**: Same as login flow
- **`logout()`**: Clears localStorage, calls `disconnectSocket()`, redirects to `/auth/login`
- **`updateUser()`**: Merges partial updates into user state and syncs to localStorage (used when credits change after a bid)

Exposes: `user`, `loading`, `login`, `register`, `logout`, `updateUser`, `isAdmin`, `isBidder`, `isAuthenticated`

#### `SocketContext.jsx`

- Creates/retrieves the socket using `getSocket()` from `lib/socket.js`
- Tracks `connected` boolean state
- Exposes `joinAuction(id)`, `leaveAuction(id)`, `joinAdmin()`, `on(event, handler)`, `off(event, handler)`
- `on()` returns a cleanup function (used in `useEffect` returns to unsubscribe)

#### `NotificationContext.jsx`

- On mount (when authenticated): fetches last 20 notifications from API, sets `unreadCount`
- Listens on socket `"notification"` event → prepends to list + increments count + shows a **react-hot-toast** popup
- **`markAllRead()`**: Calls API then updates local state
- **`markRead(ids)`**: Marks specific notifications

---

### 4. `src/lib/`

#### `api.js` — Axios Instance + API Functions

- Creates an `axios` instance with base URL from `NEXT_PUBLIC_API_URL` env var
- **Request interceptor**: Attaches `Authorization: Bearer <token>` to every request automatically
- **Response interceptor**: On 401 (except `/auth/me` checks and when already on login page), clears localStorage and redirects to login
- Exports organized API objects: `authApi`, `auctionsApi`, `bidsApi`, `adminApi`, `uploadApi`, `usersApi`

#### `socket.js` — Socket.io Client Singleton

- Module-level `socket` variable — only one socket instance exists (singleton pattern)
- `getSocket()`: Creates the socket if null, using the stored JWT token as auth
- `disconnectSocket()`: Disconnects and sets `socket = null`
- `reconnectSocket(token)`: Disconnects old socket (anonymous/old token) and creates new one with the fresh token — called after login

#### `auctionPdf.js` — PDF Report Generator

- Uses **jsPDF** + **jspdf-autotable** (dynamically imported to avoid loading them on every page)
- Generates a styled A4 PDF with:
  - Brand header banner
  - Auction title, category, status
  - Description text
  - Key stats grid (start/end time, bids, winning bid, winner)
  - Full bid history table (bidder name, amount, date, status)

---

### 5. `src/hooks/useCountdown.js`

Custom React hook that:

- Calculates `days, hours, minutes, seconds` remaining until `endTime`
- Sets an interval every 1 second to update the countdown
- Clears the interval when `isExpired` is true (auction ended)
- Sets `isUrgent = true` when less than 5 minutes remain (triggers red color UI)

---

### 6. COMPONENTS

#### `ui/Navbar.jsx`

- Fixed position navbar with glassmorphism effect (`backdrop-filter: blur(20px)`)
- Shows different links for admin vs bidder (reads from `useAuth`)
- Shows `NotificationBell` and `CreditBadge` for authenticated users
- Has a hamburger drawer for mobile view
- Uses `usePathname()` to highlight the active link

#### `ui/CountdownTimer.jsx`

- Uses `useCountdown` hook
- Displays `DD:HH:MM:SS` in a styled grid
- Shows "Ended" / "Cancelled" / "Starting Soon" states
- Turns red when `isUrgent` (< 5 min)
- Uses **Framer Motion** `AnimatePresence` for the digit flip animation

#### `ui/AuctionCard.jsx`

- Card component showing auction image, title, category badge, current bid, time remaining, total bids
- Status color-coded badge

#### `ui/StatCard.jsx`

- Reusable stat display card used in dashboards (total bids, total users, etc.)

#### `ui/CreditBadge.jsx`

- Shows the user's current credit balance in the navbar

#### `ui/NotificationBell.jsx`

- Bell icon with unread count badge
- Popover showing the notification list
- Mark all read button

#### `bidder/PlaceBidModal.jsx`

- Modal for placing a manual bid
- Fetches smart bid suggestions from `/api/bids/suggestions/:id`
- Validates amount ≥ minimum required AND user has enough credits
- Shows quick-pick suggestion buttons
- On success: calls `updateUser()` to update credits in navbar without page refresh

#### `bidder/AutoBidModal.jsx`

- Modal to set/update/cancel auto-bid
- Fetches existing auto-bid config when opened
- Shows current budget if already active
- Cancel button deactivates the auto-bid

#### `admin/AuctionForm.jsx`

- Form for creating and editing auctions
- Fields: title, description, category, image (upload or URL), start/end time, minBid, bidIncrement
- Uses `react-hook-form` for form state management

#### `admin/LiveBidMonitor.jsx`

- Real-time bid activity table on the admin dashboard
- Listens to `live_bid_update` socket event

#### `admin/DeclareWinnerModal.jsx`

- Admin can manually close an auction early

#### `admin/UserCreditsModal.jsx`

- Modal for admin to assign/add/subtract credits to a bidder

---

### 7. PAGE STRUCTURE (`src/app/`)

#### Route Groups

- `(bidder)/` — Route group (the folder name doesn't appear in URLs). Contains all bidder pages. The `layout.jsx` here adds a redirect guard redirecting non-bidders to login.
- `admin/` — Admin pages. The `layout.jsx` redirects non-admins.
- `auth/` — Login and registration pages (public).

#### Key Pages

| Page                              | Path                     | What it does                            |
| --------------------------------- | ------------------------ | --------------------------------------- |
| `app/page.jsx`                    | `/`                      | Landing page — redirects based on role  |
| `(bidder)/auctions/page.jsx`      | `/auctions`              | Browse all auctions with filters        |
| `(bidder)/auctions/[id]/page.jsx` | `/auctions/:id`          | Live auction detail with real-time bids |
| `(bidder)/dashboard/page.jsx`     | `/dashboard`             | Bidder's stats + active bids            |
| `(bidder)/history/page.jsx`       | `/history`               | Full bid history                        |
| `(bidder)/notifications/page.jsx` | `/notifications`         | Notifications list                      |
| `admin/page.jsx`                  | `/admin`                 | Admin dashboard with charts             |
| `admin/auctions/page.jsx`         | `/admin/auctions`        | Manage all auctions                     |
| `admin/auctions/create/page.jsx`  | `/admin/auctions/create` | Create new auction                      |
| `admin/auctions/[id]/page.jsx`    | `/admin/auctions/:id`    | Edit auction + live bid monitor         |
| `admin/users/page.jsx`            | `/admin/users`           | Manage bidders, assign credits          |
| `admin/reports/page.jsx`          | `/admin/reports`         | Download PDF reports                    |
| `auth/login/page.jsx`             | `/auth/login`            | Login form                              |
| `auth/register/page.jsx`          | `/auth/register`         | Registration form                       |

---

### 8. `src/theme/index.js` — Chakra UI Theme

Uses `extendTheme()` to create a custom dark theme:

- **`brand`**: Blue palette (`#1D72F5` as primary)
- **`gold`**: Gold palette (`#FFD700`) for auction highlights
- **`cyber`**: Cyan palette (`#00D4FF`) for accents
- **`dark`**: Dark backgrounds (`#0A0A0F` page, `#1E1E2E` cards)
- **Fonts**: Inter for UI, JetBrains Mono for numbers
- **Global styles**: Dark background, custom scrollbar styling
- **`config`**: `initialColorMode: "dark"`, `useSystemColorMode: false` — always dark

---

## NPM PACKAGES — Full Reference

### Backend

| Package                  | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `express`                | HTTP server framework                                         |
| `socket.io`              | WebSocket server                                              |
| `mongoose`               | MongoDB ODM (Object Document Mapper)                          |
| `bcryptjs`               | Password hashing                                              |
| `jsonwebtoken`           | JWT creation and verification                                 |
| `cors`                   | Cross-Origin Resource Sharing headers                         |
| `helmet`                 | Security HTTP headers                                         |
| `express-mongo-sanitize` | Prevents NoSQL injection attacks                              |
| `express-rate-limit`     | Rate limiting middleware                                      |
| `express-validator`      | Input validation and sanitization                             |
| `morgan`                 | HTTP request logger                                           |
| `multer`                 | File upload handling (multipart/form-data)                    |
| `node-cron`              | Cron job scheduler (runs auction status updates every minute) |
| `dotenv`                 | Loads `.env` file into `process.env`                          |
| `uuid`                   | Generates unique filenames for uploads                        |
| `nodemon`                | Dev server auto-restart on file changes                       |

### Frontend

| Package                                               | Purpose                                                  |
| ----------------------------------------------------- | -------------------------------------------------------- |
| `next`                                                | React framework with App Router, SSR, file-based routing |
| `react`, `react-dom`                                  | Core React library                                       |
| `@chakra-ui/react`                                    | Component library (buttons, modals, tables, etc.)        |
| `@chakra-ui/next-js`                                  | Chakra's Next.js adapter (CacheProvider)                 |
| `@emotion/react`, `@emotion/styled`, `@emotion/cache` | CSS-in-JS engine (Chakra UI's styling engine)            |
| `framer-motion`                                       | Animation library (countdown flip, page transitions)     |
| `axios`                                               | HTTP client for API calls                                |
| `socket.io-client`                                    | WebSocket client                                         |
| `react-hot-toast`                                     | Toast notifications                                      |
| `react-hook-form`                                     | Form state management and validation                     |
| `recharts`                                            | Charts library (Area chart on admin dashboard)           |
| `jspdf`                                               | PDF generation                                           |
| `jspdf-autotable`                                     | Table plugin for jsPDF                                   |
| `date-fns`                                            | Date formatting (`formatDistanceToNow`, `format`)        |

---

## KEY FLOWS TO KNOW FOR EVALUATION

### Flow 1: User Registration

```
Register page
→ authApi.register()
→ POST /api/auth/register
→ express-validator validates
→ check duplicate email
→ User.create()
→ bcrypt hashes password (pre-save hook)
→ sign JWT
→ return token
→ stored in localStorage
→ reconnectSocket(token)
```

### Flow 2: Placing a Bid

```
PlaceBidModal
→ bidsApi.place()
→ POST /api/bids
→ protect middleware verifies JWT
→ authorize("bidder") checks role
→ placeBid controller validates
→ calls _executeBidInternal
→ refund previous bidder
→ deduct new bidder's credits
→ save Bid document
→ update Auction document
→ emit new_bid socket event
→ all watchers' UI updates in real time
→ if previous bidder has auto-bid → _triggerAutoBid chain fires
```

### Flow 3: Auction Ending

```
node-cron runs every minute
→ finds active auctions where endTime <= now
→ calls finalizeAuction(auction, io)
→ sets winner = currentBidder
→ marks their bid as "won"
→ marks all other active bids as "lost"
→ refunds other bidders' credits
→ creates "won" notification for winner
→ creates "lost" notifications for others
→ emits auction_ended socket event
```

### Flow 4: Real-time Notifications

```
Server calls io.to("user:{id}").emit("notification", {...})
→ SocketContext.on("notification", handler) in NotificationContext receives it
→ prepends to notifications list
→ increments unread count badge
→ shows react-hot-toast popup with icon
```

### Flow 5: Auto-Bid Chain

```
User A sets auto-bid max=100
→ User B manually bids 50
→ _executeBidInternal outbids A
→ A's notification fires
→ setImmediate(() => _triggerAutoBid(...))
→ system calculates autoAmount = 50 + increment
→ if <= 100, calls _executeBidInternal for A
→ now B is outbid
→ if B also has auto-bid, loop continues up to 20 rounds with 300ms delay
```

---

---

# PART 2 — ADMIN, BIDDER & SYSTEM FEATURES

---

## 👑 ADMIN — Complete Workflow

### Who is an Admin?

- A user with `role: "admin"` in the database
- Created only via the `seedAdmin()` function in `database.js` with credentials `admin@bidverse.com / Admin@123`
- **Cannot self-register** — the register endpoint always creates `role: "bidder"`
- Every admin route is protected by `protect` + `authorize("admin")` middleware

---

### Admin Feature 1: Login

```
/auth/login page
→ POST /api/auth/login
→ Returns JWT token + user object with role: "admin"
→ Stored in localStorage as bv_token, bv_user
→ AuthContext sets isAdmin = true
→ Navbar shows Admin links (Dashboard, Auctions, Bidders, Reports)
→ (bidder) route group layout redirects admin away from bidder pages
```

---

### Admin Feature 2: Dashboard (`/admin`)

**What loads:**

- `GET /api/admin/stats` — runs 7 DB queries in parallel using `Promise.all`:

| Stat             | Query                                           |
| ---------------- | ----------------------------------------------- |
| Total Auctions   | `Auction.countDocuments()`                      |
| Active Auctions  | `Auction.countDocuments({ status: "active" })`  |
| Ended Auctions   | `Auction.countDocuments({ status: "ended" })`   |
| Pending Auctions | `Auction.countDocuments({ status: "pending" })` |
| Total Bidders    | `User.countDocuments({ role: "bidder" })`       |
| Total Bids       | `Bid.countDocuments()`                          |
| Recent 10 Bids   | Populated with bidder name + auction title      |

**Also uses MongoDB Aggregation Pipelines:**

- **Credits in circulation**: Groups all bidders, sums their `credits` field
- **Bids per day (last 7 days)**: Groups bids by date string (`$dateToString`), counts per day — used for the **Recharts AreaChart**
- **Top 5 Auctions**: Sorted by `totalBids` descending

**Real-time updates:**

- Listens on `live_bid_update` socket event → re-fetches stats automatically whenever a new bid lands

---

### Admin Feature 3: Create Auction (`/admin/auctions/create`)

```
AuctionForm.jsx fills: title, description, category, startTime, endTime, minBid, bidIncrement, image
→ Image can be uploaded via POST /api/upload/image (Multer saves file as UUID.ext)
  OR entered as a direct URL
→ POST /api/auctions (admin only)
→ createAuction controller:
   - Validates endTime > startTime and endTime > now
   - If startTime is already past → sets status: "active" immediately
   - If startTime is future → sets status: "pending"
   - Saves to DB
   - Emits auction_created socket event to ALL connected clients
```

---

### Admin Feature 4: Manage Auctions (`/admin/auctions`)

Lists all auctions. Admin can:

- **Edit**: `PUT /api/auctions/:id`
  - Blocked entirely if auction is `ended` or `cancelled`
  - If auction is `active` and has bids → only `description` and `image` can be changed (protecting bid integrity)
- **Cancel**: `DELETE /api/auctions/:id`
  - If there are active bids → refunds ALL bidders' credits before cancelling
  - Sets `status: "cancelled"`
- **Declare winner early**: `DeclareWinnerModal` → `POST /api/auctions/:id/close` → calls `finalizeAuction()`

---

### Admin Feature 5: Live Bid Monitor (`/admin/auctions/[id]`)

- `LiveBidMonitor.jsx` joins the `admin_room` socket room via `joinAdmin()`
- Listens to `live_bid_update` — shows a real-time scrolling table of every bid as it happens
- Shows bidder name, amount, timestamp, auction name

---

### Admin Feature 6: Manage Bidders (`/admin/users`)

```
GET /api/admin/users
→ Returns all users with role: "bidder"
→ Each user has totalBids + wonBids counts attached (via Promise.all)
→ Searchable by name or email
```

**Actions per bidder:**

- **Assign Credits** → `UserCreditsModal.jsx`
  - Three modes: `set` (override), `add` (top up), `subtract` (deduct)
  - `PUT /api/admin/users/:id/credits`
  - Creates a `credits_assigned` notification for the bidder
  - Bidder gets a real-time toast popup via socket
- **Toggle Active Status** → `PUT /api/admin/users/:id/toggle-status`
  - Deactivated users cannot log in (blocked even if token is valid — `protect` middleware checks `isActive`)

---

### Admin Feature 7: Reports (`/admin/reports`)

```
GET /api/admin/reports → list of all ended auctions with summary stats
GET /api/admin/reports/:auctionId → full detail with bid history

→ downloadAuctionPDF(auction, bids) in auctionPdf.js:
   - Dynamically imports jsPDF + jspdf-autotable
   - Generates A4 PDF with:
     * Brand header (blue banner)
     * Auction title, category, status, generated date
     * Description text
     * Stats grid: start/end time, min bid, total bids, winning bid, winner name
     * Full bid history table: rank, bidder, amount, date, status
   - Auto-downloads in browser
```

---

## 🙋 BIDDER — Complete Workflow

### Who is a Bidder?

- Any user who self-registers via `/auth/register`
- Gets `role: "bidder"` and `credits: 0` by default
- Admin must assign credits before they can bid
- All bidder routes are under the `(bidder)` route group with `protect` + `authorize("bidder")`

---

### Bidder Feature 1: Register & Login

```
/auth/register page
→ react-hook-form collects name, email, password
→ POST /api/auth/register
→ express-validator validates: name not empty, valid email, password >= 6 chars
→ Checks for duplicate email (409 if exists)
→ User.create() → bcrypt hashes password (pre-save hook, cost factor 12)
→ signToken(user._id) → JWT expires in 7 days
→ Returns token + user
→ AuthContext stores in localStorage
→ reconnectSocket(token) — upgrades socket to authenticated
→ Redirected to /dashboard
```

---

### Bidder Feature 2: Dashboard (`/dashboard`)

**What loads:**

- `GET /api/bids/my?limit=10` — last 10 bids with auction details populated

**Displays:**

- Total credits balance (from `AuthContext` user state)
- Count of `active` bids (currently winning)
- Count of `won` bids (auctions won)
- Count of `outbid` bids
- List of recent bids as `AuctionCard` components

**Real-time:**

- Listens on `notification` socket event
- If type is `outbid` or `won` → re-fetches bids to update the cards

---

### Bidder Feature 3: Browse Auctions (`/auctions`)

```
GET /api/auctions?status=active&category=Art&search=watch&page=1&limit=12
→ Returns paginated auctions
→ Filters: status dropdown, category dropdown, search box (regex on title + description)
→ Sort options: newest, oldest, ending soon, most bids
→ Each auction shows: image, title, current bid, time remaining (CountdownTimer), total bids
→ Pagination controls
```

---

### Bidder Feature 4: View Auction Detail (`/auctions/[id]`)

**On page load:**

1. `GET /api/auctions/:id` — full auction data
2. `GET /api/bids/auction/:id` — last 50 bids with bidder names
3. `GET /api/bids/autobid/:id` — checks if user has active auto-bid
4. `socket.emit("join_auction", { auctionId })` — joins the real-time room

**Live updates via Socket:**

- `new_bid` event → prepends new bid to the list, updates current bid and bidder, flashes an animation
- `auction_ended` event → shows "Auction Ended" state, disables bid buttons

**Bid buttons shown only when:**

- Auction is `active`
- User is authenticated
- User is NOT the creator (admin can't bid)
- User does NOT already have the leading bid (shows "You're Winning!" instead)

---

### Bidder Feature 5: Place a Bid (`PlaceBidModal`)

```
Click "Place Bid" → PlaceBidModal opens
→ Fetches GET /api/bids/suggestions/:id → smart suggestions (e.g., min bid, +5%, +10%)
→ Shows quick-pick suggestion buttons
→ NumberInput for custom amount
→ Real-time validation:
   * amount >= (currentBid + bidIncrement)
   * user.credits >= amount
   * Both shown as colored alerts (green/red)
→ Click "Confirm" → POST /api/bids { auctionId, amount }
→ Backend _executeBidInternal():
   1. Re-validates everything server-side
   2. Refunds previous bidder's credits
   3. Deducts from new bidder's credits
   4. Creates Bid document
   5. Updates auction.currentBid, currentBidder, totalBids
   6. Emits new_bid to everyone watching
→ Frontend: updateUser({ credits: remainingCredits }) → navbar updates immediately
→ Toast: "Bid placed successfully!"
```

---

### Bidder Feature 6: Auto-Bid (`AutoBidModal`)

```
Click "Auto-Bid" → AutoBidModal opens
→ Fetches existing auto-bid config if any
→ User sets a maxAmount (ceiling they're willing to bid)
→ POST /api/bids/autobid { auctionId, maxAmount }
→ Saves to AutoBid collection (upsert — one per user per auction)

WHEN TRIGGERED (server-side, _triggerAutoBid):
1. Someone outbids the user
2. _executeBidInternal emits setImmediate → _triggerAutoBid runs
3. Finds user's AutoBid config
4. Calculates autoAmount = currentBid + bidIncrement
5. If autoAmount <= maxAmount → places auto-bid automatically
6. Loop continues (up to 20 rounds) if competitor also has auto-bid
7. If maxAmount exhausted → AutoBid.isActive = false, sends "limit reached" notification
```

**Cancel Auto-Bid:**

- `DELETE /api/bids/autobid/:auctionId` → sets `isActive: false`
- Button shown in modal if auto-bid is active

---

### Bidder Feature 7: Bid History (`/history`)

```
GET /api/bids/my?page=1&limit=20
→ All bids by this user, sorted newest first
→ Populated with auction title, image, endTime, status
→ Shows filter tabs: All / Active / Won / Outbid / Lost
→ Each row: auction image + title, bid amount, date, status badge
```

Status badge colors:

- `active` → green (currently winning)
- `won` → gold (auction won!)
- `outbid` → orange (someone bid higher)
- `lost` → red (auction ended, didn't win)
- `returned` → gray (credits refunded after cancellation)

---

### Bidder Feature 8: Notifications (`/notifications`)

**Sources of notifications:**
| Notification Type | When Created |
|---|---|
| `outbid` | Someone bids higher than you |
| `won` | Auction ends and you had the top bid |
| `lost` | Auction ends and you didn't win |
| `credits_assigned` | Admin changes your credit balance |
| `auction_started` | An auction you're watching goes live |
| `auction_ended` | An auction ends |

**Delivery:**

1. **Stored in DB** (Notification collection) — persistent, survives page refresh
2. **Real-time** via `socket.to("user:{id}").emit("notification", {...})` — instant toast popup

**NotificationBell in Navbar:**

- Shows red badge with unread count
- Click → popover with last 20 notifications
- "Mark all read" button → `PUT /api/users/notifications/read { all: true }`

---

## ⚙️ SYSTEM-LEVEL FEATURES

---

### Feature: Auction Lifecycle (Automatic via Cron)

```
node-cron runs every 60 seconds:

STEP 1 — Activate pending auctions:
  DB Query: { status: "pending", startTime: { $lte: now } }
  → Sets status: "active"
  → Emits auction_activated to all clients
  → All browsing users see the auction go live instantly

STEP 2 — End active auctions:
  DB Query: { status: "active", endTime: { $lte: now } }
  → Calls finalizeAuction(auction, io):
     1. Sets auction.status = "ended"
     2. auction.winner = auction.currentBidder
     3. auction.winningBid = auction.currentBid
     4. auction.closedAt = now
     5. Marks winning Bid.status = "won"
     6. Marks all other active/outbid Bids as "lost"
     7. Creates "won" notification for winner
     8. Creates "lost" notifications for all other participants
     9. Emits auction_ended to all connected clients
```

---

### Feature: Credit System

Credits are **virtual currency**, stored as a `Number` on the `User` document.

| Action                | Credit Change                                          |
| --------------------- | ------------------------------------------------------ |
| Admin assigns credits | `user.credits += amount`                               |
| User places a bid     | `user.credits -= bidAmount`                            |
| User gets outbid      | `user.credits += previousBid.amount` (refund)          |
| Auction cancelled     | All active bidders refunded                            |
| Auto-bid exhausted    | No extra deduction — credits already allocated per bid |

**Safety:** `creditsReturned` flag on each Bid prevents double-refunding if the scheduler runs twice.

---

### Feature: Security Stack

| Layer              | Implementation                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------- |
| Password storage   | bcrypt with cost factor 12 (computationally expensive to crack)                           |
| Authentication     | JWT (stateless, 7-day expiry)                                                             |
| Authorization      | Role middleware (`protect` + `authorize`) on every protected route                        |
| NoSQL Injection    | `express-mongo-sanitize` strips `$` and `.` from all request bodies                       |
| XSS — HTTP headers | `helmet` sets `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy` etc. |
| Rate Limiting      | 200 req/15min globally, 20 req/15min on auth routes (brute-force protection)              |
| File Uploads       | Only JPEG/PNG/WebP/GIF allowed, max 5MB, filename is UUID (prevents path traversal)       |
| CORS               | Only allows the configured `CLIENT_URL` origin                                            |
| Token expiry       | 401 response clears localStorage and redirects to login automatically                     |

---

### Feature: Real-time Architecture

```
Socket.io Rooms:
┌─────────────────────────────────┐
│  auction:{id}                   │  ← All viewers of a specific auction
│  user:{id}                      │  ← Private channel per logged-in user
│  admin_room                     │  ← All admin dashboard viewers
└─────────────────────────────────┘

Flow:
Browser joins room
→ Server stores socket in room
→ Server emits to room
→ Only members receive it

Anonymous users CAN join auction rooms (public watching)
Authenticated users get personal user:{id} room for notifications
Admins join admin_room for live bid monitor
```

---

### Feature: Image Upload Flow

```
Admin picks file in AuctionForm
→ uploadApi.uploadImage(file)
→ POST /api/upload/image (multipart/form-data)
→ Multer middleware:
   1. Checks MIME type (JPEG/PNG/WebP/GIF only)
   2. Checks size (max 5MB)
   3. Saves to backend/uploads/ with UUID filename
→ Returns URL: http://localhost:5000/uploads/{uuid}.jpg
→ This URL is stored in auction.image field
→ Frontend shows via <Image> tag
→ Backend serves it via express.static("/uploads")
   with Cross-Origin-Resource-Policy: cross-origin header
   so Next.js (different port) can load it
```

---

### Feature: PDF Report Generation

```
Admin clicks "Download Report" on /admin/reports
→ GET /api/admin/reports/:auctionId → fetches all bids
→ auctionPdf.js (client-side):
   → Dynamically imports jsPDF only when needed (lazy loading)
   → Builds PDF in memory:
      * Blue header banner
      * Title, category, status, generation timestamp
      * Description paragraph
      * Stats table: timing, bid counts, winner
      * Full bid history table (jspdf-autotable)
   → doc.save("auction-report.pdf") → triggers browser download
```

---

### Feature: Form Validation (Two Layers)

**Layer 1 — Frontend (react-hook-form):**

- Required field checks
- Min/max length
- Pattern matching (email format)
- Shows inline error messages before submission

**Layer 2 — Backend (express-validator):**

- `body("email").isEmail().normalizeEmail()`
- `body("password").isLength({ min: 6 })`
- `validationResult(req)` checked at top of every controller
- Returns 400 with array of error messages if invalid
- This layer protects against direct API calls that bypass the UI

---

### Feature: Route Guards (`next/navigation`)

Both layout files check authentication:

**`(bidder)/layout.jsx`:**

```
if (!isAuthenticated) → redirect to /auth/login
if (isAdmin) → redirect to /admin
Shows <Navbar> + {children}
```

**`admin/layout.jsx`:**

```
if (!isAuthenticated) → redirect to /auth/login
if (!isAdmin) → redirect to /dashboard
Shows <Navbar> + {children}
```

This means even if someone manually types `/admin` in the URL, they get redirected instantly client-side before any data is loaded.
