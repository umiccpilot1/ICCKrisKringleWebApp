# Setup Guide for New Computer

Complete step-by-step instructions to get the Kris Kringle app running on a fresh computer.

## Prerequisites

### 1. Install Node.js
- **Required**: Node.js version >=18.0.0
- Download from: https://nodejs.org/
- Verify installation:
  ```powershell
  node --version  # Should show v18.x.x or higher
  npm --version   # Should show 8.x.x or higher
  ```

### 2. Install Git
- Download from: https://git-scm.com/
- Verify installation:
  ```powershell
  git --version
  ```

### 3. Get Office 365 SMTP Credentials
- You'll need:
  - Email address
  - App password (not regular password)
- Generate app password: https://account.microsoft.com/security

---

## Installation Steps

### Step 1: Clone the Repository

```powershell
cd C:\Projects  # Or wherever you want the project
git clone https://github.com/umiccpilot1/ICCKrisKringleWebApp.git
cd ICCKrisKringleWebApp
```

---

### Step 2: Backend Setup

#### 2.1 Install Backend Dependencies
```powershell
cd backend
npm install
```

This will install all dependencies including:
- Express, SQLite, bcrypt, bcryptjs
- Puppeteer (includes Chrome browser)
- Nodemailer, JWT, multer, xlsx

**Note**: Puppeteer download may take a few minutes (~300MB Chrome binary)

#### 2.2 Configure Backend Environment
```powershell
# Copy the example file
cp .env.example .env

# Edit .env with your credentials
notepad .env
```

**Required `.env` configuration:**
```bash
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173  # IMPORTANT: Must match frontend port!

# Database (auto-created on first run)
DATABASE_PATH=./database.sqlite

# Generate a secure JWT secret:
# Run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_generated_secret_here

# Office 365 SMTP Settings
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your.email@infosoft.com.ph
SMTP_PASS=your_app_password_here
SMTP_FROM="Kris Kringle <your.email@infosoft.com.ph>"

# Magic Link Configuration
MAGIC_LINK_EXPIRY_HOURS=4
SESSION_EXPIRY_DAYS=7
```

#### 2.3 Generate JWT Secret
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as `JWT_SECRET` in your `.env` file.

#### 2.4 Install Puppeteer Chrome (if needed)
If Puppeteer didn't auto-install Chrome:
```powershell
npx puppeteer browsers install chrome
```

#### 2.5 Test Backend
```powershell
npm run dev
```

**Expected output:**
```
Server running on port 3000
Database ready: employees, wishlists, magic_links, sessions, settings
Email server ready
```

If you see these messages, backend is working! Keep it running.

---

### Step 3: Frontend Setup

Open a **new terminal** (keep backend running):

#### 3.1 Install Frontend Dependencies
```powershell
cd C:\Projects\ICCKrisKringleWebApp\frontend  # Adjust path as needed
npm install
```

This installs React 18, Vite, Tailwind CSS, and other frontend dependencies.

#### 3.2 Configure Frontend Environment
```powershell
# Copy the example file
cp .env.example .env

# Edit .env
notepad .env
```

**Required `.env` configuration:**
```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

#### 3.3 Start Frontend
```powershell
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### Step 4: Verify Installation

#### 4.1 Check Ports
Both servers should be running:
```powershell
netstat -ano | findstr ":3000 :5173"
```

You should see:
- Port 3000 (backend)
- Port 5173 (frontend)

#### 4.2 Test Application
1. Open browser: http://localhost:5173
2. You should see the login page
3. Enter any email and click "Send Magic Link"
4. Check backend terminal for email sending confirmation

#### 4.3 Test Backend API
```powershell
curl http://localhost:3000/api/health
```
Should return: `{"status":"ok"}`

---

## Alternative: Use Restart Script

After initial setup, use the convenience script:

```powershell
cd C:\Projects\ICCKrisKringleWebApp
.\scripts\restart-services.ps1
```

This automatically:
- Kills any existing processes on ports 3000/5173
- Starts backend and frontend in background
- Shows process IDs for monitoring

---

## Database Initialization

The SQLite database (`backend/database.sqlite`) is **auto-created** on first backend start.

### Initial Schema
Tables created automatically:
- `employees` - User accounts with admin flags
- `wishlists` - Gift preferences (JSON format)
- `magic_links` - Passwordless authentication tokens
- `sessions` - JWT session tracking
- `settings` - App configuration (deadlines, visibility)

### Add Initial Admin
After backend starts, run:
```powershell
cd backend
node scripts/resetDatabase.js  # Creates 2 default admins
```

Or manually create admin via API/database.

---

## Troubleshooting

### Backend won't start
**Error**: `Cannot find module 'bcryptjs'`
- **Fix**: `cd backend && npm install bcryptjs`

**Error**: `Error: Cannot find Chrome`
- **Fix**: `npx puppeteer browsers install chrome`

**Error**: `Email server not ready`
- **Fix**: Check SMTP credentials in `backend/.env`
- Verify Office 365 app password (not regular password)

### Frontend shows white screen
**Issue**: Tailwind CSS not loading
- **Fix**: Verify `frontend/postcss.config.js` exists
- Restart Vite: Kill terminal and run `npm run dev` again

### Magic links don't work
**Issue**: CORS error or "Invalid token"
- **Fix**: Verify `FRONTEND_URL` in `backend/.env` matches actual frontend port
- Default: `http://localhost:5173`
- If Vite uses port 5174, update `.env` and restart backend

### Port conflicts
**Error**: `EADDRINUSE: address already in use :::3000`
- **Fix**: 
  ```powershell
  # Find process using port
  netstat -ano | findstr :3000
  
  # Kill process (replace <PID> with actual number)
  taskkill /F /PID <PID>
  ```

---

## Post-Installation

### Upload Employees
1. Login as admin
2. Go to Admin Panel
3. Click "Upload Employees"
4. Use Excel file with columns: `name`, `email`, `is_admin` (optional)

### Configure Settings
- Set wishlist deadline
- Enable/disable public wishlist viewing
- Configure assignment notifications

### Employee Photos
Employee photos go in: `frontend/public/images/employees/`
- Format: `LASTNAME.png` (all caps)
- Auto-matched by last name from database
- Fallback: Initials avatar if photo not found

---

## Production Deployment

### Build Frontend
```powershell
cd frontend
npm run build  # Creates frontend/dist/
```

### Start Production Server
```powershell
cd backend
$env:NODE_ENV="production"
npm start
```

Backend serves both API and static frontend on port 3000.

---

## Key Files Reference

### Configuration Files
- `backend/.env` - Backend environment variables (SMTP, JWT, CORS)
- `frontend/.env` - Frontend environment variables (API URL)
- `backend/package.json` - Backend dependencies
- `frontend/package.json` - Frontend dependencies
- `frontend/tailwind.config.js` - UI design tokens
- `frontend/postcss.config.js` - CSS processing

### Documentation
- `.github/copilot-instructions.md` - Detailed architecture docs
- `CHRISTMAS_EMAIL_IMPLEMENTATION.md` - Email feature specs
- `QUICK_START_TESTING.md` - Testing guide
- `EMAIL_VISUAL_REFERENCE.md` - Email design reference

### Scripts
- `scripts/restart-services.ps1` - Start both servers
- `backend/scripts/resetDatabase.js` - Reset DB with admin accounts
- `backend/scripts/testMagicLink.js` - Test authentication
- `backend/scripts/testAssignmentEmail.js` - Test email sending

---

## System Requirements

### Minimum
- **OS**: Windows 10/11, macOS 10.15+, Linux
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 500MB for dependencies + Chrome

### Recommended
- **OS**: Windows 11
- **CPU**: 4 cores
- **RAM**: 8GB
- **Disk**: 1GB free space
- **Network**: Stable internet for SMTP

---

## Getting Help

### Check Logs
- Backend: Terminal running `npm run dev` in backend folder
- Frontend: Terminal running `npm run dev` in frontend folder
- Browser: F12 → Console tab for frontend errors

### Common Log Messages
✅ **Good**:
- "Server running on port 3000"
- "Database ready"
- "Email server ready"
- "VITE ready in XXX ms"

❌ **Bad**:
- "Cannot find module" → Run `npm install`
- "EADDRINUSE" → Port conflict, kill process
- "SMTP error" → Check email credentials
- "CORS error" → Check FRONTEND_URL matches

---

## Quick Reference

### Start Development
```powershell
# Option 1: Use script (recommended)
.\scripts\restart-services.ps1

# Option 2: Manual
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
cd frontend && npm run dev
```

### URLs
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Health Check: http://localhost:3000/api/health

### Default Ports
- Backend: 3000
- Frontend: 5173

---

**Setup Complete!** 🎉

You now have a fully functional Kris Kringle app running locally.

For development workflow and architecture details, see `.github/copilot-instructions.md`.
