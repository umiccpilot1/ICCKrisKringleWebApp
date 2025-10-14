# Kris Kringle Gift Exchange - AI Agent Instructions

## Project Overview
Secret Santa web app with passwordless magic-link authentication. Backend (Express + SQLite) on port 3000, frontend (React + Vite) on port 5173.

## Critical Architecture Decisions

### Authentication Flow
**Magic link only** - no passwords. Flow: `POST /api/auth/magic-link` → email with token → `GET /auth/callback?token=X&email=Y` → JWT in localStorage as `kris-kringle-token`. Frontend `AuthContext` auto-loads session on mount via `fetchProfile()`.

### Database Schema (better-sqlite3)
- `employees`: self-referential `recipient_id` foreign key for Secret Santa assignments
- `wishlists`: pending vs confirmed items pattern - admins can suggest changes via `pending_items`, employees must confirm
- `magic_links`: one-time tokens with expiry, marked `used` after redemption
- `sessions`: JWT tracking for logout invalidation

### CORS Configuration Gotcha
**Backend `.env` MUST match frontend port** - `FRONTEND_URL=http://localhost:5173` controls CORS origin. If frontend port changes (Vite auto-switches to 5174 if 5173 busy), magic links break silently. Check `netstat -ano | findstr :5173` and update `.env` + restart backend.

## Development Workflow

### Starting Services
**Use `scripts/restart-services.ps1`** - starts both backend/frontend as background processes. Manual start causes terminal conflicts.
```powershell
cd scripts
.\restart-services.ps1
```
Backend: `backend/npm run dev` (nodemon on port 3000)  
Frontend: `frontend/npm run dev` (Vite on port 5173)

### Testing Magic Link Flow
Use `test-magic-link.ps1` in project root:
```powershell
.\test-magic-link.ps1  # POSTs to /api/auth/magic-link with test employee
```
Check backend terminal for "Email server ready" before testing. Test employees seeded in DB: `charles.daitol@infosoft.com.ph` (admin), `charles.daitol+arbill@infosoft.com.ph` (employee).

### Environment Setup
Backend requires **SMTP credentials** in `.env` (Office 365 defaults). Email service uses nodemailer with `requireTLS: true` and IPv4-only (`family: 4`) for stability.

## Code Patterns

### Backend Route Structure
Routes are verb-specific files (`.routes.js`), not RESTful:
- `auth.routes.js`: `/magic-link`, `/callback`, `/logout`
- `admin.routes.js`: `/employees/upload` (Excel bulk import), `/assignments/generate`, `/assignments/notify`
- `wishlist.routes.js`: `/` (get/post), `/confirm` (employee accepts admin suggestions)

All admin routes protected by `authMiddleware` checking JWT + `is_admin`/`is_super_admin` flags.

### Frontend API Layer
`services/api.js` exports named functions, NOT a class:
```javascript
import { requestMagicLink, fetchProfile } from '../services/api.js';
// Axios instance auto-adds JWT from localStorage to Authorization header
```

### Component Structure
- **Protected routes**: `<ProtectedRoute adminOnly>` wraps admin components, redirects non-admin to `/`
- **Layout wrapper**: `Layout.jsx` provides mesh-gradient background + `ToastContainer` for all pages
- **Dashboard split**: `EmployeeDashboard.jsx` (wishlist CRUD + view recipient) vs `AdminPanel.jsx` (employee upload, assignment generation)

## Styling System

### Tailwind Design Tokens
Premium fintech aesthetic with custom utilities in `index.css`:
- `.btn-primary`: gradient background with shadow-lg, hover lift effect
- `.card-premium`: white card with soft shadow and border
- `.input-premium`: focus:ring-4 with brand color rings
- Brand colors: `brand-{50-900}` (blue scale from `#eff6ff` to `#1e3a8a`)

**PostCSS config required** - `frontend/postcss.config.js` must exist or Tailwind won't process. If UI shows plain white background, check this file exists.

### Animation Conventions
Use predefined keyframes: `animate-fade-in-up`, `animate-pulse-slow`. Mesh gradient backgrounds applied via `bg-mesh-gradient` + `bg-gradient-radial` layering in `Layout.jsx`.

## Common Issues

### "Unable to send magic link"
1. Check backend terminal shows "Email server ready" (SMTP initialized)
2. Verify `FRONTEND_URL` in `backend/.env` matches actual frontend port
3. Test with `curl http://localhost:3000/api/health` - should return `{"status":"ok"}`

### Port conflicts
Backend fails with `EADDRINUSE:3000` → find PID: `netstat -ano | findstr :3000`, kill: `taskkill /F /PID <pid>`

### Frontend shows unstyled text
PostCSS not processing Tailwind. Verify `frontend/postcss.config.js` exists with `tailwindcss` and `autoprefixer` plugins. Restart Vite after creating.

## Key Files Reference
- `backend/src/config/database.js`: Schema definitions, see `initializeDatabase()` for full DDL
- `backend/src/services/emailService.js`: Magic link email templates with SMTP retry logic
- `frontend/src/context/AuthContext.jsx`: Session management, exposes `{ user, logout }` hook
- `tailwind.config.js`: Full design system tokens (shadows, animations, brand colors)
