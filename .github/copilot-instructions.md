# Kris Kringle Gift Exchange - AI Agent Instructions

## Project Overview
Secret Santa web app with passwordless magic-link authentication. Backend (Express + SQLite) on port 3000, frontend (React + Vite) on port 5173.

**Stack**: Express.js (CommonJS) + better-sqlite3 + React 18 + Vite + Tailwind CSS  
**Node**: >=18.0.0 required  
**Key Dependencies**: Puppeteer (link previews), nodemailer (Office 365), multer (Excel upload), XLSX (parsing)

## Initial Setup

### Environment Configuration
Backend `.env` (copy from `.env.example`):
```bash
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
SMTP_USER=<Office 365 email>
SMTP_PASS=<app password>
FRONTEND_URL=http://localhost:5173  # MUST match actual frontend port
```

Frontend `.env`:
```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

Database auto-initializes on first backend start (`database.sqlite` created in `backend/`). Check for "Database ready" + "Email server ready" logs before testing.

## Critical Architecture Decisions

### Authentication Flow
**Magic link only** - no passwords. Flow: `POST /api/auth/magic-link` → email with token → `GET /auth/callback?token=X&email=Y` → JWT in localStorage as `kris-kringle-token`. Frontend `AuthContext` auto-loads session on mount via `fetchProfile()`.

Session validation uses dual-check: JWT signature verification + `sessions` table lookup. Backend middleware (`auth.js`) checks both before allowing access. Logout invalidates session in DB.

### Database Schema (better-sqlite3)
- `employees`: self-referential `recipient_id` foreign key for Secret Santa assignments. Supports `is_admin` and `is_super_admin` flags
- `wishlists`: stores items as JSON string. Each item has `{ description, link }` structure (max 3 items, description ≤120 chars)
- `magic_links`: one-time tokens with expiry, marked `used` after redemption
- `sessions`: JWT tracking for logout invalidation (queries use `expires_at > datetime()` for active sessions)
- `settings`: key-value store for runtime config (`assignment_completed`, `wishlist_deadline`, `show_all_wishlists`)

**Foreign keys are ON** - `db.pragma('foreign_keys = ON')` in `database.js` enables cascading deletes.

### CORS Configuration Gotcha
**Backend `.env` MUST match frontend port** - `FRONTEND_URL=http://localhost:5173` controls CORS origin. If frontend port changes (Vite auto-switches to 5174 if 5173 busy), magic links break silently. Check `netstat -ano | findstr :5173` and update `.env` + restart backend.

## Development Workflow

### Starting Services
**Use `scripts/restart-services.ps1`** - starts both backend/frontend as background processes with proper port management. Manual start causes terminal conflicts.
```powershell
.\scripts\restart-services.ps1  # Run from project root
```
Backend: `backend/npm run dev` (nodemon on port 3000)  
Frontend: `frontend/npm run dev` (Vite on port 5173)

Script auto-kills existing processes on ports 3000/5173 before starting fresh instances. Uses `Start-Process` with `-WindowStyle Hidden` for background execution.

**Manual start** (if script fails):
```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

### Testing Magic Link Flow
Use `test-magic-link.ps1` in project root:
```powershell
.\test-magic-link.ps1  # POSTs to /api/auth/magic-link with test employee
```
Check backend terminal for "Email server ready" before testing. Test employees seeded in DB: `charles.daitol@infosoft.com.ph` (admin), `charles.daitol+arbill@infosoft.com.ph` (employee).

Node testing script also available: 
```bash
node backend/scripts/testMagicLink.js <email>
```

### Database Inspection Scripts
Backend scripts for debugging (run with `node backend/scripts/<script>.js`):
- `listEmployees.js` - view all employees + assignments
- `viewAssignments.js` - show Secret Santa pairings
- `viewWishlistInDB.js` - dump wishlist JSON for employee
- `listSessions.js` - active JWT sessions
- `testPreviewEndpoint.js` - runs Puppeteer preview service against a sample product link and logs extracted data

### Environment Setup
Backend requires **SMTP credentials** in `.env` (Office 365 defaults). Email service uses nodemailer with `requireTLS: true` and IPv4-only (`family: 4`) for stability. Transporter runs `.verify()` on startup - look for "Email server ready" log.

### Excel Employee Import Format
Admin can upload Excel files with employees via `/api/admin/employees/upload`. Expected columns (case-insensitive):
- `name` or `Name` - Employee full name
- `email` or `Email` - Unique email address
- `is_admin` or `isAdmin` (optional) - Boolean for admin privileges
- `is_super_admin` or `isSuperAdmin` (optional) - Boolean for super admin

Service in `excelService.js` uses `multer` for file handling, `xlsx` for parsing. Files auto-cleaned after processing.

## Code Patterns

### Backend Route Structure
Routes are verb-specific files (`.routes.js`), not RESTful:
- `auth.routes.js`: `/magic-link`, `/callback`, `/logout`
- `admin.routes.js`: `/employees/upload` (Excel bulk import), `/assignments/generate`, `/assignments/notify`, `/settings` (get/put)
- `employee.routes.js`: `/me` (profile), `/recipient` (assigned person), `/wishlists` (all employees' lists when enabled)
- `wishlist.routes.js`: `/` (get/post), `/confirm` (legacy endpoint, no longer used)

All admin routes protected by `authMiddleware` checking JWT + `is_admin`/`is_super_admin` flags. Excel upload uses `multer` middleware, files auto-cleaned after parsing.

### Link Preview Architecture
- Route: `backend/src/routes/preview.routes.js` exposes `GET /api/preview/link-preview?url=`
- Service: `backend/src/services/linkPreviewService.js` spins up a shared Puppeteer browser, caches results for 30 min, and extracts meta tags or falls back to a JPEG screenshot encoded as base64
- Response payload: `{ image, title, description, domain, isScreenshot, cached }`; `isScreenshot=true` indicates screenshot fallback, `cached=true` denotes cache hit
- Puppeteer launch args already include `--no-sandbox`; do **not** spawn additional browsers per request—reuse `fetchLinkPreview`
- Scripts like `scripts/testPreviewEndpoint.js` rely on this service; ensure backend has network access for external product pages

### Wishlist Data Structure
Simplified since initial design - admin suggestion flow removed. Format in DB:
```javascript
{
  items: JSON.stringify([
    { description: "Item name", link: "https://..." },
    { description: "Item 2", link: "" }
  ]),
  is_confirmed: 1,  // always 1 on save
  pending_items: null  // deprecated field
}
```
Frontend normalizes legacy string-format items to object format on load.

### Frontend API Layer
`services/api.js` exports named functions, NOT a class:
```javascript
import { requestMagicLink, fetchProfile } from '../services/api.js';
// Axios instance auto-adds JWT from localStorage to Authorization header
```
All requests go through single `axios.create()` instance with `VITE_API_BASE_URL` base. Interceptor adds `Bearer ${token}` automatically.

### Component Structure
- **Protected routes**: `<ProtectedRoute adminOnly>` wraps admin components, redirects non-admin to `/portal`
- **Layout wrapper**: `PortalLayout.jsx` provides mesh-gradient background + `ToastContainer` for all pages
- **Dashboard split**: `EmployeeDashboard.jsx` (wishlist CRUD + view recipient) vs `AdminPanel.jsx` (employee upload, assignment generation, settings)
- **Reusable primitives**: `Button.jsx`, `Modal.jsx`, `LoadingSpinner.jsx` in `components/common/`
- **Link preview tooltip**: `components/common/LinkPreviewTooltip.jsx` fetches preview once per URL, caches responses (in-memory `tooltipCache`), shows “Live Screenshot”/“Cached” badges, and gracefully falls back to gift icon

### Assignment Generation Logic
Random shuffle algorithm in `assignmentService.js` creates circular chain: each employee → next in shuffled array. Last person wraps to first. Atomic transaction updates all `recipient_id` fields + sets `assignment_completed` setting to '1'.

## Styling System

### Tailwind Design Tokens
Premium fintech aesthetic with custom utilities in `index.css`:
- `.card-surface`: white card with soft shadow and border (replaces older `.card-premium`)
- `.infosoft-gradient`: red gradient (Infosoft brand colors: FF0000 / DC0000 / 8B0000)
- `.heading-gradient`: text gradient for emphasis (red scale)
- Brand colors: `brand-{50-900}` scale (originally blue, check `tailwind.config.js` for current palette)

**PostCSS config required** - `frontend/postcss.config.js` must exist or Tailwind won't process. If UI shows plain white background, check this file exists.

### Animation Conventions
Use predefined keyframes: `animate-fade-in-up`, `animate-pulse-slow`. Mesh gradient backgrounds applied via custom gradient utilities in `PortalLayout.jsx`. Scroll animations use `useIntersectionObserver` hook.

## Common Issues

### "Unable to send magic link"
1. Check backend terminal shows "Email server ready" (SMTP initialized)
2. Verify `FRONTEND_URL` in `backend/.env` matches actual frontend port
3. Test with `curl http://localhost:3000/api/health` - should return `{"status":"ok"}`

### Port conflicts
Backend fails with `EADDRINUSE:3000` → find PID: `netstat -ano | findstr :3000`, kill: `taskkill /F /PID <pid>`

### Frontend shows unstyled text
PostCSS not processing Tailwind. Verify `frontend/postcss.config.js` exists with `tailwindcss` and `autoprefixer` plugins. Restart Vite after creating.

## Production Deployment

Backend serves static frontend in production mode:
```javascript
// backend/src/server.js
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => res.sendFile('index.html'));
}
```

Build commands:
```bash
cd frontend && npm run build  # Creates frontend/dist/
cd backend && npm start       # Serves frontend + API on single port
```

## Key Files Reference
- `backend/src/config/database.js`: Schema definitions, see `initializeDatabase()` for full DDL
- `backend/src/services/emailService.js`: Magic link email templates with SMTP retry logic
- `backend/src/config/email.js`: Nodemailer transporter with Office 365 TLS config + verification on startup
- `backend/src/services/linkPreviewService.js`: Puppeteer-powered metadata/screenshot fetcher with caching
- `backend/src/routes/preview.routes.js`: Express endpoint wiring the link preview service
- `frontend/src/context/AuthContext.jsx`: Session management, exposes `{ user, logout }` hook
- `frontend/src/services/api.js`: Axios instance with JWT interceptor, all API functions exported here
- `frontend/src/components/common/LinkPreviewTooltip.jsx`: Frontend hover UI consuming preview API with local cache badges
- `tailwind.config.js`: Full design system tokens (shadows, animations, brand colors)
