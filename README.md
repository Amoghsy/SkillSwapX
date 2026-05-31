# SkillSwap X — PHP Backend

Complete REST API backend for the SkillSwap X platform. Built in **PHP 8.1** with a **MySQL 8.0** database, zero external PHP dependencies.

---

## Folder Structure

```
skillswapx-backend/
├── index.php                    ← Front controller / router
├── .htaccess                    ← Apache URL rewriting
├── .env.example                 ← Copy to .env and fill in values
│
├── config/
│   ├── config.php               ← App constants, CORS, .env loader
│   └── database.php             ← PDO singleton
│
├── helpers/
│   ├── jwt.php                  ← JWT encode/decode (no library needed)
│   └── response.php             ← json_success(), json_error(), validate()
│
├── middleware/
│   └── auth.php                 ← requireAuth() / requireAdmin()
│
├── api/
│   ├── auth/                    ← register, login, refresh, logout
│   ├── users/                   ← me, profile, update, notifications
│   ├── skills/                  ← list, search, user_add, user_list, user_delete
│   ├── swaps/                   ← create, list, get, accept, reject, cancel
│   ├── sessions/                ← list, complete, feedback
│   ├── credits/                 ← balance, history
│   ├── circles/                 ← create, list, nearby, get, join, leave
│   └── roadmap/                 ← generate (proxies to Python AI service)
│
├── migrations/
│   └── 001_schema.sql           ← Full database schema (run this first)
│
└── frontend-integration/
    └── api.js                   ← Drop into your React src/services/ folder
```

---

## Quick Setup

### 1. Database
```bash
mysql -u root -p -e "source migrations/001_schema.sql"
```

### 2. Environment
```bash
cp .env.example .env
# Edit .env with your MySQL password and a random JWT_SECRET
```

Generate a secure JWT secret:
```bash
openssl rand -hex 32
```

### 3. PHP Server (development)
```bash
# Apache: place backend in /var/www/html/api  (or virtual host)
# OR built-in PHP server for quick testing:
php -S localhost:8080 index.php
```

> **Apache note:** Make sure `mod_rewrite` is enabled and `AllowOverride All` is set for the directory.

### 4. Connect to your React frontend
Copy `frontend-integration/api.js` into your project:
```bash
cp frontend-integration/api.js ../echo-skill-connect/src/services/api.js
```

Add to your React `.env`:
```
VITE_API_URL=http://localhost:8080/api
```

Then import in any component:
```js
import { auth, swaps, skills, credits, circles } from '@/services/api';

// Login
const { user, access_token } = await auth.login(email, password);

// Search skills
const results = await skills.search({ q: 'React', category: 'Technology' });

// Send a swap request
await swaps.create({
  receiver_id: 5,
  skill_requested_id: 2,
  skill_offered_id: 8,
  message: "Would love to swap Python for React!",
});
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user (gets 10 welcome credits) |
| POST | `/api/auth/login` | — | Login, returns JWT + refresh token |
| POST | `/api/auth/refresh` | — | Rotate refresh token |
| POST | `/api/auth/logout` | ✓ | Invalidate refresh token |
| GET | `/api/users/me` | ✓ | Get own profile + skills |
| PUT | `/api/users/me` | ✓ | Update profile / change password |
| GET | `/api/users/:id/profile` | — | Public profile |
| GET | `/api/skills` | — | Master skill list |
| GET | `/api/skills/search` | — | Search skill listings (`?q=&category=&trust_tier=&page=`) |
| POST | `/api/skills/user` | ✓ | Add skill to own profile |
| GET | `/api/skills/user` | ✓ | Get own skills |
| POST | `/api/swaps/request` | ✓ | Create swap + lock credits in escrow |
| GET | `/api/swaps` | ✓ | List swaps (`?status=&role=sender\|receiver`) |
| PUT | `/api/swaps/:id/accept` | ✓ | Accept swap, schedule session |
| PUT | `/api/swaps/:id/reject` | ✓ | Reject swap |
| PUT | `/api/swaps/:id/cancel` | ✓ | Cancel + refund credits |
| PUT | `/api/sessions/:id/complete` | ✓ | Complete session, release escrow |
| POST | `/api/sessions/:id/feedback` | ✓ | Submit feedback (1-5), updates trust score |
| GET | `/api/credits/balance` | ✓ | Available + locked credits |
| GET | `/api/credits/history` | ✓ | Transaction log |
| POST | `/api/circles` | ✓ | Create skill circle |
| GET | `/api/circles/nearby` | — | Nearby circles by lat/lng (`?lat=&lng=&radius=25`) |
| POST | `/api/circles/:id/join` | ✓ | Join a circle (capacity checked) |
| GET | `/api/notifications` | ✓ | Get notifications (`?unread=true`) |
| GET | `/api/roadmap/generate` | ✓ | AI roadmap (`?goal=`) |

---

## Credit & Trust Score Logic

### SkillCredits
- New users start with **10 credits**
- Sending a swap request **locks** credits in escrow
- Credits are **released to the mentor** when a session is completed
- Cancellations **refund** credits to the sender
- All transactions are atomic (MySQL transactions with row locking)

### Trust Score (starts at 50)
| Event | Change |
|-------|--------|
| Session completed | +5 |
| High feedback (4-5 ★) | +3 |
| Low feedback (1-2 ★) | -4 |
| No-show | -10 |
| Cancellation <24h | -6 |

**Tiers:** Bronze (0–40) · Silver (41–65) · Gold (66–85) · Mentor Elite (86–100)

---

## Security

- Passwords hashed with **bcrypt** (cost 12)
- JWT access tokens expire in **15 minutes**; refresh tokens in **7 days**
- Token version field invalidates all JWTs on password change
- All queries use **prepared statements** (no raw SQL concatenation)
- CORS restricted to configured `FRONTEND_URL`
- Security headers set via `.htaccess`

---

## Requirements

- PHP 8.1+
- MySQL 8.0+
- Apache with `mod_rewrite` (or Nginx equivalent)
- PHP extensions: `pdo`, `pdo_mysql`, `json`, `mbstring`
